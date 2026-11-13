import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readBool, readString, writeRaw } from '../utils/localPrefs.js'

/**
 * 「日期与时间」状态（SET-WB-01）
 * ================================
 * 默认值与依赖矩阵全部来自真机采集包 `spec/captures/SET-DSH-01-A-B.md`
 * （Infinix X6878 / Android 17，2026-11-13 13:47–13:52 采）。
 *
 * 已验证事实（包 B1 / B2）：
 *   · 自动设置时间 = 开 → 「日期」「时间」两行 enabled=false
 *   · 自动设置时区 = 开 → 「选择时区」enabled=false
 *   · 24 小时制 / 系统双时钟 / 常驻地 / 双时钟显示位置 不受两个总开关影响
 *
 * 未知项（不猜，等包 C / D）：
 *   · 两个总开关「关」态下点击日期/时间/时区后落到哪个选择器、是否有 toast/联网校验
 *   · 「使用 24 小时制」的开态默认值（包 B 未标状态，暂用 false 占位；
 *     「系统双时钟」已由整屏截图 04-datetime-default.png 确认为开）
 *   · 跨应用/重启后的持久化策略（包 D 待采；本 store 按仓库既有 localPrefs 约定持久化）
 *   · 地区/运营商/SIM 是否影响入口（包 A3 unknown）
 */
export const DATE_TIME_KEYS = {
  AUTO_TIME: 'tos_datetime_auto_time',
  DATE: 'tos_datetime_date',
  TIME: 'tos_datetime_time',
  USE_24_HOUR: 'tos_datetime_use_24_hour',
  AUTO_TIMEZONE: 'tos_datetime_auto_timezone',
  TIMEZONE: 'tos_datetime_timezone',
  DUAL_CLOCK: 'tos_datetime_dual_clock',
  RESIDENCE: 'tos_datetime_residence',
  DUAL_CLOCK_POSITION: 'tos_datetime_dual_clock_position',
}

export const DATE_TIME_DEFAULTS = {
  autoTime: true,
  date: '2026年11月13日',
  time: '下午1:49',
  use24Hour: false,
  autoTimezone: true,
  timezone: 'GMT+08:00 中国标准时间',
  dualClock: true,
  residence: '常驻地预测（深圳市）',
  dualClockPosition: '锁屏和时钟桌面小部件',
}

export const useDateTimeStore = defineStore('dateTime', () => {
  const autoTime = ref(readBool(DATE_TIME_KEYS.AUTO_TIME, DATE_TIME_DEFAULTS.autoTime))
  const date = ref(readString(DATE_TIME_KEYS.DATE, DATE_TIME_DEFAULTS.date))
  const time = ref(readString(DATE_TIME_KEYS.TIME, DATE_TIME_DEFAULTS.time))
  const use24Hour = ref(readBool(DATE_TIME_KEYS.USE_24_HOUR, DATE_TIME_DEFAULTS.use24Hour))
  const autoTimezone = ref(readBool(DATE_TIME_KEYS.AUTO_TIMEZONE, DATE_TIME_DEFAULTS.autoTimezone))
  const timezone = ref(readString(DATE_TIME_KEYS.TIMEZONE, DATE_TIME_DEFAULTS.timezone))
  const dualClock = ref(readBool(DATE_TIME_KEYS.DUAL_CLOCK, DATE_TIME_DEFAULTS.dualClock))
  const residence = ref(readString(DATE_TIME_KEYS.RESIDENCE, DATE_TIME_DEFAULTS.residence))
  const dualClockPosition = ref(readString(DATE_TIME_KEYS.DUAL_CLOCK_POSITION, DATE_TIME_DEFAULTS.dualClockPosition))

  /** 依赖矩阵：两个总开关只锁自己那组行，其余行不受影响 */
  const canEditDate = () => !autoTime.value
  const canEditTime = () => !autoTime.value
  const canSelectTimezone = () => !autoTimezone.value

  function setAutoTime(v) {
    autoTime.value = Boolean(v)
    writeRaw(DATE_TIME_KEYS.AUTO_TIME, String(autoTime.value))
    return true
  }
  function setAutoTimezone(v) {
    autoTimezone.value = Boolean(v)
    writeRaw(DATE_TIME_KEYS.AUTO_TIMEZONE, String(autoTimezone.value))
    return true
  }
  function setUse24Hour(v) {
    use24Hour.value = Boolean(v)
    writeRaw(DATE_TIME_KEYS.USE_24_HOUR, String(use24Hour.value))
    return true
  }
  function setDualClock(v) {
    dualClock.value = Boolean(v)
    writeRaw(DATE_TIME_KEYS.DUAL_CLOCK, String(dualClock.value))
    return true
  }
  /** 被总开关锁住时拒绝写入，避免 UI 禁用态被绕过 */
  function setDate(v) {
    if (!canEditDate()) return false
    date.value = String(v)
    writeRaw(DATE_TIME_KEYS.DATE, date.value)
    return true
  }
  function setTime(v) {
    if (!canEditTime()) return false
    time.value = String(v)
    writeRaw(DATE_TIME_KEYS.TIME, time.value)
    return true
  }
  function setTimezone(v) {
    if (!canSelectTimezone()) return false
    timezone.value = String(v)
    writeRaw(DATE_TIME_KEYS.TIMEZONE, timezone.value)
    return true
  }
  function setResidence(v) {
    residence.value = String(v)
    writeRaw(DATE_TIME_KEYS.RESIDENCE, residence.value)
    return true
  }
  function setDualClockPosition(v) {
    dualClockPosition.value = String(v)
    writeRaw(DATE_TIME_KEYS.DUAL_CLOCK_POSITION, dualClockPosition.value)
    return true
  }

  return {
    autoTime, date, time, use24Hour, autoTimezone, timezone,
    dualClock, residence, dualClockPosition,
    canEditDate, canEditTime, canSelectTimezone,
    setAutoTime, setAutoTimezone, setUse24Hour, setDualClock,
    setDate, setTime, setTimezone, setResidence, setDualClockPosition,
  }
})
