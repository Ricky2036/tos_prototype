#!/usr/bin/env node
/**
 * 设置第三组卡片（安全与隐私 → 位置信息）三级/四级页回归。
 *
 * 真机取证：Infinix X6878 / XOS 17，2026-11-09（/tmp/ref/gI/）。
 * 判「看得见」一律数**可见像素**（rect.width/height > 0），不数 DOM 节点——
 * 本仓的浮层是「常驻 + z-index 盖住」，count() 会假绿。
 */
import fs from 'node:fs'
import { chromium } from 'playwright'

const OUT = process.env.ARTIFACT_DIR || '/tmp/vwork/settings-group3'
const PORT = process.argv[2] || '5555'
const BASE = `http://127.0.0.1:${PORT}/`
const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

let pass = 0
let fail = 0
const failures = []
const consoleErrors = []

function check(name, ok, detail = '') {
  if (ok) {
    pass += 1
    console.log(`PASS [settings-group3] ${name}`)
  } else {
    fail += 1
    failures.push(`${name}${detail ? ' — ' + detail : ''}`)
    console.log(`FAIL [settings-group3] ${name}${detail ? ' — ' + detail : ''}`)
  }
}

async function shot(page, name) {
  // 无头 Chrome 那一帧可能还没绘制完，先等两帧
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

/** 只统计真正占屏的可见元素 */
async function visibleCount(page, selector) {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].filter(el => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
    }).length
  }, selector)
}

async function expectToast(page, name, keyword) {
  const txt = await page.locator('.security-toast, .privacy-toast, .apps-toast, .location-toast')
    .first().textContent().catch(() => '')
  check(name, Boolean(txt && txt.includes(keyword)), `toast="${txt}"`)
}

async function checkedRowTitle(page) {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('.sub-shell .list-cell')]
    const hit = rows.find(r => r.querySelector('.opt-radio.checked'))
    return hit ? (hit.querySelector('.lc-title')?.textContent || '').trim() : ''
  })
}

async function rectOf(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }
  }, selector)
}

async function navTitle(page, scope = '.sub-shell') {
  return page.locator(`${scope} .gn-title`).first().textContent().catch(() => '')
}

async function clickRow(page, scope, text) {
  // link 行用 #title 插槽渲染成 .g3-link-title，不是 ListCell 默认的 .lc-title
  const loc = page.locator(`${scope} .lc-title, ${scope} .g3-link-title`, { hasText: text }).first()
  await loc.click({ timeout: 5000 })
  await page.waitForTimeout(380)
}

async function clickLink(page, scope, text) {
  const loc = page.locator(`${scope} .recommend-link-item`, { hasText: text }).first()
  await loc.click({ timeout: 5000 })
  await page.waitForTimeout(380)
}

async function clickCard(page, scope, text) {
  // 只取 <button>：外层容器 .security-grid-cards 也含 "grid-card" 子串，
  // 命中它会点在四宫格中间的空隙上，看起来「点了没反应」。
  const loc = page.locator(`${scope} button[class*="grid-card"]`, { hasText: text }).first()
  await loc.click({ timeout: 5000 })
  await page.waitForTimeout(380)
}

/** 断言一个三级/四级页真的渲染出来了（标题 + 至少一块可见内容） */
async function expectSubPage(page, label, expectedTitle) {
  const title = (await navTitle(page)) || ''
  check(`${label}：标题为「${expectedTitle}」`, title.trim() === expectedTitle, `实际「${title.trim()}」`)
  const content = await visibleCount(page,
    '.sub-shell .settings-card, .sub-shell .g3-hero, .sub-shell .g3-empty, .sub-shell .g3-donut, .sub-shell .g3-link-box, .sub-shell .g3-notes')
  check(`${label}：至少一块内容可见`, content >= 1, `visible=${content}`)
  const body = await visibleCount(page, '.sub-shell .sub-body')
  check(`${label}：滚动容器可见`, body === 1, `visible=${body}`)
}

async function backFromSub(page) {
  await page.locator('.sub-shell [data-nav-back]').first().click({ timeout: 5000 })
  await page.waitForTimeout(420)
}

async function backFromSecondary(page, scope) {
  await page.locator(`${scope} [data-nav-back]`).first().click({ timeout: 5000 })
  await page.waitForTimeout(420)
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', e => consoleErrors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__system?.openApp?.('settings'))
  await page.waitForTimeout(700)

  const home = '.settings-scroll-container'
  check('设置首页已打开', (await visibleCount(page, `${home} .settings-card`)) >= 6)
  // 首页搜索态：点击后隐藏麦克风、出现圆形返回按钮；输入后是深灰圆白叉清除按钮
  await page.locator('[data-sfd-idle]').click()
  await page.waitForTimeout(400)
  check('首页：点击后出现圆形返回按钮', (await visibleCount(page, '[data-sfd-back]')) === 1)
  check('首页：激活后麦克风隐藏', (await visibleCount(page, '.mic-icon')) === 0)
  await page.locator('.sfd-input').fill('zzzzq')
  await page.waitForTimeout(300)
  check('首页：输入后出现清除按钮', (await visibleCount(page, '[data-sfd-clear]')) === 1)
  const homeClearShape = await page.evaluate(() => {
    const c = document.querySelector('[data-sfd-clear] svg circle')
    const p = document.querySelector('[data-sfd-clear] svg path')
    return Boolean(c && p && c.getAttribute('fill') === '#8E8E93' && p.getAttribute('stroke') === '#FFFFFF')
  })
  check('首页：清除按钮是深灰实心圆白叉', homeClearShape)
  check('首页：无结果显示真机插画空态', (await visibleCount(page, '[data-search-empty]')) === 1)
  await shot(page, '30_home_search_empty')
  await page.locator('[data-sfd-back]').click()
  await page.waitForTimeout(400)
  check('首页：返回后回到设置首页', (await visibleCount(page, `${home} .settings-card`)) >= 6)

  // 首页悬浮搜索栏作为「位置基准」：后面应用列表的搜索栏要和它逐像素对齐
  const homeDock = await rectOf(page, '[data-search-dock]')
  check('首页搜索栏可量测', Boolean(homeDock) && homeDock.height > 0)

  /* ==================== A. 密码与安全 ==================== */
  await clickRow(page, home, '密码与安全')
  check('A：二级页「密码与安全」标题', (await navTitle(page, '.settings-security-page')).trim() === '密码与安全')
  await shot(page, '01_security_home')

  await clickCard(page, '.settings-security-page', '锁屏密码')
  await expectSubPage(page, 'A 锁屏密码', '锁屏密码')
  await shot(page, '02_lock_password')
  // 蓝链（非 ListCell）也要能点
  await page.locator('.sub-shell .g3-link', { hasText: '防盗警报' }).first().click()
  await page.waitForTimeout(380)
  await expectSubPage(page, 'A 你可能想找蓝链可点', '防盗警报')
  await backFromSub(page)
  await clickRow(page, '.sub-shell', '数字密码')
  await expectSubPage(page, 'A 数字密码（四级）', '数字密码')
  check('A 数字密码：头图可见', (await visibleCount(page, '.sub-shell .g3-hero')) === 1)
  await shot(page, '03_numeric_password')
  await backFromSub(page)
  await backFromSub(page)

  await clickRow(page, '.settings-security-page', '手机防盗')
  await expectSubPage(page, 'A 手机防盗', '手机防盗')
  check('A 手机防盗：5 行设置', (await visibleCount(page, '.sub-shell .list-cell')) >= 5)
  await shot(page, '04_anti_theft')
  await clickRow(page, '.sub-shell', '解锁抓拍')
  await expectSubPage(page, 'A 解锁抓拍（四级）', '解锁抓拍')
  await backFromSub(page)
  await backFromSub(page)
  await backFromSecondary(page, '.settings-security-page')

  /* ==================== B. 权限与隐私 ==================== */
  await clickRow(page, home, '权限与隐私')
  check('B：二级页「权限与隐私」标题', (await navTitle(page, '.settings-privacy-page')).trim() === '权限与隐私')
  await shot(page, '05_privacy_home')

  await clickCard(page, '.settings-privacy-page', 'XHide')
  await expectSubPage(page, 'B XHide', 'XHide')
  await shot(page, '06_xhide')
  await backFromSub(page)

  await clickCard(page, '.settings-privacy-page', '防偷窥')
  await expectSubPage(page, 'B 防偷窥', '防偷窥')
  check('B 防偷窥：引导头图可见', (await visibleCount(page, '.sub-shell .g3-hero')) === 1)
  await shot(page, '07_anti_peek')
  await backFromSub(page)

  await clickCard(page, '.settings-privacy-page', '双系统')
  await expectSubPage(page, 'B 双系统', '双系统')
  check('B 双系统：底部「创建副系统」按钮可见',
    (await visibleCount(page, '.sub-shell .sub-action-btn')) === 1 &&
    (await page.locator('.sub-shell .sub-action-btn').textContent()).trim() === '创建副系统')
  await shot(page, '08_dual_system')
  await backFromSub(page)

  await clickRow(page, '.settings-privacy-page', '隐私信息中心')
  await expectSubPage(page, 'B 隐私信息中心', '隐私信息中心')
  check('B 隐私信息中心：环形图可见', (await visibleCount(page, '.sub-shell .g3-donut svg')) === 1)
  await shot(page, '09_privacy_dashboard')
  await backFromSub(page)

  await clickRow(page, '.settings-privacy-page', '特殊应用权限')
  await expectSubPage(page, 'B 特殊应用权限', '特殊应用权限')
  check('B 特殊应用权限：分组标题 ≥2', (await visibleCount(page, '.sub-shell .section-header')) >= 2)
  await shot(page, '10_special_access')
  await clickRow(page, '.sub-shell', '安装未知应用')
  await expectSubPage(page, 'B 安装未知应用（四级）', '安装未知应用')
  await backFromSub(page)
  await backFromSub(page)
  await backFromSecondary(page, '.settings-privacy-page')

  /* ==================== C. 应用管理 ==================== */
  await clickRow(page, home, '应用管理')
  check('C：二级页「应用管理」标题', (await navTitle(page, '.settings-apps-page')).trim() === '应用管理')

  await clickRow(page, '.settings-apps-page', '应用列表')
  await expectSubPage(page, 'C 应用列表', '应用列表')
  check('C 应用列表：统一搜索控件可见', (await visibleCount(page, '.sub-shell .settings-search-bar')) === 1)
  check('C 应用列表：不再有自绘搜索框', (await visibleCount(page, '.sub-shell .g3-search')) === 0)
  check('C 应用列表：应用行覆盖全部注册应用', (await visibleCount(page, '.sub-shell .list-cell')) >= 30)

  // 全部图标必须是桌面注册表的真实 PNG，且真的解码渲染出来了（不数空节点）
  const icons = await page.evaluate(() => [...document.querySelectorAll('[data-registered-app-icon] img.registered-app-img')].map(img => ({
    src: img.getAttribute('src') || '',
    w: img.getBoundingClientRect().width,
    loaded: img.complete && img.naturalWidth > 0
  })))
  check('C 应用列表：≥30 个真实应用图标', icons.length >= 30, `实际 ${icons.length}`)
  check('C 应用列表：图标全部来自 /icons 且加载成功',
    icons.every(i => i.src.startsWith('/icons/') && i.w > 0 && i.loaded),
    icons.filter(i => !i.loaded).map(i => i.src).slice(0, 3).join(','))

  const names = await page.evaluate(() => [...document.querySelectorAll('.sub-shell .lc-title')].map(e => e.textContent.trim()))
  check('C 应用列表：应用名来自注册表', names.includes('电话') && names.includes('AI Mate') && names.includes('支付宝'),
    `共 ${names.length} 行`)
  check('C 应用列表：不再出现硬编码的第三方应用名', !names.some(n => ['哔哩哔哩', '大众点评', '叮咚买菜', '抖音极速版'].includes(n)))

  // 位置与首页同一把尺 A/B：left/right/bottom/height 逐项对齐
  const subDock = await rectOf(page, '.sub-shell [data-search-dock]')
  check('C 应用列表：搜索栏位置与首页一致',
    Boolean(subDock && homeDock) &&
    Math.abs(subDock.left - homeDock.left) < 1.5 &&
    Math.abs(subDock.right - homeDock.right) < 1.5 &&
    Math.abs(subDock.bottom - homeDock.bottom) < 1.5 &&
    Math.abs(subDock.height - homeDock.height) < 1.5,
    subDock ? `首页 ${JSON.stringify(homeDock)} / 列表 ${JSON.stringify(subDock)}` : '量不到列表搜索栏')

  await shot(page, '11_app_list')

  // 搜索框真的能过滤注册应用（先激活搜索态）
  await page.locator('.sub-shell [data-sfd-idle]').click()
  await page.waitForTimeout(350)
  check('C 应用列表：激活后出现返回按钮且麦克风隐藏',
    (await visibleCount(page, '.sub-shell [data-sfd-back]')) === 1 && (await visibleCount(page, '.mic-icon')) === 0)
  await page.locator('.sub-shell .sfd-input').fill('微')
  await page.waitForTimeout(250)
  const filtered = await page.evaluate(() => [...document.querySelectorAll('.sub-shell .lc-title')].map(e => e.textContent.trim()))
  check('C 应用列表：搜索「微」过滤到微信', filtered.length >= 1 && filtered.length <= 3 && filtered.every(n => n.includes('微')),
    filtered.join(','))
  check('C 应用列表：有结果时排序标签还在', (await visibleCount(page, '.sub-shell .g3-sort')) === 1)

  // 搜不到东西时，整页只该剩空态：排序标签 / 小标题都不许压在上面
  await page.locator('.sub-shell .sfd-input').fill('zzzzq')
  await page.waitForTimeout(300)
  check('C 应用列表：无结果时只剩空态', (await visibleCount(page, '.sub-shell [data-search-empty]')) === 1)
  check('C 应用列表：无结果时排序标签消失', (await visibleCount(page, '.sub-shell .g3-sort')) === 0)
  check('C 应用列表：无结果时没有应用行', (await visibleCount(page, '.sub-shell .list-cell')) === 0)
  const emptyCenter = await page.evaluate(() => {
    const shell = document.querySelector('.sub-shell').getBoundingClientRect()
    const art = document.querySelector('[data-search-empty] svg').getBoundingClientRect()
    const txt = document.querySelector('[data-search-empty] .search-empty-text').getBoundingClientRect()
    return {
      pct: +((((art.y + txt.bottom) / 2) - shell.y) / shell.height * 100).toFixed(1),
      dx: +((art.x + art.width / 2) - (shell.x + shell.width / 2)).toFixed(1)
    }
  })
  check('C 应用列表：空态整组居中', Math.abs(emptyCenter.pct - 50) <= 4 && Math.abs(emptyCenter.dx) <= 2, JSON.stringify(emptyCenter))
  await shot(page, '11b_app_list_empty')
  await page.locator('.sub-shell [data-sfd-back]').click()
  await page.waitForTimeout(350)
  check('C 应用列表：返回后排序标签恢复', (await visibleCount(page, '.sub-shell .g3-sort')) === 1)

  await clickRow(page, '.sub-shell', 'AI Mate')
  await expectSubPage(page, 'C 应用信息（四级）', '应用信息')
  await backFromSub(page)
  await backFromSub(page)

  await clickRow(page, '.settings-apps-page', '默认应用')
  await expectSubPage(page, 'C 默认应用', '默认应用')
  check('C 默认应用：12 行', (await visibleCount(page, '.sub-shell .list-cell')) >= 12)
  await shot(page, '12_default_apps')
  await clickRow(page, '.sub-shell', '浏览器')
  await expectSubPage(page, 'C 选择默认应用（四级）', '浏览器')
  check('C 选择默认应用：真机 2 个候选', (await visibleCount(page, '.sub-shell .opt-radio')) === 2)
  const pickerNames = await page.evaluate(() => [...document.querySelectorAll('.sub-shell .lc-title')].map(e => e.textContent.trim()))
  check('C 选择默认应用：候选是 Chrome / 浏览器', pickerNames.includes('Chrome') && pickerNames.includes('浏览器'), pickerNames.join(','))
  check('C 选择默认应用：带分类说明',
    (await page.locator('.sub-shell .card-note').first().textContent().catch(() => ''))?.includes('浏览网页') === true)
  await backFromSub(page)
  await backFromSub(page)

  await clickRow(page, '.settings-apps-page', '联系人存储')
  await expectSubPage(page, 'C 联系人存储', '联系人存储')
  check('C 联系人存储：单选项 3 个', (await visibleCount(page, '.sub-shell .opt-radio')) === 3)
  await shot(page, '13_contacts_storage')
  await backFromSub(page)

  /* ---------- C 补充：按真机重做的三级/四级页 ---------- */
  // 应用信息：桌面同源头部 + 三按钮 + 真机行名
  await clickRow(page, '.settings-apps-page', '应用列表')
  await clickRow(page, '.sub-shell', 'AI Mate')
  await expectSubPage(page, 'C 应用信息', '应用信息')
  check('C 应用信息：应用头部可见', (await visibleCount(page, '.sub-shell .g3-app-hero')) === 1)
  check('C 应用信息：头部显示刚点的应用',
    (await page.locator('.sub-shell .g3-app-hero-name').first().textContent().catch(() => ''))?.trim() === 'AI Mate')
  check('C 应用信息：开启/卸载/强行停止 3 按钮', (await visibleCount(page, '.sub-shell .g3-triple-btn')) === 3)
  const detailNames = await page.evaluate(() => [...document.querySelectorAll('.sub-shell .lc-title')].map(e => e.textContent.trim()))
  check('C 应用信息：真机行名齐全',
    ['通知', '权限', '存储和缓存', '移动数据和 WLAN', '设备使用时间', '电池', '默认打开'].every(t => detailNames.includes(t)),
    detailNames.join(','))
  await shot(page, '19_app_info')
  await page.locator('.sub-shell .g3-triple-btn', { hasText: '开启' }).first().click()
  await expectToast(page, 'C 应用信息：三按钮有反馈', '开启')

  // 存储和缓存（真机 137_storage）
  await clickRow(page, '.sub-shell', '存储和缓存')
  await expectSubPage(page, 'C 存储', '存储')
  const storageNames = await page.evaluate(() => [...document.querySelectorAll('.sub-shell .lc-title, .sub-shell .g3-link-title')].map(e => e.textContent.trim()))
  check('C 存储：真机六行', ['总计', '应用大小', '用户数据', '清除存储空间', '缓存', '清理缓存'].every(t => storageNames.includes(t)), storageNames.join(','))
  check('C 存储：两条蓝色操作链接', (await visibleCount(page, '.sub-shell .g3-link-title')) === 2)
  await shot(page, '24_storage')
  await clickRow(page, '.sub-shell', '清理缓存')
  await expectToast(page, 'C 存储：动作行点击有反馈', '清理缓存')
  await backFromSub(page)

  // 移动数据和 WLAN（真机 138_data_wlan）
  await clickRow(page, '.sub-shell', '移动数据和 WLAN')
  await expectSubPage(page, 'C 移动数据用量', '移动数据用量')
  const dataText = await page.evaluate(() => document.querySelector('.sub-shell .sub-body')?.textContent || '')
  check('C 移动数据用量：真机数值', dataText.includes('234 MB') && dataText.includes('225 MB') && dataText.includes('9.01 MB'))
  check('C 移动数据用量：两个流量开关', (await visibleCount(page, '.sub-shell .toggle-switch')) === 2)
  await shot(page, '25_data_usage')
  await backFromSub(page)

  // 设备使用时间＝单应用使用时间（真机 139_usage），标题显示应用名
  await clickRow(page, '.sub-shell', '设备使用时间')
  await expectSubPage(page, 'C 单应用使用时间', 'AI Mate')
  check('C 单应用使用时间：两个下拉维度', (await visibleCount(page, '.sub-shell .g3-usage-dropdown')) === 2)
  check('C 单应用使用时间：应用图标', (await visibleCount(page, '.sub-shell .g3-usage-app-icon')) === 1)
  check('C 单应用使用时间：设置分组 + 两行',
    (await visibleCount(page, '.sub-shell .g3-accent-header')) === 1 && (await visibleCount(page, '.sub-shell .list-cell')) === 2)
  await shot(page, '26_app_screen_time')
  await backFromSub(page)

  // 电池（真机 140_battery）
  await clickRow(page, '.sub-shell', '电池')
  await expectSubPage(page, 'C 应用电池用量', '应用的电池用量')
  check('C 应用电池用量：已优化 / 无限制两单选', (await visibleCount(page, '.sub-shell .opt-radio')) === 2)
  await shot(page, '27_battery')

  // 🔴 回归重点：这一页以前「压根儿点不了」——radio / toggle 整行点击全被吞掉
  await clickRow(page, '.sub-shell', '无限制')
  check('C 电池：点整行可切换单选', (await checkedRowTitle(page)) === '无限制', await checkedRowTitle(page))
  const swBefore = await page.locator('.sub-shell .toggle-switch').first().getAttribute('aria-checked')
  await clickRow(page, '.sub-shell', '允许后台使用')
  const swAfter = await page.locator('.sub-shell .toggle-switch').first().getAttribute('aria-checked')
  check('C 电池：点整行可切换开关', swBefore !== swAfter, `${swBefore} → ${swAfter}`)
  const swBefore2 = swAfter
  await page.locator('.sub-shell .toggle-switch').first().click()
  await page.waitForTimeout(180)
  const swAfter2 = await page.locator('.sub-shell .toggle-switch').first().getAttribute('aria-checked')
  check('C 电池：点开关本体只翻转一次（无双切）', swBefore2 !== swAfter2, `${swBefore2} → ${swAfter2}`)
  await backFromSub(page)

  await backFromSub(page)
  await backFromSub(page)

  // 日历/时钟与桌面同一套自绘图标（不是 PNG）
  await clickRow(page, '.settings-apps-page', '应用列表')
  const liveIcons = await page.evaluate(() => ({
    calendar: [...document.querySelectorAll('[data-registered-app-icon] .calendar-face')].filter(e => e.getBoundingClientRect().width > 0).length,
    clock: [...document.querySelectorAll('[data-registered-app-icon] .clock-face')].filter(e => e.getBoundingClientRect().width > 0).length
  }))
  check('C 应用列表：日历/时钟复用桌面自绘图标', liveIcons.calendar === 1 && liveIcons.clock === 1, JSON.stringify(liveIcons))
  await backFromSub(page)

  // 屏幕使用时间 = 应用活动详情
  await clickRow(page, '.settings-apps-page', '屏幕使用时间')
  await expectSubPage(page, 'C 屏幕使用时间', '应用活动详情')
  check('C 屏幕使用时间：总时长 2小时44分钟',
    (await page.locator('.sub-shell .g3-usage-value').first().textContent().catch(() => ''))?.trim() === '2小时44分钟')
  check('C 屏幕使用时间：周柱状图 7 根', (await visibleCount(page, '.sub-shell .g3-bar-col')) === 7)
  check('C 屏幕使用时间：定时器提示卡', (await visibleCount(page, '.sub-shell .g3-tip')) === 1)
  check('C 屏幕使用时间：应用用时行 ≥10', (await visibleCount(page, '.sub-shell .list-cell')) >= 10)
  await page.locator('.sub-shell .g3-usage-dropdown', { hasText: '屏幕使用时间' }).first().click()
  await expectToast(page, 'C 使用时长：下拉维度点击有反馈', '屏幕使用时间')
  await shot(page, '20_screen_time')
  await backFromSub(page)

  // 云端媒体设置
  await clickRow(page, '.settings-apps-page', '云端媒体设置')
  await expectSubPage(page, 'C 云端媒体设置', '云端媒体设置')
  check('C 云端媒体设置：蓝色分组小标题', (await visibleCount(page, '.sub-shell .g3-accent-header')) === 1)
  check('C 云端媒体设置：2 个来源单选', (await visibleCount(page, '.sub-shell .opt-radio')) === 2)
  check('C 云端媒体设置：齿轮入口可见', (await visibleCount(page, '.sub-shell .g3-gear')) === 1)
  await clickRow(page, '.sub-shell', '无')
  check('C 云端媒体：点整行可切换单选', (await checkedRowTitle(page)) === '无', await checkedRowTitle(page))
  await page.locator('.sub-shell .g3-gear').first().click()
  await page.waitForTimeout(380)
  await expectSubPage(page, 'C 云端媒体账号（四级）', 'Google 相册')
  await backFromSub(page)
  await shot(page, '21_cloud_media')
  await backFromSub(page)

  // 自启动管理（推荐链接）
  await clickLink(page, '.settings-apps-page', '自启动管理')
  await expectSubPage(page, 'C 自启动管理', '自启动管理')
  check('C 自启动管理：全部管理 + 8 应用', (await visibleCount(page, '.sub-shell .list-cell')) === 9)
  check('C 自启动管理：智能优化按钮', (await visibleCount(page, '.sub-shell .sub-action-btn')) === 1)
  await shot(page, '22_autostart')
  await backFromSub(page)

  // 应用双开 → 更多应用
  await clickRow(page, '.settings-apps-page', '应用双开')
  await clickRow(page, '.sub-shell', '体验更多应用')
  await expectSubPage(page, 'C 更多应用', '更多应用')
  check('C 更多应用：真机 9 个候选', (await visibleCount(page, '.sub-shell .list-cell')) === 9)
  await shot(page, '23_more_apps')
  await backFromSub(page)
  await backFromSub(page)

  await backFromSecondary(page, '.settings-apps-page')

  /* ==================== D. 位置信息 ==================== */
  await clickRow(page, home, '位置信息')
  check('D：二级页「位置信息」标题', (await navTitle(page, '.settings-location-page')).trim() === '位置信息')
  await shot(page, '14_location_home')

  await clickRow(page, '.settings-location-page', '应用位置信息权限')
  await expectSubPage(page, 'D 应用位置信息权限', '位置信息')
  check('D 应用位置信息权限：权限分组 3 个', (await visibleCount(page, '.sub-shell .section-header')) >= 3)
  await shot(page, '15_location_permission')
  await clickRow(page, '.sub-shell', '天气')
  await expectSubPage(page, 'D 位置信息权限（四级）', '位置信息权限')
  check('D 位置信息权限：3 个授权单选', (await visibleCount(page, '.sub-shell .opt-radio')) === 3)
  check('D 位置信息权限：精确位置开关', (await visibleCount(page, '.sub-shell .toggle-switch')) >= 1)
  await clickRow(page, '.sub-shell', '不允许')
  check('D 位置信息权限：点整行可切换授权单选', (await checkedRowTitle(page)) === '不允许', await checkedRowTitle(page))
  await shot(page, '16_app_location_permission')
  await backFromSub(page)
  await backFromSub(page)

  await clickRow(page, '.settings-location-page', '位置信息服务')
  await expectSubPage(page, 'D 位置信息服务', '位置信息服务')
  check('D 位置信息服务：9 行', (await visibleCount(page, '.sub-shell .list-cell')) >= 9)
  await shot(page, '17_location_services')
  await clickRow(page, '.sub-shell', 'WLAN 扫描')
  await expectSubPage(page, 'D WLAN 扫描（四级）', 'WLAN 扫描')
  await backFromSub(page)
  await backFromSub(page)

  await clickRow(page, '.settings-location-page', '查看全部')
  await expectSubPage(page, 'D 近期位置信息访问', '近期位置信息访问')
  check('D 近期位置信息访问：5 条记录', (await visibleCount(page, '.sub-shell .list-cell')) === 5)
  await shot(page, '18_recent_location')
  await backFromSub(page)

  /* ==================== 开关与转场 ==================== */
  const mainToggle = page.locator('.settings-location-page .toggle-switch').first()
  const before = await mainToggle.getAttribute('aria-checked')
  await mainToggle.click()
  await page.waitForTimeout(220)
  const after = await page.locator('.settings-location-page .toggle-switch').first().getAttribute('aria-checked')
  check('D 主开关点击后状态翻转', before !== after, `${before} → ${after}`)
  const trans = await page.evaluate(() => {
    const sheets = [...document.styleSheets]
    let hit = false
    for (const s of sheets) {
      let rules
      try { rules = s.cssRules } catch { continue }
      for (const r of rules || []) {
        if (r.selectorText && r.selectorText.includes('.slide-enter-active')) hit = true
      }
    }
    return hit
  })
  check('层级转场样式已注入', trans)

  /* ==================== E. 通知深链到现有应用通知设置页 ==================== */
  await backFromSecondary(page, '.settings-location-page')
  await clickRow(page, home, '应用管理')
  await clickRow(page, '.settings-apps-page', '应用列表')
  await clickRow(page, '.sub-shell', 'AI Mate')
  await clickRow(page, '.sub-shell', '通知')
  await page.waitForTimeout(650)
  check('E 通知：跳到现有的 SettingsNotifications', (await visibleCount(page, '.notif-settings')) === 1)
  check('E 通知：标题是刚点的应用名',
    (await page.locator('.notif-settings .ns-hero-title').first().textContent().catch(() => ''))?.trim() === 'AI Mate')
  const heroImg = await page.evaluate(() => {
    const el = document.querySelector('.notif-settings .ns-app-hero-img')
    if (!el) return null
    return { src: el.getAttribute('src') || '', loaded: el.complete && el.naturalWidth > 0, w: el.getBoundingClientRect().width }
  })
  check('E 通知：头部是真实应用图标且已解码',
    Boolean(heroImg && heroImg.src.startsWith('/icons/') && heroImg.loaded && heroImg.w > 0), JSON.stringify(heroImg))
  const notifText = await page.evaluate(() => document.querySelector('.notif-settings')?.textContent || '')
  check('E 通知：含允许通知 / 提醒强度 / 提醒方式',
    ['允许通知', '提醒强度', '提醒方式'].every(t => notifText.includes(t)))
  check('E 通知：group3 自编通知页已不存在', !notifText.includes('关闭后该应用将不再发送通知'))
  await shot(page, '28_notif_deeplink')

  /* ==================== F. 设置里最后一个死入口「更多服务」 ==================== */
  // 重新加载以摆脱 appDetail 子页，走一遍真实用户路径
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(350)
  await page.evaluate(() => window.__system?.openApp?.('settings'))
  await page.waitForTimeout(700)
  await clickRow(page, home, '通知与状态栏')
  await clickRow(page, '.notif-settings', 'Dynamic Bar')
  await page.waitForTimeout(400)
  // Dynamic Bar 页有两处「更多服务」：实时活动分组里带开关的那条、以及
  // .db-more-group 里带 chevron 的那条。要验证的是后者能点进子页。
  const moreRow = page.locator('.notif-settings .db-more-group .lc-title', { hasText: '更多服务' }).first()
  check('F 更多服务：带箭头的行存在', (await moreRow.count()) === 1)
  await moreRow.click()
  await page.waitForTimeout(600)
  const notifTitles = await page.locator('.notif-settings .gn-title').allTextContents()
  check('F 更多服务：可点进子页', notifTitles.some(t => t.trim() === '更多服务'), notifTitles.join('|'))
  check('F 更多服务：系统服务开关清单可见', (await visibleCount(page, '.notif-settings .toggle-switch')) >= 5)
  await shot(page, '29_more_services')

  check('全程 0 控制台错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))

  await browser.close()
  console.log(`\n[settings-group3] ${pass} PASS / ${fail} FAIL · 截图 ${OUT}`)
  if (failures.length) console.log('失败明细:\n  ' + failures.join('\n  '))
  process.exit(fail ? 1 : 0)
}

run().catch(e => {
  console.error('[settings-group3] 运行异常:', e)
  process.exit(1)
})
