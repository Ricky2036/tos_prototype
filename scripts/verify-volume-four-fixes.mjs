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

// 1. Open side volume bar
await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  if (control) {
    control.setVolume(0.70)
    control.sideVolumeMode = 'expanded'
    control.sideVolumePulse += 1
  }
})
await page.waitForTimeout(400)

// Capture expanded state (centered dots + translucent track + button)
await page.screenshot({ path: '/tmp/vwork/fix-side-vol-expanded.png' })

const wrap = await page.$('.side-volume-wrap')
if (wrap) {
  const box = await wrap.boundingBox()
  if (box) {
    await page.screenshot({
      path: '/tmp/vwork/fix-side-vol-crop.png',
      clip: {
        x: Math.max(0, box.x - 20),
        y: Math.max(0, box.y - 20),
        width: box.width + 190,
        height: box.height + 40
      }
    })
  }
}

// Zoom in on the top more dots
const moreBtn = await page.$('.sv-more')
if (moreBtn) {
  const box = await moreBtn.boundingBox()
  if (box) {
    await page.screenshot({
      path: '/tmp/vwork/fix-dots-zoom.png',
      clip: {
        x: Math.max(0, box.x - 5),
        y: Math.max(0, box.y - 5),
        width: box.width + 10,
        height: box.height + 10
      }
    })
  }
}

// 2. Test compact mode and clicking to expand
console.log('Testing compact mode and clicking to expand...')
await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  if (control) {
    control.sideVolumeMode = 'compact'
  }
})
await page.waitForTimeout(400)

// Capture compact mode screenshot
await page.screenshot({ path: '/tmp/vwork/fix-side-vol-compact.png' })

// Click the compact volume track
console.log('Clicking on compact volume bar...')
await page.click('.side-volume-wrap.compact')
await page.waitForTimeout(400)

const modeAfterClick = await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  return control?.sideVolumeMode
})
console.log('Mode after clicking compact bar:', modeAfterClick)
if (modeAfterClick !== 'expanded') {
  throw new Error(`Expected expanded after clicking compact bar, got ${modeAfterClick}`)
}

// 3. Test 10s auto-dismiss:
console.log('Testing 10s auto-dismiss...')
// Reset pulse to start fresh timer
await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  if (control) {
    control.sideVolumePulse += 1
  }
})

// Wait 6 seconds (before, it closed at 5 seconds)
await page.waitForTimeout(6000)
const modeAt6s = await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  return control?.sideVolumeMode
})
console.log('Mode at 6s (should still be expanded):', modeAt6s)
if (modeAt6s !== 'expanded') {
  throw new Error(`Expected expanded at 6s, got ${modeAt6s}`)
}

// Wait another 4.5 seconds (total > 10s)
await page.waitForTimeout(4500)
const modeAt10s = await page.evaluate(() => {
  const app = document.querySelector('#app')?.__vue_app__
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  return control?.sideVolumeMode
})
console.log('Mode at 10.5s (should be hidden):', modeAt10s)
if (modeAt10s !== 'hidden') {
  throw new Error(`Expected hidden at 10.5s, got ${modeAt10s}`)
}

// 4. Capture on nature coast wallpaper as well
await page.evaluate(async () => {
  const app = document.querySelector('#app')?.__vue_app__
  const wallpaper = app?.config?.globalProperties?.$pinia?._s?.get('wallpaper')
  if (wallpaper) {
    const coastUrl = new URL('/src/assets/img/personalization/generated/nature-coast.jpg', window.location.href).href
    wallpaper.applyHome(coastUrl)
  }
  const control = app?.config?.globalProperties?.$pinia?._s?.get('control')
  if (control) {
    control.setVolume(0.70)
    control.sideVolumeMode = 'expanded'
    control.sideVolumePulse += 1
  }
})
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/vwork/fix-side-vol-coast.png' })

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

await browser.close()
console.log('All verifications passed!')
