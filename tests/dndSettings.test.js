import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  DND_DEFAULTS, DND_CALL_OPTIONS, DND_WEEKDAYS, DND_WEEKDAYS_FULL,
  formatDndTime, useDndSettingsStore
} from '../src/stores/dndSettingsStore.js'
import { getRegisteredApps, findRegisteredApp } from '../src/composables/useRegisteredApps.js'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
const fresh = () => { setActivePinia(createPinia()); return useDndSettingsStore() }

const DND_ROOT = 'src/components/apps/settings/SettingsDND.vue'

/* ==================== 真机默认值与格式化 ==================== */
test('勿扰默认态对齐真机（dnd_01 / dnd_10_schedule / dnd_22_repeat）', () => {
  const s = fresh()
  assert.equal(s.state.scheduleMode, '定时切换')
  assert.equal(s.state.startHour, 22)
  assert.equal(s.state.endHour, 7)
  assert.deepEqual(s.state.repeatDays, [0, 1, 3, 4, 6], '真机选中周一、周二、周四、周五、周日')
  assert.equal(s.state.allowCalls, '收藏联系人')
  assert.deepEqual(s.state.allowedApps, ['wechat'], '真机「1 个应用被允许」，按注册表 id 存')
})

test('时间格式化：真机「下午10:00 / 上午7:00」', () => {
  assert.equal(formatDndTime(22, 0), '下午10:00')
  assert.equal(formatDndTime(7, 0), '上午7:00')
  assert.equal(formatDndTime(0, 30), '上午12:30')
  assert.equal(formatDndTime(12, 5), '下午12:05')
  assert.equal(formatDndTime(23, 59), '下午11:59')
})

test('所有 setter 都生效且拒绝非法值，reset 回默认', () => {
  const s = fresh()
  assert.equal(s.setScheduleMode('不存在'), false)
  assert.equal(s.setScheduleMode('已关闭'), true)
  assert.equal(s.state.scheduleMode, '已关闭')

  s.setStartTime(9, 30)
  assert.equal(s.state.startHour, 9)
  assert.equal(s.state.startMinute, 30)
  s.setEndTime(18, 45)
  assert.equal(s.state.endHour, 18)

  assert.equal(s.setAllowCalls('非法'), false)
  assert.equal(s.setAllowCalls('所有人'), true)
  assert.equal(s.state.allowCalls, '所有人')

  assert.equal(s.setRepeatDays([0, 0, 2, 9]), true)
  assert.deepEqual(s.state.repeatDays, [0, 2], '去重、过滤越界、排序')
  assert.equal(s.setRepeatDays([]), false, '至少保留一天')
  assert.equal(s.toggleRepeatDay(2), true)
  assert.deepEqual(s.state.repeatDays, [0])

  s.toggleApp('tiktok')
  assert.ok(s.state.allowedApps.includes('tiktok'))
  s.toggleApp('tiktok')
  assert.ok(!s.state.allowedApps.includes('tiktok'))

  s.reset()
  assert.deepEqual(s.state.repeatDays, DND_DEFAULTS.repeatDays)
  assert.deepEqual(s.state.allowedApps, DND_DEFAULTS.allowedApps)
  assert.equal(s.state.allowCalls, DND_DEFAULTS.allowCalls)
})

test('常量与真机清单一致', () => {
  assert.equal(DND_WEEKDAYS.length, 7)
  assert.equal(DND_WEEKDAYS_FULL.length, 7)
  assert.deepEqual(DND_CALL_OPTIONS, ['无', '所有人', '联系人', '收藏联系人'])
  const registered = getRegisteredApps()
  assert.ok(registered.length >= 30, '应用提醒必须来自桌面注册表全量')
  assert.deepEqual(findRegisteredApp('微信')?.id, findRegisteredApp('wechat')?.id)
  assert.ok(registered.every(a => a.image || a.specialApp), '不允许再出现首字色块假图标')
})

/* ==================== 死操作清零：静态守卫 ==================== */
test('勿扰主页三个带箭头的行全部接线，不再有 clickable 却无 @click 的行', () => {
  const src = strip(read(DND_ROOT))
  for (const key of ['schedule', 'calls', 'apps']) {
    assert.match(src, new RegExp(`data-dnd-row="${key}"[^>]*@click=`), `${key} 行没有点击处理`)
  }
  const dead = [...src.matchAll(/<div class="dnd-cell([^"]*)"([^>]*)>/g)]
    .filter(m => m[1].includes('clickable') && !m[2].includes('@click'))
  assert.equal(dead.length, 0, '仍有 `.dnd-cell.clickable` 没有 @click')
  assert.match(src, /openSub\('schedule'\)/)
  assert.match(src, /showCallsPicker = true/)
  assert.match(src, /openSub\('apps'\)/)
})

test('三个子页 / 弹层组件齐全，且复用全仓统一控件', () => {
  for (const f of ['DndSchedulePage.vue', 'DndAppsPage.vue', 'DndRepeatSheet.vue']) {
    assert.ok(fs.existsSync(path.resolve(`src/components/apps/settings/dnd/${f}`)), `${f} 缺失`)
  }
  const main = strip(read(DND_ROOT))
  assert.match(main, /import '\.\.\/\.\.\/\.\.\/styles\/layer-transitions\.css'/)
  assert.match(main, /:name="isBack \? 'slide-back' : 'slide'"/)
  assert.match(main, /SheetOptionPicker/)
  assert.match(main, /DndRepeatSheet/)
  assert.match(main, /TimePickerSheet/, '时间选择必须走全仓标准控件')
  assert.match(main, /defineExpose\(\{ back \}\)/)

  const sched = strip(read('src/components/apps/settings/dnd/DndSchedulePage.vue'))
  assert.match(sched, /SubPageShell/)
  assert.match(sched, /pick-time/)
  assert.match(sched, /pick-repeat/)

  const apps = strip(read('src/components/apps/settings/dnd/DndAppsPage.vue'))
  assert.match(apps, /SettingsSearchDock/, '搜索统一走标准 Dock')
  assert.match(apps, /#bottom/)
  assert.match(apps, /RegisteredAppList/, '应用清单必须走公共组件')
  assert.match(apps, /@row-click="store\.toggleApp/, '整行点击要能切开关')
  assert.doesNotMatch(apps, /dndApps\.js|is-fallback|dndAppFallback/, '不得再自造应用清单或假图标')

  for (const f of ['DndRepeatSheet.vue']) {
    assert.match(strip(read(`src/components/apps/settings/dnd/${f}`)), /SheetModal/, `${f} 必须复用统一弹层`)
  }
})

test('返回栈能逐层消费子页与弹层，且 SettingsApp 已纳入 dnd', () => {
  const src = strip(read(DND_ROOT))
  for (const cond of ['timeTarget.value', 'showRepeatSheet.value', 'showCallsPicker.value', 'subPage.value']) {
    assert.match(src, new RegExp(`if \\(${cond.replace(/\./g, '\\.')}\\)`), `back() 未消费 ${cond}`)
  }
  const app = strip(read('src/components/apps/settings/SettingsApp.vue'))
  assert.match(app, /\bdnd:\s*dndRef\b/, 'dnd 必须登记在主壳返回栈注册表')
  assert.match(app, /legacyRefs\[view\.value\]\?\.value/, '侧滑返回由统一注册表逐层消费')
  assert.match(app, /<SettingsDND ref="dndRef"/)
})

test('死操作守卫有牙齿：去掉一行的 @click 必须立刻红', () => {
  const src = strip(read(DND_ROOT))
  const deadRe = /<div class="dnd-cell([^"]*)"([^>]*)>/g
  const countDead = (s) => [...s.matchAll(deadRe)].filter(m => m[1].includes('clickable') && !m[2].includes('@click')).length
  assert.equal(countDead(src), 0)
  const broken = src.replace('data-dnd-row="calls" @click="showCallsPicker = true"', 'data-dnd-row="calls"')
  assert.equal(countDead(broken), 1, '守卫必须能抓到被摘掉的 @click')
})
