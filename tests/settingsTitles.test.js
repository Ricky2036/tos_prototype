import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')

/**
 * 设置菜单标题统一（Ricky 2026-11-06）
 * 标题只允许在 `src/config/settingsTitles.js` 定义一次；
 * 首页行文案与页面标题都引用同一份，禁止各写各的。
 */
const TITLES = 'src/config/settingsTitles.js'
const DIR = 'src/components/apps/settings'

const titlesSrc = read(TITLES)
const table = {}
for (const m of titlesSrc.matchAll(/^\s{2}([a-zA-Z]+): '([^']+)'/gm)) table[m[1]] = m[2]

test('标题表存在且覆盖设置里所有跨页复用的菜单', () => {
  for (const key of ['notifications', 'statusBar', 'controlCenter', 'lockScreenNotif', 'floatingNotif', 'dynamicBar', 'cloudBackup', 'autoBackup', 'dnd', 'prayer']) {
    assert.ok(table[key], `标题表缺少 ${key}`)
  }
  assert.equal(table.notifications, '通知与状态栏', '通知页标题口径')
})

test('通知与状态栏的 5 个子视图标题都来自标题表', () => {
  const src = read(`${DIR}/SettingsNotifications.vue`)
  assert.match(src, /:title="SETTINGS_TITLES\.notifications"/, '首页标题未走表')
  assert.match(src, /:title="SETTINGS_TITLES\.lockScreenNotif"/, '锁屏通知标题未走表')
  assert.match(src, /:title="SETTINGS_TITLES\.floatingNotif"/, '悬浮通知标题未走表')
  assert.match(src, /:title="SETTINGS_TITLES\.dynamicBar"/, 'Dynamic Bar 标题未走表')
  // 不允许再出现散落的字面量/i18n 标题
  assert.doesNotMatch(src, /<GlassNavBar title="通知与状态栏"/, '首页标题不该再写字面量')
  // 只查导航标签里的写法（行标题仍可合法用 i18n）
  assert.doesNotMatch(src, /<GlassNavBar[^>]*:title="i18n\.t\(/, '导航标题不该再各自接 i18n')
})

test('首页入口文案与页面标题同源（通知/勿扰/礼拜）', () => {
  const app = read(`${DIR}/SettingsApp.vue`)
  assert.match(app, /notifications: SETTINGS_TITLES\.notifications/, '首页通知入口文案未走表')
  assert.match(app, /dnd: SETTINGS_TITLES\.dnd/, '首页勿扰入口文案未走表')
  assert.match(app, /prayer: SETTINGS_TITLES\.prayer/, '首页礼拜入口文案未走表')

  // 反例守卫：这几个 key 不允许再写成 i18n（i18n 的 notifications 是「通知」，会与首页行不一致）
  assert.doesNotMatch(app, /notifications: i18n\.t\('notifications'\)/, '又退回 i18n 了')
})

test('设置导航不再携带控件不支持的 back-label（死参数）', () => {
  const bad = []
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.vue'))) {
    const src = read(`${DIR}/${f}`)
    if (/back-label/.test(src)) bad.push(f)
  }
  assert.deepEqual(bad, [], `这些页面还在传 back-label：${bad.join(', ')}`)
})

test('所有设置页标题都经由 GlassNavBar / SubPageShell（不再自绘）', () => {
  const files = fs.readdirSync(DIR).filter((x) => x.endsWith('.vue'))
  const selfDrawn = []
  for (const f of files) {
    const src = read(`${DIR}/${f}`)
    // 自绘标题：class="...GlassNavBar / anb-title / sub-nav" 的裸 div
    if (/class="(sub-nav|anb-title|GlassNavBar)"/.test(src)) selfDrawn.push(f)
  }
  assert.deepEqual(selfDrawn, [], `这些页面还在自绘导航：${selfDrawn.join(', ')}`)
})
