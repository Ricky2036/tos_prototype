<script setup>
import { ref } from 'vue'

const emit = defineEmits(['back', 'open-backup', 'open-drive'])

// 是否展开全部服务（视频中默认折叠前 4 项，点击“全部 ∨”展开至 7 项）
const isServicesExpanded = ref(false)

// 应用云同步开关状态列表（视频中展示 6 个核心系统应用，支持点击切换和一键开启）
const cloudApps = ref([
  { id: 'contacts', name: '联系人', iconBg: '#007AFF', enabled: false },
  { id: 'sms', name: '短信', iconBg: '#007AFF', enabled: false },
  { id: 'notes', name: '记事本', iconBg: '#FF9F0A', enabled: false },
  { id: 'recorder', name: '录音机', iconBg: '#FF3B30', enabled: false },
  { id: 'calendar', name: '日历', iconBg: '#FFFFFF', isCalendar: true, enabled: false },
  { id: 'wifi', name: 'WLAN', iconBg: '#007AFF', enabled: false }
])

const toastText = ref('')
let toastTimer = null

function showToast(msg) {
  toastText.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2000)
}

// 切换单项应用同步
function toggleApp(app) {
  app.enabled = !app.enabled
  showToast(`${app.name}云同步已${app.enabled ? '开启' : '关闭'}`)
}

// 一键开启 / 一键关闭
function toggleAllApps() {
  const allEnabled = cloudApps.value.every(item => item.enabled)
  const nextState = !allEnabled
  cloudApps.value.forEach(item => {
    item.enabled = nextState
  })
  showToast(nextState ? '已一键开启所有应用云同步' : '已关闭所有应用云同步')
}

// 服务卡片点击处理
function handleServiceClick(serviceKey) {
  if (serviceKey === 'backup') {
    emit('open-backup')
  } else if (serviceKey === 'googlePhotos') {
    showToast('谷歌相册同步设置')
  } else if (serviceKey === 'sharedAlbums') {
    showToast('共享相册：与好友分享照片')
  } else if (serviceKey === 'theft') {
    showToast('盗抢保护已开启，守护设备安全')
  } else if (serviceKey === 'folax') {
    showToast('Folax 记忆已同步 (6.68 MB)')
  } else if (serviceKey === 'wifiKey') {
    showToast('Wi-Fi 钥匙：免费安全热点连接')
  } else if (serviceKey === 'visha') {
    showToast('Visha 播放器云存储')
  }
}
</script>

<template>
  <div class="cloud-home-page">
    <!-- 顶部固定导航栏（视频中圆形返回按钮 + 云服务标题 + 右侧更多按钮） -->
    <div class="cloud-nav-bar">
      <button
        type="button"
        class="nav-circle-btn"
        aria-label="返回账号"
        @click="emit('back')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" />
        </svg>
      </button>

      <div class="nav-title">云服务</div>

      <button
        type="button"
        class="nav-circle-btn"
        aria-label="更多"
        @click="showToast('云服务设置与帮助')"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1C1C1E">
          <circle cx="12" cy="6" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="18" r="2" />
        </svg>
      </button>
    </div>

    <!-- 页面滚动内容主体 -->
    <div class="cloud-scroll-body scrollable">
      <!-- 1. 用户信息与会员卡片区域 -->
      <div class="user-hero-card">
        <div class="user-name">Ricky</div>
        <div class="user-sub-row" @click="showToast('会员服务与空间管理')">
          <span class="user-sub-title">会员服务</span>
          <div class="user-space-usage">
            <span class="space-highlight">23.37 MB</span>
            <span class="space-total"> / 40 GB</span>
            <svg class="chevron-icon" width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <!-- 2. 云盘大卡片 -->
      <div class="white-card cloud-drive-card" @click="showToast('云盘：节省本地存储空间')">
        <div class="drive-icon-wrap">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="12" fill="url(#driveGrad)" />
            <path d="M12 15c0-1.1.9-2 2-2h6l2 2h8c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H14c-1.1 0-2-.9-2-2V15z" fill="#FFFFFF" fill-opacity="0.3" />
            <path d="M28.4 23.4c-.4-1.8-2-3.1-3.9-3.1-1.5 0-2.8.8-3.5 2-.5-.3-1.1-.4-1.7-.4-1.8 0-3.3 1.5-3.3 3.3 0 .2 0 .4.1.5C14.9 26 14 27 14 28.2c0 1.5 1.2 2.8 2.8 2.8h11.4c1.7 0 3-1.3 3-3 0-1.5-1.1-2.7-2.6-2.9l-.2.3z" fill="#FFFFFF" />
            <defs>
              <linearGradient id="driveGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop stop-color="#00C0FF" />
                <stop offset="1" stop-color="#0072FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="drive-info">
          <div class="drive-title">云盘</div>
          <div class="drive-sub">节省存储空间。</div>
        </div>
        <svg class="chevron-icon" width="7" height="12" viewBox="0 0 7 12" fill="none">
          <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <!-- 3. “服务”分组卡片（视频核心：2列网格，支持全部与折叠切换） -->
      <div class="white-card services-group-card">
        <div class="services-header">
          <h2 class="services-title">服务</h2>
        </div>

        <div class="services-grid">
          <!-- 卡片 1: 谷歌相册 -->
          <div class="service-item-card bg-photos" @click="handleServiceClick('googlePhotos')">
            <div class="service-icon-box">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <!-- 谷歌相册四色风车 -->
                <path d="M12 6a3 3 0 0 1 3 3v3h-3a3 3 0 0 1 0-6z" fill="#EA4335" />
                <path d="M18 12a3 3 0 0 1-3 3h-3v-3a3 3 0 0 1 6 0z" fill="#4285F4" />
                <path d="M12 18a3 3 0 0 1-3-3v-3h3a3 3 0 0 1 0 6z" fill="#34A853" />
                <path d="M6 12a3 3 0 0 1 3-3h3v3a3 3 0 0 1-6 0z" fill="#FBBC05" />
              </svg>
            </div>
            <div class="service-name">谷歌相册</div>
            <div class="service-desc">同步相册至谷歌相册。</div>
          </div>

          <!-- 卡片 2: 共享相册 -->
          <div class="service-item-card bg-shared" @click="handleServiceClick('sharedAlbums')">
            <div class="service-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="13" height="11" rx="2" fill="#0088FF" fill-opacity="0.3" />
                <rect x="7" y="8" width="13" height="11" rx="2" fill="#0088FF" />
                <circle cx="13.5" cy="12.5" r="2" fill="#FFFFFF" />
                <path d="M9 17.5c0-1.8 2-2.5 4.5-2.5s4.5.7 4.5 2.5" stroke="#FFFFFF" stroke-width="1.2" />
              </svg>
            </div>
            <div class="service-name">共享相册</div>
            <div class="service-desc">与好友分享照片。</div>
          </div>

          <!-- 卡片 3: 盗抢保护 -->
          <div class="service-item-card bg-security" @click="handleServiceClick('theft')">
            <div class="service-icon-box">
              <div class="shield-round-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4 5.5v6c0 5.2 3.4 10.1 8 11.5 4.6-1.4 8-6.3 8-11.5v-6L12 2z" fill="#00C853" />
                  <path d="M9 11.8l2.2 2.2 4.3-4.5" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
            <div class="service-name">盗抢保护</div>
            <div class="service-desc">保护你的设备安全。</div>
          </div>

          <!-- 卡片 4: Folax -->
          <div class="service-item-card bg-folax" @click="handleServiceClick('folax')">
            <div class="service-badge">6.68 MB</div>
            <div class="service-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" fill="url(#folaxGrad)" />
                <defs>
                  <linearGradient id="folaxGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#00F0FF" />
                    <stop offset="0.5" stop-color="#7000FF" />
                    <stop offset="1" stop-color="#FF007A" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="service-name">Folax</div>
            <div class="service-desc">同步Folax记忆。</div>
          </div>

          <!-- 展开项 5: Wi-Fi 钥匙 -->
          <div
            v-if="isServicesExpanded"
            class="service-item-card bg-wifi"
            @click="handleServiceClick('wifiKey')"
          >
            <div class="service-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0088FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h.01" />
                <path d="M8.5 16.4a5 5 0 0 1 7 0" />
                <path d="M5 12.8a10 10 0 0 1 14 0" />
                <path d="M2 8.8a15 15 0 0 1 20 0" />
              </svg>
            </div>
            <div class="service-name">Wi-Fi 钥匙</div>
            <div class="service-desc">加入以免费使用 Wi-Fi。</div>
          </div>

          <!-- 展开项 6: 备份（关键项！点击进入云备份） -->
          <div
            v-if="isServicesExpanded"
            class="service-item-card bg-backup"
            @click="handleServiceClick('backup')"
          >
            <div class="service-badge">2 TB</div>
            <div class="service-icon-box">
              <div class="backup-cloud-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#0088FF" />
                  <!-- 循环双箭头 -->
                  <path d="M9 13.5a3 3 0 0 1 3-3c1.2 0 2.2.7 2.7 1.8l-1.2.7" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
                  <path d="M15 14.5a3 3 0 0 1-3 3c-1.2 0-2.2-.7-2.7-1.8l1.2-.7" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
                </svg>
              </div>
            </div>
            <div class="service-name">备份</div>
            <div class="service-desc">免费保留 30 天。</div>
          </div>

          <!-- 展开项 7: Visha播放器 -->
          <div
            v-if="isServicesExpanded"
            class="service-item-card bg-visha"
            @click="handleServiceClick('visha')"
          >
            <div class="service-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="3" width="20" height="18" rx="5" fill="#FF5722" />
                <polygon points="10,8 16,12 10,16" fill="#FFFFFF" />
              </svg>
            </div>
            <div class="service-name">Visha播放器</div>
            <div class="service-desc">上传分享影视内容。</div>
          </div>
        </div>

        <!-- 展开 / 折叠切换控制 -->
        <button
          type="button"
          class="services-expand-btn"
          @click="isServicesExpanded = !isServicesExpanded"
        >
          <span>{{ isServicesExpanded ? '折叠' : '全部' }}</span>
          <svg
            class="expand-arrow-icon"
            :class="{ rotated: isServicesExpanded }"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8E8E93"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <!-- 4. “使用云的应用”列表卡片 -->
      <div class="white-card apps-sync-card">
        <div class="apps-sync-header">
          <h2 class="apps-sync-title">使用云的应用</h2>
          <div class="apps-sync-all" @click="showToast('所有云应用同步管理')">
            <span>全部</span>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
        </div>

        <div class="apps-sync-list">
          <!-- 联系人 -->
          <div class="app-sync-row" @click="toggleApp(cloudApps[0])">
            <div class="app-icon-wrap" style="background: #007AFF;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6.5 8-6.5s8 2.5 8 6.5" />
              </svg>
            </div>
            <div class="app-main-info">
              <div class="app-title">联系人</div>
              <div class="app-status">{{ cloudApps[0].enabled ? '已开启' : '关闭' }}</div>
            </div>
          </div>

          <!-- 短信 -->
          <div class="app-sync-row" @click="toggleApp(cloudApps[1])">
            <div class="app-icon-wrap" style="background: #007AFF;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                <circle cx="8" cy="10" r="1.2" fill="#007AFF" />
                <circle cx="12" cy="10" r="1.2" fill="#007AFF" />
                <circle cx="16" cy="10" r="1.2" fill="#007AFF" />
              </svg>
            </div>
            <div class="app-main-info">
              <div class="app-title">短信</div>
              <div class="app-status">{{ cloudApps[1].enabled ? '已开启' : '关闭' }}</div>
            </div>
          </div>

          <!-- 记事本 -->
          <div class="app-sync-row" @click="toggleApp(cloudApps[2])">
            <div class="app-icon-wrap" style="background: #FF9F0A;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div class="app-main-info">
              <div class="app-title">记事本</div>
              <div class="app-status">{{ cloudApps[2].enabled ? '已开启' : '关闭' }}</div>
            </div>
          </div>

          <!-- 录音机 -->
          <div class="app-sync-row" @click="toggleApp(cloudApps[3])">
            <div class="app-icon-wrap" style="background: #FF3B30;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round">
                <line x1="6" y1="9" x2="6" y2="15" />
                <line x1="10" y1="5" x2="10" y2="19" />
                <line x1="14" y1="8" x2="14" y2="16" />
                <line x1="18" y1="10" x2="18" y2="14" />
              </svg>
            </div>
            <div class="app-main-info">
              <div class="app-title">录音机</div>
              <div class="app-status">{{ cloudApps[3].enabled ? '已开启' : '关闭' }}</div>
            </div>
          </div>

          <!-- 日历 -->
          <div class="app-sync-row" @click="toggleApp(cloudApps[4])">
            <div class="app-icon-wrap calendar-box">
              <div class="cal-top">Sun</div>
              <div class="cal-day">7</div>
            </div>
            <div class="app-main-info">
              <div class="app-title">日历</div>
              <div class="app-status">{{ cloudApps[4].enabled ? '已开启' : '关闭' }}</div>
            </div>
          </div>

          <!-- WLAN -->
          <div class="app-sync-row no-border" @click="toggleApp(cloudApps[5])">
            <div class="app-icon-wrap" style="background: #007AFF;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h.01" />
                <path d="M8.5 16.4a5 5 0 0 1 7 0" />
                <path d="M5 12.8a10 10 0 0 1 14 0" />
                <path d="M2 8.8a15 15 0 0 1 20 0" />
              </svg>
            </div>
            <div class="app-main-info">
              <div class="app-title">WLAN</div>
              <div class="app-status">{{ cloudApps[5].enabled ? '已开启' : '关闭' }}</div>
            </div>
          </div>
        </div>

        <!-- 一键开启按钮 -->
        <button type="button" class="apps-batch-btn" @click="toggleAllApps">
          {{ cloudApps.every(a => a.enabled) ? '一键关闭' : '一键开启' }}
        </button>
      </div>

      <!-- 5. 底部外链提示 -->
      <div class="cloud-footer-note" @click="showToast('访问 infinix-cloud.palm.tech')">
        访问 <span class="link-text">infinix-cloud.palm.tech</span> 管理云端数据
      </div>
    </div>

    <!-- 轻提示 Toast -->
    <Transition name="fade">
      <div v-if="toastText" class="cloud-toast">{{ toastText }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.cloud-home-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  overflow: hidden;
  user-select: none;
  font-family: var(--font-stack, -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif);
}

/* 顶部导航栏（微磨砂与圆钮） */
.cloud-nav-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  width: 100%;
  height: calc(var(--safe-top, 44px) + 52px);
  padding: var(--safe-top, 44px) 16px 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(244, 245, 247, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-sizing: border-box;
}

.nav-circle-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.15s ease, background 0.15s ease;
  flex: none;
  padding: 0;
}

.nav-circle-btn:active {
  transform: scale(0.92);
  background: #EDEDF0;
}

.nav-title {
  font-size: 19px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.3px;
}

/* 滚动主体内容 */
.cloud-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px calc(var(--safe-bottom, 34px) + 24px) 16px;
  box-sizing: border-box;
}

/* 白色大卡基类 */
.white-card {
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  border: 0.5px solid rgba(0, 0, 0, 0.04);
}

/* 1. 用户信息卡片 */
.user-hero-card {
  padding: 8px 4px 18px 4px;
}

.user-name {
  font-size: 26px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.user-sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  cursor: pointer;
}

.user-sub-title {
  font-size: 14px;
  color: #8E8E93;
}

.user-space-usage {
  display: flex;
  align-items: center;
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
}

.space-highlight {
  color: #007AFF;
  font-weight: 600;
}

.space-total {
  color: #8E8E93;
  margin-right: 4px;
}

.chevron-icon {
  flex: none;
}

/* 2. 云盘大卡片 */
.cloud-drive-card {
  padding: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.cloud-drive-card:active {
  transform: scale(0.99);
  background: #FAFAFC;
}

.drive-icon-wrap {
  width: 44px;
  height: 44px;
  flex: none;
  margin-right: 14px;
}

.drive-info {
  flex: 1;
  min-width: 0;
}

.drive-title {
  font-size: 16.5px;
  font-weight: 600;
  color: #111111;
}

.drive-sub {
  font-size: 12.5px;
  color: #8E8E93;
  margin-top: 3px;
}

/* 3. “服务”网格卡片组 */
.services-group-card {
  padding: 18px 16px 14px 16px;
}

.services-header {
  margin-bottom: 12px;
}

.services-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #111111;
}

.services-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.service-item-card {
  position: relative;
  border-radius: 16px;
  padding: 14px;
  min-height: 104px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
  box-sizing: border-box;
}

.service-item-card:active {
  transform: scale(0.97);
  filter: brightness(0.97);
}

.bg-photos { background: #FFF9F2; }
.bg-shared { background: #F0F6FF; }
.bg-security { background: #EDFAF1; }
.bg-folax { background: #EFFBFE; }
.bg-wifi { background: #F0F7FF; }
.bg-backup { background: #EFF8FF; }
.bg-visha { background: #FFF5F0; }

.service-badge {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 11px;
  color: #8E8E93;
  font-variant-numeric: tabular-nums;
}

.service-icon-box {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.shield-round-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.backup-cloud-box {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-name {
  font-size: 15px;
  font-weight: 600;
  color: #111111;
  line-height: 1.25;
}

.service-desc {
  font-size: 11px;
  color: #8E8E93;
  margin-top: 4px;
  line-height: 1.35;
}

/* 展开 / 折叠切换按钮 */
.services-expand-btn {
  width: 100%;
  background: transparent;
  border: none;
  padding: 12px 0 2px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #8E8E93;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease;
}

.services-expand-btn:active {
  color: #1C1C1E;
}

.expand-arrow-icon {
  transition: transform 0.25s ease;
}

.expand-arrow-icon.rotated {
  transform: rotate(180deg);
}

/* 4. 使用云的应用列表 */
.apps-sync-card {
  padding: 16px;
}

.apps-sync-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.apps-sync-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #111111;
}

.apps-sync-all {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #8E8E93;
  font-size: 13.5px;
  cursor: pointer;
}

.apps-sync-list {
  display: flex;
  flex-direction: column;
}

.app-sync-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
  transition: background 0.15s ease;
}

.app-sync-row:active {
  background: #F9F9FB;
}

.app-sync-row.no-border {
  border-bottom: none;
}

.app-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 9.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.calendar-box {
  background: #FFFFFF;
  border: 1px solid #E5E5EA;
  flex-direction: column;
  overflow: hidden;
}

.cal-top {
  width: 100%;
  background: #FF3B30;
  color: #FFFFFF;
  font-size: 8px;
  font-weight: 700;
  text-align: center;
  line-height: 10px;
}

.cal-day {
  color: #111111;
  font-size: 14px;
  font-weight: 700;
  line-height: 22px;
}

.app-main-info {
  flex: 1;
  min-width: 0;
}

.app-title {
  font-size: 15.5px;
  color: #111111;
  font-weight: 500;
}

.app-status {
  font-size: 12px;
  color: #8E8E93;
  margin-top: 2px;
}

/* 一键开启按钮 */
.apps-batch-btn {
  width: 100%;
  background: transparent;
  border: none;
  color: #007AFF;
  font-size: 15.5px;
  font-weight: 600;
  padding: 16px 0 4px 0;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.apps-batch-btn:active {
  opacity: 0.7;
}

/* 5. 底部外链 */
.cloud-footer-note {
  text-align: center;
  color: #8E8E93;
  font-size: 12px;
  margin: 16px 0 28px 0;
  cursor: pointer;
}

.link-text {
  color: #007AFF;
}

/* 浮动轻提示 */
.cloud-toast {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.82);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 200;
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
