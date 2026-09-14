import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('screenshot filename prefix is tOS_Prototype_', async () => {
  const source = await readFile(new URL('../src/composables/useCapture.js', import.meta.url), 'utf8')
  assert.match(source, /downloadBlob\(blob,\s*`tOS_Prototype_\$\{timestamp\(\)\}\.png`\)/)
  // Ensure old aurora-phone prefix is gone
  assert.doesNotMatch(source, /aurora-phone_/)
})

test('HomeFolder supports 3x3 grid, slot-9 mini cluster, and handle arc', async () => {
  const source = await readFile(new URL('../src/components/home/HomeFolder.vue', import.meta.url), 'utf8')
  assert.match(source, /folder-mini-cluster/)
  assert.match(source, /clusterAppIds/)
  assert.match(source, /folder\.appIds\.slice\(start,\s*start\s*\+\s*4\)/)
  assert.match(source, /\.size-2-2\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\);\s*grid-template-rows:\s*repeat\(3,\s*1fr\);/)
  assert.match(source, /handle-arc/)
})

test('HomeScreen and AppGrid prevent handle disappearance on touch release and click', async () => {
  const gridSource = await readFile(new URL('../src/components/system/AppGrid.vue', import.meta.url), 'utf8')
  assert.match(gridSource, /if\s*\(props\.folderOperationId === item\.folderId\)\s*\{[^}]*return/)

  const homeSource = await readFile(new URL('../src/components/system/HomeScreen.vue', import.meta.url), 'utf8')
  assert.match(homeSource, /if\s*\(pointer\.mode === 'item-ready'\)\s*\{[^}]*suppressClick\(pointer\.itemId\)/)
  assert.match(homeSource, /if\s*\(pointer\.mode === 'folder-resize'\)\s*\{[^}]*suppressClick\(pointer\.itemId\)/)
  assert.match(homeSource, /if\s*\(folderOperation\.value && folderOperation\.value\.itemId !== id\)\s*\{[^}]*folderOperation\.value = null/)
})

test('HomeFolder has comfortable icon sizing, widget corner radius, and clean badge styling', async () => {
  const source = await readFile(new URL('../src/components/home/HomeFolder.vue', import.meta.url), 'utf8')
  assert.match(source, /:size="large \? \(is2x2 \? 35 : 36\) : 12"/)
  assert.match(source, /clusterIconSize = computed\(\(\) => is2x2\.value \? 15 : 15\)/)
  assert.match(source, /border-radius:\s*var\(--radius-widget,\s*22px\);/)
  assert.match(source, /\.cluster-icon :deep\(\.icon-badge\) \{[\s\S]*display:\s*none !important;/)
  assert.match(source, /<span v-if="!large" class="folder-name"/)
  assert.match(source, /\.large \.folder-resize-handle\s*\{[\s\S]*bottom:\s*-3px;/)
})

test('homeItemMetrics ensures 2x2 folder has identical dimensions and aspect ratio to 2x2 widget', async () => {
  const { homeItemMetrics, createHomeGridProfile } = await import('../src/utils/homeLayout.js')
  const profile = createHomeGridProfile()
  const widgetMetrics = homeItemMetrics({ type: 'widget', w: 2, h: 2 }, {}, profile)
  const folderMetrics = homeItemMetrics({ type: 'folder', folderId: 'f1', w: 2, h: 2 }, { f1: { width: 2, height: 2 } }, profile)
  assert.equal(folderMetrics.width, widgetMetrics.width)
  assert.equal(folderMetrics.height, widgetMetrics.height)
  assert.equal(folderMetrics.width, folderMetrics.height)
})

test('HomeFolderOverlay maintains strict 1:1 square icon aspect ratio during collapse', async () => {
  const overlaySource = await readFile(new URL('../src/components/home/HomeFolderOverlay.vue', import.meta.url), 'utf8')
  assert.match(overlaySource, /function getIconKeyframes\(/)
  assert.match(overlaySource, /const csx = px > 0\.001 \? \(totScale \/ px\) : 1/)
  assert.match(overlaySource, /const csy = py > 0\.001 \? \(totScale \/ py\) : 1/)
  assert.match(overlaySource, /scale\(\$\{csx\},\s*\$\{csy\}\)/)
  assert.match(overlaySource, /\.folder-panel-app :deep\(\.icon-tile\)/)
})

test('HomeFolder implements seamless FLIP displacement animations across 2x2, 2x1, and 1x2', async () => {
  const folderSource = await readFile(new URL('../src/components/home/HomeFolder.vue', import.meta.url), 'utf8')
  assert.match(folderSource, /function getFolderIconPositions\(/)
  assert.match(folderSource, /watch\(\[\(\) => props\.folder\.width,\s*\(\) => props\.folder\.height\]/)
  assert.match(folderSource, /const dx = prev\.x - target\.x/)
  assert.match(folderSource, /const dy = prev\.y - target\.y/)
  assert.match(folderSource, /const ds = prev\.size \/ target\.size/)
  assert.match(folderSource, /el\.animate\(/)
  assert.match(folderSource, /folder-app-ghost/)
})

