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
      <div class="header-title">自动录音</div>
    </div>

    <div class="subpage-body scrollable">
      <!-- 自动录音主开关 -->
      <div class="settings-row item-switch">
        <div class="row-label">自动录音</div>
        <ToggleSwitch v-model="phoneStore.settings.autoRecord" />
      </div>

      <template v-if="phoneStore.settings.autoRecord">
        <!-- 自动录音对象分类 -->
        <div class="section-caption">自动录音对象</div>
        <div class="radio-group-card">
          <div
            class="settings-row radio-item"
            @click="phoneStore.settings.recordScope = 'all'"
          >
            <div class="row-label">所有通话</div>
            <div class="custom-radio" :class="{ checked: phoneStore.settings.recordScope === 'all' }">
              <div v-if="phoneStore.settings.recordScope === 'all'" class="radio-inner"></div>
            </div>
          </div>

          <div
            class="settings-row radio-item"
            @click="phoneStore.settings.recordScope = 'custom'"
          >
            <div class="row-label">自定义</div>
            <div class="custom-radio" :class="{ checked: phoneStore.settings.recordScope === 'custom' }">
              <div v-if="phoneStore.settings.recordScope === 'custom'" class="radio-inner"></div>
            </div>
          </div>
        </div>

        <!-- 自定义子项目 -->
        <template v-if="phoneStore.settings.recordScope === 'custom'">
          <div class="section-caption">自定义</div>
          <div class="custom-detail-card">
            <div class="settings-row chevron-item">
              <div class="row-label">指定号码</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="settings-row item-switch">
              <div class="row-label">陌生号码</div>
              <ToggleSwitch v-model="phoneStore.settings.recordUnknown" />
            </div>
          </div>
        </template>
      </template>
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

.section-caption {
  font-size: 13px;
  color: #8E8E93;
  margin: 20px 0 8px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
}

.row-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.radio-item {
  cursor: pointer;
}

.custom-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #D1D1D6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.custom-radio.checked {
  border-color: #00C853;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #00C853;
}

.chevron-item {
  cursor: pointer;
}
</style>
