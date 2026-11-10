<script setup>
import { onMounted, ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'
import SettingsSearchBar from '../../ui/SettingsSearchBar.vue'

const phoneStore = usePhoneStore()
const emit = defineEmits(['openAddContact'])
const searchBarRef = ref(null)

onMounted(() => {
  searchBarRef.value?.focus()
})

function handleBack() {
  phoneStore.isSearchActive = false
  phoneStore.searchQuery = ''
}

function handleSelect(contact) {
  phoneStore.isSearchActive = false
  phoneStore.startCall(contact)
}

function highlightMatch(text, query) {
  if (!text || !query) return text || ''
  const trimmed = query.trim()
  if (!trimmed) return text
  const regex = new RegExp(`(${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<span class="highlight-green">$1</span>')
}
</script>

<template>
  <div class="phone-search-view">
    <!-- 主体内容区（滚动列表或居中空态） -->
    <div class="search-body-area">
      <!-- 1. 空状态：无搜索关键词 或 有关键词但未匹配到结果 -->
      <div
        v-if="!phoneStore.searchQuery.trim() || phoneStore.searchResults.length === 0"
        class="search-empty-container"
      >
        <div class="empty-artwork-wrap">
          <!-- 背景文件卡片：右上切角微渐变卡片 -->
          <svg width="76" height="86" viewBox="0 0 76 86" fill="none" class="doc-card-svg">
            <path
              d="M16 0H48L76 28V70C76 78.8366 68.8366 86 60 86H16C7.16344 86 0 78.8366 0 70V16C0 7.16344 7.16344 0 16 0Z"
              fill="url(#searchDocGrad)"
            />
            <defs>
              <linearGradient id="searchDocGrad" x1="0" y1="0" x2="76" y2="86" gradientUnits="userSpaceOnUse">
                <stop stop-color="#BAC7DE" />
                <stop offset="1" stop-color="#9DAEC8" />
              </linearGradient>
            </defs>
          </svg>

          <!-- 前景放大镜 -->
          <svg width="82" height="82" viewBox="0 0 82 82" fill="none" class="lens-art-svg">
            <!-- 镜圈 -->
            <circle cx="38" cy="36" r="26" stroke="rgba(255, 255, 255, 0.95)" stroke-width="6" />
            <circle cx="38" cy="36" r="26" stroke="#CBD5E1" stroke-width="2.5" stroke-opacity="0.5" />
            <!-- 镜柄 -->
            <rect x="55" y="51" width="9" height="22" rx="4.5" transform="rotate(-42 55 51)" fill="url(#searchHandleGrad)" />
            <defs>
              <linearGradient id="searchHandleGrad" x1="55" y1="51" x2="64" y2="73" gradientUnits="userSpaceOnUse">
                <stop stop-color="#FFFFFF" />
                <stop offset="1" stop-color="#BAC7DE" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div class="empty-state-label">
          {{ !phoneStore.searchQuery.trim() ? '没有搜索记录' : '没有搜索到结果' }}
        </div>
      </div>

      <!-- 2. 有搜索结果列表 -->
      <div v-else class="search-results-container scrollable">
        <div class="results-group-header">所有联系人</div>
        <div class="results-items-list">
          <div
            v-for="c in phoneStore.searchResults"
            :key="c.id"
            class="search-contact-item"
            @click="handleSelect(c)"
          >
            <div class="contact-avatar-circle" :style="{ backgroundColor: c.color || '#8B5CF6' }">
              <span class="avatar-letter">{{ c.name?.slice(0, 1) || '联' }}</span>
            </div>
            <div class="contact-details-col">
              <div class="contact-name-line" v-html="highlightMatch(c.name, phoneStore.searchQuery)"></div>
              <div class="contact-number-line" v-html="highlightMatch(c.number, phoneStore.searchQuery)"></div>
            </div>
            <div class="call-action-btn" title="呼叫" @click.stop="handleSelect(c)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#00C853">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部悬浮搜索栏：左侧圆形返回按钮 + 右侧 SettingsSearchBar 控件 -->
    <div class="search-bottom-dock">
      <button class="search-bottom-back-btn" title="返回" @click="handleBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <SettingsSearchBar
        ref="searchBarRef"
        v-model="phoneStore.searchQuery"
        placeholder="搜索"
        class="phone-bottom-search-bar"
      />
    </div>
  </div>
</template>

<style scoped>
.phone-search-view {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F2;
  z-index: 70;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-body-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  padding-top: calc(var(--safe-top, 44px) + 8px);
}

/* 居中空状态 */
.search-empty-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 44px;
}

.empty-artwork-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.doc-card-svg {
  position: absolute;
  left: 18px;
  top: 22px;
  filter: drop-shadow(0 4px 12px rgba(157, 174, 200, 0.35));
}

.lens-art-svg {
  position: absolute;
  right: 8px;
  top: 8px;
  filter: drop-shadow(0 6px 16px rgba(157, 174, 200, 0.45));
}

.empty-state-label {
  font-size: 15px;
  color: #8E8E93;
  text-align: center;
  letter-spacing: -0.2px;
}

/* 搜索结果列表 */
.search-results-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 96px 16px;
}

.results-group-header {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin-bottom: 8px;
  padding-left: 4px;
}

.results-items-list {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.search-contact-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  transition: background 0.15s ease;
}

.search-contact-item:last-child {
  border-bottom: none;
}

.search-contact-item:active {
  background: #F8F9FA;
}

.contact-avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.avatar-letter {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
}

.contact-details-col {
  flex: 1;
  min-width: 0;
}

.contact-name-line {
  font-size: 15px;
  font-weight: 500;
  color: #1C1C1E;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-number-line {
  font-size: 13px;
  color: #8E8E93;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.call-action-btn {
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.15s ease;
}

.call-action-btn:active {
  background: rgba(0, 200, 83, 0.1);
}

/* 底部悬浮操作底栏：严格按真机与系统底栏基准线规范（距底 28px，上浮 14px 呼吸间距，高 44px） */
.search-bottom-dock {
  position: absolute;
  bottom: calc(var(--home-indicator-inset, 14px) + 14px);
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 50;
}

.search-bottom-back-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: transform 0.15s ease, background 0.15s ease;
}

.search-bottom-back-btn:active {
  transform: scale(0.92);
  background: #F2F2F7;
}

.phone-bottom-search-bar {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  background: #FFFFFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.highlight-green) {
  color: #00C853;
  font-weight: 600;
}
</style>