<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['back', 'navigate'])

// 预设模式列表（对齐真机 One-Tap Button 轮播项）
const modes = [
  {
    id: 'custom',
    name: '自定义',
    iconType: 'pencil',
    glowColor: 'rgba(129, 140, 248, 0.55)',
    buttonBg: '#4F46E5',
    subtitles: ['长按静音', '单击唤起一键闪记', '双击打开手电筒'],
    actionBtn: { text: '去修改', type: 'secondary' }
  },
  {
    id: 'shortcut_app',
    name: '快捷应用',
    iconType: 'grid',
    glowColor: 'rgba(59, 130, 246, 0.65)',
    buttonBg: '#2563EB',
    subtitles: ['长按快启应用'],
    actionBtn: { text: '去设置', type: 'primary' }
  },
  {
    id: 'translate',
    name: '翻译助手',
    iconType: 'translate',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    buttonBg: '#9333EA',
    subtitles: ['长按实时翻译'],
    actionBtn: null
  },
  {
    id: 'mute',
    name: '静音模式',
    iconType: 'bell-slash',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    buttonBg: '#D97706',
    subtitles: ['长按切换响铃/静音'],
    actionBtn: null
  },
  {
    id: 'flashlight',
    name: '手电筒',
    iconType: 'flashlight',
    glowColor: 'rgba(250, 204, 21, 0.55)',
    buttonBg: '#CA8A04',
    subtitles: ['长按开启/关闭手电筒'],
    actionBtn: null
  },
  {
    id: 'camera',
    name: '相机',
    iconType: 'camera',
    glowColor: 'rgba(16, 185, 129, 0.55)',
    buttonBg: '#059669',
    subtitles: ['长按快速打开相机'],
    actionBtn: null
  },
  {
    id: 'none',
    name: '无操作',
    iconType: 'ban',
    glowColor: 'rgba(156, 163, 175, 0.35)',
    buttonBg: '#4B5563',
    subtitles: [],
    actionBtn: null
  }
]

// 当前选中的模式索引，以及系统当前生效的模式 ID
const currentIndex = ref(0)
const activeModeId = ref('custom')

const currentMode = computed(() => modes[currentIndex.value])
const isCurrentActive = computed(() => currentMode.value.id === activeModeId.value)

// 左右预览项
const prevMode = computed(() => {
  const idx = (currentIndex.value - 1 + modes.length) % modes.length
  return modes[idx]
})

const nextMode = computed(() => {
  const idx = (currentIndex.value + 1) % modes.length
  return modes[idx]
})

function prevSlide() {
  currentIndex.value = (currentIndex.value - 1 + modes.length) % modes.length
}

function nextSlide() {
  currentIndex.value = (currentIndex.value + 1) % modes.length
}

function goToIndex(idx) {
  if (idx < modes.length) {
    currentIndex.value = idx
  }
}

// 触摸滑动手势
let touchStartX = 0
function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX
}

function handleTouchEnd(e) {
  const touchEndX = e.changedTouches[0].clientX
  const diff = touchEndX - touchStartX
  if (diff > 45) {
    prevSlide()
  } else if (diff < -45) {
    nextSlide()
  }
}

// Toast
const toastText = ref('')
let toastTimer = null
function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2200)
}

function applyActive() {
  activeModeId.value = currentMode.value.id
  showToast(`已将 One-Tap 按键设定为「${currentMode.value.name}」`)
}

function handleActionBtn(action) {
  showToast(`已进入「${action.text}」配置`)
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-onetap-page" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <!-- 顶部导航栏 -->
    <div class="onetap-nav-bar">
      <button class="nav-round-btn-dark" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title-dark">One-Tap Button</div>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 舞台主体：机身侧轨与按键微光投影 -->
    <div class="onetap-stage">
      <!-- 左侧预览图标 -->
      <button class="flank-icon-btn left-icon" :aria-label="prevMode.name" @click="prevSlide">
        <!-- 铅笔 -->
        <svg v-if="prevMode.iconType === 'pencil'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M3 21H7.5L19 9.5L14.5 5L3 16.5V21Z" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- 四宫格 -->
        <svg v-else-if="prevMode.iconType === 'grid'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="6" height="6" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="14" y="4" width="6" height="6" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="4" y="14" width="6" height="6" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="14" y="14" width="6" height="6" rx="2" fill="rgba(255,255,255,0.4)"/>
        </svg>
        <!-- 翻译 -->
        <svg v-else-if="prevMode.iconType === 'translate'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M4 6H14M9 3V6M6 14C8 12 10 9 10 6M5 10C7.5 10 10.5 12 12 15M14 20L18 10L22 20M15.5 17H20.5" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- 静音 -->
        <svg v-else-if="prevMode.iconType === 'bell-slash'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M18 16V10C18 6.7 15.3 4 12 4M6 6L18 18M6.5 16H18M10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <!-- 手电筒 -->
        <svg v-else-if="prevMode.iconType === 'flashlight'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M8 2H16V6L14 10V22H10V10L8 6V2ZM8 6H16" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- 相机 -->
        <svg v-else-if="prevMode.iconType === 'camera'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <!-- 禁用 -->
        <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
        </svg>
      </button>

      <!-- 手机侧轨与动作按键 -->
      <div class="phone-rail-container">
        <!-- 磨砂金属侧边中框 -->
        <div class="phone-rail">
          <!-- 凹槽基座 -->
          <div class="button-cavity">
            <!-- 发光胶囊按键 -->
            <div
              class="active-capsule-button"
              :style="{
                boxShadow: `0 0 36px 8px ${currentMode.glowColor}, inset 0 1px 2px rgba(255,255,255,0.4)`
              }"
            >
              <!-- 键内图案 -->
              <!-- 铅笔 -->
              <svg v-if="currentMode.iconType === 'pencil'" width="42" height="42" viewBox="0 0 24 24" fill="none">
                <path d="M3 21H7.5L19 9.5L14.5 5L3 16.5V21Z" fill="#FFFFFF"/>
                <line x1="13.5" y1="6" x2="18" y2="10.5" stroke="#4F46E5" stroke-width="1.5"/>
              </svg>
              <!-- 四宫格 -->
              <svg v-else-if="currentMode.iconType === 'grid'" width="42" height="42" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="6.5" height="6.5" rx="2" fill="#FFFFFF"/>
                <rect x="13.5" y="4" width="6.5" height="6.5" rx="2" fill="#FFFFFF"/>
                <rect x="4" y="13.5" width="6.5" height="6.5" rx="2" fill="#FFFFFF"/>
                <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" fill="#FFFFFF"/>
              </svg>
              <!-- 翻译 -->
              <svg v-else-if="currentMode.iconType === 'translate'" width="42" height="42" viewBox="0 0 24 24" fill="none">
                <path d="M4 6H14M9 3V6M6 14C8 12 10 9 10 6M5 10C7.5 10 10.5 12 12 15M14 20L18 10L22 20M15.5 17H20.5" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <!-- 静音 -->
              <svg v-else-if="currentMode.iconType === 'bell-slash'" width="42" height="42" viewBox="0 0 24 24" fill="none">
                <path d="M18 16V10C18 6.7 15.3 4 12 4M6 6L18 18M6.5 16H18M10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
              <!-- 手电筒 -->
              <svg v-else-if="currentMode.iconType === 'flashlight'" width="42" height="42" viewBox="0 0 24 24" fill="none">
                <path d="M8 2H16V6L14 10V22H10V10L8 6V2ZM8 6H16" fill="#FFFFFF"/>
              </svg>
              <!-- 相机 -->
              <svg v-else-if="currentMode.iconType === 'camera'" width="42" height="42" viewBox="0 0 24 24" fill="none">
                <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" fill="#FFFFFF"/>
                <circle cx="12" cy="13" r="3.5" fill="#059669"/>
              </svg>
              <!-- 禁用 -->
              <svg v-else width="42" height="42" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#FFFFFF" stroke-width="2.5"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="#FFFFFF" stroke-width="2.5"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧预览图标 -->
      <button class="flank-icon-btn right-icon" :aria-label="nextMode.name" @click="nextSlide">
        <!-- 铅笔 -->
        <svg v-if="nextMode.iconType === 'pencil'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M3 21H7.5L19 9.5L14.5 5L3 16.5V21Z" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- 四宫格 -->
        <svg v-else-if="nextMode.iconType === 'grid'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="6" height="6" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="14" y="4" width="6" height="6" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="4" y="14" width="6" height="6" rx="2" fill="rgba(255,255,255,0.4)"/>
          <rect x="14" y="14" width="6" height="6" rx="2" fill="rgba(255,255,255,0.4)"/>
        </svg>
        <!-- 翻译 -->
        <svg v-else-if="nextMode.iconType === 'translate'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M4 6H14M9 3V6M6 14C8 12 10 9 10 6M5 10C7.5 10 10.5 12 12 15M14 20L18 10L22 20M15.5 17H20.5" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- 静音 -->
        <svg v-else-if="nextMode.iconType === 'bell-slash'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M18 16V10C18 6.7 15.3 4 12 4M6 6L18 18M6.5 16H18M10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <!-- 手电筒 -->
        <svg v-else-if="nextMode.iconType === 'flashlight'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M8 2H16V6L14 10V22H10V10L8 6V2ZM8 6H16" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <!-- 相机 -->
        <svg v-else-if="nextMode.iconType === 'camera'" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" stroke="rgba(255,255,255,0.4)" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <!-- 禁用 -->
        <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
        </svg>
      </button>
    </div>

    <!-- 模式文案与操作 -->
    <div class="onetap-info-container">
      <div class="mode-title">{{ currentMode.name }}</div>

      <div class="mode-subtitles">
        <div v-for="(sub, i) in currentMode.subtitles" :key="i" class="subtitle-line">
          {{ sub }}
        </div>
      </div>

      <!-- 调整修改胶囊按钮 -->
      <div v-if="currentMode.actionBtn" class="mode-action-wrap">
        <button
          class="action-capsule-btn"
          :class="`btn-${currentMode.actionBtn.type}`"
          @click="handleActionBtn(currentMode.actionBtn)"
        >
          {{ currentMode.actionBtn.text }}
        </button>
      </div>
      <div v-else class="mode-action-placeholder"></div>
    </div>

    <!-- 12 分页指示点（对齐真机 12 点指示器） -->
    <div class="pagination-dots">
      <span
        v-for="idx in 12"
        :key="idx"
        class="dot-item"
        :class="{ active: (idx - 1) === currentIndex }"
        @click="goToIndex(idx - 1)"
      ></span>
    </div>

    <!-- 底部状态与设定按钮 -->
    <div class="bottom-action-bar">
      <button
        v-if="isCurrentActive"
        class="main-status-btn disabled-btn"
        disabled
      >
        使用中
      </button>
      <button
        v-else
        class="main-status-btn active-btn"
        @click="applyActive"
      >
        设定
      </button>
    </div>

    <!-- 浮动提示 Toast -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast-dark">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-onetap-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #000000;
  color: #FFFFFF;
  overflow: hidden;
  user-select: none;
}

/* 顶部导航 */
.onetap-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  background: transparent;
  flex-shrink: 0;
  z-index: 10;
}

.nav-round-btn-dark {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.nav-round-btn-dark:active {
  background: rgba(255, 255, 255, 0.22);
}

.nav-title-dark {
  font-size: 17px;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: -0.2px;
}

.nav-placeholder {
  width: 36px;
}

/* 舞台布局 */
.onetap-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  max-height: 400px;
  position: relative;
}

.flank-icon-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.35;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.flank-icon-btn:hover {
  opacity: 0.7;
}

.flank-icon-btn:active {
  transform: scale(0.92);
}

/* 手机侧轨 */
.phone-rail-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
}

.phone-rail {
  width: 175px;
  height: 100%;
  max-height: 360px;
  border-radius: 40px;
  background: linear-gradient(180deg, #18181A 0%, #2A2A2E 35%, #35353A 50%, #2A2A2E 65%, #18181A 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset -3px 0 6px rgba(255, 255, 255, 0.08),
    inset 3px 0 6px rgba(0, 0, 0, 0.6),
    0 8px 32px rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 物理凹槽 */
.button-cavity {
  width: 90px;
  height: 160px;
  border-radius: 45px;
  background: #111113;
  box-shadow:
    inset 0 3px 6px rgba(0, 0, 0, 0.9),
    inset 0 -1px 2px rgba(255, 255, 255, 0.08),
    0 1px 1px rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 发光胶囊按键 */
.active-capsule-button {
  width: 76px;
  height: 144px;
  border-radius: 38px;
  background: linear-gradient(180deg, #606068 0%, #383840 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.25, 1);
  cursor: pointer;
}

.active-capsule-button:active {
  transform: scale(0.96);
}

/* 文案信息 */
.onetap-info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 24px;
  min-height: 140px;
}

.mode-title {
  font-size: 26px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.mode-subtitles {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-height: 48px;
  justify-content: center;
}

.subtitle-line {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 400;
}

.mode-action-wrap {
  margin-top: 14px;
}

.mode-action-placeholder {
  height: 38px;
  margin-top: 14px;
}

.action-capsule-btn {
  padding: 7px 22px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.action-capsule-btn:active {
  transform: scale(0.95);
}

.btn-secondary {
  background: #2C2C2E;
  color: #FFFFFF;
}

.btn-primary {
  background: #007AFF;
  color: #FFFFFF;
}

/* 12 点指示器 */
.pagination-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
}

.dot-item {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: all 0.25s ease;
}

.dot-item.active {
  background: #FFFFFF;
  transform: scale(1.3);
}

/* 底部操作区 */
.bottom-action-bar {
  padding: 12px 24px calc(var(--safe-bottom, 0px) + 20px) 24px;
  display: flex;
  justify-content: center;
}

.main-status-btn {
  width: 100%;
  max-width: 380px;
  height: 48px;
  border-radius: 24px;
  border: none;
  font-size: 16px;
  letter-spacing: -0.2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.disabled-btn {
  background: #1C1C1E;
  color: rgba(255, 255, 255, 0.28);
  font-weight: 500;
}

.active-btn {
  background: #FFFFFF;
  color: #000000;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2);
}

.active-btn:active {
  transform: scale(0.98);
}

/* Toast */
.settings-toast-dark {
  position: absolute;
  bottom: 84px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.92);
  color: #000000;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
