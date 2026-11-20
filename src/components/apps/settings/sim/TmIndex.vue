<script setup>
/**
 * A-Z 导轨（流量管理里的两个应用列表页共用）
 * 不拖拽，只点：点一个字母跳到该组第一行（真机上也是点击优先）。
 */
defineProps({
  letters: { type: Array, required: true },
  available: { type: Array, default: () => [] }
})
const emit = defineEmits(['select'])
</script>

<template>
  <div class="tm-index" data-testid="tm-index">
    <span
      v-for="letter in letters"
      :key="letter"
      class="tm-index-letter"
      :class="{ 'has-apps': available.includes(letter) }"
      :data-index-letter="letter"
      @click.stop="emit('select', letter)"
    >{{ letter }}</span>
  </div>
</template>
