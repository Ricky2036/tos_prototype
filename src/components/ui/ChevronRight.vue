<template>
  <!--
    右箭头（24×24 网格，M9 18l6-6-6-6）。
    全仓唯一来源：设置 / 电话 / 模式 / 时钟各页的列表行箭头都应走这里，
    不要再各写一份内联 SVG（历史上同一台设备上出现过 7×12 与 24×24 两套网格，
    导致设置页箭头小细、电话设置箭头大粗）。
  -->
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 16 },
  color: { type: String, default: 'currentColor' },
  strokeWidth: { type: [Number, String], default: 2 }
})
</script>
