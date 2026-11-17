<script setup>
import { computed } from 'vue'

const props = defineProps({
  brightness: { type: Number, required: true }
})

const threshold = 0.8
const intensity = computed(() => Math.max(0, (props.brightness - threshold) / (1 - threshold)))
</script>

<template>
  <div
    class="brightness-power-hint"
    :style="{ '--heat-opacity': intensity }"
    aria-hidden="true"
  />
</template>

<style scoped>
.brightness-power-hint {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: var(--volume-plus-200);
  opacity: var(--heat-opacity);
  transition: opacity 180ms ease-out;
}
</style>
