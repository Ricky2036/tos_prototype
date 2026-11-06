<script setup>
import '../../../styles/layer-transitions.css'
import { ref, computed, watch, nextTick } from 'vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import ListCell from '../../ui/ListCell.vue'
import LIcon from '../../ui/LIcon.vue'
import SplitActionCell from '../../ui/SplitActionCell.vue'
import AppNavBar from '../../ui/AppNavBar.vue'
import SettingsAppIcon from '../../ui/SettingsAppIcon.vue'
import NotificationIcon from '../../ui/NotificationIcon.vue'
import AppIcon from '../../ui/AppIcon.vue'
import NotifStatusBar from './notifications/NotifStatusBar.vue'
import NotifControlCenter from './notifications/NotifControlCenter.vue'
import NotifSmartText from './notifications/NotifSmartText.vue'
import NotifFloatStyleSheet from './notifications/NotifFloatStyleSheet.vue'
import SheetOptionPicker from '../../ui/SheetOptionPicker.vue'
import AnchorMenu from '../../ui/AnchorMenu.vue'
import NotifSceneAi from './notifications/NotifSceneAi.vue'
import NotifHomeBadge from './notifications/NotifHomeBadge.vue'
import { getApp } from '../../../config/apps'
import { seedNotifications } from '../../../config/seedNotifications'
import { useI18nStore } from '../../../stores/i18nStore'
import { useNotificationsStore, getIslandKeysForApp } from '../../../stores/notificationsStore'
import { useNotificationSettingsStore } from '../../../stores/notificationSettingsStore'
import { formatRelativeTime } from '../../../utils/timeFormat'
import { CLOCK_ICONS } from '../../apps/clock/clockIcons'
import { GLYPHS } from '../../../assets/icons/glyphs'

const i18n = useI18nStore()
const notificationsStore = useNotificationsStore()
const notifSettings = useNotificationSettingsStore()

const voicememosIconUrl = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/icons/voicememos.png`

/** 取「带参数的文案函数」。t() 在 key 缺失时会回退成 key 字符串，
    直接当函数调用会抛错，所以统一在这里兜底成一个安全的空实现 */
function tFn(key) {
  const v = i18n.t(key)
  return typeof v === 'function' ? v : () => ''
}

/* ---------- 子视图栈与灵动岛菜单高亮 ---------- */
const highlightedIslandKey = ref(null)
let highlightTimer = null

function triggerIslandHighlight(key) {
  if (!key) return
  let normalized = key
  if (typeof normalized === 'object' && normalized !== null) {
    normalized = normalized.key || normalized.type || normalized.id || ''
  }
  if (normalized === 'voicememos') normalized = 'recorder'
  if (normalized === 'music' || normalized === 'spotify') normalized = 'media'
  if (normalized === 'clock') normalized = 'alarm'

  if (highlightTimer) clearTimeout(highlightTimer)
  highlightedIslandKey.value = normalized

  nextTick(() => {
    const el = document.querySelector(`[data-island-key="${normalized}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })

  highlightTimer = setTimeout(() => {
    highlightedIslandKey.value = null
    notificationsStore.targetIslandKey = null
  }, 1800)
}

/* 通知应用列表（顶部置顶录音通知设置项，其余从 notificationsStore.list 读取，确保与通知中心通知完全一致） */
const notificationApps = computed(() => {
  const map = new Map()

  // 顶部置顶录音通知设置项
  const recorderItem = notificationsStore.list.find((item) => item.appId === 'recorder' || item.appId === 'voicememos')
  map.set('recorder', {
    id: 'recorder',
    appId: 'recorder',
    iconType: 'recorder',
    time: recorderItem ? recorderItem.time : Date.now()
  })

  for (const item of notificationsStore.list) {
    if (item.appId !== 'recorder' && item.appId !== 'voicememos' && !map.has(item.appId)) {
      map.set(item.appId, {
        id: item.appId,
        appId: item.appId,
        iconType: item.iconType || item.appId,
        time: item.time
      })
    }
  }
  if (map.size <= 1) {
    for (const item of seedNotifications()) {
      if (item.appId !== 'recorder' && item.appId !== 'voicememos' && !map.has(item.appId)) {
        map.set(item.appId, {
          id: item.appId,
          appId: item.appId,
          iconType: item.iconType || item.appId,
          time: item.time
        })
      }
    }
  }
  return Array.from(map.values())
})

function resolveApp(appId) {
  if (!appId) return notificationApps.value?.[0] || { id: 'recorder', appId: 'recorder', iconType: 'recorder', time: Date.now() }
  const found = notificationApps.value?.find(a => a.appId === appId || a.id === appId)
  if (found) return found
  return {
    id: appId,
    appId,
    iconType: appId,
    time: Date.now()
  }
}

const initialSubView = notificationsStore.targetSubView === 'dynamicBar'
  ? 'dynamicBar'
  : (notificationsStore.targetSubView === 'appDetail' ? 'appDetail' : 'main')
const pendingHighlightKey = ref(notificationsStore.targetIslandKey)

const selectedApp = ref(
  initialSubView === 'appDetail' && notificationsStore.targetAppId
    ? resolveApp(notificationsStore.targetAppId)
    : null
)

const subStack = ref(
  initialSubView === 'dynamicBar'
    ? ['main', 'dynamicBar']
    : (initialSubView === 'appDetail' ? ['main', 'appDetail'] : ['main'])
)

if (initialSubView === 'dynamicBar' || initialSubView === 'appDetail') {
  notificationsStore.setTargetView('notifications', null, null, null)
}

const subView = computed(() => subStack.value[subStack.value.length - 1] || 'main')
const isBack = ref(false)

if (pendingHighlightKey.value && initialSubView === 'dynamicBar') {
  nextTick(() => {
    triggerIslandHighlight(pendingHighlightKey.value)
  })
}

watch(
  () => [notificationsStore.targetSubView, notificationsStore.targetIslandKey, notificationsStore.targetAppId],
  ([newSub, newKey, newAppId]) => {
    if (newSub === 'dynamicBar') {
      isBack.value = false
      subStack.value = ['main', 'dynamicBar']
      const keyToHighlight = newKey || notificationsStore.targetIslandKey
      notificationsStore.setTargetView('notifications', null, null, null)
      if (keyToHighlight) {
        nextTick(() => {
          triggerIslandHighlight(keyToHighlight)
        })
      }
    } else if (newSub === 'appDetail') {
      isBack.value = false
      const targetApp = newAppId || notificationsStore.targetAppId
      selectedApp.value = resolveApp(targetApp)
      subStack.value = ['main', 'appDetail']
      notificationsStore.setTargetView('notifications', null, null, null)
    } else if (newKey && subView.value === 'dynamicBar') {
      nextTick(() => {
        triggerIslandHighlight(newKey)
      })
    }
  }
)

function go(v) {
  isBack.value = false
  subStack.value.push(v)
}
function back() {
  if (subStack.value.length > 1) {
    isBack.value = true
    subStack.value.pop()
    return true
  }
  return false
}
defineExpose({ back })

/* ---------- 状态 ---------- */
const globalHideLockContent = ref(false)
const localHideLockContent = ref(false)
const smartReminder = ref(true)
const adaptiveNotif = ref(true)
const lockScreenStyle = ref('stacked')
const onlyNewOnLock = ref(false)
const conciseFloating = ref(true)
const antiPeepFloating = ref(true)

function getAppState(id) {
  return notificationsStore.isAppNotificationEnabled(id)
}
function toggleAppState(id) {
  notificationsStore.toggleAppNotification(id)
}

/**
 * Dynamic Bar「系统服务」清单 —— 顺序与图标对齐真机 Infinix X6878（XOS 17）。
 * key 全部落在 notificationsStore.islandSettings（开关的单一来源）：
 * recorder / alarm / timer / stopwatch / prayer / media 六项有真实渲染逻辑；
 * 其余为真机新增项，先记录开关状态（新增键在 canShowIsland 里被视为允许，不影响既有行为）。
 */
const ISLAND_SERVICES = [
  // bg 全部来自真机截图取色（/tmp/ref/g6 采样），icon 优先复用仓里已有图标：
  // lucide=LIcon / clock=CLOCK_ICONS / glyph=GLYPHS / app=应用真实图标 PNG
  { key: 'aiPhoto', label: 'AI 修图', bg: 'linear-gradient(135deg, #8A82C6 0%, #6E96DC 100%)', lucide: 'wandSparkles' },
  { key: 'timer', label: '定时器', bg: '#2E67F5', clock: 'timer' },
  { key: 'screenRecord', label: '录屏', bg: '#EA7260', lucide: 'video' },
  { key: 'recorder', label: '录音', bg: '#EA7B49', lucide: 'audioLines' },
  { key: 'stopwatch', label: '秒表', bg: '#2E67F5', clock: 'stopwatch' },
  { key: 'alarm', label: '闹钟', bg: '#EB9335', clock: 'alarm' },
  { key: 'noiseCancel', label: '全场景降噪', bg: '#2E66F6', lucide: 'micVocal' },
  { key: 'guide', label: '全局引导', bg: '#F2C357', lucide: 'lightbulb' },
  { key: 'hotspot', label: '热点', bg: '#63C979', lucide: 'radioTower' },
  { key: 'flashlight', label: '手电筒', bg: '#F1B83F', lucide: 'flashlight' },
  { key: 'callSummaryWhatsapp', label: 'WhatsApp 通话摘要', bg: '#61C856', glyph: 'phone' },
  { key: 'callSummary', label: '系统通话摘要', bg: '#2E66F6', glyph: 'phone' },
  { key: 'verification', label: '应用验证码', bg: '#3A83F7', lucide: 'key' },
  { key: 'media', label: '音乐播放', bg: '#E83C3C', lucide: 'play', filled: true },
  { key: 'gameCountdown', label: '游戏倒计时', bg: '#61BDF4', lucide: 'grid2x2' },
  { key: 'importantDay', label: '重要日', bg: '#FFFFFF', light: true, lucide: 'calendarDays', color: '#FF3B30' },
  { key: 'videoGen', label: '视频生成', bg: '#7C6BF6', lucide: 'film' },
  { key: 'networkBoost', label: '网络加速', bg: '#5AC8FA', lucide: 'zap' },
  // 礼拜在真机这一版没出现在列表里，但灵动岛有对应模板，必须留一行给它的开关
  { key: 'prayer', label: '礼拜', bg: '#2E66F6', clock: 'muslim' }
]

/**
 * Dynamic Bar「实时活动」逐应用清单。
 * 真机是按当前有实时活动的应用动态列出；原型用固定几项近似。
 * 图标优先复用：能对上 NotificationIcon 类型（google / whatsapp …）就直接用真实应用图标。
 * 底色取自真机截图（/tmp/ref/g6/00_now.png）。
 */
const LIVE_ACTIVITY_APPS = [
  // 真机取色（/tmp/ref/g7/03_dynbar.png）：Google/Hi Translate/听歌识曲 都是白底应用图标，
  // 「更多服务」是 #8792A3 蓝灰底 + 白色四宫格。
  { key: 'googleMaps', label: 'Google Maps', subtitle: '导航服务', icon: 'mapPin', color: '#EA4335', bg: '#FFFFFF' },
  { key: 'hiTranslate', label: 'Hi Translate', subtitle: '实时翻译服务', icon: 'languages', color: '#FFFFFF', bg: '#2A64F6' },
  { key: 'songRecog', label: '听歌识曲', subtitle: '音乐识别服务', ring: true, bg: '#FFFFFF' }
]

const appLiveActivityStates = ref({})
function getAppLiveActivityState(id) {
  const islandKeys = getIslandKeysForApp(id)
  if (islandKeys.length > 0) {
    return islandKeys.some((k) => notificationsStore.islandSettings[k] !== false)
  }
  return appLiveActivityStates.value[id] !== false
}
function toggleAppLiveActivityState(id) {
  const islandKeys = getIslandKeysForApp(id)
  if (islandKeys.length > 0) {
    const next = !getAppLiveActivityState(id)
    for (const k of islandKeys) {
      notificationsStore.setIslandEnabled(k, next)
    }
    appLiveActivityStates.value[id] = next
    return
  }
  appLiveActivityStates.value[id] = !getAppLiveActivityState(id)
}

const currentDetailApp = computed(() => {
  return selectedApp.value || notificationApps.value?.[0] || { id: 'recorder', appId: 'recorder', iconType: 'recorder', time: Date.now() }
})

function openAppDetail(app) {
  selectedApp.value = app
  go('appDetail')
}

/* 悬浮通知样式 / 提醒强度 / 通知分组（真机：前两个是弹层，分组是贴行的小浮层） */
const showFloatStyleSheet = ref(false)
const showRemindLevelPicker = ref(false)
const showGroupingMenu = ref(false)

const FLOAT_STYLE_LABEL = { detailed: '详细', concise: '简洁' }
const REMIND_LEVELS = [
  { value: 'smart', label: '智能提醒', subtitle: '根据使用行为将不重要的通知自动设为静音' },
  { value: 'followApp', label: '跟随应用', subtitle: '按照应用默认方式提醒' },
  { value: 'silent', label: '静音', subtitle: '应用通知将无任何提醒' }
]
const REMIND_LABEL = { smart: '智能提醒', followApp: '跟随应用', silent: '静音' }
const GROUPING_OPTIONS = [
  { value: 'auto', label: '自动' },
  { value: 'byApp', label: '按应用' }
]
const GROUPING_LABEL = { auto: '自动', byApp: '按应用' }

const appToggles = ref({ allow: true, badge: true, floating: true, lockScreen: true, ring: true, vibrate: true })
function toggleAppSetting(key) { appToggles.value[key] = !appToggles.value[key] }

const emit = defineEmits(['back-to-settings'])
</script>

<template>
  <div class="notif-settings">
    <!-- ============ 主视图与子视图统一切换 ============ -->
    <Transition :name="isBack ? 'slide-back' : 'slide'">
      <!-- ============ 主页 ============ -->
      <div v-if="subView === 'main'" key="main" class="ns-page scrollable">
        <AppNavBar :title="i18n.t('notifications')" @back="emit('back-to-settings')" />

        <div class="cell-group mt-first">
          <ListCell :title="i18n.t('nsStatusBar')" chevron clickable @click="go('statusBar')" />
          <ListCell :title="i18n.t('nsControlCenter')" chevron clickable @click="go('controlCenter')" />
          <ListCell
            :title="i18n.t('nsDynamicBar')"
            subtitle="在状态栏等多场景提供实时信息、系统状态与智能服务。"
            chevron
            clickable
            last
            @click="go('dynamicBar')"
          />
        </div>

        <div class="group-header">{{ i18n.t('nsType') }}</div>
        <div class="ns-type-cards">
          <div class="ns-type-card" @click="go('lockScreen')">
            <div class="phone-mini">
              <span class="pm-time">09:26</span>
              <div class="pm-bars"><i class="pm-bg"></i><i class="pm-green"></i></div>
            </div>
            <span class="pm-label">{{ i18n.t('nsLockScreenNotif') }}</span>
          </div>
          <div class="ns-type-card" @click="go('floatingScreen')">
            <div class="phone-mini">
              <span class="pm-green pm-top"></span>
            </div>
            <span class="pm-label">{{ i18n.t('nsFloatingNotif') }}</span>
          </div>
          <div class="ns-type-card" @click="go('homeBadge')">
            <div class="phone-mini pm-grid-wrap">
              <div class="pm-grid">
                <i v-for="i in 16" :key="i" class="pm-cell" :class="{ badge: i === 3 }"></i>
              </div>
            </div>
            <span class="pm-label">
              {{ i18n.t('nsHomeBadge') }}
              <svg width="6" height="10" viewBox="0 0 7 12" fill="none">
                <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </div>
        </div>

        <div class="cell-group">
          <ListCell :title="i18n.t('nsHideLockContent')" :subtitle="i18n.t('nsHideLockContentSub')">
            <template #right><ToggleSwitch color="blue" v-model="globalHideLockContent" /></template>
          </ListCell>
          <ListCell :subtitle="i18n.t('nsSmartReminderSub')">
            <template #title>
              <div class="ns-row-title-wrap">
                <span class="lc-title">{{ i18n.t('nsSmartReminder') }}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" stroke-linecap="round"/>
                </svg>
              </div>
            </template>
            <template #right><ToggleSwitch color="blue" v-model="smartReminder" /></template>
          </ListCell>
          <ListCell :subtitle="i18n.t('nsAdaptiveNotifSub')" last>
            <template #title>
              <div class="ns-row-title-wrap">
                <span class="lc-title">{{ i18n.t('nsAdaptiveNotif') }}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" stroke-linecap="round"/>
                </svg>
              </div>
            </template>
            <template #right><ToggleSwitch color="blue" v-model="adaptiveNotif" /></template>
          </ListCell>
        </div>

        <div class="group-header">
          <span>{{ i18n.t('nsSortByTime') }}</span>
          <span class="ns-sort"><i></i><i></i></span>
        </div>
        <div class="cell-group">
          <SplitActionCell
            v-for="(app, index) in notificationApps"
            :key="app.id"
            :title="i18n.notifTitle(app.appId)"
            :subtitle="formatRelativeTime(app.time, i18n.t)"
            :model-value="getAppState(app.id)"
            :last="index === notificationApps.length - 1"
            switch-color="blue"
            @navigate="openAppDetail(app)"
            @update:modelValue="toggleAppState(app.id)"
          >
            <template #icon>
              <div class="ns-app-icon-wrap">
                <NotificationIcon :type="app.iconType" :size="38" />
              </div>
            </template>
          </SplitActionCell>
        </div>
      </div>

      <!-- ============ 锁屏通知子页 ============ -->
      <div v-else-if="subView === 'lockScreen'" key="lock" class="ns-page scrollable">
        <AppNavBar :title="i18n.t('nsLockScreenNotif')" @back="back()" />

        <div class="group-header mt-first">{{ i18n.t('nsLockStyle') }}</div>
        <div class="ns-style-cards">
          <div class="ns-style-card" :class="{ active: lockScreenStyle === 'stacked' }" @click="lockScreenStyle = 'stacked'">
            <div class="phone-big">
              <span class="pb-time">09:26</span>
              <div class="pb-bars"><i class="pb-bg"></i><i class="pb-green"></i></div>
            </div>
            <span class="pb-label">{{ i18n.t('nsStacked') }}</span>
            <span class="pb-radio" :class="{ on: lockScreenStyle === 'stacked' }"></span>
          </div>
          <div class="ns-style-card" :class="{ active: lockScreenStyle === 'number' }" @click="lockScreenStyle = 'number'">
            <div class="phone-big">
              <span class="pb-time">09:26</span>
              <span class="pb-count"><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>{{ tFn('nsCountBadge')(4) }}</span>
            </div>
            <span class="pb-label">{{ i18n.t('nsCount') }}</span>
            <span class="pb-radio" :class="{ on: lockScreenStyle === 'number' }"></span>
          </div>
        </div>

        <div class="cell-group">
          <ListCell :title="i18n.t('nsWakeOnNotif')" :subtitle="i18n.t('nsWakeOnNotifSub')" :value="i18n.t('nsEnabled')" />
          <ListCell :title="i18n.t('nsOnlyNewOnLock')" :subtitle="i18n.t('nsOnlyNewOnLockSub')" last>
            <template #right><ToggleSwitch color="blue" v-model="onlyNewOnLock" /></template>
          </ListCell>
        </div>

        <div class="group-header">{{ i18n.t('nsLockEnabledApps') }}</div>
        <div class="cell-group">
          <ListCell
            v-for="(app, index) in notificationApps"
            :key="app.id"
            :title="i18n.notifTitle(app.appId)"
            :last="index === notificationApps.length - 1"
          >
            <template #icon>
              <div class="ns-app-icon-wrap">
                <NotificationIcon :type="app.iconType" :size="38" />
              </div>
            </template>
            <template #right>
              <ToggleSwitch color="blue" :model-value="getAppState(app.id)" @update:modelValue="toggleAppState(app.id)" />
            </template>
          </ListCell>
        </div>
      </div>

      <!-- ============ 悬浮通知子页 ============ -->
      <div v-else-if="subView === 'floatingScreen'" key="float" class="ns-page scrollable">
        <AppNavBar :title="i18n.t('nsFloatingNotif')" @back="back()" />

        <div class="cell-group mt4">
          <ListCell
            :title="i18n.t('nsFloatingStyle')"
            :value="FLOAT_STYLE_LABEL[notifSettings.floatStyle] || '详细'"
            chevron
            clickable
            @click="showFloatStyleSheet = true"
          />
          <ListCell :title="i18n.t('nsConciseFullscreen')">
            <template #right><ToggleSwitch color="blue" v-model="conciseFloating" /></template>
          </ListCell>
          <ListCell :title="i18n.t('nsAntiPeep')" :subtitle="i18n.t('nsAntiPeepSub')" last>
            <template #right><ToggleSwitch color="blue" v-model="antiPeepFloating" /></template>
          </ListCell>
        </div>

        <div class="group-header">{{ i18n.t('nsFloatingEnabledApps') }}</div>
        <div class="cell-group">
          <ListCell
            v-for="(app, index) in notificationApps"
            :key="app.id"
            :title="i18n.notifTitle(app.appId)"
            :last="index === notificationApps.length - 1"
          >
            <template #icon>
              <div class="ns-app-icon-wrap">
                <NotificationIcon :type="app.iconType" :size="38" />
              </div>
            </template>
            <template #right>
              <div class="ns-app-right">
                <i class="ns-divider"></i>
                <ToggleSwitch color="blue" :model-value="getAppState(app.id)" @update:modelValue="toggleAppState(app.id)" />
              </div>
            </template>
          </ListCell>
        </div>
      </div>

      <!-- ============ 状态栏子页 ============ -->
      <NotifStatusBar v-else-if="subView === 'statusBar'" key="statusBar" @back="back()" />

      <!-- ============ 控制中心子页 ============ -->
      <NotifControlCenter v-else-if="subView === 'controlCenter'" key="controlCenter" @back="back()" />

      <!-- ============ 智慧文本 / 场景智能（四级） ============ -->
      <NotifSmartText v-else-if="subView === 'smartText'" key="smartText" @back="back()" />
      <NotifSceneAi v-else-if="subView === 'sceneAi'" key="sceneAi" @back="back()" />

      <!-- ============ 桌面角标子页 ============ -->
      <NotifHomeBadge
        v-else-if="subView === 'homeBadge'"
        key="homeBadge"
        :apps="notificationApps"
        @back="back()"
      />

      <!-- ============ Dynamic Bar 灵动岛子页 ============ -->
      <div v-else-if="subView === 'dynamicBar'" key="dynamicBar" class="ns-page scrollable">
        <AppNavBar :title="i18n.t('nsDynamicBar')" @back="back()" />

        <!-- 头图：手机 + 灵动岛 -->
        <div class="db-hero">
          <div class="db-figure">
            <div class="db-figure-phone">
              <span class="db-figure-hole"></span>
              <!-- 图标残影（真机上是虚化的） -->
              <span class="db-figure-blur"></span>
              <!-- 状态栏通知条（浅灰宽胶囊，左侧带小图标） -->
              <span class="db-figure-card">
                <span class="db-figure-card-icon"></span>
              </span>
              <!-- 展开后的灵动岛 -->
              <span class="db-figure-expand"></span>
              <!-- 点击/按压指示环 -->
              <span class="db-figure-tap"></span>
            </div>
          </div>
          <div class="db-hero-title">实时浏览重要信息</div>
          <div class="db-hero-caption">在状态栏、通知中心和锁屏查看实时活动与系统状态。</div>
          <div class="db-hero-dots"><i class="on"></i><i></i></div>
        </div>

        <div class="group-header">实时活动</div>
        <div class="cell-group">
          <ListCell
            v-for="(app, idx) in LIVE_ACTIVITY_APPS"
            :key="app.key"
            :title="app.label"
            :subtitle="app.subtitle"
          >
            <template #icon>
              <div class="db-live-icon" :class="{ 'has-ring': app.ring }" :style="{ background: app.bg }">
                <!-- 听歌识曲：白底 + 彩色声波圆环（真机就是这个形态） -->
                <span v-if="app.ring" class="song-ring"></span>
                <LIcon
                  v-else
                  :name="app.icon"
                  :size="20"
                  :stroke-width="2"
                  :style="{ color: app.color }"
                />
              </div>
            </template>
            <template #right>
              <ToggleSwitch
                :model-value="notifSettings.liveActivityApps[app.key]"
                color="blue"
                @update:model-value="v => notifSettings.setLiveActivity(app.key, v)"
              />
            </template>
          </ListCell>
          <ListCell title="更多服务" subtitle="更多支持实时更新通知的服务" last>
            <template #icon>
              <div class="db-live-icon" style="background: #8792A3">
                <LIcon name="grid2x2" :size="19" :stroke-width="2.2" style="color: #FFFFFF" />
              </div>
            </template>
            <template #right>
              <ToggleSwitch
                :model-value="notifSettings.liveActivityMore"
                color="blue"
                @update:model-value="v => notifSettings.setBool('liveActivityMore', v)"
              />
            </template>
          </ListCell>
        </div>

        <div class="group-header">智能服务</div>
        <div class="cell-group">
          <ListCell
            title="智慧文本"
            subtitle="复制文本后智能推荐相关服务。"
            :value="notificationsStore.islandSettings.smartText ? '已开启' : '已关闭'"
            chevron
            clickable
            @click="go('smartText')"
          />
          <ListCell
            title="场景智能"
            subtitle="根据使用场景智能推荐服务。"
            :value="notificationsStore.islandSettings.sceneSmart ? '已开启' : '已关闭'"
            chevron
            clickable
            last
            @click="go('sceneAi')"
          />
        </div>

        <div class="group-header">系统服务</div>
        <div class="cell-group">
          <ListCell
            v-for="(svc, idx) in ISLAND_SERVICES"
            :key="svc.key"
            :title="svc.label"
            :class="{ 'is-highlight-flash': highlightedIslandKey === svc.key }"
            :data-island-key="svc.key"
            :last="idx === ISLAND_SERVICES.length - 1"
          >
            <template #icon>
              <div class="db-app-icon" :class="{ 'is-light': svc.light }" :style="{ background: svc.bg }">
                <LIcon
                  v-if="svc.lucide"
                  :name="svc.lucide"
                  :size="17"
                  :stroke-width="2.1"
                  :filled="Boolean(svc.filled)"
                  :style="{ color: svc.color || '#FFFFFF' }"
                />
                <svg v-else-if="svc.clock" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path :d="CLOCK_ICONS[svc.clock]" fill="#FFFFFF" />
                </svg>
                <svg v-else-if="svc.glyph" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path :d="GLYPHS[svc.glyph]" fill="#FFFFFF" />
                </svg>
                <svg
                  v-else
                  width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="#FFFFFF" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"
                >
                  <path :d="svc.d" />
                </svg>
              </div>
            </template>
            <template #right>
              <ToggleSwitch color="blue"
                :model-value="notificationsStore.islandSettings[svc.key]"
                @update:modelValue="(val) => notificationsStore.setIslandEnabled(svc.key, val)"
              />
            </template>
          </ListCell>
        </div>

        <div class="cell-group db-more-group">
          <ListCell title="更多服务" subtitle="灵动岛将始终支持下列系统服务。" chevron clickable last />
        </div>

        <div class="bottom-spacer"></div>
      </div>

      <!-- ============ 应用详情子页 ============ -->
      <div v-else key="detail" class="ns-page scrollable">
        <AppNavBar :title="i18n.notifTitle(currentDetailApp.appId)" @back="back()" />

        <div class="ns-app-hero">
          <NotificationIcon :type="currentDetailApp.iconType" :size="64" />
          <h1 class="ns-hero-title">{{ i18n.notifTitle(currentDetailApp.appId) }}</h1>
        </div>

        <!-- 卡片 1：总开关（允许通知） -->
        <div class="cell-group">
          <ListCell :title="i18n.t('nsAllowNotif')" last>
            <template #right>
              <ToggleSwitch color="blue" :model-value="getAppState(currentDetailApp.id)" @update:modelValue="toggleAppState(currentDetailApp.id)" />
            </template>
          </ListCell>
        </div>

        <!-- 卡片 2：实时活动开关（单独一个卡片承载） -->
        <div v-if="getAppState(currentDetailApp.id)" class="cell-group">
          <ListCell :title="i18n.t('nsLiveActivitiesNotif')" :subtitle="i18n.t('nsLiveActivitiesNotifSub')" last>
            <template #right>
              <ToggleSwitch color="blue" :model-value="getAppLiveActivityState(currentDetailApp.id)" @update:modelValue="toggleAppLiveActivityState(currentDetailApp.id)" />
            </template>
          </ListCell>
        </div>

        <template v-if="getAppState(currentDetailApp.id)">
          <!-- 卡片 3：提醒强度与通知分组 -->
          <div class="cell-group allow-overflow">
            <ListCell
              :title="i18n.t('nsRemindLevel')"
              :value="REMIND_LABEL[notifSettings.remindLevelOf(currentDetailApp.id)] || '智能提醒'"
              chevron
              clickable
              @click="showRemindLevelPicker = true"
            />
            <div class="anchor-wrap">
              <ListCell
                :title="i18n.t('nsGrouping')"
                :value="GROUPING_LABEL[notifSettings.groupingOf(currentDetailApp.id)] || '自动'"
                chevron
                clickable
                :last="globalHideLockContent"
                @click="showGroupingMenu = !showGroupingMenu"
              />
              <AnchorMenu
                :visible="showGroupingMenu"
                :options="GROUPING_OPTIONS"
                :model-value="notifSettings.groupingOf(currentDetailApp.id)"
                @update:model-value="v => notifSettings.setGrouping(currentDetailApp.id, v)"
                @close="showGroupingMenu = false"
              />
            </div>
            <ListCell
              v-if="!globalHideLockContent"
              :title="i18n.t('nsHideLockContent')"
              :subtitle="i18n.t('nsHideLockContentSub')"
              last
            >
              <template #right><ToggleSwitch color="blue" v-model="localHideLockContent" /></template>
            </ListCell>
          </div>

          <div class="group-header">{{ i18n.t('nsRemindWays') }}</div>
          <div class="ns-style-cards remind">
            <div class="ns-remind-card" :class="{ on: appToggles.lockScreen }" @click="toggleAppSetting('lockScreen')">
              <div class="phone-mini"><span class="pm-time">09:26</span><div class="pm-bars"><i class="pm-bg"></i><i class="pm-green"></i></div></div>
              <span class="pm-label">{{ i18n.t('nsLockScreenNotif') }}</span>
              <span class="pm-check" :class="{ on: appToggles.lockScreen }"><svg v-if="appToggles.lockScreen" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
            </div>
            <div class="ns-remind-card" :class="{ on: appToggles.floating }" @click="toggleAppSetting('floating')">
              <div class="phone-mini"><span class="pm-green pm-top"></span></div>
              <span class="pm-label">{{ i18n.t('nsFloatingNotif') }}</span>
              <span class="pm-check" :class="{ on: appToggles.floating }"><svg v-if="appToggles.floating" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
            </div>
            <div class="ns-remind-card" :class="{ on: appToggles.badge }" @click="toggleAppSetting('badge')">
              <div class="phone-mini pm-grid-wrap"><div class="pm-grid"><i v-for="i in 16" :key="i" class="pm-cell" :class="{ badge: i === 3 }"></i></div></div>
              <span class="pm-label">{{ i18n.t('nsHomeBadge') }}</span>
              <span class="pm-check" :class="{ on: appToggles.badge }"><svg v-if="appToggles.badge" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
            </div>
          </div>

          <div class="cell-group">
            <ListCell :title="i18n.t('nsAllowRing')">
              <template #right><ToggleSwitch color="blue" v-model="appToggles.ring" /></template>
            </ListCell>
            <ListCell :title="i18n.t('nsVibrate')" last>
              <template #right><ToggleSwitch color="blue" v-model="appToggles.vibrate" /></template>
            </ListCell>
          </div>

          <div class="group-header">{{ i18n.t('nsType') }}</div>
          <div class="cell-group">
            <ListCell :title="i18n.t('nsMessageNotif')" :value="i18n.t('nsImportant')" last />
          </div>
        </template>
      </div>
    </Transition>

    <!-- 悬浮通知样式（真机：两张预览卡 + 取消） -->
    <NotifFloatStyleSheet
      :visible="showFloatStyleSheet"
      :model-value="notifSettings.floatStyle"
      @update:model-value="v => notifSettings.setFloatStyle(v)"
      @close="showFloatStyleSheet = false"
    />

    <!-- 提醒强度（真机：底部弹层，三条带说明的选项） -->
    <SheetOptionPicker
      :visible="showRemindLevelPicker"
      title="提醒强度"
      :options="REMIND_LEVELS"
      :model-value="currentDetailApp ? notifSettings.remindLevelOf(currentDetailApp.id) : 'smart'"
      @update:model-value="v => currentDetailApp && notifSettings.setRemindLevel(currentDetailApp.id, v)"
      @close="showRemindLevelPicker = false"
    />
  </div>
</template>

<style scoped>
.notif-settings {
  height: 100%;
  background: #F2F2F7;
  overflow: hidden;
}
.ns-page {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 28px;
}
.ns-page::-webkit-scrollbar { display: none; }
.ns-page { scrollbar-width: none; }

/* 分组卡片与标题：对齐 SettingsApp 系统规范 */
.cell-group {
  margin: 0 16px 22px;
  border-radius: var(--radius-cell-group, 16px);
  overflow: hidden;
  background: var(--bg-cell, #fff);
}
.group-header {
  font: var(--text-footnote, 400 13px/1.4 var(--font-stack));
  color: var(--label-secondary, #8e8e93);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 0 20px 7px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ns-sort { display: flex; flex-direction: column; gap: 2px; margin-left: 4px; }
.ns-sort i {
  width: 0; height: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
}
.ns-sort i:first-child { border-bottom: 4px solid #8e8e93; opacity: 0.6; }
.ns-sort i:last-child { border-top: 4px solid #8e8e93; opacity: 0.6; }

.mt4 { margin-top: 14px; }
.mt-first { margin-top: 14px; }

.ns-row-title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ns-app-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex: none;
}

.ns-app-right {
  display: flex;
  align-items: center;
}
.ns-divider {
  width: 1px;
  height: 24px;
  background: rgba(60, 60, 67, 0.12);
  margin-right: 16px;
  border-radius: 1px;
}

/* 通知类型三卡片：增加边距与内部留白，避免拥挤 */
.ns-type-cards {
  display: flex;
  gap: 16px;
  padding: 0 16px 16px;
}
.ns-type-card {
  flex: 1;
  background: #fff;
  border-radius: 20px;
  padding: 20px 12px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.12s ease;
}
.ns-type-card:active { transform: scale(0.96); background: #fafafa; }

/* 迷你手机预览 */
.phone-mini {
  width: 58px;
  height: 122px;
  border-radius: 14px;
  border: 3px solid #e5e5ea;
  background: #f8f9fa;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 14px;
}
.pm-time { font: 500 11px/1 var(--font-stack); color: #8e8e93; letter-spacing: 1px; margin-bottom: 10px; }
.pm-bars { position: absolute; bottom: 10px; display: flex; flex-direction: column; align-items: center; width: 100%; }
.pm-bg { position: absolute; bottom: -2.5px; width: 36px; height: 12px; background: #d1d1d6; border-radius: 3px; z-index: 0; }
.pm-green { position: relative; z-index: 1; width: 42px; height: 16px; background: #00D166; border-radius: 4px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15); }
.pm-top { position: absolute; top: 8px; }
.pm-grid-wrap { justify-content: center; padding-top: 10px; }
.pm-grid { display: grid; grid-template-columns: repeat(4, 8px); gap: 3px; align-content: start; }
.pm-cell { width: 8px; height: 8px; background: #e5e5ea; border-radius: 2.5px; position: relative; }
.pm-cell.badge::after {
  content: '';
  position: absolute;
  top: -1.5px; right: -1.5px;
  width: 4px; height: 4px;
  background: #FF453A;
  border-radius: 50%;
  border: 1px solid #fff;
}
.pm-label { font: 400 13px/1 var(--font-stack); color: #3a3a3c; }

/* 锁屏样式选择 */
.ns-style-cards {
  display: flex;
  justify-content: center;
  gap: 48px;
  background: #fff;
  margin: 0 16px 24px;
  border-radius: 22px;
  padding: 24px 16px 20px;
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.05);
}
.ns-style-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.phone-big {
  width: 76px;
  height: 160px;
  border-radius: 16px;
  border: 4px solid #e5e5ea;
  background: #f8f9fa;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 16px;
  transition: transform 0.12s ease;
}
.ns-style-card:active .phone-big { transform: scale(0.95); }
.pb-time { font: 500 12px/1 var(--font-stack); color: #8e8e93; letter-spacing: 1px; margin-bottom: 8px; }
.pb-bars { position: absolute; bottom: 14px; display: flex; flex-direction: column; align-items: center; width: 100%; }
.pb-bg { position: absolute; bottom: -2.5px; width: 44px; height: 12px; background: #d1d1d6; border-radius: 3px; z-index: 0; }
.pb-green { position: relative; z-index: 1; width: 52px; height: 18px; background: #00D166; border-radius: 4px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15); }
.pb-count {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #e5e5ea;
  padding: 3px 8px;
  border-radius: 999px;
  font: 500 9px/1 var(--font-stack);
  color: #3a3a3c;
  white-space: nowrap;
}
.pb-label { font: 500 14px/1 var(--font-stack); color: #3a3a3c; }
.pb-radio {
  width: 22px; height: 22px;
  border-radius: 50%;
  border: 2px solid #d1d1d6;
  position: relative;
  transition: border-color 0.2s;
}
.pb-radio.on { border-color: #007AFF; }
.pb-radio.on::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  width: 12px; height: 12px;
  background: #007AFF;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
.ns-style-card.active .pb-label { color: #007AFF; }

/* 提醒方式三卡片 */
.ns-style-cards.remind { gap: 16px; padding: 20px 12px 18px; }
.ns-remind-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.ns-remind-card:active .phone-mini { transform: scale(0.95); }
.pm-check {
  width: 22px; height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.pm-check.on { background: #007AFF; }
.pm-check:not(.on) { border: 2px solid #d1d1d6; }

/* 应用详情 */
.ns-app-hero { display: flex; flex-direction: column; align-items: center; gap: 10px; margin: 24px 0 26px; }
.ns-hero-title { font: 600 20px/1 var(--font-stack); color: #1c1c1e; letter-spacing: 0.3px; }

/* Dynamic Bar 专属行与图标 */
.db-row {
  min-height: 56px;
  padding: 8px 16px;
}
.db-item-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}
.db-app-icon.is-light {
  border: 0.5px solid rgba(0, 0, 0, 0.08);
}

.db-app-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  overflow: hidden;
  box-shadow: 0 1px 2.5px rgba(0, 0, 0, 0.12);
  margin-right: 14px;
}
.db-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.db-icon-recorder {
  background: linear-gradient(135deg, #FF453A 0%, #D70015 100%);
}
.db-icon-alarm {
  background: linear-gradient(135deg, #FF9500 0%, #E65100 100%);
}
.db-icon-timer {
  background: linear-gradient(135deg, #FF9F0A 0%, #FF6D00 100%);
}
.db-icon-stopwatch {
  background: linear-gradient(135deg, #0A84FF 0%, #0056D2 100%);
}
.db-icon-prayer {
  background: linear-gradient(135deg, #00C853 0%, #00897B 100%);
}
.db-icon-media {
  background: linear-gradient(135deg, #FF2D55 0%, #E11D48 100%);
}

/* 灵动岛菜单项高亮闪动动画（闪动 3 次恢复正常：从描边改为 30% 透明度填充） */
@keyframes island-cell-flash {
  0%, 100% {
    background-color: var(--bg-cell, #ffffff);
  }
  50% {
    background-color: rgba(0, 122, 255, 0.30);
  }
}

:deep(.list-cell.is-highlight-flash),
.is-highlight-flash {
  animation: island-cell-flash 0.6s ease-in-out 3 !important;
  border-radius: 12px;
}
.anchor-wrap {
  position: relative;
  z-index: 30;
}

/* 承载下拉浮层的卡片不能裁切，否则浮层会被切掉一半 */
.cell-group.allow-overflow {
  overflow: visible;
}

/* Dynamic Bar 头图 */
.db-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 0 18px;
}

/* 头图只露手机上半部：容器裁切，机器本身画满整高（真机截图就是这个效果） */
.db-figure {
  width: 100%;
  height: 246px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* 真机只露手机上半部：机身画满整高，底部被容器裁掉 */
.db-figure-phone {
  position: relative;
  width: 204px;
  height: 437px;
  border-radius: 30px;
  border: 1.6px solid #C7C7CC;
  background: #FAFAFB;
  box-sizing: border-box;
  flex: none;
}

.db-figure-hole {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1C1C1E;
}

/* 通知条上方那团被虚化的图标残影 */
.db-figure-blur {
  position: absolute;
  top: 88px;
  left: 50%;
  transform: translateX(-50%);
  width: 168px;
  height: 54px;
  border-radius: 14px;
  background: linear-gradient(100deg, #E6EDF8 0%, #F3EEFA 60%, #EAF3F7 100%);
  filter: blur(7px);
  opacity: 0.95;
}

.db-figure-card {
  position: absolute;
  top: 146px;
  left: 50%;
  transform: translateX(-50%);
  width: 190px;
  height: 34px;
  border-radius: 12px;
  background: #F1F1F3;
  display: flex;
  align-items: center;
  padding-left: 11px;
  box-sizing: border-box;
}

.db-figure-card-icon {
  width: 17px;
  height: 17px;
  border-radius: 5px;
  background: #DCE3F0;
}

.db-figure-expand {
  position: absolute;
  top: 172px;
  left: 50%;
  transform: translateX(-50%);
  width: 42px;
  height: 56px;
  border-radius: 14px;
  background: #6E6E73;
  z-index: 2;
}

.db-figure-tap {
  position: absolute;
  top: 178px;
  left: 54%;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px #8E8E93 inset;
  z-index: 3;
}

/* 实时活动：真实应用图标 + 真机底色 */
.db-live-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  overflow: hidden;
  border: 0.5px solid rgba(0, 0, 0, 0.06);
}

/* 听歌识曲：白底 + 彩色声波圆环 */
.db-live-icon.has-ring {
  border-color: rgba(0, 0, 0, 0.08);
}

.song-ring {
  width: 23px;
  height: 23px;
  border-radius: 50%;
  background: conic-gradient(from 200deg, #7FD0E8 0deg, #E8A0B4 120deg, #C6A8E8 240deg, #7FD0E8 360deg);
  -webkit-mask: radial-gradient(circle, transparent 0 44%, #000 45% 100%);
  mask: radial-gradient(circle, transparent 0 44%, #000 45% 100%);
  position: relative;
}

.song-ring::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #A9A2B3;
}

.db-hero-title {
  margin-top: 16px;
  font-size: 17px;
  font-weight: 700;
  color: #111;
}

.db-hero-caption {
  margin-top: 8px;
  font-size: 13px;
  line-height: 19px;
  color: #8E8E93;
  text-align: center;
  padding: 0 28px;
}

.db-hero-dots {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.db-hero-dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #D1D1D6;
}

.db-hero-dots i.on {
  background: #6E6E73;
}

.db-more-group {
  margin-top: 12px;
}

.ns-card-footer {
  font: 400 13px/1.4 var(--font-stack);
  color: #8E8E93;
  padding: 0 20px 24px;
}
</style>
