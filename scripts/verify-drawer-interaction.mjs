import { chromium } from 'playwright'
import { mkdir, copyFile } from 'node:fs/promises'
import { join } from 'node:path'

const ARTIFACT_DIR = '/Users/jingzhan.chen/.gemini/antigravity/brain/2fe9223f-ceff-4348-80f0-bc918deb553a'
const OUT_DIR = '/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-antigravity/.motion/verify-drawer'

async function run() {
  await mkdir(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  })
  const context = await browser.newContext({
    viewport: { width: 444, height: 960 },
    deviceScaleFactor: 2
  })
  const page = await context.newPage()

  console.log('Navigating to http://127.0.0.1:1111/ ...')
  await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 1. 解锁到桌面
  console.log('Unlocking phone with window.__system.unlock()...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.unlock()
    }
  })
  await page.waitForTimeout(600)

  // 2. 打开应用抽屉 (验证抽屉展开)
  console.log('Opening App Drawer...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.setOverlayProgress('appLibrary', 1)
      window.__system.settleOverlay('appLibrary', true)
    }
  })
  await page.waitForTimeout(600)

  // 确保抽屉处于可见状态
  await page.waitForSelector('.app-library-drawer', { state: 'visible', timeout: 5000 })

  // 截图 1: 全部应用视图 (All Tab)
  console.log('Taking Screenshot 1: All Tab...')
  const shot1 = join(OUT_DIR, '01_drawer_all_tab.png')
  await page.screenshot({ path: shot1 })
  await copyFile(shot1, join(ARTIFACT_DIR, 'drawer_all_tab.png'))

  // 截图 2: 字母导轨与滚动联动
  console.log('Testing Alphabet Scrubber...')
  const letterW = page.locator('.scrubber-item:text("W")')
  if (await letterW.isVisible()) {
    await letterW.click()
    await page.waitForTimeout(400)
  }
  const shot2 = join(OUT_DIR, '02_drawer_scrubber.png')
  await page.screenshot({ path: shot2 })
  await copyFile(shot2, join(ARTIFACT_DIR, 'drawer_scrubber.png'))

  // 截图 2b: 字母导轨拖动悬浮大字母气泡
  console.log('Testing Alphabet Scrubber dragging bubble...')
  const scrubber = page.locator('.alphabet-scrubber')
  const sBox = await scrubber.boundingBox()
  if (sBox) {
    const startX = sBox.x + sBox.width / 2
    const startY = sBox.y + sBox.height * 0.4
    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.waitForTimeout(200)
    const shotBubble = join(OUT_DIR, '02b_drawer_bubble.png')
    await page.screenshot({ path: shotBubble })
    await copyFile(shotBubble, join(ARTIFACT_DIR, 'drawer_bubble.png'))
    await page.mouse.up()
    await page.waitForTimeout(300)
  }

  // 截图 3: 分类 Tab (14 大分类大卡片)
  console.log('Switching to Category Tab...')
  const categoryBtn = page.locator('.capsule-btn:text("分类")')
  await categoryBtn.click()
  await page.waitForTimeout(600)

  const shot3 = join(OUT_DIR, '03_drawer_category_tab.png')
  await page.screenshot({ path: shot3 })
  await copyFile(shot3, join(ARTIFACT_DIR, 'drawer_category_tab.png'))

  // 截图 4: 底部搜索交互
  console.log('Testing Drawer Search...')
  const searchInput = page.locator('.search-input')
  await searchInput.click()
  await searchInput.fill('微信')
  await page.waitForTimeout(500)

  const shot4 = join(OUT_DIR, '04_drawer_search_results.png')
  await page.screenshot({ path: shot4 })
  await copyFile(shot4, join(ARTIFACT_DIR, 'drawer_search_results.png'))

  // 5. 点击搜索结果中的应用启动
  console.log('Launching app from search results...')
  const wechatResult = page.locator('.result-item:has-text("微信")').first()
  if (await wechatResult.isVisible()) {
    await wechatResult.click()
    await page.waitForTimeout(800)
  }

  const shot5 = join(OUT_DIR, '05_app_launched.png')
  await page.screenshot({ path: shot5 })
  await copyFile(shot5, join(ARTIFACT_DIR, 'drawer_app_launched.png'))

  console.log('All verification steps succeeded!')
  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
