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
  gap: 14px;
}

.battery-shell {
  display: flex;
  align-items: center;
}

.battery-body {
  width: 32px;
  height: 17px;
  background: #3a3a3c;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.battery-level {
  height: 100%;
  background: #30d158;
  border-radius: 3px 0 0 3px;
  transition: width 0.3s ease;
}

.battery-cap {
  width: 2.5px;
  height: 6px;
  background: #3a3a3c;
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
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: #30d158;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.2px;
}

.watt-sub {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 12.5px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
  letter-spacing: -0.1px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-btn {
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
  transition: transform 0.15s ease, opacity 0.15s ease;
  background: rgba(255, 255, 255, 0.25);
}

.mode-btn:active {
  transform: scale(0.92);
}

.btn-normal {
  color: #00d2d3;
}

.btn-turbo {
  color: #30d158;
}

.btn-super {
  background: linear-gradient(135deg, #7b61ff 0%, #d856ff 100%);
  color: #ffffff;
}
</style>
