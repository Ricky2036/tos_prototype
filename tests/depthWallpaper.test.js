import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { useWallpaperStore, normalizeWallpaperUrl, resolveDepthSubjectUrl } from '../src/stores/wallpaperStore.js'
import { computeClockOcclusionRatio, getPresetDepthSubject, PRESET_SUBJECT_URLS } from '../src/composables/useDepthSegmentation.js'

const root = resolve(import.meta.dirname, '..')

function freshWallpaperStore() {
  setActivePinia(createPinia())
  return useWallpaperStore()
}

test('wallpaperStore manages depthEnabled and depthSubjectUrl with persistence', () => {
  const store = freshWallpaperStore()

  // 1. 默认景深开启
  assert.equal(store.depthEnabled, true)

  // 2. 默认壁纸为建筑几何方块，且自动关联景深主体
  assert.ok(store.active.includes('abstract-geometric-cubes'))
  assert.ok(store.depthSubjectUrl.includes('abstract-geometric-cubes-subject'))

  // 3. 切换景深开关
  store.setDepthEnabled(false)
  assert.equal(store.depthEnabled, false)

  store.setDepthEnabled(true)
  assert.equal(store.depthEnabled, true)

  // 4. 设置主体与遮挡率
  store.setDepthSubject('blob:http://localhost/test-subject', 0.25)
  assert.equal(store.depthSubjectUrl, 'blob:http://localhost/test-subject')
  assert.equal(store.depthOcclusionRatio, 0.25)

  // 5. 应用带有预置标识的人物壁纸时自动关联景深主体
  store.apply('/assets/person-field.png')
  assert.ok(store.depthSubjectUrl.includes('person-field-subject'))
})

test('computeClockOcclusionRatio calculates accurate clock occlusion', () => {
  const maskW = 100
  const maskH = 200

  // 1. 全透明蒙版：遮挡率应为 0
  const emptyMask = new Uint8ClampedArray(maskW * maskH * 4)
  const ratioEmpty = computeClockOcclusionRatio(emptyMask, maskW, maskH)
  assert.equal(ratioEmpty, 0)

  // 2. 全实心蒙版：遮挡率应为 1
  const fullMask = new Uint8ClampedArray(maskW * maskH * 4)
  for (let i = 0; i < fullMask.length; i += 4) {
    fullMask[i + 3] = 255
  }
  const ratioFull = computeClockOcclusionRatio(fullMask, maskW, maskH)
  assert.equal(ratioFull, 1)

  // 3. Float32Array 浮点置信度掩码测试
  const floatMask = new Float32Array(maskW * maskH)
  floatMask.fill(0.8) // 全置信度高于 0.4
  const ratioFloat = computeClockOcclusionRatio(floatMask, maskW, maskH)
  assert.equal(ratioFloat, 1)
})

test('getPresetDepthSubject identifies pre-rendered depth cutouts without import.meta.glob trap', () => {
  const depthSource = readFileSync(resolve(root, 'src/composables/useDepthSegmentation.js'), 'utf8')
  assert.doesNotMatch(depthSource, /typeof import\.meta\.glob/, 'Must not use typeof import.meta.glob which evaluates to false in Vite production builds')
  assert.match(depthSource, /new URL\('\.\.\/assets\/img\/personalization\/generated\/abstract-geometric-cubes-subject\.png',\s*import\.meta\.url\)\.href/)

  // 1. 命中人物壁纸（金色田野）
  const personFieldSubject = getPresetDepthSubject('some/path/person-field-123.png')
  assert.ok(personFieldSubject, 'Person field must have a preset subject')
  assert.equal(personFieldSubject, PRESET_SUBJECT_URLS['person-field'])

  // 2. 命中建筑几何方块
  const cubesSubject = getPresetDepthSubject('some/path/abstract-geometric-cubes.png')
  assert.ok(cubesSubject, 'Geometric cubes must have a preset subject')
  assert.equal(cubesSubject, PRESET_SUBJECT_URLS['abstract-geometric-cubes'])

  // 3. 普通壁纸返回 null
  const nullSubject = getPresetDepthSubject('some/path/nature-forest.png')
  assert.equal(nullSubject, null)

  // 4. 自愈旧版缓存路径
  const healedSubject = resolveDepthSubjectUrl(
    '/assets/abstract-geometric-cubes-C6g-auWu.png',
    '/src/assets/img/personalization/generated/abstract-geometric-cubes-subject.png'
  )
  assert.equal(healedSubject, PRESET_SUBJECT_URLS['abstract-geometric-cubes'])

  const normalizedWallpaper = normalizeWallpaperUrl('/src/assets/img/personalization/generated/abstract-geometric-cubes.png')
  assert.ok(normalizedWallpaper.includes('abstract-geometric-cubes'))
})

test('LockScreen.vue renders depth subject in correct DOM stacking order and z-index hierarchy', () => {
  const lockScreenSource = readFileSync(resolve(root, 'src/components/system/LockScreen.vue'), 'utf8')

  // 1. 必须引入 getPresetDepthSubject
  assert.match(lockScreenSource, /getPresetDepthSubject/)

  // 2. DOM 分层：.ls-clock 在前，.ls-depth-subject 在中，.ls-clip 在后
  const clockIdx = lockScreenSource.indexOf('class="ls-clock"')
  const depthIdx = lockScreenSource.indexOf('class="ls-depth-subject"')
  const clipIdx = lockScreenSource.indexOf('class="ls-clip"')

  assert.ok(clockIdx !== -1, 'LockScreen must have .ls-clock')
  assert.ok(depthIdx !== -1, 'LockScreen must have .ls-depth-subject')
  assert.ok(clipIdx !== -1, 'LockScreen must have .ls-clip')

  assert.ok(clockIdx < depthIdx, '.ls-clock must be before .ls-depth-subject so subject renders over clock')
  assert.ok(depthIdx < clipIdx, '.ls-depth-subject must be before .ls-clip so notifications render over subject')

  // 3. z-index 层级保证：.ls-clip(10) > .ls-depth-subject(2) > .ls-clock(1)
  assert.match(lockScreenSource, /\.ls-depth-subject\s*\{[^}]*z-index:\s*2/s)
  assert.match(lockScreenSource, /\.ls-clip\s*\{[^}]*z-index:\s*10/s)

  // 4. 接触投影与逆映射防位移 + 错误容错
  assert.match(lockScreenSource, /drop-shadow\(0 6px 14px rgba\(0, 0, 0, 0\.35\)\)/)
  assert.match(lockScreenSource, /depthSubjectStyle/)
  assert.match(lockScreenSource, /@error="depthImgBroken = true"/)
})

test('SettingsPersonalization.vue provides depth toggle and gallery custom selection', () => {
  const settingsSource = readFileSync(resolve(root, 'src/components/apps/settings/personalization/SettingsPersonalization.vue'), 'utf8')

  // 1. 图库选择文件与隐藏 input
  assert.match(settingsSource, /type="file"/)
  assert.match(settingsSource, /accept="image\/\*"/)
  assert.match(settingsSource, /triggerGallerySelect/)
  assert.match(settingsSource, /onCustomFileSelected/)

  // 2. 景深效果开关联动
  assert.match(settingsSource, /depth-switch/)
  assert.match(settingsSource, /hasDepthSubjectForSelected/)
  assert.match(settingsSource, /wallpaperStore\.setDepthEnabled/)

  // 3. 景深推荐专区
  assert.match(settingsSource, /depthWallpapers/)
  assert.match(settingsSource, /chooseDepthTheme/)
})
