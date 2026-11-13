import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ALLOW_PREFIX, countByFile, extractRawStyles, isAllowed, styleBlocksOf,
} from '../scripts/lib/style-rules.mjs'

test('走 token 的声明不计数', () => {
  assert.equal(extractRawStyles('.a { border-radius: var(--radius-card); }').length, 0)
  assert.equal(extractRawStyles('.a { box-shadow: 0 2px 8px var(--shadow-solid); }').length, 0)
})

test('无效果的声明不计数', () => {
  assert.equal(extractRawStyles('.a { border-radius: 0; box-shadow: none; }').length, 0)
  assert.equal(extractRawStyles('.a { border-radius: initial; }').length, 0)
})

test('硬编码的三种都计数', () => {
  const css = `.a { border-radius: 14px; box-shadow: 0 1px 2px rgba(0,0,0,.1); backdrop-filter: blur(18px); }`
  const r = extractRawStyles(css)
  assert.equal(r.length, 3)
  assert.deepEqual(r.map((x) => x.kind).sort(), ['backdrop-filter', 'border-radius', 'box-shadow'])
})

test('注释里的示例不算', () => {
  assert.equal(extractRawStyles('/* border-radius: 14px; */').length, 0)
  assert.equal(extractRawStyles('/* box-shadow: 0 1px 2px #000; */ .a{border-radius: 8px}').length, 1)
})

test('只取 .vue 的 <style> 块，脚本里的字符串不算', () => {
  const vue = `<template><div :style="{borderRadius:'8px'}" /></template>
<script>const s = 'border-radius: 99px'</script>
<style scoped>.a { border-radius: 12px; }</style>`
  assert.equal(styleBlocksOf(vue).length, 1)
  assert.equal(countByFile([{ file: 'x.vue', text: vue, isVue: true }]).total, 1)
})

test('css 文件整体当作样式块', () => {
  const css = '.a{border-radius:4px}.b{box-shadow:0 0 2px #000}'
  assert.equal(countByFile([{ file: 'x.css', text: css, isVue: false }]).total, 2)
})

test('按文件统计，零命中的文件不进表', () => {
  const r = countByFile([
    { file: 'a.vue', text: '<style>.a{border-radius:4px}</style>', isVue: true },
    { file: 'b.vue', text: '<style>.b{border-radius:var(--r)}</style>', isVue: true },
  ])
  assert.equal(r.total, 1)
  assert.deepEqual(Object.keys(r.byFile), ['a.vue'])
})

test('允许清单覆盖公共控件库与设计系统', () => {
  assert.equal(isAllowed('src/components/ui/ListCell.vue'), true)
  assert.equal(isAllowed('src/styles/tokens.css'), true)
  assert.equal(isAllowed('src/components/apps/settings/SettingsApp.vue'), false)
  assert.ok(ALLOW_PREFIX.length >= 3)
})
