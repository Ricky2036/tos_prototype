/**
 * locate.mjs —— spec 节点 → DOM 元素（纯函数，输入是 page-snapshot.mjs 采集的快照）
 * ==============================================================================
 * 定位优先级（硬契约）：
 *   data-accept-id → data-testid（含产品在用的 data-test 别名）→ data-row
 *   → data-system-row → data-dt-row → 唯一可见文本精确匹配
 * 另外两个 role 专用兜底（spec 里 text 为空的页头返回键只能这样找）：
 *   header-back → [data-nav-back] / [aria-label="返回"]
 *
 * 「唯一可见文本」的判定：
 *   - 候选 = 可见元素中 textContent.trim() === node.text 的所有元素；
 *   - 只保留**顶层 owner**（不是另一候选后代的那些）——因为容器和它内部的
 *     span 文本相同，天然成链；
 *   - 顶层 owner 必须恰好 1 个，否则视为不唯一 → 返回 null（记 ambiguous 诊断），
 *     宁可在判决书里写 missing，也不猜一个元素来凑几何。
 *   - 行/组头取 owner（外层容器，行高/行宽才和 a11y bounds 同量级）；
 *     文本类/页头标题取最深候选（文本盒）。
 *
 * 返回 { key, rect, textRect, text, attrs, depth, via }，找不到返回 null。
 */

import { isRowLevel } from './diff.mjs'

export const ATTR_TIERS = [
  { name: 'data-accept-id', via: 'data-accept-id' },
  { name: 'data-testid', via: 'data-testid' },
  { name: 'data-test', via: 'data-test' },
  { name: 'data-row', via: 'data-row' },
  { name: 'data-system-row', via: 'data-system-row' },
  { name: 'data-dt-row', via: 'data-dt-row' },
]

/** spec id 允许带命名空间前缀（row:/header:/group:），属性匹配时两种都试 */
export function idKeys(id) {
  const keys = [id]
  const i = id.lastIndexOf(':')
  if (i > 0 && i < id.length - 1) {
    const bare = id.slice(i + 1)
    if (bare !== id) keys.push(bare)
  }
  return keys
}

function pickLargest(list) {
  return list.reduce((a, b) => {
    const area = (el) => el.rect.width * el.rect.height
    return area(b) > area(a) ? b : a
  })
}

function isAncestor(a, b) {
  // 靠 depth + rect 包含关系判断（快照里不带 DOM 树，够用且不会被跨层同名干扰）
  if (!(a.depth < b.depth)) return false
  const A = a.rect
  const B = b.rect
  const eps = 0.5
  return (
    A.x - eps <= B.x &&
    A.y - eps <= B.y &&
    A.x + A.width + eps >= B.x + B.width &&
    A.y + A.height + eps >= B.y + B.height
  )
}

function toMatch(el, via, extra = {}) {
  return {
    key: el.key,
    rect: el.rect,
    textRect: el.textRect || null,
    text: el.text,
    attrs: el.attrs || {},
    depth: el.depth,
    via,
    ...extra,
  }
}

/**
 * @param {object} node spec 节点
 * @param {object} snapshot { elements:[...] }
 * @param {Array} [diag] 诊断累积（找不到/不唯一时写一条）
 * @returns {object|null}
 */
export function locateNode(node, snapshot, diag = []) {
  const elements = snapshot.elements || []
  const keys = idKeys(node.id)

  for (const tier of ATTR_TIERS) {
    const hits = elements.filter((el) => {
      const v = el.attrs && el.attrs[tier.name]
      return v != null && v !== '' && keys.includes(v)
    })
    if (hits.length === 1) return toMatch(hits[0], tier.via)
    if (hits.length > 1) {
      // P0-5：同一 accept-id / testid 命中多个**可见**元素 = 证据歧义，直接判红。
      // 旧行为是 pickLargest 继续判，等于让实现者用隐藏副本/壳子挑一个能过的元素。
      const chosen = pickLargest(hits)
      diag.push({
        id: node.id,
        reason: 'ambiguous-attr',
        detail: `[${tier.name}] 命中 ${hits.length} 个可见元素，判 ambiguous（不再取面积最大者继续判）`,
      })
      return toMatch(chosen, `${tier.via}(ambiguous)`, {
        ambiguous: true,
        ambiguousVia: tier.name,
        hitCount: hits.length,
      })
    }
  }

  if (node.role === 'header-back') {
    const hits = elements.filter(
      (el) =>
        (el.attrs && el.attrs['data-nav-back'] != null) ||
        (el.attrs && /返回|back/i.test(el.attrs['aria-label'] || ''))
    )
    if (hits.length === 1) return toMatch(hits[0], 'role:header-back')
    if (hits.length > 1) {
      const chosen = pickLargest(hits)
      diag.push({ id: node.id, reason: 'ambiguous-back', detail: `${hits.length} 个可见候选返回键，判 ambiguous` })
      return toMatch(chosen, 'role:header-back(ambiguous)', { ambiguous: true, ambiguousVia: 'role:header-back', hitCount: hits.length })
    }
    return null
  }

  if (!node.text) return null

  // 行级元素上的文本兜底：行文本可能带右侧 value（如「按住电源按钮 访问数字助理」），
  // 所以对 row 角色允许「以 spec 文本开头」，但只在带行级语义属性的元素里找，
  // 避免把容器/卡片整块文字当成行。有 *-row 属性时优先，其次才看 data-testid。
  if (node.role === 'row') {
    const rowEls = elements.filter(isRowLevel)
    const strong = rowEls.filter((el) => el.attrs['data-row'] != null || el.attrs['data-system-row'] != null || el.attrs['data-dt-row'] != null)
    for (const pool of [strong, rowEls]) {
      const exact = pool.filter((el) => el.text === node.text)
      const use = exact.length ? exact : pool.filter((el) => el.text.startsWith(node.text))
      if (use.length === 1) return toMatch(use[0], 'row-level:text')
      if (use.length > 1) {
        const chosen = pickLargest(use)
        diag.push({ id: node.id, reason: 'ambiguous-row-text', detail: `${use.length} 个行级元素匹配「${node.text}」` })
        return toMatch(chosen, 'row-level:text(ambiguous)')
      }
    }
  }

  const cands = elements.filter((el) => el.text === node.text)
  if (!cands.length) {
    diag.push({ id: node.id, reason: 'text-not-found', detail: `精确文本「${node.text}」不存在` })
    return null
  }

  const owners = cands.filter((el) => !cands.some((other) => other !== el && isAncestor(other, el)))
  if (owners.length > 1) {
    diag.push({
      id: node.id,
      reason: 'text-ambiguous',
      detail: `精确文本「${node.text}」有 ${owners.length} 个顶层 owner（全页不唯一）`,
    })
    return null
  }
  const owner = owners[0]
  const deepest = cands.reduce((a, b) => (b.depth > a.depth ? b : a), cands[0])
  const useOwner = node.role === 'row' || node.role === 'group'
  return toMatch(useOwner ? owner : deepest, 'text')
}

/** 一次定位全部 spec 节点，返回命中表 + 已消费元素 key 集合 + 诊断 */
export function locateAll(specNodes, snapshot) {
  const matches = new Map()
  const consumedKeys = new Set()
  const diagnostics = []
  for (const node of specNodes) {
    const m = locateNode(node, snapshot, diagnostics)
    if (m) {
      matches.set(node.id, m)
      consumedKeys.add(m.key)
    }
  }
  return { matches, consumedKeys, diagnostics }
}