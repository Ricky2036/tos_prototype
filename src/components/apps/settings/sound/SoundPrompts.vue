<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useSoundSettingsStore } from '../../../../stores/soundSettingsStore'

const emit = defineEmits(['back'])
const sound = useSoundSettingsStore()

const PROMPTS = [
  { key: 'promptDial', title: '拨号键盘提示音' },
  { key: 'promptScreenshot', title: '截屏提示音' },
  { key: 'promptDelete', title: '删除提示音' },
  { key: 'promptLock', title: '锁屏提示音' },
  { key: 'promptCharge', title: '充电提示音' },
  { key: 'promptTouch', title: '触摸提示音' }
]

function valueOf(key) {
  const map = {
    promptDial: sound.promptDial,
    promptScreenshot: sound.promptScreenshot,
    promptDelete: sound.promptDelete,
    promptLock: sound.promptLock,
    promptCharge: sound.promptCharge,
    promptTouch: sound.promptTouch
  }
  return Boolean(map[key])
}
</script>

<template>
  <SubPageShell title="提示音" @back="emit('back')">
    <div class="settings-card">
      <ListCell
        v-for="(p, i) in PROMPTS"
        :key="p.key"
        :title="p.title"
        :last="i === PROMPTS.length - 1"
      >
        <template #right>
          <ToggleSwitch
            :model-value="valueOf(p.key)"
            color="blue"
            @update:model-value="v => sound.setBool(p.key, v)"
          />
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>
