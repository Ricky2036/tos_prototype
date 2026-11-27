/**
 * 「短信」应用的全部演示数据与词条（MSG-01）
 *
 * 数据来源：Infinix X6878 真机逐屏采集（com.transsion.smartmessage 17.0.0.078，
 * 2026-11-26）。会话名、号码、摘要、时间戳、消息正文、设置项文字全部照抄，
 * 未采集到的会话只保留其列表摘要作为唯一一条消息（不虚构内容）。
 *
 * 时间戳刻意保存为固定字符串：真机里这些是历史值，"今天/昨天" 也是采集当天的
 * 相对口径，原型若做动态换算会与截图不一致。
 */

export const MSG_TEXT = {
  zh: {
    appTitle: '短信',
    searchMessages: '搜索信息',
    cloudTip: '开启数据同步，保障数据安全。',
    cloudAction: '去开启',
    newMessage: '新建短信',
    recipientLabel: '收件人：',
    composePlaceholder: '短信',
    notificationInfo: '通知信息',
    pickContact: '未选择',
    pickCount: '已选择 {n} 项',
    tabContacts: '联系人',
    tabGroups: '群组',
    searchContacts: '搜索联系人',
    selected: '已选择 {n} 项',
    delete: '删除',
    selectAll: '全选',
    detail: '信息详情',
    gotIt: '知道了',
    sent: '已发送',
    sending: '发送中',
    copyText: '复制文字',
    translate: '翻译',
    share: '分享',
    forward: '转发',
    multiSelect: '多选',
    pin: '置顶',
    unpin: '取消置顶',
    block: '加入黑名单',
    moveToNotification: '移入通知信息',
    viewContact: '查看联系人',
    clearUnread: '清除未读',
    spamBlock: '骚扰拦截',
    settings: '设置',
    privacyPolicy: '隐私政策',
    userAgreement: '用户协议',
    emptySearch: '未找到相关信息',
    searchSender: '发件人',
    searchCategory: '类别',
    categoryImage: '图片',
    categoryVideo: '视频',
    settingsTitle: '设置',
    about: '关于',
    version: '版本号',
    moreSettings: '更多设置',
    syncCloud: '同步到 Infinix Cloud',
    smartDbUpdate: '智能识别数据更新',
    smartDbSub: '完善信息内容的识别，提供更精准的服务。',
    moreSmsc: '短信中心号码',
    moreSimSms: 'SIM卡短信',
    moreCellBroadcast: '无线警报',
    simSmsSub: '云海通信',
    cloudSync: '同步到 Infinix Cloud',
    xmessage: 'XMessage 服务',
    xmessageOn: '已开启',
    xmessageDesc: '号码验证成功后，XMessage联系人之间支持使用WLAN或移动网络，免费收发消息。',
    simCardSettings: 'SIM卡设置',
    verified: '已验证',
    onlyWlan: '仅 WLAN',
    onlyWlanShort: '仅WLAN',
    dbUpdateTitle: '数据库自动更新偏好',
    dbWlan: '仅 WLAN',
    dbWlanMobile: 'WLAN 与移动数据',
    dbOff: '关闭',
    cancel: '取消',
    disclaimer: '该功能由系统提供，原型内仅示意入口',
    fieldType: '类型',
    fieldSender: '发件人',
    fieldSentTime: '发送时间',
    fieldRecipient: '收件人',
    fieldSim: 'SIM 卡',
    typeSms: '短信',
    blockedEmpty: '暂无已拦截短信',
    callTab: '通话',
    smsTab: '短信'
  },
  en: {
    appTitle: 'Messages',
    searchMessages: 'Search messages',
    cloudTip: 'Turn on data sync to keep your data safe.',
    cloudAction: 'Turn on',
    newMessage: 'New message',
    recipientLabel: 'To:',
    composePlaceholder: 'Text message',
    notificationInfo: 'Notifications',
    pickContact: 'None selected',
    pickCount: '{n} selected',
    tabContacts: 'Contacts',
    tabGroups: 'Groups',
    searchContacts: 'Search contacts',
    selected: '{n} selected',
    delete: 'Delete',
    selectAll: 'Select all',
    detail: 'Message details',
    gotIt: 'OK',
    sent: 'Sent',
    sending: 'Sending',
    copyText: 'Copy text',
    translate: 'Translate',
    share: 'Share',
    forward: 'Forward',
    multiSelect: 'Select',
    pin: 'Pin to top',
    unpin: 'Unpin',
    block: 'Block number',
    moveToNotification: 'Move to notifications',
    viewContact: 'View contact',
    clearUnread: 'Mark all read',
    spamBlock: 'Spam blocking',
    settings: 'Settings',
    privacyPolicy: 'Privacy policy',
    userAgreement: 'User agreement',
    emptySearch: 'No results',
    searchSender: 'Senders',
    searchCategory: 'Categories',
    categoryImage: 'Images',
    categoryVideo: 'Videos',
    settingsTitle: 'Settings',
    about: 'About',
    version: 'Version',
    moreSettings: 'More settings',
    syncCloud: 'Sync to Infinix Cloud',
    smartDbUpdate: 'Smart recognition updates',
    smartDbSub: 'Improve message recognition for more accurate results.',
    moreSmsc: 'Message centre number',
    moreSimSms: 'Messages on SIM',
    moreCellBroadcast: 'Wireless alerts',
    simSmsSub: 'Yunhai Telecom',
    cloudSync: 'Sync to Infinix Cloud',
    xmessage: 'XMessage service',
    xmessageOn: 'On',
    xmessageDesc: 'After number verification, XMessage contacts can send free messages over Wi-Fi or mobile data.',
    simCardSettings: 'SIM settings',
    verified: 'Verified',
    onlyWlan: 'Wi-Fi only',
    onlyWlanShort: 'Wi-Fi only',
    dbUpdateTitle: 'Automatic database updates',
    dbWlan: 'Wi-Fi only',
    dbWlanMobile: 'Wi-Fi & mobile data',
    dbOff: 'Off',
    cancel: 'Cancel',
    disclaimer: 'Provided by the system; this prototype only links to the entry',
    fieldType: 'Type',
    fieldSender: 'From',
    fieldSentTime: 'Sent',
    fieldRecipient: 'To',
    fieldSim: 'SIM',
    typeSms: 'SMS',
    blockedEmpty: 'No blocked messages',
    callTab: 'Calls',
    smsTab: 'Messages'
  }
}

/** 列表页会话（结构与真机一致；姓名、号码、摘要全部虚构，不含任何真实往来内容） */
export const CONVERSATIONS = [
  {
    id: 'notice',
    kind: 'enterprise',
    name: '通知信息',
    titleKey: 'notificationInfo',
    unread: 99,
    time: '',
    avatarIcon: 'bell'
  },
  {
    id: 'conv-su',
    name: '苏明远',
    number: '13800001234',
    time: '11/13',
    unread: 1,
    snippet: '合同附件我已经发到邮箱了，你帮我看下第 3 条的付款节点写得对不对，明天上午要用...'
  },
  {
    id: 'conv-chen',
    name: '陈曦',
    number: '13900002345',
    time: '7/28',
    snippet: '【青禾守护】孩子的手表尝试拨打紧急号码，请及时确认孩子当前状况。为方便联系孩子…'
  },
  {
    id: 'n13700003456',
    name: '13700003456',
    number: '13700003456',
    time: '7/6',
    snippet: 'B2 东侧门禁已恢复，刷卡正常。',
    avatarIcon: 'person'
  },
  {
    id: 'n13600004567',
    name: '13600004567',
    number: '13600004567',
    time: '5/18',
    snippet: 'YT0000000000001',
    avatarIcon: 'person'
  },
  {
    id: 'conv-zhou',
    name: '周珩',
    number: '13500005678',
    time: '4/26',
    snippet: '会议改到三点，会议室换到 12 楼 A 厅。'
  },
  {
    id: 'n13300006789',
    name: '13300006789',
    number: '13300006789',
    time: '3/22',
    snippet: '马上到！',
    avatarIcon: 'person'
  },
  {
    id: 'conv-sub',
    name: '副卡',
    number: '13200007890',
    time: '3/17',
    snippet: '您有一件快递已放至一楼前台，取件码 6688。'
  }
]

/** 会话消息。from: 'them' | 'me'；status 仅己方消息有。正文全部虚构。 */
export const THREADS = {
  'conv-su': [
    {
      from: 'them',
      text: '合同附件我已经发到邮箱了，你帮我看下第 3 条的付款节点写得对不对。如果按季度付，首款要到下个月中才能走流程，我这边财务要提前报备。确认没问题我明天上午就盖章寄出去，麻烦今天给我个回话。',
      time: '11/13 13:15'
    }
  ],
  'conv-chen': [
    { from: 'them', text: '❤️', time: '2025/9/5 19:08', emoji: true },
    { from: 'them', text: '❤️', time: '2025/9/5 19:08', emoji: true },
    {
      from: 'them',
      text: '【青禾守护】孩子的手表尝试拨打紧急号码，请及时确认孩子当前状况。为方便联系孩子，已将拒接陌生人来电功能关闭，如需继续使用请手动开启。',
      time: '2025/9/5 19:08'
    },
    {
      from: 'them',
      text: '【青禾守护】孩子的手表尝试拨打急救号码，请及时确认孩子当前状况。为方便医护人员联系孩子，已将拒接陌生人来电功能关闭，如需继续使用请手动开启。',
      time: '2025/9/5 19:12'
    },
    {
      from: 'them',
      text: '【青禾守护】孩子的手表尝试拨打火警号码，请及时确认孩子当前状况。为方便救援人员联系孩子，已将拒接陌生人来电功能关闭，如需继续使用请手动开启。',
      time: '1/19 18:02'
    },
    {
      from: 'them',
      text: '【青禾守护】孩子的手表已进入学校安全区域，本次提醒不需要回复。',
      time: '7/28 13:22'
    }
  ],
  n13700003456: [{ from: 'them', text: 'B2 东侧门禁已恢复，刷卡正常。', time: '7/6 17:59' }],
  n13600004567: [{ from: 'them', text: 'YT0000000000001', time: '5/18 10:01' }],
  'conv-zhou': [
    { from: 'me', text: '评审材料我下午发你，先按这版走', time: '2024/4/20 19:05', status: 'sent' },
    { from: 'me', text: '会议改到三点，会议室换到 12 楼 A 厅。', time: '4/26 15:04', status: 'sent' }
  ],
  n13300006789: [{ from: 'them', text: '马上到！', time: '3/22 12:58' }],
  'conv-sub': [
    { from: 'me', text: '好的，我十分钟后到。', time: '2024/6/25 15:03', status: 'sent' },
    { from: 'me', text: '1', time: '2024/6/25 15:05', status: 'sent' },
    {
      from: 'them',
      text: '您有一件快递已放至一楼前台，取件码 6688，请当日领取。',
      time: '3/17 14:14'
    }
  ]
}

/**
 * 「通知信息」企业聚合列表（服务号 / 通知类短信）。
 * 机构名、文案、域名全部虚构（example.com 占位），只保留真机的信息结构与视觉密度。
 * verified=true 表示号码右侧带绿色认证盾牌。
 */
export const ENTERPRISE_THREADS = [
  {
    id: 'e-1',
    number: '10690000001',
    verified: true,
    time: '10:08',
    unread: 2,
    snippet: '【云川银行】您的积分将于本月底清零！点（go.example.com/k/rPA）兑换立减金，可…',
    messages: [
      {
        text: '【云川银行】积分换好礼！12 月底前登录云川生活 App（ go.example.com/k/Adh ）报名，信用卡消费满 300 元可兑换 30 元立减金，活动名额有限，如有疑问详询 4006660000。拒收请回复R',
        time: '11/5 13:45',
        links: ['go.example.com/k/Adh', '4006660000']
      },
      {
        text: '【云川银行】首绑支付立减 16 元，戳(go.example.com/k/KwQ)参与。详询4006660000。拒收请回复R',
        time: '11/5 18:27',
        links: ['go.example.com/k/KwQ', '4006660000']
      },
      {
        text: '【云川银行】邀您办理云川全球支付卡（境外消费 1% 返现、有效期内免年费），点击 go.example.com/k/PNX 申请。申请结果以审批为准，详见官网或询4006660000。拒收请回复R',
        time: '11/12 14:37',
        links: ['go.example.com/k/PNX', '4006660000']
      },
      {
        text: '【云川银行】您的积分将于本月底清零！点（go.example.com/k/rPA）兑换立减金，可参与抽奖！详询95000000。拒收请回复R',
        time: '今天 10:08',
        links: ['go.example.com/k/rPA', '95000000']
      }
    ]
  },
  {
    id: 'e-2',
    number: '10690000002',
    verified: true,
    time: '昨天',
    unread: 1,
    snippet: '【北辰电子】您于 2026-11-25 21:01:50 在北辰授权维修中心（深圳）的工单 WX202…',
    messages: [
      {
        text: '【北辰电子】您于 2026-11-25 21:01:50 在北辰授权维修中心（深圳）的工单 WX202611250001 已受理，可在北辰服务 App 查询进度。',
        time: '昨天 21:03'
      }
    ]
  },
  {
    id: 'e-3',
    number: '10690000003',
    verified: false,
    time: '昨天',
    unread: 2,
    snippet: '【云海通信】#积分兑换提醒# 尊敬的云海用户，您名下的积分已达 5000 多分，现在可…',
    messages: [
      {
        text: '【云海通信】#积分兑换提醒# 尊敬的云海用户，您名下的积分已达 5000 多分，现在可登录云海通信 App 兑换话费、流量或实物礼品，积分将于年底清零，请及时兑换。',
        time: '昨天 18:40'
      }
    ]
  },
  {
    id: 'e-4',
    number: '10690000004',
    verified: true,
    time: '昨天',
    unread: 4,
    snippet: '【市政应急提醒】提醒您：近期冷空气活跃，气温起伏大，请注意防寒保暖，规范使用…',
    messages: [
      {
        text: '【市政应急提醒】提醒您：近期冷空气活跃，气温起伏大，请注意防寒保暖，规范使用取暖设备，谨防一氧化碳中毒。',
        time: '昨天 16:20'
      }
    ]
  },
  {
    id: 'e-5',
    number: '10690000005',
    verified: false,
    time: '昨天',
    unread: 22,
    snippet: '【远山银行】诚邀您体验"随心贷"业务，您的额度已更新，点击 example.com/a/1 立即测额…',
    messages: [
      {
        text: '【远山银行】诚邀您体验"随心贷"业务，您的额度已更新，点击 example.com/a/1 立即测额。拒收请回复R',
        time: '昨天 15:02',
        links: ['example.com/a/1']
      }
    ]
  },
  {
    id: 'e-6',
    number: '10690000006',
    verified: false,
    time: '昨天',
    unread: 1,
    snippet: '【星野钱包】已为您调整借款年化利率至 9.00%，有效期至 12 月 03 日，快来「星野-我-钱…',
    messages: [
      {
        text: '【星野钱包】已为您调整借款年化利率至 9.00%，有效期至 12 月 03 日，快来「星野-我-钱包」查看。',
        time: '昨天 12:31'
      }
    ]
  },
  {
    id: 'e-7',
    number: '10690000007',
    verified: false,
    time: '昨天',
    unread: 16,
    snippet: '【澄海银行信用卡】尊敬的林先生，您有卡片可升级为白金卡！畅享高端权益。戳 example…',
    messages: [
      {
        text: '【澄海银行信用卡】尊敬的林先生，您有卡片可升级为白金卡！畅享高端权益。戳 example.com/p 了解详情。拒收请回复R',
        time: '昨天 10:15',
        links: ['example.com/p']
      }
    ]
  },
  {
    id: 'e-8',
    number: '10690000008',
    verified: false,
    time: '11/24',
    unread: 1,
    snippet: '【青柠科技】G-745906 是您的登录验证码。请勿与任何人分享此码。',
    messages: [
      {
        text: '【青柠科技】G-745906 是您的登录验证码。请勿与任何人分享此码。',
        time: '11/24 20:41'
      }
    ]
  },
  {
    id: 'e-9',
    number: '10690000009',
    verified: false,
    time: '11/24',
    unread: 1,
    snippet: '【闪电优选】您在城南工坊（科技园店）的订单超时赔付已到账，可叠加红包使用，请至…',
    messages: [
      {
        text: '【闪电优选】您在城南工坊（科技园店）的订单超时赔付已到账，可叠加红包使用，请至闪电优选 App-我的-权益中心查看。',
        time: '11/24 11:07'
      }
    ]
  }
]

/** 设置页结构（顺序、文案、右侧控件类型与真机一致） */
export const SETTINGS_GROUPS = [
  {
    id: 'xmessage',
    title: 'XMessage',
    rows: [
      { id: 'xmessageService', type: 'link', title: 'XMessage 服务', valueKey: 'xmessageOn' },
      { id: 'smsWhenFail', type: 'switch', title: '发送失败时转为短信发送', def: false }
    ]
  },
  {
    id: 'security',
    title: '安全',
    rows: [
      {
        id: 'urlCheck',
        type: 'switch',
        title: 'URL 安全检测',
        def: true,
        subtitle: '核验短信内的 URL 链接，提醒诈骗风险。查阅',
        subtitleLink: '隐私政策。'
      },
      { id: 'dbUpdate', type: 'link', title: '数据库自动更新偏好', valueKey: 'onlyWlan', subtitle: '自动更新 URL 数据库。' }
    ]
  },
  {
    id: 'other',
    title: '其他',
    rows: [
      { id: 'autoMms', type: 'switch', title: '自动下载彩信', def: true },
      { id: 'sendTone', type: 'switch', title: '信息发送提示音', def: false },
      { id: 'bigText', type: 'switch', title: '放大手势', def: true, subtitle: '双指扩展放大信息内容文字。' },
      { id: 'foldNotif', type: 'switch', title: '折叠通知消息', def: true, subtitle: '开启后将通知类消息折叠为一个会话条目。' },
      { id: 'deliveryReport', type: 'switch', title: '消息发送回执', def: false, subtitle: '显示消息送达状态。' }
    ]
  },
  {
    id: 'cloud',
    title: '',
    rows: [{ id: 'cloudSync', type: 'link', title: '同步到 Infinix Cloud', external: 'cloud' }]
  },
  {
    id: 'misc',
    title: '',
    rows: [
      {
        id: 'smartDb',
        type: 'link',
        title: '智能识别数据更新',
        valueKey: 'onlyWlanShort',
        subtitle: '完善信息内容的识别，提供更精准的服务。',
        external: 'smart'
      },
      { id: 'moreSettings', type: 'link', title: '更多设置', route: 'more' },
      { id: 'about', type: 'link', title: '关于', route: 'about' }
    ]
  }
]

/** 联系人选择器演示数据（A 组 10 行；姓名与号码全部虚构） */
export const CONTACTS = [
  { id: 'c1', section: 'A', name: '安然', line: '手机 13800009001' },
  { id: 'c2', section: 'A', name: '艾米', line: '手机 13800009002' },
  { id: 'c3', section: 'A', name: '敖然', line: '手机 13800009003' },
  { id: 'c4', section: 'A', name: '安欣', line: '手机 13800009004' },
  { id: 'c5', section: 'A', name: '艾青', line: '手机 13800009005' },
  { id: 'c6', section: 'A', name: '阿哲', line: '手机 13800009006' },
  { id: 'c7', section: 'A', name: '敖林', line: '手机 13800009007' },
  { id: 'c8', section: 'A', name: '安琪', line: '手机 13800009008' },
  { id: 'c9', section: 'A', name: '艾文', line: '其他 12' },
  { id: 'c10', section: 'A', name: '安和', line: '手机 13800009009' }
]

/** 搜索结果里的发件人候选（真机横向列表，号码被 1069 命中时高亮） */
export const SEARCH_SENDERS = [
  '10690000001',
  '10690000008',
  '10690000006',
  '10690000009',
  '10690000002',
  '10690000005',
  '10690000007'
]

export const SEARCH_HIGHLIGHT = '1069'

/** 取词条（缺项回落中文） */
export function msgText(locale) {
  const dict = MSG_TEXT[locale] || MSG_TEXT.zh
  return (key, vars) => {
    const raw = dict[key] ?? MSG_TEXT.zh[key] ?? key
    if (!vars) return raw
    return String(raw).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
  }
}
