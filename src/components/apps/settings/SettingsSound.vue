<script setup>
import { ref, computed } from 'vue'
import { useControlStore } from '../../../stores/controlStore'
import { usePrayerStore } from '../../../stores/prayerStore'
import { useI18nStore } from '../../../stores/i18nStore'
import LIcon from '../../ui/LIcon.vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back', 'open-dnd', 'open-prayer'])
const control = useControlStore()
const prayerStore = usePrayerStore()
const i18n = useI18nStore()

// 音量状态：媒体与 controlStore.volume 保持双向同步，其余为独立音量通道
const volumes = ref({
  media: control.volume ?? 0.65,
  ring: 0.15,
  notif: 0.28,
  alarm: 0.32
})

// 开关与交互状态
const ringAscending = ref(true)

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

function setSoundMode(mode) {
  control.setSoundMode(mode)
}

function handleItemTap(name) {
  showToast(`已进入${name}设置`)
}

// 音量滑块拖拽交互
const draggingChannel = ref(null)

function updateVolumeFromPointer(channel, clientX, trackEl) {
  if (!trackEl) return
  const rect = trackEl.getBoundingClientRect()
  if (rect.width <= 0) return
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  volumes.value[channel] = Math.round(ratio * 100) / 100
  if (channel === 'media') {
    control.setVolume(ratio)
  }
}

function onSliderPointerDown(channel, e) {
  draggingChannel.value = channel
  const track = e.currentTarget
  track.setPointerCapture?.(e.pointerId)
  updateVolumeFromPointer(channel, e.clientX, track)
}

function onSliderPointerMove(channel, e) {
  if (draggingChannel.value !== channel) return
  updateVolumeFromPointer(channel, e.clientX, e.currentTarget)
}

function onSliderPointerUp(channel, e) {
  if (draggingChannel.value === channel) {
    draggingChannel.value = null
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
  <div class="settings-sound-page">
    <!-- 顶部导航栏：圆形微投影返回键 + 左对齐大标题 -->
    <div class="sound-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">声音与振动</div>
    </div>

    <!-- 滚动内容区 -->
    <div class="sound-scroll-body">
      <!-- 卡片 1: 响铃/振动/静音模式 + 勿扰模式 + 礼拜模式入口 -->
      <div class="settings-card mode-card">
        <div class="mode-picker-row">
          <!-- 铃声 -->
          <div
            class="mode-col"
            :class="{ active: control.soundMode === 'ring' }"
            @click="setSoundMode('ring')"
          >
            <div class="mode-icon-box">
              <LIcon name="bell" :size="26" />
            </div>
            <span class="mode-label">铃声</span>
            <div class="mode-radio" :class="{ checked: control.soundMode === 'ring' }">
              <div v-if="control.soundMode === 'ring'" class="mode-radio-dot"></div>
            </div>
          </div>

          <!-- 振动 -->
          <div
            class="mode-col"
            :class="{ active: control.soundMode === 'vibrate' }"
            @click="setSoundMode('vibrate')"
          >
            <div class="mode-icon-box">
              <LIcon name="vibrate" :size="26" />
            </div>
            <span class="mode-label">振动</span>
            <div class="mode-radio" :class="{ checked: control.soundMode === 'vibrate' }">
              <div v-if="control.soundMode === 'vibrate'" class="mode-radio-dot"></div>
            </div>
          </div>

          <!-- 静音 -->
          <div
            class="mode-col"
            :class="{ active: control.soundMode === 'mute' }"
            @click="setSoundMode('mute')"
          >
            <div class="mode-icon-box">
              <LIcon name="bellOff" :size="26" />
            </div>
            <span class="mode-label">静音</span>
            <div class="mode-radio" :class="{ checked: control.soundMode === 'mute' }">
              <div v-if="control.soundMode === 'mute'" class="mode-radio-dot"></div>
            </div>
          </div>
        </div>

        <div class="mode-card-divider"></div>

        <!-- 勿扰模式入口 -->
        <ListCell
          title="勿扰模式"
          :value="control.doNotDisturb ? '已开启' : '已关闭'"
          chevron
          clickable
          @click="emit('open-dnd')"
        />

        <!-- 礼拜模式入口（特别保留） -->
        <ListCell
          title="礼拜模式"
          :value="prayerStore.masterEnabled ? (prayerStore.activePrayer ? '礼拜中' : '已开启') : '已关闭'"
          chevron
          clickable
          last
          @click="emit('open-prayer')"
        />
      </div>

      <!-- 卡片 2: 音量调节卡片 -->
      <div class="section-header">音量</div>
      <div class="settings-card volume-card">
        <!-- 媒体音量 -->
        <div class="volume-slider-item">
          <div class="volume-header-line">
            <div class="volume-icon-box">
              <LIcon name="volume2" :size="20" />
            </div>
            <span class="volume-title">媒体</span>
          </div>
          <div
            class="slider-track"
            @pointerdown="onSliderPointerDown('media', $event)"
            @pointermove="onSliderPointerMove('media', $event)"
            @pointerup="onSliderPointerUp('media', $event)"
            @pointercancel="onSliderPointerUp('media', $event)"
          >
            <div class="slider-fill" :style="{ width: `${volumes.media * 100}%` }"></div>
            <div class="slider-thumb" :style="{ left: `${volumes.media * 100}%` }"></div>
          </div>
        </div>

        <div class="volume-divider"></div>

        <!-- 铃声音量 -->
        <div class="volume-slider-item">
          <div class="volume-header-line">
            <div class="volume-icon-box">
              <LIcon name="bell" :size="20" />
            </div>
            <span class="volume-title">铃声</span>
          </div>
          <div
            class="slider-track"
            @pointerdown="onSliderPointerDown('ring', $event)"
            @pointermove="onSliderPointerMove('ring', $event)"
            @pointerup="onSliderPointerUp('ring', $event)"
            @pointercancel="onSliderPointerUp('ring', $event)"
          >
            <div class="slider-fill" :style="{ width: `${volumes.ring * 100}%` }"></div>
            <div class="slider-thumb" :style="{ left: `${volumes.ring * 100}%` }"></div>
          </div>
        </div>

        <div class="volume-divider"></div>

        <!-- 通知音量 -->
        <div class="volume-slider-item">
          <div class="volume-header-line">
            <div class="volume-icon-box">
              <LIcon name="bellDot" :size="20" />
            </div>
            <span class="volume-title">通知</span>
          </div>
          <div
            class="slider-track"
            @pointerdown="onSliderPointerDown('notif', $event)"
            @pointermove="onSliderPointerMove('notif', $event)"
            @pointerup="onSliderPointerUp('notif', $event)"
            @pointercancel="onSliderPointerUp('notif', $event)"
          >
            <div class="slider-fill" :style="{ width: `${volumes.notif * 100}%` }"></div>
            <div class="slider-thumb" :style="{ left: `${volumes.notif * 100}%` }"></div>
          </div>
        </div>

        <div class="volume-divider"></div>

        <!-- 闹钟音量 -->
        <div class="volume-slider-item last">
          <div class="volume-header-line">
            <div class="volume-icon-box">
              <LIcon name="alarmClock" :size="20" />
            </div>
            <span class="volume-title">闹钟</span>
          </div>
          <div
            class="slider-track"
            @pointerdown="onSliderPointerDown('alarm', $event)"
            @pointermove="onSliderPointerMove('alarm', $event)"
            @pointerup="onSliderPointerUp('alarm', $event)"
            @pointercancel="onSliderPointerUp('alarm', $event)"
          >
            <div class="slider-fill" :style="{ width: `${volumes.alarm * 100}%` }"></div>
            <div class="slider-thumb" :style="{ left: `${volumes.alarm * 100}%` }"></div>
          </div>
        </div>
      </div>

      <!-- 卡片 3: 触感反馈 -->
      <div class="settings-card" style="margin-top: 16px;">
        <ListCell
          title="触感反馈"
          value="开启"
          chevron
          clickable
          last
          @click="handleItemTap('触感反馈')"
        />
      </div>

      <!-- 卡片 4: 铃声设置 -->
      <div class="section-header">铃声设置</div>
      <div class="settings-card">
        <ListCell
          title="来电铃声"
          subtitle="SIM1:  Elegant&#10;SIM2:  Elegant"
          chevron
          clickable
          @click="handleItemTap('来电铃声')"
        />
        <ListCell
          title="通知铃声"
          subtitle="Acclivity"
          chevron
          clickable
          @click="handleItemTap('通知铃声')"
        />
        <ListCell title="来电铃声渐响" last>
          <template #right>
            <ToggleSwitch v-model="ringAscending" color="blue" />
          </template>
        </ListCell>
      </div>

      <!-- 卡片 5: 振动强度 -->
      <div class="settings-card" style="margin-top: 16px;">
        <ListCell
          title="振动强度"
          chevron
          clickable
          last
          @click="handleItemTap('振动强度')"
        />
      </div>

      <!-- 卡片 6: 声音模式 -->
      <div class="section-header">声音模式</div>
      <div class="settings-card">
        <ListCell
          title="JBL 音效实验室"
          value="智能"
          chevron
          clickable
          @click="handleItemTap('JBL 音效实验室')"
        />
        <ListCell
          title="全场景降噪"
          subtitle="智能降低语音场景中的噪声。"
          chevron
          clickable
          last
          @click="handleItemTap('全场景降噪')"
        />
      </div>

      <!-- 卡片 7: 提示音 -->
      <div class="settings-card" style="margin-top: 16px; margin-bottom: 24px;">
        <ListCell
          title="提示音"
          chevron
          clickable
          last
          @click="handleItemTap('提示音')"
        />
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
.settings-sound-page {
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
.sound-nav-bar {
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
.sound-scroll-body {
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

/* 模式选择卡片 */
.mode-card {
  padding-bottom: 2px;
}

.mode-picker-row {
  display: flex;
  padding: 22px 16px 18px 16px;
}

.mode-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #636366;
  transition: color 0.15s ease;
}

.mode-col.active {
  color: #007AFF;
}

.mode-icon-box {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-label {
  font-size: 14px;
  font-weight: 500;
  color: inherit;
}

/* 模式单选圆环 */
.mode-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #C7C7CC;
  background: #FFFFFF;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.mode-radio.checked {
  border: 2.5px solid #007AFF;
}

.mode-radio-dot {
  width: 9.5px;
  height: 9.5px;
  border-radius: 50%;
  background: #007AFF;
}

.mode-card-divider {
  height: 0.5px;
  background: #F0F1F3;
  margin: 4px 16px 0 16px;
}

/* ================= 音量滑块卡片 ================= */
.volume-card {
  padding: 4px 0 6px 0;
}

.volume-slider-item {
  padding: 14px 16px 16px 16px;
}

.volume-header-line {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.volume-icon-box {
  flex-shrink: 0;
  color: #636366;
  display: flex;
  align-items: center;
  justify-content: center;
}

.volume-title {
  font-size: 16px;
  font-weight: 450;
  color: #111111;
}

.slider-track {
  width: 100%;
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
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  border: 2px solid #007AFF;
  pointer-events: none;
}

.volume-divider {
  height: 0.5px;
  background: #F0F1F3;
  margin: 0 16px;
}

/* 换行副标题样式修正 */
:deep(.lc-subtitle) {
  white-space: pre-line !important;
  line-height: 1.4 !important;
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
