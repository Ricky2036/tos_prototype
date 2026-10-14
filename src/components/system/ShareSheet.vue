<script setup>
import { computed, ref } from 'vue'
import { useBackHandler } from '../../composables/backRegistry'
import { useShareStore, SHARE_APPS } from '../../stores/shareStore'

const store = useShareStore()

useBackHandler(() => {
  if (store.isOpen) {
    if (store.activeMenuAppId) {
      store.closeAllMenus()
      return true
    }
    store.closeShare()
    return true
  }
  return false
})

function resolveAsset(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : import.meta.env.BASE_URL + '/'
  const clean = path.startsWith('/') ? path.slice(1) : path
  return `${base}${clean}`
}

function onBackdropClick(e) {
  if (e.target === e.currentTarget) {
    store.closeShare()
  }
}

function handleAppClick(app, event) {
  if (app.channels && app.channels.length > 0) {
    toggleAppDropdown(app.id, event)
  } else {
    store.shareToApp(app.id)
  }
}

function toggleAppDropdown(appId, event) {
  event?.stopPropagation()
  store.toggleAppMenu(appId)
}

const activeMenuApp = computed(() => {
  if (!store.activeMenuAppId) return null
  return SHARE_APPS.find((a) => a.id === store.activeMenuAppId)
})
</script>

<template>
  <div class="share-layer-root">
    <!-- 全局轻提示 Toast -->
    <Transition name="share-toast-fade">
      <div v-if="store.toast.visible" class="share-toast">
        <div class="share-toast-icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span class="share-toast-text">{{ store.toast.message }}</span>
      </div>
    </Transition>

    <!-- 分享面板模态框 -->
    <Transition name="share-sheet-anim">
      <div
        v-if="store.isOpen"
        class="share-backdrop"
        @click="onBackdropClick"
        @pointerdown="onBackdropClick"
      >
        <!-- 分享面板主体卡片 -->
        <div
          class="share-panel"
          @click.stop
          @pointerdown.stop
        >
          <!-- 渠道选择浮动菜单 -->
          <Transition name="share-popover-fade">
            <div
              v-if="activeMenuApp"
              class="share-popover"
              @click.stop
              @pointerdown.stop
            >
              <div class="share-popover-header">
                <span class="share-popover-title">{{ activeMenuApp.name }} 分享渠道</span>
                <button
                  type="button"
                  class="share-popover-close"
                  aria-label="关闭渠道菜单"
                  @click="store.closeAllMenus"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div class="share-popover-list">
                <button
                  v-for="ch in activeMenuApp.channels"
                  :key="ch.id"
                  type="button"
                  class="share-popover-item"
                  :class="{ 'is-active': store.appChannels[activeMenuApp.id] === ch.label }"
                  @click="store.selectAppChannel(activeMenuApp.id, ch.label)"
                >
                  <span class="share-popover-label">{{ ch.label }}</span>
                  <svg
                    v-if="store.appChannels[activeMenuApp.id] === ch.label"
                    class="share-popover-check"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#007AFF"
                    stroke-width="2.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            </div>
          </Transition>

          <!-- 顶部把手 -->
          <div class="share-drag-handle"></div>

          <!-- 头部标题与隐私保护入口 -->
          <div class="share-header">
            <h2 class="share-title">{{ store.titleText }}</h2>
            <button
              type="button"
              class="share-privacy-link"
              @click="store.togglePrivacy"
            >
              <span>{{ store.privacyProtected ? '隐私保护已开启' : '隐私保护已关闭' }}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <!-- 相册缩略图横滑预览区域 -->
          <div class="share-carousel">
            <div
              v-for="photo in store.photos"
              :key="photo.id"
              class="share-thumb-card"
              :class="{ 'is-selected': photo.selected }"
              @click="store.togglePhotoSelection(photo.id)"
            >
              <img
                :src="resolveAsset(photo.url)"
                :alt="photo.title"
                class="share-thumb-img"
                loading="lazy"
              />

              <!-- 视频播放标记 -->
              <div v-if="photo.isVideo" class="share-video-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
                  <polygon points="6 4 20 12 6 20 6 4" />
                </svg>
              </div>

              <!-- 右下角复选标记 -->
              <div
                class="share-select-badge"
                :class="{ 'is-checked': photo.selected }"
              >
                <svg
                  v-if="photo.selected"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          </div>

          <div class="share-divider"></div>

          <!-- 极速互传横幅卡片 -->
          <div class="share-fast-transfer" @click="store.triggerFastTransfer">
            <div class="share-transfer-graphic">
              <svg width="34" height="38" viewBox="0 0 44 48" fill="none">
                <!-- 后置手机 -->
                <rect x="4" y="2" width="22" height="38" rx="4" fill="#B0B3BD" />
                <rect x="6" y="5" width="18" height="32" rx="2" fill="#E8EAEE" />
                <rect x="12" y="3" width="6" height="1.5" rx="0.75" fill="#8E92A0" />
                <!-- 前置手机 -->
                <rect x="16" y="10" width="24" height="36" rx="4.5" fill="#888C98" />
                <rect x="17.5" y="12" width="21" height="32" rx="3" fill="#F4F5F8" />
                <rect x="24" y="11" width="8" height="1.5" rx="0.75" fill="#5F6370" />
              </svg>
            </div>
            <div class="share-transfer-text">
              <div class="share-transfer-title">极速互传</div>
              <div class="share-transfer-desc">即刻碰一碰 iPhone、Infinix 等可免流量互传。</div>
            </div>
            <div class="share-transfer-arrow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>

          <div class="share-divider"></div>

          <!-- 分享应用横滑图标栏 -->
          <div class="share-apps-container">
            <div class="share-apps-scroll">
              <div
                v-for="app in SHARE_APPS"
                :key="app.id"
                class="share-app-item"
              >
                <!-- 应用图标按钮 -->
                <button
                  type="button"
                  class="share-app-btn"
                  :class="[`is-${app.customIcon || 'standard'}`]"
                  @click="handleAppClick(app, $event)"
                >
                  <!-- 快速分享定制图标 -->
                  <template v-if="app.customIcon === 'quickshare'">
                    <div class="share-quickshare-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                      </svg>
                    </div>
                  </template>

                  <!-- 蓝牙定制图标 -->
                  <template v-else-if="app.customIcon === 'bluetooth'">
                    <div class="share-bluetooth-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
                      </svg>
                    </div>
                  </template>

                  <!-- 剪映 / CapCut 定制图标 -->
                  <template v-else-if="app.customIcon === 'capcut'">
                    <div class="share-capcut-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="6" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <line x1="20" y1="4" x2="8.12" y2="15.88" />
                        <line x1="14.47" y1="14.48" x2="20" y2="20" />
                        <line x1="8.12" y1="8.12" x2="12" y2="12" />
                      </svg>
                    </div>
                  </template>

                  <!-- 更多定制图标 -->
                  <template v-else-if="app.customIcon === 'more'">
                    <div class="share-more-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#8E8E93">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                      </svg>
                    </div>
                  </template>

                  <!-- 桌面真实应用图标 -->
                  <template v-else>
                    <img
                      :src="resolveAsset(app.icon)"
                      :alt="app.name"
                      class="share-app-img"
                    />
                  </template>
                </button>

                <!-- 应用名称或渠道下拉标签 -->
                <div class="share-app-meta">
                  <button
                    v-if="app.channels && app.channels.length > 0"
                    type="button"
                    class="share-channel-chip"
                    @click="toggleAppDropdown(app.id, $event)"
                  >
                    <span class="share-channel-label">{{ store.appChannels[app.id] || app.defaultChannel }}</span>
                    <svg class="share-channel-caret" width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <span v-else class="share-app-name">{{ app.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.share-layer-root {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 95; /* 低于全局导航栏 (z=96)，使系统全局手势条/三键导航栏自然浮于白色分享面板之上 */
}

/* 全局 Toast */
.share-toast {
  pointer-events: auto;
  position: absolute;
  top: calc(var(--safe-top, 24px) + 14px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #FFFFFF;
  padding: 7px 15px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  gap: 7px;
  z-index: 1000;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
  white-space: nowrap;
}

.share-toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-toast-text {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.1px;
}

.share-toast-fade-enter-active,
.share-toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.share-toast-fade-enter-from,
.share-toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

/* 蒙层背景 */
.share-backdrop {
  pointer-events: auto;
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  user-select: none;
  -webkit-user-select: none;
}

/* 面板主体 */
.share-panel {
  width: 100%;
  background: #FFFFFF;
  border-radius: 26px 26px 0 0;
  padding-bottom: calc(var(--safe-bottom, 34px) + 6px);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
}

/* 顶部把手 */
.share-drag-handle {
  width: 36px;
  height: 4px;
  background: #D8D8DC;
  border-radius: 2px;
  margin: 9px auto 11px auto;
  flex: none;
}

/* 头部 */
.share-header {
  text-align: center;
  padding: 0 16px 2px;
  flex: none;
}

.share-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111111;
  letter-spacing: -0.3px;
}

.share-privacy-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  color: #007AFF;
  font-size: 12.5px;
  font-weight: 500;
  margin-top: 4px;
  cursor: pointer;
  padding: 2px 6px;
}

/* 缩略图横滑预览 */
.share-carousel {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 14px 16px 12px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex: none;
}

.share-carousel::-webkit-scrollbar {
  display: none;
}

.share-thumb-card {
  width: 104px;
  height: 168px;
  flex-shrink: 0;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: #F2F2F7;
  scroll-snap-align: start;
  transition: transform 0.12s ease;
}

.share-thumb-card:active {
  transform: scale(0.96);
}

.share-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.share-video-badge {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 2px;
}

.share-select-badge {
  position: absolute;
  bottom: 7px;
  right: 7px;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px solid rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.share-select-badge.is-checked {
  background: #007AFF;
  border-color: #007AFF;
}

/* 分隔线 */
.share-divider {
  height: 1px;
  background: #F0F0F2;
  margin: 4px 16px;
  flex: none;
}

/* 极速互传横幅 */
.share-fast-transfer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.share-fast-transfer:active {
  background-color: #F8F8FA;
}

.share-transfer-graphic {
  flex: none;
  width: 34px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-transfer-text {
  flex: 1;
  min-width: 0;
}

.share-transfer-title {
  font-size: 14.5px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.2px;
}

.share-transfer-desc {
  font-size: 11.5px;
  color: #8E8E93;
  margin-top: 2px;
  line-height: 1.35;
}

.share-transfer-arrow {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 应用图标列表 */
.share-apps-container {
  padding: 4px 0 2px;
  flex: none;
}

.share-apps-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 8px 14px 6px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.share-apps-scroll::-webkit-scrollbar {
  display: none;
}

.share-app-item {
  width: 66px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.share-app-btn {
  width: 50px;
  height: 50px;
  border-radius: 13px;
  border: none;
  padding: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.12s ease;
  overflow: hidden;
  box-shadow: 0 1.5px 5px rgba(0, 0, 0, 0.08);
}

.share-app-btn:active {
  transform: scale(0.92);
}

.share-app-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 13px;
}

/* 定制图标外观 */
.share-app-btn.is-quickshare {
  background: linear-gradient(135deg, #1A82FF 0%, #005FDB 100%);
}

.share-app-btn.is-bluetooth {
  background: linear-gradient(135deg, #007AFF 0%, #0056B3 100%);
}

.share-app-btn.is-capcut {
  background: #000000;
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.share-app-btn.is-more {
  background: #F2F2F7;
  border: 1px solid #E5E5EA;
}

.share-quickshare-icon,
.share-bluetooth-icon,
.share-capcut-icon,
.share-more-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-app-meta {
  width: 100%;
  margin-top: 5px;
  min-height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-app-name {
  font-size: 11px;
  font-weight: 500;
  color: #3A3A3C;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.share-channel-chip {
  background: none;
  border: none;
  padding: 1px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  max-width: 100%;
}

.share-channel-label {
  font-size: 10.5px;
  font-weight: 500;
  color: #3A3A3C;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.share-channel-caret {
  flex: none;
  color: #8E8E93;
}

/* 浮动渠道菜单 */
.share-popover {
  position: absolute;
  bottom: calc(var(--safe-bottom, 34px) + 94px);
  left: 50%;
  transform: translateX(-50%);
  width: 220px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.2);
  padding: 8px;
  z-index: 200;
}

.share-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 4px;
}

.share-popover-title {
  font-size: 11px;
  font-weight: 600;
  color: #8E8E93;
}

.share-popover-close {
  background: none;
  border: none;
  padding: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-popover-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.share-popover-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 9px;
  border-radius: 9px;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 500;
  color: #1C1C1E;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.1s ease;
}

.share-popover-item:hover,
.share-popover-item:active {
  background: rgba(0, 122, 255, 0.08);
}

.share-popover-item.is-active {
  font-weight: 600;
  color: #007AFF;
}

.share-popover-label {
  flex: 1;
}

.share-popover-check {
  flex: none;
  margin-left: 6px;
}

/* 动画过渡 */
.share-sheet-anim-enter-active,
.share-sheet-anim-leave-active {
  transition: opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.share-sheet-anim-enter-from,
.share-sheet-anim-leave-to {
  opacity: 0;
}

.share-sheet-anim-enter-active .share-panel,
.share-sheet-anim-leave-active .share-panel {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.share-sheet-anim-enter-from .share-panel,
.share-sheet-anim-leave-to .share-panel {
  transform: translateY(100%);
}

.share-popover-fade-enter-active,
.share-popover-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.share-popover-fade-enter-from,
.share-popover-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
