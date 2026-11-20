<script setup>
import { usePrivacyStore, ICON_DURATIONS, DEMO_APPS, PERMISSION_APP_SCENARIOS } from '../../stores/privacyStore'
import PrivacyAppIcon from './PrivacyAppIcon.vue'
const privacy = usePrivacyStore()
const applications = PERMISSION_APP_SCENARIOS
const permissionNames = {camera:'相机', microphone:'录音', location:'位置'}
const combinationLabel = keys => keys.map(key => permissionNames[key]).join('+')

function onSelectCombination(app, event) {
  const select = event.target
  const value = select.value
  if (!value) return
  const keys = value.split(',')
  for (const key of keys) privacy.access[`${app}:${key}`] = 'allow'
  privacy.start(app, keys)
  select.animate([
    { borderColor: 'rgba(96, 158, 253, 0.9)', backgroundColor: 'rgba(52, 120, 220, 0.25)' },
    { borderColor: 'rgba(255, 255, 255, 0.14)', backgroundColor: 'rgba(255, 255, 255, 0.06)' }
  ], { duration: 400, easing: 'ease-out' })
  select.value = ''
}

const selected = (app, key) => privacy.active.some(entry => entry.app === app && entry.permission === key)
function togglePermission(app, key) {
  if (selected(app, key)) privacy.stop(app, [key])
  else {
    privacy.access[`${app}:${key}`] = 'allow'
    privacy.start(app, [key])
  }
}
</script>
<template>
 <div class="privacy-demo">
  <fieldset>
   <legend>状态栏图标显示时长</legend>
   <div class="position-options duration-options" role="radiogroup" aria-label="状态栏图标显示时长">
    <button v-for="seconds in ICON_DURATIONS" :key="seconds" role="radio" :aria-checked="privacy.iconDurationSeconds === seconds" :class="{selected:privacy.iconDurationSeconds === seconds}" @click="privacy.setIconDuration(seconds)">{{ seconds }}秒</button>
   </div>
  </fieldset>
  <fieldset v-for="application in applications" :key="application.app" class="application-permissions">
   <legend>
     <div class="application-title">
       <PrivacyAppIcon :app="application.app" :size="24" />
       <span>{{ DEMO_APPS[application.app].name }}</span>
     </div>
     <div v-if="application.combinations.length" class="combination-select-wrap">
       <select
         class="combination-select"
         :aria-label="`${DEMO_APPS[application.app].name}应用：同时开始调用`"
         @change="onSelectCombination(application.app, $event)"
       >
         <option value="" disabled selected>同时开始调用</option>
         <option
           v-for="keys in application.combinations"
           :key="keys.join('+')"
           :value="keys.join(',')"
         >
           {{ combinationLabel(keys) }}
         </option>
       </select>
       <svg class="combination-select-arrow" viewBox="0 0 20 20" fill="none">
         <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="m6 8 4 4 4-4"/>
       </svg>
     </div>
   </legend>
   <div class="permission-options" :style="{gridTemplateColumns:`repeat(${application.permissions.length},1fr)`}">
    <button v-for="key in application.permissions" :key="key" :aria-label="`${DEMO_APPS[application.app].name}应用：${permissionNames[key]}`" :aria-pressed="selected(application.app,key)" :class="{selected:selected(application.app,key)}" @click="togglePermission(application.app,key)"><span>{{ permissionNames[key] }}</span></button>
   </div>
  </fieldset>
  <button class="clear-permission-hints" @click="privacy.reset()">清空所有权限</button>
 </div>
</template>
<style scoped>
.privacy-demo{display:flex;flex-direction:column;gap:24px;color:#fff;font-family:var(--font-stack)}fieldset{border:0;padding:0;margin:0;min-width:0}legend{font-size:13px;font-weight:500;color:#cbd1de;padding:0;margin-bottom:12px}.permission-options{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.permission-options button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:69px;padding:12px 3px;border:1px solid #ffffff12;border-radius:12px;background:#ffffff06;color:#bac2d1;font-size:12px;cursor:pointer;transition:background .18s,color .18s,border-color .18s}.permission-options button.selected{background:#3478dc30;border-color:#609efd90;color:#c9e0ff}.position-options{display:flex;padding:4px;background:#0c0f174d;border:1px solid #ffffff09;border-radius:11px;gap:4px}.position-options button{flex:1;background:none;border:0;border-radius:8px;color:#929dad;padding:10px 4px;font-size:12px;cursor:pointer}.position-options button.selected{color:#fff;background:#ffffff15;box-shadow:0 1px 4px #0002}button:focus-visible{outline:2px solid #8dbbfb;outline-offset:3px}
.clear-permission-hints{width:100%;padding:11px 12px;border:1px solid #ffffff18;border-radius:11px;background:#ffffff08;color:#cbd1de;font:500 12px/1.4 var(--font-stack);cursor:pointer;transition:background .18s}.clear-permission-hints:hover{background:#ffffff12}.clear-permission-hints:active{background:#3478dc30}
.application-permissions legend{display:flex;align-items:center;justify-content:space-between;width:100%;color:#e0e6f1}.application-permissions .permission-options button{min-height:38px;padding:10px 3px;gap:0}
.application-title{display:flex;align-items:center;gap:8px}
.combination-select-wrap{position:relative;display:inline-flex;align-items:center}
.combination-select{appearance:none;-webkit-appearance:none;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#c0ccde;font:500 11px/1 var(--font-stack);padding:6px 24px 6px 9px;cursor:pointer;outline:none;transition:border-color .18s,background .18s}
.combination-select:hover{background:rgba(255,255,255,.1);border-color:rgba(105,151,255,.45);color:#fff}
.combination-select:focus-visible{border-color:rgba(105,151,255,.7);box-shadow:0 0 0 2px rgba(79,130,244,.2)}
.combination-select-arrow{position:absolute;right:6px;width:13px;height:13px;color:rgba(255,255,255,.5);pointer-events:none}
.combination-select option{background:#191b26;color:#fff}
</style>
