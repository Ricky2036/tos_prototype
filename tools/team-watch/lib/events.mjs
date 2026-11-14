import fs from 'node:fs'
import path from 'node:path'
import { acquireLock, readJsonl, sha256, ensureDir } from './store.mjs'

/**
 * 事件采集（显式事件 + watch 事实事件）
 * ===================================
 * 只写本地共享目录的 JSONL，不调用模型、不唤醒任何 CLI、不自动派单/审查/合并。
 *
 * 幂等与冲突：
 *   - 同 event_id 同内容 → 返回原记录（status=duplicate），不新增行；
 *   - 同 event_id 异内容 → 写 conflicts.jsonl，原事件与其内容哈希保持不变；
 *   - 读-判-写全程持 `.events.lock`，并发 emit 不会产生重复 event_id。
 */

export const EXPLICIT_EVENTS = ['delivery-ready', 'blocked', 'test-failed', 'integrated']
export const SYSTEM_EVENTS = ['suspected-stall', 'scan-change']
export const ALL_EVENTS = [...EXPLICIT_EVENTS, ...SYSTEM_EVENTS]

export function eventsPath(home) { return path.join(home, 'events.jsonl') }
export function conflictsPath(home) { return path.join(home, 'conflicts.jsonl') }
export function acksPath(home) { return path.join(home, 'acks.jsonl') }
export function lockPath(home) { return path.join(home, '.events.lock') }

const str = (v) => (v === undefined || v === null ? '' : String(v).trim())

export function normalizeEvent(input = {}) {
  return {
    event_id: str(input.event_id),
    task: str(input.task),
    agent: str(input.agent),
    event: str(input.event),
    sha: str(input.sha),
    artifact: str(input.artifact),
    next_action: str(input.next_action),
    detail: input.detail === undefined ? null : input.detail,
    source: input.source === 'watch' ? 'watch' : 'explicit'
  }
}

/** 内容哈希不含时间/来源：同 ID 同内容必须稳定 */
export function contentHash(e) {
  return sha256(JSON.stringify([e.task, e.agent, e.event, e.sha, e.artifact, e.next_action, e.detail ?? null]))
}

function validate(e) {
  const errors = []
  if (!e.event_id) errors.push('event_id 不能为空')
  if (!e.task) errors.push('task 不能为空')
  if (!e.agent) errors.push('agent 不能为空')
  if (!ALL_EVENTS.includes(e.event)) errors.push(`event 必须是 ${ALL_EVENTS.join(' | ')}`)
  if (!e.sha) errors.push('sha 不能为空（未知填 unknown）')
  if (e.event !== 'scan-change' && !e.artifact) errors.push('artifact 不能为空')
  return errors
}

export function readEvents(cfg) { return readJsonl(eventsPath(cfg.home)) }
export function readAcks(cfg) { return readJsonl(acksPath(cfg.home)) }
export function readConflicts(cfg) { return readJsonl(conflictsPath(cfg.home)) }

/**
 * @returns {{status:'created'|'duplicate'|'conflict', event:object, conflict?:object}}
 */
export function emitEvent(cfg, input) {
  const e = normalizeEvent(input)
  const errors = validate(e)
  if (errors.length) {
    const err = new Error(`事件字段不合法：${errors.join('；')}`)
    err.code = 'INVALID_EVENT'
    throw err
  }
  ensureDir(cfg.home)
  const release = acquireLock(lockPath(cfg.home), { timeoutMs: cfg.lockTimeoutMs, label: 'events' })
  try {
    const { items } = readEvents(cfg)
    const existing = items.find((x) => x.event_id === e.event_id)
    const hash = contentHash(e)
    if (existing) {
      if (existing.content_hash === hash) return { status: 'duplicate', event: existing }
      const conflict = {
        at: new Date().toISOString(),
        event_id: e.event_id,
        existing_hash: existing.content_hash || null,
        incoming_hash: hash,
        incoming: { ...e, at: null },
        reason: 'same event_id with different content'
      }
      fs.appendFileSync(conflictsPath(cfg.home), `${JSON.stringify(conflict)}\n`, 'utf8')
      return { status: 'conflict', event: existing, conflict }
    }
    const record = { ...e, at: new Date().toISOString(), content_hash: hash }
    fs.appendFileSync(eventsPath(cfg.home), `${JSON.stringify(record)}\n`, 'utf8')
    return { status: 'created', event: record }
  } finally {
    release()
  }
}

/** ack 只代表「已读」；不修改事件状态、不写 done */
export function ackEvent(cfg, { event_id, by, note = '' }) {
  const id = str(event_id)
  const who = str(by) || 'unknown'
  if (!id) {
    const err = new Error('ack 需要 --event <event_id>')
    err.code = 'INVALID_ACK'
    throw err
  }
  ensureDir(cfg.home)
  const release = acquireLock(lockPath(cfg.home), { timeoutMs: cfg.lockTimeoutMs, label: 'events' })
  try {
    const { items } = readEvents(cfg)
    const ev = items.find((x) => x.event_id === id)
    if (!ev) {
      const err = new Error(`事件不存在：${id}`)
      err.code = 'EVENT_NOT_FOUND'
      throw err
    }
    const { items: acks } = readAcks(cfg)
    const dup = acks.find((a) => a.event_id === id && a.by === who)
    if (dup) return { status: 'duplicate', ack: dup, event: ev }
    const ack = { event_id: id, by: who, note: str(note), at: new Date().toISOString(), kind: 'read-receipt' }
    fs.appendFileSync(acksPath(cfg.home), `${JSON.stringify(ack)}\n`, 'utf8')
    return { status: 'created', ack, event: ev }
  } finally {
    release()
  }
}

export function statusData(cfg) {
  const events = readEvents(cfg)
  const acks = readAcks(cfg)
  const conflicts = readConflicts(cfg)
  const ackBy = new Map()
  for (const a of acks.items) {
    const list = ackBy.get(a.event_id) || []
    list.push(a)
    ackBy.set(a.event_id, list)
  }
  const merged = events.items.map((e) => {
    const list = ackBy.get(e.event_id) || []
    return {
      ...e,
      acked: list.length > 0,
      acked_by: list.map((a) => a.by),
      acked_at: list.length ? list[list.length - 1].at : null
    }
  })
  return {
    events: merged,
    acks: acks.items,
    conflicts: conflicts.items,
    bad_lines: { events: events.badLines, acks: acks.badLines, conflicts: conflicts.badLines }
  }
}
