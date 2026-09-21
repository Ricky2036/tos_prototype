<script setup>
/**
 * 竖排动作面板通用控件 (ActionSheetModal)
 * 参考图 3 设计：提供毛玻璃蒙层、圆角动作卡片（标题 + 竖排选项列表）与底部独立的取消药丸按钮。
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  options: {
    type: Array,
    default: () => [
      // { key: 'both', label: '锁屏与桌面', color: '#007aff' },
      // { key: 'lock', label: '锁屏', color: '#007aff' },
      // { key: 'home', label: '桌面', color: '#007aff' }
    ]
  },
  cancelText: { type: String, default: '取消' },
  closeOnBackdrop: { type: Boolean, default: true }
})

const emit = defineEmits(['update:visible', 'select', 'cancel', 'close'])

function onBackdropClick(e) {
  if (!props.closeOnBackdrop) return
  if (e.target === e.currentTarget) {
    emit('update:visible', false)
    emit('cancel')
    emit('close', { trigger: 'backdrop' })
  }
}

function onSelect(option) {
  if (option.disabled) return
  emit('update:visible', false)
  emit('select', option)
  emit('close', { trigger: 'select', option })
}

function onCancel() {
  emit('update:visible', false)
  emit('cancel')
  emit('close', { trigger: 'cancel' })
}
</script>

<template>
  <Transition name="action-sheet-fade">
    <div
      v-if="visible"
      class="action-sheet-backdrop"
      @click="onBackdropClick"
      @pointerdown="onBackdropClick"
      @touchstart="onBackdropClick"
      @pointermove.stop
      @pointerup.stop
      @touchmove.stop
      @touchend.stop
    >
      <div
        class="action-sheet-panel"
        @pointerdown.stop
        @touchstart.stop
        @click.stop
      >
        <!-- 主卡片 -->
        <div class="action-sheet-group">
          <div v-if="title || $slots.title" class="action-sheet-title">
            <slot name="title">{{ title }}</slot>
          </div>

          <slot name="options">
            <button
              v-for="(option, idx) in options"
              :key="option.key || idx"
              class="action-sheet-item"
              :class="{ 'is-disabled': option.disabled }"
              :style="{ color: option.color || '#007aff' }"
              type="button"
              @click="onSelect(option)"
            >
              {{ option.label }}
            </button>
          </slot>
        </div>

        <!-- 取消按钮 -->
        <button
          class="action-sheet-cancel"
          type="button"
          @click="onCancel"
        >
          <slot name="cancel">{{ cancelText }}</slot>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.action-sheet-backdrop {
  position: absolute;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 16px calc(var(--safe-bottom, 20px) + 16px);
  box-sizing: border-box;
}

.action-sheet-panel {
  width: 100%;
  max-width: 390px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  user-select: none;
}

.action-sheet-group {
  border-radius: 20px;
  background: rgba(245, 245, 247, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.action-sheet-title {
  padding: 16px 16px 12px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #1c1c1e;
  letter-spacing: -0.1px;
}

.action-sheet-item {
  width: 100%;
  height: 52px;
  border: 0;
  border-top: 0.5px solid rgba(60, 60, 67, 0.18);
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
  font-size: 17px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.action-sheet-item:active:not(.is-disabled) {
  background: rgba(0, 0, 0, 0.06);
}

.action-sheet-item.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-sheet-cancel {
  width: 100%;
  height: 50px;
  border-radius: 18px;
  border: 0;
  background: rgba(230, 230, 235, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
  font-size: 17px;
  font-weight: 600;
  color: #1c1c1e;
  cursor: pointer;
  outline: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, transform 0.1s ease;
  -webkit-tap-highlight-color: transparent;
}

.action-sheet-cancel:active {
  background: rgba(215, 215, 220, 0.95);
  transform: scale(0.98);
}

/* 进出场动画 */
.action-sheet-fade-enter-active,
.action-sheet-fade-leave-active {
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.action-sheet-fade-enter-active .action-sheet-panel,
.action-sheet-fade-leave-active .action-sheet-panel {
  transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
}

.action-sheet-fade-enter-from,
.action-sheet-fade-leave-to {
  opacity: 0;
}

.action-sheet-fade-enter-from .action-sheet-panel {
  transform: translateY(60px);
  opacity: 0;
}

.action-sheet-fade-leave-to .action-sheet-panel {
  transform: translateY(60px);
  opacity: 0;
}
</style>
