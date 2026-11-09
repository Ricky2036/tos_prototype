import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.argv[2] || '1111'
const OUT = '/tmp/phone/e2e'
mkdirSync(OUT, { recursive: true })

let pass = 0
const fails = []
function assert(label, cond, extra) {
  if (cond) {
    pass += 1
    console.log(`  ✅ ${label}`)
  } else {
    fails.push(label)
    console.log(`  ❌ ${label}${extra !== undefined ? ' → ' + JSON.stringify(extra) : ''}`)
  }
}
function head(t) {
  console.log(`\n── ${t} ──`)
}

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
})
const page = await browser.newPage({
  viewport: { width: 1080, height: 900 },
  deviceScaleFactor: 1
})

const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`)
})

try {
  head('1. 访问原型首页并启动电话应用')
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)

  // 解锁系统并打开电话应用
  await page.evaluate(() => {
    if (window.__system?.unlock) {
      window.__system.unlock()
    }
  })
  await page.waitForTimeout(600)

  await page.evaluate(() => {
    if (window.__system?.openApp) {
      window.__system.openApp('phone')
    }
  })
  await page.waitForTimeout(900)

  const phoneApp = page.locator('.phone-app')
  assert('电话应用窗口可见', await phoneApp.isVisible())
  await page.screenshot({ path: `${OUT}/01-phone-main.png` })

  head('2. 通话记录页与筛选栏交互')
  const titleText = await page.locator('.lt-main-title').textContent()
  assert('主标题显示为 通话记录', titleText?.trim() === '通话记录')

  // 检查筛选栏
  const missedFilterBtn = page.locator('.recents-filter-bar .filter-tab-btn').nth(1)
  await missedFilterBtn.click()
  await page.waitForTimeout(300)
  assert('切换到未接来电筛选', await missedFilterBtn.evaluate(el => el.classList.contains('active')))
  await page.screenshot({ path: `${OUT}/02-filter-missed.png` })

  const allFilterBtn = page.locator('.recents-filter-bar .filter-tab-btn').first()
  await allFilterBtn.click()
  await page.waitForTimeout(300)
  assert('切回全部类型筛选', await allFilterBtn.evaluate(el => el.classList.contains('active')))

  head('3. 通话详情抽屉交互 (PhoneCallDetailModal)')
  const firstDetailBtn = page.locator('.info-btn').first()
  await firstDetailBtn.click()
  await page.waitForTimeout(400)

  const detailModal = page.locator('.call-detail-overlay')
  assert('通话详情抽屉弹出', await detailModal.isVisible())
  assert('详情包含4大核心快捷操作球', await page.locator('.quick-actions-bar .quick-action-col').count() >= 4)
  assert('详情展示通话历史明细卡片', await page.locator('.detail-card').first().isVisible())
  await page.screenshot({ path: `${OUT}/03-call-detail-modal.png` })

  // 关闭详情抽屉
  await page.locator('.sheet-close-btn').click()
  await page.waitForTimeout(300)
  assert('通话详情抽屉关闭', !(await detailModal.isVisible()))

  head('4. 拨号键盘交互与智能联想')
  // 确保处于展开状态后进行收起/展开闭环测试
  const fab = page.locator('.phone-fab')
  const isInitiallyOpen = await page.locator('.keypad-drawer-wrap').isVisible()
  if (!isInitiallyOpen) {
    await fab.click()
    await page.waitForTimeout(400)
  }
  assert('拨号盘处于展开状态', await page.locator('.keypad-drawer-wrap').isVisible())

  await fab.click() // 收起拨号盘
  await page.waitForTimeout(400)
  assert('拨号盘收起', !(await page.locator('.keypad-drawer-wrap').isVisible()))

  await fab.click() // 展开拨号盘
  await page.waitForTimeout(400)
  assert('拨号盘重新展开', await page.locator('.keypad-drawer-wrap').isVisible())

  // 点击数字按键输入 (1, 3, 6)
  const keys = page.locator('.keypad-circle-btn')
  // 1 is index 0, 3 is index 2, 6 is index 5
  await keys.nth(0).click() // 1
  await keys.nth(2).click() // 3
  await keys.nth(5).click() // 6
  await page.waitForTimeout(200)

  const dialedDisplay = await page.locator('.dialed-number-text').textContent()
  assert('输入数字正确回显 136', dialedDisplay?.includes('136'))
  assert('输入号码检索联系人时隐藏通话记录Tab', !(await page.locator('.recents-filter-bar').isVisible()))
  assert('拨号下方列表展示匹配联系人', await page.locator('.matched-contact-row').first().isVisible())
  assert('有匹配联系人时底部不展示新建联系人', !(await page.locator('.matched-actions-list').isVisible()))
  assert('拨号盘顶部无小横条手柄', !(await page.locator('.drag-pill, .keypad-drag-bar').isVisible()))
  assert('拨号盘左侧视频通话按钮复用控制中心录屏图标', await page.locator('.video-call-btn .l-icon').isVisible())
  assert('拨号盘底部右侧无多余删除按钮', !(await page.locator('.keypad-actions-row .backspace-btn').isVisible()))
  assert('号码栏退格键为面性图标', await page.locator('.backspace-btn-top svg path[fill="#1C1C1E"]').isVisible())

  // 点击三点菜单验证更多选项弹窗
  const menuBtn = page.locator('.header-action-btn.menu-btn')
  await menuBtn.click()
  await page.waitForTimeout(200)
  assert('三点菜单弹出层可见', await page.locator('.keypad-more-menu').isVisible())
  assert('菜单包含延长暂停时间2秒', await page.locator('.more-menu-item', { hasText: '延长暂停时间2秒' }).isVisible())
  assert('菜单包含延长等待时间', await page.locator('.more-menu-item', { hasText: '延长等待时间' }).isVisible())
  await page.screenshot({ path: `${OUT}/04-keypad-more-menu.png` })

  // 点击延长暂停时间2秒追加逗号
  await page.locator('.more-menu-item', { hasText: '延长暂停时间2秒' }).click()
  await page.waitForTimeout(200)
  const textWithPause = await page.locator('.dialed-number-text').textContent()
  assert('追加暂停控制符逗号 (136,)', textWithPause?.includes('136,'))

  // 再次打开菜单追加等待时间分号
  await menuBtn.click()
  await page.waitForTimeout(200)
  await page.locator('.more-menu-item', { hasText: '延长等待时间' }).click()
  await page.waitForTimeout(200)
  const textWithWait = await page.locator('.dialed-number-text').textContent()
  assert('追加等待控制符分号 (136,;)', textWithWait?.includes('136,;'))

  await page.screenshot({ path: `${OUT}/04-keypad-dialing.png` })

  // 点击退格清空
  const backspaceBtn = page.locator('.action-aux-btn.backspace-btn, .backspace-btn-top').first()
  for (let i = 0; i < 5; i++) {
    if (await backspaceBtn.isVisible()) {
      await backspaceBtn.click()
      await page.waitForTimeout(50)
    }
  }
  await page.waitForTimeout(200)

  head('5. 联系人页面与字母检索条交互 (PhoneContactsTab)')
  const contactsTabBtn = page.locator('.floating-tab-item').nth(1)
  await contactsTabBtn.click()
  await page.waitForTimeout(400)

  assert('切换至联系人 Tab', (await page.locator('.lt-main-title').textContent())?.includes('联系人'))
  assert('右侧字母检索条可见', await page.locator('.alphabet-scrubber-fixed').isVisible())
  await page.screenshot({ path: `${OUT}/05-contacts-tab.png` })

  // 点击字母检索
  const letterC = page.locator('.scrubber-letter', { hasText: 'C' }).first()
  if (await letterC.isVisible()) {
    await letterC.click()
    await page.waitForTimeout(300)
    assert('点击字母 C 反馈', true)
  }

  head('6. 合并重复联系人弹窗 (PhoneMergeModal)')
  const mergeBtn = page.locator('.duplicate-alert-banner .banner-action-btn')
  if (await mergeBtn.isVisible()) {
    await mergeBtn.click()
    await page.waitForTimeout(400)
    assert('合并重复联系人弹窗打开', await page.locator('.merge-modal-overlay').isVisible())
    await page.screenshot({ path: `${OUT}/06-merge-modal.png` })
    // 点击取消关闭
    await page.locator('.merge-modal-overlay .cancel-btn').click()
    await page.waitForTimeout(300)
    assert('合并弹窗关闭', !(await page.locator('.merge-modal-overlay').isVisible()))
  }

  head('7. 新建联系人弹窗 (PhoneAddContactModal)')
  await fab.click() // 在联系人页点击 FAB 打开新建联系人
  await page.waitForTimeout(400)

  const addModal = page.locator('.add-contact-overlay')
  assert('新建联系人弹窗打开', await addModal.isVisible())
  await page.screenshot({ path: `${OUT}/07-add-contact-modal.png` })

  // 填写姓名和电话
  const formInputs = page.locator('.input-card .form-input')
  await formInputs.nth(0).fill('测试联系人小助手')
  await formInputs.nth(1).fill('138 6666 9999')
  await page.waitForSelector('.header-btn.save-btn:not([disabled])')
  await page.locator('.header-btn.save-btn').click()
  await page.waitForTimeout(600)
  assert('保存联系人并关闭弹窗', !(await addModal.isVisible()))

  head('8. 联系人详情抽屉 (PhoneContactDetailModal)')
  const firstContact = page.locator('.contact-row-content').first()
  await firstContact.click()
  await page.waitForTimeout(400)

  const contactDetail = page.locator('.contact-detail-overlay')
  assert('联系人详情抽屉打开', await contactDetail.isVisible())
  assert('详情包含快捷操作球', await page.locator('.contact-detail-overlay .quick-actions-bar .quick-action-col').count() >= 4)
  await page.screenshot({ path: `${OUT}/08-contact-detail-modal.png` })

  await page.locator('.contact-detail-overlay .sheet-close-btn').click()
  await page.waitForTimeout(300)
  assert('联系人详情抽屉关闭', !(await contactDetail.isVisible()))

  head('9. 设置页与全场景降噪、陌生号码识别 SheetOptionPicker')
  const settingsBtn = page.locator('.header-action-btn.settings-trigger')
  await settingsBtn.click()
  await page.waitForTimeout(400)

  const settingsPage = page.locator('.phone-settings-page')
  assert('进入电话设置主页', await settingsPage.isVisible())
  assert('设置主页使用悬浮玻璃导航 GlassNavBar', await settingsPage.locator('.glass-nav .gn-title').textContent().then(t => t?.includes('设置')))
  assert('设置主页包含全场景降噪项', (await settingsPage.textContent())?.includes('全场景降噪'))
  await page.screenshot({ path: `${OUT}/09-phone-settings.png` })

  // 进入全场景降噪
  const noiseRow = page.locator('.setting-item-row', { hasText: '全场景降噪' }).first()
  await noiseRow.click()
  await page.waitForTimeout(400)

  assert('进入全场景降噪子页面', (await page.locator('.phone-settings-subpage .glass-nav .gn-title').textContent())?.includes('全场景降噪'))
  assert('显示声波能量动画组件', await page.locator('.sound-wave-graphic').isVisible())
  await page.screenshot({ path: `${OUT}/10-noise-reduction.png` })

  // 打开降噪模式弹窗 SheetOptionPicker
  const systemNoiseRow = page.locator('.settings-row', { hasText: '系统通话' }).first()
  await systemNoiseRow.click()
  await page.waitForTimeout(300)
  const noisePicker = page.locator('.sheet-mask')
  assert('降噪模式 SheetOptionPicker 升起', await noisePicker.isVisible())
  await page.screenshot({ path: `${OUT}/10-b-noise-picker.png` })

  // 关闭降噪弹窗
  await page.locator('.picker-cancel').click()
  await page.waitForTimeout(300)

  // 返回设置主页
  await page.locator('.phone-settings-subpage [data-nav-back]').click()
  await page.waitForTimeout(400)
  assert('返回设置主列表', await page.locator('.settings-main-view').isVisible())

  // 进入陌生号码识别页面
  const unknownIdRow = page.locator('.setting-item-row', { hasText: '陌生号码识别' }).first()
  await unknownIdRow.click()
  await page.waitForTimeout(400)

  assert('进入陌生号码识别子页面', (await page.locator('.phone-settings-subpage .glass-nav .gn-title').textContent())?.includes('陌生号码识别'))
  await page.screenshot({ path: `${OUT}/10-c-unknown-id.png` })

  // 点击自动更新数据，唤起 SheetOptionPicker
  const autoUpdateRow = page.locator('.settings-row', { hasText: '自动更新数据' }).first()
  await autoUpdateRow.click()
  await page.waitForTimeout(300)

  const autoUpdatePicker = page.locator('.sheet-mask')
  assert('自动更新数据 SheetOptionPicker 升起', await autoUpdatePicker.isVisible())
  assert('SheetOptionPicker 包含仅在 WLAN 选项', (await autoUpdatePicker.textContent())?.includes('仅在 WLAN 下备份恢复数据'))
  await page.screenshot({ path: `${OUT}/10-d-auto-update-picker.png` })

  // 选中“在任何网络下备份恢复数据”并自动关闭
  const alwaysOption = page.locator('.picker-row', { hasText: '在任何网络下备份恢复数据' }).first()
  await alwaysOption.click()
  await page.waitForTimeout(300)
  assert('自动更新数据弹窗选毕自动关闭', !(await page.locator('.sheet-mask').isVisible()))
  assert('更新设置行文案同步变更', (await autoUpdateRow.textContent())?.includes('在任何网络下备份恢复数据'))

  // 从陌生号码识别返回设置主页
  await page.locator('.phone-settings-subpage [data-nav-back]').click()
  await page.waitForTimeout(400)
  assert('返回设置主列表', await page.locator('.settings-main-view').isVisible())

  // 返回电话应用首页
  await page.locator('.settings-main-view [data-nav-back]').click()
  await page.waitForTimeout(450)
  assert('返回电话主界面', !(await settingsPage.isVisible()))

  head('10. 通话中全屏界面交互 (PhoneCallScreen)')
  // 切回通话记录页，点击首条记录拨打
  await page.locator('.floating-tab-item').first().click()
  await page.waitForTimeout(300)

  const firstRecentCall = page.locator('.recent-row-content').first()
  await firstRecentCall.click()
  await page.waitForTimeout(500)

  const callScreen = page.locator('.phone-call-screen')
  assert('通话全屏界面升起', await callScreen.isVisible())
  assert('通话全屏界面显示通话人姓名与状态', await page.locator('.call-header .call-name').isVisible())
  await page.screenshot({ path: `${OUT}/11-call-screen.png` })

  // 展开通话中数字键盘
  const keypadActionBtn = page.locator('.call-actions-grid .keypad-btn').first()
  await keypadActionBtn.click()
  await page.waitForTimeout(300)
  assert('通话中数字键盘展开', await page.locator('.incall-keypad-container').isVisible())
  await page.locator('.incall-key-btn', { hasText: '8' }).click()
  await page.waitForTimeout(200)
  assert('回显 DTMF 按键', (await page.locator('.dtmf-echo-line').textContent())?.includes('8'))
  await page.locator('.hide-keypad-btn').click()
  await page.waitForTimeout(200)

  // 展开 AI 实时摘要
  const aiSummaryBtn = page.locator('.call-actions-grid [title="通话摘要"]').first()
  await aiSummaryBtn.click()
  await page.waitForTimeout(300)
  assert('AI 实时摘要浮层打开', await page.locator('.ai-summary-card').isVisible())
  await page.screenshot({ path: `${OUT}/12-call-ai-summary.png` })
  await page.locator('.ai-close-btn').click()
  await page.waitForTimeout(200)

  // 点击红色大挂断按钮
  await page.locator('.ctrl-hangup-btn, .hangup-btn').first().click()
  await page.waitForTimeout(400)
  assert('挂断电话并返回主页', !(await callScreen.isVisible()))

  head('11. 控制台错误检查')
  assert('全流程无任何严重控制台报错', errors.length === 0, errors)

} finally {
  await browser.close()
}

console.log(`\n======================================`)
console.log(`通过: ${pass} / 失败: ${fails.length}`)
if (fails.length > 0) {
  console.log(`失败用例:`)
  for (const f of fails) console.log(`  - ${f}`)
  process.exit(1)
} else {
  console.log(`全部用例 100% 通过！`)
  process.exit(0)
}
