<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import HSettingSlider from '../subpage/HSettingSlider.vue'
import { ref } from 'vue'
import { useDisplaySettingsStore } from '../../../../stores/displaySettingsStore'
import DisplayEyeCareSchedule from './DisplayEyeCareSchedule.vue'
import fieldPreview from '../../../../assets/img/personalization/generated/person-field.jpg'

const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()

const showSchedule = ref(false)
const SCHEDULE_LABEL = { off: '已关闭', scheduled: '定时开启', sunset: '日落至日出' }
</script>

<template>
  <DisplayEyeCareSchedule v-if="showSchedule" @back="showSchedule = false" />
  <SubPageShell v-else title="护眼模式" @back="emit('back')">
    <div class="section-header">睡眠健康</div>
    <div class="eye-preview-wrap">
      <img class="sub-preview-img eye-preview" :src="fieldPreview" alt="护眼效果预览" />
      <span class="eye-sun" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
    </div>

    <div class="settings-card">
      <ListCell
        title="助眠模式"
        subtitle="根据生物节律智能调节色温，提升睡眠质量。"
        last
      >
        <template #right>
          <ToggleSwitch
            :model-value="display.sleepAssist"
            color="blue"
            @update:model-value="v => display.setBool('sleepAssist', v)"
          />
        </template>
      </ListCell>
    </div>

    <div class="section-header">智慧护眼</div>
    <div class="settings-card">
      <ListCell title="护眼模式">
        <template #right>
          <ToggleSwitch
            :model-value="display.eyeCare"
            color="blue"
            @update:model-value="v => display.setBool('eyeCare', v)"
          />
        </template>
      </ListCell>
      <ListCell
        title="定时开启"
        :value="SCHEDULE_LABEL[display.eyeCareSchedule] || '已关闭'"
        chevron
        clickable
        @click="showSchedule = true"
      />
      <div class="slider-row">
        <HSettingSlider
          :model-value="display.eyeCareTemp"
          left-label="冷"
          right-label="暖"
          :disabled="!display.eyeCare"
          @update:model-value="v => display.setNumber('eyeCareTemp', v)"
        />
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.eye-preview-wrap {
  position: relative;
}

.eye-preview {
  height: 168px;
}

.eye-sun {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
}

.slider-row {
  padding: 10px 16px 16px;
}
</style>
