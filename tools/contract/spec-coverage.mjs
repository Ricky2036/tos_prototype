#!/usr/bin/env node
/**
 * spec-coverage —— 设置页「页面清单 × 证据」G0 事实表
 * ====================================================
 * 回答一个问题：**哪些页面在真机证据里根本没有 spec？**（把「缺证据」变成可计算数字）
 *
 * 页面清单（product repo 为只读输入）：
 *   src/components/apps/settings/pages/*.js                  → settings/<文件名去 .js>
 *   src/components/apps/settings/system/subpages/*.vue       → settings/system/<kebab-case 文件名>
 *   src/components/apps/settings/dateTime/*.vue              → settings/dateTime/<kebab-case 文件名>
 *
 * spec 侧：<spec-root>/**\/*.geometry.json，pageId = 相对路径去后缀（如 settings/system）
 * dump 侧：repo/.local-evidence/** 与 repo/spec/captures/** 按 pageId 各级名字启发式匹配，
 *          并**在输出里标注 matched_by**（exact / dirname / heuristic / none），不装作精确。
 *
 * 输出列：pageId | source_file | dump | spec | nodes | unknowns | g8 | gap_reason
 * 退出码：任一页面无 spec → 3（可直接当门禁）；清单为空 → 2（不许 0/0 假绿）；全绿 → 0。
 *
 * 用法：
 *   node evidence-pipeline/tools/contract/spec-coverage.mjs \
 *     --repo /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh \
 *     --spec-root evidence-pipeline/fixtures/spec-batch-out \
 *     --json evidence-pipeline/reports/contract/coverage-system.json \
 *     --md   evidence-pipeline/reports/contract/coverage-system.md
 */
import fs from 'node:fs'
import path from 'node:path'
import { CANVAS, coeffFor, resolveSourcesPath } from './lib/coords.mjs'

const argv = process.argv.slice(2)
function arg(name, dflt = null) {
  const i = argv.indexOf(`--${name}`)
  if (i >= 0) return argv[i + 1]
  const inline = argv.find((a) => a.startsWith(`--${name}=`))
  return inline ? inline.slice(name.length + 3) : dflt
}
/** 可带值也可裸写的参数（裸写且后面不是路径 → 输出到 stdout） */
function optPath(name) {
  if (argv.includes(`--${name}`)) {
    const i = argv.indexOf(`--${name}`)
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      return { present: true, out: next }
    }
    return { present: true, out: null }
  }
  const inline = argv.find((a) => a.startsWith(`--${name}=`))
  return inline ? { present: true, out: inline.slice(name.length + 3) } : { present: false, out: null }
}

const repoArg = arg('repo')
const specRootArg = arg('spec-root')
const source = arg('source', 'infinix-1208')
const sourcesArg = arg('sources')
const jsonOpt = optPath('json')
const mdOpt = optPath('md')

if (!repoArg || !specRootArg) {
  console.error('用法：--repo <产品仓库> --spec-root <spec 根> [--json out] [--md out] [--source id] [--sources sources.json]')
  process.exit(2)
}
const repo = path.resolve(repoArg)
const specRoot = path.resolve(specRootArg)
if (!fs.existsSync(repo) || !fs.statSync(repo).isDirectory()) {
  console.error(`--repo 不是目录：${repo}`)
  process.exit(2)
}
if (!fs.existsSync(specRoot) || !fs.statSync(specRoot).isDirectory()) {
  console.error(`--spec-root 不是目录：${specRoot}`)
  process.exit(2)
}

let coeff = null
let coeffError = ''
try {
  coeff = coeffFor(source, { sourcesPath: sourcesArg ? path.resolve(sourcesArg) : undefined })
} catch (e) {
  coeffError = e.message
}
const sourcesPath = coeff ? resolveSourcesPath(sourcesArg ? path.resolve(sourcesArg) : null) : ''

const posix = (p) => p.split(path.sep).join('/')
const relRepo = (p) => posix(path.relative(repo, p))
const escapeMd = (s) => String(s).replace(/\|/g, '\\|')

/* ================= 1. 页面清单 ================= */
const SETTINGS = 'src/components/apps/settings'
const PAGE_DIRS = {
  'module-page': `${SETTINGS}/pages`,
  'system-subpage': `${SETTINGS}/system/subpages`,
  'dateTime-subpage': `${SETTINGS}/dateTime`,
}
const inventory = []
const missingDirs = []
const dirCounts = {}

function listDir(rel) {
  const abs = path.join(repo, rel)
  try {
    if (!fs.statSync(abs).isDirectory()) return null
  } catch {
    return null
  }
  return fs.readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
}

function kebab(name) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

/** 读 pages/*.js 声明的 route id（纯展示用，不影响 pageId 规则） */
function routeIdOf(relFile) {
  try {
    const src = fs.readFileSync(path.join(repo, relFile), 'utf8')
    const m = /id:\s*'([^']+)'/.exec(src)
    return m ? m[1] : null
  } catch {
    return null
  }
}

// pages/*.js → settings/<stem>（文件名口径，不是 route id：pages/system.js 的 route id 其实是 general）
const pageFiles = listDir(PAGE_DIRS['module-page'])
if (pageFiles === null) {
  missingDirs.push(PAGE_DIRS['module-page'])
} else {
  dirCounts['module-page'] = pageFiles.filter((f) => f.endsWith('.js')).length
  for (const f of pageFiles.filter((x) => x.endsWith('.js')).sort()) {
    const stem = f.slice(0, -3)
    const rel = `${PAGE_DIRS['module-page']}/${f}`
    inventory.push({
      pageId: `settings/${stem}`,
      sourceFile: rel,
      kind: 'module-page',
      routeId: routeIdOf(rel),
      moduleComponentOf: null,
    })
  }
}
// pages/*.js 指向的组件文件（用于标注「这个 vue 就是模块页组件本身」）
const moduleComponentFiles = new Map()
for (const page of inventory.filter((p) => p.kind === 'module-page')) {
  try {
    const src = fs.readFileSync(path.join(repo, page.sourceFile), 'utf8')
    const m = /import\(\s*'([^']+)'\s*\)/.exec(src)
    if (m) moduleComponentFiles.set(posix(path.normalize(`${SETTINGS}/${m[1]}`)), page.pageId)
  } catch { /* 忽略 */ }
}

for (const [kind, relDir] of Object.entries(PAGE_DIRS)) {
  if (kind === 'module-page') continue
  const files = listDir(relDir)
  if (files === null) {
    missingDirs.push(relDir)
    continue
  }
  dirCounts[kind] = files.filter((f) => f.endsWith('.vue')).length
  for (const f of files.filter((x) => x.endsWith('.vue')).sort()) {
    const stem = f.slice(0, -4)
    const rel = `${relDir}/${f}`
    const pageId = kind === 'system-subpage'
      ? `settings/system/${kebab(stem)}`
      : `settings/dateTime/${kebab(stem)}`
    inventory.push({
      pageId,
      sourceFile: rel,
      kind,
      routeId: null,
      moduleComponentOf: moduleComponentFiles.get(rel) || null,
    })
  }
}

const duplicates = []
const pageIdSeen = new Map()
for (const p of inventory) {
  if (pageIdSeen.has(p.pageId)) {
    duplicates.push({ pageId: p.pageId, files: [pageIdSeen.get(p.pageId).sourceFile, p.sourceFile] })
  } else pageIdSeen.set(p.pageId, p)
}
const pageList = [...pageIdSeen.values()].sort((a, b) =>
  a.pageId.localeCompare(b.pageId))
if (pageList.length === 0) {
  console.error(`FAIL · 页面清单为空：${repo} 下三个清单目录都没有页面文件。0/0 不算覆盖，按门禁红处理。`)
  for (const d of missingDirs) console.error(`  缺失目录：${d}`)
  process.exit(2)
}

/* ================= 2. spec 侧 ================= */
function walkFiles(dir, filter, acc = []) {
  let ents
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const ent of ents.sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walkFiles(p, filter, acc)
    else if (ent.isFile() && filter(ent.name)) acc.push(p)
  }
  return acc
}

const specs = new Map() // pageId → spec record
const variantSpecs = []
const specErrors = []
for (const file of walkFiles(specRoot, (n) => n.endsWith('.geometry.json'))) {
  const rel = posix(path.relative(specRoot, file))
  const pageId = rel.slice(0, -'.geometry.json'.length)
  const isVariant = path.posix.basename(pageId).includes('__')
  let doc = null
  let err = ''
  try {
    doc = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (e) {
    err = e.message
  }
  const rec = {
    pageId,
    rel,
    kind: isVariant ? 'variant' : 'principal',
    valid: !!doc && doc.schema_version === 1,
    schema_version: doc?.schema_version ?? null,
    screen: doc?.screen ?? null,
    source: doc?.source ?? null,
    from: doc?.from ?? null,
    nodes: Array.isArray(doc?.nodes) ? doc.nodes.length : 0,
    unknowns: Array.isArray(doc?.unknowns) ? doc.unknowns.length : 0,
    unknownKinds: Array.isArray(doc?.unknowns) ? doc.unknowns.map((u) => u?.kind).filter(Boolean) : [],
    a11yUnusable: Array.isArray(doc?.unknowns) && doc.unknowns.some((u) => u?.kind === 'a11y'),
    error: err,
  }
  if (!rec.valid) specErrors.push({ rel, pageId, reason: err || `schema_version=${rec.schema_version}（要求 1）` })
  if (isVariant) {
    const base = pageId.slice(0, pageId.lastIndexOf('__'))
    variantSpecs.push({ ...rec, base })
    continue
  }
  if (specs.has(pageId)) {
    specErrors.push({ rel, pageId, reason: `同一 pageId 出现多个 spec：${specs.get(pageId).rel} 与 ${rel}` })
    continue
  }
  specs.set(pageId, rec)
}

/* ================= 3. dump / 证据侧（启发式，标注 matched_by） ================= */
const EVIDENCE_ROOTS = ['.local-evidence', 'spec/captures']
const evidenceRootsPresent = []
const evidence = []
const KIND_BY_EXT = {
  xml: 'dump',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  md: 'note',
  txt: 'note',
}
for (const relDir of EVIDENCE_ROOTS) {
  const abs = path.join(repo, relDir)
  try {
    if (fs.statSync(abs).isDirectory()) evidenceRootsPresent.push(relDir)
    else continue
  } catch {
    continue
  }
  for (const file of walkFiles(abs, (n) => {
    const ext = path.extname(n).slice(1).toLowerCase()
    return KIND_BY_EXT[ext] !== undefined
  })) {
    const rel = relRepo(file)
    evidence.push({
      rel,
      kind: KIND_BY_EXT[path.extname(file).slice(1).toLowerCase()],
    })
  }
}

/** UI 通用词：不承担页面区分度（picker/list/options… 人人都有），匹配时剔除 */
const GENERIC_WORDS = new Set([
  'picker', 'list', 'options', 'option', 'settings', 'setting', 'input', 'page', 'root',
  'screen', 'sheet', 'dialog', 'view', 'sub', 'subpage', 'detail', 'edit', 'info',
  'status', 'main', 'home', 'default', 'device', 'traversal', 'web',
])
const ABBREV = {
  nav: 'navigation', sys: 'system', lang: 'language', dev: 'developer',
  opt: 'option', opts: 'options', btn: 'button', sched: 'schedule', serv: 'service',
  enh: 'enhanced', pwr: 'power', bkup: 'backup', dt: 'datetime', tz: 'timezone',
  acc: 'accessibility', access: 'accessibility', disp: 'display', notif: 'notification',
}
const tokensOf = (s) => {
  const out = []
  for (const raw of s.toLowerCase().split(/[^a-z0-9]+/)) {
    if (!raw) continue
    out.push(ABBREV[raw] || raw)
  }
  return out
}
const compact = (s) => tokensOf(s).join('')
/** 词级模糊相等：全等 / 缩写表归一后全等 / ≥4 字符前缀或包含（如 lang≈language、datetime⸮time） */
function tokenHit(a, b) {
  if (a === b) return true
  const na = ABBREV[a] || a
  const nb = ABBREV[b] || b
  if (na === nb) return true
  const min = Math.min(na.length, nb.length)
  return min >= 4 && (na.startsWith(nb) || nb.startsWith(na) || na.includes(nb) || nb.includes(na))
}
const sortedEvidence = evidence.slice().sort((a, b) => a.rel.localeCompare(b.rel))

function matchEvidence(pageId) {
  const segs = pageId.split('/')
  const last = segs[segs.length - 1]
  const parentTokens = tokensOf(segs.slice(0, -1).join('/'))
  const lastTokens = tokensOf(last)
  let distinctive = lastTokens.filter((t) => !parentTokens.includes(t) && !GENERIC_WORDS.has(t))
  if (distinctive.length === 0) distinctive = lastTokens.filter((t) => !GENERIC_WORDS.has(t))
  if (distinctive.length === 0) distinctive = lastTokens
  let best = null
  for (const ev of sortedEvidence) {
    const relNoExt = ev.rel.replace(/\.[a-z0-9]+$/i, '')
    const evTokens = tokensOf(relNoExt)
    const stem = path.posix.basename(relNoExt)
    const stemTokens = tokensOf(stem)
    const dirSegs = path.posix.dirname(relNoExt).split('/').filter((x) => x && x !== '.')
    let matchedBy = 'none'
    // exact：完整 pageId 路径后缀，或文件名 compact 与末级 compact 全等
    const tail = ev.rel.toLowerCase().replace(/\.[a-z0-9]+$/i, '').split('/').slice(-segs.length).join('/')
    if (tail === pageId.toLowerCase()) matchedBy = 'exact'
    else if (compact(stem) === compact(last)) matchedBy = 'exact'
    else if (dirSegs.some((d) => compact(d) === compact(last))) matchedBy = 'dirname'
    else if (compact(stem).startsWith(compact(last)) || compact(stem).endsWith(compact(last))) matchedBy = 'dirname'
    else {
      // heuristic 只认「特征词全部命中」：多级 pageId 的父级词（如 system）人人都有，
      // 拿它凑比例会把 power-button 的 dump 错配给 schedule-power。宁可 none，不可错配。
      const hits = distinctive.filter((t) => evTokens.some((e) => tokenHit(t, e))).length
      if (distinctive.length > 0 && hits === distinctive.length) matchedBy = 'heuristic'
    }
    if (matchedBy === 'none') continue
    const score = { exact: 3, dirname: 2, heuristic: 1 }[matchedBy]
    const kindScore = { dump: 3, image: 2, note: 1 }[ev.kind]
    // 排序：先看证据种类（xml dump > 截图 > 文本），再看匹配档位（exact > dirname > heuristic），最后取路径最短
    const better = !best ||
      kindScore > best.kindScore ||
      (kindScore === best.kindScore && score > best.score) ||
      (kindScore === best.kindScore && score === best.score && ev.rel.length < best.ev.rel.length)
    if (better) best = { ev, matchedBy, score, kindScore }
  }
  return best
}

/* ================= 4. 合成 ================= */
const rows = []
let withSpec = 0
let withEvidence = 0
let g8Count = 0
for (const page of pageList) {
  const spec = specs.get(page.pageId) || null
  const ev = matchEvidence(page.pageId)
  const g8 = !!(coeff && coeff.g8 && spec && spec.valid && spec.nodes > 0 && !spec.a11yUnusable)

  const reasons = []
  if (!spec) {
    reasons.push(ev
      ? `无 spec，仅有 ${ev.ev.kind} 证据（matched_by=${ev.matchedBy}）`
      : '无 spec，且未匹配到任何 dump/证据（G0 空白）')
  } else if (!spec.valid) {
    // 非法 spec 不算覆盖：宁可判缺，也不能拿坏文件判绿
    reasons.push(`无有效 spec（文件存在但非法：${spec.error}）`)
  } else {
    if (spec.nodes === 0 || spec.a11yUnusable) reasons.push('spec 为 0 节点 / a11y 不可用，禁止 G0/G8 判绿')
  }
  if (spec && !ev) reasons.push('有 spec 但未匹配到与 pageId 对应的 dump/证据（来源需人工核对）')
  if (ev && ev.matchedBy === 'heuristic') reasons.push('证据匹配为 heuristic，需人工确认对应关系')
  const gapReason = reasons.join('；')

  if (spec && spec.valid) withSpec += 1
  if (ev) withEvidence += 1
  if (g8) g8Count += 1
  rows.push({
    pageId: page.pageId,
    source_file: page.sourceFile,
    kind: page.kind,
    route_id: page.routeId,
    module_component_of: page.moduleComponentOf,
    dump: ev
      ? { path: ev.ev.rel, kind: ev.ev.kind, matched_by: ev.matchedBy }
      : { path: null, kind: null, matched_by: 'none' },
    spec: spec
      ? { path: spec.rel, valid: spec.valid, screen: spec.screen, source: spec.source, from: spec.from, nodes: spec.nodes, unknowns: spec.unknowns, a11y_unusable: spec.a11yUnusable }
      : null,
    nodes: spec ? spec.nodes : null,
    unknowns: spec ? spec.unknowns : null,
    g8,
    gap_reason: gapReason,
  })
}

const total = rows.length
const withoutSpec = total - withSpec
const orphans = [...specs.values()].filter((s) => !pageIdSeen.has(s.pageId)).map((s) => ({ pageId: s.pageId, path: s.rel, nodes: s.nodes }))

const doc = {
  schema_version: 1,
  kind: 'settings-evidence-coverage',
  generated_at: new Date().toISOString(),
  repo,
  spec_root: specRoot,
  source,
  sources: sourcesPath || null,
  source_error: coeffError || null,
  canvas: { w: CANVAS.w, h: CANVAS.h },
  device_px: coeff ? { w: coeff.w, h: coeff.h } : null,
  g8_source_eligible: coeff ? coeff.g8 : null,
  inventory: {
    dirs: PAGE_DIRS,
    counts: dirCounts,
    missing_dirs: missingDirs,
    duplicates,
    spec_without_inventory_page: orphans,
  },
  totals: {
    pages: total,
    with_spec: withSpec,
    without_spec: withoutSpec,
    with_evidence: withEvidence,
    without_evidence: total - withEvidence,
    g8_eligible_pages: g8Count,
    spec_nodes: rows.reduce((a, r) => a + (r.nodes || 0), 0),
    spec_unknowns: rows.reduce((a, r) => a + (r.unknowns || 0), 0),
  },
  exit_semantics: '任一页面无 spec → 3；清单为空 → 2；全绿 → 0',
  spec_errors: specErrors,
  spec_variants: variantSpecs,
  evidence_roots: evidenceRootsPresent,
  evidence_files: evidence.length,
  pages: rows,
}

/* ================= 5. 输出 ================= */
const pad = (s, w) => String(s).padEnd(w)
const table = [
  pad('pageId', 42) + ' ' + pad('source_file', 56) + ' ' + pad('dump', 58) + ' ' + pad('spec', 4) + ' ' +
  pad('nodes', 6) + ' ' + pad('unknowns', 9) + ' ' + pad('g8', 3) + ' gap_reason',
]
for (const r of rows) {
  const dump = r.dump.path ? `${r.dump.path} [${r.dump.matched_by}]` : `— [none]`
  table.push(
    pad(r.pageId, 42) + ' ' +
    pad(r.source_file, 56) + ' ' +
    pad(dump, 58) + ' ' +
    pad(r.spec && r.spec.valid ? '✓' : '✗', 4) + ' ' +
    pad(r.nodes ?? '—', 6) + ' ' +
    pad(r.unknowns ?? '—', 9) + ' ' +
    pad(r.g8 ? 'Y' : 'N', 3) + ' ' +
    r.gap_reason,
  )
}
console.log(table.join('\n'))
console.log('')
console.log(`settings 模块 ${total} 页：有 spec ${withSpec} 页 / 无 spec ${withoutSpec} 页；有 dump/证据 ${withEvidence} 页；可 G8 ${g8Count} 页`)
if (missingDirs.length) console.log(`WARN · 清单目录缺失：${missingDirs.join(', ')}（0 页来自该目录）`)
if (orphans.length) console.log(`NOTE · spec 存在但清单里没有的 pageId：${orphans.map((o) => o.pageId).join(', ')}`)
if (specErrors.length) console.log(`WARN · spec 异常：${specErrors.map((e) => `${e.pageId}(${e.reason})`).join('; ')}`)

function writeOut(opt, content, label) {
  if (!opt.present) return
  if (!opt.out) {
    process.stdout.write(content)
    return
  }
  const out = path.resolve(opt.out)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, content)
  console.log(`wrote ${label}: ${posix(path.relative(process.cwd(), out))}`)
}

if (jsonOpt.present) writeOut(jsonOpt, `${JSON.stringify(doc, null, 2)}\n`, 'json')

if (mdOpt.present) {
  const md = []
  md.push('# settings 证据覆盖矩阵（G0 事实表）')
  md.push('')
  md.push(`- 生成时间：${doc.generated_at}`)
  md.push(`- 产品仓库（只读）：\`${repo}\``)
  md.push(`- spec 根：\`${specRoot}\``)
  md.push(`- source：\`${source}\`${coeff ? ` · 设备像素 ${coeff.w}×${coeff.h} · 画布 ${CANVAS.w}×${CANVAS.h} · G8 ${coeff.g8 ? '可跑' : '不跑'}` : ` · source 解析失败（${coeffError}）`}`)
  md.push('')
  md.push(`## 结论`)
  md.push('')
  md.push(`**settings 模块 ${total} 页中，无 spec ${withoutSpec} 页**（有 spec ${withSpec} 页；有 dump/证据 ${withEvidence} 页；当前可 G8 ${g8Count} 页）。`)
  md.push('')
  md.push(`退出码语义：任一页面无 spec → 3（可当门禁）；页面清单为空 → 2（不许 0/0 假绿）；全绿 → 0。`)
  md.push('')
  md.push('## 覆盖矩阵')
  md.push('')
  md.push('| pageId | source_file | dump | spec | nodes | unknowns | g8 | gap_reason |')
  md.push('|---|---|---|---|---|---|---|---|')
  for (const r of rows) {
    const dump = r.dump.path ? `\`${escapeMd(r.dump.path)}\` [${r.dump.matched_by}]` : '— [none]'
    md.push(`| ${escapeMd(r.pageId)} | \`${escapeMd(r.source_file)}\` | ${dump} | ${r.spec && r.spec.valid ? '✓' : '✗'} | ${r.nodes ?? '—'} | ${r.unknowns ?? '—'} | ${r.g8 ? 'Y' : 'N'} | ${escapeMd(r.gap_reason)} |`)
  }
  md.push('')
  md.push('## 无 spec 页面（G0 空白清单）')
  md.push('')
  if (withoutSpec === 0) md.push('无。')
  else for (const r of rows.filter((x) => !(x.spec && x.spec.valid))) md.push(`- \`${r.pageId}\` ← \`${r.source_file}\`：${r.gap_reason}`)
  md.push('')
  md.push('## 结构性发现')
  md.push('')
  if (missingDirs.length) for (const d of missingDirs) md.push(`- 清单目录缺失：\`${d}\` —— 该来源 0 页，不代表没有页面，需人工确认仓库分支。`)
  if (duplicates.length) for (const d of duplicates) md.push(`- pageId 重复：\`${d.pageId}\` ← ${d.files.join(' / ')}`)
  for (const o of orphans) md.push(`- spec 存在但清单中没有对应页面：\`${o.pageId}\`（${o.path}，${o.nodes} 节点）`)
  for (const e of specErrors) md.push(`- spec 异常：\`${e.pageId}\` ← ${e.rel || ''} · ${e.reason}`)
  const moduleComponents = rows.filter((r) => r.module_component_of)
  for (const r of moduleComponents) md.push(`- pageId \`${r.pageId}\` 是模块页 \`${r.module_component_of}\` 的组件文件本身（按文件名口径仍是独立 pageId，两者共用同一份 spec）。`)
  if (coeffError) md.push(`- source 解析失败：${coeffError}`)
  md.push('')
  md.push('## 口径（不装作精确的部分）')
  md.push('')
  md.push('- 页面清单口径：`pages/*.js` 用**文件名去 .js**（不是文件内 route id，例如 `pages/system.js` 的 route id 实际是 `general`）；`system/subpages/*.vue` 与 `dateTime/*.vue` 用**文件名的 kebab-case**。')
  md.push('- spec 口径：只认 `<spec-root>/<pageId>.geometry.json`（pageId 含 `/` 时即嵌套目录）；`__变体` 后缀的同页多状态 spec 不计入覆盖。')
  md.push('- dump 证据口径：在 `.local-evidence/**` 与 `spec/captures/**` 里按 pageId 各级名字做启发式匹配，`matched_by` 明确分四档：')
  md.push('  - `exact`：证据相对路径的后缀就是完整 pageId，或文件名与 pageId 末级全等；')
  md.push('  - `dirname`：目录名与 pageId 末级全等，或文件名是「末级 + 状态后缀」；')
  md.push('  - `heuristic`：只做到词级模糊（首字母前缀≥4 / 少量缩写表归一），**必须人工确认**；')
  md.push('  - `none`：没有匹配到。')
  md.push('- 数字口径：`nodes/unknowns` 直接取 spec 文件；`g8=Y` 需 source 可跑 G8、spec 存在、节点数 > 0、且 unknowns 里没有 a11y 不可用标记。')
  md.push('')
  writeOut(mdOpt, `${md.join('\n')}\n`, 'md')
} else {
  // 未要求 md 时也给一句提示，避免报告无落点
}

console.error(`无 spec 页面 ${withoutSpec} / 共 ${total}`)
process.exit(withoutSpec > 0 ? 3 : 0)