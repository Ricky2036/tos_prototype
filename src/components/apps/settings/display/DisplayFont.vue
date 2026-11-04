<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import HSettingSlider from '../subpage/HSettingSlider.vue'
import { useDisplaySettingsStore } from '../../../../stores/displaySettingsStore'

const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()

const FONTS = [
  { value: 'TransSans', label: 'TransSans' },
  { value: 'Roboto', label: 'Roboto' }
]
</script>

<template>
  <SubPageShell title="字体" @back="emit('back')">
    <div class="settings-card">
      <ListCell title="我的字体" chevron clickable last />
    </div>

    <div class="font-cards">
      <button
        v-for="f in FONTS"
        :key="f.value"
        type="button"
        class="font-card"
        :class="{ active: display.fontFamily === f.value }"
        @click="display.setFontFamily(f.value)"
      >
        <span class="font-sample" :class="'sample-' + f.value">Aa</span>
        <span class="font-name">{{ f.label }}</span>
      </button>
    </div>

    <div class="slider-block">
      <div class="slider-head">
        <span>字体大小</span>
        <span class="slider-value">默认</span>
      </div>
      <HSettingSlider
        :model-value="display.fontSize"
        @update:model-value="v => display.setNumber('fontSize', v)"
      />
    </div>

    <div class="slider-block">
      <div class="slider-head">
        <span>字体粗细</span>
        <span class="slider-value">默认</span>
      </div>
      <HSettingSlider
        :model-value="display.fontWeight"
        @update:model-value="v => display.setNumber('fontWeight', v)"
      />
    </div>
  </SubPageShell>
</template>

<style scoped>
.font-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.font-card {
  flex: none;
  width: 96px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.font-sample {
  width: 72px;
  height: 66px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #111;
}

.font-card.active .font-sample {
  border-color: #2F6BF6;
}

.sample-Roboto {
  font-family: Roboto, -apple-system, sans-serif;
}

.font-name {
  font-size: 13px;
  color: #3C3C43;
}

.slider-row {
  padding: 16px;
}

.slider-block {
  padding: 6px 4px 18px;
}

.slider-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  color: #111;
  margin-bottom: 12px;
}

.slider-value {
  font-size: 14px;
  color: #8E8E93;
}
</style>
