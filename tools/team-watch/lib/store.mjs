import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

/**
 * 共享目录读写（原子写 + 独占锁 + JSONL 追加）
 * ==========================================
 * - 原子写：同目录临时文件 + rename（Windows/APFS 语义都安全）。
 * - 追加：持锁后 O_APPEND 单次写入一行 JSON；读侧跳过坏行并计数。
 * - 锁：`open(..., 'wx')` 原子创建，写 pid/at/host；进程已死视为残留锁，可安全回收。
 *   本工具只锁自己的共享目录，不碰任何 worktree 的 `.claims/` 或任务锁。
 */

export class LockError extends Error {
  constructor(message, owner) {
    super(message)
    this.name = 'LockError'
    this.owner = owner
  }
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (e) {
    return e.code === 'EPERM'
  }
}

export function pidInfo(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return null
  try {
    const up = process.kill(pid, 0)
    return { alive: true }
  } catch (e) {
    if (e.code === 'EPERM') return { alive: true }
    return { alive: false, code: e.code }
  }
}

function sleepSync(ms) {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    try {
      execSleep(ms)
    } catch {
      break
    }
  }
}

/** 同步小睡（不引入依赖）：Atomics.wait 在 Node 主线程可用 */
function execSleep(ms) {
  const sab = new Int32Array(new SharedArrayBuffer(4))
  Atomics.wait(sab, 0, 0, Math.max(1, ms))
}

export function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

export function atomicWriteJson(file, value) {
  ensureDir(path.dirname(file))
  const tmp = `${file}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  fs.renameSync(tmp, file)
}

export function atomicWriteText(file, text) {
  ensureDir(path.dirname(file))
  const tmp = `${file}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`
  fs.writeFileSync(tmp, text, 'utf8')
  fs.renameSync(tmp, file)
}

export function readJsonl(file) {
  if (!fs.existsSync(file)) return { items: [], badLines: 0, bytes: 0 }
  const raw = fs.readFileSync(file, 'utf8')
  const items = []
  let badLines = 0
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t) continue
    try {
      items.push(JSON.parse(t))
    } catch {
      badLines += 1
    }
  }
  return { items, badLines, bytes: Buffer.byteLength(raw) }
}

export function appendJsonlLocked(file, record, lockPath, opts = {}) {
  const release = acquireLock(lockPath, opts)
  try {
    ensureDir(path.dirname(file))
    fs.appendFileSync(file, `${JSON.stringify(record)}\n`, 'utf8')
  } finally {
    release()
  }
}

/**
 * 获取独占文件锁。返回 release()。
 * 残留锁：owner pid 已死 → 删除后重试；owner 存活 → 等超时后抛 LockError。
 */
export function acquireLock(lockPath, opts = {}) {
  ensureDir(path.dirname(lockPath))
  const timeoutMs = opts.timeoutMs ?? 5000
  const pid = opts.pid ?? process.pid
  const label = opts.label || path.basename(lockPath)
  const started = Date.now()
  let delay = 25
  for (;;) {
    try {
      const fd = fs.openSync(lockPath, 'wx')
      try {
        fs.writeSync(fd, JSON.stringify({ pid, at: new Date().toISOString(), host: process.env.HOSTNAME || 'local', label }))
      } finally {
        fs.closeSync(fd)
      }
      let released = false
      return function release() {
        if (released) return
        released = true
        try {
          const cur = readJson(lockPath)
          if (!cur || Number(cur.pid) === pid) fs.rmSync(lockPath, { force: true })
        } catch {
          /* 删不掉就留着，下次按 pid 判残留 */
        }
      }
    } catch (e) {
      if (e.code !== 'EEXIST') throw e
      const owner = readJson(lockPath)
      if (owner && !isPidAlive(Number(owner.pid))) {
        try {
          fs.rmSync(lockPath, { force: true })
        } catch {
          /* 竞争回收：下一轮再看 */
        }
        continue
      }
      if (Date.now() - started >= timeoutMs) {
        throw new LockError(`等待锁超时（${timeoutMs}ms）：${lockPath}`, owner || null)
      }
      execSleep(delay)
      delay = Math.min(delay * 2, 200)
    }
  }
}

export function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex')
}

export function sha256File(file, maxBytes = 1024 * 1024) {
  const st = fs.statSync(file)
  if (!st.isFile()) return `nonfile:${st.isDirectory() ? 'dir' : 'other'}`
  if (st.size > maxBytes) return `big:${st.size}:${Math.round(st.mtimeMs)}`
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

export { execSleep, sleepSync }
