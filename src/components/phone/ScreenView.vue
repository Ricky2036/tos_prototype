<script setup>
import { wideMode } from '../../config/deviceDesktop.js'
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useControlStore } from '../../stores/controlStore'
import { useSystemStore } from '../../stores/systemStore'
import { useSpring } from '../../composables/useSpring'
import { useSwipeGesture } from '../../composables/useSwipeGesture'
import { screenRef } from '../../utils/screenRef'
import StatusBar from './StatusBar.vue'
import PrivacyStatus from '../privacy/PrivacyStatus.vue'
import PrivacyPanel from '../privacy/PrivacyPanel.vue'
import { usePrivacyStore } from '../../stores/privacyStore'
import HomeIndicator from './HomeIndicator.vue'
import ThreeButtonNav from './ThreeButtonNav.vue'
import DynamicIsland from '../system/DynamicIsland.vue'
import LockScreen from '../system/LockScreen.vue'
import HomeScreen from '../system/HomeScreen.vue'
import AppWindow from '../system/AppWindow.vue'
import NotificationCenter from '../system/NotificationCenter.vue'
import ControlCenter from '../system/ControlCenter.vue'
import AppLibrary from '../system/AppLibrary.vue'
import AppSwitcher from '../system/AppSwitcher.vue'
import VolumePanel from '../system/VolumePanel.vue'
import FlashlightPanel from '../system/FlashlightPanel.vue'
import SideVolumeOverlay from '../system/SideVolumeOverlay.vue'
import PowerMenu from '../system/PowerMenu.vue'
import ShareSheet from '../system/ShareSheet.vue'
import { DARK_BG_APPS } from '../../config/apps'
import { registerDriver } from '../../composables/driverRegistry'
import { runBackHandler } from '../../composables/backRegistry'
import wallpaper from '../../assets/img/wallpaper-lock.jpg'
import { useWallpaperStore } from '../../stores/wallpaperStore'
import { useShareStore } from '../../stores/shareStore'

/**
 * 屏幕容器（OS 合成器）：
 * 壁纸（锁屏/桌面统一使用 notificationscreen.tsx 同款）/ 桌面 / 应用窗口 / 通知中心 / 控制中心 / 锁屏 / 系统 chrome / 边缘手势热区。
 */
const privacy = usePrivacyStore()
let privacyTicker = null
function syncPrivacyTicker(shouldRun) {
  if (shouldRun) {
    if (!privacyTicker) privacyTicker = setInterval(() => privacy.tick(), 100)
  } else if (privacyTicker) {
    clearInterval(privacyTicker)
    privacyTicker = null
  }
}
const control = useControlStore()
const system = useSystemStore()
const wallpaperStore = useWallpaperStore()
const shareStore = useShareStore()
const activeWallpaper = computed(() => (wideMode.value ? wallpaperStore.lockWallpaper : wallpaperStore.homeWallpaper) || wallpaperStore.active || wallpaper)
const heroVisual = ref(null)

const rootEl = ref(null)
const stageEl = ref(null)
const stageSize = ref({ width: 360, height: 788 })
let stageObs = null

function syncStageSize() {
  if (!stageEl.value) return
  const w = stageEl.value.offsetWidth
  const h = stageEl.value.offsetHeight
  if (w > 0 && h > 0) stageSize.value = { width: w, height: h }
}

const oneHandedControlsVisible = ref(false)
const oneHandedResizing = ref(false)
let oneHandedHideTimer = null

function clearOneHandedHideTimer() {
  if (oneHandedHideTimer) {
    clearTimeout(oneHandedHideTimer)
    oneHandedHideTimer = null
  }
}

function scheduleOneHandedHide() {
  clearOneHandedHideTimer()
  if (!control.oneHanded || control.oneHandedEditing) return
  oneHandedHideTimer = setTimeout(() => {
    if (control.oneHanded && !control.oneHandedEditing) {
      oneHandedControlsVisible.value = false
    }
  }, 5000)
}

function onOneHandedBackdropClick() {
  if (!control.oneHanded) return
  if (control.oneHandedEditing) {
    control.oneHandedEditing = false
    scheduleOneHandedHide()
    return
  }
  oneHandedControlsVisible.value = !oneHandedControlsVisible.value
  if (oneHandedControlsVisible.value) scheduleOneHandedHide()
  else clearOneHandedHideTimer()
}

function onOneHandedPosClick() {
  control.cycleOneHandedPosition()
  scheduleOneHandedHide()
}

function onOneHandedEditClick() {
  control.oneHandedEditing = !control.oneHandedEditing
  if (control.oneHandedEditing) {
    oneHandedControlsVisible.value = true
    clearOneHandedHideTimer()
  } else {
    scheduleOneHandedHide()
  }
}

function onOneHandedFullClick() {
  control.exitOneHanded()
}

const oneHandedPositionLabel = computed(() => {
  return control.oneHandedPosition === 'left' ? '左下角' : '右下角'
})

const oneHandedLayout = computed(() => {
  if (!control.oneHanded) return null
  const sw = stageSize.value.width || (wideMode.value ? 426.6666667 : 360)
  const sh = stageSize.value.height || (wideMode.value ? 733.3333333 : 788)
  const useSlabRatio = wideMode.value && control.oneHandedRatio === 'slab'
  const vw = useSlabRatio ? 360 : sw
  const vh = useSlabRatio ? 788 : sh
  const fitScale = useSlabRatio ? Math.min(sw / vw, sh / vh) : 1
  const edgeX = control.oneHandedEdgeSnap ? 0 : 8
  const edgeY = control.oneHandedEdgeSnap ? 0 : 10
  const maxVisW = Math.max(160, sw - edgeX - 52)
  const s = Math.min(control.oneHandedScale * fitScale, maxVisW / vw)
  const visW = vw * s
  const visH = vh * s
  const top = Math.max(0, sh - visH - edgeY)
  const isLeft = control.oneHandedPosition === 'left'
  const left = isLeft ? edgeX : sw - visW - edgeX
  return { sw, sh, vw, vh, fitScale, s, visW, visH, left, top, isLeft }
})

const oneHandedViewStyle = computed(() => {
  const L = oneHandedLayout.value
  if (!L) return undefined
  const radius = control.oneHandedEdgeSnap
    ? 'var(--screen-radius)'
    : 'calc(var(--screen-radius) * 0.88)'
  return {
    width: `${L.vw}px`,
    height: `${L.vh}px`,
    right: 'auto',
    bottom: 'auto',
    transform: `translate3d(${L.left}px, ${L.top}px, 0) scale(${L.s})`,
    borderRadius: radius,
    clipPath: `inset(0 round ${radius})`,
    transition: oneHandedResizing.value
      ? 'none'
      : 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.34s ease, clip-path 0.34s ease'
  }
})

const oneHandedControlsStyle = computed(() => {
  const L = oneHandedLayout.value
  if (!L) return undefined
  const btnSize = 42
  const leftGap = L.left
  const rightGap = L.sw - (L.left + L.visW)
  const centerY = L.top + L.visH / 2
  if (!L.isLeft && leftGap >= btnSize + 8) {
    return {
      left: `${leftGap / 2}px`,
      top: `${centerY}px`,
      transform: 'translate(-50%, -50%)',
      flexDirection: 'column'
    }
  }
  if (L.isLeft && rightGap >= btnSize + 8) {
    return {
      left: `${L.left + L.visW + rightGap / 2}px`,
      top: `${centerY}px`,
      transform: 'translate(-50%, -50%)',
      flexDirection: 'column'
    }
  }
  return {
    left: `${L.sw / 2}px`,
    top: `${Math.max(56, L.top - 52)}px`,
    transform: 'translate(-50%, 0)',
    flexDirection: 'row'
  }
})

const oneHandedEditFrameStyle = computed(() => {
  const L = oneHandedLayout.value
  if (!L) return undefined
  return {
    left: `${L.left}px`,
    top: `${L.top}px`,
    width: `${L.visW}px`,
    height: `${L.visH}px`,
    borderRadius: control.oneHandedEdgeSnap
      ? 'var(--screen-radius)'
      : 'calc(var(--screen-radius) * 0.88)',
    transition: oneHandedResizing.value
      ? 'none'
      : 'left 0.34s cubic-bezier(0.22, 1, 0.36, 1), top 0.34s cubic-bezier(0.22, 1, 0.36, 1), width 0.34s cubic-bezier(0.22, 1, 0.36, 1), height 0.34s cubic-bezier(0.22, 1, 0.36, 1)'
  }
})

let resizeCleanup = null
function onOneHandedResizeDown(e) {
  const L = oneHandedLayout.value
  if (!L || !stageEl.value) return
  oneHandedResizing.value = true
  const startX = e.clientX
  const startY = e.clientY
  const startScale = control.oneHandedScale
  const stageRect = stageEl.value.getBoundingClientRect()
  const outerScale = L.sw > 0 ? stageRect.width / L.sw : 1
  const dirX = L.isLeft ? 1 : -1
  const edgeX = control.oneHandedEdgeSnap ? 0 : 8
  const maxScaleByGap = (L.sw - edgeX - 52) / (L.vw * L.fitScale)
  const onMove = (ev) => {
    const dx = ((ev.clientX - startX) / outerScale) * dirX
    const dy = -((ev.clientY - startY) / outerScale)
    const delta = (dx / L.sw + dy / L.sh) * 0.65
    control.setOneHandedScale(Math.min(startScale + delta, maxScaleByGap))
  }
  const onUp = () => {
    oneHandedResizing.value = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    resizeCleanup = null
  }
  resizeCleanup = onUp
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

onMounted(() => {
  screenRef.el = rootEl.value
  syncStageSize()
  if (stageEl.value && typeof ResizeObserver !== 'undefined') {
    stageObs = new ResizeObserver(syncStageSize)
    stageObs.observe(stageEl.value)
  }
  privacy.tick()
  syncPrivacyTicker(privacy.needsTick)
})
watch(() => privacy.needsTick, (shouldRun) => {
  syncPrivacyTicker(shouldRun)
})
watch(() => [system.baseLayer, system.screenOn], ([layer, on]) => {
  if ((layer === 'lock' || !on) && control.oneHanded) {
    control.exitOneHanded()
  }
})
watch(() => control.oneHanded, (active) => {
  if (active) {
    syncStageSize()
    oneHandedControlsVisible.value = true
    scheduleOneHandedHide()
  } else {
    clearOneHandedHideTimer()
    oneHandedControlsVisible.value = false
    control.oneHandedEditing = false
    resizeCleanup?.()
  }
})
watch(() => control.oneHandedEditing, (editing) => {
  if (editing) {
    oneHandedControlsVisible.value = true
    clearOneHandedHideTimer()
  } else if (control.oneHanded) {
    scheduleOneHandedHide()
  }
})
onBeforeUnmount(() => {
  syncPrivacyTicker(false)
  clearOneHandedHideTimer()
  resizeCleanup?.()
  if (stageObs) {
    stageObs.disconnect()
    stageObs = null
  }
})

/** 亮度滤镜：控制中心亮度滑块真实压暗屏幕（打开叠层时不遮罩控制中心/通知中心自身） */
const dimOpacity = computed(() => system.anyOverlayOpen() ? 0 : (1 - control.brightness) * 0.72)

const heroBackdropStrength = computed(() => Math.min(
  1,
  Math.max(0, heroVisual.value?.backdropStrength || 0)
))
const heroBackdropStyle = computed(() => {
  const strength = heroBackdropStrength.value
  return {
    opacity: strength
  }
})

function onHeroFrame(nextFrame) {
  heroVisual.value = nextFrame
}

/** 应用打开时桌面不响应手势 */
const homeInteractive = computed(() => system.baseLayer !== 'app' && !privacy.settingsPage)

/**
 * 壁纸可见性：
 * 基础层为 app 时，若应用处于静态铺满 open 态且无手势拉起（homeGestureProgress === 0），
 * 隐藏底部的 wallpaper，杜绝四角圆角拟合误差及页面缩放时的透底。
 * 注意：home-layer 必须常驻 DOM 布局树以提供物理锚点，不可使用 v-show 隐藏。
 */
const isWallpaperVisible = computed(() => {
  if (!system.screenOn) return false
  if (system.baseLayer === 'app') {
    const isFollowingSwipe = system.switcherProgress > 0.01
    if (heroVisual.value?.phase === 'open' && system.homeGestureProgress === 0 && !isFollowingSwipe) {
      return false
    }
  }
  return true
})

/** 状态栏/Home 条配色：
 * 1. 显式覆盖优先（如子页面/弹窗/全屏预览请求 useSystemChrome('light' | 'dark')）
 * 2. 应用内默认：深色背景应用（由 apps.js 的 darkStatusBar 派生）为浅色 chrome（白字/白条），浅色背景应用为深色 chrome（黑字/黑条）
 * 3. 锁屏/桌面默认：浅色 chrome（白字/白条）
 */
const chromeLight = computed(() => {
  if (heroVisual.value?.showingWidgetOnOpen) return true
  if (privacy.settingsPage) return false
  if (system.chromeStyleOverride === 'light') return true
  if (system.chromeStyleOverride === 'dark') return false
  if (system.baseLayer === 'app') return DARK_BG_APPS.includes(system.activeAppId)
  return true
})

/** 底部导航栏自适应深色（白色分享面板或浅色页面使用深色导航条） */
const navDark = computed(() => {
  if (shareStore.isOpen) return true
  return !chromeLight.value
})

/* ================= 叠层手势驱动（NC / CC） ================= */

const GESTURE_SPAN = 620

/**
 * 为一个叠层创建 spring + 进度同步 + closing 动画监听。
 * 手势进行中 progress 由 onProgress 直写（status=dragging）；
 * 松手后 spring 推进（status=settling/closing），到位后 settle。
 */
function useOverlayDriver(name, { axis = 'y', direction = 1, span = GESTURE_SPAN, canStartExtra = null } = {}) {
  const { value, animateTo, snapTo } = useSpring(0, 'ios-gentle')
  let lastDragEnd = 0 // 拖拽结束后抑制紧随的 click，防误关

  // spring 推进 → store（拖拽中不覆盖，拖拽由 onProgress 直写）
  watch(value, (v) => {
    if (system.overlays[name].status !== 'dragging') {
      system.updateSettleProgress(name, v)
    }
  })

  // 外部请求关闭（点空白/点热区/Home 条）→ 播收起动画
  watch(
    () => system.overlays[name].status,
    (status) => {
      if (status === 'closing') {
        animateTo(0, {
          onDone: () => system.settleOverlay(name, false)
        })
      }
    }
  )

  /** 手势配置（供 useSwipeGesture） */
  const gesture = {
    axis,
    direction,
    span,
    threshold: 5,
    canStart: () => {
      if (canStartExtra && !canStartExtra()) return false
      const self = system.overlays[name]
      if (self.status === 'open') return false // 已打开时不重新拖拽
      if (name === 'notificationCenter' || name === 'controlCenter') {
        const other = system.overlays[name === 'notificationCenter' ? 'controlCenter' : 'notificationCenter']
        return other.status === 'closed' || other.status === 'closing'
      }
      return true
    },
    onStart: () => snapTo(system.overlays[name].progress),
    onProgress: (p) => {
      system.setOverlayProgress(name, p)
      snapTo(p)
    },
    onRelease: (p, velocity) => {
      lastDragEnd = Date.now()
      const open = p > 0.3 || velocity > 0.45
      system.beginSettle(name, p)
      animateTo(open ? 1 : 0, {
        initialVelocity: velocity,
        onDone: () => system.settleOverlay(name, open)
      })
      return open ? 1 : 0
    }
  }

  /** 面板打开后的「反向滑关闭」手势（挂在叠层根元素上，如 NC 上滑收起） */
  const closeGesture = {
    axis,
    direction: -direction,
    span,
    threshold: 5,
    canStart: () => {
      const status = system.overlays[name].status
      return status === 'open' || status === 'settling'
    },
    onStart: () => snapTo(system.overlays[name].progress),
    onProgress: (p) => {
      const next = 1 - p
      system.setOverlayProgress(name, next)
      snapTo(next)
    },
    onRelease: (p, velocity) => {
      lastDragEnd = Date.now()
      const close = p > 0.18 || velocity > 0.35
      const next = 1 - p
      system.beginSettle(name, next)
      animateTo(close ? 0 : 1, {
        initialVelocity: -velocity,
        onDone: () => system.settleOverlay(name, !close)
      })
      return close ? 1 : 0
    }
  }

  /** 点击热区降级：关⇄开（拖拽后 350ms 内的 click 忽略） */
  function toggle() {
    if (Date.now() - lastDragEnd < 350) return
    const status = system.overlays[name].status
    if (status === 'closed') {
      snapTo(0)
      system.beginSettle(name, 0)
      animateTo(1, { onDone: () => system.settleOverlay(name, true) })
    } else if (status === 'open') {
      system.requestCloseOverlay(name)
    }
  }

  return { gesture, closeGesture, toggle, snapTo, animateTo }
}

const ncStripRef = ref(null)
const ccStripRef = ref(null)
const ncDriver = useOverlayDriver('notificationCenter')
const ccDriver = useOverlayDriver('controlCenter')
registerDriver('notificationCenter', ncDriver)
registerDriver('controlCenter', ccDriver)

/* 应用抽屉驱动：桌面纵向上滑打开（轴 y，span 450） */
const libDriver = useOverlayDriver('appLibrary', {
  axis: 'y',
  direction: -1,
  span: 450,
  canStartExtra: () => system.baseLayer === 'home'
})
registerDriver('appLibrary', libDriver)

useSwipeGesture(ncStripRef, ncDriver.gesture)
useSwipeGesture(ccStripRef, ccDriver.gesture)

/* ================= 全局侧滑返回（左缘右滑） ================= */

const sideEdgeRef = ref(null)
const SIDE_SPAN = 240

const { value: sideVal, animateTo: sideAnimate, snapTo: sideSnap } = useSpring(0, 'ios-snappy')
// 侧滑与底部上滑共用同一进度通道：AppWindow 缩放预览无需关心来源
watch(sideVal, (v) => system.setHomeGestureProgress(v))

useSwipeGesture(sideEdgeRef, {
  axis: 'x',
  direction: 1, // 右滑
  span: SIDE_SPAN,
  threshold: 6,
  canStart: () => Boolean(privacy.settingsPage) || system.baseLayer === 'app' || system.anyOverlayOpen(),
  onStart() {
    sideSnap(system.homeGestureProgress)
  },
  onProgress(p) {
    sideSnap(p)
  },
  onRelease(p, velocity) {
    const trigger = p > 0.22 || velocity > 0.45
    if (trigger) {
      // 叠层打开 → 右滑直接收起叠层
      if (system.anyOverlayOpen()) {
        system.setHomeGestureProgress(0)
        sideSnap(0)
        for (const key of ['appLibrary', 'notificationCenter', 'controlCenter']) {
          if (system.overlays[key].status !== 'closed') system.requestCloseOverlay(key)
        }
        return 1
      }
      // 应用内消费（如关闭信息对话页）：进度弹回，不回桌面
      if (runBackHandler()) {
        sideAnimate(0, { initialVelocity: velocity })
        return 0
      }
      // 保留当前进度，供 AppWindow 将预览帧作为关闭动画起点。
      system.goHome()
      return 1
    }
    sideAnimate(0, { initialVelocity: velocity })
    return 0
  }
})
</script>

<template>
  <div ref="stageEl" class="screen-stage" :class="{ 'is-one-handed': control.oneHanded }">
    <div
      v-if="control.oneHanded"
      class="onehanded-backdrop"
      :class="{ 'is-black': control.oneHandedBackdrop === 'black' }"
      :style="control.oneHandedBackdrop === 'black' ? undefined : { backgroundImage: `url(${activeWallpaper})` }"
      @click="onOneHandedBackdropClick"
    ></div>

    <!-- 单手模式空白区域控制按钮（竖排单个圆形玻璃按钮，无整体背板，5秒自动隐藏） -->
    <Transition name="oh-bar">
      <div
        v-if="control.oneHanded && oneHandedControlsVisible"
        class="onehanded-controls"
        data-testid="onehanded-controls"
        :style="oneHandedControlsStyle"
        @click.stop
      >
        <button
          type="button"
          class="oh-cc-btn"
          aria-label="恢复全屏"
          title="恢复全屏"
          data-testid="onehanded-full-btn"
          @click="onOneHandedFullClick"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 10V4h6L7.7 6.3l2.6 2.6-1.4 1.4-2.6-2.6L4 10Zm16 0V4h-6l2.3 2.3-2.6 2.6 1.4 1.4 2.6-2.6L20 10ZM4 14v6h6l-2.3-2.3 2.6-2.6-1.4-1.4-2.6 2.6L4 14Zm16 0v6h-6l2.3-2.3-2.6-2.6 1.4-1.4 2.6 2.6L20 14Z"/>
          </svg>
        </button>
        <button
          type="button"
          class="oh-cc-btn"
          :class="{ 'is-active': control.oneHandedEditing }"
          :aria-label="control.oneHandedEditing ? '保存尺寸' : '尺寸调节'"
          :title="control.oneHandedEditing ? '保存' : '尺寸调节'"
          data-testid="onehanded-resize-btn"
          @click="onOneHandedEditClick"
        >
          <svg v-if="control.oneHandedEditing" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M9.55 18.2 4.3 12.95a1.1 1.1 0 0 1 1.55-1.55l3.7 3.7 8.6-8.6a1.1 1.1 0 1 1 1.55 1.55l-9.38 9.38a1.1 1.1 0 0 1-1.55 0Z"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M13 3h8v8l-3.1-3.1-9 9L12 20H4v-8l3.1 3.1 9-9L13 3Z"/>
          </svg>
        </button>
        <button
          type="button"
          class="oh-cc-btn"
          :aria-label="`切换窗口位置（当前：${oneHandedPositionLabel}）`"
          :title="`切换窗口位置（当前：${oneHandedPositionLabel}）`"
          data-testid="onehanded-pos-btn"
          @click="onOneHandedPosClick"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16.5 4.5 21 9l-4.5 4.5v-3H6v-3h10.5v-3Zm-9 15L3 15l4.5-4.5v3H18v3H7.5v3Z"/>
          </svg>
        </button>
      </div>
    </Transition>

    <div
      ref="rootEl"
      class="screen-view"
      :class="{ 'is-screen-off': !system.screenOn, 'is-one-handed': control.oneHanded }"
      :style="oneHandedViewStyle"
    >
    <!-- 桌面/锁屏统一壁纸（notificationscreen.tsx 同款，本地化） -->
    <div
      v-show="isWallpaperVisible"
      class="wallpaper"
      :style="{ backgroundImage: `url(${activeWallpaper})` }"
    ></div>

    <!-- 桌面（常驻 DOM，支撑解锁入场动效与 Hero 实时锚点计算） -->
    <div
      class="home-layer"
      :style="{ pointerEvents: homeInteractive ? 'auto' : 'none' }"
    >
      <HomeScreen @open-library="libDriver.toggle()" />
    </div>

    <!-- 只在 Hero 过渡期间存在：不变换桌面布局，因此不会污染实时锚点。 -->
    <div
      v-show="heroBackdropStrength > 0"
      class="hero-desktop-backdrop"
      :class="{ 'is-active': heroBackdropStrength > 0 }"
      :style="heroBackdropStyle"
    ></div>

    <!-- 打开中的应用窗口（切换器跟手/打开期间让位给 AppSwitcher 的跟手卡，避免双重渲染） -->
    <AppWindow
      v-if="system.activeAppId"
      v-show="system.switcherProgress <= 0.01"
      :key="system.activeAppId"
      :app-id="system.activeAppId"
      @hero-frame="onHeroFrame"
    />

    <!-- 锁屏（lock 基础层时挂载） -->
    <LockScreen v-if="system.baseLayer === 'lock'" />

    <!-- 系统叠层 -->
    <NotificationCenter />
    <ControlCenter />
    <AppLibrary />

    <!-- 最近任务切换器（App Switcher / Recent） -->
    <AppSwitcher />

    <!-- 音量 Plus 浮层：全屏音量面板 / 侧边音量 / 电源菜单（层级见 tokens.css 的 --z-volume-* / --z-side-volume* / --z-power-menu） -->
    <VolumePanel />
    <FlashlightPanel />
    <SideVolumeOverlay />
    <PowerMenu />
    <ShareSheet />

    <!-- 顶部边缘手势热区：左/中 = 通知中心，右 1/4 = 控制中心 (当叠层打开时禁用热区避免遮挡头部按钮) -->
    <div
      ref="ncStripRef"
      class="edge-zone edge-nc"
      :style="{ pointerEvents: system.anyOverlayOpen() ? 'none' : 'auto' }"
      @click="ncDriver.toggle"
    ></div>
    <div
      ref="ccStripRef"
      class="edge-zone edge-cc"
      :style="{ pointerEvents: system.anyOverlayOpen() ? 'none' : 'auto' }"
      @click="ccDriver.toggle"
    ></div>

    <!-- 左侧边缘手势热区：应用内右滑返回（上级页或桌面） -->
    <div ref="sideEdgeRef" class="side-edge"></div>

    <!-- 亮度滤镜（永远最上，不拦截事件） -->
    <div class="brightness-filter" :style="{ opacity: dimOpacity }"></div>

    <!-- 灭屏黑幕（控制台模拟关屏，阻断一切交互） -->
    <div v-if="!system.screenOn" class="screen-off"></div>

    <DynamicIsland v-if="!system.anyOverlayOpen() && system.baseLayer !== 'lock'" />
    <PrivacyStatus />
    <PrivacyPanel />
    <StatusBar v-if="!system.anyOverlayOpen()" :light="chromeLight" />
    <!-- 底部导航栏：支持手势条 (HomeIndicator) 与三键导航 (ThreeButtonNav) 切换 -->
    <HomeIndicator v-if="system.navigationMode === 'gesture'" :dark="navDark" />
    <ThreeButtonNav v-else :dark="navDark" />
  </div>

    <!-- 单手模式尺寸调节框 + 贴合圆角的弧形拖动 Bar -->
    <div
      v-if="control.oneHanded && control.oneHandedEditing"
      class="onehanded-edit-frame"
      data-testid="onehanded-edit-frame"
      :style="oneHandedEditFrameStyle"
      @click.stop
    >
      <button
        type="button"
        class="onehanded-resize-handle"
        :class="`pos-${control.oneHandedPosition}`"
        data-testid="onehanded-resize-handle"
        aria-label="等比例缩放调节单手窗口尺寸"
        @pointerdown.prevent.stop="onOneHandedResizeDown"
      >
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4.5 29.5A34 34 0 0 1 29.5 4.5"
            stroke="rgba(255, 255, 255, 0.55)"
            stroke-width="4.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>

.screen-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
  background: #000;
}

.onehanded-backdrop {
  position: absolute;
  inset: -24px;
  background-size: cover;
  background-position: center;
  filter: blur(28px) brightness(0.42) saturate(1.1);
  transform: scale(1.06);
  transition: background 0.25s ease, filter 0.25s ease;
}

.onehanded-backdrop.is-black {
  background: #000;
  filter: none;
  transform: none;
}

.onehanded-controls {
  position: absolute;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 14px;
}

.oh-cc-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 0;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.2);
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.18));
  cursor: pointer;
  transition: transform 0.16s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease, color 0.2s ease;
}

.oh-cc-btn:active {
  transform: scale(0.92);
}

.oh-cc-btn.is-active {
  background: #fff;
  color: #258FFF;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.oh-bar-enter-active,
.oh-bar-leave-active {
  transition: opacity 0.24s ease;
}

.oh-bar-enter-from,
.oh-bar-leave-to {
  opacity: 0;
}

.onehanded-edit-frame {
  position: absolute;
  z-index: 45;
  background: transparent;
  box-sizing: border-box;
  touch-action: none;
}

.onehanded-resize-handle {
  position: absolute;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: nwse-resize;
  touch-action: none;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.35));
}

.onehanded-resize-handle svg {
  display: block;
}

.onehanded-resize-handle.pos-right {
  top: -7px;
  left: -7px;
}

.onehanded-resize-handle.pos-left {
  top: -7px;
  right: -7px;
  cursor: nesw-resize;
  transform: scaleX(-1);
}

.screen-view {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--screen-radius);
  /* 🔴 `overflow: hidden` + `border-radius` 的圆角裁剪在**合成层**上会丢：
     应用根一旦被提升为独立合成层（transform / will-change / filter 等），
     Chrome 会把它的方形纹理整块贴上，**不套父级圆角** ⇒ 屏幕四角会戳出方形直角，
     在机身圆弧之外露出一块页面底色（实测于有头 Chrome；无头软件合成不复现）。
     `clip-path` 是**绘制期**裁剪，合成时按路径生效，不会再丢。
     与 border-radius 同值，视觉不变。 */
  clip-path: inset(0 round var(--screen-radius));
  background: #000;
  transform-origin: top left;
  transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.34s ease, clip-path 0.34s ease;
}

.screen-view.is-one-handed {
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.42);
}

.home-layer {
  position: absolute;
  inset: 0;
  z-index: var(--z-home);
}

.hero-desktop-backdrop {
  position: absolute;
  inset: 0;
  z-index: var(--z-hero-backdrop);
  pointer-events: none;
  background-color: rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(12px) saturate(92%);
  -webkit-backdrop-filter: blur(12px) saturate(92%);
  will-change: opacity;
}
.hero-desktop-backdrop.is-active {
  will-change: opacity;
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .hero-desktop-backdrop {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    background-color: rgba(0, 0, 0, 0.28);
  }
}

/* 壁纸铺满屏幕（桌面与锁屏同款图片壁纸） */
.wallpaper {
  position: absolute;
  inset: 0;
  z-index: 1;
  background-size: cover;
  background-position: center;
  /* 轻微暗化，让桌面图标/文字更清晰 */
}
.wallpaper::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.12);
}

.edge-zone {
  position: absolute;
  top: 0;
  height: 64px; /* 覆盖状态栏全区，提升下拉可触发性 */
  z-index: var(--z-edge-zone);
  touch-action: none;
}
.edge-nc {
  left: 0;
  right: 26%;
}
.edge-cc {
  right: 0;
  width: 26%;
}

/* 🔴 右上角应用控件让位区（Rect Yield）
   `LargeTitleHeader` 的 `#accessory` 槽（相册右上胶囊）按参考图落在
   y 44.65–85.14、右内缩 17px、宽 144px ⇒ 与上面 64px 高的热区重叠 **44.65–64**。
   不让位的话按钮上半部的点击会被热区截走（点齿轮会翻出控制中心，点列表会拉下通知中心）。
   `.edge-cc` 压到 44px 高；`.edge-nc` 在 y≥44px 处只保留 x < 199px 的部分
   （199 = 360 机身宽 − 17 右内缩 − 144 胶囊宽）。
   ⚠️ 只在真的存在 accessory 时生效 —— 桌面 / 锁屏 / 其余应用仍是完整 64px 全宽热区。 */
.screen-view:has([data-large-title-accessory]) {
  --edge-yield-top: 44px;
  --edge-yield-left: 199px;
}
.screen-view:has([data-large-title-accessory]) .edge-nc {
  clip-path: polygon(
    0 0,
    100% 0,
    100% var(--edge-yield-top),
    var(--edge-yield-left) var(--edge-yield-top),
    var(--edge-yield-left) 100%,
    0 100%
  );
}
.screen-view:has([data-large-title-accessory]) .edge-cc {
  height: var(--edge-yield-top);
}

/* 🔴 沉浸态（Immersive Chrome Yield）
   应用在全屏查看时可以在自己的子树里挂 `data-immersive-chrome`，声明「请把系统状态栏也藏起来」。
   必要性：`StatusBar` 挂在本组件里（应用树之外），`--z-status-bar`(90) > `--z-app-window`(30)
   ⇒ 应用**无论怎么调 z-index 都盖不住它**，只能由这里用 `:has()` 响应。
   ⚠️ 任何应用都可以用这个钩子（不是相册专用）；只在属性真的存在时生效。
   ⚠️ 属性必须用 `|| null` 绑定 —— `false` 会让属性以 "false" 存在，`:has()` 会命中。 */
.screen-view:has([data-immersive-chrome]) .status-bar { opacity: 0; }

/* 左侧边缘返回热区：窄条全高，不遮挡内容交互 */
.side-edge {
  position: absolute;
  left: 0;
  top: 64px;
  bottom: 80px;
  width: 22px;
  z-index: var(--z-side-edge);
  touch-action: none;
}

.brightness-filter {
  position: absolute;
  inset: 0;
  background: #000;
  pointer-events: none;
  z-index: var(--z-brightness-filter);
  transition: opacity 0.12s linear;
}

/* 灭屏状态：彻底隐藏所有底层图层（桌面、锁屏、壁纸、叠层、状态栏），杜绝四角圆角抗锯齿和硬件加速透色漏光 */
.screen-view.is-screen-off > *:not(.screen-off) {
  visibility: hidden !important;
}

/* 灭屏黑幕：盖住整块屏幕（含状态栏/Home 条），阻断所有指针事件 */
.screen-off {
  position: absolute;
  inset: 0;
  background: #000;
  z-index: 120;
  cursor: default;
}
</style>
