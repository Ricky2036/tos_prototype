/* 校验：蓝牙 / 热点 / 勿扰 / 静音 / 振动 启用后状态栏显示对应指示器（且与开关按钮同源）
 * 用法: node scripts/verify-status-bar.mjs [port]
 *
 * 🔴 判据：**数「可见槽位」，不数 DOM 节点**（2026-10-14 重写）
 *   `.status-bar .sb-ind` 现在是**恒渲染的 5 个固定槽**，显隐靠 `display: none`：
 *       vibrate(prio 20) · mute(30) · hotspot(40) · bluetooth(50) · dnd(60)
 *   隐藏槽的 `getBoundingClientRect()` 是 **0×0** ⇒ 旧的 `querySelectorAll('.sb-ind').length`
 *   恒等于 5，所有计数断言必然**假 FAIL**。本脚本一律按可见性判定（rect w/h > 0）。
 *   （`verify-status-bluetooth.mjs` 早就是这个写法，可作为范本。）
 *
 * ⚠️ `bluetooth` **默认就是开着的**，且不在本脚本的开关集里。
 *   要验「全关」必须显式 `bluetooth = false`，否则基线恒有 1 个可见槽 ——
 *   旧脚本第一条断言（「全关时状态栏无指示器」）当年就是这么写错的。
 *
 * ⚠️ 挤压：低优先级槽在空间不足时先被隐藏。实测「hotspot + bluetooth + dnd + vibrate 同时开」
 *   只剩 3 个可见（vibrate 被挤掉）。所以最后一条只断言**高优先级子集必须可见**，
 *   不对总数做等值断言 —— 那会随挤压阈值调整而假红。
 */
import { chromium } from 'playwright'

const PORT = process.argv[2] || '5555'
const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'

const browser = await chromium.launch({ executablePath: CHROME })
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)

const helper = {
  /** 先把所有开关注入默认值，再覆写，避免上一条用例的残留影响下一条 */
  async set(fn) {
    await page.evaluate(fn)
    await page.waitForTimeout(220)
  },
  /** 状态栏右侧指示器：按**可见性**返回（key 数组 + 每个可见槽的 svg path） */
  async indicators() {
    return page.evaluate(() => {
      const sb = document.querySelector('.status-bar .sb-right')
      if (!sb) return { found: false, keys: [], paths: {} }
      const keys = []
      const paths = {}
      for (const el of sb.querySelectorAll('.sb-ind')) {
        const r = el.getBoundingClientRect()
        if (!(r.width > 0 && r.height > 0)) continue // ← 判据只看屏上像素
        const k = el.dataset.key || `?${keys.length}`
        keys.push(k)
        paths[k] = [...el.querySelectorAll('svg path')].map((p) => p.getAttribute('d'))
      }
      return { found: true, keys, paths }
    })
  },
  /** 取某磁贴 LIcon 的全部 path d（按顺序） */
  async tilePaths(dataId) {
    return page.evaluate((id) => {
      const cell = document.querySelector(`[data-id="${id}"]`)
      return [...(cell?.querySelectorAll('.l-icon svg path') || [])].map((p) => p.getAttribute('d'))
    }, dataId)
  },
  /** 在控制中心网格里找一个 .l-icon 与给定 path 列表完全一致的磁贴（证明状态栏图标复用了开关按钮同款） */
  async findTileWithPaths(paths) {
    if (!paths || !paths.length) return null
    return page.evaluate((ds) => {
      if (!ds || !ds.length) return null
      for (const cell of document.querySelectorAll('[data-id]')) {
        for (const icon of cell.querySelectorAll('.l-icon')) {
          const cellDs = [...icon.querySelectorAll('svg path')].map((p) => p.getAttribute('d'))
          if (cellDs.length === ds.length && ds.every((d, i) => d === cellDs[i])) {
            return cell.getAttribute('data-id')
          }
        }
      }
      return null
    }, paths)
  }
}

let allOk = true
function check(name, cond, detail) {
  const ok = !!cond
  if (!ok) allOk = false
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}
/** 统一基线：蓝牙关、其余全关、响铃。所有用例都从这里出发 ——
 *  ⚠️ 必须显式关蓝牙：它**默认是开的**，不关的话「全关」基线恒有 1 个可见槽。 */
const RESET = `(() => { const c = window.__control
  c.bluetooth = false; c.hotspot = false
  c.dnd = false; c.doNotDisturb = false
  c.soundMode = 'ring' })()`

const keysOf = (r) => r.keys.join(', ')

// 1) 全关（含蓝牙）→ 0 个可见槽
await helper.set(`${RESET}`)
let r = await helper.indicators()
check('全关(含蓝牙) → 0 个可见指示器', r.found && r.keys.length === 0, `可见=[${keysOf(r)}]`)

// 2) 热点
await helper.set(`${RESET}; window.__control.hotspot = true`)
r = await helper.indicators()
check('热点开启 → 恰好 1 个可见指示器', r.keys.length === 1, `可见=[${keysOf(r)}]`)
check('  且它是 hotspot 槽本身', r.keys[0] === 'hotspot', `可见=[${keysOf(r)}]`)
let match = await helper.findTileWithPaths(r.paths[r.keys[0]])
check('  热点指示器与某个开关按钮同款图标', match !== null, `匹配磁贴: ${match}`)

// 3) 勿扰（控制中心入口 control.dnd）
await helper.set(`${RESET}; window.__control.dnd = true`)
r = await helper.indicators()
check('勿扰(控制中心入口 dnd) → 恰好 1 个可见指示器', r.keys.length === 1 && r.keys[0] === 'dnd', `可见=[${keysOf(r)}]`)
match = await helper.findTileWithPaths(r.paths[r.keys[0]])
check('  勿扰指示器与某个开关按钮同款图标', match !== null, `匹配磁贴: ${match}`)

// 4) 勿扰（设置页入口 control.doNotDisturb）—— 两个入口必须同源
await helper.set(`${RESET}; window.__control.doNotDisturb = true`)
r = await helper.indicators()
check('勿扰(设置页入口 doNotDisturb) 同样点亮状态栏', r.keys.length === 1 && r.keys[0] === 'dnd', `可见=[${keysOf(r)}]`)

// 5) 静音
await helper.set(`${RESET}; window.__control.soundMode = 'mute'`)
r = await helper.indicators()
check('静音 → 恰好 1 个可见指示器，且是 mute 槽', r.keys.length === 1 && r.keys[0] === 'mute', `可见=[${keysOf(r)}]`)
match = await helper.findTileWithPaths(r.paths[r.keys[0]])
check('  静音指示器与某个开关按钮同款图标', match !== null, `匹配磁贴: ${match}`)

// 6) 振动
await helper.set(`${RESET}; window.__control.soundMode = 'vibrate'`)
r = await helper.indicators()
check('振动 → 恰好 1 个可见指示器，且是 vibrate 槽', r.keys.length === 1 && r.keys[0] === 'vibrate', `可见=[${keysOf(r)}]`)
check('  静音/振动互斥：mute 槽不可见', !r.keys.includes('mute'), `可见=[${keysOf(r)}]`)
match = await helper.findTileWithPaths(r.paths[r.keys[0]])
check('  振动指示器与某个开关按钮同款图标', match !== null, `匹配磁贴: ${match}`)

// 7) 蓝牙单独
await helper.set(`${RESET}; window.__control.bluetooth = true`)
r = await helper.indicators()
check('蓝牙开启 → 恰好 1 个可见指示器，且是 bluetooth 槽', r.keys.length === 1 && r.keys[0] === 'bluetooth', `可见=[${keysOf(r)}]`)

// 8) 多开（含挤压）：只断言高优先级子集必须可见 + 蓝牙不能凭空多出来
await helper.set(`${RESET}; const c = window.__control
  c.hotspot = true; c.dnd = true; c.soundMode = 'mute'`)
r = await helper.indicators()
check(
  '热点+勿扰+静音 → hotspot/dnd/mute 三个槽都可见（按优先级升序排列）',
  ['hotspot', 'dnd', 'mute'].every((k) => r.keys.includes(k)),
  `可见=[${keysOf(r)}]`
)
check('  更高优先级的槽排在更低优先级之前', r.keys.join() === 'mute,hotspot,dnd', `可见=[${keysOf(r)}]`)

await browser.close()
console.log(allOk ? '\n全部通过 ✅' : '\n有失败项 ❌')
process.exit(allOk ? 0 : 1)
