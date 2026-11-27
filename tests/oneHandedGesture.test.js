import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useControlStore } from '../src/stores/controlStore.js'

test('controlStore one-handed gesture mode and activateOneHanded transitions', () => {
  setActivePinia(createPinia())
  const control = useControlStore()

  assert.equal(control.oneHanded, false)
  assert.equal(control.oneHandedPosition, 'right')
  assert.equal(control.oneHandedGestureEnabled, true)
  assert.equal(control.oneHandedGestureMode, 'both')

  // Gesture toggle
  control.setOneHandedGestureEnabled(false)
  assert.equal(control.oneHandedGestureEnabled, false)
  control.setOneHandedGestureEnabled(true)
  assert.equal(control.oneHandedGestureEnabled, true)

  // Valid gesture modes
  control.setOneHandedGestureMode('bottom')
  assert.equal(control.oneHandedGestureMode, 'bottom')

  control.setOneHandedGestureMode('top')
  assert.equal(control.oneHandedGestureMode, 'top')

  control.setOneHandedGestureMode('both')
  assert.equal(control.oneHandedGestureMode, 'both')

  // Invalid mode is ignored
  control.setOneHandedGestureMode('invalid')
  assert.equal(control.oneHandedGestureMode, 'both')

  // Activate into bottom-left corner
  control.activateOneHanded('left')
  assert.equal(control.oneHanded, true)
  assert.equal(control.oneHandedPosition, 'left')
  assert.equal(control.oneHandedEditing, false)

  // Exit resets oneHanded
  control.exitOneHanded()
  assert.equal(control.oneHanded, false)

  // Activate into bottom-right corner
  control.activateOneHanded('right')
  assert.equal(control.oneHanded, true)
  assert.equal(control.oneHandedPosition, 'right')
})
