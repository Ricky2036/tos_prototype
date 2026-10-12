import { computed, ref } from 'vue'
// ⚠️ 必须带 .js —— 本模块被 `node --test` 直接加载，Node ESM 不做扩展名补全
import { clamp } from '../utils/math.js'

/**
 * 大标题（Large Title）折叠契约 —— **唯一事实来源**。
 *
 * 折线是**线性**的：`progress = clamp(scrollTop / distance, 0, 1)`。
 *
 * | 量 | p=0（起手） | p=1（缩小） |
 * |---|---|---|
 * | 字号 `size` | 36px | 22px |
 * | 左右内缩 `inset` | 24px | 24px |
 * | 顶部内缩 `topInset` | 36px | −2px |
 * | 标题区高 `height` | 105px | 64px |
 *
 * 数值来自 2026-10-12 对**参考图**（1080×2363，1 设计px = 3 图像px，
 * 与本站屏幕 360×788 同比例）的像素量测，两态同尺对账：
 *
 * | 量（设计px，原点=屏幕左上角） | 参考图 | 本站实测 |
 * |---|---|---|
 * | 起手标题墨迹 | y 96.7–125.0 · left 26.0 | y 94.3–127.2 · left 26.3 |
 * | 缩小标题墨迹 | y 57.0–72.7 · left 25.0 | y 54.8–74.5 · left 25.2 |
 * | 右上菜单图标墨迹 | y 53.0–74.3 · left 213.3 · 右内缩 34.3 | 同左（±1.5） |
 * | 内容首行「今天」墨迹 | y 163.7–176.0 | y 163.4–… |
 *
 * 两条由此定下的结构性规则：
 *   ① `fromInset === toInset` ⇒ 起手与缩小态的**左边界天然对齐**（参考图 26.0 / 25.0）；
 *   ② `--title-accessory-center`（见 `accessoryCenter()`）⇒ 右上菜单与折叠态标题
 *      **垂直居中共线**，且起手态不动（参考图两态菜单 y 完全相同）。
 *
 * 🔴 **不要在页面里覆写这些数**。要让所有页面的折叠手感一致，
 * 就只能有一个来源 —— 设置页（`SettingsApp.vue`）与相册页（`PhotosApp.vue`）
 * 现在都走 `LargeTitleHeader` + 本文件的常量。
 */
export const LARGE_TITLE = {
  /** 折叠完成所需滚动距离（px） */
  distance: 72,
  fromSize: 36,
  toSize: 22,
  fromInset: 24,
  toInset: 24,
  /** 36 ⇒ 标题行盒顶 54+36 = 90，行盒中心 110.7 = 参考图墨迹中心 110.85 */
  fromTopInset: 36,
  /** −2 ⇒ 行盒顶 52，行盒中心 64.65 = 参考图缩小态墨迹中心 64.85 */
  toTopInset: -2,
  /** 105 ⇒ 条总高 159，「今天」墨迹落 163.4（参考图 163.7） */
  fromHeight: 105,
  toHeight: 64,
  /** 右上角 `#accessory` 槽距机身右缘（px）：参考图图标墨迹右内缩 34.3 */
  accessoryRight: 17
}

/** 标题行盒的 line-height —— 必须与 `LargeTitleHeader.vue` 里 `.lt-title` 的同值（单测守住） */
export const TITLE_LINE_HEIGHT = 1.15

/**
 * 折叠后标题**行盒**的垂直中心，距安全区底部多远（px）。
 *
 * 右上角 `#accessory` 槽用它做 `translateY(-50%)` 的锚点
 * ⇒ 折叠态下菜单与标题**垂直居中对齐**；起手态菜单**不动**（与参考图一致）。
 */
export function accessoryCenter(overrides = {}) {
  const c = { ...LARGE_TITLE, ...overrides }
  const raw = c.toTopInset + (c.toSize * TITLE_LINE_HEIGHT) / 2
  // ⚠️ 必须取整到 2 位：`-2 + 22*1.15/2` 在 IEEE754 下是 10.649999999999999，
  //    直接写进 CSS 变量会污染断言与 devtools（虽然浏览器仍能解析）。
  return Math.round(raw * 100) / 100
}

/** 线性插值 `LARGE_TITLE` 的各量（与实测算术等价：
 *  size = 36 − 14p · inset = 24 · topInset = 36 − 38p · height = 105 − 41p） */
export function largeTitleVars(progress, overrides = {}) {
  const c = { ...LARGE_TITLE, ...overrides }
  const t = clamp(Number(progress) || 0, 0, 1)
  const lerp = (a, b) => a + (b - a) * t
  return {
    '--title-progress': String(t),
    '--title-size': `${lerp(c.fromSize, c.toSize)}px`,
    '--title-inset': `${lerp(c.fromInset, c.toInset)}px`,
    '--title-top-inset': `${lerp(c.fromTopInset, c.toTopInset)}px`,
    '--title-height': `${lerp(c.fromHeight, c.toHeight)}px`,
    // 下面两个**不随 progress 变**：菜单在参考图的两态里位置完全相同
    '--title-accessory-center': `${accessoryCenter(overrides)}px`,
    '--title-accessory-right': `${c.accessoryRight}px`
  }
}

/**
 * 把「`:progress` 传进来的东西」归一成 0~1 的数字。
 *
 * 🔴 必须同时认这四种形态 —— `<script setup>` 里**只有顶层 ref** 会在模板自动解包：
 *    `1`            数字字面量 / 计算属性解包后的值
 *    `ref(0.5)`     裸 ref（顶层 ref 自动解包的边界情况）
 *    `{ progress }` `useLargeTitle()` 的返回值整对象
 *    `{ progress: ref }` 整对象里套 ref
 * 2026-10-12 就因只认数字、漏了裸 ref，让设置页大标题**静默退化**成恒 0（且不报错）。
 * 认不出时返回 `null`（由调用方兜底成 0），绝不返回 `NaN`。
 */
export function asProgress(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value && typeof value.value === 'number') return value.value
  if (value && typeof value.progress === 'number') return value.progress
  if (value && value.progress && typeof value.progress.value === 'number') return value.progress.value
  return null
}

/**
 * 给滚动容器用的大标题滚动跟踪。
 *
 * ```js
 * const lt = useLargeTitle()
 * // 模板：<div class="scroll" @scroll.passive="lt.onScroll">
 * //       <LargeTitleHeader title="照片" :progress="lt.progress" />
 * ```
 *
 * ⚠️ 必须用 `@scroll.passive`（与设置页一致）—— 大标题折叠是纯读操作，
 * 声明 passive 才不会阻塞滚动线程。
 */
export function useLargeTitle(options = {}) {
  const distance = Number(options.distance) > 0 ? Number(options.distance) : LARGE_TITLE.distance
  const scrollTop = ref(0)
  const progress = computed(() => clamp(scrollTop.value / distance, 0, 1))

  /** 直接挂到滚动容器：`@scroll.passive="onScroll"` */
  function onScroll(event) {
    const el = event && event.currentTarget
    scrollTop.value = el ? el.scrollTop : 0
  }

  /** 程序化滚动（复位 / 跳转）时同步一次，避免折叠态残留 */
  function sync(el) {
    scrollTop.value = el ? el.scrollTop : 0
  }

  return { scrollTop, progress, distance, onScroll, sync }
}
