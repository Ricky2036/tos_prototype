<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useControlStore, FLASHLIGHT_MAX_HALF_ANGLE } from '../../stores/controlStore'
import { useSpring } from '../../composables/useSpring'
import brightnessGuideIcon from '../../assets/icons/brightness/flashlight-guide.svg'

const control = useControlStore()
const panel = ref(null)
const lampAnimationReady = ref(false)
const panelEnterReady = ref(false)
const guidanceReady = computed(() => lampAnimationReady.value && panelEnterReady.value)
watch(() => control.flashlightLamps.front, (available) => {
  if (!available) control.frontFlashlightOn = false
})
const beamModeAvailable = new URLSearchParams(window.location.search).get('flashlight') !== 'brightness-only'
const beamEnabled = computed(() => beamModeAvailable && control.flashlightLamps.highBeam)
const level = computed(() => control.flashlight ? control.flashlightBrightness : 0)
const beam = computed(() => control.flashlightBeam)
const animatedBeam = useSpring(beam.value)
const spread = computed(() => beamModeAvailable ? Math.max(0, Math.min(1, animatedBeam.value.value)) : 0.5)
const dragging = ref(false)
const sourceHalfWidth = ref(16.5)
const opticsHeight = ref(380)
let opticsObserver
const { value: animatedLevel, snapTo, animateTo } = useSpring(0)
const heightPull = useSpring(0)
const widthPull = useSpring(0)
const reboundConfig = { mass: 1, tension: 360, friction: 24 }
watch(beamEnabled, (enabled, wasEnabled) => {
  widthPull.snapTo(0)
  if (wasEnabled && !enabled) {
    control.setFlashlightBeam(1)
    if (gesture) gesture.beam = 1
  }
})
function rubberBand(excess, limit) {
  return Math.sign(excess) * limit * (1 - Math.exp(-Math.abs(excess) / (limit * 3)))
}
function resetBoundaryPull() {
  heightPull.snapTo(0)
  widthPull.snapTo(0)
}
const visualLevel = computed(() => Math.max(0, Math.min(1, animatedLevel.value)))
// Low output stays visibly dim. A narrow beam concentrates light in its center.
const beamEnergy = computed(() => Math.pow(visualLevel.value, 1.15))
const focusStrength = computed(() => Math.pow(1 - spread.value, 0.85))
const lightStyle = computed(() => ({
  '--beam-intensity': Math.min(1, beamEnergy.value * (1.43 - spread.value * 0.56) * (1 + 0.5 * focusStrength.value) * (1 + 0.4 * visualLevel.value ** 3)),
  '--beam-spill': Math.pow(visualLevel.value, 0.85) * (0.9 - spread.value * 0.1),
  '--beam-core': Math.min(1, beamEnergy.value * (0.96 - spread.value * 0.56) * (1 + 0.7 * focusStrength.value) * 1.2),
  '--beam-fringe': 0.25 + spread.value * 0.15
}))
let gesture
let upperTap

const lensY = 300
const sourceY = lensY - 3
const maxReach = 185
const maxArcY = lensY - 12 - maxReach
const limitArcBow = 58
const limitArcTopRatio = (maxArcY - limitArcBow / 2) / 380
const minHalfWidth = 25
const maxHalfWidth = 166
// Crop a continuous parabola at each beam width. Only the narrowest
// indicator flattens, blending back into the curve without a central plateau.
function guideRise(halfWidth) {
  const blend = Math.max(0, Math.min(1, (halfWidth - minHalfWidth) / 12))
  const smoothBlend = blend * blend * (3 - 2 * blend)
  return limitArcBow / 2 * (halfWidth / maxHalfWidth) ** 2 * smoothBlend
}
function guideArc(halfWidth, top) {
  const rise = guideRise(halfWidth)
  return `M ${144 - halfWidth} ${top + rise} Q 144 ${top - rise} ${144 + halfWidth} ${top + rise}`
}
function beamOutline(halfWidth, reach, bow, y = lensY - reach) {
  const source = sourceHalfWidth.value
  const shoulder = source + (halfWidth - source) * 0.76
  return `M 144 ${sourceY} C ${144 - shoulder} ${sourceY} ${144 - halfWidth * 1.02} ${y + reach * 0.25} ${144 - halfWidth} ${y}
    Q 144 ${y - bow} ${144 + halfWidth} ${y} C ${144 + halfWidth * 1.02} ${y + reach * 0.25} ${144 + shoulder} ${sourceY} 144 ${sourceY} Z`
}

const optics = computed(() => {
  const reach = 12 + visualLevel.value * maxReach + heightPull.value.value
  // Beam width describes divergence. Shorter visible reach narrows its endpoint
  // while preserving the same opening angle at every brightness.
  // Project the symmetric 0…60-degree half-angle into the available canvas.
  const halfAngle = spread.value * FLASHLIGHT_MAX_HALF_ANGLE * Math.PI / 180
  const divergence = Math.tan(halfAngle) / Math.tan(FLASHLIGHT_MAX_HALF_ANGLE * Math.PI / 180)
  const widthAtMaxReach = minHalfWidth + divergence * (maxHalfWidth - minHalfWidth) + widthPull.value.value
  const halfWidth = sourceHalfWidth.value + (widthAtMaxReach - sourceHalfWidth.value) * reach / (12 + maxReach)
  const top = lensY - reach - visualLevel.value * limitArcBow / 2
  const bow = guideRise(halfWidth) * 2
  const y = top + bow / 2
  // Residual light extends a little beyond the current guide, with its
  // visible distance growing together with output rather than staying at maximum.
  const spillReach = reach + 18 + 38 * Math.pow(visualLevel.value, 0.65)
  const spillHalfWidth = sourceHalfWidth.value + (widthAtMaxReach - sourceHalfWidth.value) * spillReach / (12 + maxReach)
  return {
    reach,
    endX: 144 + halfWidth,
    endY: y,
    softness: Math.max(0.4, reach / (12 + maxReach)),
    arc: guideArc(halfWidth, top),
    beam: beamOutline(halfWidth, reach, bow, y),
    spill: beamOutline(spillHalfWidth, spillReach, spillHalfWidth * (0.03 + spread.value * 0.13)),
    spillY: lensY - spillReach
  }
})

watch(beam, (value) => {
  if (!control.flashlightPanelOpen || (dragging.value && beamEnabled.value) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animatedBeam.snapTo(value)
  } else {
    animatedBeam.animateTo(value, { config: { mass: 1, tension: 240, friction: 32 } })
  }
})

watch(level, (value) => {
  lampAnimationReady.value = false
  if (!control.flashlightPanelOpen || dragging.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    snapTo(value)
    lampAnimationReady.value = value > 0
  } else {
    animateTo(value, {
      config: { mass: 1, tension: 280, friction: 34 },
      onDone: () => { lampAnimationReady.value = value > 0 && control.flashlight && level.value === value }
    })
  }
})

watch(() => control.flashlightPanelOpen, (open) => {
  opticsObserver?.disconnect()
  resetBoundaryPull()
  animatedBeam.snapTo(beam.value)
  if (open) {
    const opticsElement = panel.value.querySelector('.torch-optics')
    const updateSourceWidth = () => {
      sourceHalfWidth.value = 14 * 288 / opticsElement.clientWidth
      opticsHeight.value = opticsElement.clientHeight
    }
    updateSourceWidth()
    opticsObserver = new ResizeObserver(updateSourceWidth)
    opticsObserver.observe(opticsElement)
    snapTo(level.value)
    lampAnimationReady.value = level.value > 0
    panel.value?.focus({ preventScroll: true })
  } else {
    if (dragging.value) control.rememberFlashlightBrightness()
    gesture = null
    dragging.value = false
  }
}, { flush: 'post' })

// A single first-use sequence: dim by sliding down, then focus inward when supported.
const educationStep = ref(-1)
const educationTick = ref(0)
const educationSteps = computed(() => beamEnabled.value ? ['下滑调暗', '内滑聚光'] : ['下滑调暗'])
const adjustedThisOpen = ref(false)
const guidanceSessionActive = ref(false)
let educationTimer
function stopEducation() {
  clearTimeout(educationTimer)
  educationTimer = undefined
  educationStep.value = -1
}
function endGuidanceSession(dismissed = false) {
  if (dismissed && guidanceSessionActive.value) control.flashlightGuidanceSeen = true
  stopEducation()
  guidanceSessionActive.value = false
}
function queueEducation({ carry = false } = {}) {
  stopEducation()
  if (!control.flashlightPanelOpen || !control.flashlight || adjustedThisOpen.value || (!carry && control.flashlightGuidanceSeen)) return
  guidanceSessionActive.value = true
  if (!guidanceReady.value) return
  function advance() {
    if (!control.flashlightPanelOpen || !control.flashlight) { endGuidanceSession(); return }
    educationStep.value = (educationStep.value + 1) % educationSteps.value.length
    educationTick.value++
    educationTimer = setTimeout(advance, 2000)
  }
  advance()
}
watch(() => [control.flashlightPanelOpen, control.flashlight, beamEnabled.value, guidanceReady.value, control.flashlightResetRevision], ([open, on, , , resetRevision], [wasOpen, , , , previousResetRevision]) => {
  if (open && !wasOpen) adjustedThisOpen.value = false
  if (!open || !on) {
    endGuidanceSession(resetRevision === previousResetRevision)
    return
  }
  const carry = guidanceSessionActive.value && !adjustedThisOpen.value
  stopEducation()
  guidanceSessionActive.value = false
  if (!adjustedThisOpen.value) queueEducation({ carry })
})
// Reset values in place without releasing the frozen Control Center backdrop.
watch(() => control.flashlightResetRevision, () => {
  endGuidanceSession()
  adjustedThisOpen.value = false
  gesture = null
  dragging.value = false
  resetBoundaryPull()
  animatedBeam.snapTo(beam.value)
  snapTo(level.value)
  lampAnimationReady.value = level.value > 0
  queueEducation()
})
function beamContourAt(sideY) {
  const halfWidth = optics.value.endX - 144
  const shoulder = sourceHalfWidth.value + (halfWidth - sourceHalfWidth.value) * .76
  let lo = 0, hi = 1
  for (let i = 0; i < 24; i++) {
    const t = (lo + hi) / 2, u = 1 - t
    const y = u ** 3 * sourceY + 3 * u * u * t * sourceY + 3 * u * t * t * (optics.value.endY + optics.value.reach * .25) + t ** 3 * optics.value.endY
    if (y > sideY) lo = t
    else hi = t
  }
  const t = (lo + hi) / 2, u = 1 - t
  const sideHalfWidth = 3 * u * u * t * shoulder + 3 * u * t * t * halfWidth * 1.02 + t ** 3 * halfWidth
  return { left: 144 - sideHalfWidth, right: 144 + sideHalfWidth, sideY,
    centerY: optics.value.endY - guideRise(halfWidth) }
}
const educationAnchorY = computed(() => optics.value.endY + (sourceY - optics.value.endY) * .42 - 40 * 380 / opticsHeight.value)
const educationDotStyle = computed(() => ({ left: '50%', top: `${educationAnchorY.value / 380 * 100}%` }))
// Use the same 24px label offset and 15px × 1.5 line-height in every continuous step.
const continuousWidthGeometry = computed(() => beamContourAt(educationAnchorY.value + (24 + 11.25) * 380 / opticsHeight.value))

function widthEducationMotion(side) {
  return { '--width-from': '0px', '--width-to': side === 'left' ? '36px' : '-36px' }
}
function widthEducationAnchor(side) {
  return { left: `${continuousWidthGeometry.value[side] / 288 * 100}%`, top: `${continuousWidthGeometry.value.sideY / 380 * 100}%` }
}

function setTransitionOrigin(element) {
  const anchor = control.flashlightPanelAnchor
  const card = element.querySelector('.torch-scene')
  const rect = element.getBoundingClientRect()
  if (!anchor || !rect.width || !rect.height) return
  const x = (anchor.x + anchor.width / 2 - rect.x) * element.clientWidth / rect.width
  const y = (anchor.y + anchor.height / 2 - rect.y) * element.clientHeight / rect.height
  element.style.setProperty('--torch-start-x', `${x - card.offsetLeft - card.offsetWidth / 2}px`)
  element.style.setProperty('--torch-start-y', `${y - card.offsetTop - card.offsetHeight / 2}px`)
}

function start(event) {
  if (!event.isPrimary || event.button !== 0) return
  resetBoundaryPull()
  if (beamEnabled.value) {
    control.setFlashlightBeam(spread.value)
    animatedBeam.snapTo(beam.value)
  }
  const target = event.currentTarget
  target.setPointerCapture(event.pointerId)
  const bounds = panel.value.querySelector('.torch-optics').getBoundingClientRect()
  const offset = event.clientX - (bounds.left + bounds.width / 2)
  gesture = {
    pointer: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    level: level.value,
    beam: beam.value,
    side: Math.abs(offset) < 0.5 ? 0 : Math.sign(offset),
    verticalRange: bounds.height * maxReach / 380,
    horizontalRange: bounds.width * (maxHalfWidth - minHalfWidth) / 288
  }
}

function move(event) {
  if (gesture?.pointer !== event.pointerId) return
  if (event.clientX === gesture.x && event.clientY === gesture.y && !dragging.value) return
  endGuidanceSession(true)
  dragging.value = true
  adjustedThisOpen.value = true
  const dx = event.clientX - gesture.x
  const dy = gesture.y - event.clientY
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (beamEnabled.value && (dx !== 0 || beam.value !== gesture.beam)) {
    const outward = gesture.side ? dx * gesture.side : Math.abs(dx)
    const requested = gesture.beam + outward / gesture.horizontalRange
    control.setFlashlightBeam(requested)
    const excess = requested < 0 ? requested : Math.max(0, requested - 1)
    widthPull.snapTo(reduceMotion ? 0 : rubberBand(excess * (maxHalfWidth - minHalfWidth), 10))
  } else {
    widthPull.snapTo(0)
  }
  if (dy !== 0 || level.value !== gesture.level) {
    const requested = gesture.level + dy / gesture.verticalRange
    control.setFlashlightBrightness(requested, { remember: false })
    heightPull.snapTo(reduceMotion ? 0 : rubberBand(Math.max(0, requested - 1) * maxReach, 12))
  } else {
    heightPull.snapTo(0)
  }
}

function end(event) {
  if (gesture?.pointer !== event.pointerId) return
  if (event.type === 'pointerup' && dragging.value) move(event)
  if (dragging.value) control.rememberFlashlightBrightness()
  gesture = null
  dragging.value = false
  heightPull.animateTo(0, { config: reboundConfig })
  widthPull.animateTo(0, { config: reboundConfig })
}

function startUpperTap(event) {
  if (!event.isPrimary || event.button !== 0) return
  upperTap = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
}

function checkUpperTap(event) {
  if (upperTap?.pointerId !== event.pointerId) return
  if (Math.hypot(event.clientX - upperTap.x, event.clientY - upperTap.y) > 7) upperTap = null
}

function cancelUpperTap() {
  upperTap = null
}

function finishUpperTap(event) {
  checkUpperTap(event)
  if (upperTap?.pointerId !== event.pointerId) return
  cancelUpperTap()
  close()
}

function beginClose() {
  panelEnterReady.value = false
  control.flashlightTileSnapshot = null
}

function finishClose() {
  if (!control.flashlightPanelOpen) control.flashlightTileSnapshot = null
}

onBeforeUnmount(() => {
  endGuidanceSession()
  opticsObserver?.disconnect()
  if (!control.flashlightPanelOpen) control.flashlightTileSnapshot = null
})

function close() {
  endGuidanceSession(true)
  control.flashlightPanelOpen = false
}
</script>

<template>
  <Transition name="torch-panel" :duration="{ enter: 440, leave: 320 }" @before-enter="panelEnterReady = false" @enter="setTransitionOrigin" @after-enter="panelEnterReady = true" @before-leave="beginClose" @after-leave="finishClose">
    <div
      v-if="control.flashlightPanelOpen"
      ref="panel"
      class="torch-panel cc-fullscreen-panel"
      data-testid="flashlight-panel"
      role="dialog"
      aria-label="手电筒调节"
      tabindex="-1"
      :style="{ '--torch-guide-top-ratio': limitArcTopRatio }"
      @keydown.esc.stop.prevent="close"
    >
      <div class="torch-backdrop cc-fullscreen-backdrop"></div>
      <div
        class="torch-dismiss-top"
        data-testid="flashlight-dismiss-top"
        @pointerdown="startUpperTap"
        @pointermove="checkUpperTap"
        @pointerleave="cancelUpperTap"
        @pointercancel="cancelUpperTap"
        @pointerup="finishUpperTap"
      ></div>
      <div class="torch-dismiss" data-testid="flashlight-dismiss" @click="close"></div>

      <div
        class="torch-adjust"
        data-testid="flashlight-adjust"
        :class="{ dragging }"
        @pointerdown="start"
        @pointermove="move"
        @pointerup="end"
        @pointercancel="end"
        @lostpointercapture="end"
      ></div>

      <div class="torch-scene" :class="{ dragging, 'brightness-only': !beamEnabled }" :style="lightStyle">
        <svg class="torch-optics" :data-half-angle="spread * FLASHLIGHT_MAX_HALF_ANGLE" viewBox="0 0 288 380" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="torch-spill-falloff" gradientUnits="userSpaceOnUse" x1="144" :y1="sourceY" x2="144" :y2="optics.spillY">
              <stop offset="0.00" stop-color="#fff" stop-opacity="0.6800" />
              <stop offset="0.05" stop-color="#fff" stop-opacity="0.6751" />
              <stop offset="0.10" stop-color="#fff" stop-opacity="0.6610" />
              <stop offset="0.15" stop-color="#fff" stop-opacity="0.6387" />
              <stop offset="0.20" stop-color="#fff" stop-opacity="0.6093" />
              <stop offset="0.25" stop-color="#fff" stop-opacity="0.5738" />
              <stop offset="0.30" stop-color="#fff" stop-opacity="0.5331" />
              <stop offset="0.35" stop-color="#fff" stop-opacity="0.4884" />
              <stop offset="0.40" stop-color="#fff" stop-opacity="0.4406" />
              <stop offset="0.45" stop-color="#fff" stop-opacity="0.3908" />
              <stop offset="0.50" stop-color="#fff" stop-opacity="0.3400" />
              <stop offset="0.55" stop-color="#fff" stop-opacity="0.2892" />
              <stop offset="0.60" stop-color="#fff" stop-opacity="0.2394" />
              <stop offset="0.65" stop-color="#fff" stop-opacity="0.1916" />
              <stop offset="0.70" stop-color="#fff" stop-opacity="0.1469" />
              <stop offset="0.75" stop-color="#fff" stop-opacity="0.1063" />
              <stop offset="0.80" stop-color="#fff" stop-opacity="0.0707" />
              <stop offset="0.85" stop-color="#fff" stop-opacity="0.0413" />
              <stop offset="0.90" stop-color="#fff" stop-opacity="0.0190" />
              <stop offset="0.95" stop-color="#fff" stop-opacity="0.0049" />
              <stop offset="1.00" stop-color="#fff" stop-opacity="0.0000" />
            </linearGradient>
            <filter id="torch-spill-softness" x="-.35" y="-.25" width="1.7" height="1.5">
              <feGaussianBlur stdDeviation="12 5" />
            </filter>
            <linearGradient id="torch-falloff" gradientUnits="userSpaceOnUse" x1="144" :y1="sourceY" x2="144" :y2="optics.endY">
              <stop offset="0.00" stop-color="#fff" :stop-opacity="Math.pow(1.0000, 1 - 0.28 * focusStrength)" />
              <stop offset="0.05" stop-color="#fff" :stop-opacity="Math.pow(0.9949, 1 - 0.28 * focusStrength)" />
              <stop offset="0.10" stop-color="#fff" :stop-opacity="Math.pow(0.9803, 1 - 0.28 * focusStrength)" />
              <stop offset="0.15" stop-color="#fff" :stop-opacity="Math.pow(0.9571, 1 - 0.28 * focusStrength)" />
              <stop offset="0.20" stop-color="#fff" :stop-opacity="Math.pow(0.9260, 1 - 0.28 * focusStrength)" />
              <stop offset="0.25" stop-color="#fff" :stop-opacity="Math.pow(0.8879, 1 - 0.28 * focusStrength)" />
              <stop offset="0.30" stop-color="#fff" :stop-opacity="Math.pow(0.8434, 1 - 0.28 * focusStrength)" />
              <stop offset="0.35" stop-color="#fff" :stop-opacity="Math.pow(0.7932, 1 - 0.28 * focusStrength)" />
              <stop offset="0.40" stop-color="#fff" :stop-opacity="Math.pow(0.7381, 1 - 0.28 * focusStrength)" />
              <stop offset="0.45" stop-color="#fff" :stop-opacity="Math.pow(0.6786, 1 - 0.28 * focusStrength)" />
              <stop offset="0.50" stop-color="#fff" :stop-opacity="Math.pow(0.6156, 1 - 0.28 * focusStrength)" />
              <stop offset="0.55" stop-color="#fff" :stop-opacity="Math.pow(0.5496, 1 - 0.28 * focusStrength)" />
              <stop offset="0.60" stop-color="#fff" :stop-opacity="Math.pow(0.4815, 1 - 0.28 * focusStrength)" />
              <stop offset="0.65" stop-color="#fff" :stop-opacity="Math.pow(0.4120, 1 - 0.28 * focusStrength)" />
              <stop offset="0.70" stop-color="#fff" :stop-opacity="Math.pow(0.3421, 1 - 0.28 * focusStrength)" />
              <stop offset="0.75" stop-color="#fff" :stop-opacity="Math.pow(0.2727, 1 - 0.28 * focusStrength)" />
              <stop offset="0.80" stop-color="#fff" :stop-opacity="Math.pow(0.2051, 1 - 0.28 * focusStrength)" />
              <stop offset="0.85" stop-color="#fff" :stop-opacity="Math.pow(0.1408, 1 - 0.28 * focusStrength)" />
              <stop offset="0.90" stop-color="#fff" :stop-opacity="Math.pow(0.0818, 1 - 0.28 * focusStrength)" />
              <stop offset="0.95" stop-color="#fff" :stop-opacity="Math.pow(0.0318, 1 - 0.28 * focusStrength)" />
              <stop offset="1.00" stop-color="#fff" :stop-opacity="Math.pow(0.0000, 1 - 0.28 * focusStrength)" />
            </linearGradient>
            <linearGradient id="torch-core-falloff" gradientUnits="userSpaceOnUse" x1="144" :y1="sourceY" x2="144" :y2="optics.endY">
              <stop offset="0.00" stop-color="#fff" :stop-opacity="Math.pow(1.0000, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.05" stop-color="#fff" :stop-opacity="Math.pow(0.9949, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.10" stop-color="#fff" :stop-opacity="Math.pow(0.9803, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.15" stop-color="#fff" :stop-opacity="Math.pow(0.9571, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.20" stop-color="#fff" :stop-opacity="Math.pow(0.9260, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.25" stop-color="#fff" :stop-opacity="Math.pow(0.8879, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.30" stop-color="#fff" :stop-opacity="Math.pow(0.8434, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.35" stop-color="#fff" :stop-opacity="Math.pow(0.7932, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.40" stop-color="#fff" :stop-opacity="Math.pow(0.7381, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.45" stop-color="#fff" :stop-opacity="Math.pow(0.6786, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.50" stop-color="#fff" :stop-opacity="Math.pow(0.6156, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.55" stop-color="#fff" :stop-opacity="Math.pow(0.5496, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.60" stop-color="#fff" :stop-opacity="Math.pow(0.4815, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.65" stop-color="#fff" :stop-opacity="Math.pow(0.4120, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.70" stop-color="#fff" :stop-opacity="Math.pow(0.3421, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.75" stop-color="#fff" :stop-opacity="Math.pow(0.2727, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.80" stop-color="#fff" :stop-opacity="Math.pow(0.2051, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.85" stop-color="#fff" :stop-opacity="Math.pow(0.1408, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.90" stop-color="#fff" :stop-opacity="Math.pow(0.0818, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="0.95" stop-color="#fff" :stop-opacity="Math.pow(0.0318, 0.9 * (1 - 0.28 * focusStrength))" />
              <stop offset="1.00" stop-color="#fff" :stop-opacity="Math.pow(0.0000, 0.9 * (1 - 0.28 * focusStrength))" />
            </linearGradient>
            <linearGradient id="torch-fringe" x1="0" y1="0" x2="1" y2="0">
              <stop stop-color="#fff" stop-opacity=".55" />
              <stop offset=".5" stop-color="#fff" stop-opacity=".3" />
              <stop offset="1" stop-color="#fff" stop-opacity=".55" />
            </linearGradient>
            <mask id="torch-fringe-mask">
              <path :d="optics.beam" fill="url(#torch-falloff)" filter="url(#torch-edge)" />
            </mask>
            <linearGradient id="torch-core-softness" x1="0" y1="0" x2="1" y2="0">
              <stop stop-color="white" stop-opacity="0" />
              <stop offset=".18" stop-color="white" stop-opacity=".4" />
              <stop offset=".36" stop-color="white" stop-opacity=".9" />
              <stop offset=".5" stop-color="white" />
              <stop offset=".64" stop-color="white" stop-opacity=".9" />
              <stop offset=".82" stop-color="white" stop-opacity=".4" />
              <stop offset="1" stop-color="white" stop-opacity="0" />
            </linearGradient>
            <mask id="torch-core-mask" maskContentUnits="objectBoundingBox">
              <rect width="1" height="1" fill="url(#torch-core-softness)" />
            </mask>
            <filter id="torch-diffusion" x="-.35" y="-.35" width="1.7" height="1.7">
              <feGaussianBlur :stdDeviation="`${9 * optics.softness} ${1.2 * optics.softness}`" />
            </filter>
            <filter id="torch-edge" x="-.2" y="-.2" width="1.4" height="1.4">
              <feGaussianBlur :stdDeviation="`${(1.6 + spread * 2.4) * optics.softness} ${0.65 * optics.softness}`" />
            </filter>
          </defs>
          <path :d="guideArc(maxHalfWidth, maxArcY - limitArcBow / 2)" class="torch-limit" />
          <path class="torch-spill" :d="optics.spill" fill="url(#torch-spill-falloff)" filter="url(#torch-spill-softness)" />
          <g class="torch-light">
            <path :d="optics.beam" fill="url(#torch-fringe)" mask="url(#torch-fringe-mask)" filter="url(#torch-edge)" class="torch-fringe" />
            <path :d="optics.beam" fill="url(#torch-falloff)" filter="url(#torch-edge)" />
          </g>
          <path
            class="torch-core"
            :d="optics.beam"
            fill="url(#torch-core-falloff)"
            mask="url(#torch-core-mask)"
            filter="url(#torch-diffusion)"
          />
          <path :d="optics.arc" class="torch-arc" :class="{ off: !control.flashlight }" />
        </svg>
        <img
          v-if="control.flashlight"
          class="torch-sun"
          :src="brightnessGuideIcon"
          :style="{ left: `calc(${optics.endX / 288 * 100}% + 15px)`, top: `${optics.endY / 380 * 100}%` }"
          alt=""
          aria-hidden="true"
        />
        <Transition name="torch-education">
          <div v-if="educationStep === 0" class="torch-education-touch" :style="educationDotStyle" data-testid="flashlight-continuous-vertical">
            <div :key="educationTick" class="torch-education-motion" :class="`torch-education-motion-${educationStep}`">
              <span class="torch-education-dot" aria-hidden="true"></span>
            </div>
            <div class="torch-education-copy" data-testid="flashlight-education" :data-step="educationStep" :data-run="educationTick" role="status" aria-live="polite">
              <Transition name="torch-education-label"><span :key="educationStep">{{ educationSteps[educationStep] }}</span></Transition>
            </div>
          </div>
        </Transition>
        <Transition name="torch-education">
          <div v-if="educationStep === 1 && beamEnabled" class="torch-education-width-stage">
            <div v-for="side in ['left', 'right']" :key="side" class="torch-tiled-anchor" :data-testid="`flashlight-continuous-${side}`" :style="widthEducationAnchor(side)">
              <div :key="educationTick" class="torch-education-width-motion" :style="widthEducationMotion(side)"><span class="torch-education-dot" aria-hidden="true"></span></div>
            </div>
            <div class="torch-education-copy torch-education-width-copy" :style="{ left: '50%', top: `${continuousWidthGeometry.sideY / 380 * 100}%` }" data-testid="flashlight-education" :data-step="educationStep" :data-run="educationTick" role="status" aria-live="polite">
              <Transition name="torch-education-label"><span :key="educationStep">{{ educationSteps[educationStep] }}</span></Transition>
            </div>
          </div>
        </Transition>
        <button
          class="torch-power"
          type="button"
          aria-label="手电筒开关"
          :aria-pressed="control.flashlight"
          @click="control.setRearFlashlight(!control.flashlight)"
        >
          <svg class="torch-power-icon" viewBox="0 0 48 76" width="48" height="76" aria-hidden="true">
            <path d="M12 3h24a5 5 0 0 1 5 5v1H7V8a5 5 0 0 1 5-5Z" fill="currentColor" />
            <path d="M7 12h34v1.5c0 4.4-2.5 7.4-5.1 10.3-1.3 1.5-1.4 3.6-1.4 6.1v37.6a5.5 5.5 0 0 1-5.5 5.5H19a5.5 5.5 0 0 1-5.5-5.5V29.9c0-2.5-.1-4.6-1.4-6.1C9.5 20.9 7 17.9 7 13.5Z" fill="currentColor" />
            <rect class="torch-switch-slot" x="18.5" y="37" width="11" height="22" rx="5.5" />
            <circle class="torch-switch-thumb" cx="24" cy="53" r="3.4" fill="#fff" />
          </svg>
        </button>
      </div>
      <div class="torch-accessories">
        <Transition name="torch-front-availability">
          <div v-if="control.flashlightLamps.front" class="torch-front-controls">
        <span class="torch-rear-label">后置灯</span>
        <button
          class="torch-front-toggle"
          type="button"
          :aria-pressed="control.frontFlashlightOn"
          @click.stop="control.setFrontFlashlight(!control.frontFlashlightOn)"
        >
          <span class="torch-front-circle cc-glass-track">
            <svg class="torch-front-power-icon" viewBox="0 0 32 32" aria-hidden="true" fill="none">
              <circle cx="16" cy="16" r="5.5" fill="currentColor" />
              <path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
            </svg>
          </span>
          <span>前置灯</span>
        </button>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.torch-panel {
  --torch-scene-top: 15%;
  --torch-scene-bottom: 22%;
  --torch-power-position: .7894736842;
  --torch-power-offset: 35px;
  --torch-power-height: 84px;
  --torch-scene-height: calc(100% - var(--torch-scene-top) - var(--torch-scene-bottom));
  --torch-adjust-top: calc(var(--torch-scene-top) + var(--torch-scene-height) * var(--torch-guide-top-ratio) - 20px);
  --torch-adjust-bottom: calc(var(--torch-scene-top) + var(--torch-scene-height) * var(--torch-power-position) + var(--torch-power-offset) - var(--torch-power-height) / 2);
  outline: none;
  text-align: center;
}
.torch-backdrop {
  pointer-events: none;
  transition: opacity 360ms cubic-bezier(.2,.8,.2,1);
}
.torch-scene {
  position: absolute;
  inset: var(--torch-scene-top) 16% var(--torch-scene-bottom);
  pointer-events: none;
  transition: opacity 260ms ease, transform 440ms cubic-bezier(.22,.82,.18,1);
}
.torch-panel-enter-from .torch-backdrop,
.torch-panel-leave-to .torch-backdrop { opacity: 0; }
.torch-panel-enter-from .torch-scene,
.torch-panel-leave-to .torch-scene {
  opacity: 0;
  transform: translate(var(--torch-start-x, 0px), var(--torch-start-y, 0px)) scale(.22, .14);
}
.torch-panel-leave-active .torch-scene { transition-duration: 220ms, 320ms; }
.torch-panel-leave-active .torch-backdrop { transition-duration: 300ms; }
.torch-panel-leave-active, .torch-panel-leave-active .torch-power, .torch-panel-leave-active .torch-front-toggle { pointer-events: none; }
.torch-accessories {
  position: absolute;
  inset: var(--torch-scene-top) 16% var(--torch-scene-bottom);
  pointer-events: none;
  transition: opacity 260ms ease;
}
.torch-panel-enter-from .torch-accessories,
.torch-panel-leave-to .torch-accessories { opacity: 0; }
.torch-panel-enter-active .torch-accessories { transition-delay: 100ms; }
.torch-panel-leave-active .torch-accessories { transition-duration: 180ms; }
.torch-front-controls { position: absolute; inset: 0; pointer-events: none; }
.torch-front-availability-enter-active, .torch-front-availability-leave-active { transition: opacity 260ms ease; }
.torch-front-availability-enter-from, .torch-front-availability-leave-to { opacity: 0; }
.torch-front-availability-leave-active .torch-front-toggle { pointer-events: none; }
.torch-rear-label {
  position: absolute;
  left: 50%;
  top: calc(100% * var(--torch-power-position) + var(--torch-power-offset) + var(--torch-power-height) / 2 + 6px);
  translate: -50% 0;
  color: #fff;
  font: 400 11px/1.4 var(--font-stack);
  white-space: nowrap;
}
.torch-front-power-icon { width: 24px; height: 24px; }
.torch-front-circle {
  position: relative;
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-capsule, 999px);
  transition: background-color 300ms ease, color 300ms ease, box-shadow 300ms ease;
}
.torch-adjust {
  position: absolute;
  inset: var(--torch-adjust-top) 0 calc(100% - var(--torch-adjust-bottom));
  touch-action: none;
  cursor: grab;
}
.torch-adjust.dragging { cursor: grabbing; }
.torch-dismiss-top { position: absolute; inset: 0 0 calc(100% - var(--torch-adjust-top)); touch-action: none; }
.torch-dismiss { position: absolute; inset: var(--torch-adjust-bottom) 0 0; }
.torch-optics { display: block; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.torch-spill { opacity: var(--beam-spill); pointer-events: none; }
.torch-light { opacity: var(--beam-intensity); }
.torch-core { opacity: var(--beam-core); }
.torch-fringe { opacity: var(--beam-fringe); }
.torch-limit, .torch-arc {
  fill: none;
  stroke: white;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}
.torch-limit { stroke-width: 1.7; stroke-dasharray: 0 4.8; opacity: .5; }
.torch-arc { stroke: #fff; stroke-width: 2.5; opacity: 1; transition: opacity 220ms ease-out; }
.torch-arc.off { opacity: .2; }
.torch-sun { position: absolute; width: 20px; height: auto; aspect-ratio: 1; object-fit: contain; transform: translate(-50%, -50%); pointer-events: none; }
.dragging .torch-arc { transition: none; }
.torch-power {
  position: absolute;
  left: 50%;
  top: calc(100% * var(--torch-power-position) + var(--torch-power-offset));
  translate: -50% -50%;
  width: 64px;
  height: var(--torch-power-height);
  pointer-events: auto;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: white;
  background: transparent;
  cursor: pointer;
}
.torch-front-toggle {
  position: absolute;
  left: 50%;
  top: calc(100% * var(--torch-power-position) + var(--torch-power-offset) + var(--torch-power-height) / 2 + 54px);
  translate: -50% 0;
  display: grid;
  justify-items: center;
  gap: 13px;
  padding: 0;
  border: 0;
  background: none;
  color: #fff;
  font: 400 11px/1.4 var(--font-stack);
  pointer-events: auto;
  cursor: pointer;
  transition: background-color 300ms ease, color 300ms ease, box-shadow 300ms ease, transform 180ms ease;
}
.torch-front-toggle > span:last-child { transform: translateY(-3px); }
.torch-front-toggle[aria-pressed="true"] .torch-front-circle { background-color: #fff; color: var(--cc-flashlight-active); box-shadow: 0 2px 6px rgb(0 0 0 / 18%); }
.torch-front-toggle:active { transform: scale(.94); }
.torch-front-toggle:focus-visible { outline: 2px solid white; outline-offset: 4px; }
.torch-switch-slot { fill: #171719; transition: fill 220ms ease; }
.torch-switch-thumb { transition: transform 220ms ease; }
.torch-power[aria-pressed="true"] .torch-switch-slot { fill: var(--cc-flashlight-active); }
.torch-power[aria-pressed="true"] .torch-switch-thumb { transform: translateY(-10px); }
@media (prefers-reduced-motion: reduce) {
  .torch-front-availability-enter-active, .torch-front-availability-leave-active { transition-duration: 0ms; }
  .torch-accessories { transition-delay: 0ms !important; }
  .torch-accessories, .torch-scene, .torch-backdrop, .torch-arc, .torch-switch-slot, .torch-switch-thumb, .torch-front-toggle, .torch-front-circle { transition-duration: 0ms; }
}
</style>

<style scoped>
.torch-education-copy { position: absolute; left: 0; top: 24px; width: 96px; height: 22.5px; text-align: center; transform: translateX(-50%); white-space: nowrap; color: white; font: 500 15px/1.5 var(--font-stack); letter-spacing: .3px; pointer-events: none; text-shadow: 0 1px 6px #152b5033; }
.torch-education-width-copy { display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%); }
.torch-education-copy span { display: block; width: 100%; }
.torch-education-label-enter-active, .torch-education-label-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.torch-education-label-leave-active { position: absolute; left: 0; top: 0; }
.torch-education-label-enter-from { opacity: 0; transform: translateY(3px); }
.torch-education-label-leave-to { opacity: 0; transform: translateY(-3px); }
.torch-education-touch { position: absolute; width: 0; height: 0; pointer-events: none; }
.torch-education-dot { display: block; position: absolute; left: -11px; top: -11px; width: 22px; height: 22px; box-sizing: border-box; border-radius: 50%; background: #ffffff55; border: 1.2px solid #fff; box-shadow: 0 1px 8px #23355238; }
.torch-education-motion { position: absolute; width: 0; height: 0; animation: torch-education-motion 2000ms cubic-bezier(.35,0,.2,1) both; }
.torch-education-motion-0 { --from-x: 0px; --from-y: -40px; --to-x: 0px; --to-y: 0px; }
@keyframes torch-education-motion {
  0% { opacity: 0; transform: translate(var(--from-x), var(--from-y)); }
  12% { opacity: 1; }
  90% { opacity: 1; transform: translate(var(--to-x), var(--to-y)); }
  100% { opacity: 0; transform: translate(var(--to-x), var(--to-y)); }
}
.torch-education-width-stage { position: absolute; inset: 0; pointer-events: none; }
.torch-scene.brightness-only .torch-education-width-stage { display: none; }
.torch-tiled-anchor { position: absolute; width: 0; height: 0; pointer-events: none; }
.torch-education-width-motion { position: absolute; width: 0; height: 0; animation: torch-education-width-motion 2000ms cubic-bezier(.35,0,.2,1) both; }
@keyframes torch-education-width-motion { 0% { transform: translateX(var(--width-from)); } 90%,100% { transform: translateX(var(--width-to)); } }
.torch-education-enter-active, .torch-education-leave-active { transition: opacity 180ms ease; }
.torch-education-enter-from, .torch-education-leave-to { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .torch-education-motion, .torch-education-width-motion { animation: none; }
  .torch-education-label-enter-active, .torch-education-label-leave-active,
  .torch-education-enter-active, .torch-education-leave-active { transition: none; }
  .torch-education-dot { opacity: .8; }
}
</style>
