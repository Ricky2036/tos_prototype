<script setup>
import { computed, nextTick, ref } from 'vue'
import { searchDrawerApps } from '../../../config/drawerApps'
import { useHomeStore } from '../../../stores/homeStore'
import AppIcon from '../../ui/AppIcon.vue'

const props = defineProps({
  hidden: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-app', 'search-active', 'open-options'])

const home = useHomeStore()
const isInstalled = (id) => (home.appInstalled ? home.appInstalled(id) : true)

const isFocused = ref(false)
const searchQuery = ref('')
const inputRef = ref(null)

const searchResults = computed(() => {
  return searchDrawerApps(searchQuery.value).filter((a) => isInstalled(a.id))
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
  handleCancel()
}

function activateSearch() {
  isFocused.value = true
  emit('search-active', true)
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function handleMoreOptions(e) {
  e.stopPropagation()
  emit('open-options')
}

defineExpose({
  activateSearch,
  handleCancel
})
</script>

<template>
  <div class="drawer-search-wrapper" :class="{ 'is-hidden': hidden, 'is-active': isFocused }">
    <!-- 底部渐变半透遮罩层（柔和通透，绝不遮挡底部圆角与全局导航） -->
    <div class="bottom-gradient-scrim"></div>

    <!-- 搜索结果浮层（聚焦输入时激活展示） -->
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
              <AppIcon
                :app="app"
                :size="56"
                :show-label="true"
                :launch-on-click="false"
              />
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

    <!-- 底部常驻一体化暗黑毛玻璃搜索胶囊（绝不自绘底部导航，自然衔接系统全局导航栏） -->
    <div class="bottom-capsule-container">
      <div class="search-capsule" @click="activateSearch">
        <!-- 搜索放大镜图标 -->
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <!-- 输入框 -->
        <input
          ref="inputRef"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索应用"
          @focus="handleFocus"
        />

        <!-- 清空按钮 -->
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

        <!-- 胶囊内嵌右侧「⋮」更多菜单按钮（常规态） -->
        <button
          v-if="!isFocused"
          type="button"
          class="capsule-more-btn"
          title="更多选项"
          @click.stop="handleMoreOptions"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.8"></circle>
            <circle cx="12" cy="12" r="1.8"></circle>
            <circle cx="12" cy="19" r="1.8"></circle>
          </svg>
        </button>

        <!-- 取消按钮 (搜索态) -->
        <button
          v-else
          type="button"
          class="capsule-cancel-btn"
          @click.stop="handleCancel"
        >
          取消
        </button>
      </div>
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
  transform: translateY(14px);
  pointer-events: none;
}

/* 底部柔和渐变暗黑遮罩 */
.bottom-gradient-scrim {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 96px;
  background: linear-gradient(to top, rgba(14, 17, 23, 0.6) 0%, rgba(14, 17, 23, 0.2) 60%, rgba(14, 17, 23, 0) 100%);
  pointer-events: none;
}

.bottom-capsule-container {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
  margin-bottom: calc(var(--safe-bottom, 34px) + 8px);
  pointer-events: auto;
}

/* 一体化暗黑毛玻璃胶囊 */
.search-capsule {
  width: 100%;
  height: 48px;
  background: rgba(42, 46, 56, 0.78);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.14);
  border-radius: 24px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
  cursor: text;
  gap: 10px;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.drawer-search-wrapper.is-active .search-capsule {
  background: rgba(48, 52, 64, 0.92);
  border-color: rgba(255, 255, 255, 0.24);
}

.search-icon {
  color: rgba(255, 255, 255, 0.75);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #ffffff;
  outline: none;
  padding: 0;
  font-family: inherit;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.65);
}

.clear-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
}

/* 胶囊内嵌右侧 ⋮ 按钮 */
.capsule-more-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.75);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 50%;
  transition: color 0.15s ease, transform 0.12s ease;
}

.capsule-more-btn:active {
  color: #ffffff;
  transform: scale(0.92);
}

.capsule-cancel-btn {
  background: transparent;
  border: none;
  color: #22d3ee;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  padding: 0 4px;
  flex-shrink: 0;
}

/* 搜索结果全屏浮层 */
.search-overlay {
  position: fixed;
  inset: 0;
  bottom: 84px;
  background: rgba(14, 18, 26, 0.88);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  z-index: 90;
  pointer-events: auto;
  padding-top: calc(var(--safe-top, 24px) + 50px);
  padding-bottom: 20px;
  box-sizing: border-box;
}

.search-results-box {
  height: 100%;
  overflow-y: auto;
  padding: 10px 20px;
  box-sizing: border-box;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px 12px;
  justify-items: center;
}

.result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
  width: 72px;
}

.result-item:active {
  transform: scale(0.9);
}

.empty-search, .search-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 240px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
