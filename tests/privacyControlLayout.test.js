import test from 'node:test'
import assert from 'node:assert/strict'
import { PRIVACY_CONTROL_ITEMS } from '../src/utils/privacyControlLayout.js'
import { packLayout, isOverlapping } from '../src/components/system/cc/ccLayout.js'
test('参考图按钮布局：八行，所有按钮坐标、跨度一致且无重叠',()=>{
 const layout=packLayout(PRIVACY_CONTROL_ITEMS)
 const expected=[['wifi',0,0,2,1],['data',0,2,2,1],['mediaPlayer',1,0,2,2],['mediaControls',1,2,2,2],['joyConnect',3,0,2,1],['joyHeart',3,2,2,1],['bluetooth',4,0,2,1],['hotspot',4,2,1,1],['airplane',4,3,1,1],['location',5,0,1,1],['screenshot',5,1,1,1],['darkMode',5,2,2,1],['dnd',6,0,1,1],['sound',6,1,1,1],['rotationLock',6,2,1,1],['screenRecord',6,3,1,1],['batterySaver',7,0,1,1],['boost',7,1,1,1],['share',7,2,1,1],['cast',7,3,1,1]]
 assert.deepEqual(layout.map(i=>[i.id,i.r,i.c,i.w,i.h]),expected)
 for(let a=0;a<layout.length;a++)for(let b=a+1;b<layout.length;b++)assert.equal(isOverlapping(layout[a],layout[b]),false)
})
