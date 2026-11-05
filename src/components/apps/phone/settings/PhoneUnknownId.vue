<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

const isUpdating = ref(false)
const updateSuccess = ref(false)

function handleUpdateNow() {
  if (isUpdating.value) return
  isUpdating.value = true
  setTimeout(() => {
    isUpdating.value = false
    updateSuccess.value = true
    setTimeout(() => {
      updateSuccess.value = false
    }, 2000)
  }, 1200)
}
</script>

<template>
  <div class="phone-settings-subpage">
    <div class="subpage-header">
      <button class="back-btn" @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="header-title">陌生号码识别</div>
    </div>

    <div class="subpage-body scrollable">
      <!-- 顶部插画卡片 -->
      <div class="id-hero-card">
        <div class="mockup-frame">
          <div class="mockup-screen">
            <div class="spam-title">广告推销</div>
            <div class="spam-sub">99 人标记</div>
            <div class="spam-number">123 456 XXXX</div>
            <div class="mockup-call-actions">
              <div class="action-circle red"></div>
              <div class="action-circle white"></div>
              <div class="action-circle green"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 智能识别主开关 -->
      <div class="settings-row item-switch with-sub">
        <div class="label-col">
          <div class="row-label">智能识别陌生号码</div>
          <div class="row-sub">识别通话、短信中的陌生号码。</div>
        </div>
        <ToggleSwitch v-model="phoneStore.settings.unknownId" />
      </div>

      <template v-if="phoneStore.settings.unknownId">
        <!-- 电话与短信 -->
        <div class="settings-row item-switch">
          <div class="row-label">电话与短信</div>
          <ToggleSwitch v-model="phoneStore.settings.unknownPhoneSms" />
        </div>

        <!-- WhatsApp 通话 -->
        <div class="settings-row item-switch">
          <div class="row-label">WhatsApp 通话</div>
          <ToggleSwitch v-model="phoneStore.settings.unknownWhatsApp" />
        </div>

        <!-- 弹窗提醒 -->
        <div class="settings-row item-switch with-sub">
          <div class="label-col">
            <div class="row-label">弹窗提醒</div>
            <div class="row-sub">接听陌生号码后，自动弹出弹窗。</div>
          </div>
          <ToggleSwitch v-model="phoneStore.settings.unknownPopup" />
        </div>

        <!-- 自动更新数据 -->
        <div class="settings-row chevron-item">
          <div class="row-label">自动更新数据</div>
          <div class="value-right">
            <span class="value-text">仅在 WLAN 下备份恢复数据</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 立即更新 -->
        <div class="settings-row chevron-item" @click="handleUpdateNow">
          <div class="row-label">立即更新</div>
          <div class="value-right">
            <span v-if="isUpdating" class="value-text">正在检查更新...</span>
            <span v-else-if="updateSuccess" class="value-text text-green">已是最新数据库</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FFFFFF;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-header {
  display: flex;
  align-items: center;
  padding-top: calc(var(--safe-top, 54px) + 8px);
  padding-bottom: 12px;
  padding-left: 16px;
  padding-right: 16px;
  gap: 12px;
  background: #FFFFFF;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
}

.back-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
}

.subpage-body {
  flex: 1;
  padding: 16px 20px 40px;
}

/* 顶部插画卡片 */
.id-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 20px;
  background: #F9FAFB;
  border-radius: 20px;
  margin-bottom: 24px;
}

.mockup-frame {
  width: 140px;
  height: 200px;
  border: 3px solid #D1D5DB;
  border-radius: 24px;
  padding: 24px 12px 16px;
  background: #FFFFFF;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.mockup-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.spam-title {
  font-size: 15px;
  font-weight: 700;
  color: #EF4444;
  margin-bottom: 4px;
}

.spam-sub {
  font-size: 10px;
  color: #9CA3AF;
  margin-bottom: 6px;
}

.spam-number {
  font-size: 11px;
  color: #4B5563;
  margin-bottom: auto;
}

.mockup-call-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
}

.action-circle.red { background: #EF4444; }
.action-circle.white { background: #E5E7EB; }
.action-circle.green { background: #10B981; }

/* 设置列表行 */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
}

.with-sub {
  align-items: flex-start;
}

.label-col {
  flex: 1;
}

.row-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.row-sub {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 4px;
}

.chevron-item {
  cursor: pointer;
}

.value-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.value-text {
  font-size: 13px;
  color: #8E8E93;
}

.text-green {
  color: #00C853;
  font-weight: 500;
}
</style>
