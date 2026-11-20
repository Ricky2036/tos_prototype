#!/usr/bin/env node
/**
 * 流量管理（SIM 卡与网络设置 → 流量管理）全链路回归
 *
 * 真机依据：Ricky 提供的录屏（444×960 / 55s，2026-11-20），帧存 `/tmp/simvid/f001..f055`。
 * 判「看得见」一律数可见像素（rect.width/height > 0）+ 读 getComputedStyle，
 * 不数 DOM 节点 —— 浮层常驻、display:none 的槽位会让 count() 假绿。
 *
 * ⚠️ 宿主把整机等比缩放（~0.95）：「元素该多大」读 getComputedStyle，相对位置才用 rect。
 */
import fs from 'node:fs'
import { chromium } from 'playwright'

const OUT = process.env.ARTIFACT_DIR || '/tmp/vwork/traffic'
const PORT = process.argv[2] || '5555'
const BASE = `http://127.0.0.1:${PORT}/`
const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

let pass = 0
let fail = 0
const failures = []
const pageErrors = []

function check(name, ok, detail = '') {
  if (ok) {
    pass += 1
    console.log(`PASS [traffic] ${name}`)
  } else {
    fail += 1
    failures.push(`${name}${detail ? ' — ' + detail : ''}`)
    console.log(`FAIL [traffic] ${name}${detail ? ' — ' + detail : ''}`)
  }
}

async function shot(page, name) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.locator('.phone-frame .screen').first().screenshot({ path: `${OUT}/${name}.png` })
}

async function visibleCount(page, selector) {
  return page.evaluate((sel) => [...document.querySelectorAll(sel)].filter(el => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'
  }).length, selector)
}

async function text(page, selector) {
  const el = page.locator(selector).first()
  if (!(await el.count())) return ''
  return (await el.textContent().catch(() => '')).replace(/\s+/g, ' ').trim()
}

async function texts(page, selector) {
  return page.evaluate((sel) => [...document.querySelectorAll(sel)]
    .filter(el => el.getBoundingClientRect().width > 0)
    .map(el => el.textContent.replace(/\s+/g, ' ').trim()), selector)
}

async function cssSize(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const cs = getComputedStyle(el)
    return { w: parseFloat(cs.width), h: parseFloat(cs.height), radius: cs.borderTopLeftRadius, bg: cs.backgroundImage }
  }, selector)
}

async function rectOf(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { left: r.left, top: r.top, width: r.width, height: r.height }
  }, selector)
}

async function ariaChecked(page, selector) {
  return page.evaluate((sel) => document.querySelector(sel)?.getAttribute('aria-checked') === 'true', selector)
}

async function click(page, selector, wait = 460) {
  await page.locator(selector).first().click({ timeout: 6000 })
  await page.waitForTimeout(wait)
}

async function back(page, wait = 420) {
  await page.locator('[data-nav-back]').first().click({ timeout: 6000 })
  await page.waitForTimeout(wait)
}

const T = (id) => `[data-testid="${id}"]`

async function run() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', e => pageErrors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()) })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('tos.settings.traffic.v1'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(300)
  await page.evaluate(() => window.__system?.openApp?.('settings'))
  await page.waitForTimeout(700)

  /* ==================== A. 入口 ==================== */
  await click(page, '.settings-scroll-container .list-cell:has-text("SIM 卡与网络设置")', 620)
  const simTitles = await texts(page, '.sim-scroll-body .lc-title')
  check('A1 SIM 卡与网络设置页出现「流量管理」入口', simTitles.includes('流量管理'), JSON.stringify(simTitles.slice(-6)))

  await click(page, '.sim-scroll-body .list-cell:has-text("流量管理")', 700)
  check('A2 进入流量管理，导航标题正确', (await text(page, '.glass-nav .gn-title')) === '流量管理')
  check('A3 主页面容器可见', (await visibleCount(page, T('tm-main'))) === 1)
  await shot(page, '01_main')

  /* ==================== B. 主页面几何与文案 ==================== */
  const groups = await texts(page, '.tm-group')
  check('B1 两个页面级分组标题', groups[0] === '当前使用的套餐' && groups[1] === '流量使用情况', JSON.stringify(groups.slice(0, 3)))

  const card = await cssSize(page, T('tm-plan-card'))
  check('B2 套餐卡 328 宽 / 圆角 20 / 蓝色渐变',
    Boolean(card) && Math.round(card.w) === 328 && card.radius === '20px' && /linear-gradient/.test(card.bg),
    card ? `${card.w}×${card.h} r=${card.radius}` : 'null')
  check('B3 套餐卡高 169（真机 1208 截图量得 168.7）', Boolean(card) && Math.abs(card.h - 169) <= 1.5, card ? String(card.h) : 'null')
  check('B4 卡内空态文案', (await text(page, '.tm-plan-title')) === '无使用中的套餐')
  check('B5 卡内「全部套餐」入口可点', (await visibleCount(page, T('tm-all-plans'))) === 1)

  // 真机 1208×2644 截图取样：页面 #F7F7F8 + 白卡（444px 录屏把这层近白对比压平了，别照录屏做纯白）
  const pageBg = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="tm-main"]')).backgroundColor)
  check('B6 页面底色 #F7F7F8（灰底白卡，不是录屏里的纯白平铺）', pageBg === 'rgb(247, 247, 248)', pageBg)
  const cardBg = await page.evaluate(() => getComputedStyle(document.querySelector('.tm-card-chart')).backgroundColor)
  const cardRadius = await page.evaluate(() => getComputedStyle(document.querySelector('.tm-card-chart')).borderTopLeftRadius)
  check('B6b 图表卡是白底圆角 20', cardBg === 'rgb(255, 255, 255)' && cardRadius === '20px', `${cardBg} / ${cardRadius}`)

  /* 今天：0.0 B + 5 条刻度 + 无柱 */
  check('B7 今天已用流量 = 0.0 B', (await text(page, T('tm-usage-value'))) === '0.0 B')
  const todayTicks = await texts(page, `${T('tm-chart-today')} .tm-tick`)
  check('B8 今天 5 条刻度（1 B 起、其余 0 B）',
    todayTicks.length === 5 && todayTicks[0] === '1 B' && todayTicks.slice(1).every(t => t === '0 B'),
    JSON.stringify(todayTicks))
  check('B9 今天没有柱子', (await visibleCount(page, `${T('tm-chart-today')} .tm-bar`)) === 0)
  const xToday = await texts(page, `${T('tm-chart-today')} .tm-xlabel`)
  check('B10 今天横轴 6:00 / 12:00 / 18:00', xToday.join('|') === '6:00|12:00|18:00', JSON.stringify(xToday))
  const lines = await visibleCount(page, `${T('tm-chart-today')} .tm-gridline`)
  check('B10b 横向虚线网格条数 = 刻度数（真机是虚线，录屏里被压没了）', lines === todayTicks.length, `${lines} vs ${todayTicks.length}`)
  const dash = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="tm-chart-today"] .tm-gridline')
    return el ? getComputedStyle(el).backgroundImage : ''
  })
  check('B10c 网格线是 repeating 虚线（不是实线）', /repeating-linear-gradient/.test(dash), dash.slice(0, 40))
  const seg = await page.evaluate(() => {
    const track = document.querySelector('[data-testid="tm-segment"]')
    const pill = document.querySelector('.tm-segment-pill')
    const cs = getComputedStyle(track)
    return { h: parseFloat(cs.height), radius: cs.borderTopLeftRadius, trackBg: cs.backgroundColor, pillBg: getComputedStyle(pill).backgroundColor }
  })
  check('B11 分段控件：灰轨道 + 白色胶囊（真机不是下划线标签页）',
    Math.round(seg.h) === 38 && seg.radius === '19px' && seg.trackBg !== 'rgb(255, 255, 255)' && seg.pillBg === 'rgb(255, 255, 255)',
    JSON.stringify(seg))
  check('B11b 未选中段是灰字', (await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="tm-tab-week"]')).color)) === 'rgb(155, 155, 159)')

  /* 过去 7 天：166.0 MB + 7 柱 + 4 刻度 */
  await click(page, T('tm-tab-week'), 520)
  check('B12 7 天已用流量 = 166.0 MB', (await text(page, T('tm-usage-value'))) === '166.0 MB')
  check('B13 7 根柱子', (await visibleCount(page, `${T('tm-chart-week')} .tm-bar`)) === 7)
  const weekTicks = await texts(page, `${T('tm-chart-week')} .tm-tick`)
  check('B14 7 天刻度是整数档 120/80/40/0 MB', weekTicks.join('|') === '120 MB|80 MB|40 MB|0 B', JSON.stringify(weekTicks))
  const xWeek = await texts(page, `${T('tm-chart-week')} .tm-xlabel`)
  check('B15 7 天横轴是 7 个日期', xWeek.length === 7 && xWeek[0] === '11/14' && xWeek[6] === '11/20', JSON.stringify(xWeek))
  await shot(page, '02_week')
  await click(page, T('tm-tab-today'), 400)

  check('B16 运营商脚注逐字', (await text(page, '.tm-footnote')) === '运营商流量计算方式可能与本设备不同。')
  check('B17 应用图标叠层 5 个 + 剩余计数', (await visibleCount(page, `${T('tm-icon-stack')} .registered-app-icon`)) === 5
    && /^\+\d+$/.test(await text(page, '.tm-icon-more')))

  const rowTitles = await texts(page, '.tm-row .tm-row-title')
  check('B18 三组六个入口齐全',
    ['省流量模式', '流量限额', '熄屏监控', '应用 Wi-Fi 权限管理', '流量周报', '设置'].every(t => rowTitles.includes(t)),
    JSON.stringify(rowTitles))

  /* 行高/文字落点：真机 48 行高、文字 x=32 */
  const rowBox = await rectOf(page, T('tm-row-limit'))
  const rowTitleBox = await rectOf(page, `${T('tm-row-limit')} .tm-row-title`)
  const screenX = await rectOf(page, '.phone-frame .screen')
  const scale = 360 / screenX.width
  check('B19 列表行高 54（卡片版式）', Boolean(rowBox) && Math.abs(rowBox.height * scale - 54) <= 1.2, rowBox ? String(+(rowBox.height * scale).toFixed(1)) : 'null')
  check('B20 行文字左缘 32（页面 16 + 行内 16）',
    Boolean(rowTitleBox) && Math.abs((rowTitleBox.left - screenX.left) * scale - 32) <= 1.2,
    rowTitleBox ? String(+((rowTitleBox.left - screenX.left) * scale).toFixed(1)) : 'null')

  /* ==================== C. 省流量模式（后台流量限制） ==================== */
  await click(page, T('tm-row-saveMode'), 560)
  check('C1 三级页标题是「后台流量限制」（与行名不同，真机原样）', (await text(page, '.glass-nav .gn-title')) === '后台流量限制')
  check('C2 默认关：不显示「不受限制的应用」', (await visibleCount(page, T('tm-row-unrestricted'))) === 0)
  const note = await text(page, T('tm-save-mode-note'))
  check('C3 说明两段逐字', note.includes('减少部分视频应用的流量消耗') && note.includes('注意：省流量模式下'), note.slice(0, 40))
  await click(page, `${T('tm-switch-saveMode')} .toggle-switch`, 460)
  check('C4 打开后出现「不受限制的应用」入口', (await visibleCount(page, T('tm-row-unrestricted'))) === 1)
  await shot(page, '03_save_mode')

  await click(page, T('tm-row-unrestricted'), 620)
  check('C5 进入不受限制的应用', (await text(page, '.glass-nav .gn-title')) === '不受限制的应用')

  const registeredCount = await page.evaluate(async () => {
    const mod = await import('/src/composables/useRegisteredApps.js')
    return mod.getRegisteredApps().length
  })
  const sectionLabels = await texts(page, '.tm-section-label')
  check('C6 两段分组：不受限制的应用 + 其他应用',
    sectionLabels.includes('不受限制的应用') && sectionLabels.includes('其他应用'),
    JSON.stringify(sectionLabels))
  check('C7 应用行数 = 注册表应用数（⛔ 不是另写的一份名单）',
    (await visibleCount(page, `${T('tm-unrestricted-list')} .tm-appitem`)) === registeredCount,
    `行数 vs ${registeredCount}`)

  /* 导轨：★ + 只出现**有应用**的首字母（真机就缺 N / R 这种） */
  const idx = await page.evaluate((sel) => {
    const bar = document.querySelector(sel)
    const letters = [...bar.querySelectorAll('.tm-index-letter')].map(e => e.textContent.trim())
    const rows = [...document.querySelectorAll('[data-testid="tm-unrestricted-list"] .tm-appitem')].map(e => e.dataset.letter)
    return { letters, hasStar: letters[0] === '★', rowLetters: [...new Set(rows)].sort() }
  }, T('tm-index'))
  const idxLetters = idx.letters.filter(l => l !== '★')
  check('C8 导轨首项是 ★（回顶部）', idx.hasStar, JSON.stringify(idx.letters.slice(0, 4)))
  check('C9 导轨字母 = 列表里实际存在的首字母（不多不少）',
    JSON.stringify(idxLetters) === JSON.stringify(idx.rowLetters), `${idxLetters.join('')} vs ${idx.rowLetters.join('')}`)

  /* 右上 ⋮ → 弹层「显示系统应用」 */
  check('C10 导航右上角有圆形更多按钮', (await visibleCount(page, T('tm-unrestricted-menu'))) === 1)
  const moreStyle = await page.evaluate((sel) => {
    const cs = getComputedStyle(document.querySelector(sel))
    return { r: cs.borderRadius, w: parseFloat(cs.width), bg: cs.backgroundColor }
  }, T('tm-unrestricted-menu'))
  check('C11 更多按钮是与返回键同款圆形玻璃（34 圆角 50%）',
    Math.round(moreStyle.w) === 34 && moreStyle.r === '50%' && /rgba/.test(moreStyle.bg), JSON.stringify(moreStyle))
  await click(page, T('tm-unrestricted-menu'), 380)
  check('C12 点开弹层且只有「显示系统应用」一项',
    (await text(page, T('tm-unrestricted-popover'))).replace(/\s+/g, '') === '显示系统应用')
  await shot(page, '04_unrestricted_menu')

  /* 关掉一个应用 → 落到「其他应用」 */
  const beforeOn = await visibleCount(page, `${T('tm-unrestricted-list')} .toggle-switch.on`)
  const firstName = await text(page, `${T('tm-unrestricted-list')} .tm-appitem .tm-appname`)
  await page.locator(`${T('tm-unrestricted-list')} .tm-appitem`).first().click()
  await page.waitForTimeout(420)
  const afterOn = await visibleCount(page, `${T('tm-unrestricted-list')} .toggle-switch.on`)
  check('C13 关掉一个应用（行可点）后放行数 -1', afterOn === beforeOn - 1, `${beforeOn} → ${afterOn}`)
  const inOther = await page.evaluate((name) => {
    const labels = [...document.querySelectorAll('.tm-section-label')]
    const other = labels.find(e => e.textContent.trim() === '其他应用')
    const card = other?.nextElementSibling
    return [...(card?.querySelectorAll('.tm-appname') || [])].map(e => e.textContent.trim()).includes(name)
  }, firstName)
  check('C14 关掉的「' + firstName + '」落进「其他应用」段', inOther === true)

  await back(page)
  check('C15 返回落在「后台流量限制」而不是主页面', (await text(page, '.glass-nav .gn-title')) === '后台流量限制')
  await back(page)
  check('C16 再返回落回主页面', (await visibleCount(page, T('tm-main'))) === 1)

  /* ==================== D. 流量限额 ==================== */
  await click(page, T('tm-row-limit'), 560)
  check('D1 标题「流量限额」', (await text(page, '.glass-nav .gn-title')) === '流量限额')
  check('D2 日流量限额默认开', (await ariaChecked(page, `${T('tm-switch-limit')} .toggle-switch`)) === true)
  check('D3 限额值 500.0 MB', (await text(page, T('tm-limit-value'))) === '500.0 MB')
  await shot(page, '05_limit')

  await click(page, `${T('tm-switch-limit')} .toggle-switch`, 420)
  const disabled = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    const cs = getComputedStyle(el)
    return { pe: cs.pointerEvents, op: cs.opacity }
  }, T('tm-row-limit-value'))
  check('D4 关掉日限额后限额行置灰且点不动', disabled.pe === 'none' && parseFloat(disabled.op) < 0.5, JSON.stringify(disabled))
  await click(page, `${T('tm-switch-limit')} .toggle-switch`, 420)

  await click(page, T('tm-row-limit-value'), 520)
  check('D5 弹出限额编辑卡', (await visibleCount(page, T('tm-limit-sheet'))) === 1)
  const inputVal = await page.locator(T('tm-limit-input')).inputValue()
  check('D6 弹层带出当前值 500.0', inputVal === '500.0', inputVal)
  check('D7 单位是 MB', (await text(page, T('tm-limit-unit'))).includes('MB'))
  await shot(page, '06_limit_sheet')

  await page.locator(T('tm-limit-input')).fill('800')
  await click(page, T('tm-limit-ok'), 520)
  check('D8 完成后行值更新为 800.0 MB', (await text(page, T('tm-limit-value'))) === '800.0 MB')
  check('D9 弹层已关闭', (await visibleCount(page, T('tm-limit-sheet'))) === 0)

  /* 非法值：清空后「完成」不可用 */
  await click(page, T('tm-row-limit-value'), 460)
  await page.locator(T('tm-limit-input')).fill('')
  await page.waitForTimeout(200)
  check('D10 空值不能提交', await page.locator(T('tm-limit-ok')).isDisabled())
  await click(page, T('tm-limit-cancel'), 420)
  check('D11 取消后保留原值 800.0 MB', (await text(page, T('tm-limit-value'))) === '800.0 MB')

  await back(page)
  await click(page, T('tm-row-limit'), 560)
  check('D12 限额值已持久化（重进仍是 800.0 MB）', (await text(page, T('tm-limit-value'))) === '800.0 MB')
  await back(page)

  /* ==================== E. 熄屏监控 ==================== */
  await click(page, T('tm-row-screenOff'), 560)
  check('E1 标题「熄屏监控」', (await text(page, '.glass-nav .gn-title')) === '熄屏监控')
  check('E2 总开关默认开', (await ariaChecked(page, `${T('tm-switch-screenOff')} .toggle-switch`)) === true)
  check('E3 分组标题「历史记录」', (await texts(page, '.tm-group')).includes('历史记录'))
  const history = await texts(page, `${T('tm-screen-off-history')} .tm-history-num`)
  check('E4 历史 9 段，首条 76.07', history.length === 9 && history[0] === '76.07', JSON.stringify(history.slice(0, 3)))
  const ranges = await texts(page, `${T('tm-screen-off-history')} .tm-history-range`)
  check('E5 时间段带日期（2026-11-10 13:08:47 - 2026-11-10 13:20:30）',
    ranges[0].includes('2026-11-10 13:08:47') && ranges[0].includes('13:20:30'), ranges[0])
  await shot(page, '07_screen_off')
  await back(page)

  /* ==================== F. 应用 Wi-Fi 权限管理 ==================== */
  await click(page, T('tm-row-wifiApps'), 620)
  check('F1 顶部说明逐字', (await texts(page, '.tm-note')).some(t => t === '关闭应用开关可限制该应用使用 Wi-Fi。'))
  check('F2 应用行数 = 注册表应用数', (await visibleCount(page, `${T('tm-wifi-list')} .tm-appitem`)) === registeredCount)
  const firstSwitch = page.locator(`${T('tm-wifi-list')} .tm-appitem`).first().locator('.toggle-switch')
  const wasOn = await firstSwitch.getAttribute('aria-checked')
  await firstSwitch.click()
  await page.waitForTimeout(360)
  const nowOn = await firstSwitch.getAttribute('aria-checked')
  check('F3 点开关能切（默认全开 → 关）', wasOn === 'true' && nowOn === 'false', `${wasOn} → ${nowOn}`)
  await shot(page, '08_wifi_apps')
  await back(page)
  await click(page, T('tm-row-wifiApps'), 620)
  check('F4 关掉的状态有持久化', (await page.locator(`${T('tm-wifi-list')} .tm-appitem`).first().locator('.toggle-switch').getAttribute('aria-checked')) === 'false')
  await back(page)

  /* ==================== G. 流量周报 ==================== */
  await click(page, T('tm-row-weekly'), 700)
  check('G1 周报页可见', (await visibleCount(page, T('tm-weekly'))) === 1)
  check('G2 标题与周期', (await text(page, '.tm-weekly-kicker')) === '流量周报'
    && (await text(page, '.tm-weekly-range')).includes('26/11/14-26/11/20'))
  check('G3 本周共节省 0.0 MB', (await text(page, T('tm-weekly-saved'))).replace(/\s+/g, '') === '0.0MB')
  check('G4 已用流量与主页 7 天同源（166.0 MB）', (await text(page, T('tm-weekly-used'))) === '166.0 MB')
  check('G5 柱状图 7 根', (await visibleCount(page, `${T('tm-weekly-chart')} .tm-bar`)) === 7)
  const rec = await text(page, T('tm-weekly-rec'))
  check('G6 个性化推荐文案', rec.includes('个性化推荐') && rec.includes('请关注：后台流量使用较多'), rec.slice(0, 30))
  await shot(page, '09_weekly')
  await back(page)

  /* ==================== H. 设置 / 流量提醒 ==================== */
  await click(page, T('tm-row-settings'), 560)
  check('H1 设置页四行', (await texts(page, '.tm-row .tm-row-title')).join('|') === '流量网速显示|流量提醒|流量使用报告|套餐自动同步')
  check('H2 三行开关默认开', (await visibleCount(page, '.tm-switch .toggle-switch.on')) === 3)
  await shot(page, '10_settings')

  await click(page, T('tm-row-alerts'), 560)
  check('H3 提醒页标题', (await text(page, '.glass-nav .gn-title')) === '流量提醒')
  check('H4 默认比例 20%', (await page.evaluate(() => document.querySelector('[data-testid="tm-ratio-track"]')?.getAttribute('aria-valuenow'))) === '20')
  const track = await rectOf(page, T('tm-ratio-track'))
  await page.mouse.click(track.left + track.width - 2, track.top + track.height / 2)
  await page.waitForTimeout(360)
  check('H5 点最右吸附到 50%', (await page.evaluate(() => document.querySelector('[data-testid="tm-ratio-track"]')?.getAttribute('aria-valuenow'))) === '50')
  await shot(page, '11_alerts')
  await back(page)
  await back(page)

  /* ==================== I. 两个补页 + 逐层返回 ==================== */
  await click(page, T('tm-row-appUsage'), 620)
  check('I1 应用流量使用管理有真实列表', (await visibleCount(page, `${T('tm-app-usage')} .tm-appitem`)) === registeredCount)
  await back(page)

  await click(page, T('tm-all-plans'), 620)
  check('I2 全部套餐页有空态（不是死条目）', (await text(page, T('tm-plans-empty'))) === '无使用中的套餐')
  await back(page)

  await back(page)
  check('I3 主页面返回回到 SIM 卡与网络设置', (await text(page, '.glass-nav .gn-title')) === 'SIM 卡与网络设置')
  await shot(page, '12_back_to_sim')

  check('I4 全程零 console / page error', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '))

  console.log(`\n[traffic] ${pass} PASS / ${fail} FAIL`)
  if (failures.length) {
    console.log('失败明细：')
    for (const f of failures) console.log(' - ' + f)
  }
  await browser.close()
  process.exit(fail ? 1 : 0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
