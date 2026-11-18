#!/usr/bin/env node
/**
 * card-gen —— 从契约生成任务卡（消灭"文字卡"通道）
 * ================================================
 * 为什么需要它：
 *   SET-SYS-01 的卡写得很细（10 行 4 卡 1 组头），但文字描述的是「人以为的样子」，
 *   不是「真机的样子」。执行者只能拿文字去想象 → 凭空实现 → 人逐页返工。
 *   契约是唯一同时可读（人）与可绑（机器）的载体，所以卡必须从契约生成。
 *
 * 用法：
 *   node tools/contract/card-gen.mjs --spec spec/settings/system.geometry.json \
 *        --out tasks/SET-SYS-02.md [--owner antigravity] [--claim C-sys]
 *
 * 规则：
 *   - spec 不存在 → 拒绝对任何实现单。要么先采集，要么生成采集单（--capture）。
 *   - 卡里每个节点就是一条验收项，没有"等等""其余同上"这种含糊项。
 *   - 生成物带 spec sha256；实现期间 spec 变了，卡自动失效（gate 会红）。
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const argv = process.argv.slice(2)
const arg = (n, d = null) => {
  const i = argv.indexOf(n)
  if (i >= 0) return argv[i + 1]
  const inline = argv.find((a) => a.startsWith(`${n}=`))
  return inline ? inline.slice(n.length + 1) : d
}

const specPath = arg('--spec')
const out = arg('--out')
const owner = arg('--owner', '—')
const claim = arg('--claim', '—')
const captureMode = argv.includes('--capture')
const moduleName = arg('--module')

if (!specPath) {
  console.error('缺少 --spec')
  process.exit(2)
}

/* ---------- 采集单：没有契约时的唯一合法产物 ---------- */
if (captureMode || !fs.existsSync(specPath)) {
  if (!moduleName) {
    console.error(`spec 不存在：${specPath}\n` +
      '没有契约不允许开实现单。若确实尚未采集，请用 --capture --module <模块名> 生成采集单。')
    process.exit(3)
  }
  const body = [
    `# CAPTURE-${moduleName} · 采集单（由 card-gen 自动生成）`,
    '',
    '- 类型：**采集**（不是实现）',
    '- 归属：Capture lane（独占真机）',
    '- 状态：ready',
    '',
    '## 为什么是采集单而不是实现单',
    '',
    `契约 \`${specPath}\` 不存在。按 v2.0 不变量 B：没有真机契约，任何实现都是凭空捏造。`,
    '11-14 的 `SET-SYS-01` 就是在 8 个子页零证据的情况下开工的，代价是 3.5 天返工。',
    '',
    '## 做什么',
    '',
    `1. 遍历 \`${moduleName}\` 全部可达节点（含二级/三级页），产出 \`explore/${moduleName}/graph.json\``,
    '2. 每页一份 dump（xml）+ 截图（png），写入 `spec/captures/`，并在 `manifest.json` 记 sha256',
    '3. 跑 `spec-batch.mjs` 生成契约；a11y 树不可用的页面显式记入 `unknowns`',
    '4. 跑 `spec-coverage.mjs`，确认该模块 0 页面缺证据',
    '',
    '## 验收（可直接运行）',
    '',
    '```bash',
    `node tools/contract/spec-coverage.mjs --repo . --spec-root spec --module ${moduleName}`,
    '# 期望退出码 0，且 "无 spec 页面 0 / 共 N"',
    '```',
    '',
    '## 不许做什么',
    '',
    '- 不许在采集单里顺手写实现（那等于换个人重演 11-14）',
    '- 不许把不可达节点从清单里删掉——写进 unknowns',
    '',
  ].join('\n')
  if (out) {
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
    fs.writeFileSync(path.resolve(out), body)
    console.log(JSON.stringify({ mode: 'capture', out }, null, 2))
  } else process.stdout.write(body)
  process.exit(0)
}

/* ---------- 实现单：从契约生成 ---------- */
const raw = fs.readFileSync(path.resolve(specPath), 'utf8')
const spec = JSON.parse(raw)
const sha = crypto.createHash('sha256').update(raw).digest('hex')
const nodes = spec.nodes || []
if (nodes.length === 0) {
  console.error('契约里 0 个节点：空契约等于没有契约，拒绝开单')
  process.exit(3)
}

const rows = nodes.filter((n) => n.role === 'row')
const groups = nodes.filter((n) => n.role === 'group')
const headers = nodes.filter((n) => String(n.role).startsWith('header'))

const fmt = (b) => (Array.isArray(b) ? `[${b.join(', ')}]` : '—')
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|')

const L = []
L.push(`# SET-${spec.screen.replace(/\//g, '-').toUpperCase()} · ${spec.screen} 契约实现单`)
L.push('')
L.push('> 本卡由 `card-gen` 从真机契约生成，**不要手改**。改契约请走采集 lane，卡会重新生成。')
L.push('')
L.push('- 类型：实现（契约驱动）')
L.push('- 状态：ready')
L.push(`- claim: ${claim}`)
L.push(`- owner: ${owner}`)
L.push(`- spec: \`${specPath}\` @ sha256:\`${sha.slice(0, 16)}…\``)
L.push(`- 来源：\`${spec.source ?? 'unknown'}\` · dump \`${spec.from ?? 'unknown'}\` · 画布 ${spec.canvas ? `${spec.canvas.w}×${spec.canvas.h}` : '360×788'}`)
L.push(`- 节点：${nodes.length}（行 ${rows.length} · 组头 ${groups.length} · 页头 ${headers.length}）`)
L.push('')
L.push('## 验收（机器判决，不由人判断）')
L.push('')
L.push('```bash')
L.push(`node tools/accept/accept.mjs --spec ${specPath} --page ${spec.screen} \\`)
L.push('     --url http://127.0.0.1:<你的端口>/ --recipe tools/accept/recipes/<page>.mjs \\')
L.push(`     --ref-shot spec/captures/${spec.screen}/page.png --out reports/accept/<TASK>/`)
L.push('# 退出码 0 才算完成；4 = 节点没绑全；1 = 有 fail/missing/extra')
L.push('```')
L.push('')
L.push('| 判定项 | 要求 |')
L.push('|---|---|')
L.push(`| 节点命中率 | ${nodes.length}/${nodes.length} = 100% |`)
L.push('| G8a missing | 0（不许漏做）|')
L.push('| G8a extra | 0（不许自造）|')
L.push('| G8b 几何 | 线/图标 ±0.5 · 行/容器 ±1.5 画布 px |')
L.push('| 签核 | 由**非实现者**的 lane 签发 |')
L.push('')
L.push('## 节点清单（每行一条验收项）')
L.push('')
L.push('| # | 契约 id | 角色 | 期望文本 | summary | 期望 bounds(画布px) | 绑定属性 |')
L.push('|---|---|---|---|---|---|---|')
nodes.forEach((n, i) => {
  L.push(`| ${i + 1} | \`${cell(n.id)}\` | ${n.role} | ${cell(n.text) || '—'} | ${cell(n.summary) || '—'} | ${fmt(n.bounds)} | \`data-accept-id="${cell(n.id)}"\` |`)
})
L.push('')

if (Array.isArray(spec.transitions) && spec.transitions.length) {
  L.push('## 交互（G8c）')
  L.push('')
  L.push('| from | to | 期望 |')
  L.push('|---|---|---|')
  for (const t of spec.transitions) L.push(`| \`${cell(t.from)}\` | \`${cell(t.to)}\` | ${cell(t.expect) || '进入目标页'} |`)
  L.push('')
}

if (Array.isArray(spec.unknowns) && spec.unknowns.length) {
  L.push('## unknowns（契约显式缺口，不得假装知道）')
  L.push('')
  for (const u of spec.unknowns) L.push(`- \`${cell(u.element)}\`：${cell(u.reason)}`)
  L.push('')
}

L.push('## 不许做什么')
L.push('')
L.push('- 不许修改 `spec/` 下的契约（改了就是篡改真相；gate 会因 sha 不一致直接红）')
L.push('- 不许给没在契约里的行加实现（G8a extra 会抓）')
L.push('- 不许把节点标 skip 来换绿（G7\' 棘轮会抓）')
L.push('')

const body = L.join('\n')
if (out) {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true })
  fs.writeFileSync(path.resolve(out), body)
  console.log(JSON.stringify({ mode: 'implement', screen: spec.screen, nodes: nodes.length, rows: rows.length, sha256: sha, out }, null, 2))
} else process.stdout.write(body)