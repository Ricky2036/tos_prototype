#!/usr/bin/env node
/**
 * 勿扰模式 e2e（真机 Infinix X6878 / XOS 17，2026-11-10 取证 /tmp/ref/gI/dnd_*）。
 * 覆盖：三个原本点不动的行 → 定时开启三级页（时间弹层 / 星期多选）、
 *      来电提醒单选弹层、应用提醒三级页（应用开关 / 搜索框）、返回栈与主页联动。
 * 判「看得见」一律数可见像素，不数 DOM 节点。
 */
import fs from 'node:fs'
import { chromium } from 'playwright'

const OUT = process.env.ARTIFACT_DIR || '/tmp/vwork/dnd'
const PORT = process.argv[2] || '5555'
const BASE = `http://127.0.0.1:${PORT}/`
const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const HOME = '.settings-scroll-container'
const DND = '.settings-dnd'

let pass = 0
let fail = 0
const failures = []
const consoleErrors = []

function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`PASS [dnd] ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ' — ' + detail : ''}`); console.log(`FAIL [dnd] ${name}${detail ? ' — ' + detail : ''}`) }
}

async function shot(page, name) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

async function visibleCount(page, selector) {
  return page.evaluate((sel) => [...document.querySelectorAll(sel)].filter(el => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
  }).length, selector)
}

async function clickRow(page, scope, text) {
  await page.locator(`${scope} .lc-title`, { hasText: text }).first().click({ timeout: 5000 })
  await page.waitForTimeout(380)
}

async function textOf(page, sel) {
  return (await page.locator(sel).first().textContent().catch(() => '')) || ''
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

  await clickRow(page, HOME, '声音与振动')
  await clickRow(page, '.settings-sound-page', '勿扰模式')
  await page.waitForTimeout(450)
  check('A 进入勿扰模式页', (await textOf(page, `${DND} .gn-title`)).trim() === '勿扰模式')
  await shot(page, '01_dnd_home')

  /* ---------- B. 定时开启三级页 ---------- */
  await page.locator('[data-dnd-row="schedule"]').click()
  await page.waitForTimeout(450)
  check('B 定时开启：进入三级页', (await textOf(page, '.sub-shell .gn-title')).trim() === '定时开启')
  check('B 定时开启：2 个单选 + 3 个设置行',
    (await visibleCount(page, '.sub-shell .opt-radio')) === 2 && (await visibleCount(page, '.sub-shell .list-cell')) === 5)
  await shot(page, '02_schedule')

  // 整行点击切换定时模式
  await page.locator('.sub-shell .list-cell', { hasText: '已关闭' }).first().click()
  await page.waitForTimeout(200)
  const offChecked = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.sub-shell .list-cell')]
    const hit = rows.find(r => r.querySelector('.opt-radio.checked'))
    return hit ? (hit.querySelector('.lc-title')?.textContent || '').trim() : ''
  })
  check('B 定时开启：点整行可切换模式', offChecked === '已关闭', offChecked)
  await page.locator('.sub-shell .list-cell', { hasText: '定时切换' }).first().click()
  await page.waitForTimeout(200)

  // 开始时间弹层：步进 + 确定回写
  await page.locator('.sub-shell .list-cell', { hasText: '开始时间' }).first().click()
  await page.waitForTimeout(350)
  check('B 开始时间：弹层出现', (await textOf(page, '.dnd-sheet-title')).trim() === '开始时间')
  check('B 开始时间：三列滚轮可见', (await visibleCount(page, '.dnd-time-col')) === 3)
  await shot(page, '03_start_time')
  const beforeTime = (await textOf(page, '.dnd-time-current')).trim()
  await page.locator('[aria-label="小时加一"]').click()
  await page.waitForTimeout(150)
  const afterTime = (await textOf(page, '.dnd-time-current')).trim()
  check('B 开始时间：步进可改值', beforeTime !== afterTime, `${beforeTime} → ${afterTime}`)
  await page.locator('.dnd-confirm').click()
  await page.waitForTimeout(350)
  const startVal = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.sub-shell .list-cell')]
    const hit = rows.find(r => (r.querySelector('.lc-title')?.textContent || '').includes('开始时间'))
    return hit ? (hit.querySelector('.lc-value')?.textContent || '').trim() : ''
  })
  check('B 开始时间：确定后回写定时页', startVal.length > 0 && startVal !== '下午10:00', startVal)

  // 重复多选弹层
  await page.locator('.sub-shell .list-cell', { hasText: '重复' }).first().click()
  await page.waitForTimeout(350)
  check('B 重复：弹层出现', (await textOf(page, '.dnd-sheet-title')).trim() === '重复')
  check('B 重复：7 个星期选项', (await visibleCount(page, '.dnd-repeat-row')) === 7)
  check('B 重复：真机默认勾选 5 天', (await visibleCount(page, '.dnd-check.on')) === 5)
  await shot(page, '04_repeat')
  await page.locator('.dnd-repeat-row', { hasText: '星期三' }).click()
  await page.waitForTimeout(150)
  check('B 重复：勾选状态可切换', (await visibleCount(page, '.dnd-check.on')) === 6)
  await page.locator('.dnd-cancel').click()
  await page.waitForTimeout(350)
  check('B 重复：取消不落库', (await visibleCount(page, '.dnd-check.on')) === 0)

  // 返回主页
  await page.locator('.sub-shell [data-nav-back]').first().click()
  await page.waitForTimeout(450)
  check('B 返回：回到勿扰主页', (await visibleCount(page, '[data-dnd-row="schedule"]')) === 1)

  /* ---------- C. 来电提醒弹层 ---------- */
  await page.locator('[data-dnd-row="calls"]').click()
  await page.waitForTimeout(400)
  check('C 来电提醒：弹层出现', (await textOf(page, '.picker-title')).trim() === '来电提醒')
  check('C 来电提醒：真机 4 个选项', (await visibleCount(page, '.picker-row')) === 4)
  await shot(page, '05_calls_picker')
  await page.locator('.picker-row', { hasText: '所有人' }).click()
  await page.waitForTimeout(400)
  const callsSub = await page.evaluate(() => {
    const row = document.querySelector('[data-dnd-row="calls"]')
    return row ? (row.querySelector('.dc-sub')?.textContent || '').trim() : ''
  })
  check('C 来电提醒：选中后主页副标题联动', callsSub === '所有人', callsSub)

  /* ---------- D. 应用提醒三级页 ---------- */
  await page.locator('[data-dnd-row="apps"]').click()
  await page.waitForTimeout(450)
  check('D 应用提醒：进入三级页', (await textOf(page, '.sub-shell .gn-title')).trim() === '应用提醒')
  check('D 应用提醒：真机应用清单 ≥20', (await visibleCount(page, '.sub-shell .list-cell')) >= 20)
  check('D 应用提醒：统一悬浮搜索框', (await visibleCount(page, '.sub-shell .settings-search-bar')) === 1)
  const appsSubBefore = await page.evaluate(() => {
    const row = document.querySelector('[data-dnd-row="apps"]')
    return row ? (row.querySelector('.dc-sub')?.textContent || '').trim() : ''
  })
  await shot(page, '06_apps')

  // 点整行切换开关
  const sw = page.locator('.sub-shell .toggle-switch').first()
  const swBefore = await sw.getAttribute('aria-checked')
  await page.locator('.sub-shell .list-cell').first().click()
  await page.waitForTimeout(220)
  const swAfter = await page.locator('.sub-shell .toggle-switch').first().getAttribute('aria-checked')
  check('D 应用提醒：点整行可切开关', swBefore !== swAfter, `${swBefore} → ${swAfter}`)

  // 搜索过滤
  await page.locator('.sub-shell .search-input').fill('微信')
  await page.waitForTimeout(250)
  check('D 应用提醒：搜索过滤生效', (await visibleCount(page, '.sub-shell .list-cell')) === 1)
  await page.locator('.sub-shell .search-input').fill('')
  await page.waitForTimeout(250)

  await page.locator('.sub-shell [data-nav-back]').first().click()
  await page.waitForTimeout(450)
  const appsSubAfter = await page.evaluate(() => {
    const row = document.querySelector('[data-dnd-row="apps"]')
    return row ? (row.querySelector('.dc-sub')?.textContent || '').trim() : ''
  })
  check('D 应用提醒：开关数联动主页副标题', appsSubAfter !== appsSubBefore, `${appsSubBefore} → ${appsSubAfter}`)
  await shot(page, '07_dnd_home_final')

  check('全程 0 控制台错误', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '))

  await browser.close()
  console.log(`\n[dnd] ${pass} PASS / ${fail} FAIL · 截图 ${OUT}`)
  if (failures.length) console.log('失败明细:\n  ' + failures.join('\n  '))
  process.exit(fail ? 1 : 0)
}

run().catch(e => {
  console.error('[dnd] 运行异常:', e)
  process.exit(1)
})
