<script setup>
/**
 * 设置三级页通用外壳（显示与亮度 / 声音与振动 等二级页下的子页共用）。
 *
 * 只负责：圆形返回键 + 标题 + 可滚动内容区 + 可选的底部悬浮按钮。
 * 卡片与行由各页面自己组合 `ListCell` / `ToggleSwitch`，避免把每组页面的差异塞进配置。
 */
defineProps({
  title: { type: String, required: true },
  floatingAction: { type: String, default: '' }
})
const emit = defineEmits(['back', 'action'])
</script>

<template>
  <div class="sub-shell">
    <div class="sub-nav">
      <button class="nav-round-btn" aria-label="返回" type="button" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 12H5M5 12L12 5M5 12L12 19"
            stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>
      </button>
      <div class="nav-title">{{ title }}</div>
      <slot name="navRight"></slot>
    </div>

    <div class="sub-body scrollable">
      <slot></slot>
      <div class="sub-bottom-space" :class="{ 'has-action': floatingAction }"></div>
    </div>

    <div v-if="floatingAction" class="sub-floating-action">
      <button type="button" class="sub-action-btn" @click="emit('action')">{{ floatingAction }}</button>
    </div>
  </div>
</template>

<style scoped>
.sub-shell {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  z-index: 20;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.sub-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(var(--safe-top, 0px) + 8px) 16px 8px;
  flex-shrink: 0;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
}

.nav-round-btn:active {
  background: #ECECEF;
}

.nav-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.sub-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px 0;
  scrollbar-width: none;
}

.sub-body::-webkit-scrollbar {
  display: none;
}

.sub-bottom-space {
  height: 28px;
}

.sub-bottom-space.has-action {
  height: 92px;
}

.sub-floating-action {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 18px;
  z-index: 5;
}

.sub-action-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 24px;
  background: #2F6BF6;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(47, 107, 246, 0.28);
}

.sub-action-btn:active {
  background: #2559D0;
}

/* ===== 三级页共用排版（供各页面插槽内容使用） =====
   作用域 id 挂在 .sub-shell 上，`.sub-shell[data-v-x] .settings-card` 可命中插槽内容，
   这样各页面不必各写一份卡片样式，一组的视觉不会漂。 */
:deep(.settings-card) {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

:deep(.section-header) {
  font-size: 13px;
  color: #8E8E93;
  padding: 8px 4px 6px;
}

:deep(.card-note) {
  font-size: 13px;
  line-height: 19px;
  color: #8E8E93;
  padding: 0 4px 14px;
}

:deep(.sub-preview-img) {
  display: block;
  width: 100%;
  border-radius: 16px;
  margin-bottom: 12px;
  object-fit: cover;
}

:deep(.sub-row-pad) {
  padding: 14px 16px;
}

:deep(.sub-divider) {
  height: 0.5px;
  background: rgba(60, 60, 67, 0.16);
  margin-left: 16px;
}

/* 单选圆点（各设置子页共用） */
:deep(.opt-radio) {
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

:deep(.opt-radio.checked) {
  border-color: #2F6BF6;
  border-width: 2px;
}

:deep(.opt-radio.checked)::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2F6BF6;
}
</style>
