#!/usr/bin/env node
/**
 * outbox CLI
 *   node tools/agent-bridge/outbox-cli.mjs summary
 *   node tools/agent-bridge/outbox-cli.mjs add done --task SET-DSH-01 --sha <sha> [--payload '{"k":"v"}']
 *   node tools/agent-bridge/outbox-cli.mjs list [--state pending|failed]
 *   node tools/agent-bridge/outbox-cli.mjs attempt <id> [--error "原因"]
 *   node tools/agent-bridge/outbox-cli.mjs deliver <id> --receipt "对方确认的证据"
 *
 * 注意：deliver 必须给回执。没回执的投递一律算 pending，不算成功。
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  emptyBox, enqueue, loadBox, pending, recordAttempt, recordDelivered, saveBox, summarize,
} from './outbox.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const BOX = path.join(ROOT, '.tasks/events/outbox.json')

const argv = process.argv.slice(2)
const cmd = argv[0]
const getArg = (n, d = null) => {
  const i = argv.indexOf(`--${n}`)
  return i >= 0 ? argv[i + 1] : d
}

const box = loadBox(BOX)
const save = () => { saveBox(BOX, box); return box }

if (cmd === 'summary') {
  console.log(JSON.stringify(summarize(box), null, 2))
} else if (cmd === 'list') {
  const st = getArg('state')
  const rows = st ? box.events.filter((e) => e.state === st) : box.events
  for (const e of rows) {
    console.log(`${e.state.padEnd(9)} ${e.type.padEnd(8)} ${e.task}  ${String(e.sha).slice(0, 8)}  attempts=${e.attempts}  ${e.id}`)
  }
  if (!rows.length) console.log('（空）')
} else if (cmd === 'add') {
  const type = argv[1]
  const payload = getArg('payload')
  const { event, created } = enqueue(box, {
    type, task: getArg('task'), sha: getArg('sha'),
    payload: payload ? JSON.parse(payload) : {},
  })
  save()
  console.log(created ? `已入队 ${event.id}` : `已存在（去重）${event.id}`)
} else if (cmd === 'attempt') {
  const e = recordAttempt(box, argv[1], { error: getArg('error') })
  save()
  console.log(`${e.id} attempts=${e.attempts} state=${e.state}`)
} else if (cmd === 'deliver') {
  const e = recordDelivered(box, argv[1], { receipt: getArg('receipt') })
  save()
  console.log(`${e.id} → delivered，回执：${e.receipt}`)
} else {
  console.log('用法见文件头注释')
  process.exit(2)
}
