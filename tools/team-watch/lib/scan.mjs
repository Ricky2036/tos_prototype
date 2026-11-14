import fs from 'node:fs'
import path from 'node:path'
import { fingerprintRoot } from './git.mjs'
import { probePort } from './http.mjs'
import { atomicWriteJson, ensureDir, readJson, sha256 } from './store.mjs'

/**
 * scan —— 单次只读扫描 + 与上一轮快照对比
 * ======================================
 * 事实源：每个 worktree 的 HEAD / dirty 内容哈希 / 任务卡 / docs/reports + 端口 HTTP。
 * 「进展」= HEAD、dirty 内容、任务卡、报告任一变化；端口上下线不算进展。
 * 首次运行只建 baseline，不推断任何完成/停工。
 */

export const SNAPSHOT_VERSION = 1

export function snapshotPath(cfg) {
  return path.join(cfg.home, 'snapshot.json')
}

function rootFromFingerprint(fp, rootSpec, portInfo) {
  return {
    id: rootSpec.id,
    agent: rootSpec.agent,
    role: rootSpec.role,
    root: fp.root,
    branch: fp.branch,
    head: fp.head,
    headShort: fp.headShort,
    dirty: { count: fp.dirty.count, hash: fp.dirty.hash, truncated: fp.dirty.truncated, files: fp.dirty.files.slice(0, 20).map((f) => `${f.y || f.x} ${f.path}`) },
    tasks: fp.tasks.map((t) => ({ id: t.id, status: t.status, owner: t.owner, blockedReason: t.blockedReason, file: t.file })),
    reports: fp.reports.map((r) => r.file),
    port: portInfo || null,
    fingerprint: fp.hash,
    lastProgressAt: null,
    lastProgressReason: '',
    stallReported: false,
    error: null
  }
}

function emptyRoot(spec, error) {
  return {
    id: spec.id,
    agent: spec.agent,
    role: spec.role,
    root: spec.root,
    branch: spec.branch || null,
    head: null,
    headShort: null,
    dirty: { count: 0, hash: null, truncated: false, files: [] },
    tasks: [],
    reports: [],
    port: null,
    fingerprint: null,
    lastProgressAt: null,
    lastProgressReason: '',
    stallReported: false,
    error
  }
}

async function withRetry(fn, attempts = 3, baseMs = 120) {
  let lastErr
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, baseMs * 2 ** i))
    }
  }
  throw lastErr
}

function taskMap(tasks) {
  const m = new Map()
  for (const t of tasks) m.set(t.id, t)
  return m
}

function diffRoot(prev, cur) {
  const kinds = []
  if (!prev) return kinds
  if (prev.head !== cur.head) kinds.push({ kind: 'head', detail: `${String(prev.headShort)} → ${String(cur.headShort)}` })
  if (prev.dirty.hash !== cur.dirty.hash) {
    const delta = cur.dirty.count - prev.dirty.count
    const detail = delta === 0
      ? `dirty 内容变化（${cur.dirty.count} 个文件，路径/数量不变）`
      : `dirty ${prev.dirty.count} → ${cur.dirty.count}（${delta > 0 ? '+' : ''}${delta}）`
    kinds.push({ kind: 'dirty', detail })
  }
  const pt = taskMap(prev.tasks || [])
  const ct = taskMap(cur.tasks || [])
  const changedTasks = []
  for (const [id, c] of ct) {
    const p = pt.get(id)
    if (!p) changedTasks.push(`${id}+${c.status}`)
    else if (p.status !== c.status || p.owner !== c.owner) changedTasks.push(`${id} ${p.status}→${c.status}`)
  }
  for (const id of pt.keys()) if (!ct.has(id)) changedTasks.push(`${id}-移除`)
  if (changedTasks.length) kinds.push({ kind: 'tasks', detail: changedTasks.join(', ') })

  const pr = new Set((prev.reports || []).map((r) => r.file || r))
  const cr = new Set((cur.reports || []).map((r) => r.file || r))
  const added = [...cr].filter((r) => !pr.has(r))
  const removed = [...pr].filter((r) => !cr.has(r))
  if (added.length || removed.length) kinds.push({ kind: 'reports', detail: `+${added.length}/-${removed.length}（${added.slice(0, 2).join(',') || '—'}）` })

  const pu = prev.port && prev.port.up
  const cu = cur.port && cur.port.up
  if (prev.port && cur.port && pu !== cu) kinds.push({ kind: 'port', detail: `${prev.port.url} ${pu ? 'up' : 'down'} → ${cu ? 'up' : 'down'}` })
  return kinds
}

export async function buildSnapshot(cfg, now = Date.now()) {
  const prev = readJson(snapshotPath(cfg), null)
  const prevRoots = prev && prev.roots ? prev.roots : {}
  const baseline = !prev || !prev.roots
  const roots = {}
  const changes = []
  const stalls = []
  const blocked = []
  const errors = []

  for (const spec of cfg.roots) {
    const port = spec.port
      ? await withRetry(() => probePort(spec.port, cfg.httpTimeoutMs), 2, 100).catch((e) => ({
        url: `http://127.0.0.1:${spec.port}/`,
        up: false,
        status: null,
        ok: false,
        error: `probe failed: ${e.message}`
      }))
      : null

    let cur
    if (spec.missing) {
      cur = emptyRoot(spec, `工作区不存在：${spec.root}`)
      errors.push({ root: spec.id, message: cur.error })
    } else {
      try {
        const fp = await withRetry(() => fingerprintRoot(spec.root, cfg), 3, 120)
        cur = rootFromFingerprint(fp, spec, port)
      } catch (e) {
        cur = emptyRoot(spec, `扫描失败：${e.message}`)
        errors.push({ root: spec.id, message: cur.error })
      }
    }

    const before = prevRoots[spec.id]
    const kinds = diffRoot(before, cur)
    const contentKinds = kinds.filter((k) => k.kind !== 'port')

    if (baseline || !before) {
      cur.lastProgressAt = new Date(now).toISOString()
      cur.lastProgressReason = 'baseline'
      cur.stallReported = false
    } else if (contentKinds.length) {
      cur.lastProgressAt = new Date(now).toISOString()
      cur.lastProgressReason = contentKinds.map((k) => `${k.kind}:${k.detail}`).join('; ')
      cur.stallReported = false
    } else {
      cur.lastProgressAt = before.lastProgressAt || new Date(now).toISOString()
      cur.lastProgressReason = before.lastProgressReason || '无变化'
      cur.stallReported = Boolean(before.stallReported)
    }

    for (const k of kinds) changes.push({ root: spec.id, at: new Date(now).toISOString(), ...k })

    for (const t of cur.tasks) {
      if (String(t.status).toLowerCase() === 'blocked') {
        blocked.push({
          root: spec.id,
          agent: spec.agent,
          task: t.id,
          status: t.status,
          reason: t.blockedReason || '卡里未写阻塞原因',
          owner: t.owner || ''
        })
      }
    }

    // 停工只按「内容进展」判定；每段停工期只报一次（stallReported 落快照）
    const last = new Date(cur.lastProgressAt).getTime()
    const idleMs = now - last
    let stallInfo = null
    if (!cur.error && idleMs >= cfg.stallMs) {
      const minutes = Math.round(idleMs / 60000)
      const laneBlocked = blocked.filter((b) => b.root === spec.id)
      const reason = laneBlocked.length
        ? `等待：${laneBlocked.map((b) => `${b.task}（${b.reason}）`).join('; ')}`
        : `内容无变化（HEAD/dirty/任务卡/报告均未变）已 ${minutes} 分钟`
      stallInfo = {
        root: spec.id,
        agent: spec.agent,
        since: cur.lastProgressAt,
        minutes,
        reason,
        next_action: laneBlocked.length ? '核对阻塞原因与依赖，必要时由 Integrator 拆/转单' : '确认 lane 是否仍在产出（无 commit 不等于停工）'
      }
    }
    cur.stall = stallInfo
    cur.stallReported = Boolean(stallInfo)
    const wasReported = Boolean(before && before.stallReported)
    if (stallInfo && !wasReported) stalls.push(stallInfo)

    cur.kinds = kinds
    roots[spec.id] = cur
  }

  const fpAll = sha256(JSON.stringify(Object.values(roots).map((r) => [r.id, r.head, r.dirty.hash, r.tasks.map((t) => `${t.id}:${t.status}`), r.reports])))
  const snapshot = {
    version: SNAPSHOT_VERSION,
    generatedAt: new Date(now).toISOString(),
    baseline,
    fingerprint: fpAll,
    home: cfg.home,
    roots,
    changes,
    blocked,
    stalls,
    errors
  }
  return { snapshot, prev }
}

export async function scanOnce(cfg, opts = {}) {
  const now = opts.now ?? Date.now()
  ensureDir(cfg.home)
  const { snapshot, prev } = await buildSnapshot(cfg, now)
  atomicWriteJson(snapshotPath(cfg), snapshot)

  // 退出码语义：有 root 扫描失败 → 2（仍写快照，供后续对比）
  return {
    snapshot,
    previous: prev,
    baseline: snapshot.baseline,
    changes: snapshot.changes,
    stalls: snapshot.stalls,
    errors: snapshot.errors,
    exitCode: snapshot.errors.length ? 2 : 0
  }
}

export function readSnapshot(cfg) {
  return readJson(snapshotPath(cfg), null)
}

/** baseline 时把「上一轮」视作不存在：watch 据此不产生事件，避免首轮误报完成 */
export function isBaseline(result) {
  return Boolean(result && result.baseline)
}

export function rootCwdExists(root) {
  return Boolean(root && fs.existsSync(root))
}
