<script setup>
import SheetModal from '../../../ui/SheetModal.vue'

/**
 * 悬浮通知样式（通知与状态栏 → 悬浮通知 → 悬浮通知样式）
 *
 * 真机：底部弹层，两张**预览卡**并排（详细：三行文字条；简洁：一行），
 * 选中的卡有蓝色描边 + 下方标签变蓝；底部一个「取消」。
 */
defineProps({
  visible: { type: Boolean, default: false },
  modelValue: { type: String, default: 'detailed' }
})
const emit = defineEmits(['update:modelValue', 'close'])

const OPTIONS = [
  { value: 'detailed', label: '详细' },
  { value: 'concise', label: '简洁' }
]

function pick(v) {
  emit('update:modelValue', v)
  emit('close')
}
</script>

<template>
  <SheetModal :visible="visible" padding="20px 16px 14px" @close="emit('close')">
    <div class="fs-title">悬浮通知样式</div>

    <div class="fs-cards">
      <button
        v-for="opt in OPTIONS"
        :key="opt.value"
        type="button"
        class="fs-card"
        :class="{ active: modelValue === opt.value }"
        @click="pick(opt.value)"
      >
        <div class="fs-preview">
          <span class="fs-dot"></span>
          <span class="fs-line long"></span>
          <template v-if="opt.value === 'detailed'">
            <span class="fs-line mid"></span>
            <span class="fs-line short"></span>
          </template>
        </div>
        <span class="fs-label">{{ opt.label }}</span>
      </button>
    </div>

    <button class="fs-cancel" type="button" @click="emit('close')">取消</button>
  </SheetModal>
</template>

<style scoped>
.fs-title {
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #111;
  padding-bottom: 16px;
}

.fs-cards {
  display: flex;
  gap: 12px;
  padding: 0 4px;
}

.fs-card {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.fs-preview {
  width: 100%;
  height: 86px;
  border-radius: 12px;
  background: #F1F1F4;
  border: 2px solid transparent;
  box-sizing: border-box;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  align-items: flex-start;
}

.fs-card.active .fs-preview {
  border-color: #2F6BF5;
  background: #FFFFFF;
}

.fs-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #2F6BF5;
  margin-bottom: 2px;
}

.fs-line {
  display: block;
  height: 7px;
  border-radius: 4px;
  background: #D8D8DE;
}

.fs-line.long { width: 100%; }
.fs-line.mid { width: 78%; }
.fs-line.short { width: 46%; }

.fs-label {
  font-size: 14px;
  color: #3C3C43;
}

.fs-card.active .fs-label {
  color: #2F6BF5;
  font-weight: 600;
}

.fs-cancel {
  width: 100%;
  height: 50px;
  margin-top: 16px;
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
