import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { useAccountStore } from '../src/stores/accountStore.js'

test('accountStore manages security properties, fingerprint toggle, and password reset', () => {
  setActivePinia(createPinia())
  const store = useAccountStore()

  // 基础绑定与安全信息
  assert.equal(store.phone, '+86 181****8993')
  assert.equal(store.email, 'ric***@infinixmobility.com')
  assert.equal(store.fingerprintLogin, false, 'Fingerprint login should be disabled by default')
  assert.ok(Array.isArray(store.emergencyContacts), 'Emergency contacts should be an array')
  assert.ok(store.emergencyContacts.length >= 1, 'Should have at least 1 emergency contact')

  // 三方绑定与日志
  assert.ok(Array.isArray(store.thirdPartyAccounts), 'Third party accounts should be an array')
  assert.ok(store.thirdPartyAccounts.some(a => a.id === 'google' && a.bound), 'Google account should be bound')
  assert.ok(Array.isArray(store.accountLogs), 'Account logs should be an array')

  // 指纹开关方法
  store.setFingerprintLogin(true)
  assert.equal(store.fingerprintLogin, true)
  store.setFingerprintLogin(false)
  assert.equal(store.fingerprintLogin, false)

  // 找回密码重置方法
  const initialLogCount = store.accountLogs.length
  store.resetPassword('Infinix@2026NewPass')
  assert.ok(store.passwordLastChanged, 'Password last changed date should be recorded')
  assert.equal(store.accountLogs.length, initialLogCount + 1, 'A new security log should be created on reset password')
  assert.equal(store.accountLogs[0].action, '密码重置成功')
})

test('SettingsAccountSecurity.vue matches all 3 card groups and items from reference image', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsAccountSecurity.vue')
  const content = fs.readFileSync(filePath, 'utf-8')

  // 顶部导航栏
  assert.ok(content.includes('账号安全'), 'Must contain 账号安全 title')
  assert.ok(content.includes('nav-round-btn'), 'Navbar must contain circular back button')

  // 分组 1: 电话号码、电子邮箱、紧急联系人
  assert.ok(content.includes('电话号码'), 'Group 1 must include 电话号码')
  assert.ok(content.includes('电话号码可用于登录账号、重置密码和身份验证。'), 'Group 1 must include exact phone subtitle')
  assert.ok(content.includes('电子邮箱'), 'Group 1 must include 电子邮箱')
  assert.ok(content.includes('电子邮箱可用于登录账号、重置密码和身份验证。'), 'Group 1 must include exact email subtitle')
  assert.ok(content.includes('紧急联系人'), 'Group 1 must include 紧急联系人')

  // 分组 2: 使用指纹登录和验证、绑定三方、修改密码、账号日志
  assert.ok(content.includes('使用指纹登录和验证'), 'Group 2 must include 使用指纹登录和验证')
  assert.ok(content.includes('toggle-track'), 'Group 2 must render animated toggle switch')
  assert.ok(content.includes('绑定三方'), 'Group 2 must include 绑定三方')
  assert.ok(content.includes('三方账号可用于登录账号。'), 'Group 2 must include exact third-party subtitle')
  assert.ok(content.includes('修改密码'), 'Group 2 must include 修改密码')
  assert.ok(content.includes('账号日志'), 'Group 2 must include 账号日志')

  // 分组 3: 账号注销
  assert.ok(content.includes('账号注销'), 'Group 3 must include 账号注销')

  // 底部守护标志: XGuard
  assert.ok(content.includes('XGuard'), 'Footer must include XGuard badge')
  assert.ok(content.includes('#00C853'), 'XGuard must render green shield icon')
})

test('SettingsAccountSecurity.vue implements complete 4-step password recovery flow', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsAccountSecurity.vue')
  const content = fs.readFileSync(filePath, 'utf-8')

  // 找回密码多步流程
  assert.ok(content.includes('recoveryStep'), 'Must track recovery flow step state')
  assert.ok(content.includes('recovery-steps-bar'), 'Must render recovery step indicator bar')

  // 步骤 1: 验证方式选择
  assert.ok(content.includes('已绑定手机号') && content.includes('已绑定安全邮箱'), 'Step 1 must allow selecting phone or email')
  assert.ok(content.includes('获取验证码'), 'Step 1 must contain get verification code button')

  // 步骤 2: 验证码校验
  assert.ok(content.includes('code-input-cell'), 'Step 2 must provide 6-digit code input boxes')
  assert.ok(content.includes('countdown'), 'Step 2 must provide countdown timer')
  assert.ok(content.includes('fillDemoCode'), 'Step 2 must provide quick demo code filler')

  // 步骤 3: 设置新密码
  assert.ok(content.includes('newPassword'), 'Step 3 must support new password input')
  assert.ok(content.includes('confirmPassword'), 'Step 3 must support confirm password input')
  assert.ok(content.includes('strength-meter'), 'Step 3 must calculate and display password strength')

  // 步骤 4: 重置成功
  assert.ok(content.includes('密码重置成功'), 'Step 4 must display password reset success state')

  // 修改密码与找回密码跳转联动
  assert.ok(content.includes('忘记原密码？通过安全验证找回密码'), 'Password change modal must link directly to recovery flow')
})

test('SettingsAccount and SettingsApp properly integrate accountSecurity navigation', () => {
  const accountFilePath = path.resolve('src/components/apps/settings/SettingsAccount.vue')
  const accountContent = fs.readFileSync(accountFilePath, 'utf-8')
  assert.ok(accountContent.includes("emit('open-security')"), "SettingsAccount must emit open-security on row click")

  const appFilePath = path.resolve('src/components/apps/settings/SettingsApp.vue')
  const appContent = fs.readFileSync(appFilePath, 'utf-8')
  assert.ok(appContent.includes('SettingsAccountSecurity'), 'SettingsApp must import SettingsAccountSecurity')
  assert.ok(appContent.includes("@open-security=\"push('accountSecurity')\""), 'SettingsApp must handle open-security event')
  assert.ok(appContent.includes("view === 'accountSecurity'"), 'SettingsApp must render accountSecurity view')
  assert.ok(appContent.includes("accountSecurity: '账号安全'"), "viewTitles must include accountSecurity: '账号安全'")
})
