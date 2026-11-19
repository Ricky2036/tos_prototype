import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { useControlStore, FLASHLIGHT_MAX_HALF_ANGLE } from '../src/stores/controlStore.js'

function freshControl() {
  setActivePinia(createPinia())
  return useControlStore()
}

test('长按面板打开后手电筒磁贴快照冻结，关闭时可恢复', () => {
  const control = freshControl()
  const anchor = { x: 10, y: 20, width: 62, height: 62 }
  control.setFlashlight(true)
  control.openFlashlightPanel(anchor)

  assert.equal(control.flashlightPanelOpen, true)
  assert.equal(control.flashlightTileSnapshot, true)
  assert.deepEqual(control.flashlightPanelAnchor, anchor)
  assert.equal(control.flashlightActive, true)
})

test('亮度可调至零并记住上次非零档，重新点亮恢复到记忆亮度', () => {
  const control = freshControl()
  control.setFlashlightBrightness(0.42)
  assert.equal(control.flashlight, true)
  assert.equal(control.flashlightBrightness, 0.42)
  assert.equal(control.flashlightRememberedBrightness, 0.42)

  control.setFlashlightBrightness(0)
  assert.equal(control.flashlight, false)
  assert.equal(control.flashlightBrightness, 0)
  assert.equal(control.flashlightRememberedBrightness, 0.42)

  control.setRearFlashlight(true)
  assert.equal(control.flashlightBrightness, 0.42)
  assert.equal(control.flashlight, true)
})

test('亮度端点抖动吸收在 1% 以内，光束角度随档位联动', () => {
  const control = freshControl()
  control.setFlashlightBrightness(0.009)
  assert.equal(control.flashlightBrightness, 0)
  assert.equal(control.flashlightBeamHalfAngle, FLASHLIGHT_MAX_HALF_ANGLE)

  control.setFlashlightBeam(0.5)
  assert.equal(control.flashlightBeamHalfAngle, FLASHLIGHT_MAX_HALF_ANGLE / 2)
})

test('磁贴点击与控制台手电筒动作都走同一套亮度状态机', () => {
  const control = freshControl()
  control.toggle('flashlight')
  assert.equal(control.flashlightActive, true)
  control.toggle('flashlight')
  assert.equal(control.flashlightActive, false)

  control.selectTarget('flashlight_on')
  assert.equal(control.flashlightActive, true)
  control.selectTarget('flashlight_off')
  assert.equal(control.flashlightActive, false)
})

test('重置手电筒会递增版本号并复位全部亮度与引导状态', () => {
  const control = freshControl()
  control.setFlashlightBrightness(0.3)
  control.setFlashlightBeam(0.6)
  control.flashlightGuidanceSeen = true
  const before = control.flashlightResetRevision

  control.resetFlashlight()
  assert.equal(control.flashlightResetRevision, before + 1)
  assert.equal(control.flashlightBrightness, 1)
  assert.equal(control.flashlightBeam, 1)
  assert.equal(control.flashlightGuidanceSeen, false)
  assert.equal(control.flashlightActive, false)
})

test('亮度条长按展开面板时记录面板类型，且重复打开不会改写锚点', () => {
  const control = freshControl()
  const first = { x: 1, y: 2, width: 62, height: 138 }
  const second = { x: 9, y: 8, width: 62, height: 138 }
  control.openVolumePanel(first, 'brightness')
  assert.equal(control.sliderPanelKind, 'brightness')
  assert.deepEqual(control.volumePanelAnchor, first)

  control.openVolumePanel(second, 'volume')
  assert.equal(control.sliderPanelKind, 'brightness')
  assert.deepEqual(control.volumePanelAnchor, first)

  control.closeVolumePanel()
  control.openVolumePanel(second, 'volume')
  assert.equal(control.sliderPanelKind, 'volume')
})

test('屏幕亮度可以一路调到零', () => {
  const control = freshControl()
  control.setBrightness(0)
  assert.equal(control.brightness, 0)
  control.setBrightness(1.4)
  assert.equal(control.brightness, 1)
})

test('1x1 设备磁贴数值位置在三种模式间切换', () => {
  const control = freshControl()
  assert.equal(control.deviceTileValuePosition, 'none')
  control.deviceTileValuePosition = 'below'
  assert.equal(control.deviceTileValuePosition, 'below')
  control.deviceTileValuePosition = 'center'
  assert.equal(control.deviceTileValuePosition, 'center')
})

test('手电筒硬件灯位独立控制与状态复位', () => {
  const control = freshControl()
  assert.deepEqual(control.flashlightLamps, {
    rear: true,
    highBeam: true,
    front: false,
  })
  assert.equal(control.flashlightActive, false)

  // 开启前置补光灯硬件支持与点亮状态
  control.flashlightLamps.front = true
  control.frontFlashlightOn = true
  assert.equal(control.flashlightActive, true)

  // 关闭前置，开启后置
  control.frontFlashlightOn = false
  assert.equal(control.flashlightActive, false)
  control.setRearFlashlight(true)
  assert.equal(control.flashlightActive, true)

  // 复位
  control.resetFlashlight()
  assert.equal(control.flashlightActive, false)
  assert.equal(control.frontFlashlightOn, false)
  assert.equal(control.flashlightBrightness, 1)
  assert.equal(control.flashlightBeam, 1)
  assert.equal(control.flashlightGuidanceSeen, false)
})

test('DevConsole 和 FlashlightPanel 包含更新后的手电筒引导与控制台硬件开关', () => {
  const devConsolePath = path.resolve('src/components/dev/DevConsole.vue')
  const devConsoleContent = fs.readFileSync(devConsolePath, 'utf8')
  assert.ok(devConsoleContent.includes('value="flashlight"'))
  assert.ok(devConsoleContent.includes('data-testid="flashlight-console"'))
  assert.ok(devConsoleContent.includes('data-testid="flashlight-reset"'))
  assert.ok(devConsoleContent.includes('flashlightLamps'))
  assert.ok(devConsoleContent.includes('后置闪光灯'))
  assert.ok(devConsoleContent.includes('后置远光灯'))
  assert.ok(devConsoleContent.includes('前置闪光灯'))

  const flashlightPanelPath = path.resolve('src/components/system/FlashlightPanel.vue')
  const flashlightPanelContent = fs.readFileSync(flashlightPanelPath, 'utf8')
  assert.ok(flashlightPanelContent.includes('educationTick'))
  assert.ok(flashlightPanelContent.includes('下滑调暗'))
  assert.ok(flashlightPanelContent.includes('内滑聚光'))
  assert.ok(!flashlightPanelContent.includes('flashlightArrowGuidanceSeen'))
  assert.ok(!flashlightPanelContent.includes('directionHintsVisible'))
})

