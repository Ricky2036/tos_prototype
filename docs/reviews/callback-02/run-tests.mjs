import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const BIN = '/Users/jingzhan.chen/Workbuddy/2026-08-02-23-04-06/.local-evidence/callback-02/bin'
const HERE = process.cwd()
const STUB = path.join(HERE, 'bin/codex-stub.mjs')
fs.mkdirSync('art', { recursive: true })
fs.writeFileSync('art/a.txt', 'evidence-A\n')
fs.writeFileSync('art/b.txt', 'evidence-B\n')

const THREAD = 'thread-stub-0001'
function fresh(name) {
  const home = path.join('/tmp/cb02-review', name)
  fs.rmSync(home, { recursive: true, force: true })
  fs.mkdirSync(home, { recursive: true })
  return home
}
function freshSeeded(name) {
  const home = fresh(name)
  fs.writeFileSync(path.join(home, 'state.json'), JSON.stringify({ session_id: THREAD, repo_root: '/tmp/fake-repo' }))
  return home
}
function call(bin, args, { home, receipt = 'accepted', nextTask = '', eventId = '' }) {
  const calls = path.join(home, 'calls.txt')
  const r = spawnSync(process.execPath, [path.join(BIN, bin), ...args], {
    encoding: 'utf8',
    env: { ...process.env, CB02_HOME: home, CODEX_BIN: STUB, STUB_CALLS_FILE: calls,
      STUB_RECEIPT: receipt, STUB_NEXT_TASK: nextTask, STUB_EVENT_ID: eventId, STUB_THREAD: THREAD },
  })
  const n = fs.existsSync(calls) ? fs.readFileSync(calls, 'utf8').trim().split('\n').filter(Boolean).length : 0
  return { code: r.status, out: (r.stdout || '') + (r.stderr || ''), calls: n, home }
}
const base = (task, commits, art) => ['--task', task, '--producer', 'workbuddy', '--status', 'review',
  '--commits', commits, '--artifact', art]

const results = []
const say = (k, v) => { results.push({ k, v }); console.log(`${k}: ${v}`) }

// T0 首次 boot：无 state.json，验证能否建立主控并继续
{
  const home = fresh('T0')
  const r = call('finish.mjs', [...base('T0', 'abc1234', 'art/a.txt'), '--event-id', 'EV-T0-0001'], { home, eventId: 'EV-T0-0001' })
  const hasState = fs.existsSync(path.join(home, 'state.json'))
  const rec = fs.existsSync(path.join(home, 'receipts/EV-T0-0001.json'))
    ? JSON.parse(fs.readFileSync(path.join(home, 'receipts/EV-T0-0001.json'), 'utf8')) : null
  say('T0 首次boot', `code=${r.code} state=${hasState} receipt=${Boolean(rec && rec.receipt)} err=${(rec && rec.error) || '-'}`)
}


// T1 幂等：同 id 同内容二次提交，不应重复调用模型
{
  const home = freshSeeded('T1')
  const a = call('finish.mjs', [...base('T1', 'fd1cce2', 'art/a.txt'), '--event-id', 'EV-T1-0001'], { home, eventId: 'EV-T1-0001' })
  const b = call('finish.mjs', [...base('T1', 'fd1cce2', 'art/a.txt'), '--event-id', 'EV-T1-0001'], { home, eventId: 'EV-T1-0001' })
  say('T1 首次', `code=${a.code} calls=${a.calls}`)
  say('T1 重复', `code=${b.code} calls=${b.calls} :: ${b.out.trim().split('\n').pop()}`)
}

// T2 rejected 回执后用同 id 重发，且内容已改
{
  const home = freshSeeded('T2')
  const a = call('finish.mjs', [...base('T2', 'fd1cce2', 'art/a.txt'), '--event-id', 'EV-T2-0001'], { home, receipt: 'rejected', eventId: 'EV-T2-0001' })
  const b = call('finish.mjs', [...base('T2', 'fd1cce2', 'art/b.txt'), '--event-id', 'EV-T2-0001'], { home, receipt: 'accepted', eventId: 'EV-T2-0001' })
  const ev = JSON.parse(fs.readFileSync(path.join(home, 'events/EV-T2-0001.json'), 'utf8'))
  say('T2 首次(rejected)', `code=${a.code} calls=${a.calls}`)
  say('T2 重发(改内容)', `code=${b.code} calls=${b.calls} :: ${b.out.trim().split('\n').pop()}`)
  say('T2 事件里最终 artifact', JSON.stringify(ev.artifacts.map(x => x.path)))
}

// T3 next_task 字符串未经批准
{
  const home = freshSeeded('T3')
  const r = call('finish.mjs', [...base('T3', 'fd1cce2', 'art/a.txt'), '--event-id', 'EV-T3-0001'],
    { home, nextTask: 'string', eventId: 'EV-T3-0001' })
  const rf = path.join(home, 'receipts/EV-T3-0001.json')
  const rec = fs.existsSync(rf) ? JSON.parse(fs.readFileSync(rf, 'utf8')) : null
  say('T3 next_task=字符串', `code=${r.code} 有回执=${Boolean(rec)} 接受=${rec?.receipt?.next_task === 'SET-NEW-99'} :: ${r.out.trim().split('\n').pop()}`)
}

// T4 失败回执不标送达
{
  const home = freshSeeded('T4')
  const r = call('finish.mjs', [...base('T4', 'fd1cce2', 'art/a.txt'), '--event-id', 'EV-T4-0001'], { home, receipt: 'fail', eventId: 'EV-T4-0001' })
  const ledger = fs.existsSync(path.join(home, 'ledger.json')) ? JSON.parse(fs.readFileSync(path.join(home, 'ledger.json'), 'utf8')) : { tasks: {} }
  const ack = call('ack.mjs', ['--event', 'EV-T4-0001', '--summary', '试图消费失败回执'], { home })
  say('T4 失败回执', `finish code=${r.code} ledger有该任务=${Boolean(ledger.tasks.T4)} ack code=${ack.code} :: ${ack.out.trim().split('\n').pop()}`)
}

// T5 陈旧锁：崩溃残留后是否可恢复
{
  const home = fresh('T5')
  fs.mkdirSync(path.join(home, '.lock'))
  const r = call('finish.mjs', [...base('T5', 'fd1cce2', 'art/a.txt'), '--event-id', 'EV-T5-0001'], { home, eventId: 'EV-T5-0001' })
  const still = fs.existsSync(path.join(home, '.lock'))
  say('T5 残留 .lock', `code=${r.code} 锁仍存在=${still} :: ${r.out.trim().split('\n').pop()}`)
}


// T6 ledger 并发：同一任务两个事件并发 ack，看是否丢更新
{
  const home = freshSeeded('T6')
  call('finish.mjs', [...base('T6', 'aaa1111', 'art/a.txt'), '--event-id', 'EV-T6-A001'], { home, eventId: 'EV-T6-A001' })
  call('finish.mjs', [...base('T6', 'bbb2222', 'art/a.txt'), '--event-id', 'EV-T6-B001'], { home, eventId: 'EV-T6-B001' })
  const { spawn } = await import('node:child_process')
  const mk = (ev) => spawn(process.execPath, [path.join(BIN, 'ack.mjs'), '--event', ev, '--summary', '并发消费测试'], {
    env: { ...process.env, CB02_HOME: home }, stdio: 'ignore' })
  const codes = await Promise.all([
    new Promise(r => { const c = mk('EV-T6-A001'); c.on('exit', (code) => r(`A=${code}`)) }),
    new Promise(r => { const c = mk('EV-T6-B001'); c.on('exit', (code) => r(`B=${code}`)) }),
  ])
  const ledger = JSON.parse(fs.readFileSync(path.join(home, 'ledger.json'), 'utf8'))
  const t = ledger.tasks.T6
  const consumedFiles = ['EV-T6-A001','EV-T6-B001'].filter(e => fs.existsSync(path.join(home, `consumed/${e}.json`)))
  say('T6 并发 ack', `退出码 ${codes.sort().join(' ')} · consumed=${consumedFiles.length}/2 · ledger.status=${t.status} last_event=${t.last_event}`)
}

fs.writeFileSync('results.json', JSON.stringify(results, null, 2))
console.log('\n--- 结果已写 results.json ---')
