import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  useNotificationsStore, getIslandKeysForApp, getParentAppsForIslandKey
} from '../src/stores/notificationsStore.js'
import {
  useNotificationSettingsStore, BADGE_STYLES
} from '../src/stores/notificationSettingsStore.js'

const notifications = () => {
  setActivePinia(createPinia())
  return useNotificationsStore()
}
const notifSettings = () => {
  setActivePinia(createPinia())
  return useNotificationSettingsStore()
}
const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')

/* ==================== Dynamic Bar：现有逻辑不能被破坏 ==================== */
test('灵动岛原有 7 个开关与默认值保持不变（兼容底线）', () => {
  const s = notifications()
  for (const key of ['master', 'alarm', 'recorder', 'timer', 'stopwatch', 'prayer', 'media']) {
    assert.equal(s.islandSettings[key], true, `${key} 默认应为开`)
  }
})

test('新增的系统服务键默认值对齐真机（网络加速 / 游戏倒计时 关，其余开）', () => {
  const s = notifications()
  assert.equal(s.islandSettings.networkBoost, false)
  assert.equal(s.islandSettings.gameCountdown, false)
  for (const key of [
    'aiPhoto', 'screenRecord', 'noiseCancel', 'guide', 'hotspot', 'flashlight',
    'callSummary', 'verification', 'importantDay', 'smartText', 'sceneSmart', 'moreServices'
  ]) {
    assert.equal(s.islandSettings[key], true, `${key} 默认应为开`)
  }
})

test('isIslandEnabled：新增键关掉后拦截，未定义的键不拦截', () => {
  const s = notifications()
  assert.equal(s.isIslandEnabled('screenRecord'), true)
  s.islandSettings.screenRecord = false
  assert.equal(s.isIslandEnabled('screenRecord'), false)

  // 未定义的键不应被当成关闭（避免历史键遗漏导致灵动岛整块不显示）
  assert.equal(s.isIslandEnabled('notADefinedKey'), true)
})

test('setIslandEnabled 对新增键生效（不是只对老 6 项生效）', () => {
  const s = notifications()
  s.setIslandEnabled('flashlight', false)
  assert.equal(s.islandSettings.flashlight, false)
  s.setIslandEnabled('flashlight', true)
  assert.equal(s.islandSettings.flashlight, true)
})

test('应用→灵动岛键的映射没被改动', () => {
  assert.deepEqual(getIslandKeysForApp('recorder'), ['recorder'])
  assert.deepEqual(getIslandKeysForApp('clock'), ['alarm', 'timer', 'stopwatch'])
  assert.deepEqual(getIslandKeysForApp('spotify'), ['media'])
  assert.deepEqual(getParentAppsForIslandKey('prayer'), ['prayer', 'clock'])
  assert.deepEqual(getIslandKeysForApp('unknown-app'), [])
})

/* ==================== 状态栏 / 桌面角标 store ==================== */
test('状态栏默认态对齐真机：图标全开、显示电量百分比开', () => {
  const s = notifSettings()
  assert.equal(s.showBatteryPercent, true)
  for (const key of ['iconNetSpeed', 'iconMagneticPower', 'iconAlarm', 'iconHeadset', 'iconVpn', 'iconDataSaver']) {
    assert.equal(s[key], true, `${key} 默认应为开`)
  }
  assert.equal(s.badgeStyle, '数字')
})

test('状态栏图标清单：8 行、顺序与真机一致、每行都有图标名', () => {
  const s = notifSettings()
  const rows = s.iconRows()
  assert.deepEqual(rows.map(r => r.label), [
    '勿扰', '网速', '磁吸充电宝', '蓝牙', '闹钟', '耳机', 'VPN', '流量节省'
  ])
  for (const row of rows) {
    assert.ok(row.icon, `${row.label} 缺少图标名`)
  }
  // 勿扰/蓝牙必须走 controlStore（状态栏上真的会画这两个图标）
  assert.equal(rows.find(r => r.label === '勿扰').kind, 'control')
  assert.equal(rows.find(r => r.label === '蓝牙').kind, 'control')
})

test('store 拒绝未知键与非法角标样式', () => {
  const s = notifSettings()
  assert.equal(s.setBool('notAKey', true), false)
  assert.equal(s.setBadgeStyle('条纹'), false)
  assert.deepEqual(BADGE_STYLES, ['数字', '圆点'])
  assert.equal(s.setBadgeStyle('圆点'), true)
  assert.equal(s.badgeStyle, '圆点')
})

/* ==================== 结构：三个入口都接上了 ==================== */
test('通知与状态栏：状态栏 / Dynamic Bar / 桌面角标 三个入口可进入', () => {
  const src = read('src/components/apps/settings/SettingsNotifications.vue')

  assert.match(src, /go\('statusBar'\)/, '状态栏行未接线')
  assert.match(src, /go\('dynamicBar'\)/, 'Dynamic Bar 行未接线')
  assert.match(src, /go\('homeBadge'\)/, '桌面角标卡片未接线')

  // 三个子页都要有对应渲染分支
  assert.match(src, /subView === 'statusBar'/)
  assert.match(src, /subView === 'homeBadge'/)
  assert.match(src, /subView === 'dynamicBar'/)

  // 真机 Dynamic Bar 行有副标题
  assert.match(src, /在状态栏等多场景提供实时信息、系统状态与智能服务。/)
})

test('Dynamic Bar 子页的每一行 key 都真实存在于 islandSettings（防配置漂移）', () => {
  const src = read('src/components/apps/settings/SettingsNotifications.vue')
  const block = src.slice(src.indexOf('const ISLAND_SERVICES'), src.indexOf('const appLiveActivityStates'))
  const keys = [...block.matchAll(/key: '([a-zA-Z]+)'/g)].map(m => m[1])
  assert.ok(keys.length >= 15, `解析到的服务项偏少：${keys.length}`)

  const s = notifications()
  for (const key of keys) {
    assert.ok(key in s.islandSettings, `${key} 不在 islandSettings 里`)
  }
  // 有真实渲染逻辑的 6 项必须都在清单里
  for (const key of ['recorder', 'alarm', 'timer', 'stopwatch', 'prayer', 'media']) {
    assert.ok(keys.includes(key), `清单缺少有逻辑的 ${key}`)
  }
})

test('灵动岛高亮机制保留：data-island-key 与 highlightedIslandKey 仍在', () => {
  const src = read('src/components/apps/settings/SettingsNotifications.vue')
  assert.match(src, /:data-island-key="svc\.key"/)
  assert.match(src, /highlightedIslandKey === svc\.key/)
  assert.match(src, /function triggerIslandHighlight/)
  // 深链（通知设置 → 某个灵动岛活动）仍然工作
  assert.match(src, /notificationsStore\.targetSubView === 'dynamicBar'/)
})

test('两个新子页都走共享外壳，不自己重画导航', () => {
  for (const f of [
    'src/components/apps/settings/notifications/NotifStatusBar.vue',
    'src/components/apps/settings/notifications/NotifHomeBadge.vue'
  ]) {
    const src = read(f)
    assert.match(src, /SubPageShell/, `${f} 未使用共享外壳`)
    assert.doesNotMatch(src, /class="nav-round-btn"/, `${f} 自己又写了返回键`)
  }
})

test('通知标题不再回落到英文 appId（recorder 等）', () => {
  const zh = read('src/locales/messages.js')
  assert.match(zh, /recorder: '录音'/)
  assert.match(zh, /voicememos: '录音'/)
})
