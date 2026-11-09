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

  head('2. 拨号盘无小横条手柄且支持滑动顺滑收起过渡')
  assert('对齐真机规范：拨号盘顶部无小横条手柄', !(await page.locator('.drag-pill, .keypad-drag-bar').isVisible()))

  // 测试轻滑列表收起拨号盘
  const scroller = page.locator('.phone-scroll-viewport')
  await page.evaluate(() => {
    const s = document.querySelector('.phone-scroll-viewport')
    s.scrollTop = 40
    s.dispatchEvent(new Event('scroll'))
  })
  await page.waitForTimeout(400)
  assert('列表滑动后拨号盘顺滑收起', !(await page.locator('.keypad-drawer-wrap').isVisible()))

  head('3. 通话记录列表跟手侧滑交互与防止误拨号')
  const firstCell = page.locator('.recent-swipe-cell').first()
  const firstRowContent = firstCell.locator('.recent-row-content')
  assert('首条通话记录行可见', await firstRowContent.isVisible())

  // 获取首行坐标进行跟手拖拽模拟（取行中央偏右区域，避开右侧详情按钮与左侧图标）
  const rowBox = await firstRowContent.boundingBox()
  assert('拿到通话记录行几何位置', !!rowBox)

  const startX = rowBox.x + rowBox.width / 2
  const startY = rowBox.y + rowBox.height / 2

  // 1) 模拟 PointerDown
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.waitForTimeout(50)

  // 2) 模拟向左拖拽 70px (触发跟手拖拽)
  await page.mouse.move(startX - 70, startY, { steps: 5 })
  await page.waitForTimeout(50)

  const midOffset = await firstRowContent.evaluate((el) => {
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+),/)
    return m ? parseFloat(m[1]) : 0
  })
  assert('跟手滑动过程中位移实时响应 (< -20px)', midOffset < -20, midOffset)

  // 3) 继续拖拽至 -100px 并释放
  await page.mouse.move(startX - 100, startY, { steps: 3 })
  await page.mouse.up()
  await page.waitForTimeout(350)

  // 4) 验证吸附至 -136px
  const finalOffset = await firstRowContent.evaluate((el) => {
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+),/)
    return m ? parseFloat(m[1]) : 0
  })
  assert('松手后平滑吸附到操作栏宽度 (-136px)', Math.abs(finalOffset - (-136)) < 5, finalOffset)

  // 5) 严禁误触发拨号
  const isCalling = await page.evaluate(() => {
    const p = window.usePhoneStore ? window.usePhoneStore() : null
    return !!p?.activeCall
  })
  assert('滑动后松手绝不触发误拨号', !isCalling)

  // 6) 验证呼叫与删除操作按钮处于激活态
  const swipeActions = firstCell.locator('.swipe-actions-bg')
  assert('呼叫与删除底板激活可见', await swipeActions.isVisible())
  await page.screenshot({ path: `${OUT}/01-follow-finger-swiped.png` })

  // 7) 点击处于滑开状态的行：只收起菜单，绝不拨号
  await firstRowContent.click()
  await page.waitForTimeout(350)
  const isCallingAfterClick = await page.evaluate(() => {
    const p = window.usePhoneStore ? window.usePhoneStore() : null
    return !!p?.activeCall
  })
  assert('点击滑开状态的行不触发拨号', !isCallingAfterClick)
  const closedOffset = await firstRowContent.evaluate((el) => {
    const t = getComputedStyle(el).transform
    if (!t || t === 'none') return 0
    const m = t.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([^,]+),/)
    return m ? parseFloat(m[1]) : 0
  })
  assert('点击滑开状态行后顺利归位收起 (offset ≈ 0)', Math.abs(closedOffset) < 5, closedOffset)

  head('4. 进入电话设置页面')
  const settingsBtn = page.locator('.header-action-btn.settings-trigger')
  assert('设置齿轮图标可见', await settingsBtn.isVisible())
  await settingsBtn.click()
  await page.waitForTimeout(400)

  const phoneSettings = page.locator('.phone-settings-page')
  assert('通话设置主页面可见', await phoneSettings.isVisible())

  head('5. 测试 SIM 卡与网络设置：复用二级菜单加载动画')
  const simRow = page.locator('.phone-settings-page [data-action="open-system-sim"]')
  assert('SIM 卡与网络设置入口可见', await simRow.isVisible())
  await simRow.click()
  await page.waitForTimeout(400)

  // 验证在当前窗口中以二级子页滑入呈现，不使用系统应用启动动画
  const simSubpage = page.locator('.phone-settings-page .subpage-view-pane .sim-scroll-body')
  assert('SIM 卡与网络设置以二级子页流畅挂载呈现', await simSubpage.isVisible())
  await page.screenshot({ path: `${OUT}/02-settings-sim-subpage.png` })

  // 点击子页导航栏返回
  const simNavBack = page.locator('.phone-settings-page .subpage-view-pane [data-nav-back]').first()
  assert('SIM 页返回按钮可见', await simNavBack.isVisible())
  await simNavBack.click()
  await page.waitForTimeout(400)

  assert('平滑返回至通话设置主列表', await page.locator('.settings-main-view').isVisible())

  head('6. 测试 声音与振动：复用二级菜单加载动画')
  const soundRow = page.locator('.phone-settings-page [data-action="open-system-sound"]')
  assert('声音与振动入口可见', await soundRow.isVisible())
  await soundRow.click()
  await page.waitForTimeout(400)

  const soundSubpage = page.locator('.phone-settings-page .subpage-view-pane .sound-scroll-body')
  assert('声音与振动以二级子页流畅挂载呈现', await soundSubpage.isVisible())
  await page.screenshot({ path: `${OUT}/03-settings-sound-subpage.png` })

  // 点击子页导航栏返回
  const soundNavBack = page.locator('.phone-settings-page .subpage-view-pane [data-nav-back]').first()
  assert('声音与振动页返回按钮可见', await soundNavBack.isVisible())
  await soundNavBack.click()
  await page.waitForTimeout(400)

  assert('再次平滑返回至通话设置主列表', await page.locator('.settings-main-view').isVisible())

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
