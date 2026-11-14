<script setup>
import { computed, inject } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import { useSystemStore } from '../../../../../stores/systemStore.js'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const systemStore = useSystemStore()
const settingsStore = useSystemSettingsStore()

const isGesture = computed(() => systemStore.navigationMode === 'gesture')

function selectMode(mode) {
  systemStore.setNavigationMode(mode)
}
</script>

<template>
  <SubPageShell title="系统导航" data-test="subpage-nav" @back="emit('back')">
    <div class="nav-mode-container">
      <!-- 模式选择卡片 -->
      <div class="settings-card mode-select-card">
        <div
          class="mode-option"
          :class="{ active: isGesture }"
          data-test="nav-mode-gesture"
          @click="selectMode('gesture')"
        >
          <div class="mode-preview gesture-preview">
            <div class="preview-screen">
              <div class="preview-gesture-bar"></div>
              <div class="preview-side-arrow left"></div>
              <div class="preview-side-arrow right"></div>
            </div>
          </div>
          <div class="mode-info">
            <div class="mode-radio" :class="{ checked: isGesture }">
              <div v-if="isGesture" class="radio-inner"></div>
            </div>
            <div class="mode-text">
              <div class="mode-title">手势导航</div>
              <div class="mode-desc">从屏幕底部边缘向上滑动返回主屏幕，从左或右边缘向内滑动返回上一级。</div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div
          class="mode-option"
          :class="{ active: !isGesture }"
          data-test="nav-mode-three-button"
          @click="selectMode('threeButton')"
        >
          <div class="mode-preview three-button-preview">
            <div class="preview-screen">
              <div class="preview-buttons">
                <span class="preview-btn">◁</span>
                <span class="preview-btn">○</span>
                <span class="preview-btn">□</span>
              </div>
            </div>
          </div>
          <div class="mode-info">
            <div class="mode-radio" :class="{ checked: !isGesture }">
              <div v-if="!isGesture" class="radio-inner"></div>
            </div>
            <div class="mode-text">
              <div class="mode-title">三键导航</div>
              <div class="mode-desc">使用屏幕底部的虚拟按键进行返回、返回主屏幕和打开多任务。</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 手势导航专属细项 -->
      <template v-if="isGesture">
        <div class="section-title">手势设置</div>
        <div class="settings-card">
          <ListCell
            title="返回手势震动提示"
            subtitle="从边缘向内滑动触发返回时提供触感反馈"
          >
            <template #right>
              <ToggleSwitch
                data-test="toggle-back-vibration"
                :model-value="settingsStore.backVibration"
                @update:model-value="settingsStore.setBackVibration"
              />
            </template>
          </ListCell>

          <ListCell
            title="隐藏手势底部指示条"
            subtitle="隐藏屏幕底部的手势横条以获取完整全屏视野"
            last
          >
            <template #right>
              <ToggleSwitch
                data-test="toggle-bottom-bar"
                :model-value="settingsStore.bottomBarHidden"
                @update:model-value="settingsStore.setBottomBarHidden"
              />
            </template>
          </ListCell>
        </div>

        <div class="section-title">手势灵敏度</div>
        <div class="settings-card sensitivity-card">
          <div class="sensitivity-options">
            <div
              v-for="sens in ['low', 'standard', 'high']"
              :key="sens"
              class="sens-item"
              :class="{ selected: settingsStore.gestureSensitivity === sens }"
              @click="settingsStore.setGestureSensitivity(sens)"
            >
              <div class="sens-radio" :class="{ active: settingsStore.gestureSensitivity === sens }"></div>
              <span class="sens-label">
                {{ sens === 'low' ? '低灵敏度' : sens === 'standard' ? '标准' : '高灵敏度' }}
              </span>
            </div>
          </div>
          <div class="sensitivity-tip">
            灵敏度较高时，更容易触发返回手势，但可能会与应用内的滑动操作产生冲突。
          </div>
        </div>
      </template>
    </div>
  </SubPageShell>
</template>

<style scoped>
.nav-mode-container {
  padding: 12px 16px 32px;
}

.mode-select-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-option {
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: background 0.15s ease;
}

.mode-option:hover {
  background: #F7F8F9;
}

.mode-preview {
  height: 110px;
  background: #F2F4F7;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid #E5E7EB;
}

.preview-screen {
  width: 140px;
  height: 90px;
  background: #FFFFFF;
  border-radius: 8px;
  position: relative;
  border: 1px solid #D1D5DB;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.preview-gesture-bar {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 4px;
  background: #000000;
  border-radius: 2px;
}

.preview-side-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 16px;
  border-radius: 3px;
  background: #007AFF;
  opacity: 0.6;
}

.preview-side-arrow.left {
  left: 3px;
}

.preview-side-arrow.right {
  right: 3px;
}

.preview-buttons {
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  color: #555555;
  font-size: 11px;
}

.preview-btn {
  font-size: 10px;
  line-height: 1;
}

.mode-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.mode-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.mode-radio.checked {
  border-color: #007AFF;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #007AFF;
}

.mode-text {
  flex: 1;
}

.mode-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.mode-desc {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.4;
}

.divider {
  height: 1px;
  background: #E5E7EB;
  margin: 4px 0;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 18px 16px 8px;
}

.sensitivity-card {
  padding: 16px;
  background: #FFFFFF;
  border-radius: 16px;
}

.sensitivity-options {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.sens-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 6px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sens-item.selected {
  background: #EFF6FF;
  border-color: #3B82F6;
}

.sens-radio {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid #CBD5E1;
}

.sens-radio.active {
  border-color: #3B82F6;
  background: #3B82F6;
}

.sens-label {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
}

.sensitivity-tip {
  margin-top: 14px;
  font-size: 12px;
  color: #64748B;
  line-height: 1.4;
}
</style>
