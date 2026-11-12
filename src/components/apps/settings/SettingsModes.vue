<script setup>
import { ref, computed } from 'vue'
import { useModesAndRoutinesStore } from '../../../stores/modesAndRoutinesStore.js'
import GlassNavBar from '../../ui/GlassNavBar.vue'
import ModesTab from './modes/ModesTab.vue'
import RoutinesTab from './modes/RoutinesTab.vue'
import DiscoverTab from './modes/DiscoverTab.vue'
import ModeDetailView from './modes/ModeDetailView.vue'
import ModePresetWizard from './modes/ModePresetWizard.vue'
import RoutineDetailView from './modes/RoutineDetailView.vue'
import AddCustomModeModal from './modes/AddCustomModeModal.vue'
import HistoryModal from './modes/HistoryModal.vue'

const emit = defineEmits(['back'])

const store = useModesAndRoutinesStore()

// 视图层级状态
const activeTab = ref('modes') // 'modes' | 'routines' | 'discover'
const selectedModeId = ref(null)
const selectedPresetWizardMode = ref(null)
const selectedRoutine = ref(null)
const routineInitialEdit = ref(false)
const showAddModeModal = ref(false)
const showHistoryModal = ref(false)
const showMoreMenu = ref(false)
const isSearching = ref(false)
const searchQuery = ref('')
const toastMessage = ref('')
let toastTimer = null

// 判断是否存在任何处于激活状态的全屏子视图
const hasActiveSubpage = computed(() =>
  Boolean(
    selectedPresetWizardMode.value ||
    selectedModeId.value ||
    selectedRoutine.value ||
    showAddModeModal.value ||
    showHistoryModal.value
  )
)

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

// 打开预设向导
function openPresetWizard(mode) {
  selectedPresetWizardMode.value = mode
}

// 预设向导点击开始后进入详情
function handlePresetWizardStart(optId) {
  if (selectedPresetWizardMode.value) {
    const modeId = selectedPresetWizardMode.value.id
    store.configureModeWithPreset(modeId, optId)
    selectedPresetWizardMode.value = null
    selectedModeId.value = modeId
  }
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

// 删除模式
function handleDeleteMode(modeId) {
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
    <!-- 主界面（当没有子级全屏展开时渲染，杜绝背景穿透） -->
    <div v-if="!hasActiveSubpage" class="main-page-wrapper" @click="showMoreMenu = false">
      <!-- 统一玻璃悬浮导航条 -->
      <GlassNavBar
        overlay
        :title="isScrolled || activeTab !== 'modes' ? '模式和日常程序' : ''"
        @back="emit('back')"
      >
        <template #right>
          <div class="nav-right-actions">
            <!-- 日常程序 Tab 专属快捷创建按钮 -->
            <button
              v-if="activeTab === 'routines'"
              class="nav-icon-btn"
              title="添加日常程序"
              @click="createNewRoutine"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>

            <!-- 搜索按钮 -->
            <button class="nav-icon-btn" title="搜索" @click="isSearching = true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            <!-- 更多选项按钮 -->
            <button class="nav-icon-btn" title="更多选项" @click.stop="showMoreMenu = !showMoreMenu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </template>
      </GlassNavBar>

      <!-- 溢出菜单浮层 -->
      <div v-if="showMoreMenu" class="more-menu-dropdown" @click.stop>
        <div class="menu-item" @click="showToast('已进入编辑排序模式'); showMoreMenu = false">
          编辑
        </div>
        <div class="menu-item" @click="showHistoryModal = true; showMoreMenu = false">
          历史记录
        </div>
        <div class="menu-item" @click="showToast('模式与日常程序设置已就绪'); showMoreMenu = false">
          设置
        </div>
      </div>

      <!-- 搜索浮层 -->
      <div v-if="isSearching" class="search-overlay">
        <div class="search-overlay-header">
          <div class="search-input-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#71717A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
            <div class="result-badge" :style="{ backgroundColor: res.color || '#1B64DA' }"></div>
            <div class="result-info">
              <div class="result-title">{{ res.title }}</div>
              <div class="result-sub">{{ res.sub }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 滚动容器：底部留白充足，避免列表内容透出或被底栏截断 -->
      <div class="main-scrollable-content" @scroll="onScroll">
        <!-- 仅在“模式”Tab 下展示大标题折叠区 -->
        <div v-if="activeTab === 'modes'" class="extended-title-container">
          <h1 class="extended-title">模式和日常程序</h1>
        </div>

        <!-- 3 个 Tab 的主体组件 -->
        <ModesTab
          v-if="activeTab === 'modes'"
          @open-mode="openModeDetail"
          @open-preset-wizard="openPresetWizard"
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

      <!-- 悬浮胶囊 Tab 导航栏：浅色半透明磨砂，高 z-index，防透遮罩 -->
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
          <div class="dock-tab-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
            </svg>
            <span class="tab-badge-dot"></span>
          </div>
          <span class="dock-tab-text">发现</span>
        </button>
      </nav>
    </div>

    <!-- 预设配置向导全屏子页 -->
    <ModePresetWizard
      v-if="selectedPresetWizardMode"
      :mode="selectedPresetWizardMode"
      @back="selectedPresetWizardMode = null"
      @start="handlePresetWizardStart"
    />

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

    <!-- 添加模式全屏抽屉 -->
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
  background: #F4F5F7;
  color: #18181B;
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

.nav-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #18181B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.nav-icon-btn:active {
  background: rgba(0, 0, 0, 0.05);
}

.nav-right-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 溢出菜单 */
.more-menu-dropdown {
  position: absolute;
  top: calc(var(--safe-top, 44px) + 50px);
  right: 12px;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 6px;
  min-width: 140px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.menu-item {
  padding: 11px 16px;
  font-size: 15px;
  font-weight: 500;
  color: #18181B;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.menu-item:active {
  background: #F4F5F7;
}

/* 搜索浮层 */
.search-overlay {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
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
  background: #F4F5F7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
}

.search-input-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  padding: 0 12px;
  height: 40px;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.search-inner-input {
  flex: 1;
  border: none;
  background: transparent;
  color: #18181B;
  font-size: 14px;
  outline: none;
}

.search-inner-input::placeholder {
  color: #8E8E93;
}

.search-clear-btn {
  border: none;
  background: rgba(0, 0, 0, 0.08);
  color: #71717A;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-cancel-btn {
  border: none;
  background: transparent;
  color: #1B64DA;
  font-size: 15px;
  font-weight: 600;
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
  color: #71717A;
  font-size: 14px;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  margin-bottom: 8px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
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
  font-weight: 600;
  color: #18181B;
  margin-bottom: 2px;
}

.result-sub {
  font-size: 13px;
  color: #71717A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 滚动主内容区 */
.main-scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding-top: calc(var(--safe-top, 44px) + 54px);
}

/* 大标题折叠区 */
.extended-title-container {
  padding: 16px 20px 20px;
}

.extended-title {
  font-size: 28px;
  font-weight: 700;
  color: #18181B;
  letter-spacing: -0.3px;
  margin: 0;
}

/* 底部悬浮三 Tab 停靠栏：浅色半透明高质感胶囊，防透遮罩 */
.floating-dock-bar {
  position: absolute;
  bottom: calc(var(--home-indicator-inset, 14px) + 16px);
  left: 24px;
  right: 24px;
  height: 56px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  z-index: 30;
}

.sliding-pill-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc((100% - 8px) / 3);
  background: rgba(0, 0, 0, 0.06);
  border-radius: 9999px;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.dock-tab-btn {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  color: #71717A;
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
  color: #18181B;
  font-weight: 600;
}

.dock-tab-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-badge-dot {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #EF4444;
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
  background: rgba(24, 24, 27, 0.92);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
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
