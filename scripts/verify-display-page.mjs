import { chromium } from 'playwright'

const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true
  })
  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 950 },
    deviceScaleFactor: 2
  })
  const page = await ctx.newPage()

  console.log('Navigating to http://localhost:1111/...')
  await page.goto('http://localhost:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // 1. 解锁手机
  console.log('Unlocking phone...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.unlock()
    }
  })
  await page.waitForTimeout(600)

  // 2. 打开设置应用
  console.log('Opening Settings app...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.openApp('settings')
    }
  })
  await page.waitForTimeout(800)

  // 3. 点击「显示与亮度」列表项
  console.log('Navigating to Display & Brightness...')
  const displayItem = page.locator('.list-cell', { hasText: '显示与亮度' }).first()
  await displayItem.click()
  await page.waitForTimeout(600)

  // 4. 截取「显示与亮度」页面顶部
  const phoneFrame = page.locator('.phone-screen, .screen-view, .app-window').first()
  const artifactDir = '/Users/jingzhan.chen/.gemini/antigravity/brain/06385522-e5db-4865-9631-53c325d2b43f'
  
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_display_top.png`
  })
  console.log('Saved web_display_top.png')

  // 5. 测试交互：点击深色主题
  console.log('Clicking dark theme mockup...')
  const darkCol = page.locator('.theme-col', { hasText: '深色主题' }).first()
  await darkCol.click()
  await page.waitForTimeout(400)
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_display_dark_theme.png`
  })
  console.log('Saved web_display_dark_theme.png')

  // 切换回浅色主题
  const lightCol = page.locator('.theme-col', { hasText: '浅色主题' }).first()
  await lightCol.click()
  await page.waitForTimeout(400)

  // 6. 滚动到页面中下部
  console.log('Scrolling down...')
  const scrollBody = page.locator('.display-scroll-body').first()
  await scrollBody.evaluate((el) => {
    el.scrollTop = 380
  })
  await page.waitForTimeout(500)
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_display_mid.png`
  })
  console.log('Saved web_display_mid.png')

  // 7. 滚动到底部
  await scrollBody.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await page.waitForTimeout(500)
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_display_bottom.png`
  })
  console.log('Saved web_display_bottom.png')

  // 8. 测试点击「色彩风格」，检查 Toast
  const colorStyleItem = page.locator('.list-cell', { hasText: '色彩风格' }).first()
  await colorStyleItem.click()
  await page.waitForTimeout(300)
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_display_toast.png`
  })
  console.log('Saved web_display_toast.png')

  // 9. 测试返回按钮
  const backBtn = page.locator('.nav-round-btn[data-nav-back]').first()
  await backBtn.click()
  await page.waitForTimeout(600)
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_settings_back.png`
  })
  console.log('Saved web_settings_back.png')

  await browser.close()
  console.log('Verification finished successfully!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
