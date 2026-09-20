<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { ALPHABET_LIST } from '../../../config/drawerApps'

const props = defineProps({
  letters: {
    type: Array,
    default: () => ALPHABET_LIST
  },
  lettersWithApps: {
    type: Array,
    default: () => []
  },
  activeLetter: {
    type: String,
    default: 'D'
  },
  isFilterMode: {
    type: Boolean,
    default: false
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
const activeY = ref(0)

function updateActiveY() {
  if (!barRef.value) return
  const letter = isDragging.value ? previewLetter.value : props.activeLetter
  const el = barRef.value.querySelector(`.scrubber-item[data-letter="${letter}"]`)
  if (el) {
    const rect = barRef.value.getBoundingClientRect()
    const itemRect = el.getBoundingClientRect()
    activeY.value = itemRect.top + itemRect.height / 2 - rect.top
  }
}

watch(() => props.activeLetter, () => {
  nextTick(() => updateActiveY())
})

onMounted(() => {
  nextTick(() => updateActiveY())
})

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
  e.stopPropagation()
  isDragging.value = true
  e.currentTarget.setPointerCapture?.(e.pointerId)

  const result = getLetterFromEvent(e)
  if (result) {
    previewLetter.value = result.letter
    previewY.value = result.y
    emit('select', result.letter, result.y)
    emit('scrubbing', true, result.letter)
    updateActiveY()
  }
}

function onPointerMove(e) {
  if (!isDragging.value) return
  e.stopPropagation()

  const result = getLetterFromEvent(e)
  if (result && result.letter !== previewLetter.value) {
    previewLetter.value = result.letter
    previewY.value = result.y
    emit('select', result.letter, result.y)
    emit('scrubbing', true, result.letter)
    updateActiveY()
  }
}

function onPointerUp(e) {
  if (!isDragging.value) return
  e.stopPropagation()
  isDragging.value = false
  emit('scrubbing', false, previewLetter.value)
  try {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  } catch {}
  updateActiveY()
}

function onClickLetter(letter, e) {
  e.stopPropagation()
  emit('select', letter)
  updateActiveY()
}
</script>

<template>
  <div
    ref="barRef"
    class="alphabet-scrubber"
    @click.stop
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <!-- 字母垂直列表（A-Z 及 # 严谨紧凑排布） -->
    <div
      v-for="letter in activeList"
      :key="letter"
      class="scrubber-item"
      :data-letter="letter"
      :class="{
        'has-apps': lettersWithApps.length === 0 || lettersWithApps.includes(letter),
        'is-active': activeLetter === letter,
        'is-scrubbed': isDragging && previewLetter === letter
      }"
      @click.stop="onClickLetter(letter, $event)"
    >
      {{ letter }}
    </div>
  </div>
</template>

<style scoped>
.alphabet-scrubber {
  position: absolute;
  right: 2px;
  top: calc(var(--safe-top, 24px) + 52px);
  bottom: calc(var(--safe-bottom, 34px) + 66px);
  width: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  touch-action: none;
  z-index: 100;
  padding: 2px 0;
  box-sizing: border-box;
}

.scrubber-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font: 700 8.5px/1 var(--font-stack, -apple-system, BlinkMacSystemFont, sans-serif);
  color: rgba(255, 255, 255, 0.3);
  transition: color 0.12s ease, transform 0.12s ease;
  width: 16px;
  height: 13.5px;
  cursor: pointer;
  border-radius: 3px;
}

.scrubber-item.has-apps {
  color: rgba(255, 255, 255, 0.62);
}

.scrubber-item.is-active {
  color: #22d3ee;
  font-weight: 900;
  transform: scale(1.3);
}

.scrubber-item.is-scrubbed {
  color: #00f0ff;
  font-weight: 900;
  transform: scale(1.45);
}
</style>
