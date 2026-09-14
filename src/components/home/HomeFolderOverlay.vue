<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { getApp } from '../../config/apps'
import { rectRelativeToScreen } from '../../utils/dom.js'
import AppIcon from '../ui/AppIcon.vue'

const props = defineProps({
  folder: { type: Object, required: true },
  origin: { type: Object, default: null }
})
const emit = defineEmits(['close', 'rename', 'app-pointerdown', 'launch-app', 'transition-finished'])

const backdropRef = ref(null)
const panelRef = ref(null)
const titleRef = ref(null)
const iconRefs = new Map()
const phase = ref('measuring')
const iconMotions = new Map()
const panelMotion = reactive({ dx: 0, dy: 0, sx: 0.2, sy: 0.2, startRadius: 100 })
let closeTimer = null

const setIconRef = (id, el) => {
  if (el) iconRefs.set(id, el)
  else iconRefs.delete(id)
}

const rectTransform = (from, to) => (!from || !to?.width || !to?.height)
  ? { x: 0, y: 0, sx: 0.2, sy: 0.2 }
  : { x: from.left - to.left, y: from.top - to.top, sx: from.width / to.width, sy: from.height / to.height }

function getShellFallback() {
  const screen = panelRef.value?.closest('.screen-view') || document.querySelector('.screen-view')
  const desktopFolder = screen?.querySelector?.(`[data-home-item="folder:${props.folder.id}"] [data-folder-shell]`)
    || screen?.querySelector?.(`[data-folder-id="${props.folder.id}"] [data-folder-shell]`)
    || screen?.querySelector?.('.home-folder [data-folder-shell]')
  if (desktopFolder && screen) {
    const r = rectRelativeToScreen(desktopFolder, screen)
    if (r && r.width > 0 && r.height > 0) return r
  }
  const sw = screen?.offsetWidth || (typeof window !== 'undefined' ? window.innerWidth : 390)
  const sh = screen?.offsetHeight || (typeof window !== 'undefined' ? window.innerHeight : 844)
  return { left: sw / 2 - 30, top: sh / 2 - 30, width: 60, height: 60, x: sw / 2 - 30, y: sh / 2 - 30 }
}

function getIconKeyframes(motion, isClosing) {
  const { cx, cy, targetScale, hasMini } = motion
  const steps = 16
  const keyframes = []
  const sx = panelMotion.sx
  const sy = panelMotion.sy

  for (let i = 0; i <= steps; i++) {
    const p = isClosing ? (i / steps) : (1 - i / steps)
    const px = 1 + (sx - 1) * p
    const py = 1 + (sy - 1) * p
    const totScale = 1 + (targetScale - 1) * p
    const csx = px > 0.001 ? (totScale / px) : 1
    const csy = py > 0.001 ? (totScale / py) : 1
    const stepX = cx * p
    const stepY = cy * p
    const opacity = hasMini ? 1 : (isClosing ? Math.max(0, 1 - p * 1.5) : Math.min(1, (1 - p) * 1.5))
    keyframes.push({
      transform: `translate3d(${stepX}px, ${stepY}px, 0) scale(${csx}, ${csy})`,
      opacity
    })
  }
  return keyframes
}

function prepareMotion() {
  if (!panelRef.value) return
  const screen = panelRef.value.closest('.screen-view') || document.querySelector('.screen-view')
  const fallback = props.origin?.shellRect || getShellFallback()
  const from = (props.origin?.shellRect && props.origin.shellRect.width > 0) ? props.origin.shellRect : fallback
  const to = screen ? rectRelativeToScreen(panelRef.value, screen) : panelRef.value.getBoundingClientRect()
  if (!to || !to.width || !to.height) return

  const sx = from.width / to.width
  const sy = from.height / to.height
  const dx = from.left - to.left
  const dy = from.top - to.top
  const isLarge = (props.folder?.width > 1 || props.folder?.height > 1) || (from?.width || 0) > 80
  const baseRadius = isLarge ? 22 : 17
  const startRadius = Math.round(baseRadius / Math.min(sx, sy))

  panelMotion.dx = dx
  panelMotion.dy = dy
  panelMotion.sx = sx
  panelMotion.sy = sy
  panelMotion.startRadius = startRadius

  iconMotions.clear()
  for (const [appId, iconEl] of iconRefs) {
    if (!iconEl) continue
    const _t = rectTransform(props.origin?.iconRects?.[appId] || fallback, iconEl.getBoundingClientRect())
    const tileEl = iconEl.querySelector('.app-icon-anchor') || iconEl
    const tileRect = screen ? rectRelativeToScreen(tileEl, screen) : tileEl.getBoundingClientRect()
    const iconElRect = screen ? rectRelativeToScreen(iconEl, screen) : iconEl.getBoundingClientRect()
    const miniRect = props.origin?.iconRects?.[appId]

    let cx = 0
    let cy = 0
    let targetScale = 0.2

    const openCenterX = tileRect.left + tileRect.width / 2
    const openCenterY = tileRect.top + tileRect.height / 2

    if (miniRect && miniRect.width > 0 && miniRect.height > 0) {
      const miniCenterX = miniRect.left + miniRect.width / 2
      const miniCenterY = miniRect.top + miniRect.height / 2
      cx = (miniCenterX - from.left) / sx - (openCenterX - to.left)
      cy = (miniCenterY - from.top) / sy - (openCenterY - to.top)
      targetScale = miniRect.width / tileRect.width
    } else {
      cx = (from.width * 0.5) / sx - (openCenterX - to.left)
      cy = (from.height * 0.5) / sy - (openCenterY - to.top)
      targetScale = 0.2
    }

    const originX = Math.round(tileRect.left - iconElRect.left + tileRect.width / 2)
    const originY = Math.round(tileRect.top - iconElRect.top + tileRect.height / 2)
    iconEl.style.transformOrigin = `${originX}px ${originY}px`

    iconMotions.set(appId, { cx, cy, targetScale, hasMini: Boolean(miniRect) })
  }

  phase.value = 'opening'

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  const dur = prefersReduced ? 1 : 320
  const easeOpen = 'cubic-bezier(0.2, 0.9, 0.25, 1)'

  backdropRef.value?.animate([
    { opacity: 0 },
    { opacity: 1 }
  ], {
    duration: dur,
    easing: easeOpen,
    fill: 'forwards'
  })

  titleRef.value?.animate([
    { opacity: 0, transform: 'translateY(-8px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], {
    duration: Math.min(dur, 220),
    delay: prefersReduced ? 0 : 70,
    easing: easeOpen,
    fill: 'forwards'
  })

  for (const [appId, iconEl] of iconRefs) {
    const motion = iconMotions.get(appId)
    if (!motion || !iconEl) continue

    iconEl.animate(getIconKeyframes(motion, false), {
      duration: dur,
      easing: easeOpen,
      fill: 'forwards'
    })

    const label = iconEl.querySelector('.icon-label')
    label?.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], {
      duration: Math.min(dur, 200),
      delay: prefersReduced ? 0 : 80,
      easing: easeOpen,
      fill: 'forwards'
    })
  }

  const openAnim = panelRef.value?.animate([
    {
      transform: `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`,
      borderRadius: `${startRadius}px`,
      boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
      borderColor: 'rgba(255, 255, 255, 0)'
    },
    {
      transform: 'translate3d(0, 0, 0) scale(1, 1)',
      borderRadius: '36px',
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.32)'
    }
  ], {
    duration: dur,
    easing: easeOpen,
    fill: 'forwards'
  })

  const finishOpen = () => {
    phase.value = 'open'
    if (backdropRef.value) backdropRef.value.style.opacity = '1'
    emit('transition-finished', 'open')
  }

  if (openAnim) {
    openAnim.onfinish = finishOpen
  } else {
    finishOpen()
  }
}

function close() {
  if (phase.value === 'closing' || phase.value === 'launching') return
  if (!panelMotion.dx && !panelMotion.dy && (!panelMotion.sx || panelMotion.sx === 1 || panelMotion.sx === 0.2)) {
    prepareMotion()
  }
  phase.value = 'closing'
  clearTimeout(closeTimer)

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  const dur = prefersReduced ? 1 : 260
  const easeClose = 'cubic-bezier(0.25, 1, 0.5, 1)'
  const easeBackdropClose = 'cubic-bezier(0.33, 0, 0.67, 1)'

  if (backdropRef.value) backdropRef.value.style.opacity = ''
  backdropRef.value?.animate([
    { opacity: 1 },
    { opacity: 0 }
  ], {
    duration: dur,
    easing: easeBackdropClose,
    fill: 'forwards'
  })

  titleRef.value?.animate([
    { opacity: 1, transform: 'translateY(0)' },
    { opacity: 0, transform: 'translateY(-6px)' }
  ], {
    duration: Math.min(dur, 120),
    easing: 'ease-out',
    fill: 'forwards'
  })

  for (const [appId, iconEl] of iconRefs) {
    const motion = iconMotions.get(appId)
    if (!motion || !iconEl) continue

    iconEl.animate(getIconKeyframes(motion, true), {
      duration: dur,
      easing: easeClose,
      fill: 'forwards'
    })

    const label = iconEl.querySelector('.icon-label')
    label?.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], {
      duration: Math.min(dur, 100),
      easing: 'ease-out',
      fill: 'forwards'
    })
  }

  const closeAnim = panelRef.value?.animate([
    {
      transform: 'translate3d(0, 0, 0) scale(1, 1)',
      borderRadius: '36px',
      boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.32)'
    },
    {
      transform: `translate3d(${panelMotion.dx}px, ${panelMotion.dy}px, 0) scale(${panelMotion.sx}, ${panelMotion.sy})`,
      borderRadius: `${panelMotion.startRadius}px`,
      boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
      borderColor: 'rgba(255, 255, 255, 0)'
    }
  ], {
    duration: dur,
    easing: easeClose,
    fill: 'forwards'
  })

  const finishClose = () => {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
    emit('transition-finished', 'closed')
    emit('close')
  }

  if (closeAnim) {
    closeAnim.onfinish = finishClose
  }
  closeTimer = setTimeout(finishClose, dur + 40)
}

function launch(appId, anchor) {
  if (phase.value !== 'open') return
  phase.value = 'launching'
  backdropRef.value?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' })
  panelRef.value?.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(0.96)', opacity: 0.2 }
  ], { duration: 160, fill: 'forwards' })
  emit('launch-app', appId, anchor)
}

function onOverlayClick(event) {
  if (!event.target.closest('.folder-panel-app,.folder-title')) close()
}

onMounted(prepareMotion)
onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer)
})
</script>

<template>
  <div class="folder-overlay" :class="`phase-${phase}`" @pointerdown.stop @click="onOverlayClick">
    <div ref="backdropRef" class="folder-backdrop"></div>
    <div ref="panelRef" class="folder-panel">
      <input
        ref="titleRef"
        class="folder-title"
        :value="folder.name"
        maxlength="24"
        aria-label="文件夹名称"
        @change="emit('rename', $event.target.value)"
      />
      <div class="folder-content">
        <div
          v-for="appId in folder.appIds"
          :key="appId"
          :ref="el => setIconRef(appId, el)"
          class="folder-panel-app"
          :data-folder-app="appId"
          @pointerdown="emit('app-pointerdown', $event, appId)"
          @click.stop="launch(appId,$event.currentTarget.querySelector('.app-icon-anchor'))"
        >
          <AppIcon :app="getApp(appId)" :launch-on-click="false" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.folder-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  background:transparent;
}
.folder-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(15, 18, 30, 0.22);
  backdrop-filter: blur(28px) saturate(130%);
  -webkit-backdrop-filter: blur(28px) saturate(130%);
  pointer-events: none;
  opacity: 0;
  will-change: opacity;
}
.phase-open .folder-backdrop {
  opacity: 1;
}
.folder-panel {
  position: relative;
  z-index: 1;
  width: calc(100% - 36px);
  min-height: 360px;
  padding: 24px 18px 28px;
  box-sizing: border-box;
  border-radius: 36px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(28px) saturate(130%);
  -webkit-backdrop-filter: blur(28px) saturate(130%);
  border: 1px solid rgba(255, 255, 255, 0.32);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  transform-origin: 0 0;
  will-change: transform, border-radius;
}
.folder-title {
  display: block;
  width: 70%;
  margin: 0 auto 24px;
  padding: 4px 0 6px;
  border: 0;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  background:transparent;
  color: #fff;
  text-align: center;
  font: 600 20px/1.2 var(--font-stack);
  outline: none;
}
.folder-title:focus {
  border-bottom-color: rgba(255, 255, 255, 0.5);
}
.folder-content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px 16px;
  justify-items: center;
}
.folder-panel-app {
  touch-action: none;
  will-change: transform, opacity;
}
.folder-panel-app :deep(.app-icon) {
  aspect-ratio: 1 !important;
}
.folder-panel-app :deep(.icon-tile),
.folder-panel-app :deep(.app-icon-anchor) {
  aspect-ratio: 1 !important;
  flex: none !important;
}
.folder-panel-app :deep(.icon-label) {
  will-change: opacity;
}
.phase-measuring {
  visibility: hidden;
}
.phase-launching {
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .folder-overlay,
  .folder-backdrop,
  .folder-panel,
  .folder-title,
  .folder-panel-app {
    transition-duration: 1ms !important;
    animation-duration: 1ms !important;
  }
}
</style>

