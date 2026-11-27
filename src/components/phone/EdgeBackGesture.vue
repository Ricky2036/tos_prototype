<script setup>
import { shallowRef, watch } from 'vue'
import { clamp, createVelocityTracker } from '../../utils/math'

const props = defineProps({
  surface: { type: Object, default: null },
  target: { type: String, default: null },
  showBubble: Boolean
})
const emit = defineEmits(['back'])

const EDGE_WIDTH = 22
const TOP_INSET = 64
const BOTTOM_INSET = 80
const SLOP = 8
const TRIGGER_DISTANCE = 29
const FLICK_DISTANCE = 26
const FLICK_VELOCITY = 0.5

const edgeStyle = {
  width: `${EDGE_WIDTH}px`,
  top: `${TOP_INSET}px`,
  bottom: `${BOTTOM_INSET}px`
}
const visual = shallowRef(null)
const velocity = createVelocityTracker()
let drag = null
let suppressClick = false

function start(event) {
  if (drag) {
    if (event.pointerType === 'touch' && !event.isPrimary) finish(false)
    return
  }
  suppressClick = false
  if (!props.target || !event.isPrimary || event.button !== 0) return

  const rect = props.surface.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const width = props.surface.offsetWidth
  const height = props.surface.offsetHeight
  const scaleX = width / rect.width
  const scaleY = height / rect.height
  const x = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY
  if (y < TOP_INSET || y > height - BOTTOM_INSET) return
  if (x < 0 || x > width || (x > EDGE_WIDTH && x < width - EDGE_WIDTH)) return

  const side = x <= EDGE_WIDTH ? 'left' : 'right'
  drag = {
    id: event.pointerId,
    target: props.target,
    side,
    direction: side === 'left' ? 1 : -1,
    startX: event.clientX,
    startY: event.clientY,
    scaleX,
    scaleY,
    y,
    height,
    distance: 0,
    inward: false,
    captured: false
  }
  velocity.reset()
  velocity.add(0)
  window.addEventListener('pointermove', move, true)
  window.addEventListener('pointerup', release, true)
  window.addEventListener('pointercancel', cancel, true)
  window.addEventListener('touchmove', preventNativeSwipe, { capture: true, passive: false })
  window.addEventListener('blur', abort)
}

function distanceFrom(event) {
  return (event.clientX - drag.startX) * drag.scaleX * drag.direction
}

function move(event) {
  if (event.pointerId !== drag?.id) return
  if (event.pointerType === 'mouse' && event.buttons === 0) {
    finish(false)
    return
  }
  const distance = distanceFrom(event)
  const dy = (event.clientY - drag.startY) * drag.scaleY

  if (!drag.captured) {
    if (distance <= -SLOP || (Math.abs(dy) >= SLOP && Math.abs(dy) >= distance)) {
      finish(false)
      return
    }
    if (distance < SLOP || distance < Math.abs(dy) * 1.2) return
    drag.captured = true
    suppressClick = true
  }

  if (distance !== drag.distance) drag.inward = distance > drag.distance
  drag.distance = distance
  velocity.add(distance)
  if (props.showBubble) {
    const reveal = clamp(distance / 17, 0, 1)
    const thresholdProgress = clamp((distance - 18) / (TRIGGER_DISTANCE - 18), 0, 1)
    // The native outline narrows slightly as the arrow changes to the armed state.
    const body = reveal * (1 - 0.046 * thresholdProgress)
    const extension = 0.046 * clamp((distance - 77) / 102, 0, 1) ** 4
    visual.value = {
      side: drag.side,
      y: clamp(drag.y + clamp(dy * 0.24, -20, 20), TOP_INSET, drag.height - BOTTOM_INSET) - TOP_INSET,
      stretch: body + extension,
      opacity: clamp(distance / 16, 0, 1),
      arrow: clamp((distance - SLOP) / 8, 0, 1),
      armed: distance >= TRIGGER_DISTANCE,
      exit: null
    }
  }
  if (event.cancelable) event.preventDefault()
  event.stopPropagation()
}

function preventNativeSwipe(event) {
  // Keep native vertical scrolling available until a horizontal drag wins.
  if (drag?.captured && event.touches.length === 1 && event.cancelable) event.preventDefault()
}

function release(event) {
  if (event.pointerId !== drag?.id) return
  const distance = distanceFrom(event)
  const flick = drag.inward && distance >= drag.distance &&
    distance >= FLICK_DISTANCE && velocity.velocity() >= FLICK_VELOCITY
  finish(drag.captured && (distance >= TRIGGER_DISTANCE || flick))
}

function cancel(event) {
  if (event.pointerId === drag?.id) finish(false)
}

function abort() {
  finish(false)
  visual.value = null
}

function finish(commit) {
  const captured = drag?.captured
  const target = drag?.target
  drag = null
  window.removeEventListener('pointermove', move, true)
  window.removeEventListener('pointerup', release, true)
  window.removeEventListener('pointercancel', cancel, true)
  window.removeEventListener('touchmove', preventNativeSwipe, true)
  window.removeEventListener('blur', abort)
  if (captured && visual.value?.opacity) {
    visual.value = { ...visual.value, exit: commit ? 'confirmed' : 'cancelled' }
  } else if (captured) {
    visual.value = null
  }
  if (commit) emit('back', target)
}

function clearExit(event) {
  if (!event.pseudoElement && visual.value?.exit) visual.value = null
}

function onClick(event) {
  if (!suppressClick || event.detail === 0) return
  suppressClick = false
  event.preventDefault()
  event.stopPropagation()
}

watch(() => props.surface, (surface, _, onCleanup) => {
  if (!surface) return
  surface.addEventListener('pointerdown', start, true)
  surface.addEventListener('click', onClick, true)
  onCleanup(() => {
    surface.removeEventListener('pointerdown', start, true)
    surface.removeEventListener('click', onClick, true)
    abort()
  })
}, { immediate: true })

watch(() => props.target, () => {
  if (drag) abort()
})
</script>

<template>
  <div
    v-for="side in ['left', 'right']"
    :key="side"
    class="side-edge"
    :class="`side-edge--${side}`"
    :style="edgeStyle"
    aria-hidden="true"
  >
    <div
      v-if="visual?.side === side"
      class="edge-back-bubble"
      :class="{ 'is-armed': visual.armed, 'is-leaving': visual.exit, 'is-confirmed': visual.exit === 'confirmed' }"
      :data-side="side"
      data-testid="edge-back-bubble"
      :style="{
        top: `${visual.y}px`,
        '--stretch': visual.stretch,
        '--bubble-opacity': visual.opacity,
        '--arrow-opacity': visual.arrow
      }"
      @animationend.self="clearExit"
    >
      <span class="edge-back-chevron"></span>
    </div>
  </div>
</template>

<style scoped>
.side-edge {
  position: absolute;
  z-index: var(--z-home-indicator);
  pointer-events: none;
}

.side-edge--left { left: 0; }
.side-edge--right { right: 0; }

.edge-back-bubble {
  --exit-duration: 180ms;
  --exit-easing: cubic-bezier(0.25, 0.72, 0.32, 1);
  position: absolute;
  left: 0;
  width: 29.8px;
  height: 128.32px;
  transform: translateY(-50%);
  opacity: var(--bubble-opacity);
}

.side-edge--right .edge-back-bubble {
  --arrow-direction: -1;
  left: auto;
  right: 0;
  transform: translateY(-50%) scaleX(-1);
}

.edge-back-bubble::before {
  content: '';
  position: absolute;
  inset: 0;
  /* Infinix X6878, 1208px reference frame normalized to the 360px canvas. */
  clip-path: path('M 0 3.77 C 0 22.73 29.8 40.24 29.8 64.16 C 29.8 88.08 0 105.59 0 124.55 Z');
  background: #333;
  transform: scaleX(var(--stretch));
  transform-origin: left center;
  transition: clip-path 90ms ease-out;
}

.edge-back-bubble.is-armed::before {
  clip-path: path('M 0 0 C 0 19.85 29.8 38.83 29.8 64.16 C 29.8 89.49 0 108.47 0 128.32 Z');
}

.edge-back-chevron {
  position: absolute;
  top: 50%;
  left: 0;
  width: 9.83px;
  height: 16.09px;
  background: #d8d8d8;
  clip-path: polygon(89% 11.1%, 100% 18.5%, 36% 50%, 100% 81.5%, 89% 88.9%, 0 50%);
  transform: translate(calc(14.9px * var(--stretch) - 50%), -50%) scaleX(var(--arrow-direction, 1));
  opacity: var(--arrow-opacity);
  transition: clip-path 90ms ease-out;
}

.edge-back-bubble.is-armed .edge-back-chevron {
  clip-path: polygon(73.75% 0, 89.57% 7%, 32.59% 50%, 89.57% 93%, 73.75% 100%, 10.43% 50%);
}

.edge-back-bubble.is-confirmed { --exit-duration: 125ms; }

.edge-back-bubble.is-leaving {
  animation: edge-back-fade var(--exit-duration) ease-out forwards;
}

.edge-back-bubble.is-leaving::before {
  animation: edge-back-collapse var(--exit-duration) var(--exit-easing) forwards;
}

.edge-back-bubble.is-leaving .edge-back-chevron {
  animation: edge-back-chevron-exit var(--exit-duration) var(--exit-easing) forwards;
}

@keyframes edge-back-fade { to { opacity: 0; } }
@keyframes edge-back-collapse { to { transform: scaleX(0); } }
@keyframes edge-back-chevron-exit {
  to { transform: translate(-50%, -50%) scaleX(var(--arrow-direction, 1)); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .edge-back-bubble::before,
  .edge-back-chevron { transition: none; }
  .edge-back-bubble.is-leaving { --exit-duration: 65ms; }
  .edge-back-bubble.is-leaving::before,
  .edge-back-bubble.is-leaving .edge-back-chevron { animation: none; }
}
</style>
