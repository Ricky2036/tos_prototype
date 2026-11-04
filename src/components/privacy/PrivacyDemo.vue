<script setup>
import { usePrivacyStore, ICON_DURATIONS, DEMO_APPS, PERMISSION_APP_SCENARIOS } from '../../stores/privacyStore'
import PrivacyAppIcon from './PrivacyAppIcon.vue'
const privacy = usePrivacyStore()
const applications = PERMISSION_APP_SCENARIOS
const permissionNames = {camera:'相机', microphone:'录音', location:'位置'}
const combinationLabel = keys => keys.map(key => permissionNames[key]).join('+')
function startCombination(app, keys, event) {
  const button = event.currentTarget
  button.getAnimations().forEach(animation => animation.cancel())
  button.animate([
    { backgroundColor:'#ffffff06', borderColor:'#ffffff12', color:'#bac2d1', transform:'scale(1)', offset:0 },
    { backgroundColor:'#3478dc30', borderColor:'#609efd90', color:'#c9e0ff', transform:'scale(.98)', offset:.18 },
    { backgroundColor:'#3478dc30', borderColor:'#609efd90', color:'#c9e0ff', transform:'scale(1)', offset:.55 },
    { backgroundColor:'#ffffff06', borderColor:'#ffffff12', color:'#bac2d1', transform:'scale(1)', offset:1 }
  ], {duration:650, easing:'ease-out'})
  for (const key of keys) privacy.access[`${app}:${key}`] = 'allow'
  privacy.start(app, keys)
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
   <legend><PrivacyAppIcon :app="application.app" :size="24" /><span>{{ DEMO_APPS[application.app].name }}</span></legend>
   <div class="permission-options" :style="{gridTemplateColumns:`repeat(${application.permissions.length},1fr)`}">
    <button v-for="key in application.permissions" :key="key" :aria-label="`${DEMO_APPS[application.app].name}应用：${permissionNames[key]}`" :aria-pressed="selected(application.app,key)" :class="{selected:selected(application.app,key)}" @click="togglePermission(application.app,key)"><span>{{ permissionNames[key] }}</span></button>
   </div>
   <template v-if="application.combinations.length">
    <p class="combination-heading">同时开始调用</p>
    <div class="combination-options">
     <button v-for="keys in application.combinations" :key="keys.join('+')" :aria-label="`${DEMO_APPS[application.app].name}应用同时开始调用：${combinationLabel(keys)}`" @click="startCombination(application.app,keys,$event)"><span>{{ combinationLabel(keys) }}</span></button>
    </div>
   </template>
  </fieldset>
  <button class="clear-permission-hints" @click="privacy.reset()">清空所有权限</button>
 </div>
</template>
<style scoped>
.privacy-demo{display:flex;flex-direction:column;gap:24px;color:#fff;font-family:var(--font-stack)}fieldset{border:0;padding:0;margin:0;min-width:0}legend{font-size:13px;font-weight:500;color:#cbd1de;padding:0;margin-bottom:12px}.permission-options{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.permission-options button,.combination-options button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:69px;padding:12px 3px;border:1px solid #ffffff12;border-radius:12px;background:#ffffff06;color:#bac2d1;font-size:12px;cursor:pointer;transition:background .18s,color .18s,border-color .18s}.permission-options button.selected{background:#3478dc30;border-color:#609efd90;color:#c9e0ff}.combination-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.combination-icons{display:flex;align-items:center;justify-content:center;gap:4px}.combination-heading{font-size:12px;font-weight:500;color:#cbd1de;margin:18px 0 10px}.combination-options button>span:last-child{white-space:nowrap;font-size:10px}.position-options{display:flex;padding:4px;background:#0c0f174d;border:1px solid #ffffff09;border-radius:11px;gap:4px}.position-options button{flex:1;background:none;border:0;border-radius:8px;color:#929dad;padding:10px 4px;font-size:12px;cursor:pointer}.position-options button.selected{color:#fff;background:#ffffff15;box-shadow:0 1px 4px #0002}button:focus-visible{outline:2px solid #8dbbfb;outline-offset:3px}
.clear-permission-hints{width:100%;padding:11px 12px;border:1px solid #ffffff18;border-radius:11px;background:#ffffff08;color:#cbd1de;font:500 12px/1.4 var(--font-stack);cursor:pointer;transition:background .18s}.clear-permission-hints:hover{background:#ffffff12}.clear-permission-hints:active{background:#3478dc30}
.application-permissions legend{display:flex;align-items:center;gap:8px;color:#e0e6f1}.application-permissions .permission-options button,.application-permissions .combination-options button{min-height:38px;padding:10px 3px;gap:0}.application-permissions .combination-heading{margin-top:13px}.combination-options button{min-width:0;white-space:nowrap}
</style>
