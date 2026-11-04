<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useDisplaySettingsStore, THEME_SCHEDULE_OPTIONS } from '../../../../stores/displaySettingsStore'

const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()

function pick(value) {
  display.setThemeSchedule(value)
}
</script>

<template>
  <SubPageShell title="定时切换主题" @back="emit('back')">
    <div class="settings-card">
      <ListCell
        v-for="(opt, i) in THEME_SCHEDULE_OPTIONS"
        :key="opt.value"
        :title="opt.label"
        :last="i === THEME_SCHEDULE_OPTIONS.length - 1"
        clickable
        @click="pick(opt.value)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: display.themeSchedule === opt.value }"></span>
        </template>
      </ListCell>
    </div>
    <div class="card-note">定时切换主题将在屏幕熄灭后生效。</div>
  </SubPageShell>
</template>
