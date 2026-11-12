import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLI = path.join(ROOT, 'scripts/spec-gen.mjs')
const SOURCE = 'samsung-1080' // kx=1/3, ky=788/2340 → 各向异性，能验分轴

/** Views 体系的典型树：根容器 + 三个行 + 一个无 desc 的图标 + 一个开关 */
const VIEWS_XML = `<hierarchy rotation="0">
<node class="android.widget.FrameLayout" text="" resource-id="" content-desc="" clickable="false" scrollable="false" bounds="[0,0][1080,2340]">
<node class="android.widget.LinearLayout" text="" resource-id="" content-desc="" clickable="false" scrollable="false" bounds="[0,200][1080,2100]">
<node class="android.widget.TextView" text="显示" resource-id="com.x:id/title" content-desc="" clickable="false" scrollable="false" bounds="[0,200][1080,320]">
<node class="android.widget.ImageView" text="" resource-id="com.x:id/icon" content-desc="" clickable="false" scrollable="false" bounds="[24,220][96,292]">
<node class="android.widget.LinearLayout" text="" resource-id="com.x:id/row_bright" content-desc="" clickable="true" scrollable="false" bounds="[0,300][1080,450]">
<node class="android.widget.Switch" text="" resource-id="com.x:id/sw" content-desc="亮度" clickable="true" scrollable="false" bounds="[900,330][1040,420]">
<node class="android.widget.ImageView" text="" resource-id="com.x:id/chev" content-desc="更多" clickable="true" scrollable="false" bounds="[1000,340][1060,400]">
</node>
</node>
</node>
</node>
</node>
</hierarchy>`

/** Compose 页的真实形状：只有满屏容器 */
const COMPOSE_XML = `<hierarchy rotation="0">
<node class="android.widget.FrameLayout" text="" resource-id="" content-desc="" clickable="false" scrollable="false" bounds="[0,0][1080,2340]">
<node class="androidx.compose.ui.platform.ComposeView" text="" resource-id="" content-desc="" clickable="false" scrollable="false" bounds="[0,0][1080,2340]">
</node>
</node>
</hierarchy>`

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'specgen-'))
}

function run(xml, extra = []) {
  const dir = tmpdir()
  const xmlPath = path.join(dir, 'dump.xml')
  fs.writeFileSync(xmlPath, xml)
  const out = path.join(dir, 'spec.yaml')
  try {
    const stdout = execFileSync(
      process.execPath,
      [CLI, '--xml', xmlPath, '--source', SOURCE, '--screen', 'demo/t', '--out', out, ...extra],
      { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' },
    )
    return { ok: true, stats: JSON.parse(stdout.split('\n\n注')[0]), yaml: fs.readFileSync(out, 'utf8') }
  } catch (e) {
    return { ok: false, code: e.status, stderr: (e.stderr || '') + (e.stdout || '') }
  }
}

test('生成成功：跳过满屏根容器，保留子节点', () => {
  const r = run(VIEWS_XML)
  assert.equal(r.ok, true, r.stderr)
  // 根 FrameLayout 满屏被跳过；其余 6 个保留
  assert.equal(r.stats.geometry, 6)
  assert.equal(r.stats.nodes, 7)
})

test('分轴换算：X 用 kx、Y 用 ky', () => {
  const r = run(VIEWS_XML)
  const m = r.yaml.match(/id: row_bright[\s\S]*?bounds: \[([^\]]+)\]/)
  assert.ok(m, '应能定位 row-bright 的 bounds')
  const [x, y, w, h] = m[1].split(',').map(Number)
  assert.ok(Math.abs(x - 0) < 0.01, `x=${x}`)
  // 300 * 788/2340 = 101.026
  assert.ok(Math.abs(y - 101.026) < 0.02, `y=${y}（若等于 100 说明错用了 kx）`)
  assert.ok(Math.abs(w - 360) < 0.01, `w=${w}`)
  // 150 * 788/2340 = 50.513
  assert.ok(Math.abs(h - 50.513) < 0.02, `h=${h}`)
})

test('crop 保留源图像素框，供人工核对', () => {
  const r = run(VIEWS_XML)
  const m = r.yaml.match(/id: row_bright[\s\S]*?crop: \[([^\]]+)\]/)
  assert.deepEqual(m[1].split(',').map((v) => Number(v.trim())), [0, 300, 1080, 150])
})

test('无 content-desc 的图标进 unknowns，有 desc 的不进', () => {
  const r = run(VIEWS_XML)
  assert.match(r.yaml, /unknowns:\n  - element: icon/)
  assert.doesNotMatch(r.yaml, /element: chev/)
})

test('可点节点计数', () => {
  const r = run(VIEWS_XML)
  assert.equal(r.stats.clickable, 3) // row_bright + sw + chev
})

test('Compose 页面必须报错，不许产出空 spec', () => {
  const r = run(COMPOSE_XML)
  assert.equal(r.ok, false)
  assert.equal(r.code, 3)
  assert.match(r.stderr, /Compose|自绘/)
})

test('--allow-empty 可显式放行，但只在人工确认后用', () => {
  const r = run(COMPOSE_XML, ['--allow-empty'])
  assert.equal(r.ok, true, r.stderr)
  assert.match(r.yaml, /unknowns:\n  \[\]/)
})

test('YAML 必填字段齐全', () => {
  const r = run(VIEWS_XML)
  for (const k of ['screen:', 'source:', 'canvas: { w: 360, h: 788 }', 'anisotropic: true', 'geometry:']) {
    assert.ok(r.yaml.includes(k), `缺少 ${k}`)
  }
})
