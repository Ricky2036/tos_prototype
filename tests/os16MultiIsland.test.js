import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { useOs16IslandStore, OS16_TEMPLATES } from '../src/stores/os16IslandStore.js'
import { useActiveActivities } from '../src/composables/useActiveActivities.js'
import { OS16_ICONS } from '../src/components/dev/os16Icons.js'

test('OS16 多岛并存机制：最多 4 个模版同时存在，支持单独删除与顺序流转', () => {
  setActivePinia(createPinia())
  const store = useOs16IslandStore()

  // 1. 激活第 1 个：外卖
  store.activateTemplate(OS16_TEMPLATES.FOOD_DELIVERY)
  assert.equal(store.activeTemplates.length, 1)
  assert.equal(store.activeTemplate, OS16_TEMPLATES.FOOD_DELIVERY)

  // 2. 激活第 2 个：打车接驾
  store.activateTemplate(OS16_TEMPLATES.RIDE_HAILING)
  assert.equal(store.activeTemplates.length, 2)
  assert.equal(store.activeTemplate, OS16_TEMPLATES.RIDE_HAILING) // 最新项在首位
  assert.deepEqual(store.activeTemplates, [OS16_TEMPLATES.RIDE_HAILING, OS16_TEMPLATES.FOOD_DELIVERY])

  // 3. 激活第 3 个：路线导航
  store.activateTemplate(OS16_TEMPLATES.NAVIGATION)
  assert.equal(store.activeTemplates.length, 3)
  assert.equal(store.activeTemplate, OS16_TEMPLATES.NAVIGATION)

  // 4. 激活第 4 个：极速快充
  store.activateTemplate(OS16_TEMPLATES.BATTERY_CHARGING)
  assert.equal(store.activeTemplates.length, 4)
  assert.equal(store.activeTemplate, OS16_TEMPLATES.BATTERY_CHARGING)

  // 5. 激活第 5 个：手电筒（超过 4 个限制，自动剔除最老的 FOOD_DELIVERY）
  store.activateTemplate(OS16_TEMPLATES.FLASHLIGHT)
  assert.equal(store.activeTemplates.length, 4)
  assert.equal(store.activeTemplate, OS16_TEMPLATES.FLASHLIGHT)
  assert.ok(!store.activeTemplates.includes(OS16_TEMPLATES.FOOD_DELIVERY))
  assert.deepEqual(store.activeTemplates, [
    OS16_TEMPLATES.FLASHLIGHT,
    OS16_TEMPLATES.BATTERY_CHARGING,
    OS16_TEMPLATES.NAVIGATION,
    OS16_TEMPLATES.RIDE_HAILING
  ])

  // 6. 单独关闭其中的“导航”模版
  store.closeTemplate(OS16_TEMPLATES.NAVIGATION)
  assert.equal(store.activeTemplates.length, 3)
  assert.ok(!store.isTemplateActive(OS16_TEMPLATES.NAVIGATION))
  assert.ok(store.isTemplateActive(OS16_TEMPLATES.FLASHLIGHT))
  assert.ok(store.isTemplateActive(OS16_TEMPLATES.BATTERY_CHARGING))
  assert.ok(store.isTemplateActive(OS16_TEMPLATES.RIDE_HAILING))

  // 7. 清空全部模版
  store.closeTemplate()
  assert.equal(store.activeTemplates.length, 0)
  assert.equal(store.hasActiveTemplate, false)
})

test('useActiveActivities 集中聚合多模版：每个模版生成独立 Live Activity 供通知中心与锁屏展示', () => {
  setActivePinia(createPinia())
  const store = useOs16IslandStore()
  const { activeActivities } = useActiveActivities()

  store.activateTemplate(OS16_TEMPLATES.FOOD_DELIVERY)
  store.activateTemplate(OS16_TEMPLATES.RIDE_HAILING)

  const activities = activeActivities.value
  assert.equal(activities.length, 2)
  assert.equal(activities[0].id, `os16_${OS16_TEMPLATES.RIDE_HAILING}`)
  assert.equal(activities[0].type, 'os16_template')
  assert.equal(activities[0].template, OS16_TEMPLATES.RIDE_HAILING)

  assert.equal(activities[1].id, `os16_${OS16_TEMPLATES.FOOD_DELIVERY}`)
  assert.equal(activities[1].type, 'os16_template')
  assert.equal(activities[1].template, OS16_TEMPLATES.FOOD_DELIVERY)
})

test('控制台沙漏与手电筒图标尺寸规范与纯矢量约束', () => {
  // 倒计时图标：严格控制宽度和高度为 11x14，viewBox 留出合理内边距，视觉上与闹钟/计时器完全协调
  assert.ok(OS16_ICONS.timer.includes('width="11"'))
  assert.ok(OS16_ICONS.timer.includes('height="14"'))
  assert.ok(OS16_ICONS.timer.includes('viewBox="211 455 28 38"'))

  // 手电筒图标：严格控制宽度和高度为 7x14，viewBox 留出合理内边距，杜绝视觉傻大
  assert.ok(OS16_ICONS.flashlight.includes('width="7"'))
  assert.ok(OS16_ICONS.flashlight.includes('height="14"'))
  assert.ok(OS16_ICONS.flashlight.includes('viewBox="215 943 20 42"'))
})

test('DynamicIsland、NotificationCenter、LockScreen 支持灵动岛多卡片与滑动删除', () => {
  const dynamicIslandContent = fs.readFileSync(path.resolve('src/components/system/DynamicIsland.vue'), 'utf8')
  const notifCenterContent = fs.readFileSync(path.resolve('src/components/system/NotificationCenter.vue'), 'utf8')
  const lockScreenContent = fs.readFileSync(path.resolve('src/components/system/LockScreen.vue'), 'utf8')

  // DynamicIsland 副卡片渲染与自适应样式
  assert.ok(dynamicIslandContent.includes('isOs16Item(item)'))
  assert.ok(dynamicIslandContent.includes('getOs16TemplateName(item)'))
  assert.ok(dynamicIslandContent.includes('island-secondary-card'))
  assert.ok(dynamicIslandContent.includes('is-os16-card'))
  assert.ok(dynamicIslandContent.includes('is-os16-front'))

  // NotificationCenter 支持模版卡片渲染与高度自适应类
  assert.ok(notifCenterContent.includes('OS16TemplateCard :template="act.template"'))
  assert.ok(notifCenterContent.includes('is-os16-template'))
  assert.ok(notifCenterContent.includes('getOs16CardClass(act.template)'))
  assert.ok(notifCenterContent.includes('.nc-activity-card.is-os16-template'))

  // LockScreen 支持模版卡片渲染与高度计算
  assert.ok(lockScreenContent.includes('OS16TemplateCard :template="act.template"'))
  assert.ok(lockScreenContent.includes('getActivityHeight'))
  assert.ok(lockScreenContent.includes('getOs16CardClass'))
  assert.ok(lockScreenContent.includes('.ls-card-front.ls-activity-card.is-os16-template'))
})
