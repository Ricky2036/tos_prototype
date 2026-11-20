/**
 * 流量管理（SIM 卡与网络设置 → 流量管理）确定性假数据
 * ==================================================
 * 真机依据：Ricky 提供的录屏（444×960，55s，覆盖主页面与 8 个三级页）。
 * 原文逐字保留：运营商流量计算方式可能与本设备不同。 / 历史记录 / 已用流量 ……
 *
 * ⚠️ 数据必须自洽（单测会咬）：
 *   - 七日柱之和 === 主页面「过去 7 天」的总量
 *   - 应用用量之和 === 同一个总量（页面之间不能互相打脸）
 *   - 柱状图纵轴刻度由 `tmTicks()` 现算，⛔ 不许写死标签
 */

import { getRegisteredApps } from '../../../../composables/useRegisteredApps.js'

const MB = 1024 * 1024
const KB = 1024

/** 主题蓝（真机取色：开关 / 柱状图 / 数值） */
export const TM_ACCENT = '#2F6BF6'

/** 页面署名日期：录制当时是 2026-11-20（周五），周报周期从 11/14 起算 */
export const TM_NOW = '2026-11-20'

/** 页面上的大数值（0.0 B 这种保留一位小数） */
export function tmFormatValue(bytes) {
  const v = Number(bytes) || 0
  if (v >= 1024 * MB) return `${(v / (1024 * MB)).toFixed(2)} GB`
  if (v >= MB) return `${(v / MB).toFixed(1)} MB`
  if (v >= KB) return `${Math.round(v / KB)} KB`
  return `${v.toFixed(1)} B`
}

/** 熄屏历史的数值显示：真机 76.07 / 87.60 / 111（整数不带小数） */
export function tmHistoryValue(bytes) {
  const mb = (Number(bytes) || 0) / MB
  if (Number.isInteger(mb)) return { num: String(mb), unit: 'MB' }
  if (mb >= 1000) return { num: (mb / 1024).toFixed(2), unit: 'GB' }
  return { num: mb.toFixed(2), unit: 'MB' }
}

/** 大巴流量格式化：与真机一致（0 显示 0.0 B，MB 保留一位小数） */
export function tmFormat(bytes) {
  const v = Number(bytes) || 0
  if (v >= 1024 * MB) return `${(v / (1024 * MB)).toFixed(2)} GB`
  if (v >= MB) return `${(v / MB).toFixed(1)} MB`
  if (v >= KB) return `${Math.round(v / KB)} KB`
  // 刻度用整数：真机 0.25 B / 0.5 B 这类刻度显示成 0 B（大数值另用 tmFormatValue）
  return `${Math.floor(v)} B`
}

/**
 * 纵轴刻度：先换算成「显示单位」再取整数步长，最多 4~5 条。
 * 真机 118.6 MB → 0/40/80/120 MB；6.5 MB → 0/2/4/6 MB（步长 < 10 时带一位小数）。
 * ⚠️ 步长必须在 MB/GB 上取整，直接在字节上取整会得到 38.1 MB 这种鬼刻度。
 */
export function tmTicks(maxBytes) {
  const max = Number(maxBytes) || 0
  // 全 0：真机退化成 5 条 0.25 B，取整后显示 1 B / 0 B ×4
  if (max <= 0) {
    return [1, 0.75, 0.5, 0.25, 0].map(v => ({ value: v, label: `${Math.floor(v)} B` }))
  }
  const unit = max >= 1024 * MB ? 'GB' : max >= MB ? 'MB' : 'KB'
  const div = unit === 'GB' ? 1024 * MB : unit === 'MB' ? MB : KB
  const vmax = max / div
  const rawStep = vmax / 3
  const digits = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const step = Math.max(1, Math.round(rawStep / digits) * digits)
  const top = step * Math.ceil(vmax / step)
  const decimals = step >= 10 ? 0 : 1
  const out = []
  for (let v = top; v >= 0; v -= step) {
    out.push({
      value: v === 0 ? 0 : Math.round(v * div),
      label: v === 0 ? '0 B' : `${v.toFixed(decimals)} ${unit}`
    })
  }
  return out
}

/* ============================ 主页面 ============================ */

/** 当前使用的套餐：录屏里是「无使用中的套餐」空态 */
export const TM_PLAN = {
  active: false,
  title: '无使用中的套餐',
  allLabel: '全部套餐',
  emptyDesc: '添加套餐后可查看剩余流量与到期时间。'
}

/** 今天：录屏里恒为 0（未设套餐，当日不计） */
export const TM_TODAY = {
  totalBytes: 0,
  xLabels: ['6:00', '12:00', '18:00'],
  bars: []
}

/** 过去 7 天：柱高与总量必须自洽（0.6+12.4+118.6+16.3+1.5+14.2+2.4 = 166.0 MB） */
export const TM_WEEK = {
  xLabels: ['11/14', '11/15', '11/16', '11/17', '11/18', '11/19', '11/20'],
  bars: [0.6, 12.4, 118.6, 16.3, 1.5, 14.2, 2.4].map(v => Math.round(v * MB)),
  get totalBytes() {
    return this.bars.reduce((a, b) => a + b, 0)
  }
}

/** 页面脚注（真机原文） */
export const TM_FOOTNOTE = '运营商流量计算方式可能与本设备不同。'

/** 分组与入口：顺序与真机一致 */
export const TM_GROUPS = [
  {
    label: '流量节省',
    rows: [{ key: 'saveMode', title: '省流量模式' }]
  },
  {
    label: '流量管控',
    rows: [
      { key: 'limit', title: '流量限额' },
      { key: 'screenOff', title: '熄屏监控' }
    ]
  },
  {
    label: '其它',
    rows: [
      { key: 'wifiApps', title: '应用 Wi-Fi 权限管理' },
      { key: 'weekly', title: '流量周报' },
      { key: 'settings', title: '设置' }
    ]
  }
]

/* ============================ 三级页 ============================ */

/** 省流量模式（页面标题真机是「后台流量限制」） */
export const TM_SAVE_MODE = {
  title: '后台流量限制',
  rowTitle: '省流量模式',
  unrestrictedTitle: '不受限制的应用',
  desc: '减少部分视频应用的流量消耗。除不受限制的应用外，限制其他应用在后台和息屏时使用移动数据。',
  note: '注意：省流量模式下，除不受限应用外，其他应用可能无法及时接收消息或同步内容。'
}

/** 流量限额 */
export const TM_LIMIT = {
  title: '流量限额',
  dailyTitle: '日流量限额',
  dailyDesc: '日流量使用达到限额时，将进行提示。',
  rowTitle: '流量限额',
  units: ['MB', 'GB'],
  defaultBytes: 500 * MB
}

/** 熄屏监控：录屏里 9 段历史 */
export const TM_SCREEN_OFF = {
  title: '熄屏监控',
  groupLabel: '历史记录',
  entryTitle: '熄屏流量消耗',
  history: [
    { bytes: 76.07 * MB, speed: '108 kB/s', range: '2026-11-10 13:08:47 - 2026-11-10 13:20:30' },
    { bytes: 34.01 * MB, speed: '41.96 kB/s', range: '2026-11-10 17:55:08 - 2026-11-10 18:08:59' },
    { bytes: 31.37 * MB, speed: '4.52 kB/s', range: '2026-10-30 19:09:18 - 2026-10-30 21:05:02' },
    { bytes: 32.34 * MB, speed: '5.18 kB/s', range: '2026-10-28 21:48:04 - 2026-10-28 23:29:12' },
    { bytes: 14.51 * MB, speed: '14.95 kB/s', range: '2026-10-28 21:27:11 - 2026-10-28 21:44:31' },
    { bytes: 87.6 * MB, speed: '85.15 kB/s', range: '2026-10-23 18:45:04 - 2026-10-23 19:02:38' },
    { bytes: 111 * MB, speed: '21.85 kB/s', range: '2026-10-22 21:05:56 - 2026-10-22 22:30:41' },
    { bytes: 28.5 * MB, speed: '80.44 kB/s', range: '2026-10-22 14:02:18 - 2026-10-22 14:08:12' },
    { bytes: 11.86 * MB, speed: '9.66 kB/s', range: '2026-10-19 09:12:40 - 2026-10-19 09:40:15' }
  ]
}

/** 应用 Wi-Fi 权限管理 */
export const TM_WIFI_APPS = {
  title: '应用 Wi-Fi 权限管理',
  desc: '关闭应用开关可限制该应用使用 Wi-Fi。'
}

/** 不受限制的应用 */
export const TM_UNRESTRICTED = {
  title: '不受限制的应用',
  groupLabel: '不受限制的应用'
}

/** 设置 */
export const TM_SETTINGS = {
  title: '设置',
  rows: [
    { key: 'speed', title: '流量网速显示', desc: '在状态栏显示实时网速。' },
    { key: 'alerts', title: '流量提醒', link: 'alerts' },
    { key: 'report', title: '流量使用报告' },
    { key: 'autoSync', title: '套餐自动同步', desc: '每日自动同步一次 SIM 卡内流量套餐信息。' }
  ]
}

/** 流量提醒 */
export const TM_ALERTS = {
  title: '流量提醒',
  customTitle: '自定义流量提醒',
  customDesc: '在剩余流量不足提醒比例时提醒',
  ratioTitle: '提醒比例',
  ratios: [10, 20, 30, 40, 50],
  planTitle: '套餐失效提醒',
  planDesc: '在套餐流量耗尽或到期时提醒',
  autoOffTitle: '自动关闭移动数据',
  autoOffDesc: '在套餐流量耗尽或套餐到期时，你断开状态下自动关闭移动数据。'
}

/** 应用流量使用管理 */
export const TM_APP_USAGE = {
  title: '应用流量使用管理',
  groupLabel: '应用',
  totalLabel: '过去 7 天'
}

/**
 * 应用用量排行：⛔ 不硬编码应用名，一律取自桌面注册表（单测守卫）。
 * 权重递减后按总量等比分配，余数补给第一名 —— 保证求和 === TM_WEEK.totalBytes。
 */
export function tmAppUsage() {
  const apps = getRegisteredApps()
  const total = TM_WEEK.totalBytes
  const HEAD = [0.28, 0.2, 0.14, 0.1, 0.075, 0.05, 0.04, 0.03, 0.02, 0.01]
  const headShare = HEAD.reduce((a, b) => a + b, 0)
  const tailCount = Math.max(1, apps.length - HEAD.length)
  const tailShare = Math.max(0, 1 - headShare) / tailCount
  const rows = apps.map((app, i) => ({
    app,
    bytes: Math.round(total * (HEAD[i] ?? tailShare))
  }))
  // 余数补给第一名，保证求和严格等于七日总量
  const rest = total - rows.reduce((a, r) => a + r.bytes, 0)
  if (rows.length) rows[0].bytes += rest
  return rows.filter(r => r.bytes > 0).sort((a, b) => b.bytes - a.bytes)
}

/**
 * 周报：周期内的柱与「已用流量」同源（都取 TM_WEEK）
 *
 * ⚠️ 录屏里周报是另一台机器的另一周（11/14-11/15，6.5 MB），
 *    与主页 7 天图不同源；这里统一成本周，避免两个页面互相打脸。
 */
export const TM_WEEKLY = {
  title: '流量周报',
  rangeText: '26/11/14-26/11/20',
  savedBytes: 0,
  usedLabel: '已用流量',
  savedLabel: '本周共节省',
  recTitle: '个性化推荐',
  recHead: '请关注：后台流量使用较多',
  recBody: '「App Center」本周在后台消耗了 167.6 kB 流量，建议检查后台权限或开启省流量模式。'
}
