<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import SettingsSystemIcon from '../../ui/SettingsSystemIcon.vue'

const emit = defineEmits(['back'])

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

// 蓝牙开关
const bluetoothEnabled = ref(true)

// 已配对设备
const pairedDevices = ref([
  { id: 'enco-x3', name: 'OPPO Enco X3', connected: true, battery: '80%' }
])

// 可用设备
const availableDevices = ref([
  { id: 'soundbar', name: 'Living Room Soundbar', type: 'speaker' },
  { id: 'zerobook', name: 'Infinix ZERO Book', type: 'laptop' }
])

function connectDevice(dev) {
  showToast(`正在连接 ${dev.name}...`)
  setTimeout(() => {
    pairedDevices.value.push({
      id: dev.id,
      name: dev.name,
      connected: true,
      battery: '100%'
    })
    availableDevices.value = availableDevices.value.filter(d => d.id !== dev.id)
    showToast(`已成功连接 ${dev.name}`)
  }, 1000)
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-bluetooth-page">
    <!-- 顶部导航栏 -->
    <div class="bt-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">蓝牙</div>
      <button class="nav-round-btn" aria-label="更多选项" @click="showToast('蓝牙高级设置')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="1.5" fill="#1C1C1E" />
          <circle cx="12" cy="12" r="1.5" fill="#1C1C1E" />
          <circle cx="12" cy="19" r="1.5" fill="#1C1C1E" />
        </svg>
      </button>
    </div>

    <!-- 滚动区域 -->
    <div class="bt-scroll-body scrollable">
      <!-- 头部特性大卡片 -->
      <div class="bt-feature-card">
        <div class="bt-feature-icon-wrap">
          <SettingsSystemIcon name="bluetooth" :size="32" />
        </div>
        <div class="bt-feature-title">蓝牙</div>
        <div class="bt-feature-desc">连接可用配件进行播放音乐、打电话等活动。</div>

        <div class="card-inner-divider"></div>

        <!-- 设备名称与开关 -->
        <div class="card-inner-cells">
          <ListCell
            title="设备名称"
            value="Infinix NOTE 60 Pro"
            chevron
            clickable
            @click="showToast('设备名称：Infinix NOTE 60 Pro')"
          />
          <ListCell
            title="蓝牙"
            last
          >
            <template #right>
              <ToggleSwitch v-model="bluetoothEnabled" @change="showToast(bluetoothEnabled ? '已开启蓝牙' : '已关闭蓝牙')" />
            </template>
          </ListCell>
        </div>
      </div>

      <template v-if="bluetoothEnabled">
        <!-- 分组 1: 已配对的设备 -->
        <div class="group-label">已配对的设备</div>
        <div class="settings-card">
          <div
            v-for="(dev, idx) in pairedDevices"
            :key="dev.id"
            class="paired-cell-row"
            :class="{ 'no-sep': idx === pairedDevices.length - 1 }"
          >
            <div class="dev-type-icon">
              <!-- 耳机图标 -->
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
            <div class="dev-info-col" @click="showToast(`${dev.name}：${dev.connected ? '已连接，电量 ' + dev.battery : '未连接'}`)">
              <div class="dev-name-text">{{ dev.name }}</div>
              <div class="dev-status-sub">{{ dev.connected ? '已连接 · 电量 ' + dev.battery : '未连接' }}</div>
            </div>
            <div class="dev-gear-btn" @click.stop="showToast(`${dev.name} 详情设置`)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 分组 2: 可用设备 -->
        <div class="group-header-with-loader">
          <div class="group-label-inline">可用设备</div>
          <div class="scanning-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>

        <div v-if="availableDevices.length" class="settings-card">
          <div
            v-for="(dev, idx) in availableDevices"
            :key="dev.id"
            class="available-cell-row"
            :class="{ 'no-sep': idx === availableDevices.length - 1 }"
            @click="connectDevice(dev)"
          >
            <div class="dev-type-icon">
              <!-- 音箱或电脑图标 -->
              <svg v-if="dev.type === 'speaker'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <circle cx="12" cy="14" r="4" />
                <line x1="12" y1="6" x2="12.01" y2="6" stroke-width="2.5" />
              </svg>
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <line x1="2" y1="20" x2="22" y2="20" />
              </svg>
            </div>
            <div class="dev-info-col">
              <div class="dev-name-text">{{ dev.name }}</div>
            </div>
          </div>
        </div>
      </template>

      <!-- 蓝牙硬件地址卡片 -->
      <div class="settings-card">
        <ListCell
          title="蓝牙地址"
          value="22:22:18:AC:40:7C"
          last
          clickable
          @click="showToast('已复制蓝牙 MAC 地址')"
        />
      </div>

      <div class="scroll-bottom-spacer"></div>
    </div>

    <!-- 浮层轻提示 (Toast) -->
    <Transition name="toast-fade">
      <div v-if="toastText" class="feedback-toast">
        {{ toastText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-bluetooth-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* 顶部导航栏 */
.bt-nav-bar {
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
  flex: 1;
}

/* 滚动区域 */
.bt-scroll-body {
  flex: 1;
  padding: 12px 16px 32px 16px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

/* 头部特性大卡片 */
.bt-feature-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 26px 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.bt-feature-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
}

.bt-feature-title {
  font-size: 18px;
  font-weight: 600;
  color: #111111;
  margin-bottom: 8px;
}

.bt-feature-desc {
  font-size: 13.5px;
  color: #8E8E93;
  line-height: 1.45;
  text-align: center;
  padding: 0 24px;
  margin-bottom: 20px;
}

.card-inner-divider {
  width: 100%;
  height: 0.5px;
  background: #F0F1F3;
}

.card-inner-cells {
  width: 100%;
}

/* 分组标题与动画指示器 */
.group-label {
  font-size: 13.5px;
  font-weight: 450;
  color: #8E8E93;
  margin-left: 12px;
  margin-bottom: 8px;
}

.group-header-with-loader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-left: 12px;
  margin-right: 12px;
  margin-bottom: 8px;
  margin-top: 14px;
}

.group-label-inline {
  font-size: 13.5px;
  font-weight: 450;
  color: #8E8E93;
}

.scanning-dots {
  display: inline-flex;
  gap: 4px;
}

.scanning-dots .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #8E8E93;
  animation: pulseDot 1.2s infinite ease-in-out;
}

.scanning-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.scanning-dots .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulseDot {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.2); }
}

/* 卡片容器 */
.settings-card {
  background: #FFFFFF;
  border-radius: 20px;
  margin-bottom: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

/* 已配对设备项 */
.paired-cell-row,
.available-cell-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
  background: #FFFFFF;
}

.paired-cell-row.no-sep,
.available-cell-row.no-sep {
  border-bottom: none;
}

.paired-cell-row:active,
.available-cell-row:active {
  background: #F7F7F9;
}

.dev-type-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex: none;
}

.dev-info-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dev-name-text {
  font-size: 15.5px;
  font-weight: 500;
  color: #111111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dev-status-sub {
  font-size: 12.5px;
  color: #34C759;
}

.dev-gear-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  flex: none;
}

.dev-gear-btn:active {
  background: #EAECEF;
}

.scroll-bottom-spacer {
  height: 48px;
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
