<script setup>
import { computed, ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const toastText = ref('')
let toastTimer = null

function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 1800)
}

const KEYS = [
  { num: '1', sub: 'voicemail' },
  { num: '2', sub: 'ABC' },
  { num: '3', sub: 'DEF' },
  { num: '4', sub: 'GHI' },
  { num: '5', sub: 'JKL' },
  { num: '6', sub: 'MNO' },
  { num: '7', sub: 'PQRS' },
  { num: '8', sub: 'TUV' },
  { num: '9', sub: 'WXYZ' },
  { num: '*', sub: '' },
  { num: '0', sub: '+' },
  { num: '#', sub: '' }
]

// 长按快速拨号计时器
let keyPressTimer = null
let isLongPressTriggered = false

function handleKeyTouchStart(k) {
  isLongPressTriggered = false
  clearTimeout(keyPressTimer)
  keyPressTimer = setTimeout(() => {
    isLongPressTriggered = true
    handleKeyLongPress(k)
  }, 600)
}

function handleKeyTouchEnd() {
  clearTimeout(keyPressTimer)
}

function handleKeyClick(k) {
  if (isLongPressTriggered) {
    isLongPressTriggered = false
    return
  }
  phoneStore.appendKey(k.num)
}

function handleKeyLongPress(k) {
  if (k.num === '0') {
    phoneStore.appendKey('+')
  } else if (k.num === '1') {
    phoneStore.dialSpeedKey(1)
  } else if (/[2-9]/.test(k.num)) {
    const keyNum = parseInt(k.num, 10)
    const success = phoneStore.dialSpeedKey(keyNum)
    if (!success) {
      showToast(`按键 ${keyNum} 未设置快速拨号，可在设置中添加`)
    }
  }
}

function handleBackspace() {
  phoneStore.deleteKey()
}

function handleCall() {
  if (phoneStore.dialedNumber) {
    phoneStore.startCall(phoneStore.dialedNumber, false)
  } else if (matchedContact.value) {
    phoneStore.startCall(matchedContact.value, false)
  }
}

function handleVideoCall() {
  if (phoneStore.dialedNumber) {
    phoneStore.startCall(phoneStore.dialedNumber, true)
  }
}

const formattedNumber = computed(() => {
  const n = phoneStore.dialedNumber
  if (!n) return ''
  if (n.length <= 3) return n
  if (n.length <= 7) return `${n.slice(0, 3)} ${n.slice(3)}`
  return `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}`
})

// 智能联系人联想匹配（输入号码时在键盘上方浮出最佳匹配联系人）
const matchedContact = computed(() => {
  const clean = phoneStore.dialedNumber.replace(/\D/g, '')
  if (!clean || clean.length < 2) return null
  return phoneStore.contacts.find(c => c.number.replace(/\D/g, '').includes(clean)) || null
})

// 顶部手柄下滑收起键盘
let dragStartY = 0
function handleDragStart(e) {
  if (e.touches?.length) {
    dragStartY = e.touches[0].clientY
  }
}

function handleDragMove(e) {
  if (!e.touches?.length) return
  const dy = e.touches[0].clientY - dragStartY
  if (dy > 30) {
    phoneStore.isKeypadOpen = false
  }
}
</script>

<template>
  <div class="phone-keypad-panel">
    <!-- 顶部下滑收起拖拽手柄 -->
    <div
      class="keypad-drag-bar"
      @touchstart.passive="handleDragStart"
      @touchmove.passive="handleDragMove"
      @click="phoneStore.isKeypadOpen = false"
    >
      <div class="drag-pill"></div>
    </div>

    <!-- 智能联系人联想推荐胶囊条 -->
    <div v-if="matchedContact" class="contact-suggest-pill" @click="phoneStore.startCall(matchedContact)">
      <div class="suggest-avatar" :style="{ backgroundColor: matchedContact.color || '#3B82F6' }">
        {{ matchedContact.name?.slice(0, 1) }}
      </div>
      <div class="suggest-info">
        <span class="suggest-name">{{ matchedContact.name }}</span>
        <span class="suggest-num">{{ matchedContact.number }}</span>
      </div>
      <div class="suggest-call-btn">呼叫</div>
    </div>

    <!-- 顶部拨号回显条（输入时滑入） -->
    <div class="keypad-display-row" :class="{ visible: phoneStore.dialedNumber }">
      <div class="dialed-number-text">{{ formattedNumber }}</div>
    </div>

    <!-- 3x4 严格正圆形按键网格 -->
    <div class="keypad-grid">
      <div
        v-for="k in KEYS"
        :key="k.num"
        class="keypad-cell"
      >
        <button
          class="keypad-circle-btn"
          @click="handleKeyClick(k)"
          @touchstart.passive="handleKeyTouchStart(k)"
          @touchend.passive="handleKeyTouchEnd"
          @contextmenu.prevent="handleKeyLongPress(k)"
        >
          <span class="key-digit">{{ k.num }}</span>
          <!-- 1 键语音信箱图标 -->
          <span v-if="k.sub === 'voicemail'" class="key-sub-icon">
            <svg width="14" height="8" viewBox="0 0 28 16" fill="none">
              <circle cx="6" cy="8" r="5" stroke="#8E8E93" stroke-width="2.5" />
              <circle cx="22" cy="8" r="5" stroke="#8E8E93" stroke-width="2.5" />
              <line x1="6" y1="13" x2="22" y2="13" stroke="#8E8E93" stroke-width="2.5" />
            </svg>
          </span>
          <span v-else-if="k.sub" class="key-sub-text">{{ k.sub }}</span>
        </button>
      </div>
    </div>

    <!-- 底部操作栏：视频通话 / 主拨号绿色大圆钮 / 退格删除（对齐真机录屏规范） -->
    <div class="keypad-actions-row">
      <!-- 左侧：视频通话按钮（常驻） -->
      <button
        class="action-aux-btn video-call-btn"
        title="视频通话"
        @click="handleVideoCall"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="6" width="13" height="12" rx="2.5" stroke="#1C1C1E" stroke-width="2" />
          <path d="M15 10.2L20.2 6.8C20.7 6.4 21.5 6.8 21.5 7.5V16.5C21.5 17.2 20.7 17.6 20.2 17.2L15 13.8" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- 绿色大圆拨号按键 -->
      <button class="main-call-btn" title="拨打" @click="handleCall">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#FFFFFF">
          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
        </svg>
      </button>

      <!-- 右侧：退格键（有输入时可见） -->
      <button
        class="action-aux-btn backspace-btn"
        :class="{ visible: phoneStore.dialedNumber }"
        title="删除"
        @click="handleBackspace"
        @contextmenu.prevent="phoneStore.clearNumber"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="18" y1="9" x2="12" y2="15" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" />
          <line x1="12" y1="9" x2="18" y2="15" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- 快速提示条 -->
    <Transition name="fade">
      <div v-if="toastText" class="keypad-toast">
        {{ toastText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.phone-keypad-panel {
  display: flex;
  flex-direction: column;
  background: transparent;
  padding: 0 18px 8px;
  position: relative;
}

/* 顶部拖拽手柄 */
.keypad-drag-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  cursor: pointer;
}

.drag-pill {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #E5E7EB;
}

/* 智能联想条 */
.contact-suggest-pill {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  background: #F2F3F5;
  border-radius: 999px;
  margin: 0 auto 6px;
  gap: 8px;
  cursor: pointer;
  max-width: 90%;
  animation: fadeIn 0.2s ease;
}

.suggest-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.suggest-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  overflow: hidden;
}

.suggest-name {
  font-size: 13px;
  font-weight: 600;
  color: #1C1C1E;
  white-space: nowrap;
}

.suggest-num {
  font-size: 12px;
  color: #8E8E93;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggest-call-btn {
  font-size: 12px;
  font-weight: 600;
  color: #00C853;
  flex-shrink: 0;
}

/* 顶部号码回显：默认未输入时高度收起为 0，输入文字后平滑增高展现，对齐真机交互规范 */
.keypad-display-row {
  height: 0;
  max-height: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(6px);
  margin-bottom: 0;
  transition: height 0.22s cubic-bezier(0.25, 1, 0.5, 1), max-height 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.18s ease, transform 0.2s ease, margin 0.2s ease;
  will-change: height, opacity;
}

.keypad-display-row.visible {
  height: 46px;
  max-height: 46px;
  opacity: 1;
  transform: translateY(0);
  margin-bottom: 4px;
}

.dialed-number-text {
  font-size: 27px;
  font-weight: 500;
  color: #1C1C1E;
  letter-spacing: 1px;
}

/* 3x4 按键网格：严格正圆单元格 */
.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  row-gap: 8px;
  justify-items: center;
  margin-top: 2px;
}

.keypad-cell {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 正圆形按键容器（防止椭圆变形） */
.keypad-circle-btn {
  width: 68px;
  height: 68px;
  min-width: 68px;
  min-height: 68px;
  max-width: 68px;
  max-height: 68px;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
  transition: background-color 0.15s ease, transform 0.12s ease;
}

.keypad-circle-btn:active {
  background-color: rgba(0, 0, 0, 0.08);
  transform: scale(0.94);
}

.key-digit {
  font-size: 28px;
  font-weight: 400;
  color: #1C1C1E;
  line-height: 1;
}

.key-sub-text {
  font-size: 9.5px;
  font-weight: 600;
  color: #8E8E93;
  letter-spacing: 1.2px;
  margin-top: 2px;
}

.key-sub-icon {
  display: flex;
  align-items: center;
  margin-top: 3px;
}

/* 底部操作区 */
.keypad-actions-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-top: 14px;
  padding: 0 10px;
}

.action-aux-btn {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.35;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.action-aux-btn.active,
.action-aux-btn.visible {
  opacity: 1;
}

.action-aux-btn:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.backspace-btn {
  visibility: hidden;
}

.backspace-btn.visible {
  visibility: visible;
}

/* 主拨号大绿键 */
.main-call-btn {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background-color: #00C853;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 200, 83, 0.32);
  transition: transform 0.15s ease, background-color 0.15s ease;
}

.main-call-btn:active {
  transform: scale(0.93);
  background-color: #00B348;
}

.keypad-toast {
  position: absolute;
  top: -42px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #FFFFFF;
  font-size: 13px;
  padding: 7px 16px;
  border-radius: 18px;
  pointer-events: none;
  white-space: nowrap;
  z-index: 50;
}
</style>
