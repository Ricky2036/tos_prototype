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
  source = replaceOnce(source, '<script setup>', `<script setup>
import { wideMode, formMetrics, formMoving as desktopFormMoving } from '${modelId}'`)
  source = replaceOnce(source, 'const previewForm = ref(readInitialForm())', `const previewForm = ref(readInitialForm())
watch(previewForm, form => { wideMode.value = form === 'wide' }, { immediate: true, flush: 'sync' })`)
  return replaceOnce(source, '  stage.dataset.formMoving = String(formMoving.value)', `  stage.dataset.formMoving = String(formMoving.value)
  desktopFormMoving.value = formMoving.value
  const geometry = previewGeometry.value
  formMetrics.value = {
    width: parseFloat(geometry['--screen-w']),
    height: parseFloat(geometry['--screen-h']),
    progress: geometry['--preview-progress'],
    slabHeight: isMobile.value ? mobileLogicalHeight.value : BASE_SCREEN_H,
    wideHeight: WIDE_SCREEN_H
  }`)
}

const appPath = path.join(root, 'src/App.vue')

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
        return id === appPath ? { code: previewApp(source), map: null } : null
      }
    },
    wideHomePlugin(root),
    vue()
  ],
  server: { host: '127.0.0.1', port: 8888, strictPort: true }
})

await server.listen()
server.printUrls()
