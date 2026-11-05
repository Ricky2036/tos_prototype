<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'
import { useBackHandler } from '../../../composables/backRegistry'
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
}
</script>

<template>
  <div class="phone-app">
    <!-- 顶部状态大标题与操作区 -->
    <div class="phone-top-header">
      <div class="header-titles-wrap">
        <h1 class="page-large-title">
          {{ phoneStore.currentTab === 'recents' ? '通话记录' : '联系人' }}
        </h1>
        <div v-if="phoneStore.currentTab === 'contacts'" class="contacts-sub-count">
          {{ phoneStore.contacts.length }} 位联系人
        </div>
      </div>

      <!-- 右上角快捷动作：搜索 & 电话设置 -->
      <div class="header-actions">
        <button class="header-action-btn search-trigger" @click="phoneStore.isSearchActive = true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7.5" stroke="#1C1C1E" stroke-width="2.2" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" />
          </svg>
        </button>

        <button class="header-action-btn settings-trigger" @click="isSettingsOpen = true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#1C1C1E" stroke-width="2" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="settings-red-dot"></span>
        </button>
      </div>
    </div>

    <!-- 核心视图标签页切换 -->
    <div class="phone-tabs-viewport">
      <PhoneRecentsTab v-if="phoneStore.currentTab === 'recents'" />
      <PhoneContactsTab v-else />
    </div>

    <!-- 拨号键盘浮层面板（抽屉式弹出/收起） -->
    <Transition name="keypad-slide">
      <div v-if="phoneStore.isKeypadOpen && phoneStore.currentTab === 'recents'" class="keypad-drawer-wrap">
        <PhoneKeypad />
      </div>
    </Transition>

    <!-- 底部常驻导航控制栏 -->
    <div class="phone-bottom-nav">
      <!-- 通话记录标签 -->
      <button
        class="nav-tab-item"
        :class="{ active: phoneStore.currentTab === 'recents' }"
        @click="switchTab('recents')"
      >
        <div class="nav-icon-wrap" :class="{ pill: phoneStore.currentTab === 'recents' }">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" :stroke="phoneStore.currentTab === 'recents' ? '#00C853' : '#1C1C1E'" stroke-width="2.2" />
            <path d="M12 7V12L15 14" :stroke="phoneStore.currentTab === 'recents' ? '#00C853' : '#1C1C1E'" stroke-width="2.2" stroke-linecap="round" />
          </svg>
        </div>
        <span class="nav-label">通话记录</span>
      </button>

      <!-- 联系人标签 -->
      <button
        class="nav-tab-item"
        :class="{ active: phoneStore.currentTab === 'contacts' }"
        @click="switchTab('contacts')"
      >
        <div class="nav-icon-wrap" :class="{ pill: phoneStore.currentTab === 'contacts' }">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" :stroke="phoneStore.currentTab === 'contacts' ? '#00C853' : '#1C1C1E'" stroke-width="2.2" stroke-linecap="round" />
            <circle cx="12" cy="7" r="4" :stroke="phoneStore.currentTab === 'contacts' ? '#00C853' : '#1C1C1E'" stroke-width="2.2" />
          </svg>
        </div>
        <span class="nav-label">联系人</span>
      </button>

      <!-- 键盘开关 / 新增联系人快捷键 -->
      <div class="nav-extra-action">
        <!-- 通话记录页：3x3 键盘展开/收起按钮 -->
        <button
          v-if="phoneStore.currentTab === 'recents'"
          class="keypad-toggle-btn"
          :class="{ active: phoneStore.isKeypadOpen }"
          @click="phoneStore.toggleKeypad"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="5" r="1.8" :fill="phoneStore.isKeypadOpen ? '#00C853' : '#1C1C1E'" />
            <circle cx="12" cy="5" r="1.8" :fill="phoneStore.isKeypadOpen ? '#00C853' : '#1C1C1E'" />
            <circle cx="19" cy="5" r="1.8" :fill="phoneStore.isKeypadOpen ? '#00C853' : '#1C1C1E'" />
            <circle cx="5" cy="12" r="1.8" :fill="phoneStore.isKeypadOpen ? '#00C853' : '#1C1C1E'" />
            <circle cx="12" cy="12" r="1.8" :fill="phoneStore.isKeypadOpen ? '#00C853' : '#1C1C1E'" />
            <circle cx="19" cy="12" r="1.8" :fill="phoneStore.isKeypadOpen ? '#00C853' : '#1C1C1E'" />
            <circle cx="5" cy="19" r="1.8" :fill="phoneStore.isKeypadOpen ? '#00C853' : '#1C1C1E'" />
            <circle cx="12" cy="19" r="1.8" :fill="phoneStore.isKeypadOpen ? '#00C853' : '#1C1C1E'" />
            <circle cx="19" cy="19" r="1.8" :fill="phoneStore.isKeypadOpen ? '#00C853' : '#1C1C1E'" />
          </svg>
        </button>

        <!-- 联系人页：+ 新增联系人 -->
        <button v-else class="add-contact-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>

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

/* 顶部大标题与工具栏 */
.phone-top-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 50px 24px 12px;
  background: #FFFFFF;
}

.header-titles-wrap {
  display: flex;
  flex-direction: column;
}

.page-large-title {
  font-size: 30px;
  font-weight: 700;
  color: #1C1C1E;
  margin: 0;
  letter-spacing: -0.5px;
}

.contacts-sub-count {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 3px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 6px;
}

.header-action-btn {
  position: relative;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-action-btn:active {
  opacity: 0.6;
}

.settings-red-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #FF3B30;
}

/* 视图主视口 */
.phone-tabs-viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* 拨号键盘浮层 */
.keypad-drawer-wrap {
  position: absolute;
  bottom: 64px;
  left: 0;
  right: 0;
  z-index: 30;
}

/* 底部导航控制栏 */
.phone-bottom-nav {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #FFFFFF;
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 16px;
  z-index: 40;
}

.nav-tab-item {
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 4px 16px;
}

.nav-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px 18px;
  border-radius: 999px;
  transition: background-color 0.18s ease;
}

.nav-icon-wrap.pill {
  background-color: #F0FDF4;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  color: #8E8E93;
}

.nav-tab-item.active .nav-label {
  color: #00C853;
  font-weight: 600;
}

.nav-extra-action {
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.keypad-toggle-btn,
.add-contact-btn {
  background: none;
  border: none;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
}

.keypad-toggle-btn:active,
.add-contact-btn:active {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 动画转场定义 */
.keypad-slide-enter-active,
.keypad-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease;
}

.keypad-slide-enter-from,
.keypad-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
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
