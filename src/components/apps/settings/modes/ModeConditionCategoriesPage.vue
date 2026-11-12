<script setup>
import { ref, computed } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import SheetOptionPicker from './SheetOptionPicker.vue'

const emit = defineEmits(['back', 'select'])

const searchQuery = ref('')
const isSearching = ref(false)

const SECTIONS = [
  {
    title: '情境',
    items: [
      { id: 'wake_time', title: '醒来时间', defaultVal: '检测到醒来时', options: ['闹钟响起时', '检测到日常活动时', '检测到解锁时'] },
      { id: 'bed_time', title: '睡前', defaultVal: '准备就寝', options: ['根据睡眠规律推断', '入睡前 30 分钟', '入睡前 1 小时'] },
      { id: 'sleeping', title: '睡眠', defaultVal: '睡眠中', options: ['睡眠期间始终开启', '检测到熟睡时'] },
      { id: 'driving', title: '驾驶', defaultVal: '连接到车载蓝牙', options: ['连接到车载蓝牙', '检测到行车运动'] },
      { id: 'international_travel', title: '出国旅行', defaultVal: '连接到国际漫游网络', options: ['连接到国际漫游网络', '时区变更'] }
    ]
  },
  {
    title: '时间',
    items: [
      { id: 'time_period', title: '时间段', defaultVal: '22:00 - 次日 07:00 (每天)', options: ['22:00 - 次日 07:00 (每天)', '工作日 09:00 - 18:00', '周末 10:00 - 20:00', '自定义时间段'] }
    ]
  },
  {
    title: '地点',
    items: [
      { id: 'location_place', title: '地点', defaultVal: '到达“家”', options: ['到达“家”', '离开“家”', '到达“公司”', '离开“公司”'] }
    ]
  },
  {
    title: '连接',
    items: [
      { id: 'wifi_network', title: 'WLAN 网络', defaultVal: '已连接到指定 Wi-Fi', options: ['已连接到家用 Wi-Fi', '已连接到公司 Wi-Fi', '断开所有 Wi-Fi'] },
      { id: 'wifi_signal', title: 'WLAN 信号强度', defaultVal: '信号良好', options: ['信号极佳', '信号良好', '信号微弱'] },
      { id: 'wifi_state', title: 'WLAN', defaultVal: '开启', options: ['开启', '关闭'] }
    ]
  }
]

const activeOptionPickerItem = ref(null)

const filteredSections = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return SECTIONS
  return SECTIONS.map((sec) => {
    const matched = sec.items.filter((item) => item.title.toLowerCase().includes(q))
    return { ...sec, items: matched }
  }).filter((sec) => sec.items.length > 0)
})

function handleItemClick(item) {
  if (item.options && item.options.length > 0) {
    activeOptionPickerItem.value = item
  } else {
    emit('select', {
      type: item.id,
      title: item.title,
      value: item.defaultVal || '已启用',
      enabled: true
    })
  }
}

function handleConfirmOption(val) {
  if (activeOptionPickerItem.value) {
    emit('select', {
      type: activeOptionPickerItem.value.id,
      title: activeOptionPickerItem.value.title,
      value: val,
      enabled: true
    })
    activeOptionPickerItem.value = null
  }
}
</script>

<template>
  <div class="condition-categories-fullscreen-page">
    <GlassNavBar overlay title="条件" @back="emit('back')">
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
      <!-- 搜索栏 -->
      <div v-if="isSearching" class="search-box-wrap">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索所有条件"
          autofocus
        />
      </div>

      <!-- 分组卡片列表 -->
      <div
        v-for="sec in filteredSections"
        :key="sec.title"
        class="condition-section-group"
      >
        <div class="section-title">{{ sec.title }}</div>
        <div class="section-card">
          <div
            v-for="(item, idx) in sec.items"
            :key="item.id"
            class="condition-item-cell"
            :class="{ 'has-divider': idx < sec.items.length - 1 }"
            @click="handleItemClick(item)"
          >
            <div class="condition-item-name">{{ item.title }}</div>
            <div class="condition-item-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部参数选项选择器 -->
    <SheetOptionPicker
      v-if="activeOptionPickerItem"
      :title="activeOptionPickerItem.title"
      :options="activeOptionPickerItem.options"
      :model-value="activeOptionPickerItem.defaultVal"
      @cancel="activeOptionPickerItem = null"
      @confirm="handleConfirmOption"
    />
  </div>
</template>

<style scoped>
.condition-categories-fullscreen-page {
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

.condition-section-group {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #71717A;
  margin: 0 4px 10px 4px;
}

.section-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.condition-item-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background: #FFFFFF;
  transition: background-color 0.15s ease;
}

.condition-item-cell:active {
  background-color: #F8F9FA;
}

.condition-item-cell.has-divider {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.condition-item-name {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
}

.condition-item-arrow {
  display: flex;
  align-items: center;
}
</style>
