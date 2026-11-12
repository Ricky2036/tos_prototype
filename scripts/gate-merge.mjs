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
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const fast = argv.includes('--fast')
const withE2e = argv.includes('--with-e2e')
const port = (() => {
  const i = argv.indexOf('--port')
  return i >= 0 ? argv[i + 1] : '5555'
})()

const red = (s) => `\x1b[31m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

const steps = [
  { id: 'G3a', name: '单测', cmd: process.execPath, args: ['--test', ...listTests()] },
  ...(fast ? [] : [{ id: 'G3b', name: '生产构建', cmd: 'npm', args: ['run', 'build'] }]),
  { id: 'Gspec', name: '画布换算无硬编码', cmd: process.execPath, args: ['scripts/check-spec-literals.mjs'] },
  { id: 'Gtask', name: '任务板可生成', cmd: process.execPath, args: ['scripts/gen-task-board.mjs'] },
  { id: 'G7', name: '断言棘轮', cmd: process.execPath, args: ['scripts/check-assert-ratchet.mjs'] },
  ...(withE2e
    ? [{
        id: 'G4',
        name: `e2e (port ${port})`,
        cmd: process.execPath,
        args: ['scripts/run-e2e.mjs', '--all', '--port', port, '--json'],
      }]
    : []),
]

function listTests() {
  return fs
    .readdirSync(path.join(ROOT, 'tests'))
    .filter((f) => f.endsWith('.test.js'))
    .map((f) => path.join('tests', f))
}

const t0 = Date.now()
const failed = []
for (const s of steps) {
  process.stdout.write(dim(`▶ ${s.id} ${s.name} ... `))
  const t = Date.now()
  const r = spawnSync(s.cmd, s.args, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' })
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
