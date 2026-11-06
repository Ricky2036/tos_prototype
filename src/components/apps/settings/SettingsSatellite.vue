<script setup>
import GlassNavBar from '../../ui/GlassNavBar.vue'
import { ref } from 'vue'
import { useNetworkStore } from '../../../stores/networkStore'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back'])

const network = useNetworkStore()

// 提示反馈
const toastText = ref('')
let toastTimer = null
function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2200)
}

function handleToggleSatellite(val) {
  if (val && !network.satelliteSimInserted) {
    showToast('未检测到支持星链卫星的专用卡')
  } else {
    network.setSatelliteService(val)
  }
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-satellite-page">
    <GlassNavBar title="星链卫星网络" @back="emit('back')" />

    <div class="satellite-scroll-content scrollable">
      <!-- 提示横幅 -->
      <div class="status-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>当前未插入支持星链的 SIM 卡。</span>
      </div>

      <!-- 星链卫星服务开关卡片 -->
      <div class="settings-card">
        <ListCell title="星链卫星服务" last>
          <template #right>
            <ToggleSwitch
              :model-value="network.satelliteServiceEnabled"
              @update:model-value="handleToggleSatellite"
            />
          </template>
        </ListCell>
      </div>

      <!-- 关于卫星连接 -->
      <div class="settings-card guide-card">
        <div class="card-headline">关于卫星连接</div>
        <div class="card-desc">
          您可以使用特定运营商提供的卫星直连服务来使用短信或者数据服务。
        </div>
      </div>

      <!-- 使用指南与注意事项 -->
      <div class="settings-card guide-card">
        <div class="card-headline">使用指南</div>

        <div class="guide-item">
          <div class="guide-item-title">1. 自动触发</div>
          <div class="guide-item-text">手机完全没有移动网络时，会自动尝试连接到卫星。</div>
        </div>

        <div class="guide-item">
          <div class="guide-item-title">2. 环境要求</div>
          <div class="guide-item-text">为获得最佳卫星连接信号，请将手机对准天空，确保无建筑物、树木等遮挡。</div>
        </div>

        <div class="guide-item">
          <div class="guide-item-title">3. 功能使用</div>
          <div class="guide-item-text">连接成功后，您可以向任何人发送短信（包括紧急服务），并可在某些特定应用上受限地使用数据。一旦地面移动网络恢复，手机会自动重新连接地面移动网络。</div>
        </div>

        <div class="inner-divider"></div>

        <div class="card-headline">注意事项</div>

        <div class="guide-item">
          <div class="guide-item-title">1. 地区限制</div>
          <div class="guide-item-text">卫星连接仅在部分地区可用，可查看运营商官网了解详情。</div>
        </div>

        <div class="guide-item">
          <div class="guide-item-title">2. 环境干扰</div>
          <div class="guide-item-text">卫星连接并非一直稳定可用。受天气、建筑物遮挡、卫星移动等因素影响，可能会出现信号不稳定或连接断开的情况。</div>
        </div>

        <div class="guide-item">
          <div class="guide-item-title">3. 资费与套餐</div>
          <div class="guide-item-text">资费与套餐请以运营商公布的政策为准，具体费用及开通方式可咨询运营商。</div>
        </div>
      </div>

      <!-- 支持卫星通讯的应用卡片 -->
      <div class="settings-card guide-card">
        <div class="card-headline">支持卫星通讯的应用</div>
        <div class="card-subhead">卫星连接状态下，您的手机端支持以下应用</div>
        <div class="empty-app-notice">未插入星链卡，无法检索手机支持的应用。</div>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 轻提示 (Toast) -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-satellite-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  z-index: 20;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.satellite-nav {
  position: sticky;
  top: 0;
  width: 100%;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #F4F5F7;
  flex-shrink: 0;
  z-index: 10;
  box-sizing: border-box;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1A1A1A;
  transition: background 0.15s;
}

.nav-round-btn:active {
  background: rgba(0, 0, 0, 0.08);
}

.nav-title {
  font-size: 20px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.2px;
}

.satellite-scroll-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 16px 36px;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.satellite-scroll-content::-webkit-scrollbar {
  display: none;
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(0, 122, 255, 0.08);
  border-radius: 14px;
  font-size: 13px;
  color: #007AFF;
  font-weight: 500;
  margin-bottom: 14px;
}

.settings-card {
background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 14px;
  box-sizing: border-box;
}

.guide-card {
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-headline {
  font-size: 17px;
  font-weight: 700;
  color: #111;
}

.card-desc {
  font-size: 13px;
  color: #636366;
  line-height: 1.5;
}

.card-subhead {
  font-size: 13px;
  color: #8E8E93;
  margin-top: -6px;
}

.inner-divider {
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
  margin: 6px 0;
}

.guide-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.guide-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #111;
}

.guide-item-text {
  font-size: 13px;
  color: #636366;
  line-height: 1.5;
}

.empty-app-notice {
  padding: 24px 0 12px;
  text-align: center;
  font-size: 13px;
  color: #8E8E93;
}

.bottom-spacer {
  height: 24px;
}

.settings-toast {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.88);
  backdrop-filter: blur(12px);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 22px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 200;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}
</style>
