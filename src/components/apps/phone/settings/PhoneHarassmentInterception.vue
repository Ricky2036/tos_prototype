<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

// 当前视图：'list' | 'rules' | 'blacklist'
const currentView = ref('list')
const activeTab = ref('calls') // 'calls' | 'sms'
const showMoreMenu = ref(false)
const showNotifyModal = ref(false)
const showAddBlacklistModal = ref(false)
const inputBlacklistNumber = ref('')

const blockedCalls = ref([
  { id: 'b1', number: '4000595558', slot: 'SIM 1', location: '中国', date: '09/28' },
  { id: 'b2', number: '4000595558', slot: 'SIM 1', location: '中国', date: '09/28' },
  { id: 'b3', number: '4000595558', slot: 'SIM 1', location: '中国', date: '09/22' },
  { id: 'b4', number: '4000595558', slot: 'SIM 1', location: '中国', date: '09/20' },
  { id: 'b5', number: '4000595558', slot: 'SIM 1', location: '中国', date: '09/16' },
  { id: 'b6', number: '4000595558', slot: 'SIM 1', location: '中国', date: '09/12' }
])

function handleBack() {
  if (showAddBlacklistModal.value) {
    showAddBlacklistModal.value = false
    return
  }
  if (showNotifyModal.value) {
    showNotifyModal.value = false
    return
  }
  if (showMoreMenu.value) {
    showMoreMenu.value = false
    return
  }
  if (currentView.value === 'blacklist') {
    currentView.value = 'rules'
    return
  }
  if (currentView.value === 'rules') {
    currentView.value = 'list'
    return
  }
  emit('back')
}

function openRules() {
  showMoreMenu.value = false
  currentView.value = 'rules'
}

function openBlacklist() {
  currentView.value = 'blacklist'
}

function confirmAddBlacklist() {
  if (inputBlacklistNumber.value.trim()) {
    phoneStore.addBlackListNumber(inputBlacklistNumber.value.trim())
    inputBlacklistNumber.value = ''
    showAddBlacklistModal.value = false
  }
}

defineExpose({
  back() {
    if (showAddBlacklistModal.value) {
      showAddBlacklistModal.value = false
      return true
    }
    if (showNotifyModal.value) {
      showNotifyModal.value = false
      return true
    }
    if (showMoreMenu.value) {
      showMoreMenu.value = false
      return true
    }
    if (currentView.value === 'blacklist') {
      currentView.value = 'rules'
      return true
    }
    if (currentView.value === 'rules') {
      currentView.value = 'list'
      return true
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-subpage">
    <!-- 1. 骚扰拦截主列表 -->
    <div v-if="currentView === 'list'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">骚扰拦截</div>
        <div class="header-actions">
          <button class="more-btn" title="更多选项" @click="showMoreMenu = !showMoreMenu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2">
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>

          <!-- 下拉菜单：拦截规则设置 -->
          <Transition name="fade">
            <div v-if="showMoreMenu" class="dropdown-popup" @click="openRules">
              <span class="dropdown-item">拦截规则设置</span>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 分段切换（通话 / 短信） -->
      <div class="tabs-container">
        <div class="segment-control">
          <div
            class="segment-item"
            :class="{ active: activeTab === 'calls' }"
            @click="activeTab = 'calls'"
          >
            通话
          </div>
          <div
            class="segment-item"
            :class="{ active: activeTab === 'sms' }"
            @click="activeTab = 'sms'"
          >
            短信
          </div>
        </div>
      </div>

      <!-- 拦截记录列表 -->
      <div class="subpage-body scrollable">
        <template v-if="activeTab === 'calls'">
          <div class="settings-card">
            <div
              v-for="(rec, idx) in blockedCalls"
              :key="rec.id"
              class="blocked-row"
              :class="{ 'no-sep': idx === blockedCalls.length - 1 }"
            >
              <div class="rec-main">
                <div class="rec-number">{{ rec.number }}</div>
                <div class="rec-sub">
                  <span class="slot-badge">{{ rec.slot }}</span>
                  <span class="rec-loc">{{ rec.location }}</span>
                </div>
              </div>
              <div class="rec-date">{{ rec.date }}</div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="empty-state">
            <div class="empty-text">暂无拦截短信</div>
          </div>
        </template>
      </div>
    </div>

    <!-- 2. 拦截规则设置四级页面 -->
    <div v-else-if="currentView === 'rules'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">拦截规则设置</div>
      </div>

      <div class="subpage-body scrollable">
        <!-- 分组 1：通话拦截规则 -->
        <div class="section-caption">通话拦截规则</div>
        <div class="settings-card">
          <div class="settings-row item-switch">
            <div class="row-label">拦截陌生号码来电</div>
            <ToggleSwitch v-model="phoneStore.settings.blockStranger" />
          </div>

          <div class="settings-row item-switch no-sep">
            <div class="row-label">拦截未知/隐藏号码来电</div>
            <ToggleSwitch v-model="phoneStore.settings.blockHidden" />
          </div>
        </div>

        <!-- 分组 2：短信拦截规则 -->
        <div class="section-caption">短信拦截规则</div>
        <div class="settings-card">
          <div class="settings-row chevron-item no-sep">
            <div class="label-col">
              <div class="row-label">自定义拦截</div>
              <div class="row-sub">拦截包含此短语的信息</div>
            </div>
            <div class="right-summary">
              <span class="badge-count">0</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 分组 3：名单管理 -->
        <div class="section-caption">名单管理</div>
        <div class="settings-card">
          <div class="settings-row chevron-item" @click="openBlacklist">
            <div class="label-col">
              <div class="row-label">黑名单</div>
              <div class="row-sub">不再接受被加入号码的信息和电话</div>
            </div>
            <div class="right-summary">
              <span class="badge-count">{{ phoneStore.settings.blackList.length }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <div class="settings-row chevron-item no-sep">
            <div class="label-col">
              <div class="row-label">白名单</div>
              <div class="row-sub">被加入号码的来电和信息将畅通无阻</div>
            </div>
            <div class="right-summary">
              <span class="badge-count">0</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 分组 4：拦截通知设置 -->
        <div class="section-caption">拦截通知设置</div>
        <div class="settings-card">
          <div class="settings-row chevron-item no-sep" @click="showNotifyModal = true">
            <div class="label-col">
              <div class="row-label">拦截通知设置</div>
              <div class="row-sub">{{ phoneStore.settings.blockNotify }}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 黑名单管理五级页面 -->
    <div v-else-if="currentView === 'blacklist'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">黑名单</div>
      </div>

      <div class="subpage-body scrollable">
        <div v-if="phoneStore.settings.blackList.length === 0" class="empty-state">
          <div class="empty-text">黑名单暂无号码</div>
        </div>

        <div v-else class="settings-card">
          <div
            v-for="(num, idx) in phoneStore.settings.blackList"
            :key="num"
            class="settings-row"
            :class="{ 'no-sep': idx === phoneStore.settings.blackList.length - 1 }"
          >
            <div class="row-label">{{ num }}</div>
            <button class="delete-btn" title="移除黑名单" @click="phoneStore.removeBlackListNumber(num)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="bottom-action-bar">
        <button class="main-add-btn" @click="showAddBlacklistModal = true">添加黑名单号码</button>
      </div>
    </div>

    <!-- 拦截通知设置 Action Sheet -->
    <Transition name="fade">
      <div v-if="showNotifyModal" class="modal-overlay" @click.self="showNotifyModal = false">
        <div class="action-sheet-card">
          <div class="sheet-title">拦截通知设置</div>
          <div class="sheet-options">
            <div
              v-for="opt in ['拦截后通知', '不通知']"
              :key="opt"
              class="sheet-radio-row"
              @click="phoneStore.settings.blockNotify = opt; showNotifyModal = false"
            >
              <span class="sheet-label">{{ opt }}</span>
              <div class="custom-radio" :class="{ checked: phoneStore.settings.blockNotify === opt }">
                <div v-if="phoneStore.settings.blockNotify === opt" class="radio-inner"></div>
              </div>
            </div>
          </div>
          <button class="sheet-cancel-btn" @click="showNotifyModal = false">取消</button>
        </div>
      </div>
    </Transition>

    <!-- 添加黑名单号码弹窗 -->
    <Transition name="fade">
      <div v-if="showAddBlacklistModal" class="modal-overlay" @click.self="showAddBlacklistModal = false">
        <div class="alert-dialog-card">
          <div class="dialog-title">添加黑名单号码</div>
          <div class="dialog-body">
            <input
              v-model="inputBlacklistNumber"
              type="tel"
              class="dialog-input"
              placeholder="请输入电话号码"
              autofocus
              @keyup.enter="confirmAddBlacklist"
            />
          </div>
          <div class="dialog-actions">
            <button class="dialog-btn cancel" @click="showAddBlacklistModal = false">取消</button>
            <button class="dialog-btn confirm" :disabled="!inputBlacklistNumber.trim()" @click="confirmAddBlacklist">添加</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F3;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.subpage-header {
  position: relative;
  display: flex;
  align-items: center;
  padding-top: calc(var(--safe-top, 54px) + 8px);
  padding-bottom: 12px;
  padding-left: 16px;
  padding-right: 16px;
  background: #F0F1F3;
}

.back-btn {
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.back-btn:active {
  background-color: #E8E9EB;
  transform: scale(0.96);
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1C1C1E;
  margin-left: 12px;
  flex: 1;
}

.header-actions {
  position: relative;
}

.more-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.dropdown-popup {
  position: absolute;
  top: 46px;
  right: 0;
  background: #FFFFFF;
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
  min-width: 130px;
  z-index: 80;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.dropdown-item {
  display: block;
  padding: 12px 18px;
  font-size: 15px;
  color: #1C1C1E;
  white-space: nowrap;
  cursor: pointer;
}

.dropdown-item:active {
  background: #F2F3F5;
}

/* 分段选项卡 */
.tabs-container {
  padding: 8px 16px 12px;
}

.segment-control {
  display: flex;
  background: #E5E7EB;
  border-radius: 12px;
  padding: 3px;
}

.segment-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.segment-item.active {
  background: #FFFFFF;
  color: #1C1C1E;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.subpage-body {
  flex: 1;
  padding: 4px 16px 40px;
}

/* 卡片与列表项 */
.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.section-caption {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 8px 8px;
}

.blocked-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid #F0F1F3;
}

.blocked-row.no-sep {
  border-bottom: none;
}

.rec-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rec-number {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
}

.rec-sub {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slot-badge {
  font-size: 11px;
  color: #8E8E93;
  background: #F2F3F5;
  padding: 1px 6px;
  border-radius: 4px;
}

.rec-loc {
  font-size: 13px;
  color: #8E8E93;
}

.rec-date {
  font-size: 13px;
  color: #8E8E93;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  min-height: 52px;
  border-bottom: 0.5px solid #F0F1F3;
  box-sizing: border-box;
}

.settings-row.no-sep {
  border-bottom: none;
}

.row-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.with-sub,
.label-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-sub {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.4;
}

.chevron-item {
  cursor: pointer;
}

.chevron-item:active {
  background-color: #F8F9FA;
}

.right-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-count {
  font-size: 14px;
  color: #8E8E93;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-text {
  font-size: 15px;
  color: #8E8E93;
}

.bottom-action-bar {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: calc(var(--safe-bottom, 20px) + 12px);
}

.main-add-btn {
  width: 100%;
  height: 50px;
  border-radius: 25px;
  background: #00C853;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 200, 83, 0.25);
}

.main-add-btn:active {
  background: #00B248;
}

/* 弹窗 */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.action-sheet-card {
  width: 100%;
  background: #F8F9FA;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px 16px calc(var(--safe-bottom, 20px) + 16px);
  box-sizing: border-box;
}

.sheet-title {
  font-size: 17px;
  font-weight: 700;
  color: #1C1C1E;
  text-align: center;
  margin-bottom: 16px;
}

.sheet-options {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

.sheet-radio-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
}

.sheet-radio-row:last-child {
  border-bottom: none;
}

.sheet-radio-row:active {
  background: #F2F3F5;
}

.sheet-label {
  font-size: 16px;
  color: #1C1C1E;
}

.custom-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #D1D1D6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.custom-radio.checked {
  border-color: #00C853;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #00C853;
}

.sheet-cancel-btn {
  width: 100%;
  height: 50px;
  background: #FFFFFF;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  border: none;
  cursor: pointer;
}

.alert-dialog-card {
  width: calc(100% - 48px);
  max-width: 320px;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 20px 18px;
  margin-bottom: auto;
  margin-top: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  text-align: center;
  margin-bottom: 18px;
}

.dialog-body {
  margin-bottom: 20px;
}

.dialog-input {
  width: 100%;
  height: 44px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 15px;
  color: #1C1C1E;
  outline: none;
  box-sizing: border-box;
}

.dialog-input:focus {
  border-color: #00C853;
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.dialog-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.dialog-btn.cancel {
  background: #F2F3F5;
  color: #555555;
}

.dialog-btn.confirm {
  background: #00C853;
  color: #FFFFFF;
}

.dialog-btn.confirm:disabled {
  background: #E0E2E5;
  color: #A0A4A8;
}
</style>
