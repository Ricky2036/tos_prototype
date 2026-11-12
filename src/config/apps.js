/**
 * 统一纯数据应用表 —— 全仓唯一的应用元数据事实来源。
 * `APPS` / `DRAWER_APPS` / `APP_NAMES` / `DARK_BG_APPS` 均由此表派生。
 *
 * 新增占位应用：在此表中追加一条纯数据描述即可，桌面 / Dock / 抽屉 / 多语言 / 状态栏反色自动同步。
 * 新增深度应用：再在 `src/components/apps/<id>/entry.js` 导出 `{ id, component }`，
 *               由 `registry.js` 通过 `import.meta.glob` 自动发现（也可仅靠 `entry.js` 携带元数据单文件注册）。
 *
 * depth: 'core' 有独立功能页；'placeholder' 打开为 PlaceholderApp 占位页
 * special: 'calendar' | 'clock' 图标由桌面 AppIcon 实时自绘
 */
export const APP_CATALOG = [
  {
    id: 'phone',
    names: { zh: '电话', en: 'Phone', bn: 'ফোন' },
    initial: 'D',
    pinyin: 'dianhua',
    dock: true,
    pinned: true,
    depth: 'core',
    heroBackground: 'linear-gradient(180deg,#20D759 0%,#12B83F 100%)',
    icon: '/icons/phone.png'
  },
  {
    id: 'messages',
    names: { zh: '信息', en: 'Messages', bn: 'বার্তা' },
    initial: 'X',
    pinyin: 'xinxi',
    dock: true,
    pinned: true,
    depth: 'core',
    heroBackground: 'linear-gradient(180deg,#28DF61 0%,#13B943 100%)',
    icon: '/icons/messages.png'
  },
  {
    id: 'safari',
    names: { zh: '浏览器', en: 'Safari', bn: 'সাফারি' },
    initial: 'L',
    pinyin: 'liulanqi',
    dock: true,
    pinned: true,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#22B8F5 0%,#0A78F0 100%)',
    icon: '/icons/safari.png'
  },
  {
    id: 'camera',
    names: { zh: '相机', en: 'Camera', bn: 'ক্যামেরা' },
    initial: 'X',
    pinyin: 'xiangji',
    dock: true,
    pinned: true,
    depth: 'core',
    darkStatusBar: true,
    heroBackground: 'linear-gradient(180deg,#F0F0F2 0%,#D6D6DA 100%)',
    icon: '/icons/camera.png'
  },
  {
    id: 'weather',
    names: { zh: '天气', en: 'Weather', bn: 'আবহাওয়া' },
    initial: 'T',
    pinyin: 'tianqi',
    page: 0,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#38ADF5 0%,#1675D8 100%)',
    icon: '/icons/weather.png'
  },
  {
    id: 'notes',
    names: { zh: '记事本', en: 'Notes', bn: 'নোট' },
    initial: 'J',
    pinyin: 'jishiben',
    page: 0,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#FFD33A 0%,#F4AA00 100%)',
    icon: '/icons/notes.png'
  },
  {
    id: 'files',
    names: { zh: '文件', en: 'Files', bn: 'ফাইল' },
    initial: 'W',
    pinyin: 'wenjian',
    page: 0,
    depth: 'placeholder',
    heroBackground: '#F4F4F6',
    icon: '/icons/files.png'
  },
  {
    id: 'voicememos',
    names: { zh: '录音机', en: 'Voice Memos', bn: 'ভয়েস মেমো' },
    initial: 'L',
    pinyin: 'luyinji',
    page: 0,
    depth: 'core',
    darkStatusBar: true,
    heroBackground: 'linear-gradient(180deg,#F65A62 0%,#E82636 100%)',
    icon: '/icons/voicememos.png'
  },
  {
    id: 'fitness',
    names: { zh: '健身', en: 'Fitness', bn: 'ফিটনেস' },
    initial: 'J',
    pinyin: 'jianshen',
    page: 0,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#F8C61B 0%,#EFA500 100%)',
    icon: '/icons/fitness.png'
  },
  {
    id: 'calculator',
    names: { zh: '计算器', en: 'Wallet', bn: 'ওয়ালেট' },
    initial: 'J',
    pinyin: 'jisuanqi',
    page: 0,
    depth: 'placeholder',
    heroBackground: '#ECECEF',
    icon: '/icons/calculator.png'
  },
  {
    id: 'theme',
    names: { zh: '主题', en: 'Themes', bn: 'থিম' },
    initial: 'Z',
    pinyin: 'zhuti',
    page: 0,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(135deg,#FF4272 0%,#FFB44A 45%,#19B9E5 100%)',
    icon: '/icons/theme.png'
  },
  {
    id: 'settings',
    names: { zh: '设置', en: 'Settings', bn: 'সেটিংস' },
    initial: 'S',
    pinyin: 'shezhi',
    page: 0,
    depth: 'core',
    heroBackground: 'linear-gradient(145deg,#AEB3BC 0%,#6F7784 100%)',
    icon: '/icons/settings.png'
  },
  {
    /* AI Mate —— 智能设备管理中枢（10 类设备目录 / 增删 / 二级控制页）。
       刻意不进 Dock（已决 D1），故只有 page 没有 dock。 */
    id: 'aimate',
    names: { zh: 'AI Mate', en: 'AI Mate', bn: 'AI Mate' },
    initial: 'A',
    pinyin: 'aimate',
    page: 0,
    depth: 'core',
    heroBackground: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
    icon: '/icons/aimate.png'
  },
  {
    id: 'calendar',
    names: { zh: '日历', en: 'Calendar', bn: 'ক্যালেন্ডার' },
    initial: 'R',
    pinyin: 'rili',
    page: 0,
    depth: 'core',
    special: 'calendar',
    heroBackground: '#F7F7F8',
    icon: '/icons/calendar.png'
  },
  {
    id: 'photos',
    names: { zh: '照片', en: 'Photos', bn: 'ছবি' },
    initial: 'Z',
    pinyin: 'zhaopian',
    page: 0,
    depth: 'core',
    heroBackground: '#F5F5F7',
    icon: '/icons/photos.png'
  },
  {
    id: 'clock',
    names: { zh: '时钟', en: 'Clock', bn: 'ঘড়ি' },
    initial: 'S',
    pinyin: 'shizhong',
    page: 0,
    depth: 'core',
    special: 'clock',
    darkStatusBar: true,
    heroBackground: '#1C1C1E',
    icon: '/icons/clock.png'
  },
  {
    id: 'keynote',
    names: { zh: '演示', en: 'Keynote', bn: 'কিনোট' },
    initial: 'Y',
    pinyin: 'yanshi',
    page: 0,
    depth: 'placeholder',
    heroBackground: '#F5F5F7',
    icon: '/icons/keynote.png'
  },
  {
    id: 'games',
    names: { zh: '游戏', en: 'Games', bn: 'গেমস' },
    initial: 'Y',
    pinyin: 'youxi',
    page: 0,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#F89242 0%,#EF5A17 100%)',
    icon: '/icons/games.png'
  },
  {
    id: 'tips',
    names: { zh: '提示', en: 'Tips', bn: 'পরামর্শ' },
    initial: 'T',
    pinyin: 'tishi',
    page: 0,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#FFD43B 0%,#F2AC00 100%)',
    icon: '/icons/tips.png'
  },
  {
    id: 'compass',
    names: { zh: '指南针', en: 'Compass', bn: 'কম্পাস' },
    initial: 'Z',
    pinyin: 'zhinanzhen',
    page: 0,
    depth: 'placeholder',
    heroBackground: '#F5F5F7',
    icon: '/icons/compass.png'
  },
  {
    id: 'whatsapp',
    names: { zh: 'WhatsApp', en: 'WhatsApp', bn: 'হোয়াটসঅ্যাপ' },
    initial: 'W',
    pinyin: 'whatsapp',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#25D366 0%,#128C7E 100%)',
    icon: '/icons/whatsapp.png'
  },
  {
    id: 'facebook',
    names: { zh: 'Facebook', en: 'Facebook', bn: 'ফেসবুক' },
    initial: 'F',
    pinyin: 'facebook',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#1877F2 0%,#0C63D4 100%)',
    icon: '/icons/facebook.png'
  },
  {
    id: 'tiktok',
    names: { zh: 'TikTok', en: 'TikTok', bn: 'টিকটক' },
    initial: 'T',
    pinyin: 'tiktok',
    page: 1,
    depth: 'placeholder',
    heroBackground: '#000000',
    icon: '/icons/tiktok.png'
  },
  {
    id: 'spotify',
    names: { zh: 'Spotify', en: 'Spotify', bn: 'স্পটিফাই' },
    initial: 'S',
    pinyin: 'spotify',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#1ED760 0%,#1DB954 100%)',
    icon: '/icons/spotify.png'
  },
  {
    id: 'gmail',
    names: { zh: 'Gmail', en: 'Gmail', bn: 'জিমেইল' },
    initial: 'G',
    pinyin: 'gmail',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#EA4335 0%,#C5221F 100%)',
    icon: '/icons/gmail.png'
  },
  {
    id: 'amazon',
    names: { zh: 'Amazon', en: 'Amazon', bn: 'অ্যামাজন' },
    initial: 'A',
    pinyin: 'amazon',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#232F3E 0%,#131921 100%)',
    icon: '/icons/amazon.png'
  },
  {
    id: 'snapchat',
    names: { zh: 'Snapchat', en: 'Snapchat', bn: 'স্ন্যাপচ্যাট' },
    initial: 'S',
    pinyin: 'snapchat',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#FFFC00 0%,#F5EE00 100%)',
    icon: '/icons/snapchat.png'
  },
  {
    id: 'uber',
    names: { zh: 'Uber', en: 'Uber', bn: 'উবার' },
    initial: 'U',
    pinyin: 'uber',
    page: 1,
    depth: 'placeholder',
    heroBackground: '#000000',
    icon: '/icons/uber.png'
  },
  {
    id: 'google',
    names: { zh: 'Google', en: 'Google', bn: 'Google' },
    initial: 'G',
    pinyin: 'google',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#FFFFFF 0%,#F1F3F4 100%)',
    icon: '/icons/google.png'
  },
  {
    id: 'pinterest',
    names: { zh: 'Pinterest', en: 'Pinterest', bn: 'পিন্টারেস্ট' },
    initial: 'P',
    pinyin: 'pinterest',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#E60023 0%,#BD081C 100%)',
    icon: '/icons/pinterest.png'
  },
  {
    id: 'wechat',
    names: { zh: '微信', en: 'WeChat', bn: 'উইচ্যাট' },
    initial: 'W',
    pinyin: 'weixin',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#09BB07 0%,#07C160 100%)',
    icon: '/icons/wechat.png'
  },
  {
    id: 'instagram',
    names: { zh: 'Instagram', en: 'Instagram', bn: 'ইনস্টাগ্রাম' },
    initial: 'I',
    pinyin: 'instagram',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(135deg,#833AB4 0%,#FD1D1D 50%,#FCB045 100%)',
    icon: '/icons/instagram.png'
  },
  {
    id: 'x',
    names: { zh: 'X', en: 'X', bn: 'এক্স' },
    initial: 'X',
    pinyin: 'x',
    page: 1,
    depth: 'placeholder',
    heroBackground: '#000000',
    icon: '/icons/x.png'
  },
  {
    id: 'netflix',
    names: { zh: 'Netflix', en: 'Netflix', bn: 'নেটফ্লিক্স' },
    initial: 'N',
    pinyin: 'netflix',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#141414 0%,#000000 100%)',
    icon: '/icons/netflix.png'
  },
  {
    id: 'telegram',
    names: { zh: 'Telegram', en: 'Telegram', bn: 'টেলিগ্রাম' },
    initial: 'T',
    pinyin: 'telegram',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#2AABEE 0%,#229ED9 100%)',
    icon: '/icons/telegram.png'
  },
  {
    id: 'youtube',
    names: { zh: 'YouTube', en: 'YouTube', bn: 'ইউটিউব' },
    initial: 'Y',
    pinyin: 'youtube',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#FF0000 0%,#CC0000 100%)',
    icon: '/icons/youtube.png'
  },
  {
    id: 'linkedin',
    names: { zh: 'LinkedIn', en: 'LinkedIn', bn: 'লিঙ্কডইন' },
    initial: 'L',
    pinyin: 'linkedin',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#0A66C2 0%,#004182 100%)',
    icon: '/icons/linkedin.png'
  },
  {
    id: 'alipay',
    names: { zh: '支付宝', en: 'Alipay', bn: 'আলিপে' },
    initial: 'Z',
    pinyin: 'zhifubao',
    page: 1,
    depth: 'placeholder',
    heroBackground: 'linear-gradient(180deg,#1677FF 0%,#0958D9 100%)',
    icon: '/icons/alipay.png'
  },
  {
    id: 'oneleap',
    names: { zh: 'OneLeap', en: 'OneLeap', bn: 'OneLeap' },
    initial: 'O',
    pinyin: 'oneleap',
    hiddenOnDesktop: true,
    darkStatusBar: true,
    depth: 'core',
    heroBackground: '#121826',
    icon: '/icons/settings.png'
  }
]

/** 将统一目录项转换为桌面应用描述对象。 */
export function toDesktopApp(entry) {
  const item = {
    id: entry.id,
    name: entry.names?.zh || entry.name || entry.id,
    depth: entry.depth || 'placeholder',
    heroBackground: entry.heroBackground || '#F5F5F7'
  }
  if (entry.special) item.special = entry.special
  else if (entry.icon) item.image = entry.icon
  if (entry.dock) item.dock = true
  if (entry.page !== undefined) item.page = entry.page
  if (entry.darkStatusBar) item.darkStatusBar = true
  return item
}

/** 桌面可见应用列表（含 Dock 与网格，排除 hiddenOnDesktop）。 */
export const APPS = APP_CATALOG.filter((a) => !a.hiddenOnDesktop).map(toDesktopApp)

/** 隐藏桌面入口的系统级深层应用（供测试与外部显式引用）。 */
export const ONELEAP_APP = toDesktopApp(APP_CATALOG.find((a) => a.id === 'oneleap'))

/** 状态栏默认使用浅色字体的深底应用 ID 列表（由统一应用表派生）。 */
export const DARK_BG_APPS = APP_CATALOG.filter((a) => a.darkStatusBar).map((a) => a.id)

/** 桌面网格图标（非 Dock），按注册顺序。 */
export const gridApps = APPS.filter((a) => !a.dock)

/** Dock 图标。 */
export const dockApps = APPS.filter((a) => a.dock)

/** 按 ID 查询任意已注册应用（包含 hiddenOnDesktop 应用）。 */
export const getApp = (id) => {
  const found = APP_CATALOG.find((a) => a.id === id)
  return found ? toDesktopApp(found) : undefined
}

const catalogListeners = new Set()

/** 订阅运行时由 entry.js 动态注册的新应用（供抽屉与多语言表同步更新）。 */
export function subscribeCatalog(listener) {
  catalogListeners.add(listener)
  return () => catalogListeners.delete(listener)
}

/**
 * 供 registry.js 在 Vite glob 发现新 entry.js 时将单文件应用元数据并入运行时表。
 * 已在 APP_CATALOG 中的应用仅同步 depth='core'；未入表的新应用直接派生进桌面与抽屉。
 */
export function registerCatalogApp(entry) {
  if (!entry?.id) return null
  const existing = APP_CATALOG.find((a) => a.id === entry.id)
  if (existing) {
    if (existing.depth !== 'core') existing.depth = 'core'
    return existing
  }

  const baseName = entry.name || entry.names?.zh || entry.id
  const descriptor = {
    id: entry.id,
    names: {
      zh: entry.names?.zh || baseName,
      en: entry.names?.en || baseName,
      bn: entry.names?.bn || baseName
    },
    initial: (entry.initial || baseName[0] || '#').toUpperCase(),
    pinyin: (entry.pinyin || entry.id).toLowerCase(),
    depth: entry.depth || 'core',
    heroBackground: entry.heroBackground || '#F5F5F7',
    icon: entry.icon || entry.image || '/icons/tips.png'
  }
  if (entry.dock) {
    descriptor.dock = true
    descriptor.pinned = Boolean(entry.pinned ?? true)
  } else {
    descriptor.page = entry.page ?? 1
  }
  if (entry.special) descriptor.special = entry.special
  if (entry.darkStatusBar) descriptor.darkStatusBar = true
  if (entry.hiddenOnDesktop) descriptor.hiddenOnDesktop = true

  APP_CATALOG.push(descriptor)
  if (descriptor.darkStatusBar && !DARK_BG_APPS.includes(descriptor.id)) {
    DARK_BG_APPS.push(descriptor.id)
  }
  if (!descriptor.hiddenOnDesktop) {
    const desktopApp = toDesktopApp(descriptor)
    APPS.push(desktopApp)
    if (desktopApp.dock) dockApps.push(desktopApp)
    else gridApps.push(desktopApp)
  }
  for (const listener of catalogListeners) listener(descriptor)
  return descriptor
}
