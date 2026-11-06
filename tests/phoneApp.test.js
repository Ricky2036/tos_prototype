import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { usePhoneStore } from '../src/stores/phoneStore.js'

test('phoneStore manages call logs, contacts, keypad, and settings properly', () => {
  setActivePinia(createPinia())
  const store = usePhoneStore()

  // 1. Initial State
  assert.equal(store.currentTab, 'recents')
  assert.equal(store.recentsFilter, 'all')
  assert.equal(store.isKeypadOpen, true)
  assert.equal(store.dialedNumber, '')
  assert.ok(store.recents.length >= 8)
  assert.ok(store.contacts.length >= 8)
  assert.equal(store.duplicateBannerVisible, true)

  // 2. Filter Recents (all vs missed)
  assert.equal(store.filteredRecents.length, store.recents.length)
  store.recentsFilter = 'missed'
  assert.ok(store.filteredRecents.every(r => r.type === 'missed'))
  store.recentsFilter = 'all'

  // 3. Keypad Operations
  store.appendKey('1')
  store.appendKey('8')
  store.appendKey('1')
  assert.equal(store.dialedNumber, '181')
  store.deleteKey()
  assert.equal(store.dialedNumber, '18')
  store.clearNumber()
  assert.equal(store.dialedNumber, '')

  // 4. Call Actions
  store.startCall({ name: '陈晓敏', number: '136 8888 2233' })
  assert.ok(store.activeCall)
  assert.equal(store.activeCall.name, '陈晓敏')
  assert.equal(store.activeCall.status, 'calling')

  const initialRecentsCount = store.recents.length
  store.endCall()
  assert.equal(store.activeCall, null)
  assert.equal(store.recents.length, initialRecentsCount + 1)
  assert.equal(store.recents[0].type, 'outgoing')

  // 5. Contact Search
  store.searchQuery = '123'
  assert.ok(store.searchResults.length > 0)
  assert.ok(store.searchResults.some(c => c.name === '爱尚生活馆' || c.name === '智行客服专线'))

  store.searchQuery = '阿里'
  assert.ok(store.searchResults.some(c => c.name.includes('阿里')))

  // 6. Flash Call Replies
  const initialRepliesCount = store.settings.flashCallReplies.length
  store.addFlashCallReply('马上到公司')
  assert.equal(store.settings.flashCallReplies.length, initialRepliesCount + 1)
  assert.equal(store.settings.flashCallReplies[initialRepliesCount].text, '马上到公司')

  // 7. Duplicate Contacts Banner
  store.dismissDuplicateBanner()
  assert.equal(store.duplicateBannerVisible, false)

  // 8. Designated Numbers Management
  assert.ok(store.settings.designatedNumbers.length >= 2)
  store.addDesignatedNumber('188 9999 0000')
  assert.ok(store.settings.designatedNumbers.includes('188 9999 0000'))
  store.removeDesignatedNumber('188 9999 0000')
  assert.equal(store.settings.designatedNumbers.includes('188 9999 0000'), false)

  // 9. Speed Dial & Blacklist
  store.setSpeedDial(2, '测试联系人')
  assert.equal(store.settings.speedDial[2], '测试联系人')
  store.addBlackListNumber('10086')
  assert.ok(store.settings.blackList.includes('10086'))
  store.removeBlackListNumber('10086')
  assert.equal(store.settings.blackList.includes('10086'), false)
})

test('All Phone app components follow strict design rules without AI vertical borders', () => {
  const componentPaths = [
    'src/components/apps/phone/PhoneApp.vue',
    'src/components/apps/phone/PhoneRecentsTab.vue',
    'src/components/apps/phone/PhoneContactsTab.vue',
    'src/components/apps/phone/PhoneKeypad.vue',
    'src/components/apps/phone/PhoneSearch.vue',
    'src/components/apps/phone/PhoneFlashCallModal.vue',
    'src/components/apps/phone/PhoneCallScreen.vue',
    'src/components/apps/phone/settings/PhoneSettings.vue',
    'src/components/apps/phone/settings/PhoneAutoRecord.vue',
    'src/components/apps/phone/settings/PhoneAiAssistant.vue',
    'src/components/apps/phone/settings/PhoneFlashCallSettings.vue',
    'src/components/apps/phone/settings/PhoneHarassmentInterception.vue',
    'src/components/apps/phone/settings/PhoneUnknownId.vue',
    'src/components/apps/phone/settings/PhoneCallDisplayModal.vue',
    'src/components/apps/phone/settings/PhoneVideoShow.vue',
    'src/components/apps/phone/settings/PhoneAdvancedSettings.vue',
    'src/components/apps/phone/settings/PhoneCarrierFeatures.vue',
    'src/components/apps/phone/settings/PhoneAbout.vue'
  ]

  for (const relPath of componentPaths) {
    const fullPath = path.resolve(relPath)
    assert.ok(fs.existsSync(fullPath), `Component ${relPath} must exist`)
    const content = fs.readFileSync(fullPath, 'utf-8')

    // 严禁单边加粗竖线边框 (AI border-left)
    assert.doesNotMatch(content, /border-left:\s*[2-9]px\s+solid/i, `${relPath} must not contain AI vertical border`)
    assert.doesNotMatch(content, /border-left:\s*1[0-9]px\s+solid/i, `${relPath} must not contain AI vertical border`)
  }
})

test('PhoneApp properly integrates all tabs, keypad, search, settings, and calling', () => {
  const appPath = path.resolve('src/components/apps/phone/PhoneApp.vue')
  const content = fs.readFileSync(appPath, 'utf-8')

  assert.match(content, /import PhoneRecentsTab from '\.\/PhoneRecentsTab\.vue'/)
  assert.match(content, /import PhoneContactsTab from '\.\/PhoneContactsTab\.vue'/)
  assert.match(content, /import PhoneKeypad from '\.\/PhoneKeypad\.vue'/)
  assert.match(content, /import PhoneSearch from '\.\/PhoneSearch\.vue'/)
  assert.match(content, /import PhoneFlashCallModal from '\.\/PhoneFlashCallModal\.vue'/)
  assert.match(content, /import PhoneCallScreen from '\.\/PhoneCallScreen\.vue'/)
  assert.match(content, /import PhoneSettings from '\.\/settings\/PhoneSettings\.vue'/)

  assert.match(content, /PhoneRecentsTab/)
  assert.match(content, /PhoneContactsTab/)
  assert.match(content, /PhoneKeypad/)
  assert.match(content, /PhoneSearch/)
  assert.match(content, /PhoneFlashCallModal/)
  assert.match(content, /PhoneCallScreen/)
  assert.match(content, /PhoneSettings/)
})

test('PhoneCallDisplayModal conforms to big-card container and dual phone model layout', () => {
  const modalPath = path.resolve('src/components/apps/phone/settings/PhoneCallDisplayModal.vue')
  const content = fs.readFileSync(modalPath, 'utf-8')

  assert.match(content, /call-display-big-card/, 'Must use big-card container wrapping models and controls')
  assert.match(content, /call_display_banner\.png/)
  assert.match(content, /call_display_full\.png/)
  assert.match(content, /弹窗显示/)
  assert.match(content, /全屏显示/)
  assert.match(content, /custom-radio/)
  assert.match(content, /phoneStore\.callDisplayMode\s*=\s*'banner'/)
  assert.match(content, /phoneStore\.callDisplayMode\s*=\s*'fullscreen'/)
})

