<script setup>
import { ref } from 'vue'
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import { getIconPath } from './modeIcons.js'

const store = useModesAndRoutinesStore()

const emit = defineEmits(['open-mode', 'open-preset-wizard', 'add-mode', 'show-toast'])

const showCueCard = ref(true)

function handleCardClick(mode) {
  if (!mode.isConfigured && mode.id !== 'sleep' && !mode.isCustom) {
    emit('open-preset-wizard', mode)
  } else {
    emit('open-mode', mode.id)
  }
}

function handleIconToggle(mode) {
  if (!mode.isConfigured) {
    mode.isConfigured = true
    mode.subtitle = ''
  }
  store.toggleMode(mode.id)
  const isNowActive = store.activeModeId === mode.id
  emit('show-toast', isNowActive ? `“${mode.name}”模式已开启` : `“${mode.name}”模式已关闭`)
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
        若要根据您的活动自动启动模式和日常程序，您需要登录三星账号。
      </div>
      <div class="cue-actions">
        <button class="cue-btn cue-btn-ghost" @click="showCueCard = false">
          现在不要
        </button>
        <button class="cue-btn cue-btn-primary" @click="emit('show-toast', '已登录三星账号')">
          登录三星账号
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
        @click="handleCardClick(mode)"
      >
        <!-- 模式左侧圆形图标徽章：支持直接点击开启/关闭模式 -->
        <button
          class="mode-icon-badge"
          :style="{ backgroundColor: mode.color }"
          :aria-label="store.activeModeId === mode.id ? `关闭${mode.name}模式` : `开启${mode.name}模式`"
          @click.stop="handleIconToggle(mode)"
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
        </button>

        <!-- 模式文本与状态 -->
        <div class="mode-info">
          <div class="mode-title-row">
            <span class="mode-title">{{ mode.name }}</span>
            <span v-if="store.activeModeId === mode.id" class="active-badge">开</span>
          </div>
          <div v-if="store.activeModeId === mode.id" class="mode-subtitle active-sub">
            直到您将其关闭
          </div>
          <div v-else-if="!mode.isConfigured" class="mode-subtitle">
            未设置
          </div>
          <div v-else-if="mode.subtitle" class="mode-subtitle">
            {{ mode.subtitle }}
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
  padding: 0 16px calc(var(--home-indicator-inset, 14px) + 96px);
}

.modes-intro-text {
  font-size: 14px;
  line-height: 1.5;
  color: #71717A;
  margin-bottom: 16px;
  padding: 0 4px;
}

/* 提示卡片：四边微细边框，轻柔底色 */
.cue-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 18px;
  padding: 16px 18px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.cue-body {
  font-size: 14px;
  line-height: 1.45;
  color: #18181B;
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
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.cue-btn:active {
  opacity: 0.7;
}

.cue-btn-ghost {
  color: #71717A;
}

.cue-btn-primary {
  color: #1B64DA;
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
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  padding: 14px 18px;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.mode-card:active {
  transform: scale(0.985);
  background: #FAFAFA;
}

.mode-card.is-active {
  border-color: rgba(27, 100, 218, 0.35);
  box-shadow: 0 4px 16px rgba(27, 100, 218, 0.06);
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
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.mode-icon-badge:active {
  transform: scale(0.92);
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
  color: #18181B;
  letter-spacing: -0.2px;
}

.active-badge {
  background: #1B64DA;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 9999px;
  line-height: 1.4;
}

.mode-subtitle {
  font-size: 13px;
  color: #71717A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mode-subtitle.active-sub {
  color: #1B64DA;
  font-weight: 500;
}

.mode-chevron {
  color: #A1A1AA;
  display: flex;
  align-items: center;
  margin-left: 8px;
}

/* 添加模式卡片专属图标 */
.add-mode-card .add-mode-icon {
  background: #F4F5F7;
  color: #71717A;
}

.add-mode-title {
  color: #18181B;
  font-weight: 600;
}
</style>
