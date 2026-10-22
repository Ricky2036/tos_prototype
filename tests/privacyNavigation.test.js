import test from 'node:test'
import assert from 'node:assert/strict'
import {reactive,effectScope,nextTick} from 'vue'
import {usePrivacyNavigation} from '../src/composables/usePrivacyNavigation.js'

function setup() {
 const privacy=reactive({page:'detail',settingsPage:null,selectedApp:'camera'})
 const system=reactive({overlays:{controlCenter:{status:'open',progress:1}},requestCloseOverlay(){this.overlays.controlCenter.status='closing'},settleOverlay(name,open){this.overlays[name]={status:open?'open':'closed',progress:open?1:0}},beginSettle(name,progress){this.overlays[name]={status:'settling',progress}}})
 const scope=effectScope();const nav=scope.run(()=>usePrivacyNavigation(privacy,system))
 return {privacy,system,scope,nav}
}
test('先上滑收起列表与控制中心，到位后才显示目标页面',async()=>{
 for(const target of ['settings','history']){
  const x=setup();x.privacy.page=target;await nextTick()
  assert.equal(x.nav.displayedPage.value,'detail');assert.equal(x.system.overlays.controlCenter.status,'closing')
  x.system.overlays.controlCenter.progress=.4;assert.equal(x.nav.departureStyle.value.transform,'translateY(-60%)')
  x.system.settleOverlay('controlCenter',false);await nextTick()
  assert.equal(x.nav.displayedPage.value,target);assert.equal(x.nav.phase.value,'opening-page')
  assert.equal(x.nav.departureStyle.value.transform,'translateY(-100%)')
  x.nav.onDestinationEntered();assert.equal(x.nav.phase.value,'page');x.scope.stop()
 }
})
test('目标页返回后收起页面，控制中心保持关闭且不恢复权限列表',async()=>{
 for(const target of ['settings','history']){
  const x=setup();x.privacy.page=target;await nextTick();x.system.settleOverlay('controlCenter',false);await nextTick()
  assert.equal(x.privacy.page,target);x.nav.onDestinationEntered()
  x.privacy.page=null;await nextTick()
  assert.equal(x.nav.displayedPage.value,null);assert.equal(x.system.overlays.controlCenter.status,'closed')
  assert.equal(x.nav.phase.value,'idle');x.scope.stop()
 }
})
test('兼容旧返回详情请求，也不会重新展开控制中心',async()=>{
 const x=setup();x.privacy.page='settings';await nextTick();x.system.settleOverlay('controlCenter',false);await nextTick()
 x.privacy.page='detail';await nextTick();await nextTick()
 assert.equal(x.privacy.page,null);assert.equal(x.nav.displayedPage.value,null);assert.equal(x.system.overlays.controlCenter.status,'closed');x.scope.stop()
})
test('清空或取消跳转后，关闭动画结束不再打开旧目标',async()=>{
 const x=setup();x.privacy.page='history';await nextTick();x.privacy.page=null;await nextTick()
 x.system.settleOverlay('controlCenter',false);await nextTick()
 assert.equal(x.nav.displayedPage.value,null);assert.equal(x.nav.phase.value,'idle');x.scope.stop()
})

async function enterSettings(x,target='settings') {
 x.privacy.page=target;await nextTick()
 x.system.settleOverlay('controlCenter',false);await nextTick()
 x.nav.onDestinationEntered()
}
test('应用页下拉并收起控制中心不会丢失底层页面',async()=>{
 const x=setup();await enterSettings(x)
 x.system.settleOverlay('controlCenter',true);await nextTick()
 assert.equal(x.privacy.settingsPage,'settings');assert.equal(x.privacy.page,'settings')
 x.system.settleOverlay('controlCenter',false);await nextTick()
 assert.equal(x.privacy.settingsPage,'settings');assert.equal(x.nav.displayedPage.value,'settings')
 x.scope.stop()
})
test('应用页上方打开并返回权限列表，保留应用页且不触发应用关闭动画',async()=>{
 const x=setup();await enterSettings(x,'history')
 const revision=x.nav.destinationRevision.value
 x.system.settleOverlay('controlCenter',true);x.privacy.page='detail';await nextTick()
 assert.equal(x.nav.displayedPage.value,'detail');assert.equal(x.privacy.settingsPage,'history')
 x.nav.closeDetail();await nextTick()
 assert.equal(x.privacy.page,'history');assert.equal(x.privacy.settingsPage,'history')
 assert.equal(x.system.overlays.controlCenter.status,'open');assert.equal(x.nav.destinationRevision.value,revision)
 assert.equal(x.nav.phase.value,'page');x.scope.stop()
})
test('从应用页上方的权限列表关闭控制中心，回到原应用页面',async()=>{
 const x=setup();await enterSettings(x)
 x.system.settleOverlay('controlCenter',true);x.privacy.page='detail';await nextTick()
 x.system.settleOverlay('controlCenter',false);await nextTick()
 assert.equal(x.privacy.page,'settings');assert.equal(x.privacy.settingsPage,'settings')
 x.scope.stop()
})
test('在应用页上方从胶囊跳转另一应用权限，沿用控制中心收起流程',async()=>{
 const x=setup();await enterSettings(x)
 const revision=x.nav.destinationRevision.value
 x.system.settleOverlay('controlCenter',true);x.privacy.page='detail';await nextTick()
 x.privacy.selectedApp='maps';x.privacy.page='settings';await nextTick()
 assert.equal(x.nav.phase.value,'closing-control')
 x.system.settleOverlay('controlCenter',false);await nextTick()
 assert.equal(x.privacy.settingsPage,'settings');assert.equal(x.nav.destinationRevision.value,revision+1)
 x.privacy.page=null;await nextTick();assert.equal(x.privacy.settingsPage,null)
 x.scope.stop()
})

test('重复打开已有应用权限或隐私信息中心，收起控制中心后复用页面且不重新缩放',async()=>{
 for(const target of ['settings','history']) {
  const x=setup();await enterSettings(x,target)
  const revision=x.nav.destinationRevision.value
  x.system.settleOverlay('controlCenter',true);x.privacy.page='detail';await nextTick()
  x.privacy.page=target;await nextTick()
  assert.equal(x.system.overlays.controlCenter.status,'closing')
  x.system.settleOverlay('controlCenter',false);await nextTick()
  assert.equal(x.nav.destinationRevision.value,revision)
  assert.equal(x.nav.phase.value,'page');assert.equal(x.nav.displayedPage.value,target)
  assert.equal(x.nav.departureStyle.value.transform,'translateY(-100%)')
  x.scope.stop()
 }
})
test('关闭目标页面后再次打开，仍保留首次打开的缩放过渡',async()=>{
 const x=setup();await enterSettings(x)
 const revision=x.nav.destinationRevision.value
 x.privacy.page=null;await nextTick()
 x.system.settleOverlay('controlCenter',true);x.privacy.page='detail';await nextTick()
 x.privacy.page='settings';await nextTick();x.system.settleOverlay('controlCenter',false);await nextTick()
 assert.equal(x.nav.destinationRevision.value,revision+1);assert.equal(x.nav.phase.value,'opening-page')
 x.scope.stop()
})

test('从桌面打开目标页使用中心缩放',async()=>{
 for(const target of ['settings','history']) {
  const x=setup();await enterSettings(x,target)
  assert.equal(x.nav.destinationTransition.value,'privacy-destination');x.scope.stop()
 }
})
test('已有相关页面时，从权限列表打开新页面使用右侧滑入',async()=>{
 for(const [from,to] of [['settings','history'],['history','settings']]) {
  const x=setup();await enterSettings(x,from)
  const revision=x.nav.destinationRevision.value
  x.system.settleOverlay('controlCenter',true);x.privacy.page='detail';await nextTick()
  x.privacy.page=to;await nextTick();x.system.settleOverlay('controlCenter',false);await nextTick()
  assert.equal(x.nav.destinationTransition.value,'privacy-page-slide')
  assert.equal(x.nav.destinationRevision.value,revision+1)
  x.nav.onDestinationEntered();x.privacy.page=null;await nextTick()
  assert.equal(x.nav.destinationTransition.value,'privacy-destination');x.scope.stop()
 }
})
test('已有应用权限页打开另一应用权限，也使用右侧滑入',async()=>{
 const x=setup();await enterSettings(x)
 x.system.settleOverlay('controlCenter',true);x.privacy.page='detail';await nextTick()
 x.privacy.selectedApp='maps';x.privacy.page='settings';await nextTick()
 x.system.settleOverlay('controlCenter',false);await nextTick()
 assert.equal(x.nav.destinationTransition.value,'privacy-page-slide');x.scope.stop()
})
test('相关页面之间直接跳转也使用右侧滑入',async()=>{
 const x=setup();await enterSettings(x,'history')
 const revision=x.nav.destinationRevision.value
 x.privacy.page='settings';await nextTick()
 assert.equal(x.nav.destinationTransition.value,'privacy-page-slide')
 assert.equal(x.nav.destinationRevision.value,revision+1);x.scope.stop()
})
