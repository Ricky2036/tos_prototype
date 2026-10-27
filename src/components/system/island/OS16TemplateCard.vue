<script setup>
import { computed } from 'vue'
import { useOs16IslandStore, OS16_TEMPLATES } from '../../../stores/os16IslandStore'

// 导入全部 12 类规范分图层独立实现的模板组件
import FoodDeliveryTemplate from './templates/FoodDeliveryTemplate.vue'
import RideHailingTemplate from './templates/RideHailingTemplate.vue'
import NavigationTemplate from './templates/NavigationTemplate.vue'

import MediaExtendedTemplate from './templates/MediaExtendedTemplate.vue'
import TranslationTemplate from './templates/TranslationTemplate.vue'
import SystemTipTemplate from './templates/SystemTipTemplate.vue'

import ScreenRecordingTemplate from './templates/ScreenRecordingTemplate.vue'
import VoiceRecordingTemplate from './templates/VoiceRecordingTemplate.vue'
import TimerTemplate from './templates/TimerTemplate.vue'
import BatteryChargingTemplate from './templates/BatteryChargingTemplate.vue'
import PhoneCallTemplate from './templates/PhoneCallTemplate.vue'
import MicrophoneTemplate from './templates/MicrophoneTemplate.vue'
import HotspotTemplate from './templates/HotspotTemplate.vue'
import FlashlightTemplate from './templates/FlashlightTemplate.vue'

const os16Store = useOs16IslandStore()
const currentTemplate = computed(() => os16Store.activeTemplate)
</script>

<template>
  <div class="os16-figma-card-container">
    <!-- 进度模板 (Progress Templates) -->
    <FoodDeliveryTemplate v-if="currentTemplate === OS16_TEMPLATES.FOOD_DELIVERY" />
    <RideHailingTemplate v-else-if="currentTemplate === OS16_TEMPLATES.RIDE_HAILING" />
    <NavigationTemplate v-else-if="currentTemplate === OS16_TEMPLATES.NAVIGATION" />

    <!-- 自适应模版 (Adaptive Templates) -->
    <MediaExtendedTemplate v-else-if="currentTemplate === OS16_TEMPLATES.MEDIA_EXTENDED" />
    <TranslationTemplate v-else-if="currentTemplate === OS16_TEMPLATES.TRANSLATION" />
    <SystemTipTemplate v-else-if="currentTemplate === OS16_TEMPLATES.SYSTEM_TIP" />

    <!-- 基础模板 (Base Templates) -->
    <ScreenRecordingTemplate v-else-if="currentTemplate === OS16_TEMPLATES.SCREEN_RECORDING" />
    <VoiceRecordingTemplate v-else-if="currentTemplate === OS16_TEMPLATES.VOICE_RECORDING" />
    <TimerTemplate v-else-if="currentTemplate === OS16_TEMPLATES.TIMER" />
    <BatteryChargingTemplate v-else-if="currentTemplate === OS16_TEMPLATES.BATTERY_CHARGING" />
    <PhoneCallTemplate v-else-if="currentTemplate === OS16_TEMPLATES.PHONE_CALL" />
    <MicrophoneTemplate v-else-if="currentTemplate === OS16_TEMPLATES.MICROPHONE" />
    <HotspotTemplate v-else-if="currentTemplate === OS16_TEMPLATES.HOTSPOT" />
    <FlashlightTemplate v-else-if="currentTemplate === OS16_TEMPLATES.FLASHLIGHT" />
  </div>
</template>

<style scoped>
.os16-figma-card-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  background: transparent;
  border-radius: 28px;
  overflow: hidden;
}
</style>
