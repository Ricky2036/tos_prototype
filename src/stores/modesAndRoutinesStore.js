import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const K_MODES = 'tos_modes_data_v2'
const K_DELETED_MODES = 'tos_deleted_modes_data_v2'
const K_ROUTINES = 'tos_routines_data_v2'
const K_ACTIVE_MODE = 'tos_active_mode_id_v2'

/**
 * 三星真机实测 8 大预设模式初始真实数据
 * 初始状态均为未配置（未设置），无瞎编的数据
 */
const DEFAULT_MODES = [
  {
    id: 'sleep',
    name: '睡眠',
    iconKey: 'sleep',
    color: '#4F46E5',
    isCustom: false,
    isConfigured: false,
    subtitle: '未设置',
    activeSubtitle: '直到您将其关闭',
    description: '睡个好觉。在您睡觉时让手机保持静音，让双眼更舒适。',
    condition: null,
    dnd: {
      enabled: false,
      allowedContacts: '无人',
      allowedCalls: '拒绝全部'
    },
    settingsChanges: [],
    appearance: {
      lockscreen: '锁定屏幕',
      homescreen: '主屏幕'
    }
  },
  {
    id: 'theater',
    name: '影院',
    iconKey: 'theater',
    color: '#D97706',
    isCustom: false,
    isConfigured: false,
    subtitle: '未设置',
    activeSubtitle: '直到您将其关闭',
    description: '观影时不被打扰。降低屏幕亮度并静音通知。',
    condition: null,
    dnd: {
      enabled: false,
      allowedContacts: '无人',
      allowedCalls: '拒绝全部'
    },
    settingsChanges: [],
    appearance: null
  },
  {
    id: 'driving',
    name: '驾驶',
    iconKey: 'driving',
    color: '#059669',
    isCustom: false,
    isConfigured: false,
    subtitle: '未设置',
    activeSubtitle: '直到您将其关闭',
    description: '专注驾驶，安全出行。连接车载蓝牙时自动开启免打扰。',
    condition: null,
    dnd: {
      enabled: false,
      allowedContacts: '无人',
      allowedCalls: '拒绝全部'
    },
    settingsChanges: [],
    appearance: null
  },
  {
    id: 'exercise',
    name: '运动',
    iconKey: 'exercise',
    color: '#EA580C',
    isCustom: false,
    isConfigured: false,
    subtitle: '未设置',
    activeSubtitle: '直到您将其关闭',
    description: '保持专注，挥洒汗水。自动开启免打扰。',
    condition: null,
    dnd: {
      enabled: false,
      allowedContacts: '无人',
      allowedCalls: '拒绝全部'
    },
    settingsChanges: [],
    appearance: null
  },
  {
    id: 'relax',
    name: '放松',
    iconKey: 'relax',
    color: '#10B981',
    isCustom: false,
    isConfigured: false,
    subtitle: '未设置',
    activeSubtitle: '直到您将其关闭',
    description: '在闲暇时光舒缓身心。屏蔽工作类通知，营造舒适氛围。',
    condition: null,
    dnd: {
      enabled: false,
      allowedContacts: '无人',
      allowedCalls: '拒绝全部'
    },
    settingsChanges: [],
    appearance: null
  },
  {
    id: 'work',
    name: '工作',
    iconKey: 'work',
    color: '#2563EB',
    isCustom: false,
    isConfigured: false,
    subtitle: '未设置',
    activeSubtitle: '直到您将其关闭',
    description: '专注于重要任务。到达工作地点时开启免打扰并保持静音。',
    condition: null,
    dnd: {
      enabled: false,
      allowedContacts: '无人',
      allowedCalls: '拒绝全部'
    },
    settingsChanges: [],
    appearance: null
  },
  {
    id: 'gaming',
    name: '游戏',
    iconKey: 'gaming',
    color: '#7C3AED',
    isCustom: false,
    isConfigured: false,
    subtitle: '未设置',
    activeSubtitle: '直到您将其关闭',
    description: '全身心投入游戏。屏蔽浮动通知、来电弹窗并禁用干扰功能。',
    condition: null,
    dnd: {
      enabled: false,
      allowedContacts: '无人',
      allowedCalls: '拒绝全部'
    },
    settingsChanges: [],
    appearance: null
  },
  {
    id: 'prayer',
    name: '礼拜模式',
    iconKey: 'prayer',
    color: '#047857',
    isCustom: false,
    isConfigured: false,
    subtitle: '未设置',
    activeSubtitle: '直到您将其关闭',
    description: '在神圣时刻保持专注与静肃。按当地时间自动静音与朝向指引。',
    condition: null,
    dnd: {
      enabled: false,
      allowedContacts: '无人',
      allowedCalls: '拒绝全部'
    },
    settingsChanges: [],
    appearance: null
  }
]

/**
 * 真实预设模式初始配置向导选项（与真机 100% 对齐）
 */
export const PRESET_WIZARD_CONFIGS = {
  theater: {
    title: '影院',
    defaultOptionId: 'basic',
    options: [
      {
        id: 'basic',
        title: '基本',
        items: ['2 小时后关闭', '黑暗模式: 开'],
        apply: {
          duration: '2 小时',
          settingsChanges: [{ key: 'darkMode', label: '黑暗模式', enabled: true, value: '开' }],
          dnd: { enabled: false }
        }
      },
      {
        id: 'minimize_distraction',
        title: '尽量减少干扰',
        items: ['免打扰: 开', '3 小时后关闭', '黑暗模式: 开', '息屏提醒: 已关闭'],
        apply: {
          duration: '3 小时',
          settingsChanges: [
            { key: 'darkMode', label: '黑暗模式', enabled: true, value: '开' },
            { key: 'aod', label: '息屏提醒', enabled: true, value: '已关闭' }
          ],
          dnd: { enabled: true, allowedContacts: '无人', allowedCalls: '拒绝全部' }
        }
      },
      {
        id: 'custom',
        title: '自定义',
        items: [],
        apply: {}
      }
    ]
  },
  driving: {
    title: '驾驶',
    defaultOptionId: 'minimize_distraction',
    options: [
      {
        id: 'minimize_distraction',
        title: '尽量减少干扰',
        items: ['免打扰: 开'],
        apply: {
          dnd: { enabled: true, allowedContacts: '所有联系人', allowedCalls: '允许' }
        }
      },
      {
        id: 'custom',
        title: '自定义',
        items: [],
        apply: {}
      }
    ]
  },
  exercise: {
    title: '运动',
    defaultOptionId: 'minimize_distraction',
    options: [
      {
        id: 'minimize_distraction',
        title: '尽量减少干扰',
        items: ['免打扰: 开'],
        apply: {
          dnd: { enabled: true, allowedContacts: '无人', allowedCalls: '仅限紧急来电' }
        }
      },
      {
        id: 'custom',
        title: '自定义',
        items: [],
        apply: {}
      }
    ]
  },
  relax: {
    title: '放松',
    defaultOptionId: 'basic',
    options: [
      {
        id: 'basic',
        title: '基本',
        items: ['护眼模式: 自适应'],
        apply: {
          settingsChanges: [{ key: 'eyeCare', label: '护眼模式', enabled: true, value: '自适应' }]
        }
      },
      {
        id: 'custom',
        title: '自定义',
        items: [],
        apply: {}
      }
    ]
  },
  work: {
    title: '工作',
    defaultOptionId: 'basic',
    options: [
      {
        id: 'basic',
        title: '基本',
        items: ['声音模式和音量: 振动', '省电模式: 开,最大'],
        apply: {
          settingsChanges: [
            { key: 'soundMode', label: '声音模式和音量', enabled: true, value: '振动' },
            { key: 'powerSaving', label: '省电模式', enabled: true, value: '开,最大' }
          ]
        }
      },
      {
        id: 'custom',
        title: '自定义',
        items: [],
        apply: {}
      }
    ]
  },
  gaming: {
    title: '游戏',
    defaultOptionId: 'basic',
    options: [
      {
        id: 'basic',
        title: '基本',
        items: [
          '游戏期间禁用自动调节亮度: 开',
          '游戏期间禁用侧屏幕面板: 开',
          '游戏期间禁用 Bixby: 开'
        ],
        apply: {
          settingsChanges: [
            { key: 'disableAutoBrightness', label: '游戏期间禁用自动调节亮度', enabled: true, value: '开' },
            { key: 'disableEdgePanel', label: '游戏期间禁用侧屏幕面板', enabled: true, value: '开' },
            { key: 'disableBixby', label: '游戏期间禁用 Bixby', enabled: true, value: '开' }
          ]
        }
      },
      {
        id: 'minimize_distraction',
        title: '尽量减少干扰',
        items: [
          '免打扰: 开',
          '自动开启: 正在玩游戏',
          '游戏期间禁用自动调节亮度: 开',
          '游戏期间禁用侧屏幕面板: 开',
          '游戏期间禁用 Bixby: 开'
        ],
        apply: {
          condition: { type: 'app', title: '自动开启', value: '正在玩游戏', enabled: true },
          dnd: { enabled: true, allowedContacts: '无人', allowedCalls: '拒绝全部' },
          settingsChanges: [
            { key: 'disableAutoBrightness', label: '游戏期间禁用自动调节亮度', enabled: true, value: '开' },
            { key: 'disableEdgePanel', label: '游戏期间禁用侧屏幕面板', enabled: true, value: '开' },
            { key: 'disableBixby', label: '游戏期间禁用 Bixby', enabled: true, value: '开' }
          ]
        }
      },
      {
        id: 'custom',
        title: '自定义',
        items: [],
        apply: {}
      }
    ]
  },
  prayer: {
    title: '礼拜模式',
    defaultOptionId: 'minimize_distraction',
    options: [
      {
        id: 'minimize_distraction',
        title: '尽量减少干扰',
        items: ['免打扰: 开', '声音模式和音量: 静音'],
        apply: {
          dnd: { enabled: true, allowedContacts: '无人', allowedCalls: '拒绝全部' },
          settingsChanges: [{ key: 'soundMode', label: '声音模式和音量', enabled: true, value: '静音' }]
        }
      },
      {
        id: 'custom',
        title: '自定义',
        items: [],
        apply: {}
      }
    ]
  }
}

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
          { type: 'ai', title: '语音简报', value: '语音播报天气与日程' },
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
        name: '跨屏协同',
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
        description: '好友到访时一键在桌面展示无线局域网分享码。',
        conditions: [{ type: 'manual', title: '手动启动', value: '快捷指令' }],
        actions: [
          { type: 'connect', title: '生成分享卡', value: '当前连接的无线网络' }
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
        description: '离开家庭网络时自动将媒体静音。',
        conditions: [{ type: 'wifi', title: '断开家庭网络', value: '离开家里' }],
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
  const savedModes = (() => {
    try {
      const raw = safeGetItem(K_MODES)
      return raw ? JSON.parse(raw) : DEFAULT_MODES
    } catch {
      return DEFAULT_MODES
    }
  })()

  const savedDeletedModes = (() => {
    try {
      const raw = safeGetItem(K_DELETED_MODES)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
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
  const deletedPresetModes = ref(savedDeletedModes)
  const routines = ref(savedRoutines)
  const activeModeId = ref(savedActiveMode)
  const activeTab = ref('modes')

  const historyLogs = ref([
    { id: 1, time: '22:30', text: '已根据作息时间表自动开启“睡眠”模式' },
    { id: 2, time: '07:00', text: '早晨闹钟关闭，“睡眠”模式已停止' },
    { id: 3, time: '09:05', text: '到达公司，已开启“工作”模式' },
    { id: 4, time: '18:15', text: '离开公司，已关闭“工作”模式' }
  ])

  function saveModes() {
    safeSetItem(K_MODES, JSON.stringify(modes.value))
    safeSetItem(K_DELETED_MODES, JSON.stringify(deletedPresetModes.value))
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

  /** 配置预设模式并进入详情 */
  function configureModeWithPreset(modeId, optionId) {
    const target = modes.value.find((m) => m.id === modeId)
    if (!target) return null

    target.isConfigured = true
    target.subtitle = ''

    const wizardCfg = PRESET_WIZARD_CONFIGS[modeId]
    if (wizardCfg) {
      const opt = wizardCfg.options.find((o) => o.id === optionId) || wizardCfg.options[0]
      if (opt && opt.apply) {
        if (opt.apply.condition) target.condition = opt.apply.condition
        if (opt.apply.dnd) target.dnd = Object.assign(target.dnd || {}, opt.apply.dnd)
        if (opt.apply.settingsChanges) target.settingsChanges = opt.apply.settingsChanges
        if (opt.apply.duration) target.duration = opt.apply.duration
      }
    }

    saveModes()
    logEvent(`配置了“${target.name}”模式`)
    return target
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
      isConfigured: true,
      subtitle: '',
      activeSubtitle: '直到您将其关闭',
      description: description || '满足您特定生活习惯的自定义模式。',
      condition: null,
      dnd: {
        enabled: false,
        allowedContacts: '所有收藏联系人',
        allowedCalls: '允许'
      },
      settingsChanges: [],
      appearance: null
    }

    modes.value.push(newMode)
    saveModes()
    logEvent(`创建了自定义模式“${newMode.name}”`)
    return newMode
  }

  /** 删除模式（支持自定义模式与预设模式） */
  function deleteMode(modeId) {
    const idx = modes.value.findIndex((m) => m.id === modeId)
    if (idx !== -1) {
      const target = modes.value[idx]
      if (activeModeId.value === modeId) {
        activeModeId.value = null
        saveActiveMode()
      }
      modes.value.splice(idx, 1)

      // 若为预设模式，存入已删除预设模式列表，以便添加模式中重新恢复
      if (!target.isCustom) {
        target.isConfigured = false
        target.subtitle = '未设置'
        target.condition = null
        target.settingsChanges = []
        if (target.dnd) target.dnd.enabled = false
        if (!deletedPresetModes.value.some((d) => d.id === target.id)) {
          deletedPresetModes.value.push(target)
        }
      }

      saveModes()
      logEvent(`删除了“${target.name}”模式`)
      return true
    }
    return false
  }

  /** 兼容原接口 deleteCustomMode */
  function deleteCustomMode(modeId) {
    return deleteMode(modeId)
  }

  /** 从已删除预设模式中恢复模式 */
  function restorePresetMode(modeId) {
    const idx = deletedPresetModes.value.findIndex((m) => m.id === modeId)
    if (idx !== -1) {
      const restored = deletedPresetModes.value.splice(idx, 1)[0]
      modes.value.push(restored)
      saveModes()
      logEvent(`恢复了“${restored.name}”模式`)
      return restored
    }
    return null
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

  /** 添加日常程序 */
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
    deletedPresetModes,
    routines,
    activeModeId,
    activeMode,
    activeTab,
    historyLogs,
    discoverCategories: DISCOVER_CATEGORIES,
    toggleMode,
    getMode,
    configureModeWithPreset,
    addCustomMode,
    deleteMode,
    deleteCustomMode,
    restorePresetMode,
    updateMode,
    toggleRoutine,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    logEvent,
    clearHistory
  }
})
