<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import AppNavBar from '../../ui/AppNavBar.vue'

const emit = defineEmits(['back'])

// SVG 图标路径常量字典
const GLYPHS = {
  gear: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  image: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
  message: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  check: 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z',
  cloud: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
  cloudUpload: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z',
  restore: 'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',
  cloudOff: 'M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 .84-.35 1.6-.91 2.14l1.45 1.45C23.42 17.2 24 16.18 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.97 0 11.23 0 14.5 0 18.09 2.91 21 6.5 21H18.73l2 2 1.27-1.27L4.27 4 3 5.27z'
}

// 7 类备份数据源
const backupCategories = [
  { id: 'settings', name: '设置', size: 34.29, unit: 'MB', color: '#8E8E93', glyph: 'gear' },
  { id: 'system', name: '系统数据', size: 19.3, unit: 'MB', color: '#34C759', glyph: 'person' },
  { id: 'desktop', name: '桌面设置', size: 2.3, unit: 'MB', color: '#0A84FF', glyph: 'image' },
  { id: 'contacts', name: '通讯录', size: 12.6, unit: 'MB', color: '#FF9F0A', glyph: 'person' },
  { id: 'sms', name: '短信', size: 8.1, unit: 'MB', color: '#30D158', glyph: 'message' },
  { id: 'apps', name: '应用列表', size: 1.2, unit: 'GB', color: '#FF453A', glyph: 'plus' },
  { id: 'gallery', name: '图库', size: 1.6, unit: 'GB', color: '#5E5CE6', glyph: 'image' }
]

function formatSize(size, unit) {
  return `${size} ${unit}`
}

// 核心数据模型与状态
const state = reactive({
  scenario: 'normal', // 'normal' | 'expired' | 'nospace'
  spaceTotal: 5,
  spaceUsedOther: 1.6,
  cloudBackup: {
    device: 'CAMON 40 Premier',
    size: 2.9,
    date: '2026/08/10',
    mine: true
  },
  remoteBackup: {
    device: 'CAMON 40 Premier',
    size: 1.8,
    date: '2026/08/09',
    source: '查找手机 · Web 端提交'
  },
  showRemote: true,
  otherDeviceBackup: {
    device: 'CAMON 30',
    size: 2.4,
    date: '2026/07/28'
  },
  showOtherDevice: true,
  legacyBackup: {
    device: 'CAMON 40 Premier',
    size: 29,
    expireDays: 24
  },
  showLegacy: true,
  autoBackupOn: true,
  autoFreq: 7,
  autoSkippedCount: 3,
  localLowSpace: false,
  lastBackupSize: 2.9
})

// 空间与容量计算
const totalBackupUsed = computed(() => {
  return (
    (state.cloudBackup ? state.cloudBackup.size : 0) +
    (state.showRemote && state.remoteBackup ? state.remoteBackup.size : 0) +
    (state.showOtherDevice && state.otherDeviceBackup ? state.otherDeviceBackup.size : 0)
  )
})

const spaceUsedTotal = computed(() => state.spaceUsedOther + totalBackupUsed.value)
const spaceRemaining = computed(() => Math.max(0, state.spaceTotal - spaceUsedTotal.value))

function setScenario(sc) {
  state.scenario = sc
  if (sc === 'nospace') {
    state.spaceUsedOther = 4.6
  } else {
    state.spaceUsedOther = 1.6
  }
}

// 页面栈与导航
const pageStack = ref(['home'])
const currentPage = computed(() => pageStack.value[pageStack.value.length - 1])

function pushPage(view) {
  pageStack.value.push(view)
}

function popPage() {
  if (pageStack.value.length > 1) {
    pageStack.value.pop()
  } else {
    emit('back')
  }
}

const pageTitles = {
  select: '选择备份数据',
  progress: '备份中',
  'restore-select': '选择恢复数据',
  'restore-progress': '恢复中',
  auto: '自动备份'
}

// 弹窗与抽屉
const activeModal = ref(null) // 'expired' | 'nospace' | 'overwrite' | 'stop' | 'delete' | 'localspace' | 'freq'
const toastText = ref('')
let toastTimer = null

function showToast(msg) {
  toastText.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2000)
}

// 选中项集合
const selectedIds = reactive(new Set(backupCategories.map(item => item.id)))
const actionFlow = ref('backup') // 'backup' | 'restore' | 'auto'

const isAllSelected = computed(() => selectedIds.size === backupCategories.length)

// 计算所选数据的总大小 (GB)
const selectedSizeGB = computed(() => {
  let mb = 0
  for (const item of backupCategories) {
    if (selectedIds.has(item.id)) {
      mb += item.unit === 'GB' ? item.size * 1024 : item.size
    }
  }
  return mb / 1024
})

const estimatedMinutes = computed(() => Math.max(1, Math.round(selectedSizeGB.value * 2)))

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.clear()
  } else {
    backupCategories.forEach(item => selectedIds.add(item.id))
  }
}

function toggleItem(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id)
  } else {
    selectedIds.add(id)
  }
}

// 点击“立即备份”进入备份流程
function handleStartBackupClick() {
  if (state.scenario === 'expired') {
    activeModal.value = 'expired'
    return
  }
  actionFlow.value = 'backup'
  pushPage('select')
}

// 覆盖确认开关
const isLegacyOverwrite = ref(false)

// 确认开始执行备份/恢复
function handleConfirmAction() {
  if (actionFlow.value === 'auto') {
    popPage()
    return
  }
  if (actionFlow.value === 'restore') {
    if (state.localLowSpace) {
      activeModal.value = 'localspace'
      return
    }
    startRestoreFlow()
    return
  }
  // 检查空间是否不足
  if (state.scenario === 'nospace' && selectedSizeGB.value > spaceRemaining.value) {
    activeModal.value = 'nospace'
    return
  }
  // 检查是否已有云备份需要覆盖提示
  if (state.cloudBackup || state.showLegacy) {
    isLegacyOverwrite.value = !state.cloudBackup && state.showLegacy
    activeModal.value = 'overwrite'
    return
  }
  startBackupFlow()
}

// 进度与动画
const progressPct = ref(0)
const isProgressPaused = ref(false)
let progressTimer = null

const progressCategoryList = computed(() => {
  const chosen = backupCategories.filter(cat => selectedIds.has(cat.id))
  const total = chosen.length
  return chosen.map((cat, idx) => {
    let itemState = 'wait'
    if (progressPct.value >= ((idx + 1) / total) * 100) {
      itemState = 'done'
    } else if (progressPct.value > (idx / total) * 100) {
      itemState = 'doing'
    }
    return { ...cat, state: itemState }
  })
})

const backedUpGB = computed(() => ((progressPct.value / 100) * selectedSizeGB.value).toFixed(1))
const remainingMinutes = computed(() => Math.max(1, Math.ceil(((100 - progressPct.value) / 100) * estimatedMinutes.value)))

function runProgress(type) {
  clearInterval(progressTimer)
  progressTimer = setInterval(() => {
    if (!isProgressPaused.value) {
      progressPct.value = Math.min(100, progressPct.value + 0.9)
      if (progressPct.value >= 100) {
        clearInterval(progressTimer)
        if (type === 'backup') {
          completeBackup()
        } else {
          pushPage('restore-result')
        }
      }
    }
  }, 100)
}

function startBackupFlow() {
  progressPct.value = 0
  isProgressPaused.value = false
  pushPage('progress')
  runProgress('backup')
}

function completeBackup() {
  state.lastBackupSize = Number(selectedSizeGB.value.toFixed(1))
  state.cloudBackup = {
    device: 'Infinix NOTE 50S 5G',
    size: Number(selectedSizeGB.value.toFixed(1)),
    date: '2026/08/11',
    mine: true
  }
  state.showLegacy = false
  pushPage('result')
}

function startRestoreFlow() {
  progressPct.value = 0
  isProgressPaused.value = false
  pushPage('restore-progress')
  runProgress('restore')
}

function handleStopClick() {
  activeModal.value = 'stop'
}

function confirmStopProgress() {
  clearInterval(progressTimer)
  activeModal.value = null
  pageStack.value = ['home']
  showToast('已停止，本次数据未备份到云空间')
}

onBeforeUnmount(() => {
  clearInterval(progressTimer)
})

// 演示场景切换
const demoScenarios = [
  { id: 'normal', label: '正常' },
  { id: 'expired', label: '权益到期' },
  { id: 'nospace', label: '空间不足' }
]

function switchScenario(id) {
  setScenario(id)
  showToast(`已切换演示场景：${demoScenarios.find(item => item.id === id).label}`)
}

// 模拟续费或扩容成功
function handleRenewOrExpand(type) {
  activeModal.value = null
  setScenario('normal')
  showToast(type === 'renew' ? '续费成功（演示），已刷新权益与容量' : '扩容成功（演示），已刷新空间容量')
}

// 演示状态切换（对齐图 2 原型第二行开关）
function toggleCloudBackupDemo() {
  state.cloudBackup = state.cloudBackup ? null : {
    device: 'CAMON 40 Premier',
    size: 2.9,
    date: '2026/08/10',
    mine: true
  }
}

function toggleRemoteDemo() {
  state.showRemote = !state.showRemote
  if (state.showRemote && !state.remoteBackup) {
    state.remoteBackup = {
      device: 'CAMON 40 Premier',
      size: 1.8,
      date: '2026/08/09',
      source: '查找手机 · Web 端提交'
    }
  }
}

function toggleOtherDeviceDemo() {
  state.showOtherDevice = !state.showOtherDevice
  if (state.showOtherDevice && !state.otherDeviceBackup) {
    state.otherDeviceBackup = {
      device: 'CAMON 30',
      size: 2.4,
      date: '2026/07/28'
    }
  }
}

// 左滑手势删除
const swipeState = reactive({
  id: null,
  startX: 0,
  base: 0,
  dx: 0,
  dragging: false,
  moved: false,
  openId: null
})

function onSwipePointerDown(e, itemId) {
  swipeState.id = itemId
  swipeState.startX = e.clientX
  swipeState.base = swipeState.openId === itemId ? -88 : 0
  swipeState.dx = 0
  swipeState.dragging = true
  window.addEventListener('pointermove', onSwipePointerMove, true)
  window.addEventListener('pointerup', onSwipePointerUp, true)
  window.addEventListener('pointercancel', onSwipePointerUp, true)
}

function onSwipePointerMove(e) {
  if (swipeState.dragging) {
    swipeState.dx = e.clientX - swipeState.startX
  }
}

function onSwipePointerUp() {
  if (!swipeState.dragging) return
  swipeState.dragging = false
  window.removeEventListener('pointermove', onSwipePointerMove, true)
  window.removeEventListener('pointerup', onSwipePointerUp, true)
  window.removeEventListener('pointercancel', onSwipePointerUp, true)

  if (Math.abs(swipeState.dx) > 10) {
    swipeState.moved = true
  }
  const finalX = swipeState.base + swipeState.dx
  swipeState.openId = finalX < -44 ? swipeState.id : null
  swipeState.id = null
}

function getSwipeStyle(itemId) {
  let offset = swipeState.openId === itemId ? -88 : 0
  if (swipeState.dragging && swipeState.id === itemId) {
    offset = Math.max(-88, Math.min(0, swipeState.base + swipeState.dx))
  }
  return {
    transform: `translateX(${offset}px)`,
    transition: swipeState.dragging && swipeState.id === itemId ? 'none' : 'transform 0.22s cubic-bezier(0.3, 0.8, 0.4, 1)'
  }
}

// 点击卡片恢复
function handleBackupRowClick() {
  if (swipeState.moved) {
    swipeState.moved = false
    return
  }
  if (swipeState.openId) {
    swipeState.openId = null
    return
  }
  actionFlow.value = 'restore'
  pushPage('restore-select')
}

const kindLabels = {
  cloud: '本机备份',
  remote: '远程备份',
  other: '其他设备备份',
  legacy: '历史备份'
}

const pendingDeleteInfo = ref(null)

function triggerDeleteBackup(kind) {
  const map = {
    cloud: state.cloudBackup,
    remote: state.remoteBackup,
    other: state.otherDeviceBackup,
    legacy: state.legacyBackup
  }
  pendingDeleteInfo.value = {
    kind,
    size: map[kind]?.size || 0
  }
  swipeState.openId = null
  activeModal.value = 'delete'
}

function confirmDeleteBackup() {
  const { kind, size } = pendingDeleteInfo.value
  if (kind === 'cloud') state.cloudBackup = null
  if (kind === 'remote') {
    state.remoteBackup = null
    state.showRemote = false
  }
  if (kind === 'other') {
    state.otherDeviceBackup = null
    state.showOtherDevice = false
  }
  if (kind === 'legacy') state.showLegacy = false

  activeModal.value = null
  pendingDeleteInfo.value = null
  showToast(kind === 'legacy' ? '历史备份已删除' : `已删除，释放 ${size} GB 云空间`)
}

// 自动备份频率
const freqOptions = [1, 3, 7]

function selectFreq(val) {
  state.autoFreq = val
  activeModal.value = null
}
</script>

<template>
  <div class="cb-app">
    <!-- ================= 页面 1: 云备份首页 ================= -->
    <div v-if="currentPage === 'home'" class="cb-page">
      <AppNavBar title="云备份" @back="emit('back')" />

      <div class="cb-sub-body scrollable">

      <!-- 权益过期横幅（仅 expired 场景） -->
      <div v-if="state.scenario === 'expired'" class="cb-banner">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path :d="GLYPHS.info" fill="#FF7A1A" />
        </svg>
        <div class="cb-banner-text">
          <div class="cb-banner-title">云空间权益已过期</div>
          <div class="cb-banner-sub">历史备份仍保留，可随时恢复；续费后可继续备份</div>
        </div>
        <button type="button" class="cb-banner-btn" @click="handleRenewOrExpand('renew')">续费</button>
      </div>

      <!-- Hero 大卡片（包含云朵图标、大标题、副标题、云空间进度条及立即备份按钮） -->
      <div class="card cb-hero">
        <div class="cb-hero-icon">
          <svg width="34" height="34" viewBox="0 0 24 24">
            <path :d="GLYPHS.cloudUpload" fill="#fff" />
          </svg>
        </div>
        <div class="cb-hero-title">云备份</div>
        <div class="cb-hero-sub">备份数据保存在你的云空间，权益过期后历史备份仍保留，可随时恢复</div>

        <div class="cb-space">
          <div class="cb-space-row">
            <span>云空间</span>
            <span class="cb-space-num">{{ spaceUsedTotal.toFixed(1) }} GB / {{ state.spaceTotal }} GB</span>
          </div>
          <div class="cb-space-bar">
            <div
              class="cb-space-fill other"
              :style="{ width: (state.spaceUsedOther / state.spaceTotal * 100) + '%' }"
            ></div>
            <div
              class="cb-space-fill backup"
              :style="{ width: (totalBackupUsed / state.spaceTotal * 100) + '%' }"
            ></div>
          </div>
          <div class="cb-space-legend">
            <span><i class="dot backup"></i>云备份 {{ totalBackupUsed.toFixed(1) }} GB</span>
            <span><i class="dot other"></i>其他 {{ state.spaceUsedOther.toFixed(1) }} GB</span>
          </div>
        </div>

        <button type="button" class="cb-primary" @click="handleStartBackupClick">
          立即备份
        </button>
      </div>

      <!-- 自动备份卡片（紧贴 Hero 大卡片下方！） -->
      <div class="card cb-cell" @click="pushPage('auto')">
        <div class="cb-cell-icon" style="background: linear-gradient(180deg, #4E9AF8, #1E6FF2);">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path :d="GLYPHS.restore" fill="#fff" />
          </svg>
        </div>
        <div class="cb-cell-main">
          <div class="cb-cell-title">自动备份</div>
          <div class="cb-cell-sub">
            每 {{ state.autoFreq }} 天 · WLAN · 锁定充电
          </div>
        </div>
        <span class="cb-cell-state" :class="{ on: state.autoBackupOn }">
          {{ state.autoBackupOn ? '已开启' : '已关闭' }}
        </span>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
          <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <!-- 本机备份 -->
      <div class="cb-section-title">本机备份</div>
      <div class="card cb-list">
        <div
          v-if="state.cloudBackup"
          class="cb-swipe"
          @pointerdown="e => onSwipePointerDown(e, 'cloud')"
          @pointermove="onSwipePointerMove"
          @pointerup="onSwipePointerUp"
          @pointercancel="onSwipePointerUp"
        >
          <div class="cb-swipe-actions">
            <button type="button" class="cb-del" @click.stop="triggerDeleteBackup('cloud')">删除</button>
          </div>
          <div class="cb-swipe-inner cb-backup-row" :style="getSwipeStyle('cloud')" @click="handleBackupRowClick">
            <div class="cb-device-icon">
              <svg width="16" height="22" viewBox="0 0 16 22">
                <rect x="1" y="1" width="14" height="20" rx="2.5" fill="none" stroke="#8E8E93" stroke-width="1.6" />
                <circle cx="8" cy="18" r="1.2" fill="#8E8E93" />
              </svg>
            </div>
            <div class="cb-cell-main">
              <div class="cb-cell-title">
                {{ state.cloudBackup.device }}
                <span class="cb-tag">本机</span>
              </div>
              <div class="cb-cell-sub">{{ state.cloudBackup.size }} GB | {{ state.cloudBackup.date }}</div>
            </div>
            <span class="cb-restore">恢复</span>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </div>
        <div v-else class="cb-empty">暂无本机备份</div>
      </div>

      <!-- 远程备份 -->
      <template v-if="state.showRemote">
        <div class="cb-section-title">远程备份</div>
        <div class="card cb-list">
          <div
            v-if="state.remoteBackup"
            class="cb-swipe"
            @pointerdown="e => onSwipePointerDown(e, 'remote')"
            @pointermove="onSwipePointerMove"
            @pointerup="onSwipePointerUp"
            @pointercancel="onSwipePointerUp"
          >
            <div class="cb-swipe-actions">
              <button type="button" class="cb-del" @click.stop="triggerDeleteBackup('remote')">删除</button>
            </div>
            <div class="cb-swipe-inner cb-backup-row" :style="getSwipeStyle('remote')" @click="handleBackupRowClick">
              <div class="cb-device-icon">
                <svg width="16" height="22" viewBox="0 0 16 22">
                  <rect x="1" y="1" width="14" height="20" rx="2.5" fill="none" stroke="#8E8E93" stroke-width="1.6" />
                  <circle cx="8" cy="18" r="1.2" fill="#8E8E93" />
                </svg>
              </div>
              <div class="cb-cell-main">
                <div class="cb-cell-title">
                  {{ state.remoteBackup.device }}
                  <span class="cb-tag remote">远程</span>
                </div>
                <div class="cb-cell-sub">
                  {{ state.remoteBackup.size }} GB | {{ state.remoteBackup.date }} · {{ state.remoteBackup.source }}
                </div>
              </div>
              <span class="cb-restore">恢复</span>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </template>

      <!-- 其他设备备份 -->
      <template v-if="state.showOtherDevice">
        <div class="cb-section-title">其他设备备份</div>
        <div class="card cb-list">
          <div
            v-if="state.otherDeviceBackup"
            class="cb-swipe"
            @pointerdown="e => onSwipePointerDown(e, 'other')"
            @pointermove="onSwipePointerMove"
            @pointerup="onSwipePointerUp"
            @pointercancel="onSwipePointerUp"
          >
            <div class="cb-swipe-actions">
              <button type="button" class="cb-del" @click.stop="triggerDeleteBackup('other')">删除</button>
            </div>
            <div class="cb-swipe-inner cb-backup-row" :style="getSwipeStyle('other')" @click="handleBackupRowClick">
              <div class="cb-device-icon">
                <svg width="16" height="22" viewBox="0 0 16 22">
                  <rect x="1" y="1" width="14" height="20" rx="2.5" fill="none" stroke="#8E8E93" stroke-width="1.6" />
                  <circle cx="8" cy="18" r="1.2" fill="#8E8E93" />
                </svg>
              </div>
              <div class="cb-cell-main">
                <div class="cb-cell-title">
                  {{ state.otherDeviceBackup.device }}
                  <span class="cb-tag other">其他设备</span>
                </div>
                <div class="cb-cell-sub">
                  {{ state.otherDeviceBackup.size }} GB | {{ state.otherDeviceBackup.date }}
                </div>
              </div>
              <span class="cb-restore">恢复</span>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </template>

      <!-- 历史备份 -->
      <template v-if="state.showLegacy">
        <div class="cb-section-title">历史备份</div>
        <div class="card cb-list">
          <div
            v-if="state.legacyBackup"
            class="cb-swipe"
            @pointerdown="e => onSwipePointerDown(e, 'legacy')"
            @pointermove="onSwipePointerMove"
            @pointerup="onSwipePointerUp"
            @pointercancel="onSwipePointerUp"
          >
            <div class="cb-swipe-actions">
              <button type="button" class="cb-del" @click.stop="triggerDeleteBackup('legacy')">删除</button>
            </div>
            <div class="cb-swipe-inner cb-backup-row" :style="getSwipeStyle('legacy')" @click="handleBackupRowClick">
              <div class="cb-device-icon">
                <svg width="16" height="22" viewBox="0 0 16 22">
                  <rect x="1" y="1" width="14" height="20" rx="2.5" fill="none" stroke="#8E8E93" stroke-width="1.6" />
                  <circle cx="8" cy="18" r="1.2" fill="#8E8E93" />
                </svg>
              </div>
              <div class="cb-cell-main">
                <div class="cb-cell-title">
                  {{ state.legacyBackup.device }}
                  <span class="cb-tag legacy">临时备份</span>
                </div>
                <div class="cb-cell-sub">
                  {{ state.legacyBackup.size }} GB | <span class="cb-expire">{{ state.legacyBackup.expireDays }} 天后过期</span>
                </div>
              </div>
              <span class="cb-restore">恢复</span>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </template>

      <!-- 原型演示场景（常驻虚线框卡片，完全与图 2 一致） -->
      <div class="cb-demo">
        <div class="cb-demo-title">原型演示场景</div>
        <!-- 第一行：状态场景 -->
        <div class="cb-demo-row">
          <button
            v-for="item in demoScenarios"
            :key="item.id"
            type="button"
            class="cb-chip"
            :class="{ active: state.scenario === item.id }"
            @click="switchScenario(item.id)"
          >
            {{ item.label }}
          </button>
        </div>
        <!-- 第二行：数据类别开关 -->
        <div class="cb-demo-row">
          <button
            type="button"
            class="cb-chip"
            :class="{ active: !!state.cloudBackup }"
            @click="toggleCloudBackupDemo"
          >
            本机备份
          </button>
          <button
            type="button"
            class="cb-chip"
            :class="{ active: state.showRemote }"
            @click="toggleRemoteDemo"
          >
            远程备份
          </button>
          <button
            type="button"
            class="cb-chip"
            :class="{ active: state.showOtherDevice }"
            @click="toggleOtherDeviceDemo"
          >
            其他设备
          </button>
          <button
            type="button"
            class="cb-chip"
            :class="{ active: state.showLegacy }"
            @click="state.showLegacy = !state.showLegacy"
          >
            历史存量包
          </button>
        </div>
        <!-- 第三行：校验开关 -->
        <div class="cb-demo-row">
          <button
            type="button"
            class="cb-chip"
            :class="{ active: state.localLowSpace }"
            @click="state.localLowSpace = !state.localLowSpace"
          >
            本机空间不足（恢复校验）
          </button>
        </div>
      </div>
    </div>
  </div>

    <!-- ================= 页面 2: 选择备份数据 / 选择恢复数据 ================= -->
    <div v-else-if="currentPage === 'select' || currentPage === 'restore-select'" class="cb-page cb-sub">
      <AppNavBar
        :title="pageTitles[currentPage]"
        back-label="云备份"
        @back="popPage"
      />

      <div class="cb-sub-body scrollable">
        <div class="card cb-stat">
          <div class="cb-stat-item">
            <div class="cb-stat-label">大小</div>
            <div class="cb-stat-value">{{ selectedSizeGB.toFixed(1) }} <span class="cb-stat-unit">GB</span></div>
          </div>
          <div class="cb-stat-divider"></div>
          <div class="cb-stat-item">
            <div class="cb-stat-label">预计</div>
            <div class="cb-stat-value">{{ estimatedMinutes }} <span class="cb-stat-unit">分钟</span></div>
          </div>
        </div>

        <div class="cb-note">以上为本地数据大小，实际占用以打包后为准</div>

        <div class="card cb-list">
          <!-- 全选行 -->
          <div class="cb-check-row" @click="toggleSelectAll">
            <span class="cb-checkbox" :class="{ checked: isAllSelected }">
              <svg v-if="isAllSelected" width="12" height="12" viewBox="0 0 24 24">
                <path :d="GLYPHS.check" fill="#fff" />
              </svg>
            </span>
            <span class="cb-check-title">全部</span>
          </div>

          <!-- 各项数据行 -->
          <div
            v-for="cat in backupCategories"
            :key="cat.id"
            class="cb-check-row"
            @click="toggleItem(cat.id)"
          >
            <span class="cb-checkbox" :class="{ checked: selectedIds.has(cat.id) }">
              <svg v-if="selectedIds.has(cat.id)" width="12" height="12" viewBox="0 0 24 24">
                <path :d="GLYPHS.check" fill="#fff" />
              </svg>
            </span>
            <span class="cb-cat-icon" :style="{ background: cat.color }">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path :d="GLYPHS[cat.glyph]" fill="#fff" />
              </svg>
            </span>
            <div class="cb-cell-main">
              <div class="cb-cell-title">{{ cat.name }}</div>
              <div class="cb-cell-sub">{{ formatSize(cat.size, cat.unit) }}</div>
            </div>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div class="cb-footer">
        <button type="button" class="cb-primary" @click="handleConfirmAction">
          {{ actionFlow === 'restore' ? '恢复' : actionFlow === 'auto' ? '确定' : '备份' }}
        </button>
      </div>
    </div>

    <!-- ================= 页面 3: 备份中 / 恢复中 ================= -->
    <div v-else-if="currentPage === 'progress' || currentPage === 'restore-progress'" class="cb-page cb-sub">
      <AppNavBar
        :title="currentPage === 'progress' ? '备份中' : '恢复中'"
        back-label="云备份"
        @back="handleStopClick"
      />

      <div class="cb-sub-body scrollable">
        <!-- 环形进度条 -->
        <div class="cb-ring-wrap">
          <svg class="cb-ring" width="180" height="180" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#ECECF0" stroke-width="6" />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="url(#cbGrad)"
              stroke-width="6"
              stroke-linecap="round"
              stroke-dasharray="339.3"
              :stroke-dashoffset="339.3 * (1 - progressPct / 100)"
              transform="rotate(-90 60 60)"
            />
            <defs>
              <linearGradient id="cbGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#56CCF2" />
                <stop offset="100%" stop-color="#2F80ED" />
              </linearGradient>
            </defs>
          </svg>
          <div class="cb-ring-text">
            <div class="cb-ring-pct">{{ progressPct.toFixed(1) }}%</div>
            <div class="cb-ring-gb">{{ backedUpGB }} / {{ selectedSizeGB.toFixed(1) }} GB</div>
          </div>
        </div>

        <div class="cb-progress-hint">
          预计剩余 {{ remainingMinutes }} 分钟。离开页面不会影响数据{{ currentPage === 'progress' ? '备份' : '恢复' }}。
        </div>

        <!-- 进行中分类项状态列表 -->
        <div
          v-for="item in progressCategoryList"
          :key="item.id"
          class="card cb-progress-item"
        >
          <span class="cb-cat-icon" :style="{ background: item.color }">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path :d="GLYPHS[item.glyph]" fill="#fff" />
            </svg>
          </span>
          <div class="cb-cell-main">
            <div class="cb-cell-title">{{ item.name }}</div>
            <div class="cb-cell-sub">{{ formatSize(item.size, item.unit) }}</div>
          </div>
          <svg v-if="item.state === 'done'" width="18" height="18" viewBox="0 0 24 24">
            <path :d="GLYPHS.check" fill="#34C759" />
          </svg>
          <span v-else-if="item.state === 'doing'" class="cb-doing">
            <i></i><i></i>
          </span>
          <span v-else class="cb-wait-dot"></span>
        </div>
      </div>

      <div class="cb-footer">
        <button type="button" class="cb-secondary" @click="handleStopClick">停止</button>
      </div>
    </div>

    <!-- ================= 页面 4: 备份完成结果页 ================= -->
    <div v-else-if="currentPage === 'result'" class="cb-page cb-sub">
      <div class="cb-result-hero">
        <div class="cb-result-icon ok">
          <svg width="52" height="52" viewBox="0 0 24 24">
            <path :d="GLYPHS.check" fill="#fff" />
          </svg>
        </div>
        <div class="cb-result-title">备份完成</div>
        <div class="cb-result-sub">共备份数据 {{ state.lastBackupSize }} GB，已保存在你的云空间</div>
      </div>

      <div class="cb-sub-body scrollable">
        <div class="cb-result-cards">
          <div class="card cb-result-card ok">
            <div class="cb-rc-label">备份成功</div>
            <div class="cb-rc-num ok">{{ selectedIds.size }} <span class="cb-rc-unit">项</span></div>
          </div>
          <div class="card cb-result-card">
            <div class="cb-rc-label">备份失败</div>
            <div class="cb-rc-num">0 <span class="cb-rc-unit">项</span></div>
          </div>
        </div>

        <div class="card cb-kv">
          <div class="cb-kv-row">
            <span>备份耗时</span>
            <span>{{ estimatedMinutes }} 分钟 25 秒</span>
          </div>
          <div class="cb-kv-row">
            <span>平均传输速率</span>
            <span>39.98 MB/s</span>
          </div>
          <div class="cb-kv-row">
            <span>云空间占用</span>
            <span>{{ spaceUsedTotal.toFixed(1) }} GB / {{ state.spaceTotal }} GB</span>
          </div>
        </div>
      </div>

      <div class="cb-footer">
        <button type="button" class="cb-primary" @click="pageStack = ['home']">知道了</button>
      </div>
    </div>

    <!-- ================= 页面 5: 恢复完成结果页 ================= -->
    <div v-else-if="currentPage === 'restore-result'" class="cb-page cb-sub">
      <div class="cb-result-hero">
        <div class="cb-result-icon ok">
          <svg width="52" height="52" viewBox="0 0 24 24">
            <path :d="GLYPHS.check" fill="#fff" />
          </svg>
        </div>
        <div class="cb-result-title">恢复完成</div>
        <div class="cb-result-sub">已恢复 {{ selectedIds.size }} 项数据，应用将按桌面布局继续安装</div>
      </div>

      <div class="cb-footer">
        <button type="button" class="cb-primary" @click="pageStack = ['home']">完成</button>
      </div>
    </div>

    <!-- ================= 页面 6: 自动备份设置 ================= -->
    <div v-else-if="currentPage === 'auto'" class="cb-page cb-sub">
      <AppNavBar title="自动备份" back-label="云备份" @back="popPage" />

      <div class="cb-sub-body scrollable">
        <div v-if="state.scenario === 'nospace'" class="cb-banner inline">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path :d="GLYPHS.cloudOff" fill="#FF7A1A" />
          </svg>
          <div class="cb-banner-text">
            <div class="cb-banner-title">上次自动备份未执行</div>
            <div class="cb-banner-sub">云空间不足，已连续跳过 {{ state.autoSkippedCount }} 次；空间充足后将自动重试</div>
          </div>
        </div>

        <div class="card cb-list">
          <div class="cb-check-row" @click="state.autoBackupOn = !state.autoBackupOn">
            <div class="cb-cell-main">
              <div class="cb-cell-title">自动备份</div>
              <div class="cb-cell-sub">满足备份条件时自动备份</div>
            </div>
            <span class="cb-toggle" :class="{ on: state.autoBackupOn }">
              <i></i>
            </span>
          </div>
        </div>

        <div class="cb-section-title">备份条件</div>
        <div class="card cb-list">
          <div class="cb-kv-row pad cb-tappable" @click="activeModal = 'freq'">
            <span>备份频率</span>
            <span class="cb-kv-dim">
              每 {{ state.autoFreq }} 天
              <svg style="vertical-align: -2px; margin-left: 4px;" width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </div>
          <div class="cb-kv-row pad">
            <span>网络</span>
            <span class="cb-kv-dim">WLAN</span>
          </div>
          <div class="cb-kv-row pad">
            <span>设备状态</span>
            <span class="cb-kv-dim">锁定并充电</span>
          </div>
        </div>

        <div class="cb-section-title">备份内容</div>
        <div class="card cb-cell" @click="actionFlow = 'auto'; pushPage('select')">
          <div class="cb-cell-main">
            <div class="cb-cell-title">备份数据类型</div>
            <div class="cb-cell-sub">已选 {{ selectedIds.size }}/{{ backupCategories.length }} 类（与手动备份共用）</div>
          </div>
          <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
            <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    </div>

    <!-- ================= 弹层抽屉区域 (Sheets / Modals) ================= -->
    <Transition name="fade">
      <div v-if="activeModal" class="cb-mask" @click.self="activeModal = null">
        <div class="cb-sheet">
          <!-- 1. 权益到期 -->
          <template v-if="activeModal === 'expired'">
            <div class="cb-sheet-icon warn">
              <svg width="28" height="28" viewBox="0 0 24 24"><path :d="GLYPHS.cloudOff" fill="#fff" /></svg>
            </div>
            <div class="cb-sheet-title">云空间权益已到期</div>
            <div class="cb-sheet-text">历史备份仍保留，可随时恢复。续费后即可继续备份新数据。</div>
            <button type="button" class="cb-primary" @click="handleRenewOrExpand('renew')">去续费</button>
            <button type="button" class="cb-sheet-link" @click="activeModal = null">取消</button>
          </template>

          <!-- 2. 空间不足 -->
          <template v-else-if="activeModal === 'nospace'">
            <div class="cb-sheet-icon warn">
              <svg width="28" height="28" viewBox="0 0 24 24"><path :d="GLYPHS.cloud" fill="#fff" /></svg>
            </div>
            <div class="cb-sheet-title">云空间不足</div>
            <div class="cb-sheet-text">
              本次备份约需 {{ selectedSizeGB.toFixed(1) }} GB，当前剩余 {{ spaceRemaining.toFixed(1) }} GB。扩容云空间后即可继续备份。
            </div>
            <button type="button" class="cb-primary" @click="handleRenewOrExpand('expand')">去扩容</button>
            <button type="button" class="cb-sheet-link" @click="activeModal = null">取消</button>
          </template>

          <!-- 3. 覆盖确认 -->
          <template v-else-if="activeModal === 'overwrite'">
            <div class="cb-sheet-title">替换当前云备份？</div>
            <div v-if="isLegacyOverwrite" class="cb-sheet-text">
              本机仅保留最新 1 份云备份。新备份完成后将替换本机的历史备份，替换后不可再恢复。
            </div>
            <div v-else class="cb-sheet-text">
              本机仅保留最新 1 份云备份。新备份完成后将替换 {{ state.cloudBackup?.date }} 的备份，旧备份占用的 {{ state.cloudBackup?.size }} GB 空间同步释放。
            </div>
            <button type="button" class="cb-primary" @click="activeModal = null; startBackupFlow()">继续备份</button>
            <button type="button" class="cb-sheet-link" @click="activeModal = null">取消</button>
          </template>

          <!-- 4. 中断停止确认 -->
          <template v-else-if="activeModal === 'stop'">
            <div class="cb-sheet-text plain">
              {{ currentPage === 'restore-progress' ? '若停止恢复，本次所选的所有数据都不会恢复到本机，是否停止恢复？' : '若停止备份，本次所选的所有数据都不会备份到云空间，是否停止备份？' }}
            </div>
            <div class="cb-sheet-actions">
              <button type="button" class="cb-sheet-half" @click="activeModal = null">取消</button>
              <button type="button" class="cb-sheet-half danger" @click="confirmStopProgress">停止</button>
            </div>
          </template>

          <!-- 5. 删除备份确认 -->
          <template v-else-if="activeModal === 'delete'">
            <div class="cb-sheet-title">删除该{{ kindLabels[pendingDeleteInfo?.kind] }}？</div>
            <div class="cb-sheet-text">删除的备份不可再恢复，确认删除？</div>
            <div class="cb-sheet-actions">
              <button type="button" class="cb-sheet-half" @click="activeModal = null">取消</button>
              <button type="button" class="cb-sheet-half danger" @click="confirmDeleteBackup">删除</button>
            </div>
          </template>

          <!-- 6. 本机空间不足 -->
          <template v-else-if="activeModal === 'localspace'">
            <div class="cb-sheet-icon warn">
              <svg width="28" height="28" viewBox="0 0 24 24"><path :d="GLYPHS.info" fill="#fff" /></svg>
            </div>
            <div class="cb-sheet-title">本机剩余空间不足</div>
            <div class="cb-sheet-text">本次恢复约需 {{ selectedSizeGB.toFixed(1) }} GB，当前剩余 1.2 GB。请清理本机空间后重试。</div>
            <button type="button" class="cb-primary" @click="activeModal = null">知道了</button>
          </template>

          <!-- 7. 备份频率选择 -->
          <template v-else-if="activeModal === 'freq'">
            <div class="cb-sheet-title">备份频率</div>
            <div class="cb-freq-options">
              <div
                v-for="days in freqOptions"
                :key="days"
                class="cb-freq-row"
                @click="selectFreq(days)"
              >
                <span>每 {{ days }} 天</span>
                <svg v-if="state.autoFreq === days" width="18" height="18" viewBox="0 0 24 24">
                  <path :d="GLYPHS.check" fill="#2F7CF6" />
                </svg>
              </div>
            </div>
            <div class="cb-sheet-text" style="margin-top: 14px;">
              按滚动间隔计算：距上次成功备份（含手动）满 {{ state.autoFreq }} 天且当天未手动备份，满足条件时自动执行；修改频率不重新计时。
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- 轻提示 Toast -->
    <Transition name="fade">
      <div v-if="toastText" class="cb-toast">{{ toastText }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.cb-app {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  font-family: var(--font-stack, -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif);
}

.cb-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  overflow: hidden;
  z-index: 1;
}

.cb-sub-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px 0 calc(var(--safe-bottom, 34px) + 24px);
  box-sizing: border-box;
}

/* 卡片基类 */
.card {
  background: #FFFFFF;
  border-radius: 16px;
  margin: 10px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  flex: none;
}

/* 顶部 Hero 大卡片（图 1 核心卡片） */
.cb-hero {
  padding: 26px 20px 22px;
  text-align: center;
}

.cb-hero-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  border-radius: 18px;
  background: linear-gradient(180deg, #56CCF2, #2F80ED);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(47, 128, 237, 0.35);
}

.cb-hero-title {
  font-size: 20px;
  font-weight: 700;
  color: #1C1C1E;
}

.cb-hero-sub {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.6;
  margin: 8px 4px 0;
}

/* 顶部横幅 */
.cb-banner {
  border-radius: 14px;
  padding: 12px 14px;
  margin: 4px 14px 2px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FFF4EA;
  border: 1px solid #FFE0C2;
}

.cb-banner.inline {
  background: #FFF8E6;
  border-radius: 14px;
  padding: 10px 14px;
  margin: 2px 0 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cb-banner-icon {
  flex: none;
}

.cb-banner-text {
  flex: 1;
  min-width: 0;
}

.cb-banner-title {
  font-size: 14px;
  font-weight: 600;
  color: #D4560A;
}

.cb-banner-sub {
  font-size: 12px;
  color: #A86A3B;
  margin-top: 2px;
  line-height: 1.4;
}

.cb-banner-btn {
  background: #FF7A1A;
  color: #FFFFFF;
  border: none;
  border-radius: 16px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex: none;
}

.cb-banner-btn:active {
  opacity: 0.85;
}

/* 空间容量进度条（内嵌于 Hero 卡片） */
.cb-space {
  margin: 18px 2px 16px;
  text-align: left;
}

.cb-space-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #8E8E93;
}

.cb-space-num {
  color: #1C1C1E;
  font-weight: 600;
}

.cb-space-bar {
  position: relative;
  height: 8px;
  margin-top: 8px;
  border-radius: 4px;
  background: #ECECF0;
  display: flex;
  overflow: hidden;
}

.cb-space-fill.other {
  background: #C7C7CC;
  height: 100%;
}

.cb-space-fill.backup {
  background: linear-gradient(90deg, #56CCF2, #2F80ED);
  height: 100%;
}

.cb-space-legend {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 11px;
  color: #8E8E93;
}

.cb-space-legend .dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  margin-right: 4px;
}

.cb-space-legend .dot.backup {
  background: #2F80ED;
}

.cb-space-legend .dot.other {
  background: #C7C7CC;
}

/* 分组标题（左右安全边距 20px，与卡片内容视觉垂直对齐） */
.cb-section-title {
  font-size: 13px;
  color: #8E8E93;
  font-weight: 500;
  margin: 18px 20px 6px 20px;
  flex: none;
}

/* 列表行与条目 */
.cb-list {
  display: flex;
  flex-direction: column;
}

.cb-tappable {
  cursor: pointer;
}

.cb-tappable:active {
  background: #F7F8FA;
}

.cb-check-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  min-height: 52px;
  box-sizing: border-box;
  cursor: pointer;
  border-bottom: 0.5px solid #F0F1F3;
}

.cb-check-row:last-child {
  border-bottom: none;
}

.cb-check-row:active {
  background: #F7F8FA;
}

.cb-check-title {
  font-size: 15px;
  font-weight: 500;
  color: #1C1C1E;
  margin-left: 12px;
}

.cb-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #C7C7CC;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.cb-checkbox.checked {
  background: #007AFF;
  border-color: #007AFF;
}

.cb-cat-icon {
  width: 32px;
  height: 32px;
  border-radius: 8.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-left: 12px;
  margin-right: 12px;
}

.cb-cell-main {
  flex: 1;
  min-width: 0;
}

.cb-cell-title {
  font-size: 15.5px;
  color: #1C1C1E;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cb-cell-sub {
  font-size: 12px;
  color: #8E8E93;
  margin-top: 3px;
}

/* 设备图标 */
.cb-device-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 12px;
}

/* 恢复与标签 */
.cb-restore {
  font-size: 13.5px;
  color: #007AFF;
  margin-right: 4px;
}

.cb-tag {
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 400;
}

.cb-tag.mine {
  background: #EDF5FF;
  color: #007AFF;
}

.cb-tag.remote {
  background: #E8F5E9;
  color: #2E7D32;
}

.cb-tag.other {
  background: #F3E5F5;
  color: #7B1FA2;
}

.cb-tag.legacy {
  background: #FFF3E0;
  color: #E65100;
}

.cb-expire {
  color: #FF3B30;
}

.cb-empty {
  padding: 24px;
  text-align: center;
  color: #8E8E93;
  font-size: 13.5px;
}

/* 左滑删除容器 */
.cb-swipe {
  position: relative;
  overflow: hidden;
  touch-action: pan-y;
  border-radius: 16px;
}

.cb-swipe-actions {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 88px;
  background: #FF3B30;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 16px 16px 0;
}

.cb-del {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  color: #FFFFFF;
  font-size: 14.5px;
  font-weight: 500;
  cursor: pointer;
}

.cb-swipe-inner {
  background: #FFFFFF;
  position: relative;
  z-index: 2;
  will-change: transform;
  border-radius: 16px;
}

.cb-backup-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  min-height: 56px;
  box-sizing: border-box;
  cursor: pointer;
}

/* 自动备份开关 */
.cb-toggle {
  width: 44px;
  height: 26px;
  border-radius: 13px;
  background: #E5E5EA;
  position: relative;
  transition: background 0.25s ease;
  flex: none;
}

.cb-toggle.on {
  background: #34C759;
}

.cb-toggle i {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s cubic-bezier(0.3, 0.8, 0.4, 1);
}

.cb-toggle.on i {
  transform: translateX(18px);
}

/* 键值对列表 */
.cb-kv-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-size: 14.5px;
  border-bottom: 0.5px solid #F0F1F3;
}

.cb-kv-row:last-child {
  border-bottom: none;
}

.cb-kv-dim {
  color: #8E8E93;
}

.cb-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
}

.cb-cell:active {
  background: #F7F8FA;
}

.cb-cell-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.cb-cell-state {
  font-size: 12px;
  color: #8E8E93;
}

.cb-cell-state.on {
  color: #2F7CF6;
}

/* 统计卡片 */
.cb-stat {
  display: flex;
  align-items: center;
  padding: 18px 0;
  margin-bottom: 8px;
}

.cb-stat-item {
  flex: 1;
  text-align: center;
}

.cb-stat-label {
  font-size: 12px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.cb-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1C1C1E;
  font-variant-numeric: tabular-nums;
}

.cb-stat-unit {
  font-size: 13px;
  font-weight: 400;
  color: #8E8E93;
}

.cb-stat-divider {
  width: 0.5px;
  height: 32px;
  background: #E5E5EA;
}

.cb-note {
  font-size: 11.5px;
  color: #8E8E93;
  margin-bottom: 12px;
  padding-left: 4px;
}

/* 圆环进度 */
.cb-ring-wrap {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 20px auto 16px auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cb-ring {
  position: absolute;
  inset: 0;
}

.cb-ring-text {
  text-align: center;
}

.cb-ring-pct {
  font-size: 32px;
  font-weight: 700;
  color: #1C1C1E;
  font-variant-numeric: tabular-nums;
}

.cb-ring-gb {
  font-size: 12.5px;
  color: #8E8E93;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}

.cb-progress-hint {
  font-size: 13px;
  color: #8E8E93;
  text-align: center;
  margin-bottom: 24px;
  padding: 0 16px;
  line-height: 1.4;
}

.cb-progress-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
}

.cb-doing {
  display: flex;
  gap: 3px;
}

.cb-doing i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #007AFF;
  animation: pulse 1s infinite alternate;
}

.cb-doing i:last-child {
  animation-delay: 0.3s;
}

@keyframes pulse {
  from { opacity: 0.3; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1.1); }
}

.cb-wait-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #C7C7CC;
}

/* 结果页 */
.cb-result-hero {
  padding: 36px 20px 20px 20px;
  text-align: center;
}

.cb-result-icon.ok {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: #34C759;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);
}

.cb-result-title {
  font-size: 21px;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 6px;
}

.cb-result-sub {
  font-size: 13.5px;
  color: #8E8E93;
}

.cb-result-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.cb-result-card {
  padding: 16px;
  text-align: center;
}

.cb-rc-label {
  font-size: 12px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.cb-rc-num {
  font-size: 22px;
  font-weight: 700;
  color: #1C1C1E;
}

.cb-rc-num.ok {
  color: #34C759;
}

.cb-rc-unit {
  font-size: 13px;
  font-weight: 400;
  color: #8E8E93;
}

/* 底部操作固定条 */
.cb-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 18px calc(var(--safe-bottom, 34px) + 12px) 18px;
  background: linear-gradient(180deg, rgba(244, 245, 247, 0) 0%, #F4F5F7 28%, #F4F5F7 100%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
  box-sizing: border-box;
}

.cb-footer-sub {
  font-size: 11px;
  color: #8E8E93;
  text-align: center;
  line-height: 1.35;
}

.cb-primary {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.cb-primary:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.cb-secondary {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  background: #E5E5EA;
  color: #1C1C1E;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.cb-secondary:active {
  transform: scale(0.98);
  background: #D8D8DC;
}

/* 抽屉弹窗 (Sheet) */
.cb-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.cb-sheet {
  width: 100%;
  background: #FFFFFF;
  border-radius: 24px 24px 0 0;
  padding: 24px 20px calc(var(--safe-bottom, 34px) + 16px) 20px;
  box-sizing: border-box;
  text-align: center;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
}

.cb-sheet-icon.warn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #FF9F0A;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px auto;
}

.cb-sheet-title {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 8px;
}

.cb-sheet-text {
  font-size: 13.5px;
  color: #636366;
  line-height: 1.45;
  margin-bottom: 20px;
}

.cb-sheet-text.plain {
  font-size: 15px;
  color: #1C1C1E;
  font-weight: 500;
  margin-bottom: 24px;
}

.cb-sheet-link {
  background: transparent;
  border: none;
  color: #8E8E93;
  font-size: 14.5px;
  margin-top: 10px;
  cursor: pointer;
  padding: 8px 16px;
}

.cb-sheet-actions {
  display: flex;
  gap: 12px;
}

.cb-sheet-half {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background: #F2F2F7;
  color: #1C1C1E;
  transition: transform 0.12s ease;
}

.cb-sheet-half:active {
  transform: scale(0.96);
}

.cb-sheet-half.danger {
  background: #FF3B30;
  color: #FFFFFF;
}

.cb-freq-options {
  display: flex;
  flex-direction: column;
  margin: 12px 0;
}

.cb-freq-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 4px;
  font-size: 16px;
  color: #1C1C1E;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
}

.cb-freq-row:last-child {
  border-bottom: none;
}

/* 原型演示场景（1:1 对齐图 2 虚线外框与微圆角胶囊） */
.cb-demo {
  margin: 22px 14px 28px;
  padding: 14px;
  border: 1px dashed #C7C7CC;
  border-radius: 14px;
  background: transparent;
}

.cb-demo-title {
  font-size: 11px;
  color: #AEAEB2;
  margin-bottom: 10px;
}

.cb-demo-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.cb-demo-row:last-child {
  margin-bottom: 0;
}

.cb-chip {
  flex: 1;
  padding: 8px 0;
  font-size: 12px;
  color: #636366;
  background: #ECECF0;
  border-radius: 18px;
  border: none;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s ease;
}

.cb-chip.active {
  background: #2F7CF6;
  color: #FFFFFF;
  font-weight: 600;
}

/* 浮动提示 */
.cb-toast {
  position: absolute;
  bottom: 96px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.82);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 200;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
