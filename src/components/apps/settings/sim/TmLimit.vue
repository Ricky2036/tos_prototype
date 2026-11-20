<script setup>
import { computed, ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import TmSwitch from './TmSwitch.vue'
import { useTrafficStore } from '../../../../stores/trafficStore.js'
import { TM_LIMIT, tmFormat } from './trafficData.js'
import './traffic.css'

/**
 * 流量限额
 * 真机：日流量限额（开关 + 一句说明），下面「流量限额 500.0 MB ›」；
 * 关掉日流量限额后下面那行整体置灰且点不动。
 * 点「流量限额」弹出编辑卡（标题 + 数值 + 单位下拉 + 取消/完成）——
 * 真机下面接的是系统数字键盘，原型里由浏览器输入接管，不自己画键盘。
 */
const emit = defineEmits(['back'])
const traffic = useTrafficStore()

const sheetOpen = ref(false)
const draft = ref('')
const unit = ref(TM_LIMIT.units[0])
const unitMenu = ref(false)

const limitText = computed(() => tmFormat(traffic.limitBytes))

const draftValid = computed(() => {
  const n = Number(draft.value)
  return Number.isFinite(n) && n > 0
})

function openSheet() {
  const bytes = traffic.limitBytes
  unit.value = traffic.limitUnit || 'MB'
  draft.value = unit.value === 'GB' ? (bytes / (1024 * 1024 * 1024)).toFixed(2) : (bytes / (1024 * 1024)).toFixed(1)
  unitMenu.value = false
  sheetOpen.value = true
}

function pickUnit(u) {
  const n = Number(draft.value)
  // 换单位时把数值一起换算，避免「500 MB」被当成「500 GB」
  if (Number.isFinite(n) && n > 0) {
    if (u === 'GB' && unit.value === 'MB') draft.value = (n / 1024).toFixed(2)
    if (u === 'MB' && unit.value === 'GB') draft.value = (n * 1024).toFixed(1)
  }
  unit.value = u
  unitMenu.value = false
}

function confirm() {
  if (!draftValid.value) return
  const n = Number(draft.value)
  const bytes = unit.value === 'GB' ? n * 1024 * 1024 * 1024 : n * 1024 * 1024
  traffic.setLimit(bytes, unit.value)
  sheetOpen.value = false
}

function cancel() {
  sheetOpen.value = false
}
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_LIMIT.title" @back="emit('back')" />

    <div class="tm-body scrollable" data-testid="tm-limit">
      <div class="tm-card">
      <div class="tm-row has-desc">
        <div class="tm-row-text">
          <div class="tm-row-title">{{ TM_LIMIT.dailyTitle }}</div>
          <div class="tm-row-desc">{{ TM_LIMIT.dailyDesc }}</div>
        </div>
        <TmSwitch
          :model-value="traffic.limitEnabled"
          testid="tm-switch-limit"
          @update:model-value="v => traffic.setFlag('limitEnabled', v)"
        />
      </div>

      <div
        class="tm-row is-tap"
        :class="{ 'is-disabled': !traffic.limitEnabled }"
        data-testid="tm-row-limit-value"
        @click="openSheet"
      >
        <div class="tm-row-text">
          <div class="tm-row-title">{{ TM_LIMIT.rowTitle }}</div>
        </div>
        <span class="tm-row-value" data-testid="tm-limit-value">{{ limitText }}</span>
        <svg class="tm-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
          <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      </div>

      <div class="tm-bottom-space"></div>
    </div>

    <!-- 限额编辑卡 -->
    <Transition name="tm-sheet">
      <div v-if="sheetOpen" class="tm-sheet-mask" data-testid="tm-limit-sheet" @click.self="cancel">
        <div class="tm-sheet">
          <div class="tm-sheet-title">{{ TM_LIMIT.title }}</div>

          <div class="tm-sheet-input-row">
            <input
              v-model="draft"
              class="tm-sheet-input"
              data-testid="tm-limit-input"
              inputmode="decimal"
              autocomplete="off"
              aria-label="流量限额"
            />
            <button type="button" class="tm-sheet-unit" data-testid="tm-limit-unit" @click="unitMenu = !unitMenu">
              {{ unit }}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="#8E8E93" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <div class="tm-sheet-actions">
            <button type="button" class="tm-sheet-btn is-cancel" data-testid="tm-limit-cancel" @click="cancel">取消</button>
            <button
              type="button"
              class="tm-sheet-btn is-ok"
              data-testid="tm-limit-ok"
              :disabled="!draftValid"
              @click="confirm"
            >完成</button>
          </div>

          <div v-if="unitMenu" class="tm-unit-menu">
            <div
              v-for="u in TM_LIMIT.units"
              :key="u"
              class="tm-unit-item"
              :class="{ 'is-active': u === unit }"
              @click="pickUnit(u)"
            >{{ u }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tm-sheet-enter-active,
.tm-sheet-leave-active {
  transition: opacity 0.18s ease;
}

.tm-sheet-enter-from,
.tm-sheet-leave-to {
  opacity: 0;
}
</style>
