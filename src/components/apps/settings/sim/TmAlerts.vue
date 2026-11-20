<script setup>
import { computed, ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import TmSwitch from './TmSwitch.vue'
import { useTrafficStore } from '../../../../stores/trafficStore.js'
import { TM_ALERTS } from './trafficData.js'
import './traffic.css'

/**
 * 流量提醒
 * 真机：自定义流量提醒（开关 + 说明）→ 提醒比例（10/20/30/40/50 五档滑杆，默认 20%）
 *      → 套餐失效提醒（开关 + 说明）→ 自动关闭移动数据（开关 + 说明）。
 * 滑杆只有 5 个落点，拖动/点击都吸附到档位，不做连续值。
 */
const emit = defineEmits(['back'])
const traffic = useTrafficStore()

const track = ref(null)
const dragging = ref(false)

const ratioIndex = computed(() => {
  const i = TM_ALERTS.ratios.indexOf(traffic.alertRatio)
  return i < 0 ? 0 : i
})

const knobPct = computed(() => (ratioIndex.value / (TM_ALERTS.ratios.length - 1)) * 100)

function applyFromEvent(e) {
  if (!track.value) return
  const rect = track.value.getBoundingClientRect()
  const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width)
  const raw = (x / rect.width) * (TM_ALERTS.ratios.length - 1)
  const next = TM_ALERTS.ratios[Math.round(raw)]
  traffic.setAlertRatio(next)
}

function onDown(e) {
  dragging.value = true
  applyFromEvent(e)
  e.currentTarget.setPointerCapture?.(e.pointerId)
}

function onMove(e) {
  if (!dragging.value) return
  applyFromEvent(e)
}

function onUp(e) {
  dragging.value = false
  try {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  } catch {}
}
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_ALERTS.title" @back="emit('back')" />

    <div class="tm-body scrollable" data-testid="tm-alerts">
      <div class="tm-card">
      <div class="tm-row has-desc">
        <div class="tm-row-text">
          <div class="tm-row-title">{{ TM_ALERTS.customTitle }}</div>
          <div class="tm-row-desc">{{ TM_ALERTS.customDesc }}</div>
        </div>
        <TmSwitch
          :model-value="traffic.customAlerts"
          testid="tm-switch-customAlerts"
          @update:model-value="v => traffic.setFlag('customAlerts', v)"
        />
      </div>
      </div>

      <div class="tm-ratio" :class="{ 'is-off': !traffic.customAlerts }" data-testid="tm-ratio">
        <div class="tm-row-title" style="padding-left: 0">{{ TM_ALERTS.ratioTitle }}</div>

        <div class="tm-ratio-scale">
          <span
            v-for="(r, i) in TM_ALERTS.ratios"
            :key="r"
            class="tm-ratio-mark"
            :style="{ left: (i / (TM_ALERTS.ratios.length - 1)) * 100 + '%' }"
          >{{ r }}%</span>
        </div>

        <div
          ref="track"
          class="tm-ratio-track"
          role="slider"
          :aria-valuemin="10"
          :aria-valuemax="50"
          :aria-valuenow="traffic.alertRatio"
          data-testid="tm-ratio-track"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
        >
          <div class="tm-ratio-rail"></div>
          <div class="tm-ratio-fill" :style="{ width: knobPct + '%' }"></div>
          <div class="tm-ratio-knob" :style="{ left: knobPct + '%' }"></div>
        </div>
      </div>

      <div class="tm-card">
      <div class="tm-row has-desc">
        <div class="tm-row-text">
          <div class="tm-row-title">{{ TM_ALERTS.planTitle }}</div>
          <div class="tm-row-desc">{{ TM_ALERTS.planDesc }}</div>
        </div>
        <TmSwitch
          :model-value="traffic.planExpiryAlert"
          testid="tm-switch-planExpiry"
          @update:model-value="v => traffic.setFlag('planExpiryAlert', v)"
        />
      </div>

      <div class="tm-row has-desc">
        <div class="tm-row-text">
          <div class="tm-row-title">{{ TM_ALERTS.autoOffTitle }}</div>
          <div class="tm-row-desc">{{ TM_ALERTS.autoOffDesc }}</div>
        </div>
        <TmSwitch
          :model-value="traffic.autoDisableData"
          testid="tm-switch-autoOff"
          @update:model-value="v => traffic.setFlag('autoDisableData', v)"
        />
      </div>
      </div>

      <div class="tm-bottom-space"></div>
    </div>
  </div>
</template>

<style scoped>
.tm-ratio.is-off {
  opacity: 0.4;
  pointer-events: none;
}
</style>
