/**
 * 相册（Photos）单测
 * ==================
 * 参考实现：Ricky 提供的两张参考图
 *   图 1 首页 —— 右上悬浮胶囊按钮组 · 大标题「照片」· 按日期分组的 3 列缩略图网格 ·
 *              底部「照片 / 相册 / 发现」悬浮栏 + 搜索圆钮
 *   图 2 全屏 —— 返回 + 两行日期 · 居中大图 · 右下圆形按钮 · 底部深色玻璃操作栏
 *             （分享 / 收藏 / 编辑 / 删除 / 更多）
 *
 * 三组守卫：
 *   ① store 行为（分组 / 全屏 / 收藏 / 删除 / 跨零点 / 复位 / 三语词条）
 *   ② PhotosApp.vue 源码结构（浮层 absolute、顶部避让手势热区、字号 ≥12px、
 *      类名不撞车、底栏与渐隐遮罩几何配对、**分组标题与大标题同左缘**）
 *   ③ 注册接线（registry / apps.js / drawerApps.js / DARK_BG_APPS / i18n ph getter）
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { usePhotosStore, fill, isoOf, shiftISO } from '../src/stores/photosStore.js'
import { PHOTOS } from '../src/locales/photos.js'
import { PRESET_WALLPAPERS } from '../src/stores/wallpaperStore.js'
import { APPS } from '../src/config/apps.js'
import { DRAWER_APPS } from '../src/config/drawerApps.js'

const ROOT = process.cwd()
const read = (p) => fs.readFileSync(path.resolve(ROOT, p), 'utf-8')

/** 剥掉 CSS/JS 块注释与 HTML 注释 —— 结构类断言一律作用在「有效代码」上。
 *  🔴 teeth 实测：把 `isolation: isolate;` 改成 `/* isolation: isolate; *\/` 时，
 *     直接对原文 `includes()` 仍然为真 ⇒ **假绿**；反过来，自己写的说明注释也会造成假红。 */
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
const APP_SRC = read('src/components/apps/photos/PhotosApp.vue')
const STYLE = code(APP_SRC.slice(APP_SRC.indexOf('<style')))
const SCRIPT = code(APP_SRC.slice(0, APP_SRC.indexOf('<template')))

/** 固定基准日，避免单测结果随「今天」漂 */
const BASE = new Date(2026, 9, 12) // 2026-10-12 本地时区
const store = () => {
  setActivePinia(createPinia())
  const s = usePhotosStore()
  s.syncToday(BASE)
  return s
}

/** 取出某条规则块（首个匹配）；取不到返回 '' */
function rule(css, selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = css.match(new RegExp(`${esc}\\s*\\{([^}]*)\\}`))
  return m ? m[1] : ''
}

/* ============================================================
 * ① store 行为
 * ============================================================ */

test('分组：按天分组、每组带日期、空组整组消失', () => {
  const s = store()
  assert.equal(s.days.length, 4, '4 个日期分组')
  assert.equal(s.total, 10, '合计 10 张')
  assert.equal(s.flat.length, 10, '未删扁平序列 10 张')
  assert.equal(s.days[0].date, '2026-10-12', '第一组 = 基准日')
  assert.equal(s.days[3].date, '2026-10-09', '第四组 = 基准日往前 3 天')
  assert.deepEqual(
    s.days.map((d) => d.daysAgo),
    [0, 1, 2, 3],
    '分组按 daysAgo 升序'
  )
  for (const d of s.days) {
    assert.ok(d.items.length > 0, `第 ${d.daysAgo} 组非空`)
    for (const it of d.items) {
      assert.ok('favorite' in it && 'date' in it && 'daysAgo' in it, '每张都带派生字段')
      assert.equal(it.date, d.date, '组内每张的日期与组一致')
    }
  }

  // 🔴 不变量：days 里的项与 flat 里的项**结构一致**
  // （少一个 date 就会让「从分组取到的项拿去算时间」静默拿到 undefined）
  const keysOf = (o) => Object.keys(o).sort().join(',')
  assert.equal(
    keysOf(s.days[0].items[0]),
    keysOf(s.flat[0]),
    'days 组内项与 flat 项字段必须完全一致'
  )

  // 删光「今天」整组 ⇒ 该组消失，其余前移
  for (const id of ['p-beach', 'p-cafe', 'p-forest']) {
    s.askDelete(id)
    s.confirmDelete()
  }
  assert.equal(s.days.length, 3, '今天整组删光后只剩 3 组')
  assert.equal(s.days[0].daysAgo, 1, '首组变成「昨天」')
  assert.equal(s.days[0].date, '2026-10-11')
})

test('素材：复用系统壁纸 PRESET_WALLPAPERS，其余走 public/photos', () => {
  const s = store()
  const srcs = s.flat.map((p) => p.src)
  const wallSrcs = Object.values(PRESET_WALLPAPERS)
  const matched = srcs.filter((p) => wallSrcs.includes(p))
  assert.ok(matched.length >= 4, `至少 4 张直接取用系统壁纸，实际 ${matched.length}`)

  const others = srcs.filter((p) => !wallSrcs.includes(p))
  assert.ok(others.length > 0, '还有非壁纸素材')
  for (const src of others) {
    assert.match(src, /^\/photos\/[\w-]+\.jpg$/, `${src} 应走 public 绝对路径（node 下 import.meta.env 不可用）`)
  }
})

test('全屏：openViewer / index / count / 到边界停住不循环', () => {
  const s = store()
  assert.equal(s.viewer, null, '初始未进入')

  assert.equal(s.openViewer('p-beach'), true)
  assert.equal(s.viewer.index, 0)
  assert.equal(s.viewer.count, 10)
  assert.equal(s.viewer.id, 'p-beach')

  assert.equal(s.openViewer('p-birthday'), true)
  assert.equal(s.viewer.index, 9, '最后一张 index = 9')
  assert.equal(s.stepViewer(1), false, '末张再 next 返回 false')
  assert.equal(s.viewer.index, 9, '末张再 next 仍停在末张（不循环）')

  assert.equal(s.openViewer('p-beach'), true)
  assert.equal(s.stepViewer(-1), false, '首张再 prev 返回 false')
  assert.equal(s.viewer.index, 0, '首张再 prev 仍停在首张（不循环）')

  assert.equal(s.stepViewer(1), true)
  assert.equal(s.viewer.index, 1, '中间 next 正常推进')

  assert.equal(s.openViewer('nope'), false, '非法 id 拒绝')
  assert.equal(s.viewer.id, 'p-cafe', '非法 id 不改变当前查看项')

  s.closeViewer()
  assert.equal(s.viewer, null, 'closeViewer 退出全屏')
})

test('全屏沉浸态：toggle 开合；进/退全屏、reset、挂载复位都必须回到「有 chrome」', () => {
  const s = store()
  assert.equal(s.viewerChromeHidden, false, '初始必须可见 chrome')

  s.openViewer('p-beach')
  assert.equal(s.viewerChromeHidden, false, '进全屏必须从「有 chrome」开始（全屏且无按钮 = 用户以为死机）')
  assert.equal(s.toggleViewerChrome(), true, '切一次 → 隐藏，且必须返回新值')
  assert.equal(s.viewerChromeHidden, true)
  assert.equal(s.toggleViewerChrome(), false, '再切一次 → 显示')

  // 再次 openViewer 必须复位（隐藏态下从网格点另一张 / 重进同一张）
  s.toggleViewerChrome()
  assert.equal(s.viewerChromeHidden, true)
  s.openViewer('p-coast')
  assert.equal(s.viewerChromeHidden, false, '再次 openViewer 必须复位（否则重进还是黑屏无按钮）')

  // 左右切换照片是「导航」不是「开关」：不该顺手把沉浸态翻回来
  s.toggleViewerChrome()
  s.stepViewer(1)
  assert.equal(s.viewerChromeHidden, true, '换图不得改变沉浸态')

  s.closeViewer()
  assert.equal(s.viewerChromeHidden, false, '退出全屏必须复位')

  s.openViewer('p-beach')
  s.toggleViewerChrome()
  s.reset()
  assert.equal(s.viewerChromeHidden, false, 'reset 必须复位')

  s.openViewer('p-beach')
  s.toggleViewerChrome()
  assert.equal(s.showViewerChrome(), false, 'showViewerChrome 返回 false')
  assert.equal(s.viewerChromeHidden, false, 'showViewerChrome 必须归位（挂载复位靠它）')
})

test('收藏：toggleFavorite 开合，并把 favorite 同步进 days / flat', () => {
  const s = store()
  assert.equal(s.isFavorite('p-cafe'), false, '初始未收藏')

  assert.equal(s.toggleFavorite('p-cafe'), true, '首次点击 = 收藏')
  assert.deepEqual(s.favoriteIds, ['p-cafe'])
  assert.equal(s.isFavorite('p-cafe'), true)
  assert.equal(s.days[0].items.find((i) => i.id === 'p-cafe').favorite, true, '分组视图同步')
  assert.equal(s.flat.find((i) => i.id === 'p-cafe').favorite, true, '扁平序列同步')
  assert.equal(s.notice.code, 'favorited')

  assert.equal(s.toggleFavorite('p-cafe'), false, '再点 = 取消收藏')
  assert.deepEqual(s.favoriteIds, [])
  assert.equal(s.days[0].items.find((i) => i.id === 'p-cafe').favorite, false)
  assert.equal(s.notice.code, 'unfavorited')
})

test('删除：确认后总数下降、收藏不留孤儿、全屏退到相邻张', () => {
  const s = store()
  s.openViewer('p-cafe')
  s.toggleFavorite('p-cafe')

  assert.equal(s.askDelete('p-cafe'), true)
  assert.equal(s.pendingDelete.id, 'p-cafe', '待确认项可被弹层读到')
  s.cancelDelete()
  assert.equal(s.pendingDelete, null, '取消后清空')

  s.askDelete('p-cafe')
  s.confirmDelete()
  assert.equal(s.total, 9)
  assert.equal(s.flat.some((p) => p.id === 'p-cafe'), false, '已从扁平序列移除')
  assert.equal(s.favoriteIds.includes('p-cafe'), false, '收藏一并清理，不留孤儿 id')
  assert.notEqual(s.viewer, null, '删掉正在看的那张后不退到「无图」状态')
  assert.equal(s.viewer.count, 9, 'count 跟随收缩')
  assert.equal(s.pendingDelete, null)
  assert.equal(s.notice.code, 'deleted')

  assert.equal(s.askDelete('nope'), false, '非法 id 拒绝')
})

test('全删光：days 为空、total 归零、全屏自动退出', () => {
  const s = store()
  s.openViewer('p-beach')
  for (const p of [...s.flat]) {
    s.askDelete(p.id)
    s.confirmDelete()
  }
  assert.equal(s.total, 0)
  assert.equal(s.days.length, 0, '空组全部消失 ⇒ 首页走空态')
  assert.equal(s.viewer, null, '没有下一张时退出全屏')
  assert.equal(s.flat.length, 0)
})

test('跨零点：syncToday 校准基准日，分组日期跟着走', () => {
  const s = store()
  assert.equal(s.todayISO, '2026-10-12')
  s.syncToday(new Date(2026, 0, 1))
  assert.equal(s.todayISO, '2026-01-01')
  assert.equal(s.days[0].date, '2026-01-01')
  assert.equal(s.days[1].date, '2025-12-31', '跨年前移正确')
})

test('tab / 视图模式：非法值被忽略，reset 全量复位', () => {
  const s = store()
  s.setTab('albums')
  assert.equal(s.albumTab, 'albums')
  assert.equal(s.setTab('nope'), 'albums', '非法 tab 被忽略')
  s.setViewMode('list')
  assert.equal(s.viewMode, 'list')
  assert.equal(s.setViewMode('nope'), 'list', '非法模式被忽略')
  assert.equal(s.toggleSelecting(), true)
  assert.equal(s.toggleSelecting(), false)

  s.openViewer('p-dog')
  s.toggleFavorite('p-dog')
  s.askDelete('p-dog')
  s.openMore('p-dog')
  s.reset()
  assert.equal(s.albumTab, 'photos')
  assert.equal(s.viewMode, 'grid')
  assert.equal(s.selecting, false)
  assert.deepEqual(s.favoriteIds, [])
  assert.deepEqual(s.removedIds, [])
  assert.equal(s.viewerId, null)
  assert.equal(s.pendingDeleteId, null)
  assert.equal(s.moreId, null)
  assert.equal(s.notice, null)
  assert.equal(s.total, 10, '复位后素材全部回来')
})

test('helper：fill 插值 / isoOf 本地时区 / shiftISO 跨月跨年闰年', () => {
  assert.equal(fill('{n} 张照片', { n: 7 }), '7 张照片')
  assert.equal(fill('{n} 张照片'), '{n} 张照片', '缺参原样返回')
  assert.equal(fill(null), null, '非字符串原样返回')

  assert.equal(isoOf(new Date(2026, 9, 12)), '2026-10-12')
  assert.equal(isoOf(new Date(2026, 0, 5)), '2026-01-05', '补零')
  // 🔴 不用 toISOString：UTC 会把东八区的「凌晨」漂成前一天
  assert.equal(isoOf(new Date(2026, 9, 12, 0, 30)), '2026-10-12', '本地凌晨不打偏')

  assert.equal(shiftISO('2026-10-12', 1), '2026-10-11')
  assert.equal(shiftISO('2026-03-01', 1), '2026-02-28', '跨月')
  assert.equal(shiftISO('2026-01-01', 1), '2025-12-31', '跨年')
  assert.equal(shiftISO('2024-03-01', 1), '2024-02-29', '闰年 2/29')
})

test('三语 photos 词条：键集一致、占位符集合一致、无 <12px 无关的魔法数字', () => {
  const keys = (o) => {
    const out = []
    const walk = (v, p) => {
      if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], p ? `${p}.${k}` : k)
      else out.push(p)
    }
    walk(o, '')
    return out.sort()
  }
  const phs = (o) => {
    const set = new Set()
    const walk = (v) => {
      if (v && typeof v === 'object') Object.values(v).forEach(walk)
      else if (typeof v === 'string') for (const m of v.matchAll(/\{(\w+)\}/g)) set.add(m[1])
    }
    walk(o)
    return [...set].sort().join(',')
  }
  const zh = keys(PHOTOS.zh)
  assert.deepEqual(keys(PHOTOS.en), zh, 'en 键集必须与 zh 一致')
  assert.deepEqual(keys(PHOTOS.bn), zh, 'bn 键集必须与 zh 一致')
  assert.ok(zh.length >= 40, `词条数偏少（${zh.length}）`)
  assert.equal(phs(PHOTOS.en), phs(PHOTOS.zh), 'en 占位符集合必须与 zh 一致')
  assert.equal(phs(PHOTOS.bn), phs(PHOTOS.zh), 'bn 占位符集合必须与 zh 一致')
  assert.equal(phs(PHOTOS.zh), 'n', 'photos 只应有 count 的 {n} 一处占位符')
})

/* ============================================================
 * ② PhotosApp.vue 源码结构守卫
 * ============================================================ */

test('浮层一律 position:absolute（禁用 fixed —— 包含块会落到外层机身、四边各偏 16px）', () => {
  assert.equal(
    /position\s*:\s*fixed/.test(STYLE),
    false,
    'PhotosApp 内出现 position: fixed ⇒ 弹窗/toast 会跑到机身边框外'
  )
  const viewer = rule(STYLE, '.pv-viewer')
  assert.ok(viewer.includes('position: absolute'), '全屏层必须 absolute')
  assert.ok(viewer.includes('inset: 0'), '全屏层必须铺满应用根')
  const toast = rule(STYLE, '.pv-toast')
  assert.ok(toast.includes('position: absolute'), 'toast 必须 absolute')
  assert.ok(
    !toast.includes('translateX(-50%)'),
    '居中 toast 别用 left:50% + translateX(-50%)（会与 max-width 打架），改用 left:0;right:0;margin:0 auto'
  )
  assert.ok(/margin\s*:\s*0\s+auto/.test(toast), 'toast 居中必须走 margin: 0 auto')
})

test('顶部按钮避让 64px 边缘手势热区（.edge-zone z 85）', () => {
  const tokens = read('src/styles/tokens.css')
  const safeTop = Number(tokens.match(/--safe-top\s*:\s*([\d.]+)px/)[1])
  const screenView = read('src/components/phone/ScreenView.vue')
  const svCode = code(screenView) // ⚠️ 剥注释后再读让位数值（注释里写同值不许算数）
  const zoneH = Number(svCode.match(/\.edge-zone\s*\{[^}]*height:\s*([\d.]+)px/)[1])
  assert.equal(zoneH, 64, '热区高度变了，下面的算式要跟着改')

  // 首页胶囊：位置交给通用件的 `#accessory` 槽（top 由折叠契约算出、right 走 --title-accessory-right）。
  // 🔴 本页若自绘 absolute 定位，会与槽的位置**叠加成双份偏移** ⇒ 守住「只放进槽、不自绘定位」。
  assert.ok(
    /<template\s+#accessory>/.test(code(APP_SRC)),
    '右上胶囊必须放进 LargeTitleHeader 的 #accessory 槽'
  )
  assert.ok(
    !/position:\s*absolute/.test(rule(STYLE, '.pv-head')),
    '.pv-head 不许自绘 absolute —— 定位归 #accessory（写 absolute 会叠加成双份偏移）'
  )
  const acc = rule(read('src/components/ui/LargeTitleHeader.vue'), '.lt-accessory')
  assert.ok(
    /top:\s*calc\(\s*var\(--safe-top[^)]*\)\s*\+\s*var\(--title-accessory-center/.test(acc),
    '附件槽 top 必须走 --title-accessory-center（与折叠后标题行盒垂直居中，参考图两态共线）'
  )
  assert.ok(acc.includes('transform: translateY(-50%)'), '附件槽必须 translateY(-50%) 自居中')
  assert.ok(acc.includes('right: var(--title-accessory-right'), '附件槽 right 必须走 --title-accessory-right')

  /* 🔴 胶囊按参考图落在 y 44.15–85.14px，**本来就会**落进 64px 热区（参考图就是这么画的）。
     正确解法不是把胶囊推下去（那就不是参考图的位置了），而是让热区在这块矩形里让位
     —— 由 ScreenView 的 `:has([data-large-title-accessory])` 规则保证。
     这里守住三件事：让位规则还在 / 覆盖整颗胶囊 / 按钮整体落在让位上缘之下。 */
  const yieldTop = Number(svCode.match(/--edge-yield-top:\s*([\d.]+)px/)[1])
  const yieldLeft = Number(svCode.match(/--edge-yield-left:\s*([\d.]+)px/)[1])
  // 胶囊尺寸**从本页 CSS 反解**（不写死）⇒ 改按钮尺寸这里立刻红
  const headRule = rule(STYLE, '.pv-head')
  const btnRule = rule(STYLE, '.pv-head-btn')
  const btnW = Number(btnRule.match(/width:\s*([\d.]+)px/)[1])
  const btnH = Number(btnRule.match(/height:\s*([\d.]+)px/)[1])
  const pillPad = Number(headRule.match(/padding:\s*([\d.]+)px/)[1])
  const pillGap = Number(headRule.match(/gap:\s*([\d.]+)px/)[1])
  const btnCount = (APP_SRC.match(/data-photos-head-\w+/g) || []).length
  assert.equal(btnCount, 3, '胶囊里应有 3 颗按钮')
  assert.equal(btnW, 44, '按钮宽 44（参考图反解：图标中心距 46.35px = 44 + gap 2）')
  assert.equal(btnH, 33, '按钮高 33（参考图胶囊高 40.3px = 33 + padding 6 + 边框）')
  assert.equal(pillGap, 2, '按钮间距 2px')
  assert.equal(pillPad, 3, '胶囊内边距 3px')
  const pillH = 1 + 2 * pillPad + btnH   // 标称高（0.5px 边框实际渲染成 1px ⇒ 实测 +1px）
  const pillW = 1 + btnCount * btnW + (btnCount - 1) * pillGap + 2 * pillPad
  const pillTop = safeTop + 10.65 - pillH / 2
  const btnTop = pillTop + 1 + pillPad
  assert.ok(yieldTop <= pillTop, `让位上缘 ${yieldTop}px 必须 ≤ 胶囊上缘 ${pillTop}px`)
  assert.ok(btnTop >= yieldTop, `按钮上缘 ${btnTop}px 必须 ≥ 让位上缘 ${yieldTop}px，否则上半部仍被热区截走`)
  assert.ok(
    yieldLeft <= 360 - 17 - pillW && yieldLeft >= 360 - 17 - pillW - 2,
    `让位左缘 ${yieldLeft}px 必须 ≈ 胶囊左缘 ${360 - 17 - pillW}px（机身宽 360 − 契约右内缩 17 − 胶囊宽）`
  )
  assert.ok(
    /\.screen-view:has\(\[data-large-title-accessory\]\)\s*\.edge-nc/.test(svCode) &&
      /\.screen-view:has\(\[data-large-title-accessory\]\)\s*\.edge-cc/.test(svCode),
    '通知中心与控制中心两条热区都必须让位（胶囊横跨 x 199–343，同时压在两者里）'
  )

  // 全屏：.pv-v-head 高 = --safe-top + 56px、padding-top = --safe-top ⇒ 内容区 56px，
  // 返回键 38px 垂直居中 ⇒ 中心 = 54 + (56-38)/2 + 19 = 82px（判据取中心：点得着与否看中心）
  const vhead = rule(STYLE, '.pv-v-head')
  const vheadH = Number(vhead.match(/height\s*:\s*calc\(\s*var\(--safe-top[^)]*\)\s*\+\s*([\d.]+)px\s*\)/)[1])
  const backH = Number(rule(STYLE, '.pv-v-back').match(/height\s*:\s*([\d.]+)px/)[1])
  const backCenter = safeTop + (vheadH - backH) / 2 + backH / 2
  assert.ok(backCenter > zoneH, `全屏返回键中心 ${backCenter}px 落进手势热区 ⇒ 点不动`)
  assert.ok(
    vhead.includes('padding: var(--safe-top'),
    '顶部内边距必须等于 --safe-top，否则按钮会被状态栏压住'
  )
})

test('全屏：图片在屏幕里垂直居中（舞台铺满整屏）+ 点屏幕切换 chrome（缺一即残）', () => {
  const tokens = read('src/styles/tokens.css')
  const screenH = Number(tokens.match(/--screen-h\s*:\s*([\d.]+)px/)[1])
  const safeTop = Number(tokens.match(/--safe-top\s*:\s*([\d.]+)px/)[1])

  /* ---- ① 舞台必须铺满整屏 ⇒ 图片居中点 = 屏幕中心 ----
     🔴 旧实现 `.pv-v-stage { flex: 1 }` 是 flex 子项：盒子 y = safeTop+56 → screenH，
        中心 = (110 + 788)/2 = 449，而屏幕中心是 394 ⇒ 图片被压低 55px
        （Ricky 2026-10-12：「图片在屏幕中上下居中显示」）。 */
  const stage = rule(STYLE, '.pv-v-stage')
  const head = rule(STYLE, '.pv-v-head')
  /* ⚠️ 舞台的判据必须**逐条声明精确比**（`split(';')` → trim → includes），不能子串匹配：
     `/inset:\s*0/` 会被 `inset: 0 0 110px 0` 骗过 ⇒ 假绿（牙齿测试实测抓到）。
     同「`mask-image` 被 `-webkit-mask-image` 骗过」的教训。 */
  const decls = (block) => block.split(';').map((x) => x.trim()).filter(Boolean)
  const stageDecls = decls(stage)
  assert.ok(stageDecls.includes('position: absolute'), '.pv-v-stage 必须绝对定位（不能是 flex:1 子项）')
  assert.ok(stageDecls.includes('inset: 0'), '.pv-v-stage 必须 inset:0 铺满整屏（4 值简写会让图片仍偏下）')
  assert.ok(stageDecls.includes('align-items: center'), '舞台必须纵向居中')
  assert.ok(/position:\s*absolute/.test(head), '.pv-v-head 必须改成覆盖层，否则仍占 flow 把舞台挤下去')
  assert.ok(!/flex:\s*none/.test(head), '.pv-v-head 不许残留 flex:none（旧 flex 布局的痕迹）')
  const oldCenter = 0.5 * (safeTop + 56 + screenH)
  assert.notEqual(oldCenter, screenH / 2, '基准：旧实现的居中点确实不等于屏幕中心')

  /* 顶栏 / 操作栏 / 扫描钮改成浮层后必须真压在舞台之上，否则「看得见点不到」 */
  const z = (sel) => Number(rule(STYLE, sel).match(/z-index:\s*(\d+)/)?.[1] ?? 0)
  assert.ok(z('.pv-v-stage') > 0, '舞台要有自己的层（否则浮层 z 无从比较）')
  for (const sel of ['.pv-v-head', '.pv-v-scan', '.pv-v-bar']) {
    assert.ok(z(sel) > z('.pv-v-stage'), `${sel} 的 z 必须大于舞台 z`)
  }

  /* 图片必须 contain 且上限按舞台（= 屏幕）算：竖图能用满整屏高、又不被裁切 */
  const img = rule(STYLE, '.pv-v-img')
  const imgDecls = decls(img)
  assert.ok(imgDecls.includes('object-fit: contain'), '图片必须 object-fit: contain（contain 才不裁切）')
  assert.ok(imgDecls.includes('max-height: 100%'), '图片上限必须按舞台高（= 屏幕高），否则竖图被压扁')
  assert.ok(imgDecls.includes('max-width: 100%'), '图片上限必须按舞台宽')

  /* ---- ② 点舞台切换 chrome；左右两侧仍是「上一张 / 下一张」---- */
  assert.ok(
    /data-photos-viewer-stage[^>]*@click="store\.toggleViewerChrome\(\)"/.test(APP_SRC),
    '舞台必须挂 @click 切 chrome'
  )
  for (const dir of ['prev', 'next']) {
    assert.ok(
      new RegExp(`data-photos-viewer-${dir}\\s+@click\\.stop`).test(APP_SRC),
      `${dir} 必须写 @click.stop —— 少了 .stop 点「上一张/下一张」会连带切换 chrome`
    )
  }
  assert.ok(/data-photos-viewer-back[^>]*@click\.stop/.test(APP_SRC), '返回键必须 @click.stop')

  /* ---- ③ 沉浸态是**配对**约束：本页藏三个浮层 + ScreenView 藏系统状态栏 ----
     只做本页 ⇒ 状态栏图标留在黑底上；只做 ScreenView ⇒ 按钮留在黑底上。 */
  for (const sel of ['.pv-v-head', '.pv-v-scan', '.pv-v-bar']) {
    const esc = sel.replace(/\./g, '\\.')
    assert.ok(
      new RegExp(`\\.pv-viewer\\[data-immersive-chrome\\]\\s*${esc}[^{]*\\{[^}]*opacity:\\s*0[^}]*pointer-events:\\s*none`).test(STYLE),
      `${sel} 的隐藏态必须**同时**给 opacity:0 与 pointer-events:none` +
        '（只给 opacity ⇒ 看不见的按钮仍然吃点击）'
    )
  }
  const svCode = code(read('src/components/phone/ScreenView.vue'))
  assert.ok(
    /\.screen-view:has\(\[data-immersive-chrome\]\)\s*\.status-bar\s*\{[^}]*opacity:\s*0/.test(svCode),
    'ScreenView 必须用 :has([data-immersive-chrome]) 藏系统状态栏' +
      '（--z-status-bar 90 > --z-app-window 30 ⇒ 应用盖不住它，只能由这里响应）'
  )
  // ⚠️ 属性必须 `|| null`：传 false 时属性以 "false" 存在，`:has()` 照样命中
  assert.ok(
    /:data-immersive-chrome="store\.viewerChromeHidden \|\| null"/.test(APP_SRC),
    '沉浸态属性必须写 `|| null`（传 false 会让属性以 "false" 存在，:has() 仍命中）'
  )
  // 挂载复位：回桌面只卸载应用 DOM、**不动 store** ⇒ 必须 onMounted 归位
  assert.ok(
    /onMounted\(\(\) => \{[\s\S]*?store\.showViewerChrome\(\)[\s\S]*?\}\)/.test(SCRIPT),
    'onMounted 必须调用 showViewerChrome()（否则「隐藏态回桌面再进相册」= 全屏且无任何按钮）'
  )
})

test('字号不低于 12px（归档重放最易翻车处）', () => {
  const sizes = [...STYLE.matchAll(/font-size\s*:\s*([\d.]+)px/g)].map((m) => Number(m[1]))
  assert.ok(sizes.length >= 5, `只扫到 ${sizes.length} 处 font-size，扫描规则可能失效`)
  const small = sizes.filter((n) => n < 12)
  assert.deepEqual(small, [], `出现 <12px 字号：${small.join(', ')}`)
  // 大标题字号不再由本页给 —— 走通用件的 `--title-size`；
  // 本页一旦出现 .pv-title 就是「又自绘了一份」（曲线数值由 tests/largeTitle.test.js 守）
  assert.ok(!/\.pv-title\b/.test(STYLE), '大标题必须走通用件，不许在本页重画 .pv-title')
})

test('类名表无重复规则头（同文件重名 ⇒ 规则被静默覆盖、textContent 断言假绿）', () => {
  /* ⚠️ 已知约束：扫描按「行首的 `.类名` + 紧跟 `,` 或 `{`」判定 ⇒
     一条**以类名起头的分组规则**（`.a,\n.b { }`）会把首个类名也登记成规则头，
     与它自己的基础规则撞成假重复。所以别写这类分组规则 ——
     把声明并进各自的基础规则即可（2026-10-12 全屏浮层的 transition 就是这么放的）。 */
  const heads = [...STYLE.matchAll(/^\.([a-z][\w-]*)\s*(?:,|\{)/gm)].map((m) => m[1])
  const dup = heads.filter((h, i) => heads.indexOf(h) !== i)
  assert.deepEqual([...new Set(dup)], [], `重复定义的类名：${[...new Set(dup)].join(', ')}`)
  assert.ok(heads.length >= 20, `只扫到 ${heads.length} 个类名，扫描规则可能失效`)
})

test('滚动容器真的能滚 + 渐隐遮罩挂在自身（否则大标题永远停在起手态）', () => {
  const scroll = rule(STYLE, '.pv-scroll')
  // ⚠️ 逐条声明精确匹配（`split(';')` 后 trim 再比）：
  //    子串匹配会被 `-webkit-` 前缀骗过 —— 实测「只删标准 mask-image、留 -webkit-」时子串仍命中 ⇒ 假绿。
  const decls = scroll.split(';').map((x) => x.trim()).filter(Boolean)
  const has = (d) => decls.includes(d)
  assert.ok(
    has('overflow-y: auto'),
    '🔴 .pv-scroll 必须 overflow-y:auto —— 否则 scrollTop 恒 0、大标题永远折不动（2026-10-12 真缺陷）'
  )
  assert.ok(has('height: 100%'), '.pv-scroll 必须 height:100%（撑满 .pv-page 才有滚动区间）')
  assert.ok(/--tabbar-fade:\s*linear-gradient/.test(scroll), '--tabbar-fade 必须在滚动容器自身规则内定义')
  assert.ok(has('mask-image: var(--tabbar-fade)'), '标准 mask-image 必须在（只留 -webkit- 会让非 WebKit 引擎没有遮罩）')
  assert.ok(has('-webkit-mask-image: var(--tabbar-fade)'), '-webkit-mask-image 必须在（WebKit 引擎靠它）')
})

test('底栏 / 搜索圆钮 / 渐隐遮罩三者几何配对', () => {
  const tabbar = read('src/components/ui/FloatingTabBar.vue')
  assert.ok(/height="62px"/.test(APP_SRC), '底栏高度走标准控件默认值 62px')
  assert.ok(/bottom="22px"/.test(APP_SRC), '底栏距底走标准控件默认值 22px')
  assert.ok(/:dark="false"/.test(APP_SRC), '浅色页面必须 dark=false（否则底栏走深色玻璃）')
  assert.ok(
    !/home-indicator-zone/.test(rule(STYLE, '.photos-app :deep(.floating-tab-bar)')),
    '别给底栏塞 home-indicator-zone（会把底栏顶到 56px、浮在卡片中间）'
  )

  const deep = rule(STYLE, '.photos-app :deep(.floating-tab-bar)')
  assert.ok(deep.includes('left: 22px'), '底栏左边缘对齐 22px')
  assert.ok(deep.includes('transform: none'), '必须撤掉控件自带的 translateX(-50%)，否则左移量算错')
  assert.ok(deep.includes('62px'), '宽度算式必须给右侧搜索圆钮让出 62px')

  const search = rule(STYLE, '.pv-search')
  assert.ok(search.includes('right: 22px') && search.includes('bottom: 22px'), '搜索圆钮与底栏同基线')
  assert.ok(/width\s*:\s*62px/.test(search) && /height\s*:\s*62px/.test(search), '搜索圆钮 62×62，与底栏等高')

  const scroll = rule(STYLE, '.pv-scroll')
  assert.ok(scroll.includes('mask-image'), '滚动容器必须挂渐隐遮罩（底栏浮在内容上，没有遮罩会糊在一起）')
  assert.ok(/calc\(100% - 92px\)/.test(scroll), '渐隐起点 100%-92px（底栏上沿外 8px）')
  assert.ok(/calc\(100% - 22px\)/.test(scroll), '渐隐终点 100%-22px（与底栏底边同锚）')
  assert.ok(/height\s*:\s*110px/.test(rule(STYLE, '.pv-pad')), '底部留白 110px，最后一行才不会被底栏吞掉')

  // 底栏标准控件本身不回归
  assert.ok(/--tab-accent/.test(tabbar), '底栏仍走 accent-color 变量')
})

test('全屏竖向栈：操作栏 / 扫描钮 / toast 三段不重叠，且操作栏对齐标准底栏位', () => {
  const px = (re, src, what) => {
    const m = src.match(re)
    assert.ok(m, `取不到 ${what}`)
    return Number(m[1])
  }
  /** 把 `calc(22px + 56px + 10px)` 求和（比 eval 安全，且锚点一变立刻报错） */
  const calcSum = (src, what) => {
    const m = src.match(/bottom\s*:\s*calc\(([^)]*)\)/)
    assert.ok(m, `${what} 的 bottom 必须写成可推导的 calc 串`)
    const terms = m[1].split('+').map((t) => t.trim())
    for (const t of terms) assert.match(t, /^[\d.]+px$/, `${what} 的 calc 项 ${t} 应为纯 px`)
    return terms.reduce((a, t) => a + Number(t.replace('px', '')), 0)
  }

  const bar = rule(STYLE, '.pv-v-bar')
  const scan = rule(STYLE, '.pv-v-scan')
  const toast = rule(STYLE, '.pv-toast')

  const barBottom = px(/bottom\s*:\s*([\d.]+)px/, bar, '.pv-v-bar bottom')
  const barPad = px(/padding\s*:\s*([\d.]+)px/, bar, '.pv-v-bar padding')
  const barBtnH = px(/height\s*:\s*([\d.]+)px/, rule(STYLE, '.pv-v-act'), '.pv-v-act height')
  const barH = barBtnH + barPad * 2
  const scanH = px(/height\s*:\s*([\d.]+)px/, scan, '.pv-v-scan height')

  // 🔴 操作栏必须落在本仓标准底栏位（FloatingTabBar 默认 bottom="22px"），
  //    否则「全屏操作栏」比「首页底栏」高出一截 —— 切进切出会跳，且犯「位置太高」
  assert.equal(barBottom, 22, '全屏操作栏 bottom 必须与首页底栏同值 22px')
  assert.equal(
    Number(APP_SRC.match(/bottom="22px"/)[0].replace(/\D/g, '')),
    22,
    '首页底栏也必须是 22px（两处同源）'
  )

  // 扫描钮骑在操作栏上方：22 + 操作栏高 + 10
  const scanBottom = calcSum(scan, '.pv-v-scan')
  assert.equal(
    scanBottom,
    barBottom + barH + 10,
    `扫描钮 bottom ${scanBottom} 应等于「标准底栏位 + 操作栏高 ${barH} + 间隙 10」`
  )

  // toast 抬到扫描钮之上：扫描钮 bottom + 扫描钮高 + 10
  const toastBottom = calcSum(toast, '.pv-toast')
  assert.equal(
    toastBottom,
    scanBottom + scanH + 10,
    `toast bottom ${toastBottom} 应等于「扫描钮 bottom + 扫描钮高 ${scanH} + 间隙 10」`
  )
  assert.ok(
    toastBottom - scanBottom >= scanH + 8,
    `toast（bottom ${toastBottom}）与扫描钮（bottom ${scanBottom}，高 ${scanH}）竖直重叠 —— ` +
      '短回执侥幸不撞，换成长回执就会压在按钮上'
  )

  // 操作栏本身不能压到 home-indicator 的可视条（`.bar` 距底 9~14px）
  assert.ok(barBottom >= 14, '操作栏下沿不得落进 home-indicator 可视条（距底 9~14px）')
})

test('弹层状态清理必须挂 @cancel（挂 @update:visible 会让「删除」点了没反应）', () => {
  /* 2026-10-12 由 verify-photos-flow 抓到的真 bug：
     `ActionSheetModal.onSelect()` 的 emit 顺序是 `update:visible(false)` → `select`。
     把 `store.cancelDelete()` 挂到 `@update:visible` 上，就会在 `confirmDelete()`
     跑到之前先把 `pendingDeleteId` 清成 null ⇒ 删除静默失效（点「删除」什么都不发生）。 */
  assert.equal(
    /@update:visible\s*=/.test(APP_SRC),
    false,
    'photos 的弹层不许再把状态清理挂 @update:visible —— 改用 @cancel（注释里提到它无所谓，认的是属性赋值形式）'
  )
  assert.ok(APP_SRC.includes('@cancel="store.cancelDelete()"'), '删除面板的取消清理必须挂 @cancel')
  assert.ok(APP_SRC.includes('@cancel="store.closeMore()"'), '更多面板的取消清理必须挂 @cancel')
  assert.ok(APP_SRC.includes('@select="() => store.confirmDelete()"'), '删除面板的确认必须挂 @select')
  assert.ok(APP_SRC.includes('@select="onMoreSelect"'), '更多面板的选项必须挂 @select')

  // 这条守卫的前提是「控件先 emit update:visible 再 emit select」——
  // 控件哪天改了这个顺序，这条断言会红，提示重新评估上面那几条。
  const modal = read('src/components/ui/ActionSheetModal.vue')
  const i = modal.indexOf('function onSelect')
  assert.ok(i > -1, '找不到 ActionSheetModal.onSelect')
  const body = modal.slice(i, i + 240)
  assert.ok(
    body.length && body.indexOf("emit('update:visible', false)") < body.indexOf("emit('select'"),
    'ActionSheetModal.onSelect 的 emit 顺序变了 ⇒ 请重新评估本用例的接线结论'
  )
})

test('全屏左右切换到边界要给回执（不许静默）', () => {
  assert.match(
    SCRIPT,
    /function onStep\(delta\)\s*\{[^}]*store\.report\('lastPhoto'\)/,
    'onStep 必须在 stepViewer 返回 false 时给 lastPhoto 回执，否则用户以为按键坏了'
  )
  assert.ok(
    // ⚠️ 必须 `@click.stop`：舞台自己挂着「点一下切 chrome」，少了 .stop
    //    点「上一张/下一张」会连带把 chrome 切走（2026-10-12）
    /data-photos-viewer-prev @click\.stop="onStep\(-1\)"/.test(APP_SRC) &&
      /data-photos-viewer-next @click\.stop="onStep\(1\)"/.test(APP_SRC),
    'prev/next 必须走 onStep 且带 .stop（否则边界无反馈 / 顺手切掉 chrome）'
  )
  // 该回执词条三语必须都存在，否则边界会显示成 key
  assert.ok(PHOTOS.zh.notice.lastPhoto, 'zh 缺 notice.lastPhoto')
  assert.ok(PHOTOS.en.notice.lastPhoto, 'en 缺 notice.lastPhoto')
  assert.ok(PHOTOS.bn.notice.lastPhoto, 'bn 缺 notice.lastPhoto')
})

test('模板钩子齐备（e2e / 后续维护依赖这些 data-* 锚点）', () => {
  const need = [
    'data-photos-page', 'data-photos-head', 'data-photos-head-list', 'data-photos-head-select',
    'data-photos-head-settings', 'data-photos-title', 'data-photos-grid', 'data-photos-day',
    'data-photo=', 'data-photos-empty', 'data-photos-tabbar', 'data-photos-search',
    'data-photos-viewer', 'data-photos-viewer-back', 'data-photos-viewer-date',
    'data-photos-viewer-time', 'data-photos-viewer-stage', 'data-photos-viewer-img',
    'data-photos-viewer-prev', 'data-photos-viewer-next', 'data-photos-viewer-scan',
    'data-photos-viewer-bar', 'data-photos-action=', 'data-photos-toast'
  ]
  for (const k of need) {
    assert.ok(APP_SRC.includes(k), `模板缺少钩子 ${k}`)
  }
})

test('分组标题与大标题同一条竖线（左缘基准只有 --title-inset 一个来源）', () => {
  /* Ricky 2026-10-12 用竖线标注的缺陷：参考图里大标题墨迹 25.9 与分组标题墨迹 26.3
     落在**同一条竖线**上，而本仓改前是 26.0 / 17.0 —— 差 9px
     （分组标题走的是自己的 2px `.pv-day` padding + 14px margin，与大标题毫无关系）。 */
  const decls = (block) => block.split(';').map((x) => x.trim()).filter(Boolean)

  /* ⚠️ 逐条声明精确比，别用子串：写死 `margin: 0 25px 8px` 同样能渲染出正确结果，
     但它把契约复制进了页面 —— 将来 `--title-inset` 一改就静默跑偏。 */
  const dayTitleDecls = decls(rule(STYLE, '.pv-day-title'))
  assert.ok(
    dayTitleDecls.includes('margin: 0 calc(var(--title-inset, 24px) + 1px) 8px'),
    `.pv-day-title 左内缩必须走 --title-inset（+1px 是字体度量补偿），实际：${JSON.stringify(dayTitleDecls)}`
  )
  // 唯一来源：折叠契约变量本来只挂在 LargeTitleHeader 自己的根上，分组标题不是它的后代
  // ⇒ 页面必须把 largeTitleVars() 挂到滚动容器上，否则 `--title-inset` 读不到、回落成 24px 的假巧合
  /* ⚠️ 不能把锚点写成 `<div class="pv-scroll" :style=...>` 的**紧邻**匹配 ——
     在同一个标签上加一个别的属性（合理改动）就会假红。牙齿测试实测抓到过。
     只要求「:style 在这个标签里」，属性顺序与额外属性都不影响。 */
  const scrollTag = (code(APP_SRC).match(/<div[^>]*class="pv-scroll"[^>]*>/) || [''])[0]
  assert.ok(
    scrollTag.includes(':style="titleVars"'),
    `.pv-scroll 必须绑 :style="titleVars"，否则 --title-inset 传不到分组标题（实际标签：${scrollTag}）`
  )
  assert.ok(
    /const titleVars = computed\(\(\) => largeTitleVars\(titleProgress\.value\)\)/.test(SCRIPT),
    'titleVars 必须直接来自 largeTitleVars()，不许在本页复制折叠契约里的数字'
  )

  /* 🔴 基准不能被推到别处：`.pv-day` 一旦带横向 padding，分组标题的起点就跟着漂。
     网格自己的 2px 内缩必须留在 `.pv-grid` 上。 */
  assert.equal(
    decls(rule(STYLE, '.pv-day')).some((d) => /^padding(-left|-right)?\s*:/.test(d)),
    false,
    '.pv-day 不许有横向 padding（会把分组标题的基准推走）'
  )
  assert.ok(
    decls(rule(STYLE, '.pv-grid')).includes('padding: 0 2px'),
    '.pv-grid 必须自带 2px 内缩（照片贴屏边，参考图里也是贴到 x=0）'
  )
})

test('复用系统壁纸 + 全屏切图标：chrome 随全屏在 dark/light 间切换', () => {
  assert.match(SCRIPT, /PRESET_WALLPAPERS|photosStore/, '数据必须来自 photosStore（内含 PRESET_WALLPAPERS）')
  assert.ok(
    /useSystemChrome\(/.test(SCRIPT) && /'light'/.test(SCRIPT) && /'dark'/.test(SCRIPT),
    '全屏黑底要切白图标、首页浅底要切深图标'
  )
  // 本轮起 onMounted 是块体（除 syncToday 还要复位沉浸态）⇒ 断言只锁「调了 syncToday」
  assert.ok(/onMounted\(\(\) => \{[\s\S]*?store\.syncToday\(\)/.test(SCRIPT), '进应用必须校准「今天」')
  assert.ok(
    APP_SRC.includes('data-photos-tabbar') && APP_SRC.includes('#icon'),
    '底栏图标必须走 #icon 插槽自绘（控件默认 fill 硬编码 #FFFFFF）'
  )
})

/* ============================================================
 * ③ 注册接线
 * ============================================================ */

test('注册表：photos 已映射到 PhotosApp，且 depth 升为 core（apps.js / drawerApps.js 两处同步）', () => {
  const reg = read('src/components/apps/registry.js')
  assert.ok(reg.includes("import PhotosApp from './photos/PhotosApp.vue'"), 'registry 缺 import')
  assert.ok(/appComponents\s*=\s*\{[^}]*photos:\s*PhotosApp/.test(reg), 'registry 缺 photos → PhotosApp 映射')

  const home = APPS.find((a) => a.id === 'photos')
  assert.ok(home, 'apps.js 缺 photos')
  assert.equal(home.depth, 'core', 'apps.js 里 photos 仍是 placeholder')
  const drawer = DRAWER_APPS.find((a) => a.id === 'photos')
  assert.ok(drawer, 'drawerApps.js 缺 photos')
  assert.equal(drawer.depth, 'core', 'drawerApps.js 里 photos 仍是 placeholder')

  assert.equal(DRAWER_APPS.length, 38, '抽屉数量不得变化（appDrawer.test.js 断言 38）')
  assert.equal(
    new Set(DRAWER_APPS.map((a) => a.id)).size,
    DRAWER_APPS.length,
    '抽屉 id 不得重复'
  )
})

test('photos 不进 DARK_BG_APPS（首页是浅底，进应用后状态栏走深色图标）', () => {
  const screenView = read('src/components/phone/ScreenView.vue')
  const m = screenView.match(/DARK_BG_APPS\s*=\s*\[([^\]]*)\]/)
  assert.ok(m, '找不到 DARK_BG_APPS')
  assert.equal(
    /photos/.test(m[1]),
    false,
    'photos 不该登记为深底应用（全屏查看时图标由 useSystemChrome 自己切）'
  )
})

test('i18n：ph getter 路径式取用 + 缺项回落中文', () => {
  const src = read('src/stores/i18nStore.js')
  assert.ok(src.includes('PHOTOS'), 'i18nStore 未接入 photos 词条')
  assert.ok(/ph:\s*\(s\)\s*=>\s*\(path\)/.test(src), 'ph 必须写成普通 getter（curried），供组件 ph(path) 直接调用')
  assert.ok(src.includes('PHOTOS.zh'), 'ph 缺项必须回落到中文，不能回落到 key')
})
