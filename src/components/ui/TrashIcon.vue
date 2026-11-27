<template>
  <!--
    全仓统一的删除图标（描边垃圾桶：盖子 + 桶身 + 提手 + 桶内两条竖线）。
    与通知中心清空按钮 / 最近任务清空按钮同一份 path。
    ⚠️ 历史上有 6 处电话页内联了一个少两条竖线的残次版本，已全部收敛到这里。
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
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 18 },
  color: { type: String, default: 'currentColor' },
  strokeWidth: { type: [Number, String], default: 1.8 }
})
</script>
