<script setup>
import { ref, watch, computed } from 'vue'
import SheetModal from '../../../ui/SheetModal.vue'
import LIcon from '../../../ui/LIcon.vue'
import { formatDndTime } from '../../../../stores/dndSettingsStore.js'

/**
 * 真机「开始时间 / 结束时间」：底部弹层，三列（小时 / 分钟 / 上午下午）+ 取消 / 确定。
 * 原型用「上下步进」替代原生滚轮，交互等价、外观沿用统一 SheetModal。
 */
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '开始时间' },
  hour: { type: Number, default: 22 },
  minute: { type: Number, default: 0 }
})
const emit = defineEmits(['close', 'confirm'])

const h24 = ref(props.hour)
const m = ref(props.minute)

watch(() => props.visible, (v) => {
  if (v) { h24.value = props.hour; m.value = props.minute }
})

const period = computed(() => (h24.value < 12 ? '上午' : '下午'))
const h12 = computed(() => (h24.value % 12 === 0 ? 12 : h24.value % 12))
const current = computed(() => formatDndTime(h24.value, m.value))

function stepHour(delta) { h24.value = (h24.value + delta + 24) % 24 }
function stepMinute(delta) { m.value = (m.value + delta + 60) % 60 }
function togglePeriod() { h24.value = (h24.value + 12) % 24 }
function confirm() { emit('confirm', { hour: h24.value, minute: m.value }) }
</script>

<template>
  <SheetModal :visible="visible" @close="emit('close')">
    <div class="dnd-sheet-title">{{ title }}</div>
    <div class="dnd-time-current">{{ current }}</div>
    <div class="dnd-time-cols">
      <div class="dnd-time-col">
        <button type="button" aria-label="小时加一" @click="stepHour(1)"><LIcon name="chevronUp" :size="18" /></button>
        <span>{{ h12 }}</span>
        <button type="button" aria-label="小时减一" @click="stepHour(-1)"><LIcon name="chevronDown" :size="18" /></button>
      </div>
      <div class="dnd-time-col">
        <button type="button" aria-label="分钟加一" @click="stepMinute(1)"><LIcon name="chevronUp" :size="18" /></button>
        <span>{{ String(m).padStart(2, '0') }}</span>
        <button type="button" aria-label="分钟减一" @click="stepMinute(-1)"><LIcon name="chevronDown" :size="18" /></button>
      </div>
      <div class="dnd-time-col">
        <button type="button" aria-label="切换上午下午" @click="togglePeriod"><LIcon name="chevronUp" :size="18" /></button>
        <span>{{ period }}</span>
        <button type="button" aria-label="切换上午下午" @click="togglePeriod"><LIcon name="chevronDown" :size="18" /></button>
      </div>
    </div>
    <div class="dnd-sheet-actions">
      <button type="button" class="dnd-cancel" @click="emit('close')">取消</button>
      <button type="button" class="dnd-confirm" @click="confirm">确定</button>
    </div>
  </SheetModal>
</template>

<style scoped>
.dnd-sheet-title { text-align: center; font-size: 17px; font-weight: 700; color: #111; }
.dnd-time-current { text-align: center; font-size: 19px; font-weight: 600; color: #111; padding: 6px 0 14px; }
.dnd-time-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 6px 8px 16px; }
.dnd-time-col { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; }
.dnd-time-col span { font-size: 22px; font-weight: 500; color: #111; min-width: 52px; text-align: center; }
.dnd-time-col button {
  width: 40px; height: 30px; border: none; background: transparent; color: #8E8E93;
  display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0;
}
.dnd-time-col button:active { color: #2F6BF6; }
.dnd-sheet-actions { display: flex; gap: 12px; margin-top: 8px; }
.dnd-sheet-actions button {
  flex: 1; height: 48px; border: none; border-radius: 24px; font-family: inherit;
  font-size: 16px; font-weight: 500; cursor: pointer;
}
.dnd-cancel { background: #F2F2F7; color: #111; }
.dnd-confirm { background: #2F6BF6; color: #fff; }
</style>
