<script setup>
import { computed } from 'vue'
import { useOs16IslandStore, OS16_TEMPLATES } from '../../../stores/os16IslandStore'
import FoodDeliveryTemplate from './templates/FoodDeliveryTemplate.vue'

// 导入从 Figma 原稿规范导出的 100% 纯矢量 SVG 卡片资产
import svgFoodDelivery from '../../../assets/island/progress_food_delivery.svg'
import svgRideHailing from '../../../assets/island/progress_ride_hailing.svg'
import svgNavigation from '../../../assets/island/progress_navigation.svg'

import svgAdaptiveMedia from '../../../assets/island/adaptive_media.svg'
import svgAdaptiveTranslation from '../../../assets/island/adaptive_translation.svg'
import svgAdaptiveSystemTip from '../../../assets/island/adaptive_system_tip.svg'

import svgScreenRecording from '../../../assets/island/base_screen_recording.svg'
import svgVoiceRecording from '../../../assets/island/base_voice_recording.svg'
import svgTimer from '../../../assets/island/base_timer.svg'
import svgBatteryCharging from '../../../assets/island/base_battery_charging.svg'
import svgPhoneCall from '../../../assets/island/base_phone_call.svg'
import svgMicrophone from '../../../assets/island/base_microphone.svg'
import svgHotspot from '../../../assets/island/base_hotspot.svg'
import svgFlashlight from '../../../assets/island/base_flashlight.svg'

const os16Store = useOs16IslandStore()
const currentTemplate = computed(() => os16Store.activeTemplate)

// 当前模版对应的纯矢量 SVG 文件映射
const templateSvgMap = {
  [OS16_TEMPLATES.FOOD_DELIVERY]: svgFoodDelivery,
  [OS16_TEMPLATES.RIDE_HAILING]: svgRideHailing,
  [OS16_TEMPLATES.NAVIGATION]: svgNavigation,
  [OS16_TEMPLATES.MEDIA_EXTENDED]: svgAdaptiveMedia,
  [OS16_TEMPLATES.TRANSLATION]: svgAdaptiveTranslation,
  [OS16_TEMPLATES.SYSTEM_TIP]: svgAdaptiveSystemTip,
  [OS16_TEMPLATES.SCREEN_RECORDING]: svgScreenRecording,
  [OS16_TEMPLATES.VOICE_RECORDING]: svgVoiceRecording,
  [OS16_TEMPLATES.TIMER]: svgTimer,
  [OS16_TEMPLATES.BATTERY_CHARGING]: svgBatteryCharging,
  [OS16_TEMPLATES.PHONE_CALL]: svgPhoneCall,
  [OS16_TEMPLATES.MICROPHONE]: svgMicrophone,
  [OS16_TEMPLATES.HOTSPOT]: svgHotspot,
  [OS16_TEMPLATES.FLASHLIGHT]: svgFlashlight
}

const currentCardSvg = computed(() => {
  return templateSvgMap[currentTemplate.value] || svgFoodDelivery
})
</script>

<template>
  <div class="os16-figma-card-container">
    <!-- 1. 新一代分图层原生重构模板：外卖履约 (Food Delivery) -->
    <FoodDeliveryTemplate v-if="currentTemplate === OS16_TEMPLATES.FOOD_DELIVERY" />

    <!-- 兼容层：其他模板渲染规范底板与对应交互层 -->
    <template v-else>
      <img
        :src="currentCardSvg"
        class="os16-figma-svg"
        alt="OS16 Island Vector Card"
        draggable="false"
      />

    <!-- ================= 原生交互层 ================= -->

    <!-- 1. 手电筒：开闭状态与发光联动 -->
    <template v-if="currentTemplate === OS16_TEMPLATES.FLASHLIGHT">
      <!-- 开启状态动态图层（仅在开启时覆盖渲染亮金手电筒、Open 标题与高亮 Close 按钮，关闭时使用原生底板） -->
      <template v-if="os16Store.baseTemplateState.isFlashlightOn">
        <div class="dyn-fl-icon-active" @click.stop="os16Store.toggleFlashlight()">
          <svg viewBox="0 0 24 24" class="dyn-fl-lit-svg">
            <path d="M18 6 15 2H9L6 6v3h12V6Z" />
            <path d="M6 9v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9" />
            <circle cx="12" cy="14" r="1.5" />
          </svg>
        </div>
        <div class="dyn-fl-title-active">
          <span class="dyn-fl-title">Open</span>
          <span class="dyn-fl-sub">Flashlight</span>
        </div>
        <button
          class="dyn-fl-btn-active"
          @click.stop="os16Store.toggleFlashlight()"
          title="关闭手电筒"
        >
          Close
        </button>
      </template>

      <!-- 关闭状态下原生透明点击区域 -->
      <button
        v-else
        class="dyn-hit-area dyn-fl-hit"
        @click.stop="os16Store.toggleFlashlight()"
        title="开启手电筒"
      ></button>
    </template>

    <!-- 2. 同声传译：左侧关闭、中间麦克风静音切换、右侧朗读 -->
    <template v-else-if="currentTemplate === OS16_TEMPLATES.TRANSLATION">
      <!-- 左侧关闭按键热区 -->
      <button
        class="dyn-hit-area dyn-trans-hit-close"
        @click.stop="os16Store.closeTemplate()"
        title="关闭同声传译"
      ></button>

      <!-- 中间麦克风：开启静音时显示暂停静音状态覆盖 -->
      <button
        class="dyn-hit-area dyn-trans-hit-mic"
        :class="{ 'is-muted-overlay': !os16Store.translationState.isListening }"
        @click.stop="os16Store.toggleListening()"
        :title="os16Store.translationState.isListening ? '点击暂停拾音' : '点击开始拾音'"
      >
        <svg v-if="!os16Store.translationState.isListening" viewBox="0 0 24 24" class="dyn-trans-muted-icon">
          <line x1="2" y1="2" x2="22" y2="22" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
          <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" stroke="#ffffff" stroke-width="2" fill="none" />
          <path d="M5 10v2a7 7 0 0 0 12 5" stroke="#ffffff" stroke-width="2" fill="none" />
          <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" stroke="#ffffff" stroke-width="2" fill="none" />
          <path d="M9 9v3a3 3 0 0 0 5.12 2.12" stroke="#ffffff" stroke-width="2" fill="none" />
        </svg>
      </button>

      <!-- 右侧朗读按键热区 -->
      <button
        class="dyn-hit-area dyn-trans-hit-speak"
        @click.stop="os16Store.toggleSpeaking()"
        :title="os16Store.translationState.isSpeaking ? '停止朗读' : '朗读译文'"
      ></button>
    </template>

    <!-- 3. 系统引导：Details 按键点击切换为掌握标记 -->
    <template v-else-if="currentTemplate === OS16_TEMPLATES.SYSTEM_TIP">
      <button
        class="dyn-hit-area dyn-tip-hit-btn"
        :class="{ 'is-learned-pill': os16Store.systemTipState.isLearned }"
        @click.stop="os16Store.toggleTipLearned()"
        :title="os16Store.systemTipState.isLearned ? '已掌握' : '查看详情'"
      >
        <span v-if="os16Store.systemTipState.isLearned">✓ 已掌握</span>
      </button>
    </template>

    <!-- 4. 外卖履约：点击卡片推进配送进度 -->
    <template v-else-if="currentTemplate === OS16_TEMPLATES.FOOD_DELIVERY">
      <div
        class="dyn-hit-area dyn-full-hit"
        @click.stop="os16Store.advanceFoodDelivery()"
        title="点击推进外卖配送阶段"
      ></div>
    </template>

    <!-- 5. 网约接驾：点击卡片推进行程进度 -->
    <template v-else-if="currentTemplate === OS16_TEMPLATES.RIDE_HAILING">
      <div
        class="dyn-hit-area dyn-full-hit"
        @click.stop="os16Store.advanceRideHailing()"
        title="点击推进行程阶段"
      ></div>
    </template>

    <!-- 6. 地图导航：底部 Exit Navigate 按键热区与路况导向切换 -->
    <template v-else-if="currentTemplate === OS16_TEMPLATES.NAVIGATION">
      <button
        class="dyn-hit-area dyn-nav-exit-hit"
        @click.stop="os16Store.closeTemplate()"
        title="退出导航"
      ></button>
      <div
        class="dyn-hit-area dyn-nav-top-hit"
        @click.stop="os16Store.advanceNavigation()"
        title="切换导航路段"
      ></div>
    </template>

    <!-- 7. 屏幕录制：暂停按键与停止录制按键 -->
    <template v-else-if="currentTemplate === OS16_TEMPLATES.SCREEN_RECORDING">
      <button
        class="dyn-hit-area dyn-rec-hit-pause"
        :class="{ 'is-paused-overlay': os16Store.baseTemplateState.isRecordingPaused }"
        @click.stop="os16Store.toggleRecordingPause()"
        :title="os16Store.baseTemplateState.isRecordingPaused ? '继续录屏' : '暂停录屏'"
      >
        <svg v-if="os16Store.baseTemplateState.isRecordingPaused" viewBox="0 0 24 24" class="dyn-play-triangle">
          <polygon points="7 4 19 12 7 20 7 4" fill="#ffffff" />
        </svg>
      </button>
      <button
        class="dyn-hit-area dyn-rec-hit-stop"
        @click.stop="os16Store.closeTemplate()"
        title="结束录屏"
      ></button>
    </template>

    <!-- 8. 电话通话：挂断（红键）与免提（绿键） -->
    <template v-else-if="currentTemplate === OS16_TEMPLATES.PHONE_CALL">
      <button
        class="dyn-hit-area dyn-call-hit-hangup"
        @click.stop="os16Store.closeTemplate()"
        title="挂断通话"
      ></button>
      <button
        class="dyn-hit-area dyn-call-hit-speaker"
        @click.stop="os16Store.toggleCallSpeaker()"
        title="免提通话"
      ></button>
    </template>

    <!-- 9. 超级快充：切换快充档位热区 -->
    <template v-else-if="currentTemplate === OS16_TEMPLATES.BATTERY_CHARGING">
      <button
        class="dyn-hit-area dyn-battery-hit"
        @click.stop="os16Store.toggleChargingMode()"
        title="切换快充模式"
      ></button>
    </template>

    <!-- 10. 个人热点：关闭热点热区 -->
    <template v-else-if="currentTemplate === OS16_TEMPLATES.HOTSPOT">
      <button
        class="dyn-hit-area dyn-hotspot-hit"
        @click.stop="os16Store.closeTemplate()"
        title="关闭个人热点"
      ></button>
    </template>

    <!-- 11. 麦克拾音：关闭与暂停拾音 -->
    <template v-else-if="currentTemplate === OS16_TEMPLATES.MICROPHONE">
      <button
        class="dyn-hit-area dyn-mic-hit-close"
        @click.stop="os16Store.closeTemplate()"
        title="关闭麦克风拾音"
      ></button>
      <button
        class="dyn-hit-area dyn-mic-hit-pause"
        @click.stop="os16Store.toggleMicMute()"
        title="暂停/继续拾音"
      ></button>
    </template>
    </template>
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

.os16-figma-svg {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
  pointer-events: none;
  border-radius: 28px;
}

/* ================= 通用透明点击热区 (绝对对齐矢量底板按键位置) ================= */
.dyn-hit-area {
  position: absolute;
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  z-index: 5;
  padding: 0;
  margin: 0;
}

.dyn-hit-area:active {
  opacity: 0.8;
}

.dyn-full-hit {
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ================= 1. 手电筒动态图层 ================= */
.dyn-fl-hit {
  right: 14px;
  top: 19px;
  width: 60px;
  height: 34px;
  border-radius: 17px;
}

.dyn-fl-icon-active {
  position: absolute;
  left: 15px;
  top: 15px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
}

.dyn-fl-lit-svg {
  width: 24px;
  height: 24px;
  fill: #ffd600;
  stroke: #ffd600;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 10px rgba(255, 214, 0, 0.9));
}

.dyn-fl-title-active {
  position: absolute;
  left: 64px;
  top: 14px;
  width: 140px;
  height: 44px;
  background: #000000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}

.dyn-fl-title {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  line-height: 20px;
}

.dyn-fl-sub {
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  line-height: 16px;
}

.dyn-fl-btn-active {
  position: absolute;
  right: 14px;
  top: 19px;
  width: 58px;
  height: 33px;
  border-radius: 17px;
  border: none;
  outline: none;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 6;
  background: #ffffff;
  color: #000000;
  box-shadow: 0 2px 14px rgba(255, 255, 255, 0.45);
}

.dyn-fl-btn-active:active {
  transform: scale(0.92);
}

/* ================= 2. 同声传译热区与静音层 ================= */
.dyn-trans-hit-close {
  left: 54px;
  bottom: 14px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

.dyn-trans-hit-mic {
  left: 146px;
  bottom: 11px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dyn-trans-hit-mic.is-muted-overlay {
  background: #3a3a3c;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.dyn-trans-muted-icon {
  width: 22px;
  height: 22px;
}

.dyn-trans-hit-speak {
  right: 54px;
  bottom: 14px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

/* ================= 3. 系统引导掌握状态 ================= */
.dyn-tip-hit-btn {
  right: 18px;
  bottom: 16px;
  width: 140px;
  height: 38px;
  border-radius: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13.5px;
  font-weight: 600;
}

.dyn-tip-hit-btn.is-learned-pill {
  background: #31c65a;
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(49, 198, 90, 0.35);
}

/* ================= 4. 地图导航热区 ================= */
.dyn-nav-exit-hit {
  left: 16px;
  right: 16px;
  bottom: 12px;
  height: 40px;
  border-radius: 20px;
}

.dyn-nav-top-hit {
  left: 0;
  right: 0;
  top: 0;
  bottom: 56px;
}

/* ================= 5. 屏幕录制热区 ================= */
.dyn-rec-hit-pause {
  right: 68px;
  top: 18px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dyn-rec-hit-pause.is-paused-overlay {
  background: #3a3a3c;
}

.dyn-play-triangle {
  width: 16px;
  height: 16px;
  margin-left: 2px;
}

.dyn-rec-hit-stop {
  right: 16px;
  top: 18px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

/* ================= 6. 电话通话热区 ================= */
.dyn-call-hit-hangup {
  right: 68px;
  top: 18px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

.dyn-call-hit-speaker {
  right: 16px;
  top: 18px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

/* ================= 7. 超级快充热区 ================= */
.dyn-battery-hit {
  right: 16px;
  top: 16px;
  width: 124px;
  height: 42px;
  border-radius: 21px;
}

/* ================= 8. 个人热点热区 ================= */
.dyn-hotspot-hit {
  right: 14px;
  top: 18px;
  width: 60px;
  height: 36px;
  border-radius: 18px;
}

/* ================= 9. 麦克拾音热区 ================= */
.dyn-mic-hit-close {
  right: 68px;
  top: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.dyn-mic-hit-pause {
  right: 16px;
  top: 18px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
}
</style>
