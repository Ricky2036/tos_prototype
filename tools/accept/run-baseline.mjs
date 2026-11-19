#!/usr/bin/env node
/**
 * run-baseline.mjs —— 全页面契约验收基线（13 页一轮跑完，产出一张「哪页哪节点不达标」的清单）
 * ==========================================================================================
 * 做三件事：
 *   1. 读 spec/**\/*.geometry.json（pageId = spec.screen）+ spec/page-paths.json（进入路径 / 作用域）
 *   2. 逐页 spawn `node tools/accept/accept.mjs ...`（真判决，不改容差、不改 spec、不跳页）
 *   3. 汇总 reports/accept/baseline/summary.json + summary.md
 *
 * 用法：
 *   node tools/accept/run-baseline.mjs \
 *     [--url http://127.0.0.1:7812/] [--build-dir /tmp/dist-head] \
 *     [--out reports/accept/baseline] [--only settings/system] [--timeout 180000]
 *
 * 环境错误（导航进不去 / 服务没起 / 构建不匹配）只把该页标 env-error 并写清卡点，
 * **不中断整轮**；判决失败（exit 1）同样继续跑下一页。
 *
 * 退出码：0 = 13 页全 pass；1 = 有页 fail；2 = 有页环境错误（优先报告）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile, execFileSync } from 'node:child_process'
import { promisify } from 'node:util'

const execFileP = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(__dirname, '../..')
const SPEC_DIR = path.join(REPO, 'spec')
const PATHS_FILE = path.join(SPEC_DIR, 'page-paths.json')
const ACCEPT = path.join(REPO, 'tools/accept/accept.mjs')

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const val = i + 1 < argv.length && !argv[i + 1].startsWith('--') ? argv[++i] : true
    out[key] = val
  }
  return out
}

/** 收集 spec 下所有契约文件（只认 *.geometry.json；pageId 以 spec.screen 为准） */
function collectSpecs() {
  const found = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'captures') continue
        walk(p)
      } else if (entry.name.endsWith('.geometry.json')) {
        found.push(p)
      }
    }
  }
  walk(SPEC_DIR)
  return found.sort()
}

function gitInfo() {
  try {
    return {
      head: execFileSync('git', ['-C', REPO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      branch: execFileSync('git', ['-C', REPO, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim(),
    }
  } catch {
    return { head: null, branch: null }
  }
}

function slugOf(pageId) {
  return pageId.replace(/[\\/]+/g, '-').replace(/[^a-zA-Z0-9._-]+/g, '_')
}

/** 从 accept 的 stderr 里抽「真正卡在哪」：accept env-error 那一行 + 其后的 message 行（去掉 stack） */
function extractEnvError(stderr) {
  if (!stderr) return '（accept 没有输出 stderr）'
  const lines = stderr.split('\n')
  const idx = lines.findIndex((l) => l.includes('accept env-error:'))
  const slice = idx >= 0 ? lines.slice(idx) : lines.slice(-12)
  const msg = []
  for (const l of slice) {
    if (/^\s+at .+:\d+:\d+/.test(l)) break
    msg.push(l.replace(/^accept env-error:\s*/, '').trim())
  }
  const text = msg.filter(Boolean).join(' ').trim()
  return text || slice.join(' ').trim().slice(0, 1200)
}

function reasonOf(row) {
  return row.reason || row.status || 'unknown'
}

function round01(v) {
  return typeof v === 'number' && Number.isFinite(v) ? +v.toFixed(1) : null
}

function topReasons(verdict) {
  const counts = new Map()
  const bump = (k) => counts.set(k, (counts.get(k) || 0) + 1)
  for (const row of verdict.nodes || []) {
    if (row.status === 'fail' || row.status === 'missing') bump(reasonOf(row))
  }
  for (const _ of verdict.extras || []) bump('extra:unmatched-row')
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason, count]) => ({ reason, count }))
}

function worstFailNodes(verdict, limit = 3) {
  return (verdict.nodes || [])
    .filter((r) => r.status === 'fail' && r.worst != null)
    .sort((a, b) => b.worst - a.worst)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      role: r.role,
      worst: r.worst,
      tol: r.tol,
      delta: r.delta,
      reason: reasonOf(r),
    }))
}

async function runOne({ pageId, specPath, entry, url, buildDir, outRoot, timeoutMs }) {
  const slug = slugOf(pageId)
  const outDir = path.join(outRoot, slug)
  // 只清自己职责范围（outRoot 下该页目录），保证 verdict 不是上一轮残留
  if (outDir.startsWith(outRoot + path.sep) && fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true })
  }
  fs.mkdirSync(outDir, { recursive: true })

  const args = [
    ACCEPT,
    '--spec', specPath,
    '--url', url,
    '--page', pageId,
    '--recipe', path.join(REPO, entry.recipe || 'tools/accept/recipes/by-text-path.mjs'),
    '--build-dir', buildDir,
    '--out', outDir,
  ]
  if (entry.listMetrics) args.push('--list-metrics', path.resolve(REPO, entry.listMetrics))

  const env = {
    ...process.env,
    OPEN_PATH: JSON.stringify(entry.openPath || []),
    SCOPE: entry.scope || '',
  }

  const started = Date.now()
  let exitCode = null
  let stdout = ''
  let stderr = ''
  let timedOut = false
  try {
    const res = await execFileP(process.execPath, args, { cwd: REPO, env, timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 })
    stdout = res.stdout || ''
    stderr = res.stderr || ''
    exitCode = 0
  } catch (err) {
    stdout = err.stdout || ''
    stderr = err.stderr || ''
    timedOut = err.killed === true
    exitCode = typeof err.code === 'number' ? err.code : 2
  }
  const durationMs = Date.now() - started

  const verdictPath = path.join(outDir, 'verdict.json')
  const reportPath = path.join(outDir, 'report.md')
  const hasVerdict = fs.existsSync(verdictPath)
  let verdict = null
  if (hasVerdict) {
    try {
      verdict = JSON.parse(fs.readFileSync(verdictPath, 'utf8'))
    } catch {
      verdict = null
    }
  }

  let status
  if (exitCode === 2 || (!verdict && exitCode !== 0 && exitCode !== 1 && exitCode !== 4) || !verdict) {
    status = 'env-error'
  } else if (verdict.verdict) {
    status = verdict.verdict
  } else {
    status = exitCode === 0 ? 'pass' : 'fail'
  }

  const record = {
    pageId,
    slug,
    specPath: path.relative(REPO, specPath),
    status,
    exitCode,
    timedOut,
    durationMs,
    outDir: path.relative(REPO, outDir),
    verdictPath: hasVerdict ? path.relative(REPO, verdictPath) : null,
    reportPath: fs.existsSync(reportPath) ? path.relative(REPO, reportPath) : null,
    listMetrics: entry.listMetrics ? path.resolve(REPO, entry.listMetrics) : null,
    scope: entry.scope || null,
    openPath: entry.openPath || [],
    notes: entry.notes || null,
    command: {
      bin: process.execPath,
      args,
      env: { OPEN_PATH: env.OPEN_PATH, SCOPE: env.SCOPE },
    },
  }

  if (status === 'env-error') {
    record.envError = timedOut ? `accept 超时（>${timeoutMs}ms）被杀，未产出 verdict` : extractEnvError(stderr)
    record.stderrTail = stderr.slice(-4000)
    const md = [
      `# env-error · ${pageId}`,
      '',
      `- 结论：**环境错误（未产出判决）**，不是产品 fail。`,
      `- 卡点：${record.envError}`,
      `- spec：\`${record.specPath}\``,
      `- 时间：${new Date().toISOString()}`,
      '',
      '## 复现命令',
      '```bash',
      `OPEN_PATH='${env.OPEN_PATH}' SCOPE='${env.SCOPE}' \\`,
      `${process.execPath} ${args.map((a) => (/[\s"']/.test(a) ? JSON.stringify(a) : a)).join(' ')}`,
      '```',
      '',
      '## accept stderr（尾 4000 字符）',
      '```',
      record.stderrTail,
      '```',
      '',
    ].join('\n')
    fs.writeFileSync(path.join(outDir, 'env-error.md'), md)
    record.envErrorPath = path.relative(REPO, path.join(outDir, 'env-error.md'))
  } else {
    const summary = verdict.summary || {}
    record.scale = verdict.scale != null ? verdict.scale : null
    record.shell = verdict.shell_rect || null
    record.summary = {
      totalSpec: summary.totalSpec ?? null,
      matched: summary.matched ?? null,
      pass: summary.pass ?? null,
      fail: summary.fail ?? null,
      missing: summary.missing ?? null,
      extra: summary.extra ?? null,
      skipped: summary.skipped ?? null,
      matchRate: summary.matchRate ?? null,
    }
    record.topReasons = topReasons(verdict)
    record.worstFailNodes = worstFailNodes(verdict)
    record.missingIds = (verdict.nodes || []).filter((r) => r.status === 'missing').map((r) => r.id)
    record.failIds = (verdict.nodes || []).filter((r) => r.status === 'fail').map((r) => r.id)
    record.extraTexts = (verdict.extras || []).map((e) => e.text || e.id).slice(0, 20)
    record.pitch = verdict.pitch ? { pass: verdict.pitch.pass, first: verdict.pitch.first } : null
    record.buildHash = verdict.build && verdict.build.hash ? verdict.build.hash : null
    record.commitInVerdict = verdict.commit || null
  }
  return record
}

function scaleAnomalies(records) {
  const out = []
  for (const r of records) {
    if (r.status === 'env-error') continue
    const width = r.shell ? r.shell.width : null
    const scale = r.scale
    if (width == null || scale == null) continue
    if (Math.abs(width - 360) > 0.5 || Math.abs(scale - 1) > 0.0015) {
      out.push({ pageId: r.pageId, shellWidth: width, scale, note: '壳宽不在 360 附近（scale = 壳宽/360）' })
    }
  }
  return out
}

function fmtDelta(d) {
  if (!d) return '—'
  const f = (v) => (v > 0 ? `+${v}` : `${v}`)
  return `Δ(${f(d.dx)},${f(d.dy)},${f(d.dw)},${f(d.dh)})`
}

function fmtSigned(v) {
  if (v == null || !Number.isFinite(v)) return '—'
  return v > 0 ? `+${v}` : `${v}`
}

function renderMarkdown({ meta, records, totals, anomalies, outRoot }) {
  // summary.md 里的链接按「summary.md 所在目录」解析，label 仍用仓库相对路径
  const relLink = (p) => (p ? path.relative(outRoot, path.resolve(REPO, p)) : '')
  const lines = []
  lines.push(`# 全页面契约验收基线（${meta.specCount} 页）`)
  lines.push('')
  lines.push(`- 生成时间：${meta.generatedAt}`)
  lines.push(`- 仓库：\`${meta.repo}\` · 分支 \`${meta.branch}\` · HEAD \`${meta.head}\``)
  lines.push(`- 构建：\`${meta.buildDir}\`${meta.buildHash ? ` · hash \`${meta.buildHash.slice(0, 16)}…\`` : ''}`)
  lines.push(`- 服务：\`${meta.url}\``)
  lines.push(`- 判决：\`tools/accept/accept.mjs\`（容差未放宽；spec 未改；${meta.specCount} 页全跑，不跳页）`)
  lines.push('')
  lines.push('## 一行结论')
  lines.push('')
  lines.push(
    `**${totals.pages} 页里 ${totals.passPages} 页 0 fail / ${totals.failPages} 页有 fail / ${totals.envErrorPages} 页环境错误**` +
      (totals.envErrorPages ? '（环境错误不计入产品失败，原因见下方逐页卡点）' : '')
  )
  lines.push('')
  lines.push('## 逐页判决')
  lines.push('')
  lines.push('| # | pageId | 节点数 | pass | fail | missing | extra | 主要失败原因 top3 | scale | 状态 | verdict |')
  lines.push('|---|--------|-------:|-----:|-----:|--------:|------:|------------------|------:|--------|---------|')
  records.forEach((r, i) => {
    if (r.status === 'env-error') {
      lines.push(`| ${i + 1} | \`${r.pageId}\` | — | — | — | — | — | 环境错误：${escapeCell(r.envError).slice(0, 80)} | — | **env-error** | ${r.envErrorPath ? `[\`${r.envErrorPath}\`](${relLink(r.envErrorPath)})` : '—'} |`)
      return
    }
    const s = r.summary || {}
    const reasons = (r.topReasons || []).map((x) => `${x.reason}×${x.count}`).join('；') || '—'
    lines.push(
      `| ${i + 1} | \`${r.pageId}\` | ${s.totalSpec ?? '—'} | ${s.pass ?? '—'} | ${s.fail ?? '—'} | ${s.missing ?? '—'} | ${s.extra ?? '—'} | ${escapeCell(reasons) || '—'} | ${r.scale != null ? Number(r.scale).toFixed(4) : '—'} | ${r.status === 'pass' ? '**pass**' : `**${r.status}**`} | [\`${r.verdictPath}\`](${relLink(r.verdictPath)}) |`
    )
  })
  lines.push('')
  lines.push('## scale（壳宽 360 → 画布换算）')
  lines.push('')
  lines.push('| pageId | shell 宽×高 | scale | 判定 |')
  lines.push('|--------|-------------|------:|------|')
  for (const r of records) {
    if (r.status === 'env-error') {
      lines.push(`| \`${r.pageId}\` | — | — | 未测量（env-error） |`)
      continue
    }
    const sh = r.shell || {}
    const bad = anomalies.some((a) => a.pageId === r.pageId)
    lines.push(`| \`${r.pageId}\` | ${sh.width}×${sh.height} | ${r.scale != null ? Number(r.scale).toFixed(4) : '—'} | ${bad ? '**异常：壳宽不在 360 附近**' : '正常'} |`)
  }
  lines.push('')
  lines.push(
    anomalies.length
      ? `**scale 异常页（${anomalies.length}）：** ${anomalies.map((a) => `\`${a.pageId}\`（宽 ${a.shellWidth}，scale ${a.scale}）`).join('、')}`
      : `**scale 全部正常：** ${meta.specCount} 页壳宽均为 360，scale = 1.0000。`
  )
  lines.push('')
  lines.push('## 跨页信号（纯统计，不解释）')
  lines.push('')
  const sig = meta.signals
  if (!sig) {
    lines.push('无可判决页面。')
  } else {
    lines.push(`- 判决节点合计：${sig.judgedNodes}（pass ${totals.passNodes} / fail ${totals.failNodes} / missing ${totals.missingNodes}）；额外行 extra 合计 ${totals.extraRows}`)
    lines.push(`- 失败原因分布：${sig.reasons.map((x) => `${x.reason}×${x.count}`).join('；') || '无'}`)
    const repeated = sig.repeatedFailNodes.filter((x) => x.pageCount >= 2).slice(0, 6)
    if (repeated.length) {
      lines.push('- 多页同时红的节点（≥2 页，前 6）：')
      for (const x of repeated) {
        const dy = x.dyRange ? `，Δy ${fmtSigned(x.dyRange[0])}~${fmtSigned(x.dyRange[1])}` : ''
        const pageTxt = x.pageCount > 4 ? `${x.pages.slice(0, 3).map((p) => `\`${p}\``).join('、')} 等` : x.pages.map((p) => `\`${p}\``).join('、')
        lines.push(`  - \`${x.id}\`（${x.role}）${x.pageCount} 页：${pageTxt}${dy}`)
      }
    }
  }
  lines.push('')
  lines.push('## 导航 / 契约探测备注（来自 `spec/page-paths.json`，实测发现，不改 spec）')
  lines.push('')
  const noted = records.filter((r) => r.notes)
  if (!noted.length) {
    lines.push('无。')
  } else {
    for (const r of noted) lines.push(`- \`${r.pageId}\`：${r.notes}`)
  }
  lines.push('')
  lines.push('## 失败明细（仅列有 fail / missing / extra 的页）')
  lines.push('')
  const bad = records.filter((r) => r.status !== 'pass' && r.status !== 'env-error')
  if (!bad.length) {
    lines.push('无：所有可判决页面均 0 fail / 0 missing / 0 extra。')
  } else {
    for (const r of bad) {
      lines.push(`### \`${r.pageId}\` — ${r.status}`)
      lines.push('')
      lines.push(`- 判决：pass ${r.summary.pass} / fail ${r.summary.fail} / missing ${r.summary.missing} / extra ${r.summary.extra}（节点 ${r.summary.totalSpec}，matchRate ${r.summary.matchRate}）`)
      lines.push(`- 产物：[\`${r.verdictPath}\`](${relLink(r.verdictPath)}) · [\`${r.reportPath}\`](${relLink(r.reportPath)})`)
      if (r.notes) lines.push(`- 路径备注：${r.notes}`)
      if (r.worstFailNodes && r.worstFailNodes.length) {
        lines.push(`- 最差几何节点（按 |worst| 降序）：`)
        for (const n of r.worstFailNodes) {
          lines.push(`  - \`${n.id}\`（${n.role}）worst=${n.worst} > tol=${n.tol} ${fmtDelta(n.delta)} · ${n.reason}`)
        }
      }
      if (r.failIds && r.failIds.length) lines.push(`- fail 节点（${r.failIds.length}）：${r.failIds.slice(0, 12).map((x) => `\`${x}\``).join('、')}${r.failIds.length > 12 ? ' …' : ''}`)
      if (r.missingIds && r.missingIds.length) lines.push(`- missing 节点（${r.missingIds.length}）：${r.missingIds.slice(0, 12).map((x) => `\`${x}\``).join('、')}${r.missingIds.length > 12 ? ' …' : ''}`)
      if (r.extraTexts && r.extraTexts.length) lines.push(`- extra 行（${r.extraTexts.length}）：${r.extraTexts.slice(0, 8).map((x) => `「${x}」`).join('、')}${r.extraTexts.length > 8 ? ' …' : ''}`)
      if (r.pitch) lines.push(`- 行距口径（list-metrics）：${r.pitch.pass ? 'pass' : 'fail'}${r.pitch.first ? `（首行 Δ${r.pitch.first.delta}）` : ''}`)
      lines.push('')
    }
  }
  lines.push('## 环境错误（导航/服务/构建绑定问题，不是产品 fail）')
  lines.push('')
  const envBad = records.filter((r) => r.status === 'env-error')
  if (!envBad.length) {
    lines.push('无。')
  } else {
    for (const r of envBad) {
      lines.push(`- \`${r.pageId}\`：${r.envError}`)
      if (r.envErrorPath) lines.push(`  - 详情：[\`${r.envErrorPath}\`](${relLink(r.envErrorPath)})`)
    }
  }
  lines.push('')
  lines.push('## 复现')
  lines.push('')
  lines.push('```bash')
  lines.push(`# 1) 静态服务（产物构建）`)
  lines.push(`python3 -m http.server 7812 --bind 127.0.0.1 --directory ${meta.buildDir}`)
  lines.push('# 2) 一轮全跑')
  lines.push(`node tools/accept/run-baseline.mjs --url ${meta.url} --build-dir ${meta.buildDir}`)
  lines.push('```')
  lines.push('')
  lines.push('> 口径说明：判决容差沿用 `tools/accept/lib/diff.mjs`（row/group/header ±1.5px，line/divider/border/icon ±0.5px，text 只记录不判）；本轮未改任何 spec、未放宽容差、未跳过页面。进入路径见 `spec/page-paths.json`。')
  lines.push('')
  return lines.join('\n')
}

/** 跨页信号：只做统计，不做解释（哪些节点在多数页一起红、竖向偏差分布） */
function crossPageSignals(records) {
  const byId = new Map()
  const reasons = new Map()
  let nodes = 0
  for (const r of records) {
    if (r.status === 'env-error' || !r.verdictPath) continue
    let v
    try {
      v = JSON.parse(fs.readFileSync(path.join(REPO, r.verdictPath), 'utf8'))
    } catch {
      continue
    }
    nodes += (v.nodes || []).length
    for (const n of v.nodes || []) {
      if (n.status === 'pass') continue
      const reason = n.reason || n.status
      reasons.set(reason, (reasons.get(reason) || 0) + 1)
      const cur = byId.get(n.id) || { id: n.id, role: n.role, pages: [], dys: [], worst: 0 }
      cur.pages.push(r.pageId)
      if (n.delta && Number.isFinite(n.delta.dy)) cur.dys.push(n.delta.dy)
      if (Number.isFinite(n.worst)) cur.worst = Math.max(cur.worst, n.worst)
      byId.set(n.id, cur)
    }
  }
  const multi = [...byId.values()]
    .filter((x) => x.pages.length >= 2)
    .sort((a, b) => b.pages.length - a.pages.length)
    .slice(0, 12)
    .map((x) => ({
      id: x.id,
      role: x.role,
      pageCount: x.pages.length,
      pages: x.pages,
      dyRange: x.dys.length ? [Math.min(...x.dys), Math.max(...x.dys)] : null,
      worst: x.worst,
    }))
  return {
    judgedNodes: nodes,
    reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).map(([reason, count]) => ({ reason, count })),
    repeatedFailNodes: multi,
  }
}

function escapeCell(s) {
  return String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const url = String(args.url || 'http://127.0.0.1:7812/')
  const buildDir = path.resolve(String(args['build-dir'] || args.buildDir || '/tmp/dist-head'))
  const outRoot = path.resolve(REPO, String(args.out || 'reports/accept/baseline'))
  const timeoutMs = Number(args.timeout || 180000)
  const only = args.only ? String(args.only) : null

  if (!fs.existsSync(ACCEPT)) throw new Error(`找不到 accept.mjs：${ACCEPT}`)
  if (!fs.existsSync(buildDir)) throw new Error(`构建目录不存在：${buildDir}（先构建 HEAD 到该目录）`)
  const pathsConfig = JSON.parse(fs.readFileSync(PATHS_FILE, 'utf8'))
  const pageEntries = pathsConfig.pages || {}
  const recipe = pathsConfig.recipe || 'tools/accept/recipes/by-text-path.mjs'

  fs.mkdirSync(outRoot, { recursive: true })

  // 服务可达性（不可达 = 整轮 env-error，别把 13 页都跑成超时）
  let serverOk = true
  let serverReason = null
  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (err) {
    serverOk = false
    serverReason = `静态服务不可达：${url}（${err.message}）。先启动：python3 -m http.server 7812 --bind 127.0.0.1 --directory ${buildDir}`
  }

  const specs = collectSpecs().filter((p) => {
    const screen = JSON.parse(fs.readFileSync(p, 'utf8')).screen
    return !only || screen === only
  })
  const git = gitInfo()
  const meta = {
    generatedAt: new Date().toISOString(),
    repo: REPO,
    branch: git.branch,
    head: git.head,
    buildDir,
    url,
    accept: path.relative(REPO, ACCEPT),
    recipe,
    specCount: specs.length,
    timeoutMs,
  }

  const records = []
  for (const specPath of specs) {
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))
    const pageId = spec.screen
    const entry = pageEntries[pageId] || {}
    const hasPath = Boolean(entry && entry.openPath)
    let record
    if (!serverOk) {
      record = {
        pageId,
        slug: slugOf(pageId),
        specPath: path.relative(REPO, specPath),
        status: 'env-error',
        envError: serverReason,
        openPath: entry.openPath || [],
        scope: entry.scope || null,
        notes: entry.notes || null,
      }
    } else if (!hasPath) {
      record = {
        pageId,
        slug: slugOf(pageId),
        specPath: path.relative(REPO, specPath),
        status: 'env-error',
        envError: `spec/page-paths.json 缺少 pageId=${JSON.stringify(pageId)} 的导航路径（openPath），无法进入该页`,
        openPath: [],
        scope: null,
        notes: null,
      }
      const dir = path.join(outRoot, slugOf(pageId))
      fs.mkdirSync(dir, { recursive: true })
      record.envErrorPath = path.relative(REPO, path.join(dir, 'env-error.md'))
      fs.writeFileSync(path.join(dir, 'env-error.md'), `# env-error · ${pageId}\n\n- ${record.envError}\n`)
    } else {
      process.stderr.write(`[baseline] ${pageId} … `)
      record = await runOne({ pageId, specPath, entry: { ...entry, recipe: pageEntries[pageId]?.recipe || recipe }, url, buildDir, outRoot, timeoutMs })
      process.stderr.write(
        `${record.status} (pass=${record.summary?.pass ?? '-'} fail=${record.summary?.fail ?? '-'} missing=${record.summary?.missing ?? '-'} extra=${record.summary?.extra ?? '-'})\n`
      )
    }
    records.push(record)
  }

  const totals = {
    pages: records.length,
    passPages: records.filter((r) => r.status === 'pass').length,
    failPages: records.filter((r) => r.status !== 'pass' && r.status !== 'env-error').length,
    envErrorPages: records.filter((r) => r.status === 'env-error').length,
    pagesWithZeroFail: records.filter((r) => r.status !== 'env-error' && r.summary && r.summary.fail === 0 && r.summary.missing === 0 && r.summary.extra === 0).length,
  }
  totals.failCount = records.filter((r) => r.status === 'fail').length
  const judged = records.filter((r) => r.status !== 'env-error' && r.summary)
  totals.passNodes = judged.reduce((n, r) => n + (r.summary.pass || 0), 0)
  totals.failNodes = judged.reduce((n, r) => n + (r.summary.fail || 0), 0)
  totals.missingNodes = judged.reduce((n, r) => n + (r.summary.missing || 0), 0)
  totals.extraRows = judged.reduce((n, r) => n + (r.summary.extra || 0), 0)
  const signals = crossPageSignals(records)
  meta.signals = signals
  const anomalies = scaleAnomalies(records)
  const buildHashes = [...new Set(records.map((r) => r.buildHash).filter(Boolean))]

  const summary = {
    schema_version: 1,
    generated_at: meta.generatedAt,
    meta,
    build_hashes: buildHashes,
    conclusion: `${totals.pages} 页里 ${totals.passPages} 页 0 fail / ${totals.failPages} 页有 fail / ${totals.envErrorPages} 页环境错误`,
    totals,
    cross_page_signals: signals,
    scale_anomalies: anomalies,
    pages: records,
  }
  const summaryMd = renderMarkdown({ meta, records, totals, anomalies, outRoot })
  fs.writeFileSync(path.join(outRoot, 'summary.json'), JSON.stringify(summary, null, 2) + '\n')
  fs.writeFileSync(path.join(outRoot, 'summary.md'), summaryMd)

  process.stderr.write(`\n[baseline] ${summary.conclusion}\n`)
  process.stderr.write(`[baseline] -> ${path.relative(REPO, path.join(outRoot, 'summary.json'))}\n`)
  process.stderr.write(`[baseline] -> ${path.relative(REPO, path.join(outRoot, 'summary.md'))}\n`)

  if (totals.envErrorPages > 0) process.exitCode = 2
  else if (totals.failPages > 0) process.exitCode = 1
  else process.exitCode = 0
}

main().catch((err) => {
  console.error(`run-baseline 失败：${err && err.stack ? err.stack : err}`)
  process.exitCode = 2
})