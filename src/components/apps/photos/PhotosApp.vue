<script setup>
import { computed, ref } from 'vue'
import { useShareStore } from '../../../stores/shareStore'
import { useSystemStore } from '../../../stores/systemStore'
import AppNavBar from '../../ui/AppNavBar.vue'

const store = useShareStore()
const system = useSystemStore()

const selectMode = ref(true)

function resolveAsset(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : import.meta.env.BASE_URL + '/'
  const clean = path.startsWith('/') ? path.slice(1) : path
  return `${base}${clean}`
}

function handlePhotoClick(photo) {
  store.togglePhotoSelection(photo.id)
}

function handleOpenShare() {
  store.openShare()
}

function toggleSelectMode() {
  selectMode.value = !selectMode.value
}

function handleBack() {
  system.closeApp()
}
</script>

<template>
  <div class="photos-app">
    <!-- 顶部导航栏 -->
    <AppNavBar
      :title="selectMode ? `已选择 ${store.selectedCount} 项` : '图库'"
      @back="handleBack"
    >
      <template #action>
        <button
          type="button"
          class="photos-mode-btn"
          @click="toggleSelectMode"
        >
          {{ selectMode ? '取消' : '选择' }}
        </button>
      </template>
    </AppNavBar>

    <!-- 主体可滚动区域 -->
    <div class="photos-body scrollable">
      <!-- 提示引导横幅 -->
      <div class="photos-guide-banner" @click="handleOpenShare">
        <div class="photos-guide-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </div>
        <div class="photos-guide-text">
          <span class="photos-guide-title">分享面板已就绪</span>
          <span class="photos-guide-desc">勾选照片后点击下方【分享】或轻触此处唤起</span>
        </div>
        <button type="button" class="photos-guide-cta">
          打开分享
        </button>
      </div>

      <!-- 分组标题 -->
      <div class="photos-section-header">
        <span class="photos-section-date">2026年10月12日</span>
        <span class="photos-section-loc">深圳 · 近期拍摄</span>
      </div>

      <!-- 照片网格 (3 列) -->
      <div class="photos-grid">
        <div
          v-for="photo in store.photos"
          :key="photo.id"
          class="photos-grid-item"
          :class="{ 'is-selected': photo.selected }"
          @click="handlePhotoClick(photo)"
        >
          <img
            :src="resolveAsset(photo.url)"
            :alt="photo.title"
            class="photos-grid-img"
            loading="lazy"
          />

          <!-- 视频标签 -->
          <div v-if="photo.isVideo" class="photos-video-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFFFFF">
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
            <span>{{ photo.duration || '00:15' }}</span>
          </div>

          <!-- 选中指示圈 -->
          <div
            v-if="selectMode"
            class="photos-check-indicator"
            :class="{ 'is-active': photo.selected }"
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
    </div>

    <!-- 底部操作栏 -->
    <div class="photos-bottom-bar">
      <button
        type="button"
        class="photos-action-btn"
        :class="{ 'is-disabled': store.selectedCount === 0 }"
        :disabled="store.selectedCount === 0"
        @click="handleOpenShare"
      >
        <div class="photos-action-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span v-if="store.selectedCount > 0" class="photos-badge">{{ store.selectedCount }}</span>
        </div>
        <span class="photos-action-text">分享</span>
      </button>

      <button
        type="button"
        class="photos-action-btn"
        @click="store.showToast('已加入我喜欢的照片', 'favor')"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span class="photos-action-text">收藏</span>
      </button>

      <button
        type="button"
        class="photos-action-btn"
        @click="store.showToast('已移动至废纸篓', 'trash')"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        <span class="photos-action-text">删除</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.photos-app {
  width: 100%;
  height: 100%;
  background: #F8F8FA;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.photos-mode-btn {
  background: none;
  border: none;
  color: #007AFF;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
}

.photos-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(var(--safe-bottom, 34px) + 72px);
}

/* 引导横幅 */
.photos-guide-banner {
  margin: 12px 16px 14px;
  padding: 12px 14px;
  background: #FFFFFF;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.photos-guide-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(0, 122, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.photos-guide-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.photos-guide-title {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

.photos-guide-desc {
  font-size: 11.5px;
  color: #8E8E93;
}

.photos-guide-cta {
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex: none;
}

/* 分组标题 */
.photos-section-header {
  padding: 6px 18px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.photos-section-date {
  font-size: 16px;
  font-weight: 700;
  color: #1C1C1E;
}

.photos-section-loc {
  font-size: 12px;
  color: #8E8E93;
}

/* 3 列网格 */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  padding: 0 2px;
}

.photos-grid-item {
  aspect-ratio: 1 / 1;
  position: relative;
  overflow: hidden;
  background: #E5E5EA;
  cursor: pointer;
}

.photos-grid-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.15s ease;
}

.photos-grid-item.is-selected .photos-grid-img {
  transform: scale(0.94);
  border-radius: 8px;
}

.photos-video-tag {
  position: absolute;
  bottom: 6px;
  left: 6px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  padding: 2px 5px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 500;
}

.photos-check-indicator {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  border: 1.5px solid #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.photos-check-indicator.is-active {
  background: #007AFF;
  border-color: #007AFF;
}

/* 底部操作栏 */
.photos-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(var(--safe-bottom, 34px) + 54px);
  padding-bottom: var(--safe-bottom, 34px);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 10;
}

.photos-action-btn {
  background: none;
  border: none;
  color: #007AFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  padding: 4px 12px;
  transition: opacity 0.15s ease;
}

.photos-action-btn.is-disabled {
  opacity: 0.35;
  cursor: default;
}

.photos-action-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photos-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  background: #007AFF;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 999px;
  border: 1.5px solid #FFFFFF;
}

.photos-action-text {
  font-size: 11px;
  font-weight: 500;
}
</style>
