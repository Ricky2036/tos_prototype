import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { useAccountStore } from '../src/stores/accountStore.js'

test('accountStore manages user profile, feature cards, and 3-device list correctly', () => {
  setActivePinia(createPinia())
  const store = useAccountStore()

  // 默认登录状态与用户信息
  assert.equal(store.isLoggedIn, true)
  assert.equal(store.username, 'Ricky')
  assert.equal(store.phone, '+86 181****8993')
  assert.ok(store.avatar, 'avatar asset must be defined')

  // 云存储与服务状态
  assert.equal(store.cloudStorage.used, '23.37 MB')
  assert.equal(store.cloudStorage.total, '40 GB')
  assert.equal(store.findMyDeviceEnabled, true)
  assert.equal(store.electronicWarrantyActive, true)
  assert.equal(store.aiCredits, 5000)
  assert.equal(store.version, '20.0.0.178')

  // 设备列表仅保留顶部三个设备
  assert.equal(store.devices.length, 3, 'devices list must retain only the top 3 devices')
  assert.equal(store.devices[0].name, 'Infinix NOTE 60 Pro')
  assert.equal(store.devices[0].subtitle, '本设备')
  assert.equal(store.devices[0].isCurrent, true)
  assert.equal(store.devices[1].name, 'Infinix GT 50 Pro')
  assert.equal(store.devices[2].name, 'TECNO POVA 7 5G')

  // 登出与登入方法测试
  store.logout()
  assert.equal(store.isLoggedIn, false)

  store.login('Ricky')
  assert.equal(store.isLoggedIn, true)
  assert.equal(store.username, 'Ricky')
})

test('SettingsAccount.vue contains all UI elements matching reference specification', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsAccount.vue')
  const content = fs.readFileSync(filePath, 'utf-8')

  // 顶部导航栏
  assert.ok(content.includes('Infinix ID'), 'Navbar must contain Infinix ID title')
  assert.ok(content.includes('nav-round-btn'), 'Navbar must contain circular action buttons')

  // 4 张功能卡片
  assert.ok(content.includes('Infinix Cloud'), 'Must contain Infinix Cloud card')
  assert.ok(content.includes('查找我的设备'), 'Must contain 查找我的设备 card')
  assert.ok(content.includes('电子保卡'), 'Must contain 电子保卡 card')
  assert.ok(content.includes('AI Credits'), 'Must contain AI Credits card')

  // 设置列表项
  assert.ok(content.includes('个人信息'), 'Must contain 个人信息')
  assert.ok(content.includes('账号安全'), 'Must contain 账号安全')
  assert.ok(content.includes('隐私与协议'), 'Must contain 隐私与协议')
  assert.ok(content.includes('帮助中心'), 'Must contain 帮助中心')
  assert.ok(content.includes('版本'), 'Must contain 版本')

  // 设备列表与退出按钮
  assert.ok(content.includes('device-phone-icon'), 'Must render realistic phone icons')
  assert.ok(content.includes('logout-btn'), 'Must render logout button')
  assert.ok(content.includes('modal-dialog'), 'Must contain logout confirmation modal')
})

test('SettingsApp.vue properly integrates account page routing and home entry card', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsApp.vue')
  const content = fs.readFileSync(filePath, 'utf-8')

  assert.ok(content.includes("push('account')"), "Settings home account card must route to push('account')")
  assert.ok(content.includes("view === 'account'"), "Settings router must render account view")
  assert.ok(content.includes('SettingsAccount'), "SettingsApp must import and render SettingsAccount")
  assert.ok(content.includes("account: 'Infinix ID'"), "viewTitles must include Infinix ID")
})
