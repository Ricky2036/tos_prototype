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
  } else if (phoneStore.recents.length > 0) {
    phoneStore.startCall(phoneStore.recents[0], false)
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

// 顶部手柄跟手下滑收起键盘
let dragStartY = 0
const dragCurrentY = ref(0)
const isDraggingPill = ref(false)

function handleDragStart(e) {
  if (e.touches?.length) {
    dragStartY = e.touches[0].clientY
    dragCurrentY.value = 0
    isDraggingPill.value = true
  }
}

function handleDragMove(e) {
  if (!isDraggingPill.value || !e.touches?.length) return
  const dy = e.touches[0].clientY - dragStartY
  if (dy > 0) {
    dragCurrentY.value = dy
  }
}

function handleDragEnd() {
  if (!isDraggingPill.value) return
  if (dragCurrentY.value > 40) {
    phoneStore.isKeypadOpen = false
  }
  dragCurrentY.value = 0
  isDraggingPill.value = false
}
</script>

<template>
  <div
    class="phone-keypad-panel"
    :style="isDraggingPill && dragCurrentY > 0 ? { transform: `translateY(${dragCurrentY}px)`, transition: 'none' } : {}"
  >
    <!-- 顶部手柄条与回显栏：未输入时展示拖拽小横条，输入时展示数字与退格（1:1 对齐真机） -->
    <div
      v-if="!phoneStore.dialedNumber"
      class="keypad-drag-bar"
      @touchstart.passive="handleDragStart"
      @touchmove.passive="handleDragMove"
      @touchend.passive="handleDragEnd"
      @click="phoneStore.isKeypadOpen = false"
    >
      <div class="drag-pill"></div>
    </div>

    <!-- 顶部拨号回显与操作栏（输入时展示，1:1 对齐真机） -->
    <div v-else class="keypad-dialed-header">
      <button class="header-action-btn" title="清空" @click="phoneStore.clearNumber">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="1.8" fill="#1C1C1E" />
          <circle cx="12" cy="12" r="1.8" fill="#1C1C1E" />
          <circle cx="12" cy="19" r="1.8" fill="#1C1C1E" />
        </svg>
      </button>
      <div class="keypad-dialed-text dialed-number-text">{{ formattedNumber }}</div>
      <button class="header-action-btn backspace-btn-top backspace-btn" title="退格删除" @click="handleBackspace" @contextmenu.prevent="phoneStore.clearNumber">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <line x1="18" y1="9" x2="12" y2="15" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" />
          <line x1="12" y1="9" x2="18" y2="15" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
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
  height: 28px;
  padding-top: 10px;
  padding-bottom: 8px;
  cursor: pointer;
  user-select: none;
}

.drag-pill {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #B0B3B8; /* fallback: #C4C7CC */
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.keypad-drag-bar:active .drag-pill {
  background: #8E8E93;
  transform: scaleY(1.2);
}

/* 顶部号码回显栏（输入时展示，对齐真机顶部 ⋮ 号码 ⌫ 布局） */
.keypad-dialed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 4px 6px;
  margin-bottom: 2px;
}

.keypad-dialed-text {
  flex: 1;
  text-align: center;
  font-size: 28px;
  font-weight: 500;
  color: #1C1C1E;
  letter-spacing: 0.8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-action-btn {
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.15s ease;
  visibility: visible !important;
}

.header-action-btn:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.dialed-number-text {
  font-size: 28px;
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
