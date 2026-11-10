import { getRegisteredApps, findRegisteredApp } from '../../../../composables/useRegisteredApps.js'

/**
 * 数字健康展示数据（对齐 Infinix X6878 / XOS 17，2026-11-10 真机取证 /tmp/ref/gI/dh_*）。
 *
 * 真机主页：环形图中心「今天 7小时17分钟」、四段（微信 / 设置 / Transsioner / 其他）、
 * 两个统计块「17 次解锁设备」「436 条通知」。
 * 应用活动详情（应用定时器里点某个应用）：微信 4小时35分钟、设置 1小时32分钟、Tranbsioner 27分钟、电话 18分钟…
 *
 * ⚠️ 全部是**确定性假数据**，不接真实使用统计；但必须能自洽：
 *    分段之和 = 总时长、应用行之和 ≤ 总时长，否则环形图和列表会互相打脸。
 */
export const DH_TOTAL_MINUTES = 437 // 7 小时 17 分钟
export const DH_UNLOCKS = 17
export const DH_NOTIFICATIONS = 436

/**
 * 环形图 / 图例配色（真机主蓝 → 深灰 → 中灰 → 浅灰）。
 * ⚠️ 只在这里定义一份：主页环形图与「应用活动」图例必须同色，否则同段两处颜色对不上。
 */
export const DH_SEG_COLORS = ['#4285F4', '#5F6368', '#9AA0A6', '#DADCE0']

/** 各应用今日使用分钟数（注册表 id → 分钟），按真机量级取值 */
const USAGE = {
  wechat: 275,   // 4 小时 35 分钟
  settings: 92,  // 1 小时 32 分钟
  tiktok: 27,    // Transsioner 位（本项目用抖音代替）
  phone: 18,
  messages: 8,
  safari: 6,
  clock: 6,
  photos: 5
}

/** 周一到周日的占比（0..1），不同应用给不同曲线，保证列表与柱状图对得上 */
const WEEK_SHAPE = {
  wechat: [0.34, 0.96, 0.08, 0.06, 0.05, 0.04, 0.03],
  settings: [0.22, 0.61, 0.35, 0.18, 0.12, 0.09, 0.07],
  tiktok: [0.12, 0.28, 0.44, 0.16, 0.1, 0.08, 0.05],
  phone: [0.09, 0.14, 0.2, 0.11, 0.07, 0.05, 0.03],
  /** 「应用活动」总览页的七日曲线（各应用按占比加权后仍落在同一量级） */
  total: [0.19, 0.44, 0.23, 0.12, 0.1, 0.07, 0.05],
  default: [0.08, 0.2, 0.12, 0.06, 0.05, 0.03, 0.02]
}
const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export const DH_WEEK_LABELS = WEEK_LABELS

export function dhUsageMinutes(appId) {
  return USAGE[appId] || 0
}

/** 275 → 「4小时35分钟」；0 → 「0分钟」 */
export function formatDuration(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0))
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (!h) return `${rest}分钟`
  if (!rest) return `${h}小时`
  return `${h}小时${rest}分钟`
}

/** 主页环形图：前 3 名 + 「其他」，每段带角度（deg）与百分比 */
export function dhDonutSegments() {
  const rows = dhUsageRows(3)
  const used = rows.reduce((n, r) => n + r.minutes, 0)
  const rest = Math.max(0, DH_TOTAL_MINUTES - used)
  const segs = rows.map(r => ({ key: r.id, label: r.name, minutes: r.minutes }))
  if (rest > 0) segs.push({ key: 'other', label: '其他', minutes: rest })
  const total = segs.reduce((n, s) => n + s.minutes, 0) || 1
  let acc = 0
  return segs.map(s => {
    const deg = (s.minutes / total) * 360
    const out = { ...s, deg, start: acc, pct: Math.round((s.minutes / total) * 100) }
    acc += deg
    return out
  })
}

/** 有使用记录的应用行（按分钟降序，名字/图标来自桌面注册表） */
export function dhUsageRows(limit = 999) {
  const registry = new Map(getRegisteredApps().map(a => [a.id, a]))
  return Object.entries(USAGE)
    .map(([id, minutes]) => {
      const app = registry.get(id)
      if (!app) return null
      return { id, name: app.name, app, minutes }
    })
    .filter(Boolean)
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, limit)
}

/** 应用活动详情的柱状图（7 天，取该应用本周占比；同一天的值按该应用当日占比反推） */
export function dhWeekBars(appId, metric = 'time') {
  const shape = WEEK_SHAPE[appId] || WEEK_SHAPE.default
  // 'total' 不是某个应用，基准取主页总时长；其余走应用级指标
  const base = appId === 'total' ? DH_TOTAL_MINUTES : dhAppMetric(appId, metric)
  return WEEK_LABELS.map((label, i) => ({
    label,
    ratio: shape[i],
    value: Math.round(base * shape[i])
  }))
}

/** 应用定时器主页：全部注册应用 + 当前是否设了定时器 */
export function dhLimitLabel(minutes) {
  if (!minutes) return ''
  return formatDuration(minutes)
}

/**
 * 应用详情页的可切换指标（真机顶部两个蓝色胶囊：屏幕使用时间 / 每天）。
 * 各应用的解锁次数与通知条数按使用分钟数比例给确定性取值，
 * 三项之和仍对齐主页的 17 次解锁 / 436 条通知（`dhMetricTotals()` 供单测校验）。
 */
const APP_UNLOCKS = { wechat: 8, settings: 3, tiktok: 2, phone: 2, messages: 1, safari: 1, clock: 0, photos: 0 }
const APP_NOTIFS = { wechat: 318, settings: 6, tiktok: 64, phone: 14, messages: 22, safari: 3, clock: 5, photos: 4 }

export const DH_METRICS = ['time', 'unlocks', 'notifications']
const METRIC_UNIT = { time: '分钟', unlocks: '次', notifications: '条' }

export function dhMetricUnit(metric) {
  return METRIC_UNIT[metric] || METRIC_UNIT.time
}

/** 某应用在某指标下的数值（分钟 / 次 / 条） */
export function dhAppMetric(appId, metric) {
  if (metric === 'unlocks') return APP_UNLOCKS[appId] || 0
  if (metric === 'notifications') return APP_NOTIFS[appId] || 0
  return dhUsageMinutes(appId)
}

/** 三个指标的全应用合计，用于「主页统计块 = 各应用之和」的自洽断言 */
export function dhMetricTotals() {
  const ids = Object.keys(USAGE)
  return {
    time: ids.reduce((n, id) => n + dhUsageMinutes(id), 0),
    unlocks: ids.reduce((n, id) => n + (APP_UNLOCKS[id] || 0), 0),
    notifications: ids.reduce((n, id) => n + (APP_NOTIFS[id] || 0), 0)
  }
}

/** 详情页数值标签：时间走 formatDuration，其余带单位 */
export function dhMetricLabel(value, metric) {
  if (metric === 'time') return formatDuration(value)
  return `${value}${dhMetricUnit(metric)}`
}

export function dhAppName(appId) {
  return findRegisteredApp(appId)?.name || appId
}
