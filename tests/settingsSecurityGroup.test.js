import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const SECURITY_PATH = path.resolve('src/components/apps/settings/SettingsSecurity.vue')
const PRIVACY_PATH = path.resolve('src/components/apps/settings/SettingsPrivacy.vue')
const APPS_PATH = path.resolve('src/components/apps/settings/SettingsAppsManage.vue')
const LOCATION_PATH = path.resolve('src/components/apps/settings/SettingsLocation.vue')
const SETTINGS_APP_PATH = path.resolve('src/components/apps/settings/SettingsApp.vue')

test('SettingsSecurity.vue implements password & security aligned with real phone', () => {
  assert.ok(fs.existsSync(SECURITY_PATH), 'SettingsSecurity.vue should exist')
  const content = fs.readFileSync(SECURITY_PATH, 'utf-8')

  // Navigation
  assert.match(content, /密码与安全/)
  assert.match(content, /data-nav-back/)

  // 2x2 cards
  assert.match(content, /锁屏密码/)
  assert.match(content, /指纹/)
  assert.match(content, /面部识别/)
  assert.match(content, /隐私密码/)

  // System security list
  assert.match(content, /手机防盗/)
  assert.match(content, /系统安全/)
  assert.match(content, /Google Play 系统更新/)
  assert.match(content, /2026年7月1日/)

  // Recommendation & badge
  assert.match(content, /你可能想找/)
  assert.match(content, /应用锁/)
  assert.match(content, /XGuard/)
})

test('SettingsPrivacy.vue implements privacy & permissions aligned with real phone', () => {
  assert.ok(fs.existsSync(PRIVACY_PATH), 'SettingsPrivacy.vue should exist')
  const content = fs.readFileSync(PRIVACY_PATH, 'utf-8')

  // Navigation
  assert.match(content, /权限与隐私/)
  assert.match(content, /data-nav-back/)

  // Score card
  assert.match(content, /53/)
  assert.match(content, /隐私安全检测/)

  // 10 feature cards
  assert.match(content, /XHide/)
  assert.match(content, /XClone/)
  assert.match(content, /应用锁/)
  assert.match(content, /防偷窥/)
  assert.match(content, /AI 防诈骗/)
  assert.match(content, /屏幕共享隐私保护/)
  assert.match(content, /借出模式/)
  assert.match(content, /双系统/)
  assert.match(content, /支付环境保护/)
  assert.match(content, /广告管控/)

  // Lists & permissions
  assert.match(content, /维修模式/)
  assert.match(content, /安全键盘/)
  assert.match(content, /解锁安全保护/)
  assert.match(content, /摄像头访问权限/)
  assert.match(content, /麦克风访问权限/)
  assert.match(content, /隐私风险记录/)
  assert.match(content, /隐私信息中心/)
  assert.match(content, /应用权限管理/)
  assert.match(content, /特殊应用权限/)

  // DNV Certifications & footer
  assert.match(content, /ISO\/IEC 27001/)
  assert.match(content, /ISO\/IEC 27701/)
  assert.match(content, /ISO\/IEC 27018/)
  assert.match(content, /隐私政策/)
  assert.match(content, /XGuard/)
})

test('SettingsAppsManage.vue implements app management aligned with real phone', () => {
  assert.ok(fs.existsSync(APPS_PATH), 'SettingsAppsManage.vue should exist')
  const content = fs.readFileSync(APPS_PATH, 'utf-8')

  // Navigation
  assert.match(content, /应用管理/)
  assert.match(content, /data-nav-back/)

  // Features
  assert.match(content, /应用更新/)
  assert.match(content, /应用列表/)
  assert.match(content, /系统应用恢复/)
  assert.match(content, /应用双开/)
  assert.match(content, /默认应用/)
  assert.match(content, /屏幕使用时间/)
  assert.match(content, /联系人存储/)
  assert.match(content, /云端媒体设置/)
  assert.match(content, /Google 相册/)

  // Recommendations
  assert.match(content, /你可能想找/)
  assert.match(content, /自启动管理/)
  assert.match(content, /特殊应用权限/)
})

test('SettingsLocation.vue implements location services aligned with real phone', () => {
  assert.ok(fs.existsSync(LOCATION_PATH), 'SettingsLocation.vue should exist')
  const content = fs.readFileSync(LOCATION_PATH, 'utf-8')

  // Navigation
  assert.match(content, /位置信息/)
  assert.match(content, /data-nav-back/)

  // Main switch & permissions
  assert.match(content, /使用位置信息/)
  assert.match(content, /应用位置信息权限/)
  assert.match(content, /位置信息服务/)

  // Recent accesses
  assert.match(content, /近期位置信息访问/)
  assert.match(content, /Folax/)
  assert.match(content, /天气/)
  assert.match(content, /Transsioner/)
  assert.match(content, /查看全部/)
})

test('SettingsApp.vue connects Card 5 to dedicated pages, back handler, and search', () => {
  const content = fs.readFileSync(SETTINGS_APP_PATH, 'utf-8')

  // Imports
  assert.match(content, /import SettingsSecurity from '\.\/SettingsSecurity\.vue'/)
  assert.match(content, /import SettingsPrivacy from '\.\/SettingsPrivacy\.vue'/)
  assert.match(content, /import SettingsAppsManage from '\.\/SettingsAppsManage\.vue'/)
  assert.match(content, /import SettingsLocation from '\.\/SettingsLocation\.vue'/)

  // Card 5 clicks
  assert.match(content, /@click="push\('security'\)"/)
  assert.match(content, /@click="push\('privacy'\)"/)
  assert.match(content, /@click="push\('appsManage'\)"/)
  assert.match(content, /@click="push\('location'\)"/)

  // Secondary views template
  assert.match(content, /<SettingsSecurity ref="securityRef"/)
  assert.match(content, /<SettingsPrivacy ref="privacyRef"/)
  assert.match(content, /<SettingsAppsManage ref="appsManageRef"/)
  assert.match(content, /<SettingsLocation ref="locationRef"/)

  // Titles & back handlers
  assert.match(content, /security: '密码与安全'/)
  assert.match(content, /privacy: '权限与隐私'/)
  assert.match(content, /appsManage: '应用管理'/)
  assert.match(content, /location: '位置信息'/)
  assert.match(content, /view\.value === 'security' && securityRef\.value\?\.back\?\.\(\)/)
  assert.match(content, /view\.value === 'privacy' && privacyRef\.value\?\.back\?\.\(\)/)
  assert.match(content, /view\.value === 'appsManage' && appsManageRef\.value\?\.back\?\.\(\)/)
  assert.match(content, /view\.value === 'location' && locationRef\.value\?\.back\?\.\(\)/)

  // Search items
  assert.match(content, /id: 'security', title: '密码与安全', group: '安全与隐私', action: \(\) => push\('security'\)/)
  assert.match(content, /id: 'privacy', title: '权限与隐私', group: '安全与隐私', action: \(\) => push\('privacy'\)/)
  assert.match(content, /id: 'appManage', title: '应用管理', group: '应用', action: \(\) => push\('appsManage'\)/)
  assert.match(content, /id: 'location', title: '位置信息', group: '安全与隐私', action: \(\) => push\('location'\)/)
})
