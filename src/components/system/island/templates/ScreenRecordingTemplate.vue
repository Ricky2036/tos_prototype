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

    <!-- 右侧操作按键：暂停/继续 + 结束并保存 (严格 42x42 纯圆，Figma 原厂图层) -->
    <div class="card-actions">
      <button
        class="act-btn btn-pause"
        @click.stop="onTogglePause"
        :title="isPaused ? '继续录制' : '暂停录制'"
      >
        <!-- 录制中：Figma 原厂双竖条暂停矢量 -->
        <svg v-if="!isPaused" width="42" height="42" viewBox="414 253 42 42" fill="none">
          <rect x="429.166" y="266.223" width="3.88889" height="15.5556" rx="1.11111" fill="white"/>
          <rect x="436.943" y="266.223" width="3.88889" height="15.5556" rx="1.11111" fill="white"/>
        </svg>
        <!-- 暂停后：复用音乐播放图标，保持统一纯白风格 -->
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-left: 2px;">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>

      <!-- 结束并保存：Figma 原厂带圆角方块停止键 -->
      <button class="act-btn btn-stop" @click.stop="onStop" title="结束录制">
        <svg width="42" height="42" viewBox="470 253 42 42" fill="none">
          <rect x="483.918" y="266.917" width="14.1667" height="14.1667" rx="2.5" fill="white"/>
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
  font-size: 24px;
  font-weight: 700;
  line-height: 1.15;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.3px;
}

.sub-text {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif;
  font-size: 12.5px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
  transition: transform 0.15s ease, opacity 0.15s ease;
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

.btn-stop {
  background: #fc4c3f;
  color: #ffffff;
}

.btn-stop:hover {
  background: #ff5e52;
}
</style>
