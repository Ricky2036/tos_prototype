import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { readBool, readString, writeRaw } from '../utils/localPrefs.js'

/**
 * 「辅助功能」模块状态（SET-ACC-01）
 *
 * 真机依据：`spec/captures/SET-ACC-01-accessibility.md`（Infinix X6878 / Android 17，
 * 2026-11-13 23:32–23:45 采集）。默认值逐条来自默认态截图，不做推算：
 *   防误触=开 · 录制系统声音=开 · 录制麦克风=关 · 清晰度=超清(1080P) · 帧率=低帧率(24FPS)
 *   显示点按效果=开 · 录屏勿扰=关 · 截屏四项全开 · 双指分屏=关 · 智感握姿=开
 *   智能侧边栏=开 · 最近文件=关 · 振动开关=关 · 场景建议/视频助手/社交助手=开 · 中转站=关闭
 *   户外增强=关（子项三项仍各自为开，但总开关关时整行置灰） · 定时开启=已关闭
 *   晕动舒缓=关 · 游戏模式=开 · 游戏助手面板=开
 */
const K = {
  ANTI_MISTOUCH: 'tos_acc_anti_mistouch',
  REC_SYSTEM_SOUND: 'tos_acc_rec_system_sound',
  REC_MIC_SOUND: 'tos_acc_rec_mic_sound',
  REC_RESOLUTION: 'tos_acc_rec_resolution',
  REC_FRAME_RATE: 'tos_acc_rec_frame_rate',
  REC_TAP_EFFECT: 'tos_acc_rec_tap_effect',
  REC_DND: 'tos_acc_rec_dnd',
  SHOT_FULL: 'tos_acc_shot_full',
  SHOT_REGION: 'tos_acc_shot_region',
  SHOT_DEL_AFTER_SHARE: 'tos_acc_shot_del_share',
  SHOT_DEL_AFTER_EDIT: 'tos_acc_shot_del_edit',
  SPLIT_DUAL_FINGER: 'tos_acc_split_dual_finger',
  SMART_GRIP: 'tos_acc_smart_grip',
  SIDEBAR_ENABLED: 'tos_acc_sidebar_enabled',
  SIDEBAR_RECENT: 'tos_acc_sidebar_recent',
  SIDEBAR_VIBRATE: 'tos_acc_sidebar_vibrate',
  SIDEBAR_RELAY: 'tos_acc_sidebar_relay',
  SCENE_SUGGEST: 'tos_acc_scene_suggest',
  VIDEO_ASSISTANT: 'tos_acc_video_assistant',
  SOCIAL_ASSISTANT: 'tos_acc_social_assistant',
  OUTDOOR_ENABLED: 'tos_acc_outdoor_enabled',
  OUTDOOR_SCHEDULE: 'tos_acc_outdoor_schedule',
  OUTDOOR_START: 'tos_acc_outdoor_start',
  OUTDOOR_END: 'tos_acc_outdoor_end',
  OUTDOOR_BRIGHTNESS: 'tos_acc_outdoor_brightness',
  OUTDOOR_HANDSFREE: 'tos_acc_outdoor_handsfree',
  OUTDOOR_EXTEND_SCREEN_OFF: 'tos_acc_outdoor_extend_screen_off',
  MOTION_ENABLED: 'tos_acc_motion_enabled',
  GAME_ENABLED: 'tos_acc_game_enabled',
  GAME_PANEL: 'tos_acc_game_panel'
}

export const ACCESSIBILITY_KEYS = K

/** 真机默认态（截图逐项核对，勿凭印象改） */
export const ACCESSIBILITY_DEFAULTS = {
  antiMistouch: true,
  screenRecord: {
    systemSound: true,
    micSound: false,
    resolution: '超清 (1080P)',
    frameRate: '低帧率 (24 FPS)',
    tapEffect: true,
    dnd: false
  },
  screenshot: { fullScreen: true, region: true, deleteAfterShare: true, deleteAfterEdit: true },
  split: { dualFinger: false },
  smartGrip: true,
  sidebar: {
    enabled: true,
    recentFiles: false,
    vibration: false,
    relay: '关闭',
    sceneSuggest: true,
    videoAssistant: true,
    socialAssistant: true
  },
  outdoor: {
    enabled: false,
    schedule: 'off', // 'off' | 'scheduled'（真机文案：已关闭 / 定时开启）
    start: '23:43',
    end: '07:43',
    brightness: true,
    handsFree: true,
    extendScreenOff: true
  },
  motion: false,
  game: { enabled: true, assistantPanel: true }
}

/**
 * 录屏清晰度/帧率候选
 *
 * 真机只采到**当前值**（超清 1080P / 低帧率 24FPS），点开后的选择器形态与完整档位未取证
 * （2026-11-14 设备离线，采集阻塞）。候选表先只放实测值，setter 会拒掉任何未取证档位，
 * 避免把猜出来的 720P/480P/30FPS/60FPS 当成真机能力。
 */
export const RECORDING_RESOLUTIONS = ['超清 (1080P)']
export const RECORDING_FRAME_RATES = ['低帧率 (24 FPS)']

export const useAccessibilitySettingsStore = defineStore('accessibilitySettings', () => {
  const antiMistouch = ref(readBool(K.ANTI_MISTOUCH, ACCESSIBILITY_DEFAULTS.antiMistouch))

  const recSystemSound = ref(readBool(K.REC_SYSTEM_SOUND, true))
  const recMicSound = ref(readBool(K.REC_MIC_SOUND, false))
  const recResolution = ref(readString(K.REC_RESOLUTION, ACCESSIBILITY_DEFAULTS.screenRecord.resolution))
  const recFrameRate = ref(readString(K.REC_FRAME_RATE, ACCESSIBILITY_DEFAULTS.screenRecord.frameRate))
  const recTapEffect = ref(readBool(K.REC_TAP_EFFECT, true))
  const recDnd = ref(readBool(K.REC_DND, false))

  const shotFull = ref(readBool(K.SHOT_FULL, true))
  const shotRegion = ref(readBool(K.SHOT_REGION, true))
  const shotDelAfterShare = ref(readBool(K.SHOT_DEL_AFTER_SHARE, true))
  const shotDelAfterEdit = ref(readBool(K.SHOT_DEL_AFTER_EDIT, true))

  const splitDualFinger = ref(readBool(K.SPLIT_DUAL_FINGER, false))
  const smartGrip = ref(readBool(K.SMART_GRIP, true))

  const sidebarEnabled = ref(readBool(K.SIDEBAR_ENABLED, true))
  const sidebarRecent = ref(readBool(K.SIDEBAR_RECENT, false))
  const sidebarVibrate = ref(readBool(K.SIDEBAR_VIBRATE, false))
  const sidebarRelay = ref(readString(K.SIDEBAR_RELAY, '关闭'))
  const sceneSuggest = ref(readBool(K.SCENE_SUGGEST, true))
  const videoAssistant = ref(readBool(K.VIDEO_ASSISTANT, true))
  const socialAssistant = ref(readBool(K.SOCIAL_ASSISTANT, true))

  const outdoorEnabled = ref(readBool(K.OUTDOOR_ENABLED, false))
  const outdoorSchedule = ref(readString(K.OUTDOOR_SCHEDULE, 'off'))
  const outdoorStart = ref(readString(K.OUTDOOR_START, ACCESSIBILITY_DEFAULTS.outdoor.start))
  const outdoorEnd = ref(readString(K.OUTDOOR_END, ACCESSIBILITY_DEFAULTS.outdoor.end))
  const outdoorBrightness = ref(readBool(K.OUTDOOR_BRIGHTNESS, true))
  const outdoorHandsFree = ref(readBool(K.OUTDOOR_HANDSFREE, true))
  const outdoorExtendScreenOff = ref(readBool(K.OUTDOOR_EXTEND_SCREEN_OFF, true))

  const motionEnabled = ref(readBool(K.MOTION_ENABLED, false))
  const gameEnabled = ref(readBool(K.GAME_ENABLED, true))
  const gamePanel = ref(readBool(K.GAME_PANEL, true))

  /** 通用布尔写入：视图层只传 key，避免每行写一个 setter 造成漂移 */
  const BOOL_REFS = {
    antiMistouch,
    recSystemSound,
    recMicSound,
    recTapEffect,
    recDnd,
    shotFull,
    shotRegion,
    shotDelAfterShare,
    shotDelAfterEdit,
    splitDualFinger,
    smartGrip,
    sidebarEnabled,
    sidebarRecent,
    sidebarVibrate,
    sceneSuggest,
    videoAssistant,
    socialAssistant,
    outdoorEnabled,
    outdoorBrightness,
    outdoorHandsFree,
    outdoorExtendScreenOff,
    motionEnabled,
    gameEnabled,
    gamePanel
  }

  const STORAGE_KEYS = {
    antiMistouch: K.ANTI_MISTOUCH,
    recSystemSound: K.REC_SYSTEM_SOUND,
    recMicSound: K.REC_MIC_SOUND,
    recTapEffect: K.REC_TAP_EFFECT,
    recDnd: K.REC_DND,
    shotFull: K.SHOT_FULL,
    shotRegion: K.SHOT_REGION,
    shotDelAfterShare: K.SHOT_DEL_AFTER_SHARE,
    shotDelAfterEdit: K.SHOT_DEL_AFTER_EDIT,
    splitDualFinger: K.SPLIT_DUAL_FINGER,
    smartGrip: K.SMART_GRIP,
    sidebarEnabled: K.SIDEBAR_ENABLED,
    sidebarRecent: K.SIDEBAR_RECENT,
    sidebarVibrate: K.SIDEBAR_VIBRATE,
    sceneSuggest: K.SCENE_SUGGEST,
    videoAssistant: K.VIDEO_ASSISTANT,
    socialAssistant: K.SOCIAL_ASSISTANT,
    outdoorEnabled: K.OUTDOOR_ENABLED,
    outdoorBrightness: K.OUTDOOR_BRIGHTNESS,
    outdoorHandsFree: K.OUTDOOR_HANDSFREE,
    outdoorExtendScreenOff: K.OUTDOOR_EXTEND_SCREEN_OFF,
    motionEnabled: K.MOTION_ENABLED,
    gameEnabled: K.GAME_ENABLED,
    gamePanel: K.GAME_PANEL
  }

  function setFlag(key, value) {
    const target = BOOL_REFS[key]
    if (!target) return false
    target.value = Boolean(value)
    writeRaw(STORAGE_KEYS[key], target.value ? 'true' : 'false')
    return true
  }

  function setRecResolution(value) {
    if (!RECORDING_RESOLUTIONS.includes(value)) return false
    recResolution.value = value
    writeRaw(K.REC_RESOLUTION, value)
    return true
  }

  function setRecFrameRate(value) {
    if (!RECORDING_FRAME_RATES.includes(value)) return false
    recFrameRate.value = value
    writeRaw(K.REC_FRAME_RATE, value)
    return true
  }

  function setSidebarRelay(value) {
    if (!['关闭', '开启'].includes(value)) return false
    sidebarRelay.value = value
    writeRaw(K.SIDEBAR_RELAY, value)
    return true
  }

  /** 定时开启：真机只有「已关闭 / 定时开启」两态；开启后才展开开始/结束时间 */
  function setOutdoorSchedule(value) {
    if (!['off', 'scheduled'].includes(value)) return false
    outdoorSchedule.value = value
    writeRaw(K.OUTDOOR_SCHEDULE, value)
    return true
  }

  function setOutdoorTime(which, hhmm) {
    if (!/^\d{2}:\d{2}$/.test(String(hhmm))) return false
    if (which === 'start') {
      outdoorStart.value = hhmm
      writeRaw(K.OUTDOOR_START, hhmm)
      return true
    }
    if (which === 'end') {
      outdoorEnd.value = hhmm
      writeRaw(K.OUTDOOR_END, hhmm)
      return true
    }
    return false
  }

  /** 真机：总开关关闭时「支持的功能」三项整行置灰、不可点，但各自状态保留 */
  const outdoorFeaturesEditable = computed(() => outdoorEnabled.value)
  const outdoorScheduleLabel = computed(() =>
    outdoorSchedule.value === 'scheduled' ? '已开启' : '已关闭'
  )

  const screenRecord = computed(() => ({
    systemSound: recSystemSound.value,
    micSound: recMicSound.value,
    resolution: recResolution.value,
    frameRate: recFrameRate.value,
    tapEffect: recTapEffect.value,
    dnd: recDnd.value
  }))
  const screenshot = computed(() => ({
    fullScreen: shotFull.value,
    region: shotRegion.value,
    deleteAfterShare: shotDelAfterShare.value,
    deleteAfterEdit: shotDelAfterEdit.value
  }))
  const sidebar = computed(() => ({
    enabled: sidebarEnabled.value,
    recentFiles: sidebarRecent.value,
    vibration: sidebarVibrate.value,
    relay: sidebarRelay.value,
    sceneSuggest: sceneSuggest.value,
    videoAssistant: videoAssistant.value,
    socialAssistant: socialAssistant.value
  }))
  const outdoor = computed(() => ({
    enabled: outdoorEnabled.value,
    schedule: outdoorSchedule.value,
    start: outdoorStart.value,
    end: outdoorEnd.value,
    brightness: outdoorBrightness.value,
    handsFree: outdoorHandsFree.value,
    extendScreenOff: outdoorExtendScreenOff.value
  }))

  return {
    antiMistouch,
    recSystemSound,
    recMicSound,
    recResolution,
    recFrameRate,
    recTapEffect,
    recDnd,
    shotFull,
    shotRegion,
    shotDelAfterShare,
    shotDelAfterEdit,
    splitDualFinger,
    smartGrip,
    sidebarEnabled,
    sidebarRecent,
    sidebarVibrate,
    sidebarRelay,
    sceneSuggest,
    videoAssistant,
    socialAssistant,
    outdoorEnabled,
    outdoorSchedule,
    outdoorStart,
    outdoorEnd,
    outdoorBrightness,
    outdoorHandsFree,
    outdoorExtendScreenOff,
    motionEnabled,
    gameEnabled,
    gamePanel,
    screenRecord,
    screenshot,
    sidebar,
    outdoor,
    outdoorFeaturesEditable,
    outdoorScheduleLabel,
    setFlag,
    setRecResolution,
    setRecFrameRate,
    setSidebarRelay,
    setOutdoorSchedule,
    setOutdoorTime
  }
})
