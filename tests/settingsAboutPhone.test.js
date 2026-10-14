import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ABOUT_PHONE_PATH = path.resolve('src/components/apps/settings/SettingsAboutPhone.vue')
const SETTINGS_APP_PATH = path.resolve('src/components/apps/settings/SettingsApp.vue')
const XOS_BANNER_PATH = path.resolve('src/assets/img/xos-banner.png')

test('SettingsAboutPhone.vue exists and loads authentic XOS banner', () => {
  assert.ok(fs.existsSync(ABOUT_PHONE_PATH), 'SettingsAboutPhone.vue should exist')
  assert.ok(fs.existsSync(XOS_BANNER_PATH), 'xos-banner.png should exist in src/assets/img')

  const content = fs.readFileSync(ABOUT_PHONE_PATH, 'utf-8')
  assert.match(content, /xos-banner\.png/, 'Should import xos-banner.png')
  assert.match(content, /我的手机/, 'Navigation bar title should be 我的手机')
})

test('SettingsAboutPhone contains all 5 authentic cards aligned with connected Infinix NOTE 60 Pro', () => {
  const content = fs.readFileSync(ABOUT_PHONE_PATH, 'utf-8')

  // Card 1: XOS Brand Banner
  assert.match(content, /17\.0\.0/, 'Card 1 should display XOS version 17.0.0')
  assert.match(content, /检查更新/, 'Card 1 should contain 检查更新 button')

  // Card 2: Device Basics & Storage
  assert.match(content, /设备名称/, 'Card 2 should contain 设备名称')
  assert.match(content, /Infinix NOTE 60 Pro/, 'Card 2 should contain Infinix NOTE 60 Pro')
  assert.match(content, /存储空间/, 'Card 2 should contain 存储空间')
  assert.match(content, /217 GB \/ 256 GB/, 'Card 2 should contain 217 GB / 256 GB')
  assert.match(content, /存储压缩/, 'Card 2 should contain 存储压缩')
  assert.match(content, /60 GB/, 'Card 2 should contain 60 GB')

  // Card 3: Core Hardware Specs
  assert.match(content, /Infinix X6878/, 'Card 3 should contain model Infinix X6878')
  assert.match(content, /Snapdragon 7s Gen 4/, 'Card 3 should contain Snapdragon 7s Gen 4')
  assert.match(content, /12\.00 GB\+6\.00 GB/, 'Card 3 should contain 12.00 GB+6.00 GB memory')
  assert.match(content, /50M OIS\+8M/, 'Card 3 should contain rear camera 50M OIS+8M')
  assert.match(content, /13M/, 'Card 3 should contain front camera 13M')
  assert.match(content, /6000mAh/, 'Card 3 should contain battery 6000mAh')
  assert.match(content, /1208x2644/, 'Card 3 should contain display resolution 1208x2644')
  assert.match(content, /XGlide 引擎/, 'Card 3 should contain performance engine XGlide 引擎')

  // Card 4: System Versions & Serial
  assert.match(content, /Android 版本/, 'Card 4 should contain Android 版本')
  assert.match(content, /17\.0\.0\.038SP01\(OP003PF001AZ\)FANS/, 'Card 4 should contain exact build number')
  assert.match(content, /V1\.0/, 'Card 4 should contain hardware version V1.0')
  assert.match(content, /159467059A001123/, 'Card 4 should contain serial number 159467059A001123')

  // Card 5: Information & Legal
  assert.match(content, /手机信息/, 'Card 5 should contain 手机信息')
  assert.match(content, /电子保卡/, 'Card 5 should contain 电子保卡')
  assert.match(content, /法律信息/, 'Card 5 should contain 法律信息')
  assert.match(content, /用户体验改进计划/, 'Card 5 should contain 用户体验改进计划')
})

test('SettingsAboutPhone provides interactive feedback and easter eggs', () => {
  const content = fs.readFileSync(ABOUT_PHONE_PATH, 'utf-8')

  // Check update animation & state
  assert.match(content, /handleCheckUpdate/, 'Should provide handleCheckUpdate handler')
  assert.match(content, /正在检查更新\.\.\./, 'Should show checking state when checking update')

  // Build number developer easter egg
  assert.match(content, /handleBuildNumberClick/, 'Should handle repeated taps on build number')
  assert.match(content, /您已处于开发者模式/, 'Should notify user of developer mode')

  // Clean design rules
  assert.doesNotMatch(content, /border-left:\s*[2-9]px solid/, 'Must not use AI-style thick left vertical borders')
})

test('SettingsApp integrates SettingsAboutPhone seamlessly', () => {
  const content = fs.readFileSync(SETTINGS_APP_PATH, 'utf-8')

  assert.match(content, /import SettingsAboutPhone from '\.\/SettingsAboutPhone\.vue'/, 'SettingsApp should import SettingsAboutPhone')
  assert.match(content, /Infinix NOTE 60 Pro/, 'Settings card 2 should show Infinix NOTE 60 Pro')
  assert.match(content, /push\('about'\)/, 'Settings card 2 should navigate to about view')
  assert.match(content, /view === 'about'/, 'SettingsApp should render about view')
  assert.match(content, /aboutPhoneRef/, 'SettingsApp should bind aboutPhoneRef for navigation')
})
