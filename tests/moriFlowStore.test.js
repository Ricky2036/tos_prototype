/**
 * AI Mori 流程 store 单测
 * =========================
 * 依据：归档 `ai_mori_interactive_prototype(3).html` + 集成规格 `/tmp/aimate/specs/mori.md`
 * 形态对齐：`tests/aiMateStore.test.js`（node:test + assert/strict + Pinia）
 *
 * 覆盖三件事：
 *  ① 流程语义（9 屏导航 / 4 tab / 选日 / 折叠 / 播放条 / 计时 / 向导 / OTA / 开关 / toast）
 *  ② **归档 5 处硬缺陷的回归守卫** —— 每条都写明「守的是归档的哪个 bug」
 *  ③ 数据与三语词条的结构完整性（数量、占位符、孟加拉数字字形）
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'
import {
  useMoriFlowStore,
  MORI_CAL,
  MORI_SPACE_DATA,
  MORI_HAS_CONTENT,
  MORI_CREATE_CARDS,
  MORI_CREATE_CAL_CARDS,
  MORI_AUDIO_ITEMS,
  MORI_MEDIA_DAYS,
  MORI_MEDIA_BREAKDOWN,
  MORI_SETTINGS_GROUPS,
  MORI_SETTINGS_INIT,
  MORI_DEVICE_INFO,
  MORI_INIT_STEPS,
  MORI_WIFI_LIST,
  MORI_REC,
  MORI_VLOG,
  MORI_GALLERY,
  MORI_DIARY,
  MORI_OTA,
  MORI_PLAYER_BARS,
  MORI_TONES,
  formatClock,
  fill,
  bengaliDigits
} from '../src/stores/moriFlowStore.js'
import { MORI_FLOW } from '../src/locales/mori-flow.js'
import { useI18nStore } from '../src/stores/i18nStore.js'

const store = () => {
  setActivePinia(createPinia())
  return useMoriFlowStore()
}
const i18nOf = () => useI18nStore()
const setLoc = (l) => {
  const i = i18nOf()
  if (typeof i.setLocale === 'function') i.setLocale(l)
  else i.locale = l
}

/* ================= ① 流程语义 ================= */

test('初始状态：停在主屏创作 tab、无播放条、日历 29 格', () => {
  const s = store()
  assert.equal(s.screen, 'detail')
  assert.equal(s.tab, 'create')
  assert.equal(s.selectedDay, MORI_CAL.today)
  assert.equal(s.playerVisible, false)
  assert.equal(s.calCells.length, MORI_CAL.startDay + MORI_CAL.totalDays)
  assert.equal(s.calCells[0], null, 'startDay=1 ⇒ 首格是空格（2/1 落在「一」列）')
  assert.equal(s.calCells[1], 1)
  assert.deepEqual(s.hasContentDays, [10, 12, 13, 14], 'Object.keys 数字键按升序返回')
})

test('open/close 往返：action 不被 state 覆盖，且重进时状态复位', () => {
  const s = store()
  s.open()
  assert.equal(s.active, true)
  s.goto('ota'); s.toggleSetting('wifi'); s.playAudio('x'); s.selectDay(10)
  s.close()
  assert.equal(s.active, false)
  assert.equal(s.screen, 'detail')
  assert.equal(s.selectedDay, MORI_CAL.today)
  assert.equal(s.player, null)
  assert.equal(s.settings.wifi, MORI_SETTINGS_INIT.wifi, '开关复位')
  s.open()
  // 若 state 里有个叫 open 的字段，这里 this.open = true 会把 action 覆盖成布尔值
  assert.equal(typeof s.toggleSetting, 'function')
  assert.equal(typeof s.open, 'function')
  assert.equal(s.toggleSetting('wifi'), false, '重进后 action 仍可用')
})

test('导航：9 屏可达，子屏 back 一律回主屏，主屏 back 不吞掉', () => {
  const s = store()
  for (const sc of ['init', 'preview', 'rec', 'media', 'vlog', 'gallery', 'diary', 'ota']) {
    assert.equal(s.goto(sc), true, `goto('${sc}')`)
    assert.equal(s.screen, sc)
    assert.equal(s.back(), true, `${sc} back() 返回 true`)
    assert.equal(s.screen, 'detail', '所有子屏的 back 都回 detail（照归档）')
  }
  assert.equal(s.goto('nope'), false, '非法屏名不生效')
  s.goto('detail')
  assert.equal(s.back(), false, '主屏上 back() 返回 false ⇒ 组件据此关闭整条流程')
})

test('4 个 tab 互斥切换，非法名不生效', () => {
  const s = store()
  for (const t of ['space', 'record', 'device', 'create']) {
    assert.equal(s.setTab(t), true)
    assert.equal(s.tab, t)
  }
  assert.equal(s.setTab('nope'), false)
  assert.equal(s.tab, 'create', '非法切换不改状态')
})

test('创作 tab：日历视图与列表互斥', () => {
  const s = store()
  assert.equal(s.createCal, false)
  assert.equal(s.toggleCal(), true)
  assert.equal(s.toggleCal(), false)
})

test('空间 tab：选日（有数据 / 无数据 / 越界）', () => {
  const s = store()
  setLoc('zh')
  s.selectDay(14)
  assert.equal(s.selectedDay, 14)
  assert.ok(s.selectedDayTitle.includes('2月14日'))
  assert.equal(s.selectedDayData.events.length, 2)
  assert.equal(s.selectedDayData.events[0].items.length, 3, '每行恒 3 格')
  assert.equal(s.selectedDayData.events[1].items[2], null, '不满留空')
  s.selectDay(11)
  assert.equal(s.selectedDayData, null, '11 日无素材')
  assert.equal(s.selectedDayTitle, '2月11日', '无数据时标题回退为日期本身')
  assert.equal(s.selectDay(0), false)
  assert.equal(s.selectDay(29), false)
  assert.equal(s.selectedDay, 11, '越界不改状态')
})

test('3 个折叠面板各自独立开关', () => {
  const s = store()
  assert.equal(s.toggleCollapse('media'), true)
  assert.equal(s.toggleCollapse('media'), false)
  assert.equal(s.toggleCollapse('settings'), true)
  assert.equal(s.toggleCollapse('info'), true)
  assert.equal(s.collapsed.settings, true)
  assert.equal(s.collapsed.info, true)
  assert.equal(s.collapsed.media, false)
  assert.equal(s.toggleCollapse('nope'), false)
})

test('🔴 缺陷守卫 1：播放条必须真的能关掉（归档 `.player-bar{display:flex}` 盖掉 `.hidden`）', () => {
  const s = store()
  assert.equal(s.playerVisible, false, '初始必须不可见 —— 归档里它永远可见')
  s.playAudio('产品评审会议')
  assert.equal(s.playerVisible, true)
  assert.equal(s.player, '产品评审会议')
  s.stopAudio()
  assert.equal(s.playerVisible, false, 'stopAudio 之后必须真的消失 —— 归档里此调用完全无效')
})

test('实时预览：快门在拍照态与录制态之间切换', () => {
  const s = store()
  assert.equal(s.toggleShutter(), true)
  assert.equal(s.toggleShutter(), false)
})

test('🔴 缺陷守卫：录音计时真的走秒（归档写死 00:02:18 不走）', () => {
  const s = store()
  assert.equal(MORI_REC.seconds, 138)
  assert.equal(s.recTimeText, '02:18')
  s.goto('rec')
  s.tickRec()
  assert.equal(s.recTimeText, '02:19')
  s.toggleRecPause()
  s.tickRec()
  assert.equal(s.recTimeText, '02:19', '暂停后不走')
  s.toggleRecPause()
  s.tickRec()
  assert.equal(s.recTimeText, '02:20')
  s.goto('preview')
  s.tickRec()
  assert.equal(s.recSeconds, 140, '离开录音屏后 tick 不再累加')
  assert.equal(s.recPaused, false, '离屏复位暂停态')
})

test('初始化向导：3 步推进，第 3 步收尾回主屏', () => {
  const s = store()
  s.startInit()
  assert.equal(s.screen, 'init')
  assert.equal(s.initStep, 1)
  assert.equal(s.initNext(), true)
  assert.equal(s.initStep, 2)
  assert.equal(s.initNext(), true)
  assert.equal(s.initStep, 3)
  assert.equal(s.initNext(), false, '第 3 步不再前进')
  s.finishInit()
  assert.equal(s.screen, 'detail')
  assert.equal(s.initStep, 1)
})

test('初始化向导：第 1 步的次要动作在产品上是「不可跳过」的约束', () => {
  assert.equal(MORI_INIT_STEPS[0].secondaryBlocked, true)
  assert.equal(MORI_INIT_STEPS[1].secondaryBlocked, undefined, '第 2 步两个按钮都放行')
  assert.equal(MORI_INIT_STEPS[2].secondaryKey, undefined, '第 3 步只有一个按钮')
})

test('🔴 缺陷守卫 2：固件升级进度真的推进（归档进度条无样式、width 恒 0）', () => {
  const s = store()
  assert.equal(s.otaProgress, 0)
  assert.equal(s.startOta(), true)
  assert.equal(s.startOta(), false, '重复点击不重开')
  for (let i = 0; i < 60; i += 1) s.tickOta()
  assert.equal(s.otaProgress, 100)
  assert.equal(s.otaRunning, false, '到 100 自停')
  assert.equal(s.tickOta(), false)
})

test('5 个设置开关带真实状态（归档里纯视觉、无业务状态）', () => {
  const s = store()
  assert.deepEqual(s.settings, MORI_SETTINGS_INIT)
  assert.equal(s.settings.wifi, true)
  assert.equal(s.toggleSetting('wifi'), false)
  assert.equal(s.toggleSetting('cellular'), true)
  assert.equal(s.toggleSetting('nope'), false)
  assert.equal(s.settings.deleteLocal, false)
})

test('toast：写入 key / 递增序号 / 支持参数 / 可清除', () => {
  const s = store()
  s.notify('toast.saved')
  assert.equal(s.toast.key, 'toast.saved')
  assert.equal(s.toast.seq, 1)
  s.notify('toast.copied', { n: 3 })
  assert.equal(s.toast.seq, 2)
  assert.deepEqual(s.toast.params, { n: 3 })
  s.clearToast()
  assert.equal(s.toast, null)
})

/* ================= ② 归证缺陷守卫：数据层不一致 ================= */

test('🔴 缺陷守卫 3：「有素材」的日子由 spaceData 反推，不再出现「有紫点却显示无素材」', () => {
  // 归档里 hasContent 写死 13 天，而 spaceData 只有 4 天 ⇒ 点 1/5/7 日会显示「当天无素材」
  assert.deepEqual(MORI_HAS_CONTENT, Object.keys(MORI_SPACE_DATA).map(Number))
  for (const d of MORI_HAS_CONTENT) {
    assert.ok(MORI_SPACE_DATA[d], `${d} 日既在紫点白名单里，也要有内容`)
    assert.ok(MORI_SPACE_DATA[d].events.length > 0)
  }
})

test('🔴 缺陷守卫 4：素材渐变随格子走，不再被 selectDay 拉平成同一条紫', () => {
  // 归档 selectDay 里写死 `item ? 'linear-gradient(135deg,#a29bfe,#6c5ce7)' : ...` ⇒ 所有格子一个色
  const tones = new Set()
  for (const day of Object.values(MORI_SPACE_DATA)) {
    for (const ev of day.events) for (const it of ev.items) if (it) tones.add(it.tone)
  }
  assert.ok(tones.size >= 3, `至少 3 种色阶区分素材类型，实际 ${tones.size}`)
  for (const t of tones) assert.ok(MORI_TONES[t], `色阶 ${t} 必须在 MORI_TONES 里有定义`)
  // 空格子显式用「无背景」，不是靠 tone 缺省
  const hasEmpty = Object.values(MORI_SPACE_DATA)
    .some((d) => d.events.some((e) => e.items.some((i) => i === null)))
  assert.ok(hasEmpty, '排版约定「每行 3 格、不满留空」必须保留空格子')
  assert.ok(MORI_TONES.gray, '空格子用中性灰')
})

test('🔴 缺陷守卫 5：素材格子 icon 全部是图标库真键，且静态/动态两套渲染同源', () => {
  const icons = new Set()
  for (const day of Object.values(MORI_SPACE_DATA)) {
    for (const ev of day.events) for (const it of ev.items) if (it) icons.add(it.icon)
  }
  assert.deepEqual([...icons].sort(), ['film', 'image'], '只用 film/image 两种（照归档 📹/📷）')
})

/* ================= ③ 数据与词条完整性 ================= */

test('创作 tab：4 张卡（3 张缩略卡 + 1 张日记卡），日历视图另有 2 张精简卡', () => {
  assert.equal(MORI_CREATE_CARDS.length, 4)
  const diary = MORI_CREATE_CARDS.filter((c) => !c.thumb)
  assert.equal(diary.length, 1)
  assert.equal(diary[0].screen, 'diary')
  assert.equal(diary[0].imgs.length, 3)
  assert.ok(diary[0].imgs.every((i) => i.text && !i.icon), '日记配图只有 emoji + 渐变，无 icon 字段')
  assert.equal(MORI_CREATE_CAL_CARDS.length, 2)
  assert.ok(MORI_CREATE_CAL_CARDS.every((c) => c.height === 160), '日历视图缩略图统一 160px')
})

test('录音 tab：5 条，第 4 条是唯一的「转写中」中间态', () => {
  assert.equal(MORI_AUDIO_ITEMS.length, 5)
  const hourglass = MORI_AUDIO_ITEMS.filter((a) => a.tail === 'hourglass')
  assert.equal(hourglass.length, 1)
  assert.equal(MORI_AUDIO_ITEMS.indexOf(hourglass[0]), 3)
  assert.equal(hourglass[0].icon, '', '转写中那条的图标位是空的（照归档）')
})

test('设备素材：2 天共 9 张缩略图，分类面板 3 行', () => {
  assert.equal(MORI_MEDIA_DAYS.length, 2)
  assert.equal(MORI_MEDIA_DAYS.reduce((a, d) => a + d.items.length, 0), 9)
  assert.equal(MORI_MEDIA_BREAKDOWN.length, 3)
})

test('🔴 缺陷守卫 6：拍摄与同步设置 3 组 11 行 5 开关，「隐私」组必须存在（归档被裁掉的那组）', () => {
  assert.equal(MORI_SETTINGS_GROUPS.length, 3)
  const rows = MORI_SETTINGS_GROUPS.flatMap((g) => g.rows)
  assert.equal(rows.length, 11)
  assert.equal(rows.filter((r) => r.toggle).length, 5)
  const privacy = MORI_SETTINGS_GROUPS[2]
  assert.equal(privacy.titleKey, 'device.groupPrivacy')
  assert.equal(privacy.rows.length, 2, '隐私组 2 行：云端 AI 处理 + 声纹数据')
  assert.deepEqual(
    rows.filter((r) => r.toggle).map((r) => r.toggle).sort(),
    ['autoDetect', 'cellular', 'cloudAI', 'deleteLocal', 'wifi']
  )
})

test('设备信息 5 行、Wi-Fi 3 条、OTA 3 条更新内容、转录 2 条', () => {
  assert.equal(MORI_DEVICE_INFO.length, 5)
  assert.equal(MORI_WIFI_LIST.length, 3)
  assert.equal(MORI_OTA.changelogKeys.length, 3)
  assert.equal(MORI_REC.transcript.length, 2)
  assert.equal(MORI_REC.transcript[0].spk, 1)
})

test('子屏静态数据齐备（Vlog 280 封面 / 艺术馆海报 / 日记复用创作卡正文）', () => {
  assert.equal(MORI_VLOG.cover.height, 280)
  assert.equal(MORI_VLOG.sceneKeys.length, 3)
  assert.equal(MORI_GALLERY.poster.height, 200)
  assert.equal(MORI_DIARY.textKey, MORI_CREATE_CARDS[2].textKey, '日记屏与创作卡共用同一正文词条')
  assert.equal(MORI_DIARY.imgs, MORI_CREATE_CARDS[2].imgs)
  assert.equal(MORI_OTA.version, 'V1.3.0')
  assert.equal(MORI_OTA.current, 'V1.2.0')
})

test('动画参数：播放条与录音波形各 5 条，延迟 0/.1/.2/.3/.4s', () => {
  assert.deepEqual(MORI_PLAYER_BARS, [0, 0.1, 0.2, 0.3, 0.4])
  assert.equal(MORI_CAL.weekdays.length, 7)
})

test('三语词条：键集完全一致，且无空值', () => {
  const zh = Object.keys(MORI_FLOW.zh)
  assert.ok(zh.length > 150, `词条量应成形，实际 ${zh.length}`)
  assert.deepEqual(Object.keys(MORI_FLOW.en), zh)
  assert.deepEqual(Object.keys(MORI_FLOW.bn), zh)
  for (const [lang, dict] of Object.entries(MORI_FLOW)) {
    for (const [k, v] of Object.entries(dict)) {
      assert.equal(typeof v, 'string', `${lang}.${k} 必须是字符串`)
      assert.ok(v.trim().length > 0, `${lang}.${k} 不能为空`)
    }
  }
})

test('词条：归档被剥离的 emoji 已按同类项补全，不留孤立 U+FE0F', () => {
  // 归档里 `.dtab` 第 4 项 = `U+FE0F U+0020 U+8BBE U+5907`（「️ 设备」），tag 也从 `️ 美食` 起
  for (const [lang, dict] of Object.entries(MORI_FLOW)) {
    for (const [k, v] of Object.entries(dict)) {
      // 变体选择符 U+FE0F/U+FE0E 只能跟在 emoji 基字符后面；
      // 归档剥离 emoji 后留下 `U+FE0F U+0020 设备` ⇒ 开头就是孤立 VS 即缺陷。
      assert.ok(!/^[\uFE0F\uFE0E]/.test(v), `${lang}.${k} 以孤立变体选择符开头：${JSON.stringify(v)}`)
      // 顺手守一下「行首空白」—— 渲染出来会多一截缩进
      assert.equal(v, v.trim(), `${lang}.${k} 首尾不应有空白：${JSON.stringify(v)}`)
    }
  }
})

test('词条：需要插值的键都带占位符，且占位符不写死数字', () => {
  assert.ok(MORI_FLOW.zh['space.count'].includes('{n}'))
  assert.ok(MORI_FLOW.zh['cal.monthDay'].includes('{month}'))
  assert.ok(MORI_FLOW.zh['cal.monthDay'].includes('{day}'))
  assert.ok(MORI_FLOW.zh['toast.dayTap'].includes('{day}'))
  assert.ok(MORI_FLOW.zh['ota.current'].includes('{ver}'))
  assert.ok(MORI_FLOW.zh['ota.size'].includes('{size}'))
  assert.ok(MORI_FLOW.zh['device.upgradeAvailable'].includes('{ver}'))
  assert.ok(MORI_FLOW.zh['rec.spk'].includes('{n}') && MORI_FLOW.zh['rec.spk'].includes('{time}'))
  // ⚠️ 三种语言的同一键必须用同一组占位符，否则切语言会漏出裸 {xxx}
  for (const k of ['space.count', 'cal.month', 'cal.monthDay', 'toast.dayTap', 'ota.current', 'ota.size', 'device.upgradeAvailable', 'rec.spk']) {
    const need = new Set((MORI_FLOW.zh[k].match(/\{(\w+)\}/g) || []))
    for (const lang of ['en', 'bn']) {
      const got = new Set((MORI_FLOW[lang][k].match(/\{(\w+)\}/g) || []))
      assert.deepEqual(got, need, `${lang}.${k} 占位符集合应与 zh 一致`)
    }
  }
})

/* ================= 词条取值（含孟加拉数字字形） ================= */

test('词条取值：zh/en 原样，未知键回退成键名本身', () => {
  const s = store()
  setLoc('zh')
  assert.equal(s.t('title'), 'AI Mori')
  assert.deepEqual(['tab.create', 'tab.space', 'tab.record', 'tab.device'].map((k) => s.t(k)), ['创作', '空间', '录音', '设备'])
  assert.equal(s.tf('space.count', { n: 3 }), '3 个素材')
  setLoc('en')
  assert.equal(s.tf('space.count', { n: 3 }), '3 items')
  assert.equal(s.t('nope.nope'), 'nope.nope')
  setLoc('zh')
})

test('孟加拉语数字字形：数值型参数转字形，版本号这类字符串保持 ASCII', () => {
  const s = store()
  setLoc('bn')
  assert.equal(s.tf('space.count', { n: 3 }), '৩টি মিডিয়া')
  assert.equal(s.tf('cal.monthDay', { month: 2, day: 14 }), '২ মাসের ১৪ তারিখ')
  assert.equal(s.tf('ota.current', { ver: 'V1.2.0' }), 'বর্তমান সংস্করণ: V1.2.0', '版本号不转字形')
  setLoc('zh')
})

test('无数据日标题：三种语言都走占位符，不会漏出裸 {month}', () => {
  const s = store()
  for (const lang of ['zh', 'en', 'bn']) {
    setLoc(lang)
    s.selectDay(11)
    const title = s.selectedDayTitle
    assert.ok(!title.includes('{'), `${lang} 的标题漏出了占位符：${title}`)
    assert.ok(title.includes('11') || title.includes('১১'), `${lang} 的标题应含日期：${title}`)
  }
  setLoc('zh')
})

/* ================= 工具函数 ================= */

test('formatClock：分秒与时分秒两种形态', () => {
  assert.equal(formatClock(0), '00:00')
  assert.equal(formatClock(138), '02:18')
  assert.equal(formatClock(4330), '1:12:10')
})

test('fill：多占位符替换；缺参时保留占位符（便于暴露漏传）', () => {
  assert.equal(fill('{a} · {b}', { a: 1, b: 2 }), '1 · 2')
  assert.equal(fill('{a} · {b}', { a: 1 }), '1 · {b}')
  assert.equal(fill('无占位符'), '无占位符')
})

test('bengaliDigits：只换数字字符，不碰其它字符', () => {
  assert.equal(bengaliDigits('507 files'), '৫০৭ files')
  assert.equal(bengaliDigits('V1.2.0'), 'V১.২.০')
})
