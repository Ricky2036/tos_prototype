<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import aiHeroImg from '../../../../assets/img/phone_settings/ai_assistant_hero.png'
import aiTransHeroImg from '../../../../assets/img/phone_settings/ai_translation_hero.png'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

// 当前视图：'main' | 'summary' | 'translation'
const currentView = ref('main')
const activeSlide = ref(0)

// 模态弹窗状态
const modalType = ref(null) // null | 'language' | 'targetLanguage' | 'myVoice' | 'targetVoice' | 'autoUpdate' | 'privacy' | 'terms'

function handleBack() {
  if (modalType.value) {
    modalType.value = null
    return
  }
  if (currentView.value !== 'main') {
    currentView.value = 'main'
    return
  }
  emit('back')
}

defineExpose({
  back() {
    if (modalType.value) {
      modalType.value = null
      return true
    }
    if (currentView.value !== 'main') {
      currentView.value = 'main'
      return true
    }
    return false
  }
})

const languages = ['英语', '中文', '法语', '西班牙语', '阿拉伯语']
const voiceOptions = ['男', '女']
const updateOptions = ['仅 WLAN', '移动网络和 WLAN']
</script>

<template>
  <div class="phone-settings-subpage">
    <!-- 主界面：AI 通话助手 -->
    <div v-if="currentView === 'main'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">AI 通话助手</div>
      </div>

      <div class="subpage-body scrollable">
        <!-- 顶部引导图卡片（100% 对齐真机插画比例与沉稳圆角卡片） -->
        <div class="ai-hero-card">
          <div class="hero-image-wrap">
            <img :src="aiHeroImg" class="hero-img" alt="AI 通话助手插画" />
          </div>
          <div class="ai-caption-text">
            通话结束后自动生成对话内容的简洁总结，帮助用户快速回顾通话重点。
          </div>
          <div class="carousel-dots">
            <span class="c-dot" :class="{ active: activeSlide === 0 }" @click="activeSlide = 0"></span>
            <span class="c-dot" :class="{ active: activeSlide === 1 }" @click="activeSlide = 1"></span>
          </div>
        </div>

        <!-- 功能菜单卡片分组 -->
        <div class="settings-card">
          <div class="settings-row chevron-item" @click="currentView = 'summary'">
            <div class="row-label">通话摘要</div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="settings-row chevron-item no-sep" @click="currentView = 'translation'">
            <div class="title-with-badge">
              <span class="row-label">AI 通话翻译</span>
              <span class="red-dot"></span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 四级子页：通话摘要 -->
    <div v-else-if="currentView === 'summary'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">通话摘要</div>
      </div>

      <div class="subpage-body scrollable">
        <div class="ai-hero-card">
          <div class="hero-image-wrap">
            <img :src="aiHeroImg" class="hero-img" alt="通话摘要插画" />
          </div>
          <div class="ai-caption-text">
            通话结束后自动生成对话内容的简洁总结，帮助用户快速回顾通话重点。
          </div>
        </div>

        <div class="settings-card">
          <div class="settings-row item-switch">
            <div class="row-label">通话摘要</div>
            <ToggleSwitch v-model="phoneStore.settings.aiSummary" />
          </div>

          <div class="settings-row chevron-item no-sep" @click="modalType = 'language'">
            <div class="row-label">我的语言</div>
            <div class="right-summary">
              <span class="summary-text">{{ phoneStore.settings.aiMyLanguage }}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="settings-card">
          <div class="settings-row chevron-item" @click="modalType = 'privacy'">
            <div class="row-label">隐私政策</div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="settings-row chevron-item no-sep" @click="modalType = 'terms'">
            <div class="row-label">用户协议</div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 四级子页：AI 通话翻译 -->
    <div v-else-if="currentView === 'translation'" class="subpage-pane">
      <div class="subpage-header">
        <button class="back-btn" title="返回" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <div class="header-title">AI 通话翻译</div>
      </div>

      <div class="subpage-body scrollable">
        <div class="ai-hero-card">
          <div class="hero-image-wrap">
            <img :src="aiTransHeroImg" class="hero-img" alt="AI 通话翻译插画" />
          </div>
          <div class="ai-caption-text">
            在通话期间实时获取通话翻译。点击通话界面上的“AI 通话翻译”功能，即可开始翻译。
          </div>
        </div>

        <!-- 翻译主开关 -->
        <div class="settings-card">
          <div class="settings-row item-switch no-sep">
            <div class="row-label">AI 通话翻译</div>
            <ToggleSwitch v-model="phoneStore.settings.aiTranslate" />
          </div>
        </div>

        <template v-if="phoneStore.settings.aiTranslate">
          <!-- 分组：我的 -->
          <div class="section-caption">我的</div>
          <div class="settings-card">
            <div class="settings-row chevron-item" @click="modalType = 'language'">
              <div class="row-label">我的语言</div>
              <div class="right-summary">
                <span class="summary-text">{{ phoneStore.settings.aiMyLanguage }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                  <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="settings-row chevron-item" @click="modalType = 'myVoice'">
              <div class="row-label">我的语音</div>
              <div class="right-summary">
                <span class="summary-text">{{ phoneStore.settings.aiMyVoice }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                  <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="settings-row item-switch with-sub no-sep">
              <div class="label-col">
                <div class="row-label">静音我的原声</div>
                <div class="row-sub">对方仅能听到您所说内容的翻译播报。</div>
              </div>
              <ToggleSwitch v-model="phoneStore.settings.aiMuteMyVoice" />
            </div>
          </div>

          <!-- 分组：对方 -->
          <div class="section-caption">对方</div>
          <div class="settings-card">
            <div class="settings-row chevron-item" @click="modalType = 'targetLanguage'">
              <div class="row-label">对方的语言</div>
              <div class="right-summary">
                <span class="summary-text">{{ phoneStore.settings.aiTargetLanguage }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                  <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="settings-row chevron-item no-sep" @click="modalType = 'targetVoice'">
              <div class="row-label">对方的语音</div>
              <div class="right-summary">
                <span class="summary-text">{{ phoneStore.settings.aiTargetVoice }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                  <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 自动更新数据 -->
          <div class="settings-card">
            <div class="settings-row chevron-item no-sep" @click="modalType = 'autoUpdate'">
              <div class="row-label">自动更新数据</div>
              <div class="right-summary">
                <span class="summary-text">{{ phoneStore.settings.aiAutoUpdate }}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                  <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 语言选择弹窗 -->
    <Transition name="fade">
      <div v-if="modalType === 'language' || modalType === 'targetLanguage'" class="modal-overlay" @click.self="modalType = null">
        <div class="action-sheet-card">
          <div class="sheet-title">{{ modalType === 'language' ? '选择我的语言' : '选择对方的语言' }}</div>
          <div class="sheet-options">
            <div
              v-for="lang in languages"
              :key="lang"
              class="sheet-radio-row"
              @click="
                if (modalType === 'language') phoneStore.settings.aiMyLanguage = lang;
                else phoneStore.settings.aiTargetLanguage = lang;
                modalType = null;
              "
            >
              <span class="sheet-label">{{ lang }}</span>
              <div
                class="custom-radio"
                :class="{ checked: (modalType === 'language' ? phoneStore.settings.aiMyLanguage : phoneStore.settings.aiTargetLanguage) === lang }"
              >
                <div
                  v-if="(modalType === 'language' ? phoneStore.settings.aiMyLanguage : phoneStore.settings.aiTargetLanguage) === lang"
                  class="radio-inner"
                ></div>
              </div>
            </div>
          </div>
          <button class="sheet-cancel-btn" @click="modalType = null">取消</button>
        </div>
      </div>
    </Transition>

    <!-- 语音音色选择弹窗（男 / 女） -->
    <Transition name="fade">
      <div v-if="modalType === 'myVoice' || modalType === 'targetVoice'" class="modal-overlay" @click.self="modalType = null">
        <div class="action-sheet-card">
          <div class="sheet-title">{{ modalType === 'myVoice' ? '我的语音' : '对方的语音' }}</div>
          <div class="sheet-options">
            <div
              v-for="voice in voiceOptions"
              :key="voice"
              class="sheet-radio-row"
              @click="
                if (modalType === 'myVoice') phoneStore.settings.aiMyVoice = voice;
                else phoneStore.settings.aiTargetVoice = voice;
                modalType = null;
              "
            >
              <span class="sheet-label">{{ voice }}</span>
              <div
                class="custom-radio"
                :class="{ checked: (modalType === 'myVoice' ? phoneStore.settings.aiMyVoice : phoneStore.settings.aiTargetVoice) === voice }"
              >
                <div
                  v-if="(modalType === 'myVoice' ? phoneStore.settings.aiMyVoice : phoneStore.settings.aiTargetVoice) === voice"
                  class="radio-inner"
                ></div>
              </div>
            </div>
          </div>
          <button class="sheet-cancel-btn" @click="modalType = null">取消</button>
        </div>
      </div>
    </Transition>

    <!-- 自动更新数据选择弹窗 -->
    <Transition name="fade">
      <div v-if="modalType === 'autoUpdate'" class="modal-overlay" @click.self="modalType = null">
        <div class="action-sheet-card">
          <div class="sheet-title">自动更新数据</div>
          <div class="sheet-options">
            <div
              v-for="opt in updateOptions"
              :key="opt"
              class="sheet-radio-row"
              @click="phoneStore.settings.aiAutoUpdate = opt; modalType = null"
            >
              <span class="sheet-label">{{ opt }}</span>
              <div class="custom-radio" :class="{ checked: phoneStore.settings.aiAutoUpdate === opt }">
                <div v-if="phoneStore.settings.aiAutoUpdate === opt" class="radio-inner"></div>
              </div>
            </div>
          </div>
          <button class="sheet-cancel-btn" @click="modalType = null">取消</button>
        </div>
      </div>
    </Transition>

    <!-- 协议说明弹窗 -->
    <Transition name="fade">
      <div v-if="modalType === 'privacy' || modalType === 'terms'" class="modal-overlay" @click.self="modalType = null">
        <div class="alert-dialog-card">
          <div class="dialog-title">{{ modalType === 'privacy' ? '隐私政策' : '用户协议' }}</div>
          <div class="dialog-body-text">
            SmartCaller AI 通话助手严格保护您的隐私，所有端侧模型运算与实时翻译均遵循设备端数据安全策略，未经用户授权不会上传个人敏感音频内容。
          </div>
          <button class="dialog-full-btn" @click="modalType = null">我知道了</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F3;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.subpage-header {
  display: flex;
  align-items: center;
  padding-top: calc(var(--safe-top, 54px) + 8px);
  padding-bottom: 12px;
  padding-left: 16px;
  padding-right: 16px;
  background: #F0F1F3;
}

.back-btn {
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.back-btn:active {
  background-color: #E8E9EB;
  transform: scale(0.96);
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1C1C1E;
  margin-left: 12px;
}

.subpage-body {
  flex: 1;
  padding: 12px 16px 40px;
}

/* 顶部引导插画卡片 */
.ai-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 18px;
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.hero-image-wrap {
  width: 100%;
  max-width: 280px;
  aspect-ratio: 1.28 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.ai-caption-text {
  font-size: 13px;
  color: #8E8E93;
  text-align: center;
  line-height: 1.5;
  margin: 14px 8px 8px;
}

.carousel-dots {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.c-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: #D1D1D6;
  transition: all 0.2s ease;
  cursor: pointer;
}

.c-dot.active {
  width: 16px;
  background: #00C853;
}

/* 白色卡片分组 */
.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.section-caption {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 8px 8px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  min-height: 52px;
  border-bottom: 0.5px solid #F0F1F3;
  box-sizing: border-box;
}

.settings-row.no-sep {
  border-bottom: none;
}

.row-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.red-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #FF3B30;
}

.chevron-item {
  cursor: pointer;
}

.chevron-item:active {
  background-color: #F8F9FA;
}

.right-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-text {
  font-size: 15px;
  color: #8E8E93;
}

.with-sub {
  align-items: flex-start;
}

.label-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 240px;
}

.row-sub {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.4;
}

/* 弹窗样式 */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.action-sheet-card {
  width: 100%;
  background: #F8F9FA;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px 16px calc(var(--safe-bottom, 20px) + 16px);
  box-sizing: border-box;
}

.sheet-title {
  font-size: 17px;
  font-weight: 700;
  color: #1C1C1E;
  text-align: center;
  margin-bottom: 16px;
}

.sheet-options {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
}

.sheet-radio-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 0.5px solid #F0F1F3;
  cursor: pointer;
}

.sheet-radio-row:last-child {
  border-bottom: none;
}

.sheet-radio-row:active {
  background: #F2F3F5;
}

.sheet-label {
  font-size: 16px;
  color: #1C1C1E;
}

.custom-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #D1D1D6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.custom-radio.checked {
  border-color: #00C853;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #00C853;
}

.sheet-cancel-btn {
  width: 100%;
  height: 50px;
  background: #FFFFFF;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
  border: none;
  cursor: pointer;
}

.sheet-cancel-btn:active {
  background: #F2F3F5;
}

.alert-dialog-card {
  width: calc(100% - 48px);
  max-width: 320px;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 20px 18px;
  margin-bottom: auto;
  margin-top: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  text-align: center;
  margin-bottom: 14px;
}

.dialog-body-text {
  font-size: 14px;
  color: #666666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.dialog-full-btn {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: #00C853;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
</style>
