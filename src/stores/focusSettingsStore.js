import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { readJson, writeRaw } from '../utils/localPrefs.js'
import { useControlStore } from './controlStore.js'

const KEY = 'tos.settings.focus.v1'

export const FOCUS_COLORS = ['#5E5CE6', '#BF5AF2', '#FF375F', '#FF9F0A', '#FFD60A', '#32D74B', '#64D2FF', '#0A84FF', '#8E8E93', '#30B0C7', '#FF453A', '#AC8E68']
export const FOCUS_WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
export const FOCUS_TEMPLATES = [
  { id: 'custom', name: '自定义', icon: 'plus', color: '#8E8E93' },
  { id: 'fitness', name: '健身', icon: 'dumbbell', color: '#32D74B' },
  { id: 'mindfulness', name: '正念', icon: 'flower2', color: '#30B0C7' },
  { id: 'gaming', name: '游戏', icon: 'rocket', color: '#0A84FF' },
  { id: 'reading', name: '阅读', icon: 'book', color: '#FF9F0A' },
  { id: 'driving', name: '驾驶', icon: 'car', color: '#5E5CE6' }
]

function timeSchedule(start, end) {
  return { id: `time-${start}-${end}`, type: 'time', start, end, days: [0, 1, 2, 3, 4, 5, 6], enabled: true }
}

function baseMode(id, name, icon, color, custom = false) {
  return {
    id, name, icon, color, custom,
    notificationMode: 'allow', allowedPeople: [], allowedApps: [],
    screens: { lock: '', home: '', watch: '' },
    smartActivation: false, schedules: [], filters: [],
    options: { dimLockScreen: true, hideBadges: false, silenceNotifications: true },
    filterValues: { calendars: [], phoneAccount: '', alwaysOnDisplay: 'off' }
  }
}

export function createDefaultFocusModes() {
  const dnd = baseMode('dnd', '勿扰模式', 'moon', '#5E5CE6')
  const personal = baseMode('personal', '个人', 'user', '#BF5AF2')
  const work = baseMode('work', '工作', 'briefcase', '#30B0C7')
  const sleep = baseMode('sleep', '睡眠', 'bedDouble', '#64D2FF')
  const classroom = baseMode('classroom', '课堂专注模式', 'graduationCap', '#5E5CE6', true)
  classroom.allowedPeople = ['蔡']
  classroom.allowedApps = ['wechat', 'mori']
  classroom.screens = { lock: 'aurora', home: 'default', watch: 'dark' }
  classroom.smartActivation = true
  classroom.schedules = [
    timeSchedule('09:00', '10:00'),
    timeSchedule('12:00', '12:09'),
    timeSchedule('16:08', '17:00'),
    { id: 'location-office', type: 'location', name: '南山云科技大厦', address: '深圳市南山区', enabled: true },
    { id: 'app-camera', type: 'app', appId: 'camera', name: '相机', enabled: true }
  ]
  classroom.filters = ['lowPower', 'silent']
  return [dnd, personal, work, sleep, classroom]
}

export function focusShortName(mode) {
  if (!mode) return '专注模式'
  return mode.id === 'dnd' ? mode.name : mode.name.replace(/专注模式$/, '')
}

export function formatSchedule(schedule) {
  if (!schedule) return ''
  if (schedule.type === 'time') return `${schedule.start}–${schedule.end}`
  return schedule.name || ''
}

export function formatRepeat(days = []) {
  if (days.length === 7) return '每天'
  if (!days.length) return '永不'
  const ordered = [1, 2, 3, 4, 5, 6, 0].filter(day => days.includes(day))
  return ordered.map(day => `周${FOCUS_WEEKDAYS[day]}`).join('、')
}

export const useFocusSettingsStore = defineStore('focusSettings', () => {
  const saved = readJson(KEY, {})
  const defaults = createDefaultFocusModes()
  const savedModes = Array.isArray(saved.modes) ? saved.modes : []
  const modes = defaults.map(mode => {
    const old = savedModes.find(item => item.id === mode.id)
    return old ? { ...mode, ...old, screens: { ...mode.screens, ...old.screens }, options: { ...mode.options, ...old.options }, filterValues: { ...mode.filterValues, ...old.filterValues } } : mode
  })
  for (const mode of savedModes) {
    if (!modes.some(item => item.id === mode.id)) modes.push(mode)
  }
  const state = reactive({
    modes,
    activeId: saved.activeId || null,
    sharedAcrossDevices: saved.sharedAcrossDevices !== false,
    targetModeId: null,
    targetView: null
  })
  const control = useControlStore()

  const activeMode = computed(() => state.modes.find(mode => mode.id === state.activeId) || null)
  function persist() {
    writeRaw(KEY, JSON.stringify({ modes: state.modes, activeId: state.activeId, sharedAcrossDevices: state.sharedAcrossDevices }))
  }
  function syncControl() {
    const enabled = Boolean(state.activeId)
    control.dnd = enabled
    control.doNotDisturb = enabled
  }
  function getMode(id) { return state.modes.find(mode => mode.id === id) || null }
  function activate(id) {
    if (!getMode(id)) return false
    state.activeId = id
    syncControl()
    persist()
    return true
  }
  function deactivate() {
    state.activeId = null
    syncControl()
    persist()
  }
  function toggle(id) {
    if (state.activeId === id) deactivate()
    else activate(id)
  }
  function createMode(draft) {
    const rawName = String(draft.name || '').trim()
    if (!rawName) return null
    const id = `custom-${Date.now().toString(36)}`
    const mode = baseMode(id, rawName.endsWith('专注模式') ? rawName : `${rawName}专注模式`, draft.icon || 'smile', draft.color || '#5E5CE6', true)
    mode.notificationMode = draft.notificationMode || 'allow'
    mode.allowedPeople = [...(draft.allowedPeople || [])]
    mode.allowedApps = [...(draft.allowedApps || [])]
    state.modes.push(mode)
    persist()
    return id
  }
  function updateMode(id, patch) {
    const mode = getMode(id)
    if (!mode) return false
    const allowed = ['name', 'icon', 'color', 'notificationMode', 'smartActivation']
    for (const key of allowed) {
      if (patch[key] !== undefined) mode[key] = patch[key]
    }
    persist()
    return true
  }
  function deleteMode(id) {
    const mode = getMode(id)
    if (!mode?.custom) return false
    state.modes = state.modes.filter(item => item.id !== id)
    if (state.activeId === id) deactivate()
    persist()
    return true
  }
  function togglePerson(id, person) {
    const mode = getMode(id)
    if (!mode) return
    mode.allowedPeople = mode.allowedPeople.includes(person) ? mode.allowedPeople.filter(item => item !== person) : [...mode.allowedPeople, person]
    persist()
  }
  function toggleApp(id, appId) {
    const mode = getMode(id)
    if (!mode) return
    mode.allowedApps = mode.allowedApps.includes(appId) ? mode.allowedApps.filter(item => item !== appId) : [...mode.allowedApps, appId]
    persist()
  }
  function setScreen(id, type, value) {
    const mode = getMode(id)
    if (!mode || !['lock', 'home', 'watch'].includes(type)) return false
    mode.screens[type] = value
    persist()
    return true
  }
  function addSchedule(id, schedule) {
    const mode = getMode(id)
    if (!mode) return null
    const item = { ...schedule, id: schedule.id || `${schedule.type}-${Date.now().toString(36)}`, enabled: schedule.enabled !== false }
    mode.schedules.push(item)
    persist()
    return item.id
  }
  function updateSchedule(id, scheduleId, patch) {
    const schedule = getMode(id)?.schedules.find(item => item.id === scheduleId)
    if (!schedule) return false
    Object.assign(schedule, patch, { id: scheduleId })
    persist()
    return true
  }
  function removeSchedule(id, scheduleId) {
    const mode = getMode(id)
    if (!mode) return
    mode.schedules = mode.schedules.filter(item => item.id !== scheduleId)
    persist()
  }
  function toggleFilter(id, filter) {
    const mode = getMode(id)
    if (!mode) return
    mode.filters = mode.filters.includes(filter) ? mode.filters.filter(item => item !== filter) : [...mode.filters, filter]
    persist()
  }
  function setFilterValue(id, key, value) {
    const mode = getMode(id)
    if (!mode) return
    mode.filterValues[key] = value
    persist()
  }
  function setOption(id, key, value) {
    const mode = getMode(id)
    if (!mode || !(key in mode.options)) return false
    mode.options[key] = Boolean(value)
    persist()
    return true
  }
  function setShared(value) {
    state.sharedAcrossDevices = Boolean(value)
    persist()
  }
  function openSettings(modeId = null, targetView = null) {
    state.targetModeId = modeId
    state.targetView = targetView
  }
  function consumeTarget() {
    const target = { modeId: state.targetModeId, view: state.targetView }
    state.targetModeId = null
    state.targetView = null
    return target
  }
  function reset() {
    state.modes = createDefaultFocusModes()
    state.activeId = null
    state.sharedAcrossDevices = true
    state.targetModeId = null
    state.targetView = null
    syncControl()
    persist()
  }

  return {
    state, activeMode, getMode, activate, deactivate, toggle,
    createMode, updateMode, deleteMode, togglePerson, toggleApp,
    setScreen, addSchedule, updateSchedule, removeSchedule,
    toggleFilter, setFilterValue, setOption, setShared,
    openSettings, consumeTarget, reset
  }
})
