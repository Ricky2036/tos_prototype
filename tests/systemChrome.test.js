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
