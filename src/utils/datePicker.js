/** 全仓标准日期选择器的纯函数层（DateWheel / DatePickerSheet 与单测共用）。 */

export function pad2(n) {
  return String(n).padStart(2, '0')
}

/** 获取某年某月的天数（month: 1..12） */
export function getDaysInMonth(year, month) {
  const y = Number(year) || 2026
  const m = Number(month) || 1
  return new Date(y, m, 0).getDate()
}

/** 星期标签：周日、周一...周六 */
export function getWeekDay(year, month, day) {
  const y = Number(year) || 2026
  const m = Number(month) || 1
  const d = Number(day) || 1
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const date = new Date(y, m - 1, d)
  return weekdays[date.getDay()] || '周一'
}

/**
 * 解析日期字符串（支持 'YYYY-MM-DD' 或 'YYYY年M月D日'）
 * 返回 { year, month, day }
 */
export function parseDateValue(value, fallback = '2026-11-14') {
  const raw = typeof value === 'string' && value.trim() ? value.trim() : fallback
  let y = 2026
  let m = 11
  let d = 14

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    y = parseInt(isoMatch[1], 10)
    m = parseInt(isoMatch[2], 10)
    d = parseInt(isoMatch[3], 10)
  } else {
    const cnMatch = raw.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (cnMatch) {
      y = parseInt(cnMatch[1], 10)
      m = parseInt(cnMatch[2], 10)
      d = parseInt(cnMatch[3], 10)
    }
  }

  y = Number.isFinite(y) ? y : 2026
  m = Math.max(1, Math.min(12, Number.isFinite(m) ? m : 11))
  const maxDays = getDaysInMonth(y, m)
  d = Math.max(1, Math.min(maxDays, Number.isFinite(d) ? d : 1))

  return { year: y, month: m, day: d }
}

/** 真机弹层顶部当前值：如「2026年11月14日周六」 */
export function formatDateLabel(year, month, day) {
  const { year: y, month: m, day: d } = typeof year === 'object' && year !== null
    ? year
    : parseDateValue(`${year}-${month}-${day}`)
  return `${y}年${m}月${d}日${getWeekDay(y, m, d)}`
}

/** { year, month, day } → 'YYYY-MM-DD' */
export function toDateString(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/** { year, month, day } → 'YYYY年M月D日' */
export function toChineseDateString(year, month, day) {
  return `${year}年${month}月${day}日`
}
