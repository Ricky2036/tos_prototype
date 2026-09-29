import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const LOCK_SCREEN_PATH = path.resolve('src/components/system/LockScreen.vue')

test('LockScreen clock renders frost gradient rect within clipPath group to prevent iOS WebKit text clipping', () => {
  assert.ok(fs.existsSync(LOCK_SCREEN_PATH), 'LockScreen.vue should exist')
  const content = fs.readFileSync(LOCK_SCREEN_PATH, 'utf-8')

  // 1. Verify clipPath defines the glyph outline with variable font ytde
  assert.match(
    content,
    /<clipPath :id="glassUid \+ '-glyph'">\s*<text class="ls-clock-num"/,
    'clipPath must define glyph contour using .ls-clock-num'
  )

  // 2. Verify clipPath group contains blurred wallpaper image
  assert.match(
    content,
    /<g :clip-path="'url\(#' \+ glassUid \+ '-glyph\)'">\s*<image :href="activeWallpaper"/,
    'clipPath group must include blurred wallpaper image'
  )

  // 3. Verify frost gradient overlay is rendered as a rect inside the clipPath group
  assert.match(
    content,
    /<rect x="0" y="0" :width="CLOCK_SVG_W" :height="CLOCK_SVG_H"\s*:fill="'url\(#' \+ glassUid \+ '-frost\)'"\s*\/>/,
    'Frost gradient must be rendered on a rect inside the clipPath group to prevent WebKit font metric box clipping'
  )

  // 4. Verify no direct external <text> element with frost fill is rendered outside clip-path
  assert.doesNotMatch(
    content,
    /<\/g>\s*<text class="ls-clock-num"[^>]*:fill="'url\(#' \+ glassUid \+ '-frost\)'"/,
    'Must not render redundant external text overlay outside clipPath that causes horizontal split in iOS Safari'
  )
})
