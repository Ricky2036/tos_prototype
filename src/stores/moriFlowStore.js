/**
 * AI Mori 流程 store（独立于 aiMateStore）
 * ==========================================
 * 权威实现：`~/Downloads/AI Mate归档/ai_mori_interactive_prototype(3).html`
 * 集成规格：`/tmp/aimate/specs/mori.md`
 *
 * 设计边界（对照规格 §8.1 / §8.2）：
 *  - 本 store 只承载「AI Mori 这台随身 AI 相机」的能力：初始化向导 / 主屏 4 tab
 *    （创作·空间·录音·设备）/ 实时预览 / 录音与转写 / 设备素材 / 每日 Vlog /
 *    AI 艺术馆 / AI 图文日记 / 固件升级 / 日历视图 / 空间选日 / 3 个折叠面板 / 音频播放条。
 *  - 归档的 `#home`（手写的 AI Mate 设备列表 + 底部 tabbar）与假状态栏是**演示外壳**，
 *    本仓已有真货，一律不进这里。Mori 自己**没有底部导航**，用的是顶部 4 段式 `.dtabs`。
 *  - **计时器不放在 store 里**：store 只提供「推进一格」的纯 action
 *    （tickRec / tickOta / advanceInit），由 `MoriFlow.vue` 持有 setInterval 并在
 *    onBeforeUnmount 全清。
 *  - 界面文案一律以 i18n key 暴露（组件用 `t()` 渲染）；内容数据留在这里。
 *
 * 🔴 归档的 5 处硬缺陷，这里逐条**不重放**（规格 §6.4 / §6.5）：
 *  1. `.player-bar{display:flex}` 写在 `.hidden{display:none}` 之后 ⇒ 播放条永远可见、
 *     `stopAudio()` 无效。这里用 `player: null` + 模板 `v-if`，关闭一定生效。
 *  2. `#body-settings` 被 `max-height:600px` 裁掉 108px（实测 708 vs 600）⇒「隐私」组
 *     永远看不全。这里用 `grid-template-rows: 0fr → 1fr` 过渡，高度自适应不裁切。
 *  3. `.storage/.fill` 在归档样式表里**完全没有定义** ⇒ OTA 进度条不可见。这里补齐样式，
 *     并让「开始升级」真的推进进度。
 *  4. `hasContent` 声明 13 天有素材，而 `spaceData` 只有 4 天 ⇒ 点 1/5/7 等日出「有素材」
 *     点却显示「当天无素材」。这里**由 `MORI_SPACE_DATA` 反推**有素材的日子。
 *  5. `selectDay()` 把所有非空格子的渐变换成同一条紫 ⇒ 丢失素材色彩区分。这里把渐变
 *     提进数据（`tone` 字段），静态与动态两套渲染统一以 `MORI_SPACE_DATA` 为准。
 *  另：归档把 emoji 剥离得只剩 `U+FE0F`（如「️ 设备」「️ 美食」）⇒ 这里全部换 `LIcon` / 纯文本。
 */
import { defineStore } from 'pinia'
import { MORI_FLOW } from '../locales/mori-flow.js'
import { useI18nStore } from './i18nStore.js'

/* ============================================================
 * 渐变调色板（照抄归档静态 DOM 里 4 组渐变 + 空格子的灰）
 * ============================================================ */
export const MORI_TONES = {
  purple: 'linear-gradient(135deg,#a29bfe,#6c5ce7)',
  gray: 'linear-gradient(135deg,#dfe6e9,#b2bec3)',
  blue: 'linear-gradient(135deg,#74b9ff,#0984e3)',
  peach: 'linear-gradient(135deg,#fdcb6e,#e17055)',
  pink: 'linear-gradient(135deg,#fd79a8,#e84393)',
  green: 'linear-gradient(135deg,#55efc8,#00b894)',
  teal: 'linear-gradient(135deg,#81ecec,#00cec9)',
  dark: 'linear-gradient(135deg,#636e72,#2d3436)',
  sand: 'linear-gradient(135deg,#ffeaa7,#fdcb6e)'
}

/* ============================================================
 * 日历（归档 §3.1 buildCal 的硬编码参数）
 * ⚠️ 「月份」是假的：写死 2027 年 2 月 28 天，不按月算
 * ============================================================ */
export const MORI_CAL = {
  year: 2027,
  month: 2,
  startDay: 1, // 前面补 1 个空格子（2/1 落在「一」列）
  totalDays: 28,
  today: 14, // 写死「今天」= 2/14
  weekdays: ['日', '一', '二', '三', '四', '五', '六']
}

/* ============================================================
 * 空间 tab · 素材（归档 §3.1 spaceData，只有 4 天有数据）
 * items 恒为 3 格（每行 3 格、不满留空）；count 才是真实素材数
 * ============================================================ */
export const MORI_SPACE_DATA = {
  14: {
    titleKey: 'space.title14',
    events: [
      {
        locKey: 'space.ev14a',
        count: 3,
        items: [
          { icon: 'film', tone: 'purple' },
          { icon: 'image', tone: 'gray' },
          { icon: 'film', tone: 'blue' }
        ]
      },
      {
        locKey: 'space.ev14b',
        count: 2,
        items: [
          { icon: 'film', tone: 'peach' },
          { icon: 'image', tone: 'purple' },
          null
        ]
      }
    ]
  },
  13: {
    titleKey: 'space.title13',
    events: [
      {
        locKey: 'space.ev13',
        count: 2,
        items: [
          { icon: 'film', tone: 'blue' },
          { icon: 'image', tone: 'sand' },
          null
        ]
      }
    ]
  },
  12: {
    titleKey: 'space.title12',
    events: [
      {
        locKey: 'space.ev12',
        count: 1,
        items: [{ icon: 'image', tone: 'gray' }, null, null]
      }
    ]
  },
  10: {
    titleKey: 'space.title10',
    events: [
      {
        locKey: 'space.ev10',
        count: 2,
        items: [
          { icon: 'film', tone: 'teal' },
          { icon: 'image', tone: 'pink' },
          null
        ]
      }
    ]
  }
}

/** 有素材的日子（由 spaceData 反推 —— 修归档「13 天有素材点但只有 4 天有内容」的矛盾） */
export const MORI_HAS_CONTENT = Object.keys(MORI_SPACE_DATA).map(Number)

/* ============================================================
 * 创作 tab · 卡片（归档 §3.2 CREATE_CARDS）
 * ============================================================ */
export const MORI_CREATE_CARDS = [
  {
    kind: 'vlog',
    screen: 'vlog',
    thumb: { bg: 'linear-gradient(135deg,#6c5ce7,#fd79a8)', height: 220, pillKey: 'create.vlogPill', play: true, durKey: 'create.vlogDur' },
    titleKey: 'create.vlogTitle',
    descKey: 'create.vlogDesc',
    tagKeys: ['create.vlogTag1', 'create.vlogTag2', 'create.vlogTag3']
  },
  {
    kind: 'gallery',
    screen: 'gallery',
    thumb: { bg: 'linear-gradient(135deg,#00b894,#00cec9)', height: 200, pillKey: 'create.galleryPill', icon: 'palette', iconSize: 64 },
    titleKey: 'create.galleryTitle',
    descKey: 'create.galleryDesc',
    tagKeys: ['create.galleryTag1', 'create.galleryTag2']
  },
  {
    kind: 'diary',
    screen: 'diary',
    dateKey: 'create.diaryDate',
    textKey: 'create.diaryText',
    tagKeys: ['create.diaryTag1', 'create.diaryTag2', 'create.diaryTag3'],
    /* 日记配图在归档里就是「渐变底 + emoji」两个字的方形，没有图标位 */
    imgs: [
      { text: '🏢', bg: 'linear-gradient(135deg,#dfe6e9,#b2bec3)' },
      { text: '🍜', bg: 'linear-gradient(135deg,#ffeaa7,#fdcb6e)' },
      { text: '🌅', bg: 'linear-gradient(135deg,#fab1a0,#e17055)' }
    ]
  },
  {
    kind: 'vlog',
    screen: 'vlog',
    thumb: { bg: 'linear-gradient(135deg,#636e72,#2d3436)', height: 200, pillKey: 'create.vlogPill', play: true, durKey: 'create.vlog2Dur' },
    titleKey: 'create.vlog2Title',
    descKey: 'create.vlog2Desc',
    tagKeys: ['create.vlog2Tag1', 'create.vlog2Tag2']
  }
]

/** 日历视图下的两张精简卡（缩略图 160px，play 44px） */
export const MORI_CREATE_CAL_CARDS = [
  {
    screen: 'vlog',
    bg: 'linear-gradient(135deg,#6c5ce7,#fd79a8)',
    height: 160,
    pillKey: 'create.vlogPill',
    play: true,
    playSize: 44,
    titleKey: 'cal.vlogTitle',
    descKey: 'cal.vlogDesc'
  },
  {
    screen: 'gallery',
    bg: 'linear-gradient(135deg,#00b894,#00cec9)',
    height: 160,
    pillKey: 'create.galleryPill',
    icon: 'palette',
    iconSize: 48,
    titleKey: 'cal.galleryTitle',
    descKey: 'cal.galleryDesc'
  }
]

/* ============================================================
 * 录音 tab · 5 条录音（归档 §3.2 AUDIO_ITEMS）
 * 第 4 条是「转写中」中间态，且 aico 内没有图标
 * ============================================================ */
export const MORI_AUDIO_ITEMS = [
  { titleKey: 'recordList.item0.title', metaKey: 'recordList.item0.meta', aico: 'linear-gradient(135deg,#fd79a8,#e84393)', icon: 'micVocal', tail: 'arrow' },
  { titleKey: 'recordList.item1.title', metaKey: 'recordList.item1.meta', aico: 'linear-gradient(135deg,#74b9ff,#0984e3)', icon: 'micVocal', tail: 'arrow' },
  { titleKey: 'recordList.item2.title', metaKey: 'recordList.item2.meta', aico: 'linear-gradient(135deg,#55efc8,#00b894)', icon: 'micVocal', tail: 'arrow' },
  { titleKey: 'recordList.item3.title', metaKey: 'recordList.item3.meta', aico: 'linear-gradient(135deg,#ffeaa7,#fdcb6e)', icon: '', tail: 'hourglass' },
  { titleKey: 'recordList.item4.title', metaKey: 'recordList.item4.meta', aico: 'linear-gradient(135deg,#dfe6e9,#b2bec3)', icon: 'micVocal', tail: 'arrow' }
]

/* ============================================================
 * 设备素材屏（归档 §3.2 MEDIA_DAYS）—— 2 天，共 9 张
 * 归档里两个 mthumb 的 emoji 被剥离 ⇒ 这里用中性图标
 * ============================================================ */
export const MORI_MEDIA_DAYS = [
  {
    dateKey: 'media.date1',
    items: [
      { icon: 'film', bg: 'linear-gradient(135deg,#a29bfe,#6c5ce7)', toast: 'toast.previewVideo' },
      { icon: 'image', bg: 'linear-gradient(135deg,#dfe6e9,#b2bec3)', toast: 'toast.previewPhoto' },
      { icon: 'micVocal', bg: 'linear-gradient(135deg,#fd79a8,#e84393)', toast: 'toast.playAudio' },
      { icon: 'film', bg: 'linear-gradient(135deg,#74b9ff,#0984e3)', toast: 'toast.previewVideo' },
      { icon: 'image', bg: 'linear-gradient(135deg,#ffeaa7,#fdcb6e)', toast: 'toast.previewPhoto' },
      { icon: 'micVocal', bg: 'linear-gradient(135deg,#55efc8,#00b894)', toast: 'toast.playAudio' }
    ]
  },
  {
    dateKey: 'media.date2',
    items: [
      { icon: 'film', bg: 'linear-gradient(135deg,#636e72,#2d3436)', toast: 'toast.previewVideo' },
      { icon: 'image', bg: 'linear-gradient(135deg,#fab1a0,#e17055)', toast: 'toast.previewPhoto' },
      { icon: 'film', bg: 'linear-gradient(135deg,#81ecec,#00cec9)', toast: 'toast.previewVideo' }
    ]
  }
]

/** 设备素材折叠面板的 3 行（归档 §3.2 MEDIA_BREAKDOWN） */
export const MORI_MEDIA_BREAKDOWN = [
  { icon: 'film', labelKey: 'device.mediaVideo', tailKey: 'device.mediaVideoSub' },
  { icon: 'image', labelKey: 'device.mediaPhoto', tailKey: 'device.mediaPhotoSub' },
  { icon: 'micVocal', labelKey: 'device.mediaAudio', tailKey: 'device.mediaAudioSub' }
]

/* ============================================================
 * 拍摄与同步设置（归档 §3.2 SETTINGS_GROUPS）
 * 3 个分组标题 + 11 行，其中 5 个 toggle
 * ============================================================ */
export const MORI_SETTINGS_GROUPS = [
  {
    titleKey: 'device.groupAuto',
    rows: [
      { labelKey: 'capture.interval', valKey: 'capture.intervalVal' },
      { labelKey: 'capture.clipLength', valKey: 'capture.clipLengthVal' },
      { labelKey: 'capture.aspect', valKey: 'capture.aspectVal' },
      { labelKey: 'capture.orientation', valKey: 'capture.orientationVal' },
      { labelKey: 'capture.autoDetect', toggle: 'autoDetect' }
    ]
  },
  {
    titleKey: 'device.groupSync',
    rows: [
      { labelKey: 'sync.wifi', toggle: 'wifi' },
      { labelKey: 'sync.cellular', toggle: 'cellular' },
      { labelKey: 'sync.deleteLocal', toggle: 'deleteLocal' },
      { labelKey: 'sync.cloudDelete', valKey: 'sync.cloudDeleteVal' }
    ]
  },
  {
    titleKey: 'device.groupPrivacy',
    rows: [
      { labelKey: 'privacy.cloudAI', toggle: 'cloudAI' },
      { labelKey: 'privacy.voiceprint', valKey: 'privacy.voiceprintVal' }
    ]
  }
]

/** 7 个开关的初始态（照抄归档 HTML 里 `class="toggle on"` 的分布） */
export const MORI_SETTINGS_INIT = {
  autoDetect: true,
  wifi: true,
  cellular: false,
  deleteLocal: false,
  cloudAI: true
}

/** 设备信息（归档 §3.2 DEVICE_INFO） */
export const MORI_DEVICE_INFO = [
  { labelKey: 'info.model', val: 'AI mori Gen1' },
  { labelKey: 'info.firmware', val: 'V1.2.0' },
  { labelKey: 'info.serial', val: 'AM2027010001' },
  { labelKey: 'info.bluetooth', val: 'XX:XX:XX:12:34:56' },
  { labelKey: 'info.wifi', val: 'XX:XX:XX:65:43:21' }
]

/* ============================================================
 * 初始化向导 3 步（归档 §3.2 INIT_STEPS）
 * ⚠️ s2 的两个按钮**都**进第 3 步；s1 的次要按钮不可跳过
 * ============================================================ */
export const MORI_INIT_STEPS = [
  {
    id: 1,
    icon: 'cloud',
    titleKey: 'init.s1.title',
    descKey: 'init.s1.desc',
    primaryKey: 'init.s1.primary',
    secondaryKey: 'init.s1.secondary',
    secondaryBlocked: true // 点次要按钮 → toast('此选项不可跳过')，不切步
  },
  {
    id: 2,
    icon: 'router',
    titleKey: 'init.s2.title',
    descKey: 'init.s2.desc',
    desc2Key: 'init.s2.desc2',
    primaryKey: 'init.s2.primary',
    secondaryKey: 'init.s2.secondary'
  },
  {
    id: 3,
    icon: 'wifi',
    titleKey: 'init.s3.title',
    descKey: 'init.s3.desc',
    primaryKey: 'init.done'
  }
]

/** s3 的 Wi-Fi 列表（归档 §3.2 INIT_STEPS[2].wifiList） */
export const MORI_WIFI_LIST = [
  { ssidKey: 'wifi.net1', tailKey: 'wifi.connected', tone: 'ok', icon: 'wifi' },
  { ssidKey: 'wifi.net2', tailKey: 'wifi.available', tone: 'val', icon: '' },
  { ssidKey: 'wifi.net3', tailKey: 'wifi.available', tone: 'val', icon: 'wifi' }
]

/* ============================================================
 * 各子屏的静态数据
 * ============================================================ */
/** 录音屏（归档 §3.2 REC_PAGE）—— 计时从 00:02:18 起真的走秒（修归档「写死不走」） */
export const MORI_REC = {
  seconds: 138, // 00:02:18
  transcript: [
    { spk: 1, time: '00:01:02', txtKey: 'rec.txt1' },
    { spk: 2, time: '00:01:35', txtKey: 'rec.txt2' }
  ]
}

/** 固件升级屏（归档 §3.2 OTA_PAGE） */
export const MORI_OTA = {
  version: 'V1.3.0',
  current: 'V1.2.0',
  changelogKeys: ['ota.cl1', 'ota.cl2', 'ota.cl3'],
  size: '12MB',
  /** 归档 width:0% 且 `.storage/.fill` 无样式 ⇒ 进度条不可见。这里给真实进度。 */
  stepMs: 60,
  stepPct: 2
}

/** 每日 Vlog 屏（归档 §3.2 VLOG_PAGE） */
export const MORI_VLOG = {
  cover: { bg: 'linear-gradient(135deg,#6c5ce7,#fd79a8)', height: 280 },
  dateKey: 'vlog.date',
  descKey: 'vlog.desc',
  sceneKeys: ['vlog.scene1', 'vlog.scene2', 'vlog.scene3']
}

/** AI 艺术馆屏（归档 §3.2 GALLERY_PAGE） */
export const MORI_GALLERY = {
  icon: 'palette',
  headlineKey: 'gallery.headline',
  subKey: 'gallery.desc',
  poster: { bg: 'linear-gradient(135deg,#00b894,#00cec9)', height: 200, icon: 'images' },
  textKey: 'gallery.text'
}

/** AI 图文日记屏（归档 §3.2 DIARY_PAGE）—— 正文与创作 tab 的日记卡复用同一个 key */
export const MORI_DIARY = {
  dateKey: 'diary.date',
  textKey: 'create.diaryText',
  tagKeys: ['diary.tag1', 'diary.tag2', 'diary.tag3'],
  imgs: MORI_CREATE_CARDS[2].imgs
}

/** 播放条波形 5 条的动画延迟（归档 §4.10 内联 0/.1/.2/.3/.4s） */
export const MORI_PLAYER_BARS = [0, 0.1, 0.2, 0.3, 0.4]

/** 录音屏波形的 5 条延迟（归档 §5.2 `.bar:nth-child(2..5)`） */
export const MORI_WAVE_BARS = [0, 0.1, 0.2, 0.3, 0.4]

/* ============================================================
 * 工具函数
 * ============================================================ */
/** 秒 → `MM:SS`（超 1 小时 → `H:MM:SS`） */
export function formatClock(total) {
  const s = Math.max(0, Math.floor(total))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/** 本仓 i18n 没有插值机制 ⇒ 在这里补一个 */
export function fill(str, params) {
  if (!str || !params) return str
  return Object.keys(params).reduce((acc, k) => acc.split(`{${k}}`).join(String(params[k])), str)
}

/**
 * ASCII 数字 → 孟加拉数字字形。
 * 与同批产物 `recorder-flow.js` 对齐：那边 bn 段的静态数字就写作 `১৫+` / `৫০৭টি`，
 * 所以插值进来的数字也要同字形，否则一句里会混两套数字。
 */
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
export function bengaliDigits(v) {
  return String(v).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

export const useMoriFlowStore = defineStore('moriFlow', {
  state: () => ({
    /** 流程是否打开（组件由 AimateApp 的 `mate.deviceFlow === 'mori'` 控制）。
     *  ⚠️ 不能叫 `open`：Pinia 里 state 的 `open` 会和 action `open()` 撞名，
     *  `this.open = true` 会把 action 覆盖成布尔值，重进流程时 `store.open()` 就是 not a function。 */
    active: false,
    /** 当前屏：init 向导 / detail 主屏 / preview / rec / media / vlog / gallery / diary / ota */
    screen: 'detail',
    /** detail 的 4 个 tab：create / space / record / device */
    tab: 'create',
    /** 创作 tab 的日历视图（与列表互斥） */
    createCal: false,
    /** 空间 tab 当前选中日 */
    selectedDay: 14,
    /** 3 个折叠面板 */
    collapsed: { media: false, settings: false, info: false },
    /** 播放中的录音名（null = 隐藏；**用 v-if，修归档 playerBar 永远可见的缺陷**） */
    player: null,
    /** 预览页快门态（录制中方块） */
    shutterRec: false,
    /** 录音屏：已录秒数 / 是否暂停 */
    recSeconds: MORI_REC.seconds,
    recPaused: false,
    /** 初始化向导当前步骤 1/2/3 */
    initStep: 1,
    /** 固件升级进度 0-100 */
    otaProgress: 0,
    otaRunning: false,
    /** 5 个开关的真实状态（归档是纯视觉，无业务状态） */
    settings: { ...MORI_SETTINGS_INIT },
    /** 当前 toast：{ key, params, seq } */
    toast: null,
    toastSeq: 0
  }),

  getters: {
    /** 当前 App 语言（读 i18n store，随语言切换响应） */
    locale: () => useI18nStore().locale,

    /** 词条取值（扁平 key，如 `create.vlogTitle`） */
    t() {
      return (key) => MORI_FLOW[this.locale]?.[key] ?? MORI_FLOW.zh[key] ?? key
    },

    /**
     * 带占位符的词条。
     * ⚠️ 孟加拉数字字形：只转**数值型**参数（`{n}` / `{day}` / `{year}`），
     *    版本号这类字符串参数（`{ver}` = 'V1.2.0'）保持 ASCII —— 本地化里版本号不转字形。
     */
    tf() {
      return (key, params) => {
        if (!params) return this.t(key)
        const p = {}
        for (const k of Object.keys(params)) {
          p[k] = this.locale === 'bn' && typeof params[k] === 'number'
            ? bengaliDigits(params[k])
            : params[k]
        }
        return fill(this.t(key), p)
      }
    },

    /** 日历格子：前 startDay 个为空格，随后 1..totalDays */
    calCells() {
      const cells = []
      for (let i = 0; i < MORI_CAL.startDay; i += 1) cells.push(null)
      for (let d = 1; d <= MORI_CAL.totalDays; d += 1) cells.push(d)
      return cells
    },

    /** 有素材的日子（由 spaceData 反推，修归档 hasContent 的矛盾） */
    hasContentDays: () => MORI_HAS_CONTENT,

    /** 当前选中日的素材 */
    selectedDayData() {
      return MORI_SPACE_DATA[this.selectedDay] || null
    },

    /** 选中日的标题（无数据时是「2月N日」） */
    selectedDayTitle() {
      const data = this.selectedDayData
      // ⚠️ 必须带上 month：en/bn 的模板里有 {month}，只传 day 会漏出裸占位符
      return data ? this.t(data.titleKey) : this.tf('cal.monthDay', { month: MORI_CAL.month, day: this.selectedDay })
    },

    /** 录音屏计时文本（从 00:02:18 起真的走秒） */
    recTimeText() {
      return formatClock(this.recSeconds)
    },

    /** 播放条是否可见（**v-if 用**） */
    playerVisible() {
      return !!this.player
    },

    /** OTA 是否在跑 */
    otaBusy() {
      return this.otaRunning
    },

    /** 当前屏是不是 detail（决定 header 返回键的行为） */
    isRoot() {
      return this.screen === 'detail'
    }
  },

  actions: {
    /* ---------------- 生命周期 ---------------- */
    open() {
      this.active = true
      this.screen = 'detail'
    },
    close() {
      this.active = false
      this.reset()
    },
    reset() {
      this.screen = 'detail'
      this.tab = 'create'
      this.createCal = false
      this.selectedDay = MORI_CAL.today
      this.collapsed = { media: false, settings: false, info: false }
      this.player = null
      this.shutterRec = false
      this.recSeconds = MORI_REC.seconds
      this.recPaused = false
      this.initStep = 1
      this.otaProgress = 0
      this.otaRunning = false
      this.settings = { ...MORI_SETTINGS_INIT }
      this.toast = null
    },

    /* ---------------- 导航 ---------------- */
    goto(screen) {
      if (!['init', 'detail', 'preview', 'rec', 'media', 'vlog', 'gallery', 'diary', 'ota'].includes(screen)) return false
      this.screen = screen
      if (screen !== 'rec') this.recPaused = false
      return true
    },
    /** 子屏返回主屏（归档里所有子屏的 back 都回 detail；init 的 back 回外壳 → 这里也回 detail） */
    back() {
      if (this.screen === 'detail') return false
      this.screen = 'detail'
      this.recPaused = false
      return true
    },
    setTab(t) {
      if (!['create', 'space', 'record', 'device'].includes(t)) return false
      this.tab = t
      return true
    },

    /* ---------------- 创作 tab ---------------- */
    toggleCal() {
      this.createCal = !this.createCal
      return this.createCal
    },

    /* ---------------- 空间 tab ---------------- */
    selectDay(day) {
      if (!Number.isInteger(day) || day < 1 || day > MORI_CAL.totalDays) return false
      this.selectedDay = day
      return true
    },

    /* ---------------- 折叠面板 ---------------- */
    toggleCollapse(id) {
      if (!(id in this.collapsed)) return false
      this.collapsed[id] = !this.collapsed[id]
      return this.collapsed[id]
    },

    /* ---------------- 音频播放条 ---------------- */
    playAudio(title) {
      this.player = title
    },
    stopAudio() {
      this.player = null
    },

    /* ---------------- 预览页快门 ---------------- */
    toggleShutter() {
      this.shutterRec = !this.shutterRec
      return this.shutterRec
    },

    /* ---------------- 录音屏计时（由组件驱动） ---------------- */
    tickRec() {
      if (this.screen !== 'rec' || this.recPaused) return false
      this.recSeconds += 1
      return true
    },
    toggleRecPause() {
      this.recPaused = !this.recPaused
      return this.recPaused
    },

    /* ---------------- 初始化向导 ---------------- */
    startInit() {
      this.initStep = 1
      this.screen = 'init'
    },
    initNext() {
      if (this.initStep >= 3) return false
      this.initStep += 1
      return true
    },
    finishInit() {
      this.screen = 'detail'
      this.initStep = 1
    },

    /* ---------------- 固件升级 ---------------- */
    startOta() {
      if (this.otaRunning) return false
      this.otaProgress = 0
      this.otaRunning = true
      return true
    },
    /** 推进一格（由组件按 MORI_OTA.stepMs 驱动）；到 100 自动停 */
    tickOta() {
      if (!this.otaRunning) return false
      this.otaProgress = Math.min(100, this.otaProgress + MORI_OTA.stepPct)
      if (this.otaProgress >= 100) this.otaRunning = false
      return true
    },

    /* ---------------- 设置开关 ---------------- */
    toggleSetting(key) {
      if (!(key in this.settings)) return false
      this.settings[key] = !this.settings[key]
      return this.settings[key]
    },

    /* ---------------- toast（本仓由流程自持，规格 §8.2 允许；与 RecorderFlow 同构） ---------------- */
    notify(key, params = null) {
      this.toastSeq += 1
      this.toast = { key, params, seq: this.toastSeq }
    },
    clearToast() {
      this.toast = null
    }
  }
})
