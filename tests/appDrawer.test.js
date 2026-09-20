import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  DRAWER_APPS,
  ALPHABET_LIST,
  getAlphabeticalGroups,
  searchDrawerApps,
  getDrawerAppById
} from '../src/config/drawerApps.js'
import { DRAWER_CATEGORIES } from '../src/config/drawerCategories.js'
import { getApp } from '../src/config/apps.js'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('DRAWER_APPS contains pinned apps and valid initial letters matching 111.mp4', () => {
  assert.ok(DRAWER_APPS.length >= 70, 'Drawer apps list should contain comprehensive app set')

  // 置顶常用应用
  const pinned = DRAWER_APPS.filter((a) => a.pinned)
  assert.equal(pinned.length, 4)
  const pinnedIds = pinned.map((a) => a.id)
  assert.deepEqual(pinnedIds, ['contacts', 'wechat', 'pupu', 'taobao'])

  // 字母表覆盖
  assert.equal(ALPHABET_LIST.length, 27)
  assert.equal(ALPHABET_LIST[0], 'A')
  assert.equal(ALPHABET_LIST[25], 'Z')
  assert.equal(ALPHABET_LIST[26], '#')

  // 每个应用必须具备合法元数据
  for (const app of DRAWER_APPS) {
    assert.ok(app.id, 'app must have id')
    assert.ok(app.name, `app ${app.id} must have name`)
    assert.ok(app.icon, `app ${app.id} must have icon`)
    assert.ok(app.initial, `app ${app.id} must have initial`)
    assert.ok(ALPHABET_LIST.includes(app.initial), `app ${app.id} initial ${app.initial} must be in ALPHABET_LIST`)
  }
})

test('getAlphabeticalGroups organizes apps into correct initial buckets', () => {
  const groups = getAlphabeticalGroups()
  assert.ok(groups.A.length > 0)
  assert.ok(groups.W.some((a) => a.id === 'wechat'))
  assert.ok(groups['#'].some((a) => a.id === 'traffic12123'))
})

test('searchDrawerApps supports Chinese, Pinyin, English, and partial queries', () => {
  // 中文检索
  const wechat = searchDrawerApps('微信')
  assert.ok(wechat.some((a) => a.id === 'wechat'))
  assert.ok(wechat.some((a) => a.id === 'wechat_read'))

  // 拼音检索
  const pinyinResults = searchDrawerApps('taobao')
  assert.ok(pinyinResults.some((a) => a.id === 'taobao'))

  // 英文与大小写不敏感
  const chromeResults = searchDrawerApps('CHROME')
  assert.ok(chromeResults.some((a) => a.id === 'chrome'))

  // 前缀与模糊匹配
  const douyinResults = searchDrawerApps('douyin')
  assert.equal(douyinResults.length, 3) // 抖音, 抖音商城, 抖音极速版

  // 空值安全
  assert.deepEqual(searchDrawerApps(''), [])
  assert.deepEqual(searchDrawerApps(null), [])
})

test('DRAWER_CATEGORIES accurately models the 14 categories from 111.mp4', () => {
  assert.equal(DRAWER_CATEGORIES.length, 14, 'Should have exactly 14 categories')

  const expectedCategoryIds = [
    'frequent',
    'recent_added',
    'social',
    'productivity',
    'tools',
    'entertainment',
    'finance',
    'travel',
    'lifestyle',
    'games',
    'news',
    'health',
    'uncategorized',
    'xhide'
  ]

  assert.deepEqual(
    DRAWER_CATEGORIES.map((c) => c.id),
    expectedCategoryIds
  )

  // 结构校验：4-large
  const fourLarge = DRAWER_CATEGORIES.filter((c) => c.type === '4-large')
  assert.ok(fourLarge.length >= 6)
  for (const cat of fourLarge) {
    assert.equal(cat.apps.length, 4, `Category ${cat.name} should have 4 apps`)
    for (const appId of cat.apps) {
      assert.ok(getDrawerAppById(appId), `App ${appId} in ${cat.name} must exist in DRAWER_APPS`)
    }
  }

  // 结构校验：3-large-1-cluster
  const clusterCats = DRAWER_CATEGORIES.filter((c) => c.type === '3-large-1-cluster')
  assert.ok(clusterCats.length >= 6)
  for (const cat of clusterCats) {
    assert.equal(cat.largeApps.length, 3, `Category ${cat.name} should have 3 large apps`)
    assert.equal(cat.clusterApps.length, 4, `Category ${cat.name} should have 4 cluster apps`)
    for (const appId of [...cat.largeApps, ...cat.clusterApps]) {
      assert.ok(getDrawerAppById(appId), `App ${appId} in ${cat.name} must exist in DRAWER_APPS`)
    }
  }

  // XHide 隐私卡片
  const xhide = DRAWER_CATEGORIES.find((c) => c.id === 'xhide')
  assert.ok(xhide)
  assert.equal(xhide.type, 'xhide')
  assert.equal(xhide.isPrivate, true)
})

test('apps.js fallback resolver provides valid app descriptor for all drawer apps', () => {
  for (const drawerApp of DRAWER_APPS) {
    const resolved = getApp(drawerApp.id)
    assert.ok(resolved, `getApp('${drawerApp.id}') must return a valid app object`)
    assert.equal(resolved.id, drawerApp.id)
    assert.ok(resolved.name)
    assert.ok(resolved.image || resolved.glyph || resolved.special)
  }
})

test('AppLibrary component wires capsule tabs, scrubber, search bar, and vertical transform', async () => {
  const librarySource = await read('../src/components/system/AppLibrary.vue')

  // 组件引入与声明
  assert.match(librarySource, /DrawerCapsuleTabs/)
  assert.match(librarySource, /AlphabetScrubber/)
  assert.match(librarySource, /CategoryCard/)
  assert.match(librarySource, /DrawerSearchBar/)

  // 纵向动画规范
  assert.match(librarySource, /translateY\(\$\{\(1 - overlay\.value\.progress\) \* 100\}%\)/)
  assert.match(librarySource, /axis:\s*'y'/)
  assert.match(librarySource, /direction:\s*1/) // 下拉关闭

  // 两个 Tab 视图
  assert.match(librarySource, /currentTab === 'all'/)
  assert.match(librarySource, /currentTab === 'category'/)
  assert.match(librarySource, /home\.appInstalled/)
})

test('ScreenView and HomeScreen integrate vertical drawer gesture invocation', async () => {
  const [screenView, homeScreen] = await Promise.all([
    read('../src/components/phone/ScreenView.vue'),
    read('../src/components/system/HomeScreen.vue')
  ])

  // ScreenView 纵向抽屉驱动
  assert.match(screenView, /useOverlayDriver\('appLibrary',\s*\{[\s\S]*axis:\s*'y'/)
  assert.match(screenView, /direction:\s*-1/)
  assert.match(screenView, /span:\s*450/)

  // HomeScreen 桌面纵向上滑唤起
  assert.match(homeScreen, /!home\.editing && dy < -25/)
  assert.match(homeScreen, /emit\('open-library'\)/)
})
