<script setup>
import { computed, ref } from 'vue'
import './acc.css'

/**
 * 辅助功能子页的横向分页插图（真机形态：手机示意画 + 标题 + 说明 + 底部圆点）。
 * 证据：截屏页 4 点、小窗页 2 点、侧边栏 3 点、游戏模式 2 点、晕动舒缓 3 点。
 * 未采到的页只换文案、沿用同一张示意画（在采集包里标 unknown，不臆造画面）。
 */
const props = defineProps({
  pages: { type: Array, required: true }, // [{ src, title, desc }]
  dots: { type: Number, default: 0 } // 真机圆点数；未给则等于 pages.length
})

const index = ref(0)
const startX = ref(0)
const dx = ref(0)
const dragging = ref(false)

const total = computed(() => props.dots || props.pages.length)
const page = computed(() => props.pages[Math.min(index.value, props.pages.length - 1)] || {})

function onDown(e) {
  dragging.value = true
  startX.value = e.touches ? e.touches[0].clientX : e.clientX
  dx.value = 0
}
function onMove(e) {
  if (!dragging.value) return
  const x = e.touches ? e.touches[0].clientX : e.clientX
  dx.value = x - startX.value
}
function onUp() {
  if (!dragging.value) return
  dragging.value = false
  const threshold = 32
  if (dx.value < -threshold) next()
  else if (dx.value > threshold) prev()
  dx.value = 0
}
function next() {
  if (index.value < total.value - 1) index.value += 1
}
function prev() {
  if (index.value > 0) index.value -= 1
}
</script>

<template>
  <div
    class="acc-illus"
    data-testid="acc-carousel"
    @touchstart.passive="onDown"
    @touchmove.passive="onMove"
    @touchend="onUp"
    @mousedown="onDown"
    @mousemove="onMove"
    @mouseup="onUp"
    @mouseleave="onUp"
  >
    <img
      v-if="page.src"
      :src="page.src"
      class="acc-illus-img"
      alt=""
      draggable="false"
      :style="{ transform: `translateX(${dx * 0.18}px)`, transition: dragging ? 'none' : 'transform .18s ease' }"
    />
    <div class="acc-illus-title">{{ page.title }}</div>
    <div v-if="page.desc" class="acc-illus-desc">{{ page.desc }}</div>

    <div v-if="total > 1" class="acc-dots">
      <span
        v-for="n in total"
        :key="n"
        class="acc-dot"
        :class="{ 'is-active': n - 1 === index }"
      ></span>
    </div>
  </div>
</template>
