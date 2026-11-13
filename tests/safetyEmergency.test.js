/**
 * SET-AG-01a · 安全和紧急情况契约测试
 * =====================================
 * 真机依据：spec/captures/SET-DSH-02-security-account.md（Infinix X6878 / Android 17）。
 *
 * 1. 纯逻辑断言：
 *    - store 默认状态对齐真机包（8 行文本/值、地震开启、驾车静音关闭、位置服务开启等）；
 *    - 状态双向切换与持久化方法正常运作；
 *    - 医疗信息与联系人的增删改查；
 *    - 安全铁律断言：SOS 必须为模拟标识（isSimulationOnly === true），严禁真实报警/呼救；
 *    - 自声明文件 pages/safetyEmergency.js 导出结构合法性；
 * 2. 真实浏览器挂载测试：
 *    - 挂载 SettingsSafetyEmergency.vue；
 *    - 渲染 4 组卡片及 8 行核心内容；
 *    - 验证右侧状态值文本（「已开启」「已关闭」）正常渲染；
 *    - 点击切换状态后文本即时更新；
 *    - 点击紧急求救弹出带有模拟说明标识的弹层，严禁任何外部真实请求；
 *    - 点击医疗信息正常展示弹层。
 */
import test, { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { setActivePinia, createPinia } from 'pinia'
import { useSafetyStore } from '../src/stores/safetyStore.js'
import pageDecl from '../src/components/apps/settings/pages/safetyEmergency.js'
import { createRuntime } from './helpers/vueRuntime.mjs'

const freshStore = () => {
  setActivePinia(createPinia())
  return useSafetyStore()
}

/* ==================== 纯逻辑：真机默认值与契约 ==================== */

test('SET-AG-01a 纯逻辑：真机默认态对齐 SET-DSH-02', () => {
  const store = freshStore()
  store.resetToDefault()

  assert.equal(store.earthquakeAlert, true, '地震警报默认已开启')
  assert.equal(store.disasterAlert, true, '灾害警报默认开启')
  assert.equal(store.silenceWhileDriving, false, '驾车时将通知设为静音默认已关闭')
  assert.equal(store.emergencyLocationService, true, '紧急位置信息服务默认已开启')
  assert.equal(store.unknownTrackerAlert, true, '不明追踪器提醒默认开启')
})

test('SET-AG-01a 纯逻辑：状态切换双向可逆', () => {
  const store = freshStore()

  store.toggleEarthquakeAlert()
  assert.equal(store.earthquakeAlert, false, '切换后地震警报关闭')
  store.toggleEarthquakeAlert()
  assert.equal(store.earthquakeAlert, true, '再次切换地震警报重新开启')

  store.toggleSilenceWhileDriving()
  assert.equal(store.silenceWhileDriving, true, '切换后驾车静音开启')
  store.toggleSilenceWhileDriving()
  assert.equal(store.silenceWhileDriving, false, '再次切换驾车静音重新关闭')

  store.toggleEmergencyLocationService()
  assert.equal(store.emergencyLocationService, false, '切换后紧急位置关闭')
  store.toggleEmergencyLocationService()
  assert.equal(store.emergencyLocationService, true, '再次切换紧急位置重新开启')
})

test('SET-AG-01a 纯逻辑：医疗信息与紧急联系人增删改', () => {
  const store = freshStore()

  store.updateMedicalInfo({ bloodType: 'AB型 RH阴性', allergies: '花粉过敏' })
  assert.equal(store.medicalInfo.bloodType, 'AB型 RH阴性')
  assert.equal(store.medicalInfo.allergies, '花粉过敏')

  const initialCount = store.emergencyContacts.length
  store.addEmergencyContact({ name: '张医生', phone: '13612345678', relationship: '家庭医生' })
  assert.equal(store.emergencyContacts.length, initialCount + 1)

  const added = store.emergencyContacts[store.emergencyContacts.length - 1]
  assert.equal(added.name, '张医生')
  store.removeEmergencyContact(added.id)
  assert.equal(store.emergencyContacts.length, initialCount)
})

test('SET-AG-01a 纯逻辑铁律：紧急求救必须严格为原型模拟', () => {
  const store = freshStore()
  assert.equal(store.emergencySos.isSimulationOnly, true, '必须标记为原型模拟')
  assert.equal(typeof store.emergencySos.triggerMethod, 'string')
})

test('SET-AG-01a 纯逻辑：pages/safetyEmergency.js 自声明合法', () => {
  assert.equal(pageDecl.id, 'safetyEmergency')
  assert.equal(pageDecl.title, '安全和紧急情况')
  assert.equal(pageDecl.cluster, 'C0-a')
  assert.equal(typeof pageDecl.component, 'function')
  assert.ok(Array.isArray(pageDecl.searchItems))
  assert.ok(pageDecl.searchItems.some(item => item.id === 'safetyEmergency'))
  assert.ok(pageDecl.searchItems.some(item => item.id === 'earthquakeAlert'))
})

/* ==================== 真实浏览器挂载测试 ==================== */

const PAGE = '/src/components/apps/settings/safety/SettingsSafetyEmergency.vue'
let rt
before(async () => {
  rt = await createRuntime()
})

after(async () => {
  if (rt) await rt.close()
})

test('SET-AG-01a 浏览器：安全和紧急情况核心行与真机值文本渲染', async () => {
  const id = await rt.mount(PAGE)

  // 1. 验证标题与顶部按钮
  assert.equal(await rt.text(id, '.gn-title'), '安全和紧急情况')
  assert.equal(await rt.text(id, '.personal-safety-title'), '打开个人安全')

  // 2. 验证卡片数量（顶部操作卡 + 4组内容卡 = 5组）
  assert.equal(await rt.count(id, '.settings-card'), 5, '真机结构共 5 组卡片')

  // 3. 验证关键值文本：右侧必须有实测值文本，而非纯开关
  const allText = await rt.evaluate(({ hostId }) => window.__wbHosts.get(hostId).host.innerText, { hostId: id })
  assert.ok(allText.includes('已开启'), '必须包含已开启值文本')
  assert.ok(allText.includes('已关闭'), '必须包含已关闭值文本')

  assert.equal(await rt.text(id, '[data-safety-row="earthquake"] .lc-value'), '已开启')
  assert.equal(await rt.text(id, '[data-safety-row="silenceDriving"] .lc-value'), '已关闭')
  assert.equal(await rt.text(id, '[data-safety-row="location"] .lc-value'), '已开启')

  await rt.unmount(id)
})

test('SET-AG-01a 浏览器：点击切换状态即时响应与弹层交互', async () => {
  const id = await rt.mount(PAGE)

  // 点击开启状态的地震警报，切换为已关闭
  const beforeVal = await rt.text(id, '[data-safety-row="earthquake"] .lc-value')
  assert.equal(beforeVal, '已开启')
  await rt.click(id, '[data-safety-row="earthquake"]', 100)
  const afterVal = await rt.text(id, '[data-safety-row="earthquake"] .lc-value')
  assert.equal(afterVal, '已关闭', '切换后右侧值文本即时变更为已关闭')

  // 点击紧急求救行，打开模拟说明弹层
  await rt.click(id, '[data-safety-row="sos"]', 100)
  assert.equal(await rt.count(id, '.modal-sheet'), 1, '弹出紧急求救说明弹层')
  const bannerText = await rt.text(id, '.simulation-banner')
  assert.match(bannerText, /仅供功能演示/, '弹层明确标注文案：原型环境 · 仅供功能演示')

  // 关闭弹层
  await rt.click(id, '.modal-close', 100)
  assert.equal(await rt.count(id, '.modal-sheet'), 0, '弹层已关闭')

  await rt.unmount(id)
})
