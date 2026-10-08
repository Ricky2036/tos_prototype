import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('SettingsWallet.vue contains all elements matching Image 2 reference specification', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsWallet.vue')
  assert.ok(fs.existsSync(filePath), 'SettingsWallet.vue component must exist')

  const content = fs.readFileSync(filePath, 'utf-8')

  // 1. 顶部返回按钮与卡包标题
  assert.ok(content.includes('wallet-nav-bar'), 'Must contain wallet-nav-bar')
  assert.ok(content.includes('卡包'), 'Must contain 卡包 title')
  assert.ok(content.includes("emit('back')"), 'Must emit back event on return button click')

  // 2. 顶部卡券焦点大卡
  assert.ok(content.includes('wallet-hero-card'), 'Must contain wallet-hero-card')
  assert.ok(content.includes('hero-banner-img'), 'Must contain hero banner image')
  assert.ok(content.includes('卡券'), 'Must contain 卡券 title')
  assert.ok(content.includes('即刻添加，解锁数字权益与专属会员服务'), 'Must contain card benefits subtitle')
  assert.ok(content.includes('+ 去添加'), 'Must contain + 去添加 action button')

  // 3. 门禁卡与证件功能卡片
  assert.ok(content.includes('wallet-section-card'), 'Must contain wallet-section-card')
  assert.ok(content.includes('门禁卡'), 'Must contain 门禁卡 cell')
  assert.ok(content.includes('一碰开门，轻装出行'), 'Must contain 门禁卡 subtitle')
  assert.ok(content.includes('证件'), 'Must contain 证件 cell')
  assert.ok(content.includes('随时随地查看您的证件'), 'Must contain 证件 subtitle')

  // 4. 底部三段式胶囊悬浮导航栏
  assert.ok(content.includes('wallet-floating-bar'), 'Must contain wallet-floating-bar')
  assert.ok(content.includes('floating-tab-item'), 'Must contain floating tab items')
  assert.ok(content.includes('主页'), 'Must contain 主页 tab')
  assert.ok(content.includes('我的'), 'Must contain 我的 tab')

  // 5. 交互轻提示浮层
  assert.ok(content.includes('wallet-toast'), 'Must contain toast feedback element')
})

test('Wallet static assets exist and are valid', () => {
  const bannerPath = path.resolve('src/assets/img/wallet-hero-banner.jpg')
  assert.ok(fs.existsSync(bannerPath), 'wallet-hero-banner.jpg must exist')
  const bannerStats = fs.statSync(bannerPath)
  assert.ok(bannerStats.size > 1000, 'wallet-hero-banner.jpg must not be empty')

  const iconPath = path.resolve('src/assets/icons/wallet-entry-icon.png')
  assert.ok(fs.existsSync(iconPath), 'wallet-entry-icon.png must exist')
  const iconStats = fs.statSync(iconPath)
  assert.ok(iconStats.size > 500, 'wallet-entry-icon.png must not be empty')
})
