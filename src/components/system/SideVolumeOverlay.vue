<script setup>
/**
 * 侧边音量浮层：实体音量键 / 侧栏唤起，四种形态。
 *   expanded → 展开条（50×224，含「更多」与「按应用」两个入口）
 *   compact  → 收起成 10px 细条，音量键继续按时做弹跳
 *   panel    → 系统音量面板（媒体/铃声/通知/闹钟/语音助手 五轨）
 *   media    → 按应用媒体音量面板
 *
 * 相对原型的适配（见 docs/tos-feature-integration-plan.html）：
 *   1. 文案全部走 locales/volume.js（zh/en/bn），不再硬编码中文；
 *   2. 媒体品牌图标改用仓库现成的 NotificationIcon（它同时支持 PNG 与内联 SVG，
 *      而 NOTIF_ICONS 在本仓库已整体换成 PNG 资源）；
 *   3. z-index 走 tokens 刻度，不再写 124/125/126 这类散值。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useControlStore } from '../../stores/controlStore'
import { useSystemStore } from '../../stores/systemStore'
import { useI18nStore } from '../../stores/i18nStore'
import { VOLUME_LABELS } from '../../locales/volume.js'
import LIcon from '../ui/LIcon.vue'
import NotificationIcon from '../ui/NotificationIcon.vue'
import { NOTIF_ICONS } from '../ui/notifIcons'

const control = useControlStore()
const system = useSystemStore()
const i18n = useI18nStore()
const vLabel = (k) => VOLUME_LABELS[i18n.locale]?.[k] ?? VOLUME_LABELS.zh[k] ?? k

let lifecycleTimer = null
let plusValueTimer = null
let customGuideTimer = null
let appMuteGuideTimer = null
let sliderActive = false
const anchorHandoff = ref(false)
const showTopPlusValue = ref(false)
const showCustomGuide = ref(false)
const showAppMuteGuide = ref(false)
let customGuideSeen = false

const expanded = computed(() => control.sideVolumeMode === 'expanded')
const compact = computed(() => control.sideVolumeMode === 'compact')
const modalOpen = computed(() => control.sideVolumeMode === 'panel' || control.sideVolumeMode === 'media')
const isMedia = computed(() => control.sideVolumeMode === 'media')
const volumePct = computed(() => control.volumePlusLevel ? 100 : control.volume * 100)
const volumeDisplayPct = computed(() => control.volumePlusLevel ? control.volumePlusLevel * 100 : Math.round(control.volume * 100))
const modalTitle = computed(() => isMedia.value ? vLabel('mediaVolume') : vLabel('channels')[control.sideVolumeChannel])

function scheduleLifecycle() {
  clearTimeout(lifecycleTimer)
  if (sliderActive) return
  const mode = control.sideVolumeMode
  if (mode === 'expanded') lifecycleTimer = window.setTimeout(() => control.closeSideVolume(), 5000)
  else if (mode === 'compact' || mode === 'panel' || mode === 'media') {
    lifecycleTimer = window.setTimeout(() => control.closeSideVolume(), mode === 'compact' ? 3000 : 5000)
  }
}

watch(() => control.sideVolumePulse, scheduleLifecycle)
watch(() => control.sideVolumeMode, (mode) => {
  clearTimeout(lifecycleTimer)
  if (mode !== 'hidden') scheduleLifecycle()
  clearTimeout(customGuideTimer)
  if (mode === 'expanded' && !customGuideSeen) {
    customGuideSeen = true
    showCustomGuide.value = true
    customGuideTimer = window.setTimeout(() => { showCustomGuide.value = false }, 3000)
  } else if (mode !== 'expanded') showCustomGuide.value = false
})
watch(
  () => [control.volumePlusLevel, control.sideVolumeMode, control.sideVolumePulse],
  () => {
    clearTimeout(plusValueTimer)
    if (control.sideVolumeMode === 'expanded' && control.volumePlusLevel) {
      showTopPlusValue.value = true
      plusValueTimer = window.setTimeout(() => { showTopPlusValue.value = false }, 2000)
    } else showTopPlusValue.value = false
  }
)
watch(() => control.currentAppMuteGuideSeq, () => {
  clearTimeout(appMuteGuideTimer)
  showAppMuteGuide.value = true
  appMuteGuideTimer = window.setTimeout(() => { showAppMuteGuide.value = false }, 3000)
})
/* 控制中心一展开就收起侧栏，避免两层浮层叠在一起 */
watch(() => system.overlays.controlCenter.status, (status) => {
  if (status !== 'closed' && control.sideVolumeMode !== 'hidden') control.closeSideVolume()
})
onBeforeUnmount(() => {
  clearTimeout(lifecycleTimer)
  clearTimeout(plusValueTimer)
  clearTimeout(customGuideTimer)
  clearTimeout(appMuteGuideTimer)
})

function setFromPointer(event, setter) {
  event.preventDefault()
  event.stopPropagation()
  sliderActive = true
  clearTimeout(lifecycleTimer)
  const track = event.currentTarget
  const update = (e) => {
    const rect = track.getBoundingClientRect()
    setter(Math.min(1, Math.max(0, (rect.bottom - e.clientY) / rect.height)))
  }
  update(event)
  const stop = () => {
    sliderActive = false
    control.touchSideVolume()
    window.removeEventListener('pointermove', update)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
  }
  window.addEventListener('pointermove', update)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
}

const systemSliders = computed(() => [
  { key: 'media', icon: 'volume2', mutedIcon: 'volumeX', value: control.volume, main: true },
  { key: 'ring', icon: 'bell', mutedIcon: 'bellOff', value: control.auxiliaryVolumes.ring },
  { key: 'notification', icon: 'bellDot', mutedIcon: 'bellDotOff', value: control.auxiliaryVolumes.notification },
  { key: 'alarm', icon: 'alarmClock', mutedIcon: 'alarmClockOff', value: control.auxiliaryVolumes.alarm },
  { key: 'microphone', icon: 'mic', mutedIcon: 'micOff', value: control.auxiliaryVolumes.microphone }
])

/* app 指向 NOTIF_ICONS 的键；store 的按应用音量键沿用 mediaVolumes 里的 play/spotify/tiktok/video */
const mediaSliders = computed(() => [
  { key: 'system', system: true, icon: 'volume2', value: control.volume },
  { key: 'play', app: 'youtube', value: control.mediaVolumes.play },
  { key: 'spotify', app: 'spotify', value: control.mediaVolumes.spotify },
  { key: 'tiktok', app: 'tiktok', value: control.mediaVolumes.tiktok },
  { key: 'video', app: 'default', value: control.mediaVolumes.video }
])

function setSystem(item, value) {
  if (item.main) control.setVolume(value)
  else control.setAuxiliaryVolume(item.key, value)
}

function beginSystemPointer(event, item) {
  control.selectSideVolumeChannel(item.key)
  setFromPointer(event, value => setSystem(item, value))
}

function setMedia(item, value) {
  if (item.system) control.setVolume(value)
  else control.setMediaVolume(item.key, value)
}

async function openAnchoredPanel(mode) {
  anchorHandoff.value = true
  await nextTick()
  control.openSideVolumePanel(mode)
  window.setTimeout(() => { anchorHandoff.value = false }, 420)
}

const appMuteName = computed(() => NOTIF_ICONS?.youtube ? 'YouTube' : '')
</script>

<template>
  <div v-if="expanded || compact" class="sv-dismiss-layer" @click="control.closeSideVolume()"></div>
  <Transition name="side-volume">
    <div v-if="expanded || compact" class="side-volume-wrap" :class="{ compact, 'anchor-handoff': anchorHandoff }" data-testid="side-volume">
      <button
        v-if="expanded"
        class="sv-more"
        :class="{ inverted: volumePct > 78 && !showTopPlusValue, 'showing-value': showTopPlusValue }"
        :aria-label="vLabel('moreVolume')"
        data-testid="side-volume-more"
        @click="openAnchoredPanel('panel')"
      >{{ showTopPlusValue ? volumeDisplayPct + '%' : '•••' }}</button>
      <div
        :key="'side-volume-track-' + control.sideVolumeBounceSeq"
        class="sv-track glass"
        :class="{
          'is-plus': control.volumePlusLevel,
          ['plus-' + control.volumePlusLevel * 100]: control.volumePlusLevel,
          'bounce-up': compact && control.sideVolumeBounceDirection === 'up' && control.sideVolumeBounceSeq,
          'bounce-down': compact && control.sideVolumeBounceDirection === 'down' && control.sideVolumeBounceSeq
        }"
        :aria-hidden="compact"
        @pointerdown="expanded && setFromPointer($event, value => control.setVolume(value))"
      >
        <div class="sv-fill" :style="{ height: volumePct + '%' }"></div>
        <div v-if="control.volumePlusLevel" class="sv-side-plus-gradient"></div>
        <LIcon class="sv-speaker" :name="control.volume === 0 ? 'volumeX' : 'volume2'" :size="22" :stroke-width="2.2" />
      </div>
      <button v-if="expanded" class="sv-custom glass" :aria-label="vLabel('customMediaVolume')" data-testid="side-volume-custom" @click="openAnchoredPanel('media')">
        <LIcon name="slidersHorizontal" :size="20" :stroke-width="2.2" />
      </button>
      <Transition name="custom-guide">
        <div v-if="expanded && showCustomGuide && !showAppMuteGuide" class="sv-custom-guide" data-testid="side-volume-custom-guide">
          <i class="sv-guide-blur" aria-hidden="true"></i>
          <svg class="sv-guide-shape" viewBox="0 0 142 36" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="guide-glass-a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7a9ab5" stop-opacity=".68"/><stop offset="1" stop-color="#5d809e" stop-opacity=".55"/></linearGradient></defs>
            <path d="M31 1H124Q141 1 141 18Q141 35 124 35H31Q15 35 15 25L6 18L15 11Q15 1 31 1Z" fill="url(#guide-glass-a)" stroke="rgba(255,255,255,.34)" stroke-linejoin="round"/>
          </svg>
          <span>{{ vLabel('byAppGuide') }}</span>
        </div>
      </Transition>
      <Transition name="custom-guide">
        <div v-if="expanded && showAppMuteGuide" class="sv-custom-guide" data-testid="current-app-mute-guide">
          <i class="sv-guide-blur" aria-hidden="true"></i>
          <svg class="sv-guide-shape" viewBox="0 0 142 36" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="guide-glass-b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7a9ab5" stop-opacity=".68"/><stop offset="1" stop-color="#5d809e" stop-opacity=".55"/></linearGradient></defs>
            <path d="M31 1H124Q141 1 141 18Q141 35 124 35H31Q15 35 15 25L6 18L15 11Q15 1 31 1Z" fill="url(#guide-glass-b)" stroke="rgba(255,255,255,.34)" stroke-linejoin="round"/>
          </svg>
          <span>{{ vLabel('appMuted')(appMuteName) }}</span>
        </div>
      </Transition>
    </div>
  </Transition>

  <Transition name="volume-modal" :duration="{ enter: 380, leave: 340 }">
    <div v-if="modalOpen" class="sv-modal-layer" data-testid="side-volume-modal" @click.self="control.closeSideVolume()">
      <section class="sv-modal glass" :class="{ media: isMedia }">
        <div class="sv-modal-content">
          <h2>{{ modalTitle }}</h2>
          <div class="sv-sliders">
          <template v-if="!isMedia">
            <div v-for="item in systemSliders" :key="item.key" class="sv-column">
              <div class="sv-large-track" @pointerdown="beginSystemPointer($event, item)">
                <div class="sv-large-fill" :style="{ height: (item.main && control.volumePlusLevel ? 100 : item.value * 100) + '%' }"></div>
                <div v-if="item.main && control.volumePlusLevel" class="sv-plus-gradient" :class="'plus-' + control.volumePlusLevel * 100"></div>
                <span v-if="item.main && control.volumePlusLevel" class="sv-plus-value">{{ volumeDisplayPct }}%</span>
                <span class="slider-icon"><LIcon :name="item.value === 0 ? item.mutedIcon : item.icon" :size="21" :stroke-width="2.2" /></span>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-for="item in mediaSliders" :key="item.key" class="sv-column">
              <div class="sv-large-track" @pointerdown="setFromPointer($event, value => setMedia(item, value))">
                <div
                  class="sv-large-fill"
                  :style="{ height: (item.system && control.volumePlusLevel ? 100 : item.value * 100) + '%' }"
                ></div>
                <div v-if="item.system && control.volumePlusLevel" class="sv-plus-gradient" :class="'plus-' + control.volumePlusLevel * 100"></div>
                <span v-if="item.system && control.volumePlusLevel" class="sv-plus-value">{{ volumeDisplayPct }}%</span>
                <span v-if="item.system" class="slider-icon"><LIcon :name="item.icon" :size="21" :stroke-width="2.2" /></span>
                <NotificationIcon v-else class="media-badge" :type="item.app" :size="21" />
              </div>
            </div>
          </template>
          </div>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.glass {
  background: linear-gradient(145deg, rgba(122, 154, 181, .68), rgba(93, 128, 158, .55));
  border: 1px solid rgba(255,255,255,.34);
  box-shadow: 0 2px 24px rgba(0,0,0,.2), inset 0 1px rgba(255,255,255,.12);
  backdrop-filter: blur(15px) saturate(135%);
  -webkit-backdrop-filter: blur(15px) saturate(135%);
}
.sv-dismiss-layer { position:absolute; inset:0; z-index:var(--z-side-volume-dismiss); }
.side-volume-wrap { position:absolute; left:14px; top:197px; z-index:var(--z-side-volume); width:50px; height:224px; pointer-events:none; }
.side-volume-wrap button { border:0; color:#fff; padding:0; pointer-events:auto; }
.sv-more { position:absolute; z-index:2; top:0; left:0; width:50px; height:38px; border:0; border-radius:39px; background:transparent; box-shadow:none; color:#fff; font:700 18px/1 var(--font-stack); letter-spacing:2px; transition:color .16s ease; }
.sv-more.inverted { color:#3482bb; }
.sv-more.showing-value { color:#fff7ed; font-size:13px; letter-spacing:-.35px; }
.sv-track { position:absolute; top:0; left:0; width:50px; height:179px; border-radius:39px; overflow:hidden; pointer-events:auto; touch-action:none; transition:width .3s cubic-bezier(.2,.8,.2,1), border-radius .3s, transform .3s, left .3s; }
.sv-fill { position:absolute; left:-1px; right:-1px; bottom:-1px; background:rgba(255,255,255,.95); border-radius:0 0 39px 39px; transition:height 110ms ease-out; }
.sv-track.is-plus { border-color:rgba(255,190,92,.78); }
.sv-side-plus-gradient { position:absolute; inset:0; z-index:1; pointer-events:none; }
.sv-track.plus-200 .sv-side-plus-gradient { background:linear-gradient(to top,rgba(253,186,116,0) 0%,rgba(253,186,116,.42) 52%,rgba(251,146,60,1) 100%); }
.sv-track.plus-300 .sv-side-plus-gradient { background:linear-gradient(to top,rgba(251,146,60,0) 0%,rgba(251,146,60,.5) 52%,rgba(249,115,22,1) 100%); }
.sv-track.plus-500 .sv-side-plus-gradient { background:linear-gradient(to top,rgba(249,115,22,0) 0%,rgba(234,88,12,.58) 52%,rgba(194,65,12,1) 100%); }
.sv-speaker { position:absolute; z-index:2; left:14px; bottom:17px; color:#3984bd; }
.sv-custom { position:absolute; left:0; top:190px; width:50px; height:34px; display:grid; place-items:center; border-radius:39px; }
.sv-custom-guide { position:absolute; z-index:3; left:48px; top:189px; width:142px; height:36px; color:#fff; filter:drop-shadow(0 2px 12px rgba(0,0,0,.2)); font:600 14px/36px var(--font-stack); letter-spacing:.1px; white-space:nowrap; pointer-events:none; }
.sv-guide-blur { position:absolute; inset:0; z-index:0; display:block; background:rgba(93,128,158,.08); backdrop-filter:blur(15px) saturate(135%); -webkit-backdrop-filter:blur(15px) saturate(135%); clip-path:path("M31 1H124Q141 1 141 18Q141 35 124 35H31Q15 35 15 25L6 18L15 11Q15 1 31 1Z"); }
.sv-guide-shape { position:absolute; z-index:1; inset:0; width:100%; height:100%; overflow:visible; }
.sv-custom-guide > span { position:absolute; z-index:2; inset:0 7px 0 17px; text-align:center; }
.custom-guide-enter-active,.custom-guide-leave-active { transition:opacity .18s ease,transform .22s cubic-bezier(.2,.8,.2,1); }
.custom-guide-enter-from,.custom-guide-leave-to { opacity:0; transform:translate3d(-8px,0,0); }

.side-volume-wrap.compact { left:14px; height:179px; width:10px; pointer-events:none; }
.side-volume-wrap.compact .sv-track { top:0; left:0; width:10px; height:179px; border-radius:8px; }
.side-volume-wrap.compact .sv-track { pointer-events:none; }
.side-volume-wrap.compact .sv-speaker { display:none; }
.side-volume-wrap.compact .sv-fill { border-radius:0 0 8px 0; }
.side-volume-wrap.compact .sv-track.bounce-up { animation:compact-bounce-up 360ms cubic-bezier(.2,.9,.25,1); }
.side-volume-wrap.compact .sv-track.bounce-down { animation:compact-bounce-down 360ms cubic-bezier(.2,.9,.25,1); }
@keyframes compact-bounce-up {
  0%,100% { transform-origin:center bottom; transform:scaleY(1); }
  42% { transform-origin:center bottom; transform:scaleY(1.1); }
  72% { transform-origin:center bottom; transform:scaleY(.985); }
}
@keyframes compact-bounce-down {
  0%,100% { transform-origin:center top; transform:scaleY(1); }
  42% { transform-origin:center top; transform:scaleY(1.1); }
  72% { transform-origin:center top; transform:scaleY(.985); }
}
.sv-modal-layer { position:absolute; inset:0; z-index:var(--z-side-volume-modal); background:rgba(10,35,58,.04); }
.sv-modal { position:absolute; left:15px; top:197px; width:288px; height:218px; border-radius:24px; padding:14px 16px 16px; color:#fff; background:linear-gradient(145deg,rgba(117,157,192,.76),rgba(80,117,151,.7)); }
.sv-modal h2 { margin:0 0 10px; text-align:center; font:500 14px/1.2 var(--font-stack); }
.sv-sliders { display:flex; justify-content:space-between; align-items:flex-start; }
.sv-column { width:41px; }
.sv-large-track { position:relative; width:41px; height:164px; overflow:hidden; border-radius:28px; background:rgba(185,207,222,.52); touch-action:none; }
.sv-large-fill { position:absolute; left:0; right:0; bottom:0; background:rgba(255,255,255,.94); transition:height 100ms ease-out; }
.slider-icon,.media-badge { position:absolute; z-index:2; left:50%; bottom:10px; transform:translateX(-50%); }
.slider-icon { color:#3482bb; width:21px; height:21px; display:grid; place-items:center; }
.side-volume-enter-active,.side-volume-leave-active { transition:opacity .2s, transform .32s cubic-bezier(.2,.8,.2,1); }
.side-volume-enter-from,.side-volume-leave-to { opacity:0; transform:translateX(-70px); }
.side-volume-wrap.anchor-handoff.side-volume-leave-active { transition:none !important; }
.side-volume-wrap.anchor-handoff.side-volume-leave-to { opacity:0; transform:none; }
.sv-modal-content { height:100%; }
.sv-plus-gradient { position:absolute; inset:0; z-index:1; pointer-events:none; }
.sv-plus-gradient.plus-200 { background:linear-gradient(to top,rgba(253,186,116,0) 0%,rgba(253,186,116,.42) 52%,rgba(251,146,60,1) 100%); }
.sv-plus-gradient.plus-300 { background:linear-gradient(to top,rgba(251,146,60,0) 0%,rgba(251,146,60,.5) 52%,rgba(249,115,22,1) 100%); }
.sv-plus-gradient.plus-500 { background:linear-gradient(to top,rgba(249,115,22,0) 0%,rgba(234,88,12,.58) 52%,rgba(194,65,12,1) 100%); }
.sv-plus-value { position:absolute; z-index:3; top:18px; left:0; right:0; text-align:center; color:#fff7ed; font:800 11px/1 var(--font-stack); pointer-events:none; }
.volume-modal-enter-active,.volume-modal-leave-active { transition:background-color .32s ease; }
.volume-modal-enter-active .sv-modal { transition:clip-path .36s cubic-bezier(.2,.82,.18,1),transform .36s cubic-bezier(.2,.82,.18,1),border-radius .36s cubic-bezier(.2,.82,.18,1); will-change:clip-path,transform; }
.volume-modal-enter-active .sv-modal-content { transition:opacity .2s ease-out .12s; }
.volume-modal-enter-from { background-color:rgba(10,35,58,0); }
.volume-modal-enter-from .sv-modal { clip-path:inset(0 238px 39px 0 round 39px); transform:translate3d(-1px,0,0); border-radius:39px; }
.volume-modal-enter-from .sv-modal-content { opacity:0; }
.volume-modal-leave-active .sv-modal { transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .22s; }
.volume-modal-leave-to { background-color:rgba(10,35,58,0); }
.volume-modal-leave-to .sv-modal { transform:translate3d(-330px,0,0); opacity:0; }
</style>
