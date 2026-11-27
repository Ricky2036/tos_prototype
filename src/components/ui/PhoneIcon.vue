<template>
  <!-- 听筒（填充式）：与 GLYPHS.phone 同一份 Material 路径。电话应用 9 处内联收敛到此。 -->
  <svg :width="size" :height="size" viewBox="0 0 24 24" :fill="color" :style="style">
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 20 },
  color: { type: String, default: 'currentColor' },
  style: { type: [String, Object], default: '' }
})
</script>
