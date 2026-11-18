#!/usr/bin/env node
/**
 * gate-acceptance.mjs —— 合并前门禁：改了设置页？先把该页的**已签核**验收判决交出来
 * =================================================================================
 * 硬化轮（审计 reports/review/FINDINGS.md 的 7 条 P0）后，门禁的输入/输出契约：
 *
 *   输入 A（推荐，CI/合并前）：--verdict-root <dir>
 *     读取 accept 产出、sign 签核过的 verdict.json，逐页校验：
 *       签名有效（P0-1）→ 构建/commit/URL 绑定（P0-4）→ spec 身份与棘轮（P0-3）
 *       → 判决内容（pass→accepted / fail→failed）
 *   输入 B（仅取证，不产绿）：不给 --verdict-root 时门禁会现场跑 accept，
 *     但 accept 产物**没有签名**，所以一律记 blocked_unsigned。这是有意的：
 *     自己产证据自己判绿的时代结束了。
 *
 * 硬规则：
 *   - 每页进入判定前先校验 verdict 签名；未签 → blocked_unsigned，--block 下红（P0-1）
 *   - 实现者身份只从 git commit author 派生，signed_by 必须来自 lanes 白名单且身份域
 *     不同（P0-2，校验核心在 tools/gate/verdict.mjs，sign 与 gate 共用）
 *   - spec 支持嵌套/扁平两种布局（P0-7）；spec.screen 必须 === pageId；节点集合棘轮
 *     .gate/spec-baseline.json 只增不减，删除需 spec.removed waiver；给了 --dump-root
 *     则校验 spec.xml_sha256（P0-3）
 *   - verdict.build.hash 必须等于门禁自己 --build-dir 的构建指纹；verdict.commit 必须
 *     解析到本次被门禁的 commit；verdict.url 必须与门禁 --url 一致（P0-4）
 *   - --until 必填且必须是 since 的后代；--block 下 changedFiles=0 → 红；共享 UI/样式
 *     文件走 shared-surfaces.json → shared-surface 段列出受影响页面，映射不出来则
 *     needs full contract coverage 且 exit 3（P0-6）
 *
 * 退出码：
 *   0 = 全绿
 *   1 = --block 且存在 failed / blocked_* / error
 *   2 = 门禁自身环境错误（git/参数/baseline/build 不可用）
 *   3 = --block 且门禁覆盖不可判定（空 diff / shared-surface needs full contract coverage）
 *
 * 用法：
 *   node tools/accept/gate-acceptance.mjs \
 *     --repo /path/to/tos-dsh --spec-root evidence-pipeline/fixtures/spec-batch-out \
 *     --verdict-root reports/hardening/verdicts-0c945b6 \
 *     --build-dir /tmp/dist-0c945b6 \
 *     --url http://127.0.0.1:7805/ \
 *     --since '0c945b6^' --until 0c945b6 --block \
 *     [--lanes tools/gate/lanes.json] [--baseline <path>] [--dump-root <dir>]
 *     [--out <dir>] [--recipe-dir <dir>] [--json]
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

import { runAccept } from './accept.mjs'
import { DEFAULT_LANES_PATH, evaluateAcceptance, verifyVerdict } from '../gate/verdict.mjs'
import {
  applyBaselineEntry,
  checkDumpSha,
  checkRatchet,
  checkScreen,
  defaultBaselinePath,
  findSpecPath,
  flatSpecPath,
  listMappedPages,
  loadBaseline,
  readSpecFile,
  saveBaseline,
} from '../gate/spec-guard.mjs'
import { checkUrlServesBuild, computeBuildFingerprint } from '../gate/build-fingerprint.mjs'
import { analyzeSharedSurfaces } from '../gate/shared-surfaces.mjs'

const SETTINGS_PREFIX = 'src/components/apps/settings/'

function kebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * 变更文件 → pageId（契约：system/subpages/Foo.vue → settings/system/foo；
 * pages/system.js → settings/system；dateTime/Foo.vue → settings/dateTime/foo）
 * 非页面文件（css/测试/工具）返回 null。
 * @param {string} file repo 相对路径
 * @returns {string|null}
 */
export function pageIdForFile(file) {
  if (!file.startsWith(SETTINGS_PREFIX)) return null
  const rel = file.slice(SETTINGS_PREFIX.length)
  let m

  // pages/*.js —— 页面自声明清单即页面本身
  m = rel.match(/^pages\/([^/]+)\.js$/)
  if (m) return `settings/${m[1]}`

  // system/subpages/Foo.vue
  m = rel.match(/^system\/subpages\/([^/]+)\.vue$/)
  if (m) return `settings/system/${kebab(m[1])}`

  // system/SettingsSystem.vue 等系统页本体
  m = rel.match(/^system\/([^/]+)\.vue$/)
  if (m) return 'settings/system'

  // dateTime/Foo.vue
  m = rel.match(/^dateTime\/([^/]+)\.vue$/)
  if (m) return `settings/dateTime/${kebab(m[1])}`

  // 其它子目录/Foo.vue
  m = rel.match(/^([^/]+)\/([^/]+)\.vue$/)
  if (m) return `settings/${kebab(m[1])}/${kebab(m[2])}`

  // 根级 SettingsFoo.vue（旧结构）
  m = rel.match(/^(Settings[A-Z][A-Za-z0-9]*)\.vue$/)
  if (m) return `settings/${kebab(m[1].slice('Settings'.length))}`

  // 根级其它 .vue
  m = rel.match(/^([^/]+)\.vue$/)
  if (m) return `settings/${kebab(m[1])}`

  return null
}

/** 兼容导出：扁平 spec 命名（门禁用 findSpecPath 同时认嵌套布局） */
export function specPathForPageId(specRoot, pageId) {
  return flatSpecPath(specRoot, pageId)
}

/** recipe 文件命名约定：pageId 的 '/' 换成 '-'，加 .mjs */
export function recipePathForPageId(recipeDir, pageId) {
  return path.join(recipeDir, `${pageId.replace(/\//g, '-')}.mjs`)
}

function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim()
}

export function mapChangedFiles(files) {
  const byPage = new Map()
  const unmapped = []
  for (const f of files) {
    const pageId = pageIdForFile(f)
    if (!pageId) {
      unmapped.push(f)
      continue
    }
    if (!byPage.has(pageId)) byPage.set(pageId, [])
    byPage.get(pageId).push(f)
  }
  return { byPage, unmapped }
}

function relTo(repo, p) {
  const r = path.relative(repo, p)
  return r.startsWith('..') ? p : r
}

/** verdict-root 里找某页的判决书（两种目录约定都支持） */
export function findVerdictPath(verdictRoot, pageId) {
  const flat = pageId.replace(/\//g, '-')
  const candidates = [
    path.join(verdictRoot, flat, 'verdict.json'),
    path.join(verdictRoot, flat + '.verdict.json'),
    path.join(verdictRoot, pageId, 'verdict.json'),
    path.join(verdictRoot, 'verdict.json'),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  }
  return null
}

function normalizeUrl(u) {
  if (!u) return null
  try {
    return new URL(u).href
  } catch {
    return String(u)
  }
}

function samePath(a, b) {
  if (!a || !b) return false
  try {
    return fs.realpathSync(a) === fs.realpathSync(b)
  } catch {
    return path.resolve(a) === path.resolve(b)
  }
}

/** 把 verdict.commit 解析成完整 sha（用于和门禁 commit 比对） */
function resolveCommit(repo, commit) {
  if (!commit) return null
  try {
    return git(repo, ['rev-parse', '--verify', `${commit}^{commit}`])
  } catch {
    return null
  }
}

/**
 * @param {object} opts
 * @param {string} opts.repo
 * @param {string} opts.specRoot
 * @param {string} [opts.url]            取证模式下必填；verdict-root 模式下可选（用于 URL 绑定）
 * @param {string} opts.since
 * @param {string} opts.until            **必填**（P0-6：不再接受「跟工作区比」的隐式区间）
 * @param {string} [opts.verdictRoot]    已签 verdict 根目录；给了就不再现场跑 accept
 * @param {string} [opts.buildDir]       构建产物目录（P0-4 必需）
 * @param {string} [opts.baseline]       spec 棘轮基线（默认 <repo>/.gate/spec-baseline.json）
 * @param {string} [opts.dumpRoot]       若给，校验 spec.xml_sha256
 * @param {string} [opts.lanesPath]
 * @param {string} [opts.sharedSurfacesPath]
 * @param {boolean} [opts.block]
 * @param {string} [opts.outDir]
 * @param {string} [opts.recipeDir]
 * @param {number} [opts.minMatch]
 * @param {string} [opts.shell]
 * @returns {Promise<{gate:object, exitCode:number, paths:object}>}
 */
export async function runGate(opts) {
  const repo = path.resolve(opts.repo)
  const specRoot = path.resolve(opts.specRoot)
  const recipeDir = path.resolve(opts.recipeDir || path.join(path.dirname(new URL(import.meta.url).pathname), 'recipes'))
  const outDir = path.resolve(opts.outDir || path.join(process.cwd(), 'gate-out'))
  const since = opts.since
  const until = opts.until || null
  const block = !!opts.block
  const minMatch = opts.minMatch != null ? Number(opts.minMatch) : 0.9
  const shell = opts.shell || '.screen-view'
  const verdictRoot = opts.verdictRoot ? path.resolve(opts.verdictRoot) : null
  const lanesPath = opts.lanesPath ? path.resolve(opts.lanesPath) : DEFAULT_LANES_PATH
  const baselinePath = opts.baseline ? path.resolve(opts.baseline) : defaultBaselinePath(repo)

  if (!since) throw new Error('缺少 --since <ref>')
  if (!until) throw new Error('缺少 --until <ref>：门禁不再接受「跟工作区比」的隐式区间（ref 漂移会静默改变判定范围）')
  if (!opts.specRoot) throw new Error('缺少 --spec-root')
  if (!verdictRoot && !opts.url) throw new Error('取证模式（未给 --verdict-root）需要 --url')
  if (!fs.existsSync(repo)) throw new Error(`repo 不存在: ${repo}`)

  // ref 解析（bad ref → 环境错误 exit 2）
  const sinceSha = git(repo, ['rev-parse', since])
  const untilSha = git(repo, ['rev-parse', until])
  const headSha = git(repo, ['rev-parse', 'HEAD'])
  const branch = git(repo, ['rev-parse', '--abbrev-ref', 'HEAD'])

  // P0-6：since 必须是 until 的祖先（否则区间无意义 / ref 漂移）
  try {
    git(repo, ['merge-base', '--is-ancestor', sinceSha, untilSha])
  } catch {
    throw new Error(`--since ${since}(${sinceSha.slice(0, 10)}) 不是 --until ${until}(${untilSha.slice(0, 10)}) 的祖先：区间无意义或 ref 漂移`)
  }
  const commit = untilSha

  // 全量 diff（P0-6：不再只 diff settings 目录，否则共享 UI/CSS 改动不可见）
  const changed = git(repo, ['diff', '--name-only', `${sinceSha}..${untilSha}`])
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const pageChanged = changed.filter((f) => pageIdForFile(f))
  const { byPage } = mapChangedFiles(pageChanged)

  // spec-root 里已映射页面（shared surface pages:"*" 用它展开）
  const mappedPages = listMappedPages(specRoot)
  const mappedPageIds = mappedPages.map((p) => p.pageId)
  const nonPageChanged = changed.filter((f) => !pageIdForFile(f))
  let shared
  try {
    shared = analyzeSharedSurfaces(nonPageChanged, mappedPageIds, opts.sharedSurfacesPath)
  } catch (e) {
    throw new Error(`shared-surfaces 不可用：${e.message}`)
  }

  const emptyDiff = changed.length === 0

  // P0-4：门禁自己的构建指纹 + URL 绑定
  let gateBuild = null
  let buildUrlCheck = null
  if (opts.buildDir) {
    gateBuild = computeBuildFingerprint(opts.buildDir)
    if (opts.url) {
      buildUrlCheck = await checkUrlServesBuild(opts.url, opts.buildDir)
      if (!buildUrlCheck.ok) {
        const detail = (buildUrlCheck.mismatches || []).slice(0, 3).map((m) => m.path).join('、')
        throw new Error(`门禁 --url 服出来的内容与 --build-dir 不是同一份构建（${detail}）：拒绝在此环境下判决`)
      }
    }
  }

  // P0-3：spec 棘轮基线
  const { baseline, exists: baselineExists, path: baselineUsedPath } = loadBaseline(baselinePath)
  let baselineDirty = false
  let baselineWriteError = null

  fs.mkdirSync(outDir, { recursive: true })

  // 待判页面 = 页面文件命中的页 ∪ 共享文件影响的已映射页
  const judgeIds = [...new Set([...byPage.keys(), ...shared.affectedPages])].sort()

  const results = []
  for (const pageId of judgeIds) {
    const files = byPage.get(pageId) || []
    const isSharedAffected = !byPage.has(pageId)
    const expectedRecipe = recipePathForPageId(recipeDir, pageId)
    const base = {
      pageId,
      files,
      sharedAffected: isSharedAffected,
      recipePath: relTo(process.cwd(), expectedRecipe),
      recipeExists: fs.existsSync(expectedRecipe),
    }

    // ---- P0-7 + P0-3：spec 布局 / screen / dump sha / 节点棘轮 ----
    const specHit = findSpecPath(specRoot, pageId)
    if (!specHit) {
      results.push({
        ...base,
        specPath: relTo(process.cwd(), flatSpecPath(specRoot, pageId)),
        specExists: false,
        specLayout: null,
        status: 'blocked_no_spec',
        reason: '两种布局都没有该页 spec（嵌套 <pageId>.geometry.json / 扁平 <pageId '/'→'-'>.geometry.json）',
      })
      continue
    }
    const loaded = readSpecFile(specHit.path)
    const screen = checkScreen(loaded.spec, pageId)
    const dump = checkDumpSha(loaded.spec, { dumpRoot: opts.dumpRoot, pageId })
    const ratchet = checkRatchet({ pageId, spec: loaded.spec, baseline })
    const specViolations = []
    if (!screen.ok) specViolations.push({ id: null, reason: 'screen-mismatch', detail: screen.reason })
    if (dump.checked && !dump.ok) specViolations.push({ id: null, reason: 'xml-sha256-mismatch', detail: dump.reason })
    for (const v of ratchet.violations) specViolations.push(v)
    base.specPath = relTo(process.cwd(), specHit.path)
    base.specExists = true
    base.specLayout = specHit.layout
    base.specSha256 = loaded.sha256
    if (specViolations.length) {
      // 基线不前进：先修 spec 再谈判决
      results.push({
        ...base,
        status: 'blocked_spec_invalid',
        reason: specViolations.map((v) => v.detail || v.reason).join('；'),
        specViolations,
        specNotes: ratchet.notes,
        specChecks: { screen, dump: { checked: dump.checked, ok: dump.ok, reason: dump.reason }, ratchet: { ok: ratchet.ok, added: ratchet.added, removed: ratchet.removed } },
      })
      continue
    }
    applyBaselineEntry(baseline, pageId, ratchet.entry)
    baselineDirty = true
    const specChecks = {
      screen: { ok: true },
      dump: { checked: dump.checked, ok: dump.ok, reason: dump.reason },
      ratchet: { ok: true, added: ratchet.added, removed: ratchet.removed, isNewPage: ratchet.isNewPage },
    }

    // ---- P0-1 / P0-4：判决书获取 + 签名 + 绑定 ----
    let verdict = null
    let verdictPathUsed = null
    if (verdictRoot) {
      verdictPathUsed = findVerdictPath(verdictRoot, pageId)
      if (!verdictPathUsed) {
        results.push({ ...base, status: 'blocked_unsigned', reason: `--verdict-root 下没有该页判决书（期望 <root>/${pageId.replace(/\//g, '-')}/verdict.json）`, specChecks })
        continue
      }
      try {
        verdict = JSON.parse(fs.readFileSync(verdictPathUsed, 'utf8'))
      } catch (e) {
        results.push({ ...base, status: 'blocked_signature', reason: `判决书不是合法 JSON：${e.message}`, verdictPath: relTo(process.cwd(), verdictPathUsed), specChecks })
        continue
      }
    }

    if (!verdictRoot) {
      // 取证模式：现场跑 accept，产物必然未签 → blocked_unsigned（self-produced evidence）
      if (!base.recipeExists) {
        results.push({ ...base, status: 'blocked_no_recipe', specChecks })
        continue
      }
      if (!opts.buildDir) throw new Error('取证模式需要 --build-dir：accept 硬化后必须绑定构建产物指纹')
      try {
        const r = await runAccept({
          specPath: specHit.path,
          url: opts.url,
          page: pageId,
          recipePath: expectedRecipe,
          outDir: path.join(outDir, 'pages', pageId.replace(/\//g, '-')),
          buildDir: opts.buildDir,
          commit,
          repo,
          minMatch,
          shell,
          quiet: true,
          viewport: opts.viewport,
          deviceScaleFactor: opts.deviceScaleFactor,
        })
        const vf = verifyVerdict(r.verdict, { lanesPath })
        results.push({
          ...base,
          status: 'blocked_unsigned',
          reason: `现场 accept 产出的判决书未签核（${vf.code}）：必须由另一 lane 用 tools/gate/sign.mjs sign 后才能进判定`,
          exitCode: r.exitCode,
          verdict: r.verdict.verdict,
          summary: r.verdict.summary,
          scale: r.verdict.scale,
          buildHash: r.verdict.build ? r.verdict.build.hash : null,
          verdictPath: relTo(process.cwd(), r.paths.verdictPath),
          specChecks,
        })
      } catch (err) {
        results.push({ ...base, status: 'error', error: String(err && err.message ? err.message : err), specChecks })
      }
      continue
    }

    // 签名校验（P0-1）：未签 / 未知 lane / 自签 / 篡改 / waiver 过期 一律不进判定
    const vf = verifyVerdict(verdict, { lanesPath })
    const sigInfo = {
      signed_by: verdict.signed_by || null,
      author: vf.author || null,
      signature: verdict.signature || null,
      code: vf.code,
      waivers: (verdict.waivers || []).length,
    }
    if (!vf.ok) {
      const status = vf.code === 'unsigned' ? 'blocked_unsigned' : 'blocked_signature'
      results.push({
        ...base,
        status,
        reason: vf.reason || vf.code,
        signature: sigInfo,
        verdictPath: relTo(process.cwd(), verdictPathUsed),
        specChecks,
      })
      continue
    }

    // P0-4 绑定：verdict 必须指向本次被门禁的 commit / repo / spec / build / url
    const bindings = []
    if (verdict.page !== pageId) bindings.push(`verdict.page=${verdict.page} ≠ pageId=${pageId}`)
    if (verdict.spec_sha256 !== loaded.sha256) bindings.push(`verdict.spec_sha256=${String(verdict.spec_sha256).slice(0, 12)}… ≠ 当前 spec sha=${loaded.sha256.slice(0, 12)}…（签完后 spec 被改过？）`)
    if (!verdict.commit) {
      bindings.push('verdict 缺 commit：无法绑定被门禁的提交')
    } else {
      const vc = resolveCommit(repo, verdict.commit)
      if (!vc) bindings.push(`verdict.commit=${verdict.commit} 在 repo 里解析不出来`)
      else if (vc !== commit) bindings.push(`verdict.commit=${vc.slice(0, 10)} ≠ 被门禁 commit=${commit.slice(0, 10)}`)
    }
    if (!verdict.repo) bindings.push('verdict 缺 repo')
    else if (!samePath(verdict.repo, repo)) bindings.push(`verdict.repo=${verdict.repo} ≠ 门禁 repo=${repo}`)
    if (opts.url && verdict.url && normalizeUrl(verdict.url) !== normalizeUrl(opts.url)) {
      bindings.push(`verdict.url=${verdict.url} ≠ 门禁 url=${opts.url}`)
    }
    if (bindings.length) {
      results.push({
        ...base,
        status: 'blocked_binding',
        reason: bindings.join('；'),
        bindings,
        signature: sigInfo,
        verdictPath: relTo(process.cwd(), verdictPathUsed),
        specChecks,
      })
      continue
    }

    // P0-4 构建绑定：门禁自己拿到的 --build-dir 指纹必须与 verdict 里的一致
    if (!gateBuild) {
      results.push({
        ...base,
        status: 'blocked_build_unverified',
        reason: '未给 --build-dir：无法复核 verdict.build.hash（拒绝把「未绑定构建」的判决当证据）',
        signature: sigInfo,
        verdictPath: relTo(process.cwd(), verdictPathUsed),
        specChecks,
      })
      continue
    }
    const vBuildHash = verdict.build ? verdict.build.hash : null
    if (!vBuildHash) {
      results.push({
        ...base,
        status: 'blocked_build_unverified',
        reason: 'verdict 缺 build 指纹：这是硬化前签出的旧判决，不能进判定',
        signature: sigInfo,
        buildHash: gateBuild.hash,
        verdictPath: relTo(process.cwd(), verdictPathUsed),
        specChecks,
      })
      continue
    }
    if (vBuildHash !== gateBuild.hash) {
      results.push({
        ...base,
        status: 'blocked_build_mismatch',
        reason: `verdict.build.hash=${String(vBuildHash).slice(0, 16)}… ≠ 门禁 --build-dir 指纹=${gateBuild.hash.slice(0, 16)}…`,
        signature: sigInfo,
        buildHash: gateBuild.hash,
        verdictBuildHash: vBuildHash,
        verdictPath: relTo(process.cwd(), verdictPathUsed),
        specChecks,
      })
      continue
    }

    // 判决内容：签名有效 + 绑定一致 → 按 verdict 内容判 accepted/failed
    const acc = evaluateAcceptance(verdict)
    const failedIds = acc.unwaived
    const status = acc.passable ? 'accepted' : 'failed'
    results.push({
      ...base,
      status,
      exitCode: verdict.exit_code,
      verdict: verdict.verdict,
      summary: verdict.summary,
      scale: verdict.scale,
      waivers: acc.waived,
      unwaived: failedIds,
      signature: sigInfo,
      buildHash: gateBuild.hash,
      verdictBuildHash: vBuildHash,
      verdictPath: relTo(process.cwd(), verdictPathUsed),
      specChecks,
    })
  }

  // 基线落盘（不存在则创建；产品仓库只读时降级成 warning，不阻断）
  if (baselineDirty) {
    try {
      saveBaseline(baselineUsedPath, baseline)
    } catch (e) {
      baselineWriteError = String(e && e.message ? e.message : e)
    }
  }

  const count = (status) => results.filter((r) => r.status === status).length
  const summary = {
    changedFiles: changed.length,
    pageFiles: pageChanged.length,
    unmappedFiles: shared.unmatchedSourceFiles.length,
    ignoredFiles: shared.nonSourceFiles.length,
    pageIds: judgeIds.length,
    accepted: count('accepted'),
    failed: count('failed'),
    blocked_no_spec: count('blocked_no_spec'),
    blocked_no_recipe: count('blocked_no_recipe'),
    blocked_unsigned: count('blocked_unsigned'),
    blocked_signature: count('blocked_signature'),
    blocked_binding: count('blocked_binding'),
    blocked_build_unverified: count('blocked_build_unverified'),
    blocked_build_mismatch: count('blocked_build_mismatch'),
    blocked_spec_invalid: count('blocked_spec_invalid'),
    errored: count('error'),
    sharedSurfaces: shared.items.length,
    sharedAffectedPages: shared.affectedPages.length,
    emptyDiff,
    needsFullCoverage: shared.needsFullCoverage,
  }
  const problems =
    summary.failed +
    summary.blocked_no_spec +
    summary.blocked_no_recipe +
    summary.blocked_unsigned +
    summary.blocked_signature +
    summary.blocked_binding +
    summary.blocked_build_unverified +
    summary.blocked_build_mismatch +
    summary.blocked_spec_invalid +
    summary.errored

  const coverageUndecidable = emptyDiff || shared.needsFullCoverage
  let exitCode = 0
  if (block) {
    if (coverageUndecidable) exitCode = 3
    else if (problems > 0) exitCode = 1
  }

  const gate = {
    schema_version: 2,
    repo,
    branch,
    since,
    since_sha: sinceSha,
    until,
    until_sha: untilSha,
    commit,
    head_sha: headSha,
    spec_root: specRoot,
    recipe_dir: relTo(process.cwd(), recipeDir),
    verdict_root: verdictRoot,
    lanes_path: lanesPath,
    baseline_path: baselineUsedPath,
    baseline_existed: baselineExists,
    baseline_write_error: baselineWriteError,
    dump_root: opts.dumpRoot ? path.resolve(opts.dumpRoot) : null,
    url: opts.url || null,
    build: gateBuild
      ? { dir: path.resolve(opts.buildDir), hash: gateBuild.hash, entry: gateBuild.entry, file_count: gateBuild.fileCount, url_check: buildUrlCheck ? { ok: buildUrlCheck.ok, entry: buildUrlCheck.entry, mismatches: buildUrlCheck.mismatches } : null }
      : null,
    changed_files: changed,
    page_files: pageChanged,
    unmapped_files: shared.unmatchedSourceFiles,
    ignored_files: shared.nonSourceFiles,
    page_ids: judgeIds,
    mapped_spec_pages: mappedPageIds,
    shared_surfaces: {
      items: shared.items,
      affected_pages: shared.affectedPages,
      needs_full_coverage: shared.needsFullCoverage,
      reason: shared.reason,
    },
    results,
    summary,
    block,
    exit_code: exitCode,
    generated_at: new Date().toISOString(),
  }

  const gateJson = path.join(outDir, 'gate.json')
  const gateMd = path.join(outDir, 'gate.md')
  fs.writeFileSync(gateJson, JSON.stringify(gate, null, 2) + '\n')
  fs.writeFileSync(gateMd, renderGateMd(gate))

  return { gate, exitCode, paths: { outDir, gateJson, gateMd } }
}

const MARK = {
  accepted: '✅ accepted',
  failed: '❌ failed',
  blocked_no_spec: '⛔ blocked_no_spec',
  blocked_no_recipe: '🚫 blocked_no_recipe',
  blocked_unsigned: '🔏 blocked_unsigned',
  blocked_signature: '🪪 blocked_signature',
  blocked_binding: '🔗 blocked_binding',
  blocked_build_unverified: '🏗️ blocked_build_unverified',
  blocked_build_mismatch: '🧬 blocked_build_mismatch',
  blocked_spec_invalid: '📐 blocked_spec_invalid',
  error: '⚠️ error',
}

const FIX_HINT = {
  accepted: '—',
  failed: '按 verdict 修实现，或由人批 waiver 后重新 accept+sign（waiver 计入签名摘要）',
  blocked_no_spec: '补该页真机 spec（uiautomator dump → page model），或把该页改动拆出本次合并。',
  blocked_no_recipe: '补该页 recipe（tools/accept/recipes/<pageId>.mjs）',
  blocked_unsigned: '先把 accept 产物交给另一 lane 执行 tools/gate/sign.mjs sign，再放 --verdict-root',
  blocked_signature: '签名无效（自签/未知 lane/摘要不符/waiver 过期）：重做签核；不接受 override',
  blocked_binding: '判决书绑定的 commit/repo/spec/url 与本次门禁不一致：对当前 commit 重跑 accept+sign',
  blocked_build_unverified: '给门禁 --build-dir（同一份构建产物），让门禁复核 verdict.build.hash',
  blocked_build_mismatch: '判决书测的构建 ≠ 本次要合并的构建：对目标构建重跑 accept',
  blocked_spec_invalid: '修 spec（screen/节点集合棘轮/dump sha）；删除节点必须在 spec.removed 里带 reason/approver/expires_at',
  error: '看 gate.json 里的 error，修环境后重跑',
}

export function renderGateMd(gate) {
  const s = gate.summary
  const lines = []
  lines.push('# 验收门禁 · gate-acceptance（硬化版）')
  lines.push('')
  lines.push(`- **repo**：\`${gate.repo}\`（branch \`${gate.branch}\`）`)
  lines.push(`- **since**：\`${gate.since}\` → \`${gate.since_sha}\``)
  lines.push(`- **until**：\`${gate.until}\` → \`${gate.commit}\``)
  lines.push(`- **spec-root**：\`${gate.spec_root}\`（已映射 ${gate.mapped_spec_pages.length} 页；spec 支持嵌套/扁平两种布局）`)
  lines.push(`- **verdict-root**：\`${gate.verdict_root || '（未给：取证模式，现场 accept 产物一律未签）'}\``)
  lines.push(`- **lanes**：\`${gate.lanes_path}\``)
  lines.push(`- **build**：${gate.build ? `\`${gate.build.hash}\`（${gate.build.file_count} 个文件，entry ${gate.build.entry}）` : '（未给 --build-dir：构建绑定不可复核）'}`)
  lines.push(`- **baseline**：\`${gate.baseline_path}\`${gate.baseline_existed ? '' : '（首次创建）'}`)
  lines.push(`- **url**：\`${gate.url || '（未给）'}\``)
  lines.push(`- **生成时间**：${gate.generated_at}`)
  lines.push('')
  lines.push(
    `变更文件 **${s.changedFiles}** 个 → pageId **${s.pageIds}** 个；accepted **${s.accepted}** / failed **${s.failed}** / blocked_no_spec **${s.blocked_no_spec}** / blocked_no_recipe **${s.blocked_no_recipe}** / blocked_unsigned **${s.blocked_unsigned}** / blocked_signature **${s.blocked_signature}** / blocked_binding **${s.blocked_binding}** / blocked_build_* **${s.blocked_build_unverified + s.blocked_build_mismatch}** / blocked_spec_invalid **${s.blocked_spec_invalid}** / error **${s.errored}**`
  )
  lines.push('')
  if (s.emptyDiff) {
    lines.push('> 🚫 **changedFiles=0**：`--since` 与 `--until` 之间没有任何改动。门禁不把「空 diff」当绿灯（P0-6）；`--block` 下退出码 3。')
    lines.push('')
  }
  lines.push('## shared-surface（共享 UI / 几何 / 样式改动的影响面）')
  lines.push('')
  if (!gate.shared_surfaces.items.length) {
    lines.push('无共享源文件改动。')
  } else {
    for (const item of gate.shared_surfaces.items) {
      lines.push(`- **${item.id}**：${item.files.map((f) => `\`${f}\``).join('、')}`)
    }
    lines.push('')
    lines.push(`受影响的已映射页面（${gate.shared_surfaces.affected_pages.length}）：${gate.shared_surfaces.affected_pages.length ? gate.shared_surfaces.affected_pages.map((p) => `\`${p}\``).join('、') : '（无）'}`)
  }
  if (gate.shared_surfaces.needs_full_coverage) {
    lines.push('')
    lines.push('**shared-surface: needs full contract coverage**')
    lines.push('')
    lines.push(`> 共享文件改动无法映射到已映射页面：${gate.shared_surfaces.reason || '未知'}。`)
    lines.push('> 门禁在这种情况下不放行（`--block` 退出码 3）：必须先补齐受影响页面的契约，或把改动拆小。')
  }
  if (gate.unmapped_files.length) {
    lines.push('')
    lines.push(`无法映射的 src 改动（${gate.unmapped_files.length}）：${gate.unmapped_files.map((f) => `\`${f}\``).join('、')}`)
  }
  lines.push('')
  lines.push('## 逐页')
  lines.push('| pageId | 状态 | spec（布局） | 判决 | 签核 |')
  lines.push('|---|---|---|---|---|')
  for (const r of gate.results) {
    let verdict = '—'
    if (r.summary) {
      const x = r.summary
      verdict = `pass ${x.pass} / fail ${x.fail} / missing ${x.missing} / extra ${x.extra}（matchRate ${x.matchRate}）`
    } else if (r.status === 'blocked_no_spec' || r.status === 'blocked_spec_invalid' || r.reason) {
      verdict = r.reason || '无契约，拒绝判决'
      if (r.specViolations && r.specViolations.length) {
        verdict = r.specViolations.map((v) => v.detail || v.reason).join('；')
      }
    }
    let sig = '—'
    if (r.signature) {
      sig = r.signature.code === 'ok' ? `✔ ${r.signature.signed_by}（author ${r.signature.author}）` : `✗ ${r.signature.code}`
    }
    lines.push(`| \`${r.pageId}\` | ${MARK[r.status] || r.status} | \`${r.specPath}\`${r.specLayout ? `（${r.specLayout}）` : ''} | ${verdict} | ${sig} |`)
  }
  lines.push('')
  const blocked = gate.results.filter((r) => r.status !== 'accepted' && r.status !== 'failed')
  lines.push('## 阻断项与修复方式')
  lines.push('')
  if (!blocked.length) {
    lines.push('无。')
  } else {
    for (const r of blocked) {
      const detail = r.reason || r.error || ''
      lines.push(`- ${MARK[r.status] || r.status} \`${r.pageId}\`：${detail}`)
      const hint = FIX_HINT[r.status]
      if (hint && hint !== '—') lines.push(`  - 修复：${hint}`)
    }
  }
  lines.push('')
  if (gate.ignored_files.length) {
    lines.push('## 非源码改动（不参与门禁）')
    lines.push('')
    for (const f of gate.ignored_files) lines.push(`- \`${f}\``)
    lines.push('')
  }
  lines.push('## 复现命令')
  lines.push('')
  lines.push('```bash')
  lines.push(
    `node tools/accept/gate-acceptance.mjs --repo ${gate.repo} --spec-root ${gate.spec_root} --verdict-root ${gate.verdict_root || '<dir>'}${gate.build ? ` --build-dir ${gate.build.dir}` : ''} --url ${gate.url || '<url>'} --since ${gate.since} --until ${gate.until} --out <out>${gate.block ? ' --block' : ''}`
  )
  lines.push('```')
  lines.push('')
  return lines.join('\n')
}

function parseArgs(argv = process.argv.slice(2)) {
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

async function main() {
  const args = parseArgs()
  if (args.help || args.h) {
    process.stdout.write(
      [
        '用法: node tools/accept/gate-acceptance.mjs --repo <path> --spec-root <dir> --since <ref> --until <ref>',
        '       [--verdict-root <dir>] [--build-dir <dist>] [--url <url>] [--block]',
        '       [--lanes <lanes.json>] [--baseline <spec-baseline.json>] [--dump-root <dir>]',
        '       [--out <dir>] [--recipe-dir <dir>] [--json]',
        '',
        '硬化版硬规则：',
        '  - 每页判决前必须校验签名（verdict-root 模式）；取证模式的现场 accept 产物一律 blocked_unsigned',
        '  - verdict 必须绑定本次 commit/repo/spec/url，且 build.hash = 门禁 --build-dir 指纹',
        '  - spec 支持嵌套/扁平布局；节点集合棘轮；spec.screen 必须 === pageId',
        '  - --until 必填且 since 必须是其祖先；--block 下 changedFiles=0 或 shared-surface 不可映射 → 红',
        '',
        '退出码: 0=全绿 1=--block 且存在问题 2=门禁环境错误 3=--block 且覆盖不可判定（空 diff / 需全量契约）',
      ].join('\n') + '\n'
    )
    return
  }
  try {
    const result = await runGate({
      repo: args.repo,
      specRoot: args['spec-root'],
      url: args.url,
      since: args.since,
      until: args.until,
      outDir: args.out,
      verdictRoot: args['verdict-root'],
      buildDir: args['build-dir'] || args.buildDir,
      baseline: args.baseline,
      dumpRoot: args['dump-root'],
      lanesPath: args.lanes,
      sharedSurfacesPath: args['shared-surfaces'],
      block: !!args.block,
      recipeDir: args['recipe-dir'],
      minMatch: args['min-match'] != null ? Number(args['min-match']) : 0.9,
      shell: args.shell,
      viewport: args.viewport ? parseViewport(args.viewport) : undefined,
      deviceScaleFactor: args.dsf != null ? Number(args.dsf) : undefined,
    })
    if (args.json) process.stdout.write(JSON.stringify(result.gate, null, 2) + '\n')
    else {
      const s = result.gate.summary
      process.stderr.write(
        `gate: pageIds=${s.pageIds} accepted=${s.accepted} failed=${s.failed} blocked_no_spec=${s.blocked_no_spec} blocked_unsigned=${s.blocked_unsigned} blocked_signature=${s.blocked_signature} blocked_binding=${s.blocked_binding} blocked_build=${s.blocked_build_unverified + s.blocked_build_mismatch} blocked_spec_invalid=${s.blocked_spec_invalid} error=${s.errored} shared=${s.sharedSurfaces}${s.emptyDiff ? ' emptyDiff=1' : ''}\n`
      )
      process.stderr.write(`  -> ${result.paths.gateJson}\n  -> ${result.paths.gateMd}\n`)
    }
    process.exitCode = result.exitCode
  } catch (err) {
    process.stderr.write(`gate env-error: ${err && err.stack ? err.stack : err}\n`)
    process.exitCode = 2
  }
}

function parseViewport(v) {
  const m = String(v).match(/^(\d+)x(\d+)$/)
  if (!m) throw new Error(`--viewport 格式应为 WxH，收到: ${v}`)
  return { width: Number(m[1]), height: Number(m[2]) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}