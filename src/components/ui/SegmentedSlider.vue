<script setup>
import { computed, ref } from 'vue'

/**
 * 全仓通用分段滑块控件 (SegmentedSlider)
 * ========================================
 * 依据真机实测（Infinix X6878 / Android 17 系统规范）：
 *   - 轨道：10px 高度圆角胶囊（#EBEBEB），内部填充高亮条（#3375F6）；
 *   - 刻度点：4px 圆点，未填充区浅灰（#CECECE），已填充区浅蓝（#77ABF8）；
 *   - 刻度点位置两端内缩（5px），严格与轨道两端圆弧中心对齐，保证首尾点不跑出轨道边缘；
 *   - 刻度点 z-index: 1，滑块 Thumb z-index: 4，确保刻度点绝不显示在滑块上方；
 *   - 滑块 Thumb：22px 白底圆点 + 3px 纯蓝边框（#3375F6），无多余灰糊阴影；
 *   - 支持 steps > 1 档位吸附（如 3 档、5 档）与 steps = 0 无极调节。
 */
const props = defineProps({
  modelValue: { type: Number, default: 0.5 }, // 0..1 的比例数值
  steps: { type: Number, default: 0 }, // 档位数，0 为无极，3 为三段式，5 为五段式
  leftLabel: { type: String, default: '' },
  rightLabel: { type: String, default: '' },
  middleLabel: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])

const trackRef = ref(null)
let dragging = false

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function calcRatio(clientX) {
  const el = trackRef.value
  if (!el) return props.modelValue
  const r = el.getBoundingClientRect()
  // 轨道可用滑动宽度为 r.width
  let ratio = clamp((clientX - r.left) / r.width, 0, 1)
  if (props.steps > 1) {
    const segs = props.steps - 1
    ratio = Math.round(ratio * segs) / segs
  }
  return ratio
}

function onPointerDown(e) {
  if (props.disabled) return
  dragging = true
  e.currentTarget.setPointerCapture?.(e.pointerId)
  const val = calcRatio(e.clientX)
  emit('update:modelValue', val)
  emit('change', val)
}

function onPointerMove(e) {
  if (!dragging || props.disabled) return
  const val = calcRatio(e.clientX)
  emit('update:modelValue', val)
  emit('change', val)
}

function onPointerUp() {
  dragging = false
}

// 归一化到 0..1
const normalizedValue = computed(() => clamp(props.modelValue, 0, 1))

// 百分比字符串
const pct = computed(() => `${normalizedValue.value * 100}%`)

// 计算刻度点的位置：两端内缩 5px，使得 0% 和 100% 处的小圆点居于两端半圆圆心内，绝不跑出轨道
function tickLeftStyle(index) {
  if (props.steps <= 1) return '0%'
  const stepRatio = (index - 1) / (props.steps - 1)
  // 当 stepRatio 为 0 时为 5px，为 1 时为 calc(100% - 5px)
  return `calc(5px + (100% - 10px) * ${stepRatio})`
}

function isCovered(index) {
  if (props.steps <= 1) return false
  const stepRatio = (index - 1) / (props.steps - 1)
  return stepRatio <= normalizedValue.value + 0.005
}

// 滑块的位置也与刻度点内缩统一
const thumbLeftStyle = computed(() => {
  return `calc(5px + (100% - 10px) * ${normalizedValue.value})`
})
</script>

<template>
  <div class="segmented-slider" :class="{ disabled }">
    <!-- 可选的上方/两侧标签 -->
    <div v-if="leftLabel || rightLabel || middleLabel" class="slider-labels">
      <span class="label-side label-left">{{ leftLabel }}</span>
      <span v-if="middleLabel" class="label-middle">{{ middleLabel }}</span>
      <span class="label-side label-right">{{ rightLabel }}</span>
    </div>

    <!-- 触摸与滑块轨道 -->
    <div
      ref="trackRef"
      class="slider-track"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- 高亮填充条 -->
      <div class="slider-fill" :style="{ width: thumbLeftStyle }"></div>

      <!-- 分段刻度点（仅在 steps > 1 时渲染，层级低于滑块） -->
      <template v-if="steps > 1">
        <i
          v-for="i in steps"
          :key="i"
          class="slider-tick"
          :class="{ covered: isCovered(i) }"
          :style="{ left: tickLeftStyle(i) }"
        ></i>
      </template>

      <!-- 滑块 Thumb（层级在刻度点之上，z-index: 4） -->
      <div class="slider-thumb" :style="{ left: thumbLeftStyle }"></div>
    </div>
  </div>
</template>

<style scoped>
.segmented-slider {
  width: 100%;
  position: relative;
  user-select: none;
}

.segmented-slider.disabled {
  opacity: 0.45;
  pointer-events: none;
}

.slider-labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #8E8E93;
}

.label-side {
  font-size: 14px;
  color: #111111;
  font-weight: 500;
}

.label-middle {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: #8E8E93;
}

/* 轨道（真机实测 10px 高，圆角 5px） */
.slider-track {
  position: relative;
  height: 10px;
  border-radius: 5px;
  background: #EBEBEB;
  cursor: pointer;
  touch-action: none;
}

/* 填充条（真机纯蓝 #3375F6） */
.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 5px;
  background: #3375F6;
  pointer-events: none;
}

/* 刻度点：两端内缩且居中，层级设定为 1，确保绝不遮挡滑块 */
.slider-tick {
  position: absolute;
  top: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #CECECE;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}

.slider-tick.covered {
  background: #77ABF8;
}

/* 滑块 Thumb：外径 22px，3px 纯蓝边框，纯白底，z-index 为 4 */
.slider-thumb {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
  box-sizing: border-box;
  border-radius: 50%;
  background: #FFFFFF;
  border: 3px solid #3375F6;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 4;
}
</style>
