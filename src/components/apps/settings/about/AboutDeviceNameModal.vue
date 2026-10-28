<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'close'])

const inputVal = ref(props.modelValue)
const inputRef = ref(null)

onMounted(async () => {
  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
})

function handleClear() {
  inputVal.value = ''
  inputRef.value?.focus()
}

function handleSave() {
  const trimmed = inputVal.value.trim()
  if (!trimmed) return
  emit('save', trimmed)
}
</script>

<template>
  <div class="name-modal-mask" @click.self="emit('close')">
    <div class="name-modal-card" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div class="modal-title">设备名称</div>
        <div class="modal-desc">其他设备在蓝牙、个人热点或跨端互联时将显示此名称。</div>
      </div>

      <div class="input-wrapper">
        <input
          ref="inputRef"
          v-model="inputVal"
          class="name-input"
          type="text"
          maxlength="32"
          placeholder="请输入设备名称"
          @keydown.enter="handleSave"
        />
        <button
          v-if="inputVal"
          class="clear-btn"
          aria-label="清空输入"
          type="button"
          @click="handleClear"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.4" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="char-count">{{ inputVal.length }} / 32</div>

      <div class="modal-actions">
        <button class="btn-cancel" type="button" @click="emit('close')">
          取消
        </button>
        <button
          class="btn-save"
          type="button"
          :disabled="!inputVal.trim()"
          @click="handleSave"
        >
          确定
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.name-modal-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  z-index: 1000;
  animation: modalMaskIn 0.2s cubic-bezier(0.2, 0.9, 0.4, 1);
}

@keyframes modalMaskIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.name-modal-card {
  width: 100%;
  max-width: 320px;
  background: #FFFFFF;
  border-radius: 22px;
  padding: 22px 20px 18px 20px;
  box-sizing: border-box;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
  animation: modalCardIn 0.22s cubic-bezier(0.18, 0.89, 0.32, 1.25);
}

@keyframes modalCardIn {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  margin-bottom: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #111111;
  letter-spacing: -0.2px;
  margin-bottom: 6px;
}

.modal-desc {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.45;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #F4F5F7;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: border-color 0.15s ease, background 0.15s ease;
}

.input-wrapper:focus-within {
  background: #FFFFFF;
  border-color: #0077FF;
  box-shadow: 0 0 0 3px rgba(0, 119, 255, 0.12);
}

.name-input {
  width: 100%;
  height: 44px;
  padding: 0 38px 0 14px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #111111;
  font-family: inherit;
  box-sizing: border-box;
  outline: none;
}

.clear-btn {
  position: absolute;
  right: 8px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: background 0.12s ease;
}

.clear-btn:active {
  background: #D1D5DB;
}

.char-count {
  font-size: 12px;
  color: #8E8E93;
  text-align: right;
  margin-top: 6px;
  margin-bottom: 16px;
  font-variant-numeric: tabular-nums;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.btn-cancel,
.btn-save {
  flex: 1;
  height: 42px;
  border-radius: 12px;
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease, background 0.15s ease, opacity 0.15s ease;
}

.btn-cancel {
  background: #F4F5F7;
  color: #3A3A3C;
}

.btn-cancel:active {
  background: #E5E7EB;
  transform: scale(0.98);
}

.btn-save {
  background: #0077FF;
  color: #FFFFFF;
}

.btn-save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-save:not(:disabled):active {
  background: #0066DD;
  transform: scale(0.98);
}
</style>
