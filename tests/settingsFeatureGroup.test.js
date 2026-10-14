import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ACCESSIBILITY_PATH = path.resolve('src/components/apps/settings/SettingsAccessibility.vue')
const ONETAP_PATH = path.resolve('src/components/apps/settings/SettingsOneTap.vue')
const BATTERY_PATH = path.resolve('src/components/apps/settings/SettingsBattery.vue')
const STORAGE_PATH = path.resolve('src/components/apps/settings/SettingsStorage.vue')
const SETTINGS_APP_PATH = path.resolve('src/components/apps/settings/SettingsApp.vue')

test('SettingsAccessibility.vue implements accessibility features aligned with real phone', () => {
  assert.ok(fs.existsSync(ACCESSIBILITY_PATH), 'SettingsAccessibility.vue should exist')
  const content = fs.readFileSync(ACCESSIBILITY_PATH, 'utf-8')

  // Navigation
  assert.match(content, /辅助功能/)
  assert.match(content, /data-nav-back/)

  // Hero card
  assert.match(content, /通过视力、肢体活动能力、听力、语音和认知方面/)

  // Standalone card: 无障碍
  assert.match(content, /无障碍/)

  // Group 2: 交互手势
  assert.match(content, /录屏/)
  assert.match(content, /截屏/)
  assert.match(content, /动作与手势/)
  assert.match(content, /智感握姿/)

  // Group 3: 桌面多任务
  assert.match(content, /小窗/)
  assert.match(content, /便捷高效的全局应用浮窗/)
  assert.match(content, /应用分屏/)
  assert.match(content, /智能侧边栏/)

  // Group 4: 场景增强
  assert.match(content, /户外增强/)
  assert.match(content, /晕动舒缓显示/)
  assert.match(content, /游戏模式/)

  // 防误触与你可能想找
  assert.match(content, /防误触模式/)
  assert.match(content, /你可能想找/)
  assert.match(content, /应用双开/)
  assert.match(content, /防偷窥/)
  assert.match(content, /数字健康/)
})

test('SettingsOneTap.vue implements flagship action button customizer aligned with real phone', () => {
  assert.ok(fs.existsSync(ONETAP_PATH), 'SettingsOneTap.vue should exist')
  const content = fs.readFileSync(ONETAP_PATH, 'utf-8')

  // Navigation & dark immersion
  assert.match(content, /One-Tap Button/)
  assert.match(content, /data-nav-back/)
  assert.match(content, /#000000/)

  // Physical chassis & glowing capsule
  assert.match(content, /phone-rail/)
  assert.match(content, /button-cavity/)
  assert.match(content, /active-capsule-button/)

  // Modes
  assert.match(content, /自定义/)
  assert.match(content, /快捷应用/)
  assert.match(content, /翻译助手/)
  assert.match(content, /静音模式/)
  assert.match(content, /手电筒/)
  assert.match(content, /相机/)
  assert.match(content, /无操作/)

  // Pagination & Action button
  assert.match(content, /pagination-dots/)
  assert.match(content, /使用中/)
  assert.match(content, /设定/)
})

test('SettingsBattery.vue implements battery & power saving aligned with real phone', () => {
  assert.ok(fs.existsSync(BATTERY_PATH), 'SettingsBattery.vue should exist')
  const content = fs.readFileSync(BATTERY_PATH, 'utf-8')

  // Navigation
  assert.match(content, /电池与省电/)
  assert.match(content, /data-nav-back/)

  // Battery percentage & remaining
  assert.match(content, /91/)
  assert.match(content, /正在充电/)
  assert.match(content, /剩余 27 小时 51 分钟/)

  // Modes: 省电 vs 均衡 & 超级省电
  assert.match(content, /省电模式/)
  assert.match(content, /30 小时 44 分钟/)
  assert.match(content, /均衡模式/)
  assert.match(content, /27 小时 51 分钟/)
  assert.match(content, /超级省电/)

  // Settings list
  assert.match(content, /省电管理/)
  assert.match(content, /充电设置/)
  assert.match(content, /电池健康/)
  assert.match(content, /最大容量 100%/)

  // Usage charts & app ranking
  assert.match(content, /距上次充满电已使用 9 小时 13 分钟/)
  assert.match(content, /过去 24 小时/)
  assert.match(content, /过去 7 天/)
  assert.match(content, /亮屏活动时长/)
  assert.match(content, /息屏活动时长/)
  assert.match(content, /哔哩哔哩/)
  assert.match(content, /腾讯视频/)
  assert.match(content, /微信/)
})

test('SettingsStorage.vue implements storage management aligned with real phone', () => {
  assert.ok(fs.existsSync(STORAGE_PATH), 'SettingsStorage.vue should exist')
  const content = fs.readFileSync(STORAGE_PATH, 'utf-8')

  // Navigation
  assert.match(content, /存储/)
  assert.match(content, /data-nav-back/)

  // Storage hero & cleanup
  assert.match(content, /清理/)
  assert.match(content, /usedGB.*totalGB/)
  assert.match(content, /storage-segmented-bar/)

  // Recommendation
  assert.match(content, /推荐/)
  assert.match(content, /老旧文件清理/)
  assert.match(content, /oldFilesCount.*oldFilesSize/)

  // Categories
  assert.match(content, /图片/)
  assert.match(content, /7.79 GB/)
  assert.match(content, /视频/)
  assert.match(content, /65.89 GB/)
  assert.match(content, /音频/)
  assert.match(content, /文档/)
  assert.match(content, /安装包/)
  assert.match(content, /应用/)
  assert.match(content, /91.41 GB/)

  // System & Low storage management
  assert.match(content, /系统数据/)
  assert.match(content, /18.16 GB/)
  assert.match(content, /系统固件/)
  assert.match(content, /28.43 GB/)
  assert.match(content, /低存储管理/)
})

test('SettingsApp.vue wires card 6 items to real subpages', () => {
  const content = fs.readFileSync(SETTINGS_APP_PATH, 'utf-8')

  // Component imports
  assert.match(content, /import SettingsAccessibility from '\.\/SettingsAccessibility\.vue'/)
  assert.match(content, /import SettingsOneTap from '\.\/SettingsOneTap\.vue'/)
  assert.match(content, /import SettingsBattery from '\.\/SettingsBattery\.vue'/)
  assert.match(content, /import SettingsStorage from '\.\/SettingsStorage\.vue'/)

  // View titles
  assert.match(content, /accessibility: '辅助功能'/)
  assert.match(content, /oneTap: 'One-Tap Button'/)
  assert.match(content, /battery: '电池与省电'/)
  assert.match(content, /storage: '存储'/)

  // Subpage router mounting
  assert.match(content, /<SettingsAccessibility ref="accessibilityRef" @back="pop" \/>/)
  assert.match(content, /<SettingsOneTap ref="oneTapRef" @back="pop" \/>/)
  assert.match(content, /<SettingsBattery ref="batteryRef" @back="pop" \/>/)
  assert.match(content, /<SettingsStorage ref="storageRef" @back="pop" \/>/)

  // Card 6 buttons invoking push
  assert.match(content, /push\('accessibility'\)/)
  assert.match(content, /push\('oneTap'\)/)
  assert.match(content, /push\('battery'\)/)
  assert.match(content, /push\('storage'\)/)
})
