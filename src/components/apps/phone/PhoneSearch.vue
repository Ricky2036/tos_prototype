<script setup>
import { onMounted, ref, computed } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const emit = defineEmits(['openAddContact'])
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

function handleDirectCall() {
  const q = phoneStore.searchQuery.trim()
  if (q) {
    phoneStore.isSearchActive = false
    phoneStore.startCall(q)
  }
}

function handleCreateContact() {
  const q = phoneStore.searchQuery.trim()
  const isDigit = /^[0-9+\s-]+$/.test(q)
  emit('openAddContact', {
    name: isDigit ? '' : q,
    number: isDigit ? q : ''
  })
  phoneStore.isSearchActive = false
}

function highlightMatch(text, query) {
  if (!query) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<span class="highlight-green">$1</span>')
}

const isNumericQuery = computed(() => {
  return /^[0-9+\s-]+$/.test(phoneStore.searchQuery.trim())
})
</script>

<template>
  <div class="phone-search-view">
    <!-- 顶部搜索栏（带安全区状态栏防重叠边距） -->
    <div class="search-top-bar">
      <button class="back-btn" title="返回" @click="handleBack">
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
          placeholder="搜索姓名或号码"
          type="text"
        />
        <button v-if="phoneStore.searchQuery" class="clear-btn" title="清空" @click="phoneStore.searchQuery = ''">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#8E8E93">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
            <line x1="9" y1="9" x2="15" y2="15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
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
        <div class="empty-tip-text">输入姓名或数字搜索</div>
      </div>

      <!-- 有输入时 -->
      <div v-else class="search-active-container">
        <!-- 快速呼叫/新建操作快捷项 -->
        <div class="quick-call-card">
          <div class="quick-op-row" @click="handleDirectCall">
            <div class="op-icon-circle bg-green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
              </svg>
            </div>
            <div class="op-text-col">
              <span class="op-main-title">拨打电话</span>
              <span class="op-sub-val">{{ phoneStore.searchQuery }}</span>
            </div>
          </div>

          <div class="quick-op-row no-sep" @click="handleCreateContact">
            <div class="op-icon-circle bg-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div class="op-text-col">
              <span class="op-main-title">新建联系人</span>
              <span class="op-sub-val">{{ phoneStore.searchQuery }}</span>
            </div>
          </div>
        </div>

        <!-- 搜索匹配联系人结果列表 -->
        <div v-if="phoneStore.searchResults.length > 0" class="search-results-list">
          <div class="results-section-header">匹配联系人 ({{ phoneStore.searchResults.length }})</div>
          <div
            v-for="c in phoneStore.searchResults"
            :key="c.id"
            class="result-item-row"
            @click="handleSelect(c)"
          >
            <div class="contact-avatar" :style="{ backgroundColor: c.color || '#8B5CF6' }">
              <span class="avatar-char">{{ c.name?.slice(0, 1) || '联' }}</span>
            </div>
            <div class="result-info-col">
              <div class="contact-name" v-html="highlightMatch(c.name, phoneStore.searchQuery)"></div>
              <div class="contact-phone" v-html="highlightMatch(c.number, phoneStore.searchQuery)"></div>
            </div>
            <div class="item-call-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#00C853">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
              </svg>
            </div>
          </div>
        </div>

        <div v-else class="search-no-match">
          <div class="empty-tip-text">未找到与「{{ phoneStore.searchQuery }}」匹配的现有联系人</div>
        </div>
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
  z-index: 70;
  display: flex;
  flex-direction: column;
}

.search-top-bar {
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

/* 主内容区 */
.search-content-area {
  flex: 1;
  overflow-y: auto;
}

.search-active-container {
  padding: 14px 16px;
}

/* 快速呼叫卡片 */
.quick-call-card {
  background: #F8F9FA;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.quick-op-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 0.5px solid #E5E7EB;
  cursor: pointer;
}

.quick-op-row.no-sep {
  border-bottom: none;
}

.quick-op-row:active {
  background: #EFEFEF;
}

.op-icon-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-green { background: #00C853; }
.bg-blue { background: #3B82F6; }

.op-text-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.op-main-title {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
}

.op-sub-val {
  font-size: 13px;
  color: #8E8E93;
}

/* 空状态 */
.search-empty-state,
.search-no-match {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 80px;
  padding: 0 20px;
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
  text-align: center;
  line-height: 1.5;
}

/* 结果列表 */
.search-results-list {
  padding: 6px 0;
}

.results-section-header {
  font-size: 13px;
  font-weight: 600;
  color: #8E8E93;
  margin-bottom: 10px;
}

.result-item-row {
  display: flex;
  align-items: center;
  padding: 11px 4px;
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

.avatar-char {
  font-size: 17px;
  font-weight: 600;
  color: #FFFFFF;
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

.item-call-icon {
  padding: 6px;
}

:deep(.highlight-green) {
  color: #00C853;
  font-weight: 600;
}
</style>
