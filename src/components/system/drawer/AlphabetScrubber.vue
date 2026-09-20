<script setup>
import { computed, ref } from 'vue'
import { ALPHABET_LIST } from '../../../config/drawerApps'

const props = defineProps({
  activeLetter: {
    type: String,
    default: 'A'
  },
  showIndicator: {
    type: Boolean,
    default: false
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

    <!-- 拖拽/滚动时悬浮的纯净大号字母指示（参考 media_1789870900111.jpg 像素级还原，无圆形硬底） -->
    <Transition name="fade-char">
      <div
        v-if="isDragging && previewLetter"
        class="scrubber-floating-char"
        :style="{ top: previewY + 'px' }"
      >
        {{ previewLetter }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.alphabet-scrubber {
  position: absolute;
  right: 4px;
  top: calc(var(--safe-top, 24px) + 64px);
  bottom: calc(var(--safe-bottom, 16px) + 80px);
  width: 20px;
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
  font: 600 9.5px/1 var(--font-stack, -apple-system, BlinkMacSystemFont, sans-serif);
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.12s ease, transform 0.12s ease;
  width: 16px;
  height: 13px;
  cursor: pointer;
}

.scrubber-item.is-active {
  color: #22D3EE;
  font-weight: 700;
  transform: scale(1.2);
}

.scrubber-item.is-scrubbed {
  color: #00F0FF;
  font-weight: 800;
  transform: scale(1.35);
}

/* 浮动大号字母指示：纯净无框文字，与真机截图像素级一致 */
.scrubber-floating-char {
  position: absolute;
  right: 28px;
  transform: translateY(-50%);
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  z-index: 120;
}

.fade-char-enter-active,
.fade-char-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.fade-char-enter-from,
.fade-char-leave-to {
  opacity: 0;
  transform: translateY(-50%) scale(0.75);
}
</style>
