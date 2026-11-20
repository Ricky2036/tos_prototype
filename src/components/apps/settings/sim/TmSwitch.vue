<script setup>
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'

/**
 * 流量管理里的开关：几何沿用全仓 ToggleSwitch（46×26 / 滑块 22），
 * 只把点亮色换成真机的 #2F6BF6（iOS 蓝 #007AFF 在这页偏亮）。
 */
defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  testid: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <span class="tm-switch" :data-testid="testid || undefined">
    <ToggleSwitch
      :model-value="modelValue"
      :disabled="disabled"
      color="blue"
      @update:model-value="v => emit('update:modelValue', v)"
    />
  </span>
</template>
