#!/usr/bin/env node
// CALLBACK-02 显式安全解锁：仅当持锁进程已死（或用户显式 --force）才释放 .lock。
// 绝不靠 TTL 自动强抢：存活进程 + 非 --force 一律拒绝，避免误抢正在跑的审查。
//
// 用法：node bin/unlock.mjs [--force]
// 退出码：0 已释放/无锁；2 持锁进程存活且未加 --force（拒绝强抢）

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_HOME = '/Users/jingzhan.chen/Workbuddy/2026-08-02-23-04-06/.local-evidence/callback-02'
const CB02_HOME = process.env.CB02_HOME || DEFAULT_HOME
const LOCK_DIR = path.join(CB02_HOME, '.lock')
const INFO = path.join(LOCK_DIR, 'lockinfo.json')

function die (code, msg) { process.stderr.write(`unlock: ${msg}\n`); process.exit(code) }
function loadJSON (f, fb) { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return fb } }

const force = process.argv.includes('--force')

if (!fs.existsSync(LOCK_DIR)) {
  process.stdout.write('unlock: 无 .lock，无需释放\n')
  process.exit(0)
}

const info = loadJSON(INFO, null)
let alive = false
if (info && typeof info.pid === 'number') {
  try { process.kill(info.pid, 0); alive = true } catch { alive = false }
}
if (alive && !force) {
  die(2, `锁由 pid ${info.pid}（始于 ${info.at}${info.host ? ` @ ${info.host}` : ''}）持有且进程仍存活，拒绝强抢；确认已死请加 --force`)
}
try { fs.unlinkSync(INFO) } catch (e) { if (e.code !== 'ENOENT') die(1, `删除 lockinfo 失败: ${e.message}`) }
try { fs.rmdirSync(LOCK_DIR) } catch (e) { if (e.code !== 'ENOENT') die(1, `释放失败: ${e.message}`) }
process.stdout.write(`unlock: 已释放 .lock（原 pid=${info ? info.pid : '?'} 始于 ${info ? info.at : '?'}）${force ? '（强制）' : ''}\n`)
process.exit(0)
