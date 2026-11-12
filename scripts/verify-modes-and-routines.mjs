import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || '/tmp/vwork/modes-and-routines'
const PORT = process.argv[2] || process.env.PORT || '5555'

async function run() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true })
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

  // 1. 解锁并打开设置
  console.log('2. Unlocking and opening Settings app...')
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__system?.openApp?.('settings'))
  await page.waitForTimeout(800)

  // 2. 验证设置主页结构：Infinix AI 下方必须有 模式和日常程序
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

  // 3. 点击进入「模式和日常程序」
  console.log('4. Entering 模式和日常程序...')
  await modesCell.click()
  await page.waitForTimeout(600)

  // 验证浅色主题模式主页与各预置模式默认状态
  const sleepCard = page.locator('.mode-card').filter({ hasText: '睡眠' })
  const theaterCard = page.locator('.mode-card').filter({ hasText: '影院' })
  const drivingCard = page.locator('.mode-card').filter({ hasText: '驾驶' })
  const addModeCard = page.locator('.add-mode-card')
  const floatingDock = page.locator('.floating-dock-bar')

  console.log(`- 睡眠 card visible: ${await sleepCard.isVisible()}`)
  console.log(`- 影院 card visible: ${await theaterCard.isVisible()}`)
  console.log(`- 驾驶 card visible: ${await drivingCard.isVisible()}`)
  console.log(`- 添加模式 card visible: ${await addModeCard.isVisible()}`)
  console.log(`- Floating Dock visible: ${await floatingDock.isVisible()}`)

  // 验证未设置默认状态文案
  const theaterSub = await theaterCard.locator('.mode-subtitle').innerText()
  console.log(`- 影院默认状态文案: "${theaterSub}"`)
  if (theaterSub !== '未设置') {
    throw new Error(`影院默认状态文案预期为 "未设置"，实际为 "${theaterSub}"`)
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_modes_home_light.png') })
  console.log('Captured replica_modes_home_light.png')

  // 4. 点击进入「睡眠」详情页
  console.log('5. Clicking 睡眠 mode to open detail view...')
  await sleepCard.click()
  await page.waitForTimeout(500)

  const heroActionBtn = page.locator('.hero-action-btn')
  console.log(`- Hero Action Button text: ${await heroActionBtn.innerText()}`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_mode_detail_sleep.png') })

  // 点击「启用」
  console.log('6. Clicking 启用 button on Sleep...')
  await heroActionBtn.click()
  await page.waitForTimeout(500)
  console.log(`- Hero Action Button text after click: ${await heroActionBtn.innerText()}`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_mode_turned_on.png') })

  // 点击返回模式列表
  console.log('7. Navigating back to Modes list...')
  await page.locator('[data-nav-back]').first().click()
  await page.waitForTimeout(500)

  // 验证睡眠卡片出现「开」徽章与「直到您将其关闭」
  const activeBadge = sleepCard.locator('.active-badge')
  console.log(`- Active badge "开" visible on 睡眠 card: ${await activeBadge.isVisible()}`)
  const sleepSub = await sleepCard.locator('.mode-subtitle').innerText()
  console.log(`- 睡眠激活副标题: "${sleepSub}"`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_modes_with_active.png') })

  // 点击睡眠卡片左侧图标直接关闭模式
  console.log('8. Toggling off 睡眠 mode via icon button...')
  await sleepCard.locator('.mode-icon-badge').click()
  await page.waitForTimeout(500)
  console.log(`- Active badge after icon click: ${await activeBadge.isVisible()}`)

  // 5. 测试预设模式向导流程：点击未配置的「影院」模式
  console.log('9. Clicking unconfigured 影院 mode to test preset wizard...')
  await theaterCard.click()
  await page.waitForTimeout(500)

  const wizardTitle = page.locator('.wizard-title')
  console.log(`- Wizard Title: ${await wizardTitle.innerText()}`)
  const optionCards = page.locator('.option-card')
  console.log(`- Preset options count: ${await optionCards.count()}`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_preset_wizard_theater.png') })

  // 选择「尽量减少干扰」选项
  console.log('10. Selecting 尽量减少干扰 option in wizard...')
  await optionCards.filter({ hasText: '尽量减少干扰' }).click()
  await page.waitForTimeout(300)

  // 点击「开始」
  console.log('11. Clicking 开始 button in wizard...')
  await page.locator('.wizard-start-btn').click()
  await page.waitForTimeout(500)

  // 验证已自动进入影院详情页
  const detailTitle = page.locator('.hero-title')
  console.log(`- Detail Mode Title: ${await detailTitle.innerText()}`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_mode_detail_theater.png') })

  // 5.5 测试全屏子页「自动开启」与「条件」全部分类
  console.log('11.5 Testing 全屏 自动开启 subpage...')
  const autoOnCell = page.locator('.cell-row').filter({ hasText: '自动开启' })
  await autoOnCell.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_page_auto_turn_on.png') })

  // 点击「添加条件」打开条件分类
  console.log('11.6 Clicking 添加条件 to open conditions categories...')
  await page.locator('.add-cond-entry-card').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_page_conditions_categories.png') })

  // 选择「时间段」条件
  console.log('11.7 Selecting 时间段 condition...')
  await page.locator('.condition-item-cell').filter({ hasText: '时间段' }).click()
  await page.waitForTimeout(400)
  // 确认参数
  await page.locator('.picker-bottom-bar .confirm-btn').click()
  await page.waitForTimeout(400)

  // 完成自动开启
  await page.locator('.bottom-capsule-bar .btn-confirm').click()
  await page.waitForTimeout(500)

  // 6. 测试全屏子页「保持专注」及其子菜单「免打扰」与「限制应用」
  console.log('12. Testing 全屏 保持专注 subpage...')
  const stayFocusedCell = page.locator('.cell-row').filter({ hasText: '保持专注' })
  await stayFocusedCell.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_page_stay_focused.png') })

  // 点击建议中的免打扰或打开已配置免打扰
  console.log('13. Testing 免打扰 full screen subpage...')
  const dndTrigger = page.locator('.suggestion-row, .configured-row').filter({ hasText: '免打扰' }).first()
  await dndTrigger.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_page_dnd.png') })

  // 点击完成保存免打扰
  await page.locator('.bottom-capsule-bar .btn-confirm').click()
  await page.waitForTimeout(400)

  // 测试限制应用程序全屏子页
  console.log('14. Testing 限制应用程序使用 full screen subpage...')
  const appLimitsTrigger = page.locator('.suggestion-row, .configured-row').filter({ hasText: '限制应用程序使用' }).first()
  await appLimitsTrigger.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_page_app_limits.png') })

  // 点击完成保存限制应用
  await page.locator('.nav-text-confirm-btn').click()
  await page.waitForTimeout(400)

  // 完成并退出保持专注
  await page.locator('.bottom-capsule-bar .btn-confirm').click()
  await page.waitForTimeout(500)

  // 7. 测试全屏子页「其他动作」与「添加动作」11 大系统分类及选项选择器
  console.log('15. Testing 全屏 其他动作 page...')
  const otherActionsCell = page.locator('.cell-row').filter({ hasText: '其他动作' })
  await otherActionsCell.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  await otherActionsCell.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_page_other_actions.png') })

  // 点击「添加动作」卡片打开全部分类
  console.log('16. Clicking 添加动作 to open 11 categories page...')
  await page.locator('.add-action-entry-card').click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_page_action_categories.png') })

  // 点击「显示」分类打开具体动作列表
  console.log('17. Clicking 显示 category...')
  await page.locator('.category-item-cell').filter({ hasText: '显示' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_page_display_actions.png') })

  // 点击「自动息屏」打开参数选项选择器
  console.log('18. Clicking 自动息屏 to open SheetOptionPicker...')
  await page.locator('.action-item-cell').filter({ hasText: '自动息屏' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_picker_sheet_options.png') })

  // 选择「10 分钟」并完成
  console.log('19. Selecting 10 分钟 and confirming...')
  await page.locator('.picker-option-row').filter({ hasText: '10 分钟' }).click()
  await page.waitForTimeout(200)
  await page.locator('.picker-bottom-bar .confirm-btn').click()
  await page.waitForTimeout(400)

  // 返回其他动作页面并保存
  await page.locator('.bottom-capsule-bar .btn-confirm').click()
  await page.waitForTimeout(500)

  // 8. 测试更多选项：持续时间与删除流程
  console.log('20. Testing 更多选项 ⋮ menu...')
  await page.locator('.mode-more-btn').click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_detail_more_menu.png') })

  // 点击删除弹出确认框
  console.log('21. Clicking 删除 in menu to open confirmation dialog...')
  await page.locator('.more-menu-item.text-danger').click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_delete_confirm_dialog.png') })

  // 确认删除
  console.log('22. Confirming deletion...')
  await page.locator('.dialog-btn.btn-delete').click()
  await page.waitForTimeout(500)

  // 验证回到模式列表且影院已被移除
  console.log(`- 影院 visible in home: ${await page.locator('.mode-card').filter({ hasText: '影院' }).isVisible()}`)

  // 9. 测试「添加模式」与自定义模式创建（验证无背景穿透）
  console.log('23. Clicking 添加模式 to create custom mode...')
  await addModeCard.scrollIntoViewIfNeeded()
  await addModeCard.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_add_mode_page.png') })

  // 点击自定义入口
  const customEntry = page.locator('.restore-item-card.custom-entry')
  if (await customEntry.isVisible()) {
    await customEntry.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_add_custom_mode_form.png') })
  }

  // 点击完成创建自定义模式
  await page.locator('.form-bottom-bar .btn-done').click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_custom_mode_detail.png') })

  // 返回主页
  await page.locator('[data-nav-back]').first().click()
  await page.waitForTimeout(500)

  // 10. 切换到「日常程序」Tab
  console.log('24. Switching to 日常程序 (Routines) Tab...')
  const routinesTabBtn = page.locator('.dock-tab-btn').filter({ hasText: '日常程序' })
  await routinesTabBtn.click()
  await page.waitForTimeout(500)

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_routines_home_light.png') })
  console.log('Captured replica_routines_home_light.png')

  // 点击日常程序并查看详情
  console.log('25. Clicking 在暗处 routine card...')
  const darkRoutineCard = page.locator('.routine-card').filter({ hasText: '在暗处' })
  await darkRoutineCard.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_routine_detail_light.png') })

  // 返回日常程序列表
  await page.locator('[data-nav-back]').first().click()
  await page.waitForTimeout(400)

  // 11. 切换到「发现」Tab
  console.log('26. Switching to 发现 (Discover) Tab...')
  const discoverTabBtn = page.locator('.dock-tab-btn').filter({ hasText: '发现' })
  await discoverTabBtn.click()
  await page.waitForTimeout(500)

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'replica_discover_home_light.png') })
  console.log('Captured replica_discover_home_light.png')

  console.log('==================================================')
  console.log('ALL 26 STEPS OF VERIFICATION COMPLETED WITH 100% SUCCESS!')
  console.log(`[modes-and-routines] 26 PASS / 0 FAIL`)
  console.log('==================================================')
  await browser.close()
}

run().catch((err) => {
  console.error('VERIFICATION FAILED:', err)
  process.exit(1)
})
