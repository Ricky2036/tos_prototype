import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { usePrivacyStore, dominantPermission, PERMISSION_APP_SCENARIOS } from '../src/stores/privacyStore.js'
function store(){setActivePinia(createPinia()); return usePrivacyStore()}
test('按应用提供指定单项及六种组合，组合不改变其他应用使用状态',()=>{
 assert.deepEqual(PERMISSION_APP_SCENARIOS.map(s=>[s.app,s.permissions,s.combinations]),[
  ['camera',['camera','microphone','location'],[['camera','microphone'],['camera','location'],['camera','microphone','location']]],
  ['recorder',['microphone','location'],[]],
  ['maps',['camera','microphone','location'],[['camera','microphone'],['microphone','location'],['camera','microphone','location']]]
 ])
 for(const scenario of PERMISSION_APP_SCENARIOS) for(const keys of scenario.combinations){
  const s=store();s.start('recorder',['microphone'],1000);s.start(scenario.app,keys,2000)
  assert.equal(s.active.filter(e=>e.app===scenario.app).length,keys.length)
  assert.ok(s.active.some(e=>e.app==='recorder'))
  assert.equal(s.statusPrimary,dominantPermission(keys))
 }
})
test('按应用停止单项权限不影响其他应用调用同一权限',()=>{
 const s=store();s.start('camera',['microphone'],1000);s.start('recorder',['microphone'],2000)
 s.stop('camera',['microphone'],3000)
 assert.deepEqual(s.active.map(e=>e.app),['recorder']);assert.deepEqual(s.statusKeys,['microphone'])
})
test('权限详情应用顺序与胶囊一致，停止和恢复调用后仍一致',()=>{
 const s=store();s.startMappedPermissions(['microphone'],1000);s.startMappedPermissions(['camera','location'],2000)
 assert.deepEqual(s.groups.map(g=>g.app),s.summary.apps)
 s.stop(null,['microphone'],3000);assert.deepEqual(s.groups.map(g=>g.app),s.summary.apps)
 s.startMappedPermissions(['microphone'],4000);assert.deepEqual(s.groups.map(g=>g.app),s.summary.apps)
})
test('清空权限调用提示同时清除正在使用、最近使用和详情，保留显示时长',()=>{
 const s=store();s.setIconDuration(5,0);s.startMappedPermissions(['camera','microphone'],1000)
 s.stop(null,['camera'],2000);s.openDetail();s.reset()
 assert.equal(s.active.length,0);assert.equal(s.recent.length,0);assert.equal(s.summary,null)
 assert.deepEqual(s.statusKeys,[]);assert.equal(s.statusExpanded,false);assert.equal(s.page,null)
 assert.equal(s.iconDurationSeconds,5)
})
test('组合权限由对应应用在同一批次调用，部分停止时保留其他应用',()=>{
 const s=store();s.startMappedPermissions(['location','microphone','camera'],1000)
 assert.deepEqual(s.active.map(e=>[e.app,e.permission]),[['maps','location'],['recorder','microphone'],['camera','camera']])
 assert.equal(new Set(s.active.map(e=>e.batch)).size,1);assert.equal(s.statusPrimary,'camera')
 assert.equal(s.summary.appCount,3)
 s.stop(null,['microphone'],2000)
 assert.deepEqual(s.summary.apps,['maps','recorder','camera']);assert.deepEqual(s.statusKeys,['camera','location'])
})
test('图标完整显示3秒，新增权限重新展开',()=>{
 const s=store();s.start('wechat',['microphone'],1000);assert.equal(s.statusExpanded,true)
 s.tick(3999);assert.equal(s.statusExpanded,true);s.tick(4000);assert.equal(s.statusExpanded,false)
 s.start('wechat',['camera'],4500);assert.equal(s.statusExpanded,true)
 assert.equal(dominantPermission(s.statusKeys),'camera')
})
test('胶囊混合展示使用中与20秒内停止的应用，背板由活跃权限取色',()=>{
 const s=store();s.start('wechat',['camera','microphone'],1000);s.start('maps',['location'],2000)
 assert.equal(s.summary.app,'maps');assert.equal(s.summary.primary,'location');assert.equal(s.summary.appCount,2)
 assert.deepEqual(s.summary.apps,['wechat','maps']);assert.deepEqual(s.summary.keys,['camera','microphone','location'])
 assert.equal(s.groups.find(g=>g.app==='wechat').entries.length,2)
 s.stop('maps',null,3000);assert.equal(s.summary.app,'wechat');assert.equal(s.summary.primary,'camera');assert.equal(s.active.length,2)
 assert.deepEqual(s.summary.apps,['wechat','maps']);assert.deepEqual(s.summary.keys,['camera','microphone','location'])
 s.tick(22999);assert.deepEqual(s.summary.apps,['wechat','maps']);assert.equal(s.summary.isActive,true)
 s.tick(23000);assert.deepEqual(s.summary.apps,['wechat']);assert.deepEqual(s.summary.keys,['camera','microphone'])
})
test('组合开始调用保留其他权限，全部停止后保留各自20秒且去除背板',()=>{
 const s=store();s.startMappedPermissions(['location'],1000);s.startMappedPermissions(['camera','microphone'],2000)
 assert.equal(s.active.length,3);assert.equal(s.statusPrimary,'camera')
 s.stop(null,['camera'],3000);assert.equal(s.summary.isActive,true);assert.equal(s.summary.primary,'microphone')
 s.stop(null,['microphone','location'],4000);assert.equal(s.summary.isActive,false);assert.equal(s.summary.keys.length,3)
 s.tick(23000);assert.deepEqual(s.summary.keys,['microphone','location']);s.tick(24000);assert.equal(s.summary,null)
})
test('停止后弱化展示恰好20秒，过期后历史仍可追溯',()=>{
 const s=store();s.start('recorder',['microphone'],1000);s.stop(null,null,2000)
 assert.equal(s.statusKeys.length,0);assert.equal(s.summary.isActive,false)
 s.tick(21999);assert.ok(s.summary);s.tick(22000);assert.equal(s.summary,null);assert.equal(s.groups.length,0);assert.equal(s.history.length,1)
})
test('单应用多权限部分停止后保留其他权限，拒绝权限阻止重新调用',()=>{
 const s=store();s.start('wechat',['camera','microphone'],1000);s.openSettings('wechat','camera');s.setAccess('deny')
 assert.deepEqual(s.active.map(e=>e.permission),['microphone']);s.start('wechat',['camera'],Date.now());assert.equal(s.active.length,1)
 s.setAccess('allow');s.start('wechat',['camera']);assert.equal(s.active.length,2)
})
test('重复调用不重启3秒展开，不重复计入最近记录',()=>{
 const s=store();s.start('camera',['camera'],1000);s.start('camera',['camera'],3000);assert.equal(s.expandedUntil,4000)
 s.stop(null,null,5000);s.stop(null,null,6000);assert.equal(s.history.length,1)
})
test('先后调用以最新一批权限取色，停止最新权限回到仍活跃的一批',()=>{
 const s=store();s.start('camera',['camera'],1000);s.start('recorder',['microphone'],2000)
 assert.equal(s.statusPrimary,'microphone')
 assert.equal(s.summary.primary,s.statusPrimary)
 s.start('maps',['location'],3000);assert.equal(s.statusPrimary,'location')
 assert.equal(s.summary.primary,s.statusPrimary)
 s.stop('maps',null,4000);assert.equal(s.statusPrimary,'microphone')
 assert.equal(s.summary.primary,s.statusPrimary)
 s.stop('recorder',null,5000);assert.equal(s.statusPrimary,'camera')
})
test('四种同时调用组合按相机、麦克风、位置优先级取色，与参数顺序无关',()=>{
 for(const [keys,expected] of [
  [['microphone','camera'],'camera'],
  [['location','camera'],'camera'],
  [['location','microphone'],'microphone'],
  [['location','microphone','camera'],'camera']
 ]){const s=store();s.start('wechat',keys,1000);assert.equal(s.statusPrimary,expected);assert.equal(new Set(s.active.map(e=>e.batch)).size,1)}
})
test('1、2、3、5秒时长均在对应时刻收缩，新调用采用所选时长',()=>{
 for(const seconds of [1,2,3,5]){
  const s=store();s.setIconDuration(seconds,0);s.start('camera',['camera'],1000)
  s.tick(1000+seconds*1000-1);assert.equal(s.statusExpanded,true)
  s.tick(1000+seconds*1000);assert.equal(s.statusExpanded,false)
 }
})
test('切换时长时活跃权限重新展开，不增加调用记录、不影响20秒近期窗口',()=>{
 const s=store();s.start('recorder',['microphone'],1000);s.tick(5000)
 s.setIconDuration(5,5000);assert.equal(s.statusExpanded,true);assert.equal(s.expandedUntil,10000);assert.equal(s.active.length,1)
 s.setIconDuration(4,6000);assert.equal(s.iconDurationSeconds,5);assert.equal(s.expandedUntil,10000)
 s.stop(null,null,7000);s.tick(26999);assert.ok(s.summary);s.tick(27000);assert.equal(s.summary,null)
})
