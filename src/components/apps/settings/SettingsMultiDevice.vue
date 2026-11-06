<script setup>
import GlassNavBar from '../../ui/GlassNavBar.vue'
import { ref } from 'vue'
import { useNetworkStore } from '../../../stores/networkStore'
import { useSystemStore } from '../../../stores/systemStore'
import { useSubPageNav } from '../../../composables/useSubPageNav'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import SettingsSystemIcon from '../../ui/SettingsSystemIcon.vue'

const emit = defineEmits(['back', 'open-hotspot', 'open-nfc'])

const network = useNetworkStore()
const system = useSystemStore()

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

// 极速互传状态
const quickShareEnabled = ref(false)
const quickShareOpenAfter = ref(true)

// 模态弹窗状态
const showUsbModal = ref(false)
const usbModes = ['文件传输 / Android Auto', 'USB 网络共享', 'MIDI', '仅充电']

const showDnsModal = ref(false)
const dnsOptions = [
  { id: 'off', label: '关闭' },
  { id: 'auto', label: '自动' },
  { id: 'hostname', label: '专用 DNS 提供商主机名' }
]
const tempDnsMode = ref(network.privateDnsMode)
const tempDnsHost = ref(network.privateDnsHostname)

const showVpnModal = ref(false)

function selectUsbMode(mode) {
  network.usbConnectionMode = mode
  showUsbModal.value = false
  showToast(`已切换 USB 用途为：${mode}`)
}

function openDnsModal() {
  tempDnsMode.value = network.privateDnsMode
  tempDnsHost.value = network.privateDnsHostname
  showDnsModal.value = true
}

function saveDns() {
  network.setPrivateDns(tempDnsMode.value, tempDnsHost.value)
  showDnsModal.value = false
  showToast('已更新专用 DNS 设置')
}

function back() {
  if (showUsbModal.value) {
    showUsbModal.value = false
    return true
  }
  if (showDnsModal.value) {
    showDnsModal.value = false
    return true
  }
  if (showVpnModal.value) {
    showVpnModal.value = false
    return true
  }
  if (closeSubView()) {
    return true
  }
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-multi-device-page">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- ================= 1. 全屏三级页：极速互传 ================= -->
      <div v-if="activeSubView === 'quickShare'" key="quickShare" class="subpage-view-pane">
        <GlassNavBar overlay title="极速互传" @back="closeSubView" />

      <div style="padding-top: var(--nav-h)" class="md-scroll-body scrollable">
        <!-- 头部碰一碰传输插画 (实机 1:1) -->
        <div class="graphic-hero-card">
          <div class="two-phones-illustration">
            <div class="phone-back-silhouette"></div>
            <div class="phone-front-silhouette">
              <div class="phone-punch-hole"></div>
            </div>
          </div>
          <div class="carousel-dots">
            <span class="c-dot active"></span>
            <span class="c-dot"></span>
            <span class="c-dot"></span>
            <span class="c-dot"></span>
          </div>
          <div class="graphic-hero-desc">
            分享时，靠近背部 NFC 区域（开启 NFC ，iPhone需开启蓝牙）
            <span class="desc-link" @click="showToast('背部右上角为 NFC 感应天线区域')">查看 NFC 区域</span>
          </div>
        </div>

        <!-- 极速互传 (10分钟) 主卡片 -->
        <div class="settings-card">
          <ListCell
            title="极速互传（10 分钟）"
            subtitle="开启后支持此功能的手机、iPhone、平板、PC 可向你发送文件。无操作 10 分钟后自动关闭。"
            last
          >
            <template #right>
              <ToggleSwitch
                v-model="quickShareEnabled"
                @change="showToast(quickShareEnabled ? '已开启极速互传广播（10分钟）' : '已关闭极速互传')"
              />
            </template>
          </ListCell>
        </div>

        <!-- 完成后打开文件 -->
        <div class="settings-card">
          <ListCell title="完成后打开文件" last>
            <template #right>
              <ToggleSwitch v-model="quickShareOpenAfter" @change="showToast('已更新文件打开设置')" />
            </template>
          </ListCell>
        </div>

        <!-- 指南入口 -->
        <div class="settings-card">
          <ListCell
            title="如何传输"
            chevron
            clickable
            @click="showToast('传输指南：靠近背部碰一碰或在分享面板中选择极速互传')"
          />
          <ListCell
            title="如何与 iPhone 互传"
            chevron
            last
            clickable
            @click="showToast('iPhone 互传：在 iPhone 上安装并打开传音互联应用即可接收')"
          />
        </div>

        <div class="bottom-spacer"></div>
      </div>
    </div>

    <!-- ================= 2. 全屏三级页：投屏 ================= -->
    <div v-else-if="activeSubView === 'cast'" key="cast" class="subpage-view-pane">
      <GlassNavBar overlay title="投屏" @back="closeSubView" />

      <div style="padding-top: var(--nav-h)" class="md-scroll-body scrollable">
        <div class="settings-card">
          <ListCell title="投屏" last>
            <template #right>
              <ToggleSwitch
                :model-value="network.castEnabled"
                @update:model-value="v => network.castEnabled = v"
                @change="showToast(network.castEnabled ? '正在搜索可用投屏设备...' : '已关闭投屏')"
              />
            </template>
          </ListCell>
        </div>

        <!-- 飞碟/空状态插画 (实机 1:1) -->
        <div class="cast-empty-hero">
          <div class="cast-ufo-wrap">
            <svg width="88" height="88" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C7 2 3 5 3 8c0 1.5 1 2.8 2.8 3.8L5 16l4-2c1 .3 2 .5 3 .5s2-.2 3-.5l4 2-.8-4.2C20 10.8 21 9.5 21 8c0-3-4-6-9-6z" fill="#D1D5DB" fill-opacity="0.6"/>
              <ellipse cx="12" cy="8" rx="5" ry="2" fill="#9CA3AF"/>
              <circle cx="12" cy="14" r="1.5" fill="#FFFFFF"/>
            </svg>
          </div>
          <div class="cast-empty-title">未在附近找到设备。</div>
        </div>

        <div class="bottom-spacer"></div>
      </div>
    </div>

    <!-- ================= 3. 多设备连接主页 ================= -->
    <div v-else key="main" class="subpage-view-pane">
      <GlassNavBar overlay title="多设备连接" @back="emit('back')" />

      <!-- 滚动主体内容 -->
      <div style="padding-top: var(--nav-h)" class="md-scroll-body scrollable">
        <!-- 分组 1: 常用网络与端口连接 -->
        <div class="settings-card">
          <ListCell
            title="个人热点"
            :value="network.hotspotEnabled ? '已开启' : '已关闭'"
            chevron
            clickable
            @click="emit('open-hotspot')"
          />
          <ListCell
            title="NFC"
            :value="network.nfcEnabled ? '已开启' : '已关闭'"
            chevron
            clickable
            @click="emit('open-nfc')"
          />
          <ListCell
            title="USB"
            :value="network.usbConnectionMode"
            chevron
            clickable
            @click="showUsbModal = true"
          />
          <ListCell
            title="VPN"
            value="无"
            chevron
            clickable
            @click="showVpnModal = true"
          />
          <ListCell
            title="专用 DNS"
            :value="network.privateDnsMode === 'auto' ? '自动' : (network.privateDnsMode === 'off' ? '关闭' : '自定主机')"
            chevron
            last
            clickable
            @click="openDnsModal"
          />
        </div>

        <!-- 分组 2: 多设备互联 -->
        <div class="group-label">多设备互联</div>
        <div class="settings-card">
          <ListCell
            title="多屏互联"
            subtitle="手机、平板、PC 之间的投屏与屏幕扩展、数据共享等。"
            chevron
            clickable
            @click="system.openApp('oneleap')"
          />
          <ListCell
            title="联系方式一碰传"
            subtitle="碰一碰分享手机号、WhatsApp、Instagram等联系方式，快捷添加。"
            chevron
            clickable
            @click="showToast('联系方式一碰传：请将手机顶部靠近另一台手机')"
          />
          <ListCell
            title="极速互传"
            subtitle="免流量互传。手机之间可互传文件、WLAN、应用。与 iPhone、平板、PC 可互传文件。"
            chevron
            last
            clickable
            @click="openSubView('quickShare')"
          />
        </div>

        <!-- 分组 3: 其他连接方式 -->
        <div class="group-label">其他连接方式</div>
        <div class="settings-card">
          <ListCell
            title="投屏"
            :value="network.castEnabled ? '已开启' : '已关闭'"
            chevron
            clickable
            @click="openSubView('cast')"
          />
          <ListCell
            title="打印"
            chevron
            clickable
            @click="showToast('默认打印服务就绪，0 个打印作业')"
          />
          <ListCell
            title="跨设备服务"
            subtitle="通话投放、网络共享"
            chevron
            clickable
            @click="showToast('跨设备服务：同账号设备已就绪')"
          />
          <ListCell
            title="Chromebook"
            subtitle="您的手机未连接到 Chromebook"
            chevron
            clickable
            @click="showToast('设置连接以在 Chromebook 上同步短信和热点')"
          />
          <ListCell
            title="快速分享"
            subtitle="与附近的设备分享文件"
            chevron
            clickable
            @click="showToast('快速分享：设备对所有人可见 10 分钟')"
          />
          <ListCell
            title="Android Auto"
            subtitle="在车载显示屏上使用应用"
            chevron
            last
            clickable
            @click="showToast('请将手机连接至车载 USB 接口或支持无线连接的车载系统')"
          />
        </div>

        <div class="bottom-spacer"></div>
      </div>
    </div>
  </Transition>

    <!-- 弹窗 1: USB 用途选择 -->
    <div v-if="showUsbModal" class="modal-backdrop" @click.self="showUsbModal = false">
      <div class="modal-sheet">
        <div class="sheet-title">USB 用途</div>
        <div class="options-list">
          <div
            v-for="mode in usbModes"
            :key="mode"
            class="option-item"
            :class="{ active: network.usbConnectionMode === mode }"
            @click="selectUsbMode(mode)"
          >
            <span class="option-name">{{ mode }}</span>
            <svg v-if="network.usbConnectionMode === mode" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <button class="sheet-cancel-btn" @click="showUsbModal = false">取消</button>
      </div>
    </div>

    <!-- 弹窗 2: 专用 DNS 选择 -->
    <div v-if="showDnsModal" class="modal-backdrop" @click.self="showDnsModal = false">
      <div class="modal-sheet">
        <div class="sheet-title">专用 DNS</div>
        <div class="options-list">
          <div
            v-for="item in dnsOptions"
            :key="item.id"
            class="option-item"
            :class="{ active: tempDnsMode === item.id }"
            @click="tempDnsMode = item.id"
          >
            <span class="option-name">{{ item.label }}</span>
            <svg v-if="tempDnsMode === item.id" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <div v-if="tempDnsMode === 'hostname'" class="dns-input-wrap">
          <input
            v-model="tempDnsHost"
            type="text"
            class="dns-text-input"
            placeholder="例如 dns.google 或 1dot1dot1dot1.cloudflare-dns.com"
          />
        </div>
        <div class="modal-dialog-buttons">
          <button class="sheet-cancel-btn" @click="showDnsModal = false">取消</button>
          <button class="sheet-confirm-btn" @click="saveDns">确定</button>
        </div>
      </div>
    </div>

    <!-- 弹窗 3: VPN 提示 -->
    <div v-if="showVpnModal" class="modal-backdrop" @click.self="showVpnModal = false">
      <div class="modal-dialog">
        <div class="modal-dialog-title">VPN</div>
        <div class="modal-dialog-message">当前系统未配置 VPN 连接配置文件。您可点击下方按钮添加自定 L2TP/IPSec 或 IKEv2 虚拟专用网。</div>
        <div class="modal-dialog-buttons">
          <button class="dialog-cancel-btn" @click="showVpnModal = false">取消</button>
          <button class="dialog-submit-btn" @click="showVpnModal = false; showToast('已发起添加 VPN 凭据引导')">添加</button>
        </div>
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

.settings-multi-device-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  z-index: 20;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.md-nav-bar {
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

.md-scroll-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 16px 36px;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.md-scroll-body::-webkit-scrollbar {
  display: none;
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

.sheet-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 16px;
}

.modal-dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin-bottom: 8px;
}

.modal-dialog-message {
  font-size: 14px;
  color: #636366;
  line-height: 1.5;
  margin-bottom: 20px;
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

.dns-input-wrap {
  margin-bottom: 16px;
}

.dns-text-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #F4F5F7;
  font-size: 14px;
  color: #111;
  box-sizing: border-box;
  outline: none;
}

.dns-text-input:focus {
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

.dialog-submit-btn,
.sheet-confirm-btn {
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

.cast-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.cast-search-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px 24px;
  text-align: center;
}

.cast-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(0, 122, 255, 0.15);
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin-bottom: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cast-status-text {
  font-size: 15px;
  font-weight: 600;
  color: #111;
  margin-bottom: 6px;
}

.cast-subtext {
  font-size: 12px;
  color: #8E8E93;
  line-height: 1.4;
  max-width: 260px;
}

/* 极速互传与投屏插画与全屏二级页样式 (1:1 还原真机) */
.graphic-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px 12px;
}

.two-phones-illustration {
  position: relative;
  width: 140px;
  height: 180px;
  margin-bottom: 20px;
}

.phone-back-silhouette {
  position: absolute;
  top: 0;
  left: 10px;
  width: 95px;
  height: 170px;
  background: #9CA3AF;
  border-radius: 20px;
  border: 3px solid #6B7280;
}

.phone-front-silhouette {
  position: absolute;
  top: 15px;
  right: 5px;
  width: 95px;
  height: 170px;
  background: #E5E7EB;
  border-radius: 20px;
  border: 3px solid #9CA3AF;
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.phone-punch-hole {
  width: 8px;
  height: 8px;
  background: #6B7280;
  border-radius: 50%;
}

.carousel-dots {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.c-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #D1D5DB;
}

.c-dot.active {
  background: #374151;
}

.graphic-hero-desc {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
  max-width: 300px;
}

.desc-link {
  color: #007AFF;
  cursor: pointer;
  margin-left: 4px;
}

.cast-empty-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 100px 16px 0;
}

.cast-ufo-wrap {
  margin-bottom: 24px;
}

.cast-empty-title {
  font-size: 16px;
  color: #8E8E93;
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
