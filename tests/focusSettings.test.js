import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { createDefaultFocusModes, focusShortName, formatRepeat, formatSchedule, useFocusSettingsStore } from '../src/stores/focusSettingsStore.js'
import { useControlStore } from '../src/stores/controlStore.js'

const read = p => fs.readFileSync(path.resolve(p), 'utf8')
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
function fresh() {
  setActivePinia(createPinia())
  return useFocusSettingsStore()
}

test('专注模式默认清单与参考录屏一致', () => {
  const modes = createDefaultFocusModes()
  assert.deepEqual(modes.map(m => m.id), ['dnd', 'personal', 'work', 'sleep', 'classroom'])
  const classroom = modes.find(m => m.id === 'classroom')
  assert.equal(classroom.name, '课堂专注模式')
  assert.equal(classroom.icon, 'graduationCap')
  assert.equal(classroom.schedules.length, 5)
  assert.deepEqual(classroom.filters, ['lowPower', 'silent'])
  assert.deepEqual(classroom.allowedApps, ['wechat', 'mori'])
})

test('激活、切换和关闭统一驱动设置、控制中心与状态栏开关', () => {
  const focus = fresh()
  const control = useControlStore()
  assert.equal(focus.activate('classroom'), true)
  assert.equal(focus.state.activeId, 'classroom')
  assert.equal(control.dnd, true)
  assert.equal(control.doNotDisturb, true)
  focus.toggle('classroom')
  assert.equal(focus.state.activeId, null)
  assert.equal(control.dnd, false)
  assert.equal(control.doNotDisturb, false)
  assert.equal(focus.activate('missing'), false)
})

test('创建、编辑与删除自定义模式形成完整闭环', () => {
  const focus = fresh()
  assert.equal(focus.createMode({ name: '  ' }), null)
  const id = focus.createMode({ name: '礼拜', icon: 'graduationCap', color: '#5E5CE6', allowedPeople: ['蔡'], allowedApps: ['wechat'] })
  assert.ok(id.startsWith('custom-'))
  assert.equal(focus.getMode(id).name, '礼拜专注模式')
  assert.equal(focus.getMode(id).custom, true)
  focus.updateMode(id, { name: '自习专注模式', smartActivation: true })
  assert.equal(focus.getMode(id).name, '自习专注模式')
  assert.equal(focus.getMode(id).smartActivation, true)
  assert.equal(focus.deleteMode('dnd'), false, '系统预设不可删除')
  assert.equal(focus.deleteMode(id), true)
  assert.equal(focus.getMode(id), null)
})

test('联系人、App、屏幕、三类定时与过滤条件均真实落库', () => {
  const focus = fresh()
  focus.togglePerson('classroom', 'Ricky')
  assert.ok(focus.getMode('classroom').allowedPeople.includes('Ricky'))
  focus.toggleApp('classroom', 'camera')
  assert.ok(focus.getMode('classroom').allowedApps.includes('camera'))
  assert.equal(focus.setScreen('classroom', 'lock', 'ocean'), true)
  assert.equal(focus.getMode('classroom').screens.lock, 'ocean')
  const timeId = focus.addSchedule('classroom', { type: 'time', start: '20:20', end: '20:30', days: [5] })
  assert.ok(timeId)
  focus.updateSchedule('classroom', timeId, { end: '21:00', days: [1, 5] })
  assert.equal(focus.getMode('classroom').schedules.find(s => s.id === timeId).end, '21:00')
  const locationId = focus.addSchedule('classroom', { type: 'location', name: '公司' })
  const appId = focus.addSchedule('classroom', { type: 'app', appId: 'camera', name: '相机' })
  assert.ok(locationId && appId)
  focus.removeSchedule('classroom', locationId)
  assert.equal(focus.getMode('classroom').schedules.some(s => s.id === locationId), false)
  focus.toggleFilter('classroom', 'darkAppearance')
  assert.ok(focus.getMode('classroom').filters.includes('darkAppearance'))
  focus.setFilterValue('classroom', 'calendars', ['学习'])
  assert.deepEqual(focus.getMode('classroom').filterValues.calendars, ['学习'])
  focus.setOption('classroom', 'hideBadges', true)
  assert.equal(focus.getMode('classroom').options.hideBadges, true)
})

test('列表短名称与定时副标题格式化正确', () => {
  assert.equal(focusShortName({ id: 'dnd', name: '勿扰模式' }), '勿扰模式')
  assert.equal(focusShortName({ id: 'custom', name: '礼拜专注模式' }), '礼拜')
  assert.equal(formatSchedule({ type: 'time', start: '09:00', end: '10:00' }), '09:00–10:00')
  assert.equal(formatRepeat([0, 1, 2, 3, 4, 5, 6]), '每天')
  assert.equal(formatRepeat([1, 5]), '周一、周五')
})

test('设置入口、深链、逐层返回与控制中心 2×1 开关全部接线', () => {
  const app = strip(read('src/components/apps/settings/SettingsApp.vue'))
  assert.match(app, /title="Infinix AI"[\s\S]*?data-setting-row="focus"[\s\S]*?title="模式和日常程序"/)
  assert.match(app, /view\.value === 'focus' && focusRef\.value\?\.back/)
  assert.match(app, /<SettingsFocus ref="focusRef" @back="pop"/)
  const cc = strip(read('src/components/system/ControlCenter.vue'))
  assert.match(cc, /id: 'dnd'[^}]+defaultSize: '2x1'/)
  assert.match(cc, /id === 'dnd'\) \{\s*focusSwitcherOpen\.value = true/)
  assert.match(cc, /notifications\.targetView = 'focus'/)
  const tile = strip(read('src/components/system/cc/GridButton.vue'))
  assert.match(tile, /item\.id === 'dnd'[\s\S]*?专注模式/)
  const layout = read('src/utils/privacyControlLayout.js')
  assert.match(layout, /\['dnd','toggle','2x1'\]/)
  const oldDnd = strip(read('src/components/apps/settings/SettingsDND.vue'))
  assert.match(oldDnd, /focus\.activate\('dnd'\)/)
})

test('专注创建流程版式契约：图标间距、单列对齐与 App 页结构', () => {
  const create = strip(read('src/components/apps/settings/focus/FocusCreateFlow.vue'))
  const home = strip(read('src/components/apps/settings/focus/FocusHome.vue'))
  const allowed = strip(read('src/components/apps/settings/focus/FocusAllowedFlow.vue'))
  const modeCard = strip(read('src/components/apps/settings/focus/FocusNotificationModeCard.vue'))

  // 首页列表的自定义图标插槽不会命中 ListCell 的默认间距，必须显式补 12px。
  assert.match(home, /\.focus-row-glyph\s*\{[^}]*margin-right:\s*12px/)
  // 联系人页使用卡片示意插图，而非一个孤立圆形图标。
  assert.match(create, /data-focus-people-hero/)
  assert.match(create, /\.fc-people-check/)
  // 通知模式卡只出现一次（联系人选择页）；App 页保持标题 + 搜索 + 列表。
  assert.equal((create.match(/<FocusNotificationModeCard/g) || []).length, 1)
  assert.match(allowed, /<FocusNotificationModeCard/)
  // 图标、文案、勾选是三列固定网格，避免图标浮在文字中间。
  assert.match(modeCard, /grid-template-columns:\s*22px minmax\(0, 1fr\) 22px/)
  assert.match(modeCard, /font:\s*400 14px/)
  // 真机是整块淡紫灰底，两行同色；选中只翻蓝勾，不整行翻白。
  assert.match(modeCard, /\.focus-mode-card \{[^}]*background:\s*#ECEBF4/)
  assert.doesNotMatch(modeCard, /\.focus-mode-card button\s*\{[^}]*background:\s*#fff/)
  assert.match(modeCard, /\.fmc-badge \{[^}]*background:\s*#34C759/)
  // 联系人页：未选时只给一个「添加」空槽，选完变胶囊行 + 空槽。
  assert.match(create, /data-focus-add-person/)
  assert.match(create, /data-focus-people-picker/)
  assert.match(create, /<SheetModal[^>]*:visible="showPeoplePicker"/)
  assert.match(create, /\.fc-add-person \{[^}]*border-radius:\s*16px[^}]*background:\s*#ECEBF4/)
  assert.match(create, /\.fc-add-plus \{[^}]*width:\s*44px[^}]*height:\s*44px/)
  assert.doesNotMatch(create, /fc-contact-cloud/)
  // App 页右上角是圆形勾选，不再用文字胶囊。
  assert.match(create, /\.fc-next\.fc-done\s*\{[^}]*background:\s*#0A84FF/)
  // 介绍页说明文字使用独立子选择器，不能命中 LIcon 的根 span 并把它拉伸。
  assert.match(create, /\.fc-intro-points > div > span:nth-child\(2\)\s*\{[^}]*font-size:\s*13px/)
  assert.doesNotMatch(create, /\.fc-intro-points span\s*\{/)
})

test('专注详情与过滤页版式契约：设备示意图、行内居中与说明文字缩进', () => {
  const detail = strip(read('src/components/apps/settings/focus/FocusDetail.vue'))
  const art = strip(read('src/components/apps/settings/focus/FocusDeviceArt.vue'))
  const picker = strip(read('src/components/apps/settings/focus/FocusScreenPicker.vue'))
  const filters = strip(read('src/components/apps/settings/focus/FocusFiltersFlow.vue'))

  // 「自定义屏幕」用设备示意图，而不是三个圆形图标占位。
  assert.match(detail, /import FocusDeviceArt from '\.\/FocusDeviceArt\.vue'/)
  assert.equal((detail.match(/<FocusDeviceArt/g) || []).length, 1)
  assert.doesNotMatch(detail, /fd-screen-preview/)
  // 三列共用等高占位块 + 底部对齐，标签才会共线。
  assert.match(detail, /\.fd-screen-slot\s*\{[^}]*height:\s*157px[^}]*align-items:\s*flex-end/)
  assert.match(detail, /\.fd-screens-card > button > strong\s*\{[^}]*margin-top:\s*7px/)
  // 设备示意图三种形态齐备，且按 --s 等比缩放。
  for (const kind of ['is-lock', 'is-home', 'is-watch']) assert.ok(art.includes(`.fda.${kind}`) || art.includes(`.fda.${kind},`), `缺少 ${kind} 形态`)
  assert.match(art, /--s:\s*1/)
  assert.match(art, /calc\(72px \* var\(--s\)\)/)
  assert.match(art, /calc\(62px \* var\(--s\)\)/)
  // 屏幕选取页用专门的页面缩略图与插图，不再复用设备示意图。
  assert.match(picker, /import FocusScreenArt from '\.\/FocusScreenArt\.vue'/)
  assert.match(picker, /import FocusScreenPreview from '\.\/FocusScreenPreview\.vue'/)
  assert.doesNotMatch(picker, /FocusDeviceArt/)
  assert.doesNotMatch(picker, /fsp-app-grid/)
  // 智能启用行固定行高，图标/文字/开关同轴。
  assert.match(detail, /\.fd-smart-row, \.fd-schedule-row \{[^}]*height:\s*58px[^}]*align-items:\s*center/)
  // ⚠️ 文字块只能选到 div 内部：`.fd-smart-row span` 会命中 FocusGlyph 根 span 导致图标不居中。
  assert.doesNotMatch(detail, /\.fd-smart-row span\s*[,{]/)
  assert.match(detail, /\.fd-smart-row > div > span/)
  // 开关右缘按 4px 内缩，与下方各行箭头尖端同一条竖线。
  assert.match(detail, /\.fd-tail \{[^}]*padding-right:\s*4px/)
  // 过滤页说明文字必须有左右安全边距与上间距。
  assert.match(filters, /\.filter-note \{[^}]*margin:\s*8px 6px 0/)
})

test('专注子页沿用设置页 16px 安全边距', () => {
  const shell = strip(read('src/components/apps/settings/subpage/SubPageShell.vue'))
  // 外壳只保留一套口径：内容区左右 16px。专注页不做例外覆盖。
  assert.match(shell, /\.sub-body \{[^}]*padding:\s*calc\(var\(--nav-h\) \+ 10px\) 16px 0/)
  assert.doesNotMatch(shell, /gutter/)

  const focusFiles = fs.readdirSync('src/components/apps/settings/focus').filter(f => f.endsWith('.vue'))
  const shellUsers = focusFiles.filter(f => strip(read(`src/components/apps/settings/focus/${f}`)).includes('<SubPageShell'))
  assert.ok(shellUsers.length >= 5, `使用 SubPageShell 的专注页只有 ${shellUsers.length} 个`)
  for (const file of shellUsers) {
    assert.doesNotMatch(strip(read(`src/components/apps/settings/focus/${file}`)), /:gutter/, `${file} 不应单独覆盖内边距`)
  }

  // 详情页不走外壳，内容区同样 16px。
  assert.match(strip(read('src/components/apps/settings/focus/FocusDetail.vue')), /\.fd-body \{[^}]*padding:[^;]*16px/)
  // 创建流程的联系人 / App 步内边距同理。
  assert.match(strip(read('src/components/apps/settings/focus/FocusCreateFlow.vue')), /\.fc-selection \{[^}]*padding:\s*9px 16px 40px/)
  // 时间页：行高 44、星期圆点 33 且左右 24px 内缩（真机实测）。
  const schedule = strip(read('src/components/apps/settings/focus/FocusScheduleFlow.vue'))
  assert.match(schedule, /\.time-card > button \{[^}]*min-height:\s*44px[^}]*padding:\s*0 16px/)
  assert.match(schedule, /\.weekday-row \{[^}]*padding:\s*12px 24px/)
  assert.match(schedule, /\.weekday-row button \{[^}]*width:\s*33px[^}]*height:\s*33px/)
})

test('屏幕选取页版式契约：无导航标题、无文字标签、页面缩略图', () => {
  const picker = strip(read('src/components/apps/settings/focus/FocusScreenPicker.vue'))
  const art = strip(read('src/components/apps/settings/focus/FocusScreenArt.vue'))
  const preview = strip(read('src/components/apps/settings/focus/FocusScreenPreview.vue'))

  // 真机导航栏只有左侧关闭 + 右侧蓝勾，标题在内容区里居中显示。
  assert.match(picker, /title="" back-icon="close"/)
  assert.match(picker, /\.fsp-confirm\s*\{[^}]*background:\s*#007AFF/)
  assert.match(picker, /class="fsp-title"/)
  // 「创建新的锁屏」只有锁屏页有；主屏幕页没有。
  assert.match(picker, /v-if="type === 'lock'" class="fsp-create"/)
  // 分组标题：锁屏「从锁屏中选取」，主屏幕「从你的页面中选取」。
  assert.match(picker, /'从锁屏中选取'/)
  assert.match(picker, /'从你的页面中选取'/)
  // 缩略图下方只有单选圆点，不渲染名称标签。
  assert.doesNotMatch(picker, /\{\{\s*option\.name\s*\}\}/)
  assert.match(picker, /\.fsp-pages\s*\{[^}]*gap:\s*23px/)
  assert.match(picker, /\.fsp-frame\s*\{[^}]*width:\s*84px[^}]*height:\s*195px/)
  // 表盘缩略图接近方形，不能沿用手机的竖长条。
  assert.match(picker, /\.fsp-frame\.is-watch\s*\{[^}]*height:\s*104px/)
  assert.match(picker, /\.fsp-radio\s*\{[^}]*width:\s*26px[^}]*height:\s*26px[^}]*margin-top:\s*12px/)

  // 顶部插图：灰色底板 + 高亮竖卡 + 白色圆形徽标。
  for (const cls of ['.fsa-board', '.fsa-card', '.fsa-badge', '.fsa-cap']) assert.ok(art.includes(cls), `插图缺少 ${cls}`)
  // 缩略图内容：主屏幕是图标阵列 + 程序坞，锁屏是时间 + 快捷圆点。
  assert.match(preview, /class="th-icons"/)
  assert.match(preview, /class="th-dock"/)
  assert.match(preview, /class="th-lockinfo"/)
  assert.match(preview, /class="th-quick"/)
})

test('专注模块图标契约：不手绘 SVG，所有 LIcon 名称均已注册', () => {
  const files = [
    ...fs.readdirSync('src/components/apps/settings/focus').filter(f => f.endsWith('.vue')).map(f => `src/components/apps/settings/focus/${f}`),
    'src/components/system/cc/FocusSwitcher.vue'
  ]
  const exported = read('src/assets/icons/lucide.js').split('export const LUCIDE')[1]
  for (const file of files) {
    const src = strip(read(file))
    assert.equal((src.match(/<svg\b/g) || []).length, 0, `${file} 出现手绘 SVG`)
    for (const match of src.matchAll(/<LIcon[^>]*(?<!:)\bname="([A-Za-z0-9]+)"/g)) {
      assert.ok(new RegExp(`\\b${match[1]}\\b`).test(exported), `${file} 使用未注册图标 ${match[1]}`)
    }
  }
})
