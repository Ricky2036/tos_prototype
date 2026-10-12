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

  // 2. 解锁手机并打开设置
  console.log('2. Unlocking and opening Settings...')
  await page.evaluate(() => {
    if (window.__system) {
      window.__system.unlock()
      window.__system.openApp('settings')
    }
  })
  await page.waitForTimeout(700)

  // 3. 点击账号卡片进入账号中心
  console.log('3. Navigating to Account Center...')
  const accountCard = page.locator('.account-card').first()
  await accountCard.click()
  await page.waitForTimeout(500)

  // 截图 1：账号中心（包含云服务卡片与云备份入口行）
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_account_page_with_backup_entry.png`
  })
  console.log('Saved verify_account_page_with_backup_entry.png')

  // 4. 点击 Infinix Cloud 卡片进入云服务首页
  console.log('4. Entering Cloud Home from Infinix Cloud card...')
  const cloudCard = page.locator('.cloud-card').first()
  await cloudCard.click()
  await page.waitForTimeout(500)

  // 截图 2：云服务首页默认状态（参考 Infinix Cloud.mp4 视频）
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_cloud_home_default.png`
  })
  console.log('Saved verify_cloud_home_default.png')

  // 5. 点击“全部 ∨”展开服务网格
  console.log('5. Expanding all services grid...')
  const expandBtn = page.locator('.services-expand-btn').first()
  await expandBtn.click()
  await page.waitForTimeout(400)

  // 截图 3：云服务首页展开状态（包含 备份 2TB 卡片）
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_cloud_home_expanded.png`
  })
  console.log('Saved verify_cloud_home_expanded.png')

  // 6. 在云服务首页中点击“备份”服务卡片直达云备份
  console.log('6. Clicking 备份 service card to enter Cloud Backup...')
  const backupCard = page.locator('.service-item-card.bg-backup').first()
  await backupCard.click()
  await page.waitForTimeout(500)

  // 截图 4：云备份首页（顶部 Hero 大卡片、自动备份卡片）
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_cloud_backup_home.png`
  })
  console.log('Saved verify_cloud_backup_home.png')

  // 滚动到底部截图：演示场景配置区域（完全对齐图 2）
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.cb-page.scrollable')
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    }
  })
  await page.waitForTimeout(300)
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_cloud_backup_home_demo_panel.png`
  })
  console.log('Saved verify_cloud_backup_home_demo_panel.png')

  // 滚回顶部
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('.cb-page.scrollable')
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }
  })
  await page.waitForTimeout(200)

  // 7. 点击“立即备份”进入选择备份数据页
  console.log('7. Clicking 立即备份 to enter data selection...')
  const startBackupBtn = page.locator('.cb-primary', { hasText: '立即备份' }).first()
  await startBackupBtn.click()
  await page.waitForTimeout(400)

  // 截图 5：选择备份数据页面
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_cloud_backup_select.png`
  })
  console.log('Saved verify_cloud_backup_select.png')

  // 8. 点击“备份”开始执行备份
  console.log('8. Clicking 备份 to start progress...')
  const confirmBackupBtn = page.locator('.cb-footer .cb-primary', { hasText: '备份' }).first()
  await confirmBackupBtn.click()
  await page.waitForTimeout(400)

  // 截图 6：如果有覆盖提示，先截覆盖抽屉或直接进入进度
  const overwriteBtn = page.locator('.cb-primary', { hasText: '继续备份' })
  if (await overwriteBtn.count() > 0) {
    await targetElement.screenshot({
      path: `${ARTIFACT_DIR}/verify_cloud_backup_overwrite_sheet.png`
    })
    console.log('Saved verify_cloud_backup_overwrite_sheet.png')
    await overwriteBtn.click()
    await page.waitForTimeout(500)
  }

  // 截图 7：备份中动态进度页
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_cloud_backup_progress.png`
  })
  console.log('Saved verify_cloud_backup_progress.png')

  // 9. 等待备份完成（约 12 秒）
  console.log('9. Waiting for backup to complete...')
  await page.waitForSelector('.cb-result-title', { timeout: 18000 })
  await page.waitForTimeout(500)

  // 截图 8：备份完成结果页
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_cloud_backup_result.png`
  })
  console.log('Saved verify_cloud_backup_result.png')

  // 10. 点击“知道了”返回云备份首页
  console.log('10. Returning to Cloud Backup home...')
  const doneBtn = page.locator('.cb-primary', { hasText: '知道了' }).first()
  await doneBtn.click()
  await page.waitForTimeout(400)

  // 11. 点击“自动备份”进入自动备份设置
  console.log('11. Entering Auto Backup settings...')
  const autoRow = page.locator('.cb-cell', { hasText: '自动备份' }).first()
  await autoRow.click()
  await page.waitForTimeout(400)

  // 截图 9：自动备份配置页
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_cloud_backup_auto.png`
  })
  console.log('Saved verify_cloud_backup_auto.png')

  // 12. 点击备份频率弹出选择抽屉
  console.log('12. Opening frequency sheet...')
  const freqRow = page.locator('.cb-kv-row', { hasText: '备份频率' }).first()
  await freqRow.click()
  await page.waitForTimeout(400)

  // 截图 10：频率选择抽屉
  await targetElement.screenshot({
    path: `${ARTIFACT_DIR}/verify_cloud_backup_freq_sheet.png`
  })
  console.log('Saved verify_cloud_backup_freq_sheet.png')

  await browser.close()
  console.log('All Cloud Home & Cloud Backup verifications completed successfully!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
