/**
 * 多任务切换器的【位置推进器】—— 单一写者模型。
 *
 * ── 为什么要有这个文件（第二十四轮，架构级重做）────────────────────────────
 * Ricky 原话：「完蛋！越改越差了。我觉得你需要跳出来全局看一看，抖动的根本原因是什么？
 *   为什么通知堆叠不会抖动？……等到滑动到终点就像绳子绷直了应该立即停止。
 *   跳出来尝试从根上解决问题吧，不要反复打补丁，写成屎山代码了！」
 *
 * 根因（在 AppSwitcher.vue 里数出来的，不是猜的）：位置量 `focus` 原来有【9 个写者】——
 *   useSpring 每帧写 + 5 个 `focusSnap`（零过渡直写）+ 3 个 `focusToIndex`（启动弹簧），
 *   另有 2 个「猜手势结束」的定时器（WHEEL_IDLE / settleTimer）。致命处是 `snapTo` 会
 *   掐掉正在跑的弹簧，却【不重置 spring.target】⇒ 弹簧还朝老目标推、输入又逐笔覆盖回来
 *   ⇒ 两个写者交替赢 = 抖。19/20/21/22/23 五轮加的 owner 守卫、瞬移守卫、7px 死区、
 *   越界外甩判据，**全是给这个多写者模型贴的创可贴**（换个输入设备就够不着）。
 *
 * 对照组（Ricky 的观察，完全正确）：通知堆叠（NotificationCenter）不抖，因为它的位置
 *   `scrollTop` 由【浏览器】持有，JS 只在 updateStacking 里【读】它、算纯函数派生的
 *   translateY/scale ⇒ **单写者 + 无反馈回路 + 跑在合成器线程**。
 *
 * 本模型 = 把「位置」收敛成单写者，物理形式照 Ricky 的描述来：
 *   「滑动的力是固定的、会跟随滑动距离衰减，最终停下来。等到滑动到终点
 *    就像绳子绷直了应该立即停止。」
 * ⇒ 收尾段速度 = 剩余距离 / 时间常数，并【有上限】（力固定 + 随距离衰减），
 *   位置只由它积分 ⇒ **一阶系统，数学上不可能过冲、不可能振荡**；到位即钉死（绳子绷直）。
 *
 * 契约（改动前先读这四条）：
 *   ① 【只有两处写 x】：收尾期的 `stepMotion`，以及跟手期的 `setInput` 型直推
 *      （看 AppSwitcher 的 setInput / settleTo / focusSnap 三个出口）。任何输入都只走
 *      这三个出口之一，绝不在别处写位置。
 *   ② 【没有独立的动量状态】。v 永远是「当前 d 的函数」，不是能反向驱动 x 的独立量。
 *      这是「结构上不可能抖」的全部来源：d 归零 ⇒ v 归零 ⇒ 停。
 *   ③ 【跟手期零延迟】。输入是外部时钟（手指 / 触控板），它比 rAF 更早到达 —— 所以跟手期
 *      位置与目标【同一步落位】，不引入任何滞后；`stepMotion` 只服务【收尾段】。
 *      （我原本按「允许一帧延迟」实现过一版：实测快速划动时 VMAX 限速把位置压在
 *       8 层/秒以下，手指 17 层/秒时位置落后 0.3 层 ≈ 70px；而 rAF 调度本身还引入
 *       0~20ms 的随机相位滞后 ⇒ 中段几何断言变成 ±13px 的抖动源。撤掉。）
 *   ④ 收尾段【只有一个时间常数】SETTLE_TAU_MS：60ms ⇒ 3τ = 180ms 到 95%，
 *      与参考视频的吸附时长（ω_n 11.7~13.5 rad/s）同量级。
 *
 * ⚠️ 别在这里加「死区 / 低通 / EMA / 过冲 / 回弹」。要治输入噪声请用 accumulate（见下），
 *    它的判据是「物理上不可表达」而不是「幅度阈值」。
 */

/** 运动参数。单位：TAU_MS 毫秒，VMAX 层/秒，EPS_X 层，SUBMIT_PX CSS 像素。 */
export const MOTION = {
  /* 收尾段（松手吸附 / 触控板收尾）的减速时间常数。60ms ⇒ 3τ = 180ms 到 95%；
     配合 VMAX 限速段后整段收尾约 250~400ms，与参考视频的吸附时长同量级。 */
  SETTLE_TAU_MS: 60,
  /* 速度上限 = Ricky 说的「固定的力」。8 层/秒 ≈ 1870px/s，
     略高于参考视频 V4 的峰值 1680px/s（快甩实测 7.2 层/秒）。
     它只在【收尾段】生效：半层最大剩余距离下，初始速度 d/τ = 8.33 层/秒会被压到 8。 */
  VMAX: 8,
  /* 到位判据。0.0015 层 ≈ 0.35px —— 物理亚像素；到这一格就钉死（绳子绷直）。 */
  EPS_X: 0.0015,
  /* 反向提交阈值（CSS 像素）。见 accumulate 的长注释。 */
  SUBMIT_PX: 1,
  /* 单帧 dt 上限（ms）。掉帧保护：一帧最多按 50ms 积分。 */
  DT_MAX_MS: 50
}

/** 运动状态。x = 当前焦点，target = 目标焦点，v = 速度（层/秒，仅收尾段有意义）。 */
export function createMotion(x = 0) {
  return { x, target: x, v: 0 }
}

/**
 * 推进【收尾段】一帧 —— 一阶系统的解析解 + 固定力上限。
 *
 * ⚠️ 用解析解（指数衰减）而不是显式欧拉：显式欧拉在 dt ≥ τ 时会退化
 * （`x += (d/τ)·dt` 一步就把 d 走满甚至走过头），而 SETTLE_TAU_MS = 60 与一帧 16.7ms
 * 已在同一量级 —— 掉一帧（dt = 50ms）就会明显劣化。解析解对任意 dt 都稳定、单调、
 * 且天然不过冲。
 *
 * @returns {boolean} true = 已到位（调用方应停止 rAF 循环）
 */
export function stepMotion(st, dtMs, cfg = MOTION) {
  const dt = Math.max(0, Math.min(dtMs, cfg.DT_MAX_MS)) / 1000
  if (dt === 0) return false
  const tau = cfg.SETTLE_TAU_MS / 1000
  const d = st.target - st.x

  /* 两件事同时成立：
     · 「力随距离衰减」= 本帧想走的距离是 d·(1 − e^(−dt/τ))（一阶解析解）；
     · 「力固定」= 本帧最多走 VMAX·dt（限速段）。
     取较小者 ⇒ 远距离匀速冲、近距离指数收 —— 就是 Ricky 描述的物理。 */
  const decayStep = d * (1 - Math.exp(-dt / tau))
  const maxStep = cfg.VMAX * dt
  const applied = Math.max(-maxStep, Math.min(maxStep, decayStep))
  st.x += applied
  st.v = applied / dt

  const remaining = st.target - st.x
  /* 绳子绷直：① 越过目标（只可能来自限速段 + 很大的 dt）② 进入到位死区
     ⇒ 一律【钉在目标】、速度归零、且不许有任何残余量。 */
  if (remaining * d <= 0 || Math.abs(remaining) < cfg.EPS_X) {
    st.x = st.target
    st.v = 0
    return true
  }
  return false
}

/** 目标夹取到合法区间 —— 边界处【立即停】：target 被夹住 ⇒ d 归零 ⇒ 立即到位。 */
export function clampTarget(t, count) {
  const last = Math.max(0, (count | 0) - 1)
  return Math.max(0, Math.min(last, t))
}

/** 新建输入累积器。`moving` = 本次手势是否已经提交过位移。 */
export function createAccumulator(px = 0) {
  return { acc: px, target: px, moving: false }
}

/**
 * 输入累积器 —— 治「触控板的 deltaX 反号噪声」。
 *
 * 它是一个【滞后跟随器】：已提交位置永远跟在累计输入后面 1px（差多少就补多少，不多补）。
 *   累计输入 t、已提交 a：本笔之后 a := t − sign(t − a)·submitPx（当 |t − a| > submitPx）。
 * 于是 |t − a| ≤ submitPx 恒成立 ⇒ 反向不足 1px 时【纹丝不动】，反向 3px 时只走 2px，
 * 反向 120px 时走 119px —— 「只滞后一个阈值」是可证的，不是调出来的。
 *
 * 为什么不能用死区（第二十三轮的 WHEEL_REVERSE_DEAD_PX = 7）：7px 的阈值在真实手势里
 * 是**可感知的黏滞**（Ricky 原话「越改越差了」就是这个）。而噪声幅度（实测 ±1.25 CSS px）
 * 与真实微调幅度在幅度上重叠 ⇒ 任何「幅度阈值」都必然二选一地犯错。
 * 本判据换一个维度：**1 CSS 像素是屏幕能表达的最小位移**，不足 1px 的反向位移落到屏幕上
 * 就是同一个像素 ⇒ 吃掉它不损失任何真实意图。
 *
 * ⚠️ 本次手势的【第一笔】不设阈值、全额提交：此时还谈不上「反向」，阈值没有判据对象；
 *    而且这也是第七轮「跟手 1:1」契约对单笔输入的要求（12+8+0.4 与 60px 单笔都必须
 *    逐笔全给）。全程 1:1 的代价是 1px 恒定滞后 —— 屏幕表达不出来的那一格。
 *
 * @param {{acc:number, target:number, moving:boolean}} st 状态（px）
 * @param {number} deltaPx 本次输入增量（px）
 * @param {number} submitPx 提交阈值（px）
 * @returns {number} 累积后的已提交位移（px）
 */
export function accumulate(st, deltaPx, submitPx = MOTION.SUBMIT_PX) {
  if (!deltaPx) return st.acc
  st.target += deltaPx
  if (!st.moving) {
    st.moving = true
    st.acc = st.target
    return st.acc
  }
  const diff = st.target - st.acc
  if (Math.abs(diff) > submitPx) {
    st.acc = st.target - Math.sign(diff) * submitPx
  }
  return st.acc
}
