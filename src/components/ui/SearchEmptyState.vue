<script setup>
/**
 * 【全仓标准控件】搜索无结果空态。
 *
 * 真机（/tmp/ref/gI/srch_04_committed.png）：两张蓝灰圆角卡片叠加 +
 * 右上方白色放大镜（淡紫渐变镜片），下方灰字「暂无结果，试试其他关键词」。
 * 旧实现是 44px 线性放大镜 +「未找到相关设置」，形态和文案都不对。
 */
defineProps({
  text: { type: String, default: '暂无结果，试试其他关键词' }
})
</script>

<template>
  <div class="search-empty" data-search-empty>
    <svg class="search-empty-art" width="112" height="112" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="ses-card" x1="32" y1="40" x2="94" y2="104" gradientUnits="userSpaceOnUse">
          <stop stop-color="#C3CCE4" />
          <stop offset="1" stop-color="#A9B6D7" />
        </linearGradient>
        <linearGradient id="ses-lens" x1="58" y1="34" x2="96" y2="74" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FFFFFF" stop-opacity="0.95" />
          <stop offset="0.55" stop-color="#E4E7F6" stop-opacity="0.9" />
          <stop offset="1" stop-color="#C9D0EA" stop-opacity="0.85" />
        </linearGradient>
      </defs>

      <!-- 后面一张卡片（略旋转） -->
      <rect x="20" y="32" width="64" height="64" rx="15" fill="#9FAEDA" transform="rotate(-9 52 64)" />
      <!-- 前面一张卡片 -->
      <rect x="32" y="40" width="64" height="64" rx="15" fill="url(#ses-card)" />

      <!-- 放大镜手柄 -->
      <path d="M91 69L105 83" stroke="#C6CEE6" stroke-width="8" stroke-linecap="round" />
      <!-- 镜片 -->
      <circle cx="78" cy="54" r="21" fill="url(#ses-lens)" stroke="#D3D9EC" stroke-width="2.5" />
      <path d="M66 46C69 42 74 40 79 40" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.8" />
    </svg>
    <span class="search-empty-text">{{ text }}</span>
  </div>
</template>

<style scoped>
.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  min-height: 58vh;
  padding: 0 20px;
  text-align: center;
}
.search-empty-art { display: block; }
.search-empty-text {
  font-size: 15px;
  line-height: 21px;
  color: #6E6E73;
}
</style>
