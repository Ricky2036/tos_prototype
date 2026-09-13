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
       → damping = 2ζω_n = 18.2。既有 iOS 的「弹」，又不是弹床。
     ⚠️ 第十一轮起它只服务【快甩】（|v| ≥ FLICK_V_MIN）与退场重排 —— 慢速吸附改走
        ios-deck-settle，见下。别再把慢滑也接到这里：ζ=0.65 的阶跃过冲 6.7%，
        慢滑到位后会多一次「弹回来」。 */
  'ios-deck': { stiffness: 196, damping: 18.2, mass: 1 },
  /* 慢速吸附（第十一轮新增）—— 松手速度 < FLICK_V_MIN 的慢滑、以及触控板横滑的余量吸附。
     与 ios-deck【同 ω_n = 14】，但 ζ = 1.0（临界阻尼）⇒ **零过冲**，单调渐近停住。
     为什么同 ω_n 就够（都是「衰到 1% 所需的时长」，两者几乎相等）：
       · ios-deck（ζ=0.65）  ：包络 e^(−ζωt) ⇒ 4.6/(ζω_n) = 4.6/9.1 ≈ **506ms**；
       · 本预设（ζ=1.0）     ：(1+ωt)e^(−ωt) = 0.01 ⇒ ωt ≈ 6.6 ⇒ 6.6/14 ≈ **471ms**。
     ⇒ 总时长几乎不变，只是把那次多余的过冲拿掉 —— 不会因为换阻尼把吸附变得急躁或拖沓。
     依据（第十一轮探针 /tmp/vwork/r11/probe-slow.mjs，改前实测慢滑松手后的过冲）：
       翻一张（0.65 层、停住再松手，零动量）  +5.0px（占行程 5.8%）
       翻一张（0.55 层、松手时仍在动 0.89 层/s）+6.5px
       连翻两张（1.55 层、仍在动）            +6.5px
       左滑越界（−0.4 层）的 tx 回弹 5.8px     ← 那是需求③ 要的挤压回弹，别一起改掉
     更阴的一层副作用：ζ=0.65 会【来回穿过】整卡边界，使第 4 张卡被 deckVisible 剔除又加回
       （实测「卡3×2段」/「卡4×2段」），观感就是「多闪现了一下」。临界阻尼只穿一次。 */
  'ios-deck-settle': { stiffness: 196, damping: 28, mass: 1 },
  /* 左滑挤压的回弹（第八轮引入，第九轮改口：压在整组【位移】上而不是 scaleX；
     第十轮再加两个同相位的兄弟分量：等比缩小 + 阶梯收紧）。
     ω_n = √300 ≈ 17.3 rad/s、ζ = 16 / (2×17.3) ≈ **0.46** ⇒ 过冲 ≈ **20%**。
     满挤压的位移量由几何推导（= frontX = 77.5px @430，见 deckSqueezeShift；
     第九轮那个写死的 SQUEEZE_SHIFT_FRAC = 0.18 已删除，数值上巧合地几乎相等）：
     回弹瞬间 k 会过冲到 −0.20 ⇒ 整组先【向右弹回 15.5px】再收回，同时卡片短暂胀回 1.7% ——
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
