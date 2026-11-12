<script setup>
import { ref, computed } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'

const props = defineProps({
  initialApps: {
    type: Array,
    default: () => ['电话', '设置', '时钟', '信息']
  }
})

const emit = defineEmits(['back', 'save'])

const SYSTEM_APPS = [
  { id: 'phone', name: '电话', iconColor: '#22C55E' },
  { id: 'settings', name: '设置', iconColor: '#64748B' },
  { id: 'clock', name: '时钟', iconColor: '#0EA5E9' },
  { id: 'messages', name: '信息', iconColor: '#3B82F6' },
  { id: 'bilibili', name: '哔哩哔哩', iconColor: '#FB7299' },
  { id: 'amap', name: '高德地图', iconColor: '#0284C7' },
  { id: 'contacts', name: '联系人', iconColor: '#EF4444' },
  { id: 'browser', name: '浏览器', iconColor: '#6366F1' },
  { id: 'recorder', name: '录音机', iconColor: '#DC2626' },
  { id: 'calendar', name: '日历', iconColor: '#10B981' },
  { id: 'gallery', name: '相册', iconColor: '#F59E0B' },
  { id: 'camera', name: '相机', iconColor: '#8B5CF6' }
]

const selectedSet = ref(new Set(props.initialApps.length ? props.initialApps : ['电话', '设置', '时钟', '信息']))

const selectedCount = computed(() => selectedSet.value.size)
const isAllSelected = computed(() => selectedSet.value.size === SYSTEM_APPS.length)

const selectedAppsList = computed(() => {
  return SYSTEM_APPS.filter((a) => selectedSet.value.has(a.name))
})

function toggleApp(appName) {
  if (selectedSet.value.has(appName)) {
    if (selectedSet.value.size > 1) {
      selectedSet.value.delete(appName)
    }
  } else {
    selectedSet.value.add(appName)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedSet.value = new Set(['电话', '设置'])
  } else {
    selectedSet.value = new Set(SYSTEM_APPS.map((a) => a.name))
  }
}

function handleDone() {
  const apps = Array.from(selectedSet.value)
  const summary = apps.length === 1
    ? apps[0]
    : `除了${apps[0]} 和其他 ${apps.length - 1} 个`
  emit('save', {
    enabled: true,
    apps,
    summary
  })
}
</script>

<template>
  <div class="mode-fullscreen-subpage">
    <GlassNavBar overlay :title="`选择的应用程序 (${selectedCount})`" @back="emit('back')">
      <template #right>
        <button class="nav-text-confirm-btn" @click="handleDone">完成</button>
      </template>
    </GlassNavBar>

    <div class="subpage-scrollable">
      <div class="subpage-header-row">
        <div class="select-all-box" @click="toggleSelectAll">
          <div class="custom-checkbox" :class="{ checked: isAllSelected }">
            <svg v-if="isAllSelected" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <span class="select-all-label">全部</span>
        </div>
      </div>

      <p class="limit-desc-note">在此模式下，您只能使用以下应用程序。</p>

      <!-- 已选应用横向展示卡片 -->
      <div v-if="selectedAppsList.length > 0" class="selected-strip-section">
        <div class="section-label">选择的应用程序</div>
        <div class="selected-icons-card">
          <div class="icons-scroll-row">
            <div
              v-for="app in selectedAppsList"
              :key="app.id"
              class="selected-app-cell"
            >
              <div class="app-icon-thumb" :style="{ backgroundColor: app.iconColor }">
                <span>{{ app.name.slice(0, 1) }}</span>
              </div>
              <span class="app-name-text">{{ app.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 所有应用程序列表卡片 -->
      <div class="section-label">所有应用程序</div>
      <div class="apps-list-card">
        <div
          v-for="app in SYSTEM_APPS"
          :key="app.id"
          class="app-picker-row"
          @click="toggleApp(app.name)"
        >
          <div class="custom-checkbox" :class="{ checked: selectedSet.has(app.name) }">
            <svg v-if="selectedSet.has(app.name)" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <div class="app-icon-square" :style="{ backgroundColor: app.iconColor }">
            <span>{{ app.name.slice(0, 1) }}</span>
          </div>

          <div class="app-row-name">{{ app.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mode-fullscreen-subpage {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  color: #18181B;
  z-index: 60;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.subpage-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 64px) 20px calc(var(--home-indicator-inset, 14px) + 32px);
}

.nav-text-confirm-btn {
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: #2563EB;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 12px;
}

.subpage-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.select-all-box {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.custom-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #C4C4C8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.custom-checkbox.checked {
  background-color: #2563EB;
  border-color: #2563EB;
}

.select-all-label {
  font-size: 15px;
  font-weight: 500;
  color: #18181B;
}

.limit-desc-note {
  font-size: 14px;
  color: #71717A;
  margin: 0 0 20px;
}

.section-label {
  font-size: 13.5px;
  font-weight: 600;
  color: #71717A;
  margin: 0 4px 10px;
}

.selected-strip-section {
  margin-bottom: 24px;
}

.selected-icons-card {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 16px 12px;
}

.icons-scroll-row {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 4px 4px 8px;
}

.selected-app-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 58px;
}

.app-icon-thumb {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.app-name-text {
  font-size: 12px;
  color: #18181B;
  white-space: nowrap;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.apps-list-card {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.app-picker-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.app-picker-row:last-child {
  border-bottom: none;
}

.app-picker-row:active {
  background-color: rgba(0, 0, 0, 0.03);
}

.app-icon-square {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
}

.app-row-name {
  font-size: 15.5px;
  font-weight: 500;
  color: #18181B;
}
</style>
