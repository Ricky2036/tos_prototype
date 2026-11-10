<script setup>
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'

const emit = defineEmits(['close'])

const store = useModesAndRoutinesStore()

function handleClear() {
  store.clearHistory()
}
</script>

<template>
  <div class="history-modal">
    <!-- 顶部导航栏 -->
    <div class="modal-nav-bar">
      <button class="nav-back-btn" @click="emit('close')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <div class="nav-title">历史记录</div>
      <button v-if="store.historyLogs.length > 0" class="clear-btn" @click="handleClear">
        清除
      </button>
      <div v-else class="nav-placeholder"></div>
    </div>

    <!-- 列表内容 -->
    <div class="history-body">
      <div v-if="store.historyLogs.length === 0" class="empty-history">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
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
  background: var(--color-bg-primary, #000000);
  z-index: 60;
  overflow: hidden;
}

.modal-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--safe-top, 44px);
  height: calc(var(--safe-top, 44px) + 52px);
  padding-left: 8px;
  padding-right: 8px;
  flex: none;
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  box-sizing: border-box;
}

.nav-back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-primary, #FFFFFF);
  border-radius: 50%;
  cursor: pointer;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
}

.clear-btn {
  border: none;
  background: transparent;
  color: #EF4444;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 12px;
  cursor: pointer;
}

.nav-placeholder {
  width: 40px;
}

.history-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 80px;
  color: var(--color-text-secondary, #8E8E93);
}

.empty-icon {
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-card {
  background: var(--color-card-bg, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 14px;
  padding: 14px 16px;
}

.log-time {
  font-size: 12px;
  font-weight: 600;
  color: #3B82F6;
  margin-bottom: 4px;
}

.log-text {
  font-size: 14px;
  line-height: 1.45;
  color: var(--color-text-primary, #FFFFFF);
}
</style>
