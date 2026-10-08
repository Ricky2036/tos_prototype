<script setup>
import { ref } from 'vue'
import walletBannerImg from '../../../assets/img/wallet-hero-banner.jpg'

const emit = defineEmits(['back'])

// 底部悬浮标签栏当前选中的标签
const currentTab = ref('cards')

// 轻提示反馈
const toastText = ref('')
let toastTimer = null

function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2000)
}

function handleAddCard() {
  showToast('已进入添加卡券')
}

function handleCardItem(name) {
  showToast(`${name}功能开发中`)
}

function handleTabClick(tabId, name) {
  currentTab.value = tabId
  if (tabId !== 'cards') {
    showToast(`已切换至${name}`)
  }
}
</script>

<template>
  <div class="settings-wallet-page">
    <!-- 顶部导航条：返回按钮 + 大标题卡包 -->
    <div class="wallet-nav-bar">
      <button class="nav-round-btn" aria-label="返回" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="wallet-nav-title">卡包</h1>
    </div>

    <!-- 主滚动区域 -->
    <div class="wallet-scroll-body scrollable">
      <!-- 顶部焦点卡片：卡券横幅 + 引导文案 + 添加按钮 -->
      <div class="wallet-hero-card">
        <div class="hero-banner-wrap">
          <img class="hero-banner-img" :src="walletBannerImg" alt="卡券横幅" />
          <div class="hero-gradient-overlay"></div>
        </div>

        <div class="hero-body">
          <h2 class="hero-title">卡券</h2>
          <p class="hero-desc">即刻添加，解锁数字权益与专属会员服务</p>

          <button class="hero-add-button" @click="handleAddCard">
            + 去添加
          </button>
        </div>
      </div>

      <!-- 分组功能卡片：门禁卡与证件 -->
      <div class="wallet-section-card">
        <!-- 门禁卡 -->
        <div class="wallet-cell-row" @click="handleCardItem('门禁卡')">
          <div class="wallet-cell-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="3" width="14" height="18" rx="3" stroke="#1C1C1E" stroke-width="2.2" />
              <line x1="15" y1="11" x2="15" y2="13" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" />
            </svg>
          </div>
          <div class="wallet-cell-main">
            <div class="wallet-cell-col">
              <div class="wallet-cell-title">门禁卡</div>
              <div class="wallet-cell-sub">一碰开门，轻装出行</div>
            </div>
            <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
              <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- 证件 -->
        <div class="wallet-cell-row no-border" @click="handleCardItem('证件')">
          <div class="wallet-cell-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="3" stroke="#1C1C1E" stroke-width="2.2" />
              <circle cx="8" cy="10" r="1.8" stroke="#1C1C1E" stroke-width="1.8" />
              <path d="M5.5 15c.5-1.5 1.5-2 2.5-2s2 .5 2.5 2" stroke="#1C1C1E" stroke-width="1.8" stroke-linecap="round" />
              <line x1="13.5" y1="10" x2="17.5" y2="10" stroke="#1C1C1E" stroke-width="1.8" stroke-linecap="round" />
              <line x1="13.5" y1="14" x2="17.5" y2="14" stroke="#1C1C1E" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </div>
          <div class="wallet-cell-main">
            <div class="wallet-cell-col">
              <div class="wallet-cell-title">证件</div>
              <div class="wallet-cell-sub">随时随地查看您的证件</div>
            </div>
            <svg class="chevron-icon" width="8" height="13" viewBox="0 0 8 13">
              <path d="M1 1l6 5.5L1 12" fill="none" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部悬浮三段式胶囊导航栏 -->
    <div class="wallet-floating-bar">
      <!-- 卡包 -->
      <button
        class="floating-tab-item"
        :class="{ active: currentTab === 'cards' }"
        @click="handleTabClick('cards', '卡包')"
      >
        <div class="tab-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="18" height="13" rx="3.5" :fill="currentTab === 'cards' ? '#007AFF' : '#1C1C1E'" />
            <rect x="5.5" y="8.5" width="7" height="3" rx="1.2" fill="#FFFFFF" />
          </svg>
        </div>
        <span class="tab-text">卡包</span>
      </button>

      <!-- 主页 -->
      <button
        class="floating-tab-item"
        :class="{ active: currentTab === 'home' }"
        @click="handleTabClick('home', '主页')"
      >
        <div class="tab-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3.5L3.5 10.5V20a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1v-9.5L12 3.5z" :fill="currentTab === 'home' ? '#007AFF' : '#1C1C1E'" />
            <rect x="10" y="15" width="4" height="2" rx="0.5" fill="#FFFFFF" />
          </svg>
        </div>
        <span class="tab-text">主页</span>
      </button>

      <!-- 我的 -->
      <button
        class="floating-tab-item"
        :class="{ active: currentTab === 'mine' }"
        @click="handleTabClick('mine', '我的')"
      >
        <div class="tab-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="7.5" r="4" :fill="currentTab === 'mine' ? '#007AFF' : '#1C1C1E'" />
            <path d="M4 19.5c0-3.5 3.5-5.5 8-5.5s8 2 8 5.5v0.5H4v-0.5z" :fill="currentTab === 'mine' ? '#007AFF' : '#1C1C1E'" />
          </svg>
        </div>
        <span class="tab-text">我的</span>
      </button>
    </div>

    <!-- 轻提示浮层 -->
    <Transition name="toast-fade">
      <div v-if="toastText" class="wallet-toast">
        {{ toastText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-wallet-page {
  position: absolute;
  inset: 0;
  background: #F4F5F8;
  display: flex;
  flex-direction: column;
  z-index: 5;
  overflow: hidden;
  box-sizing: border-box;
}

/* 顶部导航 */
.wallet-nav-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  width: 100%;
  height: calc(var(--safe-top, 44px) + 52px);
  padding: var(--safe-top, 44px) 16px 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(244, 245, 248, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  flex: none;
  box-sizing: border-box;
}

.nav-round-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  flex: none;
}

.nav-round-btn:active {
  background: rgba(0, 0, 0, 0.12);
  transform: scale(0.94);
}

.wallet-nav-title {
  font-size: 26px;
  font-weight: 700;
  color: #111111;
  margin: 0;
  letter-spacing: -0.3px;
}

/* 滚动容器 */
.wallet-scroll-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px 96px;
  box-sizing: border-box;
}

.scrollable::-webkit-scrollbar {
  display: none;
}

/* 顶部焦点大卡 */
.wallet-hero-card {
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.hero-banner-wrap {
  width: 100%;
  height: 180px;
  position: relative;
  overflow: hidden;
  background: #E8EDF2;
}

.hero-banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-gradient-overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 60px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%);
  pointer-events: none;
}

.hero-body {
  padding: 10px 18px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-title {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  margin: 0 0 6px;
  letter-spacing: -0.2px;
}

.hero-desc {
  font-size: 13px;
  color: #8E8E93;
  margin: 0 0 20px;
  line-height: 1.4;
}

.hero-add-button {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  letter-spacing: 0.2px;
}

.hero-add-button:active {
  background: #0066D6;
  transform: scale(0.985);
}

/* 分组功能大卡 */
.wallet-section-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.wallet-cell-row {
  display: flex;
  align-items: center;
  padding-left: 16px;
  min-height: 62px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.wallet-cell-row:active {
  background: #F8F9FA;
}

.wallet-cell-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.wallet-cell-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px 13px 0;
  border-bottom: 0.5px solid #F0F1F3;
}

.wallet-cell-row.no-border .wallet-cell-main {
  border-bottom: none;
}

.wallet-cell-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 3px;
}

.wallet-cell-title {
  font-size: 15.5px;
  color: #111111;
  font-weight: 500;
}

.wallet-cell-sub {
  font-size: 12.5px;
  color: #8E8E93;
  line-height: 1.3;
}

.chevron-icon {
  flex: none;
  margin-left: 8px;
}

/* 底部悬浮三段式胶囊导航栏 */
.wallet-floating-bar {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 9999px;
  padding: 4px 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.09), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 0.5px solid rgba(0, 0, 0, 0.06);
  z-index: 20;
}

.floating-tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  border-radius: 9999px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.15s ease;
  min-width: 58px;
  box-sizing: border-box;
}

.floating-tab-item.active {
  background: #EEEEF1;
}

.floating-tab-item:active {
  transform: scale(0.96);
}

.tab-icon-wrap {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}

.tab-text {
  font-size: 11px;
  font-weight: 500;
  color: #1C1C1E;
}

.floating-tab-item.active .tab-text {
  color: #007AFF;
  font-weight: 600;
}

/* 交互轻提示 */
.wallet-toast {
  position: absolute;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.78);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
