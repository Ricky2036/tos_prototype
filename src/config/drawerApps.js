/**
 * 传音 / Infinix 旗舰应用抽屉全量应用元数据与 A-Z 拼音索引配置
 * 100% 对应桌面真实安装的 19 个系统应用，单一事实来源
 */

export const DRAWER_APPS = [
  // ── 4 个常用置顶应用（对齐桌面 Dock 核心应用） ──
  {
    id: 'phone',
    name: '电话',
    initial: 'D',
    pinyin: 'dianhua',
    pinned: true,
    depth: 'core',
    heroBackground: 'linear-gradient(180deg,#20D759 0%,#12B83F 100%)',
    image: '/icons/phone.png',
    icon: '/icons/phone.png',
    dock: true
  },
  {
    id: 'messages',
    name: '信息',
    initial: 'X',
    pinyin: 'xinxi',
    pinned: true,
    depth: 'core',
    heroBackground: 'linear-gradient(180deg,#28DF61 0%,#13B943 100%)',
    image: '/icons/messages.png',
    icon: '/icons/messages.png',
    dock: true
  },
  {
    id: 'safari',
    name: '浏览器',
    initial: 'L',
    pinyin: 'liulanqi',
    pinned: true,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#22B8F5 0%,#0A78F0 100%)',
    image: '/icons/safari.png',
    icon: '/icons/safari.png',
    dock: true
  },
  {
    id: 'camera',
    name: '相机',
    initial: 'X',
    pinyin: 'xiangji',
    pinned: true,
    depth: 'core',
    heroBackground: 'linear-gradient(180deg,#F0F0F2 0%,#D6D6DA 100%)',
    image: '/icons/camera.png',
    icon: '/icons/camera.png',
    dock: true
  },

  // ── D ──
  // phone (pinned, 电话)

  // ── J ──
  {
    id: 'calculator',
    name: '计算器',
    initial: 'J',
    pinyin: 'jisuanqi',
    depth: 'placeholder',
    heroBackground: '#ECECEF',
    image: '/icons/calculator.png',
    icon: '/icons/calculator.png',
    page: 0
  },
  {
    id: 'fitness',
    name: '健身',
    initial: 'J',
    pinyin: 'jianshen',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#F8C61B 0%,#EFA500 100%)',
    image: '/icons/fitness.png',
    icon: '/icons/fitness.png',
    page: 0
  },
  {
    id: 'notes',
    name: '记事本',
    initial: 'J',
    pinyin: 'jishiben',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#FFD33A 0%,#F4AA00 100%)',
    image: '/icons/notes.png',
    icon: '/icons/notes.png',
    page: 0
  },

  // ── L ──
  // safari (pinned, 浏览器)
  {
    id: 'voicememos',
    name: '录音机',
    initial: 'L',
    pinyin: 'luyinji',
    depth: 'core',
    heroBackground: 'linear-gradient(180deg,#F65A62 0%,#E82636 100%)',
    image: '/icons/voicememos.png',
    icon: '/icons/voicememos.png',
    page: 0
  },

  // ── R ──
  {
    id: 'calendar',
    name: '日历',
    initial: 'R',
    pinyin: 'rili',
    depth: 'core',
    heroBackground: '#F7F7F8',
    special: 'calendar',
    icon: '/icons/calendar.png',
    page: 0
  },

  // ── S ──
  {
    id: 'clock',
    name: '时钟',
    initial: 'S',
    pinyin: 'shizhong',
    depth: 'core',
    heroBackground: '#1C1C1E',
    special: 'clock',
    icon: '/icons/clock.png',
    page: 0
  },
  {
    id: 'settings',
    name: '设置',
    initial: 'S',
    pinyin: 'shezhi',
    depth: 'core',
    heroBackground: 'linear-gradient(145deg,#AEB3BC 0%,#6F7784 100%)',
    image: '/icons/settings.png',
    icon: '/icons/settings.png',
    page: 0
  },

  // ── T ──
  {
    id: 'weather',
    name: '天气',
    initial: 'T',
    pinyin: 'tianqi',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#38ADF5 0%,#1675D8 100%)',
    image: '/icons/weather.png',
    icon: '/icons/weather.png',
    page: 0
  },
  {
    id: 'tips',
    name: '提示',
    initial: 'T',
    pinyin: 'tishi',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#FFD43B 0%,#F2AC00 100%)',
    image: '/icons/tips.png',
    icon: '/icons/tips.png',
    page: 0
  },

  // ── W ──
  {
    id: 'files',
    name: '文件',
    initial: 'W',
    pinyin: 'wenjian',
    depth: 'placeholder',
    heroBackground: '#F4F4F6',
    image: '/icons/files.png',
    icon: '/icons/files.png',
    page: 0
  },

  // ── X ──
  // camera (pinned, 相机)
  // messages (pinned, 信息)

  // ── Y ──
  {
    id: 'keynote',
    name: '演示',
    initial: 'Y',
    pinyin: 'yanshi',
    depth: 'placeholder',
    heroBackground: '#F5F5F7',
    image: '/icons/keynote.png',
    icon: '/icons/keynote.png',
    page: 0
  },
  {
    id: 'games',
    name: '游戏',
    initial: 'Y',
    pinyin: 'youxi',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#F89242 0%,#EF5A17 100%)',
    image: '/icons/games.png',
    icon: '/icons/games.png',
    page: 0
  },

  // ── Z ──
  {
    id: 'photos',
    name: '照片',
    initial: 'Z',
    pinyin: 'zhaopian',
    depth: 'placeholder',
    heroBackground: '#F5F5F7',
    special: 'photos',
    image: '/icons/photos.png',
    icon: '/icons/photos.png',
    page: 0
  },
  {
    id: 'compass',
    name: '指南针',
    initial: 'Z',
    pinyin: 'zhinanzhen',
    depth: 'placeholder',
    heroBackground: '#F5F5F7',
    image: '/icons/compass.png',
    icon: '/icons/compass.png',
    page: 0
  },
  {
    id: 'theme',
    name: '主题',
    initial: 'Z',
    pinyin: 'zhuti',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(135deg,#FF4272 0%,#FFB44A 45%,#19B9E5 100%)',
    image: '/icons/theme.png',
    icon: '/icons/theme.png',
    page: 0
  }
]

/** 实际拥有应用的字母索引（按字母升序） */
export const ALPHABET_LIST = [
  'D', 'J', 'L', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'
]

/**
 * 按字母分组的应用字典：{ D: [...], J: [...], ... }
 */
export function getAlphabeticalGroups() {
  const groups = {}
  for (const letter of ALPHABET_LIST) {
    groups[letter] = []
  }
  for (const app of DRAWER_APPS) {
    const l = app.initial
    if (!groups[l]) groups[l] = []
    groups[l].push(app)
  }
  return groups
}

/**
 * 实时过滤搜索应用（支持中文名、拼音、英文 ID 检索）
 */
export function searchDrawerApps(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return []
  return DRAWER_APPS.filter((a) => {
    return (
      a.name.toLowerCase().includes(q) ||
      a.pinyin.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    )
  })
}

export function getDrawerAppById(id) {
  return DRAWER_APPS.find((a) => a.id === id)
}
