<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useAccountStore } from '../../../stores/accountStore'
import { useI18nStore } from '../../../stores/i18nStore'

const emit = defineEmits(['back', 'login-success'])
const account = useAccountStore()
const i18n = useI18nStore()

// 语言适配
const isZh = computed(() => !i18n.locale || i18n.locale.startsWith('zh'))

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

// 当前激活的弹窗: null | 'sms' | 'password' | 'register' | 'qr' | 'help'
const activeModal = ref(null)

// 验证码登录状态
const smsPhone = ref('+86 181****8993')
const smsCode = ref(['', '', '', '', '', ''])
const smsCountdown = ref(0)
let smsCountdownTimer = null

function startSmsCountdown() {
  smsCountdown.value = 60
  clearInterval(smsCountdownTimer)
  smsCountdownTimer = setInterval(() => {
    if (smsCountdown.value > 1) {
      smsCountdown.value--
    } else {
      clearInterval(smsCountdownTimer)
      smsCountdown.value = 0
    }
  }, 1000)
}

function handleSendSmsCode() {
  startSmsCountdown()
  showToast(isZh.value ? `验证码已发送至 ${smsPhone.value}` : `Code sent to ${smsPhone.value}`)
}

function fillDemoSmsCode() {
  smsCode.value = ['8', '9', '2', '6', '0', '1']
}

function handleSmsLogin() {
  const code = smsCode.value.join('')
  if (code.length < 6) {
    showToast(isZh.value ? '请输入完整 6 位验证码' : 'Please enter 6-digit code')
    return
  }
  account.login('Ricky')
  activeModal.value = null
  showToast(isZh.value ? '验证码登录成功' : 'Signed in successfully')
  setTimeout(() => {
    emit('login-success')
  }, 400)
}

// 密码登录状态
const pwdAccount = ref('Ricky')
const pwdPassword = ref('')
const showPwd = ref(false)

function handlePasswordLogin() {
  if (!pwdPassword.value) {
    showToast(isZh.value ? '请输入登录密码' : 'Please enter password')
    return
  }
  account.login(pwdAccount.value || 'Ricky')
  activeModal.value = null
  showToast(isZh.value ? '账号密码登录成功' : 'Signed in successfully')
  setTimeout(() => {
    emit('login-success')
  }, 400)
}

// Google 一键登录
const isLoggingInGoogle = ref(false)
function handleGoogleLogin() {
  isLoggingInGoogle.value = true
  setTimeout(() => {
    isLoggingInGoogle.value = false
    account.login('Ricky')
    showToast(isZh.value ? 'Google 账号授权登录成功' : 'Signed in with Google')
    setTimeout(() => {
      emit('login-success')
    }, 400)
  }, 500)
}

// 注册新账号
const regPhone = ref('')
function handleRegister() {
  if (!regPhone.value) {
    showToast(isZh.value ? '请输入注册手机号' : 'Please enter phone number')
    return
  }
  account.login('新用户')
  activeModal.value = null
  showToast(isZh.value ? '账号注册并登录成功' : 'Registered successfully')
  setTimeout(() => {
    emit('login-success')
  }, 400)
}

// 第三方登录模拟
function handleThirdPartyLogin(provider) {
  account.login('Ricky')
  showToast(isZh.value ? `${provider} 授权登录成功` : `Signed in with ${provider}`)
  setTimeout(() => {
    emit('login-success')
  }, 400)
}

onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
  if (smsCountdownTimer) clearInterval(smsCountdownTimer)
})
</script>

<template>
  <div class="account-login-page">
    <!-- 顶部状态栏避让与导航顶栏 -->
    <div class="login-nav-bar">
      <!-- 左侧圆形返回按钮 -->
      <button class="nav-round-btn" aria-label="返回" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div class="nav-spacer"></div>

      <!-- 右侧胶囊双操作组：扫码与帮助 -->
      <div class="nav-capsule-group">
        <button class="capsule-icon-btn" aria-label="扫一扫" @click="activeModal = 'qr'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <!-- 扫码取景框小方块 -->
            <rect x="3" y="3" width="7" height="7" rx="2" stroke="#1C1C1E" stroke-width="2"/>
            <rect x="14" y="3" width="7" height="7" rx="2" stroke="#1C1C1E" stroke-width="2"/>
            <rect x="3" y="14" width="7" height="7" rx="2" stroke="#1C1C1E" stroke-width="2"/>
            <rect x="14" y="14" width="7" height="7" rx="2" stroke="#1C1C1E" stroke-width="2"/>
          </svg>
        </button>

        <div class="capsule-divider"></div>

        <button class="capsule-icon-btn" aria-label="帮助与反馈" @click="activeModal = 'help'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9.5" stroke="#1C1C1E" stroke-width="2"/>
            <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2 2-2 3.5" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12.5" cy="16.5" r="1" fill="#1C1C1E"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 页面滚动主体内容 -->
    <div class="login-body-content scrollable">
      <!-- 品牌 Logo 与标题区域 -->
      <div class="login-brand-section">
        <!-- 品牌方形圆角图标 (Blue squircle matching Image 2 reference) -->
        <div class="brand-logo-squircle">
          <span class="brand-logo-text">Infinix</span>
        </div>

        <div class="brand-title">INFINIX ID</div>
        <div class="brand-subtitle">
          {{ isZh ? '登录即可享受更多个性化服务' : 'Log in for more personalised services.' }}
        </div>
      </div>

      <!-- 登录操作按钮组 -->
      <div class="login-actions-group">
        <!-- 主按钮：Google 登录 -->
        <button
          class="login-btn btn-google"
          :class="{ 'is-loading': isLoggingInGoogle }"
          @click="handleGoogleLogin"
        >
          <div class="google-badge-circle">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>
          <span class="btn-text">{{ isZh ? '使用 Google 登录' : 'Log in with Google' }}</span>
        </button>

        <!-- 次按钮 1：验证码登录 -->
        <button class="login-btn btn-secondary" @click="activeModal = 'sms'">
          <span class="btn-text">{{ isZh ? '使用验证码登录' : 'Log in with Verification code' }}</span>
        </button>

        <!-- 次按钮 2：密码登录 -->
        <button class="login-btn btn-secondary" @click="activeModal = 'password'">
          <span class="btn-text">{{ isZh ? '使用密码登录' : 'Log in with Password' }}</span>
        </button>

        <!-- 注册账号文字入口 -->
        <div class="register-link-wrap">
          <button class="register-link-btn" @click="activeModal = 'register'">
            {{ isZh ? '注册账号' : 'Register an account' }}
          </button>
        </div>
      </div>

      <!-- 底部其他登录方式 -->
      <div class="login-footer-section">
        <div class="other-methods-divider">
          <span class="divider-line"></span>
          <span class="divider-label">{{ isZh ? '其他登录方式' : 'Other login methods' }}</span>
          <span class="divider-line"></span>
        </div>

        <div class="social-login-row">
          <!-- Facebook 登录 -->
          <button class="social-round-btn fb-btn" aria-label="Facebook 登录" @click="handleThirdPartyLogin('Facebook')">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>

          <!-- LINE / 通讯软件登录 -->
          <button class="social-round-btn line-btn" aria-label="LINE 登录" @click="handleThirdPartyLogin('LINE')">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12 2C6.48 2 2 5.92 2 10.76c0 4.34 3.59 7.97 8.44 8.65.33.07.78.22.89.5.1.26.07.66.03.92-.1.64-.38 2.3-.43 2.62-.07.45.16.44.38.29.23-.15 3.09-1.82 4.23-2.61.32-.22.46-.28.71-.24 3.55.51 7.75-1.74 7.75-6.38C22 5.92 17.52 2 12 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ================= 弹窗：验证码登录 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'sms'" class="login-modal-overlay" @click.self="activeModal = null">
        <div class="login-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">{{ isZh ? '验证码登录' : 'Verification Code Login' }}</div>
            <div class="sheet-placeholder"></div>
          </div>

          <div class="sheet-body">
            <div class="input-cell-wrap">
              <span class="input-label">{{ isZh ? '手机号码' : 'Phone Number' }}</span>
              <input v-model="smsPhone" type="tel" class="sheet-text-input" placeholder="请输入手机号" />
            </div>

            <!-- 6 位验证码输入 -->
            <div class="code-box-row">
              <input
                v-for="(val, idx) in smsCode"
                :key="idx"
                v-model="smsCode[idx]"
                type="text"
                maxlength="1"
                inputmode="numeric"
                class="code-input-cell"
                @input="(e) => {
                  if (e.target.value && idx < 5) {
                    $el.querySelectorAll('.code-input-cell')[idx + 1]?.focus()
                  }
                }"
                @keydown.delete="(e) => {
                  if (!smsCode[idx] && idx > 0) {
                    $el.querySelectorAll('.code-input-cell')[idx - 1]?.focus()
                  }
                }"
              />
            </div>

            <div class="sms-actions-bar">
              <button class="helper-text-btn" @click="fillDemoSmsCode">
                {{ isZh ? '一键填入演示验证码 (892601)' : 'Fill demo code (892601)' }}
              </button>
              <button
                class="countdown-btn"
                :disabled="smsCountdown > 0"
                @click="handleSendSmsCode"
              >
                {{ smsCountdown > 0 ? `${smsCountdown}s 后重新获取` : (isZh ? '获取验证码' : 'Get Code') }}
              </button>
            </div>

            <button class="primary-action-btn" @click="handleSmsLogin">
              {{ isZh ? '立即登录' : 'Log In' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：密码登录 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'password'" class="login-modal-overlay" @click.self="activeModal = null">
        <div class="login-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">{{ isZh ? '账号密码登录' : 'Password Login' }}</div>
            <div class="sheet-placeholder"></div>
          </div>

          <div class="sheet-body">
            <div class="input-cell-wrap">
              <span class="input-label">{{ isZh ? '账号 / 手机号' : 'Account / Phone' }}</span>
              <input v-model="pwdAccount" type="text" class="sheet-text-input" placeholder="请输入 Infinix ID 或手机号" />
            </div>

            <div class="input-cell-wrap">
              <span class="input-label">{{ isZh ? '密码' : 'Password' }}</span>
              <div class="pwd-field-container">
                <input
                  v-model="pwdPassword"
                  :type="showPwd ? 'text' : 'password'"
                  class="sheet-text-input pwd-input"
                  placeholder="请输入密码"
                />
                <button class="eye-toggle-btn" @click="showPwd = !showPwd">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="pwd-footer-link">
              <button class="helper-text-btn" @click="showToast(isZh ? '请前往账号安全页面找回密码' : 'Please reset password in Security')">
                {{ isZh ? '忘记密码？' : 'Forgot password?' }}
              </button>
            </div>

            <button class="primary-action-btn" @click="handlePasswordLogin">
              {{ isZh ? '立即登录' : 'Log In' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：注册账号 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'register'" class="login-modal-overlay" @click.self="activeModal = null">
        <div class="login-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">{{ isZh ? '注册 Infinix ID' : 'Register Infinix ID' }}</div>
            <div class="sheet-placeholder"></div>
          </div>

          <div class="sheet-body">
            <div class="input-cell-wrap">
              <span class="input-label">{{ isZh ? '手机号码' : 'Phone Number' }}</span>
              <input v-model="regPhone" type="tel" class="sheet-text-input" placeholder="输入手机号创建账号" />
            </div>

            <button class="primary-action-btn" @click="handleRegister">
              {{ isZh ? '注册并登录' : 'Register & Sign In' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：扫码登录 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'qr'" class="login-modal-overlay" @click.self="activeModal = null">
        <div class="login-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">{{ isZh ? '扫码登录' : 'QR Scan Login' }}</div>
            <div class="sheet-placeholder"></div>
          </div>

          <div class="sheet-body text-center">
            <div class="qr-mock-box">
              <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
                <rect width="140" height="140" rx="12" fill="#F4F5F7"/>
                <rect x="20" y="20" width="35" height="35" rx="6" stroke="#1C1C1E" stroke-width="4"/>
                <rect x="30" y="30" width="15" height="15" rx="3" fill="#1C1C1E"/>
                <rect x="85" y="20" width="35" height="35" rx="6" stroke="#1C1C1E" stroke-width="4"/>
                <rect x="95" y="30" width="15" height="15" rx="3" fill="#1C1C1E"/>
                <rect x="20" y="85" width="35" height="35" rx="6" stroke="#1C1C1E" stroke-width="4"/>
                <rect x="30" y="95" width="15" height="15" rx="3" fill="#1C1C1E"/>
                <rect x="70" y="70" width="20" height="20" rx="3" fill="#007DFF"/>
                <rect x="100" y="75" width="15" height="10" rx="2" fill="#1C1C1E"/>
                <rect x="75" y="100" width="12" height="15" rx="2" fill="#1C1C1E"/>
                <rect x="95" y="95" width="25" height="25" rx="4" stroke="#1C1C1E" stroke-width="4"/>
              </svg>
            </div>
            <div class="sheet-hint-text">
              {{ isZh ? '请使用另一台已登录设备扫描上方二维码完成快速登录' : 'Scan QR code with another signed-in device' }}
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：帮助与反馈 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'help'" class="login-modal-overlay" @click.self="activeModal = null">
        <div class="login-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">{{ isZh ? '帮助与支持' : 'Help & Support' }}</div>
            <div class="sheet-placeholder"></div>
          </div>

          <div class="sheet-body">
            <div class="help-card-item" @click="showToast(isZh ? '正在拉起客服咨询' : 'Contacting Support')">
              <div class="help-title">{{ isZh ? '无法登录或收不到验证码？' : 'Cannot receive verification code?' }}</div>
              <div class="help-desc">{{ isZh ? '请确认手机号格式正确或网络信号正常，也可通过安全邮箱找回。' : 'Check phone number format or try recovery.' }}</div>
            </div>
            <div class="help-card-item" @click="showToast(isZh ? '查看账号安全与隐私说明' : 'Viewing Privacy Policy')">
              <div class="help-title">{{ isZh ? '关于 Infinix ID 隐私与安全' : 'Privacy & Security' }}</div>
              <div class="help-desc">{{ isZh ? '我们采用端到端加密防护与 XGuard 实时安全风控。' : 'Protected by XGuard security.' }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 浮层轻量 Toast 提示 -->
    <transition name="toast-pop">
      <div v-if="toastText" class="security-toast">
        {{ toastText }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.account-login-page {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #F8F9FA;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  font-family: var(--font-stack);
}

/* 顶部导航栏 */
.login-nav-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  width: 100%;
  height: calc(var(--safe-top, 44px) + 52px);
  padding: var(--safe-top, 44px) 18px 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(248, 249, 250, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-sizing: border-box;
  flex: none;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease, background-color 0.15s ease;
  padding: 0;
}

.nav-round-btn:active {
  transform: scale(0.92);
  background: #F2F2F7;
}

.nav-spacer {
  flex: 1;
}

/* 右侧胶囊按钮组 */
.nav-capsule-group {
  height: 38px;
  background: #FFFFFF;
  border-radius: 19px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 12px;
}

.capsule-icon-btn {
  background: transparent;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  outline: none;
  transition: transform 0.15s ease;
}

.capsule-icon-btn:active {
  transform: scale(0.9);
}

.capsule-divider {
  width: 1px;
  height: 16px;
  background: rgba(0, 0, 0, 0.08);
}

/* 主体滚动区 */
.login-body-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 24px;
  box-sizing: border-box;
  overflow-y: auto;
}

/* 品牌 Logo 与标题区域 */
.login-brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32px;
}

.brand-logo-squircle {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #0077FF 0%, #0091FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 119, 255, 0.28);
}

.brand-logo-text {
  color: #FFFFFF;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.3px;
  font-family: inherit;
}

.brand-title {
  margin-top: 18px;
  font-size: 24px;
  font-weight: 700;
  color: #1C1C1E;
  letter-spacing: -0.4px;
}

.brand-subtitle {
  margin-top: 6px;
  font-size: 13.5px;
  color: #8E8E93;
  text-align: center;
  line-height: 1.4;
}

/* 操作按钮组 */
.login-actions-group {
  margin-top: 56px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-btn {
  width: 100%;
  height: 52px;
  border-radius: 26px;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
  font-size: 15.5px;
  font-weight: 600;
  box-sizing: border-box;
}

.login-btn:active {
  transform: scale(0.98);
}

/* Google 登录主按钮 */
.btn-google {
  background: #007DFF;
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(0, 125, 255, 0.28);
  gap: 12px;
}

.btn-google:active {
  background: #0071E3;
}

.google-badge-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

/* 次级按钮 */
.btn-secondary {
  background: #EBECEF;
  color: #1C1C1E;
}

.btn-secondary:active {
  background: #E2E3E7;
}

/* 注册链接 */
.register-link-wrap {
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.register-link-btn {
  background: transparent;
  border: none;
  color: #007DFF;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 16px;
  outline: none;
  transition: opacity 0.15s ease;
}

.register-link-btn:active {
  opacity: 0.7;
}

/* 底部其他登录方式 */
.login-footer-section {
  margin-top: auto;
  padding-top: 36px;
  padding-bottom: calc(var(--safe-bottom, 24px) + 24px);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.other-methods-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.divider-line {
  width: 44px;
  height: 1px;
  background: #E0E2E7;
}

.divider-label {
  font-size: 12.5px;
  color: #8E8E93;
}

.social-login-row {
  display: flex;
  align-items: center;
  gap: 24px;
}

.social-round-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.social-round-btn:active {
  transform: scale(0.92);
}

.fb-btn {
  background: #1877F2;
}

.line-btn {
  background: #06C755;
}

/* 弹窗遮罩与抽屉容器 */
.login-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.login-bottom-sheet {
  background: #FFFFFF;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 16px 20px 32px;
  max-height: 85%;
  overflow-y: auto;
  animation: slide-up 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.sheet-title {
  font-size: 17px;
  font-weight: 700;
  color: #1C1C1E;
}

.sheet-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-placeholder {
  width: 24px;
}

.sheet-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-cell-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 13px;
  font-weight: 500;
  color: #636366;
}

.sheet-text-input {
  width: 100%;
  height: 48px;
  background: #F4F5F7;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 0 14px;
  font-size: 15.5px;
  color: #1C1C1E;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease;
}

.sheet-text-input:focus {
  border-color: #007DFF;
  background: #FFFFFF;
}

.pwd-field-container {
  position: relative;
  width: 100%;
}

.pwd-input {
  padding-right: 44px;
}

.eye-toggle-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-box-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}

.code-input-cell {
  width: 44px;
  height: 52px;
  border-radius: 12px;
  background: #F4F5F7;
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: #1C1C1E;
  outline: none;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  box-sizing: border-box;
}

.code-input-cell:focus {
  border-color: #007DFF;
  background: #FFFFFF;
}

.sms-actions-bar,
.pwd-footer-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.helper-text-btn {
  background: transparent;
  border: none;
  color: #007DFF;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.countdown-btn {
  background: transparent;
  border: none;
  color: #8E8E93;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
}

.countdown-btn:not(:disabled) {
  color: #007DFF;
}

.primary-action-btn {
  width: 100%;
  height: 48px;
  background: #007DFF;
  color: #FFFFFF;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
  margin-top: 8px;
}

.primary-action-btn:active {
  background: #0071E3;
  transform: scale(0.98);
}

.qr-mock-box {
  display: flex;
  justify-content: center;
  padding: 24px 0 12px;
}

.text-center {
  text-align: center;
}

.sheet-hint-text {
  font-size: 13.5px;
  color: #636366;
  line-height: 1.45;
  padding: 0 12px;
}

.help-card-item {
  padding: 14px 16px;
  background: #F7F8FA;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.help-card-item:active {
  background: #ECEEF2;
}

.help-title {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
}

.help-desc {
  font-size: 12.5px;
  color: #8E8E93;
  margin-top: 4px;
  line-height: 1.4;
}

/* Toast 提示 */
.security-toast {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 32, 0.88);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13.5px;
  font-weight: 500;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  z-index: 200;
  pointer-events: none;
  white-space: nowrap;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.toast-pop-enter-active,
.toast-pop-leave-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-pop-enter-from,
.toast-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>
