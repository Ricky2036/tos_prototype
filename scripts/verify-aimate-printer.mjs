/**
 * AI Mate · 口袋打印机 e2e（依据归档 ai-mate-printer-demo.html）
 * ============================================================
 * 覆盖：首页入口 -> 来源 -> 选图（多选上限）-> 编辑（版式/滤镜/亮度/旋转）
 *      -> 打印设置 -> 队列（进度/暂停/恢复/取消/完成）-> AR（裁剪/扫描回放）-> 返回链
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
const page = await browser.newPage({ viewport: { width: 1080, height: 860 } })
const errors = []
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })

const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` })

await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
check('系统已挂载', await page.evaluate(() => !!window.__system))

await page.evaluate(() => window.__system.unlock())
await page.waitForTimeout(600)
await page.evaluate(() => window.__system.openApp('aimate'))
await page.waitForTimeout(900)
await shot('00-home')

/* 1. 入口：首页 → 口袋打印机控制页 → 照片打印 */
await page.locator('[data-device-card="AM-Printer-01"]').click()
await page.waitForTimeout(700)
const entry = page.locator('[data-open-print]')
check('打印机控制页有照片打印入口', await entry.count() === 1)
check('入口文案为流程名', /照片打印/.test((await entry.textContent() || '')), (await entry.textContent() || '').trim())

await entry.click()
await page.waitForTimeout(700)
await shot('01-source')
const sources = await page.locator('.pf-source').count()
check('来源屏 3 张卡', sources === 3, `${sources} 张`)
// 相纸余量在流程首页的相纸卡上（归档首页同款）
const paperTxt = ((await page.locator('.pf-paper').first().textContent()) || '').replace(/\s+/g, ' ').trim()
check('相纸卡显示余量与单位', /相纸余量/.test(paperTxt) && /张/.test(paperTxt), paperTxt)

/* 2. 选图 */
await page.locator('.pf-source').first().click()
await page.waitForTimeout(700)
await shot('02-picker')
const gridN = await page.locator('.pf-photo').count()
check('选图屏渲染照片网格', gridN > 0, `${gridN} 张`)

const imgOk = await page.locator('.pf-photo img').first().evaluate((el) => ({
  w: el.naturalWidth, h: el.naturalHeight
}))
check('照片素材真实加载（非空白）', imgOk.w > 0 && imgOk.h > 0, `${imgOk.w}x${imgOk.h}`)

await page.locator('.pf-photo').nth(0).click()
await page.waitForTimeout(200)
await page.locator('.pf-photo').nth(1).click()
await page.waitForTimeout(300)
const count = (await page.locator('.pf-count').textContent() || '').trim()
check('多选计数正确', count === '2/4', count)

// 提示文案里的张数必须与真实上限同源（防「右上角 0/4、下方写着 1 张」的自相矛盾）。
// 单边契约：文案不带数字 -> 无矛盾，放过；带数字 -> 必须等于右上角那个上限。
const hint = (await page.locator('.pf-scroll .pf-kicker').first().textContent() || '').trim()
const maxPick = count.split('/')[1]
check('选图提示张数与上限一致', !/[0-9]/.test(hint) || hint.includes(maxPick), `${hint} / 上限 ${maxPick}`)

const nextBtn = page.locator('.pf-primary')
check('「下一步」已可用', !(await nextBtn.isDisabled()))

/* 3. 编辑 */
await nextBtn.click()
await page.waitForTimeout(700)
await shot('03-editor')
const tools = await page.locator('.pf-tool').count()
check('编辑屏 5 个工具', tools === 5, `${tools} 个`)

const layoutsBefore = await page.locator('.pf-frame').getAttribute('class')
await page.locator('.pf-tool[data-tool="layout"]').click()
await page.waitForTimeout(300)
const layoutChips = await page.locator('[data-layout]').count()
check('版式 6 款', layoutChips === 6, `${layoutChips} 款`)
await page.locator('[data-layout="film"]').click()
await page.waitForTimeout(400)
const layoutsAfter = await page.locator('.pf-frame').getAttribute('class')
check('切版式后预览 class 变化', layoutsAfter.includes('lay-film') && layoutsAfter !== layoutsBefore,
  `${layoutsBefore} -> ${layoutsAfter}`)
await shot('04-layout-film')

await page.locator('.pf-tool[data-tool="filter"]').click()
await page.waitForTimeout(300)
const filterChips = await page.locator('[data-filter]').count()
check('滤镜 4 款', filterChips === 4, `${filterChips} 款`)
await page.locator('[data-filter="mono"]').click()
await page.waitForTimeout(400)
const filt = await page.locator('.pf-img').getAttribute('style')
check('切滤镜后预览 filter 生效', /grayscale/.test(filt || ''), (filt || '').slice(0, 70))
await shot('05-filter-mono')

const qChips = await page.locator('[data-quality]').count()
const cChips = await page.locator('[data-color]').count()
check('打印质量 2 档 + 色彩 3 档', qChips === 2 && cChips === 3, `${qChips} / ${cChips}`)

/* 4. 打印队列 */
await page.locator('.pf-primary').click()
await page.waitForTimeout(700)
await shot('06-queue')
const jobs = await page.locator('.pf-job').count()
check('队列生成 2 个任务', jobs === 2, `${jobs} 个`)

const stage1 = await page.locator('.pf-job-stage').first().textContent()
await page.waitForTimeout(1600)
const stage2 = await page.locator('.pf-job-stage').first().textContent()
const pct = await page.locator('.pf-job-pct').first().textContent()
check('进度推进（阶段或百分比变化）', stage1 !== stage2 || pct !== '0%', `${(stage1 || '').trim()} -> ${(stage2 || '').trim()} ${pct}`)

// 暂停
await page.locator('.pf-job-act').first().click()
await page.waitForTimeout(400)
const pausedText = await page.locator('.pf-job-act').first().textContent()
check('可暂停（按钮变为继续）', /继续/.test(pausedText || ''), (pausedText || '').trim())
await shot('07-paused')

// 恢复（暂停后必须能继续，否则任务永远跑不完）
await page.locator('.pf-job-act').first().click()
await page.waitForTimeout(400)
const resumedText = await page.locator('.pf-job-act').first().textContent()
check('可恢复（按钮变回暂停）', /暂停/.test(resumedText || ''), (resumedText || '').trim())

// 取消第二个任务
await page.locator('.pf-job').nth(1).locator('.pf-job-act.danger').click()
await page.waitForTimeout(500)
const jobsAfterCancel = await page.locator('.pf-job').count()
check('可取消任务', jobsAfterCancel === 1, `${jobs} -> ${jobsAfterCancel}`)

/* 5. 等它跑完 */
await page.waitForTimeout(6000)
const doneStage = await page.locator('.pf-job-stage').first().textContent()
check('打印可跑到完成', /完成/.test(doneStage || ''), (doneStage || '').trim())
await shot('08-done')

/* 6. AR 屏：队列屏返回 → 关掉流程回到控制页 → 重新进流程 → 选 AR 来源 */
await page.locator('.pf-head .pf-back').click()
await page.waitForTimeout(700)
// 队列屏的返回语义是「关闭整个打印流程」（Arch 归档同款：队列是最后一屏）
check('队列屏返回关闭流程', await page.locator('.pf-source').count() === 0)
check('回到设备控制页', await page.locator('[data-open-print]').count() === 1)
await page.locator('[data-open-print]').click()
await page.waitForTimeout(700)
const arCard = page.locator('.pf-source').nth(2)
await arCard.click()
await page.waitForTimeout(700)
await shot('09-ar')
const trimTrack = page.locator('[data-trim-track]')
check('AR 屏有裁剪轨道', await trimTrack.count() === 1)
const readBefore = (await page.locator('.pf-trim-read').textContent() || '').trim()
const track = await trimTrack.boundingBox()
const handle = await page.locator('[data-trim=\"start\"]').boundingBox()
if (track && handle) {
  // 必须从手柄本身按下（真实用户是抓着手柄拖，不是点轨道）
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(track.x + track.width * 0.5, track.y + track.height / 2, { steps: 10 })
  await page.mouse.up()
}
await page.waitForTimeout(400)
const readAfter = (await page.locator('.pf-trim-read').textContent() || '').trim()
check('拖动可改裁剪区间', readBefore !== readAfter, `${readBefore} -> ${readAfter}`)
await shot('10-ar-trim')

await page.locator('[data-ar-scan]').locator('..').locator('.pf-chip').first().click()
await page.waitForTimeout(1400)
const scanMid = (await page.locator('[data-ar-scan-text]').textContent() || '').trim()
await page.waitForTimeout(2600)
const scanEnd = (await page.locator('[data-ar-scan-text]').textContent() || '').trim()
check('AR 扫描回放状态推进', scanMid !== scanEnd || /锚点|播放/.test(scanEnd), `${scanMid} -> ${scanEnd}`)
await shot('11-ar-scan')

/* 7. 返回链：AR → 来源 → 关闭 → 首页 */
await page.locator('.pf-head .pf-back').click()
await page.waitForTimeout(600)
check('AR → 来源屏', await page.locator('.pf-source').count() === 3)
await page.locator('.pf-head .pf-back').click()
await page.waitForTimeout(600)
check('来源屏 → 关闭回打印机控制页', await page.locator('[data-open-print]').count() === 1)

/* 8. 控制页 → 首页：设备照样在目录里 */
await page.locator('[data-nav-back]').click()
await page.waitForTimeout(700)
check('控制页可退回首页', await page.locator('[data-add-entry]').count() === 1)
check('打印机设备卡仍在首页', await page.locator('[data-device-card="AM-Printer-01"]').count() === 1)

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
