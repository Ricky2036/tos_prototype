import { chromium } from 'playwright'

const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const ARTIFACT_DIR = '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7'

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

  console.log('1. Navigating to http://localhost:1111/...')
  await page.goto('http://localhost:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  const phoneScreen = page.locator('.screen-container, .phone-frame, #phone-viewport, .device-screen').first()
  const targetElement = (await phoneScreen.count() > 0) ? phoneScreen : page

  // 2. 解锁手机
  console.log('2. Unlocking phone...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.unlock()
    }
  })
  await page.waitForTimeout(500)

  // 3. 打开设置应用
  console.log('3. Opening Settings app...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.openApp('settings')
    }
  })
  await page.waitForTimeout(600)

  // 4. 点击设置首页浮动搜索栏
  console.log('4. Clicking floating search bar to enter search page...')
  const searchBar = page.locator('.settings-floating-search').first()
  await searchBar.click()
  await page.waitForTimeout(600)

  // 5. 截取图 1 对应的搜索页面初始状态
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_settings_search_page_default.png`
  })
  console.log('Saved verify_settings_search_page_default.png')

  // 6. 点击搜索历史右侧的垃圾桶图标，进入管理/编辑模式
  console.log('6. Clicking trash icon to enter history editing mode...')
  const trashBtn = page.locator('.history-action-btn').first()
  await trashBtn.click()
  await page.waitForTimeout(400)

  // 7. 截取图 2 对应的编辑管理状态（按钮变为“全部删除”，每个胶囊带小圆叉）
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_settings_search_page_editing.png`
  })
  console.log('Saved verify_settings_search_page_editing.png')

  // 8. 点击单个历史胶囊右侧的小叉号进行单独删除（如删除第 1 个：小窗）
  console.log('8. Clicking individual delete cross on first history chip...')
  const deleteBtn = page.locator('.chip-delete-btn').first()
  await deleteBtn.click()
  await page.waitForTimeout(400)

  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_settings_search_single_delete.png`
  })
  console.log('Saved verify_settings_search_single_delete.png')

  // 9. 输入关键词或者点击搜索建议标签测试搜索结果匹配
  console.log('9. Clicking suggestion chip to trigger search filtering...')
  const chipBtn = page.locator('.search-chip').filter({ hasText: '系统导航' }).first()
  await chipBtn.click()
  await page.waitForTimeout(400)

  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_settings_search_query_results.png`
  })
  console.log('Saved verify_settings_search_query_results.png')

  // 10. 点击左侧圆形返回按钮，退出搜索返回设置主页
  console.log('10. Clicking circular back button to return to Settings main view...')
  const backBtn = page.locator('.search-back-circle-btn').first()
  await backBtn.click()
  await page.waitForTimeout(500)

  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_settings_search_back_to_main.png`
  })
  console.log('Saved verify_settings_search_back_to_main.png')

  await browser.close()
  console.log('All search view verifications completed successfully!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
