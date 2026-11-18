/**
 * shared-surfaces.mjs —— 共享 UI / 几何源文件 → 受影响页面（审计 P0-6）
 * ====================================================================
 * 旧门禁只 diff `src/components/apps/settings`：改 `ListCell.vue` / `tokens.css` /
 * `GlassNavBar.vue` 时 changed_files = [] 然后 exit 0。这是「门禁可空跑」的一半。
 *
 * 硬化后：把共享源文件登记成 surface（tools/gate/shared-surfaces.json），门禁
 * 把它们映射到「受影响的已映射页面」；映射不出来时显式 needs full contract coverage
 * 并在 --block 下 exit 3，绝不静默放行。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const HERE = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_SHARED_SURFACES_PATH = path.join(HERE, 'shared-surfaces.json')

/** 极简 glob：** 跨目录、* 段内、? 单字符 */
export function globToRegExp(glob) {
  let re = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]
    if (c === '*') {
      if (glob[i + 1] === '*') {
        re += '.*'
        i++
        if (glob[i + 1] === '/') i++
      } else {
        re += '[^/]*'
      }
    } else if (c === '?') re += '[^/]'
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${re}$`)
}

export function loadSharedSurfaces(surfacesPath = DEFAULT_SHARED_SURFACES_PATH) {
  const p = path.resolve(surfacesPath)
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
  const surfaces = Array.isArray(raw.surfaces) ? raw.surfaces : []
  if (!surfaces.length) {
    const err = new Error(`shared-surfaces 文件没有 surfaces：${p}`)
    err.code = 'shared_surfaces_unavailable'
    throw err
  }
  return surfaces.map((s) => ({
    id: s.id || s.glob?.[0] || 'surface',
    globs: (Array.isArray(s.glob) ? s.glob : [s.glob]).filter(Boolean),
    pages: s.pages,
    matchers: (Array.isArray(s.glob) ? s.glob : [s.glob]).filter(Boolean).map(globToRegExp),
  }))
}

/**
 * @param {string[]} changedFiles repo 相对路径
 * @param {string[]} mappedPageIds spec-root 里已映射的 pageId（用于 pages:"*"）
 * @returns {{
 *   items: Array<{id, globs, pages, files}>,
 *   affectedPages: string[],
 *   needsFullCoverage: boolean,
 *   unmatchedSourceFiles: string[],
 *   nonSourceFiles: string[],
 *   reason: string|null
 * }}
 */
export function analyzeSharedSurfaces(changedFiles, mappedPageIds, surfacesPath = DEFAULT_SHARED_SURFACES_PATH) {
  const surfaces = loadSharedSurfaces(surfacesPath)
  const items = []
  const affected = new Set()
  const unmatchedSourceFiles = []
  const nonSourceFiles = []
  let needsFullCoverage = false
  let reason = null

  for (const file of changedFiles) {
    const isSource = file.startsWith('src/')
    let matched = false
    for (const s of surfaces) {
      if (!s.matchers.some((m) => m.test(file))) continue
      matched = true
      let item = items.find((x) => x.id === s.id)
      if (!item) {
        item = { id: s.id, globs: s.globs, pages: s.pages, files: [] }
        items.push(item)
      }
      item.files.push(file)
      if (s.pages === '*') {
        if (!mappedPageIds.length) {
          needsFullCoverage = true
          reason = `共享文件 ${file} 命中 surface ${s.id}，但 spec-root 里没有任何已映射页面 → 需要全量契约覆盖`
        } else {
          for (const p of mappedPageIds) affected.add(p)
        }
      } else if (Array.isArray(s.pages)) {
        for (const p of s.pages) affected.add(p)
      } else {
        needsFullCoverage = true
        reason = `共享文件 ${file} 命中 surface ${s.id}，但该 surface 没有页面映射 → 需要全量契约覆盖`
      }
    }
    if (matched) continue
    if (isSource) unmatchedSourceFiles.push(file)
    else nonSourceFiles.push(file)
  }

  if (unmatchedSourceFiles.length) {
    needsFullCoverage = true
    reason = `以下 src/ 改动无法映射到页面或共享 surface，需要全量契约覆盖：${unmatchedSourceFiles.join('、')}`
  }

  return {
    items,
    affectedPages: [...affected].sort(),
    needsFullCoverage,
    unmatchedSourceFiles,
    nonSourceFiles,
    reason: needsFullCoverage ? reason : null,
  }
}