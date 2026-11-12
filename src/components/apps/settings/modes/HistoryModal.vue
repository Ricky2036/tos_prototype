<script setup>
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import GlassNavBar from '../../../ui/GlassNavBar.vue'

const emit = defineEmits(['close'])

const store = useModesAndRoutinesStore()

function handleClear() {
  store.clearHistory()
}
</script>

<template>
  <div class="history-modal">
    <!-- 统一玻璃悬浮导航条 -->
    <GlassNavBar overlay title="历史记录" @back="emit('close')">
      <template #right>
        <button v-if="store.historyLogs.length > 0" class="clear-text-btn" @click="handleClear">
          清除
        </button>
      </template>
    </GlassNavBar>

    <!-- 列表内容 -->
    <div class="history-body">
      <div v-if="store.historyLogs.length === 0" class="empty-history">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="empty-text">暂无运行历史</div>
      </div>

      <div v-else class="history-list">
        <div
          v-for="log in store.historyLogs"
          :key="log.id"
          class="history-card"
        >
          <div class="log-time">{{ log.time }}</div>
          <div class="log-text">{{ log.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-modal {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  color: #18181B;
  z-index: 70;
  overflow: hidden;
  user-select: none;
}

.clear-text-btn {
  border: none;
  background: transparent;
  color: #EF4444;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
}

.history-body {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 54px) 16px calc(var(--home-indicator-inset, 14px) + 30px);
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.empty-icon {
  margin-bottom: 12px;
}

.empty-text {
  font-size: 15px;
  color: #71717A;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 16px 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.log-time {
  font-size: 12px;
  color: #71717A;
  margin-bottom: 4px;
}

.log-text {
  font-size: 15px;
  font-weight: 500;
  color: #18181B;
}
</style>
