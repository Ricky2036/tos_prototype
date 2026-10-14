import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const SIM_PATH = path.resolve('src/components/apps/settings/SettingsSim.vue')
const BLUETOOTH_PATH = path.resolve('src/components/apps/settings/SettingsBluetooth.vue')
const SATELLITE_PATH = path.resolve('src/components/apps/settings/SettingsSatellite.vue')
const SETTINGS_APP_PATH = path.resolve('src/components/apps/settings/SettingsApp.vue')

test('SettingsSim.vue implements complete SIM & Network settings aligned with real phone', () => {
  assert.ok(fs.existsSync(SIM_PATH), 'SettingsSim.vue should exist')
  const content = fs.readFileSync(SIM_PATH, 'utf-8')

  assert.match(content, /SIM 卡与网络设置/, 'Title should be SIM 卡与网络设置')
  assert.match(content, /中国电信/, 'Should show China Telecom SIM')
  assert.match(content, /\+86 181 3884 8993/, 'Should show phone number from real device')
  assert.match(content, /启用eSIM/, 'Should contain eSIM management')
  assert.match(content, /上网卡/, 'Should contain default data card selector')
  assert.match(content, /拨号卡/, 'Should contain default dial card selector')
  assert.match(content, /移动数据/, 'Should contain mobile data switch')
  assert.match(content, /5G 网络/, 'Should contain 5G switch')
  assert.match(content, /无网通讯/, 'Should contain off-grid communication')
  assert.match(content, /流量管理/, 'Should contain data usage management')
  assert.match(content, /网络优化/, 'Should contain network acceleration')
  assert.match(content, /通话设置/, 'Should contain call settings in bottom hints')
  assert.match(content, /短信设置/, 'Should contain SMS settings in bottom hints')
  assert.match(content, /data-nav-back/, 'Should have back button with data-nav-back')
})

test('SettingsBluetooth.vue implements complete Bluetooth settings aligned with real phone', () => {
  assert.ok(fs.existsSync(BLUETOOTH_PATH), 'SettingsBluetooth.vue should exist')
  const content = fs.readFileSync(BLUETOOTH_PATH, 'utf-8')

  assert.match(content, /蓝牙/, 'Title should be 蓝牙')
  assert.match(content, /Infinix NOTE 60 Pro/, 'Device name should be Infinix NOTE 60 Pro')
  assert.match(content, /已配对设备/, 'Should contain paired devices section')
  assert.match(content, /OPPO Enco X3/, 'Should display paired headphone OPPO Enco X3')
  assert.match(content, /可用设备/, 'Should contain available devices section')
  assert.match(content, /22:22:18:AC:40:7C/, 'Should display Bluetooth MAC address')
  assert.match(content, /data-nav-back/, 'Should have back button with data-nav-back')
})

test('SettingsSatellite.vue implements complete Starlink Satellite settings aligned with real phone', () => {
  assert.ok(fs.existsSync(SATELLITE_PATH), 'SettingsSatellite.vue should exist')
  const content = fs.readFileSync(SATELLITE_PATH, 'utf-8')

  assert.match(content, /星链卫星网络/, 'Title should be 星链卫星网络')
  assert.match(content, /当前未插入支持星链的 SIM 卡/, 'Should contain SIM missing notification')
  assert.match(content, /关于卫星连接/, 'Should contain About Satellite Connection')
  assert.match(content, /使用指南/, 'Should contain Usage Guide')
  assert.match(content, /1\. 自动触发/, 'Guide item 1: Auto trigger')
  assert.match(content, /2\. 环境要求/, 'Guide item 2: Environment requirement')
  assert.match(content, /3\. 功能使用/, 'Guide item 3: Feature usage')
  assert.match(content, /注意事项/, 'Should contain Notes section')
  assert.match(content, /1\. 地区限制/, 'Note item 1: Region restriction')
  assert.match(content, /2\. 环境干扰/, 'Note item 2: Environment interference')
  assert.match(content, /3\. 资费与套餐/, 'Note item 3: Tariffs and plans')
  assert.match(content, /data-nav-back/, 'Should have back button with data-nav-back')
})

test('SettingsApp.vue integrates Network & Connection group into navigation and search', () => {
  const content = fs.readFileSync(SETTINGS_APP_PATH, 'utf-8')

  // Component imports
  assert.match(content, /import SettingsSim from '\.\/SettingsSim\.vue'/)
  assert.match(content, /import SettingsBluetooth from '\.\/SettingsBluetooth\.vue'/)
  assert.match(content, /import SettingsSatellite from '\.\/SettingsSatellite\.vue'/)

  // Navigation stack view titles
  assert.match(content, /sim: 'SIM 卡与网络设置'/)
  assert.match(content, /bluetooth: '蓝牙'/)
  assert.match(content, /satellite: '星链卫星网络'/)

  // Subpage template rendering
  assert.match(content, /<SettingsSim/)
  assert.match(content, /<SettingsBluetooth/)
  assert.match(content, /<SettingsSatellite/)

  // Card 3 items trigger push
  assert.match(content, /push\('sim'\)/)
  assert.match(content, /push\('bluetooth'\)/)
  assert.match(content, /push\('satellite'\)/)

  // Search items integration
  assert.match(content, /title: 'SIM 卡与网络设置'/)
  assert.match(content, /title: '星链卫星网络'/)
  assert.match(content, /title: '卫星网络'/)
})
