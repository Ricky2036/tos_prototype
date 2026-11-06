<script setup>
import { computed, ref } from 'vue'
import { clamp } from '../../../../utils/math'

/**
 * 设置页里的横向滑块（亮度 / 色温 / 触感强度 / 振动强度 / 字体大小…）。
 * v-model 为 0..1 的数值；可给左右标签（如「弱 / 强」），也可给三段标签（如「冷 / 默认 / 暖」）。
 */
const props = defineProps({
  modelValue: { type: Number, default: 0.5 },
  leftLabel: { type: String, default: '' },
  rightLabel: { type: String, default: '' },
  middleLabel: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  /** 轨道刻度点数量（真机字体页的滑块上是 3 个） */
  ticks: { type: Number, default: 0 }
})
const emit = defineEmits(['update:modelValue'])

const trackRef = ref(null)
let dragging = false

function setFromEvent(e) {
  if (props.disabled) return
  const el = trackRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const ratio = clamp((e.clientX - r.left) / r.width, 0, 1)
  emit('update:modelValue', ratio)
}

function onPointerDown(e) {
  if (props.disabled) return
  dragging = true
  e.currentTarget.setPointerCapture?.(e.pointerId)
  setFromEvent(e)
}
function onPointerMove(e) {
  if (dragging) setFromEvent(e)
}
function onPointerUp() {
  dragging = false
}

const pct = computed(() => `${clamp(props.modelValue, 0, 1) * 100}%`)
</script>

<template>
  <div class="h-slider" :class="{ disabled }">
    <div v-if="leftLabel || rightLabel || middleLabel" class="h-slider-labels">
      <span class="side">{{ leftLabel }}</span>
      <span class="middle">{{ middleLabel }}</span>
      <span class="side">{{ rightLabel }}</span>
    </div>
    <div
      ref="trackRef"
      class="h-slider-track"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="h-slider-fill" :style="{ width: pct }"></div>
      <i
        v-for="n in ticks"
        :key="n"
        class="h-slider-tick"
        :style="{ left: `${(n / (ticks + 1)) * 100}%` }"
        :class="{ covered: (n / (ticks + 1)) * 100 <= parseFloat(pct) }"
      ></i>
      <div class="h-slider-thumb" :style="{ left: pct }"></div>
    </div>
  </div>
</template>

<style scoped>
.h-slider {
  width: 100%;
}

.h-slider.disabled {
  opacity: 0.45;
  pointer-events: none;
}

.h-slider-labels {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
  color: #8E8E93;
}

.h-slider-labels .middle {
  flex: 1;
  text-align: center;
}

/* 几何全部来自真机实测（/tmp/ref/gC/00.png）：
   轨道厚 34px@1208 = 10dp · 圆点外径 72px = 21.5dp · 环厚 11px ≈ 3dp · 圆点无投影 */
.h-slider-track {
  position: relative;
  height: 10px;
  border-radius: 5px;
  background: #EBEBEB;
  cursor: pointer;
  touch-action: none;
  /* 圆点 22px 且以 left 百分比居中 ⇒ 右端内缩半个圆点，否则 100% 时溢出容器 */
  margin-right: 11px;
}

.h-slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 5px;
  background: #3375F6;
}

/* 刻度点：落在已填充区时用半透明白，未填充区用浅灰 */
.h-slider-tick {
  position: absolute;
  top: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #C7C7CC;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.h-slider-tick.covered {
  background: #FFFFFF;
  opacity: 0.85;
}

.h-slider-thumb {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
  box-sizing: border-box;
  border-radius: 50%;
  background: #FFFFFF;
  border: 3px solid #3375F6;
  transform: translate(-50%, -50%);
}
</style>
