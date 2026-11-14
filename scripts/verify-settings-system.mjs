#!/usr/bin/env node
import fs from 'node:fs'
import { chromium } from 'playwright'

const OUT = process.env.ARTIFACT_DIR || '.local-evidence/SET-SYS-01/web'
const PORT = process.argv[2] || '1111'
const BASE = `http://127.0.0.1:${PORT}/`
const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

let pass = 0
let fail = 0
const failures = []
const consoleErrors = []

function check(name, ok, detail = '') {
  if (ok) {
    pass += 1
    console.log(`PASS [settings-system] ${name}`)
  } else {
    fail += 1
    failures.push(`${name}${detail ? ' — ' + detail : ''}`)
    console.log(`FAIL [settings-system] ${name}${detail ? ' — ' + detail : ''}`)
  }
}

async function shot(page, name) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

async function visibleCount(page, selector) {
  const loc = page.locator(selector)
  const count = await loc.count()
  let visible = 0
  for (let i = 0; i < count; i++) {
    if (await loc.nth(i).isVisible()) visible++
  }
  return visible
}

async function backFromSub(page) {
  const btn = page.locator('.sub-shell [data-nav-back], .settings-datetime-page [data-nav-back], .settings-system-page [data-nav-back]').first()
  await btn.click({ timeout: 5000 })
  await page.waitForTimeout(400)
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

  // 验证设置首页打开
  const settingsAppVisible = (await visibleCount(page, '.settings-app')) === 1
  check('设置应用已打开', settingsAppVisible)

  // 滚到底部并点击「系统」
  const systemEntry = page.locator('.settings-scroll-container .list-cell', { hasText: '系统' }).last()
  await systemEntry.scrollIntoViewIfNeeded()
  await systemEntry.click({ timeout: 5000 })
  await page.waitForTimeout(500)

  // 验证系统主页
  check('系统主页已呈现', (await visibleCount(page, '.settings-system-page')) === 1)
  check('系统主页卡片数为 4', (await visibleCount(page, '.settings-system-page .system-card')) === 4)
  check('系统主页行数为 10', (await visibleCount(page, '.settings-system-page .list-cell')) === 10)
  check('系统主页包含分组头「备份、重置与恢复」', (await page.locator('.group-header').textContent()) === '备份、重置与恢复')
  await shot(page, '01_system_home')

  // 1. 系统导航
  await page.locator('[data-system-row="systemNavigation"]').click()
  await page.waitForTimeout(400)
  check('进入系统导航', (await visibleCount(page, '[data-test="subpage-nav"]')) === 1)
  await shot(page, '02_system_navigation')
  await backFromSub(page)
  check('系统导航返回主页', (await visibleCount(page, '.system-main')) === 1)

  // 2. 语言与输入法
  await page.locator('[data-system-row="languageInput"]').click()
  await page.waitForTimeout(400)
  check('进入语言与输入法', (await visibleCount(page, '.sub-shell .gn-title:has-text("语言与输入法")')) === 1)
  await shot(page, '03_system_language')
  await backFromSub(page)
  check('语言输入法返回主页', (await visibleCount(page, '.system-main')) === 1)

  // 3. 日期与时间
  await page.locator('[data-system-row="dateTime"]').click()
  await page.waitForTimeout(400)
  check('进入日期与时间', (await visibleCount(page, '.settings-datetime-page')) === 1)
  await shot(page, '04_datetime_home')

  // 测试自动设置时区开关与时区选择器
  const autoTzToggle = page.locator('[data-dt-row="autoTimezone"] button.toggle-switch').first()
  if (await autoTzToggle.count() > 0) {
    await autoTzToggle.click()
    await page.waitForTimeout(300)
  }

  // 此时「选择时区」行可点击进入
  const tzRow = page.locator('[data-dt-row="timezone"]').first()
  if (await tzRow.count() > 0) {
    await tzRow.click()
    await page.waitForTimeout(400)
    check('进入选择时区页', (await visibleCount(page, '.sub-shell .gn-title:has-text("选择时区")')) === 1)
    await shot(page, '04_datetime_timezone')
    // 点击北京
    const bjItem = page.locator('[data-tz-row="北京"]').first()
    if (await bjItem.count() > 0) {
      await bjItem.click()
      await page.waitForTimeout(400)
      check('点击城市后写回并返回日期时间主页', (await visibleCount(page, '.settings-datetime-page')) === 1)
    } else {
      await backFromSub(page)
    }
  }

  // 测试弹窗选择器：常驻地选择
  const resRow = page.locator('[data-dt-row="residence"]').first()
  if (await resRow.count() > 0) {
    await resRow.click()
    await page.waitForTimeout(300)
    check('常驻地选择弹窗已弹出', (await visibleCount(page, '.dt-modal-card')) === 1)
    await shot(page, '04_datetime_residence_modal')
    // 点击关闭
    await page.locator('button.modal-btn-close').first().click()
    await page.waitForTimeout(300)
  }

  // 返回系统主页
  await backFromSub(page)
  check('日期时间返回系统主页', (await visibleCount(page, '.system-main')) === 1)

  // 4. 按住电源按钮
  await page.locator('[data-system-row="powerButton"]').click()
  await page.waitForTimeout(400)
  check('进入按住电源按钮', (await visibleCount(page, '[data-test="subpage-power"]')) === 1)
  await shot(page, '05_system_power_button')
  await backFromSub(page)
  check('电源按钮返回主页', (await visibleCount(page, '.system-main')) === 1)

  // 5. 定时开关机与重启
  await page.locator('[data-system-row="schedulePower"]').click()
  await page.waitForTimeout(400)
  check('进入定时开关机与重启', (await visibleCount(page, '.sub-shell .gn-title:has-text("定时开关机与重启")')) === 1)
  await shot(page, '06_system_schedule_power')
  await backFromSub(page)
  check('定时开关机返回主页', (await visibleCount(page, '.system-main')) === 1)

  // 6. 备份到Google云端硬盘
  await page.locator('[data-system-row="googleBackup"]').click()
  await page.waitForTimeout(400)
  check('进入备份到Google云端硬盘', (await visibleCount(page, '.sub-shell .gn-title:has-text("备份到Google云端硬盘")')) === 1)
  await shot(page, '07_system_google_backup')
  await backFromSub(page)
  check('Google备份返回主页', (await visibleCount(page, '.system-main')) === 1)

  // 7. USB 备份和恢复
  await page.locator('[data-system-row="usbBackup"]').click()
  await page.waitForTimeout(400)
  check('进入 USB 备份和恢复', (await visibleCount(page, '.sub-shell .gn-title:has-text("USB 备份和恢复")')) === 1)
  await shot(page, '08_system_usb_backup')
  await backFromSub(page)
  check('USB备份返回主页', (await visibleCount(page, '.system-main')) === 1)

  // 8. 重置手机
  await page.locator('[data-system-row="resetPhone"]').click()
  await page.waitForTimeout(400)
  check('进入重置手机', (await visibleCount(page, '[data-test="subpage-reset"]')) === 1)
  await shot(page, '09_system_reset_phone')
  await backFromSub(page)
  check('重置手机返回主页', (await visibleCount(page, '.system-main')) === 1)

  // 9. 开发者选项
  await page.locator('[data-system-row="developerOptions"]').click()
  await page.waitForTimeout(400)
  check('进入开发者选项', (await visibleCount(page, '[data-test="subpage-dev"]')) === 1)
  await shot(page, '10_system_developer_options')
  await backFromSub(page)
  check('开发者选项返回主页', (await visibleCount(page, '.system-main')) === 1)

  // 10. 增强服务
  await page.locator('[data-system-row="enhancedServices"]').click()
  await page.waitForTimeout(400)
  check('进入增强服务', (await visibleCount(page, '.sub-shell .gn-title:has-text("增强服务")')) === 1)
  await shot(page, '11_system_enhanced_services')
  await backFromSub(page)
  check('增强服务返回主页', (await visibleCount(page, '.system-main')) === 1)

  // 从系统主页返回设置首页
  await backFromSub(page)
  check('从系统主页返回到设置首页', (await visibleCount(page, '.settings-scroll-container')) === 1)
  await shot(page, '12_back_to_settings_home')

  await browser.close()

  console.log(`\n========================================`)
  console.log(`PASS: ${pass}  FAIL: ${fail}`)
  if (failures.length > 0) {
    console.log(`Failures:`)
    for (const f of failures) console.log(`  - ${f}`)
  }
  if (consoleErrors.length > 0) {
    console.log(`Console Errors:`)
    for (const e of consoleErrors) console.log(`  - ${e}`)
  }
  console.log(`========================================\n`)

  process.exit(fail === 0 ? 0 : 1)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
