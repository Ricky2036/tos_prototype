<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()

const isMuted = ref(false)
const isSpeaker = ref(false)
const isRecording = ref(false)
const showKeypadInCall = ref(false)

const duration = ref(0)
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    if (phoneStore.activeCall && phoneStore.activeCall.status === 'connected') {
      duration.value++
    }
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(timer)
})

function formatDuration(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
</script>

<template>
  <div v-if="phoneStore.activeCall" class="phone-call-screen">
    <!-- 顶部通话人信息 -->
    <div class="call-header">
      <div class="call-avatar">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="#FFFFFF">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
      <div class="call-name">{{ phoneStore.activeCall.name }}</div>
      <div class="call-number">{{ phoneStore.activeCall.number }}</div>
      <div class="call-status">
        <span v-if="phoneStore.activeCall.status === 'calling'" class="calling-pulse">正在呼叫...</span>
        <span v-else class="duration-text">{{ formatDuration(duration) }}</span>
      </div>
    </div>

    <!-- 6 宫格通话控制按键 -->
    <div class="call-actions-grid">
      <!-- 静音 -->
      <button class="call-action-btn" :class="{ active: isMuted }" @click="isMuted = !isMuted">
        <div class="btn-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path v-if="!isMuted" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path v-else d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M19 10v2a7 7 0 01-.8 3.2M12 19v4M8 23h8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span class="btn-label">静音</span>
      </button>

      <!-- 拨号键盘 -->
      <button class="call-action-btn" :class="{ active: showKeypadInCall }" @click="showKeypadInCall = !showKeypadInCall">
        <div class="btn-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="5" r="2" fill="#FFFFFF"/>
            <circle cx="12" cy="5" r="2" fill="#FFFFFF"/>
            <circle cx="19" cy="5" r="2" fill="#FFFFFF"/>
            <circle cx="5" cy="12" r="2" fill="#FFFFFF"/>
            <circle cx="12" cy="12" r="2" fill="#FFFFFF"/>
            <circle cx="19" cy="12" r="2" fill="#FFFFFF"/>
            <circle cx="5" cy="19" r="2" fill="#FFFFFF"/>
            <circle cx="12" cy="19" r="2" fill="#FFFFFF"/>
            <circle cx="19" cy="19" r="2" fill="#FFFFFF"/>
          </svg>
        </div>
        <span class="btn-label">键盘</span>
      </button>

      <!-- 免提 -->
      <button class="call-action-btn" :class="{ active: isSpeaker }" @click="isSpeaker = !isSpeaker">
        <div class="btn-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span class="btn-label">免提</span>
      </button>

      <!-- 录音 -->
      <button class="call-action-btn" :class="{ active: isRecording }" @click="isRecording = !isRecording">
        <div class="btn-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke="#FFFFFF" stroke-width="2" />
            <circle cx="12" cy="12" r="4" :fill="isRecording ? '#FF3B30' : '#FFFFFF'" />
          </svg>
        </div>
        <span class="btn-label">{{ isRecording ? '录音中' : '录音' }}</span>
      </button>

      <!-- 添加通话 -->
      <button class="call-action-btn">
        <div class="btn-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
            <circle cx="8.5" cy="7" r="4" stroke="#FFFFFF" stroke-width="2" />
            <line x1="20" y1="8" x2="20" y2="14" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
            <line x1="23" y1="11" x2="17" y2="11" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
        <span class="btn-label">添加</span>
      </button>

      <!-- AI 摘要 -->
      <button class="call-action-btn">
        <div class="btn-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FFFFFF" />
          </svg>
        </div>
        <span class="btn-label">AI摘要</span>
      </button>
    </div>

    <!-- 底部大红色挂断按键 -->
    <div class="hangup-row">
      <button class="hangup-btn" @click="phoneStore.endCall">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="#FFFFFF" style="transform: rotate(135deg);">
          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.phone-call-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1C1C1E;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 80px 24px 60px;
  color: #FFFFFF;
}

.call-header {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.call-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.call-name {
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 6px;
}

.call-number {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
}

.call-status {
  font-size: 16px;
  font-weight: 500;
  color: #34D399;
}

.calling-pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

/* 6 宫格按钮 */
.call-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px 16px;
  margin-top: 40px;
}

.call-action-btn {
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.btn-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.call-action-btn:active .btn-circle {
  transform: scale(0.92);
}

.call-action-btn.active .btn-circle {
  background: #FFFFFF;
}
.call-action-btn.active .btn-circle svg path,
.call-action-btn.active .btn-circle svg circle,
.call-action-btn.active .btn-circle svg polygon {
  stroke: #1C1C1E;
}

.btn-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

/* 挂断大红钮 */
.hangup-row {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.hangup-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #FF3B30;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(255, 59, 48, 0.4);
  transition: transform 0.15s ease;
}

.hangup-btn:active {
  transform: scale(0.92);
  background: #E0281E;
}
</style>
