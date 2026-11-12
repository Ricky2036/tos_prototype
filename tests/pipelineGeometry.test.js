import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CANVAS_W, canvasScale, toCanvasRect, toleranceFor, compare,
} from '../scripts/lib/geometry-compare.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLI = path.join(ROOT, 'scripts/gate-geometry.mjs')

/* ---------------- 纯计算 ---------------- */

test('缩放系数从容器宽现算', () => {
  assert.equal(canvasScale(360), 1)
  assert.equal(canvasScale(720), 2)
  assert.equal(canvasScale(1080), 3)
  assert.throws(() => canvasScale(0), /容器宽度无效/)
})

test('减去容器 origin —— 容器不在 (0,0) 时不能整体偏移', () => {
  const dom = { x: 148, y: 350, width: 360, height: 100 }
  const c = toCanvasRect(dom, 2, { x: 100, y: 50 })
  assert.deepEqual(c, { x: 24, y: 150, w: 180, h: 50 })
})

test('量化到 0.1 画布 px，避免亚像素抖动出假红', () => {
  const c = toCanvasRect({ x: 0, y: 0, width: 360.04, height: 99.97 }, 1)
  assert.equal(c.w, 360)
  assert.equal(c.h, 100)
})

test('容差分档：线与图标 0.5，行与容器 1.5，文本不卡', () => {
  assert.equal(toleranceFor('line'), 0.5)
  assert.equal(toleranceFor('icon'), 0.5)
  assert.equal(toleranceFor('row'), 1.5)
  assert.equal(toleranceFor('container'), 1.5)
  assert.equal(toleranceFor('text'), null)
})

test('比较：命中/超差/未命中/跳过 四种状态', () => {
  const spec = [
    { id: 'a', role: 'row', bounds: [0, 0, 360, 50] },
    { id: 'b', role: 'row', bounds: [0, 100, 360, 50] },
    { id: 'c', role: 'row', bounds: [0, 200, 360, 50] },
    { id: 't', role: 'text', bounds: [0, 300, 100, 20] },
  ]
  const dom = new Map([
    ['a', { x: 0, y: 0, width: 360, height: 50 }],       // 完全吻合
    ['b', { x: 0, y: 120, width: 360, height: 50 }],     // 偏 20 → fail
    // c 缺失
    ['t', { x: 0, y: 400, width: 100, height: 20 }],     // 文本只记录
  ])
  const r = compare(spec, dom, 1)
  assert.equal(r.totalSpec, 4)
  assert.equal(r.pass, 1)
  assert.equal(r.fail, 1)
  assert.equal(r.missing, 1)
  assert.equal(r.skipped, 1)
  assert.equal(r.matchRate, 0.75)
})

test('排序：偏差最大的排最前，便于先看问题', () => {
  const spec = [
    { id: 'a', role: 'row', bounds: [0, 0, 360, 50] },
    { id: 'b', role: 'row', bounds: [0, 0, 360, 50] },
  ]
  const dom = new Map([
    ['a', { x: 0, y: 1, width: 360, height: 50 }],
    ['b', { x: 0, y: 9, width: 360, height: 50 }],
  ])
  const r = compare(spec, dom, 1)
  assert.equal(r.rows[0].id, 'b')
})

/* ---------------- 端到端：真开一个页面 ---------------- */
// 容器刻意放在 (100, 50)、宽度 720（系数 2），用来证明 origin 与缩放都真被处理

function fixture(html) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'geom-'))
  const f = path.join(dir, 'page.html')
  fs.writeFileSync(f, html)
  return f
}

const PAGE = `<!doctype html><meta charset="utf-8">
<style>body{margin:0} .screen-view{position:absolute;left:100px;top:50px;width:720px;height:1576px}</style>
<div class="screen-view">
  <div data-testid="row_a" style="position:absolute;left:48px;top:600px;width:720px;height:100px"></div>
  <div data-testid="ttl" style="position:absolute;left:48px;top:60px;width:400px;height:40px"></div>
</div>`

function runGate(spec, extra = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'geomrun-'))
  const specPath = path.join(dir, 'spec.json')
  fs.writeFileSync(specPath, JSON.stringify(spec))
  try {
    const stdout = execFileSync(
      process.execPath,
      [CLI, '--spec', specPath, '--url', `file://${runGate.page}`, '--json', ...extra],
      { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' },
    )
    return { ok: true, report: JSON.parse(stdout) }
  } catch (e) {
    return { ok: false, code: e.status, stdout: e.stdout || '', stderr: e.stderr || '' }
  }
}
runGate.page = fixture(PAGE)

// 720 宽 → 系数 2；容器在 (100,50) 已通过 origin 减掉
// row_a: DOM (148,650,720,100) → 画布 (24,300,360,50)
const GOOD = {
  geometry: [
    { id: 'row_a', role: 'row', bounds: [24, 300, 360, 50] },
    { id: 'ttl', role: 'text', bounds: [24, 30, 200, 20] },
  ],
}

test('端到端：吻合时通过，且 origin 与缩放都被正确处理', () => {
  const r = runGate(GOOD)
  assert.equal(r.ok, true, r.stderr)
  const rep = r.report
  assert.equal(rep.result.fail, 0, JSON.stringify(rep.result.rows))
  assert.equal(rep.scale, 2)
  assert.deepEqual(rep.shellOrigin, { x: 100, y: 50 })
  const row = rep.result.rows.find((x) => x.id === 'row_a')
  assert.equal(row.status, 'pass')
  assert.equal(row.worst, 0)
})

test('端到端：偏 10 画布 px 时判红并给出方向', () => {
  const spec = { geometry: [{ id: 'row_a', role: 'row', bounds: [24, 310, 360, 50] }] }
  const r = runGate(spec)
  assert.equal(r.ok, false)
  assert.equal(r.code, 1)
  const rep = JSON.parse(r.stdout)
  const row = rep.result.rows[0]
  assert.equal(row.status, 'fail')
  assert.equal(row.dy, -10)
})

test('端到端：DOM 里找不到的节点记为 missing，不判红', () => {
  const spec = { geometry: [{ id: 'nope', role: 'row', bounds: [0, 0, 10, 10] }] }
  const r = runGate(spec)
  assert.equal(r.ok, true, r.stderr)
  const rep = r.report
  assert.equal(rep.result.missing, 1)
  assert.equal(rep.result.fail, 0)
})

test('端到端：--min-match 不足时退出码 4', () => {
  const spec = {
    geometry: [
      { id: 'row_a', role: 'row', bounds: [24, 300, 360, 50] },
      { id: 'nope', role: 'row', bounds: [0, 0, 10, 10] },
    ],
  }
  const r = runGate(spec, ['--min-match', '0.9'])
  assert.equal(r.ok, false)
  assert.equal(r.code, 4)
})
