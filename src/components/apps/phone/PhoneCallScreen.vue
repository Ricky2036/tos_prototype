<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()

const isMuted = ref(false)
const isSpeaker = ref(false)
const isRecording = ref(false)
const showKeypadInCall = ref(false)
const showAiSummary = ref(false)
const showAddCallModal = ref(false)
const dialedDtmf = ref('')

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

function handleDtmf(k) {
  dialedDtmf.value += k
}

function handleAddCallContact(c) {
  showAddCallModal.value = false
  if (phoneStore.activeCall) {
    phoneStore.activeCall.name += `、${c.name || c.number}`
  }
}
</script>

<template>
  <div v-if="phoneStore.activeCall" class="phone-call-screen">
    <!-- 顶部状态指示栏：录音中 / 降噪模式 -->
    <div class="top-status-indicator-bar">
      <div v-if="isRecording" class="recording-pill">
        <span class="rec-red-dot"></span>
        <span>通话录音中 {{ formatDuration(duration) }}</span>
      </div>
      <div v-if="phoneStore.settings.noiseReductionSystem !== '关闭'" class="noise-status-pill">
        <span>全场景降噪：{{ phoneStore.settings.noiseReductionSystem }}</span>
      </div>
    </div>

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
      <div v-if="dialedDtmf" class="dtmf-echo-line">按键输入：{{ dialedDtmf }}</div>
    </div>

    <!-- 通话中数字键盘（当激活键盘时展示） -->
    <div v-if="showKeypadInCall" class="incall-keypad-container">
      <div class="incall-keypad-grid">
        <button
          v-for="k in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']"
          :key="k"
          class="incall-key-btn"
          @click="handleDtmf(k)"
        >
          {{ k }}
        </button>
      </div>
      <button class="hide-keypad-btn" @click="showKeypadInCall = false">隐藏键盘</button>
    </div>

    <!-- 6 宫格通话控制按键 -->
    <div v-else class="call-actions-grid">
      <!-- 静音 -->
      <button class="call-action-btn" :class="{ active: isMuted }" @click="isMuted = !isMuted">
        <div class="btn-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path v-if="!isMuted" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path v-else d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M19 10v2a7 7 0 01-.8 3.2M12 19v4M8 23h8" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span class="btn-label">{{ isMuted ? '已静音' : '静音' }}</span>
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
        <span class="btn-label">{{ isSpeaker ? '免提开' : '免提' }}</span>
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
      <button class="call-action-btn" @click="showAddCallModal = true">
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
      <button class="call-action-btn" :class="{ active: showAiSummary }" @click="showAiSummary = !showAiSummary">
        <div class="btn-circle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" :fill="showAiSummary ? '#00C853' : '#FFFFFF'" />
          </svg>
        </div>
        <span class="btn-label">AI摘要</span>
      </button>
    </div>

    <!-- AI 实时通话摘要浮层 -->
    <Transition name="fade">
      <div v-if="showAiSummary" class="ai-summary-overlay" @click.self="showAiSummary = false">
        <div class="ai-summary-card">
          <div class="ai-card-title">AI 通话实时摘要</div>
          <div class="ai-card-body">
            <div class="summary-line">
              <span class="tag-role">我方：</span>
              <span>您好，请问昨天讨论的技术方案确认了吗？</span>
            </div>
            <div class="summary-line">
              <span class="tag-role">对方：</span>
              <span>已经通过评审，下周启动第一阶段落地验证。</span>
            </div>
            <div class="ai-key-points">
              <div class="point-head">智能提炼要点：</div>
              <div class="point-item">1. 技术方案已完成评审并确认通过</div>
              <div class="point-item">2. 预定下周启动第一阶段落地验证</div>
            </div>
          </div>
          <button class="ai-close-btn" @click="showAiSummary = false">收起摘要</button>
        </div>
      </div>
    </Transition>

    <!-- 添加通话人员选择器 -->
    <Transition name="fade">
      <div v-if="showAddCallModal" class="add-call-overlay" @click.self="showAddCallModal = false">
        <div class="add-call-sheet">
          <div class="sheet-title">添加多方通话</div>
          <div class="contacts-pick-list scrollable">
            <div
              v-for="c in phoneStore.contacts"
              :key="c.id"
              class="pick-row"
              @click="handleAddCallContact(c)"
            >
              <div class="pick-name">{{ c.name }}</div>
              <div class="pick-num">{{ c.number }}</div>
            </div>
          </div>
          <button class="sheet-cancel-btn" @click="showAddCallModal = false">取消</button>
        </div>
      </div>
    </Transition>

    <!-- 底部大红色挂断按键 -->
    <div class="hangup-row">
      <button class="hangup-btn" title="挂断" @click="phoneStore.endCall">
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
  padding: 60px 24px 60px;
  color: #FFFFFF;
}

.top-status-indicator-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.recording-pill,
.noise-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.12);
}

.rec-red-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FF3B30;
  animation: pulse 1s infinite;
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
  text-align: center;
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

.dtmf-echo-line {
  font-size: 14px;
  color: #FCD34D;
  margin-top: 8px;
  letter-spacing: 2px;
}

.calling-pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

/* 通话中按键网格 */
.incall-keypad-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.incall-keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px 28px;
  width: 100%;
  max-width: 260px;
  margin-bottom: 16px;
}

.incall-key-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.incall-key-btn:active {
  background: rgba(255, 255, 255, 0.35);
}

.hide-keypad-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
}

/* 6 宫格按钮 */
.call-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px 16px;
  margin-top: 30px;
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
  margin-top: 30px;
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

/* AI 摘要浮层 */
.ai-summary-overlay,
.add-call-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.ai-summary-card {
  width: 100%;
  max-width: 330px;
  background: #2C2C2E;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ai-card-title {
  font-size: 17px;
  font-weight: 700;
  color: #34D399;
  margin-bottom: 14px;
  text-align: center;
}

.ai-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 18px;
}

.tag-role {
  color: #60A5FA;
  font-weight: 600;
}

.ai-key-points {
  background: rgba(0, 0, 0, 0.25);
  padding: 10px 12px;
  border-radius: 10px;
  margin-top: 6px;
}

.point-head {
  font-weight: 600;
  color: #FCD34D;
  margin-bottom: 4px;
}

.point-item {
  color: rgba(255, 255, 255, 0.9);
}

.ai-close-btn,
.sheet-cancel-btn {
  width: 100%;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  color: #FFFFFF;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.add-call-sheet {
  width: 100%;
  max-width: 330px;
  max-height: 65vh;
  background: #2C2C2E;
  border-radius: 20px;
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
}

.sheet-title {
  font-size: 17px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 14px;
}

.contacts-pick-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 14px;
}

.pick-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 6px;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.pick-name {
  font-size: 15px;
  font-weight: 500;
}

.pick-num {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
