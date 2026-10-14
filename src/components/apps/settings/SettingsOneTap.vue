<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['back', 'navigate'])

// 预设模式列表（完全对齐真机 One-Tap Button 轮播项与实机截图）
const modes = [
  {
    id: 'custom',
    name: '自定义',
    iconType: 'pencil',
    glowColor: 'rgba(139, 144, 246, 0.45)',
    buttonBg: 'linear-gradient(180deg, #9FA5F8 0%, #7B81EA 100%)',
    subtitles: ['长按静音', '单击唤起一键闪记', '双击打开手电筒'],
    actionBtn: { text: '去修改', type: 'secondary' }
  },
  {
    id: 'shortcut_app',
    name: '快捷应用',
    iconType: 'grid',
    glowColor: 'rgba(77, 141, 254, 0.45)',
    buttonBg: 'linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)',
    subtitles: ['长按快启应用'],
    actionBtn: { text: '去设置', type: 'primary' }
  },
  {
    id: 'translate',
    name: '翻译助手',
    iconType: 'translate',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    buttonBg: 'linear-gradient(180deg, #C084FC 0%, #9333EA 100%)',
    subtitles: ['长按实时翻译'],
    actionBtn: null
  },
  {
    id: 'mute',
    name: '静音模式',
    iconType: 'bell-slash',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    buttonBg: 'linear-gradient(180deg, #FBBF24 0%, #D97706 100%)',
    subtitles: ['长按切换响铃/静音'],
    actionBtn: null
  },
  {
    id: 'flashlight',
    name: '手电筒',
    iconType: 'flashlight',
    glowColor: 'rgba(250, 204, 21, 0.45)',
    buttonBg: 'linear-gradient(180deg, #FDE047 0%, #CA8A04 100%)',
    subtitles: ['长按开启/关闭手电筒'],
    actionBtn: null
  },
  {
    id: 'camera',
    name: '相机',
    iconType: 'camera',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    buttonBg: 'linear-gradient(180deg, #34D399 0%, #059669 100%)',
    subtitles: ['长按快速打开相机'],
    actionBtn: null
  },
  {
    id: 'none',
    name: '无操作',
    iconType: 'ban',
    glowColor: 'none',
    buttonBg: 'linear-gradient(180deg, #6B7280 0%, #4B5563 100%)',
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
  <div class="settings-onetap-page" aria-label="One-Tap Button" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <!-- 顶部导航栏：真机无中间标题，仅左上角圆形返回键 -->
    <div class="onetap-nav-bar">
      <button class="nav-round-btn-dark" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
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
                background: currentMode.buttonBg,
                boxShadow: currentMode.glowColor !== 'none'
                  ? `0 0 45px ${currentMode.glowColor}, inset 0 2px 4px rgba(255, 255, 255, 0.45)`
                  : 'none'
              }"
            >
              <!-- 键内图案 -->
              <!-- 铅笔 -->
              <svg v-if="currentMode.iconType === 'pencil'" width="42" height="42" viewBox="0 0 24 24" fill="none">
                <path d="M3 21H7.5L19 9.5L14.5 5L3 16.5V21Z" fill="#FFFFFF"/>
                <line x1="13.5" y1="6" x2="18" y2="10.5" stroke="rgba(0,0,0,0.2)" stroke-width="1.5"/>
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
                <circle cx="12" cy="13" r="3.5" fill="rgba(0,0,0,0.2)"/>
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
      <div class="action-btn-row">
        <button
          v-if="currentMode.actionBtn"
          class="sub-action-pill"
          :class="currentMode.actionBtn.type"
          @click="handleActionBtn(currentMode.actionBtn)"
        >
          {{ currentMode.actionBtn.text }}
        </button>
      </div>

      <!-- 底部指示圆点（真机 10 点指示器） -->
      <div class="carousel-dots-row pagination-dots">
        <span
          v-for="(_, idx) in 10"
          :key="idx"
          class="carousel-dot"
          :class="{ active: idx === currentIndex }"
          @click="goToIndex(idx)"
        ></span>
      </div>

      <!-- 底部主设定按钮：使用中 / 设定 -->
      <button
        class="bottom-apply-btn"
        :class="{ applied: isCurrentActive }"
        :disabled="isCurrentActive"
        @click="applyActive"
      >
        {{ isCurrentActive ? '使用中' : '设定' }}
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

/* 顶部导航：无中间标题 */
.onetap-nav-bar {
  display: flex;
  align-items: center;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  background: transparent;
  flex-shrink: 0;
  z-index: 10;
}

.nav-round-btn-dark {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.nav-round-btn-dark:active {
  background: rgba(255, 255, 255, 0.25);
}

/* 舞台布局：机身侧轨贯穿上半部 */
.onetap-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  max-height: 420px;
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
  z-index: 5;
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
  width: 190px;
  height: 100%;
  max-height: 380px;
  border-radius: 44px;
  background: linear-gradient(90deg, #18191B 0%, #2C2D31 20%, #45474D 48%, #4A4C52 50%, #45474D 52%, #2C2D31 80%, #18191B 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset -3px 0 6px rgba(255, 255, 255, 0.08),
    inset 3px 0 6px rgba(0, 0, 0, 0.6),
    0 12px 40px rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* 物理凹槽 */
.button-cavity {
  width: 96px;
  height: 200px;
  border-radius: 48px;
  background: #18191D;
  box-shadow:
    inset 0 3px 8px rgba(0, 0, 0, 0.95),
    inset 0 -1px 3px rgba(255, 255, 255, 0.08),
    0 1px 2px rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 发光胶囊按键 */
.active-capsule-button {
  width: 82px;
  height: 184px;
  border-radius: 41px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  cursor: pointer;
}

.active-capsule-button:active {
  transform: scale(0.97);
}

/* 底部信息区 */
.onetap-info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px 32px 24px;
  flex-shrink: 0;
}

.mode-title {
  font-size: 24px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 8px;
  letter-spacing: -0.3px;
}

.mode-subtitles {
  min-height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  margin-bottom: 12px;
}

.subtitle-line {
  font-size: 13.5px;
  color: #8E8E93;
}

/* 修改操作按钮 */
.action-btn-row {
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.sub-action-pill {
  padding: 7px 22px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sub-action-pill.secondary {
  background: rgba(255, 255, 255, 0.18);
  color: #FFFFFF;
}

.sub-action-pill.secondary:active {
  background: rgba(255, 255, 255, 0.28);
}

.sub-action-pill.primary {
  background: #007AFF;
  color: #FFFFFF;
}

.sub-action-pill.primary:active {
  background: #0062CC;
}

/* 轮播点指示器 */
.carousel-dots-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 26px;
}

.carousel-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: all 0.2s ease;
}

.carousel-dot.active {
  background: #FFFFFF;
  width: 14px;
  border-radius: 3px;
}

/* 底部主按钮 */
.bottom-apply-btn {
  width: 100%;
  max-width: 340px;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #FFFFFF;
  color: #000000;
}

.bottom-apply-btn.applied {
  background: rgba(255, 255, 255, 0.08);
  color: #636366;
  cursor: default;
}

.bottom-apply-btn:not(.applied):active {
  opacity: 0.85;
  transform: scale(0.98);
}

/* Toast Dark */
.settings-toast-dark {
  position: absolute;
  bottom: 84px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(44, 44, 46, 0.92);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
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
