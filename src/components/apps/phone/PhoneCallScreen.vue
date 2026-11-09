<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()

const isMuted = ref(false)
const isSpeaker = ref(false)
const isRecording = ref(false)
const isHolding = ref(false)
const showKeypadInCall = ref(false)
const showAiSummary = ref(false)
const showMoreSheet = ref(false)
const showAddCallModal = ref(false)
const dialedDtmf = ref('')
const noiseMode = ref('标准降噪')
const toastText = ref('')
let toastTimer = null

function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 1800)
}

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

function toggleRecording() {
  isRecording.value = !isRecording.value
  showToast(isRecording.value ? '通话录音已开始' : '通话录音已结束并保存')
}

function toggleHolding() {
  isHolding.value = !isHolding.value
  showToast(isHolding.value ? '通话已保持' : '通话已恢复')
}

function toggleNoiseReduction() {
  const modes = ['标准降噪', '深度降噪', '全场景降噪']
  const curIdx = modes.indexOf(noiseMode.value)
  const next = modes[(curIdx + 1) % modes.length]
  noiseMode.value = next
  showToast(`${next}已开启`)
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
    <!-- 降噪状态标记（保留用于状态同步与属性读取） -->
    <div v-if="phoneStore.settings.noiseReductionSystem !== '关闭'" class="noise-status-pill" style="display: none;"></div>

    <!-- 顶部通话人排版信息（严格 1:1 对齐真机 InCallActivity 居中大字排版，杜绝廉价圆形头像） -->
    <div class="call-header">
      <div class="call-name">{{ phoneStore.activeCall.name || phoneStore.activeCall.number }}</div>
      <div v-if="phoneStore.activeCall.name && phoneStore.activeCall.number" class="call-number">
        {{ phoneStore.activeCall.number }}
      </div>
      <div class="call-status">
        <span v-if="phoneStore.activeCall.status === 'calling'" class="calling-pulse">正在呼叫</span>
        <span v-else-if="isHolding" class="holding-status">已保持</span>
        <span v-else class="duration-text">{{ formatDuration(duration) }}</span>
      </div>
      <div v-if="dialedDtmf" class="dtmf-echo-line">{{ dialedDtmf }}</div>
    </div>

    <!-- 键盘展开浮层：通话中拨号输入（支持 DTMF 按键） -->
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
      <button class="hide-keypad-btn" @click="showKeypadInCall = false">收起拨号盘</button>
    </div>

    <!-- 底部 3x3 控制按键（严格 1:1 对齐真机录屏与截屏布局） -->
    <div v-else class="call-controls-grid call-actions-grid">
      <!-- 第一行：录音 / 静音 / 保持 -->
      <div class="control-grid-cell">
        <button
          class="ctrl-circle-btn call-action-btn"
          :class="{ active: isRecording }"
          title="开始录音"
          @click="toggleRecording"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <line x1="4" y1="10" x2="4" y2="14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="8" y1="6" x2="8" y2="18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="16" y1="7" x2="16" y2="17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            <line x1="20" y1="10" x2="20" y2="14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </button>
        <span class="ctrl-label">{{ isRecording ? '录音中' : '开始录音' }}</span>
      </div>

      <div class="control-grid-cell">
        <button
          class="ctrl-circle-btn call-action-btn"
          :class="{ active: isMuted }"
          title="静音"
          @click="isMuted = !isMuted"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path v-if="!isMuted" d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path v-else d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V5a3 3 0 00-5.94-.6M19 10v2a7 7 0 01-.8 3.2M12 19v3M8 22h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="ctrl-label">静音</span>
      </div>

      <div class="control-grid-cell">
        <button
          class="ctrl-circle-btn call-action-btn"
          :class="{ active: isHolding }"
          title="保持"
          @click="toggleHolding"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="4" width="3.5" height="16" rx="1.5" fill="currentColor"/>
            <rect x="14.5" y="4" width="3.5" height="16" rx="1.5" fill="currentColor"/>
          </svg>
        </button>
        <span class="ctrl-label">保持</span>
      </div>

      <!-- 第二行：通话摘要 / 标准降噪 / 更多 -->
      <div class="control-grid-cell">
        <button
          class="ctrl-circle-btn call-action-btn"
          :class="{ active: showAiSummary }"
          title="通话摘要"
          @click="showAiSummary = !showAiSummary"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" stroke-width="2"/>
            <line x1="8" y1="8.5" x2="13" y2="8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <line x1="8" y1="13.5" x2="12" y2="13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M17.5 10l.7 1.4 1.5.3-1.1 1 .3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1 1.5-.3.7-1.4z" fill="currentColor"/>
          </svg>
        </button>
        <span class="ctrl-label">通话摘要</span>
      </div>

      <div class="control-grid-cell">
        <button
          class="ctrl-circle-btn call-action-btn"
          title="标准降噪"
          @click="toggleNoiseReduction"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M6 20v-2a6 6 0 0112 0v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M2 13a10 10 0 010-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M22 9a10 10 0 010 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <span class="ctrl-label">{{ noiseMode }}</span>
      </div>

      <div class="control-grid-cell">
        <button
          class="ctrl-circle-btn call-action-btn"
          title="更多"
          @click="showMoreSheet = true"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="ctrl-label">更多</span>
      </div>

      <!-- 第三行：扬声器 / 挂断大红圆钮 / 键盘（真机第三行按键无下方文字，极简高辨识度） -->
      <div class="control-grid-cell no-label">
        <button
          class="ctrl-circle-btn call-action-btn speaker-btn"
          :class="{ active: isSpeaker }"
          title="扬声器"
          @click="isSpeaker = !isSpeaker"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M15.5 8.5a5 5 0 010 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M19 5a9.5 9.5 0 010 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <div class="control-grid-cell no-label">
        <button
          class="ctrl-hangup-btn hangup-btn"
          title="挂断"
          @click="phoneStore.endCall"
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="#FFFFFF" style="transform: rotate(135deg);">
            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
          </svg>
        </button>
      </div>

      <div class="control-grid-cell no-label">
        <button
          class="ctrl-circle-btn call-action-btn keypad-btn"
          :class="{ active: showKeypadInCall }"
          title="键盘"
          @click="showKeypadInCall = !showKeypadInCall"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="5" r="2.2"/>
            <circle cx="12" cy="5" r="2.2"/>
            <circle cx="19" cy="5" r="2.2"/>
            <circle cx="5" cy="12" r="2.2"/>
            <circle cx="12" cy="12" r="2.2"/>
            <circle cx="19" cy="12" r="2.2"/>
            <circle cx="5" cy="19" r="2.2"/>
            <circle cx="12" cy="19" r="2.2"/>
            <circle cx="19" cy="19" r="2.2"/>
          </svg>
        </button>
      </div>
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

    <!-- 更多选项菜单浮层（添加通话 / 切换视音频） -->
    <Transition name="fade">
      <div v-if="showMoreSheet" class="more-sheet-overlay" @click.self="showMoreSheet = false">
        <div class="more-sheet-card">
          <div class="more-sheet-title">通话更多功能</div>
          <div class="more-options-grid">
            <button class="more-opt-btn" @click="showMoreSheet = false; showAddCallModal = true">
              <div class="opt-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
              </div>
              <span class="opt-label">添加通话</span>
            </button>
            <button class="more-opt-btn" @click="showMoreSheet = false; showToast('已切换为高清视频通话')">
              <div class="opt-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="6" width="13" height="12" rx="2"/>
                  <path d="M15 10.2L20.2 6.8C20.7 6.4 21.5 6.8 21.5 7.5V16.5C21.5 17.2 20.7 17.6 20.2 17.2L15 13.8"/>
                </svg>
              </div>
              <span class="opt-label">视频通话</span>
            </button>
          </div>
          <button class="more-cancel-btn" @click="showMoreSheet = false">取消</button>
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

    <!-- 操作吐司提示 -->
    <Transition name="fade">
      <div v-if="toastText" class="incall-toast">
        {{ toastText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.phone-call-screen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #8F9092;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 100px 24px 64px;
  color: #FFFFFF;
}

/* 顶部通话人信息：纯净字体居中排版，1:1 对齐真机 InCallActivity */
.call-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.call-name {
  font-size: 32px;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.call-number {
  font-size: 17px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;
}

.call-status {
  font-size: 16px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.95);
}

.dtmf-echo-line {
  font-size: 18px;
  color: #FFFFFF;
  margin-top: 10px;
  letter-spacing: 3px;
}

.calling-pulse {
  animation: pulse 1.6s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* 3x3 控制按键网格：严格 1:1 对齐真机按钮几何分布 */
.call-controls-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  row-gap: 24px;
  column-gap: 16px;
  justify-items: center;
  align-items: flex-start;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

.control-grid-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.control-grid-cell.no-label {
  padding-top: 4px;
}

.ctrl-circle-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.ctrl-circle-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.35);
}

.ctrl-circle-btn.active {
  background: #FFFFFF;
  color: #1C1C1E;
}

.ctrl-hangup-btn {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #E25149;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(226, 81, 73, 0.35);
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.ctrl-hangup-btn:active {
  transform: scale(0.92);
  background: #D33D35;
}

.ctrl-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.88);
  margin-top: 8px;
  text-align: center;
  white-space: nowrap;
}

/* DTMF 按键网格浮层 */
.incall-keypad-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.incall-keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 28px;
  width: 100%;
  margin-bottom: 24px;
}

.incall-key-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.incall-key-btn:active {
  background: rgba(255, 255, 255, 0.4);
}

.hide-keypad-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #FFFFFF;
  font-size: 14px;
  padding: 8px 24px;
  border-radius: 999px;
  cursor: pointer;
}

/* 吐司提示条 */
.incall-toast {
  position: absolute;
  top: 36px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  z-index: 150;
  backdrop-filter: blur(8px);
}

/* AI 摘要浮层与更多选项浮层 */
.ai-summary-overlay,
.more-sheet-overlay,
.add-call-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  z-index: 120;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.ai-summary-card,
.more-sheet-card,
.add-call-sheet {
  width: 100%;
  background: #FFFFFF;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px 20px 40px;
  color: #1C1C1E;
  display: flex;
  flex-direction: column;
}

.ai-card-title,
.more-sheet-title,
.sheet-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
}

.ai-card-body {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.summary-line {
  margin-bottom: 8px;
}

.tag-role {
  font-weight: 600;
  color: #00C853;
}

.ai-key-points {
  margin-top: 14px;
  padding: 12px;
  background: #F8F9FA;
  border-radius: 12px;
}

.point-head {
  font-weight: 600;
  margin-bottom: 4px;
}

.more-options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.more-opt-btn {
  background: #F8F9FA;
  border: none;
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.opt-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.opt-label {
  font-size: 14px;
  font-weight: 500;
  color: #1C1C1E;
}

.contacts-pick-list {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.pick-row {
  display: flex;
  justify-content: space-between;
  padding: 14px 4px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.pick-name {
  font-size: 16px;
  font-weight: 500;
}

.pick-num {
  font-size: 14px;
  color: #8E8E93;
}

.ai-close-btn,
.more-cancel-btn,
.sheet-cancel-btn {
  width: 100%;
  height: 48px;
  background: #F2F3F5;
  border: none;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
