/** 全仓标准时间选择器的纯函数层（TimeWheel / TimePickerSheet 与单测共用）。 */

export function pad2(n) {
  return String(n).padStart(2, '0')
}

/** 'HH:mm'（24 小时制）→ { hour24, minute }，非法输入回退 07:00 */
export function parseTimeValue(value, fallback = '07:00') {
  const raw = typeof value === 'string' && /^\d{1,2}:\d{1,2}$/.test(value) ? value : fallback
  const [h, m] = raw.split(':').map(Number)
  const hour24 = Number.isFinite(h) ? ((h % 24) + 24) % 24 : 7
  const minute = Number.isFinite(m) ? ((m % 60) + 60) % 60 : 0
  return { hour24, minute }
}

/** 24 小时 → 12 小时显示值（1..12）与上午/下午 */
export function to12Hour(hour24) {
  const h = ((hour24 % 24) + 24) % 24
  return { hour12: h % 12 === 0 ? 12 : h % 12, period: h < 12 ? '上午' : '下午' }
}

/** 12 小时 + 上午/下午 → 24 小时 */
export function to24Hour(hour12, period) {
  const base = period === '下午' ? 12 : 0
  return base + (hour12 % 12)
}

/** 真机弹层顶部当前值：「10:00 下午」「7:00 上午」（小时不补零） */
export function formatTimeLabel(value) {
  const { hour24, minute } = parseTimeValue(value)
  const { hour12, period } = to12Hour(hour24)
  return `${hour12}:${pad2(minute)} ${period}`
}

/** { hour24, minute } → 'HH:mm' */
export function toTimeString(hour24, minute) {
  return `${pad2(((hour24 % 24) + 24) % 24)}:${pad2(((minute % 60) + 60) % 60)}`
}

/** 循环步进 12 小时制的小时（12 之后回到 1，不跨越上午/下午） */
export function step12Hour(hour12, delta) {
  let h = hour12 + delta
  while (h < 1) h += 12
  while (h > 12) h -= 12
  return h
}
