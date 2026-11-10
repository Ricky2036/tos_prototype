<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  pad2, parseTimeValue, to12Hour, to24Hour, toTimeString, step12Hour
} from '../../utils/timePicker.js'

/**
 * 【全仓标准控件】三列时间滚轮本体。
 *
 * 真机（Infinix X6878 / XOS 17，/tmp/ref/gI/dnd_20_start_time 放大图）：
 *   左列小时 1-12、中列分钟 00-59、右列上午/下午；每列显示选中项与上下各两项，
 *   **没有选中高亮条**，靠字号（30/22/16px）与灰度区分。
 * 交互：点击相邻项 / 鼠标滚轮 / 真机触摸上下滑动均可步进。
 * 两种形态：inline（时钟闹钟编辑，tone=dark）与嵌在 TimePickerSheet 内（tone=light）。
 */
const props = defineProps({
  modelValue: { type: String, default: '07:00' },
  showPeriod: { type: Boolean, default: true },
  hourMode: { type: String, default: '12' }, // '12' = 1-12 + 上午/下午（真机）；'24' = 00-23（时钟闹钟编辑）
  tone: { type: String, default: 'light' } // 'light' | 'dark'
})
const emit = defineEmits(['update:modelValue'])

const state = reactive({ hour24: 7, minute: 0 })
watch(() => props.modelValue, (v) => {
  const { hour24, minute } = parseTimeValue(v)
  state.hour24 = hour24
  state.minute = minute
}, { immediate: true })

const period = computed(() => to12Hour(state.hour24).period)
const hour12 = computed(() => to12Hour(state.hour24).hour12)
const currentLabel = computed(() => formatTimeLabel(state.hour24, state.minute))
const OFFSETS = [-2, -1, 0, 1, 2]
const columns = computed(() => {
  if (props.hourMode === '24') return ['hour', 'minute']
  return props.showPeriod ? ['hour', 'minute', 'period'] : ['hour', 'minute']
})

function formatTimeLabel(h24, m) {
  const { hour12: h12, period: p } = to12Hour(h24)
  return `${h12}:${pad2(m)} ${p}`
}

function valueAt(col, offset) {
  if (col === 'hour') {
    return props.hourMode === '24'
      ? pad2((state.hour24 + offset + 24) % 24)
      : step12Hour(hour12.value, offset)
  }
  if (col === 'minute') return pad2((state.minute + offset + 60) % 60)
  if (offset === 0) return period.value
  if (offset === -1) return period.value === '上午' ? '下午' : '上午'
  return ''
}

function rowClass(offset) {
  return offset === 0 ? 'is-center' : (Math.abs(offset) === 1 ? 'is-near' : 'is-far')
}

function step(col, delta) {
  if (!delta) return
  if (col === 'hour') {
    state.hour24 = props.hourMode === '24'
      ? (state.hour24 + delta + 24) % 24
      : to24Hour(step12Hour(hour12.value, delta), period.value)
  }
  else if (col === 'minute') state.minute = (state.minute + delta + 60) % 60
  else if (col === 'period') state.hour24 = (state.hour24 + 12) % 24
  emit('update:modelValue', toTimeString(state.hour24, state.minute))
}

function onWheel(col, e) {
  step(col, e.deltaY > 0 ? 1 : -1)
}

/* 真机触摸：每累计 36px 步进一次；CDP Input.dispatchTouchEvent 会派发这组事件 */
let touchY = null
function onTouchStart(e) {
  touchY = e.touches?.[0]?.clientY ?? null
}
function onTouchMove(col, e) {
  if (touchY === null) return
  const y = e.touches?.[0]?.clientY
  if (typeof y !== 'number') return
  const dy = touchY - y
  if (Math.abs(dy) >= 36) {
    step(col, dy > 0 ? 1 : -1)
    touchY = y
  }
}
function onTouchEnd() { touchY = null }

defineExpose({ currentLabel, state })
</script>

<template>
  <div class="time-wheel" :class="`is-${tone}`" data-time-wheel>
    <div
      v-for="col in columns"
      :key="col"
      class="tw-column"
      :class="`tw-${col}`"
      :data-wheel-col="col"
      @wheel.prevent="onWheel(col, $event)"
      @touchstart.passive="onTouchStart"
      @touchmove.prevent="onTouchMove(col, $event)"
      @touchend.passive="onTouchEnd"
      @touchcancel.passive="onTouchEnd"
    >
      <div
        v-for="offset in OFFSETS"
        :key="offset"
        class="tw-row"
        :class="rowClass(offset)"
        :data-offset="offset"
        @click="step(col, offset)"
      >{{ valueAt(col, offset) }}</div>
    </div>
  </div>
</template>

<style scoped>
.time-wheel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 4px 18px;
  user-select: none;
  --tw-center: #111111;
  --tw-near: #8E8E93;
  --tw-far: #C7C7CC;
}
.time-wheel.is-dark {
  --tw-center: #FFFFFF;
  --tw-near: #98989F;
  --tw-far: #48484A;
}
.tw-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  touch-action: none;
  cursor: pointer;
}
.tw-row {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  transition: color 0.12s ease, font-size 0.12s ease;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.tw-row.is-center { font-size: 30px; font-weight: 500; color: var(--tw-center); }
.tw-row.is-near { font-size: 22px; font-weight: 400; color: var(--tw-near); }
.tw-row.is-far { font-size: 16px; font-weight: 400; color: var(--tw-far); }
.tw-period .tw-row.is-center { font-size: 26px; }
.tw-period .tw-row.is-near { font-size: 20px; }
</style>
