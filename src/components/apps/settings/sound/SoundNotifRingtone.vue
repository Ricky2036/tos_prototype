<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useSoundSettingsStore, RINGTONE_FUN } from '../../../../stores/soundSettingsStore'

const emit = defineEmits(['back'])
const sound = useSoundSettingsStore()

function pick(name) {
  sound.setRingtone('notif', name)
}
</script>

<template>
  <SubPageShell title="通知铃声" :floating-action="'在线铃声'" @back="emit('back')">
    <div class="settings-card">
      <ListCell title="通知振动" value="跟随音乐节奏" chevron clickable last />
    </div>

    <div class="settings-card">
      <ListCell title="自定义铃声" chevron clickable />
      <ListCell title="无" last clickable @click="pick('无')">
        <template #right>
          <span class="opt-radio" :class="{ checked: sound.notifRingtone === '无' }"></span>
        </template>
      </ListCell>
    </div>

    <div class="section-header">有趣</div>
    <div class="settings-card">
      <ListCell
        v-for="(name, i) in RINGTONE_FUN"
        :key="name"
        :title="name"
        :last="i === RINGTONE_FUN.length - 1"
        clickable
        @click="pick(name)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: sound.notifRingtone === name }"></span>
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>
