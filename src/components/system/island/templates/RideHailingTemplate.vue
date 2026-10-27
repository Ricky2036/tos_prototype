<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import carPhoto from '../../../../assets/island/ride_hailing/car_photo.png'
import badgeDidi from '../../../../assets/island/ride_hailing/badge_didi.png'
import carCursor from '../../../../assets/island/ride_hailing/car_cursor.png'

const store = useOs16IslandStore()

const titleText = computed(() => store.rideHailingState?.title || 'On the way · 35 min')
const subtitleText = computed(() => store.rideHailingState?.subtitle || '20 km to destination')
const progressPercent = computed(() => Math.max(0, Math.min(100, store.rideHailingState?.progress ?? 30)))

function onCardClick() {
  store.advanceRideHailing()
}
</script>

<template>
  <div class="os16-ride-card" @click.stop="onCardClick" role="region" aria-label="网约车接驾实时卡片">
    <!-- 顶部信息行：车辆照片 + 标题文案 + 右侧滴滴角标 -->
    <div class="card-header-row">
      <!-- 车辆照片图层 (88x44 圆角 10px) -->
      <div class="car-photo-wrap">
        <img :src="carPhoto" alt="车辆照片" class="car-img" />
      </div>

      <!-- 动态排版图层 (标题 + 副标题/车牌) -->
      <div class="text-column">
        <div class="title-text">{{ titleText }}</div>
        <div class="subtitle-text">{{ subtitleText }}</div>
      </div>

      <!-- 滴滴品牌角标 (20x20) -->
      <div class="badge-wrap">
        <img :src="badgeDidi" alt="滴滴" class="badge-img" />
      </div>
    </div>

    <!-- 底部动态进度条：薄荷绿渐进轨道与移动车辆游标 -->
    <div class="card-progress-row">
      <div class="track-rail">
        <div class="track-bg"></div>
        <div class="track-active" :style="{ width: progressPercent + '%' }"></div>
        <!-- 移动车辆游标 -->
        <div
          class="car-node"
          :style="{ left: progressPercent + '%' }"
          title="车辆位置"
        >
          <img :src="carCursor" alt="接驾车辆" class="cursor-img" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.os16-ride-card {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  background: transparent;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  user-select: none;
  cursor: pointer;
  overflow: hidden;
}

.card-header-row {
  display: flex;
  align-items: center;
  height: 44px;
  position: relative;
}

.car-photo-wrap {
  width: 88px;
  height: 44px;
  border-radius: 10px;
  overflow: visible;
  flex-shrink: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.car-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.text-column {
  margin-left: 14px;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title-text {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.25;
  color: #ffffff;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subtitle-text {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
  letter-spacing: -0.1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-wrap {
  width: 20px;
  height: 20px;
  border-radius: 5.88px;
  overflow: hidden;
  flex-shrink: 0;
  margin-left: 12px;
}

.badge-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.card-progress-row {
  display: flex;
  align-items: center;
  height: 28px;
  position: relative;
  margin-top: 8px;
}

.track-rail {
  position: relative;
  width: 100%;
  height: 6px;
  display: flex;
  align-items: center;
}

.track-bg {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 3px;
  transform: translateY(-50%);
  background-color: rgba(7, 180, 151, 0.3);
  border-radius: 1.5px;
}

.track-active {
  position: absolute;
  top: 0;
  left: 0;
  height: 6px;
  background-color: #07b497;
  border-radius: 3px;
  transition: width 0.35s cubic-bezier(0.25, 1, 0.5, 1);
}

.car-node {
  position: absolute;
  top: 50%;
  width: 28px;
  height: 18px;
  transform: translate(-50%, -50%) rotate(90deg);
  transition: left 0.35s cubic-bezier(0.25, 1, 0.5, 1);
  pointer-events: none;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cursor-img {
  width: 18px;
  height: 28px;
  object-fit: contain;
  display: block;
}
</style>
