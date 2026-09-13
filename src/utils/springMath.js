/* 弹簧物理：半隐式欧拉积分 + 四档 iOS 预设 */

export const SPRING_PRESETS = {
  /* 跟手偏移的归零（第九轮需求⑤「松手后归位跳变」）。
     关键在于【必须比交接更快归零】，弹得好看是次要的：
     交接判定 = openP ≥ 0.999 且 followFree ≥ 0.999（见 AppSwitcher 的 settledOne）。
     · ios-gentle（openP）= {180,24} → ω_n 13.4、ζ 0.894 ⇒ 越 0.999 约 250ms；
     · 本预设 = {500,38} → ω_n 22.4、ζ 0.85 ⇒ 越 0.999 约 160ms ⇒ 确定抢在交接之前。
     旧值用 ios-deck（ω_n 14、ζ 0.65 ⇒ ≈360ms）比 openP 还慢，交接时偏移只走到 ~0.93，
     残余 50px 被硬切（/tmp/vwork/r9/probe-settle.mjs 实测）——
     旧注释写的「ios-deck 比 openP 更快，天然抢在交接前面」是错的。 */
  'ios-snappy': { stiffness: 500, damping: 38, mass: 1 },
  'ios-bouncy': { stiffness: 320, damping: 28, mass: 1 },
  'ios-gentle': { stiffness: 180, damping: 24, mass: 1 },
  /* 堆叠翻卡专用 —— 由参考视频逐帧量化反推（2026-09-12 第三轮）。
     旧值 {80, 17.9} 是临界阻尼（ζ = 1.0）→ 收尾像指数衰减，没有弹性，视觉「不自然」。
     实测参考视频松手吸附段（444×960 / 24fps）：左缘 120→96→89→82→80→78→74，
     增量 -14/-10/-7/-7/-2/-1，拟合 p = 1-exp(-t/τ) 得 τ ≈ 110ms；
     随后有轻微过冲回弹（74→67→36→49→57→66→70→74）。
     → ω_n = 1/(ζ·τ) = 14 rad/s（stiffness = 196），取 ζ = 0.65（过冲 ≈ 6.7%）
       → damping = 2ζω_n = 18.2。既有 iOS 的「弹」，又不是弹床。 */
  'ios-deck': { stiffness: 196, damping: 18.2, mass: 1 },
  /* 左滑挤压的回弹（第八轮引入，第九轮改口：压在整组【位移】上而不是 scaleX）。
     ω_n = √300 ≈ 17.3 rad/s、ζ = 16 / (2×17.3) ≈ **0.46** ⇒ 过冲 ≈ **20%**。
     配合第九轮的 SQUEEZE_SHIFT_FRAC = 0.18（满挤压 = 整组左移 0.18 屏宽 @430 → 77.5px）：
     回弹瞬间 k 会过冲到 −0.20 ⇒ 整组先【向右弹回 15.5px】再收回 ——
     参考视频 53416f88…mp4 的往复振荡就是这个手感（实测左移曲线 0→25→62→81→94→101 往复）。
     比 ios-bouncy（ζ=0.78，过冲 1.7%）明显得多，又不会变成弹床。 */
  'ios-squish': { stiffness: 300, damping: 16, mass: 1 }
}

/**
 * 逐帧推进弹簧。
 * @param state {{ x: number, v: number }} 当前位移与速度（会被原地修改）
 * @param target number 目标值
 * @param cfg {{ stiffness, damping, mass }}
 * @param dt number 秒
 */
export function springStep(state, target, cfg, dt) {
  // 防大步长爆炸：拆成最多 1/120s 的小步
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)))
  const h = dt / steps
  for (let i = 0; i < steps; i++) {
    const force = -cfg.stiffness * (state.x - target) - cfg.damping * state.v
    state.v += (force / cfg.mass) * h
    state.x += state.v * h
  }
}

/** 弹簧是否已静止（阈值放宽，避免高速注入时收尾拖沓） */
export function springSettled(state, target) {
  return Math.abs(state.v) < 0.02 && Math.abs(state.x - target) < 0.001
}
