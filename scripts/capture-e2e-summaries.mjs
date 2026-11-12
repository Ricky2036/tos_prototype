#!/usr/bin/env node
/**
 * capture-e2e-summaries —— 抓 14 套 e2e 的真实收尾行
 * =================================================
 * 为什么需要它：
 *   `run-e2e.mjs` 只保存 `summary`（最后一行匹配 PASS|FAIL|失败|通过|断言 的文本，
 *   且截断到 120 字符），原始输出被丢弃。而 G7 断言棘轮要解析的是**每套自己打的
 *   收尾行**，所以必须拿到原文。
 *
 * 用法：
 *   node scripts/capture-e2e-summaries.mjs [port] [--out file]
 *
 * 产出：
 *   tests/e2e-summary-baseline.txt  —— 每套 3 行（脚本名 + 最后 2 行非空输出）
 *   这是 W0「统一收尾格式」的唯一口径来源，必须入库。
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RUNNER = path.join(ROOT, 'scripts/run-e2e.mjs')

const argv = process.argv.slice(2)
const port = argv.find((a) => /^\d+$/.test(a)) || '5555'
const outFlag = argv.indexOf('--out')
const outFile = outFlag >= 0
  ? path.resolve(argv[outFlag + 1])
  : path.join(ROOT, 'tests/e2e-summary-baseline.txt')

/* 从 run-e2e.mjs 的 SUITES 里取脚本清单（顺序即执行顺序） */
const runnerSrc = fs.readFileSync(RUNNER, 'utf8')
const scripts = [...runnerSrc.matchAll(/script:\s*'([^']+)'/g)].map((m) => m[1])
if (scripts.length === 0) {
  console.error('未能在 run-e2e.mjs 中找到 script: 条目')
  process.exit(2)
}

function runOne(script) {
  return new Promise((resolve) => {
    const t0 = Date.now()
    const child = spawn(process.execPath, [path.join(ROOT, 'scripts', script), port], {
      cwd: ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let out = ''
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { out += d })
    const timer = setTimeout(() => child.kill('SIGKILL'), 420_000)
    child.on('close', (code) => {
      clearTimeout(timer)
      const lines = out.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim())
      resolve({ script, code, ms: Date.now() - t0, tail: lines.slice(-3) })
    })
  })
}

const results = []
for (const s of scripts) {
  process.stdout.write(`▶ ${s} ... `)
  const r = await runOne(s)
  results.push(r)
  process.stdout.write(`${r.code === 0 ? 'ok' : `exit ${r.code}`} ${(r.ms / 1000).toFixed(1)}s\n`)
}

const body = results.map((r) => [
  `=== ${r.script}   (exit ${r.code}, ${(r.ms / 1000).toFixed(1)}s)`,
  ...r.tail.map((l) => `    ${l}`),
].join('\n')).join('\n\n')

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, body + '\n')

/* 顺带分类：哪些套现在就能被单一正则解析 */
const PARSEABLE = /\[[\w-]+\]\s+(\d+)\s+PASS\s*\/\s*(\d+)\s*FAIL/
const ok = results.filter((r) => r.tail.some((l) => PARSEABLE.test(l)))
console.log(`\n共 ${results.length} 套 · 可解析 ${ok.length} 套 · 需统一 ${results.length - ok.length} 套`)
console.log(`基线 → ${outFile}`)
process.exit(0)
