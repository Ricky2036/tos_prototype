import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'
import { useSystemStore } from '../src/stores/systemStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test('three-state power lock: lockscreen -> powerOff (灭屏)', () => {
  setActivePinia(createPinia())
  const system = useSystemStore()

  // 默认初始状态：锁屏界面且屏幕亮起
  assert.equal(system.screenOn, true)
  assert.equal(system.baseLayer, 'lock')
  assert.equal(system.powerButtonAction, 'powerOff')
  assert.equal(system.powerButtonText, '灭屏')

  // 1. 锁屏界面点击按钮灭屏
  system.togglePower()
  assert.equal(system.screenOn, false)
  assert.equal(system.powerButtonAction, 'powerOn')
  assert.equal(system.powerButtonText, '亮屏')
})

test('three-state power lock: screen-off -> powerOn (亮屏回到锁屏)', () => {
  setActivePinia(createPinia())
  const system = useSystemStore()

  // 进入灭屏状态
  system.powerOff()
  assert.equal(system.screenOn, false)
  assert.equal(system.powerButtonAction, 'powerOn')
  assert.equal(system.powerButtonText, '亮屏')

  // 2. 灭屏状态点击按钮亮屏
  system.togglePower()
  assert.equal(system.screenOn, true)
  assert.equal(system.baseLayer, 'lock')
  assert.equal(system.powerButtonAction, 'powerOff')
  assert.equal(system.powerButtonText, '灭屏')
})

test('three-state power lock: home -> lock (桌面点击锁屏)', () => {
  setActivePinia(createPinia())
  const system = useSystemStore()

  // 解锁进入桌面
  system.unlock()
  assert.equal(system.screenOn, true)
  assert.equal(system.baseLayer, 'home')
  assert.equal(system.powerButtonAction, 'lock')
  assert.equal(system.powerButtonText, '锁屏')

  // 3. 桌面点击按钮锁屏
  system.togglePower()
  assert.equal(system.screenOn, true)
  assert.equal(system.baseLayer, 'lock')
  assert.equal(system.powerButtonAction, 'powerOff')
  assert.equal(system.powerButtonText, '灭屏')
})

test('three-state power lock: app -> lock (应用中点击锁屏，重置 activeAppId)', () => {
  setActivePinia(createPinia())
  const system = useSystemStore()

  // 解锁并打开应用
  system.unlock()
  system.openApp('clock')
  assert.equal(system.screenOn, true)
  assert.equal(system.baseLayer, 'app')
  assert.equal(system.activeAppId, 'clock')
  assert.equal(system.powerButtonAction, 'lock')
  assert.equal(system.powerButtonText, '锁屏')

  // 4. 应用中点击按钮锁屏
  system.togglePower()
  assert.equal(system.screenOn, true)
  assert.equal(system.baseLayer, 'lock')
  assert.equal(system.activeAppId, null)
  assert.equal(system.powerButtonAction, 'powerOff')
  assert.equal(system.powerButtonText, '灭屏')
})

test('three-state power lock: template and component linkage', () => {
  const devConsolePath = path.resolve(__dirname, '../src/components/dev/DevConsole.vue')
  const devConsoleContent = fs.readFileSync(devConsolePath, 'utf8')

  // DevConsole 包含 togglePower 调用以及三态文案与图标绑定
  assert.match(devConsoleContent, /@click="system\.togglePower\(\)"/)
  assert.match(devConsoleContent, /system\.powerButtonText/)
  assert.match(devConsoleContent, /pc-icon-lock/)
  assert.match(devConsoleContent, /pc-icon-moon/)
  assert.match(devConsoleContent, /pc-icon-sun/)

  const phoneFramePath = path.resolve(__dirname, '../src/components/phone/PhoneFrame.vue')
  const phoneFrameContent = fs.readFileSync(phoneFramePath, 'utf8')

  // PhoneFrame 物理电源键包含点击交互与三态文案提示
  assert.match(phoneFrameContent, /@click="handlePowerClick"/)
  assert.match(phoneFrameContent, /system\.togglePower\(\)/)
  assert.match(phoneFrameContent, /pointer-events:\s*auto;/)
})
