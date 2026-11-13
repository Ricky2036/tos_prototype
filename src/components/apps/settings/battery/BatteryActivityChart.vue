<script setup>
import { computed } from 'vue'
import { ACT_24H, ACT_7D } from './batteryData'

/**
 * 首页「活动时长」柱图。
 * 真机形态：亮屏（深蓝）在下、息屏（浅蓝）在上堆叠；
 * 24h 轴 60/30/0 分钟，7d 轴 24/12/0 小时。
 */
const props = defineProps({
  range: { type: String, default: '24h' }
})

const isWeek = computed(() => props.range === '7d')
const groups = computed(() => (isWeek.value ? ACT_7D : ACT_24H))
const yAxis = computed(() => (isWeek.value ? ['24 小时', '12 小时', '0 小时'] : ['60 分钟', '30 分钟', '0 分钟']))
const xLabels = computed(() =>
  isWeek.value ? ACT_7D.map((d) => d.label) : ['00', '04', '08', '12', '16', '20']
)
</script>

<template>
  <div class="activity-chart" :data-range="range">
    <div class="chart-area">
      <div class="cols" :class="{ 'is-week': isWeek }">
        <div
          v-for="(g, i) in groups"
          :key="i"
          class="col"
          :style="{ height: `${Math.min(100, g.on + g.off)}%` }"
        >
          <span class="seg off"></span>
          <span class="seg on" :style="{ height: `${(g.on / (g.on + g.off)) * 100}%` }"></span>
        </div>
      </div>
      <div class="y-axis">
        <span v-for="label in yAxis" :key="label">{{ label }}</span>
      </div>
    </div>

    <div class="x-axis">
      <span v-for="(label, i) in xLabels" :key="i">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart-area {
  display: flex;
  height: 108px;
  border-bottom: 1px dashed rgba(60, 60, 67, 0.18);
}

.cols {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 4px;
  padding-right: 8px;
}

.cols.is-week { gap: 10px; justify-content: space-around; padding: 0 4px; }

.col {
  width: 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  border-radius: 3px 3px 0 0;
  overflow: hidden;
  flex: none;
}

.cols.is-week .col { width: 26px; }

.seg { display: block; width: 100%; }

.seg.off { flex: 1; background: #A9CCF8; }
.seg.on { background: #2F7CF6; flex: none; }

/* 7 天视图真机配色反转：息屏=深海军蓝、亮屏=亮蓝 */
.activity-chart[data-range='7d'] .seg.off { background: #1F3F8F; }
.activity-chart[data-range='7d'] .seg.on { background: #2F8CFF; }

.y-axis {
  width: 54px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 11px;
  color: var(--text-tertiary, #8E8E93);
}

.x-axis {
  display: flex;
  justify-content: space-between;
  padding: 6px 54px 0 0;
  font-size: 11px;
  color: var(--text-tertiary, #8E8E93);
}
</style>
