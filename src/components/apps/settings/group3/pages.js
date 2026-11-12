/**
 * 设置第三组卡片（安全与隐私 → 位置信息）三级/四级页配置。
 *
 * 取证：Infinix X6878 / XOS 17，2026-11-09 真机逐页截图（/tmp/ref/gI/）。
 * 骨架统一由 `Group3SubPage.vue` 渲染，差异只在这份配置里：
 *   title / sections / hero / empty / donut / apps / links / notes / cta / search / sort
 *
 * section 形态（互斥，按优先级取）：
 *   { header?, rows: [...] }   卡片 + 可选分组标题
 *   { note }                   卡片下方的灰色说明文字
 *   { notes: [...] }           多段说明
 *   { links: [...], title? }   「你可能想找」蓝色链接块
 *   { hero }                   头图插画 + 说明 + 分页点
 *   { empty }                  空态插画 + 文案
 *   { donut }                  权限使用环形图（隐私信息中心）
 *
 * row 形态：
 *   { title, subtitle?, value?, chevron?, toggle?, radio?, radioValue?,
 *     appIcon?, icon?, action?, badge?, disabled? }
 *   toggle/radio 命中 `settingsGroup3Store`；action 指向本表的另一个 key（四级页）。
 */

/* 应用图标色板：真机是各应用真实图标，原型用「圆形 + 首字 + 品牌色」占位。
   ⚠️ 不在这里手绘 SVG 路径（全仓列表图标统一走 LIcon / AppIcon）。 */
const APP_ICONS = {
  folax: { text: 'F', bg: '#E8E3FF', fg: '#7C6BF2' },
  weather: { text: '☀', bg: '#DCEEFF', fg: '#3B9BEA' },
  douyin: { text: '抖', bg: '#1C1C1E', fg: '#FFFFFF' },
  wechat: { text: '微', bg: '#E5F7E8', fg: '#16A34A' },
  transsioner: { text: 'T', bg: '#FFE9E3', fg: '#F26A4B' },
  dianping: { text: '评', bg: '#FFF0E6', fg: '#FF6633' },
  dingdong: { text: '叮', bg: '#E6F7EA', fg: '#22A559' },
  amap: { text: '高', bg: '#E4F0FF', fg: '#1D7BEF' },
  bilibili: { text: 'B', bg: '#FCE7F1', fg: '#F25D8E' },
  facebook: { text: 'f', bg: '#E7EEFF', fg: '#1877F2' },
  instagram: { text: '◎', bg: '#FCE9EF', fg: '#D62976' },
  telegram: { text: '➤', bg: '#E3F2FD', fg: '#229ED9' },
  google: { text: 'G', bg: '#F1F3F4', fg: '#4285F4' },
  chrome: { text: 'C', bg: '#FEF0E7', fg: '#EA4335' },
  phone: { text: '☎', bg: '#E4F7EA', fg: '#22A559' },
  message: { text: '✉', bg: '#E4F0FF', fg: '#2F6BF6' },
  gallery: { text: '✿', bg: '#F3ECFF', fg: '#8B5CF6' },
  generic: { text: 'A', bg: '#EDEFF2', fg: '#6B7280' }
}

export { APP_ICONS }

export const GROUP3_PAGES = {
  /* ==================== 密码与安全 ==================== */
  lockScreenPassword: {
    title: '锁屏密码',
    sections: [
      { note: '请选择备用屏幕解锁方式' },
      {
        rows: [
          { title: '数字密码', subtitle: '输入 4 - 16 位数字密码', icon: '123', chevron: true, action: 'passwordTypeNumeric' },
          { title: '混合密码', subtitle: '输入 4 - 16 位数字与字母', icon: '258', chevron: true, action: 'passwordTypeMixed' },
          { title: '图案密码', subtitle: '至少连接 4 个点', icon: 'grid', chevron: true, action: 'passwordTypePattern' }
        ]
      },
      {
        title: '你可能想找',
        links: [
          { label: '解锁抓拍', action: 'unlockCapture' },
          { label: '防盗警报', action: 'theftAlarm' },
          { label: '盗窃防护', action: 'theftProtection' },
          { label: '关机验证密码', action: 'powerOffPassword' }
        ]
      }
    ],
    footerBadge: 'XGuard'
  },

  passwordTypeNumeric: {
    title: '数字密码',
    hero: { variant: 'keypad', caption: '请输入 4 - 16 位数字密码', dots: 0 },
    sections: [{ note: '原型不采集真实密码，此页仅复刻设置流程与视觉层级。' }],
    cta: '继续'
  },
  passwordTypeMixed: {
    title: '混合密码',
    hero: { variant: 'keypad', caption: '请输入 4 - 16 位数字与字母', dots: 0 },
    sections: [{ note: '原型不采集真实密码，此页仅复刻设置流程与视觉层级。' }],
    cta: '继续'
  },
  passwordTypePattern: {
    title: '图案密码',
    hero: { variant: 'pattern', caption: '至少连接 4 个点', dots: 0 },
    sections: [{ note: '原型不采集真实密码，此页仅复刻设置流程与视觉层级。' }],
    cta: '继续'
  },

  fingerprint: {
    title: '指纹',
    hero: { variant: 'face', caption: '录入指纹后可用于解锁屏幕、应用锁与支付验证。', dots: 0 },
    sections: [
      { rows: [{ title: '录入指纹', chevron: true, action: 'fingerprintEnroll' }] },
      { note: '指纹数据仅保存在设备安全芯片中，不会上传至云端。' }
    ]
  },

  faceRecognition: {
    title: '面部识别',
    hero: { variant: 'face', caption: '录入面部数据后，抬手即可解锁屏幕。', dots: 0 },
    sections: [
      { rows: [{ title: '录入面部数据', chevron: true, action: 'faceEnroll' }] },
      { note: '面部识别的安全性低于密码与指纹，涉及支付时请使用密码验证。' }
    ]
  },

  privacyPassword: {
    title: '隐私密码',
    hero: { variant: 'lock', caption: '为私密空间、应用锁与 XHide 设置独立密码。', dots: 0 },
    sections: [
      { rows: [{ title: '设置隐私密码', chevron: true, action: 'privacyPasswordChange' }] },
      { note: '忘记隐私密码时，可通过 Infinix ID 账号找回。' }
    ]
  },

  antiTheft: {
    title: '手机防盗',
    sections: [
      { rows: [
        { title: '关机验证密码', subtitle: '验证锁屏密码以防止恶意关机。', toggle: 'powerOffPassword' },
        { title: '解锁抓拍', value: '已开启', chevron: true, action: 'unlockCapture' },
        { title: '解锁安全保护', subtitle: '保护锁屏密码及生物识别信息', chevron: true, action: 'unlockProtection' },
        { title: '防盗警报', value: '已关闭', chevron: true, action: 'theftAlarm' },
        { title: '盗窃防护', chevron: true, action: 'theftProtection' }
      ] }
    ],
    footerBadge: 'XGuard'
  },

  unlockCapture: {
    title: '解锁抓拍',
    sections: [
      { rows: [{ title: '解锁抓拍', subtitle: '连续输错密码时，使用前置摄像头拍摄照片。', toggle: 'unlockCapture' }] },
      { rows: [{ title: '抓拍记录', chevron: true, action: 'unlockCaptureLog' }] }
    ]
  },

  theftAlarm: {
    title: '防盗警报',
    sections: [
      { rows: [{ title: '防盗警报', subtitle: '设备被异常移动或拔出充电线时发出警报。', toggle: 'theftAlarm' }] },
      { note: '警报音量将临时调至最大，即使设备处于静音模式。' }
    ]
  },

  theftProtection: {
    title: '盗窃防护',
    hero: { variant: 'shield', caption: '检测到异常拿离行为时自动锁定屏幕。', dots: 0 },
    sections: [
      { rows: [
        { title: '盗窃检测锁定', toggle: 'theftDetection' },
        { title: '离线设备锁定', toggle: 'offlineLock' },
        { title: '远程锁定', subtitle: '设备丢失时可通过 Infinix ID 远程锁定。', chevron: true, action: 'remoteLock' }
      ] }
    ]
  },

  powerOffPassword: {
    title: '关机验证密码',
    sections: [
      { rows: [{ title: '关机验证密码', subtitle: '验证锁屏密码以防止恶意关机。', toggle: 'powerOffPassword' }] }
    ]
  },

  unlockProtection: {
    title: '解锁安全保护',
    sections: [
      { rows: [
        { title: '防暴力破解', subtitle: '连续输错后逐步延长重试间隔。', toggle: 'bruteForceGuard' },
        { title: '生物识别防伪', subtitle: '提升指纹与面部识别的活体检测强度。', toggle: 'biometricAntiSpoof' }
      ] }
    ]
  },

  systemSecurity: {
    title: '系统安全',
    sections: [
      { rows: [
        { title: '安全状态', value: '正常', chevron: false },
        { title: '系统安全防护', subtitle: '内核防护与恶意应用扫描', chevron: false }
      ] }
    ]
  },

  playSystemUpdate: {
    title: 'Google Play 系统更新',
    sections: [
      { rows: [
        { title: '当前版本', value: '2026年7月1日', chevron: false },
        { title: '检查更新', chevron: false, run: true }
      ] },
      { note: 'Google Play 系统更新会为设备提供重要的安全修复与隐私增强。' }
    ],
    cta: '检查更新'
  },

  appLock: {
    title: '应用锁',
    hero: { variant: 'lock', caption: '请输入锁屏密码，以继续管理应用锁。', dots: 0 },
    sections: [{ note: '验证通过后，可为单个应用设置打开时的密码或生物识别验证。' }],
    cta: '验证锁屏密码'
  },

  /* ==================== 权限与隐私 ==================== */
  xhide: {
    title: 'XHide',
    hero: { variant: 'lock', caption: '隐藏应用、图片、文档等', dots: 0 },
    sections: [
      { rows: [
        { title: '隐藏应用', value: '0 个', chevron: true, action: 'xhideApps' },
        { title: '隐藏图片', value: '0 张', chevron: true, action: 'xhidePhotos' },
        { title: '隐藏文档', value: '0 个', chevron: true, action: 'xhideDocs' }
      ] },
      { rows: [{ title: '进入 XHide 需验证隐私密码', toggle: 'xhideVerify' }] }
    ]
  },

  appClone: {
    title: '应用双开',
    sections: [
      { header: '推荐应用', rows: [
        { title: 'Facebook', appIcon: 'facebook', toggle: 'cloneFacebook' },
        { title: 'Instagram', appIcon: 'instagram', toggle: 'cloneInstagram' },
        { title: 'Telegram', appIcon: 'telegram', toggle: 'cloneTelegram' },
        { title: '微信', appIcon: 'wechat', toggle: 'cloneWechat' }
      ] },
      { rows: [{ title: '体验更多应用', chevron: true, action: 'cloneMoreApps' }] },
      { note: '开启后，桌面会生成一个独立的应用分身，两个账号的数据彼此隔离。' }
    ]
  },

  cloneMoreApps: {
    title: '更多应用',
    sections: [
      { note: '下列应用在双开下可能使用体验不佳。' },
      { rows: [
        { title: 'Carlcare', appImage: '/icons/drawer/carlcare.png', toggle: 'cloneCarlcare' },
        { title: 'Crush Block', appImage: '/icons/drawer/crushblock.png', toggle: 'cloneCrushBlock' },
        { title: 'DeepSeek', appImage: '/icons/drawer/deepseek.png', toggle: 'cloneDeepSeek' },
        { title: 'Grok', appImage: '/icons/drawer/grok.png', toggle: 'cloneGrok' },
        { title: 'Hola', appImage: '/icons/drawer/hola.png', toggle: 'cloneHola' },
        { title: 'Vita Mahjong', appIcon: 'generic', toggle: 'cloneVitaMahjong' },
        { title: 'WPS Office', appIcon: 'generic', toggle: 'cloneWps' },
        { title: 'X', appImage: '/icons/x.png', toggle: 'cloneX' },
        { title: '文件极客', appIcon: 'generic', toggle: 'cloneFileExpert' }
      ] }
    ]
  },

  antiPeek: {
    title: '防偷窥',
    hero: { variant: 'peek', caption: '拖拽底部角标，调整遮罩区域的范围。', dots: 2 },
    sections: [
      { rows: [{ title: '防偷窥', subtitle: '使用屏幕遮罩为手机屏幕提供即时遮挡，遮蔽不想被看见的内容。', toggle: 'antiPeek' }] }
    ]
  },

  aiAntiFraud: {
    title: 'AI 防诈骗',
    hero: { variant: 'shield', caption: '智能识别诈骗风险，保护财产安全。', dots: 0 },
    sections: [
      { rows: [
        { title: 'AI 防诈骗守护', toggle: 'aiAntiFraud' },
        { title: '诈骗电话识别', toggle: 'fraudCallDetect' },
        { title: '诈骗短信识别', toggle: 'fraudSmsDetect' },
        { title: '风险应用安装提醒', toggle: 'fraudAppAlert' }
      ] },
      { note: '识别在本地完成，通话与短信内容不会上传。' }
    ]
  },

  screenSharePrivacy: {
    title: '屏幕共享隐私保护',
    sections: [
      { rows: [
        { title: '隐藏敏感信息', subtitle: '共享屏幕或投屏时自动遮蔽通知内容与密码框。', toggle: 'screenSharePrivacy' },
        { title: '遮蔽通知内容', toggle: 'screenShareNotifMask' },
        { title: '静音系统通知音', toggle: 'screenShareMute' }
      ] }
    ]
  },

  lendMode: {
    title: '借出模式',
    hero: { variant: 'lend', caption: '借出手机时，可开启借出模式，固定进入该模式时使用的应用或页面，直至退出该模式。', dots: 0 },
    sections: [
      { rows: [
        { title: '借出模式', toggle: 'lendMode' },
        { title: '固定范围', value: '当前应用', chevron: true, action: 'lendScope' },
        { title: '退出验证', subtitle: '退出借出模式后使用手机时，需验证锁屏密码。', toggle: 'lendExitVerify' }
      ] },
      { notes: [
        '固定某应用后，仅可访问该应用中的内容。固定某页面后，不允许任何操作。',
        '使用借出模式请执行以下操作：进入「设置 > 安全与隐私 > 借出模式」，选择固定范围后开启。'
      ] }
    ]
  },

  lendScope: {
    title: '固定范围',
    sections: [
      { rows: [
        { title: '当前应用', radio: 'lendScope', radioValue: '当前应用' },
        { title: '当前页面', radio: 'lendScope', radioValue: '当前页面' }
      ] }
    ]
  },

  dualSystem: {
    title: '双系统',
    hero: { variant: 'dual', caption: '通过不同密码进入双系统空间，数据完全隔离并加密，可储存私人数据。', dots: 0 },
    sections: [],
    cta: '创建副系统',
    footerBadge: 'XGuard'
  },

  paymentProtection: {
    title: '支付环境保护',
    hero: { variant: 'shield', caption: '支付前自动检测环境风险，保护每一笔交易。', dots: 0 },
    sections: [
      { header: '检测项', rows: [
        { title: '支付环境检测', value: '安全', chevron: false },
        { title: '风险应用拦截', toggle: 'paymentRiskBlock' },
        { title: '恶意弹窗阻断', toggle: 'paymentPopupBlock' },
        { title: '验证码保护', subtitle: '禁止第三方应用读取支付验证码。', toggle: 'paymentSmsGuard' }
      ] },
      { rows: [{ title: '立即检测', chevron: false, run: true }] }
    ]
  },

  adControl: {
    title: '广告管控',
    sections: [
      { rows: [
        { title: '减少恶意广告弹出', toggle: 'adControl' },
        { title: '个性化广告推荐', subtitle: '关闭后仍会看到广告，但不会基于兴趣定向。', toggle: 'adPersonalized' }
      ] },
      { rows: [{ title: '重置广告 ID', chevron: false, run: true }] }
    ]
  },

  repairMode: {
    title: '维修模式',
    hero: { variant: 'shield', caption: '送修时隐藏照片、消息与账号等个人数据。', dots: 0 },
    sections: [
      { rows: [{ title: '维修模式状态', value: '未开启', chevron: false }] },
      { note: '开启后设备会重启进入一个干净的临时系统，维修人员无法读取机主数据。' }
    ],
    cta: '进入维修模式'
  },

  secureKeyboard: {
    title: '安全键盘',
    sections: [
      { rows: [{ title: '安全键盘', subtitle: '不收集用户输入的信息', toggle: 'secureKeyboard' }] },
      { note: '输入密码时自动切换为系统独立安全键盘，禁用输入法联网与联想。' }
    ]
  },

  privacyPolicyPage: {
    title: '隐私保护策略',
    sections: [
      { rows: [
        { title: '隐私政策', chevron: true, action: 'privacyDoc', actionTitle: true },
        { title: '第三方信息共享清单', chevron: true, action: 'privacyDoc', actionTitle: true },
        { title: '个人信息收集清单', chevron: true, action: 'privacyDoc', actionTitle: true }
      ] },
      { note: '隐私保护策略说明设备如何收集、使用与存储个人信息。' }
    ]
  },

  privacyRiskLog: {
    title: '隐私风险记录',
    sections: [
      { header: '近 7 天', rows: [
        { title: '未发现未经授权的敏感权限访问', chevron: false }
      ] },
      { note: '当应用在前台不可见时调用摄像头、麦克风或位置信息，会记录在此。' }
    ]
  },

  healthData: {
    title: '健康数据共享',
    sections: [
      { header: '已授权应用', rows: [] , note: '健康数据暂未向第三方应用授权。' },
      { rows: [{ title: '管理健康数据权限', chevron: true, action: 'healthDataApps' }] }
    ]
  },

  locationDataUpdates: {
    title: '位置数据分享方面的更新',
    sections: [
      { empty: { text: '无位置数据共享变更记录' } }
    ]
  },

  specialAppAccess: {
    title: '特殊应用权限',
    sections: [
      { header: '通用', rows: [
        { title: '安装未知应用', chevron: true, action: 'specialInstallUnknown' },
        { title: 'WLAN 控制', chevron: true, action: 'specialWifiControl' },
        { title: '修改系统设置', chevron: true, action: 'specialModifySettings' },
        { title: '闹钟和提醒', chevron: true, action: 'specialAlarms' }
      ] },
      { header: '权限', rows: [
        { title: '所有文件访问权限', chevron: true, action: 'specialAllFiles' },
        { title: '模式访问权限', chevron: true, action: 'specialModeAccess' },
        { title: '付费短信权限', chevron: true, action: 'specialPremiumSms' },
        { title: '使用记录访问权限', chevron: true, action: 'specialUsageAccess' },
        { title: '设备动作与方向权限', chevron: true, action: 'specialMotion' },
        { title: '后台弹出界面权限', chevron: true, action: 'specialOverlay' }
      ] },
      { header: '通知', rows: [
        { title: '通知使用权', chevron: true, action: 'specialNotifAccess' },
        { title: '勿扰权限', chevron: true, action: 'specialDndAccess' }
      ] }
    ]
  },

  specialInstallUnknown: { title: '安装未知应用', sections: [{ rows: [{ title: 'Chrome', appIcon: 'chrome', toggle: 'specInstallChrome' }, { title: '文件管理', appIcon: 'generic', toggle: 'specInstallFiles' }] }] },
  specialWifiControl: { title: 'WLAN 控制', sections: [{ rows: [{ title: '允许应用开关 WLAN', toggle: 'specWifiControl' }] }] },
  specialModifySettings: { title: '修改系统设置', sections: [{ rows: [{ title: 'Folax', appIcon: 'folax', toggle: 'specModifyFolax' }] }] },
  specialAlarms: { title: '闹钟和提醒', sections: [{ rows: [{ title: '时钟', appIcon: 'generic', toggle: 'specAlarmClock' }] }] },
  specialAllFiles: { title: '所有文件访问权限', sections: [{ rows: [{ title: '文件管理', appIcon: 'generic', toggle: 'specAllFiles' }] }] },
  specialModeAccess: { title: '模式访问权限', sections: [{ rows: [{ title: '暂无应用请求此权限', chevron: false }] }] },
  specialPremiumSms: { title: '付费短信权限', sections: [{ rows: [{ title: '信息', appIcon: 'message', value: '始终允许', chevron: true, action: 'permissionGrant' }] }] },
  specialUsageAccess: { title: '使用记录访问权限', sections: [{ rows: [{ title: '数字健康与家长控制', appIcon: 'generic', toggle: 'specUsageHealth' }] }] },
  specialMotion: { title: '设备动作与方向权限', sections: [{ rows: [{ title: '暂无应用请求此权限', chevron: false }] }] },
  specialOverlay: { title: '后台弹出界面权限', sections: [{ rows: [{ title: '微信', appIcon: 'wechat', toggle: 'specOverlayWechat' }] }] },
  specialNotifAccess: { title: '通知使用权', sections: [{ rows: [{ title: '暂无应用请求此权限', chevron: false }] }] },
  specialDndAccess: { title: '勿扰权限', sections: [{ rows: [{ title: '时钟', appIcon: 'generic', toggle: 'specDndClock' }] }] },

  morePrivacy: {
    title: '更多安全和隐私设置',
    sections: [
      { header: '更多隐私设置', rows: [
        { title: '隐私保护策略', chevron: true, action: 'privacyPolicyPage' },
        { title: '健康数据共享', subtitle: '管理应用对健康数据的访问权限', chevron: true, action: 'healthData' },
        { title: '位置数据分享方面的更新', subtitle: '查看改变了位置数据分享方式的应用', chevron: true, action: 'locationDataUpdates' },
        { title: '摄像头使用权限', subtitle: '针对应用和服务', toggle: 'cameraAccess' },
        { title: '麦克风访问权限', subtitle: '针对应用和服务。即使关闭此设置，系统仍可能在您拨打紧急电话号码时分享麦克风数据', toggle: 'micAccess' },
        { title: '显示剪贴板访问通知', subtitle: '若有应用访问您复制的文字、图片或其他内容，系统会显示通知', toggle: 'clipboardNotice' },
        { title: '在锁屏界面上显示媒体内容', subtitle: '为了方便您快速恢复播放，媒体播放器会在锁定的屏幕上保持打开状态。', toggle: 'lockScreenMedia' },
        { title: '允许相机软件扩展程序', subtitle: '启用后将使用默认软件实现来提供高级相机功能，例如 HDR、夜间模式或其他相机扩展功能', toggle: 'cameraExtensions' },
        { title: '应用内容访问权限', subtitle: '管理应用对设备内容的使用权限。', toggle: 'appContentAccess' }
      ] }
    ]
  },

  privacyDashboard: {
    title: '隐私信息中心',
    sections: [
      { donut: { label: '过去 24 小时', segments: [
        { name: '相机', value: 1, color: '#4A90FF' },
        { name: '麦克风', value: 3, color: '#1E3A6E' },
        { name: '位置信息', value: 5, color: '#3C3C43' }
      ] } },
      { rows: [
        { title: '位置信息', subtitle: '有 5 个应用使用过', icon: 'map-pin', chevron: true, action: 'locationPermission' },
        { title: '相机', subtitle: '有 1 个应用使用过', icon: 'camera', chevron: true, action: 'permissionTimeline', actionTitle: true },
        { title: '麦克风', subtitle: '有 3 个应用使用过', icon: 'mic', chevron: true, action: 'permissionTimeline', actionTitle: true }
      ] },
      { links: [{ label: '查看其他权限' }] },
      { header: 'AI 助理活动记录', rows: [
        { title: 'Google', appIcon: 'google', subtitle: '过去 24 小时内无访问记录', chevron: false }
      ] }
    ]
  },

  appPermissions: {
    title: '应用权限管理',
    sections: [
      { header: '权限类型', rows: [
        { title: '位置信息', chevron: true, action: 'locationPermission' },
        { title: '相机', chevron: true, action: 'permissionApps' },
        { title: '麦克风', chevron: true, action: 'permissionApps' },
        { title: '通讯录', chevron: true, action: 'permissionApps' },
        { title: '短信', chevron: true, action: 'permissionApps' },
        { title: '通话记录', chevron: true, action: 'permissionApps' },
        { title: '存储空间', chevron: true, action: 'permissionApps' }
      ] },
      { note: '管理应用的隐私权限使用行为。' }
    ]
  },

  /* ==================== 应用管理 ==================== */
  appUpdate: {
    title: '应用更新',
    sections: [
      { note: '为了向您提供应用更新服务，我们需要上传您的应用安装列表数据，为确保您的隐私，该数据不会与第三方共享。' },
      { empty: { text: '无可用更新' } }
    ]
  },

  appList: {
    title: '应用列表',
    sort: '按A-Z排序',
    search: true,
    // ⚠️ 应用名与图标不在这里硬编码：由 Group3SubPage 从桌面注册表 APPS / getApp 生成。
    //    桌面新增应用后这里自动同步，也不会再出现「首字色块冒充应用图标」。
    useRegisteredApps: true,
    sections: [{ rows: [] }]
  },

  appDetail: {
    title: '应用信息',
    source: 'device', evidence: '130_app_info_top / 136_app_info_back',
    sections: [
      { appHero: true },
      { tripleActions: [
        { label: '开启', icon: 'externalLink' },
        { label: '卸载', icon: 'trash2' },
        { label: '强行停止', icon: 'xCircle' }
      ] },
      { rows: [
        { title: '通知', value: '允许', chevron: true, openAppNotifications: true },
        { title: '权限', subtitle: '附近的设备和通知', chevron: true, action: 'appPermissionsDetail' }
      ] },
      { rows: [
        { title: '存储和缓存', value: '1.57 GB', chevron: true, action: 'appStorage' },
        { title: '移动数据和 WLAN', value: '4.45 GB', chevron: true, action: 'appDataUsage' },
        { title: '设备使用时间', chevron: true, action: 'appScreenTime' },
        { title: '电池', chevron: true, action: 'appBattery' },
        { title: '默认打开', subtitle: '允许打开支持的链接', chevron: true, action: 'appOpenByDefault' }
      ] }
    ]
  },

  appRestore: {
    title: '系统应用恢复',
    sections: [{ empty: { text: '无应用' } }]
  },

  defaultApps: {
    title: '默认应用',
    sections: [
      { header: '系统', rows: [
        { title: '电话', appImage: '/icons/phone.png', value: '电话', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: '短信', appImage: '/icons/messages.png', value: '短信', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: '浏览器', appImage: '/icons/safari.png', value: 'Chrome', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: '数字助理', appImage: '/icons/drawer/folax.png', value: 'Folax', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: '桌面', appImage: '/icons/drawer/theme.png', value: 'XOS桌面系统', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: '图片', appImage: '/icons/drawer/smartgallery.png', value: '智能图库', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: '音频', appImage: '/icons/drawer/qqmusic.png', value: 'Visha播放器', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: '视频', appImage: '/icons/drawer/tencent_video.png', value: 'Visha播放器', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: 'APK', appImage: '/icons/drawer/appcenter.png', value: '软件包安装程序', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: '钱包', appImage: '/icons/drawer/wallet.png', value: '钱包', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: '来电显示与骚扰电话屏蔽', appImage: '/icons/phone.png', value: 'Synergy Nexus', chevron: true, action: 'defaultAppPicker', actionTitle: true },
        { title: '应用商店', appImage: '/icons/drawer/appcenter.png', value: 'App Center', chevron: true, action: 'defaultAppPicker', actionTitle: true }
      ] }
    ]
  },

  defaultAppPicker: {
    title: '选择默认应用',
    sections: [
      { dynamicRows: 'defaultAppPicker' },
      { dynamicNote: 'defaultAppPicker' }
    ]
  },

  screenTime: {
    title: '应用活动详情',
    sections: [
      { usage: {
        dropdown: '屏幕使用时间',
        value: '2小时44分钟',
        unit: '今天',
        date: '11月9日周一',
        ticks: ['3小时', '2小时', '1小时', '0小时'],
        bars: [
          { label: '周一', h: 0.91 }, { label: '周二', h: 0 }, { label: '周三', h: 0 },
          { label: '周四', h: 0 }, { label: '周五', h: 0 }, { label: '周六', h: 0 }, { label: '周日', h: 0 }
        ]
      } },
      { tip: {
        title: '为应用设置定时器',
        text: '大多数应用都可以设置每日定时器。应用定时器倒数完毕后，相应应用在当天剩下的时间都将处于暂停状态。'
      } },
      { rows: [
        { title: '设置', appImage: '/icons/settings.png', subtitle: '58分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: '梦游社', appIcon: 'generic', subtitle: '33分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: '抖音', appImage: '/icons/drawer/douyin.png', subtitle: '32分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: '电话', appImage: '/icons/phone.png', subtitle: '24分钟', info: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: '小红书', appIcon: 'generic', subtitle: '7分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: 'Transsioner', appIcon: 'generic', subtitle: '5分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: 'Telegram', appImage: '/icons/telegram.png', subtitle: '3分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: 'Feedback', appIcon: 'generic', subtitle: '2分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: 'Phone Master', appImage: '/icons/drawer/phonemaster.png', subtitle: '1分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: '喜马拉雅', appImage: '/icons/drawer/ximalaya.png', subtitle: '不到 1分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: '微信', appImage: '/icons/wechat.png', subtitle: '不到 1分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true },
        { title: 'Google', appImage: '/icons/google.png', subtitle: '不到 1分钟', timer: true, chevron: true, action: 'appTimer', actionTitle: true }
      ] }
    ]
  },

  appTimer: {
    title: '应用定时器',
    sections: [
      { rows: [
        { title: '不限', radio: 'appTimer', radioValue: '不限' },
        { title: '30 分钟', radio: 'appTimer', radioValue: '30 分钟' },
        { title: '1 小时', radio: 'appTimer', radioValue: '1 小时' },
        { title: '2 小时', radio: 'appTimer', radioValue: '2 小时' }
      ] },
      { note: '定时器倒数完毕后，该应用在当天剩下的时间都将处于暂停状态。' }
    ]
  },

  contactsStorage: {
    title: '联系人存储',
    sections: [
      { header: '联系人信息保存位置', rows: [
        { title: '设备和Google', subtitle: 'oppcjz@gmail.com', appIcon: 'google', radio: 'contactsStorage', radioValue: 'oppcjz@gmail.com' },
        { title: '设备和Google', subtitle: 'jingzhan.chen@transsion.com', appIcon: 'google', radio: 'contactsStorage', radioValue: 'jingzhan.chen@transsion.com' },
        { title: '添加账号', icon: 'plus', chevron: true, action: 'addAccount' },
        { title: '仅限设备', subtitle: '新增联系人不会同步到你的账号。', icon: 'cloud-off', radio: 'contactsStorage', radioValue: '仅限设备' }
      ] },
      { note: '默认情况下，系统会将联系人保存到你的设备并同步到你的账号。' }
    ]
  },

  cloudMedia: {
    title: '云端媒体设置',
    sections: [
      { note: '在应用或网站要求您选择照片或视频时，轻松访问您的云端媒体内容' },
      { accentHeader: '访问以下来源的云端媒体内容' },
      { rows: [
        { title: 'Google 相册', subtitle: 'oppocjz@gmail.com', appImage: '/icons/drawer/smartgallery.png',
          radio: 'cloudMediaProvider', radioValue: 'Google 相册', gear: true, chevron: true, action: 'cloudMediaAccount' },
        { title: '无', icon: 'cloud-off', radio: 'cloudMediaProvider', radioValue: '无' }
      ] }
    ]
  },

  autoStart: {
    title: '自启动管理',
    sections: [
      { note: '禁止应用后台启动，将更省电和使用流畅，但部分应用接受数据可能延迟' },
      { rows: [{ title: '全部管理', toggle: 'autoStartMaster' }] },
      { rows: [
        { title: 'AHA Prime', subtitle: '已允许', appImage: '/icons/drawer/ahaprime.png', toggle: 'autoStartAhaPrime' },
        { title: 'Antigravity', subtitle: '已允许', appImage: '/icons/drawer/antigravity.png', toggle: 'autoStartAntigravity' },
        { title: 'ChatGPT', subtitle: '已允许', appImage: '/icons/drawer/chatgpt.png', toggle: 'autoStartChatgpt' },
        { title: 'DeepSeek', subtitle: '已允许', appImage: '/icons/drawer/deepseek.png', toggle: 'autoStartDeepseek' },
        { title: 'Epson Smart Panel', subtitle: '已允许', appImage: '/icons/drawer/epson.png', toggle: 'autoStartEpson' },
        { title: 'FlClash', subtitle: '已允许', appImage: '/icons/drawer/flclash.png', toggle: 'autoStartFlclash' },
        { title: 'Grok', subtitle: '已允许', appImage: '/icons/drawer/grok.png', toggle: 'autoStartGrok' },
        { title: 'Hi Translate', subtitle: '已允许', appImage: '/icons/drawer/hitranslate.png', toggle: 'autoStartHiTranslate' }
      ] }
    ],
    cta: '智能优化'
  },

  appDataUsage: {
    title: '移动数据用量',
    source: 'device', evidence: '138_data_wlan',
    sections: [
      { note: '11月2日至12月1日' },
      { rows: [
        { title: '总计', value: '234 MB', chevron: false },
        { title: '前台', value: '225 MB', chevron: false },
        { title: '后台', value: '9.01 MB', chevron: false }
      ] },
      { rows: [
        { title: '后台流量', subtitle: '允许在后台使用移动数据。', toggle: 'appBackgroundData' },
        { title: '不限制数据流量', subtitle: '允许在流量节省功能开启时无限量使用移动数据。', toggle: 'appUnlimitedData' }
      ] }
    ]
  },

  appBattery: {
    title: '应用的电池用量',
    source: 'device', evidence: '140_battery',
    sections: [
      { header: '管理电池用量' },
      { rows: [{ title: '允许后台使用', toggle: 'appBatteryBackground' }] },
      { rows: [
        { title: '已优化', subtitle: '根据您的使用情况进行优化。这是适用于大多数应用的建议设置。', radio: 'appBatteryMode', radioValue: '已优化' },
        { title: '无限制', subtitle: '不限制应用在后台运行时的电池用量。如果选择此设置，应用可能更耗电。', radio: 'appBatteryMode', radioValue: '无限制' }
      ] },
      { note: '更改应用的电池使用方式可能会影响应用性能。' }
    ]
  },

  cloudMediaAccount: {
    title: 'Google 相册',
    sections: [
      { rows: [
        { title: '账号', value: 'oppocjz@gmail.com', chevron: false },
        { title: '云端媒体', toggle: 'cloudMediaEnabled' }
      ] },
      { note: '在应用或网站要求您选择照片或视频时，可访问此账号下的云端媒体内容。' }
    ]
  },

  /* ==================== 位置信息 ==================== */
  locationPermission: {
    title: '位置信息',
    hero: { variant: 'location', title: '位置信息', caption: '具有此权限的应用可以访问此设备的位置信息' },
    sections: [
      { header: '始终允许', rows: [
        { title: '天气', appIcon: 'weather', chevron: true, action: 'appLocationPermission' }
      ] },
      { header: '仅在使用时允许', rows: [
        { title: '大众点评', appIcon: 'dianping', chevron: true, action: 'appLocationPermission' },
        { title: '叮咚买菜', appIcon: 'dingdong', chevron: true, action: 'appLocationPermission' },
        { title: '抖音', appIcon: 'douyin', chevron: true, action: 'appLocationPermission' },
        { title: '抖音极速版', appIcon: 'douyin', chevron: true, action: 'appLocationPermission' },
        { title: '高德地图', appIcon: 'amap', chevron: true, action: 'appLocationPermission' },
        { title: '微信', appIcon: 'wechat', chevron: true, action: 'appLocationPermission' }
      ] },
      { header: '不允许', rows: [
        { title: 'Transsioner', appIcon: 'transsioner', chevron: true, action: 'appLocationPermission' }
      ] }
    ]
  },

  appLocationPermission: {
    title: '位置信息权限',
    hero: { variant: 'appIcon', title: 'Folax', caption: '' },
    sections: [
      { accentNote: '是否允许此应用获得“位置信息”权限' },
      { rows: [
        { title: '仅在使用该应用时允许', radio: 'locationGrant', radioValue: '仅在使用该应用时允许' },
        { title: '每次都询问或在分享时允许', radio: 'locationGrant', radioValue: '每次都询问或在分享时允许' },
        { title: '不允许', radio: 'locationGrant', radioValue: '不允许' }
      ] },
      { rows: [{ title: '使用精确位置', subtitle: '精确位置关闭后，应用可获取您的大致位置', toggle: 'preciseLocation' }] },
      { links: [
        { label: '查看“Folax”获得的所有权限', action: 'appPermissions' },
        { label: '查看具有此权限的所有应用', action: 'locationPermission' }
      ] }
    ]
  },

  locationServices: {
    title: '位置信息服务',
    sections: [
      { rows: [
        { title: 'Google 位置信息共享', value: '点按即可管理', chevron: true, action: 'googleLocationSharing' },
        { title: '位置信息精确度', value: '已开启', chevron: true, action: 'locationAccuracy' },
        { title: '可信地点', value: '点按即可管理', chevron: true, action: 'trustedPlaces' },
        { title: '地震警报', value: '已开启', chevron: true, action: 'earthquakeAlerts' },
        { title: '时间轴', value: '点按即可管理', chevron: true, action: 'locationTimeline' },
        { title: '灾害警报', value: '已开启', chevron: true, action: 'disasterAlerts' },
        { title: '紧急位置信息服务', value: '已开启', chevron: true, action: 'emergencyLocation' },
        { title: 'WLAN 扫描', value: '已开启', chevron: true, action: 'wifiScanning' },
        { title: '蓝牙扫描', value: '未开启', chevron: true, action: 'bluetoothScanning' }
      ] }
    ]
  },

  googleLocationSharing: { title: 'Google 位置信息共享', sections: [{ rows: [{ title: '与联系人共享位置', toggle: 'googleLocationSharing' }] }, { note: '点按即可管理共享对象与时长。' }] },
  locationAccuracy: { title: '位置信息精确度', sections: [{ rows: [{ title: '提高位置信息精确度', subtitle: '使用 Wi-Fi、移动网络与传感器辅助定位。', toggle: 'locationAccuracy' }] }] },
  trustedPlaces: { title: '可信地点', sections: [{ rows: [{ title: '家', subtitle: '当前位置', chevron: true, action: 'trustedPlaceDetail', actionTitle: true }, { title: '公司', subtitle: '未设置', chevron: true, action: 'trustedPlaceDetail', actionTitle: true }] }, { rows: [{ title: '添加可信地点', chevron: true, action: 'addTrustedPlace' }] }] },
  earthquakeAlerts: { title: '地震警报', sections: [{ rows: [{ title: '地震警报', subtitle: '在附近发生地震时提前发出预警。', toggle: 'earthquakeAlerts' }] }] },
  locationTimeline: { title: '时间轴', sections: [{ rows: [{ title: '记录位置历史', toggle: 'locationTimeline' }] }, { note: '时间轴数据仅保存在本机，可随时删除。' }] },
  disasterAlerts: { title: '灾害警报', sections: [{ rows: [{ title: '灾害警报', toggle: 'disasterAlerts' }] }] },
  emergencyLocation: { title: '紧急位置信息服务', sections: [{ rows: [{ title: '紧急呼叫时发送位置', toggle: 'emergencyLocation' }] }, { note: '拨打紧急号码时，设备会向救援机构提供当前位置。' }] },
  wifiScanning: { title: 'WLAN 扫描', sections: [{ rows: [{ title: 'WLAN 扫描', subtitle: '即使 WLAN 已关闭，也允许应用扫描附近网络以改进定位。', toggle: 'wifiScanning' }] }] },
  bluetoothScanning: { title: '蓝牙扫描', sections: [{ rows: [{ title: '蓝牙扫描', subtitle: '即使蓝牙已关闭，也允许应用扫描附近设备以改进定位。', toggle: 'bluetoothScanning' }] }] },

  recentLocation: {
    title: '近期位置信息访问',
    sections: [
      { rows: [
        { title: 'Folax', appIcon: 'folax', subtitle: '10分钟前', chevron: true, action: 'appLocationPermission' },
        { title: '天气', appIcon: 'weather', subtitle: '22分钟前', chevron: true, action: 'appLocationPermission' },
        { title: '抖音', appIcon: 'douyin', subtitle: '4小时前', chevron: true, action: 'appLocationPermission' },
        { title: '微信', appIcon: 'wechat', subtitle: '15小时前', chevron: true, action: 'appLocationPermission' },
        { title: 'Transsioner', appIcon: 'transsioner', subtitle: '16小时前', chevron: true, action: 'appLocationPermission' }
      ] }
    ]
  },

  /* ==================== 四级页 / 动作落地页 ==================== */
  fingerprintEnroll: {
    title: '添加指纹',
    hero: { variant: 'face', caption: '将手指放在屏下指纹区域，按提示反复抬起与放下。', dots: 0 },
    sections: [{ note: '录入过程中请保持手指与屏幕清洁。' }], cta: '开始录入'
  },
  faceEnroll: {
    title: '录入面部数据',
    hero: { variant: 'face', caption: '请正对屏幕，缓慢转动头部以完成采集。', dots: 0 },
    sections: [{ note: '请在光线充足的环境下录入，避免佩戴遮挡物。' }], cta: '开始录入'
  },
  privacyPasswordChange: {
    title: '修改隐私密码',
    hero: { variant: 'lock', caption: '请先验证当前隐私密码。', dots: 0 },
    sections: [{ note: '原型不采集真实密码，此页仅复刻设置流程与视觉层级。' }], cta: '下一步'
  },
  unlockCaptureLog: {
    title: '抓拍记录',
    sections: [{ empty: { text: '暂无抓拍记录' } }]
  },
  remoteLock: {
    title: '远程锁定',
    sections: [
      { rows: [{ title: '通过 Infinix ID 远程锁定', toggle: 'remoteLockEnabled' }] },
      { note: '设备丢失时，可在任意浏览器登录 Infinix ID 将设备锁定并显示联系方式。' }
    ]
  },
  xhideApps: { title: '隐藏应用', sections: [{ empty: { text: '暂无隐藏应用' } }] },
  xhidePhotos: { title: '隐藏图片', sections: [{ empty: { text: '暂无隐藏图片' } }] },
  xhideDocs: { title: '隐藏文档', sections: [{ empty: { text: '暂无隐藏文档' } }] },
  privacyDoc: {
    title: '隐私保护策略',
    sections: [
      { notes: [
        '隐私保护策略说明设备如何收集、使用、存储与共享个人信息，以及你如何管理这些信息。',
        '数据采集遵循最小必要原则；敏感权限调用会在状态栏即时提示，并可在隐私信息中心查看权限使用记录。',
        '第三方共享清单与个人信息收集清单可在 XOS 官网查询，清单随系统版本更新。'
      ] },
      { rows: [{ title: '版本', value: 'XOS 17.0', chevron: false }, { title: '更新日期', value: '随系统版本更新', chevron: false }] }
    ]
  },
  healthDataApps: {
    title: '健康数据共享',
    sections: [{ empty: { text: '暂无应用请求健康数据' } }]
  },
  permissionGrant: {
    title: '付费短信权限',
    sections: [
      { rows: [
        { title: '始终允许', radio: 'premiumSmsGrant', radioValue: '始终允许' },
        { title: '每次询问', radio: 'premiumSmsGrant', radioValue: '每次询问' },
        { title: '不允许', radio: 'premiumSmsGrant', radioValue: '不允许' }
      ] }
    ]
  },
  permissionTimeline: {
    title: '权限使用记录',
    sections: [
      { header: '过去 24 小时', rows: [
        { title: '最近的权限访问', subtitle: '可在隐私信息中心查看完整时间线', chevron: false }
      ] },
      { note: '记录仅保存在本机，不会被上传。' }
    ]
  },
  permissionApps: {
    title: '权限对应的应用',
    sections: [
      { header: '允许', rows: [{ title: '已授权的应用', chevron: false }] },
      { header: '不允许', rows: [{ title: '未授权的应用', chevron: false }] }
    ]
  },
  appScreenTime: {
    title: '应用使用时间',
    titleFrom: 'selectedApp',
    source: 'device', evidence: '139_usage',
    sections: [
      { usage: {
        dropdowns: ['屏幕使用时间', '每天'],
        value: '0分钟',
        unit: '今天',
        date: '11月9日周一',
        ticks: ['2分钟', '1分钟', '0分钟'],
        bars: [
          { label: '周一', h: 0 }, { label: '周二', h: 0 }, { label: '周三', h: 0 },
          { label: '周四', h: 0 }, { label: '周五', h: 0 }, { label: '周六', h: 0 }, { label: '周日', h: 0 }
        ],
        appIcon: true
      } },
      { accentHeader: '设置' },
      { rows: [
        { title: '应用定时器', subtitle: '无定时器', icon: 'timer', chevron: true, action: 'appTimer' },
        { title: '管理通知', icon: 'bell', chevron: true, openAppNotifications: true }
      ] }
    ]
  },

  appStorage: {
    title: '存储',
    source: 'device', evidence: '137_storage',
    sections: [
      { rows: [{ title: '总计', value: '1.57 GB', chevron: false }] },
      { rows: [
        { title: '应用大小', value: '659 MB', chevron: false },
        { title: '用户数据', value: '0.91 GB', chevron: false },
        { title: '清除存储空间', link: true, run: true, chevron: false }
      ] },
      { rows: [
        { title: '缓存', value: '0 B', chevron: false },
        { title: '清理缓存', link: true, run: true, chevron: false }
      ] }
    ]
  },
  appPermissionsDetail: {
    title: '应用权限',
    sections: [
      { header: '已允许', rows: [
        { title: '位置信息', chevron: false }, { title: '相机', chevron: false }, { title: '存储空间', chevron: false }
      ] },
      { header: '未允许', rows: [{ title: '麦克风', chevron: false }, { title: '通讯录', chevron: false }] }
    ]
  },

  appOpenByDefault: {
    title: '默认打开方式',
    sections: [
      { rows: [
        { title: '在应用中打开支持的链接', toggle: 'appOpenLinks' },
        { title: '支持的链接', chevron: false, value: '0 个' }
      ] }
    ]
  },
  addAccount: {
    title: '添加账号',
    sections: [
      { rows: [
        { title: 'Google', appIcon: 'google', chevron: true, action: 'addAccount' },
        { title: 'Infinix ID', appIcon: 'generic', chevron: true, action: 'addAccount' }
      ] },
      { note: '添加账号后，联系人会自动同步到该账号。' }
    ]
  },
  trustedPlaceDetail: {
    title: '可信地点',
    sections: [
      { rows: [
        { title: '名称', value: '家', chevron: false },
        { title: '地址', value: '当前位置', chevron: false },
        { title: '在此地点保持解锁', toggle: 'trustedPlaceUnlock' }
      ] }
    ]
  },
  addTrustedPlace: {
    title: '添加可信地点',
    sections: [
      { rows: [
        { title: '选择地点', value: '当前位置', chevron: true, action: 'trustedPlaceDetail' },
        { title: '命名', value: '未命名', chevron: false }
      ] }
    ],
    cta: '保存'
  }

}

/** 二级页 → 三级页 key 的接线表（二级页只用这张表，不各自硬编码）。 */
export const GROUP3_ENTRY_MAP = {
  security: {
    lockScreenPassword: 'lockScreenPassword',
    fingerprint: 'fingerprint',
    faceRecognition: 'faceRecognition',
    privacyPassword: 'privacyPassword',
    antiTheft: 'antiTheft',
    systemSecurity: 'systemSecurity',
    playSystemUpdate: 'playSystemUpdate',
    appLock: 'appLock'
  },
  privacy: {
    xhide: 'xhide',
    appClone: 'appClone',
    appLock: 'appLock',
    antiPeek: 'antiPeek',
    aiAntiFraud: 'aiAntiFraud',
    screenSharePrivacy: 'screenSharePrivacy',
    lendMode: 'lendMode',
    dualSystem: 'dualSystem',
    paymentProtection: 'paymentProtection',
    adControl: 'adControl',
    repairMode: 'repairMode',
    secureKeyboard: 'secureKeyboard',
    unlockProtection: 'unlockProtection',
    privacyPolicyPage: 'privacyPolicyPage',
    privacyRiskLog: 'privacyRiskLog',
    privacyDashboard: 'privacyDashboard',
    appPermissions: 'appPermissions',
    healthData: 'healthData',
    locationDataUpdates: 'locationDataUpdates',
    specialAppAccess: 'specialAppAccess',
    morePrivacy: 'morePrivacy'
  },
  appsManage: {
    appUpdate: 'appUpdate',
    appList: 'appList',
    appRestore: 'appRestore',
    appClone: 'appClone',
    defaultApps: 'defaultApps',
    screenTime: 'screenTime',
    contactsStorage: 'contactsStorage',
    cloudMedia: 'cloudMedia',
    autoStart: 'autoStart',
    appLock: 'appLock',
    specialAppAccess: 'specialAppAccess'
  },
  location: {
    locationPermission: 'locationPermission',
    locationServices: 'locationServices',
    recentLocation: 'recentLocation',
    appLocationPermission: 'appLocationPermission'
  }
}

/**
 * 全量取证台账（2026-11-09 审计，独立于页面配置，避免用正则改块结构）。
 *   device      = /tmp/ref/gI/ 下有真机逐页截图（证据见 PAGE_EVIDENCE）；
 *   derived     = 真机首页有该入口、子页未逐页取证，按同组真机形态推导；
 *   placeholder = 真机点进去是隐私遮罩纯黑屏，做验证引导页。
 * ⚠️ 新增页面必须在这里登记来源；derived 页面不许编具体数值/假状态/假应用名。
 */
export const PAGE_SOURCES = Object.freeze({
  lockScreenPassword: 'device',
  passwordTypeNumeric: 'derived',
  passwordTypeMixed: 'derived',
  passwordTypePattern: 'derived',
  fingerprint: 'derived',
  faceRecognition: 'derived',
  privacyPassword: 'derived',
  antiTheft: 'device',
  unlockCapture: 'derived',
  theftAlarm: 'derived',
  theftProtection: 'derived',
  powerOffPassword: 'derived',
  unlockProtection: 'device',
  systemSecurity: 'derived',
  playSystemUpdate: 'device',
  appLock: 'placeholder',
  xhide: 'placeholder',
  appClone: 'device',
  cloneMoreApps: 'device',
  antiPeek: 'device',
  aiAntiFraud: 'derived',
  screenSharePrivacy: 'derived',
  lendMode: 'device',
  lendScope: 'derived',
  dualSystem: 'device',
  paymentProtection: 'derived',
  adControl: 'device',
  repairMode: 'device',
  secureKeyboard: 'device',
  privacyPolicyPage: 'device',
  privacyRiskLog: 'device',
  healthData: 'device',
  locationDataUpdates: 'device',
  specialAppAccess: 'device',
  specialInstallUnknown: 'derived',
  specialWifiControl: 'derived',
  specialModifySettings: 'derived',
  specialAlarms: 'derived',
  specialAllFiles: 'derived',
  specialModeAccess: 'derived',
  specialPremiumSms: 'derived',
  specialUsageAccess: 'derived',
  specialMotion: 'derived',
  specialOverlay: 'derived',
  specialNotifAccess: 'derived',
  specialDndAccess: 'derived',
  morePrivacy: 'device',
  privacyDashboard: 'device',
  appPermissions: 'derived',
  appUpdate: 'device',
  appList: 'device',
  appDetail: 'device',
  appRestore: 'device',
  defaultApps: 'device',
  defaultAppPicker: 'device',
  screenTime: 'device',
  appTimer: 'device',
  contactsStorage: 'device',
  cloudMedia: 'device',
  autoStart: 'device',
  appDataUsage: 'device',
  appBattery: 'device',
  cloudMediaAccount: 'derived',
  locationPermission: 'device',
  appLocationPermission: 'device',
  locationServices: 'device',
  googleLocationSharing: 'derived',
  locationAccuracy: 'derived',
  trustedPlaces: 'derived',
  earthquakeAlerts: 'derived',
  locationTimeline: 'derived',
  disasterAlerts: 'derived',
  emergencyLocation: 'derived',
  wifiScanning: 'derived',
  bluetoothScanning: 'derived',
  recentLocation: 'device',
  fingerprintEnroll: 'derived',
  faceEnroll: 'derived',
  privacyPasswordChange: 'derived',
  unlockCaptureLog: 'derived',
  remoteLock: 'derived',
  xhideApps: 'derived',
  xhidePhotos: 'derived',
  xhideDocs: 'derived',
  privacyDoc: 'derived',
  healthDataApps: 'derived',
  permissionGrant: 'derived',
  permissionTimeline: 'derived',
  permissionApps: 'derived',
  appScreenTime: 'device',
  appStorage: 'device',
  appPermissionsDetail: 'derived',
  appOpenByDefault: 'derived',
  addAccount: 'derived',
  trustedPlaceDetail: 'derived',
  addTrustedPlace: 'derived',
})

export const PAGE_EVIDENCE = Object.freeze({
  lockScreenPassword: '42_biometric',
  antiTheft: '50_anti_theft',
  unlockProtection: '02_sec_top',
  playSystemUpdate: '02_sec_top',
  appLock: '102_applock（密码验证遮罩）',
  xhide: '71_xhide（隐私遮罩黑屏）',
  appClone: '33_app_clone / 112_clone_top',
  cloneMoreApps: '122_clone_more',
  antiPeek: '74_antipeek',
  lendMode: '76_lend',
  dualSystem: '75_dualsys',
  adControl: '07_sec_last',
  repairMode: '07_sec_last',
  secureKeyboard: '05_sec_mid',
  privacyPolicyPage: '07_sec_last',
  privacyRiskLog: '07_sec_last',
  healthData: '07_sec_last',
  locationDataUpdates: '40_more',
  specialAppAccess: '45_special_access / 103_special',
  morePrivacy: '40_more',
  privacyDashboard: '77_privacy_center',
  appUpdate: '30_app_update',
  appList: '110_app_list_top / 31_app_list',
  appDetail: '130_app_info_top / 136_app_info_back',
  appRestore: '32_app_restore',
  defaultApps: '111_default_top / 34_default_apps',
  defaultAppPicker: '121_default_picker',
  screenTime: '91_screen_time / 104_screen_time_bottom',
  appTimer: '139_usage（应用定时器入口）',
  contactsStorage: '92_contacts',
  cloudMedia: '93_cloud_media',
  autoStart: '101_autostart',
  appDataUsage: '138_data_wlan',
  appBattery: '140_battery',
  locationPermission: '83_loc_perm',
  appLocationPermission: '86_loc_recent',
  locationServices: '84_loc_services',
  recentLocation: '85_loc_all',
  appScreenTime: '139_usage',
  appStorage: '137_storage',
})

/** 取页面配置；未知 key 一律回退到 null，由调用方关掉子页，避免白屏。 */
export function getGroup3Page(key) {
  return GROUP3_PAGES[key] || null
}
