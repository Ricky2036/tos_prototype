<script setup>
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import TmSwitch from './TmSwitch.vue'
import { useTrafficStore } from '../../../../stores/trafficStore.js'
import { TM_SETTINGS } from './trafficData.js'
import './traffic.css'

/**
 * 设置（流量管理 → 设置）
 * 真机四行：流量网速显示 / 流量提醒 / 流量使用报告 / 套餐自动同步。
 * 「流量提醒」是入口行（箭头），另外三行是行内开关。
 * 实测「流量提醒」与「流量使用报告」之间有一段 24 的块间距，其余相邻行贴合。
 */
const emit = defineEmits(['back', 'open'])
const traffic = useTrafficStore()

const FLAG = { speed: 'speedDisplay', report: 'usageReport', autoSync: 'autoSync' }

function valueOf(key) {
  return traffic[FLAG[key]]
}

function setFlag(key, v) {
  traffic.setFlag(FLAG[key], v)
}
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_SETTINGS.title" @back="emit('back')" />

    <div class="tm-body scrollable" data-testid="tm-settings">
      <!-- 真机分两段：开关类两项一段，「流量使用报告 / 套餐自动同步」一段 -->
      <div class="tm-card">
        <template v-for="row in TM_SETTINGS.rows.slice(0, 2)" :key="row.key">
          <div
            v-if="row.link"
            class="tm-row is-tap"
            :data-testid="`tm-row-${row.key}`"
            @click="emit('open', row.link)"
          >
            <div class="tm-row-text">
              <div class="tm-row-title">{{ row.title }}</div>
            </div>
            <svg class="tm-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div v-else class="tm-row" :class="{ 'has-desc': row.desc }" :data-testid="`tm-row-${row.key}`">
            <div class="tm-row-text">
              <div class="tm-row-title">{{ row.title }}</div>
              <div v-if="row.desc" class="tm-row-desc">{{ row.desc }}</div>
            </div>
            <TmSwitch
              :model-value="valueOf(row.key)"
              :testid="`tm-switch-${row.key}`"
              @update:model-value="v => setFlag(row.key, v)"
            />
          </div>
        </template>
      </div>

      <div class="tm-card">
        <template v-for="row in TM_SETTINGS.rows.slice(2)" :key="row.key">
          <div v-if="row.link" class="tm-row is-tap" :data-testid="`tm-row-${row.key}`" @click="emit('open', row.link)">
            <div class="tm-row-text">
              <div class="tm-row-title">{{ row.title }}</div>
            </div>
            <svg class="tm-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div v-else class="tm-row" :class="{ 'has-desc': row.desc }" :data-testid="`tm-row-${row.key}`">
            <div class="tm-row-text">
              <div class="tm-row-title">{{ row.title }}</div>
              <div v-if="row.desc" class="tm-row-desc">{{ row.desc }}</div>
            </div>
            <TmSwitch
              :model-value="valueOf(row.key)"
              :testid="`tm-switch-${row.key}`"
              @update:model-value="v => setFlag(row.key, v)"
            />
          </div>
        </template>
      </div>

      <div class="tm-bottom-space"></div>
    </div>
  </div>
</template>
