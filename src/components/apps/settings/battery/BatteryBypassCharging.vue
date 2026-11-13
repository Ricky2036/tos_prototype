<script setup>
import { computed } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useBatteryStore } from '../../../../stores/batteryStore'

/**
 * 旁路充电（真机：充电设置 → 旁路充电）
 * 证据：`.local-evidence/SET-BAT-01/09-bypass-charging.*`
 */
const emit = defineEmits(['back'])
const store = useBatteryStore()

const enabled = computed({
  get: () => store.bypassCharging,
  set: (v) => store.patch({ bypassCharging: v })
})
</script>

<template>
  <SubPageShell title="旁路充电" @back="emit('back')">
    <div class="bypass-desc">
      亮屏充电至生效电量时，优先为主板供电以降低发热，并以微电流动态养护电池，延长电池寿命。开启后电量缓慢上升属正常现象。
    </div>

    <div class="settings-card">
      <ListCell title="旁路充电" subtitle="有线充电时生效，电源断开后自动关闭。" last>
        <template #right><ToggleSwitch v-model="enabled" color="blue" /></template>
      </ListCell>
    </div>
  </SubPageShell>
</template>

<style scoped>
.bypass-desc { font-size: 13px; line-height: 20px; color: #8E8E93; padding: 4px 4px 16px; }
</style>
