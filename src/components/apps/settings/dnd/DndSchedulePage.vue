<script setup>
import { computed } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import {
  DND_SCHEDULE_MODES, DND_WEEKDAYS, formatDndTime, useDndSettingsStore
} from '../../../../stores/dndSettingsStore.js'

/** 真机「定时开启」三级页：2 个单选 + 开始/结束时间 + 重复。 */
const emit = defineEmits(['back', 'pick-time', 'pick-repeat'])
const store = useDndSettingsStore()
const s = store.state

const startLabel = computed(() => formatDndTime(s.startHour, s.startMinute))
const endLabel = computed(() =>
  (s.startHour > s.endHour ? '次日 ' : '') + formatDndTime(s.endHour, s.endMinute)
)
const repeatLabel = computed(() => s.repeatDays.map(d => DND_WEEKDAYS[d]).join(', '))
</script>

<template>
  <SubPageShell title="定时开启" @back="emit('back')">
    <div class="settings-card">
      <ListCell
        v-for="(mode, i) in DND_SCHEDULE_MODES"
        :key="mode"
        :title="mode"
        :last="i === DND_SCHEDULE_MODES.length - 1"
        clickable
        @click="store.setScheduleMode(mode)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: s.scheduleMode === mode }"></span>
        </template>
      </ListCell>
    </div>

    <div class="settings-card" :class="{ 'is-off': s.scheduleMode === '已关闭' }">
      <ListCell title="开始时间" :value="startLabel" chevron @click="emit('pick-time', 'start')" />
      <ListCell title="结束时间" :value="endLabel" chevron @click="emit('pick-time', 'end')" />
      <ListCell title="重复" :value="repeatLabel" chevron last @click="emit('pick-repeat')" />
    </div>
  </SubPageShell>
</template>

<style scoped>
.settings-card.is-off { opacity: 0.6; }
</style>
