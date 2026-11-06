import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')

/**
 * 设置菜单卡片规范（Ricky 2026-11-06：圆角太圆、高度不对、颜色发灰）。
 * 真机实测：页面底色 #F0F1F2、卡片纯白、圆角 16、无描边无投影、单行 52。
 */
const ROOT = 'src/components/apps/settings'

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (e.name.endsWith('.vue')) acc.push(p)
  }
  return acc
}

const files = walk(ROOT)

test('所有 .settings-card 都是同一套规范：白底 / 16 圆角 / 无描边 / 无投影', () => {
  const problems = []
  for (const f of files) {
    const src = read(f)
    const m = src.match(/\.settings-card \{\n([\s\S]*?)\n\}/)
    if (!m) continue
    const body = m[1]
    if (!/background:\s*#FFFFFF/.test(body)) problems.push(`${f}: 卡片底色不是纯白`)
    if (!/border-radius:\s*16px/.test(body)) problems.push(`${f}: 圆角不是 16px`)
    if (/border:\s*1px solid rgba\(0, 0, 0, 0\.0/.test(body)) problems.push(`${f}: 还有半透明描边（显灰）`)
    if (/box-shadow/.test(body)) problems.push(`${f}: 还有投影（显灰）`)
  }
  assert.deepEqual(problems, [], `卡片规范不统一：\n${problems.join('\n')}`)
})

test('页面底色与行高：底 #F0F1F2 / 单行 52', () => {
  const shell = read('src/components/apps/settings/subpage/SubPageShell.vue')
  assert.match(shell, /background:\s*#F0F1F2/, '子页底色应为真机实测的 #F0F1F2')

  const cell = read('src/components/ui/ListCell.vue')
  assert.match(cell, /min-height:\s*52px/, '单行高度应为 52px')

  const tokens = read('src/styles/tokens.css')
  assert.match(tokens, /--radius-cell-group:\s*16px/, '卡片圆角 token 应为 16px')
})

test('声音页音量条不再溢出卡片（width:100% + margin-right 会相加超额）', () => {
  const src = read('src/components/apps/settings/SettingsSound.vue')
  // 🔴 先剥注释再断言：我自己在注释里写了「不能写 width:100%」，不剥会假红
  const track = src
    .slice(src.indexOf('.slider-track {'), src.indexOf('.slider-fill {'))
    .replace(/\/\*[\s\S]*?\*\//g, '')
  assert.doesNotMatch(track, /width:\s*100%/, '不能再写 width:100% + margin-right')
  assert.match(track, /width:\s*auto/, '应改为 auto，让 margin 生效且不超额')
  assert.match(track, /margin-right:\s*11px/, '仍需内缩半个圆点')
})
