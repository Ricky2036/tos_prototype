<script setup>
import { wideMode, formMetrics, formMoving as desktopFormMoving } from './config/deviceDesktop.js'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useClock } from './composables/useClock'
import { useSpring } from './composables/useSpring'
import PhoneFrame from './components/phone/PhoneFrame.vue'
import ScreenView from './components/phone/ScreenView.vue'
import DevConsole from './components/dev/DevConsole.vue'
import { useSystemStore } from './stores/systemStore'
import { useControlStore } from './stores/controlStore'
import { useBackScreenStore, BACK_SCREEN_PRODUCT_LINES, BACK_SCREEN_TRACKS } from './stores/backScreenStore'
import BackScreenWeather from './components/dev/BackScreenWeather.vue'
import BackScreenClockWallpaper from './components/dev/BackScreenClockWallpaper.vue'
import BackScreenPassiveDisplay from './components/dev/BackScreenPassiveDisplay.vue'
import BackScreenCalendar from './components/dev/BackScreenCalendar.vue'
import BackScreenCamera from './components/dev/BackScreenCamera.vue'
import { useCapture } from './composables/useCapture'

/**
 * 舞台：手机 + 原型配置控制台。
 * 移动端适配：
 * 1. 手机端打开网页：不显示手机金属外壳与外层阴影边框，整个 OS 满屏铺满展示；
 * 2. 手机端控制台改为在屏幕上的半透明悬浮按钮（FAB），支持点击展开/收起底部控制台抽屉，支持拖拽更改位置（吸边吸附）。
 * 3. 桌面端保留原有手机外壳与侧边栏控制台。
 */
const stageRef = ref(null)
const phoneScaleRef = ref(null)
const system = useSystemStore()
const control = useControlStore()
const backScreen = useBackScreenStore()
const backScreenTrack = () => BACK_SCREEN_TRACKS[backScreen.musicTrackIndex] || BACK_SCREEN_TRACKS[0]
const backScreenProduct = () => BACK_SCREEN_PRODUCT_LINES.find((item) => item.id === backScreen.productLine) || BACK_SCREEN_PRODUCT_LINES.at(-1)
function backScreenProductStyle() {
  const level = Number(backScreen.settings.backlightLevel.replace('等级 ', '')) || 5
  return { ...backScreenProduct().theme, filter: `brightness(${0.4 + level * 0.12})` }
}
function selectRearMusicTrack(direction) {
  backScreen.musicTrackIndex = (backScreen.musicTrackIndex + direction + BACK_SCREEN_TRACKS.length) % BACK_SCREEN_TRACKS.length
}
function toggleRearMusic() { backScreen.isMusicPlaying = !backScreen.isMusicPlaying }
function formatBackDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}
const { timeShort: backTimeShort, dateLong: backDateLong } = useClock()
const BASE_SCREEN_W = 360
const BASE_SCREEN_H = 788
const WIDE_SCREEN_W = 1280 / 3
const WIDE_SCREEN_H = 2200 / 3
const FORM_STORAGE_KEY = 'tos.previewForm'

function readInitialForm() {
  if (typeof window === 'undefined') return 'slab'
  const q = new URLSearchParams(window.location.search).get('form')
  if (q === 'wide' || q === 'slab') return q
  try {
    const saved = window.localStorage?.getItem(FORM_STORAGE_KEY)
    if (saved === 'wide' || saved === 'slab') return saved
  } catch {}
  return 'slab'
}

const previewForm = ref(readInitialForm())
watch(previewForm, form => { wideMode.value = form === 'wide' }, { immediate: true, flush: 'sync' })
const formMoving = ref(false)
const previewViewport = ref({ width: BASE_SCREEN_W, height: BASE_SCREEN_H, stageHeight: BASE_SCREEN_H })
const reducedMotion =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null
const selectedFormAmount = () => (previewForm.value === 'wide' ? 1 : 0)
const formSpring = useSpring(selectedFormAmount())
const formAmount = computed(() => Math.max(0, Math.min(1, formSpring.value.value)))
const interpolate = (from, to, amount) => from + (to - from) * amount

let formRun = 0
watch(previewForm, (next) => {
  try {
    window.localStorage?.setItem(FORM_STORAGE_KEY, next)
  } catch {}
  const run = ++formRun
  formMoving.value = !(reducedMotion?.matches)
  const target = selectedFormAmount()
  if (reducedMotion?.matches) {
    formSpring.snapTo(target)
  } else {
    formSpring.animateTo(target, {
      config: { mass: 1, stiffness: 420, damping: 41 },
      onDone: () => {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            if (run === formRun) formMoving.value = false
          })
        )
      }
    })
  }
})

function syncReducedMotion(event) {
  if (event.matches) {
    formMoving.value = false
    formSpring.snapTo(selectedFormAmount())
  }
}

const phoneFace = ref('front')
const isFlipping = ref(false)
const isMobile = ref(false)
const mobileScale = ref(1)
const mobileLogicalHeight = ref(BASE_SCREEN_H)

const previewGeometry = computed(() => {
  const amount = formAmount.value
  const { width, height, stageHeight } = previewViewport.value
  const screenW = interpolate(BASE_SCREEN_W, WIDE_SCREEN_W, amount)
  const slabH = isMobile.value ? mobileLogicalHeight.value : BASE_SCREEN_H
  const screenH = interpolate(slabH, WIDE_SCREEN_H, amount)
  const stage = {
    '--screen-w': `${screenW}px`,
    '--screen-h': `${screenH}px`,
    '--preview-progress': amount
  }

  if (!isMobile.value) {
    stage['--preview-scale'] = Math.max(0.62, Math.min(1, (stageHeight - 32) / (screenH + 32 + 96)))
    return stage
  }

  const wideScale = Math.min((width - 16) / WIDE_SCREEN_W, (height - 16) / WIDE_SCREEN_H)
  const slabScale = mobileScale.value
  const visualW = interpolate(BASE_SCREEN_W * slabScale, WIDE_SCREEN_W * wideScale, amount)
  const displayScale = visualW / screenW
  const left = (visualW - BASE_SCREEN_W * slabScale) / -2
  const top = (screenH * displayScale - slabH * slabScale) / -2
  stage['--preview-left'] = `${left}px`
  stage['--preview-top'] = `${top}px`
  stage['--preview-scale'] = displayScale
  return stage
})

function applyPreviewGeometry() {
  const stage = stageRef.value
  if (!stage) return
  stage.dataset.formMoving = String(formMoving.value)
  desktopFormMoving.value = formMoving.value
  const geometry = previewGeometry.value
  formMetrics.value = {
    width: parseFloat(geometry['--screen-w']),
    height: parseFloat(geometry['--screen-h']),
    progress: geometry['--preview-progress'],
    slabHeight: isMobile.value ? mobileLogicalHeight.value : BASE_SCREEN_H,
    wideHeight: WIDE_SCREEN_H
  }
  for (const [property, value] of Object.entries(previewGeometry.value)) {
    stage.style.setProperty(property, value)
  }
}

watch([previewGeometry, formMoving], applyPreviewGeometry, { flush: 'post' })

function checkMobile() {
  if (typeof window === 'undefined') return
  const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
  const isSmallScreen = window.innerWidth <= 768
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  isMobile.value = isMobileUA || (isSmallScreen && isTouchDevice) || isSmallScreen
}

function updateStageMetrics() {
  if (typeof window === 'undefined') return
  checkMobile()
  const vw = Math.max(280, window.visualViewport?.width || window.innerWidth || BASE_SCREEN_W)
  const vh = Math.max(480, window.visualViewport?.height || window.innerHeight || BASE_SCREEN_H)
  previewViewport.value = { width: vw, height: vh, stageHeight: window.innerHeight || vh }
  if (isMobile.value) {
    const s = vw / BASE_SCREEN_W
    mobileScale.value = s
    mobileLogicalHeight.value = Math.round((vh / s) * 100) / 100
  }
}

if (typeof window !== 'undefined') {
  updateStageMetrics()
}

let fitStage = null
let flipTimer = null

function flipPhone(targetFace) {
  const nextFace = targetFace || (phoneFace.value === 'front' ? 'back' : 'front')
  if (phoneFace.value === nextFace) return
  const turningToBack = nextFace === 'back'
  phoneFace.value = nextFace
  isFlipping.value = true
  clearTimeout(flipTimer)
  flipTimer = setTimeout(() => {
    isFlipping.value = false
  }, 1200)
  if (turningToBack && backScreen.settings.flipToWake) backScreen.isDisplayAwake = true
}

function handlePhoneFlipEvent(e) {
  const targetFace = e?.detail?.face
  flipPhone(targetFace)
}

watch(() => [system.screenOn, backScreen.settings.followMainDisplay], ([screenOn, followMainDisplay]) => {
  if (followMainDisplay) backScreen.isDisplayAwake = screenOn
}, { immediate: true })

onMounted(() => {
  fitStage = () => {
    updateStageMetrics()
  }
  fitStage()
  applyPreviewGeometry()
  reducedMotion?.addEventListener('change', syncReducedMotion)
  window.addEventListener('resize', fitStage)
  window.visualViewport?.addEventListener('resize', fitStage)
  window.addEventListener('tos-phone-flip', handlePhoneFlipEvent)
})

onBeforeUnmount(() => {
  if (flipTimer) clearTimeout(flipTimer)
  reducedMotion?.removeEventListener('change', syncReducedMotion)
  if (fitStage) {
    window.removeEventListener('resize', fitStage)
    window.visualViewport?.removeEventListener('resize', fitStage)
  }
  window.removeEventListener('tos-phone-flip', handlePhoneFlipEvent)
})

/* ================= 录屏 / 截图 ================= */
/* 录制状态与实现收敛到 useCapture 单例：控制台和控制中心共用同一份，
   保证「控制中心开始录屏 → 控制台点停止」能停止同一个录制任务。 */
const {
  isRecording,
  isTranscoding,
  isCapturing,
  recordElapsed,
  recordWithFrame,
  screenshotWithFrame,
  toasts,
  toggleRecording: runRecording,
  captureScreenshot: runScreenshot
} = useCapture()

/** 控制台：
 *  - 带壳录屏：连外壳 + 圆角裁切 + 转码 ProRes（演示素材管线）
 *  - 不带壳录屏：直出矩形 MP4，不做圆角裁切，不转码
 */
function toggleRecording() {
  const withFrame = !isMobile.value && recordWithFrame.value
  runRecording({
    withFrame,
    rounded: withFrame,
    transcode: withFrame,
    preferMp4: !withFrame
  })
}

/**
 * 控制台截图：带壳 = 连金属外壳一起截；不带壳 = 只截屏幕本体，
 * 且**不做圆角裁切**（四角为直角矩形）。移动端本来就没有外壳，一律按不带壳处理。
 */
function takeScreenshot() {
  const withFrame = !isMobile.value && screenshotWithFrame.value
  return runScreenshot({
    withFrame,
    rounded: withFrame
  })
}
</script>

<template>
  <div class="stage" :class="{ 'is-mobile': isMobile }" :data-preview-form="previewForm" ref="stageRef">
    <!-- 移动端：直接无外壳全屏满铺，基于 360px 标准宽度等比同步缩放所有 UI -->
    <div v-if="isMobile" class="mobile-screen-wrap">
      <div
        class="screen mobile-screen"
        :style="previewForm === 'slab' && !formMoving ? {
          width: `${BASE_SCREEN_W}px`,
          height: `${mobileLogicalHeight}px`,
          transform: `scale(${mobileScale})`,
          transformOrigin: 'top left'
        } : undefined"
      >
        <ScreenView />
      </div>
    </div>

    <!-- 桌面端：带金属外壳与等比居中缩放 -->
    <div v-else ref="phoneScaleRef" class="phone-scale">
      <div class="phone-turntable" :class="{ 'is-back': phoneFace === 'back', 'is-flipping': isFlipping }">
        <div class="phone-turntable-face phone-turntable-front">
          <PhoneFrame>
            <ScreenView />
          </PhoneFrame>
        </div>
        <div class="phone-turntable-face phone-turntable-back">
          <PhoneFrame face="back" :product-line="backScreen.productLine">
            <template #back>
              <div
                class="rear-display-scene"
                :class="[`page-${backScreen.activePage}`, `product-${backScreen.productLine}`, { 'is-off': !backScreen.isScreenOn }]"
                :style="backScreenProductStyle()"
                @dblclick="backScreen.isScreenOn && backScreen.settings.doubleTapToWake && backScreen.activePage === 'clock' && backScreen.clockFeature === 'clock' && (backScreen.isDisplayAwake = !backScreen.isDisplayAwake)"
              >
                <template v-if="backScreen.isScreenOn">
                  <template v-if="backScreen.activeGroup === 'active'">
                    <template v-if="backScreen.activePage === 'clock'">
                      <BackScreenClockWallpaper v-if="backScreen.clockFeature === 'clock' && backScreen.isDisplayAwake && backScreen.settings.dialStyle === '动态表盘'" :date="backDateLong" :time="backTimeShort" />
                      <div v-else-if="backScreen.clockFeature === 'clock' && backScreen.isDisplayAwake" class="rear-display-alt-dial" :class="`dial-${backScreen.settings.dialStyle === '简约表盘' ? 'minimal' : 'digital'}`">
                        <span>{{ backDateLong }}</span>
                        <strong>{{ backTimeShort }}</strong>
                        <small>{{ backScreen.settings.dialStyle }}</small>
                      </div>
                      <span v-else-if="backScreen.clockFeature === 'clock'" class="rear-display-sleep">双击背屏亮屏</span>
                      <div v-else class="rear-clock-subfeature-view">
                        <span class="rear-display-feature-value">{{ backScreen.clockFeature === 'alarm' ? '07:00' : formatBackDuration(backScreen.clockFeature === 'stopwatch' ? backScreen.stopwatchSeconds : backScreen.countdownSeconds) }}</span>
                        <span class="rear-display-subfeature">{{ backScreen.clockFeature === 'alarm' ? '闹钟 · 每天' : backScreen.clockFeature === 'stopwatch' ? (backScreen.isStopwatchRunning ? '计时中' : '计时器') : (backScreen.isCountdownRunning ? '倒计时中' : backScreen.countdownSeconds === 0 ? '倒计时结束' : '倒计时') }}</span>
                      </div>
                      <div class="rear-clock-feature-tabs" aria-label="时钟子功能">
                        <button v-for="feature in [{id:'alarm',label:'闹钟'},{id:'stopwatch',label:'计时器'},{id:'countdown',label:'倒计时'}]" :key="feature.id" type="button" :class="{active:backScreen.clockFeature===feature.id}" @click.stop="backScreen.clockFeature = (backScreen.clockFeature === feature.id ? 'clock' : feature.id); backScreen.isDisplayAwake = true">{{ feature.label }}</button>
                      </div>
                    </template>
                    <BackScreenWeather v-else-if="backScreen.activePage === 'weather'" />
                    <BackScreenCalendar v-else-if="backScreen.activePage === 'calendar'" :view="backScreen.calendarView" @update:view="backScreen.calendarView = $event" />
                    <BackScreenCamera v-else-if="backScreen.activePage === 'camera'" :mode="backScreen.cameraMode" @update:mode="backScreen.cameraMode = $event" />
                    <div v-else class="rear-music-display">
                      <div class="rear-music-album">
                        <span class="rear-display-album"><i></i></span>
                      </div>
                      <div class="rear-music-body">
                        <span class="rear-display-track">{{ backScreenTrack().title }}</span>
                        <span class="rear-display-hint">{{ backScreenTrack().artist }}</span>
                        <div class="rear-music-controls">
                          <button type="button" aria-label="上一首" @click.stop="selectRearMusicTrack(-1)">‹</button>
                          <button type="button" class="play" :aria-label="backScreen.isMusicPlaying ? '暂停' : '播放'" @click.stop="toggleRearMusic">{{ backScreen.isMusicPlaying ? 'Ⅱ' : '▶' }}</button>
                          <button type="button" aria-label="下一首" @click.stop="selectRearMusicTrack(1)">›</button>
                        </div>
                      </div>
                    </div>
                  </template>
                  <BackScreenPassiveDisplay v-else :mode="backScreen.passivePage" :call-status="backScreen.callStatus" :startup-run="backScreen.startupRun" @answer-call="backScreen.callStatus='connected'" @hang-up="backScreen.callStatus='ended'" />
                </template>
                <span v-else class="rear-display-off">背屏已关闭</span>
              </div>
            </template>
          </PhoneFrame>
        </div>
      </div>
      <button class="phone-flip-control" type="button" @click="flipPhone()" :aria-label="phoneFace === 'back' ? '返回手机正面' : '翻转到手机背面'">
        <span aria-hidden="true">⟲</span>{{ phoneFace === 'back' ? '返回正面' : '翻转手机' }}
      </button>
    </div>

    <!-- 控制台：桌面侧边栏 / 移动端悬浮球与抽屉 -->
    <DevConsole
      v-model:preview-form="previewForm"
      :mode="isMobile ? 'mobile' : 'desktop'"
      :is-recording="isRecording"
      :is-transcoding="isTranscoding"
      :is-capturing="isCapturing"
      v-model:record-with-frame="recordWithFrame"
      v-model:screenshot-with-frame="screenshotWithFrame"
      @toggle-recording="toggleRecording"
      @capture-screenshot="takeScreenshot"
    />

    <!-- 录制中指示器：红点 + 计时。
         位置刻意放在手机屏幕之外，所以不会被录进视频里。 -->
    <Transition name="rec">
      <div v-if="isRecording" class="rec-pill" role="status" aria-live="polite">
        <span class="rec-dot" />
        <span class="rec-time">{{ recordElapsed }}</span>
      </div>
    </Transition>

    <!-- 截图/录屏的结果提示：以前失败只写 console，界面毫无动静，
         看起来就是「点了没反应」。 -->
    <div class="toast-layer" aria-live="polite">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id" class="toast" :class="`is-${t.kind}`">
          {{ t.text }}
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.stage[data-preview-form] {
  gap: calc(48px + (clamp(16px, 2.5vw, 48px) - 48px) * var(--preview-progress, 0));
}

.stage .phone-scale {
  transform: scale(var(--preview-scale, 1));
  transition: none;
}

.stage .mobile-screen {
  position: absolute;
  top: var(--preview-top, 0px);
  left: var(--preview-left, 0px);
  width: var(--screen-w);
  height: var(--screen-h);
  transform: scale(var(--preview-scale, 1));
  transform-origin: top left;
  border-radius: calc(var(--screen-radius) * var(--preview-progress, 0)) !important;
  box-shadow: 0 0 0 calc(2px * var(--preview-progress, 0)) #535765;
}

.stage {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  background:
    radial-gradient(1200px 800px at 15% 15%, rgba(99, 102, 241, 0.18), transparent 60%),
    radial-gradient(1000px 700px at 85% 85%, rgba(59, 130, 246, 0.15), transparent 55%),
    linear-gradient(145deg, #111218 0%, #0a0b0e 100%);
}

.stage.is-mobile {
  width: 100vw;
  height: 100dvh;
  padding: 0;
  margin: 0;
  gap: 0;
  background: #000;
  overflow: hidden;
  position: fixed;
  inset: 0;
}

.mobile-screen-wrap {
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  background: #000;
}

.mobile-screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 0 !important;
  clip-path: none !important;
  overflow: hidden;
  background: #000;
  container-type: size;
}

.mobile-screen :deep(.screen-view) {
  border-radius: 0 !important;
  clip-path: none !important;
}

.phone-scale {
  position: relative;
  transform-origin: center center;
  transition: transform 0.2s ease;
  perspective: 1400px;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 6px;
  box-sizing: content-box;
  border-radius: calc(var(--screen-radius) + 16px);
}

.phone-flip-control {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: inline-flex;
  min-width: 104px;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 12px;
  border: 1px solid rgba(154, 174, 222, .28);
  border-radius: 999px;
  padding: 0 13px;
  color: #d9e2f4;
  background: rgba(20, 24, 35, .68);
  box-shadow: inset 0 .5px 0 rgba(255,255,255,.08), 0 4px 16px rgba(0,0,0,.2);
  font: 600 11px/1 var(--font-stack);
  cursor: pointer;
  transition: border-color .18s ease, background .18s ease, transform .18s ease;
}
.phone-flip-control:hover { border-color: rgba(154, 184, 245, .58); background: rgba(54, 75, 120, .42); }
.phone-flip-control:active { transform: translateX(-50%) translateY(1px); }
.phone-flip-control span { font-size: 15px; line-height: .8; }

.phone-turntable {
  position: relative;
  width: calc(var(--screen-w) + 20px);
  height: calc(var(--screen-h) + 20px);
  transition: transform 1.15s cubic-bezier(0.2, 0.78, 0.18, 1);
}

.phone-turntable.is-flipping {
  transform-style: preserve-3d;
  will-change: transform;
}

.phone-turntable.is-back {
  transform: rotateY(180deg);
  transform-style: preserve-3d;
}

.phone-turntable-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.phone-turntable-back {
  transform: rotateY(180deg);
  pointer-events: none;
}

.phone-turntable.is-back:not(.is-flipping) .phone-turntable-front {
  pointer-events: none;
}

.phone-turntable.is-back .phone-turntable-back {
  pointer-events: auto;
}

.rear-display-scene {
  position: absolute;
  inset: -1px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 0;
  color: #f7f9ff;
  background: radial-gradient(ellipse at 50% 28%, var(--product-glow, #263c66) 0%, var(--product-panel-a, #14213a) 44%, var(--product-panel-b, #0c111c) 100%);
  box-shadow: inset 0 0 28px rgba(140, 175, 239, 0.08), 0 0 28px rgba(44, 72, 126, 0.18);
}

.rear-display-orb,
.rear-display-ribbon { position: absolute; pointer-events: none; }
.rear-display-orb {
  width: 165px; height: 165px; top: -74px; left: calc(50% - 82px); border-radius: 50%;
  background: radial-gradient(circle at 38% 66%, var(--product-glow, rgba(116,167,255,.62)), rgba(76,116,198,.1) 62%, transparent 73%);
  animation: rear-orbit 1.8s ease-in-out infinite alternate;
}
.rear-display-ribbon {
  width: 180%; height: 70%; left: -40%; bottom: -44%; border-radius: 50% 50% 0 0;
  background: linear-gradient(170deg, rgba(101,137,202,.28), rgba(24,39,67,.9) 55%, #090e17);
  animation: rear-drift 1.3s ease-in-out infinite alternate;
}
.rear-display-date,.rear-display-time,.rear-display-hint { position: relative; z-index: 1; }
.rear-display-date { color:rgba(227,234,249,.8); font-size:8px; }
.rear-display-time { font-size:44px; font-weight:300; letter-spacing:-2px; line-height:1; font-variant-numeric:tabular-nums; }
.rear-display-hint { margin-top:2px; color:rgba(210,220,243,.65); font-size:7px; }
.rear-display-scene.is-off { background:#080a10; box-shadow:inset 0 0 26px rgba(0,0,0,.9); }
.rear-display-sleep,.rear-display-off { color:rgba(210,220,243,.78); font-size:10px; }
.rear-display-alt-dial { position:absolute; inset:0 0 24px 0; z-index:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; color:rgba(239,245,255,.9); }
.rear-display-alt-dial span { font-size:8px; opacity:.7; }
.rear-display-alt-dial strong { font-size:32px; line-height:1; font-weight:350; letter-spacing:-.05em; }
.rear-display-alt-dial small { margin-top:2px; color:rgba(221,232,250,.55); font-size:7.5px; }
.rear-display-alt-dial.dial-minimal { background:radial-gradient(ellipse at 50% 50%,rgba(103,154,220,.22),transparent 68%); }
.rear-display-alt-dial.dial-digital strong { font-variant-numeric:tabular-nums; font-weight:600; letter-spacing:.06em; }
.rear-clock-subfeature-view { position:absolute; inset:0 0 24px 0; z-index:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; }
.rear-display-feature-value { color:#f8fafc; font-size:34px; font-weight:300; letter-spacing:-1.5px; font-variant-numeric:tabular-nums; line-height:1; }
.rear-display-subfeature { color:rgba(210,220,243,.7); font-size:8px; margin-top:2px; }
.rear-clock-feature-tabs { position:absolute; z-index:4; right:4%; bottom:4%; left:4%; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:3px; }
.rear-clock-feature-tabs button { min-width:0; min-height:17px; border:1px solid rgba(213,228,255,.18); border-radius:6px; padding:0 2px; color:#d7e2f4; background:rgba(5,12,24,.64); font:600 6px/1 var(--font-stack); cursor:pointer; }
.rear-clock-feature-tabs button.active { border-color:rgba(102,169,255,.72); color:#fff; background:rgba(54,112,194,.58); }
.rear-music-display { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:14px; padding:10px 16px; }
.rear-music-album { flex:none; }
.rear-display-album { width:48px; height:48px; border-radius:12px; display:grid; place-items:center; background:linear-gradient(135deg,var(--product-accent,#d6b48a),var(--product-panel-a,#53687c) 55%,var(--product-panel-b,#222b3e)); box-shadow:0 4px 14px rgba(0,0,0,.35); }
.rear-display-album i { width:20px; height:20px; border-radius:50%; border:1px solid rgba(255,255,255,.7); background:rgba(0,0,0,.3); }
.rear-music-body { display:flex; flex-direction:column; gap:3px; min-width:0; }
.rear-display-track { font-size:13px; font-weight:600; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.rear-display-hint { font-size:9.5px; color:rgba(210,220,243,.75); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.rear-music-controls { display:flex; gap:8px; align-items:center; margin-top:4px; }
.rear-music-controls button { width:22px; height:22px; display:grid; place-items:center; border:0; border-radius:50%; color:#fff; background:rgba(255,255,255,.16); font-size:11px; cursor:pointer; }
.rear-music-controls button.play { width:26px; height:26px; background:rgba(255,255,255,.28); }

@keyframes rear-orbit { from { transform:translate(-20px,-4px) scale(.85) rotate(-8deg); } to { transform:translate(24px,18px) scale(1.14) rotate(9deg); } }
@keyframes rear-drift { from { transform:translate(-24px,14px) rotate(-18deg); } to { transform:translate(28px,-16px) rotate(5deg); } }

@media (prefers-reduced-motion: reduce) {
  .rear-display-orb, .rear-display-ribbon { animation-duration: 10s; }
}

/* ============ 录制中指示器 ============ */
.rec-pill {
  position: fixed;
  top: 18px;
  left: 50%;
  z-index: 9998;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px 7px 12px;
  border-radius: 999px;
  background: rgba(20, 20, 24, 0.72);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.35);
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.2px;
  pointer-events: none;
}

.rec-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #ff3b30;
  animation: rec-blink 1.4s ease-in-out infinite;
}

.rec-time {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

@keyframes rec-blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.82); }
}

.rec-enter-active { transition: all 0.42s cubic-bezier(0.34, 1.56, 0.64, 1); }
.rec-leave-active { transition: all 0.24s ease; }
.rec-enter-from { opacity: 0; transform: translate(-50%, -14px) scale(0.9); }
.rec-leave-to { opacity: 0; transform: translate(-50%, -8px) scale(0.96); }

/* ============ 结果提示 ============ */
.toast-layer {
  position: fixed;
  left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.toast {
  max-width: 78vw;
  padding: 10px 18px;
  border-radius: 14px;
  background: rgba(24, 24, 28, 0.86);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  color: #f2f2f7;
  font-size: 13.5px;
  line-height: 1.45;
  text-align: center;
}

.toast.is-success { color: #7bf0a8; }
.toast.is-error { color: #ff9d95; }

.toast-enter-active { transition: all 0.44s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.26s ease; position: absolute; }
.toast-enter-from { opacity: 0; transform: translateY(14px) scale(0.94); }
.toast-leave-to { opacity: 0; transform: translateY(6px) scale(0.97); }
.toast-move { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
</style>

<!-- 采集态（录屏/截图）：与移动端完全同一套处理 —— 把屏幕圆角归零。
     屏幕本体是圆角 + overflow:hidden，直接录它的外接矩形时，四个角会露出
     圆角外的黑色机身。移动端正是靠 border-radius:0 做到无边框满屏的，
     录/截时复用这个状态，四角自然就是壁纸，不需要任何后期修补。 -->
<style>
body.is-capturing .phone-frame,
body.is-capturing .frame-inner {
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

body.is-capturing .screen,
body.is-capturing .screen-view,
body.is-capturing .mobile-screen,
body.is-capturing .app-window,
body.is-capturing .aw-clip {
  border-radius: 0 !important;
  clip-path: none !important;
}

body.is-capturing .screen,
body.is-capturing .screen-view {
  overflow: visible !important;
}

body.is-capturing .wallpaper,
body.is-capturing .ls-wallpaper,
body.is-capturing .app-window {
  inset: -3px !important;
}

body.is-capturing .frame-inner::after,
body.is-capturing .punch-hole,
body.is-capturing .glass-sheen,
body.is-capturing .speaker-slit,
body.is-capturing .antenna-band,
body.is-capturing .side-btn {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  box-shadow: none !important;
}

body.is-capturing:has(.app-window) .wallpaper {
  opacity: 0 !important;
}

/* 带壳采集态：保留完整金属机身 3D 内倒角高光与侧边实体按键，
   仅剥离向机身外投射的黑色外阴影，配合轮廓透明抠图彻底消除四周黑底 */
body.is-capturing-frame .phone-frame {
  box-shadow:
    inset 0 0 0.5px 0.5px #121317,
    inset 0 0 1px 1.5px #262930,
    inset 0 0 1.5px 2.5px #4a4f5c,
    inset 0 0 1px 3.2px #606775,
    inset 0 0 1.5px 4.2px #22242a,
    inset 0 0 0.5px 5px #07080a,
    inset 0 1px 1px rgba(255, 255, 255, 0.22),
    inset 1px 0 1px rgba(255, 255, 255, 0.15),
    inset 0 -1px 1px rgba(0, 0, 0, 0.7) !important;
}

body.is-capturing-frame .action-btn,
body.is-capturing-frame .volume-up,
body.is-capturing-frame .volume-down,
body.is-capturing-frame .power,
body.is-capturing-frame .camera-control {
  box-shadow:
    inset 0 0.5px 0.5px rgba(255, 255, 255, 0.3),
    inset 0 -0.5px 0.5px rgba(0, 0, 0, 0.8) !important;
}
</style>
