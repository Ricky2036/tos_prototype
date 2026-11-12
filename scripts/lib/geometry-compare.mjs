/**
 * geometry-compare —— G8 的纯计算部分（不碰浏览器，便于单测）
 * ==========================================================
 * 三条铁律（docs/tOS-pipeline-1.0.md §3.3）：
 *   1. 归一化系数**从容器 rect 现算**，不读全局 scale、不读 devicePixelRatio
 *      （App.vue 的 .phone-scale 有 transform: scale，rect 是缩放后的）
 *   2. 比较前四舍五入到 0.1 画布 px（分隔线是 .5px，DOM rect 是分数）
 *   3. 容差按元素类分档：线与描边 ±0.5，行与容器 ±1.5，文本不卡
 */

export const CANVAS_W = 360
export const ROUND_STEP = 0.1

/** DOM px → 画布 px 的除数（= 缩放系数） */
export function canvasScale(shellWidth) {
  if (!(shellWidth > 0)) throw new Error(`容器宽度无效: ${shellWidth}`)
  return shellWidth / CANVAS_W
}

/**
 * DOM rect 换算到画布坐标。
 * origin = 容器自身的页面坐标——**必须减掉**，否则容器只要不在页面 (0,0)，
 * 所有节点会整体偏移同一个量，看起来"全都不对"。
 */
export function toCanvasRect(rect, scale, origin = { x: 0, y: 0 }) {
  const r = (v) => Math.round((v / scale) / ROUND_STEP) * ROUND_STEP
  return {
    x: r(rect.x - origin.x),
    y: r(rect.y - origin.y),
    w: r(rect.width),
    h: r(rect.height),
  }
}

/**
 * 容差分档。返回 null = 不参与判定（只记录）。
 * 文本基线不卡：字体渲染差异不可控，卡了只会假红。
 */
export function toleranceFor(role) {
  switch (role) {
    case 'line':
    case 'divider':
    case 'border':
    case 'icon':
      return 0.5
    case 'text':
      return null
    default:
      return 1.5
  }
}

/**
 * @param {Array<{id:string,role:string,bounds:number[]}>} specNodes
 * @param {Map<string,{x:number,y:number,width:number,height:number}>} domRects
 * @param {number} scale
 * @param {{onlyIds?:Set<string>}} [opts]
 */
export function compare(specNodes, domRects, scale, opts = {}) {
  const rows = []
  for (const node of specNodes) {
    if (opts.onlyIds && !opts.onlyIds.has(node.id)) continue
    const tol = toleranceFor(node.role)
    const dom = domRects.get(node.id)
    if (!dom) {
      rows.push({ id: node.id, role: node.role, status: 'missing' })
      continue
    }
    const c = toCanvasRect(dom, scale, opts.origin)
    const [sx, sy, sw, sh] = node.bounds
    const d = {
      dx: +(c.x - sx).toFixed(2),
      dy: +(c.y - sy).toFixed(2),
      dw: +(c.w - sw).toFixed(2),
      dh: +(c.h - sh).toFixed(2),
    }
    const worst = Math.max(Math.abs(d.dx), Math.abs(d.dy), Math.abs(d.dw), Math.abs(d.dh))
    rows.push({
      id: node.id,
      role: node.role,
      status: tol === null ? 'skip' : worst > tol ? 'fail' : 'pass',
      tol,
      worst: +worst.toFixed(2),
      ...d,
      dom: c,
      spec: { x: sx, y: sy, w: sw, h: sh },
    })
  }
  return summarize(rows, specNodes.length)
}

export function summarize(rows, totalSpec) {
  const matched = rows.filter((r) => r.status !== 'missing')
  const fails = rows.filter((r) => r.status === 'fail')
  const missing = rows.filter((r) => r.status === 'missing')
  const skipped = rows.filter((r) => r.status === 'skip')
  return {
    totalSpec,
    matched: matched.length,
    pass: rows.filter((r) => r.status === 'pass').length,
    fail: fails.length,
    missing: missing.length,
    skipped: skipped.length,
    matchRate: totalSpec ? +(matched.length / totalSpec).toFixed(3) : 0,
    rows: rows.sort((a, b) => (b.worst ?? -1) - (a.worst ?? -1)),
  }
}
