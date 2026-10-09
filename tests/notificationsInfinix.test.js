import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seedNotifications } from '../src/config/seedNotifications.js'
import { MESSAGES } from '../src/locales/messages.js'
import { APP_NAMES } from '../src/locales/app-names.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

test('Infinix account login notification is seeded as first item', () => {
  const notifs = seedNotifications()
  assert.ok(notifs.length > 0, 'seed notifications should not be empty')
  const first = notifs[0]
  assert.equal(first.appId, 'infinix', 'First notification must be infinix')
  assert.equal(first.iconType, 'infinix', 'Icon type must be infinix')
  assert.equal(first.minutesAgo, 0, 'Minutes ago should be 0 (just now)')
})

test('Infinix notification icon is registered in notifIcons.js', () => {
  const iconsPath = path.resolve(rootDir, 'src/components/ui/notifIcons.js')
  const content = fs.readFileSync(iconsPath, 'utf8')
  assert.match(content, /import infinix from '\.\.\/\.\.\/assets\/icons\/notification-apps\/infinix\.png'/, 'Must import infinix png')
  assert.match(content, /infinix:\s*IC_IMG\(infinix\)/, 'NOTIF_ICONS must register infinix')
})

test('Infinix icon asset files exist on disk', () => {
  const assetPath = path.resolve(rootDir, 'src/assets/icons/notification-apps/infinix.png')
  const publicPath = path.resolve(rootDir, 'public/icons/infinix.png')
  assert.ok(fs.existsSync(assetPath), 'src asset infinix.png must exist')
  assert.ok(fs.existsSync(publicPath), 'public icon infinix.png must exist')
  assert.ok(fs.statSync(assetPath).size > 0, 'src asset infinix.png must not be empty')
  assert.ok(fs.statSync(publicPath).size > 0, 'public icon infinix.png must not be empty')
})

test('Infinix notification title and body localization exist for zh, en, and bn', () => {
  assert.equal(MESSAGES.zh.demoNotifTitles.infinix, '完成账号登录')
  assert.equal(MESSAGES.zh.demoNotifBodies.infinix, '登录INFINIX ID,即可享受更多个性化服务')

  assert.equal(MESSAGES.en.demoNotifTitles.infinix, 'Complete Account Login')
  assert.equal(MESSAGES.en.demoNotifBodies.infinix, 'Sign in to INFINIX ID to enjoy more personalized services')

  assert.equal(MESSAGES.bn.demoNotifTitles.infinix, 'অ্যাকাউন্ট লগইন সম্পন্ন করুন')
  assert.equal(MESSAGES.bn.demoNotifBodies.infinix, 'আরও ব্যক্তিগতকৃত সেবা উপভোগ করতে INFINIX ID-তে লগইন করুন')
})

test('Infinix app name is registered in APP_NAMES', () => {
  assert.equal(APP_NAMES.zh.infinix, 'Infinix ID')
  assert.equal(APP_NAMES.en.infinix, 'Infinix ID')
  assert.equal(APP_NAMES.bn.infinix, 'Infinix ID')
})

test('NotificationCenter and SettingsApp handle jumping to account page on infinix notification click', () => {
  const ncPath = path.resolve(rootDir, 'src/components/system/NotificationCenter.vue')
  const ncContent = fs.readFileSync(ncPath, 'utf8')
  assert.match(ncContent, /if \(n\.appId === 'infinix'\)/, 'NotificationCenter must detect infinix appId')
  assert.match(ncContent, /notifications\.setTargetView\('account'\)/, 'NotificationCenter must set targetView to account')
  assert.match(ncContent, /system\.openApp\('settings'\)/, 'NotificationCenter must open settings app')

  const settingsAppPath = path.resolve(rootDir, 'src/components/apps/settings/SettingsApp.vue')
  const settingsContent = fs.readFileSync(settingsAppPath, 'utf8')
  assert.match(settingsContent, /notificationsStore\.targetView === 'account'/, 'SettingsApp must handle targetView account')
  assert.match(settingsContent, /newTarget === 'account'/, 'SettingsApp watch must react to targetView account')

  const lockScreenPath = path.resolve(rootDir, 'src/components/system/LockScreen.vue')
  const lockScreenContent = fs.readFileSync(lockScreenPath, 'utf8')
  assert.match(lockScreenContent, /item\.raw\?\.appId === 'infinix'/, 'LockScreen must handle clicking infinix notification')
})
