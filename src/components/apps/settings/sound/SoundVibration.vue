<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import HSettingSlider from '../subpage/HSettingSlider.vue'
import { useSoundSettingsStore } from '../../../../stores/soundSettingsStore'

const emit = defineEmits(['back'])
const sound = useSoundSettingsStore()
</script>

<template>
  <SubPageShell title="振动强度" @back="emit('back')">
    <div class="settings-card">
      <div class="vib-block">
        <div class="vib-title">来电与闹钟</div>
        <HSettingSlider
          :model-value="sound.vibrateCall"
          left-label="弱"
          right-label="强"
          @update:model-value="v => sound.setNumber('vibrateCall', v)"
        />
      </div>
    </div>

    <div class="settings-card">
      <div class="vib-block">
        <div class="vib-title">信息与通知</div>
        <HSettingSlider
          :model-value="sound.vibrateNotif"
          left-label="弱"
          right-label="强"
          @update:model-value="v => sound.setNumber('vibrateNotif', v)"
        />
      </div>
    </div>

    <div class="settings-card">
      <ListCell
        title="来电时外放振动声音"
        subtitle="通过外放振动声音来避免漏接电话。"
        last
      >
        <template #right>
          <ToggleSwitch
            :model-value="sound.vibrateLoudSpeaker"
            color="blue"
            @update:model-value="v => sound.setBool('vibrateLoudSpeaker', v)"
          />
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>

<style scoped>
.vib-block {
  padding: 14px 16px 18px;
}

.vib-title {
  font-size: 16px;
  color: #111;
  margin-bottom: 12px;
}
</style>
