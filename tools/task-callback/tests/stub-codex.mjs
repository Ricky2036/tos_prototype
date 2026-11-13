#!/usr/bin/env node
// stub codex for callback-02 tests
// argv 含 'resume' -> resume 模式；否则 boot 模式
// STUB_MODE: ok | fail | badreceipt | wrongthread | badjson | nexttask | rejected
import { writeFileSync } from 'node:fs'
const mode = process.env.STUB_MODE || 'ok'
const isResume = process.argv.includes('resume')
const prompt = process.argv[process.argv.length - 1]
const mId = prompt.match(/event_id=([0-9a-zA-Z_-]+)/)
const evId = isResume && mId ? mId[1] : 'boot'
const SESSION = 'stub-session-cb02'

if (mode === 'fail') { process.stderr.write('stub: network down\n'); process.exit(1) }

const thread = (mode === 'wrongthread' && isResume) ? 'other-thread' : SESSION
const lines = [
  JSON.stringify({ type: 'thread.started', thread_id: thread }),
  JSON.stringify({ type: 'turn.started' })
]
let receipt
if (!isResume) {
  receipt = { event_id: 'boot', delivery: 'accepted', task_status: 'blocked', findings: ['controller-ready'], next_action: '等待第一个finish事件', requires_user_review: false, next_task: null }
} else if (mode === 'badreceipt') {
  receipt = { event_id: evId, delivery: 'accepted', task_status: 'finished' /* 非法值 */ }
} else if (mode === 'nexttask') {
  // 本轮应被严格拒绝：模型自报了后继任务
  receipt = { event_id: evId, delivery: 'accepted', task_status: 'incomplete', findings: ['缺口A'], next_action: '建议做X', requires_user_review: true, next_task: 'SET-WB-02' }
} else if (mode === 'rejected') {
  // 收件无效：delivery=rejected（自相矛盾组合 task_status=complete）
  receipt = { event_id: evId, delivery: 'rejected', task_status: 'complete', findings: ['证据不足，收件无效'], next_action: '修正后重报', requires_user_review: false, next_task: null }
} else {
  receipt = { event_id: evId, delivery: 'accepted', task_status: 'incomplete', findings: ['缺口A', '缺口B'], next_action: '建议补齐', requires_user_review: true, next_task: null }
}
const text = mode === 'badjson' ? '我认为总体是不错的。' : JSON.stringify(receipt)
lines.push(JSON.stringify({ type: 'item.completed', item: { id: 'i0', type: 'agent_message', text } }))
lines.push(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 100, output_tokens: 50 } }))
process.stdout.write(lines.join('\n') + '\n')
writeFileSync(`${process.env.STUB_CALL_LOG || '/tmp/cb02-calls.log'}`, `${Date.now()} ${isResume ? 'resume' : 'boot'} ${evId}\n`, { flag: 'a' })
process.exit(0)
