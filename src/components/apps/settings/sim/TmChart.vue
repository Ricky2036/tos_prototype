<script setup>
import { computed } from 'vue'
import { tmFormat, tmTicks } from './trafficData.js'

/**
 * 流量柱状图（今天 / 过去 7 天 / 周报 共用）
 *
 * 真机形态：**没有网格线**，纵轴刻度贴在绘图区右侧（右对齐留 37 宽空档），
 * 柱宽 22、圆角 1、上深下浅的蓝渐变；今天无数据时只剩 5 条刻度（0.25 B 步长）。
 */
const props = defineProps({
  bars: { type: Array, default: () => [] }, // 字节数数组，长度 === xLabels.length
  xLabels: { type: Array, default: () => [] },
  height: { type: Number, default: 176 },
  testid: { type: String, default: 'tm-chart' }
})

const total = computed(() => props.bars.reduce((a, b) => a + b, 0))

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
  // 真机的纵轴顶格是「整齐刻度」，柱高按刻度顶算，超出顶格也照画（周报里 6.5 > 6.0 刻度）
  const top = Math.max(ticks.value[0]?.value || 1, max)
  return props.bars.map(v => (v <= 0 ? 0 : Math.max(2, (v / top) * 100)))
})
</script>

<template>
  <div class="tm-plot-wrap" :style="{ height: height + 'px' }" :data-testid="testid">
    <div class="tm-plot">
      <div v-for="(v, i) in bars" :key="i" class="tm-plot-col">
        <div v-if="v > 0" class="tm-bar" :style="{ height: barHeights[i] + '%' }"></div>
      </div>
    </div>

    <span
      v-for="(t, i) in ticks"
      :key="`t${i}`"
      class="tm-tick"
      :style="{ bottom: t.value === 0 ? '0px' : t.pct + '%' }"
    >{{ t.label }}</span>

    <div class="tm-xaxis">
      <span v-for="(label, i) in xLabels" :key="`x${i}`" class="tm-xlabel">{{ label }}</span>
    </div>
  </div>
</template>
