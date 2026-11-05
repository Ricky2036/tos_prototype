<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

const activeSlide = ref(0)
</script>

<template>
  <div class="phone-settings-subpage">
    <div class="subpage-header">
      <button class="back-btn" @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="header-title">AI 通话助手</div>
    </div>

    <div class="subpage-body scrollable">
      <!-- 顶部功能插画走马灯卡片 -->
      <div class="ai-hero-card">
        <div class="mockup-frame">
          <div class="mockup-screen">
            <div class="mockup-top-lines">
              <div class="line l1"></div>
              <div class="line l2"></div>
            </div>
            <div class="mockup-dialpad">
              <div class="mockup-dot"></div>
              <div class="mockup-dot"></div>
              <div class="mockup-dot"></div>
              <div class="mockup-dot highlight"></div>
              <div class="mockup-dot"></div>
              <div class="mockup-dot"></div>
              <div class="mockup-dot"></div>
              <div class="mockup-dot hangup"></div>
              <div class="mockup-dot"></div>
            </div>
          </div>
        </div>
        <div class="ai-caption-text">
          通话结束后自动生成对话内容的简洁总结，帮助用户快速回顾通话重点。
        </div>
        <div class="carousel-dots">
          <span class="c-dot" :class="{ active: activeSlide === 0 }"></span>
          <span class="c-dot" :class="{ active: activeSlide === 1 }"></span>
        </div>
      </div>

      <!-- 核心功能项 -->
      <div class="features-card">
        <div class="settings-row chevron-item">
          <div class="row-label">通话摘要</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="settings-row chevron-item">
          <div class="row-label">
            AI 通话翻译
            <span class="red-dot"></span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FFFFFF;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-header {
  display: flex;
  align-items: center;
  padding-top: calc(var(--safe-top, 54px) + 8px);
  padding-bottom: 12px;
  padding-left: 16px;
  padding-right: 16px;
  gap: 12px;
  background: #FFFFFF;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
}

.back-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
}

.subpage-body {
  flex: 1;
  padding: 16px 20px 40px;
}

/* 插画 Hero 卡片 */
.ai-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 16px;
  background: #F9FAFB;
  border-radius: 20px;
  margin-bottom: 24px;
}

.mockup-frame {
  width: 140px;
  height: 200px;
  border: 3px solid #D1D5DB;
  border-radius: 24px;
  padding: 14px 10px;
  background: #FFFFFF;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.mockup-screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.mockup-top-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.line {
  height: 8px;
  border-radius: 4px;
  background: #E5E7EB;
}
.line.l1 { width: 80%; }
.line.l2 { width: 55%; }

.mockup-dialpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  justify-items: center;
  margin-top: 20px;
}

.mockup-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #E5E7EB;
}

.mockup-dot.highlight {
  border: 2px solid #6B7280;
  background: none;
}

.mockup-dot.hangup {
  background: #EF4444;
}

.ai-caption-text {
  font-size: 13px;
  color: #6B7280;
  text-align: center;
  line-height: 1.5;
  margin: 18px 10px 12px;
}

.carousel-dots {
  display: flex;
  gap: 6px;
}

.c-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #D1D5DB;
}

.c-dot.active {
  background: #1C1C1E;
}

/* 列表项 */
.features-card {
  display: flex;
  flex-direction: column;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.row-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
  display: flex;
  align-items: center;
  gap: 6px;
}

.red-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FF3B30;
}
</style>
