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
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 2
  })
  const page = await ctx.newPage()

  console.log('Navigating to http://localhost:1111/...')
  await page.goto('http://localhost:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

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

  // 截取设置首页（验证头像恢复）
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_settings_home_restored_avatar.png'
  })
  console.log('Saved verify_settings_home_restored_avatar.png')

  // 3. 点击账号卡片进入 Infinix ID 账号中心
  console.log('Clicking account card...')
  const accountCard = page.locator('.account-card').first()
  await accountCard.click()
  await page.waitForTimeout(800)

  // 截取账号中心顶部（验证头像、查找图标、面形图标）
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_account_top_restored.png'
  })
  console.log('Saved verify_account_top_restored.png')

  // 4. 滚动查看设备列表与新添加的钱包入口卡片
  console.log('Scrolling down to view wallet entry card...')
  const accountScroll = page.locator('.account-scroll-body').first()
  await accountScroll.evaluate((el) => {
    el.scrollTop = 380
  })
  await page.waitForTimeout(600)

  // 截取账号中心展示钱包入口与设备列表的画面
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_wallet_entry_in_account.png'
  })
  console.log('Saved verify_wallet_entry_in_account.png')

  // 5. 点击钱包入口卡片
  console.log('Clicking wallet entry card...')
  const walletCard = page.locator('.wallet-entry-card').first()
  await walletCard.click()
  await page.waitForTimeout(800)

  // 截取卡包页面完整视图
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_wallet_pack_page.png'
  })
  console.log('Saved verify_wallet_pack_page.png')

  // 6. 测试交互：点击 "+ 去添加" 按钮
  console.log('Clicking "+ 去添加" button...')
  const addBtn = page.locator('.hero-add-button').first()
  await addBtn.click()
  await page.waitForTimeout(400)

  // 截取点击添加卡券后的轻提示反馈
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_wallet_toast_add.png'
  })
  console.log('Saved verify_wallet_toast_add.png')

  // 7. 测试交互：点击底部悬浮标签栏切换
  console.log('Clicking "主页" tab...')
  const homeTab = page.locator('.floating-tab-item').nth(1)
  await homeTab.click()
  await page.waitForTimeout(400)

  console.log('Clicking "卡包" tab back...')
  const cardsTab = page.locator('.floating-tab-item').nth(0)
  await cardsTab.click()
  await page.waitForTimeout(400)

  // 8. 测试返回：点击顶部返回按钮，验证返回至 Infinix ID 账号中心
  console.log('Clicking back button from wallet page...')
  const backBtn = page.locator('.settings-wallet-page .nav-round-btn').first()
  await backBtn.click()
  await page.waitForTimeout(600)

  // 截取返回后回到 Infinix ID 页面
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_back_to_account.png'
  })
  console.log('Saved verify_back_to_account.png')

  // 9. 再次点击返回按钮，验证返回至设置首页
  console.log('Clicking back button from account page...')
  const accountBackBtn = page.locator('.settings-account-page .nav-round-btn').first()
  await accountBackBtn.click()
  await page.waitForTimeout(600)

  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_back_to_settings_home.png'
  })
  console.log('Saved verify_back_to_settings_home.png')

  await browser.close()
  console.log('All verification steps completed successfully!')
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
