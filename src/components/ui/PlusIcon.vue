<template>
  <!-- 加号（描边）：新建会话、模式、例程等处共用 -->
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 20 },
  color: { type: String, default: 'currentColor' },
  strokeWidth: { type: [Number, String], default: 2 }
})
</script>
