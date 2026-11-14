#!/usr/bin/env node
/**
 * team-watch —— 协作监测（事件记录 + 低成本巡检）
 * ==============================================
 * 只采事实：不调用模型、不唤醒 CLI、不自动审查/派单/合并、不抢任何任务锁。
 *
 * 命令：
 *   scan   单次只读扫描，与上一轮快照对比（首次只建 baseline）
 *   emit   显式事件 delivery-ready|blocked|test-failed|integrated（同 ID 幂等，异内容记冲突）
 *   watch  普通 Node 定时器每 60s scan；只有事实变化才追加事件/摘要；每段停工只报一次
 *   status 只读查看 snapshot / events / acks / watch 状态
 *   ack    标记「已读」（仅代表读过，不代表验收完成）
 *   start  后台启动本工具自己的 watch 进程（写 pid/log）
 *   stop   只停本工具自己的 pid（校验 cmdline，不做全局 kill）
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ConfigError, resolveConfig } from './lib/config.mjs'
import { scanOnce, readSnapshot } from './lib/scan.mjs'
import {
  emitEvent, ackEvent, statusData, EXPLICIT_EVENTS, eventsPath
} from './lib/events.mjs'
import {
  buildSummary, readSummary, watchPidPath, lockPathOf, logPathOf, readWatchState, renderSummaryMd, taskCounts, writeSummary
} from './lib/summary.mjs'
import { acquireLock, ensureDir, isPidAlive, readJson, atomicWriteJson } from './lib/store.mjs'
import { createLogger } from './lib/logger.mjs'

const SELF = fileURLToPath(import.meta.url)
const SELF_DIR = path.dirname(SELF)

function parseArgs(list) {
  const flags = { _: [] }
  for (let i = 0; i < list.length; i += 1) {
    const a = list[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = list[i + 1]
      if (next !== undefined && !next.startsWith('--')) {
        flags[key] = next
        i += 1
      } else {
        flags[key] = true
      }
    } else {
      flags._.push(a)
    }
  }
  return flags
}

function cfgFor(flags) {
  return resolveConfig({ cwd: process.cwd(), configPath: typeof flags.config === 'string' ? flags.config : undefined })
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

function humanScan(result) {
  const s = result.snapshot
  const tag = s.baseline ? 'BASELINE（首轮只记录，不推断完成）' : `${result.changes.length} 项变化`
  console.log(`scan ${tag} · ${s.generatedAt}`)
  for (const r of Object.values(s.roots)) {
    const port = r.port ? (r.port.up ? `UP ${r.port.status}` : `DOWN(${r.port.error || '—'})`) : '—'
    console.log(`  · ${r.id.padEnd(11)} ${String(r.branch).padEnd(17)} ${String(r.headShort).padEnd(8)} dirty=${r.dirty.count} port=${port}${r.error ? ` ⚠ ${r.error}` : ''}`)
    if (r.tasks.length) console.log(`      任务卡：${r.tasks.map((t) => `${t.id}:${t.status}`).join(', ')}`)
  }
  for (const c of result.changes) console.log(`  ~ ${c.root} ${c.kind}: ${c.detail}`)
  for (const st of result.stalls) console.log(`  ! ${st.root} 疑似停工 ${st.minutes}m：${st.reason}`)
  for (const e of result.errors) console.log(`  ✖ ${e.root}: ${e.message}`)
  console.log(`  → ${path.join(s.home, 'snapshot.json')}`)
}

function humanStatus(cfg) {
  const snapshot = readSnapshot(cfg)
  const st = statusData(cfg)
  const watch = readWatchState(cfg.home)
  console.log(`team-watch status`)
  console.log(`  home    : ${cfg.home}`)
  console.log(`  watch   : ${watch.running ? `running pid=${watch.pid} lastTick=${watch.info && watch.info.lastTickAt ? watch.info.lastTickAt : '—'}` : watch.stale ? 'stale pid file' : 'stopped'}`)
  if (!snapshot) {
    console.log('  snapshot: 还没扫过（先跑 scan）')
  } else {
    console.log(`  snapshot: ${snapshot.generatedAt}${snapshot.baseline ? '（baseline）' : ''} · fingerprint=${String(snapshot.fingerprint).slice(0, 12)}`)
    for (const r of Object.values(snapshot.roots)) {
      const port = r.port ? (r.port.up ? `UP ${r.port.status}` : 'DOWN') : '—'
      const idle = r.lastProgressAt ? Math.round((Date.now() - new Date(r.lastProgressAt).getTime()) / 60000) : null
      console.log(`    ${r.id.padEnd(11)} ${String(r.headShort).padEnd(8)} dirty=${r.dirty.count} 任务=${taskCounts(r.tasks)} 端口=${port} 无进展=${idle === null ? '—' : `${idle}m`}${r.stall ? ' [stall]' : ''}`)
    }
  }
  console.log(`  events  : ${st.events.length}（未读 ${st.events.filter((e) => !e.acked).length}，冲突 ${st.conflicts.length}）`)
  for (const e of st.events.slice(-5)) console.log(`    ${e.at} ${e.event} ${e.agent}/${e.task} sha=${e.sha} ${e.acked ? '已读' : '未读'}`)
  if (st.conflicts.length) console.log('  冲突（原事件保持不变）：', st.conflicts.map((c) => c.event_id).join(', '))
}

/* ------------------------------- commands ------------------------------- */

async function cmdScan(flags) {
  const cfg = cfgFor(flags)
  const result = await scanOnce(cfg)
  writeSummary(cfg, result.snapshot)
  if (flags.json) printJson({ ...result, snapshot: result.snapshot })
  else humanScan(result)
  process.exitCode = result.exitCode
}

function cmdEmit(flags) {
  const cfg = cfgFor(flags)
  const event = String(flags.event || '')
  if (!EXPLICIT_EVENTS.includes(event)) {
    throw new ConfigError(`--event 必须是 ${EXPLICIT_EVENTS.join(' | ')}（system 事件由 watch 自己发）`)
  }
  const eventId = typeof flags['event-id'] === 'string'
    ? flags['event-id']
    : `${flags.task}:${event}:${flags.sha || 'unknown'}`
  const result = emitEvent(cfg, {
    event_id: eventId,
    task: flags.task,
    agent: flags.agent,
    event,
    sha: flags.sha || 'unknown',
    artifact: flags.artifact,
    next_action: flags['next-action'] || flags.next_action,
    source: 'explicit'
  })
  printJson(result)
  process.exitCode = result.status === 'conflict' ? 3 : 0
}

function cmdAck(flags) {
  const cfg = cfgFor(flags)
  const result = ackEvent(cfg, { event_id: flags.event, by: flags.by || flags.agent, note: flags.note })
  printJson(result)
}

function cmdStatus(flags) {
  const cfg = cfgFor(flags)
  if (flags.json) {
    const snapshot = readSnapshot(cfg)
    printJson({
      home: cfg.home,
      watch: readWatchState(cfg.home),
      snapshot,
      ...statusData(cfg)
    })
    return
  }
  humanStatus(cfg)
}

/* --------------------------------- watch -------------------------------- */

function writePidFile(cfg, extra = {}) {
  const prev = readJson(watchPidPath(cfg.home), {}) || {}
  atomicWriteJson(watchPidPath(cfg.home), {
    pid: process.pid,
    startedAt: prev.startedAt || new Date().toISOString(),
    lastTickAt: new Date().toISOString(),
    intervalMs: cfg.intervalMs,
    log: logPathOf(cfg.home),
    home: cfg.home,
    ...extra
  })
}

function emitScanChange(cfg, snapshot) {
  const eventId = `scan:${snapshot.fingerprint}`
  return emitEvent(cfg, {
    event_id: eventId,
    task: 'scan',
    agent: 'watch',
    event: 'scan-change',
    sha: String(snapshot.fingerprint).slice(0, 12),
    artifact: 'summary.json',
    next_action: '查看 summary.md / status；本事件不代表验收结论',
    detail: { changes: snapshot.changes, generatedAt: snapshot.generatedAt },
    source: 'watch'
  })
}

function emitStall(cfg, snapshot, st) {
  const root = snapshot.roots[st.root] || {}
  return emitEvent(cfg, {
    event_id: `stall:${st.root}:${st.since}`,
    task: `watch:${st.root}`,
    agent: st.agent,
    event: 'suspected-stall',
    sha: root.headShort || 'unknown',
    artifact: 'summary.md',
    next_action: st.next_action,
    detail: st,
    source: 'watch'
  })
}

async function tick(cfg, logger) {
  const result = await scanOnce(cfg)
  const snapshot = result.snapshot
  if (result.baseline) {
    writeSummary(cfg, snapshot)
    logger.log(`baseline roots=${Object.keys(snapshot.roots).join(',')} fingerprint=${String(snapshot.fingerprint).slice(0, 12)}`)
  } else if (result.changes.length) {
    const ev = emitScanChange(cfg, snapshot)
    writeSummary(cfg, snapshot)
    logger.log(`change n=${result.changes.length} event=${ev.status} ${result.changes.map((c) => `${c.root}:${c.kind}`).join(',')}`)
  }
  for (const st of result.stalls) {
    const ev = emitStall(cfg, snapshot, st)
    logger.log(`stall root=${st.root} minutes=${st.minutes} event=${ev.status} reason=${st.reason}`)
    if (!result.changes.length) writeSummary(cfg, snapshot)
  }
  if (result.errors.length) logger.log(`scan-errors ${result.errors.map((e) => `${e.root}:${e.message}`).join(' | ')}`)
  return result
}

async function cmdWatch(flags) {
  const cfg = cfgFor(flags)
  if (flags.interval) cfg.intervalMs = Number(flags.interval)
  if (flags['stall-ms']) cfg.stallMs = Number(flags['stall-ms'])
  ensureDir(cfg.home)
  const logger = createLogger(logPathOf(cfg.home), { maxBytes: 2 * 1024 * 1024 })

  let release
  try {
    release = acquireLock(lockPathOf(cfg.home), { timeoutMs: 1200, label: 'watch' })
  } catch (e) {
    console.error(`watch 已在运行（或锁被占用）：${e.message}`)
    process.exitCode = 3
    return
  }

  let stopped = false
  const cleanup = () => {
    if (stopped) return
    stopped = true
    try {
      const info = readJson(watchPidPath(cfg.home), null)
      if (!info || Number(info.pid) === process.pid) fs.rmSync(watchPidPath(cfg.home), { force: true })
    } catch { /* ignore */ }
    release()
  }
  process.on('SIGTERM', () => { logger.log('SIGTERM cleanup'); cleanup(); process.exit(0) })
  process.on('SIGINT', () => { logger.log('SIGINT cleanup'); cleanup(); process.exit(0) })
  writePidFile(cfg, { pid: process.pid })
  if (!readSummary(cfg)) {
    const snap = readSnapshot(cfg)
    if (snap) writeSummary(cfg, snap)
  }
  logger.log(`watch start pid=${process.pid} interval=${cfg.intervalMs}ms stall=${cfg.stallMs}ms home=${cfg.home}`)

  if (flags.once) {
    const r = await tick(cfg, logger)
    logger.log(`watch once done changes=${r.changes.length} stalls=${r.stalls.length}`)
    cleanup()
    return
  }

  let timer = null
  const schedule = () => {
    if (stopped) return
    timer = setTimeout(async () => {
      try {
        await tick(cfg, logger)
      } catch (e) {
        logger.log(`tick failed: ${e.message}`)
      } finally {
        try { writePidFile(cfg) } catch { /* ignore */ }
        schedule()
      }
    }, cfg.intervalMs)
    timer.unref?.()
  }
  try {
    await tick(cfg, logger)
  } catch (e) {
    logger.log(`first tick failed: ${e.message}`)
  }
  writePidFile(cfg)
  schedule()
  // 保持事件循环存活（普通 Node 定时器，不依赖任何守护进程）
  await new Promise((resolve) => {
    const iv = setInterval(() => { if (stopped) { clearInterval(iv); resolve() } }, 1000)
  })
}

/* ------------------------------ start / stop ---------------------------- */

function isOurWatchProcess(pid) {
  try {
    const cmd = execFileSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' }).trim()
    return cmd.includes('team-watch/watch.mjs') && /\bwatch\b/.test(cmd)
  } catch {
    return false
  }
}

function cmdStart(flags) {
  const cfg = cfgFor(flags)
  ensureDir(cfg.home)
  const state = readWatchState(cfg.home)
  if (state.running) {
    console.error(`已在运行：pid=${state.pid}（先 stop 再 start）`)
    process.exitCode = 3
    return
  }
  if (state.stale) {
    try { fs.rmSync(watchPidPath(cfg.home), { force: true }) } catch { /* ignore */ }
    try { fs.rmSync(lockPathOf(cfg.home), { force: true }) } catch { /* ignore */ }
  }
  const interval = Number(flags.interval || cfg.intervalMs)
  const logFile = logPathOf(cfg.home)
  const fd = fs.openSync(logFile, 'a')
  const args = [SELF, 'watch', '--interval', String(interval)]
  if (typeof flags.config === 'string') args.push('--config', flags.config)
  if (flags['stall-ms']) args.push('--stall-ms', String(flags['stall-ms']))
  const child = spawn(process.execPath, args, {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', fd, fd],
    env: process.env
  })
  child.unref()
  try { fs.closeSync(fd) } catch { /* ignore */ }

  const deadline = Date.now() + 5000
  let info = null
  while (Date.now() < deadline) {
    info = readJson(watchPidPath(cfg.home), null)
    if (info && Number(info.pid) === child.pid && isPidAlive(child.pid)) break
    if (!isPidAlive(child.pid)) break
    execFileSync('sleep', ['0.1'])
  }
  if (!info || !isPidAlive(child.pid)) {
    console.error(`启动失败：子进程 ${child.pid} 未存活。日志：${logFile}`)
    process.exitCode = 4
    return
  }
  console.log(`team-watch started pid=${child.pid}`)
  console.log(`  home : ${cfg.home}`)
  console.log(`  log  : ${logFile}`)
  console.log(`  pid  : ${watchPidPath(cfg.home)}`)
}

function cmdStop(flags) {
  const cfg = cfgFor(flags)
  const info = readJson(watchPidPath(cfg.home), null)
  if (!info) {
    console.log('team-watch 未在运行（没有 pid 文件）')
    return
  }
  const pid = Number(info.pid)
  if (!isPidAlive(pid)) {
    try { fs.rmSync(watchPidPath(cfg.home), { force: true }) } catch { /* ignore */ }
    try { fs.rmSync(lockPathOf(cfg.home), { force: true }) } catch { /* ignore */ }
    console.log(`pid ${pid} 已不在，清理残留 pid/lock`)
    return
  }
  if (!isOurWatchProcess(pid)) {
    console.error(`拒绝停止 pid=${pid}：cmdline 不像 team-watch watch（不做全局 kill）`)
    process.exitCode = 5
    return
  }
  process.kill(pid, 'SIGTERM')
  const deadline = Date.now() + 5000
  while (Date.now() < deadline && isPidAlive(pid)) execFileSync('sleep', ['0.1'])
  if (isPidAlive(pid)) {
    console.error(`pid ${pid} 5s 内未退出；未使用 SIGKILL，请人工核查`)
    process.exitCode = 4
    return
  }
  try { fs.rmSync(watchPidPath(cfg.home), { force: true }) } catch { /* ignore */ }
  try { fs.rmSync(lockPathOf(cfg.home), { force: true }) } catch { /* ignore */ }
  console.log(`team-watch stopped pid=${pid}`)
}

/* -------------------------------- main ---------------------------------- */

function help() {
  console.log(`team-watch —— 协作监测（只采事实，不调模型）

用法：
  node tools/team-watch/watch.mjs scan [--json] [--config <json>]
  node tools/team-watch/watch.mjs emit --task <ID> --agent <lane> --event delivery-ready|blocked|test-failed|integrated \\
       [--sha <sha>] [--artifact <path>] [--next-action "…"] [--event-id <id>]
  node tools/team-watch/watch.mjs watch [--interval 60000] [--stall-ms 1800000] [--once] [--config <json>]
  node tools/team-watch/watch.mjs status [--json]
  node tools/team-watch/watch.mjs ack --event <event_id> [--by <lane>] [--note "…"]
  node tools/team-watch/watch.mjs start [--interval 60000]
  node tools/team-watch/watch.mjs stop

共享目录从 git common-dir 解析（四个 worktree 共用）；可用 --config / TEAM_WATCH_CONFIG 覆盖。
事件只是记录：不会唤醒当前会话/模型，ack 只代表已读，不代表验收完成。`)
}

async function main() {
  const argv = process.argv.slice(2)
  const cmd = argv[0]
  const flags = parseArgs(argv.slice(1))
  try {
    switch (cmd) {
      case 'scan': await cmdScan(flags); break
      case 'emit': cmdEmit(flags); break
      case 'watch': await cmdWatch(flags); break
      case 'status': cmdStatus(flags); break
      case 'ack': cmdAck(flags); break
      case 'start': cmdStart(flags); break
      case 'stop': cmdStop(flags); break
      case 'help':
      case undefined:
      case '--help': help(); break
      default:
        console.error(`未知命令：${cmd}`)
        help()
        process.exitCode = 2
    }
  } catch (e) {
    if (e instanceof ConfigError || e.code === 'INVALID_EVENT' || e.code === 'EVENT_NOT_FOUND' || e.code === 'INVALID_ACK') {
      console.error(`错误：${e.message}`)
      process.exitCode = e.code === 'EVENT_NOT_FOUND' ? 4 : 2
    } else if (e.name === 'LockError') {
      console.error(`锁错误：${e.message}`)
      process.exitCode = 5
    } else {
      console.error(`未处理异常：${e.stack || e.message}`)
      process.exitCode = 1
    }
  }
}

main()
