import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')
const NAV = 'src/components/ui/GlassNavBar.vue'

/** 取某个 CSS 选择器的规则体（花括号配对），避免 slice 被新插入的规则干扰 */
function ruleBody(src, selector) {
  // ⚠️ 必须锚定行首：`.glass-nav.is-dark .gn-glass {` 里也含 `.gn-glass {`，
  // 用 indexOf 会先命中深色变体（实测踩过）
  const m = src.match(new RegExp(`^${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{`, 'm'))
  const start = m ? m.index : -1
  if (start < 0) return ''
  let i = src.indexOf('{', start) + 1
  let depth = 1
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth += 1
    else if (src[i] === '}') depth -= 1
    i += 1
  }
  return src.slice(start, i)
}


/**
 * 真机（Ricky 2026-11-06 定稿）：
 * 二级/三级页顶部是**玻璃悬浮导航**——两个半透明圆形按钮 + **左对齐**标题，
 * 导航条本身半透明白 + 背景模糊 + 底部渐隐，内容从它下面滚过时被虚化。
 */
test('玻璃导航：半透明 + 背景模糊 + 底部渐隐遮罩', () => {
  const src = read(NAV)
  const glass = ruleBody(src, '.gn-glass')
  assert.match(glass, /background:\s*rgba\(255, 255, 255, 0\.7/, '玻璃层应是半透明白')
  assert.match(glass, /backdrop-filter:\s*blur\(/, '玻璃层必须做背景模糊')
  assert.match(glass, /mask-image:\s*linear-gradient\(180deg/, '底部要渐隐，避免一条硬边切内容')
})

test('玻璃按钮：半透明 + 模糊 + 阴影（不是纯白实心）', () => {
  const src = read(NAV)
  const btn = ruleBody(src, '.gn-btn')
  assert.match(btn, /background:\s*rgba\(255, 255, 255, 0\.6/, '按钮底色应半透明白')
  assert.match(btn, /backdrop-filter:\s*blur\(/, '按钮要毛玻璃')
  assert.match(btn, /box-shadow:/, '按钮要有阴影')
  assert.match(btn, /border-radius:\s*50%/, '按钮是圆形')
})

test('标题**左对齐**紧跟返回按钮（不是居中）', () => {
  const src = read(NAV)
  const title = ruleBody(src, '.gn-title')
  assert.match(title, /justify-content:\s*flex-start/, '标题必须左对齐')
  assert.doesNotMatch(title, /justify-content:\s*center/, '标题不能居中（真机是左对齐）')
  assert.match(title, /left:\s*72px/, '标题左缘要避开返回按钮')
})

test('导航是 overlay：绝对定位 + 内容区留白（这样内容才能从玻璃下穿过）', () => {
  const nav = read(NAV)
  assert.match(nav, /position:\s*absolute/, '导航必须绝对定位（overlay）')

  const shell = read('src/components/apps/settings/subpage/SubPageShell.vue')
  assert.match(shell, /<GlassNavBar/, '子页外壳必须用统一玻璃导航')
  const body = shell.slice(shell.indexOf('.sub-body {'), shell.indexOf('.sub-body::-webkit'))
  assert.match(body, /padding:\s*calc\(var\(--nav-h\) \+ 10px\) 16px 0/, '内容区顶部要留出导航高度')
})

test('二级页也不再自绘导航（通知首页/应用详情/DND/礼拜/云备份统一）', () => {
  const pages = [
    'src/components/apps/settings/SettingsNotifications.vue',
    'src/components/apps/settings/SettingsDND.vue',
    'src/components/apps/settings/SettingsPrayer.vue',
    'src/components/apps/settings/SettingsCloudBackup.vue'
  ]
  for (const p of pages) {
    const src = read(p)
    assert.match(src, /<GlassNavBar/, `${p} 未使用玻璃导航`)
    assert.doesNotMatch(src, /<AppNavBar/, `${p} 还在用旧的 AppNavBar`)
  }
})
