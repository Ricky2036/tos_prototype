<script setup>
import GlassNavBar from '../../ui/GlassNavBar.vue'
import { ref } from 'vue'
import { useNetworkStore } from '../../../stores/networkStore'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import SettingsSystemIcon from '../../ui/SettingsSystemIcon.vue'

const emit = defineEmits(['back', 'open-wallet'])

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

function handleAddAccessCard() {
  showToast('请将实体门禁卡贴近手机背部上方 NFC 感应区域进行读卡')
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-nfc-page">
    <!-- 顶部导航栏 -->
    <GlassNavBar title="NFC" @back="emit('back')" />

    <!-- 滚动主体内容 -->
    <div class="nfc-scroll-body scrollable">
      <!-- 头部 NFC 模拟示意图与提示条 (实机 1:1) -->
      <div class="nfc-banner-card">
        <div class="nfc-phone-graphic">
          <div class="nfc-phone-body">
            <div class="nfc-camera-island"></div>
            <div class="nfc-wave-circle">
              <span class="nfc-wave-text">NFC</span>
            </div>
          </div>
        </div>
        <div class="nfc-banner-desc">将感应区贴近 NFC 设备以使用卡片或支付。</div>
      </div>

      <!-- NFC 总开关卡片 -->
      <div class="settings-card">
        <ListCell title="NFC" last>
          <template #right>
            <ToggleSwitch
              :model-value="network.nfcEnabled"
              @update:model-value="v => network.setNfc(v)"
              @change="showToast(network.nfcEnabled ? '已开启 NFC' : '已关闭 NFC')"
            />
          </template>
        </ListCell>
      </div>

      <template v-if="network.nfcEnabled">
        <!-- 卡片 2: 读卡提醒 (独立卡片，实机 1:1) -->
        <div class="settings-card">
          <ListCell
            title="允许 NFC 读卡提醒"
            :value="network.nfcReadPrompt"
            chevron
            last
            clickable
            @click="showToast('当前设置：无限制，允许自动识别附近 NFC 标签与卡片')"
          />
        </div>

        <!-- 卡片 3: 门禁卡与卡包 (独立卡片，实机 1:1) -->
        <div class="settings-card">
          <ListCell
            title="添加 NFC 门禁卡"
            subtitle="复制门禁卡到手机使用。"
            chevron
            clickable
            @click="handleAddAccessCard"
          />
          <ListCell
            title="卡包"
            chevron
            last
            clickable
            @click="emit('open-wallet')"
          />
        </div>
      </template>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 轻提示 (Toast) -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-nfc-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  z-index: 25;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.nfc-nav-bar {
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

.nfc-scroll-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 16px 36px;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.nfc-scroll-body::-webkit-scrollbar {
  display: none;
}

.nfc-banner-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px 8px;
  margin-bottom: 14px;
}

.nfc-phone-graphic {
  width: 140px;
  height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 16px;
}

.nfc-phone-body {
  width: 100px;
  height: 160px;
  background: #CBD5E1;
  border-radius: 20px;
  position: relative;
  overflow: visible;
}

.nfc-camera-island {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 32px;
  height: 48px;
  background: #94A3B8;
  border-radius: 8px;
}

.nfc-wave-circle {
  position: absolute;
  top: 10px;
  right: -15px;
  width: 75px;
  height: 75px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.15);
}

.nfc-wave-text {
  font-size: 13px;
  font-weight: 700;
  color: #1D4ED8;
  letter-spacing: 0.5px;
}

.nfc-banner-desc {
  font-size: 13px;
  color: #475569;
  line-height: 1.45;
  max-width: 280px;
}

.settings-card {
background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 14px;
  box-sizing: border-box;
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
