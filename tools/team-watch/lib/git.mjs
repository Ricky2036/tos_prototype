import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { sha256, sha256File } from './store.mjs'

/**
 * 单个 worktree 的只读指纹
 * =========================
 * 只采事实：HEAD、dirty（路径+状态+内容哈希）、任务卡 status/owner、docs/reports。
 * 不写仓库、不 checkout、不碰索引。
 */

function git(args, cwd, timeout = 15000) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout,
    maxBuffer: 32 * 1024 * 1024
  })
}

export function readHead(root) {
  const head = git(['rev-parse', 'HEAD'], root).trim()
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], root).trim()
  return { head, headShort: head.slice(0, 7), branch }
}

/** porcelain -z → [{ x, y, path, origPath? }] */
export function parsePorcelainZ(raw) {
  const parts = raw.split('\0')
  const out = []
  for (let i = 0; i < parts.length; i += 1) {
    const entry = parts[i]
    if (!entry) continue
    const x = entry[0]
    const y = entry[1]
    const file = entry.slice(3)
    const item = { x, y, path: file }
    if (x === 'R' || x === 'C') {
      const orig = parts[i + 1]
      if (orig) {
        item.origPath = orig
        i += 1
      }
    }
    out.push(item)
  }
  return out
}

export function dirtyFingerprint(root, maxBytes) {
  const raw = git(['status', '--porcelain=v1', '-z', '--untracked-files=all'], root)
  const entries = parsePorcelainZ(raw)
  const files = []
  let hashed = 0
  for (const e of entries.slice(0, 500)) {
    let content = null
    try {
      const abs = path.join(root, e.path)
      const st = fs.statSync(abs)
      if (st.isFile()) {
        content = sha256File(abs, maxBytes)
        hashed += 1
      } else if (st.isDirectory()) {
        content = `dir:${Math.round(st.mtimeMs)}`
      }
    } catch {
      content = 'missing'
    }
    files.push({ x: e.x, y: e.y, path: e.path, origPath: e.origPath || null, content })
  }
  files.sort((a, b) => a.path.localeCompare(b.path))
  return {
    count: entries.length,
    truncated: entries.length > files.length,
    files,
    hash: sha256(JSON.stringify(files.map((f) => [f.x, f.y, f.path, f.origPath, f.content]))),
    hashedFiles: hashed
  }
}

function parseCard(file) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split('\n')
  const pick = (re) => {
    for (const line of lines) {
      const m = line.match(re)
      if (m) return m[1].trim()
    }
    return ''
  }
  const status = pick(/^\s*[-*]?\s*status:\s*(\S+)/i) || pick(/^\s*[-*]?\s*状态[:：]\s*(\S+)/)
  const owner = pick(/^\s*[-*]?\s*owner:\s*(.+)$/i) || pick(/^\s*[-*]?\s*Owner[:：]\s*(.+)$/)
  const id = pick(/^\s*[-*]?\s*id:\s*(\S+)/i) || path.basename(file, '.md')
  // 阻塞原因：只有 blocked 卡才提取，且只认显式「阻塞/等待/原因:」行，避免把描述句误当原因
  let blockedReason = ''
  if (String(status).toLowerCase() === 'blocked') {
    for (const line of lines) {
      const m = line.match(/^\s*[-*]?\s*(阻塞原因|阻塞|等待原因|等待|原因|blocked)\s*[:：]\s*(.+)$/i)
      if (m) {
        blockedReason = m[2].trim().slice(0, 160)
        break
      }
    }
  }
  return {
    id,
    status: status || 'unknown',
    owner: owner || '',
    blockedReason,
    hash: sha256(text),
    mtime: Math.round(fs.statSync(file).mtimeMs)
  }
}

export function readTaskCards(root) {
  const dir = path.join(root, '.tasks', 'queue')
  if (!fs.existsSync(dir)) return []
  const cards = []
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith('.md') || name === 'TEMPLATE.md') continue
    try {
      cards.push({ file: name, ...parseCard(path.join(dir, name)) })
    } catch (e) {
      cards.push({ file: name, id: name.replace(/\.md$/, ''), status: 'unreadable', owner: '', error: e.message })
    }
  }
  return cards
}

export function readReports(root) {
  const dir = path.join(root, 'docs', 'reports')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((n) => n.endsWith('.md'))
    .sort()
    .map((n) => {
      const file = path.join(dir, n)
      try {
        return { file: n, hash: sha256File(file, 2 * 1024 * 1024), mtime: Math.round(fs.statSync(file).mtimeMs) }
      } catch (e) {
        return { file: n, error: e.message }
      }
    })
}

/** 指纹（用于对比「有没有真变化」，比只看 commit 稳） */
export function fingerprintRoot(root, opts = {}) {
  const maxBytes = opts.maxDirtyHashBytes ?? 1024 * 1024
  const { head, headShort, branch } = readHead(root)
  const dirty = dirtyFingerprint(root, maxBytes)
  const tasks = readTaskCards(root)
  const reports = readReports(root)
  const hash = sha256(JSON.stringify({ head, dirty: dirty.hash, tasks: tasks.map((t) => [t.id, t.status, t.owner, t.hash]), reports: reports.map((r) => [r.file, r.hash]) }))
  return { root, branch, head, headShort, dirty, tasks, reports, hash }
}

/** 供 summary 展示：按状态聚合任务卡 */
export function taskSummary(tasks) {
  const by = {}
  for (const t of tasks) by[t.status] = (by[t.status] || 0) + 1
  return by
}
