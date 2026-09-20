<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DRAWER_APPS, ALPHABET_LIST, getAlphabeticalGroups } from '../../config/drawerApps'
import { DRAWER_CATEGORIES } from '../../config/drawerCategories'
import { useSystemStore } from '../../stores/systemStore'
import { useHomeStore } from '../../stores/homeStore'
import { useSwipeGesture } from '../../composables/useSwipeGesture'
import { getDriver } from '../../composables/driverRegistry'
import { clamp } from '../../utils/math'
import DrawerCapsuleTabs from './drawer/DrawerCapsuleTabs.vue'
import AlphabetScrubber from './drawer/AlphabetScrubber.vue'
import CategoryCard from './drawer/CategoryCard.vue'
import DrawerSearchBar from './drawer/DrawerSearchBar.vue'

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
const activeLetter = ref('A')
const isScrubbing = ref(false)
const isSearchActive = ref(false)

const isInstalled = (id) => (home.appInstalled ? home.appInstalled(id) : true)
const allGroups = computed(() => {
  const raw = getAlphabeticalGroups()
  const filtered = {}
  for (const [k, list] of Object.entries(raw)) {
    filtered[k] = list.filter((a) => isInstalled(a.id))
  }
  return filtered
})
const pinnedApps = computed(() => DRAWER_APPS.filter((a) => a.pinned && isInstalled(a.id)))

// 展平成单一连续紧凑的 4 列应用流（严格对齐真机 media_1789870904758.jpg）
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

const rootRef = ref(null)
const scrollContainerRef = ref(null)

// 字母段元素位置缓存
const sectionTops = ref({})

function updateSectionTops() {
  if (!scrollContainerRef.value) return
  const containerRect = scrollContainerRef.value.getBoundingClientRect()
  const tops = {}
  for (const letter of ALPHABET_LIST) {
    const el = scrollContainerRef.value.querySelector(`#section-${letter}`)
    if (el) {
      tops[letter] = el.getBoundingClientRect().top - containerRect.top + scrollContainerRef.value.scrollTop
    }
  }
  sectionTops.value = tops
}

function handleScroll() {
  if (isScrubbing.value || currentTab.value !== 'all' || !scrollContainerRef.value) return
  const scrollTop = scrollContainerRef.value.scrollTop + 90
  let current = 'A'
  for (const letter of ALPHABET_LIST) {
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

function handleScrubbing(scrubbing, letter) {
  isScrubbing.value = scrubbing
  if (letter) {
    activeLetter.value = letter
    scrollToLetter(letter)
  }
}

watch(currentTab, () => {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
  }
})

function launchApp(appId) {
  system.openApp(appId)
}

function handleOpenXHide() {
  system.openApp('settings')
}

function onSearchActive(active) {
  isSearchActive.value = active
}

/* 下拉关闭（反向手势，仅在未滚动且非搜索态时接管） */
const CLOSE_SPAN = 380

useSwipeGesture(rootRef, {
  axis: 'y',
  direction: 1, // 下拉关闭
  span: CLOSE_SPAN,
  canStart: () => {
    if (isSearchActive.value) return false
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
  if (e.target === e.currentTarget) {
    system.requestCloseOverlay('appLibrary')
  }
}

onMounted(() => {
  nextTick(() => {
    updateSectionTops()
  })
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
      <!-- 顶部胶囊分段选择器（全部 | 分类） -->
      <div class="drawer-header" :class="{ 'is-dimmed': isScrubbing }">
        <DrawerCapsuleTabs v-model="currentTab" />
      </div>

      <!-- 滚动主体内容区 -->
      <div
        ref="scrollContainerRef"
        class="drawer-body scrollable"
        @scroll="handleScroll"
      >
        <!-- ── TAB 1: 全部应用视图（严格像素还原真机连续 4 列流） ── -->
        <div v-show="currentTab === 'all'" class="all-tab-content">
          <!-- Row 1: 常用置顶应用（微信、Transsioner、通讯录、微博） -->
          <div class="app-grid four-columns pinned-row">
            <div
              v-for="app in pinnedApps"
              :key="'pinned-' + app.id"
              class="grid-app-item"
              @click="launchApp(app.id)"
            >
              <div class="icon-wrap">
                <img :src="app.icon" :alt="app.name" class="app-icon-img" loading="lazy" />
                <span v-if="app.badge" class="badge-bubble">{{ app.badge }}</span>
              </div>
              <span class="app-title">{{ app.name }}</span>
            </div>
          </div>

          <!-- 置顶与全量字母网格之间的细微分界线（对齐真机 rows1_to_3） -->
          <div class="pinned-divider"></div>

          <!-- 单一连续无缝 4 列 A-Z 应用流（无跨行空洞、无生硬标题） -->
          <div class="app-grid four-columns continuous-app-grid">
            <div
              v-for="app in alphabeticalAppList"
              :id="app.isFirstOfLetter ? 'section-' + app.initial : undefined"
              :key="app.id"
              class="grid-app-item"
              @click="launchApp(app.id)"
            >
              <div class="icon-wrap">
                <img :src="app.icon" :alt="app.name" class="app-icon-img" loading="lazy" />
                <span v-if="app.badge" class="badge-bubble">{{ app.badge }}</span>
              </div>
              <span class="app-title">{{ app.name }}</span>
            </div>
          </div>
        </div>

        <!-- ── TAB 2: 14 大分类大卡片视图（双列 1:1 正方形磨砂大文件夹） ── -->
        <div v-show="currentTab === 'category'" class="category-tab-content">
          <div class="category-cards-grid">
            <CategoryCard
              v-for="cat in DRAWER_CATEGORIES"
              :key="cat.id"
              :category="cat"
              @select-app="launchApp"
              @open-xhide="handleOpenXHide"
            />
          </div>
        </div>
      </div>

      <!-- 右侧垂直 A-Z 字母快速检索导轨（仅全部 Tab 下展示） -->
      <AlphabetScrubber
        v-if="currentTab === 'all'"
        :active-letter="activeLetter"
        @select="scrollToLetter"
        @scrubbing="handleScrubbing"
      />

      <!-- 底部常驻悬浮搜索胶囊 -->
      <DrawerSearchBar
        :hidden="isScrubbing"
        @select-app="launchApp"
        @search-active="onSearchActive"
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
  overflow: hidden;
  user-select: none;
}

.drawer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(14, 17, 24, 0.78);
  backdrop-filter: blur(36px) saturate(180%);
  -webkit-backdrop-filter: blur(36px) saturate(180%);
}

@supports not (backdrop-filter: blur(1px)) {
  .drawer-backdrop {
    background: rgba(14, 17, 24, 0.96);
  }
}

.drawer-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 顶部胶囊分段区 */
.drawer-header {
  position: absolute;
  top: calc(var(--safe-top, 24px) + 8px);
  left: 0;
  right: 0;
  z-index: 50;
  padding: 0 16px;
  transition: opacity 0.2s ease;
  pointer-events: auto;
}

.drawer-header.is-dimmed {
  opacity: 0;
  pointer-events: none;
}

/* 抽屉滚动主体 */
.drawer-body {
  flex: 1;
  padding-top: calc(var(--safe-top, 24px) + 64px);
  padding-bottom: calc(var(--safe-bottom, 16px) + 96px);
  padding-left: 14px;
  padding-right: 26px; /* 给右侧字母导轨留出操作通道 */
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* 全部应用视图：连续紧凑的 4 列网格 */
.all-tab-content {
  display: flex;
  flex-direction: column;
}

.pinned-row {
  margin-bottom: 2px;
}

.pinned-divider {
  height: 0.5px;
  background: rgba(255, 255, 255, 0.1);
  margin: 12px 6px 18px;
}

.continuous-app-grid {
  width: 100%;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px 8px;
  justify-items: center;
}

.grid-app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 70px;
  cursor: pointer;
  scroll-margin-top: calc(var(--safe-top, 24px) + 70px);
}

.icon-wrap {
  position: relative;
  width: 68px;
  height: 68px;
  border-radius: 16px;
  overflow: visible;
  transition: transform 0.14s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.grid-app-item:active .icon-wrap {
  transform: scale(0.88);
}

.app-icon-img {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
  display: block;
}

.badge-bubble {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  border-radius: 8px;
  background: #ff3b30;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  padding: 0 4px;
  box-shadow: 0 2px 5px rgba(255, 59, 48, 0.5);
  box-sizing: border-box;
  z-index: 2;
}

.app-title {
  margin-top: 6px;
  font-size: 12px;
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  text-align: center;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

/* 分类 Tab：双列正方形大文件夹 */
.category-tab-content {
  padding-right: 0;
}

.category-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 22px 14px;
  padding: 4px 6px 16px;
}
</style>
