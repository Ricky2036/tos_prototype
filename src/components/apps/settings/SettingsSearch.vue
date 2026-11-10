<script setup>
import { ref, computed } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import SettingsSearchDock from '../../ui/SettingsSearchDock.vue'
import SearchEmptyState from '../../ui/SearchEmptyState.vue'

const props = defineProps({
  searchableItems: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['back', 'navigate'])

// 搜索输入内容
const searchQuery = ref('')

// 搜索建议列表（参考图 1）
const suggestions = [
  '专用 DNS',
  '系统导航',
  '日期与时间',
  '屏幕使用时间',
  '锁屏设置'
]

// 搜索历史（默认参考图 2 扩充至两行：声音、通用、Apple 账户、电池、隐私）
const STORAGE_KEY = 'tos_settings_search_history_v2'
const defaultHistory = ['声音', '通用', 'Apple 账户', '电池', '隐私']

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    // 降级使用默认列表
  }
  return [...defaultHistory]
}

function saveHistory(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    // 忽略异常
  }
}

const historyList = ref(loadHistory())

// 是否处于历史记录编辑模式（点击垃圾桶图标后切换，参考图 2）
const isHistoryEditing = ref(false)

// 切换编辑模式
function toggleHistoryEdit() {
  if (historyList.value.length === 0) return
  isHistoryEditing.value = !isHistoryEditing.value
}

// 单独删除其中一个搜索记录（参考图 2）
function deleteHistoryItem(index) {
  historyList.value.splice(index, 1)
  saveHistory(historyList.value)
  if (historyList.value.length === 0) {
    isHistoryEditing.value = false
  }
}

// 全部删除历史记录（参考图 2 标题右侧按钮）
function clearAllHistory() {
  historyList.value = []
  saveHistory([])
  isHistoryEditing.value = false
}

// 记录新的搜索历史
function addHistoryItem(kw) {
  const trimmed = kw.trim()
  if (!trimmed) return
  const filtered = historyList.value.filter(item => item !== trimmed)
  historyList.value = [trimmed, ...filtered].slice(0, 10)
  saveHistory(historyList.value)
}

// 点击标签（搜索建议或搜索历史）触发搜索
function selectKeyword(kw) {
  searchQuery.value = kw
  addHistoryItem(kw)
}

// 实时过滤搜索结果
const filteredResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return props.searchableItems.filter(item =>
    item.title?.toLowerCase().includes(q) ||
    item.group?.toLowerCase().includes(q)
  )
})

// 点击搜索结果项
function handleItemClick(item) {
  if (searchQuery.value.trim()) {
    addHistoryItem(searchQuery.value.trim())
  }
  emit('navigate', item)
}

// 清空当前搜索框输入
function clearSearch() {
  searchQuery.value = ''
}

// 回车提交
function handleEnter() {
  if (searchQuery.value.trim()) {
    addHistoryItem(searchQuery.value.trim())
  }
}

</script>

<template>
  <div class="settings-search-page">
    <!-- 主体滚动区域 -->
    <div class="search-body-scroll scrollable">
      <!-- 当无搜索输入时：展示“搜索建议”与“搜索历史” -->
      <template v-if="!searchQuery.trim()">
        <!-- 模块 1：搜索建议 -->
        <section class="search-section">
          <div class="section-header">
            <h2 class="section-title">搜索建议</h2>
          </div>
          <div class="chips-wrap">
            <button
              v-for="item in suggestions"
              :key="item"
              type="button"
              class="search-chip"
              @click="selectKeyword(item)"
            >
              {{ item }}
            </button>
          </div>
        </section>

        <!-- 模块 2：搜索历史 -->
        <section v-if="historyList.length > 0" class="search-section history-section">
          <div class="section-header">
            <h2 class="section-title">搜索历史</h2>
            <div class="header-action-wrap">
              <!-- 编辑模式下显示“全部删除”文字按钮（参考图 2） -->
              <button
                v-if="isHistoryEditing"
                type="button"
                class="history-delete-all-btn"
                @click="clearAllHistory"
              >
                全部删除
              </button>
              <!-- 正常模式下显示垃圾桶图标（参考图 1） -->
              <button
                v-else
                type="button"
                class="history-action-btn"
                aria-label="删除搜索历史"
                @click="toggleHistoryEdit"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="chips-wrap">
            <div
              v-for="(item, idx) in historyList"
              :key="item"
              class="search-chip history-chip"
              :class="{ 'is-editing': isHistoryEditing }"
              @click="isHistoryEditing ? null : selectKeyword(item)"
            >
              <span class="chip-text">{{ item }}</span>
              <!-- 编辑模式下展示单独删除的叉号按钮（参考图 2：无背景） -->
              <button
                v-if="isHistoryEditing"
                type="button"
                class="chip-delete-btn"
                :aria-label="`删除 ${item}`"
                @click.stop="deleteHistoryItem(idx)"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </template>

      <!-- 当有搜索输入时：展示实时匹配结果 -->
      <template v-else>
        <div v-if="filteredResults.length > 0" class="search-results-section">
          <div class="search-results-header">
            搜索结果 ({{ filteredResults.length }})
          </div>

          <div class="results-card">
            <ListCell
              v-for="(item, idx) in filteredResults"
              :key="item.id"
              :title="item.title"
              :subtitle="item.group"
              :value="item.value"
              :chevron="!item.isToggle"
              :last="idx === filteredResults.length - 1"
              @click="handleItemClick(item)"
            />
          </div>

        </div>
        <SearchEmptyState v-else />
      </template>
    </div>

    <!-- 底部操作栏：全仓标准搜索 Dock 的激活态（圆形返回 + 无麦克风胶囊） -->
    <SettingsSearchDock
      v-model="searchQuery"
      :active="true"
      fade-color="#F8F9FA"
      @back="emit('back')"
      @clear="clearSearch"
    />
  </div>
</template>

<style scoped>
.settings-search-page {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #F8F9FA;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
  font-family: var(--font-stack);
}

/* 滚动主体内容 */
.search-body-scroll {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 20px) 20px calc(var(--safe-bottom, 34px) + 84px) 20px;
  box-sizing: border-box;
}

/* 栏目区块 */
.search-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  min-height: 24px;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.2px;
}

.header-action-wrap {
  display: flex;
  align-items: center;
}

/* 垃圾桶图标按钮（图 1） */
.history-action-btn {
  background: transparent;
  border: none;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.history-action-btn:active {
  transform: scale(0.92);
  opacity: 0.7;
}

/* 全部删除文字按钮（图 2） */
.history-delete-all-btn {
  background: transparent;
  border: none;
  color: #8E8E93;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: color 0.15s ease, transform 0.15s ease;
}

.history-delete-all-btn:hover {
  color: #FF3B30;
}

.history-delete-all-btn:active {
  transform: scale(0.94);
  color: #FF3B30;
}

/* 标签胶囊容器 */
.chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 10px;
}

/* 胶囊标签通用样式 */
.search-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 16px;
  border-radius: 18px;
  background: #ECEEF2;
  color: #3A3A3C;
  font-size: 14px;
  font-weight: 400;
  border: none;
  outline: none;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  box-sizing: border-box;
}

.search-chip:active {
  background: #E2E4E9;
  transform: scale(0.97);
}

/* 历史胶囊特殊样式（图 2） */
.history-chip {
  position: relative;
}

.history-chip.is-editing {
  padding-right: 10px;
  background: #ECEEF2;
  cursor: default;
}

.history-chip.is-editing:active {
  transform: none;
}

.chip-text {
  line-height: 1;
}

/* 单独删除叉号按钮（参考图 2：无背景） */
.chip-delete-btn {
  width: 18px;
  height: 18px;
  background: transparent;
  color: #8E8E93;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  padding: 0;
  cursor: pointer;
  outline: none;
  transition: color 0.15s ease, transform 0.15s ease;
}

.chip-delete-btn:hover {
  color: #1C1C1E;
}

.chip-delete-btn:active {
  transform: scale(0.85);
  color: #FF3B30;
}

/* 搜索结果展示 */
.search-results-section {
  display: flex;
  flex-direction: column;
}

.search-results-header {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin-bottom: 12px;
  padding-left: 4px;
}

.results-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 0.5px solid rgba(0, 0, 0, 0.06);
}




/* 左侧圆形返回按钮 */


/* 右侧胶囊输入框容器 */






</style>
