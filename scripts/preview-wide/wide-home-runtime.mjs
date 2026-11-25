import path from 'node:path'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const modelId = 'virtual:wide-home-model'
const resolvedModelId = '\0' + modelId
const directory = path.dirname(fileURLToPath(import.meta.url))

function replace(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`Wide desktop hook changed: ${before.slice(0, 85)}`)
  return source.replace(before, () => after)
}
const useModel = (source, names) =>
  replace(source, '<script setup>', `<script setup>\nimport { ${names} } from '${modelId}'`)
const moduleModel = (source, names) => `import { ${names} } from '${modelId}'\n${source}`
const style = (source, css) => replace(source, '<style scoped>', `<style scoped>\n${css}\n`)

function catalog(source) {
  source = moduleModel(source, 'newHomeApps, wideAsset, wideIconLabels, wideGoogleIds')
  source = replace(source, 'return found ? toDesktopApp(found) : undefined', `if (!found) return undefined
  const app = toDesktopApp(found)
  if (wideIconLabels[id] || wideGoogleIds.includes(id)) {
    app.name = wideIconLabels[id] || app.name
    app.wideArtwork = wideAsset(id)
    app.image = app.wideArtwork
  }
  return app`)
  return source + `
for (const [id, name] of Object.entries(newHomeApps)) {
  registerCatalogApp({ id, name, icon: wideAsset(id), depth: 'placeholder', hiddenOnDesktop: true })
}
`
}

function drawer(source) {
  source = moduleModel(source, 'newHomeApps')
  source = replace(source, '.filter((a) => !a.hiddenOnDesktop)', '.filter((a) => !a.hiddenOnDesktop || Object.hasOwn(newHomeApps, a.id))')
  return replace(source, 'if (entry.hiddenOnDesktop) return', 'if (entry.hiddenOnDesktop && !Object.hasOwn(newHomeApps, entry.id)) return')
}

function layout(source) {
  source = moduleModel(source, 'wideItemMetrics, packWideOrder')
  const span = '  const span = itemSpan(item, folders)'
  source = replace(source, span, span + '\n  if (profile.wide && !profile.nativeMetrics) return wideItemMetrics(span, profile)')
  const signature = 'export function layoutHomeOrder(order, items, folders = {}, profile = createHomeGridProfile()) {'
  return replace(source, signature, signature + '\n  if (profile.wide && !profile.nativeGrid) return packWideOrder(order, items, folders, profile, itemSpan)')
}

function homeStore(source) {
  source = moduleModel(source, 'wideMode, newHomeApps, wideDefaultOrder, wideDockIds, wideHomeFolder, wideGridProfile')
  source += `
function designedGridProfile(metrics, mode) {
  const native = createHomeGridProfile({
    width: 360,
    height: metrics.slabHeight ?? (mode === 'slab' ? metrics.height : 788)
  })
  return wideGridProfile(metrics, native, mode === 'slab')
}
`
  source = replace(source, 'function defaultItems()', 'function defaultItems(wide)')
  source = replace(source, '  return items\n}', `  if (wide) {
    for (const id of Object.keys(newHomeApps)) items[appItemId(id)] = { id: appItemId(id), type: 'app', appId: id, w: 1, h: 1 }
    items['folder:wide-google'] = { id: 'folder:wide-google', type: 'folder', folderId: 'wide-google', w: 1, h: 1 }
  }
  return items
}`)
  source = replace(source, 'export function createDefaultHomeState() {', 'export function createDefaultHomeState(wide = false) {')
  source = replace(source, 'items: defaultItems(), folders: {}', 'items: defaultItems(wide), folders: {}')
  source = replace(source, '  deriveLayout(state)\n  return state\n}\n\nfunction safeStorage', `  if (wide) {
    state.order = wideDefaultOrder(state.items)
    state.folders[wideHomeFolder.id] = { ...wideHomeFolder, appIds: [...wideHomeFolder.appIds] }
    state.dock = wideDockIds.map(appItemId)
    state.profile = designedGridProfile({ width: wide === 'slab' ? 360 : 426, height: wide === 'slab' ? 788 : 734 }, wide)
    const extraPage = state.order.indexOf('page-break:wide-default') + 1
    state.hiddenDesktopAppIds = state.order.splice(extraPage + 20).map(id => state.items[id].appId)
  }
  deriveLayout(state)
  return state
}

function safeStorage`)
  source = replace(source, 'function reconcile(raw) {\n  const defaults = createDefaultHomeState()', 'function reconcile(raw, wide) {\n  const defaults = createDefaultHomeState(wide)')
  source = replace(source, 'const knownApps = new Set(APPS.map((app) => app.id))', "const knownApps = new Set(Object.values(defaults.items).filter(item => item.type === 'app').map(item => item.appId))")
  source = replace(source, 'export function loadHomeState(storage = safeStorage()) {', `const designedStorageKey = mode => HOME_STORAGE_KEY + (mode === 'slab' ? '.slab-design' : '.wide')

export function loadHomeState(storage = safeStorage(), wide = false) {
  if (wide) {
    try {
      const saved = storage?.getItem(designedStorageKey(wide))
      if (saved) return reconcile(JSON.parse(saved), wide)
    } catch {}
    return createDefaultHomeState(wide)
  }`)
  source = replace(source, "export const useHomeStore = defineStore('home', {\n  state: () => loadHomeState(),", `const createHomeDefinition = wide => ({
  state: () => loadHomeState(undefined, wide),`)
  source = replace(source, 'storage.setItem(HOME_STORAGE_KEY,', 'storage.setItem(wide ? designedStorageKey(wide) : HOME_STORAGE_KEY,')
  source = replace(source, 'setViewport(metrics) { this.setLayoutProfile(createHomeGridProfile(metrics)) }', 'setViewport(metrics) { this.setLayoutProfile(wide ? designedGridProfile(metrics, wide) : createHomeGridProfile(metrics)) }')
  source = replace(source, 'resetLayout() { Object.assign(this, createDefaultHomeState());', 'resetLayout() { Object.assign(this, createDefaultHomeState(wide));')
  return source + `
const useSlabHome = defineStore('home-slab-design', createHomeDefinition('slab'))
const useWideHome = defineStore('home-wide', createHomeDefinition(true))
const storeViews = new WeakMap()

export function useHomeStore(...args) {
  const slab = useSlabHome(...args)
  if (storeViews.has(slab)) return storeViews.get(slab)
  const wide = useWideHome(...args)
  const current = () => wideMode.value ? wide : slab
  const view = new Proxy({}, {
    get: (_, key) => Reflect.get(current(), key),
    set: (_, key, value) => Reflect.set(current(), key, value)
  })
  storeViews.set(slab, view)
  return view
}
`
}

function homeScreen(source) {
  source = useModel(source, 'wideMode, wideAsset, formMetrics')
  const resize = 'let resizeObserver = null'
  source = replace(source, resize, `watch(wideMode, () => {
  if (pointer) cleanup(true)
  openFolderId.value = null
  folderOperation.value = null
  measureViewport()
}, { flush: 'sync' })
watch(formMetrics, measureViewport)
${resize}`)
  source = replace(source, '  if (pointer) cleanup(true)\n  const style = getComputedStyle(root)', `  if (formMetrics.value) {
    home.setViewport(formMetrics.value)
    return
  }
  if (pointer) cleanup(true)
  const style = getComputedStyle(root)`)
  source = replace(source, '  resizeObserver.observe(rootRef.value)', '  if (!formMetrics.value) resizeObserver.observe(rootRef.value)')
  source = replace(source, "'just-unlocked':justUnlocked, 'is-editing':home.editing", "'just-unlocked':justUnlocked, 'is-editing':home.editing, 'is-wide-layout':home.profile.wide, 'is-slab-design':!wideMode")
  source = replace(source, '<PageIndicator :count=', '<PageIndicator :wide="home.profile.wide" @go="home.setPage($event)" :count=')
  const dock = '    <DockBar v-if="!home.editing"'
  source = replace(source, dock, `    <form v-if="home.profile.wide && !home.editing" class="wide-google-search" role="search"
      aria-label="Google 搜索条" action="https://www.google.com/search" target="_blank" rel="noopener" @pointerdown.stop>
      <button type="submit" aria-label="Google 搜索"><img :src="wideAsset('search-google')" alt=""></button>
      <input type="search" name="q" aria-label="搜索 Google" autocomplete="off" required>
      <img class="wide-mic" :src="wideAsset('search-mic')" alt="" aria-hidden="true">
      <img class="wide-lens" :src="wideAsset('search-lens')" alt="" aria-hidden="true">
    </form>
${dock}`)
  return style(source, `.wide-google-search {
  position: absolute;
  bottom: 4.63%;
  left: 9.15%;
  width: 81.7%;
  height: 5.72%;
  z-index: var(--z-dock);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 15px 0 11px;
  background: linear-gradient(rgba(255,255,245,.92),rgba(255,255,245,.72));
  border: .758px solid rgba(255,255,255,.2);
  border-radius: 24px;
  backdrop-filter: blur(3.788px);
  color: #181818;
}
.wide-google-search button { display:grid; place-items:center; background:transparent; border:0; padding:0; cursor:pointer; }
.wide-google-search button img { width:23px; height:23px; }
.wide-google-search input { min-width:0; flex:1; height:100%; background:none; border:0; color:#181818; outline-offset:-3px; padding:0; font:14px var(--font-stack); }
.is-slab-design .wide-google-search {bottom:3.5%;height:5.25%;left:7.8%;width:84.4%}
.wide-mic { width:13px; height:20px; }
.wide-lens { width:17px; height:17px; }`)
}

function grid(source) {
  source = useModel(source, 'modernWidgets, formMoving')
  source = replace(source, 'onBeforeUpdate(() => { previousRects = new Map([...itemElements].map(([id,el]) => [id,el.getBoundingClientRect()])) })', `let renderedProfile = props.profile
onBeforeUpdate(() => {
  previousRects = formMoving.value || renderedProfile !== props.profile
    ? new Map()
    : new Map([...itemElements].map(([id, el]) => [id, el.getBoundingClientRect()]))
})
watch(formMoving, moving => {
  if (moving) for (const el of itemElements.values()) for (const animation of el.getAnimations()) animation.cancel()
}, { flush: 'sync' })`)
  source = replace(source, 'onBeforeUpdate, onUpdated }', 'onBeforeUpdate, onUpdated, watch }')
  source = replace(source, 'onUpdated(() => {', `onUpdated(() => {
  renderedProfile = props.profile
  if (formMoving.value || !previousRects.size) return`)
  source = replace(source, '    for (const [id,el] of itemElements) {', `    if (formMoving.value) return
    for (const [id,el] of itemElements) {`)
  const clock = '<ClockWidget v-if="items[id].widgetId === \'clock\'" />'
  source = replace(source, clock, `<ClockWidget v-if="items[id].widgetId === 'clock'" :wide="profile.wide && modernWidgets" />`)
  source = replace(source, '<SmartSuggestionWidget v-else />', '<SmartSuggestionWidget v-else :wide="profile.wide && modernWidgets" />')
  source = replace(source, "if (item?.widgetId === 'clock') return '时钟'", "if (item?.widgetId === 'clock') return props.profile.wide && modernWidgets ? 'Clock' : '时钟'")
  source = replace(source, "if (item?.widgetId === 'smart') return '建议'", "if (item?.widgetId === 'smart') return props.profile.wide && modernWidgets ? 'AI Suggestions' : '建议'")
  source = replace(source, ":class=\"{ 'is-editing': editing }\" :data-page", ":class=\"{ 'is-editing': editing, 'is-wide-grid': profile.wide }\" :data-page")
  return style(source, `.stage[data-form-moving=true] .home-item {transition:none}
.is-wide-grid .widget-surface { gap: 6px; }
.is-wide-grid .widget-name { font-size:11px; text-shadow:none; }`)
}

function dock(source) {
  source = replace(source, "'has-target':dockTargetIndex != null", "'has-target':dockTargetIndex != null, 'wide-dock':profile.wide")
  return style(source, `.dock-bar.wide-dock {
  left:4.93%;right:4.93%;padding:0;border:0;background:none;box-shadow:none;
  backdrop-filter:none;-webkit-backdrop-filter:none;
}`)
}

function pagination(source) {
  source = replace(source, '  count: { type:', '  wide: { type: Boolean, default: false },\n  count: { type:')
  source = replace(source, "defineEmits(['search'])", "defineEmits(['search','go'])")
  source = replace(source, '    <Transition name="indicator-swap"', `    <nav v-if="wide" class="wide-page-dots" aria-label="桌面页面" @pointerdown.stop>
      <button type="button" class="wide-drawer-indicator" aria-label="打开应用抽屉" @click="emit('search')">=</button>
      <button v-for="i in count" :key="i" type="button" class="wide-page-dot"
        :aria-label="'第 ' + i + ' 页'" :aria-current="i - 1 === current ? 'page' : undefined" @click="emit('go', i - 1)"></button>
    </nav>
    <Transition v-else name="indicator-swap"`)
  return style(source, `.wide-page-dots{display:flex;align-items:center;gap:4px}
.wide-page-dots button{width:12px;height:20px;display:grid;place-items:center;background:none;border:0;padding:0;cursor:pointer;color:#fff6}
.wide-page-dot::before{content:'';display:block;width:6px;height:6px;border-radius:50%;background:#ffffff55}
.wide-page-dot[aria-current]::before{background:#ffffffe0}
.wide-drawer-indicator {font:600 9px/1 var(--font-stack);}`)
}

function icon(source) {
  source = useModel(source, 'wideAsset, wideIconLabels, wideGoogleIds, wideIconMask')
  source = replace(source, 'const appDisplayName = computed(() => i18n.appName(props.app.id) || props.app.name)', `const artwork = computed(() => (wideIconLabels[props.app.id] || wideGoogleIds.includes(props.app.id)) ? wideAsset(props.app.id) : null)
const appDisplayName = computed(() => wideIconLabels[props.app.id] || i18n.appName(props.app.id) || props.app.name)
const calendarWeekday = computed(() => {
  const t = today.value
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(t.year,t.month,t.date))
})`)
  source = replace(source, ":class=\"{ 'is-hidden': hidden }\"", ":class=\"{ 'is-hidden': hidden, 'has-wide-artwork': artwork }\"")
  source = replace(source, '<img v-if="app.image" :src="resolvedImage"', '<img v-if="artwork || app.image" :src="artwork || resolvedImage"')
  source = replace(source, "transform: 'scale(1.02)' }", "transform: artwork ? 'none' : 'scale(1.02)' }")
  source = replace(source, "objectFit: 'cover', transform: artwork", "objectFit: artwork ? 'contain' : 'cover', maskImage: artwork ? wideIconMask(app.id) : undefined, maskSize: '100% 100%', maskRepeat: 'no-repeat', borderRadius: artwork && app.id === 'gemini' ? '27.78%' : undefined, transform: artwork")
  // Keep the existing v-if chain intact. The live date is added beside the tile.
  const tileEnd = '      </span>'
  const tileStart = source.indexOf('class="icon-tile squircle-mask"')
  const tileAfter = source.indexOf(tileEnd, tileStart)
  if (tileStart < 0 || tileAfter < 0) throw new Error('Wide calendar anchor changed')
  source = source.slice(0, tileAfter + tileEnd.length) + `
      <svg v-if="artwork && app.id === 'calendar'" class="wide-calendar-text" viewBox="0 0 58 58" aria-hidden="true">
        <text x="29" y="14" class="wide-calendar-day">{{ calendarWeekday }}</text>
        <text x="29" y="44" class="wide-calendar-number">{{ today.date }}</text>
      </svg>` + source.slice(tileAfter + tileEnd.length)
  return style(source, `.has-wide-artwork .icon-tile { background:transparent!important;box-shadow:none;mask-image:none;-webkit-mask-image:none; }
.has-wide-artwork .icon-label { font:400 11px/15px var(--font-stack); max-width:95px; text-shadow:none;overflow:visible; }
.wide-calendar-text{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;font-family:var(--font-stack);text-anchor:middle}
.wide-calendar-day{font-size:10.741px;font-weight:700;fill:#1489fb}
.wide-calendar-number{font-size:30.074px;font-weight:500;letter-spacing:-.716px;fill:#2d3132}
.app-icon.is-hidden .wide-calendar-text{visibility:hidden}`)
}

function clock(source) {
  source = useModel(source, 'wideAsset')
  source = replace(source, 'getAnchorRect, setLaunchRect', 'setLaunchRect')
  source = replace(source, "(getAnchorRect('clock', screenEl) || rectRelativeToScreen(widgetRef.value, screenEl))", 'rectRelativeToScreen(widgetRef.value, screenEl)')
  source = replace(source, "setLaunchRect('clock', launchRect)", "setLaunchRect('clock', { ...launchRect, widgetId: 'clock' })")
  source = replace(source, 'const { hourDeg, minuteDeg, secondDeg } = useClock()', `const props = defineProps({ wide: Boolean })
const { hourDeg, minuteDeg, secondDeg, now } = useClock()
const wideTime = computed(() => new Intl.DateTimeFormat('en-GB', {hour:'2-digit',minute:'2-digit',hour12:false}).format(now.value))
const wideDate = computed(() => new Intl.DateTimeFormat('en-US', {weekday:'short',month:'short',day:'numeric'}).format(now.value))`)
  source = replace(source, "import { ref } from 'vue'", "import { computed, ref } from 'vue'")
  source = replace(source, '<div ref="widgetRef" class="widget clock-widget" @click="openClock">', `<button v-if="props.wide" ref="widgetRef" type="button" class="widget wide-clock-widget" aria-label="打开时钟" @click="openClock">
    <img :src="wideAsset('clock-face')" alt="">
    <span class="wide-clock-date">{{ wideDate }}</span>
    <span class="wide-clock-temp" aria-label="温度 26 度">26°</span>
    <time class="wide-clock-time" :aria-label="wideTime">
      <svg viewBox="0 0 154 154" aria-hidden="true">
        <text x="77" y="97" text-anchor="middle">{{ wideTime }}</text>
      </svg>
    </time>
  </button>
  <div v-else ref="widgetRef" class="widget clock-widget" @click="openClock">`)
  return style(source, `.wide-clock-widget { position:relative; display:block; padding:0; border:0; background:none; box-shadow:none; cursor:pointer; container-type:inline-size; }
.wide-clock-widget img { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
.wide-clock-date {position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;top:14%;font:600 6.9cqw/1.2 var(--font-stack);color:#0008}
.wide-clock-temp {position:absolute;left:50.5%;top:76.55%;font:600 6.9cqw/1.2 var(--font-stack);color:#0008;white-space:nowrap}
.wide-clock-time,.wide-clock-time svg {position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.wide-clock-time text {
  font-family:"Transsion Tecno pnum",-apple-system,"SF Pro Rounded","Arial Rounded MT Bold","Helvetica Neue",sans-serif;
  font-size:70px;
  font-weight:840;
  font-variation-settings:"wght" 840,"ytde" 235;
  fill:#181818;
}`)
}

function suggestions(source) {
  source = useModel(source, 'wideAsset')
  source = replace(source, "import WeatherWidget", `import { setLaunchRect } from '../../utils/appIconAnchors'
import { rectRelativeToScreen } from '../../utils/dom'
import WeatherWidget`)
  source = replace(source, 'function onPrayerClick(event) {', `function openFromSuggestions(appId, event) {
  const widget = event.currentTarget.closest('.smart-suggestion-stack')
  const rect = rectRelativeToScreen(widget, widget?.closest('.screen-view'))
  if (rect?.width) setLaunchRect(appId, { ...rect, widgetId: 'smart' })
  system.openApp(appId)
}

function onPrayerClick(event) {`)
  source = replace(source, "system.openApp('settings')", "openFromSuggestions('settings', event)")
  source = replace(source, "import { usePrayerStore }", "import { useHomeStore } from '../../stores/homeStore'\nimport { usePrayerStore }")
  source = replace(source, 'function onStackPointerDown(event) {', `const desktopHome = useHomeStore()
function onStackPointerDown(event) {
  if (props.wide && !desktopHome.editing) event.stopPropagation()`)

  source = replace(source, 'const prayerStore = usePrayerStore()', `const props = defineProps({ wide: Boolean })
const wideTiles = [
  { id:'tips', label:'Tips', art:'suggestion-tips' },
  { id:'calculator', label:'Calculator', art:'suggestion-calculator' },
  { id:'oneleap', label:'OneLeap', art:'suggestion-switch' },
  { id:'weather', label:'Weather', art:'suggestion-weather' }
]
const prayerStore = usePrayerStore()`)
  source = replace(source, '@click="onWeatherClick"', '@click="!props.wide && onWeatherClick($event)"')
  const weather = '      <WeatherWidget />'
  source = replace(source, weather, `      <div v-if="props.wide" class="wide-suggestions" aria-label="AI Suggestions">
        <button v-for="tile in wideTiles" :key="tile.id" type="button" :aria-label="tile.label" @click.stop="openFromSuggestions(tile.id, $event)">
          <img :src="wideAsset(tile.art)" alt="">
        </button>
      </div>
      <WeatherWidget v-else />`)
  return style(source, `.wide-suggestions { width:100%;height:100%;display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); grid-template-rows:repeat(2,minmax(0,1fr)); gap:8%; padding:8.4%; box-sizing:border-box; border:1px solid #fff2; border-radius:21px; background:linear-gradient(#ffffff38,#ffffff2a); }
.wide-suggestions button { display:block; min-width:0; min-height:0; padding:0; border:0; background:none; cursor:pointer; }
.wide-suggestions img { display:block; width:100%;height:100%;object-fit:contain;border-radius:27%; }`)
}

function prayerWidget(source) {
  return replace(source, "setLaunchRect('settings', rectRelativeToScreen(widgetRef.value, screenEl))", `const stack = widgetRef.value.closest('.smart-suggestion-stack')
      const rect = rectRelativeToScreen(stack || widgetRef.value, screenEl)
      if (rect?.width) setLaunchRect('settings', stack ? { ...rect, widgetId: 'smart' } : rect)`)
}

function heroTransition(source) {
  source = replace(source, 'function beginOpen({ viewportRect, anchorRect, viewportRadius = 47, onOpened } = {})', 'function beginOpen({ viewportRect, anchorRect, anchorRadius, viewportRadius = 47, reducedMotion, onOpened } = {})')
  source = replace(source, 'duration: openDuration', 'anchorRadius,\n      duration: openDuration')
  source = replace(source, "    phase.value = 'opening'", `    if (reducedMotion) {
      frame.value = deriveHeroFrame({ ...options, timeMs: openDuration })
      phase.value = 'open'
      onOpened?.()
      return
    }

    phase.value = 'opening'`)
  source = replace(source, '    startRect,\n    startRadius,', '    anchorRadius,\n    reducedMotion,\n    startRect,\n    startRadius,')
  source = replace(source, '      direction: \'close\',\n      viewportRect,\n      anchorRect,', '      direction: \'close\',\n      viewportRect,\n      anchorRect,\n      anchorRadius,')
  return replace(source, "    phase.value = 'closing'", `    if (reducedMotion) {
      phase.value = 'closed'
      onHandoff?.()
      onClosed?.()
      return
    }

    phase.value = 'closing'`)
}

function appWindow(source) {
  source = replace(source, 'computed, onBeforeUnmount', 'computed, nextTick, onBeforeUnmount')
  source = replace(source, 'const nativeIconSize = computed', `const widgetMirrorHost = ref(null)
const widgetAnchor = ref(null)
let hiddenWidget = null
let swipeFrame = null

function desktopWidget(screen, widgetId) {
  if (!widgetId) return null
  return screen?.querySelector(
    \`[data-page="\${home.currentPage}"] [data-home-item="widget:\${widgetId}"] :is(.clock-widget, .wide-clock-widget, .smart-suggestion-stack)\`
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
  return { opacity: current.iconOpacity, transform: \`scale(\${scale})\` }
})

const windowClipStyle = computed(() => {
  const current = frame.value
  if (!widgetAnchor.value || !current || isOpen.value) return clipStyle.value
  const clipPath = \`inset(0 round \${current.radius}px)\`
  return { clipPath, '--widget-hero-clip': clipPath, opacity: 1 - current.iconOpacity }
})

const nativeIconSize = computed`)
  source = replace(source, 'opacity: isOpen.value ? 0 : (frame.value?.heroFillOpacity ?? 0)', 'opacity: isOpen.value ? 0 : (widgetAnchor.value ? 1 : (frame.value?.heroFillOpacity ?? 0))')
  source = replace(source, 'if (!current || current.iconOpacity <= 0)', 'if (widgetAnchor.value || !current || current.iconOpacity <= 0)')
  source = replace(source, 'let anchor = getAnchorRect(props.appId, screen)', `const widget = prepareWidgetMirror(screen, launchAnchor.value?.widgetId)
  widgetAnchor.value = widget
  const reducedMotion = reduceWidgetMotion()
  if (widget && !reducedMotion) showWidgetMirror(widget)
  if (!widget && launchAnchor.value?.widgetId) home.hideIcon(props.appId)
  let anchor = widget?.rect || getAnchorRect(props.appId, screen)`)
  source = replace(source, '  const startRect = frame.value?.windowRect || viewport', `  const startRect = swipeFrame?.rect || frame.value?.windowRect || viewport
  const startRadius = swipeFrame?.radius ?? frame.value?.radius
  swipeFrame = null`)
  source = replace(source, '    startRadius: frame.value?.radius,', '    startRadius,')
  source = replace(source, 'watch(\n  () => system.baseLayer,', `watch(
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
  () => system.baseLayer,`)
  source = replace(source, 'phase: currentPhase, backdropStrength: current.backdropStrength', 'phase: currentPhase, backdropStrength: current.backdropStrength, widgetLaunch: Boolean(launchAnchor.value?.widgetId), showingWidgetOnOpen: Boolean(widgetAnchor.value && currentPhase === "opening" && current.iconOpacity > 0)')
  source = replace(source, '    anchorRect: anchor,', '    anchorRect: anchor,\n    anchorRadius: widget?.radius,\n    reducedMotion,')
  source = replace(source, '    onHandoff: () => home.showIcon(),', '    onHandoff: () => {\n      restoreWidget()\n      home.showIcon()\n    },')
  source = replace(source, '  launchAnchor.value = launchRect\n  home.hideIcon(props.appId)', `  launchAnchor.value = launchRect
  const widget = prepareWidgetMirror(screen, launchRect.widgetId)
  const reducedMotion = reduceWidgetMotion()
  widgetAnchor.value = widget
  if (widget && !reducedMotion) showWidgetMirror(widget)
  if (!widget) home.hideIcon(props.appId)`)
  source = replace(source, '    anchorRect: launchRect,', '    anchorRect: widget?.rect || launchRect,\n    anchorRadius: widget?.radius,\n    reducedMotion,')
  source = replace(source, '    if (!viewportRect.value) return', '    if (!viewportRect.value || reduceWidgetMotion()) return')
  source = replace(source, 'onBeforeUnmount(() => {', 'onBeforeUnmount(() => {\n  restoreWidget()')
  source = replace(source, '    :data-phase="phase"', '    :data-phase="phase"\n    :data-widget-hero="launchAnchor?.widgetId"')
  source = replace(source, ':style="clipStyle"', ':style="windowClipStyle"')
  source = replace(source, '    <div class="aw-icon-wrapper"', `    <div ref="widgetMirrorHost" class="aw-widget-mirror" :style="widgetMirrorStyle" aria-hidden="true" inert></div>

    <div class="aw-icon-wrapper"`)
  return style(source, `:global(.home-layer [data-widget-hero-source]) { visibility:hidden }
.aw-widget-mirror { position:absolute; top:0; left:0; pointer-events:none; transform-origin:top left; z-index:10 }
:global(body.is-capturing .app-window[data-widget-hero]) { inset:0 auto auto 0 !important; }
:global(body.is-capturing .app-window[data-widget-hero] .aw-clip) {
  clip-path:var(--widget-hero-clip, none) !important;
}`)
}

function folder(source) {
  return style(source, `.is-wide-layout .folder-name { font:400 11px/15px var(--font-stack); text-shadow:none; }
.stage[data-form-moving=true] .folder-apps {transition:none}
@media (prefers-reduced-motion:reduce) { .is-wide-layout .folder-apps {transition:none} }
.is-wide-layout .folder-apps.size-1-1 {
  padding:calc(var(--icon-size) * .12);gap:calc(var(--icon-size) * .035);
  grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr));
  align-items:center;justify-items:center;
}
.is-wide-layout .folder-apps.size-1-1 :deep(.app-icon),
.is-wide-layout .folder-apps.size-1-1 :deep(.app-icon-anchor),
.is-wide-layout .folder-apps.size-1-1 :deep(.icon-tile) {
  width:calc(var(--icon-size) * .207) !important;
  height:calc(var(--icon-size) * .207) !important;
}`)
}

function i18n(source) {
  source = moduleModel(source, 'newHomeApps')
  return replace(source, '|| APP_NAMES.zh[appId] || appId', '|| APP_NAMES.zh[appId] || newHomeApps[appId] || appId')
}

function screenView(source) {
  source = useModel(source, 'wideMode')
  source = replace(source, 'wallpaperStore.homeWallpaper || wallpaperStore.active || wallpaper', '(wideMode.value ? wallpaperStore.lockWallpaper : wallpaperStore.homeWallpaper) || wallpaperStore.active || wallpaper')
  source = replace(source, "if (heroVisual.value?.phase === 'open' && system.homeGestureProgress === 0)", `const widgetSwipe = heroVisual.value?.widgetLaunch && system.switcherProgress > 0.01
    if (heroVisual.value?.phase === 'open' && system.homeGestureProgress === 0 && !widgetSwipe)`)
  source = replace(source, 'const chromeLight = computed(() => {', 'const chromeLight = computed(() => {\n  if (heroVisual.value?.showingWidgetOnOpen) return true')
  return style(source, `.screen-view:has(.app-window[data-widget-hero]) .wallpaper { opacity:1 !important; }`)
}

export function wideHomePlugin(root) {
  const handlers = new Map(Object.entries({
    'src/config/apps.js':catalog, 'src/config/drawerApps.js':drawer,
    'src/composables/useHeroTransition.js':heroTransition,
    'src/stores/i18nStore.js':i18n, 'src/utils/homeLayout.js':layout, 'src/stores/homeStore.js':homeStore,
    'src/components/phone/ScreenView.vue':screenView, 'src/components/system/HomeScreen.vue':homeScreen, 'src/components/system/AppGrid.vue':grid,
    'src/components/system/DockBar.vue':dock, 'src/components/ui/PageIndicator.vue':pagination,
    'src/components/ui/AppIcon.vue':icon, 'src/components/widgets/ClockWidget.vue':clock,
    'src/components/widgets/SmartSuggestionWidget.vue':suggestions, 'src/components/widgets/PhotoWidget.vue':prayerWidget,
    'src/components/system/AppWindow.vue':appWindow, 'src/components/home/HomeFolder.vue':folder
  }).map(([file, transform]) => [path.join(root, file), transform]))
  return {
    name: 'tos-wide-native-desktop-preview',
    enforce: 'pre',
    resolveId(id) { if (id === modelId) return resolvedModelId },
    load(id) {
      if (id === resolvedModelId) return readFileSync(path.join(directory, 'wide-home-model.mjs'), 'utf8')
    },
    configureServer(server) {
      const assetFolders = { '/__wide-cuts': 'wide-home-cuts', '/__wide-icons': 'wide-home-icons' }
      for (const [route, folder] of Object.entries(assetFolders)) {
        server.middlewares.use(route, (req, res, next) => {
          const name = req.url.slice(1)
          if (!/^[a-z0-9-]+\.(png|svg)$/.test(name)) return next()
          try {
            const bytes = readFileSync(path.join(directory, folder, name))
            res.setHeader('Content-Type', name.endsWith('.svg') ? 'image/svg+xml' : 'image/png')
            res.end(bytes)
          } catch {
            res.statusCode = 404
            res.end()
          }
        })
      }
    },
    transform(source, id) {
      const handler = handlers.get(id)
      return handler ? { code: handler(source), map: null } : null
    }
  }
}
