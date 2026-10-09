/**
 * AI Mate 应用端到端验收（按归档 `tOS Prototype_aimate_fan.html` 重放后的流程）
 * ---------------------------------------------------------------------------
 * 覆盖归档的七个页面与三个浮层：
 *   home 首页 → add 添加设备 → guide 选型号+配对步骤 → search 搜索设备 →
 *   center 连接中/成功 → control 设备控制（档位/模式/摇头/定时/等离子/童锁）→
 *   info 设备详情（重命名/删除）+ 定时浮层 + 重命名弹窗 + 删除确认。
 *
 * 判据全部读 DOM / 屏上像素，不 import store 内部状态 —— 与仓库既有 e2e 一致。
 * 用法：node scripts/verify-aimate-flow.mjs [port]   默认 5555
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const PORT = process.argv[2] || '5555'
const BASE = process.env.AIMATE_BASE || `http://127.0.0.1:${PORT}`
const OUT = '/tmp/aimate/e2e'
const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
fs.mkdirSync(OUT, { recursive: true })

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}
const shot = (page, name) => page.screenshot({ path: path.join(OUT, name + '.png') })
const txtOf = async (loc) => ((await loc.textContent()) || '').trim()

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 })
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

  await page.addInitScript(() => { try { localStorage.clear() } catch {} })
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    const s = window.__system
    if (s) { try { s.unlock() } catch {} ; try { s.goHome() } catch {} }
  })
  await page.waitForTimeout(1200)

  /* ---------- 0. 进应用 ---------- */
  await page.evaluate(() => window.__system.openApp('aimate'))
  await page.waitForTimeout(1400)
  const appId = await page.evaluate(() => window.__system.activeAppId)
  check('打开 AI Mate', appId === 'aimate', String(appId))
  await shot(page, '10-home')

  /* ---------- 1. 首页（首页 Tab） ---------- */
  const summary = await txtOf(page.locator('[data-device-summary]'))
  check('首页设备统计（4 台 · 全部在线）', /4\s*台设备/.test(summary) && /4\s*台在线/.test(summary), summary)

  const cards = await page.locator('[data-device-card]').count()
  check('首页设备卡 = 四份归档的并集（4 张）', cards === 4, `${cards} 张`)
  const initialCards = cards
  const ids = ['DAEWOO-Fan-A1', 'AM-Printer-01', 'AM-Recorder-01', 'AM-Mori-01']
  let unionOk = true
  for (const id of ids) unionOk = unionOk && (await page.locator(`[data-device-card="${id}"]`).count()) === 1
  check('并集四台齐全：风扇 / 口袋打印机 / 录音充电宝 / AI Mori', unionOk)

  const names = await page.locator('.mcard .mc-name').allTextContents()
  check(
    '「添加设备」目录里的通用品类不得预置进「我的设备」',
    !names.some((t) => /灯泡|插座|门锁|红外|耳机|手表|眼镜/.test(t.trim())),
    names.map((t) => t.trim()).join(' / ')
  )

  const printerMeta = await txtOf(page.locator('[data-device-meta="AM-Printer-01"]'))
  check('打印机卡副行含相纸余量与电量', /相纸/.test(printerMeta) && /电量/.test(printerMeta), printerMeta)
  const gearTxt = await txtOf(page.locator('[data-gear-value="DAEWOO-Fan-A1"]'))
  check('风扇卡内联档位与 12 档同源', /3\s*\/\s*12/.test(gearTxt), gearTxt)

  const others = await page.locator('[data-other]').count()
  check('「其他设备」3 台（两份 Demo 并集）', others === 3, `${others} 台`)
  const glassStatus = await txtOf(page.locator('[data-other="AI-Glass"] .or-status'))
  check('其他设备里眼镜是未连接（归档如此）', glassStatus.trim() === '未连接', glassStatus)
  check('有「添加新设备」行', (await page.locator('[data-add-new]').count()) === 1)
  check('添加入口唯一（避免 strict mode 撞车）', (await page.locator('[data-add-entry]').count()) === 1)

  /* ---------- 1b. 底部 Tab（首页 / 我的） ---------- */
  check('底部 Tab 已挂载（本仓惯例组件）', (await page.locator('.floating-tab-bar').count()) === 1)
  const tabLabels = (await page.locator('.floating-tab-bar .tab-label-text').allTextContents()).map((t) => t.trim())
  check('底部 Tab 两项：首页 / 我的', JSON.stringify(tabLabels) === JSON.stringify(['首页', '我的']), JSON.stringify(tabLabels))

  /* 悬浮导航几何：必须与本仓标准控件默认值一致（对齐时钟页 ClockApp） */
  const barGeo = await page.evaluate(() => {
    const bar = document.querySelector('.floating-tab-bar')
    const sr = document.querySelector('.screen-view').getBoundingClientRect()
    const br = bar.getBoundingClientRect()
    const cs = getComputedStyle(bar)
    return { cssHeight: cs.height, cssBottom: cs.bottom, 距屏底: +(sr.bottom - br.bottom).toFixed(1) }
  })
  check(
    '悬浮导航尺寸走标准控件（高 62px / 贴底 22px）',
    barGeo.cssHeight === '62px' && barGeo.cssBottom === '22px',
    JSON.stringify(barGeo)
  )
  check(
    '悬浮导航实测距屏底 22px（不再被 home-indicator 顶高 34px）',
    Math.abs(barGeo.距屏底 - 22) < 1,
    `${barGeo.距屏底}px`
  )

  /* 底部渐隐遮罩：三个锚点必须与上面的底栏几何自洽 */
  const fadeOf = (sel) => page.evaluate((s) => {
    const el = document.querySelector(s)
    const cs = getComputedStyle(el)
    const v = cs.maskImage && cs.maskImage !== 'none' ? cs.maskImage : cs.webkitMaskImage || ''
    return String(v).replace(/\s+/g, '')
  }, sel)
  const fade = await fadeOf('.home-scroll')
  const barBottom = parseFloat(barGeo.cssBottom)
  const barTop = barBottom + parseFloat(barGeo.cssHeight)
  check(
    '首页滚动容器有底部渐隐遮罩，且锚点与底栏几何自洽',
    fade.includes(`calc(100%-${barTop + 8}px)`) &&
      fade.includes(`calc(100%-${barBottom}px)`) &&
      fade.includes('calc(100%-55px)'),
    fade.slice(0, 110)
  )
  const mineFade = await fadeOf('.mine-scroll')
  check('「我的」页滚动容器同样有底部渐隐遮罩', /linear-gradient/.test(mineFade), mineFade.slice(0, 80))
  await page.locator('[data-go-mine]').click()
  await page.waitForTimeout(700)
  const mineRows = await page.locator('[data-mine-row]').count()
  check('「我的」页 6 个设置入口（两份 Demo 并集去重）', mineRows === 6, `${mineRows} 个`)
  const mineHero = (await txtOf(page.locator('.mine-hero'))).replace(/\s+/g, ' ')
  check('「我的」头像卡带已连接台数', /已连接\s*4\s*台设备/.test(mineHero), mineHero)
  await shot(page, '10b-mine')
  await page.locator('.floating-tab-bar .floating-tab-item').first().click()
  await page.waitForTimeout(700)
  check('底部 Tab 可切回首页', (await page.locator('[data-device-card]').count()) === 4)

  /* 首页开关：关→开（1200ms 回执后翻转） */
  const sw = page.locator('[data-device-switch="DAEWOO-Fan-A1"]')
  await sw.click()
  await page.waitForTimeout(300)
  check('开关按下后进入 pending', (await sw.getAttribute('class')).includes('pending'))
  await page.waitForTimeout(1500)
  check('回执后开关变为开', (await sw.getAttribute('class')).includes('on'))
  await sw.click()
  await page.waitForTimeout(1600)

  /* ---------- 2. 添加设备 ---------- */
  await page.locator('[data-add-entry]').click()
  await page.waitForTimeout(700)
  await shot(page, '11-add')
  const addTitle = await txtOf(page.locator('.nav-title'))
  check('添加设备页标题', addTitle === '添加设备', addTitle)
  check('雷达扫描卡存在', (await page.locator('.scan-radar-track').count()) === 1)
  const scanTxt = await txtOf(page.locator('.scan-card'))
  check('扫描卡文案', scanTxt.includes('设备搜索中') && scanTxt.includes('请开启设备蓝牙并靠近手机'), scanTxt.replace(/\n/g, ' / '))
  const cats = await page.locator('[data-category]').count()
  check('手动添加类别数（归档 8 类 + 集成 3 台 = 11）', cats === 11, `${cats} 类`)
  const catStyles = await page.locator('[data-category="fan"]').getAttribute('style')
  check('类别瓦片用归档配色', /220,\s*252,\s*231/.test(catStyles) && /22,\s*163,\s*74/.test(catStyles), catStyles)

  /* ---------- 3. 选型号 + 配对步骤 ---------- */
  await page.locator('[data-category="fan"]').click()
  await page.waitForTimeout(700)
  await shot(page, '12-guide')
  const guideTitle = await txtOf(page.locator('.nav-title'))
  check('配对页标题带类别名', guideTitle === '添加风扇', guideTitle)
  const models = await page.locator('[data-model]').count()
  check('可选型号 2 个（归档实测）', models === 2, `${models} 个`)
  const m0 = await txtOf(page.locator('[data-model="DAEWOO-Fan-A1"]'))
  check('型号卡含归档副标题', m0.includes('DAEWOO-Fan-A1') && m0.includes('无叶风扇 · 蓝牙'), m0.replace(/\n/g, ' / '))
  const steps = await page.locator('.step').count()
  check('配对步骤 3 步', steps === 3, `${steps} 步`)
  check('默认选中第一个型号', (await page.locator('[data-model="DAEWOO-Fan-A1"]').getAttribute('class')).includes('active'))
  await page.locator('[data-model="DAEWOO-Fan-A2"]').click()
  await page.waitForTimeout(300)
  check('可切换型号', (await page.locator('[data-model="DAEWOO-Fan-A2"]').getAttribute('class')).includes('active'))
  await page.locator('[data-model="DAEWOO-Fan-A1"]').click()
  await page.waitForTimeout(300)

  /* ---------- 4. 搜索设备 ---------- */
  await page.locator('[data-start-connect]').click()
  await page.waitForTimeout(400)
  await shot(page, '13-search')
  const searchTitle = await txtOf(page.locator('.nav-title'))
  check('搜索页标题', searchTitle === '搜索设备', searchTitle)
  check('搜索中显示菊花', (await page.locator('.scan-ring').count()) === 1)
  await page.waitForSelector('[data-found]', { timeout: 6000 })
  await shot(page, '14-found')
  const foundTxt = await txtOf(page.locator('[data-found="DAEWOO-Fan-A1"]'))
  check('搜到归档设备', foundTxt.includes('DAEWOO-Fan-A1') && foundTxt.includes('蓝牙信号强'), foundTxt.replace(/\n/g, ' / '))

  /* ---------- 5. 连接中 → 成功 ---------- */
  await page.locator('[data-found="DAEWOO-Fan-A1"]').click()
  await page.waitForTimeout(500)
  await shot(page, '15-connecting')
  const c1 = await txtOf(page.locator('.center-page'))
  check('连接中文案', c1.includes('正在连接…') && c1.includes('DAEWOO-Fan-A1'), c1.replace(/\n/g, ' / '))
  await page.waitForSelector('[data-enter-device]', { timeout: 6000 })
  await shot(page, '16-success')
  const c2 = await txtOf(page.locator('.center-page'))
  check('连接成功文案', c2.includes('连接成功') && c2.includes('你可在首页管理该设备'), c2.replace(/\n/g, ' / '))

  /* ---------- 6. 设备控制页 ---------- */
  await page.locator('[data-enter-device]').click()
  await page.waitForTimeout(900)
  await shot(page, '17-control')

  // 刚配好的设备必须真的进目录：回首页读一次读数（详情页没有设备卡，事后补不了）
  await page.locator('[data-nav-back]').click()
  await page.waitForTimeout(700)
  const afterPair = await page.locator('[data-device-card]').count()
  check('配完首页真的多了一台', afterPair === initialCards + 1, `${initialCards} → ${afterPair}`)
  check(
    '新设备卡出现在首页',
    (await page.locator('[data-device-card="FOUND-DAEWOO-Fan-A1"]').count()) === 1
  )
  await page.locator('[data-device-card="FOUND-DAEWOO-Fan-A1"]').click()
  await page.waitForTimeout(800)

  const ctrlTitle = await txtOf(page.locator('.nav-title'))
  // 归档里配对得到的型号在目录中唯一，标题就是型号码；
  // 本仓目录预置了同型号，第 2 台按约定带台号 ⇒ 契约是「标题 == 该设备显示名」，
  // 形状仍严格限定为「码」或「码 (n)」，不是随便放行。
  check('控制页标题为设备显示名', /^DAEWOO-Fan-A1( \(\d+\))?$/.test(ctrlTitle), ctrlTitle)
  check('状态胶囊「已连接」', (await txtOf(page.locator('.product-status'))) === '已连接')
  check('电源大按钮存在', (await page.locator('[data-power-btn]').count()) === 1)
  check('初始为已关机', (await txtOf(page.locator('[data-mode-display]'))) === '已关机')

  const dots = await page.locator('[data-speed-dot]').count()
  check('控制页 12 档点阵', dots === 12, `${dots} 个`)
  await page.locator('[data-speed-dot="7"]').click()
  await page.waitForTimeout(400)
  const label7 = await txtOf(page.locator('[data-speed-label]'))
  check('点第 7 档 → 文案 7 / 12', /7\s*\/\s*12/.test(label7), label7)
  const fillW = await page.locator('.speed-fill').getAttribute('style')
  check('进度条与档位同源', /58\.3/.test(fillW), fillW)

  const chips = await page.locator('.mode-chip').count()
  check('模式 6 档', chips === 6, `${chips} 档`)
  await page.locator('[data-mode="2"]').click()
  await page.waitForTimeout(400)
  check('模式可切换', (await page.locator('[data-mode="2"]').getAttribute('class')).includes('active'))
  const modeTxt = await txtOf(page.locator('[data-mode-display]'))
  check('大标题跟随模式', modeTxt === '自然风', modeTxt)

  /* 摇头：需在开机态下才可切换 → 出现 3 个角度 chip */
  // ⚠️ 选档的动作本身会连带把电源打开（store 的归档语义），所以这里电源已是开态
  const powerOn = async () => (await page.locator('[data-power-btn]').getAttribute('class')).includes('on')
  check('选档后电源已连带打开', await powerOn())
  check('摇头角度 chip 默认不显示', (await page.locator('.angle-chip').count()) === 0)
  await page.locator('[data-swing-switch]').click()
  await page.waitForTimeout(500)
  const angles = await page.locator('.angle-chip').count()
  check('开摇头后出现 3 档角度', angles === 3, `${angles} 档`)
  await page.locator('[data-angle="60"]').click()
  await page.waitForTimeout(300)
  check('可选摇头角度', (await page.locator('[data-angle="60"]').getAttribute('class')).includes('active'))
  await shot(page, '18-control-bottom')

  /* 电源：关 → 开（每次 1200ms 回执） */
  await page.locator('[data-power-btn]').click()
  await page.waitForTimeout(300)
  check('关机期间按钮呈 pending', (await page.locator('[data-power-btn]').getAttribute('class')).includes('pending'))
  await page.waitForTimeout(1400)
  check('电源可关闭', !(await powerOn()))
  check('关机后大标题显示已关机', (await txtOf(page.locator('[data-mode-display]'))) === '已关机')
  const swingDisabled = await page.locator('.swing-card').getAttribute('class')
  check('关机后摇头卡灰掉', swingDisabled.includes('disabled'), swingDisabled)
  await page.locator('[data-power-btn]').click()
  await page.waitForTimeout(1700)
  check('电源可再次打开', await powerOn())

  /* ---------- 7. 定时浮层 ---------- */
  await page.locator('[data-timer="timerOff"]').click()
  await page.waitForTimeout(700)
  await shot(page, '19-timer')
  check('定时浮层出现', (await page.locator('[data-timer-overlay]').count()) === 1)
  check('初始 0 小时', (await txtOf(page.locator('[data-timer-value]'))).startsWith('0'))
  await page.locator('[data-timer-plus]').click()
  await page.waitForTimeout(300)
  check('+1 → 1 小时', (await txtOf(page.locator('[data-timer-value]'))).startsWith('1'))
  await page.locator('[data-timer-minus]').click()
  await page.waitForTimeout(300)
  check('−1 → 回到 0', (await txtOf(page.locator('[data-timer-value]'))).startsWith('0'))
  await page.locator('[data-timer-plus]').click()
  await page.locator('[data-timer-ok]').click()
  await page.waitForTimeout(700)
  check('浮层已关闭', (await page.locator('[data-timer-overlay]').count()) === 0)
  const timerTxt = await txtOf(page.locator('[data-timer="timerOff"]'))
  check('控制页回显定时值', timerTxt.includes('1 小时'), timerTxt.replace(/\n/g, ' / '))

  /* ---------- 8. 设备详情 / 重命名 / 删除 ---------- */
  await page.locator('[data-nav-more]').click()
  await page.waitForTimeout(700)
  await shot(page, '20-info')
  check('详情页标题', (await txtOf(page.locator('.nav-title'))) === '设备详情')
  const mac = await txtOf(page.locator('[data-info-mac]'))
  check('显示 MAC 地址', /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac), mac)
  check('显示固件版本', (await txtOf(page.locator('[data-info-fw]'))).length > 0)
  check('有重命名行', (await page.locator('[data-rename]').count()) === 1)
  check('有删除设备行', (await page.locator('[data-remove]').count()) === 1)

  await page.locator('[data-rename]').click()
  await page.waitForTimeout(600)
  await shot(page, '21-rename')
  check('重命名弹窗出现', (await page.locator('[data-rename-overlay]').count()) === 1)
  await page.locator('[data-rename-input]').fill('客厅风扇')
  await page.locator('[data-rename-save]').click()
  await page.waitForTimeout(600)
  check('弹窗已关闭', (await page.locator('[data-rename-overlay]').count()) === 0)
  check('详情页名称已更新', (await txtOf(page.locator('.device-info-name'))) === '客厅风扇')

  await page.locator('[data-remove]').click()
  await page.waitForTimeout(600)
  await shot(page, '22-delete')
  check('删除确认弹窗出现', (await page.locator('[data-delete-overlay]').count()) === 1)
  // ⚠️ 详情页上没有 [data-device-card]，基线必须用首页那一刻的读数
  await page.locator('[data-delete-ok]').click()
  await page.waitForTimeout(900)
  check('删除后回到首页', (await page.locator('[data-add-entry]').count()) === 1)
  const after = await page.locator('[data-device-card]').count()
  // ⚠️ 基线与 `afterPair` 同源（都是首页读数），不能用添加流程之前的 `initialCards`
  check('设备已移除', after === afterPair - 1, `${afterPair} → ${after}`)

  /* ---------- 9. 空状态（删光后） ---------- */
  const remaining = await page.locator('[data-device-card]').count()
  check('仍有其它设备', remaining > 0, `剩 ${remaining} 台`)

  /* ---------- 10. 三台集成设备：卡片直达功能页（不经控制页） ---------- */
  await page.locator('[data-device-card="AM-Printer-01"]').click()
  await page.waitForTimeout(900)
  check('打印机卡直达打印流', (await page.locator('.pf').count()) === 1)
  check('没有经过控制页（无电源大按钮）', (await page.locator('[data-power-btn]').count()) === 0)
  const srcCards = await page.locator('.pf-source').count()
  check('打印流来源卡 3 张', srcCards === 3, `${srcCards} 张`)
  await shot(page, '23-printer-direct')
  await page.locator('.pf-head [data-nav-back], .pf-head button').first().click()
  await page.waitForTimeout(800)
  check('打印流关闭后回到首页', (await page.locator('[data-device-card]').count()) === 4)

  await page.locator('[data-device-card="AM-Recorder-01"]').click()
  await page.waitForTimeout(900)
  check('录音充电宝卡直达录音流', (await page.locator('[data-flow-root="recorder"]').count()) === 1)
  check('录音流里也没有中间页', (await page.locator('[data-power-btn]').count()) === 0)
  await shot(page, '24-recorder-direct')
  await page.locator('[data-flow-root="recorder"] [data-nav-back]').first().click()
  await page.waitForTimeout(800)

  await page.locator('[data-device-card="AM-Mori-01"]').click()
  await page.waitForTimeout(900)
  check('AI Mori 卡直达 Mori 流', (await page.locator('[data-flow-root="mori"]').count()) === 1)
  check('Mori 流里也没有中间页', (await page.locator('[data-power-btn]').count()) === 0)
  await shot(page, '25-mori-direct')
  await page.locator('[data-flow-root="mori"] [data-nav-back]').first().click()
  await page.waitForTimeout(800)
  check('Mori 流关闭后回到首页', (await page.locator('[data-device-card]').count()) === 4)

  /* ---------- 10b. 卡片 `···` 进设备详情，返回回首页 ---------- */
  await page.locator('[data-device-more="AM-Printer-01"]').click()
  await page.waitForTimeout(700)
  check('卡片 `···` 进设备详情', (await page.locator('[data-info-mac]').count()) === 1)
  await shot(page, '26-info-from-home')
  await page.locator('[data-nav-back]').click()
  await page.waitForTimeout(700)
  check('从首页进的详情，返回回首页', (await page.locator('[data-device-card]').count()) === 4)

  /* ---------- 10c. 其他设备行给 toast ---------- */
  await page.locator('[data-other="AI-Buds-Pro"]').click()
  await page.waitForTimeout(600)
  const otherToast = await txtOf(page.locator('[data-toast]'))
  check('其他设备给状态 toast', otherToast.includes('智能耳机') && otherToast.includes('64%'), otherToast)
  await page.waitForTimeout(2200)

  /* ---------- 11. 返回链路 ---------- */
  await page.evaluate(() => window.__system.goHome())
  await page.waitForTimeout(900)
  check('回桌面', (await page.evaluate(() => window.__system.activeAppId)) === null)

  check('运行期间无控制台报错', errors.length === 0, errors.slice(0, 3).join(' | '))

  const pass = results.filter((r) => r.ok).length
  console.log(`\n=== AI Mate e2e（归档重放版）: ${pass}/${results.length} PASS ===`)
  console.log('截图目录：' + OUT)
  await browser.close()
  if (pass !== results.length) process.exit(1)
}

run().catch((e) => { console.error('RUN FAILED:', e); process.exit(1) })
