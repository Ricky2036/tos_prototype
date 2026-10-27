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

    <!-- 右侧操作按键：取消 + 暂停/继续拾音 -->
    <div class="card-actions">
      <button class="act-btn btn-cancel" @click.stop="onCancel" title="关闭麦克风">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
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
        <svg v-if="!isMuted" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
  padding: 12px 18px;
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
  gap: 12px;
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

.btn-primary.is-muted-btn {
  background: #ff9900;
  box-shadow: 0 2px 8px rgba(255, 153, 0, 0.35);
}
</style>
