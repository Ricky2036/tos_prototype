<script setup>
import { ref, computed } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import SheetOptionPicker from './SheetOptionPicker.vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'select-action'])

const searchQuery = ref('')
const isSearching = ref(false)

const activeAction = ref(null)

const filteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.category.items || []
  return (props.category.items || []).filter((item) =>
    item.title.toLowerCase().includes(q)
  )
})

function handleItemClick(item) {
  if (item.options && item.options.length > 0) {
    activeAction.value = item
  } else {
    emit('select-action', {
      key: item.id,
      label: item.title,
      value: item.defaultVal || '开',
      enabled: true
    })
  }
}

function handleConfirmOption(val) {
  if (activeAction.value) {
    emit('select-action', {
      key: activeAction.value.id,
      label: activeAction.value.title,
      value: val,
      enabled: true
    })
    activeAction.value = null
  }
}
</script>

<template>
  <div class="action-list-fullscreen-page">
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

    <div class="list-scrollable-content">
      <!-- 类别副标题 -->
      <div class="category-header-title">
        {{ category.name }}
      </div>

      <!-- 搜索输入框（展开时） -->
      <div v-if="isSearching" class="search-box-row">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="`在${category.name}中搜索动作`"
          autofocus
        />
      </div>

      <!-- 动作卡片列表 -->
      <div class="actions-card-group">
        <div
          v-for="(item, idx) in filteredItems"
          :key="item.id"
          class="action-item-cell"
          :class="{ 'has-divider': idx < filteredItems.length - 1 }"
          @click="handleItemClick(item)"
        >
          <div class="item-left-col">
            <div class="action-item-title">{{ item.title }}</div>
          </div>
          <div class="action-item-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部参数选项选择器 -->
    <SheetOptionPicker
      v-if="activeAction"
      :title="activeAction.title"
      :options="activeAction.options"
      :model-value="activeAction.defaultVal"
      @cancel="activeAction = null"
      @confirm="handleConfirmOption"
    />
  </div>
</template>

<style scoped>
.action-list-fullscreen-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  color: #18181B;
  z-index: 60;
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

.list-scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 56px) 16px calc(var(--home-indicator-inset, 14px) + 30px);
}

.category-header-title {
  font-size: 14px;
  font-weight: 600;
  color: #71717A;
  margin: 8px 8px 14px 8px;
}

.search-box-row {
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

.actions-card-group {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.action-item-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background: #FFFFFF;
  transition: background-color 0.15s ease;
}

.action-item-cell:active {
  background-color: #F8F9FA;
}

.action-item-cell.has-divider {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.action-item-title {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
}

.action-item-arrow {
  display: flex;
  align-items: center;
}
</style>
