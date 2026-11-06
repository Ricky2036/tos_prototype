import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')

// 层级转场的唯一规范（仓里既有）。各页面只 import，不要自建一套
const SHARED_CSS = 'src/styles/layer-transitions.css'
const LEVEL_PAGES = [
  'src/components/apps/settings/SettingsDisplay.vue',
  'src/components/apps/settings/SettingsSound.vue',
  'src/components/apps/settings/SettingsNotifications.vue',
  'src/components/apps/settings/SettingsInfinixAI.vue'
]

test('层级推进转场：共用样式定义了两个方向的进出四个状态', () => {
  const css = read(SHARED_CSS)
  for (const dir of ['slide', 'slide-back']) {
    for (const phase of ['enter-active', 'enter-from', 'enter-to', 'leave-active', 'leave-from', 'leave-to']) {
      assert.ok(
        css.includes(`.${dir}-${phase}`),
        `共用转场缺少 .${dir}-${phase}`
      )
    }
  }
  assert.match(css, /translateX\(36px\)/, '前进推入位移 36px')
  assert.match(css, /0\.22s cubic-bezier\(0\.2, 0\.9, 0\.3, 1\)/, '进场时长与缓动')
  assert.match(css, /translateX\(-24px\)/, '回退位移 24px')
  assert.match(css, /prefers-reduced-motion/, '要尊重减弱动态效果')
})

test('四个层级的设置页都引用共用转场，并使用统一名称', () => {
  for (const p of LEVEL_PAGES) {
    const src = read(p)
    assert.match(src, /import '.*styles\/layer-transitions\.css'/, `${p} 未引入层级转场规范`)
    assert.match(
      src,
      /<Transition :name="isBack \? 'slide-back' : 'slide'/,
      `${p} 的 Transition 名称与层级转场规范不一致`
    )
  }
})

test('所有 Transition 用到的类名，都必须能在本文件或共用样式里找到定义（防静默失效）', () => {
  const settingsDir = 'src/components/apps/settings'
  const files = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.vue')) files.push(p)
    }
  }
  walk(settingsDir)

  const sharedCss = fs.readdirSync('src/styles')
    .filter(f => f.endsWith('.css'))
    .map(f => read(`src/styles/${f}`))
    .join('\n')
  const problems = []

  for (const file of files) {
    const src = read(file)
    const styleStart = src.indexOf('<style')
    const styleText = styleStart >= 0 ? src.slice(styleStart) : ''

    // 抓 <Transition name="foo"> 与 :name="cond ? 'a' : 'b'" 里的字面量名
    const names = new Set()
    // 只从 <Transition> 标签上取名：包括 name="x" 与 :name="cond ? 'a' : 'b'"
    for (const tag of src.matchAll(/<Transition\b[^>]*>/g)) {
      const t = tag[0]
      const staticName = t.match(/\bname="([a-zA-Z0-9-]+)"/)
      if (staticName) names.add(staticName[1])
      const dyn = t.match(/:name="([^"]+)"/)
      if (dyn) {
        for (const q of dyn[1].matchAll(/'([a-zA-Z0-9-]+)'/g)) names.add(q[1])
      }
    }

    for (const name of names) {
      const hasOwn = new RegExp(`\\.${name}-(enter|leave)-(active|from|to)`).test(styleText)
      const hasShared = new RegExp(`\\.${name}-(enter|leave)-(active|from|to)`).test(sharedCss)
      // 已知缺口：个性化页（Antigravity lane）用了 fade 但没定义，属别人的文件，先登记不改
      const KNOWN = ['src/components/apps/settings/personalization/SettingsPersonalization.vue']
      if (!hasOwn && !hasShared && !KNOWN.includes(file)) problems.push(`${file} → "${name}"`)
    }
  }

  assert.deepEqual(problems, [], `以下 Transition 名称找不到任何样式定义（表现为「没有转场动画」）：\n${problems.join('\n')}`)
})
