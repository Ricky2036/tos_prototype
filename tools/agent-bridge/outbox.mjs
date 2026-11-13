/**
 * outbox —— 完成/阻塞/待验收事件的持久化投递队列
 * ==============================================
 * 为什么要有它：只把消息写进 inbox 文件，无法回答两个问题——
 *   「这条到底送没送出去？」「送失败了几次、还在不在？」
 *
 * 三条硬规则：
 *   1. **没有接收回执就不算 delivered。** 调用方必须给出对方确认的证据（回执文本/消息 id），
 *      本模块不接受"我调用了发送函数"当作送达。
 *   2. **按 task + sha + type 去重。** 同一件事重复跑不会刷屏。
 *   3. **失败保留，限次重试。** 超限转 failed 但记录不删，人工可查。
 */

import fs from 'node:fs'
import path from 'node:path'

export const TYPES = ['done', 'blocked', 'review']
export const MAX_ATTEMPTS = 5

export function dedupeKey({ task, sha, type }) {
  return `${task}|${String(sha).slice(0, 12)}|${type}`
}

export function emptyBox() {
  return { version: 1, events: [] }
}

export function loadBox(file) {
  if (!fs.existsSync(file)) return emptyBox()
  try {
    const d = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (!Array.isArray(d.events)) return emptyBox()
    return d
  } catch {
    return emptyBox()
  }
}

export function saveBox(file, box) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(box, null, 2) + '\n')
}

/** 入队。同 key 已存在则原样返回，不新增、不重置重试次数。 */
export function enqueue(box, { type, task, sha, payload = {}, now = new Date() }) {
  if (!TYPES.includes(type)) throw new Error(`未知事件类型：${type}（允许 ${TYPES.join('/')}）`)
  if (!task) throw new Error('缺少 task')
  if (!sha) throw new Error('缺少 sha')

  const key = dedupeKey({ task, sha, type })
  const exist = box.events.find((e) => e.key === key)
  if (exist) return { event: exist, created: false }

  const event = {
    id: `EV-${key.replace(/[^\w]/g, '-')}`,
    key,
    type,
    task,
    sha,
    payload,
    createdAt: now.toISOString(),
    attempts: 0,
    attemptedAt: [],
    state: 'pending', // pending | delivered | failed
    receipt: null,
    deliveredAt: null,
  }
  box.events.push(event)
  return { event, created: true }
}

export function pending(box) {
  return box.events.filter((e) => e.state === 'pending')
}

/** 记一次投递尝试。到上限转 failed，但不删。 */
export function recordAttempt(box, id, { error = null, now = new Date() } = {}) {
  const e = box.events.find((x) => x.id === id)
  if (!e) throw new Error(`没有这个事件：${id}`)
  if (e.state === 'delivered') throw new Error('已送达的事件不再记尝试')
  e.attempts += 1
  e.attemptedAt.push(now.toISOString())
  if (error) e.lastError = String(error)
  if (e.attempts >= MAX_ATTEMPTS) e.state = 'failed'
  return e
}

/**
 * 记送达。**必须**给回执：对方确认收到的证据（消息 id / 回执原文）。
 * 没有尝试过就直接记送达会抛错，防止"自己声明成功"。
 */
export function recordDelivered(box, id, { receipt, now = new Date() } = {}) {
  const e = box.events.find((x) => x.id === id)
  if (!e) throw new Error(`没有这个事件：${id}`)
  if (!receipt || String(receipt).trim().length < 4) {
    throw new Error('记送达必须提供接收回执（对方确认的证据），否则不算送达')
  }
  if (e.attempts < 1) throw new Error('没有投递尝试却要记送达：拒绝')
  e.state = 'delivered'
  e.receipt = String(receipt).trim()
  e.deliveredAt = now.toISOString()
  return e
}

/** 统计，给日报和门禁用 */
export function summarize(box) {
  const acc = { total: box.events.length, pending: 0, delivered: 0, failed: 0, byType: {} }
  for (const e of box.events) {
    acc[e.state] = (acc[e.state] || 0) + 1
    acc.byType[e.type] = (acc.byType[e.type] || 0) + 1
  }
  return acc
}
