<script setup>
/**
 * 【全仓标准控件】搜索框「清空」按钮。
 *
 * 真机是灰色实心圆 + 白色圆角叉（iOS xmark.circle.fill / Material clear 的常见形态），
 * 旧实现是 14px 的双线灰叉，太细太小、还原度低。统一从这里出，
 * `SettingsSearchBar`（首页非激活态）与 `SettingsSearchDock`（激活态胶囊）共用。
 */
defineProps({
  size: { type: Number, default: 20 }
})
const emit = defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    class="search-clear-btn"
    data-search-clear
    aria-label="清空输入"
    @click.stop="emit('click')"
  >
    <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#8E8E93" />
      <path
        d="M8.6 8.6L15.4 15.4M15.4 8.6L8.6 15.4"
        stroke="#FFFFFF"
        stroke-width="2.2"
        stroke-linecap="round"
      />
    </svg>
  </button>
</template>

<style scoped>
.search-clear-btn {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 0;
}
.search-clear-btn:active { opacity: 0.7; }
</style>
