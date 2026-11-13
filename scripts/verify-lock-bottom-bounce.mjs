// 产物目录：可用 ARTIFACT_DIR 覆盖；默认落到系统临时目录，跨机器/跨 lane 可移植
import fsSync from 'node:fs'
import osSync from 'node:os'
import pathSync from 'node:path'
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || pathSync.join(osSync.tmpdir(), 'vwork')
fsSync.mkdirSync(ARTIFACT_DIR, { recursive: true })
import { chromium } from 'playwright'

const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true
  })
  // Test with touch enabled device context
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  })
  const page = await ctx.newPage()

  await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // 1. Check stacked alphas
  const stackedAlphas = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.ls-card-wrapper'))
    return cards.map((c, i) => {
      const style = c.getAttribute('style') || ''
      const match = style.match(/--ls-card-bg-alpha:\s*([\d.]+)/)
      return { index: i, bgAlpha: match ? match[1] : null }
    })
  })
  console.log('Mobile Touch - Stacked alphas:', stackedAlphas)

  // Expand notifications
  await page.evaluate(() => {
    const clip = document.querySelector('.ls-clip')
    if (clip) clip.scrollTop = clip.scrollHeight
  })
  await page.waitForTimeout(300)

  // Check gaps between cards
  const cardsInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.ls-card-wrapper'))
    return cards.map((c, i) => {
      const rect = c.getBoundingClientRect()
      const title = c.querySelector('.ls-notif-title, .ls-overflow-activity-title')?.textContent?.trim() || ''
      return { index: i, title, top: rect.top, bottom: rect.bottom, height: rect.height }
    })
  })
  for (let i = 1; i < cardsInfo.length; i++) {
    const prev = cardsInfo[i - 1]
    const curr = cardsInfo[i]
    console.log(`Gap between '${prev.title}' and '${curr.title}': ${(curr.top - prev.bottom).toFixed(2)}px`)
  }

  // Touch overscroll drag test
  const lastCard = page.locator('.ls-card-wrapper').last()
  const box = await lastCard.boundingBox()
  if (box) {
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    console.log('Touching at:', { cx, cy })

    // Simulate touch swipe up past bottom
    await page.touchscreen.tap(cx, cy)
    // Wait for bounce / touch drag test
  }

  await page.screenshot({
    path: `${ARTIFACT_DIR}/verify_mobile_bottom.png`
  })
  console.log('Saved verify_mobile_bottom.png')

  await browser.close()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
