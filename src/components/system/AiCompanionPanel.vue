<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import LIcon from '../ui/LIcon.vue'
import { useAiCompanionStore } from '../../stores/aiCompanionStore'
import { useSystemStore } from '../../stores/systemStore'
import folaIcon from '../../assets/icons/ai-companion/fola.png'
import geminiIcon from '../../assets/icons/ai-companion/gemini.png'

const ai = useAiCompanionStore()
const system = useSystemStore()

const draft = ref('')
const dragOffsetX = ref(0)
const isDragging = ref(false)
const conversationRef = ref(null)

let scanTimer = null
let toastTimer = null
let swipeStart = null

const isWhatsapp = computed(() => system.activeAppId === 'whatsapp' || ai.recognizedAppId === 'whatsapp')
const isBrowser = computed(() => ['chrome', 'safari'].includes(system.activeAppId) || ['chrome', 'safari'].includes(ai.recognizedAppId))
const brandIcon = computed(() => (ai.assistantModel === 'gemini' ? geminiIcon : folaIcon))
const isGeminiDrafting = computed(() => ai.assistantModel === 'gemini' && ai.geminiPhase === 'drafting')

const kbRows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['⇧', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫']
]

function onVirtualKey(key) {
  if (key === '↵') {
    submitGemini()
    return
  }
  if (key === '⌫') {
    ai.draftQuery = ai.draftQuery.slice(0, -1)
    return
  }
  if (key === '⇧' || key === '123' || key === '☺') {
    ai.showToast('Demo keyboard')
    return
  }
  ai.draftQuery += key
}

function submitGemini() {
  if (isGeminiDrafting.value) {
    ai.submitGeminiDraft(system.activeAppId)
  } else {
    submitQuery()
  }
}

const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good\nmorning'
  if (h < 18) return 'Good\nafternoon'
  return 'Good\nevening'
})

const panelStyle = computed(() => {
  if (!isDragging.value || dragOffsetX.value <= 0) return undefined
  return {
    transition: 'none',
    transform: `translateX(${dragOffsetX.value}px)`
  }
})

function triggerScan() {
  if (ai.scanning) return
  if (ai.recognized) {
    ai.showToast('已识别当前屏幕')
    return
  }
  const started = ai.startScan(system.activeAppId)
  if (!started) return
  clearTimeout(scanTimer)
  scanTimer = window.setTimeout(() => {
    ai.finishScan()
  }, 1750)
}

function openRecommendation(query) {
  ai.openExpandedWithQuery(query, system.activeAppId)
}

function submitQuery() {
  const q = draft.value.trim()
  if (!q) {
    ai.showToast('请输入问题')
    return
  }
  ai.sendQuery(q, system.activeAppId)
  draft.value = ''
  nextTick(() => {
    conversationRef.value?.scrollTo({
      top: conversationRef.value.scrollHeight,
      behavior: 'smooth'
    })
  })
}

function onPointerDown(e) {
  if (e.target.closest('input, textarea, button')) return
  swipeStart = { x: e.clientX, y: e.clientY }
  dragOffsetX.value = 0
  isDragging.value = false
}

function onPointerMove(e) {
  if (!swipeStart) return
  const dx = e.clientX - swipeStart.x
  const dy = e.clientY - swipeStart.y
  if (!isDragging.value && dx > 10 && dx > Math.abs(dy) * 1.25) {
    isDragging.value = true
  }
  if (isDragging.value) {
    dragOffsetX.value = Math.max(0, dx)
  }
}

function onPointerUp() {
  if (!swipeStart) return
  const dx = dragOffsetX.value
  const wasDragging = isDragging.value
  swipeStart = null
  isDragging.value = false
  dragOffsetX.value = 0
  if (wasDragging && dx > 56) {
    ai.collapse()
  }
}

watch(
  () => ai.toastVisible,
  (visible) => {
    clearTimeout(toastTimer)
    if (visible) {
      toastTimer = window.setTimeout(() => {
        ai.hideToast()
      }, 1800)
    }
  }
)

watch(
  () => ai.messages.length,
  () => {
    nextTick(() => {
      conversationRef.value?.scrollTo({
        top: conversationRef.value.scrollHeight,
        behavior: 'smooth'
      })
    })
  }
)

onBeforeUnmount(() => {
  clearTimeout(scanTimer)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="ai-companion-layer" :class="{ 'is-open': ai.isOpen }">
    <!-- 伴随态打开时，点击左侧应用区域可逐级收起（大屏 -> 小屏 -> 关闭） -->
    <div
      v-if="ai.isOpen"
      class="ai-expanded-backdrop"
      aria-hidden="true"
      @click="ai.collapse()"
    ></div>

    <aside
      class="ai-panel"
      :class="{
        'is-open': ai.isOpen,
        'is-recognized': ai.recognized,
        'is-expanded': ai.isExpanded,
        'is-gemini': ai.assistantModel === 'gemini',
        'is-narrow': ai.layoutStyle === 'narrow'
      }"
      :style="panelStyle"
      :aria-hidden="!ai.isOpen"
      aria-label="AI 伴随面板"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="ai-ambient-glow" aria-hidden="true"></div>

      <!-- 小屏伴随态 -->
      <div v-if="!ai.isExpanded" class="ai-compact">
        <!-- 窄版样式：品牌 Logo + 问候语（识屏扩宽后提供返回窄版按钮） -->
        <div v-if="ai.layoutStyle === 'narrow'" class="narrow-brand-hero">
          <div class="narrow-hero-top">
            <button
              v-if="ai.recognized"
              type="button"
              class="glass-circle-sm narrow-back-btn"
              aria-label="返回窄版"
              title="返回窄版"
              @click="ai.returnToNarrowCompact()"
            >
              <LIcon name="chevronLeft" :size="18" />
            </button>
            <button
              type="button"
              class="assistant-badge-btn is-top-logo"
              :title="`切换模型（当前：${ai.assistantName}）`"
              @click="ai.toggleModel()"
            >
              <img :src="brandIcon" :alt="ai.assistantName" class="brand-icon-lg" :class="{ 'is-fola': ai.assistantModel === 'floa' }" />
            </button>
          </div>
          <div v-if="!ai.recognized" class="narrow-hello">Hello!</div>
        </div>

        <div v-else class="ai-greeting">{{ greetingText }}</div>

        <div class="ai-recommendations">
          <template v-if="!(ai.layoutStyle === 'narrow' && ai.recognized)">
            <button
              type="button"
              class="glass-pill pill-with-icon"
              @click="openRecommendation(ai.assistantModel === 'gemini' ? (isWhatsapp ? 'Summarize this conversation.' : 'Summarize this article.') : 'Summary')"
            >
              <LIcon name="fileText" :size="15" />
              <span>Summary</span>
            </button>

            <button
              type="button"
              class="glass-pill pill-with-icon"
              @click="ai.toggleCollect()"
            >
              <LIcon name="star" :size="15" :filled="ai.collected" />
              <span>{{ ai.collected ? 'Saved' : 'Save' }}</span>
            </button>
          </template>

          <template v-if="ai.recognized">
            <template v-if="isWhatsapp">
              <button
                type="button"
                class="glass-pill glass-pill-tall"
                @click="openRecommendation('Please help me draft a response in business English.')"
              >
                Please help me draft a response in business English.
              </button>

              <div
                class="glass-pill contact-card"
                role="button"
                tabindex="0"
                aria-label="Contacts Rahul Sharma"
                @click="openRecommendation('Contacts · Rahul Sharma')"
                @keydown.enter.prevent="openRecommendation('Contacts · Rahul Sharma')"
              >
                <div class="contact-label">
                  <LIcon name="users" :size="13" />
                  <span>Contacts</span>
                </div>
                <strong class="contact-name">Rahul Sharma</strong>
                <small class="contact-phone">+91 98765 43210</small>
                <button
                  type="button"
                  class="contact-save-btn"
                  @click.stop="ai.saveContactCard()"
                >
                  {{ ai.contactSaved ? 'Saved ✓' : 'Save' }}
                </button>
              </div>
            </template>

            <template v-else-if="isBrowser">
              <button
                type="button"
                class="glass-pill glass-pill-tall"
                @click="openRecommendation('How to activate Visa One-Tap Payment')"
              >
                How to activate Visa One-Tap Payment
              </button>
              <button
                type="button"
                class="glass-pill glass-pill-tall"
                @click="openRecommendation('What is the technical principle of Visa Tap to Phone?')"
              >
                What is the technical principle of Visa Tap to Phone?
              </button>
            </template>

            <template v-else>
              <button
                type="button"
                class="glass-pill glass-pill-tall"
                @click="openRecommendation('Explain key points on this screen')"
              >
                Explain key points on this screen
              </button>
              <button
                type="button"
                class="glass-pill glass-pill-tall"
                @click="openRecommendation('Extract action items from this view')"
              >
                Extract action items from this view
              </button>
            </template>
          </template>
        </div>

        <div v-if="!(ai.layoutStyle === 'narrow' && ai.recognized)" class="ai-compact-footer">
          <button
            type="button"
            class="glass-pill detect-btn"
            :class="{ 'is-scanning': ai.scanning }"
            :disabled="ai.scanning"
            aria-label="识别当前屏幕"
            @click="triggerScan"
          >
            <LIcon name="scanLine" :size="15" />
            <span>{{ ai.scanning ? 'Scanning' : 'Scan' }}</span>
          </button>

          <button
            v-if="ai.layoutStyle !== 'narrow'"
            type="button"
            class="assistant-badge-btn"
            :title="`切换模型（当前：${ai.assistantName}）`"
            @click="ai.toggleModel()"
          >
            <img :src="brandIcon" :alt="ai.assistantName" class="brand-icon-lg" />
          </button>
        </div>
      </div>

      <!-- 大屏伴随态 -->
      <div v-else class="ai-expanded" :class="{ 'is-gemini': ai.assistantModel === 'gemini', 'is-drafting': isGeminiDrafting }">
        <!-- Gemini 专属头部：返回 + Gemini Auto ▾ • + 新建/更多 -->
        <header v-if="ai.assistantModel === 'gemini'" class="expanded-header">
          <button
            type="button"
            class="glass-circle-sm"
            aria-label="返回 AI 面板"
            @click="ai.collapse()"
          >
            <LIcon name="chevronLeft" :size="18" />
          </button>

          <button
            type="button"
            class="model-chip"
            title="点击切换 Fola / Gemini"
            @click="ai.toggleModel()"
          >
            <img :src="brandIcon" :alt="ai.assistantName" class="brand-icon-sm" />
            <span>{{ ai.assistantName }}</span>
            <span class="gemini-auto-tag">Auto</span>
            <LIcon name="chevronDown" :size="13" class="model-chevron" />
            <i class="gemini-dot" aria-hidden="true"></i>
          </button>

          <div class="gemini-header-pill">
            <button type="button" aria-label="新对话" @click="ai.openExpandedWithQuery('', system.activeAppId)">
              <LIcon name="pencilLine" :size="16" />
            </button>
            <button type="button" aria-label="更多选项" @click="ai.showToast('More options')">
              <LIcon name="moreHorizontal" :size="16" />
            </button>
          </div>
        </header>

        <!-- Fola 专属头部：返回 + Fola is accompanying you + 静音按钮 -->
        <header v-else class="expanded-header fola-expanded-header">
          <button
            type="button"
            class="glass-circle-sm"
            aria-label="返回 AI 面板"
            @click="ai.collapse()"
          >
            <LIcon name="chevronLeft" :size="18" />
          </button>
          <div class="fola-large-title">Fola is accompanying<br />you</div>
          <button
            type="button"
            class="glass-circle-sm fola-mute-btn"
            :class="{ 'is-muted': ai.muted }"
            aria-label="静音"
            @click="ai.toggleMute()"
          >
            <LIcon :name="ai.muted ? 'volumeX' : 'volume2'" :size="18" />
          </button>
        </header>

        <div v-if="!isGeminiDrafting" ref="conversationRef" class="expanded-conversation">
          <div v-if="ai.messages.length === 0" class="empty-prompt">
            <img :src="brandIcon" :alt="ai.assistantName" class="brand-icon-lg" />
            <p>{{ ai.assistantName }} is accompanying you</p>
          </div>

          <template v-for="msg in ai.messages" :key="msg.id">
            <div v-if="msg.role === 'user'" class="msg-query-wrap">
              <div v-if="msg.withAttachment && ai.assistantModel === 'gemini'" class="sent-attachment-thumb" :class="{ 'is-wa': isWhatsapp }" aria-label="屏幕截图上下文">
                <div v-if="isWhatsapp" class="mini-wa">
                  <div class="mini-wa-bar"></div>
                  <div class="mini-wa-b"></div>
                  <div class="mini-wa-b is-me"></div>
                  <div class="mini-wa-b"></div>
                </div>
                <div v-else class="mini-article">
                  <div class="mini-art-title">Transsion × Visa</div>
                  <div class="mini-art-line"></div>
                  <div class="mini-art-line"></div>
                  <div class="mini-art-line short"></div>
                </div>
              </div>
              <div class="msg-query">{{ msg.text }}</div>
            </div>

            <div v-else class="msg-reply-wrap">
              <div class="reply-brand">
                <span class="reply-brand-icon">
                  <img :src="brandIcon" :alt="ai.assistantName" class="brand-icon-md" />
                </span>
                <span>{{ ai.assistantName }}</span>
              </div>
              <div class="reply-body">
                <p v-for="(p, idx) in msg.paragraphs" :key="idx">{{ p }}</p>
              </div>
              <div class="reply-disclaimer">AI 生成内容仅供参考</div>
              <div class="reply-actions">
                <button type="button" aria-label="赞" @click="ai.showToast('感谢反馈')">
                  <LIcon name="heart" :size="15" />
                </button>
                <div class="spacer"></div>
                <button type="button" aria-label="朗读" @click="ai.showToast(ai.muted ? '已静音' : '正在朗读')">
                  <LIcon :name="ai.muted ? 'volumeX' : 'volume2'" :size="15" />
                </button>
                <button type="button" aria-label="分享" @click="ai.showToast('已分享')">
                  <LIcon name="share" :size="15" />
                </button>
                <button type="button" aria-label="复制" @click="ai.showToast('已复制内容')">
                  <LIcon name="copy" :size="15" />
                </button>
                <button type="button" aria-label="重新生成" @click="ai.openExpandedWithQuery(ai.messages[0]?.text || 'Summary', system.activeAppId)">
                  <LIcon name="rotateCw" :size="15" />
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Gemini 草稿编辑卡片（真实屏幕微缩截图 + 多行输入 + 发送箭头） -->
        <form v-if="isGeminiDrafting" class="gemini-draft-card" @submit.prevent="submitGemini">
          <div v-if="ai.hasAttachment" class="gemini-draft-thumb" :class="{ 'is-wa': isWhatsapp }" aria-label="当前屏幕截图预览">
            <div v-if="isWhatsapp" class="mini-wa">
              <div class="mini-wa-bar"></div>
              <div class="mini-wa-b"></div>
              <div class="mini-wa-b is-me"></div>
            </div>
            <div v-else class="mini-article">
              <div class="mini-art-title">Shenzhen, Nov 19</div>
              <div class="mini-art-line"></div>
              <div class="mini-art-line short"></div>
            </div>
            <button type="button" class="thumb-remove-btn" aria-label="移除截图" @click="ai.removeAttachment()">
              <LIcon name="x" :size="11" />
            </button>
          </div>
          <textarea
            v-model="ai.draftQuery"
            rows="3"
            placeholder="Ask Gemini"
            aria-label="询问 Gemini"
            @focus="ai.keyboardOpen = true"
            @keydown.enter.exact.prevent="submitGemini"
          ></textarea>
          <div class="gemini-draft-footer">
            <button type="button" class="composer-icon-btn" aria-label="添加内容" @click="ai.restoreAttachment()">
              <LIcon name="plus" :size="19" />
            </button>
            <button type="submit" class="gemini-send-arrow" aria-label="发送消息">
              <LIcon name="arrowUp" :size="17" />
            </button>
          </div>
        </form>

        <!-- 常规底部输入栏（Fola 或 Gemini 回复后追问） -->
        <form v-else class="expanded-composer" @submit.prevent="submitQuery">
          <div v-if="ai.hasAttachment && ai.assistantModel === 'gemini'" class="draft-context-pill">
            <LIcon name="fileText" :size="12" />
            <span>已附带当前屏幕上下文</span>
            <button type="button" aria-label="移除上下文" @click="ai.removeAttachment()">
              <LIcon name="x" :size="12" />
            </button>
          </div>
          <div class="composer-glass-row">
            <button
              v-if="ai.assistantModel === 'gemini'"
              type="button"
              class="composer-icon-btn"
              aria-label="添加屏幕上下文"
              @click="ai.restoreAttachment()"
            >
              <LIcon name="plus" :size="18" />
            </button>
            <img v-else :src="brandIcon" alt="Fola" class="composer-fola-icon" />
            <input
              v-model="draft"
              type="text"
              :placeholder="ai.assistantModel === 'gemini' ? 'Ask Gemini...' : 'Ask me anytime...'"
              aria-label="向 AI 提问"
            />
            <button type="submit" class="composer-send-btn" aria-label="发送">
              <LIcon :name="draft.trim() ? 'send' : 'mic'" :size="16" />
            </button>
          </div>
        </form>

        <!-- Gemini 虚拟键盘（草稿态默认展开，可收起） -->
        <div v-if="isGeminiDrafting && ai.keyboardOpen" class="gemini-keyboard" aria-label="虚拟键盘">
          <button
            type="button"
            class="kb-collapse-btn"
            aria-label="收起键盘"
            @click="ai.keyboardOpen = false"
          >
            <LIcon name="chevronDown" :size="15" />
          </button>
          <div v-for="(row, rIdx) in kbRows" :key="rIdx" class="kb-row" :class="{ 'kb-row-mid': rIdx === 1 }">
            <button
              v-for="k in row"
              :key="k"
              type="button"
              class="kb-key"
              :class="{ 'kb-key-fn': k === '⇧' || k === '⌫' }"
              @click="onVirtualKey(k)"
            >
              {{ k }}
            </button>
          </div>
          <div class="kb-row kb-row-bottom">
            <button type="button" class="kb-key kb-key-sm" @click="onVirtualKey('123')">123</button>
            <button type="button" class="kb-key kb-key-sm" @click="onVirtualKey('☺')">☺</button>
            <button type="button" class="kb-key kb-key-space" @click="onVirtualKey(' ')"> </button>
            <button type="button" class="kb-key kb-key-enter" @click="onVirtualKey('↵')">↵</button>
          </div>
        </div>
      </div>

    </aside>

    <!-- 轻提示（置于全屏层，避免窄版面板内裁切） -->
    <div class="ai-toast" :class="{ 'is-visible': ai.toastVisible }" role="status" aria-live="polite">
      {{ ai.toastText }}
    </div>
  </div>
</template>

<style scoped>
.ai-companion-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 82;
  overflow: hidden;
  border-radius: inherit;
}

.ai-expanded-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  z-index: 1;
}

/* 统一透明毛玻璃面板 */
.ai-panel {
  --companion-ease: cubic-bezier(0.22, 0.88, 0.28, 1);
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 35.5%;
  z-index: 2;
  pointer-events: none;
  border-radius: 26px 0 0 26px;
  background:
    radial-gradient(ellipse 210px 160px at 82% 4%, rgba(130, 178, 255, 0.42), transparent 76%),
    radial-gradient(ellipse 170px 140px at 16% 8%, rgba(128, 218, 212, 0.36), transparent 74%),
    linear-gradient(
      175deg,
      rgba(202, 222, 242, 0.88) 0%,
      rgba(220, 234, 246, 0.85) 42%,
      rgba(232, 240, 248, 0.88) 100%
    );
  backdrop-filter: blur(30px) saturate(92%);
  -webkit-backdrop-filter: blur(30px) saturate(92%);
  border-left: 0.5px solid rgba(255, 255, 255, 0.85);
  box-shadow:
    -6px 0 18px rgba(32, 58, 92, 0.08),
    inset 1px 0 0 rgba(255, 255, 255, 0.85);
  color: #14171a;
  font-family: var(--font-stack);
  transform: translateX(104%);
  opacity: 0;
  transition:
    transform 0.58s var(--companion-ease),
    width 0.58s var(--companion-ease),
    top 0.58s var(--companion-ease),
    bottom 0.58s var(--companion-ease),
    right 0.58s var(--companion-ease),
    border-radius 0.58s var(--companion-ease),
    opacity 0.22s ease;
  overflow: hidden;
  touch-action: pan-y;
  will-change: width, transform;
  contain: layout style;
}

/* Gemini 专属浅蓝天空毛玻璃配色（对齐原型） */
.ai-panel.is-gemini {
  background:
    radial-gradient(ellipse 180px 150px at 82% 4%, rgba(177, 214, 247, 0.55), transparent 77%),
    linear-gradient(
      180deg,
      rgba(206, 229, 248, 0.78) 0%,
      rgba(229, 239, 247, 0.74) 57%,
      rgba(243, 246, 249, 0.76) 78%,
      rgba(224, 238, 249, 0.80) 100%
    );
  box-shadow:
    -6px 0 18px rgba(56, 110, 158, 0.09),
    inset 1px 0 0 rgba(255, 255, 255, 0.88);
}

.ai-panel.is-gemini.is-expanded {
  background:
    radial-gradient(ellipse 230px 190px at 48% 3%, rgba(186, 221, 254, 0.68), transparent 89%),
    linear-gradient(
      180deg,
      rgba(214, 235, 255, 0.82) 0%,
      rgba(238, 247, 255, 0.80) 41%,
      rgba(248, 251, 253, 0.84) 75%,
      rgba(249, 251, 253, 0.86) 100%
    );
}

.ai-panel.is-gemini .glass-pill {
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(255, 255, 255, 0.96);
}

.ai-panel.is-gemini .detect-btn {
  background: linear-gradient(100deg, rgba(255, 255, 255, 0.88), rgba(181, 222, 252, 0.65));
  border: 1px solid #ffffff;
}

.ai-panel.is-gemini .assistant-badge-btn .brand-icon-lg {
  filter: drop-shadow(0 8px 16px rgba(78, 150, 249, 0.24));
}

.ai-panel.is-open {
  pointer-events: auto;
  transform: translateX(0);
  opacity: 1;
}

.ai-panel.is-expanded {
  width: 77.2%;
}

/* 窄版样式：未识屏前为安全区悬浮胶囊（顶部图标+问候，底部三枚 1:1 按钮）；识屏后无缝扩宽至 77.2% 全高 */
.ai-panel.is-narrow:not(.is-expanded):not(.is-recognized),
.ai-panel.is-narrow.is-gemini:not(.is-expanded):not(.is-recognized) {
  top: var(--safe-top, 44px);
  bottom: 26px;
  right: 8px;
  width: calc(21.48% - 8px);
  min-width: 84px;
  border-radius: 24px;
  border: 0.5px solid rgba(255, 255, 255, 0.55);
  box-shadow:
    0 4px 14px rgba(32, 58, 92, 0.05),
    0 1px 3px rgba(32, 58, 92, 0.03);
}
.ai-panel.is-narrow.is-recognized:not(.is-expanded),
.ai-panel.is-narrow.is-gemini.is-recognized:not(.is-expanded) {
  top: 0;
  bottom: 0;
  right: 0;
  width: 77.2%;
  border-radius: 26px 0 0 26px;
}
.ai-panel.is-narrow:not(.is-expanded):not(.is-recognized) .ai-compact {
  padding: 18px 8px 12px;
  justify-content: space-between;
  gap: 12px;
}
.ai-panel.is-narrow.is-recognized:not(.is-expanded) .ai-compact {
  padding: calc(var(--safe-top, 44px) + 14px) 18px calc(var(--safe-bottom, 34px) + 16px);
  justify-content: space-between;
  gap: 16px;
}
.ai-panel.is-narrow:not(.is-expanded):not(.is-recognized) .ai-recommendations {
  margin-top: auto;
  margin-bottom: 8px;
  gap: 8px;
  max-height: none;
}
.ai-panel.is-narrow.is-recognized:not(.is-expanded) .ai-recommendations {
  margin-top: auto;
  margin-bottom: 0;
  gap: 10px;
  max-height: 70%;
}
.narrow-brand-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.narrow-hero-top {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}
.narrow-back-btn {
  position: absolute;
  left: 0;
}
.ai-panel.is-narrow.is-recognized:not(.is-expanded) .narrow-brand-hero {
  width: 100%;
  align-items: center;
  padding: 0 2px;
  gap: 0;
}
.ai-panel.is-narrow.is-recognized:not(.is-expanded) .narrow-hero-top {
  justify-content: center;
}
.narrow-hello {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.3px;
  color: #111418;
}
.is-top-logo {
  align-self: center;
}
.is-top-logo .brand-icon-lg {
  width: 40px;
  height: 40px;
}
.pill-with-icon {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ai-panel.is-narrow:not(.is-expanded):not(.is-recognized) .glass-pill {
  border-radius: 16px;
  border: 0.5px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 6px rgba(15, 28, 46, 0.04);
  padding: 8px 6px;
  font-size: 11px;
  line-height: 1.3;
  overflow-wrap: break-word;
  word-break: break-word;
}
.ai-panel.is-narrow:not(.is-expanded):not(.is-recognized) .pill-with-icon,
.ai-panel.is-narrow:not(.is-expanded):not(.is-recognized) .detect-btn {
  aspect-ratio: 1 / 1;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 6px;
  padding: 6px;
  font-size: 11px;
  white-space: normal;
}
.ai-panel.is-narrow.is-recognized:not(.is-expanded) .glass-pill-tall,
.ai-panel.is-narrow.is-recognized:not(.is-expanded) .contact-card {
  text-align: left;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 12px 14px;
  font-size: 13.5px;
  line-height: 1.45;
  border-radius: 18px;
}
.ai-panel.is-narrow.is-recognized:not(.is-expanded) .contact-name {
  font-size: 15px;
}
.ai-panel.is-narrow.is-recognized:not(.is-expanded) .contact-phone {
  font-size: 12.5px;
}
.ai-panel.is-narrow.is-recognized:not(.is-expanded) .contact-save-btn {
  height: 32px;
  font-size: 12.5px;
  border-radius: 12px;
  margin-top: 8px;
}

/* 底部微弱氛围光晕（纯 CSS 渐变，无外部图片素材） */
.ai-ambient-glow {
  position: absolute;
  left: -40%;
  right: -20%;
  bottom: -40px;
  height: 150px;
  background:
    radial-gradient(ellipse at 60% 70%, rgba(120, 198, 240, 0.35), transparent 64%),
    radial-gradient(ellipse at 30% 85%, rgba(145, 224, 198, 0.32), transparent 68%);
  filter: blur(20px);
  pointer-events: none;
  z-index: 0;
}

/* ---- 小屏伴随态 ---- */
.ai-compact {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  padding: calc(var(--safe-top, 44px) + 14px) 10px calc(var(--safe-bottom, 34px) + 14px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ai-greeting {
  padding: 0 6px;
  font-size: 21px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.3px;
  color: #111418;
  white-space: pre-line;
}

.ai-recommendations {
  margin-top: auto;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 55%;
  overflow-y: auto;
  scrollbar-width: none;
}
.ai-recommendations::-webkit-scrollbar {
  display: none;
}

.glass-pill {
  width: 100%;
  border: 0.5px solid rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.38;
  color: #16181c;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 28, 46, 0.05);
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.18s ease;
}
.glass-pill:hover {
  background: rgba(255, 255, 255, 0.76);
}
.glass-pill:active {
  transform: scale(0.96);
}
.glass-pill-tall {
  padding: 9px 10px;
}

.contact-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px;
}
.contact-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #5c6670;
}
.contact-name {
  font-size: 13px;
  font-weight: 600;
  color: #111418;
  margin-top: 2px;
  white-space: normal;
  word-break: break-word;
}
.contact-phone {
  font-size: 11px;
  color: #5c6670;
  white-space: normal;
  word-break: break-word;
}
.contact-save-btn {
  margin-top: 6px;
  width: 100%;
  height: 28px;
  border-radius: 12px;
  border: 0.5px solid rgba(255, 255, 255, 0.72);
  background: rgba(255, 255, 255, 0.65);
  font-size: 11.5px;
  font-weight: 500;
  color: #111418;
  cursor: pointer;
}
.contact-save-btn:active {
  transform: scale(0.96);
}

.ai-compact-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.detect-btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  background: linear-gradient(110deg, rgba(255, 255, 255, 0.78), rgba(181, 222, 252, 0.62));
  font-weight: 600;
  white-space: nowrap;
}
.detect-btn.is-scanning {
  animation: pulseScan 0.9s ease-in-out infinite;
}
@keyframes pulseScan {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.15); }
  50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.22); }
}

.assistant-badge-btn {
  border: 0;
  background: transparent;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.16s ease;
}
.assistant-badge-btn:active {
  transform: scale(0.92);
}
.brand-icon-lg {
  width: 44px;
  height: 44px;
  object-fit: contain;
  display: block;
}
.brand-icon-lg.is-fola,
.brand-icon-lg[alt="Fola"] {
  transform: scale(1.26);
}
.brand-icon-md {
  width: 24px;
  height: 24px;
  object-fit: contain;
  display: block;
}
.brand-icon-sm {
  width: 18px;
  height: 18px;
  object-fit: contain;
  display: block;
}

/* ---- 大屏伴随态 ---- */
.ai-expanded {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: max(calc(var(--safe-top, 44px) + 6px), 48px);
  padding-bottom: calc(var(--safe-bottom, 24px) + 10px);
}

.expanded-header {
  flex: none;
  padding: 0 14px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.glass-circle-sm {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 0.5px solid rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #14171a;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex: none;
  transition: transform 0.15s ease, opacity 0.2s ease;
}
.glass-circle-sm:active {
  transform: scale(0.92);
}
.glass-circle-sm.is-muted {
  opacity: 0.5;
}

.model-chip {
  height: 34px;
  padding: 0 12px;
  border-radius: 17px;
  border: 0.5px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(16px);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  font-weight: 600;
  color: #14171a;
  cursor: pointer;
}
.model-chevron {
  opacity: 0.6;
}

.expanded-conversation {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 8px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.expanded-conversation::-webkit-scrollbar {
  display: none;
}

.empty-prompt {
  margin: auto;
  text-align: center;
  color: #4b5563;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.empty-prompt p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.msg-query-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.58);
  border: 0.5px solid rgba(255, 255, 255, 0.75);
  font-size: 11px;
  color: #475569;
}
.msg-query {
  max-width: 86%;
  padding: 10px 13px;
  border-radius: 18px 18px 4px 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 0.5px solid rgba(255, 255, 255, 0.85);
  font-size: 13.5px;
  line-height: 1.45;
  color: #111418;
}

.msg-reply-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.reply-brand {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 600;
  color: #14171a;
}
.reply-brand-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
  border: 0.5px solid rgba(255, 255, 255, 0.9);
  display: grid;
  place-items: center;
  color: #007aff;
}
.reply-body {
  font-size: 13.5px;
  line-height: 1.55;
  color: #1f2937;
}
.reply-body p {
  margin: 0;
}
.reply-body p + p {
  margin-top: 8px;
}
.reply-disclaimer {
  font-size: 10.5px;
  color: #6b7280;
}
.reply-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 2px;
}
.reply-actions .spacer {
  flex: 1;
}
.reply-actions button {
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.45);
  color: #374151;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.reply-actions button:active {
  transform: scale(0.9);
}

.expanded-composer {
  flex: none;
  padding: 6px 14px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.draft-context-pill {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.68);
  border: 0.5px solid rgba(255, 255, 255, 0.85);
  font-size: 11px;
  color: #334155;
}
.draft-context-pill button {
  border: 0;
  background: transparent;
  padding: 0;
  display: grid;
  place-items: center;
  color: #64748b;
  cursor: pointer;
}
.composer-glass-row {
  height: 44px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  border: 0.5px solid rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 0 6px 0 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 14px rgba(15, 28, 46, 0.08);
}
.composer-glass-row input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 13.5px;
  color: #14171a;
}
.composer-glass-row input::placeholder {
  color: #6b7280;
}
.composer-icon-btn {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #4b5563;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex: none;
}
.composer-send-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: #007aff;
  color: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex: none;
  transition: transform 0.14s ease;
}
.composer-send-btn:active {
  transform: scale(0.9);
}

/* ---- Toast ---- */
.ai-toast {
  position: absolute;
  left: 50%;
  bottom: calc(var(--safe-bottom, 34px) + 64px);
  transform: translate(-50%, 10px);
  max-width: calc(100% - 32px);
  padding: 8px 16px;
  border-radius: 18px;
  background: rgba(28, 32, 38, 0.84);
  backdrop-filter: blur(18px);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 500;
  text-align: center;
  white-space: normal;
  opacity: 0;
  pointer-events: none;
  z-index: 10;
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.ai-toast.is-visible {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* ---- Gemini 专属样式（草稿卡片 + 虚拟键盘 + 头部胶囊） ---- */
.gemini-auto-tag {
  font-weight: 400;
  color: #6b7280;
}
.gemini-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #1685ff;
  display: block;
}
.gemini-header-pill {
  height: 36px;
  padding: 0 6px;
  border-radius: 18px;
  border: 0.5px solid rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  gap: 2px;
}
.gemini-header-pill button {
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: #14171a;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.ai-expanded.is-drafting {
  justify-content: flex-end;
  padding-bottom: 0;
}
.ai-expanded.is-drafting .expanded-header {
  margin-bottom: auto;
}
.gemini-draft-card {
  margin: 0 14px 14px;
  padding: 12px 14px 10px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.86);
  border: 0.5px solid rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(22px);
  box-shadow: 0 8px 24px rgba(15, 28, 46, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: aiEntrance 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.fola-expanded-header {
  align-items: center;
  gap: 10px;
  padding: 2px 14px 12px;
}
.fola-large-title {
  flex: 1;
  min-width: 0;
  font-size: 16.5px;
  font-weight: 600;
  line-height: 21px;
  color: #14171a;
  letter-spacing: -0.2px;
}
.fola-mute-btn {
  width: 40px;
  height: 40px;
}
.composer-fola-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex: none;
  margin-left: 2px;
}

.gemini-draft-thumb {
  position: relative;
  align-self: flex-start;
  width: 94px;
  height: 44px;
  border-radius: 22px;
  background: #f4f5f7;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  padding: 6px 8px;
}
.gemini-draft-thumb .thumb-remove-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 21px;
  height: 21px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.14);
  color: #14171a;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}
.sent-attachment-thumb {
  width: 94px;
  height: 94px;
  border-radius: 18px;
  background: #f4f5f7;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.mini-wa {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mini-wa-bar {
  height: 6px;
  width: 65%;
  border-radius: 3px;
  background: #16a363;
  opacity: 0.7;
}
.mini-wa-b {
  height: 8px;
  width: 72%;
  border-radius: 4px;
  background: #ffffff;
}
.mini-wa-b.is-me {
  align-self: flex-end;
  background: #c8f7c0;
}
.mini-article {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mini-art-title {
  font-size: 7.5px;
  font-weight: 700;
  color: #111418;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
}
.mini-art-line {
  height: 3.5px;
  width: 90%;
  border-radius: 2px;
  background: rgba(17, 20, 24, 0.25);
}
.mini-art-line.short {
  width: 62%;
}
.gemini-draft-card textarea {
  width: 100%;
  border: 0;
  outline: 0;
  resize: none;
  background: transparent;
  font-family: var(--font-stack);
  font-size: 15px;
  line-height: 1.45;
  color: #111418;
}
.gemini-draft-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.gemini-send-arrow {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: #cfe7ff;
  color: #101316;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.14s ease, background 0.16s ease;
}
.gemini-send-arrow:active {
  transform: scale(0.9);
  background: #badcff;
}
.gemini-keyboard {
  flex: none;
  background: rgba(225, 228, 235, 0.78);
  backdrop-filter: blur(24px);
  padding: 24px 4px calc(var(--safe-bottom, 20px) + 6px);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: aiEntrance 0.44s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.kb-collapse-btn {
  position: absolute;
  top: 4px;
  right: 8px;
  border: 0;
  background: transparent;
  color: #374151;
  padding: 2px;
  cursor: pointer;
}
.kb-row {
  display: flex;
  gap: 4px;
}
.kb-row-mid {
  padding: 0 12px;
}
.kb-key {
  flex: 1;
  min-width: 0;
  height: 32px;
  border: 0;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  color: #17191d;
  font-size: 15px;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
}
.kb-key:active {
  background: #cfe7ff;
}
.kb-key-fn {
  background: rgba(247, 248, 250, 0.85);
  font-size: 14px;
}
.kb-key-sm {
  flex: 0 0 32px;
  font-size: 12px;
}
.kb-key-space {
  flex: 1;
}
.kb-key-enter {
  flex: 0 0 56px;
  font-size: 16px;
}

/* ---- 还原演示入场与段落渐显动效 ---- */
.ai-panel.is-open .ai-greeting {
  animation: aiEntrance 0.48s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both;
}
.ai-panel.is-open .ai-recommendations {
  animation: aiEntrance 0.48s cubic-bezier(0.22, 1, 0.36, 1) 0.11s both;
}
.ai-panel.is-open .detect-btn {
  animation: aiEntrance 0.48s cubic-bezier(0.22, 1, 0.36, 1) 0.16s both;
}
.ai-panel.is-open .assistant-badge-btn {
  animation: aiEntrance 0.48s cubic-bezier(0.22, 1, 0.36, 1) 0.21s both;
}
.ai-panel.is-recognized .glass-pill-tall,
.ai-panel.is-recognized .contact-card {
  animation: aiEntrance 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both;
}
.msg-query-wrap {
  animation: aiBubbleEnter 0.5s cubic-bezier(0.2, 1.25, 0.3, 1) both;
}
.reply-brand {
  animation: aiEntrance 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both;
}
.reply-body p {
  animation: aiParagraphReveal 0.72s cubic-bezier(0.17, 1.09, 0.35, 1) both;
}
.reply-body p:nth-child(2) {
  animation-delay: 0.24s;
}
.reply-body p:nth-child(3) {
  animation-delay: 0.48s;
}
@keyframes aiEntrance {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  78% { opacity: 1; transform: translateY(-1px) scale(1.003); }
  to { opacity: 1; transform: none; }
}
@keyframes aiBubbleEnter {
  from { opacity: 0; filter: blur(8px); transform: translateY(12px) scale(0.94); }
  to { opacity: 1; filter: blur(0); transform: none; }
}
@keyframes aiParagraphReveal {
  0% { opacity: 0; filter: blur(10px); transform: translateY(12px) scale(0.985); }
  58% { opacity: 0.86; filter: blur(3px); }
  100% { opacity: 1; filter: blur(0); transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ai-panel, .ai-panel * {
    transition: none !important;
    animation: none !important;
  }
}
</style>
