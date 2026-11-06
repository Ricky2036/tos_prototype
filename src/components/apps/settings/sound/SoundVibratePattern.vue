<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useSoundSettingsStore } from '../../../../stores/soundSettingsStore'

/**
 * 振动模式（来电铃声 / 通知铃声 → SIM 振动 / 通知振动）
 *
 * 真机形态：第一张卡是「跟随音乐节奏」单选项；下面分组「其他效果」列出各种节奏，
 * 卡片最底部还有一项「无」。来电与通知的模式清单不同，所以用 props 传进来。
 */
const props = defineProps({
  title: { type: String, required: true },
  which: { type: String, default: 'sim1' },  // 'sim1' | 'sim2' | 'notif'
  patterns: { type: Array, default: () => [] }
})
const emit = defineEmits(['back'])
const sound = useSoundSettingsStore()

function current() {
  if (props.which === 'sim1') return sound.sim1VibratePattern
  if (props.which === 'sim2') return sound.sim2VibratePattern
  return sound.notifVibratePattern
}

function pick(value) {
  sound.setVibratePattern(props.which, value)
}
</script>

<template>
  <SubPageShell :title="title" @back="emit('back')">
    <div class="settings-card">
      <ListCell
        title="跟随音乐节奏"
        last
        clickable
        @click="pick('跟随音乐节奏')"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: current() === '跟随音乐节奏' }"></span>
        </template>
      </ListCell>
    </div>

    <div class="section-header">其他效果</div>
    <div class="settings-card">
      <ListCell
        v-for="(p, i) in patterns"
        :key="p"
        :title="p"
        :last="i === patterns.length - 1"
        clickable
        @click="pick(p)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: current() === p }"></span>
        </template>
      </ListCell>
    </div>

    <div class="settings-card">
      <ListCell title="无" last clickable @click="pick('无')">
        <template #right>
          <span class="opt-radio" :class="{ checked: current() === '无' }"></span>
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>
