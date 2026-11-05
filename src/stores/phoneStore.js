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
    gestureAnswer: false
  })

  // 种子通话记录数据（对齐真机录屏中的真实通话列表）
  const recents = ref([
    {
      id: 'r1',
      name: '陈伊曼',
      number: '188 1234 5678',
      type: 'incoming', // incoming | outgoing | missed
      tag: '单位',
      hd: true,
      time: '07:26 下午',
      date: '今天'
    },
    {
      id: 'r2',
      name: '',
      number: '181 2206 7312',
      type: 'missed',
      tag: '广东省深圳市',
      hd: true,
      time: '04:45 下午',
      date: '今天'
    },
    {
      id: 'r3',
      name: '',
      number: '0755 6169 1814',
      type: 'missed',
      tag: '广东省深圳市',
      hd: true,
      time: '04:44 下午',
      date: '今天'
    },
    {
      id: 'r4',
      name: '',
      number: '0755 6164 4106',
      type: 'missed',
      tag: '广东省深圳市',
      hd: true,
      time: '04:43 下午',
      date: '今天'
    },
    {
      id: 'r5',
      name: '',
      number: '133 4291 5371',
      type: 'missed',
      tag: '广东省深圳市',
      hd: true,
      time: '04:31 下午',
      date: '今天'
    },
    {
      id: 'r6',
      name: '陈伊曼',
      number: '188 1234 5678',
      type: 'incoming',
      tag: '单位',
      hd: true,
      time: '07:55 上午',
      date: '今天'
    },
    {
      id: 'r7',
      name: '',
      number: '020 6294 0028',
      type: 'missed',
      tag: '广东省广州市',
      hd: true,
      time: '昨天',
      date: '11/3'
    },
    {
      id: 'r8',
      name: '',
      number: '400 101 6859',
      type: 'missed',
      tag: '中国',
      hd: true,
      time: '前天',
      date: '11/2'
    },
    {
      id: 'r9',
      name: 'A老婆',
      number: '138 0013 8000',
      type: 'incoming',
      count: 2,
      tag: '家人',
      hd: true,
      time: '10/30',
      date: '10/30'
    }
  ])

  // 种子联系人数据（对齐真机录屏联系人列表）
  const contacts = ref([
    {
      id: 'c1',
      name: '阿里巴巴钉钉客服',
      number: '0571 8815 7888',
      initial: 'A',
      pinyin: 'alibabadingdingkefu',
      color: '#4F46E5'
    },
    {
      id: 'c2',
      name: '艾尚美窗纱-老板娘',
      number: '139 2840 9182',
      initial: 'A',
      pinyin: 'aishangmeichuangsha',
      color: '#6366F1'
    },
    {
      id: 'c3',
      name: '爱尚美窗纱',
      number: '137 1948 2234',
      initial: 'A',
      pinyin: 'aishangmeichuangsha',
      color: '#0EA5E9'
    },
    {
      id: 'c4',
      name: '安装垃圾处理器',
      number: '135 9012 3456',
      initial: 'A',
      pinyin: 'anzhuanglajichuliqi',
      color: '#10B981'
    },
    {
      id: 'c5',
      name: '陈伊曼',
      number: '188 1234 5678',
      initial: 'C',
      pinyin: 'chenyiman',
      color: '#EC4899'
    },
    {
      id: 'c6',
      name: '何兰',
      number: '151 1231 3663',
      initial: 'H',
      pinyin: 'helan',
      color: '#8B5CF6'
    },
    {
      id: 'c7',
      name: '王海元',
      number: '+86 134 1234 5567',
      initial: 'W',
      pinyin: 'wanghaiyuan',
      color: '#3B82F6'
    },
    {
      id: 'c8',
      name: '智行火车票',
      number: '0513 8066 1231',
      initial: 'Z',
      pinyin: 'zhixinghuochepiao',
      color: '#F59E0B'
    }
  ])

  // 重复联系人横幅可见性
  const duplicateBannerVisible = ref(true)

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
      const key = c.initial || '#'
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
    const number = typeof target === 'string' ? target : target?.number
    activeCall.value = {
      name: name || number,
      number: number || name,
      duration: 0,
      status: 'calling', // 呼叫中
      isVideo
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
      // 记录到通话记录中
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

  // 合并重复联系人
  function dismissDuplicateBanner() {
    duplicateBannerVisible.value = false
  }

  function mergeDuplicates() {
    duplicateBannerVisible.value = false
    // 模拟去重完成
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
    dismissDuplicateBanner,
    mergeDuplicates,
    addFlashCallReply
  }
})
