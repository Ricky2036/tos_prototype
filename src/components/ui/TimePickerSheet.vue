<script setup>
import { ref, watch, computed } from 'vue'
import SheetModal from './SheetModal.vue'
import TimeWheel from './TimeWheel.vue'
import { formatTimeLabel } from '../../utils/timePicker.js'

/**
 * 【全仓标准控件】底部时间选择弹层。
 *
 * 真机（/tmp/ref/gI/dnd_20_start_time、dnd_21_end_time）：浅色悬浮卡片 +
 * 灰色标题「开始时间」+ 黑色当前值「10:00 下午」+ 三列滚轮 + 取消/确定两枚胶囊按钮。
 * 全仓复用：勿扰模式（开始/结束时间）、礼拜模式（时段起止）；时钟闹钟编辑用
 * `TimeWheel` 的 inline 形态（深色 tone），不走这个弹层。
 *
 * modelValue / confirm 一律用 24 小时制 'HH:mm'，与项目既有调用方一致。
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '选择时间' },
  modelValue: { type: String, default: '07:00' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  showPeriod: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'close'])

const draft = ref(props.modelValue || '07:00')
watch(() => props.visible, (v) => {
  if (v) draft.value = props.modelValue || '07:00'
})
watch(() => props.modelValue, (v) => {
  if (v && !props.visible) draft.value = v
})

const currentLabel = computed(() => formatTimeLabel(draft.value))

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
  <SheetModal :visible="visible" padding="18px 20px 20px" @close="onCancel">
    <div class="tps-title" data-tps-title>{{ title }}</div>
    <div class="tps-current" data-tps-current>{{ currentLabel }}</div>

    <TimeWheel
      :model-value="draft"
      :show-period="showPeriod"
      tone="light"
      @update:model-value="draft = $event"
    />

    <div class="tps-actions">
      <button type="button" class="tps-cancel" data-tps-cancel @click="onCancel">{{ cancelText }}</button>
      <button type="button" class="tps-confirm" data-tps-confirm @click="onConfirm">{{ confirmText }}</button>
    </div>
  </SheetModal>
</template>

<style scoped>
.tps-title {
  text-align: center;
  font-size: 16px;
  color: #8E8E93;
  padding-bottom: 6px;
}
.tps-current {
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  color: #111111;
  font-variant-numeric: tabular-nums;
  padding-bottom: 8px;
}
.tps-actions { display: flex; gap: 12px; margin-top: 6px; }
.tps-actions button {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 24px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.tps-cancel { background: #E9E9EC; color: #3C3C43; }
.tps-confirm { background: #2F6BF6; color: #FFFFFF; }
.tps-actions button:active { opacity: 0.85; }
</style>
