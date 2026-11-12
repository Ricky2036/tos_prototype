<script setup>
import { ref, computed } from 'vue'
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import { getIconPath, CUSTOM_ICON_GRID } from './modeIcons.js'
import GlassNavBar from '../../../ui/GlassNavBar.vue'

const emit = defineEmits(['close', 'created', 'show-toast'])

const store = useModesAndRoutinesStore()

const deletedPresets = computed(() => store.deletedPresetModes)
// 如果有已删除的预设模式，优先展示恢复选择列表
const showSelectionList = ref(deletedPresets.value.length > 0)

// 自定义模式表单数据
const modeName = ref('自定义')
const selectedColor = ref('#2563EB')
const selectedIconKey = ref('star')

// 16 种真机高频 One UI 色板
const COLOR_PALETTE = [
  { name: '粉色', hex: '#EC4899' },
  { name: '鲑鱼粉', hex: '#F43F5E' },
  { name: '橙色', hex: '#F97316' },
  { name: '红色', hex: '#EF4444' },
  { name: '黄色', hex: '#EAB308' },
  { name: '石灰绿', hex: '#84CC16' },
  { name: '绿色', hex: '#22C55E' },
  { name: '海蓝色', hex: '#06B6D4' },
  { name: '薄荷绿', hex: '#14B8A6' },
  { name: '蓝玉', hex: '#0EA5E9' },
  { name: '蓝色', hex: '#2563EB' },
  { name: '靛蓝色', hex: '#6366F1' },
  { name: '紫色', hex: '#8B5CF6' },
  { name: '洋红色', hex: '#D946EF' },
  { name: '灰色', hex: '#64748B' },
  { name: '深青', hex: '#0F766E' }
]

const availableIcons = CUSTOM_ICON_GRID

function handleRestorePreset(modeId) {
  const restored = store.restorePresetMode(modeId)
  if (restored) {
    emit('show-toast', `已恢复“${restored.name}”模式`)
    emit('created', restored.id)
  }
}

function handleOpenCustomForm() {
  showSelectionList.value = false
}

function handleCreateCustom() {
  const name = modeName.value.trim() || '自定义'
  const newMode = store.addCustomMode({
    name,
    color: selectedColor.value,
    iconKey: selectedIconKey.value
  })
  emit('show-toast', `已创建“${newMode.name}”模式`)
  emit('created', newMode.id)
}
</script>

<template>
  <div class="add-mode-page">
    <GlassNavBar
      overlay
      title="添加模式"
      @back="showSelectionList ? emit('close') : (deletedPresets.length > 0 ? (showSelectionList = true) : emit('close'))"
    />

    <!-- 视图 1: 当存在已删除预设模式时的选择列表 -->
    <div v-if="showSelectionList" class="selection-view-scrollable">
      <div class="list-section-title">选择要添加的模式</div>

      <div class="presets-restore-list">
        <div
          v-for="preset in deletedPresets"
          :key="preset.id"
          class="restore-item-card"
          @click="handleRestorePreset(preset.id)"
        >
          <div class="restore-icon-badge" :style="{ backgroundColor: preset.color }">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path :d="getIconPath(preset.iconKey)" />
            </svg>
          </div>
          <div class="restore-info">
            <div class="restore-name">{{ preset.name }}</div>
            <div class="restore-sub">预设模式</div>
          </div>
          <div class="chevron-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>

        <!-- 自定义入口 -->
        <div class="restore-item-card custom-entry" @click="handleOpenCustomForm">
          <div class="restore-icon-badge custom-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div class="restore-info">
            <div class="restore-name">自定义</div>
            <div class="restore-sub">创建全新的个性化模式</div>
          </div>
          <div class="chevron-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 视图 2: 自定义模式创建表单 -->
    <div v-else class="custom-form-scrollable">
      <!-- 顶部预览徽章 -->
      <div class="preview-section">
        <div class="preview-circle" :style="{ backgroundColor: selectedColor }">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path :d="getIconPath(selectedIconKey)" />
          </svg>
        </div>
      </div>

      <!-- 模式名称输入卡片 -->
      <div class="form-card">
        <div class="card-label">模式名称</div>
        <input
          v-model="modeName"
          type="text"
          class="mode-name-input"
          placeholder="输入模式名称"
          maxlength="20"
        />
      </div>

      <!-- 颜色选择网格 (16 色) -->
      <div class="form-card">
        <div class="card-label">颜色</div>
        <div class="colors-grid">
          <button
            v-for="c in COLOR_PALETTE"
            :key="c.name"
            class="color-swatch-btn"
            :class="{ active: selectedColor === c.hex }"
            :style="{ backgroundColor: c.hex }"
            :aria-label="c.name"
            @click="selectedColor = c.hex"
          >
            <svg v-if="selectedColor === c.hex" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 图标选择网格 (24 图标) -->
      <div class="form-card">
        <div class="card-label">图标</div>
        <div class="icons-grid">
          <button
            v-for="icon in availableIcons"
            :key="icon.key"
            class="icon-grid-btn"
            :class="{ active: selectedIconKey === icon.key }"
            :aria-label="icon.label"
            @click="selectedIconKey = icon.key"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path :d="icon.path" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 底部固定操作栏（仅在自定义表单视图展示） -->
    <div v-if="!showSelectionList" class="form-bottom-bar">
      <button class="bottom-btn btn-cancel" @click="deletedPresets.length > 0 ? (showSelectionList = true) : emit('close')">
        取消
      </button>
      <button class="bottom-btn btn-done" @click="handleCreateCustom">
        完成
      </button>
    </div>
  </div>
</template>

<style scoped>
.add-mode-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  color: #18181B;
  z-index: 70;
  overflow: hidden;
  user-select: none;
}

/* 选择列表 */
.selection-view-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 54px) 16px calc(var(--home-indicator-inset, 14px) + 30px);
}

.list-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #71717A;
  margin-bottom: 12px;
  padding: 0 4px;
}

.presets-restore-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.restore-item-card {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  padding: 16px 18px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: transform 0.15s ease, background 0.15s ease;
}

.restore-item-card:active {
  transform: scale(0.985);
  background: #FAFAFA;
}

.restore-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.custom-badge {
  background: #F4F5F7;
  color: #1B64DA;
}

.restore-info {
  flex: 1;
  min-width: 0;
}

.restore-name {
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
  margin-bottom: 2px;
}

.restore-sub {
  font-size: 13px;
  color: #71717A;
}

.chevron-icon {
  color: #A1A1AA;
}

/* 自定义表单滚动区 */
.custom-form-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 54px) 16px calc(var(--home-indicator-inset, 14px) + 84px);
}

.preview-section {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.preview-circle {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: background-color 0.2s ease;
}

.form-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 24px;
  padding: 16px 18px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.card-label {
  font-size: 13px;
  font-weight: 600;
  color: #71717A;
  margin-bottom: 10px;
}

.mode-name-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
  box-sizing: border-box;
}

/* 颜色网格 (8 列) */
.colors-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  justify-items: center;
}

.color-swatch-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.color-swatch-btn:active {
  transform: scale(0.9);
}

.color-swatch-btn.active {
  box-shadow: 0 0 0 3px #FFFFFF, 0 0 0 5px #1B64DA;
}

/* 图标网格 (6 列) */
.icons-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

.icon-grid-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #F4F5F7;
  color: #71717A;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-grid-btn:active {
  transform: scale(0.92);
}

.icon-grid-btn.active {
  background: #1B64DA;
  border-color: #1B64DA;
  color: #FFFFFF;
}

/* 底部操作栏 */
.form-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px calc(var(--home-indicator-inset, 14px) + 14px);
  background: #FFFFFF;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 10;
}

.bottom-btn {
  flex: 1;
  padding: 12px;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-cancel {
  background: transparent;
  color: #71717A;
  margin-right: 12px;
}

.btn-done {
  background: #1B64DA;
  color: #FFFFFF;
}
</style>
