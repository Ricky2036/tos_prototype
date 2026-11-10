import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { readJson, writeRaw } from '../utils/localPrefs.js'
import { findRegisteredApp } from '../composables/useRegisteredApps.js'

/**
 * 勿扰模式偏好（对齐 Infinix X6878 / XOS 17，2026-11-10 真机逐页取证 /tmp/ref/gI/dnd_*）。
 * 主页两个开关仍分别来自 controlStore.doNotDisturb 与 prayerStore.allowRepeatedCalls，
 * 这里只管新补的三级页 / 弹层状态。
 * ⚠️ node 单测没有 localStorage，读写一律走 localPrefs 包装。
 */
const KEY = 'tos.settings.dnd.v1'

export const DND_SCHEDULE_MODES = ['已关闭', '定时切换']
export const DND_CALL_OPTIONS = ['无', '所有人', '联系人', '收藏联系人']
export const DND_WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
export const DND_WEEKDAYS_FULL = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']

export const DND_DEFAULTS = {
  scheduleMode: '定时切换',
  startHour: 22,
  startMinute: 0,
  endHour: 7,
  endMinute: 0,
  repeatDays: [0, 1, 3, 4, 6], // 真机：周一、周二、周四、周五、周日
  allowCalls: '收藏联系人',
  allowedApps: ['wechat']
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

/** 24 小时制 → 真机文案「下午10:00」/「上午7:00」 */
export function formatDndTime(hour, minute) {
  const h = ((Number(hour) % 24) + 24) % 24
  const m = ((Number(minute) % 60) + 60) % 60
  const period = h < 12 ? '上午' : '下午'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${period}${h12}:${pad2(m)}`
}

export const useDndSettingsStore = defineStore('dndSettings', () => {
  const saved = readJson(KEY, {})
  // 旧版本按中文名存允许应用，统一迁移到注册表 id，避免名字一改就失联
  if (Array.isArray(saved.allowedApps)) {
    saved.allowedApps = saved.allowedApps.map(v => findRegisteredApp(v)?.id || v)
  }
  const state = reactive({ ...DND_DEFAULTS, ...saved })

  function persist() {
    writeRaw(KEY, JSON.stringify(state))
  }

  function setScheduleMode(value) {
    if (!DND_SCHEDULE_MODES.includes(value)) return false
    state.scheduleMode = value
    persist()
    return true
  }

  function setStartTime(hour, minute) {
    state.startHour = ((Number(hour) % 24) + 24) % 24
    state.startMinute = ((Number(minute) % 60) + 60) % 60
    persist()
  }

  function setEndTime(hour, minute) {
    state.endHour = ((Number(hour) % 24) + 24) % 24
    state.endMinute = ((Number(minute) % 60) + 60) % 60
    persist()
  }

  function setRepeatDays(days) {
    const clean = [...new Set(days)].filter(d => Number.isInteger(d) && d >= 0 && d <= 6).sort((a, b) => a - b)
    if (!clean.length) return false
    state.repeatDays = clean
    persist()
    return true
  }

  function toggleRepeatDay(day) {
    const next = state.repeatDays.includes(day)
      ? state.repeatDays.filter(d => d !== day)
      : [...state.repeatDays, day].sort((a, b) => a - b)
    if (!next.length) return false
    state.repeatDays = next
    persist()
    return true
  }

  function setAllowCalls(value) {
    if (!DND_CALL_OPTIONS.includes(value)) return false
    state.allowCalls = value
    persist()
    return true
  }

  function toggleApp(appId) {
    state.allowedApps = state.allowedApps.includes(appId)
      ? state.allowedApps.filter(id => id !== appId)
      : [...state.allowedApps, appId]
    persist()
  }

  function reset() {
    Object.assign(state, DND_DEFAULTS, { repeatDays: [...DND_DEFAULTS.repeatDays], allowedApps: [...DND_DEFAULTS.allowedApps] })
    persist()
  }

  return {
    state,
    setScheduleMode, setStartTime, setEndTime,
    setRepeatDays, toggleRepeatDay, setAllowCalls,
    toggleApp, reset
  }
})
