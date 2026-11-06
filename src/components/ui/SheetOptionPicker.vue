<script setup>
import SheetModal from './SheetModal.vue'

/**
 * 单选选择弹层（SheetOptionPicker）
 *
 * 设置里大量「点一行 → 选一个值」的交互（桌面角标样式、应用刷新率、通知分组…）都是同一个形状，
 * 统一走这个控件：外观与动效来自 SheetModal，这里只负责「标题 + 选项 + 取消」。
 *
 * options: [{ value, label, subtitle? }]
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, required: true },
  options: { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: '' },
  cancelText: { type: String, default: '取消' }
})
const emit = defineEmits(['update:modelValue', 'close', 'pick'])

function pick(value) {
  emit('update:modelValue', value)
  emit('pick', value)
  emit('close')
}
</script>

<template>
  <SheetModal :visible="visible" padding="18px 16px 14px" @close="emit('close')">
    <div class="picker-title">{{ title }}</div>

    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="picker-row"
      @click="pick(opt.value)"
    >
      <span class="picker-text">
        <span class="picker-label">{{ opt.label }}</span>
        <span v-if="opt.subtitle" class="picker-sub">{{ opt.subtitle }}</span>
      </span>
      <span class="picker-radio" :class="{ checked: opt.value === modelValue }"></span>
    </button>

    <button class="picker-cancel" type="button" @click="emit('close')">{{ cancelText }}</button>
  </SheetModal>
</template>

<style scoped>
.picker-title {
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #111;
  padding-bottom: 10px;
}

.picker-row {
  width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: none;
  font-family: inherit;
  cursor: pointer;
  padding: 4px;
  text-align: left;
}

.picker-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.picker-label {
  font-size: 16px;
  color: #111;
}

.picker-sub {
  font-size: 13px;
  line-height: 18px;
  color: #8E8E93;
}

.picker-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #C7C7CC;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.picker-radio.checked {
  border-color: #2F6BF6;
  border-width: 2px;
}

.picker-radio.checked::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2F6BF6;
}

.picker-cancel {
  width: 100%;
  height: 50px;
  margin-top: 10px;
  border: none;
  border-radius: 25px;
  background: #F2F2F7;
  color: #111;
  font-size: 17px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}
</style>
