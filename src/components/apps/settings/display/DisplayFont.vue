<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import HSettingSlider from '../subpage/HSettingSlider.vue'
import { computed, ref } from 'vue'
import { useDisplaySettingsStore } from '../../../../stores/displaySettingsStore'
import DisplayMyFonts from './DisplayMyFonts.vue'

const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()

const showMyFonts = ref(false)
const isBack = ref(false)

function openMyFonts() {
  isBack.value = false
  showMyFonts.value = true
}

function closeMyFonts() {
  isBack.value = true
  showMyFonts.value = false
}

const FONTS = [
  { value: 'TransSans', label: 'TransSans' },
  { value: 'Roboto', label: 'Roboto' }
]

/**
 * 顶部预览区：真机是「上面预览、下面切换」——拖滑块时预览要实时变。
 * 滑块 0..1 映射到 13–23px / 300–700 字重。
 */
const SAMPLE = '2021年，发表在《自然》杂志的一项研究显示，全球约有三分之一的人存在睡眠问题。规律作息与适度运动，能明显改善睡眠质量。'

const previewStyle = computed(() => ({
  fontSize: `${(13 + display.fontSize * 10).toFixed(1)}px`,
  fontWeight: String(Math.round(300 + display.fontWeight * 400)),
  fontFamily: display.fontFamily === 'Roboto'
    ? 'Roboto, -apple-system, sans-serif'
    : '-apple-system, "PingFang SC", "Segoe UI", sans-serif'
}))
</script>

<template>
  <DisplayMyFonts v-if="showMyFonts" @back="closeMyFonts" />
  <SubPageShell v-else title="字体" @back="emit('back')">
    <!-- 预览区：随字体 / 字号 / 粗细实时变化 -->
    <div class="font-preview" :style="previewStyle">{{ SAMPLE }}</div>

    <div class="settings-card">
      <ListCell title="我的字体" chevron clickable last @click="openMyFonts" />
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
.font-preview {
  padding: 14px 16px 18px;
  color: #111;
  line-height: 1.5;
  letter-spacing: 0.1px;
  transition: font-size 0.08s linear, font-weight 0.08s linear;
}

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
