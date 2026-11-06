#!/usr/bin/env node
/**
 * 扫描设置里「带箭头（chevron）但点不动」的死入口。
 *
 * 背景：这类行看起来可点、真机也能进，但原型里没有 @click，
 * 是最容易被忽略的体验缺陷（Ricky 反复指出过）。做成脚本便于每次回归后自查。
 *
 * 用法：
 *   node scripts/audit-settings-dead-entries.mjs          # 只列出
 *   node scripts/audit-settings-dead-entries.mjs --strict # 有死入口就退出码 1
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'src/components/apps/settings'
const strict = process.argv.includes('--strict')

const files = []
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.vue')) files.push(p)
  }
}
walk(ROOT)

const dead = []
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const cellRe = /<ListCell\b([\s\S]*?)(\/>|>([\s\S]*?)<\/ListCell>)/g
  for (const m of src.matchAll(cellRe)) {
    const attrs = m[1] || ''
    const body = m[3] || ''
    if (!/chevron/.test(attrs)) continue
    if (/@click/.test(attrs) || /@click/.test(body)) continue

    const title = attrs.match(/title="([^"]*)"/)
    const line = src.slice(0, m.index).split('\n').length
    dead.push({
      file: file.replace(ROOT + '/', ''),
      line,
      title: title ? title[1] : '(动态标题)'
    })
  }
}

if (dead.length === 0) {
  console.log('✅ 没有「带箭头但点不动」的死入口')
  process.exit(0)
}

console.log(`⚠️  发现 ${dead.length} 个带箭头但点不动的行：\n`)
for (const d of dead) {
  console.log(`  ${d.file}:${d.line}  →  ${d.title}`)
}
console.log('\n（这类行在真机上都是可进入的，需要补 @click 或补子页）')

process.exit(strict ? 1 : 0)
