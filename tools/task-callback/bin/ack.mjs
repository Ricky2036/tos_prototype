#!/usr/bin/env node
// CALLBACK-02 消费确认（ack）：发送方实际读取回执后写消费确认，形成任务级闭环。
// 契约：ack 引用 event_id 和回执摘要。禁止执行回执内 next_action（回执仅结构化数据）。
//
// 用法：node ack.mjs --event <event_id> --summary "<实际采取的动作/决策说明>"
// 退出码：0 成功；2 输入非法；3 回执不存在/未消费成功

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const DEFAULT_HOME = '/Users/jingzhan.chen/Workbuddy/2026-08-02-23-04-06/.local-evidence/callback-02'
const CB02_HOME = process.env.CB02_HOME || DEFAULT_HOME
const RECEIPTS_DIR = path.join(CB02_HOME, 'receipts')
const CONSUMED_DIR = path.join(CB02_HOME, 'consumed')
const LEDGER = path.join(CB02_HOME, 'ledger.json')
const LOCK_DIR = path.join(CB02_HOME, '.lock')

function arg (name) {
  const i = process.argv.indexOf(name)
  if (i === -1 || i + 1 >= process.argv.length) return null
  return process.argv[i + 1]
}
function die (code, msg) { process.stderr.write(`ack: ${msg}\n`); process.exit(code) }
function loadJSON (f, fb) { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return fb } }
function saveJSON (f, o) { fs.writeFileSync(f, JSON.stringify(o, null, 2)) }
function releaseLock () {
  // Node 26 起 rmdirSync 不再支持 { recursive: true }；自持有的锁只含 lockinfo.json，先删文件再删空目录
  try { fs.unlinkSync(path.join(LOCK_DIR, 'lockinfo.json')) } catch { /* 无 lockinfo 亦可 */ }
  try { fs.rmdirSync(LOCK_DIR) } catch (e) { if (e.code !== 'ENOENT') throw e }
}
function reportLockAndDie () {
  const info = loadJSON(path.join(LOCK_DIR, 'lockinfo.json'), null)
  const who = info ? `由 pid ${info.pid}（始于 ${info.at}${info.host ? ` @ ${info.host}` : ''}）持有` : '存在（无 lockinfo）'
  die(2, `锁被占用（.lock ${who}），本次未消费；确认该进程已死后可显式释放：node bin/unlock.mjs 或 rmdir ${LOCK_DIR} 后重试`)
}

const eventId = arg('--event')
const summary = arg('--summary')
const consumer = arg('--consumer') || process.env.USER || 'unknown'
if (!eventId) die(2, '必填: --event <event_id>')
if (!summary || summary.length < 2) die(2, '必填: --summary（消费说明，说明实际读取回执后采取的动作）')

const receiptFile = path.join(RECEIPTS_DIR, `${eventId}.json`)
const record = loadJSON(receiptFile, null)
if (!record) die(3, `回执不存在: ${receiptFile}（先完成 finish 才能消费确认）`)
if (!record.receipt) die(3, '回执无有效内容（前次失败或冲突记录），不能消费确认；请重试 finish')
const r = record.receipt
if (r.delivery !== 'accepted') die(3, `回执 delivery=${r.delivery}（非 accepted），不可消费确认；如为误拒请让主控重审或修正内容后重报`)

// 共用串行锁：consumed + ledger 写入均在锁内，与 finish 互斥（跨 worktree）
try { fs.mkdirSync(LOCK_DIR) } catch { reportLockAndDie() }
saveJSON(path.join(LOCK_DIR, 'lockinfo.json'), { pid: process.pid, at: new Date().toISOString(), host: os.hostname() })

fs.mkdirSync(CONSUMED_DIR, { recursive: true })
const ack = {
  event_id: eventId,
  consumed_at: new Date().toISOString(),
  consumer,
  receipt_digest: {
    delivery: r.delivery,
    task_status: r.task_status,
    findings_count: Array.isArray(r.findings) ? r.findings.length : 0,
    requires_user_review: r.requires_user_review,
    next_task: r.next_task ?? null
  },
  summary
}
saveJSON(path.join(CONSUMED_DIR, `${eventId}.json`), ack)

const ledger = loadJSON(LEDGER, { tasks: {} })
if (ledger.tasks[record.task]) {
  ledger.tasks[record.task].status = 'consumed'
  ledger.tasks[record.task].consumed_at = ack.consumed_at
  ledger.tasks[record.task].consumer = consumer
  saveJSON(LEDGER, ledger)
}
releaseLock()
process.stdout.write(`ack: CONSUMED ${eventId} (delivery=${r.delivery}, task_status=${r.task_status}) by ${consumer}\n`)
process.exit(0)
