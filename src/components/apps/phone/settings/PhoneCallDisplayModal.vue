<script setup>
import { usePhoneStore } from '../../../../stores/phoneStore'
import bannerImg from '../../../../assets/img/phone_settings/call_display_banner.png'
import fullImg from '../../../../assets/img/phone_settings/call_display_full.png'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])
</script>

<template>
  <div class="phone-settings-subpage">
    <div class="subpage-header">
      <button class="back-btn" title="返回" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="header-title">来电显示</div>
    </div>

    <div class="subpage-body">
      <div class="display-modes-container">
        <!-- 模式 1：弹窗显示（100% 对齐真机 07_call_display.png 比例与布局） -->
        <div
          class="mode-column"
          @click="phoneStore.callDisplayMode = 'banner'"
        >
          <div class="mode-preview-card" :class="{ selected: phoneStore.callDisplayMode === 'banner' }">
            <img :src="bannerImg" class="preview-img" alt="弹窗显示插画" />
          </div>
          <div class="mode-label">弹窗显示</div>
          <div class="mode-radio" :class="{ checked: phoneStore.callDisplayMode === 'banner' }">
            <div v-if="phoneStore.callDisplayMode === 'banner'" class="radio-dot"></div>
          </div>
        </div>

        <!-- 模式 2：全屏显示 -->
        <div
          class="mode-column"
          @click="phoneStore.callDisplayMode = 'fullscreen'"
        >
          <div class="mode-preview-card" :class="{ selected: phoneStore.callDisplayMode === 'fullscreen' }">
            <img :src="fullImg" class="preview-img" alt="全屏显示插画" />
          </div>
          <div class="mode-label">全屏显示</div>
          <div class="mode-radio" :class="{ checked: phoneStore.callDisplayMode === 'fullscreen' }">
            <div v-if="phoneStore.callDisplayMode === 'fullscreen'" class="radio-dot"></div>
          </div>
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
  padding: 30px 24px;
}

.display-modes-container {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.mode-column {
  flex: 1;
  max-width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.mode-preview-card {
  width: 100%;
  aspect-ratio: 1 / 1.95;
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-preview-card.selected {
  border-color: #00C853;
  box-shadow: 0 6px 20px rgba(0, 200, 83, 0.18);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.mode-label {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  margin-top: 14px;
  margin-bottom: 10px;
}

.mode-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #C7C7CC;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.mode-radio.checked {
  border-color: #00C853;
}

.radio-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #00C853;
}
</style>
