<script setup>
import LIcon from '../../../ui/LIcon.vue'

/**
 * 通知方式二选一（静音 / 允许）。
 * 真机口径：整块是淡紫灰底（#ECEBF4），两行同色、无描边分隔；
 * 选中只体现在右侧蓝色勾，文字保持黑色，不整行翻白。
 */
defineProps({
  mode: { type: String, default: 'allow' }
})
defineEmits(['select'])
</script>

<template>
  <div class="focus-mode-card" data-focus-mode-card>
    <button
      type="button"
      :class="{ selected: mode === 'silence' }"
      data-focus-notification-mode="silence"
      @click="$emit('select', 'silence')"
    >
      <span class="fmc-icon"><LIcon name="bellOff" :size="19" /></span>
      <span class="fmc-label">静音下列通知</span>
      <span class="fmc-check"><LIcon v-if="mode === 'silence'" name="check" :size="18" :stroke-width="2.6" /></span>
    </button>
    <button
      type="button"
      :class="{ selected: mode === 'allow' }"
      data-focus-notification-mode="allow"
      @click="$emit('select', 'allow')"
    >
      <span class="fmc-icon"><span class="fmc-badge"><LIcon name="check" :size="12" :stroke-width="3.2" /></span></span>
      <span class="fmc-label">允许下列通知</span>
      <span class="fmc-check"><LIcon v-if="mode === 'allow'" name="check" :size="18" :stroke-width="2.6" /></span>
    </button>
  </div>
</template>

<style scoped>
.focus-mode-card {
  overflow: hidden;
  border-radius: 16px;
  background: #ECEBF4;
  padding: 0;
}
.focus-mode-card button {
  width: 100%;
  min-height: 36px;
  padding: 0 12px;
  border: 0;
  background: transparent;
  color: #1C1C1E;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 22px;
  align-items: center;
  gap: 6px;
  text-align: left;
  font: 400 14px/1.3 var(--font-stack);
  cursor: pointer;
}
.focus-mode-card button:active { background: rgba(120, 120, 140, .1); }
.fmc-icon, .fmc-check {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.fmc-icon { color: #48484A; }
.fmc-badge { width: 18px; height: 18px; border-radius: 50%; background: #34C759; color: #fff; display: inline-flex; align-items: center; justify-content: center; }
.fmc-check { color: #0A84FF; }
.fmc-label { min-width: 0; }
</style>
