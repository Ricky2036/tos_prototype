import { chromium } from 'playwright'
const PORT = process.argv[2] || '5555'
const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
const browser = await chromium.launch({ executablePath: CHROME })
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, hasTouch: true })
const page = await ctx.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)

const vw = 430
async function openCC() {
  await page.mouse.move(vw - 10, 5); await page.mouse.down(); await page.mouse.move(vw - 10, 220, { steps: 12 }); await page.mouse.up()
  await page.waitForTimeout(500)
}
const boxOf = (sel) => page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)]
  return els.map((e) => { const r = e.getBoundingClientRect(); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) } })
}, sel)

/* 🔴 「主屏状态栏的指示器」必须按**可见槽**取，不能按 DOM 节点取。
   主屏 `.status-bar .sb-ind` 是**恒渲染的 5 个固定槽**，显隐靠 `display: none`
   （vibrate20 / mute30 / hotspot40 / bluetooth50 / dnd60）⇒ 隐藏槽的 rect 是 **0×0**。
   直接 `querySelectorAll('.sb-ind svg')` 会把隐藏槽的 0 高度当成「指示器偏小」，
   于是得到 `indH=0 natH=15.5` 这种**假 FAIL**（2026-10-14 实测）。
   只统计可见槽（rect w/h > 0）—— 与 `verify-status-bar.mjs` 同一判据。
   注：控制中心那一行 `.cc-status .cc-ind` 是条件渲染（不是恒 5 槽），暂不需要这层过滤。 */
const visibleIndBoxes = (scope) => page.evaluate((s) => {
  const root = document.querySelector(s)
  if (!root) return []
  const out = []
  for (const el of root.querySelectorAll('.sb-ind')) {
    const r = el.getBoundingClientRect()
    if (!(r.width > 0 && r.height > 0)) continue
    const svg = el.querySelector('svg')
    if (!svg) continue
    const sr = svg.getBoundingClientRect()
    out.push({ w: +sr.width.toFixed(1), h: +sr.height.toFixed(1) })
  }
  return out
}, scope)

let ok = true
const check = (name, cond, detail) => { if (!cond) ok = false; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`) }

// ---------- 单卡模式 ----------
await openCC()
await page.evaluate(() => { const c = window.__control; c.showDualSim = false; c.dnd = true; c.hotspot = true; c.soundMode = 'ring' })
await page.waitForTimeout(300)

let inds = await boxOf('.cc-status .cc-ind svg')
let natives = await boxOf('.cc-status .sb-icon')
console.log('\n[单卡] 指示图标 svg 尺寸:', JSON.stringify(inds))
console.log('[单卡] 原生图标 svg 尺寸:', JSON.stringify(natives))
const indH = inds.length ? inds[0].h : 0
const natH = natives.length ? natives[0].h : 0
check('单卡: 指示图标已渲染(≥2个)', inds.length >= 2, `count=${inds.length}`)
check('单卡: 指示图标高度≥原生(不再偏小)', indH >= natH - 1, `indH=${indH} natH=${natH}`)

// ---------- 双卡模式 ----------
await page.evaluate(() => { const c = window.__control; c.showDualSim = true })
await page.waitForTimeout(300)
let inds2 = await boxOf('.cc-status .cc-ind svg')
console.log('\n[双卡] 指示图标 svg 尺寸:', JSON.stringify(inds2))
check('双卡: 指示图标已渲染(≥2个)', inds2.length >= 2, `count=${inds2.length}`)

// ---------- 主屏状态栏(StatusBar) ----------
await page.evaluate(() => { const c = window.__control; c.showDualSim = false })
await page.mouse.move(vw / 2, 5); await page.mouse.down(); await page.mouse.move(vw / 2, 300, { steps: 12 }); await page.mouse.up() // 关闭 CC
await page.waitForTimeout(400)
await page.evaluate(() => { const c = window.__control; c.dnd = true; c.hotspot = true })
await page.waitForTimeout(300)
let sbInds = await visibleIndBoxes('.status-bar')
let sbNatives = await boxOf('.status-bar .sb-icon')
console.log('\n[主屏] 指示图标 svg 尺寸:', JSON.stringify(sbInds))
console.log('[主屏] 原生图标 svg 尺寸:', JSON.stringify(sbNatives))
const sbIndH = sbInds.length ? sbInds[0].h : 0
const sbNatH = sbNatives.length ? sbNatives[0].h : 0
check('主屏: 指示图标已渲染(≥2个)', sbInds.length >= 2, `count=${sbInds.length}`)
check('主屏: 指示图标高度≥原生', sbIndH >= sbNatH - 1, `indH=${sbIndH} natH=${sbNatH}`)

await browser.close()
console.log(ok ? '\n全部通过 ✅' : '\n有失败项 ❌')
process.exit(ok ? 0 : 1)
