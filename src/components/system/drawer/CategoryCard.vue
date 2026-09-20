<script setup>
import { computed } from 'vue'
import { getDrawerAppById } from '../../../config/drawerApps'

const props = defineProps({
  category: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['select-app', 'open-xhide'])

const largeApps = computed(() => {
  if (props.category.type === '4-large') {
    return (props.category.apps || []).map((id) => getDrawerAppById(id)).filter(Boolean)
  }
  if (props.category.type === '3-large-1-cluster') {
    return (props.category.largeApps || []).map((id) => getDrawerAppById(id)).filter(Boolean)
  }
  return []
})

const clusterApps = computed(() => {
  if (props.category.type === '3-large-1-cluster') {
    return (props.category.clusterApps || []).map((id) => getDrawerAppById(id)).filter(Boolean)
  }
  return []
})

function handleAppClick(appId, e) {
  e.stopPropagation()
  emit('select-app', appId)
}

function handleCardClick() {
  if (props.category.type === 'xhide') {
    emit('open-xhide')
  }
}
</script>

<template>
  <div
    class="category-card"
    :class="{ 'is-xhide': category.type === 'xhide' }"
    @click="handleCardClick"
  >
    <!-- 分类标题 -->
    <div class="card-header">
      <span class="card-title">{{ category.name }}</span>
      <span v-if="category.type === 'xhide'" class="lock-tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </span>
    </div>

    <!-- XHide 隐私锁卡片内容 -->
    <div v-if="category.type === 'xhide'" class="xhide-content">
      <div class="xhide-icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      </div>
      <span class="xhide-tip">隐私保险箱</span>
    </div>

    <!-- 4 大图标网格 -->
    <div v-else-if="category.type === '4-large'" class="grid-layout four-grid">
      <div
        v-for="app in largeApps"
        :key="app.id"
        class="card-app-item"
        @click="handleAppClick(app.id, $event)"
      >
        <div class="app-icon-img-wrap">
          <img :src="app.icon" :alt="app.name" class="app-icon-img" loading="lazy" />
        </div>
        <span class="app-label">{{ app.name }}</span>
      </div>
    </div>

    <!-- 3 大图标 + 1 迷你微簇网格 -->
    <div v-else-if="category.type === '3-large-1-cluster'" class="grid-layout cluster-grid">
      <!-- 3 个大图标 -->
      <div
        v-for="app in largeApps"
        :key="app.id"
        class="card-app-item"
        @click="handleAppClick(app.id, $event)"
      >
        <div class="app-icon-img-wrap">
          <img :src="app.icon" :alt="app.name" class="app-icon-img" loading="lazy" />
        </div>
        <span class="app-label">{{ app.name }}</span>
      </div>

      <!-- 第 4 格：2x2 迷你微簇 -->
      <div class="card-app-item mini-cluster-item">
        <div class="mini-cluster-box">
          <div
            v-for="cApp in clusterApps"
            :key="cApp.id"
            class="mini-app-wrap"
            :title="cApp.name"
            @click="handleAppClick(cApp.id, $event)"
          >
            <img :src="cApp.icon" :alt="cApp.name" class="mini-icon-img" loading="lazy" />
          </div>
        </div>
        <span class="app-label app-label-placeholder">&nbsp;</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-card {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.65);
  border-radius: 20px;
  padding: 12px 10px 10px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.035);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 172px;
  user-select: none;
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease;
}

.category-card:active {
  transform: scale(0.985);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 4px;
}

.card-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #1c1c1e;
  letter-spacing: -0.2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lock-tag {
  color: #10b981;
  display: flex;
  align-items: center;
}

.grid-layout {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 6px 4px;
  flex: 1;
}

.card-app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
}

.app-icon-img-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: transform 0.14s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
}

.card-app-item:active .app-icon-img-wrap {
  transform: scale(0.88);
}

.app-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.app-label {
  font-size: 11px;
  color: #3a3a3c;
  margin-top: 3px;
  text-align: center;
  max-width: 58px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.app-label-placeholder {
  visibility: hidden;
}

/* 2x2 迷你微簇 */
.mini-cluster-box {
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  padding: 3px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 3px;
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.04);
}

.mini-app-wrap {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.mini-app-wrap:active {
  transform: scale(0.82);
}

.mini-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

/* XHide 卡片 */
.is-xhide {
  cursor: pointer;
  background: rgba(255, 255, 255, 0.65);
}

.xhide-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.xhide-icon-wrap {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  background: rgba(16, 185, 129, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.xhide-tip {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}
</style>
