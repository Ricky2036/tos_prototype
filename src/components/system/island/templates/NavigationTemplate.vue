<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import badgePetal from '../../../../assets/island/navigation/badge_petal.png'
import iconCursorArrow from '../../../../assets/island/navigation/icon_cursor_arrow.svg'

const store = useOs16IslandStore()

const titleText = computed(() => store.navigationState?.title || 'Drive 10 min 6km')
const subtitleText = computed(() => store.navigationState?.subtitle || 'Arrive 10:08 AM')
const progressPercent = computed(() => Math.max(0, Math.min(100, store.navigationState?.progress ?? 35)))

function onCardClick() {
  store.advanceNavigation()
}

function onExitNavigate() {
  store.closeTemplate()
}
</script>

<template>
  <div class="os16-nav-card" @click.stop="onCardClick" role="region" aria-label="地图导航实时卡片">
    <!-- 顶部信息行：转向大图标 + 导航剩余时间与距离 + 右侧花瓣地图角标 -->
    <div class="card-header-row">
      <!-- 转向指示图标 (对应 Figma 298:18670 原厂直行指示矢量，纯白不裁切) -->
      <div class="arrow-wrap">
        <svg class="arrow-svg" viewBox="33 6 66 121" fill="none">
          <path d="M66 6L99 51H82V127H50V51H33L66 6Z" fill="#FFFFFF"/>
        </svg>
      </div>

      <!-- 动态排版 (主信息 + 预计到达) -->
      <div class="text-column">
        <div class="title-text">{{ titleText }}</div>
        <div class="subtitle-text">{{ subtitleText }}</div>
      </div>

      <!-- 花瓣地图品牌角标 (20x20) -->
      <div class="badge-wrap">
        <img :src="badgePetal" alt="地图" class="badge-img" />
      </div>
    </div>

    <!-- 中部全路段多色路况进度条 (严格对应 Figma 298:18670 原厂独立胶囊路段) -->
    <div class="card-traffic-row">
      <div class="traffic-rail">
        <div class="seg seg-blue" style="flex: 127"></div>
        <div class="seg seg-darkred" style="flex: 22"></div>
        <div class="seg seg-red" style="flex: 18"></div>
        <div class="seg seg-green" style="flex: 80"></div>
        <div class="seg seg-orange" style="flex: 37"></div>

        <!-- 实时导航车辆定位光标 -->
        <div
          class="nav-cursor-node"
          :style="{ left: progressPercent + '%' }"
          title="当前车辆位置"
        >
          <img :src="iconCursorArrow" alt="导航游标" class="cursor-svg" />
        </div>
      </div>
    </div>

    <!-- 底部退出导航独立胶囊操作按钮 (304x32) -->
    <div class="card-action-row">
      <button class="nav-exit-btn" @click.stop="onExitNavigate" title="退出导航">
        Exit Navigate
      </button>
    </div>
  </div>
</template>

<style scoped>
.os16-nav-card {
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

.arrow-wrap {
  width: 44px;
  height: 44px;
  overflow: visible;
  flex-shrink: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-svg {
  width: 24px;
  height: 42px;
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
  background: #ffffff;
  overflow: hidden;
  flex-shrink: 0;
  margin-left: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-img {
  width: 14px;
  height: 14px;
  object-fit: contain;
  display: block;
}

/* 路况多色进度条 (各路段独立胶囊条，间距 4px，高度统一 6px，圆角 3px，严格对齐 Figma 原厂规范) */
.card-traffic-row {
  display: flex;
  align-items: center;
  height: 20px;
  position: relative;
  margin: 6px 0;
}

.traffic-rail {
  position: relative;
  width: 100%;
  height: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: visible;
}

.seg {
  height: 6px;
  border-radius: 3px;
  flex-shrink: 0;
  transition: flex 0.3s ease;
}

.seg-blue {
  background-color: #0060ea;
}

.seg-darkred {
  background-color: #b91702;
}

.seg-red {
  background-color: #fc4c3f;
}

.seg-green {
  background-color: #01ad4b;
}

.seg-orange {
  background-color: #fc843f;
}

.nav-cursor-node {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
  transform: translate(-50%, -50%);
  transition: left 0.35s cubic-bezier(0.25, 1, 0.5, 1);
  pointer-events: none;
  z-index: 3;
}

.cursor-svg {
  width: 22px;
  height: 22px;
  overflow: visible;
  display: block;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* 底部操作按钮 */
.card-action-row {
  width: 100%;
  height: 32px;
}

.nav-exit-btn {
  width: 100%;
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

.nav-exit-btn:hover {
  background: rgba(255, 255, 255, 0.32);
}

.nav-exit-btn:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.38);
}
</style>
