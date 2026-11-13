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
  await flashBtn.screenshot({ path: `${ARTIFACT_DIR}/new_cc_style_flash.png` })

  const camBtn = page.locator('.ls-shortcut').nth(1)
  await camBtn.screenshot({ path: `${ARTIFACT_DIR}/new_cc_style_cam.png` })

  const shortcuts = page.locator('.ls-shortcuts')
  await shortcuts.screenshot({ path: `${ARTIFACT_DIR}/new_cc_style_both.png` })

  // Full lockscreen
  await page.screenshot({ path: `${ARTIFACT_DIR}/new_cc_style_cubes.png` })

  // 2. Change wallpaper to nature-coast
  await page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const store = app?.config?.globalProperties?.$pinia?._s?.get('wallpaper')
    if (store) {
      store.applyBoth('/src/assets/img/personalization/generated/nature-coast.jpg')
    }
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${ARTIFACT_DIR}/new_cc_style_coast.png` })

  // 3. Change wallpaper to person-field
  await page.evaluate(() => {
    const app = document.querySelector('#app')?.__vue_app__
    const store = app?.config?.globalProperties?.$pinia?._s?.get('wallpaper')
    if (store) {
      store.applyBoth('/src/assets/img/personalization/generated/person-field.jpg')
    }
  })
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${ARTIFACT_DIR}/new_cc_style_field.png` })

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
