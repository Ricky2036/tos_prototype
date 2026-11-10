import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')

const DOCK = 'src/components/ui/SettingsSearchDock.vue'
const CLEAR = 'src/components/ui/SearchClearButton.vue'
const EMPTY = 'src/components/ui/SearchEmptyState.vue'

/* ==================== 真机参数契约 ==================== */
test('搜索 Dock 两态参数与真机一致', () => {
  const src = strip(read(DOCK))
  assert.match(src, /SettingsSearchBar/, '未激活态复用首页同款胶囊（含麦克风）')
  assert.match(src, /data-sfd-back/, '激活态必须有圆形返回按钮')
  assert.match(src, /data-sfd-clear/, '输入后必须有清除按钮')
  assert.match(src, /\.sfd\.is-idle \{[^}]*left: 27px;[^}]*right: 27px;[^}]*bottom: 25px;/s, '未激活：左右 27 / 离底 25')
  assert.match(src, /\.sfd\.is-active \{[^}]*gap: 12px;[^}]*padding: 12px 16px 25px 16px;/s, '激活：左右 16 / 间距 12 / 离底 25')
  assert.match(src, /\.sfd-back \{[^}]*width: 44px;[^}]*height: 44px;[^}]*border-radius: 50%;/s, '返回圆钮 44')
  assert.match(src, /\.sfd-capsule \{[^}]*height: 44px;[^}]*border-radius: 22px;/s, '胶囊 44 高 / 22 圆角')
  assert.match(src, /watch\(\(\) => props\.active[\s\S]*inputRef\.value\?\.focus\(\)/, '激活后自动聚焦输入')
  assert.match(src, /function back\(\)[\s\S]*emit\('update:modelValue', ''\)/, '返回时清空搜索词')
})

test('清除按钮：深灰实心圆 + 白色圆角叉（真机 srch_04_committed）', () => {
  const src = strip(read(CLEAR))
  assert.match(src, /data-search-clear/)
  assert.match(src, /<circle cx="12" cy="12" r="10" fill="#8E8E93"/, '必须是深灰实心圆')
  assert.match(src, /stroke="#FFFFFF"[\s\S]*stroke-width="2\.2"[\s\S]*stroke-linecap="round"/, '白色圆角叉')
  assert.doesNotMatch(src, /line x1="18" y1="6"/, '旧的双线灰叉已废弃')
  const bar = strip(read('src/components/ui/SettingsSearchBar.vue'))
  assert.match(bar, /SearchClearButton/, '首页非激活态也用同一个清除按钮')
  assert.doesNotMatch(bar, /btn-clear/)
})

test('空态页：叠加卡片 + 放大镜插画 + 真机文案', () => {
  const src = strip(read(EMPTY))
  assert.match(src, /data-search-empty/)
  assert.match(src, /暂无结果，试试其他关键词/, '真机文案')
  assert.match(src, /<rect[^>]*rx="15"/, '叠加卡片')
  assert.match(src, /<circle[^>]*fill="url\(#ses-lens\)"/, '放大镜镜片')
  assert.match(src, /ses-card[\s\S]*ses-lens/, '插画渐变')
  const search = strip(read('src/components/apps/settings/SettingsSearch.vue'))
  const list = strip(read('src/components/ui/RegisteredAppList.vue'))
  assert.match(search, /SearchEmptyState/)
  assert.match(list, /SearchEmptyState/)
  assert.doesNotMatch(search, /未找到相关设置/, '旧文案已移除')
  assert.doesNotMatch(search, /results-empty/, '旧的线性放大镜空态已移除')
})

/* ==================== 防回潮：四处调用方 ==================== */
test('设置首页 / 搜索页 / 两个应用列表页统一用同一个 Dock', () => {
  const home = strip(read('src/components/apps/settings/SettingsApp.vue'))
  const search = strip(read('src/components/apps/settings/SettingsSearch.vue'))
  const dnd = strip(read('src/components/apps/settings/dnd/DndAppsPage.vue'))
  const g3 = strip(read('src/components/apps/settings/group3/Group3SubPage.vue'))

  assert.match(home, /SettingsSearchDock[\s\S]*:active="false"/, '首页是非激活态')
  assert.match(home, /@activate="push\('search'\)"/, '首页点击仍进全屏搜索页')
  assert.match(search, /SettingsSearchDock[\s\S]*:active="true"/, '搜索页是激活态')
  assert.match(search, /@back="emit\('back'\)"/)
  assert.match(dnd, /:active="searchActive"/)
  assert.match(g3, /:active="searchActive"/)
  assert.match(dnd, /@activate="searchActive = true"/)
  assert.match(g3, /@activate="searchActive = true"/)
  assert.match(dnd, /function closeSearch\(\)/)
  assert.match(g3, /function closeSearch\(\)/)

  // ⛔ 应用列表页不许再直接用非激活胶囊拼搜索
  for (const [name, src] of [['DndAppsPage', dnd], ['Group3SubPage', g3]]) {
    assert.doesNotMatch(src, /import SettingsSearchBar/, `${name} 不得直接用 SettingsSearchBar`)
    assert.doesNotMatch(src, /g3-floating-search|dnd-floating-search/, `${name} 不得再自绘悬浮搜索栏`)
  }
})

test('守卫有牙齿：把激活态返回按钮 / 深灰圆拿掉都要报红', () => {
  const dock = strip(read(DOCK))
  assert.match(dock, /data-sfd-back/)
  assert.doesNotMatch(dock.replace('data-sfd-back', 'data-gone'), /data-sfd-back/)
  const clear = strip(read(CLEAR))
  assert.match(clear, /fill="#8E8E93"/)
  assert.doesNotMatch(clear.replace('fill="#8E8E93"', 'fill="#FFFFFF"'), /fill="#8E8E93"/)
  const empty = strip(read(EMPTY))
  assert.match(empty, /暂无结果，试试其他关键词/)
  assert.doesNotMatch(empty.replace('暂无结果，试试其他关键词', '无数据'), /暂无结果，试试其他关键词/)
})
