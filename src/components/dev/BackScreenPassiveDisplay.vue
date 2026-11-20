<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '../../stores/notificationsStore'
import { useI18nStore } from '../../stores/i18nStore'
import { useBackScreenStore } from '../../stores/backScreenStore'
import NotificationIcon from '../ui/NotificationIcon.vue'
import { formatRelativeTime } from '../../utils/timeFormat'
import iconHangup from '../../assets/island/base/icon_hangup.svg'
import iconAnswer from '../../assets/island/base/icon_answer.svg'

const notificationStore = useNotificationsStore()
const i18n = useI18nStore()
const backScreen = useBackScreenStore()
const { notificationIndex: activeNotificationIndex } = storeToRefs(backScreen)
const notifications = computed(() => notificationStore.list
  .filter((item) => backScreen.settings.notificationAppIds.includes(item.appId))
  .slice(0, 6))
const notificationDragY = ref(0)
const isNotificationDragging = ref(false)
let notificationPointerStart = null
let notificationWheelAt = 0

watch(() => notifications.value[0]?.id, () => { activeNotificationIndex.value = 0 })
watch(() => notificationStore.list.length, (length) => {
  activeNotificationIndex.value = Math.min(activeNotificationIndex.value, Math.max(0, length - 1))
})

function notificationTitle(item) {
  return item.title || i18n.notifTitle(item.appId)
}

function notificationBody(item) {
  return item.body || i18n.notifBody(item.appId)
}

function getNotificationStyle(index) {
  const relative = index - activeNotificationIndex.value
  const movingY = relative === 0
    ? notificationDragY.value
    : relative === 1 && notificationDragY.value < 0
      ? notificationDragY.value * .38
      : relative === -1 && notificationDragY.value > 0
        ? notificationDragY.value * .38
        : 0
  let opacity = relative === 0 ? 1 : relative === 1 ? .72 : relative === 2 ? .38 : 0
  if (relative === -1) opacity = Math.min(.72, Math.max(0, notificationDragY.value / 44) * .72)
  return {
    top: relative < 0 ? `${relative * 72}%` : `${relative * 47}%`,
    transform: `translate3d(0, ${movingY}px, 0) scale(${relative <= 0 ? 1 : 1 - Math.min(relative, 2) * .045})`,
    opacity,
    zIndex: relative === 0 ? 10 : relative < 0 ? 9 : 10 - relative,
    pointerEvents: relative === 0 ? 'auto' : 'none',
    '--notification-card-alpha': relative === 0 ? '.82' : relative === 1 ? '.62' : '.48',
    transition: isNotificationDragging.value
      ? 'none'
      : 'top .34s cubic-bezier(.175,.885,.32,1.275), transform .34s cubic-bezier(.175,.885,.32,1.275), opacity .24s ease, background-color .22s ease'
  }
}

function stepNotification(direction) {
  const next = activeNotificationIndex.value + direction
  if (next < 0 || next >= notifications.value.length) return false
  activeNotificationIndex.value = next
  return true
}

function onNotificationPointerDown(event) {
  if (event.button !== undefined && event.button !== 0) return
  notificationPointerStart = { x: event.clientX, y: event.clientY }
  notificationDragY.value = 0
  isNotificationDragging.value = false
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function onNotificationPointerMove(event) {
  if (!notificationPointerStart) return
  const dx = event.clientX - notificationPointerStart.x
  const dy = event.clientY - notificationPointerStart.y
  if (Math.abs(dy) <= Math.abs(dx) || Math.abs(dy) < 3) return
  event.preventDefault?.()
  isNotificationDragging.value = true
  const atEdge = (activeNotificationIndex.value === 0 && dy > 0) || (activeNotificationIndex.value >= notifications.value.length - 1 && dy < 0)
  notificationDragY.value = atEdge ? dy * .22 : Math.max(-96, Math.min(96, dy))
}

function finishNotificationPointer(event) {
  if (!notificationPointerStart) return
  const deltaY = event.clientY - notificationPointerStart.y
  const deltaX = event.clientX - notificationPointerStart.x
  if (Math.abs(deltaY) >= 26 && Math.abs(deltaY) > Math.abs(deltaX) * 1.1) {
    stepNotification(deltaY < 0 ? 1 : -1)
  }
  try { event.currentTarget.releasePointerCapture?.(event.pointerId) } catch (_) {}
  notificationPointerStart = null
  notificationDragY.value = 0
  isNotificationDragging.value = false
}

function onNotificationWheel(event) {
  const now = Date.now()
  if (now - notificationWheelAt < 260 || Math.abs(event.deltaY) < 8) return
  notificationWheelAt = now
  stepNotification(event.deltaY > 0 ? 1 : -1)
}

defineProps({
  mode: { type: String, default: 'call' },
  callStatus: { type: String, default: 'ringing' },
  startupRun: { type: Number, default: 0 }
})
defineEmits(['answer-call', 'hang-up'])
</script>

<template>
  <div class="back-passive-display" :class="`passive-${mode}`">
    <template v-if="mode === 'call'">
      <div class="passive-call-visual">
        <div class="call-rings" :class="{ 'is-connected': callStatus === 'connected', 'is-ended': callStatus === 'ended' }">
          <i></i><i></i><i></i>
          <span class="caller-avatar">来</span>
        </div>
        <div class="caller-info">
          <span class="call-caption">{{ callStatus === 'ringing' ? '来电' : callStatus === 'connected' ? '通话中' : '通话已结束' }}</span>
          <strong class="caller-name">来电演示</strong>
          <span class="caller-number">移动来电 · SIM 1</span>
        </div>
      </div>
      <div v-if="callStatus !== 'ended'" class="passive-call-actions">
        <button v-if="callStatus === 'ringing'" class="answer-call" type="button" @click="$emit('answer-call')">
          <i class="btn-icon">
            <img :src="iconAnswer" alt="" class="call-action-icon" />
          </i>
          <span>接听</span>
        </button>
        <button class="hangup-call" type="button" @click="$emit('hang-up')">
          <i class="btn-icon">
            <img :src="iconHangup" alt="" class="call-action-icon" />
          </i>
          <span>{{ callStatus === 'ringing' ? '挂断' : '结束通话' }}</span>
        </button>
      </div>
      <button v-else class="replay-call" type="button" @click="$emit('answer-call')">重新演示来电</button>
    </template>

    <div
      v-else-if="mode === 'notification'"
      class="passive-notification-stage"
      :class="{ 'is-dragging': isNotificationDragging }"
      role="listbox"
      aria-label="锁屏通知，向上或向下滑动切换"
      tabindex="0"
      @pointerdown="onNotificationPointerDown"
      @pointermove="onNotificationPointerMove"
      @pointerup="finishNotificationPointer"
      @pointercancel="finishNotificationPointer"
      @wheel.prevent="onNotificationWheel"
      @keydown.up.prevent="stepNotification(-1)"
      @keydown.down.prevent="stepNotification(1)"
    >
      <article
        v-for="(item, index) in notifications"
        :key="item.id"
        class="passive-lock-notification"
        :class="{ 'is-current': index === activeNotificationIndex }"
        :style="getNotificationStyle(index)"
        role="option"
        :aria-selected="index === activeNotificationIndex"
        :aria-label="`${notificationTitle(item)} ${notificationBody(item)}`"
      >
        <NotificationIcon class="notification-app-icon" :type="item.iconType || item.appId" :size="30" />
        <div class="lock-notification-copy">
          <div class="lock-notification-head">
            <strong class="lock-notification-title">{{ notificationTitle(item) }}</strong>
            <span class="lock-notification-time">{{ formatRelativeTime(item.time, i18n.t) }}</span>
          </div>
          <p class="lock-notification-body">{{ notificationBody(item) }}</p>
        </div>
      </article>
      <div v-if="!notifications.length" class="notification-empty">暂无通知</div>
    </div>

    <div v-else class="passive-startup-screen" :key="startupRun">
      <span class="startup-light"></span>
      <strong class="startup-wordmark">itel</strong>
      <span class="startup-slogan">inspiring innovation</span>
    </div>
  </div>
</template>

<style scoped>
.back-passive-display { position:absolute; inset:0; overflow:hidden; container-type:size; color:#f7faff; background:radial-gradient(ellipse at 50% 45%,var(--product-glow,rgba(45,115,189,.3)),transparent 63%),linear-gradient(150deg,var(--product-panel-a,#18243b),var(--product-panel-b,#080e18)); }
.passive-call-visual {
  position: absolute;
  top: 16px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.call-rings {
  position: relative;
  display: grid;
  width: 46px;
  height: 46px;
  flex: none;
  place-items: center;
  border-radius: 50%;
  background: rgba(114, 158, 224, 0.13);
}

.call-rings i {
  position: absolute;
  inset: -4px;
  border: 1px solid rgba(121, 179, 255, 0.56);
  border-radius: 50%;
  animation: call-ring 2.1s ease-out infinite;
}

.call-rings i:nth-child(2) { animation-delay: .7s; }
.call-rings i:nth-child(3) { animation-delay: 1.4s; }
.call-rings.is-connected i { animation-duration: 4s; border-color: rgba(89, 223, 164, 0.38); }
.call-rings.is-ended { opacity: .4; }

.caller-avatar {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 50%;
  color: #eaf2ff;
  background: linear-gradient(145deg, #6686b5, #233958);
  font-size: 16px;
  font-weight: 600;
}

.caller-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.call-caption {
  color: #86e5b1;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.caller-name {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.caller-number {
  color: #aebbd0;
  font-size: 9.5px;
}

.passive-call-actions {
  position: absolute;
  right: 18px;
  bottom: 14px;
  left: 18px;
  display: flex;
  justify-content: center;
  gap: 14px;
}

.passive-call-actions button {
  flex: 1;
  max-width: 95px;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
}

.passive-call-actions button i {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: #f54240;
  flex-shrink: 0;
}

.passive-call-actions .answer-call i {
  background: #28cc71;
}

.call-action-icon {
  width: 9px;
  height: 9px;
  object-fit: contain;
  pointer-events: none;
}

.answer-call .call-action-icon {
  width: 7.5px;
  height: 7.5px;
}

.replay-call {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 5px 14px;
  color: white;
  background: rgba(255, 255, 255, 0.12);
  font-size: 10px;
  cursor: pointer;
}

.passive-notification-stage {
  position: absolute;
  inset: 10px 10px 8px;
  overflow: hidden;
  border-radius: 12px;
  touch-action: none;
  cursor: grab;
  outline: none;
}

.passive-notification-stage.is-dragging { cursor: grabbing; }

.passive-lock-notification {
  position: absolute;
  left: 0;
  right: 0;
  height: 80%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.52);
  border-radius: 14px;
  background: rgba(255, 255, 255, var(--notification-card-alpha, 0.82));
  -webkit-backdrop-filter: blur(30px) saturate(170%) brightness(1.06);
  backdrop-filter: blur(30px) saturate(170%) brightness(1.06);
  box-shadow: 0 7px 24px rgba(0, 0, 0, 0.12), inset 0 0.5px 0 rgba(255, 255, 255, 0.78);
  color: #1c1c1e;
  user-select: none;
  will-change: top, transform, opacity;
}
.passive-lock-notification:active { background:rgba(255,255,255,.9); }
.notification-app-icon { flex:none; filter:drop-shadow(0 2px 5px rgba(0,0,0,.08)); }
.lock-notification-copy { min-width:0; display:flex; flex:1; flex-direction:column; justify-content:center; }
.lock-notification-head { display:flex; align-items:baseline; gap:4px; min-width:0; margin-bottom:2px; }
.lock-notification-title { min-width:0; overflow:hidden; color:#1c1c1e; font-size:7.8cqh; line-height:1.2; font-weight:700; letter-spacing:.02em; text-overflow:ellipsis; white-space:nowrap; }
.lock-notification-time { flex:none; color:rgba(0,0,0,.45); font-size:5.8cqh; line-height:1.2; font-weight:500; }
.lock-notification-body { display:-webkit-box; overflow:hidden; margin:0; padding-right:2px; color:#48484a; font-size:6.9cqh; line-height:1.28; font-weight:400; -webkit-box-orient:vertical; -webkit-line-clamp:2; text-wrap:pretty; }
.notification-empty { position:absolute; inset:0; display:grid; place-items:center; color:rgba(235,241,251,.68); font-size:8cqh; }
@media (prefers-reduced-motion: reduce) { .passive-lock-notification { transition-duration:.08s !important; } }
.passive-startup-screen { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; background:radial-gradient(circle at 50% 52%,rgba(72,146,255,.22),transparent 48%),linear-gradient(150deg,#05080e,#101a2b 60%,#05070b); }
.startup-light { position:absolute; width:56cqh; aspect-ratio:1; border-radius:50%; background:radial-gradient(circle,rgba(87,165,255,.35),transparent 68%); animation:startup-light-in 3.6s ease-out both; }
.startup-wordmark { position:relative; z-index:1; color:#f8fbff; font-size:25cqh; font-style:italic; font-weight:800; letter-spacing:-.08em; text-shadow:0 0 25px rgba(121,187,255,.58); animation:itel-boot-logo 3.6s cubic-bezier(.2,.75,.25,1) both; }
.startup-slogan { position:relative; z-index:1; margin-top:1cqh; color:rgba(219,231,249,.68); font-size:6cqh; letter-spacing:.17em; text-transform:uppercase; animation:itel-boot-slogan 3.6s ease both; }
@keyframes call-ring { 0% { transform:scale(.82); opacity:.72; } 85%,100% { transform:scale(1.38); opacity:0; } }
@keyframes itel-boot-logo { 0% { opacity:0; transform:translateY(28px) scale(.72); filter:blur(10px); } 28% { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } 68% { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } 100% { opacity:0; transform:translateY(-24px) scale(1.1); filter:blur(8px); } }
@keyframes itel-boot-slogan { 0%,24% { opacity:0; transform:translateY(8px); } 38%,68% { opacity:.8; transform:translateY(0); } 100% { opacity:0; transform:translateY(-10px); } }
@keyframes startup-light-in { 0%,100% { opacity:0; transform:scale(.55); } 28%,70% { opacity:1; transform:scale(1); } }
@media (prefers-reduced-motion: reduce) { .call-rings i,.startup-light,.startup-wordmark,.startup-slogan { animation-duration:8s; } }
</style>
