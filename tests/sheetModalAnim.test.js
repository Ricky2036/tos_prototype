/**
 * 底部弹层动效契约 —— 运行时行为断言
 * =====================================
 * 原来匹配 `<Transition name="sheet-rise" appear>`、`translateY(100%)` 这些源码字符串。
 * 现在挂起弹层，直接看：入场类名有没有出现、动画结束后有没有清干净、
 * 关闭后节点有没有真的消失、父组件有没有叠第二层遮罩。
 */
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRuntime } from './helpers/vueRuntime.mjs'

const SHEET_MODAL = '/src/components/ui/SheetModal.vue'
const CALL_SITES = [
  ['提醒样式', '/src/components/apps/settings/notifications/NotifRemindStyleSheet.vue', { visible: true }],
  ['自动息屏', '/src/components/apps/settings/display/DisplayAutoSleepSheet.vue', { visible: true }],
]

let rt
before(async () => { rt = await createRuntime() })
after(async () => { if (rt) await rt.close() })

test('SheetModal 是唯一底部弹层控件：绝对定位 + 统一留边 + 四角 26 圆角', async () => {
  const h = await rt.mount(SHEET_MODAL, { visible: true })
  const mask = await rt.styleMap(h, '.sheet-mask', [
    'position', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  ])
  assert.equal(mask.position, 'absolute', '应用内浮层必须 absolute（fixed 会把包含块算到机身外）')
  assert.notEqual(mask.position, 'fixed', '禁止 fixed')
  assert.equal(mask.paddingTop, '0px', '遮罩顶部不留边')
  assert.equal(mask.paddingRight, '16px', '遮罩右留边 16')
  assert.equal(mask.paddingBottom, '26px', '遮罩离屏底 26')
  assert.equal(mask.paddingLeft, '16px', '遮罩左留边 16')

  const panel = await rt.styleMap(h, '.sheet-panel', [
    'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius',
  ])
  for (const [k, v] of Object.entries(panel)) {
    assert.equal(v, '26px', `${k} 应为 26px（悬浮卡片四角一致）`)
  }
  assert.equal(await rt.visibleCount(h, '.sheet-panel'), 1, 'visible=true 时面板必须可见')
  await rt.unmount(h)

  const closed = await rt.mount(SHEET_MODAL, { visible: false })
  assert.equal(await rt.count(closed, '.sheet-panel'), 0, 'visible=false 时面板应完全卸载')
  assert.equal(await rt.count(closed, '.sheet-mask'), 0, 'visible=false 时遮罩应完全卸载')
  await rt.unmount(closed)
})

test('SheetModal 入场：类名出现 → 动画结束清干净 → 最终态归位', async () => {
  const h = await rt.mount(SHEET_MODAL, { visible: true })
  const opening = await rt.classes(h, '.sheet-mask')
  assert.ok(opening.includes('sheet-rise-enter-from'), '挂载时应带 appear 入场起始态')
  assert.ok(opening.includes('sheet-rise-enter-active'), '挂载时应带 appear 入场的过渡类')

  assert.ok(await rt.hasCssRule('translateY(100%)'), '入场必须从自身高度下方移入')
  assert.ok(await rt.hasCssRule('0.34s cubic-bezier(0.22, 1, 0.36, 1)'), '入场时长/缓动统一')
  assert.ok(await rt.hasCssRule('prefers-reduced-motion'), '要尊重「减弱动态效果」')

  // 并发跑门禁时固定 sleep 会撞上动画末帧，改成等过渡类真的被移除
  await rt.page.waitForFunction(({ id }) => {
    const host = window.__wbHosts.get(id)?.host
    const mask = host?.querySelector('.sheet-mask')
    return !!mask && ![...mask.classList].some((c) => c.startsWith('sheet-rise-'))
  }, { id: h }, { timeout: 5000 })
  const settled = await rt.classes(h, '.sheet-mask')
  assert.ok(!settled.some((c) => c.startsWith('sheet-rise-')), '动画结束后过渡类名必须清干净')
  const transform = await rt.style(h, '.sheet-panel', 'transform')
  const ty = transform === 'none' ? 0 : Number((transform.match(/matrix\([^)]*,\s*(-?[\d.]+)\)/) || [])[1] ?? 0)
  assert.ok(Math.abs(ty) < 1, `最终态不应残留位移（实测 ${ty}px）`)
  assert.equal(await rt.visibleCount(h, '.sheet-panel'), 1, '最终态面板仍应可见')
  assert.equal(await rt.style(h, '.sheet-mask', 'position'), 'absolute', '动画结束后定位方式不变')
  await rt.unmount(h)
})

test('三个弹层调用点都渲染出统一 SheetModal，不再自绘遮罩与只圆上两角的卡片', async () => {
  for (const [label, p, props] of CALL_SITES) {
    const h = await rt.mount(p, props)
    assert.equal(await rt.visibleCount(h, '.sheet-panel'), 1, `${label} 应渲染统一弹层面板`)
    assert.equal(await rt.count(h, '.rs-mask, .cc-mask'), 0, `${label} 不该再自绘遮罩`)
    const radii = await rt.styleMap(h, '.sheet-panel', ['borderTopLeftRadius', 'borderBottomLeftRadius'])
    assert.equal(radii.borderTopLeftRadius, radii.borderBottomLeftRadius, `${label} 卡片不应只圆上两角`)
    assert.equal(radii.borderTopLeftRadius, '26px', `${label} 四角应统一 26px`)
    await rt.unmount(h)
  }

  // 控制中心的重置弹层由内部按钮驱动，点开后也必须落到同一套控件上
  const cc = await rt.mount('/src/components/apps/settings/notifications/NotifControlCenter.vue')
  assert.equal(await rt.count(cc, '.sheet-panel'), 0, '初始不应有弹层')
  await rt.clickText(cc, '.list-cell', '还原控制中心', 450)
  assert.equal(await rt.visibleCount(cc, '.sheet-panel'), 1, '点还原后应弹出统一弹层')
  assert.equal(await rt.count(cc, '.cc-mask'), 0, '控制中心不该自绘遮罩')
  await rt.unmount(cc)
})

test('父组件以 visible 驱动弹层：只有一层遮罩、一层入场动效，关闭后真的消失', async () => {
  const status = await rt.mount('/src/components/apps/settings/notifications/NotifStatusBar.vue')
  assert.equal(await rt.count(status, '.sheet-panel'), 0, '初始不应渲染弹层')
  const seen = await rt.clickAndRecordClasses(status, '.list-cell', 450)
  assert.equal(await rt.visibleCount(status, '.sheet-panel'), 1, '点条目后应打开弹层')
  assert.equal(await rt.count(status, '.sheet-mask'), 1, '只允许一层遮罩（不许双动效）')
  assert.ok(seen.includes('sheet-rise-enter-active'), '应由 SheetModal 自己产生入场动效')
  assert.ok(!seen.includes('fade-enter-active'), '父组件不该再叠一层 fade')
  await rt.click(status, '.rs-cancel', 450)
  assert.equal(await rt.count(status, '.sheet-panel'), 0, '关闭后弹层节点应消失')
  await rt.unmount(status)

  const display = await rt.mount('/src/components/apps/settings/SettingsDisplay.vue')
  assert.equal(await rt.count(display, '.sheet-panel'), 0, '显示页初始不应渲染弹层')
  await rt.clickText(display, '.list-cell', '自动息屏', 450)
  assert.equal(await rt.visibleCount(display, '.sheet-panel'), 1, '点自动息屏应打开弹层')
  assert.equal(await rt.count(display, '.sheet-mask'), 1, '自动息屏弹层只允许一层遮罩')
  const options = await rt.texts(display, '.sheet-option .opt-label')
  assert.deepEqual(options, ['15 秒', '30 秒', '1 分钟', '2 分钟', '5 分钟', '10 分钟'], '六档选项应真实渲染')
  await rt.unmount(display)
})

test('居中的隐私协议弹窗走 consent-rise，不复用带 translate 的 .fade', async () => {
  const h = await rt.mount('/src/components/apps/settings/SettingsInfinixAI.vue')
  assert.equal(await rt.count(h, '.consent-card'), 0, '初始不应有隐私弹窗')

  const seen = await rt.evaluate(async ({ id }) => {
    const host = window.__wbHosts.get(id).host
    const row = [...host.querySelectorAll('.list-cell')].find((e) => e.textContent.includes('翻译助手'))
    const seen = []
    const grab = (n) => {
      if (n.nodeType === 1 && typeof n.className === 'string') for (const c of n.classList) seen.push(c)
    }
    const obs = new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === 'attributes') grab(m.target)
        if (m.type === 'childList') for (const n of m.addedNodes) grab(n)
      }
    })
    obs.observe(host, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true })
    if (row) row.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    await new Promise((r) => setTimeout(r, 450))
    obs.disconnect()
    return [...new Set(seen)]
  }, { id: h })

  assert.equal(await rt.visibleCount(h, '.consent-card'), 1, '点翻译助手应弹出隐私协议')
  assert.ok(seen.includes('consent-rise-enter-from'), '应使用 consent-rise 入场')
  assert.ok(seen.includes('consent-rise-enter-active'), '入场过渡类应出现')
  assert.ok(!seen.includes('fade-enter-active'), '不该复用带 translate(-50%, 8px) 的 .fade')
  assert.ok(await rt.hasCssRule('translateY(26px)'), '入场同为自下而上 26px')
  assert.ok(await rt.hasCssRule('0.34s cubic-bezier(0.22, 1, 0.36, 1)'), '与弹层同一缓动')
  await rt.unmount(h)
})
