<script setup>
import GlassNavBar from '../../ui/GlassNavBar.vue'
import '../../../styles/layer-transitions.css'
import { computed, ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import AiSubPage from './infinixai/AiSubPage.vue'
import { AI_SUB_PAGES } from './infinixai/pages.js'
import { useInfinixAiSettingsStore } from '../../../stores/infinixAiSettingsStore'

const emit = defineEmits(['back'])
const aiStore = useInfinixAiSettingsStore()

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

/* ==================== 三级页 ==================== */
const subPage = ref(null)
const isBack = ref(false)
const pageConfig = computed(() => (subPage.value ? AI_SUB_PAGES[subPage.value] : null))

// 翻译助手：真机首次进入会先弹「智慧翻译」隐私协议
const showTranslateConsent = ref(false)
const pendingSubPage = ref(null)

function openSubPage(key) {
  if (!key || !AI_SUB_PAGES[key]) {
    showToast('该入口在真机上是独立应用界面，本原型暂不复刻')
    return
  }
  if (key === 'translate' && !aiStore.translateConsentAccepted) {
    pendingSubPage.value = key
    showTranslateConsent.value = true
    return
  }
  isBack.value = false
  subPage.value = key
}

function closeSubPage() {
  isBack.value = true
  subPage.value = null
}

function acceptConsent() {
  aiStore.acceptTranslateConsent()
  showTranslateConsent.value = false
  if (pendingSubPage.value) {
    isBack.value = false
    subPage.value = pendingSubPage.value
    pendingSubPage.value = null
  }
}

function cancelConsent() {
  showTranslateConsent.value = false
  pendingSubPage.value = null
}

function onSubRowClick(row) {
  if (row && row.title) showToast(`「${row.title}」为演示入口`)
}

function back() {
  if (showTranslateConsent.value) {
    cancelConsent()
    return true
  }
  if (subPage.value) {
    closeSubPage()
    return true
  }
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-ai-page">
    <!-- ==================== 三级页 ==================== -->
    <Transition :name="isBack ? 'slide-back' : 'slide'">
      <AiSubPage
        v-if="subPage && pageConfig"
        :key="subPage"
        v-bind="pageConfig"
        @back="closeSubPage"
        @row-click="onSubRowClick"
      />
    </Transition>

    <div v-if="!subPage" class="ai-main">
    <!-- 顶部导航栏 -->
    <GlassNavBar title="Infinix AI" @back="emit('back')" />

    <!-- 滚动区域 -->
    <div class="ai-scroll-body scrollable">
      <!-- 头部特性大卡片 -->
      <div class="ai-feature-card">
        <div class="ai-feature-icon-wrap">
          <div class="ai-orb">
            <div class="ai-orb-inner"></div>
            <svg class="ai-sparkle" viewBox="0 0 24 24" width="28" height="28" fill="none">
              <path d="M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8" stroke="url(#ai-grad)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
              <defs>
                <linearGradient id="ai-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#38bdf8" />
                  <stop offset="0.5" stop-color="#818cf8" />
                  <stop offset="1" stop-color="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div class="ai-feature-title">Infinix AI</div>
        <div class="ai-feature-desc">系统级 AI 功能一站式管理。高效工作、灵感创作、智慧生活，由此轻松开启。</div>
      </div>

      <!-- ================= 卡片 1: Fola 三大入口 ================= -->
      <div class="settings-card">
        <ListCell
          title="Fola语音"
          subtitle="AI智慧助手，一句话帮你搞定各种事。"
          chevron
          clickable
          @click="openSubPage('folaxVoice')"
        >
          <template #icon>
            <div class="ai-icon-box bg-folax">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2" stroke-dasharray="2 3"/>
                <circle cx="12" cy="12" r="4" fill="#fff"/>
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="Fola 之家"
          subtitle="你的专属 AI 伙伴，时刻相伴。"
          chevron
          clickable
          @click="openSubPage('None')"
        >
          <template #icon>
            <div class="ai-icon-box bg-blue">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 11l8-7 8 7v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="Fola识屏"
          subtitle="一键识别屏幕，轻松提取文字内容。"
          chevron last
          clickable
          @click="openSubPage('folaScreen')"
        >
          <template #icon>
            <div class="ai-icon-box bg-orange">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">
                <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
                <path d="M9 9l6 6M15 9l-6 6" />
              </svg>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- ================= 卡片 2: 智慧交互与搜索 ================= -->
      <div class="settings-card">
        <ListCell
          title="智慧建议"
          subtitle="提供一步直达的智慧建议服务。"
          chevron
          clickable
          @click="openSubPage('smartSuggestion')"
        >
          <template #icon>
            <div class="ai-icon-box bg-cyan">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <line x1="7" y1="9" x2="17" y2="9" />
                <line x1="7" y1="13" x2="13" y2="13" />
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="圈定即搜"
          subtitle="长按加画圈，迅速搜索内容。"
          chevron last
          clickable
          @click="openSubPage('circleSearch')"
        >
          <template #icon>
            <div class="ai-icon-box bg-circle-search">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="6" />
                <path d="M20 20L15.5 15.5" />
                <path d="M16 5L17.5 8L20.5 9.5L17.5 11L16 14L14.5 11L11.5 9.5L14.5 8L16 5Z" fill="#fff" stroke="none" />
              </svg>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- ================= 卡片 3: 通话、字幕与记录 ================= -->
      <div class="settings-card">
        <ListCell
          title="AI通话助手"
          subtitle="使用AI能力，帮你轻松搞定电话沟通。"
          chevron
          clickable
          @click="openSubPage('aiCall')"
        >
          <template #icon>
            <div class="ai-icon-box bg-green">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="AI 字幕"
          subtitle="为支持的视频应用提供实时字幕和翻译。"
          chevron
          clickable
          @click="openSubPage('aiSubtitle')"
        >
          <template #icon>
            <div class="ai-icon-box bg-indigo">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <line x1="7" y1="14" x2="11" y2="14" />
                <line x1="13" y1="14" x2="17" y2="14" />
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="录音摘要"
          subtitle="将录音转写成文本，生成摘要。"
          chevron
          clickable
          @click="openSubPage('recordSummary')"
        >
          <template #icon>
            <div class="ai-icon-box bg-coral">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">
                <path d="M6 10v4M10 7v10M14 9v6M18 11v2" />
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="AI 录音"
          subtitle="语音录制、文字转写、智能摘要一站式 AI 记录。"
          chevron
          clickable
          @click="openSubPage('aiRecord')"
        >
          <template #icon>
            <div class="ai-icon-box bg-purple">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="翻译助手"
          subtitle="在您聊天或阅读的时候，借助智能翻译无障碍沟通和阅读。"
          chevron
          clickable
          @click="openSubPage('translate')"
        >
          <template #icon>
            <div class="ai-icon-box bg-cobalt">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M3.6 9h16.8M3.6 15h16.8"/>
                <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18"/>
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="社交助手"
          subtitle="提供社交场景下双向翻译、通话摘要等 AI 功能。"
          chevron last
          clickable
          @click="openSubPage('social')"
        >
          <template #icon>
            <div class="ai-icon-box bg-bright-blue">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- ================= 卡片 4: 创作与办公效率 ================= -->
      <div class="settings-card">
        <ListCell
          title="AI写作助手"
          subtitle="对文本进行重写、校对拼写和语法、生成摘要、查询。"
          chevron
          clickable
          @click="openSubPage('aiWriting')"
        >
          <template #icon>
            <div class="ai-icon-box bg-emerald">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path d="M8 8h8M12 8v8" />
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="AI随心主题"
          subtitle="AI 解锁想象，轻松定制专属个性壁纸和主题。"
          chevron
          clickable
          @click="openSubPage('aiTheme')"
        >
          <template #icon>
            <div class="ai-icon-box bg-sky">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                <circle cx="11" cy="11" r="2"/>
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="智慧笔记"
          subtitle="将简单几笔的草图一键转换成精美效果图。"
          chevron
          clickable
          @click="openSubPage('smartNote')"
        >
          <template #icon>
            <div class="ai-icon-box bg-amber">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="文档助手"
          subtitle="自动分析提取文档关键信息，生成摘要。"
          chevron last
          clickable
          @click="openSubPage('docAssistant')"
        >
          <template #icon>
            <div class="ai-icon-box bg-warm-yellow">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- 底部安全与合规标识 -->
      <div class="ai-footer-badge">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4" />
        </svg>
        <span>XGuard 隐私安全保护</span>
      </div>

      <!-- 底部安全留白 -->
      <div class="scroll-bottom-spacer"></div>
    </div>

    </div><!-- /.ai-main -->

    <!-- 智慧翻译隐私协议（首次进入翻译助手时弹出） -->
    <Transition name="consent-rise" appear>
      <div v-if="showTranslateConsent" class="consent-mask" @click.self="cancelConsent">
        <div class="consent-card">
          <div class="consent-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" />
            </svg>
          </div>
          <div class="consent-title">智慧翻译</div>
          <p class="consent-text">
            感谢您对我们的信任并使用我们的产品和服务。为了提供更好的产品和服务，我们需要访问互联网、调用您设备的部分权限、收集和使用您的部分数据，我们处理您数据的法律依据为您的授权同意或履行与您订立的合同所需。
          </p>
          <p class="consent-text">
            通过点击“同意”，您知悉并同意我们《用户协议》与《隐私政策》所述条款。
          </p>
          <div class="consent-actions">
            <button class="consent-btn ghost" type="button" @click="cancelConsent">取消</button>
            <button class="consent-btn primary" type="button" @click="acceptConsent">同意</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 轻提示 (Toast) -->
    <Transition name="fade">
      <div v-if="toastText" class="sim-toast">{{ toastText }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-ai-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  display: flex;
  flex-direction: column;
  z-index: 20;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* 顶部导航栏 */
.ai-nav-bar {
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
  color: #1a1a1a;
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

.ai-scroll-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 8px 16px 36px 16px;
  scrollbar-width: none;
}

.ai-scroll-body::-webkit-scrollbar {
  display: none;
}

/* 头部特性大卡片 */
.ai-feature-card {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.ai-feature-icon-wrap {
  margin-bottom: 14px;
}

.ai-orb {
  width: 64px;
  height: 64px;
  border-radius: 22px;
  background: linear-gradient(135deg, #e0f2fe 0%, #ede9fe 50%, #fce7f3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 8px 24px rgba(129, 140, 248, 0.25);
}

.ai-orb-inner {
  position: absolute;
  inset: 4px;
  border-radius: 18px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2));
}

.ai-sparkle {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 2px 6px rgba(129, 140, 248, 0.4));
}

.ai-feature-title {
  font-size: 20px;
  font-weight: 700;
  color: #18191c;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.ai-feature-desc {
  font-size: 13.5px;
  line-height: 1.55;
  color: #636a75;
  max-width: 320px;
}

/* 通用卡片规范 */
.settings-card {
background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

/* 图标容器规范 */
.ai-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.bg-folax {
  background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #ec4899 100%);
}
.bg-orange { background: #f97316; }
.bg-blue { background: #2563eb; }
.bg-cyan { background: #0284c7; }
.bg-circle-search { background: #3b82f6; }
.bg-green { background: #22c55e; }
.bg-indigo { background: #4f46e5; }
.bg-coral { background: #f43f5e; }
.bg-purple { background: #8b5cf6; }
.bg-cobalt { background: #1d4ed8; }
.bg-bright-blue { background: #0ea5e9; }
.bg-emerald { background: #10b981; }
.bg-sky { background: #0284c7; }
.bg-amber { background: #f59e0b; }
.bg-warm-yellow { background: #eab308; }

/* 底部合规标识 */
.ai-footer-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 18px;
  font-size: 12.5px;
  color: #8c939e;
}

.scroll-bottom-spacer {
  height: 28px;
}

/* Toast 提示浮层 */
.sim-toast {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 32, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #ffffff;
  padding: 10px 18px;
  border-radius: 20px;
  font-size: 13.5px;
  font-weight: 500;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  white-space: nowrap;
}

/* 隐私协议弹窗：与底部弹层同一套「自下而上」的运动语言（居中布局保持不变） */
.consent-rise-enter-active,
.consent-rise-leave-active {
  transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.consent-rise-enter-active .consent-card,
.consent-rise-leave-active .consent-card {
  transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}

.consent-rise-enter-from,
.consent-rise-leave-to {
  opacity: 0;
}

.consent-rise-enter-from .consent-card,
.consent-rise-leave-to .consent-card {
  transform: translateY(26px) scale(0.98);
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
/* 二级页容器 */
.ai-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 智慧翻译隐私协议 */
.consent-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  z-index: 40;
}

.consent-card {
  width: 100%;
  background: #FFFFFF;
  border-radius: 22px;
  padding: 22px 20px 18px;
  position: relative;
}

.consent-badge {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #22C55E;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
}

.consent-title {
  font-size: 17px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 12px;
}

.consent-text {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 21px;
  color: #3C3C43;
}

.consent-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.consent-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.consent-btn.ghost {
  background: #F2F2F7;
  color: #2F6BF6;
}

.consent-btn.primary {
  background: #2F6BF6;
  color: #FFFFFF;
}
</style>

