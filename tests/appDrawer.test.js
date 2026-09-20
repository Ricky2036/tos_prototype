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
import { APPS, getApp } from '../src/config/apps.js'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('DRAWER_APPS contains 19 real desktop apps matching apps.js and 4 pinned dock apps', () => {
  // 必须严格对应系统桌面 19 个真实应用
  assert.equal(DRAWER_APPS.length, 19, 'Drawer apps list must have exactly the 19 desktop apps')
  const desktopIds = APPS.map((a) => a.id).sort()
  const drawerIds = DRAWER_APPS.map((a) => a.id).sort()
  assert.deepEqual(drawerIds, desktopIds, 'Drawer apps must 100% match desktop APPS IDs')

  // 置顶常用应用（Dock 4 核心应用）
  const pinned = DRAWER_APPS.filter((a) => a.pinned)
  assert.equal(pinned.length, 4)
  const pinnedIds = pinned.map((a) => a.id)
  assert.deepEqual(pinnedIds, ['phone', 'messages', 'safari', 'camera'])

  // 全量 27 字母表索引列表（对齐真机 A-Z 及 # 导轨）
  assert.equal(ALPHABET_LIST.length, 27)
  assert.equal(ALPHABET_LIST[0], 'A')
  assert.equal(ALPHABET_LIST[25], 'Z')
  assert.equal(ALPHABET_LIST[26], '#')

  // 每个应用必须具备合法元数据
  for (const app of DRAWER_APPS) {
    assert.ok(app.id, 'app must have id')
    assert.ok(app.name, `app ${app.id} must have name`)
    assert.ok(app.initial, `app ${app.id} must have initial`)
    assert.ok(app.pinyin, `app ${app.id} must have pinyin`)
    assert.ok(ALPHABET_LIST.includes(app.initial), `app ${app.id} initial ${app.initial} must be in ALPHABET_LIST`)
  }
})

test('getAlphabeticalGroups organizes real apps into correct initial buckets', () => {
  const groups = getAlphabeticalGroups()
  assert.ok(groups.D.some((a) => a.id === 'phone'))
  assert.ok(groups.J.some((a) => a.id === 'calculator'))
  assert.ok(groups.L.some((a) => a.id === 'safari'))
  assert.ok(groups.R.some((a) => a.id === 'calendar'))
  assert.ok(groups.S.some((a) => a.id === 'clock'))
  assert.ok(groups.S.some((a) => a.id === 'settings'))
  assert.ok(groups.T.some((a) => a.id === 'weather'))
  assert.ok(groups.W.some((a) => a.id === 'files'))
  assert.ok(groups.X.some((a) => a.id === 'camera'))
  assert.ok(groups.X.some((a) => a.id === 'messages'))
  assert.ok(groups.Y.some((a) => a.id === 'games'))
  assert.ok(groups.Z.some((a) => a.id === 'photos'))
})

test('searchDrawerApps supports Chinese, Pinyin, English ID, and partial queries for real apps', () => {
  // 中文检索
  const phone = searchDrawerApps('电话')
  assert.ok(phone.some((a) => a.id === 'phone'))

  const calendar = searchDrawerApps('日历')
  assert.ok(calendar.some((a) => a.id === 'calendar'))

  // 拼音检索
  const pinyinResults = searchDrawerApps('jisuanqi')
  assert.ok(pinyinResults.some((a) => a.id === 'calculator'))

  const tianqi = searchDrawerApps('tianqi')
  assert.ok(tianqi.some((a) => a.id === 'weather'))

  // 英文 ID 与大小写不敏感
  const safariResults = searchDrawerApps('SAFARI')
  assert.ok(safariResults.some((a) => a.id === 'safari'))

  const clockResults = searchDrawerApps('clock')
  assert.ok(clockResults.some((a) => a.id === 'clock'))

  // 空值安全
  assert.deepEqual(searchDrawerApps(''), [])
  assert.deepEqual(searchDrawerApps(null), [])
})

test('DRAWER_CATEGORIES groups real desktop apps cleanly with XHide', () => {
  assert.equal(DRAWER_CATEGORIES.length, 6, 'Should have 6 curated categories')

  const expectedCategoryIds = [
    'frequent',
    'productivity',
    'lifestyle',
    'entertainment',
    'system',
    'xhide'
  ]

  assert.deepEqual(
    DRAWER_CATEGORIES.map((c) => c.id),
    expectedCategoryIds
  )

  // 结构校验：所有分类里的应用必须真实存在于 DRAWER_APPS
  for (const cat of DRAWER_CATEGORIES) {
    if (cat.type === '4-large') {
      assert.equal(cat.apps.length, 4, `Category ${cat.name} should have 4 apps`)
      for (const appId of cat.apps) {
        assert.ok(getDrawerAppById(appId), `App ${appId} in ${cat.name} must exist in DRAWER_APPS`)
      }
    } else if (cat.type === '3-large-1-cluster') {
      assert.equal(cat.largeApps.length, 3, `Category ${cat.name} should have 3 large apps`)
      assert.equal(cat.clusterApps.length, 4, `Category ${cat.name} should have 4 cluster apps`)
      for (const appId of [...cat.largeApps, ...cat.clusterApps]) {
        assert.ok(getDrawerAppById(appId), `App ${appId} in ${cat.name} must exist in DRAWER_APPS`)
      }
    } else if (cat.type === 'xhide') {
      assert.equal(cat.isPrivate, true)
    }
  }
})

test('apps.js resolver provides valid app descriptor for all drawer apps', () => {
  for (const drawerApp of DRAWER_APPS) {
    const resolved = getApp(drawerApp.id)
    assert.ok(resolved, `getApp('${drawerApp.id}') must return a valid app object`)
    assert.equal(resolved.id, drawerApp.id)
    assert.ok(resolved.name)
  }
})

test('AppLibrary and DrawerSearchBar wire AppIcon and do NOT draw redundant home-indicator', async () => {
  const [librarySource, searchBarSource] = await Promise.all([
    read('../src/components/system/AppLibrary.vue'),
    read('../src/components/system/drawer/DrawerSearchBar.vue')
  ])

  // AppLibrary 复用系统 AppIcon 原生图标
  assert.match(librarySource, /AppIcon/)
  assert.match(librarySource, /DrawerCapsuleTabs/)
  assert.match(librarySource, /AlphabetScrubber/)
  assert.match(librarySource, /CategoryCard/)
  assert.match(librarySource, /DrawerSearchBar/)

  // 纵向手势与 Tab
  assert.match(librarySource, /currentTab === 'all'/)
  assert.match(librarySource, /currentTab === 'category'/)
  assert.match(librarySource, /home\.appInstalled/)

  // DrawerSearchBar 严禁手绘内部 home-indicator（底部导航属于全局系统）
  assert.doesNotMatch(searchBarSource, /class="home-indicator"/)
  assert.doesNotMatch(searchBarSource, /\.home-indicator\s*\{/)
})

test('AppLibrary implements letter filter focus mode and spacious grid metrics', async () => {
  const [librarySource, scrubberSource] = await Promise.all([
    read('../src/components/system/AppLibrary.vue'),
    read('../src/components/system/drawer/AlphabetScrubber.vue')
  ])

  // 字母过滤聚焦模式：隐藏其他图标与界面
  assert.match(librarySource, /isFilterMode/)
  assert.match(librarySource, /filteredApps/)
  assert.match(librarySource, /filter-mode-container/)
  assert.match(librarySource, /row-gap:\s*28px/)
  assert.match(librarySource, /:size="50"/)

  // 顶部大写字母标题置于第 4 列上方，右边缘对齐应用图标（对齐 media_1789877584491.jpg）
  assert.match(librarySource, /filter-header-row/)
  assert.match(librarySource, /filter-letter-col/)
  assert.match(librarySource, /filter-letter-title/)
  assert.match(librarySource, /grid-column:\s*4/)
  assert.match(librarySource, /padding-right:\s*8px/)

  // 字母过滤网格应用行右对齐（不足 4 个应用时向右紧凑排布至第 4 列）
  assert.match(librarySource, /getFilteredItemStyle/)
  assert.match(librarySource, /gridColumnStart:\s*4\s*-\s*rowLen\s*\+\s*1/)

  // 当前字母无应用时直接隐藏过滤模式（不展示空状态）
  assert.match(librarySource, /isFilterMode && filteredApps\.length > 0/)
  assert.match(librarySource, /apps\.length > 0[\s\S]*isFilterMode\.value = true[\s\S]*isFilterMode\.value = false/)
  assert.doesNotMatch(librarySource, /empty-letter-state/)

  // 导轨仅展示有对应应用的字母（无对应应用的字母不显示）
  assert.match(librarySource, /:letters="lettersWithApps"/)
  assert.match(scrubberSource, /gap:\s*12px/)

  // 导轨移除浮动字母气泡，防止点击时出现重复字母
  assert.doesNotMatch(scrubberSource, /class="scrubber-floating-char"/)
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

test('AppLibrary adheres to refined UI metrics and maintains authentic frosted glass', async () => {
  const [librarySource, capsuleSource, searchBarSource, frameSource] = await Promise.all([
    read('../src/components/system/AppLibrary.vue'),
    read('../src/components/system/drawer/DrawerCapsuleTabs.vue'),
    read('../src/components/system/drawer/DrawerSearchBar.vue'),
    read('../src/components/phone/PhoneFrame.vue')
  ])

  // 1. 顶部 Tab 距离屏幕留白 50px，高度 36px
  assert.match(librarySource, /margin-top:\s*50px/)
  assert.match(librarySource, /height:\s*36px/)
  assert.match(capsuleSource, /height:\s*36px/)

  // 2. 图标距离 Tab 留白 38px
  assert.match(librarySource, /\.app-grid\.pinned-row\s*\{[\s\S]*margin-top:\s*38px/)

  // 3. 分割线精确对齐列 1 图标左边缘与列 4 图标右边缘（margin: 20px 36px 20px 24px）
  assert.match(librarySource, /margin:\s*20px\s+36px\s+20px\s+24px/)

  // 4. 搜索栏距离底部 24px
  assert.match(searchBarSource, /margin-bottom:\s*24px/)

  // 5. 纯正旗舰级毛玻璃材质与外扩采样（杜绝边缘模糊衰减）
  assert.match(librarySource, /background:\s*rgba\(18,\s*20,\s*26,\s*0\.76\)/)
  assert.match(librarySource, /backdrop-filter:\s*blur\(36px\)\s*saturate\(180%\)/)
  assert.match(librarySource, /inset:\s*-30px/)

  // 6. PhoneFrame 旗舰级 BM 压边黑圈遮罩（彻底杜绝四角圆角亚像素漏色透底）
  assert.match(frameSource, /\.frame-inner::after/)
  assert.match(frameSource, /box-shadow:\s*inset\s+0\s+0\s+0\s+6px\s+#000000/)
})

test('DrawerFolderOverlay calculates icon motion using center-to-center delta translation to eliminate cluster hitch', async () => {
  const overlaySource = await read('../src/components/system/drawer/DrawerFolderOverlay.vue')

  // 必须以 tile 物理中心为 transform-origin
  assert.match(overlaySource, /const originX = tileRect\.left - iconElRect\.left \+ tileRect\.width \/ 2/)
  assert.match(overlaySource, /const originY = tileRect\.top - iconElRect\.top \+ tileRect\.height \/ 2/)
  assert.match(overlaySource, /iconEl\.style\.transformOrigin = `\${originX}px \${originY}px`/)

  // 必须严格使用中心对齐差值（originCenterX - tileCenterX, originCenterY - tileCenterY）
  assert.match(overlaySource, /const originCenterX = originRect\.left \+ originRect\.width \/ 2/)
  assert.match(overlaySource, /const originCenterY = originRect\.top \+ originRect\.height \/ 2/)
  assert.match(overlaySource, /const cx = originCenterX - tileCenterX/)
  assert.match(overlaySource, /const cy = originCenterY - tileCenterY/)

  // 不得退回基于 top-left 的差值（否则 24px 微簇小图标收起最后一帧会有 13px 坐标跳变）
  assert.doesNotMatch(overlaySource, /const cx = originRect\.left - tileRect\.left/)
  assert.doesNotMatch(overlaySource, /const cy = originRect\.top - tileRect\.top/)
})

test('CategoryCard and DrawerFolderOverlay eliminate active press distortion and query live DOM resting coordinates on close', async () => {
  const [categorySource, overlaySource] = await Promise.all([
    read('../src/components/system/drawer/CategoryCard.vue'),
    read('../src/components/system/drawer/DrawerFolderOverlay.vue')
  ])

  // 1. CategoryCard 必须在测量时清除 :active 与 transition 变形，确保展开起点基于纯净静止几何
  assert.match(categorySource, /el\.style\.transform = 'none'/)
  assert.match(categorySource, /el\.style\.transition = 'none'/)
  assert.match(categorySource, /void cardRef\.value\.offsetWidth/)
  assert.match(categorySource, /:data-category-id="category\.id"/)

  // 2. DrawerFolderOverlay 收起时必须通过 live DOM 重新采集处于静止态的分类卡片坐标
  assert.match(overlaySource, /function getLiveOriginData\(\)/)
  assert.match(overlaySource, /\[data-category-id="\$\{props\.category\.id\}"\]/)
  assert.match(overlaySource, /prepareMotion\(true\)/)
})



