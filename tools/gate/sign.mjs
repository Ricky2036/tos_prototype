#!/usr/bin/env node
/**
 * sign —— 判决书签核 + 豁免（waiver）管理（硬化版）
 * ==================================================
 * 为什么签核必须是独立步骤：
 *   AG 既是实现者又是集成者，自己给自己盖章，是 11-14 那次 "merged 只用了 1 分钟" 的直接原因。
 *   v2.0 的不变量 C 要求：判决由机器出，**签核的人不能是实现的人**。
 *
 * 硬化后（审计 P0-2）的硬规则，全部由 ../tools/gate/verdict.mjs 机器执行：
 *   1. 实现者身份**只**从 `git -C verdict.repo show -s --format=%ae verdict.commit`
 *      派生；verdict 带 commit+repo 时 --author 一律报错（禁止覆盖）。
 *      只有 verdict 没有 commit+repo 时才允许显式 --author，且会打印警告。
 *   2. signed_by 是 lanes.json 白名单里的 lane 名；lane 映射到的 git email 必须
 *      ≠ 实现者 email —— 这才是可机器核验的「signed_by ≠ author」。
 *   3. 签名摘要覆盖 nodes 全字段 + extras + waivers + url/spec_path/commit/repo/
 *      build/shell_rect/recipe_sha256；签核后改任何一项（含追加 waiver）都会失效。
 *   4. 签核语义 = 「对证据完整性签字」，不等于「同意合并」：fail 判决书也能签，
 *      gate 会按判决内容记 failed。未豁免失败不会因为签名变成 accepted。
 *
 * 用法：
 *   node tools/gate/sign.mjs sign --verdict <verdict.json> --by dsh [--lanes lanes.json]
 *   node tools/gate/sign.mjs waiver --verdict <verdict.json> --node "row:增强服务" \
 *        --reason "真机该行被运营商配置隐藏" --approver ricky --expires 2026-12-31
 *   node tools/gate/sign.mjs verify --verdict <verdict.json> [--lanes lanes.json]
 *
 * 退出码：
 *   sign  : 0 已签核 / 1 自签·未知 lane·参数不合法 / 2 身份或 lanes 不可用
 *   verify: 0 签名有效且全部失败项已豁免 / 1 未签·篡改·自签·未知 lane /
 *           2 lanes/身份不可用，或签名有效但仍有未豁免失败（不能当通过证据）/
 *           3 waiver 已过期
 */
import path from 'node:path'
import fs from 'node:fs'

import {
  DEFAULT_LANES_PATH,
  addWaiver,
  evaluateAcceptance,
  signVerdict,
  verifyVerdict,
} from './verdict.mjs'

const argv = process.argv.slice(2)
const cmd = argv[0]
const rest = argv.slice(1)
const arg = (n, d = null) => {
  const i = rest.indexOf(n)
  if (i >= 0) return rest[i + 1]
  const inline = rest.find((a) => a.startsWith(`${n}=`))
  return inline ? inline.slice(n.length + 1) : d
}

const read = (p) => JSON.parse(fs.readFileSync(path.resolve(p), 'utf8'))
const write = (p, o) => fs.writeFileSync(path.resolve(p), JSON.stringify(o, null, 2) + '\n')
const lanesPath = arg('--lanes') ? path.resolve(arg('--lanes')) : DEFAULT_LANES_PATH

function fatal(code, msg, extra = {}) {
  console.error(JSON.stringify({ ok: false, code, reason: msg, ...extra }, null, 2))
  process.exit(code)
}

/** 身份错误 → 退出码映射（保持与旧版大致兼容：自签=1，身份/白名单不可用=2） */
function exitCodeFor(errCode, fallback = 2) {
  if (errCode === 'self_signed' || errCode === 'unknown_lane') return 1
  return fallback
}

const verdictPath = arg('--verdict')
if (!verdictPath) fatal(2, '缺少 --verdict')
let verdict
try {
  verdict = read(verdictPath)
} catch (e) {
  fatal(2, `读不到 verdict：${e.message}`)
}

/* ---------------- sign ---------------- */
if (cmd === 'sign') {
  const by = arg('--by')
  const role = arg('--role', 'accept')
  const explicitAuthor = arg('--author')
  try {
    const out = signVerdict(verdict, { by, role, lanesPath, explicitAuthor })
    write(verdictPath, verdict)
    console.log(
      JSON.stringify(
        {
          ok: true,
          signed_by: out.signed_by,
          author: out.author,
          author_source: out.author_source,
          warning: out.warning,
          waivers: out.waivers,
          unwaived_failures: out.unwaived.length,
          passable: out.passable,
          signature: out.signature.slice(0, 16) + '…',
        },
        null,
        2
      )
    )
    process.exit(0)
  } catch (err) {
    fatal(exitCodeFor(err.code), err.message, { code: err.code })
  }
}

/* ---------------- waiver ---------------- */
if (cmd === 'waiver') {
  try {
    const out = addWaiver(verdict, {
      node: arg('--node'),
      reason: arg('--reason'),
      approver: arg('--approver'),
      expires: arg('--expires'),
    })
    write(verdictPath, verdict)
    console.log(
      JSON.stringify(
        {
          ok: true,
          waivers: out.waivers,
          expires_at: out.expires_at,
          signature_invalidated: out.invalidated,
          next: out.invalidated ? 'waiver 已改动签名摘要：必须重新 sign' : '尚未签核，继续 sign',
        },
        null,
        2
      )
    )
    process.exit(0)
  } catch (err) {
    fatal(exitCodeFor(err.code), err.message, { code: err.code })
  }
}

/* ---------------- verify ---------------- */
if (cmd === 'verify') {
  const explicitAuthor = arg('--author')
  const r = verifyVerdict(verdict, { lanesPath, explicitAuthor })
  if (!r.ok) {
    const code = exitCodeFor(r.code, r.code === 'unsigned' || r.code === 'tampered' ? 1 : 2)
    fatal(code, r.reason || r.code, r)
  }
  const acc = evaluateAcceptance(verdict)
  const out = {
    ok: true,
    page: verdict.page,
    signed_by: verdict.signed_by,
    author: r.author,
    pass: verdict.summary ? verdict.summary.pass : undefined,
    waivers: acc.waived.length,
    unwaived_failures: acc.unwaived.length,
    passable: acc.passable,
  }
  if (!acc.passable) {
    console.error(
      JSON.stringify(
        { ok: false, code: 'unwaived_failures', reason: `签名有效，但仍有 ${acc.unwaived.length} 个未豁免失败项：不能作为通过证据`, ...out, unwaived: acc.unwaived },
        null,
        2
      )
    )
    process.exit(2)
  }
  console.log(JSON.stringify(out, null, 2))
  process.exit(0)
}

console.error(`未知命令：${cmd || '(空)'}；可用：sign | waiver | verify`)
process.exit(2)