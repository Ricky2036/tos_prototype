<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import { useDisplaySettingsStore } from '../../../../stores/displaySettingsStore'

/**
 * 我的字体（显示与亮度 → 字体 → 我的字体）
 *
 * 真机形态：两张并排的大卡（粉紫底），卡里用该字体渲染字体名；
 * 选中的那张右下角有黄色三角折角 + 白色对勾。页面下方大片留白。
 */
const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()

const FONTS = [
  { value: 'TransSans', label: 'TransSans' },
  { value: 'Roboto', label: 'Roboto' }
]
</script>

<template>
  <SubPageShell title="我的字体" @back="emit('back')">
    <div class="font-grid">
      <button
        v-for="f in FONTS"
        :key="f.value"
        type="button"
        class="font-tile"
        :class="{ active: display.fontFamily === f.value }"
        @click="display.setFontFamily(f.value)"
      >
        <span class="font-tile-name" :class="'face-' + f.value">{{ f.label }}</span>
        <span v-if="display.fontFamily === f.value" class="font-tile-check" aria-hidden="true"></span>
      </button>
    </div>
  </SubPageShell>
</template>

<style scoped>
.font-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 2px 0 16px;
}

.font-tile {
  position: relative;
  height: 108px;
  border: none;
  border-radius: 12px;
  background: #E7D5E9;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;
}

.font-tile-name {
  font-size: 20px;
  color: #8E5E9B;
  letter-spacing: -0.2px;
}

/* 用各自的字体渲染字体名，方便区分 */
.face-TransSans {
  font-family: -apple-system, "PingFang SC", "Segoe UI", sans-serif;
}

.face-Roboto {
  font-family: Roboto, -apple-system, sans-serif;
  letter-spacing: 0;
}

/* 选中态：右下角黄色折角 + 白色对勾 */
.font-tile-check {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 30px 30px;
  border-color: transparent transparent #FFC02E transparent;
}

.font-tile-check::after {
  content: '';
  position: absolute;
  right: 2px;
  bottom: -27px;
  width: 9px;
  height: 5px;
  border-left: 2px solid #FFFFFF;
  border-bottom: 2px solid #FFFFFF;
  transform: rotate(-45deg);
}
</style>
