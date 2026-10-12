/**
 * 相册（Photos）流程 e2e
 * =====================================================================
 * 参考图两张（Ricky 提供）：
 *   图 1 首页 —— 右上悬浮胶囊（列表/勾选/设置）· 大标题「照片」·
 *              按日期分组的 3 列缩略图网格 · 底部「照片/相册/发现」悬浮栏 + 搜索圆钮
 *   图 2 全屏 —— 返回 + 两行日期 · 居中大图 · 右下圆形按钮 ·
 *              底部深色玻璃操作栏（分享/收藏/编辑/删除/更多）
 *
 * 覆盖：注册到位（不是占位页）→ 首页四分组/三列/10 张真解码 → 复用系统壁纸 →
 *      右上胶囊避让 64px 手势热区 → 底栏与搜索圆钮几何 → 渐隐遮罩 → 滚动 →
 *      点图进全屏（chrome 切白图标）→ 收藏开合（红心 + 回执）→
 *      左右切换与末张停住 → 更多面板 → 删除确认（张数 -1、被删 id 消失、退到相邻张）→
 *      全屏竖向栈不重叠（操作栏/扫描钮/回执）→ 贴底不压 home-indicator →
 *      返回键回首页并切回深色图标 → 再进无残留 → 0 控制台报错
 * 用法：node scripts/verify-photos-flow.mjs [port]      默认 5555
 * 截图：/tmp/photos/e2e/photos-NN-<名字>.png
 *
 * ⚠️ 本仓铁律（已在实现里落地，脚本逐条兜住）：
 *   ① 应用内浮层一律 `position: absolute` —— `fixed` 的包含块会落到外层机身（实测四边各偏 16px）
 *   ② 顶部 64px 是 `ScreenView` 的 `.edge-zone` 手势热区（z 85）⇒ 胶囊按钮组/返回键必须落下去
 *   ③ 宿主把整机等比缩放（~0.941）⇒「元素该多大」读 computed style，
 *      「两个元素的相对位置」同坐标系读 rect 才有效
 *   ④ ⛔ `clientHeight` / `scrollHeight` 是未缩放整数，绝不能与 `rect` 混比
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.argv[2] || '5555'
const OUT = '/tmp/photos/e2e'
mkdirSync(OUT, { recursive: true })

const steps = []
let pass = 0
const fails = []
function assert(label, cond, extra) {
  if (cond) { pass += 1; console.log(`  ✅ ${label}`) }
  else { fails.push(label); console.log(`  ❌ ${label}${extra !== undefined ? ' → ' + JSON.stringify(extra) : ''}`) }
}
function head(t) { console.log(`\n── ${t} ──`); steps.push(t) }

const b = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
})
const p = await b.newPage({ viewport: { width: 1080, height: 860 }, deviceScaleFactor: 1 })
const errors = []
p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })

let shotIdx = 0
const shot = (name) => p.screenshot({ path: `${OUT}/photos-${String(++shotIdx).padStart(2, '0')}-${name}.png` })
const wait = (ms = 400) => p.waitForTimeout(ms)
/** ⚠️ 无头 Chrome 会拍到「尚未绘制的帧」⇒ 截图前必须套两层 rAF */
const twoFrames = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const n = (sel) => p.locator(sel).count()
const visible = async (sel) => (await n(sel)) > 0 && (await p.locator(sel).first().isVisible())
const txt = async (sel) => ((await p.locator(sel).first().textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim()
const tap = async (sel, ms = 450) => {
  await p.locator(sel).first().scrollIntoViewIfNeeded().catch(() => {})
  await p.locator(sel).first().click()
  await wait(ms)
}
const cssNum = (sel, prop) => p.evaluate(([s, pr]) => {
  const el = document.querySelector(s)
  return el ? parseFloat(getComputedStyle(el)[pr]) : null
}, [sel, prop])
/** rect 相对应用根的四个边距（同坐标系，缩放不影响差值）；另带 computed 尺寸（未缩放） */
const box = (sel) => p.evaluate((s) => {
  const el = document.querySelector(s)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const root = document.querySelector('.photos-app')
  const a = root ? root.getBoundingClientRect() : { top: 0, bottom: 0, left: 0, right: 0 }
  const cs = getComputedStyle(el)
  return {
    topFromApp: +(r.top - a.top).toFixed(1),
    bottomFromApp: +(a.bottom - r.bottom).toFixed(1),
    leftFromApp: +(r.left - a.left).toFixed(1),
    rightFromApp: +(a.right - r.right).toFixed(1),
    w: +r.width.toFixed(1),
    h: +r.height.toFixed(1),
    right: +r.right.toFixed(1),
    bottom: +r.bottom.toFixed(1),
    position: cs.position,
    z: cs.zIndex,
    cssH: cs.height,
    cssW: cs.width
  }
}, sel)
/**
 * 贴底元素是否让开了 home-indicator 的可视条。
 * ⚠️ 判据必须取 `.home-indicator .bar`（可视 5px 条，距底 9~14px），
 *    不能取 `.home-indicator` 根 —— 那是「向上透明延伸」的 34px 手势热区，
 *    本仓标准底栏位就是 `bottom: 22px`（本来就是落在热区内、但压在可视条之上）。
 */
async function bottomClear(sel, label) {
  const r = await p.evaluate((s) => {
    const el = document.querySelector(s)
    const bar = document.querySelector('.home-indicator .bar')
    if (!el || !bar) return null
    return {
      bottom: el.getBoundingClientRect().bottom,
      indTop: bar.getBoundingClientRect().top
    }
  }, sel)
  assert(`贴底不压 home-indicator 可视条：${label}（下沿 ${r && r.bottom.toFixed(1)} ≤ ${r && r.indTop.toFixed(1)}）`, !!r && r.bottom <= r.indTop)
}
/** 等所有网格图真的解码完（避免拿 not-yet-loaded 的张数当结论） */
const waitImages = () => p.evaluate(async () => {
  const imgs = [...document.querySelectorAll('[data-photos-grid] img')]
  await Promise.all(imgs.map((i) => (i.complete && i.naturalWidth > 0 ? null : new Promise((r) => {
    i.onload = i.onerror = () => r()
  }))))
  return imgs.map((i) => ({ src: i.getAttribute('src'), nw: i.naturalWidth }))
})

/* ═════════════ 1. 进应用（注册到位） ═════════════ */
head('进应用')
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.evaluate(() => window.__system.unlock())
await wait(600)
await p.evaluate(() => window.__system.openApp('photos'))
await wait(900)
await waitImages()
await wait(300)
await twoFrames()
assert('相册应用已挂载（不是 PlaceholderApp）', await visible('[data-photos-page]'))
assert('  没有落到占位页', !(await visible('.placeholder-app')), await n('.placeholder-app'))
assert('  标题栏区域存在', await visible('[data-photos-head]'))
await shot('home')

/* ═════════════ 2. 首页结构 ═════════════ */
head('首页结构')
assert('大标题 =「照片」', (await txt('[data-photos-title]')) === '照片', await txt('[data-photos-title]'))
/* 字号来自通用件 `composables/useLargeTitle.js` 的 LARGE_TITLE.fromSize（36），
   ⛔ 别在这页写死 34 —— 全仓大标题只有一条曲线，见「大标题折叠」段。 */
assert(`  大标题起手字号 36px（computed ${await cssNum('[data-photos-title]', 'fontSize')}）`, (await cssNum('[data-photos-title]', 'fontSize')) === 36)
/* 本仓铁律：新重放的屏不许出现 <12px 文字。
   ⛔ 但要把标准控件 FloatingTabBar 自己那条 10.5px 标签排除掉（全仓共用，不是本屏引入的）。 */
const tiny = await p.evaluate(() => {
  const out = []
  for (const el of document.querySelectorAll('.photos-app *')) {
    if (el.closest('.floating-tab-bar')) continue
    if (!el.childNodes.length) continue
    if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue
    const fs = parseFloat(getComputedStyle(el).fontSize)
    if (fs && fs < 12) out.push({ cls: el.className, fs, t: el.textContent.trim().slice(0, 12) })
  }
  return out
})
assert('相册内无 <12px 文字（排除标准底栏自身的 10.5px）', tiny.length === 0, tiny)

const dayTitles = await p.locator('[data-photos-day-title]').allTextContents()
assert('4 个日期分组', dayTitles.length === 4, dayTitles)
assert('  首组 =「今天」', dayTitles[0] === '今天', dayTitles[0])
assert('  次组 =「昨天」', dayTitles[1] === '昨天', dayTitles[1])
assert('  后两组为长日期（按语言本地化）',
  /年.+月.+日/.test(dayTitles[2]) && /年.+月.+日/.test(dayTitles[3]) ? true : JSON.stringify(dayTitles.slice(2)),
  dayTitles.slice(2))

const cellCount = await n('[data-photo]')
assert('10 张缩略图', cellCount === 10, cellCount)
const imgs = await waitImages()
assert('  10 张图全部真解码（naturalWidth > 0）',
  imgs.length === 10 && imgs.every((i) => i.nw > 0),
  imgs.filter((i) => !(i.nw > 0)).map((i) => i.src))
const wallCount = imgs.filter((i) => /assets\/img/.test(i.src || '')).length
assert(`  其中 ${wallCount} 张直接复用系统壁纸（PRESET_WALLPAPERS）`, wallCount >= 4, imgs.map((i) => i.src))
assert('  其余走 public/photos 绝对路径',
  imgs.filter((i) => !/assets\/img/.test(i.src || '')).every((i) => /^\/photos\/[\w-]+\.jpg$/.test(i.src)),
  imgs.filter((i) => !/assets\/img/.test(i.src || '')).map((i) => i.src))

// 三列：第 4 格换行（x 回到第 1 格、y 下移）
const cols = await p.evaluate(() => [...document.querySelectorAll('[data-photos-day="0"] [data-photo]')].slice(0, 3).map((e) => +e.getBoundingClientRect().x.toFixed(1)))
assert('首组是 3 列（前 3 格同一行、x 递增）',
  cols.length === 3 && cols[0] < cols[1] && cols[1] < cols[2], cols)
const firstDay = await p.evaluate(() => {
  const sec = document.querySelector('[data-photos-day="0"]')
  const cells = [...sec.querySelectorAll('[data-photo]')]
  return { gap: +(cells[1].getBoundingClientRect().x - cells[0].getBoundingClientRect().right).toFixed(1), cellW: +cells[0].getBoundingClientRect().width.toFixed(1) }
})
assert(`  格子间隙为 2px 级（实测 ${firstDay.gap}px）`, firstDay.gap > 0 && firstDay.gap <= 4, firstDay)

/* ═════════════ 3. 右上胶囊与顶部手势热区（让位契约） ═════════════ */
head('右上胶囊与顶部手势热区让位')
/* ⚠️ 宿主把整机等比缩放（~0.941）⇒「热区高 64px」是**未缩放**常量，必须读 computed；
   而「胶囊落在哪」是同一坐标系内的相对位置 ⇒ 用 rect 正确（下面的比较里已按同尺度换算）。

   🔴 参考图把右上菜单画在 y 44.65–85.14px —— **本来就压在 64px 热区上**。
   所以判据不再是「胶囊必须在热区之下」（那是旧形态、且与参考图冲突），而是
   「热区在胶囊这块矩形里让位，按钮整高仍然点得着」。让位规则在 ScreenView.vue。 */
const zone = await p.evaluate(() => {
  const cc = document.querySelector('.edge-cc')
  const nc = document.querySelector('.edge-nc')
  const sv = document.querySelector('.screen-view')
  const a = document.querySelector('.photos-app').getBoundingClientRect()
  const rel = (el) => { const b = el.getBoundingClientRect(); return { top: +(b.top - a.top).toFixed(1), bottom: +(b.bottom - a.top).toFixed(1) } }
  return {
    ncH: nc && getComputedStyle(nc).height,
    ccH: cc && getComputedStyle(cc).height,
    ncRect: nc ? rel(nc) : null,
    ccRect: cc ? rel(cc) : null,
    yieldTop: sv && getComputedStyle(sv).getPropertyValue('--edge-yield-top').trim(),
    scale: a.width / 360
  }
})
assert(`手势热区存在；通知中心仍为完整 64px、控制中心让位到 ${zone && zone.ccH}`,
  zone.ncH === '64px' && zone.ccH === '44px', zone)
assert(`  让位上缘 ${zone && zone.yieldTop}px 落在原热区之内（未让位前热区下沿 ${zone && zone.ncRect.bottom}px）`,
  parseFloat(zone.yieldTop) * zone.scale < zone.ncRect.bottom, zone)
assert(`  两条热区都从机身顶起（控制中心 top ${zone && zone.ccRect.top}px）`, zone.ccRect.top === 0, zone)
const headBox = await box('[data-photos-head]')
const yieldTopScaled = parseFloat(zone.yieldTop) * zone.scale
assert(`  胶囊顶边 ${headBox && headBox.topFromApp}px ≈ 让位上缘 ${yieldTopScaled.toFixed(1)}px（同尺度，差 < 2px）`,
  Math.abs(headBox.topFromApp - yieldTopScaled) < 2, { headBox, yieldTopScaled })
assert('  胶囊整体在应用内（右/上不越界）', headBox.rightFromApp >= 0 && headBox.topFromApp >= 0, headBox)
assert('  三个按钮都可点', (await n('[data-photos-head] button')) === 3)

/* ═════════════ 4. 底栏 / 搜索圆钮 / 渐隐遮罩 ═════════════ */
head('底栏与搜索圆钮')
const tb = await box('[data-photos-tabbar]')
const se = await box('[data-photos-search]')
assert('底栏与搜索圆钮同基线（bottom 均 22px 级）',
  Math.abs(tb.bottomFromApp - se.bottomFromApp) <= 2, { tabbar: tb.bottomFromApp, search: se.bottomFromApp })
assert(`底栏高度 = 62px（computed ${tb.cssH}）`, tb.cssH === '62px', tb.cssH)
assert(`搜索圆钮 62×62（computed ${se.cssW}×${se.cssH}）`, se.cssH === '62px' && se.cssW === '62px', se)
assert('底栏右边缘让开了搜索圆钮（不重叠）',
  tb.right <= se.right - se.w + 1, { tabbarRight: tb.right, searchLeft: se.right - se.w })
assert('底栏左边缘 = 22px 级', Math.abs(tb.leftFromApp - 22) <= 2, tb.leftFromApp)
assert('三个 Tab 文案 = 照片/相册/发现',
  JSON.stringify(await p.locator('[data-photos-tabbar] .tab-label-text').allTextContents()) === JSON.stringify(['照片', '相册', '发现']),
  await p.locator('[data-photos-tabbar] .tab-label-text').allTextContents())
assert('底栏图标走 #icon 插槽自绘（不是控件默认硬编码白色 fill）',
  await p.evaluate(() => document.querySelectorAll('[data-photos-tabbar] .pv-tab-icon svg').length === 3))

const mask = await p.evaluate(() => getComputedStyle(document.querySelector('.pv-scroll')).maskImage)
assert('滚动容器挂了底部渐隐遮罩（不是 none）', !!mask && mask !== 'none' && /gradient/.test(mask), mask)
await bottomClear('[data-photos-tabbar]', '底部悬浮栏')
await bottomClear('[data-photos-search]', '搜索圆钮')

// 滚动：末组能滚进视野
await p.evaluate(() => { document.querySelector('.pv-scroll').scrollTop = 99999 })
await wait(400)
const scrolled = await p.evaluate(() => document.querySelector('.pv-scroll').scrollTop)
assert('相册可滚动（滚到底 scrollTop > 0）', scrolled > 0, scrolled)
await p.evaluate(() => { document.querySelector('.pv-scroll').scrollTop = 0 })
await wait(300)

// chrome：首页浅底走深色图标（进全屏后应切白图标，见「全屏查看」段）
const chromeHome = await p.evaluate(() => getComputedStyle(document.querySelector('.status-bar')).color)
assert(`首页状态栏为深色图标（chrome=dark，实测 ${chromeHome}）`, /rgb\(0,\s*0,\s*0\)/.test(chromeHome), chromeHome)

/* ═════════════ 4b. 大标题折叠（与设置页同一条曲线）+ 状态栏带遮蔽 ═════════════ */
head('大标题折叠与状态栏遮蔽')
/** 读当前应用的大标题全部派生量（相对应用根；「该多大」一律读 computed） */
const readTitleIn = (rootSel) => p.evaluate((root) => {
  const app = document.querySelector(root)
  const lt = app && app.querySelector('[data-large-title]')
  if (!lt) return null
  const ar = app.getBoundingClientRect()
  const SCALE = ar.width / 360
  const D = (v) => +(v / SCALE).toFixed(2)
  const cs = getComputedStyle(lt)
  const span = lt.querySelector('[data-large-title-text]')
  const sc = [...app.querySelectorAll('*')].find(
    (e) => /auto|scroll/.test(getComputedStyle(e).overflowY) && e.scrollHeight - e.clientHeight > 4
  )
  const bg = getComputedStyle(lt, '::before').backgroundImage
  const stops = [...bg.matchAll(/rgba?\(([^)]+)\)\s*([\d.]+)%/g)].map((m) => {
    const parts = m[1].split(',').map((x) => x.trim())
    return { r: +parts[0], g: +parts[1], b: +parts[2], a: parts[3] === undefined ? 1 : +parts[3], at: +m[2] }
  })
  return {
    scrollTop: sc ? +sc.scrollTop.toFixed(2) : null,
    pos: cs.position,
    z: cs.zIndex,
    barH: cs.height,
    padTop: cs.paddingTop,
    size: cs.getPropertyValue('--title-size').trim(),
    inset: cs.getPropertyValue('--title-inset').trim(),
    topInset: cs.getPropertyValue('--title-top-inset').trim(),
    font: span && getComputedStyle(span).fontSize,
    leading: span && getComputedStyle(span).lineHeight,
    spanTop: span ? D(span.getBoundingClientRect().top - ar.top) : null,
    spanH: span ? D(span.getBoundingClientRect().height) : null,
    scrim: +parseFloat(getComputedStyle(lt, '::before').opacity).toFixed(4),
    scrimAlpha: stops.length ? stops[0].a : null,
    scrimRGB: stops.length ? `${stops[0].r},${stops[0].g},${stops[0].b}` : null,
    scrimStops: stops.map((x) => `${x.at}%:${x.a}`),
    maxScroll: sc ? sc.scrollHeight - sc.clientHeight : 0,
    overflowY: sc ? getComputedStyle(sc).overflowY : null
  }
}, rootSel)
const setTopIn = async (rootSel, t) => {
  const apply = () => p.evaluate(([root, v]) => {
    const app = document.querySelector(root)
    const sc = [...app.querySelectorAll('*')].find(
      (e) => /auto|scroll/.test(getComputedStyle(e).overflowY) && e.scrollHeight - e.clientHeight > 4
    )
    if (!sc) return null
    sc.scrollTop = v === 'max' ? sc.scrollHeight : v
    return sc.scrollTop
  }, [rootSel, t])
  if (t === 'max') {
    /* 🔴 折叠**本身会改变内容高度**（大标题条 126px → 118px ⇒ scrollHeight −8），
       Chrome 的 scroll anchoring（overflow-anchor: auto）会把 scrollTop 往回修几像素
       ⇒ 一次设值到不了 p=1（实测 asked 72 → settled 69，p=0.9583）。
       连设三次直到收敛；这与「滚到底」的用户操作等价。 */
    for (let i = 0; i < 3; i += 1) { await apply(); await wait(240); await twoFrames() }
    return
  }
  await apply()
  await wait(240)
  await twoFrames()
}
/** 只比「曲线与遮蔽契约」这些量（不含 maxScroll 等页面自有的东西） */
const curveOf = (x) => JSON.stringify({
  pos: x.pos, z: x.z, barH: x.barH, padTop: x.padTop, size: x.size,
  inset: x.inset, topInset: x.topInset, font: x.font, scrim: x.scrim,
  scrimAlpha: x.scrimAlpha, scrimRGB: x.scrimRGB, scrimStops: x.scrimStops
})

await setTopIn('.photos-app', 0)
const t0 = await readTitleIn('.photos-app')
assert('滚动容器 overflow-y = auto（若非 auto，scrollTop 恒 0、标题永远折不动）',
  t0.overflowY === 'auto', t0.overflowY)
assert(`  滚动区间 ${t0.maxScroll}px ≥ 折叠全距 72px`, t0.maxScroll >= 72, t0.maxScroll)
assert(`起手态：sticky / z=12 / 字号 36px / 条高 = safe-top(54)+105 = 159px（实测 ${t0.pos} / ${t0.z} / ${t0.font} / ${t0.barH}）`,
  t0.pos === 'sticky' && t0.z === '12' && t0.font === '36px' && t0.barH === '159px', t0)
{
  const tc = t0.spanTop + t0.spanH / 2
  assert(`  起手标题行盒中心 ${tc.toFixed(2)}px ≈ 参考图墨迹中心 110.85px（差 ${Math.abs(tc - 110.85).toFixed(2)}px）`,
    Math.abs(tc - 110.85) < 2, { spanTop: t0.spanTop, spanH: t0.spanH, center: tc })
  assert(`  起手标题左内缩 24px（行盒 left = --title-inset，参考图墨迹 left 26.0 ⇒ 实测 ${t0.inset}）`,
    t0.inset === '24px', t0.inset)

  /* ---- 左缘契约：分组标题与大标题**同一条竖线** ----
     Ricky 2026-10-12 用竖线标注：参考图里大标题墨迹 25.9 与分组标题墨迹 26.3 同线；
     改前本仓 26.0 / 17.0（差 9px，分组标题走的是自己的 2px + 14px）。
     量的是**行盒**左缘：两条墨迹对齐时，行盒差 = 1px
     （17px 分组标题的左边距 1.0px vs 36px 大标题 2.0px ⇒ 同盒对齐仍差 1px）。 */
  const align = await p.evaluate(() => {
    const app = document.querySelector('.photos-app')
    const ar = app.getBoundingClientRect()
    const SC = ar.width / 360
    const D = (v) => +((v - ar.left) / SC).toFixed(2)
    const t = app.querySelector('[data-large-title-text]')
    const ds = [...app.querySelectorAll('[data-photos-day-title]')]
    const wrap = app.querySelector('.pv-scroll')
    return {
      title: D(t.getBoundingClientRect().left),
      days: ds.map((e) => ({ t: e.textContent, l: D(e.getBoundingClientRect().left) })),
      marL: ds.length ? getComputedStyle(ds[0]).marginLeft : null,
      inset: getComputedStyle(wrap).getPropertyValue('--title-inset').trim()
    }
  })
  assert(
    `分组标题与大标题同左缘：${align.days.length} 组全部 = 大标题 + 1px（大标题 ${align.title}｜分组 ${align.days.map((d) => d.l).join(' · ')}）`,
    align.days.length === 4 && align.days.every((d) => Math.abs(d.l - align.title - 1) < 0.01),
    align
  )
  assert(
    `  左内缩走唯一来源 --title-inset（滚动容器 ${align.inset} ⇒ 分组标题 margin-left 解析 ${align.marL}）`,
    align.inset === '24px' && align.marL === '25px',
    align
  )
  // 🔴 必须在 scrollTop = 0 读 —— 滚到底时首行「今天」已被滚出视口（会读到 17px 的假失败）
  const dayTop = await p.evaluate(() => {
    const app = document.querySelector('.photos-app'); const ar = app.getBoundingClientRect()
    const d = app.querySelector('.pv-day-title')
    return d ? +((d.getBoundingClientRect().top - ar.top) / (ar.width / 360)).toFixed(1) : null
  })
  // ⚠️ 读的是 `.pv-day-title` 的**行盒顶**（= 条高），而参考图量的是**墨迹顶** 163.7px；
  //    本页该元素墨迹在行盒内下移 4.4px（30px 行盒 / 16.5px 字号，与 .pv-day 的 padding 无关）
  //    ⇒ 参考图对应「行盒顶 159.3px」。
  assert(`  内容首行「今天」行盒顶 y ${dayTop}px ≈ 条高 159px（参考图墨迹顶 163.7 − 墨迹偏移 4.4 = 159.3，差 ${Math.abs(dayTop - 159.3).toFixed(1)}px）`,
    dayTop !== null && Math.abs(dayTop - 159.3) < 2, dayTop)
}
assert('  起手态底幕完全透明（不挡内容）', t0.scrim === 0, t0.scrim)

/* 半程：不断言「某个魔法 scrollTop ⇒ 某个 progress」，而是断言**线性契约本身**
   （scrollTop 的落点会被 scroll anchoring 微调，把判据钉在映射关系上才不会假红）。 */
await setTopIn('.photos-app', 36)
const th = await readTitleIn('.photos-app')
const pH = Math.min(1, th.scrollTop / 72)
assert(`半程：progress 严格 = clamp(scrollTop/distance)（scrollTop ${th.scrollTop} → 期望 ${pH.toFixed(4)}，实测 ${th.scrim}）`,
  Math.abs(th.scrim - pH) < 0.005, { scrollTop: th.scrollTop, expected: pH, measured: th.scrim })
assert('  派生量与 progress 同步线性插值（字号 36−14p · 条高 159−41p · 内缩恒 24）',
  Math.abs(parseFloat(th.font) - (36 - 14 * th.scrim)) < 0.03 &&
  Math.abs(parseFloat(th.barH) - (159 - 41 * th.scrim)) < 0.03 &&
  parseFloat(th.inset) === 24, th)

await setTopIn('.photos-app', 'max')
const t1 = await readTitleIn('.photos-app')
assert(`满程 progress = 1（滚到底实测 scrollTop ${t1.scrollTop}）`, t1.scrim === 1, t1.scrim)
assert(`  字号收敛到 22px（36−14，实测 ${t1.font}）`, t1.font === '22px', t1.font)
assert(`  条高收敛到 118px（safe-top 54 + 64，实测 ${t1.barH}）`, t1.barH === '118px', t1.barH)
assert(`  折叠后标题顶内缩 = safe-top(54) + (−2) = 52px（实测 ${t1.padTop}）`, t1.padTop === '52px', t1.padTop)
assert(`  左右内缩收敛到 24px（与起手态同值 ⇒ 左边界不漂，实测 ${t1.inset}）`, t1.inset === '24px', t1.inset)
{
  const tc = t1.spanTop + t1.spanH / 2
  assert(`  折叠态标题行盒中心 ${tc.toFixed(2)}px ≈ 参考图墨迹中心 64.85px（差 ${Math.abs(tc - 64.85).toFixed(2)}px）`,
    Math.abs(tc - 64.85) < 2, { spanTop: t1.spanTop, spanH: t1.spanH, center: tc })
}

/* ═════════════ 4c. 右上菜单落点（参考图同尺对账）+ 顶部热区让位 ═════════════ */
/** 读右上菜单的几何（相对应用根，设计 px）；两态都要读 ⇒ 证明菜单不随标题缩放移动 */
const readAcc = () => p.evaluate(() => {
  const app = document.querySelector('.photos-app')
  const ar = app.getBoundingClientRect()
  const S = ar.width / 360
  const D = (v) => +(v / S).toFixed(2)
  const box = (el) => {
    const r = el.getBoundingClientRect()
    return { l: D(r.left - ar.left), r: D(r.right - ar.left), t: D(r.top - ar.top), b: D(r.bottom - ar.top), w: D(r.width), h: D(r.height) }
  }
  const pill = app.querySelector('[data-photos-head]')
  const btns = [...app.querySelectorAll('[data-photos-head] button')]
  const svgs = [...app.querySelectorAll('[data-photos-head] svg')]
  const sv = document.querySelector('.screen-view')
  const cc = document.querySelector('.edge-cc')
  const nc = document.querySelector('.edge-nc')
  return {
    pill: box(pill),
    btnCount: btns.length,
    btn0: box(btns[0]),
    btnLast: box(btns[btns.length - 1]),
    first: box(svgs[0]),
    last: box(svgs[svgs.length - 1]),
    ccH: getComputedStyle(cc).height,
    ncH: getComputedStyle(nc).height,
    yieldTop: getComputedStyle(sv).getPropertyValue('--edge-yield-top').trim(),
    yieldLeft: getComputedStyle(sv).getPropertyValue('--edge-yield-left').trim()
  }
})
await setTopIn('.photos-app', 0)
const a0 = await readAcc()
await setTopIn('.photos-app', 'max')
const a1 = await readAcc()
const iconCenter = (a1.first.t + a1.last.b) / 2
const titleCenter1 = t1.spanTop + t1.spanH / 2
// 图标中心距 = 首末**中心**跨度 ÷ 间隔数（3 颗 ⇒ 2 段）
const spacing = ((a1.last.l + a1.last.w / 2) - (a1.first.l + a1.first.w / 2)) / (a1.btnCount - 1)
const spacing2 = ((a1.last.l + a1.last.w / 2) - (a1.btn0.l + a1.btn0.w / 2)) / (a1.btnCount - 1)
assert(`菜单胶囊 = ${a1.pill.w}×${a1.pill.h}px，右内缩 ${(360 - a1.pill.r).toFixed(1)}px（参考图 144.7×40.3 / 20.7）`,
  Math.abs(a1.pill.w - 144.7) < 3 && Math.abs(a1.pill.h - 40.3) < 2.5 && Math.abs((360 - a1.pill.r) - 20.7) < 4.5,
  { w: a1.pill.w, h: a1.pill.h, rightInset: 360 - a1.pill.r })
assert(`  三颗按钮，单颗 ${a1.btn0.w}×${a1.btn0.h}px（参考图反解 图标中心距 46.35 ⇒ 44+gap2）`,
  a1.btnCount === 3 && a1.btn0.w === 44 && a1.btn0.h === 33, a1.btn0)
assert(`  图标中心距 ${spacing.toFixed(2)}px ≈ 参考图 46.35px（与按钮布局算值 ${spacing2.toFixed(2)}px 自洽）`,
  Math.abs(spacing - 46.35) < 1.5 && Math.abs(spacing - spacing2) < 1.5, { spacing, spacing2 })
assert(`  图标墨迹右内缩 ${(360 - a1.last.r).toFixed(1)}px ≈ 参考图 34.3px（差 ${Math.abs((360 - a1.last.r) - 34.3).toFixed(1)}px）`,
  Math.abs((360 - a1.last.r) - 34.3) < 3, 360 - a1.last.r)
assert(`  菜单图标中心 ${iconCenter.toFixed(2)}px 与折叠态标题行盒中心 ${titleCenter1.toFixed(2)}px 共线（差 ${Math.abs(iconCenter - titleCenter1).toFixed(2)}px ≤ 1.5）`,
  Math.abs(iconCenter - titleCenter1) <= 1.5, { iconCenter, titleCenter1 })
assert(`  菜单两态完全不动（起手 t=${a0.pill.t} vs 满程 t=${a1.pill.t}；参考图两态菜单 y 相同）`,
  a0.pill.t === a1.pill.t && a0.pill.r === a1.pill.r, { p0: a0.pill, p1: a1.pill })
assert(`  热区让位生效：.edge-cc 高 ${a1.ccH}（原 64）、.edge-nc 高 ${a1.ncH}，让位矩形 top ${a1.yieldTop} / left ${a1.yieldLeft}`,
  a1.ccH === '44px' && a1.ncH === '64px' && a1.yieldTop === '44px' && a1.yieldLeft === '199px',
  { ccH: a1.ccH, ncH: a1.ncH, yieldTop: a1.yieldTop, yieldLeft: a1.yieldLeft })
{
  const hits = await p.evaluate(() => ['[data-photos-head-list]', '[data-photos-head-select]', '[data-photos-head-settings]'].map((sel) => {
    const b = document.querySelector(sel).getBoundingClientRect()
    const x = b.left + b.width / 2
    return [0.1, 0.5, 0.9].every((fr) => {
      const h = document.elementFromPoint(x, b.top + b.height * fr)
      return !!(h && h.closest && h.closest('[data-photos-head] button'))
    })
  }))
  assert('  三颗按钮整高可点（热区让位真的生效，不是纸面规则）', hits.every(Boolean), hits)
}

/* 状态栏带遮蔽契约：底幕顶部 99% 不透明、且覆盖范围 ≥ 状态栏带高
   （逐档像素取证在 /tmp/photos/probe-statusbar-clearance.mjs + sb-diff.py：
     全档带内照片内容彩斑占比 0%；图标墨迹止于设计 y31，滚动新增墨迹起于 y34 —— 零行交叠） */
assert(`底幕起手基色 = 应用默认底色 244,245,247（实测 ${t1.scrimRGB}）`, t1.scrimRGB === '244,245,247', t1.scrimRGB)
assert(`  底幕顶部 ≥99% 不透明（实测 alpha ${t1.scrimAlpha}）`, t1.scrimAlpha >= 0.99, t1.scrimAlpha)
const opaquePct = Number(/^(\d+)%:/.exec(t1.scrimStops[1] || '')[1])
assert(`  99% 不透明区一直延伸到 ${opaquePct}% 条高 = ${(opaquePct / 100 * 118).toFixed(0)}px ≥ 状态栏带 54px`,
  opaquePct / 100 * 118 >= 54, { opaquePct, coverPx: opaquePct / 100 * 118 })
assert(`  该不透明区更要盖住折叠态菜单底缘 84.65px（${(opaquePct / 100 * 118).toFixed(1)}px ≥ 84.65）`,
  opaquePct / 100 * 118 >= 84.65, { coverPx: opaquePct / 100 * 118 })
assert('  底幕渐变末端收成全透明（不留硬边）', /:0$/.test(t1.scrimStops[t1.scrimStops.length - 1]), t1.scrimStops)

/* 跨页对账：「照片大标题的滑动跟设置大标题一致」—— 同一把尺量两页的曲线
   （设置页滚动区间 849px，取 200 已过 72px 折叠全距） */
await p.evaluate(() => window.__system.goHome())
await wait(600)
await p.evaluate(() => window.__system.openApp('settings'))
await wait(1100)
await setTopIn('.settings-app', 0)
const st0 = await readTitleIn('.settings-app')
await setTopIn('.settings-app', 'max')
const st1 = await readTitleIn('.settings-app')
assert('跨页对账 · 起手态：相册与设置逐值一致（曲线同源，非各自手调）',
  curveOf(st0) === curveOf(t0), { settings: JSON.parse(curveOf(st0)), photos: JSON.parse(curveOf(t0)) })
assert('跨页对账 · 满程：相册与设置逐值一致',
  curveOf(st1) === curveOf(t1), { settings: JSON.parse(curveOf(st1)), photos: JSON.parse(curveOf(t1)) })
assert('  设置页同样挂着 64px 手势热区之上的附件槽几何（同一通用件）',
  (await n('.settings-app [data-large-title]')) === 1, await n('.settings-app [data-large-title]'))

// 回相册并复位（后续段依赖首页起手态）
await p.evaluate(() => window.__system.goHome())
await wait(500)
await p.evaluate(() => window.__system.openApp('photos'))
await wait(900)
await waitImages()
await wait(200)
await twoFrames()
await setTopIn('.photos-app', 0)
assert('退回相册后大标题复位（字号 36px）', (await readTitleIn('.photos-app')).font === '36px')

/* ═════════════ 5. 进入全屏查看 ═════════════ */
head('全屏查看')
const firstId = await p.locator('[data-photo]').first().getAttribute('data-photo')
await tap('[data-photo]', 700)
await twoFrames()
assert('全屏层已打开', await visible('[data-photos-viewer]'))
assert('  全屏里就是刚点的那张',
  (await p.evaluate(() => document.querySelector('[data-photos-viewer-img]').getAttribute('alt'))) === firstId, firstId)
assert('  全屏层是 absolute（不是 fixed —— 否则会跑到机身边框外）',
  (await box('[data-photos-viewer]')).position === 'absolute', (await box('[data-photos-viewer]')).position)
const vBox = await box('[data-photos-viewer]')
assert('  全屏层铺满应用根（四边 0）',
  Math.abs(vBox.topFromApp) <= 1 && Math.abs(vBox.bottomFromApp) <= 1 &&
  Math.abs(vBox.leftFromApp) <= 1 && Math.abs(vBox.rightFromApp) <= 1, vBox)
assert('  日期行 = 长日期', /年.+月.+日/.test(await txt('[data-photos-viewer-date]')), await txt('[data-photos-viewer-date]'))
assert('  副行 = 时间 + 星期', /\d+:\d+\s+\S+/.test(await txt('[data-photos-viewer-time]')), await txt('[data-photos-viewer-time]'))
const stage = await box('[data-photos-viewer-stage]')
const img = await box('[data-photos-viewer-img]')
assert('  图片在舞台内居中（水平居中 ±2px）',
  Math.abs((img.right - img.w / 2) - (stage.right - stage.w / 2)) <= 2, { img, stage })
assert('  图片未溢出舞台（宽高都 ≤ 舞台）', img.w <= stage.w + 1 && img.h <= stage.h + 1, { img, stage })
/* 🔴 「图片在屏幕中上下居中」（Ricky 2026-10-12）——
   舞台必须**铺满整屏**，这样它的 flex 居中点 == 屏幕（应用根）中心。
   旧版舞台是 flex:1 子项、顶栏占 110px ⇒ 舞台盒子 y 110~788、中心 449，
   而屏幕中心是 394 ⇒ 图片被压低 55px。判据必须比「屏幕中心」而不是「舞台中心」，
   否则铺没铺满整屏都成立（舞台中心恒等于图片中心）。 */
assert('  舞台铺满整屏（四边贴应用根，不是「顶栏以下的剩余区」）',
  Math.abs(stage.topFromApp) <= 1 && Math.abs(stage.bottomFromApp) <= 1 &&
  Math.abs(stage.leftFromApp) <= 1 && Math.abs(stage.rightFromApp) <= 1, stage)
const screenCenterY = vBox.h / 2
const imgCenterY = img.topFromApp + img.h / 2
assert(`  图片在**屏幕**里上下居中（图片中心 ${imgCenterY.toFixed(1)} vs 屏幕中心 ${screenCenterY.toFixed(1)}，容差 2px）`,
  Math.abs(imgCenterY - screenCenterY) <= 2, { imgCenterY, screenCenterY })
assert(`  图片左右也居中（${(img.leftFromApp + img.w / 2).toFixed(1)} vs ${(vBox.w / 2).toFixed(1)}）`,
  Math.abs(img.leftFromApp + img.w / 2 - vBox.w / 2) <= 2)
assert('  返回键可点且在应用内', (await box('[data-photos-viewer-back]')).topFromApp >= 0)
const backBox = await box('[data-photos-viewer-back]')
assert(`  返回键中心 ${(backBox.topFromApp + backBox.h / 2).toFixed(1)}px 落 64px 热区之下`,
  backBox.topFromApp + backBox.h / 2 > 64, backBox)
assert('  操作栏 5 枚动作：share/favorite/edit/delete/more',
  JSON.stringify(await p.locator('[data-photos-action]').evaluateAll((els) => els.map((e) => e.dataset.photosAction))) ===
    JSON.stringify(['share', 'favorite', 'edit', 'delete', 'more']),
  await p.locator('[data-photos-action]').evaluateAll((els) => els.map((e) => e.dataset.photosAction)))
assert('  右下圆形按钮存在', await visible('[data-photos-viewer-scan]'))
await shot('viewer')

// chrome：进全屏（黑底）必须切白图标
const chromeViewer = await p.evaluate(() => getComputedStyle(document.querySelector('.status-bar')).color)
assert(`全屏时状态栏切白图标（chrome=light，实测 ${chromeViewer}）`, /rgb\(255,\s*255,\s*255\)/.test(chromeViewer), chromeViewer)

/* ═════════════ 6. 竖向栈不重叠 ═════════════ */
head('全屏竖向栈')
const bar = await box('[data-photos-viewer-bar]')
const scan = await box('[data-photos-viewer-scan]')
assert(`操作栏 bottom = 22px 级（与首页底栏同位，实测 ${bar.bottomFromApp}）`,
  Math.abs(bar.bottomFromApp - 22) <= 2, bar.bottomFromApp)
assert('  与首页底栏在同一水平线（±2px）', Math.abs(bar.bottomFromApp - tb.bottomFromApp) <= 2, { bar: bar.bottomFromApp, tabbar: tb.bottomFromApp })
assert(`  扫描钮骑在操作栏上方（下沿 ${scan.bottomFromApp} ≥ 操作栏上沿 ${(bar.bottomFromApp + bar.h).toFixed(1)}）`,
  scan.bottomFromApp >= bar.bottomFromApp + bar.h - 1, { scan, bar })
assert('  操作栏/扫描钮都在应用内（不越界）', bar.leftFromApp >= 0 && bar.rightFromApp >= 0 && scan.rightFromApp >= 0, { bar, scan })
await bottomClear('[data-photos-viewer-bar]', '全屏操作栏')

/* ═════════════ 6b. 点屏幕切换 chrome（沉浸态） ═════════════ */
head('点屏幕隐藏 / 显示状态栏与悬浮菜单按钮')
const chromeState = () => p.evaluate(() => {
  const op = (s) => { const el = document.querySelector(s); return el ? +getComputedStyle(el).opacity : null }
  const pe = (s) => { const el = document.querySelector(s); return el ? getComputedStyle(el).pointerEvents : null }
  const v = document.querySelector('[data-photos-viewer]')
  return {
    attr: v ? v.getAttribute('data-immersive-chrome') : null,
    statusBar: op('.status-bar'), head: op('.pv-v-head'),
    scan: op('[data-photos-viewer-scan]'), bar: op('[data-photos-viewer-bar]'),
    headPE: pe('.pv-v-head')
  }
})
let cs = await chromeState()
assert('初始：无沉浸属性，系统状态栏 + 三组浮层全部可见',
  cs.attr === null && cs.statusBar === 1 && cs.head === 1 && cs.scan === 1 && cs.bar === 1, cs)

await tap('[data-photos-viewer-stage]', 520)
cs = await chromeState()
assert('点屏幕中部 → 进入沉浸态（挂上 data-immersive-chrome）', cs.attr !== null, cs)
assert(`  系统状态栏隐藏（opacity ${cs.statusBar}）`, cs.statusBar === 0, cs.statusBar)
assert('  顶栏 / 扫描钮 / 操作栏全部隐藏（opacity 0）',
  cs.head === 0 && cs.scan === 0 && cs.bar === 0, cs)
assert('  隐藏的顶栏必须同时 pointer-events:none（否则看不见的返回键仍在吃点击）',
  cs.headPE === 'none', cs.headPE)
await shot('viewer-immersive')

await tap('[data-photos-viewer-stage]', 520)
cs = await chromeState()
assert('再点一次 → 全部恢复可见',
  cs.attr === null && cs.statusBar === 1 && cs.head === 1 && cs.scan === 1 && cs.bar === 1 && cs.headPE === 'auto', cs)

// 左右两侧仍是「上一张 / 下一张」，且**不该**顺手把 chrome 切掉（@click.stop 生效）
const srcBefore = await p.evaluate(() => document.querySelector('[data-photos-viewer-img]').getAttribute('src'))
await tap('[data-photos-viewer-next]', 520)
const srcAfter = await p.evaluate(() => document.querySelector('[data-photos-viewer-img]').getAttribute('src'))
cs = await chromeState()
assert('点右侧边缘 → 切换照片，而不是切 chrome', srcAfter !== srcBefore, { srcBefore, srcAfter })
assert('  且 chrome 没被顺手切掉（@click.stop 生效）', cs.attr === null && cs.head === 1, cs)
await tap('[data-photos-viewer-prev]', 520)
cs = await chromeState()
assert('  点左侧回到上一张，chrome 仍可见',
  (await p.evaluate(() => document.querySelector('[data-photos-viewer-img]').getAttribute('src'))) === srcBefore &&
    cs.head === 1, cs)

/* ═════════════ 7. 收藏开合 ═════════════ */
head('收藏')
const favColorBefore = await p.evaluate(() => getComputedStyle(document.querySelector('[data-photos-action="favorite"]')).color)
await tap('[data-photos-action="favorite"]', 400)
await twoFrames()
const favColorAfter = await p.evaluate(() => getComputedStyle(document.querySelector('[data-photos-action="favorite"]')).color)
assert(`收藏后红心变色（${favColorBefore} → ${favColorAfter}）`, favColorAfter !== favColorBefore, { favColorBefore, favColorAfter })
assert('  给出回执 toast', await visible('[data-photos-toast]'))
assert(`  回执文案 =「已加入收藏」（实测「${await txt('[data-photos-toast]')}」）`, (await txt('[data-photos-toast]')) === '已加入收藏')
const toastBox = await box('[data-photos-toast]')
assert(`  toast 在扫描钮之上、两者不重叠（toast 下沿 ${toastBox.bottomFromApp} ≥ 扫描钮上沿 ${(scan.bottomFromApp + scan.h).toFixed(1)}）`,
  toastBox.bottomFromApp >= scan.bottomFromApp + scan.h, { toast: toastBox, scan })
assert('  toast 是 absolute（不用 fixed）', toastBox.position === 'absolute', toastBox.position)
await shot('viewer-faved')
await tap('[data-photos-action="favorite"]', 1300)
assert('再点取消收藏 → 红心复位', (await p.evaluate(() => getComputedStyle(document.querySelector('[data-photos-action="favorite"]')).color)) === favColorBefore)
assert('  回执变「已取消收藏」', (await txt('[data-photos-toast]')) === '已取消收藏', await txt('[data-photos-toast]'))

/* ═════════════ 8. 左右切换与边界停住 ═════════════ */
head('左右切换')
const srcOf = () => p.evaluate(() => document.querySelector('[data-photos-viewer-img]').getAttribute('src'))
const s0 = await srcOf()
await tap('[data-photos-viewer-next]', 500)
const s1 = await srcOf()
assert('next → 换图', s1 !== s0, { s0, s1 })
assert('  日期行同步变化或保持合法', /年.+月.+日/.test(await txt('[data-photos-viewer-date]')))
await tap('[data-photos-viewer-prev]', 500)
assert('prev → 回到上一张', (await srcOf()) === s0, { back: await srcOf(), s0 })
// 回到第一张再 prev：应停住不循环
await p.evaluate(() => {
  const root = document.querySelector('.photos-app')
  return root
})
let guard = 0
while ((await srcOf()) !== s0 && guard++ < 12) await tap('[data-photos-viewer-prev]', 220)
await tap('[data-photos-viewer-prev]', 400)
assert('首张再 prev → 停住（图片不变，不循环到末张）', (await srcOf()) === s0, await srcOf())
assert(`  边界给回执（不是静默，实测「${await txt('[data-photos-toast]')}」）`,
  (await txt('[data-photos-toast]')) === '已经是第一张 / 最后一张了', await txt('[data-photos-toast]'))

/* ═════════════ 9. 更多面板 ═════════════ */
head('更多面板')
await tap('[data-photos-action="more"]', 500)
await twoFrames()
assert('「更多」动作面板已弹出', await visible('.action-sheet-panel'))
/* ⚠️ 量的是 `.action-sheet-backdrop`（蒙层，负责定位）—— `.action-sheet-panel` 只是它的
   flex 子元素、本来就是 static，量它得到 "static" 是假失败。 */
const backdropBox = await box('.action-sheet-backdrop')
assert('  蒙层是 absolute（不是 fixed —— 否则面板会跑到机身边框外）', backdropBox.position === 'absolute', backdropBox.position)
const sheetBox = await box('.action-sheet-panel')
assert('  面板在应用内（不越界）',
  sheetBox.leftFromApp >= -1 && sheetBox.rightFromApp >= -1 && sheetBox.bottomFromApp >= -1, sheetBox)
const moreLabels = await p.locator('.action-sheet-item').allTextContents()
assert('  4 个选项：存储到文件 / 拷贝 / 隐藏 / 照片信息',
  JSON.stringify(moreLabels) === JSON.stringify(['存储到文件', '拷贝', '隐藏', '照片信息']), moreLabels)
await shot('more-sheet')
await tap('.action-sheet-item', 400)
assert('  选「存储到文件」→ 面板关闭且给专属回执（不是一律「已分享」）',
  !(await visible('.action-sheet-panel')) && (await txt('[data-photos-toast]')) === '已存储到文件',
  { toast: await txt('[data-photos-toast]') })

/* ═════════════ 10. 删除（确认 → 张数 -1 → 退到相邻张） ═════════════ */
head('删除')
const beforeCount = await p.evaluate(() => document.querySelectorAll('[data-photo]').length)
const delId = await p.evaluate(() => {
  const el = document.querySelector('[data-photos-viewer-img]')
  return el ? el.getAttribute('alt') : null
})
await tap('[data-photos-action="delete"]', 500)
await twoFrames()
assert('删除确认面板已弹出', await visible('.action-sheet-panel'))
assert('  文案为「删除这张照片？」', (await txt('.action-sheet-title')) === '删除这张照片？', await txt('.action-sheet-title'))
const delColor = await p.evaluate(() => getComputedStyle(document.querySelector('.action-sheet-item')).color)
assert(`  删除项是红色（${delColor}）`, /255,\s*59,\s*48/.test(delColor), delColor)
await shot('delete-sheet')
await tap('.action-sheet-item', 600)
await twoFrames()
assert('确认后仍停在全屏（自动退到相邻张，不是一片黑）', await visible('[data-photos-viewer]'))
assert('  全屏里的图已不是被删那张', (await p.evaluate(() => document.querySelector('[data-photos-viewer-img]').getAttribute('alt'))) !== delId,
  { delId, now: await p.evaluate(() => document.querySelector('[data-photos-viewer-img]').getAttribute('alt')) })
assert('  回执 =「照片已删除」', (await txt('[data-photos-toast]')) === '照片已删除', await txt('[data-photos-toast]'))
await shot('after-delete')

// 返回首页核对张数与消失的 id
await tap('[data-photos-viewer-back]', 700)
await waitImages()
await twoFrames()
assert('返回键 → 回首页', !(await visible('[data-photos-viewer]')) && (await visible('[data-photos-page]')))
assert('  首页不再有被删的那张', (await n(`[data-photo="${delId}"]`)) === 0, delId)
const afterCount = await n('[data-photo]')
assert(`  总张数 ${beforeCount} → ${afterCount}`, afterCount === beforeCount - 1, { beforeCount, afterCount })
// 回执 toast 必须自己消失（1.8s 定时），否则会一直糊在首页上
let toastGone = false
for (let i = 0; i < 20; i += 1) {
  if (!(await visible('[data-photos-toast]'))) { toastGone = true; break }
  await wait(200)
}
assert('回执 toast 1.8s 后自动消失（不留残影在首页上）', toastGone)
await shot('home-after-delete')

/* ═════════════ 11. 空组收缩（删光「今天」整组） ═════════════ */
head('空组收缩')
const todayIds = await p.locator('[data-photos-day="0"] [data-photo]').evaluateAll((els) => els.map((e) => e.dataset.photo))
for (const id of todayIds) {
  const idx = await p.evaluate((d) => [...document.querySelectorAll('[data-photo]')].findIndex((e) => e.dataset.photo === d), id)
  await p.locator('[data-photo]').nth(idx).click()
  await wait(500)
  await tap('[data-photos-action="delete"]', 450)
  await tap('.action-sheet-item', 550)
  await tap('[data-photos-viewer-back]', 500)
}
await waitImages()
const titlesAfter = await p.locator('[data-photos-day-title]').allTextContents()
assert(`「今天」整组删光后该组消失（剩余 ${titlesAfter.length} 组）`, titlesAfter.length === 4 - 1 && todayIds.length > 0, { todayIds, titlesAfter })
assert('  首组变成「昨天」', titlesAfter[0] === '昨天', titlesAfter)
await twoFrames()
await shot('home-group-shrunk')

/* ═════════════ 12. 切 Tab（相册 / 发现） ═════════════ */
head('切 Tab')
await tap('[data-photos-tabbar] .floating-tab-item:nth-child(3)', 500)
assert('切「相册」→ 网格隐藏、给出占位说明',
  !(await visible('[data-photos-grid]')) && (await visible('[data-photos-empty]')),
  { grid: await n('[data-photos-grid]'), empty: await visible('[data-photos-empty]') })
await shot('tab-albums')
await tap('[data-photos-tabbar] .floating-tab-item:nth-child(4)', 500)
assert('切「发现」→ 同样给出占位说明', await visible('[data-photos-empty]'))
await tap('[data-photos-tabbar] .floating-tab-item:nth-child(2)', 500)
await waitImages()
assert('切回「照片」→ 网格回来', await visible('[data-photos-grid]'))

/* ═════════════ 13. 汇总 ═════════════ */
await wait(300)
head('汇总')
assert('全程 0 控制台报错', errors.length === 0, errors.slice(0, 4))
console.log(`\n走查 ${steps.length} 步 / 断言 ${pass + fails.length} 条 / 通过 ${pass} 条 / 失败 ${fails.length} 条 / 控制台报错 ${errors.length} 条`)
if (fails.length) console.log('失败项：\n  - ' + fails.join('\n  - '))
if (errors.length) console.log('报错：\n  - ' + errors.join('\n  - '))
console.log(`截图目录：${OUT}/photos-NN-*.png`)
await b.close()
if (fails.length || errors.length) process.exitCode = 1
