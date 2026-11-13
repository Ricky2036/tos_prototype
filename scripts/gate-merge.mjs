#!/usr/bin/env node
/**
 * gate-merge —— 本地合入预检（G3 + G7，后续递增）
 * ================================================
 * 为什么需要本地这一层：
 *   本仓的集成方式是 Integrator 在本地 worktree cherry-pick 后推 main（AGENTS.md），
 *   不走 GitHub PR。所以 PR 上的 CI 挡不住合入——必须在**合入动作发生之前**就有一道
 *   本地闸口。这就是 gate:merge 存在的唯一理由。
 *
 * 分层设计（与 `verify.yml` 的 `push` 层对齐）：
 *   - push 层（< 90s）：G3 构建 + G7 棘轮
 *   - nightly / dispatch（~4min）：再叠加 G4 全量 e2e、G8 几何
 *
 * 用法：
 *   node scripts/gate-merge.mjs               # 全跑（G3+G7）
 *   node scripts/gate-merge.mjs --fast        # 跳过 build
 *   node scripts/gate-merge.mjs --with-e2e    # 追加 e2e（需先起 dev server）
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { evidencePath } from './lib/e2e-evidence.mjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// G3a 的 tap 输出落这里，G7 棘轮复用同一份，避免整套单测跑两遍
const TAP_FILE = path.join(ROOT, 'node_modules/.cache/gate-tap.txt')

const argv = process.argv.slice(2)
const fast = argv.includes('--fast')
const withE2e = argv.includes('--with-e2e')
const port = (() => {
  const i = argv.indexOf('--port')
  return i >= 0 ? argv[i + 1] : '5555'
})()

/* 本轮身份：子进程共用，保证 run-e2e 与棘轮对同一 sha / worktree 达成一致 */
const SHA = (() => {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' }).trim()
  } catch { return '' }
})()
const WORKTREE = path.basename(ROOT)
process.env.GATE_WORKTREE = WORKTREE

/* 证据路径每轮独立：sha + worktree + 时间戳，绝不与上一轮或别的 lane 撞名 */
const EVIDENCE = withE2e
  ? evidencePath({ sha: SHA, worktree: WORKTREE, dir: path.join(os.tmpdir(), 'agent-e2e') })
  : null

const red = (s) => `\x1b[31m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

const steps = [
  { id: 'G3a', name: '单测', cmd: process.execPath,
    args: ['--test', '--test-reporter=tap', ...listTests()], captureTap: true },
  ...(fast ? [] : [{ id: 'G3b', name: '生产构建', cmd: 'npm', args: ['run', 'build'] }]),
  { id: 'Gspec', name: '画布换算无硬编码', cmd: process.execPath, args: ['scripts/check-spec-literals.mjs'] },
  { id: 'Gtask', name: '任务板可生成', cmd: process.execPath, args: ['scripts/gen-task-board.mjs'] },
  { id: 'Gclaim', name: '认领边界（advisory）', cmd: process.execPath, args: ['scripts/claim-check.mjs'] },
  { id: 'G5', name: '裸样式棘轮（advisory）', cmd: process.execPath, args: ['scripts/check-style-ratchet.mjs'] },
  // G4 必须在 G7 之前：棘轮要校验的正是这一轮 e2e 的结果
  ...(withE2e
    ? [{
        id: 'G4',
        name: `e2e (port ${port})`,
        cmd: process.execPath,
        args: ['scripts/run-e2e.mjs', '--all', '--port', port, '--out', EVIDENCE],
      }]
    : []),
  {
    id: 'G7',
    name: withE2e ? '断言棘轮（含本轮 e2e 证据）' : '断言棘轮（仅单测）',
    cmd: process.execPath,
    args: withE2e
      ? ['scripts/check-assert-ratchet.mjs', '--tap', TAP_FILE, '--e2e-report', EVIDENCE, '--expect-all']
      : ['scripts/check-assert-ratchet.mjs', '--tap', TAP_FILE, '--unit-only'],
  },
]

function listTests() {
  return fs
    .readdirSync(path.join(ROOT, 'tests'))
    .filter((f) => f.endsWith('.test.js'))
    .map((f) => path.join('tests', f))
}

const LOAD = os.loadavg()[0]
const CPUS = os.cpus().length
if (LOAD > CPUS * 2) {
  console.log(`\x1b[33m注意：load ${LOAD.toFixed(1)} / ${CPUS} 核 —— 浏览器类测试在此负载下可能假红，先单独复跑再判定\x1b[0m`)
}

const t0 = Date.now()
const failed = []
for (const s of steps) {
  process.stdout.write(dim(`▶ ${s.id} ${s.name} ... `))
  const t = Date.now()
  const r = spawnSync(s.cmd, s.args, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (s.captureTap && r.stdout) {
    fs.mkdirSync(path.dirname(TAP_FILE), { recursive: true })
    fs.writeFileSync(TAP_FILE, r.stdout)
  }
  const sec = ((Date.now() - t) / 1000).toFixed(1)
  const ok = r.status === 0
  if (!ok) {
    failed.push({ ...s, out: (r.stdout || '') + (r.stderr || '') })
    console.log(red(`FAIL ${sec}s`))
  } else {
    console.log(green(`ok ${sec}s`))
  }
}

console.log(`\n合计 ${((Date.now() - t0) / 1000).toFixed(1)}s`)
if (failed.length) {
  for (const f of failed) {
    console.error(red(`\n── ${f.id} ${f.name} ──`))
    console.error(f.out.split('\n').slice(-25).join('\n'))
  }
  console.error(red(`\ngate:merge FAIL · ${failed.length}/${steps.length} 步未过`))
  process.exit(1)
}
console.log(green(`gate:merge PASS · ${steps.length} 步全过`))
