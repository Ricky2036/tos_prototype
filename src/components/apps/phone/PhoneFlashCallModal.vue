<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const selectedOption = ref('节日快乐')
const sentNotice = ref('')

function handleSelect(opt) {
  selectedOption.value = opt
}

function handleSendFlash() {
  const targetName = phoneStore.flashCallTarget?.name || phoneStore.flashCallTarget?.number || '对方'
  sentNotice.value = `已向 ${targetName} 发送 Flash Call「${selectedOption.value}」`
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
      <div class="sheet-title">Flash Call</div>

      <!-- 发送成功提示 -->
      <div v-if="sentNotice" class="sent-notice-bar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#00C853" />
          <path d="M8 12l2.5 2.5L16 9" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>{{ sentNotice }}</span>
      </div>

      <div v-else class="sheet-content-wrap">
        <!-- 选项列表 -->
        <div class="options-list">
          <button
            v-for="opt in ['节日快乐', '请回电话', '即时信息']"
            :key="opt"
            class="flash-option-item"
            :class="{ active: selectedOption === opt }"
            @click="handleSelect(opt)"
          >
            <span class="opt-text">{{ opt }}</span>
          </button>
        </div>

        <!-- 底部双胶囊按钮：取消 & 仅 Flash -->
        <div class="sheet-bottom-actions">
          <button class="action-btn-pill btn-cancel" @click="handleClose">
            取消
          </button>
          <button class="action-btn-pill btn-flash" @click="handleSendFlash">
            仅 Flash
          </button>
        </div>
      </div>
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
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.flash-call-sheet {
  width: 100%;
  background: #FFFFFF;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  padding: 24px 20px 32px;
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
}

.sheet-title {
  font-size: 20px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 20px;
  text-align: center;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.flash-option-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #FFFFFF;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.flash-option-item:active,
.flash-option-item.active {
  background-color: #F2F3F5;
}

.opt-text {
  font-size: 16px;
  color: #1C1C1E;
  font-weight: 500;
}

/* 底部双胶囊按键 */
.sheet-bottom-actions {
  display: flex;
  gap: 14px;
}

.action-btn-pill {
  flex: 1;
  height: 50px;
  border-radius: 25px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, opacity 0.15s ease;
}

.action-btn-pill:active {
  transform: scale(0.97);
}

.btn-cancel {
  background-color: #F2F3F5;
  color: #1C1C1E;
}

.btn-flash {
  background-color: #00C853;
  color: #FFFFFF;
  box-shadow: 0 4px 14px rgba(0, 200, 83, 0.3);
}

.sent-notice-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px 16px;
  font-size: 15px;
  font-weight: 500;
  color: #00C853;
}
</style>
