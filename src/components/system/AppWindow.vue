<script setup>
import { computed, nextTick, onBeforeUnmount, onErrorCaptured, onMounted, ref, watch } from 'vue'
import { getApp } from '../../config/apps'
import { appComponents, isAppPreloaded, resolveAppComponent } from '../apps/registry'
import PlaceholderApp from '../apps/PlaceholderApp.vue'
import AppIcon from '../ui/AppIcon.vue'
import { useHeroTransition } from '../../composables/useHeroTransition'
import { useHomeStore } from '../../stores/homeStore'
import { useSystemStore } from '../../stores/systemStore'
import { consumeLaunchRect, getAnchorRect } from '../../utils/appIconAnchors'
import { deriveHeroClipGeometry, makeViewportRect } from '../../utils/heroGeometry'
import { screenRef } from '../../utils/screenRef'

const props = defineProps({
  appId: { type: String, required: true }
})
const emit = defineEmits(['hero-frame'])

const system = useSystemStore()
const home = useHomeStore()
const hero = useHeroTransition()
const ready = ref(false)
const contentReady = ref(false)
const viewportRect = ref(null)
const viewportRadius = ref(44)

const app = computed(() => getApp(props.appId))
const activeComp = computed(() => resolveAppComponent(props.appId))
const isAsyncEntry = computed(() => Boolean(appComponents[props.appId]) && !isAppPreloaded(props.appId))
const phase = hero.phase
const frame = hero.frame
const isOpen = computed(() => phase.value === 'open')

function onSuspenseResolve() {
  contentReady.value = true
}

function onChildMounted() {
  // 异步包装组件在 chunk 未加载前也会先触发一次 @vue:mounted（空注释节点）；
  // 只有同步组件或已完成预载的组件才在此直接置位，未就绪的异步组件交由 <Suspense @resolve> 兜底。
  if (!isAsyncEntry.value) {
    contentReady.value = true
  }
}

onErrorCaptured(() => {
  contentReady.value = true
  return false
})

watch(
  () => props.appId,
  () => {
    contentReady.value = false
  }
)

function readViewport() {
  const element = screenRef.el
  if (!element) return null
  viewportRect.value = makeViewportRect(element.offsetWidth, element.offsetHeight)
  const radius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius)
  viewportRadius.value = Number.isFinite(radius) ? radius : 44
  return viewportRect.value
}

const windowStyle = computed(() => {
  const current = frame.value
  if (!current) return { visibility: 'hidden' }
  if (isOpen.value) {
    return {
      visibility: ready.value ? 'visible' : 'hidden',
      inset: '0px',
      width: '100%',
      height: '100%',
      transform: 'none',
      borderRadius: '0px'
    }
  }
  const rect = current.windowRect
  return {
    visibility: ready.value ? 'visible' : 'hidden',
    left: '0px',
    top: '0px',
    transform: `translate3d(${rect.x}px, ${rect.y}px, 0)`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: `${current.radius}px`
  }
})

const fixedContainerStyle = computed(() => {
  const current = frame.value
  const viewport = viewportRect.value
  if (!current || !viewport) return {}
  if (isOpen.value) {
    return {
      width: '100%',
      height: '100%',
      transform: 'none'
    }
  }

  // 使用等比缩放 (Uniform Scale) 以防拉伸/挤压变形
  const scale = current.windowRect.width / viewport.width
  const scaledHeight = viewport.height * scale
  // 垂直居中补偿：让外部裁剪框（clipPath）自然裁剪多余的上下部分
  const yOffset = (current.windowRect.height - scaledHeight) / 2

  return {
    width: `${viewport.width}px`,
    height: `${viewport.height}px`,
    transform: `translate3d(0, ${yOffset}px, 0) scale(${scale})`
  }
})

const clipStyle = computed(() => {
  const current = frame.value
  if (!current) return {}
  if (isOpen.value) {
    return {
      borderRadius: '0px',
      clipPath: 'none'
    }
  }
  const geometry = deriveHeroClipGeometry(current)
  const { width, height } = current.windowRect
  const maxR = Math.max(0, Math.min(width, height) / 2)
  const topR = Math.min(maxR, Math.max(0, geometry.topRadius))
  const bottomR = Math.min(maxR, Math.max(0, geometry.bottomRadius))
  return {
    borderRadius: `${topR}px ${topR}px ${bottomR}px ${bottomR}px`,
    clipPath: `inset(0 round ${topR}px ${topR}px ${bottomR}px ${bottomR}px)`
  }
})

const contentStyle = computed(() => ({
  opacity: contentReady.value ? (frame.value?.contentOpacity ?? 0) : 0
}))
const appSurfaceStyle = computed(() => ({
  background: app.value?.gradient || '#f2f2f7',
  opacity: (contentReady.value || isOpen.value) ? (frame.value?.appSurfaceOpacity ?? 1) : 0
}))
const heroFillStyle = computed(() => ({
  background: app.value?.heroBackground || '#f2f2f7',
  opacity: isOpen.value ? 0 : (widgetAnchor.value ? 1 : (frame.value?.heroFillOpacity ?? 0))
}))
const launchAnchor = ref(null)
const widgetMirrorHost = ref(null)
const widgetAnchor = ref(null)
let hiddenWidget = null
let swipeFrame = null

function desktopWidget(screen, widgetId) {
  if (!widgetId) return null
  return screen?.querySelector(
    `[data-page="${home.currentPage}"] [data-home-item="widget:${widgetId}"] :is(.clock-widget, .wide-clock-widget, .smart-suggestion-stack)`
  )
}

function restoreWidget() {
  hiddenWidget?.removeAttribute('data-widget-hero-source')
  hiddenWidget = null
}

function screenLocalBounds(node, screen) {
  if (!node || !screen?.offsetWidth || !screen.offsetHeight) return null
  const source = node.getBoundingClientRect()
  const bounds = screen.getBoundingClientRect()
  if (!source.width || !source.height || !bounds.width || !bounds.height) return null
  const scaleX = bounds.width / screen.offsetWidth
  const scaleY = bounds.height / screen.offsetHeight
  return {
    x: (source.left - bounds.left) / scaleX,
    y: (source.top - bounds.top) / scaleY,
    width: source.width / scaleX,
    height: source.height / scaleY
  }
}

function prepareWidgetMirror(screen, widgetId) {
  restoreWidget()
  widgetMirrorHost.value.replaceChildren()
  const widget = desktopWidget(screen, widgetId)
  const rect = screenLocalBounds(widget, screen)
  if (!rect) return null
  const radius = Number.parseFloat(getComputedStyle(widget).borderTopLeftRadius)
  return { widget, rect, radius }
}

function showWidgetMirror(anchor) {
  const copy = anchor.widget.cloneNode(true)
  copy.style.width = anchor.rect.width + 'px'
  copy.style.height = anchor.rect.height + 'px'
  widgetMirrorHost.value.replaceChildren(copy)
  hiddenWidget = anchor.widget
  hiddenWidget.setAttribute('data-widget-hero-source', '')
}

function reduceWidgetMotion() {
  return Boolean(launchAnchor.value?.widgetId && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
}

const widgetMirrorStyle = computed(() => {
  const current = frame.value
  const anchor = widgetAnchor.value
  if (!anchor || !current?.iconOpacity) return { visibility: 'hidden' }
  const scale = current.iconNative ? 1 : current.windowRect.width / anchor.rect.width
  return { opacity: current.iconOpacity, transform: `scale(${scale})` }
})

const windowClipStyle = computed(() => {
  const current = frame.value
  if (!widgetAnchor.value || !current || isOpen.value) return clipStyle.value
  const clipPath = `inset(0 round ${current.radius}px)`
  return { clipPath, '--widget-hero-clip': clipPath, opacity: 1 - current.iconOpacity }
})

const nativeIconSize = computed(() => launchAnchor.value?.width || 60)
const iconWrapperStyle = computed(() => {
  const current = frame.value
  if (widgetAnchor.value || !current || current.iconOpacity <= 0) return { opacity: 0, pointerEvents: 'none' }
  const baseSize = nativeIconSize.value
  const scale = current.iconScale || (current.windowRect ? current.windowRect.width / baseSize : 1)
  return {
    width: `${baseSize}px`,
    height: `${baseSize}px`,
    opacity: current.iconOpacity,
    transformOrigin: 'top left',
    transform: `scale(${scale})`
  }
})

function closeToLiveAnchor() {
  if (['closing', 'handoff', 'closed'].includes(phase.value)) return
  const screen = screenRef.el
  const viewport = readViewport()
  const widget = prepareWidgetMirror(screen, launchAnchor.value?.widgetId)
  widgetAnchor.value = widget
  const reducedMotion = reduceWidgetMotion()
  if (widget && !reducedMotion) showWidgetMirror(widget)
  if (!widget && launchAnchor.value?.widgetId) home.hideIcon(props.appId)
  let anchor = widget?.rect || getAnchorRect(props.appId, screen)
  if (!anchor || !anchor.width) {
    anchor = launchAnchor.value
  }
  if (!viewport || !anchor || !anchor.width) {
    home.showIcon()
    system.setHomeGestureProgress(0)
    system.finishGoHome()
    return
  }

  // 手势进度在这里之前保持不变；当前跟手帧就是关闭动画的精确起点。
  const startRect = swipeFrame?.rect || frame.value?.windowRect || viewport
  const startRadius = swipeFrame?.radius ?? frame.value?.radius
  swipeFrame = null
  hero.beginClose({
    viewportRect: viewport,
    anchorRect: anchor,
    anchorRadius: widget?.radius,
    reducedMotion,
    startRect,
    startRadius,
    startBackdropStrength: frame.value?.backdropStrength,
    viewportRadius: viewportRadius.value,
    onHandoff: () => {
      restoreWidget()
      home.showIcon()
    },
    onClosed: () => system.finishGoHome()
  })
  system.setHomeGestureProgress(0)
}

onMounted(() => {
  const screen = screenRef.el
  const viewport = readViewport()
  const consumed = consumeLaunchRect(props.appId)
  const gotAnchor = getAnchorRect(props.appId, screen)
  const launchRect = consumed || gotAnchor
  if (!viewport || !launchRect || !launchRect.width) {
    ready.value = true
    home.hideIcon(props.appId)
    return
  }

  launchAnchor.value = launchRect
  const widget = prepareWidgetMirror(screen, launchRect.widgetId)
  const reducedMotion = reduceWidgetMotion()
  widgetAnchor.value = widget
  if (widget && !reducedMotion) showWidgetMirror(widget)
  if (!widget) home.hideIcon(props.appId)
  hero.beginOpen({
    viewportRect: viewport,
    anchorRect: widget?.rect || launchRect,
    anchorRadius: widget?.radius,
    reducedMotion,
    viewportRadius: viewportRadius.value
  })
  ready.value = true
})

watch(
  () => system.homeGestureProgress,
  (progress) => {
    if (!viewportRect.value || reduceWidgetMotion()) return
    hero.setPreview({
      viewportRect: viewportRect.value,
      progress,
      viewportRadius: viewportRadius.value
    })
  }
)

watch(
  () => system.switcherProgress,
  (progress, previous) => {
    if (!launchAnchor.value?.widgetId || !previous || progress > 0.01 || reduceWidgetMotion()) return
    const screen = screenRef.el
    const card = screen?.querySelector('.switcher-card.is-follow')
    const rect = screenLocalBounds(card, screen)
    if (!rect) return

    // Read the currently painted follow card before Vue removes it on release.
    const radius = Number.parseFloat(getComputedStyle(card).borderTopLeftRadius)
    const scale = Math.min(rect.width / card.offsetWidth, rect.height / card.offsetHeight)
    swipeFrame = { rect, radius: radius * scale }
    nextTick(() => { swipeFrame = null })
  },
  { flush: 'sync' }
)

watch(
  () => system.baseLayer,
  (layer) => {
    if (layer === 'home' && system.activeAppId === props.appId) closeToLiveAnchor()
  },
  { flush: 'post' }
)

watch(
  [frame, phase],
  ([current, currentPhase]) => emit('hero-frame', current
    ? { phase: currentPhase, backdropStrength: current.backdropStrength, widgetLaunch: Boolean(launchAnchor.value?.widgetId), showingWidgetOnOpen: Boolean(widgetAnchor.value && currentPhase === "opening" && current.iconOpacity > 0) }
    : null),
  { immediate: true, flush: 'sync' }
)

onBeforeUnmount(() => {
  restoreWidget()
  emit('hero-frame', null)
  hero.stop()
  home.showIcon()
})
</script>

<template>
  <div
    class="app-window"
    :data-phase="phase"
    :data-widget-hero="launchAnchor?.widgetId"
    :data-app-id="appId"
    :data-content-ready="contentReady ? 'true' : 'false'"
    :style="windowStyle"
  >
    <div class="aw-clip" :style="windowClipStyle">
      <div class="aw-fill" :style="heroFillStyle"></div>
      <div class="aw-fixed-container" :style="fixedContainerStyle">
        <div class="aw-app-surface" :style="appSurfaceStyle"></div>
        <div class="aw-content" :style="contentStyle">
          <Suspense @resolve="onSuspenseResolve">
            <component :is="activeComp" :app="app" @vue:mounted="onChildMounted" />
          </Suspense>
        </div>
      </div>
    </div>

    <div ref="widgetMirrorHost" class="aw-widget-mirror" :style="widgetMirrorStyle" aria-hidden="true" inert></div>

    <div class="aw-icon-wrapper" :style="iconWrapperStyle">
      <AppIcon
        v-if="app"
        :app="app"
        :size="nativeIconSize"
        :show-label="false"
        :home-anchor="false"
        :preload-on-press="false"
        ignore-hidden
      />
    </div>
  </div>
</template>

<style scoped>
:global(.home-layer [data-widget-hero-source]) { visibility:hidden }
.aw-widget-mirror { position:absolute; top:0; left:0; pointer-events:none; transform-origin:top left; z-index:10 }
:global(body.is-capturing .app-window[data-widget-hero]) { inset:0 auto auto 0 !important; }
:global(body.is-capturing .app-window[data-widget-hero] .aw-clip) {
  clip-path:var(--widget-hero-clip, none) !important;
}

.app-window {
  position: absolute;
  z-index: var(--z-app-window);
  will-change: transform, width, height;
}
.app-window[data-phase="open"] {
  will-change: auto;
}
.aw-clip {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.app-window[data-phase="open"] .aw-clip {
  will-change: auto;
}
.aw-fixed-container {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
}
.aw-fill,
.aw-app-surface,
.aw-content {
  position: absolute;
  inset: 0;
  will-change: opacity;
}
.aw-icon-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
  transform-origin: top left;
}
</style>
