import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useControlStore } from '../src/stores/controlStore.js'

function freshControl() {
  setActivePinia(createPinia())
  return useControlStore()
}

test('100% 后仅在允许 Plus 时进入 200%，并依次升至 300% 和 500%', () => {
  const control = freshControl()
  control.setVolume(1)

  control.volumeUp(false)
  assert.equal(control.volumePlusLevel, 0)

  control.volumeUp(true)
  assert.equal(control.volumePlusLevel, 2)
  control.volumeUp(true)
  assert.equal(control.volumePlusLevel, 3)
  control.volumeUp(true)
  assert.equal(control.volumePlusLevel, 5)
  control.volumeUp(true)
  assert.equal(control.volumePlusLevel, 5)
})

test('音量减按 500→300→200→100% 退出，拖动滑块也退出 Plus', () => {
  const control = freshControl()
  control.setVolume(1)
  control.volumeUp(true)
  control.volumeUp(true)
  control.volumeUp(true)

  control.volumeDown()
  assert.equal(control.volumePlusLevel, 3)
  control.volumeDown()
  assert.equal(control.volumePlusLevel, 2)
  control.volumeDown()
  assert.equal(control.volumePlusLevel, 0)
  assert.equal(control.volume, 1)

  control.volumeUp(true)
  control.setVolume(0.64)
  assert.equal(control.volumePlusLevel, 0)
  assert.equal(control.volume, 0.64)
})

test('全屏音量面板使用共享状态并可明确打开和关闭', () => {
  const control = freshControl()
  assert.equal(control.volumePanelOpen, false)
  control.openVolumePanel({ x: 10, y: 20, width: 40, height: 80 })
  assert.equal(control.volumePanelOpen, true)
  assert.equal(control.volumeAnchorHidden, true)
  control.setVolume(0.72)
  assert.equal(control.volume, 0.72)
  control.closeVolumePanel()
  assert.equal(control.volumePanelOpen, false)
  assert.equal(control.volumeAnchorHidden, false)
})

test('实体键长按加可连续进入 Plus，减可连续退出并降至 0%', () => {
  const control = freshControl()
  control.setVolume(0.55)
  for (let i = 0; i < 10; i += 1) control.stepVolumeTowardBoundary('up', false)
  assert.equal(control.volume, 1)
  assert.equal(control.volumePlusLevel, 0)

  for (let i = 0; i < 6; i += 1) control.stepVolumeTowardBoundary('up', true)
  assert.equal(control.volumePlusLevel, 5)
  for (let i = 0; i < 20; i += 1) control.stepVolumeTowardBoundary('down')
  assert.equal(control.volumePlusLevel, 0)
  assert.equal(control.volume, 0)
})

test('控制中心收起时实体音量键可唤起、收缩并打开两类侧边面板', () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const control = useControlStore()

  control.showSideVolume()
  assert.equal(control.sideVolumeMode, 'expanded')
  assert.equal(control.sideVolumePulse, 1)
  control.compactSideVolume()
  assert.equal(control.sideVolumeMode, 'compact')
  control.showSideVolume()
  assert.equal(control.sideVolumeMode, 'compact')
  control.triggerSideVolumeBounce('up')
  assert.equal(control.sideVolumeBounceSeq, 1)
  assert.equal(control.sideVolumeBounceDirection, 'up')
  control.triggerSideVolumeBounce('down')
  assert.equal(control.sideVolumeBounceSeq, 2)
  assert.equal(control.sideVolumeBounceDirection, 'down')
  control.closeSideVolume()
  control.showSideVolume()
  assert.equal(control.sideVolumeMode, 'expanded')
  control.showSideVolume()
  assert.equal(control.sideVolumeMode, 'compact')
  control.closeSideVolume()
  control.showSideVolume()
  control.openSideVolumePanel('panel')
  assert.equal(control.sideVolumeMode, 'panel')
  const pulseBeforePanelKey = control.sideVolumePulse
  control.showSideVolume()
  assert.equal(control.sideVolumeMode, 'panel')
  assert.equal(control.sideVolumePulse, pulseBeforePanelKey + 1)
  control.openSideVolumePanel('media')
  assert.equal(control.sideVolumeMode, 'media')
  control.touchSideVolume()
  assert.equal(control.sideVolumePulse, pulseBeforePanelKey + 2)
  control.closeSideVolume()
  assert.equal(control.sideVolumeMode, 'hidden')
})

test('系统音量面板记录当前通道，实体键可逐级调节该通道', () => {
  const control = freshControl()
  control.openSideVolumePanel('panel')
  assert.equal(control.sideVolumeChannel, 'media')

  const mainBefore = control.volume
  control.selectSideVolumeChannel('notification')
  control.stepAuxiliaryVolume('notification', 'up')
  assert.equal(control.sideVolumeChannel, 'notification')
  assert.equal(control.auxiliaryVolumes.notification, 0.6)
  assert.equal(control.volume, mainBefore)

  control.stepAuxiliaryVolume('notification', 'down')
  assert.equal(control.auxiliaryVolumes.notification, 0.5)
  control.openSideVolumePanel('media')
  assert.equal(control.sideVolumeMode, 'media')
})

test('当前应用静音引导可由实体音量加事件触发', () => {
  const control = freshControl()
  assert.equal(control.currentAppMuteGuideSeq, 0)
  control.setMediaVolume('play', 0)
  control.showCurrentAppMuteGuide()
  assert.equal(control.mediaVolumes.play, 0)
  assert.equal(control.currentAppMuteGuideSeq, 1)
})
