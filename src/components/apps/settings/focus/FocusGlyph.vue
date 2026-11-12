<script setup>
import LIcon from '../../../ui/LIcon.vue'

defineProps({
  name: { type: String, default: 'moon' },
  color: { type: String, default: '#5E5CE6' },
  size: { type: Number, default: 38 },
  iconSize: { type: Number, default: 21 },
  hollow: { type: Boolean, default: false }
})
</script>

<template>
  <span
    class="focus-glyph"
    :class="{ hollow }"
    :style="{
      width: `${size}px`, height: `${size}px`,
      color: hollow ? color : '#fff',
      background: hollow ? `${color}16` : color,
      boxShadow: hollow ? `inset 0 0 0 1.5px ${color}30` : 'none'
    }"
  >
    <LIcon :name="name" :size="iconSize" :stroke-width="2" />
  </span>
</template>

<style scoped>
.focus-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex: none;
  /* 图形大于圆盘时按圆裁掉：真机的小号时钟是「实心盘 + 白色指针」，
     没有单独的白色表圈，图标按 24（大于盘径）传入把外圈裁掉即可（见各调用点注释） */
  overflow: hidden;
}
</style>
