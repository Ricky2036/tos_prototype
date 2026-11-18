/**
 * coords.mjs —— 设备像素 → 360×788 画布换算（唯一实现）
 * =====================================================
 * 语义与产品仓库 `scripts/lib/canvas-transform.mjs` 保持一致：
 *   1. 系数不手算、不落库：一律由 pixel-refs/sources.json 的**原始像素**现算
 *   2. X 用 kx = 360 / w，Y 用 ky = 788 / h，**分轴**，禁止用 kx 代 ky
 *   3. 宽高比不一致的来源按「拉伸填充」进画布（设计选择，不是缺陷）
 *
 * 与产品仓库实现的差异仅在代码位置和缓存键：这里把 sources.json 路径做成参数
 * （`--sources` / env `CONTRACT_SOURCES_JSON`），默认回落到工作区 cwd 的
 * pixel-refs/sources.json，最后回落到产品仓库参考机路径。系数仍然零硬编码。
 */
import fs from 'node:fs'
import path from 'node:path'

/** 画布固定尺寸，与产品仓库 src/styles/tokens.css:73-74 一致 */
export const CANVAS = Object.freeze({ w: 360, h: 788 })

/** 各向异性判定阈值：|kx/ky − 1| ≥ 0.2% 即必须分轴 */
export const ANISOTROPY_LIMIT = 0.002

/** 只读参考机像素表（产品仓库 pixel-refs/sources.json），作为最后兜底 */
export const FALLBACK_SOURCES = '/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/pixel-refs/sources.json'

/**
 * 解析 sources.json 路径。
 * 优先级：显式参数 → env CONTRACT_SOURCES_JSON → <cwd>/pixel-refs/sources.json → 产品仓库兜底。
 */
export function resolveSourcesPath(explicit = null) {
  const candidates = [
    explicit,
    process.env.CONTRACT_SOURCES_JSON,
    path.join(process.cwd(), 'pixel-refs/sources.json'),
    FALLBACK_SOURCES,
  ].filter(Boolean)
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return path.resolve(c)
    } catch { /* 继续找 */ }
  }
  throw new Error(`找不到 pixel-refs/sources.json（试过：${candidates.join(' → ')}）`)
}

const cache = new Map()

/** 读像素表。按绝对路径缓存。 */
export function loadSources(filePath = resolveSourcesPath()) {
  const abs = path.resolve(filePath)
  if (cache.has(abs)) return cache.get(abs)
  const raw = JSON.parse(fs.readFileSync(abs, 'utf8'))
  cache.set(abs, raw)
  return raw
}

/** 清空缓存（测试用）。 */
export function resetSourcesCache() {
  cache.clear()
}

export function sourceIds(filePath) {
  return Object.keys(loadSources(filePath)).filter((k) => !k.startsWith('_'))
}

/**
 * @param {string} id source 标识，如 infinix-1208
 * @param {{sourcesPath?:string}} [opts]
 * @returns {{id:string,w:number,h:number,kx:number,ky:number,anisotropic:boolean,g8:boolean,note?:string}}
 */
export function coeffFor(id, opts = {}) {
  const all = loadSources(opts.sourcesPath)
  const s = all[id]
  if (!s || typeof s.w !== 'number' || typeof s.h !== 'number') {
    throw new Error(`未知 source: ${id}；可用：${sourceIds(opts.sourcesPath).join(', ')}`)
  }
  const kx = CANVAS.w / s.w
  const ky = CANVAS.h / s.h
  return {
    id,
    w: s.w,
    h: s.h,
    kx,
    ky,
    anisotropic: Math.abs(kx / ky - 1) >= ANISOTROPY_LIMIT,
    g8: s.g8 !== false,
    note: s.note,
  }
}

/** 单点换算（分轴）。 */
export function pointToCanvas(id, x, y, opts = {}) {
  const c = coeffFor(id, opts)
  return { x: x * c.kx, y: y * c.ky }
}

/**
 * 矩形换算：x/w 用 kx，y/h 用 ky。
 * @param {string} id
 * @param {{x:number,y:number,w:number,h:number}} r 源图像素框
 */
export function toCanvas(id, r, opts = {}) {
  const c = coeffFor(id, opts)
  return {
    x: r.x * c.kx,
    y: r.y * c.ky,
    w: r.w * c.kx,
    h: r.h * c.ky,
  }
}

/** 校验值：若错误地用 kx 统一算高度，会偏离画布底边多少像素。 */
export function uniformHeightError(id, opts = {}) {
  const c = coeffFor(id, opts)
  return c.h * c.kx - CANVAS.h
}

/** 直接用像素宽高算系数（不查表；测试/离线场景用）。 */
export function coeffForPx(w, h) {
  const kx = CANVAS.w / w
  const ky = CANVAS.h / h
  return {
    w,
    h,
    kx,
    ky,
    anisotropic: Math.abs(kx / ky - 1) >= ANISOTROPY_LIMIT,
  }
}
