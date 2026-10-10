<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useAccountStore } from '../../../stores/accountStore'

const emit = defineEmits(['back'])
const account = useAccountStore()

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

// 指纹开关切换
function handleToggleFingerprint() {
  account.setFingerprintLogin(!account.fingerprintLogin)
  if (account.fingerprintLogin) {
    showToast('已开启指纹登录与验证')
  } else {
    showToast('已关闭指纹登录与验证')
  }
}

// 弹窗状态管理
const activeModal = ref(null) // null | 'phone' | 'email' | 'emergency' | 'thirdParty' | 'password' | 'recovery' | 'logs' | 'deleteAccount'

// 找回密码流程多步状态
const recoveryStep = ref(1) // 1: 选择验证方式, 2: 输入验证码, 3: 设置新密码, 4: 成功
const recoveryChannel = ref('phone') // 'phone' | 'email'
const recoveryCode = ref(['', '', '', '', '', ''])
const countdown = ref(60)
let countdownTimer = null

// 新密码输入
const newPassword = ref('')
const confirmPassword = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// 原密码输入（修改密码弹窗）
const oldPassword = ref('')
const changeNewPassword = ref('')
const showChangeNewPassword = ref(false)

// 启动找回密码流程
function startPasswordRecovery() {
  activeModal.value = 'recovery'
  recoveryStep.value = 1
  recoveryChannel.value = 'phone'
  recoveryCode.value = ['', '', '', '', '', '']
  newPassword.value = ''
  confirmPassword.value = ''
  showNewPassword.value = false
  showConfirmPassword.value = false
  clearInterval(countdownTimer)
  countdown.value = 60
}

// 找回密码：第 1 步发送验证码
function handleSendRecoveryCode() {
  recoveryStep.value = 2
  countdown.value = 60
  startCountdown()
  showToast(`验证码已发送至${recoveryChannel.value === 'phone' ? account.phone : account.email}`)
}

// 倒计时
function startCountdown() {
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    if (countdown.value > 1) {
      countdown.value--
    } else {
      clearInterval(countdownTimer)
      countdown.value = 0
    }
  }, 1000)
}

// 找回密码：一键填入演示验证码
function fillDemoCode() {
  recoveryCode.value = ['8', '9', '2', '6', '0', '1']
}

// 验证码字符拼接
const codeString = computed(() => recoveryCode.value.join(''))

// 找回密码：第 2 步校验验证码
function handleVerifyCode() {
  if (codeString.value.length < 6) {
    showToast('请输入完整 6 位验证码')
    return
  }
  recoveryStep.value = 3
}

// 密码强度计算
const passwordStrength = computed(() => {
  const p = newPassword.value
  if (!p) return 0
  let score = 0
  if (p.length >= 8) score++
  if (/[a-zA-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^a-zA-Z0-9]/.test(p)) score++
  return score
})

const passwordStrengthText = computed(() => {
  if (passwordStrength.value <= 1) return '弱'
  if (passwordStrength.value <= 3) return '中等'
  return '强'
})

// 找回密码：第 3 步提交重置
function handleSubmitNewPassword() {
  if (!newPassword.value || newPassword.value.length < 8) {
    showToast('新密码长度须不少于8位')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    showToast('两次输入的密码不一致')
    return
  }
  account.resetPassword(newPassword.value)
  recoveryStep.value = 4
}

// 找回密码完成
function handleFinishRecovery() {
  activeModal.value = null
  showToast('密码重置成功')
}

// 原密码方式修改密码提交
function handleSubmitChangePassword() {
  if (!oldPassword.value) {
    showToast('请输入当前密码')
    return
  }
  if (!changeNewPassword.value || changeNewPassword.value.length < 8) {
    showToast('新密码长度须不少于8位')
    return
  }
  account.resetPassword(changeNewPassword.value)
  activeModal.value = null
  oldPassword.value = ''
  changeNewPassword.value = ''
  showToast('密码修改成功')
}

// 注销确认
const deleteAgreement = ref(false)
function handleConfirmDeleteAccount() {
  if (!deleteAgreement.value) {
    showToast('请阅读并勾选注销须知')
    return
  }
  activeModal.value = null
  account.logout()
  showToast('账号注销申请已提交')
  setTimeout(() => {
    emit('back')
  }, 400)
}

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <div class="account-security-page">
    <!-- 顶部导航栏 -->
    <div class="security-nav-bar">
      <button class="nav-round-btn" aria-label="返回" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">账号安全</div>
    </div>

    <!-- 主体滚动区域 -->
    <div class="security-scroll-body scrollable">
      <!-- 卡片分组 1：基础认证信息（电话、邮箱、紧急联系人） -->
      <div class="security-card-group">
        <!-- 电话号码 -->
        <div class="security-cell-row" @click="activeModal = 'phone'">
          <div class="cell-content">
            <div class="cell-title">电话号码</div>
            <div class="cell-sub">电话号码可用于登录账号、重置密码和身份验证。</div>
          </div>
          <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
            <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="cell-divider"></div>

        <!-- 电子邮箱 -->
        <div class="security-cell-row" @click="activeModal = 'email'">
          <div class="cell-content">
            <div class="cell-title">电子邮箱</div>
            <div class="cell-sub">电子邮箱可用于登录账号、重置密码和身份验证。</div>
          </div>
          <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
            <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="cell-divider"></div>

        <!-- 紧急联系人 -->
        <div class="security-cell-row" @click="activeModal = 'emergency'">
          <div class="cell-content">
            <div class="cell-title">紧急联系人</div>
          </div>
          <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
            <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <!-- 卡片分组 2：验证方式与密码（指纹、绑定三方、修改密码、账号日志） -->
      <div class="security-card-group">
        <!-- 使用指纹登录和验证 -->
        <div class="security-cell-row toggle-row" @click="handleToggleFingerprint">
          <div class="cell-content">
            <div class="cell-title">使用指纹登录和验证</div>
          </div>
          <div class="toggle-track" :class="{ 'is-active': account.fingerprintLogin }">
            <div class="toggle-thumb"></div>
          </div>
        </div>

        <div class="cell-divider"></div>

        <!-- 绑定三方 -->
        <div class="security-cell-row" @click="activeModal = 'thirdParty'">
          <div class="cell-content">
            <div class="cell-title">绑定三方</div>
            <div class="cell-sub">三方账号可用于登录账号。</div>
          </div>
          <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
            <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="cell-divider"></div>

        <!-- 修改密码 -->
        <div class="security-cell-row" @click="activeModal = 'password'">
          <div class="cell-content">
            <div class="cell-title">修改密码</div>
          </div>
          <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
            <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="cell-divider"></div>

        <!-- 账号日志 -->
        <div class="security-cell-row" @click="activeModal = 'logs'">
          <div class="cell-content">
            <div class="cell-title">账号日志</div>
          </div>
          <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
            <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <!-- 卡片分组 3：账号注销 -->
      <div class="security-card-group">
        <div class="security-cell-row" @click="activeModal = 'deleteAccount'">
          <div class="cell-content">
            <div class="cell-title">账号注销</div>
          </div>
          <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
            <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <!-- 底部品牌与安全守护标志 -->
      <div class="security-footer">
        <div class="xguard-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 5.5v6.2c0 5.4 3.4 10.4 8 11.8 4.6-1.4 8-6.4 8-11.8V5.5L12 2z" fill="#00C853"/>
            <path d="M8.5 12l2.5 2.5 4.5-4.5" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="xguard-text">XGuard</span>
        </div>
      </div>
    </div>

    <!-- ================= 弹窗：找回密码全流程 (Password Recovery Flow) ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'recovery'" class="security-modal-overlay" @click.self="activeModal = null">
        <div class="security-bottom-sheet recovery-sheet">
          <!-- 弹窗顶栏 -->
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">找回密码</div>
            <div class="sheet-placeholder"></div>
          </div>

          <!-- 流程步骤容器 -->
          <div class="recovery-body">
            <!-- 步骤指示条 -->
            <div class="recovery-steps-bar">
              <div class="step-dot" :class="{ active: recoveryStep >= 1, done: recoveryStep > 1 }">1</div>
              <div class="step-line" :class="{ done: recoveryStep > 1 }"></div>
              <div class="step-dot" :class="{ active: recoveryStep >= 2, done: recoveryStep > 2 }">2</div>
              <div class="step-line" :class="{ done: recoveryStep > 2 }"></div>
              <div class="step-dot" :class="{ active: recoveryStep >= 3, done: recoveryStep > 3 }">3</div>
              <div class="step-line" :class="{ done: recoveryStep >= 4 }"></div>
              <div class="step-dot" :class="{ active: recoveryStep >= 4, done: recoveryStep >= 4 }">4</div>
            </div>

            <!-- 第 1 步：选择验证方式 -->
            <div v-if="recoveryStep === 1" class="step-pane">
              <div class="step-title">安全身份验证</div>
              <div class="step-desc">为保障您的账号安全，请选择用于找回密码的验证方式。</div>

              <div class="channel-options">
                <div
                  class="channel-card"
                  :class="{ selected: recoveryChannel === 'phone' }"
                  @click="recoveryChannel = 'phone'"
                >
                  <div class="channel-icon-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="2" width="14" height="20" rx="3" stroke="#00C853" stroke-width="2"/>
                      <circle cx="12" cy="18" r="1" fill="#00C853"/>
                    </svg>
                  </div>
                  <div class="channel-info">
                    <div class="channel-name">已绑定手机号</div>
                    <div class="channel-value">{{ account.phone }}</div>
                  </div>
                  <div class="radio-indicator">
                    <div v-if="recoveryChannel === 'phone'" class="radio-dot"></div>
                  </div>
                </div>

                <div
                  class="channel-card"
                  :class="{ selected: recoveryChannel === 'email' }"
                  @click="recoveryChannel = 'email'"
                >
                  <div class="channel-icon-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#00C853" stroke-width="2"/>
                      <path d="M3 7l9 6 9-6" stroke="#00C853" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="channel-info">
                    <div class="channel-name">已绑定安全邮箱</div>
                    <div class="channel-value">{{ account.email }}</div>
                  </div>
                  <div class="radio-indicator">
                    <div v-if="recoveryChannel === 'email'" class="radio-dot"></div>
                  </div>
                </div>
              </div>

              <button class="primary-action-btn" @click="handleSendRecoveryCode">
                获取验证码
              </button>
            </div>

            <!-- 第 2 步：输入 6 位验证码 -->
            <div v-else-if="recoveryStep === 2" class="step-pane">
              <div class="step-title">输入验证码</div>
              <div class="step-desc">
                验证码已发送至 {{ recoveryChannel === 'phone' ? account.phone : account.email }}
              </div>

              <!-- 6 位验证码输入格子 -->
              <div class="code-box-row">
                <input
                  v-for="(val, idx) in recoveryCode"
                  :key="idx"
                  v-model="recoveryCode[idx]"
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
                    if (!recoveryCode[idx] && idx > 0) {
                      $el.querySelectorAll('.code-input-cell')[idx - 1]?.focus()
                    }
                  }"
                />
              </div>

              <!-- 快捷辅助与重发机制 -->
              <div class="code-actions-bar">
                <button class="helper-text-btn" @click="fillDemoCode">一键填入演示验证码 (892601)</button>
                <button
                  class="countdown-btn"
                  :disabled="countdown > 0"
                  @click="handleSendRecoveryCode"
                >
                  {{ countdown > 0 ? `${countdown}s 后重新获取` : '重新获取验证码' }}
                </button>
              </div>

              <button
                class="primary-action-btn"
                :disabled="codeString.length < 6"
                @click="handleVerifyCode"
              >
                验证并进入下一步
              </button>
            </div>

            <!-- 第 3 步：设置新密码 -->
            <div v-else-if="recoveryStep === 3" class="step-pane">
              <div class="step-title">设置新密码</div>
              <div class="step-desc">请为您的 Infinix ID 设置新密码，建议包含字母与数字组合。</div>

              <div class="input-field-group">
                <div class="input-field-wrap">
                  <input
                    v-model="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    placeholder="输入新密码 (至少8位)"
                    class="security-input"
                  />
                  <button class="eye-toggle-btn" @click="showNewPassword = !showNewPassword">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>

                <div class="input-field-wrap">
                  <input
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="再次确认新密码"
                    class="security-input"
                  />
                  <button class="eye-toggle-btn" @click="showConfirmPassword = !showConfirmPassword">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- 密码强度提示条 -->
              <div class="strength-meter">
                <div class="meter-bars">
                  <div class="bar" :class="{ filled: passwordStrength >= 1, strong: passwordStrength >= 3 }"></div>
                  <div class="bar" :class="{ filled: passwordStrength >= 2, strong: passwordStrength >= 3 }"></div>
                  <div class="bar" :class="{ filled: passwordStrength >= 3, strong: passwordStrength >= 3 }"></div>
                </div>
                <div class="meter-label">密码强度：{{ passwordStrengthText }}</div>
              </div>

              <button class="primary-action-btn" @click="handleSubmitNewPassword">
                确认重置密码
              </button>
            </div>

            <!-- 第 4 步：成功状态 -->
            <div v-else-if="recoveryStep === 4" class="step-pane success-pane">
              <div class="success-icon-wrap">
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                  <circle cx="28" cy="28" r="28" fill="#E8F8EE"/>
                  <circle cx="28" cy="28" r="20" fill="#00C853"/>
                  <path d="M21 28l5 5 10-10" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="step-title">密码重置成功</div>
              <div class="step-desc">
                您的 Infinix ID 密码已更新完成，新密码已自动同步并受到 XGuard 安全防护。
              </div>

              <button class="primary-action-btn" @click="handleFinishRecovery">
                完成并返回
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：修改密码 (Password Change Modal) ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'password'" class="security-modal-overlay" @click.self="activeModal = null">
        <div class="security-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">修改密码</div>
            <div class="sheet-placeholder"></div>
          </div>

          <div class="sheet-body">
            <div class="input-field-group">
              <div class="input-field-wrap">
                <input
                  v-model="oldPassword"
                  type="password"
                  placeholder="请输入当前原密码"
                  class="security-input"
                />
              </div>

              <div class="input-field-wrap">
                <input
                  v-model="changeNewPassword"
                  :type="showChangeNewPassword ? 'text' : 'password'"
                  placeholder="请输入新密码 (不少于8位)"
                  class="security-input"
                />
                <button class="eye-toggle-btn" @click="showChangeNewPassword = !showChangeNewPassword">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 忘记原密码入口：一键进入找回密码流程 -->
            <div class="forgot-password-link-wrap">
              <button class="forgot-link-btn" @click="startPasswordRecovery">
                忘记原密码？通过安全验证找回密码
              </button>
            </div>

            <button class="primary-action-btn" @click="handleSubmitChangePassword">
              确认修改
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：电话号码详情 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'phone'" class="security-modal-overlay" @click.self="activeModal = null">
        <div class="security-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">电话号码</div>
            <div class="sheet-placeholder"></div>
          </div>
          <div class="sheet-body">
            <div class="detail-hero-box">
              <div class="detail-status-pill">已绑定</div>
              <div class="detail-hero-val">{{ account.phone }}</div>
              <div class="detail-hero-sub">已用于账号登录、密码重置及敏感操作二次验证。</div>
            </div>
            <button class="secondary-action-btn" @click="showToast('安全验证通过后可更换手机号')">
              更换电话号码
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：电子邮箱详情 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'email'" class="security-modal-overlay" @click.self="activeModal = null">
        <div class="security-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">电子邮箱</div>
            <div class="sheet-placeholder"></div>
          </div>
          <div class="sheet-body">
            <div class="detail-hero-box">
              <div class="detail-status-pill">已绑定</div>
              <div class="detail-hero-val">{{ account.email }}</div>
              <div class="detail-hero-sub">已用于安全通知接收、重置密码及身份验证。</div>
            </div>
            <button class="secondary-action-btn" @click="showToast('安全验证通过后可更换安全邮箱')">
              更换安全邮箱
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：紧急联系人 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'emergency'" class="security-modal-overlay" @click.self="activeModal = null">
        <div class="security-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">紧急联系人</div>
            <div class="sheet-placeholder"></div>
          </div>
          <div class="sheet-body">
            <div class="contact-card" v-for="item in account.emergencyContacts" :key="item.id">
              <div class="contact-name">{{ item.name }}</div>
              <div class="contact-phone">{{ item.phone }}</div>
            </div>
            <button class="secondary-action-btn" @click="showToast('已支持添加新紧急联系人')">
              + 添加紧急联系人
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：绑定三方 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'thirdParty'" class="security-modal-overlay" @click.self="activeModal = null">
        <div class="security-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">绑定三方</div>
            <div class="sheet-placeholder"></div>
          </div>
          <div class="sheet-body">
            <div class="third-party-list">
              <div class="third-row" v-for="item in account.thirdPartyAccounts" :key="item.id">
                <div class="third-name">{{ item.name }}</div>
                <div class="third-status" :class="{ bound: item.bound }">
                  {{ item.bound ? '已绑定' : '未绑定' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：账号安全日志 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'logs'" class="security-modal-overlay" @click.self="activeModal = null">
        <div class="security-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">账号日志</div>
            <div class="sheet-placeholder"></div>
          </div>
          <div class="sheet-body">
            <div class="log-list">
              <div class="log-item" v-for="log in account.accountLogs" :key="log.id">
                <div class="log-header">
                  <span class="log-action">{{ log.action }}</span>
                  <span class="log-time">{{ log.time }}</span>
                </div>
                <div class="log-sub">{{ log.device }} · {{ log.location }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ================= 弹窗：账号注销确认 ================= -->
    <transition name="modal-fade">
      <div v-if="activeModal === 'deleteAccount'" class="security-modal-overlay" @click.self="activeModal = null">
        <div class="security-bottom-sheet">
          <div class="sheet-header">
            <button class="sheet-close-btn" @click="activeModal = null">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </button>
            <div class="sheet-title">账号注销须知</div>
            <div class="sheet-placeholder"></div>
          </div>
          <div class="sheet-body">
            <div class="delete-warning-box">
              注销账号是不可逆操作。注销后，您在该账号下的云端备份数据、已购会员权益与设备配对记录将被彻底清除。
            </div>
            <label class="agreement-checkbox-row">
              <input type="checkbox" v-model="deleteAgreement" />
              <span>我已阅读并知悉注销风险</span>
            </label>
            <button class="danger-action-btn" @click="handleConfirmDeleteAccount">
              确认注销
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 全局轻量 Toast 反馈 -->
    <transition name="toast-fade">
      <div v-if="toastText" class="security-toast">
        {{ toastText }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.account-security-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  font-family: var(--font-stack);
}

/* 顶部导航栏 */
.security-nav-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  width: 100%;
  height: calc(var(--safe-top, 44px) + 52px);
  padding: var(--safe-top, 44px) 16px 0 16px;
  display: flex;
  align-items: center;
  background: rgba(244, 245, 247, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
  flex: none;
  gap: 12px;
}

.nav-round-btn {
  width: 36px;
  height: 36px;
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
}

.nav-round-btn:active {
  transform: scale(0.92);
  background: #F2F2F7;
}

.nav-title {
  font-size: 19px;
  font-weight: 700;
  color: #1C1C1E;
  letter-spacing: -0.2px;
}

/* 滚动区域 */
.security-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
}

/* 卡片分组 */
.security-card-group {
  margin: 14px 16px 0;
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.02);
}

.security-cell-row {
  display: flex;
  align-items: center;
  padding: 16px 18px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.security-cell-row:active {
  background-color: rgba(0, 0, 0, 0.03);
}

.cell-content {
  flex: 1;
  min-width: 0;
}

.cell-title {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  line-height: 1.3;
}

.cell-sub {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.4;
  margin-top: 4px;
  word-break: break-word;
}

.chevron-icon {
  flex: none;
  margin-left: 12px;
}

.cell-divider {
  height: 1px;
  background: #F4F4F6;
  margin-left: 18px;
}

/* 开关控件 */
.toggle-row {
  cursor: default;
}

.toggle-track {
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: #E5E5EA;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: background-color 0.25s ease;
  cursor: pointer;
}

.toggle-track.is-active {
  background: #00C853;
}

.toggle-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: translateX(0);
}

.toggle-track.is-active .toggle-thumb {
  transform: translateX(20px);
}

/* 底部标志 */
.security-footer {
  margin-top: 36px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.xguard-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
}

.xguard-text {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  letter-spacing: 0.2px;
}

/* 弹窗遮罩与抽屉 */
.security-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.security-bottom-sheet {
  background: #FFFFFF;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 16px 20px 32px;
  max-height: 85%;
  overflow-y: auto;
  animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.recovery-sheet {
  min-height: 480px;
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

/* 步骤指示条 */
.recovery-steps-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
}

.step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #E5E5EA;
  color: #8E8E93;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}

.step-dot.active {
  background: #00C853;
  color: #FFFFFF;
}

.step-dot.done {
  background: #00C853;
  color: #FFFFFF;
}

.step-line {
  width: 32px;
  height: 2px;
  background: #E5E5EA;
  transition: background-color 0.25s ease;
}

.step-line.done {
  background: #00C853;
}

/* 步骤页面 */
.step-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
}

.step-desc {
  font-size: 13.5px;
  color: #636366;
  line-height: 1.45;
}

/* 渠道选择卡片 */
.channel-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
}

.channel-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #F7F8FA;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
}

.channel-card.selected {
  background: #E8F8EE;
  border-color: #00C853;
}

.channel-icon-wrap {
  margin-right: 12px;
}

.channel-info {
  flex: 1;
}

.channel-name {
  font-size: 13px;
  color: #8E8E93;
}

.channel-value {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  margin-top: 2px;
}

.radio-indicator {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #C7C7CC;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-card.selected .radio-indicator {
  border-color: #00C853;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #00C853;
}

/* 验证码输入格 */
.code-box-row {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  margin: 12px 0 8px;
}

.code-input-cell {
  width: 44px;
  height: 52px;
  border-radius: 10px;
  background: #F7F8FA;
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: #1C1C1E;
  outline: none;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.code-input-cell:focus {
  border-color: #00C853;
  background: #FFFFFF;
}

.code-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.helper-text-btn {
  background: transparent;
  border: none;
  color: #00C853;
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
}

.countdown-btn:disabled {
  cursor: not-allowed;
}

/* 输入框组合 */
.input-field-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-field-wrap {
  display: flex;
  align-items: center;
  background: #F7F8FA;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 0 14px;
}

.security-input {
  flex: 1;
  height: 46px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #1C1C1E;
  outline: none;
}

.eye-toggle-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}

/* 强度计 */
.strength-meter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.meter-bars {
  display: flex;
  gap: 4px;
}

.meter-bars .bar {
  width: 24px;
  height: 4px;
  border-radius: 2px;
  background: #E5E5EA;
  transition: background-color 0.25s ease;
}

.meter-bars .bar.filled {
  background: #FF9500;
}

.meter-bars .bar.strong {
  background: #00C853;
}

.meter-label {
  font-size: 12px;
  color: #8E8E93;
}

/* 忘记原密码链接 */
.forgot-password-link-wrap {
  display: flex;
  justify-content: flex-end;
}

.forgot-link-btn {
  background: transparent;
  border: none;
  color: #00C853;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

/* 按钮通用 */
.primary-action-btn {
  width: 100%;
  height: 46px;
  border-radius: 23px;
  background: #00C853;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
  margin-top: 10px;
}

.primary-action-btn:active {
  transform: scale(0.98);
}

.primary-action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.secondary-action-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  background: #F4F5F7;
  color: #1C1C1E;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.danger-action-btn {
  width: 100%;
  height: 46px;
  border-radius: 23px;
  background: #FF3B30;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

/* 成功状态 */
.success-pane {
  align-items: center;
  text-align: center;
  padding: 20px 0 10px;
}

.success-icon-wrap {
  margin-bottom: 8px;
}

/* 详情卡片 */
.detail-hero-box {
  background: #F7F8FA;
  border-radius: 14px;
  padding: 16px;
  text-align: center;
}

.detail-status-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  background: #E8F8EE;
  color: #00C853;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.detail-hero-val {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 4px;
}

.detail-hero-sub {
  font-size: 12.5px;
  color: #8E8E93;
  line-height: 1.4;
}

/* 联系人与日志 */
.contact-card, .third-row, .log-item {
  padding: 14px 16px;
  background: #F7F8FA;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.third-status.bound {
  color: #00C853;
  font-weight: 600;
}

.log-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 10px;
}

.log-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

.log-time {
  font-size: 12px;
  color: #8E8E93;
  font-weight: 400;
}

.log-sub {
  font-size: 12px;
  color: #8E8E93;
}

.delete-warning-box {
  background: #FFF2F2;
  border-radius: 12px;
  padding: 14px;
  color: #D32F2F;
  font-size: 13.5px;
  line-height: 1.45;
}

.agreement-checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #636366;
  cursor: pointer;
}

/* Toast */
.security-toast {
  position: absolute;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.78);
  color: #FFFFFF;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(8px);
  z-index: 200;
  pointer-events: none;
}

/* 动效 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>
