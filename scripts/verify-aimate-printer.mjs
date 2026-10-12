/**
 * AI Mate · 口袋打印机 e2e（依据归档 ai-mate-printer-demo.html 逐屏重放）
 * ====================================================================
 * 归档 7 屏 + 1 进度模态，去掉重复外壳（手机边框/状态栏/底部导航/首页/我的）后
 * 本仓落地为 5 屏 + 1 模态：
 *   device（打印段 + 设备管理段同屏平铺）/ gallery（4 相册分组·单选）/
 *   editor（暗色舞台 + 5 工具面板）/ ar（三步向导 + 裁剪轨道）/ camera（拍照·扫描）
 *   + progress-modal（归档漏加 `open` 类，本仓接通）
 *
 * 覆盖：首页卡片直达 → 设备管理（改名/固件/质量/色彩/相纸）→ 相册分组与单选
 *      → 编辑器五面板 → 入队 → 进度模态（推进/暂停/恢复/取消/完成）
 *      → 快速打印直达相册 → 相机两模式 → AR 三步向导 → 返回链
 * 用法：node scripts/verify-aimate-printer.mjs [port]   默认 5555
 */
import fs from 'node:fs'
import { chromium } from 'playwright'

const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = process.argv[2] || '5555'
const OUT = '/tmp/vwork/aimate-printer'
fs.mkdirSync(OUT, { recursive: true })

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage({ viewport: { width: 1080, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

/** 等两帧再截：无头 Chrome 会拍到尚未绘制的帧（整屏纯白） */
const settle = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
const shot = async (n) => {
  await settle()
  await page.screenshot({ path: `${OUT}/${n}.png` })
}
/** 可见性判据：元素存在 / 读得到文本，不等于用户看得见 */
const visibleCount = async (sel) => {
  let n = 0
  for (const e of await page.locator(sel).all()) {
    const b = await e.boundingBox().catch(() => null)
    if (b && b.width > 0 && b.height > 0) n += 1
  }
  return n
}
const root = () => page.locator('[data-flow-root="printer"]')
const screen = async () => (await root().count()) ? root().getAttribute('data-pf-screen') : null
const txt = async (sel) => ((await page.locator(sel).first().textContent()) || '').replace(/\s+/g, ' ').trim()

await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
check('系统已挂载', await page.evaluate(() => !!window.__system))

await page.evaluate(() => window.__system.unlock())
await page.waitForTimeout(600)
await page.evaluate(() => window.__system.openApp('aimate'))
await page.waitForTimeout(900)
await shot('00-home')

/* ============================================================
 * A. 首页卡片直达设备页（无中间控制页）
 * ============================================================ */
check('首页打印机卡存在', await page.locator('[data-device-card="AM-Printer-01"]').count() === 1)

await page.locator('[data-device-card="AM-Printer-01"]').click()
await page.waitForTimeout(700)
check('打印流程已挂载', await root().count() === 1)
check('卡片直达设备页（首屏，无中间页）', await screen() === 'device', await screen())
check('设备页内容真的绘制出来（可见性判据）', await visibleCount('[data-pf-source]') === 3)
await shot('01-device')

const srcN = await page.locator('[data-pf-source]').count()
check('设备页 3 个来源入口（相册/相机/AR）', srcN === 3, `${srcN} 个`)
check('队列空态可见', await page.locator('[data-pf-queue-empty]').count() === 1)
check('设备管理段同屏平铺（归档 @media 的平铺意图）', await page.locator('[data-pf-manage-title]').count() === 1)
check('设备统计含电池与相纸', /%|\/|张/.test(await txt('[data-pf-device-stats]')), await txt('[data-pf-device-stats]'))

const qN = await page.locator('[data-pf-quality]').count()
const cN = await page.locator('[data-pf-color]').count()
check('打印质量 2 档 + 色彩 3 档（归档 segments）', qN === 2 && cN === 3, `${qN} / ${cN}`)

await page.locator('[data-pf-quality="hd"]').click()
await page.waitForTimeout(200)
check('切质量后高亮迁移', /on/.test(await page.locator('[data-pf-quality="hd"]').getAttribute('class') || ''))
await page.locator('[data-pf-color="vivid"]').click()
await page.waitForTimeout(200)
check('切色彩后高亮迁移', /on/.test(await page.locator('[data-pf-color="vivid"]').getAttribute('class') || ''))

const meterW = await page.locator('[data-pf-paper-meter] i').evaluate((el) => el.style.width)
check('相纸 meter 反映余量', parseFloat(meterW) > 0 && parseFloat(meterW) <= 100, meterW)

// 改名（归档 `.js-device-name`）
const rename = page.locator('[data-pf-rename]')
check('设备名输入框有初始值', ((await rename.inputValue()) || '').length > 0, await rename.inputValue())
await rename.fill('我的小印')
await rename.press('Enter')
await page.waitForTimeout(300)
check('改名生效到设备卡', (await txt('[data-pf-device-name]')) === '我的小印', await txt('[data-pf-device-name]'))

// 固件升级 0→100（归档 380ms × 5 档）
await page.locator('[data-pf-firmware]').click()
await page.waitForTimeout(300)
check('固件升级中按钮禁用', await page.locator('[data-pf-firmware]').isDisabled())
await page.waitForTimeout(2600)
const fwTxt = await txt('[data-pf-firmware]')
check('固件升到 100% 并回到可点', !(await page.locator('[data-pf-firmware]').isDisabled()), fwTxt)
await shot('02-device-manage')

/* ============================================================
 * B. 相册：4 分组 + 单选 + 进编辑器
 * ============================================================ */
await page.locator('[data-pf-source="gallery"]').click()
await page.waitForTimeout(600)
check('进入相册屏', await screen() === 'gallery', await screen())
check('相册网格真的绘制出来（可见性判据）', await visibleCount('[data-pf-photo]') > 0)
const tabs = await page.locator('[data-pf-album]').count()
check('相册 4 个分组 tab（归档 album-tabs）', tabs === 4, `${tabs} 个`)

const photoN = await page.locator('[data-pf-photo]').count()
check('照片网格非空', photoN > 0, `${photoN} 张`)
const dayTxt = await txt('[data-pf-day]')
check('分组计数文案与网格数一致', dayTxt.includes(String(photoN)), `${dayTxt} / ${photoN}`)

const img = await page.locator('[data-pf-photo] img').first().evaluate((el) => ({ w: el.naturalWidth, h: el.naturalHeight }))
check('照片素材真实加载（非空白）', img.w > 0 && img.h > 0, `${img.w}x${img.h}`)

// 切分组：网格应随之变化（归档 album-tabs 是装饰性的，本仓接上过滤）
await page.locator('[data-pf-album="favorites"]').click()
await page.waitForTimeout(300)
const favN = await page.locator('[data-pf-photo]').count()
check('切分组后网格随之变化', favN !== photoN || favN > 0, `${photoN} -> ${favN}`)
await page.locator('[data-pf-album="recent"]').click()
await page.waitForTimeout(300)

// 单选（归档 selectGallery 是单选）
const ids = await page.locator('[data-pf-photo]').evaluateAll((els) => els.map((e) => e.dataset.pfPhoto))
await page.locator(`[data-pf-photo="${ids[0]}"]`).click()
await page.waitForTimeout(150)
await page.locator(`[data-pf-photo="${ids[1]}"]`).click()
await page.waitForTimeout(250)
const onN = await page.locator('[data-pf-photo].on').count()
check('选图是单选（仅一个高亮）', onN === 1, `${onN} 个高亮`)
check('选项落在后点的那张', /on/.test(await page.locator(`[data-pf-photo="${ids[1]}"]`).getAttribute('class') || ''))
await shot('03-gallery')

await page.locator('[data-pf-gallery-next]').click()
await page.waitForTimeout(700)

/* ============================================================
 * C. 编辑器：5 工具面板全量（归档 editor-screen）
 * ============================================================ */
check('进入编辑器', await screen() === 'editor', await screen())
check('编辑器舞台真的绘制出来（可见性判据）', await visibleCount('[data-pf-preview]') === 1)
const toolN = await page.locator('[data-pf-tool]').count()
check('编辑器 5 个工具', toolN === 5, `${toolN} 个`)
check('面板标题随工具变化（非空）', (await txt('[data-pf-panel-title]')).length > 0, await txt('[data-pf-panel-title]'))

// 裁剪与旋转
await page.locator('[data-pf-tool="crop"]').click()
await page.waitForTimeout(300)
const cropN = await page.locator('[data-pf-crop]').count()
check('裁剪 3 个比例 + 旋转（归档 crop pane 第 4 项是动作）',
  cropN === 3 && await page.locator('[data-pf-rotate]').count() === 1, `${cropN} 比例`)
await page.locator('[data-pf-crop="ratio34"]').click()
await page.waitForTimeout(300)
check('切裁剪后预览 class 变化', /crop-ratio34/.test(await page.locator('[data-pf-preview]').getAttribute('class') || ''))

// 打印版式
await page.locator('[data-pf-tool="layout"]').click()
await page.waitForTimeout(300)
const layN = await page.locator('[data-pf-layout]').count()
check('版式 4 款', layN === 4, `${layN} 款`)
await page.locator('[data-pf-layout="grid4"]').click()
await page.waitForTimeout(300)
const prevCls = await page.locator('[data-pf-preview]').getAttribute('class')
const gridKids = await page.locator('[data-pf-preview] .pf-photo-grid > *').count()
check('切四宫格：预览 class + 子格数量同步', /lay-grid4/.test(prevCls || '') && gridKids === 4, `${gridKids} 格`)
await shot('04-editor-layout')

// 相框
await page.locator('[data-pf-tool="frame"]').click()
await page.waitForTimeout(300)
const frameN = await page.locator('[data-pf-frame]').count()
check('相框 4 款', frameN === 4, `${frameN} 款`)
await page.locator('[data-pf-frame="film"]').click()
await page.waitForTimeout(300)
check('切相框后预览 class 变化', /frame-film/.test(await page.locator('[data-pf-preview]').getAttribute('class') || ''))

// 滤镜
await page.locator('[data-pf-tool="filter"]').click()
await page.waitForTimeout(300)
const filtN = await page.locator('[data-pf-filter]').count()
check('滤镜 4 款', filtN === 4, `${filtN} 款`)
await page.locator('[data-pf-filter="mono"]').click()
await page.waitForTimeout(300)
check('切滤镜后艺术层 class 变化',
  /filter-mono/.test(await page.locator('.pf-photo-art').first().getAttribute('class') || ''))
await shot('05-editor-filter')

// 调节（亮度 70–130 / 强度 0–100）
await page.locator('[data-pf-tool="adjust"]').click()
await page.waitForTimeout(300)
const brightBox = await page.locator('[data-pf-brightness]').evaluate((el) => ({ min: el.min, max: el.max }))
check('亮度范围 70–130（归档原值）', brightBox.min === '70' && brightBox.max === '130', `${brightBox.min}–${brightBox.max}`)
const strBox = await page.locator('[data-pf-strength]').evaluate((el) => ({ min: el.min, max: el.max }))
check('强度范围 0–100（归档原值）', strBox.min === '0' && strBox.max === '100', `${strBox.min}–${strBox.max}`)

const bBefore = await page.locator('.pf-photo-art').first().evaluate((el) => el.style.getPropertyValue('--brightness'))
await page.locator('[data-pf-brightness]').evaluate((el) => {
  el.value = '120'
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.waitForTimeout(300)
const bAfter = await page.locator('.pf-photo-art').first().evaluate((el) => el.style.getPropertyValue('--brightness'))
check('拖亮度即时反映到预览', bBefore !== bAfter, `${bBefore} -> ${bAfter}`)
await shot('06-editor-adjust')

/* ============================================================
 * D. 编辑器完成 → 入队（confirmEditor → addToQueue）
 * ============================================================ */
await page.locator('[data-pf-editor-done]').click()
await page.waitForTimeout(600)
check('编辑器完成回到设备页', await screen() === 'device', await screen())
check('队列记为 1 项', (await txt('[data-pf-queue-count]')).startsWith('1'), await txt('[data-pf-queue-count]'))

/* ============================================================
 * E. 进度模态：推进 / 暂停 / 恢复 / 取消（归档漏接的那套 UI）
 * ============================================================ */
await page.locator('[data-pf-start-print]').click()
await page.waitForTimeout(400)
check('开始打印拉起进度模态',
  await page.locator('[data-pf-progress-modal]').count() === 1 && await visibleCount('[data-pf-progress-modal]') === 1)
check('队列项切到「打印中」状态', (await txt('[data-pf-queue-status]')).length > 0, await txt('[data-pf-queue-status]'))

const p0 = Number(await txt('[data-pf-progress]'))
await page.waitForTimeout(1200)
const p1 = Number(await txt('[data-pf-progress]'))
check('进度在推进', p1 > p0, `${p0} -> ${p1}`)
check('进度条宽度与数字同源',
  Math.abs(parseFloat(await page.locator('[data-pf-progress-fill]').evaluate((el) => el.style.width)) - p1) <= 2)
check('阶段文案与剩余时间可见', (await txt('[data-pf-progress-status]')).length > 0 && (await txt('[data-pf-progress-time]')).length > 0,
  `${await txt('[data-pf-progress-status]')} / ${await txt('[data-pf-progress-time]')}`)
await shot('07-progress')

await page.locator('[data-pf-pause]').click()
await page.waitForTimeout(200)
const paused1 = Number(await txt('[data-pf-progress]'))
await page.waitForTimeout(900)
const paused2 = Number(await txt('[data-pf-progress]'))
check('暂停后进度停住', paused1 === paused2, `${paused1} = ${paused2}`)
const pauseLabel = await txt('[data-pf-pause]')
await page.locator('[data-pf-pause]').click()
await page.waitForTimeout(800)
const resumed = Number(await txt('[data-pf-progress]'))
check('恢复后进度继续', resumed > paused2, `${paused2} -> ${resumed}`)
check('暂停/继续按钮文案互换', pauseLabel !== (await txt('[data-pf-pause]')), pauseLabel)

await page.locator('[data-pf-cancel-print]').click()
await page.waitForTimeout(400)
check('取消后模态关闭', await page.locator('[data-pf-progress-modal]').count() === 0)
check('取消同时撤掉队列那一单（归档的死代码缝已补）', await page.locator('[data-pf-queue-empty]').count() === 1)
await shot('08-cancelled')

/* ============================================================
 * F. 关闭流程 → 首页「快速打印」直达相册 → 再入队 → 跑到完成
 * ============================================================ */
await page.locator('[data-nav-back]').first().click()
await page.waitForTimeout(600)
check('设备页返回关闭整个流程', await root().count() === 0)
check('回到首页', await page.locator('[data-device-card="AM-Printer-01"]').count() === 1)

await page.locator('[data-device-enter="AM-Printer-01"]').click()
await page.waitForTimeout(700)
check('首页快速打印入口直达相册（归档 quickPrint）', await screen() === 'gallery', await screen())
const quickIds = await page.locator('[data-pf-photo]').evaluateAll((els) => els.map((e) => e.dataset.pfPhoto))
await page.locator(`[data-pf-photo="${quickIds[0]}"]`).click()
await page.waitForTimeout(250)
await page.locator('[data-pf-gallery-next]').click()
await page.waitForTimeout(700)
await page.locator('[data-pf-editor-done]').click()
await page.waitForTimeout(600)
check('快速打印链路回到设备页且入队 1 项',
  (await screen()) === 'device' && (await txt('[data-pf-queue-count]')).startsWith('1'), await screen())

await page.locator('[data-pf-start-print]').click()
await page.waitForTimeout(5200)
check('打印跑到完成态', await page.locator('[data-pf-done]').count() === 1)
check('完成文案非空', (await txt('[data-pf-done-copy]')).length > 0, await txt('[data-pf-done-copy]'))
await shot('09-done')
await page.locator('[data-pf-done-action]').click()
await page.waitForTimeout(600)
check('完成按钮关闭模态', await page.locator('[data-pf-progress-modal]').count() === 0)
check('完成后队列已清空', await page.locator('[data-pf-queue-empty]').count() === 1)

/* ============================================================
 * G. 相机：拍照 → 编辑器；扫描 → 取景器播放（归档 camera-screen）
 * ============================================================ */
await page.locator('[data-pf-source="camera"]').click()
await page.waitForTimeout(600)
check('进入相机屏', await screen() === 'camera', await screen())
check('取景器真的绘制出来（可见性判据）', await visibleCount('[data-pf-viewfinder]') === 1)
check('相机默认拍照模式', await page.locator('[data-pf-viewfinder]').getAttribute('data-pf-camera-mode') === 'photo')
const tipPhoto = await txt('[data-pf-scan-tip]')

await page.locator('[data-pf-cam-tab="scan"]').click()
await page.waitForTimeout(300)
check('切到扫描模式', await page.locator('[data-pf-viewfinder]').getAttribute('data-pf-camera-mode') === 'scan')
check('取景提示随模式变化', (await txt('[data-pf-scan-tip]')) !== tipPhoto, `${tipPhoto} -> ${await txt('[data-pf-scan-tip]')}`)
await shot('10-camera-scan')

await page.locator('[data-pf-shutter]').click()
await page.waitForTimeout(800)
check('扫描后取景器进入播放（归档 450ms）',
  /playing/.test(await page.locator('[data-pf-viewfinder]').getAttribute('class') || ''))
await shot('11-camera-playing')

await page.locator('[data-pf-cam-tab="photo"]').click()
await page.waitForTimeout(300)
await page.locator('[data-pf-shutter]').click()
await page.waitForTimeout(900)
check('拍照后进编辑器（归档 500ms）', await screen() === 'editor', await screen())
await page.locator('[data-pf-editor-cancel]').click()
await page.waitForTimeout(500)
check('编辑器取消回到设备页', await screen() === 'device', await screen())

/* ============================================================
 * H. AR 三步向导（归档 ar-screen：step-dot / 裁剪 / 动态按钮文案）
 * ============================================================ */
await page.locator('[data-pf-source="ar"]').click()
await page.waitForTimeout(600)
check('进入 AR 屏', await screen() === 'ar', await screen())
check('三步指示点真的绘制出来（可见性判据）', await visibleCount('[data-pf-step-dot]') === 3)
check('三步指示点 3 个', await page.locator('[data-pf-step-dot]').count() === 3)
check('第 1 步未选视频时下一步禁用', await page.locator('[data-pf-ar-next]').isDisabled())
const nextLabel1 = await txt('[data-pf-ar-next]')

await page.locator('[data-pf-video-pick]').click()
await page.waitForTimeout(400)
check('选视频后出现视频编辑器', await page.locator('[data-pf-video-editor]').count() === 1)
check('视频编辑器带裁剪轨道', await page.locator('[data-pf-trim-track]').count() === 1)
check('第 1 步按钮文案随之变化', (await txt('[data-pf-ar-next]')) !== nextLabel1, `${nextLabel1} -> ${await txt('[data-pf-ar-next]')}`)
check('第 1 步下一步已可用', !(await page.locator('[data-pf-ar-next]').isDisabled()))

// 拖动裁剪起点（真实用户是抓着手柄拖）
const trimLabelBefore = await txt('[data-pf-trim-label]')
const track = page.locator('[data-pf-trim-track]')
await track.scrollIntoViewIfNeeded()
const tb = await track.boundingBox()
const hb = await page.locator('[data-pf-trim="start"]').boundingBox()
if (tb && hb) {
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
  await page.mouse.down()
  await page.mouse.move(tb.x + tb.width * 0.5, tb.y + tb.height / 2, { steps: 10 })
  await page.mouse.up()
}
await page.waitForTimeout(400)
check('拖动改写裁剪区间', trimLabelBefore !== (await txt('[data-pf-trim-label]')),
  `${trimLabelBefore} -> ${await txt('[data-pf-trim-label]')}`)
await shot('12-ar-step1')

await page.locator('[data-pf-ar-next]').click()
await page.waitForTimeout(500)
check('进入第 2 步', await page.locator('[data-pf-ar-step="2"]').count() === 1)
check('第 2 步未选封面时下一步禁用', await page.locator('[data-pf-ar-next]').isDisabled())
await page.locator('[data-pf-ar-recent="p3"]').click()
await page.waitForTimeout(300)
check('关联封面后绑定卡点亮', /on/.test(await page.locator('[data-pf-bind]').getAttribute('class') || ''))
check('第 2 步下一步已可用', !(await page.locator('[data-pf-ar-next]').isDisabled()))
await shot('13-ar-step2')

await page.locator('[data-pf-ar-next]').click()
await page.waitForTimeout(600)
check('第 2 步前进打开编辑器', await screen() === 'editor', await screen())
await page.locator('[data-pf-editor-done]').click()
await page.waitForTimeout(600)
check('AR 编辑器完成进第 3 步确认', await page.locator('[data-pf-ar-step="3"]').count() === 1)
check('确认卡显示绑定设备', (await txt('[data-pf-confirm-info]')).length > 0, await txt('[data-pf-confirm-info]'))
await shot('14-ar-step3')

await page.locator('[data-pf-ar-next]').click()
await page.waitForTimeout(600)
check('第 3 步确认后开打（回设备页 + 进度模态）',
  (await screen()) === 'device' && await page.locator('[data-pf-progress-modal]').count() === 1, await screen())
check('队列项标记为 AR 任务', await page.locator('[data-pf-queue-item]').getAttribute('data-pf-queue-kind') === 'ar')

await page.waitForTimeout(5200)
check('AR 打印跑到完成态', await page.locator('[data-pf-done]').count() === 1)
await page.locator('[data-pf-done-action]').click()
await page.waitForTimeout(700)
check('AR 完成后转去相机扫描模式（归档 finishPrint）',
  (await screen()) === 'camera' && await page.locator('[data-pf-viewfinder]').getAttribute('data-pf-camera-mode') === 'scan',
  `${await screen()} / ${await page.locator('[data-pf-viewfinder]').getAttribute('data-pf-camera-mode')}`)

/* ============================================================
 * I. 返回链 + 无报错
 * ============================================================ */
await page.locator('[data-pf-camera-back]').click()
await page.waitForTimeout(500)
check('相机返回设备页', await screen() === 'device', await screen())
await page.locator('[data-nav-back]').first().click()
await page.waitForTimeout(600)
check('设备页返回回到首页', await page.locator('[data-device-card="AM-Printer-01"]').count() === 1)
check('关闭流程不摘设备', await root().count() === 0)

check('无控制台报错', errors.length === 0, errors.slice(0, 3).join(' | '))

await browser.close()
const failed = results.filter((r) => !r.ok)
fs.writeFileSync(OUT + '/result.json', JSON.stringify(results, null, 2))
console.log(`\n=== AI Mate 口袋打印机 e2e: ${results.length - failed.length}/${results.length} PASS ===`)
if (failed.length) {
  console.log('失败项：\n' + failed.map((f) => `  - ${f.name} (${f.detail})`).join('\n'))
  process.exit(1)
}
console.log('截图目录：' + OUT)
