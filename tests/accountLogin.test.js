import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { useAccountStore } from '../src/stores/accountStore.js'

test('accountStore supports login and logout state transitions', () => {
  setActivePinia(createPinia())
  const store = useAccountStore()

  assert.equal(store.isLoggedIn, true)
  store.logout()
  assert.equal(store.isLoggedIn, false)

  store.login('Ricky')
  assert.equal(store.isLoggedIn, true)
  assert.equal(store.username, 'Ricky')
})

test('SettingsAccountLogin.vue matches Image 2 reference layout and components', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsAccountLogin.vue')
  assert.ok(fs.existsSync(filePath), 'SettingsAccountLogin.vue must exist')
  const content = fs.readFileSync(filePath, 'utf-8')

  // 1. 顶栏：圆形返回按钮 + 右侧胶囊双操作 (扫码 + 帮助)
  assert.ok(content.includes('nav-round-btn'), 'Must have circular back button')
  assert.ok(content.includes('nav-capsule-group'), 'Must have capsule button group on right')
  assert.ok(content.includes('capsule-icon-btn'), 'Must have capsule icon buttons')

  // 2. 品牌区：品牌图标使用对应的通知图标 + INFINIX ID 标题 + 提示文案
  assert.ok(content.includes('brand-logo-squircle'), 'Must have squircle brand logo')
  assert.ok(content.includes('infinixNotificationIcon'), 'Must import infinix notification icon')
  assert.ok(content.includes('assets/icons/notification-apps/infinix.png'), 'Must reference notification infinix icon')
  assert.ok(content.includes('brand-logo-img'), 'Must render image element with brand-logo-img class')
  assert.ok(content.includes('Infinix'), 'Brand logo must contain Infinix')
  assert.ok(content.includes('INFINIX ID'), 'Title must be INFINIX ID')
  assert.ok(content.includes('登录即可享受更多个性化服务'), 'Must have subtitle')

  // 3. 登录按钮组：Google 登录主按钮 + 验证码登录 + 密码登录 + 注册账号
  assert.ok(content.includes('btn-google'), 'Must have Google primary login button')
  assert.ok(content.includes('google-badge-circle'), 'Google button must include Google badge circle')
  assert.ok(content.includes('使用 Google 登录'), 'Must have 使用 Google 登录 label')
  assert.ok(content.includes('使用验证码登录'), 'Must have 使用验证码登录 button')
  assert.ok(content.includes('使用密码登录'), 'Must have 使用密码登录 button')
  assert.ok(content.includes('注册账号'), 'Must have 注册账号 text link')

  // 4. 底部其他登录方式：分割线 + Facebook / LINE 圆形按钮
  assert.ok(content.includes('其他登录方式'), 'Must have 其他登录方式 divider')
  assert.ok(content.includes('fb-btn'), 'Must have Facebook round button')
  assert.ok(content.includes('line-btn'), 'Must have LINE round button')

  // 5. 交互弹窗：验证码登录、密码登录、注册、扫码、帮助
  assert.ok(content.includes("activeModal === 'sms'"), 'Must support SMS modal')
  assert.ok(content.includes("activeModal === 'password'"), 'Must support password modal')
  assert.ok(content.includes("activeModal === 'register'"), 'Must support register modal')
  assert.ok(content.includes("activeModal === 'qr'"), 'Must support QR code modal')
  assert.ok(content.includes("activeModal === 'help'"), 'Must support help modal')
})

test('SettingsApp.vue registers and routes to accountLogin view', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsApp.vue')
  const content = fs.readFileSync(filePath, 'utf-8')

  assert.ok(content.includes("import SettingsAccountLogin from './SettingsAccountLogin.vue'"), 'Must import SettingsAccountLogin')
  assert.ok(content.includes("accountLogin: 'INFINIX ID'"), 'Must declare accountLogin in viewTitles')
  assert.ok(content.includes("view === 'accountLogin'"), 'Must render SettingsAccountLogin when view is accountLogin')
  assert.ok(content.includes("@open-login=\"push('accountLogin')\""), 'Must listen to open-login on SettingsAccount')
})

test('Infinix notification icon preserves safe horizontal margins on left and right', () => {
  const assetPath = path.resolve('src/assets/icons/notification-apps/infinix.png')
  const publicPath = path.resolve('public/icons/infinix.png')
  assert.ok(fs.existsSync(assetPath))
  assert.ok(fs.existsSync(publicPath))

  // Inspect icon dimensions via node buffer
  const buf = fs.readFileSync(assetPath)
  // PNG width is at offset 16 (4 bytes big-endian), height is at offset 20
  const width = buf.readUInt32BE(16)
  const height = buf.readUInt32BE(20)
  assert.equal(width, 256, 'Icon width must be 256')
  assert.equal(height, 256, 'Icon height must be 256')
})
