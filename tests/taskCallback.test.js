// callback-02 finish/ack/status 契约测试（stub codex 注入，不联网、不真调模型）
// 运行：node --test .local-evidence/callback-02/tests/taskCallback.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const STUB = path.join(HERE, '../tools/task-callback/tests/stub-codex.mjs')
const FINISH = path.join(HERE, '../tools/task-callback/bin/finish.mjs')
const ACK = path.join(HERE, '../tools/task-callback/bin/ack.mjs')
const STATUS = path.join(HERE, '../tools/task-callback/bin/status.mjs')

const EV = '11111111-1111-4111-8111-111111111111'

function freshHome () {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'cb02-home-'))
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'cb02-repo-'))
  fs.writeFileSync(path.join(repo, 'deliverable.md'), '# snapshot\ncontent\n')
  const callLog = path.join(home, 'calls.log')
  const wrapper = path.join(home, 'codex-wrapper.sh')
  fs.writeFileSync(wrapper, `#!/bin/sh\nexec "${process.execPath}" "${STUB}" "$@"\n`)
  fs.chmodSync(wrapper, 0o755)
  return { home, repo, callLog, wrapper }
}

function envOf (p, mode = 'ok') {
  return { ...process.env, CB02_HOME: p.home, CODEX_BIN: p.wrapper, STUB_MODE: mode, STUB_CALL_LOG: p.callLog }
}

function finish (p, opts = {}) {
  const args = ['--task', opts.task || 'T-01', '--producer', opts.producer || 'wb',
    '--status', opts.status || 'review', '--commits', opts.commits || 'abc1234',
    '--artifact', opts.artifact || 'deliverable.md', '--repo', p.repo]
  if (opts.eventId) args.push('--event-id', opts.eventId)
  const r = spawnSync('node', [FINISH, ...args], { cwd: p.repo, encoding: 'utf8', env: envOf(p, opts.mode) })
  return r
}

const callCount = (p) =>
  fs.existsSync(p.callLog) ? fs.readFileSync(p.callLog, 'utf8').trim().split('\n').filter(Boolean).length : 0
const ledgerOf = (p) => {
  const f = path.join(p.home, 'ledger.json')
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { tasks: {} }
}

test('正常流：boot 建立主控 + resume 审查 -> 回执落盘 + ledger 登记', () => {
  const p = freshHome()
  const r = finish(p, { eventId: EV })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  const state = JSON.parse(fs.readFileSync(path.join(p.home, 'state.json'), 'utf8'))
  assert.equal(state.session_id, 'stub-session-cb02')
  const rec = JSON.parse(fs.readFileSync(path.join(p.home, 'receipts', `${EV}.json`), 'utf8'))
  assert.equal(rec.receipt.delivery, 'accepted')
  assert.equal(rec.receipt.task_status, 'incomplete')
  assert.ok(Array.isArray(rec.receipt.findings))
  assert.equal(rec.receipt.next_task, null)
  assert.equal(rec.thread_id, 'stub-session-cb02')
  assert.equal(rec.usage.output_tokens, 50)
  assert.ok(fs.existsSync(path.join(p.home, 'events', `${EV}.json`)))
  assert.ok(fs.existsSync(path.join(p.home, 'runs', `${EV}.jsonl`)))
  const ledger = JSON.parse(fs.readFileSync(path.join(p.home, 'ledger.json'), 'utf8'))
  assert.equal(ledger.tasks['T-01'].status, 'review')
  assert.equal(ledger.tasks['T-01'].task_status, 'incomplete')
  assert.ok(!fs.existsSync(path.join(p.home, '.lock')))
})

test('重复事件：返回原回执，不额外调用模型', () => {
  const p = freshHome()
  finish(p, { eventId: EV })
  const calls1 = callCount(p)
  const again = finish(p, { eventId: EV })
  assert.equal(again.status, 0)
  assert.match(again.stdout, /DUPLICATE/)
  assert.equal(callCount(p), calls1, '重复事件不得再次调用模型')
})

test('缺证据不填成通过：缺 commits / 缺 artifact / 非法 status -> exit 2', () => {
  const p = freshHome()
  const noCommits = spawnSync('node', [FINISH, '--task', 'T', '--producer', 'wb', '--status', 'review', '--artifact', 'deliverable.md', '--repo', p.repo], { env: envOf(p) })
  assert.equal(noCommits.status, 2)
  const noArtifact = spawnSync('node', [FINISH, '--task', 'T', '--producer', 'wb', '--status', 'review', '--commits', 'abc', '--repo', p.repo], { env: envOf(p) })
  assert.equal(noArtifact.status, 2)
  const badStatus = finish(p, { status: 'ship-it' })
  assert.equal(badStatus.status, 2)
  assert.equal(callCount(p), 0, '输入校验失败不得调用模型')
})

test('失败可重试：codex 失败 -> exit 3 未标送达，事件保留，重试成功', () => {
  const p = freshHome()
  const r1 = finish(p, { eventId: EV, mode: 'fail' })
  assert.equal(r1.status, 3)
  const rec = JSON.parse(fs.readFileSync(path.join(p.home, 'receipts', `${EV}.json`), 'utf8'))
  assert.match(rec.error, /network down|退出码 1/)
  assert.deepEqual(Object.keys(ledgerOf(p).tasks), [], '失败不得标送达')
  assert.ok(fs.existsSync(path.join(p.home, 'events', `${EV}.json`)), '事件文件保留供重试')
  const r2 = finish(p, { eventId: EV })
  assert.equal(r2.status, 0, r2.stdout + r2.stderr)
  assert.equal(ledgerOf(p).tasks['T-01'].delivery, 'accepted')
})

test('回执契约校验：task_status 非法 / thread 不符 / 非 JSON / next_task 非 null -> exit 3 未标送达', () => {
  for (const mode of ['badreceipt', 'wrongthread', 'badjson', 'nexttask']) {
    const p = freshHome()
    const r = finish(p, { eventId: EV, mode })
    assert.equal(r.status, 3, `mode=${mode}: ${r.stdout}${r.stderr}`)
    assert.deepEqual(Object.keys(ledgerOf(p).tasks), [], `mode=${mode} 不得标送达`)
  }
})

test('锁内去重/拒重：同ID同内容才去重，同ID异内容拒绝', () => {
  const p = freshHome()
  const r1 = finish(p, { eventId: EV })
  assert.equal(r1.status, 0, r1.stdout + r1.stderr)
  const calls1 = callCount(p)
  // 同 ID 同内容 -> DUPLICATE，不调模型
  const dup = finish(p, { eventId: EV })
  assert.equal(dup.status, 0)
  assert.match(dup.stdout, /DUPLICATE/)
  assert.equal(callCount(p), calls1, '同内容重复不得再次调用模型')
  // 同 ID 异内容（不同 status）-> REJECT exit 2，不标 ledger、不调模型
  const rej = finish(p, { eventId: EV, status: 'done' })
  assert.equal(rej.status, 2, rej.stdout + rej.stderr)
  assert.match(rej.stdout, /REJECT/)
  assert.equal(callCount(p), calls1, '拒绝路径不得调用模型')
  assert.equal(ledgerOf(p).tasks['T-01'].status, 'review', 'REJECT 不得改 ledger 状态')
  // 异内容重试失败：即便再次以异内容提交，仍是 REJECT（不覆盖）
  const rej2 = finish(p, { eventId: EV, status: 'done' })
  assert.equal(rej2.status, 2)
})

test('ack 也走共用锁：锁被占用时退出 2 不写 ledger', () => {
  const p = freshHome()
  finish(p, { eventId: EV })
  fs.mkdirSync(path.join(p.home, '.lock'))
  const r = spawnSync('node', [ACK, '--event', EV, '--summary', '回执已读'], { encoding: 'utf8', env: envOf(p) })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /锁被占用/)
  assert.equal(ledgerOf(p).tasks['T-01'].status, 'review', '锁冲突时 ack 不得改 ledger')
})

test('P0 空状态首跑 boot：controllerPrompt 不崩，runs/boot.jsonl 生成', () => {
  // 全新 home（无 state.json）触发 boot 分支，调用 controllerPrompt(eventFile)
  const p = freshHome()
  const r = finish(p, { eventId: EV })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.ok(fs.existsSync(path.join(p.home, 'runs', 'boot.jsonl')), 'boot 路径必须实际执行（证明 controllerPrompt 未 ReferenceError）')
  const state = JSON.parse(fs.readFileSync(path.join(p.home, 'state.json'), 'utf8'))
  assert.equal(state.session_id, 'stub-session-cb02')
})

test('P1 回执被拒收：delivery=rejected 不算成功（exit 3），保留记录但 ack 不可消费', () => {
  const p = freshHome()
  const r = finish(p, { eventId: EV, mode: 'rejected' })
  assert.equal(r.status, 3, r.stdout + r.stderr)
  assert.match(r.stdout, /REJECTED/)
  const rec = JSON.parse(fs.readFileSync(path.join(p.home, 'receipts', `${EV}.json`), 'utf8'))
  assert.equal(rec.receipt.delivery, 'rejected')
  // ledger 仅记录 delivery=rejected，不标送达/可消费
  const ledger = ledgerOf(p)
  assert.equal(ledger.tasks['T-01'].delivery, 'rejected')
  assert.notEqual(ledger.tasks['T-01'].status, 'consumed')
  // ack 必须拒绝消费非 accepted 回执
  const ack = spawnSync('node', [ACK, '--event', EV, '--summary', '试图消费被拒回执'], { encoding: 'utf8', env: envOf(p) })
  assert.equal(ack.status, 3)
  assert.match(ack.stderr, /非 accepted/)
  assert.equal(ledgerOf(p).tasks['T-01'].status, 'idle', '被拒回执不得被消费，任务不得提升状态')
})

test('P1 同ID异内容拒绝：写结构化冲突记录，不覆盖原回执，ack 不可消费', () => {
  const p = freshHome()
  const r1 = finish(p, { eventId: EV })
  assert.equal(r1.status, 0, r1.stdout + r1.stderr)
  // 同 ID 改 status -> REJECT（exit 2），写冲突记录
  const rej = finish(p, { eventId: EV, status: 'done' })
  assert.equal(rej.status, 2, rej.stdout + rej.stderr)
  assert.match(rej.stdout, /REJECT/)
  const conflict = JSON.parse(fs.readFileSync(path.join(p.home, 'receipts', `${EV}.json`), 'utf8'))
  assert.equal(conflict.error, 'content-conflict')
  assert.equal(conflict.delivery, 'rejected')
  assert.ok(conflict.existing && conflict.incoming && conflict.existing !== conflict.incoming)
  // 冲突记录无 .receipt 字段 -> ack 拒绝消费
  const ack = spawnSync('node', [ACK, '--event', EV, '--summary', '消费冲突记录'], { encoding: 'utf8', env: envOf(p) })
  assert.equal(ack.status, 3)
  assert.match(ack.stderr, /无有效内容|非 accepted/)
})

test('P1 锁残留显式恢复：lockinfo 记录 pid/时间，unlock 检查进程存活不 TTL 强抢', () => {
  const p = freshHome()
  // 模拟残留锁（带 lockinfo，pid 用一个不可能存活的极大值）
  fs.mkdirSync(path.join(p.home, '.lock'))
  fs.writeFileSync(path.join(p.home, '.lock', 'lockinfo.json'), JSON.stringify({ pid: 999999, at: new Date().toISOString(), host: 'test' }))
  const r = finish(p, { eventId: EV })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /由 pid 999999/)
  // unlock 不做 TTL 强抢：pid 不存活即释放（999999 不存在）
  const unlock = spawnSync('node', [path.join(path.dirname(FINISH), 'unlock.mjs')], { encoding: 'utf8', env: { ...process.env, CB02_HOME: p.home } })
  assert.equal(unlock.status, 0, unlock.stdout + unlock.stderr)
  assert.ok(!fs.existsSync(path.join(p.home, '.lock')))
  // 释放后可正常 finish
  const again = finish(p, { eventId: EV })
  assert.equal(again.status, 0, again.stdout + again.stderr)
})

test('串行锁：锁存在 -> exit 2 未送达', () => {
  const p = freshHome()
  fs.mkdirSync(path.join(p.home, '.lock'))
  const r = finish(p, { eventId: EV })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /锁被占用/)
  assert.equal(callCount(p), 0)
})

test('ack 消费确认：引用 event_id 与回执摘要，ledger 置 consumed', () => {
  const p = freshHome()
  finish(p, { eventId: EV })
  const r = spawnSync('node', [ACK, '--event', EV, '--summary', '已读回执，缺口转待办并上报用户'], { encoding: 'utf8', env: envOf(p) })
  assert.equal(r.status, 0, r.stdout + r.stderr)
  const ack = JSON.parse(fs.readFileSync(path.join(p.home, 'consumed', `${EV}.json`), 'utf8'))
  assert.equal(ack.event_id, EV)
  assert.equal(ack.receipt_digest.delivery, 'accepted')
  assert.equal(ack.receipt_digest.task_status, 'incomplete')
  assert.equal(ack.receipt_digest.findings_count, 2)
  assert.equal(ack.receipt_digest.next_task, null)
  assert.equal(ledgerOf(p).tasks['T-01'].status, 'consumed')
})

test('ack 边界：回执不存在 / 无 summary -> 拒绝', () => {
  const p = freshHome()
  const noReceipt = spawnSync('node', [ACK, '--event', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', '--summary', '回执不存在的消费测试'], { encoding: 'utf8', env: envOf(p) })
  assert.equal(noReceipt.status, 3)
  finish(p, { eventId: EV })
  const noSummary = spawnSync('node', [ACK, '--event', EV], { encoding: 'utf8', env: envOf(p) })
  assert.equal(noSummary.status, 2)
})

test('status 查询：区分收件成功与任务未完成', () => {
  const p = freshHome()
  finish(p, { eventId: EV })
  spawnSync('node', [ACK, '--event', EV, '--summary', '已消费'], { encoding: 'utf8', env: envOf(p) })
  const r = spawnSync('node', [STATUS, '--json'], { encoding: 'utf8', env: { ...process.env, CB02_HOME: p.home } })
  assert.equal(r.status, 0)
  const out = JSON.parse(r.stdout)
  assert.equal(out.controller.session_id, 'stub-session-cb02')
  assert.equal(out.tasks['T-01'].status, 'consumed')
  assert.equal(out.tasks['T-01'].delivery, 'accepted')
  assert.equal(out.tasks['T-01'].task_status, 'incomplete', '收件 accepted 与验收 incomplete 必须能区分')
  assert.equal(out.tasks['T-01'].events[0].consumed, true)
})

test('禁止 eval 回执命令：入口脚本源码不含 eval/Function 执行面', () => {
  for (const f of [FINISH, ACK, STATUS]) {
    const src = fs.readFileSync(f, 'utf8')
    assert.ok(!src.includes('eval('), `${f} 不得含 eval(`)
    assert.ok(!src.includes('Function('), `${f} 不得含 Function(`)
  }
})
