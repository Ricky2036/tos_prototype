/**
 * 设置类偏好读写的安全包装。
 *
 * 单元测试跑在 node 下没有 `localStorage`，各 store 直接调用会抛错，
 * 所以统一走这里：读写失败就退回默认值，不打断渲染。
 */
export function readRaw(key) {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeRaw(key, value) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 隐私模式等场景下写入失败，忽略即可 */
  }
}

export function readBool(key, fallback) {
  const raw = readRaw(key)
  return raw === null ? fallback : raw === 'true'
}

export function readNumber(key, fallback) {
  const raw = readRaw(key)
  if (raw === null) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export function readString(key, fallback) {
  const raw = readRaw(key)
  return raw === null ? fallback : raw
}

export function readJson(key, fallback) {
  const raw = readRaw(key)
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : fallback
  } catch {
    return fallback
  }
}
