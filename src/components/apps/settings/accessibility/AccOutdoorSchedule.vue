<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import TimePickerSheet from '../../../ui/TimePickerSheet.vue'
import { computed, ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import { parseTimeValue, pad2, to12Hour } from '../../../../utils/timePicker.js'
import './acc.css'

/**
 * 定时开启（真机：户外增强 → 自动开关 → 定时开启）
 * 单选卡两行：已关闭（默认）/ 定时开启；选「定时开启」后展开第二张卡：
 * 开始时间（真机示例 下午11:43）/ 结束时间（上午7:43），点开是底部时间轮（取消 / 确定）。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const timeTarget = ref(null) // 'start' | 'end' | null

function rowTime(hhmm) {
  const { hour24, minute } = parseTimeValue(hhmm)
  const { hour12, period } = to12Hour(hour24)
  return `${period}${hour12}:${pad2(minute)}`
}

const timeSheet = computed(() => {
  if (!timeTarget.value) return null
  const isStart = timeTarget.value === 'start'
  return {
    title: isStart ? '开始时间' : '结束时间',
    modelValue: isStart ? acc.outdoorStart : acc.outdoorEnd
  }
})

function onTimeConfirm(value) {
  if (timeTarget.value) acc.setOutdoorTime(timeTarget.value, value)
  timeTarget.value = null
}
</script>

<template>
  <SubPageShell title="定时开启" @back="emit('back')">
    <div class="acc-page">
      <div class="acc-card" data-testid="schedule-radio">
        <button
          type="button"
          class="acc-radio-row"
          :class="{ 'is-last': false }"
          @click="acc.setOutdoorSchedule('off')"
        >
          <span class="acc-radio-label">已关闭</span>
          <span class="acc-radio" :class="{ 'is-on': acc.outdoorSchedule === 'off' }"></span>
        </button>
        <button
          type="button"
          class="acc-radio-row is-last"
          @click="acc.setOutdoorSchedule('scheduled')"
        >
          <span class="acc-radio-label">定时开启</span>
          <span class="acc-radio" :class="{ 'is-on': acc.outdoorSchedule === 'scheduled' }"></span>
        </button>
      </div>

      <div v-if="acc.outdoorSchedule === 'scheduled'" class="acc-card" data-testid="schedule-times">
        <ListCell
          title="开始时间"
          :value="rowTime(acc.outdoorStart)"
          chevron
          @click="timeTarget = 'start'"
        />
        <ListCell
          title="结束时间"
          :value="rowTime(acc.outdoorEnd)"
          chevron
          last
          @click="timeTarget = 'end'"
        />
      </div>
    </div>

    <TimePickerSheet
      :visible="Boolean(timeTarget)"
      :title="timeSheet?.title || '开始时间'"
      :model-value="timeSheet?.modelValue || '23:43'"
      @confirm="onTimeConfirm"
      @cancel="timeTarget = null"
      @close="timeTarget = null"
    />
  </SubPageShell>
</template>

<style scoped>
.acc-radio-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 16px;
  background: transparent;
  border: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  position: relative;
}

.acc-radio-row:not(.is-last)::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 0;
  bottom: 0;
  height: 0.5px;
  background: rgba(60, 60, 67, 0.12);
}

.acc-radio-row:active {
  background: rgba(0, 0, 0, 0.03);
}

.acc-radio-label {
  font-size: 17px;
  line-height: 24px;
  color: #111;
}

.acc-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid rgba(60, 60, 67, 0.3);
  box-sizing: border-box;
  flex: none;
  position: relative;
}

.acc-radio.is-on {
  border-color: #2f6bf6;
}

.acc-radio.is-on::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: #2f6bf6;
}
</style>
