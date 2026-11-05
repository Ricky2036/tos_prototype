<script setup>
import { computed } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()

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

function handleKeyPress(key) {
  phoneStore.appendKey(key.num)
}

function handleZeroLongPress() {
  phoneStore.appendKey('+')
}

function handleBackspace() {
  phoneStore.deleteKey()
}

function handleCall() {
  if (phoneStore.dialedNumber) {
    phoneStore.startCall(phoneStore.dialedNumber, false)
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
</script>

<template>
  <div class="phone-keypad-panel">
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
          @click="handleKeyPress(k)"
          @contextmenu.prevent="k.num === '0' ? handleZeroLongPress() : null"
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

    <!-- 底部操作栏：收起/视频呼叫 / 主拨号绿色大圆钮 / 退格删除 -->
    <div class="keypad-actions-row">
      <!-- 左侧：收起键盘（无输入时）或视频通话（有输入时） -->
      <button
        v-if="!phoneStore.dialedNumber"
        class="action-aux-btn hide-keypad-btn"
        title="收起键盘"
        @click="phoneStore.isKeypadOpen = false"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        v-else
        class="action-aux-btn video-call-btn active"
        title="视频通话"
        @click="handleVideoCall"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="14" height="14" rx="3" stroke="#1C1C1E" stroke-width="2" />
          <path d="M16 10L21 7V17L16 14" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <!-- 绿色大圆拨号按键 -->
      <button class="main-call-btn" @click="handleCall">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#FFFFFF">
          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
        </svg>
      </button>

      <!-- 退格键 -->
      <button
        class="action-aux-btn backspace-btn"
        :class="{ visible: phoneStore.dialedNumber }"
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
  </div>
</template>

<style scoped>
.phone-keypad-panel {
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  box-shadow: 0 -6px 25px rgba(0, 0, 0, 0.06);
  padding: 6px 20px 20px;
}

/* 顶部号码回显 */
.keypad-display-row {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.keypad-display-row.visible {
  opacity: 1;
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
</style>
