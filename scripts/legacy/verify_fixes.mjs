import { chromium } from 'playwright'
import path from 'path'

const artifactDir = '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7'

async function run() {
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
  await page.waitForTimeout(1200)

  // 解锁手机
  console.log('Unlocking phone...')
  await page.evaluate(() => {
    window.__system?.unlock()
  })
  await page.waitForTimeout(500)

  // 切换模块到灵动岛
  console.log('Selecting island module...')
  await page.selectOption('#desktop-module-select', 'island')
  await page.waitForTimeout(500)

  // 1. 打车 (Ride Hailing)
  console.log('1. Verifying Ride Hailing...')
  await page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("打车")').first().click()
  await page.waitForTimeout(600)
  const islandCard = page.locator('.island-card')
  await islandCard.screenshot({ path: path.join(artifactDir, 'verify_ride_hailing_fixed.png') })

  // 2. 导航 (Navigation)
  console.log('2. Verifying Navigation...')
  await page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("导航")').first().click()
  await page.waitForTimeout(600)
  await islandCard.screenshot({ path: path.join(artifactDir, 'verify_navigation_fixed.png') })

  // 3. 手电筒 (Flashlight)
  console.log('3. Verifying Flashlight...')
  await page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("手电筒")').first().click()
  await page.waitForTimeout(600)
  await islandCard.screenshot({ path: path.join(artifactDir, 'verify_flashlight_off_fixed.png') })

  // 点击开启手电筒
  console.log('Toggling Flashlight ON...')
  await islandCard.locator('.capsule-btn').click()
  await page.waitForTimeout(400)
  await islandCard.screenshot({ path: path.join(artifactDir, 'verify_flashlight_on_fixed.png') })

  // 4. 倒计时 (Timer)
  console.log('4. Verifying Timer...')
  await page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("倒计时")').first().click()
  await page.waitForTimeout(600)
  await islandCard.screenshot({ path: path.join(artifactDir, 'verify_timer_fixed.png') })

  // 5. 录屏 (Screen Recording)
  console.log('5. Verifying Screen Recording...')
  await page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("录屏")').first().click()
  await page.waitForTimeout(600)
  await islandCard.screenshot({ path: path.join(artifactDir, 'verify_screen_recording_fixed.png') })

  // 6. 控制台网格视图截图
  console.log('6. Verifying DevConsole Grid...')
  const devCard = page.locator('.pc-module-big-card')
  await devCard.screenshot({ path: path.join(artifactDir, 'verify_devconsole_fixed.png') })

  console.log('All verification screenshots captured successfully!')
  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
