import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { readJson, writeRaw } from '../utils/localPrefs.js'

/**
 * 设置第三组卡片（安全与隐私 → 位置信息）三级/四级页的偏好。
 * 默认值逐条对齐 2026-11-09 真机截图（/tmp/ref/gI/）。
 * ⚠️ node 单测没有 localStorage，读写必须走 localPrefs 包装层。
 */

const SWITCH_KEY = 'tos.settings.group3.switches'
const CHOICE_KEY = 'tos.settings.group3.choices'

export const GROUP3_SWITCH_DEFAULTS = {
  /* 生物识别 / 密码 */
  fpUnlock: true,
  fpAppLock: true,
  fpPayment: false,
  faceUnlock: false,
  faceAutoScan: true,
  privacyPasswordEnabled: false,
  privacyPasswordFingerprint: true,
  powerOffPassword: false,
  unlockCapture: true,
  theftAlarm: false,
  theftDetection: true,
  offlineLock: true,
  bruteForceGuard: true,
  biometricAntiSpoof: true,
  appLockEnabled: false,
  lockWechat: true,
  lockGallery: false,
  lockMessage: false,

  /* 隐私功能 */
  xhideVerify: true,
  cloneFacebook: false,
  cloneInstagram: false,
  cloneTelegram: false,
  cloneWechat: false,
  cloneWhatsapp: false,
  cloneDouyin: false,
  cloneMessenger: false,
  antiPeek: false,
  aiAntiFraud: true,
  fraudCallDetect: true,
  fraudSmsDetect: true,
  fraudAppAlert: true,
  screenSharePrivacy: true,
  screenShareNotifMask: true,
  screenShareMute: false,
  lendMode: false,
  lendExitVerify: true,
  paymentRiskBlock: true,
  paymentPopupBlock: true,
  paymentSmsGuard: true,
  adControl: true,
  adPersonalized: false,
  secureKeyboard: true,
  cameraAccess: true,
  micAccess: true,
  clipboardNotice: true,
  lockScreenMedia: true,
  cameraExtensions: false,
  appContentAccess: true,

  /* 特殊应用权限 */
  specInstallChrome: false,
  specInstallFiles: false,
  specWifiControl: true,
  specModifyFolax: true,
  specAlarmClock: true,
  specAllFiles: false,
  specUsageHealth: true,
  specOverlayWechat: false,
  specDndClock: true,

  /* 应用管理 */
  cloudMediaAutoBackup: true,
  autoStartWechat: true,
  autoStartFolax: true,
  autoStartClock: true,

  /* 位置信息 */
  preciseLocation: true,
  googleLocationSharing: false,
  locationAccuracy: true,
  earthquakeAlerts: true,
  locationTimeline: false,
  disasterAlerts: true,
  emergencyLocation: true,
  wifiScanning: true,
  bluetoothScanning: false,
  remoteLockEnabled: true,
  appNotifEnabled: true,
  appOpenLinks: false,
  trustedPlaceUnlock: true
}

export const GROUP3_CHOICE_DEFAULTS = {
  lendScope: '当前应用',
  defaultAppChoice: '系统默认',
  contactsStorage: 'oppcjz@gmail.com',
  cloudMediaProvider: 'Google 相册',
  locationGrant: '仅在使用该应用时允许',
  premiumSmsGrant: '每次询问',
  appTimeLimit: '不限'
}

function persistSwitches(state) {
  writeRaw(SWITCH_KEY, JSON.stringify(state))
}

function persistChoices(state) {
  writeRaw(CHOICE_KEY, JSON.stringify(state))
}

export const useSettingsGroup3Store = defineStore('settingsGroup3', () => {
  const savedSwitches = readJson(SWITCH_KEY, {})
  const savedChoices = readJson(CHOICE_KEY, {})
  const switches = reactive({ ...GROUP3_SWITCH_DEFAULTS, ...savedSwitches })
  const choices = reactive({ ...GROUP3_CHOICE_DEFAULTS, ...savedChoices })

  function getSwitch(key) {
    return key in switches ? switches[key] : false
  }

  function setSwitch(key, value) {
    if (!(key in switches)) return
    switches[key] = Boolean(value)
    persistSwitches(switches)
  }

  function getChoice(key) {
    return key in choices ? choices[key] : ''
  }

  function setChoice(key, value) {
    if (!(key in choices)) return
    choices[key] = value
    persistChoices(choices)
  }

  function reset() {
    Object.assign(switches, GROUP3_SWITCH_DEFAULTS)
    Object.assign(choices, GROUP3_CHOICE_DEFAULTS)
    persistSwitches(switches)
    persistChoices(choices)
  }

  return { switches, choices, getSwitch, setSwitch, getChoice, setChoice, reset }
})
