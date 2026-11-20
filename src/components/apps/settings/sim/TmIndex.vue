<script setup>
import { ref } from 'vue'

/**
 * 侧边 A-Z 导轨（真机口径）
 *
 * 真机形态（1208×2644 截图）：
 *   · 贴右缘一列，条目高 15、字号 10，只有**确实有应用的首字母**才出现（真机就缺 N / R）
 *   · 最上面一颗 ★：回顶部（第一组「不受限制的应用」）
 *   · 当前所在分组的字母变蓝加粗，其余中灰 —— 跟着滚动走，不是"选中态"
 *   · 按住上下滑 = 连续跳转（真机截图里滑动时不弹气泡，故不画气泡）
 */
const props = defineProps({
  letters: { type: Array, default: () => [] },
  activeLetter: { type: String, default: '' },
  star: { type: Boolean, default: true },
  testid: { type: String, default: 'tm-index' }
})
const emit = defineEmits(['select'])

const dragging = ref(false)
const hovered = ref('')

function letterAt(x, y) {
  const el = document.elementFromPoint(x, y)?.closest('[data-index-letter]')
  return el?.dataset.indexLetter || ''
}

function pick(e) {
  const l = letterAt(e.clientX, e.clientY)
  if (!l || l === hovered.value) return
  hovered.value = l
  emit('select', l)
}

function onDown(e) {
  dragging.value = true
  e.currentTarget.setPointerCapture?.(e.pointerId)
  pick(e)
}

function onMove(e) {
  if (!dragging.value) return
  pick(e)
}

function onUp(e) {
  if (!dragging.value) return
  dragging.value = false
  hovered.value = ''
  try {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  } catch {}
}

const shown = (letter) => (dragging.value && hovered.value ? hovered.value : props.activeLetter) === letter
</script>

<template>
  <div
    class="tm-index"
    :data-testid="testid"
    @pointerdown.stop="onDown"
    @pointermove.stop="onMove"
    @pointerup.stop="onUp"
    @pointercancel.stop="onUp"
  >
    <span
      v-if="star"
      class="tm-index-letter tm-index-star"
      :class="{ 'is-active': shown('★') }"
      data-index-letter="★"
    >★</span>
    <span
      v-for="letter in letters"
      :key="letter"
      class="tm-index-letter"
      :class="{ 'is-active': shown(letter) }"
      :data-index-letter="letter"
    >{{ letter }}</span>
  </div>
</template>
