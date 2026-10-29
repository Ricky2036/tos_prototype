<script setup>
import { ref } from 'vue'
import { useNetworkStore } from '../../../stores/networkStore'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import SettingsSystemIcon from '../../ui/SettingsSystemIcon.vue'

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

// 热点配置编辑弹窗
const showConfigModal = ref(false)
const editHotspotName = ref(network.hotspotName)
const editHotspotPassword = ref(network.hotspotPassword)

function openConfigModal() {
  editHotspotName.value = network.hotspotName
  editHotspotPassword.value = network.hotspotPassword
  showConfigModal.value = true
}

function saveHotspotConfig() {
  if (!editHotspotName.value.trim()) {
    showToast('热点名称不能为空')
    return
  }
  if (editHotspotPassword.value.length < 8) {
    showToast('密码长度至少需要 8 位')
    return
  }
  network.updateHotspotConfig({
    name: editHotspotName.value.trim(),
    password: editHotspotPassword.value
  })
  showToast('热点配置已更新')
  showConfigModal.value = false
}

// 自动关闭选项弹窗
const showAutoOffModal = ref(false)
const autoOffOptions = ['始终保持开启', '5 分钟无连接后关闭', '10 分钟无连接后关闭', 'AI 智能关闭']

function selectAutoOff(opt) {
  network.updateHotspotConfig({ autoOff: opt })
  showAutoOffModal.value = false
  showToast(`已设置为：${opt}`)
}

function back() {
  if (showConfigModal.value) {
    showConfigModal.value = false
    return true
  }
  if (showAutoOffModal.value) {
    showAutoOffModal.value = false
    return true
  }
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-hotspot-page">
    <!-- 顶部导航栏 -->
    <div class="hotspot-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">个人热点</div>
    </div>

    <!-- 滚动主体内容 -->
    <div class="hotspot-scroll-body scrollable">
      <!-- 头部特性大卡片 -->
      <div class="hotspot-feature-card">
        <div class="hotspot-feature-icon-wrap">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <circle cx="12" cy="18" r="2" fill="#FFFFFF"/>
          </svg>
        </div>
        <div class="hotspot-feature-title">便携式热点</div>
        <div class="hotspot-feature-desc">将手机的移动网络通过无线局域网共享给附近的其他设备使用。</div>
      </div>

      <!-- 热点开关卡片 -->
      <div class="settings-card">
        <ListCell title="个人热点" last>
          <template #right>
            <ToggleSwitch
              :model-value="network.hotspotEnabled"
              @update:model-value="v => network.setHotspot(v)"
              @change="showToast(network.hotspotEnabled ? '已开启个人热点' : '已关闭个人热点')"
            />
          </template>
        </ListCell>
      </div>

      <!-- 分组 1: 热点配置 -->
      <div class="group-label">热点配置</div>
      <div class="settings-card">
        <ListCell
          title="热点配置"
          :value="network.hotspotName"
          :subtitle="'密码：' + network.hotspotPassword"
          chevron
          clickable
          @click="openConfigModal"
        />
        <ListCell
          title="连接管理"
          :value="`${network.connectedClients.length} 台设备连接`"
          chevron
          clickable
          @click="showToast(`当前连接 ${network.connectedClients.length} 台设备，黑名单 0 台`)"
        />
        <ListCell
          title="自动关闭热点"
          subtitle="一定时间内无设备或网络连接，自动关闭热点。"
          :value="network.hotspotAutoOff"
          chevron
          clickable
          @click="showAutoOffModal = true"
        />
        <ListCell
          title="使用 WLAN 6协议"
          subtitle="能够提升连接速度，老旧设备可能无法找到 WLAN 6协议的热点。"
          last
        >
          <template #right>
            <ToggleSwitch
              v-model="network.hotspotWlan6"
              @change="showToast(network.hotspotWlan6 ? '已启用 WLAN 6 高速协议' : '已切换为兼容模式')"
            />
          </template>
        </ListCell>
      </div>

      <!-- 分组 2: 网络共享 -->
      <div class="group-label">网络共享</div>
      <div class="settings-card">
        <ListCell title="USB网络共享">
          <template #right>
            <ToggleSwitch
              v-model="network.usbSharing"
              @change="showToast(network.usbSharing ? '已通过 USB 共享网络' : '已关闭 USB 网络共享')"
            />
          </template>
        </ListCell>
        <ListCell title="蓝牙网络共享" last>
          <template #right>
            <ToggleSwitch
              v-model="network.bluetoothSharing"
              @change="showToast(network.bluetoothSharing ? '已通过蓝牙共享网络' : '已关闭蓝牙网络共享')"
            />
          </template>
        </ListCell>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 热点配置编辑弹窗 -->
    <div v-if="showConfigModal" class="modal-backdrop" @click.self="showConfigModal = false">
      <div class="modal-dialog">
        <div class="modal-dialog-title">热点配置</div>
        <div class="modal-input-group">
          <label class="input-label">网络名称</label>
          <input v-model="editHotspotName" type="text" class="modal-text-input" placeholder="输入热点名称" />
        </div>
        <div class="modal-input-group">
          <label class="input-label">安全性</label>
          <div class="readonly-badge">WPA2/WPA3 个人级</div>
        </div>
        <div class="modal-input-group">
          <label class="input-label">热点密码</label>
          <input v-model="editHotspotPassword" type="text" class="modal-text-input" placeholder="至少 8 位密码" />
        </div>
        <div class="modal-dialog-buttons">
          <button class="dialog-cancel-btn" @click="showConfigModal = false">取消</button>
          <button class="dialog-submit-btn" @click="saveHotspotConfig">保存</button>
        </div>
      </div>
    </div>

    <!-- 自动关闭热点选择弹窗 -->
    <div v-if="showAutoOffModal" class="modal-backdrop" @click.self="showAutoOffModal = false">
      <div class="modal-sheet">
        <div class="sheet-title">自动关闭热点</div>
        <div class="options-list">
          <div
            v-for="opt in autoOffOptions"
            :key="opt"
            class="option-item"
            :class="{ active: network.hotspotAutoOff === opt }"
            @click="selectAutoOff(opt)"
          >
            <span class="option-name">{{ opt }}</span>
            <svg v-if="network.hotspotAutoOff === opt" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <button class="sheet-cancel-btn" @click="showAutoOffModal = false">取消</button>
      </div>
    </div>

    <!-- 轻提示 (Toast) -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-hotspot-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  z-index: 25;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.hotspot-nav-bar {
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

.hotspot-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: none;
}

.hotspot-scroll-body::-webkit-scrollbar {
  display: none;
}

.hotspot-feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px 12px;
}

.hotspot-feature-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: #FF9500;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(255, 149, 0, 0.22);
}

.hotspot-feature-title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin-bottom: 6px;
}

.hotspot-feature-desc {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.45;
  max-width: 290px;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.group-label {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  padding-left: 8px;
  margin-top: 4px;
}

.bottom-spacer {
  height: 24px;
}

/* 模态弹窗样式 */
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

.modal-dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin-bottom: 16px;
}

.modal-input-group {
  width: 100%;
  text-align: left;
  margin-bottom: 14px;
}

.input-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #8E8E93;
  margin-bottom: 6px;
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
}

.modal-text-input:focus {
  border-color: #007AFF;
  background: #FFF;
}

.readonly-badge {
  padding: 10px 14px;
  border-radius: 12px;
  background: #F4F5F7;
  font-size: 14px;
  color: #636366;
}

.modal-dialog-buttons {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}

.dialog-cancel-btn {
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

.sheet-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 16px;
}

.options-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.option-item:active {
  background: #F4F5F7;
}

.option-name {
  font-size: 15px;
  color: #111;
}

.option-item.active .option-name {
  color: #007AFF;
  font-weight: 600;
}

.sheet-cancel-btn {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  background: #F4F5F7;
  color: #111;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
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
