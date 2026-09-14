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

test('HomeFolder has comfortable icon sizing, 18px corner radius, and clean badge styling', async () => {
  const source = await readFile(new URL('../src/components/home/HomeFolder.vue', import.meta.url), 'utf8')
  assert.match(source, /:size="large \? \(is2x2 \? 35 : 36\) : 12"/)
  assert.match(source, /clusterIconSize = computed\(\(\) => is2x2\.value \? 15 : 15\)/)
  assert.match(source, /border-radius:\s*18px;/)
  assert.match(source, /\.cluster-icon :deep\(\.icon-badge\) \{[\s\S]*display:\s*none !important;/)
})

