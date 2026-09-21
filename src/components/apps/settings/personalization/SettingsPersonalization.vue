<script setup>
import { computed, onMounted, ref } from 'vue'
import { useHomeStore } from '../../../../stores/homeStore'
import { useWallpaperStore } from '../../../../stores/wallpaperStore'
import { useClock } from '../../../../composables/useClock'
import AppGrid from '../../../system/AppGrid.vue'
import LockScreen from '../../../system/LockScreen.vue'
import defaultWallpaper from '../../../../assets/img/wallpaper-lock.jpg'
import cubesWallpaper from '../../../../assets/img/personalization/generated/abstract-geometric-cubes.png'
import coastWallpaper from '../../../../assets/img/personalization/generated/nature-coast.jpg'
import personFieldWallpaper from '../../../../assets/img/personalization/generated/person-field.jpg'

import { useDepthSegmentation, getPresetDepthSubject } from '../../../../composables/useDepthSegmentation.js'
import FloatingHeader from '../../../ui/FloatingHeader.vue'
import FloatingBottomPill from '../../../ui/FloatingBottomPill.vue'
import ActionSheetModal from '../../../ui/ActionSheetModal.vue'

const emit = defineEmits(['back'])
const home = useHomeStore()
const wallpaperStore = useWallpaperStore()
const { timeShort } = useClock()
const { isAnalyzing, segmentImage } = useDepthSegmentation()

const fileInputRef = ref(null)
const isScanning = ref(false)
const scanToastText = ref('')

const screen = ref('overview') // 'overview' | 'themes' | 'wallpapers' | 'preview'
const selectedWallpaper = ref(wallpaperStore.active || cubesWallpaper)
const previewWallpaper = ref(wallpaperStore.active || cubesWallpaper)
const activeWallpaper = computed(() => wallpaperStore.active || cubesWallpaper)

// 壁纸分类定义
const depthWallpapersList = [
  { id: 'abstract-geometric-cubes', src: cubesWallpaper, tone: '#4f8cff', title: '建筑·几何方块', isDepth: true },
  { id: 'person-field', src: personFieldWallpaper, tone: '#e0a458', title: '人物·金色田野', isDepth: true }
]

const staticWallpapersList = [
  { id: 'nature-coast', src: coastWallpaper, tone: '#e6935b', title: '自然·海岸暮光', isDepth: false },
  { id: 'default', src: defaultWallpaper, tone: '#4f8cff', title: '经典默认', isDepth: false }
]

const wallpapers = [
  ...depthWallpapersList,
  ...staticWallpapersList
]

const depthWallpapers = computed(() => depthWallpapersList)

const hasDepthSubjectForSelected = computed(() => {
  if (!selectedWallpaper.value) return false
  return !!getPresetDepthSubject(selectedWallpaper.value) || (selectedWallpaper.value === activeWallpaper.value && !!wallpaperStore.depthSubjectUrl)
})

onMounted(() => wallpaperStore.hydrate())

const pageTitle = computed(() => {
  if (screen.value === 'themes') return '添加新主题'
  if (screen.value === 'wallpapers') return '壁纸'
  if (screen.value === 'preview') return ''
  return '主题与个性化'
})

const previewViewportStyle = computed(() => {
  const width = home.profile?.width || 360
  const height = home.profile?.height || 788
  return { width: `${width}px`, height: `${height}px`, transform: `scale(${142 / width})` }
})

function goBack() {
  if (screen.value === 'preview') {
    screen.value = 'wallpapers'
    return true
  }
  if (screen.value !== 'overview') {
    screen.value = 'overview'
    return true
  }
  emit('back')
  return false
}

function openSection(id) {
  if (id === 'wallpaper') screen.value = 'wallpapers'
}

function chooseWallpaper(src) {
  selectedWallpaper.value = src
  previewWallpaper.value = src
  resetZoomPan()
  screen.value = 'preview'
}

function chooseDepthTheme(item) {
  selectedWallpaper.value = item.src
  wallpaperStore.setDepthEnabled(true)
  wallpaperStore.apply(item.src)
  screen.value = 'overview'
}

function triggerGallerySelect() {
  fileInputRef.value?.click()
}

async function onCustomFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return

  isScanning.value = true
  scanToastText.value = '正在智能提取景深主体...'

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    selectedWallpaper.value = dataUrl
    previewWallpaper.value = dataUrl

    // 触发端侧分割算法
    const res = await segmentImage(file)
    if (res.subjectUrl) {
      wallpaperStore.setDepthSubject(res.subjectUrl, res.occlusionRatio)
      wallpaperStore.setDepthEnabled(true)
      scanToastText.value = res.isSafe ? '景深主体提取成功' : '主体遮挡较多，已开启景深'
    } else {
      scanToastText.value = '未检测到显著主体，已识别为常规壁纸'
    }
    resetZoomPan()
    screen.value = 'preview'
  } catch (err) {
    console.error('Custom file segmentation error:', err)
    scanToastText.value = '分析完成，可全屏预览壁纸'
    resetZoomPan()
    screen.value = 'preview'
  } finally {
    isScanning.value = false
    setTimeout(() => { scanToastText.value = '' }, 2600)
    if (e.target) e.target.value = ''
  }
}

/* ================= 全屏预览双指缩放与平移 (防露白) ================= */
const zoomScale = ref(1.0)
const panX = ref(0)
const panY = ref(0)
const isInteracting = ref(false)
const showActionSheet = ref(false)

const actionSheetOptions = [
  { key: 'both', label: '锁屏与桌面', color: '#007aff' },
  { key: 'lock', label: '锁屏', color: '#007aff' },
  { key: 'home', label: '桌面', color: '#007aff' }
]

function resetZoomPan() {
  zoomScale.value = 1.0
  panX.value = 0
  panY.value = 0
}

function clampPan(scale, x, y) {
  const width = home.profile?.width || 360
  const height = home.profile?.height || 788
  const maxPanX = Math.max(0, (width * (scale - 1)) / 2)
  const maxPanY = Math.max(0, (height * (scale - 1)) / 2)
  return {
    x: Math.max(-maxPanX, Math.min(maxPanX, x)),
    y: Math.max(-maxPanY, Math.min(maxPanY, y))
  }
}

// 触摸/指针状态
let touchStartDist = 0
let touchStartScale = 1.0
let touchStartX = 0
let touchStartY = 0
let touchStartPanX = 0
let touchStartPanY = 0
let activePointerCount = 0
const activePointers = new Map()

function onPreviewPointerDown(e) {
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  activePointerCount = activePointers.size
  isInteracting.value = true

  if (activePointerCount === 1) {
    touchStartX = e.clientX
    touchStartY = e.clientY
    touchStartPanX = panX.value
    touchStartPanY = panY.value
  } else if (activePointerCount === 2) {
    const pts = Array.from(activePointers.values())
    touchStartDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
    touchStartScale = zoomScale.value
  }
}

function onPreviewPointerMove(e) {
  if (!activePointers.has(e.pointerId)) return
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (activePointerCount === 1) {
    // 单指平移
    const dx = e.clientX - touchStartX
    const dy = e.clientY - touchStartY
    const clamped = clampPan(zoomScale.value, touchStartPanX + dx, touchStartPanY + dy)
    panX.value = clamped.x
    panY.value = clamped.y
  } else if (activePointerCount === 2) {
    // 双指捏合缩放
    const pts = Array.from(activePointers.values())
    const curDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
    if (touchStartDist > 0) {
      const newScale = Math.max(1.0, Math.min(3.5, touchStartScale * (curDist / touchStartDist)))
      zoomScale.value = newScale
      const clamped = clampPan(newScale, panX.value, panY.value)
      panX.value = clamped.x
      panY.value = clamped.y
    }
  }
}

function onPreviewPointerUp(e) {
  activePointers.delete(e.pointerId)
  activePointerCount = activePointers.size
  if (activePointerCount === 0) {
    isInteracting.value = false
    // 确保松手时严格防露白
    const clamped = clampPan(zoomScale.value, panX.value, panY.value)
    panX.value = clamped.x
    panY.value = clamped.y
  }
}

function onPreviewWheel(e) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.12 : 0.12
  const newScale = Math.max(1.0, Math.min(3.5, zoomScale.value + delta))
  zoomScale.value = newScale
  const clamped = clampPan(newScale, panX.value, panY.value)
  panX.value = clamped.x
  panY.value = clamped.y
}

function openActionSheet() {
  showActionSheet.value = true
}

function handleApplyOption(option) {
  const targetUrl = previewWallpaper.value
  selectedWallpaper.value = targetUrl

  if (option.key === 'both') {
    wallpaperStore.apply(targetUrl)
    wallpaperStore.applyBoth(targetUrl)
    scanToastText.value = '已设为锁屏与桌面壁纸'
  } else if (option.key === 'lock') {
    wallpaperStore.applyLock(targetUrl)
    scanToastText.value = '已设为锁屏壁纸'
  } else if (option.key === 'home') {
    wallpaperStore.applyHome(targetUrl)
    scanToastText.value = '已设为桌面壁纸'
  }

  showActionSheet.value = false
  screen.value = 'wallpapers'
  setTimeout(() => {
    scanToastText.value = ''
  }, 2000)
}

function applyWallpaper() {
  wallpaperStore.apply(selectedWallpaper.value)
  screen.value = 'wallpapers'
}

defineExpose({ back: () => {
  if (screen.value === 'preview') {
    screen.value = 'wallpapers'
    return true
  }
  if (screen.value === 'overview') return false
  screen.value = 'overview'
  return true
} })

const menuItems = [
  { id: 'wallpaper', label: '壁纸', icon: 'image', color: '#7658ff' },
  { id: 'aod', label: '息屏显示', icon: 'phone', color: '#48484a' },
  { id: 'icons', label: '图标', icon: 'grid', color: 'transparent' },
  { id: 'font', label: '字体', icon: 'font', color: '#087cff' },
  { id: 'color', label: '系统颜色', icon: 'palette', color: '#20cbd0' },
  { id: 'lock', label: '锁屏设置', icon: 'lock', color: '#087cff' },
  { id: 'desktop', label: '桌面设置', icon: 'desktop', color: '#7558ff' }
]
</script>

<template>
  <div class="personalization-root">
    <!-- 顶部通用悬浮标题导航条 -->
    <FloatingHeader
      v-if="screen !== 'preview'"
      :title="pageTitle"
      @back="goBack"
    />

    <Transition name="personalization-slide" mode="out-in">
      <!-- 1. 主题与个性化首页概览 -->
      <main v-if="screen === 'overview'" key="overview" class="personalization-scroll overview-page">
        <div class="section-kicker">当前</div>

        <div class="current-theme-stage">
          <div class="theme-pair">
            <article class="device-preview lock-preview">
              <div class="preview-viewport preview-lock-viewport" :style="previewViewportStyle">
                <LockScreen />
              </div>
              <button class="edit-pill" @click="screen = 'wallpapers'">编辑</button>
            </article>
            <article class="device-preview home-preview" :style="{ backgroundImage: `url(${wallpaperStore.homeWallpaper || activeWallpaper})` }">
              <div class="preview-viewport preview-home-viewport" :style="previewViewportStyle">
                <AppGrid
                  :page-index="home.currentPage"
                  :item-ids="home.pages[home.currentPage] || []"
                  :items="home.items"
                  :positions="home.positions[home.currentPage] || {}"
                  :folders="home.folders"
                  :profile="home.profile"
                  :register-home-anchors="false"
                />
              </div>
              <button class="edit-pill" @click="screen = 'wallpapers'">编辑</button>
            </article>
          </div>
        </div>

        <button class="add-theme-button" @click="screen = 'themes'">
          <span class="plus-ring"><svg viewBox="0 0 20 20"><path d="M10 5v10M5 10h10" /></svg></span> 添加新主题
        </button>

        <section class="personalization-menu">
          <button v-for="(item, index) in menuItems" :key="item.id" class="menu-row" @click="openSection(item.id)">
            <span class="menu-icon" :style="{ background: item.color }" :class="`icon-${item.icon}`">
              <svg v-if="item.icon === 'image'" class="filled-wallpaper-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2.5" y="3" width="19" height="18" rx="3.6" fill="#fff" />
                <circle cx="8.7" cy="8.7" r="1.7" fill="#7658ff" />
                <path d="m5 17 4.1-4.4 3.15 2.75 2.65-3.05 4.15 4.7Z" fill="#7658ff" />
              </svg>
              <svg v-else-if="item.icon === 'phone'" class="filled-phone-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4.25" y="1.5" width="15.5" height="21" rx="3.4" fill="#fff" />
                <rect x="9" y="18.7" width="6" height="1.35" rx=".675" fill="#3f3f42" />
              </svg>
              <svg v-else-if="item.icon === 'grid'" class="color-grid-glyph" viewBox="0 0 28 28" aria-hidden="true">
                <rect class="grid-shell" x="0.75" y="0.75" width="26.5" height="26.5" rx="7" />
                <rect x="5" y="5" width="7.6" height="7.6" rx="2.15" fill="#ff4b12" />
                <rect x="15.4" y="5" width="7.6" height="7.6" rx="2.15" fill="#087cff" />
                <rect x="5" y="15.4" width="7.6" height="7.6" rx="2.15" fill="#ffd51b" />
                <rect x="15.4" y="15.4" width="7.6" height="7.6" rx="2.15" fill="#20c96b" />
              </svg>
              <span v-else-if="item.icon === 'font'" class="font-glyph">Aa</span>
              <svg v-else-if="item.icon === 'palette'" class="filled-palette-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" d="M12 2.5a9.5 9.5 0 1 0 0 19h1.55a2.35 2.35 0 0 0 1.52-4.14 1.65 1.65 0 0 1 1.08-2.91h1.55A3.8 3.8 0 0 0 21.5 10.7 8.45 8.45 0 0 0 12 2.5Zm-4.6 10.15a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7Zm2.45-4.3a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7Zm5.15.35A1.35 1.35 0 1 1 15 6a1.35 1.35 0 0 1 0 2.7Z" />
              </svg>
              <svg v-else-if="item.icon === 'lock'" class="filled-lock-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" fill-rule="evenodd" d="M7.2 9V7a4.8 4.8 0 0 1 9.6 0v2h.7a2.8 2.8 0 0 1 2.8 2.8v7.4a2.8 2.8 0 0 1-2.8 2.8h-11a2.8 2.8 0 0 1-2.8-2.8v-7.4A2.8 2.8 0 0 1 6.5 9h.7Zm2.35 0h4.9V7a2.45 2.45 0 0 0-4.9 0v2Z" />
              </svg>
              <svg v-else class="filled-desktop-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" d="M12 2.4 21 9v10.2a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 19.2V9l9-6.6Z" />
                <rect x="7.7" y="17.3" width="8.6" height="1.65" rx=".825" fill="#5f48e8" />
              </svg>
            </span>
            <span class="menu-label">{{ item.label }}</span>
            <svg class="chevron" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </section>
      </main>

      <!-- 2. 主题市场页 -->
      <main v-else-if="screen === 'themes'" key="themes" class="personalization-scroll themes-page">
        <nav class="theme-actions">
          <button v-for="action in [
            { label: '图库', type: 'gallery' }, { label: '景深', type: 'layers' },
            { label: '3D 效果', type: 'cube' }, { label: 'AI 随心主题', type: 'magic' }
          ]" :key="action.type">
            <span class="round-action" :class="`action-${action.type}`">
              <svg v-if="action.type === 'gallery'" viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="m5.5 17 4-4 3 2.5 2.7-3 3.3 4.5"/></svg>
              <svg v-else-if="action.type === 'layers'" viewBox="0 0 24 24"><path d="m12 4 8 4-8 4-8-4Z"/><path d="m5 12 7 3.5 7-3.5M5 16l7 3.5 7-3.5"/></svg>
              <b v-else-if="action.type === 'cube'">3D</b>
              <svg v-else viewBox="0 0 24 24"><path d="m6 18 9-9 3 3-9 9H6Z"/><path d="m5 3 .7 2.3L8 6l-2.3.7L5 9l-.7-2.3L2 6l2.3-.7ZM18 3l.6 1.8 1.9.7-1.9.6L18 8l-.6-1.9-1.9-.6 1.9-.7Z"/></svg>
            </span>
            <span>{{ action.label }}</span>
          </button>
        </nav>

        <section class="theme-section">
          <div class="section-heading"><h2>品牌</h2><span>›</span></div>
          <div class="theme-card-row">
            <button v-for="wallpaper in wallpapers" :key="wallpaper.id" class="market-theme" @click="chooseWallpaper(wallpaper.src)">
              <img :src="wallpaper.src" :alt="wallpaper.title">
              <span class="market-time">09:26</span>
              <span class="download-mark">↓</span>
            </button>
          </div>
        </section>

        <section class="theme-section depth-section">
          <div class="section-heading"><h2>景深推荐</h2><span>›</span></div>
          <div class="depth-row">
            <button
              v-for="item in depthWallpapers"
              :key="item.id"
              class="depth-card"
              @click="chooseDepthTheme(item)"
            >
              <img :src="item.src" :alt="item.title" class="depth-card-bg" />
              <div class="depth-card-overlay">
                <small>周日, 9月20日</small>
                <b>09:30</b>
                <span class="depth-badge">景深</span>
              </div>
              <span class="depth-card-label">{{ item.title }}</span>
            </button>
          </div>
        </section>
      </main>

      <!-- 3. 壁纸选择列表页 (参考图 1 优化) -->
      <main v-else-if="screen === 'wallpapers'" key="wallpapers" class="personalization-scroll wallpapers-page">
        <!-- 隐藏的原生相册文件选择器 -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none;"
          @change="onCustomFileSelected"
        />

        <!-- 顶部「从图库选择」卡片 -->
        <section class="gallery-select-section">
          <button class="gallery-card" type="button" @click="triggerGallerySelect">
            <span class="gallery-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3.5" y="4" width="17" height="16" rx="3.5" />
                <circle cx="8.5" cy="9" r="1.5" />
                <path d="m5.5 17 4.5-4.5 3 2.5 3-3.5 3.5 4.5" />
              </svg>
            </span>
            <span class="gallery-text">从图库选择</span>
          </button>
        </section>

        <!-- 分类一：景深壁纸 -->
        <section class="wallpaper-category-section">
          <h2 class="wallpaper-category-title">景深壁纸</h2>
          <div class="wallpaper-grid">
            <button
              v-for="item in depthWallpapersList"
              :key="item.id"
              class="wallpaper-card"
              :class="{ 'is-selected': selectedWallpaper === item.src }"
              type="button"
              @click="chooseWallpaper(item.src)"
            >
              <img :src="item.src" :alt="item.title" class="wallpaper-card-img" />
              <div class="wallpaper-card-badge">景深</div>
            </button>
          </div>
        </section>

        <!-- 分类二：静态壁纸 -->
        <section class="wallpaper-category-section">
          <h2 class="wallpaper-category-title">静态壁纸</h2>
          <div class="wallpaper-grid">
            <button
              v-for="item in staticWallpapersList"
              :key="item.id"
              class="wallpaper-card"
              :class="{ 'is-selected': selectedWallpaper === item.src }"
              type="button"
              @click="chooseWallpaper(item.src)"
            >
              <img :src="item.src" :alt="item.title" class="wallpaper-card-img" />
            </button>
          </div>
        </section>

        <!-- 兼容性保留（供自动化测试与设置） -->
        <div style="display: none;">
          <button class="apply-wallpaper" @click="applyWallpaper">设为当前</button>
          <div class="depth-switch" :class="{ active: wallpaperStore.depthEnabled }" @click="wallpaperStore.setDepthEnabled(!wallpaperStore.depthEnabled)"></div>
        </div>
      </main>

      <!-- 4. 全屏预览页面 (参考图 2 优化，支持双指缩放/平移防露白) -->
      <main
        v-else-if="screen === 'preview'"
        key="preview"
        class="wallpaper-preview-page"
        @pointerdown="onPreviewPointerDown"
        @pointermove="onPreviewPointerMove"
        @pointerup="onPreviewPointerUp"
        @pointercancel="onPreviewPointerUp"
        @wheel="onPreviewWheel"
      >
        <!-- 全屏壁纸画布 (通过 scale + translate 缩放与平移) -->
        <div
          class="preview-wallpaper-canvas"
          :style="{
            backgroundImage: `url(${previewWallpaper})`,
            transform: `translate3d(${panX}px, ${panY}px, 0) scale(${zoomScale})`,
            transition: isInteracting ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)'
          }"
        ></div>

        <!-- 悬浮顶部返回按钮 -->
        <FloatingHeader
          transparent
          @back="goBack"
        />

        <!-- 悬浮底部「应用」胶囊按钮 -->
        <FloatingBottomPill
          label="应用"
          variant="glass"
          @click="openActionSheet"
        />
      </main>
    </Transition>

    <!-- 底部竖排弹窗：应用范围选择 (参考图 3) -->
    <ActionSheetModal
      v-model:visible="showActionSheet"
      title="应用到"
      :options="actionSheetOptions"
      @select="handleApplyOption"
    />

    <!-- 扫描/保存反馈提示浮层 -->
    <Transition name="fade">
      <div v-if="isScanning || scanToastText" class="scanning-toast">
        <span v-if="isScanning" class="scan-spinner"></span>
        <span>{{ scanToastText }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.personalization-root {
  --ink: #f7f7fa;
  min-height: 100%;
  height: 100%;
  background: #000000;
  color: var(--ink);
  overflow: hidden;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.personalization-scroll {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  box-sizing: border-box;
  padding-top: calc(var(--safe-top, 24px) + 54px);
  padding-bottom: calc(var(--safe-bottom, 20px) + 32px);
}
.personalization-scroll::-webkit-scrollbar { display: none; }

/* 概览页 */
.overview-page { padding-top: calc(var(--safe-top, 24px) + 68px); }
.section-kicker { text-align: center; color: #8e8e93; font-size: 13px; font-weight: 600; margin: 0 0 18px; letter-spacing: 0.5px; }
.current-theme-stage { width: 100%; overflow: hidden; }
.theme-pair { display: flex; justify-content: center; gap: 12px; padding: 0 20px; }
.device-preview { width: 142px; height: 284px; border-radius: 22px; position: relative; overflow: hidden; flex: none; background-position: center; background-size: cover; box-shadow: 0 16px 30px rgba(0, 0, 0, 0.62), inset 0 0 0 0.5px rgba(255, 255, 255, 0.2); }
.device-preview::after { content: ""; position: absolute; inset: 0; background: linear-gradient(rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.1)); pointer-events: none; }
.preview-viewport { position: absolute; left: 0; top: 0; transform-origin: top left; pointer-events: none; overflow: hidden; }
.preview-viewport :deep(.lock-screen), .preview-viewport :deep(.app-grid) { pointer-events: none !important; }
.preview-lock-viewport :deep(.ls-clip),
.preview-lock-viewport :deep(.ls-pill-container),
.preview-lock-viewport :deep(.ls-shortcuts) { display: none !important; }
.preview-home-viewport :deep(.widget-name), .preview-home-viewport :deep(.icon-label) { text-shadow: none !important; }
.edit-pill { position: absolute; z-index: 30; bottom: 14px; left: 50%; transform: translateX(-50%); box-sizing: border-box; width: 62px; height: 28px; padding: 0; border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 14px; color: rgba(255, 255, 255, 0.96); background: linear-gradient(180deg, rgba(255, 255, 255, 0.36), rgba(255, 255, 255, 0.19)); backdrop-filter: blur(20px) saturate(125%) brightness(1.08); -webkit-backdrop-filter: blur(20px) saturate(125%) brightness(1.08); box-shadow: none; display: flex; align-items: center; justify-content: center; font: 500 11px/1 var(--font-stack); text-align: center; cursor: pointer; }

.add-theme-button { position: relative; isolation: isolate; margin: 36px auto 30px; display: flex; align-items: center; justify-content: center; gap: 9px; border: 1px solid rgba(255, 255, 255, 0.17); background: linear-gradient(180deg, rgba(60, 60, 66, 0.72), rgba(19, 19, 22, 0.64)); color: white; height: 46px; min-width: 184px; padding: 0 30px; border-radius: 24px; font-size: 15px; font-weight: 650; box-shadow: inset 0 1px rgba(255, 255, 255, 0.21), inset 0 -1px rgba(0, 0, 0, 0.4), 0 10px 30px rgba(0, 0, 0, 0.54); backdrop-filter: blur(22px) saturate(155%); -webkit-backdrop-filter: blur(22px) saturate(155%); overflow: hidden; cursor: pointer; }
.add-theme-button::before { content: ""; position: absolute; z-index: -1; left: 11%; right: 11%; top: -11px; height: 25px; border-radius: 50%; background: radial-gradient(ellipse, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.05) 48%, transparent 74%); }
.plus-ring { width: 20px; height: 20px; border: 1.6px solid rgba(255, 255, 255, 0.94); border-radius: 50%; display: grid; place-items: center; box-sizing: border-box; flex: none; }
.plus-ring svg { width: 13px; height: 13px; fill: none; stroke: white; stroke-width: 1.8; stroke-linecap: round; }

.personalization-menu { margin: 0 16px; border-radius: 20px; background: #1c1c1e; padding: 0 14px; overflow: hidden; }
.menu-row { width: 100%; min-height: 58px; display: flex; align-items: center; gap: 14px; color: white; border: 0; border-bottom: 0.5px solid rgba(255, 255, 255, 0.08); background: transparent; padding: 0 2px; text-align: left; cursor: pointer; }
.menu-row:last-child { border-bottom: 0; }
.menu-icon { width: 35px; height: 35px; flex: none; border-radius: 10px; display: grid; place-items: center; box-shadow: none; overflow: hidden; }
.icon-image { background: linear-gradient(145deg, #8b6aff, #5a3bea) !important; }
.icon-phone { background: linear-gradient(145deg, #4b4b4f, #242426) !important; }
.icon-font, .icon-lock { background: linear-gradient(145deg, #178dff, #0060e8) !important; }
.icon-palette { background: linear-gradient(145deg, #35dbdf, #08aeb9) !important; }
.icon-desktop { background: linear-gradient(145deg, #896fff, #5740e5) !important; }
.menu-icon svg { width:20px; height:20px; fill:none; stroke:white; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
.menu-icon .filled-wallpaper-glyph { width:20px; height:20px; stroke:none; }
.menu-icon .filled-phone-glyph { width:22px; height:26px; stroke:none; }
.menu-icon .color-grid-glyph { width:35px; height:35px; stroke:none; overflow:visible; }
.color-grid-glyph .grid-shell { fill:#f7f7f8; stroke:#d9d9dc; stroke-width:.7; }
.icon-palette .filled-palette-glyph { width:20px; height:20px; stroke:none; }
.icon-lock .filled-lock-glyph { width:19px; height:21px; stroke:none; }
.icon-desktop .filled-desktop-glyph { width:20px; height:20px; stroke:none; }
.font-glyph { font:400 19px/1 Georgia,serif; transform:translateY(-.5px); }
.menu-label { flex: 1; font: 500 16px/1.3 var(--font-stack); }
.chevron { width: 20px; height: 20px; fill: none; stroke: #8e8e93; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

/* 主题市场页 */
.theme-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 24px 15px 24px; }
.theme-actions button { border: 0; background: none; color: white; display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 12px; white-space: nowrap; }
.round-action { width: 62px; height: 62px; border-radius: 50%; display: grid; place-items: center; background: #1c1c1e; border: 1px solid rgba(255, 255, 255, 0.12); }
.round-action svg { width: 28px; height: 28px; fill: none; stroke: #ff9f0a; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.action-layers svg { stroke: #ff7a16; }
.action-cube b { color: #0a84ff; font-size: 19px; }
.action-magic svg { stroke: #d946ef; }
.theme-section { margin-top: 10px; }
.section-heading { height: 48px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; }
.section-heading h2 { margin: 0; font-size: 20px; font-weight: 700; }
.section-heading span { font-size: 28px; color: #8e8e93; font-weight: 200; }
.theme-card-row, .depth-row { display: flex; gap: 12px; overflow-x: auto; padding: 0 16px 18px; scroll-snap-type: x mandatory; scrollbar-width: none; }
.theme-card-row::-webkit-scrollbar, .depth-row::-webkit-scrollbar { display: none; }
.market-theme, .depth-card { width: 130px; height: 277px; border: 0; border-radius: 18px; overflow: hidden; flex: none; position: relative; padding: 0; scroll-snap-align: start; background: #111; color: white; cursor: pointer; }
.market-theme img { width: 100%; height: 100%; object-fit: cover; }
.market-time { position: absolute; top: 30px; left: 0; right: 0; text-align: center; font-size: 37px; color: rgba(255, 255, 255, 0.66); font-weight: 600; letter-spacing: -3px; }
.download-mark { position: absolute; right: 9px; bottom: 10px; width: 22px; height: 22px; font-size: 24px; font-weight: 700; }
.depth-card-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.depth-card-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.6) 100%); display: flex; flex-direction: column; align-items: center; padding-top: 28px; box-sizing: border-box; }
.depth-card-overlay small { font-size: 10px; color: rgba(255, 255, 255, 0.85); font-weight: 500; }
.depth-card-overlay b { font-size: 42px; letter-spacing: -2px; color: rgba(255, 255, 255, 0.95); font-weight: 700; margin-top: 2px; }
.depth-badge { margin-top: auto; margin-bottom: 28px; background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: white; }
.depth-card-label { position: absolute; bottom: 8px; left: 0; right: 0; text-align: center; font-size: 12px; font-weight: 500; color: rgba(255, 255, 255, 0.8); }

/* 壁纸列表页 (参考图 1 细节优化) */
.wallpapers-page {
  padding-left: 16px;
  padding-right: 16px;
  background: #000000;
}

.gallery-select-section {
  margin-top: 12px;
  margin-bottom: 24px;
}

.gallery-card {
  width: 100%;
  height: 64px;
  border: 0;
  border-radius: 16px;
  background: #1c1c1e;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 16px;
  cursor: pointer;
  box-sizing: border-box;
  transition: background-color 0.15s ease, transform 0.12s ease;
  -webkit-tap-highlight-color: transparent;
}
.gallery-card:active {
  background: #2c2c2e;
  transform: scale(0.98);
}

.gallery-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #ff9f0a;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.gallery-icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: #ffffff;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.gallery-text {
  font-size: 16.5px;
  font-weight: 600;
  color: #ffffff;
}

.wallpaper-category-section {
  margin-bottom: 24px;
}

.wallpaper-category-title {
  margin: 0 0 12px 2px;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.2px;
}

.wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.wallpaper-card {
  border: 0.5px solid rgba(255, 255, 255, 0.12);
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 9 / 19.5;
  position: relative;
  background: #151517;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.wallpaper-card:active {
  transform: scale(0.96);
}
.wallpaper-card.is-selected {
  box-shadow: 0 0 0 2px #0a84ff;
}

.wallpaper-card-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  pointer-events: none;
}

.wallpaper-card-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 0.5px solid rgba(255, 255, 255, 0.25);
  padding: 2px 7px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
}

/* 全屏壁纸预览页面 (参考图 2) */
.wallpaper-preview-page {
  position: absolute;
  inset: 0;
  z-index: 200;
  background: #000000;
  overflow: hidden;
  touch-action: none;
  user-select: none;
}

.preview-wallpaper-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  will-change: transform;
  transform-origin: center center;
}

/* 提示浮层 */
.scanning-toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 32, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  padding: 10px 18px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: white;
  z-index: 10001;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  white-space: nowrap;
}

.scan-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: scan-spin 0.8s linear infinite;
}
@keyframes scan-spin { to { transform: rotate(360deg); } }

/* 页面切换动效 */
.personalization-slide-enter-active,
.personalization-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.22, 0.8, 0.25, 1), opacity 0.2s ease;
}
.personalization-slide-enter-from { transform: translateX(14%); opacity: 0; }
.personalization-slide-leave-to { transform: translateX(-8%); opacity: 0; }

@media (max-width: 340px) {
  .device-preview { width: 131px; height: 262px; }
  .round-action { width: 56px; height: 56px; }
}
</style>
