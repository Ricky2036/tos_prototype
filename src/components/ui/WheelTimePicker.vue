<script setup>
import TimeWheel from './TimeWheel.vue'
import { parseTimeValue } from '../../utils/timePicker.js'

/**
 * 兼容封装：保留历史 `v-model="'HH:mm'"` 与 `change` 事件，内部走标准滚轮 TimeWheel。
 * 时钟闹钟编辑是深色弹层且用 24 小时制，故 tone=dark / hourMode=24。
 * 新代码请直接用 `TimeWheel`。
 */
defineProps({ modelValue: { type: String, default: '07:00' } })
const emit = defineEmits(['update:modelValue', 'change'])

function onUpdate(value) {
  emit('update:modelValue', value)
  const { hour24, minute } = parseTimeValue(value)
  emit('change', { hour: hour24, minute, formatted: value })
}
</script>

<template>
  <TimeWheel
    :model-value="modelValue"
    :show-period="false"
    hour-mode="24"
    tone="dark"
    @update:model-value="onUpdate"
  />
</template>
