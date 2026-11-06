<script setup>
import { ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useSoundSettingsStore, RINGTONE_CLASSIC, SIM_VIBRATE_PATTERNS } from '../../../../stores/soundSettingsStore'
import SoundVibratePattern from './SoundVibratePattern.vue'
import SoundCustomRingtone from './SoundCustomRingtone.vue'

const emit = defineEmits(['back'])
const sound = useSoundSettingsStore()
const activeSim = ref('sim1')

// 本页下面是两个四级页（振动模式 / 自定义铃声）
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
  sound.setRingtone(activeSim.value, name)
}

function vibratePattern() {
  return activeSim.value === 'sim1' ? sound.sim1VibratePattern : sound.sim2VibratePattern
}

function customName() {
  return sound.customRingtoneSim
}

function currentName() {
  return activeSim.value === 'sim1' ? sound.ringtoneSim1 : sound.ringtoneSim2
}
</script>

<template>
  <SoundVibratePattern
    v-if="nested === 'vibrate'"
    :title="activeSim === 'sim1' ? 'SIM1振动' : 'SIM2振动'"
    :which="activeSim === 'sim1' ? 'sim1' : 'sim2'"
    :patterns="SIM_VIBRATE_PATTERNS"
    @back="closeNested"
  />
  <SoundCustomRingtone
    v-else-if="nested === 'custom'"
    title="自定义铃声"
    which="sim"
    @back="closeNested"
  />
  <SubPageShell v-else title="来电铃声" :floating-action="'在线铃声'" @back="emit('back')">
    <div class="sim-switch">
      <button
        type="button"
        class="sim-btn"
        :class="{ active: activeSim === 'sim1' }"
        @click="activeSim = 'sim1'"
      >SIM1</button>
      <button
        type="button"
        class="sim-btn"
        :class="{ active: activeSim === 'sim2' }"
        @click="activeSim = 'sim2'"
      >SIM2</button>
    </div>

    <div class="settings-card">
      <ListCell
        :title="activeSim === 'sim1' ? 'SIM1振动' : 'SIM2振动'"
        :value="vibratePattern()"
        chevron
        clickable
        last
        @click="openNested('vibrate')"
      />
    </div>

    <div class="settings-card">
      <ListCell
        title="自定义铃声"
        :value="customName() ? '已选择' : ''"
        chevron
        clickable
        @click="openNested('custom')"
      />
      <ListCell title="无" last clickable @click="pick('无')">
        <template #right>
          <span class="opt-radio" :class="{ checked: currentName() === '无' }"></span>
        </template>
      </ListCell>
    </div>

    <div class="section-header">经典</div>
    <div class="settings-card">
      <ListCell
        v-for="(name, i) in RINGTONE_CLASSIC"
        :key="name"
        :title="name"
        :last="i === RINGTONE_CLASSIC.length - 1"
        clickable
        @click="pick(name)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: currentName() === name }"></span>
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>

<style scoped>
.sim-switch {
  display: flex;
  gap: 4px;
  background: #E9E9ED;
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 12px;
}

.sim-btn {
  flex: 1;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #3C3C43;
  font-size: 15px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}

.sim-btn.active {
  background: #FFFFFF;
  color: #111;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
</style>
