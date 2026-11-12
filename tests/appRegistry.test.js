import test, { after, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  APP_CATALOG,
  APPS,
  DARK_BG_APPS,
  ONELEAP_APP,
  dockApps,
  getApp,
  gridApps,
  registerCatalogApp
} from '../src/config/apps.js'
import { DRAWER_APPS, getDrawerAppById } from '../src/config/drawerApps.js'
import { APP_NAMES } from '../src/locales/app-names.js'
import { createRuntime } from './helpers/vueRuntime.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APPS_DIR = path.join(ROOT, 'src/components/apps')

const DEEP_APP_IDS = [
  'aimate',
  'calendar',
  'camera',
  'clock',
  'messages',
  'oneleap',
  'phone',
  'photos',
  'settings',
  'voicememos'
]

function browserAvailable() {
  const explicit = [
    process.env.WB_CHROME,
    process.env.PLAYWRIGHT_CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean)
  if (explicit.some((p) => fs.existsSync(p))) return true
  const cache = process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library/Caches/ms-playwright')
    : path.join(os.homedir(), '.cache/ms-playwright')
  try {
    return fs.readdirSync(cache).some((d) => d.startsWith('chromium'))
  } catch {
    return false
  }
}

const E2E_SKIP = browserAvailable() ? false : '本机无可用浏览器（CI 默认跳过）'

test('只有 10 个深层应用目录，且全部提供 entry.js；28 个占位应用不建空目录', async () => {
  const dirs = fs.readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  assert.deepEqual(dirs, [...DEEP_APP_IDS].sort())

  for (const id of DEEP_APP_IDS) {
    const entryPath = path.join(APPS_DIR, id, 'entry.js')
    assert.equal(fs.existsSync(entryPath), true, `缺少 ${id}/entry.js`)
    const mod = await import(entryPath)
    const entry = mod.default
    assert.equal(entry.id, id)
    assert.equal(typeof entry.component, 'function', `${id}/entry.js 应导出动态 import loader`)
  }
})

test('统一纯数据表 APP_CATALOG 派生 APPS / DRAWER_APPS / APP_NAMES / DARK_BG_APPS', () => {
  assert.equal(APP_CATALOG.length, 39)
  assert.equal(APPS.length, 38)
  assert.equal(DRAWER_APPS.length, 38)

  // hiddenOnDesktop 应用不进桌面/抽屉，但 getApp 可查到
  assert.equal(APPS.some((a) => a.id === 'oneleap'), false)
  assert.equal(DRAWER_APPS.some((a) => a.id === 'oneleap'), false)
  assert.equal(getApp('oneleap')?.id, 'oneleap')
  assert.equal(ONELEAP_APP.id, 'oneleap')

  // darkStatusBar 派生与旧硬编码集合一致
  assert.deepEqual(new Set(DARK_BG_APPS), new Set(['camera', 'voicememos', 'clock', 'oneleap']))

  // 全部 39 个应用的 zh/en/bn 名称均从 APP_CATALOG 派生
  for (const item of APP_CATALOG) {
    for (const loc of ['zh', 'en', 'bn']) {
      assert.equal(APP_NAMES[loc][item.id], item.names[loc], `${item.id} 在 ${loc} 的名称未派生`)
    }
  }
})

test('registerCatalogApp 可单文件扩展桌面、抽屉、多语言与深色状态栏集合', () => {
  const snapshotLen = APP_CATALOG.length
  const created = registerCatalogApp({
    id: 'w2_temp_demo',
    names: { zh: '临时应用', en: 'Temp Demo', bn: 'টেম্প' },
    initial: 'L',
    pinyin: 'linshiyingyong',
    page: 1,
    darkStatusBar: true,
    heroBackground: '#10141C',
    icon: '/icons/tips.png'
  })

  try {
    assert.equal(created.id, 'w2_temp_demo')
    assert.equal(APPS.some((a) => a.id === 'w2_temp_demo'), true)
    assert.equal(gridApps.some((a) => a.id === 'w2_temp_demo'), true)
    assert.equal(dockApps.some((a) => a.id === 'w2_temp_demo'), false)
    assert.equal(getDrawerAppById('w2_temp_demo')?.name, '临时应用')
    assert.equal(APP_NAMES.en.w2_temp_demo, 'Temp Demo')
    assert.equal(DARK_BG_APPS.includes('w2_temp_demo'), true)
    assert.equal(getApp('w2_temp_demo')?.heroBackground, '#10141C')
  } finally {
    // 清理内存中的测试数据，不影响后续测试
    for (const arr of [APP_CATALOG, APPS, gridApps, DRAWER_APPS, DARK_BG_APPS]) {
      const idx = arr.findIndex((x) => (typeof x === 'string' ? x === 'w2_temp_demo' : x.id === 'w2_temp_demo'))
      if (idx >= 0) arr.splice(idx, 1)
    }
    for (const loc of ['zh', 'en', 'bn']) delete APP_NAMES[loc].w2_temp_demo
    assert.equal(APP_CATALOG.length, snapshotLen)
  }
})

test('vite.config.js 已移除手工枚举业务路径的 manualChunks', () => {
  const src = fs.readFileSync(path.join(ROOT, 'vite.config.js'), 'utf8')
  for (const legacy of ['ecosystem-apps', 'settings-account-cloud', 'settings-subpages', 'system-overlays']) {
    assert.equal(src.includes(legacy), false, `vite.config.js 不应保留手工业务分包 ${legacy}`)
  }
})

test('运行时：glob 汇总 10 个深层应用、pointerdown 触发预载、AppWindow 等待异步组件挂载后才置位 contentReady', { skip: E2E_SKIP }, async (t) => {
  let rt = null
  t.after(async () => { if (rt) await rt.close() })
  rt = await createRuntime()

  // 1) 验证 registry.js 在 Vite 中通过 glob 汇总 10 个 entry.js，未注册应用回落 PlaceholderApp
  const regCheck = await rt.evaluate(async () => {
    const reg = await import('/src/components/apps/registry.js')
    const PlaceholderApp = (await import('/src/components/apps/PlaceholderApp.vue')).default
    const ids = Object.keys(reg.appEntries).sort()
    const fallbackMatches = reg.resolveAppComponent('weather') === PlaceholderApp
    return {
      ids,
      compCount: Object.keys(reg.appComponents).length,
      fallbackMatches,
      preloadedBefore: reg.isAppPreloaded('calendar')
    }
  })
  assert.deepEqual(regCheck.ids, [...DEEP_APP_IDS].sort())
  assert.equal(regCheck.compCount, 10)
  assert.equal(regCheck.fallbackMatches, true)
  assert.equal(regCheck.preloadedBefore, false)

  // 2) 验证 AppIcon pointerdown 触发 preloadApp，且之后 resolveAppComponent 返回已缓存同步组件
  const appIconHandle = await rt.mount('/src/components/ui/AppIcon.vue', {
    app: getApp('calendar'),
    homeAnchor: false
  })
  await rt.dispatch(appIconHandle, '.app-icon', 'pointerdown', {}, 250)
  const afterDown = await rt.evaluate(async () => {
    const reg = await import('/src/components/apps/registry.js')
    const calComp = (await import('/src/components/apps/calendar/CalendarApp.vue')).default
    return {
      preloaded: reg.isAppPreloaded('calendar'),
      resolvedIsSync: reg.resolveAppComponent('calendar') === calComp
    }
  })
  assert.equal(afterDown.preloaded, true)
  assert.equal(afterDown.resolvedIsSync, true)
  await rt.unmount(appIconHandle)

  // 3) 验证 AppWindow 对已预载组件与慢加载异步组件的 contentReady 行为
  const asyncWindowResult = await rt.evaluate(async () => {
    const { createApp, h, nextTick } = window.__wb
    const { createPinia, setActivePinia } = window.__wb
    const AppWindow = (await import('/src/components/system/AppWindow.vue')).default
    const reg = await import('/src/components/apps/registry.js')
    const { screenRef } = await import('/src/utils/screenRef.js')

    // 临时向 appComponents 注入一个可手动控制的慢加载异步组件（async setup 触发 Suspense 挂起）
    let resolveAsync
    const pendingPromise = new Promise((r) => { resolveAsync = r })
    reg.appComponents.__test_slow_app = {
      async setup() {
        await pendingPromise
        return () => h('div', { class: 'slow-loaded-child' }, 'loaded')
      }
    }

    const host = document.createElement('div')
    host.className = 'wb-host'
    document.body.appendChild(host)
    screenRef.el = host

    const pinia = createPinia()
    setActivePinia(pinia)
    const app = createApp({ render: () => h(AppWindow, { appId: '__test_slow_app' }) })
    app.use(pinia)
    app.mount(host)
    await nextTick()

    const win = host.querySelector('.app-window')
    const contentEl = host.querySelector('.aw-content')
    const surfaceEl = host.querySelector('.aw-app-surface')
    const beforeResolve = {
      readyAttr: win?.getAttribute('data-content-ready'),
      contentOpacity: contentEl ? getComputedStyle(contentEl).opacity : null,
      surfaceOpacity: surfaceEl ? getComputedStyle(surfaceEl).opacity : null
    }

    // 异步组件解析并挂载真实子节点
    resolveAsync()
    await new Promise((r) => setTimeout(r, 80))
    await nextTick()

    const afterResolve = {
      readyAttr: win?.getAttribute('data-content-ready'),
      childText: host.querySelector('.slow-loaded-child')?.textContent || null
    }

    app.unmount()
    host.remove()
    delete reg.appComponents.__test_slow_app
    return { beforeResolve, afterResolve }
  })

  assert.equal(asyncWindowResult.beforeResolve.readyAttr, 'false', '异步组件未挂载前 contentReady 必须为 false')
  assert.equal(asyncWindowResult.beforeResolve.contentOpacity, '0', '异步组件未挂载前 .aw-content 必须保持透明')
  assert.equal(asyncWindowResult.beforeResolve.surfaceOpacity, '0', '异步组件未挂载前 .aw-app-surface 不得提前盖出白底')
  assert.equal(asyncWindowResult.afterResolve.readyAttr, 'true', '异步组件挂载后 contentReady 应置为 true')
  assert.equal(asyncWindowResult.afterResolve.childText, 'loaded')
})
