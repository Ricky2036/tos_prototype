<script setup>
import camera from '../../assets/privacy/apps/camera.svg'
import recorder from '../../assets/privacy/apps/recorder.svg'
import maps from '../../assets/privacy/apps/maps.svg'
import { DEMO_APPS } from '../../stores/privacyStore'
import LIcon from '../ui/LIcon.vue'
defineProps({ app: String, size: { type: Number, default: 26 } })
const icons = { camera, recorder, maps }
</script>
<template>
 <img v-if="icons[app]" class="privacy-app-icon" :src="icons[app]" :width="size" :height="size" alt="" aria-hidden="true" draggable="false" />
 <span v-else class="privacy-app-icon fallback" :style="{width:`${size}px`,height:`${size}px`,background:DEMO_APPS[app].color}"><LIcon :name="DEMO_APPS[app].icon" :size="size*.65" /></span>
</template>
<style scoped>
.privacy-app-icon{display:block;flex:none;object-fit:contain;border-radius:29.1%}.fallback{display:inline-flex;align-items:center;justify-content:center;color:white}
</style>
