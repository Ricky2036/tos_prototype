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

  head('2. 进入电话设置页面')
  const settingsBtn = page.locator('.header-action-btn.settings-trigger')
  assert('设置齿轮图标可见', await settingsBtn.isVisible())
  await settingsBtn.click()
  await page.waitForTimeout(400)

  const phoneSettings = page.locator('.phone-settings-page')
  assert('通话设置主页面可见', await phoneSettings.isVisible())
  await page.screenshot({ path: `${OUT}/settings-jump-01-phone-settings.png` })

  head('3. 测试 SIM 卡与网络设置跳转系统设置')
  const simRow = page.locator('.phone-settings-page [data-action="open-system-sim"]')
  assert('SIM 卡与网络设置入口可见', await simRow.isVisible())
  await simRow.click()
  await page.waitForTimeout(800)

  // 验证当前应用已切换为 settings
  const activeApp = await page.evaluate(() => window.__system?.activeAppId)
  assert('当前激活应用切换为 settings', activeApp === 'settings', activeApp)

  // 验证设置页面呈现 SIM 卡与网络设置子页
  const simPage = page.locator('.sim-scroll-body')
  assert('系统设置 SIM 卡与网络设置页面可见', await simPage.isVisible())
  await page.screenshot({ path: `${OUT}/settings-jump-02-system-sim.png` })

  // 点击系统设置 SIM 页导航栏返回
  const navBack = page.locator('.settings-app [data-nav-back]').first()
  assert('SIM 页返回按钮可见', await navBack.isVisible())
  await navBack.click()
  await page.waitForTimeout(500)

  // 验证返回至系统设置主页
  const settingsMain = page.locator('.settings-app .settings-scroll-container')
  assert('返回至系统设置主页', await settingsMain.isVisible())
  await page.screenshot({ path: `${OUT}/settings-jump-03-system-main.png` })

  head('4. 切回电话应用并测试 声音与振动 跳转系统设置')
  await page.evaluate(() => {
    if (window.__system?.openApp) {
      window.__system.openApp('phone')
    }
  })
  await page.waitForTimeout(800)

  const settingsBtnAgain = page.locator('.header-action-btn.settings-trigger')
  assert('重新进入电话设置：设置齿轮可见', await settingsBtnAgain.isVisible())
  await settingsBtnAgain.click()
  await page.waitForTimeout(400)

  assert('切回电话应用设置页面', await phoneSettings.isVisible())

  const soundRow = page.locator('.phone-settings-page [data-action="open-system-sound"]')
  assert('声音与振动入口可见', await soundRow.isVisible())
  await soundRow.click()
  await page.waitForTimeout(800)

  const activeAppAfterSound = await page.evaluate(() => window.__system?.activeAppId)
  assert('当前激活应用切换为 settings', activeAppAfterSound === 'settings', activeAppAfterSound)

  const soundPage = page.locator('.sound-scroll-body')
  assert('系统设置声音与振动页面可见', await soundPage.isVisible())
  await page.screenshot({ path: `${OUT}/settings-jump-04-system-sound.png` })

  // 点击系统设置声音页导航栏返回
  const soundNavBack = page.locator('.settings-app [data-nav-back]').first()
  assert('声音与振动页返回按钮可见', await soundNavBack.isVisible())
  await soundNavBack.click()
  await page.waitForTimeout(500)

  assert('再次返回至系统设置主页', await settingsMain.isVisible())
  await page.screenshot({ path: `${OUT}/settings-jump-05-system-main-after-sound.png` })

} catch (err) {
  fails.push(`Exception: ${err.message}`)
  console.error('Error during execution:', err)
} finally {
  await browser.close()
  head('测试结果摘要')
  console.log(`通过: ${pass}, 失败: ${fails.length}`)
  if (errors.length) {
    console.log(`页面控制台/脚本错误 (${errors.length}):`)
    errors.slice(0, 5).forEach((e) => console.log(`  ! ${e}`))
  }
  if (fails.length) {
    console.log('失败清单:')
    fails.forEach((f) => console.log(`  - ${f}`))
    process.exit(1)
  }
}
