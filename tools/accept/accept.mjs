#!/usr/bin/env node
/**
 * accept.mjs —— 验收层 CLI：渲染结果（DOM 实测）vs 真机契约（spec）→ 判决书
 * ==========================================================================
 * 用法：
 *   node tools/accept/accept.mjs \
 *     --spec fixtures/spec/settings-system.geometry.json \
 *     --url  http://127.0.0.1:7803/ \
 *     --page settings/system \
 *     --recipe tools/accept/recipes/settings-system.mjs \
 *     --build-dir /tmp/dist-0c945b6 \
 *     --out  reports/accept/buggy \
 *     [--ref-shot <真机截图.png>] [--shell .screen-view] [--scope <selector>] \
 *     [--min-match 0.9] [--json] [--commit <sha>] [--repo <path>] \
 *     [--viewport 1600x1400] [--dsf 2]
 *
 * 硬化（审计 P0-4）：
 *   --build-dir 必填。verdict.build = {hash, entry, files} 是「index.html +
 *   assets/**\/*.js + 全部 *.css」的内容树哈希；accept 还会校验 --url 实际服出来的
 *   入口文档/入口 JS/CSS 与 --build-dir 一致，不一致直接环境错误（exit 2）。
 *   证据因此绑定到「某一构建产物」，而不是任意 URL + 任意 --commit。
 *
 * 产物（out/）：
 *   verdict.json       机器可读判决（schema_version/page/spec_sha256/commit/build/
 *                      shell_rect/recipe_sha256/scale/summary/nodes/extras）
 *   report.md          逐节点表格 + missing/extra + 合计 + 复现命令
 *   actual.png         本轮渲染截图（容器元素截图）
 *   side-by-side.html / side-by-side.png  左右并排（给了 --ref-shot 才有）
 *
 * 退出码：0 = 通过；1 = 有 fail/missing/extra；2 = 环境错误；4 = 覆盖率不足
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

import { loadSpec } from './lib/spec.mjs'
import { launchBrowser } from './lib/playwright.mjs'
import { captureSnapshot } from './lib/page-snapshot.mjs'
import { locateAll } from './lib/locate.mjs'
import { canvasScale, computeExtras, decideExit, diffNodes, judgePitch, summarizeRows } from './lib/diff.mjs'
import { renderReport } from './lib/report.mjs'
import { composeSideBySide } from './lib/compose.mjs'
import { checkUrlServesBuild, computeBuildFingerprint } from '../gate/build-fingerprint.mjs'

export function parseArgs(argv = process.argv.slice(2)) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    let key = a.slice(2)
    let value
    if (key.includes('=')) {
      const eq = key.indexOf('=')
      value = key.slice(eq + 1)
      key = key.slice(0, eq)
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      value = argv[++i]
    } else {
      value = true
    }
    out[key] = value
  }
  return out
}

export function decideExitCode(summary, minMatch) {
  return decideExit(summary, minMatch)
}

function parseViewport(v, fallback = { width: 1600, height: 1400 }) {
  if (typeof v !== 'string') return fallback
  const m = v.match(/^(\d+)x(\d+)$/)
  if (!m) throw new Error(`--viewport 格式应为 WxH，收到: ${v}`)
  return { width: Number(m[1]), height: Number(m[2]) }
}

function gitHead(repo) {
  try {
    return execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function resolveRecipe(recipePath) {
  return path.resolve(recipePath)
}

function buildReproduceCommand(opts) {
  const q = (s) => (/\s/.test(s) ? `"${s}"` : s)
  const parts = [
    'node tools/accept/accept.mjs',
    `--spec ${q(opts.specPath)}`,
    `--url ${q(opts.url)}`,
    `--page ${q(opts.page)}`,
    `--recipe ${q(opts.recipePath)}`,
    `--build-dir ${q(opts.buildDir)}`,
    `--out ${q(opts.outDir)}`,
  ]
  if (opts.refShot) parts.push(`--ref-shot ${q(opts.refShot)}`)
  if (opts.commit) parts.push(`--commit ${opts.commit}`)
  else if (opts.repo) parts.push(`--repo ${q(opts.repo)}`)
  if (opts.scope) parts.push(`--scope ${q(opts.scope)}`)
  if (opts.minMatch !== 0.9) parts.push(`--min-match ${opts.minMatch}`)
  return parts.join(' \\\n  ')
}

/**
 * 程序化入口（gate-acceptance.mjs 也走这里，不 fork 进程）
 * @param {object} opts
 * @param {string} opts.specPath
 * @param {string} opts.url
 * @param {string} [opts.page]
 * @param {string} opts.recipePath
 * @param {string} opts.outDir
 * @param {string} opts.buildDir 构建产物目录（**必填**，P0-4 证据绑构建）
 * @param {string} [opts.refShot]
 * @param {string} [opts.shell]
 * @param {string} [opts.scope]
 * @param {number} [opts.minMatch]
 * @param {string} [opts.commit]
 * @param {string} [opts.repo]
 * @param {{width:number,height:number}} [opts.viewport]
 * @param {number} [opts.deviceScaleFactor]
 * @param {boolean} [opts.quiet]
 * @returns {Promise<{verdict:object, exitCode:number, paths:object}>}
 */
export async function runAccept(opts) {
  const shell = opts.shell || '.screen-view'
  const minMatch = opts.minMatch != null ? Number(opts.minMatch) : 0.9
  const viewport = opts.viewport || { width: 1600, height: 1400 }
  const deviceScaleFactor = opts.deviceScaleFactor != null ? Number(opts.deviceScaleFactor) : 2
  const outDir = path.resolve(opts.outDir)

  if (!opts.specPath) throw new Error('缺少 --spec')
  if (!opts.url) throw new Error('缺少 --url')
  if (!opts.recipePath) throw new Error('缺少 --recipe')
  if (!opts.buildDir) {
    throw new Error('缺少 --build-dir：硬化后 accept 必须绑定构建产物（index.html + assets/**/*.js + *.css 树哈希），否则 verdict 无法证明测的是哪个构建')
  }

  const loaded = loadSpec(path.resolve(opts.specPath))
  const spec = loaded.spec
  const page = opts.page || spec.screen
  // P0-3：错页 spec 顶包在 accept 侧也直接拒绝（gate 侧还有一道 screen 校验）
  if (spec.screen && page !== spec.screen) {
    throw new Error(`spec.screen=${JSON.stringify(spec.screen)} 与 --page=${JSON.stringify(page)} 不一致：疑似拿别的页面契约顶包`)
  }
  fs.mkdirSync(outDir, { recursive: true })

  // P0-4：构建指纹 + URL↔构建绑定（URL 服的不是这份构建 → 环境错误，不出判决）
  const buildFingerprint = computeBuildFingerprint(opts.buildDir)
  const urlCheck = await checkUrlServesBuild(opts.url, opts.buildDir)
  if (!urlCheck.ok) {
    const detail = (urlCheck.mismatches || [])
      .slice(0, 5)
      .map((m) => `${m.path}: ${m.reason || `期望 ${String(m.expected).slice(0, 12)}… 实得 ${String(m.actual).slice(0, 12)}…`}`)
      .join('；')
    throw new Error(`--url 服出来的内容与 --build-dir 不是同一份构建：${detail}`)
  }

  const recipePath = resolveRecipe(opts.recipePath)
  if (!fs.existsSync(recipePath)) throw new Error(`recipe 不存在: ${recipePath}`)
  const recipeSha256 = crypto.createHash('sha256').update(fs.readFileSync(recipePath)).digest('hex')
  const recipeModule = await import(pathToFileURL(recipePath).href)
  const navigate = recipeModule.navigate || (recipeModule.default && recipeModule.default.navigate)
  if (typeof navigate !== 'function') throw new Error(`recipe 必须导出 async navigate(page, ctx): ${recipePath}`)

  const repoHead = opts.repo ? gitHead(path.resolve(opts.repo)) : null
  const commit = opts.commit || repoHead
  const commitSource = opts.commit ? 'cli --commit' : repoHead ? 'repo HEAD' : null

  const browser = await launchBrowser({ headless: opts.headless !== false })
  const context = await browser.newContext({ viewport, deviceScaleFactor })
  const pageObj = await context.newPage()
  pageObj.setDefaultTimeout(opts.timeout || 30000)
  pageObj.setDefaultNavigationTimeout(opts.timeout || 30000)

  const actualPath = path.join(outDir, 'actual.png')
  let snapshot
  let scopeUsed = opts.scope || shell
  try {
    const navResult = await navigate(pageObj, { url: opts.url, shell, outDir, spec })
    if (navResult && navResult.scope) scopeUsed = navResult.scope
    if (opts.scope) scopeUsed = opts.scope

    await pageObj.waitForSelector(shell, { state: 'visible', timeout: opts.timeout || 30000 })
    await pageObj.evaluate(() => (document.fonts && document.fonts.ready ? document.fonts.ready : true))
    await pageObj.waitForTimeout(opts.settleMs != null ? Number(opts.settleMs) : 250)

    const shellHandle = await pageObj.$(shell)
    if (!shellHandle) throw new Error(`找不到容器 ${shell}`)
    await shellHandle.screenshot({ path: actualPath })

    const specTexts = [...new Set(spec.nodes.map((n) => n.text).filter((t) => typeof t === 'string' && t !== ''))]
    snapshot = await captureSnapshot(pageObj, { shell, scope: scopeUsed, specTexts })
    if (!snapshot) throw new Error(`快照失败：找不到容器 ${shell}`)
  } finally {
    await context.close()
    await browser.close()
  }

  if (!(snapshot.shell.width > 0)) throw new Error(`容器宽度无效: ${snapshot.shell.width}`)
  const scale = canvasScale(snapshot.shell.width)
  const origin = { x: snapshot.shell.x, y: snapshot.shell.y }

  const specNodes = spec.nodes
  const { matches, consumedKeys, diagnostics } = locateAll(specNodes, snapshot)
  const nodes = diffNodes({ specNodes, matches, scale, origin })
  const extras = computeExtras({ elements: snapshot.elements, consumedKeys, scale, origin })

  // 列表页：行距口径（a11y 行框不均匀吸收行间空隙，行框高度不是行高 —— 见 reports/diagnosis）
  let pitch = null
  if (opts.listMetrics) {
    const metrics = JSON.parse(fs.readFileSync(path.resolve(opts.listMetrics), 'utf8'))
    pitch = judgePitch(nodes, metrics)
  }

  const summary = summarizeRows(nodes, extras.length)
  const exitCode = decideExit(summary, minMatch)

  const canvas = spec.canvas || { w: 360, h: 788 }
  const verdict = {
    schema_version: 1,
    page,
    spec_path: path.resolve(opts.specPath),
    spec_sha256: loaded.sha256,
    commit,
    commit_source: commitSource,
    repo: opts.repo ? path.resolve(opts.repo) : null,
    repo_head: repoHead,
    url: opts.url,
    shell,
    scope: scopeUsed,
    shell_rect: {
      x: +snapshot.shell.x.toFixed(2),
      y: +snapshot.shell.y.toFixed(2),
      width: +snapshot.shell.width.toFixed(2),
      height: +snapshot.shell.height.toFixed(2),
    },
    recipe_sha256: recipeSha256,
    build: {
      hash: buildFingerprint.hash,
      entry: buildFingerprint.entry,
      file_count: buildFingerprint.fileCount,
      files: buildFingerprint.files,
      dir: path.resolve(opts.buildDir),
      url_check: {
        ok: urlCheck.ok,
        entry: urlCheck.entry || null,
        entry_sha256: urlCheck.entry_sha256 || null,
        skipped: urlCheck.skipped || null,
        mismatches: urlCheck.mismatches || [],
      },
    },
    scale: +scale.toFixed(4),
    canvas: { w: canvas.w, h: canvas.h },
    viewport,
    device_scale_factor: deviceScaleFactor,
    min_match: minMatch,
    summary,
    pitch,
    nodes,
    extras,
    diagnostics,
    exit_code: exitCode,
    verdict: exitCode === 0 ? 'pass' : exitCode === 1 ? 'fail' : exitCode === 4 ? 'insufficient-coverage' : 'env-error',
    generated_at: new Date().toISOString(),
    artifacts: {
      actual_png: 'actual.png',
      report_md: 'report.md',
      verdict_json: 'verdict.json',
    },
    reproduce_command: buildReproduceCommand({
      specPath: path.resolve(opts.specPath),
      url: opts.url,
      page,
      recipePath,
      outDir,
      buildDir: path.resolve(opts.buildDir),
      refShot: opts.refShot || null,
      commit,
      repo: opts.repo || null,
      scope: opts.scope || null,
      minMatch,
    }),
  }

  const verdictPath = path.join(outDir, 'verdict.json')
  fs.writeFileSync(verdictPath, JSON.stringify(verdict, null, 2) + '\n')

  let sideBySide = null
  if (opts.refShot) {
    const browser2 = await launchBrowser({ headless: true })
    try {
      sideBySide = await composeSideBySide({
        browser: browser2,
        refShot: path.resolve(opts.refShot),
        actualShot: actualPath,
        outDir,
        height: opts.sideBySideHeight || 1100,
        labels: { ref: `真机截图 · ${page}`, actual: `本轮渲染 · ${commit || 'worktree'}` },
      })
    } finally {
      await browser2.close()
    }
    verdict.artifacts.side_by_side_html = path.basename(sideBySide.htmlPath)
    verdict.artifacts.side_by_side_png = path.basename(sideBySide.pngPath)
    fs.writeFileSync(verdictPath, JSON.stringify(verdict, null, 2) + '\n')
  }

  const reportPath = path.join(outDir, 'report.md')
  fs.writeFileSync(reportPath, renderReport({ verdict, extras }))

  if (!opts.quiet) {
    const tag = verdict.verdict.toUpperCase()
    process.stderr.write(
      `accept ${page}: ${tag}  pass=${summary.pass} fail=${summary.fail} missing=${summary.missing} extra=${summary.extra} skipped=${summary.skipped} matchRate=${summary.matchRate} scale=${verdict.scale}\n`
    )
    process.stderr.write(`  -> ${verdictPath}\n  -> ${reportPath}\n`)
    if (sideBySide) process.stderr.write(`  -> ${sideBySide.pngPath}\n`)
  }

  return {
    verdict,
    exitCode,
    paths: {
      outDir,
      verdictPath,
      reportPath,
      actualPath,
      sideBySidePng: sideBySide ? sideBySide.pngPath : null,
      sideBySideHtml: sideBySide ? sideBySide.htmlPath : null,
    },
  }
}

async function main() {
  const args = parseArgs()
  if (args.help || args.h) {
    process.stdout.write(
      [
        '用法: node tools/accept/accept.mjs --spec <json> --url <url> --recipe <mjs> --build-dir <dist> --out <dir>',
        '       [--page <id>] [--ref-shot <png>] [--shell .screen-view] [--scope <sel>]',
        '       [--min-match 0.9] [--json] [--commit <sha>] [--repo <path>]',
        '       [--viewport 1600x1400] [--dsf 2] [--settle-ms 250] [--list-metrics <json>]',
        '',
        '--build-dir 必填：verdict 绑定构建指纹（index.html + assets/**/*.js + *.css 树哈希），',
        '且 --url 必须服的是同一份构建（否则 exit 2，不产出判决）。',
        '',
        '退出码: 0=通过 1=fail/missing/extra 2=环境错误 4=覆盖率不足',
      ].join('\n') + '\n'
    )
    return
  }

  const opts = {
    specPath: args.spec,
    url: args.url,
    page: args.page,
    recipePath: args.recipe,
    outDir: args.out,
    buildDir: args['build-dir'] || args.buildDir,
    refShot: args['ref-shot'] || args.refShot || null,
    shell: args.shell,
    scope: args.scope,
    minMatch: args['min-match'] != null ? Number(args['min-match']) : 0.9,
    commit: args.commit,
    repo: args.repo,
    viewport: parseViewport(args.viewport),
    deviceScaleFactor: args.dsf != null ? Number(args.dsf) : 2,
    settleMs: args['settle-ms'] != null ? Number(args['settle-ms']) : 250,
    listMetrics: args['list-metrics'] || args.listMetrics || null,
    quiet: !!args.json,
  }

  try {
    const result = await runAccept(opts)
    if (args.json) process.stdout.write(JSON.stringify(result.verdict, null, 2) + '\n')
    process.exitCode = result.exitCode
  } catch (err) {
    process.stderr.write(`accept env-error: ${err && err.stack ? err.stack : err}\n`)
    process.exitCode = 2
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}