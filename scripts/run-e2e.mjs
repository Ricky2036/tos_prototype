#!/usr/bin/env node
/**
 * e2e 批跑器（run-e2e）—— **只跑该跑的、能并发、出耗时表**
 * =====================================================
 * 为什么需要它（2026-10-14 实测，本机 1080×900 @2x）：
 *   全量 8 套**串行 315 s**。逐套墙钟：recorder 69.1 · mori 59.1 · aimate 51.1 ·
 *   printer 45.6 · cc-volume 31.6 · photos 29.5 · hw-volume 16.7 · volume-glass 12.2。
 *   **4 并发跑同一批 = 81.8 s（3.85×），8 套全绿。**
 *   而绝大多数改动只影响其中 1~2 套 —— 不动这一层，每次收尾都要等 5 分钟。
 *
 * 时间到底花在哪（同日拆解实验，photos 套件 28.4 s）：
 *   · 固定 `wait()` **17.9 s（63%）** —— 但**不能机械替换**：一刀切换成「等两帧 + 80ms」
 *     会挂 4~6 条断言（这些 sleep 里有一半在等异步状态，不是等动画）。要省这笔钱只能逐条判定。
 *   · 截图 **0.3 s**（11 张 PNG @2x）—— 不是瓶颈。微基准里的「327ms/张」在真实流程中不成立。
 *   · 浏览器冷启 0.5 s · `goto(networkidle)` 0.9 s（换 `load` 只省 0.4 s）—— 都不是瓶颈。
 *   ⇒ 本脚本只做**调度**：选跑 + 并发。这是当前唯一能立刻拿到的大头。
 *
 * 用法
 * ----
 *   node scripts/run-e2e.mjs photos mori        # 只跑这两套
 *   node scripts/run-e2e.mjs --changed          # 裸写 = 工作区改动 + 相对 origin/main 的提交（推荐日常用）
 *   node scripts/run-e2e.mjs --changed HEAD     # 只看工作区，不并任何 ref
 *   node scripts/run-e2e.mjs --all --jobs 4     # 全量、4 并发
 *   node scripts/run-e2e.mjs --list             # 列出套件与覆盖范围
 *
 * 选项
 * ----
 *   --all              全部套件
 *   --jobs N           并发数（默认 1；0 = CPU 核数）
 *   --changed [REF]    只跑被改动文件影响到的套件。
 *                      裸写（不给 REF）⇒ 自动取 `origin/main` 为基准 —— 🔴 本仓会自动提交，
 *                      工作区常年是干净的，只看工作区会天天得到「0 个改动 → 0 套」这种无用结果。
 *                      想只看工作区就显式写 `--changed HEAD`。
 *   --timeout N        单套超时秒数（默认 420）
 *   --list             列出套件
 *   --json             额外输出一份机器可读结果
 *
 * ⚠️ 本脚本**不改任何既有 verify 脚本的语义**，只是调度它们。
 * ⚠️ 并发会抢 CPU。本仓历史上出现过「连跑多个浏览器后偶发 1 条假失败」
 *    （`verify-recorder-flow` 229/230，单独复跑即满）。所以默认 `--jobs 1`；
 *    用并发跑完若见零星失败，**先单独复跑该套再判定**。
 */
import { spawn } from 'node:child_process'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const ROOT = process.cwd()
const SCRIPTS = path.join(ROOT, 'scripts')

/**
 * 套件表。
 * `covers` = **路径前缀**（相对仓库根）。判定用「改动文件是否以任一前缀开头」。
 * 🔴 宁可**多跑**也不要漏跑：拿不准就在 covers 里多写一层目录。
 * 🔴 新增套件时同时补 covers，否则 `--changed` 永远挑不到它。
 */
const SUITES = [
  {
    id: 'photos',
    script: 'verify-photos-flow.mjs',
    covers: [
      'src/components/apps/photos/',
      'src/stores/photosStore.js',
      'src/locales/photos.js',
      'src/components/ui/LargeTitleHeader.vue',
      'src/composables/useLargeTitle.js',
      'src/components/apps/settings/SettingsApp.vue',
      'src/components/phone/ScreenView.vue',
      'src/config/apps.js',
      'src/config/drawerApps.js',
      'src/components/apps/registry.js',
      'src/stores/i18nStore.js'
    ]
  },
  {
    id: 'mori',
    script: 'verify-mori-flow.mjs',
    covers: ['src/components/apps/aimate/MoriFlow.vue', 'src/stores/moriFlowStore.js', 'src/components/apps/aimate/AimateApp.vue']
  },
  {
    id: 'recorder',
    script: 'verify-recorder-flow.mjs',
    covers: ['src/components/apps/aimate/RecorderFlow.vue', 'src/stores/recorderFlowStore.js', 'src/stores/recorderStore.js', 'src/components/apps/aimate/AimateApp.vue']
  },
  {
    id: 'printer',
    script: 'verify-aimate-printer.mjs',
    covers: ['src/components/apps/aimate/PrinterFlow.vue', 'src/components/apps/aimate/AimateApp.vue']
  },
  {
    id: 'aimate',
    script: 'verify-aimate-flow.mjs',
    covers: ['src/components/apps/aimate/']
  },
  {
    id: 'cc-volume',
    script: 'verify-cc-volume-plus.mjs',
    covers: ['src/components/system/ControlCenter.vue', 'src/components/cc/', 'src/stores/controlStore.js', 'src/components/ui/VolumeBar.vue']
  },
  {
    id: 'hw-volume',
    script: 'verify-hardware-volume-keys.mjs',
    covers: ['src/components/system/ControlCenter.vue', 'src/stores/controlStore.js', 'src/App.vue', 'src/composables/']
  },
  {
    id: 'volume-glass',
    script: 'probe-volume-glass.mjs',
    covers: ['src/components/system/ControlCenter.vue', 'src/stores/controlStore.js', 'src/styles/']
  }
]

/* ------------------------------ 参数 ------------------------------ */
const argv = process.argv.slice(2)
const opt = { all: false, jobs: 1, timeout: 420, list: false, json: false, changed: null }
const picked = []
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i]
  if (a === '--all') opt.all = true
  else if (a === '--list') opt.list = true
  else if (a === '--json') opt.json = true
  else if (a === '--jobs') opt.jobs = Number(argv[++i])
  else if (a.startsWith('--jobs=')) opt.jobs = Number(a.slice(7))
  else if (a === '--timeout') opt.timeout = Number(argv[++i])
  else if (a.startsWith('--timeout=')) opt.timeout = Number(a.slice(10))
  else if (a === '--changed') opt.changed = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : ''
  else if (a.startsWith('--changed=')) opt.changed = a.slice(10)
  else picked.push(a)
}
if (!Number.isFinite(opt.jobs) || opt.jobs < 0) opt.jobs = 1
if (opt.jobs === 0) opt.jobs = Math.max(1, os.cpus().length)

if (opt.list) {
  console.log('套件表（--changed 用这些前缀判定）\n')
  for (const s of SUITES) {
    console.log(`  ${s.id.padEnd(14)} ${s.script}`)
    for (const c of s.covers) console.log(`      ${c}`)
  }
  process.exit(0)
}

/* --------------------------- 改动 → 套件 --------------------------- */
const git = (args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' }).trim()
  } catch {
    return ''
  }
}
function changedFiles(ref) {
  const files = new Set()
  // 工作区（含未跟踪）
  for (const line of git(['status', '--porcelain']).split('\n')) {
    if (!line.trim()) continue
    const p = line.slice(3).trim().replace(/^"|"$/g, '')
    files.add(p.includes(' -> ') ? p.split(' -> ')[1] : p)
  }
  if (ref) for (const p of git(['diff', '--name-only', `${ref}...HEAD`]).split('\n')) if (p.trim()) files.add(p.trim())
  return [...files]
}
function suitesFor(files) {
  const hit = new Set()
  for (const f of files) for (const s of SUITES) if (s.covers.some((c) => f.startsWith(c))) hit.add(s.id)
  /* 改了某套的 e2e 脚本本身 ⇒ 至少要把那一套跑一遍（脚本自己就是被测对象的一部分） */
  for (const f of files) for (const s of SUITES) if (f === `scripts/${s.script}`) hit.add(s.id)
  // 改到共享几何/令牌/应用外壳 ⇒ 全部套件都可能受影响
  if (files.some((f) => /^src\/(styles\/tokens\.css|App\.vue|components\/phone\/(PhoneFrame|ScreenView)\.vue|components\/ui\/)/.test(f))) {
    for (const s of SUITES) hit.add(s.id)
  }
  return { hit, files }
}

/* 🔴 本仓会自动提交（2026-09-20 起实测）⇒ 工作区常年干净。裸写 `--changed` 若只看工作区，
   天天都会得到「0 个改动 → 0 套」。所以裸写自动取 `origin/main` 为基准 —— 这才是
   「本轮我改了什么」的本意。想只看工作区就显式写 `--changed HEAD`。 */
let changedBase = opt.changed
if (opt.changed === '') {
  changedBase = git(['rev-parse', '--verify', '--quiet', 'origin/main']) ? 'origin/main' : ''
  if (changedBase) console.log('裸 --changed ⇒ 基准自动取 origin/main（本仓会自动提交，工作区常年干净）')
  else console.log('裸 --changed ⇒ 未能解析 origin/main，退化为只看工作区')
}

let todo
let uncovered = []
if (opt.changed !== null) {
  const files = changedFiles(changedBase)
  const { hit } = suitesFor(files)
  todo = SUITES.filter((s) => hit.has(s.id))
  uncovered = files.filter((f) => f.startsWith('src/') && !SUITES.some((s) => s.covers.some((c) => f.startsWith(c))))
  console.log(`改动文件 ${files.length} 个 → 命中 ${todo.length} 套`)
  if (!files.length) {
    /* 🔴 本仓会自动提交（2026-09-20 起实测），所以「工作区干净」很常见 ——
       这时要拿**未进 main 的提交**来比，直接跑 `--changed origin/main`。 */
    console.log('  ⚠️ 既没有工作区改动，也没有相对基准的提交 —— 这一轮确实没改代码。')
    console.log('     若只是想换个基准，显式给 ref，例：--changed origin/main')
  } else if (!todo.length) {
    console.log('  （没有套件的覆盖范围命中改动 ⇒ 建议 --all 或补 covers）')
  }
} else if (opt.all || !picked.length) {
  todo = SUITES
  if (!opt.all && !picked.length) console.log('未指定套件 ⇒ 默认跑全部（用 --list 看套件名）')
} else {
  const byId = new Map(SUITES.map((s) => [s.id, s]))
  const byScript = new Map(SUITES.map((s) => [s.script.replace(/\.mjs$/, ''), s]))
  todo = []
  for (const p of picked) {
    const s = byId.get(p) || byScript.get(p)
    if (s) todo.push(s)
    else if (fs.existsSync(path.join(SCRIPTS, p))) {
      todo.push({ id: p.replace(/\.mjs$/, ''), script: p, covers: [] })
    } else {
      console.error(`未知套件：${p}（--list 看套件名）`)
      process.exit(2)
    }
  }
}
if (uncovered.length) {
  console.log('\n⚠️ 以下改动没有任何套件覆盖（`--changed` 可能漏跑）：')
  for (const f of uncovered.slice(0, 12)) console.log('   ' + f)
  if (uncovered.length > 12) console.log(`   …另 ${uncovered.length - 12} 个`)
}

/* ------------------------------ 跑 ------------------------------ */
const results = []

function runOne(s) {
  return new Promise((resolve) => {
    const t0 = Date.now()
    const child = spawn(process.execPath, [path.join(SCRIPTS, s.script)], {
      cwd: ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let out = ''
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { out += d })
    const timer = setTimeout(() => child.kill('SIGKILL'), opt.timeout * 1000)
    child.on('close', (code) => {
      clearTimeout(timer)
      const ms = Date.now() - t0
      const summary =
        out.split('\n').reverse().find((l) => /PASS|FAIL|失败|通过|断言/.test(l) && l.trim()) || ''
      const fails = (out.match(/❌|FAIL(?!\s*0)/g) || []).length
      results.push({ id: s.id, ms, code, ok: code === 0, summary: summary.trim().slice(0, 120), fails, out })
      resolve()
    })
  })
}

console.log(`\n开始：${todo.length} 套 · 并发 ${opt.jobs}\n`)
const tAll = Date.now()
const queue = [...todo]
await Promise.all(
  Array.from({ length: Math.min(opt.jobs, queue.length) }, async () => {
    for (;;) {
      const s = queue.shift()
      if (!s) return
      process.stdout.write(`  ▶ ${s.id}\n`)
      await runOne(s)
      const r = results.find((x) => x.id === s.id)
      process.stdout.write(`  ${r.ok ? '✅' : '❌'} ${s.id}  ${(r.ms / 1000).toFixed(1)}s  ${r.summary}\n`)
    }
  })
)
const total = Date.now() - tAll

results.sort((a, b) => b.ms - a.ms)
const bad = results.filter((r) => !r.ok)
console.log('\n耗时表（降序）')
for (const r of results) console.log(`  ${r.ok ? '✅' : '❌'} ${r.id.padEnd(14)} ${(r.ms / 1000).toFixed(1).padStart(6)}s  ${r.summary}`)
console.log(`\n合计 ${(total / 1000).toFixed(1)}s · ${results.length} 套 · 失败 ${bad.length} 套`)
if (opt.json) {
  fs.writeFileSync('/tmp/run-e2e.json', JSON.stringify({ total, jobs: opt.jobs, results: results.map(({ out, ...r }) => r) }, null, 2))
  console.log('JSON → /tmp/run-e2e.json')
}
if (bad.length) {
  console.log('\n失败套件明细（末尾 20 行）：')
  for (const r of bad) {
    console.log(`\n──── ${r.id} ────`)
    console.log(r.out.split('\n').slice(-20).join('\n'))
  }
  process.exit(1)
}
process.exit(0)
