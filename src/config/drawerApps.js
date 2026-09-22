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
  },

  // ── 通知中心衍生应用 ──
  {
    id: 'amazon',
    name: 'Amazon',
    initial: 'A',
    pinyin: 'amazon',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#232F3E 0%,#131921 100%)',
    image: '/icons/amazon.png',
    icon: '/icons/amazon.png',
    page: 1
  },
  {
    id: 'facebook',
    name: 'Facebook',
    initial: 'F',
    pinyin: 'facebook',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#1877F2 0%,#0C63D4 100%)',
    image: '/icons/facebook.png',
    icon: '/icons/facebook.png',
    page: 1
  },
  {
    id: 'gmail',
    name: 'Gmail',
    initial: 'G',
    pinyin: 'gmail',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#EA4335 0%,#C5221F 100%)',
    image: '/icons/gmail.png',
    icon: '/icons/gmail.png',
    page: 1
  },
  {
    id: 'google',
    name: 'Google',
    initial: 'G',
    pinyin: 'google',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#FFFFFF 0%,#F1F3F4 100%)',
    image: '/icons/google.png',
    icon: '/icons/google.png',
    page: 1
  },
  {
    id: 'instagram',
    name: 'Instagram',
    initial: 'I',
    pinyin: 'instagram',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(135deg,#833AB4 0%,#FD1D1D 50%,#FCB045 100%)',
    image: '/icons/instagram.png',
    icon: '/icons/instagram.png',
    page: 1
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    initial: 'L',
    pinyin: 'linkedin',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#0A66C2 0%,#004182 100%)',
    image: '/icons/linkedin.png',
    icon: '/icons/linkedin.png',
    page: 1
  },
  {
    id: 'netflix',
    name: 'Netflix',
    initial: 'N',
    pinyin: 'netflix',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#141414 0%,#000000 100%)',
    image: '/icons/netflix.png',
    icon: '/icons/netflix.png',
    page: 1
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    initial: 'P',
    pinyin: 'pinterest',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#E60023 0%,#BD081C 100%)',
    image: '/icons/pinterest.png',
    icon: '/icons/pinterest.png',
    page: 1
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    initial: 'S',
    pinyin: 'snapchat',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#FFFC00 0%,#F5EE00 100%)',
    image: '/icons/snapchat.png',
    icon: '/icons/snapchat.png',
    page: 1
  },
  {
    id: 'spotify',
    name: 'Spotify',
    initial: 'S',
    pinyin: 'spotify',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#1ED760 0%,#1DB954 100%)',
    image: '/icons/spotify.png',
    icon: '/icons/spotify.png',
    page: 1
  },
  {
    id: 'telegram',
    name: 'Telegram',
    initial: 'T',
    pinyin: 'telegram',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#2AABEE 0%,#229ED9 100%)',
    image: '/icons/telegram.png',
    icon: '/icons/telegram.png',
    page: 1
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    initial: 'T',
    pinyin: 'tiktok',
    depth: 'placeholder',
    heroBackground: '#000000',
    image: '/icons/tiktok.png',
    icon: '/icons/tiktok.png',
    page: 1
  },
  {
    id: 'uber',
    name: 'Uber',
    initial: 'U',
    pinyin: 'uber',
    depth: 'placeholder',
    heroBackground: '#000000',
    image: '/icons/uber.png',
    icon: '/icons/uber.png',
    page: 1
  },
  {
    id: 'wechat',
    name: '微信',
    initial: 'W',
    pinyin: 'weixin',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#09BB07 0%,#07C160 100%)',
    image: '/icons/wechat.png',
    icon: '/icons/wechat.png',
    page: 1
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    initial: 'W',
    pinyin: 'whatsapp',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#25D366 0%,#128C7E 100%)',
    image: '/icons/whatsapp.png',
    icon: '/icons/whatsapp.png',
    page: 1
  },
  {
    id: 'x',
    name: 'X',
    initial: 'X',
    pinyin: 'x',
    depth: 'placeholder',
    heroBackground: '#000000',
    image: '/icons/x.png',
    icon: '/icons/x.png',
    page: 1
  },
  {
    id: 'youtube',
    name: 'YouTube',
    initial: 'Y',
    pinyin: 'youtube',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#FF0000 0%,#CC0000 100%)',
    image: '/icons/youtube.png',
    icon: '/icons/youtube.png',
    page: 1
  },
  {
    id: 'alipay',
    name: '支付宝',
    initial: 'Z',
    pinyin: 'zhifubao',
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#1677FF 0%,#0958D9 100%)',
    image: '/icons/alipay.png',
    icon: '/icons/alipay.png',
    page: 1
  }
]

/** 全量 27 个字母索引（对齐真机 A-Z 及 # 导轨） */
export const FULL_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'
]

export const ALPHABET_LIST = FULL_ALPHABET

/**
 * 按字母分组的应用字典：{ A: [...], B: [...], ..., Z: [...], '#': [...] }
 */
export function getAlphabeticalGroups() {
  const groups = {}
  for (const letter of ALPHABET_LIST) {
    groups[letter] = []
  }
  for (const app of DRAWER_APPS) {
    const l = app.initial || '#'
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
