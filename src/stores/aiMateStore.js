import { defineStore } from 'pinia'

/**
 * AI Mate · 智能设备管理中枢
 * ============================================================
 * 单一事实来源：10 类设备目录 + 各设备实例状态 + 控制动作。
 *
 * 与 OneLeap 的分层：
 *  - `oneleap`（控制中心「设备中心」磁贴）= 快捷层，4 台固定设备的空间拓扑快捷控制。
 *  - `aimate`（本 store 支撑的桌面应用）= 管理中枢，可增删设备的完整目录与二级控制页。
 *
 * 数据来源（均为归档实测值，非臆造）：
 *  - 风扇状态字段 / 6 档模式 / 3 档摇头角 / 童锁与离线拦截 / 1200ms 响应延迟，
 *    取自归档构建快照 `tOS Prototype_aimate_fan.html` 的 AI Mate 设备中枢。
 *  - 录音充电宝的 3 种拾音模式取自本仓已落地的 OneLeap（归档并未提供拾音模式选择器）。
 *  - 设备类别的底色与主色取自归档的 8 类目录，沿用其内联色值。
 *
 * 本文件为纯新增，不触碰任何共享文件。
 */

/* ================= 设备分组 ================= */
/** 供目录页分组展示：随身 / 穿戴 / 家电 / 家居 */
export const DEVICE_GROUPS = ['carry', 'wear', 'appliance', 'home']

/* ================= 10 类设备统一目录 ================= */
/**
 * 去重后的统一目录 = OneLeap 已落地的 4 台 + 归档新增的 6 类。
 * `icon` 一律为 `src/assets/icons/lucide.js` 已登记的 LUCIDE 键。
 * `bg` / `color` 为归档实测的内联色值（每类一个色，不提升为全局 token）。
 */
export const DEVICE_TYPES = [
  // —— 前 8 类 = 归档「手动添加设备」里那 8 个瓦片的**原顺序**（风扇打头），别重排 ——
  { id: 'fan', name: '风扇', bg: '#DCFCE7', color: '#16A34A', icon: 'fan', group: 'appliance' },
  { id: 'tws', name: '耳机', bg: '#E0F2FE', color: '#0284C7', icon: 'headphones', group: 'wear' },
  { id: 'glasses', name: '眼镜', bg: '#F3E8FF', color: '#9333EA', icon: 'glasses', group: 'wear' },
  { id: 'bulbs', name: '灯泡', bg: '#FEF3C7', color: '#D97706', icon: 'lightbulb', group: 'appliance' },
  { id: 'infrared', name: '红外', bg: '#FEE2E2', color: '#DC2626', icon: 'radioTower', group: 'appliance' },
  { id: 'locks', name: '门锁', bg: '#E5E7EB', color: '#374151', icon: 'lockKeyhole', group: 'home' },
  { id: 'socket', name: '插座', bg: '#DBEAFE', color: '#2563EB', icon: 'plug', group: 'appliance' },
  { id: 'watch', name: '手表', bg: '#FCE7F3', color: '#DB2777', icon: 'watch', group: 'wear' },
  // —— 以下 2 类是**集成进来的**外部 Demo：归档 AI Mate 里没有，排在归档 8 类之后 ——
  { id: 'recorder', name: '录音充电宝', bg: '#FFEDD5', color: '#EA580C', icon: 'audioLines', group: 'carry' },
  { id: 'printer', name: '口袋打印机', bg: '#CCFBF1', color: '#0D9488', icon: 'printer', group: 'carry' },
  // AI Mori 在归档里是独立应用（见 docs/aimate-integration-plan.html），
  // 这里按「一台设备」收编，控制页挂它的流程入口，与打印机同一套挂载约定。
  { id: 'mori', name: 'AI Mori', bg: '#E8E5FB', color: '#6C5CE7', icon: 'aperture', group: 'carry' }
]

/* ================= 风扇域（归档实测） ================= */
/** 6 档风速模式，顺序即档位，索引与 `device.mode` 对齐 */
export const FAN_MODES = ['正常风', 'HI暴风', '自然风', '睡眠风', '母婴风', '智能风']
/** 摇头角度 3 档（归档 `k` 常量） */
export const FAN_SWING_ANGLES = [30, 60, 120]
/** 智能风（mode === 5）才显示室温 */
export const FAN_SMART_MODE_INDEX = 5
export const FAN_SPEED_MIN = 1
export const FAN_SPEED_MAX = 12
/** 定时关机 / 预约开机的可选项（秒） */
export const FAN_TIMER_STEPS = [0, 3600, 7200, 14400, 28800]

/* ================= 录音充电宝域 ================= */
/**
 * 拾音模式：沿用 OneLeap 已落地的 3 种。
 * ⚠️ 文案的**权威版本在 `OneLeapApp.vue` 的 `PICKUP_MODES`**
 * （全向「四周均衡拾音」/ 定向「聚焦正前方人声」/ 会议「多人声场增强」）。
 * 这里只保留 id，显示文案走 `src/locales/aimate.js`，措辞与 OneLeap 保持一致，
 * 避免两层出现两套说法。归档的录音 demo **没有**拾音模式选择器，
 * 它新增的是下面三样：转写 Tab / 双语字幕与听译 / 音频标记。
 */
export const PICKUP_MODES = ['omni', 'directed', 'meeting']
/** 详情页 Tab（归档实测：音频标记 / 转写 / AI 纪要） */
export const RECORDER_TABS = ['markers', 'transcript', 'summary']
/** 听译与面对面翻译支持的语言（归档实测 4 种） */
export const LISTEN_LANGS = ['zh', 'en', 'ja', 'ko']

/* ================= 口袋打印机域（归档 `ai-mate-printer-demo.html` 实测） ================= */
/** 照片分组：最近项目 / 收藏 / 相机 / 旅行 */
export const PHOTO_GROUPS = ['recent', 'favorites', 'camera', 'travel']
/**
 * 相册素材：归档 `ai-mate-assets/photos/` 的 6 张实拍图，
 * 已拷入 `public/photos/`（单张 ≤ 200KB）。
 */
export const PRINTER_PHOTOS = [
  { id: 'p1', src: '/photos/photo-01-beach.jpg', groups: ['recent', 'travel'] },
  { id: 'p2', src: '/photos/photo-02-cafe.jpg', groups: ['recent'] },
  { id: 'p3', src: '/photos/photo-03-forest.jpg', groups: ['recent', 'travel'] },
  { id: 'p4', src: '/photos/photo-04-city.jpg', groups: ['recent', 'travel'] },
  { id: 'p5', src: '/photos/photo-05-dog.jpg', groups: ['recent', 'camera'] },
  { id: 'p6', src: '/photos/photo-06-birthday.jpg', groups: ['recent', 'favorites'] }
]
/** 版式 6 款（归档：方形 / 保留白边 / 满版 / 珊瑚边 / 胶片 / 手写） */
export const PRINT_LAYOUTS = ['square', 'border', 'full', 'coral', 'film', 'handwrite']
/** 滤镜 4 款（归档：原图 / 晴日 / 旧胶片 / 黑白） */
export const PRINT_FILTERS = ['original', 'sunny', 'oldfilm', 'mono']
/** 编辑工具 5 个（归档：裁剪与旋转 / 打印版式 / 相框 / 滤镜 / 调节） */
export const EDIT_TOOLS = ['crop', 'layout', 'frame', 'filter', 'adjust']
/** 打印质量（归档：高清 / 标准） */
export const PRINT_QUALITIES = ['hd', 'standard']
/** 色彩模式（归档：鲜艳 / 复古 / 标准色彩） */
export const PRINT_COLORS = ['vivid', 'retro', 'natural']
/** 打印队列 4 阶段（归档实测文案顺序） */
export const PRINT_STAGES = ['sending', 'developing', 'cutting', 'done']
/** 进度跨阶段的分界：0-30 传输 / 30-70 显影 / 70-100 裁切 / 100 完成 */
export const PRINT_STAGE_BOUNDS = [30, 70, 100]
/** 单次 tick 的进度增量与间隔（约 4 秒走完一单） */
export const PRINT_TICK_MS = 90
export const PRINT_TICK_STEP = 2.4
/**
 * 一次最多选 4 张。
 * 归档文案是「请选择 1 张」（单张打印），这里放开为多选但设上限。
 * ⚠️ 上限必须 ≤ 素材总数，否则「超上限」这条分支永远走不到（等于死代码）。
 */
export const PRINT_MAX_PICKS = 4
/** 相纸上限与单次购买量 */
export const PAPER_MAX = 30
export const PAPER_PACK = 10
/** AR 视频（归档素材名与时长；视频文件未随归档提供，播放为模拟） */
export const AR_VIDEO = { name: '岛屿漫游.mov', duration: 18, size: '18.4 MB', trimStart: 3, trimEnd: 12 }

/* ================= 设备实例 ================= */
/**
 * 风扇两台，名称与副标题取自归档（`DAEWOO-Fan-A1` 无叶风扇 · 蓝牙
 * / `DAEWOO-Fan-A2` 循环扇 · 蓝牙）。A1 在线，A2 离线 —— 用于覆盖离线拦截分支。
 */
/**
 * 型号。归档只给了设备名（`DAEWOO-Fan-A1`）与类别，没有型号字段；
 * 这里按类别给一个稳定短型号，让设备详情页有可读的规格行。
 */
export const TYPE_MODELS = {
  recorder: 'AM-RC1', printer: 'AM-PT1', mori: 'AM-Mori1', watch: 'AM-W1', glasses: 'AM-G1',
  fan: 'DW-F1', tws: 'AM-E1', bulbs: 'AM-L1', infrared: 'AM-IR1',
  locks: 'AM-K1', socket: 'AM-S1'
}

/* ================= 归档「添加设备」域（tOS Prototype_aimate_fan.html 实测） ================= */
/**
 * 每个类别的可配对型号。归档只给了风扇的两台
 * （`DAEWOO-Fan-A1` 无叶风扇 · 蓝牙 / `DAEWOO-Fan-A2` 循环扇 · 蓝牙），
 * 其余类别归档只有类别入口、没给型号，这里按同形补齐。
 * `subKey` 指向 `locales/aimate.js` 的 `modelSub.*`，文案不进 store。
 */
export const DEVICE_MODELS = {
  fan: [
    { code: 'DAEWOO-Fan-A1', subKey: 'noBlade', model: 'DW-F1' },
    { code: 'DAEWOO-Fan-A2', subKey: 'circulator', model: 'DW-F2' }
  ],
  tws: [{ code: 'AM-TWS-01', subKey: 'tws', model: 'AM-E1' }],
  glasses: [{ code: 'AM-Glasses-01', subKey: 'glasses', model: 'AM-G1' }],
  bulbs: [{ code: 'AM-Bulb-01', subKey: 'bulbs', model: 'AM-L1' }],
  infrared: [{ code: 'AM-IR-01', subKey: 'infrared', model: 'AM-IR1' }],
  locks: [{ code: 'AM-Lock-01', subKey: 'locks', model: 'AM-K1' }],
  socket: [{ code: 'AM-Socket-01', subKey: 'socket', model: 'AM-S1' }],
  watch: [{ code: 'AM-Watch-01', subKey: 'watch', model: 'AM-W1' }],
  recorder: [{ code: 'AM-Recorder-01', subKey: 'recorder', model: 'AM-RC1' }],
  printer: [{ code: 'AM-Printer-01', subKey: 'printer', model: 'AM-PT1' }],
  mori: [{ code: 'AM-Mori-01', subKey: 'mori', model: 'AM-Mori1' }]
}
/**
 * 配对步骤（归档风扇实测 3 步：通电 → 长按配对键 → 点开始连接）。
 * 存 step id，文案在 `locales/aimate.js` 的 `pairStep.*`。
 */
export const PAIR_STEPS = ['power', 'pairKey', 'tapConnect']
/**
 * 设备卡档位条的分段数。归档 `.dc-gear-seg` 实测 12 段，
 * 与 `FAN_SPEED_MAX` 同源 —— 改一个必须改另一个。
 */
export const GEAR_SEGMENTS = 12

/**
 * 由设备 id 推导 MAC。真机读的是蓝牙地址，这里做成
 * 「同 id 永远同值」的确定性映射，避免每次渲染抖动。
 */
function macFromId(id) {
  const hex = (n) => n.toString(16).toUpperCase().padStart(2, '0')
  let h = 5381
  for (let i = 0; i < id.length; i++) h = ((h * 33) ^ id.charCodeAt(i)) >>> 0
  return ['A4', 'C1', '38', hex((h >>> 16) & 0xff), hex((h >>> 8) & 0xff), hex(h & 0xff)].join(':')
}

/**
 * 同一型号可以配多台（第 2 台显示名加台号：`DAEWOO-Fan-A1 (2)`）。
 * 纯函数，便于单测直接验；不写内联逻辑是为了避免和 `createDeviceCatalog()` 两处维护。
 */
function uniqueName(devices, base) {
  if (!devices.some((d) => d.name === base || d.name.startsWith(base + ' ('))) return base
  let n = 2
  while (devices.some((d) => d.name === `${base} (${n})`)) n++
  return `${base} (${n})`
}

/** 三类设备共有的规格字段；`fwNext` 非空即表示「有新固件可升级」 */
function deviceSpec(id, type, name, subtitle, online, fw, fwNext) {
  return {
    id, type, name, subtitle, nick: '', online,
    model: TYPE_MODELS[type] || 'AM-01',
    mac: macFromId(id),
    firmware: fw,
    fwNext: fwNext || null
  }
}

function createFan(id, name, subtitle, online, fw = '1.4.2', fwNext = null) {
  return {
    ...deviceSpec(id, 'fan', name, subtitle, online, fw, fwNext),
    power: false, speed: 3, mode: 0, swing: false, swingAngle: 0,
    timerOff: 0, timerOn: 0, plasma: false, childLock: false, temp: 26
  }
}

function createSimpleDevice(id, type, name, subtitle, online = true, fw = '1.0.3', fwNext = null) {
  return { ...deviceSpec(id, type, name, subtitle, online, fw, fwNext), power: false }
}

export function createDeviceCatalog() {
  return [
    createFan('DAEWOO-Fan-A1', 'DAEWOO-Fan-A1', '无叶风扇 · 蓝牙', true, '1.4.2', '1.5.0'),
    createFan('DAEWOO-Fan-A2', 'DAEWOO-Fan-A2', '循环扇 · 蓝牙', false, '1.4.0'),
    createSimpleDevice('AM-Bulb-01', 'bulbs', 'AM-Bulb-01', '智能灯泡 · Wi-Fi', true, '1.0.3', '1.1.0'),
    createSimpleDevice('AM-Socket-01', 'socket', 'AM-Socket-01', '智能插座 · Wi-Fi'),
    createSimpleDevice('AM-Lock-01', 'locks', 'AM-Lock-01', '智能门锁 · 蓝牙', false),
    createSimpleDevice('AM-TWS-01', 'tws', 'AM-TWS-01', '真无线耳机 · 蓝牙'),
    createSimpleDevice('AM-IR-01', 'infrared', 'AM-IR-01', '红外遥控 · 蓝牙'),
    // OneLeap 已接管的四台：aimate 显示同一份设备，控制动作复用其语义
    createSimpleDevice('AM-Recorder-01', 'recorder', 'AM-Recorder-01', '录音充电宝 · 蓝牙'),
    createSimpleDevice('AM-Printer-01', 'printer', 'AM-Printer-01', '口袋打印机 · 蓝牙'),
    createSimpleDevice('AM-Mori-01', 'mori', 'AM-Mori-01', '随身影音 · 蓝牙'),
    createSimpleDevice('AM-Watch-01', 'watch', 'AM-Watch-01', '智能手表 · 蓝牙'),
    createSimpleDevice('AM-Glasses-01', 'glasses', 'AM-Glasses-01', '智能眼镜 · 蓝牙')
  ]
}

/**
 * 「添加设备」扫描结果（归档首页 banner：「添加智能设备 / 扫描发现附近蓝牙设备」）。
 * `type` 指向 DEVICE_TYPES，`subtitle` 为扫描到的广播名。
 */
export const SCAN_CANDIDATES = [
  { id: 'SCAN-Fan-A3', type: 'fan', name: 'DAEWOO-Fan-A3', subtitle: '循环扇 · 蓝牙' },
  { id: 'SCAN-Bulb-02', type: 'bulbs', name: 'AM-Bulb-02', subtitle: '智能灯泡 · Wi-Fi' },
  { id: 'SCAN-Socket-02', type: 'socket', name: 'AM-Socket-02', subtitle: '智能插座 · Wi-Fi' },
  { id: 'SCAN-IR-02', type: 'infrared', name: 'AM-IR-02', subtitle: '红外遥控 · 蓝牙', willFail: true },
  { id: 'SCAN-Lock-02', type: 'locks', name: 'AM-Lock-02', subtitle: '智能门锁 · 蓝牙' }
]

/** 设备开关的真实响应延迟（归档实测 1200ms，期间按钮呈 pending） */
export const POWER_ACK_MS = 1200
/** 固件升级的回执延迟（升级本身是个过程，比开关略长） */
export const FIRMWARE_UPGRADE_MS = 1500

/** 归档五屏流程 + 控制/详情页 */
export const PAGES = ['home', 'add', 'guide', 'search', 'center', 'control', 'info']

const findType = (typeId) => DEVICE_TYPES.find((t) => t.id === typeId) || null

export const useAiMateStore = defineStore('aiMate', {
  state: () => ({
    devices: createDeviceCatalog(),
    /** 正在等待设备回执的设备 id → true（按钮呈 pending，抑制重复点击） */
    pending: {},
    /** 最近一次业务提示：{ code, params }。文案由组件经 i18n 渲染，store 不持有中文串 */
    notice: null,
    /** 控制台当前选中的设备 id */
    activeDeviceId: 'DAEWOO-Fan-A1',
    // —— 录音充电宝 ——
    pickupMode: 'meeting',
    recording: false,
    recordSeconds: 0,
    chargerOn: false,
    /** 音频标记（时间戳 + 文本） */
    markers: [
      { at: '09:18', text: '确认 Q3 核心目标' },
      { at: '21:46', text: '讨论设备拾音优化' }
    ],
    // —— 添加设备流（旧：单面板；仍保留给 OneLeap 复用）——
    scanning: false,
    discovered: [],

    // —— 归档五屏添加流程（`tOS Prototype_aimate_fan.html` 实测的页面集合）——
    /**
     * 当前页：home 首页 / add 添加设备 / guide 选型号+配对步骤 /
     * search 搜索设备 / center 连接中→成功 / control 设备控制 / info 设备详情
     */
    page: 'home',
    /** guide 页选中的类别 id（null = 还没选） */
    addType: null,
    /** guide 页选中的型号下标 */
    addModelIndex: 0,
    /** search 页状态：searching 搜索中 / found 已搜到 */
    scanState: 'searching',
    /** search 页搜到的候选（由 addType 的型号表生成） */
    found: [],
    /** center 页状态：connecting 连接中 / success 连接成功 */
    linkState: 'connecting',
    /** 设备详情页：重命名弹窗 / 删除确认弹窗 */
    renaming: false,
    confirmDelete: false,
    /** 定时浮层：null / 'timerOff' / 'timerOn' */
    timerSheet: null,

    /**
     * 设备流程层：null = 未进入；'recorder' | 'mori'。
     * 与 `printScreen` 分开是刻意的 —— 打印流自己有 5 屏状态机，
     * 而这两个流程各自是独立组件，只需要一个「开/关」开关。
     */
    deviceFlow: null,

    // —— 口袋打印机（归档 `ai-mate-printer-demo.html`）——
    /** null = 未进入打印流；否则为当前屏：source / picker / editor / queue / ar */
    printScreen: null,
    /** 选图来源：gallery 从相册 / camera 即时拍照 / ar 视频打印 */
    printSource: 'gallery',
    /** 已选照片 id */
    pickedIds: [],
    /** 选图屏当前分组 */
    photoGroup: 'recent',
    /** 编辑参数 */
    editTool: 'crop',
    editLayout: 'border',
    editFilter: 'original',
    editBrightness: 0,
    editRotate: 0,
    /** 打印设置 */
    printQuality: 'hd',
    printColor: 'natural',
    /** 相纸余量（张）—— 归档首页有「相纸余量 / 纸仓已满 / 购买相纸」 */
    paper: 8,
    /** 打印队列：{ id, photoId, quality, color, progress, paused, stage } */
    queue: [],
    /** AR 裁剪区间（秒） */
    arTrimStart: AR_VIDEO.trimStart,
    arTrimEnd: AR_VIDEO.trimEnd,
    /** AR 扫描回放：null / scanning / locked / playing */
    arScan: null,
    printSeq: 0
  }),

  getters: {
    /** 目录页用：按 group 分组，空组自动省略 */
    devicesByGroup: (s) => {
      const out = DEVICE_GROUPS.map((g) => ({
        group: g,
        types: DEVICE_TYPES.filter((t) => t.group === g)
      })).filter((g) => g.types.length > 0)
      return out
    },
    /** 已连接设备（目录页「我的设备」） */
    connectedDevices: (s) => s.devices.filter((d) => d.online),
    offlineCount: (s) => s.devices.filter((d) => !d.online).length,
    deviceCount: (s) => s.devices.length,
    activeDevice: (s) => s.devices.find((d) => d.id === s.activeDeviceId) || null,
    /** 风扇：是否处于智能风（决定要不要显示室温） */
    fanShowsTemp: (s) => {
      const d = s.devices.find((x) => x.id === s.activeDeviceId)
      return !!d && d.type === 'fan' && d.mode === FAN_SMART_MODE_INDEX
    },
    isPending: (s) => (id) => !!s.pending[id],
    /** 设备详情页：是否有可用固件更新（离线设备不给升级） */
    hasUpgrade: (s) => (id) => {
      const d = s.devices.find((x) => x.id === id)
      return !!(d && d.online && d.fwNext)
    },
    /** 目录页卡片：按类型取得图标与配色 */
    typeOf: () => (typeId) => findType(typeId),
    /** 打印：当前分组下的照片（空组由组件回落到 recent） */
    photosInGroup: (s) => PRINTER_PHOTOS.filter((p) => p.groups.includes(s.photoGroup)),
    pickedPhotos: (s) => s.pickedIds
      .map((id) => PRINTER_PHOTOS.find((p) => p.id === id))
      .filter(Boolean),
    pickedCount: (s) => s.pickedIds.length,
    /** 队列里尚未完成的任务 */
    activeJobs: (s) => s.queue.filter((j) => j.stage !== 'done'),
    /** AR 裁剪区间的秒数 */
    arTrimSeconds: (s) => Math.max(1, Math.round(s.arTrimEnd - s.arTrimStart)),
    /** 相纸是否已满 */
    paperFull: (s) => s.paper >= PAPER_MAX
  },

  actions: {
    /* ---------------- 通用 ---------------- */
    getDevice(id) {
      return this.devices.find((d) => d.id === id) || null
    },
    selectDevice(id) {
      if (this.getDevice(id)) this.activeDeviceId = id
    },
    clearNotice() {
      this.notice = null
    },
    /** 统一拦截：离线与童锁。返回原因码，null 表示可操作 */
    blockReason(device) {
      if (!device) return 'notFound'
      if (!device.online) return 'offline'
      if (device.type === 'fan' && device.childLock) return 'childLock'
      return null
    },
    _guard(device) {
      const reason = this.blockReason(device)
      if (reason) {
        this.notice = { code: reason, params: { name: device?.name || '' } }
        return false
      }
      return true
    },

    /* ---------------- 归档五屏添加流程 ---------------- */
    /**
     * 切页。归档的导航是「一屏一个 page 容器」，
     * 这里用单一 `page` 字段代替路由，返回是否发生了切换。
     */
    gotoPage(p) {
      if (!PAGES.includes(p)) return false
      this.page = p
      return true
    },
    /** 首页 banner：进「添加设备」并复位上一轮的选择 */
    openAdd() {
      this.page = 'add'
      this.addType = null
      this.addModelIndex = 0
      this.scanState = 'searching'
      this.found = []
      this.linkState = 'connecting'
      return true
    },
    /**
     * 选中类别 → 进「选型号 + 配对步骤」页。
     * 归档里「扫描附近设备」只是装饰性的雷达动画，真正的入口是下方手动选类别，
     * 所以这里不给 `scanning` 单独建状态机。
     */
    pickType(typeId) {
      if (!findType(typeId)) return false
      this.addType = typeId
      this.addModelIndex = 0
      this.scanState = 'searching'
      this.found = []
      this.page = 'guide'
      return true
    },
    /** 选型号（归档是单选圆点） */
    pickModel(index) {
      const list = DEVICE_MODELS[this.addType] || []
      const i = Math.round(Number(index))
      if (!Number.isInteger(i) || i < 0 || i >= list.length) return false
      this.addModelIndex = i
      return true
    },
    /** guide 页「开始连接」→ 进搜索页，落一条候选（归档实测只搜到 1 台） */
    startSearch() {
      const list = DEVICE_MODELS[this.addType] || []
      const m = list[this.addModelIndex]
      if (!m) return false
      this.scanState = 'searching'
      this.found = []
      this.page = 'search'
      return true
    },
    /**
     * 搜索出结果（由组件在延迟后调用，模拟蓝牙广播的到达时间）。
     *
     * 🔴 候选 id 必须**避让已配过的同型号设备**，否则同一型号只能配一台：
     * 早前这里恒为 `FOUND-<code>`，而 `enterDevice()` 又是按 id 查重 ⇒
     * 第 2 次配对会命中第 1 台、静默不加新设备，下面 `uniqueName()` 的台号逻辑
     * 永远走不到（只能靠手改 id 的单测绕进去）。
     * 这里按「下一个空闲编号」取 id：第 1 台 `FOUND-<code>`、第 2 台 `FOUND-<code>-2`…
     * 写成无状态推演而不是计数器，是为了不必在 `openAdd()` 里复位 —— 复位会让
     * 「再次添加同一型号」算回第 1 台并再次撞车。
     */
    foundDevices() {
      const list = DEVICE_MODELS[this.addType] || []
      const m = list[this.addModelIndex]
      if (!m) return false
      const base = 'FOUND-' + m.code
      let id = base
      for (let n = 2; this.getDevice(id); n++) id = `${base}-${n}`
      this.found = [{ id, code: m.code, subKey: m.subKey, model: m.model, type: this.addType }]
      this.scanState = 'found'
      return true
    },
    /** 结果卡「连接」→ 进连接中 */
    beginLink() {
      if (!this.found.length) return false
      this.linkState = 'connecting'
      this.page = 'center'
      return true
    },
    /** 连接成功（组件延迟后调用） */
    linkSuccess() {
      this.linkState = 'success'
      return true
    },
    /**
     * 「进入设备」：把候选真正写进设备目录（若已存在则只选中），然后进控制页。
     * 复用既有 `pairDevice` 的字段规格，避免两套设备对象。
     */
    enterDevice() {
      const c = this.found[0]
      if (!c) return false
      // 🔴 必须按 `c.id`（`FOUND-<code>`）查，不能按 `c.code`：
      // 目录里预置了同型号的设备（OneLeap 那批），按 code 查必然命中 ⇒ 什么都不新增。
      let d = this.getDevice(c.id)
      if (!d) {
        d = { ...deviceSpec(c.id, c.type, c.code, '', true, '1.0.0'), subtitleKey: c.subKey }
        d.name = uniqueName(this.devices, c.code)
        if (c.type === 'fan') {
          Object.assign(d, {
            power: false, speed: 3, mode: 0, swing: false, swingAngle: 0,
            timerOff: 0, timerOn: 0, plasma: false, childLock: false, temp: 26
          })
        } else {
          d.power = false
        }
        this.devices.push(d)
      }
      this.activeDeviceId = d.id
      this.page = 'control'
      return true
    },
    /** 首页点设备卡 / 搜索结果 → 进控制页 */
    openControl(id) {
      if (!this.getDevice(id)) return false
      this.activeDeviceId = id
      this.page = 'control'
      return true
    },
    openInfo() {
      this.page = 'info'
      return true
    },
    openTimerSheet(which) {
      if (!['timerOff', 'timerOn'].includes(which)) return false
      this.timerSheet = which
      return true
    },
    closeTimerSheet() {
      this.timerSheet = null
      return true
    },
    openRename() { this.renaming = true; return true },
    closeRename() { this.renaming = false; return true },
    openDeleteConfirm() { this.confirmDelete = true; return true },
    closeDeleteConfirm() { this.confirmDelete = false; return true },
    /** 详情页确认删除：移除设备并回首页 */
    confirmRemove() {
      const ok = this.removeDevice(this.activeDeviceId)
      this.confirmDelete = false
      if (ok) {
        this.activeDeviceId = this.devices[0]?.id || null
        this.page = 'home'
      }
      return ok
    },
    /**
     * 返回：按归档的层级回退（控制页→首页、搜索→选型号、详情→控制），
     * 返回 true 表示已消费，供 `useBackHandler` 使用。
     */
    back() {
      if (this.timerSheet) { this.timerSheet = null; return true }
      if (this.renaming) { this.renaming = false; return true }
      if (this.confirmDelete) { this.confirmDelete = false; return true }
      const chain = { info: 'control', control: 'home', search: 'guide', guide: 'add', center: 'search', add: 'home' }
      const to = chain[this.page]
      if (to) { this.page = to; return true }
      return false
    },

    /* ---------------- 风扇域（归档语义） ---------------- */
    /**
     * 开关。归档实测：受童锁与离线拦截；按下后 1200ms 才真正翻转
     * （期间 pending = true 抑制重复触发）。
     * `immediate = true` 跳过延迟，供单测与 e2e 使用。
     */
    toggleFanPower(id, { immediate = false } = {}) {
      const d = this.getDevice(id)
      if (!this._guard(d)) return false
      if (this.pending[id]) return false
      const flip = () => { d.power = !d.power }
      if (immediate) { flip(); return true }
      this.pending[id] = true
      setTimeout(() => {
        flip()
        this.pending[id] = false
      }, POWER_ACK_MS)
      return true
    },

    /**
     * 选风速。归档语义：**先把电源打开**再设档，所以 power 恒为 true。
     * 档位取整并夹到 [1, FAN_MODES.length]。
     */
    setFanSpeed(id, speed) {
      const d = this.getDevice(id)
      if (!this._guard(d)) return false
      const n = Math.round(Number(speed))
      if (!Number.isFinite(n)) return false
      d.speed = Math.max(FAN_SPEED_MIN, Math.min(FAN_SPEED_MAX, n))
      if (!d.power) d.power = true
      return true
    },

    /** 切换 6 档风速模式（0..5），同样顺带开机 */
    setFanMode(id, index) {
      const d = this.getDevice(id)
      if (!this._guard(d)) return false
      const i = Math.round(Number(index))
      if (!Number.isFinite(i) || i < 0 || i >= FAN_MODES.length) return false
      d.mode = i
      if (!d.power) d.power = true
      return true
    },

    toggleSwing(id) {
      const d = this.getDevice(id)
      if (!this._guard(d)) return false
      d.swing = !d.swing
      // 归档：摇头关闭时角度归零
      if (!d.swing) d.swingAngle = 0
      return true
    },

    /** 摇头角度只接受归档的 3 档（30 / 60 / 120） */
    setSwingAngle(id, deg) {
      const d = this.getDevice(id)
      if (!this._guard(d)) return false
      const n = Math.round(Number(deg))
      if (!FAN_SWING_ANGLES.includes(n)) return false
      d.swingAngle = n
      d.swing = true
      return true
    },

    setFanTimer(id, kind, seconds) {
      const d = this.getDevice(id)
      if (!this._guard(d)) return false
      if (kind !== 'off' && kind !== 'on') return false
      const n = Math.round(Number(seconds))
      if (!Number.isFinite(n) || n < 0) return false
      if (kind === 'off') d.timerOff = n
      else d.timerOn = n
      this.notice = { code: n === 0 ? (kind === 'off' ? 'timerOffCleared' : 'timerOnCleared') : (kind === 'off' ? 'timerOffSet' : 'timerOnSet'), params: { hours: Math.ceil(n / 3600) } }
      return true
    },

    togglePlasma(id) {
      const d = this.getDevice(id)
      if (!this._guard(d)) return false
      d.plasma = !d.plasma
      return true
    },

    /**
     * 童锁。归档语义：童锁本身**不受童锁拦截**（否则无法解锁），但仍受离线拦截。
     */
    toggleChildLock(id) {
      const d = this.getDevice(id)
      if (!d) return false
      if (!d.online) {
        this.notice = { code: 'offline', params: { name: d.name } }
        return false
      }
      d.childLock = !d.childLock
      return true
    },

    setNick(id, nick) {
      const d = this.getDevice(id)
      if (!d) return false
      d.nick = String(nick || '').slice(0, 24)
      return true
    },

    /** 目录页的显示名：有昵称用昵称（归档 `x = nick || name`） */
    displayName(id) {
      const d = this.getDevice(id)
      return d ? (d.nick || d.name) : ''
    },

    /* ---------------- 简单设备（灯 / 插座 / 门锁 / 耳机 / 红外） ---------------- */
    togglePower(id) {
      const d = this.getDevice(id)
      if (!this._guard(d)) return false
      d.power = !d.power
      return true
    },

    /* ---------------- 固件升级 ---------------- */
    /**
     * 固件升级。与开关一致：受离线 / 童锁拦截，pending 期间抑制重复触发；
     * 完成后把 fwNext 落到 firmware 并清空待升级标记。
     */
    upgradeFirmware(id) {
      const d = this.getDevice(id)
      if (!this._guard(d)) return false
      if (!d.fwNext) return false
      if (this.pending[id]) return false
      const next = d.fwNext
      this.pending[id] = true
      setTimeout(() => {
        d.firmware = next
        d.fwNext = null
        this.pending[id] = false
        this.notice = { code: 'firmwareUpgraded', params: { v: next } }
      }, FIRMWARE_UPGRADE_MS)
      return true
    },

    /* ---------------- 添加设备流 ---------------- */
    startScan() {
      this.scanning = true
      // 已入库的设备不再出现在发现列表，否则点它会被 pairDevice 静默拒绝、
      // 界面既不提示也不关闭，看起来像「点了没反应」
      this.discovered = SCAN_CANDIDATES
        .filter((c) => !this.devices.some((d) => d.id === c.id))
        .map((c) => ({ ...c }))
      return this.discovered
    },
    stopScan() {
      this.scanning = false
    },
    /** 把扫描结果登记为真实设备；重复 id 不重复添加 */
    pairDevice(id) {
      const c = SCAN_CANDIDATES.find((x) => x.id === id)
      if (!c) return false
      if (this.getDevice(id)) return false
      this.devices.push(c.type === 'fan'
        ? createFan(c.id, c.name, c.subtitle, true)
        : createSimpleDevice(c.id, c.type, c.name, c.subtitle, true))
      this.discovered = this.discovered.filter((x) => x.id !== id)
      this.scanning = false
      return true
    },
    removeDevice(id) {
      const before = this.devices.length
      this.devices = this.devices.filter((d) => d.id !== id)
      if (this.devices.length === before) return false
      if (this.activeDeviceId === id) {
        this.activeDeviceId = this.devices[0]?.id || null
      }
      return true
    },

    /* ---------------- 录音充电宝 ---------------- */
    setPickupMode(mode) {
      if (!PICKUP_MODES.includes(mode)) return false
      this.pickupMode = mode
      return true
    },
    /** 录音本身不依赖风扇的童锁/离线门禁 */
    toggleRecording() {
      this.recording = !this.recording
      return this.recording
    },
    tickRecording() {
      if (this.recording) this.recordSeconds += 1
      return this.recordSeconds
    },
    addMarker(at, text) {
      const t = String(text || '').trim()
      if (!t) return false
      this.markers.push({ at: String(at || ''), text: t.slice(0, 60) })
      return true
    },
    /** 归档的耳机电源状态（9W 反向充电） */
    toggleCharger() {
      this.chargerOn = !this.chargerOn
      return this.chargerOn
    },

    /* ---------------- 设备流程层（录音充电宝 / AI Mori） ---------------- */
    /**
     * 打开设备的专属流程。归档里这两份是不带 tOS 外壳的单文件原型
     * （`ai-mate-recording-powerbank-demo.html` / `ai_mori_interactive_prototype(3).html`），
     * 集成后由设备控制页的入口卡进入。
     */
    openDeviceFlow(which) {
      if (!['recorder', 'mori'].includes(which)) return false
      this.deviceFlow = which
      return true
    },
    closeDeviceFlow() {
      this.deviceFlow = null
      return true
    },

    /* ---------------- 口袋打印机（归档语义） ---------------- */
    /**
     * 进入打印流。归档首页有三张来源卡：从相册选择 / 即时拍照 / AR 视频打印；
     * 这里统一进 `source` 屏，由用户再选来源（与归档的可点击原型一致）。
     */
    openPrint(source = 'gallery') {
      this.printScreen = 'source'
      this.printSource = source
      this.pickedIds = []
      this.editTool = 'crop'
      this.editLayout = 'border'
      this.editFilter = 'original'
      this.editBrightness = 0
      this.editRotate = 0
      return true
    },
    closePrint() {
      this.printScreen = null
      this.arScan = null
      return true
    },
    gotoPrintScreen(screen) {
      if (!['source', 'picker', 'editor', 'queue', 'ar'].includes(screen)) return false
      this.printScreen = screen
      return true
    },
    setPhotoGroup(g) {
      if (!PHOTO_GROUPS.includes(g)) return false
      this.photoGroup = g
      return true
    },
    /** 多选；超过上限时给出提示而不是静默失败 */
    togglePhoto(id) {
      if (!PRINTER_PHOTOS.some((p) => p.id === id)) return false
      const at = this.pickedIds.indexOf(id)
      if (at >= 0) {
        this.pickedIds.splice(at, 1)
        return true
      }
      if (this.pickedIds.length >= PRINT_MAX_PICKS) {
        this.notice = { code: 'printMaxPick', params: { n: PRINT_MAX_PICKS } }
        return false
      }
      this.pickedIds.push(id)
      return true
    },
    clearPicks() {
      this.pickedIds = []
      return true
    },

    /* ---- 编辑（归档：裁剪与旋转 / 打印版式 / 相框 / 滤镜 / 调节）---- */
    setEditTool(t) {
      if (!EDIT_TOOLS.includes(t)) return false
      this.editTool = t
      return true
    },
    setEditLayout(l) {
      if (!PRINT_LAYOUTS.includes(l)) return false
      this.editLayout = l
      return true
    },
    setEditFilter(f) {
      if (!PRINT_FILTERS.includes(f)) return false
      this.editFilter = f
      return true
    },
    /** 亮度 −50..50 */
    setEditBrightness(v) {
      const n = Math.round(Number(v))
      if (!Number.isFinite(n)) return false
      this.editBrightness = Math.max(-50, Math.min(50, n))
      return true
    },
    rotateEditPhoto() {
      this.editRotate = (this.editRotate + 90) % 360
      return this.editRotate
    },
    resetEdit() {
      this.editLayout = 'border'
      this.editFilter = 'original'
      this.editBrightness = 0
      this.editRotate = 0
      return true
    },

    /* ---- 打印设置与耗材 ---- */
    setPrintQuality(q) {
      if (!PRINT_QUALITIES.includes(q)) return false
      this.printQuality = q
      return true
    },
    setPrintColor(c) {
      if (!PRINT_COLORS.includes(c)) return false
      this.printColor = c
      return true
    },
    /** 购买相纸（归档「购买相纸」，纸仓有上限） */
    buyPaper(pack = PAPER_PACK) {
      const n = Math.round(Number(pack))
      if (!Number.isFinite(n) || n <= 0) return false
      const room = PAPER_MAX - this.paper
      if (room <= 0) {
        this.notice = { code: 'paperFull' }
        return false
      }
      this.paper += Math.min(room, n)
      this.notice = { code: 'paperBought', params: { n: Math.min(room, n) } }
      return true
    },

    /* ---- 打印队列 ---- */
    /**
     * 开始打印：按已选照片逐张入队，扣相纸，进队列屏。
     * 归档语义是「任务已发送 · 正在后台打印」，所以队列可以一边跑一边离开。
     */
    startPrint() {
      const photos = this.pickedPhotos
      if (!photos.length) {
        this.notice = { code: 'printNoPhoto' }
        return false
      }
      if (this.paper < photos.length) {
        this.notice = { code: 'printNoPaper', params: { n: this.paper } }
        return false
      }
      for (const p of photos) {
        this.printSeq += 1
        this.queue.push({
          id: 'job' + this.printSeq,
          photoId: p.id,
          quality: this.printQuality,
          color: this.printColor,
          progress: 0,
          paused: false,
          stage: 'sending'
        })
      }
      this.paper -= photos.length
      this.pickedIds = []
      this.printScreen = 'queue'
      this.notice = { code: 'printSent', params: { n: photos.length } }
      return true
    },
    /** 由组件的定时器驱动；返回是否还有未完成的活 */
    tickPrint() {
      for (const j of this.queue) {
        if (j.stage === 'done' || j.paused) continue
        j.progress = Math.min(100, j.progress + PRINT_TICK_STEP)
        j.stage = j.progress >= 100 ? 'done' : j.progress >= 70 ? 'cutting' : j.progress >= 30 ? 'developing' : 'sending'
      }
      return this.activeJobs.length > 0
    },
    pauseJob(id) {
      const j = this.queue.find((x) => x.id === id)
      if (!j || j.stage === 'done' || j.paused) return false
      j.paused = true
      this.notice = { code: 'printPaused' }
      return true
    },
    resumeJob(id) {
      const j = this.queue.find((x) => x.id === id)
      if (!j || j.stage === 'done' || !j.paused) return false
      j.paused = false
      this.notice = { code: 'printResumed' }
      return true
    },
    cancelJob(id) {
      const before = this.queue.length
      this.queue = this.queue.filter((x) => x.id !== id)
      if (this.queue.length === before) return false
      // 取消即退还相纸（未消耗）
      this.paper = Math.min(PAPER_MAX, this.paper + 1)
      this.notice = { code: 'printCanceled' }
      return true
    },
    clearDoneJobs() {
      this.queue = this.queue.filter((j) => j.stage !== 'done')
      return true
    },

    /* ---- AR 视频打印（归档：选视频 → 裁剪区间 → 绑定照片 → 打印 → 扫描回放）---- */
    setArTrim(start, end) {
      const a = Number(start)
      const b = Number(end)
      if (!Number.isFinite(a) || !Number.isFinite(b)) return false
      const lo = Math.max(0, Math.min(a, b))
      const hi = Math.min(AR_VIDEO.duration, Math.max(a, b))
      if (hi - lo < 1) return false
      this.arTrimStart = lo
      this.arTrimEnd = hi
      return true
    },
    /** 扫描回放：扫描 → 识别锚点 → 播放 */
    setArScan(state) {
      if (![null, 'scanning', 'locked', 'playing'].includes(state)) return false
      this.arScan = state
      return true
    }
  }
})
