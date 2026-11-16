<script setup>
/**
 * 标准单选框控件 (RadioButton)
 * ==========================================
 * 依据真机实测（Infinix X6878 / Android 17 系统规范）：
 *   - 直径 20px，外圈边框 2px #D1D5DB；
 *   - 激活选中态：外圈 #0066FF，中心实心蓝点 10px #0066FF；
 *   - 支持：v-model、独立 checked 属性、禁用态置灰。
 */
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: undefined },
  value: { type: [String, Number, Boolean], default: undefined },
  checked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const isChecked = computed(() => {
  if (props.modelValue !== undefined && props.value !== undefined) {
    return props.modelValue === props.value
  }
  return props.checked
})

function onClick() {
  if (props.disabled) return
  if (props.value !== undefined) {
    emit('update:modelValue', props.value)
    emit('change', props.value)
  }
}
</script>

<template>
  <div
    class="radio-button"
    :class="{ checked: isChecked, disabled }"
    role="radio"
    :aria-checked="isChecked"
    @click="onClick"
  >
    <div v-if="isChecked" class="radio-core"></div>
  </div>
</template>

<style scoped>
.radio-button {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #D1D5DB;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}
.radio-button.checked {
  border-color: #0066FF;
}
.radio-button.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.radio-core {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #0066FF;
}
</style>
