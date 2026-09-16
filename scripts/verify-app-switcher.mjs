/**
 * App Switcher（最近任务切换器）冒烟校验 —— 固定层级堆叠版。
 *
 * 场景链：
 *   解锁 → 依次开 5 个应用 → 上滑停驻进切换器（含「手指微抖」用例）
 *   → 几何体检（最多四层 / 阶梯露边 / 左边缘不出屏 / 标签 / 底部按钮）
 *   → 背景层差异位移实测（第五轮：stair 几何级数，不再是 8:3:2:1）
 *   → 横滑方向 → 层级恒定逐帧不变量 → 桌面路径跟手入场（第五轮）
 *   → 点卡片恢复 → 上滑移除 → 快滑回桌面
 *
 * 用法：node scripts/verify-app-switcher.mjs [port]
 */
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { DECK } from '../src/utils/switcherDeck.js'

/* 层间位移的比例契约来自纯函数模块，避免脚本里再抄一份魔数（第六轮：0.32）。 */
const STAIR_DECAY = DECK.STAIR_DECAY

const PORT = process.argv[2] || '5555'
const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'

let allOk = true
const check = (name, cond, detail) => {
  if (!cond) allOk = false
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

const browser = await chromium.launch({ executablePath: CHROME })
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, hasTouch: true })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message))
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

const S = () => page.evaluate(() => ({
  base: window.__system.baseLayer,
  app: window.__system.activeAppId,
  recent: [...window.__system.recentApps],
  switcher: window.__system.appSwitcherOpen
}))

// 解锁
await page.evaluate(() => window.__system.unlock())
await page.waitForTimeout(400)

// 依次开 5 个应用（上限 5）→ 最近列表 [calculator, camera, phone, clock, settings]
const OPENED = ['settings', 'clock', 'phone', 'camera', 'calculator']
for (const id of OPENED) {
  await page.evaluate((a) => window.__system.openApp(a), id)
  await page.waitForTimeout(320)
}
let s = await S()
check(
  '最近列表 = [calculator, camera, phone, clock, settings]',
  JSON.stringify(s.recent) === JSON.stringify(['calculator', 'camera', 'phone', 'clock', 'settings']),
  s.recent.join('/')
)

// ---- 上滑停驻（dwell）----
// jitter: 松手前手指保持「微抖」（±2px）—— 旧实现每次 pointermove 都重计 0.2s，
// 微抖会让计时器永远凑不满 → 进不了 Recently（Ricky 原话：停留时间太长，很难激活）。
async function dwellSwipe({ jitter = false, travel = 400 } = {}) {
  const cx = 215
  const startY = 925
  await page.mouse.move(cx, startY)
  await page.mouse.down()
  const steps = Math.round(travel / 10)
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(cx, startY - i * 10, { steps: 1 })
    await page.waitForTimeout(14)
  }
  if (jitter) {
    // 300ms 的「停住但微抖」：±2px，步进 25ms
    for (let i = 0; i < 12; i++) {
      await page.mouse.move(cx + (i % 2 ? 2 : -2), startY - travel, { steps: 1 })
      await page.waitForTimeout(25)
    }
  } else {
    await page.waitForTimeout(300)
  }
  await page.mouse.up()
  await page.waitForTimeout(700)
}

// 快速上滑（速度高、无停顿 → 回桌面，不进切换器）
async function flickSwipe() {
  const cx = 215
  const startY = 925
  await page.mouse.move(cx, startY)
  await page.mouse.down()
  await page.mouse.move(cx, startY - 500, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(700)
}

/* 快速上滑 → 停住 400ms → 松手。
   这是 Ricky 反馈「上滑后有停留就应该进 Recent，现在很难激活」的复现用例：
   速度采样器若不带时间衰减，松手时会带回「停住之前」的快甩速度 →
   停驻激活被速度门槛误杀 → 手指明明停了，却回到桌面。 */
async function fastPauseSwipe() {
  const cx = 215
  const startY = 925
  await page.mouse.move(cx, startY)
  await page.mouse.down()
  await page.mouse.move(cx, startY - 420, { steps: 4 })
  await page.waitForTimeout(400)
  await page.mouse.up()
  await page.waitForTimeout(900)
}

// 屏幕矩形 / 期望几何
const screenBox = await page.locator('.screen').boundingBox()
const screenCenterX = screenBox.x + screenBox.width / 2
const cardW = Math.round(screenBox.width * 0.64)
const SPAN = cardW * 0.85 // 一整层的拖动距离（DECK.FOCUS_SPAN_FRAC，对齐参考视频实测 0.87）
const expectStair = [0, 0.12, 0.186, 0.222].map((f) => Math.round(cardW * f))

/* 需求②的契约常量（第八轮，2026-09-13）：Ricky 把「离场卡静止态」从
   「刚好贴住（零重叠）」改成「遮挡 C 位约 10%」——取值来自参考图
   d3b84716ed20a930514169f60882c751.jpg 的像素实测（重叠 75/691 = 10.85% ⇒ exit = 0.891 卡宽）。
   · EXIT_FRAC 是【屏宽】分数（不是卡宽分数！）：0.57 × 430 = 245px = 0.891 卡宽
   · 静止态离场卡左缘 = frontX + exit = 322.5px，仍露出 107.5px
   · 静止态重叠 = cardW − exit = 30px = 10.9% 卡宽 */
const exitPx = Math.round(screenBox.width * DECK.EXIT_FRAC)
const frontX = (screenBox.width - cardW) / 2
const restParkX = frontX + exitPx
const restOverlap = cardW - exitPx

/* 采样器：跟手卡在拖拽期的几何。Ricky 2026-09-12 定的三条硬规则：
   ① 缩放锚点与落点都是屏幕中心 → 全程 cx 恒为屏幕中心，不许偏左偏右；
   ② 缩放严格跟随手指，上滑越远越小（单调递减），越过满量程继续变小；
   ③ 绝不淡出 —— opacity 恒为 1，不许「缩到不见」。 */
await page.evaluate(() => {
  window.__sw = { cx: [], s: [], o: [] }
  window.__swStop = false
  const tick = () => {
    if (window.__swStop) return
    const f = document.querySelector('.switcher-card.is-follow')
    if (f) {
      const cs = getComputedStyle(f); const m = new DOMMatrixReadOnly(cs.transform)
      window.__sw.cx.push(+(m.e + f.clientWidth / 2).toFixed(1))
      window.__sw.s.push(+m.a.toFixed(3))
      window.__sw.o.push(+(+cs.opacity).toFixed(2))
    }
    requestAnimationFrame(tick)
  }
  tick()
})

await dwellSwipe({ jitter: true })
await page.evaluate(() => { window.__swStop = true })
s = await S()
check('「停留但手指微抖」也能激活切换器（dwell 容差 4px / 120ms）', s.switcher === true, `switcher=${s.switcher}`)
const sw = await page.evaluate(() => window.__sw)
if (sw.cx.length >= 5) {
  const drift = Math.max(...sw.cx.map((v) => Math.abs(v - screenCenterX)))
  check('跟手缩放全程不横向漂移（锚点=屏幕中心）', drift <= 1.5, `最大偏移=${drift.toFixed(1)}px`)
  check('跟手卡不淡出（opacity 恒 1）', Math.min(...sw.o) === 1, `min opacity=${Math.min(...sw.o)}`)
  let peak = 0
  for (let i = 1; i < sw.s.length; i++) if (sw.s[i] < sw.s[peak]) peak = i
  /* 容差 0.005（而不是 0.002）：sw.s 是【逐帧】读 getComputedStyle 的矩阵，
     弹簧积分在小数末位会有 ±1e-3 的数值抖动；0.002 时第九轮实测出现过
     「其余数字完全相同、只因峰位置差 1 帧（75/127 → 74/126）就 FAIL」的边界假失败。
     0.005 仍是「肉眼不可见」的量级（24px 图标上 <0.12px），不会掩盖真实回退。 */
  let monotonic = true
  let worstBack = 0
  for (let i = 1; i <= peak; i++) {
    const back = sw.s[i] - sw.s[i - 1]
    if (back > worstBack) worstBack = back
    if (back > 0.005) monotonic = false
  }
  const minS = sw.s[peak]
  check(
    '缩放随手指单调变小且可小于最终值（无极）',
    monotonic && minS < cardW / screenBox.width - 0.005,
    `min scale=${minS} / 最终=${(cardW / screenBox.width).toFixed(3)}（拖拽段 ${peak + 1}/${sw.s.length} 帧；` +
      `最大单帧回升=${worstBack.toFixed(4)}，容差 0.005）`
  )
} else {
  check('跟手缩放全程不横向漂移（锚点=屏幕中心）', false, `采样不足 samples=${sw.cx.length}`)
}

check('切换器 DOM 渲染', (await page.locator('.app-switcher').count()) === 1)
await page.waitForTimeout(500) // 等进场弹簧把进度推到 1，跟手卡让位给堆叠卡

/* 堆叠几何读取 */
const deck = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.switcher-card.is-deck')].map((c) => {
      const r = c.getBoundingClientRect()
      const cs = getComputedStyle(c)
      return {
        id: c.dataset.appId,
        idx: +c.dataset.index,
        depth: +c.dataset.depth,
        x: r.x,
        y: r.y,
        w: r.width,
        h: r.height,
        cx: r.x + r.width / 2,
        z: +cs.zIndex,
        origin: cs.transformOrigin
      }
    })
  )
const centeredId = async () => {
  const rows = await deck()
  let best = null
  for (const r of rows) {
    const d = Math.abs(r.cx - screenCenterX)
    if (!best || d < best.d) best = { d, id: r.id }
  }
  return best ? best.id : null
}

/* ---- 规则⑤ 最多三层（第七轮：4 层 → 3 层）---- */
let rows = await deck()
check('同时最多渲染 3 层（第 4 张被剔除）', rows.length === 3, `渲染 ${rows.length} 张：${rows.map((r) => r.id).join(',')}`)
check('最旧的应用（settings）不渲染卡片', !rows.some((r) => r.id === 'settings'), rows.map((r) => r.id).join(','))

/* ---- 规则④ 阶梯式缩小、露出越来越少 ---- */
{
  const byDepth = [...rows].sort((a, b) => a.idx - b.idx)
  const lefts = byDepth.map((r) => r.x)
  const exposures = []
  for (let i = 1; i < byDepth.length; i++) exposures.push(lefts[i - 1] - lefts[i])
  const scales = byDepth.map((r) => r.w / cardW)
  check(
    '背景层左边缘逐个左移（阶梯铺开）',
    lefts.every((v, i) => i === 0 || v < lefts[i - 1] - 5),
    `lefts=${lefts.map((v) => v.toFixed(1)).join(' / ')}`
  )
  check(
    '露出宽度递减（上层露出 52 / 下层 17 / 5，第六轮）',
    exposures.every((v, i) => i === 0 || v < exposures[i - 1] - 2),
    `exposures=${exposures.map((v) => v.toFixed(1)).join(' / ')}（期望 ≈ 52 / 17 / 5）`
  )
  /* 第六轮核心：stair(1) 必须落在参考视频实测区间 47~57px（实测 51~56px / 293 卡宽 × 275）。
     旧值 33px 被 Ricky 判为「一次只能滑走一张」。 */
  check(
    'stair(1) = 0.19 卡宽（对齐参考视频实测 51~56px，旧值 33px 已作废）',
    exposures[0] >= 47 && exposures[0] <= 57,
    `stair(1)=${exposures[0].toFixed(1)}px（参考实测 51~56px）`
  )
  check(
    '按层等比缩小（0.94^k）',
    scales[0] > scales[1] && scales[1] > scales[2] && Math.abs(scales[1] - 0.94) < 0.02,
    `scales=${scales.map((v) => v.toFixed(3)).join(' / ')}`
  )
  check(
    '缩放锚点是左上角（下层才藏得住）',
    byDepth.every((r) => r.origin.startsWith('0px 0px')),
    byDepth.map((r) => `${r.id}:${r.origin}`).join(' ')
  )
  check(
    '最深背景层左边缘不出屏',
    Math.min(...lefts) >= 0,
    `min left=${Math.min(...lefts).toFixed(1)}px（期望 ≈ ${(screenBox.x + (screenBox.width - cardW) / 2 - cardW * 0.2703).toFixed(1)}）`
  )
}

/* ---- 规则① 层级只由列表索引决定 ---- */
{
  /* 第七轮：三层堆叠 → 只看前 3 张（calculator / camera / phone） */
  const byIndex = ['calculator', 'camera', 'phone']
  const zs = byIndex.map((id) => rows.find((r) => r.id === id)?.z)
  check(
    'z 层级仅由列表索引决定（每层恰好差 1，越小越靠上）',
    zs.every((z, i) => (i === 0 ? true : z === zs[i - 1] - 1)) && new Set(zs).size === 3,
    zs.join(' > ')
  )
}

/* ---- 前卡落点必须水平居中 ---- */
{
  const front = rows.find((r) => r.depth === 0)
  check(
    '焦点层落点在屏幕水平中心',
    Math.abs(front.cx - screenCenterX) <= 2,
    `卡中心=${front.cx.toFixed(1)} 屏幕中心=${screenCenterX.toFixed(1)}`
  )
}

/* ---- UI 三改：卡片左上角图标+名称 / 去掉「x 个应用正在进行」/ 删除按钮与通知中心同款 ---- */
{
  const label = await page.evaluate(() => {
    const el = document.querySelector('.switcher-card-label')
    if (!el) return null
    const card = el.closest('.switcher-card')
    const lr = el.getBoundingClientRect()
    const cr = card.getBoundingClientRect()
    return {
      text: el.textContent.trim(),
      kids: el.children.length,
      inCard: card.dataset.appId,
      dx: lr.x - cr.x,
      above: cr.y - lr.bottom
    }
  })
  check('卡片左上角显示应用图标 + 名称', !!label && label.text.length > 0 && label.kids >= 2, JSON.stringify(label))
  check('标签贴在焦点卡左上角（卡顶上方）', !!label && Math.abs(label.dx) <= 4 && label.above > 0 && label.above < 14, label ? `dx=${label.dx.toFixed(1)} above=${label.above.toFixed(1)}` : 'null')

  /* ---- 第七轮·需求⑨：每张卡都有自己的图标，但只有 C 位显示应用名称 ---- */
  const labels = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('.switcher-card.is-deck').forEach((card) => {
      const el = card.querySelector('.switcher-card-label')
      if (!el) {
        out.push({ id: card.dataset.appId, hasLabel: false })
        return
      }
      const tile = el.querySelector('.icon-tile, img, svg')
      const tileVis = tile ? getComputedStyle(tile.closest('.app-icon') || tile).visibility : 'none'
      out.push({
        id: card.dataset.appId,
        hasLabel: true,
        hasIcon: !!tile,
        iconVisible: tileVis !== 'hidden',
        text: el.textContent.trim(),
        depth: Number(card.dataset.depth)
      })
    })
    return out
  })
  /* 需求⑦ 的回归守卫：前台应用的图标在 AppWindow 打开期间被 home.hideIcon() 置为
     全局隐藏态，标签行必须传 ignore-hidden 绕开，否则【C 位那张卡的图标是空的】。 */
  check(
    '需求⑦：每张卡的标签行都画出了图标，且没有被全局隐藏态吃掉',
    labels.length === 3 && labels.every((l) => l.hasIcon && l.iconVisible),
    labels.map((l) => `${l.id}:${l.hasIcon ? (l.iconVisible ? 'icon✓' : 'icon✗隐藏') : '无图标'}`).join(' ')
  )
  check(
    '需求⑨：只有 C 位那张显示应用名称（后面两层只有图标）',
    labels.filter((l) => l.text.length > 0).length === 1 &&
      labels.find((l) => l.text.length > 0)?.depth === 0,
    labels.map((l) => `d=${l.depth}${l.text ? `「${l.text}」` : '（仅图标）'}`).join(' ')
  )
  check('每张卡都有标签行（不再只给一张）', labels.every((l) => l.hasLabel), JSON.stringify(labels.map((l) => l.hasLabel)))

  check('底部「x 个应用正在进行」文案已移除', (await page.locator('.switcher-count').count()) === 0)

  const trash = await page.evaluate(() => {
    const b = document.querySelector('.switcher-dock button')
    if (!b) return null
    const cs = getComputedStyle(b)
    const r = b.getBoundingClientRect()
    return {
      shared: b.classList.contains('glass-circle-btn'),
      w: Math.round(r.width),
      h: Math.round(r.height),
      radius: cs.borderRadius,
      blur: cs.backdropFilter || cs.webkitBackdropFilter,
      bg: cs.backgroundColor
    }
  })
  check(
    '删除按钮 = 通知中心同款磨砂圆钮（52×52 / blur24 / 8% 白）',
    !!trash && trash.shared && trash.w === 52 && trash.h === 52 && /blur\(24px\)/.test(trash.blur || '') && /rgba\(255, 255, 255, 0\.08\)/.test(trash.bg),
    JSON.stringify(trash)
  )

  /* ---- 第七轮·需求⑥：垃圾桶垂直位置对齐真机参考图（底边距屏幕底 ≈65px）----
     旧值 40px（= home inset 14 + DECK_GAP 26）偏矮。现在 DECK_GAP = 50 ⇒ 64px。
     同时校验「间距不再有两份来源」：.switcher-dock 的 bottom 必须等于
     home inset + DECK.DOCK_GAP，而不是 CSS 里的某个字面量。 */
  const dockPos = await page.evaluate(() => {
    const dock = document.querySelector('.switcher-dock')
    const btn = document.querySelector('.switcher-dock button')
    const hi = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--home-indicator-inset')) || 14
    const rect = btn.getBoundingClientRect()
    return {
      bottom: getComputedStyle(dock).bottom,
      gapFromBottom: window.innerHeight - rect.bottom,
      homeInset: hi,
      btnTop: rect.top,
      vh: window.innerHeight
    }
  })
  check(
    '需求⑥：垃圾桶底边距屏幕底 ≈65px（真机参考图；旧值 40px）',
    Math.abs(dockPos.gapFromBottom - 64) <= 2,
    `底边距屏幕底=${dockPos.gapFromBottom.toFixed(1)}px（目标 64 = homeInset ${dockPos.homeInset} + DOCK_GAP ${DECK.DOCK_GAP}）`
  )
  check(
    '需求⑥：dock 的 bottom 由 DECK.DOCK_GAP 唯一给出（CSS 里没有第二份副本）',
    Math.abs(parseFloat(dockPos.bottom) - (dockPos.homeInset + DECK.DOCK_GAP)) <= 0.5,
    `bottom=${dockPos.bottom} ≟ ${dockPos.homeInset + DECK.DOCK_GAP}px`
  )
}

/* ---- 修正 A/B/C（2026-09-12 第三轮：Ricky 提交参考视频后的布局修正）----
   A. 卡片整体在【删除按钮上方】居中 —— 判定：图标顶到状态栏底的留白 === 卡底到按钮顶的留白；
   B. 背景层与顶卡【上下居中对齐】—— 判定：所有层垂直中心一致，且上下内缩对称；
   C. 图标放大到 24px，并纳入整体居中的 blockH。 */
{
  const trashBox = await page.locator('.switcher-trash').boundingBox()
  const safeTopPx = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.querySelector('.screen')).getPropertyValue('--safe-top'))
  )
  const byIdx = [...rows].sort((a, b) => a.idx - b.idx)
  const focusCard = byIdx[0]
  const cardBottom = focusCard.y + focusCard.h
  const labelBox = await page.locator('.switcher-card-label').first().boundingBox()
  const iconBox = await page.evaluate(() => {
    const l = document.querySelector('.switcher-card-label')
    const el = l && l.firstElementChild
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }
  })

  const gapTop = labelBox.y - safeTopPx
  const gapBottom = trashBox.y - cardBottom
  check(
    '修正 A：图标行 + 卡片作为整体，在删除按钮上方居中',
    Math.abs(gapTop - gapBottom) <= 2.5,
    `上留白=${gapTop.toFixed(1)} 下留白=${gapBottom.toFixed(1)}（状态栏底=${safeTopPx} 按钮顶=${trashBox.y.toFixed(1)}）`
  )
  check(
    '修正 A：卡片整体已下移（旧版卡顶 84 / 卡底 680，上留白 84 vs 下留白 160 明显偏上）',
    focusCard.y > 130 && focusCard.y < 180,
    `卡顶=${focusCard.y.toFixed(1)} 卡底=${cardBottom.toFixed(1)}（第七轮 DOCK_GAP 26→50 后期望 ≈ 155 / 751）`
  )

  const centers = byIdx.map((r) => r.y + r.h / 2)
  check(
    '修正 B：所有卡片与顶卡上下居中对齐（垂直中心一致）',
    Math.max(...centers) - Math.min(...centers) <= 1,
    `中心=${centers.map((v) => v.toFixed(1)).join(' / ')}`
  )
  const insetsTop = byIdx.map((r) => r.y - focusCard.y)
  const insetsBot = byIdx.map((r) => cardBottom - (r.y + r.h))
  check(
    '修正 B：背景层上下内缩对称（不再整体上浮）',
    byIdx.every((_, i) => Math.abs(insetsTop[i] - insetsBot[i]) <= 1),
    `上内缩=${insetsTop.map((v) => v.toFixed(1)).join('/')} 下内缩=${insetsBot.map((v) => v.toFixed(1)).join('/')}`
  )

  check(
    '修正 C：应用图标放大到 24px（原 18px）',
    !!iconBox && Math.abs(iconBox.w - 24) <= 1.5 && Math.abs(iconBox.h - 24) <= 1.5,
    iconBox ? `图标 ${iconBox.w}×${iconBox.h}` : '未找到图标'
  )
  check(
    '修正 C：图标行高 24px（已纳入整体居中的 blockH）',
    Math.abs(labelBox.height - 24) <= 1.5,
    `label 高=${labelBox.height.toFixed(1)}`
  )
}

/* ---- 规则⑥⑦ 背景层差异位移实测（第六轮：逐帧量测参考视频后重定）----
   从静止（焦点=calculator）按住横拖半层（0.5 × SPAN），逐卡量位移：
     · 各层【同向】（都右移）、逐层递减 —— 成立；
     · 层间比例 = STAIR_DECAY（0.32），不再是第四轮的 8:3:2:1。

   第六轮为什么把 stair(1) 从 33px 提到 52px（Ricky 原话：「不是一次只能滑走一张的废物」）：
     逐帧量测参考视频（444×960 / 24fps / 271 帧）：
       新来卡窗口累积位移 51px，焦点卡窗口 145px，静止态槽距 55px
       → 「新来卡每滑一张右移 ≈ 0.19 卡宽」。
     第五轮把牵连删掉后，第 1 层的净位移被钉死在 stair(1) = 33px（0.12 卡宽），
     于是拖动时背景层几乎看不出在动 → 用户看到的是「只有顶卡在飞」。
     注意：「一整层的净位移 = stair(d) − stair(d−1)」这条数学关系没变
     （所以仍然不可能既叠加会归零的牵连、又不回退，见下方定律三），
     变的是【槽位间距本身】。

   为什么必须放弃 8:3:2:1（Ricky 第四轮写的比例）：
     「一整层的净位移」= stair(d) − stair(d−1)。而静止态的露出宽度把 stair(1) 钉死，
     要按 8:3:2:1 让第 1 层走 0.375 × 顶卡位移，就必须叠加「牵连」位移，
     而牵连必须在 u→1 时归零（层 1 得落到居中槽位 frontX）→ 数学上必然产生回退。
     第四轮实测回退 77px，正是 Ricky 第五轮反馈的「往右滑、卡片却在往左移动」。
     ⇒ 第五轮取「不得回退」为最高优先；第六轮改从【槽位间距】下手（不引入任何包络），
       既保住了零回退，又让背景层真的跟着走。 */
{
  const rest = await deck()
  const restX = Object.fromEntries(rest.map((r) => [r.id, r.x]))
  const startX = 150
  const px = Math.round(SPAN / 2)
  await page.mouse.move(startX, 500)
  await page.mouse.down()
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(startX + (px * i) / 20, 500, { steps: 1 })
    await page.waitForTimeout(8)
  }
  await page.waitForTimeout(80)
  const peak = await deck()
  // 拖回原位再松手，保证下一秒的断言从「焦点=calculator」这个已知状态出发
  for (let i = 20; i >= 0; i--) {
    await page.mouse.move(startX + (px * i) / 20, 500, { steps: 1 })
    await page.waitForTimeout(8)
  }
  await page.waitForTimeout(150)
  await page.mouse.up()
  await page.waitForTimeout(700)

  const moved = peak
    .filter((r) => r.idx <= 3) // 只取四个槽位（第 5 张可能在拖动中短暂进入 DOM）
    .map((r) => ({ id: r.id, idx: r.idx, d: r.x - (restX[r.id] ?? r.x) }))
    .sort((a, b) => a.idx - b.idx)
  check(
    '拖动期各层同向位移且逐层递减',
    moved.length >= 3 && moved.every((m, i) => (i === 0 ? m.d > 40 : m.d > 0 && m.d < moved[i - 1].d)),
    moved.map((m) => `L${m.idx}:${m.d.toFixed(1)}`).join(' ')
  )
  if (moved.length >= 3) {
    /* 只比【背景层】（L1 起）之间的比例：L0 是正在离场的顶卡，走的是线性斜坡
       （第六轮：exit × |a|，EXIT_POW = 1，与手指 1:1），与背景层的 stair 推进
       不是同一个函数，不该混在一个比例里。 */
    const bg = moved.slice(1).map((m) => m.d)
    const ratios = []
    for (let k = 1; k < bg.length; k++) ratios.push(bg[k] / bg[k - 1])
    const worst = ratios.length ? Math.max(...ratios.map((v) => Math.abs(v - STAIR_DECAY) / STAIR_DECAY)) : 1
    check(
      `背景层位移比例 ≈ stair 衰减 ${STAIR_DECAY}（实测 ${bg.map((v) => v.toFixed(1)).join(' : ')}，比例 ${ratios.map((v) => v.toFixed(3)).join(' : ')}）`,
      ratios.length >= 1 && worst <= 0.25,
      `最大偏差 ${(worst * 100).toFixed(0)}%（目标 ${STAIR_DECAY}；8:3:2:1 已证明与「不得回退」互斥，见上方注释）`
    )
  }
  check('半层拖动松手后回到原焦点（calculator 居中）', (await centeredId()) === 'calculator', `centered=${await centeredId()}`)
}

/* ---- 逐帧层级不变量：z 恒定 + 顶卡永远压在别人之上（规则①） ----
   旧版 z 跟「距焦点远近」算，拖到一半顶层卡会被下面那张盖住（Ricky：最顶部的卡片
   还能跑到下面去）。现在 z 只由列表索引决定 → 任意时刻「索引小的卡」都必须被
   elementFromPoint 命中，且 z 值全程不变。 */
await page.evaluate((cx) => {
  window.__inv = { n: 0, bad: [], zDrift: [], collide: [] }
  const tick = () => {
    const cards = [...document.querySelectorAll('.switcher-card.is-deck')]
    if (cards.length >= 2) {
      const rows = cards.map((c) => {
        const r = c.getBoundingClientRect()
        const cs = getComputedStyle(c)
        return {
          id: c.dataset.appId,
          idx: +c.dataset.index,
          d: +c.dataset.depth,
          z: +cs.zIndex,
          l: r.left,
          r: r.right,
          t: r.top,
          b: r.bottom
        }
      })
      window.__inv.n++
      // ① z 恒定：每张卡的 z 必须 === 10000 - 列表索引（与环境无关）
      for (const r of rows) {
        const expect = 10000 - ['calculator', 'camera', 'phone', 'clock', 'settings'].indexOf(r.id)
        if (r.z !== expect) window.__inv.zDrift.push(`${r.id} z=${r.z} 期望 ${expect}`)
      }
      // ② 背景层永不重叠：层深 ≥ 0 的卡按索引左边缘必须严格递减（间距 > 1.5px）
      const bg = rows.filter((r) => r.d >= 0.02).sort((a, b) => a.idx - b.idx)
      for (let k = 1; k < bg.length; k++) {
        const gap = bg[k - 1].l - bg[k].l
        if (gap < 1.5) window.__inv.collide.push(`${bg[k - 1].id}与${bg[k].id}间距 ${gap.toFixed(1)}px`)
      }
      // ③ 顶卡（z 最大）与任何有交集的卡，交集中点必须命中顶卡
      const top = rows.reduce((a, b) => (b.z > a.z ? b : a))
      for (const o of rows) {
        if (o === top) continue
        const l = Math.max(top.l, o.l)
        const rr = Math.min(top.r, o.r)
        const t = Math.max(top.t, o.t)
        const b = Math.min(top.b, o.b)
        if (rr - l < 20 || b - t < 20) continue
        const sx = (l + rr) / 2
        const sy = (t + b) / 2
        if (sx < 1 || sx > cx * 2 - 1) continue
        const hit = document.elementFromPoint(sx, sy)?.closest?.('.switcher-card')?.dataset?.appId
        if (hit && hit !== top.id) window.__inv.bad.push(`${top.id}(z${top.z}) 被 ${hit} 盖住`)
      }
    }
    requestAnimationFrame(tick)
  }
  tick()
}, screenCenterX)

// 按住横拖：分段移动后停住，读「手在拖、卡也在跟着动」的实时状态
async function holdDrag(fromX, toX) {
  await page.mouse.move(fromX, 500)
  await page.mouse.down()
  const steps = 24
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(fromX + (toX - fromX) * (i / steps), 500, { steps: 1 })
    await page.waitForTimeout(10)
  }
  await page.waitForTimeout(120)
  const out = Object.fromEntries((await deck()).map((r) => [r.id, r.x]))
  return out
}

// ① 手往右拖 → 每张卡都必须往右走
let beforeXs = Object.fromEntries((await deck()).map((r) => [r.id, r.x]))
let during = await holdDrag(140, 370)
{
  // 只比对「拖动前就在场」的卡：拖动中新进入 DOM 的卡没有基准位移可比
  const moved = Object.entries(during)
    .filter(([id]) => beforeXs[id] !== undefined)
    .map(([id, x]) => ({ id, d: x - beforeXs[id] }))
  check(
    '横滑：手往右拖 → 每张卡都往右走（含最深层；第六轮最深层只有 ≈5px，故门槛取 3）',
    moved.length > 0 && moved.every((m) => m.d > 3),
    moved.map((m) => `${m.id}${m.d > 0 ? '+' : ''}${m.d.toFixed(0)}`).join(' ')
  )
}
await page.mouse.up()
await page.waitForTimeout(900)
check('右滑吸附后居中卡 = camera（第 2 张）', (await centeredId()) === 'camera',
  `centered=${await centeredId()} · mode=${JSON.stringify(await page.evaluate(() => window.__switcherMode))}` +
  ` · settle=${JSON.stringify(await page.evaluate(() => window.__switcherSettle))}`)

// ② 旧焦点卡（calculator）不再「一张就飞出屏」，而是停在右屏边内侧露出
//    （此处是 0.98 层的拖动中途态，只断言「没被甩出屏」这个不变量；
//     静止态的精确契约由下面第八轮需求②的块负责：左缘 322.5px / 露出 107.5px）
{
  const r = await deck()
  const gone = r.find((x) => x.id === 'calculator')
  const peek = gone ? screenBox.width - gone.x : -1
  check(
    '旧焦点卡停在右屏边内侧露出，且仍在 DOM 里保持最上层（拖到 0.98 层时 ≈110px）',
    !!gone && peek > 60,
    gone ? `x=${gone.x.toFixed(1)} 屏宽=${screenBox.width} 露出=${peek.toFixed(1)}px` : '未渲染'
  )
}

// ③ 手往左拖 → 每张卡都必须往左走
beforeXs = Object.fromEntries((await deck()).map((r) => [r.id, r.x]))
during = await holdDrag(370, 140)
{
  const moved = Object.entries(during)
    .filter(([id]) => beforeXs[id] !== undefined)
    .map(([id, x]) => ({ id, d: x - beforeXs[id] }))
  check(
    '横滑：手往左拖 → 每张卡都往左走（含最深层，门槛同 3px）',
    moved.length > 0 && moved.every((m) => m.d < -3),
    moved.map((m) => `${m.id}${m.d > 0 ? '+' : ''}${m.d.toFixed(0)}`).join(' ')
  )
}
await page.mouse.up()
await page.waitForTimeout(900)
check('左滑松手吸附回原卡（calculator 居中）', (await centeredId()) === 'calculator', `centered=${await centeredId()}`)

// ④ 快速右滑（单层位移）→ 居中 camera
await page.mouse.move(215, 500)
await page.mouse.down()
await page.mouse.move(380, 500, { steps: 3 })
await page.mouse.up()
await page.waitForTimeout(900)
check('快滑一层后居中卡 = camera', (await centeredId()) === 'camera', `centered=${await centeredId()}`)

const hs = await page.evaluate(() => window.__inv)
check(
  '横滑全程「顶卡永远压在别人之上」（层级不错乱）',
  hs.bad.length === 0 && hs.n > 30,
  `采样 ${hs.n} 帧，违反 ${hs.bad.length} 次${hs.bad.length ? '：' + hs.bad.slice(0, 3).join('；') : ''}`
)
check(
  '横滑全程每张卡的 z 恒定不变（层级关系不变）',
  hs.zDrift.length === 0,
  `偏离 ${hs.zDrift.length} 次${hs.zDrift.length ? '：' + hs.zDrift.slice(0, 3).join('；') : ''}`
)
check(
  '横滑全程背景层不互相重叠（阶梯始终成立）',
  hs.collide.length === 0,
  `重叠 ${hs.collide.length} 次${hs.collide.length ? '：' + hs.collide.slice(0, 3).join('；') : ''}`
)

// ---- 点卡片恢复（快滑后居中的是 camera）----
await page.locator('.switcher-card[data-app-id="camera"]').click()
await page.waitForTimeout(600)
s = await S()
check('点卡片恢复应用 + 切换器关闭', s.switcher === false && s.base === 'app' && s.app === 'camera', JSON.stringify(s))

/* ---- 第七轮·需求⑪：切换器里点空白 → 回桌面（不是回到原来的应用）----
   旧实现走 system.closeSwitcher()，它只回到 baseLayer —— 从应用内进来时 baseLayer 还是
   'app'，于是「点空白」又回到了原来那个应用。正确行为与 iOS 一致：回桌面。
   判据：baseLayer=home、activeAppId 清空、**最近任务列表保持不动**（点空白不是清理后台）。 */
{
  // 前置：此时 base='app' / app='camera'，从应用内再上滑进切换器
  await fastPauseSwipe()
  s = await S()
  const recentBefore = s.recent.slice()
  check('需求⑪ 前置：从应用内已进入切换器（baseLayer 仍为 app）', s.switcher === true && s.base === 'app', JSON.stringify(s))

  // 点空白：卡片上方、标签行以上的区域
  await page.mouse.click(215, 90)
  await page.waitForTimeout(800)
  s = await S()
  check(
    '需求⑪：点空白 → 回桌面（baseLayer=home / activeAppId 清空），且最近任务不被清空',
    s.base === 'home' && s.app === null && s.switcher === false && JSON.stringify(s.recent) === JSON.stringify(recentBefore),
    JSON.stringify(s)
  )
}

// ---- 再进切换器，上滑移除当前应用（camera）----
await fastPauseSwipe()
s = await S()
check('快速上滑 + 停住 400ms → 进切换器（松手不带停住前的旧速度）', s.switcher === true, `switcher=${s.switcher}`)

{
  const cardLoc = page.locator('.switcher-card[data-app-id="camera"]')
  const card = await cardLoc.boundingBox()
  const cx = card.x + card.width / 2
  const cy = card.y + card.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx, cy - 220, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(900)
}
s = await S()
check(
  '上滑移除当前应用 → 列表少一个且回桌面',
  s.recent.length === 4 && !s.recent.includes('camera') && s.base === 'home',
  JSON.stringify(s)
)

// ---- 快滑不进切换器（回弹回桌面）----
await page.evaluate(() => window.__system.openApp('notes'))
await page.waitForTimeout(400)
await flickSwipe()
s = await S()
check('快速上滑 = 回桌面（不进切换器）', s.switcher === false && s.base === 'home', JSON.stringify(s))

/* ================== 第七轮·批次 2 ==================
   需求⑫：应用内上滑进多任务 —— 跟手移动 +【停驻期间左侧卡片就进场】+ 松手丝滑归位
   需求⑧：上滑移除卡片时卡片【跟手上移】（旧实现拖动全程零位移） */

/* 需求⑫-a：停驻期间（手指仍按住、appSwitcherOpen 还是 false）邻居卡必须已经在场。
   参考视频 981c9428…mp4 逐帧：f52–f65 跟手上滑 → f66–f102 停住（仍只有一张卡）
   → f103–f116 左侧邻居自左侧滑入并就位。旧实现只在松手那一帧一次性铺出整套 deck，
   于是松手瞬间三张卡「啪」地出现 + 标签行半透明淡入 = Ricky 说的「卡片闪一下」。 */
await page.evaluate(() => window.__system.openApp('camera'))
await page.waitForTimeout(500)
{
  const cx = 215
  const startY = 925
  await page.mouse.move(cx, startY)
  await page.mouse.down()
  for (let i = 1; i <= 30; i++) { await page.mouse.move(cx, startY - i * 14, { steps: 1 }); await page.waitForTimeout(14) }
  // 停住 500ms（dwell 120ms 就该触发预提交；留足滑入 + 淡入的 320ms）
  for (let i = 0; i < 10; i++) { await page.mouse.move(cx, startY - 420, { steps: 1 }); await page.waitForTimeout(50) }
  const hold = await page.evaluate(() => {
    const r = (el) => {
      const b = el.getBoundingClientRect()
      /* ownX = 卡【自身】的 track 坐标（矩阵 e；translate3d 写在 scale 左边，不被缩放）。
         ⚠️ 第十六轮起必须同时留这个量 —— 绝对屏幕坐标会被容器级群组变换映射。 */
      const m = new DOMMatrix(getComputedStyle(el).transform)
      return { x: +b.x.toFixed(1), w: +b.width.toFixed(1), ownX: +m.e.toFixed(2), op: +getComputedStyle(el).opacity }
    }
    const deck = [...document.querySelectorAll('.switcher-card.is-deck')].map((c) => ({
      id: c.dataset.appId,
      depth: c.dataset.depth,
      ...r(c),
      bodyOp: +getComputedStyle(c.querySelector('.switcher-card-body')).opacity,
      labelText: c.querySelector('.switcher-card-label')?.textContent.trim() || ''
    }))
    const f = document.querySelector('.switcher-card.is-follow')
    return {
      open: window.__system.appSwitcherOpen,
      deck,
      follow: !!f,
      /* 第九轮（需求①）：标签行【搬到跟手卡上】—— 它是卡节点的子节点，
         所以图标与卡永远一起位移/缩放（旧实现标签留给堆叠前卡，
         入场上滑 + 横向漂移时「卡片被拖走、图标留在槽位」= Ricky 参考图）。 */
      followLabel: f?.querySelector('.switcher-card-label')?.textContent.trim() || '',
      followBox: f ? (() => { const b = f.getBoundingClientRect(); return { x: +b.x.toFixed(1), w: +b.width.toFixed(1) } })() : null,
      followLabelX: f ? +(f.querySelector('.switcher-card-label')?.getBoundingClientRect().x ?? NaN).toFixed(1) : null,
      dock: !!document.querySelector('.switcher-dock')
    }
  })
  const front = hold.deck.find((c) => c.depth === '0')
  const nb = hold.deck.filter((c) => c.depth !== '0')
  check(
    '需求⑫：手指停驻期间（尚未松手）邻居卡已经进场——2 张背景卡已就位且完全不透明',
    hold.open === false && nb.length === 2 && nb.every((c) => c.op === 1),
    `open=${hold.open} 邻居=${nb.map((c) => `${c.id}@x${c.x}/op${c.op}`).join(' ')}`
  )
  /* 前卡的透明度必须【只下沉到卡体】：卡根留 1 才能让标签行在停驻期就在场。
     若把透明度挂在卡根上（旧做法），停驻期没有「图标 + 应用名」，到交接那一帧才冒出来。
     第九轮（需求①）改口径：停驻期的「图标 + 应用名」现在挂在【跟手卡】上，
     堆叠前卡那一行必须【让位】（两边都画 = 屏幕上同时出现两份图标）。 */
  check(
    '需求⑫/③：停驻期间跟手卡仍在场、堆叠前卡只淡【卡体】（卡根 op=1）',
    hold.follow === true && !!front && front.bodyOp === 0 && front.op === 1 && hold.dock === true,
    `follow=${hold.follow} front 卡根op=${front?.op} 卡体op=${front?.bodyOp} dock=${hold.dock}`
  )
  check(
    '需求①：停驻期的「图标 + 应用名」挂在【跟手卡】上，且与卡左缘对齐（不再留在槽位）',
    hold.followLabel.length > 0 && hold.followLabelX !== null &&
      Math.abs(hold.followLabelX - hold.followBox.x) <= 1 &&
      front?.labelText === '',
    `跟手卡标签="${hold.followLabel}" @x=${hold.followLabelX} vs 卡左缘=${hold.followBox?.x}（差 ${(hold.followLabelX - hold.followBox.x).toFixed(1)}px）；` +
      `堆叠前卡标签="${front?.labelText}"（期望空 = 已让位）`
  )

  /* 需求⑫-b：松手交接必须【瞬时】—— 不允许出现「跟手卡已卸载、堆叠前卡还没变实」的中间帧。
     逐帧采样（rAF）：跟手卡消失那一帧，前卡的 computed opacity 必须已经是 1。
     旧实现这里会露出 op 0.065 → 1 的 220ms 淡入，正是「卡片闪一下」。 */
  await page.evaluate(() => {
    window.__handoffTL = []
    let k = 0
    const tick = () => {
      const f = document.querySelector('.switcher-card.is-follow')
      const c0 = document.querySelector('.switcher-card.is-deck[data-depth="0"]')
      window.__handoffTL.push({ f: !!f, op: c0 ? +getComputedStyle(c0).opacity : null })
      if (++k < 120) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await page.mouse.up()
  await page.waitForTimeout(1400)
  const hs = await page.evaluate(() => window.__handoffTL)
  const iHandoff = hs.findIndex((r) => !r.f) // 跟手卡消失的第一帧
  const bad = hs.filter((r, i) => i >= iHandoff && iHandoff >= 0 && r.op !== null && r.op < 0.999)
  check(
    '需求⑫/③：松手交接零闪断（跟手卡消失那一帧前卡已完全不透明，没有淡入中间帧）',
    iHandoff > 0 && bad.length === 0,
    `交接帧 index=${iHandoff}；交接后仍 <1 的帧数=${bad.length}${bad.length ? ` 首个 op=${bad[0].op}` : ''}`
  )
  /* 停驻期间邻居卡的位姿必须就是【松手后的终点槽位】——
     否则「进场」只是先冒出来、松手再挪一段，观感依旧会跳。
     ⚠️ 第十六轮改口径（不能用绝对屏幕坐标了）：整组现在会随跟手卡一起缩放/位移
        （.switcher-deck-group 的相似变换），而停驻期的 p 可能 >1（滑过满量程）
        ⇒ 邻居的屏幕 x 与落位后天然不同（实测 49.6 → 25.3，k≈0.872）。
        而那个差异【正是】「底部卡片与手里的卡同步移动」本身，不是「再挪一段」。
     改成两条更强的判据（都与群组变换无关）：
       ① 卡【自身】的 track 坐标（矩阵 e）必须一致 —— 它自己的入场过渡已经跑完、落在槽位；
       ② 相对前卡、按前卡宽度【归一化】的偏移必须一致 —— 说明松手只是解除容器映射，
          邻居相对前卡不会再挪一段（相似变换会把偏移与宽度同比例缩放 ⇒ 比值不变）。 */
  const nbAfter = await page.evaluate(() =>
    [...document.querySelectorAll('.switcher-card.is-deck')]
      .filter((c) => c.dataset.depth !== '0')
      .map((c) => {
        const b = c.getBoundingClientRect()
        const m = new DOMMatrix(getComputedStyle(c).transform)
        return { id: c.dataset.appId, x: +b.x.toFixed(1), w: +b.width.toFixed(1), ownX: +m.e.toFixed(2) }
      })
  )
  const frontAfter = await page.evaluate(() => {
    const c = document.querySelector('.switcher-card.is-deck[data-depth="0"]')
    const b = c.getBoundingClientRect()
    return { x: +b.x.toFixed(1), w: +b.width.toFixed(1) }
  })
  const rel = (a, f) => (!!a && !!f && f.w ? (a.x - f.x) / f.w : NaN)
  const ownSame =
    nb.length === nbAfter.length &&
    nb.every((c) => Math.abs((nbAfter.find((a) => a.id === c.id)?.ownX ?? 1e9) - c.ownX) < 0.05)
  const relSame =
    nb.length === nbAfter.length &&
    nb.every((c) => {
      const a = nbAfter.find((x) => x.id === c.id)
      return !!a && Math.abs(rel(a, frontAfter) - rel(c, front)) < 0.002
    })
  check(
    '需求⑫：停驻期间邻居卡已经在【终点槽位】（与松手后完全一致）',
    ownSame && relSame,
    `停驻期 ${nb.map((c) => `${c.id}:own${c.ownX}/rel${rel(c, front).toFixed(4)}`).join(' ')} | ` +
      `松手后 ${nbAfter.map((a) => `${a.id}:own${a.ownX}/rel${rel(a, frontAfter).toFixed(4)}`).join(' ')}` +
      `（判 own 一致=${ownSame}、rel 一致=${relSame}）`
  )
}

/* 需求⑧：上滑移除时卡片跟手上移。
   旧实现在 onPointerMove 里对 v 模式直接 return，整段手势卡片零纵向位移，
   只有松手越过 110px 才瞬间飞出。 */
{
  // 先确认「应用内 + 切换器已打开」（上一条用例结束时切换器是开着的，点一张卡回到应用）
  const b0 = await page.locator('.switcher-card.is-deck[data-depth="0"]').boundingBox()
  if (b0) { await page.mouse.click(b0.x + b0.width / 2, b0.y + b0.height / 2); await page.waitForTimeout(800) }
  await fastPauseSwipe()
  const box = await page.locator('.switcher-card.is-deck[data-depth="0"]').boundingBox()
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.move(cx, cy)
  await page.mouse.down()
  for (let i = 1; i <= 8; i++) { await page.mouse.move(cx, cy - i * 13, { steps: 1 }); await page.waitForTimeout(16) }
  const mid = await page.evaluate(() => {
    const c = document.querySelector('.switcher-card.is-deck[data-depth="0"]')
    const body = c.querySelector('.switcher-card-body')
    return {
      y: +c.getBoundingClientRect().y.toFixed(1),
      op: +getComputedStyle(c).opacity,
      bop: body ? +getComputedStyle(body).opacity : null
    }
  })
  /* ⚠️ 第十二轮（需求②）改口径：跟手期【只位移、不变淡】。
     旧断言是 `mid.op < 0.9` —— 它量的正是 stackStyle 里那条
     `opacity = min(opacity, 1 + ddy/320)`，Ricky 本轮明确要求取消。
     改前这里的 op ≈ 0.675；改后恒 1。 */
  check(
    '需求⑧：上滑 104px 时被拖的卡片【跟手上移】（Δy ≈ 104px）；第十二轮（需求②）起不再随高度变淡',
    Math.abs(mid.y - (box.y - 104)) <= 3 && mid.op > 0.99,
    `起点 y=${box.y.toFixed(1)} → 拖动中 y=${mid.y}（期望 ≈ ${(box.y - 104).toFixed(1)}）op=${mid.op.toFixed(2)}（第十二轮起恒 1）`
  )
  /* 第十二轮（需求②的连带修正）：跟手卡必须在【上滑删卡】期间让位给堆叠卡，
     否则可见的跟手卡冻在槽位、真正跟手上移的堆叠卡卡体又是 opacity 0 ⇒ 整段手势零视觉反馈。
     旧实现在这里量到的 bop = 0（不可见）。 */
  check(
    '需求⑧（第十二轮补）：上滑删卡期间【跟手卡让位】且堆叠前卡卡体可见（bop 恒 1）',
    mid.bop === 1,
    `堆叠前卡卡体 opacity = ${mid.bop}（期望 1；旧实现被跟手卡顶替成 0 ⇒ 拖动全程看不见）`
  )
  // 未过阈值 → 回弹归位
  await page.mouse.up()
  await page.waitForTimeout(800)
  const back = await page.evaluate(() => {
    const c = document.querySelector('.switcher-card.is-deck[data-depth="0"]')
    return c ? { y: +c.getBoundingClientRect().y.toFixed(1), op: +getComputedStyle(c).opacity } : null
  })
  check(
    '需求⑧：上滑不足阈值（104px < 110px）松手 → 卡片回弹归位且没有删除',
    !!back && Math.abs(back.y - box.y) <= 2 && back.op > 0.99,
    back ? `回到 y=${back.y}（期望 ${box.y.toFixed(1)}）op=${back.op.toFixed(2)}` : '卡片消失了（不该删）'
  )
}

/* 本段用例是从【应用内】上滑进来的（base='app'），后续的桌面路径用例需要 base='home'。
   用 exitSwitcherToHome 复位（它不清最近任务），保持与插入前一致的初始态。 */
await page.evaluate(() => window.__system.exitSwitcherToHome())
await page.waitForTimeout(500)
s = await S()
check('批次 2 用例复位：回桌面（后续桌面路径用例的前置条件）', s.base === 'home' && s.switcher === false, JSON.stringify(s))

/* ---- 第五轮·问题②：桌面上滑期必须有【可见反馈】（跟手横移）
   Ricky 第五轮原话：「先从桌面上滑的手感非常差，很难激活多任务。」
   根因 A：deck 被 `v-if="system.appSwitcherOpen"` 门控，而桌面路径没有跟手卡
   → 上滑全程屏幕上一张卡都没有，只剩一层黑遮罩 = 盲滑（修复前实测 p≈0.58 时 deckCount=0）。
   现在手势期间就渲染 deck，入场进度直接跟随 switcherProgress。

   第八轮（需求⑤）把入场方向从「自下方 30% 上浮」改成「自左侧横向平移」——
   参考视频 52b4f2fa…mp4 逐帧：整组卡片刚性平移（C 卡右缘 30 → 375 = 345px = 0.777 屏宽，
   左邻卡边缘与之严格同步、间距恒 113px）⇒ 是整体平移，不是逐卡缩放。
   ⚠️ 旧断言写的是「随上滑【单调升起】（y 递减）」，改向之后 y 恒为 155 ⇒ **恒真的假通过**，
      必须改成断言 x（单调右移 + 起点 = frontX − 0.78 屏宽）。
   判据：上滑过程中卡片必须在屏上，且随进度【单调右移 + 单调变亮】。 */
{
  const trace = []
  await page.mouse.move(215, 925)
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(215, 925 - i * 14, { steps: 1 })
    await page.waitForTimeout(45)
    trace.push(
      await page.evaluate(() => {
        const cards = [...document.querySelectorAll('.switcher-card.is-deck')].map((c) => {
          const m = new DOMMatrixReadOnly(getComputedStyle(c).transform)
          return {
            i: +c.dataset.index,
            x: +m.e.toFixed(1),
            y: +c.getBoundingClientRect().y.toFixed(1),
            op: +getComputedStyle(c).opacity
          }
        })
        const dim = document.querySelector('.switcher-dim')
        return {
          p: +window.__system.switcherProgress.toFixed(3),
          n: cards.length,
          c0: cards.find((c) => c.i === 0) || null,
          c1: cards.find((c) => c.i === 1) || null,
          dim: dim ? +getComputedStyle(dim).opacity : null
        }
      })
    )
  }
  const seen = trace.filter((t) => t.n > 0 && t.c0)
  const moves = seen.every((t, k) => k === 0 || t.c0.x >= seen[k - 1].c0.x - 0.6)
  const brightens = seen.every((t, k) => k === 0 || t.c0.op >= seen[k - 1].c0.op - 0.02)
  const dimSync = seen.every((t) => Math.abs(t.dim - t.p) < 0.02)
  const mid = trace[Math.floor(trace.length / 2)]
  check(
    '第五轮·问题②：桌面上滑过程中屏幕上有卡片（不再是盲滑）',
    seen.length === trace.length && mid.n >= 3,
    `${trace.length} 个采样点全部有卡；中途卡数=${mid.n}；进度 ${trace[0].p} → ${trace[trace.length - 1].p}`
  )
  check(
    '第五轮·问题②：卡片随上滑【单调右移 + 单调变亮】，遮罩同步（跟手）',
    seen.length >= 8 && moves && brightens && dimSync,
    `x: ${seen[0]?.c0?.x} → ${seen[seen.length - 1]?.c0?.x}；` +
      `opacity: ${seen[0]?.c0?.op} → ${seen[seen.length - 1]?.c0?.op}；遮罩与进度同步=${dimSync}`
  )
  /* 需求⑤：入场是【整组刚性平移】—— 起点在左侧 0.78 屏宽处（每张卡同一条轨迹），
     且相邻两卡的间距（属于静态槽位几何）在整段入场里恒定不变。 */
  const enterDx = Math.round(screenBox.width * DECK.EXIT_SLIDE_FRAC)
  const first = seen.find((t) => t.c0 && t.c1 && t.p > 0 && t.p < 0.35)
  const gaps = seen.filter((t) => t.c0 && t.c1).map((t) => +(t.c1.x - t.c0.x).toFixed(1))
  const gapSpread = gaps.length ? Math.max(...gaps) - Math.min(...gaps) : 999
  const c0Min = Math.min(...seen.map((t) => t.c0.x))
  check(`需求⑤：桌面入场是【自左侧 ${enterDx}px 处横向滑入】（旧版是自下方 30% 上浮）`,
    !!first && c0Min <= -enterDx * 0.45 && gapSpread <= 1.5,
    `入场 x 最小 ${c0Min}（槽位 77.5 − ${enterDx}×(1−e)）；` +
      `相邻卡间距全程波动 ${gapSpread.toFixed(1)}px（≤1.5 ⇒ 刚性平移而非逐卡缩放）`)
  await page.mouse.up()
  await page.waitForTimeout(700)
  await page.evaluate(() => {
    if (window.__system.appSwitcherOpen) window.__system.closeSwitcher()
  })
  await page.waitForTimeout(500)
}

// ---- 桌面路径：从桌面直接上滑停驻开切换器（卡片下场后就位）----
await fastPauseSwipe()
s = await S()
check('桌面直接上滑停驻 → 开切换器（无前台应用可缩放）', s.switcher === true && s.base === 'home', JSON.stringify(s))
await page.waitForTimeout(1000)
{
  const rows = await deck()
  const front = rows.reduce((a, b) => (Math.abs(b.depth) < Math.abs(a.depth) ? b : a), rows[0])
  check(
    '桌面路径渲染 3 层（第七轮）、焦点层居中、无横向偏移',
    rows.length === 3 && Math.abs(front.cx - screenCenterX) <= 2,
    `${rows.length} 层：${rows.map((r) => `${r.id}@${r.x.toFixed(0)}`).join(' ')}`
  )
  const opacities = await page.evaluate(() =>
    [...document.querySelectorAll('.switcher-card.is-deck')].map((c) => +getComputedStyle(c).opacity)
  )
  check('桌面入场结束后全部卡片可见（无残留 opacity 0）', opacities.every((o) => o === 1), opacities.join('/'))
}

/* ---- 修正 D（2026-09-12 第三轮）：松手吸附的连续性与弹性 ----
   抽帧量化参考视频得到的目标：τ ≈ 110ms 的缓出 + 到位时约 6.7% 的轻微过冲回弹。
   放在脚本最末：此处状态干净（桌面路径刚打开、焦点 = 0、4 层齐全），不影响任何后续断言。
   守两条可回归的行为不变量：
     ① 无硬跳变 —— 任意相邻帧、任意相邻两层，间距变化 < 10px
        （旧实现松手瞬间把牵连量硬置零、同时关掉 CSS transition → 一帧 30px+ 的突变）；
     ② 轻微过冲 —— 快甩后新焦点卡越过终点再回落（旧版 ios-deck 是 ζ=1.0 临界阻尼、无弹性）。
   ⚠️ 第十一轮改口径：② 现在只对【快甩】成立。慢滑（|v| < FLICK_V_MIN）第十一轮起
      改走 ios-deck-settle 且不注入速度 ⇒ 位移段严格单调、不得有过冲（见下方第十一轮块）。 */
{
  const startX = 110
  const slowPx = Math.round(SPAN * 0.42) // 明显不足半层 → 松手必回原位
  const flickPx = Math.round(SPAN * 0.62) // 过半 → 必翻一层

  // ---- ① 慢拖 0.42 层（牵连明显）→ 停 150ms → 松手 ----
  await page.evaluate(() => {
    window.__d4 = []
    window.__d4Stop = false
    const tick = () => {
      if (window.__d4Stop) return
      const cards = [...document.querySelectorAll('.switcher-card.is-deck')]
      if (cards.length >= 2) {
        window.__d4.push(
          cards.map((el) => ({
            i: +el.dataset.index,
            x: +new DOMMatrixReadOnly(getComputedStyle(el).transform).e.toFixed(2)
          }))
        )
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
  await page.mouse.move(startX, 500)
  await page.mouse.down()
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(startX + (slowPx * i) / 20, 500, { steps: 1 })
    await page.waitForTimeout(8)
  }
  await page.waitForTimeout(150)
  await page.mouse.up()
  await page.waitForTimeout(700)
  const trace = await page.evaluate(() => { window.__d4Stop = true; return window.__d4 })

  /* 按 data-index 对齐算「相邻两层间距」的逐帧序列。
     卡片会在拖动中进出 DOM（数组长度变化），按下标比较会错位 —— 必须按 index 配对。 */
  const gapsOf = (sample) => {
    const m = new Map()
    const byI = new Map(sample.map((r) => [r.i, r.x]))
    for (const r of sample) {
      const nx = byI.get(r.i + 1)
      if (nx != null) m.set(r.i, r.x - nx)
    }
    return m
  }
  let maxJump = 0
  let jumpAt = -1
  for (let i = 1; i < trace.length; i++) {
    const a = gapsOf(trace[i - 1])
    const b = gapsOf(trace[i])
    for (const [k, v] of b) {
      if (!a.has(k)) continue
      const d = Math.abs(v - a.get(k))
      if (d > maxJump) {
        maxJump = d
        jumpAt = i
      }
    }
  }
  const mid = trace[Math.floor(trace.length * 0.4)]
  const peakGap = mid ? gapsOf(mid).get(0) : null

  /* 第五轮换判据：原判据是「任意相邻帧的层间距变化 < 10px」，它把【弹簧正常的加速段】
     也算成跳变 —— 松手后 focus 从 0.42 弹回 0，顶卡要回走 234×0.42 ≈ 98px
     （第六轮线性斜坡；第五轮是 378×0.42^1.6 ≈ 94px，量级相同），
     由 ios-deck（τ≈110ms）推进，最快一帧本来就有 12.8px。那不是硬跳变（位置连续），
     只是速度高。真正要守的不变量是【连续性 / 无瞬变】，判据应该与尺度无关：
       单帧位移 ÷ 该卡整段总位移 —— 硬跳变（旧版把牵连硬置零）会一次吃掉 ~100%，
       弹簧推进则均匀摊在十几帧上。这里要求 < 20%。 */
  const byCard = new Map()
  for (const sample of trace) {
    for (const r of sample) {
      if (!byCard.has(r.i)) byCard.set(r.i, [])
      byCard.get(r.i).push(r.x)
    }
  }
  let worstShare = 0
  let worstCard = -1
  let worstStep = 0
  for (const [i, xs] of byCard) {
    if (xs.length < trace.length * 0.6) continue // 只看全程在 DOM 里的卡
    const travel = Math.max(...xs) - Math.min(...xs)
    if (travel < 20) continue
    let step = 0
    for (let k = 1; k < xs.length; k++) step = Math.max(step, Math.abs(xs[k] - xs[k - 1]))
    const share = step / travel
    if (share > worstShare) {
      worstShare = share
      worstCard = i
      worstStep = step
    }
  }
  /* 阈值 20% → 40%（2026-09-13）。
     这条判据的本意是抓「松手时包络被硬置零」——那种硬跳变【一帧吃掉整段位移】，
     share ≈ 100%。但它对采样帧率敏感：同一份代码、同一次拖动，
     74 帧的轨迹里最大单帧占 11%，48 帧的轨迹里占 22%（实测两个 dev server 端口上
     逐条对比），只因为每帧摊到的位移不同。20% 会因此假失败。
     40% 仍与「硬跳变 ≈100%」留出 2.5 倍余量，不会再误报。
     （尺度无关的写法见 skill 4.9；这里保留比值判据、只放宽阈值，避免再引入一条曲线拟合。） */
  check(
    '修正 D① / 第五轮：松手无硬跳变（位移连续，单帧最多占整段位移的 40%）',
    worstCard >= 0 && worstShare < 0.4,
    `最大单帧位移占比=${(worstShare * 100).toFixed(0)}%（卡 ${worstCard}，单帧 ${worstStep.toFixed(1)}px）` +
      ` · 层间距最大单帧变化=${maxJump.toFixed(1)}px（第 ${jumpAt}/${trace.length} 帧，属弹簧加速段）` +
      ` · 拖动中最大层间距=${peakGap != null ? peakGap.toFixed(1) : '?'}px`
  )

  // ---- ② 快甩 0.62 层 → 采样第 2 张卡的 x，看是否越过终点再回落 ----
  await page.evaluate(() => {
    window.__d4b = []
    window.__d4bStop = false
    const tick = () => {
      if (window.__d4bStop) return
      const c = document.querySelector('.switcher-card.is-deck[data-index="1"]')
      if (c) window.__d4b.push(+new DOMMatrixReadOnly(getComputedStyle(c).transform).e.toFixed(2))
      requestAnimationFrame(tick)
    }
    tick()
  })
  await page.mouse.move(startX, 500)
  await page.mouse.down()
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(startX + (flickPx * i) / 6, 500, { steps: 1 })
    await page.waitForTimeout(6)
  }
  await page.mouse.up()
  await page.waitForTimeout(800)
  const ft = await page.evaluate(() => { window.__d4bStop = true; return window.__d4b })
  if (ft.length > 12) {
    const peak = Math.max(...ft)
    const iPeak = ft.indexOf(peak)
    const finalX = ft[ft.length - 1]
    check(
      '修正 D②（第十一轮收窄到快甩）：快甩松手吸附带轻微过冲回弹（ζ=0.65，不是临界阻尼的死板收尾）',
      peak > finalX + 3 && iPeak < ft.length - 3,
      `终点 x=${finalX} 峰值 x=${peak} 过冲=${(peak - finalX).toFixed(1)}px（峰值在第 ${iPeak}/${ft.length} 帧）`
    )
  } else {
    check(
      '修正 D②（第十一轮收窄到快甩）：快甩松手吸附带轻微过冲回弹（ζ=0.65，不是临界阻尼的死板收尾）',
      false,
      `采样不足 ${ft.length}`
    )
  }
}

/* ---- 第十一轮（2026-09-13）：慢滑松手【不得有多余回弹】----
   Ricky 原话：「慢滑滑动卡卡片多了一个不必要的回弹」。

   取证（/tmp/vwork/r11/probe-slow.mjs，改前逐帧）：
     · 慢滑翻一张（0.65 层，停住再松手、零动量） 过冲 +5.0px（占行程 5.8%）
     · 慢滑翻一张（0.55 层，松手时仍在动）       过冲 +6.5px
     · 慢滑连翻两张（1.55 层，仍在动）           过冲 +6.5px
     · 慢滑不翻卡（0.35 层）                     0.00px ← 目标 = 0 是下界，poseFocus = max(0, focus) 钳掉了
     · 快甩（0.62 层 / 6 步，v = 5.6 层/s）      过冲 +12.6px ← 动量，必须保留
     更阴的副作用：ζ=0.65 会来回穿过整卡边界 ⇒ 第 4 张卡被 deckVisible 剔除又加回
     （实测「卡3×2段」/「卡4×2段」），观感上就是「多闪了一下」。
   根因：settleFocus 的【非快甩分支】也用了 ios-deck（ζ=0.65 ⇒ 阶跃过冲 6.7%），
        还把慢速松手的残余速度注入弹簧。
   改法：非快甩 → ios-deck-settle（同 ω_n = 14、ζ = 1.0 临界阻尼）+ 不注入速度
        ⇒ v0 = 0 的临界阻尼在数学上严格单调（也不会再有零穿越导致的 DOM 闪断）。

   两条契约用【同一把尺】量同一件事（松手后吸附段的过冲），期望值相反：
     ① 慢滑翻一张 → 过冲 ≤ 1.5px、符号反转 ≤ 1 次；
     ② 快甩翻一张 → 过冲 > 3px。
   判据定义（与探针 overshoot2.mjs 同源）：
     过冲 = max over 吸附段采样 of (x − 终值) × 运动方向；终值 = 末 12% 采样的均值。
   ⚠️ 终值一定要取末段均值，不能取 max：x 在收尾还有 0.1~0.3px 的爬行（浮点/取整），
      用 max 当终值会把那点爬行算成「反向过冲」。 */
{
  const traceSettle = async (sel, drag) => {
    await page.evaluate((s) => {
      window.__r11 = []
      window.__r11Stop = false
      window.__r11T0 = performance.now()
      const tick = () => {
        if (window.__r11Stop) return
        const t = +(performance.now() - window.__r11T0).toFixed(0)
        const c = document.querySelector(s)
        if (c) {
          window.__r11.push({ t, x: +new DOMMatrixReadOnly(getComputedStyle(c).transform).e.toFixed(2) })
        }
        // 同时记「在场卡列表」—— 抓第 4 张卡的 DOM 闪现 / 出现时刻
        window.__r11p.push({
          t,
          p: [...document.querySelectorAll('.switcher-card.is-deck')].map((e) => +e.dataset.index).sort()
        })
        requestAnimationFrame(tick)
      }
      window.__r11p = []
      tick()
    }, sel)
    await drag()
    const relAt = await page.evaluate(() => +(performance.now() - window.__r11T0).toFixed(0))
    const info = await page.evaluate(() => window.__switcherSettle || null)
    await page.waitForTimeout(1300)
    const out = await page.evaluate(() => {
      window.__r11Stop = true
      return { rows: window.__r11, pres: window.__r11p }
    })
    return { rows: out.rows, pres: out.pres, relAt, info }
  }
  /** 某张卡在【松手之后】出现过几段、首次出现距松手多少 ms */
  const presenceStats = ({ pres, relAt }, idx) => {
    const seq = pres.filter((r) => r.t >= relAt)
    let segs = 0
    let first = null
    let was = false
    for (const r of seq) {
      const on = r.p.includes(idx)
      if (on && !was) { segs++; if (first == null) first = r.t - relAt }
      was = on
    }
    return { segs, first }
  }
  const settleStats = ({ rows, relAt }) => {
    const seq = rows.filter((r) => r.t >= relAt)
    if (seq.length < 6) return null
    const tn = Math.max(3, Math.round(seq.length * 0.12))
    const fin = seq.slice(-tn).reduce((a, b) => a + b.x, 0) / tn
    const ds = Math.sign(fin - seq[0].x) || 1
    const travel = Math.abs(fin - seq[0].x)
    const over = Math.max(...seq.map((p) => (p.x - fin) * ds))
    let revs = 0
    let lastD = 0
    for (let i = 1; i < seq.length; i++) {
      const d = seq[i].x - seq[i - 1].x
      if (Math.abs(d) < 0.05) continue
      const sg = Math.sign(d)
      if (lastD !== 0 && sg !== lastD) revs++
      lastD = sg
    }
    return { fin, travel, over, revs, n: seq.length }
  }
  /* 每个场景都从 focus = 0 起手：上一个用例（修正 D②）把焦点留在了 1，
     不重置的话要采样的那张卡已经在屏幕右侧、滑一格就被剔除（采样恒 0 帧）。 */
  const resetToFocus0 = async () => {
    await page.evaluate(() => window.__system.exitSwitcherToHome())
    await page.waitForTimeout(420)
    await page.mouse.move(215, 925)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) { await page.mouse.move(215, 925 - i * 9, { steps: 1 }); await page.waitForTimeout(11) }
    await page.waitForTimeout(520)
    await page.mouse.up()
    await page.waitForTimeout(700)
  }
  const slowDrag = (px, steps, ms) => async () => {
    await page.mouse.move(110, 500)
    await page.mouse.down()
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(110 + (px * i) / steps, 500, { steps: 1 })
      await page.waitForTimeout(ms)
    }
    await page.mouse.up()
  }

  // ---- ① 慢滑翻一张（0.55 层、松手时仍在动 = Ricky 说的「慢滑」）----
  await resetToFocus0()
  const slow = await traceSettle(
    '.switcher-card.is-deck[data-index="0"]',
    slowDrag(Math.round(SPAN * 0.55), 13, 22)
  )
  const st = settleStats(slow)
  const ps = presenceStats(slow, 3)
  if (st && slow.info) {
    check(
      '第十一轮·需求①：慢滑翻一张后【无过冲】（改前 +6.5px，慢滑不再多弹一下）',
      slow.info.isFlick === false && st.travel > 100 && st.over <= 1.5 && st.revs <= 1,
      `vFocus=${slow.info.vFocus} 层/s（isFlick=${slow.info.isFlick}）· idx ${slow.info.cur}→${slow.info.idx} · ` +
        `行程 ${st.travel.toFixed(1)}px · 过冲 ${st.over.toFixed(2)}px · 符号反转 ${st.revs} 次 · ${st.n} 帧`
    )
    /* 深侧第 4 张卡（data-index 3）的出现必须【一次性 + 在运动里】：
       改前 ζ=0.65 来回穿过整卡边界 ⇒ 2 段（出现→消失→再现）；
       若直接用 poseFocus 剔除（不做磁吸），它会等到弹簧完全收敛（实测 +714ms）才出现。 */
    check(
      '第十一轮·需求①附带：深侧第 4 张卡【一次性出现】且在运动末段（不含 DOM 闪现）',
      ps.segs === 1 && ps.first != null && ps.first <= 450,
      `出现 ${ps.segs} 段 · 首次在松手后 ${ps.first}ms（改前 2 段；改前首次 236ms 但会闪断）`
    )
  } else {
    check('第十一轮·需求①：慢滑翻一张后【无过冲】（改前 +6.5px，慢滑不再多弹一下）', false,
      `采样不足（rows=${slow.rows.length} rel=${slow.relAt}）`)
    check('第十一轮·需求①附带：深侧第 4 张卡【一次性出现】且在运动末段（不含 DOM 闪现）', false, '采样不足')
  }

  // ---- ② 快甩翻一张（同一把尺：这里必须仍有过冲，证明 ① 不是把弹簧一起改死了）----
  await resetToFocus0()
  const flick = await traceSettle(
    '.switcher-card.is-deck[data-index="0"]',
    slowDrag(Math.round(SPAN * 0.62), 6, 6)
  )
  const st2 = settleStats(flick)
  if (st2 && flick.info) {
    check(
      '第十一轮·需求②：快甩仍保留过冲（动量的正常表现，参考视频 V4 回退 254/229px）',
      flick.info.isFlick === true && st2.over > 3,
      `vFocus=${flick.info.vFocus} 层/s（isFlick=${flick.info.isFlick}）· ` +
        `行程 ${st2.travel.toFixed(1)}px · 过冲 ${st2.over.toFixed(2)}px · ${st2.n} 帧`
    )
  } else {
    check('第十一轮·需求②：快甩仍保留过冲（动量的正常表现，参考视频 V4 回退 254/229px）', false,
      `采样不足（rows=${flick.rows.length} rel=${flick.relAt}）`)
  }

  // ---- ③ 慢滑不足半张（0.42 层、停住 150ms 再松手）→ 回到原卡，同样不得过冲 ----
  await resetToFocus0()
  const back = await traceSettle('.switcher-card.is-deck[data-index="0"]', async () => {
    await page.mouse.move(110, 500)
    await page.mouse.down()
    for (let i = 1; i <= 13; i++) {
      await page.mouse.move(110 + (SPAN * 0.42 * i) / 13, 500, { steps: 1 })
      await page.waitForTimeout(22)
    }
    await page.waitForTimeout(150)
    await page.mouse.up()
  })
  const st3 = settleStats(back)
  if (st3 && back.info) {
    check(
      '第十一轮·需求③：慢滑不足半张（停住再松手）回原卡 —— 同样单调无过冲',
      back.info.isFlick === false && back.info.idx === 0 && st3.travel > 60 && st3.over <= 1.5,
      `idx ${back.info.cur}→${back.info.idx} · 行程 ${st3.travel.toFixed(1)}px · 过冲 ${st3.over.toFixed(2)}px（改前 0.00，本就不成立）`
    )
  } else {
    check('第十一轮·需求③：慢滑不足半张（停住再松手）回原卡 —— 同样单调无过冲', false,
      `采样不足（rows=${back.rows.length} rel=${back.relAt}）`)
  }
}

/* ---- 第六轮·连锁（2026-09-12）：卡片之间的【相对运动】----
   Ricky 第六轮原话：「所有卡片都是跟随位移的，就像粘连在一起被拉到屏幕外面，
   是一个连锁反应，不是一次只能滑走一张的废物！……忘记我之前定死的什么 8:3:2:1。」

   历史脉络（必须一起看，否则会重复踩坑）：
     第四轮：牵连包络凑 8:3:2:1 + 两卡贴合 → 底卡左缘 52.7 → 101.9（峰值）→ 77.5，
             回退 24px；顶卡出屏点附近还有一次 77px 二次回退（Ricky 第五轮否决）。
     第五轮：删掉牵连 → 零回退，但第 1 层净位移只剩 stair(1) = 33px，
             顶卡一次飞 378px → 视觉上「只有顶卡在动」（Ricky 第六轮否决）。
     第六轮：**不动数学结构，改槽位间距本身**。
       ① stair(1): 0.12 → 0.19 卡宽（33 → 52px，对齐参考实测 51~56px）
       ② 离场槽距 EXIT_FRAC: 0.88 屏宽 → 0.544 屏宽（378 → 234px = 一张卡的手指行程）
          ⇒ 离场卡位移 ≡ 手指位移 = 1:1 跟手；且换一张后它【停在右屏边内侧露出 ≈119px】
            （参考实测 ≈96px），第二张才把它推出去。
          ⚠️ **第七轮·批次 4 已把这条改掉**（见下）
       ③ u 的指数 TRANS_POW / EXIT_POW: 1.6 → 1（整条链从第一帧就与手指同速）。

   ── 第七轮·批次 4（2026-09-13）对 ② 的修正（Ricky 需求②）──
     Ricky 原话：「顶层卡片右滑要最多滑到跟底层卡片刚好完全分离再锁死」，
     拍板取值：**刚好贴住不重叠**，顶卡左缘 = 352.5px。
     ② 的 234px（= 手指行程 0.85 卡宽）**小于一张卡宽**，于是离场卡永远停在
     frontX + 233.9 = 311.4px，与居中底卡右缘 352.5px **恒重叠 41px** ——
     这就是他说的「滑到底也跟底卡锁死在一起」。
     改法：EXIT_FRAC 0.544 → **0.64 = CARD_W_FRAC**（离场槽距 ≡ 一张卡宽）⇒
     静止态左缘 = frontX + cardW = **352.5px 恰好相切**，零重叠零空隙。
     代价：位移比 exit : 手指行程 = 1 : 0.85 = **1.176**，不再是严格 1:1
     （但第六轮逐帧实测参考视频本身就是 272 : 255 ≈ 1.07，方向一致）。
     ⇒ 本块的「1:1 跟手」断言随之作废，改为断言
       ① 整段拖动两卡**永不重叠**（改前恒重叠 41px）；
       ② 手指走满一整层时两卡间隙 ≈ 0（**刚好贴住**）；
       ③ 该时刻离场卡的一层净位移 ≡ **一张卡宽**（275px，改前 233.9px）。

   ── 第八轮（2026-09-13）再次修正 —— 本节 ①②③ 的数值已全部作废 ──
     Ricky 原话：「慢滑时顶部卡片停留位置改为遮挡 C 位约 10%」，并给了像素实测参考图。
     0.64 那张「恰好相切」在肉眼看就是「顶卡贴住底卡右缘」，他要的是**压进去一点**。
     改法：EXIT_FRAC 0.64 → **0.57（屏宽分数！= 0.891 卡宽）** ⇒ exit = round(430×0.57) = 245px，
     静止态左缘 = frontX + 245 = 322.5px，**恒重叠 30px = 10.9% 卡宽**。
     本节断言随之改为：① 始终压着且最近一次 = 契约重叠 30px；
                      ② 走满一层时重叠 ≈30px（不再要求相切）；
                      ③ 一层净位移 = exit = 245px（不再等于一张卡宽 275px）。
     ⚠️ EXIT_FRAC 是**屏宽**分数、CARD_W_FRAC 是**卡宽**分数 —— 两者数值曾经撞在一起（都 0.64），
        是这块最容易看错的地方。

   为什么这不是「又把牵连加回来」（数学根因，第四轮的教训）：
     层位置仍 = frontX − stair(aEff)，aEff = d − u，对 u 严格单调 ⇒ 零回退。
     第六/七轮改的是【槽位间距】（静态几何），不是【会归零的包络】。
     离场卡走线性斜坡 exit × |a|，仍是 |a| 的单调函数，一帧都不会往左。

   本块拖 1.45 层（≈340px），覆盖到「离场卡逼近右屏边、即将出屏」为止，
   同时保证配对（顶卡 i / 被它带着走的 i+1）在整段里都还在 DOM 里。 */
{
  /* 按步读取（不用 rAF 采样）：先把静止态的两张关键卡锚死，再一步步拖，
     每步都能拿到「手指走了多少 / 离场卡走了多少 / 顶上来的卡走了多少 / 缩放多少」，
     于是「一整层净位移」「1:1 跟手」「位移与放大同时发生」三条都能确定性判定。 */
  const STAIR1 = cardW * DECK.STAIR_BASE_FRAC // stair(1) ≈ 52.25px（第六轮）
  const rest = await deck()
  const TOP = rest.find((r) => r.depth === 0) // 即将离场的焦点卡
  const NEXT = rest.find((r) => r.depth === 1) // 被它带着顶上来的那张
  const dragPx = Math.round(SPAN * 1.45) // 覆盖到「离场卡逼近右屏边」为止
  const steps = 29
  const startX = Math.round(TOP.x + cardW / 2)
  const samples = []
  await page.mouse.move(startX, 500)
  await page.mouse.down()
  for (let k = 0; k <= steps; k++) {
    await page.mouse.move(startX + (dragPx * k) / steps, 500, { steps: 1 })
    await page.waitForTimeout(18)
    samples.push({ finger: (dragPx * k) / steps, rows: await deck() })
  }
  await page.mouse.up()
  await page.waitForTimeout(800)

  const pos = (row) => ({ x: row.x, s: row.w / cardW })
  const top0 = pos(TOP)
  const next0 = pos(NEXT)
  let mono = true
  let scaleMono = true
  let minGlue = Infinity
  let topPeak = -Infinity
  let nextPeak = -Infinity
  let prevNext = null
  let prevScale = null
  let atOneLayer = null // 手指走满一整层时的快照
  let atQuarter = null // 顶上来的那张走满 25% 位移时的快照
  let frames = 0
  for (const { finger, rows } of samples) {
    const t = rows.find((r) => r.id === TOP.id)
    const n = rows.find((r) => r.id === NEXT.id)
    if (!t || !n) continue
    frames++
    const tt = pos(t)
    const nn = pos(n)
    /* 「粘连」量 = 顶上来的那张的右缘 − 离场卡的左缘；>0 表示两卡仍然重叠（没裂开） */
    minGlue = Math.min(minGlue, nn.x + cardW * nn.s - tt.x)
    if (prevNext != null && nn.x < prevNext - 0.6) mono = false
    if (prevScale != null && nn.s < prevScale - 1e-6) scaleMono = false
    prevNext = nn.x
    prevScale = nn.s
    topPeak = Math.max(topPeak, tt.x)
    nextPeak = Math.max(nextPeak, nn.x)
    if (!atQuarter && nn.x - next0.x >= 0.25 * STAIR1) atQuarter = { nn, finger }
    if (!atOneLayer && finger >= SPAN - 1e-6) atOneLayer = { nn, tt, finger }
  }
  const nextTravel = nextPeak - next0.x
  check(
    '第六轮·定律三：背景层【全程】单调右移，绝不回退（含离场卡逼近右屏边之后）',
    frames >= 24 && mono,
    `离场卡最右 x=${topPeak.toFixed(1)}（屏宽 ${screenBox.width}）；顶上来的卡净右移 ${nextTravel.toFixed(1)}px` +
      `（第四轮：峰值 57px 后回退 24px，出屏点附近还有一次 77px 二次回退）`
  )
  check(
    `第八轮·需求②：拖动全程两卡【始终互相压着】，最近一次也不分离（最小重叠 = 契约 ${restOverlap}px）`,
    frames >= 24 && minGlue >= restOverlap - 1.5 && minGlue <= restOverlap + 1.5,
    `最小重叠 ${minGlue.toFixed(1)}px（第八轮契约 ${restOverlap}px = 10.9% 卡宽；` +
      `第七轮此处是 0px「刚好贴住」，第五轮是 -81px 的「空隙」= 顶卡独自飞走）`
  )
  check(
    '第六轮：背景层一整层净位移 = stair(1) ≈ 52px（参考实测 51~56px；第五轮只有 33px）',
    !!atOneLayer && atOneLayer.nn.x - next0.x >= 47 && atOneLayer.nn.x - next0.x <= 57,
    atOneLayer
      ? `实测 ${(atOneLayer.nn.x - next0.x).toFixed(1)}px（第五轮 33px；第四轮峰值 57.3px 但回退 24px → 净 ≈ 33px）`
      : '没采到「手指走满一整层」的样本'
  )
  /* 「位移与放大同时发生」：顶上来的那张走满 25% 位移时，缩放必须已经走过 ≥20%。
     若是「先位移、后放大」，这里会接近 0。 */
  check(
    '第六轮：位移与放大同时发生（不是先位移再放大）',
    !!atQuarter && scaleMono && atQuarter.nn.s - next0.s >= 0.2 * (1 - DECK.SCALE_DECAY),
    atQuarter
      ? `位移走到 25% 时缩放已走 ${(((atQuarter.nn.s - next0.s) / (1 - DECK.SCALE_DECAY)) * 100).toFixed(0)}%`
      : '没采到「位移 25%」的样本'
  )
  /* 需求②的核心量化判据（活体实测，与单测的纯函数断言互为印证）：
     第八轮（2026-09-13）Ricky 把静止态从「刚好贴住（零重叠）」改成「遮挡 C 位约 10%」。
     手指走满一整层的那一刻，离场卡应当【越过底卡右缘、压住它 ≈10.9% 卡宽】——
     · 一层净位移 = exit = round(屏宽 × 0.57) = 245px = 0.891 卡宽（第七轮 275px = 一张卡宽）
     · 此刻两卡重叠 ≈ 30px（第七轮 0px 相切；改前 exit 0.544 时是 41px 重叠） */
  check(
    `需求②（关键时刻）：手指走满一整层时，离场卡一层净位移 = exit = ${exitPx}px（= 0.89 卡宽）`,
    !!atOneLayer && Math.abs(atOneLayer.tt.x - top0.x - exitPx) <= 3,
    atOneLayer
      ? `离场卡位移 ${(atOneLayer.tt.x - top0.x).toFixed(1)}px vs exit ${exitPx}px（一张卡宽 ${cardW}px；第七轮是 275px）`
      : '没采到「手指走满一整层」的样本'
  )
  check(
    `需求②（关键时刻）：此刻离场卡压住底卡 ≈${restOverlap}px ≈ ${((restOverlap / cardW) * 100).toFixed(1)}% 卡宽（第七轮是 0px 相切）`,
    !!atOneLayer && Math.abs(atOneLayer.nn.x + cardW * atOneLayer.nn.s - atOneLayer.tt.x - restOverlap) <= 3,
    atOneLayer
      ? `重叠 ${(atOneLayer.nn.x + cardW * atOneLayer.nn.s - atOneLayer.tt.x).toFixed(1)}px` +
        `（离场卡左缘 ${atOneLayer.tt.x.toFixed(1)} / 底卡右缘 ${(atOneLayer.nn.x + cardW * atOneLayer.nn.s).toFixed(1)}）`
      : '没采到「手指走满一整层」的样本'
  )
  /* 静止态：换一张后离场卡停在「frontX + exit」，遮挡 C 位 ≈10.9%、仍露出 ≈107.5px */
  {
    const parked = (await deck()).find((r) => r.depth === -1)
    check(
      `需求②（静止态）：换一张后离场卡左缘 = frontX + exit = ${restParkX}px，仍露出 ${(screenBox.width - restParkX).toFixed(1)}px`,
      !!parked && Math.abs(parked.x - restParkX) <= 1.5 && parked.x < screenBox.width,
      parked ? `左缘 ${parked.x.toFixed(1)}px（露出 ${(screenBox.width - parked.x).toFixed(1)}px）` : '找不到 depth=-1 的卡'
    )
  }
}

/* ══════════ 第七轮 · 批次 3：松手吸附的「惯性加速 / 慢滑一次一张」+ 触控板双指横滑 ══════════
   Ricky 原话：
     ④「需要支持快滑的惯性加速移动（参考视频 95f4eead…mp4）」
     ⑤「慢滑时每次切换一张卡片，注意卡片的位移速度和停留位置（参考视频 d0ee37dc…mp4）」
     ①「多任务横滑不支持 Mac 触控板双指横滑手势」

   为什么这里要【合成】指针/滚轮事件，而不是用 page.mouse：
     · page.mouse 的速度是 CDP 往返抖动的副产品 —— 「快甩 100px」到底多快不可控
       （旧探针为此一直测不出快甩：实测只有 347px/s，根本没快起来）；
     · 合成事件下时长由 setTimeout 精确控制，「速度」成了可控自变量。
     代价：合成 pointerdown 下 setPointerCapture 抛 InvalidPointerId → 先在原型上打桩。

   ⚠️ wheel 的宿主元素必须选 .app-switcher 根，不能选 elementFromPoint 的结果：
     前卡会因为 renderedCards（|a| > 1.28 剔除）在 focus 增大时被移出 DOM，
     再往那个【游离节点】dispatchEvent 不会冒泡到 window → 后半串事件全部丢失
     （踩过一次：「连拨 1000px 只走 2 张」，不是实现的问题）。 */
console.log('\n───── 批次 3：松手吸附（需求④⑤）与触控板双指横滑（需求①）─────')
{
  const origCapture = await page.evaluate(() => {
    const saved = Element.prototype.setPointerCapture
    Element.prototype.setPointerCapture = function () {}
    Element.prototype.releasePointerCapture = function () {}
    Element.prototype.hasPointerCapture = function () { return false }
    return true
  })
  check('批次 3 前置：合成事件下 setPointerCapture 已打桩', origCapture === true)

  /* 合成一次横拖。
     segments = [{ dx, vPx, from? }, ...]：按顺序走的若干段（都相对同一次按下的起点）。
     存在的理由：组件的焦点是 `startFocus + dx/span`，基准在 pointerdown 那一刻钉死 ——
     所以「先把焦点拖到第 2 张、再反向拖 0.6 层」必须写成**一条连续的路径**
     （手指的绝对位置编码焦点），不能拆成两次独立拖动（拆开第二段会从 0 起算）。
     踩过这个坑：拆开时 cur 报的是 -0.21（= 0 + (−140)/233.75 的橡皮筋值），
     看起来像「反向不生效」，其实是用例自己不成立。 */
  const synthDrag = (segments, { pause = 0 } = {}) =>
    page.evaluate(
      async ({ segments, pause }) => {
        const root = document.querySelector('.app-switcher')
        if (!root) return { error: 'no .app-switcher' }
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
        const mk = (t, x) =>
          new PointerEvent(t, {
            bubbles: true, cancelable: true, composed: true, pointerId: 1,
            pointerType: 'mouse', isPrimary: true,
            buttons: t === 'pointerup' ? 0 : 1, clientX: x, clientY: 500
          })
        const x0 = 110
        window.__switcherSettle = null
        root.dispatchEvent(mk('pointerdown', x0))
        for (const seg of segments) {
          const n = Math.max(2, Math.round(Math.abs(seg.dx) / (seg.vPx * 16)))
          const dur = Math.abs(seg.dx) / seg.vPx
          const from = seg.from || 0
          for (let i = 1; i <= n; i++) {
            root.dispatchEvent(mk('pointermove', x0 + from + (seg.dx * i) / n))
            await sleep(dur / n)
          }
        }
        if (pause) await sleep(pause)
        const last = segments[segments.length - 1]
        root.dispatchEvent(mk('pointerup', x0 + (last.from || 0) + last.dx))
        await sleep(900)
        const c = document.querySelector('.switcher-card.is-deck')
        return {
          settle: window.__switcherSettle,
          focus: c ? +(+c.dataset.index - +c.dataset.depth).toFixed(3) : null
        }
      },
      { segments, pause }
    )

  /* 合成一串 wheel（模拟触控板：n 个事件、总位移 totalDx、间隔 stepMs） */
  const synthWheel = (totalDx, n, { stepMs = 16 } = {}) =>
    page.evaluate(
      async ({ totalDx, n, stepMs }) => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
        const target = document.querySelector('.app-switcher') || document.body
        for (let i = 0; i < n; i++) {
          target.dispatchEvent(new WheelEvent('wheel', {
            bubbles: true, cancelable: true, composed: true,
            deltaX: totalDx / n, deltaY: 0, deltaMode: 0, clientX: 215, clientY: 500
          }))
          await sleep(stepMs)
        }
        await sleep(900)
        const c = document.querySelector('.switcher-card.is-deck')
        return { focus: c ? +(+c.dataset.index - +c.dataset.depth).toFixed(3) : null }
      },
      { totalDx, n, stepMs }
    )

  /* 回到「焦点 0、切换器打开」的干净起点（用程序化关闭 → 桌面路径重开，与既有用例一致） */
  const resetFocus0 = async () => {
    await page.evaluate(() => window.__system.exitSwitcherToHome())
    await page.waitForTimeout(450)
    await fastPauseSwipe()
    await page.waitForTimeout(250)
    return page.evaluate(() => window.__system.appSwitcherOpen)
  }

  check('批次 3 复位：回到「切换器打开、焦点 0」', (await resetFocus0()) === true)

  // ---- ⑤ 慢滑：位移过半才翻一张（V5：每段 226~288px ≈ 一张卡的手指行程）----
  {
    const slow = []
    let r = await synthDrag([{ dx: SPAN * 0.42, vPx: 0.4 }], { pause: 150 })
    slow.push({ label: '0.42 层', idx: r.settle?.idx, exp: 0, v: r.settle?.vFocus })
    await resetFocus0()
    r = await synthDrag([{ dx: SPAN * 0.6, vPx: 0.4 }], { pause: 150 })
    slow.push({ label: '0.60 层', idx: r.settle?.idx, exp: 1, v: r.settle?.vFocus })
    await resetFocus0()
    r = await synthDrag([{ dx: SPAN * 0.98, vPx: 0.4 }], { pause: 150 })
    slow.push({ label: '0.98 层', idx: r.settle?.idx, exp: 1, v: r.settle?.vFocus })
    check(
      '需求⑤：慢滑「位移过半才翻一张」（0.42→0 / 0.60→1 / 0.98→1）',
      slow.every((s) => s.idx === s.exp && Math.abs(s.v) < 2.6),
      slow.map((s) => `${s.label}:${s.idx}(期望${s.exp},v=${s.v})`).join(' ')
    )
  }
  await resetFocus0()
  {
    /* 拖到 1.6 层（≥1.5）→ 翻两张：慢滑的翻张数只由【位移】决定 */
    const r = await synthDrag([{ dx: SPAN * 1.6, vPx: 0.5 }], { pause: 150 })
    check('需求⑤：慢滑 1.60 层 → 翻两张（张数只由位移决定）', r.settle?.idx === 2 && r.focus === 2,
      `判定=${r.settle?.idx} 落点=${r.focus}`)
  }
  await resetFocus0()
  {
    /* 停住再松手 = 零动量：不能用最后一次 pointermove 的陈旧速度继续翻页 */
    const r = await synthDrag([{ dx: SPAN * 0.42, vPx: 2.0 }], { pause: 300 })
    check('需求⑤：快速拖到 0.42 层后【停住 300ms】再松手 → 零动量，回弹不翻页',
      r.settle?.idx === 0 && Math.abs(r.settle?.vFocus) < 0.001,
      `判定=${r.settle?.idx} 松手速度=${r.settle?.vFocus}层/s`)
  }

  // ---- ④ 快滑：小位移也必须翻一张（旧实现：bias 上限 ±0.4 层 → 位移不足半层就完全不翻）----
  {
    const fast = []
    for (const [label, frac] of [['0.05 层', 0.05], ['0.10 层', 0.10], ['0.42 层', 0.42]]) {
      await resetFocus0()
      const r = await synthDrag([{ dx: SPAN * frac, vPx: 2.0 }])
      fast.push({ label, idx: r.settle?.idx, exp: 1, v: r.settle?.vFocus, focus: r.focus })
    }
    check(
      '需求④：快甩 0.05 / 0.10 / 0.42 层（旧实现全部不翻）→ 各翻一张',
      fast.every((f) => f.idx === 1 && f.focus === 1 && f.v >= 2.6),
      fast.map((f) => `${f.label}:判定${f.idx}/落点${f.focus}(v=${f.v})`).join(' ')
    )
  }
  await resetFocus0()
  {
    /* 上界不变量：极快甩也不会凭速度多翻 —— V4 三个运动段净位移 311/200/229px 都是「≈一张」 */
    const r = await synthDrag([{ dx: SPAN * 0.10, vPx: 4.0 }])
    check('需求④：极快甩（v≈16层/s）翻的张数仍与位移一致（不凭速度凭空多翻）',
      r.settle?.idx === 1 && Math.abs(r.settle?.vFocus) >= 2.6,
      `判定=${r.settle?.idx}（位移 0.10 层 → 上界 round(0.10)+1 = 1）v=${r.settle?.vFocus}层/s`)
  }
  await resetFocus0()
  {
    /* 反向（手往左拖 = 往更新的卡翻）。
       必须写成【一条连续路径】：先向右走 2 层把焦点推到第 2 张，再往回走 0.6 层 ——
       手指的绝对位置编码焦点。拆成两次独立拖动会从 0 重新起算（见 synthDrag 的注释）。 */
    const r = await synthDrag(
      [
        { dx: SPAN * 2, vPx: 0.5 },
        { from: SPAN * 2, dx: -SPAN * 0.6, vPx: 0.4 }
      ],
      { pause: 150 }
    )
    check('需求⑤：反向（手往左）慢滑 0.60 层 → 从第 2 张回退到第 1 张',
      r.settle?.idx === 1 && r.focus === 1,
      `松开位置=${r.settle?.cur} 判定=${r.settle?.idx} 落点=${r.focus}`)
  }
  await resetFocus0()
  {
    const r = await synthDrag([{ dx: -SPAN * 0.3, vPx: 4.0 }])
    check('需求⑤：焦点已在 0 时反向极快甩 → 夹在 0（橡皮筋，不越界）',
      r.settle?.idx === 0 && r.focus === 0, `判定=${r.settle?.idx} 落点=${r.focus}`)
  }

  // ---- ① 触控板双指横滑 ----
  await resetFocus0()
  {
    const r = await synthWheel(-200, 8)
    check('需求①：双指往右（deltaX<0，内容跟手往右）拨 200px → 焦点增大并落 1',
      Math.round(r.focus) === 1, `focus=${r.focus}（200/233.75 = 0.86 层）`)
  }
  await resetFocus0()
  {
    const r = await synthWheel(-90, 6)
    check('需求①：轻拨 90px（0.38 层，不足半张）→ 弹回原卡（与慢滑同一套过半判据）',
      Math.round(r.focus) === 0, `focus=${r.focus}`)
  }
  await resetFocus0()
  {
    /* 动量由系统提供（macOS 会继续吐递减的 wheel），所以触控板路径【不叠加投影】：
       连拨 1000px = 4.28 层 → 直接落到 4.28 最近的第 4 张，而不是被投影推到更远。 */
    const r = await synthWheel(-1000, 14)
    check('需求①：连拨 1000px（4.28 层）→ 落第 4 张（不做二次投影，动量不重复计账）',
      Math.round(r.focus) === 4, `focus=${r.focus}`)
  }
  await resetFocus0()
  {
    /* 纵向滚轮（deltaX=0 / 横向不占优）必须原样放行，不响应也不拦 */
    const before = await page.evaluate(() => {
      const c = document.querySelector('.switcher-card.is-deck')
      return c ? +c.dataset.index - +c.dataset.depth : null
    })
    const r = await page.evaluate(async () => {
      const root = document.querySelector('.app-switcher')
      let prevented = 0
      for (let i = 0; i < 6; i++) {
        const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 0, deltaY: -120, deltaMode: 0 })
        root.dispatchEvent(e)
        if (e.defaultPrevented) prevented++
        await new Promise((r) => setTimeout(r, 16))
      }
      await new Promise((r) => setTimeout(r, 600))
      const c = document.querySelector('.switcher-card.is-deck')
      return { prevented, focus: c ? +c.dataset.index - +c.dataset.depth : null }
    })
    check('需求①：纯纵向滚轮不误伤（焦点不动、也不 preventDefault）',
      r.prevented === 0 && r.focus === before, `拦截 ${r.prevented}/6 次，焦点 ${before} → ${r.focus}`)
  }
  await resetFocus0()
  {
    /* 底部 ~30px 的手势条（HomeIndicator，z=96）在 .app-switcher 之外 ——
       监听器挂 window 才兜得住那一条，这条用例就是那个盲区的守卫。
       位移取 2×120px = 240px ≈ 1.03 层：离 1.5 的取整边界有 0.47 层余量，
       Chrome 对 wheel 增量做归一化缩放也不会踩线（曾用 2×170 = 1.45 层 → 踩线判 2）。 */
    const before = await page.evaluate(() => {
      const r = document.elementFromPoint(215, 918)
      return { tag: r?.className?.toString?.().slice(0, 30) || '' }
    })
    await page.mouse.move(215, 918)
    await page.mouse.wheel(-120, 0)
    await page.waitForTimeout(180)
    await page.mouse.wheel(-120, 0)
    await page.waitForTimeout(900)
    const f = await page.evaluate(() => {
      const c = document.querySelector('.switcher-card.is-deck')
      return c ? +c.dataset.index - +c.dataset.depth : null
    })
    check('需求①：指针停在底部手势条上横滑 → 切换器照常翻页（window 监听兜住盲区）',
      Math.round(f) === 1, `focus=${f}（该处命中元素=${before.tag}）`)
  }
  await resetFocus0()
  {
    /* 横向 wheel 必须被拦住：卡片里是真实应用预览，设置页等自带可滚列表，
       不拦的话横滑会把那张缩小卡里的列表滚起来，切换器反而不动。 */
    const guard = await page.evaluate(async () => {
      const root = document.querySelector('.app-switcher')
      const e = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: -60, deltaY: 0, deltaMode: 0 })
      root.dispatchEvent(e)
      const horiz = e.defaultPrevented
      const e2 = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: 10, deltaY: -60, deltaMode: 0 })
      root.dispatchEvent(e2)
      await new Promise((r) => setTimeout(r, 400))
      return { horiz, diag: e2.defaultPrevented }
    })
    check('需求①：横向 wheel 被 preventDefault；斜向（纵向占优）放行',
      guard.horiz === true && guard.diag === false, `横向 prevented=${guard.horiz} 斜向 prevented=${guard.diag}`)
  }
  await resetFocus0()
  {
    /* 桌面自己的双指分页必须在切换器打开时让位 —— 否则同一次横滑被两处各处理一遍，
       关掉切换器后会发现桌面莫名换了一页。
       观测量取 .home-page-strip 的 transform：它内联了 -currentPage × 100%
       （见 HomeScreen 的 stripStyle），所以「翻页了没有」在这个值上是一目了然的。 */
    const home = await page.evaluate(async () => {
      const m = () =>
        new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.home-page-strip')).transform).e
      const before = m()
      const root = document.querySelector('.app-switcher')
      for (let i = 0; i < 6; i++) {
        root.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaX: -90, deltaY: 0, deltaMode: 0 }))
        await new Promise((r) => setTimeout(r, 40))
      }
      await new Promise((r) => setTimeout(r, 600))
      return { before, after: m() }
    })
    check('需求①：切换器打开时桌面分页让位（不会在底下偷偷翻页）',
      Math.abs(home.before - home.after) < 1, `桌面 strip x: ${home.before} → ${home.after}`)
  }

  /* ---- 第二十轮·需求：双指单次横滑不再「疯狂抖动」（Ricky 2026-09-16）----
     录屏 tOS_Prototype_20260916_105155.mp4 逐帧量测（720×1576 / 58.8fps）：
       卡片组以【帧率】为周期反号抽动 —— 亮度质心在 15 视频帧内反号 5 次
       （−26.4 / −55.6 / −10.8 / −19.9 / +9.9 / −6.8 / +18.6 / −5.7 / +10.4 视频 px），
       单帧最大 57.5 视频 px（≈28.7 CSS px）；而同一段单指轨迹只有 5.1 CSS px。
       反号频率 ~10Hz，远高于本工程最硬的弹簧（ios-snappy ω_n = 22.4 rad/s = 3.6Hz）
       ⇒ 是【离散瞬写】，不是动画。

     根因：手势没有「指针所有者」。第二根手指的 pointerdown 会换掉 drag 的 startX /
       startFocus，此后两指的 pointermove 共用同一个 startX（dx = e.clientX − startX），
       而两指绝对坐标差一个指距 ⇒ 目标焦点在两指距之间来回，每次事件硬写一次。

     ⚠️ 只用【一个】指针的合成事件（page.mouse、既有 synthDrag / synthWheel）
        结构上点不出这个毛病 —— 所以这一条显式派发两条 pointerId 不同的指针流，
        并让两指的上报顺序【逐帧交替】（真实数字转换器的顺序就是这么抖的；
        顺序恒定时「最后一笔」永远落在同一根手指上，反而看不出问题）。 */
  const synthMulti = (fingers, spread, n, { stepMs = 16, px = 12 } = {}) =>
    page.evaluate(
      async ({ fingers, spread, n, stepMs, px }) => {
        const root = document.querySelector('.app-switcher')
        if (!root) return { error: 'no .app-switcher' }
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
        const mk = (t, x, id, primary) =>
          new PointerEvent(t, {
            bubbles: true, cancelable: true, composed: true,
            pointerId: id, pointerType: 'touch', isPrimary: primary,
            buttons: t === 'pointerup' ? 0 : 1, clientX: x, clientY: 500
          })
        const A0 = 110
        const B0 = A0 + spread
        /* 用 rAF 采样「实际渲染出来的焦点」：瞬写发生在两次采样之间，
           所以采样到的跳变就是观众看到的那一跳（探针与本用例同一个 oracle）。
           ⚠️ 第二十一轮把样本带上【相位】：单帧跳变指标只在 ph === 'drag' 的窗口里取。
           不隔离相位的代价（实测）：松手后 900ms 的吸附/回弹也进 `maxStep`，
           而它由弹簧逐帧推进 ⇒ 把两种完全不同的运动混成一个数 ⇒ 判据在临界值上来回翻
           （同一份代码两次跑分别量到 0.018 / 0.036 层，而真缺陷是 0.565 层）。
           这正是「统计窗口必须与被测通道对齐」那一条。 */
        const rec = []
        let run = true
        let ph = 'idle'
        const sample = () => {
          if (!run) return
          const cs = [...document.querySelectorAll('.switcher-card.is-deck')]
          if (cs.length) {
            const pairs = cs.map((c) => [+c.dataset.index, +c.dataset.depth])
            const best = pairs.reduce((a, b) => (Math.abs(b[1]) < Math.abs(a[1]) ? b : a))
            rec.push({ v: +(best[0] - best[1]).toFixed(3), ph })
          }
          requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
        ph = 'drag'
        root.dispatchEvent(mk('pointerdown', A0, 11, true))
        if (fingers === 2) {
          await sleep(30)
          root.dispatchEvent(mk('pointerdown', B0, 12, false))
        }
        for (let i = 1; i <= n; i++) {
          const pa = mk('pointermove', A0 - px * i, 11, true)
          const pb = mk('pointermove', B0 - px * i, 12, false)
          if (fingers === 2 && i % 2) { root.dispatchEvent(pa); root.dispatchEvent(pb) }
          else if (fingers === 2) { root.dispatchEvent(pb); root.dispatchEvent(pa) }
          else root.dispatchEvent(pa)
          await sleep(stepMs)
        }
        root.dispatchEvent(mk('pointerup', A0 - px * n, 11, true))
        if (fingers === 2) root.dispatchEvent(mk('pointerup', B0 - px * n, 12, false))
        ph = 'after'
        await sleep(900)
        run = false
        const all = rec.map((r) => r.v)
        const drag = rec.filter((r) => r.ph === 'drag').map((r) => r.v)
        let maxStep = 0
        for (let i = 1; i < drag.length; i++) maxStep = Math.max(maxStep, Math.abs(drag[i] - drag[i - 1]))
        return {
          maxStep: +maxStep.toFixed(3),
          samples: rec.length,
          dragSamples: drag.length,
          min: all.length ? +Math.min(...all).toFixed(3) : null,
          end: all.length ? all[all.length - 1] : null
        }
      },
      { fingers, spread, n, stepMs, px }
    )
  await resetFocus0()
  {
    const one = await synthMulti(1, 0, 10, { stepMs: 24 })
    await resetFocus0()
    const two = await synthMulti(2, 120, 10, { stepMs: 24 })
    /* 判据用【单指对照】归一（不是拍脑袋的绝对阈值）：
       ① 双指的单帧跳变必须回到单指量级（改前 0.217 层 = 50.7px，是单指 0.021 的 10 倍）；
       ② 双指的焦点轨迹必须与单指【同一条】—— 改前第二指把自己那 120px 指距的偏移
          叠加了进去（min 从 −0.237 变 −0.564）。
       ⚠️ 阈值口径（第二十一轮修订）：stepMs 取 24ms（> 一帧 16.7ms）⇒ 一个 rAF 窗口最多
       落进 1 笔输入；但客户端合并采样时仍可能落进 2 笔 ⇒ **必须容许一个采样粒度**，
       故绝对上限 0.12 层（= 2×12px/233.92 + 余量）、相对上限 3× 单指。
       同时加 `one.maxStep > 0` —— 防「什么都没动」也判过（第二十一轮踩过：一个吃掉
       全部输入的守卫会让指标恒 0，那是越完美越可疑的数字）。 */
    check('第二十轮·需求：双指单次横滑的单帧跳变回到单指量级（改前放大 10 倍）',
      one.maxStep > 0 && one.maxStep < 0.12 && two.maxStep < 0.12 &&
        two.maxStep <= one.maxStep * 3 + 0.01,
      `单指单帧最大 ${one.maxStep} 层 · 双指 ${two.maxStep} 层（阈值 0.12 = 一个采样粒度；改前 0.217）`)
    check('第二十轮·需求：双指的焦点轨迹 = 单指轨迹（第二指的指距偏移不再叠加）',
      one.min != null && two.min != null && Math.abs(two.min - one.min) < 0.05,
      `单指最深 ${one.min} · 双指最深 ${two.min}（改前 −0.564 vs −0.237）`)
  }

  await resetFocus0()
  {
    /* ---- 第二十轮·需求：慢滑吸附的【动画曲线】必须与参考视频同形：单调、到位不过冲 ----
       参考视频 = 真 iPhone / iOS 原生多任务界面（444×960 / 24fps，含 iOS 状态栏与
       「2 个应用正在运行」），逐帧量测三次换卡：
         · 到达卡右缘归一化曲线 p(t)：0.212@42ms / 0.383@83ms / 0.527@125ms / 0.615@167ms /
           0.781@208ms / 0.895@375ms / 0.965@542ms / 0.991@667ms
         · 反号 0 次、p_max = 1.0000 ⇒ **到位后不回弹**（一阶拟合 τ ≈ 163ms；
           若按 ζ=1 二阶拟合，ω_n 落在 11.7~13.5 rad/s 区间内 —— 本工程 ios-deck-settle
           的 ω_n = 14 就在这个区间，故不改预设，只把「不过冲」这条锁住）
       本工程的慢滑分支（停住再松手 ⇒ vFocus ≈ 0）走 ios-deck-settle（ζ=1.0、不注入速度），
       数学上严格单调；这条断言就是它的守卫（第十一轮「慢滑多了一次不必要的回弹」的回归护栏）。
       ⚠️ 只约束【非快甩】分支：快甩（|v| ≥ FLICK_V_MIN 2.6 层/秒）走 ios-deck（ζ=0.65）
          并以 initialVelocity 注入动量，到位过冲 3.9% 层是需求④【要的动量】，不在此口径内。
       观测量取到达卡的 data-depth（= 焦点越过的层数，0 = 恰好到位；< 0 = 冲过头）。 */
    const settle = await page.evaluate(async () => {
      const root = document.querySelector('.app-switcher')
      if (!root) return { error: 'no .app-switcher' }
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      const mk = (t, x) =>
        new PointerEvent(t, {
          bubbles: true, cancelable: true, composed: true,
          pointerId: 1, pointerType: 'touch', isPrimary: true,
          buttons: t === 'pointerup' ? 0 : 1, clientX: x, clientY: 500
        })
      const x0 = 90
      const SPAN = 390 * 0.64 * 0.85
      const total = SPAN * 0.85 // 0.85 层 ⇒ 过半 ⇒ 落第 2 张
      const rec = []
      let run = true
      const tick = () => {
        if (!run) return
        const c = document.querySelector('.switcher-card.is-deck[data-index="1"]')
        if (c) rec.push(+c.dataset.depth)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      root.dispatchEvent(mk('pointerdown', x0))
      for (let i = 1; i <= 12; i++) {
        root.dispatchEvent(mk('pointermove', x0 + (total * i) / 12))
        await sleep(13)
      }
      await sleep(250) // 停住再松手 ⇒ vFocus ≈ 0 ⇒ 走 ios-deck-settle（非快甩分支）
      root.dispatchEvent(mk('pointerup', x0 + total))
      await sleep(1000)
      run = false
      /* 只看「最后一次越过 0.5 层」之后的那一段 —— 前段是手指的拖动，不是吸附曲线 */
      let cut = 0
      for (let i = rec.length - 1; i >= 1; i--) if (Math.abs(rec[i]) < 0.5 && Math.abs(rec[i - 1]) >= 0.5) { cut = i; break }
      const seg = rec.slice(cut)
      let rev = 0
      for (let i = 2; i < seg.length; i++) {
        const a = seg[i - 1] - seg[i - 2]
        const b = seg[i] - seg[i - 1]
        if (Math.abs(a) > 0.02 && Math.abs(b) > 0.02 && Math.sign(a) !== Math.sign(b)) rev++
      }
      return { n: seg.length, min: +Math.min(...seg).toFixed(3), end: seg[seg.length - 1], rev }
    })
    check('第二十轮·需求（曲线）：慢滑吸附单调、到位不过冲（参考视频 24 帧内反号 0 次 · p_max=1.0000）',
      settle.n > 8 && settle.min > -0.03 && settle.rev === 0 && Math.abs(settle.end) < 0.02,
      `吸附段 ${settle.n} 帧 · 最深 depth=${settle.min}（须 > −0.03 ⇒ 过冲 < 3%）· 反号 ${settle.rev} 次 · 终位 ${settle.end}`)
  }

  /* ---- 第二十一轮·需求：两指被合并成【同一条坐标流】时的右滑瞬移（Ricky 复测「右滑还是没好」）----
     第二十轮的 owner 守卫只有在浏览器给出【两个不同 pointerId】时才成立。还有第二类形状：
     两个触摸点被合并成一条坐标流（CDP 传两个【同 id】触点即可复现）——
       · /tmp/vwork/r21/probe-touchdump.mjs 场景 B 实测：`touchstart.touches` 只有 1 个触点、
         `pointerdown` 计数 = 1、页面侧只有 1 个 pointerId ⇒ pointerId / isPrimary / touches.length
         三个判据全部恒等于「单指」的形状，owner 守卫【结构上】看不见第二根手指；
       · /tmp/vwork/r21/probe-sameid.mjs T2 实测（两指相距 120px）：坐标在【没有任何 pointerdown】
         的情况下瞬移 120px（90 → 210 → 221 → …），`focus` 单帧跳 0.565 层 = 119.9px；
         单指对照只有 0.061 层 = 12.9px。
     方向不对称（与 Ricky「左滑好了、右滑没好」对上）：左滑落【挤压】通道（第十七轮已限速
     0.09/帧 ≈ 8.4px/帧）⇒ 大跳被摊成小台阶；右滑落【位移】通道（focusSnap 零过渡 1:1 直写，
     1.30px/px）⇒ 瞬移全额可见。

     本用例合成【同一个 pointerId、且第二指落下时没有 pointerdown】的坐标流，两个子形状：
       · 首笔瞬移：down 落在第一指位置，第一笔 move 直接跳到第二指位置（跳量 = 指距）；
       · 手势中途瞬移：先走 3 笔真实步长（把参考量立起来），第 4 笔再切到第二指轨迹。
     判据沿用第二十轮的【单指对照归一】（不拍绝对阈值）⇒ 两条断言都是「与单指同形」。 */
  const synthMerged = (n, { stepMs = 16, px = 12, spread = 120, warm = 0 } = {}) =>
    page.evaluate(
      async ({ n, stepMs, px, spread, warm }) => {
        const root = document.querySelector('.app-switcher')
        if (!root) return { error: 'no .app-switcher' }
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
        const ID = 7
        const mk = (t, x) =>
          new PointerEvent(t, {
            bubbles: true, cancelable: true, composed: true,
            pointerId: ID, pointerType: 'touch', isPrimary: true,
            buttons: t === 'pointerup' ? 0 : 1, clientX: x, clientY: 500
          })
        const A0 = 110
        const B0 = A0 + spread
        const rec = []
        let run = true
        /* ph = 相位（第二十一轮）：单帧跳变只在 'drag' 窗口里取 —— 理由见 synthMulti 里的注释。 */
        let ph = 'idle'
        const sample = () => {
          if (!run) return
          const cs = [...document.querySelectorAll('.switcher-card.is-deck')]
          if (cs.length) {
            const pairs = cs.map((c) => [+c.dataset.index, +c.dataset.depth])
            const best = pairs.reduce((a, b) => (Math.abs(b[1]) < Math.abs(a[1]) ? b : a))
            rec.push({ v: +(best[0] - best[1]).toFixed(3), ph })
          }
          requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
        ph = 'drag'
        root.dispatchEvent(mk('pointerdown', A0))
        /* 第二指【不派发 pointerdown】—— 这正是 owner 守卫看不见它的原因 */
        for (let i = 1; i <= n; i++) {
          const onB = i > warm
          /* 切到第二指轨迹的那一笔：第二指比第一指晚落一帧，此刻它自己只走了 i−1 步
             （实测 CDP 坐标流 90 → 210 → 221 → …，首笔跳量恰好等于指距）。 */
          const x = onB ? B0 - px * Math.max(0, i - 1) : A0 - px * i
          root.dispatchEvent(mk('pointermove', x))
          await sleep(stepMs)
        }
        root.dispatchEvent(mk('pointerup', warm < n ? B0 - px * Math.max(0, n - 1) : A0 - px * n))
        ph = 'after'
        await sleep(900)
        run = false
        const all = rec.map((r) => r.v)
        const drag = rec.filter((r) => r.ph === 'drag').map((r) => r.v)
        let maxStep = 0
        for (let i = 1; i < drag.length; i++) maxStep = Math.max(maxStep, Math.abs(drag[i] - drag[i - 1]))
        return {
          maxStep: +maxStep.toFixed(3),
          samples: rec.length,
          dragSamples: drag.length,
          min: all.length ? +Math.min(...all).toFixed(3) : null,
          teleports: (window.__switcherMode && window.__switcherMode.teleports) || 0
        }
      },
      { n, stepMs, px, spread, warm }
    )
  await resetFocus0()
  {
    const one = await synthMulti(1, 0, 10, { stepMs: 24 })
    await resetFocus0()
    const first = await synthMerged(10, { warm: 0, stepMs: 24 })
    await resetFocus0()
    const mid = await synthMerged(10, { warm: 3, stepMs: 24 })
    /* ① 单帧跳变回到单指量级（改前 0.565 层 = 119.9px，是单指 0.061 的 9 倍）；
       ② 焦点轨迹仍与单指同形 ⇒ 那 120px 指距【没有】被叠加进焦点；
       ③ 守卫生效的 oracle（改前恒为 0 —— 这正是它看不见第二根手指的证据）；
       ④ 手势没被判死 ⇒ 卡片照旧跟着手指走。
       阈值口径同第二十轮（0.12 / 3× 单指 / 单指必须 > 0）。 */
    check('第二十一轮·需求：两指【合并成一条坐标流】时单帧跳变回到单指量级（改前放大 9 倍）',
      one.maxStep > 0 && one.maxStep < 0.12 && first.maxStep < 0.12 && mid.maxStep < 0.12 &&
        first.maxStep <= one.maxStep * 3 + 0.01 && mid.maxStep <= one.maxStep * 3 + 0.01,
      `单指 ${one.maxStep} 层 · 首笔瞬移 ${first.maxStep} · 中途瞬移 ${mid.maxStep} 层（阈值 0.12；改前 0.565）`)
    check('第二十一轮·需求：合并坐标流下的焦点轨迹 = 单指轨迹（120px 指距不再叠进焦点）',
      one.min != null && first.min != null && mid.min != null &&
        Math.abs(first.min - one.min) < 0.05 && Math.abs(mid.min - one.min) < 0.05,
      `单指最深 ${one.min} · 首笔瞬移 ${first.min} · 中途瞬移 ${mid.min}（改前 −0.564 vs −0.237）`)
    check('第二十一轮·需求：坐标连续性守卫确实命中（owner 守卫覆盖不到的那一半）',
      first.teleports >= 1 && mid.teleports >= 1,
      `__switcherMode.teleports = 首笔瞬移 ${first.teleports} / 中途瞬移 ${mid.teleports}（期望 ≥1；改前恒 0）`)
  }

  /* ══════════ 第七轮 · 批次 4 ══════════
     ⑩「点击一键清理时卡片上滑消失（参考视频 e6da8c6c…mp4）」
     ②「顶层卡片右滑要最多滑到跟底层卡片刚好完全分离再锁死」
     ③「应用内上滑进入多任务页面后应用卡片会非常明显地闪一下」（回归复验）*/

  /* 批次 2/3 的用例动过最近列表（上滑移除过卡片、快滑回过桌面），
     这里先把 5 个应用重新灌满，否则「一键清理」的卡数不确定。 */
  const repopulate = async () => {
    await page.evaluate(() => window.__system.exitSwitcherToHome())
    await page.waitForTimeout(420)
    for (const id of OPENED) {
      await page.evaluate((a) => window.__system.openApp(a), id)
      await page.waitForTimeout(300)
    }
  }

  // ---- ⑩ 一键清理：逐卡上滑飞出 ----
  await repopulate()
  check('批次 4 前置（⑩）：最近任务恢复为 5 个', (await S()).recent.length === 5, (await S()).recent.join('/'))
  check('批次 4 前置（⑩）：回到「切换器打开、焦点 0」', (await resetFocus0()) === true)
  {
    /* CSS 过渡无法回放，只能在真实时间轴上用 rAF 逐帧采（≈16.7ms/帧，
       一次 260 + 90 + 60ms 的清理能采到 ~24 帧）。采 translateY / opacity / translateX。 */
    await page.evaluate(() => {
      window.__cl = []
      window.__clStop = false
      const tick = () => {
        if (window.__clStop) return
        const root = document.querySelector('.app-switcher')
        window.__cl.push({
          t: performance.now(),
          cards: root
            ? [...root.querySelectorAll('.switcher-card.is-deck')].map((c) => {
                const cs = getComputedStyle(c)
                const m = new DOMMatrixReadOnly(cs.transform)
                return {
                  id: c.dataset.appId,
                  i: +c.dataset.index,
                  ty: +m.f.toFixed(2),
                  tx: +m.e.toFixed(2),
                  op: +(+cs.opacity).toFixed(3)
                }
              })
            : []
        })
        requestAnimationFrame(tick)
      }
      tick()
    })
    const btn = await page.locator('.switcher-trash').boundingBox()
    await page.mouse.click(btn.x + btn.width / 2, btn.y + btn.height / 2)
    await page.waitForTimeout(1000)
    await page.evaluate(() => { window.__clStop = true })
    const tl = await page.evaluate(() => window.__cl)

    const start = tl[0]?.cards || []
    const y0 = Object.fromEntries(start.map((c) => [c.id, c.ty]))
    const x0 = Object.fromEntries(start.map((c) => [c.id, c.tx]))
    const takeoff = {} // 首次「真的动了」（Δ ≥ 3px 向上）的时刻
    const maxRise = {} // 最大上移量
    const xDrift = {} // 最大横向漂移
    let minOp = 1
    for (const f of tl) {
      for (const c of f.cards) {
        const rise = y0[c.id] - c.ty
        if (!(c.id in takeoff) && rise >= 3) takeoff[c.id] = f.t
        maxRise[c.id] = Math.max(maxRise[c.id] ?? 0, rise)
        xDrift[c.id] = Math.max(xDrift[c.id] ?? 0, Math.abs(c.tx - x0[c.id]))
        minOp = Math.min(minOp, c.op)
      }
    }
    const times = start.map((c) => takeoff[c.id]).filter((v) => typeof v === 'number')
    const spread = times.length === start.length ? Math.max(...times) - Math.min(...times) : -1
    /* 参考视频 V10 逐帧：卡底沿 1020 → 1020 → 860 → 490 → 140 → 出屏（5 帧 ≈ 208ms），
       增量 0 / −160 / −370 / −350 = **加速上扬**；且末帧残余卡条仍是纯白 229 → **不淡出**。
       本项目飞出位移 = screenH × 1.15（从 cardY 155 起 ⇒ 终点 ty ≈ −917）。 */
    check(`需求⑩：一键清理 → ${start.length} 张卡全部上滑飞出（越出屏幕上沿）`,
      start.length === 3 && start.every((c) => (maxRise[c.id] ?? 0) >= screenBox.height * 1.0),
      start.map((c) => `${c.i}:↑${(maxRise[c.id] ?? 0).toFixed(0)}px`).join(' '))
    check('需求⑩：飞出全程不淡出（对齐参考视频：末帧残余卡条仍是纯白）', minOp >= 0.999, `最低 opacity=${minOp}`)
    check('需求⑩：飞出是纯纵向位移（横向漂移 < 1px）',
      Object.values(xDrift).every((d) => d < 1), Object.entries(xDrift).map(([k, v]) => `${k}:${v.toFixed(2)}`).join(' '))
    check('需求⑩：多卡 45ms 错峰（C 位先走、越靠后越晚）',
      spread >= 30 && start.every((c, k) => k === 0 || (takeoff[start[k].id] ?? 0) >= (takeoff[start[k - 1].id] ?? 0)),
      `起飞时刻差 ${spread.toFixed(0)}ms（${start.map((c) => `${c.i}:${((takeoff[c.id] ?? 0) - (times[0] ?? 0)).toFixed(0)}ms`).join(' ')}）`)
    const after = await S()
    check('需求⑩：全部出屏后清空最近任务并回桌面',
      after.recent.length === 0 && after.switcher === false && after.app === null && after.base === 'home',
      `recent=${after.recent.length} switcher=${after.switcher} app=${after.app} base=${after.base}`)
  }

  // ---- ② 顶卡右滑「最多滑到遮挡 C 位约 10%」：静止后两卡恒重叠 ≈30px ----
  await repopulate()
  check('批次 4 前置（②）：回到「切换器打开、焦点 0」', (await resetFocus0()) === true)
  {
    /* 第八轮（2026-09-13，Ricky 需求②）的最终契约：
       · 改前（EXIT_FRAC 0.544）：离场卡停在 frontX + 233.9 = 311.4px，
         而居中底卡右缘 = frontX + cardW = 352.5px ⇒ **恒重叠 41px**（Ricky 说的「跟底卡锁死」）。
       · 第七轮（EXIT_FRAC 0.64 = CARD_W_FRAC）：离场槽距 = 一张卡宽 ⇒ 左缘正好落在 352.5px（零重叠相切）。
       · 第八轮（EXIT_FRAC 0.57 屏宽 = 0.891 卡宽）：左缘落在 frontX + exit = 322.5px
         ⇒ 【恒重叠 ≈30px = 10.9% 卡宽】，即 Ricky 要的「遮挡 C 位约 10%」。 */
    await page.evaluate(() => {
      window.__gapTL = []
      window.__gapStop = false
      const tick = () => {
        if (window.__gapStop) return
        const root = document.querySelector('.app-switcher')
        window.__gapTL.push(
          root
            ? [...root.querySelectorAll('.switcher-card.is-deck')].map((c) => {
                const m = new DOMMatrixReadOnly(getComputedStyle(c).transform)
                return { i: +c.dataset.index, x: +m.e.toFixed(2), sx: +m.a.toFixed(4), w: c.clientWidth }
              })
            : []
        )
        requestAnimationFrame(tick)
      }
      tick()
    })
    await synthDrag([{ dx: SPAN * 1.0, vPx: 0.5 }], { pause: 200 })
    await page.waitForTimeout(1000)
    await page.evaluate(() => { window.__gapStop = true })
    const gapTL = await page.evaluate(() => window.__gapTL)
    /* 离场卡 = 原来的 C 位（index 0）；顶上来的那张 = index 1。
       「恒重叠 ≈30px」的充要条件：右缘(index1) − 左缘(index0) ≡ restOverlap（>0 表示压着）。 */
    const gaps = []
    for (const f of gapTL) {
      const a = f.find((c) => c.i === 0)
      const b = f.find((c) => c.i === 1)
      if (a && b) gaps.push(+(b.x + b.w * b.sx - a.x).toFixed(2))
    }
    const minGap = Math.min(...gaps)
    const endGap = gaps.slice(-8).reduce((s, v) => s + v, 0) / Math.min(8, gaps.length)
    check(`需求②：拖动全程两卡【始终压着】，最近一次 = 契约重叠 ${restOverlap}px（不改前是恒重叠 41px 的「锁死」）`,
      gaps.length > 10 && minGap >= restOverlap - 1.5 && minGap <= restOverlap + 1.5,
      `最小重叠 ${minGap.toFixed(2)}px（共 ${gaps.length} 帧；第七轮此处是 0px 相切）`)
    check(`需求②：松手静止后离场卡仍压住底卡 ≈${restOverlap}px（= 10.9% 卡宽，Ricky 需求②「遮挡 C 位约 10%」）`,
      Math.abs(endGap - restOverlap) <= 1.5, `静止重叠 ${endGap.toFixed(2)}px`)
    const parked = await page.evaluate(() => {
      const c = document.querySelector('.switcher-card.is-deck[data-index="0"]')
      const b = c.getBoundingClientRect()
      return { left: +b.x.toFixed(1), right: +b.y.toFixed(0) }
    })
    const centerRight = await page.evaluate(() => {
      const c = document.querySelector('.switcher-card.is-deck[data-index="1"]')
      return +(c.getBoundingClientRect().right).toFixed(1)
    })
    check(`需求②：静止态离场卡左缘 = frontX + exit = ${restParkX}px（仍在屏内露出 ≈${(screenBox.width - restParkX).toFixed(1)}px）`,
      Math.abs(parked.left - restParkX) <= 1.5 && Math.abs(parked.left - centerRight + restOverlap) <= 1.5,
      `离场卡左缘=${parked.left} 居中卡右缘=${centerRight}（差 ${(centerRight - parked.left).toFixed(1)}px = 重叠量）`)
    await resetFocus0()
  }

  // ---- ③ 回归复验：应用内上滑进多任务，交接【零半透明帧】 ----
  {
    await page.evaluate(() => window.__system.openApp('settings'))
    await page.waitForTimeout(500)
    await page.evaluate(() => {
      window.__b4TL = []
      let k = 0
      const tick = () => {
        const f = document.querySelector('.switcher-card.is-follow')
        const cards = [...document.querySelectorAll('.switcher-card.is-deck')].map((c) => ({
          depth: c.dataset.depth,
          rootOp: +(+getComputedStyle(c).opacity).toFixed(3),
          bodyOp: +(+getComputedStyle(c.querySelector('.switcher-card-body')).opacity).toFixed(3)
        }))
        window.__b4TL.push({ f: !!f, cards })
        if (++k < 200) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    /* 比批次 2 的 500ms 停驻更短的上滑（300ms），覆盖「快速停驻就松手」这条更急的路径 */
    const cx = 215
    await page.mouse.move(cx, 925)
    await page.mouse.down()
    for (let i = 1; i <= 26; i++) { await page.mouse.move(cx, 925 - i * 14, { steps: 1 }); await page.waitForTimeout(12) }
    for (let i = 0; i < 6; i++) { await page.mouse.move(cx, 925 - 364, { steps: 1 }); await page.waitForTimeout(50) }
    await page.mouse.up()
    await page.waitForTimeout(1300)
    const b4 = await page.evaluate(() => window.__b4TL)
    const iH = b4.findIndex((r) => !r.f && r.cards.length > 0)
    const front = (r) => r.cards.find((c) => c.depth === '0')
    const halfBody = b4.filter((r) => r.cards.some((c) => c.bodyOp > 0.02 && c.bodyOp < 0.98))
    check('需求③ 回归：应用内上滑进多任务，交接那一帧前卡已完全不透明（无淡入中间帧）',
      iH > 0 && front(b4[iH])?.rootOp === 1, `交接帧=${iH} 前卡卡根 op=${front(b4[iH])?.rootOp}`)
    check('需求③ 回归：卡体透明度只做硬切（全程无半透明帧）',
      halfBody.length === 0, `半透明帧数=${halfBody.length}`)
  }

  /* ══════════ 第八轮 · 行为用例（2026-09-13，Ricky 的 8 项需求）══════════
     上面已把第八轮的【静态几何契约】改写到位（exit 245px / 重叠 30px / 左缘 322.5px）。
     这里补的是【行为面】——每一项都对应一个已经定位到代码级的旧 bug：
       ① 点上下大块空白 → 必须退出（旧实现被 dock 横带 + tap 容差静默吃掉）
       ④ 退出要有动画（卡片组左滑出屏 + 遮罩淡出 + is-closing 窗口）
       ⑥ 应用内上滑跟手是 X/Y 双轴 + 非等比挤压拉伸（旧实现只有 Y 轴）
       ⑦ 左滑挤压 ≥16%、最底部卡片不被剔除、松手有弹性回弹
       ⑧ 垃圾桶图标 = 通知中心同一份 trash-2（旧版「中间是空的」）*/

  await repopulate()
  check('第八轮行为前置：回到「切换器打开、焦点 0」', (await resetFocus0()) === true)

  // ---- 需求①：点空白退出（卡片上下的大块空白 + dock 横带内的空白）----
  {
    const tapAt = async (x, y, { driftY = 0 } = {}) => {
      await resetFocus0()
      await page.mouse.move(x, y)
      await page.waitForTimeout(30)
      await page.mouse.down()
      if (driftY) {
        for (let i = 1; i <= 4; i++) {
          await page.mouse.move(x, y + (driftY * i) / 4, { steps: 1 })
          await page.waitForTimeout(10)
        }
      }
      await page.mouse.up()
      await page.waitForTimeout(700)
      return page.evaluate(() => window.__system.appSwitcherOpen)
    }
    /* resetFocus0 之后的卡位几何：前卡 [77.5, 352.5] × [155, 751]；
       图标行在 y ∈ [119, 143]（属卡片命中区，不能用）；dock 横带 y ∈ [816, 868]。
       ⇒ (·,100) 是卡上方空白；(·,840) 是卡下方、且【落在 dock 横带里】的空白 ——
         后者正是旧实现被「dockHit ⇒ return」静默吃掉的两个坐标。 */
    const spots = [
      ['卡上方（左）', 40, 100],
      ['卡上方（右）', 390, 100],
      ['卡上方（中间，正对卡顶之上）', 215, 100],
      ['dock 横带内（左，旧实现被静默吃掉）', 40, 840],
      ['dock 横带内（右，旧实现被静默吃掉）', 390, 840],
    ]
    const res = []
    for (const [label, x, y] of spots) res.push({ label, open: await tapAt(x, y) })
    check('需求①：点 5 处空白（含 dock 横带内的两处）全部退出切换器',
      res.every((r) => r.open === false),
      res.map((r) => `${r.label}:${r.open ? '仍开着 ❌' : '已退出'}`).join(' / '))
    /* 真实拇指点按必然带纵向漂移（y 向天然比 x 向大）：旧判据要求松手时 |dy| < 8，
       漂 12px 就落入「mode='v' 且 dy ≥ −110 ⇒ 整段静默」这条路径。 */
    const drift = await tapAt(40, 300, { driftY: 12 })
    check('需求①：带 12px 纵向漂移的点按（旧判据的漏判路径）仍能退出',
      drift === false, `appSwitcherOpen=${drift}（旧实现此路径什么都不发生）`)
  }

  // ---- 需求④：点空白退出的动画（卡片组左滑出屏 + 遮罩淡出 + is-closing 窗口）----
  {
    await resetFocus0()
    await page.evaluate(() => {
      window.__ex = []
      window.__exStop = false
      const tick = () => {
        if (window.__exStop) return
        const root = document.querySelector('.app-switcher')
        const track = root?.querySelector('.switcher-track')
        const dim = root?.querySelector('.switcher-dim')
        const dock = root?.querySelector('.switcher-dock')
        const m = track ? new DOMMatrixReadOnly(getComputedStyle(track).transform) : null
        window.__ex.push({
          open: window.__system.appSwitcherOpen,
          closing: window.__system.switcherClosing,
          cls: root ? root.classList.contains('is-closing') : false,
          tx: m ? +m.e.toFixed(1) : null,
          sx: m ? +m.a.toFixed(4) : null,
          dim: dim ? +(+getComputedStyle(dim).opacity).toFixed(3) : null,
          dock: dock ? +(+getComputedStyle(dock).opacity).toFixed(3) : null
        })
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.waitForTimeout(150)
    await page.mouse.move(40, 100)
    await page.mouse.down()
    await page.waitForTimeout(30)
    await page.mouse.up()
    await page.waitForTimeout(700)
    await page.evaluate(() => { window.__exStop = true })
    const ex = await page.evaluate(() => window.__ex)
    const win = ex.filter((r) => r.cls)
    const slide = Math.round(screenBox.width * DECK.EXIT_SLIDE_FRAC)
    const dirOk = win.every((r, i) => i === 0 || r.tx <= win[i - 1].tx + 0.5)
    const mid = win.filter((r) => r.tx < -8 && r.tx > -slide + 8).length
    const last = win.length ? win[win.length - 1] : null
    /* 收尾状态要取【整个序列的最后一帧】：is-closing 摘掉与 open/closing 翻转
       发生在同一个 tick，所以窗口末帧必然还是 open=true / closing=true。 */
    const final = ex.length ? ex[ex.length - 1] : null
    check(`需求④：退场时有 is-closing 窗口（≥12 帧 ≈ ${DECK.EXIT_SLIDE_MS}ms），不是一帧瞬移`,
      win.length >= 12 && mid >= 4,
      `窗口 ${win.length} 帧，其中滑行中间态 ${mid} 帧（<8 帧说明是瞬移而非动画）`)
    check(`需求④：卡片组【向左】滑出 ${slide}px（= ${DECK.EXIT_SLIDE_FRAC} 屏宽），全程不回退`,
      !!last && Math.abs(last.tx + slide) <= 4 && dirOk && win.every((r) => r.sx === 1),
      last ? `末帧 tx=${last.tx}px（目标 −${slide}）；回退帧 ${dirOk ? 0 : '有'}；窗口内 scaleX 恒 1=${win.every((r) => r.sx === 1)}` : '没采到窗口帧')
    check('需求④：遮罩随退场淡到 0（桌面先现形），窗口结束后切换器已关闭且 closing 复位',
      !!last && last.dim <= 0.02 && !!final && final.open === false && final.closing === false,
      `窗口末帧 dim=${last?.dim}；收尾 open=${final?.open} closing=${final?.closing}`)
  }

  // ---- 需求⑥：应用内上滑跟手 = X/Y 双轴位移 + 非等比弹性挤压拉伸 ----
  {
    const runSwipe = async ({ lateralSteps = 0 } = {}) => {
      await page.evaluate(() => window.__system.closeSwitcher())
      await page.waitForTimeout(350)
      await page.evaluate(() => window.__system.openApp('settings'))
      await page.waitForTimeout(450)
      await page.evaluate(() => {
        window.__fw = []
        window.__fwStop = false
        const tick = () => {
          if (window.__fwStop) return
          const f = document.querySelector('.switcher-card.is-follow')
          if (f) {
            const m = new DOMMatrixReadOnly(getComputedStyle(f).transform)
            window.__fw.push({
              e: +m.e.toFixed(1),
              sx: +m.a.toFixed(4),
              sy: +m.d.toFixed(4),
              v: +(+window.__system.switcherDragV).toFixed(0),
              dx: +(+window.__system.switcherDragX).toFixed(1)
            })
          }
          requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
      const x0 = 215, y0 = 925
      await page.mouse.move(x0, y0)
      await page.waitForTimeout(40)
      await page.mouse.down()
      /* 8 段 × 60px 上滑（共 480px，越过满量程 260 ⇒ 触发 over 项的形变）；
         横向每段 +lateralSteps px —— 手指是斜着上滑的（参考视频即如此）。 */
      for (let s = 1; s <= 8; s++) {
        await page.mouse.move(x0 + s * lateralSteps, y0 - s * 60, { steps: 5 })
        await page.waitForTimeout(25)
      }
      await page.mouse.up()
      await page.waitForTimeout(400)
      await page.evaluate(() => { window.__fwStop = true })
      return page.evaluate(() => window.__fw)
    }
    const plain = await runSwipe({ lateralSteps: 0 })
    const diag = await runSwipe({ lateralSteps: 12 })
    const eMax = (rows) => (rows.length ? Math.max(...rows.map((r) => r.e)) : NaN)
    const ePlain = eMax(plain)
    const eDiag = eMax(diag)
    /* 纯纵向上滑：横向注入恒为 0 ⇒ 卡心 x 恒等于屏幕中心（e = cx − screenW/2 ≈ 0） */
    check('需求⑥：纯纵向上滑时跟手卡【横向不动】（证明 X 轴只由手指横向位移驱动）',
      plain.length >= 8 && Math.abs(ePlain) <= 6,
      `采样 ${plain.length} 帧，max e=${ePlain}px（期望 ≈0）`)
    /* 斜向上滑（横向共 96px）：按 FOLLOW_X = 0.42 注入 ⇒ e ≈ 40px 的右移 */
    const injected = 96 * DECK.FOLLOW_X
    check(`需求⑥：斜向上滑时跟手卡【X 轴跟手】（横向 96px ⇒ 期望 ≈${injected.toFixed(0)}px 右移）`,
      diag.length >= 8 && eDiag - ePlain >= injected - 15 && eDiag - ePlain <= injected + 18,
      `实测右移 ${(eDiag - ePlain).toFixed(1)}px（旧实现 cx 恒为屏中心 ⇒ 恒 0px，Ricky 原话「只有 Y 轴」）`)
    /* 弹性挤压拉伸：sx/sy 非等比 —— 横向收窄、纵向拉伸，且方向恒定 */
    const defMax = (rows) =>
      rows.length ? Math.max(...rows.map((r) => r.sy - r.sx)) : NaN
    const dPlain = defMax(plain)
    const dDiag = defMax(diag)
    const noInverse = plain.concat(diag).every((r) => r.sy >= r.sx - 1e-4)
    check('需求⑥：跟手卡有非等比弹性形变（纵向拉伸 / 横向收窄，不反向）',
      Math.max(dPlain, dDiag) > 0.02 && noInverse,
      `max(sy−sx)：纯纵向 ${dPlain.toFixed(4)} / 斜向 ${dDiag.toFixed(4)}（` +
        `SQUASH_MAX=${DECK.SQUASH_MAX}；反向帧 ${noInverse ? 0 : '有'}）`)
  }

  // ---- 需求③（第十轮重做）：左滑挤压 = 位移 + 等比缩小 + 阶梯收紧（三分量共用一个 k）----
  /* 第九轮的契约是「整组刚性左移、卡片宽度恒定」，第十轮被 Ricky 推翻：
       「默认位置左滑挤压动画不对，需要同时做横向挤压和缩放（缩小底层卡片大小以及漏出的多少）」
     第九轮为什么量错：它只在【单行】扫竖边，而最深帧前卡左缘已经跑到屏外 −26，
     左缘配对被吸附到相邻卡的特征上 ⇒ 得出「宽恒 302」。第十轮改量纵向剖面
     （/tmp/vwork/r10/v10col.py）：前卡上缘 131→147、下缘 785→769 ⇒ 高 654→622 = 0.951。
     所以现在的判据必须同时盯住三个分量，缺一个就退化成第八轮的「压扁」或第九轮的「只平移」。 */
  {
    await resetFocus0()
    const domBefore = await page.evaluate(() => {
      const cs = [...document.querySelectorAll('.switcher-card.is-deck')]
      return { n: cs.length, deep: Math.max(...cs.map((c) => +c.dataset.index)) }
    })
    await page.evaluate(() => {
      window.__sq = []
      window.__sqStop = false
      const tick = () => {
        if (window.__sqStop) return
        const track = document.querySelector('.switcher-track')
        const cs = [...document.querySelectorAll('.switcher-card.is-deck')]
        const m = track ? new DOMMatrixReadOnly(getComputedStyle(track).transform) : null
        /* 逐卡记 left/top/宽/高：
           · 前卡（data-index 0，层深 0）的 宽/高 之比恒定的同时两者一起缩 ⇒ 等比缩放；
             若只有宽缩 ⇒ scaleX 压扁（第八轮的错）。
           · 邻居卡（data-index 1，层深 1）与前卡的【左缘差】= 露出条宽度 ⇒ 阶梯收紧。 */
        const byIdx = {}
        for (const c of cs) {
          const r = c.getBoundingClientRect()
          byIdx[+c.dataset.index] = {
            x: +r.left.toFixed(2),
            w: +r.width.toFixed(2),
            h: +r.height.toFixed(2)
          }
        }
        window.__sq.push({
          sx: m ? +m.a.toFixed(4) : null,
          tx: m ? +m.e.toFixed(1) : null,
          n: cs.length,
          deep: cs.length ? Math.max(...cs.map((c) => +c.dataset.index)) : -1,
          f: byIdx[0] || null,
          b: byIdx[1] || null
        })
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    /* 从焦点 0 往左拖 280px（= 1.20 层，越过 SQUEEZE_SPAN 0.35 层所需的 1.0 层）：
       focus = max(−0.6, −1.20×0.35) = −0.42 ⇒ over = 0.42 ⇒ 挤压进度吃满 1.0 */
    const y = 500
    await page.mouse.move(330, y)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) {
      await page.mouse.move(330 - i * 14, y, { steps: 1 })
      await page.waitForTimeout(12)
    }
    const dragging = await page.evaluate(() => window.__sq.length)
    await page.mouse.up()
    await page.waitForTimeout(900)
    await page.evaluate(() => { window.__sqStop = true })
    const sqTL = await page.evaluate(() => window.__sq)
    const during = sqTL.slice(0, dragging)
    const fs = sqTL.filter((r) => r.f).map((r) => r.f)
    const bs = sqTL.filter((r) => r.b).map((r) => r.b)

    /* ① 位移分量：整组 tx 吃满 −frontX（= −(screenW − cardW)/2 = −77.5px）。
       第九轮用的是写死的 0.18 屏宽 = 77.4px（数值巧合地几乎一样，但口径不同）；
       第十轮改成由几何推导 ⇒ 这个数在换机型时自动跟着 cardW 走。 */
    const minTx = Math.min(...during.map((r) => r.tx))
    const wantTx = -frontX
    check(`需求③：位移分量 = −frontX = ${wantTx.toFixed(1)}px（前卡视觉左缘落到屏幕左缘）`,
      minTx >= wantTx - 2 && minTx <= wantTx + 2,
      `拖动期最小 tx=${minTx}px（目标 ${wantTx.toFixed(2)}px；` +
        `旧口径 SQUEEZE_SHIFT_FRAC=${DECK.SQUEEZE_SHIFT_FRAC} 已被删除）`)

    /* ② 绝不允许【只有】横向压缩：track 的 scaleX 恒 1。
       第八轮就是在这里把卡压扁到 0.84（Ricky 原话「被压扁」）—— 这条守住。 */
    const sxSet = [...new Set(during.map((r) => r.sx))]
    check('需求③：挤压【不再靠 track 横向压缩】（scaleX 恒 1 —— 第八轮 0.84 压扁已废）',
      sxSet.length === 1 && sxSet[0] === 1,
      `拖动期 scaleX 取值集合={${sxSet.join(',')}}（期望恒 {1}）`)

    /* ③ 等比缩小分量：前卡 宽与高【同比例】缩到 0.951（实测前卡高 654→622）。
       判等比而不是判「宽度恒定」—— 后者正是第九轮量错留下来的假不变量。
       ⚠️ 静止值必须取【拖动前的首帧】，不能用 max()：
         松手回弹会把 k 过冲到负值 ⇒ 卡片短暂胀到 1.009 倍，max() 取到的是那个峰值
         （实测 277.46 而不是 275），于是 gW 变成 0.9426 而不是 0.951 —— 差一点点就漏过去了。 */
    const f0 = fs[0]
    const restW = f0.w
    const restH = f0.h
    const minW = Math.min(...fs.map((o) => o.w))
    const minH = fs.find((o) => o.w === minW).h
    const gW = minW / restW
    const gH = minH / restH
    check('需求③：压缩前的前卡尺寸 = 契约卡宽（防止「静止值」被回弹峰值污染）',
      Math.abs(restW - cardW) < 0.6,
      `拖动前首帧 宽=${restW}（契约 ${cardW}）`)
    check('需求③：等比缩小分量 —— 前卡 宽/高 同比例缩到 0.951（实测 622/654）',
      Math.abs(gW - 0.951) < 0.008 && Math.abs(gH - 0.951) < 0.008,
      `静止 ${restW.toFixed(1)}×${restH.toFixed(1)} → 最深 ${minW.toFixed(1)}×${minH.toFixed(1)}；` +
        `gW=${gW.toFixed(4)} gH=${gH.toFixed(4)}（SQUEEZE_SCALE_MAX=${DECK.SQUEEZE_SCALE_MAX}）`)
    const ratioSet = [...new Set(fs.map((o) => +(o.w / o.h).toFixed(3)))]
    check('需求③：缩小时【宽高比恒定】（等比缩放，不是 scaleX 压扁 —— 内容零形变）',
      ratioSet.length === 1,
      `前卡 宽/高 取值集合={${ratioSet.join(',')}}（期望恒 1 个值）`)

    /* ④ 阶梯收紧分量：邻居卡的「露出条」（前卡左缘 − 邻居卡左缘）从 52.25 收到 ≈23.5。
       这是原话里「漏出的多少」的直接量化 —— 第九轮这一项完全没变（恒 52.25）。 */
    const gaps = during.filter((r) => r.f && r.b).map((r) => +(r.f.x - r.b.x).toFixed(2))
    const gapRest = Math.max(...gaps)
    const gapMin = Math.min(...gaps)
    check(`需求③：阶梯收紧分量 —— 邻居卡露出条 ${gapRest.toFixed(1)}px → ${gapMin.toFixed(1)}px（×${(1 - DECK.SQUEEZE_TIGHTEN).toFixed(2)}）`,
      gapMin < gapRest - 10 && Math.abs(gapMin / gapRest - (1 - DECK.SQUEEZE_TIGHTEN)) < 0.06,
      `露出条 min=${gapMin}px / rest=${gapRest}px = ${(gapMin / gapRest).toFixed(4)}` +
        `（期望 ${(1 - DECK.SQUEEZE_TIGHTEN).toFixed(2)}；第九轮此处恒 1.0）`)
    /* 邻居卡也一起缩 ⇒ 露出条的【高度】同步变矮（这是「底层卡片变小」在背景层唯一可见的表现） */
    const bRestH = bs.reduce((a, o) => Math.max(a, o.h), 0)
    const bMinH = bs.reduce((a, o) => Math.min(a, o.h), Infinity)
    check('需求③：邻居卡（露出条）高度同步变矮 4.9% —— 「缩小底层卡片大小」在背景层的可见表现',
      Math.abs(bMinH / bRestH - 0.951) < 0.015,
      `邻居卡高 ${bRestH.toFixed(1)} → ${bMinH.toFixed(1)}（比 ${(bMinH / bRestH).toFixed(4)}）`)

    /* ⑤ 三分量叠加的最终结果：前卡视觉左缘落到屏幕左缘（与位移分量互为印证） */
    const minLeft = Math.min(...fs.map((o) => o.x))
    check('需求③：满挤压时前卡视觉左缘 = 屏幕左缘（三分量叠加后的落点）',
      Math.abs(minLeft - screenBox.x) < 2.5,
      `前卡左缘 min=${minLeft}px，屏幕左缘=${screenBox.x}px`)

    const minN = Math.min(...during.map((r) => r.n))
    const deepSet = new Set(during.map((r) => r.deep))
    check('需求③：左滑全程【最底部卡片始终在场】（旧实现把越界灌进 focus ⇒ 层深 2.42 > MAX_DEPTH 被收掉 DOM）',
      during.length >= 10 && minN === domBefore.n && deepSet.size === 1 && domBefore.deep === DECK.MAX_DEPTH,
      `拖动期卡数 min=${minN}（静止态 ${domBefore.n}），最深层 index 集合={${[...deepSet].join(',')}}（期望恒 {${domBefore.deep}}）`)

    /* ⑥ 松手：ios-squish（ζ≈0.46）把进度弹回 0 并【过冲】⇒ 三分量一起反向
       （过冲 → k<0 → shift>0 向右弹回 + 卡片短暂胀回 1.7%）。
       第九轮的旧实现只让位移过冲 —— 现在缩放/收紧/位移同相位，必须一起回弹。 */
    const maxTx = Math.max(...sqTL.map((r) => r.tx))
    const settled = sqTL.slice(-6).map((r) => r.tx)
    check('需求③：松手后整组弹性回弹并过冲（向右弹回 >0），最终归位 0',
      maxTx > 3 && settled.every((v) => Math.abs(v) < 0.3),
      `峰值 tx=${maxTx}px（>0 = 向右回弹；理论 ≈frontX×0.20 = ${(frontX * 0.2).toFixed(1)}px）；` +
        `末 6 帧=${settled.map((v) => v.toFixed(2)).join('/')}（期望恒 0）`)
    const fLast = fs[fs.length - 1]
    check('需求③：松手归位后卡片尺寸严格复原（等比缩放回 1，不留残余）',
      Math.abs(fLast.w - restW) < 0.6 && Math.abs(fLast.h - restH) < 0.6,
      `末帧前卡 ${fLast.w}×${fLast.h}（拖动前 ${restW}×${restH}）`)
  }

  // ---- 第十七轮：横滑挤压【不许抖】----
  /* Ricky 原话：「横滑切换疯狂抖动。。。」（附 7.2s 录屏 tOS_Prototype_20260914_194725.mp4）。
     离线逐帧互相关量出的症状：整块卡片组在 12~30ms 内反复反号抽动 48~144 CSS px，
     且三条取样带的位移序列完全一致 ⇒ 是【整组刚体】在动（不是卡内元素各自抖）。

     根因：挤压是一条「事件驱动 + 零过渡直写（sqSnap）」的通道，而它的增益是全组件最高的
     一条 —— 手指位移 ×RUBBER(0.35) ÷span(233.75) = 越界层数；÷SQUEEZE_SPAN(0.35) = 进度 k；
     k ×frontX(77.5) = 整组位移 ⇒ **14px 手指抖动 = 8.8px 整组位移**（221px/层）。
     越界期卡片位姿又被 poseFocus=max(0,focus) 钉死 ⇒ 屏幕上只有整组在动。

     判据两条，缺一不可：
       ① 拖动期 tr.e 单帧跳变 ≤ 8px。改前实测 77.50px（首次越过 focus=0 时一步到位）；
          限速后饱和步长 = SQ_MAX_STEP(0.09) × frontX = 6.98px。
       ② 拖动期 tr.e 方向反转 0 次 —— 这才是「抖动」的定义（反复反号）。
          只看幅度会漏掉「幅度小但高频」的抖。
     ⚠️ 统计窗口严格取【按下 ~ 松手】，绝不含松手之后：那一段用的是 ios-squish
        （ζ≈0.46、过冲 ≈20%）的固有回弹，正是需求③ 要的「弹性回弹」——
        探针实测改后那 12.8px 的尖峰【全部】落在回弹段，混进来会直接判成假阳性。
     ⚠️ 往返的两端必须【一边越界、一边不越界】，才能真的让挤压反复「咬合/释放」：
        x=20   ⇒ raw focus=−1.71 ⇒ 阻尼后 −0.599 ⇒ over=0.599 > SPAN ⇒ k=1（满挤压）
        x=400  ⇒ raw focus=−0.086 ⇒ 阻尼后 −0.030 ⇒ over=0.030 < 死区 0.04 ⇒ k=0 */
  {
    await resetFocus0()
    await page.evaluate(() => {
      window.__jt = []
      window.__jtStop = false
      const tick = () => {
        if (window.__jtStop) return
        const tr = document.querySelector('.switcher-track')
        window.__jt.push(tr ? +new DOMMatrixReadOnly(getComputedStyle(tr).transform).e.toFixed(2) : 0)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.mouse.move(420, 453)
    await page.waitForTimeout(40)
    await page.mouse.down()
    for (let i = 0; i < 8; i++) {
      await page.mouse.move(20, 453, { steps: 1 })
      await page.waitForTimeout(45)
      await page.mouse.move(80, 453, { steps: 1 })
      await page.waitForTimeout(45)
    }
    await page.waitForTimeout(120)
    const jtDuring = await page.evaluate(() => window.__jt.length) // 松手前的采样点数 = 拖动期
    await page.mouse.up()
    await page.waitForTimeout(900) // 等回弹与焦点吸附收完，别把尾巴带进下一段
    const jt = await page.evaluate(() => { window.__jtStop = true; return window.__jt })
    const seg = jt.slice(0, jtDuring)
    let jtMaxJump = 0
    for (let i = 1; i < seg.length; i++) jtMaxJump = Math.max(jtMaxJump, Math.abs(seg[i] - seg[i - 1]))
    let jtRev = 0
    for (let i = 1; i < seg.length - 1; i++) {
      const a = seg[i] - seg[i - 1]
      const b = seg[i + 1] - seg[i]
      if (a * b < 0 && Math.abs(a) > 0.5 && Math.abs(b) > 0.5) jtRev++
    }
    const jtMin = Math.min(...seg)
    const jtMax = Math.max(...seg)
    const SQ_MAX_STEP_CONTRACT = 0.09
    check('第十七轮：横滑挤压【不许抖】—— 拖动期整组位移单帧跳变 ≤ 8px（改前 77.5px）',
      seg.length >= 20 && jtMaxJump <= 8 && jtMaxJump > 0,
      `拖动期 ${seg.length} 帧 · 单帧最大跳变 ${jtMaxJump.toFixed(2)}px` +
        `（限速饱和步长 ${SQ_MAX_STEP_CONTRACT}×${frontX.toFixed(1)} = ${(SQ_MAX_STEP_CONTRACT * frontX).toFixed(2)}px；改前 77.50px）`)
    check('第十七轮：横滑挤压【方向不反号】—— 拖动期 tr.e 反转 0 次（「抖动」的定义）',
      jtRev === 0,
      `拖动期 tr.e 反转 ${jtRev} 次 · 范围 ${jtMin.toFixed(1)}~${jtMax.toFixed(1)}px`)
    check('第十七轮：限速不得削弱挤压行程 —— 拖动期仍要到达 −frontX（前卡左缘贴屏左缘）',
      Math.abs(jtMin + frontX) < 2.5,
      `拖动期最小 tx=${jtMin.toFixed(2)}px（目标 −${frontX.toFixed(2)}px）`)

    /* ---- 真机触摸版（CDP Input.dispatchTouchEvent）----
     * Ricky 的反馈来自安卓 Chrome 的触摸录屏。限速器本身与输入设备无关，但
     * 「触摸路径有没有走到同一套 dragSqueeze / 同一套 sqReset 接管」只有真跑一遍才知道
     * （第十二轮的教训：page.mouse 复现不了触摸特有的行为）。
     * 前置实测（/tmp/vwork/r17/probe-touch-jt.mjs）：触摸下同样单调爬升 0 → −77.5，
     * 单帧 7.15px、反转 0 次 —— 与鼠标路径逐条一致。 */
    await page.waitForTimeout(400)
    await page.evaluate(() => {
      window.__jt = []
      window.__jtStop = false
      const tick = () => {
        if (window.__jtStop) return
        const tr = document.querySelector('.switcher-track')
        window.__jt.push(tr ? +new DOMMatrixReadOnly(getComputedStyle(tr).transform).e.toFixed(2) : 0)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    const cdpT = await ctx.newCDPSession(page)
    const tpT = (x, y) => [{ x, y, radiusX: 12, radiusY: 12, force: 1, id: 1 }]
    /* ⚠️ 第二十一轮修正【输入形状】：旧写法是「touchStart 420 → touchMove 20 → touchMove 80 …」
       的两点硬跳 —— 首笔就是单帧 −400px（= 24000px/s，指尖不可能）。第二十一轮加的
       【坐标连续性守卫】会（正确地）把它判成非物理瞬移并吸收掉，而吸收的语义是「基线跟着瞬移
       搬走」⇒ startX 被搬到 20，之后 x=80 变成 dx=+60（**向右**）⇒ 挤压通道（只在 focus<0 有量）
       整个不再被触发 ⇒ 本用例量到的 tx 恒 0（改后假 FAIL，实际行为没坏）。
       改成【真实步长】的斜坡：同一段行程（420 → 20）分 18 步走完，再在原位 ±6px 微抖。
       轨迹形状与四条断言一字未改（单调爬到 −frontX、单帧跳变 ≤ 8px、反转 0 次、帧数 ≥ 20），
       只是去掉了「手指一步 400px」这个不可能的前提。 */
    const ttTrail = []
    for (let i = 1; i <= 18; i++) ttTrail.push(420 - (400 * i) / 18)
    for (let k = 0; k < 3; k++) ttTrail.push(20 + (k % 2 ? -6 : 6))
    await cdpT.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tpT(420, 453) })
    for (const x of ttTrail) {
      await cdpT.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tpT(x, 453) })
      await page.waitForTimeout(45)
    }
    await page.waitForTimeout(120)
    const ttDuring = await page.evaluate(() => window.__jt.length)
    await cdpT.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(900)
    const tt = await page.evaluate(() => { window.__jtStop = true; return window.__jt })
    const ttSeg = tt.slice(0, ttDuring)
    let ttJump = 0
    for (let i = 1; i < ttSeg.length; i++) ttJump = Math.max(ttJump, Math.abs(ttSeg[i] - ttSeg[i - 1]))
    let ttRev = 0
    for (let i = 1; i < ttSeg.length - 1; i++) {
      const a = ttSeg[i] - ttSeg[i - 1]
      const b = ttSeg[i + 1] - ttSeg[i]
      if (a * b < 0 && Math.abs(a) > 0.5 && Math.abs(b) > 0.5) ttRev++
    }
    const ttMin = Math.min(...ttSeg)
    check('第十七轮（真机触摸）：触摸路径下挤压同样不抖 —— 单帧跳变 ≤ 8px、反转 0 次、行程达 −frontX',
      ttSeg.length >= 20 && ttJump <= 8 && ttRev === 0 && Math.abs(ttMin + frontX) < 2.5,
      `触摸拖动期 ${ttSeg.length} 帧 · 单帧最大跳变 ${ttJump.toFixed(2)}px · 反转 ${ttRev} 次 · ` +
        `最小 tx=${ttMin.toFixed(2)}px（目标 −${frontX.toFixed(2)}）`)
  }

  // ---- 需求②（第九轮）：垃圾桶「松手后再出现」+ 点空白退场「立即消失」 ----
  {
    await page.evaluate(() => window.__system.exitSwitcherToHome())
    await page.waitForTimeout(450)
    await page.evaluate(() => window.__system.openApp('calculator'))
    await page.waitForTimeout(350)
    const cx = 215, startY = 925
    await page.mouse.move(cx, startY)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) { await page.mouse.move(cx, startY - i * 14, { steps: 1 }); await page.waitForTimeout(12) }
    /* 停驻 500ms ⇒ dwell 预提交成立、deck 与 dock 都已挂载 —— 这样才能证明
       「桶在 DOM 里但 opacity 恒 0」，而不是「桶压根没渲染」这种弱结论。 */
    for (let i = 0; i < 10; i++) { await page.mouse.move(cx, startY - 280, { steps: 1 }); await page.waitForTimeout(50) }
    const opDuring = await page.evaluate(() => {
      const d = document.querySelector('.switcher-dock')
      return { dom: !!d, op: d ? +(+getComputedStyle(d).opacity).toFixed(3) : null }
    })
    check('需求②：手势进行中垃圾桶【不出现】（旧实现按进度 0.5 起淡入 ⇒ 手指没松就满亮）',
      opDuring.dom === true && opDuring.op === 0,
      `手势中 dock 在 DOM=${opDuring.dom}，opacity=${opDuring.op}（期望 0）`)
    await page.mouse.up()
    await page.waitForTimeout(650)
    const opAfter = await page.evaluate(() => +(+getComputedStyle(document.querySelector('.switcher-dock')).opacity).toFixed(3))
    check('需求②：松手后垃圾桶淡入出现', opAfter === 1, `松手后 opacity=${opAfter}（期望 1）`)

    /* 点空白退场 → 垃圾桶必须【立即】归零（.is-closing 下 transition:none，
       所以「算出来的过渡时长」必须是 0s；旧版是 180ms 淡出）。 */
    await page.evaluate(() => {
      window.__dk = []
      const t0 = performance.now()
      const tick = () => {
        const d = document.querySelector('.switcher-dock')
        window.__dk.push({ t: +(performance.now() - t0).toFixed(0), op: d ? +(+getComputedStyle(d).opacity).toFixed(3) : null, tr: d ? getComputedStyle(d).transitionDuration : null })
        if (performance.now() - t0 < 600) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.mouse.click(400, 300)
    await page.waitForTimeout(700)
    const dk = await page.evaluate(() => window.__dk)
    const firstZero = dk.find((r) => r.op === 0)
    const hasZeroTransition = dk.some((r) => r.tr && r.tr.split(',').every((v) => parseFloat(v) === 0))
    check('需求②：点空白退场时垃圾桶【立即】消失（closing 下 transition:0s，不是 180ms 淡出）',
      !!firstZero && firstZero.t <= 40 && hasZeroTransition,
      `首次读到 opacity=0 于 t=${firstZero?.t}ms（期望 ≤40ms = 无缝）；` +
        `closing 期间 transition-duration=${dk.find((r) => r.tr && r.tr.split(',').every((v) => parseFloat(v) === 0))?.tr}`)
  }

  // ---- 需求④（第九轮）：桌面入场卡片不半透明 ----
  {
    /* 桌面路径的【入场前提】必须先构造出来，否则采样永远是 0 帧（第一跑就是 0 帧 FAIL）：
       ① recentApps 必须 > 0 —— HomeIndicator 的 switcherCandidate 第一项就要求它，
          为 0 时 onProgress 走 snapTo() 分支，进度恒 0、根节点根本不渲染；
       ② activeAppId 必须为 null —— 这才是「桌面路径」，homeEntranceFollowing 才成立。
       做法：开一个应用（登记进 recentApps）再回桌面。
       ⚠️ 离场时 recentApps 不能为空：终局用例（需求⑩）会清空最近任务，
       所以在它之后跑的桌面用例都得自己重新构造。 */
    await page.evaluate(() => window.__system.openApp('calculator'))
    await page.waitForTimeout(350)
    await page.evaluate(() => window.__system.exitSwitcherToHome())
    await page.waitForTimeout(450)
    const deskPre = await page.evaluate(() => ({
      active: window.__system.activeAppId,
      recent: window.__system.recentApps.length
    }))
    check('需求④ 前置：桌面路径成立（activeAppId=null 且 recentApps>0 —— 否则手势不产生任何进度）',
      deskPre.active === null && deskPre.recent > 0,
      `activeAppId=${deskPre.active} recentApps=${deskPre.recent}（期望 null / >0）`)

    await page.evaluate(() => {
      window.__op = []
      window.__opStop = false
      const tick = () => {
        if (window.__opStop) return
        const c = document.querySelector('.app-switcher .switcher-card.is-deck')
        if (c) window.__op.push(+getComputedStyle(c).opacity)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    const cx = 215, startY = 925
    await page.mouse.move(cx, startY)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) { await page.mouse.move(cx, startY - i * 14, { steps: 1 }); await page.waitForTimeout(12) }
    await page.waitForTimeout(80)
    const opMid = await page.evaluate(() => { window.__opStop = true; return window.__op })
    const uniq = [...new Set(opMid)]
    check('需求④：桌面上滑入场全程卡片 opacity 恒 1（旧版 opacity = 手势进度 ⇒ 半透明入场）',
      opMid.length >= 10 && uniq.length === 1 && uniq[0] === 1,
      `采样 ${opMid.length} 帧，取值集合={${uniq.join(',')}}（<10 帧 ⇒ 先看「需求④ 前置」那条）`)
    await page.mouse.up()
    await page.waitForTimeout(700)
  }

  // ---- 需求⑤（第九轮）：跟手松手后归位【无跳变】 ----
  {
    /* 复现路径（第九轮探针 /tmp/vwork/r9/probe-settle.mjs 实测过最坏 50.5px 硬跳）：
       应用内上滑 → 停驻 → 手指横向拖 120px → 松手。
       旧实现 followFree 从未被释放（释放只写在 onPointerUp 里，而这条手势的 pointerup
       落在 HomeIndicator 上）⇒ 交接那一帧跟手卡带着 120×0.42 = 50.4px 偏移消失。
       判据：交接那一刻（is-follow 消失的那一帧）「可见前卡」的 x 必须与前一帧连续。

       ⚠️⚠️ 判据必须只覆盖【松手之后】—— 这里踩过一次坑（`why-jump.mjs` 实测）：
       横移若写成 `page.mouse.move(cx + 120)` 一次性到位，手指就是【瞬移 120px】，
       卡片严格跟手 ⇒ 单帧 Δx = 120×0.42 = 50.4px，被误判成「跳变」（实测 49.8px
       @ t=689ms，而同一帧的 transform translateX 恰好从 0 变 50.4、dragX 从 0 变 120
       —— 是手指跳、不是卡片跳）。两个修法一起上：
         ① 横移改【小步】（5px × 24 步 = 120px），把「手指瞬移」这个人造量从样本里去掉；
         ② 连续性只在 `releasedAt` 之后的窗口上判 —— 需求原话是「**松手后**归位时跳变」，
            手势期的跟手位移本来就该跟手指一样快。 */
    await page.evaluate(() => window.__system.exitSwitcherToHome())
    await page.waitForTimeout(450)
    await page.evaluate(() => window.__system.openApp('calculator'))
    await page.waitForTimeout(400)
    await page.evaluate(() => {
      window.__hs = []
      window.__hsStop = false
      const tick = () => {
        if (window.__hsStop) return
        const f = document.querySelector('.switcher-card.is-follow')
        const d0 = document.querySelector('.switcher-card.is-deck[data-depth="0"]')
        const box = (el) => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1) } }
        window.__hs.push({
          t: +(performance.now() - window.__hsT0).toFixed(1),
          follow: f ? box(f) : null,
          front: d0 ? box(d0) : null,
          ff: +(window.__system.switcherDragX ?? 0).toFixed(1)
        })
        requestAnimationFrame(tick)
      }
      window.__hsT0 = performance.now()
      requestAnimationFrame(tick)
    })
    const cx = 215, startY = 925
    await page.mouse.move(cx, startY)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) { await page.mouse.move(cx, startY - i * 14, { steps: 1 }); await page.waitForTimeout(12) }
    /* 横移 120px，分 24 小步（见上方注释 ①） */
    for (let i = 1; i <= 24; i++) { await page.mouse.move(cx + i * 5, startY - 280, { steps: 1 }); await page.waitForTimeout(12) }
    await page.mouse.up()
    const releasedAt = await page.evaluate(() => +(performance.now() - window.__hsT0).toFixed(1))
    await page.waitForTimeout(900)
    const hs = await page.evaluate(() => { window.__hsStop = true; return window.__hs })
    /* 逐帧构造「视觉前卡」序列：有跟手卡就用它，否则用堆叠前卡 */
    const seq = hs.map((r) => (r.follow ? { ...r.follow, src: 'F' } : r.front ? { ...r.front, src: 'D' } : null)).filter(Boolean)
    /* 只看松手之后（含紧邻的最后一帧，容差 24ms ≈ 1.5 帧） */
    const idx0 = Math.max(0, hs.findIndex((r) => r.t >= releasedAt - 24))
    const settle = seq.slice(idx0)
    let worst = 0, worstAt = null
    for (let i = 1; i < settle.length; i++) {
      const dx = Math.abs(settle[i].x - settle[i - 1].x)
      if (dx > worst) { worst = dx; worstAt = { t: hs[idx0 + i].t, from: settle[i - 1].src, to: settle[i].src, dx: settle[i].x - settle[i - 1].x } }
    }
    /* 手势期也留一条宽松的连续性检查：小步横移下每帧应远小于 12px。
       它的作用是守住「跟手期不许出现人造跳变」，不是本条需求的主判据。 */
    let worstDrag = 0
    for (let i = 1; i < idx0; i++) worstDrag = Math.max(worstDrag, Math.abs(seq[i].x - seq[i - 1].x))
    check('需求⑤：跟手松手归位（含 120px 横向漂移）交接前后【无跳变】（旧实现单帧硬跳 50.5px）',
      settle.length >= 15 && worst < 12 && Math.abs(worstAt?.dx ?? 99) < 12 && worstDrag < 12,
      `松手后（t≥${releasedAt}ms，${settle.length} 帧）最大单帧位移=${worst.toFixed(1)}px @ t=${worstAt?.t}ms` +
        `（${worstAt?.from}→${worstAt?.to}，Δx=${worstAt?.dx?.toFixed(1)}）；手势期最大=${worstDrag.toFixed(1)}px；` +
        `DragX 峰值=${Math.max(...hs.map((r) => r.ff))}px（旧实现残余 ≈ DragX×0.42 = 50.4px）`)

  }

  // ---- 需求⑥（第九轮）：退场动画只播一次 + 不回弹闪屏 ----
  {
    await resetFocus0()
    await page.evaluate(() => {
      window.__ex = []
      window.__exStop = false
      const t0 = performance.now()
      const tick = () => {
        if (window.__exStop) return
        const track = document.querySelector('.switcher-track')
        const m = track ? new DOMMatrixReadOnly(getComputedStyle(track).transform) : null
        window.__ex.push({
          t: +(performance.now() - t0).toFixed(1),
          root: !!document.querySelector('.app-switcher'),
          tx: m ? +m.e.toFixed(1) : null
        })
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.mouse.click(400, 300)
    await page.waitForTimeout(1000)
    const ex = await page.evaluate(() => { window.__exStop = true; return window.__ex })
    const withTrack = ex.filter((r) => r.tx !== null)
    const minTx = Math.min(...withTrack.map((r) => r.tx))
    /* 「播两遍」的指纹：轨道先走到 −335，然后【回弹/回到 0】再往左走一次。
       旧实现实测：t=316ms 到 −335 → t=328ms 弹回 0（卡片在屏幕正中闪现）→ 再左滑淡出。 */
    let backs = 0
    for (let i = 1; i < withTrack.length; i++) if (withTrack[i].tx > withTrack[i - 1].tx + 5) backs++
    const last = ex[ex.length - 1]
    check('需求⑥：点空白退场全程轨道单调左移（旧实现在 t≈328ms 弹回 0 = 动画播第二遍 + 闪屏）',
      minTx <= -330 && backs === 0,
      `轨道最左 tx=${minTx}px（目标 −335），回弹帧数=${backs}（期望 0）`)
    check('需求⑥：退场动画播完后切换器【立即卸载】（不再留 340ms 的 linger 中间态）',
      last.root === false && last.tx === null,
      `末帧 t=${last.t}ms root 在场=${last.root}（期望 false）`)
  }

  // ---- 需求①（第九轮）：图标/标签与卡片作为一个整体位移与缩放 ----
  {
    await page.evaluate(() => window.__system.exitSwitcherToHome())
    await page.waitForTimeout(450)
    await page.evaluate(() => window.__system.openApp('calculator'))
    await page.waitForTimeout(400)
    const cx = 215, startY = 925
    await page.mouse.move(cx, startY)
    await page.mouse.down()
    /* 上滑 180px（⇒ 进度 ≈0.69、卡缩放 ≈0.75，与冒烟探针同量程）后【停住 500ms】。
       停驻不是可选项：`preCommit`（邻居卡提前进场）由 HomeIndicator 的 switcherDwell 触发，
       而它要求「上滑 >5% 且速度 <150px/s 持续 120ms」。没有停驻 ⇒ renderDeck 为假
       ⇒ 一张堆叠卡都没有 ⇒「前卡标签让位」这条断言会退化成空断言（列表为空也算通过）。 */
    for (let i = 1; i <= 20; i++) { await page.mouse.move(cx, startY - i * 9, { steps: 1 }); await page.waitForTimeout(11) }
    for (let i = 0; i < 10; i++) { await page.mouse.move(cx, startY - 180, { steps: 1 }); await page.waitForTimeout(50) }
    const holdA = await page.evaluate(() => {
      const f = document.querySelector('.switcher-card.is-follow')
      const l = f?.querySelector('.switcher-card-label')
      const b = f?.getBoundingClientRect()
      const lb = l?.getBoundingClientRect()
      const ic = l?.querySelector('.app-icon-anchor')?.getBoundingClientRect()
      return {
        card: b ? { x: +b.x.toFixed(1), w: +b.width.toFixed(1) } : null,
        labelX: lb ? +lb.x.toFixed(1) : null,
        ico: ic ? +ic.width.toFixed(1) : null,
        txt: l?.textContent.trim() || '',
        deckCards: document.querySelectorAll('.switcher-card.is-deck').length,
        deckNames: [...document.querySelectorAll('.switcher-card.is-deck .switcher-card-label')].map((e) => e.textContent.trim()).filter((s) => s)
      }
    })
    check('需求①：跟手卡自带标签行（图标 + 应用名），且标签左缘与卡左缘对齐（旧实现跟手卡没有标签）',
      !!holdA.card && holdA.txt.length > 0 && Math.abs(holdA.labelX - holdA.card.x) <= 1,
      `跟手卡 x=${holdA.card?.x} 标签 x=${holdA.labelX}（差 ${holdA.labelX !== null ? (holdA.labelX - holdA.card.x).toFixed(1) : '—'}px）标签="${holdA.txt}"`)
    /* 缩放：卡越大标签越大 —— 净缩放 = 卡缩放 / previewScale。
       实测（上滑到 ~0.69 量程）：卡宽 322.7 ⇒ 图标 28.2px（= 24 × 0.7505/0.6395）。 */
    const expectIco = holdA.card ? 24 * (holdA.card.w / 430) / (cardW / screenBox.width) : 0
    check('需求①：标签随卡片一起缩放（图标尺寸 = 24 × 卡缩放 / 卡位缩放）',
      holdA.ico !== null && Math.abs(holdA.ico - expectIco) < 0.8,
      `图标实测=${holdA.ico}px，按卡宽 ${holdA.card?.w} 推算=${expectIco.toFixed(1)}px`)
    check('需求①：跟手卡顶替期间堆叠前卡的标签【让位】（否则屏幕上同时出现两份图标+名称）',
      holdA.deckCards >= 2 && holdA.deckNames.length === 0,
      `堆叠卡在 DOM 数=${holdA.deckCards}（≥2 = 停驻预提交已进场；含被跟手卡顶替的 C 位卡共 3 张）；` +
        `带非空文本的标签数=${holdA.deckNames.length}（期望 0 —— 标签已全部迁到跟手卡）`)

    /* 松手落位后：标签必须无缝移交给堆叠前卡 —— 位置与尺寸都回到 24px 契约 */
    await page.mouse.up()
    await page.waitForTimeout(1200)
    const after = await page.evaluate(() => {
      const out = {}
      for (const c of document.querySelectorAll('.switcher-card.is-deck')) {
        const l = c.querySelector('.switcher-card-label')
        if (!l) continue
        const ic = l.querySelector('.app-icon-anchor')?.getBoundingClientRect()
        out[c.dataset.index] = { x: +l.getBoundingClientRect().x.toFixed(1), ico: ic ? +ic.width.toFixed(1) : null, txt: l.textContent.trim() }
      }
      return { out, follow: !!document.querySelector('.switcher-card.is-follow') }
    })
    const l0 = Object.values(after.out).find((v) => v.txt)
    check('需求①：交接后标签回到堆叠 C 位卡（x = 卡左缘、图标 24px），跟手卡已卸载',
      after.follow === false && !!l0 && Math.abs(l0.x - frontX) <= 1 && Math.abs(l0.ico - 24) <= 0.6,
      `跟手卡在场=${after.follow}；C 位标签 x=${l0?.x}（期望 ${frontX}）图标=${l0?.ico}px（期望 24）文本="${l0?.txt}"`)
  }

  // ---- 需求⑧：垃圾桶图标与通知中心同一份（trash-2：桶身 + 桶盖 + 两根竖线）----
  {
    await resetFocus0()
    const live = await page.evaluate(() => document.querySelector('.switcher-trash svg')?.outerHTML || '')
    /* 直接从通知中心源码里取那一份 —— 「与通知栏一致」是 Ricky 的原话，不能靠肉眼比对 */
    const ncSrc = readFileSync(new URL('../src/components/system/NotificationCenter.vue', import.meta.url), 'utf8')
    const ncSvg = [...ncSrc.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0]).find((s) => s.includes('M19 6v14')) || ''
    /* 只比对「画了什么」：路径 d + 每条竖线的两端 x —— 正是旧版单路径图标的缺口 */
    const sig = (s) => [
      [...s.matchAll(/d="([^"]+)"/g)].map((m) => m[1]).join('|'),
      [...s.matchAll(/<line\b[^>]*x1="([^"]+)"[^>]*x2="([^"]+)"/g)].map((m) => `${m[1]}→${m[2]}`).join('|')
    ].join('||')
    const lines = (live.match(/<line\b/g) || []).length
    check('需求⑧：切换器垃圾桶 = 通知中心同一份 trash-2（含两根竖线，旧版「中间是空的」）',
      !!live && !!ncSvg && lines === 2 && sig(live) === sig(ncSvg),
      `竖线数=${lines}（期望 2）；与通知中心源码比对=${sig(live) === sig(ncSvg) ? '一致' : '不一致'}｜${sig(live).slice(0, 110)}`)
  }

  // ---- 需求①（第十轮）：应用内停驻时邻居卡「左侧优雅入场」 ----
  /* 「没有动画」是观感判断，必须先证伪再做契约：
     探针（/tmp/vwork/r10/probe-neighbor-enter.mjs）实测第九轮那套【确实在跑】
     （16~17 个 x 取值），所以问题不是「有没有」而是「看不看得见」——
     行程 36px（其中一半在屏外）、两层同一拍到达、而且这张卡大半被跟手卡盖住。
     第十轮的判据因此盯三件事：①行程量级 ②时间分布（不能「甩」进去）③淡入不晚于位移。 */
  {
    /* 先构造出邻居卡：renderedCards 用【绝对列表索引】过滤，只有一个应用时没有邻居卡 */
    await page.evaluate(() => window.__system.exitSwitcherToHome())
    await page.waitForTimeout(400)
    for (const id of ['camera', 'phone', 'clock']) {
      await page.evaluate((i) => window.__system.openApp(i), id)
      await page.waitForTimeout(120)
      await page.evaluate(() => window.__system.exitSwitcherToHome())
      await page.waitForTimeout(160)
    }
    await page.evaluate(() => window.__system.openApp('calculator'))
    await page.waitForTimeout(400)

    await page.evaluate(() => {
      window.__nb = []
      window.__nbStop = false
      const t0 = performance.now()
      const tick = () => {
        if (window.__nbStop) return
        const row = { t: +(performance.now() - t0).toFixed(0) }
        for (const c of document.querySelectorAll('.switcher-card.is-deck')) {
          /* ⚠️ 第十六轮：必须读卡片【自身】的 transform 矩阵，不能再读 getBoundingClientRect()。
             rect 会把祖先的群组变换（.switcher-deck-group 的 scale(k) / translate）一起乘进来，
             与本块的三条契约（行程量级 / 时长占比 / 0.93 撑开）都不是同一个量。实测污染幅度：
               · 「0.93 撑开」→ 0.8522（把跟手期 k=1.17 的帧当成了「落位」）
               · 入场总时长 479ms → 虚报 1264ms（末段 78% 是松手后群组回落到单位阵的位移）
             m.a = 卡自身的 scale、m.e = 卡自身的 translateX（translate3d 写在 scale 左边，不被缩放）。
             这两个量只反映卡片自己的 CSS 过渡 —— 正是本块要守的东西。 */
          const m = new DOMMatrix(getComputedStyle(c).transform)
          const r = c.getBoundingClientRect()
          row[c.dataset.index] = {
            x: +m.e.toFixed(2),
            w: +(c.offsetWidth * m.a).toFixed(2),
            h: +r.height.toFixed(2),
            op: +getComputedStyle(c).opacity
          }
        }
        window.__nb.push(row)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    /* 慢速上滑 180px 后【停住 900ms】—— 停驻触发 preCommit，入场全程被采样 */
    const cx = 215, startY = 925
    await page.mouse.move(cx, startY)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) { await page.mouse.move(cx, startY - i * 9, { steps: 1 }); await page.waitForTimeout(11) }
    await page.waitForTimeout(900)
    await page.mouse.up()
    await page.waitForTimeout(1100)
    await page.evaluate(() => { window.__nbStop = true })
    const nbTL = await page.evaluate(() => window.__nb)
    /* ⚠️ t 在【外层行】上，不在卡对象里 —— 必须显式并进来再展平。
       （踩过一次：`.map(r => r['1'])` 之后 `.t` 全是 undefined ⇒ 时长 NaN，
        而行程断言照常通过，很容易误判成「曲线坏了」。） */
    const nb1 = nbTL.filter((r) => r['1']).map((r) => ({ t: r.t, ...r['1'] }))
    const nb2 = nbTL.filter((r) => r['2']).map((r) => ({ t: r.t, ...r['2'] }))

    /* ⚠️ 与需求③ 同一个坑：落位值必须取【末帧】而不是 max()——
       末段有 0.2% 的过冲（cubic-bezier 的 y2 = 1.06），用 max() 当落位值会永远找不到终点。
       终点帧改用「最后一帧仍在动的下一帧」（帧间差 < 0.05 视为已停）。 */
    const startX = nb1[0].x
    const settledX = nb1[nb1.length - 1].x
    let iEnd = nb1.length - 1
    while (iEnd > 0 && Math.abs(nb1[iEnd].x - nb1[iEnd - 1].x) < 0.05) iEnd--
    const iStart = 0
    const dur = nb1[iEnd].t - nb1[iStart].t
    const travel = settledX - startX
    const uniq = new Set(nb1.map((o) => o.x)).size
    const wantTravel = cardW * (0.42 + 0.16) // neighborEnterDx(1)：首层 0.42 + 每深 0.16 卡宽

    check('需求①：邻居卡入场【必须真的在动】且行程量级足够（第九轮 36px ⇒ 读作「没动画」）',
      nb1.length >= 20 && uniq >= 20 && travel > wantTravel * 0.85,
      `采样帧 ${nb1.length}，x 取值数=${uniq}（60fps），行程=${travel.toFixed(1)}px` +
        `（契约 ${(wantTravel * 0.85).toFixed(1)}~${(wantTravel * 1.15).toFixed(1)}px；第九轮固定 36px）`)

    /* 时间分布 —— 本轮返工的核心判据。
       第一版曲线 cubic-bezier(0.22,1.12,0.36,1)（从吸附过渡抄来的）实测：
         「47% 行程挤在开头 49ms、总时长 316ms」⇒ 卡片是【甩】进去的，
         把时长拉到 460ms 也没用（前段斜率决定观感）。
       所以判据不是「有没有走完」，而是【中段有没有抢跑】：
         t50 / dur ≥ 0.22 —— 一半行程必须花掉至少 22% 的时长。
       实测：第一版 0.16（FAIL）｜现用 0.42,0,0.2,1.06 → 0.38（PASS）。 */
    const at = (frac) => {
      const target = startX + travel * frac
      const hit = nb1.findIndex((o) => o.x >= target)
      return hit < 0 ? dur : nb1[hit].t - nb1[iStart].t
    }
    const t25 = at(0.25), t50 = at(0.5), t75 = at(0.75)
    const seg = [t25 / dur, (t50 - t25) / dur, (t75 - t50) / dur, (dur - t75) / dur]
    check('需求①：入场【不是「甩」进去的】—— 50% 行程必须用掉 ≥22% 的时长',
      dur >= 380 && t50 / dur >= 0.22 && (dur - t75) / dur <= 0.6,
      `总时长=${dur}ms（契约 ≥380）；25/50/75% 行程分别用 ${t25}/${t50}/${t75}ms` +
        ` ⇒ t50 占比 ${(t50 / dur * 100).toFixed(0)}%（契约 ≥22%；第一版 16%）；` +
        `四段占比=${seg.map((v) => (v * 100).toFixed(0) + '%').join('/')}`)

    /* 淡入必须【早于】位移结束：缓起曲线的前 20% 只走 13% 行程，
       若沿用 0.22~0.3s 的默认淡入，卡片变实的时候已经快到位了 ——「滑进来」这段白做。 */
    const iQuarter = nb1.findIndex((o, i) => i >= iStart && o.x >= nb1[iStart].x + travel * 0.35)
    const opAtQuarter = iQuarter < 0 ? 0 : nb1[iQuarter].op
    check('需求①：卡片的淡入【不晚于】位移（走到 35% 行程时已基本实体，否则滑入过程看不见）',
      opAtQuarter >= 0.85,
      `35% 行程处 opacity=${opAtQuarter}（期望 ≥0.85；位移 0.48s / 淡入 0.16s）`)

    /* 起点略小 + 落位撑开：与 deck 的垂直中心不变量一起构成「有质感的入场」 */
    const wMin = Math.min(...nb1.map((o) => o.w))
    const wEnd = Math.max(...nb1.map((o) => o.w))
    check('需求①：邻居卡自 0.93 倍「撑开」落位（起点略小，落位时长大）',
      Math.abs(wMin / wEnd - 0.93) < 0.01,
      `宽 ${wMin.toFixed(1)} → ${wEnd.toFixed(1)}（比 ${(wMin / wEnd).toFixed(4)}，期望 0.93）`)

    check('需求①：越深的卡行程越长（逐层递增 ⇒ 读起来是「逐张涌出」而不是整块平移）',
      nb2.length > 0 &&
        Math.max(...nb2.map((o) => o.x)) - Math.min(...nb2.map((o) => o.x)) > travel + 20,
      `层深 1 行程=${travel.toFixed(1)}px，层深 2 行程=` +
        `${(Math.max(...nb2.map((o) => o.x)) - Math.min(...nb2.map((o) => o.x))).toFixed(1)}px`)
  }

  // ---- 需求②（第十轮）：卡片投影减重 ----
  {
    await resetFocus0()
    const sh = await page.evaluate(() => {
      const parse = (s) => {
        const a = /rgba?\(\s*0,\s*0,\s*0,\s*([0-9.]+)\s*\)/.exec(s)
        const nums = [...s.matchAll(/(-?[0-9.]+)px/g)].map((x) => parseFloat(x[1]))
        return { a: a ? +a[1] : null, y: nums[0], blur: nums[1] }
      }
      const out = {}
      for (const c of document.querySelectorAll('.switcher-card.is-deck')) {
        out[c.dataset.index] = parse(getComputedStyle(c.querySelector('.switcher-card-body')).boxShadow)
      }
      const f = document.querySelector('.switcher-card.is-follow .switcher-card-body')
      if (f) out.follow = parse(getComputedStyle(f).boxShadow)
      return out
    })
    const s0 = sh[0]
    const s1 = sh[1]
    check('需求②：卡片投影不再过重（旧值 0.42 alpha / 36px 模糊 / 下移 14px）',
      !!s0 && s0.a !== null && s0.a <= 0.3 && s0.blur <= 28 && s0.y <= 13,
      `焦点层 = rgba(0,0,0,${s0?.a}) ${s0?.y}px ${s0?.blur}px（期望 ≤0.30 / ≤13px / ≤28px）`)
    check('需求②：越深的卡投影越轻（背景卡本就在暗遮罩上，重投影只会把遮罩也压黑）',
      !!s1 && s1.a !== null && s1.a < s0.a && s1.blur < s0.blur,
      `层深 1 = rgba(0,0,0,${s1?.a}) ${s1?.y}px ${s1?.blur}px < 层深 0 = rgba(0,0,0,${s0?.a})`)
    const bad = Object.entries(sh).filter(([, v]) => !v || v.a === null || v.a > 0.31 || v.blur > 28)
    check('需求②：没有任何一张卡（含跟手卡）还在用旧的 0.42 / 36px 投影',
      bad.length === 0,
      `各卡投影：${Object.entries(sh).map(([k, v]) => `${k}=${v?.a}/${v?.blur}px`).join('  ')}`)
  }
}

/* ================== 第十二轮（2026-09-13）==================
   Ricky 原话：
     ①「移动端通过安卓的 Chrome 浏览器打开，上滑删除多任务卡片的时候，
        总是变成误触成左右滑动，帮我查一查是什么原因？」
     ②「另外上滑多任务卡片的时候还是会有一个透明的渐变，取消上滑过程中卡片的透明度变化」

   ⚠️ 为什么本轮的护栏必须用【真实触摸】驱动，不能再用 page.mouse：
     本文件其余用例全走 page.mouse ⇒ pointerType='mouse'：坐标精确、无接触面抖动、
     不过 Chrome 的触摸 slop。而本轮两个缺陷都【只在触摸时序下稳定复现】：

     ① 模式判定「一帧定终身」（旧实现 onPointerMove：第一帧 |dx|≥6 或 |dy|≥6 就定模式，
        且 |dy| > 1.4|dx| 才算上滑）⇒ 等价于「首个 pointermove 仰角 ≤ 54.5° 就判成横滑」。
        而触摸屏的第一个 pointermove 恰恰最不可靠：接触面是椭圆、按下瞬间质心还在滚动、
        单手持机时拇指起手走的是【切向】（比整条轨迹平得多）、且 Chrome 要等累计走够
        8~12px 才派发第一帧 —— 方向当场定型，没有第二次机会。
        探针实测（/tmp/vwork/r12/probe-touch.mjs，9 个场景，pointercancel 全程 0）：
          首帧 (7,-7) 之后 21 帧纯纵向 → 旧规则锁 'h'
          首帧 (6,+2)（拇指横滚）之后 290px 纯纵向 → 旧规则锁 'h'，
            这 290px 里的 60px 横向漂移【全部被当成翻卡量】→ 卡片横向实走 31.6px、
            __switcherSettle.cur = 0.28 层 —— 就是用户看到的「变成左右滑动」。
        蒙特卡洛（/tmp/vwork/r12/mc.mjs，20 万样本）：起手仰角 62° 时旧规则 29.3% 判成横滑；
        即便完全竖直，仅 3px 接触面抖动也能让旧规则 3.6% 误判。

     ② hitCardId 取【最上层】.switcher-card ⇒ 命中跟手卡（.is-follow，无 data-app-id）
        返回 null。跟手卡在 onPointerDown（followFreeSnap(0) ⇒ settledOne 失效）之后由
        Vue 立刻挂出来盖在顶层卡正上方。触摸时序下「按下 → 第一帧 pointermove」至少隔一帧
        （还要走 Chrome 的 touch slop），DOM 必然已补丁 ⇒ 100% 复现；鼠标时序偶尔抢在
        补丁之前 ⇒ 竞态漏网（这也是它能在 e2e 里活过 5 轮的原因）。
        后果有两个：上滑删卡恒删不掉；点顶层卡恒落到 exitWithAnimation() ⇒ 点卡片反而回桌面。

   触摸注入方式：CDP `Input.dispatchTouchEvent` —— Chrome 据此合成
   pointerType='touch' 的【真实】指针事件（isTrusted = true），走的就是安卓 Chrome 那条路径。 */
{
  const cdp = await ctx.newCDPSession(page)
  const APP5 = ['settings', 'clock', 'phone', 'camera', 'calculator']
  const tp = (x, y) => [{ x, y, id: 1, force: 1, radiusX: 12, radiusY: 12 }]

  async function seedApps() {
    await page.evaluate(() => {
      window.__system.closeSwitcher?.()
      window.__system.exitSwitcherToHome?.()
    })
    await page.waitForTimeout(420)
    for (const id of APP5) {
      await page.evaluate((a) => window.__system.openApp(a), id)
      await page.waitForTimeout(230)
    }
  }

  /** 真实触摸上滑 + 停驻 320ms → 进切换器（dwell 门槛 120ms） */
  async function touchEnterSwitcher() {
    const box = await page.evaluate(() => {
      const r = (document.querySelector('.home-indicator') || document.querySelector('.screen')).getBoundingClientRect()
      const sc = document.querySelector('.screen').getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height - 3, screenY: sc.y }
    })
    const travel = Math.min(320, box.y - box.screenY - 40)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(box.x, box.y) })
    for (let i = 1; i <= 26; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(box.x, box.y - (travel * i) / 26) })
      await page.waitForTimeout(12)
    }
    await page.waitForTimeout(320)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(1000)
    return page.evaluate(() => window.__system.appSwitcherOpen)
  }

  /** 在【顶卡中心】起手，按 offsets（相对位移序列）做一次真实触摸手势。
   *  逐帧记录：被移位卡的 opacity / 卡体 opacity / 卡片 x（用来判「有没有变成横滑」）。 */
  async function touchDragTopCard(offsets, { release = true } = {}) {
    const pt = await page.evaluate(() => {
      const c = [...document.querySelectorAll('.switcher-card')].find((x) => x.dataset.appId)
      const r = c.getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, app: c.dataset.appId }
    })
    await page.evaluate(() => {
      window.__switcherMode = null
      window.__switcherSettle = null
    })
    const frames = []
    const sample = () =>
      page.evaluate((app) => {
        const c = [...document.querySelectorAll('.switcher-card')].find((x) => x.dataset.appId === app)
        const body = c?.querySelector('.switcher-card-body')
        return {
          op: c ? +getComputedStyle(c).opacity : null,
          bop: body ? +getComputedStyle(body).opacity : null,
          x: c ? Math.round(c.getBoundingClientRect().x) : null,
          y: c ? Math.round(c.getBoundingClientRect().y) : null,
          follow: !!document.querySelector('.switcher-card.is-follow')
        }
      }, pt.app)
    const start = await sample()
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(pt.x, pt.y) })
    for (const [dx, dy] of offsets) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(pt.x + dx, pt.y + dy) })
      await page.waitForTimeout(14)
      frames.push(await sample())
    }
    if (release) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      for (let k = 0; k < 8; k++) {
        await page.waitForTimeout(30)
        frames.push(await sample())
      }
      await page.waitForTimeout(600)
    }
    const state = await page.evaluate(() => ({
      mode: window.__switcherMode || null,
      settle: window.__switcherSettle || null,
      recent: [...window.__system.recentApps],
      base: window.__system.baseLayer,
      activeAppId: window.__system.activeAppId,
      open: window.__system.appSwitcherOpen
    }))
    const alive = frames.filter((f) => f.op !== null)
    return {
      app: pt.app,
      state,
      frames,
      xDrift: alive.length ? Math.max(...alive.map((f) => Math.abs(f.x - start.x))) : 0,
      opMin: alive.length ? Math.min(...alive.map((f) => f.op)) : null,
      bopMin: alive.length ? Math.min(...alive.filter((f) => f.bop !== null).map((f) => f.bop)) : null,
      followEver: frames.some((f) => f.follow)
    }
  }

  // ---- ①-a 首帧横向抖 7px（触摸屏最典型），之后 21 帧纯纵向 ----
  await seedApps()
  await touchEnterSwitcher()
  {
    const off = [[7, -7], [5, -19]]
    for (let k = 3; k <= 22; k++) off.push([2, -k * 12])
    const r = await touchDragTopCard(off)
    const m = r.state.mode
    check(
      '第十二轮·需求①-a：触摸·首帧横向抖 7px 后 21 帧纯纵向 → 模式必须判成「上滑」而不是横滑',
      !!m && m.mode === 'v',
      `__switcherMode.mode = ${m?.mode}（改前 = 'h'）轨迹 = ${JSON.stringify(m?.trace || [])}`
    )
    check(
      '第十二轮·需求①-a：同一手势里卡片【没有任何横向位移】（改前横走 7px 并落到 h 分支）',
      r.xDrift <= 2,
      `最大横向漂移 = ${r.xDrift}px（期望 ≤2；改前该手势被判 h）`
    )
    check(
      '第十二轮·需求①-a：该上滑【真的删掉了卡片】（命中判定必须拿到 appId，不能是跟手卡）',
      !!m && m.cardId === r.app && r.state.recent.length === 4 && !r.state.recent.includes(r.app),
      `cardId=${m?.cardId} app=${r.app} 剩余 = ${r.state.recent.join('/')}`
    )
  }

  // ---- ①-b 首帧 (6,+2) 拇指横滚 + 后续 60px 横向漂移 ----
  await seedApps()
  await touchEnterSwitcher()
  {
    const off = [[6, 2], [9, -16]]
    for (let k = 3; k <= 26; k++) {
      const t = (k - 3) / 23
      off.push([9 + 51 * t, -16 - 274 * t])
    }
    const r = await touchDragTopCard(off)
    const m = r.state.mode
    check(
      '第十二轮·需求①-b：触摸·首帧 (6,+2) 拇指横滚 + 拇指弧线横漂 60px → 仍须判成「上滑」',
      !!m && m.mode === 'v',
      `__switcherMode.mode = ${m?.mode}（改前 = 'h'：那 60px 横漂会被当成 0.31 层翻卡量）`
    )
    check(
      '第十二轮·需求①-b：60px 横漂【没有】被当成横向翻卡（焦点不得被推动）',
      r.xDrift <= 2 && r.state.recent.length === 4,
      `最大横向漂移 = ${r.xDrift}px；剩余 = ${r.state.recent.join('/')}`
    )
  }

  // ---- ①-c 回归护栏：真的横滑仍然要判成 h 并翻一张 ----
  await seedApps()
  await touchEnterSwitcher()
  {
    const off = []
    for (let k = 1; k <= 20; k++) off.push([k * 11, -(8 * k) / 20])
    const r = await touchDragTopCard(off)
    const m = r.state.mode
    check(
      '第十二轮·需求①-c（回归）：触摸·真实横滑（|dx| 主导、纵向仅漂 8px）仍判 h 并翻到第 2 张',
      !!m && m.mode === 'h' && !!r.state.settle && r.state.settle.idx === 1,
      `mode=${m?.mode} settle.idx=${r.state.settle?.idx} cur=${r.state.settle?.cur} 横向漂移 = ${r.xDrift}px`
    )
  }

  // ---- ①-d 触摸 tap 顶卡必须【恢复该应用】（改前落到「点空白回桌面」分支） ----
  await seedApps()
  await touchEnterSwitcher()
  {
    const pt = await page.evaluate(() => {
      const c = [...document.querySelectorAll('.switcher-card')].find((x) => x.dataset.appId)
      const r = c.getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, app: c.dataset.appId }
    })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(pt.x, pt.y) })
    await page.waitForTimeout(60)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(900)
    const after = await page.evaluate(() => ({ base: window.__system.baseLayer, app: window.__system.activeAppId }))
    check(
      '第十二轮·需求①-d：触摸·点顶层卡 → 恢复该应用（改前 hitCardId=null ⇒ 反而回桌面）',
      after.base === 'app' && after.app === pt.app,
      `baseLayer=${after.base} activeAppId=${after.app}（期望 app / ${pt.app}）`
    )
  }

  // ---- ② 上滑跟手期 + 飞出期：opacity 恒 1，且跟手卡让位、堆叠卡卡体可见 ----
  await seedApps()
  await touchEnterSwitcher()
  {
    const off = []
    for (let k = 1; k <= 14; k++) off.push([2, -k * 13])
    const r = await touchDragTopCard(off, { release: true })
    check(
      '第十二轮·需求②：上滑跟手 + 飞出全程卡片 opacity 恒 1（取消透明度变化）',
      r.opMin !== null && r.opMin > 0.99,
      `逐帧最小 opacity = ${r.opMin}（改前跟手期随高度线性降到 ≈${(1 - 182 / 320).toFixed(2)}，飞出段直接 0）`
    )
    check(
      '第十二轮·需求②连带：上滑删卡期间【跟手卡让位】、堆叠前卡卡体可见（bop 恒 1）',
      r.bopMin !== null && r.bopMin > 0.99,
      `逐帧最小卡体 opacity = ${r.bopMin}（改前 = 0：可见的跟手卡冻在槽位、跟手上移的卡不可见）`
    )
    check(
      '第十二轮·需求②连带：手势期间不再渲染跟手卡（杜绝它压在顶层卡上抢走命中）',
      !r.followEver,
      `逐帧是否出现过 .is-follow = ${r.followEver}`
    )
    check(
      '第十二轮·需求②：上滑超过阈值 → 正常删卡（跟手/飞出两条链路都通）',
      r.state.recent.length === 4 && !r.state.recent.includes(r.app),
      `剩余 = ${r.state.recent.join('/')}`
    )
  }
}

/* ══════════ 第十四轮 · 回归护栏（2026-09-14，Ricky 报的三条缺陷）══════════
   Ricky 原话：
     ①「点击多任务卡片进入全屏时会卡和闪一下，而且很高的概率会出现点击卡片
        仍然退出多任务回到桌面的问题」
     ②「从应用进入到多任务界面时，全屏应用缩放为卡片的过程动画一抖一抖的，
        感觉长宽比例在不停的随机变化」
     ③「位于顶部的卡片无法通过鼠标上滑关闭，点击还会左右抖动」

   本段用的是**鼠标路径**（Ricky 报的三条都是鼠标复现的；触摸路径由第十二轮那段
   CDP 用例守着）。逐帧数据与根因见 /tmp/vwork/r14/：
     probe-label.mjs  标签行命中 / 点击漂移 / 入场残留
     probe-handoff.mjs 交接段（放大卡 → AppWindow）逐帧几何
     probe-p3.mjs     三条缺陷的最终验收
     probe-enter.mjs  入场缩放逐帧宽高比（缺陷②）
   静态断言的期望值全部来自这些探针，不是估的。 */
{
  const APP5 = ['settings', 'clock', 'phone', 'camera', 'calculator']
  const seedApps = async () => {
    await page.evaluate(() => {
      window.__system.exitSwitcherToHome()
      window.__system.appSwitcherOpen = false
    })
    await page.waitForTimeout(160)
    for (const id of APP5) {
      await page.evaluate((a) => window.__system.openApp(a), id)
      await page.waitForTimeout(150)
    }
  }
  /** 鼠标上滑进切换器（与 Ricky 的复现路径一致）。lateral = 上滑时的横向漂移总量 */
  const mouseEnter = async ({ lateral = 0 } = {}) => {
    const y0 = 925
    await page.mouse.move(215, y0)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) {
      await page.mouse.move(215 + (lateral * i) / 20, y0 - i * 20, { steps: 1 })
      await page.waitForTimeout(12)
    }
    await page.waitForTimeout(300)
    await page.mouse.up()
    await page.waitForTimeout(700)
  }
  const st = () => page.evaluate(() => ({
    base: window.__system.baseLayer,
    app: window.__system.activeAppId,
    open: window.__system.appSwitcherOpen,
    recent: [...window.__system.recentApps],
    dragX: +window.__system.switcherDragX.toFixed(1)
  }))
  /** 三态判据 —— 注意从应用内上滑进来时 baseLayer 本来就是 'app'，
      只看 base 会把「什么都没发生（切换器还开着）」误判成「已恢复」。 */
  const verdict = (a) => (!a.open && a.base === 'app' && a.app ? 'RESUME'
    : a.base === 'home' ? 'HOME' : a.open ? 'STAY' : '???')
  const geom = () => page.evaluate(() => {
    const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [+b.x.toFixed(1), +b.y.toFixed(1), +b.width.toFixed(1), +b.height.toFixed(1)] }
    return {
      card: r(document.querySelector('.switcher-card.is-deck[data-index="0"]')),
      label: r(document.querySelector('.switcher-card-label')),
      mode: window.__switcherMode || null
    }
  })

  // ---- 缺陷③前半：标签行不算「这张卡」⇒ 点它回桌面、从它上滑删不掉 ----
  await seedApps()
  await mouseEnter()
  {
    const g = await geom()
    const top = g.card?.[1] // 卡顶 y（实测 155）
    const labelY = g.label?.[1] // 标签行顶（实测 119）
    check(
      '第十四轮·几何前置：标签行位于卡顶上方 LABEL_ROW_H+LABEL_GAP=36px 处',
      top === 155 && labelY === 119,
      `卡顶 y=${top} 标签行 y=${labelY}（期望 155 / 119）`
    )

    const hits = []
    for (const y of [122, 138, 152]) {
      await seedApps()
      await mouseEnter()
      await page.mouse.move(215, y)
      await page.waitForTimeout(25)
      await page.mouse.down()
      await page.waitForTimeout(70)
      await page.mouse.up()
      await page.waitForTimeout(1100)
      hits.push(`y=${y}:${verdict(await st())}`)
    }
    check(
      '第十四轮·需求③-a：点标签行（图标+应用名）必须恢复那张卡 —— 改前 elementFromPoint 落到 .switcher-track ⇒ hitCardId=null ⇒ exitWithAnimation ⇒ 回桌面',
      hits.every((h) => h.endsWith('RESUME')),
      hits.join(' / ')
    )

    /* ⚠️ 上滑必须在【视口内】完成：从标签行（卡顶上方 36px，屏内最高的一行）起手，
       只要行程够 110px 就必然把指针拖到 y<0 的视口外，而 Chrome 在视口外松手时
       偶发不派发 pointerup（首跑实测：__switcherMode = undefined ⇒ onPointerUp 根本没跑，
       recent 5→5）。所以行程取 135px（> 110px 判定阈值），落点 y=15/17 仍在屏内。
       192px 那条极值路径由 /tmp/vwork/r14/probe-p3b.mjs 单独守。 */
    const swipes = []
    for (const y of [150, 152]) {
      await seedApps()
      await mouseEnter()
      const before = await st()
      const geo0 = await geom()
      await page.evaluate(() => {
        window.__switcherMode = null
        window.__pev = 0
        document.addEventListener('pointerup', () => { window.__pev++ }, { capture: true, once: true })
      })
      await page.mouse.move(215, y)
      await page.waitForTimeout(25)
      await page.mouse.down()
      for (let i = 1; i <= 9; i++) {
        await page.mouse.move(215, y - i * 15, { steps: 2 })
        await page.waitForTimeout(10)
      }
      await page.mouse.up()
      await page.waitForTimeout(900)
      const after = await st()
      const m = await page.evaluate(() => window.__switcherMode)
      const ev = await page.evaluate(() => window.__pev)
      swipes.push(`y=${y}:${before.recent.length}→${after.recent.length}(mode=${m?.mode},cardId=${m?.cardId},dy=${m?.dy},base=${after.base},pointerup=${ev},卡顶=${geo0.card?.[1]})`)
    }
    check(
      '第十四轮·需求③-b：从标签行上滑 135px → 必须删掉那张卡 —— 改前 cardId 恒 null ⇒ willDismiss 恒 false ⇒ 卡片纹丝不动',
      swipes.every((s) => /→4\(/.test(s)),
      `${swipes.join(' / ')}（期望 5→4）`
    )
  }

  // ---- 缺陷③后半：点击带横向漂移 → 改前「卡片晃一下 + 整段静默」 ----
  {
    const rows = []
    for (const dx of [12, 16]) {
      await seedApps()
      await mouseEnter()
      const c = await page.evaluate(() => {
        const el = document.querySelector('.switcher-card.is-deck[data-index="0"]')
        const b = el.getBoundingClientRect()
        return [b.x + b.width / 2, b.y + b.height / 2]
      })
      await page.mouse.move(c[0], c[1])
      await page.waitForTimeout(30)
      await page.mouse.down()
      for (let i = 1; i <= 4; i++) {
        await page.mouse.move(c[0] + (dx * i) / 4, c[1], { steps: 1 })
        await page.waitForTimeout(10)
      }
      await page.waitForTimeout(50)
      await page.mouse.up()
      await page.waitForTimeout(1100)
      const a = await st()
      const g = await geom()
      rows.push(`${dx}px→${verdict(a)}(tapIntent=${g.mode?.tapIntent},frozen=${g.mode?.frozen},dx=${g.mode?.dx})`)
    }
    check(
      '第十四轮·需求③-c：点击带 12/16px 横向漂移仍须恢复 —— 改前被 pickMode 锁成 h（MODE_LOCK_PX=10）而走不到 MODE_COMMIT_PX=22 ⇒ settleFocus 弹回、整段静默',
      rows.every((r) => r.includes('RESUME')),
      rows.join(' / ')
    )
  }

  // ---- 缺陷③后半（根因二）：入场横向残留不得被「按下」复活 ----
  {
    await seedApps()
    await mouseEnter({ lateral: 90 })
    const st0 = await st()
    const x0 = await page.evaluate(() => +document.querySelector('.switcher-card.is-deck[data-index="0"]').getBoundingClientRect().x.toFixed(1))
    await page.mouse.move(215, 450)
    await page.waitForTimeout(30)
    await page.mouse.down()
    await page.waitForTimeout(120)
    const x1 = await page.evaluate(() => +document.querySelector('.switcher-card.is-deck[data-index="0"]').getBoundingClientRect().x.toFixed(1))
    await page.mouse.up()
    await page.waitForTimeout(1100)
    check(
      '第十四轮·需求③-d：入场带 90px 横向残留时，在卡片上按下【不得】横移 —— 改前 onPointerDown 的 followFreeSnap(0) 把已衰减的残留复活成 90×0.42 ≈ 37.8px 的一次横跳',
      Math.abs(x1 - x0) <= 1,
      `残留 dragX=${st0.dragX} → 按下 120ms 后卡 x ${x0} → ${x1}（Δ=${(x1 - x0).toFixed(1)}px，期望 ≤1px）`
    )
  }

  // ---- 缺陷①：点卡进全屏的「闪」与「回到桌面」 ----
  for (const [tag, px, py, label, expApp] of [
    ['same-app', 215, 450, '点前卡（= 当前应用 calculator，AppWindow 不重挂）', 'calculator'],
    ['swap-app', 66, 450, '点左侧邻居条的 camera 卡（不同应用 ⇒ AppWindow 重挂）', 'camera'],
  ]) {
    await seedApps()
    await mouseEnter()
    await page.evaluate(() => {
      window.__hx = []
      window.__hxStop = false
      const t0 = performance.now()
      const area = (r) => Math.max(0, r.width) * Math.max(0, r.height)
      const tick = () => {
        if (window.__hxStop) return
        const rec = { t: +(performance.now() - t0).toFixed(1) }
        rec.sw = !!document.querySelector('.app-switcher')
        const win = document.querySelector('.app-window')
        if (win) {
          const r = win.getBoundingClientRect()
          const cs = getComputedStyle(win)
          rec.win = [+r.x.toFixed(1), +r.y.toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)]
          rec.phase = win.dataset.phase
          rec.hidden = cs.display === 'none' || cs.visibility === 'hidden'
        } else { rec.win = null; rec.phase = null; rec.hidden = null }
        let best = null
        for (const el of document.querySelectorAll('.switcher-card')) {
          const r = el.getBoundingClientRect()
          if (!best || area(r) > area(best.r)) best = { r }
        }
        rec.card = best ? [+best.r.x.toFixed(1), +best.r.y.toFixed(1), +best.r.width.toFixed(1), +best.r.height.toFixed(1)] : null
        window.__hx.push(rec)
        setTimeout(tick, 10)
      }
      tick()
    })
    await page.mouse.move(px, py)
    await page.waitForTimeout(30)
    await page.mouse.down()
    await page.waitForTimeout(70)
    await page.mouse.up()
    await page.waitForTimeout(1400)
    await page.evaluate(() => { window.__hxStop = true })
    const rows = await page.evaluate(() => window.__hx)
    const a = await st()

    const idx = rows.findIndex((r) => !r.sw)
    const prev = idx > 0 ? rows[idx - 1] : null
    const cur = idx >= 0 ? rows[idx] : null
    const jump = prev?.card && cur?.win
      ? Math.max(...[0, 1, 2, 3].map((k) => Math.abs(prev.card[k] - cur.win[k])))
      : null
    /* 「回到桌面」的可观测形状 = 某一帧里 .app-window 是一个面积不足半屏的小窗口。
       判据必须再剔除【被放大卡完全盖住】的那些帧 —— 交接保持窗口内底下那个 AppWindow
       正在从桌面图标放大（那是它自己的 hero 开场），它全程被铺满全屏的放大卡压着，
       眼睛看不到；只有「没被盖住的小窗口」才是用户读到的「退出多任务回到桌面」。 */
    const covering = (r) => !!r.card && r.card[0] <= 1 && r.card[1] <= 1 && r.card[2] >= 429 && r.card[3] >= 931
    const small = rows.filter((r) => r.win && !r.hidden && r.win[2] * r.win[3] > 0 && r.win[2] * r.win[3] < 430 * 932 * 0.5)
    const visibleSmall = small.filter((r) => !covering(r))

    check(
      `第十四轮·需求①-a（${tag}）：${label} —— 交接帧底下必须是「全屏 + phase=open」的 AppWindow`,
      !!cur && cur.phase === 'open' && cur.win[2] === 430 && cur.win[3] === 932,
      `交接帧 t=${cur?.t}ms phase=${cur?.phase} win=${JSON.stringify(cur?.win)}`
    )
    check(
      `第十四轮·需求①-b（${tag}）：交接前后【单帧几何跳变 = 0px】（改前全程可见 725px 的「整屏落在卡位」+ 交接处突变为桌面图标矩形）`,
      jump !== null && jump <= 1,
      `交接前一帧放大卡=${JSON.stringify(prev?.card)} → 该帧 win=${JSON.stringify(cur?.win)} 跳变=${jump === null ? 'null' : jump.toFixed(1) + 'px'}`
    )
    check(
      `第十四轮·需求①-c（${tag}）：全程不存在【可见的（未被放大卡盖住的）小窗口帧】= 用户读到的「退出多任务回到桌面」`,
      visibleSmall.length === 0,
      visibleSmall.length
        ? visibleSmall.slice(0, 4).map((r) => `t${r.t}=${r.win[2]}x${r.win[3]} 卡=${JSON.stringify(r.card)}`).join(' ')
        : `零帧（被盖住的小窗口帧 ${small.length} 帧，全部由放大卡 430×932 完全遮挡）`
    )
    check(
      `第十四轮·需求①-d（${tag}）：最终恢复的目标应用正确`,
      !a.open && a.base === 'app' && a.app === expApp,
      `open=${a.open} base=${a.base} activeAppId=${a.app}（期望 app/${expApp}）`
    )
  }
}

/* ══════════ 第十五轮 · 回归护栏（2026-09-14，Ricky：删卡回桌面后桌面图标消失）══════════
   Ricky 原话：「点击打开应用后，进入多任务，上滑删除任务回到桌面后，桌面图标消失了」
   截图特征：**文字还在、只有那一格的图形是空的**。

   根因（探针 /tmp/vwork/r15/probe-icon.mjs 实测，改前）：
     AppWindow 打开时把「桌面图标隐藏态」写进 homeStore.hiddenIconId（单槽），
     而归还动作只挂在 hero 收回的收尾钩子上（AppWindow 的 onHandoff → home.showIcon()）。
     切换器里上滑删卡走 systemStore.dismissApp()：它**硬切** activeAppId=null + baseLayer='home'，
     AppWindow 被直接卸载 ⇒ 收尾钩子永不执行 ⇒ hiddenIconId 永久停在那个 appId。
     `.is-hidden` 只藏 .icon-tile（与角标）、不藏 .icon-label ⇒ 名字还在、图标没了。

   本段 6 条：
     ① 前置：打开应用后图标确实进入隐藏态（否则后面几条都是假通过）
     ② 需求①主诉：真实 UI 点桌面图标 → 上滑进多任务 → 卡上滑删卡 → 图标必须恢复
     ③ 第二道防线：绕过切换器直接 dismissApp（隐藏态没被清）时图标也必须可见
     ④ 同类硬切路径「点空白回桌面」也必须恢复
     ⑤ 同类硬切路径「垃圾桶一键清理」也必须恢复
     ⑥ 回归护栏：删【后台卡】不得让仍在全屏的前台应用图标提前露出来（防 hero 重影）
   改前对照值全部来自 r15 探针，不是估的。 */
{
  /** 桌面网格里某应用的 AppIcon 可见性（以 .icon-tile 为准 = 用户看到的「图形」） */
  const homeIcon = (appId) =>
    page.evaluate((id) => {
      const el = document.querySelector(`[data-home-item="app:${id}"] .app-icon`)
      if (!el) return null
      const tile = el.querySelector('.icon-tile')
      const r = el.getBoundingClientRect()
      return {
        isHidden: el.classList.contains('is-hidden'),
        tile: tile ? getComputedStyle(tile).visibility : null,
        label: el.querySelector('.icon-label')?.textContent?.trim() ?? null,
        size: `${+r.width.toFixed(1)}x${+r.height.toFixed(1)}`
      }
    }, appId)
  /** homeStore 的隐藏态单槽。
   *  ⚠️ 返回的是**字符串形式**（`String(null)` ⇒ `"null"`），不能直接和 `null` 比：
   *     本段首跑就是栽在这里 —— 三条断言的值全对，却因为 `"null" !== null` 报 FAIL。
   *     为什么不用 `?? '默认值'` 兜：`null` 正是「已归还」的正确值，会被 ?? 吞成默认值，
   *     读起来像是读不到。统一用下面的 NULL_ID 比，别改回 null。 */
  const NULL_ID = 'null'
  const hiddenId = () =>
    page.evaluate(() => {
      const p = document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$pinia
      const h = p?.state?.value?.home
      return h && 'hiddenIconId' in h ? String(h.hiddenIconId) : '(home 读不到)'
    })
  const sysState = () =>
    page.evaluate(() => ({
      base: window.__system.baseLayer,
      app: window.__system.activeAppId,
      recent: [...window.__system.recentApps]
    }))
  const fmtHome = (v) =>
    v ? `is-hidden=${v.isHidden} tile=${v.tile} 文字=${v.label} ${v.size}` : '(无该桌面图标)'
  /** 每个用例的统一起点：清空最近任务 + 回桌面 */
  const resetHome = async () => {
    await page.evaluate(() => window.__system.dismissAll())
    await page.waitForTimeout(420)
  }
  /** 鼠标上滑进切换器（与 Ricky 的复现路径一致） */
  const mouseEnterSwitcher = async () => {
    const y0 = 925
    await page.mouse.move(215, y0)
    await page.mouse.down()
    for (let i = 1; i <= 20; i++) {
      await page.mouse.move(215, y0 - i * 20, { steps: 1 })
      await page.waitForTimeout(12)
    }
    await page.waitForTimeout(300)
    await page.mouse.up()
    await page.waitForTimeout(800)
  }
  /** 卡上滑删卡。⚠️ 松手点必须留在视口内：起手 620 → 上行 220 → 落在 400，
      否则 Chrome 偶发不派发 pointerup（第十四轮踩过）。 */
  const swipeUpCard = async ({ y0 = 620, travel = 220 } = {}) => {
    await page.mouse.move(215, y0)
    await page.waitForTimeout(30)
    await page.mouse.down()
    const steps = Math.round(travel / 20)
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(215, y0 - i * 20, { steps: 1 })
      await page.waitForTimeout(12)
    }
    await page.mouse.up()
    await page.waitForTimeout(900)
  }
  /** 「空白」落点：既不在卡片上、也不在垃圾桶上（点空白 = 回桌面） */
  const blankPoint = () =>
    page.evaluate(() => {
      const safe = (x, y) => {
        const el = document.elementFromPoint(x, y)
        return !!el && !el.closest('.switcher-card') && !el.closest('.switcher-trash')
      }
      for (const [x, y] of [[215, 800], [30, 800], [400, 800], [215, 95], [30, 450], [400, 450]]) {
        if (safe(x, y)) return [x, y]
      }
      return null
    })
  const trashPoint = () =>
    page.evaluate(() => {
      const el = document.querySelector('.switcher-trash')
      if (!el) return null
      const r = el.getBoundingClientRect()
      return [r.x + r.width / 2, r.y + r.height / 2]
    })
  /** 点桌面「文件」图标开应用（真实入口，不是 store 直连） */
  const clickDeskIcon = async (appId, ms = 800) => {
    await page.locator(`[data-home-item="app:${appId}"] .app-icon`).first().click()
    await page.waitForTimeout(ms)
  }

  // ---- ① 前置：打开应用后图标确实进入隐藏态（只藏图形、不藏文字）----
  await resetHome()
  await clickDeskIcon('files')
  const preId = await hiddenId()
  const preIcon = await homeIcon('files')
  check(
    '第十五轮·前置：打开应用后桌面图标必须进入隐藏态，且【只藏图形、不藏文字】（= Ricky 截图的形状）',
    preId === 'files' && preIcon?.isHidden === true && preIcon?.tile === 'hidden' && preIcon?.label === '文件',
    `hiddenIconId=${preId} · 图标[${fmtHome(preIcon)}]（期望 files / is-hidden=true / tile=hidden / 文字=文件）`
  )

  // ---- ② 需求①主诉：真实 UI 上滑删卡 → 回桌面后图标必须恢复 ----
  await mouseEnterSwitcher()
  await swipeUpCard()
  const a1 = await sysState()
  const afterId = await hiddenId()
  const afterIcon = await homeIcon('files')
  check(
    '第十五轮·需求①：进入多任务→上滑删卡→回到桌面后，桌面图标【必须恢复】' +
      '（改前 hiddenIconId 永久停在 files ⇒ tile=hidden、只剩文字）',
    afterId === NULL_ID && afterIcon?.isHidden === false && afterIcon?.tile === 'visible' && a1.base === 'home',
    `hiddenIconId=${afterId} base=${a1.base} activeAppId=${a1.app} · 图标[${fmtHome(afterIcon)}]（期望 hiddenIconId=null / tile=visible）`
  )

  // ---- ③ 第二道防线：把隐藏态【钉死】成一个「并非前台」的 appId，图标也必须可见 ----
  /* ⚠️ 2026-09-16 合并 main 后重写本段。
     旧版走「openApp('notes') → dismissApp('notes') → 期望 hiddenIconId 仍停在 notes」，
     断在 `staleId === 'notes'` 这条【前提】上（详情里写着「符合预期」却判 FAIL）。
     main 给 AppWindow 加了 `onBeforeUnmount: home.showIcon()`（7ff0bf3），
     dismissApp 触发 AppWindow 卸载时顺手把隐藏态清了 ⇒ staleId 变 null。
     ⚠️ 这是断言设计问题、不是代码回归：用户可见结果 tile=visible 一直是对的。
     但直接删掉那条前提等于**不再验证第二道防线**（AppIcon 的前台判据）——
     main 那条 unmount 钩子只是「顺手清」，谁也不能保证它覆盖全部硬切路径。
     ⇒ 改成**绕过一切 store action 与生命周期钩子**，用 pinia 直写把隐藏态钉在 notes 上；
       此时 activeAppId 为 null（没有任何窗口）⇒ 只可能是 AppIcon 的判据让图标可见。
       同时仍断言 hiddenIconId 未被清 —— 否则「图标可见」可能是别的东西清的，证不到判据。 */
  await resetHome()
  await page.evaluate(() => {
    const p = document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$pinia
    p.state.value.home.hiddenIconId = 'notes'
  })
  await page.waitForTimeout(160)
  const pinnedId = await hiddenId()
  const pinnedIcon = await homeIcon('notes')
  check(
    '第十五轮·需求①第二道防线：隐藏态被钉在一个【并非前台】的 appId 上时，图标也必须可见' +
      ' —— AppIcon 的「前台判据」自愈（改前 tile=hidden）',
    pinnedId === 'notes' && pinnedIcon?.isHidden === false && pinnedIcon?.tile === 'visible',
    `钉住后 hiddenIconId=${pinnedId}（须仍是 notes，证明没被任何钩子清掉）· 图标[${fmtHome(pinnedIcon)}] ← 期望 tile=visible`
  )
  // 复位，避免污染后续用例
  await page.evaluate(() => {
    const p = document.querySelector('#app')?.__vue_app__?.config?.globalProperties?.$pinia
    p.state.value.home.hiddenIconId = null
  })

  // ---- ④ 同类硬切路径：点空白回桌面 ----
  await resetHome()
  await clickDeskIcon('notes')
  await mouseEnterSwitcher()
  const bp = await blankPoint()
  if (bp) {
    await page.mouse.click(bp[0], bp[1])
    await page.waitForTimeout(1000)
  }
  const a4 = await sysState()
  const id4 = await hiddenId()
  const icon4 = await homeIcon('notes')
  check(
    '第十五轮·同类路径：多任务里【点空白回桌面】后，桌面图标也必须恢复（同样拿不到 hero 收尾钩子）',
    !!bp && id4 === NULL_ID && icon4?.isHidden === false && icon4?.tile === 'visible' && a4.base === 'home',
    `落点=${JSON.stringify(bp)} hiddenIconId=${id4} base=${a4.base} · 图标[${fmtHome(icon4)}]`
  )

  // ---- ⑤ 同类硬切路径：垃圾桶一键清理 ----
  await resetHome()
  await clickDeskIcon('notes')
  await mouseEnterSwitcher()
  const tp = await trashPoint()
  if (tp) {
    await page.mouse.click(tp[0], tp[1])
    await page.waitForTimeout(1800)
  }
  const a5 = await sysState()
  const id5 = await hiddenId()
  const icon5 = await homeIcon('notes')
  check(
    '第十五轮·同类路径：多任务里【垃圾桶一键清理】后，桌面图标也必须恢复',
    !!tp && id5 === NULL_ID && icon5?.isHidden === false && icon5?.tile === 'visible' && a5.recent.length === 0,
    `垃圾桶=${JSON.stringify(tp)} hiddenIconId=${id5} recent=${JSON.stringify(a5.recent)} · 图标[${fmtHome(icon5)}]`
  )

  // ---- ⑥ 回归护栏：删后台卡不得让仍在全屏的前台应用图标提前露出来 ----
  await resetHome()
  await page.evaluate(() => window.__system.openApp('notes'))
  await page.waitForTimeout(500)
  await page.evaluate(() => window.__system.openApp('files'))
  await page.waitForTimeout(800)
  await mouseEnterSwitcher()
  /* 后台卡被前台卡压住 ⇒ 必须取它【未被遮挡的左缘条带】。
     ⚠️ 不能用邻居卡中心：实测在 (154.5,453) 命中的是前台卡，删掉的是前台应用。 */
  const bg = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.switcher-card[data-app-id]')]
    const front = cards.find((c) => c.dataset.appId === window.__system.activeAppId && !c.classList.contains('is-follow'))
    const el = cards.find((c) => c.dataset.appId !== window.__system.activeAppId && !c.classList.contains('is-follow'))
    if (!el || !front) return null
    const r = el.getBoundingClientRect()
    const fr = front.getBoundingClientRect()
    const strip = fr.x - r.x
    if (strip < 20) return null
    return { appId: el.dataset.appId, cx: r.x + strip / 2, cy: r.y + r.height / 2, strip: +strip.toFixed(1) }
  })
  if (bg) {
    const hit = await page.evaluate(([x, y]) => {
      for (const el of document.elementsFromPoint(x, y)) {
        const id = el?.closest?.('.switcher-card')?.dataset?.appId
        if (id) return id
      }
      return null
    }, [bg.cx, bg.cy])
    await page.mouse.move(bg.cx, bg.cy)
    await page.waitForTimeout(30)
    await page.mouse.down()
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(bg.cx, bg.cy - i * 20, { steps: 1 })
      await page.waitForTimeout(12)
    }
    await page.mouse.up()
    await page.waitForTimeout(900)
    const a6 = await sysState()
    const id6 = await hiddenId()
    const frontIcon = await homeIcon('files')
    const bgIcon = await homeIcon(bg.appId)
    check(
      '第十五轮·回归护栏：删除【后台卡】不得让仍在全屏的前台应用图标提前露出来' +
        '（否则 hero 收回时真图标与镜像会重影）',
      hit === bg.appId && a6.app === 'files' && id6 === 'files' &&
        frontIcon?.isHidden === true && frontIcon?.tile === 'hidden' &&
        bgIcon?.isHidden === false && bgIcon?.tile === 'visible',
      `落点命中=${hit}（期望 ${bg.appId}）· 删后 activeAppId=${a6.app} hiddenIconId=${id6} · ` +
        `前台 files 图标[${fmtHome(frontIcon)}]（期望 tile=hidden）· 后台 ${bg.appId} 图标[${fmtHome(bgIcon)}]（期望 tile=visible）`
    )
  } else {
    check(
      '第十五轮·回归护栏：删除【后台卡】不得让仍在全屏的前台应用图标提前露出来',
      false,
      '后台卡可见条带不足 20px，用例未能建立（检查卡片几何是否被改动）'
    )
  }
  // ================= 第十六轮：入场期邻居卡与跟手卡【同步缩放 / 同步位移】 =================
  /* Ricky 原话：「应用内进入多任务，底部卡片出现时应该与被拖拽的卡片同步进行缩放移动。」
   *
   * 判据设计（为什么是这三条）：
   *   ① 【群组映射不变量】跟手卡在场期间，deck 前卡必须与跟手卡【横向逐位重合】——
   *      这正是 deckGroupStyle 的定义（把跟手卡的位姿映射到卡位）。改前该不变量不成立：
   *      前卡始终停在 275 宽的槽位，跟手卡却是 299.8 ⇒ Δx 最高 45px。
   *   ② 【比例契约】邻居(idx=1) 视觉宽 / 跟手卡视觉宽 必须 ≈ 0.94（= SCALE_DECAY）。
   *      改前停驻期实测只有 0.863（邻居卡钉死在「落位后」的绝对尺寸 258.5）。
   *   ③ 【纵向中心】邻居卡与跟手卡的垂直中心必须重合（改前邻居停在 453、跟手卡在 456，
   *      且邻居「更靠下」正是 Ricky 截图里读到的第二件事）。
   * 取样窗口：上滑 200px 使停驻发生在 p ≈ 0.77（此时跟手卡明显大于终位），
   * 停 500ms 让邻居的 480ms 入场过渡跑完，再松手。 */
  await resetHome()
  await page.evaluate(() => window.__system.openApp('keynote'))
  await page.waitForTimeout(420)
  await page.evaluate(() => window.__system.openApp('photos'))
  await page.waitForTimeout(800)

  await page.evaluate(() => {
    window.__r16 = []
    window.__r16Stop = false
    const rect = (el) => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    }
    const tick = () => {
      if (window.__r16Stop) return
      const g = document.querySelector('.switcher-deck-group')
      const follow = document.querySelector('.switcher-card.is-follow')
      const d0 = document.querySelector('.switcher-deck-group .switcher-card.is-deck[data-index="0"]')
      const d1 = document.querySelector('.switcher-deck-group .switcher-card.is-deck[data-index="1"]')
      window.__r16.push({
        p: window.__system.switcherProgress,
        gNone: !g || getComputedStyle(g).transform === 'none',
        follow: follow ? rect(follow) : null,
        d0: d0 ? rect(d0) : null,
        d1: d1 ? rect(d1) : null
      })
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  {
    const y0 = 925
    await page.mouse.move(215, y0)
    await page.mouse.down()
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(215, y0 - i * 20, { steps: 1 })
      await page.waitForTimeout(12)
    }
    await page.waitForTimeout(500)
    await page.mouse.up()
    await page.waitForTimeout(1400)
  }
  const r16 = await page.evaluate(() => {
    window.__r16Stop = true
    return window.__r16
  })

  /* ① 群组映射不变量：跟手卡在场 & 前卡已渲染的每一帧 */
  const mapFrames = r16.filter((f) => f.follow && f.d0)
  const maxDx = mapFrames.length ? Math.max(...mapFrames.map((f) => Math.abs(f.d0.x - f.follow.x))) : 999
  const maxDw = mapFrames.length ? Math.max(...mapFrames.map((f) => Math.abs(f.d0.w - f.follow.w))) : 999
  check(
    '第十六轮·需求①地基：跟手卡在场期间，群组变换必须让 deck 前卡与跟手卡【横向逐位重合】' +
      '（改前前卡恒钉在槽位 77.5 / 275，跟手卡在 65.5 / 299.8 ⇒ Δx 达 45px）',
    mapFrames.length >= 20 && maxDx <= 1 && maxDw <= 1,
    `样本 ${mapFrames.length} 帧 · max|Δx|=${maxDx.toFixed(2)}px max|Δw|=${maxDw.toFixed(2)}px（期望 ≤1px）`
  )

  /* ② 比例契约 + ③ 纵向中心：取「停驻期尾巴」（邻居入场已跑完、手指仍按住） */
  const holdFrames = r16.filter((f) => f.follow && f.d1 && f.p > 0.5 && f.p < 1)
  const tail = holdFrames.slice(-16)
  const ratios = tail.map((f) => f.d1.w / f.follow.w)
  const rLo = ratios.length ? Math.min(...ratios) : 0
  const rHi = ratios.length ? Math.max(...ratios) : 0
  check(
    '第十六轮·需求①：停驻期邻居卡(idx=1) 视觉宽 / 跟手卡视觉宽 必须收敛到 deck 契约 0.94' +
      '（改前实测 0.863 —— 邻居被钉死在「落位后」的绝对尺寸 258.5，与手里的卡脱钩）',
    tail.length >= 8 && rLo >= 0.92 && rHi <= 0.96,
    `样本 ${tail.length} 帧 · 比值 ${rLo.toFixed(3)}~${rHi.toFixed(3)}（期望 0.92~0.96，契约 0.94）`
  )
  const cyGap = tail.length
    ? Math.max(...tail.map((f) => Math.abs(f.d1.y + f.d1.h / 2 - (f.follow.y + f.follow.h / 2))))
    : 999
  check(
    '第十六轮·需求①：邻居卡的【垂直中心】必须与跟手卡重合（Ricky 原话里「还更靠下」那一半）',
    tail.length >= 8 && cyGap <= 2,
    `样本 ${tail.length} 帧 · max|Δcy|=${cyGap.toFixed(2)}px（期望 ≤2px）`
  )

  /* ④ 交接后退化为单位阵 + 终位仍是原契约（回归护栏：别把群组变换留在 deck 模式里） */
  const settled16 = r16.slice(-20)
  const gLeak = settled16.some((f) => !f.gNone)
  const fin16 = await page.evaluate(() => {
    const r = (el) => {
      const b = el.getBoundingClientRect()
      return [+b.x.toFixed(1), +b.y.toFixed(1), +b.width.toFixed(1), +b.height.toFixed(1)]
    }
    const g = document.querySelector('.switcher-deck-group')
    const out = {}
    out.gTransform = g ? getComputedStyle(g).transform : null
    for (const el of document.querySelectorAll('.switcher-deck-group .switcher-card.is-deck')) {
      out[el.dataset.index] = r(el)
    }
    return out
  })
  check(
    '第十六轮·回归护栏：交接完成后群组变换必须退化为单位阵，且终位严格等于 deck 契约' +
      '（前卡 77.5,155,275,596；邻居 25.3,172.9,258.5,560.2 —— 群组变换不得泄漏到 deck 模式）',
    !gLeak &&
      fin16.gTransform === 'none' &&
      JSON.stringify(fin16['0']) === JSON.stringify([77.5, 155, 275, 596]) &&
      JSON.stringify(fin16['1']) === JSON.stringify([25.3, 172.9, 258.5, 560.2]),
    `group=${fin16.gTransform} deck0=${JSON.stringify(fin16['0'])} deck1=${JSON.stringify(fin16['1'])} · 最近 20 帧出现非单位阵=${gLeak}`
  )

  /* ⑤ 回归护栏：桌面路径（没有跟手卡）全程不得出现群组变换 ——
     改前首版 followGeom 缺 activeAppId 守卫，桌面入场上会被凭空作用一次。 */
  /* ⚠️ 前置：桌面路径要求「activeAppId = null 且 recentApps > 0」——
     dismissAll 会清空 recentApps，那样手势不产生任何进度、断言退化成空样本（踩过一次）。 */
  await page.evaluate(() => window.__system.dismissAll())
  await page.waitForTimeout(400)
  for (const id of ['camera', 'phone']) {
    await page.evaluate((i) => window.__system.openApp(i), id)
    await page.waitForTimeout(220)
    await page.evaluate(() => window.__system.exitSwitcherToHome())
    await page.waitForTimeout(260)
  }
  const deskPre = await page.evaluate(() => ({
    app: window.__system.activeAppId,
    recent: [...window.__system.recentApps]
  }))
  await page.evaluate(() => {
    window.__r16b = []
    window.__r16bStop = false
    const tick = () => {
      if (window.__r16bStop) return
      const g = document.querySelector('.switcher-deck-group')
      window.__r16b.push({
        p: window.__system.switcherProgress,
        none: !g || getComputedStyle(g).transform === 'none',
        follow: !!document.querySelector('.switcher-card.is-follow')
      })
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  {
    const y0 = 925
    await page.mouse.move(215, y0)
    await page.mouse.down()
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(215, y0 - i * 20, { steps: 1 })
      await page.waitForTimeout(12)
    }
    await page.mouse.up()
    await page.waitForTimeout(1000)
  }
  const r16b = await page.evaluate(() => {
    window.__r16bStop = true
    return window.__r16b
  })
  const moved = r16b.filter((f) => f.p > 0.02)
  const leaked = moved.filter((f) => !f.none)
  check(
    '第十六轮·回归护栏：桌面路径（无跟手卡）上滑进多任务的【全程】不得出现群组变换' +
      '（否则整组会被第二次缩放；护栏对应 followGeom 里的 activeAppId 短路）',
    deskPre.app === null && deskPre.recent.length > 0 && moved.length >= 10 && leaked.length === 0,
    `前置 activeAppId=${deskPre.app} recent=${JSON.stringify(deskPre.recent)} · ` +
      `采样 ${r16b.length} 帧 / 进度>0 的 ${moved.length} 帧 · 出现群组变换的帧数=${leaked.length}（期望 0）`
  )

  /* ══════════ 第二十二轮 · 快甩落到【最后一张卡】后的「不停颤抖」（Ricky 2026-09-16 复测）══════════
   *
   * Ricky 原话：「有改善，但是还是会出现。抖动发生在快速滑动松手后到达最后一张卡片，卡片不停颤抖」。
   * （「有改善」= 第二十一轮的坐标连续性守卫确实修掉了「两指被合并成一条坐标流」那一半；
   *   剩下的这一半与输入设备无关，是【越界释放】本身的力学错误。）
   *
   * 量测（/tmp/vwork/r22/probe-apppath.mjs，430×932 / 5 张卡 / 应用内路径）：
   *   · 快甩落在【中间某张卡】：松手点在目标【之下】（cur = 3.6845 < 目标 4）⇒
   *     峰值过冲 0.07 层 = 16px —— 与第十一轮量到的「快甩 +12.6px 动量」一致，是需求④要的手感；
   *   · 快甩落在【最后一张卡】：`deckClampFocus` 的正侧橡皮筋把松手点顶到 `last` **之上**
   *     （实测 cur = 4.2246 ~ 4.5241），而目标被 `Math.min(last, idx)` 钉回 `last`
   *     ⇒ 注入的 vFocus 与「当前 → 目标」**反向**，settleFocus 却照旧把它注入 ios-deck
   *     ⇒ 峰值 4.343 / 4.5759 = **0.34~0.58 层 = 80~135px 的越界冲程**，再整段拉回来。
   *     单次快甩冲程 0.3628 层(85px)、松手后 ~600ms 才落定；
   *     连续快甩（14 次 / 300ms）下 spring 运行 6149ms / 总时长 6299ms
   *     —— 卡片**全程都在这 100px 量级上来回晃**，这就是「不停颤抖」。
   *   · 左边界为什么「好了」（交叉验证）：`cur < 0` 时 `poseFocus = max(0, …)` 把卡片位置钉死，
   *     越界量改走【已限速】的挤压通道（SQ_MAX_STEP 0.09/帧）⇒ 注入的越界速度在屏幕上
   *     没有位移出口。右边界走位移通道、1:1 全额可见 ⇒ 只有右边界表现为「颤抖」。
   *
   * 修法：判据下沉为纯函数 `switcherDeck.deckFlingOutward(cur, idx, vFocus, n)`
   *   ——「越界区 + 速度指向目标之外」⇒ 不注入动量，走 ios-deck-settle（ζ=1.0、v0 = 0）。
   *   平面内（0 ≤ cur ≤ last）恒 false ⇒ 需求④的动量与参考视频 V4 的过冲回弹逐位不变。
   *   自省口：`window.__switcherSettle.outward`。
   *
   * ⚠️ 本用例必须用【真实触摸 + 真实速度】：
   *   · `synthDrag` 是 pointerType 'mouse'、且分步时长由 vPx 反推，构造不出「快速甩」；
   *   · 而这条缺陷的触发条件里【速度方向】是自变量（vFocus 必须朝越界方向）——
   *     慢放手（v≈0）走的是非快甩分支，根本不进这条路径（那正是「停住再松手不抖」的原因）。
   *   所以先用慢速触摸走到最后一卡（每步 40ms ⇒ ≈1.9 层/秒 < FLICK_V_MIN 2.6，不构成快甩），
   *   再在同一张卡上做一次 5 笔 × 30px / 9ms（≈3300px/s ⇒ 必判快甩）的真实触摸快甩。
   * ⚠️ 判据用【松手那一刻的焦点】当上界（`settle.cur`），而不是拍一个绝对像素数：
   *   冲程上界 = 手指真的把卡拖到哪儿（跟手，用户没抱怨），越界外甩只允许【不再多走】。 */
  {
    const openFiveAndSwitcher = async () => {
      await page.evaluate(() => { const s = window.__system; s.exitSwitcherToHome(); s.dismissAll() })
      await page.waitForTimeout(260)
      for (const id of ['calculator', 'files', 'notes', 'camera', 'clock']) {
        await page.evaluate((a) => window.__system.openApp(a), id)
        await page.waitForTimeout(420)
      }
      await page.evaluate(() => window.__system.openSwitcher())
      await page.waitForTimeout(900)
    }

    /** walkTo：先用【慢速】触摸走到第几张卡（0 = 不走，直接在 0 号卡上甩）。
     *  之后在同一位置做一次真实快甩，并按【相位】逐帧记「渲染出来的焦点」。
     *  相位在页面内打标 ⇒ 与 pointerup 严格同源，不像 CDP 方案那样要靠时间猜测。 */
    const synthLastFlick = (walkTo, { steps = 5, stepMs = 9, px = 30 } = {}) =>
      page.evaluate(
        async ({ walkTo, steps, stepMs, px, span }) => {
          const root = document.querySelector('.app-switcher')
          if (!root) return { error: 'no .app-switcher' }
          const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
          const mk = (t, x) =>
            new PointerEvent(t, {
              bubbles: true, cancelable: true, composed: true, pointerId: 5,
              pointerType: 'touch', isPrimary: true,
              buttons: t === 'pointerup' ? 0 : 1, clientX: x, clientY: 500
            })
          const x0 = 70
          const rec = []
          let run = true
          let ph = 'idle'
          const sample = () => {
            if (!run) return
            const cs = [...document.querySelectorAll('.switcher-card.is-deck')]
            if (cs.length) {
              const pairs = cs.map((c) => [+c.dataset.index, +c.dataset.depth])
              const best = pairs.reduce((a, b) => (Math.abs(b[1]) < Math.abs(a[1]) ? b : a))
              rec.push({ v: +(best[0] - best[1]).toFixed(4), ph })
            }
            requestAnimationFrame(sample)
          }
          requestAnimationFrame(sample)

          /* ── 阶段 1：慢速走到目标卡（每步 40ms、约 18px ⇒ ≈1.9 层/秒，判不出快甩）── */
          ph = 'walk'
          for (let g = 0; g < walkTo; g++) {
            root.dispatchEvent(mk('pointerdown', x0))
            await sleep(30)
            const nSteps = 13
            for (let i = 1; i <= nSteps; i++) {
              root.dispatchEvent(mk('pointermove', x0 + (span * i) / nSteps))
              await sleep(40)
            }
            await sleep(200) // 停住 ⇒ 松手速度 ≈ 0（非快甩分支）
            root.dispatchEvent(mk('pointerup', x0 + span))
            await sleep(650)
          }
          const walked = window.__switcherSettle ? window.__switcherSettle.idx : null

          /* ── 阶段 2：同一张卡上的真实快甩（steps 笔 × px / stepMs ⇒ 远高于 FLICK_V_MIN）── */
          window.__switcherSettle = null
          ph = 'flick'
          root.dispatchEvent(mk('pointerdown', x0))
          await sleep(22)
          for (let i = 1; i <= steps; i++) {
            root.dispatchEvent(mk('pointermove', x0 + px * i))
            await sleep(stepMs)
          }
          root.dispatchEvent(mk('pointerup', x0 + px * steps))
          ph = 'after'
          await sleep(1800)
          run = false

          const after = rec.filter((r) => r.ph === 'after').map((r) => r.v)
          let rev = 0
          let prevD = null
          for (let i = 1; i < after.length; i++) {
            const d = after[i] - after[i - 1]
            if (prevD != null && d * prevD < 0 && Math.abs(d) > 0.008 && Math.abs(prevD) > 0.008) rev++
            prevD = d
          }
          return {
            walked,
            settle: window.__switcherSettle,
            afterMax: after.length ? +Math.max(...after).toFixed(4) : null,
            afterMin: after.length ? +Math.min(...after).toFixed(4) : null,
            afterEnd: after.length ? after[after.length - 1] : null,
            rev,
            nAfter: after.length,
            apps: window.__system.recentApps.length
          }
        },
        { walkTo, steps, stepMs, px, span: SPAN }
      )

    await openFiveAndSwitcher()
    const lastIdx = await page.evaluate(() => Math.max(0, window.__system.recentApps.length - 1))
    const lf = await synthLastFlick(lastIdx)
    /* 前置：确实走完了、且最后一卡确实是最后一卡（否则整条用例测的就不是这个位置） */
    check('第二十二轮·前置：慢速触摸走到的末卡 = recentApps 的最后一张',
      lastIdx >= 3 && lf.walked === lastIdx && !!lf.settle && lf.settle.idx === lastIdx,
      `recentApps=${lf.apps} 张 · 走完落点=${lf.walked} · 快甩判定 idx=${lf.settle && lf.settle.idx}`)
    check('第二十二轮·需求：快甩落在最后一卡 ⇒ 判成「越界外甩」（不再注入动量）',
      !!lf.settle && lf.settle.outward === true,
      `settle=${JSON.stringify(lf.settle)}（改前无 outward 字段，且会把 vFocus 注入 ios-deck）`)
    check('第二十二轮·需求：越界外甩不再把卡片甩出去 —— 冲程 ≤ 松手点（改前额外越界 ≈0.14 层 ≈ 33px）',
      lf.afterMax != null && !!lf.settle && lf.afterMax - lastIdx <= lf.settle.cur - lastIdx + 0.02,
      `松手点 ${lf.settle && lf.settle.cur} 层 · 松手后最高 ${lf.afterMax} 层 · ` +
        `额外越界 ${lf.afterMax != null && lf.settle ? (lf.afterMax - lf.settle.cur).toFixed(4) : 'n/a'} 层（期望 ≤ 0.02）`)
    check('第二十二轮·需求：松手后严格单调收回（临界阻尼、反号 0 次）',
      lf.nAfter >= 60 && lf.rev === 0 && lf.afterMin != null && lf.afterMin >= lastIdx - 0.06,
      `松手后 ${lf.nAfter} 帧 · 反号 ${lf.rev} 次 · 最低 ${lf.afterMin} 层（下界 ≈ 末卡 ${lastIdx}）`)
    check('第二十二轮·需求：最终落定在最后一卡（不再「不停颤抖」）',
      Math.abs(lf.afterEnd - lastIdx) < 0.02,
      `终位 ${lf.afterEnd} 层（目标 ${lastIdx}）`)

    /* 对照：同一套输入落在【中间某张卡】上必须仍走动量分支（否则就是把需求④的动量一起改死了） */
    await openFiveAndSwitcher()
    const ip = await synthLastFlick(0)
    check('第二十二轮·对照：平面内的快甩仍注入动量（过冲越过了整卡边界，需求④不变）',
      !!ip.settle && ip.settle.outward === false && ip.settle.isFlick === true &&
        ip.afterMax != null && ip.afterMax > ip.settle.idx,
      `settle=${JSON.stringify(ip.settle)} · 松手后最高 ${ip.afterMax} 层（须 > ${ip.settle && ip.settle.idx}）`)
  }

  await resetHome()
}

check('无控制台报错', errs.length === 0, errs.slice(0, 3).join(' | '))

await page.screenshot({ path: 'shots/app-switcher.png' })
await browser.close()
console.log(allOk ? '\n全部通过 ✅' : '\n存在失败 ❌')
process.exit(allOk ? 0 : 1)
