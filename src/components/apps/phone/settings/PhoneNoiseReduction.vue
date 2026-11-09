<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

const activeModal = ref(null) // null | 'system' | 'voip'

const modeOptions = [
  { label: '关闭', desc: '不启用降噪处理' },
  { label: '标准降噪', desc: '通用降噪模式，保留部分自然环境声' },
  { label: '深度降噪', desc: '强力过滤背景风噪与嘈杂环境音' }
]

function handleSelectMode(mode) {
  if (activeModal.value === 'system') {
    phoneStore.settings.noiseReductionSystem = mode
  } else if (activeModal.value === 'voip') {
    phoneStore.settings.noiseReductionVoip = mode
  }
  activeModal.value = null
}

defineExpose({
  back() {
    if (activeModal.value) {
      activeModal.value = null
      return true
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-subpage">
    <div class="subpage-header">
      <button class="back-btn" title="返回" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="header-title">全场景降噪</div>
    </div>

    <div class="subpage-body scrollable">
      <!-- 顶部降噪模式说明卡片（对齐真机 1:1 结构） -->
      <div class="noise-hero-card">
        <div class="sound-wave-graphic">
          <div class="wave-bar h-1"></div>
          <div class="wave-bar h-2"></div>
          <div class="wave-bar h-3"></div>
          <div class="wave-bar h-4"></div>
          <div class="wave-bar h-5"></div>
          <div class="wave-bar h-4"></div>
          <div class="wave-bar h-3"></div>
          <div class="wave-bar h-2"></div>
          <div class="wave-bar h-1"></div>
        </div>
        <div class="hero-mode-title">{{ phoneStore.settings.noiseReductionSystem }}</div>
        <div class="hero-mode-desc">通用降噪模式，保留部分环境声。</div>
      </div>

      <!-- 降噪模式分组 -->
      <div class="section-caption">降噪模式</div>
      <div class="settings-card">
        <div class="settings-row chevron-item" @click="activeModal = 'system'">
          <div class="row-label">系统通话</div>
          <div class="right-summary">
            <span class="summary-text">{{ phoneStore.settings.noiseReductionSystem }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <div class="settings-row chevron-item no-sep" @click="activeModal = 'voip'">
          <div class="row-label">网络通话</div>
          <div class="right-summary">
            <span class="summary-text">{{ phoneStore.settings.noiseReductionVoip }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 模式选择弹窗 -->
    <Transition name="fade">
      <div v-if="activeModal" class="modal-overlay" @click.self="activeModal = null">
        <div class="action-sheet-card">
          <div class="sheet-title">{{ activeModal === 'system' ? '系统通话降噪' : '网络通话降噪' }}</div>
          <div class="sheet-options">
            <div
              v-for="opt in modeOptions"
              :key="opt.label"
              class="sheet-radio-row"
              @click="handleSelectMode(opt.label)"
            >
              <div class="radio-label-col">
                <span class="sheet-label">{{ opt.label }}</span>
                <span class="sheet-sub">{{ opt.desc }}</span>
              </div>
              <div
                class="custom-radio"
                :class="{
                  checked: (activeModal === 'system' ? phoneStore.settings.noiseReductionSystem : phoneStore.settings.noiseReductionVoip) === opt.label
                }"
              >
                <div
                  v-if="(activeModal === 'system' ? phoneStore.settings.noiseReductionSystem : phoneStore.settings.noiseReductionVoip) === opt.label"
                  class="radio-inner"
                ></div>
              </div>
            </div>
          </div>
          <button class="sheet-cancel-btn" @click="activeModal = null">取消</button>
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

.noise-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 16px 24px;
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.sound-wave-graphic {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 48px;
  margin-bottom: 16px;
}

.wave-bar {
  width: 4px;
  background: #00C853;
  border-radius: 2px;
}

.h-1 { height: 12px; }
.h-2 { height: 24px; }
.h-3 { height: 36px; }
.h-4 { height: 44px; }
.h-5 { height: 48px; }

.hero-mode-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 6px;
}

.hero-mode-desc {
  font-size: 13px;
  color: #8E8E93;
}

.section-caption {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 8px 8px;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
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

.summary-text {
  font-size: 14px;
  color: #8E8E93;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
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
  padding: 14px 16px;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
}

.sheet-radio-row:last-child {
  border-bottom: none;
}

.sheet-radio-row:active {
  background: #F2F3F5;
}

.radio-label-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sheet-label {
  font-size: 16px;
  color: #1C1C1E;
}

.sheet-sub {
  font-size: 12px;
  color: #8E8E93;
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
