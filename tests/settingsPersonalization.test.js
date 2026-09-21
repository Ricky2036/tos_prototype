import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const settings = readFileSync(resolve(root, 'src/components/apps/settings/SettingsApp.vue'), 'utf8')
const personalizationPath = resolve(root, 'src/components/apps/settings/personalization/SettingsPersonalization.vue')
const personalization = readFileSync(personalizationPath, 'utf8')
const appGrid = readFileSync(resolve(root, 'src/components/system/AppGrid.vue'), 'utf8')
const lockScreen = readFileSync(resolve(root, 'src/components/system/LockScreen.vue'), 'utf8')
const screenView = readFileSync(resolve(root, 'src/components/phone/ScreenView.vue'), 'utf8')

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
  assert.match(personalization, /class="filled-wallpaper-glyph"/)
  assert.match(personalization, /class="filled-phone-glyph"/)
  assert.match(personalization, /\.filled-phone-glyph \{ width:22px; height:26px/)
  assert.match(personalization, /class="filled-palette-glyph"/)
  assert.match(personalization, /class="filled-lock-glyph"/)
  assert.match(personalization, /class="filled-desktop-glyph"/)
  assert.match(personalization, /abstract-geometric-cubes/)
  assert.match(personalization, /nature-coast/)
  assert.match(personalization, /person-field/)
  assert.match(personalization, /wallpaperStore\.apply\(selectedWallpaper\.value\)/)
  assert.match(lockScreen, /:href="activeWallpaper"/)
  assert.match(lockScreen, /backgroundImage: `url\(\$\{activeWallpaper\}\)`/)
  assert.match(screenView, /backgroundImage: `url\(\$\{activeWallpaper\}\)`/)
  assert.match(personalization, /\.filled-palette-glyph \{ width:20px; height:20px; stroke:none/)
  assert.match(personalization, /\.filled-lock-glyph \{ width:19px; height:21px; stroke:none/)
  assert.match(personalization, /\.filled-desktop-glyph \{ width:20px; height:20px; stroke:none/)
  assert.match(personalization, /\.font-glyph \{ font:400 19px/)
  assert.doesNotMatch(personalization, /mini-dock/)
  assert.match(personalization, /plus-ring.*<svg/s)
  assert.match(personalization, /icon-desktop/)
})

test('bundled wallpapers are present and used', () => {
  assert.equal(existsSync(resolve(root, 'src/assets/img/wallpaper-lock.jpg')), true, 'wallpaper-lock.jpg should exist')
  for (const file of ['abstract-geometric-cubes.png', 'abstract-geometric-cubes-subject.png', 'nature-coast.jpg', 'person-field.jpg', 'person-field-subject.png']) {
    assert.equal(existsSync(resolve(root, 'src/assets/img/personalization/generated', file)), true, `${file} should exist`)
    if (!file.endsWith('-subject.png')) {
      assert.match(personalization, new RegExp(file.replace('.', '\\.')))
    }
  }
})
