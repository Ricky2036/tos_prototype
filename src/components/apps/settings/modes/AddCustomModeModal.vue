<script setup>
import { ref, computed } from 'vue'
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import { MODE_PALETTE, CUSTOM_ICON_GRID, getIconPath } from './modeIcons.js'

const emit = defineEmits(['close', 'created', 'show-toast'])

const store = useModesAndRoutinesStore()

const modeName = ref('')
const selectedColor = ref(MODE_PALETTE[7]) // 默认宝蓝
const selectedIcon = ref(CUSTOM_ICON_GRID[0].key) // 默认阅读

const suggestions = ['学习', '阅读', '冥想', '烹饪', '骑行', '旅行', '宠物', '专注']

const canSubmit = computed(() => {
  return modeName.value.trim().length > 0
})

function applySuggestion(item) {
  modeName.value = item
}

function handleDone() {
  if (!canSubmit.value) return
  const newMode = store.addCustomMode({
    name: modeName.value,
    color: selectedColor.value,
    iconKey: selectedIcon.value
  })
  emit('show-toast', `已创建“${newMode.name}”模式`)
  emit('created', newMode.id)
}
</script>

<template>
  <div class="add-mode-modal">
    <!-- 顶部导航栏 -->
    <div class="modal-nav-bar">
      <button class="nav-back-btn" @click="emit('close')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <div class="nav-title">创建模式</div>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 滚动配置区 -->
    <div class="modal-scroll-body">
      <!-- 动态预览大徽章 -->
      <div class="preview-hero">
        <div class="preview-badge" :style="{ backgroundColor: selectedColor }">
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="getIconPath(selectedIcon)" />
          </svg>
        </div>
      </div>

      <!-- 名称输入框 -->
      <div class="name-input-group">
        <input
          v-model="modeName"
          type="text"
          class="mode-name-input"
          placeholder="输入模式名称"
          maxlength="16"
          autofocus
        />
        <button v-if="modeName" class="clear-input-btn" @click="modeName = ''">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- 快捷标签推荐 -->
      <div class="suggestion-chips">
        <button
          v-for="s in suggestions"
          :key="s"
          class="chip-btn"
          @click="applySuggestion(s)"
        >
          {{ s }}
        </button>
      </div>

      <!-- 调色板（16 色） -->
      <div class="picker-section">
        <div class="section-label">选择颜色</div>
        <div class="color-palette-grid">
          <button
            v-for="c in MODE_PALETTE"
            :key="c"
            class="color-swatch-btn"
            :style="{ backgroundColor: c }"
            :class="{ 'is-selected': selectedColor === c }"
            @click="selectedColor = c"
          >
            <svg
              v-if="selectedColor === c"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 图标网格（36 个） -->
      <div class="picker-section">
        <div class="section-label">选择图标</div>
        <div class="icons-grid">
          <button
            v-for="item in CUSTOM_ICON_GRID"
            :key="item.key"
            class="icon-grid-btn"
            :class="{ 'is-selected': selectedIcon === item.key }"
            @click="selectedIcon = item.key"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              :stroke="selectedIcon === item.key ? selectedColor : '#A1A1AA'"
              stroke-width="2.1"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path :d="item.path" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 底部固定完成/取消栏 -->
    <div class="modal-footer-dock">
      <button class="footer-btn btn-cancel" @click="emit('close')">
        取消
      </button>
      <button
        class="footer-btn btn-done"
        :class="{ 'is-disabled': !canSubmit }"
        :disabled="!canSubmit"
        @click="handleDone"
      >
        完成
      </button>
    </div>
  </div>
</template>

<style scoped>
.add-mode-modal {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary, #000000);
  z-index: 60;
  overflow: hidden;
}

.modal-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--safe-top, 44px);
  height: calc(var(--safe-top, 44px) + 52px);
  padding-left: 8px;
  padding-right: 8px;
  flex: none;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  box-sizing: border-box;
}

.nav-back-btn {
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

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
}

.nav-placeholder {
  width: 40px;
}

/* 滚动区 */
.modal-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px 90px;
}

.preview-hero {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.preview-badge {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  transition: background-color 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 名称输入框 */
.name-input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-card-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  border-radius: 16px;
  padding: 0 16px;
  height: 50px;
  margin-bottom: 12px;
}

.mode-name-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text-primary, #FFFFFF);
  font-size: 16px;
  font-weight: 500;
  outline: none;
}

.mode-name-input::placeholder {
  color: var(--color-text-tertiary, #636366);
}

.clear-input-btn {
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
}

/* 推荐标签 */
.suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.chip-btn {
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-secondary, #A1A1AA);
  font-size: 13px;
  padding: 5px 12px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-btn:active {
  background: rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
}

/* 颜色选择网格 */
.picker-section {
  margin-bottom: 24px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: 12px;
  padding: 0 4px;
}

.color-palette-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  justify-items: center;
}

.color-swatch-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  position: relative;
}

.color-swatch-btn:active {
  transform: scale(0.9);
}

.color-swatch-btn.is-selected {
  transform: scale(1.1);
  box-shadow: 0 0 0 2.5px #FFFFFF;
}

/* 图标网格 */
.icons-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  justify-items: center;
}

.icon-grid-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.icon-grid-btn:active {
  transform: scale(0.92);
}

.icon-grid-btn.is-selected {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

/* 底部操作条 */
.modal-footer-dock {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(64px + var(--home-indicator-inset, 14px));
  padding: 0 16px var(--home-indicator-inset, 14px);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(18, 18, 20, 0.94);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  box-sizing: border-box;
  z-index: 20;
}

.footer-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel {
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-secondary, #A1A1AA);
}

.btn-done {
  border: none;
  background: #2563EB;
  color: #FFFFFF;
}

.btn-done.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
