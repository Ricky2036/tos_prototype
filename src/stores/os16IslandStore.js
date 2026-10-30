import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const OS16_TEMPLATES = {
  // 1. 进度模板 (Progress Templates)
  FOOD_DELIVERY: 'food_delivery',
  RIDE_HAILING: 'ride_hailing',
  NAVIGATION: 'navigation',

  // 2. 自适应模版 (Adaptive Templates)
  TRANSLATION: 'translation',
  SYSTEM_TIP: 'system_tip',
  MEDIA_EXTENDED: 'media_extended',

  // 3. 基础模板 (Base Templates)
  SCREEN_RECORDING: 'screen_recording',
  BATTERY_CHARGING: 'battery_charging',
  PHONE_CALL: 'phone_call',
  HOTSPOT: 'hotspot',
  FLASHLIGHT: 'flashlight',
  MICROPHONE: 'microphone',
  VOICE_RECORDING: 'voice_recording',
  TIMER: 'timer'
}

export const useOs16IslandStore = defineStore('os16Island', () => {
  // 当前激活的所有模版列表（支持多岛共存，最多 4 个）
  const activeTemplates = ref([])

  // 兼容旧接口：当前首选激活的模版 ID
  const activeTemplate = computed({
    get: () => activeTemplates.value[0] || null,
    set: (val) => {
      if (!val) {
        activeTemplates.value = []
      } else if (!activeTemplates.value.includes(val)) {
        activeTemplates.value = [val, ...activeTemplates.value.slice(0, 3)]
      }
    }
  })

  // 灵动岛是否处于展开大卡片态
  const isExpanded = ref(false)

  // 进度模版专属动态数据
  const foodDeliveryStages = [
    { progress: 28, title: 'Arrives 8:30-8:45 AM', subtitle: 'Rider heading to restaurant' },
    { progress: 65, title: 'Arrives in 12 min', subtitle: 'Food picked up, heading to you' },
    { progress: 95, title: 'Arriving in 1 min', subtitle: 'Rider nearby, please be ready' }
  ]
  const currentFoodStageIdx = ref(0)
  const foodDeliveryState = ref({
    title: 'Arrives 8:30-8:45 AM',
    subtitle: 'Rider heading to restaurant',
    progress: 28,
    brand: '美团'
  })

  function advanceFoodDelivery() {
    currentFoodStageIdx.value = (currentFoodStageIdx.value + 1) % foodDeliveryStages.length
    const st = foodDeliveryStages[currentFoodStageIdx.value]
    foodDeliveryState.value.progress = st.progress
    foodDeliveryState.value.title = st.title
    foodDeliveryState.value.subtitle = st.subtitle
  }

  const rideHailingStages = [
    { progress: 30, title: 'On the way · 35 min', subtitle: '20 km to destination' },
    { progress: 68, title: 'On the way · 10 min', subtitle: '5.2 km to destination' },
    { progress: 96, title: 'Driver arriving · 1 min', subtitle: 'Zeekr 001 · 粤B·88888' }
  ]
  const currentRideStageIdx = ref(0)
  const rideHailingState = ref({
    title: 'On the way · 35 min',
    subtitle: '20 km to destination',
    progress: 30,
    brand: '滴滴',
    carModel: '极氪 001 · 粤B·88888'
  })

  function advanceRideHailing() {
    currentRideStageIdx.value = (currentRideStageIdx.value + 1) % rideHailingStages.length
    const st = rideHailingStages[currentRideStageIdx.value]
    rideHailingState.value.progress = st.progress
    rideHailingState.value.title = st.title
    rideHailingState.value.subtitle = st.subtitle
  }

  const navManeuvers = [
    { title: 'Drive 10 min 6km', subtitle: 'Arrive 10:08 AM', turn: 'Turn right in 200m', progress: 20 },
    { title: 'Drive 8 min 4.8km', subtitle: 'Arrive 10:08 AM', turn: 'Continue on Shennan Ave 3km', progress: 50 },
    { title: 'Drive 2 min 800m', subtitle: 'Arrive 10:06 AM', turn: 'Destination ahead on right', progress: 85 }
  ]
  const currentNavIdx = ref(0)
  const navigationState = ref({
    direction: 'straight',
    title: 'Drive 10 min 6km',
    subtitle: 'Arrive 10:08 AM',
    turnText: 'Turn right in 200m',
    progress: 20,
    speed: '65 km/h',
    segments: [
      { color: '#0060EA', flex: 127 },
      { color: '#B91702', flex: 22 },
      { color: '#FC4C3F', flex: 18 },
      { color: '#01AD4B', flex: 80 },
      { color: '#FC843F', flex: 37 }
    ]
  })

  function advanceNavigation() {
    currentNavIdx.value = (currentNavIdx.value + 1) % navManeuvers.length
    const m = navManeuvers[currentNavIdx.value]
    navigationState.value.title = m.title
    navigationState.value.subtitle = m.subtitle
    navigationState.value.turnText = m.turn
    if (m.progress !== undefined) {
      navigationState.value.progress = m.progress
    }
  }

  // 自适应模版专属动态数据
  const translationState = ref({
    sourceLang: 'English',
    sourceText: "I don't wanna tiptoe, but I don't wanna hi...",
    targetLang: 'Chinese',
    targetText: '我不想蹑手蹑脚，也不想躲躲藏藏。更不想给这滔天大火火上浇油，只想让这个故事消亡。让一切好起来。我们没办法成为朋友，但我希望我能够是...',
    isListening: true,
    isSpeaking: false
  })

  const systemTipState = ref({
    title: 'three finger screenshot',
    description: 'You can open the app through the smart panel and handle multiple tasks at the same time. You can open',
    actionText: 'Details',
    isLearned: false
  })

  function toggleTipLearned() {
    systemTipState.value.isLearned = !systemTipState.value.isLearned
    systemTipState.value.actionText = systemTipState.value.isLearned ? 'Enabled' : 'Details'
  }

  const musicPlaylist = [
    { title: 'Eternal Sunshine', artist: 'Ariana Grande', totalTime: '01:59', totalSec: 119 },
    { title: 'yes, and?', artist: 'Ariana Grande', totalTime: '03:34', totalSec: 214 },
    { title: "we can't be friends", artist: 'Ariana Grande', totalTime: '03:48', totalSec: 228 }
  ]
  const currentTrackIdx = ref(0)
  const mediaExtendedState = ref({
    title: 'Eternal Sunshine',
    artist: 'Ariana Grande',
    currentTime: '00:43',
    totalTime: '01:59',
    progress: 36,
    isPlaying: true
  })

  function nextMediaTrack() {
    currentTrackIdx.value = (currentTrackIdx.value + 1) % musicPlaylist.length
    const t = musicPlaylist[currentTrackIdx.value]
    mediaExtendedState.value.title = t.title
    mediaExtendedState.value.artist = t.artist
    mediaExtendedState.value.totalTime = t.totalTime
    mediaExtendedState.value.currentTime = '00:00'
    mediaExtendedState.value.progress = 0
    mediaExtendedState.value.isPlaying = true
  }

  function prevMediaTrack() {
    if (mediaExtendedState.value.progress > 10) {
      mediaExtendedState.value.progress = 0
      mediaExtendedState.value.currentTime = '00:00'
      return
    }
    currentTrackIdx.value = (currentTrackIdx.value - 1 + musicPlaylist.length) % musicPlaylist.length
    const t = musicPlaylist[currentTrackIdx.value]
    mediaExtendedState.value.title = t.title
    mediaExtendedState.value.artist = t.artist
    mediaExtendedState.value.totalTime = t.totalTime
    mediaExtendedState.value.currentTime = '00:00'
    mediaExtendedState.value.progress = 0
    mediaExtendedState.value.isPlaying = true
  }

  function seekMedia(progressPct) {
    const clamped = Math.max(0, Math.min(100, progressPct))
    mediaExtendedState.value.progress = clamped
    const curTrack = musicPlaylist[currentTrackIdx.value]
    const curSec = Math.floor((clamped / 100) * curTrack.totalSec)
    const m = String(Math.floor(curSec / 60)).padStart(2, '0')
    const s = String(curSec % 60).padStart(2, '0')
    mediaExtendedState.value.currentTime = `${m}:${s}`
  }

  // 基础模版专属数据
  const baseTemplateState = ref({
    screenRecordingTime: '04:20',
    isRecordingPaused: false,
    batteryPercent: 87,
    batteryWatt: 25,
    chargingMode: 'super', // 'super' (68W) 或 'turbo' (120W)
    callerName: 'Gdragon',
    callerNumber: '130 3987 9876',
    callDuration: '01:28',
    isCallMuted: false,
    isCallSpeaker: false,
    hotspotRemain: 'Off in 3 min',
    isHotspotActive: true,
    isFlashlightOn: false,
    micStatus: 'Receiving sound',
    isMicMuted: false
  })

  function toggleHotspot() {
    baseTemplateState.value.isHotspotActive = !baseTemplateState.value.isHotspotActive
  }

  function toggleChargingMode() {
    if (baseTemplateState.value.chargingMode === 'super') {
      baseTemplateState.value.chargingMode = 'turbo'
      baseTemplateState.value.batteryWatt = 120
    } else {
      baseTemplateState.value.chargingMode = 'super'
      baseTemplateState.value.batteryWatt = 68
    }
  }

  function toggleCallMute() {
    baseTemplateState.value.isCallMuted = !baseTemplateState.value.isCallMuted
  }

  function toggleCallSpeaker() {
    baseTemplateState.value.isCallSpeaker = !baseTemplateState.value.isCallSpeaker
  }

  function toggleMicMute() {
    baseTemplateState.value.isMicMuted = !baseTemplateState.value.isMicMuted
  }

  // 判断是否有 OS16 模版正在展示
  const hasActiveTemplate = computed(() => activeTemplates.value.length > 0)

  // 判断指定模版是否处于激活状态
  function isTemplateActive(templateId) {
    return activeTemplates.value.includes(templateId)
  }

  // 切换或激活模版（支持最多 4 个灵动岛共存）
  function activateTemplate(templateId, autoExpand = true) {
    const idx = activeTemplates.value.indexOf(templateId)
    if (idx !== -1) {
      if (!isExpanded.value) {
        isExpanded.value = true
      } else {
        closeTemplate(templateId)
      }
      return
    }
    // 新增模版置于首位（成为当前主活动），最多保留 4 项
    activeTemplates.value = [templateId, ...activeTemplates.value.filter((id) => id !== templateId).slice(0, 3)]
    if (autoExpand) {
      isExpanded.value = true
    }
  }

  // 关闭指定模版或清空全部模版
  function closeTemplate(templateId = null) {
    if (templateId) {
      activeTemplates.value = activeTemplates.value.filter((id) => id !== templateId)
    } else {
      activeTemplates.value = []
    }
    if (activeTemplates.value.length === 0) {
      isExpanded.value = false
    }
  }

  // 展开 / 收起切换
  function toggleExpand() {
    if (activeTemplates.value.length === 0) return
    isExpanded.value = !isExpanded.value
  }

  function toggleListening() {
    translationState.value.isListening = !translationState.value.isListening
  }

  function toggleSpeaking() {
    translationState.value.isSpeaking = !translationState.value.isSpeaking
  }

  function toggleFlashlight() {
    baseTemplateState.value.isFlashlightOn = !baseTemplateState.value.isFlashlightOn
  }

  function toggleRecordingPause() {
    baseTemplateState.value.isRecordingPaused = !baseTemplateState.value.isRecordingPaused
  }

  function toggleMediaPlay() {
    mediaExtendedState.value.isPlaying = !mediaExtendedState.value.isPlaying
  }

  return {
    activeTemplates,
    activeTemplate,
    isTemplateActive,
    isExpanded,
    foodDeliveryState,
    rideHailingState,
    navigationState,
    translationState,
    systemTipState,
    mediaExtendedState,
    baseTemplateState,
    hasActiveTemplate,
    activateTemplate,
    closeTemplate,
    toggleExpand,
    toggleListening,
    toggleSpeaking,
    toggleFlashlight,
    toggleRecordingPause,
    toggleMediaPlay,
    seekMedia,
    nextMediaTrack,
    prevMediaTrack,
    advanceFoodDelivery,
    advanceRideHailing,
    advanceNavigation,
    toggleTipLearned,
    toggleHotspot,
    toggleChargingMode,
    toggleCallMute,
    toggleCallSpeaker,
    toggleMicMute
  }
})
