<script setup>
import { ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import BatteryWirelessPosition from './BatteryWirelessPosition.vue'
import { useBatteryStore, CHARGE_SPEED_OPTIONS } from '../../../../stores/batteryStore'

/**
 * 充电设置（真机：设置 → 电池与省电 → 充电设置）
 * 证据：`.local-evidence/SET-BAT-01/06-charging.*` / `07-wireless-position.*`
 */
const emit = defineEmits(['back', 'open-reverse', 'open-bypass'])
const store = useBatteryStore()

/** 无线充电感应位置是真机上的全屏模态（背景仍是被压暗的充电设置页） */
const showWireless = ref(false)

function chooseSpeed(value) {
  store.patch({ chargeSpeed: value })
}
</script>

<template>
  <SubPageShell title="充电设置" @back="emit('back')">
    <div class="section-header">默认充电速度</div>

    <div class="settings-card">
      <ListCell
        v-for="opt in CHARGE_SPEED_OPTIONS"
        :key="opt.value"
        :title="opt.title"
        :subtitle="opt.subtitle"
        clickable
        :last="opt.value === CHARGE_SPEED_OPTIONS[CHARGE_SPEED_OPTIONS.length - 1].value"
        @click="chooseSpeed(opt.value)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: store.chargeSpeed === opt.value }"></span>
        </template>
      </ListCell>
    </div>

    <div class="hint-line">提示：使用三方充电器时部分功能可能不可用。</div>

    <div class="settings-card">
      <ListCell title="无线充电感应位置" chevron @click="showWireless = true" />
      <ListCell
        title="无线反向充电"
        subtitle="使用本机为其他设备无线充电。"
        chevron
        last
        @click="emit('open-reverse')"
      />
    </div>

    <div class="settings-card">
      <ListCell title="旁路充电" chevron last @click="emit('open-bypass')" />
    </div>
  </SubPageShell>

  <BatteryWirelessPosition v-if="showWireless" @back="showWireless = false" />
</template>

<style scoped>
.hint-line { font-size: 12px; color: #8E8E93; padding: 0 4px 14px; }
</style>
