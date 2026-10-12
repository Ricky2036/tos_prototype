import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  useAiMateStore, DEVICE_TYPES, DEVICE_GROUPS, FAN_MODES, FAN_SWING_ANGLES,
  PICKUP_MODES, RECORDER_TABS, LISTEN_LANGS, SCAN_CANDIDATES, POWER_ACK_MS, SPEED_ACK_MS,
  FAN_SMART_MODE_INDEX, FAN_SPEED_MIN, FAN_SPEED_MAX, createDeviceCatalog,
  TYPE_MODELS, FIRMWARE_UPGRADE_MS,
  PHOTO_GROUPS, PRINTER_PHOTOS, EDIT_CROPS, EDIT_LAYOUTS, EDIT_FRAMES, PRINT_FILTERS,
  EDIT_TOOLS, PRINT_QUALITIES, PRINT_COLORS, QUEUE_MAX, PAPER_MAX, AR_VIDEO,
  PRINT_STAGE_BOUNDS, CAMERA_MODES, PAGES, DEVICE_MODELS, PAIR_STEPS, OTHER_DEVICES
} from '../src/stores/aiMateStore.js'

const store = () => {
  setActivePinia(createPinia())
  return useAiMateStore()
}
const ROOT = process.cwd()
const read = (p) => fs.readFileSync(path.resolve(ROOT, p), 'utf-8')

/**
 * 离线拦截分支需要一个离线设备，而并集种子的 4 台全部在线
 * （归档里离线的是「其他设备」里的 AI 眼镜，它不在 `devices` 里）。
 * 这里显式把种子风扇置离线当夹具 —— 测的是**拦截规则**，不是种子本身。
 */
const OFFLINE_ID = 'DAEWOO-Fan-A1'
const storeWithOffline = () => {
  const s = store()
  s.getDevice(OFFLINE_ID).online = false
  return s
}

/* ================= 设备目录 ================= */

test('11 类设备目录：id 唯一、分组合法、图标键已登记进 LUCIDE', () => {
  // 归档 8 类 + 集成 3 台（录音充电宝 / 口袋打印机 / AI Mori）
  assert.equal(DEVICE_TYPES.length, 11, '统一目录应为 11 类')

  const ids = DEVICE_TYPES.map((t) => t.id)
  assert.equal(new Set(ids).size, ids.length, '设备类别 id 必须唯一')

  for (const t of DEVICE_TYPES) {
    assert.ok(DEVICE_GROUPS.includes(t.group), `${t.id} 的 group「${t.group}」不在合法分组内`)
    assert.match(t.bg, /^#[0-9A-F]{6}$/i, `${t.id} 的 bg 应为 6 位十六进制`)
    assert.match(t.color, /^#[0-9A-F]{6}$/i, `${t.id} 的 color 应为 6 位十六进制`)
  }

  // 图标键必须真实存在，否则 LIcon 渲染为空（静默失效）
  const lucide = read('src/assets/icons/lucide.js')
  const table = lucide.slice(lucide.indexOf('export const LUCIDE'))
  for (const t of DEVICE_TYPES) {
    assert.match(table, new RegExp(`\\b${t.icon}\\b`), `${t.id} 用的图标键 ${t.icon} 未登记进 LUCIDE`)
  }
})

test('统一目录覆盖 OneLeap 已落地的 4 台，且不重复实现', () => {
  for (const id of ['recorder', 'printer', 'watch', 'glasses']) {
    assert.ok(DEVICE_TYPES.some((t) => t.id === id), `${id} 应被统一目录收录（复用 OneLeap 的落地）`)
  }
  // 归档新增的 6 类
  for (const id of ['fan', 'tws', 'bulbs', 'infrared', 'locks', 'socket']) {
    assert.ok(DEVICE_TYPES.some((t) => t.id === id), `${id} 应被统一目录收录（归档新增）`)
  }
})

test('目录页分组：每组非空、顺序与 DEVICE_GROUPS 一致', () => {
  const s = store()
  const groups = s.devicesByGroup
  assert.ok(groups.length > 0, '分组不应为空')
  const order = groups.map((g) => g.group)
  assert.deepEqual(order, DEVICE_GROUPS.filter((g) => order.includes(g)), '分组顺序应与 DEVICE_GROUPS 一致')
  for (const g of groups) assert.ok(g.types.length > 0, `${g.group} 组不应为空`)
})

/* ================= 风扇域：归档实测的 6 档模式与 3 档摇头角 ================= */

test('风扇档位常量与归档一致：6 档模式 / 3 档摇头角', () => {
  assert.deepEqual(FAN_MODES, ['正常风', 'HI暴风', '自然风', '睡眠风', '母婴风', '智能风'])
  assert.deepEqual(FAN_SWING_ANGLES, [30, 60, 120])
  assert.equal(FAN_SMART_MODE_INDEX, 5, '智能风应是第 6 档（索引 5）')
})

test('并集种子：四份归档各一台主设备（打印机 / 录音充电宝 / 风扇 / AI Mori）', () => {
  const s = store()
  // 首页顺序（Ricky 2026-10-12 定）：口袋打印机 → 录音充电宝 → **风扇（第三位）** → AI Mori
  assert.deepEqual(
    s.devices.map((d) => d.id),
    ['AM-Printer-01', 'AM-Recorder-01', 'DAEWOO-Fan-A1', 'AM-Mori-01']
  )
  assert.deepEqual(s.devices.map((d) => d.type), ['printer', 'recorder', 'fan', 'mori'])
  assert.equal(s.devices.every((d) => d.online), true, '并集种子的 4 台都在线')

  // 归档「添加设备」目录里的通用品类**不得**预置进「我的设备」
  // （对应「多出来的奇奇怪怪的设备」这条反馈）
  for (const t of ['bulbs', 'socket', 'locks', 'infrared', 'tws', 'watch', 'glasses']) {
    assert.equal(s.devices.filter((d) => d.type === t).length, 0, `${t} 不应被预置进「我的设备」`)
  }

  // 风扇字段与归档一致（归档初始状态：speed=3, mode=0, power=false, childLock=false, temp=26）
  const a1 = s.getDevice('DAEWOO-Fan-A1')
  for (const key of ['power', 'speed', 'mode', 'swing', 'swingAngle', 'timerOff', 'timerOn', 'plasma', 'childLock', 'temp', 'nick']) {
    assert.ok(key in a1, `风扇状态应包含归档字段 ${key}`)
  }
  assert.equal(a1.speed, 3)
  assert.equal(a1.mode, 0)
  assert.equal(a1.power, false)
  assert.equal(a1.childLock, false)
  assert.equal(a1.temp, 26)
  assert.equal(a1.titleKey, undefined, '风扇的显示名就是归档设备名，不该套 Demo 的「我的 XX」')
})

test('卡片副行数据齐备：三台集成设备各有 titleKey / 电量 / 余量，且必有一台「已是最新」', () => {
  const s = store()
  for (const d of s.devices) assert.equal(typeof d.battery, 'number', `${d.id} 缺电量`)
  assert.equal(s.getDevice('AM-Printer-01').titleKey, 'deviceTitle.printer')
  assert.equal(s.getDevice('AM-Recorder-01').titleKey, 'deviceTitle.recorder')
  assert.equal(s.getDevice('AM-Mori-01').titleKey, 'deviceTitle.mori')
  assert.equal(typeof s.getDevice('AM-Printer-01').paper, 'number')
  assert.equal(typeof s.getDevice('AM-Recorder-01').storageUsed, 'number')
  assert.equal(typeof s.getDevice('AM-Mori-01').shots, 'number')
  // 非空性判据：必须存在一台「在线且没有新固件」，否则升级的「无新版本」分支验不到
  assert.ok(s.devices.some((d) => d.online && !d.fwNext), '种子里应有「已是最新」的在线设备')
})

/* ================= 拦截规则（归档语义） ================= */

test('离线设备：任何控制都被拦下且状态不变，notice.code = offline', () => {
  const s = storeWithOffline()
  const before = JSON.stringify(s.getDevice(OFFLINE_ID))

  assert.equal(s.toggleFanPower(OFFLINE_ID, { immediate: true }), false)
  assert.equal(s.setFanSpeed(OFFLINE_ID, 5), false)
  assert.equal(s.setFanMode(OFFLINE_ID, 3), false)
  assert.equal(s.toggleSwing(OFFLINE_ID), false)
  assert.equal(s.toggleChildLock(OFFLINE_ID), false)
  assert.equal(s.notice.code, 'offline')

  assert.equal(JSON.stringify(s.getDevice(OFFLINE_ID)), before, '离线设备的状态不能被动过')
})

test('童锁：普通控制被拦下（childLock），但童锁自身可关闭', () => {
  const s = store()
  const id = 'DAEWOO-Fan-A1'

  assert.equal(s.toggleChildLock(id), true)
  assert.equal(s.getDevice(id).childLock, true)

  assert.equal(s.toggleFanPower(id, { immediate: true }), false)
  assert.equal(s.notice.code, 'childLock')
  assert.equal(s.setFanSpeed(id, 7), false, '童锁下选风速应被拦')
  assert.equal(s.setFanMode(id, 2), false)
  assert.equal(s.toggleSwing(id), false)
  assert.equal(s.togglePlasma(id), false)

  const d = s.getDevice(id)
  assert.equal(d.power, false)
  assert.equal(d.speed, 3, '被拦后档位不应改变')

  // 童锁必须能自己解开，否则无法解锁
  assert.equal(s.toggleChildLock(id), true)
  assert.equal(s.getDevice(id).childLock, false)
  assert.equal(s.toggleFanPower(id, { immediate: true }), true, '解锁后应能开机')
})

/* ================= 控制动作 ================= */

test('选风速：越界夹到合法区间，且顺带把电源打开（归档语义）', () => {
  const s = store()
  const id = 'DAEWOO-Fan-A1'
  assert.equal(s.getDevice(id).power, false)

  assert.equal(s.setFanSpeed(id, 7), true)
  assert.equal(s.getDevice(id).speed, 7)
  assert.equal(s.getDevice(id).power, true, '选风速应先把电源打开')

  s.setFanSpeed(id, 999)
  assert.equal(s.getDevice(id).speed, FAN_SPEED_MAX, '上限应夹到 FAN_SPEED_MAX')
  s.setFanSpeed(id, -5)
  assert.equal(s.getDevice(id).speed, FAN_SPEED_MIN, '下限应夹到 FAN_SPEED_MIN')
  assert.equal(s.setFanSpeed(id, 'abc'), false, '非数值应被拒')
})

test('风速模式：只接受 0..5，越界被拒', () => {
  const s = store()
  const id = 'DAEWOO-Fan-A1'
  assert.equal(s.setFanMode(id, 5), true)
  assert.equal(s.getDevice(id).mode, 5)
  assert.equal(s.fanShowsTemp, true, '智能风才显示室温')

  assert.equal(s.setFanMode(id, 6), false, '第 7 档不存在')
  assert.equal(s.setFanMode(id, -1), false)
  assert.equal(s.getDevice(id).mode, 5, '被拒后模式不应改变')
})

test('摇头：关闭时角度归零；角度只接受归档的 3 档', () => {
  const s = store()
  const id = 'DAEWOO-Fan-A1'

  assert.equal(s.setSwingAngle(id, 60), true)
  assert.equal(s.getDevice(id).swingAngle, 60)
  assert.equal(s.getDevice(id).swing, true, '设角度应顺带开启摇头')

  assert.equal(s.setSwingAngle(id, 45), false, '45° 不在归档的 3 档里')
  assert.equal(s.getDevice(id).swingAngle, 60)

  assert.equal(s.toggleSwing(id), true)
  assert.equal(s.getDevice(id).swing, false)
  assert.equal(s.getDevice(id).swingAngle, 0, '摇头关闭后角度应归零')
})

test('定时关机 / 预约开机：各自独立，并给出对应 notice', () => {
  const s = store()
  const id = 'DAEWOO-Fan-A1'

  assert.equal(s.setFanTimer(id, 'off', 7200), true)
  assert.equal(s.getDevice(id).timerOff, 7200)
  assert.equal(s.notice.code, 'timerOffSet')
  assert.equal(s.notice.params.hours, 2)

  assert.equal(s.setFanTimer(id, 'on', 3600), true)
  assert.equal(s.getDevice(id).timerOn, 3600)
  assert.equal(s.getDevice(id).timerOff, 7200, '预约开机不应清掉定时关机')

  assert.equal(s.setFanTimer(id, 'off', 0), true)
  assert.equal(s.notice.code, 'timerOffCleared')
  assert.equal(s.setFanTimer(id, 'sideways', 60), false, 'kind 只接受 off/on')
})

test('电源切换：1200ms 回执期内 pending，且抑制重复触发', async () => {
  const s = store()
  const id = 'DAEWOO-Fan-A1'

  assert.equal(s.toggleFanPower(id), true)
  assert.equal(s.isPending(id), true, '回执期内应为 pending')
  assert.equal(s.getDevice(id).power, false, '回执期内状态还没翻转')
  assert.equal(s.toggleFanPower(id), false, 'pending 期间重复点击应被抑制')

  await new Promise((r) => setTimeout(r, POWER_ACK_MS + 120))
  assert.equal(s.getDevice(id).power, true, '回执到达后应真正翻转')
  assert.equal(s.isPending(id), false)
})

/* ================= 风扇首页卡（版式对齐 AI Mori 卡 · Ricky 2026-10-12） =================
 * 归档 `tOS Prototype_aimate_fan.html` 的 `.device-card` 本来没有顶部状态行、图标盒是 72×52；
 * 2026-10-12 按「卡片一致性较差」把这套版式改成与 AI Mori 卡**逐段同构**：
 *   `.mc-top`（四张卡共用的状态行 + `···`）→ `.dc-main`（52×52 图标盒 + 名称/型号 + 右侧开关）
 *   → `.dc-gear-row`（整宽区块，上边 1px 分隔线）。
 * 行为不变：开关与 12 段档位**各持一个回执窗口**（归档两个变量 `b` / `w`），
 * 且两者都不是当即落值 —— 开关 1200ms、档位 900ms 后才改状态。
 */

test('首页卡点档位：900ms 回执后才落值，窗口内重复点被抑制（归档 oe）', async () => {
  const s = store()
  const id = 'DAEWOO-Fan-A1'
  assert.equal(s.getDevice(id).speed, 3, '归档初值 3 档')
  assert.equal(s.getDevice(id).power, false)

  assert.equal(s.requestFanSpeed(id, 7), true)
  assert.equal(s.isSpeedPending(id), true, '回执期内应为 speedPending')
  assert.equal(s.getDevice(id).speed, 3, '回执期内档位还没落值 —— 卡上这期间显「下发中…」')
  assert.equal(s.requestFanSpeed(id, 9), false, '回执期内重复点应被抑制（归档 if (w) return）')
  assert.equal(s.getDevice(id).speed, 3)

  await new Promise((r) => setTimeout(r, SPEED_ACK_MS + 120))
  assert.equal(s.getDevice(id).speed, 7, '回执到达后才落到第 7 档')
  assert.equal(s.getDevice(id).power, true, '归档：调档会把风扇一并打开')
  assert.equal(s.isSpeedPending(id), false)
})

test('首页卡点档位：非法档位 / 离线 / 童锁 / 不存在的设备一律拦下且不留痕', () => {
  const s = store()
  const id = 'DAEWOO-Fan-A1'

  for (const bad of [0, FAN_SPEED_MAX + 1, -1, 'abc', null, undefined, NaN, Infinity]) {
    assert.equal(s.requestFanSpeed(id, bad), false, `档位 ${bad} 应被拒`)
  }
  assert.equal(s.getDevice(id).speed, 3, '被拒后档位不应改变')
  assert.equal(s.isSpeedPending(id), false, '被拒不应留下 pending 标记')

  const off = storeWithOffline()
  assert.equal(off.requestFanSpeed(OFFLINE_ID, 5), false, '离线设备不能调档')
  assert.equal(off.notice.code, 'offline')
  assert.equal(off.isSpeedPending(OFFLINE_ID), false)

  const lock = store()
  assert.equal(lock.toggleChildLock(id), true)
  assert.equal(lock.requestFanSpeed(id, 5), false, '童锁下不能调档')
  assert.equal(lock.notice.code, 'childLock')
  assert.equal(lock.getDevice(id).speed, 3)

  assert.equal(lock.requestFanSpeed('NOPE', 5), false)
  assert.equal(lock.notice.code, 'notFound')
})

test('首页卡的开关与档位是两个独立回执窗口（归档两个变量 b / w）', async () => {
  const s = store()
  const id = 'DAEWOO-Fan-A1'

  // 若两者共用同一个 pending，后点的会把前一个的标记顶掉 ——
  // 开关会提前解禁、档位会提前落值，两个控件互相干扰。
  assert.equal(s.toggleFanPower(id), true)
  assert.equal(s.requestFanSpeed(id, 5), true)
  assert.equal(s.isPending(id), true, '开关的窗口仍在')
  assert.equal(s.isSpeedPending(id), true, '档位的窗口也仍在')

  await new Promise((r) => setTimeout(r, SPEED_ACK_MS + 150))
  assert.equal(s.isSpeedPending(id), false, '900ms 档位先到')
  assert.equal(s.getDevice(id).speed, 5)
  assert.equal(s.isPending(id), true, '1200ms 的开关窗口还没结束 —— 两个标记必须各活各的')

  // 1200ms 的开关回执随后到达。归档语义是「翻当前位置」，而调档已把电源推成 true
  // ⇒ 这一翻反而成了「关」，所以这里只验证两个窗口互不干扰，不对最终电源值下判断。
  await new Promise((r) => setTimeout(r, POWER_ACK_MS - SPEED_ACK_MS + 250))
  assert.equal(s.isPending(id), false)
  assert.equal(s.isSpeedPending(id), false)
})

test('显示名：有昵称用昵称（归档 x = nick || name）', () => {
  const s = store()
  const id = 'DAEWOO-Fan-A1'
  assert.equal(s.displayName(id), 'DAEWOO-Fan-A1')
  s.setNick(id, '客厅风扇')
  assert.equal(s.displayName(id), '客厅风扇')
  s.setNick(id, '')
  assert.equal(s.displayName(id), 'DAEWOO-Fan-A1')
  assert.equal(s.setNick(id, 'x'.repeat(40)).toString(), 'true')
  assert.equal(s.getDevice(id).nick.length, 24, '昵称应截到 24 字')
})

/* ================= 添加 / 移除设备 ================= */

test('扫描 → 配对 → 移除：闭环可用，重复配对不生效', () => {
  const s = store()
  assert.equal(s.discovered.length, 0)

  const found = s.startScan()
  assert.equal(found.length, SCAN_CANDIDATES.length)
  assert.equal(s.scanning, true)

  const before = s.deviceCount
  assert.equal(s.pairDevice('SCAN-Bulb-02'), true)
  assert.equal(s.deviceCount, before + 1)
  assert.equal(s.getDevice('SCAN-Bulb-02').online, true)
  assert.equal(s.scanning, false, '配对成功后应退出扫描态')

  assert.equal(s.pairDevice('SCAN-Bulb-02'), false, '已存在的设备不应重复添加')
  assert.equal(s.deviceCount, before + 1)
  assert.equal(s.pairDevice('NOT-EXIST'), false)

  assert.equal(s.removeDevice('SCAN-Bulb-02'), true)
  assert.equal(s.deviceCount, before)
  assert.equal(s.removeDevice('SCAN-Bulb-02'), false, '移除不存在的设备应返回 false')
})

test('配对风扇：拿到的是完整风扇状态（不是只有 power 的简单设备）', () => {
  const s = store()
  s.startScan()
  s.pairDevice('SCAN-Fan-A3')
  const d = s.getDevice('SCAN-Fan-A3')
  assert.equal(d.type, 'fan')
  assert.equal(typeof d.speed, 'number')
  assert.equal(typeof d.mode, 'number')
  assert.equal(typeof d.childLock, 'boolean')
})

test('移除当前选中设备后，选择自动回落到剩余设备，不留悬空 id', () => {
  const s = store()
  const target = s.devices[1].id
  s.selectDevice(target)
  assert.equal(s.activeDeviceId, target)
  s.removeDevice(target)
  assert.notEqual(s.activeDeviceId, target)
  assert.ok(s.getDevice(s.activeDeviceId), '回落后的 id 必须是真实存在的设备')
})

test('设备目录工厂每次返回全新对象，互不串状态', () => {
  const a = createDeviceCatalog()
  const b = createDeviceCatalog()
  a.find((d) => d.id === 'DAEWOO-Fan-A1').speed = 9
  assert.equal(b.find((d) => d.id === 'DAEWOO-Fan-A1').speed, 3, '两个实例不能共享同一个对象')
})

/* ================= 录音充电宝 ================= */

test('拾音模式：只接受 3 种，非法值被拒', () => {
  const s = store()
  assert.deepEqual(PICKUP_MODES, ['omni', 'directed', 'meeting'])
  assert.equal(s.setPickupMode('directed'), true)
  assert.equal(s.pickupMode, 'directed')
  assert.equal(s.setPickupMode('telepathy'), false)
  assert.equal(s.pickupMode, 'directed')
})

test('录音：开关与计时；Tab 与听译语言常量与归档一致', () => {
  const s = store()
  assert.deepEqual(RECORDER_TABS, ['markers', 'transcript', 'summary'])
  assert.deepEqual(LISTEN_LANGS, ['zh', 'en', 'ja', 'ko'])

  assert.equal(s.recording, false)
  assert.equal(s.toggleRecording(), true)
  s.tickRecording()
  s.tickRecording()
  assert.equal(s.recordSeconds, 2)
  assert.equal(s.toggleRecording(), false)
  s.tickRecording()
  assert.equal(s.recordSeconds, 2, '停止后不再计时')
})

test('音频标记：空文本被拒；正常添加进入 markers', () => {
  const s = store()
  const before = s.markers.length
  assert.equal(s.addMarker('12:00', '   '), false)
  assert.equal(s.markers.length, before)
  assert.equal(s.addMarker('12:00', '测试标记'), true)
  assert.equal(s.markers.length, before + 1)
  assert.equal(s.markers.at(-1).at, '12:00')
})

test('录音与风扇的童锁/离线门禁互不影响', () => {
  const s = store()
  s.toggleChildLock('DAEWOO-Fan-A1')
  assert.equal(s.getDevice('DAEWOO-Fan-A1').childLock, true)
  assert.equal(s.toggleRecording(), true, '童锁只作用于风扇域，不应拦住录音')
})

/* ================= 注册表接入（P1） ================= */

test('apps.js：aimate 进桌面网格（不进 Dock），getApp 可解析', () => {
  const src = read('src/config/apps.js')
  assert.match(src, /id:\s*'aimate'/, 'apps.js 应有 aimate 注册项')

  // 不要在 aimate 的注册项里出现 dock: true
  const block = src.slice(src.indexOf("id: 'aimate'"), src.indexOf("id: 'aimate'") + 400)
  assert.ok(!/dock:\s*true/.test(block), 'aimate 不应进 Dock（已决 D1）')
})

test('registry.js：aimate → AimateApp 已注册', () => {
  const src = read('src/components/apps/registry.js')
  assert.match(src, /import AimateApp from '\.\/aimate\/AimateApp\.vue'/)
  assert.match(src, /aimate:\s*AimateApp/)
})

test('ScreenView：aimate 是浅色应用，不应进 DARK_BG_APPS', () => {
  const src = read('src/components/phone/ScreenView.vue')
  const line = src.split('\n').find((l) => l.includes('DARK_BG_APPS =')) || ''
  // DARK_BG_APPS 只放深底应用（camera #000 / clock / voicememos / oneleap）。
  // AI Mate 走浅色 iOS 分组列表（#F2F2F7），应与 settings / calendar 一样不在列内，
  // 这样状态栏配色才与其它浅色应用一致 —— 因此本文件不应被改动。
  assert.ok(!/'aimate'/.test(line), `aimate 是浅色应用，不应登记进 DARK_BG_APPS：${line.trim()}`)
  assert.match(line, /'oneleap'/, 'sanity：深色的 oneleap 仍应在列内')
})

test('桌面图标资产存在且为 96×96 圆角方形', () => {
  const p = path.resolve(ROOT, 'public/icons/aimate.png')
  assert.ok(fs.existsSync(p), 'public/icons/aimate.png 应存在')
  const buf = fs.readFileSync(p)
  assert.equal(buf.readUInt32BE(16), 96, '图标宽应为 96')
  assert.equal(buf.readUInt32BE(20), 96, '图标高应为 96')
  assert.equal(buf[25], 6, 'PNG 应为 RGBA（第 6 种颜色类型），保证圆角透明')
})

/* ================= i18n ================= */

test('lucide.js 的 import / const 标识符不得撞 JS 严格模式保留字', () => {
  // 实测踩过：`import package from 'lucide-static/icons/package.svg?raw'` 会让整个应用
  // 起不来（页面一片空白 + `Unexpected strict mode reserved word`），
  // 而 dev server 对该文件仍返回 200 —— 所以 200 不能当编译判据，这里静态拦住。
  const RESERVED = ['implements', 'interface', 'let', 'package', 'private', 'protected',
    'public', 'static', 'yield', 'await', 'enum', 'eval', 'arguments']
  const src = read('src/assets/icons/lucide.js')
  const bad = RESERVED.filter((w) => (
    new RegExp(`^import\\s+${w}\\s+from`, 'm').test(src) ||
    new RegExp(`^const\\s+${w}\\s*=`, 'm').test(src)
  ))
  assert.deepEqual(bad, [], `这些标识符是严格模式保留字，会让整个应用白屏：${bad.join(', ')}`)
})

test('三语词条齐备：真实导入 APP_NAMES / AIMATE 校验（不用正则，避免漏逗号这类语法错被放过）', async () => {
  const { APP_NAMES } = await import('../src/locales/app-names.js')
  const { AIMATE } = await import('../src/locales/aimate.js')

  for (const loc of ['zh', 'en', 'bn']) {
    assert.equal(APP_NAMES[loc].aimate, 'AI Mate', `app-names.${loc}.aimate 缺失或不对`)
    assert.ok(AIMATE[loc], `aimate 词条缺 ${loc}`)
  }

  /** 递归收集叶子路径，用于跨语言比键集 */
  const leafPaths = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) => {
    const p = prefix ? `${prefix}.${k}` : k
    return v && typeof v === 'object' && !Array.isArray(v) ? leafPaths(v, p) : [p]
  })

  // 三语键集必须一致：漏翻会表现为某个语言少键，这里直接拦住
  const zhKeys = leafPaths(AIMATE.zh).sort()
  for (const loc of ['en', 'bn']) {
    const keys = leafPaths(AIMATE[loc]).sort()
    const missing = zhKeys.filter((k) => !keys.includes(k))
    const extra = keys.filter((k) => !zhKeys.includes(k))
    assert.deepEqual(missing, [], `${loc} 缺少词条：${missing.join(', ')}`)
    assert.deepEqual(extra, [], `${loc} 多出词条：${extra.join(', ')}`)
  }

  // 与 store 的常量对齐：风扇 6 档名 / 拾音模式 / Tab / 听译语言
  assert.equal(AIMATE.zh.fan.modes.length, FAN_MODES.length, 'fan.modes 条数应与 FAN_MODES 一致')
  for (const loc of ['en', 'bn']) {
    assert.equal(AIMATE[loc].fan.modes.length, FAN_MODES.length, `${loc} 的 fan.modes 条数不一致`)
  }
  for (const m of PICKUP_MODES) {
    for (const loc of ['zh', 'en', 'bn']) {
      assert.ok(AIMATE[loc].recorder.pickupModes[m], `${loc}.recorder.pickupModes.${m} 缺失`)
      assert.ok(AIMATE[loc].recorder.pickupDesc[m], `${loc}.recorder.pickupDesc.${m} 缺失`)
    }
  }
  for (const t of RECORDER_TABS) {
    for (const loc of ['zh', 'en', 'bn']) assert.ok(AIMATE[loc].recorder[t], `${loc}.recorder.${t} 缺失`)
  }
  // 设备名与 store 的设备类别一一对应
  for (const type of DEVICE_TYPES) {
    for (const loc of ['zh', 'en', 'bn']) assert.ok(AIMATE[loc].type[type.id], `${loc}.type.${type.id} 缺失`)
  }
  // store 会抛的每个 notice 码都必须有文案，否则界面上会出现裸 code
  for (const code of ['offline', 'childLock', 'timerOffSet', 'timerOnSet', 'timerOffCleared', 'timerOnCleared', 'notFound']) {
    for (const loc of ['zh', 'en', 'bn']) assert.ok(AIMATE[loc].notice[code], `${loc}.notice.${code} 缺失`)
  }
})


/* ================= P2 · 设备规格 ================= */

test('设备规格：每台设备都有型号 / 固件版本，MAC 格式合法、全局唯一、由 id 决定', () => {
  const list = createDeviceCatalog()

  for (const d of list) {
    assert.ok(d.model, `${d.id} 缺型号`)
    assert.ok(d.firmware, `${d.id} 缺固件版本`)
    assert.match(d.mac, /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/, `${d.id} 的 MAC「${d.mac}」格式不合法`)
  }

  const macs = list.map((d) => d.mac)
  assert.equal(new Set(macs).size, macs.length, 'MAC 必须全局唯一，否则详情页无法区分设备')

  // 同一 id 两次构造必须得到同一个 MAC，否则每次渲染都会抖动
  const again = createDeviceCatalog().find((d) => d.id === list[0].id)
  assert.equal(again.mac, list[0].mac, '同一 id 的 MAC 必须稳定')
})

test('型号目录：键集与 10 类设备一一对应，且都是非空短串', () => {
  const keys = Object.keys(TYPE_MODELS).slice().sort()
  const ids = DEVICE_TYPES.map((t) => t.id).slice().sort()
  assert.deepEqual(keys, ids, 'TYPE_MODELS 的键集必须与设备类别完全一致')

  for (const [k, v] of Object.entries(TYPE_MODELS)) {
    assert.ok(typeof v === 'string' && v.trim().length > 0, `${k} 的型号为空`)
  }
})

/* ================= P2 · 固件升级 ================= */

test('固件升级：完成后版本落地、待升级标记清空、回执期间抑制重复触发', async () => {
  const s = store()
  const d = s.getDevice('DAEWOO-Fan-A1')
  assert.equal(d.firmware, '1.4.2', '初始版本应取归档值')
  assert.equal(d.fwNext, '1.5.0', '应存在可用新版本')
  assert.equal(s.hasUpgrade(d.id), true)

  assert.equal(s.upgradeFirmware(d.id), true, '有新版时应可升级')
  assert.equal(s.isPending(d.id), true, '升级期间应处于 pending')
  assert.equal(s.upgradeFirmware(d.id), false, 'pending 期间不得重复触发')

  await new Promise((r) => { setTimeout(r, FIRMWARE_UPGRADE_MS + 80) })

  assert.equal(d.firmware, '1.5.0', '升级后版本号应更新')
  assert.equal(d.fwNext, null, '升级后不应再留待升级标记')
  assert.equal(s.hasUpgrade(d.id), false, '升级后不应再显示可升级')
  assert.equal(s.isPending(d.id), false, '升级结束后应退出 pending')
  assert.equal(s.notice?.code, 'firmwareUpgraded', '升级完成应抛出对应提示码')
  assert.equal(s.notice?.params?.v, '1.5.0', '提示码应带上目标版本号')
})

test('固件升级：离线设备被拦截；已是最新的设备不启动升级', () => {
  const s = storeWithOffline()

  // 离线 —— 与开关走同一道门禁
  assert.equal(s.hasUpgrade(OFFLINE_ID), false, '离线设备不应出现在可升级列表')
  assert.equal(s.upgradeFirmware(OFFLINE_ID), false, '离线设备升级应被拦截')
  assert.equal(s.notice?.code, 'offline', '应给出离线原因码')
  assert.equal(s.isPending(OFFLINE_ID), false, '被拦截时不得进入 pending')

  // 在线但没有新版本：目录里必然存在这样一台（非空性判据）
  const plain = s.devices.find((x) => x.online && !x.fwNext)
  assert.ok(plain, '目录里应存在「已是最新」的在线设备')
  assert.equal(s.hasUpgrade(plain.id), false)
  assert.equal(s.upgradeFirmware(plain.id), false, '无新版本时不应启动升级')
})

test('固件升级：受童锁拦截，关闭童锁后恢复', () => {
  const s = store()
  const d = s.getDevice('DAEWOO-Fan-A1')

  s.toggleChildLock(d.id)
  assert.equal(d.childLock, true)
  assert.equal(s.upgradeFirmware(d.id), false, '童锁期间不应允许升级')
  assert.equal(s.notice?.code, 'childLock')
  assert.equal(d.firmware, '1.4.2', '被拦截时版本不得变动')

  s.toggleChildLock(d.id)
  assert.equal(s.upgradeFirmware(d.id), true, '关闭童锁后应恢复可升级')
})

/* ================= P2 · 配网三态 ================= */

test('扫描候选：恰好一台用于覆盖「连接失败」分支', () => {
  assert.equal(SCAN_CANDIDATES.length, 5, '候选数量不应变化')
  const fail = SCAN_CANDIDATES.filter((c) => c.willFail)
  assert.equal(fail.length, 1, '应恰好有一台候选用于验证失败态')
})

test('重新扫描：已入库的设备不再出现在候选里（避免点击无反馈）', () => {
  const s = store()
  assert.equal(s.startScan().length, 5, '首次扫描应为全部 5 台候选')

  assert.equal(s.pairDevice('SCAN-Fan-A3'), true)
  const again = s.startScan()
  assert.equal(again.length, 4, '已配对的设备不应再次出现')
  assert.equal(again.some((c) => c.id === 'SCAN-Fan-A3'), false, '已入库的 id 不应留在候选里')

  for (const c of [...SCAN_CANDIDATES]) s.pairDevice(c.id)
  assert.equal(s.startScan().length, 0, '全部入库后应扫不到设备（空态分支有依据）')
})

test('新配对设备同样带规格字段（型号 / MAC / 固件）', () => {
  const s = store()
  s.startScan()
  assert.equal(s.pairDevice('SCAN-Fan-A3'), true)

  const d = s.getDevice('SCAN-Fan-A3')
  assert.ok(d, '配对后应入库')
  assert.equal(d.model, TYPE_MODELS.fan, '新风扇应取风扇型号')
  assert.match(d.mac, /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/, '新设备应有合法 MAC')
  assert.ok(d.firmware, '新设备应有固件版本')
})


/* ============================================================================
 * P3a · 口袋打印机（归档 `ai-mate-printer-demo.html`，800 行单文件原型）
 * ----------------------------------------------------------------------------
 * 归档是 7 屏 + 1 个 `progress-modal`：
 *   home / device / gallery / editor / ar / camera / my
 * 其中 home 与 my 是本 App 的外壳（首页 / 我的），打印流只负责：
 *   device（设备页，打印段 + 设备管理段同屏平铺）
 *   gallery（4 个相册分组 + 单选）/ editor（暗色舞台 + 5 个工具面板）
 *   ar（三步向导）/ camera（拍照 / AR 扫描）
 * 下面按「屏」分组，数值全部来自归档实测；改之前先回归档复核。
 * ==========================================================================*/

test('打印机素材：6 张照片、分组合法、路径指向 /photos/、每组非空', () => {
  assert.equal(PRINTER_PHOTOS.length, 6, '归档提供 6 张相册素材')

  const ids = PRINTER_PHOTOS.map((p) => p.id)
  assert.equal(new Set(ids).size, ids.length, '照片 id 必须唯一')

  for (const p of PRINTER_PHOTOS) {
    assert.ok(Array.isArray(p.groups) && p.groups.length > 0, `${p.id} 缺 groups`)
    for (const g of p.groups) {
      assert.ok(PHOTO_GROUPS.includes(g), `${p.id} 的分组「${g}」不在 PHOTO_GROUPS 内`)
    }
    assert.match(p.src, /^\/photos\/[\w-]+\.jpg$/, `${p.id} 的素材路径应为 /photos/*.jpg`)
  }

  // 非空性：四个分组都必须有照片，否则对应的 album-tab 点了是空的
  for (const g of PHOTO_GROUPS) {
    assert.ok(PRINTER_PHOTOS.some((p) => p.groups.includes(g)), `分组「${g}」没有任何照片`)
  }
  // 「最近项目」是全集（归档进相册的默认视图）
  assert.equal(
    PRINTER_PHOTOS.filter((p) => p.groups.includes('recent')).length,
    PRINTER_PHOTOS.length,
    '「最近项目」应包含全部素材'
  )
})

test('打印机常量与归档对齐：裁剪 3 / 版式 4 / 相框 4 / 滤镜 4 / 工具 5 / 质量 2 / 色彩 3', () => {
  // 归档 crop pane 前三项是单选；第 4 项「旋转」是动作，单独走 rotateEditPhoto()
  assert.deepEqual(EDIT_CROPS, ['original', 'ratio34', 'square'])
  assert.deepEqual(EDIT_LAYOUTS, ['border', 'full', 'grid2', 'grid4'])
  assert.deepEqual(EDIT_FRAMES, ['none', 'dot', 'film', 'handwrite'])
  assert.deepEqual(PRINT_FILTERS, ['original', 'sunny', 'oldfilm', 'mono'])
  assert.deepEqual(EDIT_TOOLS, ['crop', 'layout', 'frame', 'filter', 'adjust'])
  // 归档 segments 的书写顺序（标准在前）
  assert.deepEqual(PRINT_QUALITIES, ['standard', 'hd'])
  assert.deepEqual(PRINT_COLORS, ['natural', 'vivid', 'retro'])

  // 归档首页卡与设备管理页都写死「相纸 5 / 5 张 · 纸仓已满」，队列 badge 写「N / 5」
  assert.equal(PAPER_MAX, 5, '归档相纸容量是 5')
  assert.equal(QUEUE_MAX, PAPER_MAX, '队列上限 = 纸仓容量')

  assert.equal(AR_VIDEO.name, '岛屿漫游.mov')
  assert.equal(AR_VIDEO.duration, 18)
  assert.deepEqual(
    [AR_VIDEO.trimStart, AR_VIDEO.trimEnd], [4, 13],
    '归档时间轴实测 00:04 → 00:13、「已裁剪至 9 秒」'
  )

  // 归档 renderProgress 的三阶段分界：<35 传输 / <80 显影 / 其余裁切
  assert.deepEqual(PRINT_STAGE_BOUNDS, [35, 80])
})

test('openPrint 进设备页（不是自造的「选来源」中间页）并复位上一轮编辑状态', () => {
  const s = store()
  s.setEditCrop('square')
  s.setEditFilter('mono')
  s.setEditBrightness(130)
  s.setEditStrength(0)
  s.pickGalleryPhoto('p6')

  assert.equal(s.openPrint('AM-Printer-01'), true)
  assert.equal(s.printScreen, 'device')
  assert.equal(s.printDeviceId, 'AM-Printer-01')

  assert.equal(s.editTool, 'filter', '归档进编辑器默认打开滤镜面板')
  assert.equal(s.editCrop, 'original')
  assert.equal(s.editFilter, 'sunny', '归档初始滤镜是晴日')
  assert.equal(s.editBrightness, 100)
  assert.equal(s.editStrength, 70)
  assert.equal(s.editWhiteBorder, true)
  assert.equal(s.editLayout, 'border')
  assert.equal(s.editFrame, 'none')
  assert.equal(s.editRotate, 0)

  assert.equal(s.selectedPhotoId, 'p1', '归档进相册有默认选中')
  assert.equal(s.photoGroup, 'recent')
  assert.equal(s.galleryMode, 'photo')
  assert.equal(s.arStep, 1)
  assert.equal(s.arVideoSelected, false)
  assert.equal(s.arCoverSelected, false)
  assert.equal(s.printModalOpen, false)

  assert.equal(s.openPrint('不存在的设备'), false, '非法设备应被拒')
})

test('quickPrint 直达相册，但返回目标仍是设备页', () => {
  const s = store()
  assert.equal(s.quickPrint('AM-Printer-01'), true)
  assert.equal(s.printScreen, 'gallery', '归档 quickPrint 跳过设备页')
  assert.equal(s.galleryMode, 'photo')
  assert.equal(s.galleryReturn, 'device', '相册点「取消」要回设备页')

  assert.equal(s.quickPrint('不存在的设备'), false)
})

test('gotoPrintScreen 只认五屏；旧屏名 source / picker / queue 一律被拒', () => {
  const s = store()
  s.openPrint()
  for (const p of ['device', 'gallery', 'editor', 'ar', 'camera']) {
    assert.equal(s.gotoPrintScreen(p), true, `${p} 应可切`)
    assert.equal(s.printScreen, p)
  }
  for (const p of ['source', 'picker', 'queue', 'bogus', null]) {
    assert.equal(s.gotoPrintScreen(p), false, `${p} 不是打印流的屏`)
  }
  assert.equal(s.printScreen, 'camera', '非法屏名不得改变当前屏')
})

test('相册：分组切换 + 单选（后选的覆盖前一个）+ 非法 id 被拒', () => {
  const s = store()
  s.openPrint()

  assert.equal(s.photoGroup, 'recent')
  assert.equal(s.setPhotoGroup('camera'), true)
  assert.equal(s.photoGroup, 'camera')
  assert.equal(s.setPhotoGroup('nope'), false)
  assert.equal(s.photoGroup, 'camera', '非法分组不得改变当前分组')
  assert.deepEqual(s.photosInGroup.map((p) => p.id), ['p5'], '「相机」分组只有宠物那一张')

  // 归档 `selectGallery` 先清掉所有 `.active` 再点亮当前格 ⇒ 单选
  assert.equal(s.pickGalleryPhoto('p1'), true)
  assert.equal(s.selectedPhotoId, 'p1')
  assert.equal(s.pickGalleryPhoto('p5'), true)
  assert.equal(s.selectedPhotoId, 'p5', '单选 —— 后选的覆盖前一个')
  assert.equal(s.pickGalleryPhoto('不存在'), false)
  assert.equal(s.selectedPhotoId, 'p5', '非法 id 不得改变选中项')
})

test('相册的返回目标跟着来源走（设备页 / AR）', () => {
  const s = store()
  s.openPrint()
  s.openGallery('photo')
  assert.equal(s.printScreen, 'gallery')
  assert.equal(s.galleryReturn, 'device')
  assert.equal(s.closeGallery(), true)
  assert.equal(s.printScreen, 'device')

  s.openAR()
  s.openGallery('ar')
  assert.equal(s.galleryReturn, 'ar', '从 AR 进的相册要回 AR')
  assert.equal(s.galleryMode, 'ar')
  assert.equal(s.closeGallery(), true)
  assert.equal(s.printScreen, 'ar')
})

test('goEditor：editMode 跟着相册来源；AR 来的顺手标好封面并静默复位', () => {
  const s = store()
  s.openPrint()
  s.openGallery('photo')
  s.setEditFilter('mono')
  s.setEditBrightness(80)

  assert.equal(s.goEditor(), true)
  assert.equal(s.printScreen, 'editor')
  assert.equal(s.editMode, 'photo')
  assert.equal(s.arCoverSelected, false)
  assert.equal(s.editFilter, 'sunny', '进编辑器时归档静默调用 resetEditor(false)')
  assert.equal(s.editBrightness, 100)

  s.openAR()
  s.openGallery('ar')
  assert.equal(s.goEditor(), true)
  assert.equal(s.editMode, 'ar')
  assert.equal(s.arCoverSelected, true, 'AR 来源进编辑器时封面已定')
})

test('编辑器：白名单 + 白边 toggle + 亮度 70–130 + 强度 0–100 + 旋转', () => {
  const s = store()
  s.openPrint()

  for (const t of EDIT_TOOLS) assert.equal(s.setEditTool(t), true, `工具 ${t}`)
  assert.equal(s.setEditTool('nope'), false)
  for (const c of EDIT_CROPS) assert.equal(s.setEditCrop(c), true, `裁剪 ${c}`)
  assert.equal(s.setEditCrop('nope'), false)
  for (const l of EDIT_LAYOUTS) assert.equal(s.setEditLayout(l), true, `版式 ${l}`)
  assert.equal(s.setEditLayout('nope'), false)
  for (const f of EDIT_FRAMES) assert.equal(s.setEditFrame(f), true, `相框 ${f}`)
  assert.equal(s.setEditFrame('nope'), false)
  for (const f of PRINT_FILTERS) assert.equal(s.setEditFilter(f), true, `滤镜 ${f}`)
  assert.equal(s.setEditFilter('nope'), false)

  // 归档「保留白边」是 toggle
  assert.equal(s.editWhiteBorder, true)
  assert.equal(s.toggleEditBorder(), false)
  assert.equal(s.toggleEditBorder(), true)
  assert.equal(s.setEditWhiteBorder(false), false)
  assert.equal(s.editWhiteBorder, false)

  // 亮度：归档 range `min=70 max=130 value=100`
  assert.equal(s.setEditBrightness(130), true)
  assert.equal(s.editBrightness, 130)
  assert.equal(s.setEditBrightness(999), true)
  assert.equal(s.editBrightness, 130, '超出上限应被夹到 130')
  assert.equal(s.setEditBrightness(0), true)
  assert.equal(s.editBrightness, 70, '低于下限应被夹到 70')
  assert.equal(s.setEditBrightness('x'), false)
  assert.equal(s.editBrightness, 70, '非法值不得改变状态')

  // 强度：归档第二条 range `min=0 max=100 value=70`
  assert.equal(s.setEditStrength(100), true)
  assert.equal(s.editStrength, 100)
  assert.equal(s.setEditStrength(-5), true)
  assert.equal(s.editStrength, 0)
  assert.equal(s.setEditStrength(999), true)
  assert.equal(s.editStrength, 100)
  assert.equal(s.setEditStrength('x'), false)

  assert.equal(s.rotateEditPhoto(), 90)
  assert.equal(s.rotateEditPhoto(), 180)
  assert.equal(s.rotateEditPhoto(), 270)
  assert.equal(s.rotateEditPhoto(), 0, '转满一圈回到 0')

  // 恢复：归档头部没有「恢复」按钮，但 resetEdit 是真的存在
  s.clearNotice()
  assert.equal(s.resetEdit(false), true)
  assert.equal(s.notice, null, '静默复位不得弹提示')
  assert.equal(s.editFilter, 'sunny')
  s.setEditFilter('mono')
  assert.equal(s.resetEdit(), true)
  assert.equal(s.notice?.code, 'printEditReset')
})

test('编辑器「取消 / 完成」按 editMode 分流（归档 confirmEditor / cancelEditor）', () => {
  // photo：取消回设备页，完成入队
  const s = store()
  s.openPrint()
  s.openGallery('photo')
  s.goEditor()
  assert.equal(s.cancelEditor(), true)
  assert.equal(s.printScreen, 'device')

  s.openGallery('photo')
  s.goEditor()
  assert.equal(s.confirmEditor(), true)
  assert.equal(s.queueCount, 1)
  assert.equal(s.printScreen, 'device')
  assert.equal(s.notice?.code, 'printQueued')

  // ar：取消回 AR，完成进第 3 步确认
  const t = store()
  t.openPrint()
  t.openAR()
  t.openGallery('ar')
  t.goEditor()
  assert.equal(t.cancelEditor(), true)
  assert.equal(t.printScreen, 'ar')

  t.openGallery('ar')
  t.goEditor()
  assert.equal(t.confirmEditor(), true)
  assert.equal(t.arStep, 3)
  assert.equal(t.printScreen, 'ar')
  assert.equal(t.queueCount, 0, 'AR 的完成不进普通队列')
})

test('打印队列：可累积到上限；超限被拒并提示；移除即清零', () => {
  const s = store()
  s.openPrint()
  assert.equal(s.queueCount, 0)
  assert.equal(s.queueFull, false)

  for (let i = 0; i < QUEUE_MAX; i += 1) {
    assert.equal(s.addToQueue(), true, `第 ${i + 1} 张应可入队`)
    assert.equal(s.queueCount, i + 1)
    assert.equal(s.printScreen, 'device', '归档入队后回设备页')
  }
  assert.equal(s.queueFull, true)

  assert.equal(s.addToQueue(), false, '超上限应被拒')
  assert.equal(s.notice?.code, 'printQueueFull')
  assert.equal(s.notice?.params?.n, QUEUE_MAX)
  assert.equal(s.queueCount, QUEUE_MAX, '被拒时计数不得变化')

  assert.equal(s.removeQueue(), true)
  assert.equal(s.queueCount, 0)
  assert.equal(s.notice?.code, 'printRemoved')
  assert.equal(s.removeQueue(), false, '空队列移除应被拒')
})

test('打印：开始打印打开进度模态、队列进 sending，进度按 35 / 80 跨三阶段', () => {
  const s = store()
  s.openPrint()
  s.addToQueue()

  assert.equal(s.startPrint('photo'), true)
  assert.equal(s.printModalOpen, true, '归档漏加的 `open` 类在这里补上')
  assert.equal(s.queueSending, true)
  assert.equal(s.queuePhase, 'printing')
  assert.equal(s.queueKind, 'photo')
  assert.equal(s.printProgress, 0)
  assert.equal(s.printPaused, false)
  assert.equal(s.printDone, false)
  assert.equal(s.printScreen, 'device', '归档 startPrint 第一件事是回设备页')
  assert.equal(s.notice?.code, 'printStarted')
  assert.equal(s.startPrint('nope'), false, '非法品类应被拒')

  // AR 那一单的启动提示与完成提示都不一样
  const t = store()
  t.openPrint()
  t.addToQueue()
  t.startPrint('ar')
  assert.equal(t.notice?.code, 'printArStarted')
  assert.equal(t.queueKind, 'ar')

  // 归档 renderProgress 的进度驱动（1.5 / tick）
  for (let i = 0; i < 10; i += 1) s.tickPrint()
  assert.ok(s.printProgress < PRINT_STAGE_BOUNDS[0], '前段应是「传输打印数据」')
  for (let i = 0; i < 20; i += 1) s.tickPrint()
  assert.ok(
    s.printProgress >= PRINT_STAGE_BOUNDS[0] && s.printProgress < PRINT_STAGE_BOUNDS[1],
    '中段应是「照片正在显影」'
  )
  for (let i = 0; i < 25; i += 1) s.tickPrint()
  assert.ok(s.printProgress >= PRINT_STAGE_BOUNDS[1], '尾段应是「正在完成裁切」')
})

test('打印：暂停不推进；取消连队列一起撤；完成后按 kind 分流', () => {
  const s = store()
  s.openPrint()
  s.addToQueue()
  s.startPrint('photo')
  for (let i = 0; i < 10; i += 1) s.tickPrint()
  const at = s.printProgress

  assert.equal(s.togglePrintPause(), true)
  assert.equal(s.printPaused, true)
  assert.equal(s.notice?.code, 'printPaused')
  for (let i = 0; i < 10; i += 1) s.tickPrint()
  assert.equal(s.printProgress, at, '暂停期间不得推进')
  assert.equal(s.togglePrintPause(), true)
  assert.equal(s.notice?.code, 'printResumed')

  assert.equal(s.cancelPrint(), true)
  assert.equal(s.printModalOpen, false)
  assert.equal(s.printProgress, 0)
  assert.equal(s.queueCount, 0, '取消要连后台那一单一起撤（归档的死代码缝）')
  assert.equal(s.queueSending, false)
  assert.equal(s.notice?.code, 'printCanceled')

  // 跑到 100：归档 completePrint
  const t = store()
  t.openPrint()
  t.addToQueue()
  t.startPrint('photo')
  for (let i = 0; i < 200; i += 1) t.tickPrint()
  assert.equal(t.printDone, true)
  assert.equal(t.printProgress, 100)
  assert.equal(t.queuePhase, 'done')
  assert.equal(t.queueSending, false)
  assert.equal(t.tickPrint(), false, '完成后不再推进')
  assert.equal(t.togglePrintPause(), false, '完成后不能暂停')
  assert.equal(t.settleQueue(), false, '已结算过再调应为空操作')

  assert.equal(t.finishPrint(), true)
  assert.equal(t.printScreen, 'device', '普通照片完成 → 回设备页')
  assert.equal(t.queueCount, 0)
  assert.equal(t.printModalOpen, false)

  // AR 完成 → 去相机的 AR 扫描模式（归档 finishPrint）
  const u = store()
  u.openPrint()
  u.addToQueue()
  u.startPrint('ar')
  for (let i = 0; i < 200; i += 1) u.tickPrint()
  assert.equal(u.finishPrint(), true)
  assert.equal(u.printScreen, 'camera')
  assert.equal(u.cameraMode, 'scan')
  assert.equal(u.cameraPlaying, false)

  // 后台结算：归档 startPrint 里 4.8 秒后才把队列项翻成完成文案
  const v = store()
  v.openPrint()
  v.addToQueue()
  v.startPrint('photo')
  assert.equal(v.settleQueue(), true)
  assert.equal(v.queuePhase, 'done')
  assert.equal(v.notice?.code, 'printDone')

  const w = store()
  w.openPrint()
  w.addToQueue()
  w.startPrint('ar')
  w.settleQueue()
  assert.equal(w.notice?.code, 'printArDone')
})

test('设备管理：质量 / 色彩白名单、改名同步昵称、固件 0–100、购买相纸只提示', () => {
  const s = store()
  s.openPrint()
  assert.equal(s.printQuality, 'standard', '归档 segments 默认「标准」')
  assert.equal(s.printColor, 'natural')

  for (const q of PRINT_QUALITIES) assert.equal(s.setPrintQuality(q), true)
  assert.equal(s.setPrintQuality('nope'), false)
  assert.equal(s.notice?.code, 'printSettingSaved')
  for (const c of PRINT_COLORS) assert.equal(s.setPrintColor(c), true)
  assert.equal(s.setPrintColor('nope'), false)

  // 改名写进设备昵称 —— 首页卡 / 迷你设备卡 / AR 确认卡共用一个来源
  assert.equal(s.printDevice.id, 'AM-Printer-01')
  assert.equal(s.renamePrinter('  客厅打印机  '), true)
  assert.equal(s.printDevice.nick, '客厅打印机', '应去掉首尾空格')
  assert.equal(s.notice?.code, 'printRenamed')
  assert.equal(s.renamePrinter('   '), true)
  assert.equal(s.printDevice.nick, '', '清空昵称 → 回落到 deviceTitle.printer')

  // 固件：归档 `upgradeFirmware` 0 → 100、每档 20（节奏在组件里）
  assert.equal(s.fwProgress, null)
  assert.equal(s.setFwProgress(0), true)
  assert.equal(s.setFwProgress(20), true)
  assert.equal(s.fwProgress, 20)
  assert.equal(s.setFwProgress(120), false, '超出 0–100 应被拒')
  assert.equal(s.setFwProgress(-1), false)
  assert.equal(s.fwProgress, 20, '被拒时不得变化')
  assert.equal(s.setFwProgress(100), true)
  assert.equal(s.notice?.code, 'printFwDone')

  // 购买相纸：归档只弹一条提示，**没有**补充逻辑
  const before = s.paper
  assert.equal(s.buyPaper(), true)
  assert.equal(s.notice?.code, 'paperGuide')
  assert.equal(s.paper, before, '归档不改余量')
  assert.equal(s.paperFull, true, '归档恒「纸仓已满」（5 / 5）')
})

test('相机：来源记忆 + 模式白名单 + 拍照 / 扫描两条路', () => {
  const s = store()
  s.openPrint()
  assert.equal(s.openCamera(), true)
  assert.equal(s.printScreen, 'camera')
  assert.equal(s.cameraReturn, 'device')
  assert.equal(s.cameraMode, 'photo')
  assert.equal(s.editMode, 'photo')
  assert.equal(s.cameraPlaying, false)

  for (const m of CAMERA_MODES) assert.equal(s.setCameraMode(m), true, `模式 ${m}`)
  assert.equal(s.setCameraMode('nope'), false)
  assert.equal(s.closeCamera(), true)
  assert.equal(s.printScreen, 'device')

  // 从 AR 第 2 步进相机：回 AR，且编辑去向也是 AR
  const t = store()
  t.openPrint()
  t.openAR()
  assert.equal(t.openARCamera(), true)
  assert.equal(t.cameraReturn, 'ar')
  assert.equal(t.editMode, 'ar')
  assert.equal(t.closeCamera(), true)
  assert.equal(t.printScreen, 'ar')

  // 拍照：提示 → 组件延迟 500ms 后进编辑器
  t.openARCamera()
  assert.equal(t.shootPhoto(), true)
  assert.equal(t.notice?.code, 'printShot')
  assert.equal(t.arCoverSelected, true, 'AR 流程里拍照即选定封面')
  assert.equal(t.enterEditorFromCamera(), true)
  assert.equal(t.printScreen, 'editor')
  assert.equal(t.editFilter, 'sunny', '回编辑器时静默复位')

  // AR 扫描：先提示，450ms 后才进播放（归档 simulateScan）
  const u = store()
  u.openPrint()
  u.openCamera()
  u.setCameraMode('scan')
  assert.equal(u.cameraPlaying, false)
  assert.equal(u.beginArScan(), true)
  assert.equal(u.notice?.code, 'printArLocked')
  assert.equal(u.cameraPlaying, false, '归档是提示之后 450ms 才播放')
  assert.equal(u.setCameraPlaying(true), true)
  assert.equal(u.cameraPlaying, true)
  assert.equal(u.setCameraMode('photo'), true)
  assert.equal(u.cameraPlaying, false, '切模式应退出播放')
})

test('AR 三步向导：门槛、播放切换、裁剪区间边界', () => {
  const s = store()
  s.openPrint()
  assert.equal(s.openAR(), true)
  assert.equal(s.printScreen, 'ar')
  assert.equal(s.arStep, 1)
  assert.equal(s.arVideoSelected, false)
  assert.equal(s.arCoverSelected, false)
  assert.equal(s.arNextEnabled, false)
  assert.equal(s.arNextLabel, 'arNextVideo')
  assert.equal(s.nextARStep(), false, '没选视频不得进第 2 步')
  assert.equal(s.arStep, 1)

  assert.equal(s.selectArVideo(), true)
  assert.equal(s.notice?.code, 'printVideoPicked')
  assert.equal(s.arNextEnabled, true)
  assert.equal(s.arNextLabel, 'arNextPhoto')
  assert.equal(s.nextARStep(), true)
  assert.equal(s.arStep, 2)

  assert.equal(s.arNextEnabled, false, '第 2 步必须先选照片')
  assert.equal(s.arNextLabel, 'arNextNeedPhoto')
  assert.equal(s.nextARStep(), false)

  assert.equal(s.changeArVideo(), true)
  assert.equal(s.arVideoSelected, false, '归档「重新选择视频」会退回未选状态')
  assert.equal(s.selectArVideo(), true)

  assert.equal(s.selectArCover('p3'), true)
  assert.equal(s.selectedPhotoId, 'p3')
  assert.equal(s.arCoverSelected, true)
  assert.equal(s.selectArCover('不存在'), false)
  assert.equal(s.arNextLabel, 'arNextEdit')
  assert.equal(s.nextARStep(), true)
  assert.equal(s.printScreen, 'editor', '第 2 步 → 完整照片编辑器')
  assert.equal(s.editMode, 'ar')

  assert.equal(s.confirmEditor(), true)
  assert.equal(s.arStep, 3)
  assert.equal(s.printScreen, 'ar')
  assert.equal(s.arNextLabel, 'arConfirm')
  assert.equal(s.arNextEnabled, true)
  assert.equal(s.nextARStep(), true, '第 3 步 → 开始 AR 打印')
  assert.equal(s.printModalOpen, true)
  assert.equal(s.queueKind, 'ar')
  assert.equal(s.notice?.code, 'printArStarted')

  // 播放切换
  assert.equal(s.toggleArPlay(), true)
  assert.equal(s.arVideoPlaying, true)
  assert.equal(s.notice?.code, 'printVideoPlaying')
  assert.equal(s.toggleArPlay(), true)
  assert.equal(s.notice?.code, 'printVideoPaused')

  // 裁剪区间
  assert.equal(s.setArTrim(6, 12), true)
  assert.deepEqual([s.arTrimStart, s.arTrimEnd], [6, 12])
  assert.equal(s.arTrimSeconds, 6)
  assert.equal(s.setArTrim(12, 6), true, '两端反了应自动归一')
  assert.deepEqual([s.arTrimStart, s.arTrimEnd], [6, 12])
  assert.equal(s.setArTrim(4, 4.5), false, '不足 1 秒应被拒')
  assert.equal(s.setArTrim(0, 99), true)
  assert.deepEqual([s.arTrimStart, s.arTrimEnd], [0, 18], '右端应被夹到视频时长')
  assert.equal(s.setArTrim('x', 5), false)

  assert.equal(s.closeAR(), true)
  assert.equal(s.printScreen, 'device')
})

test('AR 底部按钮的五档文案键都能在归档语义里走到', () => {
  const s = store()
  const codes = new Set()
  s.openPrint()
  s.openAR()
  codes.add(s.arNextLabel)
  s.selectArVideo()
  codes.add(s.arNextLabel)
  s.nextARStep()
  codes.add(s.arNextLabel)
  s.selectArCover('p1')
  codes.add(s.arNextLabel)
  s.nextARStep()
  s.confirmEditor()
  codes.add(s.arNextLabel)
  assert.equal(codes.size, 5, `归档 5 档文案应都覆盖到，实得 ${[...codes].join(', ')}`)
})

test('打印域不污染设备域：打印全流程走完，设备目录逐字不变', () => {
  const s = store()
  const before = JSON.stringify(s.devices)
  s.openPrint()
  s.pickGalleryPhoto('p3')
  s.setEditFilter('mono')
  s.addToQueue()
  s.startPrint('photo')
  for (let i = 0; i < 200; i += 1) s.tickPrint()
  s.finishPrint()
  assert.equal(JSON.stringify(s.devices), before, '打印流程不得改动任何设备状态')
  assert.equal(s.devices.length, 4) // 四份归档的并集：风扇 / 口袋打印机 / 录音充电宝 / AI Mori
})

test('打印机用到的提示码在三语里都有词条（防止改名 / 改文案后静默无提示）', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  const storeSrc = read('src/stores/aiMateStore.js')
  const flowSrc = read('src/components/apps/aimate/PrinterFlow.vue')

  // 只扫打印域：从 `口袋打印机（归档语义）` 那段开始到文件尾
  const from = storeSrc.indexOf('/* ---------------- 口袋打印机（归档语义） ---------------- */')
  assert.ok(from > 0, '找不到打印域的分节标记')
  const scanned = storeSrc.slice(from) + '\n' + flowSrc

  const codes = new Set()
  // 先剔除 `kind === 'ar'` / `x !== 'y'` 这类比较串，否则会把比较值误当提示码
  const noCmp = scanned.replace(/[!=]==\s*'[^']*'/g, '')
  // `notice = { code: 'x' }` 与三元形式 `code: cond ? 'a' : 'b'`
  for (const m of noCmp.matchAll(/code:\s*([^,}\n]+)/g)) {
    for (const q of m[1].matchAll(/'([A-Za-z0-9_]+)'/g)) codes.add(q[1])
  }
  // 组件里的 `mate.toast('x')`
  for (const m of noCmp.matchAll(/toast\(\s*'([A-Za-z0-9_]+)'/g)) codes.add(m[1])
  // 组件里三元写法 `mate.toast(a === 'x' ? 'A' : 'B')` 的多档也要扫到
  for (const m of noCmp.matchAll(/toast\(\s*\(?[^)]*?\)?\s*\)/g)) {
    for (const q of m[0].matchAll(/'([A-Za-z0-9_]+)'/g)) {
      if (q[1] !== 'start' && q[1] !== 'end') codes.add(q[1])
    }
  }

  assert.ok(codes.size >= 20, `打印域的提示码只有 ${codes.size} 个，扫描规则可能失效了`)
  for (const loc of ['zh', 'en', 'bn']) {
    for (const c of codes) {
      const hit = AIMATE[loc]?.notice?.[c]
      assert.ok(hit, `${loc} 缺 notice.${c}`)
      if (c === 'printQueueFull') {
        assert.ok(String(hit).includes('{n}'), `${loc} 的 notice.${c} 丢了 {n} 占位符`)
      }
    }
  }
})

test('词条守卫：printer 段三语键集合一致，album-tabs 的四组齐备', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  const keysOf = (loc) => Object.keys(AIMATE[loc].printer).sort()
  const base = keysOf('zh')
  for (const loc of ['en', 'bn']) {
    assert.deepEqual(keysOf(loc), base, `${loc} 的 printer 键与 zh 不一致`)
  }
  for (const loc of ['zh', 'en', 'bn']) {
    for (const g of PHOTO_GROUPS) {
      assert.ok(AIMATE[loc].printer.group?.[g], `${loc} 缺 printer.group.${g}`)
    }
    // 归档编辑器 5 个工具面板各自都有标题（工具条用小字号标签，面板头用全称）
    for (const t of EDIT_TOOLS) {
      assert.ok(AIMATE[loc].printer.tool?.[t], `${loc} 缺 printer.tool.${t}`)
      assert.ok(AIMATE[loc].printer.toolTitle?.[t], `${loc} 缺 printer.toolTitle.${t}`)
    }
    for (const c of EDIT_CROPS) assert.ok(AIMATE[loc].printer.crop?.[c], `${loc} 缺 printer.crop.${c}`)
    for (const l of EDIT_LAYOUTS) assert.ok(AIMATE[loc].printer.layout?.[l], `${loc} 缺 printer.layout.${l}`)
    for (const f of EDIT_FRAMES) assert.ok(AIMATE[loc].printer.frame?.[f], `${loc} 缺 printer.frame.${f}`)
    for (const f of PRINT_FILTERS) assert.ok(AIMATE[loc].printer.filter?.[f], `${loc} 缺 printer.filter.${f}`)
  }
})


/* ============================================================================
 * 归档「五屏添加流程」域
 * 权威实现：~/Downloads/AI Mate归档/tOS Prototype_aimate_fan.html
 *           （构建产物，scoped CSS `data-v-1f88e91e`，225 行）
 * 这些断言是「归档契约」：数值来自归档实测，改动前先回归档复核。
 * ==========================================================================*/

test('归档契约 · PAGES = 7 页，首项 home', () => {
  assert.deepEqual(PAGES, ['home', 'add', 'guide', 'search', 'center', 'control', 'info'])
})

test('gotoPage 只接受 PAGES 里的页；非法值不改状态也不报错', () => {
  const s = store()
  assert.equal(s.page, 'home')
  for (const p of PAGES) {
    assert.equal(s.gotoPage(p), true, `${p} 应可切`)
    assert.equal(s.page, p)
  }
  assert.equal(s.gotoPage('settings'), false)
  assert.equal(s.page, 'info', '非法页不得改变当前页')
  assert.equal(s.gotoPage(null), false)
  assert.equal(s.gotoPage(undefined), false)
})

test('DEVICE_MODELS 覆盖全部 10 个类别，字段齐备且 subKey 可查', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  const ids = DEVICE_TYPES.map((t) => t.id).sort()
  assert.deepEqual(Object.keys(DEVICE_MODELS).sort(), ids, '每个类别都要有可配对型号')
  for (const [type, list] of Object.entries(DEVICE_MODELS)) {
    assert.ok(list.length >= 1, `${type} 至少一个型号`)
    for (const m of list) {
      assert.match(m.code, /^[A-Za-z0-9-]+$/, `${type} 型号码「${m.code}」形状异常`)
      assert.ok(m.model, `${m.code} 缺 model`)
      assert.ok(m.subKey, `${m.code} 缺 subKey`)
      for (const loc of ['zh', 'en', 'bn']) {
        assert.ok(AIMATE[loc]?.modelSub?.[m.subKey], `${loc} 缺 modelSub.${m.subKey}`)
        assert.ok(String(AIMATE[loc].modelSub[m.subKey]).trim().length > 0)
      }
    }
  }
})

test('归档风扇给了 2 个型号（DAEWOO-Fan-A1 无叶 / A2 循环），顺序不可换', () => {
  assert.deepEqual(DEVICE_MODELS.fan.map((m) => m.code), ['DAEWOO-Fan-A1', 'DAEWOO-Fan-A2'])
  assert.deepEqual(DEVICE_MODELS.fan.map((m) => m.subKey), ['noBlade', 'circulator'])
})

test('配对 3 步文案三语齐备（归档：通电 → 长按配对键 → 点开始连接）', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  assert.deepEqual(PAIR_STEPS, ['power', 'pairKey', 'tapConnect'])
  for (const step of PAIR_STEPS) {
    for (const loc of ['zh', 'en', 'bn']) {
      const v = AIMATE[loc]?.pairStep?.[step]
      assert.ok(v && String(v).trim().length > 0, `${loc} 缺 pairStep.${step}`)
    }
  }
})

test('风速上限与归档一致（12 档），控制页点阵据此渲染', () => {
  assert.equal(FAN_SPEED_MAX, 12, '归档控制页 12 档风速')
})

test('归档 8 类打头（风扇第一），集成进来的 3 台设备只能排在它们之后', () => {
  assert.deepEqual(
    DEVICE_TYPES.slice(0, 8).map((t) => t.id),
    ['fan', 'tws', 'glasses', 'bulbs', 'infrared', 'locks', 'socket', 'watch']
  )
  assert.deepEqual(DEVICE_TYPES.slice(8).map((t) => t.id), ['recorder', 'printer', 'mori'])
})

test('类别配色逐条对齐归档内联 style（8 类，错一个颜色就算回归）', () => {
  const ARCHIVE = {
    fan: ['#DCFCE7', '#16A34A'], tws: ['#E0F2FE', '#0284C7'],
    glasses: ['#F3E8FF', '#9333EA'], bulbs: ['#FEF3C7', '#D97706'],
    infrared: ['#FEE2E2', '#DC2626'], locks: ['#E5E7EB', '#374151'],
    socket: ['#DBEAFE', '#2563EB'], watch: ['#FCE7F3', '#DB2777']
  }
  for (const [id, [bg, color]] of Object.entries(ARCHIVE)) {
    const t = DEVICE_TYPES.find((x) => x.id === id)
    assert.ok(t, `缺类别 ${id}`)
    assert.equal(t.bg.toUpperCase(), bg, `${id} 底色`)
    assert.equal(t.color.toUpperCase(), color, `${id} 前景色`)
  }
})

/* ---------- 五屏路由 ---------- */

test('五屏路由：home → add → guide → search → center → control', () => {
  const s = store()
  assert.equal(s.openAdd(), true)
  assert.equal(s.page, 'add')
  assert.equal(s.addType, null, '刚进 add 页不应带着上一轮的类别')

  assert.equal(s.pickType('fan'), true)
  assert.equal(s.page, 'guide')
  assert.equal(s.addModelIndex, 0, '默认选中第一个型号')

  assert.equal(s.pickModel(1), true)
  assert.equal(s.addModelIndex, 1)
  assert.equal(s.startSearch(), true)
  assert.equal(s.page, 'search')
  assert.equal(s.scanState, 'searching', '进搜索页先呈「正在搜索」，结果由组件延迟后喂进来')
  assert.deepEqual(s.found, [], '搜索中不应先有结果')

  assert.equal(s.foundDevices(), true)
  assert.equal(s.scanState, 'found')
  assert.equal(s.found.length, 1, '归档实测只搜到 1 台')
  assert.equal(s.found[0].code, 'DAEWOO-Fan-A2', '搜到的必须是所选型号')

  assert.equal(s.beginLink(), true)
  assert.equal(s.page, 'center')
  assert.equal(s.linkState, 'connecting')

  assert.equal(s.linkSuccess(), true)
  assert.equal(s.linkState, 'success')

  assert.equal(s.enterDevice(), true)
  assert.equal(s.page, 'control')
})

test('pickType / pickModel 的越界与非法输入一律拒绝且不回退页面', () => {
  const s = store()
  s.openAdd()
  assert.equal(s.pickType('nope'), false)
  assert.equal(s.pickType(null), false)
  assert.equal(s.page, 'add', '非法类别不得跳页')
  assert.equal(s.addType, null)

  s.pickType('fan')
  assert.equal(s.pickModel(-1), false)
  assert.equal(s.pickModel(2), false, '风扇只有 2 个型号，下标 2 越界')
  assert.equal(s.pickModel(1.4), true, '非整数下标应取整后接受（1.4 → 1）')
  assert.equal(s.addModelIndex, 1)
  assert.equal(s.pickModel('x'), false)
})

test('openAdd 复位上一轮的选择（类别/型号/扫描状态一起清）', () => {
  const s = store()
  s.openAdd(); s.pickType('bulbs'); s.startSearch(); s.foundDevices()
  assert.equal(s.found.length, 1)
  s.back(); s.back()                       // search → guide → add
  assert.equal(s.page, 'add')
  s.openAdd()                              // 再点一次 banner
  assert.equal(s.addType, null)
  assert.equal(s.addModelIndex, 0)
  assert.equal(s.scanState, 'searching')
  assert.deepEqual(s.found, [])
  assert.equal(s.linkState, 'connecting')
})

test('beginLink 没搜到结果时不放行（防止空候选进连接页）', () => {
  const s = store()
  s.openAdd(); s.pickType('fan'); s.startSearch()
  assert.equal(s.page, 'search')
  assert.equal(s.beginLink(), false)
  assert.equal(s.page, 'search', '无候选时不得进 center')
})

test('enterDevice 没候选时不放行', () => {
  const s = store()
  assert.equal(s.enterDevice(), false)
  assert.equal(s.page, 'home')
})

/* ---------- 「添加设备」必须真的新增设备 ---------- */

test('🔴 走完五屏后目录里真的多了一台（而不是只把已有项选中）', () => {
  const s = store()
  const before = s.devices.length
  s.openAdd(); s.pickType('fan'); s.startSearch(); s.foundDevices()
  s.beginLink(); s.linkSuccess(); s.enterDevice()
  assert.equal(s.devices.length, before + 1, '配完必须新增一台')
  const d = s.getDevice(s.activeDeviceId)
  assert.ok(d, '新设备要能被 getDevice 查到')
  assert.equal(d.id, 'FOUND-DAEWOO-Fan-A1', '候选 id 加 FOUND- 前缀，避免与目录预置项撞车')
  assert.equal(d.type, 'fan')
  assert.equal(d.online, true)
  assert.match(d.mac, /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/, '新设备也要有合法 MAC')
})

test('新增的风扇带齐控制域字段（否则控制页会读到 undefined）', () => {
  const s = store()
  s.openAdd(); s.pickType('fan'); s.startSearch(); s.foundDevices()
  s.beginLink(); s.linkSuccess(); s.enterDevice()
  const d = s.getDevice(s.activeDeviceId)
  for (const k of ['power', 'speed', 'mode', 'swing', 'swingAngle', 'timerOff', 'timerOn', 'plasma', 'childLock', 'temp']) {
    assert.ok(k in d, `新风扇缺字段 ${k}`)
  }
  assert.equal(s.toggleFanPower(d.id), true, '新设备必须能被控制页的 action 操作')
})

test('同型号配第 2 台时显示名加台号，不与已有设备重名', () => {
  const s = store()
  // 🔴 全程走真实流程（不再手改 found[0].id 绕开查重）：
  // 早前 `foundDevices()` 恒发同一个 id，第 2 次配对会静默命中第 1 台，
  // 这条只能靠伪造 id 才能验到台号逻辑 ⇒ 缺陷被测试掩盖。
  const pairOne = () => {
    s.openAdd(); s.pickType('fan'); s.startSearch(); s.foundDevices()
    s.beginLink(); s.linkSuccess(); s.enterDevice()
    return s.getDevice(s.activeDeviceId)
  }
  const n0 = s.devices.length
  const a = pairOne()
  const b = pairOne()
  assert.equal(s.devices.length, n0 + 2, '同一型号必须能配第 2 台')
  assert.notEqual(a.id, b.id, '第 2 台要有自己的 id，否则会覆盖/命中第 1 台')
  assert.equal(a.name, 'DAEWOO-Fan-A1 (2)', '目录已预置 DAEWOO-Fan-A1，新配的第一台带台号')
  assert.equal(b.name, 'DAEWOO-Fan-A1 (3)', '第 2 台继续往后编号')
  const names = s.devices.map((x) => x.name)
  assert.equal(new Set(names).size, names.length, '设备名不得重复')
})

test('反复点「进入设备」不会把同一台设备加两遍', () => {
  const s = store()
  s.openAdd(); s.pickType('fan'); s.startSearch(); s.foundDevices()
  s.beginLink(); s.linkSuccess(); s.enterDevice()
  const n = s.devices.length
  assert.equal(s.enterDevice(), true)
  assert.equal(s.enterDevice(), true)
  assert.equal(s.devices.length, n, '重复进入应只是重新选中')
  assert.equal(s.page, 'control')
})

test('连点「开始连接」把 `foundDevices` 触发两次，仍只算同一台候选', () => {
  // 组件的 `later()` 不做取消 ⇒ 双击会排两个定时器、`foundDevices()` 跑两次。
  // id 是按「下一个空闲编号」现算的，配对前目录没变 ⇒ 两次算出同一个 id。
  const s = store()
  s.openAdd(); s.pickType('fan'); s.startSearch()
  s.foundDevices()
  const firstId = s.found[0].id
  s.foundDevices()
  assert.equal(s.found[0].id, firstId, '重复的搜索到达不能改变候选 id')
  s.beginLink(); s.linkSuccess(); s.enterDevice()
  assert.equal(s.getDevice(firstId).name, 'DAEWOO-Fan-A1 (2)')
})

test('集成进来的 2 台（录音充电宝 / 口袋打印机）也走得通添加流程', () => {
  for (const [type, code] of [['recorder', 'AM-Recorder-01'], ['printer', 'AM-Printer-01']]) {
    const s = store()
    const before = s.devices.length
    s.openAdd(); s.pickType(type); s.startSearch()
    assert.equal(s.found.length, 0, '搜索中不该先有结果')
    s.foundDevices()
    assert.equal(s.found[0].code, code, `${type} 搜到的型号`)
    s.beginLink(); s.linkSuccess(); s.enterDevice()
    assert.equal(s.devices.length, before + 1, `${type} 配完应新增一台`)
    assert.equal(s.getDevice(s.activeDeviceId).type, type)
  }
})

/* ---------- 返回链路 ---------- */

test('back() 层级回退：control→home，search→guide→add→home；详情页跟着来路走', () => {
  const s = store()
  // 详情页的返回目标由 infoFrom 决定：默认（未设）回首页 —— 首页卡片 `···` 就是这条路
  s.gotoPage('info'); assert.equal(s.back(), true); assert.equal(s.page, 'home')

  // 控制页那条路：openInfo() 会把 infoFrom 记成 control
  s.openControl('DAEWOO-Fan-A1'); s.openInfo()
  assert.equal(s.back(), true); assert.equal(s.page, 'control')
  assert.equal(s.back(), true); assert.equal(s.page, 'home')

  s.openAdd(); s.pickType('fan'); s.startSearch()
  assert.equal(s.back(), true); assert.equal(s.page, 'guide')
  assert.equal(s.back(), true); assert.equal(s.page, 'add')
  assert.equal(s.back(), true); assert.equal(s.page, 'home')
})

test('back() 在 center 页退回 search（连接中也可能想反悔）', () => {
  const s = store()
  s.openAdd(); s.pickType('fan'); s.startSearch(); s.foundDevices(); s.beginLink()
  assert.equal(s.page, 'center')
  assert.equal(s.back(), true)
  assert.equal(s.page, 'search')
})

test('back() 优先消费浮层，再退页面（否则浮层开着会先跳页）', () => {
  const s = store()
  s.gotoPage('control')
  s.openTimerSheet('timerOff')
  assert.equal(s.back(), true); assert.equal(s.timerSheet, null)
  assert.equal(s.page, 'control', '关浮层不应顺带跳页')
  s.openRename()
  assert.equal(s.back(), true); assert.equal(s.renaming, false)
  assert.equal(s.page, 'control')
  s.openDeleteConfirm()
  assert.equal(s.back(), true); assert.equal(s.confirmDelete, false)
  assert.equal(s.page, 'control')
})

test('back() 在首页返回 false，交给系统去处理（回桌面）', () => {
  const s = store()
  assert.equal(s.page, 'home')
  assert.equal(s.back(), false)
})

/* ---------- 详情页 / 删除 ---------- */

test('openControl 只认存在的设备；openInfo 从控制页进详情，返回目标是控制页', () => {
  const s = store()
  assert.equal(s.openControl('AM-Printer-01'), true)
  assert.equal(s.activeDeviceId, 'AM-Printer-01')
  assert.equal(s.page, 'control')
  assert.equal(s.openControl('没有这台'), false)
  assert.equal(s.activeDeviceId, 'AM-Printer-01', '非法 id 不得改选中项')
  assert.equal(s.openInfo(), true)
  assert.equal(s.page, 'info')
  assert.equal(s.infoFrom, 'control', '从控制页进详情，返回应回控制页')
  assert.equal(s.back(), true)
  assert.equal(s.page, 'control')
})

test('openTimerSheet 只认 timerOff / timerOn', () => {
  const s = store()
  assert.equal(s.openTimerSheet('timerOff'), true)
  assert.equal(s.timerSheet, 'timerOff')
  assert.equal(s.openTimerSheet('timerOn'), true)
  assert.equal(s.closeTimerSheet(), true)
  assert.equal(s.timerSheet, null)
  assert.equal(s.openTimerSheet('timer'), false)
  assert.equal(s.timerSheet, null)
})

test('confirmRemove 删除当前设备并回首页，选中项顺移', () => {
  const s = store()
  s.openControl('AM-Recorder-01')
  const before = s.devices.length
  s.openDeleteConfirm()
  assert.equal(s.confirmDelete, true)
  assert.equal(s.confirmRemove(), true)
  assert.equal(s.devices.length, before - 1)
  assert.equal(s.getDevice('AM-Recorder-01'), null)
  assert.equal(s.page, 'home')
  assert.notEqual(s.activeDeviceId, 'AM-Recorder-01', '选中项必须顺移，不能指向已删设备')
})

test('删到一台不剩时选中项置 null（首页空状态）', () => {
  const s = store()
  const ids = s.devices.map((d) => d.id)
  for (const id of ids.slice(1)) s.removeDevice(id)
  s.activeDeviceId = ids[0]
  s.openDeleteConfirm()
  assert.equal(s.confirmRemove(), true)
  assert.equal(s.devices.length, 0)
  assert.equal(s.activeDeviceId, null)
  assert.equal(s.page, 'home')
})

test('confirmRemove 在没有可删设备时返回 false，只关浮层不跳页', () => {
  const s = store()
  s.openControl('AM-Recorder-01')
  s.activeDeviceId = '不存在'          // 模拟「选中项已被别处删掉」
  s.openDeleteConfirm()
  assert.equal(s.confirmRemove(), false)
  assert.equal(s.confirmDelete, false, '确认框照常关闭')
  assert.equal(s.page, 'control', '删除失败不得跳页')
})

test('归档控制页文案键齐备（三语），控制页不会渲染出 undefined', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  const KEYS = [
    'powerOn', 'powerOff', 'speedTitle', 'speedValue', 'modeTitle',
    'swing', 'timerOff', 'timerOn', 'notSet', 'plasma', 'plasmaOff', 'plasmaOn',
    'more', 'childLock', 'manual', 'firmware'
  ]
  for (const loc of ['zh', 'en', 'bn']) {
    for (const k of KEYS) {
      const v = AIMATE[loc]?.control?.[k]
      assert.ok(v && String(v).trim().length > 0, `${loc} 缺 control.${k}`)
    }
    assert.ok(String(AIMATE[loc].control.speedValue).includes('{n}'), `${loc} 的档位回显需要 {n} 占位`)
    assert.ok(String(AIMATE[loc].control.speedValue).includes('{max}'), `${loc} 的档位回显需要 {max} 占位`)
    for (const k of ['title', 'mac', 'firmwareVer', 'rename', 'delete', 'cancel', 'save', 'deleteTitle', 'deleteBody', 'renamePlaceholder']) {
      assert.ok(AIMATE[loc]?.info?.[k], `${loc} 缺 info.${k}`)
    }
  }
})

test('归档五屏文案键齐备（三语），流程中途不会缺字', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  const KEYS = [
    'addTitle', 'addDeviceTitle', 'scanNearby', 'scanNearbySub', 'scanning', 'scanningSub',
    'scanHelp', 'scanHelpLink', 'manualAdd', 'selectModel', 'pairTitle', 'startConnect',
    'searchTitle', 'searchSearching', 'searchSub', 'found', 'signalStrong', 'connect',
    'connecting', 'success', 'successSub', 'enterDevice'
  ]
  for (const loc of ['zh', 'en', 'bn']) {
    for (const k of KEYS) {
      const v = AIMATE[loc]?.flow?.[k]
      assert.ok(v && String(v).trim().length > 0, `${loc} 缺 flow.${k}`)
    }
  }
})

test('notice 码表覆盖 store 全部赋值点，且三语键集一致', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  const src = read('src/stores/aiMateStore.js')
  const used = new Set()
  for (const m of src.matchAll(/notice = \{ code: '([A-Za-z]+)'/g)) used.add(m[1])
  for (const m of src.matchAll(/\{ code: '([A-Za-z]+)'/g)) used.add(m[1])
  const zh = Object.keys(AIMATE.zh.notice).sort()
  const en = Object.keys(AIMATE.en.notice).sort()
  const bn = Object.keys(AIMATE.bn.notice).sort()
  assert.deepEqual(en, zh, 'notice 的 en 键集必须与 zh 完全一致')
  assert.deepEqual(bn, zh, 'notice 的 bn 键集必须与 zh 完全一致')
  for (const c of used) assert.ok(zh.includes(c), `store 会抛 notice.${c}，但三语里没有这个键`)
  assert.ok(used.size >= 10, `只认出 ${used.size} 个 notice 码，正则可能没跟上代码`)
})


/* ================= 底部 Tab / 首页卡片直达（四份归档取并集后的导航） ================= */

test('setTab 只认 home / mine，切 Tab 时把子页与浮层一并复位', () => {
  const s = store()
  assert.equal(s.tab, 'home', '默认在首页')
  assert.equal(s.setTab('mine'), true)
  assert.equal(s.tab, 'mine')

  s.gotoPage('info')
  s.openTimerSheet('timerOff')
  assert.equal(s.setTab('mine'), true, '切 Tab 必须离开子页，否则会停在半路的流程里')
  assert.equal(s.page, 'home')
  assert.equal(s.timerSheet, null)

  assert.equal(s.setTab('add'), false, '非白名单值不得改 Tab')
  assert.equal(s.tab, 'mine')
})

test('openDevice 直达功能页：风扇进控制页，其余三台直接进各自流程（无中间页）', () => {
  const s = store()

  assert.equal(s.openDevice('DAEWOO-Fan-A1'), true)
  assert.equal(s.page, 'control', '风扇的功能页就是控制页')
  assert.equal(s.printScreen, null)

  assert.equal(s.openDevice('AM-Printer-01'), true)
  assert.equal(s.printScreen, 'device', '打印机卡直达设备页（首屏，无中间页）')
  assert.equal(s.deviceFlow, null)
  s.closePrint()

  assert.equal(s.openDevice('AM-Recorder-01'), true)
  assert.equal(s.deviceFlow, 'recorder')
  s.closeDeviceFlow()

  assert.equal(s.openDevice('AM-Mori-01'), true)
  assert.equal(s.deviceFlow, 'mori')
  s.closeDeviceFlow()

  assert.equal(s.openDevice('没有这台'), false, '未知设备不得改变任何状态')
})

test('详情页返回目标跟着来路走：首页卡片 `···` → 首页；控制页 `···` → 控制页', () => {
  const s = store()
  assert.equal(s.openInfoOf('AM-Printer-01'), true)
  assert.equal(s.activeDeviceId, 'AM-Printer-01')
  assert.equal(s.page, 'info')
  assert.equal(s.infoFrom, 'home')
  assert.equal(s.back(), true)
  assert.equal(s.page, 'home', '从首页进来的详情，返回必须回首页')

  assert.equal(s.openInfoOf('没有这台'), false)

  s.openControl('DAEWOO-Fan-A1')
  s.openInfo()
  assert.equal(s.infoFrom, 'control')
  assert.equal(s.back(), true)
  assert.equal(s.page, 'control', '从控制页进来的详情，返回必须回控制页')
})

test('back() 在「我的」Tab 上先回首页，再交给系统回桌面', () => {
  const s = store()
  s.setTab('mine')
  assert.equal(s.back(), true)
  assert.equal(s.tab, 'home')
  assert.equal(s.back(), false, '首页再返回应交给系统')
})

test('「其他设备」= 两份 Demo 的并集（手表 / 耳机 / 眼镜），文案全走 i18n 键', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  assert.equal(OTHER_DEVICES.length, 3)
  assert.deepEqual(OTHER_DEVICES.map((o) => o.id), ['AI-Watch-S2', 'AI-Buds-Pro', 'AI-Glass'])

  // 眼镜是唯一「未连接」的一台（归档两份 Demo 都把它标成未连接）
  assert.equal(OTHER_DEVICES.filter((o) => !o.online).length, 1)
  assert.equal(OTHER_DEVICES.find((o) => !o.online).id, 'AI-Glass')

  for (const o of OTHER_DEVICES) {
    assert.ok(DEVICE_TYPES.some((t) => t.id === o.type), `${o.id} 的 type 必须在统一目录里`)
    for (const loc of ['zh', 'en', 'bn']) {
      for (const k of [o.nameKey, o.modelKey, o.metaKey]) {
        const v = k.split('.').reduce((a, p) => (a ? a[p] : undefined), AIMATE[loc])
        assert.ok(v && String(v).trim().length > 0, `${loc} 缺 ${k}`)
      }
    }
  }
})

test('notifyOther 只回一条 toast，参数是 i18n 键（store 不持有文案）', () => {
  const s = store()
  assert.equal(s.notifyOther('AI-Watch-S2'), true)
  assert.equal(s.notice.code, 'deviceStatus')
  assert.equal(s.notice.params.nameKey, 'other.watch')
  assert.equal(s.notice.params.metaKey, 'other.watchMeta')
  assert.equal(s.notifyOther('不存在'), false)
})

test('「其他设备」卡：模板照归档 `.other-device-card` 在位 + 字号不低于 12px', () => {
  const src = read('src/components/apps/aimate/AimateApp.vue')
  for (const cls of ['device-wall', 'device-stack', 'other-device-card', 'large-visual',
    'large-device-copy', 'add-device-card', 'add-orb', 'row-chevron',
    'watch-shape', 'buds-shape', 'glasses-shape']) {
    assert.ok(src.includes(cls), `「其他设备」卡缺 ${cls}（归档 .device-wall / .other-device-card 结构）`)
  }
  // 类名出现在模板里还不够 —— 样式表规则本体也必须在（只删 CSS 规则同样得红）
  for (const sel of ['.device-wall {', '.device-stack {', '.other-device-card {',
    '.large-visual {', '.add-device-card {', '.add-orb {',
    '.watch-shape {', '.buds-shape {', '.glasses-shape {']) {
    assert.ok(src.includes(sel), `样式表缺规则 ${sel}`)
  }
  // 归档关键规格逐值照抄：改小/改没都得红
  const between = (a, b) => src.slice(src.indexOf(a), src.indexOf(b))
  const cardRule = between('.other-device-card {', '.other-device-card:after')
  for (const v of ['min-height: 128px', 'border-radius: 21px', 'padding: 16px 17px', 'gap: 15px']) {
    assert.ok(cardRule.includes(v), `.other-device-card 缺归档规格 ${v}`)
  }
  const shadeRule = between('.other-device-card:after', '.other-device-card.offline:after')
  assert.ok(shadeRule.includes('width: 115px') && shadeRule.includes('height: 115px')
    && shadeRule.includes('border-radius: 50%'), '右上角装饰圆必须是归档的 115×115 圆形')
  const visRule = between('.large-visual {', '.other-device-card.offline .large-visual')
  for (const v of ['width: 91px', 'height: 91px', 'border-radius: 20px']) {
    assert.ok(visRule.includes(v), `.large-visual 缺归档规格 ${v}`)
  }
  const watchRule = between('.watch-shape {', '.watch-shape:before')
  for (const v of ['width: 31px', 'height: 38px', 'border: 5px solid #24232a', 'transform: scale(1.45)']) {
    assert.ok(watchRule.includes(v), `.watch-shape 缺归档规格 ${v}`)
  }
  // 🔴 表带靠 `.watch-shape` 的 transform 成为包含块 + 层叠上下文，`z-index:-1` 才「局部且可见」。
  //    谁把它改成 0 或给 .watch-shape 补 position，表带就会跑到表盘前面 —— 钉死。
  const strapRule = between('.watch-shape:before, .watch-shape:after', '.watch-shape:before {')
  assert.ok(strapRule.includes('z-index: -1'), '表带伪元素必须保持 z-index: -1（见上方注释）')
  // 三套图形是 CSS 手绘形状，必须由设备 type 映射出来（归档里没有图标，只有形状）
  assert.ok(src.includes("t === 'watch' ? 'watch-shape'"), 'watch 必须映射到 .watch-shape')
  assert.ok(src.includes("'buds-shape'") && src.includes("'glasses-shape'"),
    'tws / glasses 必须映射到对应形状')
  assert.ok(!src.includes('or-art') && !src.includes('class="orow'),
    '卡片图形是 CSS 手绘形状，不得退回 LIcon 图标块')
  // 行尾箭头走本仓标准控件（归档是字符 ›）
  assert.ok(src.includes('class="row-chevron" name="chevronRight"'),
    '行尾箭头必须用 LIcon chevronRight')
  // 离线态只换「状态药丸」，不换结构
  assert.ok(src.includes('class="status-pill pending"'), '离线卡必须用 .status-pill.pending')
  assert.ok(src.includes('v-if="o.online" class="online"'), '在线卡必须用 .online 药丸')
  const i = src.indexOf('其他设备卡：照归档')
  const j = src.indexOf('.mine-head {', i)
  assert.ok(i > 0 && j > i, '找不到「其他设备」卡的样式块')
  const sizes = [...src.slice(i, j).matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]))
  assert.ok(sizes.length >= 4, `「其他设备」卡字号只扫到 ${sizes.length} 处，规则可能失效`)
  const bad = sizes.filter((n) => n < 12)
  assert.deepEqual(bad, [], `「其他设备」卡出现 <12px 字号：${bad.join(', ')}`)
})

test('首页 / 我的 新增文案键三语齐备，且插值键的占位符跨语言一致', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  const KEYS = [
    'tab.home', 'tab.mine', 'tab.aria',
    'home.addDeviceAction', 'home.summary',
    'home.otherDevices', 'home.otherSub', 'home.addNew', 'home.addNewSub',
    'deviceTitle.printer', 'deviceTitle.recorder', 'deviceTitle.mori',
    'deviceMeta.battery', 'deviceMeta.paper', 'deviceMeta.used', 'deviceMeta.shots',
    'other.watch', 'other.watchModel', 'other.watchMeta',
    'other.buds', 'other.budsModel', 'other.budsMeta',
    'other.glass', 'other.glassModel', 'other.glassMeta', 'other.notConnected',
    'mine.title', 'mine.role', 'mine.connected', 'mine.email', 'mine.plan',
    'mine.account', 'mine.notify', 'mine.notifyValue', 'mine.general', 'mine.privacy',
    'mine.help', 'mine.about', 'mine.version',
    'action.quickPrint', 'action.record', 'action.recordSub',
    'action.shoot', 'action.shootSub', 'action.enter',
    'notice.deviceStatus', 'notice.mineWip'
  ]
  for (const loc of ['zh', 'en', 'bn']) {
    for (const p of KEYS) {
      const v = p.split('.').reduce((a, k) => (a ? a[k] : undefined), AIMATE[loc])
      assert.ok(v && String(v).trim().length > 0, `${loc} 缺 ${p}`)
    }
    // 同一键三种语言必须用同一组占位符，否则切语言会漏出裸 {xxx}
    for (const k of ['home.summary', 'deviceMeta.battery', 'deviceMeta.paper', 'deviceMeta.used', 'mine.connected']) {
      const pick = (obj) => k.split('.').reduce((a, x) => (a ? a[x] : undefined), obj)
      const need = new Set((pick(AIMATE.zh).match(/\{(\w+)\}/g) || []))
      const got = new Set((pick(AIMATE[loc]).match(/\{(\w+)\}/g) || []))
      assert.deepEqual([...got].sort(), [...need].sort(), `${loc}.${k} 占位符应与 zh 一致`)
    }
  }
})

test('已删掉的首屏词条不得复活（首页顶栏 + 首屏旧结构）', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  for (const loc of ['zh', 'en', 'bn']) {
    // greeting / greetingSub 随首页顶栏（`AI Mate` 眉标 +「下午好，Ling」+ 副标题）一起删掉
    for (const k of ['title', 'subtitle', 'addTitle', 'addSub', 'catalog', 'greeting', 'greetingSub']) {
      assert.equal(AIMATE[loc].home[k], undefined, `${loc}.home.${k} 已不再被任何组件引用`)
    }
    assert.equal(AIMATE[loc].count, undefined, `${loc}.count 已不再被任何组件引用`)
    for (const k of ['connected', 'emptyTitle', 'emptySub']) {
      assert.equal(AIMATE[loc].control[k], undefined, `${loc}.control.${k} 已不再被任何组件引用`)
    }
    // other.connect 随「其他设备」离线卡重放一起删掉（归档离线卡只有行尾箭头，没有「连接」按钮）
    assert.equal(AIMATE[loc].other.connect, undefined, `${loc}.other.connect 已不再被任何组件引用`)
  }
})

test('样式表不得有完全重复的类选择器（防「新类与既有类撞名后被静默覆盖」）', () => {
  // 实测踩过：首页 hero 卡先用了 `.mh-name`，与「我的」页（mine-hero）的 `.mh-name` 撞名，
  // 后定义的那条（18px / 700 / #111）静默盖掉了归档值（20px / 780 / #fff）——
  // 页面上「设备名是灰的」，但所有文本类断言全绿，只能靠这条守卫兜住。
  const src = read('src/components/apps/aimate/AimateApp.vue')
  const style = src.slice(src.indexOf('<style scoped>'))
  // 只扫「顶层」规则头：`@media` 内的同名覆盖是合法用法（缩进不为 0）
  const pat = /^(\.[A-Za-z][\w-]*(?:(?:::?|\.)[A-Za-z][\w-]*(?:\([^)]*\))?)*)\s*\{/
  const seen = new Set()
  const dups = []
  for (const line of style.split('\n')) {
    const m = line.match(pat)
    if (!m) continue
    if (seen.has(m[1])) dups.push(m[1])
    else seen.add(m[1])
  }
  assert.ok(seen.size >= 150, `只扫到 ${seen.size} 个顶层类选择器，扫描规则可能失效`)
  assert.deepEqual(dups, [], `同文件内重复的类选择器：${dups.join(', ')}`)
})

test('首页打印机 hero 卡：归档结构在位 + 字号不低于 12px', () => {
  const src = read('src/components/apps/aimate/AimateApp.vue')
  for (const cls of ['mcard-hero', 'hp-stage', 'hp-printer', 'hp-dot', 'hp-copy',
    'hp-name', 'hp-meta', 'hp-quick']) {
    assert.ok(src.includes(cls), `hero 卡缺 ${cls}（归档首页卡结构）`)
  }
  assert.ok(src.includes('heroMeta(d)'), 'hero 副行必须走 heroMeta（归档顺序是「电量 → 相纸」）')
  assert.ok(src.includes('mate.quickPrint(d.id)'), 'hero 右下药丸必须直达快速打印')
  const i = src.indexOf('打印机卡：照归档')
  const j = src.indexOf('.hp-quick:active')
  assert.ok(i > 0 && j > i, '找不到 hero 卡的样式块')
  const sizes = [...src.slice(i, j).matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]))
  assert.ok(sizes.length >= 4, `hero 字号只扫到 ${sizes.length} 处，规则可能失效`)
  const bad = sizes.filter((n) => n < 12)
  assert.deepEqual(bad, [], `hero 卡出现 <12px 字号：${bad.join(', ')}`)
})

/* ================= AI Mori 首页卡（归档 `#home` 的 `.dev-card`） ================= */

test('AI Mori 首页卡：录像 / 录音互斥，拍照不参与（归档 toggleRec / doAction）', () => {
  const s = store()
  assert.deepEqual(s.moriRec, { video: false, audio: false }, '初始两个开关都关')

  // 归档 doAction('photo')：只发指令 + 提示条，不碰开关、不参与互斥
  assert.equal(s.moriPhoto(), true)
  assert.equal(s.notice.code, 'moriPhotoSent')
  assert.deepEqual(s.moriRec, { video: false, audio: false }, '拍照不得改动录制态')

  // 开录像
  assert.equal(s.moriToggleRec('video'), true)
  assert.deepEqual(s.moriRec, { video: true, audio: false })
  assert.equal(s.notice.code, 'moriVideoStart')

  // 开录音 ⇒ 录像被互斥关掉（归档 toggleRec 里的 other 分支）
  assert.equal(s.moriToggleRec('audio'), true)
  assert.deepEqual(s.moriRec, { video: false, audio: true }, '开录音必须关掉录像')
  assert.equal(s.notice.code, 'moriAudioStart')

  // 反向互斥
  assert.equal(s.moriToggleRec('video'), true)
  assert.deepEqual(s.moriRec, { video: true, audio: false }, '开录像必须关掉录音')

  // 关录像 ⇒ 「已保存」
  assert.equal(s.moriToggleRec('video'), false)
  assert.deepEqual(s.moriRec, { video: false, audio: false })
  assert.equal(s.notice.code, 'moriVideoSaved')

  // 关录音
  assert.equal(s.moriToggleRec('audio'), true)
  assert.equal(s.notice.code, 'moriAudioStart')
  assert.equal(s.moriToggleRec('audio'), false)
  assert.equal(s.notice.code, 'moriAudioSaved')

  // 非法 kind：必须原样返回 null 且不碰状态
  assert.equal(s.moriToggleRec('photo'), null)
  assert.equal(s.moriToggleRec(''), null)
  assert.equal(s.moriToggleRec(), null)
  assert.deepEqual(s.moriRec, { video: false, audio: false }, '非法入参不得改状态')
})

test('AI Mori 首页卡：录制态不随流程开关复位（归档从不重置 recState）', () => {
  const s = store()
  assert.equal(s.moriToggleRec('video'), true)
  assert.equal(s.openDevice('AM-Mori-01'), true)
  assert.equal(s.deviceFlow, 'mori')
  assert.equal(s.closeDeviceFlow(), true)
  assert.deepEqual(s.moriRec, { video: true, audio: false }, '关流程不得把首页卡的录制态擦掉')
  s.moriToggleRec('video')
})


test('首页卡的修饰类必须在模板 :class 里注册（样式表写了不注册 = 静默失效）', () => {
  const src = read('src/components/apps/aimate/AimateApp.vue')
  // ⚠️ 2026-10-12 修扫描规则：`.mcard-mori, .mcard-fan { … }` 是**合写选择器**。
  //    旧正则 `/^\.(mcard-[a-z]+)\s*\{/gm` 只认「行首单个选择器 + 紧跟 {」，
  //    合写后 mcard-mori 直接漏掉 ⇒ 守卫静默退化成只扫 hero / rec（实测 decl.length === 2）。
  //    改为：先取「从行首开始的选择器行」，再在该行里抓出**全部** .mcard-*（含合写与后代选择器）。
  const decl = [...new Set(
    src.split('\n')
      .filter((l) => /^[.#][^{}]*\{/.test(l))
      .flatMap((l) => [...l.matchAll(/\.(mcard-[a-z]+)\b/g)].map((m) => m[1]))
  )]
  assert.ok(decl.length >= 4, `只扫到 ${decl.length} 个 .mcard-* 修饰类，扫描规则可能失效`)
  assert.ok(['mcard-hero', 'mcard-rec', 'mcard-mori', 'mcard-fan'].every((c) => decl.includes(c)),
    `四张卡的修饰类必须都在：${decl.join(', ')}`)
  for (const c of decl) {
    assert.ok(src.includes(`'${c}':`),
      `样式表定义了 .${c}，但模板 :class 没注册它 —— 该卡会静默退回 .mcard 的基础值`)
  }
})

test('AI Mori 首页卡：模板照归档 `.dev-card` 在位 + 字号不低于 12px', () => {
  const src = read('src/components/apps/aimate/AimateApp.vue')
  for (const cls of ['mcard-mori', 'mm-main', 'mm-art', 'mm-name', 'mm-batt',
    'mm-actions', 'mm-act', 'mm-rec-dot']) {
    assert.ok(src.includes(cls), `Mori 卡缺 ${cls}（归档 .dev-card 结构）`)
  }
  for (const act of ['photo', 'video', 'audio']) {
    assert.ok(src.includes(`data-device-action="${act}"`),
      `Mori 卡缺 ${act} 动作（归档 .dev-actions 三枚等宽按钮）`)
  }
  assert.ok(src.includes("mate.moriToggleRec('video')") && src.includes("mate.moriToggleRec('audio')"),
    '录像 / 录音必须走 moriToggleRec（归档 toggleRec）')
  assert.ok(src.includes('mate.moriPhoto()'), '拍照必须走 moriPhoto（归档 doAction）')
  assert.ok(src.includes('mate.moriRec.video') && src.includes('mate.moriRec.audio'),
    '录制态必须读 store，模板里不得各持一份')
  assert.ok(src.includes("name=\"camera\""), '拍照按钮用 camera 图标（归档 📷）')
  assert.ok(src.includes("'mcard-mori': d.type === 'mori'"),
    'mori 卡必须在 :class 里注册 mcard-mori —— 只写样式表不注册，归档的圆角 16px / 零内边距全部失效')
  const i = src.indexOf('AI Mori 卡：照归档')
  const j = src.indexOf('.mm-rec-dot {', i)
  assert.ok(i > 0 && j > i, '找不到 Mori 卡的样式块')
  const sizes = [...src.slice(i, j).matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]))
  assert.ok(sizes.length >= 3, `Mori 卡字号只扫到 ${sizes.length} 处，规则可能失效`)
  const bad = sizes.filter((n) => n < 12)
  assert.deepEqual(bad, [], `Mori 卡出现 <12px 字号：${bad.join(', ')}`)
})

test('AI Mori 卡动作词条：三语各五枚齐全，notice 五条三语齐全', () => {
  const m = read('src/locales/aimate.js')
  const cards = m.split('moriCard: {').slice(1)
  assert.equal(cards.length, 3, `moriCard 应有三语各一份，实测 ${cards.length}`)
  for (const blk of cards) {
    const line = blk.split('}')[0]
    for (const k of ['photo:', 'video:', 'audio:', 'videoOn:', 'audioOn:']) {
      assert.ok(line.includes(k), `moriCard 缺 ${k} → ${line}`)
    }
  }
  for (const k of ['moriPhotoSent', 'moriVideoStart', 'moriAudioStart',
    'moriVideoSaved', 'moriAudioSaved']) {
    const n = m.split(`${k}:`).length - 1
    assert.equal(n, 3, `notice.${k} 应有三语，实测 ${n}`)
  }
})

test('AimateApp 模板不再引用已删词条 / 已删类名（防回归）', () => {
  const src = read('src/components/apps/aimate/AimateApp.vue')
  for (const bad of ["am('home.title')", "am('home.subtitle')", "am('home.addTitle')",
    "am('home.catalog')", "am('control.emptyTitle')", "am('control.connected')",
    'class="banner', 'empty-state',
    // 旧风扇卡（`.mc-fan` / `.mf-*`）已按归档整体删除 —— 这套类名不得复活
    'mc-fan', 'mf-info', 'mf-label', 'mf-value', 'mf-switch', 'mf-knob',
    // 旧「其他设备」行（`.orow` / `.or-*` / `.add-art`）已按归档换成 `.other-device-card`
    'orow', 'or-art', 'add-art', 'or-copy', 'or-status', 'or-name', 'or-meta', 'or-tail']) {
    assert.ok(!src.includes(bad), `AimateApp 仍引用 ${bad}`)
  }
  // 底部 Tab 与首页三段结构必须在
  assert.ok(src.includes('FloatingTabBar'), '首页必须挂底部 Tab（本仓惯例组件）')
  assert.ok(src.includes("data-device-card"), '首页必须有设备卡')
  assert.ok(src.includes('data-other'), '首页必须有「其他设备」行')
  assert.ok(src.includes('data-mine-row'), '必须新增「我的」页')
  assert.ok(src.includes("mate.openDevice(d.id)"), '设备卡必须直达功能页')
})


/* ================= 控制页「风速档位」（改用首页卡的档位条设计） ================= */

test('控制页「风速档位」用首页卡的档位条设计，旧圆形滑轨不得复活', () => {
  const src = read('src/components/apps/aimate/AimateApp.vue')
  // ⚠️ 不能只查全文件 includes('dc-gear-seg') —— 首页风扇卡本身就有这个类，
  //    控制页哪怕原样退回旧滑轨也照样「通过」。必须**切到控制页那张卡内部**再断言。
  const i = src.indexOf('class="speed-head"')
  const j = src.indexOf('control.modeTitle', i)
  assert.ok(i > 0 && j > i, '找不到控制页「风速档位」卡片块（.speed-head → 模式卡）')
  const block = src.slice(i, j)
  for (const need of ['class="dc-gear-track" data-speed-track', 'class="dc-gear-seg"',
    ':data-speed-seg="n"', 'class="dc-gear-value"', 'data-speed-label',
    "mate.setFanSpeed(dev.id, n)", 'class="card-title"']) {
    assert.ok(block.includes(need), `控制页档位卡内缺 ${need}`)
  }
  // 旧圆形滑轨整体删除（⚠️ 必须带前导点：`data-speed-track` 里含 `speed-track` 子串，
  // 直接 includes('speed-track') 会被自己的钩子名误伤）
  for (const bad of ['.speed-dot', '.speed-fill', '.speed-slider', '.speed-steps', '.speed-track']) {
    assert.ok(!src.includes(bad), `旧滑轨 ${bad} 不得复活`)
  }
  assert.ok(!src.includes('speedFill'), 'speedFill 已随进度条一起删掉')
  // ⛔ 控制页不得「另抄一份」档位样式 —— 每个 .dc-gear-* 顶层规则只应出现一次
  for (const sel of ['.dc-gear-track {', '.dc-gear-seg {', '.dc-gear-value {', '.dc-gear-info {']) {
    assert.equal(src.split(sel).length - 1, 1, `${sel} 在同文件里只应定义一次`)
  }
})

/* ================= 风扇首页卡（归档 `tOS Prototype_aimate_fan.html` 的 `.device-card`） ================= */

test('风扇首页卡：版式与 AI Mori 卡同构 + 字号不低于 12px', () => {
  const src = read('src/components/apps/aimate/AimateApp.vue')
  for (const cls of ['mcard-fan', 'dc-main', 'dc-art', 'dc-info', 'dc-name', 'dc-model',
    'dc-power', 'dc-switch', 'dc-switch-knob', 'dc-switch-label',
    'dc-gear-row', 'dc-gear-info', 'dc-gear-label', 'dc-gear-value', 'dc-gear-track',
    'dc-gear-seg']) {
    assert.ok(src.includes(cls), `风扇卡缺 ${cls}`)
  }
  assert.ok(src.includes("'mcard-fan': d.type === 'fan'"),
    '风扇卡必须在 :class 里注册 mcard-fan —— 不注册则 padding 0 / 圆角 16px 全部失效')
  assert.ok(src.includes('name="fanDisc"'), '图标盒里必须是那枚手绘风扇（fanDisc）')
  assert.ok(src.includes('mate.toggleFanPower(d.id)'), '卡上开关必须走 toggleFanPower')
  assert.ok(src.includes('mate.requestFanSpeed(d.id, n)'), '12 段必须走 requestFanSpeed')
  assert.ok(src.includes('mate.speedPending[d.id]'),
    '档位值与 12 段的 pending 态必须读 speedPending（与开关的 pending 分开）')
  assert.ok(src.includes('data-gear-track') && src.includes(':data-gear-seg="n"'),
    '档位轨道与分段必须带取证钩子（e2e 靠它读数）')
  assert.ok(src.includes('v-for="n in FAN_SPEED_MAX"'),
    '段数必须由 FAN_SPEED_MAX 决定 —— 写死 12 会让「12 档」这个常量失去约束')

  // 🔴 顶部状态行：四张卡必须共用同一行
  //（风扇卡曾经照归档把这一行整个去掉，结果与其余三张卡版式不一致）
  assert.ok(!src.includes("d.type !== 'fan'"),
    '顶部状态行不得再对风扇关掉 —— 四张卡必须共用 `.mc-top`')

  // 🔴 与 Mori 卡的版式 parity：两张卡的骨架规则必须逐值一致，改一边不改另一边就红
  const rule = (sel) => {
    const i = src.indexOf(sel + ' {')
    assert.ok(i > 0, `找不到规则 ${sel}`)
    return src.slice(i, src.indexOf('}', i))
  }
  assert.ok(src.includes('padding: 0; border-radius: 16px; overflow: hidden;'),
    '风扇卡与 Mori 卡必须共用同一套卡框（padding 0 / 圆角 16px / overflow hidden）')
  assert.ok(src.includes('.mcard-mori .mc-top, .mcard-fan .mc-top'),
    '顶部状态行也必须对两张卡共用同一条规则 —— 一旦风扇卡退回 `.mc-top` 的基础内边距，' +
    '状态胶囊就不再与卡内 14px 对齐，版式又漂回去')
  for (const [mm, dc, toks] of [
    ['.mm-main', '.dc-main', ['padding: 8px 14px 14px']],
    ['.mm-art', '.dc-art', ['width: 52px', 'height: 52px', 'border-radius: 14px', 'margin-right: 14px']],
    ['.mm-info', '.dc-info', ['flex-direction: column', 'gap: 3px']],
    ['.mm-name', '.dc-name', ['font-size: 17px', 'font-weight: 700']],
    ['.mm-model', '.dc-model', ['font-size: 12px', 'color: #8e8ea3']]
  ]) {
    const a = rule(mm)
    const b = rule(dc)
    for (const t of toks) {
      assert.ok(a.includes(t), `${mm} 缺 ${t}`)
      assert.ok(b.includes(t), `${dc} 缺 ${t}（与 ${mm} 的版式 parity 被破坏）`)
    }
  }
  // 底部区块：两张卡都是「上边 1px 分隔线 + 自己的内边距」的手法
  assert.ok(src.includes('.mm-actions { display: flex; border-top: 1px solid #e9ecef; }'),
    'Mori 卡底部区块的上分隔线不能动')
  assert.ok(rule('.dc-gear-row').includes('border-top: 1px solid #e9ecef'),
    '风扇卡档位区块必须与 Mori 卡底部区块同一手法（上边 1px #E9ECEF 分隔线）')

  const i = src.indexOf('风扇卡：**版式对齐')
  const j = src.indexOf('.mc-enter {', i)
  assert.ok(i > 0 && j > i, '找不到风扇卡的样式块')
  const sizes = [...src.slice(i, j).matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]))
  assert.ok(sizes.length >= 4, `风扇卡字号只扫到 ${sizes.length} 处，规则可能失效`)
  const bad = sizes.filter((n) => n < 12)
  assert.deepEqual(bad, [], `风扇卡出现 <12px 字号：${bad.join(', ')}`)
})

test('风扇卡词条三语齐备（开关 / 档位调节 / 下发中）', () => {
  const m = read('src/locales/aimate.js')
  const blocks = m.split('fanCard: {').slice(1)
  assert.equal(blocks.length, 3, `fanCard 应有三语各一份，实测 ${blocks.length}`)
  for (const blk of blocks) {
    const line = blk.split('}')[0]
    for (const k of ['power:', 'speedTitle:', 'speedPending:']) {
      assert.ok(line.includes(k), `fanCard 缺 ${k} → ${line}`)
    }
  }
})


/* ================= 首页顶栏已删 + 卡片顺序（Ricky 2026-10-12） ================= */

test('首页顶栏（眉标 / 问候语 / 头像）已整体删除，只留状态栏留白（不填色）', () => {
  const src = read('src/components/apps/aimate/AimateApp.vue')
  for (const bad of ['class="home-head"', 'home-head {', 'hh-eyebrow', 'hh-title', 'hh-sub',
    'hh-avatar', 'data-go-mine', "am('home.greeting')", "am('home.greetingSub')"]) {
    assert.ok(!src.includes(bad), `AimateApp 仍引用 ${bad}（首页顶栏已删）`)
  }
  assert.ok(src.includes('class="home-statusbar"'),
    '顶栏去掉后必须留状态栏留白，否则首屏内容会钻到状态栏 / 顶部手势热区（64px）里')
  // 🔴 Ricky 2026-10-12「去掉状态栏底部的背景」：留白只占位、不填色。
  //    透明后露出应用根底色 ⇒ 状态栏那一条与下方内容区同色，白带消失。
  assert.ok(!/\.home-statusbar\s*\{[^}]*background/.test(src),
    '状态栏留白不得再填色（白底已按要求去掉；一填就回到「顶部一条异色带」）')
  assert.ok(!/\.mine-head\s*\{[^}]*background/.test(src),
    '「我的」页标题区同样不得填色 —— 它是首页那条留白的同构物，跨 Tab 必须一致')
  // 「应用默认背景色改为与设置页面一致」= SettingsApp.vue 的 `.settings-app` 用的 #F4F5F7
  assert.ok(/\.aimate\s*\{[^}]*background:\s*#F4F5F7/i.test(src),
    '应用默认背景色必须与设置页一致（#F4F5F7）')
  for (const page of ['.guide-page', '.search-page', '.center-page', '.device-info-page']) {
    assert.ok(new RegExp('\\' + page + '\\s*\\{[^}]*background:\\s*#F4F5F7', 'i').test(src),
      `${page} 的整页底色必须跟随应用默认背景（#F4F5F7），否则与设置页不一致`)
  }
  assert.ok(/\.home-statusbar\s*\{[^}]*height:\s*calc\(var\(--safe-top/.test(src),
    '状态栏留白高度必须跟随 --safe-top，否则不同机型上要么露底要么过高')
})

test('首页设备顺序：口袋打印机 → 录音充电宝 → 风扇 → AI Mori（风扇第三位）', () => {
  const s = store()
  assert.deepEqual(s.devices.map((d) => d.type), ['printer', 'recorder', 'fan', 'mori'])
  assert.equal(s.devices[2].id, 'DAEWOO-Fan-A1', '风扇卡必须在第三位')
  // 顺序与「选中项」是两回事：activeDeviceId 仍是控制页的默认设备，不该被排序带着走
  assert.equal(s.activeDeviceId, 'DAEWOO-Fan-A1')
  assert.equal(s.devices.every((d) => d.online), true)
})
