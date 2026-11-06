<script setup>
/**
 * 底部弹层通用控件（SheetModal）
 *
 * 把「遮罩 + 悬浮卡片 + 出现动效」收进一个控件里，弹层动效属于控件本身，
 * 而不是各页面各写一个 `fade`。统一为：遮罩淡入 + 卡片从屏幕底部上移。
 *
 * 几何（真机实测）：左右留边 16px、距屏幕底 26px、卡片四角 26px。
 * ⚠️ 必须是 `position: absolute` —— 应用内浮层用 `fixed` 会把包含块算到机身外（本仓踩过）。
 */
defineProps({
  visible: { type: Boolean, default: false },
  /** 卡片底色，个别弹层用浅灰（#F2F2F7）区分 */
  panelBackground: { type: String, default: '#FFFFFF' },
  /** 卡片圆角，默认 26px（真机值） */
  radius: { type: String, default: '26px' },
  padding: { type: String, default: '18px 16px 14px' },
  closeOnBackdrop: { type: Boolean, default: true },
  /** 额外的卡片 class，便于个别弹层微调 */
  panelClass: { type: [String, Array, Object], default: '' }
})
const emit = defineEmits(['close'])
</script>

<template>
  <Transition name="sheet-rise" appear>
    <div
      v-if="visible"
      class="sheet-mask"
      @click.self="closeOnBackdrop && emit('close')"
    >
      <div
        class="sheet-panel"
        :class="panelClass"
        :style="{ background: panelBackground, borderRadius: radius, padding }"
      >
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.sheet-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: flex-end;
  padding: 0 16px 26px;
  box-sizing: border-box;
  z-index: 30;
}

.sheet-panel {
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  will-change: transform;
}

/* ===== 统一出现动效：遮罩淡入 + 卡片自屏幕底部优雅上移 ===== */
.sheet-rise-enter-active {
  transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.sheet-rise-leave-active {
  transition: opacity 0.2s ease;
}

.sheet-rise-enter-active .sheet-panel {
  transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}

.sheet-rise-leave-active .sheet-panel {
  transition: transform 0.22s cubic-bezier(0.4, 0, 1, 1);
}

.sheet-rise-enter-from,
.sheet-rise-leave-to {
  opacity: 0;
}

.sheet-rise-enter-from .sheet-panel,
.sheet-rise-leave-to .sheet-panel {
  transform: translateY(100%);
}

/* 尊重「减弱动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .sheet-rise-enter-active .sheet-panel,
  .sheet-rise-leave-active .sheet-panel {
    transition: none;
  }
}
</style>
