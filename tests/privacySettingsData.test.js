import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { usePrivacyStore } from '../src/stores/privacyStore.js'
import { appPermissionRows, PRIVACY_DASHBOARD_ROWS, LOCATION_TIMELINE, permissionAppGroups } from '../src/utils/privacySettingsData.js'

test('位置时间轴包含截图今天昨天的全部记录及分钟说明',()=>{
 assert.equal(LOCATION_TIMELINE.filter(row=>row.day==='今天').length,8)
 assert.equal(LOCATION_TIMELINE.filter(row=>row.day==='昨天').length,8)
 assert.equal(LOCATION_TIMELINE.filter(row=>row.duration==='2 分钟').length,3)
 assert.equal(LOCATION_TIMELINE[0].time,'11:21');assert.equal(LOCATION_TIMELINE.at(-1).time,'13:55')
})
test('权限应用列表按允许状态分组，改权限后移动应用并保持应用唯一',()=>{
 const groups=permissionAppGroups('microphone',{'recorder:microphone':'deny'},['camera','camera'])
 assert.equal(groups[0].key,'always');assert.equal(groups[0].rows.length,0)
 assert.ok(groups.find(group=>group.key==='deny').rows.some(row=>row.app==='recorder'))
 assert.ok(!groups.find(group=>group.key==='allow').rows.some(row=>row.app==='recorder'))
 assert.equal(groups.flatMap(group=>group.rows).filter(row=>row.app==='camera').length,1)
})

test('应用权限页按所属应用提供权限，录音机不提供相机权限',()=>{
 assert.deepEqual(appPermissionRows('camera').map(row=>row.key),['microphone','notifications','location','camera'])
 assert.deepEqual(appPermissionRows('recorder').map(row=>row.key),['microphone','notifications','location'])
 assert.deepEqual(appPermissionRows('maps').map(row=>row.key),['microphone','notifications','location','camera'])
})
test('隐私信息中心包含长图所有14项，首屏仅3项敏感权限',()=>{
 assert.equal(PRIVACY_DASHBOARD_ROWS.length,14)
 assert.deepEqual(PRIVACY_DASHBOARD_ROWS.slice(0,3).map(row=>row.key),['location','camera','microphone'])
 assert.equal(PRIVACY_DASHBOARD_ROWS.find(row=>row.key==='nearby').count,8)
 assert.equal(PRIVACY_DASHBOARD_ROWS.filter(row=>row.count===0).length,6)
})
test('进入应用权限页保留应用归属和返回来源，拒绝仅停止所属应用权限',()=>{
 setActivePinia(createPinia());const s=usePrivacyStore()
 s.start('maps',['camera','location'],1000);s.start('camera',['camera'],2000)
 s.openSettings('maps','camera','history');assert.equal(s.page,'settings');assert.equal(s.selectedApp,'maps');assert.equal(s.returnPage,'history')
 s.setAccess('deny');assert.ok(s.active.some(e=>e.app==='camera'&&e.permission==='camera'));assert.ok(s.active.some(e=>e.app==='maps'&&e.permission==='location'))
 assert.ok(!s.active.some(e=>e.app==='maps'&&e.permission==='camera'))
})
