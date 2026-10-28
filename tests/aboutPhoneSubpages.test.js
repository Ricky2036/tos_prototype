import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const STORE_PATH = path.resolve('src/stores/deviceStore.js')
const ABOUT_PATH = path.resolve('src/components/apps/settings/SettingsAboutPhone.vue')
const MODAL_PATH = path.resolve('src/components/apps/settings/about/AboutDeviceNameModal.vue')
const MEMFUSION_PATH = path.resolve('src/components/apps/settings/about/AboutMemFusion.vue')
const STATUS_PATH = path.resolve('src/components/apps/settings/about/AboutPhoneStatus.vue')
const ANDROID_PATH = path.resolve('src/components/apps/settings/about/AboutAndroidVersion.vue')
const WARRANTY_PATH = path.resolve('src/components/apps/settings/about/AboutElectronicWarranty.vue')
const LEGAL_PATH = path.resolve('src/components/apps/settings/about/AboutLegalInfo.vue')

test('deviceStore exists and exports complete reactive device states and mutators', () => {
  assert.ok(fs.existsSync(STORE_PATH), 'deviceStore.js must exist')
  const content = fs.readFileSync(STORE_PATH, 'utf-8')

  assert.match(content, /useDeviceStore/, 'Must export useDeviceStore')
  assert.match(content, /deviceName/, 'Must track deviceName')
  assert.match(content, /memFusionEnabled/, 'Must track memFusionEnabled')
  assert.match(content, /memFusionSize/, 'Must track memFusionSize')
  assert.match(content, /totalRamText/, 'Must compute totalRamText')
  assert.match(content, /Infinix NOTE 60 Pro/, 'Default device name should be Infinix NOTE 60 Pro')
  assert.match(content, /physicalRam = 12/, 'Physical RAM must be 12GB')
})

test('All 6 subpage components exist and strictly follow design rules without AI vertical borders', () => {
  const components = [
    { path: MODAL_PATH, name: 'AboutDeviceNameModal.vue' },
    { path: MEMFUSION_PATH, name: 'AboutMemFusion.vue' },
    { path: STATUS_PATH, name: 'AboutPhoneStatus.vue' },
    { path: ANDROID_PATH, name: 'AboutAndroidVersion.vue' },
    { path: WARRANTY_PATH, name: 'AboutElectronicWarranty.vue' },
    { path: LEGAL_PATH, name: 'AboutLegalInfo.vue' }
  ]

  for (const { path: p, name } of components) {
    assert.ok(fs.existsSync(p), `${name} must exist`)
    const code = fs.readFileSync(p, 'utf-8')
    assert.doesNotMatch(code, /border-left:\s*[2-9]px solid/, `${name} must not use left vertical borders`)
  }
})

test('SettingsAboutPhone integrates all 6 subpages and wires up navigation', () => {
  const content = fs.readFileSync(ABOUT_PATH, 'utf-8')

  assert.match(content, /AboutDeviceNameModal/, 'Must import AboutDeviceNameModal')
  assert.match(content, /AboutMemFusion/, 'Must import AboutMemFusion')
  assert.match(content, /AboutPhoneStatus/, 'Must import AboutPhoneStatus')
  assert.match(content, /AboutAndroidVersion/, 'Must import AboutAndroidVersion')
  assert.match(content, /AboutElectronicWarranty/, 'Must import AboutElectronicWarranty')
  assert.match(content, /AboutLegalInfo/, 'Must import AboutLegalInfo')

  assert.match(content, /subPage === 'memFusion'/, 'Must route to memFusion subpage')
  assert.match(content, /subPage === 'status'/, 'Must route to status subpage')
  assert.match(content, /subPage === 'androidVersion'/, 'Must route to androidVersion subpage')
  assert.match(content, /subPage === 'warranty'/, 'Must route to warranty subpage')
  assert.match(content, /subPage === 'legal'/, 'Must route to legal subpage')

  assert.match(content, /function back\(\)/, 'Must expose back handler to consume navigation stack')
  assert.match(content, /emit\('open-storage'\)/, 'Must emit open-storage event when storage space is tapped')
})

test('Subpage interactions and specific features are complete', () => {
  // MemFusion options
  const memContent = fs.readFileSync(MEMFUSION_PATH, 'utf-8')
  assert.match(memContent, /\+3\.00 GB/, 'MemFusion must support +3GB')
  assert.match(memContent, /\+6\.00 GB/, 'MemFusion must support +6GB')
  assert.match(memContent, /\+12\.00 GB/, 'MemFusion must support +12GB')

  // Android 17 Easter Egg
  const androidContent = fs.readFileSync(ANDROID_PATH, 'utf-8')
  assert.match(androidContent, /Android 17/, 'Must show Android 17')
  assert.match(androidContent, /showEasterEgg/, 'Must support easter egg trigger')

  // Warranty Card
  const warrantyContent = fs.readFileSync(WARRANTY_PATH, 'utf-8')
  assert.match(warrantyContent, /Infinix Care 官方保修/, 'Must show official warranty brand')
  assert.match(warrantyContent, /remainingDays/, 'Must calculate remaining warranty days')

  // Phone Status
  const statusContent = fs.readFileSync(STATUS_PATH, 'utf-8')
  assert.match(statusContent, /IMEI \(卡槽 1\)/, 'Must show SIM 1 IMEI')
  assert.match(statusContent, /WLAN MAC 地址/, 'Must show WLAN MAC address')
})
