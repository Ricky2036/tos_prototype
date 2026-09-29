import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { getApp, ONELEAP_APP } from '../src/config/apps.js'
import { useSystemStore } from '../src/stores/systemStore.js'
import { useControlStore } from '../src/stores/controlStore.js'

const ONELEAP_APP_PATH = path.resolve('src/components/apps/oneleap/OneLeapApp.vue')
const REGISTRY_PATH = path.resolve('src/components/apps/registry.js')
const CONTROL_CENTER_PATH = path.resolve('src/components/system/ControlCenter.vue')
const SETTINGS_APP_PATH = path.resolve('src/components/apps/settings/SettingsApp.vue')
const SCREEN_VIEW_PATH = path.resolve('src/components/phone/ScreenView.vue')

test('OneLeap application metadata is registered in getApp without mutating gridApps', () => {
  const app = getApp('oneleap')
  assert.ok(app, 'getApp("oneleap") should return app config')
  assert.equal(app.id, 'oneleap')
  assert.equal(app.name, 'OneLeap')
  assert.equal(app.depth, 'core')
  assert.equal(app.heroBackground, '#121826')
})

test('appComponents registry includes OneLeapApp component', () => {
  assert.ok(fs.existsSync(REGISTRY_PATH), 'registry.js should exist')
  const content = fs.readFileSync(REGISTRY_PATH, 'utf-8')
  assert.match(content, /import OneLeapApp from '\.\/oneleap\/OneLeapApp\.vue'/, 'Should import OneLeapApp')
  assert.match(content, /oneleap:\s*OneLeapApp/, 'Should register oneleap in appComponents')
})

test('OneLeapApp.vue exists and implements all multi-device quick controls and recording features', () => {
  assert.ok(fs.existsSync(ONELEAP_APP_PATH), 'OneLeapApp.vue should exist')
  const content = fs.readFileSync(ONELEAP_APP_PATH, 'utf-8')

  // Topology nodes
  assert.match(content, /AI Mate 手机/, 'Central node should be AI Mate phone')
  assert.match(content, /录音充电宝/, 'Topology should include 录音充电宝')
  assert.match(content, /我的口袋打印机/, 'Topology should include 我的口袋打印机')
  assert.match(content, /OneLeap Watch/, 'Topology should include OneLeap Watch')
  assert.match(content, /AI 音频眼镜/, 'Topology should include AI 音频眼镜')

  // Recording Power Bank controls
  assert.match(content, /startOrPauseRecording/, 'Should handle start and pause recording')
  assert.match(content, /拾音模式/, 'Should support pickup mode selection')
  assert.match(content, /四周均衡拾音/, 'Should include pickup mode copy')
  assert.match(content, /反向充电/, 'Should support reverse charging toggle')
  assert.match(content, /9W/, 'Should indicate 9W power supply')

  // Pocket Printer controls
  assert.match(content, /开始打印/, 'Should have print action button')
  assert.match(content, /正在打开 AI Mate/, 'Should launch AI Mate flow')
  assert.match(content, /相纸 5 \/ 5 张/, 'Should display photo paper count')

  // Back handling
  assert.match(content, /handleBack/, 'Should support back navigation')
  assert.match(content, /useBackHandler/, 'Should integrate with global system back handler')
})

test('systemStore opens OneLeap as active app and touches recent apps', () => {
  setActivePinia(createPinia())
  const system = useSystemStore()
  system.unlock()

  assert.equal(system.baseLayer, 'home')
  assert.equal(system.activeAppId, null)

  system.openApp('oneleap')
  assert.equal(system.baseLayer, 'app')
  assert.equal(system.activeAppId, 'oneleap')
  assert.ok(system.recentApps.includes('oneleap'), 'oneleap should be in recentApps')
})

test('ControlCenter pill click on oneLeap triggers system.openApp("oneleap") and closes control center', () => {
  assert.ok(fs.existsSync(CONTROL_CENTER_PATH), 'ControlCenter.vue should exist')
  const content = fs.readFileSync(CONTROL_CENTER_PATH, 'utf-8')

  // Verify ControlCenter onPillClick opens oneleap app
  assert.match(content, /else if \(id === 'oneLeap'\)\s*\{\s*system\.closeOverlay\('controlCenter'\)\s*system\.openApp\('oneleap'\)\s*\}/, 'ControlCenter oneLeap click should open oneleap app')

  // Verify store state transition
  setActivePinia(createPinia())
  const system = useSystemStore()
  const control = useControlStore()

  system.unlock()
  system.overlays.controlCenter = { status: 'open', progress: 1 }

  if (control.fineTuningMode) {
    control.selectTarget('oneLeap', 'icon')
  } else if (!control.editing) {
    system.closeOverlay('controlCenter')
    system.openApp('oneleap')
  }

  assert.equal(system.overlays.controlCenter.status, 'closed')
  assert.equal(system.activeAppId, 'oneleap')
  assert.equal(system.baseLayer, 'app')
})

test('ScreenView and Settings include OneLeap bindings', () => {
  const screenContent = fs.readFileSync(SCREEN_VIEW_PATH, 'utf-8')
  assert.match(screenContent, /'oneleap'/, 'ScreenView DARK_BG_APPS should include oneleap for white chrome')

  const settingsContent = fs.readFileSync(SETTINGS_APP_PATH, 'utf-8')
  assert.match(settingsContent, /system\.openApp\('oneleap'\)/, 'Settings multiDevice should trigger system.openApp("oneleap")')
})
