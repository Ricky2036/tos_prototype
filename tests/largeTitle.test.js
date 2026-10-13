/**
 * 大标题通用件单测（useLargeTitle.js + LargeTitleHeader.vue）
 * ========================================================
 * 起因（Ricky 2026-10-12）：
 *   ①「照片大标题的滑动需要跟设置大标题一致」——相册页的大标题原来是 `position: static`，一滚就走；
 *   ②「避免状态栏图标直接与内容重叠」——滚动时内容直接顶到状态栏图标下面；
 *   ③「这个需要做成通用的处理方式」——抽成通用件，两页共用同一套实现与同一条曲线。
 *
 * 五组守卫：
 *   ① 折叠曲线常量（唯一事实来源）—— 数值级，改坏立刻红
 *   ② largeTitleVars() 的逐值输出（端点 + 中点 + clamp + curve 覆写）
 *   ③ useLargeTitle() 的行为（progress 映射 / clamp / onScroll 取 currentTarget）
 *   ④ 两页接线一致性 + 组件源码结构（sticky / 底幕 / 槽几何 / 裸 ref 兼容）
 *   ⑤ 静态几何算术复核（条高、两态顶内缩、右上让位矩形 vs 64px 手势热区）
 *   ⑥ accessoryCenter() 行为（菜单与折叠态标题的行盒中心共线）
 *
 * 🔴 纪律：结构类断言一律作用在 `code()`（**剥掉注释**）之后的文本上。
 *    teeth 实测：把 `isolation: isolate;` 改成 `/* isolation: isolate; *\/` 时，
 *    直接对原文 `includes()` 仍然为真 ⇒ **假绿**。剥注释同时避免自己写的说明注释造成假红。
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { ref } from 'vue'
import {
  LARGE_TITLE,
  TITLE_LINE_HEIGHT,
  largeTitleVars,
  accessoryCenter,
  useLargeTitle,
  asProgress
} from '../src/composables/useLargeTitle.js'

const ROOT = process.cwd()
const read = (p) => fs.readFileSync(path.resolve(ROOT, p), 'utf-8')

/** 剥掉 CSS/JS 块注释与 HTML 注释 —— 只留「有效代码」 */
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ')

const COMPOSABLE = code(read('src/composables/useLargeTitle.js'))
const HEADER_RAW = read('src/components/ui/LargeTitleHeader.vue')
const HEADER = code(HEADER_RAW)
const PHOTOS = code(read('src/components/apps/photos/PhotosApp.vue'))
const SETTINGS = code(read('src/components/apps/settings/SettingsApp.vue'))

function rule(css, selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = css.match(new RegExp(`${esc}\\s*\\{([^}]*)\\}`))
  return m ? m[1] : ''
}

/* ============================================================
 * ① 折叠曲线常量 —— 全仓唯一事实来源
 * ============================================================ */
test('折叠曲线常量：数值与设置页实测轨迹一致（改这里两页一起变）', () => {
  assert.deepEqual(LARGE_TITLE, {
    distance: 72,      // 折叠全距 = 72px 滚动
    fromSize: 36,      // 字号 36 → 22
    toSize: 22,
    fromInset: 24,     // 左右内缩 24 → 24（**相等** ⇒ 起手/缩小的左边界天然对齐，参考图 26.0 / 25.0）
    toInset: 24,
    fromTopInset: 36,  // 顶部内缩 36 → −2（行盒中心 110.7 → 64.65 = 参考图墨迹中心 110.85 / 64.85）
    toTopInset: -2,
    fromHeight: 105,   // 标题区高 105 → 64（条总高 = --safe-top + height ⇒ 159 → 118）
    toHeight: 64,
    accessoryRight: 17 // 右上 #accessory 槽距机身右缘（参考图图标墨迹右内缩 34.3）
  })
  assert.equal(LARGE_TITLE.distance, 72, '折叠全距变了，probe 的采样档位与 e2e 判据都要跟着改')
})

/* ============================================================
 * ② largeTitleVars() 逐值输出
 * ============================================================ */
test('largeTitleVars：端点与 midpoint 逐值正确，且 progress 被 clamp 到 [0,1]', () => {
  const ACC = { '--title-accessory-center': '10.65px', '--title-accessory-right': '17px' }
  assert.deepEqual(largeTitleVars(0), {
    '--title-progress': '0',
    '--title-size': '36px',
    '--title-inset': '24px',
    '--title-top-inset': '36px',
    '--title-height': '105px',
    ...ACC
  })
  assert.deepEqual(largeTitleVars(1), {
    '--title-progress': '1',
    '--title-size': '22px',
    '--title-inset': '24px',
    '--title-top-inset': '-2px',
    '--title-height': '64px',
    ...ACC
  })
  const ph = largeTitleVars(0.5)
  assert.equal(ph['--title-size'], '29px', '中点字号应为 (36+22)/2 = 29px')
  assert.equal(ph['--title-inset'], '24px', '两态内缩相等 ⇒ 中点也是 24px（标题不会左右漂）')
  assert.equal(ph['--title-top-inset'], '17px')
  assert.equal(ph['--title-height'], '84.5px', '中点条高应为 (105+64)/2 = 84.5px')
  assert.equal(ph['--title-progress'], '0.5')
  // 🔴 菜单在参考图两态里位置**完全相同** ⇒ accessory 的两个变量不随 progress 变
  assert.equal(ph['--title-accessory-center'], largeTitleVars(0)['--title-accessory-center'])
  assert.equal(ph['--title-accessory-center'], largeTitleVars(1)['--title-accessory-center'])

  // clamp：负值 / 超界 / 非数
  assert.equal(largeTitleVars(-0.5)['--title-progress'], '0', '负进度必须 clamp 到 0')
  assert.equal(largeTitleVars(2)['--title-size'], '22px', '超界进度必须 clamp 到 1')
  assert.equal(largeTitleVars(2)['--title-progress'], '1')
  assert.equal(largeTitleVars(NaN)['--title-progress'], '0', 'NaN 必须兜底成 0（不能把 NaN 写进 CSS 变量）')
  assert.equal(largeTitleVars(undefined)['--title-progress'], '0')

  // curve 覆写
  assert.equal(largeTitleVars(1, { toSize: 19 })['--title-size'], '19px', 'curve 覆写必须生效')
  assert.equal(largeTitleVars(1, { accessoryRight: 24 })['--title-accessory-right'], '24px', 'curve 覆写必须能改右内缩')
})

/* ============================================================
 * ③ useLargeTitle() 行为
 * ============================================================ */
test('useLargeTitle：progress = clamp(scrollTop / distance)，onScroll 取 currentTarget', () => {
  const lt = useLargeTitle()
  assert.equal(lt.scrollTop.value, 0, '初始 scrollTop 为 0')
  assert.equal(lt.progress.value, 0, '初始进度为 0')
  assert.equal(lt.distance, 72)

  // 🔴 必须读 event.currentTarget —— 读 event.target 会在事件冒泡自子元素时拿到错的滚动位置
  lt.onScroll({ currentTarget: { scrollTop: 36 } })
  assert.equal(lt.progress.value, 0.5, '半程应为 0.5')
  lt.onScroll({ currentTarget: { scrollTop: 72 } })
  assert.equal(lt.progress.value, 1, '满程应为 1')
  lt.onScroll({ currentTarget: { scrollTop: 1000 } })
  assert.equal(lt.progress.value, 1, '超程必须 clamp 到 1')
  lt.onScroll({ currentTarget: { scrollTop: 0 } })
  assert.equal(lt.progress.value, 0, '回到顶部必须归零')

  // 空事件兜底（不能抛、不能污染成 NaN）
  lt.onScroll(null)
  assert.equal(lt.progress.value, 0, 'onScroll(null) 必须兜底成 0')

  // sync(el)：支持直接传元素
  lt.sync({ scrollTop: 72 })
  assert.equal(lt.progress.value, 1, 'sync() 必须与 onScroll 同源')
  lt.sync(null)
  assert.equal(lt.progress.value, 0, 'sync(null) 必须兜底成 0')

  // 独立实例（不共享状态）
  const a = useLargeTitle(), b = useLargeTitle()
  a.onScroll({ currentTarget: { scrollTop: 72 } })
  assert.equal(a.progress.value, 1)
  assert.equal(b.progress.value, 0, '两个实例不许共享 ref')
})

/* ============================================================
 * ④ 两页接线一致性 + 组件源码结构
 * ============================================================ */
test('两页接线逐字一致 —— 「相册跟设置一致」的机械保证', () => {
  const DECL = 'const { progress: titleProgress, onScroll: onTitleScroll } = useLargeTitle()'
  for (const [name, src] of [['相册', PHOTOS], ['设置', SETTINGS]]) {
    assert.ok(src.includes(DECL), `${name}页必须写成 ${DECL}`)
    assert.ok(src.includes('<LargeTitleHeader'), `${name}页必须挂载通用件组件`)
    assert.ok(src.includes(':progress="titleProgress"'), `${name}页必须把 titleProgress 交给通用件`)
    assert.ok(src.includes('@scroll.passive="onTitleScroll"'), `${name}页滚动容器必须挂 @scroll.passive`)

    // 🔴 `<script setup>` 只自动解包顶层 ref：写 `lt.progress` 会传下 ComputedRef、
    //    静默退化成恒 0 且**不报错**（2026-10-12 已踩过一次）⇒ 整对象只许出现一次调用
    assert.equal(
      (src.match(/useLargeTitle\(\)/g) || []).length,
      1,
      `${name}页只许有一处 useLargeTitle() 调用（写成 \`const lt = useLargeTitle()\` 会静默退化成恒 0）`
    )

    // ⛔ 不许自绘：曲线 / 底幕 / sticky / 旧的双节点交叉淡入
    assert.ok(!/--title-size\s*:/.test(src), `${name}页不许自定义 --title-size（曲线唯一来源是 useLargeTitle.js）`)
    assert.ok(!/position:\s*sticky/.test(src), `${name}页不许自己 sticky（通用件本体负责）`)
    assert.ok(!/settings-compact-header/.test(src), '不许回到「双标题节点交叉淡入」的老做法')

    // 两页必须引用**同一个**组件与 composable
    assert.ok(src.includes('../../ui/LargeTitleHeader.vue'), `${name}页必须引用同一个 ui/LargeTitleHeader.vue`)
    assert.ok(
      /\.\.\/\.\.\/\.\.\/composables\/useLargeTitle(\.js)?'/.test(src),
      `${name}页必须引用同一个 composables/useLargeTitle`
    )
  }
})

test('LargeTitleHeader 源码结构：sticky 本体 + ::before 底幕 + 槽几何 + 裸 ref 兼容', () => {
  const lt = rule(HEADER, '.large-title')
  assert.ok(lt.includes('position: sticky'), '本体必须 sticky（内容从它下面穿过）')
  assert.ok(lt.includes('top: 0'), '必须钉在 top:0')
  assert.ok(
    /height:\s*calc\(\s*var\(--safe-top[^)]*\)\s*\+\s*var\(--title-height/.test(lt),
    '条总高必须 = --safe-top + --title-height'
  )
  assert.ok(
    /padding:\s*calc\(\s*var\(--safe-top[^)]*\)\s*\+\s*var\(--title-top-inset/.test(lt),
    '顶部内边距必须 = --safe-top + --title-top-inset'
  )
  assert.ok(lt.includes('isolation: isolate'), '必须 isolation: isolate —— 否则 ::before 的 z-index:-1 会钻到页面内容下面')
  assert.ok(lt.includes('box-sizing: border-box'), 'box-sizing 必须是 border-box（否则 padding 会把条撑高）')

  const before = rule(HEADER, '.large-title::before')
  assert.ok(before.includes("content: ''"), '底幕必须是 ::before 伪元素（不能多开一个 DOM 节点）')
  assert.ok(before.includes('z-index: -1'), '底幕必须在内容之下')
  assert.ok(before.includes('inset: 0'), '底幕必须铺满标题条')
  assert.ok(before.includes('opacity: var(--title-progress'), '🔴 底幕透明度必须绑定折叠进度')
  assert.ok(before.includes('pointer-events: none'), '底幕不许拦指针')
  for (const stop of ['0.99', '0.7', '0.24']) {
    assert.ok(before.includes(stop), `底幕渐变必须保留 ${stop} 这一档（决定遮蔽边界）`)
  }
  // 🔴 99% 不透明区必须盖到折叠态菜单底缘（84.65px）：118 × 72% = 85.0px ≥ 84.65
  assert.ok(
    /0\.99\)\s*72%/.test(before),
    '底幕 99% 不透明区必须延伸到 72% 条高（62% 只到 73.2px，折叠态菜单下半截会露内容）'
  )
  assert.ok(/rgba\(var\(--title-scrim/.test(before), '底幕基色必须走 --title-scrim（各页底色不同，写死会串色）')
  assert.ok(
    HEADER.includes("scrim: { type: String, default: '244, 245, 247' }"),
    '底幕默认基色应为本仓应用默认底色 #F4F5F7'
  )

  const title = rule(HEADER, '.lt-title')
  assert.ok(title.includes('font-size: var(--title-size'), '标题字号必须来自曲线变量')
  assert.ok(title.includes('transform-origin: left top'), '缩放锚点必须在左上（否则会左右漂）')

  const acc = rule(HEADER, '.lt-accessory')
  assert.ok(acc.includes('position: absolute'), '附件槽必须绝对定位（不参与 --title-inset 的左右内缩）')
  assert.ok(
    /top:\s*calc\(\s*var\(--safe-top[^)]*\)\s*\+\s*var\(--title-accessory-center/.test(acc),
    '附件槽 top 必须走 --title-accessory-center（= 折叠后标题行盒的垂直中心，菜单与标题共线）'
  )
  assert.ok(acc.includes('transform: translateY(-50%)'), '附件槽必须 translateY(-50%) 自居中 —— 槽内容高度由页面定，不许写死')
  assert.ok(
    acc.includes('right: var(--title-accessory-right'),
    '附件槽 right 必须走 --title-accessory-right（契约里的 17px）'
  )

  // 🔴 归一化必须**行为级**覆盖，别只查源码字符串 —— teeth 实测：
  //    只断言「源码里有 typeof x.value」时，把**数字分支整条删掉**仍全绿（真洞）。
  //    归一化因此抽到 composable 的 `asProgress()`，由下面那条 test 直接调它。
  assert.ok(
    /import \{ largeTitleVars, asProgress \} from '\.\.\/\.\.\/composables\/useLargeTitle\.js'/.test(HEADER),
    '归一化必须复用 composable 的 asProgress（本组件不许再写一份）'
  )
  assert.ok(
    !/const asNumber\s*=/.test(HEADER) && !/typeof x\.value === 'number'/.test(HEADER),
    '本组件不许内联一份归一化逻辑（2026-10-12 曾因漏认裸 ref 静默退化）'
  )
  assert.ok(/asProgress\(props\.progress\) \?\? 0/.test(HEADER), '认不出时必须兜底成 0（不是 NaN）')
  assert.ok(HEADER.includes('<slot>') && HEADER.includes('<slot name="accessory" />'), '必须同时提供默认槽与 #accessory 槽')
  assert.ok(
    HEADER.includes('data-large-title') && HEADER.includes('data-large-title-text') && HEADER.includes('data-large-title-accessory'),
    '必须暴露 data-large-title / -text / -accessory 供探针与 e2e 取用'
  )
})

test('asProgress：四种形态归一 + 认不出返回 null（「静默退化」的根治点）', () => {
  // ① 数字（计算属性解包后的值）
  assert.equal(asProgress(0.5), 0.5)
  assert.equal(asProgress(1), 1)
  assert.equal(asProgress(0), 0)
  // ② 裸 ref —— 🔴 缺这条就是 2026-10-12 那次静默退化的根因
  assert.equal(asProgress(ref(0.25)), 0.25, '裸 ref 必须解包（否则 `:progress="lt.progress"` 恒 0 且不报错）')
  // ③ useLargeTitle() 返回的整对象
  assert.equal(asProgress({ progress: 0.75 }), 0.75)
  // ④ 整对象里套 ref
  assert.equal(asProgress({ progress: ref(0.6) }), 0.6)
  // 认不出 ⇒ null（由调用方兜底成 0），**绝不返回 NaN**
  assert.equal(asProgress(undefined), null)
  assert.equal(asProgress(null), null)
  assert.equal(asProgress(NaN), null, 'NaN 必须被 Number.isFinite 拦下')
  assert.equal(asProgress(Infinity), null, 'Infinity 必须被拦下')
  assert.equal(asProgress(-Infinity), null)
  assert.equal(asProgress('0.5'), null, '字符串不许被隐式转数（否则 "abc" → NaN 会漏网）')
  assert.equal(asProgress({}), null)
  assert.equal(asProgress({ progress: null }), null)
  assert.equal(asProgress([]), null)
  // 兜底链与 largeTitleVars 一致：null ⇒ 0 ⇒ 起手态（条高 126px）
  assert.equal(largeTitleVars(asProgress(undefined) ?? 0)['--title-size'], '36px')
  assert.equal(largeTitleVars(asProgress(NaN) ?? 0)['--title-progress'], '0')
})

test('composable 源码卫生：无 import.meta.env、相对导入带扩展名', () => {
  assert.ok(!/import\.meta\.env/.test(COMPOSABLE), 'composable 不许用 import.meta.env（node --test 下是 undefined）')
  assert.ok(
    /from '\.\.\/utils\/math\.js'/.test(COMPOSABLE),
    '🔴 必须带 .js —— 本模块被 node --test 直接加载，Node ESM 不做扩展名补全'
  )
  assert.ok(fs.existsSync(path.resolve(ROOT, 'src/composables/useLargeTitle.js')), '文件必须是 .js')
})

/* ============================================================
 * ⑤ 静态几何算术复核（跨文件常量对齐）
 * ============================================================ */
test('CSS 解析卫生：style 块内无游离反引号、花括号配平', () => {
  // 🔴 2026-10-12 真缺陷：补丁脚本在 CSS 里留了一个游离反引号（`` `.pv-scroll { ``），
  //    CSS 解析器把**整条规则**丢弃 ⇒ `.pv-scroll` 的 `overflow-y: auto` 与渐隐遮罩全没生效，
  //    表面上「代码都写了」，实际滚动容器滚不动、大标题永远折不动。
  //    这类缺陷不会报错、不会崩，肉眼也看不出「少了一条规则」—— 所以必须用解析卫生守住。
  const targets = [
    ['LargeTitleHeader.vue', HEADER_RAW],
    ['PhotosApp.vue', read('src/components/apps/photos/PhotosApp.vue')],
    ['SettingsApp.vue', read('src/components/apps/settings/SettingsApp.vue')]
  ]
  for (const [name, src] of targets) {
    const style = src.slice(src.indexOf('<style'))
    assert.ok(style.length > 0, `${name} 取不到 <style> 块，扫描规则失效`)
    // ⚠️ 判据作用在**剥注释后**的 CSS 上：注释里的反引号（引用类名/控件名）无害，
    //    真正会吞掉规则的是注释**外**的游离反引号。
    const stripped = code(style)
    const ticks = (stripped.match(/`/g) || []).length
    assert.equal(
      ticks,
      0,
      `${name}: <style> 块里出现 ${ticks} 个反引号 —— 会让紧跟其后的整条规则被**静默丢弃**`
    )
    const open = (stripped.match(/\{/g) || []).length
    const close = (stripped.match(/\}/g) || []).length
    assert.equal(open, close, `${name}: CSS 花括号不配平（{ ${open} 个 / } ${close} 个）`)
    // 规则头（到 `{` 为止的片段）不许含反引号/分号/花括号
    for (const m of stripped.matchAll(/([^{};]*)\{/g)) {
      const head = m[1].split('\n').pop().trim()
      if (!head || head.startsWith('@')) continue
      assert.ok(
        !/[`{}]/.test(head),
        `${name}: 可疑的规则头（可能是解析垃圾，会让整条规则失效）：${JSON.stringify(head.slice(0, 60))}`
      )
    }
  }
})

test('静态几何 = 同一条曲线（端点算术 + 右上让位矩形复核）', () => {
  const safeTop = Number(read('src/styles/tokens.css').match(/--safe-top\s*:\s*([\d.]+)px/)[1])
  assert.equal(safeTop, 54, '--safe-top 变了，条高算式要跟着改')
  // 条总高 = --safe-top + --title-height ⇒ p=0: 159px / p=1: 118px（参考图同尺实测）
  assert.equal(safeTop + LARGE_TITLE.fromHeight, 159, 'p=0 条总高应为 159px（内容首行「今天」落 163.4px，参考图 163.7）')
  assert.equal(safeTop + LARGE_TITLE.toHeight, 118, 'p=1 条总高应为 118px')
  // 起手标题 padding-top = 54 + 36 = 90 ⇒ 行盒中心 110.7 = 参考图墨迹中心 110.85
  assert.equal(safeTop + LARGE_TITLE.fromTopInset, 90, '起手标题顶内缩应为 90px')
  // 折叠后标题 padding-top = 54 + (−2) = 52 ⇒ 行盒中心 64.65 = 参考图墨迹中心 64.85
  assert.equal(safeTop + LARGE_TITLE.toTopInset, 52, '折叠后标题顶内缩应为 52px')
  // 两态左右内缩相等 ⇒ 左边界天然对齐（参考图 26.0 / 25.0）
  assert.equal(LARGE_TITLE.fromInset, LARGE_TITLE.toInset, '两态左内缩必须相等，否则起手/缩小的左边界会错位')

  /* ---- 右上让位矩形：热区必须在 accessory 的矩形里让位，否则按钮上半部点不动 ---- */
  // ⚠️ 必须剥注释后再读 —— 否则在注释里写一份同样的数值就能假绿（teeth 负向对照守着）
  const sv = code(read('src/components/phone/ScreenView.vue'))
  const zoneH = Number(sv.match(/\.edge-zone\s*\{[^}]*height:\s*([\d.]+)px/)[1])
  assert.equal(zoneH, 64, '手势热区高度变了，让位算式要跟着改')

  const accCenter = accessoryCenter()
  const pillH = 40 // 相册胶囊标称高：border 1 + padding 6 + 按钮 33（实测渲染 41）
  const accTop = safeTop + accCenter - pillH / 2
  assert.ok(
    accTop < zoneH,
    `前提失效：accessory 上缘 ${accTop}px 已不在 ${zoneH}px 热区内，让位矩形可以撤了`
  )
  const yieldTop = Number(sv.match(/--edge-yield-top:\s*([\d.]+)px/)[1])
  assert.ok(
    yieldTop <= accTop,
    `让位上缘 ${yieldTop}px 必须 ≤ accessory 上缘 ${accTop.toFixed(2)}px，否则按钮顶部仍被热区截走`
  )
  const yieldLeft = Number(sv.match(/--edge-yield-left:\s*([\d.]+)px/)[1])
  const pillW = 144 // 相册胶囊渲染宽（3 按钮 44 + gap 2×2 + padding 6 + 边框）
  assert.equal(
    yieldLeft,
    360 - LARGE_TITLE.accessoryRight - pillW,
    '让位左缘必须等于胶囊左缘（机身宽 360 − 右内缩 − 胶囊宽）'
  )
  assert.ok(yieldLeft <= 360 - LARGE_TITLE.accessoryRight, '让位矩形必须覆盖到机身右缘')
  // 让位只在 accessory 存在时生效 —— 否则桌面/锁屏/其余应用的热区也被削
  assert.ok(
    /\.screen-view:has\(\[data-large-title-accessory\]\)\s*\{\s*--edge-yield-top:/.test(sv),
    '让位变量必须**声明在** :has([data-large-title-accessory]) 作用域里 —— 否则桌面/锁屏/其余应用的热区也被削'
  )
  assert.ok(
    /\.screen-view:has\(\[data-large-title-accessory\]\)\s*\.edge-nc/.test(sv) &&
      /\.screen-view:has\(\[data-large-title-accessory\]\)\s*\.edge-cc/.test(sv),
    '两条热区都要让位：胶囊横跨 x 199–343，同时压在通知中心（左/中）与控制中心（右 26%）里'
  )
})

/* ============================================================
 * ⑥ accessoryCenter() —— 菜单与折叠态标题的行盒中心共线
 * ============================================================ */
test('accessoryCenter：= toTopInset + toSize×lineHeight/2，取整到 2 位，随 curve 变', () => {
  // −2 + 22 × 1.15 / 2 = 10.65
  assert.equal(accessoryCenter(), 10.65, '参考图里缩小态菜单与标题垂直中心共线 ⇒ 这个偏移就是锚点')
  // 🔴 IEEE754 下 −2 + 22*1.15/2 = 10.649999999999999，不取整会污染 CSS 变量与断言
  assert.equal(String(accessoryCenter()), '10.65')
  assert.equal(accessoryCenter({ toSize: 19, toTopInset: -5 }), 5.92, 'curve 覆写必须生效')
  assert.equal(accessoryCenter({ toTopInset: 0, toSize: 0 }), 0, '退化输入不许产出 NaN')

  // 与 CSS 的 line-height 必须同值 —— 否则 JS 算的锚点和实际行盒对不上
  const header = code(read('src/components/ui/LargeTitleHeader.vue'))
  const rule = (css, sel) => {
    const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const m = css.match(new RegExp(`${esc}\\s*\\{([^}]*)\\}`))
    return m ? m[1] : ''
  }
  const lh = Number(rule(header, '.lt-title').match(/line-height:\s*([\d.]+)/)[1])
  assert.equal(lh, TITLE_LINE_HEIGHT, '.lt-title 的 line-height 必须等于 TITLE_LINE_HEIGHT（JS 用它算 accessory 锚点）')
  // 落点自检：54 + 10.65 = 64.65px ⇒ 折叠态菜单图标墨迹中心（参考图 63.65 ± 1）
  assert.ok(Math.abs(54 + accessoryCenter() - 64.65) < 0.01)
})
