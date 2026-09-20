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

const isInstalled = (id) => (home.appInstalled ? home.appInstalled(id) : true)

const allGroups = computed(() => {
  const raw = getAlphabeticalGroups()
  const filtered = {}
  for (const [k, list] of Object.entries(raw)) {
    filtered[k] = list.filter((a) => isInstalled(a.id))
  }
  return filtered
})

const availableLetters = computed(() => {
  return ALPHABET_LIST.filter((l) => (allGroups.value[l] || []).length > 0)
})

const activeLetter = ref('D')

const pinnedApps = computed(() => DRAWER_APPS.filter((a) => a.pinned && isInstalled(a.id)))

// 展平成单一连续紧凑的 4 列应用流（真实桌面应用）
const alphabeticalAppList = computed(() => {
  const list = []
  const seenInitials = new Set()
  for (const letter of availableLetters.value) {
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
  for (const letter of availableLetters.value) {
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
  let current = availableLetters.value[0] || 'D'
  for (const letter of availableLetters.value) {
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

watch(availableLetters, (letters) => {
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
                :size="56"
                :show-label="true"
                :launch-on-click="false"
              />
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
              <AppIcon
                :app="app"
                :size="56"
                :show-label="true"
                :launch-on-click="false"
              />
            </div>
          </div>
        </div>

        <!-- ── TAB 2: 分类大卡片视图（双列 1:1 正方形磨砂大文件夹） ── -->
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

      <!-- 右侧垂直 A-Z 字母快速检索导轨（仅全部 Tab 下展示，仅索引真实存在的应用） -->
      <AlphabetScrubber
        v-if="currentTab === 'all'"
        :letters="availableLetters"
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

/* 顶部胶囊导航头 */
.drawer-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: calc(var(--safe-top, 24px) + 8px);
  padding: 0 16px;
  flex-shrink: 0;
  z-index: 10;
  transition: opacity 0.15s ease;
}

.drawer-header.is-dimmed {
  opacity: 0.25;
}

/* 主滚动容器 */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 12px 120px 12px;
  box-sizing: border-box;
  scroll-behavior: smooth;
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
  background: rgba(255, 255, 255, 0.12);
  margin: 12px 6px 16px;
}

.continuous-app-grid {
  width: 100%;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 8px;
  justify-items: center;
}

.grid-app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  scroll-margin-top: calc(var(--safe-top, 24px) + 70px);
}

/* 分类 Tab 内容 */
.category-tab-content {
  width: 100%;
}

.category-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 14px;
  padding: 8px 16px 120px 16px;
  box-sizing: border-box;
}
</style>
