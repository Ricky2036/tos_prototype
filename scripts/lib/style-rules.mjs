/**
 * style-rules —— G5 裸样式棘轮的纯计算部分
 * ========================================
 * 只数「没用 token 的硬编码视觉值」：
 *   border-radius / box-shadow / backdrop-filter
 *
 * 为什么只数这三种：它们是"看起来对不对"的主要载体，也是历史上最容易被随手写死的地方。
 * 颜色不数——RGB 硬编码在主题切换里很常见，数进来只会制造噪声。
 *
 * 判据：
 *   var(--x)        → 走 token，合规，不计数
 *   none / 0 / 0px  → 无效果，不计数
 *   其余             → 硬编码，计数
 */

export const KINDS = ['border-radius', 'box-shadow', 'backdrop-filter']

/** 允许写死的地方：设计系统本身与公共控件库 */
export const ALLOW_PREFIX = [
  'src/components/ui/',
  'src/styles/tokens.css',
  'src/styles/global.css',
]

const DECL = /(border-radius|box-shadow|backdrop-filter)\s*:\s*([^;{}]+)/g

function isTokenOrEmpty(value) {
  const v = value.trim().toLowerCase()
  if (v.includes('var(--')) return true
  // 注意：只能整值比较。box-shadow 的 `0 1px 2px …` 里第一个 0 是偏移量，
  // 用前缀匹配会把所有阴影都吞掉（实测踩过）。
  if (/^(none|initial|inherit|unset)$/.test(v)) return true
  if (/^0(px|%)?$/.test(v)) return true
  if (v === 'transparent') return true
  return false
}

/**
 * 从一段 CSS 文本里抽出硬编码声明。
 * @param {string} text
 * @returns {Array<{kind:string, value:string, offset:number}>}
 */
export function extractRawStyles(text) {
  const out = []
  // 去掉注释，避免把注释里的示例算进去
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
  let m
  DECL.lastIndex = 0
  while ((m = DECL.exec(clean))) {
    const kind = m[1]
    const value = m[2].trim()
    if (isTokenOrEmpty(value)) continue
    out.push({ kind, value: value.slice(0, 80), offset: m.index })
  }
  return out
}

/** 只取 .vue 的 <style> 块；这是唯一可靠的静态边界 */
export function styleBlocksOf(vueSource) {
  const blocks = []
  const re = /<style[^>]*>([\s\S]*?)<\/style>/g
  let m
  while ((m = re.exec(vueSource))) blocks.push(m[1])
  return blocks
}

export function countByFile(files) {
  const byFile = {}
  let total = 0
  for (const { file, text, isVue } of files) {
    const chunks = isVue ? styleBlocksOf(text) : [text]
    let n = 0
    for (const c of chunks) n += extractRawStyles(c).length
    if (n > 0) byFile[file] = n
    total += n
  }
  return { total, byFile }
}

/** 是否为允许直接写死的文件 */
export function isAllowed(file) {
  return ALLOW_PREFIX.some((p) => file.startsWith(p))
}
