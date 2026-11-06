<script setup>
import { ref } from 'vue'

const emit = defineEmits(['back'])

const activeItem = ref('default')

const videoItems = [
  { id: 'default', title: '默认', downloaded: true, bg: 'linear-gradient(135deg, #1C2438 0%, #303F64 100%)' },
  { id: 'neon', title: '极光幻影', downloaded: true, bg: 'linear-gradient(135deg, #102A45 0%, #00C853 100%)' },
  { id: 'space', title: '星际穿梭', downloaded: false, bg: 'linear-gradient(135deg, #3B1C52 0%, #7C3AED 100%)' }
]
</script>

<template>
  <div class="phone-settings-subpage">
    <div class="subpage-header">
      <button class="back-btn" title="返回" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="header-title">我的视频秀</div>
    </div>

    <div class="subpage-body scrollable">
      <div class="section-caption">已下载</div>
      <div class="videos-grid">
        <div
          v-for="item in videoItems"
          :key="item.id"
          class="video-card"
          :class="{ selected: activeItem === item.id }"
          @click="activeItem = item.id"
        >
          <div class="video-preview-window" :style="{ background: item.bg }">
            <div class="play-icon-bubble">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div v-if="activeItem === item.id" class="current-badge">正在使用</div>
          </div>
          <div class="video-title">{{ item.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F3;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-header {
  display: flex;
  align-items: center;
  padding-top: calc(var(--safe-top, 54px) + 8px);
  padding-bottom: 12px;
  padding-left: 16px;
  padding-right: 16px;
  background: #F0F1F3;
}

.back-btn {
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.back-btn:active {
  background-color: #E8E9EB;
  transform: scale(0.96);
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1C1C1E;
  margin-left: 12px;
}

.subpage-body {
  flex: 1;
  padding: 12px 16px 40px;
}

.section-caption {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 12px 4px 14px;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.video-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.video-preview-window {
  width: 100%;
  aspect-ratio: 1 / 1.78;
  border-radius: 18px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.video-card.selected .video-preview-window {
  border-color: #00C853;
  box-shadow: 0 6px 20px rgba(0, 200, 83, 0.25);
}

.play-icon-bubble {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.current-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #00C853;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1E;
  margin-top: 10px;
}
</style>
