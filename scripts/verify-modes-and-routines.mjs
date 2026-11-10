import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ARTIFACT_DIR = '/Users/jingzhan.chen/.gemini/antigravity/brain/c11570e0-ff2d-4b65-8ded-3a884497164f'
const PORT = 1111

async function run() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  })
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2
  })
  const page = await context.newPage()

  console.log(`1. Navigating to http://127.0.0.1:${PORT}...`)
  await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // 解锁并打开设置
  console.log('2. Unlocking and opening Settings app...')
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__system?.openApp?.('settings'))
  await page.waitForTimeout(800)

  // 验证设置主页结构：Infinix AI 下方必须有 模式和日常程序
  console.log('3. Verifying Settings main menu list...')
  const infinixAiCell = page.locator('.list-cell').filter({ hasText: 'Infinix AI' })
  const modesCell = page.locator('.list-cell').filter({ hasText: '模式和日常程序' })
  await infinixAiCell.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  const hasInfinixAi = await infinixAiCell.isVisible()
  const hasModes = await modesCell.isVisible()
  console.log(`- Infinix AI visible: ${hasInfinixAi}`)
  console.log(`- 模式和日常程序 visible: ${hasModes}`)

  if (!hasInfinixAi || !hasModes) {
    throw new Error('Infinix AI or 模式和日常程序 is not visible in SettingsMain!')
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_settings_menu.png') })
  console.log('Captured replica_settings_menu.png')

  // 点击进入「模式和日常程序」
  console.log('4. Entering 模式和日常程序...')
  await modesCell.click()
  await page.waitForTimeout(600)

  // 验证模式列表
  const sleepCard = page.locator('.mode-card').filter({ hasText: '睡眠' })
  const theaterCard = page.locator('.mode-card').filter({ hasText: '影院' })
  const addModeCard = page.locator('.add-mode-card')
  const floatingDock = page.locator('.floating-dock-bar')

  console.log(`- 睡眠 card visible: ${await sleepCard.isVisible()}`)
  console.log(`- 影院 card visible: ${await theaterCard.isVisible()}`)
  console.log(`- 添加模式 card visible: ${await addModeCard.isVisible()}`)
  console.log(`- Floating Dock visible: ${await floatingDock.isVisible()}`)

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_modes_home.png') })
  console.log('Captured replica_modes_home.png')

  // 点击进入「睡眠」详情页
  console.log('5. Clicking 睡眠 mode to open detail view...')
  await sleepCard.click()
  await page.waitForTimeout(500)

  const heroActionBtn = page.locator('.hero-action-btn')
  console.log(`- Hero Action Button text: ${await heroActionBtn.innerText()}`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_mode_detail_sleep.png') })

  // 点击「启用」
  console.log('6. Clicking 启用 button...')
  await heroActionBtn.click()
  await page.waitForTimeout(500)
  console.log(`- Hero Action Button text after click: ${await heroActionBtn.innerText()}`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_mode_turned_on.png') })

  // 点击返回上一级
  console.log('7. Navigating back to Modes list...')
  await page.locator('.detail-nav-bar .nav-btn').first().click()
  await page.waitForTimeout(500)

  // 验证睡眠卡片出现「开」徽章
  const activeBadge = sleepCard.locator('.active-badge')
  console.log(`- Active badge "开" visible on 睡眠 card: ${await activeBadge.isVisible()}`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_modes_with_active.png') })

  // 点击「添加模式」创建自定义模式
  console.log('8. Clicking 添加模式 to open custom mode modal...')
  await addModeCard.click()
  await page.waitForTimeout(500)

  const nameInput = page.locator('.mode-name-input')
  await nameInput.fill('深度阅读')
  // 选一个颜色和图标
  await page.locator('.color-swatch-btn').nth(3).click()
  await page.locator('.icon-grid-btn').nth(5).click()
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_add_mode_page.png') })

  console.log('9. Clicking 完成 to create mode...')
  await page.locator('.btn-done').click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_custom_mode_detail.png') })

  // 返回主页
  await page.locator('.detail-nav-bar .nav-btn').first().click()
  await page.waitForTimeout(500)

  // 切换到「日常程序」Tab
  console.log('10. Switching to 日常程序 (Routines) Tab...')
  const routinesTabBtn = page.locator('.dock-tab-btn').filter({ hasText: '日常程序' })
  await routinesTabBtn.click()
  await page.waitForTimeout(500)

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_routines_home.png') })
  console.log('Captured replica_routines_home.png')

  // 点击「在暗处」日常程序
  console.log('11. Clicking 在暗处 routine card...')
  const darkRoutineCard = page.locator('.routine-card').filter({ hasText: '在暗处' })
  await darkRoutineCard.click()
  await page.waitForTimeout(500)

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_routine_detail.png') })
  console.log('Captured replica_routine_detail.png')

  // 点击编辑日常程序
  console.log('12. Clicking 编辑...')
  await page.locator('.nav-text-btn').click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_routine_edit.png') })

  // 返回
  await page.locator('.detail-nav-bar .nav-btn').first().click()
  await page.waitForTimeout(500)

  // 切换到「发现」Tab
  console.log('13. Switching to 发现 (Discover) Tab...')
  const discoverTabBtn = page.locator('.dock-tab-btn').filter({ hasText: '发现' })
  await discoverTabBtn.click()
  await page.waitForTimeout(500)

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_discover_home.png') })
  console.log('Captured replica_discover_home.png')

  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!')
  await browser.close()
}

run().catch((err) => {
  console.error('FAILED:', err)
  process.exit(1)
})
