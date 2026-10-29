<script setup>
import { ref } from 'vue'
import { useNetworkStore } from '../../../stores/networkStore'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import SettingsSystemIcon from '../../ui/SettingsSystemIcon.vue'

const emit = defineEmits(['back'])

const network = useNetworkStore()

// 配对设备列表（融合参考规范与实机扫描设备）
const pairedDevicesList = ref([
  { id: 'enco-x3', name: 'OPPO Enco X3', type: 'headphone', connected: true, battery: '85%' },
  { id: 'earcase', name: 'EarCase', type: 'headphone', connected: false },
  { id: 'matepad', name: 'MatePad Air', type: 'tablet', connected: false },
  { id: 'pova', name: "Ian's TECNO POVA 8 Pro 5", type: 'phone', connected: false },
  { id: 'tcl', name: 'TCL 55D8-C4CF', type: 'tv', connected: false }
])

const btMacAddress = ref('22:22:18:AC:40:7C')
const deviceName = ref('Infinix NOTE 60 Pro')

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

// 设备重命名弹窗
const showRenameModal = ref(false)
const renameInput = ref(network.deviceName)

function openRename() {
  renameInput.value = network.deviceName
  showRenameModal.value = true
}

function submitRename() {
  network.setDeviceName(renameInput.value)
  showRenameModal.value = false
  showToast('已更新设备名称')
}

// 设备详情弹窗
const showDevDetailModal = ref(false)
const targetDev = ref(null)

function openDevDetail(dev) {
  targetDev.value = dev
  showDevDetailModal.value = true
}

function handleToggleConnectDev(dev) {
  if (dev.connected) {
    network.disconnectBluetoothDevice(dev.id)
    showToast(`已断开连接 ${dev.name}`)
  } else {
    network.connectBluetoothDevice(dev.id)
    showToast(`正在连接 ${dev.name}...`)
  }
}

function handleUnpairDev(dev) {
  network.unpairBluetoothDevice(dev.id)
  showDevDetailModal.value = false
  showToast(`已取消配对 ${dev.name}`)
}

function connectAvailable(dev) {
  showToast(`正在与 ${dev.name} 配对...`)
  setTimeout(() => {
    network.pairedDevices.push({
      id: dev.id,
      name: dev.name,
      type: dev.type,
      connected: true,
      battery: '100%'
    })
    network.availableBtDevices = network.availableBtDevices.filter(d => d.id !== dev.id)
    showToast(`已成功配对并连接 ${dev.name}`)
  }, 1200)
}

function back() {
  if (showRenameModal.value) {
    showRenameModal.value = false
    return true
  }
  if (showDevDetailModal.value) {
    showDevDetailModal.value = false
    return true
  }
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
        <div class="bt-feature-desc">连接附近的蓝牙设备，并管理连接偏好设置。</div>

        <div class="card-inner-divider"></div>

        <!-- 设备名称与开关 -->
        <div class="card-inner-cells">
          <ListCell
            title="设备名称"
            :value="network.deviceName"
            chevron
            clickable
            @click="openRename"
          />
          <ListCell
            title="蓝牙"
            last
          >
            <template #right>
              <ToggleSwitch
                :model-value="network.bluetoothEnabled"
                @update:model-value="v => network.setBluetooth(v)"
                @change="showToast(network.bluetoothEnabled ? '已开启蓝牙' : '已关闭蓝牙')"
              />
            </template>
          </ListCell>
        </div>
      </div>

      <template v-if="network.bluetoothEnabled">
        <!-- 配对新设备入口 -->
        <div class="settings-card">
          <div class="pair-new-cell" @click="showToast('正在搜索附近的蓝牙设备...')">
            <div class="pair-icon-col">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div class="pair-title">配对新设备</div>
            <div class="cell-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- 分组 1: 已配对设备 -->
        <div class="group-label">已配对设备</div>
        <div class="settings-card">
          <div
            v-for="(dev, idx) in pairedDevicesList"
            :key="dev.id"
            class="paired-cell-row"
            :class="{ 'no-sep': idx === pairedDevicesList.length - 1 }"
          >
            <!-- 设备图标 -->
            <div class="dev-type-icon">
              <!-- 耳机 -->
              <svg v-if="dev.type === 'headphone'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              <!-- 平板 -->
              <svg v-else-if="dev.type === 'tablet'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <!-- 手机 -->
              <svg v-else-if="dev.type === 'phone'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
              <!-- 电视 -->
              <svg v-else-if="dev.type === 'tv'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
                <polyline points="17 2 12 7 7 2"/>
              </svg>
              <!-- 通用蓝牙 -->
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>
              </svg>
            </div>

            <div class="dev-info-col" @click="handleToggleConnectDev(dev)">
              <div class="dev-name-text" :class="{ 'connected-name': dev.connected }">{{ dev.name }}</div>
              <div class="dev-status-sub">{{ dev.connected ? `已连接${dev.battery ? ' · 电量 ' + dev.battery : ''}` : '未连接' }}</div>
            </div>

            <div class="dev-gear-btn" @click.stop="openDevDetail(dev)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 蓝牙硬件地址卡片 -->
        <div class="settings-card">
          <ListCell
            title="蓝牙地址"
            :value="btMacAddress"
            last
            clickable
            @click="showToast(`本机蓝牙 MAC 地址：${btMacAddress}`)"
          />
        </div>

        <!-- 分组 2: 可用设备 -->
        <div v-if="network.availableBtDevices.length" class="group-header-with-loader">
          <div class="group-label-inline">可用设备</div>
          <div class="scanning-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>

        <div v-if="network.availableBtDevices.length" class="settings-card">
          <div
            v-for="(dev, idx) in network.availableBtDevices"
            :key="dev.id"
            class="available-cell-row"
            :class="{ 'no-sep': idx === network.availableBtDevices.length - 1 }"
            @click="connectAvailable(dev)"
          >
            <div class="dev-type-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>
              </svg>
            </div>
            <div class="dev-info-col">
              <div class="dev-name-text">{{ dev.name }}</div>
            </div>
            <div class="cell-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
      </template>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 弹窗 1: 重命名设备 -->
    <div v-if="showRenameModal" class="modal-backdrop" @click.self="showRenameModal = false">
      <div class="modal-dialog">
        <div class="modal-dialog-title">重命名设备</div>
        <input v-model="renameInput" type="text" class="modal-text-input" placeholder="输入设备名称" />
        <div class="modal-dialog-buttons">
          <button class="dialog-cancel-btn" @click="showRenameModal = false">取消</button>
          <button class="dialog-submit-btn" @click="submitRename">保存</button>
        </div>
      </div>
    </div>

    <!-- 弹窗 2: 设备详情 -->
    <div v-if="showDevDetailModal && targetDev" class="modal-backdrop" @click.self="showDevDetailModal = false">
      <div class="modal-sheet">
        <div class="sheet-title">{{ targetDev.name }}</div>
        <div class="dev-detail-actions">
          <button
            class="action-row-btn"
            @click="handleToggleConnectDev(targetDev)"
          >
            {{ targetDev.connected ? '断开连接' : '连接此设备' }}
          </button>
          <button
            class="action-row-btn text-danger"
            @click="handleUnpairDev(targetDev)"
          >
            取消配对
          </button>
        </div>
        <button class="sheet-cancel-btn" @click="showDevDetailModal = false">关闭</button>
      </div>
    </div>

    <!-- 轻提示 (Toast) -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-bluetooth-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  z-index: 20;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.bt-nav-bar {
  position: sticky;
  top: 0;
  width: 100%;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.bt-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: none;
}

.bt-scroll-body::-webkit-scrollbar {
  display: none;
}

.bt-feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px 0;
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.04);
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
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.22);
}

.bt-feature-title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin-bottom: 6px;
}

.bt-feature-desc {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.45;
  max-width: 290px;
  margin-bottom: 16px;
}

.card-inner-divider {
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
}

.card-inner-cells {
  width: 100%;
  text-align: left;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.pair-new-cell {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.pair-new-cell:active {
  background: #F4F5F7;
}

.pair-icon-col {
  width: 32px;
  display: flex;
  align-items: center;
}

.pair-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #007AFF;
}

.group-label {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  padding-left: 8px;
  margin-top: 4px;
}

.group-header-with-loader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 0;
}

.group-label-inline {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
}

.scanning-dots {
  display: flex;
  gap: 4px;
}

.scanning-dots .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #8E8E93;
  animation: pulse-dot 1.2s infinite ease-in-out;
}

.scanning-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.scanning-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse-dot {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1.1); }
}

.paired-cell-row,
.available-cell-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: background 0.15s;
}

.paired-cell-row:active,
.available-cell-row:active {
  background: #F4F5F7;
}

.paired-cell-row.no-sep,
.available-cell-row.no-sep {
  border-bottom: none;
}

.dev-type-icon {
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
}

.dev-info-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dev-name-text {
  font-size: 16px;
  font-weight: 500;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.connected-name {
  color: #007AFF;
  font-weight: 600;
}

.dev-status-sub {
  font-size: 12px;
  color: #8E8E93;
}

.dev-gear-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s;
}

.dev-gear-btn:active {
  background: rgba(0, 0, 0, 0.06);
}

.cell-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-spacer {
  height: 24px;
}

/* 弹窗样式 */
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-dialog {
  width: 86%;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.15);
  animation: pop-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-sheet {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: #FFFFFF;
  border-radius: 24px 24px 0 0;
  padding: 20px 16px 36px;
  box-sizing: border-box;
  animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes pop-in {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-dialog-title,
.sheet-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 16px;
}

.modal-text-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #F4F5F7;
  font-size: 15px;
  color: #111;
  box-sizing: border-box;
  outline: none;
  margin-bottom: 16px;
}

.modal-text-input:focus {
  border-color: #007AFF;
  background: #FFF;
}

.modal-dialog-buttons {
  display: flex;
  gap: 10px;
  width: 100%;
}

.dialog-cancel-btn,
.sheet-cancel-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background: #F4F5F7;
  color: #8E8E93;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.dialog-submit-btn {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  background: #007AFF;
  color: #FFF;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.dev-detail-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.action-row-btn {
  width: 100%;
  padding: 14px;
  background: #F4F5F7;
  color: #111;
  font-size: 15px;
  font-weight: 600;
  border-radius: 14px;
  border: none;
  cursor: pointer;
}

.action-row-btn.text-danger {
  color: #FF3B30;
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
