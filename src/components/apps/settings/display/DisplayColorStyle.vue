<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import HSettingSlider from '../subpage/HSettingSlider.vue'
import { useDisplaySettingsStore } from '../../../../stores/displaySettingsStore'
import coastPreview from '../../../../assets/img/personalization/generated/nature-coast.jpg'

const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()
</script>

<template>
  <SubPageShell title="色彩风格" @back="emit('back')">
    <img class="sub-preview-img color-preview" :src="coastPreview" alt="色彩效果预览" />

    <div class="section-header">色彩</div>
    <div class="settings-card">
      <ListCell
        title="鲜艳"
        subtitle="增强屏幕显示色彩。"
        clickable
        @click="display.setColorMode('vivid')"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: display.colorMode === 'vivid' }"></span>
        </template>
      </ListCell>
      <ListCell
        title="原色"
        subtitle="通过色彩校准，还原屏幕内容的标准色彩。"
        last
        clickable
        @click="display.setColorMode('original')"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: display.colorMode === 'original' }"></span>
        </template>
      </ListCell>
    </div>

    <div class="section-header">色温</div>
    <div class="settings-card">
      <div class="slider-row">
        <HSettingSlider
          :model-value="display.colorTemp"
          left-label="冷色"
          middle-label="默认"
          right-label="暖色"
          @update:model-value="v => display.setNumber('colorTemp', v)"
        />
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.color-preview {
  height: 168px;
}

.slider-row {
  padding: 14px 16px 18px;
}
</style>
