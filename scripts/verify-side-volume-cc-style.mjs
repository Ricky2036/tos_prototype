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

// Open side volume bar
await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  if (control) {
    control.setVolume(0.75)
    control.sideVolumeMode = 'expanded'
    control.sideVolumePulse += 1
  }
})
await page.waitForTimeout(600)

// Take full screenshot
await page.screenshot({ path: '/tmp/vwork/side-volume-full.png' })

// Take crop around side volume
const wrap = await page.$('.side-volume-wrap')
if (wrap) {
  const box = await wrap.boundingBox()
  if (box) {
    await page.screenshot({
      path: '/tmp/vwork/side-volume-crop.png',
      clip: {
        x: Math.max(0, box.x - 20),
        y: Math.max(0, box.y - 20),
        width: box.width + 190,
        height: box.height + 40
      }
    })
  }
}

// Also capture custom button zoomed in
const customBtn = await page.$('.sv-custom')
if (customBtn) {
  const box = await customBtn.boundingBox()
  if (box) {
    await page.screenshot({
      path: '/tmp/vwork/side-volume-custom-btn.png',
      clip: {
        x: Math.max(0, box.x - 10),
        y: Math.max(0, box.y - 10),
        width: box.width + 20,
        height: box.height + 20
      }
    })
  }
}

await browser.close()
console.log('Screenshots captured to /tmp/vwork!')
