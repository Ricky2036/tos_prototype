<script setup>
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import TmSwitch from './TmSwitch.vue'
import { useTrafficStore } from '../../../../stores/trafficStore.js'
import { TM_SCREEN_OFF, tmHistoryValue } from './trafficData.js'
import './traffic.css'

/**
 * 熄屏监控
 * 真机：一行总开关 + 灰字「历史记录」+ 逐段卡片（标题 / 蓝色流量值 / 平均网速 / 时间段）。
 * 卡片之间没有边框也没有底色，靠留白分隔。
 */
const emit = defineEmits(['back'])
const traffic = useTrafficStore()
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_SCREEN_OFF.title" @back="emit('back')" />

    <div class="tm-body scrollable" data-testid="tm-screen-off">
      <div class="tm-row">
        <div class="tm-row-text">
          <div class="tm-row-title">{{ TM_SCREEN_OFF.title }}</div>
        </div>
        <TmSwitch
          :model-value="traffic.screenOff"
          testid="tm-switch-screenOff"
          @update:model-value="v => traffic.setFlag('screenOff', v)"
        />
      </div>

      <div class="tm-group">{{ TM_SCREEN_OFF.groupLabel }}</div>

      <div class="tm-history" data-testid="tm-screen-off-history">
        <div v-for="(item, i) in TM_SCREEN_OFF.history" :key="i" class="tm-history-card">
          <div class="tm-history-title">{{ TM_SCREEN_OFF.entryTitle }}</div>
          <div class="tm-history-value">
            <span class="tm-drop" aria-hidden="true">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                <path d="M12 3.2c3.4 3.9 6.2 7.2 6.2 10.4A6.2 6.2 0 0 1 12 19.8a6.2 6.2 0 0 1-6.2-6.2C5.8 10.4 8.6 7.1 12 3.2Z" fill="currentColor" />
                <path d="M9.6 13.4a2.6 2.6 0 0 0 2.4 2.7" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </span>
            <span class="tm-history-num">{{ tmHistoryValue(item.bytes).num }}</span>
            <span class="tm-history-unit">{{ tmHistoryValue(item.bytes).unit }}</span>
          </div>
          <div class="tm-history-speed">平均网速：{{ item.speed }}</div>
          <div class="tm-history-range">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8.4" stroke="currentColor" stroke-width="1.5" />
              <path d="M12 7.4V12l3 1.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            {{ item.range }}
          </div>
        </div>
      </div>

      <div class="tm-bottom-space"></div>
    </div>
  </div>
</template>
