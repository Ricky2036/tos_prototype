#!/usr/bin/env node
/**
 * CALLBACK-02 审查复现脚本（自包含，可直接在仓库根运行）
 *
 *   node docs/reviews/callback-02/run-tests.mjs [--bin <被审 bin 目录>]
 *
 * - 默认被审目录：主仓 .local-evidence/callback-02/bin
 * - stub 与本脚本**同目录**（docs/reviews/callback-02/codex-stub.mjs），按脚本自身位置解析，
 *   不依赖 cwd
 * - 所有用例使用独立 CB02_HOME（/tmp/cb02-review/<case>），不触碰共享运行目录、不调真实模型
 * - 输出 results.json：含被审文件完整 sha256、每例退出码与关键观察
 *
 * 退出码：0 全部用例执行完成（不代表被审实现通过，结论见 review.md）
 */
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const STUB = path.join(HERE, 'codex-stub.mjs')
const argv = process.argv.slice(2)
const binArg = argv.indexOf('--bin')
const BIN = binArg >= 0 ? path.resolve(argv[binArg + 1])
  : '/Users/jingzhan.chen/Workbuddy/2026-08-02-23-04-06/.local-evidence/callback-02/bin'
const TMP = '/tmp/cb02-review'
const THREAD = 'thread-stub-0001'

if (!fs.existsSync(STUB)) { console.error(`缺少 stub：${STUB}`); process.exit(2) }
if (!fs.existsSync(path.join(BIN, 'finish.mjs'))) { console.error(`被审目录无效：${BIN}`); process.exit(2) }

function versions () {
  const out = {}
  for (const f of ['finish.mjs', 'ack.mjs', 'unlock.mjs', 'status.mjs']) {
    const p = path.join(BIN, f)
    out[f] = fs.existsSync(p) ? crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') : null
  }
  return out
}

const ART = path.join(HERE, '.artifacts')
fs.mkdirSync(ART, { recursive: true })
fs.writeFileSync(path.join(ART, 'a.txt'), 'evidence-A\n')
fs.writeFileSync(path.join(ART, 'b.txt'), 'evidence-B\n')

function home (name, { seedState = true } = {}) {
  const h = path.join(TMP, name)
  fs.rmSync(h, { recursive: true, force: true })
  fs.mkdirSync(h, { recursive: true })
  if (seedState) {
    fs.writeFileSync(path.join(h, 'state.json'),
      JSON.stringify({ session_id: THREAD, repo_root: '/tmp/fake-repo' }))
  }
  return h
}

function run (tool, args, { h, receipt = 'accepted', nextTask = '', eventId = '' }) {
  const calls = path.join(h, 'calls.txt')
  const r = spawnSync(process.execPath, [path.join(BIN, tool), ...args], {
    encoding: 'utf8',
    env: { ...process.env, CB02_HOME: h, CODEX_BIN: STUB, STUB_CALLS_FILE: calls,
      STUB_RECEIPT: receipt, STUB_NEXT_TASK: nextTask, STUB_EVENT_ID: eventId, STUB_THREAD: THREAD },
  })
  const n = fs.existsSync(calls) ? fs.readFileSync(calls, 'utf8').trim().split('\n').filter(Boolean).length : 0
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}`.trim(), calls: n }
}

const args = (task, commits, art) => ['--task', task, '--producer', 'dsh', '--status', 'review',
  '--commits', commits, '--artifact', art]
const cases = []
const rec = (id, what, obs) => { cases.push({ id, what, ...obs }); console.log(`${id.padEnd(4)} ${what}: ${JSON.stringify(obs)}`) }

// T0 首次 boot（无 state.json）
{
  const h = home('T0', { seedState: false })
  const r = run('finish.mjs', [...args('T0', 'abc1234', path.join(ART, 'a.txt')), '--event-id', 'EV-T0-0001'], { h, eventId: 'EV-T0-0001' })
  rec('T0', '首次 boot（无 state）', { code: r.code, stateWritten: fs.existsSync(path.join(h, 'state.json')) })
}

// T1 幂等：同 id 同内容二次提交
{
  const h = home('T1')
  const a = run('finish.mjs', [...args('T1', 'abc1234', path.join(ART, 'a.txt')), '--event-id', 'EV-T1-0001'], { h, eventId: 'EV-T1-0001' })
  const b = run('finish.mjs', [...args('T1', 'abc1234', path.join(ART, 'a.txt')), '--event-id', 'EV-T1-0001'], { h, eventId: 'EV-T1-0001' })
  rec('T1', '重复事件返回原回执、不重复调用模型', {
    first: a.code, dup: b.code,
    callsAfterFirst: a.calls, callsAfterDup: b.calls, extraModelCalls: b.calls - a.calls,
    dupOut: b.out.split('\n').pop(),
  })
}

// T2 rejected 回执处理
{
  const h = home('T2')
  const r = run('finish.mjs', [...args('T2', 'abc1234', path.join(ART, 'a.txt')), '--event-id', 'EV-T2-0001'], { h, receipt: 'rejected', eventId: 'EV-T2-0001' })
  const ledger = fs.existsSync(path.join(h, 'ledger.json')) ? JSON.parse(fs.readFileSync(path.join(h, 'ledger.json'), 'utf8')) : { tasks: {} }
  const ack = run('ack.mjs', ['--event', 'EV-T2-0001', '--summary', '尝试消费 rejected 回执'], { h })
  rec('T2', 'delivery=rejected 不得按送达处理', { finishCode: r.code, ledgerHasTask: Boolean(ledger.tasks.T2), ackCode: ack.code })
}

// T2b 同 ID 改内容
{
  const h = home('T2b')
  run('finish.mjs', [...args('T2b', 'abc1234', path.join(ART, 'a.txt')), '--event-id', 'EV-T2B-001'], { h, eventId: 'EV-T2B-001' })
  const r2 = run('finish.mjs', [...args('T2b', 'abc1234', path.join(ART, 'b.txt')), '--event-id', 'EV-T2B-001'], { h, eventId: 'EV-T2B-001' })
  const conflict = fs.existsSync(path.join(h, 'receipts/EV-T2B-001.conflict.json'))
    || (fs.existsSync(path.join(h, 'receipts/EV-T2B-001.json'))
      && /conflict/i.test(fs.readFileSync(path.join(h, 'receipts/EV-T2B-001.json'), 'utf8')))
  rec('T2b', '同 ID 内容冲突：拒绝且留下结构化记录', { code: r2.code, structured: conflict })
}

// T3 next_task 必须是 null
{
  const h = home('T3')
  const r = run('finish.mjs', [...args('T3', 'abc1234', path.join(ART, 'a.txt')), '--event-id', 'EV-T3-0001'], { h, nextTask: 'string', eventId: 'EV-T3-0001' })
  const rf = path.join(h, 'receipts/EV-T3-0001.json')
  const err = fs.existsSync(rf) ? (JSON.parse(fs.readFileSync(rf, 'utf8')).error || '') : ''
  rec('T3', '未批准 next_task 必须被拒', { code: r.code, error: String(err).slice(0, 60) })
}

// T4 失败回执不标送达
{
  const h = home('T4')
  const r = run('finish.mjs', [...args('T4', 'abc1234', path.join(ART, 'a.txt')), '--event-id', 'EV-T4-0001'], { h, receipt: 'fail', eventId: 'EV-T4-0001' })
  const ledger = fs.existsSync(path.join(h, 'ledger.json')) ? JSON.parse(fs.readFileSync(path.join(h, 'ledger.json'), 'utf8')) : { tasks: {} }
  const ack = run('ack.mjs', ['--event', 'EV-T4-0001', '--summary', '尝试消费失败回执'], { h })
  rec('T4', '模型失败不标送达、不可消费', { finishCode: r.code, ledgerHasTask: Boolean(ledger.tasks.T4), ackCode: ack.code })
}

// T5 残留锁：活 pid 拒绝、死 pid 释放
{
  const h = home('T5')
  const lock = path.join(h, '.lock')
  fs.mkdirSync(lock)
  fs.writeFileSync(path.join(lock, 'lockinfo.json'), JSON.stringify({ pid: 999999, at: new Date().toISOString(), host: 'test' }))
  const r = run('unlock.mjs', [], { h })
  rec('T5', '死 pid 的残留锁可被 unlock 释放', { code: r.code, lockGone: !fs.existsSync(lock) })

  const h2 = home('T5b')
  fs.mkdirSync(path.join(h2, '.lock'))
  fs.writeFileSync(path.join(h2, '.lock/lockinfo.json'), JSON.stringify({ pid: process.pid, at: new Date().toISOString(), host: 'test' }))
  const r2 = run('unlock.mjs', [], { h: h2 })
  rec('T5b', '活 pid 的锁不得被强抢', { code: r2.code, lockKept: fs.existsSync(path.join(h2, '.lock')) })
}

// T6 并发 ack
{
  const h = home('T6')
  run('finish.mjs', [...args('T6', 'aaa1111', path.join(ART, 'a.txt')), '--event-id', 'EV-T6-A001'], { h, eventId: 'EV-T6-A001' })
  run('finish.mjs', [...args('T6', 'bbb2222', path.join(ART, 'a.txt')), '--event-id', 'EV-T6-B001'], { h, eventId: 'EV-T6-B001' })
  const { spawn } = await import('node:child_process')
  const codes = await Promise.all(['EV-T6-A001', 'EV-T6-B001'].map((ev) => new Promise((res) => {
    const c = spawn(process.execPath, [path.join(BIN, 'ack.mjs'), '--event', ev, '--summary', '并发消费'],
      { env: { ...process.env, CB02_HOME: h }, stdio: 'ignore' })
    c.on('exit', (code) => res(code))
  })))
  rec('T6', '并发 ack 串行化（不丢更新）', { codes: codes.sort(), consumed: fs.readdirSync(path.join(h, 'consumed')).length })
}

// T7 成功返回后锁必须被释放
{
  const h = home('T7')
  const r = run('finish.mjs', [...args('T7', 'abc1234', path.join(ART, 'a.txt')), '--event-id', 'EV-T7-0001'], { h, eventId: 'EV-T7-0001' })
  rec('T7', 'finish 成功后 .lock 必须不存在', { code: r.code, lockGone: !fs.existsSync(path.join(h, '.lock')) })
  const r2 = run('ack.mjs', ['--event', 'EV-T7-0001', '--summary', '消费'], { h })
  rec('T7b', 'ack 成功后 .lock 必须不存在', { code: r2.code, lockGone: !fs.existsSync(path.join(h, '.lock')) })
}

const result = { reviewed: versions(), reviewedAt: new Date().toISOString(), bin: BIN, node: process.version, cases }
fs.writeFileSync(path.join(HERE, 'results.json'), JSON.stringify(result, null, 2) + '\n')
console.log(`\n已写 ${path.join(HERE, 'results.json')}`)
