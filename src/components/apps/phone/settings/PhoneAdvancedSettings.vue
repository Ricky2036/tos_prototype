<script setup>
import { usePhoneStore } from '../../../../stores/phoneStore'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])
</script>

<template>
  <div class="phone-settings-subpage">
    <div class="subpage-header">
      <button class="back-btn" title="返回" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="header-title">高级设置</div>
    </div>

    <div class="subpage-body scrollable">
      <!-- 基础通话开关 -->
      <div class="settings-row item-switch">
        <div class="row-label">按电源按钮结束通话</div>
        <ToggleSwitch v-model="phoneStore.settings.powerButtonEndsCall" />
      </div>

      <div class="settings-row item-switch">
        <div class="row-label">接听/挂断电话时振动</div>
        <ToggleSwitch v-model="phoneStore.settings.vibrateOnCallAction" />
      </div>

      <!-- 快速拨号 & 无障碍 -->
      <div class="settings-row chevron-item">
        <div class="row-label">快速拨号</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
          <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="settings-row chevron-item">
        <div class="row-label">无障碍功能</div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
          <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- 智能手势分类 -->
      <div class="section-caption">智能手势</div>

      <div
        class="settings-row chevron-item"
        @click="phoneStore.settings.flipToMute = !phoneStore.settings.flipToMute"
      >
        <div class="row-label">翻转静音</div>
        <div class="value-right">
          <span class="value-text">{{ phoneStore.settings.flipToMute ? '已开启' : '关闭' }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <div
        class="settings-row chevron-item"
        @click="phoneStore.settings.pickupToAnswer = !phoneStore.settings.pickupToAnswer"
      >
        <div class="row-label">拿起接听</div>
        <div class="value-right">
          <span class="value-text">{{ phoneStore.settings.pickupToAnswer ? '已开启' : '关闭' }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <div
        class="settings-row chevron-item"
        @click="phoneStore.settings.gestureAnswer = !phoneStore.settings.gestureAnswer"
      >
        <div class="row-label">手势接听</div>
        <div class="value-right">
          <span class="value-text">{{ phoneStore.settings.gestureAnswer ? '已开启' : '关闭' }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F3;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-header {
  display: flex;
  align-items: center;
  padding-top: calc(var(--safe-top, 54px) + 8px);
  padding-bottom: 12px;
  padding-left: 16px;
  padding-right: 16px;
  background: #F0F1F3;
}

.back-btn {
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.back-btn:active {
  background-color: #E8E9EB;
  transform: scale(0.96);
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1C1C1E;
  margin-left: 12px;
}

.subpage-body {
  flex: 1;
  padding: 12px 20px 40px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
}

.chevron-item {
  cursor: pointer;
}

.row-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.section-caption {
  font-size: 13px;
  color: #8E8E93;
  margin: 24px 0 8px;
}

.value-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.value-text {
  font-size: 14px;
  color: #8E8E93;
}
</style>
