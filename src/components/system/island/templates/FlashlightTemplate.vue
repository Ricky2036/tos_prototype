<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import iconFlashlight from '../../../../assets/island/base/icon_flashlight.svg'

const store = useOs16IslandStore()

const isOn = computed(() => store.baseTemplateState?.isFlashlightOn ?? false)

function onToggle() {
  store.toggleFlashlight()
}
</script>

<template>
  <div class="os16-base-card" @click.stop="onToggle" role="region" aria-label="手电筒实时卡片">
    <!-- 左侧手电筒图标与状态指示 -->
    <div class="fl-left">
      <div class="icon-wrap" :class="{ 'is-lit': isOn }">
        <svg v-if="isOn" class="fl-lit-svg" viewBox="0 0 24 24">
          <path d="M18 6 15 2H9L6 6v3h12V6Z" />
          <path d="M6 9v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9" />
          <circle cx="12" cy="14" r="1.5" />
        </svg>
        <img v-else :src="iconFlashlight" alt="手电筒" class="icon-svg" />
      </div>

      <div class="text-col">
        <div class="main-title">{{ isOn ? 'Open' : 'Closed' }}</div>
        <div class="sub-text">Flashlight</div>
      </div>
    </div>

    <!-- 右侧操作胶囊按键 -->
    <div class="card-actions">
      <button
        class="capsule-btn"
        :class="{ 'is-on-btn': isOn }"
        @click.stop="onToggle"
        title="开启/关闭手电筒"
      >
        {{ isOn ? 'Close' : 'Open' }}
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
  cursor: pointer;
  overflow: hidden;
}

.fl-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrap {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.icon-svg {
  width: 20px;
  height: 26px;
  display: block;
}

.fl-lit-svg {
  width: 24px;
  height: 24px;
  fill: #ffd600;
  stroke: #ffd600;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 10px rgba(255, 214, 0, 0.9));
}

.text-col {
  display: flex;
  flex-direction: column;
}

.main-title {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #ffffff;
  letter-spacing: -0.2px;
}

.sub-text {
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
}

.capsule-btn {
  width: 56px;
  height: 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.25);
  border: none;
  outline: none;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.1s ease, color 0.15s ease;
}

.capsule-btn:hover {
  background: rgba(255, 255, 255, 0.32);
}

.capsule-btn:active {
  transform: scale(0.94);
}

.capsule-btn.is-on-btn {
  background: #ffffff;
  color: #000000;
}
</style>
