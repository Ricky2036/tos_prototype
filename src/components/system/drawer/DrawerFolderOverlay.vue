<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { getDrawerAppById } from '../../../config/drawerApps'
import { useHomeStore } from '../../../stores/homeStore'
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

const backdropRef = ref(null)
const titleRef = ref(null)
const overlayRef = ref(null)
const iconRefs = new Map()
const isClosing = ref(false)

function setIconRef(id, el) {
  if (el) iconRefs.set(id, el)
  else iconRefs.delete(id)
}

const OPEN_DURATION = 300
const OPEN_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
const CLOSE_DURATION = 240
const CLOSE_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)'

function openAnimation() {
  // 1. 深色遮罩淡入
  backdropRef.value?.animate([
    { opacity: 0 },
    { opacity: 1 }
  ], {
    duration: OPEN_DURATION,
    easing: OPEN_EASING,
    fill: 'forwards'
  })

  // 2. 标题微移淡入（从顶部微向下落）
  titleRef.value?.animate([
    { opacity: 0, transform: 'translate3d(0, -12px, 0)' },
    { opacity: 1, transform: 'translate3d(0, 0, 0)' }
  ], {
    duration: 260,
    easing: OPEN_EASING,
    fill: 'forwards'
  })

  // 3. 图标 Hero 空间连续性展开动画
  for (const app of allApps.value) {
    const el = iconRefs.get(app.id)
    if (!el) continue

    const anchor = el.querySelector('.app-icon-anchor') || el
    const label = el.querySelector('.icon-label')
    const fromRect = props.origin?.iconRects?.[app.id]

    if (fromRect && anchor) {
      const toRect = anchor.getBoundingClientRect()
      if (toRect.width > 0 && fromRect.width > 0) {
        const dx = fromRect.left - toRect.left
        const dy = fromRect.top - toRect.top
        const scale = fromRect.width / toRect.width

        anchor.animate([
          { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`, transformOrigin: 'top left' },
          { transform: 'translate3d(0, 0, 0) scale(1)', transformOrigin: 'top left' }
        ], {
          duration: OPEN_DURATION,
          easing: OPEN_EASING,
          fill: 'forwards'
        })

        label?.animate([
          { opacity: 0 },
          { opacity: 1 }
        ], {
          duration: 200,
          delay: 80,
          easing: 'ease-out',
          fill: 'forwards'
        })
        continue
      }
    }

    // 若来源未提供该图标（如额外应用），采用优雅缩放淡入
    el.animate([
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1)' }
    ], {
      duration: 260,
      delay: 50,
      easing: OPEN_EASING,
      fill: 'forwards'
    })
  }
}

function closeAnimation() {
  if (isClosing.value) return
  isClosing.value = true

  // 1. 遮罩淡出
  backdropRef.value?.animate([
    { opacity: 1 },
    { opacity: 0 }
  ], {
    duration: CLOSE_DURATION,
    easing: CLOSE_EASING,
    fill: 'forwards'
  })

  // 2. 标题微移淡出
  titleRef.value?.animate([
    { opacity: 1, transform: 'translate3d(0, 0, 0)' },
    { opacity: 0, transform: 'translate3d(0, -8px, 0)' }
  ], {
    duration: 160,
    easing: 'ease-in',
    fill: 'forwards'
  })

  // 3. 图标飞回卡片源位置
  for (const app of allApps.value) {
    const el = iconRefs.get(app.id)
    if (!el) continue

    const anchor = el.querySelector('.app-icon-anchor') || el
    const label = el.querySelector('.icon-label')
    const fromRect = props.origin?.iconRects?.[app.id]

    if (fromRect && anchor) {
      const toRect = anchor.getBoundingClientRect()
      if (toRect.width > 0 && fromRect.width > 0) {
        const dx = fromRect.left - toRect.left
        const dy = fromRect.top - toRect.top
        const scale = fromRect.width / toRect.width

        anchor.animate([
          { transform: 'translate3d(0, 0, 0) scale(1)', transformOrigin: 'top left' },
          { transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`, transformOrigin: 'top left' }
        ], {
          duration: CLOSE_DURATION,
          easing: CLOSE_EASING,
          fill: 'forwards'
        })

        label?.animate([
          { opacity: 1 },
          { opacity: 0 }
        ], {
          duration: 100,
          fill: 'forwards'
        })
        continue
      }
    }

    el.animate([
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.8)' }
    ], {
      duration: 180,
      fill: 'forwards'
    })
  }

  setTimeout(() => {
    emit('close')
  }, CLOSE_DURATION + 10)
}

function handleAppClick(appId) {
  if (isClosing.value) return
  emit('launch-app', appId)
}

function onOverlayClick(e) {
  if (isClosing.value) return
  if (!e.target.closest('.folder-grid-item')) {
    closeAnimation()
  }
}

// 下滑手势支持（对齐 22.mp4）
let startY = 0
let isTracking = false

function onPointerDown(e) {
  if (isClosing.value) return
  startY = e.clientY
  isTracking = true
}

function onPointerMove(e) {
  if (!isTracking || isClosing.value) return
  const dy = e.clientY - startY
  if (dy > 45) {
    isTracking = false
    closeAnimation()
  }
}

function onPointerUp() {
  isTracking = false
}

onMounted(() => {
  nextTick(() => {
    openAnimation()
  })
})
</script>

<template>
  <div
    ref="overlayRef"
    class="drawer-folder-overlay"
    @click="onOverlayClick"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <!-- 全屏深色毛玻璃遮罩（对齐 22.mp4） -->
    <div ref="backdropRef" class="folder-backdrop"></div>

    <!-- 展开内容区 -->
    <div class="folder-container">
      <!-- 文件夹名称标题（左对齐，对齐 22.mp4） -->
      <div class="folder-header">
        <h2 ref="titleRef" class="folder-title">{{ category.name }}</h2>
      </div>

      <!-- 4 列应用网格（对齐 22.mp4） -->
      <div class="folder-grid-scroll">
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

.folder-container {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

/* 顶部标题栏：左对齐大号文字，留白对齐 22.mp4 */
.folder-header {
  margin-top: 76px;
  padding: 0 24px;
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
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 0 40px 0;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

/* 4 列应用网格 */
.folder-app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap: 28px;
  column-gap: 12px;
  justify-items: center;
  padding: 28px 20px 60px;
  box-sizing: border-box;
  width: 100%;
}

.folder-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 66px;
  transition: transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform, opacity;
}

.folder-grid-item:active {
  transform: scale(0.88);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-folder-overlay,
  .folder-backdrop,
  .folder-title,
  .folder-grid-item {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}
</style>
