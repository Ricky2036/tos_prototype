<script setup>
import { ref, computed, inject } from 'vue'
import GlassNavBar from '../../ui/GlassNavBar.vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import SheetModal from '../../ui/SheetModal.vue'
import { useBackHandler } from '../../../composables/backRegistry'
import { useControlStore } from '../../../stores/controlStore'
import { useBatteryStore, formatDuration, MODE_INFO } from '../../../stores/batteryStore'
import { getApp } from '../../../config/apps'
import BatteryLevelChart from './battery/BatteryLevelChart.vue'
import BatteryActivityChart from './battery/BatteryActivityChart.vue'
import BatteryPowerSaving from './battery/BatteryPowerSaving.vue'
import BatteryCharging from './battery/BatteryCharging.vue'
import BatteryHealth from './battery/BatteryHealth.vue'
import BatteryAppUsage from './battery/BatteryAppUsage.vue'
import BatteryReverseWireless from './battery/BatteryReverseWireless.vue'
import BatteryBypassCharging from './battery/BatteryBypassCharging.vue'
import BatterySaverIntro from './battery/BatterySaverIntro.vue'
import {
  RANKING_24H, RANKING_24H_MORE, RANKING_7D, OTHER_APPS_24H, OTHER_APPS_7D,
  LAST_FULL_CHARGE, ACTIVITY
} from './battery/batteryData'

/**
 * 设置 → 电池与省电（首页）
 * 真机：Infinix X6878 / XOS 17，com.transsion.batterylab（2026-11-13 采集）
 * 证据：`.local-evidence/SET-BAT-01/`；菜单树：同目录 MENU-TREE.md
 *
 * 三级页（省电管理 / 充电设置 / 电池健康 / 应用耗电详情 / 充电三入口）都在 battery/ 下，
 * 主壳 SettingsApp.vue 不需要改接线。
 */
const emit = defineEmits(['back', 'navigate'])
const control = useControlStore()
const store = useBatteryStore()

const percent = computed(() => Math.round((control.battery ?? 0.86) * 100))
const modeMinutes = computed(() => Math.round(percent.value * (store.mode === 'saver' ? 21.33 : 18.36)))
const superMinutes = computed(() => Math.round(percent.value * 22.4))
const modeTimeText = computed(() => formatDuration(modeMinutes.value))
const superTimeText = computed(() => formatDuration(superMinutes.value))

/* ==================== 三级页（栈：省电管理 → 省电模式介绍 这类二层返回） ==================== */
const pageStack = ref([])
const subPage = computed(() => pageStack.value[pageStack.value.length - 1] || null)
const activeApp = ref(null)
const showModeInfo = ref(false)
const showActivityInfo = ref(false)
const showSuperConfirm = ref(false)
const rankingExpanded = ref(false)
const toastText = ref('')
let toastTimer = null

function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastText.value = '' }, 1800)
}

function openSub(key) {
  pageStack.value.push(key)
}

function closeSub() {
  pageStack.value.pop()
  if (!pageStack.value.includes('app')) activeApp.value = null
}

function openApp(app, name) {
  activeApp.value = { appId: app, name }
  pageStack.value.push('app')
}

function selectMode(mode) {
  if (store.mode === mode) return
  store.setMode(mode)
}

function onSuperToggle(next) {
  if (next) {
    showSuperConfirm.value = true
    return
  }
  store.setSuperSaver(false)
  showToast('已关闭超级省电')
}

function confirmSuperSaver() {
  store.setSuperSaver(true)
  showSuperConfirm.value = false
  showToast('已开启超级省电')
}

const ranking = computed(() => {
  const base = store.timeRange === '7d' ? RANKING_7D : RANKING_24H
  return store.timeRange === '7d' || !rankingExpanded.value ? base : [...base, ...RANKING_24H_MORE]
})

const otherApps = computed(() => (store.timeRange === '7d' ? OTHER_APPS_7D : OTHER_APPS_24H))
const activity = computed(() => ACTIVITY[store.timeRange])
const rankingTitle = computed(() => `耗电占比排行（过去 ${store.timeRange === '7d' ? '7 天' : '24 小时'}）`)
const otherTitle = computed(() => `其他应用耗电（过去 ${store.timeRange === '7d' ? '7 天' : '24 小时'}）`)

function appName(appId, fallback) {
  return getApp(appId)?.name || fallback || appId
}

function appIcon(appId) {
  const image = getApp(appId)?.image
  if (!image) return ''
  if (image.startsWith('http') || image.startsWith('data:')) return image
  const clean = image.replace(/^\/+/, '')
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/'
  return `${base}${clean}`
}

function back() {
  if (showSuperConfirm.value) { showSuperConfirm.value = false; return true }
  if (showModeInfo.value) { showModeInfo.value = false; return true }
  if (showActivityInfo.value) { showActivityInfo.value = false; return true }
  if (pageStack.value.length) { closeSub(); return true }
  emit('back')
  return true
}

/* 侧滑返回：三级页逐层退出（pipeline §6.2 下沉） */
const settingsNav = inject('settingsNav', null)
if (settingsNav) {
  useBackHandler(() => {
    if (pageStack.value.length) { closeSub(); return true }
    settingsNav.pop()
    return true
  })
}

defineExpose({ back })
</script>

<template>
  <div class="settings-battery-page">
    <!-- ==================== 三级页 ==================== -->
    <BatteryPowerSaving v-if="subPage === 'powerSaving'" key="powerSaving" @back="closeSub" @open-intro="openSub('saverIntro')" />
    <BatterySaverIntro v-else-if="subPage === 'saverIntro'" key="saverIntro" @back="closeSub" />
    <BatteryCharging v-else-if="subPage === 'charging'" key="charging" @back="closeSub" @open-reverse="openSub('reverse')" @open-bypass="openSub('bypass')" />
    <BatteryReverseWireless v-else-if="subPage === 'reverse'" key="reverse" @back="closeSub" />
    <BatteryBypassCharging v-else-if="subPage === 'bypass'" key="bypass" @back="closeSub" />
    <BatteryHealth v-else-if="subPage === 'health'" key="health" @back="closeSub" />
    <BatteryAppUsage v-else-if="subPage === 'app' && activeApp" key="app" :app-id="activeApp.appId" :app-name="activeApp.name" @back="closeSub" />

    <!-- ==================== 首页 ==================== -->
    <template v-if="!subPage">
      <GlassNavBar overlay title="电池与省电" @back="emit('back')" />

      <div class="battery-scroll-body scrollable" style="padding-top: var(--nav-h)">
        <!-- 顶部电量：真机大号百分比 + 剩余时间 + 绿色充电胶囊 -->
        <div class="battery-hero-section">
          <div class="battery-percentage-wrap">
            <span class="percentage-num">{{ percent }}</span>
            <span class="percentage-unit">%</span>
          </div>
          <div class="hero-remaining-text">剩余 {{ modeTimeText }}</div>

          <div class="charging-capsule-bar">
            <div class="charging-fill-track" :style="{ width: `${percent}%` }">
              <svg class="charging-bolt" width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" fill="#FFFFFF" />
              </svg>
              <span class="charging-text">正在充电</span>
            </div>
          </div>
        </div>

        <!-- 电池模式 -->
        <div class="section-sub-title">
          <span>电池模式</span>
          <button class="info-icon-btn" aria-label="电池模式说明" @click="showModeInfo = true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#8E8E93" stroke-width="1.5" />
              <path d="M12 10.6V17" stroke="#8E8E93" stroke-width="1.6" stroke-linecap="round" />
              <circle cx="12" cy="7.6" r="1" fill="#8E8E93" />
            </svg>
          </button>
        </div>

        <div class="settings-card mode-card">
          <div class="battery-modes-row">
            <button
              class="mode-tile"
              :class="{ selected: store.mode === 'saver' }"
              data-mode="saver"
              @click="selectMode('saver')"
            >
              <span class="mode-icon-wrap">
                <svg width="30" height="18" viewBox="0 0 30 18" fill="none">
                  <rect x="1" y="1" width="24" height="16" rx="4" stroke="#1C1C1E" stroke-width="1.6" />
                  <path d="M27 6.5V11.5" stroke="#1C1C1E" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M8 12.6C8 8.4 12 5.6 17 5.6C17 9.8 13 12.6 8 12.6Z" fill="#10B981" />
                </svg>
              </span>
              <span class="mode-name">省电模式</span>
              <span class="mode-time">{{ formatDuration(Math.round(percent * 21.33)) }}</span>
            </button>

            <button
              class="mode-tile"
              :class="{ selected: store.mode === 'balanced' }"
              data-mode="balanced"
              @click="selectMode('balanced')"
            >
              <span class="mode-icon-wrap">
                <svg width="30" height="18" viewBox="0 0 30 18" fill="none">
                  <rect x="1" y="1" width="24" height="16" rx="4" stroke="#1C1C1E" stroke-width="1.6" />
                  <path d="M27 6.5V11.5" stroke="#1C1C1E" stroke-width="1.8" stroke-linecap="round" />
                  <rect x="6" y="5" width="4" height="8" rx="1.5" fill="#1C1C1E" />
                  <rect x="13" y="5" width="4" height="8" rx="1.5" fill="#1C1C1E" />
                </svg>
              </span>
              <span class="mode-name">均衡模式</span>
              <span class="mode-time">{{ formatDuration(Math.round(percent * 18.36)) }}</span>
            </button>
          </div>

          <div class="super-saver-row">
            <div class="ss-text">
              <div class="ss-title">超级省电</div>
              <div class="ss-sub">预计可用 {{ superTimeText }}。</div>
            </div>
            <ToggleSwitch :model-value="store.superSaver" color="blue" @update:model-value="onSuperToggle" />
          </div>
        </div>

        <!-- 电池设置 -->
        <div class="section-sub-title">电池设置</div>
        <div class="settings-card">
          <ListCell title="省电管理" chevron @click="openSub('powerSaving')" />
          <ListCell title="充电设置" chevron @click="openSub('charging')" />
          <ListCell title="电池健康" chevron last @click="openSub('health')" />
        </div>

        <!-- 电池使用情况 -->
        <div class="section-sub-title">电池使用情况</div>
        <div class="settings-card usage-card">
          <div class="usage-subtitle">距上次充满电已使用</div>
          <div class="usage-title">{{ LAST_FULL_CHARGE }}</div>

          <div class="segmented-control-bar">
            <button class="segment-btn" :class="{ active: store.timeRange === '24h' }" @click="store.setTimeRange('24h')">过去 24 小时</button>
            <button class="segment-btn" :class="{ active: store.timeRange === '7d' }" @click="store.setTimeRange('7d')">过去 7 天</button>
          </div>

          <BatteryLevelChart :range="store.timeRange" />

          <div class="activity-head">
            <span>活动时长</span>
            <button class="info-icon-btn" aria-label="活动时长说明" @click="showActivityInfo = true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#8E8E93" stroke-width="1.5" />
                <path d="M12 10.6V17" stroke="#8E8E93" stroke-width="1.6" stroke-linecap="round" />
                <circle cx="12" cy="7.6" r="1" fill="#8E8E93" />
              </svg>
            </button>
          </div>

          <div class="activity-legend-row" :class="{ 'is-week': store.timeRange === '7d' }">
            <div class="legend-item">
              <span class="legend-head"><span class="dot-legend dot-screen-on"></span>{{ activity.onLabel }}</span>
              <span class="legend-val">{{ activity.screenOn }}</span>
            </div>
            <div class="legend-item">
              <span class="legend-head"><span class="dot-legend dot-screen-off"></span>{{ activity.offLabel }}</span>
              <span class="legend-val">{{ activity.screenOff }}</span>
            </div>
          </div>

          <BatteryActivityChart :range="store.timeRange" />
        </div>

        <!-- 耗电占比排行 -->
        <div class="section-sub-title">{{ rankingTitle }}</div>
        <div class="settings-card ranking-card">
          <ListCell
            v-for="(item, idx) in ranking"
            :key="`${item.appId}-${idx}`"
            :title="appName(item.appId)"
            :value="item.percent"
            chevron
            :last="idx === ranking.length - 1 && store.timeRange === '7d'"
            @click="openApp(item.appId)"
          >
            <template #icon>
              <img class="app-rank-icon" :src="appIcon(item.appId)" :alt="appName(item.appId)" />
            </template>
            <template #subtitle>
              <span class="rank-sub">{{ item.fg }}<br />{{ item.bg }}</span>
            </template>
          </ListCell>

          <button v-if="store.timeRange !== '7d'" class="more-btn" type="button" @click="rankingExpanded = !rankingExpanded">
            <span>{{ rankingExpanded ? '收起' : '查看更多' }}</span>
            <svg class="more-chevron" :class="{ up: rankingExpanded }" width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <!-- 其他应用耗电 -->
        <div class="section-sub-title">{{ otherTitle }}</div>
        <div class="settings-card">
          <ListCell
            v-for="(item, idx) in otherApps"
            :key="item.appId"
            :title="item.name"
            :value="item.percent"
            chevron
            :last="idx === otherApps.length - 1"
            @click="openApp(item.appId, item.name)"
          >
            <template #icon>
              <span class="system-app-icon">系统</span>
            </template>
            <template #subtitle>
              <span class="rank-sub">{{ item.fg }}<br />{{ item.bg }}</span>
            </template>
          </ListCell>
        </div>

        <div class="battery-footnote">应用耗电占比=应用耗电量/全部应用耗电量</div>
        <div class="bottom-spacer"></div>
      </div>
    </template>

    <!-- 电池模式说明（⭐ 真机：底部说明卡 + 确定） -->
    <SheetModal :visible="showModeInfo" padding="22px 20px 18px" @close="showModeInfo = false">
      <div class="mode-info-title">电池模式</div>
      <div v-for="m in MODE_INFO" :key="m.id" class="mode-info-item">
        <div class="mode-info-name">{{ m.title }}</div>
        <div class="mode-info-time">预计可用 {{ m.id === 'balanced' ? formatDuration(Math.round(percent * 18.36)) : m.id === 'saver' ? formatDuration(Math.round(percent * 21.33)) : superTimeText }}。</div>
        <div class="mode-info-desc">{{ m.desc }}</div>
      </div>
      <button type="button" class="mode-info-confirm" @click="showModeInfo = false">确定</button>
    </SheetModal>

    <!-- 活动时长说明（真机 ⓘ 的说明内容未采到，这里只解释两个口径） -->
    <SheetModal :visible="showActivityInfo" padding="22px 20px 18px" @close="showActivityInfo = false">
      <div class="mode-info-title">活动时长</div>
      <div class="activity-info-row"><span class="dot-legend dot-screen-on"></span>亮屏活动时长：屏幕点亮并处于前台使用的时间。</div>
      <div class="activity-info-row"><span class="dot-legend dot-screen-off"></span>息屏活动时长：屏幕熄灭但应用仍在后台运行的时间。</div>
      <div class="activity-info-note">过去 7 天按日均值显示。</div>
      <button type="button" class="mode-info-confirm" @click="showActivityInfo = false">知道了</button>
    </SheetModal>

    <!-- 超级省电确认：真机未采到（未知），按系统说明卡的后果做一次确认 -->
    <SheetModal :visible="showSuperConfirm" padding="24px 20px 18px" @close="showSuperConfirm = false">
      <div class="confirm-title">开启超级省电</div>
      <div class="confirm-desc">系统性能受限，最多可同时使用 6 个应用。开启后预计可用 {{ superTimeText }}。</div>
      <div class="confirm-actions">
        <button type="button" class="confirm-btn ghost" @click="showSuperConfirm = false">取消</button>
        <button type="button" class="confirm-btn primary" @click="confirmSuperSaver">开启</button>
      </div>
    </SheetModal>

    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-battery-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F0F1F2;
  color: #1C1C1E;
  overflow: hidden;
  user-select: none;
}

.battery-scroll-body {
  flex: 1;
  padding: 8px 16px 32px 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* ---------- Hero ---------- */
.battery-hero-section { padding: 10px 4px 14px 4px; }

.battery-percentage-wrap { display: flex; align-items: baseline; line-height: 1; }

.percentage-num { font-size: 52px; font-weight: 700; letter-spacing: -1.5px; }

.percentage-unit { font-size: 24px; font-weight: 600; margin-left: 2px; }

.hero-remaining-text { font-size: 15px; color: #8E8E93; margin-top: 8px; margin-bottom: 16px; }

.charging-capsule-bar {
  height: 38px;
  border-radius: 999px;
  background: #D6F5DF;
  overflow: hidden;
}

.charging-fill-track {
  height: 100%;
  background: #34C759;
  border-radius: 999px;
  display: flex;
  align-items: center;
  padding-left: 16px;
  gap: 6px;
  color: #FFFFFF;
  transition: width 0.3s ease;
}

.charging-bolt { display: block; }
.charging-text { font-size: 13px; font-weight: 600; }

/* ---------- 分组 ---------- */
.section-sub-title {
  font-size: 13px;
  color: #8E8E93;
  font-weight: 500;
  margin: 16px 4px 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-icon-btn { background: none; border: none; padding: 0; display: inline-flex; cursor: pointer; }

.settings-card { background: #FFFFFF; border-radius: 16px; overflow: hidden; margin-bottom: 12px; }

/* ---------- 电池模式 ---------- */
.mode-card { padding: 12px 12px 0; }

.battery-modes-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.mode-tile {
  background: #F2F2F7;
  border: 2px solid transparent;
  border-radius: 14px;
  padding: 16px 12px 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  cursor: pointer;
  font-family: inherit;
}

.mode-tile.selected { background: #FFFFFF; border-color: #0A84FF; }

.mode-icon-wrap { display: block; }

.mode-name { font-size: 15px; font-weight: 400; color: #1C1C1E; }

.mode-time { font-size: 12px; color: #8E8E93; }

.super-saver-row {
  margin-top: 12px;
  border-top: 0.5px solid rgba(60, 60, 67, 0.16);
  padding: 14px 4px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ss-title { font-size: 17px; font-weight: 400; }

.ss-sub { font-size: 13px; color: #8E8E93; margin-top: 4px; }

/* ---------- 使用情况 ---------- */
.usage-card { padding: 16px 16px 18px; }

.usage-subtitle { font-size: 13px; color: #8E8E93; }

.usage-title { font-size: 22px; font-weight: 700; margin: 2px 0 14px; }

.segmented-control-bar {
  display: flex;
  background: #F2F2F7;
  border-radius: 999px;
  padding: 2px;
  margin-bottom: 20px;
}

.segment-btn {
  flex: 1;
  padding: 9px 0;
  font-size: 14px;
  font-weight: 400;
  border: none;
  background: transparent;
  color: #1C1C1E;
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
}

.segment-btn.active { background: #FFFFFF; font-weight: 600; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }

.activity-head {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 15px;
  font-weight: 600;
  margin: 20px 0 12px;
}

.activity-legend-row { display: flex; gap: 28px; margin-bottom: 14px; }

.legend-item { display: flex; flex-direction: column; gap: 4px; }

.legend-head { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #8E8E93; }

.dot-legend { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }

.dot-screen-on { background: #2F7CF6; }
.dot-screen-off { background: #A9CCF8; }

.activity-legend-row.is-week .dot-screen-on { background: #2F8CFF; }
.activity-legend-row.is-week .dot-screen-off { background: #1F3F8F; }

.legend-val { font-size: 20px; font-weight: 600; }

/* ---------- 排行 ---------- */
.rank-sub { display: block; font-size: 12px; line-height: 17px; color: #8E8E93; }

.app-rank-icon { width: 42px; height: 42px; border-radius: 10px; object-fit: contain; display: block; }

.system-app-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #E9E9EB;
  color: #636366;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-btn {
  width: 100%;
  border: none;
  background: transparent;
  padding: 14px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  color: #1C1C1E;
  font-family: inherit;
  cursor: pointer;
}

.more-chevron { transition: transform 0.2s ease; }
.more-chevron.up { transform: rotate(180deg); }

.battery-footnote { font-size: 12px; color: #8E8E93; padding: 4px 4px 0; }

.bottom-spacer { height: 24px; }

/* ---------- 电池模式说明 ---------- */
.mode-info-title { font-size: 17px; font-weight: 600; text-align: center; margin-bottom: 18px; }

.mode-info-item { margin-bottom: 16px; }

.mode-info-name { font-size: 16px; font-weight: 600; }

.mode-info-time { font-size: 13px; color: #8E8E93; margin-top: 3px; }

.mode-info-desc { font-size: 13px; color: #8E8E93; margin-top: 2px; line-height: 18px; }

.activity-info-row { font-size: 13px; color: #8E8E93; line-height: 20px; display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.activity-info-note { font-size: 12px; color: #8E8E93; margin: 4px 0 14px; }

.mode-info-confirm {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 24px;
  background: #0A84FF;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  margin-top: 4px;
}

/* ---------- 确认弹层 ---------- */
.confirm-title { font-size: 17px; font-weight: 600; text-align: center; margin-bottom: 10px; }

.confirm-desc { font-size: 13px; color: #8E8E93; line-height: 19px; text-align: center; margin-bottom: 18px; }

.confirm-actions { display: flex; gap: 12px; }

.confirm-btn {
  flex: 1;
  height: 46px;
  border: none;
  border-radius: 23px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.confirm-btn.ghost { background: #F2F2F7; color: #1C1C1E; }
.confirm-btn.primary { background: #0A84FF; color: #FFFFFF; }

/* ---------- Toast ---------- */
.settings-toast {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.88);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}

.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity 0.2s ease; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; }
</style>
