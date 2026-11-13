/**
 * SET-WB-01 · 日期与时间契约测试
 * =================================
 * 真机依据：spec/captures/SET-DSH-01-A-B.md（Infinix X6878 / Android 17）。
 *
 * 前半段是纯逻辑（store 默认值、依赖矩阵、setter 守卫、页面自声明）；
 * 后半段是真实浏览器挂载（9 行顺序、禁用态联动、返回链、卡片规范、状态保持），
 * 不读源码、不用正则匹配字符串。
 */
import test, { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'
import {
  useDateTimeStore, DATE_TIME_DEFAULTS, DATE_TIME_KEYS,
} from '../src/stores/dateTimeStore.js'
import page from '../src/components/apps/settings/pages/dateTime.js'
import { createRuntime } from './helpers/vueRuntime.mjs'

const fresh = () => {
  setActivePinia(createPinia())
  return useDateTimeStore()
}

const ROW_KEYS = [
  'autoTime', 'date', 'time', 'use24Hour', 'autoTimezone',
  'timezone', 'dualClock', 'residence', 'dualClockPosition',
]

/* ==================== 纯逻辑：真机默认值 ==================== */
test('真机默认态：9 个状态逐值对齐包 B1', () => {
  assert.equal(DATE_TIME_DEFAULTS.autoTime, true, '自动设置时间默认开')
  assert.equal(DATE_TIME_DEFAULTS.date, '2026年11月13日')
  assert.equal(DATE_TIME_DEFAULTS.time, '下午1:49')
  assert.equal(DATE_TIME_DEFAULTS.use24Hour, false, '包 B 未标初值，按 12 小时制占位')
  assert.equal(DATE_TIME_DEFAULTS.autoTimezone, true, '自动设置时区默认开')
  assert.equal(DATE_TIME_DEFAULTS.timezone, 'GMT+08:00 中国标准时间')
  assert.equal(DATE_TIME_DEFAULTS.dualClock, true, '真机整屏截图 04-datetime-default.png 显示为开')
  assert.equal(DATE_TIME_DEFAULTS.residence, '常驻地预测（深圳市）')
  assert.equal(DATE_TIME_DEFAULTS.dualClockPosition, '锁屏和时钟桌面小部件')
})

test('store 默认态与采集包一致，且持久化键齐全', () => {
  const s = fresh()
  assert.equal(s.autoTime, true)
  assert.equal(s.autoTimezone, true)
  assert.equal(s.date, DATE_TIME_DEFAULTS.date)
  assert.equal(s.time, DATE_TIME_DEFAULTS.time)
  assert.equal(s.timezone, DATE_TIME_DEFAULTS.timezone)
  assert.equal(s.residence, DATE_TIME_DEFAULTS.residence)
  assert.equal(s.dualClockPosition, DATE_TIME_DEFAULTS.dualClockPosition)
  assert.equal(Object.keys(DATE_TIME_KEYS).length, 9, '9 行各有独立持久化键')
  assert.ok(Object.values(DATE_TIME_KEYS).every((k) => k.startsWith('tos_datetime_')))
})

/* ==================== 纯逻辑：依赖矩阵（包 B2） ==================== */
test('开态依赖矩阵：两个总开关只锁自己那组行', () => {
  const s = fresh()
  assert.equal(s.canEditDate(), false, '自动设置时间=开 → 日期禁用')
  assert.equal(s.canEditTime(), false, '自动设置时间=开 → 时间禁用')
  assert.equal(s.canSelectTimezone(), false, '自动设置时区=开 → 选择时区禁用')
})

test('关掉「自动设置时间」只放行日期/时间，不放行时区', () => {
  const s = fresh()
  assert.equal(s.setAutoTime(false), true)
  assert.equal(s.canEditDate(), true)
  assert.equal(s.canEditTime(), true)
  assert.equal(s.canSelectTimezone(), false, '时区仍被另一个总开关锁住')
  assert.equal(s.setAutoTimezone(false), true)
  assert.equal(s.canSelectTimezone(), true)
})

test('打开总开关会重新锁回去（依赖可双向切换）', () => {
  const s = fresh()
  s.setAutoTime(false)
  s.setAutoTimezone(false)
  assert.equal(s.canEditDate(), true)
  s.setAutoTime(true)
  s.setAutoTimezone(true)
  assert.equal(s.canEditDate(), false)
  assert.equal(s.canEditTime(), false)
  assert.equal(s.canSelectTimezone(), false)
})

test('setter 守依赖：锁住时拒绝写入且不改值', () => {
  const s = fresh()
  assert.equal(s.setDate('2026年1月1日'), false)
  assert.equal(s.date, DATE_TIME_DEFAULTS.date)
  assert.equal(s.setTime('上午9:00'), false)
  assert.equal(s.time, DATE_TIME_DEFAULTS.time)
  assert.equal(s.setTimezone('GMT+00:00'), false)
  assert.equal(s.timezone, DATE_TIME_DEFAULTS.timezone)
})

test('setter 放行后写入生效', () => {
  const s = fresh()
  s.setAutoTime(false)
  s.setAutoTimezone(false)
  assert.equal(s.setDate('2026年1月1日'), true)
  assert.equal(s.setTime('上午9:00'), true)
  assert.equal(s.setTimezone('GMT+00:00'), true)
  assert.equal(s.date, '2026年1月1日')
  assert.equal(s.time, '上午9:00')
  assert.equal(s.timezone, 'GMT+00:00')
})

test('不受总开关影响的四行可独立写入', () => {
  const s = fresh()
  assert.equal(s.setUse24Hour(true), true)
  assert.equal(s.use24Hour, true)
  assert.equal(s.dualClock, true, '真机默认开')
  assert.equal(s.setDualClock(false), true)
  assert.equal(s.dualClock, false, '双时钟可独立切到关')
  assert.equal(s.setResidence('常驻地预测（广州市）'), true)
  assert.equal(s.setDualClockPosition('仅锁屏'), true)
  assert.equal(s.residence, '常驻地预测（广州市）')
  assert.equal(s.dualClockPosition, '仅锁屏')
  // 切总开关后这四行状态不变
  s.setAutoTime(false)
  s.setAutoTimezone(false)
  assert.equal(s.use24Hour, true)
  assert.equal(s.dualClock, false, '切总开关不影响双时钟已改的值')
})

/* ==================== 页面自声明 / route 契约 ==================== */
test('pages/dateTime.js 自声明完整，主壳无需硬编码', () => {
  assert.equal(page.id, 'dateTime')
  assert.equal(page.title, '日期与时间')
  assert.equal(page.titleKey, 'dateTime')
  assert.equal(page.cluster, 'C2')
  assert.equal(page.group, '系统')
  assert.equal(typeof page.order, 'number')
  assert.equal(typeof page.component, 'function', 'component 必须是懒加载器')
  assert.deepEqual(page.searchItems.map((i) => i.id), ['dateTime'])
  assert.ok(!('action' in page.searchItems[0]), '搜索项不得自带 action（由主壳注入）')
})

/* ==================== 浏览器：真实渲染与交互 ==================== */
const PAGE = '/src/components/apps/settings/dateTime/SettingsDateTime.vue'
let rt
before(async () => { rt = await createRuntime() })
after(async () => { if (rt) await rt.close() })
// 持久化是真实行为：每条浏览器用例都从真机默认态开始，避免用例间串状态
beforeEach(async () => {
  if (!rt) return
  await rt.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('tos_datetime_')) localStorage.removeItem(k)
    }
  })
})

const rowKeys = (id) => rt.evaluate(({ hostId }) => {
  const host = window.__wbHosts.get(hostId).host
  return [...host.querySelectorAll('[data-dt-row]')].map((e) => e.getAttribute('data-dt-row'))
}, { hostId: id })
const disabledKeys = (id) => rt.evaluate(({ hostId }) => {
  const host = window.__wbHosts.get(hostId).host
  return [...host.querySelectorAll('[data-dt-row]')]
    .filter((e) => e.classList.contains('is-disabled'))
    .map((e) => e.getAttribute('data-dt-row'))
}, { hostId: id })

test('浏览器：9 行顺序与真机一致，4 组卡片符合统一规范', async () => {
  const id = await rt.mount(PAGE)
  assert.deepEqual(await rowKeys(id), ROW_KEYS)
  assert.equal(await rt.count(id, '.settings-card'), 4, '真机 4 组')
  const card = await rt.styleMap(id, '.settings-card', [
    'backgroundColor', 'borderTopLeftRadius', 'borderTopWidth', 'boxShadow',
  ])
  assert.equal(card.backgroundColor, 'rgb(255, 255, 255)')
  assert.equal(card.borderTopLeftRadius, '16px')
  assert.equal(parseFloat(card.borderTopWidth), 0)
  assert.equal(card.boxShadow, 'none')
  assert.equal(await rt.text(id, '.gn-title'), '日期与时间')
  await rt.unmount(id)
})

test('浏览器：开态禁用三行，关总开关后逐组解禁', async () => {
  const id = await rt.mount(PAGE)
  assert.deepEqual(await disabledKeys(id), ['date', 'time', 'timezone'])

  await rt.click(id, '[data-dt-row="autoTime"] .toggle-switch', 80)
  assert.deepEqual(await disabledKeys(id), ['timezone'], '日期/时间应解禁，时区仍锁')

  await rt.click(id, '[data-dt-row="autoTimezone"] .toggle-switch', 80)
  assert.deepEqual(await disabledKeys(id), [], '全部解禁')

  await rt.click(id, '[data-dt-row="autoTime"] .toggle-switch', 80)
  assert.deepEqual(await disabledKeys(id), ['date', 'time'], '重新锁回去')
  await rt.unmount(id)
})

test('浏览器：24 小时制开关有真实状态响应，不受总开关影响', async () => {
  const id = await rt.mount(PAGE)
  const before = await rt.text(id, '[data-dt-row="use24Hour"] .lc-subtitle')
  await rt.click(id, '[data-dt-row="use24Hour"] .toggle-switch', 80)
  const after = await rt.text(id, '[data-dt-row="use24Hour"] .lc-subtitle')
  assert.notEqual(after, before, '示例时间应随 12/24 小时制变化')
  assert.equal(after, '13:00')
  await rt.click(id, '[data-dt-row="autoTime"] .toggle-switch', 80)
  assert.equal(await rt.text(id, '[data-dt-row="use24Hour"] .lc-subtitle'), '13:00')
  await rt.unmount(id)
})

test('浏览器：返回键派发 back，状态在卸载重挂后保持', async () => {
  const id = await rt.evaluate(async () => {
    const mod = await import('/src/components/apps/settings/dateTime/SettingsDateTime.vue')
    const { createApp, createPinia, setActivePinia, nextTick } = window.__wb
    window.__dtBackCount = 0
    const host = document.createElement('div')
    host.className = 'wb-host'
    host.id = `wb-host-${++window.__wbSeq}`
    document.body.appendChild(host)
    const app = createApp(mod.default, { onBack: () => { window.__dtBackCount += 1 } })
    const pinia = createPinia()
    app.use(pinia)
    setActivePinia(pinia)
    app.config.warnHandler = () => {}
    app.mount(host)
    await nextTick()
    host.__wbPinia = pinia
    window.__wbHosts.set(host.id, { host, app, pinia })
    return host.id
  })
  await rt.click(id, '.gn-btn.gn-back', 60)
  assert.equal(await rt.evaluate(() => window.__dtBackCount), 1, '返回键应派发 back')

  // 改一个状态后卸载重挂：走 localPrefs 持久化，回来应保留
  await rt.click(id, '[data-dt-row="autoTime"] .toggle-switch', 80)
  assert.deepEqual(await disabledKeys(id), ['timezone'])
  await rt.unmount(id)
  const again = await rt.mount(PAGE)
  assert.deepEqual(await disabledKeys(again), ['timezone'], '重挂后状态应保持')
  await rt.unmount(again)
})
