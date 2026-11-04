import { computed } from 'vue'
import { useClockStore } from '../stores/clockStore.js'
import { useRecorderStore } from '../stores/recorderStore.js'
import { usePrayerStore } from '../stores/prayerStore.js'
import { useSystemStore } from '../stores/systemStore.js'
import { useI18nStore } from '../stores/i18nStore.js'
import { useNotificationsStore } from '../stores/notificationsStore.js'
import { useControlStore } from '../stores/controlStore.js'
import { useOs16IslandStore, OS16_TEMPLATES } from '../stores/os16IslandStore.js'

function getTitleForOs16Template(tpl, store) {
  switch (tpl) {
    case OS16_TEMPLATES.FOOD_DELIVERY:
      return store.foodDeliveryState?.title || 'Arrives 8:30-8:45 AM'
    case OS16_TEMPLATES.RIDE_HAILING:
      return store.rideHailingState?.title || 'On the way · 35 min'
    case OS16_TEMPLATES.NAVIGATION:
      return store.navigationState?.title || 'Drive 10 min 6km'
    case OS16_TEMPLATES.MEDIA_EXTENDED:
      return store.mediaExtendedState?.title || 'Eternal Sunshine'
    case OS16_TEMPLATES.TRANSLATION:
      return '双语实时同传'
    case OS16_TEMPLATES.SYSTEM_TIP:
      return store.systemTipState?.title || '三指截屏'
    case OS16_TEMPLATES.SCREEN_RECORDING:
      return store.baseTemplateState?.screenRecordingTime || '04:20'
    case OS16_TEMPLATES.VOICE_RECORDING:
      return '录音'
    case OS16_TEMPLATES.TIMER:
      return '00:15'
    case OS16_TEMPLATES.BATTERY_CHARGING:
      return `${store.baseTemplateState?.batteryPercent ?? 87}% 极速快充`
    case OS16_TEMPLATES.PHONE_CALL:
      return store.baseTemplateState?.callerName || 'Gdragon'
    case OS16_TEMPLATES.MICROPHONE:
      return '麦克风拾音中'
    case OS16_TEMPLATES.HOTSPOT:
      return '个人热点'
    case OS16_TEMPLATES.FLASHLIGHT:
      return '手电筒'
    default:
      return '实时活动'
  }
}

function getSubtitleForOs16Template(tpl, store) {
  switch (tpl) {
    case OS16_TEMPLATES.FOOD_DELIVERY:
      return store.foodDeliveryState?.subtitle || '美团外卖 · 骑手配送中'
    case OS16_TEMPLATES.RIDE_HAILING:
      return store.rideHailingState?.subtitle || store.rideHailingState?.carModel || '滴滴出行'
    case OS16_TEMPLATES.NAVIGATION:
      return store.navigationState?.turnText || '前方路口右转'
    case OS16_TEMPLATES.MEDIA_EXTENDED:
      return store.mediaExtendedState?.artist || 'Ariana Grande'
    case OS16_TEMPLATES.TRANSLATION:
      return 'English ⇄ 中文'
    case OS16_TEMPLATES.SYSTEM_TIP:
      return store.systemTipState?.description?.slice(0, 30) || '智能多任务引导'
    case OS16_TEMPLATES.SCREEN_RECORDING:
      return store.baseTemplateState?.isRecordingPaused ? '已暂停' : '正在屏幕录制'
    case OS16_TEMPLATES.VOICE_RECORDING:
      return '01:28'
    case OS16_TEMPLATES.TIMER:
      return '计时器'
    case OS16_TEMPLATES.BATTERY_CHARGING:
      return `${store.baseTemplateState?.batteryWatt ?? 68}W Max`
    case OS16_TEMPLATES.PHONE_CALL:
      return `${store.baseTemplateState?.callDuration || '01:28'} 通话中`
    case OS16_TEMPLATES.MICROPHONE:
      return store.baseTemplateState?.isMicMuted ? '麦克风已静音' : '正在接收声音'
    case OS16_TEMPLATES.HOTSPOT:
      return store.baseTemplateState?.hotspotRemain || '1 个设备连接'
    case OS16_TEMPLATES.FLASHLIGHT:
      return store.baseTemplateState?.isFlashlightOn ? '已开启' : '已关闭'
    default:
      return '灵动岛'
  }
}

function getAppIdForOs16Template(tpl) {
  switch (tpl) {
    case OS16_TEMPLATES.MEDIA_EXTENDED:
      return 'music'
    case OS16_TEMPLATES.VOICE_RECORDING:
      return 'voicememos'
    case OS16_TEMPLATES.TIMER:
      return 'clock'
    case OS16_TEMPLATES.PHONE_CALL:
      return 'phone'
    default:
      return 'settings'
  }
}

/**
 * 集中管理所有处于活动状态的灵动岛 Live Activity
 * 供灵动岛、通知中心、锁屏通知共用
 */
export function useActiveActivities() {
  const clockStore = useClockStore()
  const recorderStore = useRecorderStore()
  const prayerStore = usePrayerStore()
  const system = useSystemStore()
  const i18n = useI18nStore()
  const notificationsStore = useNotificationsStore()
  const control = useControlStore()
  const os16Store = useOs16IslandStore()

  prayerStore.startTicker()

  const isOs16TemplateActive = computed(() => {
    return os16Store.hasActiveTemplate
  })

  const isAlarmActive = computed(() => {
    return notificationsStore.isIslandEnabled('alarm') && clockStore.isAlarmActive
  })

  const isRecorderActive = computed(() => {
    return notificationsStore.isIslandEnabled('recorder') && recorderStore.isRecording && system.activeAppId !== 'voicememos'
  })

  const isTimerActive = computed(() => {
    return notificationsStore.isIslandEnabled('timer') && clockStore.isTimerActive && system.activeAppId !== 'clock'
  })

  const isStopwatchActive = computed(() => {
    return notificationsStore.isIslandEnabled('stopwatch') && clockStore.isStopwatchActive && system.activeAppId !== 'clock'
  })

  const isPrayerActive = computed(() => {
    return notificationsStore.isIslandEnabled('prayer') && Boolean(prayerStore.currentIslandPrayer)
  })

  const isMediaActive = computed(() => {
    return notificationsStore.isIslandEnabled('media') && Boolean(control.mediaActive)
  })

  const formattedPrayerCountdown = computed(() => {
    const s = prayerStore.islandCountdownSeconds
    const hrs = Math.floor(s / 3600)
    const mins = Math.floor((s % 3600) / 60)
    const secs = s % 60
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  const prayerSubtitle = computed(() => {
    const prayerId = prayerStore.currentIslandPrayer?.id || 'fajr'
    return i18n.islandSub ? i18n.islandSub(prayerId) : '晨礼勿扰已开启'
  })

  /**
   * 全部处于活动状态的活动列表（不设数量上限，有几个就显示几个）
   * 排序顺序：闹钟 > 灵动岛模板 > 定时器 > 秒表 > 录音 > 礼拜
   */
  const activeActivities = computed(() => {
    const list = []
    if (isAlarmActive.value && clockStore.ringingAlarm) {
      list.push({
        id: 'alarm',
        type: 'alarm',
        appId: 'clock',
        title: clockStore.ringingAlarm.status === 'snoozing'
          ? clockStore.formattedSnoozeCountdown
          : (clockStore.ringingAlarm.time || '20:44'),
        subtitle: clockStore.ringingAlarm.status === 'snoozing'
          ? '稍后提醒倒计时'
          : (clockStore.ringingAlarm.label || '闹钟'),
        status: clockStore.ringingAlarm.status
      })
    }
    if (isOs16TemplateActive.value) {
      for (const tpl of os16Store.activeTemplates) {
        list.push({
          id: `os16_${tpl}`,
          type: 'os16_template',
          template: tpl,
          appId: getAppIdForOs16Template(tpl),
          title: getTitleForOs16Template(tpl, os16Store),
          subtitle: getSubtitleForOs16Template(tpl, os16Store),
          status: 'active'
        })
      }
    }
    if (isTimerActive.value && !os16Store.isTemplateActive(OS16_TEMPLATES.TIMER)) {
      list.push({
        id: 'timer',
        type: 'timer',
        appId: 'clock',
        title: clockStore.formattedTimerIsland,
        subtitle: clockStore.timer.status === 'paused' ? '已暂停' : '倒计时',
        status: clockStore.timer.status
      })
    }
    if (isStopwatchActive.value) {
      list.push({
        id: 'stopwatch',
        type: 'stopwatch',
        appId: 'clock',
        title: clockStore.formattedStopwatchIsland,
        subtitle: clockStore.stopwatch.status === 'paused' ? '秒表 · 已暂停' : '秒表 · 计时中',
        status: clockStore.stopwatch.status
      })
    }
    if (isRecorderActive.value && !os16Store.isTemplateActive(OS16_TEMPLATES.VOICE_RECORDING)) {
      list.push({
        id: 'recorder',
        type: 'recorder',
        appId: 'voicememos',
        title: recorderStore.formattedTime,
        subtitle: recorderStore.isPaused ? '录音已暂停' : '正在录音',
        status: recorderStore.isPaused ? 'paused' : 'recording'
      })
    }
    if (isPrayerActive.value) {
      list.push({
        id: 'prayer',
        type: 'prayer',
        appId: 'clock',
        title: formattedPrayerCountdown.value,
        subtitle: prayerSubtitle.value,
        status: 'active'
      })
    }
    return list
  })

  return {
    isAlarmActive,
    isRecorderActive,
    isTimerActive,
    isStopwatchActive,
    isPrayerActive,
    isMediaActive,
    isOs16TemplateActive,
    formattedPrayerCountdown,
    prayerSubtitle,
    activeActivities
  }
}
