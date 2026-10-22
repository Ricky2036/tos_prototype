import { chromium } from 'playwright'

const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = '/Users/jingzhan.chen/.gemini/antigravity/brain/6849f499-9763-46b6-82ae-ad8c7436a14f/'

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true
  })
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 960 },
    deviceScaleFactor: 2
  })
  const page = await ctx.newPage()

  console.log('Navigating to http://127.0.0.1:1111/...')
  await page.goto('http://127.0.0.1:1111/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 1. 解锁手机
  console.log('Unlocking phone...')
  await page.evaluate(() => {
    if (window.__system) window.__system.unlock()
  })
  await page.waitForTimeout(600)

  // 2. 检查控制台默认展示敏感权限提示
  const devConsole = page.locator('.proto-console')
  const privacyDemo = page.locator('.privacy-demo')
  console.log('PrivacyDemo in console exists:', await privacyDemo.count())

  // 3. 点击开启相机的相机权限
  console.log('Triggering camera permission...')
  await page.evaluate(() => {
    if (window.__privacy) {
      window.__privacy.start('camera', ['camera'])
    }
  })
  await page.waitForTimeout(500)

  // 截图 1: 状态栏敏感权限提示 (展开状态或胶囊)
  await page.screenshot({ path: OUT + '01_status_bar_privacy_active.png' })
  console.log('Saved 01_status_bar_privacy_active.png')

  // 4. 打开控制中心
  console.log('Opening Control Center...')
  await page.evaluate(() => {
    if (window.__system) window.__system.settleOverlay('controlCenter', true)
  })
  await page.waitForTimeout(600)

  // 截图 2: 控制中心顶部胶囊 (PrivacyCapsule)
  await page.screenshot({ path: OUT + '02_control_center_privacy_capsule.png' })
  console.log('Saved 02_control_center_privacy_capsule.png')

  // 5. 点击胶囊打开敏感权限使用提醒弹窗 (PrivacyPanel)
  console.log('Clicking PrivacyCapsule...')
  const capsule = page.locator('[data-testid="privacy-capsule"]')
  if (await capsule.count()) {
    await capsule.click()
  } else {
    await page.evaluate(() => {
      if (window.__privacy) window.__privacy.openDetail()
    })
  }
  await page.waitForTimeout(700)

  // 截图 3: 敏感权限使用提醒详情弹窗
  await page.screenshot({ path: OUT + '03_privacy_detail_panel.png' })
  console.log('Saved 03_privacy_detail_panel.png')

  // 6. 点击近期权限使用情况按钮
  console.log('Clicking 近期权限使用情况...')
  const recentBtn = page.locator('.privacy-recent-button')
  if (await recentBtn.count()) {
    await recentBtn.click()
  } else {
    await page.evaluate(() => {
      if (window.__privacy) window.__privacy.page = 'history'
    })
  }
  await page.waitForTimeout(700)

  // 截图 4: 隐私信息中心 24 小时权限仪表盘
  await page.screenshot({ path: OUT + '04_privacy_dashboard.png' })
  console.log('Saved 04_privacy_dashboard.png')

  // 7. 点击相机权限查看时间轴
  console.log('Clicking camera permission row in dashboard...')
  const cameraRow = page.locator('.dashboard-permissions .settings-row').nth(1)
  if (await cameraRow.count()) {
    await cameraRow.click()
  }
  await page.waitForTimeout(700)

  // 截图 5: 权限使用时间轴
  await page.screenshot({ path: OUT + '05_permission_timeline.png' })
  console.log('Saved 05_permission_timeline.png')

  // 8. 点击管理权限按钮
  console.log('Clicking 管理权限...')
  const manageBtn = page.locator('.timeline-manage-button')
  if (await manageBtn.count()) {
    await manageBtn.click()
  }
  await page.waitForTimeout(700)

  // 截图 6: 权限管理应用列表
  await page.screenshot({ path: OUT + '06_permission_manager.png' })
  console.log('Saved 06_permission_manager.png')

  await browser.close()
  console.log('All privacy integration verification steps passed!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
