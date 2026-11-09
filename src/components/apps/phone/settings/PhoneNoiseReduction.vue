<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'

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
    <GlassNavBar overlay title="全场景降噪" @back="emit('back')" />

    <div class="subpage-body scrollable">
      <!-- 顶部降噪模式说明卡片 -->
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

    <!-- 模式选择弹窗（规范 SheetOptionPicker） -->
    <SheetOptionPicker
      :visible="!!activeModal"
      :title="activeModal === 'system' ? '系统通话降噪' : '网络通话降噪'"
      :options="modeOptions.map(opt => ({ label: opt.label, value: opt.label, subtitle: opt.desc }))"
      :modelValue="activeModal === 'system' ? phoneStore.settings.noiseReductionSystem : phoneStore.settings.noiseReductionVoip"
      @pick="handleSelectMode"
      @close="activeModal = null"
    />
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F2;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-body {
  flex: 1;
  padding: calc(var(--nav-h) + 10px) 16px 40px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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
</style>
