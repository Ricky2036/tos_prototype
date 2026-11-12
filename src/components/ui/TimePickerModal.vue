<script setup>
import TimePickerSheet from './TimePickerSheet.vue'

/**
 * 兼容封装：保留历史 props / emits，内部一律走标准控件 TimePickerSheet。
 * ⚠️ 旧实现是深色 #1c1c1e + 橙色按钮，与真机浅色弹层不符；礼拜模式等旧调用方
 *    无需改动即可自动适配浅色。新代码请直接用 `TimePickerSheet`。
 */
defineProps({
  title: { type: String, default: '选择时间' },
  modelValue: { type: String, default: '07:00' },
  confirmText: { type: String, default: '确定' }
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])
</script>

<template>
  <TimePickerSheet
    :visible="true"
    :title="title"
    :model-value="modelValue"
    :confirm-text="confirmText"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="emit('confirm', $event)"
    @cancel="emit('cancel')"
  />
</template>
