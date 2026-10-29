import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { useNetworkStore } from '../src/stores/networkStore.js'
import { useControlStore } from '../src/stores/controlStore.js'

test('NetworkStore manages complete network states and coordinates with controlStore', () => {
  setActivePinia(createPinia())
  const network = useNetworkStore()
  const control = useControlStore()

  // 1. Initial State Check
  assert.equal(network.simCards.length, 2)
  assert.equal(network.simCards[0].name, '中国电信')
  assert.equal(network.simCards[0].number, '+86 181 3884 8993')
  assert.equal(network.simCards[1].isEmpty, true)
  assert.equal(network.wifiEnabled, true)
  assert.equal(network.bluetoothEnabled, true)
  assert.equal(network.hotspotEnabled, false)
  assert.equal(network.nfcEnabled, true)

  // 2. Airplane Mode Coordination
  network.setHotspot(true)
  assert.equal(network.hotspotEnabled, true)
  network.setAirplaneMode(true)
  assert.equal(control.airplane, true)
  assert.equal(network.hotspotEnabled, false)
  assert.equal(control.hotspot, false)

  // 3. Wi-Fi Operations
  assert.equal(network.connectedWifi.ssid, 'Transsion_Mobile')
  network.connectWifi('HelloWifi')
  assert.equal(network.connectedWifi.ssid, 'HelloWifi')
  assert.ok(network.savedWifiList.some(item => item.ssid === 'Transsion_Mobile'))

  network.addWifiNetwork({ ssid: 'Office_5G', security: 'WPA3' })
  assert.ok(network.savedWifiList.some(item => item.ssid === 'Office_5G'))

  network.forgetWifi('HelloWifi')
  assert.equal(network.connectedWifi, null)
  assert.ok(network.availableWifiList.some(item => item.ssid === 'HelloWifi'))

  // 4. Bluetooth Operations
  assert.equal(network.deviceName, 'Infinix NOTE 60 Pro')
  network.setDeviceName('Ricky Infinix')
  assert.equal(network.deviceName, 'Ricky Infinix')

  const earcase = network.pairedDevices.find(d => d.id === 'earcase')
  assert.ok(earcase)
  assert.equal(earcase.connected, true)
  network.disconnectBluetoothDevice('earcase')
  assert.equal(network.pairedDevices.find(d => d.id === 'earcase').connected, false)

  // 5. Hotspot & NFC & DNS
  network.updateHotspotConfig({ name: 'Ricky_AP', password: 'password123', wlan6: false })
  assert.equal(network.hotspotName, 'Ricky_AP')
  assert.equal(network.hotspotPassword, 'password123')
  assert.equal(network.hotspotWlan6, false)

  network.setPrivateDns('hostname', 'dns.google')
  assert.equal(network.privateDnsMode, 'hostname')
  assert.equal(network.privateDnsHostname, 'dns.google')
})

test('All network cards and subpages follow strict design rules without AI vertical borders', () => {
  const componentPaths = [
    'src/components/apps/settings/SettingsWifi.vue',
    'src/components/apps/settings/SettingsMultiDevice.vue',
    'src/components/apps/settings/SettingsHotspot.vue',
    'src/components/apps/settings/SettingsNfc.vue',
    'src/components/apps/settings/SettingsSim.vue',
    'src/components/apps/settings/SettingsBluetooth.vue',
    'src/components/apps/settings/SettingsSatellite.vue'
  ]

  for (const relPath of componentPaths) {
    const fullPath = path.resolve(relPath)
    assert.ok(fs.existsSync(fullPath), `Component ${relPath} must exist`)
    const content = fs.readFileSync(fullPath, 'utf-8')

    // 严禁单边加粗竖线边框
    assert.doesNotMatch(content, /border-left:\s*[2-9]px\s+solid/i, `${relPath} must not contain AI vertical border`)
    assert.doesNotMatch(content, /border-left:\s*1[0-9]px\s+solid/i, `${relPath} must not contain AI vertical border`)

    // 必须暴露返回句柄
    assert.match(content, /defineExpose\(\s*\{\s*back\s*\}\s*\)/, `${relPath} must expose back handler`)
  }
})

test('SettingsApp properly integrates all network cards and routes', () => {
  const appPath = path.resolve('src/components/apps/settings/SettingsApp.vue')
  const content = fs.readFileSync(appPath, 'utf-8')

  // 验证组件引入
  assert.match(content, /import SettingsWifi from '\.\/SettingsWifi\.vue'/)
  assert.match(content, /import SettingsMultiDevice from '\.\/SettingsMultiDevice\.vue'/)
  assert.match(content, /import SettingsHotspot from '\.\/SettingsHotspot\.vue'/)
  assert.match(content, /import SettingsNfc from '\.\/SettingsNfc\.vue'/)

  // 验证视图渲染
  assert.match(content, /v-else-if="view === 'wifi'"/)
  assert.match(content, /v-else-if="view === 'multiDevice'"/)
  assert.match(content, /v-else-if="view === 'hotspot'"/)
  assert.match(content, /v-else-if="view === 'nfc'"/)

  // 验证卡片 3 的 6 项网络配置
  assert.match(content, /title="飞行模式"/)
  assert.match(content, /title="SIM 卡与网络设置"/)
  assert.match(content, /title="WLAN"/)
  assert.match(content, /title="蓝牙"/)
  assert.match(content, /title="卫星网络"/)
  assert.match(content, /title="多设备连接"/)
})
