<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import DhShell from './DhShell.vue'
import DhDialog from './DhDialog.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import LIcon from '../../../ui/LIcon.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'
import { dhAppMetric, dhWeekBars, dhMetricLabel, formatDuration, DH_WEEK_LABELS } from './dhData.js'

/**
 * 应用详情（真机 dh_74_step_detail，以「个人安全」为例）。
 *
 * 真机结构（自上而下）：
 *   ① 顶部两个浅蓝胶囊：`屏幕使用时间 ▾` / `每天 ▾`（切指标、切周期）
 *   ② 应用图标 + 大号数值 + 「今天」
 *   ③ 七日柱状图（左侧空白、右侧刻度 0/1/2 分钟、底部 周一…周日）
 *   ④ `‹  11月10日周二  ›`（逐日回看，今天之后不可前进）
 *   ⑤ 蓝色小标「设置」：应用定时器（副文案「无定时器」）/ 管理通知
 * 点「应用定时器」弹居中对话框选时长（真机 dh_76：5 行时长网格）。
 */
const props = defineProps({
  app: { type: Object, required: true }
})
const emit = defineEmits(['back', 'toast', 'overflow', 'open-activity'])
const dh = useDigitalHealthStore()

/* ---------- 指标 / 周期胶囊 ---------- */
const METRIC_OPTIONS = [
  { key: 'time', label: '屏幕使用时间' },
  { key: 'unlocks', label: '解锁次数' },
  { key: 'notifications', label: '通知' }
]
const PERIOD_OPTIONS = [
  { key: 'day', label: '每天' },
  { key: 'week', label: '每周' }
]

const metric = ref('time')
const period = ref('day')
const openMenu = ref('')
const metricLabel = computed(() => METRIC_OPTIONS.find(o => o.key === metric.value)?.label || '')
const periodLabel = computed(() => PERIOD_OPTIONS.find(o => o.key === period.value)?.label || '')

function toggleMenu(which) {
  openMenu.value = openMenu.value === which ? '' : which
  if (openMenu.value) document.addEventListener('click', closeMenu, { once: true })
}
function closeMenu() {
  openMenu.value = ''
  document.removeEventListener('click', closeMenu)
}
function pickMetric(key) {
  metric.value = key
  closeMenu()
}
function pickPeriod(key) {
  period.value = key
  closeMenu()
}
onBeforeUnmount(() => document.removeEventListener('click', closeMenu))

/* ---------- 图表 ---------- */
const H = 108
const bars = computed(() => dhWeekBars(props.app.id, metric.value))
const dayValue = computed(() => dhAppMetric(props.app.id, metric.value))
const weekValue = computed(() => bars.value.reduce((n, b) => n + b.value, 0))
const headValue = computed(() => (period.value === 'week' ? weekValue.value : dayValue.value))
const headLabel = computed(() => (period.value === 'week' ? '本周' : '今天'))
const headText = computed(() => (metric.value === 'time'
  ? formatDuration(headValue.value)
  : dhMetricLabel(headValue.value, metric.value)))

/** 右侧刻度：按峰值取三档（真机是 0/1/2 分钟这种整刻度） */
const axis = computed(() => {
  const max = Math.max(1, ...bars.value.map(b => b.value))
  const step = Math.max(1, Math.ceil(max / 3))
  return [step * 3, step * 2, step, 0]
})

/* ---------- 日期逐日回看 ---------- */
const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const dayOffset = ref(0)
const dayText = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - dayOffset.value)
  return `${d.getMonth() + 1}月${d.getDate()}日${WEEK_CN[d.getDay()]}`
})
function prevDay() { dayOffset.value += 1 }
function nextDay() {
  if (dayOffset.value > 0) dayOffset.value -= 1
}

/* ---------- 应用定时器对话框 ---------- */
const DURATIONS = [
  { minutes: 15, label: '15分钟' },
  { minutes: 25, label: '25分钟' },
  { minutes: 30, label: '0小时30分钟' },
  { minutes: 60, label: '1小时' },
  { minutes: 95, label: '1小时35分钟' },
  { minutes: 120, label: '2小时' },
  { minutes: 180, label: '3小时' },
  { minutes: 240, label: '4小时' },
  { minutes: 300, label: '5小时' }
]
const dialogOpen = ref(false)
const picked = ref(0)

function openDialog() {
  picked.value = dh.limitFor(props.app.id)
  dialogOpen.value = true
}
function confirmDuration() {
  dh.setLimit(props.app.id, picked.value)
  dialogOpen.value = false
  emit('toast', picked.value ? `已为“${props.app.name}”设置 ${formatDuration(picked.value)} 定时器` : '已取消定时器')
}
const limitText = computed(() => (dh.limitFor(props.app.id) ? formatDuration(dh.limitFor(props.app.id)) : '无定时器'))
</script>

<template>
  <DhShell :title="app.name" @back="emit('back')">
    <template #right>
      <DhOverflowMenu @pick="emit('overflow', $event)" />
    </template>

    <!-- ① 指标 / 周期胶囊 -->
    <div class="dh-pills">
      <div class="dh-pill-wrap">
        <button type="button" class="dh-chip" data-dh-metric @click.stop="toggleMenu('metric')">
          {{ metricLabel }}
          <LIcon name="chevronDown" :size="14" :stroke-width="2.2" />
        </button>
        <Transition name="dh-drop">
          <div v-if="openMenu === 'metric'" class="dh-drop" data-dh-metric-menu>
            <button
              v-for="o in METRIC_OPTIONS"
              :key="o.key"
              type="button"
              class="dh-drop-item"
              :class="{ on: metric === o.key }"
              @click.stop="pickMetric(o.key)"
            >{{ o.label }}</button>
          </div>
        </Transition>
      </div>

      <div class="dh-pill-wrap">
        <button type="button" class="dh-chip" data-dh-period @click.stop="toggleMenu('period')">
          {{ periodLabel }}
          <LIcon name="chevronDown" :size="14" :stroke-width="2.2" />
        </button>
        <Transition name="dh-drop">
          <div v-if="openMenu === 'period'" class="dh-drop" data-dh-period-menu>
            <button
              v-for="o in PERIOD_OPTIONS"
              :key="o.key"
              type="button"
              class="dh-drop-item"
              :class="{ on: period === o.key }"
              @click.stop="pickPeriod(o.key)"
            >{{ o.label }}</button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ② 图标 + 数值 -->
    <div class="dh-hero">
      <RegisteredAppIcon :app="app" :size="42" />
      <strong class="dh-hero-value" data-dh-app-value>{{ headText }}</strong>
      <span class="dh-hero-label">{{ headLabel }}</span>
    </div>

    <!-- ③ 七日柱状图 -->
    <div class="dh-chart" data-dh-app-chart>
      <div class="dh-chart-grid" aria-hidden="true">
        <span v-for="(v, i) in axis" :key="i" class="dh-grid-line">
          <em>{{ v }}{{ metric === 'time' ? '分钟' : '' }}</em>
        </span>
      </div>
      <div class="dh-bars">
        <span
          v-for="(b, i) in bars"
          :key="i"
          class="dh-bar-col"
          :data-dh-bar="i"
        >
          <span class="dh-bar" :style="{ height: Math.max(2, Math.round(b.ratio * H)) + 'px' }"></span>
        </span>
      </div>
      <div class="dh-bar-labels" aria-hidden="true">
        <span v-for="l in DH_WEEK_LABELS" :key="l">{{ l }}</span>
      </div>
    </div>

    <!-- ④ 日期回看 -->
    <div class="dh-dayrow">
      <button type="button" class="dh-dayarrow" data-dh-prev-day @click="prevDay">
        <LIcon name="chevronLeft" :size="15" :stroke-width="2" />
      </button>
      <span class="dh-daytext" data-dh-day-text>{{ dayText }}</span>
      <button type="button" class="dh-dayarrow" :disabled="dayOffset === 0" data-dh-next-day @click="nextDay">
        <LIcon name="chevronRight" :size="15" :stroke-width="2" />
      </button>
    </div>

    <!-- ⑤ 设置 -->
    <div class="dh-label">设置</div>
    <div class="dh-card">
      <button type="button" class="dh-row" data-dh-open-timer @click="openDialog">
        <LIcon name="hourglass" :size="20" />
        <span class="dh-row-main">
          <span class="dh-row-title">应用定时器</span>
          <span class="dh-row-sub" data-dh-limit-text>{{ limitText }}</span>
        </span>
      </button>
      <div class="dh-divider"></div>
      <button type="button" class="dh-row" data-dh-open-notif @click="emit('toast', '应用通知设置需在系统设置中调整')">
        <LIcon name="bell" :size="20" />
        <span class="dh-row-main">
          <span class="dh-row-title">管理通知</span>
        </span>
      </button>
    </div>

    <DhDialog
      :visible="dialogOpen"
      title="设置应用定时器"
      :note="`“${app.name}”的这个应用定时器会在午夜重置`"
      @close="dialogOpen = false"
      @confirm="confirmDuration"
    >
      <div class="dh-dur-grid" data-dh-dur-grid>
        <button
          v-for="d in DURATIONS"
          :key="d.minutes"
          type="button"
          class="dh-dur"
          :class="{ on: picked === d.minutes }"
          :data-dh-dur="d.minutes"
          @click="picked = d.minutes"
        >{{ d.label }}</button>
      </div>
    </DhDialog>
  </DhShell>
</template>

<style scoped>
/* ---------- 胶囊 ---------- */
.dh-pills {
  display: flex;
  gap: 12px;
  padding: 6px 0 18px;
}

.dh-pill-wrap { position: relative; }

.dh-chip {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 16px;
  border: none;
  border-radius: 19px;
  background: #D7E5FB;
  color: #174EA6;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.dh-drop {
  position: absolute;
  top: 42px;
  left: 0;
  min-width: 150px;
  background: #FFFFFF;
  border-radius: 10px;
  padding: 6px 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  z-index: 30;
}

.dh-drop-item {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 11px 16px;
  font-size: 14px;
  color: #1F1F1F;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.dh-drop-item.on { color: #1A73E8; font-weight: 600; }

.dh-drop-enter-active,
.dh-drop-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.dh-drop-enter-from,
.dh-drop-leave-to { opacity: 0; transform: translateY(-4px); }

/* ---------- 数值 ---------- */
.dh-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-bottom: 14px;
}

.dh-hero-value { font-size: 26px; font-weight: 400; color: #1F1F1F; letter-spacing: -0.3px; }
.dh-hero-label { font-size: 13px; color: #5F6368; }

/* ---------- 柱状图 ---------- */
.dh-chart { position: relative; padding-bottom: 4px; }

.dh-chart-grid {
  position: absolute;
  left: 0;
  right: 42px;
  top: 0;
  height: 108px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.dh-grid-line {
  position: relative;
  display: block;
  height: 0;
  border-top: 0.5px solid rgba(60, 64, 67, 0.2);
}

.dh-grid-line em {
  position: absolute;
  right: -44px;
  top: -8px;
  font-style: normal;
  font-size: 11.5px;
  color: #5F6368;
  white-space: nowrap;
}

.dh-bars {
  display: flex;
  align-items: flex-end;
  height: 108px;
  gap: 6px;
  padding-right: 42px;
}

.dh-bar-col {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 100%;
}

.dh-bar {
  width: 60%;
  max-width: 28px;
  border-radius: 3px 3px 0 0;
  background: #1A73E8;
}

.dh-bar-labels {
  display: flex;
  gap: 6px;
  padding: 6px 42px 0 0;
}

.dh-bar-labels span {
  flex: 1;
  text-align: center;
  font-size: 11.5px;
  color: #5F6368;
}

/* ---------- 日期回看 ---------- */
.dh-dayrow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 18px 0 6px;
}

.dh-dayarrow {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.dh-dayarrow:disabled { opacity: 0.28; cursor: default; }
.dh-dayarrow:active:not(:disabled) { background: rgba(60, 64, 67, 0.08); }

.dh-daytext { font-size: 15px; color: #1F1F1F; min-width: 118px; text-align: center; }

/* ---------- 时长网格 ---------- */
.dh-dur-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 10px 0 4px;
}

.dh-dur {
  height: 40px;
  border: 1px solid #DADCE0;
  border-radius: 10px;
  background: #FFFFFF;
  color: #1F1F1F;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.dh-dur.on {
  border-color: #1A73E8;
  background: #E8F0FE;
  color: #174EA6;
  font-weight: 600;
}
</style>
