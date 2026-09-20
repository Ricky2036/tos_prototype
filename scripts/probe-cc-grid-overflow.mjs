/* 逐预设量网格溢出态（A/B 用）
 * 输出 JSON 到 argv[2]，供两次运行后 diff。
 * 用法: node scripts/probe-cc-grid-overflow.mjs [port] [outJson]
 *
 * 这是「加一格磁贴会不会把预设推进溢出态」的通用 A/B 量尺：
 * 同一把尺、同一个脚本，摘掉待测磁贴那一行前后各跑一次，再 diff 两次的 JSON。
 * 溢出态的后果见 ControlCenter.vue 里 HIOS17_ITEMS 的注释
 * （overflow-y hidden→auto、touch-action none→pan-y、「空白处上滑关闭」让位给滚动）。
 */
import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'

const PORT = process.argv[2] || '5555'
const OUT = process.argv[3] || '/tmp/vwork/cc-grid-overflow.json'
const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'

const browser = await chromium.launch({ executablePath: CHROME })
const page = await (await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 })).newPage()
page.on('pageerror', (e) => console.log('[pageerror]', e.message))
await page.goto(`http://127.0.0.1:${PORT}/?overlay=controlCenter`, { waitUntil: 'networkidle' })
await page.waitForSelector('[data-testid="volume-slider"]', { timeout: 8000 })
await page.waitForTimeout(700)

const presetIds = await page.evaluate(async () => {
  const m = await import('/src/stores/controlStore.js')
  return m.LAYOUT_PRESETS.map((p) => p.id)
})

const result = {}
for (const pid of presetIds) {
  await page.evaluate((id) => window.__control.setLayoutPreset(id), pid)
  await page.waitForTimeout(380)
  result[pid] = await page.evaluate(() => {
    const scroll = document.querySelector('.cc-scroll')
    const grid = document.querySelector('.cc-grid')
    const cells = [...document.querySelectorAll('.cc-cell')]
    const rows = cells.map((c) => {
      const cs = getComputedStyle(c)
      return {
        start: parseInt(cs.gridRowStart, 10),
        span: parseInt(String(cs.gridRowEnd).replace('span', '').trim(), 10) || 1
      }
    })
    const maxEnd = Math.max(...rows.map((r) => r.start + r.span))
    const lastRowCount = rows.filter((r) => r.start + r.span === maxEnd).length
    const gr = grid.getBoundingClientRect()
    const sr = scroll.getBoundingClientRect()
    return {
      cells: cells.length,
      rows: maxEnd,
      lastRowCount,
      hasOverflowClass: scroll.classList.contains('has-overflow'),
      overflowY: getComputedStyle(scroll).overflowY,
      touchAction: getComputedStyle(scroll).touchAction,
      scrollH: scroll.scrollHeight,
      clientH: scroll.clientHeight,
      delta: scroll.scrollHeight - scroll.clientHeight,
      gridH: Math.round(gr.height),
      gridBottomVsScrollBottom: Math.round(gr.bottom - sr.bottom)
    }
  })
  const r = result[pid]
  console.log(`  [${pid}] rows=${r.rows} lastRow=${r.lastRowCount}格 delta=${r.delta} overflow=${r.hasOverflowClass ? 'YES' : 'no '} overflowY=${r.overflowY} touch=${r.touchAction} gridH=${r.gridH}`)
}

writeFileSync(OUT, JSON.stringify(result, null, 2))
console.log(`\n已写入 ${OUT}`)
await browser.close()
