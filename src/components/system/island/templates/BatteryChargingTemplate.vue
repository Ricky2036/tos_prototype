<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

const store = useOs16IslandStore()

const batteryPercent = computed(() => store.baseTemplateState?.batteryPercent ?? 87)
const batteryWatt = computed(() => store.baseTemplateState?.batteryWatt ?? 25)
const chargingMode = computed(() => store.baseTemplateState?.chargingMode ?? 'super')

function onSetMode(mode, watt) {
  store.baseTemplateState.chargingMode = mode
  store.baseTemplateState.batteryWatt = watt
}
</script>

<template>
  <div class="os16-base-card" role="region" aria-label="超级快充实时卡片">
    <!-- 左侧电池图标与充电百分比/功率 -->
    <div class="battery-info-left">
      <!-- 电池外壳与动态电量条 -->
      <div class="battery-shell">
        <div class="battery-body">
          <div class="battery-level" :style="{ width: batteryPercent + '%' }"></div>
        </div>
        <div class="battery-cap"></div>
      </div>

      <div class="text-col">
        <div class="percent-title">{{ batteryPercent }}%</div>
        <div class="watt-sub">{{ batteryWatt }}W</div>
      </div>
    </div>

    <!-- 右侧三种充电模式切换按键 (常规蓝 / 极速青 / 超级闪充紫) -->
    <div class="card-actions">
      <!-- 模式 1: 常规快充 (蓝) -->
      <button
        class="mode-btn btn-normal"
        :class="{ active: chargingMode === 'normal' }"
        @click.stop="onSetMode('normal', 18)"
        title="标准快充 18W"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2 4 14h7v8l9-12h-7z"/>
        </svg>
      </button>

      <!-- 模式 2: 极速闪充 (青) -->
      <button
        class="mode-btn btn-turbo"
        :class="{ active: chargingMode === 'turbo' }"
        @click.stop="onSetMode('turbo', 68)"
        title="极速闪充 68W"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2 4 14h7v8l9-12h-7z"/>
        </svg>
      </button>

      <!-- 模式 3: 超级闪充 (紫) -->
      <button
        class="mode-btn btn-super"
        :class="{ active: chargingMode === 'super' }"
        @click.stop="onSetMode('super', 120)"
        title="超级闪充 120W"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2 4 14h7v8l9-12h-7z"/>
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

.battery-info-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.battery-shell {
  display: flex;
  align-items: center;
}

.battery-body {
  width: 32px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  padding: 1.5px;
  box-sizing: border-box;
}

.battery-level {
  height: 100%;
  background: #8cfd80;
  border-radius: 1.5px;
  box-shadow: 0 0 8px rgba(140, 253, 128, 0.6);
  transition: width 0.3s ease;
}

.battery-cap {
  width: 2.5px;
  height: 6px;
  background: rgba(255, 255, 255, 0.4);
  border-top-right-radius: 1.5px;
  border-bottom-right-radius: 1.5px;
  margin-left: 1px;
}

.text-col {
  display: flex;
  flex-direction: column;
}

.percent-title {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #8cfd80;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.2px;
}

.watt-sub {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 12.5px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
  letter-spacing: -0.1px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.2s ease;
  opacity: 0.45;
}

.mode-btn:hover {
  opacity: 0.8;
}

.mode-btn:active {
  transform: scale(0.92);
}

.mode-btn.active {
  opacity: 1;
  transform: scale(1.08);
}

.btn-normal {
  background: #1e76fe;
  color: #ffffff;
}
.btn-normal.active {
  box-shadow: 0 0 12px rgba(30, 118, 254, 0.6);
}

.btn-turbo {
  background: #00d2d3;
  color: #ffffff;
}
.btn-turbo.active {
  box-shadow: 0 0 12px rgba(0, 210, 211, 0.6);
}

.btn-super {
  background: #b538ff;
  color: #ffffff;
}
.btn-super.active {
  box-shadow: 0 0 14px rgba(181, 56, 255, 0.7);
}
</style>
