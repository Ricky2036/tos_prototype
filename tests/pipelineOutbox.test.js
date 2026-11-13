import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_ATTEMPTS, TYPES, dedupeKey, emptyBox, enqueue, pending, recordAttempt, recordDelivered, summarize,
} from '../tools/agent-bridge/outbox.mjs'

const SHA = 'a1b2c3d4e5f60718'
const base = { task: 'SET-DSH-01', sha: SHA, type: 'done' }

test('三类事件都能入队', () => {
  for (const t of TYPES) {
    const box = emptyBox()
    const { created } = enqueue(box, { ...base, type: t })
    assert.equal(created, true)
    assert.equal(box.events.length, 1)
    assert.equal(box.events[0].state, 'pending')
  }
})

test('未知类型直接报错，不静默接受', () => {
  assert.throws(() => enqueue(emptyBox(), { ...base, type: 'whatever' }), /未知事件类型/)
})

test('task + sha + type 去重：同一件事不会刷屏', () => {
  const box = emptyBox()
  const a = enqueue(box, base)
  const b = enqueue(box, base)
  assert.equal(a.created, true)
  assert.equal(b.created, false)
  assert.equal(box.events.length, 1)
  assert.equal(a.event.id, b.event.id)
})

test('sha 变了就是新事件（不同提交要分别报备）', () => {
  const box = emptyBox()
  enqueue(box, base)
  enqueue(box, { ...base, sha: 'ffffffffffffffff' })
  assert.equal(box.events.length, 2)
})

test('去重不会重置重试次数', () => {
  const box = emptyBox()
  const { event } = enqueue(box, base)
  recordAttempt(box, event.id, { error: 'x' })
  enqueue(box, base)
  assert.equal(box.events[0].attempts, 1)
})

test('没有回执不能记送达（拒绝自我声明成功）', () => {
  const box = emptyBox()
  const { event } = enqueue(box, base)
  recordAttempt(box, event.id)
  assert.throws(() => recordDelivered(box, event.id, { receipt: '' }), /必须提供接收回执/)
  assert.throws(() => recordDelivered(box, event.id, { receipt: 'ok' }), /必须提供接收回执/)
  assert.equal(box.events[0].state, 'pending')
})

test('没有投递尝试就记送达 → 拒绝', () => {
  const box = emptyBox()
  const { event } = enqueue(box, base)
  assert.throws(() => recordDelivered(box, event.id, { receipt: 'MSG-1234' }), /没有投递尝试/)
})

test('有尝试 + 有回执 → delivered，并留下回执证据', () => {
  const box = emptyBox()
  const { event } = enqueue(box, base)
  recordAttempt(box, event.id)
  const e = recordDelivered(box, event.id, { receipt: 'MSG-2026-11-13-001' })
  assert.equal(e.state, 'delivered')
  assert.equal(e.receipt, 'MSG-2026-11-13-001')
  assert.ok(e.deliveredAt)
})

test('失败到上限转 failed，但记录保留不删', () => {
  const box = emptyBox()
  const { event } = enqueue(box, base)
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) recordAttempt(box, event.id, { error: `尝试${i + 1}失败` })
  const e = box.events[0]
  assert.equal(e.attempts, MAX_ATTEMPTS)
  assert.equal(e.state, 'failed')
  assert.equal(box.events.length, 1)
  assert.match(e.lastError, /尝试5失败/)
})

test('failed 的事件仍在盒子里，可被人工重试（不自动复活）', () => {
  const box = emptyBox()
  const { event } = enqueue(box, base)
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) recordAttempt(box, event.id)
  assert.equal(pending(box).length, 0)
  assert.equal(box.events.length, 1)
})

test('已送达的事件不再记尝试', () => {
  const box = emptyBox()
  const { event } = enqueue(box, base)
  recordAttempt(box, event.id)
  recordDelivered(box, event.id, { receipt: 'MSG-1-2-3' })
  assert.throws(() => recordAttempt(box, event.id), /已送达/)
})

test('summarize 按状态与类型计数', () => {
  const box = emptyBox()
  enqueue(box, { ...base, type: 'done' })
  enqueue(box, { ...base, type: 'blocked', task: 'X' })
  const { event } = enqueue(box, { ...base, type: 'review', task: 'Y' })
  recordAttempt(box, event.id)
  recordDelivered(box, event.id, { receipt: 'MSG-ABCD' })
  const s = summarize(box)
  assert.equal(s.total, 3)
  assert.equal(s.pending, 2)
  assert.equal(s.delivered, 1)
  assert.equal(s.byType.done, 1)
})

test('dedupeKey 用短 sha，便于人读', () => {
  assert.equal(dedupeKey(base), 'SET-DSH-01|a1b2c3d4e5f6|done')
})
