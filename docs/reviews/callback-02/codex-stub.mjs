#!/usr/bin/env node
// 受控 stub：模拟 codex exec / exec resume 的 JSONL 输出，回执由环境变量决定
import fs from 'node:fs'
const mode = process.env.STUB_RECEIPT || 'accepted'
const calls = process.env.STUB_CALLS_FILE
if (calls) fs.appendFileSync(calls, JSON.stringify(process.argv.slice(2)) + '\n')
const threadId = process.env.STUB_THREAD || 'thread-stub-0001'
const isBoot = process.argv.includes('boot') || (process.argv[2] === 'exec' && !process.argv.includes('resume'))
const prompt = process.argv.join(' ')
const m = prompt.match(/event_id=(EV-[A-Za-z0-9_-]+)/)
const receipt = {
  event_id: m ? m[1] : 'boot',
  delivery: mode === 'rejected' ? 'rejected' : 'accepted',
  task_status: mode === 'incomplete' ? 'incomplete' : 'complete',
  findings: ['stub finding'],
  next_action: 'noop',
  requires_user_review: false,
  next_task: (process.env.STUB_NEXT_TASK === 'string' ? 'SET-NEW-99' : null),
}
const out = [
  JSON.stringify({ type: 'thread.started', thread_id: threadId }),
  JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify(receipt) } }),
  JSON.stringify({ type: 'turn.completed', usage: { total_tokens: 10 } }),
].join('\n')
process.stdout.write(out + '\n')
if (mode === 'fail') process.exit(1)
