#!/usr/bin/env node
/**
 * 锁屏 / 通知中心 通知卡片高度自适应验收（浏览器侧，真实几何）
 * =================================================================
 * 背景：阔直板（426pt）比直板（360pt）宽，描述文案常常 1 行就放得下。
 * 锁屏卡片曾写死 90px ⇒ 文字只占上半截，底部空一大块（这就是本轮要修的问题）。
 * 现在卡片高度由内容撑开：实测 1 行 68、2 行 85，实测值再回喂堆叠/滚动几何。
 *
 * 断言（每一条都是真几何，不读 CSS 源码）：
 *   ① 直板：2 行描述的卡片高度落在 [80, 92]，且内容不溢出
 *   ② 阔直板：1 行描述的卡片高度落在 [60, 74]，且内容不溢出
 *   ③ 展开态相邻卡片间距 ≈ 8px（自适应高度后仍保持统一节奏）
 *   ④ 灵动岛活动卡片仍是模板固定高度 84px（不被自适应逻辑带偏）
 *   ⑤ 通知中心同一场景下卡片高度随内容变化（1 行 vs 2 行差 ≥ 12px）
 *
 * 用法：node scripts/verify-lockscreen-notif-adaptive.mjs [port]   （默认 7777）
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const PORT = process.argv[2] || process.env.PORT || '7777'
const BASE = `http://127.0.0.1:${PORT}/`

const checks = []
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail })
  console.log(`${ok ? '✔' : '✖'} ${name}${detail ? ' — ' + detail : ''}`)
}

const execPath = [process.env.PLAYWRIGHT_CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find(p => fs.existsSync(p))
const browser = await chromium.launch(execPath ? { executablePath: execPath } : {})
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

function readNotifCards() {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll('.ls-card-wrapper[data-notif-id]')]
    return cards.map((w) => {
      const front = w.querySelector('.ls-card-front')
      const desc = w.querySelector('.ls-notif-desc')
      const lh = desc ? parseFloat(getComputedStyle(desc).lineHeight) || 17.55 : 0
      return {
        id: w.dataset.notifId,
        height: w.offsetHeight,
        overflow: front ? front.scrollHeight - front.clientHeight : 0,
        lines: desc && lh ? Math.round(desc.getBoundingClientRect().height / lh) : 0,
        top: w.getBoundingClientRect().top,
        bottom: w.getBoundingClientRect().bottom
      }
    })
  })
}

async function openForm(form) {
  await page.goto(BASE + '?form=' + form, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
}

/* ① 直板：存在 2 行卡片，高度应 ≈ 85 */
await openForm('slab')
const slabCards = await readNotifCards()
const slabTwoLine = slabCards.filter((c) => c.lines >= 2)
const slabHeightOk = slabTwoLine.length > 0 && slabTwoLine.every((c) => c.height >= 80 && c.height <= 92)
check('直板 2 行卡片高度落在 80–92px', slabHeightOk, slabTwoLine.map((c) => c.height).join('/'))
check('直板卡片内容不溢出', slabCards.every((c) => c.overflow <= 1), 'max overflow ' + Math.max(...slabCards.map((c) => c.overflow)))

/* ② 阔直板：1 行卡片高度应 ≈ 68（写死 90 时这里会红） */
await openForm('wide')
const wideCards = await readNotifCards()
const wideOneLine = wideCards.filter((c) => c.lines <= 1)
const wideHeightOk = wideOneLine.length >= 3 && wideOneLine.every((c) => c.height >= 60 && c.height <= 74)
check('阔直板 1 行卡片高度落在 60–74px', wideHeightOk, wideOneLine.map((c) => c.height).join('/'))
check('阔直板卡片内容不溢出', wideCards.every((c) => c.overflow <= 1), 'max overflow ' + Math.max(...wideCards.map((c) => c.overflow)))
check('阔直板 1 行卡片明显矮于旧固定高度 90px', wideOneLine.every((c) => c.height <= 74), 'max ' + Math.max(...wideOneLine.map((c) => c.height)))

/* ③ 展开态相邻卡片间距 ≈ 8px（自适应高度后仍统一） */
await page.evaluate(() => { const c = document.querySelector('.ls-clip'); if (c) c.scrollTop = c.scrollHeight })
await page.waitForTimeout(600)
const gapCards = await readNotifCards()
/* 最底端那张仍可能带轻微堆叠缩放（视觉底边被 scale 收掉 1–2px），容差放到 ±2.5 */
const gaps = gapCards.slice(1).map((c, i) => +(c.top - gapCards[i].bottom).toFixed(1))
check('展开态相邻卡片间距 ≈ 8px', gaps.length > 0 && gaps.every((g) => Math.abs(g - 8) <= 2.5), gaps.join('/'))

/* ④ 灵动岛活动卡片仍为固定模板高度 84 */
await page.evaluate(() => {
  const app = document.querySelector('#app').__vue_app__
  const pinia = app.config.globalProperties.$pinia
  pinia._s.get('notifications').setIslandEnabled('alarm', true)
  pinia._s.get('clock').triggerAlarm()
})
await page.waitForTimeout(1000)
const activity = await page.evaluate(() => {
  const w = document.querySelector('.ls-card-wrapper.is-activity, .ls-card-wrapper.ls-activity-standalone')
  if (!w) return null
  const front = w.querySelector('.ls-card-front')
  return { height: w.offsetHeight, frontPos: front ? getComputedStyle(front).position : null }
})
check('活动卡片仍为 84px 固定高度', !!activity && activity.height === 84, activity ? String(activity.height) : 'missing')
check('活动卡片表层仍铺满包装器（absolute）', !!activity && activity.frontPos === 'absolute', activity?.frontPos || '')
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  pinia._s.get('clock').dismissAlarm()
})
await page.waitForTimeout(500)

/* ⑤ 通知中心：同一表单下卡片高度随内容变化（证明它是内容驱动而不是固定高） */
await openForm('wide')
await page.locator('.edge-nc').click({ position: { x: 60, y: 6 }, force: true })
await page.waitForTimeout(900)
const ncCards = await page.evaluate(() => {
  /* 只取未进入底部堆叠（无 transform）的卡片：堆叠卡片会被 scale，几何不再代表内容高度 */
  return [...document.querySelectorAll('.nc-item-wrapper')]
    .map((w) => {
      const card = w.querySelector('.nc-card')
      const desc = w.querySelector('.nc-card-desc')
      if (!card || card.style.transform) return null
      const lh = desc ? parseFloat(getComputedStyle(desc).lineHeight) || 20 : 20
      return {
        height: card.offsetHeight,
        lines: desc && lh ? Math.round(desc.offsetHeight / lh) : 0
      }
    })
    .filter(Boolean)
})
const ncOne = ncCards.filter((c) => c.lines <= 1).map((c) => c.height)
const ncTwo = ncCards.filter((c) => c.lines >= 2).map((c) => c.height)
const ncGap = (ncOne.length && ncTwo.length) ? Math.min(...ncTwo) - Math.max(...ncOne) : 0
check('通知中心卡片高度随行数变化 ≥ 12px', ncCards.length > 3 && ncGap >= 12, `1行 ${ncOne.join('/')} · 2行 ${ncTwo.join('/')} · Δ${ncGap.toFixed(1)}`)

check('控制台无报错', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()

const pass = checks.filter((c) => c.ok).length
const fail = checks.length - pass
console.log(`[lockscreen-notif] ${pass} PASS / ${fail} FAIL`)
process.exit(fail === 0 ? 0 : 1)
