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

    <!-- 右侧操作按键：取消 + 暂停/继续拾音 (严格 42x42 纯圆) -->
    <div class="card-actions">
      <button class="act-btn btn-cancel" @click.stop="onCancel" title="关闭麦克风">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <button
        class="act-btn btn-primary"
        :class="{ 'is-muted-btn': isMuted }"
        @click.stop="onToggleMute"
        title="暂停/开启拾音"
      >
        <div v-if="!isMuted" class="pause-bars">
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
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

.btn-primary.is-muted-btn {
  background: #ff9900;
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
</style>
