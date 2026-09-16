<script setup>
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
import { getApp } from '../../config/apps'
import { appComponents } from '../apps/registry'
import PlaceholderApp from '../apps/PlaceholderApp.vue'
import AppIcon from '../ui/AppIcon.vue'
import GlassCircleButton from '../ui/GlassCircleButton.vue'
import { useSystemStore } from '../../stores/systemStore'
import { useHomeStore } from '../../stores/homeStore'
import { useI18nStore } from '../../stores/i18nStore'
import { useSpring } from '../../composables/useSpring'
import { screenRef } from '../../utils/screenRef'
import {
  DECK,
  deckClampFocus,
  deckEnterDx,
  deckMetrics,
  deckPhase,
  deckPose,
  deckSqueeze,
  deckSqueezeShift,
  deckZ,
  deckVisible,
  TOUCH_STEP_KEEP,
  touchStepIsTeleport
} from '../../utils/switcherDeck'
/* 第二十四轮：位置推进器（单一写者模型）。为什么替换掉原来的 useSpring ——
   见 switcherMotion.js 顶部「9 个写者」的根因说明与 AppSwitcher 里 focus 的定义处。 */
import {
  MOTION,
  createMotion,
  stepMotion,
  createAccumulator,
  accumulate
} from '../../utils/switcherMotion'
/* 第十四轮·需求①：交接保持窗口的时长必须与 hero 开场动画同源（只读引用，不改该文件）。 */
import { HERO_OPEN_DURATION } from '../../utils/heroGeometry'

/**
 * 最近任务切换器（App Switcher / Recent）—— 固定层级堆叠（不是 Coverflow）。
 *
 * Ricky 2026-09-12 七条硬规则，几何全部落在 src/utils/switcherDeck.js（纯函数 + 单测）：
 *   ① 层级关系不变：z 只由列表索引 i 决定（z = 10000 - i），永不随焦点变 →
 *      「顶层的卡片一直到滑动到屏幕外都要在顶层」。旧版 z 跟着「距焦点远近」算，
 *      拖到一半时顶层卡会被下面的卡盖住（他原话：最顶部的卡片还能跑到下面去）。
 *   ② 下层卡片缩小后藏在上层卡片下方：transform-origin: 0 0（左边缘钉住）+ 按层 0.94^k 缩小。
 *   ③ 左侧边缘不出屏：最深层的左边缘 = 77.5 - 61.1 = 16.4px &gt; 0（单测守这条不变量）。
 *   ④ 底层阶梯式缩小、露出越来越少：stair(k) 几何级数 → 露出 52 / 17 / 5 px。
 *   ⑤ 同时最多四层：焦点层 + 3 层背景，第 5 张起不渲染。
 *   ⑥ 间距随滑动距离动态变化：层深连续推进 aEff = a + (x − u)，两端与整层深重合。
 *      第六轮把 u 的指数从 1.6 改成 1 —— 整条链从拖动第一帧起就与手指同速推进。
 *   ⑦ 「同样滑动距离顶层移动距离 8:3:2:1」——**第六轮作废**（Ricky 原话：「忘记我之前
 *      定死的什么 8:3:2:1 移动比例规则，还是你自己算吧」）。改为逐帧量测参考视频得到的两条
 *      实测约束：① 新来卡每滑一张右移 ≈ 0.19 卡宽（52px）；② 离场卡每滑一张右移
 *      = 一张卡的手指行程（234px，1:1 跟手）并停在右屏边内侧露出 ≈119px（实测量 272px / 96px）。
 *      第五轮曾用「牵连包络」把比例做成 8:3:2:1 并让两卡贴合，代价是必然回退（实测 77px）；
 *      第六轮改从【槽位间距】下手 —— 不引入任何会归零的包络，所以零回退与「连锁感」同时拿到。
 *
 * 参考实现：SoxiaLiSA/StackSwipe（MIT，Kotlin）——固定 zIndex、几何级数露边、
 * 阻尼橡皮筋、投影吸附。它没有缩放堆叠与 8:3:2:1，那两块是本项目自研。
 *
 * ── 2026-09-12 第三轮：Ricky 提交参考视频后的四条修正（详见 switcherDeck.js 顶部）──
 *   A. 卡片整体下移 → 不再用固定 Y_FRAC，改为「图标行 + 卡片」整体垂直居中于
 *      [状态栏底(--safe-top), 删除按钮顶]（实测锚点：54 / 840，gap = 77）。
 *   B. 背景层不再上浮 → 删除 Y_STEP_FRAC，y = cardCy - cardH·scale/2，
 *      所有层共用同一垂直中心。
 *   C. 图标 18 → 24px、字号 14 → 16px，并纳入整体居中的 blockH。
 *   D. 横滑动效：ios-deck 由 ζ=1.0 临界阻尼改为 ζ=0.65（τ 仍 ≈110ms，带 6.7% 过冲）；
 *      扇开包络松手时交给弹簧衰减（不再硬置零 → 消除背景层硬跳变）；
 *      拖动灵敏度 0.60 → 0.85 卡宽/张（对齐参考实测 0.87）。
 *
 * 动效：
 *   进入    HomeIndicator 停驻手势驱动 switcherProgress 0→1，前台应用围绕【屏幕中心】
 *           连续缩到卡位（跟手，逐帧直写无 transition）；进度用原始位移换算，
 *           越过满量程继续无极变小但不淡出；松手弹簧回到固定终点。
 *   浏览    横滑：手往右拖 → focus 增大 → 全部卡片往右走；焦点卡走幂律斜坡退出屏幕
 *           （起步接近 1:1 跟手、末段加速），背景层走阶梯 + 扇开。松手弹簧吸附到整卡。
 *   交接    跟手卡落位后由同位姿的堆叠前卡接管（几何逐像素相等，无跳变）。
 *
 * 预览实例通过 provide('appPreview') 与全局隔离（backRegistry 不注册返回处理器）。
 */

const system = useSystemStore()
const home = useHomeStore()
const i18n = useI18nStore()
provide('appPreview', true)

/* 卡片左上角标签的位置：true = 卡内左上角，false = 卡顶上方左侧（iOS 观感） */
const LABEL_INSIDE = false

const rootRef = ref(null)
const screenW = ref(0)
const screenH = ref(0)
/* 布局锚点（修正 A）：「图标行 + 卡片」整体垂直居中于 [状态栏底, 删除按钮顶]。
   两者都从 CSS 变量读，避免与 StatusBar / .switcher-dock 的样式脱钩。 */
const safeTop = ref(0)
const homeInset = ref(DECK.DEFAULT_HOME_INSET)

/**
 * 屏幕尺寸 —— 必须早于「跟手卡/堆叠卡」的首次渲染就绪。
 *
 * 历史 bug（2026-09-12 修复）：旧实现只在切换器自己的 pointerdown 或 openSwitcher
 * 之后才 measure()，而进入手势发生在 HomeIndicator 上（它不会把 pointerdown 冒泡给
 * 切换器），于是整段手势里 screenW = 0 →
 *   ① 跟手卡 width/height = 0 → 前台应用预览整段消失（不是「跟手缩小」）；
 *   ② 堆叠卡出生在 (0,0) 全亮，再靠 0.24s transition 滑到槽位（邻居卡从左飞入）。
 * 现改为：挂载即从 ScreenView 的 .screen 元素同步量（它先于本组件存在），
 * 并用 ResizeObserver 跟随，保证任何时刻几何都是对的。
 */
function measure() {
  const el = rootRef.value || screenRef.el
  if (!el) return
  const w = el.offsetWidth
  const h = el.offsetHeight
  if (w && w !== screenW.value) screenW.value = w
  if (h && h !== screenH.value) screenH.value = h
  /* 锚点：状态栏高度（--safe-top）与底部安全区（--home-indicator-inset） */
  const cs = getComputedStyle(el)
  const st = parseFloat(cs.getPropertyValue('--safe-top'))
  if (Number.isFinite(st) && st > 0 && st !== safeTop.value) safeTop.value = st
  const hi = parseFloat(cs.getPropertyValue('--home-indicator-inset'))
  if (Number.isFinite(hi) && hi !== homeInset.value) homeInset.value = hi
}

let ro = null

/* ---- 几何：全部来自纯函数模块（可单测）---- */
/* 几何度量。第十轮·需求③：把挤压进度 sq 一并挂进 metrics ⇒ deckPose 内部据此做
   「整组等比缩小 + 阶梯收紧」（见 switcherDeck.js 的 SQUEEZE_SCALE_MAX / SQUEEZE_TIGHTEN）。
   挂在 metrics 而不是给 deckPose 加第 4 个参数：四处调用点（poseOf / stackStyle /
   bodyOpacityOf / followStyle 的槽位）全都用 metrics.value，这样它们自动拿到同一份
   挤压后的几何，不会出现「有的缩了有的没缩」。 */
const metrics = computed(() => ({
  ...deckMetrics(screenW.value, screenH.value, {
    topInset: safeTop.value > 0 ? safeTop.value : undefined,
    homeInset: homeInset.value
  }),
  sq: sq.value
}))
const cardW = computed(() => metrics.value.cardW)
const cardH = computed(() => metrics.value.cardH)
const RADIUS = computed(() => metrics.value.radius)
const previewScale = computed(() => metrics.value.previewScale)

/* ---- 内部 z 层级 ----
   .app-switcher 自带层叠上下文，内部只须自洽。
   堆叠卡 z = deckZ(i) = 10000 - i（固定，规则①）；chrome 永远压在最上。 */
const Z_FOLLOW = 12000 // 跟手缩放卡（进场中，压在堆叠卡上）
const Z_EXPAND = 13000 // 点卡片恢复的放大卡
const Z_CHROME = 14000 // 底部垃圾桶

/* ---- 焦点（小数，单位=张），spring 驱动 —— 丝滑的来源 ---- */
/* ── 位置量 focus：单一写者（第二十四轮·架构重做）──────────────────────────────
 * 这一行原来是 `useSpring(0, 'ios-gentle')`，被替换掉。
 *
 * 为什么：位置量原来有【9 个写者】—— 这条弹簧每帧写 + 5 处 `focusSnap`（零过渡直写）
 *   + 3 处 `focusToIndex`（启动弹簧），彼此之间没有任何仲裁。`snapTo` 会掐掉正在跑的
 *   弹簧却【不重置它的 target】⇒ 弹簧朝老目标推、输入又逐笔覆盖回来 ⇒ 交替 = 抖。
 *   19~23 轮加的 owner 守卫 / 坐标连续性守卫 / 死区 / 越界判据，全是给这个模型贴的创可贴。
 *
 * 现在：位置只有【两个出口】，都在这几行下面：
 *   · setInput(t)  跟手期（输入的唯一出口）—— 位置与目标同步落位，零延迟 1:1；
 *   · settleTo(t)  收尾期 —— 交给 rAF 推进器（一阶 + VMAX，数学上不过冲）追整卡；
 *   · focusSnap(v) 语义性瞬移（打开切换器归位 / 模式改判），绝不用于输入路径。
 *   物理 = Ricky 的描述「力固定、随距离衰减、最终停下；到终点像绳子绷直立即停」，
 *   判据本体在 utils/switcherMotion.js（纯函数、单测覆盖）。
 *   两条输入通道（pointer / wheel）因此自动统一 —— 「改目标」天然可叠加，
 *   不需要 owner 交接，也不需要判定「现在谁在驱动」。 */
const focus = ref(0)
/* ⚠️ 声明位置：必须早于 motionTick / setInput / settleTo / focusSnap。
   它们都是函数声明（会被提升），但一旦执行就要读这个 ref —— 提前声明才能
   彻底排除 TDZ（本文件已有一次同类前科：wheelInput 必须早于开关 watcher）。 */
const focusMoving = ref(false)
const motion = createMotion(0)
let motionRaf = null
let motionLast = 0

function motionTick(now) {
  const settled = stepMotion(motion, now - motionLast)
  motionLast = now
  focus.value = motion.x
  if (settled) {
    motionRaf = null
    focusMoving.value = false
    return
  }
  motionRaf = requestAnimationFrame(motionTick)
}
/** 起【收尾段】的 rAF 心跳（已在跑就不重开，避免把 dt 重置成 0） */
function motionRun() {
  if (motionRaf == null) {
    motionLast = performance.now()
    motionRaf = requestAnimationFrame(motionTick)
  }
}
/** 【跟手期 · 输入的唯一出口】位置与目标【同步落位】（零延迟、1:1）。
 *  为什么不做成一阶跟随：输入是外部时钟（手指 / 触控板事件），比 rAF 更早到达；
 *  实测（/tmp/vwork/r24/probe-lag.mjs）若走「rAF 才落位」，快速划动时 VMAX 会把位置
 *  压在 8 层/秒以下（手指 17 层/秒 ⇒ 位置落后 0.3 层 ≈ 70px），且 rAF 与输入的相位差
 *  给中段几何量带来 0~20ms 的随机滞后（≈13px）—— 对「跟手」和可回归性都是净损失。
 *  一并停掉可能还在跑的收尾心跳：输入接管时钟，收尾段的 target 已被覆盖。 */
function setInput(t) {
  if (motionRaf != null) {
    cancelAnimationFrame(motionRaf)
    motionRaf = null
  }
  motion.target = t
  motion.x = t
  motion.v = 0
  focus.value = t
  focusMoving.value = true
}
/** 【收尾期】松手 / 触控板流结束 / 删卡重排：位置留在原处，让推进器追到整卡。
 *  必须是「只改 target」—— 位置从这里开始才由 rAF 一个写者推进。 */
function settleTo(t) {
  motion.target = t
  focusMoving.value = true
  motionRun()
}
/** 硬切：立即跳到某处并停。只用于【语义性瞬移】（打开切换器归位、模式改判归位），
 *  绝不用于输入路径 —— 输入一律走 setInput。 */
function focusSnap(v) {
  if (motionRaf != null) cancelAnimationFrame(motionRaf)
  motionRaf = null
  motion.x = v
  motion.target = v
  motion.v = 0
  focus.value = v
  focusMoving.value = false
}
/* 进场进度弹簧：手势交接的 switcherProgress（~0.8）连续推到 1 */
const { value: openP, animateTo: openTo, snapTo: openSnap, stop: openStop } = useSpring(1, 'ios-gentle')
watch(openP, (v) => system.setSwitcherProgress(v))
const apps = computed(() => system.recentApps)

/* ---- 第八轮（Ricky 2026-09-13）新增、第九/十轮两次改口径的两条弹簧 ----
 *
 * ① sq：左滑挤压进度 k（需求③）。手势期【逐帧直写】（deckSqueeze(over)，严格跟手），
 *    松手后用 'ios-squish'（ζ≈0.46，过冲 ≈20%）弹回 0 —— 过冲使 k 短暂为负 ⇒
 *    卡片组整体向右回弹一下、并比原尺寸略大一点，再收回，这就是 Ricky 要的「弹性回弹」。
 *    ⚠️ 第十一轮划界（别再混淆）：这条回弹只在【左滑越界】时有量（k ≠ 0）。
 *      平面慢滑（k 恒 0）不产生任何振荡 —— 探针实测 A/B 两个慢滑场景里轨道 tx 全程 0.00，
 *      第一轮基线里那 5~6.5px「多余的回弹」与它无关（来自焦点弹簧，见 settleFocus）。
 *    ⚠️ 口径变更史（别再走回去）：
 *      · 第八轮：sq 持有 **scaleX 压缩比**（1 → 0.84）⇒ 卡被「压扁」。
 *      · 第九轮：sq 持有 **纯挤压进度**，只驱动整组左移。
 *      · 第十轮（本轮）：sq 仍是 0 → 1 的进度，但**同时驱动三个几何分量** ——
 *        整组左移（trackStyle）/ 整组等比缩小（deckPose 的 scale ×= g）/
 *        阶梯收紧（deckPose 的 stair × tight）。见 switcherDeck.js 的 SQUEEZE_* 注释。
 * ② followFree：跟手卡「横向/纵向跟手偏移」的释放权重（需求⑥/⑤）。
 *    手势期恒 0（偏移满量程）；松手后弹簧推到 1（偏移 → 0）。
 *    必须【早于 settledOne 交接】归零，否则交接那一帧会跳：
 *    第九轮探针实测（/tmp/vwork/r9/probe-settle.mjs）—— 停驻期把手指横移 120px 再松手，
 *    交接瞬间 FOLLOW 卡在 x=127.5、堆叠前卡在 77.5，**单帧硬跳 50.5px**
 *    （= 120 × FOLLOW_X 0.42 × w，w = 1 − followFree = 1 ⇒ 偏移根本没被释放）。
 *    根因：释放只写在 onPointerUp 里，而这条手势的 pointerup 落在 HomeIndicator 上，
 *    本组件的 onPointerUp 根本不会跑 ⇒ releaseSqueeze() 从未被调用。
 *    修法三件套：① appSwitcherOpen 置真（= 松手）时释放；② 交接判定并入 followFree；
 *              ③ 预设换成 'ios-snappy'（settle ≈160ms，确定早于 openP 的 ios-gentle ≈250ms）。 */
/* ⚠️ 第二十五轮：这里【故意】不解构 animateTo —— 与 focus 的「三出口」纪律同构。
 *
 * sq 只有一个连续写者：sqTrackTick（限速一阶推进器，第 312 行）。入口同样只有三个：
 *   dragSqueeze()   —— 跟手期写目标（位置 = 目标 = deckSqueeze(overScroll)）
 *   releaseSqueeze()—— 松手期【只把目标置 0】，由推进器落地
 *   sqReset()       —— 语义瞬移（关闭复位 / 退场）
 *
 * 旧代码在 releaseSqueeze 里写的是 `sqTo(0)`，而 'ios-squish' = {300,16} ⇒
 * ζ = 16 / (2·√300) ≈ 0.462（欠阻尼）⇒ 松手后 sq 穿过 0 来回振 3 次、历时 670ms。
 * 实测（/tmp/vwork/r26/probe-all.mjs，左滑越右边界后松手）：
 *      sq      0.2814 → 0 → −0.0523(峰) → 0 → +0.0096(峰) → 0 → −0.0018 → 0
 *      tr.e    −21.81 → … → +4.052(峰) → −0.741(峰) → +0.136 → 0
 * sq 经 deckSqueezeShift 放大成【整组】位移：+4.05px 的右摆 → 左摆 −0.74 → 右摆 +0.14。
 * 这就是 Ricky 20:51 录屏里那条「2~6 物理px、幅度递减、持续 ~0.6s」的水平抖动
 * （同一把尺量到的残摆 7.35 视频px ÷ 1.674 = 4.4 CSS px，与 4.05px 同量级）。
 * 把 animateTo 从解构里拿掉，是为了让「第四条出路」在类型上就不存在 ——
 * 不是「约定不要调」，而是「没有这个函数可调」。 */
const { value: sq, snapTo: sqSnap } = useSpring(0, 'ios-squish')
const { value: followFree, animateTo: followFreeTo, snapTo: followFreeSnap } = useSpring(0, 'ios-snappy')

/* ---- 第十七轮（Ricky 2026-09-14）新增：挤压进度的【逐帧限速】----
 *
 * Ricky 原话：「横滑切换疯狂抖动。。。」（附 7.2s 录屏 tOS_Prototype_20260914_194725.mp4）
 *
 * 【症状】贴着第一张卡左右快搓 / 横滑到位后继续怼，整块卡片组在 12~30ms 内反复反号
 *   抽动 48~144 CSS px（离线逐帧互相关量出的刚体位移；三条取样带的位移序列完全一致
 *   ⇒ 是「整组刚体」在动，不是卡内元素各自抖）。同一段里前卡视觉宽 275→263
 *   ⇒ 抖动期间挤压态一直在咬合/释放。
 *
 * 【复现】/tmp/vwork/r17/probe-zig.mjs 模式 z2（x=420 按下 → 拖到 x=20 → 拉回 x=80，
 *   来回 8 次）：改前 trackStyle 的 translateX 范围 −77.5 ~ +14.5，
 *   **单帧最大跳变 77.50px** —— 与录屏里量到的 162 视频 px 逐字节对上。
 *
 * 【根因】挤压是一条【事件驱动 + 零过渡直写】的通道，而且它的增益是组件里最高的一条：
 *   ① 增益链：手指位移 × RUBBER(0.35) ÷ span(233.75) = 越界层数；
 *      越界层数 ÷ SQUEEZE_SPAN(0.35) = 进度 k；k × frontX(77.5) = 整组位移。
 *      ⇒ **14px 的手指抖动 → 8.8px 的整组位移**，即 221px 位移 / 层越界。
 *   ② 旧调用点写的是 `sqSnap(deckSqueeze(overScroll.value))` —— sqSnap 是**零过渡直写**，
 *      于是这个增益被 1:1 变成瞬移：pointermove 之间隔 12~30ms，每来一个事件整组就跳一次，
 *      方向跟着手抖反号 ⇒ 「疯狂抖动」。
 *   ③ 而越界期卡片位姿被 poseFocus = max(0, focus) 钉死在 0 ⇒ 屏幕上【只有整组在动】
 *      ⇒ 读起来是「卡片冻住，然后整块啪地跳一下」。
 *
 * 【修法】两条都不能省（缺一条就漏一半）：
 *   ① 曲线侧（已在 switcherDeck.deckSqueeze 落地）：加死区 + smoothstep，消掉 over=0
 *      处的导数拐点 —— 否则「刚越界一点点」也会立刻拿到 2.86/层的斜率。
 *   ② 时间域（就在这里）：给进口加限速 —— sq 每帧最多向目标推进 SQ_MAX_STEP。
 *      单靠 ① 挡不住满量程那次 0→1 的整段跳（77.5px 照旧）；
 *      单靠 ② 小幅度抖动仍会被 221px/层 如实放大（只是被摊到几帧）。
 *
 * ⚠️ 为什么是「限速」而不是「换成弹簧」：e2e 需求③ 用 240ms 慢拖测量挤压稳态位移，
 *    必须落在 −frontX ± 2px（scripts/verify-app-switcher.mjs 的 during 段断言）。
 *    弹簧的过冲/滞后会让稳态值在到达前就被采样 ⇒ 失约；限速是【单调】的，
 *    稳态值严格等于 deckSqueeze 的输出 ⇒ 既有契约一条不动。
 * ⚠️ 为什么需要独立的 rAF（而不是在 dragSqueeze 里就地限速）：手势停住时不再有
 *    pointermove，目标不再更新、也没人推进 sq ⇒ 挤压会【定格在中间值】追不上目标。
 *    常驻追踪器同时天然成为一阶低通：目标连续变化时，输出是它的滞后平滑版。
 * ⚠️ 接管点（关闭复位 / 退场）一律走 sqReset()：先停追踪器再对齐零点，
 *    否则下一帧追踪器会把 sq 又拉回旧目标。
 */
const SQ_MAX_STEP = 0.09 // 每 16.7ms 最多推进的挤压进度（满量程 ≈ 12 帧 ≈ 200ms）
/* dt 归一的【上限】取 20ms（1.2×）而不是 useSpring 那样的 50ms。
 * 原因：dt 归一是为了「掉帧时速度不塌」，但它会把单帧步长也放大 —— 50ms 上限意味着
 * 一帧就能走 0.27 进度 = 21px 的整组瞬移，等于把刚修掉的东西从另一头放回来。
 * 20ms 上限下单帧步长封顶 0.09×1.2 = 0.108 ⇒ 8.4px，仍满足「单帧 ≤ 8~9px」的口径。
 * ⚠️ 这个上限不能再往下压：e2e 需求③ 的 20 步慢拖要在 ~280ms 内把进度推满 1.0
 *    （需求速率 ≈ 3.6/s）。0.09/帧 @20ms = 4.5/s（余量 26%）、@16.7ms = 5.4/s（余量 51%）；
 *    若压到 25ms 上限则只有 3.6/s = 零余量，慢拖会保险丝上跳舞。 */
const SQ_DT_MAX_MS = 20
let sqTarget = 0
let sqTrackRaf = null
let sqTrackT = 0

function sqTrackStop() {
  if (sqTrackRaf != null) cancelAnimationFrame(sqTrackRaf)
  sqTrackRaf = null
  sqTrackT = 0
}

function sqTrackTick(now) {
  sqTrackRaf = null
  /* dt 归一：掉帧时允许一步走更多，否则重载下挤压会明显「跟不上手」。上限见上。 */
  const dt = sqTrackT ? Math.min(SQ_DT_MAX_MS, now - sqTrackT) : 16.7
  sqTrackT = now
  const step = SQ_MAX_STEP * (dt / 16.7)
  const d = sqTarget - sq.value
  if (Math.abs(d) <= step) {
    sqSnap(sqTarget) // 收敛：严格落到目标（稳态值 = deckSqueeze 的输出，契约不破）
    sqTrackT = 0
  } else {
    sqSnap(sq.value + Math.sign(d) * step)
    sqTrackRaf = requestAnimationFrame(sqTrackTick)
  }
  /* 自省口（与 __switcherMode / __switcherSettle 同性质）：探针据此断言「单帧跳变」，
     不必再从 transform 反解 —— 反解只能拿到位移，拿不到「有没有被限速」。 */
  window.__switcherSqueeze = {
    cur: +sq.value.toFixed(4),
    target: +sqTarget.toFixed(4),
    running: sqTrackRaf != null
  }
}

/** 手势期写挤压目标：限速逼近（第十七轮起取代旧的 sqSnap 直写）。
 *  ⚠️ releaseSqueeze 现在【也由 appSwitcherOpen 的 watch 调用】—— 应用内上滑那条路径的
 *     松手发生在 HomeIndicator 上，本组件的 onPointerUp 不会执行（见该 watch 的注释）。 */
function dragSqueeze() {
  sqTarget = deckSqueeze(overScroll.value)
  if (sqTrackRaf == null) {
    sqTrackT = 0
    sqTrackRaf = requestAnimationFrame(sqTrackTick)
  }
}

/** 松手后把挤压交给【同一个】限速推进器：只把目标置 0，落地由 sqTrackTick 单调完成。
 *
 *  ⚠️ 第二十五轮：这里原来是 `sqTrackStop(); sqTo(0)`（'ios-squish' = {300,16} ⇒
 *     ζ = 16 / (2·√300) ≈ 0.462 欠阻尼）。欠阻尼 = 恒过冲 = 恒振荡：
 *     逐帧实测（/tmp/vwork/r26/probe-all.mjs，左滑越右边界后松手）
 *        sq     0.2814 → 0 → −0.0523(峰) → 0 → +0.0096(峰) → 0 → −0.0018 → 0
 *        tr.e  −21.81  → … → +4.052(峰) → −0.741(峰) → +0.136 → 0
 *     sq 的增益是全组件最高的一条（deckSqueezeShift 把它放大成 0 → −frontX(77.5px)），
 *     于是那次 −0.0523 的过冲就是整组【+4.05px】的右摆，随后 −0.74 / +0.14 来回摆动
 *     —— 幅度递减、方向反复、历时 670ms，肉眼就是 Ricky 说的「卡片不停颤抖」。
 *     同一把尺在 20:51 录屏上量到 7.35 视频px ÷ 1.674 = 4.4 CSS px 的残摆，量级吻合。
 *
 *     需求③「回弹」本身【不需要过冲】：整组从 −77.5px 单调滑回 0 就是回弹；
 *     欠阻尼多出来的那几次穿零，全部是缺陷，不是手感。
 *
 *  ⚠️ 松手不切换动力学（不改步长、不换模型）—— 与跟手期共用同一个限速一阶推进器，
 *     只是目标从 deckSqueeze(overScroll) 变成 0。切换定律会在松手那一刻引入速度跳变，
 *     那正是历轮「越改越抖」的来源之一。
 *  ⚠️ 推进器已在跑时不要重置 sqTrackT：让它带着自己的时间基准继续走，
 *     否则会把 dt 归一到 16.7ms，最坏情况下让落地多花一帧。
 *  ⚠️ 焦点（翻卡）走的是另一条路：settleFocus → settleTo，第二十四轮起统一为一阶推进器
 *     （速度 = 剩余距离/时间常数 + VMAX，数学上不过冲）。两条通道现在【同一个模型】。 */
function releaseSqueeze() {
  sqTarget = 0
  followFreeTo(1)
  if (sq.value === 0) {
    sqTrackStop()
    return
  }
  if (sqTrackRaf == null) {
    sqTrackT = 0
    sqTrackRaf = requestAnimationFrame(sqTrackTick)
  }
}

/** 挤压复位到 0 并停掉追踪器（接管点专用：关闭复位 / 退场）。 */
function sqReset() {
  sqTrackStop()
  sqTarget = 0
  sqSnap(0)
}

/** 位姿用的焦点：第八轮起【冻结在 0 以上】。
 *  左滑越界（focus < 0）不再推送卡片位置，而是转成【整组左移】（见 deckSqueeze 的注释）——
 *  这同时修掉了第八轮需求⑦的「最底部卡片会直接消失」：层深 a = i − poseFocus 恒 ≤ MAX_DEPTH，
 *  旧实现 a = i − (−0.6) = 2.6 > 2 会被 deckVisible 判为不可见、直接收掉 DOM。 */
const poseFocus = computed(() => Math.max(0, focus.value))
/** 左滑越界层数（0..0.6），驱动整组左移（第九轮：旧版驱动 scaleX 压缩） */
const overScroll = computed(() => Math.max(0, -focus.value))
const frontIndex = computed(() => {
  const i = apps.value.indexOf(system.activeAppId)
  return i < 0 ? 0 : i
})

/* 可见性。
 * 第五轮新增 linger：「桌面路径取消上滑」时进度会瞬间归零，若立刻卸载会让已经升到
 * 一半的卡片「啪」地消失。这里在归零后多留 340ms，让 CSS 收场过渡播完再卸载。
 *
 * 第九轮新增 exitedHome（Ricky 需求⑥「点击空白处退出的动画有概率播两次，且桌面背景
 * 出现时很闪」）—— 探针 /tmp/vwork/r9/probe-exit.mjs 逐帧实证：
 *   t=6.9ms   加 is-closing → track 从 0 滑到 −335（300ms 过渡）
 *   t=316ms   track 已到 −335、dim=0 ✅ 第一遍动画播完
 *   t=328.6ms 摘 is-closing / 加 is-home-retreat → **track 弹回 0、卡片在屏幕正中
 *             重新出现（card.x 77.5、op=1）** ⇒ 桌面背景上「闪」了一下
 *   t=333~550 卡片再往左滑一次并淡出 ⇒ **第二遍动画**
 * 成因：is-closing 一摘，`trackStyle` 的滑出分支就失效（transform 回 none，且那条过渡
 * 只定义在 .is-closing 下）→ 同一帧卡片回到居中位姿；随后 watch 把 neighborsIn 置假，
 * stackStyle 的「收场态」分支再给一次 deckEnterDx 左移 + 220ms 淡出。
 * 修法：退场动画播完时置 exitedHome=true ⇒ visible 立刻变假 ⇒ 根节点与状态变更在
 * **同一个 patch** 里被移除，中间那一帧根本不会上屏 —— 无第二遍、无闪。
 *
 * ⚠️ exitedHome 是一道【单次】闩锁，下一次入场必须放行，两处复位：
 *   ① `switcherProgress > 0`（手势重新上滑，两条路径都覆盖）—— 见下面的 watcher；
 *   ② `appSwitcherOpen` 置真（程序化直开 / 停驻松手）。
 *   只留 ② 会让整段上滑手势屏幕全空（实测见 watcher 的注释）。 */
const linger = ref(false)
let lingerTimer = null
const exitedHome = ref(false)

/* ---- 点卡恢复的「交接保持」窗口（第十四轮·需求①）----
 *
 * Ricky 原话：「点击多任务卡片进入全屏时会卡和闪一下，而且很高的概率会出现
 * 点击卡片仍然**退出多任务回到桌面**的问题」。
 *
 * 第二半句的第二个成因（第一个是命中失败，见 hitCardId 的注释）在这里：
 * 点【别的应用】的卡片时 `system.resumeApp(appId)` 会让那个 AppWindow **重新挂载**
 * （ScreenView 里 `:key="system.activeAppId"`），而它的 onMounted 会播 420ms 的
 * hero 开场动画 —— 起点是【桌面上的那个应用图标】（探针 /tmp/vwork/r14/probe-resume.mjs
 * 实测：resume 之后 518.8ms 那一刻窗口矩形 = [258,649,140,249]，正是相机图标的桌面矩形）。
 * 而切换器在同一帧就被卸载（appSwitcherOpen=false + progress=0 ⇒ visible=false）。
 * ⇒ 用户看到的是「满屏卡 → 桌面 + 一个从图标长出来的小窗口」，读起来就是「回到了桌面」。
 *
 * 修法：交接之后本组件【多活一段】，让已经铺满全屏的放大卡继续盖在上面，
 * 等底下的 AppWindow 把开场动画跑完再撤。撤掉的那一帧，底下已经是「全屏 + 内容全亮」
 * 的稳定态 ⇒ 零跳变、零闪。
 *   · 点别的应用：等满 HERO_OPEN_DURATION（+ 一点合成余量）；
 *   · 点当前应用：AppWindow 不重挂、没有 hero，只要撑过一两帧的合成延迟。
 *
 * 为什么这个窗口必须并入 visible / renderDeck：
 *   resumeApp 会把 appSwitcherOpen 置假、progress 归零，而此刻 activeAppId 已经是新应用
 *   （deskPath=false）⇒ 两个表达式同时变假 ⇒ 根节点与放大卡在同一个 patch 里被拆掉，
 *   根本来不及盖住 hero。 */
const expandHold = ref(false)
let expandHoldTimer = null
const visible = computed(
  () =>
    (system.appSwitcherOpen || system.switcherProgress > 0 || linger.value || expandHold.value) &&
    !exitedHome.value
)

watch(
  () => system.switcherProgress,
  (p, prev) => {
    /* ⚠️ 第九轮（需求⑥ 的收尾，必须放在最前面 —— activeAppId 的那条早退会把它跳过）：
       退场动画播完时 exitedHome 会把根节点按住不放（见 visible 的注释），它必须
       在【下一次入场】放行。入场的第一信号就是进度重新 > 0。

       漏了这一步的后果（探针 /tmp/vwork/r9/why-fail2.mjs 实测，严重回归）：
       点空白退场 → 重开应用 → 上滑，fp 从 0.269 一路爬到 1.038，
       **全程 `.app-switcher` 在场=false、`.switcher-card` 数=0** —— 整段手势屏幕全空，
       直到松手 openSwitcher 才把整套 deck 一次性弹出来。跟手观感与停驻预提交全没了。
       成因：exitedHome 原本只在 appSwitcherOpen 的【打开】分支复位，而手势期
       open 仍是 false，于是 visible 恒假。 */
    if (p > 0.001) exitedHome.value = false
    if (system.activeAppId || system.appSwitcherOpen) return
    if (p > 0.001) {
      clearTimeout(lingerTimer)
      linger.value = true
      return
    }
    if (prev > 0.02) {
      clearTimeout(lingerTimer)
      lingerTimer = setTimeout(() => { linger.value = false }, 340)
    }
  }
)

/* ---- 桌面路径的入场反馈（第五轮）----
   问题：桌面（无前台应用）上滑时，deck 只在 appSwitcherOpen 之后才渲染，而桌面又没有
   跟手卡 → 屏幕上【一张卡都没有】，只剩一层黑遮罩。Ricky 的原话是「手感非常差」。
   修法：手势期间就把 deck 渲染出来，入场进度直接跟随 switcherProgress ——
   上滑多少、卡片就横移多少（第八轮·需求⑤改成【自左侧横向平移】进场 + 淡入，
   旧版是自下方 30% 上浮；参考视频 52b4f2fa…mp4 实测整组位移 0.78 屏宽）。 */
const homeEntranceP = computed(() =>
  system.activeAppId ? 0 : Math.min(1, system.switcherProgress)
)
/** 桌面路径 = 没有前台应用。入场自左侧横移进来、取消时原路向左滑出（方向必须一致，
 *  否则「取消」会变成卡片坠到屏幕下方）。注意它不依赖 appSwitcherOpen ——
 *  手势进行中的那一段也必须是真值，退场才滑得回去。 */
const deskPath = computed(() => !system.activeAppId)
/** 桌面手势进行中（此时背景卡需要逐帧跟手，必须关掉 CSS 过渡） */
const homeEntranceFollowing = computed(
  () => deskPath.value && !system.appSwitcherOpen && system.switcherProgress > 0
)
/** deck 的渲染条件。
 *  第五轮补：桌面路径不能只认「手势进行中」—— 松手取消那一瞬间进度归零，若立刻卸载，
 *  卡片就是【瞬间消失】，既没有下沉也来不及淡出（实测 45ms 内 deck=0）。
 *  所以桌面路径改为「只要本组件还在场（visible，含 linger 的 340ms 退场缓冲）就渲染」，
 *  让 stackStyle 的收场分支能把「原路下沉 + 淡出」播完。 */
/* 停驻预提交（第七轮·批次 2，需求⑫）——
   「应用内卡片上滑进入多任务，需要跟随滑动方向跟手移动，**停留超过一定时间时左侧卡片进场**，
     松手后丝滑归位」（Ricky 2026-09-13，参考视频 981c9428…mp4 逐帧量测）。

   逐帧事实（v12 参考视频 444×960 / 24fps / 346 帧，/tmp/vwork/v12measure.py）：
     f52–f65  跟手上滑，前台应用自全屏连续缩到卡位（卡顶 y 95 → 119）
     f66–f102 **停驻 1.5s**：仍是【单张】跟手卡，左侧邻居【没有】出现
     f103–f116 左侧邻居「微信」自左侧滑入 + 前卡落位 → 整套 deck 就位
   也就是说参考实现里「左侧卡片进场」发生在**手指仍按住**的那段时间里，
   而本项目旧实现只在 appSwitcherOpen（= 松手）那一帧把整套 deck 一次性铺出来
   （探针实测：松手 +0ms deck=3 三张卡已经在终点位）→ 卡片的「闪一下」（需求③ 同源）。

   修法：`system.switcherDwell`（HomeIndicator 判定「上滑 >5% 后停住 120ms」）一旦成立，
   在【松手之前】就把邻居卡编排进场：
     · renderDeck 放行 → 堆叠卡挂载（先以「待进场」态渲染一帧：opacity 0 + 自左侧
       neighborEnterDx(i) 处 + 略小的 scale，见第十轮·需求①那一块常量）
     · 下一帧 neighborsIn = true → 靠 stackStyle 内联的入场过渡
       （0.48s 缓起曲线 + 0.16s 快速淡入）逐张错峰滑入、撑开、淡入
     · hasFollow = true → 堆叠【前卡】仍由跟手卡顶替（opacity 0），避免与跟手卡双重曝光
   松手时 openSwitcher 走原路径（openSnap → openTo(1)）：邻居已经就位，只有跟手卡
   继续弹簧落到 C 槽位再交接 → 零闪断。 */
const preCommit = ref(false)

/* ── 邻居卡「待进场」态（第十轮·需求①改写）────────────────────────────────
   Ricky 原话：「应用内上滑悬停底层卡片入场没有动画，增加左侧进入的优雅入场动画」。

   先证伪「没有动画」：探针 /tmp/vwork/r10/probe-neighbor-enter.mjs 逐帧采样邻居卡的
   getBoundingClientRect().x，实测拿到 16~17 个不同取值 ⇒ 第九轮那套【确实在跑动画】。
   真正的问题是「跑得看不见」，三个叠加原因（这才是要修的）：
     · 行程只有 36px，而首层卡的左缘本来就落在 −10px（槽位 25.5 − 36）⇒
       后半段完全在屏幕外，屏内可见行程只剩十几 px；
     · 两层卡【同一拍】出发、同一拍到达（delay = i×60ms 但 i 从 0 起，两层只差 60ms，
       而 0.32s 的过渡把这点差距抹平了）；
     · 这张卡大半被前卡盖住，只有左侧阶梯那一条（满量程 52px、收紧后 23px）露在外面。
   三条合起来 ⇒ 眼睛读到的就是「啪一下出现了」。不是 bug，是量级不够。

   改写为三层递进（全部只作用于 preCommit 这一条路径，其余入场语义不同的路径不串味）：
     ① 行程随层深递增：首层 0.42 卡宽（≈116px），每深一层再 +0.16 卡宽。
        取这个量级的理由是【卡内内容会跟着一起平移】—— 这张卡大半被跟手卡盖住，
        真正能被眼睛抓住的是「应用预览在露出条里横向扫过」这一件事，而它是 1:1 跟
        位移量的（实测：位移 150 屏单位 ⇒ 卡内闹钟列表扫过同样距离）。
     ② 起点略小（NEIGHBOR_ENTER_SCALE_FROM = 0.93）→ 落位时「撑开」，
        比纯位移更有质感；配合 y 的补偿保证「所有层垂直中心恒等于 cardCy」这条不变量。
     ③ delay 仍走 i×60ms（与 markEntrance 的节拍同源）。

   ⚠️ 曲线是本轮返工的重点（第一版写错过）：
     第一版用了 cubic-bezier(0.22, 1.12, 0.36, 1)（从吸附过渡那里抄来的），
     探针实测「47% 的行程挤在开头 49ms、316ms 就走完了」—— 卡片是「甩」进去的，
     拉长时长也救不了（前段斜率决定观感）。改用缓起型 cubic-bezier(0.42, 0, 0.2, 1.06)：
       行程完成度 t=0.2 → 0.128｜t=0.4 → 0.625｜t=0.6 → 0.898｜t=0.9 → 1.002（微过冲）
     50% 落在 t≈0.36 ⇒ 运动均匀铺在整段时长上，末段还有 0.2% 的过冲余韵。
   节拍常量与 CSS 时长必须同源：entranceDone 若在过渡跑完之前翻真，transitionDelay
   会从 i×60ms 跳回 0ms，正在跑的过渡会被浏览器重算 ⇒ 卡片中途一顿。 */
const NEIGHBOR_ENTER_FRAC = 0.42
const NEIGHBOR_ENTER_STEP_FRAC = 0.16
const NEIGHBOR_ENTER_SCALE_FROM = 0.93
/** 错峰步长（ms）—— markEntrance 的收尾时刻与 stackStyle 的 transitionDelay 共用 */
const NEIGHBOR_ENTER_STAGGER_MS = 60
/** 入场过渡时长（ms）—— 必须与 stackStyle 内联的那条 transition 逐字一致 */
const NEIGHBOR_ENTER_MS = 480
/** 入场过渡曲线 —— 缓起 + 末段微过冲（见上面 ⚠️ 段的实测依据） */
const NEIGHBOR_ENTER_EASE = 'cubic-bezier(0.42, 0, 0.2, 1.06)'

/** 第 i 层邻居卡的「待进场」水平偏移（正数 = 向左推离槽位，调用点自行取负）。 */
function neighborEnterDx(i) {
  return cardW.value * (NEIGHBOR_ENTER_FRAC + NEIGHBOR_ENTER_STEP_FRAC * Math.max(0, i))
}

const renderDeck = computed(
  () =>
    system.appSwitcherOpen ||
    preCommit.value ||
    /* 第十四轮·需求①：交接保持窗口内必须继续渲染放大卡 ——
       此刻 appSwitcherOpen 已假、deskPath 也假，不并入这一项就会整组卸载。 */
    expandHold.value ||
    (deskPath.value && visible.value)
)
/** 桌面路径的【退场窗口】：进度已归零、靠 linger 撑着的那 340ms。
 *  只在这个窗口里给遮罩开透明度过渡 —— 跟手期绝不能开（逐帧直写会被二次低通成滞后），
 *  应用内上滑那条路径也绝不能开（同一原因），所以判据必须精确到「正在退场」。 */
const homeRetreat = computed(
  () =>
    deskPath.value &&
    !system.appSwitcherOpen &&
    visible.value &&
    system.switcherProgress <= 0.001
)
/* 桌面入场（第八轮改向）：卡片组自【左侧 0.78 屏宽】处横向滑入。
   旧常量 ENTRANCE_RISE_FRAC = 0.3（自下方 30% 屏高上浮）已被需求⑤取代，
   位移量改由 switcherDeck.js 的 DECK.EXIT_SLIDE_FRAC 唯一给出（deckEnterDx()）。 */

/* ---- 层过渡进度（第四轮）----
   顶卡退出与背景层推进共用【同一个进度】（详见 switcherDeck.js 头部「定律一」）。
   旧实现背景层用原始焦点小数 x、顶卡用 x^EXIT_POW —— 背景层抢跑，把「向中间的
   位移 + 放大」提前做完，观感就是 Ricky 说的「底层卡片先做向中间位移放大的动画」。
   现在统一由 deckPhase 给出 u，deckPose 内部把背景层的连续层深折算成 a + (x − u)，
   两端与原始层深重合 → 层边界零跳变、不需要额外的扇开弹簧。 */
const phase = computed(() => deckPhase(poseFocus.value))
const xFrac = computed(() => phase.value.x)

/* 焦点推进期间关闭 CSS transition —— 否则逐帧推进的位置会被 0.24s 过渡二次低通，
   松手后的吸附变成「慢慢飘过去」，没有干脆手感。
   （`focusMoving` 的声明已上提到位置量定义处，见上方「位置量 focus：单一写者」段；
     第二十四轮起收尾统一走 settleTo —— 原来的 focusToIndex 只是它的一个预设包装。） */

/* ---- 松手吸附（第七轮·批次 3）----
   Ricky 原话：
     ④「需要支持快滑的惯性加速移动（参考视频 95f4eead…mp4）」
     ⑤「慢滑时每次切换一张卡片，注意卡片的位移速度和停留位置（参考视频 d0ee37dc…mp4）」

   逐帧量测 V4（快滑，444×960 / 24fps / 157 帧；/tmp/vwork/track-v4.txt）：
     · 三个运动段，峰值速度都 = 1680 px/s（≈1.68 px/ms ≈ 7.2 层/秒）
     · 净位移分别 311 / 200 / **229** px = 1.33 / 0.86 / 0.98 层
       ⇒ **一次快甩 ≈ 一张卡**。V4 里【没有任何一次多张连翻】的证据。
   逐帧量测 V5（慢滑，193 帧；/tmp/vwork/track-v5.txt）：
     · 四段净位移 226 / 288 / 168 / 117 px，每段 ≈ 一张卡的手指行程 ⇒「慢滑一次一张」

   旧实现的缺口（探针 probe-flick3.mjs 实测）：
     `idx = base + (frac > 0.5 − bias ? 1 : 0)`，bias = clamp(vFocus × 0.1, ±0.4)
     ⇒ 位移不足半层的快甩永远翻不动（快甩 0.05/0.10 层 → 停在原卡）。
     但 iPhone 上「快速轻甩」必定翻一张，这就是需求④。

   新模型 = 位移为主 + 快甩的方向保底（**不做速度投影**）：
     · 非快甩（|v| < FLICK_V_MIN，含慢滑、含「拖到一半停住再松手」）
         → idx = round(cur)：严格等价于旧行为「位移过半才翻一张」⇒ 需求⑤原样守住；
     · 快甩（|v| ≥ FLICK_V_MIN）
         → idx 取「距离最近的整卡」与「手势起点 ± 1 张」中【更远的那一侧】。
           所以「一次快甩至少翻过一张」，但【不会凭速度凭空多翻】。

   为什么不做速度投影（初版做过，已否）：
     投影 = cur + v × T 在鼠标上会失控 —— e2e 用 `mouse.move(steps:3)` 一击甩出
     165px（0.71 层），实测速度 ≈ 23px/ms ≈ 100 层/秒，投影直接越过第 2 张。
     而 V4 的参考峰值只有 7.2 层/秒，一次手势就是一张卡。
     保底锚在【手势开始时】那张卡（startFocus）而不是 floor(cur)：
     否则「已经拖过 2 张再快甩」会被再加一张（0.9 层快甩→2 张这种跳跃就是这么来的）。

   于是行为非常可预测：**翻 n 张 ⟺ 位移超过 n−0.5 张；快甩额外保证至少 1 张。**
   速度的作用落在【推进器的 VMAX】上（第二十四轮：原来是「注入弹簧初速度」的
   FLICK_V_LIMIT）—— 卡片是加速冲出去的，而不是靠多翻张数体现速度。

   ── 第十一轮：速度还有第二个作用域 ——【要不要弹性】────────────────────
   Ricky 原话：「慢滑滑动卡卡片多了一个不必要的回弹」。
   探针（/tmp/vwork/r11/probe-slow.mjs）改前实测，慢滑松手后的过冲：
     不翻卡（0.35 层，目标 = 0 = 下界）       0.00px ← poseFocus = max(0, focus) 把过冲钳掉了
     翻一张（0.65 层，停住再松手，零动量）     +5.0px（占行程 5.8%）
     翻一张（0.55 层，松手时仍在动）           +6.5px
     连翻两张（1.55 层，仍在动）               +6.5px
     快甩（0.62 层 / 6 步，v = 5.6 层/s）     +12.6px ← 动量，必须留（参考视频 V4 回退 254/229px）
   ⇒ 慢滑那 5~6.5px 就是「多余的回弹」：非快甩分支当年也用了 ios-deck（ζ=0.65 阶跃过冲 6.7%）。
   改法见 settleFocus：慢滑走 ios-deck-settle（ζ=1.0）且不注入速度 ⇒ 位移段严格单调。
   ⚠️ 别顺手把 ios-deck 全局改掉 —— 快甩、退场重排（dismissWithAnimation）都还在用它。 */
const FLICK_V_MIN = 2.6 // 层/秒 —— 超过它才算「快甩」（≈608px/s，V4 峰值 7.2 远高于此）
/* 第二十四轮删除了 FLICK_V_LIMIT（「注入弹簧的初速度上限」）—— 一阶模型里没有
   「注入初速度」这个动作了，快甩的冲程由 MOTION.VMAX 承担（见 switcherMotion.js）。 */

/** 松手吸附。
 *  @param vFocus     松手瞬时速度（层/秒，向右为正）
 *  @param startFocus 手势按下时的焦点（快甩保底的锚点） */
function settleFocus(vFocus, startFocus) {
  /* 落点判定锚在【目标】而不是视觉位置 focus.value：一阶模型下 x 可能滞后不足一帧，
     而「用户把卡片拖到哪了」的唯一权威是 target（输入累积出来的意图）。 */
  const cur = motion.target
  const last = Math.max(0, apps.value.length - 1)
  const isFlick = Math.abs(vFocus) >= FLICK_V_MIN
  let idx = Math.round(cur)

  if (isFlick) {
    /* 方向保底：快甩至少要翻过「起点那张」后面/前面的一张。
       锚在 startFocus → 已经靠位移翻过去的不会被重复计数。 */
    const from = Math.round(startFocus)
    idx = vFocus > 0 ? Math.max(idx, from + 1) : Math.min(idx, from - 1)
  }

  /* 先夹到合法区间再落定 —— 自省口报的必须是【真实决策】，而不是夹取前的中间值
     （反向上甩贴着 0 号卡时中间值会是 -1，探针会据此误判成越界）。 */
  idx = Math.max(0, Math.min(last, idx))
  /* ── 第二十四轮：收尾只剩一条路 ──────────────────────────────────────────────
   * 这里原来分叉成两条：快甩（且非越界外甩）注入初速度走欠阻尼 ios-deck（ζ=0.65、
   * 阶跃过冲 6.7%），其余走临界阻尼 ios-deck-settle + 显式 v0 = 0；第二十二轮还为
   * 「越界外甩」补了 deckFlingOutward 判据。三样东西的存在理由都是同一个：
   * 要在「注入的动量」与「位置被逐笔直写」之间找平衡。
   *
   * 现在位置只有一个写者、模型是一阶的（速度 = 剩余距离 / 时间常数，且有 VMAX 上限）
   * ⇒ 【过冲在数学上不存在】，越界判据随之失去意义：到边界时 target 被 clampTarget
   * 夹住 ⇒ d 归零 ⇒ 立即停 —— 就是 Ricky 要的「绳子绷直了应该立即停止」。
   * 快甩的手感不再靠「注入初速度」制造，而是模型自带：远距离时速度顶到 VMAX（力固定）
   * ⇒ 冲出去；距离变小时速度按 d 收缩 ⇒ 减速停下（对齐参考视频 V4 的观感）。 */
  settleTo(idx)
  /* 松手判定的自省口（与 main.js 暴露 window.__system 同性质）：
     回归探针拿它当 oracle —— 断言「给定 (cur, vFocus, startFocus) 的判定必须满足
     本文档的规则」，而不是把某个索引写死（写死必然与「最后 100ms 窗口速度」的实际值对不上）。 */
  window.__switcherSettle = {
    cur: +cur.toFixed(4),
    from: +startFocus.toFixed(4),
    vFocus: +vFocus.toFixed(3),
    isFlick,
    idx
  }
}

/* 邻居进场编排：
   - 手势路径：开关打开瞬间即「已在槽位」（藏在前卡后面，前卡缩小自然露出），无滑入；
   - 桌面路径：下一帧起自下方上浮，逐张 60ms 错峰（参考视频入场）。 */
const neighborsIn = ref(false)
const entranceDone = ref(false)
const homePath = ref(false)
const hasFollow = ref(false)
let dwellTimer = null
let settleTimer = null
/* 触控板横滑的状态（需求①）—— 必须声明在 appSwitcherOpen 的 watch【之前】：
   那个 watch 带 immediate，setup 期间就会跑；状态若声明在后面，
   watcher 里的 cancelWheel() 会踩到 TDZ。 */
const wheelAcc = ref(null)
/* 第二十四轮：触控板输入的累积器。判据在 utils/switcherMotion.accumulate ——
   以「1 CSS 像素是屏幕能表达的最小位移」为界：反向要先吃掉 1px 才提交，
   所以 ±2.5px 的反号噪声被压成亚像素残摆，而真实反调只滞后 1px。
   它替代了第二十三轮的 7px 反向死区 —— 那一版把「抖」换成了可感知的黏滞
   （Ricky 原话「越改越差了」），因为 7px 已经大于真实微调的幅度。
   与 wheelAcc 同生命周期：手势起点新建、endWheel / cancelWheel 清掉。 */
let wheelInput = null
let wheelIdleTimer = null
/* 点空白退出的动画定时器（第八轮，需求④）—— 同一个理由必须声明在这里：
   appSwitcherOpen 的 watch（immediate）在关闭分支里 clearTimeout(closeTimer)，
   声明在下面会直接抛「Cannot access 'closeTimer' before initialization」，
   整页白屏（实测过）。 */
let closeTimer = null
/* 手势状态（第八轮上移到此处，同 TDZ 理由）：appSwitcherOpen 的 immediate watch
   在关闭分支里要清掉未完成的拖动 —— 拖到一半被程序化关掉时，悬挂的 drag 会让
   下一次打开的第一帧带着旧起点。声明留在下方会踩同一个 TDZ。 */
const drag = ref(null)
/** 上滑移除松手后的「位姿接力」：{ cardId, dy }，只存活一帧（见 stackStyle / onPointerUp） */
const vLetGo = ref(null)
const dismissing = ref(null)
/* ---- 一键清理（需求⑩）的编排态 —— 同样必须声明在 watch 之前（TDZ）----
   clearing = 已武装：卡片拿到「飞出」专用过渡，但目标值还是原位（位姿不动）；
   clearGo  = 放行：下一帧才把目标值切到屏外。分两帧是必须的，与 resumeWithExpand
             同一个理由：过渡属性与目标值同帧变更时，before-change style 里没有过渡
             可依，浏览器会把这次变更当成瞬移。
   多卡时按 |a| 递增错峰（C 位先走、两侧跟进），让「清空后台」读起来是一次连锁。 */
const clearing = ref(false)
const clearGo = ref(false)
let clearTimer = null

function markEntrance() {
  clearTimeout(settleTimer)
  /* 收尾时刻 = 最后一张的 delay（(n−1)×stagger）+ 过渡时长 + 一点余量。
     必须【不早于】过渡终点：entranceDone 一旦提前翻真，stackStyle 的 transitionDelay
     会从 i×60ms 跳回 0ms，浏览器按新的 delay 重算正在跑的过渡 ⇒ 卡片中途一顿。
     （第十轮·需求①：旧式 `n×60 + 320` 是配 0.32s 过渡写的，过渡拉长后必须同步。） */
  const last = Math.max(0, apps.value.length - 1)
  settleTimer = setTimeout(
    () => { entranceDone.value = true },
    last * NEIGHBOR_ENTER_STAGGER_MS + NEIGHBOR_ENTER_MS + 60
  )
}

watch(
  () => system.appSwitcherOpen,
  (open) => {
    clearTimeout(dwellTimer)
    clearTimeout(settleTimer)
    if (!open) {
      /* 关闭时必须【停掉进场弹簧 + 进度归零】。
         历史 bug（2026-09-12 修复）：resumeApp/dismissAll 只置 appSwitcherOpen=false，
         而 openP 已停在 1 且 watch(openP) 会把进度写回 1 → visible 恒为 true →
         遮罩（含 backdrop-filter 模糊）永久糊在屏幕上，切回应用后整屏发虚。 */
      openStop()
      system.setSwitcherProgress(0)
      system.switcherDwell = false
      neighborsIn.value = false
      entranceDone.value = false
      homePath.value = false
      hasFollow.value = false
      preCommit.value = false
      /* 触控板的未决吸附必须一并撤掉 + 放开过渡：
         否则关闭瞬间若还压着 endWheel 的定时器，它会在下一次打开时改焦点；
         而 focusMoving 挂着会把「关闭」那一段的卡片过渡全关掉（卡片瞬移）。 */
      cancelWheel()
      focusMoving.value = false
      /* 一键清理的未决定时器同理：若它还活着，会在下一次打开时把新卡片「清空」掉 */
      clearTimeout(clearTimer)
      clearTimer = null
      clearing.value = false
      clearGo.value = false
      /* 第八轮：退场动画窗口 + 两条新弹簧一并复位（否则下一次打开会带着
         上一轮的挤压量/跟手偏移出生）。第九轮：sq 的零点从 1 改成 0（口径变更）。 */
      clearTimeout(closeTimer)
      closeTimer = null
      sqReset()
      followFreeSnap(0)
      drag.value = null
      vLetGo.value = null
      return
    }
    /* 第九轮（需求⑤）：打开 = 松手 ⇒ 在这里释放「跟手偏移」。
       旧版把释放只写在 onPointerUp 里，而应用内上滑那条路径的 pointerup 落在
       HomeIndicator 上，本组件的 onPointerUp 根本不会执行 ⇒ followFree 恒为 0
       ⇒ 交接那一帧横移偏移原封不动地消失，单帧硬跳最高 50.5px（探针实测）。
       放在 appSwitcherOpen 置真这一刻，覆盖所有打开路径（手势 / 程序化）。 */
    exitedHome.value = false
    releaseSqueeze()
    /* 同步编排（不放到 nextTick）：邻居卡要和开关置位在同一帧就带上目标样式，
       否则会先以 opacity 0 渲染一帧、再补 0.2s 淡入。measure() 走 .screen 兜底，
       不依赖本组件 dom 是否已挂载。 */
    measure()
    focusSnap(frontIndex.value)
    homePath.value = !system.activeAppId
    /* 跟手卡是否正在顶替堆叠前卡。
       第七轮修正：旧判据 `switcherProgress < 1` 在【上滑越过满量程】（进度 >1，
       卡片按 0.55^(p-1) 继续缩小到比 C 槽位还小）时会翻成 false → 堆叠前卡
       （C 槽位尺寸）在跟手卡下面露出来 = 双重曝光。改为只看「有没有跟手卡」
       （进度 >0 且尚未交接完成），与 followStyle 的存续条件严格一致。 */
    hasFollow.value = !!system.activeAppId && system.switcherProgress > 0
    if (homePath.value) {
      /* 桌面路径（无前台应用可缩放）。两种来法必须分开处理：
         ① 手势停驻激活 —— 卡片此刻【已经在屏上跟手入场中】（进度 >0），
            直接让它就位即可；若还去播「自下方上浮」会先跳回屏幕下方再升起，很怪。
         ② 直开（调试 / 程序化）—— 卡片尚未在场，走 60ms 后错峰上浮的入场编排。 */
      const wasFollowing = system.switcherProgress > 0.02
      system.setSwitcherProgress(1)
      openSnap(1)
      if (wasFollowing) {
        neighborsIn.value = true
        entranceDone.value = true
        return
      }
      dwellTimer = setTimeout(() => { neighborsIn.value = true; markEntrance() }, 60)
      return
    }
    // 手势路径：进度从交接点连续推到 1（不论小于还是【大于】1 —— 手指越过满量程时
    // 交接进度会 >1，必须双向都能弹回固定终点，否则跟手卡永远压在堆叠卡上、切换器卡死）；
    // 邻居卡立即就位（不滑入、不淡入）
    openSnap(system.switcherProgress)
    openTo(1)
    neighborsIn.value = true
    entranceDone.value = true
  },
  { immediate: true }
)

/* ---- 停驻 → 邻居卡提前进场（第七轮·批次 2，需求⑫）----
   见 preCommit 的注释。触发源用 HomeIndicator 已经算好的 `system.switcherDwell`
   （「上滑 >5% 后停住 120ms」），不新起一个计时器 —— 否则「松手能否进多任务」与
   「邻居卡什么时候进场」会变成两套阈值，早晚不一致。

   只在【应用内上滑】这条路径 + 切换器尚未打开时生效：
     · 桌面路径本来就在手势期渲染 deck（homeEntranceFollowing 自左侧横移入场），
       再叠一层「预提交」会和跟手横移打架；
     · 切换器已打开时邻居卡早已就位，重复置位会打断交接的错峰编排。 */
watch(
  () => system.switcherDwell,
  (dwell) => {
    if (!dwell || system.appSwitcherOpen || preCommit.value) return
    if (!system.activeAppId) return
    if (system.switcherProgress <= 0.02) return // 上滑量不足，别把 deck 提前铺出来
    measure()
    /* deck 一开始就必须朝向【前台应用】那张卡：焦点默认 0，而前台应用未必是
       recentApps[0]（用户可能是从较早的任务切回来的）。 */
    focusSnap(frontIndex.value)
    /* 堆叠前卡继续由跟手卡顶替（opacity 0）。跟手卡此刻可能比 C 槽位还小
       （上滑越过满量程），不顶替就会在它下面露出第二张卡 = 双重曝光。 */
    hasFollow.value = true
    preCommit.value = true
    // 先让堆叠卡以「待进场」态（opacity 0 + 左移 36px）渲染一帧，下一帧再切目标态 ——
    // 同一帧内挂载 + 切换目标态浏览器不会跑过渡，卡片会「啪」地出现。
    requestAnimationFrame(() => {
      if (!preCommit.value) return
      neighborsIn.value = true
      markEntrance()
    })
  }
)

/* 预提交的撤销：手指重新滑起来时 HomeIndicator 会把 switcherDwell 撤掉，但这里【不】跟着
   立刻收场 —— 微调停留位置时的来回抽动比留在场上更难受。只有上滑量也退掉了
   （进度落到 12% 以下，等价于「这次手势放弃了」）才把邻居卡收回去。 */
watch(
  () => system.switcherProgress,
  (p) => {
    if (!preCommit.value || system.appSwitcherOpen) return
    if (p > 0.12) return
    preCommit.value = false
    neighborsIn.value = false
    hasFollow.value = false
  }
)

/* ---- 位姿：a = i - focus ----
   0 = 焦点层（屏幕正中），1/2/3 = 更早的背景层（向左阶梯 + 缩小 + 变暗），
   负数 = 比焦点更新的卡（向右退出屏幕）。详见 switcherDeck.js。
   第四轮起不再有「扇开弹簧」：位姿完全由 focus（含其小数进度 xFrac）唯一决定 ——
   拖动期逐帧跟手、松手后由 focus 弹簧推进，背景层与顶卡天然同相位。
   第八轮起位姿用 **poseFocus**（= max(0, focus)）：左滑越界量改走横向压缩（需求⑦）。 */
function poseOf(i) {
  return deckPose(i - poseFocus.value, metrics.value, xFrac.value)
}

/* 深侧剔除的【磁吸】判据（第十一轮）——
   deckVisible 的深侧边界是硬整数（a ≤ MAX_DEPTH），而 focus 吸附到整卡是【渐近】的：
   临界阻尼下 focus 只会从下方无限趋近 1.0，a 也就永远差一点点到 2 ⇒ 第 4 张卡一直不渲染，
   直到 springSettled 把 x 直接置成整卡（探针实测 +714ms）—— 而牌堆在 +360ms 就已视觉到位，
   读起来是「停稳之后又闪出一张」。
   （改前更糟：ζ=0.65 的过冲让 focus 在整卡边界上来回穿两次 ⇒ 第 4 张卡「出现→消失→再现」。）
   改法：焦点进入整卡附近的磁吸窗口时，**只把剔除判据**换成目标整卡；
   几何仍用真实 poseFocus（卡的落点不受影响），且深侧本来就被 deckPose 钳在 MAX_DEPTH 上，
   所以它出现时已经坐在自己的槽位里（不会「飞进来」）。窗口 0.06 层 ≈ 14.7px ⇒
   出现在运动末段（临界阻尼下 ≈ +270ms），一次性、不闪。
   只对深侧有实际影响：离场侧的剔除门槛 −1.46 落在「整数 + 0.46」上，永远落不进
   0.06 的磁吸窗口 ⇒ 负半区行为逐位不变。 */
const DEEP_SNAP_FOCUS = 0.06
const cullFocus = computed(() => {
  const f = poseFocus.value
  const r = Math.round(f)
  return Math.abs(f - r) < DEEP_SNAP_FOCUS ? r : f
})

/* 需要渲染的卡片：离焦点太远的直接剔除（规则⑤ 最多三层）。
   正在移除 / 正在展开的必须保留，否则动画会闪断。
   第八轮（需求⑦）：判据必须用 poseFocus —— 用原始 focus 的话，左滑越界 0.6 层时
   最深层的 a 会算成 2.6 > MAX_DEPTH ⇒ 被判不可见 ⇒ 最底部卡片「直接消失」。
   第十一轮：改喂 cullFocus（见上），让深侧的出现时刻不依赖弹簧的渐近尾巴。 */
const renderedCards = computed(() =>
  apps.value
    .map((id, i) => ({ id, i }))
    .filter(({ id, i }) => id === dismissing.value || id === expanding.value || deckVisible(i - cullFocus.value))
)

/* 标签只跟「离焦点最近的那张」走，避免两张卡同时出现标签 */
const labelIndex = computed(() => {
  const last = Math.max(0, apps.value.length - 1)
  return Math.max(0, Math.min(last, Math.round(poseFocus.value)))
})

/* 卡体（应用预览）的透明度 —— 只在「堆叠前卡被跟手卡顶替」时与卡根不同。
 *
 * 需求③「应用内上滑进入多任务后应用卡片会非常明显的闪一下」的根因在这里：
 *   跟手卡与堆叠前卡在交接那一刻几何逐像素相等（探针实测 follow 宽 274.8 / x 77.6，
 *   front 宽 275 / x 77.5），本可以硬切；但 .switcher-card 上挂着 `opacity 0.22s ease`，
 *   于是「跟手卡卸载」与「前卡 0→1 淡入」不同步 —— 实测前卡从 op 0.065 花 220ms 才变实，
 *   中间那 100ms 屏幕上是一张【半透明的卡】。
 * 解法：把透明度【下沉到卡体】（卡根恒为 1）。
 *   ① 卡体的 opacity 没有任何 CSS 过渡 → 交接那一帧硬切，天然零闪断；
 *   ② 卡根保持 1 → 标签行（卡根的【子】节点，不是兄弟 —— 它挂在卡节点里，
 *      所以位移/缩放天然与卡一致，第九轮需求①的地基）在【停驻期】就一直在场。
 *      若继续把透明度挂在卡根上，停驻期 C 位的「图标 + 应用名」会整段缺失、到交接那一帧
 *      才突然冒出来（Playwright 截图实测：b2-1-hold 里没有「计算器」标签，b2-2-settled 才有）；
 *      参考视频 981c9428…mp4 的停驻段（f100 / f104）C 位标签是全程在的。
 * 其余路径（桌面入场上浮、上滑移除淡出）的透明度仍挂在卡根 —— 那些场景需要【连标签一起】淡。 */
function bodyOpacityOf(i) {
  /* followYields（第十二轮）：上滑删卡 / 前卡飞出期间跟手卡让位 ⇒ 卡体必须还给堆叠卡，
     否则「跟手卡不跟手 + 堆叠卡卡体透明」= 整段手势看不见任何东西。 */
  return i === frontIndex.value && hasFollow.value && !settledOne.value && !followYields.value ? 0 : 1
}

/* ── 卡片投影（第十轮·需求②）──────────────────────────────────────────────
   Ricky 原话：「现在卡片间的阴影过重」。

   成因：`.switcher-card-body` 上是一条常量投影片 `0 14px 36px rgba(0,0,0,0.42)`，
   而堆叠几何让前卡的右半边【压在后卡的露出条上】⇒ 42% 的黑 + 36px 模糊的水平外溢
   全部落在邻居卡那一条 23~52px 宽的可见条上，两条卡的交界被糊成一道黑沟。

   改法（两个方向同时收，而不是只调一个数）：
     ① 全局减重：焦点层 0.42 → 0.28、模糊 36 → 26、下移 14 → 12；
     ② 按层深递减：越深的卡（越靠后、越小、已被 brightness 压暗）投影再各降一档，
        到 depth ≥1 时稳定在 0.18 / 18px。深层卡本来就在暗遮罩上，重投影没有信息量，
        只会把遮罩也压黑。
   注意：投影挂在卡【内部】节点上，会跟着卡一起缩放 ⇒ 深层卡的投影本就等比更小，
   这里再减一档是「观感口径」而不是「几何补偿」。 */
function cardShadowOf(a) {
  const d = Math.min(1, Math.abs(a))
  const yOff = 12 - 4 * d
  const blur = 26 - 8 * d
  const alpha = 0.28 - 0.1 * d
  return `0 ${yOff.toFixed(1)}px ${blur.toFixed(1)}px rgba(0, 0, 0, ${alpha.toFixed(3)})`
}

/* 堆叠渲染态：统一的「藏 → 进场」编排，CSS transition 负责丝滑。 */
function stackStyle(i) {
  const p = deckPose(i - poseFocus.value, metrics.value, xFrac.value)
  let x = p.x
  let y = p.y
  /* 第十轮·需求①：scale 从「deckPose 的唯一输出」变成「可被入场态再乘一次」——
     入场时整卡在层缩放之上再乘 0.94（origin 0 0 ⇒ 右缘左收、左缘不动，与 deck 几何同构）。 */
  let scale = p.scale
  let opacity = 1
  let delay = '0ms'
  if (i === frontIndex.value && hasFollow.value) {
    /* 跟手卡顶替中：卡根保持不透明（标签行要一直在），只把【卡体】藏起来 ——
       见 bodyOpacityOf 的注释（透明度下沉到卡体是需求③「闪一下」的正解）。 */
    opacity = 1
  } else if (homeEntranceFollowing.value) {
    /* 第八轮（需求⑤，参考视频 52b4f2fa…mp4 逐帧量测）：桌面上滑进入多任务时，
       卡片组是【自左侧横向平移进场】的，不是旧版的自下方上浮。
       实测整组位移 345px / 444 屏 = 0.78 屏宽（C 卡右缘 30 → 375，左邻卡边缘与之
       严格同步 ⇒ 刚性平移而非逐卡缩放），时长约 19 帧 ≈ 0.79s；同期桌面图标在
       ~8 帧（0.33s）内虚化淡出（遮罩那条 opacity 已经在做这件事）。
       这里仍然逐帧直写（e = 手势进度）⇒ 上滑多少卡片就横移多少，保持跟手。
       ⚠️ 第九轮（需求④）：opacity 恒 1、不再乘 e。Ricky 原话「桌面激活多任务时入场的
       卡片不要半透明效果」—— 半透明是第八轮为了「淡入」加的，但那与「刚性平移进场」
       自相矛盾（整组位移本身就是入场，再叠淡入会让卡片在滑动过程中忽明忽暗）。
       入场的可见性完全交给位移：e=0 时整组在屏左 0.78 屏宽处（不可见），滑到 e=1 就位。 */
    opacity = 1
    x += deckEnterDx(screenW.value) * (1 - homeEntranceP.value)
    delay = '0ms'
  } else if (!neighborsIn.value) {
    /* 收场态：藏在左侧 0.78 屏宽处（与入场同一条轨迹，方向一致 ⇒ 原路退回）。
       - 直开进场：由 CSS 过渡横移进场（60ms 错峰）；
       - 手势取消：进度归零后落到这里 → 卡片原路【向左滑出】淡出。
         旧版是「沉到屏幕下方 30%」—— 那是第五轮的竖向入场留下的配套方向，
         第八轮入场改成横向后必须同步改这里，否则「取消」会变成卡片往屏幕外坠。 */
    opacity = 0
    if (deskPath.value) x += deckEnterDx(screenW.value)
    /* 应用内停驻预提交的「待进场」态（第十轮·需求① 重写）：
       自左侧 neighborEnterDx(i) 处滑入 + 起点略小（落位时「撑开」）。
       行程随层深递增 ⇒ 越深的卡从越远处来，读起来是逐张涌出而不是整块平移。
       ⚠️ 只在 preCommit 这一条路径上偏移 —— 桌面路径的「刚性平移进场」与
       「手势取消后原路退回」各有各的语义，串味会同时毁掉三条链路。 */
    else if (preCommit.value) {
      x -= neighborEnterDx(i)
      scale *= NEIGHBOR_ENTER_SCALE_FROM
      /* 垂直中心补偿：deckPose 的 y = cardCy − cardH·scale/2 是按【层缩放】算的，
         再乘一次入场缩放会把中心抬高 cardH·scale·(1−f)/2（≈5.5px）。
         补回去 ⇒「所有层的垂直中心恒等于 cardCy」这条不变量在入场全程也成立。 */
      y += (cardH.value * p.scale * (1 - NEIGHBOR_ENTER_SCALE_FROM)) / 2
    }
    delay = entranceDone.value ? '0ms' : `${i * NEIGHBOR_ENTER_STAGGER_MS}ms`
  }

  /* 上滑移除跟手（第七轮·批次 2，需求⑧）——
     Ricky 原话：「上滑删除卡片时，卡片未跟手上滑移动」。
     旧实现在 onPointerMove 里对 v 模式直接 return，整段手势卡片零位移，
     只有松手越过 110px 才「啪」地飞出去；现在被按住的那张卡实时跟随手指的纵向位移，
     ⚠️ 第十二轮（需求②）：跟手期【只位移、不变淡】。Ricky 原话「上滑多任务卡片的时候
     还是会有一个透明的渐变，取消上滑过程中卡片的透明度变化」—— 旧实现在这里叠了一条
     `opacity = min(opacity, 1 + ddy/320)`（上滑越远越线性变淡，滑满 320px 全透明）。
     与第九轮入场那条「opacity 恒 1」是同一个道理：卡片的可见性由【位移】表达就够了，
     再叠淡出就成了「忽明忽暗」，而且上滑 110px 就要判定飞出，淡到 0.66 更像卡坏了。
     松手时：过阈值 → 从当前位置直接飞出（飞出段的淡出见 dismissingStyle）；
     未过阈值 → 靠 CSS 过渡弹回原位（drag 置空即恢复过渡，见 .is-dragging 规则）。

     vLetGo 是「松手后仍沿用一帧拖动态位姿」的接力棒：`.is-dragging` 摘掉的那一帧
     浏览器才认得 transition，若同帧就把 transform 改成目标值，before-change style 里
     transition 还是 none → 卡片瞬移，跟手的那段位移全白做。 */
  const vOff = drag.value?.mode === 'v' ? drag.value : vLetGo.value
  if (vOff && vOff.cardId === apps.value[i]) {
    const ddy = Math.min(0, vOff.dy)
    y += ddy
    /* 第十二轮（需求②）：这里【不再】改 opacity —— 跟手期卡片只位移、不变淡。
       被删掉的那行是 `opacity = Math.min(opacity, Math.max(0, 1 + ddy / 320))`（上滑越远越淡）。
       反例护栏见 e2e「上滑跟手期 opacity 恒 1」。 */
    delay = '0ms'
  }

  return {
    width: cardW.value + 'px',
    height: cardH.value + 'px',
    transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
    filter: `brightness(${p.bright})`,
    zIndex: deckZ(i),
    borderRadius: RADIUS.value + 'px',
    opacity,
    transitionDelay: delay,
    /* 需求②：阴影按层深给值（详见 cardShadowOf）—— 走 CSS 变量而不是写死，
       因为卡体在子节点（.switcher-card-body），它才是真正投阴影的那一层。 */
    '--card-shadow': cardShadowOf(i - poseFocus.value),
    /* 需求①：入场窗口内【内联】覆盖过渡时长/曲线。
       为什么不另写一条 CSS 规则：通用那条
         `.app-switcher:not(.is-dragging):not(.is-focus-moving):not(.is-home-entrance)
          .switcher-card:not(.is-follow)`
       的特异性是 6（4 个 :not 各计 1），任何合理的入场规则（4~5）都压不住它，
       除非把同样的 :not 链再抄一遍 —— 那种重复早晚会脱钩。内联样式天然最高优先级。
       排除条件在 JS 里原样复刻通用规则那三条，避免在拖拽 / 吸附弹簧 / 桌面跟手期
       把它们的 transition:none 顶掉（这三态与 preCommit 本就互斥，这里是防御性写法）。
       ⚠️ 条件必须是 `!entranceDone`（不能是 `neighborsIn === false`）：
       transition 取的是【变更之后】那份计算样式，而 neighborsIn 翻真的同一帧
       —— 也就是唯一需要这条过渡的那一帧 —— 入场标记已经不再处于「未进场」了。 */
    ...(preCommit.value &&
    !entranceDone.value &&
    !drag.value &&
    !focusMoving.value &&
    !homeEntranceFollowing.value
      ? {
          /* 透明度必须比位移【快】得多（0.16s vs 0.48s）：
             缓起曲线的前 20% 只走 13% 行程，卡片这时还在很左边；
             若沿用默认的 0.22~0.3s 淡入，等它变实的时候已经快到位了 ——
             「滑进来」这段就白做了。0.16s 让它在起步阶段就是实体，位移全程可见。 */
          transition: `transform ${NEIGHBOR_ENTER_MS}ms ${NEIGHBOR_ENTER_EASE}, opacity 0.16s ease-out, filter 0.28s ease`
        }
      : {})
  }
}

/** 卡片左上角标签（图标 + 名称）的位置 —— 见 LABEL_INSIDE 开关。
 *  卡外上方时 top = -(图标行高 + 间隙)，这两个值与 deckMetrics 的 LABEL_ROW_H/LABEL_GAP
 *  同源（修正 C：图标 18 → 24px，行高与间隙一起纳入「整体居中」的 blockH 计算）。
 *  ⚠️ 这里的坐标系是【卡自身】的局部坐标：标签永远挂在卡节点里，所以位移/缩放天然一致
 *     （第九轮需求①「图标必须与卡片作为一个整体进行位移与缩放」的地基）。 */
function labelStyle() {
  return LABEL_INSIDE
    ? { top: '10px', left: '12px' }
    : { top: -(DECK.LABEL_ROW_H + DECK.LABEL_GAP) + 'px', left: '0px' }
}

/** 跟手卡（.is-follow）标签行的锚点（第九轮需求①）。
 *
 * 症状（Ricky 参考图 + 探针 /tmp/vwork/r9/probe-focus.mjs）：跟手卡【完全没有标签行】，
 * 屏幕上唯一的「图标 + 应用名」挂在【堆叠前卡】上 —— 于是入场上滑 + 横向漂移时，
 * 卡片被拖到哪，标签就与它分离多远（探针：label 在槽位、card 在 x+50）。
 *
 * 为什么跟手卡的标签不能直接照抄 labelStyle：
 *   跟手卡是【整屏尺寸（430×932）+ 中心锚点缩放 s】的节点，而 s 从 1 连续变到
 *   previewScale（0.6395）。若把标签按 24px 直接放进去，它会被外层 scale 一起缩到
 *   15px，且在落位那一刻比堆叠卡的标签小一圈 ⇒ 交接时标签会「跳一下大小」。
 * 做法：包一层锚点（origin 0 0）把坐标换算回【卡本身的尺寸体系】——
 *   锚点 scale(1/previewScale)，外层再乘 s ⇒ 标签的净缩放 = s / previewScale。
 *   · 落位（s = previewScale ⇒ 净 1）：与堆叠卡标签【逐像素一致】（24px 图标、36px 上偏），
 *     所以交接那一帧标签零跳变；
 *   · 手势中（s > previewScale）：标签随卡片一起放大 ⇒ 「图标与卡片作为一个整体缩放」。
 * 位置：锚点放在卡局部 (0,0) = 卡的左上角，标签再在锚点里向上偏 36px（同 labelStyle），
 *   两个偏移都被同一个 scale 乘 ⇒ 标签与卡的相对关系在整段手势里恒定。 */
const followLabelStyle = computed(() => ({
  transform: `scale(${1 / Math.max(previewScale.value, 0.01)})`
}))

/* 交接判定：进场进度到位（跟手卡与前卡槽位几何重合）+ 跟手偏移已归零后，交给堆叠前卡。
   第九轮（需求⑤）并入 followFree —— 交接要求「几何严格相等」，而跟手卡的横向/纵向偏移
   由 followFree 单独释放；不把它并进判据就完全依赖两个弹簧的相对速度，一旦偏移还没归零
   就交接，那一帧会硬跳（探针实测最坏 50.5px）。并进来之后这条不变量由判据本身保证，
   而 'ios-snappy'（settle ≈160ms）确定早于 openP 的 'ios-gentle'（≈250ms），不会拖慢交接。 */
const settledOne = computed(
  () =>
    openP.value >= 0.999 &&
    followFree.value >= 0.999 &&
    system.switcherProgress >= 0.999 &&
    system.switcherProgress <= 1.001
)

/* 跟手卡【让位】判据（第十二轮，需求②的连带修正）。
   跟手卡（.is-follow，z=12000）只在「进场交接」期间顶替堆叠前卡 ——
   一旦用户对前卡发起【上滑删卡】(v 模式) 或那张卡正在飞出，它必须让位给堆叠卡本身。

   为什么必须让（探针实测 /tmp/vwork/r12/probe-see.mjs + probe-shots.mjs）：
     · 跟手卡不消费 drag 的纵向位移（它的 cx/cy 只跟 switcherProgress 走），
       跟手上移 / 飞出全发生在【它下面那张堆叠卡】上 ——
       而那张卡的卡体被 bodyOpacityOf 藏成 0（hasFollow && !settledOne），
       卡根又被跟手卡压在下面 ⇒ 整段手势【零视觉反馈】：
       实测上滑 168px 后的截图与静止态逐字节一致（差异只有状态栏时钟）。
     · 这同时也解释了第七轮需求⑧「跟手上移」为什么体感没做成 ——
       e2e 量的是 `.is-deck[data-depth=0]` 的几何（确实动了），但它当时不可见。
     · 桌面路径（activeAppId = null ⇒ 模板不渲染跟手卡）一直是对的：
       那张卡可见、跟手、且【真的会随高度变淡】—— Ricky「上滑多任务卡片的时候
       还是有一个透明的渐变」看到的正是这条路径（第十二轮已删掉那条 opacity）。
   让位条件只覆盖「前卡」这一张：拖别的卡（i ≠ frontIndex）时它的卡体本来就是 1，
   本来就看得见跟手与飞出，不需要（也不应该）动跟手卡。 */
const followYields = computed(
  () =>
    !!system.activeAppId &&
    (drag.value?.mode === 'v' ||
      !!vLetGo.value ||
      /* 第十四轮（需求①）：点卡恢复的放大卡【也是】堆叠前卡本身（同一张卡换了位姿），
         bodyOpacityOf 若继续把它藏成 0，整段放大动画就完全看不见 —— 屏幕上只有一张
         停在卡位不动的跟手卡，直到交接那一帧才「啪」地变满屏，Ricky 原话
         「点击多任务卡片进入全屏时会卡和闪一下」。让位条件必须覆盖它。 */
      !!expanding.value ||
      dismissing.value === system.activeAppId)
)

/* ---- 跟手缩放（Ricky 2026-09-12 纠正）----
   ① 锚点 = 落点 = 【屏幕中心】：卡片原地缩小，全程不左右漂；
   ② 缩放严格跟随手指的上滑位移做【无极】变化 —— 上滑越远缩得越小，
      越过满量程（260px）之后继续按指数曲线变小；
   ③ 【绝不淡出】：卡片缩小但不允许「缩到不见」，并留一个可见下限兜底；
   ④ 松手后由弹簧回到固定终点（前卡槽位、最终大小）。 */
const MIN_FOLLOW_SCALE = 0.3
/* 第八轮（需求⑥）：跟手偏移的释放权重。
   手指按住期间恒为 1（偏移满量程、严格跟手）；松手后 followFree 弹簧把它推到 0，
   卡片在落位过程中把横向/纵向偏移平滑收回 —— 交接那一帧必须严格等于槽位几何，
   否则与堆叠前卡硬切时会跳一下（需求③的老问题）。 */
const followDriftW = computed(() => 1 - Math.min(1, Math.max(0, followFree.value)))

/* ---- 入场手势的横向残留（第十四轮·需求③）----
 *
 * Ricky 原话：「（在卡片上）点击还会左右抖动」。
 *
 * 根因：`system.switcherDragX` 是【进入手势】留下的横向位移（手指上滑时的副轴漂移，
 * 单手拇指起手必然带一点）。它只该在入场那一段被消费 —— 卡片落位时 followFree 弹簧
 * 把权重 w 推到 0，偏移自然归零。问题出在 onPointerDown 里的 `followFreeSnap(0)`：
 * 它把 w 重新拉回 1 ⇒ **已经衰减掉的残留被复活**。
 *
 * 探针实测（/tmp/vwork/r14/probe-label.mjs，真实路径：入场时横漂 0/30/60/90px）：
 *   入场残留 dragX = 30 / 60 / 90 ⇒ 之后每次在卡片上按下，可见的跟手卡【瞬间】
 *   横移到 x = 90.1 / 102.7 / 115.3（槽位是 77.5）= 残留 × FOLLOW_X(0.42)，
 *   再用 ~160ms 弹回槽位。也就是说「点一下」= 卡片先跳 12.6~37.8px 再弹回来。
 *
 * 修法：只在【没有切换器内部交互】时才注入这段残留。入场手势全程 drag 恒为 null
 * （拖动发生在 HomeIndicator 上），所以入场期的 X 轴跟手、落位期的偏移回收都不受影响；
 * 一旦是「在卡片上按下 / 跟手删卡 / 放大恢复 / 飞出 / 一键清理」，残留一律不再注入。 */
const internalActing = computed(
  () => !!drag.value || !!vLetGo.value || !!expanding.value || !!dismissing.value || clearing.value
)

/* ---- 手指速度低通（第十四轮·需求②）----
 *
 * Ricky 原话：「从应用进入到多任务界面时，全屏应用缩放为卡片的过程动画一抖一抖的，
 * 感觉长宽比例在不停的随机变化」。
 *
 * 根因：弹性挤压的形变量 def（见下方 followStyle ③）由 `system.switcherDragV`
 * ——HomeIndicator 逐帧算的【瞬时速度】Δraw/dt——直接驱动。而 dt 与 Δraw 都不可靠：
 *   · Chrome 会把同一帧内的多个 pointermove 合并派发，相邻两次采样 dt 可差 3 倍；
 *   · 主线程抖动 / 重绘会让 dt 在 6~26ms 之间跳。
 * ⇒ 同一段匀速滑动里速度会在 280 ↔ 534 px/s 之间乱跳，def 跟着跳 ⇒ sx/sy 一帧一个值。
 *   探针实测（/tmp/vwork/r14/probe-enter.mjs，30 步 × 10px 上滑）：
 *     宽高比极差 0.4236 ~ 0.4614（9% 的摆动）；单帧最大跳变 2.19%，
 *     是逐帧中位跳变（0.17%）的 13 倍 —— 这正是肉眼看到的「一抖一抖」。
 *
 * 修法：把「上一帧的瞬时速度」换成「最近约 110ms 的平均速度」（一阶低通 / EMA）。
 *   这是物理上更该被消费的量（手指近期走得多快），且对采样抖动不敏感。
 *   低通是线性时不变的：起手快甩的形变脉冲被完整保留（上升沿从 1 帧摊到约 3 帧），
 *   峰值不变 ⇒ e2e 的「非等比形变」契约（max(sy−sx) > 0.02）仍然成立。
 *
 * 为什么放在消费端而不是 HomeIndicator：switcherDragV 在 store 里的语义就是
 * 「瞬时速度」（见 systemStore.js 的注释，且该文件在 AGENTS.md 的共享锁清单里），
 * 低通是【读它的人】的口径选择，不该改变对外语义。
 *
 * 用 watch 而不是写在 computed 里：watch 默认 flush='pre'，同一帧内多次采样会合并成
 * 一次 → 恰好等于「每帧只推进一次 EMA」，而 computed 可能被重算多次（副作用不可控）。 */
const SQUASH_V_TAU_MS = 110
const dragVSmooth = ref(0)
let vSmoothT = 0
watch(
  () => system.switcherDragV,
  (raw) => {
    const now = performance.now()
    const dt = vSmoothT ? Math.min(64, Math.max(1, now - vSmoothT)) : 16
    vSmoothT = now
    if (!raw) {
      /* 松手 / 手势复位时 HomeIndicator 写 0 ⇒ 没有新的手指速度：立刻归零。
         形变归零本来就由 followFree 那条弹簧负责（落位那一刻必须严格等于槽位几何）。 */
      dragVSmooth.value = 0
      vSmoothT = 0
      return
    }
    const a = 1 - Math.exp(-dt / SQUASH_V_TAU_MS)
    dragVSmooth.value += (raw - dragVSmooth.value) * a
  }
)

/* ── 跟手卡的【几何量】唯一出口（第十六轮抽出）────────────────────────────
 * 为什么不直接在 followStyle 里算、再让 deckGroupStyle 从 style 字符串里反解：
 *   deckGroupStyle（第十六轮）必须拿到与跟手卡 transform 【逐位相同】的 cx/cy/sx——
 *   两者哪怕差 0.1px，也会在交接那一帧被眼睛读成「跳一下」。
 *   共用一个纯计算 ⇒ 结构上不可能漂移。
 * 返回 null = 跟手卡不在场（未开始 / 已交接 / 已让位），此时群组变换必须退化为单位阵。 */
const followGeom = computed(() => {
  const p = system.switcherProgress
  /* followYields：上滑删卡期间跟手卡让位 —— 见该 computed 的注释（第十二轮） */
  if (p <= 0 || settledOne.value || followYields.value) return null
  /* ⚠️ 桌面路径（activeAppId 为空）根本没有跟手卡（模板那条 v-if 也要求 activeAppId）——
     必须在这里一并短路，否则 frontIndex 会落到 apps.indexOf(null) = −1 → 0，
     凭空给出一份「以第 0 张卡为前卡」的几何，让 deckGroupStyle 在桌面入场上误作用一次。
     （模板靠 `followStyle && system.activeAppId` 挡住了跟手卡本身，但挡不住 deckGroupStyle。） */
  if (!system.activeAppId) return null
  const idx = frontIndex.value
  const slot = poseOf(idx)
  const slotCx = slot.x + cardW.value / 2
  const slotCy = slot.y + cardH.value / 2
  const w = followDriftW.value
  // p ≤ 1：屏幕中心 → 卡位中心（两者水平上同为屏幕中心，只有纵向在移动）
  let cx = screenW.value / 2 + (slotCx - screenW.value / 2) * Math.min(1, p)
  let cy = screenH.value / 2 + (slotCy - screenH.value / 2) * Math.min(1, p)
  const s =
    p <= 1
      ? 1 + (previewScale.value - 1) * p
      : Math.max(MIN_FOLLOW_SCALE, previewScale.value * Math.pow(0.55, p - 1))

  /* ① X 轴跟手（需求⑥的本体）。
     旧实现 cx 的横向项 (slotCx − screenW/2) 恒为 0（槽位本来就水平居中），
     所以手指横向怎么动卡片都纹丝不动 —— Ricky 原话「只有 Y 轴跟手」。
     参考视频 4c4231b0…mp4 实测：上滑期间窗口中心 x 从 225 走到 326（+101px）。
     这里把 HomeIndicator 采到的副轴位移按 FOLLOW_X 注入；乘 w 保证松手后归零。
     ⚠️ 第十四轮（需求③）：仅在没有切换器内部交互时注入 —— 否则按下瞬间
     followFreeSnap(0) 会把【上一轮入场手势的残留】复活成一次横向跳动。见 internalActing。 */
  cx += (internalActing.value ? 0 : system.switcherDragX) * DECK.FOLLOW_X * w

  /* ② 越过满量程后继续上移。
     旧实现 p > 1 时 cy 冻结在槽位中心，而参考视频里卡片被继续拉高
     （实测拖动保持态中心 y ≈ 390，而落位后是 457 —— 高出约 67px）。 */
  if (p > 1) cy -= screenH.value * DECK.OVER_RISE_FRAC * (p - 1) * w

  /* ③ 弹性挤压拉伸（需求⑥）—— 非等比缩放，近似体积守恒。
     参考视频实测宽高比 0.477 → 0.447（−6%）→ 0.479：起手一瞬被纵向拉伸、
     横向收窄，随后回弹。两个驱动量：
       · 越过满量程的量（被拉得越远，形变越大）；
       · 手指速度（快甩时形变最猛 —— 橡皮筋的物理直觉）。
     ⚠️ 第十四轮（需求②）：速度项必须吃【低通后】的 dragVSmooth，不能吃原始瞬时速度 ——
     原始值逐帧乱跳会让宽高比「随机变化」（探针实测单帧跳变 2.19%）。见该 watch 的注释。
     两者取大者，再乘释放权重 w（松手 → 形变归零 → 与槽位几何严格一致）。 */
  const over = Math.max(0, p - 1)
  const vel = Math.min(1, Math.abs(dragVSmooth.value) / DECK.SQUASH_V_REF)
  const def = Math.max(DECK.SQUASH_MAX * Math.min(1, over / 0.6), DECK.SQUASH_MAX * vel) * w
  const sx = s * (1 - def)
  const sy = s * (1 + def)

  return { p, cx, cy, s, def, sx, sy, w }
})

/* 跟手卡的渲染样式（几何量全部来自 followGeom，见上）。 */
const followStyle = computed(() => {
  const g = followGeom.value
  if (!g) return null
  const { p, cx, cy, sx, sy } = g
  return {
    width: screenW.value + 'px',
    height: screenH.value + 'px',
    transform: `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(${sx}, ${sy})`,
    /* 圆角要按【各自的】缩放分量补偿，否则横向挤压会把圆角拉成椭圆 */
    borderRadius:
      (RADIUS.value * Math.min(1, p)) / Math.max(Math.min(sx, sy), 0.01) + 'px',
    opacity: 1,
    zIndex: Z_FOLLOW
  }
})

/* 预览内容缩放：跟手/展开卡的外层 transform 已负责缩放，内容恒为 1；
   堆叠卡 = 卡宽/屏宽（与屏幕同比例缩放，零裁切） */
function contentScale(isFollow) {
  return isFollow ? 1 : previewScale.value
}

/* ---- 底部垃圾桶的出现/消失时机（第九轮重做，需求②）----
 *
 * Ricky 原话：「删除改为按钮松手后再出现，点击空白处回桌面时立即消失」。
 *
 * 旧判据 `(switcherProgress − 0.5) / 0.5` 的毛病：进度在【手势进行中】就已经爬到 0.8~1.0
 * ⇒ 手指还没松、卡片还在跟手缩放，底部垃圾桶已经满亮 —— 它跟着手指「提前」出现了。
 *
 * 新判据只有两个状态，中间那段淡入交给 CSS 过渡（.switcher-dock 默认 opacity 200ms）：
 *   · 未打开（手势中 / 桌面路径跟手期）→ 0：桶在 DOM 里但完全透明；
 *   · 已打开（= 松手，appSwitcherOpen 置真）→ 1：由 CSS 过渡淡入 ⇒「松手后再出现」。
 *
 * 退场（closing）：恒 0，且 .is-closing 下【关掉过渡】（transition: none）——
 *   这就是「点击空白处回桌面时立即消失」，不许它慢悠悠地淡（Ricky 要的是「立即」）。 */
const chromeOpacity = computed(() => {
  if (closing.value) return 0
  return system.appSwitcherOpen ? 1 : 0
})

/** 垃圾桶容器距屏幕底的像素（= home inset + DECK.DOCK_GAP）。
 *  第七轮：改成由这里【唯一给出】并内联绑到 :style，CSS 里不再抄一份 gap ——
 *  历史上 CSS 的 26px 与 DECK.DOCK_GAP 是两份副本，改一处必脱钩。 */
const dockBottom = computed(() => homeInset.value + DECK.DOCK_GAP)

function compOf(id) {
  return appComponents[id] || PlaceholderApp
}
function appOf(id) {
  return getApp(id)
}
function nameOf(id) {
  return i18n.appName(id) || getApp(id)?.name || id
}

/* ================= 手势 ================= */

/* drag / vLetGo / dismissing 的声明已上移到 setup 顶部（见那里的 TDZ 注释）——
   appSwitcherOpen 的 immediate watch 需要它们。 */

/* 速度追踪（环形缓冲 100ms）—— 松手投影用。
   关键：读取时先按【当前时间】剔除过期样本 —— 手指停住 100ms 以上就没有动量了，
   必须返回 0（否则「拖到一半停住再松手」会带着停顿前的旧速度继续翻页）。 */
const vt = []
function vtPush(x, t) {
  vt.push({ x, t })
  while (vt.length > 1 && t - vt[0].t > 100) vt.shift()
}
function vtVelocity(now = performance.now()) {
  while (vt.length > 1 && now - vt[0].t > 100) vt.shift()
  if (vt.length < 2) return 0
  const a = vt[0]
  const b = vt[vt.length - 1]
  const dt = b.t - a.t
  return dt > 0 ? (b.x - a.x) / dt : 0 // px/ms，向右为正
}

/* dragSqueeze / releaseSqueeze / sqReset 三兄弟的定义已上移到 sq 弹簧声明之后
   （第十七轮：随「挤压逐帧限速」一起搬过去，见那边的长注释）。 */

/* ---- 手势模式判定（第十二轮重写）----
   Ricky 原话：「移动端通过安卓的 Chrome 浏览器打开，上滑删除多任务卡片的时候，
   总是变成误触成左右滑动，帮我查一查是什么原因？」

   根因（不是猜的，是探针实测 —— /tmp/vwork/r12/probe-touch.mjs，
   用 CDP Input.dispatchTouchEvent 注入**真实触摸**，Chrome 合成 pointerType='touch' 的指针事件；
   仓库里的 e2e 用 page.mouse 驱动，坐标精确、无接触面抖动，所以桌面端永远点不出这个毛病）：

   · 旧判定 = `Math.abs(dy) > Math.abs(dx) * 1.4`，且【第一帧满足 |dx|≥6 或 |dy|≥6 就一帧定终身】。
     等价于「首个 pointermove 的仰角 ≤ 54.5° 就判成横滑」。
   · 而触摸屏派发的第一个 pointermove 恰恰是最不可靠的一帧：
       - 手指接触面是个椭圆，按下瞬间质心还在【滚动】，天然带几个像素的横向位移；
       - 单手持机时拇指绕关节转，起手那几毫米走的是【切向】（比整条轨迹平得多）；
       - Chrome 的触摸 slop 决定了第一帧的事件要等累计走够 ~8~12px 才派发，
         报出来的坐标是「走够 slop 那一刻」的位置 —— 方向已经定型，但没有第二次机会。
   · 实测击穿点（探针 9 个场景，全程 pointercancel = 0 —— 浏览器没夺走指针，
     `touch-action: none` 是生效的，「多点了一下」之类猜测可以排除）：
       T3 首帧 (7,-7)、后续 21 帧全是纯纵向  → 旧规则锁 'h'
       T5 首帧 (8,-7)、后续 20 帧全是纯纵向  → 旧规则锁 'h'
       T7 首帧 (6,+2)（拇指横滚）、之后 290px 纯纵向上滑 → 旧规则锁 'h'，
          于是【这 290px 里的 60px 横向漂移全部被当成翻卡量】：卡片横向实走 31.6px、
          __switcherSettle.cur = 0.28 层 —— 这就是用户看到的「变成左右滑动」。
          横漂再大一点就会真的翻到下一张卡。
   · 蒙特卡洛（/tmp/vwork/r12/mc.mjs，20 万样本）：起手仰角 62°（单手持机拇指的典型起手角）
     时旧规则 29.3% 判成横滑、仰角 54.5° 时 48.2%；即便【完全竖直】上滑，
     仅 3px 的接触面抖动也能让旧规则 3.6% 误判成横滑。

   新判定（三条）：
     ① 【攒够再判】优势轴自己要走够 MODE_LOCK_PX 才成立 —— 不再拿「两轴都只有几像素」
        的噪声帧当依据；
     ② 【优势轴须压过另一轴 MODE_AXIS_RATIO 倍】（沿用旧的 1.4 口径）——
        两轴都不占优时继续 pending，不锁死；
     ③ 【允许改判，直到效果可见】—— 这是关键：单靠 ①② 只是把击穿门槛从 6px 抬到 10px，
        横向滚够 11px 依然会锁错。所以未 commit 之前每帧重新判，
        从 'h' 改判走时把横向焦点归位（归位量 ≤ MODE_COMMIT_PX/span ≈ 0.11 层，肉眼看不出，
        而这段位移本来就该由纵向解释）。commit = 本方向已走出 MODE_COMMIT_PX 的可见行程，此后冻结。
     ④ 死区兜底：仰角落在 35°~55° 之间时两轴都不占优，攒到 MODE_GIVEUP_PX 按较大的轴定夺
        —— 不然真·斜滑会变成「什么都不发生」。

   探针预演（同一批场景喂新规则）：T3/T5/T7 由 'h' 全部转正为 'v'；
   T8 真实横滑（dx 主导、220px 行程）仍锁 'h' 并正常翻到第 2 张 —— 横滑没被判丢。 */
const MODE_LOCK_PX = 10 // 优势轴至少要走出这么多才认方向（触摸 slop 量级 ≈ 8~12px）
const MODE_AXIS_RATIO = 1.4 // 优势轴须压过另一轴的倍数（沿用旧口径）
const MODE_COMMIT_PX = 22 // 本方向走出这么多 ⇒ 效果已可见 ⇒ 冻结模式、不再改判
const MODE_GIVEUP_PX = 28 // 两轴都不占优（35°~55° 死区）时的兜底门槛

/** 按【累计位移】给出模式建议；'pending' = 还没看出来，继续观察。 */
function pickMode(dx, dy, maxMove) {
  const ax = Math.abs(dx)
  const ay = Math.abs(dy)
  if (ay >= MODE_LOCK_PX && ay > ax * MODE_AXIS_RATIO) return dy < 0 ? 'v' : 'down'
  if (ax >= MODE_LOCK_PX && ax > ay * MODE_AXIS_RATIO) return 'h'
  if (maxMove >= MODE_GIVEUP_PX) return ay >= ax ? (dy < 0 ? 'v' : 'down') : 'h'
  return 'pending'
}

function onPointerDown(e) {
  if (dismissing.value || clearing.value || system.switcherClosing) return
  /* ---- 第二十轮：手势的【指针所有者】（Ricky 2026-09-16）----
   *
   * 原话：「多任务页面双指单次横滑触摸版，老是疯狂抖动」。
   *
   * 症状（录屏 tOS_Prototype_20260916_105155.mp4 逐帧，720×1576 / 58.8fps）：
   *   卡片组以帧率为周期【反号抽动】—— 亮度质心在 15 视频帧内反号 5 次
   *   （−26.4 / −55.6 / −10.8 / −19.9 / +9.9 / −6.8 / +18.6 / −5.7 / +10.4 视频 px），
   *   折算 10Hz 量级，**远高于本工程任何弹簧**（最硬的 ios-snappy ω_n = 22.4 rad/s = 3.6Hz）
   *   ⇒ 这不是动画，是【离散瞬写】——每个事件把焦点硬写一次。
   *
   * 根因：本组件的手势没有「指针所有者」概念。
   *   · drag.value 里没有 pointerId（只有 startX/startY/startFocus/...）；
   *   · 本函数无条件覆盖 drag.value；
   *   · onPointerMove / onPointerUp 也不校验 e.pointerId。
   *   ⇒ 第二根手指落下时把 startX 换成【它自己的坐标】、startFocus 换成当时的焦点；
   *     此后两根手指的 pointermove 都拿【同一个 startX】算 dx = e.clientX − startX，
   *     而两指的绝对坐标天然差一个「指距」⇒ 目标焦点在两指距之间来回，幅度 = 指距 / span。
   *   而 h 分支是 `focusSnap(startFocus + dx/span)`（零过渡直写、1:1 跟手，这条
   *   不变量不能动）⇒ 每次事件都是一次瞬写，两根手指的上报顺序一抖就反号。
   *
   * 探针实测（/tmp/vwork/r20/probe-2finger.mjs，CDP Input.dispatchTouchEvent 注入
   * **真实触摸**，Chrome 合成 pointerType='touch'；指距 120px / span 233.75）：
   *     单指横滑          单帧最大 5.1 px   pointerdown 计数 = 1   ← 对照
   *     双指同步          单帧最大 50.7 px  pointerdown 计数 = 2
   *     双指错时(晚3帧)   单帧最大 41.8 px  pointerdown 计数 = 2
   *     双指非平行        单帧最大 37.6 px  pointerdown 计数 = 2
   *   ⇒ 双指把单帧跳变放大 10 倍，且 event 流里能直接看到 id=3 / id=4 交替、
   *     两者都用 startX=第二指的 x（见探针输出的「指针事件流」）。
   *   ⚠️ 仓库 e2e 用 page.mouse / 单指针合成事件驱动，**结构上点不出这个毛病** ——
   *      只有真触摸（或多指针合成）才覆盖得到，所以下面的 e2e 用例也用 CDP 注入。
   *
   * 修法 = 给拖动加「指针所有者」：
   *   · 已有一个指针在拖动时，其它指针的 down/move/up/cancel 一律不参与手势；
   *   · 例外：**主指针**（e.isPrimary —— 触摸序列的第一根手指）重新按下 ⇒ 说明上一段的
   *     所有者已经不在了（pointerup / pointercancel 丢失，例如被系统手势抢占），
   *     此时接管，否则会「drag 卡死、之后所有触点都被永久忽略」。
   *   ⇒ 非主指针永远不接管 ⇒ 两指横滑的可见结果与单指逐字节相同。
   * ⚠️ 不要写成「drag.value 存在就 return」的粗暴版：那正是上面那条死锁。
   * ⚠️ 也不要在 owner 不匹配时「先结束旧 drag 再新建」：每根手指各接管一次 = 每帧一次
   *    瞬写，那就是抖动本身。 */
  if (drag.value && drag.value.pointerId !== e.pointerId) {
    if (!e.isPrimary) return
    drag.value = null
  }
  measure()
  vLetGo.value = null
  vt.length = 0
  vtPush(e.clientX, performance.now())
  /* 指针接管：把触控板那条还没落定的手势收掉（否则它的 endWheel 会在拖动中途改焦点） */
  cancelWheel()
  /* 第八轮：本次拖动要自己接管挤压量与跟手偏移 ——
     跟手偏移从「已释放」拉回满量程（0），挤压量从当前位置接管（focusSnap 即 stop+set 的同构做法）。 */
  followFreeSnap(0)
  dragSqueeze()
  drag.value = {
    /* 第二十轮：本段手势的【所有者】。onPointerMove / onPointerUp 靠它把额外手指挡在门外，
       否则两指的 dx 会共用同一个 startX（见 onPointerDown 顶部的长注释）。 */
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    /* 第二十一轮：按下点的【不可变】副本。坐标连续性守卫会把 startX 搬到新基线上（见
       onPointerMove），而「按下时手指落在哪张卡上」这件事必须永远只认最初那一点
       （下面对 v 模式的 hitCardId 用的是它）—— 否则两指合并时命中判定会跟着瞬移漂走。 */
    downX: e.clientX,
    startFocus: focus.value,
    startT: performance.now(),
    mode: 'pending',
    /* 第十二轮：模式「冻结」位。pickMode 在产生可见效果之前允许改判（见上方长注释），
       一旦本方向走出 MODE_COMMIT_PX 的行程就置 true，此后模式不再变。 */
    modeFrozen: false,
    /* 第十二轮：模式改判轨迹（探针/e2e 的 oracle —— 断言「首帧横向抖动 7px 之后
       必须仍然落在 v」靠它，而不是靠肉眼看卡片有没有横走）。 */
    modeTrace: [],
    dx: 0,
    dy: 0,
    cardId: null,
    vPx: 0,
    /* 指尖路径的最大位移（第八轮）：tap 判定不能再只看【松手那一刻】的 dx/dy。
       历史 bug（Ricky 第八轮需求①「点卡片左右可以，上下大块的空白区域则不行」）：
       手指点一下的天然微漂（尤其纵向）一旦 ≥8px，就会被判成拖动 ——
       mode='v' 时整段直接 return（什么都不发生）、mode='down' 时 dy≤80 也什么都不发生，
       于是「点空白没反应」。用 maxMove 判 tap 才能覆盖「抖出去了又回来」。 */
    maxMove: 0,
    /* 第二十一轮：坐标连续性守卫的现场（见 onPointerMove 顶部的长注释）。
       lastX    = 上一笔【已接受】事件的 clientX（不是 startX —— startX 会被守卫平移）
       steps    = 最近 TOUCH_STEP_KEEP 笔【已应用】位移（被守卫吸收的那笔记 0）
       teleports= 本段手势被判为「坐标不连续」的次数（自省口 / e2e 的 oracle） */
    lastX: e.clientX,
    steps: [],
    teleports: 0
  }
  e.currentTarget.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  const d = drag.value
  if (!d) return
  /* 第二十轮·需求（双指横滑抖动）：非所有者的指针事件一律不参与本段手势（见 onPointerDown）。 */
  if (e.pointerId !== d.pointerId) return

  /* ---- 第二十一轮：手势输入的【坐标连续性守卫】（Ricky 2026-09-16）----
   *
   * Ricky 原话：「左滑了，右滑还是没好，甚至抖动幅度更大了，但是概率低了一点」。
   *
   * 第二十轮的 owner 守卫（上面那两行）挡的是「**两根手指各报一份坐标**」——
   *   前提是浏览器给了两个 pointerId，守卫才认得出「这不是所有者」。
   *
   * 但还有第二类失效：**两个触摸点被合并成一条坐标流**（或指针被重定向到另一根手指）——
   *   页面侧只剩【一个】pointer，于是 pointerId / isPrimary / touches.length 三个判据
   *   全部恒等于「单指」的形状，owner 守卫结构上无法覆盖。
   *   实测（/tmp/vwork/r21/probe-sameid.mjs，CDP 注入两个同 id 的触点，两指相距 120px）：
   *     · 事件流：`pointerdown 计数 = 1`、`出现的 pointerId = [4]`、
   *       `touchstart 的 touches = [{id:21,x:90}]`（只有 1 个触点，第二指完全不可见）；
   *     · 坐标：90 → 210 → 223 → 236 …（**没有任何 pointerdown 就直接瞬移 120px**，
   *       然后一路跟着第二根手指走）；
   *     · 结果：**单帧最大 Δfocus = 0.565 层 = 119.9px**（单指对照 12.9px）。
   *   为什么「左滑好了、右滑没好」（这是用户反馈形状与代码结构的交叉验证）：
   *     · dx 进的是两条通道。左滑（focus<0）走【挤压通道】（overScroll → deckSqueezeShift），
   *       第十七轮已给它加了逐帧限速（SQ_MAX_STEP 0.09/帧 ≈ 8.4px/帧）⇒ 120px 的瞬移
   *       被摊成 ~14 帧的小台阶，看起来「好了」（探针 T3：sq 只爬到 0.011/0.047…）；
   *     · 右滑（focus>0）走【位移通道】（focusSnap 零过渡直写、增益 275px/层 = 1.30px/px）
   *       ⇒ 瞬移 1:1 全额可见 ⇒「幅度更大了」。
   *     · 「概率低了一点」= 第二十轮已经消灭了其中【id 分得开】的那一半，剩下这一半
   *       仍然存在（它本来就不是靠 id 发生的）。
   *
   * 修法：把「一笔事件里坐标跳得物理上不可能」判成**坐标不连续**，而不是手指运动：
   *   · 只把基线 startX 平移到新坐标（这一段位移【不进入焦点】）⇒ 焦点不跳，
   *     手势继续跟着新的那根手指走（两指本来同向，后面照旧跟手，手感无损）；
   *   · 同时清空速度采样（vt），否则松手会凭这次瞬移算出一个虚假的快甩速度。
   *   · 判据本体在 utils/switcherDeck.touchStepIsTeleport（纯函数，单测覆盖）。
   *   ⇒ 稳态映射一个字都没改：**连续输入（dx 每笔都在物理范围内）走的还是
   *     `focusSnap(startFocus + dx/span)` 的 1:1 直写**，所以所有几何断言（
   *     「手指走满一整层 ⟺ 一张卡宽位移」）与 e2e 全部不受影响。
   * ⚠️ 只在 pointerType === 'touch' 上判：鼠标没有「另一根手指」这个失效模式，
   *    而 e2e 的 `mouse.move(steps:3)` 会一击甩出 165px（≈23px/ms）—— 那是【真实位移】，
   *    必须原样应用（第十一轮的注释已经把它写进设计里了）。
   * ⚠️ 不要改成「给焦点加限速弹簧」：位移通道的契约是严格 1:1（第十二轮的几何断言 +
   *    e2e 的 `mouse.move(steps:3)` 同 tick 连发三笔），限速会同时改掉这两件事；
   *    而挤压通道当初能限速，是因为它驱动的是「整组位移」这个无几何契约的量。
   * ⚠️ 不要用「坐标落在另一根手指附近」当判据：合并时页面根本看不到另一根手指
   *    （见上面 touches 的实测），这条判据永远不会成立。 */
  const jump = e.clientX - d.lastX
  let applied = jump
  if (e.pointerType === 'touch' && touchStepIsTeleport(jump, d.steps)) {
    d.startX += jump // 基线跟着瞬移搬走 ⇒ 本笔的 dx 保持不变，焦点不动
    d.teleports += 1
    applied = 0
    vt.length = 0 // 位置采样作废：下面 h 分支的 vtPush 会用新坐标重新起算
  }
  d.lastX = e.clientX
  d.steps.push(applied)
  if (d.steps.length > TOUCH_STEP_KEEP) d.steps.shift()

  const dx = e.clientX - d.startX
  const dy = e.clientY - d.startY
  d.maxMove = Math.max(d.maxMove, Math.hypot(dx, dy))
  /* 模式判定（第十二轮重写 —— 见 pickMode 上方的长注释，含探针实测数据）。
     与旧实现的三点差别：
       ① 判据从「任一轴 6px + 单帧采样」改为「优势轴 10px + 累计位移」；
       ② 未 commit 之前允许改判（旧实现一帧定终身）；
       ③ 从 'h' 改判走时把横向焦点归位 —— 这段位移转由纵向解释。 */
  if (!d.modeFrozen) {
    const m = pickMode(dx, dy, d.maxMove)
    if (m !== 'pending' && m !== d.mode) {
      /* ⚠️ 顺序要紧：先归位焦点（此时 d.mode 还是旧值 'h'），再改 d.mode。
         归位量 ≤ MODE_COMMIT_PX / span ≈ 0.11 层（≈22px），且只发生在跟手头几帧，
         肉眼不可辨；不归位的话这段横向位移会「赖」在焦点上，纵向一跟手就跳一下。 */
      if (d.mode === 'h') focusSnap(d.startFocus)
      const wasV = d.mode === 'v' || d.mode === 'down'
      d.modeTrace.push({ at: +d.maxMove.toFixed(1), from: d.mode, to: m })
      d.mode = m
      if (m === 'v') {
        /* 上滑移除：在【模式锁定这一刻】就把拖动对象钉死（用按下点取命中卡）。
           不能等松手再 elementFromPoint —— 拖动期间卡片跟着手指上移、手指也可能滑出卡片
           范围，松手时命中判定会失手（拿到卡片外面的遮罩 → 整次上滑删不掉）。 */
        d.cardId = hitCardId({ clientX: d.downX, clientY: d.startY })
        d.dy = dy
      } else if (m === 'h' && wasV) {
        d.dy = 0 // 改判成横滑 → 纵向跟手量清零，否则卡片会「半抬着」横向走
      }
    }
    if (d.mode === 'h' && Math.abs(dx) >= MODE_COMMIT_PX) d.modeFrozen = true
    if ((d.mode === 'v' || d.mode === 'down') && Math.abs(dy) >= MODE_COMMIT_PX) d.modeFrozen = true
  }
  if (d.mode === 'v') {
    /* 上滑移除【跟手】（第七轮·批次 2，需求⑧）：旧代码在这一行直接 return，
       拖动全程卡片零纵向位移 → Ricky 原话「上滑删除卡片时，卡片未跟手上滑移动」。
       这里只记录位移，真正的位姿偏移由 stackStyle 逐帧直写（无过渡 → 严格跟手）。 */
    d.dy = dy
    return
  }
  if (d.mode !== 'h') {
    d.dy = dy
    return
  }
  /* 跟手方向（Ricky 2026-09-12 纠正）：
     堆叠布局是「更早的卡在左、更新的卡在右」，手势要让【手往右拖，卡片也往右走】。
     位姿 x 随 focus 单调增，所以焦点跟手是 startFocus + dx/span（旧代码写成 - dx
     → 手往右拖卡片却往左走）。 */
  d.dx = dx
  vtPush(e.clientX, performance.now())
  d.vPx = vtVelocity()
  /* 第二十四轮：输入只走【唯一出口】setInput（原来这里是 `focusSnap` 逐帧零过渡直写）。
     跟手期位置与目标同步落位 ⇒ 仍然严格 1:1、零延迟；区别在于「谁写位置」变成了
     一个明确的出口，而不再是若干条通道各自直写（那是抖动的根因，见文件头）。 */
  setInput(deckClampFocus(d.startFocus + dx / metrics.value.span, apps.value.length))
  /* 第八轮（需求⑦）：往左拖到第一张卡之后，越界量转成横向挤压 —— 逐帧直写、严格跟手。 */
  dragSqueeze()
}

/* tap 容差（第八轮，需求①）。
   旧判定只看松手那一刻的 |dx| < 8 && |dy| < 8，于是「点一下但指尖漂了 8px+」会漏判：
     · 漂成 mode='v'  → 走「上滑移除」分支，dy ≥ −110 ⇒ 什么都不发生；
     · 漂成 mode='down' → dy ≤ 80 ⇒ 什么都不发生；
     · 漂成 mode='h'  → 只是把卡片吸附回原位 ⇒ 看起来也「没反应」。
   ⇒ 这就是「点卡片左右可以（横向漂移小）、上下大块空白不行（纵向漂移大）」的成因。

   新判据 = 净位移分轴容差 + 速度门槛 + 时长门槛 + 路径总长上限：
     · X 容差（第十四轮：8 → 12px）—— 鼠标点一下天然带 3~12px 横向漂移，
       旧值 8px 让这类点按被踢进「横滑」分支（settleFocus 把焦点弹回去、
       整段手势静默）。放宽到 12px 先救掉其中最典型的一批；
       ⚠️ 12px 并不足以覆盖全部点按 —— 13~23px 那一段由 tapIntent 兜（见下一条注释）。
     · Y 容差 16px（点击时纵向漂移最大，正是要救的那一路）；
     · 速度 < FLICK_V_MIN —— 否则「11px 的快甩」会被当成 tap，
       而需求④明确要求「快甩务必翻一张」（e2e：快甩 0.05 层必须翻 1 张）；
     · 时长 < 500ms —— 长按不当作 tap；
     · maxMove < 24px —— 抖出去又回来的仍算 tap，但整段路径很长的不算。
   ⚠️ 第十四轮（需求③「点击还会左右抖动」）：最终生效的判据是 `tapIntent = isTap || 未提交`，
      见下一条注释 —— isTap 只是其中的严格档。 */
const TAP_SLOP_X = 12
const TAP_SLOP_Y = 16
const TAP_PATH_MAX = 24
const TAP_MS_MAX = 500

/* 「未提交的拖动 = 点按」（第十四轮·需求③）。
 *
 * 为什么仅靠 TAP_SLOP_X 不够：横滑的位移映射是 `focus = startFocus + dx / span`
 * （span ≈ 234px），**从第 1 个像素起就 1:1 跟手**（这条不变量被一堆几何断言守着，
 * 不能加死区）。而 `pickMode` 在 |dx| ≥ MODE_LOCK_PX(10) 就把模式锁成 'h'。
 * 两者合起来 ⇒ 一次「带 13~16px 横向漂移的点按」会走完这条链：
 *   跟手横移 13~16px（探针 /tmp/vwork/r14/probe-p3.mjs 实测卡 e 从 77.5 → 90.1）
 *   → 松手 → `mode='h' && !isTap` → settleFocus 把焦点弹回原位 → **什么都没发生**。
 * 读起来就是 Ricky 说的「点击还会左右抖动」（晃一下 + 无响应）。
 *
 * 修法不碰几何，只补一条语义：**整段手势没有 commit 过任何方向 ⇒ 它没产生任何可见结果
 * ⇒ 只能是一次点按**。判据必须同时锚在【松手那一刻的净位移】上，不能只看
 * `d.modeFrozen` / `d.maxMove` —— 那两个量是【从观测到的 pointermove 累加】出来的：
 * Chrome 会把同一帧内的多个 pointermove 合并派发，主线程繁忙时相邻两次采样可能隔很远，
 * 于是一次真实的 192px 上滑也可能「只被看见十几像素」，maxMove 与 frozen 全都偏小。
 * e2e 实测（scripts/verify-app-switcher.mjs 第十四轮·需求③-b 首跑）就踩到了这个：
 *   12 步 × 16px 的上滑被采样成小位移 ⇒ tapIntent 误判成点按 ⇒ 走 hitCardId(松手点
 *   已经在屏幕外) ⇒ null ⇒ exitWithAnimation ⇒ 卡片没删、还退回了桌面。
 * 所以四个条件缺一不可：
 *   · |dx| 与 |dy| 都 < MODE_COMMIT_PX(22) —— **松手净位移**（唯一可靠的量，直接来自 up 事件）
 *     小到没有任何方向 commit 过；横滑在 |dx| ≥ 22 冻结、纵向在 |dy| ≥ 22 冻结；
 *   · !d.modeFrozen —— 排除「手指出去又回来」（净位移小，但中途真的推动过卡片）；
 *   · maxMove < TAP_PATH_MAX(24) —— 抖出去又回来的仍算点按，整段路径很长的不算；
 *   · 速度与时长的门槛与 isTap 同源（快甩必须留给翻卡，长按不是点按）。
 * 于是 13~23px 的漂移全部落回点按（探针实测 12/16px 两条从 STAY 变 RESUME），
 * 而真正的横滑、上滑删卡与快甩完全不受影响。 */

function onPointerUp(e) {
  const d = drag.value
  if (!d) return
  /* 第二十轮·需求（双指横滑抖动）：只有所有者抬起才算松手 ——
     否则第二根手指的 pointerup 会把还在走的手势提前「结算」（焦点弹回、挤压释放），
     而它自己的 pointermove 又不会再被接受 ⇒ 一次横滑被结算两次。 */
  if (e.pointerId !== d.pointerId) return
  drag.value = null
  /* 第二十一轮：松手这一笔同样过【坐标连续性守卫】——
     否则一次坐标瞬移会被 vtVelocity 读成「手指正在飞速滑动」，settleFocus 据此判成
     快甩（|vFocus| ≥ FLICK_V_MIN 2.6 层/秒）并注入一个凭空的初速度（见 onPointerMove 的注释）。
     命中的落点仍用 e.clientX（那才是浏览器认为指针所在的位置）。 */
  const upJump = e.clientX - d.lastX
  const px = e.pointerType === 'touch' && touchStepIsTeleport(upJump, d.steps) ? d.lastX : e.clientX
  const dx = px - d.startX
  const dy = e.clientY - d.startY
  // 松手这一刻也采一个速度样本（并剔除 >100ms 的旧样本）→ 停住再松手 = 0 动量
  const tNow = performance.now()
  vtPush(px, tNow)
  const vFocus = (vtVelocity(tNow) * 1000) / metrics.value.span // 层/秒
  const isTap =
    Math.abs(dx) < TAP_SLOP_X &&
    Math.abs(dy) < TAP_SLOP_Y &&
    d.maxMove < TAP_PATH_MAX &&
    Math.abs(vFocus) < FLICK_V_MIN &&
    tNow - d.startT < TAP_MS_MAX

  /* 点按意图 = 严格容差命中（isTap）或「整段手势一次都没 commit 过」（见 TAP_SLOP_X 上方
     的长注释）。后者是第十四轮为「点击还会左右抖动」补的第二道判据：13~16px 的横向漂移
     会把 mode 锁成 'h' 但走不到 MODE_COMMIT_PX(22) ⇒ 没产生任何可见结果 ⇒ 它只能是点按。
     ⚠️ 必须带上松手净位移（|dx|/|dy| < MODE_COMMIT_PX）—— 只靠 modeFrozen/maxMove 会在
     pointermove 被合并采样时把一次真实上滑误判成点按（e2e 第十四轮·需求③-b 首跑实测）。 */
  const tapIntent =
    isTap ||
    (!d.modeFrozen &&
      Math.abs(dx) < MODE_COMMIT_PX &&
      Math.abs(dy) < MODE_COMMIT_PX &&
      d.maxMove < TAP_PATH_MAX &&
      Math.abs(vFocus) < FLICK_V_MIN &&
      tNow - d.startT < TAP_MS_MAX)

  /* 模式判定的自省口（第十二轮，与 __switcherSettle 同性质）：
     安卓 Chrome 触摸下「首帧横向抖动」会不会把上滑判成横滑，只能靠它做 oracle ——
     断言「最终 mode === 'v'」而不是看卡片有没有横走（横走多少要读十几帧 transform）。 */
  window.__switcherMode = {
    mode: d.mode,
    frozen: d.modeFrozen,
    cardId: d.cardId,
    dx: +dx.toFixed(2),
    dy: +dy.toFixed(2),
    maxMove: +d.maxMove.toFixed(2),
    tap: isTap,
    tapIntent,
    trace: d.modeTrace,
    /* 第二十一轮：本段手势被【坐标连续性守卫】吸收掉的瞬移次数（见 onPointerMove 的注释）。
       e2e 用它当 oracle —— 断言「两指合并时守卫确实生效」，而不是只看焦点有没有跳。 */
    teleports: d.teleports || 0
  }

  /* 松手就把「挤压」和「跟手偏移」交给弹簧 —— 无论走哪条分支都要收，
     否则卡片会带着形变/偏移僵在原地（需求⑦「弹性不足」的反面）。 */
  releaseSqueeze()

  if (d.mode === 'h' && !tapIntent) {
    /* 用【松手这一刻重算的】层速度，而不是 d.vPx（最后一次 pointermove 的陈旧值）：
       vtVelocity 会剔除 >100ms 的旧样本，手指停住再松手自然得 0；
       若沿用 d.vPx，停住 300ms 再松手会带着停顿前的旧速度继续翻页（需求⑤的反例）。
       第二个参数是快甩保底的锚点（手势按下时的焦点）。 */
    settleFocus(vFocus, d.startFocus)
    return
  }
  if (d.mode === 'v' && !tapIntent) {
    /* 上滑移除判定：位移过半即飞出（阈值 110px 与旧的松手判据保持一致），
       拖动对象优先取模式锁定时钉下的卡片，取不到再退回松手点的命中判定。

       松手后把「拖动态位姿」再续一帧（vLetGo），下一帧才切目标态 —— 见 stackStyle
       里 vLetGo 的注释：`.is-dragging` 摘掉的那一帧 transition 才生效，同帧改目标值
       会退化成瞬移。 */
    const cardId = d.cardId || hitCardId(e)
    const willDismiss = !!cardId && dy < -110
    vLetGo.value = { cardId: d.cardId, dy: Math.min(0, dy) }
    requestAnimationFrame(() => {
      vLetGo.value = null
      if (willDismiss) dismissWithAnimation(cardId)
    })
    return
  }
  if (d.mode === 'down' && !tapIntent && dy > 80) {
    system.closeSwitcher()
    return
  }
  // 点按：点卡片恢复，点空白关闭
  if (tapIntent) {
    /* 底部工具条【只认按钮本体】（第八轮修正，需求①）。
       历史 bug：`.switcher-dock` 是个 position:absolute; left:0; right:0 的 flex 容器，
       整条 430×52 的横带都算「命中 dock 容器」，于是
         if (dockHit) { if (trash) clearAll(); return }   ← 在空白处点 → 直接 return
       底边那条空白带的点击被静默吃掉。现在只把【垃圾桶按钮】当命中，
       容器其余部分一律当空白 → 走 exitSwitcherToHome（需求①「大块空白区域也要能退出」）。
       （配套的 CSS 也让容器 pointer-events:none，双保险。） */
    const hitEl = document.elementFromPoint(e.clientX, e.clientY)
    if (hitEl?.closest?.('.switcher-trash')) {
      clearAll()
      return
    }
    const cardId = hitCardId(e)
    if (cardId) resumeWithExpand(cardId)
    /* 点空白 = 回桌面（第七轮，需求⑪）+ 【补退场动画】（第八轮，需求④）。
       旧实现直接 exitSwitcherToHome()，卡片/遮罩在 1 帧内消失 = Ricky 说的「缺少动画」。
       参考视频 23a8c90d…mp4 逐帧：卡片组【向左滑出】、桌面同步渐显，全程约 5~8 帧
       （0.21~0.33s）。 */
    else exitWithAnimation()
  }
}

/* 取指针下的那张卡（返回 appId）。
   ⚠️ 第十二轮修掉一个【只在真机/触摸路径上稳定复现】的失效 ——
   旧实现 = `elementFromPoint(...)?.closest('.switcher-card')` 取【最上层】那张，
   而跟手卡（.is-follow）会在 onPointerDown（followFreeSnap(0) ⇒ settledOne 失效）
   之后由 Vue 立刻挂出来、【盖在顶层卡正上方】：它有 .switcher-card 但【没有 data-app-id】，
   于是 closest 拿到它 → appId undefined → 返回 null。后果：
     · mode='v' 的上滑删卡：cardId 恒 null ⇒ willDismiss 恒 false ⇒ 手机端上滑【永远删不掉】；
     · 点顶层卡恢复：cardId 恒 null ⇒ 落到 else 分支 exitWithAnimation() ⇒ 点卡片【反而回桌面】。
   为什么桌面 e2e 一直没抓到：这是竞态 —— 桌面鼠标路径「按下 → 第一帧 pointermove」之间
   Vue 往往还没来得及补丁 DOM，closest 仍命中下面的堆叠卡；而触摸路径下手指按下与第一个
   pointermove 之间至少隔一帧（还要走 Chrome 的 touch slop），DOM 必然已补丁 ⇒ 100% 命中跟手卡。
   探针实测（/tmp/vwork/r12/probe-hit2.mjs，430×932 鼠标复刻 e2e 那一步）：按下 60ms 后
   命中 "switcher-card is-follow | app=none"，松手后 recent 不变、baseLayer 仍为 'app'
   —— 也就是说 e2e 里「上滑移除当前应用」那条断言在改前是 false。
   新实现：沿层叠顺序（elementsFromPoint）往下找【第一张带 appId 的卡】，
   跟手卡只是「同 app 的替身」，被跳过之后就落到它下面那张真卡上（两者本来就是同一个 app）。
   同时给跟手卡也标上 data-app-id（见模板）—— 双保险，且语义正确：手指压着的就是它。

   ⚠️ 第十四轮（需求①的两处连带修正）：命中失败后还要再按【标题行带】兜一次。
   Ricky 原话：「点击多任务卡片…很高的概率会出现点击卡片仍然退出多任务回到桌面」、
   「位于顶部的卡片无法通过鼠标上滑关闭」。
   探针实测（/tmp/vwork/r14/probe-label.mjs，430×932 真实路径）：
     · 卡顶 y=155，而「图标 + 应用名」那一行在 y=119..143（卡顶上方 36px = LABEL_ROW_H+LABEL_GAP）；
     · 点 y=112~150 的任意一点，elementFromPoint 落到 .switcher-track / .switcher-dim
       ⇒ 本函数返回 null ⇒ 点按走 exitWithAnimation()（回桌面）；
     · 从同一片区域上滑 192px ⇒ cardId 恒 null ⇒ willDismiss 恒 false ⇒ 卡片纹丝不动。
   而视觉上这行图标/名字就是卡片的标题行，用户当然会去点它、抓它。
   兜底口径：卡宽 × 卡顶上方 (LABEL_ROW_H + LABEL_GAP) 的横带算作「这张卡」，
   按 renderedCards 的顺序（顶层在前）取第一个匹配 ⇒ 顶层卡优先。 */
function hitCardId(e) {
  const els = document.elementsFromPoint(e.clientX, e.clientY)
  for (const el of els) {
    const id = el?.closest?.('.switcher-card')?.dataset?.appId
    if (id) return id
  }
  const band = DECK.LABEL_ROW_H + DECK.LABEL_GAP
  const x = e.clientX
  const y = e.clientY
  for (const c of renderedCards.value) {
    const p = poseOf(c.i)
    const w = cardW.value * p.scale
    if (x >= p.x && x <= p.x + w && y >= p.y - band && y <= p.y) return c.id
  }
  return null
}

/* ---- 触控板双指横滑（第七轮·批次 3，需求①）----
   Ricky 原话：「多任务横滑不支持 Mac 触控板双指横滑手势」。
   根因：组件此前只接 pointer 事件，**一个 wheel 都没接** —— 双指横滑产生的 wheel
   被浏览器当成页面滚动吞掉，切换器全程纹丝不动。

   方向：DOM 规范里 deltaX > 0 =「向右滚动」= 内容左移；自然滚动下
   「双指往右 → 内容往右 → deltaX < 0」。而本组件的直接操作语义是
   「手指往右 → focus 增大 → 卡片往右」，所以 focus += −deltaX / span，
   与 pointer 路径的 focus += dx / span 同构（换一种输入设备，不是换一套方向）。

   ⚠️ 与指针路径最重要的差别：**触控板自带动量相**。一次双指快拨之后 macOS 会继续吐
   一串递减的 wheel（动量），所以这里【绝不叠加投影】—— 惯性已经由系统喂进来了，
   再投影一次就是双重计账（猛拨会飞过头）。做法：
     · 逐事件把 wheel 增量累加进独立累加器 wheelAcc（不是 focus.value ——
       焦点会被 spring 拖着滞后，拿它当累加基准每帧都会丢掉一点位移）；
     · 手全程 focusSnap 逐帧直写（零过渡 → 与触控板 1:1 跟手）；
     · 手势流停下（WHEEL_IDLE 内无新事件）→ 吸附到最近整卡。
   于是：轻拨（累计 < 半张）弹回原卡；拨过半张翻一张（与需求⑤一致）；
   猛拨被动量喂过 1.5 张 → 落点就是第 2 张（触控板上的「惯性加速」）。 */
const WHEEL_LINE_PX = 16 // deltaMode=1（按行）折算像素
const WHEEL_PAGE_PX = 400 // deltaMode=2（按页）
/* 手势结束判定（ms）。取 140 与 HomeScreen 的 wheelResetTimer 同值 —— 同一种输入设备
   在同一个原型里有且只有一套「拨完了」的门槛。
   系统动量相的事件间隔常态 < 40ms（尾部也极少超过 100ms），140ms 足够；
   判早了会把动量尾巴切掉 —— 那正是「惯性」的来源，宁可多等一拍。 */
const WHEEL_IDLE = 140

function onWheel(e) {
  if (!system.appSwitcherOpen || drag.value || dismissing.value || clearing.value || expanding.value) return
  /* deltaMode 归一：部分设备/浏览器给「行」或「页」，要折成像素才与 span 同量纲 */
  const k = e.deltaMode === 1 ? WHEEL_LINE_PX : e.deltaMode === 2 ? WHEEL_PAGE_PX : 1
  const px = e.deltaX * k
  /* 判据与 HomeScreen.onWheel 完全一致：横向必须【压过纵向】且不小于 2px 才算横滑意图。
     这样「纯纵向滚轮 / 斜着滚」都不会被我们拦住（切换器里也没有可滚内容）。 */
  if (!px || Math.abs(px) <= Math.abs(e.deltaY) || Math.abs(px) < 2) return
  /* 拦掉默认滚动。必要性：卡片里是真实的应用预览，其中设置页等自带可滚列表 ——
     不拦的话横滑会把那张缩小卡里的列表横向滚起来，切换器反而不动。
     监听器注册在 window 且显式 passive:false（见 onMounted）—— 因为底部 ~30px 的
     手势条（HomeIndicator，z=96）在 .app-switcher 之外，只挂根元素会漏掉那一条。 */
  e.preventDefault()
  measure()
  if (wheelAcc.value == null) {
    /* 手势起点：可能正压着一段没跑完的收尾 → 从【当前视觉位置】接管（target 与 x 对齐） */
    wheelAcc.value = focus.value
    wheelInput = createAccumulator(focus.value * metrics.value.span)
    focusMoving.value = true
  }
  /* ── 第二十四轮：输入先过累积器，再由【唯一出口】落位 ──────────────────────────
   * 这里原来是 `focusSnap(wheelAcc − px/span)` —— 每一笔 deltaX 直接写位置。
   * 触控板自带惯性相、换向时 deltaX 的噪声最大，逐笔直写就把噪声 1:1 全幅放上屏幕
   * （这也是它与 pointer 通道表现不一样的结构性原因）。
   *   ① accumulate 用「1px = 屏幕能表达的最小位移」判掉物理上不存在的反向位移；
   *   ② setInput 落位 —— 与 pointer 通道走【同一个出口】，两条通道在架构上统一。
   * ⚠️ 别退回逐笔直写（会绕开 ①）；也别在这里赌幅度阈值（7px 死区那版的黏滞就是这么来的）。 */
  const committed = accumulate(wheelInput, -px, MOTION.SUBMIT_PX)
  const lay = committed / metrics.value.span
  const layered = deckClampFocus(lay, apps.value.length)
  if (layered !== lay) {
    /* 撞到边界：把被夹掉的超出量写回累积器（acc 与 target 一起写，保持「滞后 ≤ 1px」的
       不变量）。否则反向时要先「走完」这段不存在的行程 ⇒ 贴着边界反向拨不动
       （第十七轮同类的冻结感）。 */
    wheelInput.acc = layered * metrics.value.span
    wheelInput.target = wheelInput.acc
  }
  wheelAcc.value = layered
  setInput(layered)
  /* 第八轮（需求⑦）：触控板横滑同样吃「左滑挤压」—— 换一种输入设备，不是换一套反馈 */
  dragSqueeze()
  clearTimeout(wheelIdleTimer)
  wheelIdleTimer = setTimeout(endWheel, WHEEL_IDLE)
}

/** 触控板手势流结束 → 吸附到最近整卡（不加投影：动量的账已经由系统记过了）。
 *  第二十四轮：这里不再挑弹簧预设 —— 收尾统一走 settleTo（一阶 + VMAX）。 */
function endWheel() {
  if (wheelAcc.value == null) return
  const cur = wheelAcc.value
  wheelAcc.value = null
  wheelInput = null // 累积器与 wheelAcc 同生命周期
  const last = Math.max(0, apps.value.length - 1)
  releaseSqueeze()
  settleTo(Math.max(0, Math.min(last, Math.round(cur))))
}

/** 指针/程序化操作接管时，必须把触控板的未决收尾撤掉（否则它会在拖动中途改目标） */
function cancelWheel() {
  clearTimeout(wheelIdleTimer)
  wheelIdleTimer = null
  wheelAcc.value = null
  wheelInput = null
}

/* ---- 桌面图标的隐藏态归还（第十五轮）----
 *
 * Ricky 原话：「点击打开应用后，进入多任务，上滑删除任务回到桌面后，桌面图标消失了」
 * （截图特征：文字还在、只有那一格的图形是空的）。
 *
 * 根因在 `systemStore.dismissApp()`：它是**硬切** ——
 *   `recentApps` 摘掉 → 若删的是当前应用则直接 `activeAppId = null; baseLayer = 'home'`。
 * AppWindow 因此被直接卸载，而它**唯一**的「归还桌面图标」动作挂在 hero 收回的收尾钩子上
 * （`AppWindow.vue` 的 `onHandoff: () => home.showIcon()`）⇒ 钩子永不触发
 * ⇒ `home.hiddenIconId` 永久停在那个 appId ⇒ 桌面那一格只剩文字。
 * 探针 /tmp/vwork/r15/probe-icon.mjs 实测（改前）：
 *   · store 直连 openApp('files') → dismissApp('files')：hiddenIconId 仍 = 'files'
 *   · 真实 UI（点桌面图标 → 上滑进多任务 → 卡上滑删卡）：同样停在 'files'，tile=hidden
 *   · 对照组「应用内上滑回桌面」（走 hero 收尾）：tile=visible —— 唯独删卡路径漏了
 *
 * 本函数只负责【在窗口确实要消失时】把隐藏态让出来，是语义上的显式归还；
 * AppIcon 里「隐藏只在应用真的是前台时生效」的前台判据是同一件事的第二道防线。
 * 两者互为冗余、谁也不依赖谁 —— 即使将来有人再往切换器里加一条硬切路径，
 * 那道判据也会兜住。
 *
 * ⚠️ 必须限定「删的就是当前应用」：删后台卡时前台应用仍在全屏，
 *    此时清掉隐藏态会让它的桌面图标提前露出来（hero 收回时就会与镜像重影）。 */
function releaseHiddenIcon(appId) {
  if (appId && system.activeAppId === appId) home.showIcon()
}

/* 上滑移除：飞出 + 其余卡片弹簧重排 */
function dismissWithAnimation(appId) {
  dismissing.value = appId
  setTimeout(() => {
    /* 必须先于 dismissApp：后者会把 activeAppId 置空，之后再判断就查不到了。 */
    releaseHiddenIcon(appId)
    system.dismissApp(appId)
    dismissing.value = null
    const idx = Math.max(0, Math.min(apps.value.length - 1, Math.round(focus.value)))
    settleTo(idx)
  }, 240)
}

function dismissingStyle(i) {
  const p = deckPose(i - poseFocus.value, metrics.value, xFrac.value)
  return {
    width: cardW.value + 'px',
    height: cardH.value + 'px',
    transform: `translate3d(${p.x}px, ${p.y - screenH.value * 1.1}px, 0) scale(${p.scale})`,
    /* 第十二轮（需求②口径延伸到飞出段）：纯位移飞出，不淡出。
       旧值 opacity: 0 会与 `opacity 0.22s ease` 那条过渡合起来把卡「边飞边化掉」；
       而 Ricky 的诉求是「取消上滑过程中的透明度变化」，上滑跟手 + 松手飞出是同一个
       连续动作，只改跟手段会留半截。同为离场语义的 clearingStyle（一键清理）
       第九轮就已经定成 `opacity: 1`（参考视频末帧残余卡条仍纯白）—— 两条统一。 */
    opacity: 1,
    zIndex: deckZ(i),
    borderRadius: RADIUS.value + 'px'
  }
}

/* 点卡片恢复：卡位 →（围绕中心 scale 放大）→ 全屏，再正式切到 AppWindow（无缝衔接）。
   历史 bug（2026-09-12 修复）：旧实现直接改 width/height 到全屏 + transform 归位，
   宽高没有过渡 → 卡片会「瞬间变大再滑过去」。改为与跟手卡同一套「中心锚点 scale」几何。

   ⚠️ 第十四轮（需求①「点击多任务卡片进入全屏时会卡和闪一下」）在这里修掉三件事：

   ① 起始 scale 必须取【这张卡自己的堆叠位姿缩放】，不能一律用 previewScale ——
      点邻居卡时它的位姿本来就带 0.94^k 的层缩放，用 previewScale 会让起点比卡片
      当前大小大一圈（先「弹大一下」再飞）。
   ② box 从 卡宽×卡高 变成 屏宽×屏高 是【瞬变】的，而 transform 是【过渡】的：
      浏览器插值的是矩阵 ⇒ 过渡第 1 帧的实际视觉尺寸 = 整个屏幕大小（探针实测
      430×932 落在卡位左上角），随后才缩回卡位、再放大 —— 这就是「闪一下」的实体。
      新口径把整条动画统一到跟手卡那套基准上：box 恒为屏宽×屏高、transform-origin
      显式写成 center center，起点矩阵 = 堆叠位姿对应的矩形（视觉上与卡片完全重合）。
   ③ 起始态那一帧必须 transition: none（旧实现让 0.32s 的过渡从错误起点开始跑）。
      目标态那一帧再带上过渡：CSS 规范取【变更之后】的 transition 值，所以同帧
      设置 transform + transition 是安全的。 */
const expanding = ref(null)
const expandTo = ref(false)
let expandTimer = null
/* 与 .switcher-card 的通用过渡（0.32s）同长；交接必须【不早于】过渡终点，
   否则会在卡片还差 2~3px 到满屏时把它换掉（探针实测 430×930 vs 430×932）→ 又闪一下。 */
const RESUME_MS = 320
/* 交接保持窗口（见 expandHold 的注释）：等底下 AppWindow 的开场动画落地再撤卡。
   MARGIN 是给「hero 最后一帧 → Vue flush → 合成器上屏」留的余量。 */
const EXPAND_HOLD_MARGIN_MS = 56
const EXPAND_HOLD_SAME_MS = 64
function resumeWithExpand(appId) {
  expanding.value = appId
  expandTo.value = false
  // 先渲染「起始态」，两帧后再切目标态，浏览器才会跑过渡
  requestAnimationFrame(() => requestAnimationFrame(() => { expandTo.value = true }))
  clearTimeout(expandTimer)
  clearTimeout(expandHoldTimer)
  /* 交接时刻 = 2 帧（起始态提交 ≈33ms）+ RESUME_MS + 40ms 余量。
     旧值写死 300ms < 过渡时长 320ms，交接必然切在半途。 */
  expandTimer = setTimeout(() => {
    expandTimer = null
    /* 顺序有语义：先【立住保持窗口】再切 store。两者同一个 tick 生效，
       visible / renderDeck 在这一次 patch 里就已经为真 ⇒ 放大卡不会被拆掉。 */
    const swap = appId !== system.activeAppId
    expandHold.value = true
    system.resumeApp(appId)
    clearTimeout(expandHoldTimer)
    expandHoldTimer = setTimeout(() => {
      expandHoldTimer = null
      /* 撤掉保持窗口（= 放大卡与根节点一起卸载）。这一帧底下必须是稳定态：
         · swap 路径等满 HERO_OPEN_DURATION，AppWindow 已 phase='open'（全屏 + 内容全亮）；
         · same 路径 AppWindow 没重挂，撑过两帧合成延迟即可。 */
      expanding.value = null
      expandTo.value = false
      expandHold.value = false
    }, swap ? HERO_OPEN_DURATION + EXPAND_HOLD_MARGIN_MS : EXPAND_HOLD_SAME_MS)
  }, RESUME_MS + 72)
}

function expandingStyle(i) {
  const idx = apps.value.indexOf(expanding.value)
  const pi = idx < 0 ? i : idx
  const slot = poseOf(pi)
  /* 起点：堆叠位姿（含层缩放）对应的矩形中心；终点：屏幕中心。
     注意 cx 用 cardW*slot.scale 而不是 cardW —— box 是屏宽，视觉矩形必须落在堆叠卡的
     真实矩形上（宽 cardW×slot.scale），否则层缩放卡会错位。 */
  const s0 = previewScale.value * slot.scale
  const cx = expandTo.value ? screenW.value / 2 : slot.x + (cardW.value * slot.scale) / 2
  const cy = expandTo.value ? screenH.value / 2 : slot.y + (cardH.value * slot.scale) / 2
  const s = expandTo.value ? 1 : s0
  return {
    width: screenW.value + 'px',
    height: screenH.value + 'px',
    /* 覆盖 .switcher-card.is-deck 的 `transform-origin: 0 0`（那是堆叠几何的原点）：
       中心锚点缩放才与跟手卡同构。 */
    transformOrigin: 'center center',
    transform: `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(${s})`,
    borderRadius: expandTo.value ? '0px' : RADIUS.value / Math.max(s, 0.01) + 'px',
    filter: 'brightness(1)',
    zIndex: Z_EXPAND,
    opacity: 1,
    transition: expandTo.value
      ? `transform ${RESUME_MS}ms cubic-bezier(0.32, 1, 0.6, 1), border-radius ${RESUME_MS}ms linear`
      : 'none'
  }
}

/* 卡片样式分派 —— 锚点几何（跟手/展开）居中缩放，堆叠几何以左上角为原点 */
function cardStyle(id, i) {
  if (clearing.value) return clearingStyle(i) // 一键清理优先（清空动作压过一切）
  if (id === dismissing.value) return dismissingStyle(i)
  if (id === expanding.value) return expandingStyle(i)
  return stackStyle(i)
}

/* ---- 一键清理（需求⑩）：逐卡上滑飞出 ----
 * 参考视频 V10 逐帧量测（592×1280 / 24fps / 109 帧 → /tmp/vwork/v10）：
 *   · 起跳时刻：f032 静止 → f037 完全出屏，**5 帧 ≈ 208ms 走完**。
 *   · 卡底沿轨迹（逐帧 bbox，避开状态栏白字）：1020 → 1020 → 860 → 490 → 140 → 出屏，
 *     增量 0 / −160 / −370 / −350 —— **加速上扬（ease-in）**，不是匀速、也不是缓出。
 *     末帧仍有 ≈8400px/s，说明是「被甩出去」而不是「滑到位」。
 *   · **全程亮度不变**（f036 的残余卡条仍是纯白 229）⇒ **只位移、不淡出**。
 *   · 垃圾桶按钮在起飞前 1~2 帧先有按压高亮（f030/f031 实心白 → f032 回弹）
 *     ⇒ 先给按压反馈、再起飞。
 *
 * 本项目只跑 1 张卡时与视频同构；多卡时按 |a| 递增 45ms 错峰（C 位先走、两侧跟进）。
 * 关键取舍：**不用 `dismissWithAnimation` 的 240ms + `-screenH×1.1`** ——
 * 那是「上滑移除单卡」的缓出曲线（属于跟手抛掷的收尾），而一键清理在视频里是
 * 从静止直接加速，两者不该共用同一条曲线。
 *
 * ⚠️ 时长常量与 CSS 里那条 `cubic-bezier(0.55, 0, 0.9, 0.35)` 是同一条曲线的两个表述，
 *    改这里必须同步 clearingStyle 的 transition；断言见 verify-app-switcher 的「批次 4」。 */
const CLEAR_MS = 260 // 单卡飞出时长（视频实测 208ms，留一点余量避免「啪」地切断）
const CLEAR_STAGGER = 45 // 多卡错峰
const CLEAR_TAIL = 60 // 收尾缓冲：等最后一张真的出屏再清空，否则会看到「半空消失」
const CLEAR_RISE = 1.15 // 飞出位移 = screenH × 1.15（确保完全离屏，含卡片自身高度）

/** 某张卡的起飞延迟（层深越靠外越晚） */
function clearDelayOf(i) {
  return Math.min(Math.abs(i - focus.value), 2) * CLEAR_STAGGER
}

function clearingStyle(i) {
  const p = deckPose(i - poseFocus.value, metrics.value, xFrac.value)
  return {
    width: cardW.value + 'px',
    height: cardH.value + 'px',
    transform: `translate3d(${p.x}px, ${p.y - (clearGo.value ? screenH.value * CLEAR_RISE : 0)}px, 0) scale(${p.scale})`,
    /* 需求⑩：参考视频是纯位移（末帧残余卡条仍纯白）→ 不淡出，opacity 恒 1 */
    opacity: 1,
    filter: `brightness(${p.bright})`,
    zIndex: deckZ(i),
    borderRadius: RADIUS.value + 'px',
    /* 覆盖 .switcher-card 的默认过渡（0.32s 弹性缓出）—— 那条是「吸附收尾」的曲线，
       一键清理要的是「从静止加速甩出」的 ease-in。delay 承担多卡错峰。 */
    transition: `transform ${CLEAR_MS}ms cubic-bezier(0.55, 0, 0.9, 0.35) ${clearDelayOf(i)}ms`
  }
}

/* 底部垃圾桶：清空最近任务回桌面（第七轮·批次 4：补上逐卡上滑飞出） */
function clearAll() {
  if (clearing.value || dismissing.value || expanding.value) return
  const n = renderedCards.value.length
  if (!n) {
    /* 第十五轮：dismissAll 同样是硬切（activeAppId 置空 + baseLayer='home'），
       被它带走的那个前台应用的桌面图标必须在这里归还。 */
    releaseHiddenIcon(system.activeAppId)
    system.dismissAll()
    return
  }
  clearing.value = true
  clearGo.value = false
  /* 分两帧：先把「飞出过渡 + 起飞前位姿」渲染出来，下一帧再改目标值。 */
  requestAnimationFrame(() => {
    if (clearing.value) clearGo.value = true
  })
  clearTimeout(clearTimer)
  const last = Math.max(0, Math.min(n - 1, 2)) // 错峰按 |a| ≤ 2 计，与 clearDelayOf 同口径
  clearTimer = setTimeout(() => {
    clearTimer = null
    clearing.value = false
    clearGo.value = false
    /* 第十五轮：与上面 if (!n) 分支同因 —— dismissAll 硬切，先把隐藏态归还。 */
    releaseHiddenIcon(system.activeAppId)
    system.dismissAll()
  }, CLEAR_MS + last * CLEAR_STAGGER + CLEAR_TAIL)
}

/** 点空白：关掉切换器并【回桌面】（需求⑪）。
 *  与 dismissAll 的区别 —— 这里【不清】最近任务，只是离开切换器回桌面。
 *  第十五轮：这条路径也是硬切（system.exitSwitcherToHome 直接置 activeAppId=null），
 *  同样拿不到 AppWindow 的 hero 收尾钩子 ⇒ 必须在切状态【之前】归还桌面图标隐藏态。
 *  本函数是「点空白」的唯一漏斗（退场动画播完由它落定终态）。 */
function exitSwitcherToHome() {
  releaseHiddenIcon(system.activeAppId)
  system.exitSwitcherToHome()
}

/* ---- 点空白退出的动效（第八轮，需求④）----
 * Ricky 原话：「点击空白处退出时缺少动画」—— 参考视频 23a8c90d…mp4，
 * 592×1280 / 24fps / 76 帧（抽帧在 /tmp/vwork/r8/exit，逐帧量测见 switcherDeck.js
 * 的 DECK.EXIT_SLIDE_* 注释）：运动窗口 = f021~f025，约 5 帧 ≈ **0.21s**；
 * 卡片组**向左滑出**（f026 时只剩左缘一条细卡），桌面图标网格同期渐显。
 *
 * 实现：给根节点挂 is-closing → 由 CSS 把 .switcher-track 平移到左侧 0.78 屏宽、
 * 遮罩与底部工具条淡出；动画播完才真正切状态（exitSwitcherToHome），
 * 否则组件会连同动画一起被卸载，什么都看不到。
 *
 * 为什么不用一个 Vue 的 <Transition>：卡片位姿是【内联 transform 逐帧直写】的，
 * 外层再包一层过渡会和手势期的直写打架；挂类名只改容器 + 遮罩，互不干扰。 */
const closing = computed(() => system.switcherClosing)

function exitWithAnimation() {
  if (!system.beginSwitcherClose()) return
  clearTimeout(closeTimer)
  closeTimer = setTimeout(() => {
    closeTimer = null
    /* 第九轮（需求⑥）：先把根节点判为「已回家」，再交回 store。
       两件事必须在同一个 patch 里生效 —— exitedHome 让 visible 变假，所以根节点会被
       直接移除，而 store 那几处变更（appSwitcherOpen / switcherProgress / neighborsIn）
       引发的「卡片弹回居中」中间态【一帧都不会上屏】。否则就是实测到的：
       track 从 −335 弹回 0、卡片在屏幕正中闪现一帧，然后再左滑淡出一次（动画播两遍）。 */
    exitedHome.value = true
    /* 第十七轮：走 sqReset() 而不是裸 sqSnap(0) —— 必须先停掉挤压追踪器，
       否则它会带着退场前的目标在下一帧把 sq 又拉回去（退场途中的整组位移会抽一下）。 */
    sqReset()
    followFreeSnap(0)
    exitSwitcherToHome()
  }, DECK.EXIT_SLIDE_MS + 20)
}

/* ---- 卡片组的容器变换（第十轮·需求③）----
 *   常态：整组【向左平移】shift = −(screenW − cardW·g)/2（g = 等比缩小系数，见
 *         deckSqueezeShift）—— 位移不再是写死的屏宽分数，而是与缩放一起解出来的，
 *         语义是「前卡的左缘正好落到屏幕左缘」；
 *   退场：平移到左侧 0.78 屏宽 —— 第八轮需求④的滑出。
 * 两者互斥（退场时 k 已被 sqReset() 归零）。
 *
 * ⚠️ 等比缩小【不在这里】做，而是逐卡在 deckPose 里乘（m.sq ⇒ scale *= g）：
 *    容器级 scale 会连带把「前卡左缘落到 0」这个推导出来的位移前提打破
 *    （容器缩放的原点是屏幕中心，逐卡缩放的原点是卡自己）。两者混用会互相抵消，
 *    观感变成「卡片在屏幕上缩放但间距不变」—— 那正是本轮要修的东西的反面。
 *
 * 历史：第八轮这里是 scaleX(挤压比) ⇒ 把卡「压扁」；第九轮只有 translate ⇒ 少了缩放。
 * 本轮 = 位移 + 逐卡等比缩小 + 阶梯收紧，三者同相位。 */
const trackStyle = computed(() => {
  if (closing.value) return { transform: `translate3d(${deckEnterDx(screenW.value)}px, 0, 0)` }
  const shift = deckSqueezeShift(screenW.value, cardW.value, sq.value)
  if (Math.abs(shift) < 0.05) return { transform: 'none' }
  return { transform: `translate3d(${shift}px, 0, 0)` }
})

/* ---- 堆叠卡组的【群组变换】（第十六轮·需求①）----------------------------
 *
 * Ricky 原话：「应用内进入多任务，底部卡片出现时应该与被拖拽的卡片同步进行缩放移动。」
 *
 * 症状（探针 /tmp/vwork/r16/probe-enter-neighbor.mjs；应用内上滑 200px 后按住不动）：
 *   被拖拽的跟手卡（照片）视觉宽 299.8、下方邻居卡（演示）静止后 258.5 ⇒ 比值 0.863，
 *   而「邻居 = 0.94 × 前卡」是这个 deck 的几何契约（SCALE_DECAY = 0.94）。
 *   入场全程该比值从 0.802 单调漂到 0.863 —— 一直追不上，且两条运动【相位脱钩】：
 *   停驻期间跟手卡完全冻结（sx 恒 0.6972），邻居卡却自己在跑一条固定 480ms 的 CSS 过渡。
 *   视觉上就是 Ricky 截图里的：底部那张卡「几乎和手里的卡一样大、还更靠下」。
 *
 * 根因：邻居卡的入场目标是 `deckPose(a = 1)` 的【绝对终位】—— 那个位姿是相对
 *   「已经落位的前卡」（275 宽、中心 cardCy）定义的；而此刻前卡还被跟手卡顶替着，
 *   实际尺寸 299.8（大了 9%）、中心也在别处。按落位后的尺寸去画邻居 ⇒ 必然偏小偏下。
 *
 * 修法：给整组堆叠卡加一个【相似变换 G】，把「跟手卡当前的位姿」映射到「卡位」——
 *   整组随跟手卡同步缩放、同步位移；p → 1 时 G 退化为单位阵 ⇒ 交接帧不需要任何补偿。
 *
 * 推导（原点 O = 屏幕中心 (Cx, Cy)，因为 group 是 inset:0 且 transform-origin: center center）：
 *   前卡 = poseOf(frontIndex)，矩形 (x, y, cardW·k0, cardH·k0)
 *   k  = 跟手卡视觉宽 / 前卡视觉宽 = (screenW · sx) / (cardW · k0)
 *   dx = (cx − Cx) − k·(Fcx − Cx)
 *   dy = (cy − Cy) − k·(Fcy − Cy)
 *   两条不变量让式子塌下来（所以下面直接写开形式，别再引入分支）：
 *     · Fcy ≡ cardCy —— deckPose 的 y = cardCy − cardH·scale/2 对每层恒成立；
 *     · Fcx = frontX + cardW·k0/2 —— 前卡的 a = 0 ⇒ stair(0) = 0 ⇒ restX = frontX。
 *
 * ⚠️ 为什么必须新包一层 .switcher-deck-group，而不是把 G 加在 .switcher-track 上：
 *    跟手卡【也是】track 的子节点（`v-if="followStyle"` 那一张）
 *    ⇒ 在 track 上 scale 会把跟手卡自己再缩一次（双重缩放）。
 *    包一层只圈住堆叠卡、与 track 同坐标系 ⇒ 上面的推导逐字成立，对跟手卡零影响。
 *
 * ⚠️ 只在【跟手卡在场】时给值（followGeom 非空），其余时刻返回 null（= transform: none）：
 *    deck 模式下左滑挤压（sq）、焦点吸附、退场滑出全都已经有自己的逐帧直写或 CSS 过渡，
 *    再叠一层会二次变换。而「跟手卡在场」这一个判据本身就覆盖了 deck 模式 ——
 *    落位完成后 settledOne 成立（openP / followFree / switcherProgress 三者都在 1 附近），
 *    followGeom 返回 null，群组变换自动退化为单位阵。
 *    ⚠️ 不要在这里加 `p >= 1` 之类的截断（第一版加过，被探针否掉）：
 *    p ∈ (1, 1.2] 是一个【真实且能停驻】的状态（上滑滑过满量程后按住）——
 *    跟手卡继续缩小（0.55^(p−1)）并上移（OVER_RISE_FRAC），邻居卡若被钉回绝对槽位，
 *    就会变成比手里的卡【更大、更靠下】（探针 /tmp/vwork/r16/probe-overtravel.mjs 实测
 *    p = 1.17 时邻居/follow = 1.068、中心低 22.2px）—— 正是本轮要修的东西的镜像版。
 *    p → 1 时 k ≡ 1、dx = dy ≡ 0，本来就等价于 none，无需额外短路。
 *    deck 模式的泄漏反证：/tmp/vwork/r16/probe-deckleak.mjs 实测空闲/按下/横拖/松手
 *    全程都是 matrix(1,0,0,1,0,0)，偏差 0.0000。
 * ⚠️ 与 trackStyle 的挤压位移【不冲突】：挤压只发生在落位后（此时 G ≡ 单位阵），
 *    且 track 的 translate 在 group 的 scale 之外 ⇒ 一旦两者同时非平凡，位移仍在屏幕空间。 */
const deckGroupStyle = computed(() => {
  const g = followGeom.value
  if (!g) return null
  const Cx = screenW.value / 2
  const Cy = screenH.value / 2
  const front = poseOf(frontIndex.value)
  const frontW = cardW.value * front.scale
  if (!(frontW > 0)) return null
  const k = (screenW.value * g.sx) / frontW
  if (!Number.isFinite(k) || k <= 0) return null
  const Fcx = front.x + frontW / 2
  const Fcy = front.y + (cardH.value * front.scale) / 2
  const dx = g.cx - Cx - k * (Fcx - Cx)
  const dy = g.cy - Cy - k * (Fcy - Cy)
  return {
    transform: `translate3d(${dx.toFixed(3)}px, ${dy.toFixed(3)}px, 0) scale(${k.toFixed(5)})`
  }
})

/** 遮罩不透明度：退场时归零（桌面立刻现形），其余跟随手势进度 */
const dimOpacity = computed(() =>
  closing.value ? 0 : Math.min(1, system.switcherProgress)
)

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && screenRef.el) {
    ro = new ResizeObserver(measure)
    ro.observe(screenRef.el)
  }
  /* 触控板双指横滑（需求①）：挂在 window 上，并且【显式 passive:false】——
     ① 底部 ~30px 的手势条（HomeIndicator，z=96）不在 .app-switcher 内，
        只挂根元素会漏掉那一条；
     ② 必须能 preventDefault（见 onWheel 里的注释：卡片内含真实应用预览，
        设置页那种自带可滚列表会被横滑滚起来）。
     代价是 DevTools 可能提示「非 passive 的 wheel 监听」——那是开发期提示，
     与正确性无关；轮询事件里我们先判 deltaX 再拦，纯纵向滚轮原样放行。 */
  window.addEventListener('wheel', onWheel, { passive: false })
})
watch(rootRef, (el) => { if (el) measure() })
onBeforeUnmount(() => {
  if (ro) { ro.disconnect(); ro = null }
  clearTimeout(dwellTimer)
  clearTimeout(settleTimer)
  clearTimeout(clearTimer)
  clearTimeout(closeTimer)
  clearTimeout(expandTimer)
  clearTimeout(expandHoldTimer)
  cancelWheel()
  window.removeEventListener('wheel', onWheel)
})
</script>

<template>
  <div
    v-if="visible"
    ref="rootRef"
    class="app-switcher"
    :class="{ 'is-dragging': !!drag, 'is-focus-moving': focusMoving, 'is-home-entrance': homeEntranceFollowing, 'is-home-retreat': homeRetreat, 'is-dismissing': !!dismissing || !!expanding, 'is-closing': closing }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <!-- 背景模糊压暗：跟手势进度淡入；点空白退场时归零（桌面立刻现形，需求④） -->
    <div class="switcher-dim" :style="{ opacity: dimOpacity }"></div>

    <!-- 卡片组容器：常态承载「左滑挤压」的整组左移（需求③），退场时整体平移到左侧（需求④） -->
    <div class="switcher-track" :style="trackStyle">
      <!-- 跟手缩放卡：手势进行中（progress<1）只有它，把全屏应用连续缩到卡位。
           第九轮（需求①）：它【自己也带标签行】—— 旧的把它当纯预览、标签留给堆叠前卡，
           于是入场上滑 + 横向漂移时「卡片被拖走、图标留在槽位」。 -->
      <div
        v-if="followStyle && system.activeAppId"
        class="switcher-card is-follow"
        :data-app-id="system.activeAppId"
        :style="followStyle"
      >
        <!-- 标签锚点：origin 0 0 落在卡左上角，scale(1/previewScale) 把坐标换算回卡的尺寸体系
             ⇒ 净缩放 = 卡缩放 / previewScale（见 followLabelStyle 的注释）。 -->
        <div class="switcher-card-label-anchor" :style="followLabelStyle">
          <div class="switcher-card-label" :style="labelStyle()">
            <AppIcon :app="appOf(system.activeAppId)" :size="24" :show-label="false" ignore-hidden />
            <span>{{ nameOf(system.activeAppId) }}</span>
          </div>
        </div>
        <div class="switcher-card-body">
          <div
            class="switcher-card-content"
            :style="{
              width: screenW + 'px',
              height: screenH + 'px',
              transform: `scale(${contentScale(true)})`,
              transformOrigin: '0 0'
            }"
          >
            <component :is="compOf(system.activeAppId)" :app="appOf(system.activeAppId)" />
          </div>
        </div>
      </div>

      <!-- 堆叠卡片组：切换器打开后渲染；桌面路径在【手势进行中】就要渲染，
           否则上滑期间屏幕上一张卡都没有（只剩黑遮罩）= 盲滑，手感极差。
           前卡在进场进度 <1 时由跟手卡顶替（同位姿无缝交接），其余卡片按进度淡入。
           层级由 deckZ(i) = 10000 - i 决定 —— 顶卡一直到最后飞出屏幕都在最上层。
           ⚠️ 第十六轮：整组外面包一层 .switcher-deck-group，承载「随跟手卡同步缩放/位移」
           的群组变换（见 deckGroupStyle）。**不能**把这层变换加在 .switcher-track 上 ——
           跟手卡也是 track 的子节点，会被一并缩放（双重缩放）。 -->
      <div v-if="renderDeck" class="switcher-deck-group" :style="deckGroupStyle">
        <div
          v-for="c in renderedCards"
          :key="c.id"
          class="switcher-card is-deck"
          :data-app-id="c.id"
          :data-index="c.i"
          :data-depth="+(c.i - focus).toFixed(3)"
          :style="cardStyle(c.id, c.i)"
        >
          <!-- 卡片上方一行：应用图标 + 名称（第七轮改）。
               参考图（Ricky 2026-09-13 需求⑨）：**每张卡都有自己的图标**，
               但**只有 C 位那张显示应用名称** —— 后面两层只画图标，形成向左上的图标阶梯。
               ⚠️ 必须传 ignore-hidden：AppWindow 在前台应用打开期间会调用
               home.hideIcon(activeAppId)，把该应用的图标置成全局隐藏态。
               C 位初始正好就是前台应用 → 不加这个 prop 时「设置」那张卡的图标是空的
               （名称还在，因为名称不吃隐藏态）。这是 Ricky 截图里「设置的图标消失了」的根因。
               ⚠️ 第九轮（需求①）：前卡被跟手卡顶替时（bodyOpacityOf = 0）这一行必须【让位】——
               标签已经挂在跟手卡上，两边都画就会同时在槽位和跟手卡上出现两份图标。 -->
          <div v-if="!dismissing && bodyOpacityOf(c.i) !== 0" class="switcher-card-label" :style="labelStyle()">
            <AppIcon :app="appOf(c.id)" :size="24" :show-label="false" ignore-hidden />
            <span v-if="c.i === labelIndex">{{ nameOf(c.id) }}</span>
          </div>
          <!-- 卡体单独吃一份透明度（bodyOpacityOf）：前卡被跟手卡顶替时只淡卡体、
               卡根留 1 —— 这样标签行在停驻期就一直在场，交接那一帧也不用淡入（需求③）。 -->
          <div class="switcher-card-body" :style="{ opacity: bodyOpacityOf(c.i) }">
            <div
              class="switcher-card-content"
              :style="{
                width: screenW + 'px',
                height: screenH + 'px',
                transform: `scale(${c.id === expanding ? 1 : previewScale})`,
                transformOrigin: '0 0'
              }"
            >
              <component :is="compOf(c.id)" :app="appOf(c.id)" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部：清空后台（与通知中心同款磨砂圆钮；进度到位后淡入） -->
    <div
      v-if="system.appSwitcherOpen || preCommit"
      class="switcher-dock"
      :style="{ opacity: chromeOpacity, zIndex: Z_CHROME, bottom: dockBottom + 'px' }"
    >
      <GlassCircleButton
        class="switcher-trash"
        :label="i18n.t('clearAllNotifs')"
        @click.stop="clearAll"
      >
        <!-- 与通知中心同一份 trash-2 图标（桶身 + 桶盖 + 两根竖线），勿改成单路径版 -->
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </GlassCircleButton>
    </div>
  </div>
</template>

<style scoped>
.app-switcher {
  position: absolute;
  inset: 0;
  z-index: 95; /* 低于 Home 手势条（96），保证底部手势可用 */
  touch-action: none;
  user-select: none;
  overflow: hidden;
}

.switcher-dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(26px) saturate(140%);
  -webkit-backdrop-filter: blur(26px) saturate(140%);
}
/* 桌面路径退场（上滑未激活就松手）：遮罩跟着卡片一起淡出。
   只在 .is-home-retreat 这个精确窗口里开 —— 跟手期与应用内上滑路径都必须逐帧直写。 */
.app-switcher.is-home-retreat .switcher-dim {
  transition: opacity 0.28s ease;
}

.switcher-track {
  position: absolute;
  inset: 0;
  /* 第九轮（需求③）：容器只做【整组平移】——
     左滑挤压 = translate3d(shift,0,0)，退场 = translate3d(−0.78 屏宽,0,0)。
     旧版这里是 scaleX(挤压比)：作用在整组上会把卡里的应用预览一起横向压扁，
     而参考视频 53416f88…mp4 逐帧实测前卡宽恒 302px、内容零形变，所以压缩一定是错的。
     transform-origin 只影响 scale/rotate，纯位移下无所谓 —— 保留 center center 不动。 */
  transform-origin: center center;
  will-change: transform;
}
/* 第八轮（需求④）：点空白退场的滑出过渡。
   只在 is-closing 这个精确窗口里开 ——
   · 手势期的挤压/跟手位移都是【逐帧直写】，挂过渡会被二次低通成滞后；
   · 入场那条路径靠卡片自身的过渡，容器不能抢。
   曲线 0.45/0.05/0.55/0.95 ≈ 实测的 ease-in-out（速度先增后减），300ms ≈ 实测 5~8 帧。 */
.app-switcher.is-closing .switcher-track {
  transition: transform 300ms cubic-bezier(0.45, 0.05, 0.55, 0.95);
}
/* 退场时遮罩比卡片更早淡完 —— 参考视频里桌面几乎和卡片滑动同时现形 */
.app-switcher.is-closing .switcher-dim {
  transition: opacity 240ms ease;
}
/* 第九轮（需求②）：退场时垃圾桶【立即消失】——
   这里必须是 transition:none，不能沿用 180ms 淡出（Ricky 原话「点击空白处回桌面时立即消失」）。
   它的淡入过渡写在 .switcher-dock 基础规则里（松手后才出现那一段需要淡入）。 */
.app-switcher.is-closing .switcher-dock {
  transition: none;
}

/* 堆叠卡组的群组变换容器（第十六轮）——
   与 .switcher-track 同坐标系（inset:0）但与跟手卡【平级、不嵌套】：群组变换只作用于堆叠卡。
   ⚠️ 不给它挂任何 transition：变换由 switcherProgress 逐帧直写（跟手），
      挂过渡会被二次低通成滞后 —— 与 .is-follow 排除过渡是同一个道理。 */
.switcher-deck-group {
  position: absolute;
  inset: 0;
  transform-origin: center center;
  will-change: transform;
}

.switcher-card {
  position: absolute;
  left: 0;
  top: 0;
  /* 锚点几何（跟手缩放 / 点卡恢复）：围绕中心缩放 */
  transform-origin: center center;
  will-change: transform, filter;
}
/* 堆叠几何：以【左上角】为原点缩放 —— 左边缘被钉住，下层才会「露出越来越少的左侧阶梯」
   （若用 center，缩放会把左边缘往右推，阶梯会被吃掉，最深层还会漂出屏）。
   垂直方向的「居中」由 deckPose 的 y = cardCy - cardH·scale/2 显式补偿（修正 B）：
   原点在左上角不再意味着顶对齐，所有层的垂直中心恒等于 cardCy。 */
.switcher-card.is-deck {
  transform-origin: 0 0;
}
/* 非拖拽 / 非焦点弹簧推进 / 非桌面跟手入场时开过渡（重排、移除、恢复、桌面入场收场）。
   - .is-follow 的 transform 由手势/进场弹簧逐帧直写，挂 transition 会被二次低通，
     表现为「跟手滞后、松手后慢慢飘」→ 必须排除；
   - .is-focus-moving 是松手后的吸附弹簧，同理必须排除；
   - .is-home-entrance 是桌面路径上滑【跟手】期（进度逐帧直写卡片 x；第九轮需求④起
     opacity 恒 1、不再跟手淡入）——
     AppSwitcher 自己不持有这次拖拽（拖动发生在 HomeIndicator 上，drag 恒为 null），
     所以 .is-dragging 挡不住它；不排除的话同样会滞后发飘。
     手势取消后会自然退出这个类 → 过渡恢复 → 卡片顺势向左滑出淡出。
   - 曲线 0.32s / cubic-bezier(0.32, 1.16, 0.6, 1)：与 ios-deck 弹簧（τ≈110ms、
     过冲 6.7%）的收尾观感一致，末段带一点回弹余韵，不再是死板的 ease-out。 */
.app-switcher:not(.is-dragging):not(.is-focus-moving):not(.is-home-entrance) .switcher-card:not(.is-follow) {
  transition:
    transform 0.32s cubic-bezier(0.32, 1.16, 0.6, 1),
    opacity 0.22s ease,
    filter 0.28s ease;
}

/* 跟手卡的标签锚点（第九轮，需求①）——
   把标签的坐标系从「整屏尺寸的跟手卡」换算回「卡的尺寸体系」：
   锚点 scale(1/previewScale)，外层跟手卡再乘 s ⇒ 标签净缩放 = s / previewScale。
   origin 必须 0 0：锚点要钉在卡左上角，标签的 36px 上偏才会跟着同一个比例走。 */
.switcher-card-label-anchor {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
}

.switcher-card-label {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 7px;
  height: 24px; /* = DECK.LABEL_ROW_H（改这里要同步 switcherDeck.js） */
  color: rgba(255, 255, 255, 0.95);
  font: 500 16px/1 var(--font-stack);
  white-space: nowrap;
  pointer-events: none;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.55);
}

.switcher-card-body {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  background: #0a0a0c;
  /* 需求②：投影按层深由 stackStyle 内联给值（--card-shadow，见 cardShadowOf）。
     这里的兜底值 = 焦点层那一档，供【不经过 stackStyle】的两张卡使用：
     跟手缩放卡（.is-follow）与点卡恢复时的放大卡。
     旧值是常量 `0 14px 36px rgba(0,0,0,0.42)` —— Ricky 反馈「卡片间的阴影过重」，
     42% 的黑配 36px 模糊，水平外溢全糊在邻居卡那一条 23~52px 的露出条上。 */
  box-shadow: var(--card-shadow, 0 12px 26px rgba(0, 0, 0, 0.28));
}

.switcher-card-content {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none; /* 预览只看不摸 */
  background: var(--bg-grouped, #f2f2f7);
}

.switcher-dock {
  position: absolute;
  left: 0;
  right: 0;
  /* bottom 由模板内联绑定（dockBottom = homeInset + DECK.DOCK_GAP）——
     第七轮起这里是唯一来源，CSS 不再抄一份 gap，避免两处脱钩。
     第八轮（需求①）：容器必须 pointer-events:none。
     它是一条 left:0;right:0 的整宽横带（430×52），若参与命中，
     底边空白带的点击会被「dock 命中」分支静默吃掉 → 点空白退不了切换器。
     只有按钮本体（GlassCircleButton，见下方 ::v-deep 规则）重新开启指针。 */
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  /* z-index 由模板绑 Z_CHROME 给（压在所有卡片之上） */
  /* 第九轮（需求②）：默认带淡入过渡 —— appSwitcherOpen 置真（= 松手）那一帧
     chromeOpacity 从 0 翻到 1，靠这条过渡淡入 ⇒「删除按钮松手后再出现」。
     退场（.is-closing）下这条被显式改回 transition:none ⇒ 立即消失。 */
  transition: opacity 0.2s ease;
}
/* 只有垃圾桶按钮吃指针（需求①）—— 容器其余部分视作空白，交给「点空白退出」 */
.switcher-dock :deep(.glass-circle-btn) {
  pointer-events: auto;
}
</style>
