#!/usr/bin/env node
/**
 * 数字健康（Digital Wellbeing）全链路回归。
 *
 * 真机取证：Infinix X6878 / XOS 17，2026-11-10（/tmp/ref/gI/dh_*）。
 * 判「看得见」一律数**可见像素**（rect.width/height > 0）+ 读 getComputedStyle，
 * 不数 DOM 节点——浮层常驻、display:none 的槽位会让 count() 假绿。
 * ⚠️ 宿主把整机等比缩放（~0.94）：「元素该多大」读 getComputedStyle，相对位置才用 rect。
 */
import fs from 'node:fs'
import { chromium } from 'playwright'

const OUT = process.env.ARTIFACT_DIR || '/tmp/vwork/digital-health'
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
    console.log(`PASS [digital-health] ${name}`)
  } else {
    fail += 1
    failures.push(`${name}${detail ? ' — ' + detail : ''}`)
    console.log(`FAIL [digital-health] ${name}${detail ? ' — ' + detail : ''}`)
  }
}

async function shot(page, name) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.screenshot({ path: `${OUT}/${name}.png` })
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
  return (await el.textContent().catch(() => '')).trim()
}

async function cssSize(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const cs = getComputedStyle(el)
    return { w: parseFloat(cs.width), h: parseFloat(cs.height), bg: cs.backgroundColor, color: cs.color }
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

async function ariaChecked(page, selector) {
  return page.evaluate((sel) => document.querySelector(sel)?.getAttribute('aria-checked') === 'true', selector)
}

async function toastText(page) {
  return page.evaluate(() => {
    const el = [...document.querySelectorAll('.dh-toast')].find(e => e.getBoundingClientRect().width > 0)
    return el ? el.textContent.trim() : ''
  })
}

async function click(page, selector, wait = 480) {
  await page.locator(selector).first().click({ timeout: 6000 })
  await page.waitForTimeout(wait)
}

async function back(page, wait = 480) {
  await page.locator('[data-nav-back]').first().click({ timeout: 6000 })
  await page.waitForTimeout(wait)
}

/**
 * 真实模拟「左缘右滑返回」：在 .side-edge 上按下后向右拖过阈值（span 240 的 22%）。
 * ⚠️ 不能用 nav 返回键代替：那走的是应用自己的 emit('back')，
 *    而侧滑走 ScreenView → runBackHandler()，才是「子页栈逐层消费」的真正路径。
 */
async function sideSwipe(page) {
  const edge = page.locator('.side-edge').first()
  const box = await edge.boundingBox({ timeout: 5000 })
  if (!box) return false
  const y = box.y + box.height / 2
  const x0 = box.x + box.width / 2
  await page.mouse.move(x0, y)
  await page.mouse.down()
  for (let i = 1; i <= 10; i += 1) {
    await page.mouse.move(x0 + (150 * i) / 10, y, { steps: 1 })
    await page.waitForTimeout(12)
  }
  await page.mouse.up()
  await page.waitForTimeout(560)
  return true
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', e => pageErrors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()) })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('tos.settings.digitalHealth.v1'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__system?.openApp?.('settings'))
  await page.waitForTimeout(700)

  const HOME = '.settings-scroll-container'

  /* ==================== A. 首页：两行真入口 ==================== */
  const titles = await page.evaluate(() =>
    [...document.querySelectorAll('.settings-scroll-container .list-cell .lc-title')].map(e => e.textContent.trim()))
  check('A1 首页出现「数字健康」独立行', titles.includes('数字健康'))
  check('A2 首页出现「家长控制」独立行', titles.includes('家长控制'))
  check('A3 旧的合并行「数字健康与家长控制」已删除', !titles.some(t => t.includes('数字健康与家长控制')))
  const dhIdx = titles.indexOf('数字健康')
  const paIdx = titles.indexOf('家长控制')
  check('A4 家长控制紧跟在数字健康之后（真机同序）', paIdx === dhIdx + 1, `${dhIdx}/${paIdx}`)
  await shot(page, '00_home_rows')

  await page.locator(`${HOME} .list-cell`, { hasText: '数字健康' }).first().click()
  await page.waitForTimeout(600)
  check('A5 进入数字健康，导航标题正确', (await text(page, '.glass-nav .gn-title')) === '数字健康')
  check('A6 主页容器可见', (await visibleCount(page, '[data-dh-home]')) === 1)
  await shot(page, '01_home')

  /* ==================== B. 主页数据与视觉契约 ==================== */
  const donut = await rectOf(page, '[data-dh-donut]')
  check('B1 环形图可见且有尺寸', Boolean(donut) && donut.width > 100 && donut.height > 100,
    donut ? `${donut.width.toFixed(1)}×${donut.height.toFixed(1)}` : 'null')
  const arcs = await page.evaluate(() => document.querySelectorAll('[data-dh-donut] svg circle').length)
  check('B2 环形图 = 底环 + 4 段弧', arcs === 5, `实际 ${arcs} 个 circle`)
  check('B3 环心总时长 = 7小时17分钟', (await text(page, '.dh-donut-total')) === '7小时17分钟')
  const stats = await page.evaluate(() =>
    [...document.querySelectorAll('.dh-stat')].map(e => e.textContent.replace(/\s+/g, '')))
  check('B4 两个统计块 = 17 次解锁 / 436 条通知',
    stats.length === 2 && stats[0].includes('17') && stats[0].includes('次解锁设备')
    && stats[1].includes('436') && stats[1].includes('条通知'), JSON.stringify(stats))

  const labels = await page.evaluate(() =>
    [...document.querySelectorAll('.dh-donut-label')].filter(e => e.getBoundingClientRect().width > 0).map(e => e.textContent.trim()))
  check('B5 图例四段文字可见', labels.length === 4, JSON.stringify(labels))
  check('B6 图例含「其他」段', labels.includes('其他'), JSON.stringify(labels))

  const secLabels = await page.evaluate(() =>
    [...document.querySelectorAll('.dh-section-label')].filter(e => e.getBoundingClientRect().width > 0).map(e => e.textContent.trim()))
  check('B7 两个蓝色小节标题', secLabels.join('|') === '暂时放下手机|减少打扰', JSON.stringify(secLabels))

  // 「暂时放下手机」四行 + 「减少打扰」三行（含开关）
  const rows = await page.evaluate(() =>
    ['limits', 'sleep', 'focus', 'reminder', 'notifications', 'walking', 'icon']
      .filter(k => document.querySelector(`[data-dh-row="${k}"]`)?.getBoundingClientRect().width > 0))
  check('B8 主页 7 个可交互行全部可见', rows.length === 7, JSON.stringify(rows))

  const pageBg = await page.evaluate(() => getComputedStyle(document.querySelector('[data-dh-home]').closest('.dh-app')).backgroundColor)
  check('B9 主页底色是 Material 灰 #F1F2F4', pageBg === 'rgb(241, 242, 244)', pageBg)
  const labelColor = await page.evaluate(() => getComputedStyle(document.querySelector('.dh-section-label')).color)
  check('B10 小节标题是 Google 蓝 rgb(26,115,232)', labelColor === 'rgb(26, 115, 232)', labelColor)

  /* 环形图墨迹居中：环心文字中心与圆环中心重合（±2px） */
  // 「今天 / 7小时17分钟」是两行一组居中，要拿两行合起来的墨迹包围盒算中心，不能只量第二行
  const center = await page.evaluate(() => {
    const box = (sel) => document.querySelector(sel).getBoundingClientRect()
    const s = box('[data-dh-donut] svg')
    const a = box('.dh-donut-today')
    const b = box('.dh-donut-total')
    const top = Math.min(a.top, b.top)
    const bottom = Math.max(a.bottom, b.bottom)
    const left = Math.min(a.left, b.left)
    const right = Math.max(a.right, b.right)
    return {
      dx: Math.abs((s.left + s.width / 2) - ((left + right) / 2)),
      dy: Math.abs((s.top + s.height / 2) - ((top + bottom) / 2))
    }
  })
  check('B11 环心两行文字作为一组与圆环同心（±3px）', center.dx <= 3 && center.dy <= 3, JSON.stringify(center))

  /* ==================== C. ⋮ 五项落到真实页面 ==================== */
  await click(page, '[data-dh-overflow]', 380)
  const menuItems = await page.evaluate(() =>
    [...document.querySelectorAll('[data-dh-overflow-menu] .dh-overflow-item')].map(e => e.textContent.trim()))
  check('C1 ⋮ 菜单五项且顺序对齐真机',
    menuItems.join('|') === '发送反馈|管理数据|隐私权政策|服务条款|开源许可', JSON.stringify(menuItems))
  await shot(page, '02_overflow')
  await page.locator('[data-dh-overflow-menu] .dh-overflow-item', { hasText: '隐私权政策' }).first().click()
  await page.waitForTimeout(560)
  check('C2 点「隐私权政策」进真实文档页', (await text(page, '.glass-nav .gn-title')) === '隐私权政策')
  const docSections = await visibleCount(page, '.dh-doc-card')
  check('C3 文档页有多段正文卡（≥4）', docSections >= 4, `实际 ${docSections}`)
  check('C4 文档页有「最后更新」', (await text(page, '.dh-doc-meta')).includes('最后更新'))
  await shot(page, '03_privacy')
  await back(page)
  check('C5 返回后回到数字健康主页', (await visibleCount(page, '[data-dh-home]')) === 1)

  // 发送反馈
  await click(page, '[data-dh-overflow]', 360)
  await page.locator('[data-dh-overflow-menu] .dh-overflow-item', { hasText: '发送反馈' }).first().click()
  await page.waitForTimeout(560)
  check('C6 点「发送反馈」进表单页', (await text(page, '.glass-nav .gn-title')) === '发送反馈')
  check('C7 空内容时发送禁用', await page.evaluate(() => document.querySelector('[data-dh-feedback-send]')?.disabled === true))
  await page.locator('[data-dh-feedback-input]').fill('统计口径有点奇怪，希望看到按小时拆分的曲线。')
  await page.waitForTimeout(300)
  check('C8 填了内容后发送可点', await page.evaluate(() => document.querySelector('[data-dh-feedback-send]')?.disabled === false))
  await click(page, '[data-dh-feedback-send]', 480)
  check('C9 发送后出现已收到提示', (await visibleCount(page, '[data-dh-feedback-sent]')) === 1)
  await shot(page, '04_feedback')
  await back(page)

  // 管理数据
  await click(page, '[data-dh-overflow]', 360)
  await page.locator('[data-dh-overflow-menu] .dh-overflow-item', { hasText: '管理数据' }).first().click()
  await page.waitForTimeout(560)
  check('C10 点「管理数据」进数据页', (await text(page, '.glass-nav .gn-title')) === '管理数据')
  check('C11 有导出与删除两行',
    (await visibleCount(page, '[data-dh-data-export]')) === 1 && (await visibleCount(page, '[data-dh-data-delete]')) === 1)
  await click(page, '[data-dh-data-delete]', 420)
  check('C12 删除前有确认对话框', (await text(page, '.dh-dialog-title')) === '删除使用数据？')
  await shot(page, '05_data_confirm')
  await click(page, '[data-dh-dialog-cancel]', 420)
  check('C13 取消后对话框关闭', (await visibleCount(page, '[data-dh-data-confirm]')) === 0)
  await back(page)

  /* ==================== D. 「在应用列表中显示图标」开关 + 持久化 ==================== */
  const iconSwitchBefore = await ariaChecked(page, '[data-dh-icon-switch]')
  check('D1 图标开关真机默认关闭', iconSwitchBefore === false)
  await click(page, '[data-dh-icon-switch]', 320)
  check('D2 点一下变开启', (await ariaChecked(page, '[data-dh-icon-switch]')) === true)
  const swSize = await cssSize(page, '[data-dh-icon-switch]')
  check('D3 开关是 Material 46×28（不是 iOS 51×31）',
    swSize && Math.abs(swSize.w - 46) < 0.6 && Math.abs(swSize.h - 28) < 0.6,
    swSize ? `${swSize.w}×${swSize.h}` : 'null')
  check('D4 开启态轨道色 #1A73E8', swSize?.bg === 'rgb(26, 115, 232)', swSize?.bg)

  /* ==================== E. 应用定时器 ==================== */
  await click(page, '[data-dh-row="limits"]', 620)
  check('E1 子页标题「应用定时器」', (await text(page, '.glass-nav .gn-title')) === '应用定时器')
  check('E2 蓝色小标「您的应用」', (await text(page, '[data-dh-limits-label]')) === '您的应用')
  const appRows = await visibleCount(page, '[data-dh-app]')
  check('E3 应用行 ≥ 30（走桌面注册表全量）', appRows >= 30, `实际 ${appRows}`)
  await shot(page, '03_limits')

  await click(page, '[data-dh-app="wechat"]', 620)
  check('E4 详情页标题 = 应用名「微信」', (await text(page, '.glass-nav .gn-title')) === '微信')
  check('E5 两个胶囊：屏幕使用时间 / 每天',
    (await text(page, '[data-dh-metric]')) === '屏幕使用时间' && (await text(page, '[data-dh-period]')) === '每天')
  check('E6 详情数值 = 4小时35分钟', (await text(page, '[data-dh-app-value]')) === '4小时35分钟')
  const barCount = await visibleCount(page, '[data-dh-bar]')
  check('E7 七日柱状图 7 根可见', barCount === 7, `实际 ${barCount}`)
  const barHeights = await page.evaluate(() =>
    [...document.querySelectorAll('[data-dh-bar]')].map(e => e.getBoundingClientRect().height))
  check('E8 柱状图不是全 0 高度（有真实数据）', barHeights.filter(h => h > 1).length >= 3, JSON.stringify(barHeights.map(h => Math.round(h))))
  const axisTexts = await page.evaluate(() =>
    [...document.querySelectorAll('.dh-grid-line em')].map(e => e.textContent.trim()))
  check('E9 纵轴刻度带「分钟」且最后一个是 0', axisTexts.length === 4 && axisTexts[3] === '0分钟', JSON.stringify(axisTexts))
  const dayText = await text(page, '[data-dh-day-text]')
  check('E10 日期行形如「11月10日周二」', /^\d{1,2}月\d{1,2}日周[一二三四五六日]$/.test(dayText), dayText)
  const nextDisabled = await page.evaluate(() => document.querySelector('[data-dh-next-day]')?.disabled)
  check('E11 今天不能往后翻（右箭头禁用）', nextDisabled === true)
  await click(page, '[data-dh-prev-day]', 340)
  check('E12 左箭头可回看昨天', (await text(page, '[data-dh-day-text]')) !== dayText)
  await shot(page, '04_app_detail')

  // 切「每周」→ 标签变「本周」
  await click(page, '[data-dh-period]', 340)
  await page.locator('[data-dh-period-menu] .dh-drop-item', { hasText: '每周' }).first().click()
  await page.waitForTimeout(340)
  check('E13 周期胶囊切到「每周」', (await text(page, '[data-dh-period]')) === '每周')
  check('E14 切周后标签变「本周」', (await page.evaluate(() => document.querySelector('.dh-hero-label')?.textContent.trim())) === '本周')
  // 切回每天
  await click(page, '[data-dh-period]', 340)
  await page.locator('[data-dh-period-menu] .dh-drop-item', { hasText: '每天' }).first().click()
  await page.waitForTimeout(340)

  // 设置应用定时器
  check('E15 未设置时副文案「无定时器」', (await text(page, '[data-dh-limit-text]')) === '无定时器')
  await click(page, '[data-dh-open-timer]', 420)
  check('E16 弹出居中对话框「设置应用定时器」', (await text(page, '.dh-dialog-title')) === '设置应用定时器')
  const durCount = await visibleCount(page, '[data-dh-dur]')
  check('E17 时长网格 9 档', durCount === 9, `实际 ${durCount}`)
  await shot(page, '05_timer_dialog')
  await click(page, '[data-dh-dur="95"]', 260)
  await click(page, '[data-dh-dialog-confirm]', 480)
  check('E18 确定后副文案变 1小时35分钟', (await text(page, '[data-dh-limit-text]')) === '1小时35分钟')
  const e19 = await toastText(page)
  check('E19 设置成功后出 toast（详情页也能看到，不被卸载的列表分支带走）',
    e19.includes('1小时35分钟') && e19.includes('微信'), e19)
  await page.waitForTimeout(1700)

  await back(page)
  const hourglassBlue = await page.evaluate(() => {
    const el = document.querySelector('[data-dh-app="wechat"] .dh-hourglass')
    return el ? getComputedStyle(el).color : ''
  })
  check('E20 已设定时器的应用沙漏变蓝', hourglassBlue === 'rgb(26, 115, 232)', hourglassBlue)
  check('E21 列表行显示定时器时长', (await text(page, '[data-dh-app="wechat"] .dh-hourglass-badge')) === '1小时35分钟')
  await shot(page, '06_limits_with_timer')
  await back(page)

  /* ==================== F. 应用活动 ==================== */
  await click(page, '[data-dh-open-activity]', 620)
  check('F1 标题「应用活动」', (await text(page, '.glass-nav .gn-title')) === '应用活动')
  check('F2 总时长与主页一致', (await text(page, '[data-dh-activity-total]')) === '7小时17分钟')
  const actRows = await visibleCount(page, '[data-dh-activity-app]')
  check('F3 应用明细 ≥ 5 行', actRows >= 5, `实际 ${actRows}`)
  const legend = await page.evaluate(() =>
    [...document.querySelectorAll('[data-dh-legend]')].map(e => getComputedStyle(e).backgroundColor))
  check('F4 图例 4 段且配色与环形图同源（不全是同一个蓝）', legend.length === 4 && new Set(legend).size >= 3, JSON.stringify(legend))
  await shot(page, '07_activity')
  await back(page)

  /* ==================== G. 睡眠模式（完整流程） ==================== */
  await click(page, '[data-dh-row="sleep"]', 620)
  check('G1 标题「睡眠模式」', (await text(page, '.glass-nav .gn-title')) === '睡眠模式')
  check('G2 初始态「睡眠模式已关闭」', (await text(page, '[data-dh-sleep-state]')) === '睡眠模式已关闭')
  check('G2b 关闭时没有运行条', (await visibleCount(page, '[data-dh-sleep-running]')) === 0)
  await shot(page, '06_sleep_before')

  await click(page, '[data-dh-sleep-toggle]', 520)
  check('G3 点立即开启后文案变「睡眠模式已开启」', (await text(page, '[data-dh-sleep-state]')) === '睡眠模式已开启')
  check('G4 开启后顶部出现运行条', (await visibleCount(page, '[data-dh-sleep-running]')) === 1)
  check('G5 运行条写明结束时间', (await text(page, '[data-dh-sleep-running]')).includes('07:00 结束'), await text(page, '[data-dh-sleep-running]'))
  check('G6 主按钮变「立即关闭」', (await text(page, '[data-dh-sleep-toggle]')) === '立即关闭')
  await shot(page, '07_sleep_enabled')
  await click(page, '[data-dh-sleep-end]', 520)
  check('G7 运行条上的「结束」能关掉睡眠模式', (await visibleCount(page, '[data-dh-sleep-running]')) === 0)
  check('G8 关闭后文案回到「睡眠模式已关闭」', (await text(page, '[data-dh-sleep-state]')) === '睡眠模式已关闭')
  await click(page, '[data-dh-sleep-toggle]', 520)

  await click(page, '[data-dh-schedule]', 420)
  const modes = await visibleCount(page, '[data-dh-sleep-mode]')
  check('G9 日常安排展开后有 3 个单选', modes === 3, `实际 ${modes}`)
  check('G10 默认选中「无」', await page.evaluate(() => {
    const el = document.querySelector('[data-dh-sleep-mode="无"] .opt-radio')
    return el?.classList.contains('checked')
  }))
  await click(page, '[data-dh-sleep-mode="启用时间表"]', 420)
  check('G11 选「启用时间表」后副文案同步', (await text(page, '[data-dh-schedule-sub]')) === '启用时间表')
  check('G12 出现时间表行且显示起止与重复日',
    (await text(page, '[data-dh-schedule-line]')) === '23:00 – 07:00 · 工作日',
    await text(page, '[data-dh-schedule-line]'))
  await shot(page, '08_sleep_schedule_mode')

  await click(page, '[data-dh-open-schedule]', 620)
  check('G13 进「睡眠时间表」页', (await text(page, '.glass-nav .gn-title')) === '睡眠时间表')
  check('G14 开始 / 结束时间对齐默认值',
    (await text(page, '[data-dh-sched-start-value]')) === '23:00' && (await text(page, '[data-dh-sched-end-value]')) === '07:00')
  check('G15 重复日 7 个圆点胶囊', (await visibleCount(page, '[data-dh-sched-day]')) === 7)
  const sunBefore = await page.evaluate(() => document.querySelector('[data-dh-sched-day="0"]')?.classList.contains('on'))
  await click(page, '[data-dh-sched-day="0"]', 360)
  const sunAfter = await page.evaluate(() => document.querySelector('[data-dh-sched-day="0"]')?.classList.contains('on'))
  check('G16 点周日能切换选中', sunBefore === false && sunAfter === true, `${sunBefore} → ${sunAfter}`)
  check('G17 汇总文案跟着变（不再只是工作日）', (await text(page, '[data-dh-sched-summary]')).includes('周日'),
    await text(page, '[data-dh-sched-summary]'))
  await click(page, '[data-dh-sched-start]', 420)
  check('G18 点开始时间弹标准时间滚轮', (await text(page, '[data-tps-title]')) === '开始时间', await text(page, '[data-tps-title]'))
  await shot(page, '09_sleep_time_sheet')
  await click(page, '[data-tps-cancel]', 420)
  check('G19 取消后回到时间表页', (await text(page, '.glass-nav .gn-title')) === '睡眠时间表')
  check('G20 时间表页有闹钟行为开关', (await visibleCount(page, '[data-dh-sched-alarm]')) === 1)
  await back(page)
  check('G21 返回后时间表行同步成新的重复日',
    (await text(page, '[data-dh-schedule-line]')).includes('周日'), await text(page, '[data-dh-schedule-line]'))

  // 模式自定义页
  await click(page, '[data-dh-sleep-custom]', 620)
  check('G22 进入「睡眠」自定义页', (await text(page, '.glass-nav .gn-title')) === '睡眠')
  check('G23 插画卡可见', (await visibleCount(page, '[data-dh-sleep-art]')) === 1)
  check('G24 允许所有通知默认开启', (await ariaChecked(page, '[data-dh-allow-all]')) === true)
  check('G25 屏幕选项两个开关都在',
    (await visibleCount(page, '[data-dh-screen-dim]')) === 1 && (await visibleCount(page, '[data-dh-screen-gray]')) === 1)
  check('G26 通知过滤摘要显示「允许所有通知」', (await text(page, '[data-dh-allow-all-summary]')) === '允许所有通知')
  await shot(page, '10_sleep_settings')

  await click(page, '[data-dh-allow-all]', 420)
  check('G27 关掉「允许所有通知」后摘要同步', (await text(page, '[data-dh-allow-all-summary]')) !== '允许所有通知',
    await text(page, '[data-dh-allow-all-summary]'))
  await click(page, '[data-dh-open-apps]', 620)
  check('G28 进「应用例外」页', (await text(page, '.glass-nav .gn-title')) === '应用例外')
  await click(page, '[data-dh-filter-app="wechat"] [role="checkbox"]', 360)
  check('G29 能把某个应用放进例外名单', await page.evaluate(() =>
    document.querySelector('[data-dh-filter-app="wechat"] [role="checkbox"]')?.classList.contains('on')))
  await back(page)
  check('G30 返回后摘要变「已放行 1 个应用」', (await text(page, '[data-dh-allow-all-summary]')) === '已放行 1 个应用',
    await text(page, '[data-dh-allow-all-summary]'))
  await click(page, '[data-dh-open-contacts]', 620)
  check('G31 进「联系人例外」页', (await text(page, '.glass-nav .gn-title')) === '联系人例外')
  check('G32 联系人清单 3 人', (await visibleCount(page, '[data-dh-filter-contact]')) === 3)
  await click(page, '[data-dh-filter-contact="c-mom"] [role="checkbox"]', 360)
  await shot(page, '11_filter_contacts')
  await back(page)
  check('G33 返回后联系人摘要变「已选 1 人」', (await text(page, '[data-dh-contact-summary]')) === '已选 1 人',
    await text(page, '[data-dh-contact-summary]'))
  await back(page)
  await back(page)

  /* ==================== H. 专注模式（完整流程） ==================== */
  await click(page, '[data-dh-row="focus"]', 620)
  check('H1 标题「专注模式」', (await text(page, '.glass-nav .gn-title')) === '专注模式')
  check('H2 未选应用时「立即开启」禁用', await page.evaluate(() => document.querySelector('[data-dh-focus-start]')?.disabled === true))
  check('H3 未选应用时按钮是灰底（真机禁用态）', await page.evaluate(() => {
    const el = document.querySelector('[data-dh-focus-start]')
    return getComputedStyle(el).backgroundColor === 'rgb(218, 220, 224)'
  }))
  check('H4 初始没有时间表列表', (await visibleCount(page, '[data-dh-focus-schedules]')) === 0)

  await click(page, '[data-dh-add-schedule]', 620)
  check('H5 进「设置时间表」页', (await text(page, '.glass-nav .gn-title')) === '设置时间表')
  check('H6 名称默认「专注时间」', await page.evaluate(() => document.querySelector('[data-dh-fs-name]')?.value === '专注时间'))
  check('H7 重复日默认工作日（5 个选中）', await page.evaluate(() =>
    [...document.querySelectorAll('[data-dh-fs-day]')].filter(e => e.classList.contains('on')).length === 5))
  // 全部取消 → 保存必须禁用
  for (const d of [1, 2, 3, 4, 5]) {
    await page.locator(`[data-dh-fs-day="${d}"]`).click()
    await page.waitForTimeout(90)
  }
  check('H8 一天都没选时保存禁用', await page.evaluate(() => document.querySelector('[data-dh-fs-save]')?.disabled === true))
  for (const d of [1, 2, 3, 4, 5]) {
    await page.locator(`[data-dh-fs-day="${d}"]`).click()
    await page.waitForTimeout(90)
  }
  check('H9 选回重复日后保存恢复可点', await page.evaluate(() => document.querySelector('[data-dh-fs-save]')?.disabled === false))
  await page.locator('[data-dh-fs-name]').fill('上午专注')
  await page.waitForTimeout(200)
  await shot(page, '12_focus_schedule')
  await click(page, '[data-dh-fs-save]', 700)
  check('H10 保存后回到专注模式页', (await text(page, '.glass-nav .gn-title')) === '专注模式')
  check('H11 时间表出现在列表里',
    (await visibleCount(page, '[data-dh-focus-schedule]')) === 1 && (await text(page, '[data-dh-focus-schedule]')).includes('上午专注'),
    await text(page, '[data-dh-focus-schedule]'))
  check('H12 时间表副文案显示起止与重复日',
    (await text(page, '[data-dh-focus-schedule] .dh-row-sub')) === '09:00 – 12:00 · 工作日',
    await text(page, '[data-dh-focus-schedule] .dh-row-sub'))

  await click(page, '[data-dh-focus-app="wechat"] [role="checkbox"]', 380)
  check('H13 勾选后复选框选中', await page.evaluate(() => document.querySelector('[data-dh-focus-app="wechat"] [role="checkbox"]')?.classList.contains('on')))
  check('H14 勾选后「立即开启」解禁', await page.evaluate(() => document.querySelector('[data-dh-focus-start]')?.disabled === false))
  check('H15 复选框是 20×20 方形（不是圆形单选）', await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('[data-dh-focus-app="wechat"] [role="checkbox"]'))
    return Math.abs(parseFloat(cs.width) - 20) < 0.6 && Math.abs(parseFloat(cs.height) - 20) < 0.6 && parseFloat(cs.borderRadius) < 6
  }))

  await click(page, '[data-dh-focus-start]', 700)
  check('H16 开启后出现运行条', (await visibleCount(page, '[data-dh-focus-running]')) === 1)
  check('H17 运行条显示时间表名与已屏蔽数',
    (await text(page, '[data-dh-focus-running]')).includes('正在专注') && (await text(page, '[data-dh-focus-running]')).includes('已屏蔽 1 个应用'),
    await text(page, '[data-dh-focus-running]'))
  check('H18 主按钮变「结束专注模式」', (await text(page, '[data-dh-focus-start]')) === '结束专注模式')
  check('H19 开启时给 toast', (await toastText(page)).includes('屏蔽 1 个应用'), await toastText(page))
  await shot(page, '13_focus_running')
  await page.waitForTimeout(1700)

  await click(page, '[data-dh-focus-stop]', 700)
  check('H20 结束后运行条消失', (await visibleCount(page, '[data-dh-focus-running]')) === 0)
  check('H21 结束后给本次时长提示', (await toastText(page)).includes('本次'), await toastText(page))
  check('H22 按钮回到「立即开启」', (await text(page, '[data-dh-focus-start]')) === '立即开启')
  await page.waitForTimeout(1700)

  await click(page, '[data-dh-focus-schedule-del]', 620)
  check('H23 删除时间表后列表消失', (await visibleCount(page, '[data-dh-focus-schedules]')) === 0)
  check('H24 删除有 toast', (await toastText(page)).includes('已删除'), await toastText(page))
  await page.waitForTimeout(1700)
  await back(page)

  /* ==================== I. 屏幕使用时间提醒 ==================== */
  await click(page, '[data-dh-row="reminder"]', 620)
  check('I1 标题「屏幕使用时间提醒」', (await text(page, '.glass-nav .gn-title')) === '屏幕使用时间提醒')
  check('I2 总开关真机默认开', (await ariaChecked(page, '[data-dh-reminder-switch]')) === true)
  const checkedAll = await page.evaluate(() =>
    [...document.querySelectorAll('[data-dh-reminder-app] [role="checkbox"]')].every(e => e.classList.contains('on')))
  check('I3 进来时全部应用都是选中态', checkedAll === true)
  await click(page, '[data-dh-reminder-app="wechat"] [role="checkbox"]', 320)
  check('I4 取消一个应用后变未选', await page.evaluate(() =>
    !document.querySelector('[data-dh-reminder-app="wechat"] [role="checkbox"]')?.classList.contains('on')))
  await shot(page, '12_reminder')
  await click(page, '[data-dh-reminder-switch]', 340)
  check('I5 关掉总开关后复选框全部禁用', await page.evaluate(() =>
    [...document.querySelectorAll('[data-dh-reminder-app] [role="checkbox"]')].every(e => e.disabled)))
  await back(page)

  /* ==================== J. 看路提醒 ==================== */
  await click(page, '[data-dh-row="walking"]', 620)
  check('J1 标题「看路提醒」', (await text(page, '.glass-nav .gn-title')) === '看路提醒')
  check('J2 顶部 2027 停止服务警告可见', (await text(page, '[data-dh-walking-warn]')).includes('2027'))
  check('J3 引导标题正确', (await text(page, '.dh-walk-title')) === '“看路提醒”会提醒您留意脚下')
  await shot(page, '13_walking')
  await click(page, '[data-dh-walking-next]', 520)
  // 真机默认已允许「通知」，所以进来是 2 个待授权按钮 + 1 个「已允许」，合计仍是 3 项
  const permRows = await page.evaluate(() =>
    [...document.querySelectorAll('[data-dh-walking-perms] .dh-row')].filter(el => {
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    }).length)
  const permBtn = await visibleCount(page, '[data-dh-perm]')
  const permOk = await visibleCount(page, '[data-dh-perm-ok]')
  check('J4 权限页 3 项（2 项待授权 + 1 项已允许）', permRows === 3 && permBtn === 2 && permOk === 1,
    `rows=${permRows} btn=${permBtn} ok=${permOk}`)
  check('J5 位置信息标「可选」', (await text(page, '[data-dh-walking-perms]')).includes('位置信息（可选）'))
  await shot(page, '14_walking_perm')
  await click(page, '[data-dh-perm="activity"]', 300)
  await click(page, '[data-dh-perm="location"]', 420)
  check('J6 三项授权后显示已开启', (await visibleCount(page, '[data-dh-walking-done]')) === 1)
  check('J7 已开启文案正确', (await text(page, '.dh-walk-done-title')) === '看路提醒已开启')
  await shot(page, '15_walking_done')
  await back(page)
  check('J8 回主页后「看路提醒」副文案变「已开启」',
    (await text(page, '[data-dh-row="walking"] .dh-row-sub')) === '已开启')

  /* ==================== K. 家长控制（从主页入口） ==================== */
  await click(page, '[data-dh-row="parental"]', 620)
  check('K1 标题「家长控制」', (await text(page, '.glass-nav .gn-title')) === '家长控制')
  const paRows = await visibleCount(page, '[data-dh-parental-row]')
  check('K2 家长控制 6 行（3 控制 + 2 过滤 + Family Link）', paRows === 6, `实际 ${paRows}`)
  check('K3 页脚有「未满同意年龄」说明', (await text(page, '.dh-footer')).includes('未满同意年龄'))
  await click(page, '[data-dh-parental-pin]', 420)
  check('K4 弹出 PIN 对话框', (await text(page, '.dh-dialog-title')) === '设置家长控制 PIN 码')
  await page.locator('[data-dh-pin-input]').fill('1234')
  await click(page, '[data-dh-dialog-confirm]', 480)
  check('K5 保存后行标题变「更改家长控制 PIN 码」', (await text(page, '[data-dh-parental-pin]')).includes('更改'))
  check('K6 显示已设置的 PIN', (await text(page, '[data-dh-pin-value]')).includes('1234'))
  await shot(page, '16_parental')
  await back(page)

  /* ==================== L. 首页状态回写 + 持久化 ==================== */
  check('L1 应用定时器副文案回写「1 个应用已设置定时器」',
    (await text(page, '[data-dh-row="limits"] .dh-row-sub')) === '1 个应用已设置定时器',
    await text(page, '[data-dh-row="limits"] .dh-row-sub'))
  check('L2 睡眠模式副文案回写「已开启」', (await text(page, '[data-dh-row="sleep"] .dh-row-sub')) === '已开启')
  check('L3 专注模式副文案回写「已选择 1 个应用」', (await text(page, '[data-dh-row="focus"] .dh-row-sub')) === '已选择 1 个应用')
  check('L4 屏幕使用时间提醒副文案「已关闭」', (await text(page, '[data-dh-row="reminder"] .dh-row-sub')) === '已关闭')
  await shot(page, '17_home_after')

  // 刷新后仍在（store 落盘）
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(400)
  await page.evaluate(() => window.__system?.openApp?.('settings'))
  await page.waitForTimeout(700)
  await page.locator(`${HOME} .list-cell`, { hasText: '数字健康' }).first().click()
  await page.waitForTimeout(600)
  check('L5 刷新后设置仍在（已落盘）',
    (await text(page, '[data-dh-row="limits"] .dh-row-sub')) === '1 个应用已设置定时器')
  check('L6 刷新后「在应用列表中显示图标」仍开启', (await ariaChecked(page, '[data-dh-icon-switch]')) === true)
  await back(page)

  /* ==================== M. 家长控制顶层入口 + 侧滑返回 ==================== */
  await page.locator(`${HOME} .list-cell`, { hasText: '家长控制' }).first().click()
  await page.waitForTimeout(600)
  check('M1 首页「家长控制」行直进家长控制页', (await text(page, '.glass-nav .gn-title')) === '家长控制')
  check('M2 PIN 已设置的状态跨入口保留', (await text(page, '[data-dh-parental-pin]')).includes('更改'))
  await back(page)
  check('M3 返回后回到设置首页', (await visibleCount(page, `${HOME} .settings-card`)) >= 6)

  // 侧滑返回逐层消费：数字健康 → 应用定时器 → 数字健康主页 → 设置首页
  await page.locator(`${HOME} .list-cell`, { hasText: '数字健康' }).first().click()
  await page.waitForTimeout(600)
  await click(page, '[data-dh-row="limits"]', 620)
  const beforeSwipe = await text(page, '.glass-nav .gn-title')
  const swiped = await sideSwipe(page)
  const afterSwipe = await text(page, '.glass-nav .gn-title')
  check('M4 侧滑一次：子页 → 数字健康主页', swiped && beforeSwipe === '应用定时器' && afterSwipe === '数字健康',
    `${beforeSwipe} → ${afterSwipe}`)
  await sideSwipe(page)
  check('M5 再侧滑一次：回设置首页', (await visibleCount(page, `${HOME} .settings-card`)) >= 6)

  /* ==================== N. 搜索面接上真入口 ==================== */
  await page.locator('[data-sfd-idle]').click()
  await page.waitForTimeout(420)
  await page.locator('.sfd-input').fill('数字健康')
  await page.waitForTimeout(420)
  const hitTitles = await page.evaluate(() =>
    [...document.querySelectorAll('.settings-search-page .results-card .list-cell .lc-title')].map(e => e.textContent.trim()))
  check('N1 搜索「数字健康」有结果（不再是未实现占位）', hitTitles.includes('数字健康'), JSON.stringify(hitTitles))
  check('N2 搜索结果里也有「家长控制」条目', hitTitles.includes('家长控制'), JSON.stringify(hitTitles))
  await shot(page, '18_search')
  await page.locator('.settings-search-page .results-card .list-cell', { hasText: '数字健康' }).first().click()
  await page.waitForTimeout(620)
  check('N3 点搜索结果直达数字健康主页', (await visibleCount(page, '[data-dh-home]')) === 1)

  check('Z1 全程无 JS 异常', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '))

  console.log(`\n[digital-health] ${pass} PASS / ${fail} FAIL`)
  if (fail) console.log('FAILURES:\n' + failures.map(f => ' - ' + f).join('\n'))
  await browser.close()
  process.exit(fail ? 1 : 0)
}

run().catch(async (e) => {
  console.error('[digital-health] 脚本异常：', e)
  process.exit(1)
})
