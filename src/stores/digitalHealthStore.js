import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { readJson, writeRaw } from '../utils/localPrefs.js'
import { findRegisteredApp } from '../composables/useRegisteredApps.js'

/**
 * 数字健康偏好（对齐真机 Infinix X6878 / XOS 17，2026-11-10 逐页取证 /tmp/ref/gI/dh_*）。
 *
 * 归属：数字健康主页的「在应用列表中显示图标」开关、应用定时器、屏幕使用时间提醒、
 * 专注模式（时间表 + 运行态）、睡眠模式（时间表 + 通知过滤 + 屏幕选项）、看路提醒授权、家长控制 PIN。
 * ⚠️ node 单测没有 localStorage，读写一律走 localPrefs 包装。
 */
const KEY = 'tos.settings.digitalHealth.v1'

export const DH_SLEEP_MODES = ['启用时间表', '在充电时开启', '无']

/** 重复日按 JS `getDay()` 编号：0=周日 … 6=周六 */
export const DH_DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
export const DH_DAY_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export const DH_DEFAULTS = {
  /** 「在应用列表中显示图标」，真机默认关闭 */
  showIconInAppList: false,
  /** 应用定时器：appId → 分钟（0 / 缺省 = 未设置） */
  limits: {},
  /** 屏幕使用时间提醒总开关，真机默认开 */
  reminderEnabled: true,
  /** 提醒名单用「排除法」：空数组 = 全部应用都提醒（真机进来是全选） */
  reminderExcluded: [],
  /** 专注模式选中的分心应用，真机默认一个都没选 */
  focusApps: [],
  sleep: {
    enabled: false,
    mode: '无',
    alarmBehavior: true,
    /** 真机睡眠时间表默认 23:00 → 07:00，工作日 */
    schedule: { start: '23:00', end: '07:00', days: [1, 2, 3, 4, 5] },
    /** 开启时刻（毫秒），null = 当前没在跑 */
    since: null,
    /** 通知过滤条件：允许所有通知时，下面两条例外清单不生效 */
    notify: { allowAll: true, contactExceptions: [], appExceptions: [] },
    /** 屏幕选项 */
    screen: { dimWallpaper: true, grayscale: true }
  },
  walking: { enabled: false, activity: false, notify: true, location: false },
  /** 家长控制：PIN 码（真机「设置家长控制 PIN 码」，4 位数字，空串 = 未设置） */
  parental: { pin: '' },
  /** 专注模式时间表：[{ id, name, start, end, days[] }] */
  focusSchedules: [],
  /** 专注模式运行态：{ name, minutes, startedAt } | null */
  focusRunning: null,
  /** 用户发过的反馈（原型只落本地，不真的发网络） */
  feedback: []
}

let focusSeq = 0

export const useDigitalHealthStore = defineStore('digitalHealth', () => {
  const saved = readJson(KEY, {})
  // 旧数据里可能存了中文应用名，统一迁移到注册表 id
  const migrate = (list) => (Array.isArray(list) ? list.map(v => findRegisteredApp(v)?.id || v) : [])
  if (saved.reminderExcluded) saved.reminderExcluded = migrate(saved.reminderExcluded)
  if (saved.focusApps) saved.focusApps = migrate(saved.focusApps)
  if (saved.sleep?.notify) {
    saved.sleep.notify = {
      ...DH_DEFAULTS.sleep.notify,
      ...saved.sleep.notify,
      contactExceptions: migrate(saved.sleep.notify.contactExceptions || []),
      appExceptions: migrate(saved.sleep.notify.appExceptions || [])
    }
  }

  const state = reactive({
    ...DH_DEFAULTS,
    ...saved,
    limits: { ...DH_DEFAULTS.limits, ...(saved.limits || {}) },
    reminderExcluded: saved.reminderExcluded || [],
    focusApps: saved.focusApps || [],
    sleep: {
      ...DH_DEFAULTS.sleep,
      ...(saved.sleep || {}),
      schedule: { ...DH_DEFAULTS.sleep.schedule, ...(saved.sleep?.schedule || {}) },
      notify: { ...DH_DEFAULTS.sleep.notify, ...(saved.sleep?.notify || {}) },
      screen: { ...DH_DEFAULTS.sleep.screen, ...(saved.sleep?.screen || {}) }
    },
    walking: { ...DH_DEFAULTS.walking, ...(saved.walking || {}) },
    parental: { ...DH_DEFAULTS.parental, ...(saved.parental || {}) },
    focusSchedules: Array.isArray(saved.focusSchedules) ? saved.focusSchedules : [],
    focusRunning: saved.focusRunning || null,
    feedback: Array.isArray(saved.feedback) ? saved.feedback : []
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

  /** 新增一条专注时间表，返回 id；起止/重复日非法时返回 '' */
  function addFocusSchedule({ name, start, end, days }) {
    const s = String(start || '')
    const e = String(end || '')
    if (!/^\d{2}:\d{2}$/.test(s) || !/^\d{2}:\d{2}$/.test(e) || s === e) return ''
    const list = Array.isArray(days) ? days.filter(d => d >= 0 && d <= 6) : []
    if (!list.length) return ''
    focusSeq += 1
    const id = `fs${Date.now().toString(36)}${focusSeq}`
    state.focusSchedules = [
      ...state.focusSchedules,
      { id, name: String(name || '专注时间'), start: s, end: e, days: [...new Set(list)].sort() }
    ]
    persist()
    return id
  }
  function removeFocusSchedule(id) {
    state.focusSchedules = state.focusSchedules.filter(s => s.id !== id)
    persist()
  }
  /** 开启专注模式（minutes 为空表示不定时，只能手动结束） */
  function startFocus({ name, minutes } = {}) {
    state.focusRunning = {
      name: String(name || '专注时间'),
      minutes: Math.max(0, Math.round(Number(minutes) || 0)),
      startedAt: Date.now()
    }
    persist()
  }
  function stopFocus() {
    state.focusRunning = null
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
    state.sleep.since = state.sleep.enabled ? Date.now() : null
    persist()
  }
  function setAlarmBehavior(value) {
    state.sleep.alarmBehavior = Boolean(value)
    persist()
  }
  /** 时间表：start / end 为 'HH:mm'，days 为 getDay() 编号数组 */
  function setSleepSchedule(patch = {}) {
    const next = { ...state.sleep.schedule }
    if (typeof patch.start === 'string' && /^\d{2}:\d{2}$/.test(patch.start)) next.start = patch.start
    if (typeof patch.end === 'string' && /^\d{2}:\d{2}$/.test(patch.end)) next.end = patch.end
    if (Array.isArray(patch.days)) next.days = [...new Set(patch.days.filter(d => d >= 0 && d <= 6))].sort()
    state.sleep.schedule = next
    persist()
    return next
  }
  function toggleSleepDay(day) {
    const d = Number(day)
    if (!(d >= 0 && d <= 6)) return false
    const days = state.sleep.schedule.days.includes(d)
      ? state.sleep.schedule.days.filter(x => x !== d)
      : [...state.sleep.schedule.days, d]
    return setSleepSchedule({ days })
  }

  /* 通知过滤条件 */
  function setSleepAllowAll(value) {
    state.sleep.notify.allowAll = Boolean(value)
    persist()
  }
  function toggleSleepContact(name) {
    if (state.sleep.notify.allowAll) return false
    const list = state.sleep.notify.contactExceptions
    state.sleep.notify.contactExceptions = list.includes(name)
      ? list.filter(x => x !== name)
      : [...list, name]
    persist()
    return true
  }
  function toggleSleepApp(appId) {
    if (state.sleep.notify.allowAll) return false
    const list = state.sleep.notify.appExceptions
    state.sleep.notify.appExceptions = list.includes(appId)
      ? list.filter(x => x !== appId)
      : [...list, appId]
    persist()
    return true
  }

  /* 屏幕选项 */
  function setSleepScreen(key, value) {
    if (!(key in state.sleep.screen)) return false
    state.sleep.screen[key] = Boolean(value)
    persist()
    return true
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

  /* ---------- 反馈 ---------- */
  function pushFeedback(text) {
    const t = String(text || '').trim()
    if (!t) return false
    state.feedback = [...state.feedback, { text: t, at: Date.now() }].slice(-20)
    persist()
    return true
  }

  function reset() {
    Object.assign(state, {
      ...DH_DEFAULTS,
      limits: {},
      reminderExcluded: [],
      focusApps: [],
      sleep: {
        ...DH_DEFAULTS.sleep,
        schedule: { ...DH_DEFAULTS.sleep.schedule },
        notify: { ...DH_DEFAULTS.sleep.notify },
        screen: { ...DH_DEFAULTS.sleep.screen }
      },
      walking: { ...DH_DEFAULTS.walking },
      parental: { ...DH_DEFAULTS.parental },
      focusSchedules: [],
      feedback: []
    })
    persist()
  }

  return {
    state,
    setShowIconInAppList,
    setLimit, clearLimit, limitFor, limitCount,
    setReminderEnabled, isReminderApp, toggleReminderApp, reminderCount,
    isFocusApp, toggleFocusApp,
    addFocusSchedule, removeFocusSchedule, startFocus, stopFocus,
    setSleepMode, setSleepEnabled, setAlarmBehavior,
    setSleepSchedule, toggleSleepDay,
    setSleepAllowAll, toggleSleepContact, toggleSleepApp, setSleepScreen,
    setWalkingEnabled, grantWalking, walkingAllGranted,
    setParentalPin, pushFeedback,
    reset
  }
})
