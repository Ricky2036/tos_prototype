<script setup>
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import { getIconPath } from './modeIcons.js'

const store = useModesAndRoutinesStore()

const emit = defineEmits(['select-template'])

function handleCardClick(item) {
  emit('select-template', item)
}
</script>

<template>
  <div class="discover-tab-content">
    <div class="discover-intro-text">
      为各种场景设置日常程序，实现日常生活自动化。
    </div>

    <!-- 分组展示 -->
    <div
      v-for="cat in store.discoverCategories"
      :key="cat.id"
      class="discover-section"
    >
      <div class="discover-section-title">{{ cat.title }}</div>

      <!-- 2 列网格卡片 -->
      <div class="discover-grid">
        <div
          v-for="item in cat.items"
          :key="item.id"
          class="discover-card"
          @click="handleCardClick(item)"
        >
          <div class="card-icon-badge" :style="{ backgroundColor: item.color }">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path :d="getIconPath(item.iconKey)" />
            </svg>
          </div>
          <div class="card-title">{{ item.name }}</div>
          <div class="card-desc">{{ item.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.discover-tab-content {
  padding: 0 16px 120px;
}

.discover-intro-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-secondary, #8E8E93);
  margin-bottom: 20px;
  padding: 0 4px;
}

.discover-section {
  margin-bottom: 24px;
}

.discover-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: 12px;
  padding: 0 4px;
}

/* 双列网格 */
.discover-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

/* 发现卡片：四边微细边框，微弱圆角与底色 */
.discover-card {
  display: flex;
  flex-direction: column;
  background: var(--color-card-bg, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 18px;
  padding: 16px 14px;
  min-height: 140px;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
  user-select: none;
}

.discover-card:active {
  transform: scale(0.98);
  background: var(--color-card-active, rgba(255, 255, 255, 0.08));
}

.card-icon-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  flex: none;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: 6px;
  line-height: 1.35;
}

.card-desc {
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-text-secondary, #8E8E93);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
