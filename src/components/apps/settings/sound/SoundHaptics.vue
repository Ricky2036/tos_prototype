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
  <SubPageShell title="触感反馈" @back="emit('back')">
    <div class="haptics-visual">
      <div class="haptics-disc"></div>
      <button class="haptics-play" type="button" aria-label="播放演示">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </div>

    <div class="haptics-title">X-Haptics</div>
    <div class="haptics-desc">
      源自真实世界的触感设计，让你在数字世界中感受到前所未有的真实；每一次触摸，都仿佛在与真实物体互动，每一次振动都被精心设计。
    </div>

    <div class="settings-card">
      <ListCell title="触感反馈">
        <template #right>
          <ToggleSwitch
            :model-value="sound.touchFeedback"
            color="blue"
            @update:model-value="v => sound.setBool('touchFeedback', v)"
          />
        </template>
      </ListCell>
      <div class="slider-row">
        <HSettingSlider
          :model-value="sound.hapticStrength"
          left-label="弱"
          right-label="强"
          :disabled="!sound.touchFeedback"
          @update:model-value="v => sound.setNumber('hapticStrength', v)"
        />
      </div>
    </div>

    <div class="settings-card">
      <ListCell title="输入法按键触感" subtitle="仅支持系统预装输入法。" last>
        <template #right>
          <ToggleSwitch
            :model-value="sound.keyboardHaptic"
            color="blue"
            @update:model-value="v => sound.setBool('keyboardHaptic', v)"
          />
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>

<style scoped>
.haptics-visual {
  position: relative;
  height: 168px;
  border-radius: 16px;
  background: radial-gradient(circle at 50% 45%, #EAF3FF 0%, #DCE9FA 55%, #C9DCF4 100%);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.haptics-disc {
  width: 132px;
  height: 132px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #FFFFFF 0 22%, rgba(255, 255, 255, 0.6) 22% 26%, transparent 26%),
    conic-gradient(from 180deg,
      rgba(47, 107, 246, 0.95) 0deg,
      rgba(127, 176, 255, 0.55) 70deg,
      rgba(255, 255, 255, 0.35) 130deg,
      rgba(47, 107, 246, 0.75) 210deg,
      rgba(47, 107, 246, 0.4) 290deg,
      rgba(47, 107, 246, 0.95) 360deg);
  box-shadow: inset 0 0 24px rgba(255, 255, 255, 0.55), 0 10px 26px rgba(47, 107, 246, 0.22);
}

.haptics-play {
  position: absolute;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(17, 17, 17, 0.55);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.haptics-title {
  font-size: 19px;
  font-weight: 600;
  color: #111;
  padding: 0 4px 6px;
}

.haptics-desc {
  font-size: 13px;
  line-height: 20px;
  color: #8E8E93;
  padding: 0 4px 14px;
}

.slider-row {
  padding: 6px 16px 16px;
}
</style>
