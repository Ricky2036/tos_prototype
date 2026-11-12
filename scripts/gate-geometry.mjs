#!/usr/bin/env node
/**
 * gate-geometry —— G8 的 DOM 侧
 * =============================
 * 读 spec 的 geometry 段，打开页面，按 `data-testid` 找到对应元素，
 * 把 `getBoundingClientRect()` 换算到画布坐标，逐节点比偏差。
 *
 * 与 pixel-gate 的分工：那边是图侧（PIL），这边是 DOM 侧（Playwright）。
 * 两者只共享换算表，**不是同一个工具的两个命令**——硬凑在一起会两边都变形。
 *
 * 用法：
 *   node scripts/gate-geometry.mjs --spec spec/x.geometry.json \
 *        --url http://127.0.0.1:7777/ --route '#settings/display'
 *
 *   --shell <sel>    画布容器选择器（默认 .screen-view）
 *   --out <file>     把结果 JSON 落盘
 *   --json           只输出机器可读结果
 *   --min-match 0.8  要求至少 80% 的 spec 节点在 DOM 里找到（默认 0，只报告）
 *
 * 退出码：0 通过 / 1 超差 / 2 参数或环境错 / 4 匹配率不足
 */

import fs from 'node:fs'
import path from 'node:path'
import { compare, canvasScale } from './lib/geometry-compare.mjs'

const argv = process.argv.slice(2)
const getArg = (n, d = null) => {
  const i = argv.indexOf(`--${n}`)
  if (i >= 0) return argv[i + 1]
  const inline = argv.find((a) => a.startsWith(`--${n}=`))
  return inline ? inline.split('=').slice(1).join('=') : d
}

const specPath = getArg('spec')
const url = getArg('url', 'http://127.0.0.1:7777/')
const route = getArg('route', '')
const shell = getArg('shell', '.screen-view')
const outFile = getArg('out')
const jsonOnly = argv.includes('--json')
const minMatch = Number(getArg('min-match', '0'))

if (!specPath) {
  console.error('缺少 --spec（spec-gen 产出的 .geometry.json）')
  process.exit(2)
}

const spec = JSON.parse(fs.readFileSync(path.resolve(specPath), 'utf8'))
const nodes = spec.geometry || []
if (nodes.length === 0) {
  console.error(`spec 里没有 geometry 节点：${specPath}`)
  process.exit(2)
}

const { chromium } = await import('playwright')

/**
 * 浏览器可执行文件的解析顺序与仓库既有脚本一致：
 * 环境变量 → 系统 Chrome → Playwright 自带。
 * 本机实测：依赖要 chromium_headless_shell-1243，缓存里只有 1228，
 * 直接用系统 Chrome 最省事，也避免 CI 里多装 40–60s。
 */
function resolveChrome() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean)
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return undefined
}

const execPath = resolveChrome()
const browser = await chromium.launch(execPath ? { executablePath: execPath } : {})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const report = { spec: specPath, url: url + route, shell, scale: null }

try {
  await page.goto(url + route, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(400)

  // 归一化系数从容器 rect 现算 —— 绝不读 window 级 scale
  const shellBox = await page.locator(shell).first().boundingBox()
  if (!shellBox) throw new Error(`找不到容器 ${shell}`)
  const scale = canvasScale(shellBox.width)
  report.scale = +scale.toFixed(6)
  report.shellWidth = +shellBox.width.toFixed(2)
  report.shellOrigin = { x: +shellBox.x.toFixed(2), y: +shellBox.y.toFixed(2) }

  // 收集所有带 data-testid 的元素的 rect
  const domRects = await page.evaluate(() => {
    const map = {}
    for (const el of document.querySelectorAll('[data-testid]')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      map[el.getAttribute('data-testid')] = {
        x: r.x, y: r.y, width: r.width, height: r.height,
      }
    }
    return map
  })

  const result = compare(nodes, new Map(Object.entries(domRects)), scale,
    { origin: { x: shellBox.x, y: shellBox.y } })
  report.result = result

  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`spec ${nodes.length} 个节点 · DOM 命中 ${result.matched} · 容器 ${shell} 宽 ${report.shellWidth}px（系数 ${report.scale}）`)
    console.log('')
    console.log('| 节点 | 角色 | 偏差(画布px) | dx | dy | dw | dh | 判定 |')
    console.log('| --- | --- | --- | --- | --- | --- | --- | --- |')
    for (const r of result.rows) {
      if (r.status === 'missing') {
        console.log(`| ${r.id} | ${r.role} | — | — | — | — | — | 未命中 |`)
        continue
      }
      const mark = r.status === 'pass' ? 'ok' : r.status === 'skip' ? '跳过' : 'FAIL'
      console.log(`| ${r.id} | ${r.role} | ${r.worst} | ${r.dx} | ${r.dy} | ${r.dw} | ${r.dh} | ${mark} |`)
    }
    console.log('')
    console.log(`合计：pass ${result.pass} · fail ${result.fail} · 未命中 ${result.missing} · 跳过 ${result.skipped}`)
    console.log(`匹配率 ${(result.matchRate * 100).toFixed(1)}%`)
  }

  if (outFile) fs.writeFileSync(path.resolve(outFile), JSON.stringify(report, null, 2))

  if (minMatch > 0 && result.matchRate < minMatch) {
    console.error(`匹配率 ${(result.matchRate * 100).toFixed(1)}% 低于要求 ${(minMatch * 100).toFixed(0)}%`)
    process.exitCode = 4
  } else if (result.fail > 0) {
    process.exitCode = 1
  }
} catch (e) {
  console.error('gate-geometry 失败:', e.message)
  process.exitCode = 2
} finally {
  await browser.close()
}
