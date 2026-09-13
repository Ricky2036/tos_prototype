<script setup>
import { computed, ref } from 'vue'
import { usePrayerStore } from '../../stores/prayerStore'
import WeatherWidget from './WeatherWidget.vue'
import PhotoWidget from './PhotoWidget.vue'

const prayerStore = usePrayerStore()
const currentMode = computed(() => prayerStore.userMode)

let pointerStartX = 0
let pointerStartY = 0
let isTracking = false
let didSwipe = false
let swipeResetTimer = null

/* 支持在桌面上点击/轻触/滑动手势直接翻转体验 */
function toggleMode() {
  prayerStore.setUserMode(currentMode.value === 'muslim' ? 'normal' : 'muslim')
}

function onStackPointerDown(event) {
  if (event.button != null && event.button !== 0) return
  isTracking = true
  didSwipe = false
  pointerStartX = event.clientX
  pointerStartY = event.clientY
  try {
    event.currentTarget.setPointerCapture(event.pointerId)
  } catch {}
}

function onStackPointerMove(event) {
  if (!isTracking) return
  const dx = event.clientX - pointerStartX
  const dy = event.clientY - pointerStartY
  if (Math.abs(dy) > 16 && Math.abs(dy) > Math.abs(dx) * 1.2) {
    didSwipe = true
  }
}

function onStackPointerUp(event) {
  if (!isTracking) return
  isTracking = false
  try {
    event.currentTarget.releasePointerCapture(event.pointerId)
  } catch {}
  const dx = event.clientX - pointerStartX
  const dy = event.clientY - pointerStartY
  if (Math.abs(dy) >= 20 && Math.abs(dy) > Math.abs(dx) * 1.2) {
    didSwipe = true
    toggleMode()
    clearTimeout(swipeResetTimer)
    swipeResetTimer = setTimeout(() => { didSwipe = false }, 240)
  }
}

function onStackPointerCancel(event) {
  isTracking = false
  try {
    event.currentTarget.releasePointerCapture(event.pointerId)
  } catch {}
}

function onWeatherClick(event) {
  if (didSwipe) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  toggleMode()
}

function onStackClickCapture(event) {
  if (didSwipe) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation?.()
  }
}
</script>

<template>
  <div
    class="smart-suggestion-stack"
    @pointerdown="onStackPointerDown"
    @pointermove="onStackPointerMove"
    @pointerup="onStackPointerUp"
    @pointercancel="onStackPointerCancel"
    @click.capture="onStackClickCapture"
  >
    <!-- 1. 翻转动效过程中的浅色半透明磨砂底板（参考 111.mp4） -->
    <div class="stack-tray-backplate"></div>

    <!-- 2. 普通用户：天气卡片 (默认，点击或上下轻扫翻转至穆斯林模式) -->
    <div
      class="stack-card weather-card"
      :class="{ active: currentMode === 'normal', exited: currentMode === 'muslim' }"
      @click="onWeatherClick"
    >
      <WeatherWidget />
    </div>

    <!-- 3. 穆斯林用户：朝拜时段卡片 (上下轻扫翻转至天气模式，点击进入设置-礼拜模式) -->
    <div
      class="stack-card prayer-card"
      :class="{ active: currentMode === 'muslim', exited: currentMode === 'normal' }"
    >
      <PhotoWidget />
    </div>
  </div>
</template>

<style scoped>
.smart-suggestion-stack {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-widget);
  perspective: 800px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  box-sizing: border-box;
}

/* ================= 浅色半透明磨砂玻璃背板 (111.mp4 翻转过程底衬) ================= */
.stack-tray-backplate {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: var(--radius-widget);
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
  border: 0.5px solid rgba(255, 255, 255, 0.35);
  pointer-events: none;
  z-index: 0;
}

/* ================= 卡片 3D 纵向翻转动效（无缩放畸变，严格 1:1 尺寸） ================= */
.stack-card {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-widget);
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-origin: 50% 50%;
  transition:
    transform 0.54s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.42s ease,
    filter 0.42s ease;
  will-change: transform, opacity, filter;
}

/* 激活展示态：无任何 translateZ 放大，严格 155x155 原大尺寸 */
.stack-card.active {
  transform: translateY(0) rotateX(0deg) scale(1);
  opacity: 1;
  filter: blur(0);
  pointer-events: auto;
  z-index: 2;
}

/* 天气卡片退场（向上立体翻转） */
.weather-card.exited {
  transform: translateY(-55%) rotateX(55deg) scale(0.9);
  opacity: 0;
  filter: blur(1.5px);
  pointer-events: none;
  z-index: 1;
}

/* 穆斯林朝拜卡片退场（向下方隐藏，等待翻入） */
.prayer-card.exited {
  transform: translateY(55%) rotateX(-55deg) scale(0.9);
  opacity: 0;
  filter: blur(1.5px);
  pointer-events: none;
  z-index: 1;
}
</style>
