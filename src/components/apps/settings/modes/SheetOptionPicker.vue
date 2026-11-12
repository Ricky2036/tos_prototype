<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true
  },
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'cancel', 'confirm'])

const selectedOption = ref(props.modelValue || props.options[0] || '')

function handleSelect(opt) {
  selectedOption.value = opt
}

function handleConfirm() {
  emit('update:modelValue', selectedOption.value)
  emit('confirm', selectedOption.value)
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <div class="option-picker-mask" @click.self="handleCancel">
    <div class="option-picker-sheet">
      <div class="picker-header">
        <h3 class="picker-title">{{ title }}</h3>
      </div>

      <div class="picker-options-list">
        <div
          v-for="opt in options"
          :key="opt"
          class="picker-option-row"
          @click="handleSelect(opt)"
        >
          <div class="custom-radio-circle" :class="{ 'is-active': selectedOption === opt }">
            <div v-if="selectedOption === opt" class="custom-radio-inner-dot"></div>
          </div>
          <span class="picker-option-text">{{ opt }}</span>
        </div>
      </div>

      <div class="picker-bottom-bar">
        <button class="picker-action-btn cancel-btn" @click="handleCancel">
          取消
        </button>
        <div class="picker-btn-divider"></div>
        <button class="picker-action-btn confirm-btn" @click="handleConfirm">
          完成
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.option-picker-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: pickerFadeIn 0.2s ease-out;
}

@keyframes pickerFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.option-picker-sheet {
  width: 100%;
  max-width: 440px;
  background: #FFFFFF;
  border-radius: 28px 28px 0 0;
  padding: 24px 20px calc(var(--home-indicator-inset, 14px) + 16px);
  box-sizing: border-box;
  animation: sheetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
}

@keyframes sheetSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.picker-header {
  margin-bottom: 18px;
  padding: 0 4px;
}

.picker-title {
  font-size: 20px;
  font-weight: 700;
  color: #18181B;
  margin: 0;
}

.picker-options-list {
  display: flex;
  flex-direction: column;
  max-height: 380px;
  overflow-y: auto;
  margin-bottom: 24px;
}

.picker-option-row {
  display: flex;
  align-items: center;
  padding: 14px 6px;
  cursor: pointer;
  border-radius: 12px;
  transition: background-color 0.15s ease;
}

.picker-option-row:active {
  background-color: #F4F5F7;
}

.custom-radio-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #A1A1AA;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
  box-sizing: border-box;
  transition: all 0.18s ease;
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

.picker-option-text {
  font-size: 16px;
  color: #18181B;
  font-weight: 500;
}

.picker-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.picker-action-btn {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 10px 0;
  text-align: center;
  transition: opacity 0.15s ease;
}

.picker-action-btn:active {
  opacity: 0.6;
}

.cancel-btn {
  color: #71717A;
}

.confirm-btn {
  color: #1B64DA;
}

.picker-btn-divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.08);
}
</style>
