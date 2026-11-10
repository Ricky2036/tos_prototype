<script setup>
import { computed, reactive, watch, onBeforeUnmount } from 'vue'
import { pad2, parseTimeValue, to12Hour, to24Hour, toTimeString } from '../../utils/timePicker.js'

/**
 * 【全仓标准控件】三列时间滚轮本体 —— 真机量测版（2026-11-10，/tmp/ref/gI/dnd_20_start_time_full.png）。
 *
 * 像素量测（480 缩略图 → 360 画布 CSS px，×0.75）：
 *   · 行中心间距 46.5/48.5 缩略图 → **35 CSS px**（ROW_H）
 *   · 选中字形高 21 缩略图 → font-size **23 CSS px**；相邻 17 → scale 0.76；最外 8 → scale 0.52
 *   · 5 行可见区 **175 CSS px**（原实现 46×5=230，整卡约 400px，明显偏高偏大）
 *   · 无选中高亮条，靠字号与灰度连续分层
 *
 * 动效：数字**跟手连续位移**（translateY 按浮点 offset 实时算）+ **连续缩放/变色**；
 * 松手按拖拽末速度做前瞻预测（滚得越快多滚几格），再用阻尼弹簧吸附，形成惯性继承。
 * 交互统一走 Pointer Events（鼠标拖拽 / 真机触摸 / CDP touch 都覆盖），另支持滚轮与点击。
 */
const props = defineProps({
  modelValue: { type: String, default: '07:00' },
  showPeriod: { type: Boolean, default: true },
  hourMode: { type: String, default: '12' }, // '12' = 1-12 + 上午/下午（真机）；'24' = 00-23（时钟闹钟编辑）
  tone: { type: String, default: 'light' } // 'light' | 'dark'
})
const emit = defineEmits(['update:modelValue'])

const ROW_H = 35
const SLOTS = [-3, -2, -1, 0, 1, 2, 3]
const SPRING_K = 0.00022
const DAMP = 0.018
const LOOK_AHEAD_MS = 150

const columns = computed(() => {
  if (props.hourMode === '24') return ['hour', 'minute']
  return props.showPeriod ? ['hour', 'minute', 'period'] : ['hour', 'minute']
})

function newCol() {
  return { offset: 0, v: 0, target: 0, dragging: false, animating: false, lastY: 0, lastT: 0, lastFrame: 0, moved: 0 }
}
const cols = reactive({ hour: newCol(), minute: newCol(), period: newCol() })

/** 圆周取值：hour 12/24、minute 60、period 2 */
function valueAt(col, index) {
  if (col === 'hour') {
    if (props.hourMode === '24') return pad2(((index % 24) + 24) % 24)
    return (((index % 12) + 12) % 12) + 1
  }
  if (col === 'minute') return pad2(((index % 60) + 60) % 60)
  return ((index % 2) + 2) % 2 === 0 ? '上午' : '下午'
}

function syncFromValue(value) {
  if (Object.values(cols).some(c => c.dragging || c.animating)) return
  const { hour24, minute } = parseTimeValue(value)
  cols.hour.offset = props.hourMode === '24' ? hour24 : to12Hour(hour24).hour12 - 1
  cols.minute.offset = minute
  cols.period.offset = hour24 < 12 ? 0 : 1
  for (const col of ['hour', 'minute', 'period']) {
    cols[col].target = cols[col].offset
    cols[col].v = 0
    cols[col].animating = false
  }
}
watch(() => props.modelValue, syncFromValue, { immediate: true })

/** 当前组合出的 24 小时制时间；跨过半行即视为选中，父级实时同步 */
const currentValue = computed(() => {
  const h = Math.round(cols.hour.offset)
  const m = Math.round(cols.minute.offset)
  const minute = ((m % 60) + 60) % 60
  const hour24 = props.hourMode === '24'
    ? ((h % 24) + 24) % 24
    : to24Hour((((h % 12) + 12) % 12) + 1, ((Math.round(cols.period.offset) % 2) + 2) % 2 === 0 ? '上午' : '下午')
  return toTimeString(hour24, minute)
})
watch(currentValue, (v) => emit('update:modelValue', v))

/** 三档灰度按 |d| 连续插值，滑动时颜色平滑过渡（无跳变、无高亮条） */
const PALETTES = {
  light: { center: [17, 17, 17], near: [142, 142, 147], far: [199, 199, 204] },
  dark: { center: [255, 255, 255], near: [152, 152, 159], far: [72, 72, 74] }
}
function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)) }
function colorAt(distance) {
  const p = PALETTES[props.tone] || PALETTES.light
  const d = Math.abs(distance)
  const rgb = d <= 1 ? mix(p.center, p.near, d) : mix(p.near, p.far, Math.min(1, d - 1))
  return `rgb(${rgb.join(',')})`
}

function slotStyle(col, slot) {
  const c = cols[col]
  const phase = c.offset - Math.round(c.offset)
  const d = slot - phase
  const a = Math.abs(d)
  const scale = Math.max(0.5, 1 - Math.min(a, 3) * 0.24)
  return {
    transform: `translate3d(0, ${(d * ROW_H).toFixed(2)}px, 0) scale(${scale.toFixed(3)})`,
    color: colorAt(d),
    opacity: a > 2.65 ? 0 : 1,
    zIndex: 10 - Math.round(a)
  }
}

function slotValue(col, slot) {
  // 真机上午/下午列只有「上一个 + 当前」两行，下方留白
  if (col === 'period' && (slot > 0 || slot < -1)) return ''
  return valueAt(col, Math.round(cols[col].offset) + slot)
}

/* ---------- 惯性 / 跟手动画 ---------- */
let rafId = 0
function tick(now) {
  let active = false
  for (const col of columns.value) {
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
  c.target = col === 'period' ? Math.max(0, Math.min(1, target)) : target
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
  c.v = (dy / ROW_H) / dt // 行/ms，供松手后的惯性前瞻
  c.lastY = e.clientY
  c.lastT = now
  c.lastFrame = now
}
function onPointerUp(col, e) {
  const c = cols[col]
  if (!c.dragging) return
  c.dragging = false
  // 轻点：按落点相对中心的偏移选槽位（setPointerCapture 会抢走 slot 的 click，
  // 所以不能再依赖子元素 @click）
  if (c.moved < 6) {
    const box = e.currentTarget.getBoundingClientRect()
    const dy = e.clientY - (box.top + box.height / 2)
    const slot = Math.max(-2, Math.min(2, Math.round(dy / ROW_H)))
    if (slot !== 0) {
      animateTo(col, Math.round(c.offset) + slot)
      return
    }
  }
  // 拖动：把松手末速度折算成前瞻格数，再交给阻尼弹簧吸附
  const lookAhead = Math.max(-6, Math.min(6, c.v * LOOK_AHEAD_MS))
  animateTo(col, Math.round(c.offset + lookAhead))
}
function onWheel(col, e) {
  e.preventDefault()
  animateTo(col, Math.round(cols[col].offset) + (e.deltaY > 0 ? 1 : -1))
}
onBeforeUnmount(() => { if (rafId) cancelAnimationFrame(rafId) })
defineExpose({ cols, ROW_H, currentValue })
</script>

<template>
  <div
    class="time-wheel"
    :class="`is-${tone}`"
    data-time-wheel
    :style="{ height: (5 * ROW_H) + 'px' }"
  >
    <div
      v-for="col in columns"
      :key="col"
      class="tw-column"
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
        class="tw-slot"
        :data-offset="slot"
        :style="slotStyle(col, slot)"
      >{{ slotValue(col, slot) }}</div>
    </div>
  </div>
</template>

<style scoped>
.time-wheel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}
.tw-column {
  position: relative;
  flex: 1;
  height: 100%;
  cursor: grab;
}
.tw-column:active { cursor: grabbing; }
.tw-slot {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 35px;
  margin-top: -17.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 基准 23px 来自真机量测；相邻项靠 scale 连续缩到 ~17px / ~12px */
  font-size: 23px;
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  will-change: transform, color;
  transform-origin: center center;
}
</style>
