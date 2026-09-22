<script setup>
/**
 * 全屏音量面板：长按控制中心音量条展开。
 *
 * 动画策略（沿用原型的「插值真实外框」而不是非等比 scale）：
 * 从锚点矩形（CC 音量条）插值到终态矩形。终态尺寸不再写死 88×276 ——
 * 那是老基线（389×848、--cc-cell 88）的值，当前基线是 360×788、BASE_CELL=62，
 * 所以终态改为**运行时从锚点实测反推**：宽度取锚点宽度，高度取锚点高度的 2 倍。
 * 这样宫格整体缩放（gridScale 0.9–1.24）时也不用改代码。
 */
import { computed, nextTick, ref, watch } from 'vue'
import { useControlStore } from '../../stores/controlStore'
import { useI18nStore } from '../../stores/i18nStore'
import { VOLUME_LABELS } from '../../locales/volume.js'
import { clamp } from '../../utils/math'
import LIcon from '../ui/LIcon.vue'

const control = useControlStore()
const i18n = useI18nStore()
const vLabel = (k) => VOLUME_LABELS[i18n.locale]?.[k] ?? VOLUME_LABELS.zh[k] ?? k

const panelRef = ref(null)
const backdropRef = ref(null)
const headingRef = ref(null)
const sliderShellRef = ref(null)
let closing = false

/* 无锚点（例如从控制台直接调 openVolumePanel()）时的兜底：等于当前 CC 音量条的尺寸 */
const FALLBACK_ANCHOR = { width: 62, height: 138 }
/** 终态高度 = 锚点高度 × 2（原型的比例，保留） */
const ANCHOR_HEIGHT_RATIO = 2

const volumePct = computed(() => control.volumePlusLevel ? 100 : control.volume * 100)
const volumeDisplayPct = computed(() => control.volumePlusLevel
  ? control.volumePlusLevel * 100
  : Math.round(control.volume * 100)
)
const volumePlusActive = computed(() => control.volumePlusLevel > 0)
const vTitle = computed(() => vLabel('panelTitle'))

function sliderPointer(e) {
  e.stopPropagation()
  const track = e.currentTarget
  const startY = e.clientY
  let moved = false
  const setFromEvent = (ev) => {
    const r = track.getBoundingClientRect()
    control.setVolume(clamp((r.bottom - ev.clientY) / r.height, 0, 1))
  }
  const move = (ev) => {
    if (Math.abs(ev.clientY - startY) > 5) moved = true
    if (moved) setFromEvent(ev)
  }
  const cleanup = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', cleanup)
    window.removeEventListener('pointercancel', cleanup)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', cleanup)
  window.addEventListener('pointercancel', cleanup)
}

/** 面板自身的「屏幕 px → 本地 CSS px」换算比（舞台缩放会改变它） */
function panelScales(panel) {
  const r = panel.getBoundingClientRect()
  return {
    scaleX: r.width ? panel.clientWidth / r.width : 1,
    scaleY: r.height ? panel.clientHeight / r.height : 1
  }
}

function transitionBoxes() {
  const panel = panelRef.value
  if (!panel) return null
  const { scaleX, scaleY } = panelScales(panel)
  const panelRect = panel.getBoundingClientRect()
  const finalBox = finalVolumeBox(panel)
  const anchor = control.volumePanelAnchor
  if (!anchor) return { anchorBox: finalBox, finalBox }
  return {
    anchorBox: {
      left: (anchor.x - panelRect.x) * scaleX,
      top: (anchor.y - panelRect.y) * scaleY,
      width: anchor.width * scaleX,
      height: anchor.height * scaleY
    },
    finalBox
  }
}

function finalVolumeBox(panel) {
  const { scaleX, scaleY } = panelScales(panel)
  const a = control.volumePanelAnchor || FALLBACK_ANCHOR
  const width = Math.round((a.width || FALLBACK_ANCHOR.width) * scaleX)
  const height = Math.round((a.height || FALLBACK_ANCHOR.height) * scaleY * ANCHOR_HEIGHT_RATIO)
  return {
    left: (panel.clientWidth - width) / 2,
    top: (panel.clientHeight - height) / 2,
    width,
    height
  }
}

function applyBox(element, box) {
  element.style.left = `${box.left}px`
  element.style.top = `${box.top}px`
  element.style.width = `${box.width}px`
  element.style.height = `${box.height}px`
}

function animateOpen() {
  const boxes = transitionBoxes()
  const backdrop = backdropRef.value
  const heading = headingRef.value
  const shell = sliderShellRef.value
  if (!boxes || !backdrop || !heading || !shell) return

  backdrop.style.transition = 'none'
  backdrop.style.opacity = '0'
  heading.style.transition = 'none'
  heading.style.opacity = '0'
  heading.style.transform = 'translateX(-50%) translate3d(0, 12px, 0)'
  shell.style.transition = 'none'
  applyBox(shell, boxes.anchorBox)

  requestAnimationFrame(() => requestAnimationFrame(() => {
    backdrop.style.transition = 'opacity 360ms cubic-bezier(0.2, 0.8, 0.2, 1)'
    backdrop.style.opacity = '1'
    heading.style.transition = 'opacity 280ms ease-out 100ms, transform 280ms ease-out 100ms'
    heading.style.opacity = '1'
    heading.style.transform = 'translateX(-50%) translate3d(0, 0, 0)'
    shell.style.transition = 'left 440ms cubic-bezier(0.22, 0.82, 0.18, 1), top 440ms cubic-bezier(0.22, 0.82, 0.18, 1), width 440ms cubic-bezier(0.22, 0.82, 0.18, 1), height 440ms cubic-bezier(0.22, 0.82, 0.18, 1)'
    applyBox(shell, boxes.finalBox)
  }))
}

function closePanel() {
  if (closing) return
  closing = true
  const boxes = transitionBoxes()
  const backdrop = backdropRef.value
  const heading = headingRef.value
  const shell = sliderShellRef.value
  if (!boxes || !backdrop || !heading || !shell) {
    control.closeVolumePanel()
    closing = false
    return
  }

  backdrop.style.transition = 'opacity 220ms ease-out'
  backdrop.style.opacity = '0'
  heading.style.transition = 'opacity 160ms ease-out, transform 160ms ease-out'
  heading.style.opacity = '0'
  heading.style.transform = 'translateX(-50%) translate3d(0, 10px, 0)'
  // 直接插值真实外框，不再用非等比 scale 压缩圆角。
  shell.getBoundingClientRect()
  shell.style.transition = 'left 420ms cubic-bezier(0.33, 0, 0.67, 1), top 420ms cubic-bezier(0.33, 0, 0.67, 1), width 420ms cubic-bezier(0.33, 0, 0.67, 1), height 420ms cubic-bezier(0.33, 0, 0.67, 1)'
  applyBox(shell, boxes.anchorBox)

  window.setTimeout(() => {
    control.closeVolumePanel()
    closing = false
  }, 440)
}

watch(
  () => control.volumePanelOpen,
  async (open) => {
    if (!open) return
    closing = false
    await nextTick()
    animateOpen()
  }
)
</script>

<template>
  <div
    v-if="control.volumePanelOpen"
    ref="panelRef"
    class="volume-panel"
    data-testid="volume-panel"
  >
    <div ref="backdropRef" class="vp-backdrop" @click="closePanel"></div>
    <div ref="headingRef" class="vp-heading">
      <span :data-muted="control.volume === 0 && !volumePlusActive" data-testid="fullscreen-volume-icon">
        <LIcon :name="control.volume === 0 && !volumePlusActive ? 'volumeX' : 'volume2'" :size="30" :stroke-width="2.5" />
      </span>
      <span>{{ vTitle }}</span>
    </div>

    <div ref="sliderShellRef" class="vp-slider-shell">
      <div
        class="vp-slider"
        :class="{
          'is-plus': volumePlusActive,
          'plus-200': control.volumePlusLevel === 2,
          'plus-300': control.volumePlusLevel === 3,
          'plus-500': control.volumePlusLevel === 5
        }"
        data-testid="fullscreen-volume-slider"
        @pointerdown="sliderPointer"
      >
        <div class="vp-fill" :style="{ height: volumePct + '%' }"></div>
        <div v-if="volumePlusActive" class="vp-plus-gradient" aria-hidden="true"></div>
        <div v-if="volumePlusActive" class="vp-value" data-testid="fullscreen-volume-value">
          {{ volumeDisplayPct }}%
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.volume-panel {
  position: absolute;
  inset: 0;
  z-index: var(--z-volume-panel);
  color: #fff;
}

.vp-backdrop {
  position: absolute;
  inset: 0;
  /* ⚠️ 2026-09-20：原来是**深蓝**幕布 rgba(5,29,55,.28) + blur(28px) saturate(135%)。
     蓝底 + >100% 的饱和会把整屏连同上头的白条一起染成蓝灰 ⇒ 这是「玻璃背景颜色很奇怪」的来源之一。
     现在：底色改**中性黑**（去掉蓝），但**保留自己的模糊配方**、不套白条的 `--glass-white-blur`
     —— 幕布不是「白玻璃条」，它要让背后的壁纸仍然好看；
     白条要去饱和是因为它自己就是白的（见 tokens.css），幕布没这个诉求。
     实测：以前白条 α 只有 .18 时幕布的蓝会主导观感；现在白条 α .74，幕布只贡献 26%，
     所以幕布保持有彩色即可，白条照样是白的。 */
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(28px) saturate(130%);
  -webkit-backdrop-filter: blur(28px) saturate(130%);
}

.vp-heading {
  position: absolute;
  top: calc(50% - 205px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font: 500 13px/1 var(--font-stack);
  text-shadow: none;
}

.vp-slider-shell {
  position: absolute;
  left: calc(50% - 31px);
  top: calc(50% - 138px);
  /* 初始值只是首帧占位；真正的锚点/终态由 applyBox() 逐帧写入
     （宽度 = CC 音量条宽度，高度 = 2 × 音量条高度）。 */
  width: 62px;
  height: 276px;
  will-change: left, top, width, height;
  contain: layout paint;
}

.vp-slider {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 999px;
  /* 平时**无描边**（Ricky 2026-09-20：去掉大小音量条多余的描边）。
     保留 1px **透明**边框占位：Plus 态只改 border-color 就能点出琥珀环，
     而 overflow:hidden 会把子元素裁在 padding box 内 ⇒ 白 fill 铺满也盖不掉那圈环。
     （顺带去掉了顶部 1px inset 白色高光 —— 它也是一道「描边」。） */
  border: none;
  background: var(--glass-white-bar);
  cursor: pointer;
  touch-action: none;
  will-change: contents;
  backface-visibility: hidden;
  contain: paint;
}

.vp-slider.is-plus::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 5;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgba(255, 190, 92, 0.78);
  pointer-events: none;
}
.vp-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.92);
  transition: height 100ms ease-out;
}
.vp-plus-gradient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background 220ms ease;
}
.vp-slider.plus-200 .vp-plus-gradient {
  background: linear-gradient(to top, rgba(253, 186, 116, 0) 0%, rgba(253, 186, 116, 0.42) 52%, rgba(251, 146, 60, 1) 100%);
}
.vp-slider.plus-300 .vp-plus-gradient {
  background: linear-gradient(to top, rgba(251, 146, 60, 0) 0%, rgba(251, 146, 60, 0.5) 52%, rgba(249, 115, 22, 1) 100%);
}
.vp-slider.plus-500 .vp-plus-gradient {
  background: linear-gradient(to top, rgba(249, 115, 22, 0) 0%, rgba(234, 88, 12, 0.58) 52%, rgba(194, 65, 12, 1) 100%);
}
.vp-value {
  position: absolute;
  top: 30px;
  left: 0;
  right: 0;
  text-align: center;
  color: #fff7ed;
  font: 800 18px/1 var(--font-stack);
  text-shadow: none;
  pointer-events: none;
}
</style>
