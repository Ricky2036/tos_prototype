<script setup>
import { ref, computed } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'
import { useBackHandler } from '../../../composables/backRegistry'
import { useLargeTitle, largeTitleVars } from '../../../composables/useLargeTitle.js'
import LargeTitleHeader from '../../ui/LargeTitleHeader.vue'
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

// 大标题折叠契约（规范通用件）
const { progress: titleProgress, onScroll: onTitleScroll } = useLargeTitle()
const titleVars = computed(() => largeTitleVars(titleProgress.value))

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
    phoneStore.isKeypadOpen = true
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

// 滑动手势与滚动联动
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

  // 向上滑动且拨号盘开启时，顺滑收起拨号盘
  if (dy < -30 && phoneStore.isKeypadOpen && Math.abs(dy) > Math.abs(dx)) {
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
  if (e.target.scrollTop > 20 && phoneStore.isKeypadOpen) {
    phoneStore.isKeypadOpen = false
  }
}
</script>

<template>
  <div class="phone-app">
    <!-- 主滚动容器（承载大标题吸顶折叠与列表流动） -->
    <div
      ref="scrollContainerRef"
      class="phone-scroll-viewport scrollable"
      :style="titleVars"
      @scroll.passive="handleAppScroll"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
    >
      <!-- 标准吸顶折叠大标题通用件 -->
      <LargeTitleHeader
        :progress="titleProgress"
        scrim="255, 255, 255"
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

        <!-- 右侧吸顶操作按钮群 -->
        <template #accessory>
          <div class="header-actions">
            <button
              class="header-action-btn search-trigger"
              title="搜索"
              @click="phoneStore.isSearchActive = true"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7.5" stroke="#1C1C1E" stroke-width="2.2" />
                <line x1="21" y1="21" x2="16.5" y2="16.5" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" />
              </svg>
            </button>

            <button
              class="header-action-btn settings-trigger"
              title="设置"
              @click="isSettingsOpen = true"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#1C1C1E" stroke-width="2" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="settings-red-dot"></span>
            </button>
          </div>
        </template>
      </LargeTitleHeader>

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

    <!-- 底部双体悬浮岛导航栏（未展开键盘时常驻） -->
    <Transition name="floating-fade">
      <div v-if="!phoneStore.isKeypadOpen" class="phone-floating-nav-container">
        <!-- 左侧：双标签悬浮胶囊岛 -->
        <div class="floating-capsule-island">
          <button
            class="capsule-tab-item"
            :class="{ active: phoneStore.currentTab === 'recents' }"
            @click="switchTab('recents')"
          >
            <div class="capsule-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" :stroke="phoneStore.currentTab === 'recents' ? '#00C853' : '#1C1C1E'" stroke-width="2.2" />
                <path d="M12 7V12L15 14" :stroke="phoneStore.currentTab === 'recents' ? '#00C853' : '#1C1C1E'" stroke-width="2.2" stroke-linecap="round" />
              </svg>
            </div>
            <span class="capsule-label">通话记录</span>
          </button>

          <button
            class="capsule-tab-item"
            :class="{ active: phoneStore.currentTab === 'contacts' }"
            @click="switchTab('contacts')"
          >
            <div class="capsule-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" :stroke="phoneStore.currentTab === 'contacts' ? '#00C853' : '#1C1C1E'" stroke-width="2.2" stroke-linecap="round" />
                <circle cx="12" cy="7" r="4" :stroke="phoneStore.currentTab === 'contacts' ? '#00C853' : '#1C1C1E'" stroke-width="2.2" />
              </svg>
            </div>
            <span class="capsule-label">联系人</span>
          </button>
        </div>

        <!-- 右侧：独立圆形悬浮操作球 (FAB) -->
        <button
          class="floating-action-ball"
          :title="phoneStore.currentTab === 'recents' ? '打开拨号盘' : '新建联系人'"
          @click="handleFabClick"
        >
          <!-- 通话记录：9宫格按键 -->
          <svg v-if="phoneStore.currentTab === 'recents'" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="5" r="2" fill="#1C1C1E" />
            <circle cx="12" cy="5" r="2" fill="#1C1C1E" />
            <circle cx="19" cy="5" r="2" fill="#1C1C1E" />
            <circle cx="5" cy="12" r="2" fill="#1C1C1E" />
            <circle cx="12" cy="12" r="2" fill="#1C1C1E" />
            <circle cx="19" cy="12" r="2" fill="#1C1C1E" />
            <circle cx="5" cy="19" r="2" fill="#1C1C1E" />
            <circle cx="12" cy="19" r="2" fill="#1C1C1E" />
            <circle cx="19" cy="19" r="2" fill="#1C1C1E" />
          </svg>
          <!-- 联系人：+ 新建 -->
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </Transition>

    <!-- 拨号键盘浮层面板（抽屉式弹出/收起） -->
    <Transition name="keypad-slide">
      <div v-if="phoneStore.isKeypadOpen && phoneStore.currentTab === 'recents'" class="keypad-drawer-wrap">
        <PhoneKeypad />
      </div>
    </Transition>

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

/* 主滚动视口 */
.phone-scroll-viewport {
  flex: 1;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

/* 大标题文字行与联系人数量小标 */
.header-titles-block {
  display: flex;
  flex-direction: column;
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

/* 右上角快捷动作：搜索 & 电话设置 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-action-btn {
  position: relative;
  background: none;
  border: none;
  padding: 6px;
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
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #FF3B30;
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

/* 底部双体悬浮岛容器 */
.phone-floating-nav-container {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: calc(var(--safe-bottom, 20px) + 12px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
  z-index: 45;
}

/* 左侧双标签悬浮胶囊岛 */
.floating-capsule-island {
  pointer-events: auto;
  display: flex;
  align-items: center;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 999px;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  gap: 4px;
}

.capsule-tab-item {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.capsule-tab-item.active {
  background-color: #E8F8EE;
}

.capsule-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.capsule-label {
  font-size: 13px;
  font-weight: 500;
  color: #1C1C1E;
}

.capsule-tab-item.active .capsule-label {
  color: #00C853;
  font-weight: 600;
}

/* 右侧独立圆形悬浮操作球 (FAB) */
.floating-action-ball {
  pointer-events: auto;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.floating-action-ball:active {
  transform: scale(0.92);
  background-color: #F2F3F5;
}

/* 拨号键盘浮层 */
.keypad-drawer-wrap {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: #FFFFFF;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.08);
  padding-bottom: calc(var(--safe-bottom, 20px) + 8px);
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
