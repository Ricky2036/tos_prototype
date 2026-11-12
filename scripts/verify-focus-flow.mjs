#!/usr/bin/env node
/** iOS 专注模式全链路：设置首页 → 详情 → 允许列表/屏幕/定时/过滤 → 新建/删除 → CC 切换与深链。 */
import fs from 'node:fs'
import { chromium } from 'playwright'

const OUT = process.env.ARTIFACT_DIR || '/tmp/vwork/focus'
const PORT = process.argv[2] || '5555'
const BASE = `http://127.0.0.1:${PORT}/`
const CHROME = process.env.PLAYWRIGHT_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
let pass = 0
let fail = 0
const failures = []
const pageErrors = []
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`PASS [focus] ${name}`) }
  else { fail++; failures.push(`${name}${detail ? ' — ' + detail : ''}`); console.log(`FAIL [focus] ${name}${detail ? ' — ' + detail : ''}`) }
}
async function click(page, selector, wait = 420) {
  const loc = page.locator(selector).last()
  await loc.scrollIntoViewIfNeeded().catch(() => {})
  await loc.click({ timeout: 7000 })
  await page.waitForTimeout(wait)
}
async function text(page, selector) {
  return ((await page.locator(selector).last().textContent().catch(() => '')) || '').trim()
}
async function visible(page, selector) {
  return page.locator(selector).last().evaluate(el => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
  }).catch(() => false)
}
async function countVisible(page, selector) {
  return page.evaluate(sel => [...document.querySelectorAll(sel)].filter(el => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
  }).length, selector)
}
async function back(page) { await click(page, '.sub-shell [data-nav-back]') }
async function shot(page, name) {
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ executablePath: CHROME, headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', e => pageErrors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') pageErrors.push(m.text()) })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.removeItem('tos.settings.focus.v1'))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(650)
  await page.evaluate(() => window.__system?.unlock?.())
  await page.waitForTimeout(350)
  await page.evaluate(() => window.__system?.openApp?.('settings'))
  await page.waitForTimeout(650)

  await click(page, '[data-setting-row="focus"]', 520)
  check('A 设置首页 Infinix AI 下方入口可进入', await visible(page, '[data-focus-page="home"]'))
  check('A 默认五个模式完整显示', await countVisible(page, '[data-focus-mode]') === 5)
  const homeRow = await page.locator('[data-focus-mode="classroom"]').evaluate(row => {
    const glyph = row.querySelector('.focus-glyph').getBoundingClientRect()
    const title = row.querySelector('.lc-title').getBoundingClientRect()
    return { gap: title.left - glyph.right, glyph: glyph.width, dy: Math.abs((title.top + title.height / 2) - (glyph.top + glyph.height / 2)) }
  })
  check('A 列表圆形图标与标题间距 12±1px', Math.abs(homeRow.gap - 12) <= 1, JSON.stringify(homeRow))
  check('A 列表图标与标题垂直中心对齐', homeRow.dy <= 0.6, JSON.stringify(homeRow))
  await shot(page, '01_focus_home')

  await click(page, '[data-focus-mode="classroom"]')
  check('B 模式详情标题与图标', (await text(page, '.fd-hero h1')) === '课堂专注模式')
  check('B 默认定时含时间、位置与 App', await countVisible(page, '[data-focus-schedule-id]') === 5)
  check('B 默认过滤条件两项', await countVisible(page, '[data-focus-active-filter]') === 2)
  await shot(page, '02_focus_detail')

  const detail = await page.locator('[data-focus-detail="classroom"]').evaluate(root => {
    const scale = root.getBoundingClientRect().width / 360
    const card = root.querySelector('.fd-screens-card').getBoundingClientRect()
    const rel = r => (r - card.top) / scale
    const cols = [...root.querySelectorAll('.fd-screens-card > button')].map(btn => {
      const art = btn.querySelector('.fda')
      const label = btn.querySelector(':scope > strong')
      return {
        cls: art.className,
        bottom: rel(art.getBoundingClientRect().bottom),
        labelTop: rel(label.getBoundingClientRect().top),
        label: label.textContent.trim()
      }
    })
    const smart = root.querySelector('.fd-smart-row')
    const sched = root.querySelector('.fd-schedule-row')
    const sr = smart.getBoundingClientRect()
    const dy = el => {
      const r = el.getBoundingClientRect()
      return Math.abs((r.top + r.height / 2) - (sr.top + sr.height / 2)) / scale
    }
    const glyph = smart.querySelector('.fd-row-icon')
    const gr = glyph.getBoundingClientRect()
    const ir = glyph.querySelector('svg').getBoundingClientRect()
    const tail = smart.querySelector('.toggle-switch')
    const chevron = sched.querySelector(':scope > .l-icon')
    const cardRight = root.querySelector('.fd-schedule-card').getBoundingClientRect().right
    return {
      cols,
      smartH: sr.height / scale,
      schedH: sched.getBoundingClientRect().height / scale,
      dyGlyph: dy(glyph),
      dyText: dy(smart.querySelector(':scope > div')),
      dySwitch: dy(tail),
      iconCentered: Math.abs((ir.left - gr.left) - (ir.top - gr.top)),
      switchInset: (cardRight - tail.getBoundingClientRect().right) / scale,
      chevronInset: (cardRight - chevron.getBoundingClientRect().right) / scale,
      chevronColor: getComputedStyle(chevron).color
    }
  })
  const bottomSpread = Math.max(...detail.cols.map(c => c.bottom)) - Math.min(...detail.cols.map(c => c.bottom))
  const labelSpread = Math.max(...detail.cols.map(c => c.labelTop)) - Math.min(...detail.cols.map(c => c.labelTop))
  check('B 三块屏幕示意图底边严格共线', bottomSpread <= 0.5, `spread=${bottomSpread}`)
  check('B 三个屏幕标签同一基线', labelSpread <= 0.5, `spread=${labelSpread}`)
  check('B 三块示意图分别是锁屏/主屏/手表', detail.cols.map(c => c.cls).join(' ').includes('is-lock') && detail.cols.map(c => c.cls).join(' ').includes('is-home') && detail.cols.map(c => c.cls).join(' ').includes('is-watch'), JSON.stringify(detail.cols.map(c => c.cls)))
  check('B 智能启用行与定时行等高', Math.abs(detail.smartH - detail.schedH) <= 1, `${detail.smartH} vs ${detail.schedH}`)
  check('B 智能启用行图标/文字/开关垂直居中', Math.max(detail.dyGlyph, detail.dyText, detail.dySwitch) <= 1, JSON.stringify(detail))
  check('B 电源符号在 17px 图标列内居中', detail.iconCentered <= 0.6, `offset=${detail.iconCentered}`)
  check('B 开关右缘与本行箭头尖端对齐', Math.abs((detail.switchInset - detail.chevronInset) - 4) <= 1, `${detail.switchInset} vs ${detail.chevronInset}`)
  check('B 行尾箭头为灰色', detail.chevronColor === 'rgb(199, 199, 204)', detail.chevronColor)

  await click(page, '[data-focus-open="people"]')
  check('C 联系人允许列表打开', await visible(page, '[data-focus-allowed="people"]'))
  await click(page, '[data-focus-allowed="people"] [data-focus-person="Ricky"]')
  check('C 联系人可选中', await page.locator('[data-focus-allowed="people"] [data-focus-person="Ricky"]').evaluate(el => el.classList.contains('selected')))
  await back(page)
  check('C 返回详情后联系人头像同步', await countVisible(page, '.fd-people-preview > span') === 2)

  await click(page, '[data-focus-open="apps"]')
  check('D App 允许列表使用真实注册应用', await countVisible(page, '[data-registered-app-list] [data-registered-app-icon]') >= 30)
  await click(page, '[data-focus-allowed="apps"] [data-app-id="camera"]')
  await back(page)
  check('D 返回详情后 App 状态保留', await visible(page, '[data-focus-detail="classroom"]'))

  await click(page, '[data-focus-screen="lock"]')
  check('E 锁屏选取页打开', await visible(page, '[data-focus-screen-picker="lock"]'))
  const lockPage = await page.locator('[data-focus-screen-picker="lock"]').evaluate(root => {
    const shell = root.closest('.sub-shell')
    const navTitle = shell.querySelector('.gn-title')
    const confirm = shell.querySelector('[data-focus-screen-confirm]')
    const hero = root.querySelector('.fsa').getBoundingClientRect()
    const title = root.querySelector('.fsp-title').getBoundingClientRect()
    const rule = root.querySelector('.fsp-rule').getBoundingClientRect()
    const section = root.querySelector('.fsp-section').getBoundingClientRect()
    const frames = [...root.querySelectorAll('.fsp-frame')].map(el => el.getBoundingClientRect())
    const radios = [...root.querySelectorAll('.fsp-radio')].map(el => el.getBoundingClientRect())
    const host = root.getBoundingClientRect()
    const k = shell.getBoundingClientRect().width / 360
    return {
      navTitle: (navTitle?.textContent || '').trim(),
      confirmBg: getComputedStyle(confirm).backgroundColor,
      confirmRound: getComputedStyle(confirm).borderTopLeftRadius,
      hasCreate: !!root.querySelector('.fsp-create'),
      createText: (root.querySelector('.fsp-create strong')?.textContent || '').trim(),
      sectionText: (root.querySelector('.fsp-section')?.textContent || '').trim(),
      titleCenter: Math.abs((title.left + title.width / 2) - (host.left + host.width / 2)),
      heroH: hero.height / k,
      gapHeroTitle: (title.top - hero.bottom) / k,
      ruleGap: (rule.top - title.bottom) / k,
      frameW: frames[0].width / k, frameH: frames[0].height / k,
      frameGap: frames[1] ? (frames[1].left - frames[0].right) / k : 0,
      frameSpread: (Math.max(...frames.map(f => f.width)) - Math.min(...frames.map(f => f.width))) / k,
      radioW: radios[0].width / k,
      radioGap: (radios[0].top - frames[0].bottom) / k,
      radioCenterDy: Math.abs((radios[0].left + radios[0].width / 2) - (frames[0].left + frames[0].width / 2)),
      labelCount: root.querySelectorAll('.fsp-pages > button > strong').length
    }
  })
  check('E 锁屏页导航栏没有标题', lockPage.navTitle === '', lockPage.navTitle)
  check('E 完成键是实心蓝圆钮', lockPage.confirmBg === 'rgb(0, 122, 255)' && lockPage.confirmRound === '50%', JSON.stringify(lockPage))
  check('E 锁屏页有「创建新的锁屏」段', lockPage.hasCreate && lockPage.createText === '创建新的锁屏', JSON.stringify(lockPage))
  check('E 锁屏页分组标题为「从锁屏中选取」', lockPage.sectionText === '从锁屏中选取', lockPage.sectionText)
  check('E 大标题水平居中', lockPage.titleCenter <= 0.5, `dx=${lockPage.titleCenter}`)
  check('E 插图高 80±2px、与标题间距 14±4px', Math.abs(lockPage.heroH - 80) <= 2 && Math.abs(lockPage.gapHeroTitle - 14) <= 4, JSON.stringify(lockPage))
  check('E 缩略图 84×195±1px、等宽、间距 23±1px', Math.abs(lockPage.frameW - 84) <= 1 && Math.abs(lockPage.frameH - 195) <= 1 && lockPage.frameSpread <= 0.5 && Math.abs(lockPage.frameGap - 23) <= 1, JSON.stringify(lockPage))
  check('E 单选点 26px、贴在缩略图下方 12±2px、水平居中', Math.abs(lockPage.radioW - 26) <= 1 && Math.abs(lockPage.radioGap - 12) <= 2 && lockPage.radioCenterDy <= 0.5, JSON.stringify(lockPage))
  check('E 缩略图下方不显示名称文字', lockPage.labelCount === 0, `labels=${lockPage.labelCount}`)
  await click(page, '[data-focus-screen-option="ocean"]')
  check('E 选中后单选点填充', await page.locator('[data-focus-screen-option="ocean"] .fsp-radio').evaluate(el => getComputedStyle(el).backgroundColor === 'rgb(0, 122, 255)'))
  await click(page, '[data-focus-screen-confirm]')
  const lockCol = page.locator('[data-focus-screen="lock"]').first()
  check('E 锁屏选择回写详情', (await lockCol.locator('strong').last().textContent()).trim() === '选取' && (await lockCol.locator('.fda').getAttribute('class')).includes('wall-ocean'))

  // 主屏幕页：没有「创建新的…」段，分组标题也不一样。
  await click(page, '[data-focus-screen="home"]')
  const homePage = await page.locator('[data-focus-screen-picker="home"]').evaluate(root => ({
    hasCreate: !!root.querySelector('.fsp-create'),
    sectionText: (root.querySelector('.fsp-section')?.textContent || '').trim(),
    title: (root.querySelector('.fsp-title')?.textContent || '').trim(),
    thumbs: root.querySelectorAll('.fsp-frame').length,
    iconsPerThumb: root.querySelectorAll('.fsp-pages > button:first-child .th-icons i').length
  }))
  check('H 主屏幕页没有「创建新的…」段', homePage.hasCreate === false, JSON.stringify(homePage))
  check('H 主屏幕页分组标题为「从你的页面中选取」', homePage.sectionText === '从你的页面中选取', homePage.sectionText)
  check('H 主屏幕页标题与真机一致', homePage.title === '选取主屏幕页面', homePage.title)
  check('H 每个缩略图都有真实图标阵列', homePage.thumbs === 3 && homePage.iconsPerThumb === 20, JSON.stringify(homePage))
  await shot(page, '05b_home_picker')
  await back(page)

  await click(page, '[data-focus-schedule-id="time-09:00-10:00"]')
  check('F 时间定时可编辑', await visible(page, '[data-focus-schedule="time"]'))
  await click(page, '[data-focus-weekday="6"]')
  await click(page, '[data-focus-time-target="end"]')
  check('F 标准时间选择弹层出现', await visible(page, '[data-tps-title]'))
  await click(page, '[data-tps-confirm]')
  await click(page, '[data-focus-schedule-save]')
  check('F 时间定时保存后回详情', await visible(page, '[data-focus-detail="classroom"]'))

  await click(page, '[data-focus-add-schedule]')
  check('G 添加定时提供时间位置 App 三类', await countVisible(page, '[data-focus-schedule-type]') === 3)

  // 选择页行内版式：真机实测 行高 57 / 图标列 18 / 图标↔文字 12 / 文字左缘 48。
  const choiceRows = await page.locator('[data-focus-schedule="choices"]').evaluate(root => {
    const shell = root.closest('.sub-shell')
    const sb = shell.getBoundingClientRect()
    const k = sb.width / 360
    const rel = r => ({ l: (r.left - sb.left) / k, t: (r.top - sb.top) / k, w: r.width / k, h: r.height / k, r: (r.right - sb.left) / k, b: (r.bottom - sb.top) / k })
    const rows = [...root.querySelectorAll('.fsc-row')]
    const icons = rows.map(row => rel(row.querySelector('.fsc-icon').getBoundingClientRect()))
    const titles = rows.map(row => rel(row.querySelector('.fsc-text strong').getBoundingClientRect()))
    const first = rel(rows[0].getBoundingClientRect())
    return {
      count: rows.length,
      rowH: first.h,
      rowGap: rel(rows[1].getBoundingClientRect()).t - first.b,
      iconW: icons[0].w,
      iconRight: icons[0].r,
      iconLefts: icons.map(i => Math.round(i.l)),
      textLeft: titles[0].l,
      gap: titles[0].l - icons[0].r,
      titleFs: parseFloat(getComputedStyle(root.querySelector('.fsc-text strong')).fontSize),
      subFs: parseFloat(getComputedStyle(root.querySelector('.fsc-text small')).fontSize),
      discBg: getComputedStyle(root.querySelector('.fsc-icon.is-disc')).backgroundColor,
      plainGlow: getComputedStyle(root.querySelectorAll('.fsc-icon')[1]).backgroundColor
    }
  })
  check('G 选择页三行等高 57±1', Math.abs(choiceRows.rowH - 57) <= 1, JSON.stringify(choiceRows))
  check('G 选择页图标列 18±1', Math.abs(choiceRows.iconW - 18) <= 1, JSON.stringify(choiceRows))
  check('G 选择页图标↔文字 12±1', Math.abs(choiceRows.gap - 12) <= 1, JSON.stringify(choiceRows))
  check('G 选择页三行图标左缘共线', new Set(choiceRows.iconLefts).size === 1, JSON.stringify(choiceRows.iconLefts))
  check('G 选择页标题 14px / 副标题 10.5px', choiceRows.titleFs === 14 && choiceRows.subFs === 10.5, JSON.stringify(choiceRows))
  check('G 只有时间用实心圆盘，位置与 App 无底盘', choiceRows.discBg !== 'rgba(0, 0, 0, 0)' && choiceRows.plainGlow === 'rgba(0, 0, 0, 0)', JSON.stringify(choiceRows))
  await shot(page, '07_schedule_choices')
  await click(page, '[data-focus-schedule-type="time"]')
  await click(page, '[data-focus-weekday="0"]')
  await click(page, '[data-focus-schedule-save]')
  check('G 新时间定时已添加', await countVisible(page, '[data-focus-schedule-id]') === 6)

  await click(page, '[data-focus-add-schedule]')
  await click(page, '[data-focus-schedule-type="location"]')
  await click(page, '[data-focus-location="公司"]')
  await click(page, '[data-focus-schedule-save]')
  check('H 位置定时已添加', (await text(page, '.fd-schedule-card')).includes('公司'))

  await click(page, '[data-focus-add-schedule]')
  await click(page, '[data-focus-schedule-type="app"]')
  await click(page, '[data-focus-schedule="app"] [data-app-id="camera"]')
  await click(page, '[data-focus-schedule-save]')
  check('I App 定时已添加', await countVisible(page, '[data-focus-schedule-id]') === 8)

  await click(page, '[data-focus-add-filter]')
  check('J 过滤条件列表包含 App 与系统两组', await countVisible(page, '[data-focus-filter]') === 12)
  await shot(page, '03_filters')
  await click(page, '[data-focus-filter="calendar"]')
  check('J 日历过滤详情可选取日历', await visible(page, '[data-focus-filter-detail="calendar"]'))
  await click(page, '.calendar-card button', 120)
  await click(page, '.filter-add')
  check('J 日历过滤已加入', await visible(page, '[data-focus-active-filter="calendar"]'))
  await click(page, '[data-focus-add-filter]')
  await click(page, '[data-focus-filter="darkAppearance"]')
  await click(page, '[data-focus-filter-detail="darkAppearance"] [role="switch"]')
  check('K 系统过滤开关可切换', await page.locator('[data-focus-filter-detail="darkAppearance"] [role="switch"]').getAttribute('aria-checked') === 'true')
  const note = await page.locator('[data-focus-filter-detail="darkAppearance"]').evaluate(root => {
    const shell = root.closest('.sub-shell').getBoundingClientRect()
    const scale = shell.width / 360
    const note = root.querySelector('.filter-note').getBoundingClientRect()
    const row = root.querySelector('.filter-toggle-row').getBoundingClientRect()
    return {
      noteLeft: (note.left - shell.left) / scale,
      rightGap: (shell.right - note.right) / scale,
      indent: (note.left - row.left) / scale,
      gap: (note.top - row.bottom) / scale
    }
  })
  check('K 过滤页说明文字左右各留足安全边距', note.noteLeft >= 21 && note.rightGap >= 21, JSON.stringify(note))
  check('K 说明文字相对卡片内缩 6±1px、与卡片留 8±2px', Math.abs(note.indent - 6) <= 1 && Math.abs(note.gap - 8) <= 2, JSON.stringify(note))
  await back(page)
  await back(page)
  check('K 系统过滤已加入详情', await visible(page, '[data-focus-active-filter="darkAppearance"]'))
  const filterCard = await page.locator('[data-focus-active-filter="darkAppearance"]').evaluate(el => {
    const root = el.closest('.focus-detail').getBoundingClientRect()
    const scale = root.width / 360
    const card = el.getBoundingClientRect()
    const chevron = el.querySelector(':scope > .l-icon').getBoundingClientRect()
    return { top: (chevron.top - card.top) / scale, rightInset: (card.right - chevron.right) / scale }
  })
  check('K 过滤条件卡箭头固定在卡片右上角', Math.abs(filterCard.top - 12) <= 1 && Math.abs(filterCard.rightInset - 12) <= 1, JSON.stringify(filterCard))

  await click(page, '[data-focus-edit]')
  check('L 编辑弹层打开', await visible(page, '.fd-edit-sheet'))
  await page.locator('.fd-edit-sheet input').fill('课堂自习专注模式')
  await click(page, '.fd-save-edit')
  check('L 名称编辑实时回写', (await text(page, '.fd-hero h1')) === '课堂自习专注模式')

  await click(page, '.focus-detail [data-nav-back]', 480)
  await click(page, '[data-focus-create]')
  check('M 新建入口展示六类模板', await countVisible(page, '[data-focus-template]') === 6)
  await shot(page, '04_templates')
  await click(page, '[data-focus-template="custom"]')
  await page.locator('[data-focus-name]').fill('礼拜')
  await click(page, '[data-focus-icon="graduationCap"]', 100)
  await click(page, '[data-focus-next]')
  check('M 新建介绍页名称正确', (await text(page, '.fc-intro h1')) === '礼拜专注模式')
  const intro = await page.locator('.focus-create').evaluate(root => {
    const glyph = root.querySelector('.fc-intro .focus-glyph').getBoundingClientRect()
    const rows = [...root.querySelectorAll('.fc-intro-points > div')].map(row => {
      const icon = row.querySelector('.l-icon').getBoundingClientRect()
      const copy = row.querySelector('span:nth-child(2)').getBoundingClientRect()
      return { h: row.getBoundingClientRect().height, iconX: icon.left, copyX: copy.left }
    })
    const button = root.querySelector('.fc-primary').getBoundingClientRect()
    const screen = root.getBoundingClientRect()
    return {
      glyph: glyph.width, rows,
      buttonH: button.height,
      buttonBottom: screen.bottom - button.bottom,
      iconSpread: Math.max(...rows.map(r => r.iconX)) - Math.min(...rows.map(r => r.iconX)),
      copySpread: Math.max(...rows.map(r => r.copyX)) - Math.min(...rows.map(r => r.copyX))
    }
  })
  check('M 介绍页图标 48±1px', Math.abs(intro.glyph - 48) <= 1, `glyph=${intro.glyph}`)
  check('M 四条说明各占单行（行高 <30px）', intro.rows.length === 4 && intro.rows.every(r => r.h < 30), JSON.stringify(intro.rows))
  check('M 说明图标列与文字列严格对齐', intro.iconSpread <= 0.5 && intro.copySpread <= 0.5, JSON.stringify(intro))
  check('M 底部按钮高 44±1px、离底 31±2px', Math.abs(intro.buttonH - 44) <= 1 && Math.abs(intro.buttonBottom - 31) <= 2, JSON.stringify(intro))
  await shot(page, '07_intro_layout')
  await click(page, '.fc-primary')
  const people = await page.locator('[data-focus-create-step="people"]').evaluate(root => {
    const host = root.getBoundingClientRect()
    const title = root.querySelector('[data-focus-people-hero] h1').getBoundingClientRect()
    const card = root.querySelector('.focus-mode-card')
    const cardRect = card.getBoundingClientRect()
    const labels = [...root.querySelectorAll('.fmc-label')].map(el => el.getBoundingClientRect())
    const icons = [...root.querySelectorAll('.fmc-icon')].map(el => el.getBoundingClientRect())
    const add = root.querySelector('[data-focus-add-person]')
    const addRect = add.getBoundingClientRect()
    const plus = add.querySelector('.fc-add-plus').getBoundingClientRect()
    const addLabel = add.querySelector('strong').getBoundingClientRect()
    const scroll = getComputedStyle(root.querySelector('.fc-selection'))
    return {
      heroHasIllustration: !!root.querySelector('.fc-people-card'),
      titleGap: cardRect.top - title.bottom,
      cardH: cardRect.height,
      addH: addRect.height,
      labelSpread: Math.max(...labels.map(r => r.left)) - Math.min(...labels.map(r => r.left)),
      iconSpread: Math.max(...icons.map(r => r.left)) - Math.min(...icons.map(r => r.left)),
      labelAfterIcon: labels[0].left - icons[0].right,
      padLeft: parseFloat(scroll.paddingLeft),
      padRight: parseFloat(scroll.paddingRight),
      heroLeftGap: title.left - host.left,
      cardLeftGap: cardRect.left - host.left,
      cardRightGap: host.right - cardRect.right,
      cardBg: getComputedStyle(card).backgroundColor,
      selectedBg: getComputedStyle(card.querySelector('button.selected')).backgroundColor,
      checkColor: getComputedStyle(root.querySelector('button.selected .fmc-check')).color,
      badgeBg: getComputedStyle(root.querySelector('.fmc-badge')).backgroundColor,
      chips: root.querySelectorAll('.fc-people-chips button').length,
      addBg: getComputedStyle(add).backgroundColor,
      addRadius: parseFloat(getComputedStyle(add).borderTopLeftRadius),
      addLeftGap: addRect.left - host.left,
      plusSize: plus.width,
      plusToLabel: addLabel.top - (plus.top + plus.height)
    }
  })
  check('M 联系人页使用卡片示意插图', people.heroHasIllustration)
  check('M 标题与通知卡间距 21±3px', Math.abs(people.titleGap - 21) <= 3, `gap=${people.titleGap}`)
  check('M 通知卡两行各 36px（合计 72±1px）', Math.abs(people.cardH - 72) <= 1, `h=${people.cardH}`)
  check('M 通知选项图标/文字各成一列', people.iconSpread <= 0.5 && people.labelSpread <= 0.5, JSON.stringify(people))
  check('M 通知文字与图标间距 6±1px', Math.abs(people.labelAfterIcon - 6) <= 1, JSON.stringify(people))
  check('M 联系人页左右安全边距 16±0.5px', Math.abs(people.padLeft - 16) <= 0.5 && Math.abs(people.padRight - 16) <= 0.5, JSON.stringify(people))
  check('M 标题/通知卡/添加块同轴左缘 16px', Math.abs(people.heroLeftGap - 16) <= 0.5 && Math.abs(people.cardLeftGap - 16) <= 0.5 && Math.abs(people.addLeftGap - 16) <= 0.5 && Math.abs(people.cardRightGap - 16) <= 0.5, JSON.stringify(people))
  check('M 通知选择框底色为淡紫灰 #ECEBF4', people.cardBg === 'rgb(236, 235, 244)', people.cardBg)
  check('M 选中行不翻白、只显蓝勾', people.selectedBg === 'rgba(0, 0, 0, 0)' && people.checkColor === 'rgb(10, 132, 255)', `${people.selectedBg} / ${people.checkColor}`)
  check('M 允许通知图标为绿底白勾', people.badgeBg === 'rgb(52, 199, 89)', people.badgeBg)
  check('M 未选联系人时只有「添加」空槽', people.chips === 0 && people.addBg === 'rgb(236, 235, 244)', JSON.stringify(people))
  check('M 添加空槽高 90±4px', Math.abs(people.addH - 90) <= 4, `h=${people.addH}`)
  check('M 添加空槽为 16px 圆角容器、44px 圆形加号、加号与文字间距 8±1px', Math.abs(people.addRadius - 16) <= 0.5 && Math.abs(people.plusSize - 44) <= 1 && Math.abs(people.plusToLabel - 8) <= 1, JSON.stringify(people))
  await shot(page, '07_people_step')
  await click(page, '[data-focus-add-person]', 460)
  const picker = await page.locator('[data-focus-people-picker]').evaluate(root => {
    const buttons = [...root.querySelectorAll('.fc-picker-list button')]
    const avatar = buttons[0].querySelector('.fc-picker-avatar').getBoundingClientRect()
    const name = buttons[0].querySelector('strong').getBoundingClientRect()
    return {
      rows: buttons.length,
      rowH: buttons[0].getBoundingClientRect().height,
      dy: Math.abs((avatar.top + avatar.height / 2) - (name.top + name.height / 2)),
      checked: root.querySelectorAll('.fc-picker-check .l-icon').length
    }
  })
  check('M 点「添加」弹出联系人选择器', picker.rows >= 4, JSON.stringify(picker))
  check('M 选择器行高 50±1px 且头像/姓名同轴', Math.abs(picker.rowH - 50) <= 1 && picker.dy <= 1, JSON.stringify(picker))
  check('M 未勾选时选择器无勾', picker.checked === 0)
  await click(page, '[data-focus-pick-person="蔡"]', 200)
  await click(page, '[data-focus-pick-person="Ricky"]', 200)
  check('M 选择器勾选后显示蓝色勾', await countVisible(page, '[data-focus-people-picker] .fc-picker-check .l-icon') === 2)
  await shot(page, '07b_people_picker')
  await click(page, '[data-focus-picker-done]', 420)
  check('M 完成后选择器收起', !(await visible(page, '[data-focus-people-picker]')))
  check('M 已选联系人生成可移除胶囊行', await countVisible(page, '[data-focus-create-step="people"] [data-focus-person]') === 2)
  const chips = await page.locator('[data-focus-create-step="people"] .fc-people-chips').evaluate(root => {
    const items = [...root.querySelectorAll('button')].map(el => {
      const avatar = el.querySelector('.fc-chip-avatar').getBoundingClientRect()
      const name = el.querySelector('strong').getBoundingClientRect()
      const remove = el.querySelector('.fc-chip-remove').getBoundingClientRect()
      return { h: el.getBoundingClientRect().height, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, dy: Math.abs((avatar.top + avatar.height / 2) - (name.top + name.height / 2)), removeRight: remove.right, width: el.getBoundingClientRect().width }
    })
    const host = root.closest('[data-focus-create-step="people"]').getBoundingClientRect()
    return { items, spread: Math.max(...items.map(i => i.left)) - Math.min(...items.map(i => i.left)), right: host.right - items[0].right, removeInset: items[0].right - items[0].removeRight }
  })
  check('M 胶囊行左缘对齐且等宽', chips.spread <= 0.5 && Math.abs(chips.right - 16) <= 0.5, JSON.stringify(chips))
  check('M 胶囊行头像与姓名同轴、移除按钮贴右 14±1px', chips.items.every(i => i.dy <= 1) && Math.abs(chips.removeInset - 14) <= 1, JSON.stringify(chips))
  await shot(page, '07c_people_filled')
  await click(page, '[data-focus-next]')
  const apps = await page.locator('[data-focus-create-step="apps"]').evaluate(root => {
    const nav = root.closest('.focus-create').querySelector('.fc-nav').getBoundingClientRect()
    const title = root.closest('.focus-create').querySelector('.fc-nav-title').getBoundingClientRect()
    const finish = root.closest('.focus-create').querySelector('[data-focus-finish]').getBoundingClientRect()
    const search = root.querySelector('.settings-search-bar').getBoundingClientRect()
    const list = root.querySelector('[data-registered-app-list]').getBoundingClientRect()
    const host = root.closest('.focus-create').getBoundingClientRect()
    return {
      hasModeCard: !!root.querySelector('.focus-mode-card'),
      titleCenter: Math.abs((title.left + title.width / 2) - (host.left + host.width / 2)),
      finishSize: finish.width,
      finishRight: host.right - finish.right,
      navBottom: nav.bottom,
      searchTop: search.top,
      searchBottom: search.bottom,
      listTop: list.top
    }
  })
  check('M App 页不再显示通知模式卡', apps.hasModeCard === false)
  check('M App 页标题水平居中', apps.titleCenter <= 0.5, JSON.stringify(apps))
  check('M App 页完成按钮为 38px 圆钮且右边距 16px', Math.abs(apps.finishSize - 38) <= 1 && Math.abs(apps.finishRight - 16) <= 1, JSON.stringify(apps))
  check('M 导航、搜索与列表互不重叠', apps.searchTop - apps.navBottom >= 8 && apps.listTop - apps.searchBottom >= 8, JSON.stringify(apps))
  await shot(page, '08_apps_layout')
  await click(page, '[data-focus-create-step="apps"] [data-app-id="wechat"]')
  await click(page, '[data-focus-finish]')
  check('M 创建完成进入新模式详情', (await text(page, '.fd-hero h1')) === '礼拜专注模式')
  check('M 联系人已在创建流程写入', (await text(page, '.fd-people-preview')).includes('蔡'))
  await shot(page, '05_created_mode')

  await click(page, '[data-focus-delete]')
  check('N 删除有二次确认', await visible(page, '.action-modal-card'))
  await click(page, '.action-modal-card .btn-confirm')
  check('N 删除后回列表且新模式移除', await visible(page, '[data-focus-page="home"]') && await countVisible(page, '[data-focus-mode]') === 5)

  await page.evaluate(() => {
    window.__system?.goHome?.()
    window.__system?.settleOverlay?.('controlCenter', true)
  })
  await page.waitForTimeout(650)
  await click(page, '[data-id="dnd"] .gb-wrap', 400)
  check('O 控制中心 2×1 专注开关展开模式列表', await visible(page, '[data-cc-focus-switcher]') && await countVisible(page, '[data-cc-focus-mode]') === 5)
  await shot(page, '06_cc_focus_switcher')
  await click(page, '[data-cc-focus-mode="personal"] .focus-switcher-main')
  check('O 选择个人模式后列表收起', !(await visible(page, '[data-cc-focus-switcher]')))
  check('O 控制中心磁贴进入激活态', await page.locator('[data-id="dnd"] .gb-body').evaluate(el => getComputedStyle(el).backgroundColor === 'rgb(255, 255, 255)'))

  await click(page, '[data-id="dnd"] .gb-wrap')
  await click(page, '[data-cc-focus-settings="classroom"]', 700)
  check('P 控制中心 … 深链到对应设置详情', await visible(page, '[data-focus-detail="classroom"]'))

  await page.evaluate(() => {
    window.__system?.goHome?.()
    window.__system?.settleOverlay?.('controlCenter', true)
  })
  await page.waitForTimeout(550)
  await click(page, '[data-id="dnd"] .gb-wrap')
  await click(page, '[data-cc-focus-create]')
  check('Q 控制中心新建入口复用完整创建向导', await visible(page, '[data-focus-create-step="templates"]'))
  check('R 全流程无浏览器运行错误', pageErrors.length === 0, pageErrors.join(' | '))

  await browser.close()
  console.log(`\n[focus] ${pass} PASS / ${fail} FAIL`)
  if (fail) {
    console.error(failures.join('\n'))
    process.exitCode = 1
  }
}
run().catch(error => { console.error(error); process.exit(1) })
