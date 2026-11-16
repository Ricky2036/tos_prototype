<script setup>
import { computed } from 'vue'
import SheetModal from './SheetModal.vue'

/**
 * 标准单选底部弹层控件 (SheetOptionPicker)
 * ==========================================
 * 依据真机实测（Infinix X6878 / Android 17 系统规范）：
 *   - 顶部 Header：左侧粗体大标题 + 右侧浅灰圆角大胶囊「关闭」按钮；
 *   - 选项列表：左侧文本与副标题，右侧激活项显示纯蓝对勾（✓）；
 *   - 选项间分隔线：1px #F3F4F6；
 *   - 支持：字符串数组与对象数组 [{ value, label, subtitle? }]、v-model 双向绑定。
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, required: true },
  options: { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: '' },
  headerClose: { type: Boolean, default: true },
  showBottomCancel: { type: Boolean, default: false },
  cancelText: { type: String, default: '取消' },
})

const emit = defineEmits(['update:modelValue', 'close', 'pick'])

const normalizedOptions = computed(() => {
  return props.options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) }
    }
    return opt
  })
})

function isSelected(opt) {
  return opt.value === props.modelValue
}

function pick(value) {
  emit('update:modelValue', value)
  emit('pick', value)
  emit('close')
}
</script>

<template>
  <SheetModal :visible="visible" padding="16px 20px 24px" @close="emit('close')">
    <!-- 顶部 Header（真机 1:1 左标题 + 右关闭胶囊） -->
    <div class="picker-header">
      <div class="picker-title sheet-title">{{ title }}</div>
      <button
        v-if="headerClose"
        type="button"
        class="picker-close-btn"
        @click="emit('close')"
      >
        关闭
      </button>
    </div>

    <!-- 选项列表 -->
    <div class="picker-list sheet-options-list">
      <button
        v-for="opt in normalizedOptions"
        :key="opt.value"
        type="button"
        class="picker-row sheet-option-item"
        @click="pick(opt.value)"
      >
        <span class="picker-text">
          <span class="picker-label">{{ opt.label }}</span>
          <span v-if="opt.subtitle" class="picker-sub">{{ opt.subtitle }}</span>
        </span>
        <span
          class="picker-check-wrap picker-radio"
          :class="{ checked: isSelected(opt) }"
        >
          <svg
            v-if="isSelected(opt)"
            class="picker-check-svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0066FF"
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      </button>
    </div>

    <!-- 可选的底部取消按钮（默认不展示，保留兼容） -->
    <button
      v-if="showBottomCancel"
      class="picker-cancel"
      type="button"
      @click="emit('close')"
    >
      {{ cancelText }}
    </button>
  </SheetModal>
</template>

<style scoped>
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0 16px;
}

.picker-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.2px;
}

.picker-close-btn {
  background: #F3F4F6;
  color: #4B5563;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  outline: none;
  transition: background-color 0.15s ease;
}

.picker-close-btn:active {
  background: #E5E7EB;
}

.picker-list {
  display: flex;
  flex-direction: column;
}

.picker-row {
  width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: transparent;
  border: none;
  border-bottom: 1px solid #F3F4F6;
  font-family: inherit;
  cursor: pointer;
  padding: 12px 2px;
  text-align: left;
}

.picker-row:last-child {
  border-bottom: none;
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
  color: #111827;
}

.picker-sub {
  font-size: 13px;
  line-height: 18px;
  color: #8E8E93;
}

.picker-check-wrap {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.picker-radio.checked {
  color: #0066FF;
}

.picker-check-svg {
  display: block;
}

.picker-cancel {
  width: 100%;
  height: 50px;
  margin-top: 14px;
  border: none;
  border-radius: 25px;
  background: #F2F2F7;
  color: #111827;
  font-size: 16px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}

.picker-cancel:active {
  background: #E5E5EA;
}
</style>
