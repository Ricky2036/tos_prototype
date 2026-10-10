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

  // 3. 打开通知中心
  console.log('3. Opening Notification Center...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.settleOverlay('notificationCenter', true)
    }
  })
  await page.waitForTimeout(700)

  // 4. 截取通知中心上的 Infinix 账号通知卡片（验证左右留有安全距离的图标）
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_nc_infinix_safe_margin.png`
  })
  console.log('Saved verify_nc_infinix_safe_margin.png')

  // 5. 点击第一条通知 (Infinix ID 账号通知)
  console.log('5. Clicking Infinix account login notification...')
  const infinixCard = page.locator('.nc-card').filter({ hasText: '完成账号登录' }).first()
  await infinixCard.click()
  await page.waitForTimeout(800)

  // 6. 截取跳转后的账号登录页面 (对标参考图二 Image 2)
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_account_login_page_main.png`
  })
  console.log('Saved verify_account_login_page_main.png')

  // 7. 点击 "使用验证码登录"
  console.log('7. Opening SMS verification code modal...')
  const smsBtn = page.locator('.login-actions-group .btn-secondary').filter({ hasText: '使用验证码登录' }).first()
  await smsBtn.click()
  await page.waitForTimeout(400)

  // 点击快捷填入演示验证码 (892601)
  const demoSmsBtn = page.locator('.sms-actions-bar .helper-text-btn').first()
  await demoSmsBtn.click()
  await page.waitForTimeout(300)

  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_login_modal_sms.png`
  })
  console.log('Saved verify_login_modal_sms.png')

  // 关闭短信弹窗，测试密码登录
  const closeBtn1 = page.locator('.sheet-close-btn').first()
  await closeBtn1.click()
  await page.waitForTimeout(300)

  // 8. 点击 "使用密码登录"
  console.log('8. Opening Password modal...')
  const pwdBtn = page.locator('.login-actions-group .btn-secondary').filter({ hasText: '使用密码登录' }).first()
  await pwdBtn.click()
  await page.waitForTimeout(400)
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_login_modal_password.png`
  })
  console.log('Saved verify_login_modal_password.png')

  // 关闭密码弹窗
  const closeBtn2 = page.locator('.sheet-close-btn').first()
  await closeBtn2.click()
  await page.waitForTimeout(300)

  // 9. 点击扫码和帮助胶囊按钮
  console.log('9. Testing QR code modal...')
  const qrBtn = page.locator('.capsule-icon-btn').first()
  await qrBtn.click()
  await page.waitForTimeout(400)
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_login_modal_qr.png`
  })
  console.log('Saved verify_login_modal_qr.png')

  const closeBtn3 = page.locator('.sheet-close-btn').first()
  await closeBtn3.click()
  await page.waitForTimeout(300)

  // 10. 测试主按钮 Google 一键登录
  console.log('10. Testing Google login button...')
  const googleBtn = page.locator('.login-actions-group .btn-google').first()
  await googleBtn.click()
  await page.waitForTimeout(1200)

  // 登录成功后应自动跳转至已登录状态的 Infinix ID 页面
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_login_success_account_page.png`
  })
  console.log('Saved verify_login_success_account_page.png')

  await browser.close()
  console.log('All verification steps completed successfully!')
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
