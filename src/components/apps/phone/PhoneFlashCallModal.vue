<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const sentNotice = ref('')

function handleSend(msg) {
  sentNotice.value = `已向 ${phoneStore.flashCallTarget?.name || phoneStore.flashCallTarget?.number} 发送「${msg}」`
  setTimeout(() => {
    sentNotice.value = ''
    phoneStore.flashCallTarget = null
  }, 1200)
}

function handleClose() {
  if (!sentNotice.value) {
    phoneStore.flashCallTarget = null
  }
}
</script>

<template>
  <div v-if="phoneStore.flashCallTarget" class="flash-call-modal-overlay" @click.self="handleClose">
    <div class="flash-call-sheet">
      <div class="sheet-drag-handle"></div>
      <div class="sheet-title">Flash Call</div>

      <!-- 发送成功提示 -->
      <div v-if="sentNotice" class="sent-notice-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#00C853" />
          <path d="M8 12l2.5 2.5L16 9" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{{ sentNotice }}</span>
      </div>

      <div v-else class="options-list">
        <button class="flash-option-btn" @click="handleSend('节日快乐')">
          <span>节日快乐</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button class="flash-option-btn" @click="handleSend('请回电话')">
          <span>请回电话</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <button class="flash-option-btn" @click="handleSend('即时信息')">
          <span>即时信息</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <button class="cancel-btn" @click="handleClose">取消</button>
    </div>
  </div>
</template>

<style scoped>
.flash-call-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.flash-call-sheet {
  width: 100%;
  background: #FFFFFF;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 12px 20px 28px;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
}

.sheet-drag-handle {
  width: 36px;
  height: 4px;
  background: #D1D1D6;
  border-radius: 2px;
  margin: 0 auto 12px;
}

.sheet-title {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 16px;
  text-align: center;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.flash-option-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: #F7F8FA;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 14px;
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
  cursor: pointer;
  transition: background 0.15s ease;
}

.flash-option-btn:active {
  background: #ECEEF2;
}

.sent-notice-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 16px;
  font-size: 15px;
  font-weight: 500;
  color: #00C853;
}

.cancel-btn {
  margin-top: 14px;
  padding: 14px;
  background: #F2F3F5;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 500;
  color: #8E8E93;
  cursor: pointer;
}
.cancel-btn:active {
  background: #E5E7EB;
}
</style>
