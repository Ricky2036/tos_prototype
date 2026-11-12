#!/usr/bin/env node
/**
 * gen-task-board —— 从 .tasks/ 生成 ACTIVE_TASKS 表格
 * ====================================================
 * 为什么：`ACTIVE_TASKS.md` 在 1,031 次提交里被改了 281 次（27%），
 * 它是这个仓库最大的单点冲突面。改成「一任务一文件 + 脚本汇总」，
 * 冲突就从"所有人改同一张表"变成"各写各的文件"。
 *
 * 用法：
 *   node scripts/gen-task-board.mjs            # 打印到 stdout
 *   node scripts/gen-task-board.mjs --write    # 替换 ACTIVE_TASKS.md 里的标记区块
 *
 * 安全设计：**只有**检测到 GENERATED 标记时才写入，绝不整文件覆盖 Integrator 的表。
 *
 * 任务文件约定（都可选，缺省显示 —）：
 *   - 类型：常规任务 | 跨 lane 交接单
 *   - 状态：Active | Review | Blocked | Merged
 *   - 簇：C2
 *   - Owner：DSH
 *   - 分支：`dsh/lane`
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TASKS_DIR = path.join(ROOT, '.tasks')
const BOARD = path.join(ROOT, '.agent-assignments/ACTIVE_TASKS.md')
const BEGIN = '<!-- GENERATED:TASKS:BEGIN -->'
const END = '<!-- GENERATED:TASKS:END -->'

const FIELD = /^-\s*(类型|状态|簇|Owner|分支)\s*[：:]\s*(.+)$/

function parseTask(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const lines = raw.split('\n')
  const titleLine = lines.find((l) => l.startsWith('# '))
  const task = {
    file: path.basename(file),
    title: titleLine ? titleLine.replace(/^#\s*/, '').trim() : path.basename(file, '.md'),
    type: '—', status: 'Active', cluster: '—', owner: '—', branch: '—',
  }
  for (const l of lines.slice(0, 24)) {
    const m = l.match(FIELD)
    if (!m) continue
    const v = m[2].replace(/`/g, '').replace(/\*\*/g, '').trim()
    if (m[1] === '类型') task.type = v
    else if (m[1] === '状态') task.status = v
    else if (m[1] === '簇') task.cluster = v
    else if (m[1] === 'Owner') task.owner = v
    else if (m[1] === '分支') task.branch = v
  }
  return task
}

const ORDER = { Active: 0, Review: 1, Blocked: 2, Merged: 3 }
const tasks = fs
  .readdirSync(TASKS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => parseTask(path.join(TASKS_DIR, f)))
  .sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9) || a.file.localeCompare(b.file))

const table = [
  '| Status | 任务 | Owner | 簇 | 分支 | 单子 |',
  '| --- | --- | --- | --- | --- | --- |',
  ...tasks.map((t) => `| ${t.status} | ${t.title} | ${t.owner} | ${t.cluster} | ${t.branch} | \`.tasks/${t.file}\` |`),
].join('\n')

const block = `${BEGIN}\n<!-- 本区块由 scripts/gen-task-board.mjs 生成，不要手改 -->\n\n${table}\n\n共 ${tasks.length} 张单\n\n${END}`

if (!process.argv.includes('--write')) {
  console.log(block)
  process.exit(0)
}

const src = fs.readFileSync(BOARD, 'utf8')
if (!src.includes(BEGIN) || !src.includes(END)) {
  console.error('ACTIVE_TASKS.md 里没有 GENERATED 标记，拒绝覆盖。')
  console.error(`请先手工插入：\n${BEGIN}\n${END}`)
  process.exit(2)
}
const next = src.replace(new RegExp(`${BEGIN}[\\s\\S]*?${END}`), block)
fs.writeFileSync(BOARD, next)
console.log(`已更新 ${path.relative(ROOT, BOARD)} · ${tasks.length} 张单`)
