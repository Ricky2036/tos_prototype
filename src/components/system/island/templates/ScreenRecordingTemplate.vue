<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import iconScreenRec from '../../../../assets/island/base/icon_screen_rec.svg'

const store = useOs16IslandStore()

const isPaused = computed(() => store.baseTemplateState?.isRecordingPaused ?? false)
const timeText = computed(() => store.baseTemplateState?.screenRecordingTime || '04:20')

function onTogglePause() {
  store.toggleRecordingPause()
}

function onStop() {
  store.closeTemplate()
}
</script>

<template>
  <div class="os16-base-card" role="region" aria-label="屏幕录制实时卡片">
    <!-- 左侧红底录屏图标 (直接居左渲染纯矢量摄像机) -->
    <div class="card-icon-wrap">
      <img :src="iconScreenRec" alt="录屏" class="icon-svg" />
    </div>

    <!-- 中部动态计时排版 -->
    <div class="card-text-col">
      <div class="main-title">{{ timeText }}</div>
      <div class="sub-text">
        <span v-if="isPaused">Recording Paused</span>
        <span v-else>Screen Recording...</span>
      </div>
    </div>

    <!-- 右侧操作按键：暂停/继续 + 结束并保存 (严格 42x42 纯圆，尺寸完全一致) -->
    <div class="card-actions">
      <button
        class="act-btn btn-pause"
        :class="{ 'is-paused-btn': isPaused }"
        @click.stop="onTogglePause"
        title="暂停/继续"
      >
        <div v-if="!isPaused" class="pause-bars">
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>

      <button class="act-btn btn-stop" @click.stop="onStop" title="结束录制">
        <div class="stop-square"></div>
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
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: transparent;
}

.icon-svg {
  width: 26px;
  height: 26px;
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
  gap: 14px;
  flex-shrink: 0;
  margin-left: 12px;
}

.act-btn {
  width: 42px;
  height: 42px;
  min-width: 42px;
  min-height: 42px;
  max-width: 42px;
  max-height: 42px;
  border-radius: 50%;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.15s ease;
}

.act-btn:active {
  transform: scale(0.92);
}

.btn-pause {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.btn-pause:hover {
  background: rgba(255, 255, 255, 0.32);
}

.btn-pause.is-paused-btn {
  background: rgba(255, 178, 0, 0.3);
  color: #ffb800;
}

.pause-bars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.pause-bars .bar {
  width: 3.89px;
  height: 15.56px;
  border-radius: 1.11px;
  background-color: #ffffff;
}

.btn-stop {
  background: #fc4c3f;
  box-shadow: none;
}

.btn-stop:hover {
  background: #ff5e52;
}

.stop-square {
  width: 14.17px;
  height: 14.17px;
  background: #ffffff;
  border-radius: 2.5px;
}
</style>
