/**
 * 电池与省电 —— 运行时行为断言（真机 XOS 17，SET-BAT-01）
 * ==========================================================
 * 断言的是真渲染出来的行、文案、点击后的三级页与 store 状态，
 * 不做 `readFileSync` + 正则（「源码里写了」不等于「页面点得动」）。
 *
 * 菜单树与证据：`.local-evidence/SET-BAT-01/`；本文件覆盖
 * 首页 / 电池模式说明 / 省电管理 / 充电设置 / 无线充电模态 /
 * 无线反向充电 / 电池健康 / 应用耗电详情 / 7 天视图 / 返回栈 / 持久化。
 */
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'
import {
  useBatteryStore, estimateMinutes, formatDuration, BATTERY_DEFAULTS
} from '../src/stores/batteryStore.js'
import { createRuntime } from './helpers/vueRuntime.mjs'

const PAGE = '/src/components/apps/settings/SettingsBattery.vue'

let rt

before(async () => { rt = await createRuntime() })
after(async () => { if (rt) await rt.close() })

const storeOf = (id) => rt.evaluate(async ({ id: hostId }) => {
  const pinia = window.__wbHosts.get(hostId).host.__wbPinia
  const m = await import('/src/stores/batteryStore.js')
  const s = m.useBatteryStore(pinia)
  return JSON.parse(JSON.stringify(s.$state))
}, { id })

const open = async () => {
  const id = await rt.mount(PAGE)
  await rt.settle(id, 120)
  return id
}

const clickText = (id, selector, text) => rt.clickText(id, selector, text, 320)

/* ==================== store 纯逻辑 ==================== */
test('默认值对齐真机：均衡模式 + 省电三开关默认开', () => {
  setActivePinia(createPinia())
  const s = useBatteryStore()
  assert.equal(s.mode, 'balanced')
  assert.equal(s.superSaver, false)
  assert.equal(s.autoSaverEnabled, false)
  assert.equal(s.autoSaverThreshold, 5)
  assert.equal(s.autoExitSaver, true)
  assert.equal(s.refresh60, true)
  assert.equal(s.darkTheme, true)
  assert.equal(s.autoSleep15, true)
  assert.equal(s.sleepStandby, true)
  assert.equal(s.chargeSpeed, 'smart')
  assert.equal(s.chargeProtection, 'ai')
  assert.equal(s.timeRange, '24h')
  assert.deepEqual(s.appBehavior, {})
  // 真机默认 5% 起步；默认值是共享常量，防止各页各写一份
  assert.equal(BATTERY_DEFAULTS.autoSaverThreshold, 5)
})

test('剩余时间换算：87% 对应真机三档（26h37m / 30h56m / 32h29m）', () => {
  assert.equal(estimateMinutes(87, 'balanced'), 1597)
  assert.equal(estimateMinutes(87, 'saver'), 1856)
  assert.equal(estimateMinutes(87, 'super'), 1949)
  assert.equal(formatDuration(1597), '26 小时 37 分钟')
  assert.equal(formatDuration(59), '59 分钟')
})

test('模式/偏好写入 localStorage 键 tos.settings.battery.v1', () => {
  // node 单测没有 localStorage：用内存桩验证落盘内容（与 localPrefs 的守卫一致）
  const map = new Map()
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  }
  try {
    setActivePinia(createPinia())
    const s = useBatteryStore()
    s.setMode('saver')
    const raw = JSON.parse(map.get('tos.settings.battery.v1'))
    assert.equal(raw.mode, 'saver')
    s.setTimeRange('7d')
    // 分段只影响会话视图，不落盘
    assert.equal(JSON.parse(map.get('tos.settings.battery.v1')).timeRange, undefined)
    assert.equal(s.timeRange, '7d')
  } finally {
    delete globalThis.localStorage
  }
})

/* ==================== 首页 ==================== */
test('首页结构与真机一致：模式/超级省电/电池设置/使用情况/排行', async () => {
  const id = await open()
  const text = await rt.allText(id)
  for (const needle of [
    '电池模式', '省电模式', '均衡模式', '超级省电', '电池设置',
    '省电管理', '充电设置', '电池健康', '电池使用情况',
    '距上次充满电已使用', '过去 24 小时', '过去 7 天',
    '电池电量', '活动时长', '亮屏活动时长', '息屏活动时长',
    '耗电占比排行（过去 24 小时）', '查看更多',
    '其他应用耗电（过去 24 小时）',
    '应用耗电占比=应用耗电量/全部应用耗电量'
  ]) {
    assert.ok(text.includes(needle), `首页缺少「${needle}」`)
  }
  // 健康行不再硬编码「最大容量 100%」（真机首页该行无右值）
  assert.ok(!text.includes('最大容量 100%'))
  await rt.unmount(id)
})

test('点省电模式立即生效（无 toast），剩余时间随之变化', async () => {
  const id = await open()
  const before = await rt.text(id, '.hero-remaining-text')
  await rt.click(id, '.mode-tile[data-mode="saver"]', 320)
  assert.equal((await storeOf(id)).mode, 'saver')
  const after = await rt.text(id, '.hero-remaining-text')
  assert.notEqual(after, before)
  assert.ok(after.includes('30 小时'), `省电模式剩余时间异常：${after}`)
  await rt.unmount(id)
})

test('电池模式 ⓘ 打开说明卡（三模式 + 确定）', async () => {
  const id = await open()
  await rt.click(id, '.info-icon-btn', 320)
  const text = await rt.allText(id)
  assert.ok(text.includes('系统性能受限，最多可同时使用 6 个应用'))
  assert.ok(text.includes('平衡性能和续航'))
  assert.ok(await rt.exists(id, '.mode-info-confirm'))
  await rt.click(id, '.mode-info-confirm', 320)
  assert.ok(!(await rt.allText(id)).includes('平衡性能和续航'))
  await rt.unmount(id)
})

test('活动时长 ⓘ 有真实说明层（不是死图标）', async () => {
  const id = await open()
  await rt.click(id, '.activity-head .info-icon-btn', 320)
  const text = await rt.allText(id)
  assert.ok(text.includes('息屏活动时长：屏幕熄灭但应用仍在后台运行的时间。'))
  assert.ok(text.includes('过去 7 天按日均值显示'))
  await rt.unmount(id)
})

test('排行图标与文案必须有 14px 间距（ListCell 的 icon 槽兜底不生效）', async () => {
  const id = await open()
  assert.equal(await rt.style(id, '.app-rank-icon', 'marginRight'), '14px')
  assert.equal(await rt.style(id, '.system-app-icon', 'marginRight'), '14px')
  const gap = await rt.page.evaluate((hostId) => {
    const host = window.__wbHosts.get(hostId).host
    const cell = host.querySelector('.ranking-card .list-cell')
    const img = cell.querySelector('.app-rank-icon')
    const title = cell.querySelector('.lc-title')
    return +(title.getBoundingClientRect().left - img.getBoundingClientRect().right).toFixed(2)
  }, id)
  assert.equal(gap, 14)
  await rt.unmount(id)
})

/* ==================== 省电管理 ==================== */
test('省电管理：开关联动滑杆可用态，返回首页再进仍在', async () => {
  const id = await open()
  await clickText(id, '.settings-battery-page .lc-title', '省电管理')
  assert.equal(await rt.count(id, '.sub-shell'), 1)
  assert.ok((await rt.allText(id)).includes('睡眠待机优化'))
  assert.equal(await rt.attr(id, '.threshold-slider', 'disabled'), '')
  await rt.click(id, '.toggle-switch', 260)
  assert.equal((await storeOf(id)).autoSaverEnabled, true)
  assert.equal(await rt.attr(id, '.threshold-slider', 'disabled'), null)
  const slider = await rt.style(id, '.threshold-slider', 'backgroundColor')
  assert.ok(slider)
  // 返回首页（三级页关闭），再进入时 store 状态还在
  await rt.click(id, '.gn-back', 320)
  assert.equal(await rt.count(id, '.sub-shell'), 0)
  await clickText(id, '.settings-battery-page .lc-title', '省电管理')
  assert.equal(await rt.attr(id, '.threshold-slider', 'disabled'), null)
  await rt.unmount(id)
})

test('省电管理「了解详情」进省电模式介绍，返回回到省电管理（不是首页）', async () => {
  const id = await open()
  await clickText(id, '.settings-battery-page .lc-title', '省电管理')
  await rt.click(id, '.link-btn', 320)
  const text = await rt.allText(id)
  assert.ok(text.includes('省电模式将进行以下优化'))
  assert.ok(text.includes('减少数据传输'))
  await rt.click(id, '.gn-back', 320)
  assert.ok((await rt.allText(id)).includes('系统优化设置'))
  await rt.unmount(id)
})

/* ==================== 充电设置 ==================== */
test('充电设置：单选充电速度写回 store；三入口都可达', async () => {
  const id = await open()
  await clickText(id, '.settings-battery-page .lc-title', '充电设置')
  let text = await rt.allText(id)
  assert.ok(text.includes('智能充电'))
  assert.ok(text.includes('提示：使用三方充电器时部分功能可能不可用。'))
  assert.ok(text.includes('无线充电感应位置'))
  assert.ok(text.includes('无线反向充电'))
  assert.ok(text.includes('旁路充电'))

  await clickText(id, '.sub-shell .lc-title', '低温充电')
  assert.equal((await storeOf(id)).chargeSpeed, 'lowTemp')

  // 无线充电感应位置：模态 + 关闭回到充电设置
  await clickText(id, '.sub-shell .lc-title', '无线充电感应位置')
  assert.ok(await rt.exists(id, '.wireless-overlay'))
  await rt.click(id, '.wo-close', 320)
  assert.equal(await rt.count(id, '.wireless-overlay'), 0)
  assert.ok((await rt.allText(id)).includes('默认充电速度'))
  await rt.unmount(id)
})

test('无线反向充电与旁路充电：各自开关落盘，返回逐层', async () => {
  const id = await open()
  await clickText(id, '.settings-battery-page .lc-title', '充电设置')
  await clickText(id, '.sub-shell .lc-title', '无线反向充电')
  assert.ok((await rt.allText(id)).includes('请将支持无线充电的设备'))
  await rt.click(id, '.toggle-switch', 260)
  assert.equal((await storeOf(id)).reverseWireless, true)
  await rt.click(id, '.gn-back', 320)
  assert.ok((await rt.allText(id)).includes('默认充电速度'), '应回到充电设置')

  await clickText(id, '.sub-shell .lc-title', '旁路充电')
  assert.ok((await rt.allText(id)).includes('有线充电时生效，电源断开后自动关闭。'))
  await rt.click(id, '.toggle-switch', 260)
  assert.equal((await storeOf(id)).bypassCharging, true)
  await rt.click(id, '.gn-back', 320)
  await rt.click(id, '.gn-back', 320)
  assert.equal(await rt.count(id, '.sub-shell'), 0)
  await rt.unmount(id)
})

/* ==================== 电池健康 ==================== */
test('电池健康：99% 容量、AI 默认选中、自定义上限可选', async () => {
  const id = await open()
  await clickText(id, '.settings-battery-page .lc-title', '电池健康')
  const text = await rt.allText(id)
  assert.ok(text.includes('最大电池容量'))
  assert.ok(text.includes('99%'))
  assert.ok(text.includes('AI智能充电保护'))
  assert.equal((await storeOf(id)).chargeProtection, 'ai')

  await clickText(id, '.sub-shell .lc-title', '自定义充电保护')
  assert.equal((await storeOf(id)).chargeProtection, 'custom')
  assert.ok((await rt.allText(id)).includes('充电上限'))
  await clickText(id, '.sub-shell .lc-title', '充电上限')
  await rt.page.locator('.limit-row', { hasText: '85%' }).click()
  await rt.settle(id, 300)
  assert.equal((await storeOf(id)).customChargeLimit, 85)
  await rt.unmount(id)
})

test('电池健康「如何延长电池使用寿命」有真实说明层，不是死链', async () => {
  const id = await open()
  await clickText(id, '.settings-battery-page .lc-title', '电池健康')
  await rt.click(id, '.link-btn', 320)
  assert.ok((await rt.allText(id)).includes('避免长时间满电存放'))
  await rt.unmount(id)
})

/* ==================== 应用耗电详情 ==================== */
test('排行行进入应用耗电详情，行为单选与强行停止确认生效', async () => {
  const id = await open()
  await clickText(id, '.ranking-card .lc-title', 'TikTok')
  let text = await rt.allText(id)
  assert.ok(text.includes('近 24 小时'))
  assert.ok(text.includes('前台运行时长'))
  assert.ok(text.includes('后台耗电量'))
  assert.ok(text.includes('耗电行为控制'))
  assert.ok(text.includes('强行停止应用'))

  await clickText(id, '.sub-shell .lc-title', '无限制')
  assert.equal((await storeOf(id)).appBehavior.tiktok, 'unrestricted')

  await clickText(id, '.sub-shell .list-cell', '强行停止应用')
  assert.ok((await rt.allText(id)).includes('可能丢失未保存的数据'))
  await rt.page.locator('.confirm-btn.danger').click()
  await rt.settle(id, 320)
  assert.ok((await rt.allText(id)).includes('已强行停止'))
  assert.ok((await rt.allText(id)).includes('0 分钟'))
  await rt.unmount(id)
})

/* ==================== 7 天视图 ==================== */
test('过去 7 天：文案与图表切到周视图，排行标题同步', async () => {
  const id = await open()
  await clickText(id, '.segment-btn', '过去 7 天')
  const text = await rt.allText(id)
  assert.ok(text.includes('用电量'))
  assert.ok(text.includes('日均亮屏活动时长'))
  assert.ok(text.includes('日均息屏活动时长'))
  assert.ok(text.includes('耗电占比排行（过去 7 天）'))
  assert.ok(!text.includes('电池电量'))
  // 7 天没有「查看更多」展开（真机 7 天视图只给榜单）
  assert.ok(!text.includes('查看更多'))
  await rt.unmount(id)
})
