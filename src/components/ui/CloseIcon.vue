<template>
  <!-- 关闭 ×（描边） -->
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" :stroke="color" :stroke-width="strokeWidth" stroke-linecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 20 },
  color: { type: String, default: 'currentColor' },
  strokeWidth: { type: [Number, String], default: 2.2 }
})
</script>
