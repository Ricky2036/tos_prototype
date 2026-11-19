/**
 * xml.mjs —— uiautomator dump 的严格嵌套解析
 * ==========================================
 * 只依赖 node 内置能力，不引第三方 XML 库。目标不是通用 XML，而是把
 * uiautomator dump 还原成**真实父子关系**的树，供 model.mjs 判定行/分组/页头。
 *
 * 三个必须做对的点（参考实现已踩过）：
 *   1. `<node .../>` 自闭合：**没有子节点**，绝不能入栈。否则后续兄弟节点会被
 *      当成它的子节点，整页 summary 串行错位（本仓 system.xml 28 个 node 中 14 个自闭合）。
 *   2. 属性值里的实体必须反转义（&amp; &lt; &gt; &quot; &apos; 及 &#NN; / &#xHH;），
 *      否则行标题/摘要会带字面量，契约与实现侧对不上。
 *   3. bounds 解析 `[x1,y1][x2,y2]` → {x,y,w,h}，宽高按 max(0, ...) 兜底。
 *
 * 严格性：闭合标签与栈顶不匹配、文件末尾仍有未闭合标签 → 直接抛错（不静默容错）。
 * uiautomator 的 dump 是严格嵌套的；出现不匹配说明 dump 被截断/拼接，宁可红。
 */

const TAG_START = /[A-Za-z_:]/
const ATTR_RE = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

/** 反转义 XML 实体。单遍处理，避免 `&amp;lt;` 被二次解码成 `<`。 */
export function decodeEntities(s = '') {
  if (!s || !s.includes('&')) return s
  return s.replace(/&(#[xX][0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);/g, (m, body) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X'
      const code = Number.parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10)
      if (!Number.isFinite(code)) return m
      try {
        return String.fromCodePoint(code)
      } catch {
        return m
      }
    }
    switch (body) {
      case 'amp': return '&'
      case 'lt': return '<'
      case 'gt': return '>'
      case 'quot': return '"'
      case 'apos': return "'"
      default: return m
    }
  })
}

/** `[x1,y1][x2,y2]` → {x,y,w,h}；非法或缺失返回 null。 */
export function parseBounds(s = '') {
  const m = /\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]\s*\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/.exec(s || '')
  if (!m) return null
  const x = Number(m[1])
  const y = Number(m[2])
  const x2 = Number(m[3])
  const y2 = Number(m[4])
  return { x, y, w: Math.max(0, x2 - x), h: Math.max(0, y2 - y) }
}

function parseAttrs(raw) {
  const attrs = {}
  ATTR_RE.lastIndex = 0
  let m
  while ((m = ATTR_RE.exec(raw))) attrs[m[1]] = decodeEntities(m[2] ?? m[3] ?? '')
  return attrs
}

/**
 * 扫描出所有标签 token（`<node ...>` / `<node .../>` / `</node>` / `<?xml?>` / `<hierarchy>`）。
 * 属性值里的 `>` 不会提前截断（按引号状态扫描）。
 */
function tokenize(xml) {
  const tokens = []
  const n = xml.length
  let i = 0
  while (i < n) {
    const lt = xml.indexOf('<', i)
    if (lt < 0) break
    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt + 4)
      if (end < 0) throw new Error(`XML 注释未闭合 @${lt}`)
      i = end + 3
      continue
    }
    if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt + 9)
      if (end < 0) throw new Error(`CDATA 未闭合 @${lt}`)
      tokens.push({ type: 'text', value: xml.slice(lt + 9, end), at: lt })
      i = end + 3
      continue
    }
    // 扫描到匹配的 '>'，跳过引号内内容
    let j = lt + 1
    let quote = null
    for (; j < n; j++) {
      const ch = xml[j]
      if (quote) {
        if (ch === quote) quote = null
      } else if (ch === '"' || ch === "'") {
        quote = ch
      } else if (ch === '>') {
        break
      }
    }
    if (j >= n) throw new Error(`XML 标签未闭合 @${lt}`)
    const inner = xml.slice(lt + 1, j)
    i = j + 1
    if (inner.startsWith('?') || inner.startsWith('!')) {
      tokens.push({ type: 'meta', value: inner, at: lt })
      continue
    }
    const closing = inner.startsWith('/')
    if (closing) {
      tokens.push({ type: 'close', name: inner.slice(1).trim(), at: lt })
      continue
    }
    const selfClosing = /\/\s*$/.test(inner)
    const body = selfClosing ? inner.replace(/\/\s*$/, '') : inner
    const nameMatch = TAG_START.exec(body)
    if (!nameMatch) throw new Error(`非法标签 @${lt}: <${inner}>`)
    const name = /^[A-Za-z_:][\w:.-]*/.exec(body)[0]
    const attrs = parseAttrs(body.slice(name.length))
    tokens.push({ type: selfClosing ? 'self' : 'open', name, attrs, at: lt })
  }
  return tokens
}

function makeNode(tag, attrs, parent) {
  const bounds = parseBounds(attrs.bounds)
  return {
    tag,
    attrs,
    parent,
    children: [],
    // 常用字段拍平，model 层直接用
    cls: attrs.class || '',
    text: attrs.text || '',
    desc: attrs['content-desc'] || '',
    rid: attrs['resource-id'] || '',
    pkg: attrs.package || '',
    clickable: attrs.clickable === 'true',
    longClickable: attrs['long-clickable'] === 'true',
    scrollable: attrs.scrollable === 'true',
    checkable: attrs.checkable === 'true',
    checked: attrs.checked === 'true',
    enabled: attrs.enabled !== 'false',
    selected: attrs.selected === 'true',
    focused: attrs.focused === 'true',
    bounds,
  }
}

/**
 * 解析 dump → 树。返回 `#document` 根，真正的 `<hierarchy>` / `<node>` 在其下。
 * 严格嵌套：不匹配即抛错。
 * @param {string} xml
 * @returns {{tag:string,attrs:object,children:object[],parent:null}}
 */
export function parseUiTree(xml) {
  if (typeof xml !== 'string' || xml.trim() === '') throw new Error('XML 为空')
  const tokens = tokenize(xml)
  const root = { tag: '#document', attrs: {}, children: [], parent: null }
  const stack = [root]
  for (const tok of tokens) {
    if (tok.type === 'meta' || tok.type === 'text') continue
    if (tok.type === 'close') {
      if (stack.length <= 1) throw new Error(`多余的闭合标签 </${tok.name}> @${tok.at}`)
      const top = stack[stack.length - 1]
      if (top.tag !== tok.name) {
        throw new Error(`XML 标签不匹配：</${tok.name}> 与栈顶 <${top.tag}> @${tok.at}`)
      }
      stack.pop()
      continue
    }
    const node = makeNode(tok.name, tok.attrs, stack[stack.length - 1])
    stack[stack.length - 1].children.push(node)
    if (tok.type === 'open') stack.push(node)
    // self-closing：不入栈 —— 这是 sibling 错位的根因
  }
  if (stack.length > 1) {
    throw new Error(`XML 存在未闭合标签：<${stack[stack.length - 1].tag}>`)
  }
  return root
}

/** 前序遍历（不含 root 自身）。 */
export function walk(node, fn) {
  for (const child of node.children) {
    fn(child)
    walk(child, fn)
  }
}

/** 展平为数组（前序，不含 root 自身）。 */
export function flatten(root) {
  const out = []
  walk(root, (n) => out.push(n))
  return out
}

/** 一个节点是否位于某个可点祖先之内（不含自身）。 */
export function hasClickableAncestor(node) {
  for (let p = node.parent; p; p = p.parent) if (p.clickable) return true
  return false
}

/** 子树中所有非空 TextView 文本（按文档顺序，只看子孙）。 */
export function subtreeTexts(node) {
  const out = []
  walk(node, (n) => {
    if (n.tag === 'node' && n.cls.includes('TextView')) {
      const t = n.text.trim()
      if (t) out.push(t)
    }
  })
  return out
}

/** 子树内所有节点（含自身）。 */
export function subtree(node) {
  const out = [node]
  walk(node, (n) => out.push(n))
  return out
}

export const LEAF_CLASSES = /TextView|ImageView|ImageButton|Switch|CheckBox|SeekBar|EditText|Button/

/** 文本是否为 PUA（私有区图标字形，如 \ue907），没有可读语义。 */
export const PUA_RE = /^[\uE000-\uF8FF\s]+$/
