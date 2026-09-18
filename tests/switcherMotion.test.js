import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MOTION,
  createMotion,
  stepMotion,
  clampTarget,
  createAccumulator,
  accumulate,
  createDirVote,
  voteDir,
  DIR_WINDOW,
  INERTIA,
  inertiaExtra
} from '../src/utils/switcherMotion.js'

/* 逐帧推进到停（带帧数上限，避免回归时死循环把 CI 挂住） */
function run(st, dtMs, maxFrames = 1200, cfg = MOTION) {
  let frames = 0
  while (frames < maxFrames) {
    frames += 1
    if (stepMotion(st, dtMs, cfg)) return { frames, settled: true }
  }
  return { frames, settled: false }
}
/* 按 e2e 的输入语义驱动累积器：输入是 deltaX（自然滚动下往右为负），
   而 accumulate 收到的是【位移增量】= −deltaX。这里直接用位移增量。 */
function feed(list, startPx = 0) {
  const st = createAccumulator(startPx)
  const outs = [st.acc]
  for (const d of list) outs.push(accumulate(st, d))
  return { st, outs }
}

test('第二十四轮·运动核心：力随距离衰减 + 力固定（远距离顶到 VMAX，近距离按 d 收缩）', () => {
  const st = createMotion(0)
  st.target = 6
  stepMotion(st, 16.7)
  assert.equal(st.v, MOTION.VMAX, '远距离时速度必须顶到上限（力固定）')

  const st2 = createMotion(0)
  st2.target = 0.02
  stepMotion(st2, 16.7)
  assert.ok(st2.v > 0 && st2.v < MOTION.VMAX * 0.4, '近距离时速度远低于上限（力随距离衰减）')

  const dt = 16.7 / 1000
  const tau = MOTION.SETTLE_TAU_MS / 1000
  const expect = (0.02 * (1 - Math.exp(-dt / tau))) / dt
  assert.ok(Math.abs(st2.v - expect) < 1e-6, `v 必须等于一阶解析解 ${expect.toFixed(4)}`)
})

test('第二十四轮·运动核心：一阶模型严格单调 —— 任何 dt 都不过冲（结构上不可能抖）', () => {
  for (const dt of [1, 8, 16.7, 33, 50]) {
    for (const [from, to] of [[0, 1], [3, 0], [2, 4], [1, 1.5]]) {
      const st = createMotion(from)
      st.target = to
      const dir = Math.sign(to - from)
      let prev = st.x
      /* 上限给足：dt=1ms 且行程 3 层时，仅 VMAX 限速段就要 375 帧，再加指数收尾 ~42 帧 */
      for (let i = 0; i < 1200 && !stepMotion(st, dt); i++) {
        if (dir > 0) assert.ok(st.x >= prev, `dt=${dt} ${from}→${to} 第 ${i} 帧不得后退`)
        if (dir < 0) assert.ok(st.x <= prev, `dt=${dt} ${from}→${to} 第 ${i} 帧不得前进`)
        if (dir > 0) assert.ok(st.x <= to + 1e-9, `dt=${dt} ${from}→${to} 第 ${i} 帧不得越过目标`)
        if (dir < 0) assert.ok(st.x >= to - 1e-9, `dt=${dt} ${from}→${to} 第 ${i} 帧不得越过目标`)
        prev = st.x
      }
      assert.equal(st.x, to, `dt=${dt} ${from}→${to} 必须落到目标`)
    }
  }
})

test('第二十四轮·运动核心：绳子绷直 —— 到位时 x 钉在 target、v 归零（不留残余动量）', () => {
  const st = createMotion(0)
  st.target = 2
  const r = run(st, 16.7)
  assert.ok(r.settled, '必须收敛')
  assert.equal(st.x, 2)
  assert.equal(st.v, 0, '到位后速度必须是 0（否则会继续推 = 抖）')
})

test('第二十四轮·运动核心：收尾段时长 —— 3τ(180ms) 到 95%，600ms 内到位', () => {
  /* 取代第一版的「输入期 / 收尾期两个时间常数」：跟手期是零延迟直推（不经过 stepMotion），
     所以 stepMotion 只剩一个时间常数 —— 这条就是它的时长契约。 */
  const st = createMotion(0)
  const d = 0.3 // 初始速度 d/τ = 5 层/秒 < VMAX ⇒ 纯指数段（不被限速段改变形状）
  st.target = d
  let f95 = null
  let frames = 0
  while (frames < 1200) {
    frames += 1
    const settled = stepMotion(st, 16.7)
    if (f95 == null && st.x >= 0.95 * d) f95 = frames
    if (settled) break
  }
  assert.ok(f95 != null, '必须走到 95%')
  const ms95 = f95 * 16.7
  assert.ok(ms95 > 120 && ms95 < 280, `3τ = 180ms 量级，实测 ${ms95.toFixed(0)}ms`)
  assert.ok(frames * 16.7 < 600, `整段收尾必须 < 600ms，实测 ${(frames * 16.7).toFixed(0)}ms`)
})

test('第二十四轮·运动核心：目标一变速度立刻由新距离决定（没有独立动量能把它往反方向带）', () => {
  const st = createMotion(0)
  st.target = 4
  for (let i = 0; i < 6; i++) stepMotion(st, 16.7)
  assert.equal(st.v, MOTION.VMAX, '先朝正方向全速冲')
  st.target = 0 // 目标落到当前位置【之后】⇒ 立刻反向
  stepMotion(st, 16.7)
  assert.ok(st.v < 0, '目标改变方向时速度必须立刻改向（v 是 d 的函数，不是独立状态）')
  const r = run(st, 16.7)
  assert.ok(r.settled)
  assert.equal(st.x, 0)
})

test('第二十四轮·运动核心：静止输入不启动（x === target ⇒ 一帧判定到位）', () => {
  const st = createMotion(3)
  assert.equal(stepMotion(st, 16.7), true, 'x === target 时必须一帧判定到位')
  assert.equal(st.v, 0)
})

test('第二十四轮·运动核心：dt 异常（0 / 负数 / 巨大）都不破坏单调与收敛', () => {
  const st = createMotion(0)
  st.target = 1
  assert.equal(stepMotion(st, 0), false, 'dt=0 不推进也不误判到位')
  assert.equal(st.x, 0)
  stepMotion(st, -5)
  assert.equal(st.x, 0, '负 dt 视为 0')

  const st2 = createMotion(0)
  st2.target = 1
  let n = 0
  while (!stepMotion(st2, 5000) && n < 100) {
    n += 1
    assert.ok(st2.x <= 1 + 1e-9, '巨大 dt 也不许越过目标')
  }
  assert.ok(n < 100, '巨大 dt 下仍必须收敛')
  assert.equal(st2.x, 1)
})

test('第二十四轮·运动核心：目标夹取 —— 边界处立即停（不越界、不回弹）', () => {
  assert.equal(clampTarget(-1, 5), 0)
  assert.equal(clampTarget(9, 5), 4)
  assert.equal(clampTarget(2.4, 5), 2.4)
  assert.equal(clampTarget(1, 1), 0, '只有一张卡时上下界都是 0')
  assert.equal(clampTarget(3, 0), 0, '没有卡时不越界')
  const st = createMotion(0)
  st.target = clampTarget(99, 5)
  const r = run(st, 16.7)
  assert.ok(r.settled)
  assert.equal(st.x, 4, '夹到末卡即停')
})

test('第二十四轮·需求：触控板噪声 —— 录屏真实幅度(±1.25px)零残摆，±3px 也只残摆 1px', () => {
  /* 录屏（第二十三轮）实测：噪声 ±5 物理px = 2.5 CSS px 峰峰 ⇒ 幅度 ±1.25 CSS px。
     滞后跟随器的不变量是 |target − acc| ≤ 1px ⇒ 幅度 ≤ 1px 的交替噪声被【完全冻结】。 */
  const sim = (A, taps = 40) => {
    const st = createAccumulator(0)
    accumulate(st, 60) // 起手一笔（等价于录屏里的真实滑动）
    let mn = Infinity
    let mx = -Infinity
    for (let i = 0; i < taps; i++) {
      const a = accumulate(st, i % 2 === 0 ? -A : A)
      if (i < 2) continue // 跳过瞬态
      mn = Math.min(mn, a)
      mx = Math.max(mx, a)
    }
    return mx - mn
  }
  assert.equal(sim(1.25), 0, `±1.25px（真实噪声）必须完全冻结，实测残摆 ${sim(1.25)}px`)
  assert.ok(sim(3) <= MOTION.SUBMIT_PX + 1e-9,
    `±3px 的残摆必须 ≤ SUBMIT_PX = ${MOTION.SUBMIT_PX}px，实测 ${sim(3).toFixed(3)}px`)
  const f = createAccumulator(0)
  accumulate(f, 60)
  assert.equal(f.acc, 60, '第一笔（手势起手）严格 1:1')
})

test('第二十四轮·需求：真实微调不被吃掉（反向只滞后 1px，远小于 23 轮的 7px）', () => {
  const { outs } = feed([40, -3])
  assert.ok(Math.abs(outs[2] - (outs[1] - 2)) < 1e-9, `反向 3px ⇒ 走 2px（实测 ${outs[1] - outs[2]}px）`)
  const b = feed([100, -5])
  assert.ok(Math.abs(b.outs[1] - b.outs[2] - 4) < 1e-9, '反向 5px ⇒ 走 4px')
  const c = feed([100, -120])
  assert.ok(Math.abs(c.outs[1] - c.outs[2] - 119) < 1e-9, '反向 120px ⇒ 走 119px（不是「卡死」）')
})

test('第二十四轮·契约：手势第一笔严格 1:1；此后同向只滞后 1px（不累积）', () => {
  const a = feed([60])
  assert.equal(a.outs[1], 60, '单笔 60px 必须全给（e2e 的同向 1:1 契约）')
  /* ⚠️ 这里是本轮【有意的口径改变】，不是回归：第一版「同向全额提交」要求 12+8+0.4 = 20.4。
     滞后跟随器给 19.4 —— 少的那 1px 就是它的不变量 |target − acc| ≤ 1px 本身。
     换成「同向全额」的代价是反向也要多挂 1px 的账（实测反向 120px 只走 118px，
     而且挂账量会随历史摇摆），既不好推理也不好解释。1px 是屏幕表达不出来的那一格。 */
  const b = feed([12, 8, 0.4])
  assert.equal(b.outs[3], 19.4, '12+8+0.4 ⇒ 19.4（只滞后 1px，且不随距离累积）')
  assert.ok(b.st.target - b.outs[3] <= MOTION.SUBMIT_PX + 1e-9)
})

test('第二十四轮·不变量：|target − acc| ≤ SUBMIT_PX 恒成立（滞后不会累积）', () => {
  const st = createAccumulator(0)
  const seq = [60, -3, 3, -3, 3, -60, 120, -1, 0.4, -7, 2.5, -2.5, 90, -45, 45]
  let minGap = Infinity
  let maxGap = -Infinity
  for (const d of seq) {
    accumulate(st, d)
    const gap = st.target - st.acc
    minGap = Math.min(minGap, gap)
    maxGap = Math.max(maxGap, gap)
  }
  assert.ok(Math.abs(minGap) <= MOTION.SUBMIT_PX + 1e-9 && Math.abs(maxGap) <= MOTION.SUBMIT_PX + 1e-9,
    `滞后必须恒在 ±${MOTION.SUBMIT_PX}px 内，实测 [${minGap}, ${maxGap}]`)
  /* 长距离同向拖动只滞后 1px —— 不会随距离累积成「越拖越偏」 */
  const long = createAccumulator(0)
  accumulate(long, 1)
  let last = long.acc
  for (let i = 0; i < 200; i++) last = accumulate(long, 1)
  assert.ok(long.target - last <= MOTION.SUBMIT_PX + 1e-9, `200px 同向拖动后滞后仍 ≤ 1px（实测 ${long.target - last}px）`)
})

test('第二十四轮·契约：accumulate 的边界情形', () => {
  const st = createAccumulator(5)
  assert.equal(accumulate(st, 0), 5, 'd=0 时状态与返回值都不变')
  assert.equal(st.target, 5)
  assert.equal(st.moving, false, 'd=0 不算「已经动过」')

  const st2 = createAccumulator(0)
  accumulate(st2, 40) // 第一笔：全额
  const p0 = st2.acc
  accumulate(st2, -1) // 反向恰好 1px（= 阈值）⇒ 不提交
  assert.equal(st2.acc, p0, '反向不超过 SUBMIT_PX 时不动（保护亚像素噪声）')
  accumulate(st2, -0.5) // 累计反向 1.5px ⇒ 只补超出那 0.5px
  assert.ok(Math.abs(st2.acc - (p0 - 0.5)) < 1e-9, `越过阈值后只走超出的一段（实测 ${p0 - st2.acc}px）`)
  const st3 = createAccumulator(0)
  accumulate(st3, -7)
  assert.equal(st3.acc, -7, '反方向的第一笔同样 1:1')
})

/* ──────────────────────────────────────────────────────────────────────────────
 * 第二十六轮：手势方向投票（活取自 /tmp/vwork/r27/probe-wheel.mjs 的逐帧取证）
 * ──────────────────────────────────────────────────────────────────────────── */

test('第二十六轮·契约：慢滑的 1px 笔必须被认成横向手势（旧判据 100 笔全丢、位移精确为 0）', () => {
  const v = createDirVote()
  /* 真实触控板慢滑：120Hz、每笔 deltaX = −1、无纵向分量 */
  const got = []
  for (let i = 0; i < 100; i++) {
    const px = -1
    const py = 0
    if (px !== 0) got.push(voteDir(v, px, py) === true)
  }
  assert.equal(got.length, 100)
  assert.ok(got.every(Boolean), '每一笔都必须判为横向 —— 1px 是屏幕能表达的最小位移，不该有幅度门槛')
})

test('第二十六轮·契约：纵向抖动压过横向的单笔【不该】被整笔丢弃（窗口投票的意义）', () => {
  const v = createDirVote()
  /* W3 形状：−3/1 与 −1/1 交替。第 2、4、6… 笔逐笔看是纵向占优，
     旧判据 `|px| > |py|` 会把它们全丢掉 ⇒ 通过率只剩一半。 */
  const res = []
  for (let i = 0; i < 20; i++) res.push(voteDir(v, i % 2 === 0 ? -3 : -1, 1))
  assert.ok(res.every(Boolean), '一整个手势内的每一笔都应通过（窗口看的是整段方向，不是单笔）')
})

test('第二十六轮·契约：纯纵向滚动不被拦，且不污染投票窗口', () => {
  const v = createDirVote()
  assert.equal(voteDir(v, 0, -20), null, 'px = 0 不参与投票（调用方直接放行，不 preventDefault）')
  assert.equal(v.xs.length, 0, 'px = 0 的笔不能进窗口')
  /* 斜着滚（纵向占优）：Σ|dx| = 8 vs Σ|dy| = 160 ⇒ 永远不该判成横向 */
  const r = []
  for (let i = 0; i < 20; i++) r.push(voteDir(v, 1, -20))
  assert.ok(r.every((x) => x === false), '每笔都应放行给卡片内列表（不得 preventDefault）')
})

test('第二十六轮·契约：先竖滚再横滑，必须在窗口长度内翻过来（不能永久锁死）', () => {
  const v = createDirVote()
  for (let i = 0; i < 30; i++) voteDir(v, 1, -20)
  assert.equal(voteDir(v, 1, -20), false, '竖滚期间一直是纵向')
  let i = 0
  while (i < 40 && voteDir(v, -6, -1) === false) i++
  assert.ok(i < DIR_WINDOW, `改用横滑后必须在 ${DIR_WINDOW} 笔内翻成横向（实测第 ${i + 1} 笔）`)
})

test('第二十六轮·契约：窗口只保留最近 DIR_WINDOW 笔', () => {
  const v = createDirVote()
  for (let i = 0; i < 50; i++) voteDir(v, -2, 0)
  assert.equal(v.xs.length, DIR_WINDOW)
  assert.ok(Math.abs(v.sx - DIR_WINDOW * 2) < 1e-9, 'Σ|dx| 只累计窗内')
  assert.equal(v.sy, 0)
})

test('第二十六轮·契约：偏离 45° 的斜滑按纵向放行（DIR_RATIO > 1 的意义）', () => {
  const v = createDirVote()
  const r = []
  for (let i = 0; i < 8; i++) r.push(voteDir(v, -3, -3))
  assert.ok(r.every((x) => x === false), '正好 45° 没有确定性优势 ⇒ 当纵向放行（切换器内没有可横滚内容）')
})

test('第二十六轮·回归：先横滑再「明确纵滚」必须放行（窗口跨笔污染；e2e 实测踩到）', () => {
  const v = createDirVote()
  assert.equal(voteDir(v, -60, 0), true, '第一笔横滑：应被拦（preventDefault）')
  /* 紧接着一笔明确纵滚。若不设单笔否决线，窗口 Σ|dx| = 70 vs Σ|dy| = 60 ⇒ 误判成横向，
     卡内列表的滚动就被抢走了（e2e「斜向（纵向占优）放行」由 PASS 变 FAIL）。 */
  assert.equal(voteDir(v, 10, -60), false, '明确纵滚（|dy| > 3×|dx|）必须一票否决')
  /* 但它仍然记进窗口 ⇒ 连续纵滚能把窗口翻成纵向 */
  const r = []
  for (let i = 0; i < 8; i++) r.push(voteDir(v, 1, -20))
  assert.ok(r.every((x) => x === false), '连续纵滚之后窗口必须翻成纵向')
})

test('第二十六轮·契约：小幅纵抖不触发否决（否则又回到「慢滑拨不动」）', () => {
  const v = createDirVote()
  /* probe-wheel.mjs 的 W7 逐字形状：dx = −(1 + (i%5===0 ? 2 : i%3===0 ? 1 : 0))、
     dy = i%4===0 ? 2 : i%3===0 ? 1 : 0。最大 ay/ax = 2/1 = 2 < 3 ⇒ 一笔都不该被否决。
     （注意「第一笔 dx=1 且 dy=2」这种形状本来就会被判成纵向 —— 那是正确的：
       它自己的纵向分量就是占优的，代价是 1px，窗口下一笔就翻回来了。） */
  const r = []
  for (let i = 0; i < 40; i++) {
    const dx = -(1 + (i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0))
    const dy = i % 4 === 0 ? 2 : i % 3 === 0 ? 1 : 0
    r.push(voteDir(v, dx, dy))
  }
  assert.ok(r.every(Boolean), `每一笔都应通过（实测 W7 净位移 2.000 张 / 反号 0）`)
})

/* ══════════ 第二十六轮·需求⑤：触摸端惯性投影 ══════════
   Ricky 原话：「手机端滑动卡片不支持快速滚动，要支持根据滑动速度的惯性滑动效果。」
   纯函数 + 单测的理由与 accumulate / voteDir 相同：这条判据决定「一次甩能翻几张」，
   是用户能一眼看出的量，必须能在不跑浏览器的前提下回归。 */
test('第二十六轮·惯性：门槛处连续（|v| = V_MIN ⇒ 0，不跳一张）', () => {
  assert.equal(inertiaExtra(INERTIA.V_MIN), 0, '恰在门槛上不追加')
  assert.equal(inertiaExtra(INERTIA.V_MIN - 0.001), 0)
  assert.equal(inertiaExtra(0), 0)
  /* 略高于门槛必须是「很小的追加」而不是一张 —— 否则门槛两侧会跳变，
     慢滑的临界样本会随机多翻一张（第十一轮需求⑤的反例）。 */
  const justAbove = inertiaExtra(INERTIA.V_MIN + 0.1)
  assert.ok(justAbove > 0 && justAbove < 0.1, `刚过门槛只追加 ${justAbove} 层（< 0.1）`)
})

test('第二十六轮·惯性：单调不减且与符号无关（方向由调用方给）', () => {
  const vs = [2.6, 3, 4, 5, 6, 7.2, 9.4, 14, 30]
  const out = vs.map((v) => inertiaExtra(v))
  for (let i = 1; i < out.length; i++) assert.ok(out[i] >= out[i - 1] - 1e-12, `v=${vs[i]} 不得比 v=${vs[i - 1]} 小`)
  for (const v of vs) assert.equal(inertiaExtra(-v), inertiaExtra(v), '只取速度大小，方向不在本函数职责内')
})

test('第二十六轮·惯性：上限恒为 MAX（再快也不「一甩到底」）', () => {
  for (const v of [9.4, 14, 30, 100, 1000]) {
    assert.equal(inertiaExtra(v), INERTIA.MAX, `v=${v} 层/秒也应恰好夹在 MAX=${INERTIA.MAX}`)
  }
})

test('第二十六轮·惯性：参考视频 V4 的快甩峰值（7.2 层/秒）≈ 多翻 2 张', () => {
  /* 7.2 层/秒 = 1680px/s ÷ span 233.75px（第七轮逐帧量测 V4 的峰值，见 FLICK_V_MIN 注释）。
     TAU = 0.42 就是照着「这个速度 ≈ 追加 1.9 层」定的。 */
  const e = inertiaExtra(7.2)
  assert.ok(Math.abs(e - 1.9) < 0.1, `实测 ${e.toFixed(3)} 层（期望 ≈1.9）`)
  /* 落点 = round(cur + extra)：从 0 号卡（cur ≈ 0.1，只推出 24px）快甩 ⇒ 第 2 张 */
  assert.equal(Math.round(0.1 + e), 2, '0 号卡上快甩应落到第 2 张（跨过 1 号）')
  /* 边界不变量：落点仍由调用方夹取 —— 末卡快甩必须停在末卡（不能越界） */
  const last = 4
  assert.equal(Math.max(0, Math.min(last, Math.round(4.2246 + e))), last, '末卡快甩仍停在末卡')
})

test('第二十六轮·惯性：慢滑（|v| < V_MIN）追加恒 0 —— 需求⑤「慢滑一次一张」原样守住', () => {
  for (const v of [0, 0.5, 1.2, 2.0, 2.59]) {
    assert.equal(inertiaExtra(v), 0, `v=${v} 层/秒（低于门槛 ${INERTIA.V_MIN}）不追加`)
  }
})

test('第二十六轮·惯性：自定义参数生效（纯函数，不改全局常量）', () => {
  const cfg = { V_MIN: 1, TAU: 1, MAX: 5 }
  assert.equal(inertiaExtra(0.5, cfg), 0)
  assert.equal(inertiaExtra(3, cfg), 2)
  assert.equal(inertiaExtra(100, cfg), 5, 'MAX 夹取')
  assert.equal(INERTIA.TAU, 0.42, '默认配置不被就地修改')
})
