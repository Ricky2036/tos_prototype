<script setup>
import { ref, computed } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'

const emit = defineEmits(['close', 'select'])

const searchQuery = ref('')

const ACTION_CATEGORIES = [
  {
    category: '显示',
    items: [
      { type: 'display', title: '黑暗模式', value: '开' },
      { type: 'display', title: '护眼模式', value: '自适应' },
      { type: 'display', title: '极暗', value: '开: 80%' },
      { type: 'display', title: '屏幕亮度', value: '设定为 50%' },
      { type: 'display', title: '屏幕超时', value: '5 分钟' }
    ]
  },
  {
    category: '声音与振动',
    items: [
      { type: 'sound', title: '声音模式', value: '静音' },
      { type: 'sound', title: '媒体音量', value: '调整至 0%' },
      { type: 'dnd', title: '免打扰模式', value: '开' },
      { type: 'sound', title: '振动强度', value: '标准' }
    ]
  },
  {
    category: '网络与连接',
    items: [
      { type: 'wifi', title: '无线局域网开关', value: '开启' },
      { type: 'bluetooth', title: '蓝牙开关', value: '开启' },
      { type: 'flight', title: '飞行模式', value: '关闭' },
      { type: 'hotspot', title: '个人热点', value: '开启' }
    ]
  },
  {
    category: '应用程序与通知',
    items: [
      { type: 'notif', title: '语音朗读通知', value: '开启重要通知播报' },
      { type: 'app', title: '打开应用程序', value: '启动所选应用' },
      { type: 'privacy', title: '清除剪贴板', value: '抹除剪贴板数据' }
    ]
  },
  {
    category: '电池与优化',
    items: [
      { type: 'battery', title: '省电模式', value: '开启' },
      { type: 'battery', title: '电池保护', value: '限制充电至 85%' }
    ]
  }
]

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return ACTION_CATEGORIES
  return ACTION_CATEGORIES.map((cat) => {
    const matchedItems = cat.items.filter(
      (item) => item.title.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
    )
    return { ...cat, items: matchedItems }
  }).filter((cat) => cat.items.length > 0)
})

function handleSelect(item) {
  emit('select', {
    id: `a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...item
  })
}
</script>

<template>
  <div class="picker-modal">
    <!-- 统一玻璃悬浮导航条 -->
    <GlassNavBar overlay title="则 (添加动作)" @back="emit('close')" />

    <div class="picker-content-wrap">
      <!-- 搜索栏 -->
      <div class="search-bar-wrap">
      <div class="search-bar-inner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#71717A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="picker-search-input"
          placeholder="搜索动作指令"
        />
        <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 动作类别列表 -->
    <div class="picker-body-scrollable">
      <div
        v-for="cat in filteredCategories"
        :key="cat.category"
        class="picker-category-group"
      >
        <div class="category-title">{{ cat.category }}</div>
        <div class="category-card">
          <div
            v-for="(item, idx) in cat.items"
            :key="item.title"
            class="picker-row"
            :class="{ 'border-bottom': idx !== cat.items.length - 1 }"
            @click="handleSelect(item)"
          >
            <div class="picker-row-info">
              <div class="picker-row-title">{{ item.title }}</div>
              <div class="picker-row-desc">{{ item.value }}</div>
            </div>
            <div class="picker-row-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.picker-modal {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  color: #18181B;
  z-index: 90;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

.picker-content-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: calc(var(--safe-top, 44px) + 54px);
}

.picker-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--safe-top, 44px);
  height: calc(var(--safe-top, 44px) + 52px);
  padding-left: 8px;
  padding-right: 8px;
  flex: none;
  background: #F4F5F7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.nav-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #18181B;
  border-radius: 50%;
  cursor: pointer;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #18181B;
}

.nav-placeholder {
  width: 40px;
}

.search-bar-wrap {
  padding: 12px 16px 8px;
  background: #F4F5F7;
}

.search-bar-inner {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  padding: 0 12px;
  height: 40px;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.picker-search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: #18181B;
  font-size: 14px;
  outline: none;
}

.picker-search-input::placeholder {
  color: #8E8E93;
}

.clear-search-btn {
  border: none;
  background: rgba(0, 0, 0, 0.08);
  color: #71717A;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.picker-body-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 40px;
}

.picker-category-group {
  margin-bottom: 18px;
}

.category-title {
  font-size: 13px;
  font-weight: 600;
  color: #71717A;
  margin-bottom: 8px;
  padding: 0 4px;
}

.category-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.picker-row:active {
  background: #FAFAFA;
}

.picker-row.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.picker-row-info {
  flex: 1;
  min-width: 0;
}

.picker-row-title {
  font-size: 15px;
  font-weight: 600;
  color: #18181B;
  margin-bottom: 2px;
}

.picker-row-desc {
  font-size: 12px;
  color: #71717A;
}

.picker-row-action {
  color: #A1A1AA;
  flex: none;
  margin-left: 10px;
}
</style>
