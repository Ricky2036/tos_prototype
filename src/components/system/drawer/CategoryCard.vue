<script setup>
import { computed } from 'vue'
import { getDrawerAppById } from '../../../config/drawerApps'
import { useHomeStore } from '../../../stores/homeStore'
import AppIcon from '../../ui/AppIcon.vue'

const props = defineProps({
  category: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select-app', 'open-xhide'])

const home = useHomeStore()
const isInstalled = (id) => (home.appInstalled ? home.appInstalled(id) : true)

const largeApps = computed(() => {
  if (props.category.type === '4-large') {
    return (props.category.apps || [])
      .filter(isInstalled)
      .map((id) => getDrawerAppById(id))
      .filter(Boolean)
  }
  if (props.category.type === '3-large-1-cluster') {
    return (props.category.largeApps || [])
      .filter(isInstalled)
      .map((id) => getDrawerAppById(id))
      .filter(Boolean)
  }
  return []
})

const clusterApps = computed(() => {
  if (props.category.type === '3-large-1-cluster') {
    return (props.category.clusterApps || [])
      .filter(isInstalled)
      .map((id) => getDrawerAppById(id))
      .filter(Boolean)
  }
  return []
})

function handleAppClick(appId, e) {
  e?.stopPropagation()
  emit('select-app', appId)
}

function handleCardClick() {
  if (props.category.type === 'xhide') {
    emit('open-xhide')
  }
}
</script>

<template>
  <div class="category-folder-wrapper" @click="handleCardClick">
    <!-- 桌面大文件夹 1:1 正方形深色磨砂卡片主体 -->
    <div
      class="folder-card"
      :class="{ 'is-xhide': category.type === 'xhide' }"
    >
      <!-- XHide 隐私保险箱卡片 -->
      <div v-if="category.type === 'xhide'" class="xhide-content">
        <div class="xhide-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <span class="xhide-tip">隐私保险箱</span>
      </div>

      <!-- 4 大图标布局：复用原生 AppIcon，动态时钟走针/日历 -->
      <div v-else-if="category.type === '4-large'" class="grid-2x2">
        <div
          v-for="app in largeApps"
          :key="app.id"
          class="folder-app-item"
          @click="handleAppClick(app.id, $event)"
        >
          <AppIcon
            :app="app"
            :size="52"
            :show-label="false"
            :launch-on-click="false"
          />
        </div>
      </div>

      <!-- 3 大图标 + 1 迷你微簇布局 -->
      <div v-else-if="category.type === '3-large-1-cluster'" class="grid-2x2">
        <!-- 3 个大图标 -->
        <div
          v-for="app in largeApps"
          :key="app.id"
          class="folder-app-item"
          @click="handleAppClick(app.id, $event)"
        >
          <AppIcon
            :app="app"
            :size="52"
            :show-label="false"
            :launch-on-click="false"
          />
        </div>

        <!-- 第 4 格：2x2 迷你微簇 -->
        <div class="mini-cluster-grid">
          <div
            v-for="cApp in clusterApps"
            :key="cApp.id"
            class="mini-app-item"
            @click="handleAppClick(cApp.id, $event)"
          >
            <AppIcon
              :app="cApp"
              :size="24"
              :show-label="false"
              :launch-on-click="false"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 分类文件夹名称（位于卡片外正下方居中，严谨像素对齐真实真机） -->
    <div class="folder-name">{{ category.name }}</div>
  </div>
</template>

<style scoped>
.category-folder-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  user-select: none;
  width: 100%;
}

/* 1:1 正方形深色半透磨砂文件夹卡片 */
.folder-card {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(55, 59, 70, 0.45);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.14);
  border-radius: 26px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22);
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease;
  overflow: hidden;
}

.folder-card:active {
  transform: scale(0.965);
}

/* 2x2 网格，卡内 0 文字 */
.grid-2x2 {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 8px;
  box-sizing: border-box;
  align-items: center;
  justify-items: center;
}

.folder-app-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 15px;
  transition: transform 0.12s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.folder-app-item:active {
  transform: scale(0.88);
}

/* 2x2 迷你微簇容器 */
.mini-cluster-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 4px;
  padding: 4px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  align-items: center;
  justify-items: center;
}

.mini-app-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  transition: transform 0.1s ease;
}

.mini-app-item:active {
  transform: scale(0.84);
}

/* 卡片正下方标题 */
.folder-name {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.92);
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* XHide 专属卡片 */
.folder-card.is-xhide {
  background: rgba(30, 35, 45, 0.6);
  border-color: rgba(34, 211, 238, 0.25);
  cursor: pointer;
}

.xhide-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.xhide-icon-wrap {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(34, 211, 238, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.xhide-tip {
  font-size: 12px;
  color: #22d3ee;
  font-weight: 600;
}
</style>
