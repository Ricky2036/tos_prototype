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

  console.log('Navigating to http://localhost:1111/...')
  await page.goto('http://localhost:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // 1. 解锁手机
  console.log('Unlocking phone...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.unlock()
    }
  })
  await page.waitForTimeout(600)

  // 2. 打开设置
  console.log('Opening Settings app...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.openApp('settings')
    }
  })
  await page.waitForTimeout(800)

  // 3. 点击账号卡片进入 Infinix ID
  console.log('Clicking account card...')
  const accountCard = page.locator('.account-card').first()
  await accountCard.click()
  await page.waitForTimeout(600)

  // 4. 点击账号安全
  console.log('Navigating to Account Security...')
  const securityEntry = page.locator('.cell-row').filter({ hasText: '账号安全' }).first()
  await securityEntry.click()
  await page.waitForTimeout(600)

  // 5. 截取账号安全主界面 (对照 media_1791551186005_3d82955c.jpg)
  const phoneScreen = page.locator('.screen-container, .phone-frame, #phone-viewport, .device-screen').first()
  const targetElement = (await phoneScreen.count() > 0) ? phoneScreen : page

  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_account_security_main.png`
  })
  console.log('Saved verify_account_security_main.png')

  // 6. 切换指纹开关
  console.log('Toggling fingerprint switch...')
  const toggleRow = page.locator('.toggle-row').first()
  await toggleRow.click()
  await page.waitForTimeout(300)
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_account_security_fingerprint_on.png`
  })
  console.log('Saved verify_account_security_fingerprint_on.png')

  // 7. 点击修改密码
  console.log('Opening Change Password modal...')
  const changePasswordRow = page.locator('.security-cell-row').filter({ hasText: '修改密码' }).first()
  await changePasswordRow.click()
  await page.waitForTimeout(500)
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_change_password_modal.png`
  })
  console.log('Saved verify_change_password_modal.png')

  // 8. 从修改密码弹窗点击找回密码快捷入口
  console.log('Clicking forget password link to start recovery flow...')
  const forgetLink = page.locator('.forgot-link-btn').first()
  await forgetLink.click()
  await page.waitForTimeout(500)

  // 步骤 1：找回密码 - 安全身份验证渠道选择
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_recovery_step1_channel.png`
  })
  console.log('Saved verify_recovery_step1_channel.png')

  // 点击获取验证码进入步骤 2
  console.log('Proceeding to Step 2...')
  const getCodeBtn = page.locator('.recovery-body .primary-action-btn').first()
  await getCodeBtn.click()
  await page.waitForTimeout(500)

  // 步骤 2：输入验证码
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_recovery_step2_empty.png`
  })
  console.log('Saved verify_recovery_step2_empty.png')

  // 点击快捷填入演示验证码 (892601)
  console.log('Filling demo code...')
  const demoCodeBtn = page.locator('.helper-text-btn').first()
  await demoCodeBtn.click()
  await page.waitForTimeout(400)
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_recovery_step2_filled.png`
  })
  console.log('Saved verify_recovery_step2_filled.png')

  // 点击验证并进入下一步 (步骤 3)
  console.log('Verifying code...')
  const verifyCodeBtn = page.locator('.recovery-body .primary-action-btn').first()
  await verifyCodeBtn.click()
  await page.waitForTimeout(500)

  // 步骤 3：设置新密码
  const passwordInputs = page.locator('.recovery-body .security-input')
  await passwordInputs.nth(0).fill('Infinix@2026Strong')
  await passwordInputs.nth(1).fill('Infinix@2026Strong')
  await page.waitForTimeout(400)
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_recovery_step3_password.png`
  })
  console.log('Saved verify_recovery_step3_password.png')

  // 提交新密码进入步骤 4 (重置成功)
  console.log('Submitting new password...')
  const submitPassBtn = page.locator('.recovery-body .primary-action-btn').first()
  await submitPassBtn.click()
  await page.waitForTimeout(500)

  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_recovery_step4_success.png`
  })
  console.log('Saved verify_recovery_step4_success.png')

  // 点击完成，关闭找回密码弹窗
  console.log('Completing recovery...')
  const finishBtn = page.locator('.recovery-body .primary-action-btn').first()
  await finishBtn.click()
  await page.waitForTimeout(500)

  // 9. 查看账号日志
  console.log('Opening Account Logs...')
  const logsRow = page.locator('.security-cell-row').filter({ hasText: '账号日志' }).first()
  await logsRow.click()
  await page.waitForTimeout(500)
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_account_logs_modal.png`
  })
  console.log('Saved verify_account_logs_modal.png')

  // 关闭日志弹窗
  const closeBtn = page.locator('.sheet-close-btn').first()
  await closeBtn.click()
  await page.waitForTimeout(400)

  // 10. 点击账号安全页面顶部圆形返回按钮回到账号页面
  console.log('Testing back navigation to account...')
  const backBtn = page.locator('.account-security-page .nav-round-btn').first()
  await backBtn.click({ force: true })
  await page.waitForTimeout(500)
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_back_to_account_page.png`
  })
  console.log('Saved verify_back_to_account_page.png')

  await browser.close()
  console.log('Verification completed successfully!')
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
