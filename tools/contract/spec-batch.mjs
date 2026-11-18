#!/usr/bin/env node
/**
 * spec-batch —— 批量把 uiautomator dump 变成可比的 geometry spec
 * =================================================================
 * 产品仓库 `scripts/spec-gen.mjs` 只处理单个 --xml（所以 spec/ 一直是空的，
 * 也没人跑）。这里是「真机 dump → 机器可比契约」的批处理入口。
 *
 * 目录约定：
 *   <dump-root>/<pageId>/<随便什么>.xml        pageId 可含 '/'，如 settings/system
 *   <dump-root>/system.xml                     平铺 dump：用 --dump-map 指定 pageId
 *   --dump-map dump-map.json                    {"SET-DSH-01/system.xml":"settings/system"}
 *                                               value 可为数组，一份 dump 产出多页 spec
 *
 * 输出（--out 根目录下）：
 *   <pageId>.geometry.json                     每页的主 spec
 *   <pageId>__<变体>.geometry.json              同目录多个 dump 时，其余状态变体
 *
 * 一页 dump 只有满屏容器（a11y 树不可用）时**报错退出**，不产出空 spec —— 这正是
 * 「G0/G8 假绿」的入口，必须红。人工确认后仍要留档可加 --allow-empty。
 *
 * 用法：
 *   node evidence-pipeline/tools/contract/spec-batch.mjs \
 *     --dir /tmp/contract-dump-root --source infinix-1208 \
 *     --out evidence-pipeline/fixtures/spec-batch-out \
 *     --sources /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/pixel-refs/sources.json
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { CANVAS, coeffFor, resolveSourcesPath } from './lib/coords.mjs'
import { buildPageModel } from './lib/model.mjs'

const argv = process.argv.slice(2)
function arg(name, dflt = null) {
  const i = argv.indexOf(`--${name}`)
  if (i >= 0) return argv[i + 1]
  const inline = argv.find((a) => a.startsWith(`--${name}=`))
  return inline ? inline.slice(name.length + 3) : dflt
}
const flag = (name) => argv.includes(`--${name}`)

const dirArg = arg('dir')
const source = arg('source', 'infinix-1208')
const outArg = arg('out')
const dumpMapArg = arg('dump-map')
const sourcesArg = arg('sources')
const allowEmpty = flag('allow-empty')

if (!dirArg) {
  console.error('缺少 --dir <dump-root>（结构：<root>/<pageId>/xx.xml）')
  process.exit(2)
}
const dumpRoot = path.resolve(dirArg)
if (!fs.existsSync(dumpRoot) || !fs.statSync(dumpRoot).isDirectory()) {
  console.error(`--dir 不是目录：${dumpRoot}`)
  process.exit(2)
}

let coeff
try {
  coeff = coeffFor(source, { sourcesPath: sourcesArg ? path.resolve(sourcesArg) : undefined })
} catch (e) {
  console.error(`source 解析失败：${e.message}`)
  process.exit(2)
}
const sourcesPath = resolveSourcesPath(sourcesArg ? path.resolve(sourcesArg) : null)

/* ---------------- dump-map ---------------- */
let dumpMap = {}
if (dumpMapArg) {
  const p = path.resolve(dumpMapArg)
  try {
    dumpMap = JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (e) {
    console.error(`--dump-map 读取失败：${p} · ${e.message}`)
    process.exit(2)
  }
  for (const [k, v] of Object.entries(dumpMap)) {
    const vals = Array.isArray(v) ? v : [v]
    if (vals.length === 0 || vals.some((x) => typeof x !== 'string' || !x.trim())) {
      console.error(`--dump-map 条目非法：${k} → ${JSON.stringify(v)}`)
      process.exit(2)
    }
  }
}

/* ---------------- 收集 xml ---------------- */
const posix = (p) => p.split(path.sep).join('/')
function walkXml(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walkXml(p, acc)
    else if (ent.isFile() && /\.xml$/i.test(ent.name)) acc.push(p)
  }
  return acc
}
const xmlFiles = walkXml(dumpRoot)
if (xmlFiles.length === 0) {
  console.error(`--dir 下没有找到任何 .xml：${dumpRoot}`)
  process.exit(2)
}

/** 安全 pageId：非空、非绝对、不含 .. */
function assertPageId(id, from) {
  if (typeof id !== 'string' || !id.trim() || id.startsWith('/') || id.split('/').some((s) => s === '..' || s === '')) {
    throw new Error(`非法 pageId（来自 ${from}）：${JSON.stringify(id)}`)
  }
  return id
}

function resolvePageId(relFile) {
  const rawPage = posix(path.dirname(relFile)) === '.' ? null : posix(path.dirname(relFile))
  const stem = path.basename(relFile, path.extname(relFile))
  const candidates = [relFile, rawPage, rawPage ? path.posix.basename(rawPage) : null, stem].filter(Boolean)
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(dumpMap, key)) {
      const v = dumpMap[key]
      return Array.isArray(v) ? v.map((x) => assertPageId(x, key)) : [assertPageId(v, key)]
    }
  }
  return [assertPageId(rawPage || stem, relFile)]
}

/** 同一 page 的多个 dump：主状态优先 default / 与 pageId 同名，避免把 off/toggled 当主状态 */
function principalScore(stem, pageId) {
  const s = stem.toLowerCase()
  const last = pageId.split('/').pop().toLowerCase()
  let score = 0
  if (s === last) score += 100
  if (s.includes('default')) score += 50
  if (/(^|[-_])(home|root|main|initial|idle)([-_]|$)/.test(s)) score += 25
  if (/(off|toggled|scrolled|reenter|restored|changed|after|error)/.test(s)) score -= 30
  return score
}
const sanitize = (s) => s.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'variant'

/* ---------------- 分组 ---------------- */
const byPage = new Map()
for (const file of xmlFiles) {
  const relFile = posix(path.relative(dumpRoot, file))
  let pageIds
  try {
    pageIds = resolvePageId(relFile)
  } catch (e) {
    console.error(`spec-batch FAIL · ${relFile} · ${e.message}`)
    process.exit(3)
  }
  for (const pageId of pageIds) {
    if (!byPage.has(pageId)) byPage.set(pageId, [])
    byPage.get(pageId).push({ file, relFile })
  }
}
const pageIds = [...byPage.keys()].sort()

/* ---------------- 生成 ---------------- */
const outRoot = outArg ? path.resolve(outArg) : null
const pages = []
const failures = []
const totals = { xml_nodes: 0, headers: 0, rows: 0, groups: 0, toggles: 0, unknowns: 0 }
const generatedAt = new Date().toISOString()

for (const pageId of pageIds) {
  const entries = byPage.get(pageId)
  entries.sort((a, b) => {
    const sa = principalScore(path.basename(a.relFile, '.xml'), pageId)
    const sb = principalScore(path.basename(b.relFile, '.xml'), pageId)
    return sb - sa || a.relFile.localeCompare(b.relFile)
  })
  let wrote = 0
  for (const entry of entries) {
    const isPrincipal = wrote === 0
    const stem = path.basename(entry.relFile, path.extname(entry.relFile))
    const specRel = isPrincipal
      ? `${pageId}.geometry.json`
      : `${pageId}__${sanitize(stem)}.geometry.json`
    const xml = fs.readFileSync(entry.file, 'utf8')
    let model
    try {
      model = buildPageModel(xml, {
        source,
        screen: pageId,
        sourcesPath,
      })
    } catch (e) {
      const msg = `${pageId} ← ${entry.relFile}: ${e.message}`
      failures.push(msg)
      console.error(`spec-batch FAIL · ${msg}`)
      continue
    }
    const { nodes, unknowns, stats: s } = model
    const unusable = s.a11y_unusable || s.extractable === 0
    if (unusable && !allowEmpty) {
      const msg =
        `${pageId} ← ${entry.relFile}: a11y 树不可用（${s.xml_nodes} 个 node / 可提取 ${s.extractable}）` +
        ` —— 满屏容器页不得产出空 spec（确认后加 --allow-empty）`
      failures.push(msg)
      console.error(`spec-batch FAIL · ${msg}`)
      continue
    }
    if (unusable) {
      unknowns.push({
        kind: 'a11y',
        element: 'page',
        reason: '--allow-empty 强制生成：a11y 树只有满屏容器，本 spec 节点数为 0，不得用于 G0/G8 判绿',
      })
    }
    const doc = {
      schema_version: 1,
      screen: pageId,
      source,
      canvas: { w: CANVAS.w, h: CANVAS.h },
      device_px: s.device_px,
      from: entry.relFile,
      xml_sha256: crypto.createHash('sha256').update(xml).digest('hex'),
      generated_at: generatedAt,
      nodes,
      unknowns,
    }
    if (outRoot) {
      const outPath = path.join(outRoot, specRel)
      fs.mkdirSync(path.dirname(outPath), { recursive: true })
      fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`)
    }
    wrote += 1
    totals.xml_nodes += s.xml_nodes
    totals.headers += s.headers
    totals.rows += s.rows
    totals.groups += s.groups
    totals.toggles += s.toggles
    totals.unknowns += unknowns.length
    const relOut = outRoot ? specRel : '(stdout/未写)'
    console.log(
      `[ok] ${pageId}${isPrincipal ? '' : ` (variant ${sanitize(stem)})`} ` +
      `xml_nodes=${s.xml_nodes} headers=${s.headers} rows=${s.rows} groups=${s.groups} ` +
      `toggles=${s.toggles} nodes=${nodes.length} unknowns=${unknowns.length} from=${entry.relFile} out=${relOut}`,
    )
    pages.push({
      pageId,
      variant: isPrincipal ? null : sanitize(stem),
      from: entry.relFile,
      out: relOut,
      xml_nodes: s.xml_nodes,
      headers: s.headers,
      rows: s.rows,
      groups: s.groups,
      toggles: s.toggles,
      nodes: nodes.length,
      unknowns: unknowns.length,
      anisotropic: s.anisotropic,
    })
  }
}

const summary = {
  ok: failures.length === 0,
  dir: dumpRoot,
  out: outRoot,
  source,
  sources: sourcesPath,
  canvas: { w: CANVAS.w, h: CANVAS.h },
  device_px: { w: coeff.w, h: coeff.h },
  kx: Number(coeff.kx.toFixed(6)),
  ky: Number(coeff.ky.toFixed(6)),
  anisotropic: coeff.anisotropic,
  g8_eligible: coeff.g8,
  xml_files: xmlFiles.length,
  pages: pageIds.length,
  specs: pages.length,
  totals,
  failed: failures,
  results: pages,
}
console.log(JSON.stringify(summary, null, 2))
process.exit(failures.length === 0 ? 0 : 3)