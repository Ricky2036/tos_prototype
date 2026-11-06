<script setup>
import { ref, computed, nextTick } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'
import { useBackHandler } from '../../../composables/backRegistry'
import { useLargeTitle, largeTitleVars } from '../../../composables/useLargeTitle.js'
import LargeTitleHeader from '../../ui/LargeTitleHeader.vue'
import FloatingTabBar from '../../ui/FloatingTabBar.vue'
import PhoneRecentsTab from './PhoneRecentsTab.vue'
import PhoneContactsTab from './PhoneContactsTab.vue'
import PhoneKeypad from './PhoneKeypad.vue'
import PhoneSearch from './PhoneSearch.vue'
import PhoneFlashCallModal from './PhoneFlashCallModal.vue'
import PhoneCallScreen from './PhoneCallScreen.vue'
import PhoneSettings from './settings/PhoneSettings.vue'

const props = defineProps({ app: Object })
const phoneStore = usePhoneStore()

const isSettingsOpen = ref(false)
const settingsRef = ref(null)
const scrollContainerRef = ref(null)

// 电话应用定制大标题折叠曲线：严格 1:1 对齐真机测量几何（大标题从 y=97px 展开，字号 32px，Tab 绿色指示条精准锚定在 y=184.6px）
const PHONE_TITLE_CURVE = {
  distance: 38,
  fromTopInset: 42,
  toTopInset: 4,
  fromHeight: 84,
  toHeight: 46,
  fromSize: 32,
  toSize: 20,
  accessoryRight: 16
}

// 大标题折叠契约（规范通用件）
const { progress: titleProgress, onScroll: onTitleScroll } = useLargeTitle({ distance: PHONE_TITLE_CURVE.distance })
const titleVars = computed(() => largeTitleVars(titleProgress.value, PHONE_TITLE_CURVE))

// 悬浮导航 Tab 规范配置
const tabs = [
  { id: 'recents', name: '通话记录' },
  { id: 'contacts', name: '联系人' }
]

// 切换通话记录分类（全部类型 / 未接来电）：
// 若已上滑处于吸顶状态，则保持吸顶折叠（严禁跳回大标题，Tab 栏绝对静止），仅列表内容回到顶部（首行紧贴吸顶栏下方）；
// 若处于默认展开态，则保持在最顶部展开。
function selectFilter(filterType) {
  if (phoneStore.recentsFilter === filterType) {
    if (scrollContainerRef.value) {
      const collapseDistance = PHONE_TITLE_CURVE.distance
      if (scrollContainerRef.value.scrollTop > collapseDistance) {
        scrollContainerRef.value.scrollTo({ top: collapseDistance, behavior: 'smooth' })
      } else {
        scrollContainerRef.value.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    return
  }

  const collapseDistance = PHONE_TITLE_CURVE.distance
  const wasCollapsed = scrollContainerRef.value && scrollContainerRef.value.scrollTop >= collapseDistance

  phoneStore.recentsFilter = filterType

  if (scrollContainerRef.value) {
    if (wasCollapsed) {
      scrollContainerRef.value.scrollTop = collapseDistance
      titleProgress.value = 1
    } else {
      scrollContainerRef.value.scrollTop = 0
      titleProgress.value = 0
    }
    onTitleScroll({ target: scrollContainerRef.value })

    nextTick(() => {
      if (scrollContainerRef.value) {
        if (wasCollapsed) {
          scrollContainerRef.value.scrollTop = collapseDistance
          titleProgress.value = 1
        }
        onTitleScroll({ target: scrollContainerRef.value })
      }
    })
  }
}

// 联系人快速检索字母表
const alphabetList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#']

// 响应全局侧滑返回手势
useBackHandler(() => {
  if (phoneStore.activeCall) {
    phoneStore.endCall()
    return true
  }
  if (isSettingsOpen.value) {
    if (settingsRef.value?.back?.()) return true
    isSettingsOpen.value = false
    return true
  }
  if (phoneStore.isSearchActive) {
    phoneStore.isSearchActive = false
    phoneStore.searchQuery = ''
    return true
  }
  if (phoneStore.flashCallTarget) {
    phoneStore.flashCallTarget = null
    return true
  }
  if (phoneStore.isKeypadOpen && phoneStore.dialedNumber) {
    phoneStore.clearNumber()
    return true
  }
  if (phoneStore.isKeypadOpen) {
    phoneStore.isKeypadOpen = false
    return true
  }
  return false
})

function switchTab(tabName) {
  phoneStore.currentTab = tabName
  if (tabName === 'contacts') {
    phoneStore.isKeypadOpen = false
  }
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
    onTitleScroll({ target: scrollContainerRef.value })
  }
}

function handleFabClick() {
  if (phoneStore.currentTab === 'recents') {
    phoneStore.isKeypadOpen = !phoneStore.isKeypadOpen
  } else {
    // 联系人页：新建联系人模拟行为
    const newMock = {
      id: 'c_' + Date.now(),
      name: '新联系人',
      number: '139 1234 5678',
      color: '#34D399'
    }
    phoneStore.contacts.unshift(newMock)
    phoneStore.startCall(newMock)
  }
}

function scrollToLetter(letter) {
  const el = document.getElementById(`section-${letter}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 滑动手势与滚动联动（对齐真机录屏：滑动列表顺滑收起拨号盘）
let touchStartY = 0
let touchStartX = 0

function handleTouchStart(e) {
  if (e.touches?.length) {
    touchStartY = e.touches[0].clientY
    touchStartX = e.touches[0].clientX
  }
}

function handleTouchMove(e) {
  if (!e.touches?.length) return
  const dy = e.touches[0].clientY - touchStartY
  const dx = e.touches[0].clientX - touchStartX

  // 手指在列表区域产生垂直滑动时，顺滑收起拨号盘
  if (Math.abs(dy) > 16 && phoneStore.isKeypadOpen) {
    phoneStore.isKeypadOpen = false
  }

  // 列表顶部向下拉动触发 Flash Call
  if (dy > 90 && scrollContainerRef.value?.scrollTop === 0 && Math.abs(dy) > Math.abs(dx)) {
    if (!phoneStore.flashCallTarget && !phoneStore.isKeypadOpen) {
      phoneStore.flashCallTarget = phoneStore.recents[0] || { name: '常用联系人', number: '138 0000 0000' }
    }
  }
}

function handleAppScroll(e) {
  onTitleScroll(e)
  // 滚动列表时自动收起拨号盘
  if (phoneStore.isKeypadOpen && e.target.scrollTop > 5) {
    phoneStore.isKeypadOpen = false
  }
}

function handleAppWheel(e) {
  // 滚轮滑动列表时自动收起拨号盘
  if (phoneStore.isKeypadOpen && Math.abs(e.deltaY) > 6) {
    phoneStore.isKeypadOpen = false
  }
}
</script>

<template>
  <div class="phone-app">
    <!-- 主滚动容器（承载大标题吸顶折叠、渐隐防透底遮罩与列表流动） -->
    <div
      ref="scrollContainerRef"
      class="phone-scroll-viewport scrollable"
      :style="titleVars"
      @scroll.passive="handleAppScroll"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @wheel.passive="handleAppWheel"
    >
      <!-- 吸顶组合顶栏：承载大标题吸顶折叠与分类标签栏，二者共同构成固定头部 -->
      <div class="phone-sticky-header">
        <LargeTitleHeader
          :progress="titleProgress"
          scrim="255, 255, 255"
          :curve="PHONE_TITLE_CURVE"
        >
          <div class="header-titles-block">
            <div class="lt-main-title">
              {{ phoneStore.currentTab === 'recents' ? '通话记录' : '联系人' }}
            </div>
            <div
              v-if="phoneStore.currentTab === 'contacts' && titleProgress < 0.25"
              class="contacts-sub-count"
            >
              {{ phoneStore.contacts.length }} 位联系人
            </div>
          </div>

          <!-- 右侧吸顶操作按钮群：高保真原厂白色圆角药丸胶囊 -->
          <template #accessory>
            <div class="header-actions-pill">
              <button
                class="header-action-btn search-trigger"
                title="搜索"
                @click="phoneStore.isSearchActive = true"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7.5" stroke="#1C1C1E" stroke-width="2" />
                  <line x1="21" y1="21" x2="16.5" y2="16.5" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" />
                </svg>
              </button>

              <button
                class="header-action-btn settings-trigger"
                title="设置"
                @click="isSettingsOpen = true"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#1C1C1E" stroke-width="1.8" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="#1C1C1E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="settings-red-dot"></span>
              </button>
            </div>
          </template>
        </LargeTitleHeader>

        <!-- 筛选标签栏：全部类型 | 未接来电（随大标题同步上推，吸顶停靠在展开大标题下方） -->
        <div v-if="phoneStore.currentTab === 'recents'" class="recents-filter-bar">
          <button
            class="filter-tab-btn"
            :class="{ active: phoneStore.recentsFilter === 'all' }"
            @click="selectFilter('all')"
          >
            全部类型
          </button>
          <button
            class="filter-tab-btn"
            :class="{ active: phoneStore.recentsFilter === 'missed' }"
            @click="selectFilter('missed')"
          >
            未接来电
          </button>
          <div
            class="filter-indicator-slider"
            :class="{ 'is-missed': phoneStore.recentsFilter === 'missed' }"
            aria-hidden="true"
          >
            <div class="filter-indicator-pill"></div>
          </div>
        </div>
      </div>

      <!-- 核心视图标签页内容 -->
      <PhoneRecentsTab v-if="phoneStore.currentTab === 'recents'" />
      <PhoneContactsTab v-else />
    </div>

    <!-- 联系人右侧快速字母检索条（固定悬浮于应用视口右侧） -->
    <div
      v-if="phoneStore.currentTab === 'contacts' && !phoneStore.isKeypadOpen"
      class="alphabet-scrubber-fixed"
    >
      <span
        v-for="letter in alphabetList"
        :key="letter"
        class="scrubber-letter"
        @click="scrollToLetter(letter)"
      >
        {{ letter }}
      </span>
    </div>

    <!-- 底部纯白柔和渐变托底：彻底消解任何列表穿透与漏底 -->
    <div class="phone-bottom-fade-scrim" aria-hidden="true"></div>

    <!-- 拨号键盘浮层面板（抽屉式弹出/收起，呼叫按钮精确落在悬浮底栏上方） -->
    <Transition name="keypad-slide">
      <div v-if="phoneStore.isKeypadOpen && phoneStore.currentTab === 'recents'" class="keypad-drawer-wrap">
        <PhoneKeypad />
      </div>
    </Transition>

    <!-- 底部悬浮双体导航栏（通用控件 FloatingTabBar + 独立操作球，全天候常驻屏幕底端） -->
    <FloatingTabBar
      :model-value="phoneStore.currentTab"
      :tabs="tabs"
      height="54px"
      bottom="28px"
      accent-color="#00C853"
      :dark="false"
      @update:model-value="switchTab"
      @change="switchTab"
    >
      <template #tab="{ tab, active }">
        <div class="phone-tab-content" :class="{ active }">
          <div class="tab-icon-wrapper" :class="{ 'icon-active': active }">
            <!-- 通话记录图标：实心面性时钟剪影（未选深灰 #656668，选中纯绿染色 #00C853） -->
            <svg v-if="tab.id === 'recents'" width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" :fill="active ? '#00C853' : '#656668'" />
              <path d="M12 6.5V12L15.6 15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <!-- 联系人图标：实心面性人像剪影（未选纯黑 #1C1C1E，选中纯绿染色 #00C853） -->
            <svg v-else width="20" height="20" viewBox="0 0 24 24" :fill="active ? '#00C853' : '#1C1C1E'">
              <circle cx="12" cy="7.2" r="4.2" />
              <path d="M4.5 19.5c0-3.6 3.4-6.3 7.5-6.3s7.5 2.7 7.5 6.3v0.5H4.5v-0.5z" />
            </svg>
          </div>
          <span class="tab-name">{{ tab.name }}</span>
        </div>
      </template>

      <!-- 右侧：独立圆形悬浮操作球 (FAB) 挂载到通用底栏的 #action 槽 -->
      <template #action>
        <button
          class="phone-fab"
          :class="{ 'keypad-active': phoneStore.isKeypadOpen && phoneStore.currentTab === 'recents' }"
          :title="phoneStore.currentTab === 'recents' ? (phoneStore.isKeypadOpen ? '收起拨号盘' : '打开拨号盘') : '新建联系人'"
          @click="handleFabClick"
        >
          <!-- 通话记录：3x3 绿色圆点拨号盘（高保真还原原厂录屏） -->
          <svg v-if="phoneStore.currentTab === 'recents'" width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="5" r="2.2" :fill="phoneStore.isKeypadOpen ? '#2E7D32' : '#00C853'" />
            <circle cx="12" cy="5" r="2.2" :fill="phoneStore.isKeypadOpen ? '#2E7D32' : '#00C853'" />
            <circle cx="19" cy="5" r="2.2" :fill="phoneStore.isKeypadOpen ? '#2E7D32' : '#00C853'" />
            <circle cx="5" cy="12" r="2.2" :fill="phoneStore.isKeypadOpen ? '#2E7D32' : '#00C853'" />
            <circle cx="12" cy="12" r="2.2" :fill="phoneStore.isKeypadOpen ? '#2E7D32' : '#00C853'" />
            <circle cx="19" cy="12" r="2.2" :fill="phoneStore.isKeypadOpen ? '#2E7D32' : '#00C853'" />
            <circle cx="5" cy="19" r="2.2" :fill="phoneStore.isKeypadOpen ? '#2E7D32' : '#00C853'" />
            <circle cx="12" cy="19" r="2.2" :fill="phoneStore.isKeypadOpen ? '#2E7D32' : '#00C853'" />
            <circle cx="19" cy="19" r="2.2" :fill="phoneStore.isKeypadOpen ? '#2E7D32' : '#00C853'" />
          </svg>
          <!-- 联系人：+ 新建 -->
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </template>
    </FloatingTabBar>


    <!-- 全局弹层组件集合 -->
    <!-- 1. 搜索页 -->
    <Transition name="fade">
      <PhoneSearch v-if="phoneStore.isSearchActive" />
    </Transition>

    <!-- 2. Flash Call 快捷回复弹窗 -->
    <PhoneFlashCallModal />

    <!-- 3. 通话中全屏仿真界面 -->
    <Transition name="fade">
      <PhoneCallScreen v-if="phoneStore.activeCall" />
    </Transition>

    <!-- 4. 电话设置菜单群 -->
    <Transition name="slide">
      <PhoneSettings
        v-if="isSettingsOpen"
        ref="settingsRef"
        @back="isSettingsOpen = false"
      />
    </Transition>
  </div>
</template>

<style scoped>
.phone-app {
  position: relative;
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* 主滚动视口：挂载紧凑大标题契约与渐隐遮罩契约，严密贴合真机间距 */
.phone-scroll-viewport {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overflow-anchor: none;
  -webkit-overflow-scrolling: touch;
  position: relative;
  --title-height: 48px;
  --title-top-inset: 8px;
  --title-inset: 24px;
  --tabbar-fade: linear-gradient(
    to bottom,
    black 0%,
    black calc(100% - 96px),
    rgba(0, 0, 0, 0.4) calc(100% - 60px),
    transparent calc(100% - 22px)
  );
  -webkit-mask-image: var(--tabbar-fade);
  mask-image: var(--tabbar-fade);
}

/* 大标题文字行与联系人数量小标 */
.header-titles-block {
  display: flex;
  flex-direction: column;
}

/* 大标题头实心纯白背景：列表穿透滚动时 100% 遮蔽文字，彻底消除透底 */
.phone-app :deep(.large-title) {
  background: #FFFFFF !important;
  z-index: 12 !important;
}

.lt-main-title {
  display: block;
}

.contacts-sub-count {
  font-size: 13px;
  font-weight: 400;
  color: #8E8E93;
  margin-top: 2px;
}

/* 右上角快捷动作：高保真原厂白色圆角胶囊药丸，包裹搜索与设置 */
.header-actions-pill {
  display: flex;
  align-items: center;
  height: 38px;
  background: #FFFFFF;
  border-radius: 9999px;
  padding: 2px 6px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.header-action-btn {
  position: relative;
  background: none;
  border: none;
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.15s ease;
}

.header-action-btn:active {
  background-color: rgba(0, 0, 0, 0.06);
}

.settings-red-dot {
  position: absolute;
  top: 5px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #FF3B30;
  border: 1.5px solid #FFFFFF;
}

/* 联系人右侧快速字母检索条 */
.alphabet-scrubber-fixed {
  position: absolute;
  right: 4px;
  top: calc(var(--safe-top, 54px) + 72px);
  bottom: calc(var(--safe-bottom, 20px) + 76px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  z-index: 35;
  user-select: none;
  pointer-events: auto;
}

.scrubber-letter {
  font-size: 9.5px;
  font-weight: 600;
  color: #8E8E93;
  padding: 0 4px;
  cursor: pointer;
}

.scrubber-letter:active {
  color: #00C853;
  transform: scale(1.3);
}

/* 吸顶组合顶栏：承载大标题吸顶折叠与分类标签栏，二者共同构成固定头部 */
.phone-sticky-header {
  position: sticky;
  top: 0;
  z-index: 12;
  background: #FFFFFF;
  width: 100%;
}

/* 筛选分类栏：随大标题同步上推，吸顶停靠在展开大标题下方 */
.recents-filter-bar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 46px;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  background: #FFFFFF;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

/* 两个 Tab 左右 50% 等分、各自在其半屏内严格水平居中 */
.filter-tab-btn {
  position: relative;
  flex: 1 1 50%;
  width: 50%;
  height: 100%;
  background: none;
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14.5px;
  font-weight: 500;
  color: #656668;
  cursor: pointer;
  transition: color 0.18s ease, font-weight 0.18s ease;
  z-index: 2;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.filter-tab-btn.active {
  color: #1C1C1E;
  font-weight: 700;
}

/* 独立平滑滑动绿色指示条 */
.filter-indicator-slider {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 50%;
  height: 3.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transform: translateX(0%);
  transition: transform 0.28s cubic-bezier(0.25, 1, 0.5, 1);
  will-change: transform;
  z-index: 3;
}

.filter-indicator-slider.is-missed {
  transform: translateX(100%);
}

.filter-indicator-pill {
  width: 52px;
  height: 3.5px;
  border-radius: 9999px;
  background-color: #00C853;
}

/* 底部纯白柔和渐变托底：彻底消解任何列表穿透与漏底 */
.phone-bottom-fade-scrim {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.75) 40%,
    rgba(255, 255, 255, 0.96) 75%,
    #FFFFFF 100%
  );
  pointer-events: none;
  z-index: 20;
}

/* 规范 FloatingTabBar 胶囊适配：严格对齐真机比例（宽 176px，高 54px，48.9% 屏宽），给右侧留出充足呼吸感 */
.phone-app :deep(.floating-dock-container) {
  z-index: 40 !important;
}

.phone-app :deep(.floating-tab-bar) {
  width: 176px;
  max-width: 176px;
  height: 54px;
  background: rgba(255, 255, 255, 0.90);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  padding: 3px;
  border-radius: 9999px;
  pointer-events: auto;
}

/* 悬浮底栏高亮背景胶囊：平滑滑动底托，轻柔浅绿背景包裹高亮 Tab */
.phone-app :deep(.nav-sliding-pill-track) {
  display: flex !important;
  top: 3px;
  bottom: 3px;
  left: 3px;
  height: calc(100% - 6px);
  pointer-events: none;
  z-index: 1;
}

.phone-app :deep(.floating-tab-bar:not(.theme-dark) .nav-highlight-pill) {
  display: block !important;
  background: rgba(0, 0, 0, 0.05) !important; /* 柔和浅灰高亮背景胶囊，100% 还原原厂真机 */
  box-shadow: none !important;
  border-radius: 9999px !important;
  width: 100% !important;
  height: 100% !important;
}

.phone-app :deep(.floating-tab-item) {
  flex: 1 1 0%;
  width: 50%;
  height: 100%;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2;
  background: transparent !important;
}

.phone-tab-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  height: 100%;
  user-select: none;
}

/* 图标容器：纯透明无底色无阴影，仅承载 22px 面性染色矢量图标 */
.tab-icon-wrapper {
  width: 22px !important;
  height: 22px !important;
  min-width: 22px !important;
  min-height: 22px !important;
  max-width: 22px !important;
  max-height: 22px !important;
  aspect-ratio: 1 / 1 !important;
  flex-shrink: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  border-radius: 0 !important;
  box-sizing: border-box !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.tab-icon-wrapper svg {
  width: 22px !important;
  height: 22px !important;
  flex-shrink: 0 !important;
  display: block !important;
  transition: fill 0.2s ease, stroke 0.2s ease;
}

.tab-name {
  font-size: 11px;
  font-weight: 500;
  color: #656668;
  line-height: 1;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
  transition: color 0.2s ease, font-weight 0.2s ease;
}

.phone-tab-content.active .tab-name {
  color: #00C853;
  font-weight: 600;
}

/* 右侧独立圆形悬浮操作球 (FAB)：严格 54px × 54px，与胶囊高度对齐 */
.phone-fab {
  width: 54px !important;
  height: 54px !important;
  min-width: 54px !important;
  min-height: 54px !important;
  max-width: 54px !important;
  max-height: 54px !important;
  aspect-ratio: 1 / 1 !important;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.2s ease;
}

.phone-fab:active {
  transform: scale(0.92);
  background-color: #F2F3F5;
}

.phone-fab.keypad-active {
  background: #F8F9FA;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* 拨号键盘浮层面板（位于悬浮导航栏上方，呼叫键与底栏自然错落） */
.keypad-drawer-wrap {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
  background: #FFFFFF;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.05);
  padding-bottom: calc(28px + 54px + 12px);
  will-change: transform;
}

/* 转场动效 */
.keypad-slide-enter-active,
.keypad-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease;
}

.keypad-slide-enter-from,
.keypad-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.floating-fade-enter-active,
.floating-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.floating-fade-enter-from,
.floating-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
