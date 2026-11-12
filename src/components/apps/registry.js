import { defineAsyncComponent } from 'vue'
import PlaceholderApp from './PlaceholderApp.vue'
import { registerCatalogApp } from '../../config/apps'

/**
 * 深度应用自注册汇总表：通过 Vite `import.meta.glob` 自动发现所有 `apps/<id>/entry.js`，
 * 未注册的应用自动回落到 PlaceholderApp。
 *
 * 每个 entry.js 只需导出：
 *   export default { id, component: () => import('./XxxApp.vue') }
 * 也可附带可选元数据字段（names/page/icon/heroBackground 等）实现单文件自注册。
 */
const entryModules = import.meta.glob('./*/entry.js', { eager: true })

const appLoaders = Object.create(null)
const preloadCache = new Map()
const resolvedComponents = new Map()

export const appEntries = Object.create(null)
export const appComponents = Object.create(null)

/** 预加载指定深层应用的异步组件并缓存，供图标 pointerdown 触发以消除展开白闪。 */
export function preloadApp(appId) {
  const loader = appLoaders[appId]
  if (!loader) return null
  if (!preloadCache.has(appId)) {
    const pending = Promise.resolve(loader())
      .then((mod) => {
        const comp = mod?.default || mod
        resolvedComponents.set(appId, comp)
        return comp
      })
      .catch((err) => {
        preloadCache.delete(appId)
        throw err
      })
    preloadCache.set(appId, pending)
  }
  return preloadCache.get(appId)
}

/** 是否已完成该应用组件的异步加载（已在缓存中可同步挂载）。 */
export function isAppPreloaded(appId) {
  return resolvedComponents.has(appId)
}

/** 获取用于渲染的组件：已预载则直接返回同步组件，否则返回可被 Suspense 感知的异步组件；未注册回落 PlaceholderApp。 */
export function resolveAppComponent(appId) {
  if (resolvedComponents.has(appId)) return resolvedComponents.get(appId)
  return appComponents[appId] || PlaceholderApp
}

for (const mod of Object.values(entryModules)) {
  const entry = mod?.default || mod
  if (!entry?.id || !entry?.component) continue

  appEntries[entry.id] = entry
  registerCatalogApp(entry)

  if (typeof entry.component === 'function') {
    appLoaders[entry.id] = entry.component
    appComponents[entry.id] = defineAsyncComponent({
      loader: () => preloadApp(entry.id),
      suspensible: true
    })
  } else {
    resolvedComponents.set(entry.id, entry.component)
    appComponents[entry.id] = entry.component
  }
}
