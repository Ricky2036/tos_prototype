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

  console.log('Navigating to http://127.0.0.1:1111/ ...')
  await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // 1. Desktop state: capture home with light chrome (white icons / indicator)
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.unlock()
    }
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/verify_chrome_home.png' })
  console.log('1. Captured desktop home screenshot')

  // 2. Open Settings App: main settings page (white page -> dark chrome: black time/icons and dark pill)
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.openApp('settings')
    }
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/verify_chrome_settings_main.png' })
  console.log('2. Captured settings main screenshot')

  // 3. Click "壁纸与个性化" to open Personalization (black page -> light chrome: white time/icons and white pill)
  const cell = page.locator('.list-cell:has-text("壁纸与个性化"), .list-cell:has-text("个性化")').first()
  if (await cell.count() > 0) {
    await cell.scrollIntoViewIfNeeded()
    await cell.click()
    await page.waitForTimeout(600)
  }
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/verify_chrome_personalization_dark.png' })
  console.log('3. Captured personalization dark screenshot')

  // 4. Click a wallpaper to enter full screen preview
  const wallpaperCard = page.locator('.wallpaper-card, .preset-card, .wallpaper-thumb-card').first()
  if (await wallpaperCard.count() > 0) {
    await wallpaperCard.click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/verify_chrome_preview_fullscreen.png' })
    console.log('4. Captured preview fullscreen screenshot')
  }

  // 5. Test threeButton navigation mode inversion
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.setNavigationMode('threeButton')
    }
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/verify_chrome_three_button_dark_bg.png' })
  console.log('5. Captured three-button nav on dark background')

  await page.evaluate(() => {
    if (window.__system) {
      window.__system.openApp('messages')
    }
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/verify_chrome_three_button_light_bg.png' })
  console.log('6. Captured three-button nav on light background (Messages app)')

  // Reset back to gesture mode
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.setNavigationMode('gesture')
    }
  })

  await browser.close()
  console.log('Verification completed successfully!')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
