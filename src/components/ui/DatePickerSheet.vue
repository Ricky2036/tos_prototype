<script setup>
import { ref, watch, computed } from 'vue'
import SheetModal from './SheetModal.vue'
import DateWheel from './DateWheel.vue'
import { formatDateLabel, parseDateValue } from '../../utils/datePicker.js'

/**
 * 【全仓标准控件】底部日期选择弹层。
 *
 * 真机（Infinix X6878 / Android 17）：浅色悬浮卡片 +
 * 灰色标题「设置日期」+ 黑色当前值「2026年11月14日周六」+ 三列滚轮（年/月/日）+ 取消/确定两枚胶囊按钮。
 *
 * modelValue / confirm 格式支持 'YYYY-MM-DD' 或 'YYYY年M月D日'。
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '设置日期' },
  modelValue: { type: String, default: '2026-11-14' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  minYear: { type: Number, default: 1970 },
  maxYear: { type: Number, default: 2050 }
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'close'])

const draft = ref(props.modelValue || '2026-11-14')
watch(() => props.visible, (v) => {
  if (v) draft.value = props.modelValue || '2026-11-14'
})
watch(() => props.modelValue, (v) => {
  if (v && !props.visible) draft.value = v
})

const currentLabel = computed(() => {
  const { year, month, day } = parseDateValue(draft.value)
  return formatDateLabel(year, month, day)
})

function onConfirm() {
  emit('update:modelValue', draft.value)
  emit('confirm', draft.value)
  emit('close')
}
function onCancel() {
  emit('cancel')
  emit('close')
}
</script>

<template>
  <SheetModal :visible="visible" padding="16px 20px 18px" @close="onCancel">
    <div class="dps-title" data-dps-title>{{ title }}</div>
    <div class="dps-current" data-dps-current>{{ currentLabel }}</div>

    <DateWheel
      :model-value="draft"
      :min-year="minYear"
      :max-year="maxYear"
      tone="light"
      @update:model-value="draft = $event"
    />

    <div class="dps-actions">
      <button type="button" class="dps-cancel" data-dps-cancel @click="onCancel">{{ cancelText }}</button>
      <button type="button" class="dps-confirm" data-dps-confirm @click="onConfirm">{{ confirmText }}</button>
    </div>
  </SheetModal>
</template>

<style scoped>
.dps-title {
  text-align: center;
  font-size: 15px;
  color: #8E8E93;
  padding-bottom: 4px;
}
.dps-current {
  text-align: center;
  font-size: 21px;
  font-weight: 700;
  color: #111111;
  font-variant-numeric: tabular-nums;
  padding-bottom: 6px;
}
.dps-actions { display: flex; gap: 12px; margin-top: 4px; }
.dps-actions button {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 24px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.dps-cancel { background: #E9E9EC; color: #3C3C43; }
.dps-confirm { background: #2F6BF6; color: #FFFFFF; }
.dps-actions button:active { opacity: 0.85; }
</style>
