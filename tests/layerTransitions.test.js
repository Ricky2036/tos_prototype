import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const CSS_PATH = path.resolve('src/styles/layer-transitions.css')
const COMPOSABLE_PATH = path.resolve('src/composables/useSubPageNav.js')

const SECONDARY_PAGES = [
  { name: 'SettingsSim.vue', path: path.resolve('src/components/apps/settings/SettingsSim.vue') },
  { name: 'SettingsWifi.vue', path: path.resolve('src/components/apps/settings/SettingsWifi.vue') },
  { name: 'SettingsBluetooth.vue', path: path.resolve('src/components/apps/settings/SettingsBluetooth.vue') },
  { name: 'SettingsHotspot.vue', path: path.resolve('src/components/apps/settings/SettingsHotspot.vue') },
  { name: 'SettingsMultiDevice.vue', path: path.resolve('src/components/apps/settings/SettingsMultiDevice.vue') },
  { name: 'SettingsAboutPhone.vue', path: path.resolve('src/components/apps/settings/SettingsAboutPhone.vue') }
]

test('layer-transitions.css exists and defines complete hierarchical motion specifications', () => {
  assert.ok(fs.existsSync(CSS_PATH), 'layer-transitions.css must exist')
  const css = fs.readFileSync(CSS_PATH, 'utf-8')

  // 1. 进场与离场缓动曲线
  assert.match(css, /cubic-bezier\(0\.2,\s*0\.9,\s*0\.3,\s*1\)/, 'Must contain smooth brake curve')
  assert.match(css, /cubic-bezier\(0\.4,\s*0,\s*1,\s*1\)/, 'Must contain quick exit curve')

  // 2. 双向位移契约
  assert.match(css, /\.slide-enter-from[\s\S]*?translateX\(36px\)/, 'Forward enter must slide from +36px')
  assert.match(css, /\.slide-leave-to[\s\S]*?translateX\(-24px\)/, 'Forward leave must shift to -24px')
  assert.match(css, /\.slide-back-enter-from[\s\S]*?translateX\(-24px\)/, 'Back enter must slide from -24px')
  assert.match(css, /\.slide-back-leave-to[\s\S]*?translateX\(36px\)/, 'Back leave must slide out to +36px')

  // 3. 视图容器与无障碍偏好
  assert.match(css, /\.subpage-view-pane/, 'Must define subpage-view-pane container')
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, 'Must support prefers-reduced-motion')
})

test('useSubPageNav composable provides unified stack and direction control', () => {
  assert.ok(fs.existsSync(COMPOSABLE_PATH), 'useSubPageNav.js must exist')
  const code = fs.readFileSync(COMPOSABLE_PATH, 'utf-8')

  assert.match(code, /export function useSubPageNav/, 'Must export useSubPageNav')
  assert.match(code, /isBack/, 'Must track isBack')
  assert.match(code, /openSubView/, 'Must provide openSubView')
  assert.match(code, /closeSubView/, 'Must provide closeSubView')
})

test('All secondary settings pages implement layer transition specification', () => {
  for (const page of SECONDARY_PAGES) {
    assert.ok(fs.existsSync(page.path), `${page.name} must exist`)
    const content = fs.readFileSync(page.path, 'utf-8')

    // 1. 引入统一动效规范样式
    assert.match(
      content,
      /@import\s+['"].*?layer-transitions\.css['"]/,
      `${page.name} must import layer-transitions.css`
    )

    // 2. 必须包含带方向判断的 Transition 容器
    assert.match(
      content,
      /<Transition\s+[^>]*?:name="isBack\s*\?\s*'slide-back'\s*:\s*'slide'"[^>]*?mode="out-in"/,
      `${page.name} must use dynamic Transition with isBack and mode="out-in"`
    )

    // 3. 必须包含 key 标识以驱动 Vue 切换动画
    assert.match(
      content,
      /key="(main|aboutMain)"/,
      `${page.name} must assign key on root view pane`
    )

    // 4. 严禁使用 AI 竖线边框
    assert.doesNotMatch(
      content,
      /border-left:\s*[2-9]px solid/i,
      `${page.name} must not use left vertical border`
    )
  }
})
