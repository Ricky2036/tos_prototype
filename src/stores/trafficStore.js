import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { readBool, readJson, readNumber, readString, writeRaw } from '../utils/localPrefs.js'
import { getRegisteredApps } from '../composables/useRegisteredApps.js'
import { TM_ALERTS, TM_LIMIT } from '../components/apps/settings/sim/trafficData.js'

/**
 * 「流量管理」模块状态（SIM 卡与网络设置 → 流量管理）
 *
 * 真机依据：录屏（2026-11-20 录制，444×960）。默认值逐条对着录屏第一帧：
 *   省流量模式=关 · 日流量限额=开（500.0 MB） · 熄屏监控=开
 *   自定义流量提醒=开（20%） · 套餐失效提醒=开 · 自动关闭移动数据=开
 *   流量网速显示=开 · 流量使用报告=开 · 套餐自动同步=开
 *   应用 Wi-Fi 权限 / 不受限制的应用：录屏里都是全开
 */
const KEY = 'tos.settings.traffic.v1'

/**
 * 「显示系统应用」筛掉的名单（真机 ⋮ 里那一项）。
 * 只列本原型桌面注册表里确有的系统自带应用；⛔ 不从应用名猜，按 id 写死更可控。
 */
export const TRAFFIC_SYSTEM_APP_IDS = [
  'phone', 'messages', 'settings', 'camera', 'photos', 'clock', 'calendar',
  'calculator', 'notes', 'files', 'compass', 'voicememos', 'weather', 'tips'
]

/**
 * 「不受限制的应用」默认放行名单（真机截图口径：通话/信息类 + 系统自带应用放行，
 * 其余一律落在「其他应用」里，开关默认关）。
 */
export const TRAFFIC_DEFAULT_UNRESTRICTED_EXTRA = ['wechat', 'gmail']

export const TRAFFIC_DEFAULTS = {
  saveMode: false,
  limitEnabled: true,
  limitBytes: TM_LIMIT.defaultBytes,
  limitUnit: 'MB',
  screenOff: true,
  customAlerts: true,
  alertRatio: 20,
  planExpiryAlert: true,
  autoDisableData: true,
  speedDisplay: true,
  usageReport: true,
  autoSync: true
}

/** 默认放行名单 = 系统自带 + 通讯类（只保留注册表里确实存在的） */
function defaultUnrestricted() {
  const ids = new Set(getRegisteredApps().map(a => a.id))
  return [...TRAFFIC_SYSTEM_APP_IDS, ...TRAFFIC_DEFAULT_UNRESTRICTED_EXTRA].filter(id => ids.has(id))
}

function load() {
  return { ...TRAFFIC_DEFAULTS, ...readJson(KEY, {}) }
}

export const useTrafficStore = defineStore('trafficSettings', () => {
  const saved = load()

  const saveMode = ref(readBool(`${KEY}.saveMode`, saved.saveMode))
  const limitEnabled = ref(readBool(`${KEY}.limitEnabled`, saved.limitEnabled))
  const limitBytes = ref(readNumber(`${KEY}.limitBytes`, saved.limitBytes))
  const limitUnit = ref(readString(`${KEY}.limitUnit`, saved.limitUnit))
  const screenOff = ref(readBool(`${KEY}.screenOff`, saved.screenOff))

  const customAlerts = ref(readBool(`${KEY}.customAlerts`, saved.customAlerts))
  const alertRatio = ref(readNumber(`${KEY}.alertRatio`, saved.alertRatio))
  const planExpiryAlert = ref(readBool(`${KEY}.planExpiryAlert`, saved.planExpiryAlert))
  const autoDisableData = ref(readBool(`${KEY}.autoDisableData`, saved.autoDisableData))

  const speedDisplay = ref(readBool(`${KEY}.speedDisplay`, saved.speedDisplay))
  const usageReport = ref(readBool(`${KEY}.usageReport`, saved.usageReport))
  const autoSync = ref(readBool(`${KEY}.autoSync`, saved.autoSync))
  /** ⋮ 里「显示系统应用」：默认显示（真机列表里本来就有电话/短信这类系统应用） */
  const showSystemApps = ref(readBool(`${KEY}.showSystemApps`, true))

  /* 应用开关：名单一律取注册表，⛔ 不硬编码应用名 */
  const appIds = computed(() => getRegisteredApps().map(a => a.id))
  const wifiAllowed = ref(readJson(`${KEY}.wifiAllowed`, appIds.value))
  const unrestricted = ref(readJson(`${KEY}.unrestricted`, defaultUnrestricted()))

  function persist() {
    writeRaw(KEY, JSON.stringify({
      saveMode: saveMode.value,
      limitEnabled: limitEnabled.value,
      limitBytes: limitBytes.value,
      limitUnit: limitUnit.value,
      screenOff: screenOff.value,
      customAlerts: customAlerts.value,
      alertRatio: alertRatio.value,
      planExpiryAlert: planExpiryAlert.value,
      autoDisableData: autoDisableData.value,
      speedDisplay: speedDisplay.value,
      usageReport: usageReport.value,
      autoSync: autoSync.value,
      showSystemApps: showSystemApps.value,
      wifiAllowed: wifiAllowed.value,
      unrestricted: unrestricted.value
    }))
  }

  /** 布尔开关的统一写入口（写值 + 落盘，组件里不要直接改 ref） */
  const FLAGS = {
    saveMode,
    limitEnabled,
    screenOff,
    customAlerts,
    planExpiryAlert,
    autoDisableData,
    speedDisplay,
    usageReport,
    autoSync
  }

  function setFlag(key, value) {
    const target = FLAGS[key]
    if (!target) return false
    target.value = Boolean(value)
    persist()
    return true
  }

  /** 开关集合的通用切换：list = 'wifiAllowed' | 'unrestricted' */  function toggleApp(list, id) {
    const target = list === 'unrestricted' ? unrestricted : wifiAllowed
    const set = new Set(target.value)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    target.value = [...set]
    persist()
  }

  /** 批量放行 / 批量禁止（不受限制的应用右上 ⋮ 两项，真机同款操作） */
  function setAllApps(list, on) {
    const target = list === 'unrestricted' ? unrestricted : wifiAllowed
    target.value = on ? [...appIds.value] : []
    persist()
    return true
  }

  function isAppOn(list, id) {
    const arr = list === 'unrestricted' ? unrestricted.value : wifiAllowed.value
    return arr.includes(id)
  }

  /** 提醒比例只收 10~50 的档位（真机是 5 档滑杆） */
  function setAlertRatio(v) {
    const n = Number(v)
    if (!Number.isFinite(n)) return false
    const snapped = TM_ALERTS.ratios.reduce((best, r) => (Math.abs(r - n) < Math.abs(best - n) ? r : best), TM_ALERTS.ratios[0])
    alertRatio.value = snapped
    persist()
    return true
  }

  /** 限额：值必须 > 0，单位只收 MB / GB */
  function setLimit(bytes, unit = limitUnit.value) {
    const n = Number(bytes)
    if (!Number.isFinite(n) || n <= 0) return false
    if (!TM_LIMIT.units.includes(unit)) return false
    limitBytes.value = Math.round(n)
    limitUnit.value = unit
    persist()
    return true
  }

  return {
    saveMode,
    limitEnabled,
    limitBytes,
    limitUnit,
    screenOff,
    customAlerts,
    alertRatio,
    planExpiryAlert,
    autoDisableData,
    speedDisplay,
    usageReport,
    autoSync,
    showSystemApps,
    wifiAllowed,
    unrestricted,
    appIds,
    persist,
    setFlag,
    toggleApp,
    setAllApps,
    isAppOn,
    setAlertRatio,
    setLimit
  }
})
