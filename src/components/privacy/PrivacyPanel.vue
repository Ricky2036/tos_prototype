<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { usePrivacyStore, DEMO_APPS, PERMISSIONS } from '../../stores/privacyStore'
import { useSystemStore } from '../../stores/systemStore'
import PermissionBadge from './PermissionBadge.vue'
import PrivacyAppIcon from './PrivacyAppIcon.vue'
import PrivacySettingsPages from './PrivacySettingsPages.vue'
import backIcon from '../../assets/privacy/back.svg'
import LIcon from '../ui/LIcon.vue'
import { usePrivacyNavigation } from '../../composables/usePrivacyNavigation'
const privacy = usePrivacyStore()
const system = useSystemStore()
const detailPanel = ref(null)
const destinationPanel = ref(null)
const previousFocus = ref(null)
const settingsPages = ref(null)
const {displayedPage,departureStyle,onDestinationEntered,closeDetail,destinationRevision,destinationTransition} = usePrivacyNavigation(privacy,system)
const panel = computed(() => displayedPage.value === 'detail' ? detailPanel.value : destinationPanel.value)
function back() { if (privacy.page !== 'detail') settingsPages.value?.back(); else closeDetail() }
function close() { closeDetail() }
function trap(e) {
  if(e.key==='Escape') { e.preventDefault(); e.stopPropagation(); back() }
  if(e.key !== 'Tab') return
  const list = [...(panel.value?.querySelectorAll('button, [tabindex="0"]') || [])]
  const first=list[0], last=list[list.length-1]
  if(e.shiftKey && document.activeElement===first) { e.preventDefault(); last?.focus() }
  else if(!e.shiftKey && document.activeElement===last) { e.preventDefault(); first?.focus() }
}
watch(() => displayedPage.value, async (value,old) => {
  if (value && !old && !previousFocus.value) previousFocus.value=document.activeElement
  await nextTick()
  if (value) panel.value?.querySelector('button')?.focus({preventScroll:true})
  else if (!privacy.page) {previousFocus.value?.focus?.({preventScroll:true});previousFocus.value=null}
})
const rowFeedback = new WeakMap()
let permissionOpenTimer = null
onBeforeUnmount(() => clearTimeout(permissionOpenTimer))
function startPermissionFeedback(event) {
  if (event.button !== undefined && event.button !== 0) return
  const button = event.currentTarget
  const ripple = button.querySelector('.permission-tap-ripple')
  const rect = button.getBoundingClientRect()
  const pointer = event.type === 'pointerdown'
  const x = pointer ? (event.clientX - rect.left) * button.offsetWidth / rect.width : button.offsetWidth / 2
  const y = pointer ? (event.clientY - rect.top) * button.offsetHeight / rect.height : button.offsetHeight / 2
  const radius = Math.hypot(Math.max(x, button.offsetWidth - x), Math.max(y, button.offsetHeight - y))
  rowFeedback.get(button)?.animation.cancel()
  Object.assign(ripple.style, {left:`${x-radius}px`,top:`${y-radius}px`,width:`${radius*2}px`,height:`${radius*2}px`})
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const animation = ripple.animate([
    {transform:'scale(0)',opacity:1,offset:0},
    {transform:'scale(1)',opacity:1,offset:.45},
    {transform:'scale(1)',opacity:0,offset:1}
  ], {duration:reduced ? 0 : 440,easing:'cubic-bezier(.2,.7,.2,1)'})
  rowFeedback.set(button,{animation,startedAt:performance.now(),delay:reduced ? 0 : 160})
}
function cancelPermissionFeedback(event) {
  rowFeedback.get(event.currentTarget)?.animation.cancel()
  rowFeedback.delete(event.currentTarget)
}
function openPermission(app,permission,event) {
  const button = event.currentTarget
  if (event.detail === 0 || !rowFeedback.has(button)) startPermissionFeedback(event)
  const feedback = rowFeedback.get(button)
  const delay = Math.max(0,feedback.delay - (performance.now()-feedback.startedAt))
  clearTimeout(permissionOpenTimer)
  permissionOpenTimer = setTimeout(() => {
    if (privacy.page === 'detail' && system.screenOn) privacy.openSettings(app,permission)
  },delay)
}
function timeLabel(e) {
 if(e.stoppedAt === null) return '正在使用'
 return '最近使用过'
}
</script>
<template>
 <Transition name="privacy-panel" :duration="{ enter: 420, leave: 220 }">
  <div v-if="displayedPage==='detail' && system.screenOn" class="privacy-panel-backdrop" :style="departureStyle" @pointerdown.stop @keydown="trap">
   <div class="privacy-panel-material" @click="close"></div>
   <section ref="detailPanel" class="privacy-panel detail-page" role="dialog" aria-modal="true" aria-label="敏感权限使用提醒" @click.self="close">
    <template v-if="displayedPage === 'detail'">
     <header class="privacy-title-row"><button class="privacy-title-back" aria-label="返回控制中心" @click="close"><img :src="backIcon" style="width:19.44px;height:19.44px" alt="" aria-hidden="true" draggable="false" /></button><h2>敏感权限使用提醒</h2></header>
     <div class="privacy-groups" @click.self="close">
      <article v-for="group in privacy.groups" :key="group.app" class="privacy-app-card">
       <div class="privacy-app-title"><PrivacyAppIcon :app="group.app" :size="26" /><strong>{{ DEMO_APPS[group.app].name }}</strong></div>
       <button v-for="entry in group.entries" :key="entry.permission" class="privacy-permission-row" @pointerdown="startPermissionFeedback" @pointercancel="cancelPermissionFeedback" @click="openPermission(group.app, entry.permission, $event)" :aria-label="`${DEMO_APPS[group.app].name}的${PERMISSIONS[entry.permission].label}权限设置`">
        <span class="permission-tap-ripple" aria-hidden="true"></span>
        <PermissionBadge :permission="entry.permission" :size="22" />
        <span class="permission-row-copy"><span>{{ PERMISSIONS[entry.permission].label }}</span><small :class="{active:entry.stoppedAt===null}" :style="entry.stoppedAt===null?{color:privacy.color(entry.permission)}:{}">{{ timeLabel(entry) }}</small></span>
        <LIcon name="chevronRight" :size="16" class="muted-chevron" />
       </button>
      </article>
      <div v-if="!privacy.groups.length" class="privacy-empty"><LIcon name="shieldCheck" :size="36" /><p>暂无正在或最近使用的权限</p></div>
     </div>
     <button class="privacy-recent-button" @click="privacy.page='history'">近期权限使用情况</button>
    </template>
   </section>
   <span class="privacy-home-indicator" aria-hidden="true"></span>
  </div>
 </Transition>
 <Transition :name="destinationTransition" @after-enter="onDestinationEntered">
  <section :key="destinationRevision" v-if="privacy.settingsPage && system.screenOn" ref="destinationPanel" class="privacy-destination-shell" role="dialog" aria-modal="true" :aria-label="privacy.settingsPage==='settings'?'应用权限':'隐私信息中心'" @pointerdown.stop @keydown="trap">
   <PrivacySettingsPages :key="destinationRevision" ref="settingsPages" :page="privacy.settingsPage" />
  </section>
 </Transition>
</template>
<style scoped>
 .privacy-panel-backdrop{position:absolute;inset:0;z-index:var(--z-volume-panel);overflow:hidden;color:white;}
.privacy-panel-material{position:absolute;inset:0;background:rgba(0,0,0,.22);backdrop-filter:blur(28px) saturate(130%);-webkit-backdrop-filter:blur(28px) saturate(130%)}
.privacy-panel{position:relative;width:100%;height:100%;box-sizing:border-box;overflow:auto;padding:48px 24px 42px;scrollbar-width:none;font-family:var(--font-stack);}
.privacy-panel-header{display:flex;align-items:center;gap:8px;min-height:44px;margin:0 -7px 18px}.panel-back,.panel-done{display:flex;align-items:center;gap:2px;flex:none;border:0;background:none;color:#fff;font:500 14px/1.4 var(--font-stack);padding:8px 0;cursor:pointer}.panel-done{padding:8px 7px}.panel-nav-title{flex:1;text-align:center;font-size:15px;font-weight:600}.privacy-page-title{padding:8px 0 26px}.privacy-title-symbol{width:52px;height:52px;display:grid;place-items:center;border-radius:16px;background:#ffffff16;border:1px solid #ffffff20;margin-bottom:17px}.privacy-page-title h2{font-size:28px;line-height:1.2;letter-spacing:-.6px;font-weight:700;margin:0 0 10px}.panel-description{font-size:13px;color:#ffffff99;margin:0;line-height:1.6}.privacy-section-label{font-size:11px;color:#ffffff80;margin:0 14px 9px}.privacy-groups{display:flex;flex-direction:column;gap:14px;}
.privacy-app-card{background:#ffffff13;border:1px solid #ffffff1a;border-radius:22px;padding:16px}.privacy-app-title{display:flex;align-items:center;gap:11px;margin-bottom:11px}.privacy-app-title strong{font-size:17px;font-weight:600;overflow-wrap:anywhere}.demo-app-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;color:white;border-radius:10px;flex:none;}
.privacy-permission-row{display:flex;align-items:center;gap:11px;background:none;border:0;width:100%;text-align:left;color:white;padding:13px 0;cursor:pointer}.privacy-permission-row+.privacy-permission-row{border-top:1px solid #ffffff12}.permission-row-copy{display:flex;flex-direction:column;gap:5px;flex:1;font-size:14px}.permission-row-copy small{font-size:11px;color:#ffffff80}.muted-chevron{opacity:.35}.privacy-more{background:#ffffff0f;border:1px solid #ffffff12;border-radius:18px;color:#fff;display:flex;align-items:center;justify-content:space-between;width:100%;padding:17px 16px;margin-top:22px;font-size:14px;cursor:pointer}.privacy-footnote{font-size:11px;color:#ffffff70;line-height:1.6;margin:12px 14px}.privacy-empty{text-align:center;padding:32px 8px;color:#ffffff90;font-size:13px;}.privacy-home-indicator{position:absolute;bottom:8px;left:35%;width:30%;height:4px;border-radius:99px;background:#ffffff88;pointer-events:none}
.settings-page{padding:0;overflow:hidden;background:#efefef;color:#15161a}.settings-page .panel-back,.settings-page .panel-done{color:#1685ed}.settings-page .panel-icon-btn{color:#15161a;background:#00000007}.settings-page .panel-description{color:#777}.settings-page .privacy-more{color:#1685ed}.settings-app-hero{display:flex;align-items:center;flex-direction:column;padding:25px 4px 17px;text-align:center}.settings-app-hero .demo-app-icon{width:48px;height:48px;border-radius:14px}.settings-app-hero h3{font-size:17px;margin:12px 0 0}.settings-app-hero p{font-size:12px;color:#777}.settings-options{border-radius:16px;overflow:hidden;background:white}.settings-options button{display:flex;gap:12px;align-items:center;text-align:left;padding:17px 12px;background:none;border:0;width:100%;font-size:13px;cursor:pointer}.radio-circle{border:1.5px solid #bbb;border-radius:50%;width:17px;height:17px}.radio-circle.checked{border:5px solid #258cff}.settings-note{font-size:11px;color:#858589;padding:5px 6px;line-height:1.7}.history-summary{display:flex;justify-content:space-around;background:white;border-radius:16px;padding:18px 5px;margin-bottom:15px}.history-summary>div{display:flex;flex-direction:column;align-items:center;gap:9px}.history-summary strong{font-size:22px}.history-summary small{font-size:11px;color:#777}.history-list{background:white;border-radius:16px;padding:4px 12px}.history-row{display:flex;align-items:center;gap:12px;width:100%;padding:14px 0;background:none;border:0;text-align:left;cursor:pointer}.history-row+.history-row{border-top:1px solid #eee}.history-row>span{flex:1;display:flex;flex-direction:column;gap:5px}.history-row strong{font-size:13px;font-weight:500}.history-row small{font-size:11px;color:#888}
 .detail-page{padding:64px 36px 56px;display:flex;flex-direction:column}.privacy-detail-close{position:absolute;top:20px;right:24px;width:28px;height:28px;border:0;border-radius:50%;background:#ffffff12;color:white;display:grid;place-items:center;cursor:pointer}.privacy-title-row{flex:none;display:flex;align-items:center;gap:13px;padding:0 0 14px;border-bottom:1px solid #ffffff22}.privacy-heading-symbol{display:flex;align-items:center}.privacy-title-row h2{font-size:17px;font-weight:600;line-height:1.3;margin:0}.privacy-title-more{display:flex;align-items:center;gap:3px;margin-left:auto;padding:8px 0;border:0;background:none;color:#ffffffad;font:400 11px/1.4 var(--font-stack);cursor:pointer}.detail-page .privacy-groups{gap:0;flex:1;min-height:0;overflow:auto;scrollbar-width:none}.detail-page .privacy-app-card{background:none;border:0;border-radius:0;padding:22px 0 16px;border-bottom:1px solid #ffffff20}.detail-page .privacy-app-title{gap:9px;margin-bottom:11px}.detail-page .demo-app-icon{width:26px;height:26px;border-radius:7px}.detail-page .privacy-app-title strong{font-size:16px;font-weight:500}.detail-page .privacy-permission-row{box-sizing:border-box;padding:11px 0 11px 35px;margin-top:6px;border:0;border-radius:0;background:none;gap:10px}.detail-page .privacy-permission-row{position:relative;isolation:isolate;overflow:hidden;border-radius:10px;-webkit-tap-highlight-color:transparent}.permission-tap-ripple{position:absolute;z-index:-1;border-radius:50%;background:rgba(255,255,255,.16);opacity:0;pointer-events:none;transform-origin:center}.detail-page .permission-row-copy{font-size:14px;gap:0;flex-direction:row;align-items:center;justify-content:space-between}.detail-page .permission-row-copy small{font-size:11px}.detail-page .permission-row-copy small.active{color:#ffffffa6!important}.detail-page .privacy-app-card:last-child{border-bottom:0}
/* Keep the blur layer outside an ancestor opacity transition so its backdrop is sampled immediately. */
.privacy-panel-enter-active .privacy-panel-material{transition:opacity 180ms cubic-bezier(.2,.8,.2,1)}
.privacy-panel-leave-active .privacy-panel-material{transition:opacity 160ms ease-out 60ms}
.privacy-panel-enter-active .privacy-panel{transition:opacity 240ms ease-out 180ms,transform 240ms ease-out 180ms}
.privacy-panel-leave-active .privacy-panel{transition:opacity 120ms ease-out,transform 120ms ease-out}
.privacy-panel-enter-from .privacy-panel-material,.privacy-panel-leave-to .privacy-panel-material{opacity:0}
.privacy-panel-enter-from .privacy-panel{opacity:0;transform:translateY(12px)}
.privacy-panel-leave-to .privacy-panel{opacity:0;transform:translateY(10px)}
.privacy-panel-enter-from .privacy-home-indicator,.privacy-panel-leave-to .privacy-home-indicator{opacity:0}
.privacy-home-indicator{transition:opacity 180ms ease-out}
.privacy-recent-button{display:flex;align-items:center;justify-content:center;text-align:center;flex:none;width:100%;margin-top:22px;border:1px solid #ffffff1a;border-radius:14px;padding:15px 14px;color:white;background:#ffffff13;font:500 14px/1.4 var(--font-stack);cursor:pointer}
.privacy-title-back{display:grid;place-items:center;flex:none;width:32px;height:32px;padding:0;margin-left:0;margin-right:2px;border:1px solid #ffffff20;border-radius:50%;background:#ffffff18;color:#fff;cursor:pointer;transition:background .18s}.privacy-title-back:hover{background:#ffffff26}.privacy-title-back:active{background:#ffffff33}.privacy-recent-button:hover{background:#ffffff20}.privacy-recent-button:active{background:#ffffff2a}
.privacy-destination-shell{position:absolute;inset:0;z-index:var(--z-app-window);overflow:hidden;background:#efefef;transform-origin:50% 50%;font-family:var(--font-stack)}
.privacy-destination-enter-active{transition:transform 360ms cubic-bezier(.22,.82,.18,1),opacity 200ms ease-out,border-radius 360ms cubic-bezier(.22,.82,.18,1)}
.privacy-destination-leave-active{transition:transform 220ms cubic-bezier(.33,0,.67,1),opacity 180ms ease-in,border-radius 220ms ease}
.privacy-destination-enter-from{transform:scale(.88);opacity:0;border-radius:28px}
.privacy-destination-leave-to{transform:scale(.88);opacity:0;border-radius:28px}
.privacy-page-slide-enter-active,.privacy-page-slide-leave-active{transition:transform 320ms cubic-bezier(.22,.82,.18,1)}
.privacy-page-slide-enter-from{transform:translateX(100%)}
.privacy-page-slide-leave-to{transform:translateX(-25%)}
button:focus-visible{outline:2px solid #8fcbff;outline-offset:2px}@media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
