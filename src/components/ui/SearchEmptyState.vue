<script setup>
/**
 * 【全仓标准控件】搜索无结果空态。
 *
 * 真机（/tmp/ref/gI/srch_04_committed_full.png）：卡片叠加 + 放大镜插画，
 * 下方灰字。真机实测插画墨迹中心与页面中心水平偏差 0.5px、整体居中于屏幕
 * （屏幕中线偏移 +1.9%），所以插画外框必须让「墨迹」落在正中。
 *
 * ⚠️ 两个历史坑：
 *  1. viewBox 曾用 0 0 120 120 留白，墨迹实际偏右 3.5px、偏下 8px ⇒ 看着不居中。
 *     现改为紧贴墨迹的正方形 viewBox（见下方 svg），墨迹中心 = 外框中心。
 *  2. 定位曾用 `min-height: 58vh`，而 vh 是浏览器视口而不是手机屏 ⇒ 换窗口高度就跑偏。
 *     现默认 `fill`：铺满最近的定位祖先（.sub-shell / 设置搜索页）后整体居中，
 *     并让出 92px 底部给悬浮搜索栏（真机空态整体略微偏上）。
 */
defineProps({
  text: { type: String, default: '没有搜索到结果' },
  /** 铺满最近定位祖先并居中（默认）；false 时按普通流内块渲染，高度取 min-height */
  fill: { type: Boolean, default: true }
})
</script>

<template>
  <div class="search-empty" :class="{ 'is-fill': fill }" data-search-empty>
    <!-- viewBox 紧贴墨迹方框：x 15.4..109 / y 18.9..112.5 的正方形，墨迹即居中 -->
    <svg class="search-empty-art" width="86" height="86" viewBox="15.4 18.9 93.6 93.6" fill="none" aria-hidden="true">
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
  padding: 0 20px;
  text-align: center;
  box-sizing: border-box;
  min-height: 320px;
}

/* 铺满模式：交给最近的定位祖先量尺寸，真机即「整屏居中、略偏上」
   ⚠️ 不要再减底部搜索栏的高度：真机插画组中心落在屏幕 51.9%（≈ 内容区正中），
      是按整屏居中而不是「搜索栏以上区域」居中，减掉 92px 会高出 46px。 */
.search-empty.is-fill {
  position: absolute;
  inset: 0;
  min-height: 0;
  /* 纯展示层，不吃点击，避免挡住底下的行/按钮 */
  pointer-events: none;
}

.search-empty-art { display: block; }

.search-empty-text {
  font-size: 15px;
  line-height: 21px;
  color: #6E6E73;
}
</style>
