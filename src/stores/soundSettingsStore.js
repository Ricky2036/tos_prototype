import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readBool, readNumber, readString, writeRaw } from '../utils/localPrefs.js'

/**
 * 「声音与振动」及其三级页的状态。
 *
 * 默认值逐条对齐真机 Infinix X6878（XOS 17）：
 * 铃声模式 · 勿扰关闭 · 触感反馈=开 · 输入法按键触感=开 · 来电铃声渐响=关
 * 振动强度 来电与闹钟≈最大 / 信息与通知≈60% · 来电时外放振动声音=关
 * JBL 模式=智能 · 均衡器=开 · 降噪=标准降噪 · 锁屏/触摸提示音=关，其余提示音=开
 */
const K = {
  SOUND_MODE: 'tos_sound_mode',
  MEDIA_VOL: 'tos_sound_media_vol',
  RING_VOL: 'tos_sound_ring_vol',
  NOTIF_VOL: 'tos_sound_notif_vol',
  ALARM_VOL: 'tos_sound_alarm_vol',
  TOUCH_FEEDBACK: 'tos_sound_touch_feedback',
  HAPTIC_STRENGTH: 'tos_sound_haptic_strength',
  KEYBOARD_HAPTIC: 'tos_sound_keyboard_haptic',
  RINGTONE_SIM1: 'tos_sound_ringtone_sim1',
  RINGTONE_SIM2: 'tos_sound_ringtone_sim2',
  NOTIF_RINGTONE: 'tos_sound_notif_ringtone',
  CRESCENDO: 'tos_sound_crescendo',
  VIB_CALL: 'tos_sound_vib_call',
  VIB_NOTIF: 'tos_sound_vib_notif',
  VIB_LOUD: 'tos_sound_vib_loud',
  JBL_MODE: 'tos_sound_jbl_mode',
  EQUALIZER: 'tos_sound_equalizer',
  NOISE_SYSTEM: 'tos_sound_noise_system',
  NOISE_NET: 'tos_sound_noise_net',
  PROMPT_DIAL: 'tos_sound_prompt_dial',
  PROMPT_SCREENSHOT: 'tos_sound_prompt_screenshot',
  PROMPT_DELETE: 'tos_sound_prompt_delete',
  PROMPT_LOCK: 'tos_sound_prompt_lock',
  PROMPT_CHARGE: 'tos_sound_prompt_charge',
  PROMPT_TOUCH: 'tos_sound_prompt_touch'
}

export const RINGTONE_CLASSIC = [
  'Desk phone', 'Drumming', 'Fast Pace', 'Fixed Telephone', 'Grace', 'Graceful Time', 'Landline'
]
export const RINGTONE_FUN = [
  'Baa Baa', 'Bicycle Bell', 'Blister', 'Bubble', 'Cat', 'Cave Drip', 'Cluck', 'Cricket'
]
export const JBL_MODES = [
  { value: 'smart', label: '智能' },
  { value: 'video', label: '视频' },
  { value: 'game', label: '游戏' },
  { value: 'music', label: '音乐' }
]

export const useSoundSettingsStore = defineStore('soundSettings', () => {
  const soundMode = ref(readString(K.SOUND_MODE, 'ring'))
  const mediaVolume = ref(readNumber(K.MEDIA_VOL, 0.55))
  const ringVolume = ref(readNumber(K.RING_VOL, 0.18))
  const notifVolume = ref(readNumber(K.NOTIF_VOL, 0.5))
  const alarmVolume = ref(readNumber(K.ALARM_VOL, 0.6))

  const touchFeedback = ref(readBool(K.TOUCH_FEEDBACK, true))
  const hapticStrength = ref(readNumber(K.HAPTIC_STRENGTH, 0.25))
  const keyboardHaptic = ref(readBool(K.KEYBOARD_HAPTIC, true))

  const ringtoneSim1 = ref(readString(K.RINGTONE_SIM1, 'Elegant'))
  const ringtoneSim2 = ref(readString(K.RINGTONE_SIM2, 'Elegant'))
  const notifRingtone = ref(readString(K.NOTIF_RINGTONE, 'Acclivity'))
  const ringtoneCrescendo = ref(readBool(K.CRESCENDO, false))

  const vibrateCall = ref(readNumber(K.VIB_CALL, 0.95))
  const vibrateNotif = ref(readNumber(K.VIB_NOTIF, 0.6))
  const vibrateLoudSpeaker = ref(readBool(K.VIB_LOUD, false))

  const jblMode = ref(readString(K.JBL_MODE, 'smart'))
  const equalizer = ref(readBool(K.EQUALIZER, true))
  const noiseSystem = ref(readString(K.NOISE_SYSTEM, '标准降噪'))
  const noiseNet = ref(readString(K.NOISE_NET, '标准降噪'))

  const promptDial = ref(readBool(K.PROMPT_DIAL, true))
  const promptScreenshot = ref(readBool(K.PROMPT_SCREENSHOT, true))
  const promptDelete = ref(readBool(K.PROMPT_DELETE, true))
  const promptLock = ref(readBool(K.PROMPT_LOCK, false))
  const promptCharge = ref(readBool(K.PROMPT_CHARGE, true))
  const promptTouch = ref(readBool(K.PROMPT_TOUCH, false))

  function setSoundMode(v) {
    if (!['ring', 'vibrate', 'silent'].includes(v)) return false
    soundMode.value = v
    writeRaw(K.SOUND_MODE, v)
    return true
  }

  function setJblMode(v) {
    if (!JBL_MODES.some(m => m.value === v)) return false
    jblMode.value = v
    writeRaw(K.JBL_MODE, v)
    return true
  }

  function setRingtone(which, name) {
    const map = {
      sim1: [ringtoneSim1, K.RINGTONE_SIM1],
      sim2: [ringtoneSim2, K.RINGTONE_SIM2],
      notif: [notifRingtone, K.NOTIF_RINGTONE]
    }
    if (!map[which]) return false
    const [refObj, storageKey] = map[which]
    refObj.value = name
    writeRaw(storageKey, name)
    return true
  }

  function setBool(key, value) {
    const map = {
      touchFeedback: [touchFeedback, K.TOUCH_FEEDBACK],
      keyboardHaptic: [keyboardHaptic, K.KEYBOARD_HAPTIC],
      ringtoneCrescendo: [ringtoneCrescendo, K.CRESCENDO],
      vibrateLoudSpeaker: [vibrateLoudSpeaker, K.VIB_LOUD],
      equalizer: [equalizer, K.EQUALIZER],
      promptDial: [promptDial, K.PROMPT_DIAL],
      promptScreenshot: [promptScreenshot, K.PROMPT_SCREENSHOT],
      promptDelete: [promptDelete, K.PROMPT_DELETE],
      promptLock: [promptLock, K.PROMPT_LOCK],
      promptCharge: [promptCharge, K.PROMPT_CHARGE],
      promptTouch: [promptTouch, K.PROMPT_TOUCH]
    }
    if (!map[key]) return false
    const [refObj, storageKey] = map[key]
    refObj.value = Boolean(value)
    writeRaw(storageKey, String(Boolean(value)))
    return true
  }

  function setNumber(key, value) {
    const map = {
      hapticStrength: [hapticStrength, K.HAPTIC_STRENGTH],
      vibrateCall: [vibrateCall, K.VIB_CALL],
      vibrateNotif: [vibrateNotif, K.VIB_NOTIF],
      mediaVolume: [mediaVolume, K.MEDIA_VOL],
      ringVolume: [ringVolume, K.RING_VOL],
      notifVolume: [notifVolume, K.NOTIF_VOL],
      alarmVolume: [alarmVolume, K.ALARM_VOL]
    }
    if (!map[key]) return false
    const [refObj, storageKey] = map[key]
    const clamped = Math.min(1, Math.max(0, Number(value) || 0))
    refObj.value = clamped
    writeRaw(storageKey, String(clamped))
    return true
  }

  function setNoiseMode(which, value) {
    const map = { system: [noiseSystem, K.NOISE_SYSTEM], net: [noiseNet, K.NOISE_NET] }
    if (!map[which]) return false
    const [refObj, storageKey] = map[which]
    refObj.value = value
    writeRaw(storageKey, value)
    return true
  }

  return {
    soundMode,
    mediaVolume,
    ringVolume,
    notifVolume,
    alarmVolume,
    touchFeedback,
    hapticStrength,
    keyboardHaptic,
    ringtoneSim1,
    ringtoneSim2,
    notifRingtone,
    ringtoneCrescendo,
    vibrateCall,
    vibrateNotif,
    vibrateLoudSpeaker,
    jblMode,
    equalizer,
    noiseSystem,
    noiseNet,
    promptDial,
    promptScreenshot,
    promptDelete,
    promptLock,
    promptCharge,
    promptTouch,
    setSoundMode,
    setJblMode,
    setRingtone,
    setBool,
    setNumber,
    setNoiseMode
  }
})
