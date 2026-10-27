<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

// 导入 Figma 独立图层导出的素材元素
import thumbPizza from '../../../../assets/island/food_delivery/thumb_pizza.png'
import badgeMeituan from '../../../../assets/island/food_delivery/badge_meituan.png'
import riderScooter from '../../../../assets/island/food_delivery/rider_scooter.png'
import iconStore from '../../../../assets/island/food_delivery/icon_store.svg'
import iconPin from '../../../../assets/island/food_delivery/icon_pin.svg'

const store = useOs16IslandStore()

const etaText = computed(() => store.foodDeliveryState?.title || 'Arrives 8:30-8:45 AM')
const statusText = computed(() => store.foodDeliveryState?.subtitle || 'Rider heading to restaurant')
const progressPercent = computed(() => Math.max(0, Math.min(100, store.foodDeliveryState?.progress ?? 28)))

/** 点击卡片推进履约进度（可循环演示交互） */
function onCardClick() {
  store.advanceFoodDelivery()
}
</script>

<template>
  <div class="os16-food-card" @click.stop="onCardClick" role="region" aria-label="外卖履约实时卡片">
    <!-- 顶部信息行：商家头像 + 标题文案 + 右侧平台角标 -->
    <div class="card-header-row">
      <!-- 商家/餐品头像图层 (44x44 圆角 10px，含微透明白色边框) -->
      <div class="thumb-container">
        <img :src="thumbPizza" alt="餐品缩略图" class="thumb-img" />
      </div>

      <!-- 动态排版图层 (标题 + 副标题状态) -->
      <div class="text-column">
        <div class="title-text">{{ etaText }}</div>
        <div class="subtitle-text">{{ statusText }}</div>
      </div>

      <!-- 平台品牌角标图层 (20x20 圆角 6px) -->
      <div class="badge-container">
        <img :src="badgeMeituan" alt="美团" class="badge-img" />
      </div>
    </div>

    <!-- 底部动态进度图层：起点图标 + 动态轨道与骑手 + 终点图标 -->
    <div class="card-progress-row">
      <!-- 起点商家图标 (20x20 琥珀黄圆圈) -->
      <div class="track-node is-start" title="商家已出餐">
        <img :src="iconStore" alt="商家" class="node-icon" />
      </div>

      <!-- 进度轨道区域 -->
      <div class="track-rail">
        <!-- 底轨 (25% 琥珀黄底色) -->
        <div class="track-bg"></div>
        <!-- 中途节点 (第 2 阶段) -->
        <div class="mid-dot"></div>
        <!-- 已行进高亮轨 (纯琥珀黄 #FFB200) -->
        <div class="track-active" :style="{ width: progressPercent + '%' }"></div>

        <!-- 动态行进骑手节点 (Figma 水平翻转前向行进) -->
        <div
          class="rider-node"
          :style="{ left: progressPercent + '%' }"
          title="骑手配送中"
        >
          <img :src="riderScooter" alt="配送骑手" class="rider-img" />
        </div>
      </div>

      <!-- 终点到达图标 (20x20 暗金圆圈地图图钉) -->
      <div class="track-node is-end" title="收货地址">
        <img :src="iconPin" alt="目的地" class="node-icon" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.os16-food-card {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  background: transparent;
  border-radius: 28px;
  border: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  user-select: none;
  cursor: pointer;
  overflow: hidden;
}

/* 顶部信息行 */
.card-header-row {
  display: flex;
  align-items: center;
  height: 44px;
  position: relative;
}

.thumb-container {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: #1a1a1a;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.badge-container {
  width: 20px;
  height: 20px;
  border-radius: 5.88px;
  overflow: hidden;
  flex-shrink: 0;
  margin-left: 12px;
  background-color: #ffd100;
}

.badge-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* 底部动态进度条行 */
.card-progress-row {
  display: flex;
  align-items: center;
  height: 24px;
  position: relative;
  margin-top: 8px;
}

.track-node {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.track-node.is-start {
  background: #ffb200;
}

.track-node.is-end {
  background: #805900;
}

.node-icon {
  width: 11px;
  height: 11px;
  display: block;
}

.track-rail {
  position: relative;
  flex: 1;
  height: 6px;
  margin: 0 4px;
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
  background-color: rgba(255, 178, 0, 0.25);
  border-radius: 1.5px;
}

.mid-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(255, 178, 0, 0.5);
  z-index: 1;
}

.track-active {
  position: absolute;
  top: 0;
  left: 0;
  height: 6px;
  background-color: #ffb200;
  border-radius: 3px;
  transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  z-index: 2;
}

.rider-node {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
  transform: translate(-50%, -50%) scaleX(-1);
  transition: left 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  pointer-events: none;
  z-index: 3;
}

.rider-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
}
</style>
