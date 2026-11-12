<script setup>
import { ref, computed } from 'vue'
import { PRESET_WIZARD_CONFIGS } from '../../../../stores/modesAndRoutinesStore.js'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import { getIconPath } from './modeIcons.js'

const props = defineProps({
  mode: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'start'])

const wizardConfig = computed(() => {
  return PRESET_WIZARD_CONFIGS[props.mode.id] || {
    title: props.mode.name,
    defaultOptionId: 'custom',
    options: [
      { id: 'custom', title: '自定义', items: [] }
    ]
  }
})

const selectedOptionId = ref(wizardConfig.value.defaultOptionId || wizardConfig.value.options[0]?.id || 'custom')

function handleSelectOption(optId) {
  selectedOptionId.value = optId
}

function handleStart() {
  emit('start', selectedOptionId.value)
}
</script>

<template>
  <div class="preset-wizard-page">
    <GlassNavBar overlay title="" @back="emit('back')" />

    <div class="wizard-content-scrollable">
      <!-- 头部大图标与标题 -->
      <div class="wizard-header">
        <div class="wizard-icon-wrap" :style="{ color: mode.color || '#1B64DA' }">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path :d="getIconPath(mode.iconKey)" />
          </svg>
        </div>
        <h1 class="wizard-title">{{ wizardConfig.title }}</h1>
      </div>

      <!-- 选项卡片列表 -->
      <div class="options-container">
        <div
          v-for="opt in wizardConfig.options"
          :key="opt.id"
          class="option-card"
          :class="{ 'is-selected': selectedOptionId === opt.id }"
          @click="handleSelectOption(opt.id)"
        >
          <div class="option-header-row">
            <div class="custom-radio-circle" :class="{ 'is-active': selectedOptionId === opt.id }">
              <div v-if="selectedOptionId === opt.id" class="custom-radio-inner-dot"></div>
            </div>
            <div class="option-title">{{ opt.title }}</div>
          </div>

          <div v-if="opt.items && opt.items.length > 0" class="option-items-list">
            <div
              v-for="(item, idx) in opt.items"
              :key="idx"
              class="option-item-row"
            >
              • {{ item }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部固定开始按钮 -->
    <div class="wizard-bottom-bar">
      <button class="wizard-start-btn" @click="handleStart">
        开始
      </button>
    </div>
  </div>
</template>

<style scoped>
.preset-wizard-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  color: #18181B;
  z-index: 60;
  overflow: hidden;
  user-select: none;
}

.wizard-content-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 54px) 20px calc(var(--home-indicator-inset, 14px) + 90px);
}

.wizard-header {
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wizard-icon-wrap {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.wizard-title {
  font-size: 32px;
  font-weight: 700;
  color: #18181B;
  letter-spacing: -0.3px;
  margin: 0;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.option-card {
  background: #FFFFFF;
  border: 1.5px solid rgba(0, 0, 0, 0.06);
  border-radius: 24px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.option-card:active {
  transform: scale(0.99);
}

.option-card.is-selected {
  border-color: #1B64DA;
  box-shadow: 0 4px 16px rgba(27, 100, 218, 0.08);
}

.option-header-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.custom-radio-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #A1A1AA;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.custom-radio-circle.is-active {
  border-color: #1B64DA;
}

.custom-radio-inner-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #1B64DA;
}

.option-title {
  font-size: 18px;
  font-weight: 600;
  color: #18181B;
}

.option-items-list {
  margin-top: 12px;
  padding-left: 36px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.option-item-row {
  font-size: 14px;
  color: #52525B;
  line-height: 1.45;
}

.wizard-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: calc(var(--home-indicator-inset, 14px) + 20px);
  padding-top: 14px;
  display: flex;
  justify-content: center;
  background: linear-gradient(180deg, rgba(244, 245, 247, 0) 0%, rgba(244, 245, 247, 0.95) 30%, #F4F5F7 100%);
  z-index: 10;
}

.wizard-start-btn {
  min-width: 220px;
  padding: 14px 44px;
  background: #1B64DA;
  color: #FFFFFF;
  border: none;
  border-radius: 9999px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(27, 100, 218, 0.28);
  transition: transform 0.15s ease, background 0.15s ease;
}

.wizard-start-btn:active {
  transform: scale(0.97);
  background: #1656C0;
}
</style>
