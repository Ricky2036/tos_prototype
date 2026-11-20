<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import TmAppList from './TmAppList.vue'
import TmIndex from './TmIndex.vue'
import { tmApps, tmLettersOf, tmScrollTo, tmLetterAtTop } from './appIndex.js'
import { useTrafficStore } from '../../../../stores/trafficStore.js'
import { TM_WIFI_APPS } from './trafficData.js'
import './traffic.css'

/**
 * 应用 Wi-Fi 权限管理
 * 真机：顶部一句灰字说明「关闭应用开关可限制该应用使用 Wi-Fi。」，下面是全量应用开关 + A-Z 导轨（单段，不分「其他应用」）。
 */
const emit = defineEmits(['back'])
const traffic = useTrafficStore()

const body = ref(null)
const activeLetter = ref('')

const apps = computed(() => tmApps({ showSystemApps: traffic.showSystemApps }))
const sections = computed(() => [{ label: '', apps: apps.value }])
const letters = computed(() => tmLettersOf(apps.value))

function jump(letter) {
  tmScrollTo(body.value, letter)
}

function syncActive() {
  activeLetter.value = tmLetterAtTop(body.value)
}

onMounted(() => {
  syncActive()
  body.value?.addEventListener('scroll', syncActive, { passive: true })
})

onBeforeUnmount(() => {
  body.value?.removeEventListener('scroll', syncActive)
})
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_WIFI_APPS.title" @back="emit('back')" />

    <div ref="body" class="tm-body scrollable" data-testid="tm-wifi-apps">
      <div class="tm-note" style="padding-top: 2px">{{ TM_WIFI_APPS.desc }}</div>
      <TmAppList :sections="sections" list="wifiAllowed" testid="tm-wifi-list" />
      <div class="tm-bottom-space"></div>
    </div>

    <TmIndex :letters="letters" :active-letter="activeLetter" @select="jump" />
  </div>
</template>
