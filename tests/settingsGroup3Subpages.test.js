import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  GROUP3_PAGES,
  GROUP3_ENTRY_MAP,
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
        if (row.chevron && !row.action) issues.push(`${key}: "${row.title}" 带箭头但没有下一层页面`)
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
  // special 应用必须指向【真实存在】的资源，不能只信 DRAWER_APPS 里那个坏路径
  for (const file of ['public/icons/drawer/calendar_alt.png', 'public/icons/drawer/clock.png']) {
    assert.ok(fs.existsSync(path.resolve(file)), `${file} 不存在，special 应用图标会空白`)
  }
  assert.match(src, /SPECIAL_APP_ICONS[\s\S]*calendar_alt\.png[\s\S]*clock\.png/)
  assert.ok(APPS.every(a => a.image || DRAWER_APPS.find(d => d.id === a.id)?.icon || getApp(a.id)?.image),
    '每个已注册应用都必须解析得到真实图标')
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
