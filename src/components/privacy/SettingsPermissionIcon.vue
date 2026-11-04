<script setup>
import mic from 'lucide-static/icons/mic.svg?raw'
import camera from 'lucide-static/icons/video.svg?raw'
import location from 'lucide-static/icons/map-pin.svg?raw'
import notifications from 'lucide-static/icons/bell-ring.svg?raw'
import nearby from 'lucide-static/icons/diamond.svg?raw'
import health from 'lucide-static/icons/heart-pulse.svg?raw'
import files from 'lucide-static/icons/folder.svg?raw'
import calendar from 'lucide-static/icons/calendar-days.svg?raw'
import photos from 'lucide-static/icons/images.svg?raw'
import phone from 'lucide-static/icons/phone.svg?raw'
import sms from 'lucide-static/icons/message-square-more.svg?raw'
import contacts from 'lucide-static/icons/contact-round.svg?raw'
import activity from 'lucide-static/icons/person-standing.svg?raw'
import calls from 'lucide-static/icons/phone-call.svg?raw'
import audio from 'lucide-static/icons/music-2.svg?raw'
defineProps({ permission: String })
const icons = {microphone:mic,camera,location,notifications,nearby,health,files,calendar,photos,phone,sms,contacts,activity,calls,audio}
</script>
<template><span class="settings-permission-icon" aria-hidden="true" v-html="icons[permission] || nearby"></span></template>
<style scoped>
.settings-permission-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;width:26px;height:26px;color:#48494d}.settings-permission-icon :deep(svg){width:22px;height:22px;stroke-width:2.2}
</style>
