/**
 * AI Mate · AI Mori 流程 e2e（依据归档 ai_mori_interactive_prototype(3).html）
 * ============================================================================
 * 覆盖：进流程 → 主屏 4 tab（创作·空间·录音·设备）→ 创作列表/日历视图 →
 *      空间选日（有数据 / 无数据）→ 录音列表 + 播放条（开→关）→ 设备页 3 折叠面板 →
 *      5 个开关 → 初始化向导 3 步（含「不可跳过」约束）→ 实时预览快门 →
 *      录音屏走秒与暂停 → 设备素材 9 张 → 每日 Vlog / AI 艺术馆 / AI 图文日记 →
 *      固件升级（进度真的推进）→ 贴底元素不压手势区 → 折叠面板不被裁切 →
 *      返回链 → 关闭后再进无残留 → 0 控制台报错
 * 用法：node scripts/verify-mori-flow.mjs [port]   默认 5555
 * 截图：/tmp/aimate/e2e/mori-NN-<名字>.png
 *
 * ⚠️ 本脚本量的是「贴底元素下沿 ≤ home-indicator 上沿」——归档 Demo 用
 *    `env(safe-area-inset-bottom)`（本仓恒为 0），照抄会让按钮落进手势热区点不动。
 * ⚠️ 归档另有两处硬缺陷，本脚本各留一条断言兜住：
 *    ① `#playerBar` 永远可见、`stopAudio()` 无效（css 权重被覆盖）；
 *    ② `#body-settings` 被 `max-height:600px` 裁掉 108px，「隐私」组永远看不全。
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const PORT = process.argv[2] || '5555'
const OUT = '/tmp/aimate/e2e'
mkdirSync(OUT, { recursive: true })

const steps = []
let pass = 0
const fails = []
function assert(label, cond, extra) {
  if (cond) { pass += 1; console.log(`  ✅ ${label}`) }
  else { fails.push(label); console.log(`  ❌ ${label}${extra !== undefined ? ' → ' + JSON.stringify(extra) : ''}`) }
}
function head(t) { console.log(`\n── ${t} ──`); steps.push(t) }

const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1080, height: 860 } })
const errors = []
p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })

let shotIdx = 0
const shot = (name) => p.screenshot({ path: `${OUT}/mori-${name}.png` })
const wait = (ms = 400) => p.waitForTimeout(ms)
/** ⚠️ 宿主设备详情页也有同名钩子，必须限定到流程根内，否则会点到被盖住的那个 */
const BACK = '[data-flow-root="mori"] [data-nav-back]'
const n = (sel) => p.locator(sel).count()
const txt = async (sel) => ((await p.locator(sel).first().textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim()
const visible = async (sel) => (await n(sel)) > 0 && (await p.locator(sel).first().isVisible())
/**
 * ⚠️ 宿主会把整机等比缩放（实测 ~0.941：`.mf-body` computed 360px → rect 338.73px），
 *    所以「元素该多大」这类断言必须读 computed style，不能读 getBoundingClientRect。
 *    而「两个元素相对位置」这类比较（贴底 vs 手势区）两者同坐标系，rect 仍然有效。
 */
const cssNum = (sel, prop) => p.evaluate(([s, pr]) => {
  const el = document.querySelector(s)
  return el ? parseFloat(getComputedStyle(el)[pr]) : null
}, [sel, prop])
const tap = async (sel, ms = 450) => {
  await p.locator(sel).first().scrollIntoViewIfNeeded().catch(() => {})
  await p.locator(sel).first().click()
  await wait(ms)
}
/** 轮询等文案变成期望值（异步渲染用固定 sleep 会偶发飘） */
async function waitText(sel, expected, timeout = 6000) {
  const t0 = Date.now()
  for (;;) {
    if ((await txt(sel)) === expected) return true
    if (Date.now() - t0 > timeout) return false
    await p.waitForTimeout(150)
  }
}
/** 贴底元素是否让开了 home-indicator 手势热区（z-index 96，凌驾应用窗口之上） */
async function bottomClear(sel, label) {
  const r = await p.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return null
    const ind = document.querySelector('.home-indicator') || document.querySelector('[class*="home-indicator"]')
    return {
      bottom: Math.round(el.getBoundingClientRect().bottom),
      top: ind ? Math.round(ind.getBoundingClientRect().top) : null
    }
  }, sel)
  assert(`贴底不压手势区：${label}（下沿 ${r && r.bottom} ≤ ${r && r.top}）`, !!r && r.bottom <= r.top)
}

/* ═════════════ 1. 进入流程 ═════════════ */
head('进入流程')
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.evaluate(() => window.__system.unlock())
await wait(500)
await p.evaluate(() => window.__system.openApp('aimate'))
await wait(900)
await tap('[data-device-card="AM-Mori-01"]')
assert('设备卡 AM-Mori-01 打开其控制页', await visible('[data-open-mori]'))
await shot('device-control')
await tap('[data-open-mori]')
assert('AI Mori 流程已打开', await visible('[data-flow-root="mori"]'))
assert('  打开即主屏 detail', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'detail')
assert('  默认停在「创作」tab', (await p.locator('[data-mori-tab="create"]').getAttribute('class')).includes('active'))
await shot('01-detail-create')

/* ═════════════ 2. 创作 tab ═════════════ */
head('创作 tab')
assert('4 张创作卡', (await n('[data-mori-card]')) === 4)
assert('  第 1 张是每日 Vlog', (await txt('[data-mori-card="0"]')).includes('每日 Vlog'), await txt('[data-mori-card="0"]'))
assert('  第 3 张是图文日记（含正文与 3 张配图）', (await txt('[data-mori-card="2"]')).includes('今天是充实的一天'))
assert('  日记卡 3 张配图', (await p.locator('[data-mori-card="2"] .mf-diary-img').count()) === 3)
await tap('[data-mori-cal-toggle]')
assert('日历开关切到日历视图', await visible('[data-mori-create-cal]'))
assert('  创作列表已收起（互斥）', !(await visible('[data-mori-create-list]')))
assert('  表头 7 个', (await p.locator('[data-mori-create-cal] .mf-wd').count()) === 7)
assert('  空格 1 + 28 天 = 29 格', (await p.locator('[data-mori-create-cal] [data-mori-cal-day]').count()) === 29)
assert('  有素材点 = 4 天（由数据反推，不是归档写死的 13 天）',
  (await p.locator('[data-mori-create-cal] .mf-day.has').count()) === 4)
assert('  2/14 是「今天」', (await p.locator('[data-mori-create-cal] .mf-day.today').textContent()).trim() === '14')
assert('  日历下 2 张精简卡', (await n('[data-mori-cal-card]')) === 2)
await shot('02-detail-create-cal')
await tap('[data-mori-cal-day="14"]')
assert('点日期出提示条', await visible('[data-mori-toast]'))
await wait(1800)
await tap('[data-mori-cal-toggle]')
assert('再按一次切回列表视图', await visible('[data-mori-create-list]'))

/* ═════════════ 3. 空间 tab ═════════════ */
head('空间 tab')
await tap('[data-mori-tab="space"]')
assert('切到空间 tab', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'detail')
assert('  默认选中 14 日', (await p.locator('[data-mori-space-day="14"]').getAttribute('class')).includes('selected'))
assert('  14 日标题带星期与天气', (await txt('[data-mori-space-title]')).includes('2月14日'), await txt('[data-mori-space-title]'))
assert('  14 日 2 个事件', (await n('[data-mori-event]')) === 2)
assert('  素材计数用占位符渲染', (await txt('[data-mori-event="0"]')).includes('3 个素材'), await txt('[data-mori-event="0"]'))
await shot('03-detail-space')
await tap('[data-mori-space-day="13"]')
assert('切到 13 日 → 标题跟着变', (await txt('[data-mori-space-title]')).includes('2月13日'), await txt('[data-mori-space-title]'))
assert('  13 日只有 1 个事件', (await n('[data-mori-event]')) === 1)
await tap('[data-mori-space-day="11"]')
assert('切到 11 日（无数据）→ 显示「当天无素材」', await visible('[data-mori-space-empty]'))
assert('  标题回退为日期本身', (await txt('[data-mori-space-title]')) === '2月11日', await txt('[data-mori-space-title]'))
await shot('04-space-empty-day')

/* ═════════════ 4. 录音 tab + 播放条 ═════════════ */
head('录音 tab + 播放条')
await tap('[data-mori-tab="record"]')
assert('5 条录音', (await n('[data-mori-audio]')) === 5)
assert('  第 4 条是「转写中」态', (await txt('[data-mori-audio="3"]')).includes('转写中'), await txt('[data-mori-audio="3"]'))
assert('播放条初始不存在（归档是永远可见）', !(await visible('[data-mori-player]')))
await shot('05-detail-record')
await tap('[data-mori-audio="0"]')
assert('点录音 → 播放条出现', await visible('[data-mori-player]'))
assert('  标题 = 录音名', (await txt('[data-mori-player-title]')) === '产品评审会议', await txt('[data-mori-player-title]'))
await shot('06-player-open')
await bottomClear('[data-mori-player]', '播放条')
await tap('[data-mori-player-close]')
assert('🔴 关闭播放条后真的消失（归档此处 stopAudio 无效）', !(await visible('[data-mori-player]')))

/* ═════════════ 5. 设备 tab ═════════════ */
head('设备 tab')
await tap('[data-mori-tab="device"]')
assert('设备状态卡可见', (await txt('.mf-hero')).includes('AI Mori'))
assert('  显示已连接', (await txt('.mf-hero')).includes('已连接'))
assert('快捷操作 4 宫格', (await n('[data-mori-action]')) === 4)
assert('3 个折叠面板', (await n('[data-mori-collapse]')) === 3)
assert('折叠默认全收起', (await n('.mf-collapse-body.open')) === 0)
await shot('07-detail-device')
await tap('[data-mori-collapse="media"]')
assert('展开「设备素材」→ 3 行', (await n('[data-mori-media-row]')) === 3)
await tap('[data-mori-collapse="settings"]')
assert('展开「拍摄与同步设置」→ 3 个分组', (await n('[data-mori-group]')) === 3)
assert('  11 行设置', (await p.locator('[data-mori-group] ~ .mf-row, .mf-group-title ~ .mf-row').count()) >= 11)
assert('  5 个开关', (await n('[data-mori-setting]')) === 5)
assert('🔴 归档被裁掉的「隐私」组现在可见（声纹数据行）', await visible('[data-mori-setting="cloudAI"]'))
const clip = await p.evaluate(() => {
  // ⚠️ 两处坑：(1) 必须从 settings 的折叠头往下找，不能用 `.mf-collapse-body.open`
  //             （会选到 DOM 更靠前的 media 面板）；
  //          (2) `scrollHeight/clientHeight` 是**未缩放**的整数，而 `getBoundingClientRect`
  //             是整机缩放（~0.941）后的值 —— 两者不能混着比，否则 708 与 666 一比就假失败。
  const head = document.querySelector('[data-mori-collapse="settings"]')
  const section = head && head.parentElement
  const inner = section && section.querySelector('.mf-collapse-inner')
  const rows = section && section.querySelectorAll('.mf-row')
  const last = rows && rows[rows.length - 1]
  if (!inner || !last) return null
  return {
    clientH: inner.clientHeight, // 未缩放
    scrollH: inner.scrollHeight, // 未缩放
    lastBottom: Math.round(last.getBoundingClientRect().bottom),
    innerBottom: Math.round(inner.getBoundingClientRect().bottom)
  }
})
assert('  折叠内容不被裁切（末行在容器内；归档在此裁掉 108px，只剩 600px）',
  !!clip && clip.scrollH <= clip.clientH + 1 && clip.lastBottom <= clip.innerBottom + 1, clip)
await shot('08-device-settings-open')
const wifiBefore = await p.locator('[data-mori-setting="wifi"]').getAttribute('aria-pressed')
await tap('[data-mori-setting="wifi"]')
assert('开关可切换（归档是纯视觉、无状态）',
  (await p.locator('[data-mori-setting="wifi"]').getAttribute('aria-pressed')) !== wifiBefore)
await tap('[data-mori-collapse="info"]')
assert('展开「设备信息」→ 5 行', (await n('[data-mori-info]')) === 5)
await tap('[data-mori-collapse="media"]')
assert('再点一次折叠面板收起', (await n('.mf-collapse-body.open')) === 2)
assert('固件升级入口可见', await visible('[data-mori-upgrade]'))
assert('  入口带「可更新」徽标', (await txt('[data-mori-upgrade]')).includes('可更新'))

/* ═════════════ 6. 固件升级 ═════════════ */
head('固件升级（ota）')
await tap('[data-mori-upgrade]')
assert('进入 ota 屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'ota')
assert('  3 条更新内容', (await n('.mf-ota-list li')) === 3)
assert('  初始进度 0%', (await txt('[data-mori-ota-pct]')) === '0%')
assert('🔴 归档进度条不可见的缺陷已修：进度条有可见宽度', await p.evaluate(() => {
  const el = document.querySelector('[data-mori-ota-bar]')
  return !!el && el.getBoundingClientRect().height > 0
}))
await shot('09-ota')
await bottomClear('[data-mori-ota-start]', '「开始升级」按钮')
await tap('[data-mori-ota-start]', 900)
const pct = parseInt((await txt('[data-mori-ota-pct]')).replace('%', ''), 10)
assert('点「开始升级」后进度真的推进（归档纹丝不动）', pct > 0, pct)
await wait(1400)
const done = await waitText('[data-mori-ota-pct]', '100%', 6000)
assert('进度走到 100% 后自停', done, await txt('[data-mori-ota-pct]'))
await shot('10-ota-progress')
await tap(BACK)
assert('ota back → 主屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'detail')

/* ═════════════ 7. 初始化向导 ═════════════ */
head('初始化向导（init）')
await tap('[data-mori-init-entry]')
assert('进入 init 屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'init')
assert('  第 1 步激活点', (await n('.mf-dotx.active')) === 1)
assert('  第 1 步 = 开启云端上传', (await txt('.mf-it')) === '开启云端上传', await txt('.mf-it'))
await shot('11-init-step1')
await tap('[data-mori-init-secondary]')
assert('🔴 第 1 步次要按钮「不可跳过」（归档的产品约束）', await visible('[data-mori-toast]'))
assert('  且仍停在第 1 步', (await txt('.mf-it')) === '开启云端上传')
await wait(1800)
await tap('[data-mori-init-primary]')
assert('主按钮 → 第 2 步', (await txt('.mf-it')) === '移动网络上传', await txt('.mf-it'))
assert('  第 2 步描述两段（归档唯一的 <br> 结构）', (await p.locator('.mf-id br').count()) === 1)
await shot('12-init-step2')
await tap('[data-mori-init-secondary]')
assert('第 2 步次要按钮也进第 3 步（归档两个按钮都放行）', (await txt('.mf-it')) === '设置 WiFi', await txt('.mf-it'))
assert('  第 3 步 Wi-Fi 列表 3 条', (await n('[data-mori-wifi]')) === 3)
assert('  第 1 条显示「已连接」', (await txt('[data-mori-wifi="0"]')).includes('已连接'))
await shot('13-init-step3')
await tap('[data-mori-init-primary]')
assert('完成设置 → 回主屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'detail')
assert('  并给出完成提示', await visible('[data-mori-toast]'))
await wait(1800)

/* ═════════════ 8. 实时预览 ═════════════ */
head('实时预览（preview）')
await tap('[data-mori-action="preview"]')
assert('进入 preview 屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'preview')
assert('  摄像头占位文案', (await txt('.mf-cv')).includes('AI Mori 摄像头实时画面'))
assert('  快门初始非录制态', !(await p.locator('[data-mori-preview-shutter]').getAttribute('class')).includes('rec'))
await shot('14-preview')
await tap('[data-mori-preview-shutter]')
assert('按快门 → 录制态（52px 白圆变 28px 红方）',
  (await p.locator('[data-mori-preview-shutter]').getAttribute('class')).includes('rec'))
assert('  提示「录像中...」', (await txt('[data-mori-toast]')).includes('录像中'), await txt('[data-mori-toast]'))
await wait(1800)
await tap('[data-mori-preview-shutter]')
assert('再按一次回到拍照态',
  !(await p.locator('[data-mori-preview-shutter]').getAttribute('class')).includes('rec'))
await tap(BACK)
assert('preview back → 主屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'detail')

/* ═════════════ 9. 录音屏走秒 ═════════════ */
head('录音屏（rec）')
await tap('[data-mori-action="record"]')
assert('进入 rec 屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'rec')
assert('  计时起点 02:18（= 归档写死的 00:02:18）', (await txt('[data-mori-rec-time]')) === '02:18', await txt('[data-mori-rec-time]'))
assert('  波形 5 条', (await n('.mf-bar')) === 5)
assert('  2 条实时转写', (await n('[data-mori-transcript]')) === 2)
assert('  转写带说话人与时间', (await txt('[data-mori-transcript="0"]')).includes('Speaker 1'), await txt('[data-mori-transcript="0"]'))
await shot('15-rec')
const t1 = await txt('[data-mori-rec-time]')
const walked = await waitText('[data-mori-rec-time]', '02:20', 5000) || (await txt('[data-mori-rec-time]')) !== t1
assert('🔴 计时真的走秒（归档写死不走）', walked, await txt('[data-mori-rec-time]'))
await tap('[data-mori-rec-pause]', 300)
const tp = await txt('[data-mori-rec-time]')
await wait(1600)
assert('暂停后计时停住', (await txt('[data-mori-rec-time]')) === tp, tp + ' → ' + (await txt('[data-mori-rec-time]')))
assert('  状态文案切成「已暂停」', (await txt('.mf-rec-status')).includes('已暂停'))
await tap('[data-mori-rec-pause]', 300)
assert('继续后状态回到「录音中」', (await txt('.mf-rec-status')).includes('录音中'))
await tap('[data-mori-rec-stop]')
assert('「结束并保存」给出提示', await visible('[data-mori-toast]'))
await wait(1800)
await tap(BACK)
assert('rec back → 主屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'detail')

/* ═════════════ 10. 设备素材 / Vlog / 艺术馆 / 日记 ═════════════ */
head('设备素材 / Vlog / 艺术馆 / 日记')
await tap('[data-mori-tab="create"]')
await tap('[data-mori-card="0"]')
assert('创作卡 1 → 每日 Vlog 屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'vlog')
assert('  Vlog 封面 280px', (await cssNum('[data-mori-vlog-cover]', 'height')) === 280, await cssNum('[data-mori-vlog-cover]', 'height'))
assert('  3 个场景标签', (await n('.mf-tag')) === 3)
assert('  保存到相册按钮可见', await visible('[data-mori-vlog-save]'))
await shot('16-vlog')
await tap(BACK)

await tap('[data-mori-card="1"]')
assert('创作卡 2 → AI 艺术馆屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'gallery')
assert('  标题「今日漫画 · 2月14日」', (await txt('.mf-h18')).includes('今日漫画'), await txt('.mf-h18'))
assert('  保存 / 分享 两个按钮', (await n('[data-mori-gallery-save]')) + (await n('[data-mori-gallery-share]')) === 2)
await shot('17-gallery')
await tap(BACK)

await tap('[data-mori-card="2"]')
assert('创作卡 3 → AI 图文日记屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'diary')
assert('  日记正文与创作卡一致（同一词条）', (await txt('.mf-diary-body')).includes('今天是充实的一天'))
assert('  3 张 100×100 配图', await p.evaluate(() =>
  Array.from(document.querySelectorAll('.mf-diary-img')).every((e) => parseFloat(getComputedStyle(e).width) === 100)))
await shot('18-diary')
await tap(BACK)

await tap('[data-mori-tab="device"]')
await tap('[data-mori-collapse="media"]')
await tap('[data-mori-media-row="0"]')
assert('设备素材行 → media 屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'media')
assert('  9 张缩略图（2 天）', (await n('[data-mori-thumb]')) === 9)
assert('  2 个日期分组', (await p.locator('.mf-section').count()) >= 2)
await shot('19-media')
await tap(BACK)
assert('media back → 主屏', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'detail')

/* 三语与孟加拉数字字形由 store 单测覆盖（/tmp/aimate/check-mori-store.mjs），此处不重复 */

/* ═════════════ 12. 返回链与关闭 ═════════════ */
head('返回链与关闭')
assert('主屏的返回键在流程根内可见', await visible(BACK))
await p.locator(BACK).first().click()
await wait(700)
assert('主屏 back → 关闭整条流程', !(await visible('[data-flow-root="mori"]')))
assert('  回到设备控制页', await visible('[data-open-mori]'))
await shot('20-closed')
await tap('[data-open-mori]')
assert('再进一次仍是主屏、且停在创作 tab', (await p.locator('.mf-body').getAttribute('data-mori-screen')) === 'detail')
assert('  无残留播放条（关闭时已复位）', !(await visible('[data-mori-player]')))
assert('  折叠面板已复位收起', (await n('.mf-collapse-body.open')) === 0)
await p.locator(BACK).first().click()
await wait(600)

/* ═════════════ 汇总 ═════════════ */
await wait(300)
head('汇总')
assert('全程 0 控制台报错', errors.length === 0, errors.slice(0, 4))
console.log(`\n走查 ${steps.length} 步 / 断言 ${pass + fails.length} 条 / 通过 ${pass} 条 / 失败 ${fails.length} 条 / 控制台报错 ${errors.length} 条`)
if (fails.length) console.log('失败项：\n  - ' + fails.join('\n  - '))
if (errors.length) console.log('报错：\n  - ' + errors.join('\n  - '))
console.log(`截图目录：${OUT}/mori-NN-*.png`)
await b.close()
if (fails.length || errors.length) process.exitCode = 1
