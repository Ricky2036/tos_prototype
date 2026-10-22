<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { usePrivacyStore, DEMO_APPS } from '../../stores/privacyStore'
import { appPermissionRows, PRIVACY_DASHBOARD_ROWS, LOCATION_TIMELINE, REFERENCE_APPS, PERMISSION_DESCRIPTIONS, permissionAppGroups } from '../../utils/privacySettingsData'
import PrivacyReferenceAppIcon from './PrivacyReferenceAppIcon.vue'
import SettingsPermissionIcon from './SettingsPermissionIcon.vue'
import { useBackHandler } from '../../composables/backRegistry'
import LIcon from '../ui/LIcon.vue'
import backIcon from '../../assets/privacy/back.svg'
import googleIcon from '../../assets/icons/notification-apps/google.png'

const props = defineProps({ page: {type:String,default:null} })
const privacy = usePrivacyStore()
const page = computed(() => props.page || privacy.page)
const scroll = ref(null)
const expanded = ref(false)
const idleEnabled = ref(true)
const permissionSheet = ref(null)
const managerPermission = ref(null)
const subpageStack = ref([])
const menuOpen = ref(false)
const showSystemApps = ref(false)
const historyDays = ref(1)
const allPermissions = ref(false)
const periodLabel = computed(() => historyDays.value === 1 ? '过去 24 小时' : '过去 7 天')
const usagePermission = ref(null)
const appRows = computed(() => appPermissionRows(privacy.selectedApp))
const denied = row => privacy.access[`${privacy.selectedApp}:${row.key}`] === 'deny'
const allowedRows = computed(() => appRows.value.filter(row => !denied(row)))
const deniedRows = computed(() => appRows.value.filter(denied))
const dashboardRows = computed(() => expanded.value ? PRIVACY_DASHBOARD_ROWS : PRIVACY_DASHBOARD_ROWS.slice(0,3))
const title = computed(() => managerPermission.value?.label || (permissionSheet.value ? `${permissionSheet.value.label}权限` : page.value === 'settings' ? (allPermissions.value ? '所有权限' : '应用权限') : usagePermission.value ? `${usagePermission.value.label}使用情况` : '隐私信息中心'))
const currentAppName = computed(() => DEMO_APPS[privacy.selectedApp]?.name || REFERENCE_APPS[privacy.selectedApp]?.name || '相机')
const timelineGroups = computed(() => {
  const key=usagePermission.value?.key
  if (!key) return []
  const rows=key==='location' ? [...LOCATION_TIMELINE] : []
  const seen=new Set()
  const runtimeRows=[]
  for(const entry of [...privacy.active,...privacy.history].filter(entry=>entry.permission===key).sort((a,b)=>b.order-a.order)){
    const stamp=entry.stoppedAt ?? entry.startedAt
    if(privacy.now-stamp > historyDays.value*86400000) continue
    const id=`${entry.app}:${entry.order}`;if(seen.has(id)) continue;seen.add(id)
    const day=new Date(stamp).toDateString()===new Date(privacy.now).toDateString()?'今天':'昨天'
    runtimeRows.push({app:entry.app,day,time:new Date(stamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}),duration:entry.stoppedAt===null?'正在使用':''})
  }
  rows.unshift(...runtimeRows)
  return ['今天','昨天'].map(day=>({day,rows:rows.filter(row=>row.day===day)})).filter(group=>group.rows.length)
})
const managerGroups = computed(() => {
  const key=managerPermission.value?.key
  const extra=[...new Set([...privacy.active,...privacy.history].filter(entry=>entry.permission===key).map(entry=>entry.app))]
  return permissionAppGroups(key,privacy.access,extra)
})
const appName = app => DEMO_APPS[app]?.name || REFERENCE_APPS[app]?.name || app
const subpageKey = computed(() => managerPermission.value ? `manager-${managerPermission.value.key}` : permissionSheet.value ? `editor-${privacy.selectedApp}-${permissionSheet.value.key}` : usagePermission.value ? `timeline-${usagePermission.value.key}` : page.value+(allPermissions.value?'-all':''))
function pushSubpage(change) {
  subpageStack.value.push({usage:usagePermission.value,editor:permissionSheet.value,manager:managerPermission.value,app:privacy.selectedApp,permission:privacy.selectedPermission,all:allPermissions.value,scrollTop:scroll.value?.scrollTop || 0})
  change();menuOpen.value=false;nextTick(()=>scroll.value?.scrollTo({top:0}))
}
function openPermission(row) {pushSubpage(()=>{permissionSheet.value=row;managerPermission.value=null})}
function openManager(row) {pushSubpage(()=>{managerPermission.value=row})}
function openManagerApp(row) {pushSubpage(()=>{privacy.selectedApp=row.app;privacy.selectedPermission=managerPermission.value.key;permissionSheet.value=managerPermission.value;managerPermission.value=null})}
const selectedAccess = computed(() => privacy.access[`${privacy.selectedApp}:${permissionSheet.value?.key}`] || 'allow')

function lastAccess(row) {
  const entries = [...privacy.active,...privacy.history].filter(entry => entry.app === privacy.selectedApp && entry.permission === row.key)
  const latest = entries.sort((a,b)=>b.order-a.order)[0]
  if (latest) return `上次访问时间：${new Date(latest.stoppedAt ?? latest.startedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})}`
  if (row.key === 'microphone') return '上次访问时间：2026/10/14，20:40'
  if (row.key === 'location' || row.key === 'camera') return '上次访问时间：18:50'
  return ''
}
function back() {
  if (menuOpen.value) {menuOpen.value = false;return}
  if (subpageStack.value.length) {
    const previous=subpageStack.value.pop()
    usagePermission.value=previous.usage;permissionSheet.value=previous.editor;managerPermission.value=previous.manager
    privacy.selectedApp=previous.app;privacy.selectedPermission=previous.permission;allPermissions.value=previous.all
    nextTick(()=>scroll.value?.scrollTo({top:previous.scrollTop}));return
  }
  if (allPermissions.value) {allPermissions.value = false;return}
  if (usagePermission.value) {usagePermission.value = null;return}
  privacy.page = page.value === 'settings' && privacy.returnPage === 'history' ? 'history' : null
}
function setPermission(value) {
  privacy.selectedPermission = permissionSheet.value.key
  privacy.setAccess(value)
}
function openUsage(row) {pushSubpage(()=>{usagePermission.value=row})}
function openApp(entry) {usagePermission.value = null;privacy.openSettings(entry.app,entry.permission,'history')}
function toggleHistoryPeriod() {historyDays.value = historyDays.value === 1 ? 7 : 1;menuOpen.value = false}
function toggleSystemApps() {showSystemApps.value = !showSystemApps.value;menuOpen.value = false}
function openAllPermissions() {allPermissions.value = true;menuOpen.value = false;scroll.value?.scrollTo({top:0})}
watch(() => page.value, () => {
  permissionSheet.value = null;managerPermission.value=null;subpageStack.value=[]; menuOpen.value = false; usagePermission.value = null;allPermissions.value = false
  scroll.value?.scrollTo({top:0})
})
useBackHandler(() => {
  if (privacy.page === 'detail') return false
  back();return true
})
defineExpose({ back, openUsage, openPermission, openManager })
</script>

<template>
 <div class="privacy-settings-screen" data-testid="privacy-settings-screen" @keydown.esc.stop.prevent="back">
  <div class="settings-status" aria-hidden="true"></div>
  <header class="settings-navigation">
   <button class="settings-back" :aria-label="subpageStack.length?'返回上一页':page==='settings' && privacy.returnPage==='history'?'返回隐私信息中心':'返回桌面'" @click="back"><img :src="backIcon" alt="" width="21" height="21"/></button>
   <h2>{{ title }}</h2>
   <button v-if="!permissionSheet || managerPermission" class="settings-overflow" aria-label="更多选项" aria-haspopup="menu" :aria-expanded="menuOpen" @click="menuOpen=!menuOpen"><LIcon name="moreVertical" :size="22"/></button>
   <div v-if="menuOpen" class="settings-menu" role="menu" aria-label="更多选项">
    <button v-if="page==='settings'" role="menuitem" @click="openAllPermissions">所有权限</button>
    <template v-else>
     <button role="menuitemcheckbox" :aria-checked="showSystemApps" @click="toggleSystemApps"><span>显示系统应用</span><LIcon v-if="showSystemApps" name="check" :size="15"/></button>
     <button role="menuitem" @click="toggleHistoryPeriod">{{ historyDays===1?'显示过去7天内的访问记录':'显示过去24小时内的访问记录' }}</button>
    </template>
   </div>
  </header>
  <div v-if="menuOpen" class="settings-menu-dismiss" @click="menuOpen=false" @pointerdown.stop></div>
  <main ref="scroll" class="settings-scroll" :key="subpageKey" :class="{'timeline-scroll':usagePermission && !permissionSheet && !managerPermission}" data-testid="privacy-settings-scroll">
   <template v-if="managerPermission">
    <div class="permission-manager-hero"><SettingsPermissionIcon :permission="managerPermission.key"/><h3>{{ managerPermission.label }}</h3><p>{{ PERMISSION_DESCRIPTIONS[managerPermission.key] || `具有此权限的应用可以访问${managerPermission.label}` }}</p></div>
    <section v-for="group in managerGroups" :key="group.key" class="settings-section">
     <h3>{{ group.label }}</h3>
     <div class="settings-list"><button v-for="row in group.rows" :key="row.app" class="settings-row manager-app-row" @click="openManagerApp(row)"><PrivacyReferenceAppIcon :app="row.app" :size="30"/><span class="settings-row-text"><span>{{ appName(row.app) }}</span><small v-if="row.lastAccess">上次访问时间：{{ row.lastAccess }}</small></span></button><p v-if="!group.rows.length" class="settings-row empty-permissions">未允许任何应用</p></div>
    </section>
   </template>
   <template v-else-if="permissionSheet">
    <div class="app-permissions-hero"><PrivacyReferenceAppIcon :app="privacy.selectedApp || 'camera'" :size="55"/><h3>{{ currentAppName }}</h3></div>
    <section class="settings-section permission-editor-section"><h3>是否允许此应用获得“{{ permissionSheet.label }}”权限</h3><div class="settings-list" role="radiogroup" :aria-label="`${permissionSheet.label}访问权限`"><button v-for="option in [{value:'allow',label:'仅在使用该应用时允许'},{value:'ask',label:'每次都询问'},{value:'deny',label:'不允许'}]" :key="option.value" class="settings-row permission-radio-row" role="radio" :aria-checked="selectedAccess===option.value" @click="setPermission(option.value)"><span class="permission-radio" :class="{checked:selectedAccess===option.value}"></span><span>{{ option.label }}</span></button></div></section>
    <button class="view-permission-apps" @click="openManager(permissionSheet)">查看具有此权限的所有应用</button>
   </template>
   <template v-else-if="page === 'settings' && allPermissions">
    <h3 class="dashboard-section-title">{{ currentAppName }}</h3>
    <div class="settings-list"><button v-for="row in [...appRows,{key:'nearby',label:'附近的设备'}]" :key="row.key" class="settings-row" @click="openPermission(row)"><SettingsPermissionIcon :permission="row.key"/><span class="settings-row-text"><span>{{ row.label }}</span><small>{{ denied(row)?'不允许':row.key==='nearby'?'已允许（以便应用正常运行）':'已允许' }}</small></span></button></div>
   </template>
   <template v-else-if="page === 'settings'">
    <div class="app-permissions-hero"><PrivacyReferenceAppIcon :app="privacy.selectedApp || 'camera'" :size="55"/><h3>{{ currentAppName }}</h3></div>
    <section class="settings-section">
     <h3>已允许</h3>
     <div class="settings-list">
      <button v-for="row in allowedRows" :key="row.key" class="settings-row" @click="openPermission(row)"><SettingsPermissionIcon :permission="row.key"/><span class="settings-row-text"><span>{{ row.label }}</span><small v-if="lastAccess(row)">{{ lastAccess(row) }}</small></span></button>
      <p v-if="!allowedRows.length" class="settings-row empty-permissions">未允许任何权限</p>
     </div>
    </section>
    <section class="settings-section">
     <h3>已允许（以便应用正常运行）</h3>
     <div class="settings-list"><button class="settings-row" @click="openPermission({key:'nearby',label:'附近的设备'})"><SettingsPermissionIcon permission="nearby"/><span>附近的设备</span></button></div>
    </section>
    <section class="settings-section">
     <h3>不允许</h3>
     <div class="settings-list">
      <button v-for="row in deniedRows" :key="row.key" class="settings-row" @click="openPermission(row)"><SettingsPermissionIcon :permission="row.key"/><span>{{ row.label }}</span></button>
      <p v-if="!deniedRows.length" class="settings-row empty-permissions">未拒绝任何权限</p>
     </div>
    </section>
    <section class="settings-section">
     <h3>闲置应用设置</h3>
     <div class="settings-list"><button class="settings-row idle-app-row" role="switch" :aria-checked="idleEnabled" @click="idleEnabled=!idleEnabled"><span class="settings-row-text"><span>管理闲置应用</span><small>撤销权限、删除临时文件、停收通知并归档应用</small></span><span class="idle-toggle" :class="{on:idleEnabled}"><span><LIcon v-if="idleEnabled" name="check" :size="12"/></span></span></button></div>
    </section>
    <div class="settings-information"><LIcon name="info" :size="19"/><p>为了保护您的数据，如果您连续几个月未使用此应用，系统会移除其以下权限：位置信息</p><strong>已允许以确保应用正常运行</strong><p>为了让应用保持运行，系统可能会允许其访问您的本地网络，并仅与此网络中的设备连接。</p><p>除非您允许该应用查找并连接到附近的所有设备，否则该应用无法使用蓝牙和其他技术连接到设备。</p></div>
   </template>
   <template v-else-if="!usagePermission">
    <h3 class="dashboard-section-title">应用权限</h3>
    <div class="dashboard-chart" :class="{expanded}" role="img" :aria-label="`${periodLabel}，相机、麦克风及位置信息${expanded?'及其他权限':''}使用情况`">
     <svg viewBox="0 0 260 220" aria-hidden="true"><g transform="rotate(-60 130 110)" fill="none" stroke-width="7"><circle cx="130" cy="110" r="77" stroke="#56585d"/><circle cx="130" cy="110" r="77" stroke="#398bff" stroke-dasharray="69 415" stroke-dashoffset="-2"/><circle cx="130" cy="110" r="77" stroke="#002855" stroke-dasharray="106 378" stroke-dashoffset="-74"/><circle v-if="expanded" cx="130" cy="110" r="77" stroke="#8c8e94" stroke-dasharray="194 290" stroke-dashoffset="-287"/></g><text x="130" y="113" text-anchor="middle" dominant-baseline="middle">{{ periodLabel }}</text></svg>
     <span class="chart-camera">相机</span><span class="chart-microphone">麦克风</span><span class="chart-location">位置信息</span><span v-if="expanded" class="chart-other">其他</span>
    </div>
    <div class="settings-list dashboard-permissions">
     <button v-for="row in dashboardRows" :key="row.key" class="settings-row" :class="{unused:!row.count}" @click="openUsage(row)"><SettingsPermissionIcon :permission="row.key"/><span class="settings-row-text"><span>{{ row.label }}</span><small>{{ row.count ? `有 ${row.count} 个应用使用过` : `${periodLabel}内未使用过` }}</small></span></button>
    </div>
    <button class="show-other-permissions" :aria-expanded="expanded" @click="expanded=!expanded"><LIcon name="chevronDown" :style="{transform:expanded?'rotate(180deg)':'none'}" :size="20"/>{{ expanded?'收起其他权限':'查看其他权限' }}</button>
    <section class="settings-section ai-section"><h3>AI 助理活动记录</h3><div class="settings-list"><div class="settings-row google-row"><img :src="googleIcon" width="32" height="32" alt="Google"/><span class="settings-row-text"><span>Google</span><small>{{ periodLabel }}内无访问记录</small></span></div></div></section>
   </template>
   <template v-else>
    <div class="timeline-description">{{ periodLabel }}内应用使用“{{ usagePermission.label }}”权限的时间轴</div>
    <section v-for="group in timelineGroups" :key="group.day" class="settings-section timeline-section"><h3>{{ group.day }}</h3><div class="settings-list timeline-list"><button v-for="(entry,index) in group.rows" :key="index" class="timeline-row" @click="openApp(entry)"><time>{{ entry.time }}</time><span class="timeline-icon-column"><PrivacyReferenceAppIcon :app="entry.app" :size="26"/><span class="timeline-dots" aria-hidden="true"></span></span><span class="settings-row-text"><span>{{ appName(entry.app) }}</span><small v-if="entry.duration">{{ entry.duration }}</small></span></button></div></section>
    <p v-if="!timelineGroups.length" class="timeline-description">暂无近期权限使用记录</p>
   </template>
  </main>
  <button v-if="usagePermission && !permissionSheet && !managerPermission" class="timeline-manage-button" @click="openManager(usagePermission)"><LIcon name="settings" :size="20"/>管理权限</button>
 </div>
</template>

<style scoped>
.privacy-settings-screen{position:absolute;inset:0;background:#efefef;color:#151515;display:flex;flex-direction:column;font-family:var(--font-stack);overflow:hidden}
.settings-status{height:47px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:7px 24px 0;font-size:15px;font-weight:600;box-sizing:border-box}.settings-status-icons{display:flex;align-items:center;gap:5px}
.settings-navigation{position:relative;flex:none;display:flex;align-items:center;gap:16px;padding:4px 14px 10px;min-height:45px;box-sizing:border-box}.settings-navigation h2{font-size:21px;font-weight:500;line-height:1.4;margin:0;flex:1}.settings-back{width:36px;height:36px;border:0;border-radius:50%;background:#e5e5e5;display:grid;place-items:center;cursor:pointer}.settings-back img{filter:brightness(0);opacity:.7}.settings-overflow{position:relative;z-index:6;display:grid;place-items:center;width:27px;height:34px;background:none;border:0;color:#fff;cursor:pointer}.settings-menu{position:absolute;right:15px;top:45px;z-index:5;min-width:130px;max-width:calc(100% - 30px);padding:5px 0;border-radius:12px;background:white;box-shadow:0 5px 20px #0003}.settings-menu button{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;border:0;background:none;padding:14px 16px;color:#333;text-align:left;white-space:nowrap;font:400 12px/1.4 var(--font-stack);cursor:pointer}.settings-menu button:hover{background:#f2f2f2}.settings-menu-dismiss{position:absolute;inset:0;z-index:3;background:transparent}
.settings-scroll{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:none;padding:0 14px 42px;touch-action:pan-y}.settings-scroll::-webkit-scrollbar{display:none}.app-permissions-hero{display:flex;flex-direction:column;align-items:center;padding:32px 0 67px}.app-permissions-hero h3{font-size:20px;font-weight:600;margin:14px 0 0;line-height:1.4}
.settings-section{margin:0 0 25px}.settings-section h3,.dashboard-section-title{font-size:12px;line-height:1.5;font-weight:500;color:#0787ff;margin:0 7px 9px}.settings-list{border-radius:21px;overflow:hidden;display:flex;flex-direction:column;gap:2px}.settings-row{box-sizing:border-box;display:flex;align-items:center;gap:16px;width:100%;min-height:65px;margin:0;padding:17px 22px;background:#fafafa;border:0;text-align:left;color:#161616;font:400 15px/1.4 var(--font-stack);cursor:pointer}.settings-row:active{background:#e8e8e8}.settings-row-text{display:flex;flex-direction:column;flex:1;min-width:0;gap:2px}.settings-row-text small{font-size:12px;color:#555;line-height:1.4}.empty-permissions{padding:21px 15px}.idle-app-row{padding:17px 15px;gap:10px}.idle-toggle{display:flex;align-items:center;padding:3px;width:47px;height:27px;box-sizing:border-box;border-radius:99px;background:#bcbec2;flex:none}.idle-toggle.on{background:#0787ff;justify-content:flex-end}.idle-toggle>span{width:21px;height:21px;border-radius:50%;background:white;display:grid;place-items:center;color:#0787ff}.settings-information{padding:14px 7px 0;font-size:12px;line-height:1.45;color:#555}.settings-information p{margin:12px 0}.settings-information strong{display:block;font-weight:600;margin:16px 0}.settings-home-indicator{position:absolute;bottom:7px;left:35%;width:30%;height:4px;border-radius:99px;background:#b8b8b8;pointer-events:none}
.dashboard-section-title{margin-top:27px}.dashboard-chart{position:relative;width:100%;height:225px;margin:14px 0 18px}.dashboard-chart svg{width:100%;height:100%}.dashboard-chart text{fill:#202020;font:14px var(--font-stack)}.dashboard-chart>span{position:absolute;font-size:14px;line-height:1.3}.chart-camera{top:38px;right:14%}.chart-microphone{bottom:37px;right:9%}.chart-location{top:43%;left:4%}.dashboard-chart.expanded .chart-location{top:auto;bottom:4px;left:auto;right:14%}.chart-other{top:45px;left:15%}.dashboard-chart.expanded .chart-microphone{bottom:auto;top:79px;right:4%}.dashboard-chart.expanded .chart-camera{right:18%;top:20px}.dashboard-permissions .settings-row{min-height:66px}.settings-row.unused .settings-row-text,.settings-row.unused small{color:#bebebe}.settings-row.unused .settings-permission-icon{opacity:.75}.show-other-permissions{margin:10px 0 34px;display:flex;align-items:center;gap:12px;border:0;border-radius:99px;background:#fafafa;padding:17px 24px;font:400 13px var(--font-stack);cursor:pointer}.ai-section h3{margin-bottom:10px}.google-row{gap:14px;padding:17px}.google-row .settings-row-text>span{font-size:18px}.ai-section{margin-bottom:10px}
.permission-radio-row{gap:21px;padding:20px 23px;min-height:65px}.permission-radio{width:18px;height:18px;border:1.7px solid #48494d;border-radius:50%;box-sizing:border-box;flex:none}.permission-radio.checked{border:2px solid #0787ff;box-shadow:inset 0 0 0 3px #fafafa;background:#0787ff}.view-permission-apps{background:none;border:0;padding:0;margin:0 0 28px;color:#48494d;font:400 13px/1.5 var(--font-stack);text-align:left;cursor:pointer}.permission-editor-section{margin-bottom:25px}.permission-manager-hero{display:flex;flex-direction:column;align-items:center;text-align:center;padding:25px 0 40px}.permission-manager-hero>.settings-permission-icon{width:32px;height:32px}.permission-manager-hero :deep(svg){width:28px;height:28px}.permission-manager-hero h3{font-size:20px;font-weight:500;margin:14px 0 16px}.permission-manager-hero p{font-size:13px;line-height:1.5;color:#48494d;margin:0}.manager-app-row{padding:17px;gap:14px}.timeline-scroll{padding-bottom:100px}.timeline-description{background:#fafafa;border-radius:21px;padding:25px 14px;color:#48494d;font-size:12px;line-height:1.6;margin:0 0 25px}.timeline-section h3{margin-bottom:9px}.timeline-section{margin-bottom:25px}.timeline-row{display:flex;align-items:flex-start;gap:13px;min-height:76px;padding:17px 14px 0;box-sizing:border-box;width:100%;border:0;background:#fafafa;text-align:left;font:400 15px/1.4 var(--font-stack);color:#161616;cursor:pointer}.timeline-row time{width:48px;flex:none;font-size:12px;line-height:26px;color:#48494d}.timeline-icon-column{position:relative;width:30px;min-height:57px;flex:none}.timeline-dots{position:absolute;top:35px;bottom:0;left:12px;border-left:2px dotted #ccc}.timeline-row .settings-row-text{padding-left:2px;line-height:26px}.timeline-row .settings-row-text small{font-size:12px;line-height:1.4;margin-top:0;color:#48494d}.timeline-manage-button{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:11px;border:0;border-radius:99px;background:#dedee2;padding:13px 18px;box-shadow:0 5px 13px #0002;color:#111;white-space:nowrap;font:400 13px/1.4 var(--font-stack);cursor:pointer}
button:focus-visible{outline:2px solid #0787ff;outline-offset:-2px}
</style>
