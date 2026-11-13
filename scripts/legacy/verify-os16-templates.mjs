import { chromium } from 'playwright'
import path from 'path'

const artifactDir = '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7'

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  console.log('Navigating to http://localhost:1111 ...')
  await page.goto('http://localhost:1111')
  await page.waitForTimeout(1500)

  // 解锁手机进入桌面
  console.log('Unlocking phone to HomeScreen...')
  await page.evaluate(() => {
    window.__system?.unlock()
  })
  await page.waitForTimeout(600)

  // 1. 在 DevConsole 中切换模块到灵动岛
  console.log('Selecting island module...')
  await page.selectOption('#desktop-module-select', 'island')
  await page.waitForTimeout(500)

  // 截图 1: 外卖履约
  console.log('Testing Food Delivery template...')
  await page.click('button:has-text("外卖履约")')
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(artifactDir, 'verify_os16_delivery.png') })

  // 截图 2: 系统引导 (三指截屏)
  console.log('Testing System Tip template...')
  await page.click('button:has-text("系统引导")')
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(artifactDir, 'verify_os16_system_tip.png') })

  // 截图 3: 同声传译
  console.log('Testing Translation template...')
  await page.click('button:has-text("同声传译")')
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(artifactDir, 'verify_os16_translation.png') })

  // 截图 3: 地图导航
  console.log('Testing Navigation template...')
  await page.click('button:has-text("地图导航")')
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(artifactDir, 'verify_os16_navigation.png') })

  // 截图 4: 超级快充
  console.log('Testing Battery template...')
  await page.click('button:has-text("超级快充")')
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(artifactDir, 'verify_os16_battery.png') })

  // 截图 5: 胶囊收起态
  console.log('Testing Compact Capsule state...')
  await page.evaluate(() => {
    const el = document.querySelector('.island-backdrop') || document.querySelector('.island-card')
    if (el) el.click()
  })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(artifactDir, 'verify_os16_capsule.png') })

  console.log('All screenshots captured successfully!')
  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
