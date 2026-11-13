#!/usr/bin/env node
/**
 * task-board —— 任务板解析 / 校验 / 渲染的纯函数层
 * ==================================================
 * 被 `scripts/gen-task-board.mjs` 调用，也可被单测直接注入临时目录。
 *
 * 事实源优先级：
 *   1. `.tasks/queue/*.md` —— 拉取式队列，英文 status/claim/owner/depends
 *   2. `.tasks/*.md`      —— W0/W1/W2 旧卡，中文 状态/簇/Owner/分支，作为历史保留
 *
 * 完成证据来自 `.agent-assignments/ACTIVE_TASKS.md` 的 `| Merged |` 行：
 * 队列卡来不及置 done 时（例如 Q-001 的修复是随 W2-001 一起合入的），
 * 生成器仍要按事实显示 done，不能继续把已完成的单显示成 ready。
 *
 * 本模块不写任何文件；写盘与安全标记检查留在 CLI 层。
 */

import fs from 'node:fs'
import path from 'node:path'

export const BEGIN = '<!-- GENERATED:TASKS:BEGIN -->'
export const END = '<!-- GENERATED:TASKS:END -->'

/** 中英状态统一到四个规范值；未知值返回 null，由 validateTasks 明确报错 */
const STATUS_ALIASES = {
  ready: 'ready', 待办: 'ready', 未开始: 'ready', todo: 'ready',
  doing: 'doing', active: 'doing', review: 'doing', 进行中: 'doing', 审核中: 'doing',
  blocked: 'blocked', block: 'blocked', 阻塞: 'blocked',
  done: 'done', merged: 'done', complete: 'done', completed: 'done', 完成: 'done', 已完成: 'done',
}
export function normalizeStatus(raw) {
  const key = String(raw ?? '').trim().toLowerCase()
  if (!key) return 'ready'
  return STATUS_ALIASES[key] ?? null
}

const KEY_ALIASES = {
  status: 'status', 状态: 'status',
  owner: 'owner',
  claim: 'claim', 簇: 'claim', 归属: 'claim',
  depends: 'depends', 依赖: 'depends',
  size: 'size', 规模: 'size', 类型: 'type',
  branch: 'branch', 分支: 'branch',
  files: 'files', 文件: 'files', 独占文件: 'files',
  title: 'title', 任务: 'title',
}
const FIELD = /^-\s*([^：:\s][^：:]*?)\s*[：:]\s*(.+)$/
const EMPTY = new Set(['', '—', '-', '–', '无', 'none', 'null', 'N/A'])

export function isBlank(v) {
  return EMPTY.has(String(v ?? '').trim())
}

/** 规范化卡号：q-001 / Q-001 → Q-001；w2-001 → W2-001 */
export function normalizeId(raw) {
  return String(raw ?? '').trim().toUpperCase()
}

function parseList(v) {
  const s = String(v ?? '').trim().replace(/^\[/, '').replace(/\]$/, '')
  if (isBlank(s)) return []
  return s.split(/[,，、]/).map((x) => x.trim().replace(/^`|`$/g, '')).filter((x) => !isBlank(x))
}

/** 从一段依赖文字里抽出可识别的任务 ID；抽不到就返回原文，交给校验器判「无法解析」 */
export function extractDepIds(dep) {
  const text = String(dep ?? '')
  const ids = []
  for (const m of text.matchAll(/\b([A-Za-z]{1,8}\d*-\d{3,4})\b/g)) ids.push(normalizeId(m[1]))
  if (ids.length) return { ids, literal: text }
  return { ids: [], literal: text }
}

/**
 * 解析一张卡。返回 null 表示这不是任务卡（模板 / 路线图 / 占位符）。
 */
export function parseCard(file, source, root) {
  const name = path.basename(file)
  if (/^(TEMPLATE|ROADMAP|README)\.md$/i.test(name)) return null

  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const titleLine = lines.find((l) => l.startsWith('# '))
  const title = titleLine ? titleLine.replace(/^#\s*/, '').trim() : name.replace(/\.md$/, '')
  // 模板占位标题不算任务（例如 "# Q-XXX · <一句话说清要做什么>"）
  if (/Q-XXX|一句话说清|<\s*[^>]+\s*>/.test(title)) return null

  const idMatch = title.match(/^([A-Za-z][A-Za-z0-9-]*?\d{3,4})\b/) ||
    name.match(/^([A-Za-z][A-Za-z0-9-]*?\d{3,4})\b/)
  const id = idMatch ? normalizeId(idMatch[1]) : normalizeId(name.replace(/\.md$/, ''))
  // 没有任务 ID 的纯文档（如 "路线图 W2 → W4"）不进任务板
  if (!/[0-9]{3}/.test(id)) return null

  const task = {
    id, title, source,
    file: path.relative(root, file).split(path.sep).join('/'),
    statusRaw: 'ready', status: 'ready',
    owner: '—', claim: '—', size: '—', branch: '—',
    depends: [], files: [], type: '—',
  }

  for (const line of lines.slice(0, 40)) {
    const m = line.match(FIELD)
    if (!m) continue
    const key = KEY_ALIASES[m[1].trim().toLowerCase()]
    if (!key) continue
    const v = m[2].replace(/`/g, '').replace(/\*\*/g, '').trim()
    if (key === 'status') {
      task.statusRaw = v
      task.status = normalizeStatus(v)
    } else if (key === 'owner') task.owner = isBlank(v) ? '—' : v
    else if (key === 'claim') task.claim = isBlank(v) ? '—' : v
    else if (key === 'branch') task.branch = isBlank(v) ? '—' : v
    else if (key === 'size') task.size = isBlank(v) ? '—' : v
    else if (key === 'depends') task.depends = parseList(v)
    else if (key === 'files') task.files = parseList(v)
    else if (key === 'type') task.type = isBlank(v) ? '—' : v
  }
  return task
}

/** queue 优先；同 ID 在 legacy 里出现时降级为历史，不算重复 */
export function collectTasks(root) {
  const sources = [
    { dir: path.join(root, '.tasks', 'queue'), source: 'queue' },
    { dir: path.join(root, '.tasks'), source: 'legacy' },
  ]
  const out = []
  for (const { dir, source } of sources) {
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
      const t = parseCard(path.join(dir, name), source, root)
      if (t) out.push(t)
    }
  }
  return out
}

/** 完成证据：ACTIVE_TASKS.md 的 Merged 行里出现过的任务号，以及 fix/<card> 分支名 */
export function readCompletions(root) {
  const board = path.join(root, '.agent-assignments', 'ACTIVE_TASKS.md')
  const done = new Set()
  if (!fs.existsSync(board)) return done
  for (const line of fs.readFileSync(board, 'utf8').split('\n')) {
    if (!/^\|\s*Merged\s*\|/i.test(line)) continue
    for (const m of line.matchAll(/\b([A-Za-z]{1,8}\d*-\d{3,4})\b/g)) done.add(normalizeId(m[1]))
    // "合并自 fix/q-001-flaky" 这类分支名也是完成证据
    for (const m of line.matchAll(/fix\/([A-Za-z]{1,8}\d*-\d{3,4})/gi)) done.add(normalizeId(m[1]))
  }
  return done
}

export function effectiveStatus(task, completions) {
  return completions.has(task.id) ? 'done' : task.status
}

function depIsSatisfied(task, byId, completions) {
  if (!task.depends.length) return { ok: true, detail: [] }
  return task.depends.reduce((acc, dep) => {
    const { ids, literal } = extractDepIds(dep)
    if (!ids.length) return { ok: false, detail: [...acc.detail, `${literal}（无法解析）`] }
    const ok = ids.every((id) => completions.has(id) || byId.get(id)?.status === 'done')
    return { ok: acc.ok && ok, detail: [...acc.detail, `${ids.join('+')}${ok ? ' ✓' : ' ✗'}`] }
  }, { ok: true, detail: [] })
}

/** 返回可直接打印的问题列表；空数组表示数据健康 */
export function validateTasks(tasks, { completions = new Set() } = {}) {
  const problems = []
  const byId = new Map()
  const seen = new Map()

  for (const t of tasks) {
    if (t.status === null) problems.push(`${t.file}: 未知状态「${t.statusRaw}」，无法映射到 ready/doing/blocked/done`)
    // 同一来源目录内出现两个不同文件、同一 ID ⇒ 真重复
    const key = `${t.source}:${t.id}`
    if (seen.has(key)) problems.push(`重复 ID ${t.id}：${seen.get(key)} 与 ${t.file}`)
    else seen.set(key, t.file)
    if (!byId.has(t.id) || t.source === 'queue') byId.set(t.id, t)
  }

  for (const t of tasks) {
    const status = effectiveStatus(t, completions)
    if (status === 'doing' && isBlank(t.owner)) {
      problems.push(`${t.file}: doing 状态缺少 owner（取单时必须填）`)
    }
    for (const dep of t.depends) {
      const { ids, literal } = extractDepIds(dep)
      if (!ids.length) {
        problems.push(`${t.file}: 依赖「${literal}」无法解析出任务 ID`)
        continue
      }
      for (const id of ids) {
        const target = byId.get(id)
        if (!target && !completions.has(id)) {
          problems.push(`${t.file}: 依赖缺失，找不到 ${id} 对应的任务或完成记录`)
        }
      }
    }
    if (status === 'ready') {
      const dep = depIsSatisfied(t, byId, completions)
      if (!dep.ok) problems.push(`${t.file}: 状态为 ready 但依赖未完成（${dep.detail.join('、')}）`)
    }
  }

  // 文件互斥：只有「非 done 且都声明了 files」的卡之间才比；不同文件绝不误报
  const active = tasks.filter((t) => effectiveStatus(t, completions) !== 'done' && t.files.length)
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const overlap = active[i].files.filter((f) => active[j].files.includes(f))
      if (overlap.length) {
        problems.push(
          `文件互斥冲突：${active[i].file} 与 ${active[j].file} 同时认领 ${overlap.join('、')}`,
        )
      }
    }
  }
  return problems
}

const STATUS_ORDER = { ready: 0, doing: 1, blocked: 2, done: 3 }
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')

export function renderTable(tasks, { completions = new Set() } = {}) {
  const byId = new Map()
  for (const t of tasks) if (!byId.has(t.id) || t.source === 'queue') byId.set(t.id, t)
  const sort = (a, b) =>
    (STATUS_ORDER[effectiveStatus(a, completions)] ?? 9) - (STATUS_ORDER[effectiveStatus(b, completions)] ?? 9) ||
    a.id.localeCompare(b.id)

  const row = (t) => {
    const status = effectiveStatus(t, completions)
    const doneByEvidence = completions.has(t.id) && t.status !== 'done'
    const statusCell = doneByEvidence ? 'done（完成记录，卡片待更新）' : (status ?? `未知:${t.statusRaw}`)
    const deps = t.depends.length
      ? depIsSatisfied(t, byId, completions).detail.join('、')
      : '—'
    return `| ${esc(t.id)} | ${esc(statusCell)} | ${esc(t.title)} | ${esc(t.owner)} | ${esc(t.claim)} | ${esc(deps)} | \`${esc(t.file)}\` |`
  }
  const head = '| ID | Status | 任务 | Owner | Claim | Depends | 单子 |\n| --- | --- | --- | --- | --- | --- | --- |'

  const queue = tasks.filter((t) => t.source === 'queue').sort(sort)
  const legacy = tasks.filter((t) => t.source === 'legacy').sort(sort)
  const parts = [
    '## 队列（事实源 `.tasks/queue/`）', '', head,
    ...(queue.length ? queue.map(row) : ['| — | — | （队列为空） | — | — | — | — |']), '',
    '## 历史任务（`.tasks/` 顶层旧卡，只读保留）', '', head,
    ...(legacy.length ? legacy.map(row) : ['| — | — | （无历史卡） | — | — | — | — |']), '',
    `共 ${queue.length} 张队列卡 · ${legacy.length} 张历史卡`,
  ]
  return parts.join('\n')
}

export function renderBlock(tasks, opts = {}) {
  return `${BEGIN}\n<!-- 本区块由 scripts/gen-task-board.mjs 生成，不要手改 -->\n\n${renderTable(tasks, opts)}\n\n${END}`
}
