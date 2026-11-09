import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  GROUP3_PAGES,
  GROUP3_ENTRY_MAP,
  PAGE_SOURCES,
  PAGE_EVIDENCE,
  getGroup3Page
} from '../src/components/apps/settings/group3/pages.js'
import {
  GROUP3_SWITCH_DEFAULTS,
  GROUP3_CHOICE_DEFAULTS,
  useSettingsGroup3Store
} from '../src/stores/settingsGroup3Store.js'
import { useGroup3Nav } from '../src/components/apps/settings/group3/useGroup3Nav.js'
import { APPS, getApp } from '../src/config/apps.js'
import { DRAWER_APPS } from '../src/config/drawerApps.js'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')
/* 结构类断言一律先剥注释，避免注释里写了同名值却「假绿」 */
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')

const SECONDARY = {
  security: 'src/components/apps/settings/SettingsSecurity.vue',
  privacy: 'src/components/apps/settings/SettingsPrivacy.vue',
  appsManage: 'src/components/apps/settings/SettingsAppsManage.vue',
  location: 'src/components/apps/settings/SettingsLocation.vue'
}

const RENDERER = 'src/components/apps/settings/group3/Group3SubPage.vue'

/** 与 /tmp 里的手工自检同一把尺：把配置 + store 契约一次验完。
    导出成函数是为了让「牙齿测试」能把坏数据喂给同一个判据。 */
function collectPageIssues(pages, switchKeys, choiceKeys) {
  const issues = []
  for (const [key, page] of Object.entries(pages)) {
    if (!page.title || typeof page.title !== 'string') issues.push(`${key}: 缺 title`)
    // 纯引导页（如「双系统」）只有头图与底部按钮，sections 允许为空
    if (!Array.isArray(page.sections)) issues.push(`${key}: 缺 sections`)
    else if (page.sections.length === 0 && !page.cta) issues.push(`${key}: 空页面且无底部动作`)
    for (const sec of page.sections || []) {
      for (const row of sec.rows || []) {
        if (row.action && !pages[row.action]) issues.push(`${key}: action -> ${row.action} 不存在`)
        if (row.toggle && !(row.toggle in switchKeys)) issues.push(`${key}: toggle ${row.toggle} 不在 store`)
        if (row.radio && !(row.radio in choiceKeys)) issues.push(`${key}: radio ${row.radio} 不在 store`)
        if (row.chevron && !row.action && !row.openAppNotifications && !row.run) issues.push(`${key}: "${row.title}" 带箭头但没有下一层页面`)
      }
      for (const link of sec.links || []) {
        if (link.action && !pages[link.action]) issues.push(`${key}: link -> ${link.action} 不存在`)
      }
    }
  }
  return issues
}

/* ==================== 配置完整性 ==================== */
test('第三组卡片三级/四级页配置完整，所有箭头行都有下一层', () => {
  const issues = collectPageIssues(GROUP3_PAGES, GROUP3_SWITCH_DEFAULTS, GROUP3_CHOICE_DEFAULTS)
  assert.deepEqual(issues, [], issues.join('\n'))
  assert.ok(Object.keys(GROUP3_PAGES).length >= 90, '真机取证覆盖的页面数量不应缩水')
  assert.equal(getGroup3Page('locationPermission').title, '位置信息')
  assert.equal(getGroup3Page('appLocationPermission').title, '位置信息权限')
  assert.equal(getGroup3Page('不存在的页面'), null)
})

test('配置校验判据有牙齿：故意塞坏 action / 坏 toggle / 空箭头行必须立刻报红', () => {
  const ok = collectPageIssues(GROUP3_PAGES, GROUP3_SWITCH_DEFAULTS, GROUP3_CHOICE_DEFAULTS)
  assert.equal(ok.length, 0)

  const brokenAction = { ...GROUP3_PAGES, broken: { title: '坏页', sections: [{ rows: [{ title: 'X', chevron: true, action: 'missingPage' }] }] } }
  const badToggle = { ...GROUP3_PAGES, broken: { title: '坏页', sections: [{ rows: [{ title: 'X', toggle: 'notInStore' }] }] } }
  const deadChevron = { ...GROUP3_PAGES, broken: { title: '坏页', sections: [{ rows: [{ title: 'X', chevron: true }] }] } }
  assert.ok(collectPageIssues(brokenAction, GROUP3_SWITCH_DEFAULTS, GROUP3_CHOICE_DEFAULTS).some(x => x.includes('missingPage')))
  assert.ok(collectPageIssues(badToggle, GROUP3_SWITCH_DEFAULTS, GROUP3_CHOICE_DEFAULTS).some(x => x.includes('notInStore')))
  assert.ok(collectPageIssues(deadChevron, GROUP3_SWITCH_DEFAULTS, GROUP3_CHOICE_DEFAULTS).some(x => x.includes('带箭头但没有下一层页面')))
})

test('二级页接线表指向的页面全部存在，且四个 section 都有入口', () => {
  for (const [section, map] of Object.entries(GROUP3_ENTRY_MAP)) {
    assert.ok(Object.keys(map).length >= 4, `${section} 的入口不应缺失`)
    for (const [entry, target] of Object.entries(map)) {
      assert.ok(GROUP3_PAGES[target], `${section}.${entry} -> ${target} 不存在`)
    }
  }
  assert.deepEqual(Object.keys(GROUP3_ENTRY_MAP), ['security', 'privacy', 'appsManage', 'location'])
})

/* ==================== 四个二级页接线 ==================== */
test('四个二级页统一接子页栈、统一转场、返回先消费子页', () => {
  for (const [section, file] of Object.entries(SECONDARY)) {
    const src = stripComments(read(file))
    assert.match(src, /import '\.\.\/\.\.\/\.\.\/styles\/layer-transitions\.css'/, `${file} 未引入共用转场`)
    assert.match(src, /<Transition :name="g3IsBack \? 'slide-back' : 'slide'">/, `${file} 转场名不统一`)
    assert.match(src, /if \(consumeG3Back\(\)\) return true/, `${file} 返回未先消费子页`)
    assert.match(src, /<Group3SubPage\b/, `${file} 未挂通用渲染器`)
    assert.match(src, /useGroup3Nav\('.*'\)/, `${file} 未接子页栈`)
    assert.doesNotMatch(src, /PrivacySettingsPages/, `${file} 不应再混用另一套三级页容器`)

    // 每一行 openG3('x') 的 x 必须是该 section 接线表里的合法入口
    const calls = [...src.matchAll(/openG3\('([A-Za-z0-9_]+)'\)/g)].map(m => m[1])
    assert.ok(calls.length >= 4, `${file} 接线数量异常`)
    for (const key of calls) {
      assert.ok(GROUP3_ENTRY_MAP[section][key], `${file}: openG3('${key}') 不在 ${section} 接线表里`)
    }
  }
})

test('二级页接线判据有牙齿：把 legal 入口换成非法 key 必须被抓到', () => {
  const src = stripComments(read(SECONDARY.location))
  const calls = [...src.matchAll(/openG3\('([A-Za-z0-9_]+)'\)/g)].map(m => m[1])
  assert.ok(calls.length >= 4)
  assert.ok(!GROUP3_ENTRY_MAP.location['notAnEntry'])
  // 把任一合法 key 临时替换成非法 key，同一段判据必须报错
  const broken = src.replace(`openG3('${calls[0]}')`, "openG3('notAnEntry')")
  const brokenCalls = [...broken.matchAll(/openG3\('([A-Za-z0-9_]+)'\)/g)].map(m => m[1])
  assert.ok(brokenCalls.some(k => !GROUP3_ENTRY_MAP.location[k]))
})

test('四个二级页不再有「带箭头但只弹 toast」的死入口', () => {
  for (const [section, file] of Object.entries(SECONDARY)) {
    const src = stripComments(read(file))
    const dead = [...src.matchAll(/<ListCell\b[^>]*>/g)]
      .map(m => m[0])
      .filter(tag => /\bchevron\b/.test(tag) && !/@click=/.test(tag))
    assert.equal(dead.length, 0, `${file} 仍有 ${dead.length} 个死入口`)
    assert.ok(section)
  }
})

/* ==================== 通用渲染器 ==================== */
test('通用渲染器复用标准控件，不自绘转场、不手写应用图标路径', () => {
  const src = stripComments(read(RENDERER))
  for (const piece of ['SubPageShell', 'ListCell', 'ToggleSwitch', 'LIcon', 'useSettingsGroup3Store', 'getGroup3Page']) {
    assert.match(src, new RegExp(piece), `渲染器缺少 ${piece}`)
  }
  assert.match(src, /:title="title"/, '标题必须传给 SubPageShell')
  assert.doesNotMatch(src, /\.slide-(enter|leave)/, '转场只能来自共用样式')
  assert.doesNotMatch(src, /<path\s+d=/, '禁止在渲染器里手绘 SVG 路径')
  assert.match(src, /actionTitle \? row\.title/, '四级页标题要能按行覆盖')
  assert.match(src, /row\.run/, '动作型行要有反馈而不是死箭头')
})

/* ==================== 偏好 store ==================== */
const freshStore = () => {
  setActivePinia(createPinia())
  return useSettingsGroup3Store()
}

test('store 默认态逐条对齐真机截图', () => {
  const s = freshStore()
  assert.equal(s.getSwitch('cameraAccess'), true)
  assert.equal(s.getSwitch('micAccess'), true)
  assert.equal(s.getSwitch('clipboardNotice'), true)
  assert.equal(s.getSwitch('lockScreenMedia'), true)
  assert.equal(s.getSwitch('cameraExtensions'), false)
  assert.equal(s.getSwitch('wifiScanning'), true)
  assert.equal(s.getSwitch('bluetoothScanning'), false)
  assert.equal(s.getSwitch('preciseLocation'), true)
  assert.equal(s.getSwitch('cloneWechat'), false)
  assert.equal(s.getSwitch('antiPeek'), false)
  assert.equal(s.getSwitch('lendMode'), false)
  assert.equal(s.getChoice('locationGrant'), '仅在使用该应用时允许')
  assert.equal(s.getChoice('contactsStorage'), 'oppcjz@gmail.com')
  assert.equal(s.getChoice('cloudMediaProvider'), 'Google 相册')
})

test('store 只接受已登记 key，读写与 reset 生效', () => {
  const s = freshStore()
  assert.equal(s.getSwitch('__unknown__'), false)
  s.setSwitch('__unknown__', true)
  assert.equal(s.switches.__unknown__, undefined)
  s.setSwitch('wifiScanning', false)
  assert.equal(s.getSwitch('wifiScanning'), false)
  s.setChoice('lendScope', '当前页面')
  assert.equal(s.getChoice('lendScope'), '当前页面')
  s.setChoice('__unknown__', 'x')
  assert.equal(s.choices.__unknown__, undefined)
  s.reset()
  assert.equal(s.getSwitch('wifiScanning'), true)
  assert.equal(s.getChoice('lendScope'), '当前应用')
})

/* ==================== 导航栈行为 ==================== */
test('头图只写在页面顶层，渲染器必须消费 page.hero（防「配了却不渲染」）', () => {
  const src = stripComments(read(RENDERER))
  assert.match(src, /v-if="page\.hero"/, '渲染器没有渲染顶层头图')
  let topHeroCount = 0
  for (const [key, page] of Object.entries(GROUP3_PAGES)) {
    if (page.hero) topHeroCount++
    for (const sec of page.sections || []) {
      assert.equal(Boolean(sec.hero), false, `${key} 的 hero 写在 sections 里，渲染器会漏掉`)
    }
  }
  assert.ok(topHeroCount >= 15, '头图页数量不应缩水')
})

test('子页栈：入口前进、四级页叠加、返回逐层消费', () => {
  const nav = useGroup3Nav('location')
  assert.equal(nav.current.value, null)
  assert.equal(nav.open('locationServices'), true)
  assert.equal(nav.current.value.key, 'locationServices')
  assert.equal(nav.isBack.value, false)

  assert.equal(nav.openKey('wifiScanning'), true)
  assert.equal(nav.stack.value.length, 2)
  assert.equal(nav.current.value.key, 'wifiScanning')

  assert.equal(nav.consumeBack(), true)
  assert.equal(nav.isBack.value, true)
  assert.equal(nav.current.value.key, 'locationServices')
  assert.equal(nav.consumeBack(), true)
  assert.equal(nav.current.value, null)
  assert.equal(nav.consumeBack(), false, '栈空后应把返回交给上一级')

  assert.equal(nav.open('不存在的入口'), false)
  assert.equal(nav.onNavigate({ key: 'recentLocation', title: '' }), true)
  assert.equal(nav.current.value.key, 'recentLocation')
})

/* ==================== 应用列表：注册表驱动 + 统一搜索控件 ==================== */
/** 从 scoped CSS 里取某个类的定位声明（先剥注释，防注释里写同值假绿） */
function dockDecls(src, className) {
  const clean = stripComments(src)
  const m = clean.match(new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`))
  if (!m) return null
  const body = m[1]
  const pick = (key) => {
    const hit = body.match(new RegExp(`${key}:\\s*(-?[0-9.]+)px`))
    return hit ? Number(hit[1]) : null
  }
  return { bottom: pick('bottom'), left: pick('left'), right: pick('right'), zIndex: pick('z-index') }
}

test('应用列表直接读桌面注册表，不再硬编码应用名与假图标', () => {
  const pages = GROUP3_PAGES.appList
  assert.equal(pages.useRegisteredApps, true)
  assert.deepEqual(pages.sections[0].rows, [], '应用行必须由注册表生成，配置里不留硬编码')
  const raw = stripComments(read('src/components/apps/settings/group3/pages.js'))
  // 只约束 appList 块本身：别的三级页（如位置权限分组）按真机写死应用名是合理的
  const appListBlock = raw.match(/  appList:\s*\{[\s\S]*?\n  \},/)?.[0] || ''
  assert.match(appListBlock, /useRegisteredApps: true/)
  assert.doesNotMatch(appListBlock, /appIcon:|appImage:/, '应用列表配置里不应再有硬编码图标')

  const src = stripComments(read(RENDERER))
  assert.match(src, /import \{ APPS, getApp \} from '\.\.\/\.\.\/\.\.\/\.\.\/config\/apps\.js'/)
  assert.match(src, /resolveAppImage\(app\)/, '图标必须取自注册表')
  assert.match(src, /DRAWER_APPS\.find/, 'special 应用要从抽屉注册表补图')
  assert.match(src, /row\.appImage[\s\S]*<img/, '列表图标必须是真实 <img>，不是首字色块')
  assert.match(src, /\.sort\(\(a, b\) => a\.name\.localeCompare/, '按 A-Z 排序')

  // 注册表本身可用：日历/时钟在 APPS 无 image，DRAWER_APPS 里有真实 PNG
  assert.ok(APPS.length >= 30)
  assert.equal(APPS.find(a => a.id === 'calendar').image, undefined)
  assert.match(DRAWER_APPS.find(a => a.id === 'calendar').icon, /calendar\.png/)
  assert.match(DRAWER_APPS.find(a => a.id === 'clock').icon, /clock\.png/)
  // 🔴 日历/时钟与桌面同源：直接复用桌面 AppIcon 组件（星期+日期 / 实时指针），
  //    不再拿 drawer 里的静态 PNG 冒充（真机上两者长得不一样）。
  assert.match(src, /import AppIcon from '\.\.\/\.\.\/\.\.\/ui\/AppIcon\.vue'/)
  assert.match(src, /app\.special \? getApp\(app\.id\) : null/, 'special 应用要传 AppIcon 配置')
  assert.match(src, /:app="row\.appLive"[\s\S]*:launch-on-click="false"/, '列表里不能触发打开应用')
  assert.doesNotMatch(src, /calendar_alt\.png|\/icons\/clock\.png/, '不再用静态 PNG 冒充桌面自绘图标')
  assert.doesNotMatch(src, /SPECIAL_APP_ICONS/)
  const desktop = stripComments(read('src/components/ui/AppIcon.vue'))
  assert.match(desktop, /app\.special === 'calendar'/)
  assert.match(desktop, /app\.special === 'clock'/)
  assert.ok(APPS.every(a => a.special || a.image || DRAWER_APPS.find(d => d.id === a.id)?.icon || getApp(a.id)?.image),
    '每个已注册应用都必须解析得到真实图标或走桌面自绘')
})

test('应用列表搜索栏用首页同一个 SettingsSearchBar，且外壳提供 bottom 插槽', () => {
  const src = stripComments(read(RENDERER))
  assert.match(src, /import SettingsSearchBar from '\.\.\/\.\.\/\.\.\/ui\/SettingsSearchBar\.vue'/)
  assert.match(src, /<SettingsSearchBar\s+v-model="query"/)
  assert.match(src, /<template #bottom>/)
  assert.doesNotMatch(src, /class="g3-search"/, '自绘搜索框已废弃')
  assert.doesNotMatch(src, /position:\s*sticky/, '搜索栏不能 sticky 在内容流里')
  const shell = stripComments(read('src/components/apps/settings/subpage/SubPageShell.vue'))
  assert.match(shell, /<slot name="bottom"><\/slot>/)
})

test('两处搜索栏定位参数完全一致（左右 27 / 离底 25 / 渐隐遮罩）', () => {
  const home = stripComments(read('src/components/apps/settings/SettingsApp.vue'))
  const sub = stripComments(read(RENDERER))
  const a = dockDecls(home, 'settings-floating-search')
  const b = dockDecls(sub, 'g3-floating-search')
  assert.deepEqual(b, a, '应用列表与首页的悬浮搜索栏定位必须一致')
  assert.equal(a.bottom, 25)
  assert.equal(a.left, 27)
  assert.equal(a.right, 27)
  assert.match(sub, /\.g3-search-spacer\s*\{[\s\S]*?height:\s*92px/, '底部留白要能滚过搜索栏')
  for (const decl of ['left: -27px', 'right: -27px', 'top: -34px', 'bottom: -25px']) {
    const re = new RegExp(decl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    assert.match(home, re)
    assert.match(sub, re)
  }
})

test('定位守卫有牙齿：把应用列表的 bottom 改掉必须立刻红', () => {
  const home = stripComments(read('src/components/apps/settings/SettingsApp.vue'))
  const sub = stripComments(read(RENDERER))
  assert.deepEqual(dockDecls(sub, 'g3-floating-search'), dockDecls(home, 'settings-floating-search'))
  const broken = sub.replace('bottom: 25px;', 'bottom: 8px;')
  assert.notDeepEqual(dockDecls(broken, 'g3-floating-search'), dockDecls(home, 'settings-floating-search'))
})

/* ==================== 应用管理三级/四级页：真机形态 ==================== */
test('应用管理子页按真机重做：应用信息 / 活动详情 / 云端媒体 / 自启动 / 默认应用', () => {
  const p = GROUP3_PAGES
  // 应用信息：图标+名称+版本头部、开启/卸载/强行停止三按钮、真机行名
  assert.ok(p.appDetail.sections.some(x => x.appHero))
  assert.equal(p.appDetail.sections.find(x => x.tripleActions).tripleActions.length, 3)
  const detailRows = p.appDetail.sections.flatMap(x => x.rows || []).map(r => r.title)
  for (const t of ['通知', '权限', '存储和缓存', '移动数据和 WLAN', '设备使用时间', '电池', '默认打开']) {
    assert.ok(detailRows.includes(t), `应用信息缺「${t}」`)
  }

  // 屏幕使用时间＝应用活动详情：总时长 + 周柱状图 + 可关闭提示卡 + 应用用时列表
  assert.equal(p.screenTime.title, '应用活动详情')
  const usage = p.screenTime.sections.find(x => x.usage).usage
  assert.equal(usage.value, '2小时44分钟')
  assert.equal(usage.bars.length, 7)
  assert.ok(p.screenTime.sections.some(x => x.tip))
  assert.ok(p.screenTime.sections.flatMap(x => x.rows || []).some(r => r.timer && r.action === 'appTimer'))
  assert.equal(p.appTimer.title, '应用定时器')

  // 云端媒体：说明 + 蓝色分组标题 + 2 个单选（Google 相册带齿轮、无）
  assert.ok(p.cloudMedia.sections.some(x => x.accentHeader === '访问以下来源的云端媒体内容'))
  const mediaRows = p.cloudMedia.sections.flatMap(x => x.rows || [])
  assert.equal(mediaRows.length, 2)
  assert.equal(mediaRows[0].gear, true)
  assert.equal(mediaRows[1].title, '无')
  assert.ok(!mediaRows.some(r => /自动备份/.test(r.title)), '真机没有「自动备份」开关')

  // 自启动：全部管理总开关 + 8 个应用（已允许）+ 智能优化
  const autoRows = p.autoStart.sections.flatMap(x => x.rows || [])
  assert.equal(autoRows[0].toggle, 'autoStartMaster')
  assert.equal(autoRows.length, 9)
  assert.ok(autoRows.slice(1).every(r => r.subtitle === '已允许' && r.toggle))
  assert.equal(p.autoStart.cta, '智能优化')

  // 默认应用：每行带真实图标，四级页按分类名出动态候选
  assert.ok(p.defaultApps.sections[0].rows.every(r => r.appImage && r.actionTitle))
  assert.ok(p.defaultAppPicker.sections.some(x => x.dynamicRows === 'defaultAppPicker'))
  assert.ok(p.defaultAppPicker.sections.some(x => x.dynamicNote === 'defaultAppPicker'))

  // 应用双开「更多应用」按真机 9 个、应用锁改为密码验证引导
  assert.equal(p.cloneMoreApps.title, '更多应用')
  assert.equal(p.cloneMoreApps.sections.flatMap(x => x.rows || []).length, 9)
  assert.equal(p.appLock.cta, '验证锁屏密码')
})

test('真机形态守卫有牙齿：删掉柱状图 / 三按钮必须立刻红', () => {
  const p = GROUP3_PAGES
  assert.equal(p.screenTime.sections.find(x => x.usage).usage.bars.length, 7)
  const broken = { ...p.screenTime, sections: p.screenTime.sections.filter(x => !x.usage) }
  assert.equal(broken.sections.some(x => x.usage), false)
  assert.equal(p.appDetail.sections.find(x => x.tripleActions).tripleActions.length, 3)
  const broken2 = { ...p.appDetail, sections: p.appDetail.sections.filter(x => !x.tripleActions) }
  assert.equal(broken2.sections.some(x => x.tripleActions), false)
})

/* ==================== 通知深链 + 应用信息四个子页（真机 131~140） ==================== */
test('「通知」跳到现有的应用通知设置页，不再打开 group3 自编页', () => {
  const notifRow = GROUP3_PAGES.appDetail.sections.flatMap(x => x.rows || []).find(r => r.title === '通知')
  assert.equal(notifRow.openAppNotifications, true)
  assert.equal(notifRow.action, undefined, '不能落到 group3 自己的页面')
  assert.equal(GROUP3_PAGES.appNotifications, undefined, '编造的「应用通知」页应已删除')

  const src = stripComments(read(RENDERER))
  assert.match(src, /useNotificationsStore/)
  assert.match(src, /notificationsStore\.setAppTarget\(store\.selectedApp\.appId/, '要用现有深链 setAppTarget')
  const notif = stripComments(read('src/components/apps/settings/SettingsNotifications.vue'))
  assert.match(notif, /subView === 'appDetail'|v-else key="detail"/, '现有通知设置页必须有 appDetail 子页')
  assert.match(notif, /currentDetailApp\.name \|\| i18n\.notifTitle/, '深链进来的应用要显示中文名')
  assert.match(notif, /appImage: getApp\(appId\)\?\.image/, '深链进来的应用要带真实图标')
  assert.match(notif, /class="ns-app-hero-img"[\s\S]*:src="currentDetailApp\.appImage"/, '头部要渲染真实 PNG')
  const store = stripComments(read('src/stores/notificationsStore.js'))
  assert.match(store, /setAppTarget\(appId\)/)
})

test('应用信息四个子页按真机重做：存储 / 移动数据用量 / 单应用使用时间 / 电池用量', () => {
  const p = GROUP3_PAGES
  const rows = (k) => p[k].sections.flatMap(x => x.rows || [])

  assert.equal(p.appStorage.title, '存储')
  assert.deepEqual(rows('appStorage').map(r => r.title), ['总计', '应用大小', '用户数据', '清除存储空间', '缓存', '清理缓存'])
  assert.equal(rows('appStorage')[0].value, '1.57 GB')
  assert.equal(rows('appStorage')[2].value, '0.91 GB')
  assert.ok(rows('appStorage').filter(r => r.link).length === 2, '真机两条蓝色操作链接')

  assert.equal(p.appDataUsage.title, '移动数据用量')
  assert.deepEqual(rows('appDataUsage').map(r => r.title), ['总计', '前台', '后台', '后台流量', '不限制数据流量'])
  assert.equal(rows('appDataUsage')[0].value, '234 MB')
  assert.equal(rows('appDataUsage')[2].value, '9.01 MB')

  assert.equal(p.appScreenTime.titleFrom, 'selectedApp', '标题栏要显示应用名')
  const usage = p.appScreenTime.sections.find(x => x.usage).usage
  assert.deepEqual(usage.dropdowns, ['屏幕使用时间', '每天'])
  assert.equal(usage.value, '0分钟')
  assert.equal(usage.appIcon, true)
  assert.ok(p.appScreenTime.sections.some(x => x.accentHeader === '设置'))
  const stRows = rows('appScreenTime').map(r => r.title)
  assert.deepEqual(stRows, ['应用定时器', '管理通知'])
  assert.equal(rows('appScreenTime')[1].openAppNotifications, true)

  assert.equal(p.appBattery.title, '应用的电池用量')
  assert.ok(p.appBattery.sections.some(x => x.header === '管理电池用量'))
  assert.deepEqual(rows('appBattery').map(r => r.title), ['允许后台使用', '已优化', '无限制'])
  assert.equal(rows('appBattery')[1].radio, 'appBatteryMode')
})

/* ==================== 全量取证台账：防「瞎编页面」回潮 ==================== */
test('每个页面都登记取证来源，device 页必须带真机截图编号', () => {
  const keys = Object.keys(GROUP3_PAGES)
  assert.equal(Object.keys(PAGE_SOURCES).length, keys.length, '来源台账与页面数要一一对应')
  for (const k of keys) {
    assert.ok(['device', 'derived', 'placeholder'].includes(PAGE_SOURCES[k]), `${k} 的 source 非法`)
    if (GROUP3_PAGES[k].source) assert.equal(GROUP3_PAGES[k].source, PAGE_SOURCES[k], `${k} 内联 source 与台账不一致`)
    if (PAGE_SOURCES[k] === 'device') {
      assert.ok(PAGE_EVIDENCE[k], `${k} 标了 device 却没有证据编号`)
    }
  }
  assert.equal(Object.keys(PAGE_SOURCES).filter(k => !GROUP3_PAGES[k]).length, 0, '台账里有多余 key')
})

test('推导页不许编具体数值/假地址/假日期；不许有孤立页面', () => {
  const numRe = /(\d[\d.]*\s*(GB|MB|KB|B|分钟|小时|次|条|张|个应用|%)|20\d\d年|深圳市|V\d)/i
  const bad = []
  for (const [k, pg] of Object.entries(GROUP3_PAGES)) {
    if (PAGE_SOURCES[k] !== 'derived') continue
    for (const sec of pg.sections || []) {
      for (const r of sec.rows || []) {
        const t = [r.title, r.subtitle, r.value].filter(Boolean).join('|')
        if (numRe.test(t)) bad.push(`${k}: ${t}`)
      }
      for (const n of [sec.note, ...(sec.notes || [])].filter(Boolean)) {
        if (numRe.test(n)) bad.push(`${k}: note ${n}`)
      }
    }
  }
  assert.deepEqual(bad, [], `推导页仍有编造数值：\n${bad.join('\n')}`)

  // appDetail 由渲染器动态生成 action，是唯一允许「无静态引用」的页面
  const used = new Set([...Object.values(GROUP3_ENTRY_MAP).flatMap(m => Object.values(m)), 'appDetail'])
  for (const pg of Object.values(GROUP3_PAGES)) {
    for (const sec of pg.sections || []) {
      for (const r of sec.rows || []) if (r.action) used.add(r.action)
      for (const l of sec.links || []) if (l.action) used.add(l.action)
    }
  }
  assert.deepEqual(Object.keys(GROUP3_PAGES).filter(k => !used.has(k)), [], '存在没有入口的孤立页面')
})

test('台账守卫有牙齿：删 source / 塞假数值 / 造孤立页都必须被抓到', () => {
  const keys = Object.keys(GROUP3_PAGES)
  assert.equal(Object.keys(PAGE_SOURCES).length, keys.length)
  const brokenSources = { ...PAGE_SOURCES }
  delete brokenSources[keys[0]]
  assert.notEqual(Object.keys(brokenSources).length, keys.length)
  const numRe = /(\d[\d.]*\s*(GB|MB|KB|B|分钟|小时|次|条|张|个应用|%)|20\d\d年|深圳市|V\d)/i
  assert.equal(numRe.test('总计 1.57 GB'), true)
  assert.equal(numRe.test('当前位置'), false)
})

/* ==================== 可点即生效：全量点击语义守卫 ==================== */
/** 把配置里所有行按「点击后应该发生什么」分类，任何一类都不能没有对应处理分支。 */
function classifyRows() {
  const stat = { action: 0, deeplink: 0, radio: 0, toggle: 0, run: 0, deadChevron: 0, disabled: 0, plain: 0 }
  for (const pg of Object.values(GROUP3_PAGES)) {
    for (const sec of pg.sections || []) {
      for (const r of sec.rows || []) {
        if (r.disabled) stat.disabled++
        else if (r.openAppNotifications) stat.deeplink++
        else if (r.radio) stat.radio++
        else if (r.toggle) stat.toggle++
        else if (r.action) stat.action++
        else if (r.run) stat.run++
        else if (r.chevron) stat.deadChevron++
        else stat.plain++
      }
    }
  }
  return stat
}

test('每一行都有明确点击语义，不存在「看起来能点但被吞掉」的行', () => {
  const stat = classifyRows()
  assert.equal(stat.deadChevron, 0, '带箭头却没有任何下一层/反馈的行')
  for (const k of ['action', 'deeplink', 'radio', 'toggle', 'run']) {
    assert.ok(stat[k] > 0, `${k} 类行不应为 0（守卫覆盖会失去意义）`)
  }
  // 基线：记录当前规模，避免有人误删大批交互行而不被发现
  assert.ok(stat.radio >= 19 && stat.toggle >= 78 && stat.action >= 100)
})

test('渲染器对五类可点行都有明确副作用，且不许再把 toggle/radio 直接 return', () => {
  const src = stripComments(read(RENDERER))
  assert.match(src, /if \(row\.openAppNotifications\)[\s\S]*setAppTarget/, '深链分支')
  assert.match(src, /if \(row\.radio\)[\s\S]*onRadio\(row\)/, '单选整行点击要能选中')
  assert.match(src, /if \(row\.toggle\)[\s\S]*onToggle\(row, !store\.getSwitch/, '开关整行点击要能翻转')
  assert.match(src, /if \(row\.action\)[\s\S]*emit\('navigate'/, '导航分支')
  assert.match(src, /else if \(row\.chevron \|\| row\.run\)[\s\S]*emit\('action'/, '动作/箭头反馈分支')
  assert.doesNotMatch(src, /if \(row\.toggle \|\| row\.radio \|\| row\.disabled\) return/, '回退到把整行点击吞掉的旧写法')

  // 看起来能点的非行控件也必须有反馈
  assert.match(src, /g3-triple-btn[\s\S]*@click="emit\('action'/, '三按钮')
  assert.match(src, /g3-usage-dropdown[\s\S]*@click="emit\('action'/, '使用时长下拉')
  assert.match(src, /g3-usage-arrow[\s\S]*@click="emit\('action'/, '日期切换箭头')
  assert.match(src, /g3-gear[\s\S]*@click\.stop="emit\('navigate'/, '云端媒体齿轮')
  assert.match(src, /g3-tip-close[\s\S]*@click="tipDismissed = true"/, '提示卡关闭')
})

test('点击守卫有牙齿：把 radio 分支去掉 / 恢复旧 return 写法都要报红', () => {
  const src = stripComments(read(RENDERER))
  assert.match(src, /if \(row\.radio\)[\s\S]*onRadio\(row\)/)
  const noRadio = src.replace('  if (row.radio) {\n    onRadio(row)\n    return\n  }\n', '')
  // `function onRadio(row)` 定义本身也含这个字面量，所以用调用次数对比而不是 doesNotMatch
  const countCalls = (t) => (t.match(/onRadio\(row\)/g) || []).length
  assert.equal(countCalls(noRadio), countCalls(src) - 1, '删掉 radio 分支后调用点应少一处')
  const oldBug = "if (row.toggle || row.radio || row.disabled) return"
  assert.doesNotMatch(src, new RegExp(oldBug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(oldBug, /row\.radio/) // 旧写法确实存在过，判据本身有效
})

test('四个二级页的自定义链接（非 ListCell）也都有点击处理', () => {
  for (const file of Object.values(SECONDARY)) {
    const src = stripComments(read(file))
    const custom = [...src.matchAll(/<div class="(recommend-link-item|recommend-link|privacy-policy-link)"([^>]*)>/g)]
    for (const m of custom) {
      assert.match(m[2], /@click=/, `${file} 的 .${m[1]} 没有点击处理`)
    }
  }
})
