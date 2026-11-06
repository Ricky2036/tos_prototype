<script setup>
import { ref } from 'vue'
import { useNetworkStore } from '../../../stores/networkStore'
import { useSubPageNav } from '../../../composables/useSubPageNav'
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

// 视图层级管理与动画规范
const { activeSubView, isBack, openSubView, closeSubView } = useSubPageNav('main')

// 热点配置编辑
const editHotspotName = ref(network.hotspotName)
const editHotspotPassword = ref(network.hotspotPassword)
const editHotspotHidden = ref(false)

function openConfigModal() {
  editHotspotName.value = network.hotspotName
  editHotspotPassword.value = network.hotspotPassword
  openSubView('config')
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
  closeSubView()
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
  if (closeSubView()) {
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
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- ================= 1. 全屏三级页：WLAN热点设置 (实机 1:1) ================= -->
      <div v-if="activeSubView === 'config'" key="config" class="subpage-view-pane">
        <div class="hotspot-nav-bar">
          <button class="nav-round-btn" aria-label="取消" @click="closeSubView">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div class="nav-title">WLAN热点设置</div>
          <button class="nav-round-btn confirm-btn" aria-label="保存" @click="saveHotspotConfig">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        </div>

      <div class="hotspot-scroll-body scrollable">
        <div class="group-label">名称</div>
        <div class="settings-card input-card">
          <div class="input-row">
            <input
              v-model="editHotspotName"
              type="text"
              class="card-text-input"
              maxlength="32"
              placeholder="热点名称"
            />
            <button v-if="editHotspotName" class="input-clear-btn" @click="editHotspotName = ''">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#8E8E93"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="char-count">{{ editHotspotName.length }}/32</div>
        </div>

        <div class="group-label">密码</div>
        <div class="settings-card input-card">
          <div class="input-row">
            <input
              v-model="editHotspotPassword"
              type="text"
              class="card-text-input"
              placeholder="设置 8 位以上密码"
            />
          </div>
        </div>

        <div class="settings-card">
          <ListCell
            title="安全"
            value="WPA2/WPA3-Personal"
            chevron
            clickable
            @click="showToast('安全性：WPA2/WPA3-Personal (推荐)')"
          />
          <ListCell
            title="隐藏网络"
            subtitle="仅允许通过手动添加网络连接此热点。"
            last
          >
            <template #right>
              <ToggleSwitch
                v-model="editHotspotHidden"
                @change="showToast(editHotspotHidden ? '已开启隐藏网络' : '已关闭隐藏网络')"
              />
            </template>
          </ListCell>
        </div>

        <div class="bottom-spacer"></div>
      </div>
    </div>

    <!-- ================= 2. 个人热点主页 (实机 1:1) ================= -->
    <div v-else key="main" class="subpage-view-pane">
      <div class="hotspot-nav-bar">
        <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="nav-title">个人热点</div>
        <div class="nav-placeholder"></div>
      </div>

      <!-- 滚动主体内容 -->
      <div class="hotspot-scroll-body scrollable">
        <!-- 分组 1: 便携式热点 (实机 1:1，移除假大图标) -->
        <div class="group-label">便携式热点</div>
        <div class="settings-card">
          <ListCell title="个人热点">
            <template #right>
              <ToggleSwitch
                :model-value="network.hotspotEnabled"
                @update:model-value="v => network.setHotspot(v)"
                @change="showToast(network.hotspotEnabled ? '已开启个人热点' : '已关闭个人热点')"
              />
            </template>
          </ListCell>
          <ListCell
            title="热点配置"
            chevron
            clickable
            @click="openConfigModal"
          >
            <template #right>
              <div class="hotspot-config-preview">
                <div class="config-name-text">{{ network.hotspotName }}</div>
                <div class="config-pwd-text">{{ network.hotspotPassword }}</div>
              </div>
            </template>
          </ListCell>
          <ListCell
            title="连接管理"
            chevron
            clickable
            @click="showToast(`连接管理：已连接 ${network.connectedClients.length} 台设备`)"
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
                @change="showToast(network.hotspotWlan6 ? '已启用 WLAN 6 协议' : '已切换为兼容模式')"
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
    </div>
  </Transition>

    <!-- 自动关闭选项弹窗 -->
    <div v-if="showAutoOffModal" class="modal-backdrop" @click.self="showAutoOffModal = false">
      <div class="modal-dialog">
        <div class="modal-dialog-title">自动关闭热点</div>
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
        <button class="dialog-cancel-btn" @click="showAutoOffModal = false">取消</button>
      </div>
    </div>



    <!-- 轻提示 (Toast) -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
@import '../../../styles/layer-transitions.css';

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

.confirm-btn {
  background: rgba(0, 122, 255, 0.08);
  color: #007AFF;
}

.confirm-btn:active {
  background: rgba(0, 122, 255, 0.16);
}

.input-card {
  padding: 16px 20px;
}

.input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-text-input {
  border: none;
  outline: none;
  font-size: 17px;
  font-weight: 500;
  color: #111;
  width: 100%;
  background: transparent;
}

.card-text-input::placeholder {
  color: #C7C7CC;
}

.input-clear-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.char-count {
  font-size: 12px;
  color: #8E8E93;
  text-align: right;
  margin-top: 6px;
}

.hotspot-config-preview {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-right: 4px;
}

.config-name-text {
  font-size: 14px;
  font-weight: 500;
  color: #111;
}

.config-pwd-text {
  font-size: 12px;
  color: #8E8E93;
}

.hotspot-scroll-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 16px 36px;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
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
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 14px;
  box-sizing: border-box;
}

.group-label {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  padding-left: 8px;
  margin: 16px 0 8px 0;
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
