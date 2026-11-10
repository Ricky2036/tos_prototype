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

async function wheelHighlight(page) {
  return page.evaluate(() => {
    const out = {}
    for (const col of ['hour', 'minute', 'period']) {
      const root = document.querySelector(`[data-wheel-col="${col}"]`)
      if (!root) continue
      out[col] = [...root.querySelectorAll('.tw-slot')].map(el => {
        const m = getComputedStyle(el).transform.match(
          /matrix\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/
        )
        return { scale: m ? Number(m[1]) : 0, ty: m ? Number(m[6]) : 999, text: el.textContent.trim() }
      }).filter(x => x.text)
    }
    return out
  })
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
  check('B 开始时间：标准弹层出现', (await textOf(page, '[data-tps-title]')).trim() === '开始时间')
  check('B 开始时间：三列滚轮可见', (await visibleCount(page, '[data-wheel-col]')) === 3)
  check('B 开始时间：真机当前值格式', (await textOf(page, '[data-tps-current]')).trim() === '10:00 下午')
  const panelBg = await page.evaluate(() => {
    const el = document.querySelector('.sheet-panel')
    return el ? getComputedStyle(el).backgroundColor : ''
  })
  check('B 时间弹层为浅色（礼拜/勿扰共用）', panelBg === 'rgb(255, 255, 255)', panelBg)
  await shot(page, '03_start_time')

  // 量测契约：行距 35px × 5 行 = 175px，整卡明显低于旧版
  const wheelH = await page.locator('[data-time-wheel]').evaluate(el => parseFloat(getComputedStyle(el).height))
  const panelH = await page.locator('.sheet-panel').evaluate(el => parseFloat(getComputedStyle(el).height))
  check('B 滚轮高度按真机量测 = 175px', Math.abs(wheelH - 175) < 1, String(wheelH))
  check('B 整张时间卡不再过高（≤330px）', panelH <= 330, String(panelH))

  // 点击相邻项 → 弹簧动画吸附到目标
  const beforeTime = (await textOf(page, '[data-tps-current]')).trim()
  await page.locator('[data-wheel-col="hour"] [data-offset="1"]').click()
  await page.waitForTimeout(650)
  const afterTime = (await textOf(page, '[data-tps-current]')).trim()
  check('B 开始时间：点相邻项吸附到目标值', beforeTime !== afterTime, `${beforeTime} → ${afterTime}`)

  // CDP 真机触摸：跟手位移 + 松手惯性继承 + 收敛
  const cdp = await ctx.newCDPSession(page)
  const colBox = await page.locator('[data-wheel-col="minute"]').boundingBox()
  const cx = colBox.x + colBox.width / 2
  const cy = colBox.y + colBox.height / 2
  const slotSel = '[data-wheel-col="minute"] [data-offset="0"]'
  const transformNow = () => page.locator(slotSel).evaluate(el => getComputedStyle(el).transform)
  const t0 = await transformNow()
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] })
  for (let i = 1; i <= 4; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx, y: cy - i * 25 }] })
    await page.waitForTimeout(25)
  }
  const t1 = await transformNow()
  check('B 跟手移动：拖拽中数字 transform 实时变化', t0 !== t1, `${t0} → ${t1}`)
  const during = await wheelHighlight(page)
  const duringHi = Object.values(during).map(list => list.filter(x => x.scale >= 0.95).length)
  check('B 不能同时高亮两个时间（拖拽中每列 ≤1 个高亮）', duringHi.every(n => n <= 1), JSON.stringify(duringHi))
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(90)
  const atRelease = (await textOf(page, '[data-tps-current]')).trim()
  await page.waitForTimeout(750)
  const settled = (await textOf(page, '[data-tps-current]')).trim()
  check('B 惯性继承：松手后数字继续滚动', atRelease !== settled, `${atRelease} → ${settled}`)
  const t2 = await transformNow()
  const dy = Number((t2.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,[^,]+,\s*([-\d.]+)\)/) || [])[1] ?? 999)
  check('B 动画收敛：最终停在整数行', Math.abs(dy) < 1, t2)
  const settledHi = await wheelHighlight(page)
  const centered = Object.values(settledHi).every(list => {
    const hi = list.filter(x => x.scale >= 0.95)
    return hi.length === 1 && Math.abs(hi[0].ty) < 1
  })
  check('B 松手后每列恰好 1 个高亮且处于中间', centered, JSON.stringify(settledHi))

  await page.locator('[data-tps-confirm]').click()
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
  check('D 应用提醒：桌面注册表全量应用 ≥30', (await visibleCount(page, '[data-registered-app-list] .list-cell')) >= 30)
  check('D 应用提醒：每行都有公共注册应用图标',
    (await visibleCount(page, '[data-registered-app-icon]')) === (await visibleCount(page, '[data-registered-app-list] .list-cell')))
  check('D 应用提醒：不再有首字色块假图标', (await visibleCount(page, '.is-fallback, .g3-app-icon')) === 0)
  check('D 应用提醒：统一悬浮搜索框', (await visibleCount(page, '.sub-shell .settings-search-bar')) === 1)
  const appsSubBefore = await page.evaluate(() => {
    const row = document.querySelector('[data-dnd-row="apps"]')
    return row ? (row.querySelector('.dc-sub')?.textContent || '').trim() : ''
  })
  await shot(page, '06_apps')

  // 点整行切换开关
  const sw = page.locator('.sub-shell .toggle-switch').first()
  const swBefore = await sw.getAttribute('aria-checked')
  await page.locator('[data-registered-app-list] .list-cell').first().click()
  await page.waitForTimeout(220)
  const swAfter = await page.locator('.sub-shell .toggle-switch').first().getAttribute('aria-checked')
  check('D 应用提醒：点整行可切开关', swBefore !== swAfter, `${swBefore} → ${swAfter}`)

  // 搜索：点击 → 隐藏麦克风 / 出现返回按钮 → 输入 → 清除按钮 / 空态 → 返回
  await page.locator('[data-sfd-idle]').click()
  await page.waitForTimeout(350)
  check('D 应用提醒：点击后出现圆形返回按钮', (await visibleCount(page, '[data-sfd-back]')) === 1)
  check('D 应用提醒：激活后麦克风隐藏', (await visibleCount(page, '.mic-icon')) === 0)
  await page.locator('.sfd-input').fill('微信')
  await page.waitForTimeout(250)
  check('D 应用提醒：输入后出现清除按钮', (await visibleCount(page, '[data-sfd-clear]')) === 1)
  const clearShape = await page.evaluate(() => {
    const c = document.querySelector('[data-sfd-clear] svg circle')
    const p = document.querySelector('[data-sfd-clear] svg path')
    return Boolean(c && p && c.getAttribute('fill') === '#8E8E93' && p.getAttribute('stroke') === '#FFFFFF')
  })
  check('D 应用提醒：清除按钮是深灰实心圆白叉', clearShape)
  check('D 应用提醒：搜索过滤生效', (await visibleCount(page, '[data-registered-app-list] .list-cell')) === 1)
  await page.locator('.sfd-input').fill('zzzzq')
  await page.waitForTimeout(250)
  check('D 应用提醒：无结果显示真机插画空态', (await visibleCount(page, '[data-search-empty]')) === 1)
  check('D 应用提醒：空态文案正确',
    (await page.locator('[data-search-empty]').first().textContent().catch(() => ''))?.includes('没有搜索到结果') === true)

  /* 空态居中：既要「外框」落在屏幕中线，也要「墨迹」落在自己外框的正中
     —— 真机 srch_04_committed 实测墨迹中心与页面中心差 0.5px，
        旧 viewBox 四周留白不均让墨迹偏右 3.5px / 偏下 8px，肉眼就是「没居中」。 */
  const boxCenter = await page.evaluate(() => {
    const shell = document.querySelector('.sub-shell').getBoundingClientRect()
    const empty = document.querySelector('[data-search-empty]').getBoundingClientRect()
    const art = document.querySelector('[data-search-empty] svg').getBoundingClientRect()
    const txt = document.querySelector('[data-search-empty] .search-empty-text').getBoundingClientRect()
    return {
      artDx: (art.x + art.width / 2) - (shell.x + shell.width / 2),
      // 整组（插画 + 文案）垂直中心与屏幕中线之差
      groupDy: ((art.y + txt.bottom) / 2) - (shell.y + shell.height / 2),
      // 空态必须铺满整个页面（不是靠 vh 顶出来的一块）
      coverW: empty.width / shell.width,
      coverH: empty.height / shell.height
    }
  })
  check('D 空态：插画外框水平居中（±2px）', Math.abs(boxCenter.artDx) <= 2, `dx=${boxCenter.artDx.toFixed(2)}`)
  check('D 空态：整组垂直居中（±12px）', Math.abs(boxCenter.groupDy) <= 12, `dy=${boxCenter.groupDy.toFixed(2)}`)
  check('D 空态：铺满整页而非 vh 定高',
    boxCenter.coverW > 0.95 && boxCenter.coverH > 0.95, `${boxCenter.coverW.toFixed(2)}x${boxCenter.coverH.toFixed(2)}`)

  // 逐像素量墨迹居中：把 svg 光栅化到 400×400 再找不透明像素包围盒
  const ink = await page.evaluate(async () => {
    const svg = document.querySelector('[data-search-empty] svg')
    const clone = svg.cloneNode(true)
    // 模板里的中文注释会变成注释节点，btoa 只吃 Latin1 ⇒ 先摘掉注释
    const dropComments = (n) => {
      ;[...n.childNodes].forEach(c => { if (c.nodeType === 8) c.remove(); else dropComments(c) })
    }
    dropComments(clone)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(clone))
    const img = new Image()
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src })
    const N = 400
    const c = document.createElement('canvas')
    c.width = N; c.height = N
    const g = c.getContext('2d')
    g.drawImage(img, 0, 0, N, N)
    const d = g.getImageData(0, 0, N, N).data
    let minX = N, maxX = -1, minY = N, maxY = -1
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (d[(y * N + x) * 4 + 3] > 8) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, h: maxY - minY, N }
  })
  check('D 空态：插画墨迹水平居中（±4/400）', Math.abs(ink.cx - ink.N / 2) <= 4, `cx=${ink.cx} vs ${ink.N / 2}`)
  check('D 空态：插画墨迹垂直居中（±4/400）', Math.abs(ink.cy - ink.N / 2) <= 4, `cy=${ink.cy} vs ${ink.N / 2}`)
  check('D 空态：插画不是空图（墨迹有实际尺寸）', ink.w > 200 && ink.h > 150, `${ink.w}x${ink.h}`)

  await shot(page, '09_apps_search_empty')
  await page.locator('[data-sfd-back]').click()
  await page.waitForTimeout(350)
  check('D 应用提醒：返回后恢复麦克风', (await visibleCount(page, '.mic-icon')) === 1)

  await page.locator('.sub-shell [data-nav-back]').first().click()
  await page.waitForTimeout(450)
  const appsSubAfter = await page.evaluate(() => {
    const row = document.querySelector('[data-dnd-row="apps"]')
    return row ? (row.querySelector('.dc-sub')?.textContent || '').trim() : ''
  })
  check('D 应用提醒：开关数联动主页副标题', appsSubAfter !== appsSubBefore, `${appsSubBefore} → ${appsSubAfter}`)
  await shot(page, '07_dnd_home_final')

  /* ---------- E. 礼拜模式：旧深色时间弹层已适配浅色标准控件 ---------- */
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(350)
  await page.evaluate(() => window.__system?.openApp?.('settings'))
  await page.waitForTimeout(700)
  await clickRow(page, HOME, '声音与振动')
  await clickRow(page, '.settings-sound-page', '礼拜模式')
  await page.waitForTimeout(450)
  check('E 进入礼拜模式页', (await visibleCount(page, '.prayer-subpage')) === 1)

  // 礼拜模式默认关闭，先开总开关才能进编辑页
  const master = page.locator('.prayer-subpage .toggle-switch').first()
  if ((await master.getAttribute('aria-checked')) !== 'true') await master.click()
  await page.waitForTimeout(250)
  await page.locator('.prayer-item-cell').first().click()
  await page.waitForTimeout(450)
  check('E 进入祈祷时段编辑页', (await visibleCount(page, '.prayer-subpage .list-cell')) >= 3)
  await page.locator('.prayer-subpage .list-cell', { hasText: '开始时间' }).first().click()
  await page.waitForTimeout(400)
  const prayerPanelBg = await page.evaluate(() => {
    const el = document.querySelector('.sheet-panel')
    return el ? getComputedStyle(el).backgroundColor : ''
  })
  check('E 礼拜模式：时间弹层是浅色（不再是 #1c1c1e 深色）', prayerPanelBg === 'rgb(255, 255, 255)', prayerPanelBg)
  check('E 礼拜模式：复用标准三列滚轮', (await visibleCount(page, '[data-wheel-col]')) === 3)
  check('E 礼拜模式：有取消/确定两枚按钮',
    (await visibleCount(page, '[data-tps-cancel]')) === 1 && (await visibleCount(page, '[data-tps-confirm]')) === 1)
  await shot(page, '08_prayer_time_sheet')

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
