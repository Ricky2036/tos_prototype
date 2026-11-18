/**
 * model.mjs —— dump → 页面语义模型（page model）
 * ===============================================
 * 这是契约层的关键一层：产品仓库 `scripts/spec-gen.mjs` 把 a11y 树**平铺**成
 * geometry（28 个 node → 28 条，其中 10 条 resource-id 都叫 android:id/title，
 * id 全撞成 "title"）。这里先把层级还原，再抽「页头 / 行 / 分组头」。
 *
 * 角色规则（与参考实现 evidence-pipeline/fixtures/spec/make-demo-spec.mjs 一致）：
 *   header:title  resource-id 含 toolbar_title 且文本非空
 *   header:back   resource-id 含 toolbar_left_ico（真机是 toolbar_left_icon）
 *   row           可点容器，非满屏、不在工具栏区域、非叶子控件、子树含非空 TextView
 *                 · 开关类行（子树含 Switch/CheckBox）→ toggle=true（带 checked）
 *                 · 带第二段文本的行 → summary
 *   group         不可点的 TextView，且**不在任何可点祖先内**（不在工具栏）
 *
 * id 必须唯一：行用 `row:<行标题>`，重复时 `#2`、`#3`……；**禁止**用 resource-id
 * 末段（本仓 10 行的 resource-id 全是 android:id/title，会互撞）。
 *
 * 机器提不出来的东西（图标形态/底盘/填充率/颜色/圆角）一律进 unknowns，不猜。
 */
import {
  parseUiTree,
  flatten,
  hasClickableAncestor,
  subtreeTexts,
  PUA_RE,
} from './xml.mjs'
import { CANVAS, coeffFor, coeffForPx } from './coords.mjs'

/** 与产品仓库 spec-gen 一致：这些叶子控件本身不是行（行是它们的可点容器父级） */
const ROW_EXCLUDE = /TextView|ImageView|ImageButton|Switch|CheckBox|SeekBar/
const TOGGLE_CLASS = /Switch|CheckBox/

const round1 = (n) => Math.round(n * 10) / 10

function makeCanvasRect(bounds, kx, ky) {
  return {
    x: round1(bounds.x * kx),
    y: round1(bounds.y * ky),
    w: round1(bounds.w * kx),
    h: round1(bounds.h * ky),
  }
}

function cropOf(bounds) {
  return [bounds.x, bounds.y, bounds.w, bounds.h]
}

/**
 * @param {string} xml uiautomator dump 文本
 * @param {object} opts
 * @param {string} [opts.source='infinix-1208'] pixel-refs 里的 source id
 * @param {string} [opts.screen='unknown'] 页面 id（写进 stats/doc）
 * @param {{w:number,h:number}} [opts.sourcePx] 直接给设备像素（给了就不查表）
 * @param {string} [opts.sourcesPath] 自定义 sources.json 路径
 * @param {{w:number,h:number}} [opts.canvas] 画布尺寸（默认 360×788）
 * @returns {{nodes:object[], unknowns:object[], stats:object}}
 */
export function buildPageModel(xml, opts = {}) {
  const {
    source = 'infinix-1208',
    screen = 'unknown',
    sourcePx = null,
    sourcesPath = null,
    canvas = CANVAS,
  } = opts

  const coeff = sourcePx
    ? { ...coeffForPx(sourcePx.w, sourcePx.h), id: source }
    : coeffFor(source, { sourcesPath })
  const kx = canvas.w / coeff.w
  const ky = canvas.h / coeff.h
  const screenW = coeff.w
  const screenH = coeff.h

  const tree = parseUiTree(xml)
  const all = flatten(tree).filter((n) => n.tag === 'node')

  const isFullScreen = (n) =>
    !!n.bounds && n.bounds.w >= screenW * 0.999 && n.bounds.h >= screenH * 0.999

  const nodes = []
  const unknowns = []
  const usedIds = new Map()
  const uniqueId = (base) => {
    const n = usedIds.get(base) || 0
    usedIds.set(base, n + 1)
    return n === 0 ? base : `${base}#${n + 1}`
  }

  /* ---------- 1) 页头 ---------- */
  for (const n of all) {
    if (/toolbar_title/.test(n.rid) && n.text.trim() && n.bounds) {
      const c = makeCanvasRect(n.bounds, kx, ky)
      nodes.push({
        id: uniqueId('header:title'),
        role: 'header-title',
        text: n.text.trim(),
        summary: '',
        bounds: c,
        clickable: n.clickable,
        crop: cropOf(n.bounds),
      })
    }
  }
  for (const n of all) {
    if (/toolbar_left_ico/.test(n.rid) && n.bounds) {
      const c = makeCanvasRect(n.bounds, kx, ky)
      nodes.push({
        id: uniqueId('header:back'),
        role: 'header-back',
        text: '',
        summary: '',
        bounds: c,
        clickable: true,
        crop: cropOf(n.bounds),
      })
    }
  }

  /* ---------- 工具栏区域：resource-id 含 toolbar_ 的节点及其祖先 ---------- */
  const inToolbar = new Set()
  for (const n of all) {
    if (!/toolbar_/.test(n.rid)) continue
    for (let p = n; p; p = p.parent) inToolbar.add(p)
  }

  /* ---------- 2) 行 ---------- */
  const rowCounts = new Map()
  for (const n of all) {
    if (!n.clickable || !n.bounds) continue
    if (inToolbar.has(n)) continue
    if (isFullScreen(n)) continue
    if (ROW_EXCLUDE.test(n.cls)) continue
    const texts = subtreeTexts(n)
    if (texts.length === 0) {
      // 可点容器但没有任何可读文本：不猜标签，记进 unknowns
      unknowns.push({
        kind: 'unbound',
        element: `clickable#${all.indexOf(n)}`,
        reason: `可点容器无可读 TextView 文本（class=${n.cls || '?'}），无法绑定行 id`,
      })
      continue
    }
    const title = texts[0]
    if (PUA_RE.test(title)) {
      unknowns.push({
        kind: 'unreadable',
        element: `row?@${all.indexOf(n)}`,
        reason: `行标题是 PUA 私有区图标字形（${JSON.stringify(title)}），无文本语义`,
      })
      continue
    }
    let toggle = false
    let checked = null
    for (const sub of [n, ...flatten(n)]) {
      if (TOGGLE_CLASS.test(sub.cls) || (sub !== n && sub.checkable)) {
        toggle = true
        checked = sub.checked
        break
      }
    }
    const base = `row:${title}`
    const seen = rowCounts.get(base) || 0
    rowCounts.set(base, seen + 1)
    const id = seen === 0 ? base : `${base}#${seen + 1}`
    const c = makeCanvasRect(n.bounds, kx, ky)
    nodes.push({
      id,
      role: 'row',
      text: title,
      summary: texts.slice(1).join(' / '),
      bounds: c,
      clickable: true,
      crop: cropOf(n.bounds),
      toggle,
      checked: toggle ? checked : null,
    })
  }

  /* ---------- 3) 分组头 ---------- */
  for (const n of all) {
    if (!n.cls.includes('TextView') || !n.bounds) continue
    const text = n.text.trim()
    if (!text) continue
    if (/toolbar_/.test(n.rid)) continue
    if (hasClickableAncestor(n)) continue
    if (isFullScreen(n)) continue
    if (PUA_RE.test(text)) continue
    const c = makeCanvasRect(n.bounds, kx, ky)
    nodes.push({
      id: uniqueId(`group:${text}`),
      role: 'group',
      text,
      summary: '',
      bounds: c,
      clickable: false,
      crop: cropOf(n.bounds),
    })
  }

  /* ---------- 4) unknowns：机器不可提取的外观 + 树可用性 ---------- */
  const bounded = all.filter((n) => n.bounds)
  const a11yUnusable = bounded.length > 0 && bounded.every(isFullScreen)
  if (a11yUnusable) {
    unknowns.push({
      kind: 'a11y',
      element: 'page',
      reason:
        '整棵 a11y 树只有满屏容器（疑似 Jetpack Compose / 自绘页面），无法提取任何行/分组几何；该页 G0/G8 不得判绿',
    })
  }
  if (nodes.some((n) => n.role === 'row')) {
    unknowns.push({
      kind: 'appearance',
      element: 'row:*',
      reason: '图标形态/底盘/填充率/颜色/圆角无法从 a11y 树机器提取，需 appearance crop 人工补齐',
    })
  }

  const stats = {
    screen,
    source,
    canvas,
    device_px: { w: coeff.w, h: coeff.h },
    kx,
    ky,
    anisotropic: coeff.anisotropic,
    xml_nodes: all.length,
    headers: nodes.filter((n) => n.role === 'header-title' || n.role === 'header-back').length,
    rows: nodes.filter((n) => n.role === 'row').length,
    groups: nodes.filter((n) => n.role === 'group').length,
    toggles: nodes.filter((n) => n.toggle === true).length,
    extractable: nodes.length,
    a11y_unusable: a11yUnusable,
  }

  return { nodes, unknowns, stats }
}
