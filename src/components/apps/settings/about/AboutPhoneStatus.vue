<script setup>
import { ref } from 'vue'
import { useDeviceStore } from '../../../../stores/deviceStore'
import ListCell from '../../../ui/ListCell.vue'

const emit = defineEmits(['back'])
const deviceStore = useDeviceStore()

const toastText = ref('')
let toastTimer = null
function copyText(label, val) {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(val).catch(() => {})
  }
  toastText.value = `已复制 ${label}`
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2000)
}
</script>

<template>
  <div class="status-info-page">
    <!-- 顶部导航栏 -->
    <div class="sub-nav-bar">
      <button class="nav-round-btn" aria-label="返回" type="button" @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">手机信息</div>
    </div>

    <!-- 滚动区域 -->
    <div class="sub-scroll-body scrollable">
      <!-- 分组 1: SIM 卡状态 -->
      <div class="group-header">SIM 卡状态</div>
      <div class="settings-card">
        <ListCell title="网络运营商" value="中国电信" />
        <ListCell title="网络类型" value="5G NR" />
        <ListCell title="信号强度" value="-88 dBm 48 asu" />
        <ListCell title="服务状态" value="使用中" />
        <ListCell title="漫游状态" value="未漫游" />
        <ListCell title="SIM 卡槽 2" value="未安装" last />
      </div>

      <!-- 分组 2: 国际移动设备识别码 -->
      <div class="group-header">IMEI 与标识</div>
      <div class="settings-card">
        <ListCell
          title="IMEI (卡槽 1)"
          :value="deviceStore.imei1"
          clickable
          @click="copyText('IMEI 1', deviceStore.imei1)"
        />
        <ListCell
          title="IMEI (卡槽 2)"
          :value="deviceStore.imei2"
          clickable
          @click="copyText('IMEI 2', deviceStore.imei2)"
        />
        <ListCell
          title="IMEI SV"
          :value="deviceStore.imeiSv"
        />
        <ListCell
          title="序列号"
          :value="deviceStore.serialNumber"
          last
          clickable
          @click="copyText('序列号', deviceStore.serialNumber)"
        />
      </div>

      <!-- 分组 3: 网络与运行状态 -->
      <div class="group-header">设备状态</div>
      <div class="settings-card">
        <ListCell
          title="IP 地址"
          :value="deviceStore.ipAddress"
          clickable
          @click="copyText('IP 地址', deviceStore.ipAddress)"
        />
        <ListCell
          title="WLAN MAC 地址"
          :value="deviceStore.wlanMac"
          clickable
          @click="copyText('WLAN MAC', deviceStore.wlanMac)"
        />
        <ListCell
          title="蓝牙地址"
          :value="deviceStore.bluetoothAddress"
          clickable
          @click="copyText('蓝牙地址', deviceStore.bluetoothAddress)"
        />
        <ListCell
          title="电池状态"
          value="充电中 (88%)"
        />
        <ListCell
          title="开机运行时间"
          value="124 小时 36 分钟"
          last
        />
      </div>

      <div class="scroll-bottom-spacer"></div>
    </div>

    <!-- 浮层轻提示 -->
    <Transition name="toast-fade">
      <div v-if="toastText" class="feedback-toast">
        {{ toastText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.status-info-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.sub-nav-bar {
  position: sticky;
  top: 0;
  width: 100%;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  display: flex;
  align-items: center;
  background: #F4F5F7;
  z-index: 10;
  box-sizing: border-box;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #EAECEF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
  transition: background 0.15s ease, transform 0.1s ease;
}

.nav-round-btn:active {
  background: #DFE2E6;
  transform: scale(0.96);
}

.nav-title {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  letter-spacing: -0.3px;
  margin-left: 14px;
}

.sub-scroll-body {
  flex: 1;
  padding: 12px 16px 32px 16px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 20px;
  margin-bottom: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.group-header {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 0 8px 12px;
}

.scroll-bottom-spacer {
  height: 48px;
}

.status-info-page :deep(.lc-right) {
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}

.status-info-page :deep(.lc-value) {
  font-size: 13.5px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* 浮动轻提示 */
.feedback-toast {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 32, 0.92);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 100;
  white-space: nowrap;
  pointer-events: none;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
