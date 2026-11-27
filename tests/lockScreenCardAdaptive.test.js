import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 锁屏通知卡片高度自适应回归守卫。
 *
 * 背景：阔直板（426pt）比直板（360pt）宽，描述文案经常 1 行就放得下；
 * 卡片高度如果继续写死 90px，文字只占卡片上半截，下半截空出一大块。
 * 现在卡片高度由内容撑开（实测 1 行 68、2 行 85），实测值再回喂给堆叠/滚动几何。
 *
 * 这些断言钉住三条契约：
 *   1. 卡片包装器不再是固定高度，通知卡片走 auto；
 *   2. 表层卡片默认在文档流内（内容撑高），只有活动卡片仍铺满固定高度；
 *   3. 高度实测入口存在并被挂到布局计算上，而不是写死常量。
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const lockScreenPath = path.resolve(__dirname, '../src/components/system/LockScreen.vue')
const lockScreen = fs.readFileSync(lockScreenPath, 'utf8')

test('lock screen notification cards take their height from content', () => {
  assert.match(lockScreen, /\.ls-card-wrapper\s*\{[^}]*height:\s*auto;/s, 'ls-card-wrapper must not pin a fixed height')
  assert.doesNotMatch(lockScreen, /\.ls-card-wrapper\s*\{[^}]*height:\s*90px;/s, 'ls-card-wrapper must not hard-code the legacy 90px height')
  assert.match(lockScreen, /\.ls-card-front\s*\{[^}]*position:\s*relative;/s, 'ls-card-front must stay in flow so it can grow with its content')
  assert.match(lockScreen, /\.ls-card-front\s*\{[^}]*width:\s*100%;/s, 'ls-card-front must span the wrapper width')
})

test('live activity cards keep their fixed template height', () => {
  assert.match(
    lockScreen,
    /\.ls-card-wrapper\.is-activity\s+\.ls-card-front,\s*\.ls-card-wrapper\.ls-activity-standalone\s+\.ls-card-front\s*\{[^}]*position:\s*absolute;/s,
    'activity card fronts must still fill the wrapper, whose height is fixed per template'
  )
  assert.match(lockScreen, /if \(item\?\.isActivity\) style\.height =/, 'notifStyle must only pin a height for activity cards')
})

test('measured notification heights feed the stack and scroll geometry', () => {
  assert.match(lockScreen, /const notifCardHeights = ref\(\{\}\)/, 'LockScreen must keep a measured height map')
  assert.match(lockScreen, /function syncNotifCardHeights\(\)/, 'LockScreen must measure rendered card heights')
  assert.match(lockScreen, /return notifCardHeights\.value\[item\.id\] \?\? LOCK_CARD_HEIGHT/, 'getLockItemHeight must prefer the measured height and fall back to the design baseline')
  assert.match(lockScreen, /data-notif-id=/, 'notification wrappers must be addressable for measurement')
  assert.match(lockScreen, /new ResizeObserver\(\(\) => \{[^}]*syncNotifCardHeights\(\)/s, 'the screen ResizeObserver must re-measure when the form factor morphs')
  assert.match(lockScreen, /document\.fonts\?\.ready/, 'font swaps must trigger a re-measure')
})
