<script setup>
import { computed } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import { TM_APP_USAGE, tmAppUsage, tmFormat } from './trafficData.js'
import './traffic.css'

/**
 * 应用流量使用管理
 * 录屏只到主页面那一行（带 5 个图标 + 「+54」），没有进这一页。
 * 这里按同源数据补成真实页面：应用名与图标全部来自桌面注册表，用量之和 === 七日总量。
 */
const emit = defineEmits(['back'])
const rows = computed(() => tmAppUsage())
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_APP_USAGE.title" @back="emit('back')" />

    <div class="tm-body scrollable" data-testid="tm-app-usage">
      <div class="tm-group is-first">{{ TM_APP_USAGE.groupLabel }} · {{ TM_APP_USAGE.totalLabel }}</div>

      <div
        v-for="row in rows"
        :key="row.app.id"
        class="tm-appitem"
        :data-app-id="row.app.id"
      >
        <RegisteredAppIcon :app="row.app" :size="38" />
        <span class="tm-appname">{{ row.app.name }}</span>
        <span class="tm-row-value">{{ tmFormat(row.bytes) }}</span>
      </div>

      <div class="tm-bottom-space"></div>
    </div>
  </div>
</template>
