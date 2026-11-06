<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

const currentView = ref('main') // 'main' | 'simDetail'
const showAccountModal = ref(false)

function handleBack() {
  if (showAccountModal.value) {
    showAccountModal.value = false
    return
  }
  if (currentView.value === 'simDetail') {
    currentView.value = 'main'
    return
  }
  emit('back')
}

defineExpose({
  back() {
    if (showAccountModal.value) {
      showAccountModal.value = false
      return true
    }
    if (currentView.value === 'simDetail') {
      currentView.value = 'main'
      return true
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-subpage">
    <!-- 主界面：通话账号 -->
    <div v-if="currentView === 'main'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">通话账号</div>
      </div>

      <div class="subpage-body scrollable">
        <!-- 分组 1：设置 -->
        <div class="section-caption">设置</div>
        <div class="settings-card">
          <div class="settings-row chevron-item no-sep" @click="currentView = 'simDetail'">
            <div class="sim-left">
              <span class="sim-badge">SIM 1</span>
              <span class="row-label">中国电信</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 分组 2：拨打和接听电话 -->
        <div class="section-caption">拨打和接听电话</div>
        <div class="settings-card">
          <div class="settings-row chevron-item no-sep" @click="showAccountModal = true">
            <div class="label-col">
              <div class="row-label">选择通话账号</div>
              <div class="row-sub">{{ phoneStore.settings.carrierAccount }}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 四级子页：设置（中国电信） -->
    <div v-else-if="currentView === 'simDetail'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">设置（中国电信）</div>
      </div>

      <div class="subpage-body scrollable">
        <div class="settings-card">
          <div class="settings-row chevron-item">
            <div class="row-label">语音信箱</div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="settings-row item-switch">
            <div class="row-label">开启视频通话功能</div>
            <ToggleSwitch v-model="phoneStore.settings.carrierVideoCall" />
          </div>

          <div class="settings-row chevron-item">
            <div class="row-label">来电转接</div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="settings-row chevron-item">
            <div class="row-label">通话限制</div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="settings-row chevron-item no-sep">
            <div class="row-label">其他设置</div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 选择通话账号 Action Sheet -->
    <Transition name="fade">
      <div v-if="showAccountModal" class="modal-overlay" @click.self="showAccountModal = false">
        <div class="action-sheet-card">
          <div class="sheet-title">选择通话账号</div>
          <div class="sheet-options">
            <div
              v-for="opt in ['中国电信', '每次询问']"
              :key="opt"
              class="sheet-radio-row"
              @click="phoneStore.settings.carrierAccount = opt; showAccountModal = false"
            >
              <span class="sheet-label">{{ opt }}</span>
              <div class="custom-radio" :class="{ checked: phoneStore.settings.carrierAccount === opt }">
                <div v-if="phoneStore.settings.carrierAccount === opt" class="radio-inner"></div>
              </div>
            </div>
          </div>
          <button class="sheet-cancel-btn" @click="showAccountModal = false">取消</button>
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
}

.subpage-body {
  flex: 1;
  padding: 12px 16px 40px;
}

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

.sim-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sim-badge {
  font-size: 11px;
  font-weight: 600;
  color: #00C853;
  background: #E8F8EE;
  padding: 3px 8px;
  border-radius: 6px;
}

.label-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.row-sub {
  font-size: 13px;
  color: #8E8E93;
}

.chevron-item {
  cursor: pointer;
}

.chevron-item:active {
  background-color: #F8F9FA;
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
</style>
