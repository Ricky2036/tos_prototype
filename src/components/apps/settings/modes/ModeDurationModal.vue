<script setup>
import { ref } from 'vue'

const props = defineProps({
  currentDuration: {
    type: String,
    default: '直到我将其关闭'
  }
})

const emit = defineEmits(['close', 'select'])

const options = [
  '直到我将其关闭',
  '1 小时',
  '2 小时',
  '3 小时',
  '自定义时间'
]

const selected = ref(props.currentDuration || '直到我将其关闭')

function handleConfirm() {
  emit('select', selected.value)
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-sheet">
      <div class="sheet-header">
        <h2 class="sheet-title">持续时间</h2>
      </div>

      <div class="sheet-body">
        <div class="options-list">
          <div
            v-for="opt in options"
            :key="opt"
            class="duration-option-row"
            @click="selected = opt"
          >
            <span class="option-text">{{ opt }}</span>
            <div class="radio-indicator">
              <div v-if="selected === opt" class="radio-dot"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="sheet-bottom-actions">
        <button class="sheet-btn btn-ghost" @click="emit('close')">
          取消
        </button>
        <button class="sheet-btn btn-primary" @click="handleConfirm">
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  user-select: none;
}

.modal-sheet {
  background: #F4F5F7;
  border-top-left-radius: 26px;
  border-top-right-radius: 26px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.sheet-header {
  padding: 24px 20px 12px;
}

.sheet-title {
  font-size: 20px;
  font-weight: 700;
  color: #18181B;
  margin: 0;
}

.sheet-body {
  padding: 8px 20px 20px;
}

.options-list {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.duration-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background 0.15s ease;
}

.duration-option-row:last-child {
  border-bottom: none;
}

.duration-option-row:active {
  background: #FAFAFA;
}

.option-text {
  font-size: 15px;
  font-weight: 500;
  color: #18181B;
}

.radio-indicator {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #D4D4D8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1B64DA;
}

.sheet-bottom-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px calc(var(--home-indicator-inset, 14px) + 14px);
  background: #FFFFFF;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.sheet-btn {
  flex: 1;
  padding: 12px;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-ghost {
  background: transparent;
  color: #71717A;
  margin-right: 12px;
}

.btn-primary {
  background: #1B64DA;
  color: #FFFFFF;
}
</style>
