import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DECK,
  deckClampFocus,
  deckEnterDx,
  deckExposure,
  deckMetrics,
  deckMinLeftEdge,
  deckPhase,
  deckPose,
  deckSqueeze,
  deckSqueezeScale,
  deckSqueezeShift,
  deckSqueezeTighten,
  deckStair,
  deckVisible,
  deckZ,
  TOUCH_STEP_JUMP_PX,
  TOUCH_STEP_RATIO,
  TOUCH_STEP_WARMUP,
  touchStepIsTeleport
} from '../src/utils/switcherDeck.js'

// 430 × 932（本项目基准机型）
const m = deckMetrics(430, 932)
/** 离场卡左缘越过屏宽所需进度（第八轮：右侧槽距 = 0.89 卡宽 ≈ 245px） */
const U_OFF = (m.screenW - m.frontX) / m.exit

test('几何度量：卡宽 275、焦点层水平居中', () => {
  assert.equal(m.cardW, 275)
  assert.equal(m.cardH, 596)
  assert.equal(m.frontX, 77.5)
  assert.equal(m.radius, 29)
  /* 第八轮（需求②）：EXIT_FRAC 是【屏宽】分数 0.57 ⇒ exit = round(430×0.57) = 245px
     = 0.891 卡宽（实测参考图 1080×2363：离场位移 616px / 卡宽 691px = 0.891）。
     注意别把 0.57 和「卡宽分数」混起来 —— 第七轮的 0.64 恰好两套刻度重合（CARD_W_FRAC=0.64），
     本轮起两者必须分开读。 */
  assert.equal(m.exit, 245)
  assert.equal(m.span, 233.75) // = 卡宽 × 0.85（对齐参考视频实测 0.87 卡宽/张）
  /* 第八轮·需求②核心契约：「慢滑时顶部卡片停留位置改为**遮挡 C 位约 10%**」。
     静止态离场卡左缘 = frontX + exit = 322.5px < 居中卡右缘 352.5px
     ⇒ 重叠 30px = **10.91% 卡宽**（参考图逐像素实测 75px / 691px = 10.85%）。
     被本契约取代的第七轮旧值：exit = 275（刚好贴住、零重叠）。 */
  assert.equal(m.frontX + m.exit, 322.5)
  assert.equal(m.frontX + m.cardW, 352.5)
  const overlap = m.frontX + m.cardW - (m.frontX + m.exit)
  assert.equal(overlap, 30)
  assert.ok(
    Math.abs(overlap / m.cardW - 0.1091) < 0.003,
    `遮挡比例 ${((overlap / m.cardW) * 100).toFixed(2)}%（参考实测 10.85%）`
  )
  /* 位移比 exit : 手指行程 = 245 : 233.75 = 1.048（参考实测 272:255 ≈ 1.07） */
  assert.ok(Math.abs(m.exit / m.span - 1.048) < 0.01, `位移比 ${(m.exit / m.span).toFixed(3)}`)
})

test('修正 A：卡片整体在删除按钮上方居中（图标行 + 卡片作为整体）', () => {
  /* 锚点：状态栏底 54（--safe-top）、删除按钮顶 = 932 - 14(home inset) - 50 - 52 = 816
     （第七轮：DOCK_GAP 26 → 50，垃圾桶整体抬高 24px，对齐真机参考图的 ≈65px） */
  assert.equal(m.topInset, 54)
  assert.equal(m.dockTop, 816)
  assert.equal(m.blockH, 24 + 12 + 596) // 图标行 24 + 间隙 12 + 卡高 596
  assert.equal(m.gap, 65) // (816 - 54 - 632) / 2
  assert.equal(m.labelY, 119) // 图标行顶部 = 54 + 65
  assert.equal(m.cardY, 155) // 卡顶 = 119 + 24 + 12
  assert.equal(m.cardY + m.cardH, 751) // 卡底
  /* 「居中」的判定：卡片底到按钮顶的留白 === 状态栏底到图标顶的留白 */
  assert.equal(m.dockTop - (m.cardY + m.cardH), m.gap)
  /* 默认兜底比例（测不到 DOM 时）也要落在 54 附近 */
  assert.equal(deckMetrics(430, 932).topInset, 54)
  /* 第七轮：垃圾桶底边距屏幕底 = home inset + DOCK_GAP，目标 ≈65px（真机参考图实测） */
  assert.equal(m.dockTop + DECK.DOCK_SIZE + DECK.DOCK_GAP + DECK.DEFAULT_HOME_INSET, 932)
  assert.equal(932 - (m.dockTop + DECK.DOCK_SIZE), 64)
})

test('修正 B：所有卡片与顶部卡片上下居中对齐（同一垂直中心）', () => {
  const cy = (p) => p.y + (m.cardH * p.scale) / 2
  for (const a of [0, 0.5, 1, 1.5, 2, 3]) {
    assert.ok(Math.abs(cy(deckPose(a, m, 0)) - m.cardCy) < 1e-9, `层深 ${a} 的垂直中心偏离 cardCy`)
  }
  /* 背景层不再「整体靠上」：顶/底内缩对称（旧版 yStep + 顶对齐会让它整体上浮） */
  const p0 = deckPose(0, m, 0)
  const p1 = deckPose(1, m, 0)
  const insetTop = p1.y - p0.y
  const insetBottom = p0.y + m.cardH - (p1.y + m.cardH * p1.scale)
  assert.ok(Math.abs(insetTop - insetBottom) < 1e-9, `内缩不对称 上${insetTop} / 下${insetBottom}`)
  assert.ok(insetTop > 0, '背景层必须比顶卡小（内缩为正）')
})

test('规则④ 阶梯式缩小 + 露出越来越少', () => {
  const exp = [1, 2, 3].map((k) => deckExposure(k, m.cardW))
  // 严格递减，且首层露出明显大于末层
  assert.ok(exp[0] > exp[1] && exp[1] > exp[2], `露出序列 ${exp.join('/')}`)
  assert.ok(exp[0] > 8 * exp[2], `首/末 = ${(exp[0] / exp[2]).toFixed(2)}`)
  /* 第六轮：逐帧量测参考视频 → 新来卡每滑一张右移 51~56px（444 屏 / 293 卡宽 = 0.17~0.21）。
     本项目卡宽 275 → exp1 = stair(1) 应落在 47~57px。旧值 33px 被判「一次只能滑走一张」。 */
  assert.ok(exp[0] >= 47 && exp[0] <= 57, `exp1=${exp[0]}（期望 52 = 0.19 卡宽）`)
  assert.ok(Math.abs(exp[0] - 52.25) <= 1, `exp1=${exp[0]}`)
  assert.ok(Math.abs(exp[1] - 16.72) <= 1.2, `exp2=${exp[1]}`)
  assert.ok(Math.abs(exp[2] - 5.34) <= 1.2, `exp3=${exp[2]}`)
  // 缩放按层等比递减（第七轮：只到 MAX_DEPTH 层 —— 更深层在 deckPose 里被夹住）
  const scales = [0, 1, 2].map((k) => deckPose(k, m, 0).scale)
  for (let k = 1; k < scales.length; k++) assert.ok(scales[k] < scales[k - 1], `scale ${scales}`)
  assert.ok(Math.abs(scales[2] - 0.8836) < 0.01, `${scales[2]}`)
  assert.ok(Math.abs(scales[2] - DECK.SCALE_DECAY ** 2) < 1e-9)
})

test('规则③ 最深层左边缘不出屏（静态 + 牵连最大时都不越界）', () => {
  assert.ok(deckMinLeftEdge(m) > 0, `minLeft=${deckMinLeftEdge(m)}`)
  let minLeft = Infinity
  for (let x = 0; x <= 1.0001; x += 0.01) {
    for (const a of [0, 0.5, 1, 1.5, 2, 2.5, 3]) {
      minLeft = Math.min(minLeft, deckPose(a, m, x).x)
    }
  }
  assert.ok(minLeft >= 0, `牵连后最小左边缘 ${minLeft.toFixed(1)}`)
})

test('规则① 层级只由索引决定，永不随焦点变化', () => {
  const base = [0, 1, 2, 3].map(deckZ)
  for (const focus of [0, 0.37, 1, 2.4, 3]) {
    for (let i = 0; i < 4; i++) assert.equal(deckZ(i), base[i], `focus=${focus} i=${i}`)
  }
  // i 越小越靠上（严格）
  for (let i = 1; i < 4; i++) assert.ok(deckZ(i) < deckZ(i - 1))
})

test('规则⑤ 最多三层：3 个槽位 + 正在离场的卡，第 4 层起不渲染', () => {
  /* 第七轮：MAX_DEPTH 3 → 2（Ricky 需求⑨「默认堆叠状态从四层改为三层」） */
  assert.equal(DECK.MAX_DEPTH, 2)
  assert.ok(deckVisible(2), '第 3 层（最深槽位）必须渲染')
  assert.ok(!deckVisible(2.01), '超过第 3 个槽位即剔除')
  assert.ok(!deckVisible(3), '第 4 张在层深 3 处必须剔除')
  /* 第八轮（需求②）：exit = 245（= 0.89 卡宽）后，离场卡走到
     a ≈ -(430 − 77.5)/245 = **-1.4388** 才越过右屏边，
     剔除界同步从 -1.30 放到 **-1.46**（= DECK.EXIT_CULL）——
     deckVisible 用的是【严格大于】，门槛必须 ≥ 1.4388 才不会剔掉还露着的卡。 */
  assert.ok(deckVisible(-1), '刚换出去的那张要留在屏内（左缘 322.5，露出 107.5px）')
  assert.ok(deckVisible(-1.4387), '还剩一点点在屏内时绝不能提前剔除（闪断高危区）')
  assert.ok(deckVisible(-1.46 + 1e-9), '刚好卡在剔除界上仍要渲染（左缘 ≈435 已出屏，但边界要保守）')
  assert.ok(!deckVisible(-1.46), '越过界限才剔除')
  assert.ok(!deckVisible(-2), '再往外一层必须剔除')
  /* ⚠️ 调用点（AppSwitcher 的 renderedCards）第十一轮起喂的不是裸 poseFocus，
     而是 cullFocus —— 焦点落进整卡附近 0.06 层的磁吸窗口时改用【目标整卡】：
     focus 吸附到整卡是渐近的（临界阻尼永不穿过），裸用它的话第 4 张卡会等到
     springSettled 把 x 置成整卡（实测 +714ms）才出现 = 「停稳后又闪出一张」。
     本文件的契约仍按裸 deckVisible 写（磁吸只改调用点，不改阈值本身）。 */
})

test('规则② 下层缩小后藏在上层下方（左边缘钉住 + 居中缩放 + 变暗）', () => {
  const p0 = deckPose(0, m, 0)
  const p1 = deckPose(1, m, 0)
  const p2 = deckPose(2, m, 0)
  // 缩放锚点是左上角，所以左边缘严格单调左移 → 背景层只被上层盖住左露出条
  assert.ok(p1.x < p0.x && p2.x < p1.x)
  // 「缩小后藏在上层下方」= 顶边比上层低（居中内缩，不是整体上浮）
  assert.ok(p1.y > p0.y && p2.y > p1.y)
  assert.ok(p1.bright < p0.bright && p2.bright < p1.bright)
  // 背景层缩放后右边缘不越过焦点层右边缘（真正「藏在上层卡片下方」）
  const right = (p) => p.x + m.cardW * p.scale
  assert.ok(right(p1) < right(p0) && right(p2) < right(p1))
})

test('规则⑥⑦ 层间位移按层递减（由 stair 的几何级数天然给出，不再叠加任何包络）', () => {
  // 两端 = 纯阶梯槽位 → 层边界零跳变（拖满整层时必须正好落进槽位）
  for (const x of [0, 1e-9]) {
    for (const k of [0, 1, 2]) {
      const p = deckPose(k, m, x)
      assert.ok(Math.abs(p.x - (m.frontX - deckStair(k, m.cardW))) < 1e-6, `x=${x} k=${k} 未归位`)
      assert.ok(Math.abs(p.scale - Math.pow(DECK.SCALE_DECAY, k)) < 1e-9)
    }
  }

  /* 一整层的净位移（第七轮：三层堆叠 → 只到 d = 2）：
       travel[0] = 顶卡退出（frontX → frontX + exit，量级 ~234px）
       travel[d] = 第 d 层被推进一级槽位 = stair(d) − stair(d−1)  */
  const travel = [0, 1, 2].map((d) => deckPose(d - 1, m, 1 - 1e-9).x - deckPose(d, m, 0).x)

  for (let k = 1; k < travel.length; k++) {
    assert.ok(travel[k] < travel[k - 1], `位移未按层递减：${travel.map((v) => v.toFixed(1))}`)
  }
  assert.ok(travel[2] > 0, '最深层也必须真的往右走')

  /* 层间比例 = STAIR_DECAY 的幂：第二层 : 第三层 = 1 : 0.32。
     这是 stair 的几何级数决定的，改 STAIR_DECAY 就会同步变。 */
  assert.ok(Math.abs(travel[2] / travel[1] - DECK.STAIR_DECAY) < 1e-9, `第三层/第二层 = ${(travel[2] / travel[1]).toFixed(4)}`)
  /* 顶卡（离场卡）与第二层的量级差：第六轮逐帧实测参考视频 = 272 : 55 ≈ 4.9 : 1。
     本项目（第七轮·批次 4）= exit : stair(1) = 275 : 52.25 ≈ 5.3 : 1。
     第五轮是 378.4 : 33 ≈ 11.5 : 1 —— 正是 Ricky 口中的「一次只能滑走一张」。 */
  {
    const ratio = travel[0] / travel[1]
    assert.ok(ratio > 4 && ratio < 5.5, `顶卡/第二层 = ${ratio.toFixed(2)}（参考实测 4.9）`)
  }
})

test('第六轮·连锁：整条链从第一帧起与手指同速推进（u = x，不再后加载）', () => {
  /* 第五轮 u = x^1.6 ⇒ 前 1/3 段背景层几乎不动（x=0.2 时只走了 4%），
     叠加 stair(1)=33px，观感就是「只有顶卡在动」。
     第六轮 u = x：离场卡位移 = cardW·x（第七轮·批次 4），背景层也从第一帧就动。 */
  assert.equal(DECK.TRANS_POW, 1)
  assert.equal(DECK.EXIT_POW, 1)
  for (const x of [0.02, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
    const { u } = deckPhase(x)
    assert.ok(Math.abs(u - x) < 1e-12, `u ≠ x：${u}`)
    // 背景层从第一帧就在推进（旧实现 x=0.02 时推进量 ≈ 0）
    const moved = deckPose(1 - x, m, x).x - deckPose(1, m, 0).x
    assert.ok(moved > 0, `x=${x} 背景层未动`)
    /* 「不抢跑」：归一化进度上，背景层 (stair(1) − stair(1−x))/stair(1)
       永远不超过离场卡的进度 x（因为 stair 是凹/凸单调的几何级数）。 */
    const bgProgress = moved / deckExposure(1, m.cardW)
    assert.ok(bgProgress <= x + 1e-9, `x=${x} 背景层抢跑：${(bgProgress * 100).toFixed(1)}% > ${(x * 100).toFixed(0)}%`)
  }
  /* 第八轮（需求②）改写的契约：离场卡一整层的位移 = **245px = 0.89 卡宽**，
     而一次换卡的手指行程 = 233.75px ⇒ 位移比 245 : 233.75 = **1.048**，
     略快于手指、与参考实测的 272 : 255 ≈ 1.07 同量级。
     停下的位置 = frontX + 245 = 322.5px < 居中卡右缘 352.5 ⇒ **遮挡约 10.9% 卡宽**。
     （第七轮是 275 = 一张卡宽 = 刚好贴住；本轮按 Ricky 需求②有意改为遮挡。） */
  const exitTravel = deckPose(-(1 - 1e-9), m, 1 - 1e-9).x - m.frontX
  assert.ok(Math.abs(exitTravel - 245) < 0.5, `离场位移 ${exitTravel.toFixed(2)}（期望 245 = 0.89 卡宽）`)
  assert.ok(
    Math.abs(exitTravel / m.cardW - 0.891) < 0.005,
    `离场位移/卡宽 = ${(exitTravel / m.cardW).toFixed(3)}（参考实测 0.891）`
  )
  const travelRatio = exitTravel / m.span
  assert.ok(travelRatio > 1 && travelRatio < 1.25, `离场位移/手指行程 = ${travelRatio.toFixed(3)}（参考实测 1.07）`)

  /* 层边界零跳变：x→1⁻ 时第 1 层正好落进槽位；下一层的 x=0 就是同一个位姿 */
  const eps = 1e-6
  const arriving = deckPose(eps, m, 1 - eps) // 第 1 层即将成为焦点
  const settled = deckPose(0, m, 0) // 它成为焦点后的位姿
  assert.ok(Math.abs(arriving.x - settled.x) < 0.5, `层边界位移跳变 ${(arriving.x - settled.x).toFixed(3)}px`)
  assert.ok(Math.abs(arriving.scale - settled.scale) < 0.01, `层边界缩放跳变 ${arriving.scale - settled.scale}`)
})

test('第五轮·定律三 不得回退：整段拖动（含顶卡出屏之后）背景层只许向右', () => {
  /* 改前实测：慢拖 1.25 层，卡 1 左缘 峰值 156.1 → 78.7，单次回退 77.4px，
     且随后还有 118.7 → 81.3 的二次回退 —— 就发生在顶卡出屏之后。
     根因是牵连释放包络必须在一层末尾归零。本轮直接去掉牵连。 */
  for (const d of [1, 2, 3]) {
    let prevX = -Infinity
    let prevS = -Infinity
    for (let i = 0; i <= 2000; i++) {
      const x = i / 2000
      const p = deckPose(d - x, m, x)
      assert.ok(
        p.x >= prevX - 1e-9,
        `depth${d} 位置回退：x=${x.toFixed(4)} ${prevX.toFixed(2)} → ${p.x.toFixed(2)}`
      )
      assert.ok(p.scale >= prevS - 1e-12, `depth${d} 缩放回退：x=${x.toFixed(4)}`)
      prevX = p.x
      prevS = p.scale
    }
  }

  /* 断言盲区修复（第六轮改写）：第五轮的那段断言以「顶卡出屏点」为锚，
     但第六轮把离场卡改成「一次换卡只走到右屏边内侧」（a = -1，仍在屏内），
     出屏要等第二次换卡（a = -2）。所以这里改成直接断言两件事：
       ① 离场卡在整层里（a: 0 → -1）严格单调右移，一帧不回退；
       ② 一次换卡后它仍在屏内露出，第二次换卡才真正出屏。 */
  let prevExit = -Infinity
  for (let i = 0; i <= 2000; i++) {
    const x = i / 2000
    const p = deckPose(-x, m, x)
    assert.ok(
      p.x >= prevExit - 1e-9,
      `离场卡回退：x=${x.toFixed(4)} ${prevExit.toFixed(2)} → ${p.x.toFixed(2)}`
    )
    prevExit = p.x
  }
  const parked = deckPose(-1, m, 0)
  const peek = m.screenW - parked.x
  assert.ok(peek > 60 && peek < 170, `换一张后离场卡露出 ${peek.toFixed(1)}px（参考实测 ≈96px）`)
  assert.ok(deckPose(-2, m, 0).x >= m.screenW, `换两张后仍未出屏：${deckPose(-2, m, 0).x.toFixed(1)}`)
})

test('第八轮·需求②：静止态离场卡遮挡 C 位约 10%（参考图逐像素实测 10.85%）', () => {
  /* 需求②原话：「慢滑时顶部卡片停留位置改为**遮挡 C 位约 10%**（附图 1080×2363）」。
     参考图逐像素量测（/tmp/vwork/r8/edges.py，多行中位数梯度）：
       C 卡 [171, 862] 宽 691；离场卡左缘 787 ⇒ 重叠 75px = 10.85%，位移 616px = 0.891 卡宽。
     本项目取值 exit = 245px（0.891 卡宽）⇒ 重叠 30px / 275 = **10.91%**。

     被本契约取代的第七轮旧断言（方向性反转）：
       ✗ 「静止时两卡刚好贴住（间隙 0）」 → ✓ 「静止时离场卡压住 C 位右缘 ≈11%」
     仍然不变的：拖动全程两卡【永不分离开缝】（overlap 恒 ≥ 0），且单调收缩。 */
  const right = (p) => p.x + m.cardW * p.scale
  let minOverlap = Infinity
  let maxOverlap = -Infinity
  const tail = []
  for (let i = 0; i <= 500; i++) {
    const x = i / 500
    const top = deckPose(-x, m, x) // 正在离场的那张（原 C 位）
    const below = deckPose(1 - x, m, x) // 顶上来的那张
    const overlap = right(below) - top.x
    minOverlap = Math.min(minOverlap, overlap)
    maxOverlap = Math.max(maxOverlap, overlap)
    if (i >= 490) tail.push(overlap)
  }
  assert.ok(minOverlap >= -1e-6, `拖动中两卡分开了 ${(-minOverlap).toFixed(2)}px（应始终粘连）`)
  assert.ok(maxOverlap < m.cardW, `起始重叠超过一张卡宽 ${maxOverlap.toFixed(1)}px → 布局异常`)
  /* 末尾 2% 行程内重叠量已经收敛到稳态附近（x=1 处精确为 30） */
  for (const v of tail) {
    assert.ok(v >= 30 - 1e-9 && v <= 36, `静止前重叠 ${v.toFixed(2)}px（应收敛到 30）`)
  }
  /* 单调收缩：不允许「先分开再合上」那种反直觉的往复 */
  for (let k = 1; k < tail.length; k++) {
    assert.ok(tail[k] <= tail[k - 1] + 1e-9, `末尾重叠非单调：${tail[k - 1].toFixed(2)} → ${tail[k].toFixed(2)}`)
  }
  /* 静止态离场卡仍在屏内（左缘 322.5 < 430），露出 = 430 − 322.5 = 107.5px */
  const parked = deckPose(-1, m, 0)
  assert.ok(parked.x < m.screenW, `静止态离场卡左缘 ${parked.x.toFixed(1)} 已出屏`)
  assert.ok(Math.abs(parked.x - (m.frontX + m.exit)) < 1e-9, '静止态左缘 ≠ frontX + exit')
  assert.ok(
    Math.abs(m.screenW - parked.x - 107.5) < 1e-9,
    `露出应为 107.5px，实为 ${(m.screenW - parked.x).toFixed(1)}`
  )
})

test('第五轮：位移与放大「同时」发生（同相位，不是先位移后放大）', () => {
  /* depth1 在整层内位置与缩放都严格单调，且推进节奏一致 ——
     这是「一边被拖着走、一边放大」的量化判据。 */
  const pts = [0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => {
    const x = Math.min(v, 1 - 1e-9)
    return deckPose(1 - x, m, x)
  })
  for (let k = 1; k < pts.length; k++) {
    assert.ok(pts[k].x > pts[k - 1].x, `位置未推进：x=${k}`)
    assert.ok(pts[k].scale > pts[k - 1].scale, `缩放未推进：x=${k}`)
  }
  const totalX = pts[5].x - pts[0].x
  const totalS = pts[5].scale - pts[0].scale
  /* 「同时」的严格判据：找出「位移刚好走到 25%」的那个 x，此刻缩放也必须
     已经走过 ≥20%。如果是「先位移、后放大」，这里会接近 0。 */
  const frac = (p) => ({ x: (p.x - pts[0].x) / totalX, s: (p.scale - pts[0].scale) / totalS })
  let syncAt = null
  for (let i = 1; i <= 400; i++) {
    const v = (i / 400) * 0.9
    const p = deckPose(1 - v, m, v)
    const f = frac(p)
    if (f.x >= 0.25) {
      syncAt = { v, f }
      break
    }
  }
  assert.ok(syncAt, '位移在整层内没走到 25%？')
  assert.ok(
    syncAt.f.s >= 0.2,
    `位移走到 25% 时缩放只走了 ${(syncAt.f.s * 100).toFixed(0)}% → 两者不同步（先位移后放大）`
  )
  assert.ok(syncAt.f.x < 0.35, `位移跳太快：${(syncAt.f.x * 100).toFixed(0)}%`)
  /* 反过来：缩放不许领先位移太多（否则就是「先放大后位移」） */
  assert.ok(syncAt.f.s - syncAt.f.x < 0.15, `缩放比位移超前 ${((syncAt.f.s - syncAt.f.x) * 100).toFixed(0)}%`)

  // 松手落点：新焦点卡回到屏幕正中、满尺寸
  assert.ok(Math.abs(deckPose(0, m, 1).x - m.frontX) < 1e-3, `松手落点 ${deckPose(0, m, 1).x}`)
  assert.ok(Math.abs(deckPose(0, m, 1).scale - 1) < 1e-6)

  // 背景层右缘永不越出屏幕
  let maxRight = -Infinity
  for (let i = 0; i <= 400; i++) {
    const x = i / 400
    for (const d of [1, 2, 3]) {
      const p = deckPose(d - x, m, x)
      maxRight = Math.max(maxRight, p.x + m.cardW * p.scale)
    }
  }
  assert.ok(maxRight <= m.screenW + 0.5, `背景层右缘越界到 ${maxRight.toFixed(1)}px`)
})

test('背景层任意时刻都不重叠（层间间距恒 > 2px）', () => {
  /* 第七轮：三层堆叠 → 只检查 3 个槽位之间的 2 处间距 */
  for (const x of [0, 0.25, 0.5, 0.75, 1]) {
    for (const focus of [0, 0.25, 0.5, 0.75, 1]) {
      const xs = [0, 1, 2].map((i) => deckPose(i - focus, m, x).x)
      for (let k = 1; k < xs.length; k++) {
        assert.ok(
          xs[k - 1] - xs[k] > 2,
          `x=${x} focus=${focus} 第 ${k} 层与第 ${k + 1} 层重叠（间距 ${(xs[k - 1] - xs[k]).toFixed(2)}px）`
        )
      }
    }
  }
})

test('交接零跳变：整层拖动后新焦点卡正好落在屏幕正中', () => {
  const leaving = deckPose(-1, m, 0)
  const incoming = deckPose(0, m, 0)
  assert.equal(incoming.x, m.frontX)
  assert.equal(incoming.scale, 1)
  /* 第六轮：退出卡在换一张后【仍停在右屏边内侧】（对齐参考视频实测露出 ≈96px），
     换第二张才真正出屏 —— 旧契约「一张就出屏」是 Ricky 否掉的「独自飞走」。 */
  assert.ok(leaving.x < m.screenW, `退出卡左边缘 ${leaving.x.toFixed(1)} 应仍 < 屏宽 ${m.screenW}`)
  assert.ok(m.screenW - leaving.x > 60, `退出卡露出只有 ${(m.screenW - leaving.x).toFixed(1)}px`)
  assert.ok(deckPose(-2, m, 0).x > m.screenW, '换第二张后应已出屏')
  // 退出卡保持满尺寸满亮度（规则①：走到屏幕外一直是「顶层那张」）
  assert.equal(leaving.scale, 1)
  assert.equal(leaving.bright, 1)
  /* 第六轮：线性斜坡 ⇒ 严格 1:1 跟手（0.25 层 = 满量程的 25%；旧 1.6 次幂只有 ~11%） */
  const q = deckPose(-0.25, m, 0)
  const quarter = (q.x - m.frontX) / (leaving.x - m.frontX)
  assert.ok(Math.abs(quarter - 0.25) < 1e-9, `0.25 层只走了 ${(quarter * 100).toFixed(1)}%（应 25%）`)
})

test('越界阻尼：两端都压扁且不失控', () => {
  // n = 4 张卡 → 合法区间 0..3
  assert.equal(deckClampFocus(1.5, 4), 1.5)
  assert.equal(deckClampFocus(3, 4), 3)
  assert.ok(deckClampFocus(3.5, 4) < 3.5 && deckClampFocus(3.5, 4) > 3)
  assert.ok(deckClampFocus(-1, 4) > -1 && deckClampFocus(-1, 4) <= 0)
  assert.ok(deckClampFocus(-99, 4) >= -0.6)
  assert.ok(deckClampFocus(99, 4) <= 3.6)
})

test('阶梯单调性：层深连续变化时位移平滑（无阶跃）', () => {
  let prev = deckPose(0, m, 0).x
  for (let a = 0.05; a <= 3.0001; a += 0.05) {
    const x = deckPose(a, m, 0).x
    assert.ok(x <= prev + 1e-9, `a=${a.toFixed(2)} 位移回升 ${prev}→${x}`)
    assert.ok(prev - x < 12, `a=${a.toFixed(2)} 单步跳变过大 ${(prev - x).toFixed(2)}px`)
    prev = x
  }
})

test('卡宽为 0（未测量）时不抛异常', () => {
  const z = deckMetrics(0, 0)
  const p = deckPose(1, z, 0)
  assert.equal(Number.isFinite(p.x), true)
  assert.equal(deckStair(2, 0), 0)
})

/* ══════════════════ 第八轮（Ricky 2026-09-13）新增契约 ══════════════════ */

test('第十轮·需求③：左滑挤压 = 位移 + 等比缩小 + 阶梯收紧（三分量共用一个 k）', () => {
  /* 第九轮的契约是「只有整组左移、宽度恒定」，第十轮被 Ricky 推翻：
       「默认位置左滑挤压动画不对，需要同时做横向挤压和缩放（缩小底层卡片大小以及漏出的多少）」

     第九轮为什么量错（方法错，不是数值错）：
       v3edge.py 只在【单行】扫竖边、且把左缘当成「最左的那条边」——
       最深帧前卡左缘已经跑到屏外 −26，配对被吸附到了相邻卡的特征上，
       于是量出「宽恒 302」，据此判定为刚性平移。
     第十轮改量【纵向剖面】（/tmp/vwork/r10/v10col.py，逐行 run-length）：
       参考视频 53416f88…mp4 前卡 上缘 131→147、下缘 785→769（上下等量内缩 16px）
       ⇒ 高 654 → 622 = **0.951**，即前卡在缩小，而不是刚性平移。
     右缘 376→275（−101）在「左缘钉住 + 缩 0.951」下自洽：
       纯位移 −86.2，缩 302×0.049 ≈ 14.8 ⇒ 右缘 = 377 − 86.2 − 14.8 = 276 ✓

     于是三个分量（都由同一个 k 驱动，见 deckPose）：
       ① 位移 deckSqueezeShift → 前卡左缘落到屏幕左缘
       ② 等比缩小 deckSqueezeScale → 0.951（前卡 + 背景卡露出条的高）
       ③ 阶梯收紧 deckSqueezeTighten → 槽距 52:17:5 → 23:8:2（「漏出的多少」） */
  assert.equal(DECK.SQUEEZE_SPAN, 0.35, '满挤压所需的越界层数')
  assert.equal(DECK.SQUEEZE_SHIFT_FRAC, undefined, '第九轮的写死屏宽分数必须已被删除')

  /* —— k 本身：形状与第九轮一致（这一层契约没变） —— */
  assert.equal(deckSqueeze(0), 0, '未越界时挤压进度 = 0')
  assert.equal(deckSqueeze(DECK.SQUEEZE_SPAN), 1, '满挤压进度 = 1')
  assert.equal(deckSqueeze(0.6), 1, '越界更深也封顶在 1（不许无限挤）')
  let prev = -0.001
  for (let o = 0; o <= 0.6; o += 0.02) {
    const k = deckSqueeze(o)
    assert.ok(k >= prev - 1e-12, `挤压进度非单调：o=${o.toFixed(2)} ${prev} → ${k}`)
    assert.ok(k <= 1 + 1e-12, `挤过头了：${k}`)
    prev = k
  }

  /* —— ① 位移：0 → −(screenW − cardW)/2 = −frontX —— */
  const m = deckMetrics(430, 932)
  assert.equal(deckSqueezeShift(430, m.cardW, 0), 0)
  assert.ok(Object.is(deckSqueezeShift(430, m.cardW, 0), 0), '不能用 −0（CSS 与 Object.is 都会露馅）')
  assert.equal(deckSqueezeShift(430, m.cardW, 1), -(430 - m.cardW) / 2)
  assert.ok(deckSqueezeShift(430, m.cardW, 1) < 0, '方向必须向左')
  assert.equal(-deckSqueezeShift(430, m.cardW, 1), m.frontX,
    '满行程必须恰好 = frontX ⇒ 前卡视觉左缘落到屏幕左缘（0）')
  /* ⚠️ 位移【不】与等比缩小系数 g 耦合：堆叠卡是 transform-origin: 0 0（左缘钉住），
     frontX 与 g 无关。写成 −(screenW − cardW·g)/2 会多推 cardW·0.049/2 ≈ 6.75px。 */
  assert.equal(deckSqueezeShift(430, m.cardW, 1), -m.frontX,
    '位移量必须与 g 无关（第九/十轮交界处写错过一次）')
  /* 回弹过冲（k<0）不封顶：整组向右弹回去 */
  assert.ok(deckSqueezeShift(430, m.cardW, -0.2) > 0, '过冲（k<0）时整组必须向右弹回')
  /* 上过冲封顶：左缘贴住屏左缘已是行程上限，再往左就是白送出屏 */
  assert.equal(deckSqueezeShift(430, m.cardW, 99), deckSqueezeShift(430, m.cardW, 1))
  assert.equal(deckSqueezeShift(430, m.cardW, -99), deckSqueezeShift(430, m.cardW, -0.35))

  /* —— ② 等比缩小：0.951（实测 622/654） —— */
  assert.equal(DECK.SQUEEZE_SCALE_MAX, 0.049)
  assert.equal(deckSqueezeScale(0), 1, '不挤压时系数必须严格 = 1（否则静止态就会缩）')
  assert.ok(Math.abs(deckSqueezeScale(1) - 0.951) < 1e-9, '满挤压 = 0.951')
  let pg = Infinity
  for (let k = -0.35; k <= 1.35; k += 0.05) {
    const g = deckSqueezeScale(k)
    assert.ok(g <= pg + 1e-12, `缩小系数必须随 k 单调不增：k=${k.toFixed(2)} ${pg} → ${g}`)
    pg = g
  }
  assert.equal(deckSqueezeScale(99), deckSqueezeScale(1.35), 'k 上钳到 1.35（不许把卡缩没）')
  assert.equal(deckSqueezeScale(-99), deckSqueezeScale(-0.35), 'k 下钳到 −0.35（回弹有限）')

  /* —— ③ 阶梯收紧：槽距 52:17:5 → 23:8:2 —— */
  assert.equal(DECK.SQUEEZE_TIGHTEN, 0.55)
  assert.equal(deckSqueezeTighten(0), 1, '不挤压时槽距必须严格不变')
  assert.ok(Math.abs(deckSqueezeTighten(1) - 0.45) < 1e-9, '满挤压 = 0.45')
  /* deckStair 给的是【相对 frontX 的累计偏移】（52.25 / 68.97 / 74.32），不是逐层间距
     ⇒ 相邻差才是「露出多少」：52.25 / 16.72 / 5.35（第四轮实测的 52 : 17 : 5）。 */
  const gaps = (f) => {
    const s = [1, 2, 3].map((d) => deckStair(d, m.cardW) * f)
    return [s[0], s[1] - s[0], s[2] - s[1]]
  }
  const g1 = gaps(1)
  assert.deepEqual(g1.map((v) => Math.round(v)), [52, 17, 5], '静止槽距必须复现第四轮实测')
  const gf = gaps(deckSqueezeTighten(1))
  assert.deepEqual(gf.map((v) => Math.round(v)), [24, 8, 2], '满挤压槽距 ⇒「漏出的多少」变小')
  /* 收紧是【等比】的，不是只收首层：三层间距必须同乘 0.45 */
  g1.forEach((v, idx) =>
    assert.ok(Math.abs(gf[idx] / v - 0.45) < 1e-9, `第 ${idx + 1} 层间距没等比收紧`))
  assert.ok(gf[0] < g1[0], '挤压后首层露出条必须变窄')

  /* —— 三分量在 deckPose 里的接线：同一个 m.sq 驱动，且前卡左缘不动 —— */
  const ms = { ...m, sq: 0 }
  const mf = { ...m, sq: 1 }
  const rest = deckPose(0, ms, 0)
  const full = deckPose(0, mf, 0)
  assert.equal(rest.x, full.x, 'deckPose 不管整组位移（那是 trackStyle 的事）⇒ 前卡 x 不变')
  assert.ok(full.scale < rest.scale, '前卡必须一起缩小')
  assert.ok(Math.abs(full.scale / rest.scale - 0.951) < 1e-9, '前卡的缩放比 = 0.951')
  /* 背景卡：左缘由 stair·tight 定位 ⇒ 挤压后必然向右（往中间）拢 */
  for (const d of [1, 2, 3]) {
    assert.ok(deckPose(d, mf, 0).x > deckPose(d, ms, 0).x,
      `层深 ${d} 的卡片在挤压时必须往中间拢`)
    assert.ok(deckPose(d, mf, 0).scale / deckPose(d, ms, 0).scale < 1,
      `层深 ${d} 的卡片在挤压时必须一起缩小`)
  }
  /* 垂直中心不变量（第十轮新守）：deckPose 的 y 必须让每层垂直中心恒等于 cardCy ——
     上下缘对称内缩（实测 131→147 / 785→769）全靠这一条。 */
  for (const d of [0, 1, 2]) {
    for (const sq of [0, 1]) {
      const p = deckPose(d, { ...m, sq }, 0)
      const cy = p.y + (m.cardH * p.scale) / 2
      assert.ok(Math.abs(cy - m.cardCy) < 1e-6,
        `层深 ${d} / sq ${sq} 的垂直中心偏离 cardCy：${cy} vs ${m.cardCy}`)
    }
  }
})

test('第八轮·需求⑦：左滑越界不再产生「最底部卡片消失」（层深恒 ≤ MAX_DEPTH）', () => {
  /* 根因（代码级）：旧实现把越界量灌进 focus（deckClampFocus 允许到 −0.6），
     而 renderedCards 用 deckVisible(i − focus) 过滤 —— focus = −0.6 时最深层
     i=2 的层深 = 2.6 > MAX_DEPTH(2) ⇒ 直接判为不可见、收掉 DOM。
     修法：位姿焦点冻结在 max(0, focus)，越界量转成【整组左移】（第九轮改口径；第八轮是 scaleX）。
     本测试守的就是「冻结后，最深层在任何越界量下都 still visible」。 */
  for (const raw of [-0.1, -0.35, -0.6, -99]) {
    const focus = deckClampFocus(raw, 5) // 与 AppSwitcher 同一条夹取
    const poseFocus = Math.max(0, focus)
    for (let i = 0; i < DECK.MAX_DEPTH + 1; i++) {
      const a = i - poseFocus
      assert.ok(deckVisible(a), `raw=${raw} ⇒ focus=${focus}，第 ${i} 层（a=${a}）被剔除了`)
    }
  }
})

test('第八轮·需求⑤：卡片组横向滑入/滑出的位移 = 0.78 屏宽（参考视频实测 345/444）', () => {
  /* 参考视频 52b4f2fa…mp4 逐帧量测（/tmp/vwork/r8/vedge.py）：
     C 卡右缘 30 → 375（位移 345px），左邻卡边缘与之严格同步（间距恒 113px）
     ⇒ 整组刚性平移；345 / 444 = 0.777。 */
  assert.equal(DECK.EXIT_SLIDE_FRAC, 0.78)
  assert.equal(deckEnterDx(430), -335)
  assert.equal(deckEnterDx(444), -346)
  assert.ok(Math.abs(-deckEnterDx(444) / 444 - 0.779) < 0.003, '参考实测 0.777')
  /* 方向：藏在【左侧】（负值）—— 入场自左滑入、退场向左滑出，同一条轨迹 */
  assert.ok(deckEnterDx(430) < 0)
  assert.ok(Math.abs(deckEnterDx(430)) < 430, '不能藏得太远（否则入场时前段完全看不见）')
})

test('第八轮·需求⑥：跟手 XY 双轴 + 弹性挤压的参数边界', () => {
  /* 参考视频 4c4231b0…mp4 实测：窗口中心 x 225 → 326（+101px 横向跟随）、
     宽高比 0.477 → 0.447（−6% 纵向拉伸）→ 0.479（回弹）。 */
  assert.ok(DECK.FOLLOW_X > 0, 'X 轴必须跟手（旧实现恒为 0）')
  assert.ok(DECK.FOLLOW_X <= 0.6, '跟随比例过大 → 卡片会被手指甩出槽位太多')
  assert.ok(DECK.SQUASH_MAX >= 0.06 && DECK.SQUASH_MAX <= 0.14, `形变 ${DECK.SQUASH_MAX} 应覆盖实测 6% 并留余量`)
  assert.ok(DECK.OVER_RISE_FRAC > 0, '越过满量程后必须继续上移（旧实现冻在槽位中心）')
  /* 形变必须【非等比且反向】—— 否则不是挤压拉伸，只是又缩了一次 */
  const s = 0.64
  const def = DECK.SQUASH_MAX
  const sx = s * (1 - def)
  const sy = s * (1 + def)
  assert.ok(sx < s && sy > s, '必须一轴压一轴伸')
  assert.ok(Math.abs(sx * sy - s * s * (1 - def * def)) < 1e-9, '近似面积守恒')
})

test('第二十一轮·需求：坐标连续性判据（touchStepIsTeleport）', () => {
  /* 复现形状（/tmp/vwork/r21/probe-sameid.mjs）：两指相距 120px、单指 12~13px/帧。
     前 3 笔是真实手指步长，第 4 笔坐标无 pointerdown 直接瞬移 120px。 */
  const warm = [12, 13, 12]
  assert.equal(touchStepIsTeleport(120, warm), true, '3 笔正常步长之后的 120px 瞬移必须判出')
  assert.equal(touchStepIsTeleport(-120, warm), true, '方向无关')
  assert.equal(touchStepIsTeleport(120, []), true, '巨步兜底：≥112px 热身期也判（一帧 6720px/s 物理不可能）')
  /* 两指来回抽动：被吸收的那一笔记 0 ⇒ 参考量仍停在真实手速上，第二笔也认得出 */
  assert.equal(touchStepIsTeleport(-120, [12, 13, 12, 0]), true, '抽动的第二笔同样要判出')
  /* 真实手指不会被误判 */
  assert.equal(touchStepIsTeleport(13, [12, 13, 12]), false, '正常步长')
  assert.equal(touchStepIsTeleport(56 - 0.01, [12, 13, 12]), false, '不足绝对下限')
  assert.equal(touchStepIsTeleport(60, [12, 13]), false, '热身期只有 2 笔 ⇒ 不判（触摸 slop 释放帧）')
  assert.equal(touchStepIsTeleport(60, [12, 13, 12, 14]), true, '3 笔之后 60px = 真实步长的 4 倍 ⇒ 判出')
  /* 渐进加速：参考量（取 max）跟着抬 ⇒ 真实加速不触发 */
  assert.equal(touchStepIsTeleport(60, [13, 25, 40]), false, '13→25→40 之后再来 60 只是 1.5 倍')
  assert.equal(touchStepIsTeleport(90, [13, 25, 40]), false, '90 也不到 3×40')
  assert.equal(touchStepIsTeleport(130, [13, 25, 40]), true, '130 ≥ 3×40 ⇒ 才判')
  /* 常量自洽 */
  assert.equal(TOUCH_STEP_RATIO, 3)
  assert.equal(TOUCH_STEP_WARMUP, 3)
  assert.ok(TOUCH_STEP_JUMP_PX >= 44 && TOUCH_STEP_JUMP_PX <= 64, '绝对下限须高于单指实测步长、远低于指距')
  /* 半窗口（60fps 一帧 = 16.7ms）下的物理自洽：下限 56px ⇔ 3360px/s，
     指距 120px ⇔ 7200px/s —— 后者超出指尖极限，前者仍在人手可及范围内。 */
  assert.ok(TOUCH_STEP_JUMP_PX / 16.7 < 4, '下限对应的速度不能低于真实快滑（否则会误判真手指）')
})
