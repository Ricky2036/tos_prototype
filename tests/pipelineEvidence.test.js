import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  DEFAULT_MAX_AGE_MIN, evidencePath, readEvidence, sumChecks, validateEvidence, writeEvidence,
} from '../scripts/lib/e2e-evidence.mjs'

const NOW = new Date('2026-11-13T12:00:00Z')

function goodEvidence(over = {}) {
  return {
    sha: 'abc123def456',
    worktree: 'tos-dsh',
    startedAt: '2026-11-13T11:55:00Z',
    finishedAt: '2026-11-13T11:58:00Z',
    results: [
      { id: 'focus', ok: true, code: 0, checks: { pass: 100, fail: 0 } },
      { id: 'phone', ok: true, code: 0, checks: { pass: 68, fail: 0 } },
    ],
    ...over,
  }
}

const EXPECT = {
  sha: 'abc123def456',
  worktree: 'tos-dsh',
  suites: ['focus', 'phone'],
  now: NOW,
}

test('完整且本轮的证据 → 通过', () => {
  const r = validateEvidence(goodEvidence(), EXPECT)
  assert.equal(r.ok, true, r.reasons.join('; '))
})

test('证据文件不存在 → 红（不许拿旧文件兜底）', () => {
  const r = readEvidence('/tmp/definitely-not-here-xyz.json')
  assert.equal(r.ok, false)
  assert.match(r.reasons[0], /不存在/)
})

test('提交对不上 → 红（别的提交的结果不能冒充本轮）', () => {
  const r = validateEvidence(goodEvidence({ sha: 'ffffffffffff' }), EXPECT)
  assert.equal(r.ok, false)
  assert.match(r.reasons.join(), /不属于本提交/)
})

test('工作区对不上 → 红（别的 lane 的结果不能冒充本轮）', () => {
  const r = validateEvidence(goodEvidence({ worktree: 'tos-workbuddy' }), EXPECT)
  assert.equal(r.ok, false)
  assert.match(r.reasons.join(), /不属于本工作区/)
})

test('过期证据 → 红', () => {
  const old = new Date(NOW.getTime() - (DEFAULT_MAX_AGE_MIN + 10) * 60000).toISOString()
  const r = validateEvidence(goodEvidence({ finishedAt: old }), EXPECT)
  assert.equal(r.ok, false)
  assert.match(r.reasons.join(), /已过期/)
})

test('未来时间 → 红（时钟不可信就别信）', () => {
  const future = new Date(NOW.getTime() + 30 * 60000).toISOString()
  const r = validateEvidence(goodEvidence({ finishedAt: future }), EXPECT)
  assert.equal(r.ok, false)
  assert.match(r.reasons.join(), /未来/)
})

test('缺 finishedAt / sha / worktree → 逐项红', () => {
  assert.match(validateEvidence(goodEvidence({ finishedAt: undefined }), EXPECT).reasons.join(), /缺少 finishedAt/)
  assert.match(validateEvidence(goodEvidence({ sha: '' }), EXPECT).reasons.join(), /缺少 sha/)
  assert.match(validateEvidence(goodEvidence({ worktree: '' }), EXPECT).reasons.join(), /缺少 worktree/)
})

test('缺套件 → 红（局部跑不许冒充全量）', () => {
  const ev = goodEvidence({ results: [{ id: 'focus', ok: true, code: 0, checks: { pass: 1, fail: 0 } }] })
  const r = validateEvidence(ev, EXPECT)
  assert.equal(r.ok, false)
  assert.match(r.reasons.join(), /缺少套件：phone/)
})

test('计数不可解析 → 红', () => {
  const ev = goodEvidence()
  ev.results[0].checks = null
  const r = validateEvidence(ev, EXPECT)
  assert.equal(r.ok, false)
  assert.match(r.reasons.join(), /计数不可解析/)
})

test('进程非零退出 → 红', () => {
  const ev = goodEvidence()
  ev.results[1].ok = false
  ev.results[1].code = 1
  const r = validateEvidence(ev, EXPECT)
  assert.equal(r.ok, false)
  assert.match(r.reasons.join(), /phone 未通过/)
})

test('隔离套件不参与判定', () => {
  const ev = goodEvidence()
  ev.results.push({ id: 'modes', ok: false, code: 1, checks: null, quarantined: true })
  const r = validateEvidence(ev, EXPECT)
  assert.equal(r.ok, true, r.reasons.join('; '))
})

test('空结果 → 红', () => {
  const r = validateEvidence(goodEvidence({ results: [] }), { ...EXPECT, suites: [] })
  assert.equal(r.ok, false)
  assert.match(r.reasons.join(), /没有任何套件结果/)
})

test('evidencePath 每轮独立，且带 sha / worktree / 时间戳', () => {
  const a = evidencePath({ sha: 'abc123def456', worktree: 'tos-dsh', now: NOW })
  const b = evidencePath({ sha: 'abc123def456', worktree: 'tos-dsh', now: new Date(NOW.getTime() + 1000) })
  assert.notEqual(a, b)
  assert.match(path.basename(a), /^e2e-abc123def456-tos-dsh-/)
})

test('写入后能原样读回', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ev-'))
  const f = evidencePath({ sha: 'abc123def456', worktree: 'tos-dsh', now: NOW, dir })
  writeEvidence(f, goodEvidence())
  const r = readEvidence(f)
  assert.equal(r.ok, true)
  assert.equal(r.data.sha, 'abc123def456')
})

test('sumChecks 跳过隔离与无计数套件', () => {
  const s = sumChecks([
    { id: 'a', checks: { pass: 10, fail: 0 } },
    { id: 'b', checks: { pass: 5, fail: 1 } },
    { id: 'c', checks: null },
    { id: 'd', checks: { pass: 9, fail: 0 }, quarantined: true },
  ])
  assert.deepEqual(s, { pass: 15, fail: 1, suites: 2 })
})
