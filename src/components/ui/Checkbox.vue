<script setup>
/**
 * 标准复选框控件 (Checkbox)
 * ==========================================
 * 依据真机实测（Infinix X6878 / Android 17 系统规范）：
 *   - 22px 圆角方形（圆角 6px），外边框 1.5px #D1D5DB；
 *   - 激活选中态：背景与边框均为 #0066FF，内部显示白色对勾 SVG；
 *   - 支持：v-model、独立 checked 属性、禁用态置灰。
 */
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: undefined },
  checked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const isChecked = computed(() => {
  if (props.modelValue !== undefined) {
    return props.modelValue
  }
  return props.checked
})

function onClick() {
  if (props.disabled) return
  const next = !isChecked.value
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <div
    class="checkbox-button"
    :class="{ checked: isChecked, disabled }"
    role="checkbox"
    :aria-checked="isChecked"
    @click="onClick"
  >
    <svg
      v-if="isChecked"
      class="check-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </div>
</template>

<style scoped>
.checkbox-button {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1.5px solid #D1D5DB;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  background: #FFFFFF;
}
.checkbox-button.checked {
  background: #0066FF;
  border-color: #0066FF;
}
.checkbox-button.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.check-icon {
  display: block;
}
</style>
