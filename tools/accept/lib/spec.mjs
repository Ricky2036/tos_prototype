/**
 * spec.mjs —— 读取「真机契约」spec（settings-system.geometry.json 一类）
 * ====================================================================
 * 契约是只读输入：本工具不改 spec、不碰产品仓库。
 *
 * spec 形状（见 fixtures/spec/settings-system.geometry.json）：
 *   { schema_version, screen, canvas:{w,h}, nodes:[{ id, role, text, summary, bounds }] }
 * bounds 在现有 fixture 里是 {x,y,w,h}，但历史版本可能是 [x,y,w,h]（产品仓库
 * scripts/lib/geometry-compare.mjs 就按数组写），这里统一接受两种。
 */
import fs from 'node:fs'
import crypto from 'node:crypto'

export function normalizeBounds(b) {
  if (Array.isArray(b)) {
    const [x, y, w, h] = b
    return { x, y, w, h }
  }
  if (!b || typeof b !== 'object') throw new Error(`bounds 无法识别: ${JSON.stringify(b)}`)
  const { x, y, w, h } = b
  for (const [k, v] of Object.entries({ x, y, w, h })) {
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`bounds.${k} 不是有限数字: ${v}`)
  }
  return { x, y, w, h }
}

/** @returns {{spec: object, sha256: string, raw: Buffer, path: string}} */
export function loadSpec(specPath) {
  const raw = fs.readFileSync(specPath)
  const spec = JSON.parse(raw.toString('utf8'))
  if (!Array.isArray(spec.nodes)) throw new Error(`spec 缺少 nodes 数组: ${specPath}`)
  const nodes = spec.nodes.map((n) => {
    if (!n || typeof n.id !== 'string' || !n.id) throw new Error('spec 节点缺少 id')
    if (!n.role) throw new Error(`spec 节点 ${n.id} 缺少 role`)
    return { ...n, bounds: normalizeBounds(n.bounds) }
  })
  const normalized = { ...spec, nodes }
  return {
    spec: normalized,
    sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    raw,
    path: specPath,
  }
}

/** 文本类角色：几何量取「文本盒」而不是元素盒（见 diff.mjs 说明） */
export const TEXT_BOX_ROLES = new Set(['text', 'label', 'caption', 'group'])