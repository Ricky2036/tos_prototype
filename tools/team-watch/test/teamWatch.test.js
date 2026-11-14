/**
 * team-watch 测试（node --test）
 * ==============================
 * 全部跑在隔离临时目录：临时 git 仓库 + 临时共享 home。
 * 不写生产队列、不碰真实 .local-evidence、不调模型、不连外网。
 *
 * 覆盖：baseline / 无变化去重 / dirty 内容更新 / 同 ID 冲突不覆盖 /
 *       并发写 / 停工只报一次与恢复 / ack 不标 done / 坏路径 / 离线端口 /
 *       start-stop 只管理自身 pid。
 */
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolveConfig } from '../lib/config.mjs'
import { scanOnce, readSnapshot } from '../lib/scan.mjs'
import { emitEvent, ackEvent, statusData, readEvents, readConflicts } from '../lib/events.mjs'
import { buildSummary, readWatchState } from '../lib/summary.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const WATCH = path.resolve(HERE, '..', 'watch.mjs')
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'team-watch-test-'))
let seq = 0

function sh(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function makeRepo(name) {
  const dir = path.join(TMP, name)
  fs.mkdirSync(dir, { recursive: true })
  sh('git', ['init', '-q'], dir)
  sh('git', ['config', 'user.email', 'test@example.com'], dir)
  sh('git', ['config', 'user.name', 'Test'], dir)
  fs.writeFileSync(path.join(dir, 'README.md'), `# ${name}\n`)
  fs.mkdirSync(path.join(dir, '.tasks', 'queue'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.tasks', 'queue', 'Q-TEST.md'), '- status: ready\n- owner: —\n')
  fs.mkdirSync(path.join(dir, 'docs', 'reports'), { recursive: true })
  sh('git', ['add', '.'], dir)
  sh('git', ['commit', '-qm', 'init'], dir)
  return dir
}

/** 每次测试独立 home + 独立两个 root（一个执行 lane + 一个集成根） */
function makeCase(opts = {}) {
  seq += 1
  const dsh = makeRepo(`lane-${seq}`)
  const integration = makeRepo(`int-${seq}`)
  const home = path.join(TMP, `home-${seq}`)
  const cfgPath = path.join(TMP, `cfg-${seq}.json`)
  const cfgObj = {
    home,
    stallMs: opts.stallMs ?? 30 * 60 * 1000,
    intervalMs: opts.intervalMs ?? 50,
    httpTimeoutMs: opts.httpTimeoutMs ?? 400,
    lockTimeoutMs: 3000,
    roots: [
      { id: 'dsh', agent: 'dsh', role: 'execution', root: dsh, port: opts.dshPort ?? 1 },
      { id: 'integration', agent: 'integrator', role: 'integration', root: integration, port: opts.intPort ?? 1 }
    ]
  }
  fs.writeFileSync(cfgPath, JSON.stringify(cfgObj, null, 2))
  const cfg = resolveConfig({ cwd: dsh, configPath: cfgPath })
  return { dsh, integration, home, cfg, cfgPath }
}

after(() => {
  try { fs.rmSync(TMP, { recursive: true, force: true }) } catch { /* ignore */ }
})

/* ------------------------------ baseline ------------------------------ */
test('baseline：首轮只建快照，不产生变化/事件/停工', async () => {
  const c = makeCase()
  const res = await scanOnce(c.cfg)
  assert.equal(res.baseline, true)
  assert.deepEqual(res.changes, [])
  assert.deepEqual(res.stalls, [])
  assert.equal(res.errors.length, 0)
  assert.ok(fs.existsSync(path.join(c.home, 'snapshot.json')))
  assert.equal(fs.existsSync(path.join(c.home, 'events.jsonl')), false, '首轮不得写事件')
  assert.ok(['main', 'master'].includes(readSnapshot(c.cfg).roots.dsh.branch))
})

test('无变化去重：重复 scan 不产生变化，指纹稳定', async () => {
  const c = makeCase()
  const a = await scanOnce(c.cfg)
  const b = await scanOnce(c.cfg)
  assert.equal(b.baseline, false)
  assert.deepEqual(b.changes, [])
  assert.equal(a.snapshot.fingerprint, b.snapshot.fingerprint)
  assert.equal(fs.existsSync(path.join(c.home, 'events.jsonl')), false)
})

test('dirty 内容更新：同一文件内容变化也算进展（不靠 commit）', async () => {
  const c = makeCase()
  await scanOnce(c.cfg)
  const before = readSnapshot(c.cfg)
  const file = path.join(c.dsh, 'scratch.txt')
  fs.writeFileSync(file, 'one')
  const s1 = await scanOnce(c.cfg)
  assert.ok(s1.changes.some((x) => x.kind === 'dirty'))
  assert.equal(s1.snapshot.roots.dsh.dirty.count, 1)
  // 路径/状态都不变，只改内容
  fs.writeFileSync(file, 'two')
  const s2 = await scanOnce(c.cfg)
  assert.ok(s2.changes.some((x) => x.kind === 'dirty'), '同路径内容变化必须被识别')
  assert.notEqual(before.roots.dsh.dirty.hash, s2.snapshot.roots.dsh.dirty.hash)
  assert.ok(new Date(s2.snapshot.roots.dsh.lastProgressAt).getTime() >= new Date(before.roots.dsh.lastProgressAt).getTime())
})

/* --------------------------- emit 幂等/冲突 --------------------------- */
test('emit：同 ID 同内容幂等；同 ID 异内容记冲突且原事件哈希不变', () => {
  const c = makeCase()
  const base = { event_id: 'E-1', task: 'Q-TEST', agent: 'dsh', event: 'delivery-ready', sha: 'abc1234', artifact: 'docs/reports/x.md', next_action: '等待集成' }
  const a = emitEvent(c.cfg, base)
  assert.equal(a.status, 'created')
  const b = emitEvent(c.cfg, base)
  assert.equal(b.status, 'duplicate')
  assert.equal(b.event.content_hash, a.event.content_hash)
  assert.equal(readEvents(c.cfg).items.length, 1)

  const cRes = emitEvent(c.cfg, { ...base, next_action: '改口了' })
  assert.equal(cRes.status, 'conflict')
  const evs = readEvents(c.cfg).items
  assert.equal(evs.length, 1, '冲突不得覆盖/追加原事件')
  assert.equal(evs[0].content_hash, a.event.content_hash)
  assert.equal(evs[0].next_action, '等待集成')
  const conflicts = readConflicts(c.cfg).items
  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].event_id, 'E-1')
})

test('并发写：多进程同时 emit，不丢不重、JSONL 无坏行', async () => {
  const c = makeCase()
  const procs = []
  for (let i = 0; i < 8; i += 1) {
    procs.push(new Promise((resolve) => {
      const child = spawn(process.execPath, [
        WATCH, 'emit', '--task', `Q-${i}`, '--agent', 'dsh', '--event', 'delivery-ready',
        '--sha', `sha${i}`, '--artifact', 'a.md', '--next-action', 'x', '--event-id', `E-${i}`,
        '--config', c.cfgPath
      ], { cwd: c.dsh, stdio: 'ignore' })
      child.on('exit', (code) => resolve(code))
    }))
  }
  const codes = await Promise.all(procs)
  assert.deepEqual(codes, new Array(8).fill(0))
  const evs = readEvents(c.cfg)
  assert.equal(evs.badLines, 0)
  assert.equal(evs.items.length, 8)
  assert.equal(new Set(evs.items.map((e) => e.event_id)).size, 8)
  assert.equal(readConflicts(c.cfg).items.length, 0)
})

/* ----------------------------- 停工/恢复 ------------------------------ */
test('停工：每段只报一次；有进展后恢复；再次停滞是新的一段', async () => {
  const c = makeCase({ stallMs: 120 })
  await scanOnce(c.cfg) // baseline
  await sleep(200)
  const s1 = await scanOnce(c.cfg)
  assert.equal(s1.stalls.filter((x) => x.root === 'dsh').length, 1, '首次超时应报一次（逐 lane 一段一次）')
  const s2 = await scanOnce(c.cfg)
  assert.equal(s2.stalls.filter((x) => x.root === 'dsh').length, 0, '同一段不得重复报')
  assert.ok(readSnapshot(c.cfg).roots.dsh.stall, '快照里仍标记 stall 供 status 展示')

  fs.writeFileSync(path.join(c.dsh, 'progress.txt'), 'worked')
  const s3 = await scanOnce(c.cfg)
  assert.equal(s3.stalls.length, 0)
  assert.ok(s3.changes.some((x) => x.kind === 'dirty'))
  assert.equal(readSnapshot(c.cfg).roots.dsh.stall, null, '有进展应清除 stall')

  await sleep(200)
  const s4 = await scanOnce(c.cfg)
  assert.equal(s4.stalls.filter((x) => x.root === 'dsh').length, 1, '恢复后再次停滞是新的一段')
  assert.ok(s4.snapshot.roots.dsh.stall)
})

test('停工原因：blocked 任务卡原因进入摘要，不把「无 commit」当唯一判据', async () => {
  const c = makeCase({ stallMs: 100 })
  fs.writeFileSync(path.join(c.dsh, '.tasks', 'queue', 'Q-BLOCK.md'), '- status: blocked\n- owner: dsh\n- 阻塞：等待 AG 释放 9999 验收口\n')
  await scanOnce(c.cfg)
  await sleep(180)
  const s = await scanOnce(c.cfg)
  assert.equal(s.stalls.filter((x) => x.root === 'dsh').length, 1)
  assert.match(s.snapshot.roots.dsh.stall.reason, /等待：Q-BLOCK/)
  assert.match(s.snapshot.roots.dsh.stall.reason, /9999/)
  const summary = buildSummary(c.cfg, readSnapshot(c.cfg))
  assert.equal(summary.blocked.length, 1)
  assert.match(summary.blocked[0].reason, /9999/)
})

/* --------------------------------- ack -------------------------------- */
test('ack 只代表已读：事件状态不变、出现 ack 记录、可重复 ack 幂等', () => {
  const c = makeCase()
  const e = emitEvent(c.cfg, { event_id: 'E-ACK', task: 'Q', agent: 'dsh', event: 'integrated', sha: 'deadbee', artifact: 'x.md', next_action: '' })
  const a = ackEvent(c.cfg, { event_id: e.event.event_id, by: 'antigravity', note: '看过' })
  assert.equal(a.status, 'created')
  assert.equal(readEvents(c.cfg).items.length, 1)
  const st = statusData(c.cfg)
  assert.equal(st.events[0].event, 'integrated')
  assert.equal(st.events[0].acked, true)
  assert.equal(st.events[0].acked_by[0], 'antigravity')
  assert.equal(st.events[0].done, undefined, 'ack 不得写入 done')
  const again = ackEvent(c.cfg, { event_id: e.event.event_id, by: 'antigravity' })
  assert.equal(again.status, 'duplicate')
  assert.equal(statusData(c.cfg).acks.length, 1)
})

/* ------------------------------ 坏路径/离线 --------------------------- */
test('坏路径：配置里的 root 不存在 → 记错误但仍写快照，退出码 2', async () => {
  const c = makeCase()
  const cfgPath = path.join(TMP, `cfg-bad-${seq}.json`)
  fs.writeFileSync(cfgPath, JSON.stringify({
    home: c.home,
    stallMs: 60000,
    roots: [
      { id: 'dsh', agent: 'dsh', role: 'execution', root: c.dsh, port: 1 },
      { id: 'gone', agent: 'workbuddy', role: 'execution', root: path.join(TMP, 'does-not-exist'), port: 1 }
    ]
  }))
  const cfg = resolveConfig({ cwd: c.dsh, configPath: cfgPath })
  const res = await scanOnce(cfg)
  assert.equal(res.exitCode, 2)
  assert.equal(res.errors.length, 1)
  assert.match(res.errors[0].message, /不存在/)
  assert.ok(fs.existsSync(path.join(c.home, 'snapshot.json')))
})

test('离线端口：9999 不可达时 summary 明确 DOWN + 原因，不崩', async () => {
  const c = makeCase({ intPort: 1, httpTimeoutMs: 150 })
  await scanOnce(c.cfg)
  const summary = buildSummary(c.cfg, readSnapshot(c.cfg))
  assert.equal(summary.acceptance.up, false)
  assert.equal(summary.acceptance.port, 'http://127.0.0.1:1/')
  assert.ok(summary.acceptance.error && summary.acceptance.error.length > 0)
  assert.match(summary.acceptance.error, /ECONNREFUSED|fetch failed|timeout|Error/)
})

/* --------------------------- 生命周期 start/stop ---------------------- */
test('start/stop：只管理自身 pid，写 pid/log，stop 后进程退出且清理', async () => {
  const c = makeCase({ intervalMs: 60000 })
  const start = spawnSync(process.execPath, [WATCH, 'start', '--config', c.cfgPath], { cwd: c.dsh, encoding: 'utf8' })
  assert.equal(start.status, 0, start.stderr)
  const state = readWatchState(c.home)
  assert.equal(state.running, true)
  assert.ok(fs.existsSync(path.join(c.home, 'watch.log')))
  assert.ok(fs.existsSync(path.join(c.home, 'watch.pid')))

  const stop = spawnSync(process.execPath, [WATCH, 'stop', '--config', c.cfgPath], { cwd: c.dsh, encoding: 'utf8' })
  assert.equal(stop.status, 0, stop.stderr)
  assert.equal(readWatchState(c.home).running, false)
  assert.equal(fs.existsSync(path.join(c.home, 'watch.pid')), false)
})

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }
