/**
 * AI Mate · 录音充电宝流程 e2e（依据归档 ai-mate-recording-powerbank-demo.html）
 * ============================================================================
 * 覆盖：进流程 → 全部录音（搜索 / 批量管理）→ 录音详情（音频·转写·AI 纪要 三 tab）
 *      → 录音 sheet（录制/暂停/继续/实时转写/实时翻译/完成）→ AI 处理（转写·翻译）
 *      → 听译（换语言 / 暂停继续）→ 面对面翻译 → 录音同步（Wi-Fi / 蓝牙）
 *      → 贴底元素不压手势区 → 关闭后无残留（再进一次只有单条字幕流）→ 返回链
 * 用法：node scripts/verify-recorder-flow.mjs [port]   默认 5555
 * 截图：/tmp/aimate/e2e/rec-NN-<名字>.png
 *
 * ⚠️ 本脚本量的是「贴底元素下沿 ≤ home-indicator 上沿」——归档 Demo 用
 *    `env(safe-area-inset-bottom)`（本仓恒为 0），照抄会让按钮落进手势热区点不动。
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

const shot = (name) => p.screenshot({ path: `${OUT}/rec-${name}.png` })
// ⚠️ 主 App 的设备详情页也有一个 [data-nav-back]（在流程之下），必须限定到流程根内，否则 .first() 会选到被盖住的那个
const BACK = '[data-flow-root="recorder"] [data-nav-back]'
const txt = async (sel) => ((await p.locator(sel).first().textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim()
const raw = async (sel) => ((await p.locator(sel).first().textContent().catch(() => '')) || '')
const n = (sel) => p.locator(sel).count()
const visible = async (sel) => (await n(sel)) > 0 && (await p.locator(sel).first().isVisible())
async function click(sel, label) {
  try { await p.locator(sel).first().click({ timeout: 5000 }); return true }
  catch (e) { assert(`可点击：${label} (${sel})`, false, String(e.message).split('\n')[0].slice(0, 90)); return false }
}
const wait = (ms = 400) => p.waitForTimeout(ms)
/**
 * 轮询等某个选择器的文案变成期望值。
 * ⚠️ 「录完 → 新录音出现在队首」是异步落库，用固定 sleep 断言会偶发飘
 *（实测：紧跟其它 e2e 之后跑、Vite 还在冷编译时最容易出现）。
 */
async function waitText(sel, expected, timeout = 6000) {
  const t0 = Date.now()
  for (;;) {
    if ((await txt(sel)) === expected) return true
    if (Date.now() - t0 > timeout) return false
    await p.waitForTimeout(150)
  }
}
// 🔴 本仓坑：home-indicator 的 z-index 是 96，凌驾应用窗口之上。
// 所有贴底元素都必须用 padding-bottom: calc(Npx + var(--home-indicator-zone)) 让开它，
// 这里逐屏量「元素下沿」是否 ≤「手势区上沿」
const indicatorTop = () => p.evaluate(() => {
  const el = document.querySelector('.home-indicator') || document.querySelector('[class*="home-indicator"]')
  return el ? Math.round(el.getBoundingClientRect().top) : null
})
async function aboveIndicator(sel, label) {
  const r = await p.evaluate((s) => {
    const el = document.querySelector(s)
    return el ? Math.round(el.getBoundingClientRect().bottom) : null
  }, sel)
  const top = await indicatorTop()
  assert(`贴底不压手势区：${label}（下沿 ${r} ≤ ${top}）`, r !== null && top !== null && r <= top)
}
// 底部 sheet 一旦内容超过 max-height 就会可滚；Playwright 点下半部分的按钮时会把它滚到底，
// 截图前把 sheet 归位到顶部，否则画面里标题被切掉（看着像 bug，其实是「需要滚动」的正常态）
const sheetTop = () => p.evaluate(() => {
  document.querySelectorAll('.rf-sheet').forEach((s) => { s.scrollTop = 0 })
})

await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.evaluate(() => window.__system.unlock())
await wait(500)
await p.evaluate(() => window.__system.openApp('aimate'))
await wait(900)

head('0. 从设备卡直达流程')
assert('设备卡存在', await visible('[data-device-card="AM-Recorder-01"]'))
await click('[data-device-card="AM-Recorder-01"]', '录音充电宝设备卡')
await wait(700)
assert('卡片直达流程（无中间控制页）', !(await visible('[data-open-recorder]')))
assert('流程挂载', await visible('[data-flow-root="recorder"]'))
assert('首屏 = 全部录音', (await txt('.rf-title')) === '全部录音', await txt('.rf-title'))
await shot('01-files')

head('1. 全部录音列表')
assert('引导语', (await txt('.rf-intro')) === '已同步到 AI Mate 的录音文件', await txt('.rf-intro'))
assert('计数 = 5 条录音', (await txt('[data-rec-count]')) === '5 条录音', await txt('[data-rec-count]'))
assert('列表 5 行', (await n('[data-rec-file]')) === 5, await n('[data-rec-file]'))
assert('首行标题', (await txt('[data-rec-file="1"] .rf-row-title')) === 'Q3 产品规划会')
assert('首行副标题含时间/时长/容量', (await txt('[data-rec-file="1"] .rf-row-sub')).includes('今天 10:30 · 42:18 · 38.2 MB'), await txt('[data-rec-file="1"] .rf-row-sub'))
const pills = await p.locator('[data-rec-file] .rf-pill').allInnerTexts()
assert('状态胶囊 = 已转写/转写中/未转写', pills.join(',') === '已转写,转写中,已转写,未转写,未转写', pills)
assert('搜索框 placeholder', (await p.locator('[data-rec-search]').getAttribute('placeholder')) === '搜索录音名称')
assert('时间倒序按钮存在', await visible('[data-rec-sort]'))
assert('设备功能三入口', (await n('[data-rec-open-record]')) === 1 && (await n('[data-rec-open-face]')) === 1 && (await n('[data-rec-open-listen]')) === 1)
assert('录音同步入口 + 未配置徽标', (await txt('[data-rec-sync-summary]')) === '去设置', await txt('[data-rec-sync-summary]'))
assert('降噪行', (await txt('[data-rec-noise]')).includes('智能 · 会议拾音'), await txt('[data-rec-noise]'))
assert('录音参数行', (await txt('[data-rec-params]')).includes('WAV · 48kHz · 高品质'))

/* ---------- 设备功能 / 设备管理 两张卡片的字号必须走系统控件规范 ----------
   ⛔ 归档重放时曾整段照抄它的魔法数字（8 / 8.5 / 10.5 / 11 / 14px），肉眼几乎读不清。
   这里把「不低于规范」写成断言，防止日后有人再抄回去。 */
const fsOf = (sel) => p.evaluate((s) => {
  const el = document.querySelector(s)
  return el ? parseFloat(getComputedStyle(el).fontSize) : null
}, sel)
const panelFonts = {
  卡片标题: await fsOf('.rf-panel-title h3'),
  卡片右上说明: await fsOf('.rf-panel-title span'),
  磁贴主文字: await fsOf('.rf-abtn b'),
  磁贴副文字: await fsOf('.rf-abtn small'),
  管理行主文字: await fsOf('.rf-manage-copy b'),
  管理行副文字: await fsOf('.rf-manage-copy small'),
  徽标: await fsOf('.rf-sync-summary'),
  入口行主文字: await fsOf('.rf-entry b'),
  入口行副文字: await fsOf('.rf-entry small'),
}
assert('设备面板卡片标题 ≥ 17px（系统分组标题档）', panelFonts.卡片标题 >= 17, JSON.stringify(panelFonts))
assert('设备面板无 <12px 文字（归档遗留的 8~10.5px 已清）', Math.min(...Object.values(panelFonts)) >= 12, JSON.stringify(panelFonts))
assert(
  '设备管理行主/副文字对齐 ListCell（15.5 / 13）',
  panelFonts.管理行主文字 === 15.5 && panelFonts.管理行副文字 === 13,
  JSON.stringify(panelFonts)
)
assert(
  '功能磁贴主/副文字 ≥ 15 / 12',
  panelFonts.磁贴主文字 >= 15 && panelFonts.磁贴副文字 >= 12,
  JSON.stringify(panelFonts)
)

/* ⚠️ 这里**故意不放**「放大字号后有没有被裁掉」的几何守卫：
   三种直觉写法实测都打不红，属哑弹，按仓库规矩不留 ——
     · `scrollWidth > clientWidth`：文字默认换行，恒为假（顶到 30px 也不红）；
     · `scrollHeight > clientHeight`：盒子 `overflow: visible` 时 Chrome 不计溢出；
     · 手算「子元素高度 + 内外边距 > 盒高」：磁贴是 flex 列，子项会自行收缩、布局自愈
       （实测把磁贴钉成 `height: 114px` 且清掉 `min-height` 仍判不出裁切）。
   字号本身由上面 4 条守卫钉住，就不再补一条不会红的了。 */
await shot('01b-device-panel')

head('2. 搜索')
await p.locator('[data-rec-search]').fill('Q3')
await wait(300)
assert('搜索 Q3 → 1 条录音', (await txt('[data-rec-count]')) === '1 条录音', await txt('[data-rec-count]'))
assert('只剩 1 行', (await n('[data-rec-file]')) === 1)
await shot('02-search')
await p.locator('[data-rec-search]').fill('zzz')
await wait(300)
assert('无命中 → 空态文案', (await txt('[data-rec-empty]')) === '没有找到相关录音', await txt('[data-rec-empty]'))
await shot('03-search-empty')
await p.locator('[data-rec-search]').fill('')
await wait(300)
assert('清空恢复 5 条', (await n('[data-rec-file]')) === 5)

head('3. 批量管理')
await click('[data-rec-manage]', '批量管理')
await wait(300)
assert('按钮变「完成」', (await txt('[data-rec-manage]')) === '完成', await txt('[data-rec-manage]'))
assert('批量条出现', await visible('[data-rec-batchbar]'))
assert('已选 0 项', (await txt('[data-rec-selected]')) === '已选择 0 项', await txt('[data-rec-selected]'))
await click('[data-rec-file="1"]', '第一行（管理态=勾选）')
await click('[data-rec-file="3"]', '第三行（管理态=勾选）')
await wait(300)
assert('已选 2 项', (await txt('[data-rec-selected]')) === '已选择 2 项', await txt('[data-rec-selected]'))
assert('两行出现勾选态', (await n('[data-rec-check].checked')) === 2, await n('[data-rec-check].checked'))
await shot('04-managing')
assert('批量条三个动作', (await n('[data-rec-batch]')) === 3)
await click('[data-rec-batch="sync"]', '批量条同步')
await wait(300)
assert('同步 toast', (await txt('[data-rec-toast]')).includes('已加入同步队列'), await txt('[data-rec-toast]'))
await aboveIndicator('[data-rec-selected]', '批量条内容（条本身按 iOS 习惯铺到屏幕底，靠 padding 让位）')
await aboveIndicator('[data-rec-toast]', 'toast')
await click('[data-rec-manage]', '完成')
await wait(300)
assert('退出管理态', !(await visible('[data-rec-batchbar]')))

head('4. 录音详情 · 音频 tab')
await click('[data-rec-file="1"]', '第 1 条录音')
await wait(500)
assert('进详情屏', await visible('[data-rec-screen="detail"]'))
assert('标题 = 录音详情', (await txt('.rf-title')) === '录音详情', await txt('.rf-title'))
assert('文件标题', (await txt('[data-rec-detail-title]')) === 'Q3 产品规划会', await txt('[data-rec-detail-title]'))
assert('meta', (await txt('[data-rec-detail-meta]')) === '今天 10:30 · 42:18 · 38.2 MB', await txt('[data-rec-detail-meta]'))
assert('假波形 52 条', (await n('.rf-fakewave i')) === 52, await n('.rf-fakewave i'))
assert('默认 tab = 音频', (await txt('[data-rec-tab="audio"]')) === '音频')
assert('音频标记 2 条', (await n('.rf-mark')) === 2)
assert('标记行含全角空格', (await raw('.rf-mark')).includes('09:18\u3000确认 Q3 核心目标'), await txt('.rf-mark'))
await shot('05-detail-audio')

head('5. 详情 · 转写 / AI 纪要 tab')
await click('[data-rec-tab="transcript"]', '转写 tab')
await wait(300)
assert('转写 15 条', (await n('.rf-tline')) === 15, await n('.rf-tline'))
assert('第 1 条说话人', (await txt('.rf-tline b')) === '林悦 · 00:18', await txt('.rf-tline b'))
await shot('06-detail-transcript')
await click('[data-rec-tab="summary"]', 'AI 纪要 tab')
await wait(300)
assert('纪要标题', (await txt('[data-rec-pane="summary"] h3')) === 'AI 会议纪要')
assert('核心结论卡', (await txt('.rf-summary-card h4')) === '核心结论')
assert('待办事项卡', (await txt('.rf-summary-card:nth-of-type(2) h4')) === '待办事项', await txt('.rf-summary-card:nth-of-type(2) h4'))
await shot('07-detail-summary')

head('6. 详情 · 播放 / 暂停 toast')
await click('[data-rec-play]', '播放按钮')
await wait(300)
assert('播放 toast', (await txt('[data-rec-toast]')).includes('开始播放音频'), await txt('[data-rec-toast]'))
await click('[data-rec-play]', '暂停')
await wait(300)
assert('暂停 toast', (await txt('[data-rec-toast]')).includes('已暂停'), await txt('[data-rec-toast]'))

head('7. 返回列表 · 看转写中 / 未转写两态')
await click(BACK, '返回列表')
await wait(400)
assert('回到全部录音', (await txt('.rf-title')) === '全部录音')
await click('[data-rec-file="2"]', '第 2 条（转写中）')
await wait(400)
await click('[data-rec-tab="transcript"]', '转写 tab')
await wait(300)
assert('转写中卡片', (await txt('.rf-pcard h3')) === '正在转写', await txt('.rf-pcard h3'))
assert('转写中无按钮', (await n('.rf-pcard button')) === 0)
await shot('08-detail-working')
await click(BACK, '返回列表')
await wait(400)
await click('[data-rec-file="4"]', '第 4 条（未转写）')
await wait(400)
await click('[data-rec-tab="transcript"]', '转写 tab')
await wait(300)
assert('未转写卡片', (await txt('.rf-pcard h3')) === '这段录音尚未转写', await txt('.rf-pcard h3'))
assert('开始转写按钮存在', await visible('[data-rec-transcribe]'))
await shot('09-detail-pending')

head('8. AI 处理浮层（转写，含时间线 + 完成态）')
await click('[data-rec-transcribe]', '开始转写')
await wait(250)
assert('处理浮层打开', await visible('[data-rec-overlay="process"]'))
assert('头部 = AI 转写', (await txt('[data-rec-process-header]')) === 'AI 转写', await txt('[data-rec-process-header]'))
assert('状态 = 处理中', (await txt('[data-rec-process-state]')) === '处理中')
assert('kicker = 录音后处理', (await txt('[data-rec-process-kicker]')) === '录音后处理')
assert('标题 = 正在生成转写文字', (await txt('[data-rec-process-title]')) === '正在生成转写文字')
await shot('10-process-transcribe-t0')
await wait(1400)
assert('中途已有实时文本', (await n('.rf-segment')) >= 1, await n('.rf-segment'))
await shot('11-process-transcribe-mid')
await wait(3600)
assert('状态 = 已完成', (await txt('[data-rec-process-state]')) === '已完成', await txt('[data-rec-process-state]'))
assert('标题 = 转写已完成', (await txt('[data-rec-process-title]')) === '转写已完成')
assert('4 条实时文本', (await n('.rf-segment')) === 4, await n('.rf-segment'))
assert('进度条 100%', (await p.locator('[data-rec-process-progress]').getAttribute('style')).includes('100%'), await p.locator('[data-rec-process-progress]').getAttribute('style'))
assert('出现「查看完整结果」', await visible('[data-rec-process-done]'))
await aboveIndicator('[data-rec-process-done]', 'AI 处理·查看完整结果')
await shot('12-process-transcribe-done')
await click('[data-rec-process-done]', '查看完整结果')
await wait(500)
assert('落到详情屏', await visible('[data-rec-screen="detail"]'))
assert('详情是该文件', (await txt('[data-rec-detail-title]')) === '灵感速记 08/09', await txt('[data-rec-detail-title]'))
await click('[data-rec-tab="transcript"]', '转写 tab')
await wait(300)
assert('转写已完成 → 15 条正文', (await n('.rf-tline')) === 15, await n('.rf-tline'))
await shot('13-process-result-in-detail')
await click(BACK, '返回列表')
await wait(400)
assert('该条状态已变已转写', (await txt('[data-rec-file="4"] .rf-pill')) === '已转写', await txt('[data-rec-file="4"] .rf-pill'))

head('9. 录音浮层（录制 / 暂停 / 电平条 / 拾音模式 / 事后动作）')
await click('[data-rec-open-record]', '设备功能·录音')
await wait(500)
assert('录音 sheet 打开', await visible('[data-rec-overlay="record"]'))
assert('sheet 标题 = 设备录音', (await txt('[data-rec-overlay="record"] h2')) === '设备录音', await txt('[data-rec-overlay="record"] h2'))
assert('计时从 00:00 起', (await txt('[data-rec-timer]')) === '00:00', await txt('[data-rec-timer]'))
assert('提示 = 正在保存音频到充电宝', (await txt('[data-rec-hint]')) === '正在保存音频到充电宝', await txt('[data-rec-hint]'))
assert('按钮 = 暂停录音', (await txt('[data-rec-toggle]')) === '暂停录音')
assert('电平条 17 条', (await n('.rf-level i')) === 17, await n('.rf-level i'))
assert('录音中（红灯/呼吸）', await visible('.rf-recstate.recording-now'))
assert('拾音模式 3 个 chip', (await n('[data-rec-pickup-mode]')) === 3, await n('[data-rec-pickup-mode]'))
assert('默认选中 meeting（多人声场增强）', (await txt('[data-rec-pickup-mode].on')) === '多人声场增强', await txt('[data-rec-pickup-mode].on'))
await click('[data-rec-pickup-mode="directed"]', '拾音模式 chip')
await wait(250)
assert('切到聚焦正前方人声', (await txt('[data-rec-pickup-mode].on')) === '聚焦正前方人声', await txt('[data-rec-pickup-mode].on'))
await wait(1600)
assert('计时走动（>00:01）', (await txt('[data-rec-timer]')) !== '00:00', await txt('[data-rec-timer]'))
await sheetTop()
await shot('14-record-recording')
await click('[data-rec-toggle]', '暂停录音')
await wait(300)
assert('暂停后提示 = 录音已暂停', (await txt('[data-rec-hint]')) === '录音已暂停', await txt('[data-rec-hint]'))
assert('按钮 = 继续录音', (await txt('[data-rec-toggle]')) === '继续录音')
await aboveIndicator('[data-rec-finish]', '录音 sheet·完成键')
await sheetTop()
await shot('15-record-paused')
await click('[data-rec-toggle]', '继续录音')
await wait(300)

head('10. 实时转写 / 实时翻译（含归档翻译 bug 的修复）')
await click('[data-rec-act="transcribe"]', '实时转写')
await wait(400)
assert('实时面板出现', await visible('[data-rec-live]'))
assert('实时面板标题 = 实时转写', (await txt('[data-rec-live-title]')) === '实时转写', await txt('[data-rec-live-title]'))
assert('立刻补 1 条字幕', (await n('.rf-live-line')) === 1, await n('.rf-live-line'))
assert('提示 = 正在录音并实时生成文字', (await txt('[data-rec-hint]')) === '正在录音并实时生成文字', await txt('[data-rec-hint]'))
assert('转写模式无译文行', (await n('.rf-live-line small')) === 0)
assert('「实时转写」按钮呈激活态', await visible('[data-rec-act="transcribe"].active'))
await wait(1700)
assert('1.45s 后追加到 2 条', (await n('.rf-live-line')) === 2, await n('.rf-live-line'))
assert('字幕行有说话人标签', (await txt('.rf-live-line b')).includes('· 林悦'), await txt('.rf-live-line b'))
await sheetTop()
await shot('16-record-live-transcribe')

await click('[data-rec-act="translate"]', '实时翻译')
await wait(400)
assert('翻译语言 sheet 打开', await visible('[data-rec-overlay="translate"]'))
assert('sheet 标题 = 翻译这段录音', (await txt('[data-rec-overlay="translate"] h2')) === '翻译这段录音')
assert('4 个目标语言', (await n('[data-rec-translate-to]')) === 4, await n('[data-rec-translate-to]'))
await aboveIndicator('[data-rec-translate-to]', '翻译语言选择 sheet')
await shot('17-translate-sheet')
await click('[data-rec-translate-to="日本語"]', '日本語')
await wait(500)
assert('sheet 已关', !(await visible('[data-rec-overlay="translate"]')))
assert('标题 = 实时翻译 · 中文 → 日本語', (await txt('[data-rec-live-title]')) === '实时翻译 · 中文 → 日本語', await txt('[data-rec-live-title]'))
assert('提示 = 正在录音并实时生成双语字幕', (await txt('[data-rec-hint]')) === '正在录音并实时生成双语字幕', await txt('[data-rec-hint]'))
const jaLine = await txt('.rf-live-line small')
assert('译文是日语（归档 bug：这里原本永远输出英文）', jaLine.includes('皆さん'), jaLine)
assert('译文不是英文对照', !jaLine.includes('Hello everyone'), jaLine)
await wait(1600)
await sheetTop()
await shot('18-record-live-translate-ja')
assert('「实时翻译」按钮激活 / 「实时转写」取消激活', await visible('[data-rec-act="translate"].active') && !(await visible('[data-rec-act="transcribe"].active')))

head('11. 完成录音 → 新记录落库')
const beforeRows = await n('[data-rec-file]').catch(() => 0)
await click('[data-rec-finish]', '完成')
await wait(500)
assert('保存 toast', (await txt('[data-rec-toast]')).includes('录音已保存到设备'), await txt('[data-rec-toast]'))
assert('提示 = 录音与实时文字已保存', (await txt('[data-rec-hint]')) === '录音与实时文字已保存', await txt('[data-rec-hint]'))
await sheetTop()
await shot('19-record-finished')
await click('[data-rec-close="record"]', '关闭录音 sheet')
await wait(500)
assert('sheet 已关', !(await visible('[data-rec-overlay="record"]')))
assert(`列表多出 1 条（${beforeRows} → 6）`, (await n('[data-rec-file]')) === 6, await n('[data-rec-file]'))
assert('新录音在队首且已转写', (await txt('[data-rec-file] .rf-row-title')).startsWith('新录音'), await txt('[data-rec-file] .rf-row-title'))
assert('计数 = 6 条录音', (await txt('[data-rec-count]')) === '6 条录音', await txt('[data-rec-count]'))
await shot('20-files-after-record')

head('12. 更多语言 → AI 翻译：不伪造译文')
await click('[data-rec-open-record]', '再次进录音 sheet')
await wait(400)
assert('新一轮计时复位 00:00', (await txt('[data-rec-timer]')) === '00:00', await txt('[data-rec-timer]'))
await wait(1200)
await click('[data-rec-finish]', '完成（第二轮）')
await wait(400)
await click('[data-rec-act="translate"]', '实时翻译')
await wait(400)
await click('[data-rec-translate-to="更多语言"]', '更多语言')
await wait(600)
assert('AI 翻译浮层打开', await visible('[data-rec-overlay="process"]'))
assert('头部 = AI 翻译', (await txt('[data-rec-process-header]')) === 'AI 翻译', await txt('[data-rec-process-header]'))
assert('kicker = 中文 → 更多语言', (await txt('[data-rec-process-kicker]')) === '中文 → 更多语言', await txt('[data-rec-process-kicker]'))
assert('标题 = 正在转写并翻译', (await txt('[data-rec-process-title]')) === '正在转写并翻译')
assert('显示「暂无该语言译文」提示（不伪造）', (await txt('.rf-live-note')).includes('归档只提供了'), await txt('.rf-live-note'))
await wait(2200)
assert('实时段落有原文', (await n('.rf-segment')) >= 1, await n('.rf-segment'))
assert('没有伪造译文行', (await n('.rf-segment small')) === 0, await n('.rf-segment small'))
await shot('21-process-translate-more')
await wait(2600)
assert('翻译完成态', (await txt('[data-rec-process-title]')) === '翻译已完成', await txt('[data-rec-process-title]'))
await shot('22-process-translate-done')
await click('[data-rec-close="process"]', '关闭处理浮层')
await wait(400)
assert('浮层已关', !(await visible('[data-rec-overlay="process"]')))

head('13. 听译（持续双语字幕 + 语言条 + 暂停/继续）')
await click('[data-rec-open-listen]', '设备功能·听译')
await wait(600)
assert('听译浮层打开', await visible('[data-rec-overlay="listen"]'))
assert('标题 = 听译模式', (await txt('[data-rec-overlay="listen"] h2')) === '听译模式')
assert('右上角 = 实时', (await txt('.rf-full-head > span')) === '实时', await txt('.rf-full-head > span'))
assert('语言条标题', (await txt('[data-rec-listen-title]')) === '实时字幕 · English → 中文', await txt('[data-rec-listen-title]'))
assert('状态 = 正在收听并自动翻译', (await txt('[data-rec-listen-status]')) === '正在收听并自动翻译')
assert('立刻补 1 条字幕', (await n('.rf-subline')) === 1, await n('.rf-subline'))
assert('字幕标签 English · 00:04', (await txt('.rf-subline b')) === 'English · 00:04', await txt('.rf-subline b'))
assert('字幕原文是英文语料', (await txt('.rf-subline p')).startsWith('Good morning'), await txt('.rf-subline p'))
assert('字幕译文是中文语料', (await txt('.rf-subline small')).includes('大家早上好'), await txt('.rf-subline small'))
assert('听译可视化 19 条', (await n('.rf-listen-visual i')) === 19, await n('.rf-listen-visual i'))
await aboveIndicator('[data-rec-listen-toggle]', '听译·暂停键')
await wait(1900)
await shot('23-listen-en-zh')

head('14. 听译换语言 / swap / 暂停')
await p.locator('[data-rec-listen-source]').selectOption('ja')
await wait(400)
assert('标题跟着换', (await txt('[data-rec-listen-title]')) === '实时字幕 · 日本語 → 中文', await txt('[data-rec-listen-title]'))
assert('换语言后字幕重置为 1 条', (await n('.rf-subline')) === 1, await n('.rf-subline'))
assert('原文变日语语料', (await txt('.rf-subline p')).includes('おはよう'), await txt('.rf-subline p'))
await shot('24-listen-ja-zh')
await click('[data-rec-listen-swap]', '交换语言')
await wait(400)
assert('swap 后标题', (await txt('[data-rec-listen-title]')) === '实时字幕 · 中文 → 日本語', await txt('[data-rec-listen-title]'))
assert('swap 后原文变中文语料', (await txt('.rf-subline p')).includes('大家早上好'), await txt('.rf-subline p'))
await click('[data-rec-listen-toggle]', '暂停听译')
await wait(400)
assert('暂停后状态', (await txt('[data-rec-listen-status]')) === '听译已暂停', await txt('[data-rec-listen-status]'))
assert('按钮变继续听译', (await txt('[data-rec-listen-toggle]')) === '继续听译')
await shot('25-listen-paused')
await click('[data-rec-listen-toggle]', '继续听译')
await wait(300)
assert('继续后状态复位', (await txt('[data-rec-listen-status]')) === '正在收听并自动翻译')
await click('[data-rec-close="listen"]', '关闭听译')
await wait(400)
assert('听译浮层已关', !(await visible('[data-rec-overlay="listen"]')))

head('15. 面对面翻译（2.2s 假识别 + 双人分区）')
await click('[data-rec-open-face]', '设备功能·面对面翻译')
await wait(600)
assert('浮层打开', await visible('[data-rec-overlay="face"]'))
assert('标题 = 面对面翻译', (await txt('[data-rec-overlay="face"] h2')) === '面对面翻译')
assert('右上角 = 双向模式', (await txt('.rf-full-head > span')) === '双向模式', await txt('.rf-full-head > span'))
assert('两侧卡片都在首屏', await visible('.rf-face-side.cn') && await visible('.rf-face-side.en'))
await aboveIndicator('[data-rec-talk="en"]', '面对面·英文侧说话键')
assert('中文侧初始文案', (await txt('[data-rec-face-text="cn"]')) === '点击按钮，开始说话', await txt('[data-rec-face-text="cn"]'))
assert('英文侧初始文案', (await txt('[data-rec-face-text="en"]')) === 'Tap the button and start speaking', await txt('[data-rec-face-text="en"]'))
await click('[data-rec-talk="cn"]', '中文侧说话键')
await wait(400)
assert('说话中提示', (await txt('[data-rec-face-text="cn"]')) === '正在聆听…', await txt('[data-rec-face-text="cn"]'))
assert('说话中标签', (await txt('[data-rec-face-label="cn"]')) === '正在录音，点击结束', await txt('[data-rec-face-label="cn"]'))
assert('说话键进入 listening', await visible('[data-rec-talk="cn"].listening'))
await shot('26-face-listening')
await wait(2100)
assert('中文侧台词', (await txt('[data-rec-face-text="cn"]')) === '请问会议室在几楼？', await txt('[data-rec-face-text="cn"]'))
assert('英文侧对照', (await txt('[data-rec-face-text="en"]')) === 'Which floor is the meeting room on?', await txt('[data-rec-face-text="en"]'))
assert('标签变再次录音', (await txt('[data-rec-face-label="cn"]')) === '点击再次录音')
await shot('27-face-result')
await click('[data-rec-talk="en"]', '英文侧说话键')
await wait(2600)
assert('英文侧台词', (await txt('[data-rec-face-text="en"]')) === 'It is on the sixth floor.', await txt('[data-rec-face-text="en"]'))
assert('中文侧对照', (await txt('[data-rec-face-text="cn"]')) === '会议室在六楼。', await txt('[data-rec-face-text="cn"]'))
await shot('28-face-result-en')
await click('[data-rec-close="face"]', '关闭面对面翻译')
await wait(400)

head('16. 录音同步 · Wi-Fi pane（扫描 → 选网 → 密码 → 成功卡）')
await click('[data-rec-open-sync]', '设备管理·录音同步')
await wait(500)
assert('同步 sheet 打开', await visible('[data-rec-overlay="sync"]'))
assert('标题 = 录音同步', (await txt('[data-rec-overlay="sync"] h2')) === '录音同步')
assert('默认 wifi pane', await visible('[data-rec-sync-pane="wifi"]'))
assert('扫描按钮初始文案', (await txt('[data-rec-scan]')) === '扫描附近 Wi‑Fi', await txt('[data-rec-scan]'))
assert('未扫描时无网络列表', (await n('[data-rec-network]')) === 0)
await shot('29-sync-wifi-initial')
await click('[data-rec-scan]', '扫描附近 Wi-Fi')
await wait(200)
assert('扫描中文案', (await txt('[data-rec-scan]')) === '扫描中…', await txt('[data-rec-scan]'))
await wait(1100)
assert('扫完变重新扫描', (await txt('[data-rec-scan]')) === '重新扫描', await txt('[data-rec-scan]'))
assert('3 个网络', (await n('[data-rec-network]')) === 3, await n('[data-rec-network]'))
assert('第 1 个信号极佳', (await txt('[data-rec-network="Office_5G"] small')).includes('信号极佳'), await txt('[data-rec-network="Office_5G"] small'))
assert('第 2 个信号良好', (await txt('[data-rec-network="LinkHome"] small')).includes('信号良好'))
await shot('30-sync-wifi-networks')
await click('[data-rec-network="Office_5G"]', 'Office_5G')
await wait(400)
assert('密码框出现', await visible('[data-rec-pwd-box]'))
assert('连接标题', (await txt('[data-rec-network-name]')) === '连接到 Office_5G', await txt('[data-rec-network-name]'))
await p.locator('[data-rec-wifi-pwd]').fill('12')
await click('[data-rec-send-pwd]', '同步密码（密码太短）')
await wait(300)
assert('密码不足 4 位被拦', (await txt('[data-rec-toast]')).includes('请输入 Wi‑Fi 密码'), await txt('[data-rec-toast]'))
await shot('31-sync-wifi-password')
await p.locator('[data-rec-wifi-pwd]').fill('office123')
await click('[data-rec-send-pwd]', '同步密码')
await wait(200)
assert('下发中文案', (await txt('[data-rec-send-pwd]')) === '正在加密同步…', await txt('[data-rec-send-pwd]'))
await wait(1400)
assert('成功卡出现', await visible('[data-rec-wifi-success]'))
assert('成功卡文案', (await txt('[data-rec-wifi-success] b')) === 'Wi‑Fi 已配置', await txt('[data-rec-wifi-success] b'))
await aboveIndicator('[data-rec-wifi-success]', '同步·Wi-Fi 成功卡')
assert('同步 toast', (await txt('[data-rec-toast]')).includes('网络与密码已同步给充电宝'), await txt('[data-rec-toast]'))
await shot('32-sync-wifi-success')

head('17. 录音同步 · 蓝牙 pane')
await click('[data-rec-sync-tab="bluetooth"]', '蓝牙同步 tab')
await wait(400)
assert('蓝牙 pane 显示', await visible('[data-rec-sync-pane="bluetooth"]'))
assert('连接状态区', (await txt('[data-rec-sync-pane="bluetooth"] .rf-conn b')) === '我的录音充电宝')
assert('按钮初始文案', (await txt('[data-rec-bt-sync]')) === '启用蓝牙自动同步', await txt('[data-rec-bt-sync]'))
await shot('33-sync-bluetooth')
await click('[data-rec-bt-sync]', '启用蓝牙自动同步')
await wait(400)
assert('按钮变已启用', (await txt('[data-rec-bt-sync]')) === '已启用', await txt('[data-rec-bt-sync]'))
assert('蓝牙成功卡', (await txt('[data-rec-bt-success] b')) === '蓝牙同步已开启', await txt('[data-rec-bt-success] b'))
await aboveIndicator('[data-rec-bt-success]', '同步·蓝牙成功卡')
await shot('34-sync-bluetooth-done')
await click('[data-rec-close="sync"]', '关闭同步 sheet')
await wait(500)
assert('回列表', await visible('[data-rec-screen="files"]'))
assert('同步摘要回写到设备管理行', (await txt('[data-rec-sync-summary]')) === '已开启', await txt('[data-rec-sync-summary]'))
assert('摘要徽标不再是去设置', (await txt('[data-rec-manage]')) === '批量管理')
await shot('35-files-sync-summary')

head('18. 设置行 toast + 关闭流程')
await click('[data-rec-noise]', '智能降噪行')
await wait(300)
assert('降噪 toast', (await txt('[data-rec-toast]')).includes('降噪已设置为智能'), await txt('[data-rec-toast]'))
await click('[data-rec-params]', '录音参数行')
await wait(300)
assert('参数 toast', (await txt('[data-rec-toast]')).includes('录音参数：WAV · 48kHz'), await txt('[data-rec-toast]'))
await click(BACK, '返回（关闭流程）')
await wait(600)
assert('流程已卸载', !(await visible('[data-flow-root="recorder"]')))
assert('回到首页', await visible('[data-device-card="AM-Recorder-01"]'))
await shot('36-closed-back-to-home')

head('19. 再进一次（验证关闭后无残留 / 无重复字幕流）')
await click('[data-device-card="AM-Recorder-01"]', '再次进入流程')
await wait(700)
// 再进一次时，上一轮录的那条应该已经落库 → 5 + 1 = 6 条
const recountOk = await waitText('[data-rec-count]', '6 条录音')
assert('再进一次仍是 6 条录音（上一轮的录音没丢、也没重复录）', recountOk, await txt('[data-rec-count]'))
assert('没有录音 sheet 残留', !(await visible('[data-rec-overlay="record"]')))
assert('没有定时器残留在跑（计时仍是未开始态）', !(await visible('[data-rec-timer]')))
await click('[data-rec-open-listen]', '听译（第二次进）')
await wait(600)
assert('听译只补 1 条（不会两条流同时跑）', (await n('.rf-subline')) === 1, await n('.rf-subline'))
await wait(1900)
assert('1.7s 后 2 条（单条流）', (await n('.rf-subline')) === 2, await n('.rf-subline'))
await click('[data-rec-close="listen"]', '关闭听译')
await wait(400)
await shot('37-reenter-listen-single-stream')

head('20. 控制台健康度')
assert(`pageerror / console error 为 0（实际 ${errors.length}）`, errors.length === 0, errors.slice(0, 5))

console.log(`\n================ 走查 ${steps.length} 步 / 断言 ${pass + fails.length} 条 / 通过 ${pass} 条 / 失败 ${fails.length} 条 / 控制台报错 ${errors.length} 条 ================`)
if (fails.length) { console.log('失败清单：'); fails.forEach((f) => console.log('  · ' + f)) }
if (errors.length) { console.log('报错：'); errors.slice(0, 10).forEach((e) => console.log('  · ' + e)) }
await b.close()
if (fails.length || errors.length) process.exitCode = 1
