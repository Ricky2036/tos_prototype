<script setup>
import { ref, computed } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import PhoneAutoRecord from './PhoneAutoRecord.vue'
import PhoneAiAssistant from './PhoneAiAssistant.vue'
import PhoneFlashCallSettings from './PhoneFlashCallSettings.vue'
import PhoneHarassmentInterception from './PhoneHarassmentInterception.vue'
import PhoneUnknownId from './PhoneUnknownId.vue'
import PhoneCallDisplayModal from './PhoneCallDisplayModal.vue'
import PhoneVideoShow from './PhoneVideoShow.vue'
import PhoneAdvancedSettings from './PhoneAdvancedSettings.vue'
import PhoneCarrierFeatures from './PhoneCarrierFeatures.vue'
import PhoneAbout from './PhoneAbout.vue'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back', 'openSystemSettings'])

// 内部设置子页面导航栈
const subpage = ref(null) // null | 'autoRecord' | 'aiAssistant' | 'flashCall' | 'block' | 'unknownId' | 'callDisplay' | 'videoShow' | 'advanced' | 'carrier' | 'about'
const subpageRef = ref(null)
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
    // 若子页面有更深层级的返回操作，优先让子页面处理
    if (subpageRef.value && typeof subpageRef.value.back === 'function') {
      const handled = subpageRef.value.back()
      if (handled) return true
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

          <div class="setting-item-row no-sep" @click="subpage = 'flashCall'">
            <span class="item-title">Flash Call</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 第 2 组卡片（7项）：骚扰拦截、陌生号码识别、SIM 卡与网络设置、声音与振动、来电语音播报、来电显示、我的视频秀 -->
        <div class="settings-group">
          <div class="setting-item-row" @click="subpage = 'block'">
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

          <div class="setting-item-row no-sep" @click="subpage = 'videoShow'">
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

          <div class="setting-item-row" @click="subpage = 'carrier'">
            <span class="item-title">运营商功能</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="setting-item-row no-sep" @click="subpage = 'about'">
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
      <PhoneAutoRecord ref="subpageRef" v-if="subpage === 'autoRecord'" @back="handleSubpageBack" />
      <PhoneAiAssistant ref="subpageRef" v-else-if="subpage === 'aiAssistant'" @back="handleSubpageBack" />
      <PhoneFlashCallSettings ref="subpageRef" v-else-if="subpage === 'flashCall'" @back="handleSubpageBack" />
      <PhoneHarassmentInterception ref="subpageRef" v-else-if="subpage === 'block'" @back="handleSubpageBack" />
      <PhoneUnknownId ref="subpageRef" v-else-if="subpage === 'unknownId'" @back="handleSubpageBack" />
      <PhoneCallDisplayModal ref="subpageRef" v-else-if="subpage === 'callDisplay'" @back="handleSubpageBack" />
      <PhoneVideoShow ref="subpageRef" v-else-if="subpage === 'videoShow'" @back="handleSubpageBack" />
      <PhoneAdvancedSettings ref="subpageRef" v-else-if="subpage === 'advanced'" @back="handleSubpageBack" />
      <PhoneCarrierFeatures ref="subpageRef" v-else-if="subpage === 'carrier'" @back="handleSubpageBack" />
      <PhoneAbout ref="subpageRef" v-else-if="subpage === 'about'" @back="handleSubpageBack" />
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
                { label: '永不', value: 'never' },
                { label: '仅耳机', value: 'headset' },
                { label: '始终', value: 'always' }
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
  padding: 12px 16px 40px;
}

/* 白色卡片分组 */
.settings-group {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.setting-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  min-height: 52px;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
  box-sizing: border-box;
}

.setting-item-row.no-sep {
  border-bottom: none;
}

.setting-item-row:active {
  background-color: #F8F9FA;
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
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #FF3B30;
}

.right-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-text {
  font-size: 14px;
  color: #8E8E93;
}

.chevron-icon {
  flex-shrink: 0;
}

/* 弹窗遮罩 */
.settings-modal-overlay {
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

.settings-action-sheet {
  width: 100%;
  background: #F8F9FA;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px 16px calc(var(--safe-bottom, 20px) + 16px);
  box-sizing: border-box;
}

.sheet-modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1C1C1E;
  text-align: center;
  margin-bottom: 16px;
}

.sheet-options-list {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

.sheet-radio-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
}

.sheet-radio-item:last-child {
  border-bottom: none;
}

.sheet-radio-item:active {
  background: #F2F3F5;
}

.sheet-option-label {
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

.sheet-cancel-btn:active {
  background: #F2F3F5;
}

/* 切换动画 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0.8;
}

.slide-leave-to {
  transform: translateX(-20%);
  opacity: 0;
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
