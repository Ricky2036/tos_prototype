/**
 * canvas-transform —— 画布坐标换算的唯一实现
 * ============================================
 * 铁律（docs/tOS-pipeline-1.0.md §4）：
 *   1. 系数不手算、不落库，一律由 source 的原始像素现算
 *   2. X 用 kx、Y 用 ky，**禁止用 kx 代 ky**（三星/iOS 会纵向漂移到屏底差 8px）
 *   3. 宽高比不一致的来源按「拉伸填充」进入 360×788 画布（设计选择，不是缺陷）
 *
 * 任何脚本想换算坐标，必须 import 这里；直接写 0.298 / 360/1208 一律被
 * scripts/check-spec-literals.mjs 判红。
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** 画布固定尺寸，与 tokens.css:73-74 一致 */
export const CANVAS = Object.freeze({ w: 360, h: 788 })

/** 各向异性判定阈值：|kx/ky − 1| ≥ 0.2% 即必须分轴 */
export const ANISOTROPY_LIMIT = 0.002

const SOURCES_FILE = path.join(ROOT, 'pixel-refs/sources.json')

let cache = null

/** 读像素表。只存原始像素，不存系数——系数永远现算，避免表内自相矛盾。 */
export function loadSources() {
  if (cache) return cache
  const raw = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf8'))
  cache = raw
  return cache
}

export function sourceIds() {
  return Object.keys(loadSources())
}

/**
 * @param {string} id source 标识
 * @returns {{id:string,w:number,h:number,kx:number,ky:number,anisotropic:boolean,g8:boolean}}
 */
export function coeffFor(id) {
  const all = loadSources()
  const s = all[id]
  if (!s) {
    throw new Error(`未知 source: ${id}；可用：${Object.keys(all).join(', ')}`)
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
  }
}

/** 单点换算 */
export function pointToCanvas(id, x, y) {
  const c = coeffFor(id)
  return { x: x * c.kx, y: y * c.ky }
}

/**
 * 矩形换算：x/w 用 kx，y/h 用 ky。
 * @param {string} id
 * @param {{x:number,y:number,w:number,h:number}} r 源图上的像素框
 */
export function toCanvas(id, r) {
  const c = coeffFor(id)
  return {
    x: r.x * c.kx,
    y: r.y * c.ky,
    w: r.w * c.kx,
    h: r.h * c.ky,
  }
}

/** 校验值：用 kx 统一算高会得到多少（用于暴露"用错轴"的后果） */
export function uniformHeightError(id) {
  const c = coeffFor(id)
  return c.h * c.kx - CANVAS.h
}
