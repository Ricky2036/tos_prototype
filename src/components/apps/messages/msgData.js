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
    simSmsSub: '中国电信',
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
    simSmsSub: 'China Telecom',
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

/** 列表页会话（顺序、摘要、时间戳与真机一致；snippet 按两行截断原样保存） */
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
    id: 'laiguangzheng',
    name: '赖光政~借款人',
    number: '15309272296',
    time: '11/13',
    unread: 1,
    snippet: '你好，我是周老四的姐夫赖光政，你姐陈静丽昨天把你的农行卡发给我了，请你再发一次给我...'
  },
  {
    id: 'chenhongyang',
    name: '陈弘洋',
    number: '18138849076',
    time: '7/28',
    snippet: '【小天才】你的孩子正尝试110报警，请及时确认孩子当前状况。为了方便警方及时联系孩子，…'
  },
  {
    id: 'n17896447783',
    name: '17896447783',
    number: '17896447783',
    time: '7/6',
    snippet: '最下面这层',
    avatarIcon: 'person'
  },
  {
    id: 'n13076902075',
    name: '13076902075',
    number: '13076902075',
    time: '5/18',
    snippet: 'SF1575186809671',
    avatarIcon: 'person'
  },
  {
    id: 'walter',
    name: 'Walter',
    number: '13751160830',
    time: '4/26',
    snippet: '现在不方便接听，有什么事吗？'
  },
  {
    id: 'n17386937368',
    name: '17386937368',
    number: '17386937368',
    time: '3/22',
    snippet: '马上到！',
    avatarIcon: 'person'
  },
  {
    id: 'fuka',
    name: '副卡',
    number: '18138843409',
    time: '3/17',
    snippet: '欢迎使用 Gboard 剪贴板，您复制的所有文本都会保存到这里。'
  }
]

/** 会话消息。from: 'them' | 'me'；status 仅己方消息有 */
export const THREADS = {
  laiguangzheng: [
    {
      from: 'them',
      text: '你好，我是周老四的姐夫赖光政，你姐陈静丽昨天把你的农行卡发给我了，请你再发一次给我确认一下，我二点后到柜台办理，给我们帮了大忙，谢谢你了噢',
      time: '11/13 13:15'
    }
  ],
  chenhongyang: [
    { from: 'them', text: '❤️', time: '2025/9/5 19:08', emoji: true },
    { from: 'them', text: '❤️', time: '2025/9/5 19:08', emoji: true },
    {
      from: 'them',
      text: '【小天才】你的孩子正尝试110报警，请及时确认孩子当前状况。为了方便警方及时联系孩子，已将拒接陌生人来电功能关闭，如需继续使用请手动开启。',
      time: '2025/9/5 19:08'
    },
    {
      from: 'them',
      text: '【小天才】你的孩子正尝试120呼救，请及时确认孩子当前状况。为了方便医护人员及时联系孩子，已将拒接陌生人来电功能关闭，如需继续使用请手动开启。',
      time: '2025/9/5 19:12'
    },
    {
      from: 'them',
      text: '【小天才】你的孩子正尝试119呼救，请及时确认孩子当前状况。为了方便警方及时联系孩子，已将拒接陌生人来电功能关闭，如需继续使用请手动开启。',
      time: '1/19 18:02'
    },
    {
      from: 'them',
      text: '【小天才】你的孩子正尝试110报警，请及时确认孩子当前状况。为了方便警方及时联系孩子，已将拒接陌生人来电功能关闭，如需继续使用请手动开启。',
      time: '7/28 13:22'
    }
  ],
  n17896447783: [{ from: 'them', text: '最下面这层', time: '7/6 17:59' }],
  n13076902075: [{ from: 'them', text: 'SF1575186809671', time: '5/18 10:01' }],
  walter: [
    { from: 'me', text: '会议中，晚点给您回电话', time: '2024/4/20 19:05', status: 'sent' },
    { from: 'me', text: '现在不方便接听，有什么事吗？', time: '4/26 15:04', status: 'sent' }
  ],
  n17386937368: [{ from: 'them', text: '马上到！', time: '3/22 12:58' }],
  fuka: [
    { from: 'me', text: 'Good afternoon!', time: '2024/6/25 15:03', status: 'sent' },
    { from: 'me', text: '1', time: '2024/6/25 15:05', status: 'sent' },
    {
      from: 'them',
      text: '欢迎使用 Gboard 剪贴板，您复制的所有文本都会保存到这里。',
      time: '3/17 14:14'
    }
  ]
}

/**
 * 「通知信息」企业聚合列表（服务号 / 通知类短信）。
 * verified=true 表示号码右侧带绿色认证盾牌。
 */
export const ENTERPRISE_THREADS = [
  {
    id: 'e-abchina',
    number: '10690955998',
    verified: true,
    time: '10:08',
    unread: 2,
    snippet: '【中国农业银行】您的风险评估已过期！点（go.abchina.com/k/rPA）完成风险评估，可…',
    messages: [
      {
        text: '【中国农业银行】出境就用农行信用卡！12月底前登录农行掌银APP( go.abchina.com/k/Adh )报名后，持农行Visa/万事达/银联信用卡境外消费享线下笔笔返3%、商户返10%，还享首笔返！奖池有限，如有疑问详询4006695599。拒收请回复R',
        time: '11/5 13:45',
        links: ['go.abchina.com/k/Adh', '4006695599']
      },
      {
        text: '【中国农业银行】首绑微信、支付宝各享16元优惠。戳(go.abchina.com/k/KwQ)参与。详询4006695599。拒收请回复R',
        time: '11/5 18:27',
        links: ['go.abchina.com/k/KwQ', '4006695599']
      },
      {
        text: '【中国农业银行】邀您办理我行万事达全球支付卡(境内外一卡通行、年底前境外消费享1%无上限返现)或Visa全球支付卡(有效期内免年费)，点击 go.abchina.com/k/PNX 申请。申请结果以审批为准，详见官网或询4006695599。拒收请回复R',
        time: '11/12 14:37',
        links: ['go.abchina.com/k/PNX', '4006695599']
      },
      {
        text: '【中国农业银行】您的风险评估已过期！点（go.abchina.com/k/rPA）完成风险评估，可参与抽奖！详询95599。拒收请回复R',
        time: '今天 10:08',
        links: ['go.abchina.com/k/rPA', '95599']
      }
    ]
  },
  {
    id: 'e-oppo',
    number: '1068093290020',
    verified: true,
    time: '昨天',
    unread: 1,
    snippet: '【OPPO】您于2026-11-25 21:01:50在OPPO官方授权寄修中心（深圳）的服务受理单CNSR…',
    messages: [
      {
        text: '【OPPO】您于2026-11-25 21:01:50在OPPO官方授权寄修中心（深圳）的服务受理单CNSR202611250001已受理，可在OPPO官网或服务APP查询进度。',
        time: '昨天 21:03'
      }
    ]
  },
  {
    id: 'e-ct',
    number: '中国电信',
    verified: false,
    time: '昨天',
    unread: 2,
    snippet: '【中国电信】#积分兑换温馨提醒# 尊敬的电信用户，您名下的电信积分已达5000多分，现在可…',
    messages: [
      {
        text: '【中国电信】#积分兑换温馨提醒# 尊敬的电信用户，您名下的电信积分已达5000多分，现在可登录中国电信APP兑换话费、流量或实物礼品，积分将于年底清零，请及时兑换。',
        time: '昨天 18:40'
      }
    ]
  },
  {
    id: 'e-10000',
    number: '10000',
    verified: true,
    time: '昨天',
    unread: 4,
    snippet: '【深圳市应急管理局、市消防救援局、市气象局】提醒您：近期冷空气活跃，气温起伏大，…',
    messages: [
      {
        text: '【深圳市应急管理局、市消防救援局、市气象局】提醒您：近期冷空气活跃，气温起伏大，请注意防寒保暖，规范使用取暖设备，谨防一氧化碳中毒。',
        time: '昨天 16:20'
      }
    ]
  },
  {
    id: 'e-cmb',
    number: '1068039095555',
    verified: false,
    time: '昨天',
    unread: 22,
    snippet: '【招商银行】诚邀您体验e招贷业务，您的e招贷额度已更新，点击 cmbt.cn/a/hpt?a=1 立即测…',
    messages: [
      {
        text: '【招商银行】诚邀您体验e招贷业务，您的e招贷额度已更新，点击 cmbt.cn/a/hpt?a=1 立即测额。拒收请回复R',
        time: '昨天 15:02',
        links: ['cmbt.cn/a/hpt?a=1']
      }
    ]
  },
  {
    id: 'e-douyin',
    number: '10683146465582',
    verified: false,
    time: '昨天',
    unread: 1,
    snippet: '【抖音钱包放心借】已为您降低借款年利率至9.00%，有效期至12月03日，快来「抖音-我-钱…',
    messages: [
      {
        text: '【抖音钱包放心借】已为您降低借款年利率至9.00%，有效期至12月03日，快来「抖音-我-钱包」查看。',
        time: '昨天 12:31'
      }
    ]
  },
  {
    id: 'e-citic',
    number: '10691386695558',
    verified: false,
    time: '昨天',
    unread: 16,
    snippet: '【中信银行信用卡】尊敬的陈敬展，您有卡片可升级为白金卡！畅享高端权益。戳 zxcard.cn/...',
    messages: [
      {
        text: '【中信银行信用卡】尊敬的陈敬展，您有卡片可升级为白金卡！畅享高端权益。戳 zxcard.cn/p 了解详情。拒收请回复R',
        time: '昨天 10:15',
        links: ['zxcard.cn/p']
      }
    ]
  },
  {
    id: 'e-google',
    number: '106936541879039',
    verified: false,
    time: '11/24',
    unread: 1,
    snippet: '【谷歌信息技术】G-745906 是您的 Google 验证码。请勿与任何人分享此码。',
    messages: [
      {
        text: '【谷歌信息技术】G-745906 是您的 Google 验证码。请勿与任何人分享此码。',
        time: '11/24 20:41'
      }
    ]
  },
  {
    id: 'e-taobao',
    number: '106884549999168671',
    verified: false,
    time: '11/24',
    unread: 1,
    snippet: '【淘宝闪购】你在丰顺Thumbnail（光前店）的订单超时权益已赔付2元可叠加红包，请至淘宝app-闪购…',
    messages: [
      {
        text: '【淘宝闪购】你在丰顺Thumbnail（光前店）的订单超时权益已赔付2元可叠加红包，请至淘宝app-闪购-我的-权益中心查看。',
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

/** 联系人选择器演示数据（真机 A 组片段，逐字照抄） */
export const CONTACTS = [
  { id: 'c1', section: 'A', name: '阿里巴巴钉钉客服', line: '手机 057128834033' },
  { id: 'c2', section: 'A', name: '艾尚美窗帘~老板娘', line: '手机 18806644957' },
  { id: 'c3', section: 'A', name: '爱尚美窗帘', line: '手机 13622340045' },
  { id: 'c4', section: 'A', name: '安装垃圾处理器', line: '手机 13502831744' },
  { id: 'c5', section: 'A', name: '敖俊平', line: '手机 13922203849' },
  { id: 'c6', section: 'A', name: 'A姐', line: '手机 13992407316' },
  { id: 'c7', section: 'A', name: 'A老婆', line: '手机 18138840976' },
  { id: 'c8', section: 'A', name: 'Abhishek Nayak', line: '手机 +919987948451' },
  { id: 'c9', section: 'A', name: 'Acropolis', line: '其他 12' },
  { id: 'c10', section: 'A', name: '阿里巴巴集团', line: '手机 95188' }
]

/** 搜索结果里的发件人候选（真机横向列表，号码被 1069 命中时高亮） */
export const SEARCH_SENDERS = [
  '10690955998',
  '1069138669558',
  '106936541879039',
  '106931999221748',
  '1068093290020',
  '10001',
  '10000'
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
