<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { BACK_SCREEN_PRODUCT_LINES, BACK_SCREEN_TRACKS, useBackScreenStore } from '../../stores/backScreenStore'
import BackScreenWeather from './BackScreenWeather.vue'
import BackScreenClockWallpaper from './BackScreenClockWallpaper.vue'
import BackScreenPassiveDisplay from './BackScreenPassiveDisplay.vue'
import BackScreenCalendar from './BackScreenCalendar.vue'
import BackScreenCamera from './BackScreenCamera.vue'

const backScreen = useBackScreenStore()
const { isScreenOn, isDisplayAwake, activeGroup, activePage, calendarView, cameraMode, passivePage, callStatus, startupRun, productLine, clockFeature, stopwatchSeconds, countdownSeconds, isStopwatchRunning, isCountdownRunning, musicTrackIndex, isMusicPlaying } = storeToRefs(backScreen)
const now = ref(new Date())
const touchCount = ref(0)

const pages = [
  { id: 'clock', label: '时钟' },
  { id: 'weather', label: '天气' },
  { id: 'music', label: '音乐' },
  { id: 'calendar', label: '日历' },
  { id: 'camera', label: '相机' }
]

const currentPage = computed(() => pages.find((page) => page.id === activePage.value) || pages[0])
const currentTrack = computed(() => BACK_SCREEN_TRACKS[musicTrackIndex.value] || BACK_SCREEN_TRACKS[0])
const currentProductLine = computed(() => BACK_SCREEN_PRODUCT_LINES.find((item) => item.id === productLine.value) || BACK_SCREEN_PRODUCT_LINES.at(-1))
const previewStyle = computed(() => ({ ...currentProductLine.value.theme, filter: `brightness(${0.4 + Number(backScreen.settings.backlightLevel.replace('等级 ', '')) * 0.12})` }))
const clockFeatures = [
  { id: 'alarm', label: '闹钟' },
  { id: 'stopwatch', label: '计时器' },
  { id: 'countdown', label: '倒计时' }
]

const clockValue = computed(() => {
  if (clockFeature.value === 'alarm') return '07:00'
  if (clockFeature.value === 'stopwatch') return formatDuration(stopwatchSeconds.value)
  if (clockFeature.value === 'countdown') return formatDuration(countdownSeconds.value)
  return '10:08'
})

const clockCaption = computed(() => {
  if (clockFeature.value === 'alarm') return '每天 · 07:00'
  if (clockFeature.value === 'stopwatch') return '计时器'
  if (clockFeature.value === 'countdown') return countdownSeconds.value === 0 ? '倒计时结束' : '倒计时'
  return '星期二 · 11月10日'
})

let stopwatchInterval = null
let countdownInterval = null
let clockInterval = null

const defaultClockTime = computed(() => now.value.toLocaleTimeString('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}))
const defaultClockDate = computed(() => now.value.toLocaleDateString('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long'
}))

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function selectClockFeature(id) {
  if (!isScreenOn.value) return
  isDisplayAwake.value = true
  clockFeature.value = id
  touchCount.value += 1
}

function toggleDisplayAwake() {
  if (!isScreenOn.value || !backScreen.settings.doubleTapToWake || activePage.value !== 'clock' || clockFeature.value !== 'clock') return
  isDisplayAwake.value = !isDisplayAwake.value
  touchCount.value += 1
}

function toggleStopwatch() {
  touchCount.value += 1
  isStopwatchRunning.value = !isStopwatchRunning.value
  if (stopwatchInterval) clearInterval(stopwatchInterval)
  stopwatchInterval = isStopwatchRunning.value
    ? window.setInterval(() => { stopwatchSeconds.value += 1 }, 1000)
    : null
}

function resetStopwatch() {
  touchCount.value += 1
  isStopwatchRunning.value = false
  if (stopwatchInterval) clearInterval(stopwatchInterval)
  stopwatchInterval = null
  stopwatchSeconds.value = 0
}

function toggleCountdown() {
  touchCount.value += 1
  if (isCountdownRunning.value) {
    isCountdownRunning.value = false
    if (countdownInterval) clearInterval(countdownInterval)
    countdownInterval = null
    return
  }
  if (countdownSeconds.value === 0) countdownSeconds.value = 300
  isCountdownRunning.value = true
  countdownInterval = window.setInterval(() => {
    if (countdownSeconds.value <= 1) {
      countdownSeconds.value = 0
      isCountdownRunning.value = false
      clearInterval(countdownInterval)
      countdownInterval = null
      return
    }
    countdownSeconds.value -= 1
  }, 1000)
}

function resetCountdown() {
  touchCount.value += 1
  isCountdownRunning.value = false
  if (countdownInterval) clearInterval(countdownInterval)
  countdownInterval = null
  countdownSeconds.value = 300
}

function selectMusicTrack(direction) {
  if (!isScreenOn.value) return
  musicTrackIndex.value = (musicTrackIndex.value + direction + BACK_SCREEN_TRACKS.length) % BACK_SCREEN_TRACKS.length
  touchCount.value += 1
}

function toggleMusic() {
  if (!isScreenOn.value) return
  isMusicPlaying.value = !isMusicPlaying.value
  touchCount.value += 1
}

function selectPassiveFeature(id) {
  if (!isScreenOn.value) return
  if (id === 'call' && !backScreen.settings.callHintEnabled) return
  if (id === 'notification' && !backScreen.settings.notificationHintEnabled) return
  activeGroup.value = 'passive'
  passivePage.value = id
  if (id === 'call') callStatus.value = 'ringing'
  if (id === 'startup') startupRun.value += 1
  touchCount.value += 1
}

function answerCall() { callStatus.value = 'connected'; touchCount.value += 1 }
function hangUpCall() { callStatus.value = 'ended'; touchCount.value += 1 }

function selectPage(id) {
  if (!isScreenOn.value) return
  if (id === 'music' && !backScreen.settings.musicEnabled) return
  activeGroup.value = 'active'
  activePage.value = id
  if (id === 'clock') {
    clockFeature.value = 'clock'
    isDisplayAwake.value = true
  }
}

watch(() => backScreen.settings.musicEnabled, (enabled) => {
  if (!enabled && activeGroup.value === 'active' && activePage.value === 'music') {
    activePage.value = 'clock'
    clockFeature.value = 'clock'
  }
}, { immediate: true })
watch(() => backScreen.settings.callHintEnabled, (enabled) => {
  if (!enabled && activeGroup.value === 'passive' && passivePage.value === 'call') activeGroup.value = 'active'
}, { immediate: true })
watch(() => backScreen.settings.notificationHintEnabled, (enabled) => {
  if (!enabled && activeGroup.value === 'passive' && passivePage.value === 'notification') activeGroup.value = 'active'
}, { immediate: true })

onBeforeUnmount(() => {
  if (clockInterval) clearInterval(clockInterval)
  if (stopwatchInterval) clearInterval(stopwatchInterval)
  if (countdownInterval) clearInterval(countdownInterval)
})

clockInterval = window.setInterval(() => { now.value = new Date() }, 1000)
</script>

<template>
  <div class="pc-module-section-group is-backscreen">
    <div class="pc-section back-screen-section">
      <div class="back-screen-product-picker">
        <label for="back-screen-product-line">产品线</label>
        <select id="back-screen-product-line" v-model="productLine" aria-label="背屏产品线">
          <option v-for="item in BACK_SCREEN_PRODUCT_LINES" :key="item.id" :value="item.id">{{ item.label }}</option>
        </select>
      </div>

      <div class="back-screen-preview" :class="[`page-${activePage}`, `product-${productLine}`, { 'is-off': !isScreenOn }]" :style="previewStyle">
        <template v-if="isScreenOn">
          <template v-if="activeGroup === 'active'">
            <div v-if="activePage === 'clock'" class="clock-page-content">
              <BackScreenClockWallpaper v-if="clockFeature === 'clock' && isDisplayAwake && backScreen.settings.dialStyle === '动态表盘'" :date="defaultClockDate" :time="defaultClockTime" />
              <div v-else-if="clockFeature === 'clock' && isDisplayAwake" class="back-screen-alternate-dial" :class="`dial-${backScreen.settings.dialStyle === '简约表盘' ? 'minimal' : 'digital'}`">
                <span>{{ defaultClockDate }}</span><strong>{{ defaultClockTime }}</strong><small>{{ backScreen.settings.dialStyle }}</small>
              </div>
              <div v-else-if="clockFeature === 'clock'" class="back-screen-sleep-state" @dblclick.stop.prevent="toggleDisplayAwake"><span class="sleep-indicator"></span><span>双击背屏亮屏</span></div>
              <div v-else class="clock-feature-content">
                <span class="clock-feature-value">{{ clockValue }}</span><span class="clock-feature-caption">{{ clockCaption }}</span>
                <div v-if="clockFeature === 'stopwatch'" class="clock-feature-controls">
                  <button class="clock-control-button primary" type="button" @click.stop="toggleStopwatch">{{ isStopwatchRunning ? '暂停' : '开始' }}</button>
                  <button class="clock-control-button" type="button" @click.stop="resetStopwatch">重置</button>
                </div>
                <div v-else-if="clockFeature === 'countdown'" class="clock-feature-controls">
                  <button class="clock-control-button primary" type="button" @click.stop="toggleCountdown">{{ isCountdownRunning ? '暂停' : countdownSeconds === 0 ? '再来一次' : '开始' }}</button>
                  <button class="clock-control-button" type="button" @click.stop="resetCountdown">重置</button>
                </div>
              </div>
              <div class="clock-feature-tabs" aria-label="时钟子功能">
                <button v-for="feature in clockFeatures" :key="feature.id" type="button" :class="{ active: clockFeature === feature.id }" @click.stop="selectClockFeature(feature.id)">{{ feature.label }}</button>
              </div>
            </div>

            <BackScreenWeather v-else-if="activePage === 'weather'" />

            <BackScreenCalendar v-else-if="activePage === 'calendar'" :view="calendarView" @update:view="calendarView = $event" />

            <BackScreenCamera v-else-if="activePage === 'camera'" :mode="cameraMode" @update:mode="cameraMode = $event" />

            <div v-else class="back-screen-page-content music-page-content" role="group" aria-label="音乐预览">
              <span class="back-screen-album" aria-hidden="true"><span></span></span>
              <span class="back-screen-track">{{ currentTrack.title }}</span>
              <span class="back-screen-detail">{{ currentTrack.artist }}</span>
              <span class="back-screen-progress"><i :class="{ playing: isMusicPlaying }"></i></span>
              <div class="music-controls" aria-label="音乐控制">
                <button type="button" aria-label="上一首" title="上一首" @click.stop="selectMusicTrack(-1)">‹</button>
                <button type="button" class="music-play-button" :aria-label="isMusicPlaying ? '暂停' : '播放'" :title="isMusicPlaying ? '暂停' : '播放'" @click.stop="toggleMusic">{{ isMusicPlaying ? 'Ⅱ' : '▶' }}</button>
                <button type="button" aria-label="下一首" title="下一首" @click.stop="selectMusicTrack(1)">›</button>
              </div>
              <span class="back-screen-page-label">音乐 · {{ isMusicPlaying ? '正在播放' : '已暂停' }}</span>
            </div>
          </template>
          <BackScreenPassiveDisplay v-else :mode="passivePage" :call-status="callStatus" :startup-run="startupRun" @answer-call="answerCall" @hang-up="hangUpCall" />
        </template>
        <span v-else class="back-screen-off-label">背屏已关闭</span>
      </div>

      <div class="back-screen-feature-groups">
        <section class="back-screen-feature-group" aria-label="主动功能">
          <span class="back-screen-group-title">主动功能</span>
          <div class="back-screen-pages">
              <button v-for="page in pages" :key="page.id" type="button" :class="{ active: activeGroup === 'active' && activePage === page.id }" :disabled="!isScreenOn || (page.id === 'music' && !backScreen.settings.musicEnabled)" @click="selectPage(page.id)">{{ page.label }}</button>
          </div>
        </section>
        <section class="back-screen-feature-group" aria-label="被动功能">
          <span class="back-screen-group-title">被动功能</span>
          <div class="back-screen-pages">
            <button v-for="feature in [{id:'call',label:'来电'},{id:'notification',label:'通知'},{id:'startup',label:'开机'}]" :key="feature.id" type="button" :class="{ active: activeGroup === 'passive' && passivePage === feature.id }" :disabled="!isScreenOn || (feature.id === 'call' && !backScreen.settings.callHintEnabled) || (feature.id === 'notification' && !backScreen.settings.notificationHintEnabled)" @click="selectPassiveFeature(feature.id)">{{ feature.label }}</button>
          </div>
        </section>
      </div>

      <div class="back-screen-touch-count" role="status" aria-live="polite"><span>触控响应</span><strong>{{ touchCount }} 次</strong></div>
    </div>
  </div>
</template>

<style scoped>
.back-screen-section {
  gap: 12px;
}

.back-screen-product-picker { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:0; margin-bottom:10px; }
.back-screen-product-picker label { color:#aeb3c0; font-size:10px; font-weight:600; }
.back-screen-product-picker select { width:calc(100% - 58px); min-height:30px; border:1px solid rgba(149,176,232,.2); border-radius:9px; padding:0 10px; color:#f0f3fb; background:#191a23; font:600 10px/1 var(--font-stack); outline:none; }
.back-screen-product-picker select:focus-visible { border-color:rgba(105,151,255,.7); box-shadow:0 0 0 2px rgba(79,130,244,.16); }

.back-screen-feature-groups { display:flex; flex-direction:column; gap:9px; }
.back-screen-feature-group { display:flex; flex-direction:column; gap:5px; }
.back-screen-group-title { color:#b8c2d5; font-size:10px; font-weight:650; letter-spacing:.04em; }

.back-screen-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 231 / 142;
  overflow: hidden;
  border: 1px solid rgba(205, 220, 248, 0.31);
  border-radius: 17px;
  color: #f8fafc;
  background:
    radial-gradient(ellipse at 50% 28%, var(--product-glow, #263c66) 0%, var(--product-panel-a, #14213a) 44%, var(--product-panel-b, #0c111c) 100%);
  box-shadow: inset 0 0 28px rgba(140, 175, 239, 0.08), 0 10px 26px rgba(0, 0, 0, 0.24);
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.18s ease;
}

.back-screen-preview.page-weather {
  background:linear-gradient(155deg, var(--product-panel-a, #26344a), var(--product-panel-b, #101722) 82%);
}

.back-screen-preview.page-music {
  background:linear-gradient(155deg, var(--product-panel-a, #2b2035), var(--product-panel-b, #14121b) 82%);
}

.back-screen-preview.is-off {
  border-color: #303039;
  background: #080a10;
  box-shadow: inset 0 0 26px rgba(0,0,0,.9);
  cursor: default;
}

.back-screen-sleep-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: rgba(225, 233, 250, 0.72);
  background: radial-gradient(ellipse at 50% 80%, rgba(51, 76, 122, 0.12), transparent 62%);
  font-size: 10px;
  cursor: pointer;
}

.sleep-indicator {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #7995db;
  box-shadow: 0 0 10px rgba(121, 149, 219, 0.6);
}

.clock-page-content {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.clock-feature-content {
  position: absolute;
  inset: 0 0 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.back-screen-alternate-dial {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: rgba(239, 245, 255, .9);
}
.back-screen-alternate-dial span { font-size: 9px; opacity: .7; }
.back-screen-alternate-dial strong { font-size: clamp(32px, 11cqh, 58px); line-height: 1; font-weight: 350; letter-spacing: -.05em; }
.back-screen-alternate-dial small { margin-top: 4px; color: rgba(221, 232, 250, .55); font-size: 8px; }
.back-screen-alternate-dial.dial-minimal { background:radial-gradient(ellipse at 50% 50%, rgba(103,154,220,.22), transparent 68%); }
.back-screen-alternate-dial.dial-digital strong { font-variant-numeric:tabular-nums; font-weight:600; letter-spacing:.06em; }

.default-clock-content {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
}

.default-clock-date {
  color: rgba(222, 230, 247, 0.82);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.25px;
}

.default-clock-time {
  color: #fff;
  font-size: 39px;
  font-weight: 250;
  letter-spacing: -2px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 3px 24px rgba(12, 21, 45, 0.3);
}

.default-clock-hint {
  margin-top: 6px;
  color: rgba(210, 220, 243, 0.66);
  font-size: 8px;
  letter-spacing: 0.2px;
}

.clock-wallpaper-scene {
  position: absolute;
  z-index: -1;
  inset: -28px -20px;
  overflow: hidden;
  background:radial-gradient(ellipse at 50% 38%, var(--product-glow, rgba(37, 67, 119, 0.66)), transparent 56%),
    linear-gradient(160deg, var(--product-panel-a, #182945) 4%, var(--product-panel-b, #101c32) 62%, #10131f 100%);
}

.wallpaper-orb,
.wallpaper-ribbon,
.wallpaper-grain {
  position: absolute;
  display: block;
  pointer-events: none;
}

.wallpaper-orb {
  border: 1px solid rgba(191, 213, 255, 0.18);
  border-radius: 50%;
  filter: blur(0.2px);
}

.orb-a {
  width: 172px;
  height: 172px;
  top: -74px;
  left: calc(50% - 86px);
  background: radial-gradient(circle at 38% 66%, var(--product-glow, rgba(116, 167, 255, 0.52)), rgba(76, 116, 198, 0.16) 50%, transparent 72%);
  box-shadow: 0 0 38px rgba(87, 138, 228, 0.22), inset 0 -9px 22px rgba(166, 196, 255, 0.13);
  animation: wallpaper-orbit 0.9s ease-in-out infinite alternate;
}

.orb-b {
  width: 112px;
  height: 112px;
  top: 25%;
  left: calc(50% - 56px);
  border-color: rgba(180, 204, 249, 0.11);
  background: radial-gradient(circle at 35% 28%, rgba(109, 151, 231, 0.2), transparent 70%);
  animation: wallpaper-orbit 0.5s ease-in-out infinite alternate-reverse;
}

.wallpaper-ribbon {
  width: 172%;
  height: 74%;
  left: -36%;
  bottom: -43%;
  border: 1px solid rgba(165, 194, 247, 0.12);
  border-radius: 50% 50% 0 0;
  background: linear-gradient(170deg, rgba(101, 137, 202, 0.2), rgba(24, 39, 67, 0.8) 52%, rgba(10, 15, 26, 0.94));
  box-shadow: inset 0 10px 26px rgba(155, 185, 239, 0.08), 0 -8px 26px rgba(94, 132, 204, 0.08);
}

.ribbon-a { transform: rotate(-12deg); animation: wallpaper-drift 1.1s ease-in-out infinite alternate; }
.ribbon-b { bottom: -49%; background: linear-gradient(165deg, rgba(72, 96, 145, 0.3), rgba(17, 25, 42, 0.82) 58%); transform: rotate(14deg); animation: wallpaper-drift 1.3s ease-in-out infinite alternate-reverse; }

.wallpaper-grain {
  inset: 0;
  opacity: 0.12;
  background-image: radial-gradient(rgba(255,255,255,.56) .45px, transparent .6px);
  background-size: 5px 5px;
  mix-blend-mode: soft-light;
}

@keyframes wallpaper-orbit {
  from { transform: translate3d(-25px, -7px, 0) scale(.82) rotate(-8deg); }
  to { transform: translate3d(27px, 15px, 0) scale(1.13) rotate(9deg); }
}

@keyframes wallpaper-drift {
  from { transform: translate3d(-28px, 15px, 0) rotate(-20deg) scale(.94); }
  to { transform: translate3d(30px, -18px, 0) rotate(5deg) scale(1.08); }
}

.clock-feature-value {
  color: #f8fafc;
  font-size: 38px;
  font-weight: 300;
  letter-spacing: -1.8px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.clock-feature-caption {
  min-height: 12px;
  color: #bac5da;
  font-size: 9px;
  line-height: 1.25;
}

.clock-feature-controls {
  display: flex;
  min-height: 22px;
  justify-content: center;
  gap: 6px;
  margin-top: 2px;
}

.clock-control-button {
  min-width: 50px;
  min-height: 22px;
  border: 1px solid rgba(207, 218, 240, 0.18);
  border-radius: 7px;
  padding: 0 9px;
  color: #d6dced;
  background: rgba(255, 255, 255, 0.07);
  font: 600 9px/1 var(--font-stack);
  cursor: pointer;
}

.clock-control-button.primary {
  border-color: rgba(129, 159, 255, 0.54);
  color: #fff;
  background: rgba(82, 112, 225, 0.45);
}

.clock-feature-tabs {
  position: absolute;
  z-index: 4;
  right: 4%;
  bottom: 4%;
  left: 4%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}

.clock-feature-tabs button {
  min-width: 0;
  min-height: 18px;
  border: 1px solid rgba(213, 228, 255, 0.18);
  border-radius: 6px;
  padding: 0 2px;
  color: #d7e2f4;
  background: rgba(5, 12, 24, 0.64);
  font: 600 8px/1 var(--font-stack);
  cursor: pointer;
  transition: 0.18s ease;
}

.clock-feature-tabs button.active {
  border-color: rgba(102, 169, 255, 0.72);
  color: #fff;
  background: rgba(54, 112, 194, 0.58);
}

.back-screen-page-content {
  position: absolute;
  inset: 0;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: inherit;
  padding: 8px 10px;
  color: inherit;
  background: transparent;
  cursor: pointer;
  transition: transform 0.18s ease;
}

.back-screen-page-content:active {
  transform: scale(0.985);
}

.music-page-content { gap: 2px; }
.music-controls { display:flex; align-items:center; justify-content:center; gap:12px; margin-top:4px; }
.music-controls button { display:grid; width:22px; height:22px; place-items:center; border:0; border-radius:50%; color:#eff3ff; background:rgba(255,255,255,.13); font:600 12px/1 var(--font-stack); cursor:pointer; }
.music-controls .music-play-button { width:26px; height:26px; border:1px solid rgba(255,255,255,.5); background:rgba(255,255,255,.22); font-size:10px; }

.back-screen-off-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #73737e;
  font-size: 11px;
}

.back-screen-pages {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.back-screen-pages button {
  min-height: 30px;
  border: 1px solid #30303a;
  border-radius: 9px;
  color: #a8a8b2;
  background: #17171d;
  padding: 0 3px;
  font: 600 9px/1 var(--font-stack);
  cursor: pointer;
  transition: 0.2s ease;
}

.back-screen-pages button.active {
  border-color: rgba(59, 130, 246, 0.68);
  color: #fff;
  background: rgba(37, 99, 235, 0.32);
}

.back-screen-pages button:disabled {
  opacity: 0.45;
  cursor: default;
}

.back-screen-touch-count {
  display: flex;
  justify-content: space-between;
  color: #858590;
  font-size: 10px;
}

.back-screen-touch-count strong {
  color: #cbd5e1;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
