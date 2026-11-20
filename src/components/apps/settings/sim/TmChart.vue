<script setup>
import { computed } from 'vue'
import { tmTicks } from './trafficData.js'

/**
 * 流量柱状图（今天 / 过去 7 天 / 周报 共用）
 *
 * 真机（1208×2644 截图）：**横向虚线网格**（每条刻度一条，浅灰虚线，不是实线），
 * 纵轴刻度右对齐在绘图区右侧空档里；柱子上深下浅的蓝渐变，柱底压在 0 B 线上。
 * ⚠️ 视频（444×960 / 316 kbps）把这层的虚线全部压掉了，别照视频做「无网格」。
 */
const props = defineProps({
  bars: { type: Array, default: () => [] },
  xLabels: { type: Array, default: () => [] },
  height: { type: Number, default: 173 },
  testid: { type: String, default: 'tm-chart' }
})

const ticks = computed(() => {
  const max = Math.max(0, ...props.bars)
  const raw = tmTicks(max)
  const top = raw[0]?.value || 1
  return raw.map(t => ({
    ...t,
    pct: Math.max(0, Math.min(100, (t.value / top) * 100))
  }))
})

const barHeights = computed(() => {
  const max = Math.max(0, ...props.bars)
  const top = Math.max(ticks.value[0]?.value || 1, max)
  return props.bars.map(v => (v <= 0 ? 0 : Math.max(2, (v / top) * 100)))
})
</script>

<template>
  <div class="tm-plot-wrap" :style="{ height: height + 'px' }" :data-testid="testid">
    <span
      v-for="(t, i) in ticks"
      :key="`g${i}`"
      class="tm-gridline"
      :style="{ bottom: t.pct + '%' }"
      aria-hidden="true"
    ></span>

    <div class="tm-plot">
      <div v-for="(v, i) in bars" :key="i" class="tm-plot-col">
        <div v-if="v > 0" class="tm-bar" :style="{ height: barHeights[i] + '%' }"></div>
      </div>
    </div>

    <span
      v-for="(t, i) in ticks"
      :key="`t${i}`"
      class="tm-tick"
      :style="{ bottom: t.pct + '%' }"
    >{{ t.label }}</span>

    <div class="tm-xaxis">
      <span v-for="(label, i) in xLabels" :key="`x${i}`" class="tm-xlabel">{{ label }}</span>
    </div>
  </div>
</template>
