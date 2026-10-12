/**
 * 录音充电宝流程 store 单测
 * ===========================
 * 权威实现：归档 `ai-mate-recording-powerbank-demo.html`
 *           （`data-screen` 五屏：home / device / files / detail / profile）
 * 形态对齐：`tests/moriFlowStore.test.js`
 *
 * 本轮补的是**二级菜单页**（归档 `data-screen="device"`）这条链：
 *   ① 首屏 = 设备详情（归档首页卡 `data-go="device"`）
 *   ② 屏间导航链：设备详情 → 全部录音（`[data-go="files"]`）→ 返回来处（`#filesBack`）
 *      → 详情页 → 返回全部录音
 *   ③ 固件升级状态机（归档 `#otaButton`：120ms 一跳 +5，到 100 收尾）
 *   ④ 首页卡三枚磁贴的直达意图（归档里同文档可直接开浮层，本仓要跨组件传一次）
 *   ⑤ 源码结构守卫：RecorderFlow 的 device 屏钩子 / 类名不撞车 / 字号不低于 12px
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  useRecorderFlowStore, DEVICE_PROFILE, FIRMWARE_STEP, TICK,
  RECORDINGS_SEED, formatTime
} from '../src/stores/recorderFlowStore.js'
import { RECORDER_FLOW } from '../src/locales/recorder-flow.js'

const ROOT = process.cwd()
const read = (p) => fs.readFileSync(path.resolve(ROOT, p), 'utf-8')
const store = () => {
  setActivePinia(createPinia())
  return useRecorderFlowStore()
}

/* ================= ① 首屏与设备档案 ================= */

test('device 屏是流程首屏（归档首页卡 data-go="device"）', () => {
  const s = store()
  assert.equal(s.screen, 'device', 'state 初值')
  s.open()
  assert.equal(s.screen, 'device', 'open() 后仍停在设备详情')
  assert.equal(s.active, true)
  assert.equal(s.filesReturn, 'device')
})

test('设备档案 = 归档 device 屏的实测值', () => {
  assert.deepEqual(DEVICE_PROFILE, {
    model: 'AI Mate PowerRec S1',
    battery: 86,
    recordHours: 18,
    storageUsed: 18.6,
    storageTotal: 64,
    firmware: 'v2.3.1',
    firmwareNext: 'v2.4.0'
  })
})

/* ================= ② 屏间导航链 ================= */

test('导航链：设备详情 → 全部录音 → 返回设备详情', () => {
  const s = store()
  s.open()
  assert.equal(s.openFiles(), true)
  assert.equal(s.screen, 'files')
  assert.equal(s.filesReturn, 'device', '记住来处')
  assert.equal(s.backFromFiles(), true)
  assert.equal(s.screen, 'device', '#filesBack 回来处')
})

test('导航链：从全部录音进详情，返回落在全部录音（不回设备页）', () => {
  const s = store()
  s.open()
  s.openFiles()
  s.openDetail(2)
  assert.equal(s.screen, 'detail')
  s.backToFiles()
  assert.equal(s.screen, 'files')
  s.backFromFiles()
  assert.equal(s.screen, 'device')
})

test('filesReturn 兜底：来处就是 files 时不得原地打转', () => {
  const s = store()
  s.open()
  s.filesReturn = 'files'
  s.backFromFiles()
  assert.equal(s.screen, 'device', '原地打转要兜到设备页')
})

test('setScreen 只接受三屏；离开 files 时自动退出批量管理', () => {
  const s = store()
  for (const n of ['device', 'files', 'detail']) assert.equal(s.setScreen(n), true, n)
  assert.equal(s.setScreen('profile'), false, '归档的首页 / 我的页在本仓是应用外壳，不进来')
  assert.equal(s.screen, 'detail', '非法屏不得改变当前屏')
  s.setScreen('files')
  s.toggleManage()
  assert.equal(s.managing, true)
  s.setScreen('device')
  assert.equal(s.managing, false, '切走要收掉批量态，否则返回时批量条会自己冒出来')
})

test('reset / close 一律回到设备详情并清光瞬态', () => {
  const s = store()
  s.open()
  s.openFiles()
  s.toggleManage()
  s.toggleSelect(1)
  s.openDetail(3)
  s.togglePlay()
  s.startListen()
  s.openSync()
  s.close()
  assert.equal(s.active, false)
  assert.equal(s.screen, 'device')
  assert.equal(s.filesReturn, 'device')
  assert.equal(s.managing, false)
  assert.deepEqual(s.selected, [])
  assert.equal(s.playing, false)
  assert.equal(s.listen.on, false)
  assert.equal(s.sync.open, false)
  assert.deepEqual(s.firmware, { progress: 0, upgrading: false, done: false })
  assert.equal(s.recordings.length, RECORDINGS_SEED.length, '录音资产要保留')
})

/* ================= ③ 固件升级状态机 ================= */

test('固件升级：idle → upgrading → done，每跳 +5 且封顶 100', () => {
  const s = store()
  assert.equal(s.firmwareState, 'idle')
  assert.ok(s.firmwareText.includes(DEVICE_PROFILE.firmwareNext), s.firmwareText)
  assert.equal(s.firmwareButtonKey, 'device.firmwareUpgrade')

  assert.equal(s.startFirmwareUpgrade(), true)
  assert.equal(s.firmwareState, 'upgrading')
  assert.equal(s.firmwareButtonKey, 'device.firmwareUpgradingBtn')
  assert.equal(s.tickFirmware(), FIRMWARE_STEP)
  assert.ok(s.firmwareText.includes(`${FIRMWARE_STEP}%`), s.firmwareText)

  // 跑到底：100 / FIRMWARE_STEP 跳之后必须正好停在 100，且不会越界
  for (let i = 0; i < 100 / FIRMWARE_STEP + 5; i += 1) s.tickFirmware()
  assert.equal(s.firmware.progress, 100, '封顶 100')
  assert.equal(s.firmwareState, 'done')
  assert.equal(s.firmwareButtonKey, 'device.firmwareDone')
  assert.equal(s.firmwareSubKey, 'device.statFirmwareLatest', '三格里的「可升级」要跟着变成「已是最新」')
  assert.equal(s.toastText.includes('固件升级完成'), true, s.toastText)
})

test('固件升级：重复点不重启，完成后不再接受启动', () => {
  const s = store()
  s.startFirmwareUpgrade()
  s.tickFirmware()
  s.tickFirmware()
  const mid = s.firmware.progress
  assert.equal(s.startFirmwareUpgrade(), false, '升级中再点应被拦下')
  assert.equal(s.firmware.progress, mid, '进度不得被重置回 0')
  while (s.firmwareState !== 'done') s.tickFirmware()
  assert.equal(s.startFirmwareUpgrade(), false, '已完成再点应被拦下')
  assert.equal(s.firmware.progress, 100)
})

test('tickFirmware 在未启动时是空操作（组件定时器兜底）', () => {
  const s = store()
  assert.equal(s.tickFirmware(), false)
  assert.equal(s.firmware.progress, 0)
})

test(`TICK.firmware = ${TICK.firmware}ms（归档 #otaButton 的 setInterval 周期）`, () => {
  assert.equal(TICK.firmware, 120)
})

/* ================= ④ 首页卡磁贴直达浮层 ================= */

test('requestOverlay：三枚磁贴各自直达对应浮层，非法值不改状态', () => {
  const cases = [
    ['record', (s) => s.recordSheet],
    ['face', (s) => s.face.open],
    ['listen', (s) => s.listen.open]
  ]
  for (const [name, probe] of cases) {
    const s = store()
    assert.equal(s.requestOverlay(name), true)
    assert.equal(probe(s), false, '意图未消费前不得直接开浮层')
    s.open()
    assert.equal(probe(s), true, `${name} 磁贴应在挂载时开对应浮层`)
    assert.equal(s.pendingOpen, null, '意图只能消费一次')
  }
  const s2 = store()
  assert.equal(s2.requestOverlay('print'), false)
  assert.equal(s2.pendingOpen, null)
  s2.open()
  assert.equal(s2.recordSheet, false)
  assert.equal(s2.face.open, false)
  assert.equal(s2.listen.open, false)
})

test('requestOverlay 的意图不会被 reset 擦掉，但会被 close 清掉', () => {
  const s = store()
  s.requestOverlay('listen')
  s.reset()
  assert.equal(s.pendingOpen, 'listen', 'open() 是先 reset 再消费，写进 reset 就会被自己擦掉')
  s.open()
  assert.equal(s.listen.open, true)
  s.close()
  assert.equal(s.pendingOpen, null)
})

test('录音中的红灯是跨模块耦合点（首页卡 / 设备详情 hero 都订阅它）', () => {
  const s = store()
  s.open()
  assert.equal(s.isRecording, false)
  s.openRecordSheet()
  assert.equal(s.recording, true)
  assert.equal(s.isRecording, true)
  s.closeRecordSheet()
  assert.equal(s.recording, true, '关浮层不停表（归档行为），红灯继续亮')
})

/* ================= ⑤ 三语词条 ================= */

test('recorder-flow 三语键集完全一致，device 段齐全', () => {
  const keysOf = (loc) => Object.keys(RECORDER_FLOW[loc]).sort()
  const base = keysOf('zh')
  for (const loc of ['en', 'bn']) {
    assert.deepEqual(keysOf(loc), base, `${loc} 的键集与 zh 不一致`)
  }
  const need = [
    'device.title', 'device.menu', 'device.connected',
    'device.statBattery', 'device.statBatterySub', 'device.statStorage', 'device.statStorageSub',
    'device.statFirmware', 'device.statFirmwareSub', 'device.statFirmwareLatest',
    'device.recent', 'device.recentHint', 'device.viewAll',
    'device.manageRecords', 'device.manageRecordsSub', 'device.manageRecordsCount',
    'device.name', 'device.firmwareTitle', 'device.firmwareNew', 'device.firmwareUpgrading',
    'device.firmwareLatest', 'device.firmwareUpgrade', 'device.firmwareUpgradingBtn',
    'device.firmwareDone',
    'toast.deviceMenu', 'toast.deviceName', 'toast.firmwareDone',
    // 之前混在「全部录音」页、这轮随面板一起搬去设备详情页的旧键
    'device.features', 'device.manage', 'device.noiseCancel', 'device.audioParams'
  ]
  for (const k of need) {
    for (const loc of ['zh', 'en', 'bn']) assert.ok(RECORDER_FLOW[loc][k], `${loc} 缺 ${k}`)
  }
  // 占位符三语必须同形（`fill()` 按 `{name}` 找）
  for (const k of ['device.manageRecordsCount', 'device.firmwareNew', 'device.firmwareUpgrading', 'toast.deviceName']) {
    const holes = (loc) => (RECORDER_FLOW[loc][k].match(/\{\w+\}/g) || []).sort()
    for (const loc of ['en', 'bn']) assert.deepEqual(holes(loc), holes('zh'), `${k} 的占位符 ${loc} 与 zh 不同`)
  }
})

/* ================= ⑥ 源码结构守卫 ================= */

const FLOW = 'src/components/apps/aimate/RecorderFlow.vue'
const APP = 'src/components/apps/aimate/AimateApp.vue'

test('RecorderFlow 的 device 屏：归档结构逐项在位', () => {
  const src = read(FLOW)
  const need = [
    'data-rec-screen="device"',            // 屏钩子
    'class="rf-hero"',                     // 归档 .hero
    'rf-hero-top', 'rf-online', 'rf-art', 'rf-art-side', 'rf-art-face',
    'rf-grille', 'rf-redlight', 'rf-stats',// 实物图 + 三格
    'data-rec-stat="battery"', 'data-rec-stat="storage"', 'data-rec-stat="firmware"',
    'data-rec-recent-list', 'data-rec-view-all',
    'data-rec-manage-records', 'data-rec-records-count', 'data-rec-name',
    'data-rec-ota-text', 'data-rec-ota-bar', 'data-rec-ota-btn', 'data-rec-head-menu'
  ]
  for (const k of need) assert.ok(src.includes(k), `device 屏缺 ${k}`)
  assert.ok(src.includes('store.startFirmwareUpgrade()'), '固件条必须真的能触发升级')
  assert.ok(src.includes("store.toastDeviceName(am('deviceTitle.recorder'))"), '设备名行走 app 级词条单一事实源')
  // 两个面板必须已经搬走：文件屏里不得再有它们的钩子
  const filesBlock = src.slice(src.indexOf('data-rec-screen="files"'), src.indexOf('data-rec-screen="detail"'))
  for (const k of ['data-rec-open-record', 'data-rec-open-face', 'data-rec-open-listen', 'data-rec-open-sync', 'data-rec-noise', 'data-rec-params']) {
    assert.ok(!filesBlock.includes(k), `「全部录音」页还留着 ${k}（应已搬到设备详情页）`)
  }
  // 归档 device 屏不显示底部导航；本仓流程层也没有底栏 —— 这条守的是「以后别有人再加回来」
  assert.ok(!src.includes('FloatingTabBar'), '流程层不得挂应用级底栏')
})

test('RecorderFlow 样式表：无完全重复的类选择器（防「新类与既有类撞名后被静默覆盖」）', () => {
  const src = read(FLOW)
  const style = src.slice(src.indexOf('<style scoped>'))
  const pat = /^(\.[A-Za-z][\w-]*(?:(?:::?|\.)[A-Za-z][\w-]*(?:\([^)]*\))?)*)\s*\{/
  const seen = new Set()
  const dups = []
  for (const line of style.split('\n')) {
    const m = line.match(pat)
    if (!m) continue
    if (seen.has(m[1])) dups.push(m[1])
    else seen.add(m[1])
  }
  assert.ok(seen.size >= 80, `只扫到 ${seen.size} 个顶层类选择器，扫描规则可能失效`)
  assert.deepEqual(dups, [], `同文件内重复的类选择器：${dups.join(', ')}`)
})

test('device 屏样式块：所有字号不低于 12px（归档同段是 6~11px）', () => {
  const src = read(FLOW)
  const i = src.indexOf('设备详情（二级菜单，归档')
  const j = src.indexOf('.rf-ota-btn:disabled')
  assert.ok(i > 0 && j > i, '找不到 device 屏的样式块')
  const sizes = [...src.slice(i, j).matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]))
  assert.ok(sizes.length >= 10, `device 屏字号只扫到 ${sizes.length} 处，规则可能失效`)
  const bad = sizes.filter((n) => n < 12)
  assert.deepEqual(bad, [], `device 屏出现 <12px 字号：${bad.join(', ')}`)
})

test('首页录音充电宝 hero 卡：归档结构在位 + 字号不低于 12px', () => {
  const src = read(APP)
  for (const cls of ['mcard-rec', 'rp-head', 'rp-name', 'rp-model', 'rp-meta',
    'rp-art', 'rp-art-side', 'rp-art-face', 'rp-grille', 'rp-redlight',
    'rp-actions', 'rp-action', 'rp-glyph']) {
    assert.ok(src.includes(cls), `录音充电宝卡缺 ${cls}（归档 .device-card 结构）`)
  }
  for (const a of ['record', 'face', 'listen']) {
    assert.ok(src.includes(`data-device-action="${a}"`), `缺 ${a} 磁贴（归档 [data-open]）`)
  }
  assert.ok(src.includes('recorderMeta(d)'), '副行必须走 recorderMeta（归档是两枚 `▰ 86%` / `◴ 已用 18.6GB`）')
  assert.ok(src.includes("rec.recording"), '红灯要订阅流程层的录音态（归档 #homeRecordLight）')
  assert.ok(src.includes('openRecorderWith('), '三枚磁贴要先记意图再开流程层')
  assert.ok(src.includes("RECORDER_PROFILE.model"), '型号按归档取 AI Mate PowerRec S1，不读 AM-RC1 短代号')
  const i = src.indexOf('录音充电宝卡：照归档')
  const j = src.indexOf('.rp-action small')
  assert.ok(i > 0 && j > i, '找不到录音充电宝卡的样式块')
  const sizes = [...src.slice(i, j).matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]))
  assert.ok(sizes.length >= 4, `hero 卡字号只扫到 ${sizes.length} 处，规则可能失效`)
  const bad = sizes.filter((n) => n < 12)
  assert.deepEqual(bad, [], `录音充电宝卡出现 <12px 字号：${bad.join(', ')}`)
})

test('formatTime 契约（新录音落库时用它算 duration）', () => {
  assert.equal(formatTime(0), '00:00')
  assert.equal(formatTime(61), '01:01')
  assert.equal(formatTime(-5), '00:00')
})
