import { chromium } from 'playwright'

const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: 440, height: 900 }, deviceScaleFactor: 2 })

await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
await page.waitForTimeout(600)

// Unlock
await page.evaluate(() => {
  window.__system?.unlock()
})
await page.waitForTimeout(500)

// 1. Capture side volume on default wallpaper
await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  if (control) {
    control.setVolume(0.75)
    control.sideVolumeMode = 'expanded'
    control.sideVolumePulse += 1
  }
})
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/vwork/comp-side-vol-cubes.png' })

// Close side volume and open Control Center
await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  if (control) {
    control.closeSideVolume()
  }
})
await page.waitForTimeout(400)

await page.click('.edge-cc')
await page.waitForTimeout(600)
await page.screenshot({ path: '/tmp/vwork/comp-cc-cubes.png' })

// Close CC and switch to nature-coast wallpaper
await page.evaluate(async () => {
  window.__system?.closeOverlay?.('controlCenter')
  const app = document.querySelector('#app')?.__vue_app__
  const wallpaper = app?.config?.globalProperties?.$pinia?._s?.get('wallpaper')
  if (wallpaper) {
    const coastUrl = new URL('/src/assets/img/personalization/generated/nature-coast.jpg', window.location.href).href
    wallpaper.applyHome(coastUrl)
  }
})
await page.waitForTimeout(500)

// Open side volume on nature-coast
await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  if (control) {
    control.setVolume(0.75)
    control.sideVolumeMode = 'expanded'
    control.sideVolumePulse += 1
  }
})
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/vwork/comp-side-vol-coast.png' })

// Reset wallpaper to cubes
await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const wallpaper = app?.config?.globalProperties?.$pinia?._s?.get('wallpaper')
  if (wallpaper) {
    const cubesUrl = new URL('/src/assets/img/personalization/generated/abstract-geometric-cubes.png', window.location.href).href
    wallpaper.applyHome(cubesUrl)
  }
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  if (control) {
    control.closeSideVolume()
  }
})
await page.waitForTimeout(300)

await browser.close()
console.log('Comparison screenshots captured!')
