/**
 * claim-rules —— G6 认领边界的纯计算部分
 * =======================================
 * 解决的问题：三个 Agent 并行时，"这个文件能不能动"没有唯一答案。
 * 今天已经出了两次事故（AG 从我分支捞文件、WB 拷基建导致 4 文件分叉），
 * 都不是不小心，是缺登记。
 *
 * 规则：
 *   改动文件 ⊆ 认领簇的文件 glob
 *            ∪ 协作产物（.tasks/** .claims/** docs/**，人人可写）
 *            ∪ [handoff] 白名单（--allow）
 *
 * 一个文件命中多个簇 = 冲突，必须显式解决，不允许"都算你的"。
 */

/** 已知执行者。integrator 可跨簇（它负责合入与冲突仲裁） */
export const ACTORS = ['workbuddy', 'dsh', 'integrator', 'codex']

/** 分支 → 执行者。CLI 未显式给 --actor 时按当前分支推断 */
export const BRANCH_ACTOR = {
  'workbuddy/lane': 'workbuddy',
  'dsh/lane': 'dsh',
  'antigravity/lane': 'integrator',
  main: 'integrator',
}

/**
 * 解析「谁在改」。缺身份时必须返回 null，不能兜底成某个默认值——
 * 兜底等于让任何人在任何簇上都能过。
 */
export function resolveActor({ explicit, branch, env }) {
  const a = (explicit || env || '').trim()
  if (a) {
    if (!ACTORS.includes(a)) return { actor: null, source: 'invalid', detail: `未知执行者 ${a}` }
    return { actor: a, source: explicit ? 'flag' : 'env' }
  }
  if (branch && BRANCH_ACTOR[branch]) return { actor: BRANCH_ACTOR[branch], source: 'branch' }
  return { actor: null, source: 'missing' }
}

/** 协作产物：任何 lane 都可以改，不算越界 */
export const SHARED_ALLOW = [
  '.tasks/**',
  '.claims/**',
  'docs/**',
  'README.md',
]

/** glob → RegExp。支持 ** * ? ，其余字符转义。 */
export function globToRegExp(glob) {
  let p = glob.trim()
  if (p.endsWith('/')) p += '**'
  let out = '^'
  for (let i = 0; i < p.length; i += 1) {
    const ch = p[i]
    if (ch === '*') {
      if (p[i + 1] === '*') {
        // ** 吃掉任意层目录；同时容忍它后面的 /
        out += '.*'
        i += 1
        if (p[i + 1] === '/') i += 1
      } else {
        out += '[^/]*'
      }
    } else if (ch === '?') {
      out += '[^/]'
    } else if ('\\^$+.|()[]{}'.includes(ch)) {
      out += `\\${ch}`
    } else {
      out += ch
    }
  }
  return new RegExp(`${out}$`)
}

export function matchGlob(file, glob) {
  return globToRegExp(glob).test(file)
}

/**
 * @param {string[]} files 改动文件（相对仓库根）
 * @param {Array<{cluster:string, owner:string, files:string[]}>} claims
 * @param {{allow?:string[]}} [opts]
 * @returns {{ok:boolean, rows:Array, unclaimed:string[], conflicts:string[], allowed:string[]}}
 */
export function classify(files, claims, opts = {}) {
  const shared = SHARED_ALLOW
  const allow = opts.allow || []
  const actor = opts.actor || null
  const integratorBypass = opts.integratorBypass !== false
  const rows = []
  const unclaimed = []
  const conflicts = []
  const unauthorized = []
  const noActor = []
  const allowed = []

  for (const file of files) {
    if (shared.some((g) => matchGlob(file, g))) {
      allowed.push({ file, why: 'shared' })
      continue
    }
    if (allow.some((g) => matchGlob(file, g))) {
      allowed.push({ file, why: 'handoff' })
      continue
    }
    const hits = claims.filter((c) => c.files.some((g) => matchGlob(file, g)))
    if (hits.length === 0) {
      unclaimed.push(file)
      rows.push({ file, cluster: null, owner: null, status: 'unclaimed' })
    } else if (hits.length > 1) {
      conflicts.push(file)
      rows.push({
        file,
        cluster: hits.map((h) => h.cluster).join(' + '),
        owner: hits.map((h) => h.owner).join(' + '),
        status: 'conflict',
      })
    } else {
      const c = hits[0]
      const lent = Array.isArray(c.lendTo) && c.lendTo.includes(actor)
      if (!actor) {
        noActor.push(file)
        rows.push({ file, cluster: c.cluster, owner: c.owner, status: 'no-actor' })
      } else if (actor === c.owner || lent) {
        rows.push({ file, cluster: c.cluster, owner: c.owner, status: 'claimed', lent })
      } else if (integratorBypass && actor === 'integrator') {
        rows.push({ file, cluster: c.cluster, owner: c.owner, status: 'claimed', by: 'integrator' })
      } else {
        unauthorized.push(file)
        rows.push({ file, cluster: c.cluster, owner: c.owner, status: 'unauthorized', actor })
      }
    }
  }

  return {
    ok: unclaimed.length === 0 && conflicts.length === 0
      && unauthorized.length === 0 && noActor.length === 0,
    rows,
    unclaimed,
    conflicts,
    unauthorized,
    noActor,
    allowed,
    actor,
  }
}

/** 把多个 .claims/*.json 的内容合成一个数组；重名簇直接报错 */
export function normalizeClaims(entries) {
  const seen = new Map()
  const out = []
  for (const [name, c] of entries) {
    if (!c || typeof c !== 'object') throw new Error(`${name}: 不是合法 JSON 对象`)
    if (!c.cluster) throw new Error(`${name}: 缺少 cluster`)
    if (!c.owner) throw new Error(`${name}: 缺少 owner`)
    if (!Array.isArray(c.files) || c.files.length === 0) throw new Error(`${name}: files 必须是非空数组`)
    if (seen.has(c.cluster)) throw new Error(`簇 ${c.cluster} 在 ${seen.get(c.cluster)} 与 ${name} 重复登记`)
    seen.set(c.cluster, name)
    out.push({
      cluster: c.cluster,
      owner: c.owner,
      since: c.since || '',
      files: c.files,
      lendTo: Array.isArray(c.lendTo) ? c.lendTo : [],
    })
  }
  return out
}
