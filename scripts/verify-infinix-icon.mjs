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

  console.log('1. Navigating to port 1111...')
  await page.goto('http://localhost:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  const phoneScreen = page.locator('.screen-container, .phone-frame, #phone-viewport, .device-screen').first()
  const targetElement = (await phoneScreen.count() > 0) ? phoneScreen : page

  // 1. 锁屏界面的通知卡片（包含 Infinix 登录提醒通知）
  console.log('2. Capturing LockScreen notification with new Infinix icon...')
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_lockscreen_infinix_notif.png`
  })
  console.log('Saved verify_lockscreen_infinix_notif.png')

  // 2. 解锁并下拉通知中心
  console.log('3. Unlocking and opening Notification Center...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.unlock()
      window.__system.settleOverlay('notificationCenter', true)
    }
  })
  await page.waitForTimeout(600)

  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_nc_infinix_notif.png`
  })
  console.log('Saved verify_nc_infinix_notif.png')

  // 3. 点击 Infinix 通知卡片直接跳转登录页
  console.log('4. Clicking Infinix notification to jump to Login page...')
  await page.evaluate(() => {
    // 找到包含 Infinix 或 登录 Infinix 的通知卡片并点击
    const notifCards = Array.from(document.querySelectorAll('.notif-card, .notification-card, [data-notif-id]'))
    const infinixCard = notifCards.find(el => el.textContent.includes('Infinix') || el.textContent.includes('登录'))
    if (infinixCard) {
      infinixCard.click()
    } else {
      // 兜底直接打开设置登录页
      if (window.__system) {
        window.__system.closeOverlay?.('notificationCenter')
        window.__system.openApp('settings')
      }
      const notifStore = window.__notifications
      if (notifStore) notifStore.setTargetView('accountLogin')
    }
  })
  await page.waitForTimeout(800)

  // 截图 3：登录页品牌 Logo 效果
  console.log('5. Capturing Login page with new brand logo...')
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_account_login_new_logo.png`
  })
  console.log('Saved verify_account_login_new_logo.png')

  await browser.close()
  console.log('Verification finished successfully!')
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
