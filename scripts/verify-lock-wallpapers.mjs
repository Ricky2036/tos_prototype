import { chromium } from 'playwright'

const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 440, height: 950 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // 1. Screenshot default (cubes)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/test_wp_cubes.png' })

  // 2. Change wallpaper to nature-coast
  await page.evaluate(() => {
    const wp = window.__PINIA__?.state?.value?.wallpaper
    // Or dispatch pinia action
    const app = document.querySelector('#app')?.__vue_app__
    const store = app?.config?.globalProperties?.$pinia?._s?.get('wallpaper')
    if (store) {
      // Find nature-coast url or set active
      const coastUrl = '/src/assets/img/personalization/generated/nature-coast.jpg'
      store.applyBoth(coastUrl)
    }
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/test_wp_coast.png' })

  // 3. Change wallpaper to person-field
  await page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const store = app?.config?.globalProperties?.$pinia?._s?.get('wallpaper')
    if (store) {
      const fieldUrl = '/src/assets/img/personalization/generated/person-field.jpg'
      store.applyBoth(fieldUrl)
    }
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a/test_wp_field.png' })

  await browser.close()
  console.log('Done capturing wallpapers')
}

run().catch(console.error)
