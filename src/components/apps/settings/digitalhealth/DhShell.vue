<script setup>
import GlassNavBar from '../../../ui/GlassNavBar.vue'

/**
 * 数字健康子页通用外壳（Material 体系，**不是** 设置里那套 iOS 卡片）。
 *
 * 真机（Infinix XOS 17 / Google Digital Wellbeing）子页共性：
 *   - 页面底色 #F1F2F4，卡片纯白 16 圆角、间距 12；
 *   - 小节标题是**蓝色小字**（#1A73E8、13px、500），不是 iOS 的灰色 section header；
 *   - 「睡眠模式」这类页整卡是浅蓝底（#E8F0FE）；
 *   - 行没有 chevron（除家长控制页），靠图标 + 文字 + 右侧控件表达。
 *
 * ⚠️ 不复用 `settings/subpage/SubPageShell.vue`：那套是 iOS 视觉（灰 section、
 *    16px 卡片、蓝色胶囊在底部），与 Google 这套 Material 版式混用会两边都不像。
 */
defineProps({
  title: { type: String, required: true }
})
const emit = defineEmits(['back'])
</script>

<template>
  <div class="dh-sub">
    <GlassNavBar overlay :title="title" @back="emit('back')">
      <template v-if="$slots.right" #right><slot name="right"></slot></template>
    </GlassNavBar>

    <div class="dh-sub-body scrollable">
      <slot></slot>
      <div class="dh-sub-space"></div>
    </div>

    <slot name="bottom"></slot>
  </div>
</template>

<style scoped>
.dh-sub {
  position: absolute;
  inset: 0;
  background: #F1F2F4;
  display: flex;
  flex-direction: column;
  z-index: 21;
  color: #1F1F1F;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.dh-sub-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: calc(var(--nav-h) + 4px) 16px 0;
  scrollbar-width: none;
}
.dh-sub-body::-webkit-scrollbar { display: none; }

.dh-sub-space { height: 28px; }

/* ===== 子页共用排版（作用域挂在 .dh-sub 上，插槽内容也能命中） ===== */
:deep(.dh-card) {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

:deep(.dh-blue-card) {
  background: #E8F0FE;
  border-radius: 16px;
  margin-bottom: 12px;
}

:deep(.dh-label) {
  font-size: 13px;
  font-weight: 500;
  color: #1A73E8;
  padding: 16px 6px 8px;
}

:deep(.dh-note) {
  font-size: 13.5px;
  line-height: 19px;
  color: #5F6368;
  padding: 0 4px 14px;
}

:deep(.dh-note-center) {
  font-size: 13.5px;
  line-height: 20px;
  color: #3C4043;
  text-align: center;
  padding: 0 12px 16px;
}

:deep(.dh-row) {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 12px 16px;
  text-align: left;
  font-family: inherit;
  color: inherit;
  cursor: pointer;
}

:deep(.dh-row:active) { background: rgba(60, 64, 67, 0.05); }

:deep(.dh-row-main) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

:deep(.dh-row-title) {
  font-size: 15.5px;
  color: #1F1F1F;
  line-height: 21px;
}

:deep(.dh-row-sub) {
  font-size: 12.5px;
  color: #5F6368;
  line-height: 17px;
}

:deep(.dh-divider) {
  height: 0.5px;
  background: rgba(60, 64, 67, 0.14);
  margin-left: 62px;
}

/* 真机蓝色胶囊按钮（立即开启 / 继续） */
:deep(.dh-pill) {
  height: 36px;
  padding: 0 22px;
  border: none;
  border-radius: 18px;
  background: #1A73E8;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}

:deep(.dh-pill.is-soft) {
  background: #D7E5FB;
  color: #174EA6;
}

:deep(.dh-pill:disabled) {
  background: #DADCE0;
  color: #9AA0A6;
  cursor: default;
}
</style>
