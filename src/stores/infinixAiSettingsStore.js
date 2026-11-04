import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Infinix AI 设置页（二级「Infinix AI」→ 三级各功能页）的开关状态。
 *
 * 取值全部对齐真机 Infinix X6878（XOS 17）默认态：
 * - Fola 语音：手势唤醒 / 导航条唤醒 / 语音实时转写 / 通知推送 / 个性化推荐 / 语音指令校验 = 开
 * - Fola 识屏：手势触发 / 识屏建议 = 开
 * - AI 录音：自动推荐 = 开，自动录音 = 关
 * - 翻译助手：智慧翻译 = 关，首次进入需同意隐私协议
 */
const STORAGE_KEYS = {
  FOLAX_GESTURE_WAKE: 'tos_ai_folax_gesture_wake',
  FOLAX_NAVBAR_WAKE: 'tos_ai_folax_navbar_wake',
  FOLAX_REALTIME_TRANSCRIBE: 'tos_ai_folax_realtime_transcribe',
  FOLAX_NOTIF_PUSH: 'tos_ai_folax_notif_push',
  FOLAX_PERSONALIZED_REC: 'tos_ai_folax_personalized_rec',
  FOLAX_VOICE_CMD_CHECK: 'tos_ai_folax_voice_cmd_check',
  FOLA_SCREEN_GESTURE: 'tos_ai_fola_screen_gesture',
  FOLA_SCREEN_SUGGEST: 'tos_ai_fola_screen_suggest',
  AI_RECORD_AUTO_RECOMMEND: 'tos_ai_record_auto_recommend',
  AI_RECORD_AUTO_RECORD: 'tos_ai_record_auto_record',
  TRANSLATE_SMART: 'tos_ai_translate_smart',
  TRANSLATE_CONSENT: 'tos_ai_translate_consent'
}

/** 单元测试跑在 node 下（无 localStorage），这里做一层安全包装 */
function readRaw(key) {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(key)
}

function writeRaw(key, value) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, value)
}

function readBool(key, fallback) {
  const raw = readRaw(key)
  return raw === null ? fallback : raw === 'true'
}

export const useInfinixAiSettingsStore = defineStore('infinixAiSettings', () => {
  const folaxGestureWake = ref(readBool(STORAGE_KEYS.FOLAX_GESTURE_WAKE, true))
  const folaxNavBarWake = ref(readBool(STORAGE_KEYS.FOLAX_NAVBAR_WAKE, true))
  const folaxRealtimeTranscribe = ref(readBool(STORAGE_KEYS.FOLAX_REALTIME_TRANSCRIBE, true))
  const folaxNotifPush = ref(readBool(STORAGE_KEYS.FOLAX_NOTIF_PUSH, true))
  const folaxPersonalizedRec = ref(readBool(STORAGE_KEYS.FOLAX_PERSONALIZED_REC, true))
  const folaxVoiceCmdCheck = ref(readBool(STORAGE_KEYS.FOLAX_VOICE_CMD_CHECK, true))

  const folaScreenGesture = ref(readBool(STORAGE_KEYS.FOLA_SCREEN_GESTURE, true))
  const folaScreenSuggest = ref(readBool(STORAGE_KEYS.FOLA_SCREEN_SUGGEST, true))

  const aiRecordAutoRecommend = ref(readBool(STORAGE_KEYS.AI_RECORD_AUTO_RECOMMEND, true))
  const aiRecordAutoRecord = ref(readBool(STORAGE_KEYS.AI_RECORD_AUTO_RECORD, false))

  const translateSmart = ref(readBool(STORAGE_KEYS.TRANSLATE_SMART, false))
  const translateConsentAccepted = ref(readBool(STORAGE_KEYS.TRANSLATE_CONSENT, false))

  /** 键名 -> 存储键，供通用子页外壳按名字写开关 */
  const keyMap = {
    folaxGestureWake: STORAGE_KEYS.FOLAX_GESTURE_WAKE,
    folaxNavBarWake: STORAGE_KEYS.FOLAX_NAVBAR_WAKE,
    folaxRealtimeTranscribe: STORAGE_KEYS.FOLAX_REALTIME_TRANSCRIBE,
    folaxNotifPush: STORAGE_KEYS.FOLAX_NOTIF_PUSH,
    folaxPersonalizedRec: STORAGE_KEYS.FOLAX_PERSONALIZED_REC,
    folaxVoiceCmdCheck: STORAGE_KEYS.FOLAX_VOICE_CMD_CHECK,
    folaScreenGesture: STORAGE_KEYS.FOLA_SCREEN_GESTURE,
    folaScreenSuggest: STORAGE_KEYS.FOLA_SCREEN_SUGGEST,
    aiRecordAutoRecommend: STORAGE_KEYS.AI_RECORD_AUTO_RECOMMEND,
    aiRecordAutoRecord: STORAGE_KEYS.AI_RECORD_AUTO_RECORD,
    translateSmart: STORAGE_KEYS.TRANSLATE_SMART
  }

  function setSwitch(key, value) {
    if (!(key in keyMap)) return false
    const next = Boolean(value)
    const storeKey = keyMap[key]
    // 通过 ref 名称写入（defineStore setup 语法下 this[key] 不可直接用，用显式映射）
    const refs = {
      folaxGestureWake,
      folaxNavBarWake,
      folaxRealtimeTranscribe,
      folaxNotifPush,
      folaxPersonalizedRec,
      folaxVoiceCmdCheck,
      folaScreenGesture,
      folaScreenSuggest,
      aiRecordAutoRecommend,
      aiRecordAutoRecord,
      translateSmart
    }
    refs[key].value = next
    writeRaw(storeKey, String(next))
    return true
  }

  function getSwitch(key) {
    const refs = {
      folaxGestureWake,
      folaxNavBarWake,
      folaxRealtimeTranscribe,
      folaxNotifPush,
      folaxPersonalizedRec,
      folaxVoiceCmdCheck,
      folaScreenGesture,
      folaScreenSuggest,
      aiRecordAutoRecommend,
      aiRecordAutoRecord,
      translateSmart
    }
    return refs[key] ? Boolean(refs[key].value) : false
  }

  function acceptTranslateConsent() {
    translateConsentAccepted.value = true
    writeRaw(STORAGE_KEYS.TRANSLATE_CONSENT, 'true')
  }

  return {
    folaxGestureWake,
    folaxNavBarWake,
    folaxRealtimeTranscribe,
    folaxNotifPush,
    folaxPersonalizedRec,
    folaxVoiceCmdCheck,
    folaScreenGesture,
    folaScreenSuggest,
    aiRecordAutoRecommend,
    aiRecordAutoRecord,
    translateSmart,
    translateConsentAccepted,
    setSwitch,
    getSwitch,
    acceptTranslateConsent
  }
})
