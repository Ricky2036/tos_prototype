<script setup>
import { computed, ref, watch } from 'vue'
import { useControlStore } from '../../../stores/controlStore'
import { useClock } from '../../../composables/useClock'
import { useBackHandler } from '../../../composables/backRegistry'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import AppNavBar from '../../ui/AppNavBar.vue'
import GlassNavBar from '../../ui/GlassNavBar.vue'
import { SETTINGS_TITLES } from '../../../config/settingsTitles'
import SettingsSearchDock from '../../ui/SettingsSearchDock.vue'
import SettingsSystemIcon from '../../ui/SettingsSystemIcon.vue'
import SettingsNotifications from './SettingsNotifications.vue'
import SettingsSound from './SettingsSound.vue'
import SettingsDisplay from './SettingsDisplay.vue'
import SettingsDND from './SettingsDND.vue'
import SettingsPrayer from './SettingsPrayer.vue'
import SettingsPersonalization from './personalization/SettingsPersonalization.vue'
import SettingsAccount from './SettingsAccount.vue'
import SettingsAccountLogin from './SettingsAccountLogin.vue'
import SettingsAccountSecurity from './SettingsAccountSecurity.vue'
import SettingsWallet from './SettingsWallet.vue'
import SettingsSearch from './SettingsSearch.vue'
import SettingsCloudHome from './SettingsCloudHome.vue'
import SettingsCloudBackup from './SettingsCloudBackup.vue'
import SettingsAboutPhone from './SettingsAboutPhone.vue'
import SettingsSim from './SettingsSim.vue'
import SettingsWifi from './SettingsWifi.vue'
import SettingsBluetooth from './SettingsBluetooth.vue'
import SettingsSatellite from './SettingsSatellite.vue'
import DigitalHealthApp from './digitalhealth/DigitalHealthApp.vue'
import DhParental from './digitalhealth/DhParental.vue'
import SettingsMultiDevice from './SettingsMultiDevice.vue'
import SettingsHotspot from './SettingsHotspot.vue'
import SettingsNfc from './SettingsNfc.vue'
import SettingsInfinixAI from './SettingsInfinixAI.vue'
import SettingsModes from './SettingsModes.vue'
import SettingsFocus from './focus/SettingsFocus.vue'
import LIcon from '../../ui/LIcon.vue'
import SettingsSecurity from './SettingsSecurity.vue'
import SettingsPrivacy from './SettingsPrivacy.vue'
import SettingsAppsManage from './SettingsAppsManage.vue'
import SettingsLocation from './SettingsLocation.vue'
import SettingsAccessibility from './SettingsAccessibility.vue'
import SettingsOneTap from './SettingsOneTap.vue'
import SettingsBattery from './SettingsBattery.vue'
import SettingsStorage from './SettingsStorage.vue'
import { usePrayerStore } from '../../../stores/prayerStore'
import { useNotificationsStore } from '../../../stores/notificationsStore'
import { useSystemStore } from '../../../stores/systemStore'
import { useI18nStore } from '../../../stores/i18nStore'
import { useAccountStore } from '../../../stores/accountStore'
import { useDeviceStore } from '../../../stores/deviceStore'
import { useNetworkStore } from '../../../stores/networkStore'
import { GLYPHS } from '../../../assets/icons/glyphs'
import accountAvatar from '../../../assets/img/account-avatar.jpg'
import { clamp } from '../../../utils/math'
import LargeTitleHeader from '../../ui/LargeTitleHeader.vue'
import { useLargeTitle } from '../../../composables/useLargeTitle'

/**
 * 设置：8组规范卡片 + 底部悬浮搜索控件 + 二级页完整导航。
 * 完全对齐 Infinix GT 50 Pro 最新录屏分组、文案、字号层级与圆角规范。
 */
const props = defineProps({ app: Object })
const control = useControlStore()
const prayerStore = usePrayerStore()
const notificationsStore = useNotificationsStore()
const system = useSystemStore()
const i18n = useI18nStore()
const accountStore = useAccountStore()
const deviceStore = useDeviceStore()
const network = useNetworkStore()
const { timeShort } = useClock()

/* 内部导航栈：支持从礼拜卡片、通知灵动岛、账号引导通知、电话设置等直接深链跳转 */
let initialStack = ['main']
if (prayerStore.targetView === 'prayer') {
  initialStack = ['main', 'sound', 'prayer']
  prayerStore.setTargetView('main')
} else if (notificationsStore.targetView === 'notifications') {
  initialStack = ['main', 'notifications']
} else if (notificationsStore.targetView === 'account') {
  initialStack = ['main', 'account']
  notificationsStore.targetView = null
} else if (notificationsStore.targetView === 'accountLogin') {
  initialStack = ['main', 'accountLogin']
  notificationsStore.targetView = null
} else if (notificationsStore.targetView) {
  initialStack = ['main', notificationsStore.targetView]
  notificationsStore.targetView = null
}
const stack = ref(initialStack)
const view = computed(() => stack.value[stack.value.length - 1])
const isBack = ref(false)

watch(
  () => prayerStore.targetView,
  (newTarget) => {
    if (newTarget === 'prayer') {
      isBack.value = false
      stack.value = ['main', 'sound', 'prayer']
      prayerStore.setTargetView('main')
    }
  }
)

watch(
  () => notificationsStore.targetView,
  (newTarget) => {
    if (!newTarget) return
    isBack.value = false
    if (newTarget === 'notifications') {
      stack.value = ['main', 'notifications']
    } else if (newTarget === 'account') {
      stack.value = ['main', 'account']
      notificationsStore.targetView = null
    } else if (newTarget === 'accountLogin') {
      stack.value = ['main', 'accountLogin']
      notificationsStore.targetView = null
    } else {
      stack.value = ['main', newTarget]
      notificationsStore.targetView = null
    }
  }
)

const placeholderTitle = ref('')
function pushUnimplemented(name) {
  placeholderTitle.value = name
  push('placeholder')
}

function push(v) {
  if (stack.value[stack.value.length - 1] === v) return
  isBack.value = false
  stack.value.push(v)
}
function pop() {
  if (stack.value.length > 1) {
    isBack.value = true
    stack.value.pop()
  }
}

/* 全局侧滑返回：子页 → 首页逐层消费 */
const notifRef = ref(null)
const dndRef = ref(null)
const focusRef = ref(null)
const prayerRef = ref(null)
const personalizationRef = ref(null)
const aboutPhoneRef = ref(null)
const simRef = ref(null)
const wifiRef = ref(null)
const bluetoothRef = ref(null)
const satelliteRef = ref(null)
const multiDeviceRef = ref(null)
const hotspotRef = ref(null)
const nfcRef = ref(null)
const aiRef = ref(null)
const securityRef = ref(null)
const privacyRef = ref(null)
const appsManageRef = ref(null)
const locationRef = ref(null)
const accessibilityRef = ref(null)
const oneTapRef = ref(null)
const batteryRef = ref(null)
const storageRef = ref(null)
const displayRef = ref(null)
const soundRef = ref(null)
const dhRef = ref(null)
useBackHandler(() => {
  if (view.value === 'about' && aboutPhoneRef.value?.back?.()) return true
  if (view.value === 'sim' && simRef.value?.back?.()) return true
  if (view.value === 'wifi' && wifiRef.value?.back?.()) return true
  if (view.value === 'bluetooth' && bluetoothRef.value?.back?.()) return true
  if (view.value === 'satellite' && satelliteRef.value?.back?.()) return true
  if (view.value === 'multiDevice' && multiDeviceRef.value?.back?.()) return true
  if (view.value === 'hotspot' && hotspotRef.value?.back?.()) return true
  if (view.value === 'nfc' && nfcRef.value?.back?.()) return true
  if (view.value === 'infinixAi' && aiRef.value?.back?.()) return true
  if (view.value === 'security' && securityRef.value?.back?.()) return true
  if (view.value === 'privacy' && privacyRef.value?.back?.()) return true
  if (view.value === 'appsManage' && appsManageRef.value?.back?.()) return true
  if (view.value === 'location' && locationRef.value?.back?.()) return true
  if (view.value === 'dnd' && dndRef.value?.back?.()) return true
  if (view.value === 'focus' && focusRef.value?.back?.()) return true
  if (view.value === 'accessibility' && accessibilityRef.value?.back?.()) return true
  if (view.value === 'display' && displayRef.value?.back?.()) return true
  if (view.value === 'sound' && soundRef.value?.back?.()) return true
  if (view.value === 'oneTap' && oneTapRef.value?.back?.()) return true
  if (view.value === 'battery' && batteryRef.value?.back?.()) return true
  if (view.value === 'storage' && storageRef.value?.back?.()) return true
  if (view.value === 'digitalHealth' && dhRef.value?.back?.()) return true
  if (view.value === 'personalization' && personalizationRef.value?.back()) return true
  if (view.value === 'prayer' && prayerRef.value?.back()) return true
  if (view.value === 'notifications' && notifRef.value?.back()) return true
  if (stack.value.length > 1) { pop(); return true }
  return false
})

function handleDisplayNavigate(target) {
  if (target === 'personalization') {
    push('personalization')
  } else if (target === 'language') {
    push('language')
  } else {
    pushUnimplemented(target)
  }
}

const viewTitles = computed(() => ({
  wifi: i18n.t('wifi') || 'WLAN',
  display: i18n.t('displayAndBrightness') || '显示与亮度',
  general: '系统',
  language: '语言与输入法',
  navigation: '系统导航方式',
  notifications: SETTINGS_TITLES.notifications,
  sound: i18n.t('soundAndVibration') || '声音与振动',
  dnd: SETTINGS_TITLES.dnd,
  focus: '专注模式',
  prayer: SETTINGS_TITLES.prayer,
  personalization: '主题与个性化',
  about: '我的手机',
  sim: 'SIM 卡与网络设置',
  bluetooth: '蓝牙',
  satellite: '星链卫星网络',
  multiDevice: '多设备连接',
  hotspot: '个人热点',
  nfc: 'NFC',
  infinixAi: 'Infinix AI',
  modes: '模式和日常程序',
  security: '密码与安全',
  privacy: '权限与隐私',
  appsManage: '应用管理',
  location: '位置信息',
  accessibility: '辅助功能',
  oneTap: 'One-Tap Button',
  battery: '电池与省电',
  storage: '存储',
  account: 'Infinix ID',
  accountLogin: 'INFINIX ID',
  accountSecurity: '账号安全',
  cloudHome: '云服务',
  cloudBackup: '云备份',
  wallet: '卡包',
  search: '搜索',
  placeholder: placeholderTitle.value || '设置'
}))

const networks = ['Ricky_5G', 'Office_5G', 'Tencent-Guest', 'CoffeeLab_2.4G']

/* 搜索功能 */
const searchQuery = ref('')
const searchActive = ref(false)
/* 大标题折叠：走通用件（曲线常量在 composables/useLargeTitle.js，全仓唯一来源）。
   ⚠️ 必须**解构出 ref** 再传给模板 —— `<script setup>` 只自动解包顶层 ref；
   若保留 `const lt = useLargeTitle()` 再写 `:progress="lt.progress"`，传下去的是
   ComputedRef 本身，会静默退化成恒 0（且不报错，2026-10-12 踩过）。
   ⚠️ 也别在本页复写折叠曲线 —— 会让设置页与相册页的手感漂开。 */
const { progress: titleProgress, onScroll: onTitleScroll } = useLargeTitle()

const allSearchableItems = [
  { id: 'about', title: '我的手机', group: '系统', value: 'Infinix NOTE 60 Pro', action: () => push('about') },
  { id: 'aboutDevice', title: '关于手机', group: '系统', value: 'Infinix NOTE 60 Pro', action: () => push('about') },
  { id: 'deviceModel', title: 'Infinix NOTE 60 Pro', group: '系统', action: () => push('about') },
  { id: 'flight', title: '飞行模式', group: '网络与连接', action: () => {}, isToggle: true },
  { id: 'sim', title: 'SIM 卡与网络设置', group: '网络与连接', action: () => push('sim') },
  { id: 'wifi', title: 'WLAN', group: '网络与连接', value: 'Transsion_Mobile', action: () => push('wifi') },
  { id: 'bluetooth', title: '蓝牙', group: '网络与连接', action: () => push('bluetooth') },
  { id: 'satellite', title: '星链卫星网络', group: '网络与连接', action: () => push('satellite') },
  { id: 'satelliteAlt', title: '卫星网络', group: '网络与连接', action: () => push('satellite') },
  { id: 'multiDevice', title: '多设备连接', group: '网络与连接', action: () => push('multiDevice') },
  { id: 'oneleap', title: '多屏互联 (OneLeap)', group: '网络与连接', action: () => system.openApp('oneleap') },
  { id: 'hotspot', title: '个人热点', group: '网络与连接', action: () => push('hotspot') },
  { id: 'nfc', title: 'NFC', group: '网络与连接', action: () => push('nfc') },
  { id: 'infinixAi', title: 'Infinix AI', group: '特色功能', action: () => push('infinixAi') },
  { id: 'systemFocus', title: '专注模式', group: '特色功能', action: () => push('focus') },
  { id: 'modes', title: '模式和日常程序', group: '特色功能', action: () => push('modes') },
  { id: 'modesSleep', title: '睡眠模式', group: '模式和日常程序', action: () => push('modes') },
  { id: 'modesTheater', title: '影院模式', group: '模式和日常程序', action: () => push('modes') },
  { id: 'modesDriving', title: '驾驶模式', group: '模式和日常程序', action: () => push('modes') },
  { id: 'modesWork', title: '工作模式', group: '模式和日常程序', action: () => push('modes') },
  { id: 'modesRoutines', title: '日常程序', group: '模式和日常程序', action: () => push('modes') },
  { id: 'folaxVoice', title: 'Fola语音', group: 'Infinix AI', action: () => push('infinixAi') },
  { id: 'folaxScreen', title: 'Fola识屏', group: 'Infinix AI', action: () => push('infinixAi') },
  { id: 'folaHome', title: 'Fola 之家', group: 'Infinix AI', action: () => push('infinixAi') },
  { id: 'circleSearch', title: '圈定即搜', group: 'Infinix AI', action: () => push('infinixAi') },
  { id: 'aiCall', title: 'AI通话助手', group: 'Infinix AI', action: () => push('infinixAi') },
  { id: 'wallpaper', title: SETTINGS_TITLES.personalization, group: '个性化', action: () => push('personalization') },
  { id: 'display', title: '显示与亮度', group: '显示', action: () => push('display') },
  { id: 'sound', title: '声音与振动', group: '声音', action: () => push('sound') },
  { id: 'notifications', title: '通知与状态栏', group: '通知', action: () => push('notifications') },
  { id: 'security', title: '密码与安全', group: '安全与隐私', action: () => push('security') },
  { id: 'lockScreenPwd', title: '锁屏密码', group: '安全与隐私', action: () => push('security') },
  { id: 'fingerprint', title: '指纹识别', group: '安全与隐私', action: () => push('security') },
  { id: 'faceUnlock', title: '面部识别', group: '安全与隐私', action: () => push('security') },
  { id: 'privacy', title: '权限与隐私', group: '安全与隐私', action: () => push('privacy') },
  { id: 'xhide', title: 'XHide', group: '安全与隐私', action: () => push('privacy') },
  { id: 'appLock', title: '应用锁', group: '安全与隐私', action: () => push('privacy') },
  { id: 'appManage', title: '应用管理', group: '应用', action: () => push('appsManage') },
  { id: 'appClone', title: '应用双开', group: '应用', action: () => push('appsManage') },
  { id: 'defaultApps', title: '默认应用', group: '应用', action: () => push('appsManage') },
  { id: 'location', title: '位置信息', group: '安全与隐私', action: () => push('location') },
  { id: 'accessibility', title: '辅助功能', group: '系统', action: () => push('accessibility') },
  { id: 'oneTap', title: 'One-Tap Button', group: '系统', action: () => push('oneTap') },
  { id: 'actionButton', title: '实体动作键', group: '系统', action: () => push('oneTap') },
  { id: 'battery', title: '电池与省电', group: '电量', action: () => push('battery') },
  { id: 'batteryHealth', title: '电池健康', group: '电量', action: () => push('battery') },
  { id: 'storage', title: '存储', group: '系统', action: () => push('storage') },
  { id: 'cleanStorage', title: '存储清理', group: '系统', action: () => push('storage') },
  { id: 'gtZone', title: 'GT Zone', group: '特色功能', action: () => push('oneTap') },
  { id: 'wallet', title: '钱包', group: '特色功能', action: () => push('wallet') },
  { id: 'digitalHealth', title: '数字健康', group: '数字健康', action: () => push('digitalHealth') },
  { id: 'parental', title: '家长控制', group: '数字健康', action: () => push('parental') },
  { id: 'appTimer', title: '应用定时器', group: '数字健康', action: () => push('digitalHealth') },
  { id: 'sleepMode', title: '睡眠模式', group: '数字健康', action: () => push('digitalHealth') },
  { id: 'focusMode', title: '专注模式', group: '数字健康', action: () => push('digitalHealth') },
  { id: 'walkingReminder', title: '看路提醒', group: '数字健康', action: () => push('digitalHealth') },
  { id: 'familyLink', title: 'Google Family Link', group: '数字健康', action: () => push('parental') },
  { id: 'emergency', title: '安全和紧急情况', group: '安全', action: () => pushUnimplemented('安全和紧急情况') },
  { id: 'account', title: '用户与账号', group: '账号', action: () => push('account') },
  { id: 'cloudHome', title: '云服务（Infinix Cloud）', group: '账号', action: () => push('cloudHome') },
  { id: 'cloudBackup', title: '云备份', group: '账号', action: () => push('cloudBackup') },
  { id: 'appleAccount', title: 'Apple 账户', group: '账号', action: () => push('account') },
  { id: 'infinixId', title: 'Infinix ID', group: '账号', action: () => push('account') },
  { id: 'google', title: 'Google', group: '服务', action: () => pushUnimplemented('Google') },
  { id: 'system', title: '系统', group: '系统', action: () => push('general') },
  { id: 'generalSettings', title: '通用', group: '系统', action: () => push('general') },
  { id: 'language', title: '系统语言与输入法', group: '系统', action: () => push('language') },
  { id: 'navigation', title: '系统导航方式', group: '系统', action: () => push('navigation') },
  { id: 'dns', title: '专用 DNS', group: '网络与连接', action: () => pushUnimplemented('专用 DNS') },
  { id: 'dateTime', title: '日期与时间', group: '系统', action: () => pushUnimplemented('日期与时间') },
  { id: 'screenTime', title: '屏幕使用时间', group: '数字健康', action: () => push('digitalHealth') },
  { id: 'lockScreen', title: '锁屏设置', group: '个性化', action: () => push('personalization') },
  { id: 'smallWindow', title: '小窗模式', group: '特色功能', action: () => pushUnimplemented('小窗模式') },
  { id: 'darkMode', title: '深色主题（黑夜模式）', group: '显示', action: () => push('display') }
]

function handleSearchNavigate(item) {
  if (typeof item?.action === 'function') {
    item.action()
  }
}

</script>

<template>
  <div class="settings-app">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- ================= 首页 ================= -->
      <div v-if="view === 'main'" key="main" class="settings-page">
        <div class="settings-scroll-container scrollable" @scroll.passive="onTitleScroll">
          <!-- 顶部大标题（通用件：sticky + 随滚动折叠 + 底色底幕挡住穿过底部的内容） -->
          <LargeTitleHeader title="设置" :progress="titleProgress" />

          <!-- 首页胶囊点击即进搜索页（真机行为）：这里不再保留内联搜索结果与空态，
               否则会出现第二套空态（旧的 40px 线性放大镜 +「未找到相关设置」）。
               ⚠️ 卡片直接挂在滚动容器下，不要再套 <template>：裸 <template> Vue 不认作片段包裹，
                  会变成惰性原生元素，卡片全渲染成 0 高度（实测踩过）。 -->
            <!-- ================= 卡片 1: 个人账号卡 ================= -->
            <div class="settings-card account-card" @click="accountStore.isLoggedIn ? push('account') : push('accountLogin')">
              <div class="account-avatar">
                <img class="account-avatar-img" :src="accountStore.avatar" alt="Ricky" />
              </div>
              <div class="account-info">
                <div class="account-name">{{ accountStore.isLoggedIn ? accountStore.username : '登录 Infinix ID' }}</div>
                <div class="account-sub">使用云服务、查找等</div>
              </div>
              <svg class="lc-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>

            <!-- ================= 卡片 2: 手机型号卡 (Infinix NOTE 60 Pro / 兼容 Infinix GT 50 Pro) ================= -->
            <div class="settings-card">
              <ListCell :title="deviceStore.deviceName || 'Infinix NOTE 60 Pro'" chevron last @click="push('about')">
                <template #icon>
                  <div class="squircle-icon bg-device">
                    <SettingsSystemIcon name="device" :size="20" />
                  </div>
                </template>
              </ListCell>
            </div>

            <!-- ================= 卡片 3: 网络与连接 (6项) ================= -->
            <div class="settings-card">
              <!-- 飞行模式 -->
              <ListCell title="飞行模式">
                <template #icon>
                  <div class="squircle-icon bg-airplane">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                      <path :d="GLYPHS.airplane" />
                    </svg>
                  </div>
                </template>
                <template #right>
                  <ToggleSwitch
                    :model-value="control.airplane"
                    @update:model-value="v => network.setAirplaneMode(v)"
                  />
                </template>
              </ListCell>

              <!-- SIM卡与网络设置 -->
              <ListCell title="SIM 卡与网络设置" chevron @click="push('sim')">
                <template #icon>
                  <div class="squircle-icon bg-sim">
                    <SettingsSystemIcon name="sim" />
                  </div>
                </template>
              </ListCell>

              <!-- WLAN -->
              <ListCell
                title="WLAN"
                :value="network.wifiEnabled ? (network.connectedWifi ? network.connectedWifi.ssid : '未连接') : '已关闭'"
                chevron
                @click="push('wifi')"
              >
                <template #icon>
                  <div class="squircle-icon bg-wifi">
                    <SettingsSystemIcon name="wifi" />
                  </div>
                </template>
              </ListCell>

              <!-- 蓝牙 -->
              <ListCell
                title="蓝牙"
                :value="network.bluetoothEnabled ? (network.pairedDevices.find(d => d.connected)?.name || '') : '已关闭'"
                chevron
                @click="push('bluetooth')"
              >
                <template #icon>
                  <div class="squircle-icon bg-bluetooth">
                    <SettingsSystemIcon name="bluetooth" />
                  </div>
                </template>
              </ListCell>

              <!-- 卫星网络 -->
              <ListCell
                title="卫星网络"
                :value="network.satelliteServiceEnabled ? '已开启' : ''"
                chevron
                @click="push('satellite')"
              >
                <template #icon>
                  <div class="squircle-icon bg-satellite">
                    <SettingsSystemIcon name="satellite" :size="18" />
                  </div>
                </template>
              </ListCell>

              <!-- 多设备连接 -->
              <ListCell title="多设备连接" chevron last @click="push('multiDevice')">
                <template #icon>
                  <div class="squircle-icon bg-multidevice">
                    <SettingsSystemIcon name="multi-device" :size="19" />
                  </div>
                </template>
              </ListCell>
            </div>

            <!-- ================= 卡片 4: AI、个性化与视听通知 (5项) ================= -->
            <div class="settings-card">
              <!-- Infinix AI -->
              <ListCell title="Infinix AI" chevron @click="push('infinixAi')">
                <template #icon>
                  <div class="squircle-icon bg-infinix-ai">
                    <SettingsSystemIcon name="ai" :size="19" />
                  </div>
                </template>
              </ListCell>

              <!-- 专注模式：iOS 完整流程，入口位于 Infinix AI 正下方 -->
              <ListCell title="专注模式" chevron data-setting-row="focus" @click="push('focus')">
                <template #icon>
                  <div class="squircle-icon" style="background:#5E5CE6"><LIcon name="moon" :size="19" /></div>
                </template>
              </ListCell>

              <!-- 模式和日常程序 (严格对齐三星真机布局：位于 Infinix AI 正下方) -->
              <ListCell title="模式和日常程序" chevron @click="push('modes')">
                <template #icon>
                  <div class="squircle-icon bg-modes">
                    <SettingsSystemIcon name="modes" :size="19" />
                  </div>
                </template>
              </ListCell>

              <!-- 主题与个性化（与页内标题同源） -->
              <ListCell :title="SETTINGS_TITLES.personalization" chevron @click="push('personalization')">
                <template #icon>
                  <div class="squircle-icon bg-wallpaper">
                    <SettingsSystemIcon name="wallpaper" :size="19" />
                  </div>
                </template>
              </ListCell>

              <!-- 显示与亮度 -->
              <ListCell title="显示与亮度" chevron @click="push('display')">
                <template #icon>
                  <div class="squircle-icon bg-display">
                    <SettingsSystemIcon name="display" />
                  </div>
                </template>
              </ListCell>

              <!-- 声音与振动 -->
              <ListCell title="声音与振动" chevron @click="push('sound')">
                <template #icon>
                  <div class="squircle-icon bg-sound">
                    <SettingsSystemIcon name="sound" />
                  </div>
                </template>
              </ListCell>

              <!-- 通知与状态栏 -->
              <ListCell title="通知与状态栏" chevron last @click="push('notifications')">
                <template #icon>
                  <div class="squircle-icon bg-notifications">
                    <div class="notif-bell-wrap">
                      <SettingsSystemIcon name="notifications" />
                      <span class="red-badge-dot"></span>
                    </div>
                  </div>
                </template>
              </ListCell>
            </div>

            <!-- ================= 卡片 5: 安全与隐私 (4项) ================= -->
            <div class="settings-card">
              <!-- 密码与安全 -->
              <ListCell title="密码与安全" chevron @click="push('security')">
                <template #icon>
                  <div class="squircle-icon bg-security">
                    <SettingsSystemIcon name="security" />
                  </div>
                </template>
              </ListCell>

              <!-- 权限与隐私 -->
              <ListCell title="权限与隐私" chevron @click="push('privacy')">
                <template #icon>
                  <div class="squircle-icon bg-privacy">
                    <SettingsSystemIcon name="privacy" />
                  </div>
                </template>
              </ListCell>

              <!-- 应用管理 -->
              <ListCell title="应用管理" chevron @click="push('appsManage')">
                <template #icon>
                  <div class="squircle-icon bg-apps">
                    <SettingsSystemIcon name="apps" />
                  </div>
                </template>
              </ListCell>

              <!-- 位置信息 -->
              <ListCell title="位置信息" chevron last @click="push('location')">
                <template #icon>
                  <div class="squircle-icon bg-location">
                    <SettingsSystemIcon name="location" />
                  </div>
                </template>
              </ListCell>
            </div>

            <!-- ================= 卡片 6: 系统特色与性能 (4项) ================= -->
            <div class="settings-card">
              <!-- 辅助功能 -->
              <ListCell title="辅助功能" chevron @click="push('accessibility')">
                <template #icon>
                  <div class="squircle-icon bg-accessibility">
                    <SettingsSystemIcon name="accessibility" />
                  </div>
                </template>
              </ListCell>

              <!-- One-Tap Button -->
              <ListCell title="One-Tap Button" chevron @click="push('oneTap')">
                <template #icon>
                  <div class="squircle-icon bg-onetap">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="7" y="3" width="10" height="18" rx="5" stroke="#FFFFFF" stroke-width="2"/>
                      <rect x="10" y="7" width="4" height="6" rx="2" fill="#FFFFFF"/>
                    </svg>
                  </div>
                </template>
              </ListCell>

              <!-- 电池与省电 -->
              <ListCell title="电池与省电" chevron @click="push('battery')">
                <template #icon>
                  <div class="squircle-icon bg-battery">
                    <SettingsSystemIcon name="battery" :size="19" />
                  </div>
                </template>
              </ListCell>

              <!-- 存储 -->
              <ListCell title="存储" chevron last @click="push('storage')">
                <template #icon>
                  <div class="squircle-icon bg-storage">
                    <SettingsSystemIcon name="storage" />
                  </div>
                </template>
              </ListCell>
            </div>

            <!-- ================= 卡片 7: 数字健康 / 家长控制 / 账号 (5项) ================= -->
            <div class="settings-card">
              <!-- 数字健康（真机新版本已与家长控制拆成两行） -->
              <ListCell title="数字健康" chevron data-setting-row="digitalHealth" @click="push('digitalHealth')">
                <template #icon>
                  <div class="squircle-icon bg-health">
                    <SettingsSystemIcon name="health" />
                  </div>
                </template>
              </ListCell>

              <!-- 家长控制 -->
              <ListCell title="家长控制" chevron data-setting-row="parental" @click="push('parental')">
                <template #icon>
                  <div class="squircle-icon bg-parental">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="9" cy="6.6" r="2.7" fill="#FFFFFF" />
                      <circle cx="16.6" cy="9.2" r="2.2" fill="#FFFFFF" />
                      <path d="M3.9 18.6v-2.8c0-2 1.6-3.6 3.6-3.6h3c2 0 3.6 1.6 3.6 3.6v2.8z" fill="#FFFFFF" />
                      <path d="M15.4 18.6v-2.1c0-1.3 1-2.3 2.3-2.3h1c1.3 0 2.3 1 2.3 2.3v2.1z" fill="#FFFFFF" />
                    </svg>
                  </div>
                </template>
              </ListCell>

              <!-- 安全和紧急情况 -->
              <ListCell title="安全和紧急情况" chevron @click="pushUnimplemented('安全和紧急情况')">
                <template #icon>
                  <div class="squircle-icon bg-emergency">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round">
                      <line x1="12" y1="3" x2="12" y2="21" />
                      <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" />
                      <line x1="4.2" y1="16.5" x2="19.8" y2="7.5" />
                    </svg>
                  </div>
                </template>
              </ListCell>

              <!-- 用户与账号 -->
              <ListCell title="用户与账号" chevron @click="pushUnimplemented('用户与账号')">
                <template #icon>
                  <div class="squircle-icon bg-user">
                    <SettingsSystemIcon name="user" />
                  </div>
                </template>
              </ListCell>

              <!-- Google -->
              <ListCell title="Google" chevron last @click="pushUnimplemented('Google')">
                <template #icon>
                  <div class="squircle-icon bg-google">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                </template>
              </ListCell>
            </div>

            <!-- ================= 卡片 8: 系统 (1项) ================= -->
            <div class="settings-card">
              <ListCell title="系统" chevron last @click="push('general')">
                <template #icon>
                  <div class="squircle-icon bg-system">
                    <SettingsSystemIcon name="system" :size="19" />
                  </div>
                </template>
              </ListCell>
            </div>

          <!-- 列表底部安全留白（让最后一项可滚到浮动搜索栏上方） -->
          <div class="scroll-bottom-spacer"></div>
        </div>

        <!-- ================= 底部悬浮搜索栏（全仓标准控件） ================= -->
        <SettingsSearchDock
          v-model="searchQuery"
          :active="false"
          fade-color="#F0F1F2"
          @activate="push('search')"
          @clear="searchQuery = ''"
        />
      </div>

      <!-- ================= 设置搜索界面（参考图 1 与图 2） ================= -->
      <div v-else-if="view === 'search'" key="search" class="settings-page">
        <SettingsSearch
          :searchable-items="allSearchableItems"
          @back="pop"
          @navigate="handleSearchNavigate"
        />
      </div>

      <!-- ================= 声音与振动 ================= -->
      <div v-else-if="view === 'sound'" key="sound" class="settings-page">
        <SettingsSound ref="soundRef" @back="pop" @open-dnd="push('dnd')" @open-prayer="push('prayer')" />
      </div>

      <!-- ================= 专注模式（完整创建、编辑与自动化流程） ================= -->
      <div v-else-if="view === 'focus'" key="focus" class="settings-page">
        <SettingsFocus ref="focusRef" @back="pop" />
      </div>

      <!-- ================= 勿扰模式 (含礼拜模式入口) ================= -->
      <div v-else-if="view === 'dnd'" key="dnd" class="settings-page">
        <SettingsDND ref="dndRef" @back="pop" @open-prayer="push('prayer')" />
      </div>

      <!-- ================= 礼拜模式 ================= -->
      <div v-else-if="view === 'prayer'" key="prayer" class="settings-page">
        <SettingsPrayer ref="prayerRef" @back="pop" @back-to-dnd="pop" />
      </div>

      <!-- ================= 通知与状态栏 (含礼拜灵动岛与闹钟联动设置) ================= -->
      <div v-else-if="view === 'notifications'" key="notifications" class="settings-page">
        <SettingsNotifications ref="notifRef" @back-to-settings="pop" />
      </div>

      <!-- ================= 主题与个性化 ================= -->
      <div v-else-if="view === 'personalization'" key="personalization" class="settings-page">
        <SettingsPersonalization ref="personalizationRef" @back="pop" />
      </div>

      <!-- ================= 显示与亮度 ================= -->
      <div v-else-if="view === 'display'" key="display" class="settings-page">
        <SettingsDisplay ref="displayRef" @back="pop" @navigate="handleDisplayNavigate" />
      </div>

      <!-- ================= 账号中心 (Infinix ID) ================= -->
      <div v-else-if="view === 'account'" key="account" class="settings-page">
        <SettingsAccount
          @back="pop"
          @open-wallet="push('wallet')"
          @open-security="push('accountSecurity')"
          @open-login="push('accountLogin')"
          @open-cloud="push('cloudHome')"
          @open-backup="push('cloudBackup')"
        />
      </div>

      <!-- ================= 云服务首页 (Infinix Cloud) ================= -->
      <div v-else-if="view === 'cloudHome'" key="cloudHome" class="settings-page">
        <SettingsCloudHome
          @back="pop"
          @open-backup="push('cloudBackup')"
        />
      </div>

      <!-- ================= 云备份 (Cloud Backup) ================= -->
      <div v-else-if="view === 'cloudBackup'" key="cloudBackup" class="settings-page">
        <SettingsCloudBackup @back="pop" />
      </div>

      <!-- ================= 账号登录 (Account Login) ================= -->
      <div v-else-if="view === 'accountLogin'" key="accountLogin" class="settings-page">
        <SettingsAccountLogin
          @back="pop"
          @login-success="() => {
            pop()
            push('account')
          }"
        />
      </div>

      <!-- ================= 账号安全 (Account Security) ================= -->
      <div v-else-if="view === 'accountSecurity'" key="accountSecurity" class="settings-page">
        <SettingsAccountSecurity @back="pop" />
      </div>

      <!-- ================= 卡包页面 (Wallet) ================= -->
      <div v-else-if="view === 'wallet'" key="wallet" class="settings-page">
        <SettingsWallet @back="pop" />
      </div>

      <!-- ================= 我的手机 (关于手机) ================= -->
      <div v-else-if="view === 'about'" key="about" class="settings-page">
        <SettingsAboutPhone ref="aboutPhoneRef" @back="pop" @open-storage="push('storage')" />
      </div>

      <!-- ================= SIM 卡与网络设置 ================= -->
      <div v-else-if="view === 'sim'" key="sim" class="settings-page">
        <SettingsSim ref="simRef" @back="pop" />
      </div>

      <!-- ================= WLAN (无线局域网) ================= -->
      <div v-else-if="view === 'wifi'" key="wifi" class="settings-page">
        <SettingsWifi ref="wifiRef" @back="pop" />
      </div>

      <!-- ================= 蓝牙 ================= -->
      <div v-else-if="view === 'bluetooth'" key="bluetooth" class="settings-page">
        <SettingsBluetooth ref="bluetoothRef" @back="pop" />
      </div>

      <!-- ================= 星链卫星网络 ================= -->
      <div v-else-if="view === 'satellite'" key="satellite" class="settings-page">
        <SettingsSatellite ref="satelliteRef" @back="pop" />
      </div>

      <!-- ================= 多设备连接 ================= -->
      <div v-else-if="view === 'multiDevice'" key="multiDevice" class="settings-page">
        <SettingsMultiDevice
          ref="multiDeviceRef"
          @back="pop"
          @open-hotspot="push('hotspot')"
          @open-nfc="push('nfc')"
        />
      </div>

      <!-- ================= 个人热点 ================= -->
      <div v-else-if="view === 'hotspot'" key="hotspot" class="settings-page">
        <SettingsHotspot ref="hotspotRef" @back="pop" />
      </div>

      <!-- ================= NFC ================= -->
      <div v-else-if="view === 'nfc'" key="nfc" class="settings-page">
        <SettingsNfc ref="nfcRef" @back="pop" @open-wallet="push('wallet')" />
      </div>

      <!-- ================= Infinix AI ================= -->
      <div v-else-if="view === 'infinixAi'" key="infinixAi" class="settings-page">
        <SettingsInfinixAI ref="aiRef" @back="pop" />
      </div>

      <!-- ================= 模式和日常程序 ================= -->
      <div v-else-if="view === 'modes'" key="modes" class="settings-page">
        <SettingsModes ref="modesRef" @back="pop" />
      </div>

      <!-- ================= 密码与安全 ================= -->
      <div v-else-if="view === 'security'" key="security" class="settings-page">
        <SettingsSecurity ref="securityRef" @back="pop" />
      </div>

      <!-- ================= 权限与隐私 ================= -->
      <div v-else-if="view === 'privacy'" key="privacy" class="settings-page">
        <SettingsPrivacy ref="privacyRef" @back="pop" />
      </div>

      <!-- ================= 应用管理 ================= -->
      <div v-else-if="view === 'appsManage'" key="appsManage" class="settings-page">
        <SettingsAppsManage ref="appsManageRef" @back="pop" />
      </div>

      <!-- ================= 位置信息 ================= -->
      <div v-else-if="view === 'location'" key="location" class="settings-page">
        <SettingsLocation ref="locationRef" @back="pop" />
      </div>

      <!-- ================= 辅助功能 ================= -->
      <div v-else-if="view === 'accessibility'" key="accessibility" class="settings-page">
        <SettingsAccessibility ref="accessibilityRef" @back="pop" />
      </div>

      <!-- ================= One-Tap Button ================= -->
      <div v-else-if="view === 'oneTap'" key="oneTap" class="settings-page">
        <SettingsOneTap ref="oneTapRef" @back="pop" />
      </div>

      <!-- ================= 电池与省电 ================= -->
      <div v-else-if="view === 'battery'" key="battery" class="settings-page">
        <SettingsBattery ref="batteryRef" @back="pop" />
      </div>

      <!-- ================= 存储 ================= -->
      <div v-else-if="view === 'storage'" key="storage" class="settings-page">
        <SettingsStorage ref="storageRef" @back="pop" />
      </div>

      <!-- ================= 数字健康（含 7 个子页） ================= -->
      <div v-else-if="view === 'digitalHealth'" key="digitalHealth" class="settings-page">
        <DigitalHealthApp ref="dhRef" @back="pop" @open-notifications="push('notifications')" />
      </div>

      <!-- ================= 家长控制 ================= -->
      <div v-else-if="view === 'parental'" key="parental" class="settings-page">
        <DhParental @back="pop" />
      </div>

      <!-- ================= 其他二级页 ================= -->
      <div v-else :key="view" class="settings-page">
        <GlassNavBar overlay :title="viewTitles[view]" @back="pop" />

        <!-- 未实现页面的优雅占位 -->
        <div style="padding-top: var(--nav-h)" v-if="view === 'placeholder'" class="scrollable detail-body">
          <div class="placeholder-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2.5" />
            </svg>
          </div>
          <div class="placeholder-title">{{ placeholderTitle }}</div>
          <div class="placeholder-note">该功能在当前原型版本中已收录，正在接入系统底层服务。</div>
        </div>

        <!-- 无线局域网 -->
        <div v-else-if="view === 'wifi'" class="scrollable detail-body">
          <div class="settings-card">
            <ListCell glyph="wifi" icon-bg="#0088FF" title="WLAN" last>
              <template #right><ToggleSwitch v-model="control.wifi" /></template>
            </ListCell>
          </div>
          <template v-if="control.wifi">
            <div class="group-header">当前网络</div>
            <div class="settings-card">
              <ListCell title="Ricky_5G" last>
                <template #right>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path :d="GLYPHS.check" fill="#007AFF" /></svg>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path :d="GLYPHS.info" fill="#C7C7CC" /></svg>
                </template>
              </ListCell>
            </div>
            <div class="group-header">其他网络</div>
            <div class="settings-card">
              <ListCell v-for="(n, i) in networks.slice(1)" :key="n" :title="n" :last="i === networks.length - 2">
                <template #right>
                  <svg width="18" height="18" viewBox="0 0 24 24"><path :d="GLYPHS.lock" fill="#C7C7CC" /></svg>
                </template>
              </ListCell>
            </div>
          </template>
          <div v-else class="empty-note">已关闭 WLAN</div>
        </div>


        <!-- 系统语言与输入法子页 -->
        <div v-else-if="view === 'language'" class="scrollable detail-body">
          <div class="group-header">已启用语言</div>
          <div class="settings-card">
            <ListCell
              title="简体中文 (中国)"
              :value="i18n.locale === 'zh' ? '✓' : ''"
              clickable
              @click="i18n.setLocale('zh')"
            />
            <ListCell
              title="English (United States)"
              :value="i18n.locale === 'en' ? '✓' : ''"
              clickable
              @click="i18n.setLocale('en')"
            />
            <ListCell
              title="বাংলা (বাংলাদেশ)"
              :value="i18n.locale === 'bn' ? '✓' : ''"
              last
              clickable
              @click="i18n.setLocale('bn')"
            />
          </div>
        </div>

        <!-- 系统导航方式子页 -->
        <div v-else-if="view === 'navigation'" class="scrollable detail-body">
          <div class="group-header">导航方式选择</div>
          <div class="settings-card">
            <ListCell
              title="全面屏手势导航"
              subtitle="从屏幕左侧或右侧向内轻扫返回上一级，从屏幕底部向上轻扫返回桌面"
              :value="system.navigationMode === 'gesture' ? '✓' : ''"
              clickable
              @click="system.setNavigationMode('gesture')"
            />
            <ListCell
              title="经典三键导航"
              subtitle="在屏幕底部显示返回键、主屏幕键与多任务键"
              :value="system.navigationMode === 'threeButton' ? '✓' : ''"
              last
              clickable
              @click="system.setNavigationMode('threeButton')"
            />
          </div>
        </div>

        <!-- 系统与关于手机 -->
        <div v-else class="scrollable detail-body">
          <div class="settings-card">
            <ListCell title="关于手机" value="Infinix NOTE 60 Pro" chevron clickable @click="push('about')" />
            <ListCell title="系统更新" value="XOS 17.0.0 最新版" last clickable @click="push('about')" />
          </div>
          <div class="group-header">系统控制与偏好</div>
          <div class="settings-card">
            <ListCell
              title="系统语言与输入法"
              :value="i18n.locale === 'zh' ? '简体中文 (中国)' : i18n.locale === 'en' ? 'English (US)' : 'বাংলা (বাংলাদেশ)'"
              chevron
              clickable
              @click="push('language')"
            />
            <ListCell
              title="系统导航方式"
              :value="system.navigationMode === 'gesture' ? '全面屏手势' : '经典三键导航'"
              chevron
              last
              clickable
              @click="push('navigation')"
            />
          </div>
          <div class="group-header">硬件与规格</div>
          <div class="settings-card">
            <ListCell title="处理器" value="Dimensity 9300+" />
            <ListCell title="运行内存" value="16 GB + 12 GB 扩展" />
            <ListCell title="机身存储" value="184 GB / 512 GB" last />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-app {
  height: 100%;
  background: #F0F1F2;
  overflow: hidden;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.settings-scroll-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* 顶层大标题的样式已搬进通用件 `components/ui/LargeTitleHeader.vue`
   （sticky + 折叠曲线 + 底色底幕）。改视觉请改那里，别在本页重画一份。 */

/* ================= 统一卡片规范 ================= */
.settings-card {
background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin: 0 16px 12px 16px;
}

/* 个人账号卡 */
.account-card {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.account-card:active {
  background: #F2F2F7;
}

.account-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  background: #F2F2F7;
}

.account-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.account-info {
  flex: 1;
  min-width: 0;
}

.account-name {
  font-size: 17px;
  font-weight: 600;
  color: #111111;
  line-height: 1.3;
}

.account-sub {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 3px;
  line-height: 1.2;
}

.account-card .lc-chevron {
  flex: none;
  color: #C5C5C7;
}

/* ================= 统一 Squircle 图标规范 ================= */
.squircle-icon {
  width: 36px;
  height: 36px;
  border-radius: 10.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.squircle-icon-img {
  width: 36px;
  height: 36px;
  border-radius: 10.5px;
  object-fit: contain;
  display: block;
  flex: none;
  margin-right: 14px;
  user-select: none;
  pointer-events: none;
}

.bg-device { background: #0C87F2; }
.bg-airplane { background: #FFA000; }
.bg-sim { background: #22C55E; }
.bg-wifi { background: #0088FF; }
.bg-bluetooth { background: #0088FF; }
.bg-satellite { background: #22C55E; }
.bg-multidevice { background: #10B981; }

.bg-infinix-ai { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%); }
.bg-modes { background: #5E4DE6; }
.bg-wallpaper { background: #F43F5E; }
.bg-display { background: #F59E0B; }
.bg-sound { background: #EF4444; }
.bg-notifications { background: #8E9AA8; }

.bg-security { background: #8E95A5; }
.bg-privacy { background: #2563EB; }
.bg-apps { background: #8E95A5; }
.bg-location { background: #0EA5E9; }

.bg-gt { background: #222226; }
.gt-badge {
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: -0.5px;
}

.bg-accessibility { background: #3B82F6; }
.bg-onetap { background: #2563EB; }
.bg-battery { background: #22C55E; }
.bg-storage { background: #3B82F6; }

.bg-health { background: #4ADE80; }
/* 家长控制：真机是橙黄 squircle + 两个白色人形（与数字健康的绿底人形抱心区分） */
.bg-parental { background: #FFB300; }
.bg-emergency { background: #EF4444; }
.bg-user { background: #22C55E; }
.bg-google {
  background: #FFFFFF;
  border: 0.5px solid #E5E7EB;
  box-sizing: border-box;
}

.bg-system { background: #6B7280; }

.notif-bell-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.red-badge-dot {
  position: absolute;
  top: -1px;
  right: -2px;
  width: 6.5px;
  height: 6.5px;
  border-radius: 50%;
  background: #FF3B30;
  border: 1px solid #8E9AA8;
}

/* ================= 底部悬浮搜索栏 ================= */
.settings-floating-search {
  position: absolute;
  /* 真机实测：左右边距 ≈27、离屏幕底 ≈25（贴在 home 指示条上方），不是贴边 16 */
  bottom: 25px;
  left: 27px;
  right: 27px;
  z-index: 10;
  pointer-events: auto;
}

.settings-floating-search::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: -27px;
  right: -27px;
  top: -34px;
  bottom: -25px;
  background: linear-gradient(
    to bottom,
    rgba(240, 241, 242, 0) 0%,
    rgba(240, 241, 242, 0.88) 38%,
    #F0F1F2 68%,
    #F0F1F2 100%
  );
  pointer-events: none;
}

.scroll-bottom-spacer {
  /* 搜索框 44 + 底距 25 + 余量 */
  height: 92px;
  width: 100%;
  flex: none;
}

/* ================= 极速丝滑进退动画 ================= */
.slide-enter-active,
.slide-back-enter-active {
  transition: transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.16s ease;
}
.slide-leave-active,
.slide-back-leave-active {
  transition: transform 0.12s cubic-bezier(0.4, 0, 1, 1), opacity 0.12s ease;
}

.slide-enter-from {
  transform: translateX(36px);
  opacity: 0;
}
.slide-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-leave-to {
  transform: translateX(-24px);
  opacity: 0;
}

.slide-back-enter-from {
  transform: translateX(-24px);
  opacity: 0;
}
.slide-back-enter-to {
  transform: translateX(0);
  opacity: 1;
}
.slide-back-leave-from {
  transform: translateX(0);
  opacity: 1;
}
.slide-back-leave-to {
  transform: translateX(36px);
  opacity: 0;
}

/* ================= 二级页通用样式 ================= */
.group-header {
  font-size: 13px;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 14px 20px 7px;
  font-weight: 500;
}
.detail-body {
  flex: 1;
  padding-top: 10px;
}
.empty-note {
  text-align: center;
  color: #8E8E93;
  font-size: 14px;
  margin-top: 40px;
}

.placeholder-icon {
  display: flex;
  justify-content: center;
  margin-top: 60px;
  margin-bottom: 16px;
}
.placeholder-title {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  color: #111111;
  margin-bottom: 8px;
}
.placeholder-note {
  text-align: center;
  color: #8E8E93;
  font-size: 14px;
  padding: 0 40px;
  line-height: 1.6;
}

</style>
