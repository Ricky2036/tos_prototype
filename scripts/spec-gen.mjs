#!/usr/bin/env node
/**
 * spec-gen —— 从 uiautomator dump 生成 spec 的 geometry 段
 * ======================================================
 * G8 的唯一输入。没有它，G8 要么没数据、要么数据是手抄错的。
 *
 * 能机器生成的：bounds / text / clickable / 层级顺序 / 部分 resource-id
 * 生成不了的：图标形态、填充率、有无底盘、颜色、字重、圆角、阴影
 *   → 后者一律写进 unknowns，**不许猜**。猜出来的值会变成"看起来合理"的错值。
 *
 * 用法：
 *   adb -s <serial> exec-out uiautomator dump /dev/tty > /tmp/dump.xml
 *   node scripts/spec-gen.mjs --xml /tmp/dump.xml --source infinix-1208 \
 *        --screen settings/display --out spec/settings-display.yaml
 *
 *   --xml -            从 stdin 读
 *   --stats            只打印统计，不写文件
 */

import fs from 'node:fs'
import path from 'node:path'
import { coeffFor, CANVAS } from './lib/canvas-transform.mjs'

/* ---------------- 参数 ---------------- */
const argv = process.argv.slice(2)
const getArg = (name, dflt = null) => {
  const i = argv.indexOf(`--${name}`)
  if (i >= 0) return argv[i + 1]
  const inline = argv.find((a) => a.startsWith(`--${name}=`))
  return inline ? inline.split('=').slice(1).join('=') : dflt
}

const xmlPath = getArg('xml')
const sourceId = getArg('source')
const screen = getArg('screen', 'unknown')
const outPath = getArg('out')
const statsOnly = argv.includes('--stats')

if (!xmlPath) {
  console.error('缺少 --xml（或 --xml - 从 stdin 读）')
  process.exit(2)
}

/* ---------------- 解析 ---------------- */
function readXml() {
  if (xmlPath === '-') return fs.readFileSync(0, 'utf8')
  return fs.readFileSync(path.resolve(xmlPath), 'utf8')
}

/** 属性抽取：uiautomator 的 XML 里属性顺序不固定 */
function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`))
  return m ? m[1] : ''
}

function unescape(s) {
  return s
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

function parseBounds(s) {
  const m = s.match(/\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/)
  if (!m) return null
  const [, x1, y1, x2, y2] = m.map(Number)
  return { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) }
}

/** 只保留节点起始 tag，忽略闭合 tag */
function parseNodes(xml) {
  const tags = xml.match(/<node\b[^>]*>/g) || []
  const nodes = []
  tags.forEach((tag, i) => {
    const b = parseBounds(attr(tag, 'bounds'))
    if (!b) return
    nodes.push({
      index: i,
      cls: attr(tag, 'class'),
      text: unescape(attr(tag, 'text')),
      desc: unescape(attr(tag, 'content-desc')),
      rid: attr(tag, 'resource-id'),
      clickable: attr(tag, 'clickable') === 'true',
      scrollable: attr(tag, 'scrollable') === 'true',
      package: attr(tag, 'package'),
      bounds: b,
    })
  })
  return nodes
}

/* ---------------- 角色判定 ---------------- */
function roleOf(n) {
  const c = n.cls
  if (n.scrollable) return 'scroll'
  if (c.includes('EditText')) return 'input'
  if (c.includes('Switch') || c.includes('CheckBox')) return 'toggle'
  if (c.includes('ImageView') || c.includes('ImageButton')) return 'icon'
  if (c.includes('SeekBar')) return 'slider'
  if (c.includes('TextView')) return 'text'
  if (n.clickable) return 'row'
  return 'container'
}

/** 稳定 id：优先 resource-id，否则 class + 同屏序号 */
function idOf(n, counters) {
  if (n.rid) return n.rid.replace(/^.*\//, '').replace(/[^\w-]/g, '-').toLowerCase()
  const base = n.cls.split('.').pop().replace(/[^\w-]/g, '').toLowerCase()
  counters[base] = (counters[base] || 0) + 1
  return `${base}-${counters[base]}`
}

/* ---------------- YAML 输出（固定 schema，手写发射器） ---------------- */
const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
const num = (n) => (Math.round(n * 1000) / 1000).toString()

function emitYaml(doc) {
  const L = []
  L.push('# 由 scripts/spec-gen.mjs 生成，不要手改 geometry 段。')
  L.push('# 外观（appearance）与未知（unknowns）需要人工补，见 spec/_TEMPLATE.yaml。')
  L.push('')
  L.push(`screen: ${doc.screen}`)
  L.push(`source: ${doc.source}`)
  L.push(`canvas: { w: ${CANVAS.w}, h: ${CANVAS.h} }`)
  L.push(`generated_from: ${q(doc.from)}`)
  L.push(`anisotropic: ${doc.anisotropic}`)
  L.push('')
  L.push('geometry:')
  for (const g of doc.geometry) {
    L.push(`  - id: ${g.id}`)
    L.push(`    role: ${g.role}`)
    L.push(`    component: null          # 待人工映射 REUSE / NEW / GAP`)
    L.push(`    bounds: [${g.bounds.map(num).join(', ')}]`)
    if (g.text) L.push(`    text: ${q(g.text)}`)
    if (g.desc) L.push(`    desc: ${q(g.desc)}`)
    L.push(`    clickable: ${g.clickable}`)
    L.push(`    crop: [${g.crop.map(num).join(', ')}]   # 源图像素框，供裁图与人工核对`)
  }
  L.push('')
  L.push('unknowns:')
  if (doc.unknowns.length === 0) {
    L.push('  []')
  } else {
    for (const u of doc.unknowns) {
      L.push(`  - element: ${u.element}`)
      L.push(`    reason: ${u.reason}`)
    }
  }
  L.push('')
  return L.join('\n')
}

/* ---------------- 主流程 ---------------- */
const xml = readXml()
const nodes = parseNodes(xml)
const c = coeffFor(sourceId)

// 用 kx 处理 x/w、ky 处理 y/h —— 分轴，不许混用
const toCanvasRect = (b) => ({
  x: b.x * c.kx, y: b.y * c.ky, w: b.w * c.kx, h: b.h * c.ky,
})

const counters = {}
const geometry = []
const unknowns = []

for (const n of nodes) {
  // 整屏根容器没有信息量，跳过
  if (n.bounds.w >= c.w * 0.999 && n.bounds.h >= c.h * 0.999) continue

  const id = idOf(n, counters)
  const role = roleOf(n)
  const cb = toCanvasRect(n.bounds)
  geometry.push({
    id,
    role,
    bounds: [cb.x, cb.y, cb.w, cb.h],
    text: n.text || '',
    desc: n.desc || '',
    clickable: n.clickable,
    crop: [n.bounds.x, n.bounds.y, n.bounds.w, n.bounds.h],
  })

  // 外观 0% 可机器生成：图标一律进 unknowns
  if (role === 'icon' && !n.desc) {
    unknowns.push({
      element: id,
      reason: 'content-desc 为空，图标形态/底盘/填充率无法机器提取',
    })
  }
}

/* ---- 护栏：树不可用时必须报错，不能静默产出空 spec ---- */
const allowEmpty = argv.includes('--allow-empty')
if (geometry.length === 0 && !allowEmpty) {
  const diag = nodes.length <= 15 && nodes.every((n) => n.bounds.w >= c.w * 0.99)
    ? '整棵树只有满屏容器 —— 该页很可能是 Jetpack Compose / 自绘，a11y 树不可用'
    : '没有解析到任何非满屏节点'
  console.error(`spec-gen FAIL · ${diag}`)
  console.error(`  节点 ${nodes.length} 个，可用几何 0 个`)
  console.error('  G0/G8 在这类页面上会假绿，必须人工确认。确认后仍要生成请加 --allow-empty')
  process.exit(3)
}

const stats = {
  source: sourceId,
  screen,
  device: `${c.w}×${c.h}`,
  kx: Number(c.kx.toFixed(6)),
  ky: Number(c.ky.toFixed(6)),
  anisotropic: c.anisotropic,
  nodes: nodes.length,
  geometry: geometry.length,
  clickable: geometry.filter((g) => g.clickable).length,
  unknowns: unknowns.length,
  g8Eligible: c.g8,
}

if (geometry.filter((g) => g.clickable).length === 0) {
  console.error('WARN · 整页 0 个可点节点：G0 覆盖度会得到 0/0 = 100% 的假绿，请人工确认')
}

if (statsOnly || !outPath) {
  console.log(JSON.stringify(stats, null, 2))
  if (!outPath && !statsOnly) {
    console.error('\n未给 --out，只输出统计。')
  }
  process.exit(0)
}

const doc = {
  screen,
  source: sourceId,
  from: path.basename(xmlPath === '-' ? 'stdin.xml' : xmlPath),
  anisotropic: c.anisotropic,
  geometry,
  unknowns,
}

fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true })
fs.writeFileSync(path.resolve(outPath), emitYaml(doc))
console.log(JSON.stringify({ ...stats, out: outPath }, null, 2))
