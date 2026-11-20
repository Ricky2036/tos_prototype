/**
 * 模板绑定语法守卫 —— 禁止把 mustache 写进「静态属性」
 * =====================================================
 * 背景（2026-11-20 线上缺陷）：
 *   `SettingsSim.vue` 与 `infinixai/AiSubPage.vue` 写成了
 *     <GlassNavBar title="{{ sim1.name }}" />
 *   这是 Vue 2 的写法。Vue 3 里 `="{{ … }}"` 是**普通字符串**，不会插值，
 *   于是标题栏原样显示 `{{ sim1.name }}` / `{{ title }}`。
 *
 * 为什么用静态扫描而不是挂载渲染：
 *   这是「模板语法误用」这一类缺陷，判据只有一条——源码里不允许出现这种写法。
 *   挂载渲染只能覆盖被点名的组件，新加的组件会漏；静态扫描是零容忍且不依赖运行环境。
 *   这不是"用源码正则假装测行为"：它断言的是编译期就确定的非法语法，而不是运行时表现。
 *
 * 覆盖范围：src 下全部 .vue（含 workspace 分包）。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve('src')

/** 收集 .vue 文件（跳过 node_modules / dist） */
function collectVue(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) collectVue(p, out)
    else if (e.name.endsWith('.vue')) out.push(p)
  }
  return out
}

/** `attr="{{ … }}"` 与 `attr='{{ … }}'`；`:attr=` / `v-bind:attr=` 也一并抓（双重绑定同样是错的） */
const STATIC_MUSTACHE_ATTR = /\s[\w:-]*[A-Za-z][\w:-]*\s*=\s*(["'])\{\{/

test('src 下没有「静态属性里写 mustache」的模板（Vue3 不会插值）', () => {
  const files = collectVue(SRC)
  assert.ok(files.length > 50, `只扫到 ${files.length} 个 .vue，扫描根疑似不对：${SRC}`)

  const bad = []
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (STATIC_MUSTACHE_ATTR.test(lines[i])) {
        bad.push(`${path.relative(process.cwd(), file)}:${i + 1}  ${lines[i].trim()}`)
      }
    }
  }

  assert.deepEqual(
    bad,
    [],
    bad.length
      ? `发现 ${bad.length} 处把 mustache 写进静态属性（Vue3 不会插值，页面会原样显示 {{ }}）：\n` +
        bad.map((b) => `  - ${b}`).join('\n') +
        '\n修法：改成 :attr="expr"（例如 :title="sim1.name"）'
      : ''
  )
})