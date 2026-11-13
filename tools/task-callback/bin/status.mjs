#!/usr/bin/env node
// CALLBACK-02 状态查询：跨 worktree 共用 ledger 的任务/事件/回执/消费状态一览。
// 用法：node status.mjs [--task SET-WB-01] [--json]
// 只读，不调用模型。

import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_HOME = '/Users/jingzhan.chen/Workbuddy/2026-08-02-23-04-06/.local-evidence/callback-02'
const CB02_HOME = process.env.CB02_HOME || DEFAULT_HOME
const LEDGER = path.join(CB02_HOME, 'ledger.json')
const STATE = path.join(CB02_HOME, 'state.json')
const RECEIPTS_DIR = path.join(CB02_HOME, 'receipts')
const CONSUMED_DIR = path.join(CB02_HOME, 'consumed')
const EVENTS_DIR = path.join(CB02_HOME, 'events')

function loadJSON (f, fb) { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return fb } }

const only = process.argv.includes('--task') ? process.argv[process.argv.indexOf('--task') + 1] : null
const asJSON = process.argv.includes('--json')

const state = loadJSON(STATE, {})
const ledger = loadJSON(LEDGER, { tasks: {} })
const result = { controller: state.session_id ? { session_id: state.session_id, repo_root: state.repo_root } : null, tasks: {} }

for (const [task, t] of Object.entries(ledger.tasks)) {
  if (only && task !== only) continue
  const evs = (t.events || []).map(e => {
    const consumed = fs.existsSync(path.join(CONSUMED_DIR, `${e.event_id}.json`))
      ? loadJSON(path.join(CONSUMED_DIR, `${e.event_id}.json`), {})
      : null
    return { ...e, consumed: Boolean(consumed), consumer: consumed?.consumer || null }
  })
  result.tasks[task] = {
    status: t.status, reference: t.reference, delivery: t.delivery, task_status: t.task_status,
    last_event: t.last_event, consumed_at: t.consumed_at || null, consumer: t.consumer || null, events: evs
  }
}

if (asJSON) {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
} else {
  process.stdout.write(`callback-02 status (home: ${CB02_HOME})\n`)
  process.stdout.write(`controller session: ${state.session_id || '(未建立)'}\n\n`)
  if (Object.keys(result.tasks).length === 0) process.stdout.write('(ledger 为空：还没有任何任务事件)\n')
  for (const [task, t] of Object.entries(result.tasks)) {
    process.stdout.write(`[${task}] 状态=${t.status}  delivery=${t.delivery}  task_status=${t.task_status}\n`)
    process.stdout.write(`  引用=${t.reference}  消费=${t.consumed_at ? `${t.consumed_at} by ${t.consumer}` : '未消费'}\n`)
    for (const e of t.events) {
      process.stdout.write(`  - ${e.event_id} 申报=${e.status} 收件=${e.delivery} 验收=${e.task_status} 消费=${e.consumed ? e.consumer : '否'}\n`)
    }
  }
}
process.exit(0)
