// 产物目录：可用 ARTIFACT_DIR 覆盖；默认落到系统临时目录，跨机器/跨 lane 可移植
import fsSync from 'node:fs'
import osSync from 'node:os'
import pathSync from 'node:path'
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || pathSync.join(osSync.tmpdir(), 'vwork')
fsSync.mkdirSync(ARTIFACT_DIR, { recursive: true })
import { chromium } from 'playwright'

const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 440, height: 950 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()

  await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // 1. Screenshot default (cubes)
  await page.screenshot({ path: `${ARTIFACT_DIR}/test_wp_cubes.png` })

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
  await page.screenshot({ path: `${ARTIFACT_DIR}/test_wp_coast.png` })

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
  await page.screenshot({ path: `${ARTIFACT_DIR}/test_wp_field.png` })

  await browser.close()
  console.log('Done capturing wallpapers')
}

run().catch(console.error)
