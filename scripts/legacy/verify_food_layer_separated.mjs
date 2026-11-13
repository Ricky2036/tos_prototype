
import { chromium } from 'playwright'

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
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

// Click Food Delivery button in DevConsole
console.log('Clicking Food Delivery template button...')
const deliveryBtn = page.locator('button:has-text("外卖履约")')
await deliveryBtn.click()
await page.waitForTimeout(800)

// Screenshot 1: initial state
console.log('Taking screenshot of new layer-separated Food Delivery template...')
const islandCard = page.locator('.island-card')
await islandCard.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/layer_separated_food_delivery_state1.png' })

// Click the card to advance progress
console.log('Clicking food delivery card to advance progress...')
await page.locator('.os16-food-card').click()
await page.waitForTimeout(500)

// Screenshot 2: advanced state
await islandCard.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/layer_separated_food_delivery_state2.png' })

// Full phone viewport screenshot
await page.screenshot({ path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/layer_separated_phone_view.png' })

console.log('Screenshots captured successfully!')
await browser.close()
