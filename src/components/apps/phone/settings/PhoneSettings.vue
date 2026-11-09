<script setup>
import { ref, computed } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import { useSubPageNav } from '../../../../composables/useSubPageNav'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'
import '../../../../styles/layer-transitions.css'

import PhoneAutoRecord from './PhoneAutoRecord.vue'
import PhoneNoiseReduction from './PhoneNoiseReduction.vue'
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

// 统一层级导航状态机
const { activeSubView: subpage, isBack, openSubView, closeSubView } = useSubPageNav('main')
const subpageRef = ref(null)
const showVoiceBroadcastModal = ref(false)

const voiceBroadcastText = computed(() => {
  const v = phoneStore.settings.voiceBroadcast
  if (v === 'always') return '始终'
  if (v === 'headset') return '仅耳机'
  return '永不'
})

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
    if (subpage.value !== 'main') {
      return closeSubView()
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-page">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- 主设置列表（对齐真机分组卡片排布与系统规范悬浮玻璃导航） -->
      <div v-if="subpage === 'main'" key="main" class="subpage-view-pane settings-main-view">
        <GlassNavBar overlay title="设置" @back="emit('back')" />

        <div class="settings-list scrollable">
          <!-- 第 1 组卡片（4项）：自动通话录音、全场景降噪、AI 通话助手、Flash Call -->
          <div class="settings-group">
            <div class="setting-item-row" @click="openSubView('autoRecord')">
              <span class="item-title">自动通话录音</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="setting-item-row with-subtitle" @click="openSubView('noiseReduction')">
              <div class="title-sub-col">
                <span class="item-title">全场景降噪</span>
                <span class="item-subtitle">智能降低语音场景中的噪声。</span>
              </div>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="setting-item-row" @click="openSubView('aiAssistant')">
              <div class="title-with-badge">
                <span class="item-title">AI 通话助手</span>
                <span class="red-badge-dot"></span>
              </div>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="setting-item-row no-sep" @click="openSubView('flashCall')">
              <span class="item-title">Flash Call</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- 第 2 组卡片（7项）：骚扰拦截、陌生号码识别、SIM 卡与网络设置、声音与振动、来电语音播报、来电显示、我的视频秀 -->
          <div class="settings-group">
            <div class="setting-item-row" @click="openSubView('block')">
              <span class="item-title">骚扰拦截</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="setting-item-row" @click="openSubView('unknownId')">
              <span class="item-title">陌生号码识别</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="setting-item-row" data-action="open-system-sim" @click="emit('openSystemSettings', 'sim')">
              <span class="item-title">SIM 卡与网络设置</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="setting-item-row" data-action="open-system-sound" @click="emit('openSystemSettings', 'sound')">
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

            <div class="setting-item-row" @click="openSubView('callDisplay')">
              <span class="item-title">来电显示</span>
              <div class="right-summary">
                <span class="summary-text">{{ phoneStore.callDisplayMode === 'banner' ? '弹窗显示' : '全屏显示' }}</span>
                <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                  <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="setting-item-row no-sep" @click="openSubView('videoShow')">
              <span class="item-title">我的视频秀</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>

          <!-- 第 3 组卡片（3项）：高级设置、运营商功能、关于 -->
          <div class="settings-group">
            <div class="setting-item-row" @click="openSubView('advanced')">
              <span class="item-title">高级设置</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="setting-item-row" @click="openSubView('carrier')">
              <span class="item-title">运营商功能</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="setting-item-row no-sep" @click="openSubView('about')">
              <span class="item-title">关于</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 各子页面动态挂载 -->
      <PhoneAutoRecord ref="subpageRef" v-else-if="subpage === 'autoRecord'" key="autoRecord" class="subpage-view-pane" @back="closeSubView" />
      <PhoneNoiseReduction ref="subpageRef" v-else-if="subpage === 'noiseReduction'" key="noiseReduction" class="subpage-view-pane" @back="closeSubView" />
      <PhoneAiAssistant ref="subpageRef" v-else-if="subpage === 'aiAssistant'" key="aiAssistant" class="subpage-view-pane" @back="closeSubView" />
      <PhoneFlashCallSettings ref="subpageRef" v-else-if="subpage === 'flashCall'" key="flashCall" class="subpage-view-pane" @back="closeSubView" />
      <PhoneHarassmentInterception ref="subpageRef" v-else-if="subpage === 'block'" key="block" class="subpage-view-pane" @back="closeSubView" />
      <PhoneUnknownId ref="subpageRef" v-else-if="subpage === 'unknownId'" key="unknownId" class="subpage-view-pane" @back="closeSubView" />
      <PhoneCallDisplayModal ref="subpageRef" v-else-if="subpage === 'callDisplay'" key="callDisplay" class="subpage-view-pane" @back="closeSubView" />
      <PhoneVideoShow ref="subpageRef" v-else-if="subpage === 'videoShow'" key="videoShow" class="subpage-view-pane" @back="closeSubView" />
      <PhoneAdvancedSettings ref="subpageRef" v-else-if="subpage === 'advanced'" key="advanced" class="subpage-view-pane" @back="closeSubView" />
      <PhoneCarrierFeatures ref="subpageRef" v-else-if="subpage === 'carrier'" key="carrier" class="subpage-view-pane" @back="closeSubView" />
      <PhoneAbout ref="subpageRef" v-else-if="subpage === 'about'" key="about" class="subpage-view-pane" @back="closeSubView" />
    </Transition>

    <!-- 来电语音播报选择弹窗（规范 SheetOptionPicker） -->
    <SheetOptionPicker
      :visible="showVoiceBroadcastModal"
      title="来电语音播报"
      :options="[
        { label: '永不', value: 'never' },
        { label: '仅耳机', value: 'headset' },
        { label: '始终', value: 'always' }
      ]"
      v-model="phoneStore.settings.voiceBroadcast"
      @close="showVoiceBroadcastModal = false"
    />
  </div>
</template>

<style scoped>
.phone-settings-page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F2;
  z-index: 55;
  display: flex;
  flex-direction: column;
}

.settings-main-view {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

.settings-list {
  flex: 1;
  padding: calc(var(--nav-h) + 10px) 16px 40px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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

.title-sub-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.item-subtitle {
  font-size: 13px;
  color: #8E8E93;
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
</style>
