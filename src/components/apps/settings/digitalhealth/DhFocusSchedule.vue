<script setup>
import { computed, ref } from 'vue'
import DhShell from './DhShell.vue'
import LIcon from '../../../ui/LIcon.vue'
import TimePickerSheet from '../../../ui/TimePickerSheet.vue'
import { useDigitalHealthStore, DH_DAY_LABELS, DH_DAY_FULL } from '../../../../stores/digitalHealthStore.js'

/**
 * 专注模式 · 设置时间表（真机「+ 设置时间表」进去的那一屏）。
 *
 * 结构：名称输入 + 开始/结束时间（走标准 `TimePickerSheet`）+ 重复日圆点胶囊 +
 * 底部悬浮「保存」。保存后回到专注模式页，时间表出现在列表里并可删除。
 * ⚠️ 至少要选一天，且起止时间不能相同 —— 否则保存按钮保持禁用（真机同样拦）。
 */
const emit = defineEmits(['back', 'saved', 'toast'])
const dh = useDigitalHealthStore()

const name = ref('专注时间')
const start = ref('09:00')
const end = ref('12:00')
const days = ref([1, 2, 3, 4, 5])
const picking = ref('')

const canSave = computed(() => days.value.length > 0 && start.value !== end.value && name.value.trim().length > 0)

const daysText = computed(() => {
  const d = [...days.value].sort()
  if (d.length === 7) return '每天'
  if (d.length === 5 && [1, 2, 3, 4, 5].every(x => d.includes(x))) return '工作日'
  return d.map(x => DH_DAY_FULL[x]).join('、')
})

function toggleDay(i) {
  days.value = days.value.includes(i) ? days.value.filter(d => d !== i) : [...days.value, i]
}

function onTimeConfirm(v) {
  if (picking.value === 'start') start.value = v
  else end.value = v
}

function save() {
  if (!canSave.value) return
  const id = dh.addFocusSchedule({
    name: name.value.trim(),
    start: start.value,
    end: end.value,
    days: days.value
  })
  if (!id) {
    emit('toast', '时间表保存失败，请检查时间与重复日')
    return
  }
  emit('saved', id)
}
</script>

<template>
  <DhShell title="设置时间表" @back="emit('back')">
    <div class="dh-card dh-name-card">
      <input
        v-model="name"
        class="dh-name-input"
        data-dh-fs-name
        maxlength="24"
        placeholder="时间表名称"
      />
    </div>

    <div class="dh-card">
      <button type="button" class="dh-row" data-dh-fs-start @click="picking = 'start'">
        <LIcon name="clock" :size="20" />
        <span class="dh-row-main"><span class="dh-row-title">开始时间</span></span>
        <span class="dh-value">{{ start }}</span>
      </button>
      <div class="dh-divider"></div>
      <button type="button" class="dh-row" data-dh-fs-end @click="picking = 'end'">
        <LIcon name="clock" :size="20" />
        <span class="dh-row-main"><span class="dh-row-title">结束时间</span></span>
        <span class="dh-value">{{ end }}</span>
      </button>
    </div>

    <div class="dh-label">重复</div>
    <div class="dh-card dh-days" data-dh-fs-days>
      <button
        v-for="(label, i) in DH_DAY_LABELS"
        :key="i"
        type="button"
        class="dh-day"
        :class="{ on: days.includes(i) }"
        :data-dh-fs-day="i"
        @click="toggleDay(i)"
      >{{ label }}</button>
    </div>
    <p class="dh-note">{{ daysText }}</p>

    <div class="dh-focus-hint">
      <LIcon name="info" :size="15" />
      <span>到达开始时间会自动开启专注模式，屏蔽你在下方勾选的应用。</span>
    </div>

    <div class="dh-fs-tail"></div>

    <template #bottom>
      <div class="dh-save-wrap">
        <button type="button" class="dh-pill dh-save" :disabled="!canSave" data-dh-fs-save @click="save">保存</button>
      </div>
    </template>

    <TimePickerSheet
      :visible="Boolean(picking)"
      :title="picking === 'start' ? '开始时间' : '结束时间'"
      :model-value="picking === 'start' ? start : end"
      @confirm="onTimeConfirm"
      @close="picking = ''"
      @cancel="picking = ''"
    />
  </DhShell>
</template>

<style scoped>
.dh-name-card { padding: 4px 16px; }

.dh-name-input {
  width: 100%;
  height: 52px;
  border: none;
  outline: none;
  background: transparent;
  font-family: inherit;
  font-size: 16px;
  color: #1F1F1F;
}

.dh-value { font-size: 15.5px; color: #5F6368; flex: none; }

.dh-days { display: flex; justify-content: space-between; gap: 4px; padding: 14px 16px; }

.dh-day {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: #EDEEF0;
  color: #3C4043;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  flex: none;
}

.dh-day.on { background: #1A73E8; color: #FFFFFF; }

.dh-focus-hint {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 6px 6px 0;
  font-size: 12.5px;
  line-height: 18px;
  color: #5F6368;
}

.dh-fs-tail { height: 84px; }

.dh-save-wrap {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 24px;
  z-index: 6;
}

.dh-save { width: 100%; height: 46px; }
</style>
