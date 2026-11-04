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

  // 3. 点击「声音与振动」列表项
  console.log('Navigating to Sound & Vibration...')
  const soundItem = page.locator('.list-cell', { hasText: '声音与振动' }).first()
  await soundItem.click()
  await page.waitForTimeout(600)

  // 4. 截取「声音与振动」页面顶部
  const phoneFrame = page.locator('.phone-screen, .screen-view, .app-window').first()
  const artifactDir = '/Users/jingzhan.chen/.gemini/antigravity/brain/06385522-e5db-4865-9631-53c325d2b43f'
  
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_sound_top.png`
  })
  console.log('Saved web_sound_top.png')

  // 5. 测试交互：点击振动模式
  console.log('Clicking vibrate mode...')
  const vibrateCol = page.locator('.mode-col', { hasText: '振动' }).first()
  await vibrateCol.click()
  await page.waitForTimeout(400)
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_sound_vibrate.png`
  })
  console.log('Saved web_sound_vibrate.png')

  // 切换回铃声模式
  const ringCol = page.locator('.mode-col', { hasText: '铃声' }).first()
  await ringCol.click()
  await page.waitForTimeout(400)

  // 6. 滚动到页面中下部
  console.log('Scrolling down...')
  const scrollBody = page.locator('.sound-scroll-body').first()
  await scrollBody.evaluate((el) => {
    el.scrollTop = 380
  })
  await page.waitForTimeout(500)
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_sound_mid.png`
  })
  console.log('Saved web_sound_mid.png')

  // 7. 滚动到底部
  await scrollBody.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await page.waitForTimeout(500)
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_sound_bottom.png`
  })
  console.log('Saved web_sound_bottom.png')

  // 8. 滚回顶部测试「礼拜模式」入口保留
  console.log('Testing prayer mode entrance...')
  await scrollBody.evaluate((el) => {
    el.scrollTop = 0
  })
  await page.waitForTimeout(400)
  const prayerItem = page.locator('.list-cell', { hasText: '礼拜模式' }).first()
  await prayerItem.click()
  await page.waitForTimeout(600)
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_sound_prayer_subpage.png`
  })
  console.log('Saved web_sound_prayer_subpage.png')

  // 点击返回，回到声音与振动
  const prayerBackBtn = page.locator('.prayer-subpage [data-nav-back]').first()
  await prayerBackBtn.click()
  await page.waitForTimeout(600)

  // 9. 测试从声音与振动返回主设置
  const soundBackBtn = page.locator('.sound-nav-bar [data-nav-back]').first()
  await soundBackBtn.click()
  await page.waitForTimeout(600)
  await phoneFrame.screenshot({
    path: `${artifactDir}/web_sound_back_settings.png`
  })
  console.log('Saved web_sound_back_settings.png')

  await browser.close()
  console.log('Sound verification finished successfully!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
