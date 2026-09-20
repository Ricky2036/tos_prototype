<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSystemStore } from '../../stores/systemStore'
import { useControlStore, LAYOUT_PRESETS, PRESET_EXCLUSIVE_IDS } from '../../stores/controlStore'
import { useI18nStore } from '../../stores/i18nStore'
import { useSwipeGesture } from '../../composables/useSwipeGesture'
import { useCapture } from '../../composables/useCapture'
import { getDriver } from '../../composables/driverRegistry'
import { packLayout, isOverlapping, computeDisplayLayout, recordPositions, applyFlip } from './cc/ccLayout'
import GridButton from './cc/GridButton.vue'
import LIcon from '../ui/LIcon.vue'
import StatusIcons from '../ui/StatusIcons.vue'
import MaterialBlur from '../ui/MaterialBlur.vue'
import { VOLUME_LABELS } from '../../locales/volume.js'
import { clamp } from '../../utils/math'
import { orderedIndicators } from '../../utils/statusBarIndicators'
import albumCover from '../../assets/icons/album_cover.png'

/**
 * 控制中心（安卓液态玻璃风，移植自 android_control_center.tsx）。
 * 4 列网格：Wi-Fi/数据胶囊、媒体卡片、亮度音量竖滑块、19 个圆形开关。
 * 编辑模式：HTML5 拖拽重排（swap 虚拟显示引擎 + FLIP）、删除徽标、伸缩手柄。
 * 真实联动：亮度滑块压暗屏幕、飞行/Wi-Fi/蓝牙/蜂窝同步状态栏、相机直达应用。
 */
const system = useSystemStore()
const control = useControlStore()
const i18n = useI18nStore()

/* 音量面板相关文案（长按音量条的 aria 等）住在 locales/volume.js，
   与 CC 自身的磁贴名（locales/cc-labels.js）分文件，避免两个 feature 互相踩。 */
const vLabel = (k) => VOLUME_LABELS[i18n.locale]?.[k] ?? VOLUME_LABELS.zh[k] ?? k

const overlay = computed(() => system.overlays.controlCenter)
const visible = computed(() => overlay.value.status !== 'closed')

/* 电源菜单是「压在控制中心下层」的全屏层（--z-power-menu 93 < --z-control-center 94）。
   从关机磁贴唤起时 CC 会同时开始收起，若按常规让内容随 progress 一起淡出，
   露出的电源菜单就会从一片空白里长出来。所以这段时间把 CC 的内容/背板钉在不透明，
   视觉上变成「整块 CC 向上抽走，电源菜单从下面连续露出」。 */
const powerTransition = computed(() => control.powerMenuOpen && visible.value)

// 状态栏指示器：勿扰/热点/静音/振动 启用后，在控制中心状态行也点亮（与开关按钮同源 LIcon）
/* 下拉控制中心状态行：与桌面状态栏共用 src/utils/statusBarIndicators.js 同一套优先级排序规则，
 * 保证「下拉控制中心后的状态栏图标排序规则与桌面状态栏规则一致」（Ricky 2026-09-08）。
 * 单卡：全部指示器按优先级升序一排渲染。
 * 双卡两行：按优先级分段（<=30 落第1行 SIM1，>=40 落第2行 SIM2），
 *   每段内部仍按优先级升序，整体自上而下连续升序，与桌面规则一致。
 *   分段阈值取 30/40 的意图是「双卡两行图标数更均衡」：低优先级组(vibrate/mute)2 个放第1行，
 *   高优先级组(hotspot/bluetooth/dnd)3 个放第2行，避免第2行图标过少（Ricky 2026-09-08）。 */
const ccIndicators = computed(() => orderedIndicators.filter((d) => d.show(control)))
const ccDualRow1 = computed(() => orderedIndicators.filter((d) => d.priority <= 30 && d.show(control)))
const ccDualRow2 = computed(() => orderedIndicators.filter((d) => d.priority >= 40 && d.show(control)))

const layerStyle = computed(() => ({
  transform: `translateY(${(overlay.value.progress - 1) * 100}%)`,
  visibility: visible.value ? 'visible' : 'hidden',
  pointerEvents: visible.value ? 'auto' : 'none'
}))
/** 宫格整体缩放：派生尺寸一次性下发成 CSS 变量，
 *  模板与样式里不再出现任何 62 / 14 / 290 的硬编码。
 *  --cc-k 是纯倍率，给那些「按 62 时代手工量出来的固定像素」做等比换算用
 *  （例如 .gb-row 的 padding-left: 12px —— 原本 12+38+12=62 恰好居中，
 *    放大后 12 不变就会偏，必须跟着放大）。 */
const gridVars = computed(() => ({
  '--cc-k': control.gridScale,
  '--cc-cell': `${control.cellSize}px`,
  '--cc-gap': `${control.gridGap}px`,
  '--cc-pitch': `${control.cellPitch}px`,
  '--cc-grid-w': `${control.gridWidth}px`
}))
const blurStyle = computed(() => ({
  opacity: powerTransition.value ? 1 : clamp(overlay.value.progress * 1.2, 0, 1)
}))
const contentStyle = computed(() => ({
  transform: `translateY(${(1 - overlay.value.progress) * 26}px)`,
  opacity: powerTransition.value ? 1 : clamp(overlay.value.progress * 1.5, 0, 1)
}))

const scrollRef = ref(null)
const rootRef = ref(null)

/* ---- 溢出检测：仅在内容溢出时允许滚动 ---- */
const hasOverflow = ref(false)

function checkOverflow() {
  if (!scrollRef.value) return
  // scrollHeight 比 clientHeight 多出 4px 以上判定为溢出
  hasOverflow.value = scrollRef.value.scrollHeight > scrollRef.value.clientHeight + 4
}

let resizeObs = null
onMounted(() => {
  nextTick(() => {
    checkOverflow()
    if (scrollRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver(() => checkOverflow())
      resizeObs.observe(scrollRef.value)
    }
    if (scrollRef.value) {
      // 唯一的 wheel 监听。必须显式 { passive: false }，否则 preventDefault() 会被忽略。
      // 模板上不要再写 @wheel：根元素与 .cc-scroll 曾各写一次，
      // 叠加这里导致一次滚轮触发 3 次 requestCloseOverlay，关闭动画跳变。
      scrollRef.value.addEventListener('wheel', onCcWheel, { passive: false })
    }
  })
  window.addEventListener('resize', checkOverflow)
})

onBeforeUnmount(() => {
  if (resizeObs) resizeObs.disconnect()
  if (scrollRef.value) {
    scrollRef.value.removeEventListener('wheel', onCcWheel)
  }
  window.removeEventListener('resize', checkOverflow)
  window.removeEventListener('pointermove', onWindowPointerMove, true)
  window.removeEventListener('pointerup', onWindowPointerUp, true)
  window.removeEventListener('pointercancel', onWindowPointerUp, true)

  // ---- 其余残留资源：这些只在卸载瞬间生效，不影响任何正常路径 ----
  // 伸缩手柄：pointerup 用 { once: true }，若卸载前未抬起则监听残留
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', onResizeEnd)
  resizeState = null

  // 滑块拖拽
  if (sliderMoveHandler) {
    window.removeEventListener('pointermove', sliderMoveHandler)
    sliderMoveHandler = null
  }
  if (sliderUpHandler) {
    window.removeEventListener('pointerup', sliderUpHandler)
    sliderUpHandler = null
  }

  // 音量条：拖动句柄 + 长按展开定时器（长按期间没有任何 pointermove，
  // 与亮度条那套句柄语义互斥，所以是独立的一份，必须单独摘）
  clearVolumeSliderGestures()

  // 定时器
  if (interactTimer) { clearTimeout(interactTimer); interactTimer = null }
  if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null }
  if (dragStartTimer) { clearTimeout(dragStartTimer); dragStartTimer = null }
})


watch(() => overlay.value.status, (status) => {
  if (status === 'opening' || status === 'opened') {
    nextTick(() => {
      if (scrollRef.value) scrollRef.value.scrollTop = 0
      checkOverflow()
    })
  }
  /* 电源菜单只该活在「从关机磁贴唤起、CC 随即收起」这一条路径上。
     一旦 CC 被重新拉开（手势下拉 dragging / 落到 open），说明用户已经离开那条路径，
     必须把菜单收掉 —— 否则 powerTransition 会一直把 CC 内容钉在 opacity 1，
     表现成「CC 拉不开、内容半透明地糊在电源菜单上面」。 */
  if (status === 'open' || status === 'dragging') control.closePowerMenu()
})

/* 宫格整体缩放会改变内容高度，但 ResizeObserver 只盯着 .cc-scroll 自身的盒子
   （它恒为 100% 高，不会变），所以必须主动复检，否则溢出状态不刷新、
   滚动与上滑关闭手势会错乱。 */
watch(() => [control.gridScale, control.editing], () => {
  nextTick(checkOverflow)
})

let isInteracting = false
let interactTimer = null
let dragStartTimer = null // onDragStart 的 setTimeout(0)，卸载时需清掉
function markInteracting() {
  isInteracting = true
  if (interactTimer) clearTimeout(interactTimer)
  interactTimer = setTimeout(() => {
    isInteracting = false
  }, 350)
}

/* ---- 未溢出时上滑关闭：图标位置不变，收起控制中心面板 ---- */
let touchStartY = 0
let touchStartX = 0
let touchStartTime = 0
let isTrackingSwipe = false

function onCcPointerDown(e) {
  if (e.button != null && e.button !== 0) return
  if (control.fineTuningMode || editing.value) return

  // 点击/触摸在任何可交互元素（网格、开关、胶囊、媒体、滑块等）上时，严禁触发上滑关闭手势检测
  if (e.target.closest('.cc-grid, .cc-cell, .gb-wrap, .cc-pill, .cc-media, .cc-sliders, .cc-header, button, input, a, .ft-hud')) {
    return
  }

  touchStartY = e.clientY
  touchStartX = e.clientX
  touchStartTime = Date.now()
  isTrackingSwipe = true

  window.addEventListener('pointermove', onWindowPointerMove, true)
  window.addEventListener('pointerup', onWindowPointerUp, true)
  window.addEventListener('pointercancel', onWindowPointerUp, true)
}

function onWindowPointerMove(e) {
  if (!isTrackingSwipe) return
  if (hasOverflow.value) return
  // 未溢出时：图标位置绝对不变，不跟随手指位移拖拽
}

function onWindowPointerUp(e) {
  if (!isTrackingSwipe) return
  isTrackingSwipe = false

  window.removeEventListener('pointermove', onWindowPointerMove, true)
  window.removeEventListener('pointerup', onWindowPointerUp, true)
  window.removeEventListener('pointercancel', onWindowPointerUp, true)

  const deltaY = e.clientY - touchStartY
  const deltaX = e.clientX - touchStartX
  const dt = Math.max(1, Date.now() - touchStartTime)
  const velocityY = Math.abs(deltaY) / dt

  touchStartY = 0
  touchStartX = 0

  // 仅在未溢出时响应上滑收起控制面板（溢出时由正常上下滚动接管）
  if (hasOverflow.value) return

  // 检测上滑手势：向上位移 > 20px 或 快速向上轻扫
  if ((deltaY < -20 || (deltaY < -10 && velocityY > 0.25)) && Math.abs(deltaY) > Math.abs(deltaX) * 0.8) {
    markInteracting()
    system.requestCloseOverlay('controlCenter')
  }
}

function onCcWheel(e) {
  if (control.fineTuningMode || editing.value) return

  // 溢出时：允许正常上下滚动，不拦截
  if (hasOverflow.value) return

  // 未溢出时：严禁任何上下滚动与橡皮筋回弹
  e.preventDefault()

  // 检测触控板双指上滑手势（向上轻扫）
  // Mac 触控板自然滚动：双指向上推时 deltaY > 0；经典向上滚动：deltaY < 0
  if (Math.abs(e.deltaY) > 12 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    markInteracting()
    system.requestCloseOverlay('controlCenter')
  }
}

function onCcClick(e) {
  // 微调模式下不关闭控制中心面板
  if (control.fineTuningMode) {
    return
  }
  // 编辑模式下点空白区退出编辑模式（防误触：拖拽/伸缩期间及网格内部点击均不退出）
  if (editing.value) {
    if (isInteracting || resizingId.value || dragState.value) return
    if (e.target.closest('.cc-grid, .cc-cell, .gb-wrap, .cc-header, .cc-header-btn, .cc-header-edit-bar, .cc-header-svg-btn, .cc-edit-group, .cc-pill, .cc-media, .cc-sliders')) {
      return
    }
    control.setEditing(false)
    return
  }
  // 点击卡片、胶囊、按钮、滑块等交互元素时不退出
  if (e.target.closest('.cc-cell, .cc-header-btn, .cc-header-edit-bar, .cc-header-svg-btn, .cc-pill, .cc-media, .cc-sliders, .cc-vslider, .gb-wrap, .cc-grid-btn, .cc-icon-btn, .cc-edit-group, button, a, input, label, .ft-hud')) {
    return
  }
  // 网格容器不整体拦截：命中砖块（含半个间隙容差）视为交互；
  // 落在真正的空白区（如最后一行右侧的空格）则退出控制中心
  if (e.target.closest('.cc-grid') && gridRef.value) {
    const GRID_PAD = 7 // 列/行间隙 14px 的一半：轻微点偏不误判为空白
    const x = e.clientX
    const y = e.clientY
    const nearCell = [...gridRef.value.querySelectorAll('.cc-cell')].some((cell) => {
      const r = cell.getBoundingClientRect()
      return x >= r.left - GRID_PAD && x <= r.right + GRID_PAD && y >= r.top - GRID_PAD && y <= r.bottom + GRID_PAD
    })
    if (nearCell) return
  }
  system.requestCloseOverlay('controlCenter')
}

function onPillClick(e, id) {
  e.stopPropagation()
  if (control.fineTuningMode) {
    e.preventDefault()
    control.selectTarget(id, 'icon')
    return
  }
  if (editing.value) return
  if (id === 'wifi') control.toggle('wifi')
  else if (id === 'data') control.toggle('cellular')
  else if (id === 'oneLeap') control.toggle('share')
}

/* ================= 网格配置 ================= */

const TOGGLES = [
  { id: 'bluetooth', icon: 'bluetooth', activeBg: '#fff', activeColor: '#258FFF', defaultSize: '1x1', hasBadge: true },
  { id: 'hotspot', icon: 'radio', activeBg: '#fff', activeColor: '#258FFF' },
  { id: 'airplane', icon: 'plane', activeBg: '#fff', activeColor: '#258FFF' },
  { id: 'location', icon: 'mapPin', fillOnActive: true, activeBg: '#fff', activeColor: '#258FFF' },
  { id: 'screenshot', icon: 'scissors', activeBg: '#fff', activeColor: '#258FFF' },
  { id: 'darkMode', icon: 'darkTheme', activeBg: '#fff', activeColor: '#258FFF', defaultSize: '1x1' },
  { id: 'dnd', icon: 'moon', fillOnActive: true, activeBg: '#fff', activeColor: '#258FFF' },
  { id: 'sound', icon: 'bell', fillOnActive: false, activeBg: '#fff', activeColor: '#258FFF', defaultSize: '1x1' },
  { id: 'rotationLock', icon: 'rotationLock', activeBg: '#fff', activeColor: '#FF3B30' },
  { id: 'screenRecord', icon: 'video', fillOnActive: true, activeBg: '#fff', activeColor: '#FF4942' },
  { id: 'batterySaver', icon: 'battery', activeBg: '#fff', activeColor: '#EBB800' },
  { id: 'autoRotate', icon: 'autoRotate', activeBg: '#fff', activeColor: '#258FFF' },
  { id: 'share', icon: 'quickShare', activeBg: '#fff', activeColor: '#258FFF' },
  { id: 'cast', icon: 'cast', activeBg: '#fff', activeColor: '#258FFF' },
  { id: 'flashlight', icon: 'flashlight', activeBg: '#fff', activeColor: '#FBB500' },
  // id 保留 calculator：控制中心状态、微调尺寸(31)、点击打开的应用全部按此 id 串联
  { id: 'calculator', icon: 'wallet', activeBg: '#fff', activeColor: '#258FFF' },
  { id: 'scan', icon: 'scan', activeBg: '#fff', activeColor: '#258FFF' },
  { id: 'boost', icon: 'zap', activeBg: '#fff', activeColor: '#258FFF' },
  // 关闭态用带斜杠的 motionComfortOff，开启态才是纯点阵 motionComfort
  { id: 'motionComfort', icon: 'motionComfort', iconOff: 'motionComfortOff', activeBg: '#fff', activeColor: '#1A88FF' },
  { id: 'liquidCooling', icon: 'liquidCooling', activeBg: '#fff', activeColor: '#1A88FF' },
  { id: 'shoulderKey', icon: 'shoulderKey', activeBg: '#fff', activeColor: '#258FFF' },
  /* EE1 系列新增：VPN（插在 快速分享(cast) 之前，见 presetItems 的 extra 处理） */
  { id: 'vpn', icon: 'vpn', activeBg: '#fff', activeColor: '#258FFF' },
  // 已从默认布局下线（Ricky 2026-09-08）：定义保留，方便以后一键恢复。
  // 恢复方式 = 同时做两件事：把 'jbl' 加回下面的 DEFAULT_TOGGLE_IDS，
  //   并把 'jbl' 加回 controlStore 里 NOTE 的 only —— 只加一处不会生效。
  { id: 'jbl', icon: 'jbl', activeBg: '#fff', activeColor: '#258FFF' }
  /* 关机磁贴已下线（Ricky 2026-09-20：「关机按钮要去掉」）。
     它是一个「一次性动作」磁贴而非开关（control.toggles 里没有它），
     放在 CC 里既不属于这套网格的语义，又会让 4 个预设从 9 行涨到 10 行并进入溢出态。
     电源菜单改由**长按实体电源键**进入，见 src/components/phone/PhoneFrame.vue 的
     startPowerHold（那边同时把 CC 走动画收起，把压在下面的菜单一帧帧露出来）。
     要恢复磁贴：这里加回定义，再把 id 加回 DEFAULT_TOGGLE_IDS 与 HIOS17_ITEMS 两处。 */
]

const DEFAULT_TOGGLE_IDS = [
  'flashlight', 'sound',
  'bluetooth', 'hotspot', 'airplane', 'location',
  'screenshot', 'darkMode', 'dnd', 'rotationLock',
  'screenRecord', 'batterySaver', 'autoRotate', 'share',
  /* 倒数第二排顺序（Ricky 2026-09-09）：肩键 → 液冷散热 → 灯效 → 晕动舒缓。
     GT / GT 17 都按这个相对顺序；CAMON、NOTE 没有肩键和液冷，剩下的
     灯效 → 晕动舒缓 相对顺序不变，所以不受影响。 */
  'shoulderKey', 'liquidCooling', 'boost', 'motionComfort',
  /* 收尾三个固定为 快速分享 / 扫一扫 / 钱包 —— 所有默认布局统一（Ricky 2026-09-08）。
     注意要放在机型独占项之后，否则 GT 的液冷/肩键会插到末尾把它们挤掉。 */
  'cast', 'scan', 'calculator'
  /* 关机垫底已移除（Ricky 2026-09-20）。删掉它回到「加磁贴之前」的基线高度：
     note17 / gt17 恢复 9 行且不再进入溢出态（「空白处上滑关闭」随之回归），
     其余 5 个预设本来就在溢出态，只是末行少一格。
     同一把尺的实测记录留在 scripts/verify-cc-volume-plus.mjs 的 A 段。 */
  // 'jbl' 已下线：见上面 TOGGLES 里的 jbl 注释（两个地方要一起改）
]

const baseItems = [
  { id: 'wifi', type: 'widget', size: '2x1' },
  { id: 'data', type: 'widget', size: '2x1' },
  { id: 'mediaPlayer', type: 'widget', size: '2x2' },
  { id: 'mediaControls', type: 'widget', size: '2x2' },
  { id: 'joyConnect', type: 'widget', size: '2x1' },
  { id: 'joyHeart', type: 'widget', size: '2x1' },
  ...DEFAULT_TOGGLE_IDS.map((id) => {
    const t = TOGGLES.find((item) => item.id === id)
    return { id: t.id, type: 'toggle', size: t.defaultSize || '1x1' }
  })
].map((i) => {
  const [w, h] = i.size.split('x').map(Number)
  return { ...i, w, h }
})

/* HiOS 17 预设：完全自定义的磁贴清单 + 顺序，
   packLayout 按数组顺序紧凑填入 4 列网格，逐行复刻截图里的排版：
   第 1-2 行：媒体卡(2x2) + 数据卡(2x1) + Wi-Fi 胶囊(2x1)
   第 3 行  ：飞行(1x1) + 蓝牙(1x1) + 亮度音量滑块(2x2)
   第 4 行  ：热点胶囊(2x1) + 滑块续 + 滑块续
   第 5 行  ：设备中心(2x1) + 响铃 2x1 展开(2x1)
   第 6-8 行：手电筒/定位/旋转锁/勿扰 / 省电/录屏/截屏/灯效 / 极速互传/快速分享/扫一扫/钱包
   tOS17 相对 tOS16 CAMON 的差异（Ricky 2026-09-08）：去掉 深色主题(darkMode) /
   红外遥控(autoRotate)，加回 tOS16 有而这里缺的 截屏(screenshot) / 灯效(boost)。
   收尾三个同样固定为 快速分享/扫一扫/钱包，与其它默认布局统一。 */
const HIOS17_ITEMS = [
  { id: 'mediaPlayer', type: 'widget', size: '2x2' },
  { id: 'data', type: 'widget', size: '2x1' },
  { id: 'wifi', type: 'widget', size: '2x1' },
  { id: 'airplane', type: 'toggle', size: '1x1' },
  { id: 'bluetooth', type: 'toggle', size: '1x1' },
  { id: 'mediaControls', type: 'widget', size: '2x2' },
  { id: 'hotspot', type: 'toggle', size: '2x1' },
  { id: 'joyConnect', type: 'widget', size: '2x1' },
  { id: 'sound', type: 'toggle', size: '2x1' },
  { id: 'flashlight', type: 'toggle', size: '1x1' },
  { id: 'location', type: 'toggle', size: '1x1' },
  { id: 'rotationLock', type: 'toggle', size: '1x1' },
  { id: 'dnd', type: 'toggle', size: '1x1' },
  { id: 'batterySaver', type: 'toggle', size: '1x1' },
  { id: 'screenRecord', type: 'toggle', size: '1x1' },
  { id: 'screenshot', type: 'toggle', size: '1x1' },
  { id: 'boost', type: 'toggle', size: '1x1' },
  { id: 'share', type: 'toggle', size: '1x1' },
  /* 收尾三个：与其它默认布局统一 */
  { id: 'cast', type: 'toggle', size: '1x1' },
  { id: 'scan', type: 'toggle', size: '1x1' },
  { id: 'calculator', type: 'toggle', size: '1x1' }
  /* 关机磁贴已下线（Ricky 2026-09-20）。删掉这一格把 hios17 / ee1Camon 从
     10 行 + 溢出态退回 9 行、一屏放得下（「空白处上滑关闭」回归）。 */
].map((i) => {
  const [w, h] = i.size.split('x').map(Number)
  return { ...i, w, h }
})

/* EE1 布局（Ricky 2026-09-09）：在 HiOS 17 清单基础上只做两处改动 ——
   ① 热点从 2x1 胶囊改成 1x1 圆砖（占 r4c1）；
   ② 定位上移到热点旁边补上空位（r4c2），它原本的位置由后面的图标整体前移一格填满。
   用「派生」而不是再抄一份清单，避免两份清单以后各改各的对不上。
   VPN 仍由 LAYOUT_PRESETS 的 extra:['vpn'] 机制插到 快速分享 之前。 */
const EE1_ITEMS = (() => {
  const list = HIOS17_ITEMS.map((i) => ({ ...i }))
  const hotspot = list.find((i) => i.id === 'hotspot')
  if (hotspot) {
    hotspot.size = '1x1'
    hotspot.w = 1
    hotspot.h = 1
  }
  const locAt = list.findIndex((i) => i.id === 'location')
  if (locAt >= 0) {
    const [location] = list.splice(locAt, 1)
    const hsAt = list.findIndex((i) => i.id === 'hotspot')
    list.splice(hsAt + 1, 0, location)
  }
  return list
})()

/* 按当前「默认布局」机型过滤掉别家独有的磁贴：
   baseItems 是全量清单，PRESET_EXCLUSIVE_IDS 里的条目只有命中该机型的 only 才留下 */
const presetItems = computed(() => {
  const preset = LAYOUT_PRESETS.find((p) => p.id === control.layoutPreset) || LAYOUT_PRESETS[0]
  let items
  // HiOS 17 走完全自定义的磁贴清单（顺序与尺寸由 HIOS17_ITEMS 决定，
  //   packLayout 按数组顺序紧凑填入 4 列网格，恰好复刻截图里的排版）。
  //   EE1 的 CAMON 版用 layout:'ee1' 走 EE1_ITEMS（HiOS 清单 + 热点/定位微调）。
  if (preset.id === 'hios17' || preset.layout === 'hios17') {
    items = HIOS17_ITEMS
  } else if (preset.layout === 'ee1') {
    items = EE1_ITEMS
  } else {
    const only = new Set(preset.only)
    items = baseItems.filter((i) => !PRESET_EXCLUSIVE_IDS.includes(i.id) || only.has(i.id))
    // tOS17 系列在「基础布局」之上额外剔除指定开关（如 NOTE/GT 的 17 版去掉
    // 深色模式 / 红外遥控 / 晕动舒缓）。removed 缺省则不过滤。
    if (preset.removed && preset.removed.length) {
      const removed = new Set(preset.removed)
      items = items.filter((i) => !removed.has(i.id))
    }
  }
  // EE1 系列：在 快速分享(cast) 之前插入额外磁贴（VPN）。
  //   extra 是通用的，将来要插别的图标只改 LAYOUT_PRESETS 即可。
  if (preset.extra && preset.extra.length) {
    const at = items.findIndex((i) => i.id === 'cast')
    const insertAt = at < 0 ? items.length : at
    const extra = preset.extra.map((id) => {
      const size = (TOGGLES.find((t) => t.id === id) || {}).defaultSize || '1x1'
      const [w, h] = size.split('x').map(Number)
      return { id, type: 'toggle', size, w, h }
    })
    items = [...items.slice(0, insertAt), ...extra, ...items.slice(insertAt)]
  }
  return items
})

const layout = ref(packLayout(presetItems.value))

/* ================= 编辑模式与拖拽 ================= */

/* 编辑模式共享 controlStore（App.vue 控制台可同步切换） */
const editing = computed(() => control.editing)
const dragState = ref(null)       // { id, startR, startC, curR, curC }
const resizingId = ref(null)
const gridRef = ref(null)
const flipStore = { positions: null }

const dragOffset = { offsetX: 0, offsetY: 0, width: 0, height: 0 }
const pendingTarget = { r: null, c: null }
let hoverTimer = null

const displayLayout = computed(() => computeDisplayLayout(layout.value, dragState.value, control.dragMode))

// 显示布局变化 → FLIP 补间（含拖拽推演 / 落位 / 伸缩 resize 重排）
// flush 'post'：DOM 更新后同步 applyFlip（等同 React useLayoutEffect），
// 避免 'pre'+nextTick 在连续快速推演时回调被合并导致补间丢失。
// 不再跳过 resize：1x1→2x1 时 packLayout 会重排其它图标，需要位移动画；
// 被缩放卡片自身的宽度动画由 CSS width transition 承担，与 FLIP transform 不冲突。
watch(
  displayLayout,
  () => {
    applyFlip(gridRef.value, flipStore)
    checkOverflow()
  },
  { flush: 'post' }
)

function onDragStart(e, id) {
  if (!editing.value) { e.preventDefault(); return }
  markInteracting()
  const item = layout.value.find((i) => i.id === id)
  if (!item) return
  const rect = e.currentTarget.getBoundingClientRect()
  dragOffset.offsetX = e.clientX - rect.left
  dragOffset.offsetY = e.clientY - rect.top
  dragOffset.width = rect.width
  dragOffset.height = rect.height
  pendingTarget.r = item.r
  pendingTarget.c = item.c
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', id)
  // 延迟置拖拽态：浏览器先截取不透明幽灵图，防断联
  if (dragStartTimer) clearTimeout(dragStartTimer)
  dragStartTimer = setTimeout(() => {
    dragStartTimer = null
    dragState.value = { id, startR: item.r, startC: item.c, curR: item.r, curC: item.c }
  }, 0)
}

function onDragOver(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  if (!dragState.value || !gridRef.value) return

  const rect = gridRef.value.getBoundingClientRect()
  const centerX = e.clientX - dragOffset.offsetX + dragOffset.width / 2
  const centerY = e.clientY - dragOffset.offsetY + dragOffset.height / 2
  const x = centerX - rect.left
  const y = centerY - rect.top

  // 步距 = 格子 + 间距，随整体缩放变化，不能写死 76
  const pitch = control.cellPitch
  let c = Math.floor(x / pitch)
  let r = Math.floor(y / pitch)
  c = clamp(c, 0, 3)
  r = Math.max(0, r)

  const dragged = layout.value.find((i) => i.id === dragState.value.id)
  if (!dragged) return
  if (c + dragged.w > 4) c = 4 - dragged.w

  // 120ms 防抖停滞雷达：极速飞过时不错乱重排
  if (dragState.value.curR !== r || dragState.value.curC !== c) {
    if (pendingTarget.r !== r || pendingTarget.c !== c) {
      pendingTarget.r = r
      pendingTarget.c = c
      clearTimeout(hoverTimer)
      hoverTimer = setTimeout(() => {
        recordPositions(gridRef.value, flipStore)
        if (dragState.value) {
          dragState.value = { ...dragState.value, curR: r, curC: c }
        }
      }, 120)
    }
  } else {
    pendingTarget.r = r
    pendingTarget.c = c
    clearTimeout(hoverTimer)
  }
}

function onDrop(e) {
  e.preventDefault()
  markInteracting()
  if (dragState.value) {
    recordPositions(gridRef.value, flipStore)
    layout.value = displayLayout.value
    dragState.value = null
    clearTimeout(hoverTimer)
    if (dragStartTimer) { clearTimeout(dragStartTimer); dragStartTimer = null }
    // 落位后补一次 FLIP（覆盖 flow 吸附等推演与落位不一致的边缘情况）
    nextTick(() => applyFlip(gridRef.value, flipStore))
  }
}

function onDragEnd() {
  markInteracting()
  if (dragState.value) {
    recordPositions(gridRef.value, flipStore)
    dragState.value = null
    clearTimeout(hoverTimer)
    if (dragStartTimer) { clearTimeout(dragStartTimer); dragStartTimer = null }
    // 取消拖拽：布局回原位，displayLayout 引用不变 watch 不触发 → 手动补回位补间
    nextTick(() => applyFlip(gridRef.value, flipStore))
  }
}

function onRemove(id) {
  recordPositions(gridRef.value, flipStore)
  const filtered = layout.value.filter((i) => i.id !== id)
  // flow 模式：紧凑吸附；swap 模式：保留空位
  layout.value = control.dragMode === 'flow' ? packLayout(filtered) : filtered
}

function resetLayout() {
  recordPositions(gridRef.value, flipStore)
  layout.value = packLayout(presetItems.value)
}

/* 控制台切换默认布局：先记下旧位置，重排后由 FLIP 补间把磁贴平移过去 */
watch(presetItems, (items) => {
  recordPositions(gridRef.value, flipStore)
  layout.value = packLayout(items)
})

/* ---- 伸缩手柄：1x1 ↔ 2x1（仅 toggle） ---- */

let resizeState = null

function onResizeStart(e, id) {
  markInteracting()
  const item = layout.value.find((i) => i.id === id)
  if (!item || item.type !== 'toggle') return
  resizeState = {
    id,
    startX: e.clientX,
    initialSize: item.size,
    snapSize: item.size,
    delta: 0
  }
  resizingId.value = id
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', onResizeEnd, { once: true })
}

function onResizeMove(e) {
  if (!resizeState) return
  const deltaX = e.clientX - resizeState.startX
  // 一整格的距离（格子 + 间距）与判定阈值都随整体缩放走
  const pitch = control.cellPitch
  const THRESH = pitch / 2
  if (resizeState.initialSize === '1x1') {
    resizeState.delta = clamp(deltaX, 0, pitch)
    const want = resizeState.delta > THRESH ? '2x1' : '1x1'
    if (want !== resizeState.snapSize) {
      resizeState.snapSize = want
      recordPositions(gridRef.value, flipStore)
      const [w, h] = want.split('x').map(Number)
      layout.value = packLayout(layout.value.map((t) =>
        t.id === resizeState.id ? { ...t, size: want, w, h } : t
      ))
    }
  } else {
    resizeState.delta = clamp(deltaX, -pitch, 0)
    const want = resizeState.delta < -THRESH ? '1x1' : '2x1'
    if (want !== resizeState.snapSize) {
      resizeState.snapSize = want
      recordPositions(gridRef.value, flipStore)
      const [w, h] = want.split('x').map(Number)
      layout.value = packLayout(layout.value.map((t) =>
        t.id === resizeState.id ? { ...t, size: want, w, h } : t
      ))
    }
  }
}

function onResizeEnd() {
  markInteracting()
  window.removeEventListener('pointermove', onResizeMove)
  if (resizeState && Math.abs(resizeState.delta) < 5) {
    const want = resizeState.initialSize === '1x1' ? '2x1' : '1x1'
    recordPositions(gridRef.value, flipStore)
    const [w, h] = want.split('x').map(Number)
    layout.value = packLayout(layout.value.map((t) =>
      t.id === resizeState.id ? { ...t, size: want, w, h } : t
    ))
  }
  resizingId.value = null
  resizeState = null
}

/* ================= 开关激活 ================= */

function onActivate(id) {
  /* 原「关机」磁贴分支已移除（Ricky 2026-09-20）。电源菜单改由「长按实体电源键」
     进入，路径与本分支原本的写法完全一致（openPowerMenu + 让 CC 走
     requestCloseOverlay 的动画收起），实现在 src/components/phone/PhoneFrame.vue
     的 startPowerHold。
     下面这两个 computed / watch 守卫**保留**：只要 powerMenuOpen 还可能为真，
     CC 背板就不能在菜单上层透出底下的桌面 ——
       · powerTransition（本文件上方）：菜单开着时把 CC 内容钉在 opacity 1；
       · status watch：CC 被重新拉开时 closePowerMenu()，免得 CC 内容被钉死。 */
  if (id === 'camera') {
    system.closeOverlay('controlCenter')
    system.openApp('camera')
    return
  }
  if (id === 'calculator') {
    system.closeOverlay('controlCenter')
    system.openApp('calculator')
    return
  }
  if (id === 'screenRecord') {
    // 录屏期间再次点击 = 停止并保存（MP4，不带壳、不裁圆角、不转码）
    void toggleScreenRecord()
    return
  }
  if (id === 'screenshot') {
    void takeScreenshot()
    return
  }
  if (id === 'sound') return // 由 GridButton 内部 cycleSoundMode 处理
  control.toggle(id)
}

/* ================= 录屏 / 截图（复用控制台同一套能力） ================= */

const capture = useCapture()

/** 等控制中心收起动画播完（status 由 closing → closed），避免把收起过程录进去 */
function waitOverlayClosed(timeout = 800) {
  return new Promise((resolve) => {
    const cc = system.overlays.controlCenter
    if (!cc || cc.status === 'closed') {
      resolve()
      return
    }
    const started = Date.now()
    const tick = () => {
      if (!system.overlays.controlCenter || system.overlays.controlCenter.status === 'closed' || Date.now() - started > timeout) {
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

/** 收起动画结束后再补一帧，确保画面已经重绘 */
function nextPaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
}

/* 关键：收起控制中心是同步调用，紧接着（同一 tick）就发起采集。
   getDisplayMedia 依赖浏览器「用户手势」，中间不能插 await，
   否则部分浏览器会直接静默拒绝 —— 表现就是点了完全没反应。 */
async function toggleScreenRecord() {
  if (capture.isRecording.value) {
    capture.stopRecording()
    return
  }
  system.requestCloseOverlay('controlCenter')
  // 不带金属外壳、不做圆角裁切、直出 MP4 不转码
  await capture.startRecording({
    withFrame: false,
    rounded: false,
    transcode: false,
    preferMp4: true,
    beforeStart: async () => {
      await waitOverlayClosed()
      await nextPaint()
    }
  })
}

async function takeScreenshot() {
  control.setFlag('screenshot', true)
  system.requestCloseOverlay('controlCenter')
  await capture.captureScreenshot({
    withFrame: false,
    beforeGrab: async () => {
      await waitOverlayClosed()
      await nextPaint()
    }
  })
  control.setFlag('screenshot', false)
}

/* 控制中心「录屏」按钮的高亮必须跟随真实录制状态：
   从控制台开始/停止录屏时，按钮也要同步点亮/熄灭 */
watch(
  () => capture.isRecording.value,
  (v) => control.setFlag('screenRecord', v),
  { immediate: true }
)

/* ================= 竖向滑块（亮度/音量） ================= */

/* 滑块拖拽的 window 监听句柄提升到组件作用域，卸载时可精确摘除 */
let sliderMoveHandler = null
let sliderUpHandler = null

function sliderPointer(e, key) {
  if (editing.value) return
  e.stopPropagation()
  const track = e.currentTarget
  const setFromEvent = (ev) => {
    const r = track.getBoundingClientRect()
    const ratio = clamp((r.bottom - ev.clientY) / r.height, 0, 1)
    if (key === 'brightness') control.setBrightness(Math.max(0.25, ratio))
    else control.setVolume(ratio)
  }
  setFromEvent(e)

  // 上一次拖拽若未正常结束（多指 / 组件被切走），先摘掉残留监听
  if (sliderMoveHandler) window.removeEventListener('pointermove', sliderMoveHandler)
  if (sliderUpHandler) window.removeEventListener('pointerup', sliderUpHandler)

  sliderMoveHandler = (ev) => setFromEvent(ev)
  sliderUpHandler = () => {
    window.removeEventListener('pointermove', sliderMoveHandler)
    sliderMoveHandler = null
    sliderUpHandler = null
  }
  window.addEventListener('pointermove', sliderMoveHandler)
  window.addEventListener('pointerup', sliderUpHandler, { once: true })
}

/* ---- 音量条：拖动调音量 + 按住 500ms 展开全屏面板 ---- */

/* 长按判定：位移不超过这个像素数才算「按住不动」（与拖动共用一次 pointer 序列）。
   7px 取的是「手指/鼠标按住时的自然抖动上界」：再小会把静止长按误判成拖动，
   再大会让「想微调音量却拖不动」的手感变钝。 */
const VOLUME_LONG_PRESS_SLOP = 7
/** 起手到展开的等待时间。500ms 是长按的通用阈值（Android long press / HIG 同值）。 */
const VOLUME_LONG_PRESS_MS = 500

/* ⚠️ 不复用上面亮度那条的 sliderMoveHandler/sliderUpHandler：
   长按期间整段没有 pointermove，两套语义（「按住不动」vs「跟手拖动」）互斥，
   共用句柄会让后一次交互把前一次的监听摘掉。所以这里是一套独立句柄，
   并在 onBeforeUnmount 里通过 clearVolumeSliderGestures() 一并摘除。 */
let volumeSliderMoveHandler = null
let volumeSliderUpHandler = null
let volumeSliderTimer = null

function clearVolumeSliderGestures() {
  if (volumeSliderTimer) {
    clearTimeout(volumeSliderTimer)
    volumeSliderTimer = null
  }
  if (volumeSliderMoveHandler) {
    window.removeEventListener('pointermove', volumeSliderMoveHandler)
    volumeSliderMoveHandler = null
  }
  if (volumeSliderUpHandler) {
    window.removeEventListener('pointerup', volumeSliderUpHandler)
    window.removeEventListener('pointercancel', volumeSliderUpHandler)
    volumeSliderUpHandler = null
  }
}

function volumeSliderPointer(e) {
  if (editing.value) return
  e.stopPropagation()
  const track = e.currentTarget
  const startY = e.clientY
  let moved = false
  let longPressed = false

  const setFromEvent = (ev) => {
    const r = track.getBoundingClientRect()
    control.setVolume(clamp((r.bottom - ev.clientY) / r.height, 0, 1))
  }

  // 上一次拖拽若未正常结束（多指 / 组件被切走），先摘掉残留监听与残留定时器
  clearVolumeSliderGestures()

  volumeSliderMoveHandler = (ev) => {
    if (Math.abs(ev.clientY - startY) > VOLUME_LONG_PRESS_SLOP) moved = true
    if (!moved) return
    // 确认为拖动后立刻撤销长按；setVolume 内部会把 Plus 档清零（volumePlus.test.js 有断言）
    if (volumeSliderTimer) {
      clearTimeout(volumeSliderTimer)
      volumeSliderTimer = null
    }
    setFromEvent(ev)
  }

  volumeSliderUpHandler = (ev) => {
    // pointercancel = 手势被系统/滚动抢走，不是用户有意定位，绝不能当作单击落音量
    const wasTap = ev.type === 'pointerup' && !moved && !longPressed
    clearVolumeSliderGestures()
    /* 单击 = 直接跳到该位置的音量（亮度条一直是这个行为，音量条此前也是）。
       快照的原版把 setFromEvent 只挂在 move 上，等于顺手砍掉了「点哪到哪」；
       这里补回来 —— 长按已经在上面的 timer 里分流，两者不冲突。 */
    if (wasTap) setFromEvent(ev)
  }

  volumeSliderTimer = window.setTimeout(() => {
    if (moved) return
    longPressed = true
    volumeSliderTimer = null
    // 按住不动满 500ms：以音量条当前渲染矩形为锚点展开全屏面板
    openVolumePanel(track)
    clearVolumeSliderGestures()
  }, VOLUME_LONG_PRESS_MS)

  window.addEventListener('pointermove', volumeSliderMoveHandler)
  window.addEventListener('pointerup', volumeSliderUpHandler)
  window.addEventListener('pointercancel', volumeSliderUpHandler)
}

/** 把音量条的真实渲染矩形交给面板，供其做「从条原位长大」的锚点动画。
 *  取的是 getBoundingClientRect 的**合成后**尺寸 —— CC 本身有 translateY 变换，
 *  面板展开时 CC 已经收起，所以面板侧会用屏幕坐标系直接用这个矩形。 */
function openVolumePanel(track) {
  const r = track?.getBoundingClientRect?.()
  control.openVolumePanel(r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null)
}

/* ================= 其他 ================= */

const brightnessPct = computed(() => control.brightness * 100)

/* Plus 档（音量已到顶后继续按音量键）在 CC 上表现为三件事同时发生：
   条子填充铺满 100%、顶部叠一层琥珀渐变、条内显示档位数字（200 / 300 / 500）。
   注意 fill 恒为 100% 而数字用 `档位×100`，两者不是同一个量，
   所以这里是两个 computed，不要合并。 */
const volumePct = computed(() => (control.volumePlusLevel ? 100 : control.volume * 100))
const volumeDisplayPct = computed(() =>
  control.volumePlusLevel ? control.volumePlusLevel * 100 : Math.round(control.volume * 100)
)
const volumePlusActive = computed(() => control.volumePlusLevel > 0)
/* 静音态换成带斜杠的 volumeX —— 只在非 Plus 态判 0，Plus 档一定是满音量 */
const volumeIconName = computed(() =>
  control.volume === 0 && !volumePlusActive.value ? 'volumeX' : 'volume2'
)

function cellStyle(item) {
  return {
    gridRow: `${item.r + 1} / span ${item.h}`,
    gridColumn: `${item.c + 1} / span ${item.w}`,
    zIndex: resizingId.value === item.id ? 40 : (dragState.value?.id === item.id ? 50 : 10),
    opacity: dragState.value?.id === item.id ? 0 : 1,
    pointerEvents: dragState.value?.id === item.id ? 'none' : 'auto'
  }
}

/** 伸缩中的实时宽度：1x1 = 一格，2x1 = 两格 + 一个间距 */
function toggleWidth(item) {
  const one = control.cellSize
  const two = control.cellSize * 2 + control.gridGap
  const base = item.size === '2x1' ? two : one
  if (resizingId.value === item.id && resizeState) {
    return (resizeState.initialSize === '2x1' ? two : one) + resizeState.delta
  }
  return base
}

function openSettings() {
  system.closeOverlay('controlCenter')
  system.openApp('settings')
}

function onHeaderBtnClick(target) {
  if (control.fineTuningMode) {
    control.selectTarget(target, 'icon')
    return
  }
  if (target === 'headerEdit') {
    control.setEditing(true)
  } else if (target === 'headerSettings') {
    openSettings()
  }
}

function onMediaCastClick(e) {
  if (control.fineTuningMode) {
    e.preventDefault()
    control.selectTarget('mediaCast', 'icon')
    return
  }
  if (!editing.value) {
    control.toggle('cast')
  }
}

const glassRing = computed(() =>
  editing.value
    ? 'inset 0 0 0 1px rgba(255,255,255,0.4)'
    : 'inset 0 0 0 1px rgba(255,255,255,0.2)'
)
</script>

<template>
  <div ref="rootRef" class="control-center" :style="[layerStyle, gridVars]" @click="onCcClick" @pointerdown="onCcPointerDown">
    <!-- 动态高斯模糊与材质混色底 -->
    <MaterialBlur />

    <!-- 全局控制中心渐变滤镜定义 -->
    <svg width="0" height="0" style="position: absolute; pointer-events: none">
      <defs>
        <linearGradient id="paint0_linear_2860_1301" x1="17.5" y1="0" x2="16.9972" y2="61.7832" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.8"/>
          <stop offset="0.3" stop-color="white" stop-opacity="0.2"/>
          <stop offset="0.7" stop-color="white" stop-opacity="0.2"/>
          <stop offset="1" stop-color="white" stop-opacity="0.5"/>
        </linearGradient>
        <linearGradient id="paint0_linear_331_95718" x1="38.9516" y1="0" x2="38.7257" y2="61.7864" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.8"/>
          <stop offset="0.3" stop-color="white" stop-opacity="0.2"/>
          <stop offset="0.7" stop-color="white" stop-opacity="0.2"/>
          <stop offset="1" stop-color="white" stop-opacity="0.5"/>
        </linearGradient>
        <linearGradient id="paint0_linear_2865_138" x1="17.5" y1="0" x2="16.9972" y2="137.783" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.8"/>
          <stop offset="0.3" stop-color="white" stop-opacity="0.2"/>
          <stop offset="0.7" stop-color="white" stop-opacity="0.2"/>
          <stop offset="1" stop-color="white" stop-opacity="0.5"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- 内容层：顶部固定区 + 网格滚动区（入场动画作用于整层，二者同步淡入/位移） -->
    <div class="cc-content" :style="contentStyle">
      <!-- 顶部固定区：状态栏（运营商/信号/电池）+ 编辑/设置按钮位置固定。
           内容溢出滚动时裁切线固定在状态栏下方，网格不会把它们带走 -->
      <div class="cc-fixed-top">
      <!-- 头部：常规模式 (编辑 / 设置) -->
      <div v-if="!editing" class="cc-header">
        <button
          class="cc-header-btn"
          :class="{
            'ft-selectable': control.fineTuningMode,
            'ft-selected': control.fineTuningMode && control.selectedTarget === 'headerEdit'
          }"
          :style="{
            width: control.getBgSize('headerEdit') + 'px',
            height: control.getBgSize('headerEdit') + 'px',
            minWidth: control.getBgSize('headerEdit') + 'px',
            minHeight: control.getBgSize('headerEdit') + 'px',
            flex: `0 0 ${control.getBgSize('headerEdit')}px`
          }"
          @click.stop="onHeaderBtnClick('headerEdit')"
          :title="i18n.t('edit')"
        >
          <LIcon name="headerEdit" :size="control.getIconSize('headerEdit')" />
        </button>
        <div class="cc-header-camera-spacer"></div>
        <button
          class="cc-header-btn"
          :class="{
            'ft-selectable': control.fineTuningMode,
            'ft-selected': control.fineTuningMode && control.selectedTarget === 'headerSettings'
          }"
          :style="{
            width: control.getBgSize('headerSettings') + 'px',
            height: control.getBgSize('headerSettings') + 'px',
            minWidth: control.getBgSize('headerSettings') + 'px',
            minHeight: control.getBgSize('headerSettings') + 'px',
            flex: `0 0 ${control.getBgSize('headerSettings')}px`
          }"
          @click.stop="onHeaderBtnClick('headerSettings')"
          :title="i18n.t('settings')"
        >
          <LIcon name="headerSettings" :size="control.getIconSize('headerSettings')" />
        </button>
      </div>

      <!-- 头部：编辑模式顶栏 (设计稿原生矢量 360x56) -->
      <div v-else class="cc-header-edit-bar">
        <svg class="cc-header-edit-svg" width="360" height="56" viewBox="0 0 360 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 左侧：重置 Plus 按钮 -->
          <g class="cc-header-svg-btn" @click.stop="resetLayout" role="button" :title="i18n.t('reset')">
            <rect x="35.5" y="6.5" width="43" height="43" rx="21.5" fill="white" fill-opacity="0.15" style="mix-blend-mode:overlay"/>
            <rect x="35.5" y="6.5" width="43" height="43" rx="21.5" fill="white" fill-opacity="0.05" style="mix-blend-mode:lighten"/>
            <rect x="35.5" y="6.5" width="43" height="43" rx="21.5" stroke="url(#paint0_linear_0_1)" style="mix-blend-mode:plus-lighter"/>
            <path d="M57 6.5C68.8741 6.5 78.5 16.1259 78.5 28C78.5 39.8741 68.8741 49.5 57 49.5C45.1259 49.5 35.5 39.8741 35.5 28C35.5 16.1259 45.1259 6.5 57 6.5Z" stroke="url(#paint1_linear_0_1)" style="mix-blend-mode:plus-lighter"/>
            <path d="M57 6.5C68.8741 6.5 78.5 16.1259 78.5 28C78.5 39.8741 68.8741 49.5 57 49.5C45.1259 49.5 35.5 39.8741 35.5 28C35.5 16.1259 45.1259 6.5 57 6.5Z" stroke="url(#paint2_linear_0_1)" style="mix-blend-mode:plus-lighter"/>
            <path d="M57 18.5859C57.25 18.5859 57.4609 18.6797 57.6328 18.8672C57.8203 19.0391 57.9141 19.25 57.9141 19.5V27.5859H66C66.25 27.5859 66.4609 27.6797 66.6328 27.8672C66.8203 28.0391 66.9141 28.25 66.9141 28.5C66.9141 28.75 66.8203 28.9688 66.6328 29.1562C66.4609 29.3281 66.25 29.4141 66 29.4141H57.9141V37.5C57.9141 37.75 57.8203 37.9688 57.6328 38.1562C57.4609 38.3281 57.25 38.4141 57 38.4141C56.75 38.4141 56.5312 38.3281 56.3438 38.1562C56.1719 37.9688 56.0859 37.75 56.0859 37.5V29.4141H48C47.75 29.4141 47.5312 29.3281 47.3438 29.1562C47.1719 28.9688 47.0859 28.75 47.0859 28.5C47.0859 28.25 47.1719 28.0391 47.3438 27.8672C47.5312 27.6797 47.75 27.5859 48 27.5859H56.0859V19.5C56.0859 19.25 56.1719 19.0391 56.3438 18.8672C56.5312 18.6797 56.75 18.5859 57 18.5859Z" fill="white"/>
          </g>

          <!-- 右侧：胶囊容器底板 -->
          <g>
            <rect x="221.5" y="6.5" width="103" height="43" rx="21.5" fill="white" fill-opacity="0.15" style="mix-blend-mode:overlay"/>
            <rect x="221.5" y="6.5" width="103" height="43" rx="21.5" fill="white" fill-opacity="0.05" style="mix-blend-mode:lighten"/>
            <rect x="221.5" y="6.5" width="103" height="43" rx="21.5" stroke="url(#paint3_linear_0_1)" style="mix-blend-mode:plus-lighter"/>
            <path d="M243 6.5H303C314.874 6.5 324.5 16.1259 324.5 28C324.5 39.8741 314.874 49.5 303 49.5H243C231.126 49.5 221.5 39.8741 221.5 28C221.5 16.1259 231.126 6.5 243 6.5Z" stroke="url(#paint4_linear_0_1)" style="mix-blend-mode:plus-lighter"/>
            <path d="M243 6.5H303C314.874 6.5 324.5 16.1259 324.5 28C324.5 39.8741 314.874 49.5 303 49.5H243C231.126 49.5 221.5 39.8741 221.5 28C221.5 16.1259 231.126 6.5 243 6.5Z" stroke="url(#paint5_linear_0_1)" style="mix-blend-mode:plus-lighter"/>
          </g>

          <!-- 右侧：设置/滑块微调按钮 (左半胶囊) -->
          <g
            class="cc-header-svg-btn"
            :class="{ active: control.fineTuningMode }"
            @click.stop="control.setFineTuningMode(!control.fineTuningMode)"
            role="button"
            :title="i18n.t('fineTuneTitle')"
          >
            <rect x="221.5" y="6.5" width="51.5" height="43" rx="21.5" fill="transparent" />
            <path d="M248.511 22.7C248.423 22.969 248.375 23.2521 248.375 23.5447C248.375 23.8377 248.424 24.1211 248.512 24.3904H240.47C240.003 24.3903 239.625 24.0113 239.625 23.5447C239.625 23.0783 240.003 22.7002 240.47 22.7H248.511ZM257.53 22.7C257.997 22.7002 258.375 23.0783 258.375 23.5447C258.375 24.0113 257.997 24.3903 257.53 24.3904H255.738C255.826 24.1211 255.875 23.8377 255.875 23.5447C255.875 23.2521 255.827 22.969 255.739 22.7H257.53Z" fill="white"/>
            <path d="M255.075 23.55C255.075 21.9207 253.754 20.5998 252.125 20.5998C250.496 20.5998 249.175 21.9207 249.175 23.55C249.175 25.1792 250.496 26.5002 252.125 26.5002C253.754 26.5002 255.075 25.1792 255.075 23.55ZM256.675 23.55C256.675 26.0629 254.638 28.0998 252.125 28.0998C249.612 28.0998 247.575 26.0629 247.575 23.55C247.575 21.0371 249.612 19.0002 252.125 19.0002C254.638 19.0002 256.675 21.0371 256.675 23.55Z" fill="white"/>
            <path d="M248.825 32.45C248.825 30.8208 247.504 29.4998 245.875 29.4998C244.246 29.4998 242.925 30.8208 242.925 32.45C242.925 34.0793 244.246 35.4002 245.875 35.4002C247.504 35.4002 248.825 34.0793 248.825 32.45ZM250.425 32.45C250.425 34.9629 248.388 36.9998 245.875 36.9998C243.362 36.9998 241.325 34.9629 241.325 32.45C241.325 29.9371 243.362 27.9002 245.875 27.9002C248.388 27.9002 250.425 29.9371 250.425 32.45Z" fill="white"/>
            <path d="M242.261 31.6003C242.173 31.9186 242.125 32.254 242.125 32.6003C242.125 32.8359 242.148 33.0662 242.189 33.2897H240.47C240.003 33.2896 239.625 32.9116 239.625 32.445C239.625 31.9784 240.003 31.6004 240.47 31.6003H242.261ZM257.53 31.6003C257.997 31.6004 258.375 31.9784 258.375 32.445C258.375 32.9116 257.997 33.2896 257.53 33.2897H249.561C249.602 33.0662 249.625 32.8359 249.625 32.6003C249.625 32.254 249.577 31.9186 249.489 31.6003H257.53Z" fill="white"/>
          </g>

          <!-- 右侧：完成 Checkmark 按钮 (右半胶囊) -->
          <g
            class="cc-header-svg-btn"
            @click.stop="control.setEditing(false)"
            role="button"
            :title="i18n.t('done')"
          >
            <rect x="273" y="6.5" width="51.5" height="43" rx="21.5" fill="transparent" />
            <path d="M306.391 21.5156C306.594 21.3125 306.828 21.2109 307.094 21.2109C307.375 21.2109 307.617 21.3125 307.82 21.5156C308.008 21.7031 308.102 21.9375 308.102 22.2188C308.102 22.5 308.008 22.7344 307.82 22.9219L295.094 35.6484C294.641 36.1016 294.086 36.3281 293.43 36.3281C292.789 36.3281 292.242 36.1016 291.789 35.6484L285.648 29.5312C285.461 29.3281 285.367 29.0938 285.367 28.8281C285.367 28.5469 285.461 28.3047 285.648 28.1016C285.852 27.9141 286.086 27.8203 286.352 27.8203C286.633 27.8203 286.875 27.9141 287.078 28.1016L293.195 34.2422C293.258 34.3047 293.336 34.3359 293.43 34.3359C293.523 34.3359 293.602 34.3047 293.664 34.2422L306.391 21.5156Z" fill="white"/>
          </g>

          <defs>
            <linearGradient id="paint0_linear_0_1" x1="42.3333" y1="12.9667" x2="72.0333" y2="43.7667" gradientUnits="userSpaceOnUse">
              <stop stop-color="white" stop-opacity="0.2"/>
              <stop offset="0.5" stop-color="white" stop-opacity="0.05"/>
              <stop offset="1" stop-color="white" stop-opacity="0.2"/>
            </linearGradient>
            <linearGradient id="paint1_linear_0_1" x1="46.3548" y1="9.19355" x2="67.6452" y2="46.8064" gradientUnits="userSpaceOnUse">
              <stop stop-color="white" stop-opacity="0.05"/>
              <stop offset="0.5" stop-color="white" stop-opacity="0"/>
              <stop offset="1" stop-color="white" stop-opacity="0.05"/>
            </linearGradient>
            <linearGradient id="paint2_linear_0_1" x1="46.3551" y1="9.39345" x2="68" y2="46.8065" gradientUnits="userSpaceOnUse">
              <stop stop-color="white" stop-opacity="0.2"/>
              <stop offset="0.3" stop-color="white" stop-opacity="0"/>
              <stop offset="0.7" stop-color="white" stop-opacity="0"/>
              <stop offset="1" stop-color="white" stop-opacity="0.1"/>
            </linearGradient>
            <linearGradient id="paint3_linear_0_1" x1="238.333" y1="12.9667" x2="259.123" y2="63.9247" gradientUnits="userSpaceOnUse">
              <stop stop-color="white" stop-opacity="0.2"/>
              <stop offset="0.5" stop-color="white" stop-opacity="0.05"/>
              <stop offset="1" stop-color="white" stop-opacity="0.2"/>
            </linearGradient>
            <linearGradient id="paint4_linear_0_1" x1="247.839" y1="9.19355" x2="259.087" y2="56.1639" gradientUnits="userSpaceOnUse">
              <stop stop-color="white" stop-opacity="0.05"/>
              <stop offset="0.5" stop-color="white" stop-opacity="0"/>
              <stop offset="1" stop-color="white" stop-opacity="0.05"/>
            </linearGradient>
            <linearGradient id="paint5_linear_0_1" x1="247.839" y1="9.39345" x2="259.371" y2="56.5064" gradientUnits="userSpaceOnUse">
              <stop stop-color="white" stop-opacity="0.2"/>
              <stop offset="0.3" stop-color="white" stop-opacity="0"/>
              <stop offset="0.7" stop-color="white" stop-opacity="0"/>
              <stop offset="1" stop-color="white" stop-opacity="0.1"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <!-- 隐私指示器区域（固定高度，避免布局跳变） -->
      <div class="cc-privacy-area" :class="{ hidden: editing }">
        <div v-if="control.showPrivacyIndicators" class="cc-privacy-pill">
          <svg width="58" height="22" viewBox="0 0 58 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.439394" y="0.439394" width="57.1212" height="20.2121" rx="10.1061" fill="#14C764"/>
            <rect x="0.439394" y="0.439394" width="57.1212" height="20.2121" rx="10.1061" stroke="url(#paint0_linear_priv_pill)" style="mix-blend-mode:plus-lighter" stroke-width="0.878788"/>
            <rect x="0.439394" y="0.439394" width="57.1212" height="20.2121" rx="10.1061" stroke="url(#paint1_linear_priv_pill)" style="mix-blend-mode:plus-lighter" stroke-width="0.878788"/>
            <rect x="3.51514" y="3.51514" width="14.0606" height="14.0606" rx="7.0303" fill="#EBB800"/>
            <path d="M11.3236 6.91269C11.3663 6.91879 11.406 6.92185 11.4426 6.92185C11.4853 6.92185 11.528 6.92795 11.5708 6.94015C11.6135 6.95236 11.6532 6.96762 11.6898 6.98592C11.7325 6.99813 11.7752 7.01644 11.8179 7.04085C11.8484 7.06526 11.8789 7.08967 11.9095 7.11408C11.94 7.13849 11.9705 7.16595 12.001 7.19647L12.4862 7.68163C12.535 7.73045 12.5655 7.76097 12.5777 7.77317C12.596 7.78538 12.6082 7.79453 12.6143 7.80063C12.6204 7.80674 12.6265 7.81284 12.6326 7.81894C12.6448 7.81894 12.657 7.81894 12.6692 7.81894C12.6754 7.82504 12.6876 7.8281 12.7059 7.8281C12.7242 7.8281 12.7699 7.8281 12.8432 7.8281H12.9896C13.1178 7.8281 13.2337 7.8281 13.3375 7.8281C13.4412 7.8281 13.5358 7.83115 13.6213 7.83725C13.7067 7.84945 13.7891 7.86471 13.8684 7.88302C13.9478 7.89523 14.024 7.92269 14.0973 7.96541C14.2193 8.02033 14.3261 8.09661 14.4177 8.19426C14.5092 8.2858 14.5824 8.38954 14.6374 8.50549C14.6801 8.57873 14.7106 8.65501 14.7289 8.73435C14.7472 8.81368 14.7594 8.89912 14.7655 8.99066C14.7716 9.06999 14.7747 9.16153 14.7747 9.26528C14.7747 9.36903 14.7747 9.48498 14.7747 9.61313V12.4234C14.7747 12.5516 14.7747 12.6675 14.7747 12.7713C14.7747 12.875 14.7716 12.9666 14.7655 13.0459C14.7594 13.1313 14.7472 13.2168 14.7289 13.3022C14.7106 13.3815 14.6801 13.4578 14.6374 13.5311C14.5824 13.647 14.5092 13.7508 14.4177 13.8423C14.3261 13.9338 14.2193 14.0101 14.0973 14.0712C14.024 14.1078 13.9478 14.1352 13.8684 14.1535C13.7891 14.1718 13.7067 14.1841 13.6213 14.1902C13.5358 14.2024 13.4412 14.2085 13.3375 14.2085C13.2337 14.2085 13.1178 14.2085 12.9896 14.2085H8.10138C7.97323 14.2085 7.85727 14.2085 7.75353 14.2085C7.64978 14.2085 7.55519 14.2024 7.46975 14.1902C7.38432 14.1841 7.30193 14.1718 7.22259 14.1535C7.14326 14.1352 7.06698 14.1078 6.99374 14.0712C6.87169 14.0101 6.76489 13.9338 6.67335 13.8423C6.58181 13.7508 6.50858 13.647 6.45366 13.5311C6.41094 13.4578 6.38042 13.3815 6.36211 13.3022C6.34381 13.2168 6.3316 13.1313 6.3255 13.0459C6.3194 12.9666 6.31634 12.875 6.31634 12.7713C6.31634 12.6675 6.31634 12.5516 6.31634 12.4234V9.61313C6.31634 9.48498 6.31634 9.36903 6.31634 9.26528C6.31634 9.16153 6.3194 9.06999 6.3255 8.99066C6.3316 8.89912 6.34381 8.81368 6.36211 8.73435C6.38042 8.65501 6.40789 8.57873 6.4445 8.50549C6.50553 8.38954 6.58181 8.2858 6.67335 8.19426C6.76489 8.09661 6.87169 8.02033 6.99374 7.96541C7.06698 7.92269 7.14326 7.89523 7.22259 7.88302C7.30193 7.86471 7.38432 7.84945 7.46975 7.83725C7.55519 7.83115 7.64978 7.8281 7.75353 7.8281C7.85727 7.8281 7.97323 7.8281 8.10138 7.8281H8.24785C8.32108 7.8281 8.36685 7.8281 8.38516 7.8281C8.40347 7.8281 8.41567 7.82504 8.42177 7.81894C8.43398 7.81894 8.44313 7.81894 8.44924 7.81894C8.46144 7.81284 8.4706 7.80674 8.4767 7.80063C8.4828 7.79453 8.49195 7.78538 8.50416 7.77317C8.52247 7.76097 8.55603 7.73045 8.60485 7.68163L9.09002 7.19647C9.12053 7.16595 9.15105 7.13849 9.18156 7.11408C9.21207 7.08967 9.24259 7.06526 9.2731 7.04085C9.31582 7.01644 9.35549 6.99813 9.3921 6.98592C9.43482 6.96762 9.47754 6.95236 9.52026 6.94015C9.56298 6.92795 9.60265 6.92185 9.63926 6.92185C9.68198 6.92185 9.7247 6.91879 9.76742 6.91269H11.3236ZM10.5455 9.16459C10.2892 9.16459 10.0481 9.21341 9.82234 9.31105C9.59654 9.40869 9.3982 9.54295 9.22733 9.71383C9.06256 9.8786 8.93135 10.0739 8.83371 10.2997C8.73606 10.5194 8.68724 10.7574 8.68724 11.0137C8.68724 11.27 8.73606 11.5111 8.83371 11.7369C8.93135 11.9627 9.06256 12.161 9.22733 12.3319C9.3982 12.4967 9.59654 12.6279 9.82234 12.7255C10.0481 12.8232 10.2892 12.872 10.5455 12.872C10.8018 12.872 11.0429 12.8232 11.2687 12.7255C11.4945 12.6279 11.6898 12.4967 11.8545 12.3319C12.0254 12.161 12.1597 11.9627 12.2573 11.7369C12.355 11.5111 12.4038 11.27 12.4038 11.0137C12.4038 10.7574 12.355 10.5194 12.2573 10.2997C12.1597 10.0739 12.0254 9.8786 11.8545 9.71383C11.6898 9.54295 11.4945 9.40869 11.2687 9.31105C11.0429 9.21341 10.8018 9.16459 10.5455 9.16459ZM10.5455 9.75044C10.8934 9.75044 11.1924 9.87555 11.4426 10.1258C11.6928 10.3699 11.8179 10.6658 11.8179 11.0137C11.8179 11.3677 11.6928 11.6697 11.4426 11.92C11.1924 12.1641 10.8934 12.2861 10.5455 12.2861C10.1977 12.2861 9.89863 12.1641 9.64842 11.92C9.3982 11.6697 9.2731 11.3677 9.2731 11.0137C9.2731 10.6658 9.3982 10.3699 9.64842 10.1258C9.89863 9.87555 10.1977 9.75044 10.5455 9.75044ZM13.2185 8.80758C13.0903 8.80758 12.9805 8.85335 12.8889 8.94489C12.8035 9.03033 12.7608 9.13407 12.7608 9.25613C12.7608 9.38428 12.8035 9.49413 12.8889 9.58567C12.9805 9.67111 13.0903 9.71383 13.2185 9.71383C13.3405 9.71383 13.4443 9.67111 13.5297 9.58567C13.6213 9.49413 13.667 9.38428 13.667 9.25613C13.667 9.13407 13.6213 9.03033 13.5297 8.94489C13.4443 8.85335 13.3405 8.80758 13.2185 8.80758Z" fill="white"/>
            <rect x="21.9697" y="3.51514" width="14.0606" height="14.0606" rx="7.0303" fill="#FC5B4F"/>
            <path d="M31.8651 10.5652C31.9566 10.5652 32.0329 10.5957 32.0939 10.6567C32.1549 10.7177 32.1855 10.794 32.1855 10.8855C32.1855 11.3005 32.1122 11.6911 31.9658 12.0573C31.8193 12.4234 31.6179 12.7499 31.3616 13.0367C31.1053 13.3175 30.8032 13.5494 30.4553 13.7325C30.1014 13.9094 29.7261 14.0193 29.3294 14.062V14.9225C29.3294 15.014 29.2958 15.0903 29.2287 15.1513C29.1677 15.2185 29.0914 15.252 28.9999 15.252C28.9083 15.252 28.829 15.2185 28.7619 15.1513C28.7008 15.0903 28.6703 15.014 28.6703 14.9225V14.062C28.2736 14.0193 27.8983 13.9094 27.5444 13.7325C27.1965 13.5494 26.8944 13.3175 26.6381 13.0367C26.3818 12.7499 26.1804 12.4234 26.0339 12.0573C25.8875 11.6911 25.8143 11.3005 25.8143 10.8855C25.8143 10.794 25.8448 10.7177 25.9058 10.6567C25.9668 10.5957 26.0431 10.5652 26.1346 10.5652C26.2262 10.5652 26.3025 10.5957 26.3635 10.6567C26.4306 10.7177 26.4642 10.794 26.4642 10.8855C26.4642 11.2395 26.5283 11.569 26.6564 11.8742C26.7907 12.1854 26.9738 12.457 27.2057 12.6889C27.4376 12.9147 27.7061 13.0947 28.0112 13.229C28.3225 13.3632 28.652 13.4304 28.9999 13.4304C29.3477 13.4304 29.6773 13.3632 29.9885 13.229C30.2936 13.0947 30.5621 12.9147 30.794 12.6889C31.026 12.457 31.209 12.1854 31.3433 11.8742C31.4714 11.569 31.5355 11.2395 31.5355 10.8855C31.5355 10.794 31.566 10.7177 31.6271 10.6567C31.6942 10.5957 31.7735 10.5652 31.8651 10.5652ZM28.9999 6.84861C29.4576 6.84861 29.8542 7.00423 30.1899 7.31547C30.5255 7.62671 30.6934 8.00812 30.6934 8.45972V10.9679C30.6934 11.4195 30.5255 11.8009 30.1899 12.1122C29.8542 12.4234 29.4576 12.579 28.9999 12.579C28.5422 12.579 28.1455 12.4234 27.8098 12.1122C27.4742 11.8009 27.3064 11.4195 27.3064 10.9679V8.45972C27.3064 8.00812 27.4742 7.62671 27.8098 7.31547C28.1455 7.00423 28.5422 6.84861 28.9999 6.84861Z" fill="white"/>
            <rect x="40.4243" y="3.51514" width="14.0606" height="14.0606" rx="7.0303" fill="#1E76FE"/>
            <path d="M47.4547 6.9186C47.9307 6.9186 48.3792 7.00709 48.8003 7.18407C49.2153 7.36715 49.5784 7.61431 49.8897 7.92555C50.207 8.23678 50.4542 8.60295 50.6311 9.02403C50.8142 9.44512 50.9058 9.89367 50.9058 10.3697C50.9058 10.5711 50.8875 10.7694 50.8508 10.9647C50.8203 11.1539 50.7715 11.337 50.7044 11.5139C50.6433 11.7031 50.564 11.8831 50.4664 12.054C50.3687 12.2249 50.2589 12.3866 50.1368 12.5392C50.027 12.6734 49.8805 12.8443 49.6974 13.0518C49.5205 13.2654 49.3282 13.4912 49.1207 13.7292C48.9193 13.9611 48.7179 14.19 48.5166 14.4158C48.3152 14.6416 48.1382 14.8399 47.9856 15.0108C47.8453 15.1694 47.6683 15.2488 47.4547 15.2488C47.2411 15.2488 47.0641 15.1694 46.9238 15.0108C46.7712 14.8399 46.5942 14.6416 46.3928 14.4158C46.1914 14.19 45.987 13.9611 45.7795 13.7292C45.5781 13.4912 45.3889 13.2654 45.212 13.0518C45.0289 12.8443 44.8824 12.6734 44.7726 12.5392C44.6505 12.3866 44.5407 12.2249 44.443 12.054C44.3454 11.8831 44.266 11.7031 44.205 11.5139C44.1379 11.337 44.086 11.1539 44.0494 10.9647C44.0189 10.7694 44.0036 10.5711 44.0036 10.3697C44.0036 9.89367 44.0952 9.44512 44.2782 9.02403C44.4552 8.60295 44.6993 8.23678 45.0106 7.92555C45.3279 7.61431 45.6941 7.36715 46.109 7.18407C46.5301 7.00709 46.9787 6.9186 47.4547 6.9186ZM47.4547 8.99657C47.0763 8.99657 46.7529 9.13083 46.4844 9.39935C46.2219 9.66787 46.0907 9.99131 46.0907 10.3697C46.0907 10.748 46.2219 11.0715 46.4844 11.34C46.7529 11.6024 47.0763 11.7336 47.4547 11.7336C47.8331 11.7336 48.1534 11.6024 48.4159 11.34C48.6844 11.0715 48.8186 10.748 48.8186 10.3697C48.8186 9.99131 48.6844 9.66787 48.4159 9.39935C48.1534 9.13083 47.8331 8.99657 47.4547 8.99657Z" fill="white"/>
            <defs>
              <linearGradient id="paint0_linear_priv_pill" x1="9.10097" y1="1.71326e-05" x2="16.2266" y2="29.0932" gradientUnits="userSpaceOnUse">
                <stop offset="0.1" stop-color="white" stop-opacity="0.05"/>
                <stop offset="0.5" stop-color="white" stop-opacity="0"/>
                <stop offset="0.9" stop-color="white" stop-opacity="0.05"/>
              </linearGradient>
              <linearGradient id="paint1_linear_priv_pill" x1="28.4683" y1="1.71428e-05" x2="30.2826" y2="21.0261" gradientUnits="userSpaceOnUse">
                <stop stop-color="white" stop-opacity="0.2"/>
                <stop offset="0.160238" stop-color="white" stop-opacity="0.05"/>
                <stop offset="0.864863" stop-color="white" stop-opacity="0.05"/>
                <stop offset="1" stop-color="white" stop-opacity="0.1"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <!-- 状态行 (支持单卡一行 / 双卡两行) -->
      <div class="cc-status" :class="{ hidden: editing, 'is-dual': control.showDualSim }">
        <template v-if="!control.showDualSim">
          <div class="cc-status-row cc-status-single">
            <div class="cc-status-left">
              <StatusIcons color="#fff" :show-wifi="false" :show-signal="true" :show-battery="false" />
              <span class="cc-carrier">{{ i18n.ccLabel('carrier1') }}</span>
            </div>
            <div class="cc-status-right">
              <LIcon v-for="d in ccIndicators" :key="d.key" :name="d.icon" :size="d.size" :stroke-width="d.sw" class="cc-ind" :data-key="d.key" :data-prio="d.priority" />
              <StatusIcons color="#fff" :show-wifi="true" :show-signal="false" :show-battery="false" />
              <span class="cc-battery-pct">91%</span>
              <StatusIcons color="#fff" :show-wifi="false" :show-signal="false" :show-battery="true" />
            </div>
          </div>
        </template>
        <template v-else>
          <div class="cc-status-dual-rows">
            <!-- 第 1 行: 卡1 信号 + 中国电信 / 勿扰 + 热点 + Wi-Fi + 电量百分比 + 电池 -->
            <div class="cc-status-row">
              <div class="cc-status-left">
                <StatusIcons color="#fff" :show-wifi="false" :show-signal="true" :show-battery="false" />
                <span class="cc-carrier">{{ i18n.ccLabel('carrier1') }}</span>
              </div>
              <div class="cc-status-right">
                <LIcon v-for="d in ccDualRow1" :key="d.key" :name="d.icon" :size="d.size" :stroke-width="d.sw" class="cc-ind" :data-key="d.key" :data-prio="d.priority" />
                <StatusIcons color="#fff" :show-wifi="true" :show-signal="false" :show-battery="false" />
                <span class="cc-battery-pct">91%</span>
                <StatusIcons color="#fff" :show-wifi="false" :show-signal="false" :show-battery="true" />
              </div>
            </div>
            <!-- 第 2 行: 卡2 信号 + 中国移动 / 静音 + 振动 + 蓝牙 (与第1行均衡，避免一行塞满一行空) -->
            <div class="cc-status-row">
              <div class="cc-status-left">
                <StatusIcons color="#fff" :show-wifi="false" :show-signal="true" :show-battery="false" />
                <span class="cc-carrier">{{ i18n.ccLabel('carrier2') }}</span>
              </div>
              <div class="cc-status-right cc-status-sub-icons">
                <LIcon v-for="d in ccDualRow2" :key="d.key" :name="d.icon" :size="d.size" :stroke-width="d.sw" class="cc-ind" :data-key="d.key" :data-prio="d.priority" />
              </div>
            </div>
          </div>
        </template>
      </div>

      </div>

      <!-- 可滚动区：只有网格滚动，裁切线 = 顶部固定区下缘（状态栏下方） -->
      <div
        ref="scrollRef"
        class="cc-scroll"
        :class="{ 'has-overflow': hasOverflow, 'is-editing': editing }"
        :style="{
          overflowY: hasOverflow ? 'auto' : 'hidden',
          touchAction: hasOverflow ? 'pan-y' : 'none'
        }"
      >
      <!-- 网格 -->
      <div ref="gridRef" class="cc-grid" @dragover="onDragOver" @drop="onDrop">
        <div
          v-for="item in displayLayout"
          :key="item.id"
          class="cc-cell"
          :data-id="item.id"
          :style="cellStyle(item)"
          :draggable="editing && resizingId === null"
          @dragstart="onDragStart($event, item.id)"
          @dragend="onDragEnd"
        >
          <!-- Wi-Fi 胶囊 -->
          <div
            v-if="item.id === 'wifi'"
            class="cc-pill"
            :class="{
              'ft-selectable': control.fineTuningMode,
              'ft-selected': control.fineTuningMode && control.selectedTarget === 'wifi'
            }"
            @click="onPillClick($event, 'wifi')"
          >
            <svg class="cc-pill-bg-svg" width="100%" height="100%" viewBox="0 0 138 62" preserveAspectRatio="none" fill="none">
              <rect x="0.5" y="0.5" width="137" height="61" rx="30.5" fill="rgba(255, 255, 255, 0.04)" stroke="url(#paint0_linear_331_95718)" vector-effect="non-scaling-stroke" />
            </svg>
            <div
              class="cc-pill-icon"
              :style="{
                width: control.getBgSize('wifi') + 'px',
                height: control.getBgSize('wifi') + 'px',
                flex: '0 0 ' + control.getBgSize('wifi') + 'px',
                background: control.wifi ? '#258FFF' : 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                opacity: control.wifi ? 1 : 0.6
              }"
            >
              <LIcon name="wifi" :size="control.getIconSize('wifi')" />
            </div>
            <div class="cc-pill-text">
              <span class="cc-pill-title">Transsion</span>
              <span class="cc-pill-sub">{{ control.wifi ? 'Mobile' : i18n.t('turnOff') }}</span>
            </div>
          </div>

          <!-- 数据胶囊 -->
          <div
            v-else-if="item.id === 'data'"
            class="cc-pill"
            :class="{
              'ft-selectable': control.fineTuningMode,
              'ft-selected': control.fineTuningMode && control.selectedTarget === 'data'
            }"
            @click="onPillClick($event, 'data')"
          >
            <svg class="cc-pill-bg-svg" width="100%" height="100%" viewBox="0 0 138 62" preserveAspectRatio="none" fill="none">
              <rect x="0.5" y="0.5" width="137" height="61" rx="30.5" fill="rgba(255, 255, 255, 0.04)" stroke="url(#paint0_linear_331_95718)" vector-effect="non-scaling-stroke" />
            </svg>
            <div
              class="cc-pill-icon"
              :style="{
                width: control.getBgSize('data') + 'px',
                height: control.getBgSize('data') + 'px',
                flex: '0 0 ' + control.getBgSize('data') + 'px',
                background: control.cellular ? '#31C65A' : 'rgba(255,255,255,0.2)',
                color: '#fff',
                opacity: control.cellular ? 1 : 0.6
              }"
            >
              <LIcon name="arrowDownUp" :size="control.getIconSize('data')" />
            </div>
            <div class="cc-pill-text">
              <!-- 运营商名走 i18n（zh 中国电信 / en China Telecom / bn），别再硬编码 -->
              <span class="cc-pill-title">{{ i18n.ccLabel('carrier1') }}</span>
              <span class="cc-pill-sub">{{ control.cellular ? '102 MB' : i18n.t('turnOff') }}</span>
            </div>
          </div>

          <!-- 媒体播放器 (2x2 138x138) -->
          <div v-else-if="item.id === 'mediaPlayer'" class="cc-media">
            <svg class="cc-media-bg-svg" width="100%" height="100%" viewBox="0 0 138 138" fill="none">
              <rect x="0.5" y="0.5" width="137" height="137" rx="30.5" fill="rgba(255, 255, 255, 0.04)" stroke="url(#paint0_linear_2865_138)" vector-effect="non-scaling-stroke" />
            </svg>
            <div class="cc-media-top">
              <img :src="albumCover" alt="Album Cover" class="cc-media-cover" />
              <button
                class="cc-media-cast"
                :class="{
                  'ft-target-hover': control.fineTuningMode,
                  'ft-target-selected': control.fineTuningMode && control.selectedTarget === 'mediaCast'
                }"
                :style="{
                  width: `${control.getBgSize('mediaCast')}px`,
                  height: `${control.getBgSize('mediaCast')}px`,
                  borderRadius: `${control.getBgSize('mediaCast') / 2}px`
                }"
                @click.stop="onMediaCastClick"
              >
                <LIcon name="mediaCast" :size="control.getIconSize('mediaCast')" />
              </button>
            </div>
            <div class="cc-media-info">
              <div class="cc-media-title">Big Big World</div>
              <div class="cc-media-artist">Emilia</div>
            </div>
            <div class="cc-media-btns">
              <button class="cc-mc" @click.stop><LIcon name="skipBack" :size="16" :filled="true" /></button>
              <button class="cc-mc cc-mc-play" @click.stop="!editing && control.toggle('mediaPlaying')">
                <LIcon :name="control.mediaPlaying ? 'pause' : 'play'" :size="20" :filled="true" />
              </button>
              <button class="cc-mc" @click.stop><LIcon name="skipForward" :size="16" :filled="true" /></button>
            </div>
          </div>

          <!-- 亮度 / 音量竖滑块 (2x2 138x138) -->
          <div v-else-if="item.id === 'mediaControls'" class="cc-sliders">
            <div class="cc-vslider" @pointerdown="sliderPointer($event, 'brightness')">
              <svg class="cc-vslider-bg-svg" width="100%" height="100%" viewBox="0 0 62 138" preserveAspectRatio="none" fill="none">
                <rect x="0.5" y="0.5" width="61" height="137" rx="30.5" fill="rgba(255, 255, 255, 0.04)" stroke="url(#paint0_linear_2865_138)" vector-effect="non-scaling-stroke" />
              </svg>
              <div class="cc-vslider-fill" :style="{ height: brightnessPct + '%' }"></div>
              <div class="cc-vslider-icon">
                <LIcon name="sun" :size="26" />
              </div>
            </div>
            <div
              class="cc-vslider cc-volume-slider"
              :class="{
                'is-plus': volumePlusActive,
                'anchor-hidden': control.volumeAnchorHidden,
                'plus-200': control.volumePlusLevel === 2,
                'plus-300': control.volumePlusLevel === 3,
                'plus-500': control.volumePlusLevel === 5
              }"
              data-testid="volume-slider"
              tabindex="0"
              :aria-label="vLabel('sliderAria')"
              @pointerdown="volumeSliderPointer"
              @keydown.enter.prevent="openVolumePanel($event.currentTarget)"
            >
              <svg class="cc-vslider-bg-svg" width="100%" height="100%" viewBox="0 0 62 138" preserveAspectRatio="none" fill="none">
                <rect x="0.5" y="0.5" width="61" height="137" rx="30.5" fill="rgba(255, 255, 255, 0.04)" stroke="url(#paint0_linear_2865_138)" vector-effect="non-scaling-stroke" />
              </svg>
              <div class="cc-vslider-fill" :style="{ height: volumePct + '%' }"></div>
              <!-- Plus 态：琥珀渐变 + 档位数字（z-index 夹在 fill(1) 与描边 svg(2) 之间） -->
              <div v-if="volumePlusActive" class="cc-volume-plus-gradient" aria-hidden="true"></div>
              <div v-if="volumePlusActive" class="cc-volume-value" data-testid="volume-value">
                {{ volumeDisplayPct }}%
              </div>
              <div
                class="cc-vslider-icon"
                :class="{ cool: control.volume > 0.15 && !volumePlusActive, hot: volumePlusActive }"
                :data-muted="control.volume === 0 && !volumePlusActive"
                data-testid="control-volume-icon"
              >
                <LIcon :name="volumeIconName" :size="26" />
              </div>
            </div>
          </div>

          <!-- OneLeap (2x1) -->
          <div
            v-else-if="item.id === 'joyConnect'"
            class="cc-pill"
            :class="{
              'ft-selectable': control.fineTuningMode,
              'ft-selected': control.fineTuningMode && control.selectedTarget === 'oneLeap'
            }"
            @click="onPillClick($event, 'oneLeap')"
          >
            <svg class="cc-pill-bg-svg" width="100%" height="100%" viewBox="0 0 138 62" preserveAspectRatio="none" fill="none">
              <rect x="0.5" y="0.5" width="137" height="61" rx="30.5" fill="rgba(255, 255, 255, 0.04)" stroke="url(#paint0_linear_331_95718)" vector-effect="non-scaling-stroke" />
            </svg>
            <div
              class="cc-pill-icon"
              :style="{
                width: control.getBgSize('oneLeap') + 'px',
                height: control.getBgSize('oneLeap') + 'px',
                flex: '0 0 ' + control.getBgSize('oneLeap') + 'px',
                background: 'rgba(255, 255, 255, 0.16)'
              }"
            >
              <LIcon name="link2" :size="control.getIconSize('oneLeap')" />
            </div>
            <div class="cc-pill-text"><span class="cc-pill-title">{{ i18n.ccLabel('oneLeap') }}</span></div>
          </div>

          <!-- Health&SPO (2x1) -->
          <div
            v-else-if="item.id === 'joyHeart'"
            class="cc-pill"
            :class="{
              'ft-selectable': control.fineTuningMode,
              'ft-selected': control.fineTuningMode && control.selectedTarget === 'health'
            }"
            @click="onPillClick($event, 'health')"
          >
            <svg class="cc-pill-bg-svg" width="100%" height="100%" viewBox="0 0 138 62" preserveAspectRatio="none" fill="none">
              <rect x="0.5" y="0.5" width="137" height="61" rx="30.5" fill="rgba(255, 255, 255, 0.04)" stroke="url(#paint0_linear_331_95718)" vector-effect="non-scaling-stroke" />
            </svg>
            <div
              class="cc-pill-icon"
              :style="{
                width: control.getBgSize('health') + 'px',
                height: control.getBgSize('health') + 'px',
                flex: '0 0 ' + control.getBgSize('health') + 'px',
                background: 'rgba(255, 255, 255, 0.16)'
              }"
            >
              <LIcon name="heart" :size="control.getIconSize('health')" />
            </div>
            <div class="cc-pill-text"><span class="cc-pill-title">{{ i18n.ccLabel('health') }}</span></div>
          </div>

          <!-- 圆形开关 -->
          <GridButton
            v-else
            :item="TOGGLES.find((t) => t.id === item.id)"
            :editing="editing"
            :resizing="resizingId === item.id"
            :expanded="item.size === '2x1'"
            :computed-width="toggleWidth(item)"
            @activate="onActivate"
            @resize-start="onResizeStart"
            @remove="onRemove"
          />

          <!-- 编辑模式统一删除徽标（widget 类型，挂在 cell 级避免被容器 overflow 裁切） -->
          <div
            v-if="editing && item.type === 'widget'"
            class="cc-remove cc-remove-cell"
            @click.stop="onRemove(item.id)"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" fill="rgba(255, 255, 255, 0.24)" stroke="url(#cc_del_stroke)" stroke-width="1"/>
              <rect x="6.3335" y="11" width="11.3333" height="2.33333" rx="1.16667" fill="white"/>
              <defs>
                <linearGradient id="cc_del_stroke" x1="6" y1="3" x2="18" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stop-color="white" stop-opacity="0.95"/>
                  <stop offset="0.5" stop-color="white" stop-opacity="0.3"/>
                  <stop offset="1" stop-color="white" stop-opacity="0.75"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.control-center {
  position: absolute;
  inset: 0;
  z-index: var(--z-control-center);
  will-change: transform;
  color: #fff;
}

/* 内容层：顶部固定区 + 网格滚动区，纵向 flex 分割（入场动画作用于这一层） */
.cc-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* 顶部 18px：严格对齐效果图中顶部编辑/设置按钮与屏幕顶边的安全距离 */
  padding: 18px 0 0;
  will-change: transform, opacity;
}

/* 顶部固定区：状态栏 + 编辑/设置按钮。在滚动容器之外，
   溢出滚动时网格在它下缘被裁切，不会从它底下钻过去 */
.cc-fixed-top {
  flex: none;
  position: relative;
  z-index: 20;
}

.cc-scroll {
  position: relative;
  flex: 1 1 0;
  /* flex 子项默认 min-height:auto，不归零的话内容会把自己撑高而不是滚动 */
  min-height: 0;
  scrollbar-width: none;
  /* 底部留白 = 导航条预留高度。
     导航条现在全局可见且浮在控制中心之上（z 96 > 94），内容不留白就会压在横条下面。
     原本这里是 12px 的「离屏幕底留白」，与导航条预留是同一件事，所以是**取代**不是叠加 ——
     叠加会让 1.00 倍（底部仅剩 22px 余量）刚好顶到溢出临界线上。
     scrollHeight 自动包含这个留白，「是否溢出」也就等价于「先减去导航条高度再比」。
     注意：顶部固定区已移出滚动容器，溢出 =「网格高度 > (屏高 − 固定区 − 导航条预留)」，
     数学上与旧的整块滚动完全等价（差值两侧同时挪走了固定区高度）。
     顶部 7px = 状态栏与网格之间 14px 间距的一半，用于容纳画在元素外侧的微调选中框。 */
  padding: 7px 0 var(--home-indicator-inset);
}
.cc-scroll.is-editing {
  /* 编辑态原为 90px，同样把其中的 12px 基准换成导航条预留值，总高保持不变 */
  padding: 8px 0 calc(76px + var(--home-indicator-inset));
}
.cc-scroll.has-overflow {
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}
.cc-scroll:not(.has-overflow) {
  overflow-y: hidden;
  overscroll-behavior-y: none;
}
.cc-scroll::-webkit-scrollbar { display: none; }

/* 头部 */
.cc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: var(--cc-grid-w);
  margin: 0 auto;
  padding: 0;
  height: 30px;
  position: relative;
  z-index: 20;
  color: #fff;
}
.cc-header-camera-spacer {
  width: 16px;
  height: 16px;
  pointer-events: none;
}
.cc-header-btn {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border: none;
  padding: 0;
  cursor: pointer;
  position: relative;
  z-index: 20;
  overflow: visible;
  transition: transform 0.15s ease, opacity 0.15s ease;
  color: #fff;
}
.cc-header-btn:active {
  transform: scale(0.92);
  opacity: 0.8;
}
.cc-header-btn.ft-selectable {
  cursor: pointer;
}
.cc-header-btn.ft-selectable:hover {
  outline: 1.5px dashed rgba(37, 143, 255, 0.6);
  outline-offset: 1px;
}
.cc-header-btn.ft-selected {
  outline: var(--ft-select-width) solid var(--ft-select-color) !important;
  outline-offset: var(--ft-select-offset) !important;
  box-shadow: var(--ft-select-glow) !important;
}
.cc-edit-group {
  display: flex;
  align-items: center;
  height: 30px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  overflow: hidden;
  position: relative;
  z-index: 20;
}
.cc-group-btn {
  width: 32px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
}
.cc-group-btn:hover { background: rgba(255, 255, 255, 0.15); }
.cc-group-btn.active { background: #258fff; color: #fff; }
.cc-group-btn:active { transform: scale(0.92); opacity: 0.8; }
.cc-group-divider {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.2);
}

/* 编辑模式顶栏 */
.cc-header-edit-bar {
  width: 360px;
  height: 56px;
  margin: 0 auto 10px;
  position: relative;
  z-index: 20;
  display: flex;
  justify-content: center;
  align-items: center;
}
.cc-header-edit-svg {
  display: block;
  overflow: visible;
}
.cc-header-svg-btn {
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.cc-header-svg-btn:hover {
  opacity: 0.85;
}
.cc-header-svg-btn:active {
  transform: scale(0.96);
  transform-origin: center;
}
.cc-header-svg-btn.active path {
  fill: #70b4ff !important;
}

/* 隐私指示器区域 (参考设计图：位于打孔正下方，与顶部按钮及状态栏拉开约 35px 呼吸间距，上下对称居中) */
.cc-privacy-area {
  height: 22px;
  width: var(--cc-grid-w);
  margin: 7px auto 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.cc-privacy-area.hidden {
  opacity: 0;
  height: 0;
  margin: 0;
  overflow: hidden;
}
.cc-privacy-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  line-height: 0;
  pointer-events: auto;
  user-select: none;
  animation: ccPrivFadeIn 0.2s ease;
}
.cc-privacy-pill svg {
  display: block;
  flex-shrink: 0;
}
@keyframes ccPrivFadeIn {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}

.cc-status {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  width: var(--cc-grid-w);
  /* 下间距 14px 的一半（7px）让给滚动区做顶部内边距：
     裁切起始线因此上移到「状态栏与网格按钮间距的中点」，
     最顶排砖块被选中时，画在元素外侧的选中框才有地方显示，不会被切掉。 */
  margin: 0 auto 7px;
  padding: 0;
  height: 16px;
  color: rgba(255, 255, 255, 0.95);
  transition: opacity 0.3s ease, height 0.25s ease;
}
.cc-status.is-dual {
  height: 36px;
}
.cc-status.hidden {
  opacity: 0;
  height: 0;
  margin: 0;
  overflow: hidden;
  pointer-events: none;
}
.cc-status-dual-rows {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cc-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 16px;
  width: 100%;
}
.cc-status-sub-icons {
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0.88;
}
.cc-tag-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 11px;
  padding: 0 2.5px;
  font-size: 7.5px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.2px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  color: #fff;
  transform: scale(0.9);
  transform-origin: left center;
}
.cc-roam-r {
  font-size: 9px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  margin-right: -1px;
}
.cc-carrier-name {
  font: 500 11.5px/1 var(--font-stack);
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
}
.cc-net-speed {
  font: 600 7px/0.95 var(--font-stack);
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: -0.2px;
  margin-left: 2px;
  transform: scale(0.85);
  transform-origin: left center;
}
.cc-status-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.cc-vonr {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 13px;
  padding: 0 3px;
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.2px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  color: #fff;
}
.cc-carrier {
  font: 500 13px/1 var(--font-stack);
  color: rgba(255, 255, 255, 0.95);
}
.cc-status-right {
  display: flex;
  align-items: center;
  gap: 5px;
}
.cc-ind {
  flex: 0 0 auto;
  /* 与右侧 Wi-Fi/电量图标保持同色同高，视觉上属于同一状态行 */
  color: rgba(255, 255, 255, 0.95);
}
.cc-battery-pct {
  font: 600 13px/1 var(--font-stack);
  color: rgba(255, 255, 255, 0.95);
}

/* 网格：4 列，尺寸全部由 --cc-cell / --cc-gap 驱动（整体缩放时等比放大） */
.cc-grid {
  display: grid;
  grid-template-columns: repeat(4, var(--cc-cell));
  grid-auto-rows: var(--cc-cell);
  column-gap: var(--cc-gap);
  row-gap: var(--cc-gap);
  width: var(--cc-grid-w);
  margin: 0 auto;
  min-height: 500px;
  padding-bottom: 0;
}
.is-editing .cc-grid {
  padding-bottom: 30px;
}
.cc-cell {
  position: relative;
  display: flex;
  justify-content: flex-start;
  flex-shrink: 0;
  transition: opacity 0.2s ease;
}

/* 2x1 胶囊 */
.cc-pill {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: calc(var(--cc-cell) / 2);
  padding: 0 10px 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  cursor: pointer;
  overflow: hidden;
  transition: background 0.3s ease;
}
.cc-pill:hover { background: rgba(255, 255, 255, 0.22); }
.cc-pill.ft-selectable {
  cursor: pointer;
}
.cc-pill.ft-selectable:hover {
  outline: 1.5px dashed rgba(37, 143, 255, 0.6);
  outline-offset: 1px;
}
.cc-pill.ft-selected {
  outline: var(--ft-select-width) solid var(--ft-select-color) !important;
  outline-offset: var(--ft-select-offset) !important;
  box-shadow: var(--ft-select-glow) !important;
  z-index: 10 !important;
}
.cc-pill-bg-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
.cc-pill > *:not(.cc-pill-bg-svg) {
  position: relative;
  z-index: 1;
}
.cc-pill-icon {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-left: 0;
  transition: background 0.3s ease, opacity 0.3s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}
.cc-pill-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  pointer-events: none;
}
.cc-pill-title {
  font: 500 12px/1.2 var(--font-stack);
  letter-spacing: -0.2px;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cc-pill-sub {
  font: 400 11px/1.2 var(--font-stack);
  color: rgba(255, 255, 255, 0.65);
  margin-top: 2px;
}
.cc-heart-text {
  font: 400 10px/1.3 var(--font-stack);
  color: rgba(255, 255, 255, 0.8);
  gap: 2px;
}

/* 媒体播放器 (2x2 138x138) */
.cc-media {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: calc(var(--cc-cell) / 2);
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: radial-gradient(ellipse at 50% 100%, rgba(255, 113, 30, 0.45) 0%, rgba(255, 113, 30, 0.2) 35%, rgba(255, 113, 30, 0) 75%), rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  overflow: hidden;
}
.cc-media-bg-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
.cc-media > *:not(.cc-media-bg-svg) {
  position: relative;
  z-index: 1;
}
.cc-media-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.cc-media-cover {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
}
.cc-media-cast {
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  border: 0.5px solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}
.cc-media-cast:hover {
  background: rgba(255, 255, 255, 0.25);
}
.cc-media-info {
  display: flex;
  flex-direction: column;
  margin-top: 4px;
}
.cc-media-title {
  font: 600 13px/1.2 var(--font-stack);
  color: #fff;
  letter-spacing: 0.2px;
}
.cc-media-artist {
  font: 400 11px/1.2 var(--font-stack);
  color: rgba(255, 255, 255, 0.75);
  margin-top: 2px;
}
.cc-media-btns {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  margin-top: 4px;
}
.cc-mc {
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.2s ease;
}
.cc-mc:active {
  transform: scale(0.9);
}

/* 竖滑块 */
.cc-sliders {
  width: 100%;
  height: 100%;
  display: flex;
  gap: var(--cc-gap, 14px);
  position: relative;
}
.cc-vslider {
  flex: 1;
  border-radius: calc(var(--cc-cell) / 2);
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(30px) saturate(200%);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  touch-action: none;
}
.cc-vslider-bg-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}
.cc-vslider-fill {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  background: #fff;
  transition: height 0.1s ease-out;
  z-index: 1;
}
.cc-vslider-icon {
  position: absolute;
  bottom: 18px;
  left: 0; right: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 3;
}

/* ---- 音量条 Plus 态（2026-09-20 集成外部 volume-plus-mode 快照）---- */
/* 音量推满后继续按音量键 → 满格 + 琥珀渐变 + 档位数字（200/300/500），
   色阶逐级加深做「越推越热」的暗示。 */

/* 琥珀描边必须画在 ::after 而不是直接给 .cc-volume-slider 加 inset box-shadow：
   元素自身的背景/阴影是画在所有子元素**之下**的，Plus 态 fill 正好铺满 100%，
   直接写会被白 fill 整个盖掉。挂 ::after 并压到描边 svg 同层才露得出来。 */
.cc-volume-slider.is-plus::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;                 /* 与描边 svg 同层；::after 是最后一个子层，绘制在其上 */
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(255, 190, 92, 0.72);
  pointer-events: none;
}
/* 面板从这条条子上长大期间源条让位（VolumePanel 按同一矩形做展开动画） */
.cc-volume-slider.anchor-hidden {
  opacity: 0;
  transition: none;
}
.cc-volume-plus-gradient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* 夹在 fill(z-index 1) 与描边 svg(z-index 2) 之间：与 fill 同层靠 DOM 顺序
     取胜（渐变写在 svg 之后），于是盖住 fill 又压在玻璃轮廓下面。 */
  z-index: 1;
  transition: background 220ms ease;
}
.cc-volume-slider.plus-200 .cc-volume-plus-gradient {
  background: linear-gradient(to top, rgba(253, 186, 116, 0) 0%, rgba(253, 186, 116, 0.42) 52%, rgba(251, 146, 60, 1) 100%);
}
.cc-volume-slider.plus-300 .cc-volume-plus-gradient {
  background: linear-gradient(to top, rgba(251, 146, 60, 0) 0%, rgba(251, 146, 60, 0.5) 52%, rgba(249, 115, 22, 1) 100%);
}
.cc-volume-slider.plus-500 .cc-volume-plus-gradient {
  background: linear-gradient(to top, rgba(249, 115, 22, 0) 0%, rgba(234, 88, 12, 0.58) 52%, rgba(194, 65, 12, 1) 100%);
}
.cc-volume-value {
  position: absolute;
  left: 0;
  right: 0;
  top: 18px;
  z-index: 4;
  text-align: center;
  color: #fff7ed;
  font: 800 16px/1 var(--font-stack);
  letter-spacing: -0.3px;
  pointer-events: none;
}
/* Plus 态图标压深：fill 此刻是满格纯白，白图标会整个糊掉 */
.cc-vslider-icon.hot { color: #7c2d12; }

/* 删除徽标（widget 通用） */
.cc-remove {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  overflow: visible;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
  transition: transform 0.15s ease, opacity 0.15s ease, filter 0.15s ease;
}
.cc-remove:hover {
  transform: scale(1.12);
  filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6));
}
.cc-remove:active {
  transform: scale(0.92);
}
</style>
