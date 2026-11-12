<script setup>
import { ref, computed } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'

const emit = defineEmits(['close', 'select'])

const searchQuery = ref('')

const CONDITION_CATEGORIES = [
  {
    category: '手动',
    items: [
      { type: 'manual', title: '手动启动', value: '点击小组件或快捷入口' }
    ]
  },
  {
    category: '时间与日程',
    items: [
      { type: 'time', title: '时间段', value: '22:00 - 次日 06:30' },
      { type: 'time_specific', title: '特定时间', value: '工作日 08:30' },
      { type: 'alarm', title: '闹钟关闭时', value: '早晨闹钟被划过停止' }
    ]
  },
  {
    category: '情境',
    items: [
      { type: 'context', title: '醒来时间', value: '检测到晨起活动' },
      { type: 'context', title: '睡前', value: '准备就寝' },
      { type: 'context', title: '驾驶中', value: '车载系统或蓝牙连接' },
      { type: 'context', title: '运动健身', value: '开始跑步或锻炼' },
      { type: 'context', title: '通勤上班', value: '出发前往工作地点' },
      { type: 'context', title: '通勤回家', value: '离开工作地点回家' }
    ]
  },
  {
    category: '地点',
    items: [
      { type: 'location', title: '到达位置', value: '到达“家”或“公司”' },
      { type: 'location', title: '离开位置', value: '离开当前位置' }
    ]
  },
  {
    category: '连接与设备',
    items: [
      { type: 'wifi', title: '无线网络', value: '连接到指定无线局域网' },
      { type: 'bluetooth', title: '蓝牙设备', value: '连接到蓝牙耳机或音箱' },
      { type: 'nfc', title: 'NFC 触碰', value: '轻触指定近场通信标签' }
    ]
  },
  {
    category: '电池与充电',
    items: [
      { type: 'battery', title: '电量水平', value: '电量低于 20% 或达到 100%' },
      { type: 'battery_charge', title: '充电状态', value: '开始有线或无线充电' }
    ]
  },
  {
    category: '应用程序与通知',
    items: [
      { type: 'app', title: '打开指定应用', value: '启动相机、游戏或音乐' },
      { type: 'notif', title: '收到特定应用通知', value: '包含关键词的新通知' }
    ]
  }
]

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return CONDITION_CATEGORIES
  return CONDITION_CATEGORIES.map((cat) => {
    const matchedItems = cat.items.filter(
      (item) => item.title.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
    )
    return { ...cat, items: matchedItems }
  }).filter((cat) => cat.items.length > 0)
})

function handleSelect(item) {
  emit('select', {
    id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...item
  })
}
</script>

<template>
  <div class="picker-modal">
    <!-- 统一玻璃悬浮导航栏 -->
    <GlassNavBar overlay title="如果 (添加条件)" @back="emit('close')" />

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
          placeholder="搜索条件"
        />
        <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 条件类别列表 -->
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
