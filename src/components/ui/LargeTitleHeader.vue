<script setup>
/**
 * 大标题头（LargeTitleHeader）—— 本仓标准控件
 * ==========================================
 * 详情页的「大标题随滚动折叠」通用件。**设置页与相册页共用同一套实现**，
 * 折叠曲线来自 `composables/useLargeTitle.js`，禁止各页自己写一份。
 *
 * 解决的问题（Ricky 2026-10-12）：
 *   ① 各页大标题的滑动行为不一致（相册的标题原来 `position: static`，一滚就走）；
 *   ② 滚动时内容直接顶到状态栏图标下面，视觉糊成一片。
 *
 * 机制：
 *   · 本体 `position: sticky; top: 0` ⇒ 标题钉在顶部，内容从它下面**穿过**；
 *   · `::before` 是一层与页面底色同色的渐变底幕，`opacity = 折叠进度`
 *     ⇒ 起手（p=0）完全透明、不挡内容；越往下滚越实，p=1 时顶部 62% 达到 99% 不透明
 *     ⇒ 穿过底部的内容被盖掉，**不再与状态栏图标重叠**。
 *
 * 用法：
 * ```vue
 * const lt = useLargeTitle()
 * <div class="scroll" @scroll.passive="lt.onScroll">
 *   <LargeTitleHeader title="设置" :progress="lt.progress" />
 *   ...
 * </div>
 * ```
 * 右侧要挂按钮（如相册右上胶囊）用 `#accessory` 插槽 —— 槽内容会跟着标题条一起钉住，
 * 且**不参与** `--title-inset` 的左右内缩（绝对定位，自己给 right）。
 *
 * ⚠️ 祖先链上不要加 `transform` / `filter` / `backdrop-filter` —— 会建 containing block，
 *    `sticky` 与 `::before` 的层叠都会跑偏。
 */
import { computed } from 'vue'
import { largeTitleVars, asProgress } from '../../composables/useLargeTitle.js'

const props = defineProps({
  /** 标题文案（也可用默认插槽塞自定义节点） */
  title: { type: String, default: '' },
  /** 折叠进度 0~1。接受：数字 · ref · `useLargeTitle()` 的返回值（`{ progress }`）· 其中任一嵌套形态。
 *  ⚠️ 必须同时认「裸 ref」—— `<script setup>` 里只有**顶层** ref 会在模板自动解包；
 *  写成 `const lt = useLargeTitle()` 再传 `:progress="lt.progress"` 时拿到的是 ComputedRef 本身，
 *  2026-10-12 就因此静默退化成恒 0（**且不报错**）。归一化逻辑在 `asProgress()` 里，单测行为级覆盖。 */
progress: { type: [Number, Object], default: 0 },
  /** 底幕基色，RGB 三元组串（默认跟随应用默认底色 #F4F5F7） */
  scrim: { type: String, default: '244, 245, 247' },
  zIndex: { type: [Number, String], default: 12 },
  /** 折叠曲线覆写 —— 正常页面别动，见 useLargeTitle.js */
  curve: { type: Object, default: () => ({}) }
})

/** ⚠️ 别在本组件里重写一份归一化 —— 认不出时兜底成 0（不是 NaN） */
const p = computed(() => asProgress(props.progress) ?? 0)

const vars = computed(() => ({
  ...largeTitleVars(p.value, props.curve),
  '--title-scrim': props.scrim,
  zIndex: String(props.zIndex)
}))
</script>

<template>
  <div class="large-title" data-large-title :style="vars">
    <span class="lt-title" data-large-title-text>
      <slot>{{ title }}</slot>
    </span>
    <div v-if="$slots.accessory" class="lt-accessory" data-large-title-accessory>
      <slot name="accessory" />
    </div>
  </div>
</template>

<style scoped>
.large-title {
  position: sticky;
  top: 0;
  height: calc(var(--safe-top, 54px) + var(--title-height, 72px));
  display: flex;
  align-items: flex-start;
  box-sizing: border-box;
  padding: calc(var(--safe-top, 54px) + var(--title-top-inset, 22px)) var(--title-inset, 30px) 0;
  /* 自身成层：让 ::before 的 z-index:-1 只在条内生效，不钻到页面内容下面 */
  isolation: isolate;
}

/* 底幕：与页面底色同色的渐变，透明度跟随折叠进度。
   p=1 时顶部 72% 为 99% 不透明 ⇒ 穿过底部的内容被盖住，不再与状态栏图标重叠。
   ⚠️ 72% 不是随手写的：折叠态条高 118px，须盖住右上菜单底缘 84.65px（= 72% × 118）与
   缩小后标题墨迹底缘 74.5px。原来的 62% 只到 73.2px，菜单下半截会露内容。 */
.large-title::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(var(--title-scrim, 244, 245, 247), 0.99) 0%,
    rgba(var(--title-scrim, 244, 245, 247), 0.99) 72%,
    rgba(var(--title-scrim, 244, 245, 247), 0.7) 84%,
    rgba(var(--title-scrim, 244, 245, 247), 0.24) 94%,
    rgba(var(--title-scrim, 244, 245, 247), 0) 100%
  );
  opacity: var(--title-progress, 0);
  pointer-events: none;
}

.lt-title {
  display: block;
  color: #111111;
  font-size: var(--title-size, 36px);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.7px;
  transform-origin: left top;
  will-change: font-size;
}

.lt-accessory {
  position: absolute;
  /* 落点 = **折叠后标题行盒的垂直中心**（`--title-accessory-center`，由折叠契约算出，
     距安全区底部 10.65px ⇒ top 64.65px）。`translateY(-50%)` 让槽内容自己居中，
     高度由页面自定，不写死。
     ⇒ 折叠态下菜单与标题自动共线对齐；起手态菜单**不动**（参考图两态菜单 y 完全相同）。
     `right` 走 `--title-accessory-right`（契约默认 17px）—— 绝对定位的包含块是父级
     padding box，padding 不影响它，所以这里就是离机身右缘的实际距离。
     ⚠️ 该高度（44.65–84.65）会落进 `ScreenView` 顶部 64px 的手势热区，热区在
     `:has([data-large-title-accessory])` 时已收窄让位（见 ScreenView.vue）。 */
  top: calc(var(--safe-top, 54px) + var(--title-accessory-center, 10.65px));
  transform: translateY(-50%);
  right: var(--title-accessory-right, 17px);
  z-index: 2;
}
</style>
