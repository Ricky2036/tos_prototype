import { chromium } from 'playwright'

const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true
  })
  const ctx = await browser.newContext({
    viewport: { width: 440, height: 950 },
    deviceScaleFactor: 2
  })
  const page = await ctx.newPage()

  await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // 1. Inspect initial stacked state
  const stackedInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.ls-card-wrapper'))
    return cards.map((c, i) => {
      const rect = c.getBoundingClientRect()
      const title = c.querySelector('.ls-notif-title, .ls-overflow-activity-title')?.textContent?.trim() || ''
      const style = c.getAttribute('style') || ''
      const matchAlpha = style.match(/--ls-card-bg-alpha:\s*([\d.]+)/)
      const opacity = window.getComputedStyle(c).opacity
      const transform = window.getComputedStyle(c).transform
      return { index: i, title, top: rect.top, bottom: rect.bottom, height: rect.height, opacity, bgAlpha: matchAlpha ? matchAlpha[1] : null, transform }
    })
  })
  console.log('1. Initial Stacked State:', JSON.stringify(stackedInfo, null, 2))

  // Screenshot initial stacked state
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/verify_fixed_stack_initial.png'
  })
  console.log('Saved verify_fixed_stack_initial.png')

  // 2. Scroll to bottom
  await page.evaluate(() => {
    const clip = document.querySelector('.ls-clip')
    if (clip) clip.scrollTop = clip.scrollHeight
  })
  await page.waitForTimeout(300)

  // 3. Inspect bottom state
  const bottomInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.ls-card-wrapper'))
    return cards.map((c, i) => {
      const rect = c.getBoundingClientRect()
      const title = c.querySelector('.ls-notif-title, .ls-overflow-activity-title')?.textContent?.trim() || ''
      return { index: i, title, top: rect.top, bottom: rect.bottom, height: rect.height }
    })
  })
  console.log('2. Bottom State (scrolled to end):', JSON.stringify(bottomInfo, null, 2))

  for (let i = 1; i < bottomInfo.length; i++) {
    const prev = bottomInfo[i - 1]
    const curr = bottomInfo[i]
    console.log(`Gap between '${prev.title}' and '${curr.title}': ${(curr.top - prev.bottom).toFixed(2)}px`)
  }

  // Screenshot bottom state
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/verify_fixed_bottom_gap.png'
  })
  console.log('Saved verify_fixed_bottom_gap.png')

  await browser.close()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
