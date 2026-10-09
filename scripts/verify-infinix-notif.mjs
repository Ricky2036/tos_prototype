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

  console.log('1. Navigating to http://localhost:1111/...')
  await page.goto('http://localhost:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 检查锁屏上的通知
  console.log('2. Checking LockScreen notification...')
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_lockscreen_infinix.png'
  })
  console.log('Saved verify_lockscreen_infinix.png')

  // 解锁手机
  console.log('3. Unlocking phone...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.unlock()
    }
  })
  await page.waitForTimeout(600)

  // 打开通知中心
  console.log('4. Opening Notification Center...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.settleOverlay('notificationCenter', true)
    }
  })
  await page.waitForTimeout(800)

  // 截取通知中心
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_nc_infinix.png'
  })
  console.log('Saved verify_nc_infinix.png')

  // 检查第一条通知是否为 Infinix
  const firstTitle = await page.locator('.nc-card .nc-card-title').first().textContent()
  const firstDesc = await page.locator('.nc-card .nc-card-desc').first().textContent()
  console.log('First notification title:', firstTitle)
  console.log('First notification desc:', firstDesc)

  // 5. 点击第一条通知 (Infinix 通知)
  console.log('5. Clicking Infinix notification card...')
  const firstCard = page.locator('.nc-card').first()
  await firstCard.click()
  await page.waitForTimeout(1000)

  // 截取点击通知后打开的页面
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_nc_to_account_page.png'
  })
  console.log('Saved verify_nc_to_account_page.png')

  // 6. 点击返回按钮
  console.log('6. Clicking back button...')
  const backBtn = page.locator('.account-nav-bar button[aria-label="返回"]').first()
  if (await backBtn.isVisible()) {
    await backBtn.click()
    await page.waitForTimeout(600)
    await page.screenshot({
      path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_account_back_to_settings.png'
    })
    console.log('Saved verify_account_back_to_settings.png')
  }

  await browser.close()
  console.log('All verification steps completed!')
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
