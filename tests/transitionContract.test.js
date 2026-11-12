/**
 * 层级转场契约 —— 运行时行为断言
 * =================================
 * 原来检查的是 CSS 文件里「有没有 .slide-enter-active 这串字符」和各页面
 * `import '.../layer-transitions.css'` 这行代码。主壳改 glob 自注册后这类断言会假红，
 * 而且「写了类名」不等于「浏览器认得这条规则、动画真的跑起来」。
 * 现在检查：① CSSOM 里规则是否真被解析 ② 点击后类名是否出现再消失 ③ 前进/回退方向是否正确。
 */
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRuntime } from './helpers/vueRuntime.mjs'

const SETTINGS_APP = '/src/components/apps/settings/SettingsApp.vue'
const PHASES = ['enter-active', 'enter-from', 'enter-to', 'leave-active', 'leave-from', 'leave-to']

let rt
before(async () => { rt = await createRuntime() })
after(async () => { if (rt) await rt.close() })

test('共用层级转场：两个方向 × 六个状态的规则都被浏览器解析', async () => {
  for (const dir of ['slide', 'slide-back']) {
    for (const phase of PHASES) {
      assert.ok(
        await rt.hasCssRule(`.${dir}-${phase}`),
        `CSSOM 里缺少 .${dir}-${phase}（转场会静默失效）`,
      )
    }
  }
  assert.ok(await rt.hasCssRule('translateX(36px)'), '前进推入位移 36px')
  assert.ok(await rt.hasCssRule('0.22s cubic-bezier'), '进场时长与缓动')
  assert.ok(await rt.hasCssRule('translateX(-24px)'), '回退位移 24px')
  assert.ok(await rt.hasCssRule('prefers-reduced-motion'), '要尊重减弱动态效果')
  assert.ok(await rt.hasCssRule('.slide-back-leave-active'), '回退方向也要有退场规则')
})

test('四个层级的设置页进栈都用同一个 slide 名称，回退才用 slide-back', async () => {
  const pages = [
    ['显示与亮度', '.settings-display-page'],
    ['声音与振动', '.settings-sound-page'],
    ['通知与状态栏', '.notif-settings'],
    ['Infinix AI', '.settings-ai-page'],
  ]

  for (const [label, sel] of pages) {
    const h2 = await rt.mount(SETTINGS_APP)
    const classes = await rt.evaluate(async ({ id, label }) => {
      const host = window.__wbHosts.get(id).host
      const seen = []
      const grab = (node) => {
        if (node.nodeType === 1 && typeof node.className === 'string') {
          for (const c of node.classList) seen.push(c)
        }
      }
      const obs = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === 'attributes') grab(m.target)
          if (m.type === 'childList') for (const n of m.addedNodes) grab(n)
        }
      })
      obs.observe(host, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true })
      const row = [...host.querySelectorAll('.list-cell')].find((e) => e.textContent.includes(label))
      if (row) row.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
      await new Promise((r) => setTimeout(r, 500))
      obs.disconnect()
      return [...new Set(seen)]
    }, { id: h2, label })

    assert.ok(classes.includes('slide-enter-from'), `进「${label}」缺少 slide-enter-from`)
    assert.ok(classes.includes('slide-enter-active'), `进「${label}」缺少 slide-enter-active`)
    assert.ok(classes.includes('slide-enter-to'), `进「${label}」缺少 slide-enter-to`)
    assert.ok(!classes.some((c) => c.startsWith('slide-back-')), `进「${label}」不该用回退方向`)
    assert.ok(classes.includes('slide-leave-active'), `进「${label}」首页应有退场动效`)
    assert.equal(await rt.visibleCount(h2, sel), 1, `点「${label}」后应真的渲染出子页`)

    // 动画结束后过渡类名必须清干净，不能挂在 DOM 上影响后续布局
    await rt.settle(h2, 450)
    const leftover = await rt.evaluate(({ id }) => {
      const host = window.__wbHosts.get(id).host
      return [...host.querySelectorAll('*')].filter((e) =>
        [...e.classList].some((c) => /^slide(-back)?-(enter|leave)-(from|to|active)$/.test(c))).length
    }, { id: h2 })
    assert.equal(leftover, 0, `${label}：过渡类名应在动画结束后消失`)

    // 回退方向
    const back = await rt.clickAndRecordClasses(h2, '.gn-btn.gn-back', 500)
    assert.ok(back.includes('slide-back-enter-active'), `从「${label}」返回应使用 slide-back`)
    assert.equal(await rt.visibleCount(h2, '.settings-card'), 8, `从「${label}」返回应回到首页`)
    await rt.unmount(h2)
  }
})

test('所有真正出现过的 Transition 类名都能在 CSSOM 里找到定义（防静默失效）', async () => {
  // 把弹层 / 个性化等组件的 scoped 样式也挂进 CSSOM
  const extras = [
    '/src/components/ui/SheetModal.vue',
    '/src/components/apps/settings/SettingsInfinixAI.vue',
    '/src/components/apps/settings/display/DisplayAutoSleepSheet.vue',
    '/src/components/apps/phone/PhoneApp.vue',
  ]
  const mounted = await rt.mountMany(extras)
  for (const m of mounted) assert.ok(m.id, `${m.path} 应能挂载：${m.error || ''}`)

  const h = await rt.mount(SETTINGS_APP)
  await rt.clickText(h, '.list-cell', '显示与亮度', 450)
  const forward = await rt.clickAndRecordClasses(h, '.gn-btn.gn-back', 500)
  const names = [...new Set(forward.filter((c) => /^(slide|slide-back)-(enter|leave)-(from|to|active)$/.test(c)))]
  assert.ok(names.length >= 6, `前进/回退应产生完整的类名序列，实际 ${names.length} 个`)
  for (const n of names) {
    assert.ok(await rt.hasCssRule(`.${n}`), `出现的 .${n} 在 CSSOM 里没有定义（动画会静默失效）`)
  }

  for (const n of ['sheet-rise-enter-active', 'sheet-rise-enter-from', 'sheet-rise-leave-to']) {
    assert.ok(await rt.hasCssRule(`.${n}`), `弹层规则 .${n} 未注册进 CSSOM`)
  }
  assert.ok(await rt.hasCssRule('consent-rise'), '隐私弹窗应使用自己的 consent-rise 运动语言')
  assert.equal(rt.pageErrors.length, 0, `运行时不应有异常：${rt.pageErrors.join('; ')}`)
  await rt.unmount(h)
})
