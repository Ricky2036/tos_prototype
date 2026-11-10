<script setup>
import { ref, watch } from 'vue'
import SheetModal from '../../../ui/SheetModal.vue'
import LIcon from '../../../ui/LIcon.vue'
import { DND_WEEKDAYS_FULL } from '../../../../stores/dndSettingsStore.js'

/** 真机「重复」：底部弹层里的 7 个星期多选 + 取消 / 确定。 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  modelValue: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'confirm'])

const draft = ref([...props.modelValue])
watch(() => props.visible, (v) => { if (v) draft.value = [...props.modelValue] })

function toggle(i) {
  draft.value = draft.value.includes(i)
    ? draft.value.filter(d => d !== i)
    : [...draft.value, i].sort((a, b) => a - b)
}

function confirm() {
  if (!draft.value.length) return
  emit('confirm', [...draft.value])
}
</script>

<template>
  <SheetModal :visible="visible" @close="emit('close')">
    <div class="dnd-sheet-title">重复</div>
    <button
      v-for="(day, i) in DND_WEEKDAYS_FULL"
      :key="day"
      type="button"
      class="dnd-repeat-row"
      @click="toggle(i)"
    >
      <span>{{ day }}</span>
      <span class="dnd-check" :class="{ on: draft.includes(i) }">
        <LIcon v-if="draft.includes(i)" name="check" :size="14" :stroke-width="3" />
      </span>
    </button>
    <div class="dnd-sheet-actions">
      <button type="button" class="dnd-cancel" @click="emit('close')">取消</button>
      <button type="button" class="dnd-confirm" :disabled="!draft.length" @click="confirm">确定</button>
    </div>
  </SheetModal>
</template>

<style scoped>
.dnd-sheet-title { text-align: center; font-size: 17px; font-weight: 700; color: #111; padding-bottom: 12px; }
.dnd-repeat-row {
  width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: space-between;
  border: none; background: transparent; font-family: inherit; font-size: 16px; color: #111;
  padding: 4px; cursor: pointer; text-align: left;
}
.dnd-check {
  width: 20px; height: 20px; border-radius: 5px; border: 1.5px solid #C7C7CC;
  box-sizing: border-box; display: flex; align-items: center; justify-content: center; color: #fff; flex: none;
}
.dnd-check.on { background: #2F6BF6; border-color: #2F6BF6; }
.dnd-sheet-actions { display: flex; gap: 12px; margin-top: 12px; }
.dnd-sheet-actions button {
  flex: 1; height: 48px; border: none; border-radius: 24px; font-family: inherit;
  font-size: 16px; font-weight: 500; cursor: pointer;
}
.dnd-cancel { background: #F2F2F7; color: #111; }
.dnd-confirm { background: #2F6BF6; color: #fff; }
.dnd-confirm:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
