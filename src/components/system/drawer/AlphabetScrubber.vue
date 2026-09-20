<script setup>
import { computed, ref } from 'vue'
import { ALPHABET_LIST } from '../../../config/drawerApps'

const props = defineProps({
  letters: {
    type: Array,
    default: () => ALPHABET_LIST
  },
  activeLetter: {
    type: String,
    default: 'D'
  },
  showIndicator: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'scrubbing'])

const activeList = computed(() => (props.letters && props.letters.length > 0 ? props.letters : ALPHABET_LIST))

const isDragging = ref(false)
const previewLetter = ref('')
const barRef = ref(null)
const previewY = ref(0)

function getLetterFromEvent(e) {
  if (!barRef.value || activeList.value.length === 0) return null
  const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.scrubber-item')
  if (el && el.dataset.letter) {
    const rect = barRef.value.getBoundingClientRect()
    const itemRect = el.getBoundingClientRect()
    return {
      letter: el.dataset.letter,
      y: itemRect.top + itemRect.height / 2 - rect.top
    }
  }

  const rect = barRef.value.getBoundingClientRect()
  const clampedY = Math.max(rect.top, Math.min(rect.bottom - 1, e.clientY))
  const ratio = (clampedY - rect.top) / rect.height
  const index = Math.floor(ratio * activeList.value.length)
  const validIndex = Math.max(0, Math.min(activeList.value.length - 1, index))
  return {
    letter: activeList.value[validIndex],
    y: clampedY - rect.top
  }
}

function onPointerDown(e) {
  e.preventDefault()
  e.stopPropagation()
  isDragging.value = true
  e.currentTarget.setPointerCapture?.(e.pointerId)

  const result = getLetterFromEvent(e)
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

  const result = getLetterFromEvent(e)
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
    <!-- 字母垂直列表（仅渲染真实存在的字母） -->
    <div
      v-for="letter in activeList"
      :key="letter"
      class="scrubber-item"
      :data-letter="letter"
      :class="{
        'is-active': activeLetter === letter,
        'is-scrubbed': isDragging && previewLetter === letter
      }"
    >
      {{ letter }}
    </div>

    <!-- 拖拽/滚动时悬浮的大号字母指示 -->
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
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  user-select: none;
  touch-action: none;
  z-index: 100;
  padding: 8px 0;
}

.scrubber-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 11px/1 var(--font-stack, -apple-system, BlinkMacSystemFont, sans-serif);
  color: rgba(255, 255, 255, 0.45);
  transition: color 0.12s ease, transform 0.12s ease;
  width: 20px;
  height: 18px;
  cursor: pointer;
  border-radius: 4px;
}

.scrubber-item.is-active {
  color: #22d3ee;
  font-weight: 800;
  transform: scale(1.25);
}

.scrubber-item.is-scrubbed {
  color: #00f0ff;
  font-weight: 900;
  transform: scale(1.4);
}

/* 浮动大号字母指示 */
.scrubber-floating-char {
  position: absolute;
  right: 32px;
  transform: translateY(-50%);
  font-size: 28px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
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
