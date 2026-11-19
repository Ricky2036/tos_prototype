/**
 * spec-guard.mjs —— 契约（spec）自身的防伪/防删/防顶包（审计 P0-3 + P0-7）
 * ======================================================================
 * 审计结论：契约层有牙齿，但 spec 文件本身零设防——删掉难节点可洗白、xml_sha256
 * 只写不读、拿别的页 spec 顶包也能判。本文件把 spec 当成**受门禁保护的输入**：
 *
 *   P0-7  spec 布局：同时支持
 *           <root>/<pageId>.geometry.json          （嵌套，spec-batch 产物）
 *           <root>/<pageId '/'→'-'>.geometry.json  （扁平，历史 fixture）
 *         先试嵌套再试扁平；不再要求手工改名。
 *   P0-3  spec.screen 必须 === pageId（错页顶包直接红）
 *        节点集合棘轮：基线 .gate/spec-baseline.json（不存在则创建），节点 id 只增
 *         不减；删除必须在 spec 里显式声明 removed:[{id,reason,approver,expires_at}]
 *         且未过期，否则红。
 *        若 spec 带 xml_sha256 且门禁给了 --dump-root：校验对应 dump 的 sha256。
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const TODAY = () => new Date().toISOString().slice(0, 10)

export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/* ----------------------------- spec 读取 ----------------------------- */

export function readSpecFile(specPath) {
  const raw = fs.readFileSync(path.resolve(specPath))
  const spec = JSON.parse(raw.toString('utf8'))
  return { spec, sha256: sha256(raw), path: path.resolve(specPath) }
}

export function nestedSpecPath(specRoot, pageId) {
  return path.join(specRoot, `${pageId}.geometry.json`)
}

export function flatSpecPath(specRoot, pageId) {
  return path.join(specRoot, `${pageId.replace(/\//g, '-')}.geometry.json`)
}

/**
 * P0-7：两种布局都认。返回 {path, layout} 或 null（都不存在）。
 * @returns {{path:string, layout:'nested'|'flat'}|null}
 */
export function findSpecPath(specRoot, pageId) {
  const candidates = [
    { p: nestedSpecPath(specRoot, pageId), layout: 'nested' },
    { p: flatSpecPath(specRoot, pageId), layout: 'flat' },
  ]
  for (const c of candidates) {
    if (fs.existsSync(c.p) && fs.statSync(c.p).isFile()) return { path: c.p, layout: c.layout }
  }
  return null
}

/** 兼容旧导出：扁平命名（仅供非门禁调用方/测试） */
export function specPathForPageId(specRoot, pageId) {
  return flatSpecPath(specRoot, pageId)
}

/**
 * 枚举 spec-root 下所有已映射页面：嵌套布局用相对路径当 pageId；扁平布局用
 * spec.screen（扁平文件名不可逆）。返回按 pageId 排序的 [{pageId, path, layout, screen}]。
 */
export function listMappedPages(specRoot) {
  const root = path.resolve(specRoot)
  const found = []
  if (!fs.existsSync(root)) return found
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(abs)
      } else if (entry.isFile() && entry.name.endsWith('.geometry.json')) {
        const rel = path.relative(root, abs).split(path.sep).join('/')
        const nested = rel.includes('/')
        // `<pageId>__<state>.geometry.json` 是同一页的状态变体，不是独立页面
        if (path.posix.basename(rel).includes('__')) continue
        let pageId = null
        let screen = null
        try {
          screen = JSON.parse(fs.readFileSync(abs, 'utf8')).screen || null
        } catch {
          screen = null
        }
        if (nested) pageId = rel.slice(0, -'.geometry.json'.length)
        else pageId = screen
        if (!pageId) continue
        found.push({ pageId, path: abs, layout: nested ? 'nested' : 'flat', screen })
      }
    }
  }
  walk(root)
  const byId = new Map()
  for (const f of found) {
    // 嵌套优先于扁平（同一页两种布局同时存在时，门禁按嵌套判）
    const prev = byId.get(f.pageId)
    if (!prev || (prev.layout === 'flat' && f.layout === 'nested')) byId.set(f.pageId, f)
  }
  return [...byId.values()].sort((a, b) => a.pageId.localeCompare(b.pageId))
}

/* --------------------------- spec 身份校验 --------------------------- */

/** spec.screen 必须 === pageId（P0-3：防错页顶包） */
export function checkScreen(spec, pageId) {
  if (!spec || typeof spec !== 'object') return { ok: false, reason: 'spec 不是对象' }
  if (!Array.isArray(spec.nodes)) return { ok: false, reason: 'spec 缺 nodes 数组' }
  if (!spec.screen) return { ok: false, reason: 'spec 缺 screen 字段，无法校验是否本页契约' }
  if (spec.screen !== pageId) {
    return { ok: false, reason: `spec.screen=${JSON.stringify(spec.screen)} ≠ pageId=${JSON.stringify(pageId)}：疑似拿别的页面契约顶包` }
  }
  return { ok: true, reason: null }
}

/* ---------------------------- xml_sha256 ---------------------------- */

/** dump 文件候选路径（--dump-root 下按 spec.from / pageId / basename 找） */
export function dumpCandidates(spec, dumpRoot, pageId) {
  const root = path.resolve(dumpRoot)
  const names = []
  if (spec && typeof spec.from === 'string' && spec.from.trim()) {
    names.push(path.join(root, spec.from.trim()))
    names.push(path.join(root, pageId, path.basename(spec.from.trim())))
    names.push(path.join(root, path.basename(spec.from.trim())))
  }
  names.push(path.join(root, pageId, 'system.xml'))
  names.push(path.join(root, `${pageId}.xml`))
  return [...new Set(names)]
}

/**
 * 校验 spec.xml_sha256 与对应 dump 的 sha256。
 * @returns {{ok:boolean, checked:boolean, reason:string|null, dumpPath:string|null, expected:string|null, actual:string|null}}
 */
export function checkDumpSha(spec, { dumpRoot, pageId } = {}) {
  const expected = spec && typeof spec.xml_sha256 === 'string' ? spec.xml_sha256 : null
  if (!expected) return { ok: true, checked: false, reason: 'spec 无 xml_sha256，跳过', dumpPath: null, expected: null, actual: null }
  if (!dumpRoot) return { ok: true, checked: false, reason: '未给 --dump-root，跳过 dump sha 校验', dumpPath: null, expected, actual: null }
  const cands = dumpCandidates(spec, dumpRoot, pageId)
  const dumpPath = cands.find((p) => fs.existsSync(p) && fs.statSync(p).isFile()) || null
  if (!dumpPath) {
    return { ok: false, checked: true, reason: `--dump-root 下找不到对应 dump（试过 ${cands.length} 个候选）`, dumpPath: null, expected, actual: null }
  }
  const actual = sha256(fs.readFileSync(dumpPath))
  return { ok: actual === expected, checked: true, reason: actual === expected ? null : 'spec.xml_sha256 与 dump 内容不一致：契约与 dump 不是同一份', dumpPath, expected, actual }
}

/* ------------------------------ 棘轮 ------------------------------ */

export function defaultBaselinePath(repo) {
  return path.join(path.resolve(repo), '.gate', 'spec-baseline.json')
}

export function loadBaseline(baselinePath) {
  if (!baselinePath || !fs.existsSync(baselinePath)) {
    return { baseline: { schema_version: 1, pages: {} }, exists: false, path: baselinePath || null }
  }
  const raw = fs.readFileSync(baselinePath, 'utf8')
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    const err = new Error(`spec baseline 不是合法 JSON：${baselinePath} · ${e.message}`)
    err.code = 'bad_baseline'
    throw err
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.pages) {
    const err = new Error(`spec baseline 缺 pages 字段：${baselinePath}`)
    err.code = 'bad_baseline'
    throw err
  }
  return { baseline: parsed, exists: true, path: baselinePath }
}

function nodeIdsOf(spec) {
  return (spec.nodes || []).map((n) => n.id)
}

/** spec.removed 里的删除声明（id → waiver），校验字段与到期 */
export function removalWaivers(spec, today = TODAY()) {
  const list = Array.isArray(spec && spec.removed) ? spec.removed : []
  const map = new Map()
  for (const r of list) {
    if (!r || typeof r !== 'object' || !r.id) continue
    const valid = !!r.reason && !!r.approver && !!r.expires_at && /^\d{4}-\d{2}-\d{2}$/.test(r.expires_at) && r.expires_at >= today
    map.set(r.id, { ...r, valid })
  }
  return map
}

/**
 * 节点集合棘轮（P0-3）。基线不存在时视为「首次建基线」，不判红但会把当前集合写入。
 * @returns {{ok:boolean, isNewPage:boolean, added:string[], removed:string[], violations:Array, notes:Array, entry:object}}
 */
export function checkRatchet({ pageId, spec, baseline, today = TODAY() }) {
  const ids = nodeIdsOf(spec)
  const prev = baseline.pages[pageId]
  const notes = []
  const violations = []
  if (!prev) {
    return {
      ok: true,
      isNewPage: true,
      added: [...ids],
      removed: [],
      violations,
      notes: [`首次建基线：${pageId} ${ids.length} 个节点`],
      entry: {
        spec_sha256: sha256(JSON.stringify(spec.nodes)),
        node_ids: [...ids].sort(),
        count: ids.length,
        first_seen: today,
        updated_at: today,
      },
    }
  }
  const prevIds = new Set(prev.node_ids || [])
  const curIds = new Set(ids)
  const added = ids.filter((id) => !prevIds.has(id))
  const removed = (prev.node_ids || []).filter((id) => !curIds.has(id))
  const waivers = removalWaivers(spec, today)
  for (const id of removed) {
    const w = waivers.get(id)
    if (!w) violations.push({ id, reason: 'removed-without-waiver', detail: '节点从基线里消失但 spec.removed 没有对应删除声明' })
    else if (!w.valid) violations.push({ id, reason: 'removed-waiver-invalid', detail: 'spec.removed 声明缺 reason/approver/expires_at 或已过期' })
  }
  for (const [id, w] of waivers) {
    if (curIds.has(id)) notes.push(`spec.removed 声明了 ${id}，但该节点仍在 spec 里（无效声明）`)
    if (!w.valid) violations.push({ id, reason: 'removed-waiver-invalid', detail: 'spec.removed 声明缺 reason/approver/expires_at 或已过期' })
  }
  const countDecreased = ids.length < (prev.count || 0) && removed.length === 0
  if (countDecreased) violations.push({ id: null, reason: 'count-decreased', detail: `节点数 ${prev.count} → ${ids.length} 但没有删除声明` })

  // 只增不减：新集合 = 旧集合 ∪ 新节点（删除已通过 waiver 的仍从基线移除，避免无限累积）
  const mergedIds = [...new Set([...(prev.node_ids || []), ...ids])].filter((id) => !(removed.includes(id) && curIds.has(id) === false && waivers.get(id)?.valid))
  return {
    ok: violations.length === 0,
    isNewPage: false,
    added,
    removed,
    violations,
    notes,
    entry: {
      ...prev,
      node_ids: mergedIds.sort(),
      count: mergedIds.length,
      spec_sha256: sha256(JSON.stringify(spec.nodes)),
      updated_at: today,
    },
  }
}

/** 把校验通过后的 entry 写回基线（原地修改 baseline） */
export function applyBaselineEntry(baseline, pageId, entry) {
  baseline.pages[pageId] = entry
  baseline.updated_at = TODAY()
  return baseline
}

export function saveBaseline(baselinePath, baseline) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true })
  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2) + '\n')
}

/**
 * 门禁对单页做完整 spec 守卫（P0-3 + P0-7 的组合入口）。
 * @returns {{ok, specPath, layout, spec, specSha256, checks:{screen,dump,ratchet}, violations:Array, notes:Array, baselineEntry}}
 */
export function guardPageSpec({ repo, specRoot, pageId, baseline, dumpRoot, today = TODAY() }) {
  const hit = findSpecPath(specRoot, pageId)
  if (!hit) {
    return {
      ok: false,
      code: 'blocked_no_spec',
      reason: `两种布局都没有该页 spec（试过嵌套 ${nestedSpecPath(specRoot, pageId)} / 扁平 ${flatSpecPath(specRoot, pageId)}）`,
      specPath: flatSpecPath(specRoot, pageId),
      layout: null,
      spec: null,
      specSha256: null,
      checks: {},
      violations: [],
      notes: [],
      baselineEntry: null,
    }
  }
  const { spec, sha256: specSha256 } = readSpecFile(hit.path)
  const screen = checkScreen(spec, pageId)
  const dump = checkDumpSha(spec, { dumpRoot, pageId })
  const ratchet = checkRatchet({ pageId, spec, baseline, today })
  const violations = []
  if (!screen.ok) violations.push({ id: null, reason: 'screen-mismatch', detail: screen.reason })
  if (dump.checked && !dump.ok) violations.push({ id: null, reason: 'xml-sha256-mismatch', detail: dump.reason })
  for (const v of ratchet.violations) violations.push(v)
  return {
    ok: violations.length === 0,
    code: violations.length ? 'blocked_spec_invalid' : 'ok',
    reason: violations.length ? violations.map((v) => v.detail || v.reason).join('；') : null,
    specPath: hit.path,
    layout: hit.layout,
    spec,
    specSha256,
    checks: { screen, dump, ratchet },
    violations,
    notes: ratchet.notes,
    baselineEntry: ratchet.entry,
    baselineIsNewPage: ratchet.isNewPage,
  }
}