<script setup>
import { ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import TmAppList from './TmAppList.vue'
import TmIndex from './TmIndex.vue'
import { TM_LETTERS, tmAppSections, tmScrollToLetter } from './appIndex.js'
import { TM_WIFI_APPS } from './trafficData.js'
import './traffic.css'

/**
 * 应用 Wi-Fi 权限管理
 * 真机：顶部一句灰字说明「关闭应用开关可限制该应用使用 Wi-Fi。」，下面是全量应用开关 + A-Z 导轨。
 */
const emit = defineEmits(['back'])

const sections = tmAppSections()
const available = sections.map(s => s.letter)
const body = ref(null)

function jump(letter) {
  tmScrollToLetter(body.value, letter)
}
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_WIFI_APPS.title" @back="emit('back')" />

    <div ref="body" class="tm-body scrollable" data-testid="tm-wifi-apps">
      <div class="tm-note" style="padding-top: 2px">{{ TM_WIFI_APPS.desc }}</div>
      <div style="height: 12px"></div>
      <TmAppList :sections="sections" list="wifiAllowed" testid="tm-wifi-list" />
      <div class="tm-bottom-space"></div>
    </div>

    <TmIndex :letters="TM_LETTERS" :available="available" @select="jump" />
  </div>
</template>
