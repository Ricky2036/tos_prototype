<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'

const emit = defineEmits(['back', 'navigate'])

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

// 密码与生物识别状态
const screenLockType = ref('滑动解锁')
const fingerprintStatus = ref('未录入')
const faceStatus = ref('未录入')
const privacyPasswordStatus = ref('未录入')

function handleLockScreenTap() {
  if (screenLockType.value === '滑动解锁') {
    screenLockType.value = '数字密码'
    showToast('已将锁屏密码设置为数字密码')
  } else {
    screenLockType.value = '滑动解锁'
    showToast('已恢复为滑动解锁')
  }
}

function handleFingerprintTap() {
  if (fingerprintStatus.value === '未录入') {
    fingerprintStatus.value = '已录入 1 个指纹'
    showToast('指纹录入成功：指纹 1')
  } else {
    fingerprintStatus.value = '未录入'
    showToast('已清除指纹数据')
  }
}

function handleFaceTap() {
  if (faceStatus.value === '未录入') {
    faceStatus.value = '已录入'
    showToast('面部数据录入成功，已支持面部解锁')
  } else {
    faceStatus.value = '未录入'
    showToast('已清除面部数据')
  }
}

function handlePrivacyPasswordTap() {
  if (privacyPasswordStatus.value === '未录入') {
    privacyPasswordStatus.value = '已开启'
    showToast('隐私密码已开启，已保护私密空间')
  } else {
    privacyPasswordStatus.value = '未录入'
    showToast('已关闭隐私密码')
  }
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-security-page">
    <!-- 顶部导航栏 -->
    <div class="security-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">密码与安全</div>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 滚动区域 -->
    <div class="security-scroll-body scrollable">
      <!-- 2x2 四宫格卡片 -->
      <div class="security-grid-cards">
        <!-- 锁屏密码 -->
        <button class="grid-card-item" @click="handleLockScreenTap">
          <div class="grid-icon-wrap bg-blue-lock">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="10.5" width="14" height="10.5" rx="2.5" fill="#2E67F5"/>
              <path d="M8 10.5V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V10.5" stroke="#2E67F5" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="12" cy="15" r="1.3" fill="#FFFFFF"/>
              <path d="M12 16.3V18" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="grid-card-title">锁屏密码</div>
          <div class="grid-card-subtitle">{{ screenLockType }}</div>
        </button>

        <!-- 指纹 -->
        <button class="grid-card-item" @click="handleFingerprintTap">
          <div class="grid-icon-wrap bg-blue-fp">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E67F5" stroke-width="1.85" stroke-linecap="round">
              <path d="M12 3.5C8.8 3.5 6.2 5.5 5.5 8.5" />
              <path d="M18.5 8.5C17.8 5.5 15.2 3.5 12 3.5" />
              <path d="M12 7C9.8 7 8 8.8 8 11C8 14.2 6.8 16 5 17.2" />
              <path d="M19 17.2C17.2 16 16 14.2 16 11C16 8.8 14.2 7 12 7" />
              <path d="M12 10.5C11 10.5 10.2 11.3 10.2 12.3C10.2 14.8 9.2 16.5 7.8 18" />
              <path d="M16.2 18C14.8 16.5 13.8 14.8 13.8 12.3C13.8 11.3 13 10.5 12 10.5" />
              <path d="M12 14.2C11.4 14.2 11 14.7 11 15.4C11 17.2 9.8 18.8 8.8 19.8" />
              <path d="M15.2 19.8C14.2 18.8 13 17.2 13 15.4C13 14.7 12.6 14.2 12 14.2" />
            </svg>
          </div>
          <div class="grid-card-title">指纹</div>
          <div class="grid-card-subtitle">{{ fingerprintStatus }}</div>
        </button>

        <!-- 面部识别 -->
        <button class="grid-card-item" @click="handleFaceTap">
          <div class="grid-icon-wrap bg-green-face">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 8V6C4 4.89543 4.89543 4 6 4H8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 4H18C19.1046 4 20 4.89543 20 6V8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 16V18C4 19.1046 4.89543 20 6 20H8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 20H18C19.1046 20 20 19.1046 20 18V16" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="9" cy="9.5" r="1.2" fill="#FFFFFF"/>
              <circle cx="15" cy="9.5" r="1.2" fill="#FFFFFF"/>
              <path d="M12 11.5V13.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M9.5 16C10.5 17.2 13.5 17.2 14.5 16" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="grid-card-title">面部识别</div>
          <div class="grid-card-subtitle">{{ faceStatus }}</div>
        </button>

        <!-- 隐私密码 -->
        <button class="grid-card-item" @click="handlePrivacyPasswordTap">
          <div class="grid-icon-wrap bg-cyan-privacy">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M8 9.5V6.5C8 4.567 9.567 3 11.5 3C13.433 3 15 4.567 15 6.5V9.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
              <rect x="4.5" y="9.5" width="8" height="9.5" rx="2" fill="#FFFFFF"/>
              <path d="M12.5 10.5C12.5 10.5 15.5 9.5 19 10.5V15C19 18 16 19.8 15.5 20.2C15.1 19.8 12.5 18 12.5 15V10.5Z" fill="#FFFFFF" fill-opacity="0.95"/>
              <path d="M15.5 13.2C15.06 13.2 14.7 13.56 14.7 14C14.7 14.3 14.86 14.55 15.1 14.68V16.2C15.1 16.42 15.28 16.6 15.5 16.6C15.72 16.6 15.9 16.42 15.9 16.2V14.68C16.14 14.55 16.3 14.3 16.3 14C16.3 13.56 15.94 13.2 15.5 13.2Z" fill="#69BBF6"/>
            </svg>
          </div>
          <div class="grid-card-title">隐私密码</div>
          <div class="grid-card-subtitle">{{ privacyPasswordStatus }}</div>
        </button>
      </div>

      <!-- 系统安全列表卡片 -->
      <div class="security-card">
        <ListCell title="手机防盗" chevron @click="showToast('手机防盗服务已开启，支持远程定位与设备锁定')">
        </ListCell>

        <ListCell title="系统安全" chevron @click="showToast('系统内核安全防护运行中，未发现安全威胁')">
        </ListCell>

        <ListCell
          title="Google Play 系统更新"
          subtitle="2026年7月1日"
          chevron
          last
          @click="showToast('已安装最新 Google Play 安全更新')"
        >
        </ListCell>
      </div>

      <!-- 你可能想找卡片 -->
      <div class="recommend-box">
        <div class="recommend-title">你可能想找</div>
        <div class="recommend-link" @click="showToast('跳转应用锁管理')">应用锁</div>
      </div>

      <!-- 底部安全徽标 -->
      <div class="xguard-footer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 5V11C4 16.52 7.42 21.62 12 23C16.58 21.62 20 16.52 20 11V5L12 2Z" fill="#34C759"/>
          <path d="M9 12L11 14L15 10" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="xguard-text">XGuard</span>
      </div>

      <!-- 底部留白 -->
      <div class="bottom-spacer"></div>
    </div>

    <!-- 交互提示轻吐司 -->
    <Transition name="fade">
      <div v-if="toastText" class="security-toast">{{ toastText }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-security-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F2F3F5;
  color: #1C1C1E;
  z-index: 10;
  overflow: hidden;
}

/* 顶部导航栏 */
.security-nav-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  background: #F2F3F5;
}

.nav-round-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #FFFFFF;
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: background 0.15s ease, transform 0.1s ease;
}

.nav-round-btn:active {
  background: #E5E5EA;
  transform: scale(0.95);
}

.nav-title {
  font-size: 19px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.2px;
}

.nav-placeholder {
  width: 40px;
}

/* 滚动区域 */
.security-scroll-body {
  flex: 1;
  padding: 12px 16px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 2x2 四宫格卡片 */
.security-grid-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.grid-card-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 18px 16px;
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  text-align: left;
  transition: transform 0.12s ease, background-color 0.12s ease;
}

.grid-card-item:active {
  background: #F7F8FA;
  transform: scale(0.98);
}

.grid-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  margin-bottom: 14px;
}

.bg-blue-lock {
  background: #EEF4FE;
  color: #2E67F5;
}

.bg-blue-fp {
  background: #EEF4FE;
  color: #2E67F5;
}

.bg-green-face {
  background: #63C97A;
  color: #FFFFFF;
}

.bg-cyan-privacy {
  background: #69BBF6;
  color: #FFFFFF;
}

.grid-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  line-height: 1.3;
  margin-bottom: 4px;
}

.grid-card-subtitle {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.2;
}

/* 列表卡片 */
.security-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  margin-bottom: 14px;
  overflow: hidden;
}

/* 你可能想找 */
.recommend-box {
  background: #F7F8FA;
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 24px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.recommend-title {
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 12px;
}

.recommend-link {
  font-size: 15px;
  font-weight: 500;
  color: #007AFF;
  cursor: pointer;
  user-select: none;
}

.recommend-link:active {
  opacity: 0.7;
}

/* 底部安全徽标 */
.xguard-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0 8px;
}

.xguard-text {
  font-size: 12px;
  font-weight: 500;
  color: #8E8E93;
  letter-spacing: 0.3px;
}

.bottom-spacer {
  height: 40px;
}

/* 轻吐司 */
.security-toast {
  position: absolute;
  left: 50%;
  bottom: 60px;
  transform: translateX(-50%);
  background: rgba(30, 30, 30, 0.88);
  backdrop-filter: blur(20px);
  color: #FFFFFF;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
