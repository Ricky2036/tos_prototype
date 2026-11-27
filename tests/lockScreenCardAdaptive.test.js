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
 * 这些断言钉住六条契约：
 *   1. 卡片包装器不再是固定高度，通知卡片走 auto；
 *   2. 表层卡片默认在文档流内（内容撑高），只有活动卡片仍铺满固定高度；
 *   3. 高度实测入口存在并被挂到布局计算上，而不是写死常量；
 *   4. 通知组按「底边」锚定（卡片变矮时整组下移，直板/阔直板同一节奏）；
 *   5. 播放器这类顶部组件会先把时钟往上顶，避免被裁剪区切掉；
 *   6. 时钟挤压死区不得依赖当前钟高（否则 HIT ← 钟高 ← 挤压 形成反馈环 → 滚动闪动）。
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

test('notification group is anchored by its bottom edge so slab and wide share one rhythm', () => {
  assert.match(lockScreen, /function getLockFrontCardHeight\(\)/, 'LockScreen must resolve the front card height for anchoring')
  assert.match(
    lockScreen,
    /const BASE_Y = computed\([\s\S]*?LOCK_STACK_BOTTOM_INSET[\s\S]*?LOCK_STACK_BOTTOM_CLEARANCE[\s\S]*?getLockFrontCardHeight\(\)/,
    'BASE_Y must sit above the safe inset plus clearance, offset by the measured front card height'
  )
  assert.match(lockScreen, /const LOCK_STACK_BOTTOM_CLEARANCE = 24/, 'bottom clearance must keep the legacy 24px rhythm')
})

test('top widgets squeeze the clock up before they get clipped', () => {
  assert.match(lockScreen, /const playerClockSqueeze = computed/, 'media player needs a clock squeeze term')
  assert.match(lockScreen, /playerClockSqueeze[\s\S]*?CLOCK_CLIP_BOTTOM_LIMIT[\s\S]*?PLAYER_START_Y/, 'player squeeze must be derived from the clip top and the player anchor')
  assert.match(lockScreen, /!control\.mediaActive\) return 0/, 'player squeeze only applies while the player is shown')
  assert.match(lockScreen, /clipPath: `inset\(\$\{clipTop\.value - CLIP_TOP_BLEED\}px/, 'clipStyle must reuse CLIP_TOP_BLEED so squeeze and clipping stay in sync')
})

test('clock squeeze dead-zone never depends on the current clock height (no scroll flicker)', () => {
  assert.doesNotMatch(
    lockScreen,
    /\(CLOCK_TOP \+ clockHeight\.value\)/,
    'the scroll dead-zone must not read the live clock height — that closes a feedback loop and makes the clock flicker while scrolling'
  )
  assert.match(lockScreen, /const staticClockSqueeze = computed/, 'static (non-scroll) squeeze must be a named value')
  assert.match(lockScreen, /CLOCK_INITIAL_HEIGHT = computed\(\(\) => CLOCK_MAX_HEIGHT - staticClockSqueeze\.value\)/, 'static squeeze must define the resting clock height')
  assert.match(lockScreen, /HIT_DISTANCE = computed\([\s\S]{0,240}?CLOCK_INITIAL_HEIGHT\.value/, 'the scroll dead-zone must use the resting clock height')
})
