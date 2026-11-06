<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useSoundSettingsStore, JBL_MODES } from '../../../../stores/soundSettingsStore'

const emit = defineEmits(['back'])
const sound = useSoundSettingsStore()

const MODE_ART = {
  smart: { bg: '#EEF1FE', accent: '#2F6BF6' },
  video: { bg: '#E8EEF7', accent: '#F0A32B' },
  game: { bg: '#E6F1FB', accent: '#2F6BF6' },
  music: { bg: '#FDECEF', accent: '#E4577A' }
}
</script>

<template>
  <SubPageShell title="JBL 音效实验室" @back="emit('back')">
    <div class="section-header">模式</div>
    <div class="mode-grid">
      <button
        v-for="mode in JBL_MODES"
        :key="mode.value"
        type="button"
        class="mode-card"
        :class="{ active: sound.jblMode === mode.value }"
        :style="{ background: MODE_ART[mode.value].bg }"
        @click="sound.setJblMode(mode.value)"
      >
        <span class="mode-label">{{ mode.label }}</span>
        <span class="mode-art" :style="{ background: MODE_ART[mode.value].accent }">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <template v-if="mode.value === 'smart'">
              <rect x="3" y="7" width="18" height="12" rx="4" />
              <path d="M7 12v2M11 10v6M15 11v4M19 13v0.5" />
            </template>
            <template v-else-if="mode.value === 'video'">
              <rect x="2" y="6" width="14" height="12" rx="3" />
              <path d="M16 10l6-3v10l-6-3z" />
            </template>
            <template v-else-if="mode.value === 'game'">
              <rect x="2" y="8" width="20" height="10" rx="5" />
              <path d="M7 11v4M5 13h4" />
              <circle cx="16" cy="12" r="1.1" fill="#FFFFFF" stroke="none" />
              <circle cx="18.5" cy="14" r="1.1" fill="#FFFFFF" stroke="none" />
            </template>
            <template v-else>
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="2.4" />
            </template>
          </svg>
        </span>
      </button>
    </div>

    <div class="settings-card">
      <ListCell title="均衡器" last>
        <template #right>
          <ToggleSwitch
            :model-value="sound.equalizer"
            color="blue"
            @update:model-value="v => sound.setBool('equalizer', v)"
          />
        </template>
      </ListCell>
    </div>

    <div class="brand-footer">
      <span class="brand-sound">SOUND BY</span>
      <span class="brand-jbl">JBL</span>
      <span class="brand-bar"></span>
      <span class="brand-dts">dts</span>
    </div>
  </SubPageShell>
</template>

<style scoped>
.mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.mode-card {
  position: relative;
  height: 120px;
  border: 2px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  padding: 12px 14px;
  overflow: hidden;
}

.mode-card.active {
  border-color: #2F6BF6;
}

.mode-label {
  position: relative;
  z-index: 2;
  font-size: 16px;
  font-weight: 600;
  color: #111;
}

.mode-art {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  opacity: 0.92;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 0 12px;
  opacity: 0.85;
}

.brand-sound {
  font-size: 9px;
  letter-spacing: 0.6px;
  color: #6E6E73;
}

.brand-jbl {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #111;
}

.brand-bar {
  width: 1px;
  height: 18px;
  background: #C7C7CC;
}

.brand-dts {
  font-size: 20px;
  font-weight: 800;
  color: #111;
  letter-spacing: -1px;
}
</style>
