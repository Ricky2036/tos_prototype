#!/usr/bin/env node
/**
 * 短信（MSG-01）e2e —— 真机逐页复刻的回归套件
 *
 * 覆盖：会话列表 / 折叠头部 / 左滑 / 多选 / 对话页 / 消息菜单 / 详情弹窗 /
 *       通知信息（企业聚合）/ 搜索 / 新建短信 / 联系人选择 / 设置与其子页。
 * 几何断言用真机标定值（物理 ÷ 3.3556 = 画布 px）。
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.argv[2] || process.env.PORT || '5555'
const OUT = '/tmp/messages/e2e'
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
const page = await browser.newPage({ viewport: { width: 1080, height: 900 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`)
})

const screen = () => page.locator('.screen')

/** .screen 有缩放，边界框要换算回 360 画布 */
let scale = 1
async function canvasBox(sel) {
  const origin = await screen().boundingBox()
  scale = origin.width / 360
  const b = await page.locator(sel).first().boundingBox()
  if (!b) return null
  return {
    x: (b.x - origin.x) / scale,
    y: (b.y - origin.y) / scale,
    w: b.width / scale,
    h: b.height / scale,
    bottom: (b.y - origin.y + b.height) / scale
  }
}

async function swipeRow(id) {
  const b = await page.locator(`[data-msg-row="${id}"] .row`).boundingBox()
  await page.mouse.move(b.x + b.width - 30, b.y + b.height / 2)
  await page.mouse.down()
  for (let i = 1; i <= 12; i += 1) {
    await page.mouse.move(b.x + b.width - 30 - i * 14, b.y + b.height / 2)
    await page.waitForTimeout(12)
  }
  await page.mouse.up()
  await page.waitForTimeout(340)
}

async function clickAt(sel) {
  const b = await page.locator(sel).first().boundingBox()
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
  await page.waitForTimeout(340)
}

try {
  head('1. 启动短信应用')
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(500)
  await page.evaluate(() => window.__system?.openApp?.('messages'))
  await page.waitForTimeout(1000)

  assert('应用根节点可见', await page.locator('.msg-app-root').isVisible())
  const title = await page.locator('.large-title').textContent()
  assert('大标题为「短信」（真机应用内标题，非桌面名「信息」）', title?.trim() === '短信', title)
  await page.screenshot({ path: `${OUT}/01-list.png` })

  head('2. 会话列表结构与几何')
  const rows = page.locator('[data-msg-row]')
  assert('会话行 8 条', (await rows.count()) === 8, await rows.count())
  const firstRow = await rows.first().getAttribute('data-msg-row')
  assert('首行为通知信息', firstRow === 'notice')

  const noticeBox = await canvasBox('[data-msg-row="notice"] .row')
  assert('通知信息行高 ≈ 59.9', Math.abs(noticeBox.h - 59.9) < 2.5, noticeBox.h)
  const laiBox = await canvasBox('[data-msg-row="laiguangzheng"] .row')
  assert('两行摘要会话行高 ≈ 74.5', Math.abs(laiBox.h - 74.5) < 3, laiBox.h)

  const avatarBox = await canvasBox('[data-msg-row="laiguangzheng"] .msg-avatar')
  assert('头像 40×40', Math.abs(avatarBox.w - 40) < 1.2 && Math.abs(avatarBox.h - 40) < 1.2, avatarBox)
  assert('头像左边距 22', Math.abs(avatarBox.x - 22) < 1.5, avatarBox.x)

  const badge = await page.locator('[data-msg-badge]').first().textContent()
  assert('通知信息未读显示 99+', badge?.trim() === '99+', badge)

  const pill = await canvasBox('.action-pill')
  assert('搜索/更多胶囊 100×44', Math.abs(pill.w - 100) < 1.5 && Math.abs(pill.h - 44) < 1.5, pill)
  assert('胶囊距右 16', Math.abs(360 - (pill.x + pill.w) - 16) < 1.5, pill)

  const cloud = await canvasBox('.cloud-card')
  assert('云同步提示卡宽 316', Math.abs(cloud.w - 316) < 2, cloud.w)
  assert('提示卡高 64', Math.abs(cloud.h - 64) < 2, cloud.h)

  const fab = await canvasBox('.fab')
  assert('新建按钮 60×60', Math.abs(fab.w - 60) < 1.5 && Math.abs(fab.h - 60) < 1.5, fab)
  assert('新建按钮距右 24', Math.abs(360 - (fab.x + fab.w) - 24) < 1.5, fab)

  head('3. 大标题走通用件：滚动折叠 + 引导卡随列表滚走')
  const titleFont0 = await page.locator('.lt-title').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))
  assert('起手标题 36px（与设置页同契约）', Math.abs(titleFont0 - 36) < 1, titleFont0)
  const cloud0 = await canvasBox('[data-msg-cloud]')
  await page.locator('.list-scroll').evaluate((el) => { el.scrollTop = 120; el.dispatchEvent(new Event('scroll')) })
  await page.waitForTimeout(360)
  const titleFont1 = await page.locator('.lt-title').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))
  assert('滚动后标题收缩到 ≈22px', titleFont1 < 30, titleFont1)
  const cloud1 = await canvasBox('[data-msg-cloud]')
  assert('云同步提示卡随列表上移（不悬浮）', cloud1.y < cloud0.y - 40, { before: cloud0.y, after: cloud1.y })
  await page.locator('.list-scroll').evaluate((el) => { el.scrollTop = 0; el.dispatchEvent(new Event('scroll')) })
  await page.waitForTimeout(360)

  head('4. 右上更多菜单')
  await page.locator('[data-msg-overflow]').click()
  await page.waitForTimeout(260)
  const menuItems = page.locator('[data-msg-menu-item]')
  assert('菜单 3 项', (await menuItems.count()) === 3)
  const menuTexts = await menuItems.allTextContents()
  assert('菜单文字为 清除未读 / 骚扰拦截 / 设置', menuTexts.map(s => s.trim()).join('|') === '清除未读|骚扰拦截|设置', menuTexts)
  await page.screenshot({ path: `${OUT}/02-menu.png` })
  // 骚扰拦截落地页（真机跳系统组件，这里在原型内实现）
  await page.locator('[data-msg-menu-item="spam"]').click()
  await page.waitForTimeout(560)
  assert('骚扰拦截页可打开', await page.locator('[data-msg-page="spam"]').isVisible())
  assert('默认停在短信 Tab', (await page.locator('[data-msg-spam-tab="sms"]').getAttribute('class'))?.includes('on'))
  assert('空态显示暂无已拦截短信', (await page.locator('.spam-text').textContent())?.includes('暂无'))
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(520)
  await page.locator('[data-msg-overflow]').click()
  await page.waitForTimeout(260)
  await page.locator('[data-msg-menu-item="settings"]').click()
  await page.waitForTimeout(560)

  head('5. 设置页（真机 ApplicationSettingsActivity）')
  assert('进入设置页', await page.locator('[data-msg-page="settings"]').isVisible())
  const groupTitles = await page.locator('.group-title').allTextContents()
  assert('分组标题依次为 XMessage / 安全 / 其他', groupTitles.map(s => s.trim()).join('|') === 'XMessage|安全|其他', groupTitles)
  const xmsgRow = await page.locator('[data-msg-setting="xmessageService"]').textContent()
  assert('XMessage 服务行右侧显示「已开启」', xmsgRow?.includes('已开启') && xmsgRow?.includes('XMessage 服务'), xmsgRow)

  const sw = page.locator('[data-msg-setting="smsWhenFail"] .msg-switch').first()
  const beforeSwitch = await sw.getAttribute('aria-checked')
  await sw.click()
  await page.waitForTimeout(200)
  const afterSwitch = await sw.getAttribute('aria-checked')
  assert('开关点击后状态翻转', beforeSwitch !== afterSwitch, { beforeSwitch, afterSwitch })
  await sw.click()

  await page.locator('[data-msg-setting="dbUpdate"]').click()
  await page.waitForTimeout(300)
  assert('数据库自动更新偏好弹窗打开', await page.locator('[data-msg-dialog]').isVisible())
  const opts = await page.locator('[data-msg-db-option]').allTextContents()
  assert('弹窗三个选项与真机一致', opts.map(s => s.trim()).join('|') === '仅 WLAN|WLAN 与移动数据|关闭', opts)
  await page.screenshot({ path: `${OUT}/03-db-dialog.png` })
  await page.locator('[data-msg-dialog-action]').click()
  await page.waitForTimeout(260)

  await page.locator('[data-msg-setting="xmessageService"]').click()
  await page.waitForTimeout(500)
  assert('进入 XMessage 服务页', await page.locator('[data-msg-page="xmessage"]').isVisible())
  const xmDesc = await page.locator('.hero-desc').textContent()
  assert('XMessage 说明文案与真机一致', xmDesc?.includes('号码验证成功后'), xmDesc)
  assert('XMessage 开关默认开启', (await page.locator('.msg-switch').first().getAttribute('aria-checked')) === 'true')
  await page.screenshot({ path: `${OUT}/04-xmessage.png` })
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(480)

  head('6. 更多设置 / 关于')
  await page.locator('.settings-scroll').evaluate((el) => { el.scrollTop = el.scrollHeight })
  await page.waitForTimeout(200)
  await page.locator('[data-msg-setting="moreSettings"]').click()
  await page.waitForTimeout(500)
  const moreRows = await page.locator('.msg-sub-page .row').allTextContents()
  assert('更多设置三行：短信中心号码 / SIM卡短信 / 无线警报',
    moreRows.map(s => s.trim()).join('|') === '短信中心号码|SIM卡短信|无线警报', moreRows)
  await page.locator('[data-msg-setting="simSms"]').click()
  await page.waitForTimeout(500)
  const simText = await page.locator('[data-page="sim-sms"], [data-msg-page="sim-sms"]').first().textContent()
  assert('SIM 卡短信页显示中国电信与号码', simText.includes('中国电信') && simText.includes('+8613200007890'))
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(420)
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(420)
  await page.locator('.settings-scroll').evaluate((el) => { el.scrollTop = el.scrollHeight })
  await page.waitForTimeout(200)
  await page.locator('[data-msg-setting="about"]').click()
  await page.waitForTimeout(500)
  const aboutText = await page.locator('[data-msg-version]').textContent()
  assert('关于页版本号 17.0.0.078', aboutText.includes('17.0.0.078'), aboutText)
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(420)
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(520)

  head('7. 对话页与消息操作')
  await page.locator('[data-msg-row="walter"]').click()
  await page.waitForTimeout(620)
  assert('进入对话页', await page.locator('[data-msg-page="chat"]').isVisible())
  const bubbles = page.locator('[data-msg-bubble]')
  assert('Walter 会话 2 条消息', (await bubbles.count()) === 2, await bubbles.count())
  const meta = await page.locator('.msg-meta').first().textContent()
  assert('己方消息带「已发送」前缀', meta?.includes('已发送'), meta)
  const bubbleStyle = await page.locator('[data-msg-bubble="0"]').evaluate(el => getComputedStyle(el).backgroundColor)
  assert('己方气泡底色 #D9E0F1', bubbleStyle.replace(/\s/g, '') === 'rgb(217,224,241)', bubbleStyle)
  await page.screenshot({ path: `${OUT}/05-chat.png` })

  await page.locator('[data-msg-input]').fill('测试消息 hello')
  await page.waitForTimeout(280)
  assert('输入后出现蓝色发送按钮', await page.locator('[data-msg-send]').isVisible())
  const counter = await page.locator('.counter').textContent()
  assert('计数显示 159 / 长度', counter?.replace(/\s/g, '') === '159/10', counter)
  await page.screenshot({ path: `${OUT}/06-typing.png` })
  await page.locator('[data-msg-input]').fill('')
  await page.waitForTimeout(200)

  await page.locator('[data-msg-bubble="0"]').click({ button: 'right' })
  await page.waitForTimeout(300)
  const msgMenu = await page.locator('[data-msg-menu-item]').allTextContents()
  assert('消息长按菜单 7 项且顺序正确',
    msgMenu.map(s => s.trim()).join('|') === '复制文字|翻译|分享|转发|删除|多选|信息详情', msgMenu)
  await page.locator('[data-msg-menu-item="detail"]').click()
  await page.waitForTimeout(300)
  const detail = await page.locator('[data-msg-dialog]').textContent()
  assert('信息详情含类型/发件人/发送时间/收件人/SIM 卡',
    ['类型', '发件人', '发送时间', '收件人', 'SIM 卡'].every(k => detail.includes(k)), detail)
  assert('详情时间为该条消息时间', detail.includes('2024/4/20 19:05'))
  await page.screenshot({ path: `${OUT}/07-detail.png` })
  await page.locator('[data-msg-dialog-action]').click()
  await page.waitForTimeout(260)

  await page.locator('[data-msg-bubble="0"]').click({ button: 'right' })
  await page.waitForTimeout(240)
  await page.locator('[data-msg-menu-item="select"]').click()
  await page.waitForTimeout(320)
  assert('消息多选模式出现删除栏', await page.locator('[data-msg-delete-selected]').isVisible())
  await page.screenshot({ path: `${OUT}/08-msg-select.png` })
  await page.locator('[data-msg-exit-select]').click()
  await page.waitForTimeout(300)
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(560)

  head('8. 列表长按多选与左滑')
  const rowBox = await page.locator('[data-msg-row="laiguangzheng"] .row').boundingBox()
  await page.mouse.move(rowBox.x + rowBox.width / 2, rowBox.y + rowBox.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(720)
  await page.mouse.up()
  await page.waitForTimeout(320)
  const selectTitle = await page.locator('.select-count').textContent()
  assert('长按进入多选并显示「已选择 1 项」', selectTitle?.trim() === '已选择 1 项', selectTitle)
  assert('多选时右上出现全选按钮', await page.locator('[data-msg-select-all]').isVisible())
  await page.screenshot({ path: `${OUT}/09-select.png` })
  await page.locator('[data-msg-select-all]').click()
  await page.waitForTimeout(240)
  const allCount = await page.locator('.select-count').textContent()
  assert('全选后 8 项', allCount?.includes('8'), allCount)
  await page.locator('[data-msg-exit-select]').click()
  await page.waitForTimeout(360)

  await swipeRow('walter')
  assert('左滑露出置顶按钮', await page.locator('[data-msg-pin="walter"]').isVisible())
  assert('左滑露出删除按钮', await page.locator('[data-msg-delete-row="walter"]').isVisible())
  await page.screenshot({ path: `${OUT}/10-swipe.png` })
  const pinBox = await canvasBox('[data-msg-pin="walter"]')
  assert('操作按钮各宽 71', Math.abs(pinBox.w - 71) < 1.5, pinBox.w)
  // 直接按坐标点（滑开态下按钮盖在行之上，Playwright 的自动滚动判定会把行当命中目标）
  await clickAt('[data-msg-pin="walter"]')
  const topRowAfterPin = await page.locator('[data-msg-row]').first().getAttribute('data-msg-row')
  const secondRow = await page.locator('[data-msg-row]').nth(1).getAttribute('data-msg-row')
  assert('置顶后通知信息仍在第一行', topRowAfterPin === 'notice', topRowAfterPin)
  assert('置顶会话排在通知信息下方', secondRow === 'walter', secondRow)
  assert('置顶行显示黄色图钉', (await page.locator('[data-msg-row="walter"] [data-msg-pin-mark]').count()) === 1)
  // 取消置顶：重新滑开首行再点一次
  await swipeRow('walter')
  await clickAt('[data-msg-pin="walter"]')
  const afterUnpin = await page.locator('[data-msg-row]').nth(1).getAttribute('data-msg-row')
  assert('取消置顶后回到原顺序', afterUnpin === 'laiguangzheng', afterUnpin)

  head('9. 通知信息（企业聚合）')
  await page.locator('.list-scroll').evaluate((el) => { el.scrollTop = 0 })
  await page.waitForTimeout(320)
  await page.locator('[data-msg-row="notice"]').first().click()
  await page.waitForTimeout(560)
  assert('进入通知信息列表', await page.locator('[data-msg-page="enterprise-list"]').isVisible())
  const entRows = page.locator('[data-msg-ent-row]')
  assert('企业通知 9 条', (await entRows.count()) === 9, await entRows.count())
  assert('认证号显示绿色盾牌', (await page.locator('[data-msg-verified]').count()) >= 3)
  await page.screenshot({ path: `${OUT}/11-ent-list.png` })
  await page.locator('[data-msg-ent-row="e-abchina"]').click()
  await page.waitForTimeout(620)
  const entTitle = await page.locator('.tb-title-text').textContent()
  assert('企业会话标题为号码', entTitle?.trim() === '10690000001', entTitle)
  assert('企业会话无电话按钮', (await page.locator('[data-msg-call]').count()) === 0)
  const linkCount = await page.locator('[data-msg-page="chat"] .link').count()
  assert('正文中的链接/号码被高亮', linkCount >= 4, linkCount)
  await page.screenshot({ path: `${OUT}/12-ent-chat.png` })
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(420)
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(520)

  head('10. 搜索')
  await page.locator('[data-msg-search]').click()
  await page.waitForTimeout(520)
  assert('进入搜索页', await page.locator('[data-msg-page="search"]').isVisible())
  assert('发件人区有 7 个候选', (await page.locator('[data-msg-sender]').count()) === 7)
  assert('类别区有图片与视频', (await page.locator('[data-msg-cat]').count()) === 2)
  await page.screenshot({ path: `${OUT}/13-search.png` })
  await page.locator('[data-msg-search-input]').fill('1069')
  await page.waitForTimeout(320)
  assert('输入后类别区收起', (await page.locator('[data-msg-cat]').count()) === 0)
  assert('命中片段染蓝', (await page.locator('.sender-number .hit').count()) >= 1)
  await page.screenshot({ path: `${OUT}/14-search-query.png` })
  await page.locator('[data-msg-search-clear]').click()
  await page.waitForTimeout(220)
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(520)

  head('11. 新建短信与联系人选择')
  await page.locator('[data-msg-fab]').click()
  await page.waitForTimeout(520)
  assert('进入新建短信', await page.locator('[data-msg-page="compose"]').isVisible())
  const recipientLabel = await page.locator('.recipient-label').textContent()
  assert('收件人标签为「收件人：」', recipientLabel?.trim() === '收件人：', recipientLabel)
  await page.screenshot({ path: `${OUT}/15-compose.png` })

  await page.locator('[data-msg-pick-contact]').click()
  await page.waitForTimeout(560)
  assert('进入联系人选择', await page.locator('[data-msg-page="picker"]').isVisible())
  assert('默认标题为未选择', (await page.locator('.picker-title').textContent())?.trim() === '未选择')
  // 真机索引条在屏高不足时会省略字母，实测为 A–T、W–Z、# 共 25 项
  assert('右侧字母索引 25 项（真机省略 U/V）', (await page.locator('.index-bar span').count()) === 25)
  await page.locator('[data-msg-contact="c6"]').click()
  await page.waitForTimeout(260)
  assert('选中后标题变「已选择 1 项」', (await page.locator('.picker-title').textContent())?.trim() === '已选择 1 项')
  await page.screenshot({ path: `${OUT}/16-picker.png` })
  await page.locator('[data-msg-picker-confirm]').click()
  await page.waitForTimeout(560)
  const chip = await page.locator('[data-msg-recipient]').textContent()
  assert('返回新建短信并带收件人芯片「A姐」', chip?.trim() === 'A姐', chip)
  await page.screenshot({ path: `${OUT}/17-compose-filled.png` })
  await page.locator('[data-msg-back]').first().click()
  await page.waitForTimeout(520)

  head('12. 无脚本错误')
  assert('无 console / pageerror', errors.length === 0, errors.slice(0, 4))
} finally {
  await browser.close()
}

console.log(`\n===== messages e2e: ${pass} pass, ${fails.length} fail =====`)
if (fails.length) {
  for (const f of fails) console.log('  ✗', f)
  process.exit(1)
}
