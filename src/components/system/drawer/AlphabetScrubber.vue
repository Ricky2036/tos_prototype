<script setup>
import { ref } from 'vue'
import { ALPHABET_LIST } from '../../../config/drawerApps'

const props = defineProps({
  activeLetter: {
    type: String,
    default: 'A'
  }
})

const emit = defineEmits(['select', 'scrubbing'])

const isDragging = ref(false)
const previewLetter = ref('')
const barRef = ref(null)
const previewY = ref(0)

function getLetterAtY(clientY) {
  if (!barRef.value) return null
  const rect = barRef.value.getBoundingClientRect()
  const clampedY = Math.max(rect.top, Math.min(rect.bottom - 1, clientY))
  const ratio = (clampedY - rect.top) / rect.height
  const index = Math.floor(ratio * ALPHABET_LIST.length)
  const validIndex = Math.max(0, Math.min(ALPHABET_LIST.length - 1, index))
  return {
    letter: ALPHABET_LIST[validIndex],
    y: clampedY - rect.top
  }
}

function onPointerDown(e) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
  e.currentTarget.setPointerCapture?.(e.pointerId)
  
  const result = getLetterAtY(e.clientY)
  if (result) {
    previewLetter.value = result.letter
    previewY.value = result.y
    emit('select', result.letter)
    emit('scrubbing', true, result.letter)
  }
}

function onPointerMove(e) {
  if (!isDragging.value) return
  e.preventDefault()
  e.stopPropagation()
  
  const result = getLetterAtY(e.clientY)
  if (result && result.letter !== previewLetter.value) {
    previewLetter.value = result.letter
    previewY.value = result.y
    emit('select', result.letter)
    emit('scrubbing', true, result.letter)
  }
}

function onPointerUp(e) {
  if (!isDragging.value) return
  isDragging.value = false
  emit('scrubbing', false, previewLetter.value)
  try {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  } catch {}
}
</script>

<template>
  <div
    ref="barRef"
    class="alphabet-scrubber"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <!-- 字母垂直列表 -->
    <div
      v-for="letter in ALPHABET_LIST"
      :key="letter"
      class="scrubber-item"
      :class="{
        'is-active': activeLetter === letter,
        'is-scrubbed': isDragging && previewLetter === letter
      }"
    >
      {{ letter }}
    </div>

    <!-- 拖拽时右侧悬浮的大号字母预览气泡 (参考 111.mp4 浮动指示) -->
    <Transition name="fade-bubble">
      <div
        v-if="isDragging && previewLetter"
        class="scrubber-bubble"
        :style="{ top: previewY + 'px' }"
      >
        <span class="bubble-char">{{ previewLetter }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.alphabet-scrubber {
  position: absolute;
  right: 2px;
  top: calc(var(--safe-top) + 54px);
  bottom: calc(var(--safe-bottom) + 64px);
  width: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  touch-action: none;
  z-index: 100;
  padding: 4px 0;
}

.scrubber-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font: 600 9px/1 var(--font-stack);
  color: rgba(255, 255, 255, 0.55);
  transition: color 0.12s ease, transform 0.12s ease;
  width: 16px;
  height: 14px;
}

.scrubber-item.is-active {
  color: #22D3EE; /* 传音风格清爽青蓝色高亮 */
  font-weight: 700;
  transform: scale(1.15);
}

.scrubber-item.is-scrubbed {
  color: #00F0FF;
  font-weight: 800;
  transform: scale(1.3);
}

/* 浮动大号字母气泡 */
.scrubber-bubble {
  position: absolute;
  right: 32px;
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 120;
}

.bubble-char {
  color: #fff;
  font: 700 28px/1 var(--font-stack);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.fade-bubble-enter-active,
.fade-bubble-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-bubble-enter-from,
.fade-bubble-leave-to {
  opacity: 0;
  transform: translateY(-50%) scale(0.7);
}
</style>
