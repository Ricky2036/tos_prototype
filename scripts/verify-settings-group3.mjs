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
  const loc = page.locator(`${scope} .lc-title`, { hasText: text }).first()
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
  // 首页悬浮搜索栏作为「位置基准」：后面应用列表的搜索栏要和它逐像素对齐
  const homeDock = await rectOf(page, '.settings-floating-search')
  check('首页搜索栏可量测', Boolean(homeDock) && homeDock.height > 0)

  /* ==================== A. 密码与安全 ==================== */
  await clickRow(page, home, '密码与安全')
  check('A：二级页「密码与安全」标题', (await navTitle(page, '.settings-security-page')).trim() === '密码与安全')
  await shot(page, '01_security_home')

  await clickCard(page, '.settings-security-page', '锁屏密码')
  await expectSubPage(page, 'A 锁屏密码', '锁屏密码')
  await shot(page, '02_lock_password')
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
  const icons = await page.evaluate(() => [...document.querySelectorAll('.sub-shell .g3-app-icon.is-image')].map(img => ({
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
  const subDock = await rectOf(page, '.g3-floating-search')
  check('C 应用列表：搜索栏位置与首页一致',
    Boolean(subDock && homeDock) &&
    Math.abs(subDock.left - homeDock.left) < 1.5 &&
    Math.abs(subDock.right - homeDock.right) < 1.5 &&
    Math.abs(subDock.bottom - homeDock.bottom) < 1.5 &&
    Math.abs(subDock.height - homeDock.height) < 1.5,
    subDock ? `首页 ${JSON.stringify(homeDock)} / 列表 ${JSON.stringify(subDock)}` : '量不到列表搜索栏')

  await shot(page, '11_app_list')

  // 搜索框真的能过滤注册应用
  await page.locator('.sub-shell .search-input').fill('微')
  await page.waitForTimeout(220)
  const filtered = await page.evaluate(() => [...document.querySelectorAll('.sub-shell .lc-title')].map(e => e.textContent.trim()))
  check('C 应用列表：搜索「微」过滤到微信', filtered.length >= 1 && filtered.length <= 3 && filtered.every(n => n.includes('微')),
    filtered.join(','))
  await page.locator('.sub-shell .search-input').fill('')
  await page.waitForTimeout(220)

  await clickRow(page, '.sub-shell', 'AI Mate')
  await expectSubPage(page, 'C 应用信息（四级）', '应用信息')
  await backFromSub(page)
  await backFromSub(page)

  await clickRow(page, '.settings-apps-page', '默认应用')
  await expectSubPage(page, 'C 默认应用', '默认应用')
  check('C 默认应用：12 行', (await visibleCount(page, '.sub-shell .list-cell')) >= 12)
  await shot(page, '12_default_apps')
  await clickRow(page, '.sub-shell', '浏览器')
  await expectSubPage(page, 'C 选择默认应用（四级）', '选择默认应用')
  check('C 选择默认应用：单选项 3 个', (await visibleCount(page, '.sub-shell .opt-radio')) === 3)
  await backFromSub(page)
  await backFromSub(page)

  await clickRow(page, '.settings-apps-page', '联系人存储')
  await expectSubPage(page, 'C 联系人存储', '联系人存储')
  check('C 联系人存储：单选项 3 个', (await visibleCount(page, '.sub-shell .opt-radio')) === 3)
  await shot(page, '13_contacts_storage')
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
