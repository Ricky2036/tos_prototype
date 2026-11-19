import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { setActivePinia, createPinia } from 'pinia'
import { useBackScreenStore, BACK_SCREEN_PRODUCT_LINES, BACK_SCREEN_TRACKS } from '../src/stores/backScreenStore.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

test('backScreenStore defines product lines, tracks, and reactive states', () => {
  setActivePinia(createPinia())
  const store = useBackScreenStore()

  assert.ok(Array.isArray(BACK_SCREEN_PRODUCT_LINES), 'BACK_SCREEN_PRODUCT_LINES must be an array')
  assert.ok(BACK_SCREEN_PRODUCT_LINES.length >= 8, 'Must support at least 8 product lines')
  assert.ok(BACK_SCREEN_PRODUCT_LINES.some((p) => p.id === 'itel'), 'Must include itel product line')
  assert.ok(BACK_SCREEN_PRODUCT_LINES.some((p) => p.id === 'camon'), 'Must include camon product line')

  assert.ok(Array.isArray(BACK_SCREEN_TRACKS), 'BACK_SCREEN_TRACKS must be an array')
  assert.ok(BACK_SCREEN_TRACKS.length >= 3, 'Must support music tracks')

  assert.equal(store.isScreenOn, true)
  assert.equal(store.isDisplayAwake, true)
  assert.equal(store.activeGroup, 'active')
  assert.equal(store.activePage, 'clock')
  assert.equal(store.settings.dialStyle, '动态表盘')
  assert.equal(store.settings.flipToWake, true)
  assert.equal(store.settings.doubleTapToWake, true)

  // Test state mutation
  store.isScreenOn = false
  assert.equal(store.isScreenOn, false)
  store.activePage = 'weather'
  assert.equal(store.activePage, 'weather')
  store.productLine = 'camon'
  assert.equal(store.productLine, 'camon')
})

test('PhoneFrame.vue provides rear surface, brand, and slot when face="back"', () => {
  const file = path.join(root, 'src/components/phone/PhoneFrame.vue')
  const content = fs.readFileSync(file, 'utf8')

  assert.match(content, /defineProps\(\{\s*face:/, 'Must accept face prop')
  assert.match(content, /phone-rear-surface/, 'Must render phone-rear-surface')
  assert.match(content, /phone-rear-camera/, 'Must render phone-rear-camera')
  assert.match(content, /phone-rear-brand/, 'Must render phone-rear-brand')
  assert.match(content, /<slot name="back">/, 'Must provide back slot')
})

test('App.vue integrates phone turntable, flip button, and back screen scene', () => {
  const file = path.join(root, 'src/App.vue')
  const content = fs.readFileSync(file, 'utf8')

  assert.match(content, /useBackScreenStore/, 'Must use backScreen store')
  assert.match(content, /phone-turntable/, 'Must contain phone-turntable container')
  assert.match(content, /phone-flip-control/, 'Must have phone-flip-control button')
  assert.match(content, /tos-phone-flip/, 'Must register tos-phone-flip event listener')
  assert.match(content, /rear-display-scene/, 'Must render rear-display-scene')
  assert.match(content, /BackScreenWeather/, 'Must render BackScreenWeather')
  assert.match(content, /BackScreenClockWallpaper/, 'Must render BackScreenClockWallpaper')
  assert.match(content, /BackScreenPassiveDisplay/, 'Must render BackScreenPassiveDisplay')
})

test('DevConsole.vue supports backscreen module selection and BackScreenDemo', () => {
  const file = path.join(root, 'src/components/dev/DevConsole.vue')
  const content = fs.readFileSync(file, 'utf8')

  assert.match(content, /BackScreenDemo/, 'Must import BackScreenDemo')
  assert.match(content, /value="backscreen"/, 'Must have backscreen option in module select')
  assert.match(content, /selectedModule === 'backscreen'/, 'Must mount BackScreenDemo when module selected')
  assert.match(content, /tab.*backscreen.*module.*backscreen/, 'Must support backscreen URL parameter')
})

test('SettingsApp.vue and SettingsBackScreen.vue provide settings page and navigation', () => {
  const settingsApp = path.join(root, 'src/components/apps/settings/SettingsApp.vue')
  const appContent = fs.readFileSync(settingsApp, 'utf8')

  assert.match(appContent, /SettingsBackScreen/, 'SettingsApp must import SettingsBackScreen')
  assert.match(appContent, /backScreen:\s*['"]灵动背屏['"]/, 'viewTitles must declare 灵动背屏')
  assert.match(appContent, /id:\s*['"]backScreen['"]/, 'Search list must include backScreen')
  assert.match(appContent, /view === 'backScreen'/, 'Must route to SettingsBackScreen')
  assert.match(appContent, /bg-back-screen/, 'Must define bg-back-screen style')

  const backScreenSettings = path.join(root, 'src/components/apps/settings/SettingsBackScreen.vue')
  assert.ok(fs.existsSync(backScreenSettings), 'SettingsBackScreen.vue must exist')
  const backSettingsContent = fs.readFileSync(backScreenSettings, 'utf8')
  assert.match(backSettingsContent, /useBackScreenStore/, 'SettingsBackScreen must use backScreenStore')
  assert.match(backSettingsContent, /ToggleSwitch/, 'Must use ToggleSwitch component')
})

test('All backscreen components exist and have valid structure', () => {
  const comps = [
    'src/components/dev/BackScreenCalendar.vue',
    'src/components/dev/BackScreenCamera.vue',
    'src/components/dev/BackScreenClockWallpaper.vue',
    'src/components/dev/BackScreenDemo.vue',
    'src/components/dev/BackScreenPassiveDisplay.vue',
    'src/components/dev/BackScreenWeather.vue'
  ]

  for (const c of comps) {
    const full = path.join(root, c)
    assert.ok(fs.existsSync(full), `${c} must exist`)
    const content = fs.readFileSync(full, 'utf8')
    assert.ok(content.length > 50, `${c} must not be empty`)
    assert.ok(!content.includes('border-left: 3px'), `${c} must not contain AI vertical border`)
    assert.ok(!content.includes('border-left: 4px'), `${c} must not contain AI vertical border`)
  }
})
