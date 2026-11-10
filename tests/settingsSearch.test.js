import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('SettingsSearch.vue matches reference design specification in Image 1 and Image 2', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsSearch.vue')
  assert.ok(fs.existsSync(filePath), 'SettingsSearch.vue must exist')
  const content = fs.readFileSync(filePath, 'utf-8')

  // 1. 搜索建议模块（图 1）
  assert.ok(content.includes('搜索建议'), 'Must contain 搜索建议 title')
  assert.ok(content.includes('专用 DNS'), 'Must include 专用 DNS suggestion')
  assert.ok(content.includes('系统导航'), 'Must include 系统导航 suggestion')
  assert.ok(content.includes('日期与时间'), 'Must include 日期与时间 suggestion')
  assert.ok(content.includes('屏幕使用时间'), 'Must include 屏幕使用时间 suggestion')
  assert.ok(content.includes('锁屏设置'), 'Must include 锁屏设置 suggestion')

  // 2. 搜索历史模块与垃圾桶图标（图 1，包含两条竖线标准设计）
  assert.ok(content.includes('搜索历史'), 'Must contain 搜索历史 title')
  assert.ok(content.includes('history-action-btn'), 'Must have history action button with trash icon')
  assert.ok(content.includes('<line x1="10" y1="11" x2="10" y2="17"/>'), 'Trash icon must include left vertical line')
  assert.ok(content.includes('<line x1="14" y1="11" x2="14" y2="17"/>'), 'Trash icon must include right vertical line')
  // 参考图 2 扩充至两行：声音、通用、Apple 账户、电池、隐私
  assert.ok(content.includes('声音'), 'Must have 声音 in default history')
  assert.ok(content.includes('通用'), 'Must have 通用 in default history')
  assert.ok(content.includes('Apple 账户'), 'Must have Apple 账户 in default history')
  assert.ok(content.includes('电池'), 'Must have 电池 in default history')
  assert.ok(content.includes('隐私'), 'Must have 隐私 in default history')

  // 3. 点击删除后变为“全部删除”与单项删除小叉号（图 2 重点：去底色）
  assert.ok(content.includes('isHistoryEditing'), 'Must have isHistoryEditing state')
  assert.ok(content.includes('全部删除'), 'Delete button must become 全部删除 in editing mode')
  assert.ok(content.includes('deleteHistoryItem'), 'Must have function to delete individual history record')
  assert.ok(content.includes('chip-delete-btn'), 'Must render chip delete button with cross icon')
  assert.ok(content.includes('background: transparent;'), 'Chip delete button must have transparent background without gray circle')
  assert.ok(content.includes('clearAllHistory'), 'Must support clear all history action')

  // 4. 底部操作栏（全仓标准 Dock 的激活态）+ 真机空态
  assert.ok(content.includes('SettingsSearchDock'), 'Must use the standard search Dock')
  assert.ok(content.includes(':active="true"'), 'Dock must be in active state')
  assert.ok(content.includes('@back="emit(\'back\')"'), 'Back button must return to home')
  assert.ok(content.includes('SearchEmptyState'), 'Must use the shared illustrated empty state')
  const dock = fs.readFileSync(path.resolve('src/components/ui/SettingsSearchDock.vue'), 'utf-8')
  assert.ok(dock.includes('data-sfd-back'), 'Dock must render circular back button')
  assert.ok(dock.includes('class="sfd-capsule"'), 'Dock must render capsule input on the right')
  assert.ok(dock.includes('placeholder="搜索"') || dock.includes(':placeholder="placeholder"'), 'Input placeholder must be 搜索')
})

test('SettingsApp.vue properly integrates SettingsSearch view and navigation', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsApp.vue')
  const content = fs.readFileSync(filePath, 'utf-8')

  // 1. 导入组件
  assert.ok(content.includes("import SettingsSearch from './SettingsSearch.vue'"), 'Must import SettingsSearch')

  // 2. viewTitles 声明
  assert.ok(content.includes("search: '搜索'"), 'Must register search in viewTitles')

  // 3. 首页浮动搜索栏点击跳转
  assert.ok(content.includes("@activate=\"push('search')\""), 'Must push search view on Dock activate')

  // 4. view === search 条件渲染
  assert.ok(content.includes("view === 'search'"), 'Must render SettingsSearch when view is search')
  assert.ok(content.includes('<SettingsSearch'), 'Must mount SettingsSearch tag')
  assert.ok(content.includes('@back="pop"'), 'Must handle back navigation')
  assert.ok(content.includes('@navigate="handleSearchNavigate"'), 'Must handle item navigation')
})
