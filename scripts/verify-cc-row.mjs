/* 校验：控制中心「隐私指示 + 双卡显示」合并成一行
 * 用法: node scripts/verify-cc-row.mjs [port]
 *
 * 2026-10-14 按 DevConsole 新结构重写 —— 旧脚本已**完全失效**（必然 TimeoutError）：
 *   · 模块切换从 `.pc-tab-btn` 点击 → 改成 `<select id="desktop-module-select">` 的 selectOption。
 *     （10-13 的 "dropdown module switcher" 重构删光了 tab 按钮。）
 *   · 卡片容器从 `.pc-card-duo > .pc-card` → 改成 `.pc-duo-row > .pc-duo-item`。
 *
 * 判据只写「应该成立的关系」，不写死绝对像素 —— 改设计（换间距/换宽度）不该假红：
 *   ① 合并行里恰好 2 项，标题就是「隐私指示」与「双卡显示」
 *   ② 同一行：两项竖直中心差 ≤ 1px
 *   ③ 等宽：两项宽度差 ≤ 1px
 *   ④ 不重叠：两项横向间距 ≥ 0
 *   ⑤ 两个开关都能点（点击后 checked 翻转）
 */
import { chromium } from 'playwright'

const PORT = process.argv[2] || '5555'
const URL = `http://127.0.0.1:${PORT}/`

const CHROME_FALLBACK =
  process.env.PLAYWRIGHT_CHROME ||
  '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'

const browser = await chromium.launch({ executablePath: CHROME_FALLBACK })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)

let allOk = true
function check(name, cond, detail) {
  const ok = !!cond
  if (!ok) allOk = false
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

/* 切到「控制中心」模块。旧版是点 `.pc-tab-btn`，现在是下拉选择器。 */
await page.selectOption('#desktop-module-select', 'control')
await page.waitForTimeout(600)

/** 读合并行：返回两项的几何 + 选中态 */
async function report(tag) {
  const data = await page.evaluate(() => {
    const row = document.querySelector('.pc-duo-row')
    if (!row) return { found: false }
    const items = [...row.querySelectorAll(':scope > .pc-duo-item')].map((el) => {
      const r = el.getBoundingClientRect()
      return {
        text: el.querySelector('.pc-card-title')?.textContent.trim() || '',
        x: +r.x.toFixed(1),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        cy: +(r.y + r.height / 2).toFixed(1),
        right: +(r.x + r.width).toFixed(1),
        on: !!el.querySelector('input')?.checked
      }
    })
    return { found: true, n: items.length, items }
  })
  console.log(`\n[${tag}] .pc-duo-row 项数 = ${data.n ?? 0}`)
  if (data.found) {
    for (const c of data.items) console.log(`  「${c.text}」 x=${c.x} w=${c.w} h=${c.h} cy=${c.cy} on=${c.on}`)
  }
  return data
}

/* ---------- 静态结构 ---------- */
let d = await report('初始')
check('.pc-duo-row 存在且恰好 2 项', d.found && d.n === 2, `n=${d.n}`)
if (d.found && d.n === 2) {
  const [a, b] = d.items
  check('  两项就是「隐私指示」与「双卡显示」', a.text === '隐私指示' && b.text === '双卡显示', `[${a.text}, ${b.text}]`)
  check('  同一行（竖直中心差 ≤1px）', Math.abs(a.cy - b.cy) <= 1, `Δcy=${(a.cy - b.cy).toFixed(1)}`)
  check('  等宽（宽度差 ≤1px）', Math.abs(a.w - b.w) <= 1, `${a.w} vs ${b.w}`)
  check('  不重叠（间距 ≥0）', b.x - a.right >= 0, `gap=${(b.x - a.right).toFixed(1)}`)
}

/* ---------- 交互：两个开关都要能点 ---------- */
const before = d.found ? d.items.map((i) => i.on) : []
await page.locator('.pc-duo-row .pc-duo-item').nth(0).locator('.pc-switch-wrap').click()
await page.waitForTimeout(250)
await page.locator('.pc-duo-row .pc-duo-item').nth(1).locator('.pc-switch-wrap').click()
await page.waitForTimeout(350)
d = await report('点击两个开关后')
if (d.found && d.n === 2) {
  const [a, b] = d.items
  check('  第 1 个开关点击后状态翻转', a.on !== before[0], `${before[0]} → ${a.on}`)
  check('  第 2 个开关点击后状态翻转', b.on !== before[1], `${before[1]} → ${b.on}`)
  check('  点击不破坏合并行（仍在同一行、仍等宽）', Math.abs(a.cy - b.cy) <= 1 && Math.abs(a.w - b.w) <= 1, `Δcy=${(a.cy - b.cy).toFixed(1)} Δw=${(a.w - b.w).toFixed(1)}`)
}

/* ---------- 取证截图（沿用既有文件名，只覆写不新增） ---------- */
const panel = page.locator('.proto-console')
await panel.screenshot({ path: 'shots/51-cc-console-merged-row.png' })
await page.screenshot({ path: 'shots/52-cc-console-full.png' })
console.log('\n截图：shots/51-cc-console-merged-row.png · shots/52-cc-console-full.png')

await browser.close()
console.log(allOk ? '\n全部通过 ✅' : '\n有失败项 ❌')
process.exit(allOk ? 0 : 1)
