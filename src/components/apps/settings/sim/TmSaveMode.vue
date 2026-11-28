<script setup>
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import TmSwitch from './TmSwitch.vue'
import { useTrafficStore } from '../../../../stores/trafficStore.js'
import { TM_SAVE_MODE } from './trafficData.js'
import './traffic.css'
import ChevronRight from '../../../ui/ChevronRight.vue'

/**
 * 省流量模式（三级页）
 * 真机页面标题是「后台流量限制」，行内叫「省流量模式」—— 按原样接，不要"修正"成一致。
 * 开关打开后才会多出「不受限制的应用」一行；说明段落始终在最后。
 */
const emit = defineEmits(['back', 'open'])
const traffic = useTrafficStore()
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_SAVE_MODE.title" @back="emit('back')" />

    <div class="tm-body scrollable" data-testid="tm-save-mode">
      <div class="tm-card">
      <div class="tm-row">
        <div class="tm-row-text">
          <div class="tm-row-title">{{ TM_SAVE_MODE.rowTitle }}</div>
        </div>
        <TmSwitch
          :model-value="traffic.saveMode"
          testid="tm-switch-saveMode"
          @update:model-value="v => traffic.setFlag('saveMode', v)"
        />
      </div>

      <div
        v-if="traffic.saveMode"
        class="tm-row is-tap"
        data-testid="tm-row-unrestricted"
        @click="emit('open', 'unrestricted')"
      >
        <div class="tm-row-text">
          <div class="tm-row-title">{{ TM_SAVE_MODE.unrestrictedTitle }}</div>
        </div>
        <ChevronRight class="tm-chevron" :size="18" color="currentColor" :stroke-width="2.13" />
      </div>
      </div>

      <div class="tm-note" data-testid="tm-save-mode-note">
        <p>{{ TM_SAVE_MODE.desc }}</p>
        <p>{{ TM_SAVE_MODE.note }}</p>
      </div>

      <div class="tm-bottom-space"></div>
    </div>
  </div>
</template>
