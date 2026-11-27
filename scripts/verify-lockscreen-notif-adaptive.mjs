#!/usr/bin/env node
/**
 * 锁屏 / 通知中心 通知卡片高度自适应 + 阔直板垂直节奏 验收（浏览器侧，真实几何）
 * =================================================================
 * 背景：
 *   · 阔直板（426pt）比直板（360pt）宽，描述文案常常 1 行就放得下。锁屏卡片曾写死 90px
 *     ⇒ 文字只占上半截、下半截空一块；现在高度由内容撑开（实测 1 行 68、2 行 85）。
 *   · 卡片变矮后如果仍按「顶边」定位，底部会多露一块空白 ⇒ 通知组改为「底边对齐」：
 *     前排卡片底边固定在安全 inset 之上 24px，直板 / 阔直板同一套节奏。
 *   · 阔直板更矮，音乐播放器会顶进时钟裁剪区被切掉 ⇒ 先把时钟往上顶，播放器完整可见。
 *   · 时钟挤压死区曾用「当前钟高」推导 ⇒ HIT ← 钟高 ← 挤压 ← HIT 反馈环，滚到底时
 *     时钟逐帧来回跳（闪动）。现在死区用静止高度，滚动全程单调压缩。
 *   · 上滑时卡片被列表上边界裁切，切口曾是直角横线 ⇒ 现在用 path() 在卡片左右边缘
 *     （锁屏 14px/22px 圆角；通知中心 14px/24px 圆角）把切口做成卡片自身的圆角。
 *
 * 用法：node scripts/verify-lockscreen-notif-adaptive.mjs [port]   （默认 7777）
 */
import { chromium } from 'playwright'
import fs from 'node:fs'

const PORT = process.argv[2] || process.env.PORT || '7777'
const BASE = `http://127.0.0.1:${PORT}/`

const checks = []
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail })
  console.log(`${ok ? '✔' : '✖'} ${name}${detail ? ' — ' + detail : ''}`)
}

const execPath = [process.env.PLAYWRIGHT_CHROME, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
  .filter(Boolean)
  .find((p) => fs.existsSync(p))
const browser = await chromium.launch(execPath ? { executablePath: execPath } : {})
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

const consoleErrors = []
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

async function openForm(form) {
  await page.goto(BASE + '?form=' + form, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
}

async function setMedia(active) {
  await page.evaluate((on) => {
    const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
    const control = pinia._s.get('control')
    control.mediaActive = on
    control.mediaPlaying = on
  }, active)
  await page.waitForTimeout(800)
}

function readLayout() {
  return page.evaluate(() => {
    const screen = document.querySelector('.screen-view')
    const sr = screen.getBoundingClientRect()
    const scale = sr.width / screen.offsetWidth
    const local = (el) => {
      const r = el.getBoundingClientRect()
      return { top: (r.top - sr.top) / scale, bottom: (r.bottom - sr.top) / scale, height: r.height / scale }
    }
    const cards = [...document.querySelectorAll('.ls-card-wrapper[data-notif-id]')].map((w) => {
      const front = w.querySelector('.ls-card-front')
      const desc = w.querySelector('.ls-notif-desc')
      const lh = desc ? parseFloat(getComputedStyle(desc).lineHeight) || 17.55 : 0
      const r = local(w)
      return {
        top: r.top,
        bottom: r.bottom,
        height: w.offsetHeight,
        rectHeight: r.height,
        overflow: front ? front.scrollHeight - front.clientHeight : 0,
        lines: desc && lh ? Math.round(desc.offsetHeight / lh) : 0
      }
    })
    const clip = document.querySelector('.ls-clip')
    /* 切口现在用 path()（上边界圆角），兼容旧的 inset() 解析：
       path 的起点是 (0, 切口线 + 圆角半径)，减回半径即切口线。 */
    const clipPath = clip ? getComputedStyle(clip).clipPath : ''
    const insetTop = clipPath.match(/inset\(([-\d.]+)px/)?.[1]
    const pathStart = clipPath.match(/M\s*0\s+([-\d.]+)/)?.[1]
    const clipTop = insetTop != null ? parseFloat(insetTop) : pathStart != null ? parseFloat(pathStart) - 22 : NaN
    const clock = document.querySelector('.ls-clock')
    const player = document.querySelector('.ls-player-in-lock')
    return {
      screenH: sr.height / scale,
      cards,
      clipTop,
      clockHeight: clock ? clock.getBoundingClientRect().height / scale : null,
      player: player ? local(player) : null
    }
  })
}

/* 取屏幕截图的像素亮度（截图是 deviceScaleFactor=2，坐标需 ×2）——
   用来验证「上滑裁切是圆角还是直角」：切口角落若被圆角削掉应回落到壁纸/背景亮度。 */
async function sampleScreenPixels(points) {
  const buf = await page.locator('.screen-view').first().screenshot()
  const b64 = buf.toString('base64')
  return page.evaluate(async ({ b64, points }) => {
    const img = new Image()
    img.src = 'data:image/png;base64,' + b64
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const c = canvas.getContext('2d')
    c.drawImage(img, 0, 0)
    return points.map(([x, y]) => {
      const d = c.getImageData(Math.round(x * 2), Math.round(y * 2), 1, 1).data
      return Math.round(0.299 * d[0] + 0.587 * d[1] + 0.114 * d[2])
    })
  }, { b64, points })
}

/* ① 直板 + 阔直板：卡片高度随内容走 */
await openForm('slab')
const slab = await readLayout()
const slabTwo = slab.cards.filter((c) => c.lines >= 2)
check('直板 2 行卡片高度落在 80–92px', slabTwo.length > 0 && slabTwo.every((c) => c.height >= 80 && c.height <= 92), slabTwo.map((c) => c.height).join('/'))
check('直板卡片内容不溢出', slab.cards.every((c) => c.overflow <= 1), 'max overflow ' + Math.max(...slab.cards.map((c) => c.overflow)))

await openForm('wide')
const wide = await readLayout()
const wideOne = wide.cards.filter((c) => c.lines <= 1)
check('阔直板 1 行卡片高度落在 60–74px', wideOne.length >= 3 && wideOne.every((c) => c.height >= 60 && c.height <= 74), wideOne.map((c) => c.height).join('/'))
check('阔直板卡片内容不溢出', wide.cards.every((c) => c.overflow <= 1), 'max overflow ' + Math.max(...wide.cards.map((c) => c.overflow)))

/* ② 底边对齐：两种形态前排卡片底边到屏幕底的距离一致（旧固定 90 设计 = 134px） */
const slabBottomGap = +(slab.screenH - slab.cards[0].bottom).toFixed(1)
const wideBottomGap = +(wide.screenH - wide.cards[0].bottom).toFixed(1)
check(
  '直板 / 阔直板底边节奏一致（前排卡底边距屏底 134px ± 2）',
  Math.abs(slabBottomGap - 134) <= 2 && Math.abs(wideBottomGap - 134) <= 2,
  `slab ${slabBottomGap}px · wide ${wideBottomGap}px`
)

/* ③ 底部堆叠露出量：阔直板与直板同量级（不再多露一截） */
const slabPeek = +(slab.cards[1].bottom - slab.cards[0].bottom).toFixed(1)
const widePeek = +(wide.cards[1].bottom - wide.cards[0].bottom).toFixed(1)
check('阔直板堆叠露出量与直板同量级（±4px）', Math.abs(widePeek - slabPeek) <= 4, `slab ${slabPeek}px · wide ${widePeek}px`)

/* ④ 展开态相邻卡片间距 ≈ 8px */
await page.evaluate(() => { const c = document.querySelector('.ls-clip'); if (c) c.scrollTop = c.scrollHeight })
await page.waitForTimeout(600)
const scrolled = await readLayout()
const gaps = scrolled.cards.slice(1).map((c, i) => +(c.top - scrolled.cards[i].bottom).toFixed(1))
check('展开态相邻卡片间距 ≈ 8px', gaps.length > 0 && gaps.every((g) => Math.abs(g - 8) <= 2.5), gaps.join('/'))

/* ④b 上滑裁切：切口必须是沿卡片圆角的圆角，而不是一条直角横线。
   像素判定：切口线上「卡片左缘内侧 6px」落在圆角缺口里 → 应回落到壁纸亮度；
   同一行的卡片中部应仍是卡片亮度。直角裁切时角落会是卡片亮度（旧实现即失败）。 */
const cutGeo = await page.evaluate(() => {
  const clip = document.querySelector('.ls-clip')
  const m = getComputedStyle(clip).clipPath.match(/M\s*0\s+([-\d.]+)/)
  return { clipLine: m ? parseFloat(m[1]) - 22 : NaN, clipPath: getComputedStyle(clip).clipPath }
})
const [lsWall, lsCorner, lsCard] = await sampleScreenPixels([
  [6, cutGeo.clipLine + 3],
  [20, cutGeo.clipLine + 3],
  [100, cutGeo.clipLine + 3]
])
check(
  '锁屏上滑切口为圆角（不是直角横切）',
  cutGeo.clipPath.startsWith('path(') && Math.abs(lsCorner - lsWall) <= 10 && lsCard - lsCorner >= 40,
  `wall ${lsWall} · corner ${lsCorner} · card ${lsCard}`
)

/* ⑤ 音乐播放器：阔直板下把时钟往上顶，播放器完整落在裁剪区下方 */
await page.evaluate(() => { const c = document.querySelector('.ls-clip'); if (c) c.scrollTop = 0 })
await page.waitForTimeout(500)
await openForm('wide')
await setMedia(true)
const wideMedia = await readLayout()
check(
  '阔直板 + 播放器：播放器完整可见（不被时钟裁剪区切掉）',
  !!wideMedia.player && wideMedia.player.top >= wideMedia.clipTop - 0.5,
  `player.top ${wideMedia.player?.top?.toFixed(1)} · clipTop ${wideMedia.clipTop}`
)
check('阔直板 + 播放器：时钟确实被往上顶', wideMedia.clockHeight !== null && wideMedia.clockHeight < 305, `clock ${wideMedia.clockHeight?.toFixed(1)}px`)

/* ⑥ 上滑通知时钟不闪动：滚动全程钟高单调压缩，并压到最小 110 */
const cardBox = await page.locator('.ls-card-wrapper .ls-card-front').first().boundingBox()
await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2)
await page.evaluate(() => {
  window.__clockSamples = []
  const clip = document.querySelector('.ls-clip')
  const clock = document.querySelector('.ls-clock')
  let n = 0
  const tick = () => {
    window.__clockSamples.push({ scroll: Math.round(clip?.scrollTop ?? -1), h: clock ? +clock.getBoundingClientRect().height.toFixed(1) : null })
    if (++n < 220) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 110); await page.waitForTimeout(40) }
await page.waitForTimeout(1000)
const scrollStats = await page.evaluate(() => {
  const s = window.__clockSamples || []
  let reversals = 0
  let lastDir = 0
  for (let i = 1; i < s.length; i++) {
    const d = Math.sign(s[i].h - s[i - 1].h)
    if (d !== 0 && lastDir !== 0 && d !== lastDir) reversals++
    if (d !== 0) lastDir = d
  }
  return { samples: s.length, maxScroll: Math.max(...s.map((x) => x.scroll)), minClock: Math.min(...s.map((x) => x.h)), reversals }
})
check(
  '阔直板上滑通知：时钟单调压缩、不闪动',
  scrollStats.maxScroll > 100 && scrollStats.reversals === 0 && scrollStats.minClock <= 112,
  `scroll ${scrollStats.maxScroll} · 钟高最小 ${scrollStats.minClock} · 方向反转 ${scrollStats.reversals}`
)
await setMedia(false)

/* ⑦ 灵动岛活动卡片仍是模板固定高度 84 */
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  pinia._s.get('notifications').setIslandEnabled('alarm', true)
  pinia._s.get('clock').triggerAlarm()
})
await page.waitForTimeout(1000)
const activity = await page.evaluate(() => {
  const w = document.querySelector('.ls-card-wrapper.is-activity, .ls-card-wrapper.ls-activity-standalone')
  if (!w) return null
  const front = w.querySelector('.ls-card-front')
  return { height: w.offsetHeight, frontPos: front ? getComputedStyle(front).position : null }
})
check('活动卡片仍为 84px 固定高度', !!activity && activity.height === 84, activity ? String(activity.height) : 'missing')
check('活动卡片表层仍铺满包装器（absolute）', !!activity && activity.frontPos === 'absolute', activity?.frontPos || '')
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  pinia._s.get('clock').dismissAlarm()
})
await page.waitForTimeout(500)

/* ⑧ 通知中心：同一表单下卡片高度随内容变化（内容驱动，不是固定高） */
await openForm('wide')
await page.locator('.edge-nc').click({ position: { x: 60, y: 6 }, force: true })
await page.waitForTimeout(900)
const ncCards = await page.evaluate(() => {
  return [...document.querySelectorAll('.nc-item-wrapper')]
    .map((w) => {
      const card = w.querySelector('.nc-card')
      const desc = w.querySelector('.nc-card-desc')
      if (!card || card.style.transform) return null
      const lh = desc ? parseFloat(getComputedStyle(desc).lineHeight) || 20 : 20
      return { height: card.offsetHeight, lines: desc && lh ? Math.round(desc.offsetHeight / lh) : 0 }
    })
    .filter(Boolean)
})
const ncOne = ncCards.filter((c) => c.lines <= 1).map((c) => c.height)
const ncTwo = ncCards.filter((c) => c.lines >= 2).map((c) => c.height)
const ncGap = (ncOne.length && ncTwo.length) ? Math.min(...ncTwo) - Math.max(...ncOne) : 0
check('通知中心卡片高度随行数变化 ≥ 12px', ncCards.length > 3 && ncGap >= 12, `1行 ${ncOne.join('/')} · 2行 ${ncTwo.join('/')} · Δ${ncGap.toFixed(1)}`)

/* ⑨ 通知中心上滑裁切同样是圆角：找一档「顶部确实切在卡片腰部」的滚动位置再验像素。
   判定同锁屏：切口角落回落到列表背景，同一行卡片中部仍是卡片亮度。 */
const ncCut = await page.evaluate(() => {
  const screen = document.querySelector('.screen-view')
  const sr = screen.getBoundingClientRect()
  const sc = sr.width / screen.offsetWidth
  const list = document.querySelector('.nc-list')
  const listTop = (list.getBoundingClientRect().top - sr.top) / sc
  const listLeft = (list.getBoundingClientRect().left - sr.left) / sc
  const cutPoint = (x, y) => {
    const wrappers = [...document.querySelectorAll('.nc-item-wrapper')]
    return wrappers.some((w) => {
      const r = w.getBoundingClientRect()
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
    })
  }
  for (const top of [296, 306, 316, 326, 336, 346]) {
    list.scrollTop = top
    if (cutPoint(sr.left + (listLeft + 100) * sc, sr.top + (listTop + 3) * sc)) {
      return { top, listTop, listLeft, clipPath: getComputedStyle(list).clipPath }
    }
  }
  return { top: list.scrollTop, listTop, listLeft, clipPath: getComputedStyle(list).clipPath }
})
await page.waitForTimeout(400)
const [ncWall, ncCorner, ncCard] = await sampleScreenPixels([
  [ncCut.listLeft + 6, ncCut.listTop + 3],
  [ncCut.listLeft + 20, ncCut.listTop + 3],
  [ncCut.listLeft + 100, ncCut.listTop + 3]
])
check(
  '通知中心上滑切口为圆角（不是直角横切）',
  ncCut.clipPath.startsWith('path(') && Math.abs(ncCorner - ncWall) <= 10 && ncCard - ncCorner >= 15,
  `wall ${ncWall} · corner ${ncCorner} · card ${ncCard} · scrollTop ${ncCut.top}`
)

check('控制台无报错', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

await browser.close()

const pass = checks.filter((c) => c.ok).length
const fail = checks.length - pass
console.log(`[lockscreen-notif] ${pass} PASS / ${fail} FAIL`)
process.exit(fail === 0 ? 0 : 1)
