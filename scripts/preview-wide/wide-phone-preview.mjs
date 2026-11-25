import { createRequire } from 'node:module'
import path from 'node:path'
import { modelId, wideHomePlugin } from './wide-home-runtime.mjs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '')
const require = createRequire(path.join(root, 'package.json'))
const { createServer } = await import(pathToFileURL(require.resolve('vite/package.json').replace(/package\.json$/, 'dist/node/index.js')).href)
const { default: vue } = await import(pathToFileURL(require.resolve('@vitejs/plugin-vue')).href)

function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) {
    throw new Error(`Preview hook changed: ${before.slice(0, 100)}`)
  }
  return source.replace(before, () => after)
}

function previewApp(source) {
  source = replaceOnce(source, "import { onBeforeUnmount, onMounted, ref, watch } from 'vue'", `import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSpring } from './composables/useSpring'
import { wideMode, formMetrics, formMoving } from '${modelId}'`)
  const sizeAnchor = 'const BASE_SCREEN_H = 788'
  source = replaceOnce(source, sizeAnchor, `${sizeAnchor}
const WIDE_SCREEN_W = 1280 / 3
const WIDE_SCREEN_H = 2200 / 3
const previewForm = ref(new URLSearchParams(window.location.search).get('form') === 'wide' ? 'wide' : 'slab')
const previewViewport = ref({ width: BASE_SCREEN_W, height: BASE_SCREEN_H, stageHeight: BASE_SCREEN_H })
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const selectedFormAmount = () => previewForm.value === 'wide' ? 1 : 0
const formSpring = useSpring(selectedFormAmount())
const formAmount = computed(() => Math.max(0, Math.min(1, formSpring.value.value)))
const interpolate = (from, to, amount) => from + (to - from) * amount

let formRun = 0
watch(previewForm, () => {
  const run = ++formRun
  formMoving.value = !reducedMotion.matches
  wideMode.value = previewForm.value === 'wide'
  const target = selectedFormAmount()
  if (reducedMotion.matches) {
    formSpring.snapTo(target)
  } else {
    formSpring.animateTo(target, { config: { mass: 1, stiffness: 420, damping: 41 }, onDone: () => {
      requestAnimationFrame(() => requestAnimationFrame(() => { if (run === formRun) formMoving.value = false }))
    } })
  }
})

function syncReducedMotion(event) {
  if (event.matches) {
    formMoving.value = false
    formSpring.snapTo(selectedFormAmount())
  }
}
onMounted(() => reducedMotion.addEventListener('change', syncReducedMotion))
onBeforeUnmount(() => reducedMotion.removeEventListener('change', syncReducedMotion))

const previewGeometry = computed(() => {
  const amount = formAmount.value
  const { width, height, stageHeight } = previewViewport.value
  const screenW = interpolate(BASE_SCREEN_W, WIDE_SCREEN_W, amount)
  const slabH = isMobile.value ? mobileLogicalHeight.value : BASE_SCREEN_H
  const screenH = interpolate(slabH, WIDE_SCREEN_H, amount)
  const stage = {
    '--screen-w': screenW + 'px',
    '--screen-h': screenH + 'px',
    '--preview-progress': amount
  }

  // The frame and stage padding add 32px to the screen height.
  if (!isMobile.value) {
    stage['--preview-scale'] = Math.max(0.62, Math.min(1, (stageHeight - 32) / (screenH + 32 + 96)))
    return stage
  }

  const wideScale = Math.min((width - 16) / WIDE_SCREEN_W, (height - 16) / WIDE_SCREEN_H)
  const slabScale = mobileScale.value
  const visualW = interpolate(BASE_SCREEN_W * slabScale, WIDE_SCREEN_W * wideScale, amount)
  const displayScale = visualW / screenW
  const left = (visualW - BASE_SCREEN_W * slabScale) / -2
  const top = (screenH * displayScale - slabH * slabScale) / -2
  stage['--preview-left'] = left + 'px'
  stage['--preview-top'] = top + 'px'
  stage['--preview-scale'] = displayScale
  return stage
})

function applyPreviewGeometry() {
  const stage = stageRef.value
  if (!stage) return
  stage.dataset.formMoving = String(formMoving.value)
  const geometry = previewGeometry.value
  formMetrics.value = {width:parseFloat(geometry['--screen-w']), height:parseFloat(geometry['--screen-h']), progress:geometry['--preview-progress'], slabHeight:isMobile.value ? mobileLogicalHeight.value : BASE_SCREEN_H, wideHeight:WIDE_SCREEN_H}
  for (const [property, value] of Object.entries(geometry)) {
    stage.style.setProperty(property, value)
  }
}
`)
  source = replaceOnce(source, 'const scale = ref(1)\n', '')
  const geometryAnchor = 'const mobileLogicalHeight = ref(BASE_SCREEN_H)'
  source = replaceOnce(source, geometryAnchor, `${geometryAnchor}
watch([previewGeometry, formMoving], applyPreviewGeometry, { flush: 'post' })
onMounted(applyPreviewGeometry)
`)
  const metricsFrom = source.indexOf('function updateStageMetrics() {')
  const metricsTo = source.indexOf("\nif (typeof window !== 'undefined') {", metricsFrom)
  if (metricsFrom < 0 || metricsTo < 0) throw new Error('Preview viewport hook changed')
  source = source.slice(0, metricsFrom) + `function updateStageMetrics() {
  checkMobile()
  const width = window.visualViewport?.width || window.innerWidth || BASE_SCREEN_W
  const height = window.visualViewport?.height || window.innerHeight || BASE_SCREEN_H
  previewViewport.value = { width, height, stageHeight: window.innerHeight }
  if (isMobile.value) {
    mobileScale.value = Math.max(280, width) / BASE_SCREEN_W
    mobileLogicalHeight.value = Math.round(Math.max(480, height) / mobileScale.value * 100) / 100
  }
}
` + source.slice(metricsTo)
  const stageAnchor = `<div class="stage" :class="{ 'is-mobile': isMobile }" ref="stageRef">`
  source = replaceOnce(source, stageAnchor, `<div class="stage" :class="{ 'is-mobile': isMobile }"
    :data-preview-form="previewForm" ref="stageRef">`)
  const mobileStyle = [
    '        :style="{',
    '          width: `${BASE_SCREEN_W}px`,',
    '          height: `${mobileLogicalHeight}px`,',
    '          transform: `scale(${mobileScale})`,',
    '          transformOrigin: \'top left\'',
    '        }"'
  ].join('\n')
  source = replaceOnce(source, mobileStyle + '\n', '')
  source = replaceOnce(source, ' :style="{ transform: `scale(${scale})` }"', '')
  source = replaceOnce(source, '    <DevConsole\n', '    <DevConsole\n      v-model:preview-form="previewForm"\n')
  return replaceOnce(source, '<style scoped>', `<style scoped>
.stage[data-preview-form] {
  gap: calc(48px + (clamp(16px, 2.5vw, 48px) - 48px) * var(--preview-progress));
}

.stage .phone-scale {
  transform: scale(var(--preview-scale, 1));
  transition: none;
}

.stage .mobile-screen {
  position: absolute;
  top: var(--preview-top, 0px);
  left: var(--preview-left, 0px);
  width: var(--screen-w);
  height: var(--screen-h);
  transform: scale(var(--preview-scale, 1));
  transform-origin: top left;
  border-radius: calc(var(--screen-radius) * var(--preview-progress)) !important;
  box-shadow: 0 0 0 calc(2px * var(--preview-progress)) #535765;
}
`)
}

const formPicker = `<label class="pc-switch-wrap pc-form-picker">
          <span>阔直板</span>
          <input
            type="checkbox"
            role="switch"
            data-testid="wide-form-switch"
            :checked="previewForm === 'wide'"
            :disabled="isRecording || isCapturing"
            @change="previewForm = $event.target.checked ? 'wide' : 'slab'"
          />
          <span class="pc-switch" aria-hidden="true"></span>
        </label>`

function previewConsole(source) {
  source = replaceOnce(source, 'const props = defineProps({', `const previewForm = defineModel('previewForm', { type: String, default: 'slab' })\n\nconst props = defineProps({`)
  const title = '<span class="pc-card-title">原型控制</span>'
  if (source.split(title).length !== 3) throw new Error('Preview console title changed')
  source = source.replaceAll(title, `${title}\n        ${formPicker}`)
  return replaceOnce(source, '<style scoped>', `<style scoped>
.pc-form-picker {
  position: relative;
  min-height: 26px;
}

.pc-switch-wrap.pc-form-picker input {
  display: block;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  z-index: 1;
  cursor: pointer;
}

.pc-form-picker input:focus-visible + .pc-switch {
  outline: 2px solid #a8bcfc;
  outline-offset: 2px;
}

.pc-form-picker input:disabled {
  cursor: default;
}

.pc-form-picker input:disabled + .pc-switch {
  opacity: .5;
}

@media (prefers-reduced-motion: reduce) {
  .pc-form-picker .pc-switch,
  .pc-form-picker .pc-switch::after {
    transition: none;
  }
}
`)
}

const transforms = new Map([
  [path.join(root, 'src/App.vue'), previewApp],
  [path.join(root, 'src/components/dev/DevConsole.vue'), previewConsole]
])

const server = await createServer({
  root,
  configFile: false,
  base: './',
  cacheDir: path.join(root, 'node_modules/.vite-preview-wide'),
  plugins: [
    {
      name: 'tos-wide-phone-visual-preview',
      enforce: 'pre',
      transform(source, id) {
        const transform = transforms.get(id)
        return transform ? { code: transform(source), map: null } : null
      }
    },
    wideHomePlugin(root),
    vue()
  ],
  server: { host: '127.0.0.1', port: 8888, strictPort: true }
})

await server.listen()
server.printUrls()
