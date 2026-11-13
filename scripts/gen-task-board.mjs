#!/usr/bin/env node
/**
 * gen-task-board —— 从 .tasks/queue/ 生成任务板区块
 * ==================================================
 * 为什么：`ACTIVE_TASKS.md` 在 1,031 次提交里被改了 281 次（27%），
 * 它是这个仓库最大的单点冲突面。改成「一任务一文件 + 脚本汇总」，
 * 冲突就从"所有人改同一张表"变成"各写各的文件"。
 *
 * 用法：
 *   node scripts/gen-task-board.mjs                    # 打印到 stdout（Gtask 用）
 *   node scripts/gen-task-board.mjs --write           # 只替换 ACTIVE_TASKS.md 的 GENERATED 区块
 *   node scripts/gen-task-board.mjs --root <dir>      # 指定仓库根（单测注入临时目录）
 *
 * 事实源：`.tasks/queue/*.md`（英文 status/claim/owner/depends）优先；
 *         `.tasks/*.md`（中文 状态/簇/Owner）兼容并作为历史保留。
 *         ROADMAP / TEMPLATE / README 不是任务，不会出现在表里。
 *
 * 安全设计（三条，缺一不可）：
 *   1. **只有**检测到 GENERATED 标记时才写入，绝不整文件覆盖 Integrator 的手工表；
 *   2. 只替换 BEGIN..END 之间的内容，标记外的历史表逐字保留（写前写后各校验一次）；
 *   3. 校验器发现坏输入（重复 ID / doing 无 owner / 依赖缺失 / 依赖未完成却 ready /
 *      同文件互斥冲突）时明确报错，且拒绝 --write。
 *
 * 新队列字段：id / size / status / claim / owner / depends / files
 * 旧卡字段：类型 / 状态 / 簇 / Owner / 分支
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BEGIN, END, collectTasks, readCompletions, validateTasks, renderBlock,
} from './lib/task-board.mjs'

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const rootIdx = argv.indexOf('--root')
const ROOT = rootIdx >= 0 && argv[rootIdx + 1] ? path.resolve(argv[rootIdx + 1]) : DEFAULT_ROOT
const BOARD = path.join(ROOT, '.agent-assignments', 'ACTIVE_TASKS.md')
const WRITE = argv.includes('--write')

const tasks = collectTasks(ROOT)
const completions = readCompletions(ROOT)
const problems = validateTasks(tasks, { completions })
const block = renderBlock(tasks, { completions })

if (!WRITE) {
  console.log(block)
  if (problems.length) {
    for (const p of problems) console.error(`[task-board] ${p}`)
    console.error(`[task-board] ${problems.length} 项数据问题，任务板不可信。`)
    process.exit(1)
  }
  process.exit(0)
}

if (problems.length) {
  for (const p of problems) console.error(`[task-board] ${p}`)
  console.error(`[task-board] 存在 ${problems.length} 项数据问题，拒绝写入 ${path.relative(ROOT, BOARD)}。`)
  process.exit(1)
}

const src = fs.readFileSync(BOARD, 'utf8')
const beginAt = src.indexOf(BEGIN)
const endAt = src.indexOf(END)
if (beginAt < 0 || endAt < 0 || endAt < beginAt) {
  console.error('ACTIVE_TASKS.md 里没有完整的 GENERATED 标记，拒绝整文件覆盖。')
  console.error(`请先手工插入：\n${BEGIN}\n${END}`)
  process.exit(2)
}

const marker = new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
const next = src.replace(marker, block)
// 防御：标记外的手工历史必须逐字保留
const outside = (s) => s.slice(0, s.indexOf(BEGIN)) + s.slice(s.indexOf(END) + END.length)
if (outside(src) !== outside(next)) {
  console.error('拒绝写入：标记外的手工内容会发生变化。')
  process.exit(2)
}

fs.writeFileSync(BOARD, next)
console.log(`已更新 ${path.relative(ROOT, BOARD)} · ${tasks.length} 张卡（仅 GENERATED 区块）`)
