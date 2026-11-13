#!/usr/bin/env node
/**
 * check-style-ratchet —— G5 裸样式棘轮
 * ====================================
 * `src/components/ui/` 与 tokens 之外，硬编码的圆角/阴影/毛玻璃**只减不增**。
 *
 * 为什么是棘轮而不是禁令：存量有几百处，一次性清零不现实；
 * 但让它「不再增加」是当下就能做到的，而且是唯一能止住腐蚀的办法。
 *
 * 用法：
 *   node scripts/check-style-ratchet.mjs             # 校验（advisory，退出 0）
 *   node scripts/check-style-ratchet.mjs --strict    # 有增长就退出 1
 *   node scripts/check-style-ratchet.mjs --update    # 重写基线（必须单独成 commit）
 *   node scripts/check-style-ratchet.mjs --list      # 列出每处硬编码
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { countByFile, extractRawStyles, isAllowed, styleBlocksOf } from './lib/style-rules.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE = path.join(ROOT, 'tests/style-baseline.json')
const argv = process.argv.slice(2)
const strict = argv.includes('--strict')
const update = argv.includes('--update')
const list = argv.includes('--list')

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build'].includes(e.name)) continue
      walk(full, acc)
    } else if (/\.(vue|css)$/.test(e.name)) {
      acc.push(full)
    }
  }
  return acc
}

const files = walk(path.join(ROOT, 'src'))
  .map((f) => path.relative(ROOT, f))
  .filter((f) => !isAllowed(f))
  .map((f) => ({
    file: f,
    text: fs.readFileSync(path.join(ROOT, f), 'utf8'),
    isVue: f.endsWith('.vue'),
  }))

const { total, byFile } = countByFile(files)

if (update) {
  fs.writeFileSync(BASELINE, JSON.stringify({ total, byFile }, null, 2) + '\n')
  console.log(`基线已写入 ${path.relative(ROOT, BASELINE)} · 共 ${total} 处 · ${Object.keys(byFile).length} 个文件`)
  process.exit(0)
}

if (list) {
  for (const { file, text, isVue } of files) {
    const chunks = isVue ? styleBlocksOf(text) : [text]
    for (const c of chunks) {
      for (const r of extractRawStyles(c)) {
        console.log(`${file}: ${r.kind}: ${r.value}`)
      }
    }
  }
  process.exit(0)
}

const base = fs.existsSync(BASELINE)
  ? JSON.parse(fs.readFileSync(BASELINE, 'utf8'))
  : { total: 0, byFile: {} }

console.log(`裸样式（ui/ 与 tokens 之外）`)
console.log(`  当前 ${total} 处 · ${Object.keys(byFile).length} 个文件`)
console.log(`  基线 ${base.total} 处`)

const grew = Object.entries(byFile)
  .filter(([f, n]) => n > (base.byFile[f] || 0))
  .map(([f, n]) => ({ file: f, was: base.byFile[f] || 0, now: n }))

const shrunk = Object.entries(base.byFile)
  .filter(([f, n]) => n > (byFile[f] || 0))
  .map(([f, n]) => ({ file: f, was: n, now: byFile[f] || 0 }))

if (shrunk.length) {
  console.log(`\n减少（${shrunk.length} 个文件）：`)
  for (const s of shrunk.slice(0, 10)) console.log(`  ↓ ${s.file}  ${s.was} → ${s.now}`)
}

if (total > base.total || grew.length) {
  console.log(`\n\x1b[33mG5 WARN · 有新增硬编码\x1b[0m`)
  for (const g of grew) console.log(`  ↑ ${g.file}  ${g.was} → ${g.now}`)
  console.log('\n改用 token：border-radius: var(--radius-card) / box-shadow: var(--shadow-card)')
  if (strict) process.exit(1)
  console.log('（advisory：不阻断。W3 起加 --strict 转阻塞；确认无假阳性后再收紧）')
} else {
  console.log('\n\x1b[32mG5 PASS · 没有新增硬编码\x1b[0m')
  if (total < base.total) {
    console.log('  存量已下降，记得 --update 把基线压下来（否则余量会被下次新增吃掉）')
  }
}
