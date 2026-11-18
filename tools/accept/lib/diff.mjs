/**
 * diff.mjs —— 几何判决 + 集合差（纯计算，不碰浏览器，便于单测）
 * ============================================================
 * 容差分档与产品仓库 `scripts/lib/geometry-compare.mjs` 是**同一套口径**：
 *   line / divider / border / icon : ±0.5
 *   text                           : 不判定（只记录文本一致性事实）
 *   其余（row / group / header-*） : ±1.5
 * 另加三条同源铁律：
 *   1. 归一化系数从容器 rect 现算（scale = shell.width / 360），不读 devicePixelRatio
 *   2. 统一四舍五入到 0.1 画布 px
 *   3. origin 用容器自身的页面坐标；不去掉的话容器一挪，全部节点整体偏移
 *
 * 本文件刻意**不 import 产品仓库的 geometry-compare.mjs**：验收层必须能在产品
 * 仓库之外独立运行（CI、单测、别的仓库复用）。口径靠这段注释 + 单测锁住。
 */
import { TEXT_BOX_ROLES } from './spec.mjs'

/**
 * 盒模型口径（审计 P1-1）：a11y bounds 与 DOM 盒不是同一种东西，逐边比会制造修不掉的假红。
 * 每个角色显式声明两件事：**用哪个盒** + **比哪些锚点**。
 *
 *   rect   'element' 元素盒（可点容器 / 按钮 / 容器）
 *          'text'    文本 Range 盒（a11y 文本节点 ↔ DOM 文本实际墨迹）
 *   edges  'full'    四边都比（行/卡片：a11y 可点容器就是行本身）
 *          'left+cy' 左边缘 + 垂直中心（左对齐元素：页头图标/标题/分组头。
 *                    宽度不可比——a11y 是触摸目标或文本盒，DOM 是视觉盒或满宽容器）
 *          'center'  中心点（居中元素/图标）
 *          'left+cy+h' 左边缘 + 垂直中心 + 高度（需要卡行高的元素）
 *
 * 为什么页头不能比中心 x：真机 a11y 的返回按钮是 44×44 触摸目标，DOM 是 34×34 视觉按钮，
 * 两者左边缘对齐但中心差 5.2px。比中心 x 会永远红——这是"量错"，不是"做错"。
 */
export const BOX_MODES = {
  'header-back': { rect: 'element', edges: 'left+cy' },
  'header-title': { rect: 'text', edges: 'top' },   // a11y 标题盒含内边距，横向与宽度都不可比；只判纵向位置
  'header': { rect: 'element', edges: 'left+cy' },
  'group': { rect: 'text', edges: 'top' },          // a11y 文本节点行盒 vs DOM 文本墨迹：只判顶边
  'icon': { rect: 'element', edges: 'center' },
}

export function boxModeFor(role) {
  return BOX_MODES[role] || { rect: 'element', edges: 'full' }
}

export const CANVAS_W = 360
export const ROUND_STEP = 0.1

const TOLERANCE = {
  line: 0.5,
  divider: 0.5,
  border: 0.5,
  icon: 0.5,
  text: null, // null = 不参与判定
}

/** 容差分档；返回 null 表示只记录不判定 */
export function toleranceFor(role) {
  return Object.hasOwn(TOLERANCE, role) ? TOLERANCE[role] : 1.5
}

/** DOM px → 画布 px 的除数（= 缩放系数） */
export function canvasScale(shellWidth) {
  if (!(shellWidth > 0)) throw new Error(`容器宽度无效: ${shellWidth}`)
  return shellWidth / CANVAS_W
}

export function round01(v) {
  return +(Math.round(v / ROUND_STEP) * ROUND_STEP).toFixed(1)
}

/**
 * DOM rect（页面 px，来自 getBoundingClientRect）→ 画布 px。
 * @param {{x:number,y:number,width:number,height:number}} rect
 * @param {number} scale
 * @param {{x:number,y:number}} origin 容器页面坐标（必须传 shell 的 x/y）
 */
export function toCanvasRect(rect, scale, origin = { x: 0, y: 0 }) {
  return {
    x: round01((rect.x - origin.x) / scale),
    y: round01((rect.y - origin.y) / scale),
    w: round01(rect.width / scale),
    h: round01(rect.height / scale),
  }
}

/**
 * 文本一致性事实（硬化后参与判定，见 diffNodes）。
 * 行节点的可见文本可能带右侧 value（如「按住电源按钮 访问数字助理」），
 * 因此用 includes 而不是 ===。
 */
export function textFact(node, match) {
  if (!node.text) return null
  const actual = match && match.text != null ? match.text : null
  return { expected: node.text, actual, ok: !!actual && actual.includes(node.text) }
}

/** P0-5：带文本语义的角色必须文本一致 */
export function isTextBearingRole(role) {
  if (!role) return false
  return role === 'row' || role === 'group' || role === 'title' || role === 'label' || role.startsWith('header-')
}

/**
 * @param {{specNodes:Array, matches:Map<string,object>, scale:number, origin:{x:number,y:number}}} input
 * @returns {Array} 每行：{id,role,expected,actual,delta,worst,tol,status,via,reason,text}
 */
export function diffNodes({ specNodes, matches, scale, origin }) {
  const rows = []
  const usedKeyByNode = new Map()

  for (const node of specNodes) {
    const expected = node.bounds
    const match = matches.get(node.id) || null
    const base = {
      id: node.id,
      role: node.role,
      expected,
      via: match ? match.via : null,
      text: textFact(node, match),
    }

    if (!match) {
      rows.push({
        ...base,
        actual: null,
        delta: null,
        worst: null,
        tol: toleranceFor(node.role),
        status: 'missing',
        reason: 'not-found-in-dom',
      })
      continue
    }

    // 盒模型口径（BOX_MODES）：先选盒，再选锚点
    const mode = boxModeFor(node.role)
    const rawRect = mode.rect === 'text' && match.textRect ? match.textRect : match.rect
    const actual = toCanvasRect(rawRect, scale, origin)
    const delta = {
      dx: round01(actual.x - expected.x),
      dy: round01(actual.y - expected.y),
      dw: round01(actual.w - expected.w),
      dh: round01(actual.h - expected.h),
    }
    const cx = (r) => round01(r.x + r.w / 2)
    const cy = (r) => round01(r.y + r.h / 2)
    const anchors = {
      full: [delta.dx, delta.dy, delta.dw, delta.dh],
      'left+cy': [delta.dx, round01(cy(actual) - cy(expected))],
      top: [delta.dy],
      'left+cy+h': [delta.dx, round01(cy(actual) - cy(expected)), delta.dh],
      center: [round01(cx(actual) - cx(expected)), round01(cy(actual) - cy(expected))],
    }[mode.edges]
    const centerDelta = {
      dx: round01(cx(actual) - cx(expected)),
      dy: round01(cy(actual) - cy(expected)),
    }
    const worst = round01(Math.max(...anchors.map(Math.abs)))
    if (!Number.isFinite(worst)) {
      rows.push({ ...base, actual, delta, centerDelta, boxMode: mode.edges, boxRect: mode.rect, worst: null, tol: toleranceFor(node.role), status: 'fail', reason: 'nan-measurement' })
      continue
    }
    const tol = toleranceFor(node.role)
    let status = tol === null ? 'skip' : worst > tol ? 'fail' : 'pass'
    let reason = tol === null ? 'text-role-not-judged' : worst > tol ? 'geometry-out-of-tolerance' : null

    // P0-5①：同一 accept-id/testid 命中多个可见元素 = 歧义证据，直接红（不再挑最大者）
    if (match.ambiguous) {
      status = 'fail'
      reason = `ambiguous-visible-hit(${match.ambiguousVia || match.via} ×${match.hitCount || '?'})`
    } else if (isTextBearingRole(node.role) && node.text && !(base.text && base.text.ok)) {
      // P0-5②：坐标对、正文错（decoy 壳）不再算 pass
      status = 'fail'
      reason = 'text-mismatch'
    }

    // 两个 spec 节点命中同一个 DOM 元素 = spec 或实现有重复，不能算过
    const firstNode = usedKeyByNode.get(match.key)
    if (firstNode && firstNode !== node.id) {
      status = 'fail'
      reason = `duplicate-match(also:${firstNode})`
    } else {
      usedKeyByNode.set(match.key, node.id)
    }

    rows.push({ ...base, actual, delta, centerDelta, boxMode: mode.edges, boxRect: mode.rect, worst, tol, status, reason })
  }
  return rows
}

/** 行级元素判定：带行级属性的、结构上像行的（.list-cell / [role=row]）、
 *  或浏览器侧判定为「满宽文本横条」的自造行候选，都算集合差候选。 */
export const ROW_LEVEL_ATTRS = ['data-row', 'data-system-row', 'data-dt-row', 'data-testid', 'data-accept-id']

export function isRowLevel(el) {
  if (el && el.rowLevel === true) return true
  if (el && el.bandCandidate === true) return true
  for (const a of ROW_LEVEL_ATTRS) {
    if (el.attrs && el.attrs[a] != null && el.attrs[a] !== '') return true
  }
  return false
}

function rectContains(outer, inner) {
  const eps = 0.5
  return (
    outer.x - eps <= inner.x &&
    outer.y - eps <= inner.y &&
    outer.x + outer.width + eps >= inner.x + inner.width &&
    outer.y + outer.height + eps >= inner.y + inner.height
  )
}

function isAncestorEl(a, b) {
  return a !== b && a.depth < b.depth && rectContains(a.rect, b.rect)
}

/**
 * G8a 集合差（硬化版）：DOM 里出现的**可见行级结构**没被任何 spec 节点消费 → extras。
 *   - 行级结构 = 带行级属性 / .list-cell / [role=row] / 满宽文本横条（浏览器侧标记）
 *   - 祖先里含有已被消费元素的（页面/分组容器）不算自造行
 *   - 候选之间只保留最外层，避免一个自造行被它的内层 span 重复计数
 * 审计 P0-5③：旧实现只认 4 个属性，不带 data-* 的自造行完全看不见。
 */
export function computeExtras({ elements, consumedKeys, scale, origin }) {
  const byKey = new Map(elements.map((el) => [el.key, el]))
  const consumed = [...consumedKeys].map((k) => byKey.get(k)).filter(Boolean)
  const pool = elements.filter((el) => isRowLevel(el) && !consumedKeys.has(el.key))
  // 被消费行内部的「满宽文本横条」（如 .lc-main 内容区）不是自造行；只保留
  //   ① 不是已消费元素的后代（行内容区）② 不是已消费元素的祖先（页面/分组容器）
  const notDescendantOfConsumed = pool.filter((el) => !consumed.some((c) => isAncestorEl(c, el)))
  const notContainerOfConsumed = notDescendantOfConsumed.filter((el) => !consumed.some((c) => isAncestorEl(el, c)))
  const top = notContainerOfConsumed.filter((el) => !notContainerOfConsumed.some((other) => isAncestorEl(other, el)))
  return top
    .map((el) => ({
      id: `extra:${el.key}`,
      key: el.key,
      text: el.text,
      attrs: el.attrs,
      classes: el.classes || '',
      rect: toCanvasRect(el.rect, scale, origin),
      selectionHint: selectionHintFor(el),
    }))
    .sort((a, b) => a.rect.y - b.rect.y)
}

function selectionHintFor(el) {
  const attrHint = ROW_LEVEL_ATTRS.filter((a) => el.attrs && el.attrs[a] != null && el.attrs[a] !== '')
    .map((a) => `[${a}="${el.attrs[a]}"]`)
    .join(' ')
  if (attrHint) return attrHint
  const classes = (el.classes || '').split(/\s+/).filter(Boolean)
  if (classes.length) return `.${classes[0]}（无行级 data-* 属性）`
  if (el.attrs && el.attrs.role === 'row') return '[role="row"]（无行级 data-* 属性）'
  return '满宽文本横条（无行级 data-* / 结构标记）'
}

export function summarizeRows(rows, extraCount = 0) {
  const totalSpec = rows.length
  const matched = rows.filter((r) => r.status !== 'missing').length
  return {
    totalSpec,
    matched,
    pass: rows.filter((r) => r.status === 'pass').length,
    fail: rows.filter((r) => r.status === 'fail').length,
    missing: rows.filter((r) => r.status === 'missing').length,
    extra: extraCount,
    skipped: rows.filter((r) => r.status === 'skip').length,
    matchRate: totalSpec ? +(matched / totalSpec).toFixed(3) : 0,
  }
}

/**
 * 退出码：
 *   0 = 无 fail/missing/extra 且 matchRate ≥ minMatch
 *   1 = 有 fail / missing / extra
 *   4 = 覆盖率不足（matchRate < minMatch；在「missing 已经算 1」的口径下，
 *       这一档只在调用方放宽 missing 判定时可达——保留语义，便于将来换口径）
 */
export function decideExit(summary, minMatch = 0.9) {
  if (summary.fail > 0 || summary.missing > 0 || summary.extra > 0) return 1
  if (summary.matchRate < minMatch) return 4
  return 0
}
/**
 * 行距判决（列表页的正确量法）
 * ============================
 * 实验证明（reports/diagnosis）：真机 a11y 的「可点行框」会**不均匀地吸收行间空隙**
 * （内容中心相对行框中心在 +5.8 / -7.5 px 之间交替），所以行框高度不是行高。
 * 真正可比的是**行距（pitch）**：相邻行内容中心的间距，以及首行内容中心位置。
 *
 * 判决口径：
 *   gap[i]   = actual[i].y - actual[i-1].y        （DOM 行 top 间距）
 *   pitchΔ   = gap - expected.pitch
 *   drift[i] = actual[i].y - (actual[0].y + i*expected.pitch)
 *   fail 条件：|pitchΔ| > tol 或 | drift[i] + (actual[0].y - expected.first_row_top) | > driftTol
 * 首行锚点单独判：actual[0].y vs expected.first_row_y。
 */
export function judgePitch(rows, metrics) {
  const tol = metrics.pitch_tolerance ?? 0.6
  const anchorTol = metrics.anchor_tolerance ?? 1.5
  const pitch = metrics.row_pitch
  const firstY = metrics.first_row_center_y ?? metrics.first_row_y
  const rowNodes = rows.filter((r) => r.role === 'row' && r.actual)
  const out = { expected: { pitch, first_row_y: firstY }, tol, anchor_tolerance: anchorTol, gaps: [], pass: true, first: null }
  if (rowNodes.length === 0) return out

  const centerY = (r) => round01(r.actual.y + r.actual.h / 2)
  // 行距只在「同卡片内」成立：跨卡片/跨分组头的间隔不是行距，按 card_groups 分段
  const groups = metrics.card_groups && metrics.card_groups.length
    ? metrics.card_groups
    : [rowNodes.map((_, i) => i)]
  const anchorDelta = round01(centerY(rowNodes[0]) - firstY)
  out.first = { id: rowNodes[0].id, actual_y: rowNodes[0].actual.y, expected_y: firstY, delta: anchorDelta }
  let cum = 0
  for (const g of groups) {
    for (let k = 1; k < g.length; k++) {
      const i = g[k]
      const gap = round01(rowNodes[i].actual.y - rowNodes[i - 1].actual.y)
      const pitchDelta = round01(gap - pitch)
      cum = round01(cum + pitchDelta)
      const drift = round01(rowNodes[i].actual.y - (rowNodes[g[0]].actual.y + k * pitch))
      const anchorDrift = round01(rowNodes[g[0]].actual.y - (rowNodes[0].actual.y + pitch * (g[0] === 0 ? 0 : rowNodes[g[0]].actual.y - rowNodes[0].actual.y)))
      const ok = Math.abs(pitchDelta) <= tol
      out.gaps.push({ i, from: rowNodes[i - 1].id, to: rowNodes[i].id, gap, pitch_delta: pitchDelta, cumulative_delta: cum, drift_in_card: drift, ok, card: g })
      if (!ok) out.pass = false
      const node = rows.find((r) => r.id === rowNodes[i].id)
      node.pitchJugded = true
      node.status = ok ? (Math.abs(anchorDelta) <= anchorTol ? 'pass' : 'fail') : 'fail'
      node.reason = !ok ? 'pitch-drift-out-of-tolerance' : (Math.abs(anchorDelta) > anchorTol ? 'pitch-anchor-out-of-tolerance' : null)
      node.worst = Math.abs(ok ? round01(drift + anchorDelta) : pitchDelta)
    }
  }
  // 卡片首行：按「相对首行中心的偏移」判（跨卡片间隔不是行距）
  for (const [iStr, off] of Object.entries(metrics.card_offsets || {})) {
    const i = Number(iStr)
    const rn = rowNodes[i]
    if (!rn) continue
    const node = rows.find((r) => r.id === rn.id)
    const d = round01(centerY(rn) - (centerY(rowNodes[0]) + off))
    node.pitchJugded = true
    node.status = Math.abs(d) <= anchorTol ? 'pass' : 'fail'
    node.reason = node.status === 'fail' ? 'card-offset-out-of-tolerance' : null
    node.worst = Math.abs(d)
    out.cards = out.cards || []
    out.cards.push({ i, offset: off, delta: d, ok: node.status === 'pass' })
    if (node.status === 'fail') out.pass = false
  }

  // 非行节点（分组头等）的绝对中心
  for (const [id, cyExpected] of Object.entries(metrics.absolute_centers || {})) {
    const node = rows.find((r) => r.id === id)
    if (!node || !node.actual) continue
    const d = round01(node.actual.y + node.actual.h / 2 - cyExpected)
    node.pitchJugded = true
    node.status = Math.abs(d) <= anchorTol ? 'pass' : 'fail'
    node.reason = node.status === 'fail' ? 'center-out-of-tolerance' : null
    node.worst = Math.abs(d)
    if (node.status === 'fail') out.pass = false
  }

  if (Math.abs(anchorDelta) > anchorTol) out.pass = false
  const firstNode = rows.find((r) => r.id === rowNodes[0].id)
  firstNode.pitchJugded = true
  firstNode.status = out.pass ? 'pass' : firstNode.status
  if (Math.abs(anchorDelta) > anchorTol) {
    firstNode.status = 'fail'
    firstNode.reason = 'pitch-anchor-out-of-tolerance'
    firstNode.worst = Math.abs(anchorDelta)
  }
  return out
}
