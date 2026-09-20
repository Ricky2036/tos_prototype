/* 音量玻璃「透过率」回归探针（2026-09-20，同日修订判据）
 *
 * 为什么必须用像素：`getComputedStyle` 只给得到「半透明白 α」这种**声明值**，
 * 给不到合成后屏上真正的颜色。玻璃是半透明的：
 *   最终颜色 = α·白 + (1 − α)·(被 backdrop-filter 处理过的背景)
 * 所以只有量像素才能证明它是不是一块**透明毛玻璃**。
 *
 * ⚠️ 判据在 2026-09-20 当天修订过一次，别改回去：
 *   旧判据「玻璃 chroma ≤ 32（够白）」是**错的** —— 低 chroma 既可能是「不透明」，
 *   也可能是「透明、但背景本来就是灰的」，这个数**区分不出来**。
 *   照着旧判据调出来的 `saturate(20%)` 把背景颜色杀掉 ~80% ⇒ 面板退化成一块平灰 ⇒
 *   用户直接读作「你把音量面板改成不透明的了」。
 *   新判据 = **背景彩度保留率** `chroma_玻璃 / chroma_紧邻背景`，必须落在 [RET_MIN, RET_MAX]。
 *   仪器定义：luma = 0.2126R + 0.7152G + 0.0722B；chroma = max(R,G,B) − min(R,G,B)
 *   线性混色下 chroma_玻璃 ≈ (1 − α) × saturate系数 × chroma_背景
 *
 * ⚠️ 三条踩过的坑，改这个脚本时别踩回去：
 *  1. 裁剪框必须**覆盖全部采样点**。只按玻璃点开一个 28px 的小窗，背景点会落到窗外 ⇒
 *     读到的是被钳制后的同一像素 ⇒「玻璃 == 背景」的假数据（而且看起来还挺"白"）。
 *  2. 每个点都要有**屏内守卫**：某个面没打开时元素的 rect 仍然存在（被幕布盖住），
 *     直接采会采到幕布而不是玻璃。
 *  3. `.cc-vslider` 的 backdrop-filter 是**死的**（祖先 `will-change` 建了 backdrop root，
 *     见 ControlCenter.vue 注释）⇒ 它的 saturate 完全不起作用，只能靠 α 压紫色。
 *     本脚本的 cc 段会顺带量一次「改 saturate 前后像素是否变化」，把这个事实钉住。
 *
 * 用法: node scripts/probe-volume-glass.mjs [port]
 *   OUT_DIR=<目录>  截图与数据的输出目录（默认 /tmp/vwork/volume-glass）
 *   RET_MIN / RET_MAX  透过率断言区间（默认 0.15 / 0.90）
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'

const PORT = process.argv[2] || '5555'
const URL = `http://127.0.0.1:${PORT}/`
const OUT = process.env.OUT_DIR || '/tmp/vwork/volume-glass'
/* ⚠️ 原来的 CHROMA_MAX（旧「白度」判据阈值）已删除 —— 新判据见下方「透过率判定」注释块。 */
/* 新判据的参数（**放模块作用域**，末尾汇总行要用） */
const RET_MIN = Number(process.env.RET_MIN || 0.15)   // 背景彩度保留率下限：再低就是「不透明」
const RET_MAX = Number(process.env.RET_MAX || 0.90)   // 上限：再高就是「纯透明、没有霜面」
const BG_MIN = 15        // 背景本身不够彩时比值没意义（非空性守卫）
const CHROMA_MIN = 15    // 小面积玻璃的弱判据：自身 chroma 低于此说明背景色被吃光（≈不透明）

const CHROME =
  process.env.PLAYWRIGHT_CHROME ||
  '/Users/jingzhan.chen/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME })
/* deviceScaleFactor 固定 1：截图像素 = CSS 像素，采样点可直接用 */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('  [pageerror]', e.message))

const pass = []
const fail = []
const ok = (cond, msg) => (cond ? pass : fail).push(msg)

async function boot() {
  await page.goto(URL, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.evaluate(() => window.__system.unlock())
  await page.waitForTimeout(520)
}

/* 采样点写成数据：{fx}=rect.width 比例；{px}=固定像素。
   glass=true 的点参与「够不够白」的断言；背景点只做参考。 */
const SHOTS = {
  'a-side-overlay': {
    open: async () => {
      await boot()
      await page.evaluate(() => { window.__control.setVolume(0.25); window.__control.closeSideVolume() })
      await page.waitForTimeout(160)
      await page.click('.side-btn.volume-up')
      await page.waitForTimeout(340)
    },
    points: [
      { name: '侧栏音量条·玻璃', sel: '.sv-track', dx: { fx: 0.5 }, dy: { px: 62 }, glass: true },
      { name: '侧栏音量条·紧邻壁纸', sel: '.sv-track', dx: { px: -7 }, dy: { px: 62 } },
    ],
  },
  'b-side-modal': {
    open: async () => {
      await boot()
      await page.evaluate(() => { window.__control.setVolume(0.25); window.__control.closeSideVolume() })
      await page.waitForTimeout(160)
      await page.click('.side-btn.volume-up')
      await page.waitForTimeout(340)
      await page.evaluate(() => window.__control.openSideVolumePanel('panel'))
      await page.waitForTimeout(480)
    },
    points: [
      { name: '面板大滑块·玻璃', sel: '.sv-large-track', dx: { fx: 0.5 }, dy: { px: 14 }, glass: true },
      { name: '面板卡片·玻璃', sel: '.sv-modal', dx: { fx: 0.16 }, dy: { fx: 0.06 }, glass: true },
      { name: '面板卡片·紧邻壁纸', sel: '.sv-modal', dx: { px: -6 }, dy: { px: 8 } },
    ],
  },
  'c-cc-sliders': {
    open: async () => {
      await boot()
      await page.click('.edge-cc')
      await page.waitForFunction(() => window.__system.overlays.controlCenter.status === 'open', null, { timeout: 5000 })
      await page.waitForTimeout(480)
    },
    points: [
      { name: 'CC 音量条·玻璃', sel: '.cc-volume-slider', dx: { fx: 0.5 }, dy: { px: 8 }, glass: true },
      { name: 'CC 音量条·紧邻背景', sel: '.cc-volume-slider', dx: { px: -7 }, dy: { px: 8 } },
      { name: 'CC 邻格圆钮·参照', sel: '.gb-wrap', dx: { fx: 0.5 }, dy: { px: 5 }, nth: 3 },
    ],
  },
  'd-fullscreen-panel': {
    open: async () => {
      await boot()
      await page.evaluate(() => { window.__control.setVolume(0.3); window.__control.openVolumePanel() })
      await page.waitForTimeout(800)
    },
    points: [
      { name: '全屏大条·玻璃', sel: '.vp-slider', dx: { fx: 0.5 }, dy: { px: 20 }, glass: true },
      { name: '全屏大条·紧邻幕布', sel: '.vp-slider', dx: { px: -22 }, dy: { px: 20 } },
    ],
  },
}

/** 解析出每个点的屏幕绝对坐标 + 该元素最后一条后代 z 序信息 */
const locate = (points) => page.evaluate((points) => {
  const screen = document.querySelector('.screen').getBoundingClientRect()
  const inScreen = (x, y) =>
    x >= screen.x + 1 && x <= screen.x + screen.width - 1 &&
    y >= screen.y + 1 && y <= screen.y + screen.height - 1
  const off = (o, size) => (o.fx !== undefined ? size * o.fx : o.px)
  return points.map((p) => {
    const el = [...document.querySelectorAll(p.sel)][p.nth || 0]
    if (!el) return { name: p.name, glass: !!p.glass, missing: true }
    const r = el.getBoundingClientRect()
    const x = Math.round(r.x + off(p.dx, r.width))
    const y = Math.round(r.y + off(p.dy, r.height))
    return { name: p.name, glass: !!p.glass, x, y, inScreen: inScreen(x, y) }
  })
}, points)

/** 截图 → 页内 canvas 解码 → 逐点取色（自测量，不需要外部依赖） */
async function shoot(name, pts) {
  const live = pts.filter((p) => !p.missing && p.inScreen)
  ok(live.length > 0, `${name}: 至少有一个屏内采样点（非空性守卫）`)
  if (!live.length) return []
  const xs = live.map((p) => p.x)
  const ys = live.map((p) => p.y)
  const PAD = 12
  const clip = {
    x: Math.max(0, Math.min(...xs) - PAD),
    y: Math.max(0, Math.min(...ys) - PAD),
    width: 0,
    height: 0,
  }
  clip.width = Math.min(1440 - clip.x, Math.max(...xs) + PAD - clip.x)
  clip.height = Math.min(960 - clip.y, Math.max(...ys) + PAD - clip.y)

  const buf = await page.screenshot({ path: `${OUT}/${name}.png`, clip })
  const b64 = buf.toString('base64')
  const read = await page.evaluate(async ({ b64, pts, clip }) => {
    const img = new Image()
    img.src = 'data:image/png;base64,' + b64
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const g = c.getContext('2d', { willReadFrequently: true })
    g.drawImage(img, 0, 0)
    const s = img.width / clip.width
    return pts.map((p) => {
      const px = Math.round((p.x - clip.x) * s)
      const py = Math.round((p.y - clip.y) * s)
      if (px < 0 || py < 0 || px >= img.width || py >= img.height) return { ...p, outside: true }
      const d = g.getImageData(px, py, 1, 1).data
      const [r, gg, b] = d
      return {
        ...p, r, g: gg, b,
        luma: +(0.2126 * r + 0.7152 * gg + 0.0722 * b).toFixed(1),
        chroma: Math.max(r, gg, b) - Math.min(r, gg, b),
      }
    })
  }, { b64, pts: live, clip })
  return { clip, points: read }
}

const report = []
for (const [name, cfg] of Object.entries(SHOTS)) {
  console.log(`\n=== ${name} ===`)
  await cfg.open()
  const pts = await locate(cfg.points)
  const res = await shoot(name, pts)
  if (!res) continue
  console.log(`  clip=${JSON.stringify(res.clip)}`)
  for (const p of res.points) {
    const tag = p.glass ? '【玻璃】' : '【背景】'
    console.log(`  ${tag} ${p.name.padEnd(20)} (${String(p.r).padStart(3)},${String(p.g).padStart(3)},${String(p.b).padStart(3)})  luma=${String(p.luma).padStart(5)}  chroma=${String(p.chroma).padStart(3)}`)
  }

  /* ---- 【透过率判定】改判「背景还剩多少」，不再判「够不够白】 ----
     ⚠️ 这里**曾经**判的是 `chroma_玻璃 ≤ 32`，理由是「毛玻璃应该是白的」。那是错的：
     低 chroma 既可能是「不透明」，也可能是「透明、但背景本来就是灰的」——**这个判据区分不出来**。
     照着它优化出来的 `saturate(20%)` 把背景颜色杀掉 ~80% ⇒ 面板变成一块平灰 ⇒ 用户读作「不透明」。
     正确判据 = 背景彩度保留率：`chroma_玻璃 / chroma_紧邻背景 ≈ (1 − α) × saturate 系数`
        比值 → 0  ：不透明（背景色被吃光）
        比值 → 1  ：纯透明（没有霜面）
     只对「侧栏音量」两个面下判据（Ricky 指的就是这两个）；CC / 全屏面板的紧邻点不是**原始**背景
     （是幕布或面板自身），比值没有意义，只留读数。 */
  /* 判据分两档 —— 面板用**比值**，胶囊只能用**弱判据**：
     · b-side-modal（面板，面积大）→ 比值可靠，用 [RET_MIN, RET_MAX]。
     · a-side-overlay（44.7px 胶囊）→ 只判「玻璃自身还看得出颜色」。
       原因：dpr1 下 `-7px` 的**单像素**基准不可信（壁纸局部变化比 7px 还快：实测基准 chroma 33
       而胶囊自身 45 ⇒ 比值 1.36 是假数据）。弱判据同样抓得住这次的 bug ——
       旧 `saturate(20%)` 时胶囊 chroma = 14 < CHROMA_MIN。
     · c-cc-sliders / d-fullscreen-panel → 只记读数：它们的「紧邻点」不是**原始**背景
       （是幕布或面板自身），比值没有意义。 */
  if (name === 'b-side-modal') {
    const bg = res.points.find((p) => !p.glass)
    for (const p of res.points.filter((q) => q.glass)) {
      if (!bg || bg.chroma < BG_MIN) {
        ok(false, `${name} / ${p.name}: 配不到饱和的紧邻背景点`
          + `（bg chroma=${bg ? bg.chroma : '缺失'}，需 ≥ ${BG_MIN}）⇒ 判据不可用`)
        continue
      }
      const ratio = p.chroma / bg.chroma
      console.log(`  [透过率] ${p.name} → ${ratio.toFixed(3)}`
        + `  (玻璃 ${p.chroma} / 背景 ${bg.chroma})`)
      ok(ratio >= RET_MIN && ratio <= RET_MAX,
        `${name} / ${p.name}: 背景彩度保留 ${ratio.toFixed(3)} ∈ [${RET_MIN}, ${RET_MAX}]（透明毛玻璃）`)
    }
  }
  if (name === 'a-side-overlay') {
    const g = res.points.find((p) => p.glass)
    if (g) {
      console.log(`  [弱判据] 胶囊自身 chroma = ${g.chroma}（需 ≥ ${CHROMA_MIN}：背景色没被吃光）`)
      ok(g.chroma >= CHROMA_MIN,
        `${name} / ${g.name}: 玻璃自身 chroma ${g.chroma} ≥ ${CHROMA_MIN}`
        + `（背景色没被吃光 ⇒ 是透明毛玻璃而非不透明）`)
    }
  }
  report.push({ name, clip: res.clip, points: res.points })

  /* cc 段附加：钉住「backdrop-filter 死掉」这个事实 */
  if (name === 'c-cc-sliders') {
    const g = res.points.find((p) => p.glass)
    await page.evaluate(() => document.documentElement.style.setProperty('--glass-white-blur', 'blur(30px) saturate(0%)'))
    await page.waitForTimeout(200)
    const res2 = await shoot(`${name}-sat0`, (await locate(cfg.points)).filter((p) => !p.missing && p.inScreen))
    const g2 = res2 && res2.points.find((p) => p.name === g.name)
    const delta = g2 ? Math.abs(g2.r - g.r) + Math.abs(g2.g - g.g) + Math.abs(g2.b - g.b) : -1
    console.log(`  [档案] saturate 200%→0% 后 CC 音量条像素变化 Δ=${delta}（0 = backdrop-filter 确实不生效）`)
    await page.evaluate(() => document.documentElement.style.removeProperty('--glass-white-blur'))
  }
}

writeFileSync(`${OUT}/shots.json`, JSON.stringify(report, null, 2))
console.log('\n' + '='.repeat(66))
console.log(`PASS ${pass.length} / FAIL ${fail.length}    判据：侧栏音量「背景彩度保留率」∈ [${RET_MIN ?? 0.15}, ${RET_MAX ?? 0.90}]`)
if (fail.length) fail.forEach((f) => console.log('  ✗ ' + f))
console.log(`截图与数据 → ${OUT}/shots.json`)
await browser.close()
process.exit(fail.length ? 1 : 0)
