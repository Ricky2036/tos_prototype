<script setup>
import { computed } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useBatteryStore } from '../../../../stores/batteryStore'

/**
 * 无线反向充电（真机：充电设置 → 无线反向充电）
 * 证据：`.local-evidence/SET-BAT-01/08-reverse-wireless.*`
 */
const emit = defineEmits(['back'])
const store = useBatteryStore()

const enabled = computed({
  get: () => store.reverseWireless,
  set: (v) => store.patch({ reverseWireless: v })
})
</script>

<template>
  <SubPageShell title="无线反向充电" @back="emit('back')">
    <div class="reverse-figure">
      <div class="phone-body">
        <svg width="46" height="46" viewBox="0 0 44 44" fill="none">
          <path d="M24 8L14 25h7l-1 11 10-17h-7l1-11Z" fill="#34C759" />
          <path d="M10 15a14 14 0 0 0 0 14" stroke="#34C759" stroke-width="2.4" stroke-linecap="round" />
          <path d="M34 15a14 14 0 0 1 0 14" stroke="#34C759" stroke-width="2.4" stroke-linecap="round" />
        </svg>
      </div>
    </div>

    <div class="reverse-desc">请将支持无线充电的设备（手机、平板、可穿戴设备等），放在本机的背面。</div>

    <div class="settings-card">
      <ListCell title="无线反向充电" last>
        <template #right><ToggleSwitch v-model="enabled" color="blue" /></template>
      </ListCell>
    </div>
  </SubPageShell>
</template>

<style scoped>
.reverse-figure { display: flex; justify-content: center; padding: 18px 0 22px; }

.phone-body {
  width: 168px;
  height: 300px;
  border-radius: 30px;
  border: 2.5px solid #8E8E93;
  background: #FFFFFF;
  box-shadow: 14px 16px 0 rgba(142, 142, 147, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
}

.reverse-desc { font-size: 13px; line-height: 19px; color: #8E8E93; padding: 0 4px 16px; }
</style>
