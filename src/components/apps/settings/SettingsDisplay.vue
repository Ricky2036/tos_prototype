<script setup>
import { ref, computed } from 'vue'
import { useControlStore } from '../../../stores/controlStore'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back', 'navigate'])
const control = useControlStore()

// 本地设置交互状态
const autoBrightness = ref(true)
const eyeCareMode = ref(false)
const portraitLock = ref(true)

// 浮层反馈提示
const toastText = ref('')
let toastTimer = null
function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2200)
}

function selectTheme(mode) {
  if (mode === 'dark') {
    control.setFlag('darkMode', true)
  } else {
    control.setFlag('darkMode', false)
  }
}

function handleItemTap(name) {
  showToast(`已进入${name}设置`)
}

function handleRelativeNavigate(target) {
  if (target === 'personalization') {
    emit('navigate', 'personalization')
  } else if (target === 'language') {
    emit('navigate', 'language')
  } else {
    showToast(`已进入${target}设置`)
  }
}

// 亮度滑块交互
const sliderTrackRef = ref(null)
const isDragging = ref(false)

// 亮度范围：0.25 .. 1.0 映射到 0% .. 100%
const brightnessPercent = computed(() => {
  const b = control.brightness ?? 1.0
  const pct = Math.max(0, Math.min(100, ((b - 0.25) / 0.75) * 100))
  return Math.round(pct)
})

function updateBrightnessFromPointer(clientX) {
  if (!sliderTrackRef.value) return
  const rect = sliderTrackRef.value.getBoundingClientRect()
  if (rect.width <= 0) return
  const rawRatio = (clientX - rect.left) / rect.width
  const clampedRatio = Math.max(0, Math.min(1, rawRatio))
  const newBrightness = 0.25 + clampedRatio * 0.75
  control.setBrightness(newBrightness)
}

function onSliderPointerDown(e) {
  isDragging.value = true
  e.currentTarget.setPointerCapture?.(e.pointerId)
  updateBrightnessFromPointer(e.clientX)
}

function onSliderPointerMove(e) {
  if (!isDragging.value) return
  updateBrightnessFromPointer(e.clientX)
}

function onSliderPointerUp(e) {
  if (isDragging.value) {
    isDragging.value = false
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId)
    } catch {
      // 忽略
    }
  }
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-display-page">
    <!-- 顶部导航栏：圆形微投影返回键 + 左对齐大标题 -->
    <div class="display-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">显示与亮度</div>
    </div>

    <!-- 滚动内容区 -->
    <div class="display-scroll-body">
      <!-- 卡片 1: 外观主题模式 -->
      <div class="settings-card theme-card">
        <div class="theme-picker-row">
          <!-- 浅色主题 -->
          <div
            class="theme-col"
            :class="{ active: !control.darkMode }"
            @click="selectTheme('light')"
          >
            <div class="theme-mockup-frame light">
              <div class="mockup-top-pill"></div>
              <div class="mockup-inner-card">
                <div class="mockup-line line-short"></div>
                <div class="mockup-line line-long"></div>
                <div class="mockup-line line-medium"></div>
              </div>
            </div>
            <span class="theme-label">浅色主题</span>
            <div class="theme-radio" :class="{ checked: !control.darkMode }">
              <div v-if="!control.darkMode" class="theme-radio-dot"></div>
            </div>
          </div>

          <!-- 深色主题 -->
          <div
            class="theme-col"
            :class="{ active: control.darkMode }"
            @click="selectTheme('dark')"
          >
            <div class="theme-mockup-frame dark">
              <div class="mockup-top-pill"></div>
              <div class="mockup-inner-card">
                <div class="mockup-line line-short"></div>
                <div class="mockup-line line-long"></div>
                <div class="mockup-line line-medium"></div>
              </div>
            </div>
            <span class="theme-label">深色主题</span>
            <div class="theme-radio" :class="{ checked: control.darkMode }">
              <div v-if="control.darkMode" class="theme-radio-dot"></div>
            </div>
          </div>
        </div>

        <div class="theme-card-divider"></div>

        <ListCell
          title="定时切换主题"
          value="已关闭"
          chevron
          clickable
          @click="handleItemTap('定时切换主题')"
        />
        <ListCell
          title="深色主题设置"
          chevron
          clickable
          last
          @click="handleItemTap('深色主题设置')"
        />
      </div>

      <!-- 卡片 1 底部提示语 -->
      <div class="card-footer-note">深色主题可节省更多电量。</div>

      <!-- 卡片 2: 屏幕亮度 -->
      <div class="section-header">屏幕亮度</div>
      <div class="settings-card brightness-card">
        <!-- 亮度滑块行 -->
        <div class="brightness-slider-row">
          <div class="brightness-sun-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4.2" stroke="#8E8E93" stroke-width="1.8" />
              <line x1="12" y1="2" x2="12" y2="4.5" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" />
              <line x1="12" y1="19.5" x2="12" y2="22" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" />
              <line x1="2" y1="12" x2="4.5" y2="12" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" />
              <line x1="19.5" y1="12" x2="22" y2="12" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" />
              <line x1="4.93" y1="4.93" x2="6.7" y2="6.7" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" />
              <line x1="17.3" y1="17.3" x2="19.07" y2="19.07" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" />
              <line x1="4.93" y1="19.07" x2="6.7" y2="17.3" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" />
              <line x1="17.3" y1="6.7" x2="19.07" y2="4.93" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </div>

          <div
            ref="sliderTrackRef"
            class="slider-track"
            @pointerdown="onSliderPointerDown"
            @pointermove="onSliderPointerMove"
            @pointerup="onSliderPointerUp"
            @pointercancel="onSliderPointerUp"
          >
            <div class="slider-fill" :style="{ width: `${brightnessPercent}%` }"></div>
            <div class="slider-thumb" :style="{ left: `${brightnessPercent}%` }"></div>
          </div>
        </div>

        <ListCell title="自动调节亮度" last>
          <template #right>
            <ToggleSwitch v-model="autoBrightness" color="blue" />
          </template>
        </ListCell>
      </div>

      <!-- 卡片 3: 屏幕偏好 -->
      <div class="section-header">屏幕偏好</div>
      <div class="settings-card">
        <ListCell
          title="护眼模式"
          chevron
          clickable
          @click="handleItemTap('护眼模式')"
        />
        <ListCell
          title="色彩风格"
          chevron
          clickable
          @click="handleItemTap('色彩风格')"
        />
        <ListCell
          title="屏幕刷新率"
          value="智能切换"
          chevron
          clickable
          last
          @click="handleItemTap('屏幕刷新率')"
        />
      </div>

      <!-- 卡片 4: 显示 -->
      <div class="section-header">显示</div>
      <div class="settings-card">
        <ListCell
          title="自动息屏时间"
          value="10 分钟"
          chevron
          clickable
          @click="handleItemTap('自动息屏时间')"
        />
        <ListCell
          title="字体"
          chevron
          clickable
          @click="handleItemTap('字体')"
        />
        <ListCell
          title="显示大小"
          chevron
          clickable
          @click="handleItemTap('显示大小')"
        />
        <ListCell title="竖屏锁定">
          <template #right>
            <ToggleSwitch v-model="portraitLock" color="blue" />
          </template>
        </ListCell>
        <ListCell
          title="应用全屏显示"
          chevron
          clickable
          last
          @click="handleItemTap('应用全屏显示')"
        />
      </div>

      <!-- 卡片 5: 你可能想找 -->
      <div class="relative-links-box">
        <div class="relative-title">你可能想找</div>
        <div class="relative-links">
          <button class="relative-link-btn" @click="handleRelativeNavigate('personalization')">
            主题与个性化
          </button>
          <button class="relative-link-btn" @click="handleRelativeNavigate('桌面设置')">
            桌面设置
          </button>
          <button class="relative-link-btn" @click="handleRelativeNavigate('系统导航')">
            系统导航
          </button>
          <button class="relative-link-btn" @click="handleRelativeNavigate('language')">
            语言与输入法
          </button>
          <button class="relative-link-btn" @click="handleRelativeNavigate('显示在其他应用的上层')">
            显示在其他应用的上层
          </button>
        </div>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 浮动提示 Toast -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-display-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-subtle, #F2F2F7);
  color: #1C1C1E;
  overflow: hidden;
  user-select: none;
}

/* 导航栏：左对齐大标题 + 白色微圆角圆形返回按钮 */
.display-nav-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  background: #F2F2F7;
  flex-shrink: 0;
  z-index: 10;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  transition: background 0.15s ease, transform 0.1s ease;
}

.nav-round-btn:active {
  background: #F0F0F2;
  transform: scale(0.96);
}

.nav-title {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  letter-spacing: -0.3px;
}

/* 滚动区域 */
.display-scroll-body {
  flex: 1;
  padding: 8px 16px 36px 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 通用设置卡片 */
.settings-card {
  background: #FFFFFF;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* 分组标题 */
.section-header {
  font-size: 13.5px;
  color: #8E8E93;
  margin: 20px 16px 8px 16px;
  font-weight: 400;
}

/* 主题选择卡片 */
.theme-card {
  padding-bottom: 4px;
}

.theme-picker-row {
  display: flex;
  gap: 16px;
  padding: 22px 18px 16px 18px;
  justify-content: center;
}

.theme-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  max-width: 154px;
}

/* 手机屏幕模型 */
.theme-mockup-frame {
  width: 100%;
  aspect-ratio: 120 / 164;
  border-radius: 18px;
  box-sizing: border-box;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.15s ease;
}

.theme-col:active .theme-mockup-frame {
  transform: scale(0.97);
}

.theme-mockup-frame.light {
  background: #FFFFFF;
  border: 1.5px solid #E5E6EA;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.theme-mockup-frame.dark {
  background: #202124;
  border: 1.5px solid #2F3035;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mockup-top-pill {
  width: 78%;
  height: 16px;
  border-radius: 8px;
  margin-top: 4px;
  margin-bottom: 12px;
}

.theme-mockup-frame.light .mockup-top-pill {
  background: #F1F2F5;
}

.theme-mockup-frame.dark .mockup-top-pill {
  background: #2D2E34;
}

.mockup-inner-card {
  width: 78%;
  height: 86px;
  border-radius: 10px;
  padding: 12px 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-mockup-frame.light .mockup-inner-card {
  background: #F7F8FA;
}

.theme-mockup-frame.dark .mockup-inner-card {
  background: #282930;
}

.mockup-line {
  height: 5px;
  border-radius: 2.5px;
}

.mockup-line.line-short {
  width: 56%;
}

.mockup-line.line-long {
  width: 86%;
}

.mockup-line.line-medium {
  width: 42%;
}

.theme-mockup-frame.light .mockup-line.line-short {
  background: #D5D7DF;
}

.theme-mockup-frame.light .mockup-line.line-long,
.theme-mockup-frame.light .mockup-line.line-medium {
  background: #E6E8EE;
}

.theme-mockup-frame.dark .mockup-line.line-short {
  background: #464853;
}

.theme-mockup-frame.dark .mockup-line.line-long,
.theme-mockup-frame.dark .mockup-line.line-medium {
  background: #363740;
}

.theme-label {
  font-size: 14.5px;
  font-weight: 500;
  color: #111111;
  margin-top: 12px;
}

/* 主题单选圆环 */
.theme-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #C7C7CC;
  background: #FFFFFF;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.theme-radio.checked {
  border: 2.5px solid #007AFF;
}

.theme-radio-dot {
  width: 9.5px;
  height: 9.5px;
  border-radius: 50%;
  background: #007AFF;
}

.theme-card-divider {
  height: 0.5px;
  background: #F0F1F3;
  margin: 6px 16px 0 16px;
}

/* 卡片外提示说明 */
.card-footer-note {
  font-size: 13px;
  color: #8E8E93;
  margin: 8px 16px 18px 16px;
  line-height: 1.4;
}

/* 亮度滑块行 */
.brightness-card {
  padding-top: 4px;
}

.brightness-slider-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 16px;
  border-bottom: 0.5px solid #F0F1F3;
}

.brightness-sun-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-track {
  flex: 1;
  height: 6px;
  background: #EDEDF0;
  border-radius: 3px;
  position: relative;
  cursor: pointer;
  touch-action: none;
}

.slider-fill {
  height: 100%;
  background: #007AFF;
  border-radius: 3px;
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  border: 1.5px solid rgba(0, 0, 0, 0.05);
  pointer-events: none;
}

/* 你可能想找 */
.relative-links-box {
  background: #F0F1F4;
  border-radius: 20px;
  padding: 20px 20px 24px 20px;
  margin-top: 24px;
  margin-bottom: 24px;
}

.relative-title {
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 16px;
  font-weight: 400;
}

.relative-links {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.relative-link-btn {
  background: transparent;
  border: none;
  outline: none;
  text-align: left;
  font-size: 15px;
  color: #007AFF;
  font-weight: 450;
  padding: 0;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.relative-link-btn:active {
  opacity: 0.6;
}

.bottom-spacer {
  height: 24px;
}

/* Toast 提示 */
.settings-toast {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 32, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #FFFFFF;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 22px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
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
  transform: translate(-50%, 10px);
}
</style>
