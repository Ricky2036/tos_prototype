<script setup>
import { computed, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  parseDateValue,
  getDaysInMonth,
  toDateString,
  toChineseDateString
} from '../../utils/datePicker.js'

/**
 * 【全仓标准控件】三列日期滚轮本体 —— 真机量测版（Infinix X6878 / Android 17）。
 *
 * 结构与动效完全看齐 TimeWheel.vue：
 *   · 年、月、日三列滚轮，行中心距 35 CSS px（ROW_H）
 *   · 选中字号 23 CSS px，相邻连续缩放插值
 *   · 5 行可见区，共 175 CSS px
 *   · 数字跟手连续位移 + 阻尼弹簧吸附与前瞻预测
 *   · 月份/年份变动联动天数上限（闰年/大小月自动截断）
 */
const props = defineProps({
  modelValue: { type: String, default: '2026-11-14' },
  minYear: { type: Number, default: 1970 },
  maxYear: { type: Number, default: 2050 },
  tone: { type: String, default: 'light' } // 'light' | 'dark'
})
const emit = defineEmits(['update:modelValue'])

const ROW_H = 35
const SLOTS = [-3, -2, -1, 0, 1, 2, 3]
const SPRING_K = 0.00022
const DAMP = 0.018
const LOOK_AHEAD_MS = 150

const columns = ['year', 'month', 'day']

function newCol() {
  return { offset: 0, v: 0, target: 0, dragging: false, animating: false, lastY: 0, lastT: 0, lastFrame: 0, moved: 0 }
}
const cols = reactive({ year: newCol(), month: newCol(), day: newCol() })

/** 计算当前选中的年份与月份，用于计算日期上限 */
const currentYear = computed(() => {
  const y = props.minYear + Math.round(cols.year.offset)
  return Math.max(props.minYear, Math.min(props.maxYear, y))
})

const currentMonth = computed(() => {
  const m = ((Math.round(cols.month.offset) % 12) + 12) % 12 + 1
  return m
})

const maxDaysCurrentMonth = computed(() => {
  return getDaysInMonth(currentYear.value, currentMonth.value)
})

function valueAt(col, index) {
  if (col === 'year') {
    const y = props.minYear + index
    if (y < props.minYear || y > props.maxYear) return ''
    return `${y}年`
  }
  if (col === 'month') {
    const m = ((index % 12) + 12) % 12 + 1
    return `${m}月`
  }
  // day
  const maxD = maxDaysCurrentMonth.value
  const d = ((index % maxD) + maxD) % maxD + 1
  return `${d}日`
}

function syncFromValue(value) {
  if (Object.values(cols).some(c => c.dragging || c.animating)) return
  const { year, month, day } = parseDateValue(value)
  cols.year.offset = Math.max(0, Math.min(props.maxYear - props.minYear, year - props.minYear))
  cols.month.offset = month - 1
  cols.day.offset = day - 1
  for (const col of columns) {
    cols[col].target = cols[col].offset
    cols[col].v = 0
    cols[col].animating = false
  }
}
watch(() => props.modelValue, syncFromValue, { immediate: true })

/** 当月份或年份变化导致天数上限减少时，自动修正日滚轮目标 */
watch(maxDaysCurrentMonth, (maxD) => {
  const curDIndex = Math.round(cols.day.offset)
  const currentD = ((curDIndex % maxD) + maxD) % maxD + 1
  if (currentD > maxD) {
    animateTo('day', maxD - 1)
  }
})

/** 当前组合出的日期字符串（YYYY-MM-DD） */
const currentValue = computed(() => {
  const y = currentYear.value
  const m = currentMonth.value
  const maxD = getDaysInMonth(y, m)
  const dIndex = Math.round(cols.day.offset)
  const d = ((dIndex % maxD) + maxD) % maxD + 1
  return toDateString(y, m, d)
})
watch(currentValue, (v) => emit('update:modelValue', v))

const PALETTES = {
  light: { center: [17, 17, 17], near: [142, 142, 147], far: [199, 199, 204] },
  dark: { center: [255, 255, 255], near: [152, 152, 159], far: [72, 72, 74] }
}
function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)) }
function focusAt(distance) {
  return 1 - Math.min(1, Math.abs(distance) / 0.6)
}
function colorAt(distance) {
  const p = PALETTES[props.tone] || PALETTES.light
  const a = Math.abs(distance)
  const rgb = a <= 1
    ? mix(p.near, p.center, focusAt(a))
    : mix(p.far, p.near, Math.max(0, 2 - a))
  return `rgb(${rgb.join(',')})`
}

function slotStyle(col, slot) {
  const c = cols[col]
  const phase = c.offset - Math.round(c.offset)
  const d = slot - phase
  const a = Math.abs(d)
  const scale = a <= 1
    ? 0.76 + 0.24 * focusAt(a)
    : Math.max(0.5, 0.52 + 0.24 * Math.max(0, 2 - a))
  return {
    transform: `translate3d(0, ${(d * ROW_H).toFixed(2)}px, 0) scale(${scale.toFixed(3)})`,
    color: colorAt(d),
    opacity: a > 2.65 ? 0 : 1,
    zIndex: 10 - Math.round(a)
  }
}

function slotValue(col, slot) {
  return valueAt(col, Math.round(cols[col].offset) + slot)
}

/* ---------- 惯性 / 跟手动画 ---------- */
let rafId = 0
function tick(now) {
  let active = false
  for (const col of columns) {
    const c = cols[col]
    if (c.dragging || !c.animating) continue
    const dt = Math.min(32, now - (c.lastFrame || now))
    c.lastFrame = now
    const a = (c.target - c.offset) * SPRING_K - c.v * DAMP
    c.v += a * dt
    c.offset += c.v * dt
    if (Math.abs(c.target - c.offset) < 0.002 && Math.abs(c.v) < 0.00003) {
      c.offset = c.target
      c.v = 0
      c.animating = false
    } else {
      active = true
    }
  }
  if (!active) {
    for (const col of columns) {
      const c = cols[col]
      if (!c.dragging) c.offset = Math.round(c.offset)
    }
  }
  rafId = active ? requestAnimationFrame(tick) : 0
}
function startAnim(col) {
  const c = cols[col]
  c.animating = true
  c.lastFrame = 0
  if (!rafId) rafId = requestAnimationFrame(tick)
}
function animateTo(col, target) {
  const c = cols[col]
  c.dragging = false
  if (col === 'year') {
    c.target = Math.max(0, Math.min(props.maxYear - props.minYear, target))
  } else {
    c.target = target
  }
  startAnim(col)
}

function onPointerDown(col, e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  const c = cols[col]
  c.animating = false
  c.dragging = true
  c.v = 0
  c.moved = 0
  c.lastY = e.clientY
  c.lastT = performance.now()
  e.currentTarget?.setPointerCapture?.(e.pointerId)
}
function onPointerMove(col, e) {
  const c = cols[col]
  if (!c.dragging) return
  const now = performance.now()
  const dy = c.lastY - e.clientY
  const dt = Math.max(1, now - c.lastT)
  c.offset += dy / ROW_H
  c.moved += Math.abs(dy)
  c.v = (dy / ROW_H) / dt
  c.lastY = e.clientY
  c.lastT = now
  c.lastFrame = now
}
function onPointerUp(col, e) {
  const c = cols[col]
  if (!c.dragging) return
  c.dragging = false
  if (c.moved < 6) {
    const box = e.currentTarget.getBoundingClientRect()
    const dy = e.clientY - (box.top + box.height / 2)
    const slot = Math.max(-2, Math.min(2, Math.round(dy / ROW_H)))
    if (slot !== 0) {
      animateTo(col, Math.round(c.offset) + slot)
      return
    }
  }
  const lookAhead = Math.max(-6, Math.min(6, c.v * LOOK_AHEAD_MS))
  animateTo(col, Math.round(c.offset + lookAhead))
}
function onWheel(col, e) {
  e.preventDefault()
  animateTo(col, Math.round(cols[col].offset) + (e.deltaY > 0 ? 1 : -1))
}
function onGlobalPointerUp() {
  for (const col of columns) {
    const c = cols[col]
    if (!c.dragging) continue
    c.dragging = false
    const lookAhead = Math.max(-6, Math.min(6, c.v * LOOK_AHEAD_MS))
    animateTo(col, Math.round(c.offset + lookAhead))
  }
}

onMounted(() => {
  window.addEventListener('pointerup', onGlobalPointerUp)
  window.addEventListener('pointercancel', onGlobalPointerUp)
})
onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('pointerup', onGlobalPointerUp)
  window.removeEventListener('pointercancel', onGlobalPointerUp)
})
defineExpose({ cols, ROW_H, currentValue })
</script>

<template>
  <div
    class="date-wheel"
    :class="`is-${tone}`"
    data-date-wheel
    :style="{ height: (5 * ROW_H) + 'px' }"
  >
    <div
      v-for="col in columns"
      :key="col"
      class="dw-column"
      :data-wheel-col="col"
      @pointerdown="onPointerDown(col, $event)"
      @pointermove="onPointerMove(col, $event)"
      @pointerup="onPointerUp(col, $event)"
      @pointercancel="onPointerUp(col, $event)"
      @wheel="onWheel(col, $event)"
    >
      <div
        v-for="slot in SLOTS"
        :key="slot"
        class="dw-slot"
        :data-offset="slot"
        :style="slotStyle(col, slot)"
      >{{ slotValue(col, slot) }}</div>
    </div>
  </div>
</template>

<style scoped>
.date-wheel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}
.dw-column {
  position: relative;
  flex: 1.1;
  height: 100%;
  cursor: grab;
}
.dw-column[data-wheel-col="day"] {
  flex: 0.9;
}
.dw-column:active { cursor: grabbing; }
.dw-slot {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 35px;
  margin-top: -17.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  will-change: transform, color;
  transform-origin: center center;
}
</style>
