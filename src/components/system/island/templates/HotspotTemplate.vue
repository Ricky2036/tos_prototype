<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import iconHotspot from '../../../../assets/island/base/icon_hotspot.svg'

const store = useOs16IslandStore()

function onClose() {
  store.closeTemplate()
}
</script>

<template>
  <div class="os16-base-card" role="region" aria-label="个人热点实时卡片">
    <!-- 左侧热点图文信息 -->
    <div class="hotspot-left">
      <div class="icon-wrap">
        <img :src="iconHotspot" alt="热点" class="icon-svg" />
      </div>
      <div class="text-col">
        <div class="main-title">Off in 3 min</div>
        <div class="sub-text">Hotspot</div>
      </div>
    </div>

    <!-- 右侧关闭胶囊按键 -->
    <div class="card-actions">
      <button class="capsule-btn" @click.stop="onClose" title="关闭热点">
        Close
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

.hotspot-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-wrap {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-svg {
  width: 28px;
  height: 24px;
  display: block;
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
  width: 57px;
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
  transition: background 0.15s ease, transform 0.1s ease;
}

.capsule-btn:hover {
  background: rgba(255, 255, 255, 0.32);
}

.capsule-btn:active {
  transform: scale(0.94);
}
</style>
