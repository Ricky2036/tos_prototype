<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

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

// 敏感权限开关
const cameraAccess = ref(true)
const micAccess = ref(true)

function toggleCamera() {
  cameraAccess.value = !cameraAccess.value
  showToast(cameraAccess.value ? '已恢复摄像头访问权限' : '已关闭所有应用的摄像头访问')
}

function toggleMic() {
  micAccess.value = !micAccess.value
  showToast(micAccess.value ? '已恢复麦克风访问权限' : '已关闭所有应用的麦克风访问')
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-privacy-page">
    <!-- 顶部导航栏 -->
    <div class="privacy-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">权限与隐私</div>
      <button class="nav-round-btn" aria-label="更多" @click="showToast('隐私保护高级设置')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="1.5" fill="#1C1C1E" />
          <circle cx="12" cy="12" r="1.5" fill="#1C1C1E" />
          <circle cx="12" cy="19" r="1.5" fill="#1C1C1E" />
        </svg>
      </button>
    </div>

    <!-- 滚动区域 -->
    <div class="privacy-scroll-body scrollable">
      <!-- 顶部安全评分检测大卡片 -->
      <div class="privacy-score-card">
        <div class="score-badge-wrap">
          <svg class="hex-bg" viewBox="0 0 100 100">
            <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="#E8F8EE" stroke="#34C759" stroke-width="4" stroke-linejoin="round"/>
            <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="#34C759" opacity="0.9"/>
          </svg>
          <div class="score-val">53<span class="score-percent">%</span></div>
        </div>
        <div class="score-info">
          <div class="score-status-text">隐私安全检测...</div>
        </div>
      </div>

      <!-- 分组标题：隐私保护 -->
      <div class="section-title">隐私保护</div>

      <!-- 2列网格卡片组（10个功能模块） -->
      <div class="privacy-grid">
        <!-- 1. XHide -->
        <button class="grid-card" @click="showToast('进入 XHide 私密柜')">
          <div class="icon-wrap bg-xhide">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div class="card-name">XHide</div>
          <div class="card-desc">隐藏应用、图片、文档等</div>
        </button>

        <!-- 2. XClone -->
        <button class="grid-card" @click="showToast('进入 XClone 应用双开')">
          <div class="icon-wrap bg-xclone">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="12" rx="6" stroke="#FFFFFF" stroke-width="2"/>
              <circle cx="9" cy="12" r="3.5" fill="#FFFFFF"/>
            </svg>
          </div>
          <div class="card-name">XClone</div>
          <div class="card-desc">同时使用两个相同的应用</div>
        </button>

        <!-- 3. 应用锁 -->
        <button class="grid-card" @click="showToast('进入应用锁管理')">
          <div class="icon-wrap bg-applock">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="10" rx="2.5" fill="#FFFFFF"/>
              <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="card-name">应用锁</div>
          <div class="card-desc">打开应用需要验证密码</div>
        </button>

        <!-- 4. 防偷窥 -->
        <button class="grid-card" @click="showToast('防偷窥保护已开启')">
          <div class="icon-wrap bg-anti-peep">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 5V11C4 16.52 7.42 21.62 12 23C16.58 21.62 20 16.52 20 11V5L12 2Z" fill="#FFFFFF" fill-opacity="0.3"/>
              <path d="M2 12S6 6 12 6S22 12 22 12S18 18 12 18S2 12 2 12Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="2.5" fill="#FFFFFF"/>
            </svg>
          </div>
          <div class="card-name">防偷窥</div>
          <div class="card-desc">遮挡屏幕上的敏感信息</div>
        </button>

        <!-- 5. AI 防诈骗 -->
        <button class="grid-card" @click="showToast('AI 防诈骗守护实时生效中')">
          <div class="icon-wrap bg-ai-fraud">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 5V11C4 16.52 7.42 21.62 12 23C16.58 21.62 20 16.52 20 11V5L12 2Z" fill="#FFFFFF"/>
              <text x="12" y="15" fill="#0066FF" font-size="8" font-weight="bold" text-anchor="middle">AI</text>
            </svg>
          </div>
          <div class="card-name">AI 防诈骗</div>
          <div class="card-desc">智能识别诈骗风险，保护财产安全。</div>
        </button>

        <!-- 6. 屏幕共享隐私保护 -->
        <button class="grid-card" @click="showToast('屏幕共享隐私遮蔽已启用')">
          <div class="icon-wrap bg-cast-privacy">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21H16"/>
              <path d="M12 17V21"/>
              <circle cx="12" cy="10" r="2" fill="#FFFFFF"/>
            </svg>
          </div>
          <div class="card-name">屏幕共享隐私保护</div>
          <div class="card-desc">隐藏敏感信息。</div>
        </button>

        <!-- 7. 借出模式 -->
        <button class="grid-card" @click="showToast('进入借出模式配置')">
          <div class="icon-wrap bg-lend-mode">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 11V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/>
              <path d="M14 17l3 3 5-5"/>
            </svg>
          </div>
          <div class="card-name">借出模式</div>
          <div class="card-desc">借出手机时保护隐私信息</div>
        </button>

        <!-- 8. 双系统 -->
        <button class="grid-card" @click="showToast('配置独立工作与隐私系统')">
          <div class="icon-wrap bg-dual-system">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="7" height="16" rx="2" fill="#FFFFFF"/>
              <rect x="13" y="4" width="7" height="16" rx="2" fill="#FFFFFF" fill-opacity="0.6"/>
            </svg>
          </div>
          <div class="card-name">双系统</div>
          <div class="card-desc">打造专属隐私空间</div>
        </button>

        <!-- 9. 支付环境保护 -->
        <button class="grid-card" @click="showToast('支付环境安全检测通过')">
          <div class="icon-wrap bg-pay-safe">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="5" fill="#FFFFFF"/>
              <path d="M7 12L10.5 15.5L17 9" stroke="#34C759" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="card-name">支付环境保护</div>
          <div class="card-desc">检测支付时的环境风险。</div>
        </button>

        <!-- 10. 广告管控 -->
        <button class="grid-card" @click="showToast('已阻断恶意应用弹窗')">
          <div class="icon-wrap bg-ad-block">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="5" fill="#FFFFFF"/>
              <text x="12" y="16" fill="#FF9500" font-size="10" font-weight="bold" text-anchor="middle">AD</text>
            </svg>
          </div>
          <div class="card-name">广告管控</div>
          <div class="card-desc">减少恶意广告弹出</div>
        </button>
      </div>

      <!-- 隐私功能列表卡片 -->
      <div class="privacy-card">
        <ListCell title="维修模式" subtitle="保护机主隐私信息" chevron @click="showToast('维修模式可在送修时隐藏个人数据')"/>
        <ListCell title="安全键盘" subtitle="不收集用户输入的信息" chevron @click="showToast('密码输入时自动切换为系统独立安全键盘')"/>
        <ListCell title="解锁安全保护" subtitle="保护锁屏密码及生物识别信息" chevron @click="showToast('防暴力破解与生物识别防伪保护已激活')"/>
        <ListCell title="隐私保护策略" chevron last @click="showToast('查看隐私保护技术白皮书')"/>
      </div>

      <!-- 分组：敏感权限 -->
      <div class="section-title">敏感权限</div>
      <div class="privacy-card">
        <ListCell
          title="摄像头访问权限"
          subtitle="关闭后，所有应用及服务将不能使用摄像头。"
        >
          <template #value>
            <ToggleSwitch :model-value="cameraAccess" @update:model-value="toggleCamera" />
          </template>
        </ListCell>

        <ListCell
          title="麦克风访问权限"
          subtitle="关闭后，所有应用及服务将不能使用麦克风。"
        >
          <template #value>
            <ToggleSwitch :model-value="micAccess" @update:model-value="toggleMic" />
          </template>
        </ListCell>

        <ListCell title="隐私风险记录" chevron last @click="showToast('近 7 天未发现未经授权的敏感权限访问')"/>
      </div>

      <!-- 分组：权限设置 -->
      <div class="section-title">权限设置</div>
      <div class="privacy-card">
        <ListCell title="隐私信息中心" subtitle="显示最近使用过权限的应用。" chevron @click="showToast('查看应用权限调用时间线')"/>
        <ListCell title="应用权限管理" subtitle="管理应用的隐私权限使用行为。" chevron @click="showToast('进入应用权限总览')"/>
        <ListCell title="健康数据共享" subtitle="管理应用对健康数据的访问权限。" chevron @click="showToast('健康数据暂未向第三方授权')"/>
        <ListCell title="位置数据分享方面的更新" subtitle="查看改变了位置数据分享方式的应用。" chevron @click="showToast('无位置数据共享变更记录')"/>
        <ListCell title="特殊应用权限" subtitle="管理应用获取和使用特殊权限。" chevron @click="showToast('管理悬浮窗、修改系统设置等特殊权限')"/>
        <ListCell title="更多" subtitle="更多隐私相关设置。" chevron last @click="showToast('高级隐私配置')"/>
      </div>

      <!-- 分组：国际认证 -->
      <div class="section-title">国际认证</div>
      <div class="dnv-cert-card">
        <div class="cert-grid">
          <div class="cert-badge-box">
            <div class="cert-dnv-logo">
              <span class="dnv-text">DNV</span>
              <span class="dnv-sub">ISO/IEC 27001</span>
            </div>
            <div class="cert-label">信息安全管理体系</div>
          </div>

          <div class="cert-badge-box">
            <div class="cert-dnv-logo">
              <span class="dnv-text">DNV</span>
              <span class="dnv-sub">ISO/IEC 27701</span>
            </div>
            <div class="cert-label">隐私信息管理体系</div>
          </div>

          <div class="cert-badge-box">
            <div class="cert-dnv-logo">
              <span class="dnv-text">DNV</span>
              <span class="dnv-sub">ISO/IEC 27018</span>
            </div>
            <div class="cert-label">公有云个人身份信息保护</div>
          </div>
        </div>
      </div>

      <!-- 底部链接 -->
      <div class="privacy-policy-link" @click="showToast('查看完整隐私政策')">
        隐私政策
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 18L15 12L9 6" stroke="#007AFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- 底部安全徽标 -->
      <div class="xguard-footer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 5V11C4 16.52 7.42 21.62 12 23C16.58 21.62 20 16.52 20 11V5L12 2Z" fill="#34C759"/>
          <path d="M9 12L11 14L15 10" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="xguard-text">XGuard</span>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 交互提示轻吐司 -->
    <Transition name="fade">
      <div v-if="toastText" class="privacy-toast">{{ toastText }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-privacy-page {
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
.privacy-nav-bar {
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

/* 滚动主体 */
.privacy-scroll-body {
  flex: 1;
  padding: 12px 16px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 顶部安全评分检测大卡片 */
.privacy-score-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.score-badge-wrap {
  position: relative;
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hex-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 10px rgba(52, 199, 89, 0.25));
  animation: pulse-glow 3s infinite alternate ease-in-out;
}

@keyframes pulse-glow {
  0% { transform: scale(0.98); opacity: 0.9; }
  100% { transform: scale(1.02); opacity: 1; }
}

.score-val {
  position: relative;
  font-size: 24px;
  font-weight: 800;
  color: #FFFFFF;
  line-height: 1;
  display: flex;
  align-items: baseline;
  letter-spacing: -0.5px;
}

.score-percent {
  font-size: 13px;
  font-weight: 600;
  margin-left: 1px;
}

.score-info {
  display: flex;
  flex-direction: column;
}

.score-status-text {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

/* 分组标题 */
.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 4px 10px 4px;
}

/* 2列网格卡片组 */
.privacy-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.grid-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  text-align: left;
  transition: transform 0.12s ease, background-color 0.12s ease;
}

.grid-card:active {
  background: #F7F8FA;
  transform: scale(0.98);
}

.icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.bg-xhide { background: linear-gradient(135deg, #38BDF8, #0284C7); }
.bg-xclone { background: linear-gradient(135deg, #4ADE80, #16A34A); }
.bg-applock { background: linear-gradient(135deg, #34D399, #059669); }
.bg-anti-peep { background: linear-gradient(135deg, #A855F7, #7E22CE); }
.bg-ai-fraud { background: linear-gradient(135deg, #3B82F6, #1D4ED8); }
.bg-cast-privacy { background: linear-gradient(135deg, #2DD4BF, #0D9488); }
.bg-lend-mode { background: linear-gradient(135deg, #6366F1, #4338CA); }
.bg-dual-system { background: linear-gradient(135deg, #2563EB, #1E40AF); }
.bg-pay-safe { background: linear-gradient(135deg, #22C55E, #15803D); }
.bg-ad-block { background: linear-gradient(135deg, #F97316, #C2410C); }

.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 12px;
  color: #8E8E93;
  line-height: 1.3;
}

/* 列表卡片 */
.privacy-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  margin-bottom: 14px;
  overflow: hidden;
}

/* 国际认证卡片 */
.dnv-cert-card {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
}

.cert-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.cert-badge-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.cert-dnv-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 1.5px solid #004D71;
  background: #F0F7FB;
  margin-bottom: 6px;
}

.dnv-text {
  font-size: 12px;
  font-weight: 800;
  color: #004D71;
  line-height: 1;
}

.dnv-sub {
  font-size: 7px;
  color: #557E94;
  margin-top: 2px;
  transform: scale(0.85);
}

.cert-label {
  font-size: 11px;
  color: #8E8E93;
  line-height: 1.2;
}

/* 底部链接 */
.privacy-policy-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
  color: #007AFF;
  padding: 8px 0;
  cursor: pointer;
}

.privacy-policy-link:active {
  opacity: 0.7;
}

/* 底部安全徽标 */
.xguard-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 0 8px;
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
.privacy-toast {
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
