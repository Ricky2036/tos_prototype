<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePrayerStore } from '../../stores/prayerStore'
import { useRecorderStore } from '../../stores/recorderStore'
import { useClockStore } from '../../stores/clockStore'
import { useSystemStore } from '../../stores/systemStore'
import { useI18nStore } from '../../stores/i18nStore'
import { useNotificationsStore } from '../../stores/notificationsStore'
import { useControlStore } from '../../stores/controlStore'
import { GLYPHS } from '../../assets/icons/glyphs'
import { CLOCK_ICONS } from '../apps/clock/clockIcons'
import LIcon from '../ui/LIcon.vue'
import IslandCloseModal from '../ui/IslandCloseModal.vue'
import MusicPlayerCard from './MusicPlayerCard.vue'
import OS16TemplateCard from './island/OS16TemplateCard.vue'
import { useOs16IslandStore, OS16_TEMPLATES } from '../../stores/os16IslandStore'
import albumCover from '../../assets/icons/album_cover.png'
import iconFoodPizza from '../../assets/island/icon_food_pizza.png'
import iconRideCar from '../../assets/island/icon_ride_car.png'
import coverEternalSunshine from '../../assets/island/cover_eternal_sunshine.png'
import thumbThreeFinger from '../../assets/island/thumb_three_finger.png'

const prayerStore = usePrayerStore()
const recorderStore = useRecorderStore()
const clockStore = useClockStore()
const system = useSystemStore()
const i18n = useI18nStore()
const notificationsStore = useNotificationsStore()
const control = useControlStore()
const os16Store = useOs16IslandStore()
const mediaIslandExpanded = ref(false)

if (typeof window !== 'undefined') {
  window.__clock = clockStore
  window.__prayer = prayerStore
  window.__control = control
}

/* 各独立活动项活跃判断（闹钟/录音中/计时中/秒表中/礼拜/音乐） */
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

/* 是否有任意灵动岛活动 */
const hasAnyIsland = computed(() => {
  return (
    os16Store.hasActiveTemplate ||
    isAlarmActive.value ||
    isRecorderActive.value ||
    isTimerActive.value ||
    isStopwatchActive.value ||
    isPrayerActive.value ||
    isMediaActive.value
  )
})

/* 活跃项列表，按优先级排序：OS16 Template > Alarm > Timer > Stopwatch > Recorder > Media > Prayer */
const activeList = computed(() => {
  const list = []
  if (os16Store.hasActiveTemplate) list.push('os16_template')
  if (isAlarmActive.value) list.push('alarm')
  if (isTimerActive.value && os16Store.activeTemplate !== OS16_TEMPLATES.TIMER) list.push('timer')
  if (isStopwatchActive.value) list.push('stopwatch')
  if (isRecorderActive.value && os16Store.activeTemplate !== OS16_TEMPLATES.VOICE_RECORDING) list.push('recorder')
  if (isMediaActive.value && os16Store.activeTemplate !== OS16_TEMPLATES.MEDIA_EXTENDED) list.push('media')
  if (isPrayerActive.value) list.push('prayer')
  return list
})

/* 主卡片与副卡片列表：最多支持 4 项活动同时展示 */
const primaryActiveItem = computed(() => activeList.value[0] || null)
const subActiveItems = computed(() => activeList.value.slice(1, 4))

/* 展开态：由各 store 的 islandExpanded 共同驱动 */
const isExpanded = computed({
  get() {
    return (
      (os16Store.hasActiveTemplate ? os16Store.isExpanded : false) ||
      (isAlarmActive.value || isTimerActive.value || isStopwatchActive.value ? clockStore.islandExpanded : false) ||
      (isRecorderActive.value ? recorderStore.islandExpanded : false) ||
      (isPrayerActive.value ? prayerStore.islandExpanded : false) ||
      (isMediaActive.value ? mediaIslandExpanded.value : false)
    )
  },
  set(val) {
    if (os16Store.hasActiveTemplate) {
      os16Store.isExpanded = val
    }
    clockStore.islandExpanded = val
    recorderStore.islandExpanded = val
    prayerStore.islandExpanded = val
    mediaIslandExpanded.value = val
  }
})

const os16CardClass = computed(() => {
  if (primaryActiveItem.value !== 'os16_template') return ''
  const t = os16Store.activeTemplate
  if (t === OS16_TEMPLATES.FOOD_DELIVERY || t === OS16_TEMPLATES.RIDE_HAILING) return 'is-os16-progress'
  if (t === OS16_TEMPLATES.NAVIGATION) return 'is-os16-nav'
  if (t === OS16_TEMPLATES.TRANSLATION) return 'is-os16-translation'
  if (t === OS16_TEMPLATES.MEDIA_EXTENDED) return 'is-os16-media'
  if (t === OS16_TEMPLATES.SYSTEM_TIP) return 'is-os16-system-tip'
  if (t === OS16_TEMPLATES.PHONE_CALL || t === OS16_TEMPLATES.MICROPHONE) return 'is-os16-base-74'
  if (t === OS16_TEMPLATES.HOTSPOT || t === OS16_TEMPLATES.FLASHLIGHT) return 'is-os16-base-72'
  return 'is-os16-base-76'
})

const os16CapsuleText = computed(() => {
  const t = os16Store.activeTemplate
  if (t === OS16_TEMPLATES.FOOD_DELIVERY) return '8:30'
  if (t === OS16_TEMPLATES.RIDE_HAILING) return '35m'
  if (t === OS16_TEMPLATES.NAVIGATION) return '6km'
  if (t === OS16_TEMPLATES.TRANSLATION) return '英/中'
  if (t === OS16_TEMPLATES.SYSTEM_TIP) return '三指'
  if (t === OS16_TEMPLATES.MEDIA_EXTENDED) return '00:43'
  if (t === OS16_TEMPLATES.SCREEN_RECORDING) return os16Store.baseTemplateState.screenRecordingTime
  if (t === OS16_TEMPLATES.BATTERY_CHARGING) return `${os16Store.baseTemplateState.batteryPercent}%`
  if (t === OS16_TEMPLATES.PHONE_CALL) return '00:48'
  if (t === OS16_TEMPLATES.HOTSPOT) return '3m'
  if (t === OS16_TEMPLATES.FLASHLIGHT) return os16Store.baseTemplateState.isFlashlightOn ? '开' : '关'
  if (t === OS16_TEMPLATES.MICROPHONE) return '拾音中'
  return 'OS16'
})

/* 当切换 App 或退出到桌面时，默认收起至紧凑胶囊态 */
watch(
  [() => system.activeAppId, () => system.baseLayer],
  () => {
    isExpanded.value = false
  }
)

/* 倒计时轮询（祈祷与闹钟由 store 全局托管，通知中心/锁屏展开时不中断） */
onMounted(() => {
  prayerStore.startTicker()
  clockStore.startAlarmTicker()
})

/* 格式化祈祷倒计时文本 */
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

/* 祈祷多语言副标题 */
const prayerSubtitle = computed(() => {
  const prayerId = prayerStore.currentIslandPrayer?.id || 'fajr'
  return i18n.islandSub(prayerId)
})

/* 紧凑胶囊收起态显示的文本 */
const compactCapsuleTime = computed(() => {
  if (primaryActiveItem.value === 'alarm') {
    if (clockStore.isAlarmSnoozing) {
      return clockStore.formattedSnoozeCountdown
    }
    return clockStore.ringingAlarm?.time || '响铃'
  }
  if (primaryActiveItem.value === 'timer') return clockStore.formattedTimerIsland
  if (primaryActiveItem.value === 'stopwatch') return clockStore.formattedStopwatchIsland
  if (primaryActiveItem.value === 'recorder') return recorderStore.formattedTime
  if (primaryActiveItem.value === 'prayer') return formattedPrayerCountdown.value
  return ''
})

/* ================== 横滑操作（设置与删除） ================== */
const swipeOffsets = ref({})
let activeCardId = null
let cardPointerStartX = 0
let cardPointerStartY = 0
let cardInitialOffset = 0
let isSwipingCard = false
let swipeGestureDecided = false
let cardPointerTarget = null
let cardPointerId = null
let justSwipedId = null
const swipedTransitionId = ref(null)

const isIslandModalVisible = ref(false)
const pendingIslandAct = ref(null)

watch(isExpanded, (expanded) => {
  if (!expanded) {
    swipeOffsets.value = {}
    isIslandModalVisible.value = false
    pendingIslandAct.value = null
  }
})

function stopActivityInstance(type) {
  if (!type) return
  if (type === 'os16_template') {
    os16Store.closeTemplate()
  } else if (type === 'alarm') {
    clockStore.dismissAlarm()
  } else if (type === 'recorder') {
    recorderStore.stopRecording()
  } else if (type === 'timer') {
    clockStore.cancelTimer()
  } else if (type === 'stopwatch') {
    clockStore.resetStopwatch()
  } else if (type === 'prayer') {
    prayerStore.closeIsland()
  } else if (type === 'media') {
    control.mediaPlaying = false
  }
}

function onRequestDeleteActivity(item) {
  const type = typeof item === 'string' ? item : (item?.type || item?.id)
  pendingIslandAct.value = { id: type, type }
  isIslandModalVisible.value = true
}

function handleCloseOnce() {
  if (!pendingIslandAct.value) return
  const act = pendingIslandAct.value
  stopActivityInstance(act.type)
  const next = { ...swipeOffsets.value }
  delete next[act.id]
  swipeOffsets.value = next
  isIslandModalVisible.value = false
  pendingIslandAct.value = null
}

function handleClosePermanent() {
  if (!pendingIslandAct.value) return
  const act = pendingIslandAct.value
  stopActivityInstance(act.type)
  notificationsStore.setIslandEnabled(act.type, false)
  const next = { ...swipeOffsets.value }
  delete next[act.id]
  swipeOffsets.value = next
  isIslandModalVisible.value = false
  pendingIslandAct.value = null
}

function handleCancelIslandModal() {
  isIslandModalVisible.value = false
  pendingIslandAct.value = null
}

function onJumpSettings(item) {
  isExpanded.value = false
  notificationsStore.setTargetView('notifications', 'dynamicBar', item)
  system.openApp('settings')
  swipeOffsets.value = {}
}

function resetOtherCards(currentId) {
  const next = {}
  Object.keys(swipeOffsets.value).forEach((id) => {
    if (id === currentId) next[id] = swipeOffsets.value[id]
  })
  swipeOffsets.value = next
}

function onCardPointerDown(e, id) {
  if (!isExpanded.value) return
  if (e.target.closest('button') || e.target.closest('.ilc-btn') || e.target.closest('.media-ctrl-btn')) return
  activeCardId = id
  cardPointerStartX = e.clientX
  cardPointerStartY = e.clientY
  cardInitialOffset = swipeOffsets.value[id] || 0
  swipeGestureDecided = false
  isSwipingCard = false
  cardPointerId = e.pointerId
  cardPointerTarget = e.currentTarget
}

function onCardPointerMove(e, id) {
  if (activeCardId !== id || !isExpanded.value) return
  const dx = e.clientX - cardPointerStartX
  const dy = e.clientY - cardPointerStartY

  if (!swipeGestureDecided) {
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      swipeGestureDecided = true
      if (Math.abs(dx) > Math.abs(dy)) {
        isSwipingCard = true
        try {
          cardPointerTarget?.setPointerCapture(cardPointerId)
        } catch (_) {}
      } else {
        isSwipingCard = false
      }
    }
  }

  if (isSwipingCard) {
    let nextOffset = cardInitialOffset + dx
    if (nextOffset > 0) nextOffset = nextOffset * 0.2
    if (nextOffset < -260) nextOffset = -260 + (nextOffset + 260) * 0.2
    swipeOffsets.value = {
      ...swipeOffsets.value,
      [id]: nextOffset
    }
  }
}

function onCardPointerUp(e, id) {
  if (activeCardId !== id) return
  if (isSwipingCard) {
    justSwipedId = id
    swipedTransitionId.value = id
    setTimeout(() => {
      if (justSwipedId === id) justSwipedId = null
    }, 250)
    setTimeout(() => {
      if (swipedTransitionId.value === id) swipedTransitionId.value = null
    }, 280)

    const currentOffset = swipeOffsets.value[id] || 0
    if (currentOffset <= -170) {
      swipedTransitionId.value = id
      swipeOffsets.value = {
        ...swipeOffsets.value,
        [id]: -420
      }
      setTimeout(() => {
        onRequestDeleteActivity(id)
      }, 200)
    } else if (currentOffset < -45) {
      resetOtherCards(id)
      swipeOffsets.value = {
        ...swipeOffsets.value,
        [id]: -118
      }
    } else {
      const next = { ...swipeOffsets.value }
      delete next[id]
      swipeOffsets.value = next
    }
  }
  try {
    cardPointerTarget?.releasePointerCapture(cardPointerId)
  } catch (_) {}
  activeCardId = null
  isSwipingCard = false
  swipeGestureDecided = false
  cardPointerTarget = null
  cardPointerId = null
}

function getActionBtnStyle(id, type) {
  const offset = swipeOffsets.value[id] || 0
  if (offset >= 0) {
    return {
      opacity: 0,
      transform: 'translateX(0)',
      pointerEvents: 'none'
    }
  }
  const dist = Math.abs(offset)
  const isSettings = type === 'settings'
  const opacity = Math.min(1, dist / 35).toFixed(2)
  const extraDist = Math.max(0, dist - 118)
  const extraGap = extraDist * 0.45
  const shiftX = isSettings ? extraGap : (extraGap * 0.12)
  const isCurrentlySwiping = isSwipingCard && activeCardId === id
  return {
    opacity,
    transform: `translateX(${-shiftX}px)`,
    transition: isCurrentlySwiping ? 'none' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease'
  }
}

/* 点击卡片主体跳转至对应 App */
function handleCardClick(item) {
  if (justSwipedId === item) {
    justSwipedId = null
    return
  }
  if ((swipeOffsets.value[item] || 0) < -5) {
    const next = { ...swipeOffsets.value }
    delete next[item]
    swipeOffsets.value = next
    return
  }
  if (item === 'os16_template') {
    isExpanded.value = false
    os16Store.isExpanded = false
  } else if (item === 'alarm') {
    openClockTab('alarm')
  } else if (item === 'timer') {
    openClockTab('timer')
  } else if (item === 'stopwatch') {
    openClockTab('stopwatch')
  } else if (item === 'recorder') {
    openRecorderApp()
  } else if (item === 'prayer') {
    openClockTab('muslim')
  }
}

/* 点击主胶囊或主卡片 */
function handlePrimaryCardClick() {
  if (!isExpanded.value) {
    isExpanded.value = true
  } else {
    handleCardClick(primaryActiveItem.value)
  }
}

/* 多副卡片平滑入场与出场位移计算，精确对准摄像头孔位 */
function onSubcardBeforeEnter(el) {
  const index = Array.from(el.parentNode?.children || []).indexOf(el)
  const estimatedTop = 90 + Math.max(0, index) * 90
  el.style.setProperty('--fly-up', `${-(estimatedTop + 25)}px`)
}

function onSubcardBeforeLeave(el) {
  const top = el.offsetTop
  el.style.top = `${top}px`
  el.style.setProperty('--fly-up', `${-(top + 25)}px`)
}

/* 点击背景遮罩收起 */
function handleCloseBackdrop() {
  isExpanded.value = false
  if (os16Store.hasActiveTemplate) {
    os16Store.isExpanded = false
  }
  swipeOffsets.value = {}
}

/* 点击时钟卡片跳转进入对应 Tab 并收起 */
function openClockTab(tab) {
  clockStore.setActiveTab(tab)
  system.openApp('clock')
  isExpanded.value = false
  swipeOffsets.value = {}
}

/* 打开录音机并收起 */
function openRecorderApp() {
  system.openApp('voicememos')
  isExpanded.value = false
  swipeOffsets.value = {}
}

/* 停止录音 */
function handleStopRecording(e) {
  e.stopPropagation()
  recorderStore.stopRecording()
}

/* 关闭祈祷灵动岛 */
function handleClosePrayer(e) {
  e.stopPropagation()
  prayerStore.closeIsland()
}
</script>

<template>
  <!-- 全局点击空白处收起灵动岛遮罩 -->
  <div
    v-if="hasAnyIsland && isExpanded"
    class="island-backdrop"
    @click="handleCloseBackdrop"
  ></div>

  <!-- 灵动岛主挂载容器 -->
  <div v-if="hasAnyIsland" class="dynamic-island-wrapper">
    <!-- 1. 主灵动岛实体：在 compact 胶囊与 expanded 大圆角矩形之间做连续流体无缝变形 -->
    <div
      class="island-card"
      :class="[
        {
          'is-expanded': isExpanded,
          'is-compact': !isExpanded,
          'is-media': isExpanded && primaryActiveItem === 'media'
        },
        os16CardClass
      ]"
      @click="handlePrimaryCardClick"
    >
      <!-- ================= 1.1 收起态图层（顶部胶囊） ================= -->
      <div class="morph-layer compact-layer">
        <div class="cc-left">
          <!-- OS16 规范模版收起态图标（杜绝任何 Emoji，采用原版切图与矢量） -->
          <template v-if="primaryActiveItem === 'os16_template'">
            <img
              v-if="os16Store.activeTemplate === OS16_TEMPLATES.FOOD_DELIVERY"
              :src="iconFoodPizza"
              class="os16-mini-hifi-avatar"
              alt="Pizza"
            />
            <img
              v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.RIDE_HAILING"
              :src="iconRideCar"
              class="os16-mini-hifi-car"
              alt="Car"
            />
            <svg v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.NAVIGATION" width="16" height="16" viewBox="858 608 20 20" fill="none">
              <path d="M868.6 609.778C873.693 609.778 877.822 613.907 877.822 619C877.822 624.093 873.693 628.222 868.6 628.222C863.506 628.222 859.377 624.093 859.377 619C859.377 613.907 863.506 609.778 868.6 609.778Z" fill="#0060EA" stroke="white" stroke-width="1.5"/>
              <path d="M874.755 618.97L864.744 614.838L866.448 618.984L864.688 623.073L874.755 618.97Z" fill="white"/>
            </svg>
            <img
              v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.MEDIA_EXTENDED"
              :src="coverEternalSunshine"
              class="os16-mini-hifi-cover"
              alt="Music"
            />
            <svg v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.TRANSLATION" width="16" height="16" viewBox="1546 564 28 32" fill="none">
              <path d="M1560 570.667C1561.47 570.667 1562.67 571.861 1562.67 573.333V580C1562.67 581.472 1561.47 582.667 1560 582.667C1558.53 582.667 1557.33 581.472 1557.33 580V573.333C1557.33 571.861 1558.53 570.667 1560 570.667Z" fill="#0091FF"/>
              <path d="M1552.64 582.127C1554.43 586.438 1558.74 589.333 1563.74 589.333C1568.74 589.333 1573.05 586.438 1574.84 582.127" stroke="#0091FF" stroke-width="2.67" stroke-linecap="round"/>
              <path d="M1563.74 589.333V593.333" stroke="#0091FF" stroke-width="2.67" stroke-linecap="round"/>
            </svg>
            <img
              v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.SYSTEM_TIP"
              :src="thumbThreeFinger"
              class="os16-mini-hifi-tip"
              alt="Tip"
            />
            <svg v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.SCREEN_RECORDING" width="18" height="12" viewBox="209 264 32 20" fill="none">
              <path d="M227.095 264.227C227.893 264.227 228.556 264.227 229.098 264.271C229.662 264.317 230.188 264.417 230.683 264.67L230.824 264.745C231.523 265.136 232.091 265.727 232.455 266.442L232.501 266.535C232.72 267.002 232.809 267.497 232.853 268.026C232.893 268.525 232.896 269.128 232.896 269.845V278.111C232.896 278.828 232.893 279.432 232.853 279.931C232.809 280.46 232.72 280.955 232.501 281.422L232.455 281.515C232.091 282.231 231.523 282.821 230.824 283.213L230.683 283.288C230.188 283.54 229.662 283.64 229.098 283.686C228.556 283.73 227.893 283.73 227.095 283.73H215.218C214.42 283.73 213.756 283.73 213.215 283.686C212.686 283.643 212.191 283.553 211.724 283.334L211.631 283.288C210.916 282.923 210.325 282.355 209.934 281.657L209.858 281.515C209.606 281.02 209.506 280.495 209.46 279.931C209.416 279.39 209.416 278.726 209.416 277.928V270.029C209.416 269.231 209.416 268.567 209.46 268.026C209.506 267.462 209.606 266.937 209.858 266.442C210.247 265.679 210.868 265.058 211.631 264.67C212.126 264.417 212.651 264.317 213.215 264.271C213.756 264.227 214.42 264.227 215.218 264.227H227.095ZM239.093 266.55C239.546 266.552 239.975 266.76 240.257 267.115C240.472 267.386 240.53 267.718 240.556 267.998C240.582 268.288 240.582 268.663 240.582 269.101V278.963C240.582 279.404 240.582 279.781 240.556 280.073C240.53 280.353 240.472 280.688 240.256 280.96C239.972 281.315 239.542 281.522 239.087 281.522C238.74 281.522 238.441 281.358 238.206 281.203C237.961 281.041 237.668 280.806 237.323 280.531L234.817 278.529V269.511L237.332 267.527C237.677 267.255 237.969 267.022 238.214 266.863C238.449 266.71 238.747 266.549 239.093 266.55ZM214.938 267.636C213.765 267.636 212.813 268.588 212.813 269.761C212.814 270.935 213.765 271.885 214.938 271.885C216.112 271.885 217.063 270.935 217.063 269.761C217.063 268.588 216.112 267.636 214.938 267.636Z" fill="#FC5B4F"/>
            </svg>
            <svg v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.BATTERY_CHARGING" width="16" height="16" viewBox="0 0 24 24" fill="#30D158">
              <rect x="3" y="6" width="16" height="12" rx="3" fill="none" stroke="#30D158" stroke-width="2"/>
              <rect x="20" y="10" width="2" height="4" rx="1" fill="#30D158"/>
              <path d="M11.5 8L8 12.5h3L10.5 16l4-4.5h-3L12 8z" fill="#30D158"/>
            </svg>
            <svg v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.PHONE_CALL" width="16" height="16" viewBox="482 664 18 18" fill="#34C759">
              <path d="M498.729 679.75C498.55 680.872 497.93 681.224 497.133 681.115L497.054 681.103L496.842 681.067L496.642 681.031L496.47 680.998L496.28 680.958L496.138 680.927L496.017 680.9L495.8 680.85L495.507 680.777L495.268 680.715C495.188 680.693 495.107 680.67 495.024 680.647L494.881 680.604L494.708 680.551L494.61 680.521L494.454 680.47C494.369 680.442 494.285 680.413 494.2 680.383L494.064 680.333L493.883 680.265L493.789 680.228L493.631 680.164C493.549 680.129 493.467 680.094 493.386 680.058L493.316 680.029C492.766 679.809 492.229 679.56 491.706 679.282L491.475 679.157C491.357 679.091 491.24 679.025 491.123 678.956L490.942 678.849C490.637 678.665 490.34 678.473 490.049 678.271L489.827 678.114C489.645 677.984 489.467 677.85 489.291 677.712C489.174 677.621 489.058 677.528 488.944 677.433L488.761 677.28C488.638 677.176 488.517 677.069 488.397 676.961L488.209 676.789C488.098 676.686 487.989 676.58 487.88 676.474L487.808 676.402C487.714 676.309 487.622 676.215 487.53 676.119L487.386 675.966C487.296 675.869 487.207 675.772 487.119 675.673L486.983 675.518C486.878 675.397 486.775 675.275 486.673 675.15L486.504 674.94C486.365 674.764 486.23 674.586 486.099 674.405L486.099 674.404C486.015 674.289 485.933 674.173 485.853 674.056L485.729 673.875C485.637 673.736 485.546 673.596 485.457 673.454L485.314 673.222L485.197 673.025L485.034 672.74C484.985 672.652 484.937 672.564 484.889 672.475L484.812 672.329C484.737 672.186 484.665 672.041 484.594 671.895L484.488 671.67C484.427 671.54 484.368 671.409 484.311 671.277L484.225 671.075C484.143 670.878 484.064 670.679 483.989 670.478L483.955 670.384C483.874 670.163 483.798 669.939 483.727 669.714C483.727 669.713 483.727 669.711 483.726 669.71C483.654 669.485 483.588 669.257 483.526 669.027C483.526 669.025 483.524 669.023 483.524 669.021C483.477 668.848 483.433 668.675 483.392 668.5L483.362 668.369C483.329 668.222 483.296 668.075 483.268 667.927L483.245 667.83L483.183 667.551L483.148 667.382L483.148 667.377L483.116 667.216L483.088 667.067V667.067L483.027 666.721C482.899 665.902 483.242 665.262 484.386 665.08C485.201 664.945 486.024 664.865 486.85 664.838C487.343 664.823 487.853 665.073 488.207 665.783C488.282 665.934 488.355 666.09 488.425 666.246L488.508 666.433L488.627 666.711L488.915 667.401L488.98 667.553C489.033 667.676 489.083 667.787 489.13 667.882C489.365 668.358 489.292 669.24 488.754 669.796L488.668 669.886L488.529 670.034V670.034L488.431 670.142L488.332 670.256C487.95 670.702 487.556 671.262 487.527 671.75C487.526 671.77 487.525 671.793 487.525 671.815L487.527 671.932C487.527 671.972 487.527 672.029 487.534 672.078C487.54 672.116 487.544 672.141 487.563 672.183C488.628 673.901 490.05 675.369 491.732 676.488L491.877 676.583C491.889 676.591 491.9 676.599 491.917 676.603L491.952 676.609V676.609L491.987 676.609C492.012 676.609 492.034 676.611 492.058 676.609L492.109 676.603L492.136 676.6C492.159 676.597 492.182 676.594 492.205 676.589L492.246 676.581L492.286 676.57C492.309 676.564 492.333 676.558 492.356 676.551C492.384 676.542 492.411 676.533 492.439 676.523L492.509 676.495C492.537 676.483 492.564 676.472 492.592 676.459L492.627 676.442L492.663 676.424C492.691 676.41 492.718 676.397 492.745 676.382L492.782 676.361L492.898 676.293L492.976 676.243C493.023 676.212 493.07 676.18 493.116 676.147L493.191 676.095L493.228 676.067L493.337 675.983L493.443 675.897L493.567 675.793L493.674 675.699L493.796 675.588L493.91 675.482L494.012 675.384C494.568 674.845 495.451 674.772 495.927 675.008L495.985 675.036L496.114 675.096L496.255 675.158L496.407 675.223L497.097 675.511L497.282 675.59L497.469 675.671C497.656 675.754 497.844 675.84 498.025 675.93C498.736 676.284 498.985 676.795 498.971 677.288C498.944 678.113 498.863 678.935 498.729 679.75Z"/>
            </svg>
            <svg v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.HOTSPOT" width="16" height="16" viewBox="208 854 34 28" fill="none" stroke="#26C6DA" stroke-width="2.2" stroke-linecap="round">
              <path d="M215.73 867.898C215.73 864.844 217.171 862.125 219.404 860.386C220.021 859.905 220.912 860.016 221.392 860.633C221.873 861.25 221.762 862.141 221.145 862.621C219.572 863.847 218.564 865.754 218.564 867.898C218.564 869.975 219.51 871.83 220.999 873.058L221.145 873.175L221.201 873.221C221.769 873.711 221.858 874.565 221.392 875.163C220.927 875.761 220.077 875.884 219.463 875.454L219.404 875.41L219.197 875.245C217.082 873.501 215.73 870.857 215.73 867.898Z"/><path d="M216.692 877.652C217.282 878.166 217.344 879.06 216.83 879.65C216.316 880.24 215.422 880.302 214.832 879.788L216.692 877.652ZM209.416 867.896C209.416 863.291 211.392 859.145 214.538 856.265L214.832 856.003C215.422 855.489 216.316 855.551 216.83 856.141C217.344 856.73 217.282 857.626 216.692 858.139L216.452 858.354C213.867 860.721 212.249 864.118 212.249 867.896C212.249 871.789 213.968 875.279 216.692 877.652L214.832 879.788C211.516 876.9 209.416 872.642 209.416 867.896Z"/><path d="M224.813 864.741C226.557 864.741 227.971 866.154 227.971 867.898C227.971 869.642 226.557 871.055 224.813 871.055C223.07 871.055 221.656 869.642 221.656 867.898C221.656 866.154 223.07 864.741 224.813 864.741Z"/><path d="M233.898 867.898C233.898 864.844 232.458 862.125 230.225 860.386C229.607 859.905 228.717 860.016 228.237 860.633C227.756 861.25 227.867 862.141 228.484 862.621C230.057 863.847 231.065 865.754 231.065 867.898C231.065 869.975 230.119 871.83 228.63 873.058L228.484 873.175L228.427 873.221C227.86 873.711 227.771 874.565 228.237 875.163C228.702 875.761 229.552 875.884 230.166 875.454L230.225 875.41L230.432 875.245C232.547 873.501 233.898 870.857 233.898 867.898Z"/><path d="M232.935 877.652C232.345 878.165 232.283 879.06 232.797 879.65C233.311 880.24 234.205 880.302 234.795 879.788L232.935 877.652ZM240.211 867.895C240.211 863.29 238.235 859.145 235.089 856.264L234.795 856.002C234.205 855.489 233.311 855.55 232.797 856.14C232.283 856.73 232.345 857.625 232.935 858.139L233.175 858.354C235.76 860.721 237.378 864.118 237.378 867.895C237.378 871.788 235.659 875.279 232.935 877.652L234.795 879.788C238.111 876.9 240.211 872.642 240.211 867.895Z"/>
            </svg>
            <svg v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.FLASHLIGHT" width="12" height="16" viewBox="218 949 14 30" fill="none">
              <defs><linearGradient id="fl_grad_cap" x1="224.999" y1="949" x2="224.999" y2="979" gradientUnits="userSpaceOnUse"><stop stop-color="#E4E4E7"/><stop offset="1" stop-color="#71717A"/></linearGradient></defs>
              <path d="M231.993 954C231.983 954.804 231.953 955.344 231.851 955.868C231.719 956.543 231.5 957.198 231.201 957.816C230.864 958.514 230.389 959.147 229.439 960.413L229.319 960.573C229.201 960.732 229.141 960.811 229.099 960.898C229.061 960.976 229.034 961.057 229.018 961.142C228.999 961.237 228.999 961.335 228.999 961.533V975.8C228.999 976.92 228.999 977.48 228.781 977.908C228.59 978.284 228.283 978.59 227.907 978.782C227.479 979 226.919 979 225.799 979H224.199C223.079 979 222.519 979 222.091 978.782C221.715 978.59 221.409 978.284 221.217 977.908C220.999 977.48 220.999 976.92 220.999 975.8V961.533C220.999 961.335 220.999 961.237 220.98 961.142C220.964 961.057 220.937 960.976 220.899 960.898C220.857 960.811 220.797 960.732 220.679 960.573L220.559 960.413C219.609 959.147 219.134 958.514 218.797 957.816C218.498 957.198 218.279 956.543 218.147 955.868C218.045 955.344 218.015 954.804 218.005 954H231.993ZM224.999 963C224.171 963 223.499 963.672 223.499 964.5V967.5C223.499 968.328 224.171 969 224.999 969C225.827 969 226.499 968.328 226.499 967.5V964.5C226.499 963.672 225.827 963 224.999 963ZM224.999 966C225.551 966 225.999 966.448 225.999 967V967.5C225.999 968.052 225.551 968.5 224.999 968.5C224.447 968.5 223.999 968.052 223.999 967.5V967C223.999 966.448 224.447 966 224.999 966ZM228.799 949C229.919 949 230.479 949 230.907 949.218C231.283 949.41 231.59 949.716 231.781 950.092C231.986 950.493 231.997 951.012 231.998 952H218C218.001 951.012 218.012 950.493 218.217 950.092C218.409 949.716 218.715 949.41 219.091 949.218C219.519 949 220.079 949 221.199 949H228.799Z" fill="url(#fl_grad_cap)"/>
            </svg>
            <svg v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.TIMER" width="13" height="16" viewBox="214 459 22 30" fill="none">
              <path d="M233.689 459.464C233.802 459.464 233.958 459.463 234.096 459.474C234.247 459.487 234.478 459.52 234.723 459.644C234.995 459.783 235.222 459.994 235.381 460.253L235.445 460.366L235.522 460.546C235.585 460.721 235.606 460.88 235.615 460.994C235.626 461.132 235.625 461.288 235.625 461.4V462.379C235.625 464.133 235.636 465.25 235.33 466.285C235.069 467.167 234.641 467.992 234.069 468.713C233.398 469.558 232.478 470.191 231.042 471.2L227.056 474L231.042 476.8C232.478 477.808 233.398 478.441 234.069 479.287C234.641 480.008 235.069 480.832 235.33 481.715C235.636 482.75 235.625 483.866 235.625 485.621V486.599C235.625 468.712 235.626 486.868 235.615 487.006C235.606 487.12 235.585 487.279 235.522 487.454L235.445 487.634L235.381 487.747C235.222 488.006 234.995 488.217 234.723 488.355C234.478 488.48 234.247 488.513 234.096 488.525C233.958 488.537 233.802 488.536 233.689 488.536H216.312C216.199 488.536 216.043 488.536 215.905 488.525C215.792 488.516 215.633 488.496 215.458 488.433L215.277 488.355C215.005 488.217 214.778 488.006 214.619 487.747L214.556 487.634C214.431 487.389 214.398 487.157 214.386 487.006C214.375 486.868 214.375 486.712 214.375 486.599V485.621C214.375 483.866 214.364 482.75 214.67 481.715C214.931 480.832 215.359 480.008 215.932 479.287C216.603 478.441 217.523 477.808 218.959 476.8L222.943 474L218.959 471.2C217.523 470.191 216.603 469.558 215.932 468.713C215.359 467.992 214.931 467.168 214.67 466.285C214.364 465.25 214.375 464.133 214.375 462.379V461.4C214.375 461.288 214.375 461.132 214.386 460.994C214.398 460.842 214.431 460.611 214.556 460.366L214.619 460.253C214.778 459.994 215.005 459.783 215.277 459.644L215.458 459.566C215.633 459.504 215.792 459.484 215.905 459.474C216.043 459.463 216.199 459.464 216.312 459.464H233.689ZM216.736 462.379C216.736 464.276 216.747 464.986 216.934 465.616C217.109 466.208 217.396 466.761 217.78 467.245C218.189 467.76 218.763 468.178 220.315 469.268L225 472.558L229.685 469.268C231.237 468.178 231.811 467.76 232.22 467.245C232.604 466.761 232.891 466.208 233.066 465.616C233.253 464.986 233.264 464.276 233.264 462.379V461.825H216.736V462.379Z" fill="#FF9900"/>
            </svg>
            <svg v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.VOICE_RECORDING" width="18" height="15" viewBox="207 359 36 30" fill="none">
              <rect x="208" y="372.021" width="2.4" height="4.0" rx="1.2" fill="white"/>
              <rect x="212.5" y="368.01" width="2.4" height="12" rx="1.2" fill="white"/>
              <rect x="217" y="371.019" width="2.4" height="6" rx="1.2" fill="white"/>
              <rect x="221.5" y="364" width="2.4" height="20" rx="1.2" fill="white"/>
              <path d="M226.053 360.187C226.053 359.522 226.592 358.983 227.256 358.983C227.921 358.983 228.46 359.522 228.46 360.187V387.868C228.46 388.533 227.921 389.072 227.256 389.072C226.592 389.072 226.053 388.533 226.053 387.868V360.187Z" fill="#FC5B4F"/>
              <rect width="2.4" height="4.0" rx="1.2" transform="matrix(-1 0 0 1 233 372.021)" fill="white" fill-opacity="0.6"/>
              <rect width="2.4" height="4.0" rx="1.2" transform="matrix(-1 0 0 1 237.5 372.021)" fill="white" fill-opacity="0.6"/>
              <rect width="2.4" height="4.0" rx="1.2" transform="matrix(-1 0 0 1 242 372.021)" fill="white" fill-opacity="0.6"/>
            </svg>
            <svg v-else-if="os16Store.activeTemplate === OS16_TEMPLATES.MICROPHONE" width="16" height="16" viewBox="1546 564 28 32" fill="none">
              <path d="M1560 570.667C1561.47 570.667 1562.67 571.861 1562.67 573.333V580C1562.67 581.472 1561.47 582.667 1560 582.667C1558.53 582.667 1557.33 581.472 1557.33 580V573.333C1557.33 571.861 1558.53 570.667 1560 570.667Z" fill="#FF9500"/>
              <path d="M1552.64 582.127C1554.43 586.438 1558.74 589.333 1563.74 589.333C1568.74 589.333 1573.05 586.438 1574.84 582.127" stroke="#FF9500" stroke-width="2.67" stroke-linecap="round"/>
              <path d="M1563.74 589.333V593.333" stroke="#FF9500" stroke-width="2.67" stroke-linecap="round"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="#00E5FF">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </template>
          <!-- 闹钟收起态图标 -->
          <svg v-else-if="primaryActiveItem === 'alarm'" class="compact-alarm-icon" width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="CLOCK_ICONS.alarm" />
          </svg>
          <svg v-else-if="primaryActiveItem === 'timer'" width="17" height="17" viewBox="0 0 24 24">
            <path :d="CLOCK_ICONS.timer" fill="#ff9500" />
          </svg>
          <svg v-else-if="primaryActiveItem === 'stopwatch'" width="17" height="17" viewBox="0 0 24 24">
            <path :d="CLOCK_ICONS.stopwatch" fill="#ff9500" />
          </svg>
          <span v-else-if="primaryActiveItem === 'recorder'" class="rc-mini-wave">
            <i></i><i></i><i></i><i></i><i></i>
          </span>
          <svg v-else-if="primaryActiveItem === 'prayer'" width="17" height="17" viewBox="0 0 24 24">
            <path :d="GLYPHS.moon" fill="#00C853" />
          </svg>
          <div v-else-if="primaryActiveItem === 'media'" class="media-mini-cover-wrap">
            <img :src="albumCover" class="media-mini-cover" alt="Cover" />
          </div>
        </div>

        <div class="cc-camera-slot"></div>

        <div class="cc-right">
          <span v-if="primaryActiveItem === 'os16_template'" class="cc-time os16-time">
            {{ os16CapsuleText }}
          </span>
          <span v-else-if="primaryActiveItem === 'media'" class="media-mini-wave" :class="{ paused: !control.mediaPlaying }">
            <i></i><i></i><i></i><i></i>
          </span>
          <span v-else class="cc-time">{{ compactCapsuleTime }}</span>
        </div>
      </div>

      <!-- 底层滑动操作按钮（仅在展开态且有滑动时活跃） -->
      <div
        v-if="isExpanded"
        class="island-swipe-actions"
        :class="{ 'is-active': (swipeOffsets[primaryActiveItem] || 0) < -2 }"
      >
        <button
          class="island-action-btn island-btn-settings"
          :style="getActionBtnStyle(primaryActiveItem, 'settings')"
          @click.stop="onJumpSettings(primaryActiveItem)"
          :title="i18n.t('islandSettings')"
        >
          <LIcon name="headerSettings" :size="20" />
        </button>
        <button
          class="island-action-btn island-btn-delete"
          :style="getActionBtnStyle(primaryActiveItem, 'delete')"
          @click.stop="onRequestDeleteActivity(primaryActiveItem)"
          :title="i18n.t('delete')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>

      <!-- ================= 1.2 展开态图层（大圆角矩形） ================= -->
      <div
        class="morph-layer expanded-layer"
        :class="[
          {
            'is-media-layer': primaryActiveItem === 'media',
            'is-os16-layer': primaryActiveItem === 'os16_template'
          },
          {
            'is-swiping': isSwipingCard && activeCardId === primaryActiveItem,
            'has-swipe-transition': !isSwipingCard && swipedTransitionId === primaryActiveItem
          }
        ]"
        :style="{ transform: isExpanded ? `translateX(${swipeOffsets[primaryActiveItem] || 0}px)` : undefined }"
        @pointerdown="onCardPointerDown($event, primaryActiveItem)"
        @pointermove="onCardPointerMove($event, primaryActiveItem)"
        @pointerup="onCardPointerUp($event, primaryActiveItem)"
        @pointercancel="onCardPointerUp($event, primaryActiveItem)"
      >
        <!-- OS16 灵动岛规范模版 -->
        <template v-if="primaryActiveItem === 'os16_template'">
          <OS16TemplateCard />
        </template>
        <!-- 主项：闹钟（对齐 Screenshot_20260909-204420.jpg） -->
        <template v-if="primaryActiveItem === 'alarm'">
          <div class="ilc-left">
            <div class="ilc-icon-wrap icon-alarm" :class="{ 'is-ringing': clockStore.isAlarmRinging }">
              <svg class="alarm-activity-icon" width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
                <path :d="CLOCK_ICONS.alarm" />
              </svg>
            </div>
            <div class="ilc-time-col">
              <span class="ilc-main-time">
                {{ clockStore.isAlarmSnoozing ? clockStore.formattedSnoozeCountdown : (clockStore.ringingAlarm?.time || '20:44') }}
              </span>
              <span class="ilc-sub-label">
                {{ clockStore.isAlarmSnoozing ? '稍后提醒倒计时' : (clockStore.ringingAlarm?.label || '闹钟') }}
              </span>
            </div>
          </div>

          <div class="ilc-actions">
            <!-- 延时按键 (时钟表盘与 zZ) -->
            <button
              class="ilc-btn btn-snooze"
              @click.stop="clockStore.snoozeAlarm()"
              :title="clockStore.isAlarmSnoozing ? '重新延时' : '稍后提醒'"
            >
              <svg class="snooze-activity-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path :d="CLOCK_ICONS.snooze" />
              </svg>
            </button>

            <!-- 关闭按键 -->
            <button
              class="ilc-btn btn-dismiss"
              @click.stop="clockStore.dismissAlarm()"
              title="关闭"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </template>

        <!-- 主项：定时器 -->
        <template v-else-if="primaryActiveItem === 'timer'">
          <div class="ilc-left">
            <div class="ilc-icon-wrap icon-timer">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.timer" fill="#ff9500" />
              </svg>
            </div>
            <div class="ilc-time-col">
              <span class="ilc-main-time">{{ clockStore.formattedTimerIsland }}</span>
              <span class="ilc-sub-label">
                {{ clockStore.timer.status === 'paused' ? '已暂停' : '倒计时' }}
              </span>
            </div>
          </div>

          <div class="ilc-actions">
            <button
              class="ilc-btn btn-cancel"
              @click.stop="clockStore.cancelTimer()"
              title="取消倒计时"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.close" fill="#fff" />
              </svg>
            </button>
            <button
              class="ilc-btn btn-playpause"
              @click.stop="
                clockStore.timer.status === 'running'
                  ? clockStore.pauseTimer()
                  : clockStore.resumeTimer()
              "
              title="暂停/开始"
            >
              <svg
                v-if="clockStore.timer.status === 'running'"
                width="18"
                height="18"
                viewBox="0 0 24 24"
              >
                <path :d="CLOCK_ICONS.pause" fill="#ffffff" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.play" fill="#ffffff" />
              </svg>
            </button>
          </div>
        </template>

        <!-- 主项：秒表 -->
        <template v-else-if="primaryActiveItem === 'stopwatch'">
          <div class="ilc-left">
            <div class="ilc-icon-wrap icon-stopwatch">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.stopwatch" fill="#ff9500" />
              </svg>
            </div>
            <div class="ilc-time-col">
              <span class="ilc-main-time">{{ clockStore.formattedStopwatchIsland }}</span>
              <span class="ilc-sub-label">
                {{ clockStore.stopwatch.status === 'paused' ? '秒表 · 已暂停' : '秒表 · 计时中' }}
              </span>
            </div>
          </div>

          <div class="ilc-actions">
            <button
              v-if="clockStore.stopwatch.status === 'running'"
              class="ilc-btn btn-cancel"
              @click.stop="clockStore.recordLap()"
              title="计次"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.lap" fill="#fff" />
              </svg>
            </button>
            <button
              v-else
              class="ilc-btn btn-cancel"
              @click.stop="clockStore.resetStopwatch()"
              title="重置秒表"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.close" fill="#fff" />
              </svg>
            </button>

            <button
              class="ilc-btn btn-playpause"
              @click.stop="
                clockStore.stopwatch.status === 'running'
                  ? clockStore.pauseStopwatch()
                  : clockStore.startStopwatch()
              "
              title="暂停/开始"
            >
              <svg
                v-if="clockStore.stopwatch.status === 'running'"
                width="18"
                height="18"
                viewBox="0 0 24 24"
              >
                <path :d="CLOCK_ICONS.pause" fill="#ffffff" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.play" fill="#ffffff" />
              </svg>
            </button>
          </div>
        </template>

        <!-- 主项：录音 -->
        <template v-else-if="primaryActiveItem === 'recorder'">
          <div class="ilc-left">
            <div class="rc-expanded-left">
              <div class="rc-audio-bars">
                <span class="bar bar-1"></span>
                <span class="bar bar-2"></span>
                <span class="bar bar-3"></span>
                <span class="bar bar-main"></span>
                <span class="bar bar-5"></span>
                <span class="bar bar-6"></span>
                <span class="bar bar-7"></span>
              </div>
            </div>
            <div class="ilc-time-col">
              <span class="ilc-main-time">{{ recorderStore.formattedTime }}</span>
              <span class="ilc-sub-label">{{ recorderStore.isPaused ? '录音已暂停' : '正在录音' }}</span>
            </div>
          </div>

          <div class="ilc-actions">
            <button
              class="ilc-btn btn-stop-record"
              @click.stop="handleStopRecording"
              title="停止录音"
            >
              <div class="btn-stop-square"></div>
            </button>
          </div>
        </template>

        <!-- 主项：礼拜 -->
        <template v-else-if="primaryActiveItem === 'prayer'">
          <div class="ilc-left">
            <div class="ilc-icon-wrap icon-prayer">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path :d="GLYPHS.moon" fill="#00C853" />
              </svg>
            </div>
            <div class="ilc-time-col">
              <span class="ilc-main-time">{{ formattedPrayerCountdown }}</span>
              <span class="ilc-sub-label">{{ prayerSubtitle }}</span>
            </div>
          </div>

          <div class="ilc-actions">
            <button
              class="ilc-btn btn-cancel"
              @click.stop="handleClosePrayer"
              title="关闭"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.close" fill="#fff" />
              </svg>
            </button>
          </div>
        </template>

        <!-- 主项：音乐（与通知中心高卡片完全一致的布局） -->
        <template v-else-if="primaryActiveItem === 'media'">
          <MusicPlayerCard :is-island="true" />
        </template>
      </div>
    </div>

    <!-- 2. 副灵动岛卡片列表：支持最多同时展示 4 项，展开时平滑向下滑出，间距 10px -->
    <TransitionGroup
      name="subcard-slide"
      @before-enter="onSubcardBeforeEnter"
      @before-leave="onSubcardBeforeLeave"
    >
      <div
        v-if="isExpanded"
        v-for="item in subActiveItems"
        :key="item"
        class="island-secondary-card"
        :class="{ 'is-media-card': item === 'media' }"
        @click="handleCardClick(item)"
      >
        <!-- 底层滑动操作按钮 -->
        <div
          class="island-swipe-actions"
          :class="{ 'is-active': (swipeOffsets[item] || 0) < -2 }"
        >
          <button
            class="island-action-btn island-btn-settings"
            :style="getActionBtnStyle(item, 'settings')"
            @click.stop="onJumpSettings(item)"
            :title="i18n.t('islandSettings')"
          >
            <LIcon name="headerSettings" :size="20" />
          </button>
          <button
            class="island-action-btn island-btn-delete"
            :style="getActionBtnStyle(item, 'delete')"
            @click.stop="onRequestDeleteActivity(item)"
            :title="i18n.t('delete')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>

        <!-- 表层副卡主体（横滑） -->
        <div
          class="island-subcard-front"
          :class="[
            { 'is-media-front': item === 'media' },
            {
              'is-swiping': isSwipingCard && activeCardId === item,
              'has-swipe-transition': !isSwipingCard && swipedTransitionId === item
            }
          ]"
          :style="{ transform: `translateX(${swipeOffsets[item] || 0}px)` }"
          @pointerdown="onCardPointerDown($event, item)"
          @pointermove="onCardPointerMove($event, item)"
          @pointerup="onCardPointerUp($event, item)"
          @pointercancel="onCardPointerUp($event, item)"
        >
          <!-- 副项：闹钟 -->
          <template v-if="item === 'alarm'">
          <div class="ilc-left">
            <div class="ilc-icon-wrap icon-alarm" :class="{ 'is-ringing': clockStore.isAlarmRinging }">
              <svg class="alarm-activity-icon" width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
                <path :d="CLOCK_ICONS.alarm" />
              </svg>
            </div>
            <div class="ilc-time-col">
              <span class="ilc-main-time">
                {{ clockStore.isAlarmSnoozing ? clockStore.formattedSnoozeCountdown : (clockStore.ringingAlarm?.time || '20:44') }}
              </span>
              <span class="ilc-sub-label">
                {{ clockStore.isAlarmSnoozing ? '稍后提醒倒计时' : (clockStore.ringingAlarm?.label || '闹钟') }}
              </span>
            </div>
          </div>

          <div class="ilc-actions">
            <button
              class="ilc-btn btn-snooze"
              @click.stop="clockStore.snoozeAlarm()"
              :title="clockStore.isAlarmSnoozing ? '重新延时' : '稍后提醒'"
            >
              <svg class="snooze-activity-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path :d="CLOCK_ICONS.snooze" />
              </svg>
            </button>

            <button
              class="ilc-btn btn-dismiss"
              @click.stop="clockStore.dismissAlarm()"
              title="关闭"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </template>

        <!-- 副项：秒表 -->
        <template v-else-if="item === 'stopwatch'">
          <div class="ilc-left">
            <div class="ilc-icon-wrap icon-stopwatch">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.stopwatch" fill="#ff9500" />
              </svg>
            </div>
            <div class="ilc-time-col">
              <span class="ilc-main-time">{{ clockStore.formattedStopwatchIsland }}</span>
              <span class="ilc-sub-label">
                {{ clockStore.stopwatch.status === 'paused' ? '秒表 · 已暂停' : '秒表 · 计时中' }}
              </span>
            </div>
          </div>

          <div class="ilc-actions">
            <button
              v-if="clockStore.stopwatch.status === 'running'"
              class="ilc-btn btn-cancel"
              @click.stop="clockStore.recordLap()"
              title="计次"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.lap" fill="#fff" />
              </svg>
            </button>
            <button
              v-else
              class="ilc-btn btn-cancel"
              @click.stop="clockStore.resetStopwatch()"
              title="重置秒表"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.close" fill="#fff" />
              </svg>
            </button>

            <button
              class="ilc-btn btn-playpause"
              @click.stop="
                clockStore.stopwatch.status === 'running'
                  ? clockStore.pauseStopwatch()
                  : clockStore.startStopwatch()
              "
              title="暂停/开始"
            >
              <svg
                v-if="clockStore.stopwatch.status === 'running'"
                width="18"
                height="18"
                viewBox="0 0 24 24"
              >
                <path :d="CLOCK_ICONS.pause" fill="#ffffff" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.play" fill="#ffffff" />
              </svg>
            </button>
          </div>
        </template>

        <!-- 副项：定时器 -->
        <template v-else-if="item === 'timer'">
          <div class="ilc-left">
            <div class="ilc-icon-wrap icon-timer">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.timer" fill="#ff9500" />
              </svg>
            </div>
            <div class="ilc-time-col">
              <span class="ilc-main-time">{{ clockStore.formattedTimerIsland }}</span>
              <span class="ilc-sub-label">
                {{ clockStore.timer.status === 'paused' ? '已暂停' : '倒计时' }}
              </span>
            </div>
          </div>

          <div class="ilc-actions">
            <button
              class="ilc-btn btn-cancel"
              @click.stop="clockStore.cancelTimer()"
              title="取消倒计时"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.close" fill="#fff" />
              </svg>
            </button>
            <button
              class="ilc-btn btn-playpause"
              @click.stop="
                clockStore.timer.status === 'running'
                  ? clockStore.pauseTimer()
                  : clockStore.resumeTimer()
              "
              title="暂停/开始"
            >
              <svg
                v-if="clockStore.timer.status === 'running'"
                width="18"
                height="18"
                viewBox="0 0 24 24"
              >
                <path :d="CLOCK_ICONS.pause" fill="#ffffff" />
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.play" fill="#ffffff" />
              </svg>
            </button>
          </div>
        </template>

        <!-- 副项：录音 -->
        <template v-else-if="item === 'recorder'">
          <div class="ilc-left">
            <div class="rc-expanded-left">
              <div class="rc-audio-bars">
                <span class="bar bar-1"></span>
                <span class="bar bar-2"></span>
                <span class="bar bar-3"></span>
                <span class="bar bar-main"></span>
                <span class="bar bar-5"></span>
                <span class="bar bar-6"></span>
                <span class="bar bar-7"></span>
              </div>
            </div>
            <div class="ilc-time-col">
              <span class="ilc-main-time">{{ recorderStore.formattedTime }}</span>
              <span class="ilc-sub-label">{{ recorderStore.isPaused ? '录音已暂停' : '正在录音' }}</span>
            </div>
          </div>

          <div class="ilc-actions">
            <button
              class="ilc-btn btn-stop-record"
              @click.stop="handleStopRecording"
              title="停止录音"
            >
              <div class="btn-stop-square"></div>
            </button>
          </div>
        </template>

        <!-- 副项：礼拜 -->
        <template v-else-if="item === 'prayer'">
          <div class="ilc-left">
            <div class="ilc-icon-wrap icon-prayer">
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path :d="GLYPHS.moon" fill="#00C853" />
              </svg>
            </div>
            <div class="ilc-time-col">
              <span class="ilc-main-time">{{ formattedPrayerCountdown }}</span>
              <span class="ilc-sub-label">{{ prayerSubtitle }}</span>
            </div>
          </div>

          <div class="ilc-actions">
            <button
              class="ilc-btn btn-cancel"
              @click.stop="handleClosePrayer"
              title="关闭"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path :d="CLOCK_ICONS.close" fill="#fff" />
              </svg>
            </button>
          </div>
        </template>

        <!-- 副项：音乐（与通知中心高卡片完全一致的布局） -->
        <template v-else-if="item === 'media'">
          <MusicPlayerCard :is-island="true" />
        </template>
        </div>
      </div>
    </TransitionGroup>
  </div>

  <!-- 灵动岛永久/单次关闭确认弹窗 -->
  <IslandCloseModal
    :visible="isIslandModalVisible"
    :act="pendingIslandAct"
    @close-once="handleCloseOnce"
    @close-permanent="handleClosePermanent"
    @cancel="handleCancelIslandModal"
    @update:visible="isIslandModalVisible = $event"
  />
</template>

<style scoped>
/* 全局透明背景遮罩：点击空白处收回胶囊 */
.island-backdrop {
  position: absolute;
  inset: 0;
  z-index: 96;
  background: transparent;
}

.dynamic-island-wrapper {
  position: absolute;
  top: 7px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 97;
  user-select: none;
  width: calc(var(--screen-w, 360px) - 20px);
  max-width: 358px;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ================= 灵动岛无缝连续形变核心 (Liquid Morphing) ================= */
.island-card {
  position: relative;
  background: #000000;
  color: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.48), 0 0 0 0.5px rgba(255, 255, 255, 0.12);
  cursor: pointer;
  overflow: hidden;
  will-change: width, height, border-radius, padding, box-shadow;
  pointer-events: auto;
  /* 苹果级流体弹簧形变过渡曲线：胶囊与80px大圆角矩形同一DOM无缝过渡 */
  transition:
    width 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    height 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    border-radius 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    padding 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    box-shadow 0.38s ease;
}

/* 收起态尺寸（紧凑胶囊） */
.island-card.is-compact {
  width: 136px;
  height: 35px;
  border-radius: 18px;
  padding: 0 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255, 255, 255, 0.12);
}

.island-card.is-compact:active {
  transform: scale(0.95);
}

/* 展开态尺寸：经典礼拜模式大圆角矩形 (高度80px，圆角28px) */
/* 展开态容器透明无黑底且溢出可见，允许表层卡片自由滑出，底层操作按钮直接浮于壁纸之上 */
.island-card.is-expanded {
  width: 100%;
  height: 80px;
  border-radius: 28px;
  padding: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

/* 图层绝对定位叠放并无缝渐变 */
.morph-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  will-change: opacity, transform;
}

/* ================= 收起态胶囊图层 ================= */
.compact-layer {
  padding: 0 12px;
  justify-content: space-between;
}
/* 收起态时：等待卡片缩至小尺寸（延迟 0.15s）后才淡入，避免缩小初期内容重叠 */
.is-compact .compact-layer {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
  transition: opacity 0.18s cubic-bezier(0.32, 0.72, 0, 1) 0.15s, transform 0.38s cubic-bezier(0.32, 0.72, 0, 1);
}
/* 展开时：以极快速度淡出（0.10s），立刻让出视野 */
.is-expanded .compact-layer {
  opacity: 0;
  transform: scale(0.85);
  pointer-events: none;
  transition: opacity 0.10s ease-out, transform 0.20s ease-out;
}

.cc-left {
  display: flex;
  align-items: center;
  justify-content: center;
}
.cc-camera-slot {
  width: 18px;
  height: 18px;
  flex: none;
}
.cc-right {
  display: flex;
  align-items: center;
}
.cc-time {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.2px;
}

/* 录音迷你声波 */
.rc-mini-wave {
  display: inline-flex;
  align-items: center;
  gap: 2.5px;
  height: 16px;
}
.rc-mini-wave i {
  width: 2.5px;
  height: 8px;
  border-radius: 1.5px;
  background: #ff453a;
  animation: rcMiniWave 1s ease-in-out infinite alternate;
}
.rc-mini-wave i:nth-child(1) { height: 6px; animation-delay: 0.1s; }
.rc-mini-wave i:nth-child(2) { height: 12px; animation-delay: 0.35s; }
.rc-mini-wave i:nth-child(3) { height: 16px; animation-delay: 0.15s; }
.rc-mini-wave i:nth-child(4) { height: 10px; animation-delay: 0.4s; }
.rc-mini-wave i:nth-child(5) { height: 7px; animation-delay: 0.2s; }

@keyframes rcMiniWave {
  0% { transform: scaleY(0.4); opacity: 0.7; }
  100% { transform: scaleY(1.1); opacity: 1; }
}

/* ================= 展开态主卡片图层 ================= */
.expanded-layer {
  padding: 0 16px 0 18px;
  justify-content: space-between;
  white-space: nowrap;
  overflow: hidden;
  z-index: 2;
  background: #000000;
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.48), 0 0 0 0.5px rgba(255, 255, 255, 0.12);
  touch-action: pan-y;
  user-select: none;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1) 0.12s;
}
/* 展开时：延迟 0.12s 待卡片骨架展开到一定宽度后再平滑淡入，避免过窄挤爆换行 */
.is-expanded .expanded-layer {
  opacity: 1;
  pointer-events: auto;
}
/* 收起时：立即极速淡出（0.10s），完全杜绝文字挤压与与胶囊重叠的闪烁 */
.is-compact .expanded-layer {
  opacity: 0;
  transform: scale(0.92);
  pointer-events: none;
  transition: opacity 0.10s ease-out, transform 0.22s ease-out;
}

.expanded-layer.is-swiping,
.island-subcard-front.is-swiping {
  transition: none !important;
}

.expanded-layer.has-swipe-transition,
.island-subcard-front.has-swipe-transition {
  transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
}

/* 底层滑动操作按钮（默认隐藏，滑动展开时显现） */
.island-swipe-actions {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 1;
  padding-right: 12px;
  gap: 10px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.island-swipe-actions.is-active {
  opacity: 1;
  pointer-events: auto;
  z-index: 1;
}

.island-action-btn {
  border: 0.5px solid rgba(255, 255, 255, 0.45);
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  max-width: 44px;
  max-height: 44px;
  border-radius: 50%;
  flex: none;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  padding: 0;
  box-sizing: border-box;
  will-change: transform, opacity;
}

.island-action-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

.island-action-btn svg,
.island-action-btn :deep(svg) {
  display: block;
  flex: none;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.island-btn-settings {
  color: #ffffff;
}

.island-btn-delete {
  color: #ffffff;
}

.island-btn-delete:active {
  color: #ff3b30;
}

/* ================= 展开态副卡片（多活动时独立呈现，尺寸同为主卡片） ================= */
.island-secondary-card {
  position: relative;
  margin-top: 10px;
  width: 100%;
  height: 80px;
  border-radius: 28px;
  background: transparent;
  color: #ffffff;
  box-shadow: none;
  padding: 0;
  box-sizing: border-box;
  cursor: pointer;
  pointer-events: auto;
  white-space: nowrap;
  overflow: visible;
  will-change: transform, opacity, border-radius;
}

.island-subcard-front {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 18px;
  white-space: nowrap;
  overflow: hidden;
  box-sizing: border-box;
  z-index: 2;
  background: #000000;
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.48), 0 0 0 0.5px rgba(255, 255, 255, 0.12);
  touch-action: pan-y;
  user-select: none;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.island-subcard-front.is-media-front {
  display: block;
  padding: 16px;
  white-space: normal;
}

.island-secondary-card:active {
  filter: brightness(1.12);
}

/* 副卡片平滑滑入滑出过渡：与主卡片完全同步从摄像头萌发与收回摄像头 */
.subcard-slide-enter-active {
  transform-origin: center center;
  transition:
    transform 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.32s cubic-bezier(0.32, 0.72, 0, 1),
    border-radius 0.38s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform, opacity, border-radius;
}

.subcard-slide-leave-active {
  position: absolute;
  left: 0;
  width: 100%;
  pointer-events: none;
  transform-origin: center center;
  transition:
    transform 0.38s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.28s cubic-bezier(0.32, 0.72, 0, 1) 0.05s,
    border-radius 0.38s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform, opacity, border-radius;
}

/* 萌发与收回位移：动态基于 --fly-up 飞入/飞出摄像头孔，缩放至 124px*30px 胶囊大小 */
.subcard-slide-enter-from,
.subcard-slide-leave-to {
  opacity: 0;
  transform: translateY(var(--fly-up, -115px)) scale(0.36, 0.375);
  border-radius: 15px;
}

.subcard-slide-enter-to,
.subcard-slide-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1, 1);
  border-radius: 28px;
}

/* 副卡片内部元素在收起时立即快速淡出（100ms），绝不闪屏 */
.subcard-slide-leave-active .ilc-left,
.subcard-slide-leave-active .ilc-actions {
  opacity: 0;
  transition: opacity 0.10s ease-out;
}

/* 副卡片内部元素在展开时在卡片展开到一定程度后再淡入（120ms后） */
.subcard-slide-enter-active .ilc-left,
.subcard-slide-enter-active .ilc-actions {
  transition: opacity 0.22s cubic-bezier(0.32, 0.72, 0, 1) 0.12s;
}
.subcard-slide-enter-from .ilc-left,
.subcard-slide-enter-from .ilc-actions {
  opacity: 0;
}

/* ================= 展开卡片内部公共视觉规范 ================= */
.ilc-left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

/* 44px 圆形图标衬底 */
.ilc-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.icon-alarm {
  background: transparent;
}

.compact-alarm-icon,
.alarm-activity-icon {
  fill: #ff9f0a;
}

.snooze-activity-icon {
  fill: #ffffff;
}

.icon-alarm.is-ringing svg {
  animation: alarmRingWiggle 1.4s ease-in-out infinite;
  transform-origin: center;
}

@keyframes alarmRingWiggle {
  0%, 100% { transform: rotate(0deg); }
  10% { transform: rotate(-10deg) scale(1.05); }
  20% { transform: rotate(10deg) scale(1.05); }
  30% { transform: rotate(-8deg) scale(1.03); }
  40% { transform: rotate(8deg) scale(1.03); }
  50% { transform: rotate(-3deg); }
  60% { transform: rotate(3deg); }
  70% { transform: rotate(0deg); }
}

.icon-timer,
.icon-stopwatch {
  background: rgba(255, 149, 0, 0.16);
}

.icon-prayer {
  background: rgba(0, 200, 83, 0.16);
}

.icon-recorder {
  background: rgba(235, 68, 54, 0.16);
}

/* 展开卡片左侧：声波跳动频谱（与录音原版设计及通知栏完全统一） */
.rc-expanded-left {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 44px;
  height: 44px;
}

.rc-audio-bars {
  display: flex;
  align-items: center;
  gap: 3.5px;
  height: 32px;
}

.rc-audio-bars .bar {
  display: inline-block;
  width: 3px;
  border-radius: 1.5px;
  background: #ffffff;
}

.rc-audio-bars .bar-1 { height: 16px; animation: rcAudioPulse 1.2s infinite alternate 0.1s; }
.rc-audio-bars .bar-2 { height: 10px; animation: rcAudioPulse 1.2s infinite alternate 0.3s; }
.rc-audio-bars .bar-3 { height: 22px; animation: rcAudioPulse 1.2s infinite alternate 0.15s; }
.rc-audio-bars .bar-main {
  width: 3.5px;
  height: 30px;
  background: #ff5238;
  animation: rcAudioPulseMain 0.9s infinite alternate 0.05s;
}
.rc-audio-bars .bar-5 { height: 12px; animation: rcAudioPulse 1.2s infinite alternate 0.4s; }
.rc-audio-bars .bar-6 { height: 6px; animation: rcAudioPulse 1.2s infinite alternate 0.2s; }
.rc-audio-bars .bar-7 { height: 4px; animation: rcAudioPulse 1.2s infinite alternate 0.5s; }

@keyframes rcAudioPulse {
  0% { transform: scaleY(0.45); opacity: 0.6; }
  100% { transform: scaleY(1.15); opacity: 1; }
}

@keyframes rcAudioPulseMain {
  0% { transform: scaleY(0.5); }
  100% { transform: scaleY(1.1); }
}

.ilc-time-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 14px;
  margin-right: 12px;
  min-width: 0;
}

.ilc-main-time {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  letter-spacing: -0.3px;
}

.ilc-sub-label {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif;
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 右侧控制按键组 */
.ilc-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

/* 42px 大圆操作按键 */
.ilc-btn {
  width: 42px;
  height: 42px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
  flex: none;
}

.ilc-btn svg {
  display: block;
  flex: none;
}

.ilc-btn:active {
  transform: scale(0.92);
}

.ilc-btn.btn-cancel,
.ilc-btn.btn-snooze,
.ilc-btn.btn-dismiss {
  background: #333336;
}

.ilc-btn.btn-cancel:hover,
.ilc-btn.btn-snooze:hover,
.ilc-btn.btn-dismiss:hover {
  background: #444448;
}

/* 高亮橙色主控按钮：纯白图标、4px发光投影 */
.ilc-btn.btn-playpause {
  background: #ff9500;
  box-shadow: 0 4px 14px rgba(255, 149, 0, 0.4);
}

.ilc-btn.btn-stop-record {
  background: #eb4436;
  box-shadow: 0 4px 14px rgba(235, 68, 54, 0.4);
}

.btn-stop-square {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: #ffffff;
}

/* 微型音乐胶囊图层 */
.media-mini-cover-wrap {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  overflow: hidden;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.media-mini-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.08);
}
.media-mini-wave {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 15px;
  width: 16px;
}
.media-mini-wave i {
  width: 2.2px;
  background: #30d158;
  border-radius: 999px;
  animation: miniWave 0.8s ease-in-out infinite;
}
.media-mini-wave i:nth-child(2) { animation-duration: 0.9s; animation-delay: 0.2s; }
.media-mini-wave i:nth-child(3) { animation-duration: 0.7s; animation-delay: 0.4s; }
.media-mini-wave i:nth-child(4) { animation-duration: 1.0s; animation-delay: 0.1s; }
.media-mini-wave.paused i {
  animation-play-state: paused;
  height: 3px !important;
}

@keyframes miniWave {
  0%, 100% { height: 25%; opacity: 0.8; }
  50% { height: 100%; opacity: 1; }
}

/* 展开态主卡片：音乐使用与通知中心完全一致的较高卡片尺寸 (164px, 32px 圆角) */
.island-card.is-expanded.is-media {
  height: 164px;
  border-radius: 32px;
}

/* 展开态主卡片音乐图层 */
.expanded-layer.is-media-layer {
  display: block;
  padding: 16px;
  white-space: normal;
}

/* 展开态副卡片：若为音乐，高度同样为 164px，圆角 32px */
.island-secondary-card.is-media-card {
  height: 164px;
  border-radius: 32px;
  padding: 0;
  display: block;
}

/* ================= OS16 规范模版卡片尺寸与动效 ================= */
.island-card.is-expanded.is-os16-progress,
.island-card.is-expanded.is-os16-nav,
.island-card.is-expanded.is-os16-media,
.island-card.is-expanded.is-os16-system-tip,
.island-card.is-expanded.is-os16-translation,
.island-card.is-expanded.is-os16-base-76,
.island-card.is-expanded.is-os16-base-74,
.island-card.is-expanded.is-os16-base-72 {
  width: 336px;
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.48), 0 0 0 0.5px rgba(255, 255, 255, 0.12);
  background: #000000;
}

.island-card.is-expanded.is-os16-progress {
  height: 122px;
}

.island-card.is-expanded.is-os16-nav {
  height: 168px;
}

.island-card.is-expanded.is-os16-media {
  height: 148px;
}

.island-card.is-expanded.is-os16-system-tip {
  height: 180px;
}

.island-card.is-expanded.is-os16-translation {
  height: 212px;
}

.island-card.is-expanded.is-os16-base-76 {
  height: 76px;
}

.island-card.is-expanded.is-os16-base-74 {
  height: 74px;
}

.island-card.is-expanded.is-os16-base-72 {
  height: 72px;
}

.expanded-layer.is-os16-layer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  background: transparent;
  border-radius: 28px;
  box-shadow: none;
  width: 100%;
  height: 100%;
}

.os16-mini-hifi-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.os16-mini-hifi-car {
  height: 13px;
  width: auto;
  object-fit: contain;
  display: block;
}

.os16-mini-hifi-cover {
  width: 17px;
  height: 17px;
  border-radius: 4px;
  object-fit: cover;
  display: block;
}

.os16-mini-hifi-tip {
  height: 16px;
  width: auto;
  border-radius: 3px;
  object-fit: contain;
  display: block;
}

.os16-time {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
</style>
