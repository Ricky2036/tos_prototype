<script setup>
/**
 * 数字健康里的 Material 方形复选框（真机 dh_62 未选 / dh_63 已选）。
 *
 * 真机量测（480 缩略图 → 360 画布）：20×20、圆角 3；未选是 1.6px 灰边空心，
 * 已选是 #1A73E8 实心 + 白色对勾。**不是** 圆形单选、也**不是** iOS 的圆形开关。
 */
defineProps({
  checked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['toggle'])
</script>

<template>
  <button
    type="button"
    class="dh-check"
    :class="{ on: checked, disabled }"
    role="checkbox"
    :aria-checked="checked"
    :disabled="disabled"
    @click.stop="emit('toggle')"
  >
    <svg v-if="checked" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M5 12.6L9.6 17.2L19 7.8" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>
</template>

<style scoped>
.dh-check {
  width: 20px;
  height: 20px;
  flex: none;
  padding: 0;
  border: 1.6px solid #747775;
  border-radius: 3px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.dh-check.on {
  border-color: #1A73E8;
  background: #1A73E8;
}

.dh-check.disabled { opacity: 0.4; cursor: default; }
</style>
