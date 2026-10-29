<script setup>
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
    <div class="nfc-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">NFC</div>
    </div>

    <!-- 滚动主体内容 -->
    <div class="nfc-scroll-body scrollable">
      <!-- 头部 NFC 模拟示意图与提示条 -->
      <div class="nfc-banner-card">
        <div class="nfc-icon-orbit">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 10.5C6 7.46 8.46 5 11.5 5h1C15.54 5 18 7.46 18 10.5v3c0 3.04-2.46 5.5-5.5 5.5h-1C8.46 19 6 16.54 6 13.5v-3z" />
            <path d="M9 10.5C9 9.12 10.12 8 11.5 8h1C13.88 8 15 9.12 15 10.5v3c0 1.38-1.12 2.5-2.5 2.5h-1C10.12 16 9 14.88 9 13.5v-3z" />
          </svg>
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
        <!-- 功能选项卡片 -->
        <div class="settings-card">
          <ListCell
            title="允许 NFC 读卡提醒"
            :value="network.nfcReadPrompt"
            chevron
            clickable
            @click="showToast('当前设置：无限制，允许自动识别附近 NFC 标签与卡片')"
          />
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
  padding: 8px 16px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: none;
}

.nfc-scroll-body::-webkit-scrollbar {
  display: none;
}

.nfc-banner-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 16px 14px;
}

.nfc-icon-orbit {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  background: rgba(0, 122, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.nfc-banner-desc {
  font-size: 14px;
  color: #8E8E93;
  line-height: 1.45;
  max-width: 260px;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
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
