import assert from 'node:assert/strict'
import test from 'node:test'
import { SPRING_PRESETS, springStep } from '../src/utils/springMath.js'

/**
 * 堆叠翻卡弹簧（ios-deck）的量化契约。
 *
 * 来源：2026-09-12 第三轮，对 Ricky 提供的参考视频（444×960 / 24fps / 314 帧）逐帧量化。
 * 松手吸附段卡片左缘 120→96→89→82→80→78→74，增量 -14/-10/-7/-7/-2/-1：
 * 拟合 p = 1 - exp(-t/τ) 得 τ ≈ 110ms；随后有过冲回弹（74→67→36→49→57→66→70→74）。
 * 旧值 {80, 17.9} 是 ζ = 1.0 的临界阻尼（无过冲、收尾像指数衰减）→ 视觉「不自然」。
 */
const cfg = SPRING_PRESETS['ios-deck']
const wn = Math.sqrt(cfg.stiffness / cfg.mass)
const zeta = cfg.damping / (2 * Math.sqrt(cfg.stiffness * cfg.mass))

test('ios-deck：ω_n = 14 rad/s、ζ = 0.65（欠阻尼，带轻微弹性）', () => {
  assert.ok(Math.abs(wn - 14) < 0.2, `ω_n = ${wn.toFixed(2)}`)
  assert.ok(Math.abs(zeta - 0.65) < 0.02, `ζ = ${zeta.toFixed(3)}`)
})

test('ios-deck：时间常数 τ = 1/(ζω_n) ≈ 110ms（对齐参考视频实测）', () => {
  const tau = 1 / (zeta * wn)
  assert.ok(Math.abs(tau - 0.11) < 0.012, `τ = ${(tau * 1000).toFixed(0)}ms`)
})

test('ios-deck：理论过冲 5%~10%（「有弹性但不是弹床」）', () => {
  const os = Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta))
  assert.ok(os > 0.05 && os < 0.1, `过冲 ${(os * 100).toFixed(1)}%`)
})

test('ios-deck：数值积分 1→0，过冲落区间且 3τ 内收敛到 5%', () => {
  const state = { x: 1, v: 0 }
  const dt = 1 / 240
  let peak = 1
  let tLastOut = 0 // 最后一次越出 ±5% 的时刻（= 真正收敛，过冲之后）
  for (let t = 0; t < 1.2; t += dt) {
    springStep(state, 0, cfg, dt)
    if (state.x < peak) peak = state.x
    if (Math.abs(state.x) >= 0.05) tLastOut = t
  }
  assert.ok(-peak > 0.05 && -peak < 0.09, `数值过冲 ${(-peak * 100).toFixed(1)}%`)
  assert.ok(tLastOut > 0.2 && tLastOut < 0.5, `收敛到 5% 用时 ${(tLastOut * 1000).toFixed(0)}ms`)
  assert.ok(Math.abs(state.x) < 0.02, `1.2s 后残差 ${state.x.toFixed(4)}`)
})

test('ios-deck：注入初速度不会被放大到失控（越界防爆）', () => {
  const state = { x: 0, v: 6 }
  const dt = 1 / 240
  let peak = 0
  for (let t = 0; t < 1.5; t += dt) {
    springStep(state, 0, cfg, dt)
    peak = Math.max(peak, Math.abs(state.x))
  }
  assert.ok(peak < 1.2, `注入 6 单位/s 的峰值位移 ${peak.toFixed(2)} 应 < 1.2 层`)
})

/* ────────────────────────────────────────────────────────────────────────────
   第十一轮：慢速吸附（ios-deck-settle）—— 慢滑「多了一次不必要的回弹」的根治点。

   Ricky 原话：「慢滑滑动卡卡片多了一个不必要的回弹」。
   改前实测（/tmp/vwork/r11/probe-slow.mjs）：慢滑翻一张后过冲 +5.0px（零动量）/+6.5px（松手时仍在动），
   占行程 5.8%；顺带还让 focus 来回穿过整卡边界，把第 4 张卡剔了又加（DOM 闪现）。
   改法 = 非快甩分支改用本预设（同 ω_n、ζ = 1.0）+ 不注入速度 ⇒ 数学上严格单调。
   ios-deck（ζ=0.65）保留给快甩与退场重排 —— 别把它也改了。 */
const settleCfg = SPRING_PRESETS['ios-deck-settle']
const sWn = Math.sqrt(settleCfg.stiffness / settleCfg.mass)
const sZeta = settleCfg.damping / (2 * Math.sqrt(settleCfg.stiffness * settleCfg.mass))
/** 阶跃 1→0 后，最后一次越出 ±eps 的时刻（≈ 视觉收敛时长） */
const decayTime = (c, eps) => {
  const state = { x: 1, v: 0 }
  const dt = 1 / 240
  let last = 0
  for (let t = 0; t < 2; t += dt) {
    springStep(state, 0, c, dt)
    if (Math.abs(state.x) >= eps) last = t
  }
  return last
}

test('ios-deck-settle：与 ios-deck 同 ω_n、ζ = 1.0（临界阻尼）', () => {
  assert.ok(Math.abs(sWn - wn) < 0.005, `ω_n = ${sWn.toFixed(3)}（ios-deck 是 ${wn.toFixed(3)}）`)
  assert.ok(Math.abs(sZeta - 1) < 0.002, `ζ = ${sZeta.toFixed(4)}`)
})

test('ios-deck-settle：阶跃 1→0 严格不过冲（慢滑「多余回弹」的根治点）', () => {
  const state = { x: 1, v: 0 }
  const dt = 1 / 240
  let worst = 1
  for (let t = 0; t < 1.5; t += dt) {
    springStep(state, 0, settleCfg, dt)
    worst = Math.min(worst, state.x)
  }
  /* 临界阻尼 + 零初速 = 单调渐近 ⇒ 一步都不会越过终点。
     对比：ios-deck（ζ=0.65）同样的积分会到 −0.066（6.6% 过冲，就是被投诉的那一下）。 */
  assert.ok(worst > -0.001, `最深越过终点 ${worst.toFixed(5)}（应 ≥ −0.001）`)
  assert.ok(Math.abs(state.x) < 0.01, `1.5s 后残差 ${state.x.toFixed(5)}`)
})

test('ios-deck-settle：收尾总时长与 ios-deck 同量级（换阻尼不让吸附变急躁/拖沓）', () => {
  const a = decayTime(cfg, 0.02)
  const b = decayTime(settleCfg, 0.02)
  assert.ok(Math.abs(b - a) / a < 0.25, `ios-deck ${(a * 1000).toFixed(0)}ms vs 本预设 ${(b * 1000).toFixed(0)}ms`)
})

test('ios-deck-settle：v0 > ω_n·d 时仍过冲 ⇒ 慢滑分支必须【不注入速度】', () => {
  /* 临界阻尼只保证「零初速」单调，不是「任何初速」都单调：
     从距终点 d 处、以【朝目标】的初速 v0 出发，越过终点的条件是 **v0 > ω_n·d**
     （解 (d + (ω_n·d − v0)t)·e^(−ω_n t) 的零点即得）。
     慢滑的常态恰恰是 d 很小（贴着目标松手），此时 ω_n·d 只有零点几，
     而残余速度仍有 ~1 层/s ⇒ 一注入就又把卡片顶过终点、再收回来 = 那记多余的回弹。
     这就是 settleFocus 的非快甩分支连 initialVelocity 都不传的依据。 */
  const excursion = (d, v0) => {
    const state = { x: d, v: -v0 } // 朝目标（x=0）运动的初速
    const dt = 1 / 240
    let deepest = d
    for (let t = 0; t < 0.8; t += dt) {
      springStep(state, 0, settleCfg, dt)
      deepest = Math.min(deepest, state.x)
    }
    return -deepest // 越过终点（负方向）的深度
  }
  assert.ok(excursion(1, sWn * 3) > 0.05, `初速 ${(sWn * 3).toFixed(0)}（= 3×ω_n·d）⇒ 必须过冲`)
  const near = excursion(0.02, 2.6) // 距终点 0.02 层（≈5px）、残余 2.6 层/s（FLICK_V_MIN 上限）
  assert.ok(near > 0.04, `贴目标松手的过冲 ${near.toFixed(4)} 层（≈${(near * 245).toFixed(1)}px @245px/层）`)
  // 反过来：同样的 d，零初速一点都不过冲（残差只来自积分器的数值噪声）
  assert.ok(excursion(0.02, 0) < 1e-4, '零初速时严格不过冲')
})
