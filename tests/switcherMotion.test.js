import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MOTION,
  createMotion,
  stepMotion,
  clampTarget,
  createAccumulator,
  accumulate
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
