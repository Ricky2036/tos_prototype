import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const K_MODES = 'tos_modes_data'
const K_ROUTINES = 'tos_routines_data'
const K_ACTIVE_MODE = 'tos_active_mode_id'

const DEFAULT_MODES = [
  {
    id: 'sleep',
    name: '睡眠',
    iconKey: 'sleep',
    color: '#4F46E5',
    isCustom: false,
    subtitle: '开启免打扰模式',
    activeSubtitle: '直到我将其关闭',
    description: '睡个好觉。在您睡觉时让手机保持静音，让双眼更舒适。',
    condition: {
      type: 'schedule',
      title: '就寝时间',
      value: '22:30 - 次日 07:00 (每天)',
      enabled: true
    },
    dnd: {
      enabled: true,
      allowedContacts: '所有收藏联系人',
      allowedCalls: '仅限重复来电'
    },
    settingsChanges: [
      { key: 'eyeCare', label: '护眼模式', enabled: true, value: '自适应' },
      { key: 'darkMode', label: '黑暗模式', enabled: true, value: '开' },
      { key: 'grayScale', label: '灰阶显示', enabled: true, value: '开' },
      { key: 'soundMode', label: '声音模式与音量', enabled: true, value: '静音' }
    ],
    appearance: {
      lockscreen: '深色睡眠壁纸',
      homescreen: '深色睡眠壁纸'
    }
  },
  {
    id: 'theater',
    name: '影院',
    iconKey: 'theater',
    color: '#D97706',
    isCustom: false,
    subtitle: '未设置',
    activeSubtitle: '影院体验保护中',
    description: '观影时不被打扰。降低屏幕亮度并静音通知。',
    condition: {
      type: 'location',
      title: '特定地点',
      value: '万达影城 / 电影院',
      enabled: false
    },
    dnd: {
      enabled: true,
      allowedContacts: '无人',
      allowedCalls: '拒绝全部'
    },
    settingsChanges: [
      { key: 'brightness', label: '屏幕亮度', enabled: true, value: '15%' },
      { key: 'soundMode', label: '声音模式', enabled: true, value: '静音' },
      { key: 'eyeCare', label: '极暗模式', enabled: true, value: '开' }
    ],
    appearance: null
  },
  {
    id: 'driving',
    name: '驾驶',
    iconKey: 'driving',
    color: '#059669',
    isCustom: false,
    subtitle: '开启免打扰模式',
    activeSubtitle: '导航与驾驶辅助中',
    description: '专注驾驶，安全出行。连接车载蓝牙时自动播报路线与通知。',
    condition: {
      type: 'bluetooth',
      title: '车载蓝牙',
      value: '连接到 车载无线连接 时',
      enabled: true
    },
    dnd: {
      enabled: true,
      allowedContacts: '所有联系人',
      allowedCalls: '车载免提接听'
    },
    settingsChanges: [
      { key: 'readNotif', label: '语音朗读通知', enabled: true, value: '开' },
      { key: 'autoNav', label: '自动导航', enabled: true, value: '开启高德地图' },
      { key: 'soundVolume', label: '媒体音量', enabled: true, value: '80%' }
    ],
    appearance: null
  },
  {
    id: 'exercise',
    name: '运动',
    iconKey: 'exercise',
    color: '#EA580C',
    isCustom: false,
    subtitle: '未设置',
    activeSubtitle: '健身运动记录中',
    description: '保持专注，挥洒汗水。自动保持屏幕常亮并开启运动音乐。',
    condition: {
      type: 'context',
      title: '运动状态',
      value: '检测到跑步、骑行或健身时',
      enabled: false
    },
    dnd: {
      enabled: true,
      allowedContacts: '收藏联系人',
      allowedCalls: '仅限紧急来电'
    },
    settingsChanges: [
      { key: 'keepScreenOn', label: '屏幕常亮', enabled: true, value: '开' },
      { key: 'musicPlay', label: '播放歌单', enabled: true, value: '活力跑步电台' }
    ],
    appearance: null
  },
  {
    id: 'relax',
    name: '放松',
    iconKey: 'relax',
    color: '#10B981',
    isCustom: false,
    subtitle: '开启护眼与舒适音律',
    activeSubtitle: '放松身心中',
    description: '在闲暇时光舒缓身心。屏蔽工作类通知，营造宁静氛围。',
    condition: {
      type: 'schedule',
      title: '特定时间',
      value: '20:30 - 22:30 (每日)',
      enabled: true
    },
    dnd: {
      enabled: false,
      allowedContacts: '所有人',
      allowedCalls: '允许'
    },
    settingsChanges: [
      { key: 'eyeCare', label: '护眼模式', enabled: true, value: '自适应' },
      { key: 'blockWorkApps', label: '屏蔽工作应用', enabled: true, value: '已启用 (飞书、钉钉)' }
    ],
    appearance: null
  },
  {
    id: 'work',
    name: '工作',
    iconKey: 'work',
    color: '#2563EB',
    isCustom: false,
    subtitle: '开启免打扰模式',
    activeSubtitle: '高效办公中',
    description: '专注于重要任务。到达工作地点时开启免打扰并保持静音。',
    condition: {
      type: 'location',
      title: '工作地点',
      value: '工作日 09:00 - 18:00',
      enabled: true
    },
    dnd: {
      enabled: true,
      allowedContacts: '工作联系人与收藏联系人',
      allowedCalls: '允许重复来电'
    },
    settingsChanges: [
      { key: 'soundMode', label: '声音模式', enabled: true, value: '仅振动' },
      { key: 'workDesktop', label: '办公桌面布局', enabled: true, value: '开启' }
    ],
    appearance: null
  },
  {
    id: 'gaming',
    name: '游戏',
    iconKey: 'gaming',
    color: '#7C3AED',
    isCustom: false,
    subtitle: '极限性能与通知屏蔽',
    activeSubtitle: '极速游戏电竞中',
    description: '全身心投入游戏。屏蔽浮动通知、来电弹窗，并锁定高刷新率。',
    condition: {
      type: 'app',
      title: '运行游戏',
      value: '启动指定游戏应用程序时',
      enabled: true
    },
    dnd: {
      enabled: true,
      allowedContacts: '无人',
      allowedCalls: '后台静默接听'
    },
    settingsChanges: [
      { key: 'refreshRate', label: '屏幕刷新率', enabled: true, value: '120Hz 锁定' },
      { key: 'perfMode', label: '性能调优', enabled: true, value: '极速性能模式' },
      { key: 'blockMistouch', label: '边缘防误触', enabled: true, value: '高敏感度' }
    ],
    appearance: null
  },
  {
    id: 'prayer',
    name: '礼拜模式',
    iconKey: 'prayer',
    color: '#047857',
    isCustom: false,
    subtitle: '开启免打扰模式',
    activeSubtitle: '肃穆礼拜时刻',
    description: '在神圣时刻保持专注与静肃。自动匹配当地礼拜时刻并静音。',
    condition: {
      type: 'event',
      title: '礼拜时刻',
      value: '晨礼、晌礼、晡礼、昏礼、宵礼',
      enabled: true
    },
    dnd: {
      enabled: true,
      allowedContacts: '无人',
      allowedCalls: '拒绝全部'
    },
    settingsChanges: [
      { key: 'soundMode', label: '声音模式', enabled: true, value: '静音' },
      { key: 'compassPrompt', label: '朝向指引', enabled: true, value: '屏幕弹窗提醒' }
    ],
    appearance: null
  }
]

const DEFAULT_ROUTINES = [
  {
    id: 'routine_dark',
    name: '在暗处',
    iconKey: 'moon',
    color: '#4338CA',
    enabled: true,
    description: '调整弱光条件下的显示设置。',
    conditions: [
      { id: 'c1', type: 'time', title: '时间段', value: '22:00 - 次日 06:30' }
    ],
    actions: [
      { id: 'a1', type: 'display', title: '黑暗模式', value: '开' },
      { id: 'a2', type: 'display', title: '护眼模式', value: '自适应' },
      { id: 'a3', type: 'display', title: '极暗', value: '开: 80%' }
    ],
    whenEnded: [
      { id: 'e1', type: 'display', title: '黑暗模式', desc: '返回到日常程序运行前的状态' },
      { id: 'e2', type: 'display', title: '极暗', desc: '恢复默认亮度' }
    ]
  },
  {
    id: 'routine_home',
    name: '导航回家',
    iconKey: 'navigation',
    color: '#0284C7',
    enabled: true,
    description: '一键规划回家最优行车路径。',
    conditions: [
      { id: 'c2', type: 'manual', title: '手动启动', value: '点击日常程序快捷方式' }
    ],
    actions: [
      { id: 'a4', type: 'app', title: '打开高德地图', value: '开始导航至“家”' },
      { id: 'a5', type: 'sound', title: '媒体音量', value: '75%' }
    ],
    whenEnded: []
  },
  {
    id: 'routine_battery',
    name: '充满电时接收通知',
    iconKey: 'battery',
    color: '#16A34A',
    enabled: true,
    description: '电量达 100% 时语音及振动提醒拔除充电器。',
    conditions: [
      { id: 'c3', type: 'battery', title: '电池电量', value: '等于 100%' }
    ],
    actions: [
      { id: 'a6', type: 'notification', title: '语音播报', value: '电池已充满，请拔下充电线' },
      { id: 'a7', type: 'sound', title: '震动提醒', value: '短振动 2 次' }
    ],
    whenEnded: []
  }
]

export const DISCOVER_CATEGORIES = [
  {
    id: 'anywhere',
    title: '随时随地都很有用',
    items: [
      {
        id: 'disc_nav_home',
        name: '导航回家',
        iconKey: 'navigation',
        color: '#0284C7',
        description: '一键规划回家最优行车路径并播放路况。',
        conditions: [{ type: 'manual', title: '手动启动', value: '点击桌面或快捷入口' }],
        actions: [
          { type: 'app', title: '打开地图', value: '导航回家' },
          { type: 'sound', title: '媒体音量', value: '75%' }
        ]
      },
      {
        id: 'disc_listen_notifs',
        name: '收听通知',
        iconKey: 'headphones',
        color: '#7C3AED',
        description: '戴上耳机时自动语音朗读新消息。',
        conditions: [{ type: 'device', title: '已连接耳机', value: '蓝牙耳机已连接' }],
        actions: [
          { type: 'notif', title: '语音朗读通知', value: '微信、短信、邮件' }
        ]
      }
    ]
  },
  {
    id: 'time_place',
    title: '在特定时间或地点非常有用',
    items: [
      {
        id: 'disc_meeting',
        name: '会议',
        iconKey: 'mic',
        color: '#2563EB',
        description: '会议期间让设备保持安静，防止打扰参会人员。',
        conditions: [{ type: 'calendar', title: '日历日程', value: '包含“会议”关键词' }],
        actions: [
          { type: 'dnd', title: '免打扰', value: '开' },
          { type: 'sound', title: '声音模式', value: '静音' },
          { type: 'display', title: '屏幕亮度', value: '35%' }
        ]
      },
      {
        id: 'disc_school',
        name: '在学校',
        iconKey: 'book',
        color: '#EA580C',
        description: '上课期间避免任何声音发出，专注课堂学习。',
        conditions: [{ type: 'location', title: '到达地点', value: '学校教学楼' }],
        actions: [
          { type: 'sound', title: '声音模式', value: '仅振动' },
          { type: 'sound', title: '媒体音量', value: '0%' }
        ]
      },
      {
        id: 'disc_in_dark',
        name: '在暗处',
        iconKey: 'moon',
        color: '#4338CA',
        description: '调整弱光条件下的显示设置，护眼防刺眼。',
        conditions: [{ type: 'time', title: '时间段', value: '22:00 - 次日 06:30' }],
        actions: [
          { type: 'display', title: '黑暗模式', value: '开' },
          { type: 'display', title: '护眼模式', value: '自适应' },
          { type: 'display', title: '极暗', value: '开: 80%' }
        ]
      },
      {
        id: 'disc_morning_brief',
        name: '打开即时简报',
        iconKey: 'sun',
        color: '#D97706',
        description: '闹钟关闭后播报今日天气、重点行程与待办。',
        conditions: [{ type: 'clock', title: '关闭闹钟', value: '早晨闹钟停止时' }],
        actions: [
          { type: 'ai', title: 'Fola 简报', value: '语音播报天气与日程' },
          { type: 'display', title: '壁纸亮度', value: '恢复日间亮度' }
        ]
      },
      {
        id: 'disc_morning_music',
        name: '清晨音乐',
        iconKey: 'music',
        color: '#10B981',
        description: '清晨醒来播放舒缓旋律，开启元气一天。',
        conditions: [{ type: 'time', title: '工作日早晨', value: '07:30 - 08:30' }],
        actions: [
          { type: 'app', title: '播放音乐', value: '清晨唤醒精选' },
          { type: 'sound', title: '媒体音量', value: '渐强至 50%' }
        ]
      }
    ]
  },
  {
    id: 'battery_group',
    title: '电池',
    items: [
      {
        id: 'disc_bat_full',
        name: '充满电时接收通知',
        iconKey: 'battery',
        color: '#16A34A',
        description: '电池充满时提醒拔除电源，保护电池健康。',
        conditions: [{ type: 'battery', title: '电量水平', value: '等于 100%' }],
        actions: [
          { type: 'sound', title: '铃声播报', value: '充满电提示音' },
          { type: 'notif', title: '通知弹窗', value: '电池已充满' }
        ]
      },
      {
        id: 'disc_wireless_effect',
        name: '无线充电的视觉效果',
        iconKey: 'sparkles',
        color: '#0D9488',
        description: '置于无线充电板上时展现灵动能量光圈。',
        conditions: [{ type: 'battery', title: '无线充电', value: '开始无线充电' }],
        actions: [
          { type: 'display', title: '灵动岛光效', value: '全环绿光呼吸' }
        ]
      },
      {
        id: 'disc_charging_aod',
        name: '正在充电',
        iconKey: 'zap',
        color: '#0284C7',
        description: '充电时持续点亮息屏显示，随时查看电量进度。',
        conditions: [{ type: 'battery', title: '充电状态', value: '正在充电' }],
        actions: [
          { type: 'display', title: '全时息屏', value: '开启' }
        ]
      }
    ]
  },
  {
    id: 'maximize_phone',
    title: '充分利用您的手机',
    items: [
      {
        id: 'disc_oneleap',
        name: 'OneLeap 互联',
        iconKey: 'laptop',
        color: '#2563EB',
        description: '靠近电脑时自动开启多屏协同与文件拖拽。',
        conditions: [{ type: 'device', title: '靠近电脑', value: '检测到已配对笔记本' }],
        actions: [
          { type: 'connect', title: '跨屏协同', value: '自动连接' }
        ]
      },
      {
        id: 'disc_wifi_qr',
        name: 'WLAN 二维码',
        iconKey: 'wifi',
        color: '#059669',
        description: '好友到访时一键在桌面展示 Wi-Fi 分享码。',
        conditions: [{ type: 'manual', title: '手动启动', value: '快捷指令' }],
        actions: [
          { type: 'connect', title: '生成分享卡', value: '当前连接的 Wi-Fi' }
        ]
      },
      {
        id: 'disc_vip_call',
        name: '再也不会错过重要来电',
        iconKey: 'bell',
        color: '#E11D48',
        description: '即使静音状态下，特定家人来电依然最大声响铃。',
        conditions: [{ type: 'phone', title: '来电联系人', value: '家人与紧急联系人' }],
        actions: [
          { type: 'sound', title: '响铃音量', value: '100% 并闪光灯提醒' }
        ]
      },
      {
        id: 'disc_important_notif',
        name: '始终获取重要的通知',
        iconKey: 'shield-check',
        color: '#7C3AED',
        description: '紧急群聊消息突破免打扰即刻亮屏弹窗。',
        conditions: [{ type: 'notif', title: '应用通知', value: '核心工作群' }],
        actions: [
          { type: 'notif', title: '高优先级唤醒', value: '点亮屏幕并置顶' }
        ]
      },
      {
        id: 'disc_open_music_app',
        name: '打开应用程序',
        iconKey: 'tv',
        color: '#D97706',
        description: '插入耳机时快速启动常用音频或播客应用。',
        conditions: [{ type: 'device', title: '耳机连接', value: '插入有线耳机' }],
        actions: [
          { type: 'app', title: '启动应用', value: '网易云音乐' }
        ]
      },
      {
        id: 'disc_clear_clipboard',
        name: '清除剪贴板',
        iconKey: 'shield',
        color: '#64748B',
        description: '锁屏 5 分钟后自动清除剪贴板，严防隐私泄露。',
        conditions: [{ type: 'lock', title: '锁屏时长', value: '锁屏超过 5 分钟' }],
        actions: [
          { type: 'privacy', title: '清空剪贴板', value: '彻底抹除文本' }
        ]
      }
    ]
  },
  {
    id: 'accessibility_group',
    title: '更易于访问',
    items: [
      {
        id: 'disc_mono_audio',
        name: '单声道音频',
        iconKey: 'headphones',
        color: '#0D9488',
        description: '单耳佩戴耳机时自动将立体声合并为单声道。',
        conditions: [{ type: 'device', title: '单耳佩戴', value: '仅佩戴单侧耳机' }],
        actions: [
          { type: 'sound', title: '单声道音频', value: '开' }
        ]
      },
      {
        id: 'disc_mute_outside',
        name: '在您外出时静音',
        iconKey: 'coffee',
        color: '#9333EA',
        description: '离开家庭 Wi-Fi 网络时自动将媒体静音。',
        conditions: [{ type: 'wifi', title: '断开家庭 Wi-Fi', value: '离开家里' }],
        actions: [
          { type: 'sound', title: '媒体音量', value: '0%' }
        ]
      }
    ]
  }
]

function safeGetItem(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key)
    }
  } catch {}
  return null
}

function safeSetItem(key, val) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val)
    }
  } catch {}
}

function safeRemoveItem(key) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key)
    }
  } catch {}
}

export const useModesAndRoutinesStore = defineStore('modesAndRoutines', () => {
  // 从 localStorage 恢复或使用预设
  const savedModes = (() => {
    try {
      const raw = safeGetItem(K_MODES)
      return raw ? JSON.parse(raw) : DEFAULT_MODES
    } catch {
      return DEFAULT_MODES
    }
  })()

  const savedRoutines = (() => {
    try {
      const raw = safeGetItem(K_ROUTINES)
      return raw ? JSON.parse(raw) : DEFAULT_ROUTINES
    } catch {
      return DEFAULT_ROUTINES
    }
  })()

  const savedActiveMode = (() => {
    try {
      return safeGetItem(K_ACTIVE_MODE) || null
    } catch {
      return null
    }
  })()

  const modes = ref(savedModes)
  const routines = ref(savedRoutines)
  const activeModeId = ref(savedActiveMode)
  const activeTab = ref('modes') // 'modes' | 'routines' | 'discover'
  const historyLogs = ref([
    { id: 1, time: '22:30', text: '已根据作息时间表自动开启“睡眠”模式' },
    { id: 2, time: '07:00', text: '早晨闹钟关闭，“睡眠”模式已停止' },
    { id: 3, time: '09:05', text: '到达公司，已开启“工作”模式' },
    { id: 4, time: '18:15', text: '离开公司，已关闭“工作”模式' }
  ])

  function saveModes() {
    safeSetItem(K_MODES, JSON.stringify(modes.value))
  }

  function saveRoutines() {
    safeSetItem(K_ROUTINES, JSON.stringify(routines.value))
  }

  function saveActiveMode() {
    if (activeModeId.value) {
      safeSetItem(K_ACTIVE_MODE, activeModeId.value)
    } else {
      safeRemoveItem(K_ACTIVE_MODE)
    }
  }

  const activeMode = computed(() => {
    return modes.value.find((m) => m.id === activeModeId.value) || null
  })

  /** 切换模式开启或关闭 */
  function toggleMode(modeId) {
    if (activeModeId.value === modeId) {
      const target = modes.value.find((m) => m.id === modeId)
      activeModeId.value = null
      logEvent(`已手动关闭“${target ? target.name : modeId}”模式`)
    } else {
      activeModeId.value = modeId
      const target = modes.value.find((m) => m.id === modeId)
      logEvent(`已手动开启“${target ? target.name : modeId}”模式`)
    }
    saveActiveMode()
  }

  /** 获取指定模式详情 */
  function getMode(modeId) {
    return modes.value.find((m) => m.id === modeId) || null
  }

  /** 添加自定义模式 */
  function addCustomMode({ name, color, iconKey, description = '' }) {
    const newId = `custom_${Date.now()}`
    const newMode = {
      id: newId,
      name: name.trim() || '自定义模式',
      iconKey: iconKey || 'book',
      color: color || '#2563EB',
      isCustom: true,
      subtitle: '未设置',
      activeSubtitle: '模式运行中',
      description: description || '满足您特定生活习惯的自定义模式。',
      condition: {
        type: 'manual',
        title: '手动开启',
        value: '随时点击开启',
        enabled: true
      },
      dnd: {
        enabled: true,
        allowedContacts: '所有收藏联系人',
        allowedCalls: '允许'
      },
      settingsChanges: [
        { key: 'eyeCare', label: '护眼模式', enabled: false, value: '关' },
        { key: 'soundMode', label: '声音模式', enabled: true, value: '仅振动' }
      ],
      appearance: null
    }

    modes.value.push(newMode)
    saveModes()
    logEvent(`创建了自定义模式“${newMode.name}”`)
    return newMode
  }

  /** 删除自定义模式 */
  function deleteCustomMode(modeId) {
    const idx = modes.value.findIndex((m) => m.id === modeId && m.isCustom)
    if (idx !== -1) {
      const name = modes.value[idx].name
      if (activeModeId.value === modeId) {
        activeModeId.value = null
        saveActiveMode()
      }
      modes.value.splice(idx, 1)
      saveModes()
      logEvent(`删除了自定义模式“${name}”`)
      return true
    }
    return false
  }

  /** 更新模式 */
  function updateMode(modeId, patch) {
    const target = modes.value.find((m) => m.id === modeId)
    if (target) {
      Object.assign(target, patch)
      saveModes()
      return true
    }
    return false
  }

  /** 切换日常程序开启/关闭 */
  function toggleRoutine(routineId) {
    const r = routines.value.find((item) => item.id === routineId)
    if (r) {
      r.enabled = !r.enabled
      saveRoutines()
      logEvent(`日常程序“${r.name}”已${r.enabled ? '启用' : '暂停'}`)
    }
  }

  /** 添加日常程序（从发现模板保存或自建） */
  function addRoutine(routineData) {
    const newRoutine = {
      id: routineData.id || `routine_${Date.now()}`,
      name: routineData.name || '新建日常程序',
      iconKey: routineData.iconKey || 'sparkles',
      color: routineData.color || '#4F46E5',
      enabled: routineData.enabled !== false,
      description: routineData.description || '自定义自动化日常程序。',
      conditions: routineData.conditions ? JSON.parse(JSON.stringify(routineData.conditions)) : [],
      actions: routineData.actions ? JSON.parse(JSON.stringify(routineData.actions)) : [],
      whenEnded: routineData.whenEnded ? JSON.parse(JSON.stringify(routineData.whenEnded)) : [
        { id: `e_${Date.now()}`, type: 'restore', title: '恢复设置', desc: '日常程序结束时恢复先前状态' }
      ]
    }

    // 检查是否已有同名程序，有则覆盖更新，无则首部插入
    const existingIdx = routines.value.findIndex((r) => r.id === newRoutine.id || r.name === newRoutine.name)
    if (existingIdx !== -1) {
      routines.value[existingIdx] = newRoutine
    } else {
      routines.value.unshift(newRoutine)
    }
    saveRoutines()
    logEvent(`保存了日常程序“${newRoutine.name}”`)
    return newRoutine
  }

  /** 更新日常程序 */
  function updateRoutine(routineId, patch) {
    const idx = routines.value.findIndex((r) => r.id === routineId)
    if (idx !== -1) {
      routines.value[idx] = { ...routines.value[idx], ...patch }
      saveRoutines()
      logEvent(`更新了日常程序“${routines.value[idx].name}”`)
      return true
    }
    return false
  }

  /** 删除日常程序 */
  function deleteRoutine(routineId) {
    const idx = routines.value.findIndex((r) => r.id === routineId)
    if (idx !== -1) {
      const name = routines.value[idx].name
      routines.value.splice(idx, 1)
      saveRoutines()
      logEvent(`删除了日常程序“${name}”`)
      return true
    }
    return false
  }

  /** 记录操作历史 */
  function logEvent(text) {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const mins = String(now.getMinutes()).padStart(2, '0')
    historyLogs.value.unshift({
      id: Date.now(),
      time: `${hours}:${mins}`,
      text
    })
    if (historyLogs.value.length > 50) {
      historyLogs.value.pop()
    }
  }

  function clearHistory() {
    historyLogs.value = []
  }

  return {
    modes,
    routines,
    activeModeId,
    activeMode,
    activeTab,
    historyLogs,
    discoverCategories: DISCOVER_CATEGORIES,
    toggleMode,
    getMode,
    addCustomMode,
    deleteCustomMode,
    updateMode,
    toggleRoutine,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    logEvent,
    clearHistory
  }
})
