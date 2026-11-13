/**
 * pipelineTaskBoard —— 任务板生成器的契约测试
 * =============================================
 * 覆盖 W3 拉取式队列（.tasks/queue/）与 W0/W1/W2 旧卡（.tasks/ 顶层）双轨，
 * 以及「坏输入必须明确报错、好输入不得误报」的两面。
 *
 * 所有 fixture 落在 os.tmpdir()，不碰仓库里的真实任务卡。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  BEGIN, END, normalizeStatus, normalizeId, extractDepIds,
  collectTasks, readCompletions, validateTasks, effectiveStatus,
  renderTable, renderBlock,
} from '../scripts/lib/task-board.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLI = path.join(ROOT, 'scripts/gen-task-board.mjs')

let seq = 0
function makeRoot(files = {}, board = '') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `wb-task-board-${seq++}-`))
  fs.mkdirSync(path.join(root, '.tasks', 'queue'), { recursive: true })
  fs.mkdirSync(path.join(root, '.agent-assignments'), { recursive: true })
  fs.writeFileSync(path.join(root, '.agent-assignments', 'ACTIVE_TASKS.md'), board)
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(root, rel)
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, content)
  }
  return root
}
const card = (id, extra = '') => `# ${id} · 示例任务\n\n- size: S\n- status: ready\n- claim: C2\n- owner: —\n- depends: []\n${extra}\n\n## 背景\n测试用。\n`
const runCli = (root, ...args) => spawnSync(process.execPath, [CLI, '--root', root, ...args], {
  cwd: ROOT, encoding: 'utf8',
})

/* ==================== 状态映射与 ID ==================== */
test('中英状态统一映射到 ready/doing/blocked/done，未知值返回 null', () => {
  assert.equal(normalizeStatus('ready'), 'ready')
  assert.equal(normalizeStatus('doing'), 'doing')
  assert.equal(normalizeStatus('blocked'), 'blocked')
  assert.equal(normalizeStatus('done'), 'done')
  assert.equal(normalizeStatus('Active'), 'doing')
  assert.equal(normalizeStatus('Review'), 'doing')
  assert.equal(normalizeStatus('Blocked'), 'blocked')
  assert.equal(normalizeStatus('Merged'), 'done')
  assert.equal(normalizeStatus('已完成'), 'done')
  assert.equal(normalizeStatus(' Mars '), null)
  assert.equal(normalizeId('q-001'), 'Q-001')
})

test('依赖文字里的任务号可被解析，纯文字依赖明确判为无法解析', () => {
  assert.deepEqual(extractDepIds('W2-001 主壳改造合入 main').ids, ['W2-001'])
  assert.deepEqual(extractDepIds('Q-001').ids, ['Q-001'])
  assert.deepEqual(extractDepIds('等真机到位').ids, [])
})

/* ==================== 事实源、模板排除、历史保留 ==================== */
test('queue 为事实源，旧卡保留为历史，ROADMAP/TEMPLATE 不被当任务', () => {
  const root = makeRoot({
    '.tasks/queue/Q-001.md': card('Q-001'),
    '.tasks/queue/TEMPLATE.md': '# Q-XXX · <一句话说清要做什么>\n\n- size: S\n- status: ready\n',
    '.tasks/ROADMAP.md': '# 路线图 W2 → W4（一次交代清楚）\n\n- 状态：Active\n',
    '.tasks/W2-001-wb-settings-shell.md': '# W2-001 · 主壳自注册\n\n- 类型：常规任务\n- 状态：Merged\n- 簇：C2\n- Owner：Workbuddy\n',
  })
  const tasks = collectTasks(root)
  const ids = tasks.map((t) => t.id)
  assert.ok(ids.includes('Q-001'), 'queue 卡必须进入任务板')
  assert.ok(ids.includes('W2-001'), '旧卡作为历史记录保留')
  assert.ok(!ids.some((i) => /ROADMAP|TEMPLATE|XXX/i.test(i)), '路线图/模板不能当 Active 任务')

  const out = renderTable(tasks)
  assert.match(out, /队列（事实源/)
  assert.match(out, /历史任务/)
  assert.doesNotMatch(out, /路线图 W2/)
  assert.doesNotMatch(out, /一句话说清/)
  assert.equal(tasks.find((t) => t.source === 'queue').status, 'ready')
  assert.equal(tasks.find((t) => t.id === 'W2-001').status, 'done')
})

test('完成记录覆盖陈旧卡片：Q-001 不再显示 ready，W2-001 依赖显示 ✓', () => {
  const board = [
    '| Status | Agent | Task |',
    '| --- | --- | --- |',
    '| Merged | Workbuddy | W2-001：Settings 主壳 glob 自注册 + S2 三页迁出（合并自 fix/q-001-flaky，含 CI flaky 修复） |',
  ].join('\n')
  const root = makeRoot({
    '.tasks/queue/Q-001.md': card('Q-001'),
    '.tasks/queue/Q-002.md': card('Q-002', '- status: blocked\n- depends: [W2-001 主壳改造合入 main]'),
  }, board)
  const tasks = collectTasks(root)
  const completions = readCompletions(root)
  assert.ok(completions.has('Q-001'), 'fix/q-001-flaky 应被识别为 Q-001 的完成证据')
  assert.ok(completions.has('W2-001'), 'Merged 行里的 W2-001 应被识别')

  const q001 = tasks.find((t) => t.id === 'Q-001')
  assert.equal(effectiveStatus(q001, completions), 'done')
  const out = renderTable(tasks, { completions })
  assert.match(out, /Q-001 \| done（完成记录，卡片待更新）/)
  assert.doesNotMatch(out, /Q-001 \| ready/)
  assert.match(out, /Q-002 \| blocked[^\n]*W2-001 ✓/, '依赖完成必须可正确展示')
  assert.deepEqual(validateTasks(tasks, { completions }), [], '完成证据不应被误报成坏输入')
})

test('队列卡完整显示 owner / status / claim，而不是空列', () => {
  const root = makeRoot({
    '.tasks/queue/Q-003.md': '# Q-003 · 盘点 verify 脚本\n\n- size: M\n- status: doing\n- claim: C0-infra\n- owner: workbuddy\n- depends: []\n',
  })
  const out = renderTable(collectTasks(root))
  assert.match(out, /\| Q-003 \| doing \| Q-003 · 盘点 verify 脚本 \| workbuddy \| C0-infra \|/)
  assert.match(out, /\| ID \| Status \| 任务 \| Owner \| Claim \| Depends \| 单子 \|/)
})

/* ==================== 坏输入必须明确报错 ==================== */
test('重复 ID 报错（同来源不同文件）', () => {
  const root = makeRoot({
    '.tasks/queue/Q-001.md': card('Q-001'),
    '.tasks/queue/Q-001-copy.md': card('Q-001'),
  })
  const problems = validateTasks(collectTasks(root))
  assert.ok(problems.some((p) => p.includes('重复 ID Q-001')), problems.join('\n'))
})

test('doing 无 owner 报错，填了 owner 就通过', () => {
  const bad = makeRoot({ '.tasks/queue/Q-001.md': card('Q-001', '- status: doing\n- owner: —') })
  assert.ok(validateTasks(collectTasks(bad)).some((p) => p.includes('doing 状态缺少 owner')))
  const good = makeRoot({ '.tasks/queue/Q-001.md': card('Q-001', '- status: doing\n- owner: workbuddy') })
  assert.deepEqual(validateTasks(collectTasks(good)), [])
})

test('依赖缺失与依赖文字无法解析都明确报错', () => {
  const missing = makeRoot({ '.tasks/queue/Q-002.md': card('Q-002', '- depends: [Q-999]') })
  assert.ok(validateTasks(collectTasks(missing)).some((p) => p.includes('依赖缺失，找不到 Q-999')))
  const unparsable = makeRoot({ '.tasks/queue/Q-002.md': card('Q-002', '- depends: [等真机到位]') })
  assert.ok(validateTasks(collectTasks(unparsable)).some((p) => p.includes('无法解析出任务 ID')))
})

test('依赖未完成却 ready 报错；依赖完成后 ready 通过', () => {
  const pending = makeRoot({
    '.tasks/queue/Q-001.md': card('Q-001', '- status: doing\n- owner: dsh'),
    '.tasks/queue/Q-002.md': card('Q-002', '- depends: [Q-001]'),
  })
  assert.ok(validateTasks(collectTasks(pending)).some((p) => p.includes('状态为 ready 但依赖未完成')))

  const done = makeRoot({
    '.tasks/queue/Q-001.md': card('Q-001', '- status: done'),
    '.tasks/queue/Q-002.md': card('Q-002', '- depends: [Q-001]'),
  })
  assert.deepEqual(validateTasks(collectTasks(done)), [])
})

test('同文件互斥冲突报错，不同文件绝不误报', () => {
  const conflict = makeRoot({
    '.tasks/queue/Q-001.md': card('Q-001', '- status: doing\n- owner: wb\n- files: [scripts/a.mjs, scripts/b.mjs]'),
    '.tasks/queue/Q-002.md': card('Q-002', '- status: doing\n- owner: ag\n- files: [scripts/b.mjs]'),
  })
  const cp = validateTasks(collectTasks(conflict))
  assert.ok(cp.some((p) => p.includes('文件互斥冲突') && p.includes('scripts/b.mjs')), cp.join('\n'))

  const separate = makeRoot({
    '.tasks/queue/Q-001.md': card('Q-001', '- status: doing\n- owner: wb\n- files: [scripts/a.mjs]'),
    '.tasks/queue/Q-002.md': card('Q-002', '- status: doing\n- owner: ag\n- files: [scripts/b.mjs]'),
  })
  assert.deepEqual(validateTasks(collectTasks(separate)), [], '不同文件不能被误报成冲突')

  const finished = makeRoot({
    '.tasks/queue/Q-001.md': card('Q-001', '- status: done\n- files: [scripts/a.mjs]'),
    '.tasks/queue/Q-002.md': card('Q-002', '- status: doing\n- owner: ag\n- files: [scripts/a.mjs]'),
  })
  assert.deepEqual(validateTasks(collectTasks(finished)), [], '已完成卡不再占用文件')
})

test('未知状态明确报错', () => {
  const root = makeRoot({ '.tasks/queue/Q-001.md': card('Q-001', '- status: 飘着') })
  assert.ok(validateTasks(collectTasks(root)).some((p) => p.includes('未知状态')))
})

/* ==================== CLI 与安全生成标记 ==================== */
test('CLI 默认模式遇坏输入 exit 1，且 stderr 点名问题', () => {
  const root = makeRoot({ '.tasks/queue/Q-001.md': card('Q-001', '- status: doing') })
  const r = runCli(root)
  assert.equal(r.status, 1)
  assert.match(r.stderr, /doing 状态缺少 owner/)
  assert.match(r.stdout, /GENERATED:TASKS:BEGIN/, '即使报错也应打印任务板便于诊断')
})

test('--write 无 GENERATED 标记时拒绝覆盖，文件逐字不动', () => {
  const board = '# 手工表\n\n| 历史 | 记录 |\n| --- | --- |\n| 1 | 保留 |\n'
  const root = makeRoot({ '.tasks/queue/Q-001.md': card('Q-001') }, board)
  const r = runCli(root, '--write')
  assert.equal(r.status, 2)
  assert.match(r.stderr, /拒绝整文件覆盖/)
  assert.equal(fs.readFileSync(path.join(root, '.agent-assignments/ACTIVE_TASKS.md'), 'utf8'), board)
})

test('--write 只替换 GENERATED 区块，手工历史逐字保留', () => {
  const before = '# 手工表\n\n| 历史 | 记录 |\n| --- | --- |\n| 1 | 保留 |\n\n'
  const after = '\n\n| 尾部 | 记录 |\n| --- | --- |\n| 2 | 也保留 |\n'
  const board = `${before}${BEGIN}\n旧内容\n${END}${after}`
  const root = makeRoot({ '.tasks/queue/Q-001.md': card('Q-001') }, board)
  const r = runCli(root, '--write')
  assert.equal(r.status, 0, r.stderr)
  const next = fs.readFileSync(path.join(root, '.agent-assignments/ACTIVE_TASKS.md'), 'utf8')
  assert.ok(next.startsWith(before), '标记前的手工表必须逐字保留')
  assert.ok(next.endsWith(after), '标记后的手工表必须逐字保留')
  assert.match(next, /Q-001/)
  assert.doesNotMatch(next, /旧内容/)
  assert.equal((next.match(new RegExp(BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length, 1)
})

test('--write 遇坏输入时拒绝落盘', () => {
  const board = `${BEGIN}\n旧内容\n${END}\n`
  const root = makeRoot({ '.tasks/queue/Q-001.md': card('Q-001', '- status: doing') }, board)
  const r = runCli(root, '--write')
  assert.equal(r.status, 1)
  assert.match(r.stderr, /拒绝写入/)
  assert.equal(fs.readFileSync(path.join(root, '.agent-assignments/ACTIVE_TASKS.md'), 'utf8'), board)
})

test('renderBlock 始终带完整 GENERATED 标记', () => {
  const block = renderBlock([])
  assert.ok(block.startsWith(BEGIN))
  assert.ok(block.trimEnd().endsWith(END))
})

test('真实仓库数据当前零问题（Gtask 不会假红）', () => {
  const tasks = collectTasks(ROOT)
  const completions = readCompletions(ROOT)
  assert.ok(tasks.some((t) => t.source === 'queue'), '必须扫到队列卡')
  assert.ok(tasks.some((t) => t.source === 'legacy'), '必须保留历史卡')
  assert.deepEqual(validateTasks(tasks, { completions }), [])
  const out = renderTable(tasks, { completions })
  assert.doesNotMatch(out, /ROADMAP|TEMPLATE/, 'ROADMAP/TEMPLATE 不能被当 Active 任务')
  assert.match(out, /Q-001 \| done/, 'Q-001 已完成不能仍显示 ready')
  assert.match(out, /W2-001 ✓/, 'Q-002 的依赖完成要展示出来')
})
