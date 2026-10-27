<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

const store = useOs16IslandStore()

const batteryPercent = computed(() => store.baseTemplateState?.batteryPercent ?? 87)
const batteryWatt = computed(() => store.baseTemplateState?.batteryWatt ?? 25)
const chargingMode = computed(() => store.baseTemplateState?.chargingMode ?? 'hyper')

const isModeCold = computed(() => chargingMode.value === 'cold' || chargingMode.value === 'normal')
const isModeAi = computed(() => chargingMode.value === 'ai' || chargingMode.value === 'turbo')
const isModeHyper = computed(() => chargingMode.value === 'hyper' || chargingMode.value === 'super')

function onSetMode(mode, watt) {
  if (store.baseTemplateState) {
    store.baseTemplateState.chargingMode = mode
    store.baseTemplateState.batteryWatt = watt
  }
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

    <!-- 右侧三种充电模式切换按键 (低温慢充 / 智能AI充 / 超级闪充) -->
    <div class="card-actions">
      <!-- 模式 1: 低温慢充 (闪电 + 雪花) -->
      <button
        class="mode-btn btn-cold"
        :class="{ active: isModeCold }"
        @click.stop="onSetMode('cold', 18)"
        title="低温慢充 18W"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <!-- 闪电主体 -->
          <path d="M10 2L5 13H10L8 21L15 11H10.5L12.5 2Z" fill="currentColor"/>
          <!-- 雪花晶体 -->
          <path d="M19 3.5V8.5M16.5 6H21.5M17.2 4.2L20.8 7.8M20.8 4.2L17.2 7.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- 模式 2: 智能AI充 (闪电 + Ai) -->
      <button
        class="mode-btn btn-ai"
        :class="{ active: isModeAi }"
        @click.stop="onSetMode('ai', 25)"
        title="智能AI快充 25W"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <!-- 闪电主体 -->
          <path d="M9 2L4.5 13H9.5L7.5 21L14.5 11H10L12 2Z" fill="currentColor"/>
          <!-- Ai 字母标识 -->
          <text x="14" y="15" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" font-size="8.5" font-weight="700" fill="currentColor">Ai</text>
        </svg>
      </button>

      <!-- 模式 3: 超级闪充 (双平行闪电) -->
      <button
        class="mode-btn btn-hyper"
        :class="{ active: isModeHyper }"
        @click.stop="onSetMode('hyper', 120)"
        title="超级闪充 120W"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <!-- 左侧闪电 -->
          <path d="M9.5 2.5L4 12.5H8.5L7 20.5L13.5 10.5H9L11 2.5Z"/>
          <!-- 右侧闪电 -->
          <path d="M15.5 2.5L10 12.5H14.5L13 20.5L19.5 10.5H15L17 2.5Z"/>
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
  background: rgba(255, 255, 255, 0.16);
  transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.mode-btn:active {
  transform: scale(0.92);
}

/* 模式 1: 低温慢充 (默认浅青，激活时亮蓝渐变) */
.btn-cold {
  color: #26C6DA;
}
.btn-cold.active {
  background: linear-gradient(135deg, #00A6FF 0%, #0072FF 100%);
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 114, 255, 0.35);
}

/* 模式 2: 智能AI充 (默认浅青，激活时亮青蓝渐变) */
.btn-ai {
  color: #26C6DA;
}
.btn-ai.active {
  background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%);
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 198, 255, 0.35);
}

/* 模式 3: 超级闪充 (默认浅紫，激活时紫粉高光渐变) */
.btn-hyper {
  color: #DA70D6;
}
.btn-hyper.active {
  background: linear-gradient(135deg, #8A2BE2 0%, #DA70D6 100%);
  color: #ffffff;
  box-shadow: 0 2px 12px rgba(218, 112, 214, 0.45);
}
</style>
