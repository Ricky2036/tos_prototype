import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('desktop uses pointer events, dwell paging and gesture cancellation cleanup', async () => {
  const source = await read('../src/components/system/HomeScreen.vue')
  assert.match(source, /pointercancel/)
  assert.match(source, /releasePointerCapture/)
  assert.match(source, /onWindowBlur/)
  assert.match(source, /setTimeout\(\(\) =>[\s\S]*400/)
  assert.match(source, /resolveDesktopPage/)
  assert.match(source, /previewOrder/)
  assert.match(source, /insertionIndexAtPoint/)
  assert.match(source, /clientPointToHome/)
  assert.match(source, /root\.offsetWidth \/ rect\.width/)
  assert.match(source, /\.drag-ghost\{position:absolute/)
})

test('motion polish includes FLIP, removal animation and reduced-motion support', async () => {
  const [grid, dock] = await Promise.all([
    read('../src/components/system/AppGrid.vue'),
    read('../src/components/system/DockBar.vue')
  ])
  assert.match(grid, /getBoundingClientRect/)
  assert.match(grid, /duration:220/)
  assert.match(grid, /is-removing/)
  assert.match(grid, /prefers-reduced-motion/)
  assert.match(dock, /is-removing/)
})

test('multi-select drag uses a gathered stack and fans every selected item into its destination', async () => {
  const [home, grid, store] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'),
    read('../src/components/system/AppGrid.vue'),
    read('../src/stores/homeStore.js')
  ])
  assert.match(home, /drag-cluster-stack/)
  assert.match(home, /dragging\.value = \{ id:pointer\.itemId, ids,/)
  assert.match(home, /moveOrderGroup\(previewOrder\.value, dragging\.value\.ids/)
  assert.match(home, /async function animateMultiDrop/)
  assert.match(home, /duration:360 \+ Math\.min\(index,5\)\*18/)
  assert.match(home, /settlingIds\.value = \[\.\.\.ids\]/)
  assert.match(grid, /is-settling-destination/)
  assert.match(grid, /draggingIds/)
  assert.match(store, /moveItems\(itemIds, page, index, preserveSelection = true\)/)
})

test('desktop grid renders adaptive pixel frames and preserves square widgets', async () => {
  const grid = await read('../src/components/system/AppGrid.vue')
  assert.match(grid, /position:absolute/)
  assert.match(grid, /translate3d\(\$\{p\.x\}px,\$\{p\.y\}px,0\)/)
  assert.match(grid, /profile\.iconSize \* profile\.compactScale/)
  assert.match(grid, /\.home-item\.is-widget \{[^}]*aspect-ratio:1\/1/)
  assert.doesNotMatch(grid, /\.home-item\.is-large \{ align-items:stretch; \}/)
})

test('desktop observes the unscaled viewport and derives dock and indicator geometry from its profile', async () => {
  const [home, dock] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'),
    read('../src/components/system/DockBar.vue')
  ])
  assert.match(home, /new ResizeObserver/)
  assert.match(home, /root\.offsetWidth/)
  assert.match(home, /root\.offsetHeight/)
  assert.match(home, /home\.setViewport/)
  assert.match(home, /home\.profile\.indicatorY/)
  assert.match(dock, /profile\.dockRect\.height/)
  assert.match(dock, /profile\.height-profile\.dockRect\.bottom/)
})

test('folders expose all four sizes, renaming and app drag-out', async () => {
  const [home, overlay] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'),
    read('../src/components/home/HomeFolderOverlay.vue')
  ])
  assert.match(home, /\[\[1,1\],\[2,1\],\[1,2\],\[2,2\]\]/)
  assert.match(home, /createSelectedFolder/)
  assert.match(home, /removeAppFromFolder/)
  assert.match(overlay, /文件夹名称/)
})

test('page dots replace search during paging and restore it after five seconds', async () => {
  const [home, indicator] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'),
    read('../src/components/ui/PageIndicator.vue')
  ])
  assert.match(home, /restoreSearchAfterPaging/)
  assert.match(home, /}, 5000\)/)
  assert.match(home, /:show-pages="home\.editing \|\| showPageDots"/)
  assert.match(indicator, /v-if="showPages"/)
  assert.match(indicator, /indicator-swap/)
})

test('desktop edit mode matches the reference action and selection surfaces', async () => {
  const [home, grid, folder] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'),
    read('../src/components/system/AppGrid.vue'),
    read('../src/components/home/HomeFolderOverlay.vue')
  ])
  assert.match(home, /class="edit-actions home-editor"/)
  assert.match(home, /class="edit-dashboard home-editor"/)
  assert.match(home, /class="layout-picker home-editor"/)
  assert.match(home, /<DockBar v-if="!home\.editing"/)
  assert.match(home, /removeSelectedFromDesktop/)
  assert.doesNotMatch(grid, /class="remove-badge"/)
  assert.match(grid, /\.selection-mark \{[^}]*right:-\d+px/)
  assert.match(grid, /backdrop-filter:blur\(12px\) saturate\(180%\)/)
  assert.match(folder, /background:transparent/)
  assert.doesNotMatch(folder, /class="folder-close"/)
})

test('short app presses remain native clicks and empty taps exit editing', async () => {
  const home = await read('../src/components/system/HomeScreen.vue')
  assert.match(home, /captureTarget:event\.currentTarget, captureEl:null/)
  assert.match(home, /pointer\.captureTarget\.setPointerCapture/)
  assert.match(home, /exitEditingOnTap:home\.editing/)
  assert.match(home, /home\.setEditing\(false\)/)
})

test('dock editing, protected uninstall and library filtering are wired to home state', async () => {
  const [home, dock, library] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'),
    read('../src/components/system/DockBar.vue'),
    read('../src/components/system/AppLibrary.vue')
  ])
  assert.match(home, /核心应用不可卸载/)
  assert.match(home, /moveToDock/)
  assert.match(home, /moveFromDock/)
  assert.match(home, /壁纸与个性化：开发中/)
  assert.match(dock, /repeat\(4,1fr\)/)
  assert.match(library, /home\.appInstalled/)
})

test('folders close from blank glass and render special app icons through AppIcon', async () => {
  const [overlay, folder] = await Promise.all([
    read('../src/components/home/HomeFolderOverlay.vue'),
    read('../src/components/home/HomeFolder.vue')
  ])
  assert.match(overlay, /onOverlayClick/)
  assert.match(overlay, /folder-panel-app,.folder-title/)
  assert.match(overlay, /@pointerdown\.stop/)
  assert.doesNotMatch(folder, /getApp\(appId\)\?\.image/)
  assert.match(folder, /<AppIcon :app="getApp\(appId\)"/)
})

test('desktop accepts dominant horizontal trackpad wheel gestures for paging', async () => {
  const source = await read('../src/components/system/HomeScreen.vue')
  assert.match(source, /function onWheel/)
  assert.match(source, /Math\.abs\(event\.deltaX\) <= Math\.abs\(event\.deltaY\)/)
  assert.match(source, /wheelDeltaX/)
  assert.match(source, /@wheel="onWheel"/)
})
test('item long press starts direct drag without entering desktop editing', async () => {
  const [home, grid, dock] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'),
    read('../src/components/system/AppGrid.vue'),
    read('../src/components/system/DockBar.vue')
  ])
  assert.match(home, /setTimeout\(\(\) => \{[\s\S]*startItemDrag\(pointer\.startX,pointer\.startY\)/)
  assert.doesNotMatch(home, /home\.setEditing\(true\); pointer\.mode = 'item-ready'/)
  assert.match(home, /source\?\.cloneNode\(true\)/)
  assert.match(home, /grabX:point\.x-left,grabY:point\.y-top/)
  assert.match(home, /suppressClick\(pointer\.itemId\)/)
  assert.match(grid, /suppressClickId/)
  assert.match(dock, /suppressClickId/)
})

test('empty long press and touch or trackpad pinch enter desktop editing', async () => {
  const home = await read('../src/components/system/HomeScreen.vue')
  assert.match(home, /onRootPointerDownCapture/)
  assert.match(home, /pinch\.initial-distance >= 36/)
  assert.match(home, /distance <= pinch\.initial\*\.86/)
  assert.match(home, /event\.ctrlKey/)
  assert.match(home, /pinchWheelDelta >= 24/)
  assert.match(home, /system\.baseLayer !== 'home'/)
  assert.match(home, /setTimeout\(enterEditingFromEmptyPress,450\)/)
  assert.match(home, /function enterEditingFromEmptyPress\(\)[\s\S]*releasePointerCapture[\s\S]*home\.setEditing\(true\)/)
})

test('clock and calendar use one canonical vector canvas at every rendered size', async () => {
  const icon = await read('../src/components/ui/AppIcon.vue')
  assert.match(icon, /class="clock-face" width="100%" height="100%" viewBox="0 0 60 60"/)
  assert.match(icon, /class="calendar-face" width="100%" height="100%" viewBox="0 0 60 60"/)
  assert.match(icon, /class="calendar-weekday"/)
  assert.match(icon, /class="calendar-date"/)
  assert.match(icon, /v-for="i in 12"/)
  assert.doesNotMatch(icon, /compactSpecial|is-compact-special/)
})

test('folder overlay launches apps from controlled anchors and animates every icon from its source rect', async () => {
  const [home, overlay, icon, folder] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'), read('../src/components/home/HomeFolderOverlay.vue'),
    read('../src/components/ui/AppIcon.vue'), read('../src/components/home/HomeFolder.vue')
  ])
  assert.match(icon, /launchOnClick/)
  assert.match(icon, /emit\('activate', anchorRef\.value\)/)
  assert.match(folder, /data-folder-shell/)
  assert.match(folder, /:data-folder-app="appId"/)
  assert.match(home, /function launchFolderApp/)
  assert.match(home, /setLaunchRect\(appId,launchRect\)/)
  assert.match(overlay, /phase\.value = 'opening'/)
  assert.match(overlay, /phase\.value = 'closing'/)
  assert.match(overlay, /rectTransform\(props\.origin\?\.iconRects\?\.\[appId\]/)
  assert.match(overlay, /@click\.stop="launch\(appId,\$event\.currentTarget\.querySelector/)
})

test('folder operation mode exposes a resize handle with transient four-size preview', async () => {
  const [home, grid, folder] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'), read('../src/components/system/AppGrid.vue'), read('../src/components/home/HomeFolder.vue')
  ])
  assert.match(home, /folderOperation = ref/)
  assert.match(home, /folderResize = ref/)
  assert.match(home, /mode:'folder-resize'/)
  assert.match(home, /const hysteresis = 8/)
  assert.match(home, /home\.resizeFolder\(pointer\.folderId,folderResize\.value\.width,folderResize\.value\.height\)/)
  assert.match(grid, /folder-resize-pointerdown/)
  assert.match(folder, /class="folder-resize-handle"/)
  assert.match(folder, /width:36px;height:36px/)
})

test('folder merge candidate arms before committing and flies both icons into stable slots', async () => {
  const [home, grid, folder] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'), read('../src/components/system/AppGrid.vue'), read('../src/components/home/HomeFolder.vue')
  ])
  assert.match(home, /folderMergeCandidate = ref/)
  assert.match(home, /folderMergeCandidate\.value = candidate \? \{ id:candidate,armed:false \}/)
  assert.match(home, /}, 420\)/)
  assert.match(home, /function cloneMergeAnchor/)
  assert.match(home, /function animateMergeAnchors/)
  assert.match(home, /duration:280/)
  assert.match(grid, /is-folder-candidate/)
  assert.match(grid, /folder-candidate-in 140ms/)
  assert.match(folder, /is-merging/)
})

test('desktop application labels use the corrected Chinese names', async () => {
  const [apps, names] = await Promise.all([
    read('../src/config/apps.js'), read('../src/locales/app-names.js')
  ])
  for (const source of [apps, names]) {
    assert.match(source, /notes:\s*'记事本'|id: 'notes',[\s\S]*?name: '记事本'/)
    assert.match(source, /voicememos:\s*'录音机'|id: 'voicememos',[\s\S]*?name: '录音机'/)
    assert.match(source, /calculator:\s*'计算器'|id: 'calculator',[\s\S]*?name: '计算器'/)
  }
})

test('desktop edit mode includes safe layout transform, done capsule button, and status bar dimming', async () => {
  const [home, grid] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'),
    read('../src/components/system/AppGrid.vue')
  ])
  assert.match(home, /class="done-pill" @click="home\.setEditing\(false\)">完成<\/button>/)
  assert.match(home, /class="action-icon"/)
  assert.match(home, /:global\(\.screen-view:has\(\.home-screen\.is-editing\)\s*\.status-bar\)/)
  assert.match(grid, /\.app-grid\.is-editing\s*\{\s*transform:translate3d\(0,20px,0\) scale\(\.85\)/)
})

test('2x2 large folders launch apps directly with hero transition and keep overlay for title/blank taps', async () => {
  const [folder, grid, home] = await Promise.all([
    read('../src/components/home/HomeFolder.vue'),
    read('../src/components/system/AppGrid.vue'),
    read('../src/components/system/HomeScreen.vue')
  ])
  assert.match(folder, /defineEmits\(\[['"]open['"],\s*['"]resize-pointerdown['"],\s*['"]launch-app['"]\]\)/)
  assert.match(folder, /emit\('launch-app',\s*appId,\s*anchor\)/)
  assert.match(folder, /@click="onAppClick\(appId,\s*\$event\)"/)
  assert.match(grid, /isLarge\s*&&\s*isFolderApp/)
  assert.match(grid, /@launch-app="\(appId,\s*anchor\)\s*=>\s*emit\('launch-app',\s*appId,\s*anchor\)"/)
  assert.match(home, /@launch-app="launchFolderApp"/)
  assert.match(home, /function launchFolderApp\(appId,\s*anchor\)/)
})

test('smart suggestion widget supports vertical swipe gestures with tap separation', async () => {
  const widget = await read('../src/components/widgets/SmartSuggestionWidget.vue')
  assert.match(widget, /@pointerdown="onStackPointerDown"/)
  assert.match(widget, /@pointermove="onStackPointerMove"/)
  assert.match(widget, /@pointerup="onStackPointerUp"/)
  assert.match(widget, /@click\.capture="onStackClickCapture"/)
  assert.match(widget, /Math\.abs\(dy\)\s*>\s*Math\.abs\(dx\)\s*\*\s*1\.2/)
  assert.match(widget, /toggleMode\(\)/)
})

test('cross-screen icon drag implements iOS-style spring edge dwell, peek offset and haptic pulse', async () => {
  const source = await read('../src/components/system/HomeScreen.vue')
  assert.match(source, /edgePeekOffset/)
  assert.match(source, /edgeThreshold = 38/)
  assert.match(source, /edgePeekOffset\.value = direction === 1 \? -12 : 12/)
  assert.match(source, /transform 440ms cubic-bezier\(.22, 1, .36, 1\)/)
  assert.match(source, /triggerEdgePageFlip/)
  assert.match(source, /600/)
  assert.match(source, /isPageFlipping/)
  assert.match(source, /\.drag-ghost\.is-page-flipping/)
  assert.match(source, /\[\.\.\.basePages, \[\]\]/)
})

test('folder app launch computes unscaled anchor, resets openFolderId, and provides seamless dissolution animation', async () => {
  const [home, anchors, store] = await Promise.all([
    read('../src/components/system/HomeScreen.vue'),
    read('../src/utils/appIconAnchors.js'),
    read('../src/stores/homeStore.js')
  ])

  assert.match(home, /rectRelativeToScreen\(anchor,\s*screen\)/)
  assert.match(home, /openFolderId\.value\s*=\s*null/)
  assert.match(home, /finishFolderApp/)
  assert.match(home, /animateFolderDissolve/)
  assert.match(home, /shellClone\.animate/)

  assert.match(anchors, /Number\.isFinite\(rect\.x\)\s*\?\s*rect\.x\s*:\s*\(Number\.isFinite\(rect\.left\)/)
  assert.match(anchors, /data-folder-app/)

  assert.match(store, /folder\.appIds\.length\s*<=\s*1\s*\)\s*this\.removeFolder\(folderId,\s*true\)/)
  assert.match(store, /cleanupDissolvedFolders/)
})

test('normalizeHomeAnchorRect safely derives x/y from left/top without producing NaN', async () => {
  const { normalizeHomeAnchorRect } = await import('../src/utils/appIconAnchors.js')
  const legacyRect = { left: 120.25, top: 340.5, width: 60, height: 60 }
  const normalized = normalizeHomeAnchorRect(legacyRect)
  assert.equal(normalized.x, 120.25)
  assert.equal(normalized.y, 340.5)
  assert.equal(Number.isNaN(normalized.x), false)
  assert.equal(Number.isNaN(normalized.y), false)
  assert.equal(normalized.cx, 150.25)
  assert.equal(normalized.cy, 370.5)
})

test('homeStore auto-dissolves single-app folders on removeAppFromFolder and ignores <=1 app folders in reconcile', async () => {
  const storeSource = await read('../src/stores/homeStore.js')
  assert.match(storeSource, /appIds\.length\s*>\s*1/)
  assert.match(storeSource, /folder\.appIds\.length\s*<=\s*1\s*\)\s*this\.removeFolder\(folderId,\s*true\)/)
})

test('folders animate into desktop when unlocking with staggered enter delay', async () => {
  const [folder, grid] = await Promise.all([
    read('../src/components/home/HomeFolder.vue'),
    read('../src/components/system/AppGrid.vue')
  ])
  assert.match(grid, /<HomeFolder[^>]*:enter-delay="120 \+ index \* 28"/)
  assert.match(folder, /--enter-delay/)
  assert.match(folder, /just-unlocked.*\.home-folder/)
  assert.match(folder, /folder-enter/)
})

test('folder collapse preserves smooth background backdrop blur and seamless desktop recovery without opacity transition delay', async () => {
  const [grid, overlay, folder] = await Promise.all([
    read('../src/components/system/AppGrid.vue'),
    read('../src/components/home/HomeFolderOverlay.vue'),
    read('../src/components/home/HomeFolder.vue')
  ])
  // Base home-item must not transition opacity to avoid 160ms recovery blink
  assert.doesNotMatch(grid, /\.home-item\s*\{[^}]*opacity\s+160ms/)
  assert.match(grid, /\.home-item\.is-dragging-source\s*\{[^}]*transition:\s*opacity 160ms ease/)
  // Folder overlay uses smooth backdrop curve and box-shadow dissipation
  assert.match(overlay, /easeBackdropClose\s*=\s*'cubic-bezier\(0\.33,\s*0,\s*0\.67,\s*1\)'/)
  assert.match(overlay, /boxShadow:\s*'0 0 0 rgba\(0, 0, 0, 0\)'/)
  assert.match(overlay, /borderColor:\s*'rgba\(255, 255, 255, 0\)'/)
  assert.doesNotMatch(overlay, /\.folder-backdrop\s*\{[^}]*transform:\s*translateZ\(0\)/)
  // Desktop folder does not transition background color
  assert.doesNotMatch(folder, /\.folder-apps\{[^}]*background 180ms ease/)
})


