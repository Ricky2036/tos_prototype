<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useSoundSettingsStore } from '../../../../stores/soundSettingsStore'

const emit = defineEmits(['back'])
const sound = useSoundSettingsStore()

const NOISE_MODES = ['关闭', '标准降噪', '深度降噪']

const ROWS = [
  { key: 'system', title: '系统通话', model: () => sound.noiseSystem },
  { key: 'net', title: '网络通话', model: () => sound.noiseNet }
]
</script>

<template>
  <SubPageShell title="全场景降噪" @back="emit('back')">
    <div class="noise-visual">
      <div class="noise-people">
        <span class="p p1"></span>
        <span class="p p2"></span>
        <span class="p p3"></span>
        <span class="p p4"></span>
      </div>
    </div>

    <div class="noise-title">语音突显</div>
    <div class="noise-caption">智能抑制环境噪声，对方听到的人声更清晰。</div>
    <div class="noise-dots">
      <span class="dot on"></span>
      <span class="dot"></span>
    </div>

    <div class="section-header">降噪模式</div>
    <div class="settings-card">
      <ListCell
        v-for="(row, i) in ROWS"
        :key="row.key"
        :title="row.title"
        :value="row.model()"
        :last="i === ROWS.length - 1"
        clickable
        @click="sound.setNoiseMode(row.key, NOISE_MODES[(NOISE_MODES.indexOf(row.model()) + 1) % NOISE_MODES.length])"
      >
        <template #right>
          <span class="mode-value">{{ row.model() }}</span>
          <span class="stepper">
            <svg width="7" height="4" viewBox="0 0 7 4" fill="none">
              <path d="M1 3L3.5 0.6L6 3" stroke="#C5C5C7" stroke-width="1.4" stroke-linecap="round" />
            </svg>
            <svg width="7" height="4" viewBox="0 0 7 4" fill="none">
              <path d="M1 1L3.5 3.4L6 1" stroke="#C5C5C7" stroke-width="1.4" stroke-linecap="round" />
            </svg>
          </span>
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>

<style scoped>
.noise-visual {
  height: 150px;
  border-radius: 16px;
  background: linear-gradient(180deg, #E8EBF1 0%, #DDE3EC 100%);
  margin-bottom: 14px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 14px;
  box-sizing: border-box;
}

.noise-people {
  display: flex;
  align-items: flex-end;
  gap: 18px;
}

.p {
  display: block;
  width: 26px;
  border-radius: 13px 13px 4px 4px;
  background: rgba(255, 255, 255, 0.85);
}

.p1 { height: 54px; }
.p2 { height: 66px; background: #FFD966; }
.p3 { height: 50px; }
.p4 { height: 58px; }

.noise-title {
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  color: #111;
}

.noise-caption {
  text-align: center;
  font-size: 13px;
  color: #8E8E93;
  padding: 6px 24px 0;
  line-height: 19px;
}

.noise-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 10px 0 18px;
}

.noise-dots .dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #D1D1D6;
}

.noise-dots .dot.on {
  background: #6E6E73;
}

.mode-value {
  font-size: 15px;
  color: #8E8E93;
  margin-right: 6px;
}

.stepper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
