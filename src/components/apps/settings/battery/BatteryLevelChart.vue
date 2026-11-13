<script setup>
import { computed } from 'vue'
import { LEVEL_24H, LEVEL_7D } from './batteryData'

/**
 * 首页「电池电量 / 用电量」柱图。
 * 24h：40 根细柱（蓝=放电、绿=充电），右侧 100%/50%/0% 轴，底部 00–20 刻度。
 * 7d：7 根宽柱（11/7–11/13），标题变「用电量」——真机 2026-11-13 实测。
 */
const props = defineProps({
  range: { type: String, default: '24h' }
})

const isWeek = computed(() => props.range === '7d')
const title = computed(() => (isWeek.value ? '用电量' : '电池电量'))
const bars = computed(() => (isWeek.value ? LEVEL_7D : LEVEL_24H))
const xLabels = computed(() =>
  isWeek.value ? LEVEL_7D.map((d) => d.label) : ['00', '04', '08', '12', '16', '20']
)
</script>

<template>
  <div class="level-block" :data-range="range">
    <div class="block-title">{{ title }}</div>

    <div class="level-chart">
      <div class="bars" :class="{ 'is-week': isWeek }">
        <span
          v-for="(bar, i) in bars"
          :key="i"
          class="bar"
          :class="{ charging: bar.charging }"
          :style="{ height: `${Math.max(2, bar.v)}%` }"
        ></span>
      </div>
      <div class="y-axis">
        <span>100%</span>
        <span>50%</span>
        <span>0%</span>
      </div>
    </div>

    <div class="x-axis">
      <span v-for="(label, i) in xLabels" :key="i">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped>
.level-block { padding-top: 2px; }

.block-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1C1C1E);
  margin-bottom: 12px;
}

.level-chart {
  display: flex;
  align-items: stretch;
  height: 108px;
  border-bottom: 1px dashed rgba(60, 60, 67, 0.18);
}

.bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2px;
  padding-right: 8px;
}

.bars.is-week { gap: 10px; justify-content: space-around; padding: 0 4px; }

.bar {
  width: 4px;
  border-radius: 2px 2px 0 0;
  background: #2F7CF6;
  flex: none;
}

.bar.charging { background: #34C759; }

.bars.is-week .bar { width: 26px; border-radius: 4px 4px 0 0; }

.y-axis {
  width: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 11px;
  color: var(--text-tertiary, #8E8E93);
  padding-bottom: 1px;
}

.x-axis {
  display: flex;
  justify-content: space-between;
  padding: 6px 40px 0 0;
  font-size: 11px;
  color: var(--text-tertiary, #8E8E93);
}

.level-block[data-range='7d'] .x-axis { padding-right: 40px; }
</style>
