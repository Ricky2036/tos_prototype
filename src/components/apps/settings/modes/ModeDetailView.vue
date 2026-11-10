<script setup>
import { computed, ref } from 'vue'
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import { getIconPath } from './modeIcons.js'

const props = defineProps({
  modeId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['back', 'show-toast', 'delete-mode'])

const store = useModesAndRoutinesStore()

const currentMode = computed(() => {
  return store.getMode(props.modeId) || {}
})

const isActive = computed(() => {
  return store.activeModeId === props.modeId
})

const showMoreMenu = ref(false)

function handleToggleActive() {
  store.toggleMode(props.modeId)
  if (isActive.value) {
    emit('show-toast', `“${currentMode.value.name}”模式已开启`)
  } else {
    emit('show-toast', `“${currentMode.value.name}”模式已关闭`)
  }
}

function handleDndToggle() {
  if (currentMode.value.dnd) {
    currentMode.value.dnd.enabled = !currentMode.value.dnd.enabled
    emit('show-toast', currentMode.value.dnd.enabled ? '已启用免打扰' : '已关闭免打扰')
  }
}

function handleSettingToggle(setting) {
  setting.enabled = !setting.enabled
  emit('show-toast', `${setting.label}已${setting.enabled ? '开启' : '关闭'}`)
}

function handleDeleteCustom() {
  showMoreMenu.value = false
  emit('delete-mode', props.modeId)
}
</script>

<template>
  <div class="mode-detail-page">
    <!-- 顶部导航栏 -->
    <div class="detail-nav-bar">
      <button class="nav-btn" @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      <div class="nav-title">{{ currentMode.name }}</div>

      <div class="nav-actions">
        <button
          v-if="currentMode.isCustom"
          class="nav-btn"
          @click="showMoreMenu = !showMoreMenu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
        <div v-else class="nav-placeholder"></div>
      </div>

      <!-- 弹出菜单 -->
      <div v-if="showMoreMenu" class="more-menu-popover" @click.stop>
        <div class="more-menu-item text-danger" @click="handleDeleteCustom">
          删除模式
        </div>
      </div>
    </div>

    <!-- 滚动主体内容 -->
    <div class="detail-body-scrollable" @click="showMoreMenu = false">
      <!-- 头部大图与状态动作 -->
      <div class="hero-section">
        <div
          class="hero-icon-badge"
          :style="{ backgroundColor: currentMode.color }"
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="getIconPath(currentMode.iconKey)" />
          </svg>
        </div>

        <h1 class="hero-title">{{ currentMode.name }}</h1>
        <p class="hero-desc">{{ currentMode.description }}</p>

        <!-- 主控开启/关闭胶囊按钮 -->
        <button
          class="hero-action-btn"
          :class="{ 'is-active': isActive }"
          @click="handleToggleActive"
        >
          {{ isActive ? '关闭' : '启用' }}
        </button>
      </div>

      <!-- 分组 1: 自动开启 -->
      <div class="detail-group">
        <div class="group-header">自动开启</div>
        <div class="group-card">
          <div class="cell-row" @click="emit('show-toast', '可调整触发条件与定时安排')">
            <div class="cell-main">
              <div class="cell-title">{{ currentMode.condition?.title || '开启时机' }}</div>
              <div class="cell-sub">{{ currentMode.condition?.value || '未设置' }}</div>
            </div>
            <div class="cell-chevron">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 分组 2: 保持专注 (免打扰) -->
      <div class="detail-group">
        <div class="group-header">保持专注</div>
        <div class="group-card">
          <div class="cell-row">
            <div class="cell-main">
              <div class="cell-title">免打扰</div>
              <div class="cell-sub">
                {{ currentMode.dnd?.enabled ? `允许来自 ${currentMode.dnd?.allowedContacts || '所有人'} 的提醒` : '未开启' }}
              </div>
            </div>
            <button
              class="mini-toggle-pill"
              :class="{ 'is-on': currentMode.dnd?.enabled }"
              @click="handleDndToggle"
            >
              {{ currentMode.dnd?.enabled ? '开' : '关' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 分组 3: 更改设置 -->
      <div class="detail-group">
        <div class="group-header">更改设置</div>
        <div class="group-card">
          <div
            v-for="(setting, index) in currentMode.settingsChanges"
            :key="setting.key"
            class="cell-row"
            :class="{ 'border-bottom': index !== currentMode.settingsChanges.length - 1 }"
          >
            <div class="cell-main">
              <div class="cell-title">{{ setting.label }}</div>
              <div class="cell-sub">{{ setting.value }}</div>
            </div>
            <button
              class="mini-toggle-pill"
              :class="{ 'is-on': setting.enabled }"
              @click="handleSettingToggle(setting)"
            >
              {{ setting.enabled ? '开' : '关' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 分组 4: 外观 (壁纸联动) -->
      <div class="detail-group">
        <div class="group-header">外观</div>
        <div class="wallpaper-preview-grid">
          <div class="wallpaper-preview-card" @click="emit('show-toast', '已绑定当前锁屏壁纸')">
            <div class="wallpaper-mock lockscreen-mock">
              <div class="mock-clock">12:00</div>
              <div class="mock-dock-bar"></div>
            </div>
            <div class="wallpaper-card-label">锁定屏幕</div>
          </div>
          <div class="wallpaper-preview-card" @click="emit('show-toast', '已绑定当前主屏幕壁纸')">
            <div class="wallpaper-mock homescreen-mock">
              <div class="mock-grid">
                <span class="mock-dot"></span>
                <span class="mock-dot"></span>
                <span class="mock-dot"></span>
                <span class="mock-dot"></span>
              </div>
            </div>
            <div class="wallpaper-card-label">主屏幕</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mode-detail-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary, #000000);
  z-index: 50;
  overflow: hidden;
}

/* 顶部导航条 */
.detail-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--safe-top, 44px);
  height: calc(var(--safe-top, 44px) + 52px);
  padding-left: 8px;
  padding-right: 8px;
  flex: none;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  position: relative;
  box-sizing: border-box;
}

.nav-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-primary, #FFFFFF);
  border-radius: 50%;
  cursor: pointer;
}

.nav-btn:active {
  background: rgba(255, 255, 255, 0.08);
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
}

.nav-actions {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-placeholder {
  width: 40px;
}

/* 更多菜单 */
.more-menu-popover {
  position: absolute;
  top: 48px;
  right: 12px;
  background: #1C1C1E;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 6px;
  min-width: 120px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.more-menu-item {
  padding: 10px 14px;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.more-menu-item:active {
  background: rgba(255, 255, 255, 0.08);
}

.text-danger {
  color: #EF4444;
}

/* 滚动区 */
.detail-body-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px 80px;
}

/* Hero 头部 */
.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 28px;
}

.hero-icon-badge {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
}

.hero-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: 6px;
}

.hero-desc {
  font-size: 14px;
  line-height: 1.45;
  color: var(--color-text-secondary, #8E8E93);
  max-width: 280px;
  margin-bottom: 18px;
}

/* 主操作按钮 */
.hero-action-btn {
  min-width: 120px;
  padding: 9px 28px;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.15));
  background: rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-action-btn:active {
  transform: scale(0.96);
}

.hero-action-btn.is-active {
  background: #2563EB;
  border-color: #2563EB;
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
}

/* 分组样式：纯四边边框 */
.detail-group {
  margin-bottom: 20px;
}

.group-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: 8px;
  padding: 0 4px;
}

.group-card {
  background: var(--color-card-bg, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  overflow: hidden;
}

.cell-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.cell-row:active {
  background: rgba(255, 255, 255, 0.06);
}

.cell-row.border-bottom {
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
}

.cell-main {
  flex: 1;
  min-width: 0;
}

.cell-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: 2px;
}

.cell-sub {
  font-size: 13px;
  color: var(--color-text-secondary, #8E8E93);
}

.cell-chevron {
  color: var(--color-text-tertiary, #636366);
  display: flex;
  align-items: center;
}

/* 紧凑开关药丸 */
.mini-toggle-pill {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-secondary, #8E8E93);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mini-toggle-pill.is-on {
  background: #2563EB;
  border-color: #2563EB;
  color: #FFFFFF;
}

/* 壁纸联动网格 */
.wallpaper-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.wallpaper-preview-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-card-bg, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  padding: 14px 10px 10px;
  cursor: pointer;
}

.wallpaper-mock {
  width: 80px;
  height: 140px;
  border-radius: 12px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 12px 6px;
  margin-bottom: 8px;
}

.mock-clock {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
}

.mock-dock-bar {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.4);
}

.mock-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-top: 10px;
}

.mock-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
}

.wallpaper-card-label {
  font-size: 13px;
  color: var(--color-text-secondary, #8E8E93);
}
</style>
