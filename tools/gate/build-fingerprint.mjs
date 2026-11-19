/**
 * build-fingerprint.mjs —— 构建产物指纹（accept 写进 verdict，gate 复核）
 * =======================================================================
 * 审计 P0-4：证据与 commit/构建无绑定，`--commit` 可填任意 sha、`--url` 可指向任意
 * 页面。硬化后：
 *   - accept 必须给 --build-dir，指纹 = 排序后的「index.html + assets/**\/*.js +
 *     全部 *.css」内容树哈希，写进 verdict.build={hash, entry, files}
 *   - accept 另外校验 --url 实际服出来的入口文档/入口资源与 --build-dir 一致，
 *     不一致直接环境错误（否则「URL 指向 /tmp 假页面 + 真构建目录」仍能伪造）
 *   - gate 用自己拿到的 --build-dir 重算同一指纹并与 verdict.build.hash 比对，
 *     不匹配即红；同时校验 verdict.commit 能解析到被门禁的那个 commit。
 *
 * 指纹只覆盖机器可判别的「构建身份」，不覆盖外观（外观仍不判，见残余风险）。
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const BUILD_ENTRY = 'index.html'

export function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(abs, base, out)
    else if (entry.isFile()) out.push(path.relative(base, abs).split(path.sep).join('/'))
  }
  return out
}

/** 指纹覆盖的文件集合（相对路径，POSIX 分隔符）：index.html + assets/**\/*.js + 所有 *.css */
export function listBuildFiles(buildDir) {
  const root = path.resolve(buildDir)
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error(`--build-dir 不是目录：${root}`)
  }
  const picked = new Set()
  for (const rel of walk(root)) {
    if (rel === BUILD_ENTRY) picked.add(rel)
    else if (rel.startsWith('assets/') && rel.endsWith('.js')) picked.add(rel)
    else if (rel.endsWith('.css')) picked.add(rel)
  }
  if (!picked.has(BUILD_ENTRY)) {
    throw new Error(`--build-dir 里没有 ${BUILD_ENTRY}：${root}（不是构建产物根目录？）`)
  }
  return [...picked].sort()
}

/**
 * @param {string} buildDir
 * @returns {{hash:string, entry:string, fileCount:number, files:Array<{path:string,sha256:string,size:number}>}}
 */
export function computeBuildFingerprint(buildDir) {
  const root = path.resolve(buildDir)
  const rels = listBuildFiles(root)
  const files = rels.map((rel) => {
    const abs = path.join(root, rel)
    return { path: rel, sha256: sha256File(abs), size: fs.statSync(abs).size }
  })
  const manifest = files.map((f) => `${f.path}\0${f.sha256}\n`).join('')
  return {
    hash: crypto.createHash('sha256').update(manifest).digest('hex'),
    entry: BUILD_ENTRY,
    fileCount: files.length,
    files,
  }
}

function decodeHtmlAttr(s) {
  return s.replace(/&amp;/g, '&')
}

const ASSET_REF_RE = /(?:src|href)\s*=\s*["']([^"']+)["']/gi

/** 从入口 HTML 里抽出同源 js/css 引用（构建身份的核心可执行部分） */
export function extractAssetRefs(html) {
  const refs = []
  for (const m of html.matchAll(ASSET_REF_RE)) {
    const href = decodeHtmlAttr(m[1].trim())
    if (!href) continue
    const clean = href.split('?')[0].split('#')[0]
    if (!/\.(js|css)$/i.test(clean)) continue
    refs.push(clean)
  }
  return [...new Set(refs)]
}

function basePathname(p) {
  // 把 URL 路径映射到构建目录里的相对文件
  const clean = p.split('?')[0].split('#')[0]
  if (!clean || clean === '/') return BUILD_ENTRY
  const rel = clean.replace(/^\//, '')
  if (/\.html?$/i.test(rel)) return rel
  return BUILD_ENTRY
}

/**
 * 校验「URL 实际服出来的画面」与构建目录是同一份产物：
 *   1) 抓 URL 入口文档 → sha256 必须等于 buildDir/<对应 index.html>
 *   2) 入口文档里的同源 js/css 引用 → 逐个抓取，sha256 必须等于 buildDir 内同名文件
 * 这一步把「--url 指向 /tmp 假页面」挡在 accept 之外（P0-4）。
 *
 * @returns {Promise<{ok:boolean, entry:string, entry_sha256:string|null, checks:Array, mismatches:Array, skipped?:string}>}
 */
export async function checkUrlServesBuild(url, buildDir, { timeoutMs = 15000 } = {}) {
  const root = path.resolve(buildDir)
  computeBuildFingerprint(root) // 校验 --build-dir 是构建产物根目录
  const fileSha = (rel) => {
    const abs = path.join(root, rel.split('/').join(path.sep))
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null
    return sha256File(abs)
  }
  let base
  try {
    base = new URL(url)
  } catch (e) {
    return { ok: true, entry: null, entry_sha256: null, checks: [], mismatches: [], skipped: `url 不是合法 URL：${e.message}` }
  }
  if (base.protocol !== 'http:' && base.protocol !== 'https:') {
    return { ok: true, entry: null, entry_sha256: null, checks: [], mismatches: [], skipped: `非 http(s) URL：${base.protocol}` }
  }

  const entryRel = basePathname(base.pathname)
  const entryExpected = fileSha(entryRel)
  if (!entryExpected) {
    return {
      ok: false,
      entry: entryRel,
      entry_sha256: null,
      checks: [],
      mismatches: [{ path: entryRel, reason: 'build 目录里没有这个入口文件' }],
    }
  }

  const entryUrl = new URL(`/${entryRel}`, base.origin).href
  const res = await fetch(entryUrl, { signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`抓取入口文档失败：${entryUrl} HTTP ${res.status}`)
  const entryBuf = Buffer.from(await res.arrayBuffer())
  const html = entryBuf.toString('utf8')
  const entrySha = crypto.createHash('sha256').update(entryBuf).digest('hex')
  const checks = [{ path: entryRel, kind: 'entry', expected: entryExpected, actual: entrySha, ok: entrySha === entryExpected }]

  for (const ref of extractAssetRefs(html)) {
    const absUrl = new URL(ref, base.origin)
    if (absUrl.origin !== base.origin) continue // 跨源资源不属于构建指纹
    let rel = absUrl.pathname.replace(/^\//, '')
    if (!rel) continue
    const expected = fileSha(rel)
    if (!expected) {
      // 同源引用但构建里没有该文件：说明服的不是这份构建
      checks.push({ path: rel, kind: 'asset', expected: null, actual: null, ok: false, reason: 'build 目录里没有该同源资源' })
      continue
    }
    const r2 = await fetch(absUrl.href, { signal: AbortSignal.timeout(timeoutMs) })
    if (!r2.ok) {
      checks.push({ path: rel, kind: 'asset', expected, actual: null, ok: false, reason: `HTTP ${r2.status}` })
      continue
    }
    const buf = Buffer.from(await r2.arrayBuffer())
    const sha = crypto.createHash('sha256').update(buf).digest('hex')
    checks.push({ path: rel, kind: 'asset', expected, actual: sha, ok: sha === expected })
  }

  const mismatches = checks.filter((c) => !c.ok)
  return {
    ok: mismatches.length === 0,
    entry: entryRel,
    entry_sha256: entrySha,
    checks,
    mismatches,
  }
}