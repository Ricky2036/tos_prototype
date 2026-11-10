<script setup>
import { ref } from 'vue'
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import { getIconPath } from './modeIcons.js'

const store = useModesAndRoutinesStore()

const emit = defineEmits(['open-mode', 'add-mode', 'show-toast'])

const showCueCard = ref(true)

function handleModeClick(mode) {
  emit('open-mode', mode.id)
}

function handleAddModeClick() {
  emit('add-mode')
}
</script>

<template>
  <div class="modes-tab-content">
    <!-- 头部说明文案 -->
    <div class="modes-intro-text">
      根据您正在执行的操作或您所在的位置选择模式。您的手机设置将发生变化，以匹配您的活动或情况。
    </div>

    <!-- 登录账号提示卡 -->
    <div v-if="showCueCard" class="cue-card">
      <div class="cue-body">
        若要根据您的活动自动启动模式和日常程序，您需要登录账号。
      </div>
      <div class="cue-actions">
        <button class="cue-btn cue-btn-ghost" @click="showCueCard = false">
          现在不要
        </button>
        <button class="cue-btn cue-btn-primary" @click="emit('show-toast', '已同步当前账号')">
          登录账号
        </button>
      </div>
    </div>

    <!-- 模式卡片列表 -->
    <div class="modes-card-list">
      <div
        v-for="mode in store.modes"
        :key="mode.id"
        class="mode-card"
        :class="{ 'is-active': store.activeModeId === mode.id }"
        @click="handleModeClick(mode)"
      >
        <!-- 模式左侧圆形/圆角图标徽章 -->
        <div
          class="mode-icon-badge"
          :style="{ backgroundColor: mode.color }"
        >
          <svg
            class="mode-icon-svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            stroke-width="2.1"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="getIconPath(mode.iconKey)" />
          </svg>
        </div>

        <!-- 模式文本与状态 -->
        <div class="mode-info">
          <div class="mode-title-row">
            <span class="mode-title">{{ mode.name }}</span>
            <span v-if="store.activeModeId === mode.id" class="active-badge">开</span>
          </div>
          <div class="mode-subtitle">
            {{ store.activeModeId === mode.id ? (mode.activeSubtitle || '运行中') : (mode.subtitle || '未设置') }}
          </div>
        </div>

        <!-- 右侧指示箭头 -->
        <div class="mode-chevron">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>
      </div>

      <!-- 添加模式按钮卡片 -->
      <div class="mode-card add-mode-card" @click="handleAddModeClick">
        <div class="mode-icon-badge add-mode-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
        <div class="mode-info">
          <div class="mode-title add-mode-title">添加模式</div>
        </div>
        <div class="mode-chevron">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modes-tab-content {
  padding: 0 16px 120px;
}

.modes-intro-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-secondary, #8E8E93);
  margin-bottom: 16px;
  padding: 0 4px;
}

/* 提示卡片：四边微细边框，轻柔底色 */
.cue-card {
  background: var(--color-card-bg, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  padding: 16px 18px;
  margin-bottom: 16px;
}

.cue-body {
  font-size: 14px;
  line-height: 1.45;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: 12px;
}

.cue-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cue-btn {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.cue-btn:active {
  opacity: 0.7;
}

.cue-btn-ghost {
  color: var(--color-text-secondary, #8E8E93);
}

.cue-btn-primary {
  color: #3B82F6;
  font-weight: 600;
}

/* 模式列表 */
.modes-card-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 模式卡片：遵循全局规范，四边微细边框，无竖线 */
.mode-card {
  display: flex;
  align-items: center;
  background: var(--color-card-bg, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 18px;
  padding: 14px 16px;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  user-select: none;
}

.mode-card:active {
  transform: scale(0.985);
  background: var(--color-card-active, rgba(255, 255, 255, 0.08));
}

.mode-card.is-active {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(59, 130, 246, 0.08);
}

.mode-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.mode-icon-svg {
  display: block;
}

.mode-info {
  flex: 1;
  min-width: 0;
}

.mode-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.mode-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
  letter-spacing: -0.2px;
}

.active-badge {
  background: #2563EB;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 9999px;
  line-height: 1.4;
}

.mode-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary, #8E8E93);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mode-chevron {
  color: var(--color-text-tertiary, #636366);
  flex: none;
  display: flex;
  align-items: center;
  margin-left: 8px;
}

/* 添加模式卡片 */
.add-mode-card {
  border-style: dashed;
  border-color: var(--border-subtle, rgba(255, 255, 255, 0.12));
}

.add-mode-icon {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-secondary, #8E8E93);
}

.add-mode-title {
  color: var(--color-text-secondary, #8E8E93);
  font-weight: 500;
}
</style>
