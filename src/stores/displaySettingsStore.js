import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readBool, readNumber, readString, writeRaw } from '../utils/localPrefs.js'

/**
 * 「显示与亮度」及其三级页的状态。
 *
 * 默认值逐条对齐真机 Infinix X6878（XOS 17，Android 17）：
 * 定时切换主题=已关闭 · 深色主题下壁纸变暗=开 · 助眠/护眼=关 · 色彩=原色 · 色温=中间
 * 刷新率=智能切换 · 息屏=10 分钟 · 字体=TransSans · 显示大小=标准 · 竖屏锁定=开 · 强光模式=开
 */
const K = {
  THEME_SCHEDULE: 'tos_display_theme_schedule',
  DARK_WALLPAPER_DIM: 'tos_display_dark_wallpaper_dim',
  SLEEP_ASSIST: 'tos_display_sleep_assist',
  EYE_CARE: 'tos_display_eye_care',
  EYE_CARE_SCHEDULE: 'tos_display_eye_care_schedule',
  EYE_CARE_TEMP: 'tos_display_eye_care_temp',
  COLOR_MODE: 'tos_display_color_mode',
  COLOR_TEMP: 'tos_display_color_temp',
  REFRESH_RATE: 'tos_display_refresh_rate',
  AUTO_SLEEP: 'tos_display_auto_sleep',
  FONT_FAMILY: 'tos_display_font_family',
  FONT_SIZE: 'tos_display_font_size',
  FONT_WEIGHT: 'tos_display_font_weight',
  DISPLAY_SIZE: 'tos_display_size',
  GESTURE_QUICK_SIZE: 'tos_display_gesture_quick_size',
  STRONG_LIGHT: 'tos_display_strong_light'
}

export const AUTO_SLEEP_OPTIONS = ['15 秒', '30 秒', '1 分钟', '2 分钟', '5 分钟', '10 分钟']
export const THEME_SCHEDULE_OPTIONS = [
  { value: 'off', label: '已关闭' },
  { value: 'scheduled', label: '定时切换' },
  { value: 'sunset', label: '日落至日出' }
]

export const useDisplaySettingsStore = defineStore('displaySettings', () => {
  const themeSchedule = ref(readString(K.THEME_SCHEDULE, 'off'))
  const darkWallpaperDim = ref(readBool(K.DARK_WALLPAPER_DIM, true))
  const sleepAssist = ref(readBool(K.SLEEP_ASSIST, false))
  const eyeCare = ref(readBool(K.EYE_CARE, false))
  const eyeCareSchedule = ref(readString(K.EYE_CARE_SCHEDULE, 'off'))
  const eyeCareTemp = ref(readNumber(K.EYE_CARE_TEMP, 0.5))
  const colorMode = ref(readString(K.COLOR_MODE, 'original'))
  const colorTemp = ref(readNumber(K.COLOR_TEMP, 0.5))
  const refreshRate = ref(readString(K.REFRESH_RATE, 'auto'))
  const autoSleep = ref(readString(K.AUTO_SLEEP, '10 分钟'))
  const fontFamily = ref(readString(K.FONT_FAMILY, 'TransSans'))
  const fontSize = ref(readNumber(K.FONT_SIZE, 0.35))
  const fontWeight = ref(readNumber(K.FONT_WEIGHT, 0.5))
  const displaySize = ref(readString(K.DISPLAY_SIZE, 'standard'))
  const gestureQuickSize = ref(readBool(K.GESTURE_QUICK_SIZE, true))
  const strongLightMode = ref(readBool(K.STRONG_LIGHT, true))

  function setThemeSchedule(v) {
    themeSchedule.value = v
    writeRaw(K.THEME_SCHEDULE, v)
  }

  function setColorMode(v) {
    if (!['vivid', 'original'].includes(v)) return false
    colorMode.value = v
    writeRaw(K.COLOR_MODE, v)
    return true
  }

  function setRefreshRate(v) {
    if (!['auto', 'standard', 'high'].includes(v)) return false
    refreshRate.value = v
    writeRaw(K.REFRESH_RATE, v)
    return true
  }

  function setAutoSleep(v) {
    if (!AUTO_SLEEP_OPTIONS.includes(v)) return false
    autoSleep.value = v
    writeRaw(K.AUTO_SLEEP, v)
    return true
  }

  function setDisplaySize(v) {
    if (!['standard', 'mini'].includes(v)) return false
    displaySize.value = v
    writeRaw(K.DISPLAY_SIZE, v)
    return true
  }

  function setFontFamily(v) {
    if (!['TransSans', 'Roboto'].includes(v)) return false
    fontFamily.value = v
    writeRaw(K.FONT_FAMILY, v)
    return true
  }

  function setBool(key, value) {
    const map = {
      darkWallpaperDim: [darkWallpaperDim, K.DARK_WALLPAPER_DIM],
      sleepAssist: [sleepAssist, K.SLEEP_ASSIST],
      eyeCare: [eyeCare, K.EYE_CARE],
      gestureQuickSize: [gestureQuickSize, K.GESTURE_QUICK_SIZE],
      strongLightMode: [strongLightMode, K.STRONG_LIGHT]
    }
    if (!map[key]) return false
    const [refObj, storageKey] = map[key]
    refObj.value = Boolean(value)
    writeRaw(storageKey, String(Boolean(value)))
    return true
  }

  function setNumber(key, value) {
    const map = {
      eyeCareTemp: [eyeCareTemp, K.EYE_CARE_TEMP],
      colorTemp: [colorTemp, K.COLOR_TEMP],
      fontSize: [fontSize, K.FONT_SIZE],
      fontWeight: [fontWeight, K.FONT_WEIGHT]
    }
    if (!map[key]) return false
    const [refObj, storageKey] = map[key]
    const clamped = Math.min(1, Math.max(0, Number(value) || 0))
    refObj.value = clamped
    writeRaw(storageKey, String(clamped))
    return true
  }

  /** 二级页「定时切换主题」「自动息屏时间」等值展示用 */
  function themeScheduleLabel() {
    const hit = THEME_SCHEDULE_OPTIONS.find(o => o.value === themeSchedule.value)
    return hit ? hit.label : '已关闭'
  }

  return {
    themeSchedule,
    darkWallpaperDim,
    sleepAssist,
    eyeCare,
    eyeCareSchedule,
    eyeCareTemp,
    colorMode,
    colorTemp,
    refreshRate,
    autoSleep,
    fontFamily,
    fontSize,
    fontWeight,
    displaySize,
    gestureQuickSize,
    strongLightMode,
    setThemeSchedule,
    setColorMode,
    setRefreshRate,
    setAutoSleep,
    setDisplaySize,
    setFontFamily,
    setBool,
    setNumber,
    themeScheduleLabel
  }
})
