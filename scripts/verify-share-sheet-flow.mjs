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

  console.log('1. Navigating to port 1111 dev server...')
  await page.goto('http://localhost:1111/', { waitUntil: 'networkidle' })
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

  // 3. 打开照片应用
  console.log('3. Opening Photos App...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.openApp('photos')
    }
  })
  await page.waitForTimeout(700)

  // 截图 1：照片图库主页
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_photos_app_gallery.png`
  })
  console.log('Saved verify_photos_app_gallery.png')

  // 4. 打开分享面板
  console.log('4. Opening Share Sheet...')
  await page.evaluate(() => {
    const shareBtn = document.querySelector('.photos-action-btn')
    if (shareBtn) shareBtn.click()
  })
  await page.waitForTimeout(500)

  // 截图 2：分享面板完整效果（对齐参考截图 Screenshot_20261012-214841.jpg）
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_share_sheet_open.png`
  })
  console.log('Saved verify_share_sheet_open.png')

  // 5. 展开微信分享渠道弹窗
  console.log('5. Opening WeChat channel menu...')
  await page.evaluate(() => {
    const wechatItem = Array.from(document.querySelectorAll('.share-app-item')).find(el => el.textContent.includes('微信') || el.textContent.includes('发送给朋友'))
    if (wechatItem) {
      const btn = wechatItem.querySelector('.share-app-btn') || wechatItem.querySelector('.share-channel-chip')
      if (btn) btn.click()
    }
  })
  await page.waitForTimeout(400)

  // 截图 3：微信多渠道选择浮动菜单
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_share_sheet_wechat_channels.png`
  })
  console.log('Saved verify_share_sheet_wechat_channels.png')

  // 6. 展开剪映 (CapCut) 分享渠道弹窗
  console.log('6. Opening CapCut channel menu...')
  await page.evaluate(() => {
    const capcutItem = Array.from(document.querySelectorAll('.share-app-item')).find(el => el.textContent.includes('剪映') || el.textContent.includes('CapCut'))
    if (capcutItem) {
      const btn = capcutItem.querySelector('.share-app-btn') || capcutItem.querySelector('.share-channel-chip')
      if (btn) btn.click()
    }
  })
  await page.waitForTimeout(400)

  // 截图 4：剪映多渠道选择浮动菜单
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_share_sheet_capcut_channels.png`
  })
  console.log('Saved verify_share_sheet_capcut_channels.png')

  // 7. 返回桌面并在桌面上展开分享面板（完全对齐参考截图背景）
  console.log('7. Returning to Home and opening Share Sheet...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.goHome()
      // 打开分享面板
      const devShareBtn = Array.from(document.querySelectorAll('.pc-btn')).find(b => b.textContent.includes('分享面板'))
      if (devShareBtn) devShareBtn.click()
    }
  })
  await page.waitForTimeout(600)

  // 截图 5：桌面背景下的分享面板
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_share_sheet_desktop_backdrop.png`
  })
  console.log('Saved verify_share_sheet_desktop_backdrop.png')

  await browser.close()
  console.log('All verification screenshots captured successfully!')
}

run().catch((err) => {
  console.error('Error during verification:', err)
  process.exit(1)
})
