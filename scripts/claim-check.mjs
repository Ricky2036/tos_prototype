#!/usr/bin/env node
/**
 * claim-check —— G6 认领边界校验
 * ==============================
 * 拿本分支的改动文件，比对 .claims/*.json，回答一个问题：
 *   **我改的这些东西，是不是都在我该动的地方？**
 *
 * 用法：
 *   node scripts/claim-check.mjs                      # 相对 origin/main
 *   node scripts/claim-check.mjs --base HEAD~3
 *   node scripts/claim-check.mjs --allow 'src/components/ui/**'   # [handoff] 白名单
 *   node scripts/claim-check.mjs --strict             # 有越界就退出 1
 *
 * 默认是 **advisory**（只报告，退出 0）。按 docs/tOS-pipeline-1.0.md，W2 只提示，
 * W3 才转阻塞——先跑两周确认无误报，再卡人。
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { classify, normalizeClaims } from './lib/claim-rules.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const getArg = (n, d = null) => {
  const i = argv.indexOf(`--${n}`)
  return i >= 0 ? argv[i + 1] : d
}
const strict = argv.includes('--strict')
const base = getArg('base', 'origin/main')
const allow = []
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--allow') allow.push(argv[i + 1])
  else if (argv[i].startsWith('--allow=')) allow.push(argv[i].slice(8))
}

/* ---- 读认领表 ---- */
const claimsDir = path.join(ROOT, '.claims')
const claims = fs.existsSync(claimsDir)
  ? normalizeClaims(
      fs.readdirSync(claimsDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => [f, JSON.parse(fs.readFileSync(path.join(claimsDir, f), 'utf8'))]),
    )
  : []

/* ---- 取改动文件 ---- */
function diffFiles(ref) {
  const out = execFileSync('git', ['diff', '--name-only', `${ref}...HEAD`], {
    cwd: ROOT, encoding: 'utf8', stdio: 'pipe',
  })
  return out.split('\n').map((s) => s.trim()).filter(Boolean)
}

let files = []
let usedBase = base
const candidates = [base, 'origin/main', 'main', 'HEAD~1']
for (const ref of candidates) {
  try {
    files = diffFiles(ref)
    usedBase = ref
    break
  } catch { /* 试下一个 */ }
}
if (!usedBase || (files.length === 0 && usedBase === base)) {
  try { files = diffFiles(usedBase || 'HEAD~1') } catch {
    console.error(`无法取到任何基线的差异（试过 ${candidates.join(' / ')}）`)
    console.error('提示：先 git fetch origin，或显式给 --base <ref>')
    process.exit(2)
  }
}

const result = classify(files, claims, { allow })

/* ---- 输出 ---- */
console.log(`基线 ${usedBase} · 改动 ${files.length} 个文件 · 认领表 ${claims.length} 个簇`)
if (claims.length) {
  console.log(`  已登记：${claims.map((c) => `${c.cluster}(${c.owner})`).join(' · ')}`)
}
console.log('')

for (const r of result.rows) {
  const mark = r.status === 'claimed' ? '  ok ' : r.status === 'conflict' ? ' 冲突' : ' 未认领'
  console.log(`${mark}  ${r.file}${r.cluster ? `  → ${r.cluster} / ${r.owner}` : ''}`)
}

const sharedCount = result.allowed.length
if (sharedCount) console.log(`\n（另有 ${sharedCount} 个协作产物，人人可写，不参与判定）`)

console.log('')
if (result.ok) {
  console.log('G6 PASS · 改动全部落在已认领范围内')
} else {
  if (result.unclaimed.length) {
    console.log(`G6 WARN · ${result.unclaimed.length} 个文件没有归属：`)
    for (const f of result.unclaimed) console.log(`  · ${f}`)
    console.log('  处理：给对应簇补 .claims/<cluster>.json，或由簇 owner 开 [handoff] 白名单')
  }
  if (result.conflicts.length) {
    console.log(`G6 WARN · ${result.conflicts.length} 个文件同时命中多个簇：`)
    for (const f of result.conflicts) console.log(`  · ${f}`)
    console.log('  处理：簇之间必须划清边界，不允许"都算你的"')
  }
  if (strict) process.exit(1)
  console.log('\n（advisory 模式：不阻断。W3 起加 --strict 转阻塞）')
}
