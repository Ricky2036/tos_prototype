<script setup>
import PrivacyAppIcon from './PrivacyAppIcon.vue'
import LIcon from '../ui/LIcon.vue'
import { GLYPHS } from '../../assets/icons/glyphs'
import weather from '../../assets/icons/notification-apps/weather.png'
import wechat from '../../assets/icons/notification-apps/wechat.png'
import google from '../../assets/icons/notification-apps/google.png'
defineProps({app:String,size:{type:Number,default:28}})
const icons={weather,wechat,google}
</script>
<template>
 <PrivacyAppIcon v-if="['camera','recorder','maps'].includes(app)" :app="app" :size="size"/>
 <img v-else-if="icons[app]" :src="icons[app]" :width="size" :height="size" class="reference-icon" alt="" aria-hidden="true"/>
 <span v-else class="reference-icon painted" :class="app" :style="{width:`${size}px`,height:`${size}px`}" aria-hidden="true">
  <svg v-if="app==='folax'" viewBox="0 0 40 40"><defs><linearGradient id="folax-ring" x2="1" y2="1"><stop stop-color="#16def7"/><stop offset=".5" stop-color="#77c5ff"/><stop offset="1" stop-color="#ae57ed"/></linearGradient></defs><path d="M10 27C0 17 18 1 24 5C30 8 37 28 30 32C24 37 9 34 10 27Z" fill="#b9e7ff88" stroke="url(#folax-ring)" stroke-width="3"/><path d="M6 24C5 14 27 6 30 13C34 20 28 35 20 34C12 34 6 30 6 24Z" fill="none" stroke="url(#folax-ring)" stroke-width="3"/></svg>
  <svg v-else-if="app==='amap'" viewBox="0 0 40 40"><rect width="40" height="40" fill="#f4fff3"/><path d="M7 0V40M0 15H40M0 29H40" stroke="#bdf29d" stroke-width="9"/><path d="M2 18L37 3L24 37L19 24Z" fill="#1297f5"/><path d="M19 24L37 3L15 21Z" fill="#006ad1"/></svg>
  <svg v-else-if="app==='phone'" viewBox="0 0 32 32"><path :d="GLYPHS.phone" transform="translate(4 4)" fill="white"/></svg>
  <svg v-else-if="app==='sms'" viewBox="0 0 32 32"><path :d="GLYPHS.message" transform="translate(4 4)" fill="white"/></svg>
  <LIcon v-else name="captions" :size="size*.75"/>
 </span>
</template>
<style scoped>
.reference-icon{display:block;flex:none;border-radius:25%;object-fit:contain;overflow:hidden}.painted{display:grid;place-items:center;color:white;background:#2cad5b}.painted svg{width:100%;height:100%}.painted.folax{background:#f9f8ff}.painted.sms{background:linear-gradient(135deg,#13c8fa,#147aff)}.painted.phone{background:linear-gradient(135deg,#6bdd3c,#13ab23)}
</style>
