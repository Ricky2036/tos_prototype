<script setup>
import { ref, computed } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import PhoneAutoRecord from './PhoneAutoRecord.vue'
import PhoneAiAssistant from './PhoneAiAssistant.vue'
import PhoneFlashCallSettings from './PhoneFlashCallSettings.vue'
import PhoneUnknownId from './PhoneUnknownId.vue'
import PhoneCallDisplayModal from './PhoneCallDisplayModal.vue'
import PhoneAdvancedSettings from './PhoneAdvancedSettings.vue'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back', 'openSystemSettings'])

// 内部设置子页面导航栈
const subpage = ref(null) // null | 'autoRecord' | 'aiAssistant' | 'flashCall' | 'unknownId' | 'callDisplay' | 'advanced' | 'about'
const showVoiceBroadcastModal = ref(false)

const voiceBroadcastText = computed(() => {
  const v = phoneStore.settings.voiceBroadcast
  if (v === 'always') return '始终'
  if (v === 'headset') return '仅耳机'
  return '永不'
})

function handleSubpageBack() {
  subpage.value = null
}

defineExpose({
  back() {
    if (showVoiceBroadcastModal.value) {
      showVoiceBroadcastModal.value = false
      return true
    }
    if (subpage.value) {
      subpage.value = null
      return true
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-page">
    <!-- 主设置列表（100% 对齐真机三组白卡片排布与白色圆泡返回键） -->
    <div v-if="!subpage" class="settings-main-view">
      <div class="settings-header">
        <button class="back-btn" title="返回" @click="emit('back')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">设置</div>
      </div>

      <div class="settings-list scrollable">
        <!-- 第 1 组卡片（3项）：自动通话录音、AI 通话助手（红点）、Flash Call -->
        <div class="settings-group">
          <div class="setting-item-row" @click="subpage = 'autoRecord'">
            <span class="item-title">自动通话录音</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="setting-item-row" @click="subpage = 'aiAssistant'">
            <div class="title-with-badge">
              <span class="item-title">AI 通话助手</span>
              <span class="red-badge-dot"></span>
            </div>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="setting-item-row" @click="subpage = 'flashCall'">
            <span class="item-title">Flash Call</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 第 2 组卡片（7项）：骚扰拦截、陌生号码识别、SIM 卡与网络设置、声音与振动、来电语音播报、来电显示、我的视频秀 -->
        <div class="settings-group">
          <div class="setting-item-row" @click="subpage = 'unknownId'">
            <span class="item-title">骚扰拦截</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="setting-item-row" @click="subpage = 'unknownId'">
            <span class="item-title">陌生号码识别</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="setting-item-row" @click="emit('openSystemSettings', 'sim')">
            <span class="item-title">SIM 卡与网络设置</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="setting-item-row" @click="emit('openSystemSettings', 'sound')">
            <span class="item-title">声音与振动</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="setting-item-row" @click="showVoiceBroadcastModal = true">
            <span class="item-title">来电语音播报</span>
            <div class="right-summary">
              <span class="summary-text">{{ voiceBroadcastText }}</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <div class="setting-item-row" @click="subpage = 'callDisplay'">
            <span class="item-title">来电显示</span>
            <div class="right-summary">
              <span class="summary-text">{{ phoneStore.callDisplayMode === 'banner' ? '弹窗显示' : '全屏显示' }}</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <div class="setting-item-row">
            <span class="item-title">我的视频秀</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 第 3 组卡片（3项）：高级设置、运营商功能、关于 -->
        <div class="settings-group">
          <div class="setting-item-row" @click="subpage = 'advanced'">
            <span class="item-title">高级设置</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="setting-item-row">
            <span class="item-title">运营商功能</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="setting-item-row" @click="subpage = 'about'">
            <span class="item-title">关于</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 各子页面动态挂载 -->
    <Transition name="slide">
      <PhoneAutoRecord v-if="subpage === 'autoRecord'" @back="handleSubpageBack" />
      <PhoneAiAssistant v-else-if="subpage === 'aiAssistant'" @back="handleSubpageBack" />
      <PhoneFlashCallSettings v-else-if="subpage === 'flashCall'" @back="handleSubpageBack" />
      <PhoneUnknownId v-else-if="subpage === 'unknownId'" @back="handleSubpageBack" />
      <PhoneCallDisplayModal v-else-if="subpage === 'callDisplay'" @back="handleSubpageBack" />
      <PhoneAdvancedSettings v-else-if="subpage === 'advanced'" @back="handleSubpageBack" />
      
      <!-- 关于页面 -->
      <div v-else-if="subpage === 'about'" class="about-page">
        <div class="settings-header">
          <button class="back-btn" @click="handleSubpageBack">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <div class="header-title">关于</div>
        </div>
        <div class="about-body">
          <div class="app-brand-logo">
            <svg width="54" height="54" viewBox="0 0 24 24" fill="#00C853">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
            </svg>
          </div>
          <div class="app-name">SmartCaller 电话</div>
          <div class="app-version">版本 17.0.0.87</div>
        </div>
      </div>
    </Transition>
    <!-- 来电语音播报选择弹窗 -->
    <Transition name="fade">
      <div
        v-if="showVoiceBroadcastModal"
        class="settings-modal-overlay"
        @click.self="showVoiceBroadcastModal = false"
      >
        <div class="settings-action-sheet">
          <div class="sheet-modal-title">来电语音播报</div>
          <div class="sheet-options-list">
            <div
              v-for="opt in [
                { label: '始终', value: 'always' },
                { label: '仅耳机', value: 'headset' },
                { label: '永不', value: 'never' }
              ]"
              :key="opt.value"
              class="sheet-radio-item"
              @click="phoneStore.settings.voiceBroadcast = opt.value; showVoiceBroadcastModal = false"
            >
              <span class="sheet-option-label">{{ opt.label }}</span>
              <div class="custom-radio" :class="{ checked: phoneStore.settings.voiceBroadcast === opt.value }">
                <div v-if="phoneStore.settings.voiceBroadcast === opt.value" class="radio-inner"></div>
              </div>
            </div>
          </div>
          <button class="sheet-cancel-btn" @click="showVoiceBroadcastModal = false">取消</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.phone-settings-page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F3;
  z-index: 55;
  display: flex;
  flex-direction: column;
}

.settings-main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 顶部 Header：白色正圆返回气泡按钮 + 20px 设置粗体标题 */
.settings-header {
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

.settings-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 40px;
}

/* 3 大卡片组规范：纯白圆角、规整间距、内缩细分割线 */
.settings-group {
  background: #FFFFFF;
  border-radius: 18px;
  margin: 0 16px 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.setting-item-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  cursor: pointer;
  background: #FFFFFF;
  transition: background-color 0.12s ease;
}

.setting-item-row:active {
  background-color: #F8F9FA;
}

.setting-item-row:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 0.5px;
  background: rgba(0, 0, 0, 0.06);
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.red-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FF3B30;
}

.right-summary {
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-text {
  font-size: 14px;
  color: #8E8E93;
}

.chevron-icon {
  flex-shrink: 0;
}

/* 关于页面 */
.about-page {
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

.about-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 100px;
}

.app-brand-logo {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  background: #F0FDF4;
  border: 1px solid rgba(0, 200, 83, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 6px;
}

.app-version {
  font-size: 13px;
  color: #8E8E93;
}

/* 底部操作弹窗样式 */
.settings-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(4px);
  z-index: 70;
  display: flex;
  align-items: flex-end;
}

.settings-action-sheet {
  width: 100%;
  background: #FFFFFF;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px 20px calc(var(--safe-bottom, 20px) + 16px);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.sheet-modal-title {
  font-size: 19px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 16px;
}

.sheet-options-list {
  display: flex;
  flex-direction: column;
}

.sheet-radio-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.sheet-radio-item:last-child {
  border-bottom: none;
}

.sheet-option-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.custom-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.8px solid #C7C7CC;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease;
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
  margin-top: 20px;
  width: 100%;
  height: 48px;
  border-radius: 24px;
  background-color: #F2F3F5;
  border: none;
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
  cursor: pointer;
}

.sheet-cancel-btn:active {
  background-color: #E5E7EB;
}
</style>
