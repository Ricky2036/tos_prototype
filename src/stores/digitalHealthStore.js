import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { readJson, writeRaw } from '../utils/localPrefs.js'
import { findRegisteredApp } from '../composables/useRegisteredApps.js'

/**
 * 数字健康偏好（对齐真机 Infinix X6878 / XOS 17，2026-11-10 逐页取证 /tmp/ref/gI/dh_*）。
 *
 * 归属：数字健康主页的「在应用列表中显示图标」开关、应用定时器、屏幕使用时间提醒、
 * 专注模式选中的应用、睡眠模式选项、看路提醒授权。
 * ⚠️ node 单测没有 localStorage，读写一律走 localPrefs 包装。
 */
const KEY = 'tos.settings.digitalHealth.v1'

export const DH_SLEEP_MODES = ['启用时间表', '在充电时开启', '无']

export const DH_DEFAULTS = {
  /** 「在应用列表中显示图标」，真机默认关闭 */
  showIconInAppList: false,
  /** 应用定时器：appId → 分钟（0 / 缺省 = 未设置） */
  limits: {},
  /** 屏幕使用时间提醒总开关，真机默认开 */
  reminderEnabled: true,
  /** 提醒名单用「排除法」：空数组 = 全部应用都提醒（真机进来是全选） */
  reminderExcluded: [],
  /** 专注模式勾选的分心应用，真机默认一个都没选 */
  focusApps: [],
  sleep: { enabled: false, mode: '无', alarmBehavior: true },
  walking: { enabled: false, activity: false, notify: true, location: false },
  /** 家长控制：PIN 码（真机「设置家长控制 PIN 码」，4 位数字，空串 = 未设置） */
  parental: { pin: '' }
}

export const useDigitalHealthStore = defineStore('digitalHealth', () => {
  const saved = readJson(KEY, {})
  // 旧数据里可能存了中文应用名，统一迁移到注册表 id
  const migrate = (list) => (Array.isArray(list) ? list.map(v => findRegisteredApp(v)?.id || v) : [])
  if (saved.reminderExcluded) saved.reminderExcluded = migrate(saved.reminderExcluded)
  if (saved.focusApps) saved.focusApps = migrate(saved.focusApps)

  const state = reactive({
    ...DH_DEFAULTS,
    ...saved,
    limits: { ...DH_DEFAULTS.limits, ...(saved.limits || {}) },
    reminderExcluded: saved.reminderExcluded || [],
    focusApps: saved.focusApps || [],
    sleep: { ...DH_DEFAULTS.sleep, ...(saved.sleep || {}) },
    walking: { ...DH_DEFAULTS.walking, ...(saved.walking || {}) },
    parental: { ...DH_DEFAULTS.parental, ...(saved.parental || {}) }
  })

  function persist() {
    writeRaw(KEY, JSON.stringify(state))
  }

  /* ---------- 主页 ---------- */
  function setShowIconInAppList(value) {
    state.showIconInAppList = Boolean(value)
    persist()
  }

  /* ---------- 应用定时器 ---------- */
  function setLimit(appId, minutes) {
    const m = Math.max(0, Math.round(Number(minutes) || 0))
    if (!m) delete state.limits[appId]
    else state.limits[appId] = m
    persist()
  }
  function clearLimit(appId) {
    delete state.limits[appId]
    persist()
  }
  function limitFor(appId) {
    return state.limits[appId] || 0
  }
  function limitCount() {
    return Object.keys(state.limits).length
  }

  /* ---------- 屏幕使用时间提醒 ---------- */
  function setReminderEnabled(value) {
    state.reminderEnabled = Boolean(value)
    persist()
  }
  function isReminderApp(appId) {
    return !state.reminderExcluded.includes(appId)
  }
  function toggleReminderApp(appId) {
    if (!state.reminderEnabled) return false
    state.reminderExcluded = state.reminderExcluded.includes(appId)
      ? state.reminderExcluded.filter(id => id !== appId)
      : [...state.reminderExcluded, appId]
    persist()
    return true
  }
  function reminderCount(total) {
    return Math.max(0, Number(total || 0) - state.reminderExcluded.length)
  }

  /* ---------- 专注模式 ---------- */
  function isFocusApp(appId) {
    return state.focusApps.includes(appId)
  }
  function toggleFocusApp(appId) {
    state.focusApps = state.focusApps.includes(appId)
      ? state.focusApps.filter(id => id !== appId)
      : [...state.focusApps, appId]
    persist()
  }

  /* ---------- 睡眠模式 ---------- */
  function setSleepMode(mode) {
    if (!DH_SLEEP_MODES.includes(mode)) return false
    state.sleep.mode = mode
    persist()
    return true
  }
  function setSleepEnabled(value) {
    state.sleep.enabled = Boolean(value)
    persist()
  }
  function setAlarmBehavior(value) {
    state.sleep.alarmBehavior = Boolean(value)
    persist()
  }

  /* ---------- 看路提醒 ---------- */
  function setWalkingEnabled(value) {
    state.walking.enabled = Boolean(value)
    persist()
  }
  function grantWalking(key) {
    state.walking[key] = true
    persist()
  }
  function walkingAllGranted() {
    const w = state.walking
    return w.enabled && w.activity && w.notify && w.location
  }

  /* ---------- 家长控制 ---------- */
  /** 只接受 4 位数字；传空串表示清除 */
  function setParentalPin(pin) {
    const v = String(pin || '').replace(/\D/g, '').slice(0, 4)
    if (v && v.length !== 4) return false
    state.parental.pin = v
    persist()
    return true
  }

  function reset() {
    Object.assign(state, {
      ...DH_DEFAULTS,
      limits: {},
      reminderExcluded: [],
      focusApps: [],
      sleep: { ...DH_DEFAULTS.sleep },
      walking: { ...DH_DEFAULTS.walking },
      parental: { ...DH_DEFAULTS.parental }
    })
    persist()
  }

  return {
    state,
    setShowIconInAppList,
    setLimit, clearLimit, limitFor, limitCount,
    setReminderEnabled, isReminderApp, toggleReminderApp, reminderCount,
    isFocusApp, toggleFocusApp,
    setSleepMode, setSleepEnabled, setAlarmBehavior,
    setWalkingEnabled, grantWalking, walkingAllGranted,
    setParentalPin,
    reset
  }
})
