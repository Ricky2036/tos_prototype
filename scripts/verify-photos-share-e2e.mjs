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

  console.log('1. Navigating to port 9999 dev server...')
  await page.goto('http://localhost:9999/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  const phoneScreen = page.locator('.screen-container, .phone-frame, #phone-viewport, .device-screen').first()
  const targetElement = (await phoneScreen.count() > 0) ? phoneScreen : page

  // 2. 解锁手机并进入桌面
  console.log('2. Unlocking to home screen...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.unlock()
    }
  })
  await page.waitForTimeout(600)

  // 3. 打开照片应用（Workbuddy 完整相册）
  console.log('3. Opening Photos App from home screen...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.openApp('photos')
    }
  })
  await page.waitForTimeout(700)

  // 截图 1：相册首页
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_photos_app_gallery.png`
  })
  console.log('Saved verify_photos_app_gallery.png')

  // 4. 点击第一张图片，进入全屏大图查看详情
  console.log('4. Clicking photo cell to open fullscreen viewer...')
  await page.evaluate(() => {
    const firstCell = document.querySelector('.pv-cell, [data-photo]')
    if (firstCell) firstCell.click()
  })
  await page.waitForTimeout(600)

  // 截图 2：全屏大图查看详情
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_photos_viewer_fullscreen.png`
  })
  console.log('Saved verify_photos_viewer_fullscreen.png')

  // 5. 点击底部操作栏的【分享】按钮，唤起分享面板
  console.log('5. Clicking share action in viewer to trigger ShareSheet...')
  await page.evaluate(() => {
    const shareBtn = document.querySelector('[data-photos-action="share"]')
    if (shareBtn) shareBtn.click()
  })
  await page.waitForTimeout(600)

  // 截图 3：全屏大图之上的分享面板完整效果
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_share_sheet_over_viewer.png`
  })
  console.log('Saved verify_share_sheet_over_viewer.png')

  // 6. 展开微信分享渠道弹窗
  console.log('6. Opening WeChat channel popover...')
  await page.evaluate(() => {
    const wechatItem = Array.from(document.querySelectorAll('.share-app-item')).find(el => el.textContent.includes('微信') || el.textContent.includes('发送给朋友'))
    if (wechatItem) {
      const chip = wechatItem.querySelector('.share-channel-chip') || wechatItem.querySelector('.share-app-btn')
      if (chip) chip.click()
    }
  })
  await page.waitForTimeout(400)

  // 截图 4：微信多渠道选择弹窗
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_share_sheet_wechat_channels.png`
  })
  console.log('Saved verify_share_sheet_wechat_channels.png')

  // 7. 展开剪映 (CapCut) 分享渠道弹窗
  console.log('7. Opening CapCut channel popover...')
  await page.evaluate(() => {
    const capcutItem = Array.from(document.querySelectorAll('.share-app-item')).find(el => el.textContent.includes('剪映') || el.textContent.includes('CapCut'))
    if (capcutItem) {
      const chip = capcutItem.querySelector('.share-channel-chip') || capcutItem.querySelector('.share-app-btn')
      if (chip) chip.click()
    }
  })
  await page.waitForTimeout(400)

  // 截图 5：剪映多渠道选择弹窗
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_share_sheet_capcut_channels.png`
  })
  console.log('Saved verify_share_sheet_capcut_channels.png')

  // 8. 点击蒙层空白关闭分享面板，返回全屏查看器
  console.log('8. Dismissing ShareSheet back to viewer...')
  await page.evaluate(() => {
    const backdrop = document.querySelector('.share-backdrop')
    if (backdrop) backdrop.click()
  })
  await page.waitForTimeout(400)

  // 截图 6：回到全屏查看器
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_photos_viewer_dismissed.png`
  })
  console.log('Saved verify_photos_viewer_dismissed.png')

  await browser.close()
  console.log('Verification finished successfully!')
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
