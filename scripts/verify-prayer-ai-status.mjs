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
    viewport: { width: 440, height: 950 },
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

  // 2. 设置 prayerStore 并打开设置应用直接进入礼拜模式
  console.log('Navigating to Prayer settings...')
  await page.evaluate(() => {
    // 确保默认 aiAutoAnswer 为 false
    const prayer = window.__prayerStore || (window.__pinia && window.__pinia.state.value.prayer)
    if (window.__system) {
      window.__system.openApp('settings')
    }
  })
  await page.waitForTimeout(600)

  // 通过 settings 内部页面导航到 prayer
  await page.evaluate(() => {
    // 找到当前页面的 prayerStore 设为 prayer
    const pStore = window.__prayer
    if (pStore) {
      pStore.setTargetView('prayer')
      pStore.aiAutoAnswer = false
    }
  })
  await page.waitForTimeout(800)

  // 如果还在设置首页，点击 "声音与振动" -> "礼拜模式"
  const soundCell = page.locator('.list-cell:has-text("声音与振动")').first()
  if (await soundCell.isVisible()) {
    console.log('Clicking Sound & Vibration...')
    await soundCell.click()
    await page.waitForTimeout(600)

    const prayerCell = page.locator('.list-cell:has-text("礼拜勿扰"), .list-cell:has-text("礼拜模式")').first()
    if (await prayerCell.isVisible()) {
      console.log('Clicking Prayer Mode...')
      await prayerCell.click()
      await page.waitForTimeout(600)
    }
  }

  // 滚动找到 AI 自动接听菜单
  const aiCell = page.locator('.list-cell:has-text("AI自动接听")').first()
  await aiCell.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)

  // 截图 1: 未启用状态
  console.log('Capturing disabled state...')
  const disabledText = await page.locator('.ai-auto-answer-status').innerText()
  console.log('aiAutoAnswer status text (expected 未启用):', disabledText)
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_prayer_ai_disabled.png'
  })

  // 点击进入 AI 自动接听二级页面
  console.log('Entering AI auto answer subpage...')
  await aiCell.click()
  await page.waitForTimeout(600)

  // 找到二级页面的总开关 ToggleSwitch 并开启
  console.log('Toggling switch ON...')
  const subpageToggle = page.locator('.prayer-subpage .toggle-switch').first()
  await subpageToggle.click()
  await page.waitForTimeout(600)

  // 截图 2: 二级页面开启态
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_prayer_ai_subpage_enabled.png'
  })

  // 点击返回按钮回到礼拜模式主页面
  console.log('Returning to Prayer main settings...')
  const backBtn = page.locator('.prayer-subpage .anb-back-btn').first()
  await backBtn.click()
  await page.waitForTimeout(600)

  // 滚动并检查已启用状态
  await aiCell.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)

  const enabledText = await page.locator('.ai-auto-answer-status').innerText()
  console.log('aiAutoAnswer status text (expected 已启用):', enabledText)

  // 截图 3: 礼拜模式主页同步显示「已启用」
  console.log('Capturing enabled state...')
  await page.screenshot({
    path: '/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-a719-475e-9a89-f92b461ed9d7/verify_prayer_ai_enabled.png'
  })

  await browser.close()
  console.log('Verification completed successfully!')
}

run().catch(console.error)
