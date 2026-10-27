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
    <!-- 左侧橙色沙漏图标 (直接居左渲染纯矢量沙漏) -->
    <div class="card-icon-wrap">
      <img :src="iconTimer" alt="计时器" class="icon-svg" />
    </div>

    <!-- 中部动态倒计时排版 -->
    <div class="card-text-col">
      <div class="main-title">00:20</div>
      <div class="sub-text">Timer</div>
    </div>

    <!-- 右侧操作按键：取消 + 暂停/继续 (严格 42x42 纯圆，Figma 原厂矢量) -->
    <div class="card-actions">
      <button class="act-btn btn-cancel" @click.stop="onCancel" title="取消倒计时">
        <svg width="42" height="42" viewBox="414 453 42 42" fill="none">
          <path d="M428.519 467.518C428.942 467.095 429.628 467.095 430.051 467.518L435.001 472.468L439.95 467.52C440.373 467.097 441.059 467.097 441.482 467.52C441.905 467.943 441.905 468.629 441.482 469.052L436.533 474.001L441.482 478.95C441.905 479.373 441.905 480.058 441.482 480.481C441.059 480.904 440.373 480.904 439.95 480.481L435.001 475.533L430.051 480.484C429.628 480.907 428.942 480.907 428.519 480.484C428.096 480.061 428.096 479.375 428.519 478.952L433.469 474.001L428.519 469.05C428.095 468.627 428.096 467.941 428.519 467.518Z" fill="white"/>
        </svg>
      </button>

      <button
        class="act-btn btn-primary"
        @click.stop="onTogglePause"
        :title="isPaused ? '继续倒计时' : '暂停倒计时'"
      >
        <!-- 运行中：Figma 原厂双竖条暂停矢量 -->
        <svg v-if="!isPaused" width="42" height="42" viewBox="470 453 42 42" fill="none">
          <rect x="485.166" y="466.223" width="3.88889" height="15.5556" rx="1.11111" fill="white"/>
          <rect x="492.943" y="466.223" width="3.88889" height="15.5556" rx="1.11111" fill="white"/>
        </svg>
        <!-- 暂停后：复用音乐播放图标，保持统一纯白风格与按键底色 -->
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-left: 2px;">
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
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: transparent;
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

.btn-cancel {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.32);
}

.btn-primary {
  background: #1e76fe;
  color: #ffffff;
  box-shadow: none;
}

.btn-primary:hover {
  background: #2f83ff;
}
</style>
