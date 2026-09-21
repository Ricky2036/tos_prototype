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

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()))
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message))

  await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Log the computed style and background alpha of the front card
  const alphaInfo = await page.evaluate(() => {
    const card = document.querySelector('.ls-card-wrapper')
    const front = document.querySelector('.ls-card-front')
    if (!card || !front) return null
    return {
      cardStyle: card.getAttribute('style'),
      frontBg: window.getComputedStyle(front).backgroundColor,
      frontBackdrop: window.getComputedStyle(front).backdropFilter
    }
  })
  console.log('Front card computed style:', alphaInfo)

  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/verify_alpha_stacked.png' })
  console.log('1. Captured default stacked state')

  await browser.close()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
