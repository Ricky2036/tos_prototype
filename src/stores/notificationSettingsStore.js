import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readBool, readString, writeRaw } from '../utils/localPrefs.js'

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
  REMIND_STYLE: 'tos_notif_remind_style'
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

  function setBool(key, value) {
    const map = {
      showBatteryPercent: [showBatteryPercent, K.SHOW_BATTERY_PERCENT],
      iconNetSpeed: [iconNetSpeed, K.ICON_NET_SPEED],
      iconMagneticPower: [iconMagneticPower, K.ICON_MAGNETIC_POWER],
      iconAlarm: [iconAlarm, K.ICON_ALARM],
      iconHeadset: [iconHeadset, K.ICON_HEADSET],
      iconVpn: [iconVpn, K.ICON_VPN],
      iconDataSaver: [iconDataSaver, K.ICON_DATA_SAVER]
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

  function setRemindStyle(value) {
    remindStyle.value = value
    writeRaw(K.REMIND_STYLE, value)
    return true
  }

  /** 状态栏图标清单（真机顺序）：勿扰/网速/磁吸充电宝/蓝牙/闹钟/耳机/VPN/流量节省 */
  function iconRows() {
    return [
      { key: 'dnd', label: '勿扰', icon: 'moon', kind: 'control', controlKey: 'dnd' },
      { key: 'iconNetSpeed', label: '网速', icon: 'text' },
      { key: 'iconMagneticPower', label: '磁吸充电宝', icon: 'battery' },
      { key: 'bluetooth', label: '蓝牙', icon: 'bluetooth', kind: 'control', controlKey: 'bluetooth' },
      { key: 'iconAlarm', label: '闹钟', icon: 'alarm' },
      { key: 'iconHeadset', label: '耳机', icon: 'headset' },
      { key: 'iconVpn', label: 'VPN', icon: 'vpn' },
      { key: 'iconDataSaver', label: '流量节省', icon: 'droplet' }
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
    setBool,
    setBadgeStyle,
    setRemindStyle,
    iconRows
  }
})
