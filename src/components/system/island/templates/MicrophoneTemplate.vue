<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

const store = useOs16IslandStore()

const isMuted = computed(() => store.baseTemplateState?.isMicMuted ?? false)

function onCancel() {
  store.closeTemplate()
}

function onToggleMute() {
  store.toggleMicMute()
}
</script>

<template>
  <div class="os16-base-card" role="region" aria-label="麦克风拾音实时卡片">
    <!-- 左侧状态信息 -->
    <div class="mic-info-left">
      <div class="mic-title">
        <span v-if="isMuted">Microphone Muted</span>
        <span v-else>Receiving sound</span>
      </div>
      <div class="mic-sub">Microphone</div>
    </div>

    <!-- 右侧操作按键：取消 + 暂停/继续拾音 (严格 42x42 纯圆，Figma 原厂矢量) -->
    <div class="card-actions">
      <button class="act-btn btn-cancel" @click.stop="onCancel" title="关闭麦克风">
        <svg width="42" height="42" viewBox="414 453 42 42" fill="none">
          <path d="M428.519 467.518C428.942 467.095 429.628 467.095 430.051 467.518L435.001 472.468L439.95 467.52C440.373 467.097 441.059 467.097 441.482 467.52C441.905 467.943 441.905 468.629 441.482 469.052L436.533 474.001L441.482 478.95C441.905 479.373 441.905 480.058 441.482 480.481C441.059 480.904 440.373 480.904 439.95 480.481L435.001 475.533L430.051 480.484C429.628 480.907 428.942 480.907 428.519 480.484C428.096 480.061 428.096 479.375 428.519 478.952L433.469 474.001L428.519 469.05C428.095 468.627 428.096 467.941 428.519 467.518Z" fill="white"/>
        </svg>
      </button>

      <button
        class="act-btn btn-primary"
        @click.stop="onToggleMute"
        :title="isMuted ? '开启拾音' : '暂停拾音'"
      >
        <!-- 拾音中：Figma 原厂双竖条暂停矢量 -->
        <svg v-if="!isMuted" width="42" height="42" viewBox="470 453 42 42" fill="none">
          <rect x="485.166" y="466.223" width="3.88889" height="15.5556" rx="1.11111" fill="white"/>
          <rect x="492.943" y="466.223" width="3.88889" height="15.5556" rx="1.11111" fill="white"/>
        </svg>
        <!-- 暂停拾音：复用音乐播放图标，保持统一纯白风格与按键底色 -->
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
  justify-content: space-between;
  user-select: none;
  overflow: hidden;
}

.mic-info-left {
  display: flex;
  flex-direction: column;
}

.mic-title {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #ffffff;
  letter-spacing: -0.2px;
}

.mic-sub {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 14px;
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
