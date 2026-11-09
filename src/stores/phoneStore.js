import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePhoneStore = defineStore('phone', () => {
  // 底部活动标签：recents (通话记录) | contacts (联系人)
  const currentTab = ref('recents')
  
  // 通话记录类型筛选：all (全部类型) | missed (未接来电)
  const recentsFilter = ref('all')
  
  // 拨号键盘是否展开
  const isKeypadOpen = ref(true)
  
  // 当前输入的拨号串
  const dialedNumber = ref('')
  
  // 搜索视图是否开启及搜索关键词
  const isSearchActive = ref(false)
  const searchQuery = ref('')
  
  // 通话中状态与当前呼叫对象
  const activeCall = ref(null) // null | { name, number, duration: 0, status: 'calling'|'connected', isVideo: false }
  
  // Flash Call 快速弹窗状态
  const flashCallTarget = ref(null) // null | { name, number }
  
  // 来电显示模式：'banner' (弹窗显示) | 'fullscreen' (全屏显示)
  const callDisplayMode = ref('banner')
  
  // 电话设置各项状态
  const settings = ref({
    autoRecord: true,
    recordScope: 'custom', // 'all' | 'custom'
    recordUnknown: false,
    noiseReductionSystem: '标准降噪', // '关闭' | '标准降噪' | '深度降噪'
    noiseReductionVoip: '标准降噪', // '关闭' | '标准降噪' | '深度降噪'
    aiSummary: true,
    aiTranslate: true,
    flashCallEnabled: true,
    flashCallOnlyContacts: false,
    flashCallReplies: [
      { id: 1, text: '节日快乐', enabled: true },
      { id: 2, text: '请回电话', enabled: true }
    ],
    unknownId: true,
    unknownPhoneSms: true,
    unknownWhatsApp: true,
    unknownPopup: true,
    autoUpdateData: 'wlan_only', // 'wlan_only' | 'always' | 'never'
    voiceBroadcast: 'never', // 'never' | 'always' | 'headset'
    videoShow: 'default',
    powerButtonEndsCall: false,
    vibrateOnCallAction: true,
    flipToMute: false,
    pickupToAnswer: false,
    gestureAnswer: false,
    designatedNumbers: ['138 0013 8000', '136 8888 2233'],
    aiMyLanguage: '英语',
    aiMyVoice: '男',
    aiMuteMyVoice: false,
    aiTargetLanguage: '英语',
    aiTargetVoice: '男',
    aiAutoUpdate: '仅 WLAN',
    blockStranger: false,
    blockHidden: false,
    blockKeywords: [],
    blackList: ['4000595558'],
    whiteList: [],
    blockNotify: '拦截后通知',
    speedDial: {
      1: '语音邮件',
      2: '陈晓敏',
      3: 'A老婆',
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
      9: null
    },
    ttyMode: 'TTY 关闭',
    hearingAid: false,
    carrierVideoCall: true,
    carrierAccount: '中国电信'
  })

  // 纯模拟通话记录数据（全面消除任何真实个人记录与真实号码，按真机截图 1:1 补充丰富数据）
  const recents = ref([
    {
      id: 'r1',
      name: '陈晓敏',
      number: '136 8888 2233',
      type: 'incoming', // incoming | outgoing | missed
      tag: '单位',
      hd: true,
      time: '07:26 下午',
      date: '今天'
    },
    {
      id: 'r2',
      name: '400 888 8853',
      number: '400 888 8853',
      type: 'missed',
      tag: '中国',
      hd: false,
      time: '12:18 下午',
      date: '今天'
    },
    {
      id: 'r3',
      name: '181 2206 7312',
      number: '181 2206 7312',
      type: 'missed',
      tag: '广东省深圳市',
      hd: true,
      time: '11/4',
      date: '11/4'
    },
    {
      id: 'r4',
      name: '0755 6169 1814',
      number: '0755 6169 1814',
      type: 'missed',
      tag: '广东省深圳市',
      hd: true,
      time: '11/4',
      date: '11/4'
    },
    {
      id: 'r5',
      name: '0755 6164 4106',
      number: '0755 6164 4106',
      type: 'missed',
      tag: '广东省深圳市',
      hd: true,
      time: '11/4',
      date: '11/4'
    },
    {
      id: 'r6',
      name: '133 4291 5371',
      number: '133 4291 5371',
      type: 'missed',
      tag: '广东省深圳市',
      hd: true,
      time: '11/4',
      date: '11/4'
    },
    {
      id: 'r7',
      name: '020 6294 0028',
      number: '020 6294 0028',
      type: 'missed',
      tag: '广东省广州市',
      hd: true,
      time: '11/3',
      date: '11/3'
    },
    {
      id: 'r8',
      name: '400 101 6859',
      number: '400 101 6859',
      type: 'missed',
      tag: '中国',
      hd: true,
      time: '11/2',
      date: '11/2'
    },
    {
      id: 'r9',
      name: 'A老婆',
      count: 2,
      number: '139 0000 8822',
      type: 'missed',
      tag: '手机',
      hd: true,
      time: '11/2',
      date: '11/2'
    },
    {
      id: 'r10',
      name: '0753 816 9781',
      number: '0753 816 9781',
      type: 'missed',
      tag: '广东省梅州市',
      hd: true,
      time: '10/31',
      date: '10/31'
    },
    {
      id: 'r11',
      name: '林小敏',
      number: '138 0013 8000',
      type: 'incoming',
      count: 2,
      tag: '家人',
      hd: true,
      time: '10/30',
      date: '10/30'
    },
    {
      id: 'r12',
      name: '咨询专线',
      number: '0755 8888 1814',
      type: 'missed',
      tag: '广东深圳',
      hd: true,
      time: '10/28',
      date: '10/28'
    },
    {
      id: 'r13',
      name: '业务专员',
      number: '0755 8888 4106',
      type: 'missed',
      tag: '广东深圳',
      hd: true,
      time: '10/26',
      date: '10/26'
    },
    {
      id: 'r14',
      name: '顺丰速运',
      number: '133 0000 5371',
      type: 'missed',
      tag: '广东深圳',
      hd: true,
      time: '10/24',
      date: '10/24'
    },
    {
      id: 'r15',
      name: '广州分部',
      number: '020 8888 0028',
      type: 'missed',
      tag: '广东广州',
      hd: true,
      time: '10/22',
      date: '10/22'
    },
    {
      id: 'r16',
      name: '全国客服热线',
      number: '400 100 6859',
      type: 'missed',
      tag: '全国客服',
      hd: true,
      time: '10/20',
      date: '10/20'
    }
  ])

  // 纯模拟联系人数据（全面替换为安全模拟演示名单）
  const contacts = ref([
    {
      id: 'c1',
      name: '阿里巴巴客户服务',
      number: '400 800 1688',
      initial: 'A',
      pinyin: 'alibabakehufuwu',
      color: '#4F46E5'
    },
    {
      id: 'c2',
      name: '安吉拉',
      number: '138 0000 1001',
      initial: 'A',
      pinyin: 'anjila',
      color: '#6366F1'
    },
    {
      id: 'c3',
      name: '爱尚生活馆',
      number: '139 1234 5678',
      initial: 'A',
      pinyin: 'aishangshenghuoguan',
      color: '#0EA5E9'
    },
    {
      id: 'c4',
      name: '陈晓敏',
      number: '136 8888 2233',
      initial: 'C',
      pinyin: 'chenxiaomin',
      color: '#EC4899'
    },
    {
      id: 'c5',
      name: '何子涵',
      number: '151 2233 4455',
      initial: 'H',
      pinyin: 'hezihan',
      color: '#8B5CF6'
    },
    {
      id: 'c6',
      name: '李明',
      number: '137 0000 3344',
      initial: 'L',
      pinyin: 'liming',
      color: '#10B981'
    },
    {
      id: 'c7',
      name: '王海峰',
      number: '+86 134 5566 7788',
      initial: 'W',
      pinyin: 'wanghaifeng',
      color: '#3B82F6'
    },
    {
      id: 'c8',
      name: '张建国',
      number: '188 6677 8899',
      initial: 'Z',
      pinyin: 'zhangjianguo',
      color: '#14B8A6'
    },
    {
      id: 'c9',
      name: '智行客服专线',
      number: '0513 8066 1231',
      initial: 'Z',
      pinyin: 'zhixingkefuzhuanxian',
      color: '#F59E0B'
    }
  ])

  // 重复联系人横幅可见性
  const duplicateBannerVisible = ref(true)

  // 弹窗状态与选中详情对象
  const selectedRecent = ref(null) // 通话详情弹窗对象
  const selectedContact = ref(null) // 联系人详情弹窗对象

  // 过滤后的通话记录列表
  const filteredRecents = computed(() => {
    if (recentsFilter.value === 'missed') {
      return recents.value.filter(r => r.type === 'missed')
    }
    return recents.value
  })

  // 按字母排序与分组的联系人
  const groupedContacts = computed(() => {
    const map = {}
    for (const c of contacts.value) {
      const key = (c.initial || '#').toUpperCase()
      if (!map[key]) map[key] = []
      map[key].push(c)
    }
    return Object.keys(map).sort().map(letter => ({
      letter,
      list: map[letter]
    }))
  })

  // 搜索匹配联系人与号码（支持姓名、拼音与数字搜索）
  const searchResults = computed(() => {
    const q = searchQuery.value.trim().toLowerCase().replace(/\s+/g, '')
    if (!q) return []
    return contacts.value.filter(c => {
      const cleanNum = c.number.replace(/\D/g, '')
      return c.name.toLowerCase().includes(q) ||
             (c.pinyin && c.pinyin.includes(q)) ||
             cleanNum.includes(q)
    })
  })

  // 键盘输入操作
  function appendKey(k) {
    if (dialedNumber.value.length < 20) {
      dialedNumber.value += k
    }
  }

  function deleteKey() {
    dialedNumber.value = dialedNumber.value.slice(0, -1)
  }

  function clearNumber() {
    dialedNumber.value = ''
  }

  function toggleKeypad() {
    isKeypadOpen.value = !isKeypadOpen.value
  }

  // 发起呼叫
  let callTimer = null
  function startCall(target, isVideo = false) {
    const name = typeof target === 'string' ? target : (target?.name || target?.number)
    const number = typeof target === 'string' ? target : (target?.number || target?.name)
    activeCall.value = {
      name: name || number,
      number: number || name,
      duration: 0,
      status: 'calling', // 呼叫中
      isVideo,
      isMuted: false,
      isSpeaker: false,
      isRecording: false,
      dtmfLogs: ''
    }
    
    // 模拟 1.8 秒后接通
    clearTimeout(callTimer)
    callTimer = setTimeout(() => {
      if (activeCall.value) {
        activeCall.value.status = 'connected'
      }
    }, 1800)
  }

  function endCall() {
    clearTimeout(callTimer)
    callTimer = null
    if (activeCall.value) {
      recents.value.unshift({
        id: 'r_' + Date.now(),
        name: activeCall.value.name !== activeCall.value.number ? activeCall.value.name : '',
        number: activeCall.value.number,
        type: 'outgoing',
        tag: '刚刚拨出',
        hd: true,
        time: '刚刚',
        date: '今天'
      })
    }
    activeCall.value = null
    dialedNumber.value = ''
  }

  // 删除单条通话记录
  function removeRecent(id) {
    recents.value = recents.value.filter(r => r.id !== id)
    if (selectedRecent.value?.id === id) {
      selectedRecent.value = null
    }
  }

  // 清空通话记录
  function clearRecents(filterType = 'all') {
    if (filterType === 'missed') {
      recents.value = recents.value.filter(r => r.type !== 'missed')
    } else {
      recents.value = []
    }
    selectedRecent.value = null
  }

  // 合并重复联系人
  function dismissDuplicateBanner() {
    duplicateBannerVisible.value = false
  }

  function mergeDuplicates() {
    // 模拟合并重复联系人
    duplicateBannerVisible.value = false
  }

  // 新增联系人
  const AVATAR_COLORS = ['#4F46E5', '#6366F1', '#0EA5E9', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6', '#14B8A6', '#F59E0B']
  function addContact({ name, number, tag = '手机', company = '' }) {
    if (!name?.trim() && !number?.trim()) return null
    const finalName = name?.trim() || number?.trim()
    const finalNumber = number?.trim() || ''
    
    // 简易拼音首字母推导
    let initial = '#'
    const firstChar = finalName[0]
    if (/[a-zA-Z]/.test(firstChar)) {
      initial = firstChar.toUpperCase()
    } else if (/[\u4e00-\u9fa5]/.test(firstChar)) {
      // 简单中文首字母映射（覆盖常见姓氏）
      const pinyinMap = {
        '李': 'L', '王': 'W', '张': 'Z', '刘': 'L', '陈': 'C', '杨': 'Y', '黄': 'H', '赵': 'Z',
        '吴': 'W', '周': 'Z', '徐': 'X', '孙': 'S', '马': 'M', '朱': 'Z', '胡': 'H', '郭': 'G',
        '何': 'H', '高': 'G', '林': 'L', '罗': 'L', '郑': 'Z', '梁': 'L', '谢': 'X', '宋': 'S',
        '唐': 'T', '许': 'X', '韩': 'H', '冯': 'F', '邓': 'D', '曹': 'C', '彭': 'P', '曾': 'Z',
        '肖': 'X', '田': 'T', '董': 'D', '袁': 'Y', '潘': 'P', '于': 'Y', '蒋': 'J', '蔡': 'C',
        '余': 'Y', '杜': 'D', '叶': 'Y', '程': 'C', '苏': 'S', '魏': 'W', '吕': 'L', '丁': 'D',
        '任': 'R', '沈': 'S', '姚': 'Y', '卢': 'L', '姜': 'J', '崔': 'C', '钟': 'Z', '谭': 'T',
        '陆': 'L', '汪': 'W', '范': 'F', '金': 'J', '石': 'S', '廖': 'L', '贾': 'J', '夏': 'X',
        '韦': 'W', '付': 'F', '方': 'F', '白': 'B', '邹': 'Z', '孟': 'M', '熊': 'X', '秦': 'Q',
        '邱': 'Q', '江': 'J', '尹': 'Y', '薛': 'X', '闫': 'Y', '段': 'D', '雷': 'L', '侯': 'H',
        '龙': 'L', '史': 'S', '陶': 'T', '黎': 'L', '贺': 'H', '顾': 'G', '毛': 'M', '郝': 'H',
        '龚': 'G', '邵': 'S', '万': 'W', '钱': 'Q', '严': 'Y', '覃': 'T', '武': 'W', '戴': 'D',
        '莫': 'M', '孔': 'K', '向': 'X', '汤': 'T', '安': 'A', '爱': 'A', '阿': 'A'
      }
      initial = pinyinMap[firstChar] || '#'
    }

    const newContact = {
      id: 'c_' + Date.now(),
      name: finalName,
      number: finalNumber,
      tag,
      company,
      initial,
      pinyin: finalName.toLowerCase(),
      color: AVATAR_COLORS[contacts.value.length % AVATAR_COLORS.length]
    }
    contacts.value.unshift(newContact)
    return newContact
  }

  // 更新联系人
  function updateContact(id, data) {
    const idx = contacts.value.findIndex(c => c.id === id)
    if (idx !== -1) {
      contacts.value[idx] = { ...contacts.value[idx], ...data }
      if (selectedContact.value?.id === id) {
        selectedContact.value = contacts.value[idx]
      }
    }
  }

  // 删除联系人
  function removeContact(id) {
    contacts.value = contacts.value.filter(c => c.id !== id)
    if (selectedContact.value?.id === id) {
      selectedContact.value = null
    }
  }

  // 添加自定义快捷回复
  function addFlashCallReply(text) {
    if (!text.trim()) return
    settings.value.flashCallReplies.push({
      id: Date.now(),
      text: text.trim(),
      enabled: true
    })
  }

  function removeFlashCallReply(id) {
    settings.value.flashCallReplies = settings.value.flashCallReplies.filter(r => r.id !== id)
  }

  // 指定号码录音管理
  function addDesignatedNumber(num) {
    if (!num || !num.trim()) return
    const clean = num.trim()
    if (!settings.value.designatedNumbers.includes(clean)) {
      settings.value.designatedNumbers.push(clean)
    }
  }

  function removeDesignatedNumber(num) {
    settings.value.designatedNumbers = settings.value.designatedNumbers.filter(n => n !== num)
  }

  // 快速拨号绑定与触发
  function setSpeedDial(key, nameOrNum) {
    if (key >= 2 && key <= 9) {
      settings.value.speedDial[key] = nameOrNum
    }
  }

  function dialSpeedKey(key) {
    if (key === 1) {
      startCall({ name: '语音邮件', number: '10086' })
      return true
    }
    const target = settings.value.speedDial[key]
    if (target) {
      const foundContact = contacts.value.find(c => c.name === target || c.number === target)
      if (foundContact) {
        startCall(foundContact)
      } else {
        startCall({ name: target, number: target })
      }
      return true
    }
    return false
  }

  // 黑名单管理
  function addBlackListNumber(num) {
    if (!num || !num.trim()) return
    const clean = num.trim()
    if (!settings.value.blackList.includes(clean)) {
      settings.value.blackList.push(clean)
    }
  }

  function removeBlackListNumber(num) {
    settings.value.blackList = settings.value.blackList.filter(n => n !== num)
  }

  // 白名单管理
  function addWhiteListNumber(num) {
    if (!num || !num.trim()) return
    const clean = num.trim()
    if (!settings.value.whiteList.includes(clean)) {
      settings.value.whiteList.push(clean)
    }
  }

  function removeWhiteListNumber(num) {
    settings.value.whiteList = settings.value.whiteList.filter(n => n !== num)
  }

  // 自定义短信拦截短语
  function addBlockKeyword(kw) {
    if (!kw || !kw.trim()) return
    const clean = kw.trim()
    if (!settings.value.blockKeywords.includes(clean)) {
      settings.value.blockKeywords.push(clean)
    }
  }

  function removeBlockKeyword(kw) {
    settings.value.blockKeywords = settings.value.blockKeywords.filter(k => k !== kw)
  }

  return {
    currentTab,
    recentsFilter,
    isKeypadOpen,
    dialedNumber,
    isSearchActive,
    searchQuery,
    activeCall,
    flashCallTarget,
    callDisplayMode,
    selectedRecent,
    selectedContact,
    settings,
    recents,
    contacts,
    duplicateBannerVisible,
    filteredRecents,
    groupedContacts,
    searchResults,
    appendKey,
    deleteKey,
    clearNumber,
    toggleKeypad,
    startCall,
    endCall,
    removeRecent,
    clearRecents,
    addContact,
    updateContact,
    removeContact,
    dismissDuplicateBanner,
    mergeDuplicates,
    addFlashCallReply,
    removeFlashCallReply,
    addDesignatedNumber,
    removeDesignatedNumber,
    setSpeedDial,
    dialSpeedKey,
    addBlackListNumber,
    removeBlackListNumber,
    addWhiteListNumber,
    removeWhiteListNumber,
    addBlockKeyword,
    removeBlockKeyword
  }
})
