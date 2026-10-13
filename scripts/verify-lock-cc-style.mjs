import { chromium } from 'playwright'

const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 440, height: 950 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // Ensure lock screen is locked
  await page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const sys = app?.config?.globalProperties?.$pinia?._s?.get('system')
    if (sys) {
      sys.isLocked = true
      sys.isScreenOn = true
    }
  })
  await page.waitForTimeout(500)

  // 1. Screenshot lockscreen buttons on default cubes wallpaper
  const flashBtn = page.locator('.ls-shortcut').first()
  await flashBtn.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/new_cc_style_flash.png' })

  const camBtn = page.locator('.ls-shortcut').nth(1)
  await camBtn.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/new_cc_style_cam.png' })

  const shortcuts = page.locator('.ls-shortcuts')
  await shortcuts.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/new_cc_style_both.png' })

  // Full lockscreen
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/new_cc_style_cubes.png' })

  // 2. Change wallpaper to nature-coast
  await page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const store = app?.config?.globalProperties?.$pinia?._s?.get('wallpaper')
    if (store) {
      store.applyBoth('/src/assets/img/personalization/generated/nature-coast.jpg')
    }
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/new_cc_style_coast.png' })

  // 3. Change wallpaper to person-field
  await page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const store = app?.config?.globalProperties?.$pinia?._s?.get('wallpaper')
    if (store) {
      store.applyBoth('/src/assets/img/personalization/generated/person-field.jpg')
    }
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/new_cc_style_field.png' })

  // Reset back to default wallpaper
  await page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const store = app?.config?.globalProperties?.$pinia?._s?.get('wallpaper')
    if (store) {
      store.applyBoth('/src/assets/img/personalization/generated/abstract-geometric-cubes.jpg')
    }
  })
  await page.waitForTimeout(300)

  await browser.close()
  console.log('Finished capturing all new cc style screenshots!')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
