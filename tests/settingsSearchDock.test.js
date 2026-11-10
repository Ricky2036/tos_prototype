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
  assert.match(src, /没有搜索到结果/, '文案：没有搜索到结果')
  assert.doesNotMatch(src, /暂无结果，试试其他关键词/, '旧文案已废弃')
  assert.match(src, /<rect[^>]*rx="15"/, '叠加卡片')
  assert.match(src, /<circle[^>]*fill="url\(#ses-lens\)"/, '放大镜镜片')
  assert.match(src, /ses-card[\s\S]*ses-lens/, '插画渐变')
  const search = strip(read('src/components/apps/settings/SettingsSearch.vue'))
  const list = strip(read('src/components/ui/RegisteredAppList.vue'))
  assert.match(search, /SearchEmptyState/)
  assert.match(list, /SearchEmptyState/)
  assert.match(list, /没有搜索到结果/, '应用列表空态文案同步')
  assert.doesNotMatch(search, /未找到相关设置/, '旧文案已移除')
  assert.doesNotMatch(search, /results-empty/, '旧的线性放大镜空态已移除')
})

/* 空态居中：真机 srch_04_committed 实测插画墨迹中心与页面中心差 0.5px、
   整组中心落在屏幕 51.9%（≈ 内容区正中）。两处历史偏差各留一条守卫。 */
test('空态居中：viewBox 必须紧贴墨迹（正方形），且按整屏居中而非浏览器视口', () => {
  const src = strip(read(EMPTY))

  // ① 插画：旧 viewBox="0 0 120 120" 四周留白不均 ⇒ 墨迹偏右 3.5px、偏下 8px
  const vb = src.match(/viewBox="(-?[\d.]+) (-?[\d.]+) ([\d.]+) ([\d.]+)"/)
  assert.ok(vb, 'svg 必须有 viewBox')
  const [vx, vy, vw, vh] = vb.slice(1).map(Number)
  assert.equal(vw, vh, 'viewBox 必须是正方形（非正方形会被 meet 缩放挤偏）')
  // 墨迹包围盒由图形几何算出：卡片/镜片/手柄的并集（改图形必须同步重算）
  const INK = { cx: 62.2, cy: 65.7 }
  assert.ok(Math.abs(vx + vw / 2 - INK.cx) <= 1, `插画横向未居中：viewBox 中心 ${vx + vw / 2} vs 墨迹 ${INK.cx}`)
  assert.ok(Math.abs(vy + vh / 2 - INK.cy) <= 1, `插画纵向未居中：viewBox 中心 ${vy + vh / 2} vs 墨迹 ${INK.cy}`)
  assert.doesNotMatch(src, /viewBox="0 0 120 120"/, '⛔ 回到留白不均的旧 viewBox 会再次偏右/偏下')

  // ② 定位：vh 是浏览器视口而不是手机屏，换窗口高度整块就漂走
  assert.doesNotMatch(src, /min-height:\s*58vh/, '⛔ 禁用 vh 定高')
  assert.match(src, /\.search-empty\.is-fill \{[^}]*position: absolute;[^}]*inset: 0;/s, '铺满模式：绝对定位铺满最近的定位祖先')
  assert.match(src, /pointer-events: none/, '空态是纯展示层，不许挡住底下的行')
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
  assert.match(empty, /没有搜索到结果/)
  assert.doesNotMatch(empty.replace('没有搜索到结果', '无数据'), /没有搜索到结果/)
  // 居中守卫的牙齿：改回留白 viewBox / 换回 static 定位都必须立刻被守卫抓到
  assert.doesNotMatch(empty, /viewBox="0 0 120 120"/)
  assert.match(empty.replace(/viewBox="[^"]+"/, 'viewBox="0 0 120 120"'), /viewBox="0 0 120 120"/, '牙齿：改坏后守卫必须命中')
  assert.doesNotMatch(empty, /\.search-empty\.is-fill \{[^}]*position: static;/s)
  assert.match(empty.replace('position: absolute', 'position: static'),
    /\.search-empty\.is-fill \{[^}]*position: static;[^}]*inset: 0;/s, '牙齿：铺满改 static 后必须命中')
})
