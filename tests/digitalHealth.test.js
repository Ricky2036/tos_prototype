import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  DH_DEFAULTS, DH_SLEEP_MODES, useDigitalHealthStore
} from '../src/stores/digitalHealthStore.js'
import {
  DH_TOTAL_MINUTES, DH_UNLOCKS, DH_NOTIFICATIONS, DH_SEG_COLORS, DH_METRICS,
  formatDuration, dhDonutSegments, dhUsageRows, dhWeekBars,
  dhAppMetric, dhMetricTotals, dhMetricLabel, dhMetricUnit
} from '../src/components/apps/settings/digitalhealth/dhData.js'
import { getRegisteredApps } from '../src/composables/useRegisteredApps.js'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')
/** 🔴 结构类断言一律先剥注释，否则注释里写同值会假绿 */
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
const fresh = () => { setActivePinia(createPinia()); return useDigitalHealthStore() }

const DH_DIR = 'src/components/apps/settings/digitalhealth'
const HOME = `${DH_DIR}/DigitalHealthApp.vue`
const SETTINGS = 'src/components/apps/settings/SettingsApp.vue'

/* ==================== 展示数据自洽（三处不能互相打脸） ==================== */

test('主页环形图分段之和 = 总时长（否则环会多画或少画）', () => {
  const segs = dhDonutSegments()
  assert.ok(segs.length >= 3, `分段数 ${segs.length}`)
  const sum = segs.reduce((n, s) => n + s.minutes, 0)
  assert.equal(sum, DH_TOTAL_MINUTES, `分段合计 ${sum}`)
  const deg = segs.reduce((n, s) => n + s.deg, 0)
  assert.ok(Math.abs(deg - 360) < 1e-6, `角度合计 ${deg}`)
  const pct = segs.reduce((n, s) => n + s.pct, 0)
  assert.ok(Math.abs(pct - 100) <= 2, `百分比合计 ${pct}`)
})

test('模块常量与真机取证一致：7小时17分钟 / 17 次解锁 / 436 条通知', () => {
  assert.equal(DH_TOTAL_MINUTES, 437)
  assert.equal(DH_UNLOCKS, 17)
  assert.equal(DH_NOTIFICATIONS, 436)
  assert.equal(formatDuration(DH_TOTAL_MINUTES), '7小时17分钟')
})

test('应用行的三项指标合计 = 主页两个统计块（同一份假数据）', () => {
  const totals = dhMetricTotals()
  assert.equal(totals.time, dhUsageRows(99).reduce((n, r) => n + r.minutes, 0))
  assert.ok(totals.time <= DH_TOTAL_MINUTES, `应用合计 ${totals.time} 不能超过总时长`)
  assert.equal(totals.unlocks, DH_UNLOCKS, '解锁次数合计必须等于 17')
  assert.equal(totals.notifications, DH_NOTIFICATIONS, '通知条数合计必须等于 436')
})

test('应用行按使用时长降序，且全部来自注册表（不允许硬编码应用名）', () => {
  const rows = dhUsageRows(99)
  const ids = new Set(getRegisteredApps().map(a => a.id))
  for (const r of rows) {
    assert.ok(ids.has(r.id), `${r.id} 不在桌面注册表里`)
    assert.ok(r.name && r.name !== r.id, `${r.id} 没解析出应用名`)
  }
  const mins = rows.map(r => r.minutes)
  assert.deepEqual(mins, [...mins].sort((a, b) => b - a), '未按时长降序')
})

test('七日柱状图的占比恒在 0..1，且 total 基准是总时长而非 0', () => {
  for (const id of ['total', ...dhUsageRows(99).map(r => r.id)]) {
    for (const b of dhWeekBars(id, 'time')) {
      assert.ok(b.ratio >= 0 && b.ratio <= 1, `${id} ratio=${b.ratio}`)
      assert.ok(b.value >= 0)
    }
  }
  const total = dhWeekBars('total', 'time')
  const sum = total.reduce((n, b) => n + b.value, 0)
  assert.ok(sum > 100, `total 柱状图合计只有 ${sum}，说明基准取成了 0`)
})

test('指标单位与标签：时间是「4小时35分钟」，其余带 次 / 条', () => {
  assert.deepEqual(DH_METRICS, ['time', 'unlocks', 'notifications'])
  assert.equal(dhMetricUnit('time'), '分钟')
  assert.equal(dhMetricUnit('unlocks'), '次')
  assert.equal(dhMetricUnit('notifications'), '条')
  assert.equal(dhMetricLabel(275, 'time'), '4小时35分钟')
  assert.equal(dhMetricLabel(8, 'unlocks'), '8次')
  assert.equal(dhMetricLabel(318, 'notifications'), '318条')
  assert.equal(dhAppMetric('wechat', 'time'), 275)
  assert.equal(dhAppMetric('不存在', 'unlocks'), 0)
})

test('时长格式化覆盖 0 分钟 / 整小时 / 时分', () => {
  assert.equal(formatDuration(0), '0分钟')
  assert.equal(formatDuration(25), '25分钟')
  assert.equal(formatDuration(120), '2小时')
  assert.equal(formatDuration(95), '1小时35分钟')
  assert.equal(formatDuration(-5), '0分钟')
})

/* ==================== store 自洽 ==================== */

test('真机默认态：图标开关关、提醒开、专注未选、睡眠关、看路未授权', () => {
  const s = fresh()
  assert.equal(s.state.showIconInAppList, false)
  assert.equal(s.state.reminderEnabled, true)
  assert.deepEqual(s.state.focusApps, [])
  assert.deepEqual(s.state.reminderExcluded, [])
  assert.equal(s.state.sleep.enabled, false)
  assert.equal(s.state.sleep.mode, '无')
  assert.equal(s.state.sleep.alarmBehavior, true)
  assert.equal(s.state.walking.enabled, false)
  assert.equal(s.state.parental.pin, '')
  assert.deepEqual(Object.keys(s.state.limits), [])
})

test('应用定时器：设置 / 读取 / 计数 / 清除，0 分钟等于清除', () => {
  const s = fresh()
  assert.equal(s.limitCount(), 0)
  assert.equal(s.limitFor('wechat'), 0)
  s.setLimit('wechat', 95)
  s.setLimit('tiktok', 30)
  assert.equal(s.limitCount(), 2)
  assert.equal(s.limitFor('wechat'), 95)
  s.setLimit('wechat', 0)
  assert.equal(s.limitCount(), 1)
  assert.equal(s.limitFor('wechat'), 0)
  s.clearLimit('tiktok')
  assert.equal(s.limitCount(), 0)
  s.setLimit('wechat', -12)
  assert.equal(s.limitCount(), 0, '负数不能写成定时器')
})

test('提醒名单用排除法：默认全部提醒，关总开关后逐个勾选无效', () => {
  const s = fresh()
  assert.equal(s.isReminderApp('wechat'), true)
  assert.equal(s.reminderCount(38), 38)
  assert.equal(s.toggleReminderApp('wechat'), true)
  assert.equal(s.isReminderApp('wechat'), false)
  assert.equal(s.reminderCount(38), 37)
  s.setReminderEnabled(false)
  assert.equal(s.toggleReminderApp('tiktok'), false, '总开关关闭时必须拦住')
  assert.equal(s.isReminderApp('tiktok'), true)
})

test('专注模式勾选可增可删；睡眠模式只接受白名单；PIN 只收 4 位', () => {
  const s = fresh()
  s.toggleFocusApp('wechat')
  s.toggleFocusApp('tiktok')
  assert.deepEqual(s.state.focusApps, ['wechat', 'tiktok'])
  s.toggleFocusApp('wechat')
  assert.deepEqual(s.state.focusApps, ['tiktok'])

  assert.equal(s.setSleepMode('启用时间表'), true)
  assert.equal(s.state.sleep.mode, '启用时间表')
  assert.equal(s.setSleepMode('不认识'), false)
  assert.equal(s.state.sleep.mode, '启用时间表')
  assert.deepEqual(DH_SLEEP_MODES, ['启用时间表', '在充电时开启', '无'])

  assert.equal(s.setParentalPin('12'), false, '2 位不能写入')
  assert.equal(s.setParentalPin('12a4'), false, '剔掉字母后只剩 3 位 → 拒绝')
  assert.equal(s.state.parental.pin, '')
  assert.equal(s.setParentalPin('1234'), true)
  assert.equal(s.state.parental.pin, '1234')
  assert.equal(s.setParentalPin('12345'), true, '超长要截到 4 位而不是拒绝')
  assert.equal(s.state.parental.pin, '1234')
  assert.equal(s.setParentalPin(''), true, '空串表示清除')
  assert.equal(s.state.parental.pin, '')
})

test('看路提醒：三项都授权且总开关打开才算全部授权；reset 归默认', () => {
  const s = fresh()
  // 真机默认已允许「通知」，身体活动与位置信息要用户点允许
  assert.deepEqual(s.state.walking, { enabled: false, activity: false, notify: true, location: false })
  assert.equal(s.walkingAllGranted(), false)
  s.setWalkingEnabled(true)
  assert.equal(s.walkingAllGranted(), false, '身体活动/位置信息没授权时不算全部授权')
  s.grantWalking('activity')
  assert.equal(s.walkingAllGranted(), false, '位置信息没授权时不算全部授权')
  s.grantWalking('location')
  assert.equal(s.walkingAllGranted(), true)

  s.setLimit('wechat', 60)
  s.toggleFocusApp('wechat')
  s.reset()
  assert.deepEqual(s.state.limits, {})
  assert.deepEqual(s.state.focusApps, [])
  assert.deepEqual(s.state.sleep, { ...DH_DEFAULTS.sleep })
  assert.deepEqual(s.state.parental, { ...DH_DEFAULTS.parental })
  assert.equal(s.state.walking.enabled, false)
})

/* ==================== 组件结构契约 ==================== */

test('设置首页把「数字健康」与「家长控制」拆成两行真入口（不再是一行未实现）', () => {
  const src = strip(read(SETTINGS))
  assert.ok(src.includes('title="数字健康"'), '缺少「数字健康」行')
  assert.ok(src.includes('title="家长控制"'), '缺少「家长控制」行')
  assert.ok(!src.includes('数字健康与家长控制'), '旧合并行必须删掉')
  assert.ok(/title="数字健康"[^>]*@click="push\('digitalHealth'\)"/.test(src), '「数字健康」不是真跳转')
  assert.ok(/title="家长控制"[^>]*@click="push\('parental'\)"/.test(src), '「家长控制」不是真跳转')
  assert.ok(src.includes('view === \'digitalHealth\''), '缺少 digitalHealth 视图分支')
  assert.ok(src.includes('view === \'parental\''), '缺少 parental 视图分支')
  assert.ok(src.includes('dhRef.value?.back?.()'), '侧滑返回没接到数字健康的子页栈')
})

test('搜索项：数字健康相关条目全部落到真实页面，不再 pushUnimplemented', () => {
  const src = strip(read(SETTINGS))
  const line = (id) => src.split('\n').find(l => l.includes(`id: '${id}'`)) || ''
  for (const id of ['digitalHealth', 'screenTime', 'appTimer', 'sleepMode', 'focusMode', 'walkingReminder']) {
    const l = line(id)
    assert.ok(l, `搜索项 ${id} 缺失`)
    assert.ok(!l.includes('pushUnimplemented'), `${id} 仍是未实现占位`)
  }
  assert.ok(line('digitalHealth').includes("push('digitalHealth')"))
  assert.ok(line('parental').includes("push('parental')"))
  assert.ok(line('familyLink').includes("push('parental')"))
})

test('主页 8 个子页组件都存在，且 import 与模板一一对应（缺一个就白屏）', () => {
  const src = strip(read(HOME))
  const subs = ['DhAppLimits', 'DhAppActivity', 'DhSleepMode', 'DhSleepSettings',
    'DhFocusMode', 'DhScreenReminder', 'DhWalking', 'DhParental']
  for (const c of subs) {
    assert.ok(fs.existsSync(path.resolve(DH_DIR, `${c}.vue`)), `缺少 ${c}.vue`)
    assert.ok(src.includes(`import ${c} from './${c}.vue'`), `${c} 没有 import`)
    assert.ok(src.includes(`<${c}`), `${c} 没有在模板里渲染`)
  }
})

test('Material 皮肤不能被换成 iOS 值（底色 / 蓝色小标 / 开关尺寸）', () => {
  const shell = strip(read(`${DH_DIR}/DhShell.vue`))
  assert.ok(/background:\s*#F1F2F4/.test(shell), '页面底色必须是 #F1F2F4')
  assert.ok(/\.dh-label[\s\S]{0,200}color:\s*#1A73E8/.test(shell), '小节标题必须是 Google 蓝')

  const sw = strip(read(`${DH_DIR}/DhSwitch.vue`))
  assert.ok(/width:\s*46px/.test(sw) && /height:\s*28px/.test(sw), '开关必须是 46×28 的 Material 形态')
  assert.ok(/\.dh-switch\.on\s*\{\s*background:\s*#1A73E8/.test(sw), '开启态轨道必须是 #1A73E8')

  const chk = strip(read(`${DH_DIR}/DhCheck.vue`))
  assert.ok(/width:\s*20px/.test(chk) && /height:\s*20px/.test(chk), '复选框必须是 20×20 方形')
  assert.ok(!/border-radius:\s*50%/.test(chk), '复选框不能做成圆形（那是单选）')

  // 环形图 / 图例共用同一份配色
  assert.equal(DH_SEG_COLORS.length, 4)
  const home = strip(read(HOME))
  assert.ok(!/const SEG_COLORS\s*=/.test(home), '配色不能在组件里另写一份')
  assert.ok(/color:\s*DH_SEG_COLORS\[i % DH_SEG_COLORS\.length\]/.test(home), '主页环形图要用共享配色')
  assert.ok(strip(read(`${DH_DIR}/DhAppActivity.vue`)).includes('DH_SEG_COLORS'), '图例要用同一份配色')
})

test('应用列表一律走桌面注册表，任何子页都不许硬编码应用名', () => {
  const files = fs.readdirSync(path.resolve(DH_DIR)).filter(f => f.endsWith('.vue'))
  // ⚠️ 不能把「设置」本身列进来：详情页的小节标题就叫「设置」。
  const banned = ['微信', '抖音', '哔哩哔哩', '钉钉', '大众点评']
  for (const f of files) {
    const src = strip(read(`${DH_DIR}/${f}`))
    for (const name of banned) {
      // 只允许出现在注释外的说明文案里；模板里的应用名必须来自注册表
      const hits = [...src.matchAll(new RegExp(`>\\s*${name}\\s*<`, 'g'))]
      assert.equal(hits.length, 0, `${f} 里硬编码了应用名「${name}」`)
    }
  }
})

/* ==================== 牙齿测试 ==================== */

test('牙齿：把总数改成不等、把配色写硬、把入口改回未实现，守卫都必须变红', () => {
  const bodyData = strip(read(`${DH_DIR}/dhData.js`))
  const bodyHome = strip(read(HOME))
  const bodySettings = strip(read(SETTINGS))
  const bodySwitch = strip(read(`${DH_DIR}/DhSwitch.vue`))

  const mutants = [
    ['分段不闭合', bodyData.replace('const rest = Math.max(0, DH_TOTAL_MINUTES - used)', 'const rest = 0'),
      (s) => /const rest = Math\.max\(0, DH_TOTAL_MINUTES - used\)/.test(s)],
    ['total 基准回 0', bodyData.replace("appId === 'total' ? DH_TOTAL_MINUTES : dhAppMetric(appId, metric)", 'dhAppMetric(appId, metric)'),
      (s) => s.includes("appId === 'total' ? DH_TOTAL_MINUTES")],
    ['配色写回组件', bodyHome.replace('color: DH_SEG_COLORS[i % DH_SEG_COLORS.length]', "color: '#4285F4'"),
      (s) => /color:\s*DH_SEG_COLORS\[i % DH_SEG_COLORS\.length\]/.test(s)],
    ['入口改回未实现', bodySettings.replace(/title="数字健康"[^>]*@click="push\('digitalHealth'\)"/, 'title="数字健康" @click="pushUnimplemented(\'数字健康\')"'),
      (s) => /title="数字健康"[^>]*@click="push\('digitalHealth'\)"/.test(s)],
    ['开关尺寸走 iOS', bodySwitch.replace('width: 46px', 'width: 51px'),
      (s) => /width:\s*46px/.test(s)]
  ]

  // 守卫必须先在**本体**上为真，否则「变红」没有意义
  const originals = [bodyData, bodyData, bodyHome, bodySettings, bodySwitch]
  mutants.forEach(([name, mutant, guard], i) => {
    assert.notEqual(mutant, originals[i], `变异体「${name}」没生效（替换没命中）`)
    assert.ok(guard(mutant) === false, `守卫没抓到变异体：${name}`)
    assert.ok(guard(originals[i]), `守卫在本体上就红了：${name}`)
  })
})
