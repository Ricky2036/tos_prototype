import fs from 'node:fs'
import path from 'node:path'
import { atomicWriteJson, atomicWriteText, ensureDir, isPidAlive, readJson } from './store.mjs'
import { statusData } from './events.mjs'

/**
 * 简洁摘要（summary.json / summary.md）
 * ====================================
 * 只抄事实：HEAD、dirty 数、任务卡状态、9999 端口、变化、阻塞原因、停工、最近事件。
 * 不写建议、不派单、不判断验收。
 */

export function watchPidPath(home) { return path.join(home, 'watch.pid') }
export function lockPathOf(home) { return path.join(home, 'watch.lock') }
export function logPathOf(home) { return path.join(home, 'watch.log') }

export function readWatchState(home) {
  const info = readJson(watchPidPath(home), null)
  if (!info) return { running: false, pid: null, info: null }
  const alive = isPidAlive(Number(info.pid))
  return { running: alive, pid: info.pid, info, stale: !alive }
}

/**
 * blocked 卡在四个 worktree 里是同一份队列：按 task+reason 去重，
 * 只展示「卡里写了原因」的等待，其余只给计数，避免摘要变成 70 行。
 */
function blockedView(blocked) {
  const withReason = blocked.filter((b) => b.reason && b.reason !== '卡里未写阻塞原因')
  const byKey = new Map()
  for (const b of withReason) {
    const key = `${b.task}\u0000${b.reason}`
    if (!byKey.has(key)) byKey.set(key, { root: b.root, roots: [b.root], agent: b.agent, task: b.task, owner: b.owner, reason: b.reason })
    else byKey.get(key).roots.push(b.root)
  }
  const uniq = [...byKey.values()]
  return {
    blocked: uniq.slice(0, 6),
    blockedTotal: uniq.length,
    blockedWithoutReason: blocked.length - withReason.length
  }
}

export function taskCounts(tasks) {
  const by = {}
  for (const t of tasks) by[t.status] = (by[t.status] || 0) + 1
  return Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' / ') || '—'
}

export function buildSummary(cfg, snapshot) {
  const st = statusData(cfg)
  const watch = readWatchState(cfg.home)
  const roots = Object.values(snapshot.roots || {}).map((r) => ({
    id: r.id,
    agent: r.agent,
    role: r.role,
    branch: r.branch,
    head: r.headShort,
    dirty: r.dirty.count,
    tasks: taskCounts(r.tasks),
    port: r.port ? { url: r.port.url, up: r.port.up, status: r.port.status, error: r.port.error } : null,
    lastProgressAt: r.lastProgressAt,
    idleMinutes: r.lastProgressAt ? Math.round((Date.now() - new Date(r.lastProgressAt).getTime()) / 60000) : null,
    stall: r.stall || null,
    error: r.error || null
  }))
  const integration = roots.find((r) => r.role === 'integration')
  return {
    generatedAt: new Date().toISOString(),
    baseline: Boolean(snapshot.baseline),
    home: cfg.home,
    watch: { running: watch.running, pid: watch.pid, lastTickAt: watch.info ? watch.info.lastTickAt : null },
    acceptance: integration && integration.port
      ? { port: integration.port.url, up: integration.port.up, status: integration.port.status, error: integration.port.error }
      : { port: null, up: null, error: '未配置集成端口（9999）' },
    roots,
    changes: (snapshot.changes || []).slice(0, 20),
    ...blockedView(snapshot.blocked || []),
    stalls: Object.values(snapshot.roots || {}).map((r) => r.stall).filter(Boolean),
    events: {
      total: st.events.length,
      unacked: st.events.filter((e) => !e.acked).length,
      conflicts: st.conflicts.length,
      recent: st.events.slice(-6).map((e) => ({ id: e.event_id, event: e.event, agent: e.agent, task: e.task, at: e.at, acked: e.acked }))
    },
    errors: snapshot.errors || []
  }
}

export function renderSummaryMd(summary) {
  const lines = []
  lines.push('# 协作巡检摘要')
  lines.push('')
  lines.push(`- 生成：${summary.generatedAt}${summary.baseline ? ' · **baseline（首轮只记录，不推断完成）**' : ''}`)
  lines.push(`- 共享目录：\`${summary.home}\``)
  lines.push(`- watch：${summary.watch.running ? `运行中 pid=${summary.watch.pid}（lastTick ${summary.watch.lastTickAt || '—'}）` : '未运行'}`)
  lines.push(`- 9999 验收口：${summary.acceptance.up ? `UP ${summary.acceptance.status}` : `DOWN（${summary.acceptance.error || '—'}）`}`)
  lines.push('')
  lines.push('## 三条 lane + 集成根')
  lines.push('')
  lines.push('| root | agent | branch | HEAD | dirty | 任务卡 | 端口 | 无进展 |')
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const r of summary.roots) {
    lines.push(`| ${r.id} | ${r.agent} | ${r.branch || '—'} | \`${r.head || '—'}\` | ${r.dirty}${r.error ? ' ⚠' : ''} | ${r.tasks} | ${r.port ? (r.port.up ? `UP ${r.port.status}` : 'DOWN') : '—'} | ${r.idleMinutes === null ? '—' : `${r.idleMinutes}m`}${r.stall ? ' · **stall**' : ''} |`)
  }
  if (summary.errors.length) {
    lines.push('')
    lines.push('## 扫描错误')
    for (const e of summary.errors) lines.push(`- ${e.root}: ${e.message}`)
  }
  if (summary.changes.length) {
    lines.push('')
    lines.push('## 本轮事实变化')
    for (const c of summary.changes.slice(0, 12)) lines.push(`- ${c.root} · ${c.kind} · ${c.detail}`)
  }
  if (summary.blocked.length || summary.blockedWithoutReason) {
    lines.push('')
    lines.push(`## 阻塞/等待（有原因 ${summary.blockedTotal} 条；未写原因 ${summary.blockedWithoutReason} 条）`)
    for (const b of summary.blocked) {
      const roots = b.roots.length > 1 ? `${b.roots.length} 个 lane` : b.root
      lines.push(`- ${roots} · ${b.task}（owner ${b.owner || '—'}）：${b.reason}`)
    }
    if (summary.blockedTotal > summary.blocked.length) lines.push(`- …另 ${summary.blockedTotal - summary.blocked.length} 条有原因条目见 status --json`)
  }
  if (summary.stalls.length) {
    lines.push('')
    lines.push('## 疑似停工（每段只报一次）')
    for (const s of summary.stalls) lines.push(`- ${s.root} · 已 ${s.minutes} 分钟无内容进展：${s.reason}`)
  }
  lines.push('')
  lines.push(`## 事件：${summary.events.total} 条（未读 ${summary.events.unacked}，冲突 ${summary.events.conflicts}）`)
  for (const e of summary.events.recent.slice(0, 5)) lines.push(`- ${e.at} · ${e.event} · ${e.agent} · ${e.task} · ${e.acked ? '已读' : '未读'}`)
  lines.push('')
  lines.push('> 本摘要只记录事实；ack 仅代表读过，不代表验收完成。事件不会唤醒任何模型。')
  return `${lines.join('\n')}\n`
}

export function writeSummary(cfg, snapshot) {
  ensureDir(cfg.home)
  const summary = buildSummary(cfg, snapshot)
  atomicWriteJson(path.join(cfg.home, 'summary.json'), summary)
  atomicWriteText(path.join(cfg.home, 'summary.md'), renderSummaryMd(summary))
  return summary
}

export function readSummary(cfg) {
  return readJson(path.join(cfg.home, 'summary.json'), null)
}
