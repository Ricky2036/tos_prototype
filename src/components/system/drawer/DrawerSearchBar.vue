<script setup>
import { computed, nextTick, ref } from 'vue'
import { searchDrawerApps } from '../../../config/drawerApps'

const props = defineProps({
  hidden: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-app', 'search-active'])

const isFocused = ref(false)
const searchQuery = ref('')
const inputRef = ref(null)

const searchResults = computed(() => {
  return searchDrawerApps(searchQuery.value)
})

function handleFocus() {
  isFocused.value = true
  emit('search-active', true)
}

function handleCancel() {
  searchQuery.value = ''
  isFocused.value = false
  emit('search-active', false)
  if (inputRef.value) {
    inputRef.value.blur()
  }
}

function handleClear() {
  searchQuery.value = ''
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

function handleSelectApp(appId) {
  emit('select-app', appId)
}

function activateSearch() {
  isFocused.value = true
  emit('search-active', true)
  nextTick(() => {
    inputRef.value?.focus()
  })
}

defineExpose({
  activateSearch,
  handleCancel
})
</script>

<template>
  <div class="drawer-search-wrapper" :class="{ 'is-hidden': hidden, 'is-active': isFocused }">
    <!-- 搜索结果全屏/半屏浮层 (当聚焦且有内容/激活态时展示) -->
    <transition name="fade">
      <div v-if="isFocused" class="search-overlay" @click.self="handleCancel">
        <div class="search-results-box scrollable">
          <div v-if="searchQuery.trim() && searchResults.length > 0" class="results-grid">
            <div
              v-for="app in searchResults"
              :key="app.id"
              class="result-item"
              @click="handleSelectApp(app.id)"
            >
              <div class="result-icon-wrap">
                <img :src="app.icon" :alt="app.name" class="result-icon-img" />
              </div>
              <span class="result-name">{{ app.name }}</span>
            </div>
          </div>

          <div v-else-if="searchQuery.trim() && searchResults.length === 0" class="empty-search">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <p>未找到相关应用</p>
          </div>

          <div v-else class="search-hint">
            <p>输入应用名称或拼音快速检索</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- 底部常驻悬浮胶囊 -->
    <div class="bottom-bar-container">
      <div class="search-capsule" @click="activateSearch">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索应用"
          @focus="handleFocus"
        />

        <button
          v-if="searchQuery"
          type="button"
          class="clear-btn"
          @click.stop="handleClear"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 取消按钮 (搜索态) 或 更多操作按钮 ⋮ (常规态) -->
      <button
        v-if="isFocused"
        type="button"
        class="cancel-btn"
        @click.stop="handleCancel"
      >
        取消
      </button>

      <button
        v-else
        type="button"
        class="more-btn"
        title="更多选项"
        @click.stop
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8"></circle>
          <circle cx="12" cy="12" r="1.8"></circle>
          <circle cx="12" cy="19" r="1.8"></circle>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.drawer-search-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  pointer-events: none;
  transition: opacity 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.drawer-search-wrapper.is-hidden {
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
}

.bottom-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  margin-bottom: calc(var(--safe-bottom, 16px) + 12px);
  pointer-events: auto;
}

.search-capsule {
  flex: 1;
  height: 44px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.7);
  border-radius: 22px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  padding: 0 14px;
  cursor: text;
  box-sizing: border-box;
}

.search-icon {
  color: #8e8e93;
  margin-right: 8px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14.5px;
  color: #1c1c1e;
  outline: none;
  padding: 0;
}

.search-input::placeholder {
  color: #8e8e93;
}

.clear-btn {
  background: rgba(0, 0, 0, 0.12);
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #636366;
  cursor: pointer;
}

.more-btn {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1c1c1e;
  cursor: pointer;
  padding: 0;
}

.more-btn:active {
  transform: scale(0.92);
}

.cancel-btn {
  background: transparent;
  border: none;
  color: #007aff;
  font-size: 15px;
  font-weight: 500;
  padding: 0 6px;
  cursor: pointer;
  white-space: nowrap;
}

.cancel-btn:active {
  opacity: 0.6;
}

/* 搜索浮层结果视图 */
.search-overlay {
  position: fixed;
  inset: 0;
  bottom: 80px;
  background: rgba(248, 249, 250, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  z-index: 90;
  pointer-events: auto;
  padding-top: calc(var(--safe-top, 24px) + 50px);
  padding-bottom: 20px;
  box-sizing: border-box;
}

.search-results-box {
  height: 100%;
  overflow-y: auto;
  padding: 10px 16px;
  box-sizing: border-box;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px 12px;
  justify-items: center;
}

.result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
  width: 64px;
}

.result-item:active {
  transform: scale(0.9);
}

.result-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.07);
  background: #fff;
}

.result-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-name {
  font-size: 12px;
  color: #1c1c1e;
  margin-top: 6px;
  text-align: center;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-search, .search-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 240px;
  color: #8e8e93;
  font-size: 14px;
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

/* 动效 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
