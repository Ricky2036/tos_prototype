<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import iconClose from '../../../../assets/island/translation/icon_close.svg'
import iconMic from '../../../../assets/island/translation/icon_mic.svg'
import iconSpeaker from '../../../../assets/island/translation/icon_speaker.svg'

const store = useOs16IslandStore()

const isListening = computed(() => store.translationState?.isListening ?? true)
const isSpeaking = computed(() => store.translationState?.isSpeaking ?? false)

function onClose() {
  store.closeTemplate()
}

function onToggleMic() {
  store.toggleListening()
}

function onToggleSpeaker() {
  store.toggleSpeaking()
}
</script>

<template>
  <div class="os16-trans-card" role="region" aria-label="同声传译实时卡片">
    <!-- 上半部分：源语言与原文 -->
    <div class="trans-section src-section">
      <div class="lang-tag src-tag">English</div>
      <div class="content-text src-text">
        I don't wanna tiptoe, but I don't wanna hi...
      </div>
    </div>

    <!-- 中部分割微细线 -->
    <div class="trans-divider"></div>

    <!-- 下半部分：目标语言与译文 -->
    <div class="trans-section tgt-section">
      <div class="lang-tag tgt-tag">Chinese</div>
      <div class="content-text tgt-text">
        我不想蹑手蹑脚，也不想躲躲藏藏。更不想给这滔天大火火上浇油，只想让这个故事消亡。让一切好起来。我们没办法成为朋友，但我希望我能够……
      </div>
    </div>

    <!-- 底部功能按键行：关闭 + 麦克风拾音 + 扬声器播报 -->
    <div class="trans-controls-row">
      <!-- 1. 关闭按钮 -->
      <button class="trans-btn btn-secondary" @click.stop="onClose" title="关闭翻译">
        <img :src="iconClose" alt="关闭" class="btn-icon icon-close" />
      </button>

      <!-- 2. 核心麦克风拾音控制按钮 -->
      <button
        class="trans-btn btn-primary"
        :class="{ 'is-muted': !isListening }"
        @click.stop="onToggleMic"
        title="暂停/开启拾音"
      >
        <img :src="iconMic" alt="麦克风" class="btn-icon" />
      </button>

      <!-- 3. 扬声器播报控制按钮 -->
      <button
        class="trans-btn btn-secondary"
        :class="{ 'is-speaking': isSpeaking }"
        @click.stop="onToggleSpeaker"
        title="朗读译文"
      >
        <img :src="iconSpeaker" alt="扬声器" class="btn-icon" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.os16-trans-card {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  background: transparent;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  user-select: none;
  overflow: hidden;
}

.trans-section {
  display: flex;
  flex-direction: column;
}

.lang-tag {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  margin-bottom: 3px;
}

.src-tag {
  color: rgba(255, 255, 255, 0.6);
}

.tgt-tag {
  color: #53a3ff;
}

.content-text {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", sans-serif;
  line-height: 1.35;
  letter-spacing: -0.15px;
}

.src-text {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tgt-text {
  font-size: 13.5px;
  color: #53a3ff;
  font-weight: 400;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trans-divider {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 6px 0;
}

/* 底部操作按键行 */
.trans-controls-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  height: 44px;
  margin-top: 4px;
}

.trans-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.15s ease;
}

.trans-btn:active {
  transform: scale(0.92);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.16);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.24);
}

.btn-secondary.is-speaking {
  background: rgba(83, 163, 255, 0.35);
  box-shadow: 0 0 10px rgba(83, 163, 255, 0.4);
}

.btn-primary {
  background: #0066ff;
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.35);
}

.btn-primary:hover {
  background: #1a75ff;
}

.btn-primary.is-muted {
  background: #3a3a3c;
  box-shadow: none;
  opacity: 0.7;
}

.btn-icon {
  display: block;
}

.icon-close {
  width: 14px;
  height: 14px;
}
</style>
