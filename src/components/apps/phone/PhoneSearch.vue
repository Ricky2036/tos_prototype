<script setup>
import { onMounted, ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const inputRef = ref(null)

onMounted(() => {
  inputRef.value?.focus()
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
  if (!query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<span class="highlight-green">$1</span>')
}
</script>

<template>
  <div class="phone-search-view">
    <!-- 顶部搜索栏 -->
    <div class="search-top-bar">
      <button class="back-btn" @click="handleBack">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="search-input-pill">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="search-icon">
          <circle cx="11" cy="11" r="8" stroke="#8E8E93" stroke-width="2" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" />
        </svg>
        <input
          ref="inputRef"
          v-model="phoneStore.searchQuery"
          class="search-input"
          placeholder="搜索"
          type="text"
        />
        <button v-if="phoneStore.searchQuery" class="clear-btn" @click="phoneStore.searchQuery = ''">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#8E8E93">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
            <line x1="9" y1="9" x2="15" y2="15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="mic-icon">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" fill="#8E8E93" />
          <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
    </div>

    <!-- 搜索主体内容 -->
    <div class="search-content-area scrollable">
      <!-- 空状态：无输入时 -->
      <div v-if="!phoneStore.searchQuery.trim()" class="search-empty-state">
        <div class="empty-glass-card">
          <div class="glass-doc"></div>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" class="glass-lens">
            <circle cx="10" cy="10" r="7" stroke="#A5B4FC" stroke-width="2.5" />
            <line x1="21" y1="21" x2="15" y2="15" stroke="#A5B4FC" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
        <div class="empty-tip-text">没有搜索记录</div>
      </div>

      <!-- 搜索结果列表 -->
      <div v-else-if="phoneStore.searchResults.length > 0" class="search-results-list">
        <div class="results-section-header">所有联系人</div>
        <div
          v-for="c in phoneStore.searchResults"
          :key="c.id"
          class="result-item-row"
          @click="handleSelect(c)"
        >
          <div class="contact-avatar" :style="{ backgroundColor: c.color || '#8B5CF6' }">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div class="result-info-col">
            <div class="contact-name" v-html="highlightMatch(c.name, phoneStore.searchQuery)"></div>
            <div class="contact-phone" v-html="highlightMatch(c.number, phoneStore.searchQuery)"></div>
          </div>
        </div>
      </div>

      <!-- 未找到结果 -->
      <div v-else class="search-no-match">
        <div class="empty-tip-text">未找到相关联系人</div>
      </div>
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
  background: #FFFFFF;
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.search-top-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
}

.back-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.search-input-pill {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #F2F3F5;
  border-radius: 999px;
  padding: 0 14px;
  height: 42px;
  gap: 8px;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 15px;
  color: #1C1C1E;
}

.clear-btn {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  display: flex;
}

.mic-icon {
  margin-left: 4px;
}

/* 主内容区 */
.search-content-area {
  flex: 1;
  overflow-y: auto;
}

/* 空状态 */
.search-empty-state,
.search-no-match {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 100px;
}

.empty-glass-card {
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.glass-doc {
  position: absolute;
  width: 58px;
  height: 70px;
  background: linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%);
  border-radius: 12px;
  transform: rotate(-8deg);
  opacity: 0.8;
}

.glass-lens {
  position: relative;
  transform: translate(6px, -4px);
}

.empty-tip-text {
  font-size: 14px;
  color: #8E8E93;
}

/* 结果列表 */
.search-results-list {
  padding: 10px 20px;
}

.results-section-header {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  margin-bottom: 12px;
}

.result-item-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
}

.result-item-row:active {
  opacity: 0.7;
}

.contact-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
}

.result-info-col {
  flex: 1;
}

.contact-name {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
  margin-bottom: 2px;
}

.contact-phone {
  font-size: 13px;
  color: #8E8E93;
}

:deep(.highlight-green) {
  color: #00C853;
  font-weight: 600;
}
</style>
