/**
 * page-snapshot.mjs —— 浏览器侧采集：容器 rect + 候选元素（硬化版）
 * ================================================================
 * 审计 P0-5 的三处漏洞在这里堵：
 *   1. 祖先 opacity:0 / visibility:hidden / display:none / 被裁剪的元素仍被采集
 *      → 现在逐级祖先检查 + 祖先 overflow 裁剪求交后再决定是否采集。
 *   2. 自造行只要不带 4 个 data-* 属性就不算 extra
 *      → 额外采集「行级结构」：带行级属性的元素、.list-cell、[role=row]，
 *        以及「满宽文本横条」（宽 ≥ 80% 容器、高 32–88px）作为无属性自造行候选。
 *   3. 只带回带属性/文本命中的元素，无法判断「壳外元素」是否可见
 *      → 每个元素带回 visible/rowLevel/bandCandidate/classes，供 diff.mjs 做集合差。
 *
 * 每个元素带回：页面坐标 rect、可选 Range 文本盒、textContent.trim()、depth、attrs、
 * rowLevel（结构行）、bandCandidate（满宽文本横条）、classes。
 * 坐标系：getBoundingClientRect（页面 px）；画布换算在 diff.mjs 里做。
 */

export const SNAPSHOT_ATTRS = [
  'data-accept-id',
  'data-testid',
  'data-test',
  'data-row',
  'data-system-row',
  'data-dt-row',
  'data-nav-back',
  'aria-label',
  'role',
]

/** 结构化行判定用的 class 名（产品里真实存在） */
export const ROW_CLASS_HINTS = ['list-cell', 'list-row', 'setting-row', 'settings-row']

/**
 * @param {import('playwright').Page} page
 * @param {{shell?:string, scope?:string|null, specTexts?:string[]}} opts
 * @returns {Promise<{shell:{x,y,width,height}, scope:string, elements:Array}|null>}
 */
export async function captureSnapshot(page, { shell = '.screen-view', scope = null, specTexts = [] } = {}) {
  return page.evaluate(
    ({ shellSel, scopeSel, attrNames, wantedTexts, rowClassHints }) => {
      const shellEl = document.querySelector(shellSel)
      if (!shellEl) return null
      const shellRect = shellEl.getBoundingClientRect()
      const scopeEl = (scopeSel && document.querySelector(scopeSel)) || shellEl
      const wanted = new Set(wantedTexts)
      const elements = []
      let seq = 0

      // 祖先链：visibility / opacity / 裁剪。返回 false = 该元素不可见或已被裁掉。
      const ancestorHidden = (el) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const st = getComputedStyle(p)
          if (
            st.display === 'none' ||
            st.visibility === 'hidden' ||
            st.visibility === 'collapse' ||
            Number(st.opacity) === 0 ||
            st.contentVisibility === 'hidden'
          ) {
            return true
          }
          if (p === scopeEl || p === document.body) break
        }
        return false
      }
      const clipRect = (el) => {
        // 被祖先 overflow 裁剪盒裁掉的元素不算可见证据
        const box = el.getBoundingClientRect()
        let cur = { x: box.x, y: box.y, width: box.width, height: box.height }
        for (let p = el.parentElement; p; p = p.parentElement) {
          const st = getComputedStyle(p)
          if (st.overflowX !== 'visible' || st.overflowY !== 'visible') {
            const r = p.getBoundingClientRect()
            const x1 = Math.max(cur.x, r.x)
            const y1 = Math.max(cur.y, r.y)
            const x2 = Math.min(cur.x + cur.width, r.x + r.width)
            const y2 = Math.min(cur.y + cur.height, r.y + r.height)
            cur = { x: x1, y: y1, width: Math.max(0, x2 - x1), height: Math.max(0, y2 - y1) }
          }
          if (p === scopeEl || p === document.body) break
        }
        return cur
      }

      const all = [scopeEl, ...scopeEl.querySelectorAll('*')]
      for (const el of all) {
        const st = getComputedStyle(el)
        if (
          st.display === 'none' ||
          st.visibility === 'hidden' ||
          st.visibility === 'collapse' ||
          Number(st.opacity) === 0
        ) {
          continue
        }
        if (ancestorHidden(el)) continue
        const rect = el.getBoundingClientRect()
        if (rect.width < 0.5 || rect.height < 0.5) continue
        const clipped = clipRect(el)
        if (clipped.width < 0.5 || clipped.height < 0.5) continue

        const attrs = {}
        let hasAttr = false
        for (const name of attrNames) {
          const v = el.getAttribute(name)
          if (v != null) {
            attrs[name] = v
            hasAttr = true
          }
        }
        const text = (el.textContent || '').trim()
        const textWanted = wanted.has(text)

        const classes = typeof el.className === 'string' ? el.className : ''
        const classList = classes ? classes.split(/\s+/).filter(Boolean) : []
        const rowLevel =
          hasAttr &&
          (attrs['data-row'] != null ||
            attrs['data-system-row'] != null ||
            attrs['data-dt-row'] != null ||
            attrs['data-testid'] != null ||
            attrs['data-accept-id'] != null)
            ? true
          : rowClassHints.some((h) => classList.includes(h)) || attrs.role === 'row'
        // 无属性自造行候选：满宽 + 行高量级的文本横条（用于 G8a 集合差）
        const bandCandidate =
          !!text && rect.width >= shellRect.width * 0.8 && rect.height >= 32 && rect.height <= 88

        if (!hasAttr && !textWanted && !rowLevel && !bandCandidate) continue

        let depth = 0
        for (let p = el.parentElement; p && p !== scopeEl; p = p.parentElement) depth++
        if (el === scopeEl) depth = 0

        let textRect = null
        if (textWanted || attrs['data-nav-back'] != null) {
          const range = document.createRange()
          range.selectNodeContents(el)
          const r = range.getBoundingClientRect()
          if (r.width > 0 || r.height > 0) {
            textRect = { x: r.x, y: r.y, width: r.width, height: r.height }
          }
        }

        elements.push({
          key: `el${seq++}`,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          clippedRect: { x: clipped.x, y: clipped.y, width: clipped.width, height: clipped.height },
          textRect,
          text,
          attrs,
          classes: classes.slice(0, 160),
          rowLevel: !!rowLevel,
          bandCandidate: !!bandCandidate,
          depth,
        })
      }

      return {
        shell: { x: shellRect.x, y: shellRect.y, width: shellRect.width, height: shellRect.height },
        scope: scopeEl === shellEl ? '<shell>' : scopeSel,
        elements,
      }
    },
    { shellSel: shell, scopeSel: scope, attrNames: SNAPSHOT_ATTRS, wantedTexts: specTexts, rowClassHints: ROW_CLASS_HINTS }
  )
}