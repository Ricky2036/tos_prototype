import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const settings = readFileSync(resolve(root, 'src/components/apps/settings/SettingsApp.vue'), 'utf8')
const personalizationPath = resolve(root, 'src/components/apps/settings/personalization/SettingsPersonalization.vue')
const personalization = readFileSync(personalizationPath, 'utf8')
const appGrid = readFileSync(resolve(root, 'src/components/system/AppGrid.vue'), 'utf8')

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
  assert.match(personalization, /<LockScreen/)
  assert.match(personalization, /<AppGrid/)
  assert.match(personalization, /home\.positions\[home\.currentPage\]/)
  assert.match(personalization, /register-home-anchors="false"/)
  assert.match(appGrid, /registerHomeAnchors/)
  assert.match(appGrid, /:home-anchor="registerHomeAnchors"/)
  assert.match(personalization, /\.preview-lock-viewport :deep\(\.ls-clip\)/)
  assert.match(personalization, /\.preview-lock-viewport :deep\(\.ls-shortcuts\)/)
  assert.match(personalization, /class="color-grid-glyph"/)
  assert.match(personalization, /\.menu-icon \.color-grid-glyph \{ width:35px; height:35px/)
  assert.doesNotMatch(personalization, /mini-dock/)
  assert.match(personalization, /plus-ring.*<svg/s)
  assert.match(personalization, /icon-desktop/)
})

test('generated wallpapers are present and used', () => {
  for (const file of ['glass-bronze.png', 'glass-blue.png', 'glass-mint.png', 'glass-rose.png']) {
    assert.equal(existsSync(resolve(root, 'src/assets/img/personalization', file)), true, `${file} should exist`)
    assert.match(personalization, new RegExp(file.replace('.', '\\.')))
  }
})
