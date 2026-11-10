<script setup>
import { computed, ref } from 'vue'
import DhShell from './DhShell.vue'
import DhSwitch from './DhSwitch.vue'
import LIcon from '../../../ui/LIcon.vue'
import TimePickerSheet from '../../../ui/TimePickerSheet.vue'
import { useDigitalHealthStore, DH_DAY_LABELS, DH_DAY_FULL } from '../../../../stores/digitalHealthStore.js'

/**
 * 睡眠时间表（真机「"睡觉"日常安排 → 启用时间表」进去的那一屏）。
 *
 * 结构：开始时间 / 结束时间（点开走**全仓标准** `TimePickerSheet`）+
 * 重复（日…六 圆点胶囊，按 `getDay()` 编号）+ 闹钟行为开关 + 汇总说明。
 * ⚠️ 实时写 store，没有「保存」按钮 —— 真机这一屏也是改了即生效。
 */
const emit = defineEmits(['back', 'toast'])
const dh = useDigitalHealthStore()

const sched = computed(() => dh.state.sleep.schedule)
const picking = ref('')

const daysText = computed(() => {
  const d = sched.value.days
  if (!d.length) return '未选择重复日'
  if (d.length === 7) return '每天'
  if (d.length === 5 && [1, 2, 3, 4, 5].every(x => d.includes(x))) return '工作日'
  if (d.length === 2 && d.includes(0) && d.includes(6)) return '周末'
  return d.map(x => DH_DAY_FULL[x]).join('、')
})

const durationText = computed(() => {
  const [sh, sm] = sched.value.start.split(':').map(Number)
  const [eh, em] = sched.value.end.split(':').map(Number)
  let m = (eh * 60 + em) - (sh * 60 + sm)
  if (m <= 0) m += 24 * 60
  const h = Math.floor(m / 60)
  return h ? `${h} 小时${m % 60 ? ` ${m % 60} 分钟` : ''}` : `${m} 分钟`
})

function onTimeConfirm(v) {
  dh.setSleepSchedule({ [picking.value]: v })
  emit('toast', picking.value === 'start' ? `开始时间设为 ${v}` : `结束时间设为 ${v}`)
}
</script>

<template>
  <DhShell title="睡眠时间表" @back="emit('back')">
    <p class="dh-note">到达开始时间后，设备会自动进入睡眠模式并在结束时间退出。</p>

    <div class="dh-card">
      <button type="button" class="dh-row" data-dh-sched-start @click="picking = 'start'">
        <LIcon name="clock" :size="20" />
        <span class="dh-row-main"><span class="dh-row-title">开始时间</span></span>
        <span class="dh-value" data-dh-sched-start-value>{{ sched.start }}</span>
      </button>
      <div class="dh-divider"></div>
      <button type="button" class="dh-row" data-dh-sched-end @click="picking = 'end'">
        <LIcon name="clock" :size="20" />
        <span class="dh-row-main"><span class="dh-row-title">结束时间</span></span>
        <span class="dh-value" data-dh-sched-end-value>{{ sched.end }}</span>
      </button>
    </div>

    <div class="dh-label">重复</div>
    <div class="dh-card dh-days" data-dh-sched-days>
      <button
        v-for="(label, i) in DH_DAY_LABELS"
        :key="i"
        type="button"
        class="dh-day"
        :class="{ on: sched.days.includes(i) }"
        :data-dh-sched-day="i"
        @click="dh.toggleSleepDay(i)"
      >{{ label }}</button>
    </div>
    <p class="dh-note" data-dh-sched-summary>{{ daysText }} · 每晚 {{ durationText }}</p>

    <div class="dh-card">
      <div class="dh-row">
        <LIcon name="bell" :size="20" />
        <span class="dh-row-main">
          <span class="dh-row-title">闹钟行为</span>
          <span class="dh-row-sub">睡眠期间到点时正常响铃</span>
        </span>
        <DhSwitch
          :model-value="dh.state.sleep.alarmBehavior"
          data-dh-sched-alarm
          @update:model-value="dh.setAlarmBehavior($event)"
        />
      </div>
    </div>

    <p class="dh-note">睡眠模式开启期间，仅闹钟和您允许的联系人来电会发出声音。</p>

    <TimePickerSheet
      :visible="Boolean(picking)"
      :title="picking === 'start' ? '开始时间' : '结束时间'"
      :model-value="picking === 'start' ? sched.start : sched.end"
      @confirm="onTimeConfirm"
      @close="picking = ''"
      @cancel="picking = ''"
    />
  </DhShell>
</template>

<style scoped>
.dh-value { font-size: 15.5px; color: #5F6368; flex: none; }

.dh-days {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  padding: 14px 16px;
}

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
  transition: background 0.15s ease, color 0.15s ease;
}

.dh-day.on { background: #1A73E8; color: #FFFFFF; }
</style>
