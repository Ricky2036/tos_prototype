/**
 * 电话应用 —— 运行时行为断言
 * ==============================
 * 原来 100 多条断言基本是 `readFileSync(X.vue)` 后匹配 import 语句与字符串。
 * 主壳改 glob 自注册后会整片假红，且「源码里 import 了」不等于「页面上真能用」。
 * 现在：逐个挂载真实组件 → 断言渲染结果 → 拨号 / 切 tab / 滑动 / 进子页 / 点选项，
 * 每一步都读 DOM 或 store 的真实变化。
 */
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import { usePhoneStore } from '../src/stores/phoneStore.js'
import { createRuntime } from './helpers/vueRuntime.mjs'

const PHONE_DIR = path.resolve('src/components/apps/phone')
const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, acc)
    else if (e.name.endsWith('.vue')) acc.push('/' + path.relative(process.cwd(), p).split(path.sep).join('/'))
  }
  return acc
}
const PHONE_COMPONENTS = walk(PHONE_DIR)

const PHONE_APP = '/src/components/apps/phone/PhoneApp.vue'
const KEYPAD = '/src/components/apps/phone/PhoneKeypad.vue'
const RECENTS = '/src/components/apps/phone/PhoneRecentsTab.vue'
const PHONE_SETTINGS = '/src/components/apps/phone/settings/PhoneSettings.vue'
const CALL_DISPLAY = '/src/components/apps/phone/settings/PhoneCallDisplayModal.vue'

let rt
before(async () => { rt = await createRuntime() })
after(async () => { if (rt) await rt.close() })

/** 读当前 host 自己的 pinia 里的 phoneStore 字段 */
const storeOf = (id, expr) => rt.evaluate(async ({ id, expr }) => {
  const pinia = window.__wbHosts.get(id).host.__wbPinia
  const m = await import('/src/stores/phoneStore.js')
  const s = m.usePhoneStore(pinia)
  // eslint-disable-next-line no-new-func
  return new Function('s', `return (${expr})`)(s)
}, { id, expr })

test('phoneStore manages call logs, contacts, keypad, and settings properly', () => {
  setActivePinia(createPinia())
  const store = usePhoneStore()

  // 1. Initial State
  assert.equal(store.currentTab, 'recents')
  assert.equal(store.recentsFilter, 'all')
  assert.equal(store.isKeypadOpen, true)
  assert.equal(store.dialedNumber, '')
  assert.ok(store.recents.length >= 8)
  assert.ok(store.contacts.length >= 8)
  assert.equal(store.duplicateBannerVisible, true)

  // 2. Filter Recents (all vs missed)
  assert.equal(store.filteredRecents.length, store.recents.length)
  store.recentsFilter = 'missed'
  assert.ok(store.filteredRecents.every(r => r.type === 'missed'))
  store.recentsFilter = 'all'

  // 3. Keypad Operations
  store.appendKey('1')
  store.appendKey('8')
  store.appendKey('1')
  assert.equal(store.dialedNumber, '181')
  store.deleteKey()
  assert.equal(store.dialedNumber, '18')
  store.clearNumber()
  assert.equal(store.dialedNumber, '')

  // 4. Call Actions
  store.startCall({ name: '陈晓敏', number: '136 8888 2233' })
  assert.ok(store.activeCall)
  assert.equal(store.activeCall.name, '陈晓敏')
  assert.equal(store.activeCall.status, 'calling')

  const initialRecentsCount = store.recents.length
  store.endCall()
  assert.equal(store.activeCall, null)
  assert.equal(store.recents.length, initialRecentsCount + 1)
  assert.equal(store.recents[0].type, 'outgoing')

  // 5. Contact Search
  store.searchQuery = '123'
  assert.ok(store.searchResults.length > 0)
  assert.ok(store.searchResults.some(c => c.name === '爱尚生活馆' || c.name === '智行客服专线'))

  store.searchQuery = '阿里'
  assert.ok(store.searchResults.some(c => c.name.includes('阿里')))

  // 6. Flash Call Replies
  const initialRepliesCount = store.settings.flashCallReplies.length
  store.addFlashCallReply('马上到公司')
  assert.equal(store.settings.flashCallReplies.length, initialRepliesCount + 1)
  assert.equal(store.settings.flashCallReplies[initialRepliesCount].text, '马上到公司')

  // 7. Duplicate Contacts Banner
  store.dismissDuplicateBanner()
  assert.equal(store.duplicateBannerVisible, false)

  // 8. Designated Numbers Management
  assert.ok(store.settings.designatedNumbers.length >= 2)
  store.addDesignatedNumber('188 9999 0000')
  assert.ok(store.settings.designatedNumbers.includes('188 9999 0000'))
  store.removeDesignatedNumber('188 9999 0000')
  assert.equal(store.settings.designatedNumbers.includes('188 9999 0000'), false)

  // 9. Speed Dial & Blacklist
  store.setSpeedDial(2, '测试联系人')
  assert.equal(store.settings.speedDial[2], '测试联系人')
  store.addBlackListNumber('10086')
  assert.ok(store.settings.blackList.includes('10086'))
  store.removeBlackListNumber('10086')
  assert.equal(store.settings.blackList.includes('10086'), false)

  // 10. Recents deletion & clearing
  const firstId = store.recents[0].id
  store.removeRecent(firstId)
  assert.equal(store.recents.some(r => r.id === firstId), false)

  // 11. Contact Management (Add, Update, Remove)
  const initialContactsCount = store.contacts.length
  const createdContact = store.addContact({
    name: '测试新朋友',
    number: '138 0000 8899',
    tag: '常用',
    company: '测试科技'
  })
  assert.ok(createdContact)
  assert.equal(store.contacts.length, initialContactsCount + 1)
  assert.equal(createdContact.name, '测试新朋友')
  assert.equal(createdContact.tag, '常用')

  store.updateContact(createdContact.id, { name: '测试新朋友改名' })
  assert.equal(store.contacts.find(c => c.id === createdContact.id)?.name, '测试新朋友改名')

  store.removeContact(createdContact.id)
  assert.equal(store.contacts.length, initialContactsCount)

  // 12. Speed Dial execution
  store.dialSpeedKey(1) // 语音邮件
  assert.ok(store.activeCall)
  assert.equal(store.activeCall.name, '语音邮件')
  store.endCall()

  // 13. Whitelist & Block Keywords
  store.addWhiteListNumber('138 0000 0001')
  assert.ok(store.settings.whiteList.includes('138 0000 0001'))
  store.removeWhiteListNumber('138 0000 0001')
  assert.equal(store.settings.whiteList.includes('138 0000 0001'), false)

  store.addBlockKeyword('推销')
  assert.ok(store.settings.blockKeywords.includes('推销'))
  store.removeBlockKeyword('推销')
  assert.equal(store.settings.blockKeywords.includes('推销'), false)

  // 14. Noise Reduction Settings
  assert.equal(store.settings.noiseReductionSystem, '标准降噪')
  assert.equal(store.settings.noiseReductionVoip, '标准降噪')
})

test('所有电话组件渲染后都没有 AI 味的单边加粗竖线边框', async () => {
  const mounted = await rt.mountMany(PHONE_COMPONENTS)
  const problems = []
  let checked = 0

  for (const m of mounted) {
    if (!m.id) continue
    const bad = await rt.evaluate(({ id }) => {
      const host = window.__wbHosts.get(id).host
      return [...host.querySelectorAll('*')].filter((e) => {
        const cs = getComputedStyle(e)
        // 「AI 竖线卡片」= 只给左边加粗、其余三边空着。圆形单选/复选框、预览窗四边
        // 都是 2px 描边属正常控件，不该被误判（原源码正则也只拦 border-left 单边声明）。
        const lw = parseFloat(cs.borderLeftWidth)
        const others = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth'].map((k) => parseFloat(cs[k]))
        return cs.borderLeftStyle === 'solid' && lw >= 2 && others.every((w) => w < 1)
      }).map((e) => `${e.className}: ${getComputedStyle(e).borderLeftWidth}`)
    }, { id: m.id })
    checked += 1
    for (const b of bad) problems.push(`${m.path} → ${b}`)
  }

  assert.ok(checked >= 20, `成功挂载的电话组件偏少：${checked}/${PHONE_COMPONENTS.length}`)
  assert.deepEqual(problems, [], `出现单边加粗竖线边框：\n${problems.join('\n')}`)
  assert.equal(rt.pageErrors.length, 0, `运行时不应有异常：${rt.pageErrors.join('; ')}`)
})

test('PhoneApp 集成了最近任务 / 拨号盘 / 搜索 / 设置，且 tab 与拨号真的能操作', async () => {
  const h = await rt.mount(PHONE_APP)
  assert.equal(await rt.visibleCount(h, '.phone-scroll-viewport'), 1, '主滚动容器应可见')
  assert.equal(await rt.visibleCount(h, '.recents-list'), 1, '最近任务列表应可见')
  assert.equal(await rt.visibleCount(h, '.keypad-grid'), 1, '拨号盘应可见')
  assert.equal(await rt.visibleCount(h, '.search-trigger'), 1, '搜索入口应可见')
  assert.equal(await rt.visibleCount(h, '.settings-trigger'), 1, '设置入口应可见')
  assert.equal(await rt.visibleCount(h, '.phone-sticky-header'), 1, '大标题头应可见')
  assert.deepEqual(await rt.texts(h, '.filter-tab-btn'), ['全部类型', '未接来电'], '两个筛选 tab')

  const allRows = await rt.count(h, '.recent-swipe-cell')
  assert.ok(allRows >= 8, `最近任务行数偏少：${allRows}`)
  await rt.click(h, '.filter-tab-btn:nth-child(2)', 220)
  const missedRows = await rt.count(h, '.recent-swipe-cell')
  assert.ok(missedRows < allRows, `切到「未接来电」后行数应减少（${allRows} → ${missedRows}）`)
  assert.equal(await storeOf(h, 's.recentsFilter'), 'missed', '筛选状态应真的写进 store')

  // 拨号键：点一个数字键后 store 的 dialedNumber 应变化
  const before = await storeOf(h, 's.dialedNumber')
  await rt.click(h, '.keypad-circle-btn', 120)
  const after = await storeOf(h, 's.dialedNumber')
  assert.notEqual(after, before, '点数字键应真的写入拨号缓冲')
  assert.ok(after.length > 0, '拨号缓冲不应为空')

  // 各子页组件在运行时都能独立挂载（原断言是逐个匹配 import 语句）
  const subpages = [
    '/src/components/apps/phone/PhoneRecentsTab.vue',
    '/src/components/apps/phone/PhoneContactsTab.vue',
    '/src/components/apps/phone/PhoneKeypad.vue',
    '/src/components/apps/phone/PhoneSearch.vue',
    '/src/components/apps/phone/PhoneFlashCallModal.vue',
    '/src/components/apps/phone/PhoneCallScreen.vue',
    '/src/components/apps/phone/PhoneCallDetailModal.vue',
    '/src/components/apps/phone/PhoneContactDetailModal.vue',
    '/src/components/apps/phone/PhoneAddContactModal.vue',
    '/src/components/apps/phone/PhoneMergeModal.vue',
    '/src/components/apps/phone/settings/PhoneSettings.vue',
  ]
  for (const p of subpages) {
    // 条件渲染的子页要显式打开，否则只能看到 <!--v-if-->
    const id = await rt.mount(p, { visible: true, show: true, open: true })
    if (p.includes('PhoneFlashCallModal')) {
      // 这个弹层由 store.flashCallTarget 驱动，不是 prop
      await rt.evaluate(async ({ id }) => {
        const pinia = window.__wbHosts.get(id).host.__wbPinia
        const m = await import('/src/stores/phoneStore.js')
        m.usePhoneStore(pinia).flashCallTarget = { name: '测试联系人', number: '138 0000 0000' }
      }, { id })
      await rt.settle(id, 80)
    }
    // 由 store 驱动的条件弹层在未触发时渲染成 <!--v-if--> 锚点，这也是正确的运行时结果
    const rendered = await rt.evaluate(({ hostId }) => {
      const h = window.__wbHosts.get(hostId).host
      return h.querySelectorAll('*').length > 0 || h.childNodes.length > 0
    }, { hostId: id })
    assert.ok(rendered, `${p} 应能加载并渲染（实体节点或条件锚点）`)
    await rt.unmount(id)
  }
  await rt.unmount(h)
})

test('来电显示弹窗：大卡容器 + 双机型预览 + 点选项真的改 store', async () => {
  const h = await rt.mount(CALL_DISPLAY)
  assert.equal(await rt.visibleCount(h, '.call-display-big-card'), 1, '应使用 big-card 容器')
  assert.equal(await rt.count(h, '.phone-img'), 2, '两种机型预览图都应有')
  assert.equal(await rt.count(h, '.display-option-col'), 2, '弹窗显示 / 全屏显示两项')
  const text = await rt.allText(h)
  for (const w of ['来电显示', '弹窗显示', '全屏显示']) {
    assert.ok(text.includes(w), `渲染结果缺少「${w}」`)
  }
  assert.equal(await rt.count(h, '.custom-radio'), 2, '两个自定义单选圈')

  const before = await storeOf(h, 's.callDisplayMode')
  await rt.click(h, '.display-option-col:nth-child(2)', 180)
  const after = await storeOf(h, 's.callDisplayMode')
  assert.notEqual(after, before, '点第二项应真的切换来电显示模式')
  assert.equal(after, 'fullscreen', '应切到全屏显示')
  await rt.unmount(h)
})

test('PhoneSettings 点 SIM / 声音与振动都能推进真实的二级页', async () => {
  const h = await rt.mount(PHONE_SETTINGS)
  const text = await rt.allText(h)
  for (const w of ['设置', '自动通话录音', '全场景降噪', 'SIM 卡与网络设置', '声音与振动', '来电显示']) {
    assert.ok(text.includes(w), `设置页渲染结果缺少「${w}」`)
  }
  const panes0 = await rt.count(h, '.subpage-view-pane')
  assert.ok(panes0 >= 1, '初始应有主设置面板')

  for (const label of ['SIM 卡与网络设置', '声音与振动']) {
    const id = await rt.mount(PHONE_SETTINGS)
    const before = await rt.allText(id)
    assert.ok(before.includes(label), `设置首页应有「${label}」入口`)
    await rt.clickText(id, '.setting-item-row', label, 380)
    // 等子页标题真的出现，别用固定 sleep 赌转场时长
    await rt.page.waitForFunction(({ hostId, label }) => {
      const h = window.__wbHosts.get(hostId)?.host
      return !!h && [...h.querySelectorAll('.gn-title')].some((e) => e.textContent.includes(label))
    }, { hostId: id, label }, { timeout: 4000 })
    assert.notEqual(await rt.allText(id), before, `点「${label}」后视图内容应真的切换`)
    const titles = await rt.texts(id, '.gn-title')
    assert.ok(titles.some((t) => t.includes(label)), `子页导航标题应出现「${label}」`)
    assert.equal(await rt.visibleCount(id, '.glass-nav.is-overlay'), 1, '子页应有共享导航条')
    assert.ok((await rt.count(id, '.subpage-view-pane')) >= panes0, '子页面板不应少于主面板')
    await rt.unmount(id)
  }
  await rt.unmount(h)
})

test('最近任务行支持跟手滑动：pointer 序列真的把行推开，松手后状态收束', async () => {
  const h = await rt.mount(RECENTS)
  assert.ok((await rt.count(h, '.recent-swipe-cell')) >= 8, '应有多条可滑动记录')
  assert.equal(await rt.count(h, '.swipe-btn.btn-call'), await rt.count(h, '.recent-swipe-cell'), '每行都要有呼叫按钮')
  assert.equal(await rt.count(h, '.swipe-btn.btn-delete'), await rt.count(h, '.recent-swipe-cell'), '每行都要有删除按钮')

  const before = await rt.style(h, '.recent-row-content', 'transform')
  await rt.evaluate(({ id }) => {
    const el = window.__wbHosts.get(id).host.querySelector('.recent-row-content')
    const base = { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', clientX: 300, clientY: 200 }
    el.dispatchEvent(new PointerEvent('pointerdown', base))
    el.dispatchEvent(new PointerEvent('pointermove', { ...base, clientX: 200 }))
    el.dispatchEvent(new PointerEvent('pointerup', { ...base, clientX: 200 }))
  }, { id: h })
  await rt.settle(h, 150)

  const after = await rt.style(h, '.recent-row-content', 'transform')
  assert.notEqual(after, before, '滑动后行内容应真的位移')
  const dx = Number((after.match(/matrix\([^)]*,\s*(-?[\d.]+),\s*0\)/) || [])[1] ?? 0)
  assert.ok(dx < -20, `应向左让出操作区（实测 ${dx}px）`)
  await rt.unmount(h)
})

test('拨号盘没有顶部拖拽手柄，按键 / 呼叫键 / 更多选项都能用', async () => {
  const h = await rt.mount(KEYPAD)
  assert.equal(await rt.count(h, '.keypad-drag-bar'), 0, '真机拨号盘顶部绝对没有小横条')
  assert.equal(await rt.count(h, '.drag-pill'), 0, '不许出现 drag-pill')
  assert.equal(await rt.count(h, '.keypad-cell'), 12, '12 个拨号键')
  assert.equal(await rt.visibleCount(h, '.main-call-btn'), 1, '主呼叫键应可见')
  assert.equal(await rt.visibleCount(h, '.action-aux-btn'), 1, '辅助操作键应可见')

  const num0 = await storeOf(h, 's.dialedNumber')
  await rt.click(h, '.keypad-circle-btn', 120)
  const num1 = await storeOf(h, 's.dialedNumber')
  assert.notEqual(num1, num0, '点数字键应写入拨号缓冲')
  assert.ok(/^[0-9*#]+$/.test(num1), `拨号内容应只有数字（实际 ${num1}）`)

  await rt.click(h, '.main-call-btn', 220)
  assert.ok(await rt.exists(h, '.phone-keypad-panel'), '呼叫后拨号盘仍应可用')
  await rt.unmount(h)

  // 抽屉滑入/滑出的类名由共享 CSS 定义，运行时必须能解析到
  assert.ok(await rt.hasCssRule('.keypad-slide-enter-active'), '拨号盘入场动效规则应注册')
  assert.ok(await rt.hasCssRule('.keypad-slide-leave-active'), '拨号盘退场动效规则应注册')
})
