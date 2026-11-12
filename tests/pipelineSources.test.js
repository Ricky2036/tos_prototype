import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CANVAS, coeffFor, sourceIds, toCanvas, pointToCanvas, uniformHeightError,
} from '../scripts/lib/canvas-transform.mjs'
import { findViolations } from '../scripts/check-spec-literals.mjs'

test('画布尺寸与 tokens.css 一致', () => {
  assert.deepEqual({ ...CANVAS }, { w: 360, h: 788 })
})

test('infinix 来源各向同性，单系数可用', () => {
  const c = coeffFor('infinix-1208')
  assert.ok(Math.abs(c.kx - 0.298013) < 1e-5, `kx=${c.kx}`)
  assert.ok(Math.abs(c.ky - 0.298033) < 1e-5, `ky=${c.ky}`)
  assert.equal(c.anisotropic, false)
  assert.ok(Math.abs(uniformHeightError('infinix-1208')) < 0.2, '用 kx 算高应几乎不差')
})

test('samsung 来源各向异性，必须分轴', () => {
  const c = coeffFor('samsung-1080')
  assert.ok(Math.abs(c.kx - 1 / 3) < 1e-6)
  assert.ok(Math.abs(c.ky - 788 / 2340) < 1e-6)
  assert.equal(c.anisotropic, true)
  // 用 kx 统一算高会少约 8 画布 px —— 这正是"每个数看着都对"的坑
  assert.ok(Math.abs(uniformHeightError('samsung-1080') + 8) < 0.2,
    `实测 ${uniformHeightError('samsung-1080')}`)
})

test('ios 来源标记为不跑 G8', () => {
  const c = coeffFor('ios-1320')
  assert.equal(c.anisotropic, true)
  assert.equal(c.g8, false)
})

test('矩形换算：X 用 kx、Y 用 ky', () => {
  const r = toCanvas('samsung-1080', { x: 0, y: 0, w: 1080, h: 2340 })
  assert.ok(Math.abs(r.w - 360) < 1e-6)
  assert.ok(Math.abs(r.h - 788) < 1e-6)
})

test('custom-spec 是恒等映射', () => {
  assert.deepEqual(pointToCanvas('custom-spec', 24, 312), { x: 24, y: 312 })
})

test('未知 source 直接抛错，不静默兜底', () => {
  assert.throws(() => coeffFor('nope'), /未知 source/)
})

test('来源表只存像素，不许出现系数', () => {
  const ids = sourceIds()
  assert.ok(ids.includes('infinix-1208'))
  const bad = findViolations('const k = 0.298033', 'scripts/foo.mjs')
  assert.equal(bad.length, 1)
})

test('字面量检查：三种硬编码都能抓到', () => {
  assert.equal(findViolations('const k = 0.336752', 'spec/a.yaml').length, 1)
  assert.equal(findViolations('const k = 360 / 1208', 'scripts/a.mjs').length, 1)
  assert.equal(findViolations('const k = 1208 / 360', 'scripts/a.mjs').length, 1)
})

test('字面量检查：注释与允许文件不报', () => {
  assert.equal(findViolations('// 历史值 0.298033，已废弃', 'scripts/a.mjs').length, 0)
  assert.equal(findViolations('const k = 0.298033', 'scripts/lib/canvas-transform.mjs').length, 0)
  assert.equal(findViolations('const k = 0.298033', 'tests/x.test.js').length, 0)
})

test('字面量检查：正常代码不误报', () => {
  const clean = [
    'const ratio = 1.5',
    'canvas.w = 360',
    'if (x / 3 > 2) {}',
    'const fps = 0.33',
  ].join('\n')
  assert.equal(findViolations(clean, 'scripts/b.mjs').length, 0)
})
