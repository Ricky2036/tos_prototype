import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readBool, readString, writeRaw } from '../utils/localPrefs.js'

export const SYSTEM_SETTINGS_KEYS = {
  GESTURE_SENSITIVITY: 'tos_system_gesture_sensitivity',
  BOTTOM_BAR_HIDDEN: 'tos_system_bottom_bar_hidden',
  BACK_VIBRATION: 'tos_system_back_vibration',
  LONG_PRESS_POWER: 'tos_system_long_press_power',
  SCHEDULED_POWER_ON: 'tos_system_scheduled_power_on',
  POWER_ON_TIME: 'tos_system_power_on_time',
  POWER_ON_REPEAT: 'tos_system_power_on_repeat',
  SCHEDULED_POWER_OFF: 'tos_system_scheduled_power_off',
  POWER_OFF_TIME: 'tos_system_power_off_time',
  POWER_OFF_REPEAT: 'tos_system_power_off_repeat',
  SCHEDULED_RESTART: 'tos_system_scheduled_restart',
  RESTART_TIME: 'tos_system_restart_time',
  RESTART_REPEAT: 'tos_system_restart_repeat',
  GOOGLE_BACKUP_ENABLED: 'tos_system_google_backup_enabled',
  GOOGLE_BACKUP_ACCOUNT: 'tos_system_google_backup_account',
  DEVELOPER_OPTIONS_ENABLED: 'tos_system_developer_options_enabled',
  USB_DEBUGGING: 'tos_system_usb_debugging',
  KEEP_AWAKE: 'tos_system_keep_awake',
  POINTER_LOCATION: 'tos_system_pointer_location',
  SHOW_TAPS: 'tos_system_show_taps',
  WINDOW_ANIM_SCALE: 'tos_system_window_anim_scale',
  TRANSITION_ANIM_SCALE: 'tos_system_transition_anim_scale',
  ANIMATOR_DURATION_SCALE: 'tos_system_animator_duration_scale',
  USER_EXPERIENCE_PROGRAM: 'tos_system_user_experience_program',
  SYSTEM_ERROR_REPORTING: 'tos_system_system_error_reporting',
  SMART_SERVICE_PUSH: 'tos_system_smart_service_push',
}

export const SYSTEM_SETTINGS_DEFAULTS = {
  gestureSensitivity: 'standard', // 'standard' | 'high' | 'low'
  bottomBarHidden: false,
  backVibration: true,
  longPressPower: 'assistant', // 'assistant' (访问数字助理) | 'powerMenu' (电源菜单)
  scheduledPowerOn: false,
  powerOnTime: '07:00',
  powerOnRepeat: '每天',
  scheduledPowerOff: false,
  powerOffTime: '23:00',
  powerOffRepeat: '每天',
  scheduledRestart: false,
  restartTime: '05:00',
  restartRepeat: '星期三',
  googleBackupEnabled: true,
  googleBackupAccount: 'google.user@example.com',
  developerOptionsEnabled: true,
  usbDebugging: true,
  keepAwake: false,
  pointerLocation: false,
  showTaps: false,
  windowAnimationScale: '1.0x',
  transitionAnimationScale: '1.0x',
  animatorDurationScale: '1.0x',
  userExperienceProgram: true,
  systemErrorReporting: true,
  smartServicePush: false,
}

export const useSystemSettingsStore = defineStore('systemSettings', () => {
  const gestureSensitivity = ref(readString(SYSTEM_SETTINGS_KEYS.GESTURE_SENSITIVITY, SYSTEM_SETTINGS_DEFAULTS.gestureSensitivity))
  const bottomBarHidden = ref(readBool(SYSTEM_SETTINGS_KEYS.BOTTOM_BAR_HIDDEN, SYSTEM_SETTINGS_DEFAULTS.bottomBarHidden))
  const backVibration = ref(readBool(SYSTEM_SETTINGS_KEYS.BACK_VIBRATION, SYSTEM_SETTINGS_DEFAULTS.backVibration))
  const longPressPower = ref(readString(SYSTEM_SETTINGS_KEYS.LONG_PRESS_POWER, SYSTEM_SETTINGS_DEFAULTS.longPressPower))
  const scheduledPowerOn = ref(readBool(SYSTEM_SETTINGS_KEYS.SCHEDULED_POWER_ON, SYSTEM_SETTINGS_DEFAULTS.scheduledPowerOn))
  const powerOnTime = ref(readString(SYSTEM_SETTINGS_KEYS.POWER_ON_TIME, SYSTEM_SETTINGS_DEFAULTS.powerOnTime))
  const powerOnRepeat = ref(readString(SYSTEM_SETTINGS_KEYS.POWER_ON_REPEAT, SYSTEM_SETTINGS_DEFAULTS.powerOnRepeat))
  const scheduledPowerOff = ref(readBool(SYSTEM_SETTINGS_KEYS.SCHEDULED_POWER_OFF, SYSTEM_SETTINGS_DEFAULTS.scheduledPowerOff))
  const powerOffTime = ref(readString(SYSTEM_SETTINGS_KEYS.POWER_OFF_TIME, SYSTEM_SETTINGS_DEFAULTS.powerOffTime))
  const powerOffRepeat = ref(readString(SYSTEM_SETTINGS_KEYS.POWER_OFF_REPEAT, SYSTEM_SETTINGS_DEFAULTS.powerOffRepeat))
  const scheduledRestart = ref(readBool(SYSTEM_SETTINGS_KEYS.SCHEDULED_RESTART, SYSTEM_SETTINGS_DEFAULTS.scheduledRestart))
  const restartTime = ref(readString(SYSTEM_SETTINGS_KEYS.RESTART_TIME, SYSTEM_SETTINGS_DEFAULTS.restartTime))
  const restartRepeat = ref(readString(SYSTEM_SETTINGS_KEYS.RESTART_REPEAT, SYSTEM_SETTINGS_DEFAULTS.restartRepeat))
  const googleBackupEnabled = ref(readBool(SYSTEM_SETTINGS_KEYS.GOOGLE_BACKUP_ENABLED, SYSTEM_SETTINGS_DEFAULTS.googleBackupEnabled))
  const googleBackupAccount = ref(readString(SYSTEM_SETTINGS_KEYS.GOOGLE_BACKUP_ACCOUNT, SYSTEM_SETTINGS_DEFAULTS.googleBackupAccount))
  const developerOptionsEnabled = ref(readBool(SYSTEM_SETTINGS_KEYS.DEVELOPER_OPTIONS_ENABLED, SYSTEM_SETTINGS_DEFAULTS.developerOptionsEnabled))
  const usbDebugging = ref(readBool(SYSTEM_SETTINGS_KEYS.USB_DEBUGGING, SYSTEM_SETTINGS_DEFAULTS.usbDebugging))
  const keepAwake = ref(readBool(SYSTEM_SETTINGS_KEYS.KEEP_AWAKE, SYSTEM_SETTINGS_DEFAULTS.keepAwake))
  const pointerLocation = ref(readBool(SYSTEM_SETTINGS_KEYS.POINTER_LOCATION, SYSTEM_SETTINGS_DEFAULTS.pointerLocation))
  const showTaps = ref(readBool(SYSTEM_SETTINGS_KEYS.SHOW_TAPS, SYSTEM_SETTINGS_DEFAULTS.showTaps))
  const windowAnimationScale = ref(readString(SYSTEM_SETTINGS_KEYS.WINDOW_ANIM_SCALE, SYSTEM_SETTINGS_DEFAULTS.windowAnimationScale))
  const transitionAnimationScale = ref(readString(SYSTEM_SETTINGS_KEYS.TRANSITION_ANIM_SCALE, SYSTEM_SETTINGS_DEFAULTS.transitionAnimationScale))
  const animatorDurationScale = ref(readString(SYSTEM_SETTINGS_KEYS.ANIMATOR_DURATION_SCALE, SYSTEM_SETTINGS_DEFAULTS.animatorDurationScale))
  const userExperienceProgram = ref(readBool(SYSTEM_SETTINGS_KEYS.USER_EXPERIENCE_PROGRAM, SYSTEM_SETTINGS_DEFAULTS.userExperienceProgram))
  const systemErrorReporting = ref(readBool(SYSTEM_SETTINGS_KEYS.SYSTEM_ERROR_REPORTING, SYSTEM_SETTINGS_DEFAULTS.systemErrorReporting))
  const smartServicePush = ref(readBool(SYSTEM_SETTINGS_KEYS.SMART_SERVICE_PUSH, SYSTEM_SETTINGS_DEFAULTS.smartServicePush))

  function setGestureSensitivity(v) {
    gestureSensitivity.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.GESTURE_SENSITIVITY, gestureSensitivity.value)
  }
  function setBottomBarHidden(v) {
    bottomBarHidden.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.BOTTOM_BAR_HIDDEN, String(bottomBarHidden.value))
  }
  function setBackVibration(v) {
    backVibration.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.BACK_VIBRATION, String(backVibration.value))
  }
  function setLongPressPower(v) {
    longPressPower.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.LONG_PRESS_POWER, longPressPower.value)
  }
  function setScheduledPowerOn(v) {
    scheduledPowerOn.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.SCHEDULED_POWER_ON, String(scheduledPowerOn.value))
  }
  function setPowerOnTime(v) {
    powerOnTime.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.POWER_ON_TIME, powerOnTime.value)
  }
  function setPowerOnRepeat(v) {
    powerOnRepeat.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.POWER_ON_REPEAT, powerOnRepeat.value)
  }
  function setScheduledPowerOff(v) {
    scheduledPowerOff.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.SCHEDULED_POWER_OFF, String(scheduledPowerOff.value))
  }
  function setPowerOffTime(v) {
    powerOffTime.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.POWER_OFF_TIME, powerOffTime.value)
  }
  function setPowerOffRepeat(v) {
    powerOffRepeat.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.POWER_OFF_REPEAT, powerOffRepeat.value)
  }
  function setScheduledRestart(v) {
    scheduledRestart.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.SCHEDULED_RESTART, String(scheduledRestart.value))
  }
  function setRestartTime(v) {
    restartTime.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.RESTART_TIME, restartTime.value)
  }
  function setRestartRepeat(v) {
    restartRepeat.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.RESTART_REPEAT, restartRepeat.value)
  }
  function setGoogleBackupEnabled(v) {
    googleBackupEnabled.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.GOOGLE_BACKUP_ENABLED, String(googleBackupEnabled.value))
  }
  function setDeveloperOptionsEnabled(v) {
    developerOptionsEnabled.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.DEVELOPER_OPTIONS_ENABLED, String(developerOptionsEnabled.value))
  }
  function setUsbDebugging(v) {
    usbDebugging.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.USB_DEBUGGING, String(usbDebugging.value))
  }
  function setKeepAwake(v) {
    keepAwake.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.KEEP_AWAKE, String(keepAwake.value))
  }
  function setPointerLocation(v) {
    pointerLocation.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.POINTER_LOCATION, String(pointerLocation.value))
  }
  function setShowTaps(v) {
    showTaps.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.SHOW_TAPS, String(showTaps.value))
  }
  function setWindowAnimationScale(v) {
    windowAnimationScale.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.WINDOW_ANIM_SCALE, windowAnimationScale.value)
  }
  function setTransitionAnimationScale(v) {
    transitionAnimationScale.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.TRANSITION_ANIM_SCALE, transitionAnimationScale.value)
  }
  function setAnimatorDurationScale(v) {
    animatorDurationScale.value = String(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.ANIMATOR_DURATION_SCALE, animatorDurationScale.value)
  }
  function setUserExperienceProgram(v) {
    userExperienceProgram.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.USER_EXPERIENCE_PROGRAM, String(userExperienceProgram.value))
  }
  function setSystemErrorReporting(v) {
    systemErrorReporting.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.SYSTEM_ERROR_REPORTING, String(systemErrorReporting.value))
  }
  function setSmartServicePush(v) {
    smartServicePush.value = Boolean(v)
    writeRaw(SYSTEM_SETTINGS_KEYS.SMART_SERVICE_PUSH, String(smartServicePush.value))
  }

  return {
    gestureSensitivity, bottomBarHidden, backVibration,
    longPressPower,
    scheduledPowerOn, powerOnTime, powerOnRepeat,
    scheduledPowerOff, powerOffTime, powerOffRepeat,
    scheduledRestart, restartTime, restartRepeat,
    googleBackupEnabled, googleBackupAccount,
    developerOptionsEnabled, usbDebugging, keepAwake, pointerLocation, showTaps,
    windowAnimationScale, transitionAnimationScale, animatorDurationScale,
    userExperienceProgram, systemErrorReporting, smartServicePush,
    setGestureSensitivity, setBottomBarHidden, setBackVibration,
    setLongPressPower,
    setScheduledPowerOn, setPowerOnTime, setPowerOnRepeat,
    setScheduledPowerOff, setPowerOffTime, setPowerOffRepeat,
    setScheduledRestart, setRestartTime, setRestartRepeat,
    setGoogleBackupEnabled,
    setDeveloperOptionsEnabled, setUsbDebugging, setKeepAwake, setPointerLocation, setShowTaps,
    setWindowAnimationScale, setTransitionAnimationScale, setAnimatorDurationScale,
    setUserExperienceProgram, setSystemErrorReporting, setSmartServicePush,
  }
})
