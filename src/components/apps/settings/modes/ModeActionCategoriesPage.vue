<script setup>
import { ref, computed } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import { ACTION_CATEGORIES } from './actionsCatalogData.js'
import ModeActionListPage from './ModeActionListPage.vue'
import SheetOptionPicker from './SheetOptionPicker.vue'

const emit = defineEmits(['back', 'add-action'])

const selectedCategory = ref(null)
const searchQuery = ref('')
const isSearching = ref(false)

const allFlatActions = computed(() => {
  const list = []
  ACTION_CATEGORIES.forEach((cat) => {
    (cat.items || []).forEach((item) => {
      list.push({ ...item, categoryName: cat.name })
    })
  })
  return list
})

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return allFlatActions.value.filter(
    (item) => item.title.toLowerCase().includes(q) || item.categoryName.toLowerCase().includes(q)
  )
})

const activeActionFromSearch = ref(null)

function handleSelectCategory(cat) {
  selectedCategory.value = cat
}

function handleSelectActionFromSubpage(action) {
  emit('add-action', action)
  selectedCategory.value = null
}

function handleSearchItemClick(item) {
  if (item.options && item.options.length > 0) {
    activeActionFromSearch.value = item
  } else {
    emit('add-action', {
      key: item.id,
      label: item.title,
      value: item.defaultVal || '开',
      enabled: true
    })
  }
}

function handleConfirmSearchOption(val) {
  if (activeActionFromSearch.value) {
    emit('add-action', {
      key: activeActionFromSearch.value.id,
      label: activeActionFromSearch.value.title,
      value: val,
      enabled: true
    })
    activeActionFromSearch.value = null
  }
}
</script>

<template>
  <div class="action-categories-fullscreen-page">
    <template v-if="!selectedCategory">
      <GlassNavBar overlay title="添加动作" @back="emit('back')">
        <template #right>
          <button class="nav-round-btn" @click="isSearching = !isSearching">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
        </template>
      </GlassNavBar>

      <div class="categories-scrollable-content">
        <!-- 搜索输入框 -->
        <div v-if="isSearching" class="search-box-wrap">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索所有操作设置"
            autofocus
          />
        </div>

        <!-- 搜索结果列表 -->
        <div v-if="isSearching && searchQuery" class="search-results-card">
          <div v-if="searchResults.length === 0" class="search-empty-text">
            未找到相关操作
          </div>
          <div
            v-for="(res, idx) in searchResults"
            :key="res.id"
            class="search-result-cell"
            :class="{ 'has-divider': idx < searchResults.length - 1 }"
            @click="handleSearchItemClick(res)"
          >
            <div>
              <div class="search-item-title">{{ res.title }}</div>
              <div class="search-item-cat">{{ res.categoryName }}</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>

        <template v-else>
          <!-- 所有操作单卡 -->
          <div class="all-actions-single-card" @click="isSearching = true">
            <div class="all-actions-title">所有操作</div>
          </div>

          <!-- 11 大分类卡片组 -->
          <div class="categories-card-group">
            <div
              v-for="(cat, idx) in ACTION_CATEGORIES"
              :key="cat.id"
              class="category-item-cell"
              :class="{ 'has-divider': idx < ACTION_CATEGORIES.length - 1 }"
              @click="handleSelectCategory(cat)"
            >
              <div class="cat-left-col">
                <div class="cat-icon-badge" :style="{ backgroundColor: cat.iconColor }">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path :d="cat.iconPath"/>
                  </svg>
                </div>
                <div class="cat-name">{{ cat.name }}</div>
              </div>

              <div class="cat-chevron">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- 搜索项选项选择器 -->
      <SheetOptionPicker
        v-if="activeActionFromSearch"
        :title="activeActionFromSearch.title"
        :options="activeActionFromSearch.options"
        :model-value="activeActionFromSearch.defaultVal"
        @cancel="activeActionFromSearch = null"
        @confirm="handleConfirmSearchOption"
      />
    </template>

    <!-- 分类具体动作列表全屏子页 -->
    <ModeActionListPage
      v-else
      :category="selectedCategory"
      @back="selectedCategory = null"
      @select-action="handleSelectActionFromSubpage"
    />
  </div>
</template>

<style scoped>
.action-categories-fullscreen-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  color: #18181B;
  z-index: 58;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-round-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #18181B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nav-round-btn:active {
  background: rgba(0, 0, 0, 0.05);
}

.categories-scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 56px) 16px calc(var(--home-indicator-inset, 14px) + 30px);
}

.search-box-wrap {
  margin-bottom: 14px;
}

.search-input {
  width: 100%;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 15px;
  color: #18181B;
  outline: none;
  box-sizing: border-box;
}

.search-results-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.search-empty-text {
  padding: 24px;
  text-align: center;
  color: #71717A;
  font-size: 15px;
}

.search-result-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  cursor: pointer;
}

.search-result-cell.has-divider {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.search-item-title {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
  margin-bottom: 2px;
}

.search-item-cat {
  font-size: 13px;
  color: #71717A;
}

.all-actions-single-card {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 18px 20px;
  margin-bottom: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.all-actions-single-card:active {
  transform: scale(0.985);
}

.all-actions-title {
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
}

.categories-card-group {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.category-item-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  cursor: pointer;
  background: #FFFFFF;
  transition: background-color 0.15s ease;
}

.category-item-cell:active {
  background-color: #F8F9FA;
}

.category-item-cell.has-divider {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.cat-left-col {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cat-icon-badge {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cat-name {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
}

.cat-chevron {
  display: flex;
  align-items: center;
}
</style>
