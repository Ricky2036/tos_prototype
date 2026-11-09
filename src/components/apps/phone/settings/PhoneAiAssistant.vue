<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import { useSubPageNav } from '../../../../composables/useSubPageNav'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'
import SheetModal from '../../../ui/SheetModal.vue'
import '../../../../styles/layer-transitions.css'

import aiHeroImg from '../../../../assets/img/phone_settings/ai_assistant_hero.png'
import aiTransHeroImg from '../../../../assets/img/phone_settings/ai_translation_hero.png'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

// 统一层级导航状态机：'main' | 'summary' | 'translation'
const { activeSubView: currentView, isBack, openSubView, closeSubView } = useSubPageNav('main')
const activeSlide = ref(0)

// 模态弹窗状态
const modalType = ref(null) // null | 'language' | 'targetLanguage' | 'myVoice' | 'targetVoice' | 'autoUpdate' | 'privacy' | 'terms'

function handleBack() {
  if (modalType.value) {
    modalType.value = null
    return
  }
  if (currentView.value !== 'main') {
    closeSubView()
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
      return closeSubView()
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
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- 主界面：AI 通话助手 -->
      <div v-if="currentView === 'main'" key="main" class="subpage-view-pane">
        <GlassNavBar overlay title="AI 通话助手" @back="handleBack" />

        <div class="subpage-body scrollable">
          <!-- 顶部引导图卡片 -->
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
            <div class="settings-row chevron-item" @click="openSubView('summary')">
              <div class="row-label">通话摘要</div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
                <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <div class="settings-row chevron-item no-sep" @click="openSubView('translation')">
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
      <div v-else-if="currentView === 'summary'" key="summary" class="subpage-view-pane">
        <GlassNavBar overlay title="通话摘要" @back="handleBack" />

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
      <div v-else-if="currentView === 'translation'" key="translation" class="subpage-view-pane">
        <GlassNavBar overlay title="AI 通话翻译" @back="handleBack" />

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
    </Transition>

    <!-- 语言选择弹窗（规范 SheetOptionPicker） -->
    <SheetOptionPicker
      :visible="modalType === 'language' || modalType === 'targetLanguage'"
      :title="modalType === 'language' ? '选择我的语言' : '选择对方的语言'"
      :options="languages.map(l => ({ label: l, value: l }))"
      :modelValue="modalType === 'language' ? phoneStore.settings.aiMyLanguage : phoneStore.settings.aiTargetLanguage"
      @pick="lang => {
        if (modalType === 'language') phoneStore.settings.aiMyLanguage = lang
        else phoneStore.settings.aiTargetLanguage = lang
      }"
      @close="modalType = null"
    />

    <!-- 语音音色选择弹窗（规范 SheetOptionPicker） -->
    <SheetOptionPicker
      :visible="modalType === 'myVoice' || modalType === 'targetVoice'"
      :title="modalType === 'myVoice' ? '我的语音' : '对方的语音'"
      :options="voiceOptions.map(v => ({ label: v, value: v }))"
      :modelValue="modalType === 'myVoice' ? phoneStore.settings.aiMyVoice : phoneStore.settings.aiTargetVoice"
      @pick="voice => {
        if (modalType === 'myVoice') phoneStore.settings.aiMyVoice = voice
        else phoneStore.settings.aiTargetVoice = voice
      }"
      @close="modalType = null"
    />

    <!-- 自动更新数据选择弹窗（规范 SheetOptionPicker） -->
    <SheetOptionPicker
      :visible="modalType === 'autoUpdate'"
      title="自动更新数据"
      :options="updateOptions.map(u => ({ label: u, value: u }))"
      v-model="phoneStore.settings.aiAutoUpdate"
      @close="modalType = null"
    />

    <!-- 协议说明弹窗（规范 SheetModal） -->
    <SheetModal :visible="modalType === 'privacy' || modalType === 'terms'" padding="22px 18px 18px" @close="modalType = null">
      <div class="dialog-title">{{ modalType === 'privacy' ? '隐私政策' : '用户协议' }}</div>
      <div class="dialog-body-text">
        SmartCaller AI 通话助手严格保护您的隐私，所有端侧模型运算与实时翻译均遵循设备端数据安全策略，未经用户授权不会上传个人敏感音频内容。
      </div>
      <button class="dialog-full-btn" type="button" @click="modalType = null">我知道了</button>
    </SheetModal>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F2;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-body {
  flex: 1;
  padding: calc(var(--nav-h) + 10px) 16px 40px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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
  margin-top: 14px;
}

.carousel-dots {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}

.c-dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: #E5E7EB;
  transition: all 0.2s ease;
  cursor: pointer;
}

.c-dot.active {
  width: 16px;
  background: #00C853;
}

/* 统一白卡分组 */
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

.chevron-item {
  cursor: pointer;
}

.chevron-item:active {
  background-color: #F8F9FA;
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

.right-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-text {
  font-size: 14px;
  color: #8E8E93;
}

/* 弹窗细节 */
.dialog-title {
  font-size: 17px;
  font-weight: 700;
  color: #111;
  text-align: center;
  margin-bottom: 14px;
}

.dialog-body-text {
  font-size: 14px;
  line-height: 1.6;
  color: #444444;
  margin-bottom: 20px;
  text-align: justify;
}

.dialog-full-btn {
  width: 100%;
  height: 46px;
  background: #00C853;
  color: #FFFFFF;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.dialog-full-btn:active {
  background: #00B248;
}
</style>
