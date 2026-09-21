<script setup>
/**
 * 悬浮底部胶囊按钮通用控件 (FloatingBottomPill)
 * 适用于壁纸全屏预览的「应用」按钮、桌面编辑控制按钮等。
 * 支持毛玻璃背景、微动效按压反馈、加载状态。
 */
defineProps({
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  variant: { type: String, default: 'glass' }, // 'glass' | 'primary' | 'solid'
  minWidth: { type: String, default: '200px' }
})

const emit = defineEmits(['click'])
</script>

<template>
  <div class="floating-bottom-wrapper">
    <button
      class="floating-bottom-pill"
      :class="[`pill-${variant}`, { 'is-disabled': disabled }]"
      :style="{ minWidth }"
      :disabled="disabled"
      type="button"
      @click="emit('click', $event)"
    >
      <slot>{{ label }}</slot>
    </button>
  </div>
</template>

<style scoped>
.floating-bottom-wrapper {
  position: absolute;
  bottom: calc(var(--safe-bottom, 20px) + 24px);
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  z-index: 50;
}

.floating-bottom-pill {
  pointer-events: auto;
  height: 48px;
  padding: 0 28px;
  border-radius: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: transform 0.16s cubic-bezier(0.2, 0.9, 0.3, 1), background-color 0.2s ease, opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.floating-bottom-pill:active:not(:disabled) {
  transform: scale(0.95);
}

.floating-bottom-pill.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 玻璃材质 */
.pill-glass {
  background: rgba(36, 36, 40, 0.76);
  backdrop-filter: blur(28px) saturate(130%) brightness(108%);
  -webkit-backdrop-filter: blur(28px) saturate(130%) brightness(108%);
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.42), inset 0 0.5px 1px rgba(255, 255, 255, 0.3);
}

.pill-glass:active:not(:disabled) {
  background: rgba(50, 50, 56, 0.85);
}

/* 主色调 (蓝色) */
.pill-primary {
  background: #0a84ff;
  border: none;
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(10, 132, 255, 0.4);
}

.pill-primary:active:not(:disabled) {
  background: #0071e3;
}

/* 实色深灰 */
.pill-solid {
  background: #1c1c1e;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
</style>
