/**
 * SET-SYS-01 · 设置系统主页与全部子菜单契约与运行时测试
 * =========================================================
 * 证据：.local-evidence/SET-DSH-01/system.xml 及 03-system-page.png
 * 设备：Infinix X6878 / Android 17 / XOS 17.0.0.046
 */
import test, { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'
import page from '../src/components/apps/settings/pages/system.js'
import {
  useSystemSettingsStore,
  SYSTEM_SETTINGS_DEFAULTS,
  SYSTEM_SETTINGS_KEYS,
} from '../src/stores/systemSettingsStore.js'
import { useSystemStore } from '../src/stores/systemStore.js'
import { createRuntime } from './helpers/vueRuntime.mjs'

const freshStore = () => {
  setActivePinia(createPinia())
  return useSystemSettingsStore()
}

const EXPECTED_ROWS = [
  'systemNavigation',
  'dateTime',
  'languageInput',
  'powerButton',
  'schedulePower',
  'googleBackup',
  'usbBackup',
  'resetPhone',
  'developerOptions',
  'enhancedServices',
]

/* ==================== 1. 页面自声明与路由契约 ==================== */
test('pages/system.js 导出规范元数据，符合 glob 契约', () => {
  assert.equal(page.id, 'general')
  assert.equal(page.title, '系统')
  assert.equal(page.group, '系统')
  assert.equal(page.cluster, 'C-sys')
  assert.equal(typeof page.order, 'number')
  assert.equal(typeof page.component, 'function')
  assert.ok(Array.isArray(page.searchItems))
  assert.ok(page.searchItems.length >= 10, '至少包含主页与全部 10 项子菜单搜索项')
  assert.ok(page.searchItems.some((item) => item.id === 'systemNavigation'))
  assert.ok(page.searchItems.some((item) => item.id === 'developerOptions'))
})

/* ==================== 2. store 纯逻辑与持久化 ==================== */
test('systemSettingsStore 默认值与持久化键完整', () => {
  const store = freshStore()
  assert.equal(store.longPressPower, SYSTEM_SETTINGS_DEFAULTS.longPressPower)
  assert.equal(store.developerOptionsEnabled, true)
  assert.equal(store.usbDebugging, true)
  assert.equal(store.userExperienceProgram, true)
  assert.equal(store.systemErrorReporting, true)
  assert.equal(store.scheduledPowerOn, false)
  assert.equal(store.scheduledPowerOff, false)

  assert.ok(Object.keys(SYSTEM_SETTINGS_KEYS).length >= 15)
  assert.ok(Object.values(SYSTEM_SETTINGS_KEYS).every((k) => k.startsWith('tos_system_')))
})

test('systemSettingsStore 操作 setter 与状态流转', () => {
  const store = freshStore()
  store.setLongPressPower('powerMenu')
  assert.equal(store.longPressPower, 'powerMenu')

  store.setScheduledPowerOn(true)
  store.setPowerOnTime('06:30')
  assert.equal(store.scheduledPowerOn, true)
  assert.equal(store.powerOnTime, '06:30')

  store.setDeveloperOptionsEnabled(false)
  assert.equal(store.developerOptionsEnabled, false)
})

/* ==================== 3. 浏览器端真实渲染与 10 行 4 卡 1 组头 ==================== */
const SYSTEM_PAGE = '/src/components/apps/settings/system/SettingsSystem.vue'
let rt

before(async () => {
  rt = await createRuntime()
})

after(async () => {
  if (rt) await rt.close()
})

beforeEach(async () => {
  if (!rt) return
  await rt.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('tos_system_')) localStorage.removeItem(k)
    }
  })
})

const getRowKeys = (id) => rt.evaluate(({ hostId }) => {
  const host = window.__wbHosts.get(hostId).host
  return [...host.querySelectorAll('[data-system-row]')].map((el) => el.getAttribute('data-system-row'))
}, { hostId: id })

test('浏览器：主页 10 行顺序严格对齐真机 system.xml，4 卡 1 独立组头', async () => {
  const id = await rt.mount(SYSTEM_PAGE)
  const rows = await getRowKeys(id)
  assert.deepEqual(rows, EXPECTED_ROWS, '10 行顺序需与真机 system.xml 逐项完全一致')

  assert.equal(await rt.count(id, '.settings-card'), 4, '必须为 4 组卡片')
  assert.equal(await rt.count(id, '.group-header'), 1, '必须有 1 处独立分组标题')
  assert.equal(await rt.text(id, '.group-header'), '备份、重置与恢复')
  assert.equal(await rt.text(id, '.gn-title'), '系统')

  // 验证卡片 1（3 行）
  const card1Rows = await rt.evaluate(({ hostId }) => {
    const card = window.__wbHosts.get(hostId).host.querySelector('[data-test="system-card-1"]')
    return [...card.querySelectorAll('[data-system-row]')].map((el) => el.getAttribute('data-system-row'))
  }, { hostId: id })
  assert.deepEqual(card1Rows, ['systemNavigation', 'dateTime', 'languageInput'])

  // 验证卡片 2（2 行）
  const card2Rows = await rt.evaluate(({ hostId }) => {
    const card = window.__wbHosts.get(hostId).host.querySelector('[data-test="system-card-2"]')
    return [...card.querySelectorAll('[data-system-row]')].map((el) => el.getAttribute('data-system-row'))
  }, { hostId: id })
  assert.deepEqual(card2Rows, ['powerButton', 'schedulePower'])

  // 验证卡片 3（3 行）
  const card3Rows = await rt.evaluate(({ hostId }) => {
    const card = window.__wbHosts.get(hostId).host.querySelector('[data-test="system-card-3"]')
    return [...card.querySelectorAll('[data-system-row]')].map((el) => el.getAttribute('data-system-row'))
  }, { hostId: id })
  assert.deepEqual(card3Rows, ['googleBackup', 'usbBackup', 'resetPhone'])

  // 验证卡片 4（2 行）
  const card4Rows = await rt.evaluate(({ hostId }) => {
    const card = window.__wbHosts.get(hostId).host.querySelector('[data-test="system-card-4"]')
    return [...card.querySelectorAll('[data-system-row]')].map((el) => el.getAttribute('data-system-row'))
  }, { hostId: id })
  assert.deepEqual(card4Rows, ['developerOptions', 'enhancedServices'])

  await rt.unmount(id)
})

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

test('浏览器：进入子页与返回链闭环', async () => {
  const id = await rt.mount(SYSTEM_PAGE)

  // 1. 进入系统导航
  await rt.click(id, '[data-system-row="systemNavigation"]', 100)
  await wait(400)
  assert.equal(await rt.count(id, '[data-test="subpage-nav"]'), 1)
  assert.equal(await rt.text(id, '[data-test="subpage-nav"] .gn-title'), '系统导航')
  await rt.click(id, '[data-test="subpage-nav"] [data-nav-back]', 100)
  await wait(400)
  assert.equal(await rt.text(id, '.system-main .gn-title'), '系统', '返回系统主页')

  // 2. 进入按住电源按钮
  await rt.click(id, '[data-system-row="powerButton"]', 100)
  await wait(400)
  assert.equal(await rt.count(id, '[data-test="subpage-power"]'), 1)
  assert.equal(await rt.text(id, '[data-test="subpage-power"] .gn-title'), '按住电源按钮')
  await rt.click(id, '[data-test="power-opt-power-menu"]', 100)
  await rt.click(id, '[data-test="subpage-power"] [data-nav-back]', 100)
  await wait(400)
  assert.equal(await rt.text(id, '.system-main .gn-title'), '系统')
  assert.equal(await rt.text(id, '[data-system-row="powerButton"] .lc-value'), '电源菜单', '副标题实时联动更新')

  // 3. 进入重置手机
  await rt.click(id, '[data-system-row="resetPhone"]', 100)
  await wait(400)
  assert.equal(await rt.count(id, '[data-test="subpage-reset"]'), 1)
  assert.equal(await rt.text(id, '[data-test="subpage-reset"] .gn-title'), '重置手机')
  await rt.click(id, '[data-test="reset-network"]', 100)
  assert.equal(await rt.count(id, '.confirm-modal-card'), 1, '弹出二次确认弹窗')
  await rt.click(id, '.modal-btn-cancel', 100)
  assert.equal(await rt.count(id, '.confirm-modal-card'), 0, '取消后关闭弹窗')
  await rt.click(id, '[data-test="subpage-reset"] [data-nav-back]', 100)
  await wait(400)
  assert.equal(await rt.text(id, '.system-main .gn-title'), '系统')

  // 4. 进入开发者选项
  await rt.click(id, '[data-system-row="developerOptions"]', 100)
  await wait(400)
  assert.equal(await rt.count(id, '[data-test="subpage-dev"]'), 1)
  assert.equal(await rt.text(id, '[data-test="subpage-dev"] .gn-title'), '开发者选项')
  await rt.click(id, '[data-test="subpage-dev"] [data-nav-back]', 100)
  await wait(400)
  assert.equal(await rt.text(id, '.system-main .gn-title'), '系统')

  await rt.unmount(id)
})

test('浏览器：系统导航联动 systemStore 全局导航模式', async () => {
  const id = await rt.mount(SYSTEM_PAGE)
  await rt.click(id, '[data-system-row="systemNavigation"]', 100)

  // 切换到三键导航
  await rt.click(id, '[data-test="nav-mode-three-button"]', 100)
  const mode = await rt.evaluate(({ hostId }) => {
    return window.__wbHosts.get(hostId).pinia.state.value.system.navigationMode
  }, { hostId: id })
  assert.equal(mode, 'threeButton', '导航模式应更新到 systemStore')

  // 切换回手势导航
  await rt.click(id, '[data-test="nav-mode-gesture"]', 100)
  const modeAfter = await rt.evaluate(({ hostId }) => {
    return window.__wbHosts.get(hostId).pinia.state.value.system.navigationMode
  }, { hostId: id })
  assert.equal(modeAfter, 'gesture', '切回手势导航')

  await rt.click(id, '.sub-shell .gn-btn.gn-back', 100)
  await rt.unmount(id)
})
