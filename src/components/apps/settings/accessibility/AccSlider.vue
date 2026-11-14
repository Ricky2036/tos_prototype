<script setup>
import { computed, ref } from 'vue'

/**
 * 辅助功能包内的水平滑块（浮标设置「大小 / 透明度」用）
 *
 * 真机实测（2026-11-14，浮标设置页 1208×2644）：
 *   轨道 1015×34 物理 px → 302×10 设计 px，圆角 5，未选色 #EBEBEB
 *   已选段 #3375F6；圆钮 73 物理 px → 21.8 设计 px，白色内芯 + 3.5px 蓝色描边
 *   圆钮与轨道同高居中、允许左右各溢出半个钮身（Android SeekBar 行为）
 * 只在辅助功能包内使用，所以走局部样式，不动全局控件。
 */
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  testid: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])

const trackRef = ref(null)
let dragging = false

function setFromX(clientX) {
  const el = trackRef.value
  if (!el) return
  const r = el.getBoundingClientRect()
  if (!r.width) return
  const v = (clientX - r.left) / r.width
  emit('update:modelValue', Math.min(1, Math.max(0, v)))
}

function onDown(e) {
  dragging = true
  e.currentTarget.setPointerCapture?.(e.pointerId)
  setFromX(e.clientX)
}
function onMove(e) {
  if (dragging) setFromX(e.clientX)
}
function onUp() {
  dragging = false
}

const pct = computed(() => `${Math.round(props.modelValue * 1000) / 10}%`)
</script>

<template>
  <div
    ref="trackRef"
    class="acc-slider"
    :data-testid="testid || undefined"
    @pointerdown="onDown"
    @pointermove="onMove"
    @pointerup="onUp"
    @pointercancel="onUp"
  >
    <div class="acc-slider-track">
      <div class="acc-slider-fill" :style="{ width: pct }"></div>
    </div>
    <div class="acc-slider-knob" :style="{ left: pct }"></div>
  </div>
</template>

<style scoped>
.acc-slider {
  position: relative;
  height: 22px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
}

.acc-slider-track {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: #EBEBEB;
  overflow: hidden;
}

.acc-slider-fill {
  height: 100%;
  background: #3375F6;
}

.acc-slider-knob {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 3.5px solid #3375F6;
  box-sizing: border-box;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>
