/* 实体音量键 / 电源键 验收（v1，2026-09-20）
 *
 * 背景：Ricky 报「音量菜单你说集成了，但我怎么点不开？是不是音量键位置没有映射到
 * 当前的音量键上？」—— 这个判断完全正确。移植快照时，侧栏音量浮层（SideVolumeOverlay）、
 * 音量 Plus、全屏音量面板都装好了，但**实体音量键那一侧从来没接线**：
 * `grep -rn "volumeUp|showSideVolume|touchSideVolume" src/` 当时只有
 * SideVolumeOverlay.vue 自己那一处 `control.touchSideVolume()`，
 * 而 .volume-up / .volume-down 是继承 `.side-btn { pointer-events: none }`
 * 且没有任何事件绑定的装饰 div。本脚本就是这个缺口的正面验收。
 *
 * 用法: node scripts/verify-hardware-volume-keys.mjs [port]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.argv[2] || '5555'
const URL = `http://127.0.0.1:${PORT}/`
const OUT = process.env.OUT_DIR || '/tmp/vwork/hw-volume-keys'
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

/** 到桌面（CC 关闭、屏幕亮）。应用**初始就在锁屏**（baseLayer 天生 'lock'），
 *  而锁屏时长按电源键是被守卫挡掉的，所以必须先 unlock。 */
async function bootHome() {
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.evaluate(() => window.__system.unlock())
  await page.waitForTimeout(520)
}

/** CC 打开态（由真实边缘手势开层）。 */
async function bootCcOpen() {
  await bootHome()
  await page.click('.edge-cc')
  await page.waitForFunction(() => window.__system.overlays.controlCenter.status === 'open', null, { timeout: 5000 })
  await page.waitForTimeout(420)
}

/** 把音量相关状态压到可观测起点。sideVolumeMode 需要 'hidden' 才能看「叫出浮层」这一步。 */
async function resetVolume(v = 0.5) {
  await page.evaluate((val) => {
    window.__control.volumePlusLevel = 0
    window.__control.setVolume(val)
    window.__control.closeSideVolume()
  }, v)
  await page.waitForTimeout(160)
}

async function tryClick(sel) {
  try { await page.click(sel, { timeout: 3000 }); return null }
  catch (e) { return String(e.message || e).split('\n')[0] }
}

const read = () => page.evaluate(() => ({
  volume: Number(window.__control.volume.toFixed(3)),
  plus: window.__control.volumePlusLevel,
  mode: window.__control.sideVolumeMode,
  bounceSeq: window.__control.sideVolumeBounceSeq,
  bounceDir: window.__control.sideVolumeBounceDirection,
  overlayInDom: !!document.querySelector('[data-testid="side-volume"]')
}))

/* ===================== A. 接线本身 ===================== */
console.log('\n=== A. 音量键是否真的接上了（「点不开」的根因）===')
await bootHome()

const wiring = await page.evaluate(() => {
  const up = document.querySelector('.side-btn.volume-up')
  const dn = document.querySelector('.side-btn.volume-down')
  const ur = up.getBoundingClientRect(), dr = dn.getBoundingClientRect()
  return {
    upTag: up.tagName, dnTag: dn.tagName,
    upPE: getComputedStyle(up).pointerEvents,
    dnPE: getComputedStyle(dn).pointerEvents,
    upCursor: getComputedStyle(up).cursor,
    upW: Math.round(ur.width), upH: Math.round(ur.height),
    keyGap: Math.round(dr.top - ur.bottom)
  }
})
check('音量+/- 已解绑 .side-btn 的 pointer-events:none',
      wiring.upPE !== 'none' && wiring.dnPE !== 'none',
      `up=${wiring.upPE} down=${wiring.dnPE}`)
check('两个音量键是真实控件（<button>）而不是装饰 div',
      wiring.upTag === 'BUTTON' && wiring.dnTag === 'BUTTON',
      `${wiring.upTag} / ${wiring.dnTag}`)
check('键体有可点尺寸（视觉 3px 宽，热区靠 ::before 外扩）',
      wiring.upW > 0 && wiring.upH >= 40, `${wiring.upW}x${wiring.upH}`)
/* ⚠️ 这条守的是「热区外扩不能把两个键叠在一起」：
   视觉上两键只差 10px，若上下各扩 8px，两个热区会重叠 6px，
   而 volume-down 在 DOM 里靠后 ⇒ 重叠区被它抢走 ⇒ 点「音量+」反而减音量。 */
check('两键的外扩热区不重叠（上下各扩 4px，键间距必须 ≥ 8px）',
      wiring.keyGap >= 8, `键间距=${wiring.keyGap}px ⇒ 热区间隙=${wiring.keyGap - 8}px`)

/* ===================== B. 单击 = 一步 + 叫出侧栏浮层 ===================== */
console.log('\n=== B. 单击音量+：改音量 + 叫出侧栏音量浮层 ===')
await resetVolume(0.5)
const b0 = await read()
const clickErr = await tryClick('.side-btn.volume-up')
check('音量+ 键可被真实点击命中（Playwright actionability 通过）', clickErr === null, clickErr || '')
await page.waitForTimeout(260)
const b1 = await read()
check('单击音量+ → volume 0.50 → 0.60', Math.abs(b1.volume - 0.6) <= 0.001, `volume=${b1.volume}`)
check('单击音量+ → 侧栏浮层被叫出来（hidden → expanded）', b1.mode === 'expanded', `mode=${b1.mode}`)
check('侧栏浮层确实渲染进 DOM', b1.overlayInDom === true)
await page.screenshot({ path: `${OUT}/b1-first-press-expanded.png` })

const cErr = await tryClick('.side-btn.volume-up')
check('第二次点击仍可命中', cErr === null, cErr || '')
await page.waitForTimeout(240)
const b2 = await read()
check('第二次单击 → volume 0.60 → 0.70', Math.abs(b2.volume - 0.7) <= 0.001, `volume=${b2.volume}`)
check('第二次单击 → 浮层收成 compact 细条（expanded → compact）', b2.mode === 'compact', `mode=${b2.mode}`)
await page.screenshot({ path: `${OUT}/b2-second-press-compact.png` })

const dErr = await tryClick('.side-btn.volume-down')
check('音量− 键可被真实点击命中', dErr === null, dErr || '')
await page.waitForTimeout(240)
const b3 = await read()
check('单击音量− → volume 0.70 → 0.60', Math.abs(b3.volume - 0.6) <= 0.001, `volume=${b3.volume}`)

/* ===================== C. 顶到边界 → compact 态回弹 ===================== */
console.log('\n=== C. 顶到边界时回弹（只在 compact 态）===')
await resetVolume(0)
const c1 = await read()
await tryClick('.side-btn.volume-down')      // 第 1 次：hidden→expanded，此时边界判据看到的是 expanded ⇒ 不弹
await page.waitForTimeout(220)
const c2 = await read()
check('第 1 次（浮层刚展开，expanded 态）到边界不回弹',
      c2.bounceSeq === c1.bounceSeq && c2.volume === 0,
      `seq ${c1.bounceSeq} → ${c2.bounceSeq}  volume=${c2.volume}`)
await tryClick('.side-btn.volume-down')      // 第 2 次：expanded→compact，边界判据看到 compact ⇒ 弹
await page.waitForTimeout(220)
const c3 = await read()
check('第 2 次（已收成 compact）到边界回弹一次且方向为 down',
      c3.bounceSeq === c2.bounceSeq + 1 && c3.bounceDir === 'down',
      `seq ${c2.bounceSeq} → ${c3.bounceSeq}  dir=${c3.bounceDir}`)

/* ===================== D. CC 打开时不叠浮层 ===================== */
console.log('\n=== D. 控制中心打开时：音量照改，但不叠侧栏浮层 ===')
await bootCcOpen()
await resetVolume(0.4)
const d1 = await read()
await tryClick('.side-btn.volume-up')
await page.waitForTimeout(240)
const d2 = await read()
check('CC 打开时单击音量+ 仍然改音量', Math.abs(d2.volume - 0.5) <= 0.001, `volume=${d2.volume}`)
check('CC 打开时不叫侧栏浮层（CC 自带音量条，不叠两层）',
      d2.mode === 'hidden' && d2.overlayInDom === false, `mode=${d2.mode} dom=${d2.overlayInDom}`)

/* ===================== E. 长按连发（350ms 阈值 / 90ms 间隔）===================== */
console.log('\n=== E. 长按音量+：连发直到 100%，再到 Plus 档 ===')
await bootHome()
await resetVolume(0.5)

const hold = await page.evaluate(async () => {
  const key = document.querySelector('.side-btn.volume-up')
  const r = key.getBoundingClientRect()
  const ev = (t, b) => new PointerEvent(t, {
    bubbles: true, cancelable: true, button: 0, buttons: b,
    clientX: r.x + 1, clientY: r.y + r.height / 2, pointerId: 7, pointerType: 'mouse', isPrimary: true
  })
  const seq = []
  key.dispatchEvent(ev('pointerdown', 1))
  const t0 = performance.now()
  while (performance.now() - t0 < 1400) {
    await new Promise((res) => requestAnimationFrame(res))
    seq.push({
      ms: Math.round(performance.now() - t0),
      volume: Number(window.__control.volume.toFixed(3)),
      plus: window.__control.volumePlusLevel
    })
  }
  window.dispatchEvent(ev('pointerup', 0))
  await new Promise((res) => requestAnimationFrame(res))
  const atRelease = { volume: window.__control.volume, plus: window.__control.volumePlusLevel }
  /* 松手后浏览器会补一个 click；长按已经连发过了，它绝不能再多加一步 */
  key.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.x + 1, clientY: r.y + r.height / 2 }))
  await new Promise((res) => requestAnimationFrame(res))
  const afterTailClick = { volume: window.__control.volume, plus: window.__control.volumePlusLevel }
  return { seq, atRelease, afterTailClick }
})

const firstChange = hold.seq.find((s) => s.volume !== 0.5)
check('长按 350ms 内不连发（350ms 前音量不变）',
      !!firstChange && firstChange.ms >= 300, `首次变化在 ${firstChange?.ms ?? '∞'}ms`)
check('长按 1400ms 把音量推到 100%', hold.atRelease.volume === 1, `volume=${hold.atRelease.volume}`)
check('到顶后进入音量 Plus 档（只有连发路径能一路爬上去）',
      hold.atRelease.plus >= 2, `plusLevel=${hold.atRelease.plus}`)
const steps = [...new Set(hold.seq.map((s) => `${s.volume}:${s.plus}`))].length
check('连发是多步推进而不是一次跳到底（≥5 个中间态）', steps >= 5, `中间态数=${steps}`)
check('长按松手的尾随 click 没再多加一步',
      hold.afterTailClick.volume === hold.atRelease.volume && hold.afterTailClick.plus === hold.atRelease.plus,
      `松手=${hold.atRelease.volume}:${hold.atRelease.plus} 尾随click后=${hold.afterTailClick.volume}:${hold.afterTailClick.plus}`)
await page.screenshot({ path: `${OUT}/e-hold-plus.png` })

/* ===================== F. 长按后立刻轻按，不能被吞 ===================== */
console.log('\n=== F. 长按结束 450ms 内的「新轻按」必须生效 ===')
/* 这条守的是从快照里带出来的一个真 bug：快照把 suppressClickUntil 写在
   stopVolumeHold() 里，而 startVolumeHold() 第一句又调 stopVolumeHold()，
   于是上一轮长按留下的 holdTriggered 会在**新按压开始的瞬间**把抑制窗续到
   now+450 ⇒ 长按之后紧接着的那次轻按被静默吃掉（表现：按了没反应）。 */
await bootHome()
const swallowed = await page.evaluate(async () => {
  const key = document.querySelector('.side-btn.volume-up')
  const r = key.getBoundingClientRect()
  const cx = r.x + 1, cy = r.y + r.height / 2
  const ev = (t, b) => new PointerEvent(t, {
    bubbles: true, cancelable: true, button: 0, buttons: b,
    clientX: cx, clientY: cy, pointerId: 9, pointerType: 'mouse', isPrimary: true
  })

  // ① 先来一次长按，打开 450ms 的 click 抑制窗
  window.__control.volumePlusLevel = 0
  window.__control.setVolume(0.5)
  window.__control.closeSideVolume()
  await new Promise((res) => requestAnimationFrame(res))
  key.dispatchEvent(ev('pointerdown', 1))
  await new Promise((res) => setTimeout(res, 600))
  window.dispatchEvent(ev('pointerup', 0))
  await new Promise((res) => requestAnimationFrame(res))
  const afterHold = { volume: window.__control.volume, plus: window.__control.volumePlusLevel }

  // ② 把状态压回 0.5 起点（仍在抑制窗内），立刻做一次**新的**完整轻按
  window.__control.volumePlusLevel = 0
  window.__control.setVolume(0.5)
  const tTap = performance.now()
  key.dispatchEvent(ev('pointerdown', 1))
  await new Promise((res) => setTimeout(res, 80))
  window.dispatchEvent(ev('pointerup', 0))
  key.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }))
  await new Promise((res) => requestAnimationFrame(res))

  return {
    afterHold,
    msSinceHoldRelease: Math.round(performance.now() - tTap),
    freshTapVolume: window.__control.volume
  }
})
check('新轻按发生在长按松手后的 450ms 抑制窗内（前置条件成立）',
      swallowed.msSinceHoldRelease < 450, `${swallowed.msSinceHoldRelease}ms`)
check('长按后 450ms 内的新轻按仍然生效（volume 0.50 → 0.60，没被吞）',
      Math.abs(swallowed.freshTapVolume - 0.6) <= 0.001,
      `volume=${swallowed.freshTapVolume}（长按结束于 volume=${swallowed.afterHold.volume}, plus=${swallowed.afterHold.plus}）`)

/* ===================== G. 电源键：短按不弹菜单 ===================== */
console.log('\n=== G. 电源键短按仍走「锁屏」老路径，不弹电源菜单 ===')
await bootHome()
const shortPress = await page.evaluate(async () => {
  const key = document.querySelector('.side-btn.power')
  const r = key.getBoundingClientRect()
  const cx = r.x + 1, cy = r.y + r.height / 2
  const ev = (t, b) => new PointerEvent(t, {
    bubbles: true, cancelable: true, button: 0, buttons: b,
    clientX: cx, clientY: cy, pointerId: 11, pointerType: 'mouse', isPrimary: true
  })
  const baseBefore = window.__system.baseLayer
  key.dispatchEvent(ev('pointerdown', 1))
  await new Promise((res) => setTimeout(res, 120))   // 远低于 500ms 阈值
  window.dispatchEvent(ev('pointerup', 0))
  key.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }))
  await new Promise((res) => requestAnimationFrame(res))
  return {
    baseBefore,
    baseAfter: window.__system.baseLayer,
    menu: window.__control.powerMenuOpen,
    screenOn: window.__system.screenOn
  }
})
check('短按 120ms 不弹电源菜单', shortPress.menu === false, `powerMenuOpen=${shortPress.menu}`)
check('短按仍然执行原来的「锁屏」动作（home → lock）',
      shortPress.baseBefore === 'home' && shortPress.baseAfter === 'lock',
      `${shortPress.baseBefore} → ${shortPress.baseAfter}`)

console.log(`\n===== 实体音量键验收: ${pass} PASS / ${fail} FAIL =====`)
console.log(`截图目录: ${OUT}`)
await browser.close()
process.exit(fail ? 1 : 0)
