/**
 * e2e-evidence —— G4 结果的「本轮性」证明
 * ======================================
 * 解决的问题：`/tmp/run-e2e.json` 是共享的固定路径。
 * 于是 G7 可能读到：
 *   - 上一轮的旧文件（本轮根本没跑）
 *   - 另一个 lane 刚写的结果（不是我这个分支）
 *   - 只跑了一套的部分结果（却被当成全量通过）
 *
 * 判据只有一条：**证据必须自证它属于本轮**。
 * 做不到就判红，不许猜、不许兜底。
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/** 证据超过这个年龄就不再认可（分钟）。默认 30 分钟。 */
export const DEFAULT_MAX_AGE_MIN = 30

/** 每轮独立路径：sha + worktree + 时间戳，互不覆盖 */
export function evidencePath({ sha, worktree, now = new Date(), dir = null }) {
  const d = dir || path.join(os.tmpdir(), 'agent-e2e')
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '')
  const wt = String(worktree).replace(/[^\w.-]/g, '_').slice(0, 40)
  return path.join(d, `e2e-${String(sha).slice(0, 12)}-${wt}-${stamp}.json`)
}

export function writeEvidence(file, payload) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + '\n')
  return file
}

export function readEvidence(file) {
  if (!fs.existsSync(file)) return { ok: false, reasons: [`证据文件不存在：${file}`] }
  try {
    return { ok: true, data: JSON.parse(fs.readFileSync(file, 'utf8')) }
  } catch (e) {
    return { ok: false, reasons: [`证据文件不是合法 JSON：${e.message}`] }
  }
}

/**
 * 校验证据是否属于「本轮、本提交、本工作区、且真的跑过」。
 *
 * @param {object} data 证据内容
 * @param {object} expect
 * @param {string} expect.sha        期望的提交
 * @param {string} [expect.worktree] 期望的工作区标识
 * @param {string[]} [expect.suites] 至少必须出现的套件
 * @param {number} [expect.maxAgeMin]
 * @param {Date}   [expect.now]
 * @returns {{ok:boolean, reasons:string[]}}
 */
export function validateEvidence(data, expect = {}) {
  const reasons = []
  if (!data || typeof data !== 'object') return { ok: false, reasons: ['证据为空'] }

  const now = expect.now || new Date()
  const maxAge = expect.maxAgeMin ?? DEFAULT_MAX_AGE_MIN

  // 1) 提交必须对得上
  if (!data.sha) reasons.push('证据缺少 sha')
  else if (expect.sha && data.sha !== expect.sha) {
    reasons.push(`证据不属于本提交：证据 ${String(data.sha).slice(0, 12)} ≠ 当前 ${String(expect.sha).slice(0, 12)}`)
  }

  // 2) 工作区必须对得上（防止读到别的 lane 的结果）
  if (!data.worktree) reasons.push('证据缺少 worktree')
  else if (expect.worktree && data.worktree !== expect.worktree) {
    reasons.push(`证据不属于本工作区：证据 ${data.worktree} ≠ 当前 ${expect.worktree}`)
  }

  // 3) 不能是旧文件
  const finished = data.finishedAt ? new Date(data.finishedAt) : null
  if (!finished || Number.isNaN(finished.getTime())) {
    reasons.push('证据缺少 finishedAt')
  } else {
    const ageMin = (now - finished) / 60000
    if (ageMin > maxAge) reasons.push(`证据已过期：${ageMin.toFixed(1)} 分钟 > ${maxAge} 分钟`)
    if (ageMin < -5) reasons.push('证据时间在未来，不可信')
  }

  // 4) 必须真的跑过东西
  const results = Array.isArray(data.results) ? data.results : []
  if (results.length === 0) reasons.push('证据里没有任何套件结果')

  // 5) 每一套都必须成功且计数可解析
  for (const r of results) {
    const id = r.id || '(无 id)'
    if (r.quarantined) continue
    if (r.ok !== true) reasons.push(`套件 ${id} 未通过（exit=${r.code}）`)
    if (!r.checks || typeof r.checks.pass !== 'number') {
      reasons.push(`套件 ${id} 的计数不可解析`)
    }
  }

  // 6) 要求的套件必须出现（防止只跑一部分冒充全量）
  if (Array.isArray(expect.suites) && expect.suites.length) {
    const seen = new Set(results.map((r) => r.id))
    for (const s of expect.suites) {
      if (!seen.has(s)) reasons.push(`缺少套件：${s}`)
    }
  }

  return { ok: reasons.length === 0, reasons }
}

/** 从结果里汇总计数，供棘轮使用 */
export function sumChecks(results) {
  const acc = { pass: 0, fail: 0, suites: 0 }
  for (const r of results || []) {
    if (r.quarantined || !r.checks) continue
    acc.pass += r.checks.pass || 0
    acc.fail += r.checks.fail || 0
    acc.suites += 1
  }
  return acc
}
