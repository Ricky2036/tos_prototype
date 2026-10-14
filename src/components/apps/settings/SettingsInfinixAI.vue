<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'

const emit = defineEmits(['back'])

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

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-ai-page">
    <!-- 顶部导航栏 -->
    <div class="ai-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">Infinix AI</div>
    </div>

    <!-- 滚动区域 -->
    <div class="ai-scroll-body scrollable">
      <!-- 头部特性大卡片 -->
      <div class="ai-feature-card">
        <div class="ai-feature-icon-wrap">
          <div class="ai-orb">
            <div class="ai-orb-inner"></div>
            <svg class="ai-sparkle" viewBox="0 0 24 24" width="28" height="28" fill="none">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="url(#ai-grad)" />
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

      <!-- 分组 1: Folax 核心入口 -->
      <div class="settings-card">
        <ListCell
          title="Folax语音"
          subtitle="AI智慧助手，一句话帮你搞定各种事。"
          chevron
          clickable
          @click="showToast('正在调起 Folax 语音助手设置')"
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
          title="Folax识屏"
          subtitle="一键识别屏幕，轻松提取文字内容。"
          chevron
          last
          clickable
          @click="showToast('Folax 识屏已就绪，双指长按屏幕即可触发')"
        >
          <template #icon>
            <div class="ai-icon-box bg-orange">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">
                <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- 分组 2: AI Buddy 伙伴 -->
      <div class="settings-card">
        <ListCell
          title="AI Buddy"
          subtitle="你的专属 AI 伙伴，时刻相伴。"
          chevron
          last
          clickable
          @click="showToast('AI Buddy 桌面伴侣已启动')"
        >
          <template #icon>
            <div class="ai-icon-box bg-blue">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="4" />
                <circle cx="9" cy="12" r="1.5" fill="#fff" />
                <circle cx="15" cy="12" r="1.5" fill="#fff" />
              </svg>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- 分组 3: 智慧交互与搜索 -->
      <div class="settings-card">
        <ListCell
          title="智慧建议"
          subtitle="提供一步直达的智慧建议服务。"
          chevron
          clickable
          @click="showToast('智慧建议场景卡片已更新')"
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
          chevron
          last
          clickable
          @click="showToast('长按导航条或主屏幕底端即可圈定即搜')"
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

      <!-- 分组 4: 通讯与语音记录 -->
      <div class="settings-card">
        <ListCell
          title="AI通话助手"
          subtitle="使用AI能力，帮你轻松搞定电话沟通。"
          chevron
          clickable
          @click="showToast('AI 通话翻译与通话实时字幕已开启')"
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
          @click="showToast('AI 实时双语字幕已就绪')"
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
          @click="showToast('AI 智能会议纪要与摘要就绪')"
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
          title="AI 录"
          subtitle="语音录制、文字转写、智能摘要一站式 AI 记录。"
          chevron
          clickable
          @click="showToast('一站式 AI 记录模式已启用')"
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
          @click="showToast('跨语言翻译引擎已就绪')"
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
          chevron
          last
          clickable
          @click="showToast('WhatsApp / 微信社交辅助已就绪')"
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

      <!-- 分组 5: 创作与办公效率 -->
      <div class="settings-card">
        <ListCell
          title="AI写作助手"
          subtitle="对文本进行重写、校对拼写和语法、生成摘要、查询。"
          chevron
          clickable
          @click="showToast('AI 写作工具栏已集成至输入法')"
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
          @click="showToast('已唤起 AI 随心壁纸生成工作台')"
        >
          <template #icon>
            <div class="ai-icon-box bg-sky">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                <path d="M2 2l7.586 7.586"/>
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
          @click="showToast('AI 涂鸦成图功能已就绪')"
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
          chevron
          last
          clickable
          @click="showToast('支持 PDF/Word/PPT 一键萃取')"
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
  margin-bottom: 12px;
  background: #FFFFFF;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.03);
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
