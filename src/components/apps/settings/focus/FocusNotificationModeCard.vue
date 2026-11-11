<script setup>
import LIcon from '../../../ui/LIcon.vue'

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
      <span class="fmc-check"><LIcon v-if="mode === 'silence'" name="check" :size="18" /></span>
    </button>
    <button
      type="button"
      :class="{ selected: mode === 'allow' }"
      data-focus-notification-mode="allow"
      @click="$emit('select', 'allow')"
    >
      <span class="fmc-icon"><LIcon name="badgeCheck" :size="19" /></span>
      <span class="fmc-label">允许下列通知</span>
      <span class="fmc-check"><LIcon v-if="mode === 'allow'" name="check" :size="18" /></span>
    </button>
  </div>
</template>

<style scoped>
.focus-mode-card {
  overflow: hidden;
  border-radius: 12px;
  background: #F2F2F7;
}
.focus-mode-card button {
  width: 100%;
  min-height: 37px;
  padding: 0 14px;
  border: 0;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
  background: transparent;
  color: #1C1C1E;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) 22px;
  align-items: center;
  gap: 12px;
  text-align: left;
  font: 400 13.5px/1.3 var(--font-stack);
  cursor: pointer;
}
.focus-mode-card button:last-child { border-bottom: 0; }
.focus-mode-card button.selected { background: #fff; color: #0A84FF; }
.fmc-icon, .fmc-check {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.fmc-check { color: #0A84FF; }
.fmc-label { min-width: 0; }
</style>
