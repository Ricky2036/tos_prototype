<script setup>
import { computed, ref, watch } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'
import LIcon from '../../ui/LIcon.vue'

const phoneStore = usePhoneStore()
const emit = defineEmits(['open-settings', 'open-speed-dial'])
const toastText = ref('')
let toastTimer = null

const isMoreMenuOpen = ref(false)

watch(() => phoneStore.dialedNumber, (val) => {
  if (!val) isMoreMenuOpen.value = false
})

function toggleMoreMenu() {
  isMoreMenuOpen.value = !isMoreMenuOpen.value
}

function handleAppendPause() {
  phoneStore.appendKey(',')
  isMoreMenuOpen.value = false
}

function handleAppendWait() {
  phoneStore.appendKey(';')
  isMoreMenuOpen.value = false
}

function handleOpenSpeedDial() {
  isMoreMenuOpen.value = false
  emit('open-speed-dial')
}

function handleOpenSettings() {
  isMoreMenuOpen.value = false
  emit('open-settings')
}

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
  if (n.includes(',') || n.includes(';')) {
    return n
  }
  if (n.length <= 3) return n
  if (n.length <= 7) return `${n.slice(0, 3)} ${n.slice(3)}`
  return `${n.slice(0, 3)} ${n.slice(3, 7)} ${n.slice(7)}`
})
</script>

<template>
  <div
    class="phone-keypad-panel"
    :class="{ 'is-empty': !phoneStore.dialedNumber }"
  >
    <!-- 顶部拨号回显与操作栏（输入时展示，1:1 对齐真机，无输入时完全无小横条） -->
    <div v-if="phoneStore.dialedNumber" class="keypad-dialed-header">
      <button class="header-action-btn menu-btn" title="更多选项" @click.stop="toggleMoreMenu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="1.8" fill="#1C1C1E" />
          <circle cx="12" cy="12" r="1.8" fill="#1C1C1E" />
          <circle cx="12" cy="19" r="1.8" fill="#1C1C1E" />
        </svg>
      </button>
      <div class="keypad-dialed-text dialed-number-text">{{ formattedNumber }}</div>
      <button class="header-action-btn backspace-btn-top backspace-btn" title="退格删除" @click="handleBackspace" @contextmenu.prevent="phoneStore.clearNumber">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M8.2 3.5h11.8c1.65 0 3 1.35 3 3v11c0 1.65-1.35 3-3 3H8.2c-.8 0-1.56-.32-2.12-.88L1.6 13.98a2.8 2.8 0 0 1 0-3.96L6.08 4.38c.56-.56 1.32-.88 2.12-.88z" fill="#1C1C1E" />
          <line x1="12" y1="9.2" x2="17.2" y2="14.8" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" />
          <line x1="17.2" y1="9.2" x2="12" y2="14.8" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </button>

      <!-- 遮罩与更多选项弹出菜单（100% 对齐真机菜单选项与真实文案） -->
      <div v-if="isMoreMenuOpen" class="keypad-menu-backdrop" @click="isMoreMenuOpen = false"></div>
      <Transition name="fade-scale">
        <div v-if="isMoreMenuOpen" class="keypad-more-menu">
          <button class="more-menu-item" @click="handleAppendPause">
            添加 2 秒暂停
          </button>
          <button class="more-menu-item" @click="handleAppendWait">
            添加等待
          </button>
          <button class="more-menu-item" @click="handleOpenSpeedDial">
            快速拨号号码
          </button>
          <button class="more-menu-item menu-item-settings" @click="handleOpenSettings">
            <span>设置</span>
            <span class="orange-dot"></span>
          </button>
        </div>
      </Transition>
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

    <!-- 底部操作栏：视频通话 / 主拨号绿色大圆钮（对齐真机规范：左侧视频通话，中间绿色拨号，右侧无删除按键） -->
    <div class="keypad-actions-row">
      <!-- 左侧：视频通话按钮（复用控制中心录屏图标，常驻） -->
      <button
        class="action-aux-btn video-call-btn"
        title="视频通话"
        @click="handleVideoCall"
      >
        <LIcon name="video" :size="26" />
      </button>

      <!-- 绿色大圆拨号按键 -->
      <button class="main-call-btn" title="拨打" @click="handleCall">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#FFFFFF">
          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
        </svg>
      </button>

      <!-- 右侧：平衡占位（保持中间绿色拨号键严格居中） -->
      <div class="action-aux-placeholder" aria-hidden="true"></div>
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

/* 未输入数字时，纯白留白顶距（对齐真机无小横条设计） */
.phone-keypad-panel.is-empty {
  padding-top: 26px;
}

/* 顶部号码回显栏（输入时展示，对齐真机顶部 ⋮ 号码 ⌫ 布局，留白舒适匀称） */
.keypad-dialed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 18px 12px 14px;
  margin-bottom: 8px;
  position: relative;
}

/* 更多选项下拉菜单浮层与遮罩 */
.keypad-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: transparent;
}

.keypad-more-menu {
  position: absolute;
  top: 60px;
  left: 8px;
  z-index: 50;
  background: #FFFFFF;
  border-radius: 20px;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 8px 6px;
  min-width: 196px;
  display: flex;
  flex-direction: column;
}

.more-menu-item {
  background: none;
  border: none;
  padding: 12px 18px;
  font-size: 15px;
  font-weight: 400;
  color: #1C1C1E;
  text-align: left;
  border-radius: 14px;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.15s ease;
}

.more-menu-item:active {
  background-color: rgba(0, 0, 0, 0.06);
}

.menu-item-settings .orange-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #FF6B00;
  margin-left: 8px;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.16s cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-origin: top left;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

.keypad-dialed-text {
  flex: 1;
  text-align: center;
  font-size: 32px;
  font-weight: 500;
  color: #1C1C1E;
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.header-action-btn {
  background: none;
  border: none;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.15s ease;
  flex-shrink: 0;
}

.header-action-btn:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.dialed-number-text {
  font-size: 32px;
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

/* 底部操作区（对齐真机规范：3列网格对齐，左侧视频通话，中间绿色大圆拨号，右侧无删除按钮） */
.keypad-actions-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  justify-items: center;
  align-items: center;
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
  color: #1C1C1E;
  opacity: 1;
  transition: background-color 0.15s ease, transform 0.12s ease;
}

.action-aux-btn:active {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(0.92);
}

.action-aux-placeholder {
  width: 54px;
  height: 54px;
  visibility: hidden;
  pointer-events: none;
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
