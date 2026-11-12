#!/usr/bin/env node
/**
 * check-assert-ratchet —— G7 断言棘轮
 * ====================================
 * 保护这个仓库唯一真实的质量资产：819 个单测用例 + 1024 条 e2e 断言。
 *
 * 两条规则：
 *   1. 用例数只增不减（按套件逐个比，不允许 A 套 +10 抵 B 套 −15）
 *   2. 任何套件 fail > 0 即红（不因基线里本来就有失败而放行）
 *
 * 用法：
 *   node scripts/check-assert-ratchet.mjs            # 校验
 *   node scripts/check-assert-ratchet.mjs --update   # 重写基线（必须单独成 commit）
 *   node scripts/check-assert-ratchet.mjs --e2e-json /tmp/run-e2e.json
 *
 * e2e 侧只比对「本次跑过的套件」——局部跑不要求全量，但跑了的必须可解析。
 * 解析不到计数（checks === null）直接红，不许跳过。
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE = path.join(ROOT, 'tests/baseline.json')

const argv = process.argv.slice(2)
const update = argv.includes('--update')
const tapFlag = argv.indexOf('--tap')
const tapPath = tapFlag >= 0 ? argv[tapFlag + 1] : null
const e2eFlag = argv.indexOf('--e2e-json')
const e2ePath = e2eFlag >= 0 ? argv[e2eFlag + 1] : '/tmp/run-e2e.json'

const red = (msg) => `\x1b[31m${msg}\x1b[0m`
const green = (msg) => `\x1b[32m${msg}\x1b[0m`
const yellow = (msg) => `\x1b[33m${msg}\x1b[0m`

/* ---------------- 单测用例数 ---------------- */
function readUnitCases() {
  // gate:merge 已经把 G3a 的 tap 落盘，直接复用——否则整套单测要跑两遍
  if (tapPath && fs.existsSync(tapPath)) {
    return parseTap(fs.readFileSync(tapPath, 'utf8'))
  }
  const files = fs
    .readdirSync(path.join(ROOT, 'tests'))
    .filter((f) => f.endsWith('.test.js'))
    .map((f) => path.join('tests', f))
  let out = ''
  try {
    // 非零退出是正常的（有失败用例），计数仍要读
    out = execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {
      cwd: ROOT, encoding: 'utf8', stdio: 'pipe',
    })
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '')
  }
  return parseTap(out)
}

function parseTap(out) {
  const m = out.match(/^#\s*pass\s+(\d+)/m)
  const f = out.match(/^#\s*fail\s+(\d+)/m)
  const s2 = out.match(/^#\s*skipped\s+(\d+)/m)
  const pass = m ? Number(m[1]) : null
  if (pass === null) return { cases: null, failed: null, skipped: 0 }
  const skipped = s2 ? Number(s2[1]) : 0
  // 计数口径 = pass + skipped：跳过是环境所致（如 CI 无浏览器），不是删用例。
  // 代价：把用例全改成 skip 也能骗过下限——review 时要看 skipped 是否异常增长。
  return { cases: pass + skipped, failed: f ? Number(f[1]) : null, skipped }
}

/* 隔离名单以 run-e2e 的 SUITES 为准（是注册表属性，不是某次运行的属性） */
function quarantinedFromRegistry() {
  const src = fs.readFileSync(path.join(ROOT, 'scripts/run-e2e.mjs'), 'utf8')
  const marks = [...src.matchAll(/id:\s*'([^']+)'/g)]
  const ids = []
  for (let i = 0; i < marks.length; i += 1) {
    const from = marks[i].index
    const to = i + 1 < marks.length ? marks[i + 1].index : src.length
    if (/quarantined:\s*true/.test(src.slice(from, to))) ids.push(marks[i][1])
  }
  return [...new Set(ids)].sort()
}

/* ---------------- e2e 计数 ---------------- */
function readE2e() {
  if (!fs.existsSync(e2ePath)) return null
  try {
    const d = JSON.parse(fs.readFileSync(e2ePath, 'utf8'))
    const map = {}
    for (const r of d.results || []) {
      map[r.id] = { ok: r.ok, checks: r.checks ?? null, quarantined: !!r.quarantined }
    }
    return map
  } catch {
    return null
  }
}

/* ---------------- 主流程 ---------------- */
const units = readUnitCases()
const e2e = readE2e()
if (units.cases === null) {
  console.error(red('FAIL 读不到单测用例数（tap 输出异常）'))
  process.exit(2)
}

if (update) {
  const base = { units: { cases: units.cases }, e2e: {}, e2eQuarantine: quarantinedFromRegistry() }
  if (e2e) {
    for (const [id, v] of Object.entries(e2e)) {
      if (base.e2eQuarantine.includes(id)) continue
      if (v.checks) base.e2e[id] = { pass: v.checks.pass, fail: v.checks.fail }
    }
  }
  fs.writeFileSync(BASELINE, JSON.stringify(base, null, 2) + '\n')
  console.log(green(`基线已写入 ${path.relative(ROOT, BASELINE)}`))
  console.log(`  单测 cases: ${base.units.cases}`)
  console.log(`  e2e 套件:   ${Object.keys(base.e2e).length}`)
  process.exit(0)
}

if (!fs.existsSync(BASELINE)) {
  console.error(red('FAIL 缺少 tests/baseline.json，先跑 --update'))
  process.exit(2)
}
const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'))
const problems = []
const notes = []

const baseCases = base.units?.cases ?? 0
if (units.cases < baseCases) {
  problems.push(`单测用例数下降：${baseCases} → ${units.cases}（少了 ${baseCases - units.cases}）`)
}
if (units.failed > 0) {
  problems.push(`单测有 ${units.failed} 条失败`)
}

if (e2e) {
  const allowed = new Set(base.e2eQuarantine || [])
  for (const [id, v] of Object.entries(e2e)) {
    if (v.quarantined && !allowed.has(id)) {
      problems.push(`${id}: 新加入隔离名单（隔离必须显式改 baseline 并说明原因）`)
    }
  }
  if (allowed.size) notes.push(`隔离 ${allowed.size} 套：${[...allowed].join(', ')}`)

  for (const [id, v] of Object.entries(e2e)) {
    if (allowed.has(id)) continue
    if (!v.checks) {
      problems.push(`${id}: 收尾行解析不到计数（checks=null）`)
      continue
    }
    if (v.checks.fail > 0) problems.push(`${id}: ${v.checks.fail} 条失败`)
    const b = base.e2e?.[id]
    if (b && v.checks.pass < b.pass) {
      problems.push(`${id}: 通过数下降 ${b.pass} → ${v.checks.pass}`)
    }
    if (!b) notes.push(`${id}: 基线里没有，本次计入但不作为下限`)
  }
  notes.push(`e2e 本次 ${Object.keys(e2e).length}/${Object.keys(base.e2e || {}).length} 套参与比对`)
} else {
  notes.push(yellow(`未找到 ${e2ePath}，本次只校验单测（e2e 需先跑 run-e2e --json）`))
}

console.log(`单测 cases: ${units.cases}（基线 ${baseCases}）${units.skipped ? ` · 其中跳过 ${units.skipped}` : ''}`)
for (const n of notes) console.log(yellow(`note ${n}`))

if (problems.length) {
  console.error(red(`\nG7 FAIL · ${problems.length} 项`))
  for (const p of problems) console.error(red(`  · ${p}`))
  process.exit(1)
}
console.log(green('\nG7 PASS · 用例数未退化，无失败'))
