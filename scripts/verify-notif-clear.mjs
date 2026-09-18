import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.resolve('.motion/verify-clear')
fs.mkdirSync(OUT_DIR, { recursive: true })

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  })
  const context = await browser.newContext({
    viewport: { width: 444, height: 960 },
    deviceScaleFactor: 2
  })
  const page = await context.newPage()

  console.log('Navigating to http://localhost:1111/ ...')
  await page.goto('http://localhost:1111/', { waitUntil: 'networkidle' })

  // Open notification center by clicking edge-nc
  console.log('Opening Notification Center...')
  await page.click('.edge-zone.edge-nc')
  await page.waitForTimeout(600) // wait for NC open transition

  // Capture frame 0: before clearing
  const phoneBox = await page.locator('.screen-view').boundingBox()
  console.log('Phone screen bounds:', phoneBox)

  await page.screenshot({ path: `${OUT_DIR}/step_00_initial.png`, clip: phoneBox })
  console.log('Captured step_00_initial.png')

  // Check initial notifications count
  const initialCards = await page.locator('.nc-item-wrapper').count()
  const initialClearable = await page.locator('.nc-item-wrapper:not(.is-persistent)').count()
  const initialPersistent = await page.locator('.nc-item-wrapper.is-persistent').count()
  console.log(`Initial total cards: ${initialCards}, clearable: ${initialClearable}, persistent: ${initialPersistent}`)

  // Find and click the clear button
  const clearBtn = page.locator('.nc-clear-fab-slot button')
  const hasClearBtn = await clearBtn.isVisible()
  console.log('Clear button visible:', hasClearBtn)
  if (!hasClearBtn) {
    throw new Error('Clear button is not visible!')
  }

  // Click clear button
  console.log('Clicking clear button...')
  await clearBtn.click()

  // High frequency frame captures during flight & FLIP upward transition
  const intervals = [40, 80, 120, 160, 200, 260, 320, 380, 480, 650, 900]
  let elapsed = 0
  for (let i = 0; i < intervals.length; i++) {
    const targetTime = intervals[i]
    const waitTime = targetTime - elapsed
    if (waitTime > 0) {
      await page.waitForTimeout(waitTime)
      elapsed = targetTime
    }
    const filename = `${OUT_DIR}/step_${String(i + 1).padStart(2, '0')}_${targetTime}ms.png`
    await page.screenshot({ path: filename, clip: phoneBox })
    console.log(`Captured ${filename}`)
  }

  // Check final state
  const finalCards = await page.locator('.nc-item-wrapper').count()
  const finalPersistent = await page.locator('.nc-item-wrapper.is-persistent').count()
  const finalClearable = await page.locator('.nc-item-wrapper:not(.is-persistent)').count()
  const clearBtnAfter = await page.locator('.nc-clear-fab-slot button').isVisible()

  console.log(`Final cards: ${finalCards}, persistent: ${finalPersistent}, clearable: ${finalClearable}`)
  console.log('Clear button visible after clear:', clearBtnAfter)

  if (finalClearable !== 0) {
    throw new Error(`Expected 0 clearable cards, but found ${finalClearable}`)
  }
  if (finalPersistent !== initialPersistent) {
    throw new Error(`Expected ${initialPersistent} persistent cards to remain, but found ${finalPersistent}`)
  }
  if (clearBtnAfter) {
    throw new Error('Expected clear button to be hidden after all clearable notifications are removed!')
  }

  console.log('All verification assertions passed!')
  await browser.close()
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
