<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { getDrawerAppById } from '../../../config/drawerApps'
import { useHomeStore } from '../../../stores/homeStore'
import { rectRelativeToScreen } from '../../../utils/dom'
import { rubberBand } from '../../../utils/math'
import AppIcon from '../../ui/AppIcon.vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  origin: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'launch-app'])

const home = useHomeStore()
const isInstalled = (id) => (home.appInstalled ? home.appInstalled(id) : true)

// 解析分类包含的全部应用
const allApps = computed(() => {
  let appIds = []
  if (props.category.type === '3-large-1-cluster') {
    appIds = [...(props.category.largeApps || []), ...(props.category.clusterApps || [])]
  } else if (props.category.type === '4-large') {
    appIds = props.category.apps || []
  }
  return appIds
    .filter(isInstalled)
    .map((id) => getDrawerAppById(id))
    .filter(Boolean)
})

const overlayRef = ref(null)
const backdropRef = ref(null)
const shellRef = ref(null)
const containerRef = ref(null)
const titleRef = ref(null)
const iconRefs = new Map()

const phase = ref('measuring')
const shellMotion = reactive({ dx: 0, dy: 0, sx: 0.2, sy: 0.2, startRadius: '26px' })
const titleMotion = reactive({ dx: 0, dy: 0, scale: 0.54, valid: false })
const iconMotions = new Map()
let closeTimer = null

function setIconRef(id, el) {
  if (el) iconRefs.set(id, el)
  else iconRefs.delete(id)
}

function getLiveOriginData() {
  const screen = overlayRef.value?.closest('.screen-view') || document.querySelector('.screen-view')
  if (!screen) return props.origin

  const cardWrapper = screen.querySelector(`[data-category-id="${props.category.id}"]`)
  if (!cardWrapper) return props.origin

  const cardEl = cardWrapper.querySelector('.folder-card')
  if (!cardEl) return props.origin

  const titleEl = cardWrapper.querySelector('.folder-name')
  const clusterEl = cardWrapper.querySelector('.mini-cluster-grid')

  const cardRect = rectRelativeToScreen(cardEl, screen)
  const titleRect = titleEl ? rectRelativeToScreen(titleEl, screen) : null
  const clusterRect = clusterEl ? rectRelativeToScreen(clusterEl, screen) : null
  const iconRects = {}

  for (const app of allApps.value) {
    const appIcon = cardWrapper.querySelector(`[data-app-id="${app.id}"]`)
    if (appIcon) {
      const anchor = appIcon.querySelector('.app-icon-anchor') || appIcon
      const r = rectRelativeToScreen(anchor, screen)
      if (r && r.width > 0) {
        iconRects[app.id] = r
      }
    }
  }

  return {
    cardRect: cardRect || props.origin?.cardRect,
    titleRect: titleRect || props.origin?.titleRect,
    clusterRect: clusterRect || props.origin?.clusterRect,
    iconRects: Object.keys(iconRects).length > 0 ? iconRects : (props.origin?.iconRects || {})
  }
}

function prepareMotion(isClosing = false) {
  if (!containerRef.value) return
  const screen = overlayRef.value?.closest('.screen-view') || document.querySelector('.screen-view')
  if (!screen) return

  const containerTo = rectRelativeToScreen(containerRef.value, screen)
  // 收起时，以 DOM 中真实处于静止态的分类卡片作为归位目标，杜绝用户点击展开时的 :active 缩放下移引起最后一帧向上抖动
  const originData = isClosing ? getLiveOriginData() : (props.origin || getLiveOriginData())
  const cardFrom = originData?.cardRect
  if (!containerTo || !cardFrom || containerTo.width <= 0 || containerTo.height <= 0) return

  // 1. 卡片外壳几何换算
  const sx = cardFrom.width / containerTo.width
  const sy = cardFrom.height / containerTo.height
  const dx = cardFrom.left - containerTo.left
  const dy = cardFrom.top - containerTo.top
  const baseRadius = 26
  const startRadiusX = (baseRadius / Math.max(0.001, sx)).toFixed(2)
  const startRadiusY = (baseRadius / Math.max(0.001, sy)).toFixed(2)
  const startRadius = `${startRadiusX}px / ${startRadiusY}px`

  shellMotion.dx = dx
  shellMotion.dy = dy
  shellMotion.sx = sx
  shellMotion.sy = sy
  shellMotion.startRadius = startRadius

  if (shellRef.value) {
    shellRef.value.style.left = `${containerTo.left}px`
    shellRef.value.style.top = `${containerTo.top}px`
    shellRef.value.style.width = `${containerTo.width}px`
    shellRef.value.style.height = `${containerTo.height}px`
  }

  // 2. 文件夹标题几何换算（从卡片下方小标题无缝升起为顶部大标题）
  if (titleRef.value && originData?.titleRect) {
    const titleTo = rectRelativeToScreen(titleRef.value, screen)
    const titleFrom = originData.titleRect
    if (titleTo && titleFrom && titleTo.width > 0) {
      titleMotion.dx = titleFrom.left - titleTo.left
      titleMotion.dy = titleFrom.top - titleTo.top
      titleMotion.scale = 13 / 24 // 卡片标题 13px，展开标题 24px
      titleMotion.valid = true
    } else {
      titleMotion.valid = false
    }
  } else {
    titleMotion.valid = false
  }

  // 3. 图标 Hero 空间连续性几何换算
  iconMotions.clear()
  const iconFroms = originData?.iconRects || {}
  const clusterFrom = originData?.clusterRect || cardFrom

  for (const app of allApps.value) {
    const iconEl = iconRefs.get(app.id)
    if (!iconEl) continue

    const tileEl = iconEl.querySelector('.app-icon-anchor') || iconEl
    const tileRect = rectRelativeToScreen(tileEl, screen)
    const iconElRect = rectRelativeToScreen(iconEl, screen)
    if (!tileRect || !iconElRect) continue

    // 以每个图标 tile 的绝对中心作为缩放旋转原点，彻底防止拉伸变形
    const originX = tileRect.left - iconElRect.left + tileRect.width / 2
    const originY = tileRect.top - iconElRect.top + tileRect.height / 2
    iconEl.style.transformOrigin = `${originX}px ${originY}px`

    const tileCenterX = tileRect.left + tileRect.width / 2
    const tileCenterY = tileRect.top + tileRect.height / 2

    const originRect = iconFroms[app.id]
    if (originRect && originRect.width > 0) {
      // 严格以物理中心计算位移差，彻底杜绝微簇小图标（24px 与 50px 缩放）在最后一帧的 13px 坐标漂移
      const originCenterX = originRect.left + originRect.width / 2
      const originCenterY = originRect.top + originRect.height / 2
      const cx = originCenterX - tileCenterX
      const cy = originCenterY - tileCenterY
      const scale = originRect.width / tileRect.width
      iconMotions.set(app.id, {
        cx,
        cy,
        scale,
        isFromSlot: true
      })
    } else {
      // 未在源卡片直接露出的图标（第 8 个之后），从微簇中心优雅向外发散
      const targetCenterX = clusterFrom.left + clusterFrom.width / 2
      const targetCenterY = clusterFrom.top + clusterFrom.height / 2
      iconMotions.set(app.id, {
        cx: targetCenterX - tileCenterX,
        cy: targetCenterY - tileCenterY,
        scale: 0.25,
        isFromSlot: false
      })
    }
  }
}

function open() {
  prepareMotion()
  phase.value = 'opening'

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  const dur = prefersReduced ? 1 : 280
  const easeOpen = 'cubic-bezier(0.2, 0.9, 0.3, 1)'

  // 1. 全屏深色毛玻璃遮罩淡入
  backdropRef.value?.animate([
    { opacity: 0 },
    { opacity: 1 }
  ], {
    duration: dur,
    easing: 'ease-out',
    fill: 'forwards'
  })

  // 2. 一镜到底文件夹卡片外壳平滑放大并消融至全屏深色毛玻璃中
  shellRef.value?.animate([
    {
      transform: `translate3d(${shellMotion.dx}px, ${shellMotion.dy}px, 0) scale(${shellMotion.sx}, ${shellMotion.sy})`,
      borderRadius: shellMotion.startRadius,
      opacity: 1
    },
    {
      transform: 'translate3d(0, 0, 0) scale(1, 1)',
      borderRadius: '32px',
      opacity: 0
    }
  ], {
    duration: dur,
    easing: easeOpen,
    fill: 'forwards'
  })

  // 3. 标题空间连续性位移升起
  if (titleMotion.valid && titleRef.value) {
    titleRef.value.animate([
      {
        transform: `translate3d(${titleMotion.dx}px, ${titleMotion.dy}px, 0) scale(${titleMotion.scale})`,
        transformOrigin: 'top left',
        opacity: 0.9
      },
      {
        transform: 'translate3d(0, 0, 0) scale(1, 1)',
        transformOrigin: 'top left',
        opacity: 1
      }
    ], {
      duration: Math.min(dur, 260),
      easing: easeOpen,
      fill: 'forwards'
    })
  } else {
    titleRef.value?.animate([
      { opacity: 0, transform: 'translate3d(0, -10px, 0)' },
      { opacity: 1, transform: 'translate3d(0, 0, 0)' }
    ], {
      duration: Math.min(dur, 200),
      easing: easeOpen,
      fill: 'forwards'
    })
  }

  // 4. 图标 Hero 物理轨迹飞行与标签延迟淡入
  let lastIconAnim = null
  for (const app of allApps.value) {
    const iconEl = iconRefs.get(app.id)
    const motion = iconMotions.get(app.id)
    if (!iconEl || !motion) continue

    const anim = iconEl.animate([
      {
        transform: `translate3d(${motion.cx}px, ${motion.cy}px, 0) scale(${motion.scale})`,
        opacity: motion.isFromSlot ? 1 : 0
      },
      {
        transform: 'translate3d(0, 0, 0) scale(1, 1)',
        opacity: 1
      }
    ], {
      duration: dur,
      easing: easeOpen,
      fill: 'forwards'
    })
    lastIconAnim = anim

    const label = iconEl.querySelector('.icon-label')
    label?.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: Math.min(dur, 180),
      delay: prefersReduced ? 0 : 70,
      easing: easeOpen,
      fill: 'both'
    })
  }

  const finishOpen = () => {
    phase.value = 'open'
    if (backdropRef.value) backdropRef.value.style.opacity = '1'
  }

  if (lastIconAnim) {
    lastIconAnim.onfinish = finishOpen
  } else {
    finishOpen()
  }
}

function close() {
  if (phase.value === 'closing' || phase.value === 'closed' || phase.value === 'launching') return
  prepareMotion(true)
  phase.value = 'closing'
  clearTimeout(closeTimer)

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  const dur = prefersReduced ? 1 : 260
  const easeClose = 'cubic-bezier(0.25, 1, 0.5, 1)'
  const easeBackdropClose = 'cubic-bezier(0.33, 0, 0.67, 1)'

  // 1. 深色毛玻璃遮罩淡出
  if (backdropRef.value) backdropRef.value.style.opacity = ''
  backdropRef.value?.animate([
    { opacity: 1 },
    { opacity: 0 }
  ], {
    duration: dur,
    easing: easeBackdropClose,
    fill: 'forwards'
  })

  // 2. 卡片外壳重新凝聚并坍缩回源卡片
  const closeShellAnim = shellRef.value?.animate([
    {
      transform: 'translate3d(0, 0, 0) scale(1, 1)',
      borderRadius: '32px',
      opacity: 0
    },
    {
      transform: `translate3d(${shellMotion.dx}px, ${shellMotion.dy}px, 0) scale(${shellMotion.sx}, ${shellMotion.sy})`,
      borderRadius: shellMotion.startRadius,
      opacity: 1
    }
  ], {
    duration: dur,
    easing: easeClose,
    fill: 'forwards'
  })

  // 3. 标题降回源卡片下方位置
  if (titleMotion.valid && titleRef.value) {
    titleRef.value.animate([
      {
        transform: 'translate3d(0, 0, 0) scale(1, 1)',
        transformOrigin: 'top left',
        opacity: 1
      },
      {
        transform: `translate3d(${titleMotion.dx}px, ${titleMotion.dy}px, 0) scale(${titleMotion.scale})`,
        transformOrigin: 'top left',
        opacity: 0.9
      }
    ], {
      duration: dur,
      easing: easeClose,
      fill: 'forwards'
    })
  } else {
    titleRef.value?.animate([
      { opacity: 1, transform: 'translate3d(0, 0, 0)' },
      { opacity: 0, transform: 'translate3d(0, -8px, 0)' }
    ], {
      duration: Math.min(dur, 140),
      easing: 'ease-out',
      fill: 'forwards'
    })
  }

  // 4. 图标飞回卡片源位置，文字快速淡出防重影
  for (const app of allApps.value) {
    const iconEl = iconRefs.get(app.id)
    const motion = iconMotions.get(app.id)
    if (!iconEl || !motion) continue

    iconEl.animate([
      {
        transform: 'translate3d(0, 0, 0) scale(1, 1)',
        opacity: 1
      },
      {
        transform: `translate3d(${motion.cx}px, ${motion.cy}px, 0) scale(${motion.scale})`,
        opacity: motion.isFromSlot ? 1 : 0
      }
    ], {
      duration: dur,
      easing: easeClose,
      fill: 'forwards'
    })

    const label = iconEl.querySelector('.icon-label')
    label?.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], {
      duration: Math.min(dur, 100),
      easing: 'ease-out',
      fill: 'forwards'
    })
  }

  const finishClose = () => {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
    phase.value = 'closed'
    emit('close')
  }

  if (closeShellAnim) {
    closeShellAnim.onfinish = finishClose
  }
  closeTimer = setTimeout(finishClose, dur + 40)
}

function handleAppClick(appId) {
  if (phase.value !== 'open') return
  phase.value = 'launching'
  backdropRef.value?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' })
  shellRef.value?.animate([{ opacity: 0 }], { duration: 160, fill: 'forwards' })
  containerRef.value?.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(0.96)', opacity: 0.2 }
  ], { duration: 160, fill: 'forwards' })

  emit('launch-app', appId)
}

function onOverlayClick(e) {
  if (phase.value !== 'open') return
  if (!e.target.closest('.folder-grid-item')) {
    close()
  }
}

// 下滑手势支持（对齐 22.mp4）与上滑阻尼橡皮筋回弹
let startY = 0
let isTracking = false
const overscrollY = ref(0)
const isBouncing = ref(false)

const containerStyle = computed(() => {
  if (overscrollY.value === 0 && !isBouncing.value) {
    return {}
  }
  return {
    transform: `translateY(calc(-16px + ${overscrollY.value}px))`,
    transition: isBouncing.value ? 'transform 0.38s cubic-bezier(0.18, 0.9, 0.32, 1.2)' : 'none'
  }
})

function onPointerDown(e) {
  if (phase.value !== 'open') return
  startY = e.clientY
  isTracking = true
}

function onPointerMove(e) {
  if (!isTracking || phase.value !== 'open') return
  const dy = e.clientY - startY
  if (dy > 45) {
    isTracking = false
    close()
    return
  }
  if (dy < 0) {
    isBouncing.value = false
    overscrollY.value = rubberBand(dy, 280, 0.45)
  } else if (overscrollY.value < 0) {
    overscrollY.value = 0
  }
}

function onPointerUp() {
  isTracking = false
  if (overscrollY.value < 0) {
    isBouncing.value = true
    overscrollY.value = 0
    setTimeout(() => {
      isBouncing.value = false
    }, 380)
  }
}

onMounted(async () => {
  await nextTick()
  open()
})

onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer)
})
</script>

<template>
  <div
    ref="overlayRef"
    class="drawer-folder-overlay"
    :class="`phase-${phase}`"
    @click="onOverlayClick"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <!-- 1. 全屏深色毛玻璃遮罩（对齐 22.mp4） -->
    <div ref="backdropRef" class="folder-backdrop"></div>

    <!-- 2. 一镜到底文件夹卡片过渡外壳（无缝连接分类卡片与展开网格） -->
    <div ref="shellRef" class="folder-card-shell"></div>

    <!-- 3. 居中展开内容区 -->
    <div ref="containerRef" class="folder-container" :style="containerStyle">
      <!-- 文件夹名称标题（左对齐，对齐 22.mp4） -->
      <div class="folder-header">
        <h2 ref="titleRef" class="folder-title">{{ category.name }}</h2>
      </div>

      <!-- 4 列应用网格（动画期间 overflow visible 防止裁剪，静止态允许滚动） -->
      <div class="folder-grid-scroll" :class="{ 'is-animating': phase !== 'open' }">
        <div class="folder-app-grid">
          <div
            v-for="app in allApps"
            :key="app.id"
            :ref="el => setIconRef(app.id, el)"
            class="folder-grid-item"
            @click.stop="handleAppClick(app.id)"
          >
            <AppIcon
              :app="app"
              :size="50"
              :show-label="true"
              :launch-on-click="false"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drawer-folder-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  user-select: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.phase-measuring {
  visibility: hidden;
}

.phase-launching {
  pointer-events: none;
}

.folder-backdrop {
  position: absolute;
  inset: -30px;
  background: rgba(12, 14, 20, 0.72);
  backdrop-filter: blur(36px) saturate(180%);
  -webkit-backdrop-filter: blur(36px) saturate(180%);
  pointer-events: none;
  opacity: 0;
  will-change: opacity;
}

.phase-open .folder-backdrop {
  opacity: 1;
}

/* 一镜到底卡片外壳：起始对齐分类卡片几何与毛玻璃质感，展开时消融，收起时凝聚 */
.folder-card-shell {
  position: absolute;
  pointer-events: none;
  z-index: 1;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.24);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.16);
  transform-origin: 0 0;
  will-change: transform, opacity, border-radius;
  opacity: 0;
}

.folder-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 82%;
  box-sizing: border-box;
  transform: translateY(-16px);
}

/* 标题栏：左对齐大号文字，与整体网格对齐 */
.folder-header {
  margin-top: 0;
  padding: 0 24px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.folder-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  text-align: left;
  line-height: 1.2;
  letter-spacing: -0.3px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  will-change: transform, opacity;
}

.folder-grid-scroll {
  flex: 0 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.folder-grid-scroll.is-animating {
  overflow: visible !important;
}

/* 4 列应用网格：预留顶部 8px 呼吸安全距，防止首行图标角标 (-4px) 被滚动视口裁剪 */
.folder-app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap: 24px;
  column-gap: 12px;
  justify-items: center;
  padding: 8px 20px;
  box-sizing: border-box;
  width: 100%;
}

.folder-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 66px;
  touch-action: none;
  will-change: transform, opacity;
}

.folder-grid-item:active {
  transform: scale(0.88);
}

.folder-grid-item :deep(.app-icon) {
  aspect-ratio: 1 !important;
}

.folder-grid-item :deep(.icon-tile),
.folder-grid-item :deep(.app-icon-anchor) {
  aspect-ratio: 1 !important;
  flex: none !important;
}

.folder-grid-item :deep(.icon-label) {
  opacity: 0;
  will-change: opacity;
}

.phase-open .folder-grid-item :deep(.icon-label) {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .drawer-folder-overlay,
  .folder-backdrop,
  .folder-card-shell,
  .folder-title,
  .folder-grid-item {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}
</style>
