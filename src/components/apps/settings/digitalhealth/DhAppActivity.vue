<script setup>
import { computed } from 'vue'
import DhShell from './DhShell.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import { dhUsageRows, dhWeekBars, dhDonutSegments, formatDuration, DH_TOTAL_MINUTES, DH_WEEK_LABELS } from './dhData.js'

/**
 * 应用活动（真机主页「查看应用活动详情」进入的看板）。
 *
 * 结构：今天总时长 + 七日柱状图 + 按使用时长降序的应用列表（右侧时长 + 细进度条）。
 * ⚠️ 数据全部来自 `dhData.js` 的确定性假数据，与应用定时器/主页环形图同源，
 *    总和必须等于 `DH_TOTAL_MINUTES`（单测会校验，避免三处互相打脸）。
 */
const emit = defineEmits(['back', 'toast'])
const rows = dhUsageRows(99)
const bars = dhWeekBars('total', 'time')
const segs = dhDonutSegments()

const H = 96
const totalText = computed(() => formatDuration(DH_TOTAL_MINUTES))
const maxMinutes = computed(() => Math.max(1, ...rows.map(r => r.minutes)))
const axis = computed(() => {
  const max = Math.max(1, ...bars.map(b => b.value))
  const step = Math.max(1, Math.ceil(max / 3))
  return [step * 3, step * 2, step, 0]
})
/** 环形图四段 → 「微信 4小时35分钟 · 63%」的明细，放在图表下作图例 */
const legend = computed(() => segs.map(s => ({ ...s, text: formatDuration(s.minutes) })))
</script>

<template>
  <DhShell title="应用活动" @back="emit('back')">
    <template #right>
      <DhOverflowMenu @pick="emit('toast', $event)" />
    </template>

    <div class="dh-hero">
      <strong class="dh-hero-value" data-dh-activity-total>{{ totalText }}</strong>
      <span class="dh-hero-label">今天 · 屏幕使用时间</span>
    </div>

    <!-- 七日柱状图 -->
    <div class="dh-chart" data-dh-activity-chart>
      <div class="dh-chart-grid" aria-hidden="true">
        <span v-for="(v, i) in axis" :key="i" class="dh-grid-line"><em>{{ v }}分钟</em></span>
      </div>
      <div class="dh-bars">
        <span v-for="(b, i) in bars" :key="i" class="dh-bar-col">
          <span class="dh-bar" :style="{ height: Math.max(2, Math.round(b.ratio * H)) + 'px' }"></span>
        </span>
      </div>
      <div class="dh-bar-labels" aria-hidden="true">
        <span v-for="l in DH_WEEK_LABELS" :key="l">{{ l }}</span>
      </div>
    </div>

    <!-- 分段明细 -->
    <div class="dh-legend" data-dh-activity-legend>
      <span v-for="s in legend" :key="s.key" class="dh-legend-item">
        <i class="dh-legend-dot" :class="`is-${s.key}`"></i>
        <span class="dh-legend-name">{{ s.label }}</span>
        <span class="dh-legend-val">{{ s.text }}</span>
      </span>
    </div>

    <div class="dh-label">您的应用</div>
    <div class="dh-card" data-dh-activity-list>
      <div v-for="app in rows" :key="app.id" class="dh-row" :data-dh-activity-app="app.id">
        <RegisteredAppIcon :app="app.app" :size="30" />
        <span class="dh-row-main">
          <span class="dh-row-title">{{ app.name }}</span>
          <span class="dh-track"><span class="dh-track-fill" :style="{ width: Math.round((app.minutes / maxMinutes) * 100) + '%' }"></span></span>
        </span>
        <span class="dh-usage">{{ formatDuration(app.minutes) }}</span>
      </div>
    </div>
  </DhShell>
</template>

<style scoped>
.dh-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 0 18px;
}
.dh-hero-value { font-size: 26px; font-weight: 400; color: #1F1F1F; letter-spacing: -0.3px; }
.dh-hero-label { font-size: 13px; color: #5F6368; }

.dh-chart { position: relative; padding-bottom: 4px; }

.dh-chart-grid {
  position: absolute;
  left: 0;
  right: 50px;
  top: 0;
  height: 96px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.dh-grid-line { position: relative; display: block; height: 0; border-top: 0.5px solid rgba(60, 64, 67, 0.2); }
.dh-grid-line em {
  position: absolute;
  right: -52px;
  top: -8px;
  font-style: normal;
  font-size: 11.5px;
  color: #5F6368;
  white-space: nowrap;
}

.dh-bars { display: flex; align-items: flex-end; height: 96px; gap: 6px; padding-right: 50px; }
.dh-bar-col { flex: 1; display: flex; align-items: flex-end; justify-content: center; height: 100%; }
.dh-bar { width: 60%; max-width: 26px; border-radius: 3px 3px 0 0; background: #1A73E8; }

.dh-bar-labels { display: flex; gap: 6px; padding: 6px 50px 0 0; }
.dh-bar-labels span { flex: 1; text-align: center; font-size: 11.5px; color: #5F6368; }

.dh-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 4px 4px;
}
.dh-legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #3C4043; }
.dh-legend-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; background: #4285F4; }
.dh-legend-dot.is-other { background: #DADCE0; }
.dh-legend-name { flex: 1; }
.dh-legend-val { color: #5F6368; }

.dh-track {
  display: block;
  height: 4px;
  border-radius: 2px;
  background: #E8EAED;
  margin-top: 6px;
  overflow: hidden;
}
.dh-track-fill { display: block; height: 100%; border-radius: 2px; background: #1A73E8; }

.dh-usage { font-size: 13px; color: #5F6368; flex: none; }
</style>
