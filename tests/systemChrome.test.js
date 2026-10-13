import test from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'
import { useSystemStore } from '../src/stores/systemStore.js'

test('systemStore manages dynamic chromeStyleOverride correctly', () => {
  setActivePinia(createPinia())
  const system = useSystemStore()

  assert.equal(system.chromeStyleOverride, null)

  system.setChromeStyle('light')
  assert.equal(system.chromeStyleOverride, 'light')

  system.setChromeStyle('dark')
  assert.equal(system.chromeStyleOverride, 'dark')

  system.setChromeStyle('invalid-value')
  assert.equal(system.chromeStyleOverride, null)

  system.setChromeStyle('light')
  assert.equal(system.chromeStyleOverride, 'light')

  // Switching to home or locking resets the override
  system.unlock() // lock -> home
  system.openApp('settings') // home -> app
  system.setChromeStyle('light')
  assert.equal(system.chromeStyleOverride, 'light')
  system.goHome()
  assert.equal(system.chromeStyleOverride, null)

  system.setChromeStyle('light')
  system.openApp('settings')
  assert.equal(system.chromeStyleOverride, null)

  system.setChromeStyle('light')
  system.lock()
  assert.equal(system.chromeStyleOverride, null)
})

test('resumeApp cleans up switcherProgress, dwell, closing and drag states', () => {
  setActivePinia(createPinia())
  const system = useSystemStore()

  system.unlock()
  system.openApp('settings')
  system.openSwitcher()
  system.setSwitcherProgress(1)
  system.setSwitcherDrag(20, -50, 100)
  system.switcherDwell = true
  system.beginSwitcherClose()

  assert.equal(system.appSwitcherOpen, true)
  assert.equal(system.switcherProgress, 1)
  assert.equal(system.switcherDwell, true)
  assert.equal(system.switcherClosing, true)
  assert.equal(system.switcherDragX, 20)

  system.resumeApp('settings')

  assert.equal(system.activeAppId, 'settings')
  assert.equal(system.baseLayer, 'app')
  assert.equal(system.appSwitcherOpen, false)
  assert.equal(system.switcherProgress, 0)
  assert.equal(system.switcherDwell, false)
  assert.equal(system.switcherClosing, false)
  assert.equal(system.switcherDragX, 0)
  assert.equal(system.switcherDragY, 0)
  assert.equal(system.switcherDragV, 0)
})
