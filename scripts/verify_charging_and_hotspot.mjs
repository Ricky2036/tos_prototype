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

  await page.goto('http://localhost:1111')
  await page.waitForTimeout(1200)

  // 解锁手机进入桌面
  console.log('Unlocking phone...')
  await page.evaluate(() => {
    window.__system?.unlock()
  })
  await page.waitForTimeout(500)

  // 切换模块到灵动岛
  console.log('Selecting island module...')
  await page.selectOption('#desktop-module-select', 'island')
  await page.waitForTimeout(500)

  // 1. 测试个人热点
  console.log('Testing Hotspot template...')
  const hotspotBtn = page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("热点")').first()
  await hotspotBtn.click()
  await page.waitForTimeout(600)

  const islandCard = page.locator('.island-card').first()
  await islandCard.screenshot({ path: path.join(artifactDir, 'test_hotspot_expanded.png') })
  console.log('Captured test_hotspot_expanded.png')

  // 2. 测试快充模版
  console.log('Testing Battery Charging template...')
  const chargingBtn = page.locator('.pc-module-big-card button.pc-sysapp-btn:has-text("快充")').first()
  await chargingBtn.click()
  await page.waitForTimeout(600)

  await islandCard.screenshot({ path: path.join(artifactDir, 'test_charging_default_hyper.png') })
  console.log('Captured test_charging_default_hyper.png')

  // 点击第 1 个按键 (低温慢充)
  console.log('Clicking cold charge button...')
  const coldBtn = page.locator('.mode-btn.btn-cold').first()
  await coldBtn.click()
  await page.waitForTimeout(500)
  await islandCard.screenshot({ path: path.join(artifactDir, 'test_charging_clicked_cold.png') })
  console.log('Captured test_charging_clicked_cold.png')

  // 点击第 2 个按键 (智能AI充)
  console.log('Clicking AI charge button...')
  const aiBtn = page.locator('.mode-btn.btn-ai').first()
  await aiBtn.click()
  await page.waitForTimeout(500)
  await islandCard.screenshot({ path: path.join(artifactDir, 'test_charging_clicked_ai.png') })
  console.log('Captured test_charging_clicked_ai.png')

  // 点击第 3 个按键 (超级闪充)
  console.log('Clicking hyper charge button...')
  const hyperBtn = page.locator('.mode-btn.btn-hyper').first()
  await hyperBtn.click()
  await page.waitForTimeout(500)
  await islandCard.screenshot({ path: path.join(artifactDir, 'test_charging_clicked_hyper.png') })
  console.log('Captured test_charging_clicked_hyper.png')

  await browser.close()
  console.log('All verification screenshots captured successfully!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
