#!/usr/bin/env node
/**
 * check-spec-literals —— 禁止手写画布换算系数
 * ============================================
 * 为什么要有这一条：
 *   `0.298` 和 `360/1208` 写进代码后，"这个数从哪来"就永久丢失了。更危险的是
 *   用 kx 统一算 Y——三星来源会纵向漂移 1%，顶部对得上、屏底差 8px，而**每个数
 *   单看都合理**。这类缺陷只能靠静态检查拦住。
 *
 * 规则：工程代码与 spec 里不得出现换算系数或来源像素的除法字面量，
 *       一律走 scripts/lib/canvas-transform.mjs 的 coeffFor/toCanvas。
 *
 * 用法：
 *   node scripts/check-spec-literals.mjs [--json]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** 允许出现字面量的文件（换算实现本身、测试、来源登记表） */
const ALLOW = [
  'scripts/lib/canvas-transform.mjs',
  'scripts/check-spec-literals.mjs',
  'pixel-refs/sources.json',
]
const ALLOW_PREFIX = ['tests/']

/**
 * 系数白名单从 pixel-refs/sources.json 现算 —— 加一个来源就自动多一组禁用字面量，
 * 不需要回来改这个文件。
 *
 * 只取 4/5/6 位小数：3 位（0.298 / 0.333）误报率太高（SVG 滤镜、比例常量都会撞），
 * 而 4 位已经足够把"抄了一个系数"钉住。
 */
function derivedCoefficientLiterals() {
  const fs2 = fs
  const raw = JSON.parse(fs2.readFileSync(path.join(ROOT, 'pixel-refs/sources.json'), 'utf8'))
  const vals = new Set()
  for (const [id, s] of Object.entries(raw)) {
    if (id.startsWith('_')) continue
    // 只取 ky（Y 轴系数）。kx 单独出现并不错——真正的缺陷是「用 kx 代 ky」，
    // 而 1/3 这类 kx 会和 SVG 滤镜、比例常量撞车，一并禁掉只会制造误报。
    const ky = 788 / s.h
    if (Math.abs(ky - 1) < 1e-9) continue // 恒等来源（custom-spec）没有可禁的字面量
    for (const d of [4, 5, 6]) vals.add(ky.toFixed(d))
  }
  return [...vals].sort((a, b) => b.length - a.length)
}

const COEFF_RE = new RegExp(
  `\\b0\\.(?:${derivedCoefficientLiterals().map((v) => v.replace('0.', '')).join('|')})(?![0-9])`,
)

const PATTERNS = [
  { re: COEFF_RE, why: '写死的换算系数' },
  {
    re: /\b(?:360|788)\s*\/\s*(?:1208|2644|1080|2340|1320|2868)\b/,
    why: '手算的画布系数',
  },
  {
    re: /\b(?:1208|2644|1080|2340|1320|2868)\s*\/\s*(?:360|788)\b/,
    why: '手算的来源比值',
  },
]

/** 注释里提到这些数字是允许的（说明性文字，不是可执行路径） */
function stripComments(line) {
  return line
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/.*$/, '$1')
    .replace(/(^|\s)#.*$/, '$1')
}

/**
 * 纯函数，便于单测。
 * @param {string} content
 * @param {string} [filename]
 * @returns {Array<{line:number,text:string,why:string}>}
 */
export function findViolations(content, filename = '<inline>') {
  if (ALLOW.includes(filename) || ALLOW_PREFIX.some((p) => filename.startsWith(p))) return []
  const out = []
  content.split('\n').forEach((raw, i) => {
    const line = stripComments(raw)
    if (!line.trim()) return
    for (const p of PATTERNS) {
      if (p.re.test(line)) {
        out.push({ line: i + 1, text: raw.trim().slice(0, 140), why: p.why })
        break
      }
    }
  })
  return out
}

/* ---------------- CLI ---------------- */
function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '.local-evidence'].includes(e.name)) continue
      walk(full, acc)
    } else if (/\.(mjs|js|yaml|yml|json)$/.test(e.name)) {
      acc.push(full)
    }
  }
  return acc
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const targets = [
    ...walk(path.join(ROOT, 'scripts')),
    ...walk(path.join(ROOT, 'spec')),
    ...walk(path.join(ROOT, 'pixel-refs')),
  ].filter((f) => !f.endsWith('sources.json'))

  const all = []
  for (const f of targets) {
    const rel = path.relative(ROOT, f)
    const v = findViolations(fs.readFileSync(f, 'utf8'), rel)
    for (const x of v) all.push({ file: rel, ...x })
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ checked: targets.length, violations: all }, null, 2))
  } else {
    console.log(`检查 ${targets.length} 个文件`)
  }

  if (all.length) {
    console.error(`\n\x1b[31mG-spec FAIL · ${all.length} 处硬编码换算\x1b[0m`)
    for (const v of all) {
      console.error(`\x1b[31m  ${v.file}:${v.line}  ${v.why}\x1b[0m`)
      console.error(`    ${v.text}`)
    }
    console.error('\n改用：import { coeffFor, toCanvas } from "./lib/canvas-transform.mjs"')
    process.exit(1)
  }
  console.log('\x1b[32mG-spec PASS · 无硬编码换算\x1b[0m')
}
