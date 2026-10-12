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
/**
 * 相册四组，对应归档 gallery 的 album-tabs：最近项目 / 收藏 / 相机 / 旅行。
 * ⚠️ 归档那四个 tab **一个 onclick 都没有** —— 点了不切换，纯装饰。
 * 这里保留同样的胶囊外观，但把它接上真实过滤（见 `photosInGroup`）。
 */
export const PHOTO_GROUPS = ['recent', 'favorites', 'camera', 'travel']
/**
 * 相册素材：归档 `ai-mate-assets/photos/` 的 6 张实拍图，
 * 已拷入 `public/photos/`（单张 ≤ 200KB）。
 * 归档 gallery 铺了 12 格（6 张图各出现两次），这里只放不重复的 6 张 ——
 * 同一张照片出现两次会被当成渲染 bug，且「今天 · N 张照片」的 N 也才是实数。
 */
export const PRINTER_PHOTOS = [
  { id: 'p1', src: '/photos/photo-01-beach.jpg', groups: ['recent', 'travel'] },
  { id: 'p2', src: '/photos/photo-02-cafe.jpg', groups: ['recent'] },
  { id: 'p3', src: '/photos/photo-03-forest.jpg', groups: ['recent', 'travel'] },
  { id: 'p4', src: '/photos/photo-04-city.jpg', groups: ['recent', 'travel'] },
  { id: 'p5', src: '/photos/photo-05-dog.jpg', groups: ['recent', 'camera'] },
  { id: 'p6', src: '/photos/photo-06-birthday.jpg', groups: ['recent', 'favorites'] }
]
/** 裁剪比例（归档 crop pane 前三项：原始 / 3:4 / 1:1；第 4 项「旋转」是动作） */
export const EDIT_CROPS = ['original', 'ratio34', 'square']
/** 版式（归档 layout pane：保留白边 / 满版 / 2 拼图 / 4 拼图） */
export const EDIT_LAYOUTS = ['border', 'full', 'grid2', 'grid4']
/** 相框（归档 frame pane：无 / 珊瑚边 / 胶片 / 手写） */
export const EDIT_FRAMES = ['none', 'dot', 'film', 'handwrite']
/** 滤镜（归档 filter pane：原图 / 晴日 / 旧胶片 / 黑白） */
export const PRINT_FILTERS = ['original', 'sunny', 'oldfilm', 'mono']
/** 编辑工具 5 个（归档 editor-toolbar：裁剪 / 版式 / 相框 / 滤镜 / 调节） */
export const EDIT_TOOLS = ['crop', 'layout', 'frame', 'filter', 'adjust']
/** 打印质量（归档 segments 顺序：标准 / 高清） */
export const PRINT_QUALITIES = ['standard', 'hd']
/** 色彩模式（归档 segments 顺序：标准 / 鲜艳 / 复古） */
export const PRINT_COLORS = ['natural', 'vivid', 'retro']
/** 亮度档位（归档 `min=70 max=130 value=100`，落到 CSS 变量 `--brightness`） */
export const EDIT_BRIGHT_MIN = 70
export const EDIT_BRIGHT_MAX = 130
export const EDIT_BRIGHT_DEFAULT = 100
/** 滤镜强度档位（归档 `min=0 max=100 value=70`） */
export const EDIT_STRENGTH_MIN = 0
export const EDIT_STRENGTH_MAX = 100
export const EDIT_STRENGTH_DEFAULT = 70
/**
 * 相纸容量。归档首页卡与设备管理页都写死「相纸 5 / 5 张 · 纸仓已满」，
 * 而且**没有任何扣减逻辑** —— 点「购买相纸」只弹「已打开相纸购买指南」。
 * 所以它是常量而不是会变的余量；队列上限（归档 `Math.min(5, +1)`）就等于它。
 */
export const PAPER_MAX = 5
/** 打印队列上限（归档队列 badge 写 `N / 5`） */
export const QUEUE_MAX = PAPER_MAX
/** 进度模态的三阶段分界（归档 renderProgress：<35 传输 / <80 显影 / 其余裁切） */
export const PRINT_STAGE_BOUNDS = [35, 80]
/** 进度模态步进：0 → 100 约 4 秒，对齐归档「约 40 秒」文案的演示节奏 */
export const PRINT_TICK_MS = 60
export const PRINT_STEP = 1.5
/** 相机两种模式（归档 camera-tabs：拍照 / AR 扫描） */
export const CAMERA_MODES = ['photo', 'scan']
/** AR 向导三步（归档 step-dot 1 / 2 / 3） */
export const AR_STEPS = [1, 2, 3]
/**
 * AR 视频（归档素材名与时长；视频文件未随归档提供，播放为模拟）。
 * 裁剪区间取归档时间轴的实测值：`00:04 → 00:13`、「已裁剪至 9 秒」。
 */
export const AR_VIDEO = { name: '岛屿漫游.mov', duration: 18, size: '18.4 MB', trimStart: 4, trimEnd: 13 }

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
  // 归档四份文件各对应一台主设备，首页取并集：
  //   tOS Prototype_aimate_fan.html      → 风扇（首页只管理单台 DAEWOO-Fan-A1）
  //   ai-mate-printer-demo.html          → 口袋打印机
  //   ai-mate-recording-powerbank-demo.html → 录音充电宝
  //   ai_mori_interactive_prototype(3).html → AI Mori
  // ⚠️ 归档的 AI Mate 首页其实是「0 台 + 空状态」；这里**刻意不从空开始**，
  //    否则四份文件的功能面在首页一个都摸不到。预置集合严格等于四份文件的并集，
  //    不再预置归档「添加设备」目录里的通用品类（灯泡/插座/门锁/红外/耳机/手表/眼镜）。
  const fan = createFan('DAEWOO-Fan-A1', 'DAEWOO-Fan-A1', '无叶风扇 · 蓝牙', true, '1.4.2', '1.5.0')
  const printer = createSimpleDevice('AM-Printer-01', 'printer', 'AM-Printer-01', '口袋打印机 · 蓝牙', true, '2.1.0', '2.2.0')
  // 录音充电宝刻意**不给新版固件** —— 种子里必须有一台「已是最新」，
  // 否则升级流程的「无新版本」分支与详情页的两种形态都验不到（非空性判据）
  const recorder = createSimpleDevice('AM-Recorder-01', 'recorder', 'AM-Recorder-01', '录音充电宝 · 蓝牙', true, '3.0.4')
  const mori = createSimpleDevice('AM-Mori-01', 'mori', 'AM-Mori-01', '随身 AI 相机 · 蓝牙', true, '1.2.0', '1.3.0')
  // 🔴 首页排列顺序（Ricky 2026-10-12 定）：口袋打印机 → 录音充电宝 → **风扇** → AI Mori。
  //    顺序只决定 `devices` 的先后，不改任何一台的状态；`activeDeviceId` 仍是风扇
  //    （它是控制页的「默认选中项」，与首页排序无关）。
  return [
    // 三台的显示名取自 Demo 首屏（`device.title.*`），型号与电量/余量亦为 Demo 实测
    { ...printer, battery: 78, titleKey: 'deviceTitle.printer', paper: PAPER_MAX, inCups: true },
    { ...recorder, battery: 86, titleKey: 'deviceTitle.recorder', storageUsed: 18.6 },
    // 风扇卡显示名照抄归档（`DAEWOO-Fan-A1`），不套用 Demo 的「我的 XX」措辞
    { ...fan, battery: 62 },
    { ...mori, battery: 92, titleKey: 'deviceTitle.mori', shots: 128 }
  ]
}

/**
 * 首页「其他设备」——两份 Demo 的「其他设备」段取并集：
 *   录音充电宝 Demo：AI 运动手表 / 智能耳机 / AI 眼镜（未连接）
 *   口袋打印机 Demo：AI Audio Glasses（未连接）
 * 二者说的是同一类可穿戴（`AI 眼镜` ≈ `AI Audio Glasses`），按概念并成 1 条。
 * 名称/型号/副文案全部走 i18n（`other.*`），store 不持有文案。
 */
export const OTHER_DEVICES = [
  { id: 'AI-Watch-S2', type: 'watch', nameKey: 'other.watch', modelKey: 'other.watchModel', metaKey: 'other.watchMeta', online: true },
  { id: 'AI-Buds-Pro', type: 'tws', nameKey: 'other.buds', modelKey: 'other.budsModel', metaKey: 'other.budsMeta', online: true },
  { id: 'AI-Glass', type: 'glasses', nameKey: 'other.glass', modelKey: 'other.glassModel', metaKey: 'other.glassMeta', online: false }
]

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
/** 首页卡档位下发的回执延迟（归档首页卡实测 900ms，比开关略快） */
export const SPEED_ACK_MS = 900
/** 固件升级的回执延迟（升级本身是个过程，比开关略长） */
export const FIRMWARE_UPGRADE_MS = 1500

/** 归档五屏流程 + 控制/详情页（底部 Tab 不走 page，走 `tab`） */
export const PAGES = ['home', 'add', 'guide', 'search', 'center', 'control', 'info']

const findType = (typeId) => DEVICE_TYPES.find((t) => t.id === typeId) || null

export const useAiMateStore = defineStore('aiMate', {
  state: () => ({
    devices: createDeviceCatalog(),
    /** 正在等待设备回执的设备 id → true（按钮呈 pending，抑制重复点击） */
    pending: {},
    /**
     * 首页卡「档位下发」的回执等待。归档首页卡用**另一个变量**（开关是 `b`、档位是 `w`），
     * 所以这里另开一张表 —— 合成一个键会让开关与档位互相把对方的 pending 顶掉。
     */
    speedPending: {},
    /** 最近一次业务提示：{ code, params }。文案由组件经 i18n 渲染，store 不持有中文串 */
    notice: null,
    /** 控制台当前选中的设备 id */
    activeDeviceId: 'DAEWOO-Fan-A1',
    // —— 录音充电宝 ——
    pickupMode: 'meeting',
    recording: false,
    recordSeconds: 0,
    chargerOn: false,
    /**
     * AI Mori 首页卡的两个录制开关（归档 `ai_mori_interactive_prototype(3).html`
     * 的 `recState`）。归档只在首页卡上用：**录像与录音互斥**（开一个自动关掉另一个），
     * 拍照不参与；归档从不重置它，故这里也不随流程开关复位。
     */
    moriRec: { video: false, audio: false },
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
    /** 底部 Tab：home 首页 / mine 我的（归档两份 Demo 的 bottomnav 都只有这两个语义层） */
    tab: 'home',
    /** 设备详情页的返回目标（首页卡片与风扇控制页都能进详情，回退目标不同） */
    infoFrom: 'home',
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
    /**
     * null = 未进入打印流；否则为当前屏。
     * 归档是 7 个 `.screen`：home / device / gallery / editor / ar / camera / my。
     * 其中 home 与 my 是本 App 的外壳（首页 / 我的），已经在 `AimateApp.vue` 里；
     * 打印流只负责 device（设备页，打印与设备管理两段同屏）/ gallery / editor / ar / camera。
     */
    printScreen: null,
    /** 打印流对应的设备（首页卡片与快速打印进入时写入） */
    printDeviceId: 'AM-Printer-01',
    /** 相册分组（归档 album-tabs） */
    photoGroup: 'recent',
    /**
     * 相册里被选中的那张。归档是**单选** —— `selectGallery` 先清掉所有 `.active`
     * 再给当前格加，所以「多选」不成立；想印多张走「加入队列」反复累积。
     */
    selectedPhotoId: 'p1',
    /** 相册是从哪进的功能：photo 普通 / ar AR 绑定照片（决定底部按钮文案与编辑完成去向） */
    galleryMode: 'photo',
    /** 相册的返回目标：device / ar */
    galleryReturn: 'device',
    /** 相机的返回目标：device / ar */
    cameraReturn: 'device',
    /** 相机模式：photo 拍照 / scan AR 扫描 */
    cameraMode: 'photo',
    /** 是否已在取景器里播放（归档 `viewfinder.playing`） */
    cameraPlaying: false,

    /* ---- 编辑器（归档 editor-screen）---- */
    /** 编辑完成后去向：photo → 入队 / ar → 回 AR 第 3 步 */
    editMode: 'photo',
    /** 归档初始态就是滤镜面板 */
    editTool: 'filter',
    editCrop: 'original',
    editRotate: 0,
    /** 归档初始带 `white-border` */
    editWhiteBorder: true,
    editLayout: 'border',
    editFrame: 'none',
    /** 归档初始滤镜是 `filter-warm`（晴日） */
    editFilter: 'sunny',
    editBrightness: EDIT_BRIGHT_DEFAULT,
    editStrength: EDIT_STRENGTH_DEFAULT,

    /* ---- 打印设置与耗材（归档 settings-panel）---- */
    printQuality: 'standard',
    printColor: 'natural',
    /** 相纸余量（张）。归档恒为 5 / 5，见 `PAPER_MAX` 注释 */
    paper: PAPER_MAX,
    /** 固件升级进度：null = 未在升级；否则 0 / 20 / … / 100 */
    fwProgress: null,

    /* ---- 打印队列（归档是「计数 + 单项」，不是逐任务列表）---- */
    queueCount: 0,
    /** 队列里那一单的品类：photo / ar（决定标题与状态文案） */
    queueKind: 'photo',
    /** 是否处于 sending 态（转圈 + 移除键隐藏） */
    queueSending: false,
    /** 状态文案档位：idle 未发送 / printing 打印中 / done 已完成 */
    queuePhase: 'idle',

    /* ---- 打印进度模态（归档 `progress-modal`）---- */
    printProgress: 0,
    printPaused: false,
    printKind: 'photo',
    printDone: false,
    printModalOpen: false,

    /* ---- AR 视频打印（归档 ar-screen 三步向导）---- */
    arStep: 1,
    arVideoSelected: false,
    arVideoPlaying: false,
    arCoverSelected: false,
    /** AR 裁剪区间（秒） */
    arTrimStart: AR_VIDEO.trimStart,
    arTrimEnd: AR_VIDEO.trimEnd
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
    isSpeedPending: (s) => (id) => !!s.speedPending[id],
    /** 设备详情页：是否有可用固件更新（离线设备不给升级） */
    hasUpgrade: (s) => (id) => {
      const d = s.devices.find((x) => x.id === id)
      return !!(d && d.online && d.fwNext)
    },
    /** 目录页卡片：按类型取得图标与配色 */
    typeOf: () => (typeId) => findType(typeId),
    /** 打印：当前分组下的照片（归档 album-tabs 的过滤结果） */
    photosInGroup: (s) => PRINTER_PHOTOS.filter((p) => p.groups.includes(s.photoGroup)),
    /** 相册里选中的那张（归档进相册就有默认选中，不存在「一张都没选」） */
    selectedPhoto: (s) => PRINTER_PHOTOS.find((p) => p.id === s.selectedPhotoId) || PRINTER_PHOTOS[0],
    /** 打印流对应的设备（AR 确认卡与设备管理页要显示它的名字） */
    printDevice: (s) => s.devices.find((d) => d.id === s.printDeviceId) || null,
    /** 队列是否已满（归档 `Math.min(5, +1)` 会静默截断，这里改成给提示） */
    queueFull: (s) => s.queueCount >= QUEUE_MAX,
    /** 相纸是否已满（归档恒「纸仓已满」） */
    paperFull: (s) => s.paper >= PAPER_MAX,
    /** AR 裁剪区间的秒数 */
    arTrimSeconds: (s) => Math.max(1, Math.round(s.arTrimEnd - s.arTrimStart)),
    /** AR 底部按钮的启用条件（归档 `ar-next` 的 disabled 逻辑） */
    arNextEnabled: (s) => (s.arStep === 1 ? s.arVideoSelected : s.arStep === 2 ? s.arCoverSelected : true),
    /**
     * AR 底部按钮的文案键（归档 labels 数组：`[视频→/未选, 照片→/未选, 确认]`）。
     * ⚠️ 返回的是 `locales/aimate.js` 里 `printer.*` 的**相对键**，
     * 调用点拼成 `am('printer.' + arNextLabel)`；单测会校验每个键都真的存在。
     */
    arNextLabel: (s) => (
      s.arStep === 1
        ? (s.arVideoSelected ? 'arNextPhoto' : 'arNextVideo')
        : s.arStep === 2
          ? (s.arCoverSelected ? 'arNextEdit' : 'arNextNeedPhoto')
          : 'arConfirm'
    )
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
      // 新增设备后同样直达功能页（新增打印机就直接进打印流）
      return this.openDevice(d.id)
    },
    /**
     * 切底部 Tab。切回首页时把子页一并复位，避免从「我的」回到一半的添加流程。
     */
    setTab(t) {
      if (!['home', 'mine'].includes(t)) return false
      this.tab = t
      this.page = 'home'
      this.timerSheet = null
      this.renaming = false
      this.confirmDelete = false
      return true
    },
    openControl(id) {
      if (!this.getDevice(id)) return false
      this.activeDeviceId = id
      this.page = 'control'
      return true
    },
    /**
     * 首页设备卡**直达功能页**（去掉「控制页」这一层中间页）：
     *   风扇 → 控制页（控制页本身就是风扇的功能页）
     *   口袋打印机 / 录音充电宝 / AI Mori → 各自的专属流程层
     * 返回是否消费。设备详情（MAC / 固件 / 重命名 / 删除）走卡片右上角 `···`。
     */
    openDevice(id) {
      const d = this.getDevice(id)
      if (!d) return false
      this.activeDeviceId = id
      if (d.type === 'printer') return this.openPrint(id)
      if (d.type === 'recorder' || d.type === 'mori') return this.openDeviceFlow(d.type)
      this.page = 'control'
      return true
    },
    /** 首页设备卡右上角 `···`：详情页（需要先选中该设备） */
    openInfoOf(id) {
      if (!this.getDevice(id)) return false
      this.activeDeviceId = id
      // 详情页的返回目标取决于从哪来：首页卡片 `···` → 回首页；控制页 `···` → 回控制页
      this.infoFrom = 'home'
      this.page = 'info'
      return true
    },
    openInfo() {
      this.infoFrom = this.page === 'control' ? 'control' : 'home'
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
      if (this.page === 'home' && this.tab === 'mine') { this.tab = 'home'; return true }
      if (this.renaming) { this.renaming = false; return true }
      if (this.confirmDelete) { this.confirmDelete = false; return true }
      const chain = { info: this.infoFrom, control: 'home', search: 'guide', guide: 'add', center: 'search', add: 'home' }
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
    /**
     * 首页卡点第 n 段档位（归档 `oe(n, e)`）：**不当即落值** ——
     * 900ms 回执后才改档，期间值显「下发中…」、12 段整体脉冲。
     * 控制页的 12 档仍走 `setFanSpeed`（那次交互归档本身是即时的）。
     * 回执窗口内重复点无效（归档 `if (w) return`）。
     */
    requestFanSpeed(id, speed) {
      const d = this.getDevice(id)
      if (!this._guard(d)) return false
      const n = Math.round(Number(speed))
      if (!Number.isFinite(n) || n < FAN_SPEED_MIN || n > FAN_SPEED_MAX) return false
      if (this.speedPending[id]) return false
      this.speedPending[id] = true
      setTimeout(() => {
        const dev = this.getDevice(id)
        if (dev) {
          // 归档：调档会把风扇一并打开
          if (!dev.power) dev.power = true
          dev.speed = n
        }
        this.speedPending[id] = false
      }, SPEED_ACK_MS)
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

    /** 首页「其他设备」行：Demo 里这些行只回一条状态提示，不跳页 */
    notifyOther(id) {
      const o = OTHER_DEVICES.find((x) => x.id === id)
      if (!o) return false
      this.notice = { code: 'deviceStatus', params: { nameKey: o.nameKey, metaKey: o.metaKey } }
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

    /* ---------------- AI Mori 首页卡（归档 `#home` 的 `.dev-card`） ---------------- */
    /**
     * 拍照：归档 `doAction('photo')` 只发一条指令再弹提示条，
     * **不参与**录像 / 录音的互斥，也不改任何开关状态。
     */
    moriPhoto() {
      this.notice = { code: 'moriPhotoSent' }
      return true
    },
    /**
     * 录像 / 录音的开与关（归档 `toggleRec(type)` 逐条对齐）：
     *   开启 → 关掉另一个（互斥）+ 录制开始提示条
     *   关闭 → 录制已保存提示条
     * 返回切换后的布尔值（非法 kind 返回 null），方便单测断言。
     */
    moriToggleRec(kind) {
      if (!['video', 'audio'].includes(kind)) return null
      const on = !this.moriRec[kind]
      this.moriRec[kind] = on
      if (on) {
        this.moriRec[kind === 'video' ? 'audio' : 'video'] = false
        this.notice = { code: kind === 'video' ? 'moriVideoStart' : 'moriAudioStart' }
      } else {
        this.notice = { code: kind === 'video' ? 'moriVideoSaved' : 'moriAudioSaved' }
      }
      return on
    },

    /* ---------------- 口袋打印机（归档语义） ---------------- */
    /**
     * 通用提示条（`notice.<code>` → 文案由 `AimateApp` 统一渲染）。
     * 给组件留的入口，避免在模板里直接写 store 状态。
     */
    toast(code, params) {
      if (!code) return false
      this.notice = params ? { code, params } : { code }
      return true
    },
    /**
     * 进入打印流。归档首页点打印机卡片进的是 `device-screen`（设备页）——
     * 那一页同时承载「开始创作 + 打印队列」与「设备管理」两段，
     * 所以流程首屏就是设备页，不再是自造的「选来源」中间页。
     */
    openPrint(deviceId) {
      const d = deviceId ? this.getDevice(deviceId) : null
      if (deviceId && !d) return false
      if (d) this.printDeviceId = d.id
      this.printScreen = 'device'
      this.photoGroup = 'recent'
      this.selectedPhotoId = PRINTER_PHOTOS[0].id
      this.galleryMode = 'photo'
      this.galleryReturn = 'device'
      this.cameraReturn = 'device'
      this.cameraMode = 'photo'
      this.cameraPlaying = false
      this.editMode = 'photo'
      this.resetEdit(false)
      this.arStep = 1
      this.arVideoSelected = false
      this.arVideoPlaying = false
      this.arCoverSelected = false
      this.arTrimStart = AR_VIDEO.trimStart
      this.arTrimEnd = AR_VIDEO.trimEnd
      this.printModalOpen = false
      this.printPaused = false
      this.printProgress = 0
      this.printDone = false
      return true
    },
    /**
     * 首页卡片上的「快速打印」。归档是 `openDevice()` 后 220ms 再 `openGallery('photo')`；
     * 本仓流程首屏就是设备页，再等 220ms 只会闪一下，所以直接落到相册，
     * 但 `galleryReturn` 仍是设备页 —— 在相册点「取消」回到设备页，与归档一致。
     */
    quickPrint(deviceId) {
      if (!this.openPrint(deviceId)) return false
      this.galleryMode = 'photo'
      this.galleryReturn = 'device'
      this.printScreen = 'gallery'
      return true
    },
    closePrint() {
      this.printScreen = null
      this.printModalOpen = false
      this.cameraPlaying = false
      this.fwProgress = null
      return true
    },
    gotoPrintScreen(screen) {
      if (!['device', 'gallery', 'editor', 'ar', 'camera'].includes(screen)) return false
      this.printScreen = screen
      return true
    },

    /* ---- 相册（归档 gallery-screen）---- */
    setPhotoGroup(g) {
      if (!PHOTO_GROUPS.includes(g)) return false
      this.photoGroup = g
      return true
    },
    /** 打开相册；`galleryReturn` 记住是从哪来的（归档 `galleryReturnScreen`） */
    openGallery(mode) {
      if (mode != null && !['photo', 'ar'].includes(mode)) return false
      if (mode != null) this.galleryMode = mode
      if (this.printScreen && this.printScreen !== 'gallery') this.galleryReturn = this.printScreen
      this.printScreen = 'gallery'
      return true
    },
    closeGallery() {
      this.printScreen = this.galleryReturn
      return true
    },
    /** 归档是单选：先清掉所有选中，再点亮这一张 */
    pickGalleryPhoto(id) {
      if (!PRINTER_PHOTOS.some((p) => p.id === id)) return false
      this.selectedPhotoId = id
      return true
    },
    /** 相册底部按钮 → 编辑器（AR 来的顺手把封面标成已选） */
    goEditor() {
      this.editMode = this.galleryMode
      if (this.editMode === 'ar') this.arCoverSelected = true
      this.resetEdit(false)
      this.printScreen = 'editor'
      return true
    },

    /* ---- 编辑器（归档 editor-screen）---- */
    setEditTool(t) {
      if (!EDIT_TOOLS.includes(t)) return false
      this.editTool = t
      return true
    },
    setEditCrop(c) {
      if (!EDIT_CROPS.includes(c)) return false
      this.editCrop = c
      return true
    },
    setEditLayout(l) {
      if (!EDIT_LAYOUTS.includes(l)) return false
      this.editLayout = l
      return true
    },
    setEditFrame(f) {
      if (!EDIT_FRAMES.includes(f)) return false
      this.editFrame = f
      return true
    },
    setEditFilter(f) {
      if (!PRINT_FILTERS.includes(f)) return false
      this.editFilter = f
      return true
    },
    /** 归档「保留白边」是个 toggle，不是单选 */
    toggleEditBorder() {
      this.editWhiteBorder = !this.editWhiteBorder
      return this.editWhiteBorder
    },
    /** 显式置位（版式切到「保留白边」时要把白边恢复回来） */
    setEditWhiteBorder(v) {
      this.editWhiteBorder = !!v
      return this.editWhiteBorder
    },
    /** 亮度 70..130（归档 range 的 min / max） */
    setEditBrightness(v) {
      const n = Math.round(Number(v))
      if (!Number.isFinite(n)) return false
      this.editBrightness = Math.max(EDIT_BRIGHT_MIN, Math.min(EDIT_BRIGHT_MAX, n))
      return true
    },
    /** 滤镜强度 0..100（归档第二条 range） */
    setEditStrength(v) {
      const n = Math.round(Number(v))
      if (!Number.isFinite(n)) return false
      this.editStrength = Math.max(EDIT_STRENGTH_MIN, Math.min(EDIT_STRENGTH_MAX, n))
      return true
    },
    rotateEditPhoto() {
      this.editRotate = (this.editRotate + 90) % 360
      return this.editRotate
    },
    /**
     * 恢复原始效果。归档里它只在「进编辑器 / 从相机回来 / AR 下一步」时被**静默**调用
     * （`resetEditor(false)`），编辑器头部并没有「恢复」按钮 —— 所以这里也一样。
     */
    resetEdit(toast = true) {
      this.editTool = 'filter'
      this.editCrop = 'original'
      this.editRotate = 0
      this.editWhiteBorder = true
      this.editLayout = 'border'
      this.editFrame = 'none'
      this.editFilter = 'sunny'
      this.editBrightness = EDIT_BRIGHT_DEFAULT
      this.editStrength = EDIT_STRENGTH_DEFAULT
      if (toast) this.notice = { code: 'printEditReset' }
      return true
    },
    /** 编辑器「取消」：从 AR 来的回 AR（保留步骤），否则回设备页 */
    cancelEditor() {
      this.printScreen = this.editMode === 'ar' ? 'ar' : 'device'
      return true
    },
    /** 编辑器「完成」：AR 进第 3 步确认；普通照片直接入队 */
    confirmEditor() {
      if (this.editMode === 'ar') {
        this.arStep = 3
        this.printScreen = 'ar'
        return true
      }
      return this.addToQueue()
    },

    /* ---- 打印队列（归档：计数 + 单项，可反复累积）---- */
    addToQueue() {
      if (this.queueFull) {
        this.notice = { code: 'printQueueFull', params: { n: QUEUE_MAX } }
        return false
      }
      this.queueCount += 1
      // 归档入队后会把队列项复位成「未发送」，状态文案回到「高清 · 标准色彩」
      this.queueSending = false
      this.queuePhase = 'idle'
      this.printScreen = 'device'
      this.notice = { code: 'printQueued' }
      return true
    },
    removeQueue() {
      if (!this.queueCount) return false
      this.queueCount = 0
      this.queueSending = false
      this.queuePhase = 'idle'
      this.notice = { code: 'printRemoved' }
      return true
    },

    /* ---- 打印进度模态（归档 `progress-modal`）---- */
    /**
     * 开始打印。归档 `startPrint(kind)` 做的是：回设备页、把队列项置成
     * 「正在后台打印」、4.8 秒后翻成完成文案、弹一条 toast。
     * 归档另外还写了一整套进度模态（进度数字 / 三段阶段文案 / 暂停取消 / 完成态），
     * 但 `progress-modal` 的 `open` 类**任何地方都没加过** ⇒ 那套 UI 点不到。
     * 这里把它接上：开始打印同时打开模态，后台文案流转照旧。
     */
    startPrint(kind = 'photo') {
      if (!['photo', 'ar'].includes(kind)) return false
      // 归档 `startPrint` 的第一句就是 `queueCount = 1`（AR 第 3 步也是从这句起来的）
      if (!this.queueCount) this.queueCount = 1
      this.printKind = kind
      this.queueKind = kind
      this.queueSending = true
      this.queuePhase = 'printing'
      this.printProgress = 0
      this.printPaused = false
      this.printDone = false
      this.printModalOpen = true
      this.printScreen = 'device'
      this.notice = { code: kind === 'ar' ? 'printArStarted' : 'printStarted' }
      return true
    },
    /** 由进度模态的定时器驱动；返回是否还在推进 */
    tickPrint() {
      if (!this.printModalOpen || this.printPaused || this.printDone) return false
      this.printProgress = Math.min(100, this.printProgress + PRINT_STEP)
      if (this.printProgress >= 100) this.completePrint()
      return !this.printDone
    },
    togglePrintPause() {
      if (this.printDone) return false
      this.printPaused = !this.printPaused
      this.notice = { code: this.printPaused ? 'printPaused' : 'printResumed' }
      return true
    },
    /** 后台那一单跑完（归档 `startPrint` 里 4.8 秒的 setTimeout） */
    settleQueue() {
      if (!this.queueSending) return false
      this.queueSending = false
      this.queuePhase = 'done'
      this.notice = { code: this.queueKind === 'ar' ? 'printArDone' : 'printDone' }
      return true
    },
    completePrint() {
      this.printDone = true
      this.printProgress = 100
      this.queueSending = false
      this.queuePhase = 'done'
      return true
    },
    /**
     * 取消：关掉模态并把队列那一单也撤掉。
     * ⚠️ 归档这里只做了 `clearInterval + 关模态 + toast`，后台那个 `setTimeout`
     * 仍然会跑完并翻成「打印完成」—— 那是死代码留下的缝，这里补上（一起撤）。
     */
    cancelPrint() {
      this.printModalOpen = false
      this.printDone = false
      this.printProgress = 0
      this.printPaused = false
      this.queueCount = 0
      this.queueSending = false
      this.queuePhase = 'idle'
      this.notice = { code: 'printCanceled' }
      return true
    },
    /** 完成态按钮：AR 转去相机扫描模式；普通照片清队列回设备页 */
    finishPrint() {
      const kind = this.printKind
      this.printModalOpen = false
      this.printDone = false
      this.printProgress = 0
      this.printPaused = false
      this.queueCount = 0
      this.queueSending = false
      this.queuePhase = 'idle'
      if (kind === 'ar') {
        this.cameraReturn = 'device'
        this.cameraMode = 'scan'
        this.cameraPlaying = false
        this.printScreen = 'camera'
      } else {
        this.printScreen = 'device'
      }
      return true
    },

    /* ---- 设备管理（归档 settings-panel）---- */
    setPrintQuality(q) {
      if (!PRINT_QUALITIES.includes(q)) return false
      this.printQuality = q
      this.notice = { code: 'printSettingSaved' }
      return true
    },
    setPrintColor(c) {
      if (!PRINT_COLORS.includes(c)) return false
      this.printColor = c
      this.notice = { code: 'printSettingSaved' }
      return true
    },
    /** 归档 `renameDevice`：改名同步所有 `.js-device-name`（本仓即设备昵称） */
    renamePrinter(name) {
      const d = this.printDevice
      if (!d) return false
      d.nick = String(name ?? '').trim()
      this.notice = { code: 'printRenamed' }
      return true
    },
    /** 归档 `upgradeFirmware`：0 → 100、每档 20；节奏由组件驱动 */
    setFwProgress(p) {
      const n = Math.round(Number(p))
      if (!Number.isFinite(n) || n < 0 || n > 100) return false
      this.fwProgress = n
      if (n >= 100) this.notice = { code: 'printFwDone' }
      return true
    },
    /** 归档「购买相纸」只弹一条提示，不改余量 */
    buyPaper() {
      this.notice = { code: 'paperGuide' }
      return true
    },

    /* ---- 相机（归档 camera-screen：拍照 / AR 扫描）---- */
    openCamera() {
      if (this.printScreen && this.printScreen !== 'camera') this.cameraReturn = this.printScreen
      this.editMode = 'photo'
      this.cameraMode = 'photo'
      this.cameraPlaying = false
      this.printScreen = 'camera'
      return true
    },
    openARCamera() {
      this.cameraReturn = 'ar'
      this.editMode = 'ar'
      this.cameraMode = 'photo'
      this.cameraPlaying = false
      this.printScreen = 'camera'
      return true
    },
    closeCamera() {
      this.cameraPlaying = false
      this.printScreen = this.cameraReturn
      return true
    },
    setCameraMode(m) {
      if (!CAMERA_MODES.includes(m)) return false
      this.cameraMode = m
      this.cameraPlaying = false
      return true
    },
    /**
     * 归档 `simulateScan` 一个函数管两条路：
     *   拍照模式 → 「照片拍摄完成」+ 500ms 后进编辑器
     *   扫描模式 → 「已识别 AR 锚点」+ 450ms 后开始播放
     * 延迟在组件里，store 只落状态，所以这里拆成三个动作。
     */
    shootPhoto() {
      this.arCoverSelected = this.editMode === 'ar'
      this.notice = { code: 'printShot' }
      return true
    },
    enterEditorFromCamera() {
      this.resetEdit(false)
      this.printScreen = 'editor'
      return true
    },
    /** 归档 `simulateScan` 的扫描分支第一句：只弹「已识别 AR 锚点」 */
    beginArScan() {
      this.notice = { code: 'printArLocked' }
      return true
    },
    /** 450ms 后取景器进入播放（归档 `viewfinder.classList.add('playing')`） */
    setCameraPlaying(on) {
      this.cameraPlaying = !!on
      return this.cameraPlaying
    },

    /* ---- AR 视频打印（归档 ar-screen 三步向导）---- */
    openAR() {
      this.arStep = 1
      this.arVideoSelected = false
      this.arVideoPlaying = false
      this.arCoverSelected = false
      this.arTrimStart = AR_VIDEO.trimStart
      this.arTrimEnd = AR_VIDEO.trimEnd
      this.printScreen = 'ar'
      return true
    },
    closeAR() {
      this.printScreen = 'device'
      return true
    },
    selectArVideo() {
      this.arVideoSelected = true
      this.notice = { code: 'printVideoPicked' }
      return true
    },
    changeArVideo() {
      this.arVideoSelected = false
      this.arVideoPlaying = false
      return true
    },
    toggleArPlay() {
      this.arVideoPlaying = !this.arVideoPlaying
      this.notice = { code: this.arVideoPlaying ? 'printVideoPlaying' : 'printVideoPaused' }
      return true
    },
    /** 关联封面照片：归档 `selectARPhoto` 也是单选 */
    selectArCover(id) {
      if (!PRINTER_PHOTOS.some((p) => p.id === id)) return false
      this.selectedPhotoId = id
      this.arCoverSelected = true
      return true
    },
    nextARStep() {
      if (this.arStep === 1) {
        if (!this.arVideoSelected) return false
        this.arStep = 2
        return true
      }
      if (this.arStep === 2) {
        if (!this.arCoverSelected) return false
        this.editMode = 'ar'
        this.resetEdit(false)
        this.printScreen = 'editor'
        return true
      }
      return this.startPrint('ar')
    },
    /** AR 裁剪区间（秒） */
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
    }
  }
})
