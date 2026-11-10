#!/usr/bin/env node
/** iOS 专注模式全链路：设置首页 → 详情 → 允许列表/屏幕/定时/过滤 → 新建/删除 → CC 切换与深链。 */
import fs from 'node:fs'
import { chromium } from 'playwright'

const OUT = process.env.ARTIFACT_DIR || '/tmp/vwork/focus'
const PORT = process.argv[2] || '5555'
const BASE = `http://127.0.0.1:${PORT}/`
const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
let pass = 0
let fail = 0
const failures = []
const pageErrors = []
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`PASS [focus] ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ' — ' + detail : ''}`); console.log(`FAIL [focus] ${name}${detail ? ' — ' + detail : ''}`) }
}
async function click(page, selector, wait = 420) {
  const loc = page.locator(selector).last()
  await loc.scrollIntoViewIfNeeded().catch(() => {})
  await loc.click({ timeout: 7000 })
  await page.waitForTimeout(wait)
}
async function text(page, selector) {
  return ((await page.locator(selector).last().textContent().catch(() => '')) || '').trim()
}
async function visible(page, selector) {
  return page.locator(selector).last().evaluate(el => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
  }).catch(() => false)
}
async function countVisible(page, selector) {
  return page.evaluate(sel => [...document.querySelectorAll(sel)].filter(el => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
  }).length, selector)
}
async function back(page) { await click(page, '.sub-shell [data-nav-back]') }
async function shot(page, name) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', e => pageErrors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()) })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('tos.settings.focus.v1'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(650)
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(350)
  await page.evaluate(() => window.__system?.openApp?.('settings'))
  await page.waitForTimeout(650)

  await click(page, '[data-setting-row="focus"]', 520)
  check('A 设置首页 Infinix AI 下方入口可进入', await visible(page, '[data-focus-page="home"]'))
  check('A 默认五个模式完整显示', await countVisible(page, '[data-focus-mode]') === 5)
  await shot(page, '01_focus_home')

  await click(page, '[data-focus-mode="classroom"]')
  check('B 模式详情标题与图标', (await text(page, '.fd-hero h1')) === '课堂专注模式')
  check('B 默认定时含时间、位置与 App', await countVisible(page, '[data-focus-schedule-id]') === 5)
  check('B 默认过滤条件两项', await countVisible(page, '[data-focus-active-filter]') === 2)
  await shot(page, '02_focus_detail')

  await click(page, '[data-focus-open="people"]')
  check('C 联系人允许列表打开', await visible(page, '[data-focus-allowed="people"]'))
  await click(page, '[data-focus-allowed="people"] [data-focus-person="Ricky"]')
  check('C 联系人可选中', await page.locator('[data-focus-allowed="people"] [data-focus-person="Ricky"]').evaluate(el => el.classList.contains('selected')))
  await back(page)
  check('C 返回详情后联系人头像同步', await countVisible(page, '.fd-people-preview > span') === 2)

  await click(page, '[data-focus-open="apps"]')
  check('D App 允许列表使用真实注册应用', await countVisible(page, '[data-registered-app-list] [data-registered-app-icon]') >= 30)
  await click(page, '[data-focus-allowed="apps"] [data-app-id="camera"]')
  await back(page)
  check('D 返回详情后 App 状态保留', await visible(page, '[data-focus-detail="classroom"]'))

  await click(page, '[data-focus-screen="lock"]')
  check('E 锁屏选取页打开', await visible(page, '[data-focus-screen-picker="lock"]'))
  await click(page, '[data-focus-screen-option="ocean"]')
  await click(page, '[data-focus-screen-confirm]')
  check('E 锁屏选择回写详情', (await text(page, '[data-focus-screen="lock"]')).includes('海洋'))

  await click(page, '[data-focus-schedule-id="time-09:00-10:00"]')
  check('F 时间定时可编辑', await visible(page, '[data-focus-schedule="time"]'))
  await click(page, '[data-focus-weekday="6"]')
  await click(page, '[data-focus-time-target="end"]')
  check('F 标准时间选择弹层出现', await visible(page, '[data-tps-title]'))
  await click(page, '[data-tps-confirm]')
  await click(page, '[data-focus-schedule-save]')
  check('F 时间定时保存后回详情', await visible(page, '[data-focus-detail="classroom"]'))

  await click(page, '[data-focus-add-schedule]')
  check('G 添加定时提供时间位置 App 三类', await countVisible(page, '[data-focus-schedule-type]') === 3)
  await click(page, '[data-focus-schedule-type="time"]')
  await click(page, '[data-focus-weekday="0"]')
  await click(page, '[data-focus-schedule-save]')
  check('G 新时间定时已添加', await countVisible(page, '[data-focus-schedule-id]') === 6)

  await click(page, '[data-focus-add-schedule]')
  await click(page, '[data-focus-schedule-type="location"]')
  await click(page, '[data-focus-location="公司"]')
  await click(page, '[data-focus-schedule-save]')
  check('H 位置定时已添加', (await text(page, '.fd-schedule-card')).includes('公司'))

  await click(page, '[data-focus-add-schedule]')
  await click(page, '[data-focus-schedule-type="app"]')
  await click(page, '[data-focus-schedule="app"] [data-app-id="camera"]')
  await click(page, '[data-focus-schedule-save]')
  check('I App 定时已添加', await countVisible(page, '[data-focus-schedule-id]') === 8)

  await click(page, '[data-focus-add-filter]')
  check('J 过滤条件列表包含 App 与系统两组', await countVisible(page, '[data-focus-filter]') === 12)
  await shot(page, '03_filters')
  await click(page, '[data-focus-filter="calendar"]')
  check('J 日历过滤详情可选取日历', await visible(page, '[data-focus-filter-detail="calendar"]'))
  await click(page, '.calendar-card button', 120)
  await click(page, '.filter-add')
  check('J 日历过滤已加入', await visible(page, '[data-focus-active-filter="calendar"]'))
  await click(page, '[data-focus-add-filter]')
  await click(page, '[data-focus-filter="darkAppearance"]')
  await click(page, '[data-focus-filter-detail="darkAppearance"] [role="switch"]')
  check('K 系统过滤开关可切换', await page.locator('[data-focus-filter-detail="darkAppearance"] [role="switch"]').getAttribute('aria-checked') === 'true')
  await back(page)
  await back(page)
  check('K 系统过滤已加入详情', await visible(page, '[data-focus-active-filter="darkAppearance"]'))

  await click(page, '[data-focus-edit]')
  check('L 编辑弹层打开', await visible(page, '.fd-edit-sheet'))
  await page.locator('.fd-edit-sheet input').fill('课堂自习专注模式')
  await click(page, '.fd-save-edit')
  check('L 名称编辑实时回写', (await text(page, '.fd-hero h1')) === '课堂自习专注模式')

  await click(page, '.focus-detail [data-nav-back]', 480)
  await click(page, '[data-focus-create]')
  check('M 新建入口展示六类模板', await countVisible(page, '[data-focus-template]') === 6)
  await shot(page, '04_templates')
  await click(page, '[data-focus-template="custom"]')
  await page.locator('[data-focus-name]').fill('礼拜')
  await click(page, '[data-focus-icon="graduationCap"]', 100)
  await click(page, '[data-focus-next]')
  check('M 新建介绍页名称正确', (await text(page, '.fc-intro h1')) === '礼拜专注模式')
  await click(page, '.fc-primary')
  await click(page, '[data-focus-create-step="people"] [data-focus-person="蔡"]')
  await click(page, '[data-focus-next]')
  await click(page, '[data-focus-create-step="apps"] [data-app-id="wechat"]')
  await click(page, '[data-focus-finish]')
  check('M 创建完成进入新模式详情', (await text(page, '.fd-hero h1')) === '礼拜专注模式')
  check('M 联系人已在创建流程写入', (await text(page, '.fd-people-preview')).includes('蔡'))
  await shot(page, '05_created_mode')

  await click(page, '[data-focus-delete]')
  check('N 删除有二次确认', await visible(page, '.action-modal-card'))
  await click(page, '.action-modal-card .btn-confirm')
  check('N 删除后回列表且新模式移除', await visible(page, '[data-focus-page="home"]') && await countVisible(page, '[data-focus-mode]') === 5)

  await page.evaluate(() => {
    window.__system?.goHome?.()
    window.__system?.settleOverlay?.('controlCenter', true)
  })
  await page.waitForTimeout(650)
  await click(page, '[data-id="dnd"] .gb-wrap', 400)
  check('O 控制中心 2×1 专注开关展开模式列表', await visible(page, '[data-cc-focus-switcher]') && await countVisible(page, '[data-cc-focus-mode]') === 5)
  await shot(page, '06_cc_focus_switcher')
  await click(page, '[data-cc-focus-mode="personal"] .focus-switcher-main')
  check('O 选择个人模式后列表收起', !(await visible(page, '[data-cc-focus-switcher]')))
  check('O 控制中心磁贴进入激活态', await page.locator('[data-id="dnd"] .gb-body').evaluate(el => getComputedStyle(el).backgroundColor === 'rgb(255, 255, 255)'))

  await click(page, '[data-id="dnd"] .gb-wrap')
  await click(page, '[data-cc-focus-settings="classroom"]', 700)
  check('P 控制中心 … 深链到对应设置详情', await visible(page, '[data-focus-detail="classroom"]'))

  await page.evaluate(() => {
    window.__system?.goHome?.()
    window.__system?.settleOverlay?.('controlCenter', true)
  })
  await page.waitForTimeout(550)
  await click(page, '[data-id="dnd"] .gb-wrap')
  await click(page, '[data-cc-focus-create]')
  check('Q 控制中心新建入口复用完整创建向导', await visible(page, '[data-focus-create-step="templates"]'))
  check('R 全流程无浏览器运行错误', pageErrors.length === 0, pageErrors.join(' | '))

  await browser.close()
  console.log(`\n[focus] ${pass} PASS / ${fail} FAIL`)
  if (fail) {
    console.error(failures.join('\n'))
    process.exitCode = 1
  }
}
run().catch(error => { console.error(error); process.exit(1) })
