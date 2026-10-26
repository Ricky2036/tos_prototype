import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { useOs16IslandStore, OS16_TEMPLATES } from '../src/stores/os16IslandStore.js'

test('OS16 Island Store: 模板常量完整包含三大分类 12 项规范', () => {
  // 1. 进度模板
  assert.equal(OS16_TEMPLATES.FOOD_DELIVERY, 'food_delivery')
  assert.equal(OS16_TEMPLATES.RIDE_HAILING, 'ride_hailing')
  assert.equal(OS16_TEMPLATES.NAVIGATION, 'navigation')

  // 2. 自适应模版
  assert.equal(OS16_TEMPLATES.TRANSLATION, 'translation')
  assert.equal(OS16_TEMPLATES.SYSTEM_TIP, 'system_tip')
  assert.equal(OS16_TEMPLATES.MEDIA_EXTENDED, 'media_extended')

  // 3. 基础模板
  assert.equal(OS16_TEMPLATES.SCREEN_RECORDING, 'screen_recording')
  assert.equal(OS16_TEMPLATES.BATTERY_CHARGING, 'battery_charging')
  assert.equal(OS16_TEMPLATES.PHONE_CALL, 'phone_call')
  assert.equal(OS16_TEMPLATES.HOTSPOT, 'hotspot')
  assert.equal(OS16_TEMPLATES.FLASHLIGHT, 'flashlight')
  assert.equal(OS16_TEMPLATES.MICROPHONE, 'microphone')
})

test('OS16 Island Store: 模版激活、切换与展开状态流转', () => {
  setActivePinia(createPinia())
  const store = useOs16IslandStore()

  // 初始无活跃模版
  assert.equal(store.activeTemplate, null)
  assert.equal(store.hasActiveTemplate, false)
  assert.equal(store.isExpanded, false)

  // 激活外卖履约模版
  store.activateTemplate(OS16_TEMPLATES.FOOD_DELIVERY)
  assert.equal(store.activeTemplate, OS16_TEMPLATES.FOOD_DELIVERY)
  assert.equal(store.hasActiveTemplate, true)
  assert.equal(store.isExpanded, true)

  // 展开收起切换
  store.toggleExpand()
  assert.equal(store.isExpanded, false)

  store.toggleExpand()
  assert.equal(store.isExpanded, true)

  // 切换到同声传译模版
  store.activateTemplate(OS16_TEMPLATES.TRANSLATION)
  assert.equal(store.activeTemplate, OS16_TEMPLATES.TRANSLATION)
  assert.equal(store.isExpanded, true)

  // 关闭模版
  store.closeTemplate()
  assert.equal(store.activeTemplate, null)
  assert.equal(store.hasActiveTemplate, false)
  assert.equal(store.isExpanded, false)
})

test('OS16 Island Store: 进度模版与自适应模版动态数据状态完备', () => {
  setActivePinia(createPinia())
  const store = useOs16IslandStore()

  // 外卖动态数据校验
  assert.equal(typeof store.foodDeliveryState.title, 'string')
  assert.equal(typeof store.foodDeliveryState.progress, 'number')
  assert.equal(store.foodDeliveryState.brand, '美团')

  // 导航多色路况段数据校验
  assert.ok(Array.isArray(store.navigationState.segments))
  assert.ok(store.navigationState.segments.length >= 3)
  assert.ok(store.navigationState.segments.some((s) => s.color.startsWith('#')))

  // 同声传译状态与操作
  assert.equal(store.translationState.isListening, true)
  store.toggleListening()
  assert.equal(store.translationState.isListening, false)

  // 手电筒开关操作
  assert.equal(store.baseTemplateState.isFlashlightOn, false)
  store.toggleFlashlight()
  assert.equal(store.baseTemplateState.isFlashlightOn, true)
})

test('DynamicIsland 与 OS16 模版组件集成与挂载健全性', () => {
  const dynamicIslandPath = path.resolve('src/components/system/DynamicIsland.vue')
  const content = fs.readFileSync(dynamicIslandPath, 'utf8')

  // 确保引入了 OS16TemplateCard 与 store
  assert.ok(content.includes('OS16TemplateCard'))
  assert.ok(content.includes('useOs16IslandStore'))
  assert.ok(content.includes('os16Store.hasActiveTemplate'))

  // 确保胶囊收起态与展开态均支持 OS16 模版分支
  assert.ok(content.includes('primaryActiveItem === \'os16_template\''))
  assert.ok(content.includes('os16CapsuleText'))
  assert.ok(content.includes('os16CardClass'))

  const templateCardPath = path.resolve('src/components/system/island/OS16TemplateCard.vue')
  assert.ok(fs.existsSync(templateCardPath), 'OS16TemplateCard.vue 文件必须存在')

  const cardContent = fs.readFileSync(templateCardPath, 'utf8')
  assert.ok(cardContent.includes('FOOD_DELIVERY'))
  assert.ok(cardContent.includes('RIDE_HAILING'))
  assert.ok(cardContent.includes('NAVIGATION'))
  assert.ok(cardContent.includes('TRANSLATION'))
  assert.ok(cardContent.includes('SYSTEM_TIP'))
  assert.ok(cardContent.includes('BATTERY_CHARGING'))
})

test('DevConsole 挂载 OS16 规范模版切换控制且杜绝任何凑数 Emoji', () => {
  const devConsolePath = path.resolve('src/components/dev/DevConsole.vue')
  const content = fs.readFileSync(devConsolePath, 'utf8')

  assert.ok(content.includes('OS16 规范模版'))
  assert.ok(content.includes('进度模板'))
  assert.ok(content.includes('自适应模版'))
  assert.ok(content.includes('基础模板'))
  assert.ok(content.includes('selectOs16Template'))
  assert.ok(content.includes('clearOs16Template'))

  // 严禁在模版切换按钮中使用凑数 Emoji 表情
  const forbiddenEmojis = ['🛵', '🚗', '🧭', '🌐', '📱', '🎵', '🎥', '⚡', '📞', '🎙️', '📶', '🔦']
  for (const emoji of forbiddenEmojis) {
    assert.ok(!content.includes(emoji), `DevConsole 不得包含凑数 Emoji: ${emoji}`)
  }

  // 确保使用了专业的矢量 SVG 集合
  assert.ok(content.includes('OS16_ICONS'))
})

test('OS16 纯矢量 SVG 分层卡片资产齐全健全', () => {
  const assetDir = path.resolve('src/assets/island')
  const requiredVectorCards = [
    'progress_food_delivery.svg',
    'progress_ride_hailing.svg',
    'progress_navigation.svg',
    'adaptive_media.svg',
    'adaptive_translation.svg',
    'adaptive_system_tip.svg',
    'base_screen_recording.svg',
    'base_voice_recording.svg',
    'base_timer.svg',
    'base_battery_charging.svg',
    'base_phone_call.svg',
    'base_microphone.svg',
    'base_hotspot.svg',
    'base_flashlight.svg'
  ]

  for (const file of requiredVectorCards) {
    const fullPath = path.join(assetDir, file)
    assert.ok(fs.existsSync(fullPath), `必须存在 Figma 原稿提取的纯矢量分层 SVG: ${file}`)
    const stat = fs.statSync(fullPath)
    assert.ok(stat.size > 100, `SVG 文件大小异常: ${file}`)
    const content = fs.readFileSync(fullPath, 'utf8')
    assert.ok(content.includes('<svg'), `文件必须是合法的 SVG 根元素: ${file}`)
    assert.ok(content.includes('clipPath'), `文件必须具备黑色圆角裁切 clipPath: ${file}`)
    assert.ok(!content.includes('fill="white" width="1920"'), `SVG 严禁包含画布外部全屏白底: ${file}`)
  }
})
