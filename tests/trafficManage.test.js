import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  TM_WEEK, TM_TODAY, TM_GROUPS, TM_LIMIT, TM_ALERTS, TM_SCREEN_OFF,
  tmFormat, tmFormatValue, tmTicks, tmAppUsage, tmHistoryValue
} from '../src/components/apps/settings/sim/trafficData.js'
import { useTrafficStore, TRAFFIC_DEFAULTS } from '../src/stores/trafficStore.js'
import { getRegisteredApps } from '../src/composables/useRegisteredApps.js'

const DIR = 'src/components/apps/settings/sim'
const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')
/** 🔴 结构类断言一律先剥注释，否则注释里写同值会假绿 */
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
const fresh = () => { setActivePinia(createPinia()); return useTrafficStore() }

/* ==================== 数据自洽 ==================== */

test('七日柱之和 = 主页「过去 7 天」总量 = 166.0 MB', () => {
  const sum = TM_WEEK.bars.reduce((a, b) => a + b, 0)
  assert.equal(sum, TM_WEEK.totalBytes, `柱合计 ${tmFormat(sum)}`)
  assert.equal(tmFormatValue(TM_WEEK.totalBytes), '166.0 MB')
  assert.equal(TM_WEEK.bars.length, TM_WEEK.xLabels.length)
})

test('应用用量之和 = 七日总量（两个页面不能互相打脸）', () => {
  const rows = tmAppUsage()
  const sum = rows.reduce((a, r) => a + r.bytes, 0)
  assert.equal(sum, TM_WEEK.totalBytes, `应用合计 ${tmFormat(sum)}`)
  // 名单来自注册表，不再另写一份
  assert.equal(rows.length, getRegisteredApps().length)
  // 降序
  for (let i = 1; i < rows.length; i += 1) assert.ok(rows[i - 1].bytes >= rows[i].bytes)
})

test('今天恒为 0（录屏原样），且没有柱子', () => {
  assert.equal(TM_TODAY.totalBytes, 0)
  assert.deepEqual(TM_TODAY.bars, [])
  assert.equal(TM_TODAY.xLabels.length, 3)
})

/* ==================== 格式化 / 刻度 ==================== */

test('大数值保留一位小数、刻度取整（真机 0.0 B vs 0 B）', () => {
  assert.equal(tmFormatValue(0), '0.0 B')
  assert.equal(tmFormat(2 * 1024), '2 KB')
  assert.equal(tmFormat(0.25 * 1024 * 1024), '256 KB', '小于 1 MB 走 KB 分支')
  assert.equal(tmFormat(0), '0 B', '刻度用的格式化要取整')
  assert.equal(tmFormat(166 * 1024 * 1024), '166.0 MB')
})

test('纵轴刻度落在整齐数字上（118.6 MB → 0/40/80/120 MB）', () => {
  const ticks = tmTicks(118.6 * 1024 * 1024)
  assert.deepEqual(ticks.map(t => t.label), ['120 MB', '80 MB', '40 MB', '0 B'])
  const labels = ticks.map(t => Math.round(t.value / (1024 * 1024)))
  assert.deepEqual(labels, [120, 80, 40, 0])
})

test('全 0 数据退化成 5 条刻度：1 B + 4 条 0 B（真机原样）', () => {
  assert.deepEqual(tmTicks(0).map(t => t.label), ['1 B', '0 B', '0 B', '0 B', '0 B'])
})

test('周报量级用小步长时带一位小数（6.5 MB → 2.0/4.0/6.0 MB）', () => {
  const labels = tmTicks(6.5 * 1024 * 1024).map(t => t.label)
  assert.ok(labels.includes('2.0 MB'), JSON.stringify(labels))
  assert.equal(labels[labels.length - 1], '0 B')
})

test('熄屏历史数值格式：整数不带小数、其余两位', () => {
  assert.equal(tmHistoryValue(76.07 * 1024 * 1024).num, '76.07')
  assert.equal(tmHistoryValue(87.6 * 1024 * 1024).num, '87.60')
  assert.equal(tmHistoryValue(111 * 1024 * 1024).num, '111')
})

/* ==================== 文案（录屏逐字） ==================== */

test('主页面三组入口与录屏一致', () => {
  const flat = TM_GROUPS.flatMap(g => [g.label, ...g.rows.map(r => r.title)])
  assert.deepEqual(flat, [
    '流量节省', '省流量模式',
    '流量管控', '流量限额', '熄屏监控',
    '其它', '应用 Wi-Fi 权限管理', '流量周报', '设置'
  ])
})

test('关键文案逐字（错一个字 Ricky 会看出来）', () => {
  const src = strip(read(`${DIR}/trafficData.js`))
    + strip(read(`${DIR}/TrafficManage.vue`))
    + strip(read(`${DIR}/TmScreenOff.vue`))
  const must = [
    '无使用中的套餐', '全部套餐', '流量使用情况', '已用流量', '今天', '过去 7 天',
    '应用流量使用管理', '运营商流量计算方式可能与本设备不同。',
    '后台流量限制', '不受限制的应用', '日流量限额', '日流量使用达到限额时，将进行提示。',
    '熄屏监控', '历史记录', '熄屏流量消耗', '平均网速：',
    '关闭应用开关可限制该应用使用 Wi-Fi。',
    '在状态栏显示实时网速。', '每日自动同步一次 SIM 卡内流量套餐信息。',
    '自定义流量提醒', '提醒比例', '套餐失效提醒', '自动关闭移动数据',
    '本周共节省', '个性化推荐', '请关注：后台流量使用较多'
  ]
  for (const s of must) assert.ok(src.includes(s), `缺少文案：${s}`)
  // 页面标题与行标题真的不一样（真机就是这么写的，别"修正"）
  assert.equal(TM_SCREEN_OFF.title, '熄屏监控')
  assert.equal(TM_LIMIT.title, '流量限额')
})

/* ==================== store ==================== */

test('默认态与真机第一帧一致', () => {
  const t = fresh()
  assert.equal(t.saveMode, false, '省流量模式默认关')
  assert.equal(t.limitEnabled, true)
  assert.equal(t.limitBytes, 500 * 1024 * 1024, '500.0 MB')
  assert.equal(t.screenOff, true)
  assert.equal(t.customAlerts, true)
  assert.equal(t.alertRatio, 20)
  assert.equal(t.planExpiryAlert, true)
  assert.equal(t.autoDisableData, true)
  assert.equal(t.speedDisplay, true)
  assert.equal(t.usageReport, true)
  assert.equal(t.autoSync, true)
  assert.equal(TRAFFIC_DEFAULTS.saveMode, false)
})

test('应用开关名单来自注册表（⛔ 不硬编码应用名）', () => {
  const t = fresh()
  const ids = getRegisteredApps().map(a => a.id)
  // Wi-Fi 权限默认全开；不受限制默认只放行系统自带 + 通讯类（真机截图口径）
  assert.deepEqual(t.wifiAllowed, ids)
  assert.ok(t.unrestricted.length > 0 && t.unrestricted.length < ids.length, `默认放行 ${t.unrestricted.length} 个`)
  assert.ok(t.unrestricted.every(id => ids.includes(id)), '放行名单必须都在注册表里')
  assert.ok(t.unrestricted.includes('phone') && !t.unrestricted.includes('tiktok'))
  t.toggleApp('wifiAllowed', ids[0])
  assert.equal(t.isAppOn('wifiAllowed', ids[0]), false)
  const wasUnrestricted = t.isAppOn('unrestricted', ids[0])
  assert.equal(t.isAppOn('unrestricted', ids[0]), wasUnrestricted, '两张表互不影响')
  t.setAllApps('unrestricted', false)
  assert.equal(t.unrestricted.length, 0)
  t.setAllApps('unrestricted', true)
  assert.equal(t.unrestricted.length, ids.length)
})

test('限额只收正数、单位只收 MB/GB；比例吸附到 5 档', () => {
  const t = fresh()
  assert.equal(t.setLimit(2 * 1024 * 1024 * 1024, 'GB'), true)
  assert.equal(t.limitUnit, 'GB')
  assert.equal(t.setLimit(-1), false)
  assert.equal(t.setLimit(100, 'TB'), false)
  assert.equal(t.setAlertRatio(23), true)
  assert.equal(t.alertRatio, 20, '23 吸附到 20')
  assert.equal(t.setAlertRatio(47), true)
  assert.equal(t.alertRatio, 50)
})

test('开关统一走 setFlag，未知键返回 false', () => {
  const t = fresh()
  assert.equal(t.setFlag('saveMode', true), true)
  assert.equal(t.saveMode, true)
  assert.equal(t.setFlag('nope', true), false)
})

/* ==================== 结构守卫 ==================== */

test('流量管理挂在 SIM 卡与网络设置下，且返回逐层消费', () => {
  const sim = read('src/components/apps/settings/SettingsSim.vue')
  assert.ok(sim.includes("from './sim/TrafficManage.vue'"))
  assert.ok(/trafficRef\.value\?\.back\?\.\(\)/.test(sim), 'SettingsSim.back 要先让流量管理消费')
  assert.ok(!/traffic-hero-card/.test(sim), '旧的假流量管理卡片必须删干净')
})

test('子页清单齐全（录屏走过的 8 页 + 2 个补页）', () => {
  const root = read(`${DIR}/TrafficManage.vue`)
  for (const f of ['TmSaveMode', 'TmUnrestricted', 'TmWifiApps', 'TmLimit', 'TmScreenOff', 'TmSettings', 'TmAlerts', 'TmWeekly', 'TmAppUsage', 'TmPlans']) {
    assert.ok(root.includes(f), `缺少子页：${f}`)
  }
  const files = fs.readdirSync(path.resolve(DIR)).filter(f => f.endsWith('.vue'))
  assert.ok(files.length >= 12, `组件数 ${files.length}`)
})

test('⛔ 不许出现死条目：主页面每个可点行都有 data-testid', () => {
  const root = strip(read(`${DIR}/TrafficManage.vue`))
  // 组内行是 v-for 渲染的，数量看数据源
  const rows = TM_GROUPS.flatMap(g => g.rows)
  assert.ok(rows.length >= 6, `可点行 ${rows.length}`)
  assert.ok(root.includes(':data-testid="`tm-row-${row.key}`"'), '组内行缺 testid')
  assert.ok(root.includes('data-testid="tm-row-appUsage"'), '应用流量行缺 testid')
  assert.ok(root.includes('data-testid="tm-all-plans"'), '全部套餐入口缺 testid')
})

test('CSS 不在全局样式表里用 :deep()（那是 scoped 专用，写了等于没写）', () => {
  const css = read(`${DIR}/traffic.css`).replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(!/:deep\(/.test(css), 'traffic.css 里出现了 :deep()')
})
