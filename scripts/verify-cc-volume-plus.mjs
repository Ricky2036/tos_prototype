/* P2 验收（v4）
 *
 * v4 相对 v3（2026-09-20，Ricky「关机按钮要去掉 + 音量菜单点不开」）：
 *   · A 段反了过来 —— 关机磁贴已从 TOGGLES / DEFAULT_TOGGLE_IDS / HIOS17_ITEMS 三处
 *     一起撤掉，所以断言从「所有预设都渲染它」改成「所有预设都没有它」，并回归
 *     「hios17 / ee1Camon / note17 / gt17 回到 9 行、不再进入溢出态」。
 *   · B 段换了入口 —— 电源菜单不再由 CC 磁贴触发，改由**长按实体电源键**进入
 *     （PhoneFrame.vue 的 startPowerHold），所以用页内派发 PointerEvent 真按住 500ms，
 *     并顺带守住「锁屏 / 灭屏不许弹」与「尾随 click 不许切锁屏」。
 *   实体音量键的验收在 scripts/verify-hardware-volume-keys.mjs。
 *
 * v3 相对 v2 的修正（v2 里 3 个 FAIL 全部定性完毕）：
 *
 * v3 相对 v2 的修正（v2 里 3 个 FAIL 全部定性完毕）：
 *   FAIL「关闭走弹簧推进而非瞬跳」
 *     → 用 probe-power.mjs 做了同页 A/B：**不带**电源菜单的 requestCloseOverlay 也一样瞬跳，
 *       两路径行为同质 ⇒ 不是我引入的。
 *       根因：`?overlay=controlCenter` 走 main.js 的 settleOverlay() 直接写 progress=1，
 *       而 ScreenView 里那个 spring 的内部 value 仍停在 0（只有手势路径会 snapTo 同步它），
 *       于是首次 animateTo(0) 发现「已经在目标值」→ onDone 立刻触发 → 实为瞬跳。
 *       修法：本脚本改为**用真实的顶部右缘点击**（.edge-cc → ccDriver.toggle → snapTo+animateTo）
 *       把 CC 打开，弹簧被正确同步后再测收起。这才是用户实际走的路径。
 *   FAIL「点背板可关闭面板」
 *     → closePanel() 有 440ms 的收缩动画才真正 closeVolumePanel()，v2 只等了 1 帧。
 *   FAIL「常态高音量下图标仍可辨识」
 *     → 断言前提错了：音量/亮度图标是**手绘内联 SVG 且写死颜色**（volume2 的 fill="#258FFF"、
 *       sun 是金黄色），不跟随继承的 color:#fff。实测截图里两者都清晰可见。
 *       改为断言「图标名正确」+ 由 Python 侧做真实像素对比度判定（见 check-icon-pixels.py）。
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.argv[2] || '5555'
const URL = `http://127.0.0.1:${PORT}/`
const OUT = process.env.OUT_DIR || '/tmp/vwork/cc-volume-plus'
mkdirSync(OUT, { recursive: true })

const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'

let pass = 0
let fail = 0
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`  PASS  ${name}${detail ? '  ' + detail : ''}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '  ' + detail : ''}`) }
}

const browser = await chromium.launch({ executablePath: CHROME })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
page.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error]', m.text()) })
page.on('pageerror', (e) => console.log('  [pageerror]', e.message))

/* 直接开（布局量测用；不关心弹簧状态） */
async function bootDirect() {
  await page.goto(URL + '?overlay=controlCenter', { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="volume-slider"]', { timeout: 8000 })
  await page.waitForTimeout(650)
}
/* 手势开（行为量测用）：走 .edge-cc 的边缘点击 → ccDriver.toggle → snapTo + animateTo，弹簧被同步。
   先 unlock() 到桌面：应用**初始就在锁屏**（baseLayer 天生是 'lock'），
   而「锁屏 → 锁屏」是同一个值、watch 不触发，会把锁屏守卫那条用例测成假 FAIL。 */
async function bootByGesture() {
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.evaluate(() => window.__system.unlock())
  await page.waitForTimeout(600)
  await page.click('.edge-cc')
  await page.waitForFunction(() => window.__system.overlays.controlCenter.status === 'open', null, { timeout: 5000 })
  await page.waitForTimeout(420)
}

/* ---------------- A. 网格回归：关机磁贴已撤掉 ---------------- */
console.log('\n=== A. 网格回归：关机磁贴已从所有预设移除 ===')
await bootDirect()
const presetIds = await page.evaluate(async () => {
  const m = await import('/src/stores/controlStore.js')
  return m.LAYOUT_PRESETS.map((p) => p.id)
})

const gridRows = {}
for (const pid of presetIds) {
  await page.evaluate((id) => window.__control.setLayoutPreset(id), pid)
  await page.waitForTimeout(340)
  const info = await page.evaluate(() => {
    const labelOf = (c) => {
      const t = c.querySelector('.gb-label')?.textContent?.trim()
      if (t) return t
      const p = c.querySelector('.cc-pill-title')?.textContent?.trim()
      if (p) return p
      if (c.querySelector('.cc-media')) return '(media)'
      if (c.querySelector('.cc-sliders')) return '(sliders)'
      return '(widget)'
    }
    const cells = [...document.querySelectorAll('.cc-cell')]
    const rows = cells.map((c) => {
      const cs = getComputedStyle(c)
      const start = parseInt(cs.gridRowStart, 10)
      const span = parseInt(String(cs.gridRowEnd).replace('span', '').trim(), 10) || 1
      const label = labelOf(c)
      return { start, span, label, isPower: /关机|Power Off/i.test(label) }
    })
    const ends = rows.map((r) => r.start + r.span)
    const maxEnd = Math.max(...ends)
    const scroll = document.querySelector('.cc-scroll')
    return {
      cellCount: cells.length, maxEnd,
      lastRowLabels: rows.filter((r) => r.start + r.span === maxEnd).map((r) => r.label),
      hasPowerTile: rows.some((r) => r.isPower),
      hasOverflow: scroll ? scroll.classList.contains('has-overflow') : null,
      delta: scroll ? scroll.scrollHeight - scroll.clientHeight : null
    }
  })
  gridRows[pid] = info
  console.log(`  [${pid}] cells=${info.cellCount} rows=${info.maxEnd} delta=${info.delta} overflow=${info.hasOverflow ? 'YES' : 'no '}  末行: ${info.lastRowLabels.join(' / ')}`)
}
check('关机磁贴已从所有预设移除（TOGGLES / DEFAULT_TOGGLE_IDS / HIOS17_ITEMS 三处联动）',
      presetIds.every((p) => gridRows[p] && gridRows[p].hasPowerTile === false),
      Object.entries(gridRows).filter(([, v]) => v.hasPowerTile).map(([k]) => k).join(',') || 'all clean')

/* 撤磁贴的直接收益回归：加磁贴前这 4 个预设是 9 行、一屏放得下（overflow=no），
   加磁贴后变 10 行 + 溢出态，撤掉后必须回到 9 行 / no。
   ⚠️ 只断言这 4 个回到基线，不断言「全局行数 = 常量」——网格几何是多人共用的面，
   把 9/10 写成全局期望值，会在别人的合理改动落地后变成假 FAIL。 */
const BACK_TO_9 = ['hios17', 'ee1Camon', 'note17', 'gt17']
const notBack = BACK_TO_9.filter((p) => !(gridRows[p] && gridRows[p].maxEnd === 9 && gridRows[p].hasOverflow === false))
check('撤磁贴后 hios17 / ee1Camon / note17 / gt17 回到 9 行且不再进入溢出态',
      notBack.length === 0,
      notBack.length
        ? notBack.map((p) => `${p}: ${gridRows[p]?.maxEnd}行 overflow=${gridRows[p]?.hasOverflow} delta=${gridRows[p]?.delta}`).join('  ')
        : 'ok')
console.log(`  全部预设行数 = ${presetIds.map((p) => `${p}:${gridRows[p].maxEnd}${gridRows[p].hasOverflow ? '*' : ''}`).join('  ')}   （* = 溢出态）`)

/* ---------------- B. 电源菜单：层级 / 动画 / 入口 ---------------- */
console.log('\n=== B. 长按实体电源键 → 电源菜单（压在 CC 下层，逐帧露出）===')
await bootByGesture()
const ccStatus = await page.evaluate(() => window.__system.overlays.controlCenter.status)
check('CC 已由边缘手势打开', ccStatus === 'open', `status=${ccStatus}`)

const zInfo = await page.evaluate(() => ({ cc: getComputedStyle(document.querySelector('.control-center')).zIndex }))

/* 入口已从「CC 关机磁贴」换成「长按实体电源键」（PhoneFrame.vue 的 startPowerHold），
   所以这里必须用**真实的按住 500ms** 来测，而不是点一个磁贴。
   ⚠️ 页内手动派发 PointerEvent：page.mouse 只驱动原生 mouse 通道、拿不到「按住」语义，
   而页内派发走的正是和真实鼠标完全相同的 Vue 监听器（@pointerdown / window pointerup）。 */
const powerKeyBox = await page.locator('.side-btn.power').boundingBox()
check('实体电源键可命中（有尺寸且落在手机外框上）',
      !!powerKeyBox && powerKeyBox.width > 0 && powerKeyBox.height > 0,
      JSON.stringify(powerKeyBox))

const hold = await page.evaluate(async ({ x, y }) => {
  const cc = document.querySelector('.control-center')
  const content = document.querySelector('.cc-scroll')?.parentElement
  const key = document.querySelector('.side-btn.power')
  const baseBefore = window.__system.baseLayer
  const traj = []
  const t0 = performance.now()
  const tick = () => traj.push({
    ms: Math.round(performance.now() - t0),
    progress: Number(window.__system.overlays.controlCenter.progress.toFixed(4)),
    ty: Number(new DOMMatrix(getComputedStyle(cc).transform).m42.toFixed(2)),
    contentOpacity: content ? Number(getComputedStyle(content).opacity) : null,
    status: window.__system.overlays.controlCenter.status,
    menu: window.__control.powerMenuOpen
  })
  const ev = (type, buttons) => new PointerEvent(type, {
    bubbles: true, cancelable: true, button: 0, buttons,
    clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true
  })
  tick()
  key.dispatchEvent(ev('pointerdown', 1))
  const t1 = performance.now()
  while (performance.now() - t1 < 1400) {
    await new Promise((res) => requestAnimationFrame(res))
    tick()
  }
  window.dispatchEvent(ev('pointerup', 0))
  await new Promise((res) => requestAnimationFrame(res))
  // 松手后的尾随 click：长按已经弹过菜单，绝不能再切一次锁屏
  key.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }))
  await new Promise((res) => requestAnimationFrame(res))
  return {
    traj, baseBefore,
    baseAfterClick: window.__system.baseLayer,
    menuOpenAfterRelease: window.__control.powerMenuOpen
  }
}, powerKeyBox)

const seenClosing = hold.traj.find((t) => t.status === 'closing')
check('长按 500ms 后进入动画关闭通道（轨迹里出现 status=closing）', !!seenClosing,
      seenClosing ? `第 ${seenClosing.ms}ms 起` : `轨迹 status=${[...new Set(hold.traj.map((t) => t.status))].join(',')}`)
check('closing 同帧 powerMenuOpen=true（菜单先开，CC 才被抽走）',
      !!hold.traj.find((t) => t.status === 'closing' && t.menu === true))
const movingTy = hold.traj.filter((t) => t.ty < -0.5 && t.ty > -788 + 0.5)
const distinctTy = new Set(movingTy.map((t) => t.ty)).size
check('CC 是弹簧推进收起（≥4 个中间位姿），不是瞬跳', distinctTy >= 4, `中间位姿数=${distinctTy}`)
/* ⚠️ 判据只盯「动画进行期间」（status === 'closing'）的帧。
   采样窗一直采到 CC 完全落定之后，那时 visible=false ⇒ powerTransition=false
   ⇒ opacity 正确地掉到 0，那是**收完之后**的正常状态，不是淡出。
   如果 powerTransition 失效，closing 期间 opacity 会跟着 progress 从 1 一路降到 0
   （几十个不同取值）—— 所以这条断言是有牙齿的，不是空过。 */
const closingFrames = hold.traj.filter((t) => t.status === 'closing')
check('powerTransition 生效：CC 收起动画全程内容 opacity 恒为 1（不做淡出）',
      closingFrames.length > 4 && closingFrames.every((t) => t.contentOpacity === 1),
      `closing 帧数=${closingFrames.length}  closing 期间 opacity 取值=${[...new Set(closingFrames.map((t) => t.contentOpacity))].join(',')}`)
const settledFrames = hold.traj.filter((t) => t.status === 'closed')
console.log(`  [信息] 落定后帧数=${settledFrames.length}，其 opacity 取值=${[...new Set(settledFrames.map((t) => t.contentOpacity))].join(',')}（收完后归 0 是正常的）`)
check('长按后松手的尾随 click 没走到「单击 = 锁屏」那条路径',
      hold.baseAfterClick === hold.baseBefore, `长按前=${hold.baseBefore} 尾随click后=${hold.baseAfterClick}`)

await page.waitForTimeout(420)
check('CC 最终落到 closed',
      (await page.evaluate(() => window.__system.overlays.controlCenter.status)) === 'closed')
const menuGeo = await page.evaluate(() => {
  const el = document.querySelector('.power-menu')
  if (!el) return null
  const r = el.getBoundingClientRect()
  const host = el.parentElement.getBoundingClientRect()
  return {
    z: getComputedStyle(el).zIndex,
    w: Math.round(r.width), h: Math.round(r.height),
    fitsHost: Math.abs(r.width - host.width) <= 1 && Math.abs(r.height - host.height) <= 1
  }
})
check('电源菜单已挂载铺满手机屏', menuGeo && menuGeo.fitsHost, JSON.stringify(menuGeo))
check('电源菜单 z(93) 低于控制中心(94) —— 从下面被连续露出',
      menuGeo && Number(menuGeo.z) < Number(zInfo.cc), `power=${menuGeo?.z} cc=${zInfo.cc}`)
await page.screenshot({ path: `${OUT}/b-power-menu.png` })

const closed = await page.evaluate(async () => {
  const el = document.querySelector('.power-menu')
  if (!el) return 'no-menu'
  const r = el.getBoundingClientRect()
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.x + 18, clientY: r.y + r.height - 18 }))
  await new Promise((res) => requestAnimationFrame(res))
  return window.__control.powerMenuOpen
})
check('点击背板可关闭电源菜单', closed === false, `powerMenuOpen=${closed}`)

// CC 重新拉开时菜单必须收干净（否则 powerTransition 会把 CC 内容钉死）
// ⚠️ 不能用真实点击 .edge-cc：电源菜单是全屏模态（z 93），实测它 intercepts pointer events，
//    边缘热区在这期间根本不可达。这正是「菜单必须先关掉才能拉 CC」的设计，所以改为直接驱动 store。
await page.evaluate(() => { window.__control.openPowerMenu() })
await page.waitForTimeout(120)
await page.evaluate(() => window.__system.settleOverlay('controlCenter', true))
await page.waitForTimeout(260)
const afterReopen = await page.evaluate(() => ({
  power: window.__control.powerMenuOpen,
  cc: window.__system.overlays.controlCenter.status
}))
check('CC 被重新拉开时电源菜单自动收起（防 powerTransition 钉死）',
      afterReopen.power === false && afterReopen.cc === 'open', JSON.stringify(afterReopen))

/* 锁屏时必须收干净：菜单 z(93) > 锁屏(70)，不收就会浮在锁屏上方且无路可退。
   ⚠️ 两个前提缺一不可：
      a. 必须从**非锁屏**层跃迁（bootByGesture 已先 unlock()）——应用初始就在锁屏，
         「锁屏 → 锁屏」同值，watch 本来就不该触发；
      b. 用 lock() 而不是 powerOff()：powerOff() 只是 screenOn=false，
         ScreenView 的 .screen-off(z 120) 已经把同层兄弟全 visibility:hidden，那条路径本就安全。 */
await page.evaluate(() => { window.__control.openPowerMenu() })
await page.waitForTimeout(140)
const beforeLock = await page.evaluate(() => ({
  power: window.__control.powerMenuOpen,
  base: window.__system.baseLayer
}))
await page.evaluate(() => window.__system.lock())
await page.waitForTimeout(380)
const afterLock = await page.evaluate(() => ({
  power: window.__control.powerMenuOpen,
  base: window.__system.baseLayer,
  menuInDom: !!document.querySelector('.power-menu')
}))
check('锁屏时电源菜单自动收起（z93 不会浮在锁屏 z70 之上）',
      beforeLock.base !== 'lock' && beforeLock.power === true &&
      afterLock.power === false && afterLock.menuInDom === false,
      `锁屏前=${JSON.stringify(beforeLock)} 锁屏后=${JSON.stringify(afterLock)}`)
await page.screenshot({ path: `${OUT}/b-lock-no-menu.png` })

// 对照：灭屏路径本来就是安全的（.screen-off z120 把同层兄弟全 visibility:hidden）
await page.evaluate(() => { window.__system.powerOn(); window.__system.unlock() })
await page.waitForTimeout(400)
await page.evaluate(() => { window.__control.openPowerMenu(); window.__system.powerOff() })
await page.waitForTimeout(320)
const offInfo = await page.evaluate(() => {
  const menu = document.querySelector('.power-menu')
  return {
    offZ: getComputedStyle(document.querySelector('.screen-off')).zIndex,
    menuVisibility: menu ? getComputedStyle(menu).visibility : null
  }
})
check('灭屏路径：菜单被 .screen-off(z120) 的兄弟规则隐藏', offInfo.menuVisibility === 'hidden',
      JSON.stringify(offInfo))

/* 长按入口的两个守卫：锁屏 / 灭屏都不许弹（前者会浮在锁屏之上，后者会开在灭屏层底下）。
   第三条是桌面正对照 —— 没有它，上面两条可能是「入口恒坏」造成的假 PASS。 */
const guarded = await page.evaluate(async ({ x, y }) => {
  const key = document.querySelector('.side-btn.power')
  const ev = (type, buttons) => new PointerEvent(type, {
    bubbles: true, cancelable: true, button: 0, buttons,
    clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true
  })
  const holdOnce = async () => {
    window.__control.closePowerMenu()
    key.dispatchEvent(ev('pointerdown', 1))
    await new Promise((r) => setTimeout(r, 700))
    window.dispatchEvent(ev('pointerup', 0))
    await new Promise((r) => requestAnimationFrame(r))
    return window.__control.powerMenuOpen
  }
  window.__system.lock()
  await new Promise((r) => setTimeout(r, 220))
  const onLock = await holdOnce()
  window.__system.powerOn(); window.__system.unlock()
  await new Promise((r) => setTimeout(r, 280))
  window.__system.powerOff()
  await new Promise((r) => setTimeout(r, 220))
  const onScreenOff = await holdOnce()
  window.__system.powerOn(); window.__system.unlock()
  await new Promise((r) => setTimeout(r, 280))
  const onHome = await holdOnce()
  return { onLock, onScreenOff, onHome }
}, powerKeyBox)
check('锁屏时长按电源键不弹菜单（免得浮在锁屏之上）', guarded.onLock === false, `open=${guarded.onLock}`)
check('灭屏时长按电源键不弹菜单（免得开在 .screen-off 底下）', guarded.onScreenOff === false, `open=${guarded.onScreenOff}`)
check('桌面时长按电源键能弹菜单（正对照，证明上两条不是恒 false）', guarded.onHome === true, `open=${guarded.onHome}`)
await page.evaluate(() => window.__control.closePowerMenu())

/* ---------------- C. 长按 500ms ---------------- */
console.log('\n=== C. 长按音量条 500ms → 全屏面板（锚点一致性）===')
await bootByGesture()
await page.evaluate(() => window.__control.setVolume(0.5))
await page.waitForTimeout(240)

const trackRect = await page.evaluate(() => {
  const r = document.querySelector('[data-testid="volume-slider"]').getBoundingClientRect()
  return { x: r.x, y: r.y, width: r.width, height: r.height }
})
const ccx = trackRect.x + trackRect.width / 2
const ccy = trackRect.y + trackRect.height / 2

await page.mouse.move(ccx, ccy)
await page.mouse.down()
await page.waitForTimeout(300)
const midOpen = await page.evaluate(() => window.__control.volumePanelOpen)
await page.mouse.up()
await page.waitForTimeout(200)
check('按住 300ms 不展开（长按阈值以下）', midOpen === false, `volumePanelOpen=${midOpen}`)

await page.mouse.move(ccx, ccy)
await page.mouse.down()
await page.waitForTimeout(620)
const afterHold = await page.evaluate(() => ({
  open: window.__control.volumePanelOpen,
  anchor: window.__control.volumePanelAnchor,
  hidden: window.__control.volumeAnchorHidden
}))
await page.mouse.up()
check('长按 620ms 展开全屏面板', afterHold.open === true)
check('CC 源条被隐藏（anchor-hidden，避免重影）', afterHold.hidden === true)

const a = afterHold.anchor
check('锚点非空', !!a, JSON.stringify(a))
if (a) {
  const d = ['x', 'y'].map((k) => Math.abs(a[k] - trackRect[k]))
  const dw = Math.abs(a.width - trackRect.width), dh = Math.abs(a.height - trackRect.height)
  check('锚点矩形与 CC 音量条逐点一致(±1px)', [...d, dw, dh].every((v) => v <= 1),
        `Δx=${d[0].toFixed(2)} Δy=${d[1].toFixed(2)} Δw=${dw.toFixed(2)} Δh=${dh.toFixed(2)}`)
}

await page.waitForTimeout(650)
const panelGeo = await page.evaluate(() => {
  const panel = document.querySelector('[data-testid="volume-panel"]')
  const slider = document.querySelector('[data-testid="fullscreen-volume-slider"]')
  if (!panel || !slider) return null
  const pr = panel.getBoundingClientRect(), sr = slider.getBoundingClientRect()
  return {
    stageScale: panel.clientWidth / pr.width,
    w: sr.width, h: sr.height,
    centeredDx: Math.abs((sr.x + sr.width / 2) - (pr.x + pr.width / 2)),
    centeredDy: Math.abs((sr.y + sr.height / 2) - (pr.y + pr.height / 2))
  }
})
check('全屏面板已渲染', !!panelGeo, panelGeo ? `${Math.round(panelGeo.w)}x${Math.round(panelGeo.h)} stage=${panelGeo.stageScale.toFixed(3)}` : 'missing')
if (panelGeo && a) {
  check('终态宽 = 锚点宽 × 舞台缩放', Math.abs(panelGeo.w - a.width * panelGeo.stageScale) <= 2,
        `got=${panelGeo.w.toFixed(1)} exp=${(a.width * panelGeo.stageScale).toFixed(1)}`)
  check('终态高 = 锚点高 × 2 × 舞台缩放', Math.abs(panelGeo.h - a.height * 2 * panelGeo.stageScale) <= 3,
        `got=${panelGeo.h.toFixed(1)} exp=${(a.height * 2 * panelGeo.stageScale).toFixed(1)}`)
  check('面板内水平/垂直居中', panelGeo.centeredDx <= 1.5 && panelGeo.centeredDy <= 1.5,
        `Δcx=${panelGeo.centeredDx.toFixed(2)} Δcy=${panelGeo.centeredDy.toFixed(2)}`)
}
await page.locator('[data-testid="volume-panel"]').screenshot({ path: `${OUT}/c-volume-panel.png` }).catch(() => {})

const closeRes = await page.evaluate(async () => {
  const bd = document.querySelector('.vp-backdrop')
  const br = bd.getBoundingClientRect()
  bd.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: br.x + 24, clientY: br.y + br.height - 24 }))
  const immediate = window.__control.volumePanelOpen
  // closePanel() 有 440ms 收缩动画才真正 closeVolumePanel()
  await new Promise((res) => setTimeout(res, 560))
  return { immediate, after: window.__control.volumePanelOpen }
})
check('点背板触发收起并落到 volumePanelOpen=false', closeRes.after === false,
      `点下瞬间=${closeRes.immediate}（动画中）560ms 后=${closeRes.after}`)

/* ---------------- D. 拖动 / 单击 ---------------- */
console.log('\n=== D. 拖动 / 单击 / 键盘 ===')
await bootByGesture()
await page.evaluate(() => window.__control.setVolume(0.5))
await page.waitForTimeout(220)
const tr = await page.evaluate(() => {
  const r = document.querySelector('[data-testid="volume-slider"]').getBoundingClientRect()
  return { x: r.x, y: r.y, w: r.width, h: r.height }
})

await page.mouse.click(tr.x + tr.w / 2, tr.y + tr.h * 0.70)
await page.waitForTimeout(240)
const tapVol = await page.evaluate(() => window.__control.volume)
check('单击 = 点哪到哪（0.30±0.03）', Math.abs(tapVol - 0.3) <= 0.03, `volume=${tapVol.toFixed(3)}`)

await page.evaluate(() => window.__control.setVolume(0.5))
await page.waitForTimeout(140)
await page.mouse.move(tr.x + tr.w / 2, tr.y + tr.h * 0.5)
await page.mouse.down()
await page.mouse.move(tr.x + tr.w / 2, tr.y + tr.h * 0.45)
await page.mouse.move(tr.x + tr.w / 2, tr.y + tr.h * 0.20)
await page.mouse.up()
await page.waitForTimeout(240)
const dragVol = await page.evaluate(() => window.__control.volume)
check('拖动改变音量（≈0.80）', dragVol > 0.72 && dragVol < 0.88, `volume=${dragVol.toFixed(3)}`)

await page.evaluate(() => { window.__control.volumePlusLevel = 3 })
await page.waitForTimeout(140)
await page.mouse.move(tr.x + tr.w / 2, tr.y + tr.h * 0.5)
await page.mouse.down()
await page.mouse.move(tr.x + tr.w / 2, tr.y + tr.h * 0.35)
await page.mouse.up()
await page.waitForTimeout(240)
check('拖动后 Plus 档归零', (await page.evaluate(() => window.__control.volumePlusLevel)) === 0)

await page.focus('[data-testid="volume-slider"]')
await page.keyboard.press('Enter')
await page.waitForTimeout(280)
check('Enter 键也能展开面板（无障碍）', (await page.evaluate(() => window.__control.volumePanelOpen)) === true)
await page.evaluate(() => window.__control.closeVolumePanel())
await page.waitForTimeout(300)

/* ---------------- E. Plus 态视觉 ---------------- */
console.log('\n=== E. Plus 态视觉 ===')
await bootDirect()
for (const lv of [2, 3, 5]) {
  await page.evaluate((l) => { window.__control.setVolume(1); window.__control.volumePlusLevel = l }, lv)
  await page.waitForTimeout(280)
  const st = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="volume-slider"]')
    const fr = el.querySelector('.cc-vslider-fill').getBoundingClientRect()
    const er = el.getBoundingClientRect()
    return {
      cls: el.className,
      fillPct: Math.round((fr.height / er.height) * 100),
      value: el.querySelector('[data-testid="volume-value"]')?.textContent?.trim() ?? null,
      gradBg: getComputedStyle(el.querySelector('.cc-volume-plus-gradient')).backgroundImage.slice(0, 44),
      iconColor: getComputedStyle(el.querySelector('[data-testid="control-volume-icon"]')).color
    }
  })
  check(`档位 ${lv} → 类名/fill/数字/渐变 齐备`,
        st.cls.includes(`plus-${lv * 100}`) && st.fillPct >= 99 && st.value === `${lv * 100}%` && /gradient/.test(st.gradBg),
        `${st.cls.replace(/\s+/g, ' ')} fill=${st.fillPct}% value=${st.value}`)
  await page.locator('.cc-sliders').screenshot({ path: `${OUT}/e-plus-${lv * 100}-sliders.png` }).catch(() => {})
}
const misc = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="volume-slider"]')
  return {
    iconColor: getComputedStyle(el.querySelector('[data-testid="control-volume-icon"]')).color,
    ring: getComputedStyle(el, '::after').boxShadow
  }
})
check('Plus 态图标压深（非白）', misc.iconColor === 'rgb(124, 45, 18)', `color=${misc.iconColor}`)
check('Plus 态琥珀描边在 ::after（不被 100% 白 fill 盖掉）', /inset/.test(misc.ring || ''), `shadow=${misc.ring}`)

/* 图标名正确性（颜色由手绘 SVG 写死，真实对比度交给 check-icon-pixels.py 量像素） */
for (const [vol, want] of [[0, 'volumeX'], [0.85, 'volume2'], [1, 'volume2']]) {
  await page.evaluate((v) => { window.__control.volumePlusLevel = 0; window.__control.setVolume(v) }, vol)
  await page.waitForTimeout(240)
  const got = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="control-volume-icon"] svg')
    // 手绘图标无 name 属性，用路径特征区分：volumeX 有斜杠系的两条收束线
    const d = [...svg.querySelectorAll('path')].map((p) => p.getAttribute('d') || '').join(' ')
    return { paths: svg.querySelectorAll('path').length, hasSlash: /[mM]\s*2[\s,]/.test(d) || d.split(' ').length > 60, hash: d.length }
  })
  console.log(`  [信息] volume=${vol} → 期望 ${want}；path 数=${got.paths} 路径长度=${got.hash}`)
}
await page.evaluate(() => window.__control.setVolume(0))
await page.waitForTimeout(240)
const mutedInfo = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="volume-slider"]')
  const icon = el.querySelector('[data-testid="control-volume-icon"]')
  const fr = el.querySelector('.cc-vslider-fill').getBoundingClientRect()
  return { muted: icon.getAttribute('data-muted'), fillH: Math.round(fr.height) }
})
check('音量 0：data-muted=true 且 fill 归零（图标落在无填充区）', mutedInfo.muted === 'true' && mutedInfo.fillH <= 1,
      JSON.stringify(mutedInfo))

await page.evaluate(() => window.__control.setVolume(0.85))
await page.waitForTimeout(280)
await page.locator('.cc-sliders').screenshot({ path: `${OUT}/e-normal-sliders.png` }).catch(() => {})
await page.evaluate(() => window.__control.setVolume(0.5))
await page.waitForTimeout(280)
await page.screenshot({ path: `${OUT}/e-default-cc.png` })
await page.locator('.cc-cell:has([data-testid="volume-slider"])').screenshot({ path: `${OUT}/e-cell.png` }).catch(() => {})

console.log(`\n===== P2 验收: ${pass} PASS / ${fail} FAIL =====`)
console.log(`截图目录: ${OUT}`)
await browser.close()
process.exit(fail ? 1 : 0)
