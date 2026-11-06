<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { ref } from 'vue'
import { useSoundSettingsStore, RINGTONE_FUN, NOTIF_VIBRATE_PATTERNS } from '../../../../stores/soundSettingsStore'
import SoundVibratePattern from './SoundVibratePattern.vue'
import SoundCustomRingtone from './SoundCustomRingtone.vue'

const emit = defineEmits(['back'])
const sound = useSoundSettingsStore()

const nested = ref(null)   // null | 'vibrate' | 'custom'
const isBack = ref(false)

function openNested(key) {
  isBack.value = false
  nested.value = key
}

function closeNested() {
  isBack.value = true
  nested.value = null
}

function pick(name) {
  sound.setRingtone('notif', name)
}
</script>

<template>
  <SoundVibratePattern
    v-if="nested === 'vibrate'"
    title="通知振动"
    which="notif"
    :patterns="NOTIF_VIBRATE_PATTERNS"
    @back="closeNested"
  />
  <SoundCustomRingtone
    v-else-if="nested === 'custom'"
    title="自定义铃声"
    which="notif"
    @back="closeNested"
  />
  <SubPageShell v-else title="通知铃声" :floating-action="'在线铃声'" @back="emit('back')">
    <div class="settings-card">
      <ListCell
        title="通知振动"
        :value="sound.notifVibratePattern"
        chevron
        clickable
        last
        @click="openNested('vibrate')"
      />
    </div>

    <div class="settings-card">
      <ListCell
        title="自定义铃声"
        :value="sound.customRingtoneNotif ? '已选择' : ''"
        chevron
        clickable
        @click="openNested('custom')"
      />
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
