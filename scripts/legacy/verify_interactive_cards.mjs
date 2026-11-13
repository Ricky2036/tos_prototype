import { chromium } from 'playwright'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
})

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2
})

console.log('Navigating to http://localhost:1111 ...')
await page.goto('http://localhost:1111')
await page.waitForTimeout(1500)

// Unlock phone
console.log('Unlocking phone...')
await page.evaluate(() => {
  window.__system?.unlock()
})
await page.waitForTimeout(600)

// Select island module in DevConsole
console.log('Selecting island module...')
await page.selectOption('#desktop-module-select', 'island')
await page.waitForTimeout(500)

// 1. Test Flashlight Off & On
console.log('Testing Flashlight interaction...')
const flashlightBtn = page.locator('button:has-text("手电筒")')
await flashlightBtn.click()
await page.waitForTimeout(600)
await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_flashlight_off.png' })

// Click "Open" button inside the flashlight card on phone
console.log('Clicking Open button on flashlight card...')
const openBtn = page.locator('.fl-action-btn:has-text("Open"), .dyn-hit-area')
if (await openBtn.count() > 0) {
  await openBtn.first().click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_flashlight_on.png' })
}

// 2. Test Media Extended
console.log('Testing Media Extended interaction...')
const mediaBtn = page.locator('button:has-text("音乐")')
await mediaBtn.click()
await page.waitForTimeout(600)
await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_media_interactive.png' })

// Click Pause button
const playPauseBtn = page.locator('.med-ctrl-btn.is-play')
if (await playPauseBtn.count() > 0) {
  await playPauseBtn.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_media_paused.png' })
}

// 3. Test DevConsole appearance
console.log('Testing DevConsole clean appearance...')
await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_clean_console.png' })

console.log('Verification finished successfully!')
await browser.close()
