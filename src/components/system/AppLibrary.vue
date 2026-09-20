<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DRAWER_APPS, ALPHABET_LIST, getAlphabeticalGroups } from '../../config/drawerApps'
import { DRAWER_CATEGORIES } from '../../config/drawerCategories'
import { useSystemStore } from '../../stores/systemStore'
import { useHomeStore } from '../../stores/homeStore'
import { useSwipeGesture } from '../../composables/useSwipeGesture'
import { getDriver } from '../../composables/driverRegistry'
import { clamp, rubberBand } from '../../utils/math'
import DrawerCapsuleTabs from './drawer/DrawerCapsuleTabs.vue'
import AlphabetScrubber from './drawer/AlphabetScrubber.vue'
import CategoryCard from './drawer/CategoryCard.vue'
import DrawerFolderOverlay from './drawer/DrawerFolderOverlay.vue'
import DrawerSearchBar from './drawer/DrawerSearchBar.vue'
import AppIcon from '../ui/AppIcon.vue'

const system = useSystemStore()
const home = useHomeStore()

const overlay = computed(() => system.overlays.appLibrary)
const visible = computed(() => overlay.value.status !== 'closed')

// 垂直纵向滑入/滑出：translateY(100% -> 0%)
const layerStyle = computed(() => ({
  transform: `translateY(${(1 - overlay.value.progress) * 100}%)`
}))

const blurStyle = computed(() => ({
  opacity: clamp(overlay.value.progress * 1.2, 0, 1)
}))

// 当前活动 Tab: 'all' | 'category'
const currentTab = ref('all')
const isScrubbing = ref(false)
const isSearchActive = ref(false)

// 字母聚焦/过滤模式：点击/拖拽右侧导轨时激活，隐藏其他图标和界面
const isFilterMode = ref(false)
const filterLetter = ref('D')

const isInstalled = (id) => (home.appInstalled ? home.appInstalled(id) : true)

const allGroups = computed(() => {
  const raw = getAlphabeticalGroups()
  const filtered = {}
  for (const [k, list] of Object.entries(raw)) {
    filtered[k] = list.filter((a) => isInstalled(a.id))
  }
  return filtered
})

const lettersWithApps = computed(() => {
  return ALPHABET_LIST.filter((l) => (allGroups.value[l] || []).length > 0)
})

const activeLetter = ref('D')

const pinnedApps = computed(() => DRAWER_APPS.filter((a) => a.pinned && isInstalled(a.id)))

// 展平成单一连续紧凑的 4 列应用流（真实桌面应用）
const alphabeticalAppList = computed(() => {
  const list = []
  const seenInitials = new Set()
  for (const letter of ALPHABET_LIST) {
    const group = allGroups.value[letter] || []
    for (const app of group) {
      const isFirst = !seenInitials.has(app.initial)
      if (isFirst) {
        seenInitials.add(app.initial)
      }
      list.push({
        ...app,
        isFirstOfLetter: isFirst
      })
    }
  }
  return list
})

// 过滤模式下仅展示当前选中字母的应用
const filteredApps = computed(() => {
  return allGroups.value[filterLetter.value] || []
})

/**
 * 字母过滤模式下右对齐布局（对齐 media_1789877584491.jpg）：
 * 每一行应用向右对齐，紧贴右侧导轨方向排布。
 * 若某行不足 4 个应用（如 3 个），起始列为 4 - count + 1（即从第 2 列开始），第 1 列留空；
 * 确保第 4 列应用始终对齐上方的大号字母标题。
 */
function getFilteredItemStyle(index, total) {
  if (index % 4 === 0) {
    const rowLen = Math.min(4, total - index)
    return {
      gridColumnStart: 4 - rowLen + 1
    }
  }
  return undefined
}

const rootRef = ref(null)
const scrollContainerRef = ref(null)

// 字母段元素位置缓存
const sectionTops = ref({})

function updateSectionTops() {
  if (!scrollContainerRef.value) return
  const containerRect = scrollContainerRef.value.getBoundingClientRect()
  const tops = {}
  for (const letter of lettersWithApps.value) {
    const el = scrollContainerRef.value.querySelector(`#section-${letter}`)
    if (el) {
      tops[letter] = el.getBoundingClientRect().top - containerRect.top + scrollContainerRef.value.scrollTop
    }
  }
  sectionTops.value = tops
}

function handleScroll() {
  if (isScrubbing.value || isFilterMode.value || currentTab.value !== 'all' || !scrollContainerRef.value) return
  const scrollTop = scrollContainerRef.value.scrollTop + 90
  let current = lettersWithApps.value[0] || 'D'
  for (const letter of lettersWithApps.value) {
    if (sectionTops.value[letter] != null && sectionTops.value[letter] <= scrollTop) {
      current = letter
    }
  }
  activeLetter.value = current
}

function scrollToLetter(letter) {
  if (!scrollContainerRef.value) return
  const el = scrollContainerRef.value.querySelector(`#section-${letter}`)
  if (el) {
    const container = scrollContainerRef.value
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const targetScrollTop = container.scrollTop + (elRect.top - containerRect.top) - 10
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: isScrubbing.value ? 'auto' : 'smooth'
    })
  }
}

/** 点击或滑动右侧字母导航：激活字母聚焦过滤模式 */
function handleSelectLetter(letter) {
  activeLetter.value = letter
  filterLetter.value = letter
  const apps = allGroups.value[letter] || []
  if (apps.length > 0) {
    isFilterMode.value = true
  } else {
    // 当前字母没有相关应用直接隐藏，不用一直展示出来
    isFilterMode.value = false
    scrollToLetter(letter)
  }
}

function handleScrubbing(scrubbing, letter) {
  isScrubbing.value = scrubbing
  if (letter) {
    activeLetter.value = letter
    filterLetter.value = letter
    const apps = allGroups.value[letter] || []
    if (apps.length > 0) {
      isFilterMode.value = true
    } else {
      // 当前字母没有相关应用直接隐藏
      isFilterMode.value = false
      scrollToLetter(letter)
    }
  }
}

function exitFilterMode() {
  isFilterMode.value = false
}

// 大文件夹展开视图状态（参考 22.mp4）
const activeCategoryFolder = ref(null)
const folderOriginGeometry = ref(null)

function handleOpenCategoryFolder({ category, origin }) {
  activeCategoryFolder.value = category
  folderOriginGeometry.value = origin
}

function handleCloseCategoryFolder() {
  activeCategoryFolder.value = null
  folderOriginGeometry.value = null
}

function handleCategoryFolderLaunchApp(appId) {
  handleCloseCategoryFolder()
  launchApp(appId)
}

watch(currentTab, () => {
  isFilterMode.value = false
  handleCloseCategoryFolder()
  overscrollOffset.value = 0
  isBouncing.value = false
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
  }
})

watch(() => overlay.value.status, (status) => {
  if (status === 'closed' || status === 'closing') {
    handleCloseCategoryFolder()
    overscrollOffset.value = 0
    isBouncing.value = false
  }
})

/* ── 上滑阻尼橡皮筋回弹动效（内容完全显示或处于最底部继续上滑时生效） ── */
const overscrollOffset = ref(0)
const isBouncing = ref(false)
let scrollPointerStartY = 0
let isDraggingOverscroll = false
let lastOverscrollEndAt = 0
let wheelBounceTimer = null

const overscrollStyle = computed(() => {
  if (overscrollOffset.value === 0 && !isBouncing.value) {
    return {}
  }
  return {
    transform: `translate3d(0, ${overscrollOffset.value}px, 0)`,
    transition: isBouncing.value ? 'transform 0.38s cubic-bezier(0.18, 0.9, 0.32, 1.2)' : 'none',
    willChange: 'transform'
  }
})

function onScrollPointerDown(e) {
  if (activeCategoryFolder.value || isFilterMode.value || isSearchActive.value) return
  if (e.button != null && e.button !== 0) return
  if (!scrollContainerRef.value) return

  scrollPointerStartY = e.clientY
  isDraggingOverscroll = false

  window.addEventListener('pointermove', onScrollPointerMove, { passive: false })
  window.addEventListener('pointerup', onScrollPointerUp)
  window.addEventListener('pointercancel', onScrollPointerUp)
}

function onScrollPointerMove(e) {
  if (!scrollContainerRef.value) return
  const el = scrollContainerRef.value
  const dy = e.clientY - scrollPointerStartY

  if (dy < 0) {
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
    const isFullyVisible = maxScroll <= 16
    const atBottom = isFullyVisible || el.scrollTop >= maxScroll - 6
    if (atBottom) {
      isDraggingOverscroll = true
      isBouncing.value = false
      overscrollOffset.value = rubberBand(dy, 320, 0.45)
      e.preventDefault?.()
    }
  } else if (isDraggingOverscroll) {
    if (dy < 0) {
      overscrollOffset.value = rubberBand(dy, 320, 0.45)
    } else {
      overscrollOffset.value = 0
      isDraggingOverscroll = false
    }
  }
}

function onScrollPointerUp() {
  window.removeEventListener('pointermove', onScrollPointerMove)
  window.removeEventListener('pointerup', onScrollPointerUp)
  window.removeEventListener('pointercancel', onScrollPointerUp)

  if (isDraggingOverscroll || overscrollOffset.value < 0) {
    lastOverscrollEndAt = Date.now()
    isBouncing.value = true
    overscrollOffset.value = 0
    setTimeout(() => {
      isBouncing.value = false
    }, 380)
  }
  isDraggingOverscroll = false
}

function onScrollWheel(e) {
  if (activeCategoryFolder.value || isFilterMode.value || isSearchActive.value) return
  if (!scrollContainerRef.value) return
  const el = scrollContainerRef.value
  const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
  const isFullyVisible = maxScroll <= 16
  const atBottom = isFullyVisible || el.scrollTop >= maxScroll - 6

  if (atBottom && e.deltaY > 0) {
    if (wheelBounceTimer) clearTimeout(wheelBounceTimer)
    isBouncing.value = false
    const bounceMagnitude = clamp(e.deltaY * 0.35, 10, 42)
    overscrollOffset.value = -bounceMagnitude
    wheelBounceTimer = setTimeout(() => {
      isBouncing.value = true
      overscrollOffset.value = 0
      wheelBounceTimer = setTimeout(() => {
        isBouncing.value = false
      }, 380)
    }, 50)
  }
}

function handleContainerClick(e) {
  if (Date.now() - lastOverscrollEndAt < 250) {
    e.stopPropagation()
    e.preventDefault()
  }
}

watch(lettersWithApps, (letters) => {
  if (letters.length > 0 && !letters.includes(activeLetter.value)) {
    activeLetter.value = letters[0]
  }
  nextTick(() => {
    updateSectionTops()
  })
}, { immediate: true })

function launchApp(appId) {
  system.openApp(appId)
}

function handleOpenXHide() {
  system.openApp('settings')
}

function onSearchActive(active) {
  isSearchActive.value = active
}

/* 下拉关闭（反向手势，仅在未滚动且非搜索态、非过滤模式、非展开大文件夹时接管） */
const CLOSE_SPAN = 380

useSwipeGesture(rootRef, {
  axis: 'y',
  direction: 1, // 下拉关闭
  span: CLOSE_SPAN,
  canStart: () => {
    if (activeCategoryFolder.value) return false
    if (isSearchActive.value || isFilterMode.value) return false
    if (scrollContainerRef.value && scrollContainerRef.value.scrollTop > 4) return false
    return (
      overlay.value.status === 'open' ||
      (overlay.value.status === 'settling' && overlay.value.progress > 0.5)
    )
  },
  onStart() {
    getDriver('appLibrary')?.snapTo(overlay.value.progress)
  },
  onProgress(p) {
    const remain = clamp(1 - p, 0, 1)
    getDriver('appLibrary')?.snapTo(remain)
    system.setOverlayProgress('appLibrary', remain)
  },
  onRelease(p, velocity) {
    const driver = getDriver('appLibrary')
    const close = p > 0.22 || velocity > 0.45
    if (close) {
      system.beginSettle('appLibrary', clamp(1 - p, 0, 1))
      driver?.animateTo(0, {
        initialVelocity: -velocity,
        onDone: () => system.settleOverlay('appLibrary', false)
      })
    } else {
      system.beginSettle('appLibrary', clamp(1 - p, 0, 1))
      driver?.animateTo(1, {
        initialVelocity: -velocity,
        onDone: () => system.settleOverlay('appLibrary', true)
      })
    }
    return close ? 1 : 0
  }
})

function onBackdropClick(e) {
  if (activeCategoryFolder.value) return
  if (isFilterMode.value) {
    exitFilterMode()
    return
  }
  if (e.target === e.currentTarget) {
    system.requestCloseOverlay('appLibrary')
  }
}

onMounted(() => {
  nextTick(() => {
    updateSectionTops()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onScrollPointerMove)
  window.removeEventListener('pointerup', onScrollPointerUp)
  window.removeEventListener('pointercancel', onScrollPointerUp)
  if (wheelBounceTimer) clearTimeout(wheelBounceTimer)
})
</script>

<template>
  <div
    v-show="visible"
    ref="rootRef"
    class="app-library-drawer"
    :style="layerStyle"
    @click="onBackdropClick"
  >
    <!-- 旗舰级磨砂深色半透毛玻璃背景 -->
    <div class="drawer-backdrop" :style="blurStyle"></div>

    <div class="drawer-content">
      <!-- 顶部胶囊分段选择器（点击导轨过滤时优雅淡出隐藏） -->
      <div
        class="drawer-header"
        :class="{
          'is-hidden': isFilterMode,
          'is-dimmed': isScrubbing
        }"
      >
        <DrawerCapsuleTabs v-model="currentTab" />
      </div>

      <!-- 滚动主体内容区（支持触底继续上滑阻尼橡皮筋回弹） -->
      <div
        ref="scrollContainerRef"
        class="drawer-body scrollable"
        @scroll="handleScroll"
        @pointerdown="onScrollPointerDown"
        @wheel="onScrollWheel"
        @click.capture="handleContainerClick"
      >
        <div class="drawer-scroll-viewport" :style="overscrollStyle">
        <!-- ── 模式 A: 字母过滤聚焦视图（像素级对齐 media_1789877584491.jpg，点击右侧导轨字母激活） ── -->
        <!-- ── 模式 A: 字母过滤聚焦视图（仅在有应用的字母下展示；无相关应用直接隐藏） ── -->
        <transition name="fade-filter">
          <div
            v-if="isFilterMode && filteredApps.length > 0"
            class="filter-mode-container"
            @click="exitFilterMode"
          >
            <div class="filtered-apps-wrapper">
              <!-- 顶部大号字母标题：置于第 4 列上方，右边缘对齐第 4 列应用图标（对齐参考图 2） -->
              <div class="filter-header-row">
                <div class="filter-letter-col">
                  <span class="filter-letter-title">{{ filterLetter }}</span>
                </div>
              </div>

              <div class="app-grid four-columns filtered-app-grid">
                <div
                  v-for="(app, index) in filteredApps"
                  :key="app.id"
                  class="grid-app-item"
                  :style="getFilteredItemStyle(index, filteredApps.length)"
                  @click.stop="launchApp(app.id)"
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
        </transition>

        <!-- ── 模式 B: 常规全量视图 ── -->
        <div v-show="!isFilterMode && currentTab === 'all'" class="all-tab-content">
          <!-- Row 1: 常用置顶应用（电话、信息、浏览器、相机） -->
          <div class="app-grid four-columns pinned-row">
            <div
              v-for="app in pinnedApps"
              :key="'pinned-' + app.id"
              class="grid-app-item"
              @click="launchApp(app.id)"
            >
              <AppIcon
                :app="app"
                :size="50"
                :show-label="true"
                :launch-on-click="false"
              />
            </div>
          </div>

          <!-- 置顶与全量字母网格之间的细微分界线（对齐真机 rows1_to_3） -->
          <div class="pinned-divider"></div>

          <!-- 单一连续无缝 4 列 A-Z 应用流（无跨行空洞、呼吸感间隙） -->
          <div class="app-grid four-columns continuous-app-grid">
            <div
              v-for="app in alphabeticalAppList"
              :id="app.isFirstOfLetter ? 'section-' + app.initial : undefined"
              :key="app.id"
              class="grid-app-item"
              @click="launchApp(app.id)"
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

        <!-- ── TAB 2: 分类大卡片视图（双列 1:1 正方形磨砂大文件夹） ── -->
        <div v-show="!isFilterMode && currentTab === 'category'" class="category-tab-content">
          <div class="category-cards-grid">
            <CategoryCard
              v-for="cat in DRAWER_CATEGORIES"
              :key="cat.id"
              :category="cat"
              :is-folder-open="activeCategoryFolder?.id === cat.id"
              @select-app="launchApp"
              @open-folder="handleOpenCategoryFolder"
              @open-xhide="handleOpenXHide"
            />
          </div>
        </div>
      </div>
      </div>

      <!-- 右侧垂直 A-Z 字母快速检索导轨（仅全部 Tab 下展示；仅展示有对应应用的字母） -->
      <AlphabetScrubber
        v-if="currentTab === 'all'"
        :letters="lettersWithApps"
        :letters-with-apps="lettersWithApps"
        :active-letter="activeLetter"
        :is-filter-mode="isFilterMode"
        @select="handleSelectLetter"
        @scrubbing="handleScrubbing"
      />

      <!-- 底部常驻悬浮搜索胶囊（过滤模式或展开大文件夹时优雅隐藏） -->
      <DrawerSearchBar
        :hidden="isScrubbing || isFilterMode || !!activeCategoryFolder"
        @select-app="launchApp"
        @search-active="onSearchActive"
      />

      <!-- 抽屉大文件夹展开视图（全屏深色毛玻璃 + 4 列图标网格 + Hero 动画，参考 22.mp4） -->
      <DrawerFolderOverlay
        v-if="activeCategoryFolder"
        :category="activeCategoryFolder"
        :origin="folderOriginGeometry"
        @close="handleCloseCategoryFolder"
        @launch-app="handleCategoryFolderLaunchApp"
      />
    </div>
  </div>
</template>

<style scoped>
.app-library-drawer {
  position: absolute;
  inset: 0;
  z-index: var(--z-app-library, 30);
  will-change: transform;
  user-select: none;
}

.drawer-backdrop {
  position: absolute;
  inset: -30px;
  background: rgba(18, 20, 26, 0.76);
  backdrop-filter: blur(36px) saturate(180%);
  -webkit-backdrop-filter: blur(36px) saturate(180%);
  z-index: 1;
}

.drawer-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  z-index: 2;
  box-sizing: border-box;
}

/* 顶部胶囊导航头（留白对齐真机 50px 顶间距，高度 36px） */
.drawer-header {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 50px;
  padding: 0 16px;
  flex-shrink: 0;
  z-index: 10;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.drawer-header.is-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-8px);
}

.drawer-header.is-dimmed {
  opacity: 0.25;
}

/* 主滚动容器 */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 0 96px 0;
  box-sizing: border-box;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* 全部应用视图 */
.all-tab-content {
  display: flex;
  flex-direction: column;
}

/* 置顶常用应用行：与上方 Tab 保持 38px 舒展呼吸感留白 */
.app-grid.pinned-row {
  margin-top: 38px;
}

/* 分割线：精确对齐第 1 列图标左边缘与第 4 列图标右边缘，不向外溢出至边距或右侧导轨 */
.pinned-divider {
  height: 0.5px;
  background: rgba(255, 255, 255, 0.12);
  margin: 20px 36px 20px 24px;
}

.continuous-app-grid {
  width: 100%;
}

/* 重新设计的 4 列宫格：图标 50px、垂直间隙 28px、右侧让位 26px 防与导轨挤压 */
.app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  row-gap: 28px;
  column-gap: 12px;
  justify-items: center;
  padding: 0 26px 0 14px;
  box-sizing: border-box;
  width: 100%;
}

.grid-app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 66px;
  scroll-margin-top: calc(var(--safe-top, 24px) + 70px);
}

/* ── 字母过滤模式视图（像素级对齐 media_1789877584491.jpg） ── */
.filter-mode-container {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.filtered-apps-wrapper {
  margin-top: calc(var(--safe-top, 24px) + 54px);
  width: 100%;
  box-sizing: border-box;
}

/* 顶部字母标题行：与 4 列网格共享边距与列宽，标题字母精准对齐第 4 列应用图标右边缘 */
.filter-header-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 12px;
  justify-items: center;
  padding: 0 26px 0 14px;
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 22px;
}

.filter-letter-col {
  grid-column: 4;
  width: 66px;
  display: flex;
  justify-content: flex-end;
  padding-right: 8px; /* (66px - 50px) / 2 = 8px，与下方 50px 图标右边缘绝对齐平 */
  box-sizing: border-box;
}

.filter-letter-title {
  font-size: 28px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.75);
  user-select: none;
  font-family: var(--font-stack, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
}

.filtered-app-grid {
  width: 100%;
}

.fade-filter-enter-active,
.fade-filter-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-filter-enter-from,
.fade-filter-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

/* 分类 Tab 内容 */
.category-tab-content {
  width: 100%;
}

.category-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 14px;
  padding: 14px 18px 24px 18px;
  box-sizing: border-box;
}

.drawer-scroll-viewport {
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
}
</style>
