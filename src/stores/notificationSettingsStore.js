import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readBool, readString, writeRaw, readJson } from '../utils/localPrefs.js'

/**
 * 「通知与状态栏」下 状态栏 / 桌面角标 两个三级页的状态。
 *
 * ⚠️ 边界说明（重要）：
 * - 勿扰、蓝牙两项**不在这里**，它们直接读写 `controlStore`（`dnd` / `bluetooth`），
 *   因为状态栏上真的会画这两个图标（`src/utils/statusBarIndicators.js`）。
 * - 本 store 里的 `netSpeed / magneticPower / alarm / headset / vpn / dataSaver`
 *   是「状态栏图标显示」清单里当前状态栏**还没有对应图标**的几项，先记录开关状态，
 *   不接渲染。要接得改 `statusBarIndicators.js` 并重算挤压逻辑，属单独一件事。
 *
 * 默认值对齐真机 Infinix X6878（XOS 17）：全部图标开、显示电量百分比开、
 * 桌面角标样式=数字。
 */
const K = {
  SHOW_BATTERY_PERCENT: 'tos_notif_show_battery_percent',
  ICON_NET_SPEED: 'tos_notif_icon_net_speed',
  ICON_MAGNETIC_POWER: 'tos_notif_icon_magnetic_power',
  ICON_ALARM: 'tos_notif_icon_alarm',
  ICON_HEADSET: 'tos_notif_icon_headset',
  ICON_VPN: 'tos_notif_icon_vpn',
  ICON_DATA_SAVER: 'tos_notif_icon_data_saver',
  BADGE_STYLE: 'tos_notif_badge_style',
  REMIND_STYLE: 'tos_notif_remind_style',
  CC_LOCK_SCREEN: 'tos_notif_cc_lock_screen',
  LIVE_ACTIVITY_MORE: 'tos_notif_live_activity_more',
  FLOAT_STYLE: 'tos_notif_float_style',
  REMIND_LEVEL_BY_APP: 'tos_notif_remind_level_by_app',
  GROUPING_BY_APP: 'tos_notif_grouping_by_app'
}

export const BADGE_STYLES = ['数字', '圆点']

export const useNotificationSettingsStore = defineStore('notificationSettings', () => {
  const showBatteryPercent = ref(readBool(K.SHOW_BATTERY_PERCENT, true))
  const iconNetSpeed = ref(readBool(K.ICON_NET_SPEED, true))
  const iconMagneticPower = ref(readBool(K.ICON_MAGNETIC_POWER, true))
  const iconAlarm = ref(readBool(K.ICON_ALARM, true))
  const iconHeadset = ref(readBool(K.ICON_HEADSET, true))
  const iconVpn = ref(readBool(K.ICON_VPN, true))
  const iconDataSaver = ref(readBool(K.ICON_DATA_SAVER, true))

  const badgeStyle = ref(readString(K.BADGE_STYLE, '数字'))
  const remindStyle = ref(readString(K.REMIND_STYLE, '通知图标'))
  const ccLockScreen = ref(readBool(K.CC_LOCK_SCREEN, true))
  const liveActivityMore = ref(readBool(K.LIVE_ACTIVITY_MORE, false))

  // 悬浮通知样式：详细 / 简洁（真机用两张预览卡选）
  const floatStyle = ref(readString(K.FLOAT_STYLE, 'detailed'))
  // 提醒强度 / 通知分组是**按应用**设置的（真机在应用详情页里）
  const remindLevelByApp = ref(readJson(K.REMIND_LEVEL_BY_APP, {}))
  const groupingByApp = ref(readJson(K.GROUPING_BY_APP, {}))

  /** 智慧文本（Dynamic Bar → 智能服务 → 智慧文本）逐服务开关 */
  const smartTextServices = ref({
    phone: true,
    address: true,
    calendar: true,
    videoLink: true,
    forex: true,
    foreign: true
  })

  /** 场景智能（Dynamic Bar → 智能服务 → 场景智能）逐服务开关；AI Writing 真机默认关 */
  const sceneAiServices = ref({
    aiWriting: false,
    screenshot: true,
    docSummary: true
  })

  /** Dynamic Bar「实时活动」逐应用开关（真机按已安装的实时活动应用列出） */
  const liveActivityApps = ref({
    googleMaps: true,
    hiTranslate: true,
    songRecog: true
  })

  function setBool(key, value) {
    const map = {
      showBatteryPercent: [showBatteryPercent, K.SHOW_BATTERY_PERCENT],
      iconNetSpeed: [iconNetSpeed, K.ICON_NET_SPEED],
      iconMagneticPower: [iconMagneticPower, K.ICON_MAGNETIC_POWER],
      iconAlarm: [iconAlarm, K.ICON_ALARM],
      iconHeadset: [iconHeadset, K.ICON_HEADSET],
      iconVpn: [iconVpn, K.ICON_VPN],
      iconDataSaver: [iconDataSaver, K.ICON_DATA_SAVER],
      ccLockScreen: [ccLockScreen, K.CC_LOCK_SCREEN],
      liveActivityMore: [liveActivityMore, K.LIVE_ACTIVITY_MORE]
    }
    if (!map[key]) return false
    const [refObj, storageKey] = map[key]
    refObj.value = Boolean(value)
    writeRaw(storageKey, String(Boolean(value)))
    return true
  }

  function setBadgeStyle(value) {
    if (!BADGE_STYLES.includes(value)) return false
    badgeStyle.value = value
    writeRaw(K.BADGE_STYLE, value)
    return true
  }

  function setSmartTextService(key, value) {
    if (!(key in smartTextServices.value)) return false
    smartTextServices.value = { ...smartTextServices.value, [key]: Boolean(value) }
    return true
  }

  function setSceneAiService(key, value) {
    if (!(key in sceneAiServices.value)) return false
    sceneAiServices.value = { ...sceneAiServices.value, [key]: Boolean(value) }
    return true
  }

  function setFloatStyle(v) {
    if (!['detailed', 'concise'].includes(v)) return false
    floatStyle.value = v
    writeRaw(K.FLOAT_STYLE, v)
    return true
  }

  function setRemindLevel(appId, v) {
    if (!['smart', 'followApp', 'silent'].includes(v)) return false
    remindLevelByApp.value = { ...remindLevelByApp.value, [appId]: v }
    writeRaw(K.REMIND_LEVEL_BY_APP, JSON.stringify(remindLevelByApp.value))
    return true
  }

  function remindLevelOf(appId) {
    return remindLevelByApp.value[appId] || 'smart'
  }

  function setGrouping(appId, v) {
    if (!['auto', 'byApp'].includes(v)) return false
    groupingByApp.value = { ...groupingByApp.value, [appId]: v }
    writeRaw(K.GROUPING_BY_APP, JSON.stringify(groupingByApp.value))
    return true
  }

  function groupingOf(appId) {
    return groupingByApp.value[appId] || 'auto'
  }

  function setLiveActivity(appId, value) {
    if (!(appId in liveActivityApps.value)) return false
    liveActivityApps.value = { ...liveActivityApps.value, [appId]: Boolean(value) }
    return true
  }

  /** 还原控制中心布局：本原型里控制中心没有独立的排布数据，这里清掉锁屏呼出以外的自定义项 */
  function resetControlCenterLayout() {
    ccLockScreen.value = true
    writeRaw(K.CC_LOCK_SCREEN, 'true')
    return true
  }

  function setRemindStyle(value) {
    remindStyle.value = value
    writeRaw(K.REMIND_STYLE, value)
    return true
  }

  /** 状态栏图标清单（真机顺序）：勿扰/网速/磁吸充电宝/蓝牙/闹钟/耳机/VPN/流量节省 */
  function iconRows() {
    // 图标复用仓里既有的 lucide 键（LIcon），不再手绘；网速那行是真机的文字图标
    return [
      { key: 'dnd', label: '勿扰', lucide: 'moon', filled: true, kind: 'control', controlKey: 'dnd' },
      { key: 'iconNetSpeed', label: '网速', text: true },
      { key: 'iconMagneticPower', label: '磁吸充电宝', lucide: 'batteryCharging', filled: true },
      { key: 'bluetooth', label: '蓝牙', lucide: 'bluetooth', kind: 'control', controlKey: 'bluetooth' },
      { key: 'iconAlarm', label: '闹钟', lucide: 'alarmClock', filled: true },
      { key: 'iconHeadset', label: '耳机', lucide: 'headphones' },
      { key: 'iconVpn', label: 'VPN', lucide: 'vpn' },
      { key: 'iconDataSaver', label: '流量节省', lucide: 'droplet', filled: true }
    ]
  }

  return {
    showBatteryPercent,
    iconNetSpeed,
    iconMagneticPower,
    iconAlarm,
    iconHeadset,
    iconVpn,
    iconDataSaver,
    badgeStyle,
    remindStyle,
    ccLockScreen,
    liveActivityMore,
    floatStyle,
    setFloatStyle,
    remindLevelByApp,
    groupingByApp,
    setRemindLevel,
    remindLevelOf,
    setGrouping,
    groupingOf,
    liveActivityApps,
    smartTextServices,
    sceneAiServices,
    setSmartTextService,
    setSceneAiService,
    setLiveActivity,
    resetControlCenterLayout,
    setBool,
    setBadgeStyle,
    setRemindStyle,
    iconRows
  }
})
