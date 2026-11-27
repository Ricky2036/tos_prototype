<script setup>
/**
 * 应用内顶栏：安全区 + 56 高，与页面同底色（真机无分割线）。
 * 左侧固定返回圆钮，中间是标题/副标题或自定义内容，右侧交给调用方（胶囊按钮组）。
 */
const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  backLabel: { type: String, default: '' }
})
const emit = defineEmits(['back'])
</script>

<template>
  <div class="msg-topbar">
    <div class="tb-row">
      <button
        v-if="props.showBack"
        class="tb-back"
        type="button"
        data-msg-back
        :aria-label="props.backLabel || '返回'"
        @click="emit('back')"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 12H4.6M4.6 12l7.4-7.4M4.6 12l7.4 7.4" stroke="#1E1E20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="tb-main">
        <slot>
          <div class="tb-title" :class="{ 'has-sub': !!props.subtitle }">{{ props.title }}</div>
          <div v-if="props.subtitle" class="tb-sub">{{ props.subtitle }}</div>
        </slot>
      </div>
      <div class="tb-right"><slot name="right" /></div>
    </div>
  </div>
</template>

<style scoped>
.msg-topbar {
  flex: none;
  padding-top: var(--safe-top);
  background: #f0f1f2;
  position: relative;
  z-index: 6;
}
.tb-row {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  box-sizing: border-box;
}
.tb-back {
  width: 44px;
  height: 44px;
  flex: none;
  border: none;
  border-radius: 50%;
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.045);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.14s cubic-bezier(0.32, 0.72, 0, 1);
}
.tb-back:active { transform: scale(0.9); }
.tb-main {
  flex: 1;
  min-width: 0;
}
.tb-title {
  font-size: 20px;
  font-weight: 600;
  color: #000;
  line-height: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.1px;
}
.tb-title.has-sub { font-size: 18px; line-height: 22px; }
.tb-sub {
  font-size: 13px;
  line-height: 16px;
  color: #5a5a5c;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tb-right { flex: none; display: flex; align-items: center; }
</style>
