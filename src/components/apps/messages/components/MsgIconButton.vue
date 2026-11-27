<script setup>
/**
 * 圆钮：真机顶栏上的返回 / 关闭 / ⋮ / 电话 / 全选都是同一颗
 * "白底 + 极轻投影 + 44×44" 的圆钮（截图标定：直径 148 物理 = 44 画布）。
 */
const props = defineProps({
  size: { type: Number, default: 44 },
  /** 图标色/描边由调用方通过 slot 自带 SVG 控制 */
  tone: { type: String, default: 'light' }, // light | ghost
  label: { type: String, default: '' }
})
</script>

<template>
  <button
    class="msg-icon-btn"
    :class="`tone-${props.tone}`"
    :style="{ width: `${props.size}px`, height: `${props.size}px` }"
    type="button"
    :aria-label="props.label || undefined"
  >
    <slot />
  </button>
</template>

<style scoped>
.msg-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.14s cubic-bezier(0.32, 0.72, 0, 1), background 0.18s ease;
}
.tone-light {
  /* 真机取色：按钮本体约 #FDFDFD，压在 #F0F1F2 背景上，投影极淡 */
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.045);
  color: #1e1e20;
}
.tone-ghost {
  background: transparent;
  box-shadow: none;
  color: #1e1e20;
}
.msg-icon-btn:active {
  transform: scale(0.9);
  background: #f0f0f0;
}
</style>
