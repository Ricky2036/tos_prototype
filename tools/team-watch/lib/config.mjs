import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

/**
 * 配置解析（team-watch）
 * ======================
 * 默认值全部从 git 事实推导，不写死本机绝对路径：
 *   - 共享运行目录：`git rev-parse --git-common-dir` 的上一级（集成 clone 根）
 *     下的 `.local-evidence/team-watch`（四个 worktree 共用，已被 .gitignore 忽略）
 *   - worktree：`git worktree list --porcelain` 里按分支识别（dsh / workbuddy / antigravity / main）
 *   - 端口：main=9999（验收）、dsh=7777、workbuddy=5555、antigravity=1111
 *
 * 覆盖方式（测试与换机用）：`--config <json>` 或 `TEAM_WATCH_CONFIG`，支持
 * `{ home, stallMs, intervalMs, httpTimeoutMs, roots: [{ id, agent, role, root, port }] }`。
 */

export const BRANCH_ROLE = {
  main: { id: 'integration', agent: 'integrator', role: 'integration', port: 9999 },
  'dsh/lane': { id: 'dsh', agent: 'dsh', role: 'execution', port: 7777 },
  'workbuddy/lane': { id: 'workbuddy', agent: 'workbuddy', role: 'execution', port: 5555 },
  'antigravity/lane': { id: 'antigravity', agent: 'antigravity', role: 'execution', port: 1111 }
}

/** 只保留三个执行 lane + 集成根；codex/lane 是规划者，不参与巡检 */
const AGENT_ORDER = ['dsh', 'workbuddy', 'antigravity', 'integrator']

export class ConfigError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConfigError'
  }
}

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 15000
  }).trim()
}

export function findCommonDir(cwd = process.cwd()) {
  try {
    const out = git(['rev-parse', '--git-common-dir'], cwd)
    return path.resolve(cwd, out)
  } catch (e) {
    throw new ConfigError(`无法从 ${cwd} 解析 git common dir：${e.message}`)
  }
}

/** `git worktree list --porcelain` → [{ root, branch, head }] */
export function listWorktrees(integrationRoot) {
  const out = git(['worktree', 'list', '--porcelain'], integrationRoot)
  const items = []
  let cur = null
  for (const line of out.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (cur) items.push(cur)
      cur = { root: line.slice('worktree '.length).trim() }
    } else if (line.startsWith('branch ') && cur) {
      cur.branch = line.slice('branch '.length).trim().replace(/^refs\/heads\//, '')
    } else if (line.startsWith('HEAD ') && cur) {
      cur.head = line.slice('HEAD '.length).trim()
    }
  }
  if (cur) items.push(cur)
  return items
}

export function discoverRoots(integrationRoot) {
  const roots = []
  for (const wt of listWorktrees(integrationRoot)) {
    const spec = BRANCH_ROLE[wt.branch]
    if (!spec) continue
    if (!fs.existsSync(wt.root)) continue
    roots.push({ ...spec, root: wt.root, branch: wt.branch })
  }
  roots.sort((a, b) => AGENT_ORDER.indexOf(a.agent) - AGENT_ORDER.indexOf(b.agent))
  return roots
}

function readConfigFile(configPath) {
  if (!configPath) return null
  if (!fs.existsSync(configPath)) throw new ConfigError(`配置文件不存在：${configPath}`)
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (e) {
    throw new ConfigError(`配置文件不是合法 JSON：${configPath}（${e.message}）`)
  }
}

/**
 * @param {{cwd?:string, configPath?:string, env?:NodeJS.ProcessEnv}} opts
 */
export function resolveConfig(opts = {}) {
  const cwd = opts.cwd || process.cwd()
  const env = opts.env || process.env
  const configPath = opts.configPath || env.TEAM_WATCH_CONFIG || null
  const fileCfg = readConfigFile(configPath) || {}

  const commonDir = fileCfg.commonDir || findCommonDir(cwd)
  const integrationRoot = fileCfg.integrationRoot || path.dirname(commonDir)
  const home = path.resolve(
    fileCfg.home || env.TEAM_WATCH_HOME || path.join(integrationRoot, '.local-evidence', 'team-watch')
  )

  let roots
  if (Array.isArray(fileCfg.roots) && fileCfg.roots.length) {
    roots = fileCfg.roots.map((r) => {
      if (!r || !r.root || !r.id || !r.agent) {
        throw new ConfigError('roots[] 每项必须包含 id / agent / root')
      }
      return {
        id: String(r.id),
        agent: String(r.agent),
        role: r.role || (r.role === undefined && r.id === 'integration' ? 'integration' : 'execution'),
        root: path.resolve(r.root),
        port: Number(r.port) || null,
        branch: r.branch || null
      }
    })
  } else {
    roots = discoverRoots(integrationRoot)
  }

  if (!roots.length) {
    throw new ConfigError(`在 ${integrationRoot} 下没有识别到执行 worktree（分支 dsh/lane、workbuddy/lane、antigravity/lane）`)
  }
  // 集成根必须显式可辨；缺失时仍可跑执行 lane 巡检，但 status 会标注
  const hasIntegration = roots.some((r) => r.role === 'integration')

  const cfg = {
    configPath,
    commonDir,
    integrationRoot,
    home,
    roots,
    hasIntegration,
    stallMs: Number(fileCfg.stallMs ?? env.TEAM_WATCH_STALL_MS ?? 30 * 60 * 1000),
    intervalMs: Number(fileCfg.intervalMs ?? env.TEAM_WATCH_INTERVAL_MS ?? 60 * 1000),
    httpTimeoutMs: Number(fileCfg.httpTimeoutMs ?? env.TEAM_WATCH_HTTP_TIMEOUT_MS ?? 2000),
    lockTimeoutMs: Number(fileCfg.lockTimeoutMs ?? 5000),
    maxDirtyHashBytes: Number(fileCfg.maxDirtyHashBytes ?? 1024 * 1024)
  }
  if (!Number.isFinite(cfg.stallMs) || cfg.stallMs <= 0) throw new ConfigError('stallMs 必须是正数')
  if (!Number.isFinite(cfg.intervalMs) || cfg.intervalMs <= 0) throw new ConfigError('intervalMs 必须是正数')
  for (const r of roots) {
    if (!fs.existsSync(r.root)) {
      // 允许坏路径进入 scan：扫描阶段按 root 记错误，而不是整轮崩掉
      r.missing = true
    }
  }
  return cfg
}

export function rootByAgent(cfg, agent) {
  return cfg.roots.find((r) => r.agent === agent || r.id === agent) || null
}

export function integrationRootOf(cfg) {
  return cfg.roots.find((r) => r.role === 'integration') || null
}
