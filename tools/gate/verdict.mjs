/**
 * verdict.mjs —— 判决书「签核」的共享核心（accept / gate / sign 只有这一套口径）
 * =============================================================================
 * 为什么单独抽出来：审计 P0-2 指出「sign.mjs 与 gate 各写一套校验」是历史漏洞来源。
 * 本文件是唯一事实源：
 *   - coreDigest(v)      签名摘要覆盖：nodes 全字段 + extras + waivers + url/spec_path/
 *                        commit/repo/build/shell_rect/recipe_sha256 等全部可篡改面
 *   - resolveAuthor()    实现者身份**只**从 `git -C verdict.repo show -s --format=%ae
 *                        verdict.commit` 派生；verdict 无 commit+repo 时才允许显式给
 *                        并打警告（P0-2）
 *   - loadLanes()        lane 白名单：lane 名 → git email/标识（tools/gate/lanes.json）
 *   - verifyVerdict()    签核有效性：未签 / 未知 lane / 自签 / 摘要不符 / waiver 过期
 *   - signVerdict()      机器可执行的签核（没有 override 通道）
 *   - addWaiver()        追加 waiver；**会清掉旧签名**，必须重新签核
 *
 * 身份域：author = git commit author email；signed_by = lane 名，lane 在 lanes.json
 * 里映射到 email。要求 lane 映射 email ≠ author email —— 这才是「signed_by ≠ author」
 * 的可机器核验版本。残留风险见 reports/hardening/HARDENING.md（摘要不是密钥）。
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const HERE = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_LANES_PATH = path.join(HERE, 'lanes.json')

export const TODAY = () => new Date().toISOString().slice(0, 10)

export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * 签名摘要：覆盖判决书里所有「可被事后篡改并误导人/机器」的字段。
 * 刻意**不覆盖** generated_at / signature / signed_by / signed_at / artifacts /
 * reproduce_command —— 签名时间与产物文件名不属于判决内容。
 * 覆盖范围直接对应审计 P1-6：改 actual/delta/via/url/spec_path/commit/build/waivers
 * 任何一项，verify 都会失败。
 */
export function coreDigest(v) {
  const normNode = (n) => ({
    id: n.id,
    role: n.role,
    expected: n.expected ?? null,
    actual: n.actual ?? null,
    delta: n.delta ?? null,
    worst: n.worst ?? null,
    tol: n.tol ?? null,
    status: n.status ?? null,
    reason: n.reason ?? null,
    via: n.via ?? null,
    text: n.text ?? null,
    ambiguous: n.ambiguous ?? null,
  })
  const normExtra = (e) =>
    typeof e === 'string'
      ? { id: e }
      : {
          id: e.id ?? null,
          key: e.key ?? null,
          text: e.text ?? null,
          attrs: e.attrs ?? null,
          classes: e.classes ?? null,
          rect: e.rect ?? null,
          selectionHint: e.selectionHint ?? null,
        }
  const normWaiver = (w) => ({
    node: w.node ?? null,
    reason: w.reason ?? null,
    approver: w.approver ?? null,
    approved_at: w.approved_at ?? null,
    expires_at: w.expires_at ?? null,
  })
  const core = {
    schema_version: v.schema_version ?? null,
    page: v.page ?? null,
    spec_path: v.spec_path ?? null,
    spec_sha256: v.spec_sha256 ?? null,
    commit: v.commit ?? null,
    repo: v.repo ?? null,
    url: v.url ?? null,
    shell: v.shell ?? null,
    scope: v.scope ?? null,
    scale: v.scale ?? null,
    canvas: v.canvas ?? null,
    viewport: v.viewport ?? null,
    device_scale_factor: v.device_scale_factor ?? null,
    min_match: v.min_match ?? null,
    shell_rect: v.shell_rect ?? null,
    recipe_sha256: v.recipe_sha256 ?? null,
    build: v.build ?? null,
    summary: v.summary ?? null,
    nodes: (v.nodes || []).map(normNode),
    extras: (v.extras || []).map(normExtra),
    waivers: (v.waivers || []).map(normWaiver),
  }
  return sha256(JSON.stringify(core))
}

/* ------------------------------ 身份 ------------------------------ */

/** verdict.commit 的 git 作者 email；没有 commit+repo / 解析失败返回 null */
export function resolveCommitAuthor(verdict) {
  if (!verdict || !verdict.commit || !verdict.repo) return null
  try {
    const out = execFileSync(
      'git',
      ['-C', verdict.repo, 'show', '-s', '--format=%ae', String(verdict.commit)],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim()
    return out ? out.toLowerCase() : null
  } catch {
    return null
  }
}

/**
 * 实现者身份（硬规则，P0-2）：
 *   - verdict 带 commit + repo：只认 git 提交作者；显式 --author 直接报错。
 *   - verdict 无 commit+repo：才允许显式给 --author，并返回 warning（调用方必须打印）。
 * @returns {{author:string, source:string, warning:string|null}}
 */
export function resolveAuthor(verdict, explicitAuthor = null) {
  const hasCommitBinding = !!(verdict && verdict.commit && verdict.repo)
  if (hasCommitBinding) {
    if (explicitAuthor) {
      const err = new Error('禁止 --author 覆盖：verdict 带 commit+repo，实现者身份只能从 git 提交作者派生')
      err.code = 'author_override_forbidden'
      throw err
    }
    const derived = resolveCommitAuthor(verdict)
    if (!derived) {
      const err = new Error(`无法从 git 解析 verdict.commit=${verdict.commit} 的作者（repo=${verdict.repo}）`)
      err.code = 'author_unresolved'
      throw err
    }
    return { author: derived, source: 'git-commit-author', warning: null }
  }
  if (!explicitAuthor) {
    const err = new Error('verdict 无 commit+repo，无法派生实现者身份；只能显式 --author（会打警告）')
    err.code = 'author_unresolved'
    throw err
  }
  return {
    author: String(explicitAuthor).toLowerCase(),
    source: 'explicit',
    warning: '警告：verdict 无 commit+repo，实现者身份来自显式 --author，无法机器核验',
  }
}

/* ------------------------------ lanes ------------------------------ */

/**
 * lanes.json 形状：
 * {
 *   "schema_version": 1,
 *   "lanes": {
 *     "dsh":         { "email": "dsh@local", "kind": "review" },
 *     "antigravity": { "email": "jingzhan.chen@jn90lf.local", "kind": "implement" }
 *   }
 * }
 * 也接受 email 数组（一条 lane 多个身份）。
 * @returns {{lanes:object, path:string}}
 */
export function loadLanes(lanesPath = DEFAULT_LANES_PATH) {
  const p = path.resolve(lanesPath)
  if (!fs.existsSync(p)) {
    const err = new Error(`lanes 白名单不存在：${p}`)
    err.code = 'lanes_unavailable'
    throw err
  }
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
  const lanes = raw.lanes || raw
  if (!lanes || typeof lanes !== 'object' || Array.isArray(lanes)) {
    const err = new Error(`lanes 文件格式不对（期望 {lanes:{<name>:{email}}}）：${p}`)
    err.code = 'lanes_unavailable'
    throw err
  }
  const out = {}
  for (const [name, def] of Object.entries(lanes)) {
    if (name === 'schema_version' || name === 'description' || name === 'notes') continue
    if (!def || typeof def !== 'object') continue
    const emails = (Array.isArray(def.email) ? def.email : [def.email])
      .filter((x) => typeof x === 'string' && x.trim())
      .map((x) => x.trim().toLowerCase())
    if (!emails.length) continue
    out[name] = { ...def, emails }
  }
  return { lanes: out, path: p }
}

export function laneIdentity(lanes, lane) {
  return lanes && lanes[lane] ? lanes[lane].emails : null
}

/* --------------------------- 判决可接受性 --------------------------- */

/**
 * 由 verdict 里已有的数据算「这份判决能不能算通过」：
 *   - 无 fail/missing/extra 且 exit_code=0 → passable
 *   - 有失败项，但每一条都有未过期 waiver → passable（waived）
 *   - 否则不可通过（gate 记 failed，不是 blocked）
 * @returns {{passable:boolean, failures:string[], unwaived:string[], expired:string[], waived:string[]}}
 */
export function evaluateAcceptance(verdict, today = TODAY()) {
  const failureIds = []
  for (const n of verdict.nodes || []) {
    if (n.status === 'fail' || n.status === 'missing') failureIds.push(n.id)
  }
  for (const e of verdict.extras || []) {
    failureIds.push(typeof e === 'string' ? e : e.id || `extra:${e.key || '?'}`)
  }
  const waivers = (verdict.waivers || []).filter((w) => w && w.node)
  const live = waivers.filter((w) => !w.expires_at || w.expires_at >= today)
  const expired = waivers.filter((w) => w.expires_at && w.expires_at < today).map((w) => w.node)
  const waivedSet = new Set(live.map((w) => w.node))
  const unwaived = failureIds.filter((id) => !waivedSet.has(id))
  const noDeclaredFailures = verdict.exit_code === 0 || verdict.exit_code == null
  // 无失败项 → 取决于 verdict 自身是否 pass；有失败项 → 只有全部被未过期 waiver 覆盖才算可接受
  const passable = expired.length === 0 && unwaived.length === 0 && (failureIds.length === 0 ? noDeclaredFailures : true)
  return {
    passable,
    failures: failureIds,
    unwaived,
    expired,
    waived: [...waivedSet],
  }
}

/* ------------------------------ 校验 ------------------------------ */

/**
 * 校验一份已签判决书。不抛异常，返回结构化结果：
 *   { ok, code, reason, author, lane, failures, unwaived, expired, waived }
 * code ∈ unsigned | invalid_verdict | lanes_unavailable | unknown_lane |
 *        author_unresolved | author_override_forbidden | self_signed | tampered | waiver_expired
 */
export function verifyVerdict(verdict, { lanesPath = DEFAULT_LANES_PATH, today = TODAY(), explicitAuthor = null } = {}) {
  const base = { ok: false, code: null, reason: null, author: null, lane: null, failures: [], unwaived: [], expired: [], waived: [] }
  if (!verdict || typeof verdict !== 'object') {
    return { ...base, code: 'invalid_verdict', reason: 'verdict 不是对象' }
  }
  if (!verdict.signed_by || !verdict.signature) {
    return { ...base, code: 'unsigned', reason: '判决书未签核（缺 signed_by/signature）' }
  }
  base.lane = verdict.signed_by

  let lanes
  try {
    lanes = loadLanes(lanesPath).lanes
  } catch (e) {
    return { ...base, code: 'lanes_unavailable', reason: e.message }
  }
  const laneEmails = laneIdentity(lanes, verdict.signed_by)
  if (!laneEmails) {
    return { ...base, code: 'unknown_lane', reason: `signed_by=${verdict.signed_by} 不在 lanes 白名单里` }
  }

  let resolved
  try {
    resolved = resolveAuthor(verdict, explicitAuthor)
  } catch (e) {
    return { ...base, code: e.code || 'author_unresolved', reason: e.message }
  }
  base.author = resolved.author
  if (laneEmails.includes(resolved.author) || String(verdict.signed_by).toLowerCase() === resolved.author) {
    return { ...base, code: 'self_signed', reason: `签核 lane ${verdict.signed_by} 的身份域 = 实现者 ${resolved.author}：自签无效` }
  }

  const actual = coreDigest(verdict)
  if (actual !== verdict.signature) {
    return { ...base, code: 'tampered', reason: '签名与判决内容不一致：签核后被改过' }
  }

  const acc = evaluateAcceptance(verdict, today)
  if (acc.expired.length) {
    return { ...base, code: 'waiver_expired', reason: `${acc.expired.length} 条 waiver 已过期，对应失败项重新变红`, ...acc }
  }
  return { ...base, ok: true, code: 'ok', reason: null, ...acc }
}

/* ------------------------------ 签核 ------------------------------ */

/**
 * 给判决书签核。语义已按硬化轮修正：
 *   sign = 「对这份证据完整性签字」，**不**等于「同意合并」。
 *   判决是 fail 也能签（gate 据此记 failed）；带未豁免失败的签名不会变成 accepted。
 * @param {object} verdict 会被原地修改
 * @returns {{signed_by, author, author_source, warning, signature, waivers, unwaived, passable}}
 */
export function signVerdict(verdict, { by, role = 'accept', lanesPath = DEFAULT_LANES_PATH, explicitAuthor = null, today = TODAY() } = {}) {
  const fail = (code, msg) => {
    const err = new Error(msg)
    err.code = code
    throw err
  }
  if (!by) fail('missing_by', '缺少 --by（签核 lane）')
  if (role !== 'accept') fail('bad_role', `role 必须是 accept，收到 ${role}`)
  if (!verdict || !verdict.summary) fail('invalid_verdict', 'verdict 缺 summary 字段，不是合法的判决书')
  if (!verdict.spec_sha256) fail('invalid_verdict', 'verdict 缺 spec_sha256')

  const { lanes } = (() => {
    try {
      return loadLanes(lanesPath)
    } catch (e) {
      fail('lanes_unavailable', e.message)
    }
  })()
  const laneEmails = laneIdentity(lanes, by)
  if (!laneEmails) fail('unknown_lane', `--by ${by} 不在 lanes 白名单里（${path.resolve(lanesPath)}）`)

  const resolved = resolveAuthor(verdict, explicitAuthor)
  if (laneEmails.includes(resolved.author) || String(by).toLowerCase() === resolved.author) {
    fail('self_signed', `签核 lane ${by} 的身份域 = 实现者 ${resolved.author}：自己不能给自己盖章`)
  }

  const acc = evaluateAcceptance(verdict, today)
  if (acc.expired.length) fail('waiver_expired', `${acc.expired.length} 条 waiver 已过期，请先清理再签核`)

  verdict.signed_by = by
  verdict.signed_role = role
  verdict.signed_at = new Date().toISOString()
  verdict.signature = coreDigest(verdict)
  return {
    signed_by: by,
    author: resolved.author,
    author_source: resolved.source,
    warning: resolved.warning,
    signature: verdict.signature,
    waivers: acc.waived.length,
    unwaived: acc.unwaived,
    passable: acc.passable,
  }
}

/** 追加 waiver；**清掉旧签名**（waiver 在摘要里，改 waiver 必须重新签核） */
export function addWaiver(verdict, { node, reason, approver, expires, today = TODAY() }) {
  const fail = (code, msg) => {
    const err = new Error(msg)
    err.code = code
    throw err
  }
  if (!node || !reason || !approver || !expires) fail('missing_args', 'waiver 必须给 --node --reason --approver --expires（YYYY-MM-DD）')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expires)) fail('bad_expires', `--expires 必须是 YYYY-MM-DD，收到 ${expires}`)
  if (expires < today) fail('bad_expires', `--expires 已过期：${expires}`)
  verdict.waivers = verdict.waivers || []
  if (verdict.waivers.some((w) => w.node === node)) fail('duplicate_waiver', `节点 ${node} 已有 waiver`)
  verdict.waivers.push({ node, reason, approver, approved_at: today, expires_at: expires })
  const hadSignature = !!verdict.signature || !!verdict.signed_by
  delete verdict.signature
  delete verdict.signed_by
  delete verdict.signed_role
  delete verdict.signed_at
  return { waivers: verdict.waivers.length, expires_at: expires, invalidated: hadSignature }
}
