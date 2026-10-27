<script setup>
import { ref, computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import iconTimer from '../../../../assets/island/base/icon_timer.svg'

const store = useOs16IslandStore()
const isPaused = ref(false)

function onCancel() {
  store.closeTemplate()
}

function onTogglePause() {
  isPaused.value = !isPaused.value
}
</script>

<template>
  <div class="os16-base-card" role="region" aria-label="倒计时实时卡片">
    <!-- 左侧橙色沙漏图标 -->
    <div class="card-icon-wrap is-timer-icon">
      <img :src="iconTimer" alt="计时器" class="icon-svg" />
    </div>

    <!-- 中部动态倒计时排版 -->
    <div class="card-text-col">
      <div class="main-title">00:20</div>
      <div class="sub-text">Timer</div>
    </div>

    <!-- 右侧操作按键：取消 + 暂停/继续 -->
    <div class="card-actions">
      <button class="act-btn btn-cancel" @click.stop="onCancel" title="取消倒计时">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <button
        class="act-btn btn-primary"
        :class="{ 'is-paused-btn': isPaused }"
        @click.stop="onTogglePause"
        title="暂停/继续"
      >
        <svg v-if="!isPaused" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 5h4v14H6zm8 0h4v14h-4z"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.os16-base-card {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  background: transparent;
  border-radius: 28px;
  display: flex;
  align-items: center;
  user-select: none;
  overflow: hidden;
}

.card-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.is-timer-icon {
  background: rgba(255, 153, 0, 0.18);
}

.icon-svg {
  width: 24px;
  height: 24px;
  display: block;
}

.card-text-col {
  margin-left: 14px;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.main-title {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.2px;
}

.sub-text {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 12.5px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: 12px;
}

.act-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.15s ease;
}

.act-btn:active {
  transform: scale(0.92);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.24);
}

.btn-primary {
  background: #1e76fe;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(30, 118, 254, 0.35);
}

.btn-primary:hover {
  background: #2f83ff;
}

.btn-primary.is-paused-btn {
  background: #ff9900;
  box-shadow: 0 2px 8px rgba(255, 153, 0, 0.35);
}
</style>
