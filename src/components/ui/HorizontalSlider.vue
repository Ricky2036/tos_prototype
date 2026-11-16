<script setup>
/**
 * 标准水平滑块控件 (HorizontalSlider)
 * ==========================================
 * 依据真机实测（Infinix X6878 / Android 17 系统导航手势灵敏度与设置滑块规范）：
 *   - 药丸型轨道：高度 8px，底色 #E5E7EB，圆角 4px。
 *   - 激活填充轨：主题蓝 #0066FF，圆角 4px。
 *   - 悬浮圆球滑块：直径 22px，主题蓝 #0066FF，轻微投影，拖拽时有平滑反馈。
 *   - 支持：指针捕获拖拽、点击轨道跳转、v-model 双向绑定、键盘左右键调节、禁用态置灰。
 */
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 50 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const trackRef = ref(null)
const isDragging = ref(false)

const percentage = computed(() => {
  const range = props.max - props.min
  if (range <= 0) return 0
  const val = Math.min(Math.max(props.modelValue, props.min), props.max)
  return ((val - props.min) / range) * 100
})

function updateFromEvent(e) {
  if (props.disabled) return
  const track = trackRef.value
  if (!track) return

  const rect = track.getBoundingClientRect()
  const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0)
  const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
  const rawValue = props.min + ratio * (props.max - props.min)

  const steps = Math.round((rawValue - props.min) / props.step)
  const steppedValue = Math.min(Math.max(props.min + steps * props.step, props.min), props.max)

  emit('update:modelValue', steppedValue)
  emit('change', steppedValue)
}

function onPointerDown(e) {
  if (props.disabled) return
  isDragging.value = true
  e.currentTarget.setPointerCapture?.(e.pointerId)
  updateFromEvent(e)
}

function onPointerMove(e) {
  if (!isDragging.value) return
  updateFromEvent(e)
}

function onPointerUp(e) {
  if (isDragging.value) {
    isDragging.value = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }
}

function onKeyDown(e) {
  if (props.disabled) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault()
    const next = Math.min(props.modelValue + props.step, props.max)
    emit('update:modelValue', next)
    emit('change', next)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault()
    const prev = Math.max(props.modelValue - props.step, props.min)
    emit('update:modelValue', prev)
    emit('change', prev)
  }
}
</script>

<template>
  <div
    class="horizontal-slider"
    :class="{ disabled, dragging: isDragging }"
    tabindex="0"
    role="slider"
    :aria-valuenow="modelValue"
    :aria-valuemin="min"
    :aria-valuemax="max"
    @keydown="onKeyDown"
  >
    <div
      ref="trackRef"
      class="slider-track"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- 填充轨 -->
      <div class="slider-fill" :style="{ width: `${percentage}%` }"></div>

      <!-- 滑动拇指 (Thumb) -->
      <div
        class="slider-thumb"
        :style="{ left: `${percentage}%` }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.horizontal-slider {
  width: 100%;
  padding: 10px 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  touch-action: none;
  outline: none;
}
.horizontal-slider.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}
.slider-track {
  position: relative;
  width: 100%;
  height: 10px;
  background: #F3F4F6;
  border: 1.5px solid #D1D5DB;
  border-radius: 6px;
  box-sizing: border-box;
}
.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #0066FF;
  border-radius: 4px;
  pointer-events: none;
}
.slider-thumb {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #0066FF;
  box-shadow: 0 2px 6px rgba(0, 102, 255, 0.38);
  transform: translate(-50%, -50%);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  pointer-events: none;
}
.horizontal-slider:active .slider-thumb,
.horizontal-slider.dragging .slider-thumb {
  transform: translate(-50%, -50%) scale(1.15);
  box-shadow: 0 3px 10px rgba(0, 102, 255, 0.45);
}
</style>
