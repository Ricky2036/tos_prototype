import fs from 'node:fs'
import path from 'node:path'
import { ensureDir } from './store.mjs'

/**
 * 有界日志：单文件超过上限就滚动为 `<name>.1`（只保留 1 份历史），
 * 防止 watch 长跑把磁盘写满。写失败不抛，巡检不能因为日志挂掉。
 */
export const LOG_MAX_BYTES = 2 * 1024 * 1024

export function createLogger(file, opts = {}) {
  const maxBytes = opts.maxBytes ?? LOG_MAX_BYTES
  ensureDir(path.dirname(file))
  let size = 0
  try { size = fs.statSync(file).size } catch { size = 0 }
  return {
    file,
    log(message) {
      const line = `[${new Date().toISOString()}] ${message}\n`
      try {
        if (size + Buffer.byteLength(line) > maxBytes) {
          try { fs.rmSync(`${file}.1`, { force: true }) } catch { /* ignore */ }
          try { fs.renameSync(file, `${file}.1`) } catch { /* ignore */ }
          size = 0
        }
        fs.appendFileSync(file, line, 'utf8')
        size += Buffer.byteLength(line)
      } catch {
        /* 日志失败不阻塞巡检 */
      }
    }
  }
}
