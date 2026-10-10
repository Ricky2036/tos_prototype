<script setup>
import { ref } from 'vue'
import { useAccountStore } from '../../../stores/accountStore'
import walletIcon from '../../../assets/icons/wallet-entry-icon.png'

const emit = defineEmits(['back', 'open-wallet', 'open-security', 'open-login'])
const account = useAccountStore()

// 退出确认对话框与提示反馈
const showLogoutModal = ref(false)
const toastText = ref('')
let toastTimer = null

function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2000)
}

function handleConfirmLogout() {
  showLogoutModal.value = false
  account.logout()
  showToast('已退出登录')
  setTimeout(() => {
    emit('back')
  }, 400)
}

function handleRelogin() {
  emit('open-login')
}
</script>

<template>
  <div class="settings-account-page">
    <!-- 顶部导航栏：独立轻圆返回按钮 + 标题 + 独立轻圆扫码按钮 -->
    <div class="account-nav-bar">
      <button class="nav-round-btn" aria-label="返回" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div class="nav-title">Infinix ID</div>

      <button class="nav-round-btn" aria-label="扫一扫" @click="showToast('已开启二维码扫描')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="7" y1="12" x2="17" y2="12" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- 滚动区域 -->
    <div class="account-scroll-body scrollable">
      <!-- 个人信息头像与昵称 -->
      <div class="profile-header">
        <div class="profile-avatar-wrap">
          <img class="profile-avatar-img" :src="account.avatar" alt="用户头像" />
        </div>
        <div class="profile-name">{{ account.isLoggedIn ? account.username : '未登录' }}</div>
        <div class="profile-phone">
          {{ account.isLoggedIn ? account.phone : '点击下方卡片登录 Infinix ID' }}
        </div>
      </div>

      <!-- 四张功能卡片 (2x2 网格) -->
      <div class="feature-grid">
        <!-- 卡片 1: Infinix Cloud -->
        <div class="feature-card cloud-card" @click="showToast(`云存储已用 ${account.cloudStorage.used} / ${account.cloudStorage.total}`)">
          <div class="card-icon-wrap icon-cloud">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="url(#cloudGrad)"/>
              <defs>
                <linearGradient id="cloudGrad" x1="0" y1="0" x2="24" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#00A3FF"/>
                  <stop offset="1" stop-color="#0066FF"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="card-title">Infinix Cloud</div>
          <div class="card-sub">拓展手机存储，保护数据安全。</div>
          <div class="card-footer">
            <span>{{ account.cloudStorage.used }} / {{ account.cloudStorage.total }}</span>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
              <path d="M1 1l4 4-4 4" stroke="#C7C7CC" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 卡片 2: 查找我的设备 -->
        <div class="feature-card find-card" @click="showToast('查找我的设备已开启保护')">
          <div class="card-icon-wrap icon-find">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <!-- 外层半透浅蓝雷达面 -->
              <circle cx="14" cy="14" r="10" fill="#6FA6FF"/>
              <!-- 内层淡色探测圆心 -->
              <circle cx="14" cy="14" r="5.6" fill="#E3F1FD"/>
              <!-- 探测扫描指针，指向右上约 45 度 -->
              <line x1="14" y1="14" x2="20.2" y2="7.8" stroke="#0E6DF9" stroke-width="2.8" stroke-linecap="round"/>
              <!-- 顶部雷达信号点 -->
              <circle cx="14.6" cy="6.2" r="1.3" fill="#FFFFFF"/>
            </svg>
          </div>
          <div class="card-title">查找我的设备</div>
          <div class="card-sub">帮助找回丢失的设备。</div>
        </div>

        <!-- 卡片 3: 电子保卡 -->
        <div class="feature-card compact-card" @click="showToast('电子保卡在保，支持全国联保')">
          <div class="card-icon-wrap icon-warranty">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="3.5" fill="#FFFFFF"/>
              <line x1="2" y1="9" x2="22" y2="9" stroke="#34C759" stroke-width="2"/>
              <rect x="5" y="13" width="5" height="3" rx="1" fill="#34C759"/>
            </svg>
          </div>
          <div class="card-title">电子保卡</div>
        </div>

        <!-- 卡片 4: AI Credits -->
        <div class="feature-card compact-card" @click="showToast(`当前可用 AI 额度：${account.aiCredits}`)">
          <div class="card-icon-wrap icon-ai">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" fill="#FFFFFF"/>
              <path d="M12 6.5C12 9.5 10 11.5 7 12c3 0.5 5 2.5 5 5.5 0-3 2-5 5-5.5-3-0.5-5-2.5-5-5.5z" fill="#007AFF"/>
            </svg>
          </div>
          <div class="card-title">AI Credits</div>
        </div>
      </div>

      <!-- 分组 1: 个人信息、安全、协议、帮助、版本 -->
      <div class="section-card">
        <!-- 个人信息 -->
        <div class="cell-row" @click="showToast('个人信息详情')">
          <div class="cell-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="7.2" r="3.4" fill="#FFFFFF"/>
              <path d="M4.8 18.2c0-3.3 3.2-5 7.2-5s7.2 1.7 7.2 5c0 .6-.4 1-.9 1H5.7c-.5 0-.9-.4-.9-1z" fill="#FFFFFF"/>
            </svg>
          </div>
          <div class="cell-main">
            <div class="cell-title">个人信息</div>
            <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
              <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 账号安全 -->
        <div class="cell-row" @click="emit('open-security')">
          <div class="cell-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3.4c3.8 1.4 7 1.8 7 6.6 0 5.2-3.8 8.8-7 10.8-3.2-2-7-5.6-7-10.8 0-4.8 3.2-5.2 7-6.6z" fill="#FFFFFF"/>
              <path d="M9 12.2l2.2 2.2 4-4" fill="none" stroke="#B1B6C2" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="cell-main">
            <div class="cell-col">
              <div class="cell-title">账号安全</div>
              <div class="cell-sub">信息安全、密码管理</div>
            </div>
            <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
              <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 隐私与协议 -->
        <div class="cell-row" @click="showToast('隐私与用户服务协议')">
          <div class="cell-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="5.5" y="3.8" width="13" height="16.4" rx="3.2" fill="#FFFFFF"/>
              <rect x="8.5" y="8" width="7" height="2" rx="1" fill="#B1B6C2"/>
              <rect x="8.5" y="12" width="4.5" height="2" rx="1" fill="#B1B6C2"/>
            </svg>
          </div>
          <div class="cell-main">
            <div class="cell-title">隐私与协议</div>
            <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
              <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 帮助中心 -->
        <div class="cell-row" @click="showToast('帮助中心')">
          <div class="cell-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8.5" fill="#FFFFFF"/>
              <path d="M10.2 9.5a2 2 0 0 1 3.5 1c0 1.2-1.7 1.5-1.7 2.7" fill="none" stroke="#B1B6C2" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="16.2" r="1.1" fill="#B1B6C2"/>
            </svg>
          </div>
          <div class="cell-main">
            <div class="cell-title">帮助中心</div>
            <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
              <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 版本 -->
        <div class="cell-row no-border" @click="showToast('已是最新版本 20.0.0.178')">
          <div class="cell-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8.5" fill="#FFFFFF"/>
              <circle cx="12" cy="7.8" r="1.1" fill="#B1B6C2"/>
              <line x1="12" y1="10.8" x2="12" y2="16.2" stroke="#B1B6C2" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="cell-main">
            <div class="cell-col">
              <div class="cell-title">版本</div>
              <div class="cell-sub">{{ account.version }}</div>
            </div>
            <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
              <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 钱包入口卡片（位于系统设置与设备列表之间） -->
      <div class="section-card wallet-entry-card" @click="emit('open-wallet')">
        <div class="cell-row no-border">
          <div class="wallet-icon-wrap">
            <img class="wallet-icon-img" :src="walletIcon" alt="钱包" />
          </div>
          <div class="cell-main">
            <div class="cell-col">
              <div class="cell-title">钱包</div>
              <div class="cell-sub">发现专属优惠福利</div>
            </div>
            <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
              <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 分组 2: 设备列表（仅保留顶部前三个设备） -->
      <div class="section-card">
        <div
          v-for="(dev, idx) in account.devices"
          :key="dev.id"
          class="cell-row"
          :class="{ 'no-border': idx === account.devices.length - 1 }"
          @click="showToast(`${dev.name} 设备详情`)"
        >
          <!-- 手机拟真图标 -->
          <div class="device-phone-icon" :class="dev.color">
            <div class="device-phone-screen"></div>
          </div>

          <div class="cell-main">
            <div class="cell-col">
              <div class="cell-title">{{ dev.name }}</div>
              <div v-if="dev.subtitle" class="cell-sub-accent">{{ dev.subtitle }}</div>
            </div>
            <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
              <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 底部退出 / 重新登录按钮 -->
      <div v-if="account.isLoggedIn" class="logout-btn" @click="showLogoutModal = true">
        退出
      </div>
      <div v-else class="login-btn" @click="handleRelogin">
        登录 Infinix ID
      </div>
    </div>

    <!-- 退出确认弹出层 -->
    <Transition name="fade">
      <div v-if="showLogoutModal" class="modal-backdrop" @click="showLogoutModal = false">
        <div class="modal-dialog" @click.stop>
          <div class="modal-title">退出 Infinix ID</div>
          <div class="modal-desc">退出后将无法在此设备上同步云存储、查找设备及使用 AI 会员服务。</div>
          <div class="modal-actions">
            <button class="modal-btn cancel-btn" @click="showLogoutModal = false">取消</button>
            <button class="modal-btn danger-btn" @click="handleConfirmLogout">退出登录</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 悬浮反馈轻提示 -->
    <Transition name="toast-fade">
      <div v-if="toastText" class="account-toast">
        {{ toastText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-account-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F2F3F6;
  z-index: 5;
  box-sizing: border-box;
}

/* 顶部导航栏 */
.account-nav-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  width: 100%;
  height: calc(var(--safe-top, 44px) + 52px);
  padding: var(--safe-top, 44px) 16px 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(242, 243, 246, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.nav-round-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #FFFFFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: transform 0.15s ease, background 0.15s ease;
  flex: none;
  padding: 0;
}

.nav-round-btn:active {
  transform: scale(0.92);
  background: #F7F7F7;
}

.nav-title {
  font-size: 19px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.3px;
  text-align: left;
  flex: 1;
  margin-left: 12px;
}

/* 滚动区域 */
.account-scroll-body {
  flex: 1;
  padding: 16px 16px 40px 16px;
  box-sizing: border-box;
}

/* 个人信息头像与昵称 */
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 4px;
  margin-bottom: 22px;
}

.profile-avatar-wrap {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  background: #F2F2F7;
}

.profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  margin-top: 10px;
  letter-spacing: -0.2px;
}

.profile-phone {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}

/* 2x2 功能网格卡片 */
.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.feature-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
  box-sizing: border-box;
}

.feature-card:active {
  transform: scale(0.98);
  background: #FAFAFC;
}

.cloud-card,
.find-card {
  min-height: 132px;
}

.compact-card {
  min-height: 80px;
}

.card-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.icon-cloud {
  background: #EDF5FF;
}

.icon-find {
  background: #0E6DF9;
}

.icon-warranty {
  background: linear-gradient(135deg, #34C759 0%, #28A745 100%);
}

.icon-ai {
  background: linear-gradient(135deg, #007AFF 0%, #0056D2 100%);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #111111;
  margin-top: 10px;
  line-height: 1.25;
}

.compact-card .card-title {
  margin-top: 8px;
  font-size: 14.5px;
}

.card-sub {
  font-size: 11px;
  line-height: 1.35;
  color: #8E8E93;
  margin-top: 4px;
}

.card-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  font-size: 10.5px;
  color: #8E8E93;
  font-variant-numeric: tabular-nums;
}

/* 分组白色大卡 */
.section-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

.cell-row {
  display: flex;
  align-items: center;
  padding-left: 16px;
  min-height: 52px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.cell-row:active {
  background: #F4F4F6;
}

.cell-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #B1B6C2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.cell-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px 13px 0;
  border-bottom: 0.5px solid #F0F1F3;
}

.cell-row.no-border .cell-main {
  border-bottom: none;
}

.cell-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.cell-title {
  font-size: 15.5px;
  color: #111111;
  font-weight: 450;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-sub {
  font-size: 12px;
  color: #8E8E93;
  line-height: 1.3;
}

.cell-sub-accent {
  font-size: 11.5px;
  color: #8E8E93;
  line-height: 1.25;
}

.chevron-icon {
  flex: none;
  margin-left: 8px;
}

/* 钱包入口独立卡片 */
.wallet-entry-card {
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.wallet-entry-card:active {
  transform: scale(0.99);
  background: #FAFAFC;
}

.wallet-icon-wrap {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.wallet-icon-img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

/* 设备拟真小手机图标 */
.device-phone-icon {
  width: 14px;
  height: 27px;
  border-radius: 3.5px;
  background: #1C1C1E;
  padding: 1.5px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.device-phone-icon.cyan .device-phone-screen {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(180deg, #00D2FF 0%, #0078FF 100%);
}

.device-phone-icon.silver .device-phone-screen {
  width: 100%;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(180deg, #B0B0B5 0%, #636366 100%);
}

/* 底部操作按钮 */
.logout-btn {
  background: #FFFFFF;
  border-radius: 24px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FF3B30;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 24px;
  transition: transform 0.15s ease, background 0.15s ease;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.logout-btn:active {
  transform: scale(0.99);
  background: #F8F8FA;
}

.login-btn {
  background: #007AFF;
  border-radius: 24px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 24px;
  transition: transform 0.15s ease, opacity 0.15s ease;
  user-select: none;
}

.login-btn:active {
  transform: scale(0.99);
  opacity: 0.88;
}

/* 确认模态层 */
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  z-index: 100;
}

.modal-dialog {
  width: 100%;
  max-width: 320px;
  background: #FFFFFF;
  border-radius: 18px;
  padding: 20px;
  box-sizing: border-box;
  text-align: center;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #111111;
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 13.5px;
  line-height: 1.45;
  color: #636366;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  height: 40px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.modal-btn:active {
  transform: scale(0.96);
}

.cancel-btn {
  background: #F2F2F7;
  color: #1C1C1E;
}

.danger-btn {
  background: #FF3B30;
  color: #FFFFFF;
}

/* 浮动轻提示 */
.account-toast {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(12px);
  color: #FFFFFF;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 20px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 200;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
