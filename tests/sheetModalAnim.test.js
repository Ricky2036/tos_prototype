import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')

const SHEET_MODAL = 'src/components/ui/SheetModal.vue'
const CALL_SITES = [
  'src/components/apps/settings/notifications/NotifRemindStyleSheet.vue',
  'src/components/apps/settings/display/DisplayAutoSleepSheet.vue',
  'src/components/apps/settings/notifications/NotifControlCenter.vue'
]

test('SheetModal 是唯一的底部弹层控件：绝对定位 + 统一留边', () => {
  const src = read(SHEET_MODAL)

  assert.match(src, /position:\s*absolute/, '应用内浮层必须 absolute（fixed 会把包含块算到机身外）')
  assert.doesNotMatch(src, /position:\s*fixed/, '禁止 fixed')
  assert.match(src, /padding:\s*0 16px 26px/, '左右 16 / 底部 26（真机实测）')
  assert.match(src, /border-radius:\s*26px|default: '26px'/, '卡片圆角 26px')
})

test('SheetModal 的出现动效：自下而上的位移 + 统一时长与缓动', () => {
  const src = read(SHEET_MODAL)

  assert.match(src, /<Transition name="sheet-rise" appear>/, '必须带 appear，否则 v-if 挂载时没有入场动画')
  assert.match(src, /\.sheet-rise-enter-from \.sheet-panel[\s\S]*?transform:\s*translateY\(100%\)/, '入场必须从自身高度下方移入')
  assert.match(src, /\.sheet-rise-leave-to \.sheet-panel[\s\S]*?transform:\s*translateY\(100%\)/, '退场同样向下移出')
  assert.match(src, /transition:\s*transform 0\.34s cubic-bezier\(0\.22, 1, 0\.36, 1\)/, '入场时长/缓动统一')
  assert.match(src, /prefers-reduced-motion/, '要尊重「减弱动态效果」')
})

test('三个弹层都改用 SheetModal，不再各自写遮罩与卡片', () => {
  for (const f of CALL_SITES) {
    const src = read(f)
    assert.match(src, /<SheetModal/, `${f} 未使用统一弹层控件`)
    assert.doesNotMatch(src, /class="(rs-mask|sheet-mask|cc-mask)"/, `${f} 还在自己画遮罩`)
    assert.doesNotMatch(src, /border-radius:\s*2\d+px 2\d+px 0 0/, `${f} 还有「只圆上两角」的旧样式`)
  }
})

test('父组件不再给弹层套额外的 Transition（避免双动效）', () => {
  const statusBar = read('src/components/apps/settings/notifications/NotifStatusBar.vue')
  assert.match(statusBar, /<NotifRemindStyleSheet :visible="showRemindSheet"/, '应以 visible 驱动，而不是 v-if + Transition')

  const display = read('src/components/apps/settings/SettingsDisplay.vue')
  assert.match(display, /<DisplayAutoSleepSheet :visible="showAutoSleepSheet"/, '应以 visible 驱动')
})

test('居中的隐私协议弹窗用同一套运动语言（不再复用带 translate 的 .fade）', () => {
  const src = read('src/components/apps/settings/SettingsInfinixAI.vue')
  assert.match(src, /<Transition name="consent-rise" appear>/, '隐私弹窗应使用 consent-rise')
  assert.match(src, /\.consent-rise-enter-from \.consent-card[\s\S]*?transform:\s*translateY\(26px\)/, '入场同为自下而上')
  assert.match(src, /\.consent-rise-enter-active \.consent-card[\s\S]*?0\.34s cubic-bezier\(0\.22, 1, 0\.36, 1\)/, '与弹层同一缓动')
  // 它原来复用 .fade，而 .fade 带 translate(-50%, 8px)，会让遮罩从左侧滑入
  assert.doesNotMatch(
    src,
    /<Transition name="fade">\s*\n\s*<div v-if="showTranslateConsent"/,
    '隐私弹窗不该再复用 .fade'
  )
})
