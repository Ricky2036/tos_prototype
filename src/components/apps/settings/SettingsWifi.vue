<script setup>
import { ref } from 'vue'
import { useNetworkStore } from '../../../stores/networkStore'
import { useSubPageNav } from '../../../composables/useSubPageNav'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back'])

const network = useNetworkStore()

// 视图层级管理与动画规范
const { activeSubView, isBack, openSubView, closeSubView } = useSubPageNav('main')
const selectedNetwork = ref(null)

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

// 模态弹窗状态
const showQrModal = ref(false)
const showAddModal = ref(false)
const showPasswordModal = ref(false)
const targetConnectingWifi = ref(null)
const wifiPasswordInput = ref('')

const newSsid = ref('')
const newSecurity = ref('WPA3')
const newPassword = ref('')

// 点击网络进入全屏二级详情页
function openDetail(wifiItem) {
  selectedNetwork.value = wifiItem
  openSubView('detail')
}

// 点击二维码分享
function openQrShare(wifiItem) {
  selectedNetwork.value = wifiItem
  showQrModal.value = true
}

// 断开连接
function handleDisconnect(ssid) {
  showToast(`已断开连接 ${ssid}`)
}

// 取消保存 / 忽略网络
function handleForget(ssid) {
  network.forgetWifi(ssid)
  closeSubView()
  showToast(`已取消保存网络 ${ssid}`)
}

// 点击可用网络
function handleConnectAvailable(item) {
  if (item.secure) {
    targetConnectingWifi.value = item
    wifiPasswordInput.value = ''
    showPasswordModal.value = true
  } else {
    network.connectWifi(item.ssid)
    showToast(`已连接到 ${item.ssid}`)
  }
}

// 提交密码连接
function submitPasswordConnect() {
  if (targetConnectingWifi.value) {
    network.connectWifi(targetConnectingWifi.value.ssid, wifiPasswordInput.value)
    showToast(`正在连接 ${targetConnectingWifi.value.ssid}...`)
    showPasswordModal.value = false
    targetConnectingWifi.value = null
  }
}

// 添加自定义网络
function submitAddNetwork() {
  if (!newSsid.value.trim()) {
    showToast('请输入网络名称')
    return
  }
  network.addWifiNetwork({
    ssid: newSsid.value.trim(),
    security: newSecurity.value,
    password: newPassword.value
  })
  showToast(`已添加网络 ${newSsid.value}`)
  showAddModal.value = false
  newSsid.value = ''
  newPassword.value = ''
}

// 扫码功能
function handleScan() {
  showToast('正在启动无线局域网扫码相机...')
}

function back() {
  if (showQrModal.value) {
    showQrModal.value = false
    return true
  }
  if (showPasswordModal.value) {
    showPasswordModal.value = false
    return true
  }
  if (showAddModal.value) {
    showAddModal.value = false
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
  <div class="settings-wifi-page">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- ================= 1. 全屏三级页：网络详情 ================= -->
      <div v-if="activeSubView === 'detail' && selectedNetwork" key="detail" class="subpage-view-pane">
        <div class="wifi-nav-bar">
          <button class="nav-round-btn" aria-label="返回" data-nav-back @click="closeSubView">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="nav-title">网络详情</div>
          <div class="nav-placeholder"></div>
        </div>

      <div class="wifi-scroll-body scrollable">
        <!-- 头部网络居中实体卡片 -->
        <div class="entity-header-box">
          <div class="entity-header-icon-wrap">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
          <div class="entity-header-title">{{ selectedNetwork.ssid }}</div>
          <div class="entity-header-summary">{{ selectedNetwork.status || '已连接' }}</div>

          <!-- 三个实体大操作按钮 -->
          <div class="entity-actions-row">
            <button class="entity-action-btn" @click="handleDisconnect(selectedNetwork.ssid)">
              <div class="entity-btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                  <line x1="12" y1="2" x2="12" y2="12"/>
                </svg>
              </div>
              <span class="entity-btn-text">断开连接</span>
            </button>
            <button class="entity-action-btn" @click="handleForget(selectedNetwork.ssid)">
              <div class="entity-btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </div>
              <span class="entity-btn-text">取消保存</span>
            </button>
            <button class="entity-action-btn" @click="openQrShare(selectedNetwork)">
              <div class="entity-btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <path d="M14 14h3v3h-3zM20 14v6M14 20h3" />
                </svg>
              </div>
              <span class="entity-btn-text">分享</span>
            </button>
          </div>
        </div>

        <!-- 分组 1: 偏好配置 -->
        <div class="settings-card">
          <ListCell
            title="自动连接"
            subtitle="允许在进入此网络的覆盖范围时连接到此网络。"
          >
            <template #right>
              <ToggleSwitch :model-value="true" @change="showToast('已更新自动连接设置')" />
            </template>
          </ListCell>
          <ListCell
            title="修改密码"
            last
            clickable
            @click="showToast('修改此网络密码')"
          />
        </div>

        <!-- 分组 2: 网络详情 -->
        <div class="group-label">网络详情</div>
        <div class="settings-card">
          <ListCell title="信号强度" value="良好" />
          <ListCell title="频率" :value="selectedNetwork.frequency || '5 GHz'" />
          <ListCell title="安全" :value="selectedNetwork.securityType || 'WPA/WPA2-Personal'" />
          <ListCell title="设备 MAC 地址" :value="selectedNetwork.macAddress || 'fc:38:82:e5:32:20'" />
          <ListCell title="IP 地址" :value="selectedNetwork.ipAddress || '10.240.157.153'" />
          <ListCell title="网关" :value="selectedNetwork.gateway || '10.240.157.254'" />
          <ListCell title="子网掩码" :value="selectedNetwork.subnetMask || '255.255.254.0'" />
          <ListCell title="DNS" value="10.250.101.243" />
          <ListCell title="传输链接速度" value="114 Mbps" />
          <ListCell title="接收链接速度" value="81 Mbps" />
          <ListCell title="IPv6 地址" last value="fe80::77:c9f8:99f:3a1d" />
        </div>

        <!-- 分组 3: 网络设置 -->
        <div class="group-label">网络设置</div>
        <div class="settings-card">
          <ListCell title="网络使用情况" value="自动检测" chevron clickable @click="showToast('网络使用情况：自动检测')" />
          <ListCell title="隐私" value="使用设备 MAC" chevron clickable @click="showToast('隐私设置：使用设备 MAC')" />
          <ListCell title="代理" value="无" chevron clickable @click="showToast('代理：无代理')" />
          <ListCell title="IP 设置" last value="DHCP" chevron clickable @click="showToast('IP 设置：DHCP 动态分配')" />
        </div>

        <div class="bottom-spacer"></div>
      </div>
    </div>

    <!-- ================= 2. WLAN 主界面 ================= -->
    <div v-else key="main" class="subpage-view-pane">
      <div class="wifi-nav-bar">
        <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="nav-title">WLAN</div>
        <div class="nav-actions">
          <button class="nav-round-btn" aria-label="扫码" @click="handleScan">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <path d="M14 14h3v3h-3zM20 14v6M14 20h3" />
            </svg>
          </button>
          <button class="nav-round-btn" aria-label="更多选项" @click="showToast('WLAN 高级设置与偏好')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="5" r="1.5" fill="#1C1C1E" />
              <circle cx="12" cy="12" r="1.5" fill="#1C1C1E" />
              <circle cx="12" cy="19" r="1.5" fill="#1C1C1E" />
            </svg>
          </button>
        </div>
      </div>

      <div class="wifi-scroll-body scrollable">
        <!-- 头部特性大卡片（完全对齐真机 XOS 1:1） -->
        <div class="settings-card wifi-feature-card">
          <div class="wifi-feature-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
          <div class="wifi-feature-title">WLAN</div>
          <div class="wifi-feature-desc">接入无线局域网、查看可用网络，并管理连接网络设置及附近热点设置。</div>

          <div class="card-inner-divider"></div>

          <!-- WLAN 主开关 -->
          <div class="card-switch-row">
            <span class="card-switch-label">WLAN</span>
            <ToggleSwitch
              :model-value="network.wifiEnabled"
              @update:model-value="v => network.setWifi(v)"
              @change="showToast(network.wifiEnabled ? '已开启 WLAN' : '已关闭 WLAN')"
            />
          </div>
        </div>

        <template v-if="network.wifiEnabled">
          <!-- 分组 1: 已保存的网络 -->
          <div class="group-label">已保存的网络</div>
          <div class="settings-card">
            <!-- 当前已连接的网络（点击整行进入全屏二级页） -->
            <div v-if="network.connectedWifi" class="connected-wifi-cell" @click="openDetail(network.connectedWifi)">
              <div class="wifi-icon-col">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
              </div>
              <div class="wifi-info-col">
                <div class="wifi-title-row">
                  <span class="wifi-name active-name">{{ network.connectedWifi.ssid }}</span>
                  <span class="secure-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                </div>
                <div class="wifi-summary-row">
                  <span class="status-connected">已连接</span>
                </div>
              </div>
              <!-- 分享二维码按钮 -->
              <button class="qr-share-btn" aria-label="分享二维码" @click.stop="openQrShare(network.connectedWifi)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <path d="M14 14h3v3h-3zM20 14v6M14 20h3" />
                </svg>
              </button>
            </div>

            <!-- 其他已保存的网络 -->
            <div
              v-for="(saved, idx) in network.savedWifiList"
              :key="saved.ssid"
              class="saved-wifi-cell"
              :class="{ 'border-top': network.connectedWifi || idx > 0 }"
              @click="openDetail(saved)"
            >
              <div class="wifi-icon-col">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3A3A3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
              </div>
              <div class="wifi-info-col">
                <div class="wifi-title-row">
                  <span class="wifi-name">{{ saved.ssid }}</span>
                  <span v-if="saved.secure" class="secure-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                </div>
                <div class="wifi-summary-row">
                  <span>{{ saved.status || '已保存' }}</span>
                </div>
              </div>
              <div class="cell-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 分组 2: 可用网络 -->
          <div class="group-header-with-loader">
            <div class="group-label-inline">可用网络</div>
            <div class="scanning-dots">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
          </div>

          <div class="settings-card">
            <div
              v-for="(avail, idx) in network.availableWifiList"
              :key="avail.ssid"
              class="available-wifi-cell"
              :class="{ 'border-top': idx > 0 }"
              @click="handleConnectAvailable(avail)"
            >
              <div class="wifi-icon-col">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3A3A3C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" />
                </svg>
              </div>
              <div class="wifi-info-col">
                <div class="wifi-title-row">
                  <span class="wifi-name">{{ avail.ssid }}</span>
                  <span v-if="avail.secure" class="secure-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                </div>
              </div>
              <div class="cell-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>

            <!-- 添加网络入口 -->
            <div class="add-wifi-cell border-top" @click="showAddModal = true">
              <div class="plus-icon-col">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <div class="add-title">添加网络</div>
              <div class="cell-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          </div>
        </template>

        <!-- WLAN 关闭时的提示视图 -->
        <div v-else class="wifi-disabled-card">
          <div class="disabled-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
          </div>
          <div class="disabled-title">WLAN 已关闭</div>
          <div class="disabled-desc">开启 WLAN 以查看并连接附近的可用无线网络。</div>
          <button class="turn-on-btn" @click="network.setWifi(true)">开启 WLAN</button>
        </div>

        <div class="bottom-spacer"></div>
      </div>
    </div>
  </Transition>

    <!-- 弹窗 1: 二维码分享原生弹窗 -->
    <div v-if="showQrModal && selectedNetwork" class="modal-backdrop" @click.self="showQrModal = false">
      <div class="modal-dialog">
        <div class="qr-dialog-title">分享网络</div>
        <div class="qr-dialog-subtitle">使用其他设备扫描二维码以连接到此 WLAN</div>
        <div class="qr-box">
          <svg width="180" height="180" viewBox="0 0 100 100" fill="#1C1C1E">
            <path d="M10 10h30v30h-30zM15 15v20h20v-20zM22 22h6v6h-6zM60 10h30v30h-30zM65 15v20h20v-20zM72 22h6v6h-6zM10 60h30v30h-30zM15 65v20h20v-20zM22 72h6v6h-6zM48 10h5v15h-5zM48 30h5v10h-5zM55 45h15v5h-15zM45 55h8v8h-8zM60 60h10v10h-10zM75 75h15v15h-15zM75 60h8v8h-8zM60 75h8v8h-8z" />
          </svg>
        </div>
        <div class="qr-network-name">{{ selectedNetwork.ssid }}</div>
        <div class="qr-password-label">密码：<span class="qr-pass-val">ricky_wifi_key</span></div>
        <button class="modal-confirm-btn" @click="showQrModal = false">完成</button>
      </div>
    </div>

    <!-- 弹窗 2: 输入密码连接原生弹窗 -->
    <div v-if="showPasswordModal && targetConnectingWifi" class="modal-backdrop" @click.self="showPasswordModal = false">
      <div class="modal-dialog">
        <div class="modal-dialog-title">输入密码</div>
        <div class="modal-dialog-subtitle">连接到“{{ targetConnectingWifi.ssid }}”</div>
        <input
          v-model="wifiPasswordInput"
          type="password"
          class="modal-text-input"
          placeholder="请输入无线网络密码"
          autofocus
        />
        <div class="modal-dialog-buttons">
          <button class="dialog-cancel-btn" @click="showPasswordModal = false">取消</button>
          <button class="dialog-submit-btn" @click="submitPasswordConnect">连接</button>
        </div>
      </div>
    </div>

    <!-- 弹窗 3: 手动添加网络原生弹窗 -->
    <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
      <div class="modal-dialog">
        <div class="modal-dialog-title">添加网络</div>
        <div class="modal-input-group">
          <label class="input-label">网络名称 (SSID)</label>
          <input v-model="newSsid" type="text" class="modal-text-input" placeholder="输入网络名称" />
        </div>
        <div class="modal-input-group">
          <label class="input-label">安全性</label>
          <select v-model="newSecurity" class="modal-select-input">
            <option value="WPA3">WPA3 个人级</option>
            <option value="WPA2">WPA/WPA2 个人级</option>
            <option value="无">无密码 (开放)</option>
          </select>
        </div>
        <div v-if="newSecurity !== '无'" class="modal-input-group">
          <label class="input-label">密码</label>
          <input v-model="newPassword" type="password" class="modal-text-input" placeholder="输入密码" />
        </div>
        <div class="modal-dialog-buttons">
          <button class="dialog-cancel-btn" @click="showAddModal = false">取消</button>
          <button class="dialog-submit-btn" @click="submitAddNetwork">保存</button>
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

.settings-wifi-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  z-index: 20;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.wifi-nav-bar {
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

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-placeholder {
  width: 38px;
}

.wifi-scroll-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 16px 36px;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.wifi-scroll-body::-webkit-scrollbar {
  display: none;
}

/* 页面特性大卡片（完全对齐真机 XOS 1:1） */
.wifi-feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px 0;
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;
  margin-bottom: 14px;
}

.wifi-feature-icon-wrap {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.22);
}

.wifi-feature-title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin-bottom: 6px;
}

.wifi-feature-desc {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.45;
  max-width: 290px;
  margin-bottom: 16px;
}

.card-inner-divider {
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
}

.card-switch-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  box-sizing: border-box;
}

.card-switch-label {
  font-size: 16px;
  font-weight: 500;
  color: #111;
}

/* 实体详情居中大卡片（实机 1:1） */
.entity-header-box {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 28px 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.entity-header-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(0, 122, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.entity-header-title {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin-bottom: 4px;
}

.entity-header-summary {
  font-size: 13px;
  color: #34C759;
  font-weight: 600;
  margin-bottom: 24px;
}

.entity-actions-row {
  display: flex;
  width: 100%;
  gap: 10px;
}

.entity-action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 6px;
  background: #F4F5F7;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.entity-action-btn:active {
  background: #E8E9EC;
  transform: scale(0.97);
}

.entity-btn-icon {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entity-btn-text {
  font-size: 12px;
  font-weight: 600;
  color: #111;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
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

.group-header-with-loader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  margin: 16px 0 8px 0;
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

.connected-wifi-cell,
.saved-wifi-cell,
.available-wifi-cell,
.add-wifi-cell {
  display: flex;
  align-items: center;
  padding: 15px 16px;
  cursor: pointer;
  background: #FFFFFF;
  transition: background 0.15s;
}

.connected-wifi-cell:active,
.saved-wifi-cell:active,
.available-wifi-cell:active,
.add-wifi-cell:active {
  background: #F4F5F7;
}

.border-top {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.wifi-icon-col,
.plus-icon-col {
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
}

.wifi-info-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wifi-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.wifi-name {
  font-size: 16px;
  font-weight: 500;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-name {
  color: #007AFF;
  font-weight: 600;
}

.secure-badge {
  display: flex;
  align-items: center;
}

.wifi-summary-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #8E8E93;
}

.status-connected {
  color: #34C759;
  font-weight: 500;
}

.qr-share-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.1s, background 0.15s;
}

.qr-share-btn:active {
  background: rgba(0, 0, 0, 0.08);
  transform: scale(0.94);
}

.cell-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-title {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #007AFF;
}

.wifi-disabled-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.disabled-icon {
  margin-bottom: 16px;
}

.disabled-title {
  font-size: 18px;
  font-weight: 600;
  color: #111;
  margin-bottom: 6px;
}

.disabled-desc {
  font-size: 13px;
  color: #8E8E93;
  margin-bottom: 20px;
  line-height: 1.4;
}

.turn-on-btn {
  padding: 10px 24px;
  border-radius: 20px;
  background: #007AFF;
  color: #FFF;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}

.turn-on-btn:active {
  opacity: 0.85;
}

/* 居中原生弹窗样式 */
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

@keyframes pop-in {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.qr-dialog-title,
.modal-dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin-bottom: 6px;
}

.qr-dialog-subtitle,
.modal-dialog-subtitle {
  font-size: 12px;
  color: #8E8E93;
  margin-bottom: 18px;
}

.qr-box {
  width: 190px;
  height: 190px;
  background: #F4F5F7;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.qr-network-name {
  font-size: 16px;
  font-weight: 600;
  color: #111;
  margin-bottom: 4px;
}

.qr-password-label {
  font-size: 13px;
  color: #8E8E93;
  margin-bottom: 20px;
}

.qr-pass-val {
  color: #111;
  font-family: Menlo, monospace;
}

.modal-confirm-btn {
  width: 100%;
  padding: 12px;
  border-radius: 14px;
  background: #007AFF;
  color: #FFF;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
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

.modal-input-group {
  width: 100%;
  text-align: left;
  margin-bottom: 12px;
}

.input-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #8E8E93;
  margin-bottom: 6px;
}

.modal-select-input {
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

.modal-dialog-buttons {
  display: flex;
  gap: 10px;
  width: 100%;
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
