<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import AccSlider from './AccSlider.vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import './acc.css'

import buoyPersistent from '../../../../assets/icons/accessibility/illus/buoy-persistent.png'
import buoyHidden from '../../../../assets/icons/accessibility/illus/buoy-hidden.png'

/**
 * 浮标设置（真机 com.transsion.smartpanel BuoyCustomActivity）
 *
 * 结构（2026-11-14 采集）：
 *   两张手机线框预览（常驻=选中蓝圈 / 隐藏），图下标签 + 单选圆点
 *   卡 1：大小（滑块，默认几乎最小值）/ 透明度（滑块，默认约 50%）/ 屏幕位置（值「右」+ 上下双箭头）
 *   卡 2：恢复默认设置
 *
 * 几何：预览图 96×192 设计 px，两列居中于 98 / 262；单选圆点 18px；
 *       卡 1 三行分别 84 / 84 / 52 高（滑块行 = 标题行 + 滑块 26）。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const OPTIONS = [
  { value: 'persistent', label: '常驻', img: buoyPersistent },
  { value: 'hidden', label: '隐藏', img: buoyHidden }
]

/** 屏幕位置只有「左 / 右」两值，真机用上下双箭头切换（不是右箭头进下一层） */
function flipPosition() {
  acc.setBuoy({ position: acc.buoyPosition === '右' ? '左' : '右' })
}
</script>

<template>
  <SubPageShell title="浮标设置" @back="emit('back')">
    <div class="acc-page buoy-page">
      <div class="buoy-styles">
        <button
          v-for="opt in OPTIONS"
          :key="opt.value"
          type="button"
          class="buoy-style"
          :data-testid="`buoy-style-${opt.value}`"
          @click="acc.setBuoy({ style: opt.value })"
        >
          <img :src="opt.img" class="buoy-style-img" alt="" draggable="false" />
          <span class="buoy-style-label">{{ opt.label }}</span>
          <span class="buoy-radio" :class="{ checked: acc.buoyStyle === opt.value }"></span>
        </button>
      </div>

      <div class="acc-card">
        <div class="buoy-row">
          <div class="buoy-row-title">大小</div>
          <AccSlider
            testid="buoy-size"
            :model-value="acc.buoySize"
            @update:model-value="v => acc.setBuoy({ size: v })"
          />
        </div>
        <div class="buoy-row">
          <div class="buoy-row-title">透明度</div>
          <AccSlider
            testid="buoy-opacity"
            :model-value="acc.buoyOpacity"
            @update:model-value="v => acc.setBuoy({ opacity: v })"
          />
        </div>
        <div class="buoy-row is-plain" data-testid="buoy-position" @click="flipPosition">
          <div class="buoy-row-title">屏幕位置</div>
          <span class="buoy-value">{{ acc.buoyPosition }}</span>
          <svg class="buoy-stepper" width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M1.5 6.5L5 3L8.5 6.5M1.5 11.5L5 15L8.5 11.5" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <div class="acc-card">
        <div class="buoy-row is-plain is-action" data-testid="buoy-reset" @click="acc.resetBuoy()">
          <div class="buoy-row-title">恢复默认设置</div>
        </div>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.buoy-page {
  padding-top: 10px;
}

/* ===== 两张样式预览：真机是两列等宽（各 164），图/字/圆点在列内居中 ===== */
.buoy-styles {
  display: flex;
  padding: 0;
  /* 圆点底 376 → 卡顶 419，真机间距 43 */
  margin-bottom: 43px;
}

.buoy-style {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  cursor: pointer;
}

.buoy-style-img {
  width: 96px;
  height: 192px;
  display: block;
  user-select: none;
  pointer-events: none;
}

.buoy-style-label {
  /* 真机图底 312 → 标签行盒顶 328 */
  margin-top: 16px;
  font-size: 15px;
  line-height: 20px;
  color: #111;
}

.buoy-radio {
  /* 真机标签底 348 → 圆点顶 358 */
  margin-top: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #C7C7CC;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

.buoy-radio.checked {
  border-color: #3375F6;
  border-width: 2px;
}

.buoy-radio.checked::after {
  content: '';
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #3375F6;
}

/* ===== 滑块卡：真机三行 84 / 84 / 55，合计 223 ===== */
.buoy-row {
  padding: 17px 16px 0;
  height: 84px;
  box-sizing: border-box;
  position: relative;
}

.buoy-row + .buoy-row::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 0;
  top: 0;
  height: 0.5px;
  background: #F0F1F3;
}

.buoy-row-title {
  font-size: 15.5px;
  line-height: 20px;
  font-weight: 500;
  color: #111;
  letter-spacing: -0.15px;
}

.buoy-row .acc-slider {
  /* 真机卡顶 419 → 轨道中线 477 */
  margin-top: 10px;
}

/* 无滑块的行（屏幕位置 / 恢复默认设置）：52 高，标题与值同行 */
.buoy-row.is-plain {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 55px;
  padding-top: 0;
  padding-bottom: 0;
}

.buoy-row.is-action {
  /* 真机「恢复默认设置」是独立一张卡、行高 60 */
  height: 60px;
  cursor: pointer;
}

.buoy-value {
  margin-left: auto;
  font-size: 14.5px;
  color: #8E8E93;
}

.buoy-stepper {
  flex: none;
  margin-left: -2px;
  color: #C5C5C7;
}
</style>
