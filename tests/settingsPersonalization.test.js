import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const settings = readFileSync(resolve(root, 'src/components/apps/settings/SettingsApp.vue'), 'utf8')
const personalizationPath = resolve(root, 'src/components/apps/settings/personalization/SettingsPersonalization.vue')
const personalization = readFileSync(personalizationPath, 'utf8')

test('Settings routes wallpaper and personalization into a real nested page', () => {
  assert.match(settings, /push\('personalization'\)/)
  assert.match(settings, /<SettingsPersonalization/)
  assert.match(settings, /personalizationRef\.value\?\.back\(\)/)
})

test('personalization page provides overview, theme market and wallpaper picker', () => {
  assert.match(personalization, /screen === 'overview'/)
  assert.match(personalization, /screen === 'themes'/)
  assert.match(personalization, /wallpapers-page/)
  assert.match(personalization, /添加新主题/)
  assert.match(personalization, /从图库选择/)
  assert.match(personalization, /设为当前/)
})

test('generated wallpaper and colorful icon assets are present and used', () => {
  for (const file of ['glass-bronze.png', 'glass-blue.png', 'glass-mint.png', 'glass-rose.png', 'color-icons.png']) {
    assert.equal(existsSync(resolve(root, 'src/assets/img/personalization', file)), true, `${file} should exist`)
    assert.match(personalization, new RegExp(file.replace('.', '\\.')))
  }
})
