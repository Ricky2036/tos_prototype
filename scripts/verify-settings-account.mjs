import fs from 'node:fs'
import { chromium } from 'playwright'

const OUT =
  process.env.ARTIFACT_DIR || '/tmp/vwork/settings-account'

// 端口可由命令行覆盖：node scripts/verify-settings-account.mjs <port>（默认 5555 = tos-workbuddy canonical）
const PORT = process.argv[2] || '5555'
const BASE = `http://127.0.0.1:${PORT}/`

const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function run() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true
  })
  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 2
  })
  const page = await ctx.newPage()

  console.log(`${'Navigating to'} ${BASE}`)
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

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

  // 3. 截取设置首页
  await page.screenshot({
    path: OUT + '/verify_settings_home.png'
  })
  console.log('Saved verify_settings_home.png')

  // 4. 点击账号卡片进入 Infinix ID
  console.log('Clicking account card...')
  const accountCard = page.locator('.account-card').first()
  await accountCard.click()
  await page.waitForTimeout(800)

  // 5. 截取 Infinix ID 账号页面顶部
  await page.screenshot({
    path: OUT + '/verify_account_page_top.png'
  })
  console.log('Saved verify_account_page_top.png')

  // 6. 向下滚动查看设备列表与退出按钮
  const scrollBody = page.locator('.account-scroll-body').first()
  if (await scrollBody.isVisible()) {
    await scrollBody.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await page.waitForTimeout(500)
  }

  await page.screenshot({
    path: OUT + '/verify_account_page_bottom.png'
  })
  console.log('Saved verify_account_page_bottom.png')

  // 7. 测试退出确认弹窗
  const logoutBtn = page.locator('.logout-btn').first()
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click()
    await page.waitForTimeout(400)
    await page.screenshot({
      path: OUT + '/verify_account_logout_modal.png'
    })
    console.log('Saved verify_account_logout_modal.png')

    // 取消退出
    await page.locator('.cancel-btn').click()
    await page.waitForTimeout(400)
  }

  // 8. 测试返回设置首页
  const backBtn = page.locator('.nav-round-btn').first()
  if (await backBtn.isVisible()) {
    await backBtn.click()
    await page.waitForTimeout(600)
    await page.screenshot({
      path: OUT + '/verify_back_to_settings.png'
    })
    console.log('Saved verify_back_to_settings.png')
  }

  await browser.close()
  console.log('Verification finished successfully')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
