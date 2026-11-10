<script setup>
import { ref, computed } from 'vue'
import { useModesAndRoutinesStore } from '../../../stores/modesAndRoutinesStore.js'
import ModesTab from './modes/ModesTab.vue'
import RoutinesTab from './modes/RoutinesTab.vue'
import DiscoverTab from './modes/DiscoverTab.vue'
import ModeDetailView from './modes/ModeDetailView.vue'
import RoutineDetailView from './modes/RoutineDetailView.vue'
import AddCustomModeModal from './modes/AddCustomModeModal.vue'
import HistoryModal from './modes/HistoryModal.vue'

const emit = defineEmits(['back'])

const store = useModesAndRoutinesStore()

// 视图层级状态
const activeTab = ref('modes') // 'modes' | 'routines' | 'discover'
const selectedModeId = ref(null)
const selectedRoutine = ref(null)
const routineInitialEdit = ref(false)
const showAddModeModal = ref(false)
const showHistoryModal = ref(false)
const showMoreMenu = ref(false)
const isSearching = ref(false)
const searchQuery = ref('')
const toastMessage = ref('')
let toastTimer = null

// 滚动折叠标题状态
const isScrolled = ref(false)

function onScroll(e) {
  const top = e.target.scrollTop
  isScrolled.value = top > 36
}

function showToast(msg) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2200)
}

function handleTabChange(tab) {
  activeTab.value = tab
  isSearching.value = false
  searchQuery.value = ''
}

// 打开模式详情
function openModeDetail(modeId) {
  selectedModeId.value = modeId
}

// 打开日常程序详情
function openRoutineDetail(routineId) {
  const found = store.routines.find((r) => r.id === routineId)
  if (found) {
    selectedRoutine.value = found
    routineInitialEdit.value = false
  }
}

// 创建新日常程序
function createNewRoutine() {
  selectedRoutine.value = {
    id: `routine_${Date.now()}`,
    name: '新建日常程序',
    description: '设置适合您日常习惯的自动化。',
    color: '#4F46E5',
    iconKey: 'sparkles',
    conditions: [],
    actions: [],
    whenEnded: [
      { id: 'end_restore', type: 'restore', title: '恢复设置', desc: '日常程序结束时返回运行前的状态' }
    ],
    enabled: true
  }
  routineInitialEdit.value = true
}

// 选择发现模板
function selectTemplate(template) {
  selectedRoutine.value = {
    id: `routine_${Date.now()}`,
    name: template.name,
    description: template.description,
    color: template.color,
    iconKey: template.iconKey,
    conditions: template.conditions ? JSON.parse(JSON.stringify(template.conditions)) : [],
    actions: template.actions ? JSON.parse(JSON.stringify(template.actions)) : [],
    whenEnded: [
      { id: 'end_restore', type: 'restore', title: '恢复设置', desc: '日常程序结束时返回运行前的状态' }
    ],
    enabled: true
  }
  routineInitialEdit.value = false
}

// 删除自定义模式
function handleDeleteMode(modeId) {
  store.deleteCustomMode(modeId)
  selectedModeId.value = null
  showToast('模式已删除')
}

// 搜索结果
const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  const res = []

  // 搜模式
  store.modes.forEach((m) => {
    if (m.name.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q))) {
      res.push({ type: 'mode', id: m.id, title: m.name, sub: m.description, color: m.color })
    }
  })

  // 搜日常程序
  store.routines.forEach((r) => {
    if (r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q))) {
      res.push({ type: 'routine', id: r.id, title: r.name, sub: r.description, color: r.color })
    }
  })

  // 搜模板
  store.discoverCategories.forEach((cat) => {
    cat.items.forEach((item) => {
      if (item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)) {
        res.push({ type: 'template', raw: item, title: item.name, sub: item.description, color: item.color })
      }
    })
  })

  return res
})

function handleSearchResultClick(item) {
  isSearching.value = false
  if (item.type === 'mode') {
    openModeDetail(item.id)
  } else if (item.type === 'routine') {
    openRoutineDetail(item.id)
  } else if (item.type === 'template') {
    selectTemplate(item.raw)
  }
}
</script>

<template>
  <div class="modes-routines-container">
    <!-- 主界面（当没有子级全屏展开时） -->
    <div class="main-page-wrapper" @click="showMoreMenu = false">
      <!-- 顶部吸顶导航栏 -->
      <div class="sticky-nav-bar" :class="{ 'is-scrolled': isScrolled || activeTab !== 'modes' }">
        <button class="nav-icon-btn" @click="emit('back')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <div class="nav-center-title" :class="{ 'title-visible': isScrolled || activeTab !== 'modes' }">
          模式和日常程序
        </div>

        <div class="nav-right-actions">
          <!-- 日常程序 Tab 专属快捷创建按钮 -->
          <button
            v-if="activeTab === 'routines'"
            class="nav-icon-btn"
            @click="createNewRoutine"
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>

          <!-- 搜索按钮 -->
          <button class="nav-icon-btn" @click="isSearching = true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          <!-- 更多选项按钮 -->
          <button class="nav-icon-btn" @click.stop="showMoreMenu = !showMoreMenu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </div>

        <!-- 溢出菜单浮层 -->
        <div v-if="showMoreMenu" class="more-menu-dropdown" @click.stop>
          <div class="menu-item" @click="showToast('已进入编辑排序模式'); showMoreMenu = false">
            选择
          </div>
          <div class="menu-item" @click="showHistoryModal = true; showMoreMenu = false">
            历史记录
          </div>
          <div class="menu-item" @click="showToast('模式与日常程序设置已就绪'); showMoreMenu = false">
            设置
          </div>
        </div>
      </div>

      <!-- 搜索浮层 -->
      <div v-if="isSearching" class="search-overlay">
        <div class="search-overlay-header">
          <div class="search-input-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-inner-input"
              placeholder="搜索模式或日常程序"
              autofocus
            />
            <button v-if="searchQuery" class="search-clear-btn" @click="searchQuery = ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <button class="search-cancel-btn" @click="isSearching = false; searchQuery = ''">
            取消
          </button>
        </div>

        <div class="search-result-scroll">
          <div v-if="searchQuery && searchResults.length === 0" class="search-empty">
            未找到相关内容
          </div>
          <div
            v-for="res in searchResults"
            :key="res.title"
            class="search-result-item"
            @click="handleSearchResultClick(res)"
          >
            <div class="result-badge" :style="{ backgroundColor: res.color || '#3B82F6' }"></div>
            <div class="result-info">
              <div class="result-title">{{ res.title }}</div>
              <div class="result-sub">{{ res.sub }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 滚动容器 -->
      <div class="main-scrollable-content" @scroll="onScroll">
        <!-- 仅在“模式”Tab 下展示大标题折叠区 -->
        <div v-if="activeTab === 'modes'" class="extended-title-container">
          <h1 class="extended-title">模式和日常程序</h1>
        </div>

        <!-- 3 个 Tab 的主体组件 -->
        <ModesTab
          v-if="activeTab === 'modes'"
          @open-mode="openModeDetail"
          @add-mode="showAddModeModal = true"
          @show-toast="showToast"
        />

        <RoutinesTab
          v-else-if="activeTab === 'routines'"
          @open-routine="openRoutineDetail"
          @create-routine="createNewRoutine"
          @show-toast="showToast"
        />

        <DiscoverTab
          v-else-if="activeTab === 'discover'"
          @select-template="selectTemplate"
        />
      </div>

      <!-- 悬浮三 Tab 导航栏：底边距严格遵循系统 Dock 规范（28px） -->
      <nav class="floating-dock-bar">
        <div
          class="sliding-pill-indicator"
          :style="{
            transform: `translateX(${activeTab === 'modes' ? 0 : activeTab === 'routines' ? 100 : 200}%)`
          }"
        ></div>

        <button
          class="dock-tab-btn"
          :class="{ active: activeTab === 'modes' }"
          @click="handleTabChange('modes')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 2"/>
          </svg>
          <span class="dock-tab-text">模式</span>
        </button>

        <button
          class="dock-tab-btn"
          :class="{ active: activeTab === 'routines' }"
          @click="handleTabChange('routines')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1.5"/>
            <rect width="7" height="7" x="14" y="3" rx="1.5"/>
            <rect width="7" height="7" x="14" y="14" rx="1.5"/>
            <rect width="7" height="7" x="3" y="14" rx="1.5"/>
          </svg>
          <span class="dock-tab-text">日常程序</span>
        </button>

        <button
          class="dock-tab-btn"
          :class="{ active: activeTab === 'discover' }"
          @click="handleTabChange('discover')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
          </svg>
          <span class="dock-tab-text">发现</span>
        </button>
      </nav>
    </div>

    <!-- 模式详情子页 -->
    <ModeDetailView
      v-if="selectedModeId"
      :mode-id="selectedModeId"
      @back="selectedModeId = null"
      @delete-mode="handleDeleteMode"
      @show-toast="showToast"
    />

    <!-- 日常程序详情与编辑子页 -->
    <RoutineDetailView
      v-if="selectedRoutine"
      :routine-data="selectedRoutine"
      :initial-edit-mode="routineInitialEdit"
      @back="selectedRoutine = null"
      @saved="selectedRoutine = null; activeTab = 'routines'"
      @show-toast="showToast"
      @open-share="showToast('已生成日常程序分享卡片')"
    />

    <!-- 添加自定义模式全屏抽屉 -->
    <AddCustomModeModal
      v-if="showAddModeModal"
      @close="showAddModeModal = false"
      @created="(newId) => { showAddModeModal = false; openModeDetail(newId) }"
      @show-toast="showToast"
    />

    <!-- 历史记录模态页 -->
    <HistoryModal
      v-if="showHistoryModal"
      @close="showHistoryModal = false"
    />

    <!-- 浮动轻提示 (Toast) -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="global-floating-toast">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.modes-routines-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary, #000000);
  color: var(--color-text-primary, #FFFFFF);
  overflow: hidden;
  user-select: none;
}

.main-page-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部吸顶导航栏 */
.sticky-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--safe-top, 44px);
  height: calc(var(--safe-top, 44px) + 52px);
  padding-left: 8px;
  padding-right: 8px;
  flex: none;
  background: transparent;
  transition: background 0.2s ease, border-color 0.2s ease;
  z-index: 20;
  position: relative;
  box-sizing: border-box;
}

.sticky-nav-bar.is-scrolled {
  background: rgba(18, 18, 20, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
}

.nav-icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--color-text-primary, #FFFFFF);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.nav-icon-btn:active {
  background: rgba(255, 255, 255, 0.08);
}

.nav-center-title {
  font-size: 17px;
  font-weight: 600;
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.2s ease;
}

.nav-center-title.title-visible {
  opacity: 1;
  transform: translateY(0);
}

.nav-right-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 溢出菜单 */
.more-menu-dropdown {
  position: absolute;
  top: 50px;
  right: 12px;
  background: #1C1C1E;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 6px;
  min-width: 130px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
  z-index: 100;
}

.menu-item {
  padding: 10px 14px;
  font-size: 14px;
  color: #FFFFFF;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.menu-item:active {
  background: rgba(255, 255, 255, 0.08);
}

/* 搜索浮层 */
.search-overlay {
  position: absolute;
  inset: 0;
  background: var(--color-bg-primary, #000000);
  z-index: 80;
  display: flex;
  flex-direction: column;
}

.search-overlay-header {
  display: flex;
  align-items: center;
  padding-top: var(--safe-top, 44px);
  height: calc(var(--safe-top, 44px) + 54px);
  padding-left: 16px;
  padding-right: 16px;
  gap: 12px;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  box-sizing: border-box;
}

.search-input-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0 12px;
  height: 38px;
  gap: 8px;
}

.search-inner-input {
  flex: 1;
  border: none;
  background: transparent;
  color: #FFFFFF;
  font-size: 14px;
  outline: none;
}

.search-inner-input::placeholder {
  color: #8E8E93;
}

.search-clear-btn {
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-cancel-btn {
  border: none;
  background: transparent;
  color: #3B82F6;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.search-result-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.search-empty {
  padding: 40px 0;
  text-align: center;
  color: #8E8E93;
  font-size: 14px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  border-radius: 12px;
  margin-bottom: 8px;
  cursor: pointer;
}

.result-badge {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex: none;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 15px;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 2px;
}

.result-sub {
  font-size: 12px;
  color: #8E8E93;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 滚动主内容区 */
.main-scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding-top: 8px;
}

/* 大标题折叠区 */
.extended-title-container {
  padding: 16px 20px 20px;
}

.extended-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-text-primary, #FFFFFF);
  letter-spacing: -0.3px;
  margin: 0;
}

/* 底部悬浮三 Tab 停靠栏 */
.floating-dock-bar {
  position: absolute;
  bottom: calc(var(--home-indicator-inset, 14px) + 14px);
  left: 20px;
  right: 20px;
  height: 56px;
  background: rgba(28, 28, 30, 0.88);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  border-radius: 9999px;
  display: flex;
  align-items: center;
  padding: 4px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  z-index: 30;
}

.sliding-pill-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc((100% - 8px) / 3);
  background: rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.dock-tab-btn {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #A1A1AA);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 9999px;
  cursor: pointer;
  z-index: 1;
  transition: color 0.15s ease;
}

.dock-tab-btn.active {
  color: #FFFFFF;
}

.dock-tab-text {
  font-size: 11px;
  font-weight: 500;
}

/* 浮动轻提示 */
.global-floating-toast {
  position: absolute;
  bottom: calc(var(--home-indicator-inset, 14px) + 82px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 32, 0.95);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  z-index: 120;
  pointer-events: none;
  white-space: nowrap;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
