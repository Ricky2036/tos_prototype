import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setActivePinia, createPinia } from 'pinia'
import { useModesAndRoutinesStore } from '../src/stores/modesAndRoutinesStore.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

test('modesAndRoutinesStore: 预置模式与基础状态管理', () => {
  setActivePinia(createPinia())
  const store = useModesAndRoutinesStore()

  // 1. 验证 8 大预置模式
  assert.ok(store.modes.length >= 8, '应至少包含 8 个预置模式')
  const presetIds = store.modes.map((m) => m.id)
  const expectedPresets = ['sleep', 'theater', 'driving', 'exercise', 'relax', 'work', 'gaming', 'prayer']
  expectedPresets.forEach((pid) => {
    assert.ok(presetIds.includes(pid), `预置模式应包含 ${pid}`)
  })

  // 2. 初始模式状态与激活
  assert.equal(store.activeModeId, null, '初始默认无激活模式')
  store.toggleMode('sleep')
  assert.equal(store.activeModeId, 'sleep', '切换后睡眠模式应激活')
  assert.equal(store.activeMode?.name, '睡眠')

  // 再次点击切换为关闭
  store.toggleMode('sleep')
  assert.equal(store.activeModeId, null, '再次切换后睡眠模式应关闭')

  // 切换到另一个模式
  store.toggleMode('work')
  assert.equal(store.activeModeId, 'work')
  store.toggleMode('work')
})

test('modesAndRoutinesStore: 自定义模式创建、修改与删除', () => {
  setActivePinia(createPinia())
  const store = useModesAndRoutinesStore()

  const initialCount = store.modes.length
  const custom = store.addCustomMode({
    name: '冥想时光',
    color: '#059669',
    iconKey: 'heart',
    description: '每日冥想 20 分钟'
  })

  assert.ok(custom.id.startsWith('custom_'), '自定义模式应分配 custom_ 前缀 ID')
  assert.equal(custom.name, '冥想时光')
  assert.equal(custom.isCustom, true)
  assert.equal(store.modes.length, initialCount + 1)

  // 激活自定义模式
  store.toggleMode(custom.id)
  assert.equal(store.activeModeId, custom.id)

  // 删除自定义模式
  const deleted = store.deleteCustomMode(custom.id)
  assert.equal(deleted, true)
  assert.equal(store.activeModeId, null, '删除当前激活的模式后应自动复位 activeModeId')
  assert.equal(store.modes.length, initialCount)
})

test('modesAndRoutinesStore: 日常程序管理与发现模板', () => {
  setActivePinia(createPinia())
  const store = useModesAndRoutinesStore()

  // 1. 预置日常程序
  assert.ok(store.routines.length >= 2, '应包含默认日常程序')
  const rDark = store.routines.find((r) => r.id === 'routine_dark')
  assert.ok(rDark, '应包含在暗处日常程序')
  assert.equal(rDark.name, '在暗处')

  // 开关切换
  const initialEnabled = rDark.enabled
  store.toggleRoutine('routine_dark')
  assert.equal(rDark.enabled, !initialEnabled)
  store.toggleRoutine('routine_dark')

  // 2. 发现模板库
  assert.equal(store.discoverCategories.length, 5, '发现库应包含 5 个核心分类')
  const totalTemplates = store.discoverCategories.reduce((acc, cat) => acc + cat.items.length, 0)
  assert.ok(totalTemplates >= 14, '发现库模板总数应不少于 14 个')

  // 3. 从发现模板保存为日常程序
  const template = store.discoverCategories[0].items[0]
  const saved = store.addRoutine(template)
  assert.equal(saved.name, template.name)
  assert.ok(store.routines.some((r) => r.name === template.name))
})

test('设计铁律合规：严禁左侧加粗竖线边框 (border-left)', () => {
  const componentFiles = [
    'src/components/apps/settings/SettingsModes.vue',
    'src/components/apps/settings/modes/ModesTab.vue',
    'src/components/apps/settings/modes/RoutinesTab.vue',
    'src/components/apps/settings/modes/DiscoverTab.vue',
    'src/components/apps/settings/modes/ModeDetailView.vue',
    'src/components/apps/settings/modes/RoutineDetailView.vue',
    'src/components/apps/settings/modes/AddCustomModeModal.vue',
    'src/components/apps/settings/modes/RoutineConditionPicker.vue',
    'src/components/apps/settings/modes/RoutineActionPicker.vue',
    'src/components/apps/settings/modes/HistoryModal.vue'
  ]

  componentFiles.forEach((fileRel) => {
    const fullPath = path.resolve(ROOT, fileRel)
    assert.ok(fs.existsSync(fullPath), `文件必须存在: ${fileRel}`)
    const content = fs.readFileSync(fullPath, 'utf8')
    assert.doesNotMatch(content, /border-left\s*:\s*[2-9]px/i, `${fileRel} 严禁包含加粗竖线边框`)
    assert.doesNotMatch(content, /border-left\s*:\s*solid/i, `${fileRel} 严禁包含竖线边框`)
  })
})

test('SettingsApp.vue: 模式和日常程序入口严格布局在 Infinix AI 下方', () => {
  const settingsAppPath = path.resolve(ROOT, 'src/components/apps/settings/SettingsApp.vue')
  const content = fs.readFileSync(settingsAppPath, 'utf8')

  // 1. 检查注册
  assert.match(content, /modes:\s*['"]模式和日常程序['"]/)
  assert.match(content, /import SettingsModes from '\.\/SettingsModes\.vue'/)

  // 2. 检查入口位于 Infinix AI 下方
  const infinixAiIndex = content.indexOf('title="Infinix AI"')
  const modesIndex = content.indexOf('title="模式和日常程序"')
  assert.ok(infinixAiIndex !== -1, '必须包含 Infinix AI 入口')
  assert.ok(modesIndex !== -1, '必须包含 模式和日常程序 入口')
  assert.ok(modesIndex > infinixAiIndex, '模式和日常程序 入口必须位于 Infinix AI 正下方')

  // 3. 检查子页面渲染和样式
  assert.match(content, /view === ['"]modes['"]/)
  assert.match(content, /\.bg-modes\s*\{[^}]*background:/)
})
