import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { setActivePinia, createPinia } from 'pinia'
import {
  useAiMateStore, DEVICE_TYPES, DEVICE_GROUPS, FAN_MODES, FAN_SWING_ANGLES,
  PICKUP_MODES, RECORDER_TABS, LISTEN_LANGS, SCAN_CANDIDATES, POWER_ACK_MS,
  FAN_SMART_MODE_INDEX, FAN_SPEED_MIN, FAN_SPEED_MAX, createDeviceCatalog,
  TYPE_MODELS, FIRMWARE_UPGRADE_MS,
  PHOTO_GROUPS, PRINTER_PHOTOS, PRINT_LAYOUTS, PRINT_FILTERS, EDIT_TOOLS,
  PRINT_QUALITIES, PRINT_COLORS, PRINT_MAX_PICKS, PAPER_MAX, PAPER_PACK, AR_VIDEO,
  PAGES, DEVICE_MODELS, PAIR_STEPS, OTHER_DEVICES
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

test('并集种子：四份归档各一台主设备（风扇 / 口袋打印机 / 录音充电宝 / AI Mori）', () => {
  const s = store()
  assert.deepEqual(
    s.devices.map((d) => d.id),
    ['DAEWOO-Fan-A1', 'AM-Printer-01', 'AM-Recorder-01', 'AM-Mori-01']
  )
  assert.deepEqual(s.devices.map((d) => d.type), ['fan', 'printer', 'recorder', 'mori'])
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


/* ================= P3a · 口袋打印机（归档 ai-mate-printer-demo.html） ================= */

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

  // 非空性：四个分组都必须有照片，否则对应 tab 是死的
  for (const g of PHOTO_GROUPS) {
    assert.ok(PRINTER_PHOTOS.some((p) => p.groups.includes(g)), `分组「${g}」没有任何照片`)
  }
  // 「最近项目」是全集（归档的默认视图）
  assert.equal(
    PRINTER_PHOTOS.filter((p) => p.groups.includes('recent')).length,
    PRINTER_PHOTOS.length,
    '「最近项目」应包含全部素材'
  )
})

test('多选上限必须可达（≤ 素材总数），否则超限分支是死代码', () => {
  assert.ok(
    PRINT_MAX_PICKS <= PRINTER_PHOTOS.length,
    `PRINT_MAX_PICKS=${PRINT_MAX_PICKS} 大于素材数 ${PRINTER_PHOTOS.length}，上限永远触发不到`
  )
})

test('打印机常量与归档对齐：6 版式 / 4 滤镜 / 5 工具 / 2 质量 / 3 色彩 / AR 18 秒', () => {
  assert.deepEqual(PRINT_LAYOUTS, ['square', 'border', 'full', 'coral', 'film', 'handwrite'])
  assert.deepEqual(PRINT_FILTERS, ['original', 'sunny', 'oldfilm', 'mono'])
  assert.deepEqual(EDIT_TOOLS, ['crop', 'layout', 'frame', 'filter', 'adjust'])
  assert.deepEqual(PRINT_QUALITIES, ['hd', 'standard'])
  assert.deepEqual(PRINT_COLORS, ['vivid', 'retro', 'natural'])
  assert.equal(AR_VIDEO.name, '岛屿漫游.mov')
  assert.equal(AR_VIDEO.duration, 18)
  assert.ok(AR_VIDEO.trimStart < AR_VIDEO.trimEnd, 'AR 默认裁剪区间必须有效')
})

test('选图：多选 / 再点取消 / 非法 id 被拒 / 超上限被拦并提示 / 可清空', () => {
  const s = store()
  assert.equal(s.pickedCount, 0)

  assert.equal(s.togglePhoto('p1'), true)
  assert.equal(s.togglePhoto('p2'), true)
  assert.equal(s.pickedCount, 2)

  // 再点一次是取消
  assert.equal(s.togglePhoto('p1'), true)
  assert.deepEqual(s.pickedIds, ['p2'], '再点应取消选中')

  assert.equal(s.togglePhoto('不存在'), false, '非法 id 应被拒')

  // 填到上限
  s.clearPicks()
  const all = PRINTER_PHOTOS.map((p) => p.id)
  for (let i = 0; i < PRINT_MAX_PICKS; i += 1) assert.equal(s.togglePhoto(all[i]), true)
  assert.equal(s.pickedCount, PRINT_MAX_PICKS)

  // 上限之上再加一个：拒绝 + 给出提示码
  const overflow = all[PRINT_MAX_PICKS]
  assert.ok(overflow, '素材数应大于上限（由前一条用例保证）')
  assert.equal(s.togglePhoto(overflow), false, '超上限应被拒')
  assert.equal(s.notice?.code, 'printMaxPick')
  assert.equal(s.notice?.params?.n, PRINT_MAX_PICKS)
  assert.equal(s.pickedCount, PRINT_MAX_PICKS, '被拒时计数不得变化')

  assert.equal(s.clearPicks(), true)
  assert.equal(s.pickedCount, 0)
})

test('编辑：工具 / 版式 / 滤镜走白名单，非法值被拒', () => {
  const s = store()
  assert.equal(s.setEditTool('layout'), true)
  assert.equal(s.setEditTool('不存在'), false)
  assert.equal(s.editTool, 'layout')

  assert.equal(s.setEditLayout('film'), true)
  assert.equal(s.setEditLayout('xxx'), false)
  assert.equal(s.editLayout, 'film')

  assert.equal(s.setEditFilter('mono'), true)
  assert.equal(s.setEditFilter('xxx'), false)
  assert.equal(s.editFilter, 'mono')
})

test('编辑：亮度夹到 ±50、旋转按 90 递增循环、可恢复默认', () => {
  const s = store()

  assert.equal(s.setEditBrightness(999), true)
  assert.equal(s.editBrightness, 50, '超上限应夹到 50')
  assert.equal(s.setEditBrightness(-999), true)
  assert.equal(s.editBrightness, -50, '超下限应夹到 -50')
  assert.equal(s.setEditBrightness('abc'), false, '非数字应被拒')

  assert.equal(s.rotateEditPhoto(), 90)
  assert.equal(s.rotateEditPhoto(), 180)
  assert.equal(s.rotateEditPhoto(), 270)
  assert.equal(s.rotateEditPhoto(), 0, '360 应回到 0')

  s.setEditLayout('coral')
  s.setEditFilter('sunny')
  s.setEditBrightness(20)
  assert.equal(s.resetEdit(), true)
  assert.equal(s.editLayout, 'border')
  assert.equal(s.editFilter, 'original')
  assert.equal(s.editBrightness, 0)
  assert.equal(s.editRotate, 0)
})

test('打印设置：质量与色彩走白名单', () => {
  const s = store()
  assert.equal(s.setPrintQuality('standard'), true)
  assert.equal(s.setPrintQuality('xxx'), false)
  assert.equal(s.printQuality, 'standard')

  assert.equal(s.setPrintColor('vivid'), true)
  assert.equal(s.setPrintColor('xxx'), false)
  assert.equal(s.printColor, 'vivid')
})

test('耗材：购纸累加、夹到 PAPER_MAX、满仓时提示', () => {
  const s = store()
  const start = s.paper
  assert.equal(s.buyPaper(PAPER_PACK), true)
  assert.equal(s.paper, Math.min(PAPER_MAX, start + PAPER_PACK))
  assert.equal(s.notice?.code, 'paperBought')

  s.paper = PAPER_MAX
  assert.equal(s.paperFull, true)
  assert.equal(s.buyPaper(), false, '满仓不应继续加')
  assert.equal(s.notice?.code, 'paperFull')
  assert.equal(s.paper, PAPER_MAX, '被拒时余量不得变化')
})

test('开始打印：无照片被拦；相纸不足被拦；成功则入队、扣纸、进队列屏', () => {
  const s = store()

  // 无照片
  assert.equal(s.startPrint(), false)
  assert.equal(s.notice?.code, 'printNoPhoto')

  // 相纸不足
  s.togglePhoto('p1')
  s.togglePhoto('p2')
  s.paper = 1
  assert.equal(s.startPrint(), false, '两张照片只有一张相纸时应被拦')
  assert.equal(s.notice?.code, 'printNoPaper')
  assert.equal(s.notice?.params?.n, 1)
  assert.equal(s.queue.length, 0, '被拦时不得入队')
  assert.equal(s.pickedCount, 2, '被拦时不得清空选择')

  // 正常
  s.paper = 8
  assert.equal(s.startPrint(), true)
  assert.equal(s.queue.length, 2)
  assert.equal(s.paper, 6, '应扣掉两张相纸')
  assert.equal(s.printScreen, 'queue')
  assert.equal(s.pickedCount, 0, '入队后应清空选择')
  assert.equal(s.notice?.code, 'printSent')
  for (const j of s.queue) {
    assert.equal(j.stage, 'sending')
    assert.equal(j.progress, 0)
    assert.equal(j.paused, false)
    assert.equal(j.quality, s.printQuality)
    assert.equal(j.color, s.printColor)
  }
})

test('队列：进度推进并按 30/70/100 跨阶段；暂停时不推进；完成后 activeJobs 归零', () => {
  const s = store()
  s.togglePhoto('p1')
  s.startPrint()
  const job = s.queue[0]

  assert.equal(job.stage, 'sending')
  assert.equal(s.activeJobs.length, 1)

  // 推进到显影
  for (let i = 0; i < 20; i += 1) s.tickPrint()
  assert.equal(job.stage, 'developing', `progress=${job.progress}`)

  // 暂停后不再推进
  const snap = job.progress
  assert.equal(s.pauseJob(job.id), true)
  assert.equal(s.notice?.code, 'printPaused')
  for (let i = 0; i < 10; i += 1) s.tickPrint()
  assert.equal(job.progress, snap, '暂停期间进度不得变化')

  // 恢复
  assert.equal(s.resumeJob(job.id), true)
  assert.equal(s.notice?.code, 'printResumed')
  s.tickPrint()
  assert.ok(job.progress > snap, '恢复后应继续推进')

  // 跑到完成
  for (let i = 0; i < 200; i += 1) s.tickPrint()
  assert.equal(job.stage, 'done')
  assert.equal(job.progress, 100)
  assert.equal(s.activeJobs.length, 0, '完成后不应再有活跃任务')
})

test('队列：取消任务会退还相纸并提示；清理只删已完成', () => {
  const s = store()
  s.togglePhoto('p1')
  s.togglePhoto('p2')
  const paperAfterPrint = (() => {
    s.startPrint()
    return s.paper
  })()
  const [j1, j2] = s.queue

  assert.equal(s.cancelJob(j1.id), true)
  assert.equal(s.notice?.code, 'printCanceled')
  assert.equal(s.queue.length, 1)
  assert.equal(s.paper, paperAfterPrint + 1, '取消应退还一张相纸')
  assert.equal(s.cancelJob('不存在'), false)

  // 完成后清理
  for (let i = 0; i < 200; i += 1) s.tickPrint()
  assert.equal(s.queue[0].stage, 'done')
  assert.equal(s.clearDoneJobs(), true)
  assert.equal(s.queue.length, 0, '清理后应只剩未完成的（这里为空）')
})

test('流程导航：openPrint 进来源屏并重置编辑状态；closePrint 退出', () => {
  const s = store()
  s.setEditLayout('film')
  s.setEditFilter('mono')
  s.setEditBrightness(30)

  assert.equal(s.openPrint('gallery'), true)
  assert.equal(s.printScreen, 'source')
  assert.equal(s.pickedCount, 0, '进入打印流应清空上次选择')
  assert.equal(s.editLayout, 'border', '进入时应重置版式')
  assert.equal(s.editFilter, 'original')
  assert.equal(s.editBrightness, 0)

  assert.equal(s.gotoPrintScreen('editor'), true)
  assert.equal(s.printScreen, 'editor')
  assert.equal(s.gotoPrintScreen('不存在'), false, '非法屏名应被拒')
  assert.equal(s.printScreen, 'editor', '被拒时屏不变')

  assert.equal(s.closePrint(), true)
  assert.equal(s.printScreen, null)
})

test('照片分组：切换分组只接受 PHOTO_GROUPS 内的值', () => {
  const s = store()
  assert.equal(s.setPhotoGroup('travel'), true)
  assert.equal(s.photoGroup, 'travel')
  assert.equal(s.photosInGroup.length, 3, 'travel 分组有 3 张')
  assert.equal(s.setPhotoGroup('xxx'), false)
  assert.equal(s.photoGroup, 'travel')

  s.setPhotoGroup('recent')
  assert.equal(s.photosInGroup.length, PRINTER_PHOTOS.length, 'recent 是全集')
})

test('AR：裁剪区间校验（最小时长 1 秒、夹到视频时长内）', () => {
  const s = store()
  assert.equal(s.setArTrim(2, 10), true)
  assert.equal(s.arTrimStart, 2)
  assert.equal(s.arTrimEnd, 10)
  assert.equal(s.arTrimSeconds, 8)

  // 反序输入会被规整
  assert.equal(s.setArTrim(10, 2), true)
  assert.equal(s.arTrimStart, 2)
  assert.equal(s.arTrimEnd, 10)

  // 区间不足 1 秒被拒
  assert.equal(s.setArTrim(5, 5.5), false)
  assert.equal(s.arTrimStart, 2, '被拒时区间不得变化')

  // 超出视频时长会被夹取
  assert.equal(s.setArTrim(-5, 999), true)
  assert.equal(s.arTrimStart, 0)
  assert.equal(s.arTrimEnd, AR_VIDEO.duration)

  assert.equal(s.setArTrim('a', 'b'), false, '非数字应被拒')
})

test('AR：扫描回放状态机只接受 4 个值', () => {
  const s = store()
  assert.equal(s.arScan, null)
  assert.equal(s.setArScan('scanning'), true)
  assert.equal(s.arScan, 'scanning')
  assert.equal(s.setArScan('locked'), true)
  assert.equal(s.setArScan('playing'), true)
  assert.equal(s.setArScan('bogus'), false)
  assert.equal(s.arScan, 'playing', '非法值不得改变状态')
  assert.equal(s.setArScan(null), true)
  assert.equal(s.arScan, null)
})

test('打印域不污染设备域：设备目录与风扇状态不受影响', () => {
  const s = store()
  const before = JSON.stringify(s.devices)
  s.openPrint()
  s.togglePhoto('p1')
  s.setEditLayout('coral')
  s.startPrint()
  for (let i = 0; i < 60; i += 1) s.tickPrint()
  assert.equal(JSON.stringify(s.devices), before, '打印流程不得改动任何设备状态')
  assert.equal(s.devices.length, 4)  // 四份归档的并集：风扇 / 口袋打印机 / 录音充电宝 / AI Mori
})


test('选图提示里的数字不得与真实上限脱钩（归档单张语义的残留守卫）', async () => {
  // 归档是「单张打印」，提示写死「请选择 1 张」；本仓放开为多选后若忘了改文案，
  // 就会出现「右上角 0/4、下方写着 1 张」的自相矛盾。这里用单边契约兜住：
  // 提示里没有数字 -> 放过；有数字 -> 必须恰好等于 PRINT_MAX_PICKS。
  const { AIMATE } = await import('../src/locales/aimate.js')
  for (const loc of ['zh', 'en', 'bn']) {
    const raw = AIMATE[loc]?.printer?.pickHint
    assert.ok(raw, `${loc} 缺 printer.pickHint`)
    const rendered = String(raw).replace('{n}', String(PRINT_MAX_PICKS))
    // 去掉正确的那一个数字后，不应残留任何其他数字（含孟加拉数字 ০-৯）
    const residue = rendered.replace(new RegExp(String(PRINT_MAX_PICKS), 'g'), '')
    assert.doesNotMatch(
      residue,
      /[0-9\u09E6-\u09EF]/,
      `${loc} 的选图提示「${raw}」里的数字与上限 ${PRINT_MAX_PICKS} 不一致`
    )
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
  assert.equal(s.printScreen, 'source', '打印机卡必须直接进打印流')
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

test('首页 / 我的 新增文案键三语齐备，且插值键的占位符跨语言一致', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  const KEYS = [
    'tab.home', 'tab.mine', 'tab.aria',
    'home.greeting', 'home.greetingSub', 'home.addDeviceAction', 'home.summary',
    'home.otherDevices', 'home.otherSub', 'home.addNew', 'home.addNewSub',
    'deviceTitle.printer', 'deviceTitle.recorder', 'deviceTitle.mori',
    'deviceMeta.battery', 'deviceMeta.paper', 'deviceMeta.used', 'deviceMeta.shots',
    'other.watch', 'other.watchModel', 'other.watchMeta',
    'other.buds', 'other.budsModel', 'other.budsMeta',
    'other.glass', 'other.glassModel', 'other.glassMeta', 'other.notConnected', 'other.connect',
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

test('已删掉的首屏词条不得复活（首页已改成 Demo 的 greeting + section head）', async () => {
  const { AIMATE } = await import('../src/locales/aimate.js')
  for (const loc of ['zh', 'en', 'bn']) {
    for (const k of ['title', 'subtitle', 'addTitle', 'addSub', 'catalog']) {
      assert.equal(AIMATE[loc].home[k], undefined, `${loc}.home.${k} 已不再被任何组件引用`)
    }
    assert.equal(AIMATE[loc].count, undefined, `${loc}.count 已不再被任何组件引用`)
    for (const k of ['connected', 'emptyTitle', 'emptySub']) {
      assert.equal(AIMATE[loc].control[k], undefined, `${loc}.control.${k} 已不再被任何组件引用`)
    }
  }
})

test('AimateApp 模板不再引用已删词条 / 已删类名（防回归）', () => {
  const src = read('src/components/apps/aimate/AimateApp.vue')
  for (const bad of ["am('home.title')", "am('home.subtitle')", "am('home.addTitle')",
    "am('home.catalog')", "am('control.emptyTitle')", "am('control.connected')",
    'class="banner', 'dc-gear-seg', 'empty-state']) {
    assert.ok(!src.includes(bad), `AimateApp 仍引用 ${bad}`)
  }
  // 底部 Tab 与首页三段结构必须在
  assert.ok(src.includes('FloatingTabBar'), '首页必须挂底部 Tab（本仓惯例组件）')
  assert.ok(src.includes("data-device-card"), '首页必须有设备卡')
  assert.ok(src.includes('data-other'), '首页必须有「其他设备」行')
  assert.ok(src.includes('data-mine-row'), '必须新增「我的」页')
  assert.ok(src.includes("mate.openDevice(d.id)"), '设备卡必须直达功能页')
})
