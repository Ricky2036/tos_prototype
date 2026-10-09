/**
 * AI Mate 应用词条（zh / en / bn）。
 *
 * 与 OneLeap 的重叠文案（拾音模式三档）措辞刻意保持一致：
 *   全向「四周均衡拾音」/ 定向「聚焦正前方人声」/ 会议「多人声场增强」
 * —— 两边说的是同一个能力，不应该出现两套说法。
 *
 * 风扇 6 档模式名直接沿用归档原文（`正常风 / HI暴风 / 自然风 / 睡眠风 / 母婴风 / 智能风`），
 * 中文不作改写；en / bn 为对应译名。
 */

export const AIMATE = {
  zh: {
    appName: 'AI Mate',
    home: {
      myDevices: '我的设备',
      empty: '还没有设备',
      greeting: '下午好，Ling',
      greetingSub: '让每一次对话都有迹可循',
      addDeviceAction: '＋ 添加设备',
      summary: '{n} 台设备 · {m} 台在线',
      otherDevices: '其他设备',
      otherSub: '集中管理你的 AI Mate 设备',
      addNew: '添加新设备',
      addNewSub: '蓝牙 / NFC / 扫码',
      group: { carry: '随身', wear: '穿戴', appliance: '家电', home: '家居' }
    },
    tab: { home: '首页', mine: '我的', aria: 'AI Mate 底部导航' },
    action: {
      quickPrint: '快速打印',
      record: '录音', recordSub: '设备拾音',
      shoot: '拍摄', shootSub: '随身影音',
      enter: '进入'
    },
    deviceMeta: { battery: '电量 {n}%', paper: '相纸 {n} / {max} 张', used: '已用 {n} GB', shots: '{n} 张素材' },
    deviceTitle: { printer: '我的口袋打印机', recorder: '我的录音充电宝', mori: 'AI Mori' },
    other: {
      watch: 'AI 运动手表', watchModel: 'Mate Watch S2', watchMeta: '电量 72% · 今日已同步',
      buds: '智能耳机', budsModel: 'Mate Buds Pro', budsMeta: '电量 64% · 降噪已开启',
      glass: 'AI 眼镜', glassModel: 'Mate Glass', glassMeta: '上次在线：昨天 21:38',
      notConnected: '未连接', connect: '连接'
    },
    mine: {
      title: '我的', role: 'AI Mate 探索者', connected: '已连接 {n} 台设备',
      email: 'ling.kong@aimate.com', plan: 'AI Mate Pro',
      account: '账号与安全', notify: '通知设置', notifyValue: '已开启',
      general: '通用设置', privacy: '隐私与数据', help: '帮助与反馈',
      about: '关于 AI Mate', version: 'v3.6.0'
    },
    status: { online: '已连接', offline: '已离线', offlineShort: '离线' },
    type: {
      recorder: '录音充电宝', printer: '口袋打印机', watch: '手表', glasses: '眼镜',
      fan: '风扇', tws: '耳机', bulbs: '灯泡', infrared: '红外', locks: '门锁', socket: '插座',
      mori: 'AI Mori'
    },
    fan: {
      power: '电源', speed: '风速', mode: '模式', swing: '摇头', swingAngle: '摇头角度',
      plasma: '等离子', childLock: '童锁', timerOff: '定时关机', timerOn: '预约开机',
      roomTemp: '室温', nickname: '设备名称', nicknamePlaceholder: '给设备起个名',
      on: '开启', off: '关闭', notSet: '未设置', hour: '小时',
      modes: ['正常风', 'HI暴风', '自然风', '睡眠风', '母婴风', '智能风']
    },
    device: {
      detail: '设备详情', model: '型号', firmware: '固件版本', macAddr: 'MAC 地址',
      upgrade: '固件升级', upgrading: '升级中…',
      remove: '移除设备', removeConfirm: '移除后需要重新配对，确定移除？',
      removed: '已移除设备 ',
      signal: '信号强度', roomTemp: '室温'
    },
    scan: {
      title: '添加智能设备', scanning: '正在扫描附近的设备…', found: '发现以下设备',
      steps: '配对步骤',
      step1: '确保设备已开机并进入配对模式',
      step2: '手机蓝牙保持开启，与设备相距 1 米内',
      step3: '在列表中选择设备完成连接',
      connect: '连接', connecting: '正在连接…', connected: '已连接', failed: '连接失败',
      empty: '没有发现新设备', retry: '重新扫描', done: '完成'
    },
    printer: {
      title: '照片打印',
      sourceTitle: '选择照片来源',
      gallery: '从相册选择', gallerySub: '浏览最近照片',
      camera: '即时拍照', cameraSub: '拍摄或 AR 扫描',
      ar: 'AR 视频打印', arSub: '让照片动起来',
      pickTitle: '选择照片', pickHint: '最多可选 {n} 张',
      group: { recent: '最近项目', favorites: '收藏', camera: '相机', travel: '旅行' },
      emptyGroup: '这个分组还没有照片',
      next: '下一步',
      nextEdit: '下一步 · 编辑照片',
      editTitle: '编辑照片',
      tool: { crop: '裁剪与旋转', layout: '打印版式', frame: '相框', filter: '滤镜', adjust: '调节' },
      layout: { square: '方形', border: '保留白边', full: '满版', coral: '珊瑚边', film: '胶片', handwrite: '手写' },
      filter: { original: '原图', sunny: '晴日', oldfilm: '旧胶片', mono: '黑白' },
      brightness: '亮度', rotate: '旋转', reset: '恢复',
      nextSettings: '下一步 · 打印设置',
      quality: '打印质量', qualityHD: '高清', qualityStd: '标准',
      colorMode: '色彩模式', colorVivid: '鲜艳', colorRetro: '复古', colorNatural: '标准色彩',
      paper: '相纸余量', paperFull: '纸仓已满', buyPaper: '购买相纸', unit: '张',
      layoutName: '生活照片 · 4 × 6″',
      startPrint: '开始打印', startPrintN: '开始打印 · {n} 张',
      queueTitle: '打印队列', queueEmpty: '还没有照片，先选一张喜欢的吧',
      stage: { sending: '传输打印数据', developing: '照片正在显影', cutting: '正在完成裁切', done: '打印完成 · 请取走照片' },
      pause: '暂停', resume: '继续', cancel: '取消', clearDone: '清理已完成',
      arTitle: 'AR 视频打印', arVideo: '选择视频', arTrim: '拖动两端选择 {n} 秒片段',
      arSnap: '确认并开始 AR 打印', arOriginal: '原视频', arRebind: '重新选择视频',
      arScanTitle: 'AR 扫描回放', arScan: '扫描演示', arShoot: '拍摄照片',
      arHint: '将已打印的 AR 照片完整放入框内', arLocked: '已识别 AR 锚点', arPlaying: '视频播放中'
    },
    recorder: {
      pickup: '拾音模式', pickupHint: '切换后下一段录音生效',
      pickupModes: { omni: '四周均衡拾音', directed: '聚焦正前方人声', meeting: '多人声场增强' },
      pickupDesc: {
        omni: '适合随手记录与多人交谈',
        directed: '减少侧后方环境噪声',
        meeting: '增强远近不同位置的发言人'
      },
      record: '开始录音', recording: '录音中', stop: '停止', resume: '继续',
      reverseCharge: '反向充电', reverseChargeSub: '9W 输出',
      markers: '音频标记', transcript: '转写', summary: 'AI 纪要',
      addMarker: '添加标记', markerDone: '已添加时间戳标记',
      listen: '听译', faceToFace: '面对面翻译', dualSubtitle: '双语字幕',
      summaryTitle: 'AI 会议纪要', todos: '待办事项'
    },
    /** 归档「添加设备」五屏流程（tOS Prototype_aimate_fan.html 实测文案） */
    flow: {
      addTitle: '添加设备', addDeviceTitle: '添加{name}',
      scanNearby: '扫描附近设备', scanNearbySub: '如果扫描不到，可在下方手动添加',
      scanning: '设备搜索中…', scanningSub: '请开启设备蓝牙并靠近手机',
      scanHelp: '搜不到设备？', scanHelpLink: '查看帮助',
      manualAdd: '手动添加设备',
      selectModel: '选择型号', pairTitle: '配对步骤', startConnect: '开始连接',
      searchTitle: '搜索设备', searchSearching: '正在搜索设备…',
      searchSub: '请确认{name}已通电并处于蓝牙可发现状态',
      found: '搜索到以下设备', signalStrong: '蓝牙信号强', connect: '连接',
      connecting: '正在连接…', success: '连接成功', successSub: '你可在首页管理该设备',
      enterDevice: '进入设备'
    },
    modelSub: {
      noBlade: '无叶风扇 · 蓝牙', circulator: '循环扇 · 蓝牙', tws: '真无线耳机 · 蓝牙',
      glasses: '智能眼镜 · 蓝牙', bulbs: '智能灯泡 · Wi-Fi', infrared: '红外遥控 · 蓝牙',
      locks: '智能门锁 · 蓝牙', socket: '智能插座 · Wi-Fi', watch: '智能手表 · 蓝牙',
      recorder: '录音充电宝 · 蓝牙', printer: '口袋打印机 · 蓝牙', mori: '随身影音 · 蓝牙'
    },
    pairStep: {
      power: '确保设备已接通电源',
      pairKey: '长按设备的 Wi-Fi/蓝牙键 3 秒，指示灯快闪',
      tapConnect: '点击下方按钮开始连接'
    },
    control: {
      powerOn: '开启', powerOff: '已关机',
      speedTitle: '风速档位', speedValue: '当前档位：{n} / {max}',
      modeTitle: '模式', swing: '摇头',
      timerOff: '定时关机', timerOn: '预约开机', notSet: '未设置',
      plasma: '等离子', plasmaOff: '关闭', plasmaOn: '开启',
      more: '更多', childLock: '童锁', manual: '产品说明书', firmware: '固件升级',
    },
    info: {
      title: '设备详情', mac: 'Mac 地址', firmwareVer: '固件版本',
      rename: '重命名', delete: '删除设备', cancel: '取消', save: '保存',
      deleteTitle: '删除设备', deleteBody: '删除后需要重新配对才能继续使用。',
      renamePlaceholder: '输入设备名称'
    },
    notice: {
      offline: '设备已离线',
      childLock: '请先关闭童锁后操作',
      timerOffSet: '定时关机已设置',
      timerOnSet: '预约开机已设置',
      timerOffCleared: '已取消定时关机',
      timerOnCleared: '已取消预约开机',
      notFound: '设备不存在',
      deviceStatus: '{name} · {meta}',
      mineWip: '演示原型：该入口暂未展开',
      firmwareUpgraded: '固件已升级至 v{v}',
      printMaxPick: '一次最多选择 {n} 张',
      printNoPhoto: '请先选择照片',
      printNoPaper: '相纸不足，仅剩 {n} 张',
      printSent: '任务已发送 · 正在后台打印',
      printPaused: '打印已暂停',
      printResumed: '正在继续打印',
      printCanceled: '打印任务已取消',
      paperBought: '已补充 {n} 张相纸',
      paperFull: '纸仓已满'
    }
  },

  en: {
    appName: 'AI Mate',
    home: {
      myDevices: 'My Devices',
      empty: 'No devices yet',
      greeting: 'Good afternoon, Ling',
      greetingSub: 'Every conversation, on the record',
      addDeviceAction: '+ Add device',
      summary: '{n} devices · {m} online',
      otherDevices: 'Other devices',
      otherSub: 'Keep all your AI Mate devices in one place',
      addNew: 'Add a new device',
      addNewSub: 'Bluetooth / NFC / QR code',
      group: { carry: 'Carry', wear: 'Wearables', appliance: 'Appliances', home: 'Home' }
    },
    tab: { home: 'Home', mine: 'Me', aria: 'AI Mate bottom navigation' },
    action: {
      quickPrint: 'Quick print',
      record: 'Record', recordSub: 'Device microphone',
      shoot: 'Capture', shootSub: 'Pocket camera',
      enter: 'Open'
    },
    deviceMeta: { battery: '{n}% battery', paper: 'Paper {n} / {max}', used: '{n} GB used', shots: '{n} items' },
    deviceTitle: { printer: 'My Pocket Printer', recorder: 'My Recorder Power Bank', mori: 'AI Mori' },
    other: {
      watch: 'AI Sports Watch', watchModel: 'Mate Watch S2', watchMeta: '72% battery · Synced today',
      buds: 'Smart Earbuds', budsModel: 'Mate Buds Pro', budsMeta: '64% battery · ANC on',
      glass: 'AI Glasses', glassModel: 'Mate Glass', glassMeta: 'Last online: yesterday 21:38',
      notConnected: 'Not connected', connect: 'Connect'
    },
    mine: {
      title: 'Me', role: 'AI Mate explorer', connected: '{n} devices connected',
      email: 'ling.kong@aimate.com', plan: 'AI Mate Pro',
      account: 'Account & Security', notify: 'Notifications', notifyValue: 'On',
      general: 'General', privacy: 'Privacy & Data', help: 'Help & Feedback',
      about: 'About AI Mate', version: 'v3.6.0'
    },
    status: { online: 'Connected', offline: 'Disconnected', offlineShort: 'Offline' },
    type: {
      recorder: 'Recorder Power Bank', printer: 'Pocket Printer', watch: 'Watch', glasses: 'Glasses',
      fan: 'Fan', tws: 'Earbuds', bulbs: 'Bulb', infrared: 'IR Remote', locks: 'Door Lock', socket: 'Smart Plug',
      mori: 'AI Mori'
    },
    fan: {
      power: 'Power', speed: 'Speed', mode: 'Mode', swing: 'Oscillate', swingAngle: 'Angle',
      plasma: 'Plasma', childLock: 'Child Lock', timerOff: 'Sleep Timer', timerOn: 'Schedule On',
      roomTemp: 'Room', nickname: 'Device Name', nicknamePlaceholder: 'Name this device',
      on: 'On', off: 'Off', notSet: 'Not set', hour: 'h',
      modes: ['Normal', 'Turbo', 'Natural', 'Sleep', 'Baby', 'Smart']
    },
    device: {
      detail: 'Device Details', model: 'Model', firmware: 'Firmware', macAddr: 'MAC Address',
      upgrade: 'Firmware Update', upgrading: 'Updating…',
      remove: 'Remove Device', removeConfirm: 'You will need to pair it again. Remove this device?',
      removed: 'Removed ',
      signal: 'Signal', roomTemp: 'Room Temp'
    },
    scan: {
      title: 'Add Smart Device', scanning: 'Scanning for nearby devices…', found: 'Devices found',
      steps: 'Pairing steps',
      step1: 'Make sure the device is on and in pairing mode',
      step2: 'Keep Bluetooth on and stay within 1 m',
      step3: 'Pick the device from the list to connect',
      connect: 'Connect', connecting: 'Connecting…', connected: 'Connected', failed: 'Connection failed',
      empty: 'No new devices found', retry: 'Scan again', done: 'Done'
    },
    printer: {
      title: 'Photo Printing',
      sourceTitle: 'Choose a Source',
      gallery: 'From Library', gallerySub: 'Browse recent photos',
      camera: 'Take a Photo', cameraSub: 'Shoot or AR scan',
      ar: 'AR Video Print', arSub: 'Make your photo move',
      pickTitle: 'Select Photos', pickHint: 'Up to {n} photos',
      group: { recent: 'Recent', favorites: 'Favorites', camera: 'Camera', travel: 'Travel' },
      emptyGroup: 'No photos in this album',
      next: 'Next',
      nextEdit: 'Next · Edit Photo',
      editTitle: 'Edit Photo',
      tool: { crop: 'Crop & Rotate', layout: 'Print Layout', frame: 'Frame', filter: 'Filter', adjust: 'Adjust' },
      layout: { square: 'Square', border: 'With Border', full: 'Full Bleed', coral: 'Coral Edge', film: 'Film', handwrite: 'Handwriting' },
      filter: { original: 'Original', sunny: 'Sunny', oldfilm: 'Old Film', mono: 'Mono' },
      brightness: 'Brightness', rotate: 'Rotate', reset: 'Reset',
      nextSettings: 'Next · Print Settings',
      quality: 'Print Quality', qualityHD: 'High', qualityStd: 'Standard',
      colorMode: 'Color Mode', colorVivid: 'Vivid', colorRetro: 'Retro', colorNatural: 'Natural',
      paper: 'Paper Left', paperFull: 'Tray Full', buyPaper: 'Buy Paper', unit: 'sheets',
      layoutName: 'Life Photo · 4 × 6″',
      startPrint: 'Start Printing', startPrintN: 'Start Printing · {n}',
      queueTitle: 'Print Queue', queueEmpty: 'No photos yet — pick one you like',
      stage: { sending: 'Sending print data', developing: 'Developing', cutting: 'Finishing the cut', done: 'Done · Ready to pick up' },
      pause: 'Pause', resume: 'Resume', cancel: 'Cancel', clearDone: 'Clear finished',
      arTitle: 'AR Video Print', arVideo: 'Choose a Video', arTrim: 'Drag both ends to pick {n}s',
      arSnap: 'Confirm & Start AR Print', arOriginal: 'Source video', arRebind: 'Choose another video',
      arScanTitle: 'AR Playback', arScan: 'Scan Demo', arShoot: 'Take Photo',
      arHint: 'Fit the printed AR photo inside the frame', arLocked: 'AR anchor recognized', arPlaying: 'Video playing'
    },
    recorder: {
      pickup: 'Pickup Mode', pickupHint: 'Applies to the next recording',
      pickupModes: { omni: 'Even pickup all around', directed: 'Focus on the person ahead', meeting: 'Boost multiple speakers' },
      pickupDesc: {
        omni: 'Good for quick notes and group chats',
        directed: 'Reduces noise from the sides and rear',
        meeting: 'Lifts speakers near and far'
      },
      record: 'Start Recording', recording: 'Recording', stop: 'Stop', resume: 'Resume',
      reverseCharge: 'Reverse Charging', reverseChargeSub: '9W output',
      markers: 'Audio Markers', transcript: 'Transcript', summary: 'AI Summary',
      addMarker: 'Add Marker', markerDone: 'Timestamp marker added',
      listen: 'Listen & Translate', faceToFace: 'Face to Face', dualSubtitle: 'Bilingual Subtitles',
      summaryTitle: 'AI Meeting Notes', todos: 'Action Items'
    },
    /** Add-device flow (copy from the archived `tOS Prototype_aimate_fan.html`) */
    flow: {
      addTitle: 'Add Device', addDeviceTitle: 'Add {name}',
      scanNearby: 'Scan for nearby devices', scanNearbySub: 'If nothing shows up, add it manually below',
      scanning: 'Searching for devices…', scanningSub: 'Turn on Bluetooth and keep the device close',
      scanHelp: 'Can’t find it?', scanHelpLink: 'View help',
      manualAdd: 'Add manually',
      selectModel: 'Select model', pairTitle: 'Pairing steps', startConnect: 'Start connecting',
      searchTitle: 'Search devices', searchSearching: 'Searching for devices…',
      searchSub: 'Make sure {name} is powered on and discoverable over Bluetooth',
      found: 'Devices found', signalStrong: 'Strong signal', connect: 'Connect',
      connecting: 'Connecting…', success: 'Connected', successSub: 'You can manage it from the home screen',
      enterDevice: 'Open device'
    },
    modelSub: {
      noBlade: 'Bladeless fan · Bluetooth', circulator: 'Circulator fan · Bluetooth',
      tws: 'True wireless earbuds · Bluetooth', glasses: 'Smart glasses · Bluetooth',
      bulbs: 'Smart bulb · Wi-Fi', infrared: 'IR remote · Bluetooth',
      locks: 'Smart lock · Bluetooth', socket: 'Smart socket · Wi-Fi',
      watch: 'Smart watch · Bluetooth', recorder: 'Recording power bank · Bluetooth',
      printer: 'Pocket printer · Bluetooth',
      mori: 'AI camera · Bluetooth'
    },
    pairStep: {
      power: 'Make sure the device is powered on',
      pairKey: 'Hold the Wi-Fi/Bluetooth button for 3 seconds until the LED blinks',
      tapConnect: 'Tap the button below to start connecting'
    },
    control: {
      powerOn: 'On', powerOff: 'Off',
      speedTitle: 'Fan speed', speedValue: 'Current level: {n} / {max}',
      modeTitle: 'Mode', swing: 'Oscillate',
      timerOff: 'Sleep timer', timerOn: 'Turn-on timer', notSet: 'Not set',
      plasma: 'Plasma', plasmaOff: 'Off', plasmaOn: 'On',
      more: 'More', childLock: 'Child lock', manual: 'User manual', firmware: 'Firmware update',
    },
    info: {
      title: 'Device details', mac: 'MAC address', firmwareVer: 'Firmware',
      rename: 'Rename', delete: 'Remove device', cancel: 'Cancel', save: 'Save',
      deleteTitle: 'Remove device', deleteBody: 'You will need to pair it again after removal.',
      renamePlaceholder: 'Device name'
    },
    notice: {
      offline: 'Device is offline',
      childLock: 'Turn off Child Lock first',
      timerOffSet: 'Sleep Timer set',
      timerOnSet: 'Schedule On set',
      timerOffCleared: 'Sleep Timer cleared',
      timerOnCleared: 'Schedule On cleared',
      notFound: 'Device not found',
      deviceStatus: '{name} · {meta}',
      mineWip: 'Prototype: this entry is not built out yet',
      firmwareUpgraded: 'Firmware updated to v{v}',
      printMaxPick: 'Up to {n} photos at a time',
      printNoPhoto: 'Select a photo first',
      printNoPaper: 'Not enough paper — only {n} left',
      printSent: 'Sent · printing in background',
      printPaused: 'Printing paused',
      printResumed: 'Resuming print',
      printCanceled: 'Print job canceled',
      paperBought: 'Added {n} sheets of paper',
      paperFull: 'Paper tray is full'
    }
  },

  bn: {
    appName: 'AI Mate',
    home: {
      myDevices: 'আমার ডিভাইস',
      empty: 'এখনো কোনো ডিভাইস নেই',
      greeting: 'শুভ অপরাহ্ন, Ling',
      greetingSub: 'প্রতিটি কথোপকথন থাকে সংরক্ষিত',
      addDeviceAction: '+ ডিভাইস যোগ করুন',
      summary: '{n}টি ডিভাইস · {m}টি অনলাইন',
      otherDevices: 'অন্যান্য ডিভাইস',
      otherSub: 'আপনার সব AI Mate ডিভাইস এক জায়গায় রাখুন',
      addNew: 'নতুন ডিভাইস যোগ করুন',
      addNewSub: 'ব্লুটুথ / NFC / QR কোড',
      group: { carry: 'সাথে', wear: 'পরিধেয়', appliance: 'গৃহস্থালি যন্ত্র', home: 'বাসগৃহ' }
    },
    tab: { home: 'হোম', mine: 'আমার', aria: 'AI Mate নিচের নেভিগেশন' },
    action: {
      quickPrint: 'দ্রুত প্রিন্ট',
      record: 'রেকর্ড', recordSub: 'ডিভাইসের মাইক',
      shoot: 'ছবি তুলুন', shootSub: 'পকেট ক্যামেরা',
      enter: 'খুলুন'
    },
    deviceMeta: { battery: 'ব্যাটারি {n}%', paper: 'কাগজ {n} / {max}', used: '{n} GB ব্যবহৃত', shots: '{n}টি আইটেম' },
    deviceTitle: { printer: 'আমার পকেট প্রিন্টার', recorder: 'আমার রেকর্ডার পাওয়ার ব্যাংক', mori: 'AI Mori' },
    other: {
      watch: 'AI স্পোর্টস ওয়াচ', watchModel: 'Mate Watch S2', watchMeta: 'ব্যাটারি ৭২% · আজ সিঙ্ক হয়েছে',
      buds: 'স্মার্ট ইয়ারবাড', budsModel: 'Mate Buds Pro', budsMeta: 'ব্যাটারি ৬৪% · নয়েজ ক্যান্সেল চালু',
      glass: 'AI চশমা', glassModel: 'Mate Glass', glassMeta: 'শেষ অনলাইন: গতকাল ২১:৩৮',
      notConnected: 'সংযুক্ত নয়', connect: 'সংযুক্ত করুন'
    },
    mine: {
      title: 'আমার', role: 'AI Mate অন্বেষক', connected: '{n}টি ডিভাইস সংযুক্ত',
      email: 'ling.kong@aimate.com', plan: 'AI Mate Pro',
      account: 'অ্যাকাউন্ট ও নিরাপত্তা', notify: 'নোটিফিকেশন', notifyValue: 'চালু',
      general: 'সাধারণ সেটিংস', privacy: 'গোপনীয়তা ও ডেটা', help: 'সহায়তা ও মতামত',
      about: 'AI Mate সম্পর্কে', version: 'v3.6.0'
    },
    status: { online: 'সংযুক্ত', offline: 'সংযোগবিহীন', offlineShort: 'অফলাইন' },
    type: {
      recorder: 'রেকর্ডার পাওয়ার ব্যাংক', printer: 'পকেট প্রিন্টার', watch: 'ঘড়ি', glasses: 'চশমা',
      fan: 'ফ্যান', tws: 'ইয়ারবাড', bulbs: 'বাল্ব', infrared: 'আইআর রিমোট', locks: 'দরজার তালা', socket: 'স্মার্ট প্লাগ',
      mori: 'AI Mori'
    },
    fan: {
      power: 'পাওয়ার', speed: 'গতি', mode: 'মোড', swing: 'ঘোরানো', swingAngle: 'ঘোরার কোণ',
      plasma: 'প্লাজমা', childLock: 'চাইল্ড লক', timerOff: 'টাইমার বন্ধ', timerOn: 'নির্ধারিত চালু',
      roomTemp: 'ঘরের তাপমাত্রা', nickname: 'ডিভাইসের নাম', nicknamePlaceholder: 'ডিভাইসের নাম দিন',
      on: 'চালু', off: 'বন্ধ', notSet: 'সেট করা হয়নি', hour: 'ঘণ্টা',
      modes: ['স্বাভাবিক', 'টার্বো', 'প্রাকৃতিক', 'স্লিপ', 'বেবি', 'স্মার্ট']
    },
    device: {
      detail: 'ডিভাইসের বিবরণ', model: 'মডেল', firmware: 'ফার্মওয়্যার', macAddr: 'MAC ঠিকানা',
      upgrade: 'ফার্মওয়্যার আপডেট', upgrading: 'আপডেট হচ্ছে…',
      remove: 'ডিভাইস সরান', removeConfirm: 'সরানোর পর আবার পেয়ার করতে হবে। সরিয়ে ফেলবেন?',
      removed: 'ডিভাইস সরানো হয়েছে ',
      signal: 'সিগন্যাল', roomTemp: 'ঘরের তাপমাত্রা'
    },
    scan: {
      title: 'স্মার্ট ডিভাইস যোগ করুন', scanning: 'কাছাকাছি ডিভাইস স্ক্যান করা হচ্ছে…', found: 'নিচের ডিভাইসগুলো পাওয়া গেছে',
      steps: 'পেয়ারিং ধাপ',
      step1: 'ডিভাইসটি চালু ও পেয়ারিং মোডে আছে কিনা দেখে নিন',
      step2: 'ব্লুটুথ চালু রেখে ১ মিটারের মধ্যে থাকুন',
      step3: 'তালিকা থেকে ডিভাইস বেছে নিয়ে সংযোগ করুন',
      connect: 'সংযোগ করুন', connecting: 'সংযোগ হচ্ছে…', connected: 'সংযুক্ত', failed: 'সংযোগ ব্যর্থ',
      empty: 'নতুন কোনো ডিভাইস পাওয়া যায়নি', retry: 'আবার স্ক্যান করুন', done: 'সম্পন্ন'
    },
    printer: {
      title: 'ফটো প্রিন্ট',
      sourceTitle: 'ছবির সূত্র বেছে নিন',
      gallery: 'গ্যালারি থেকে', gallerySub: 'সাম্প্রতিক ছবি দেখুন',
      camera: 'ছবি তুলুন', cameraSub: 'শুট বা AR স্ক্যান',
      ar: 'AR ভিডিও প্রিন্ট', arSub: 'ছবিকে নড়াচড়া দিন',
      pickTitle: 'ছবি নির্বাচন', pickHint: 'সর্বোচ্চ {n}টি ছবি',
      group: { recent: 'সাম্প্রতিক', favorites: 'প্রিয়', camera: 'ক্যামেরা', travel: 'ভ্রমণ' },
      emptyGroup: 'এই অ্যালবামে কোনো ছবি নেই',
      next: 'পরবর্তী',
      nextEdit: 'পরবর্তী · ছবি এডিট',
      editTitle: 'ছবি এডিট করুন',
      tool: { crop: 'ক্রপ ও ঘোরান', layout: 'প্রিন্ট লেআউট', frame: 'ফ্রেম', filter: 'ফিল্টার', adjust: 'সমন্বয়' },
      layout: { square: 'বর্গাকার', border: 'বর্ডারসহ', full: 'ফুল ব্লিড', coral: 'কোরাল প্রান্ত', film: 'ফিল্ম', handwrite: 'হাতের লেখা' },
      filter: { original: 'মূল', sunny: 'রোদেলা', oldfilm: 'পুরনো ফিল্ম', mono: 'সাদাকালো' },
      brightness: 'উজ্জ্বলতা', rotate: 'ঘোরান', reset: 'রিসেট',
      nextSettings: 'পরবর্তী · প্রিন্ট সেটিংস',
      quality: 'প্রিন্ট কোয়ালিটি', qualityHD: 'উচ্চ', qualityStd: 'স্ট্যান্ডার্ড',
      colorMode: 'রঙের মোড', colorVivid: 'উজ্জ্বল', colorRetro: 'রেট্রো', colorNatural: 'স্বাভাবিক',
      paper: 'কাগজ বাকি', paperFull: 'ট্রে পূর্ণ', buyPaper: 'কাগজ কিনুন', unit: 'শিট',
      layoutName: 'লাইফ ফটো · ৪ × ৬″',
      startPrint: 'প্রিন্ট শুরু', startPrintN: 'প্রিন্ট শুরু · {n}',
      queueTitle: 'প্রিন্ট কিউ', queueEmpty: 'এখনো ছবি নেই — একটি বেছে নিন',
      stage: { sending: 'প্রিন্ট ডেটা পাঠানো হচ্ছে', developing: 'ছবি ডেভেলপ হচ্ছে', cutting: 'কাটা শেষ হচ্ছে', done: 'সম্পন্ন · নিয়ে নিন' },
      pause: 'বিরতি', resume: 'চালিয়ে যান', cancel: 'বাতিল', clearDone: 'সম্পন্ন মুছুন',
      arTitle: 'AR ভিডিও প্রিন্ট', arVideo: 'ভিডিও বাছুন', arTrim: 'দুই প্রান্ত টেনে {n} সেকেন্ড বাছুন',
      arSnap: 'নিশ্চিত করে AR প্রিন্ট শুরু', arOriginal: 'মূল ভিডিও', arRebind: 'অন্য ভিডিও বাছুন',
      arScanTitle: 'AR প্লেব্যাক', arScan: 'স্ক্যান ডেমো', arShoot: 'ছবি তুলুন',
      arHint: 'প্রিন্ট করা AR ছবিটি ফ্রেমের ভিতরে রাখুন', arLocked: 'AR অ্যাঙ্কর শনাক্ত হয়েছে', arPlaying: 'ভিডিও চলছে'
    },
    recorder: {
      pickup: 'পিকআপ মোড', pickupHint: 'পরের রেকর্ডিংয়ে কার্যকর হবে',
      pickupModes: { omni: 'চারদিক সমান পিকআপ', directed: 'সামনের দিকে মনোযোগ', meeting: 'একাধিক বক্তা বুস্ট' },
      pickupDesc: {
        omni: 'দ্রুত নোট ও দলগত আলাপের জন্য',
        directed: 'পাশ ও পেছনের শব্দ কমায়',
        meeting: 'কাছে ও দূরে থাকা বক্তাকে স্পষ্ট করে'
      },
      record: 'রেকর্ডিং শুরু', recording: 'রেকর্ড হচ্ছে', stop: 'থামুন', resume: 'চালিয়ে যান',
      reverseCharge: 'রিভার্স চার্জিং', reverseChargeSub: '৯ ওয়াট আউটপুট',
      markers: 'অডিও মার্কার', transcript: 'প্রতিলিপি', summary: 'এআই সারসংক্ষেপ',
      addMarker: 'মার্কার যোগ করুন', markerDone: 'টাইমস্ট্যাম্প মার্কার যোগ হয়েছে',
      listen: 'শুনে অনুবাদ', faceToFace: 'মুখোমুখি অনুবাদ', dualSubtitle: 'দ্বিভাষিক সাবটাইটেল',
      summaryTitle: 'এআই মিটিং নোট', todos: 'করণীয়'
    },
    /** নথির সার্ক্যাস থেকে নেওয়া দেবাইস যোগ করার ফ্লো */
    flow: {
      addTitle: 'ডিভাইস যোগ করুন', addDeviceTitle: '{name} যোগ করুন',
      scanNearby: 'কাছের ডিভাইস স্ক্যান করুন', scanNearbySub: 'কিছু না পেলে নিচে নিজে যোগ করুন',
      scanning: 'ডিভাইস খুঁজছে…', scanningSub: 'ব্লুটুথ চালু করে ফোনের কাছে রাখুন',
      scanHelp: 'খুঁজে পাচ্ছেন না?', scanHelpLink: 'সহায়তা দেখুন',
      manualAdd: 'নিজে যোগ করুন',
      selectModel: 'মডেল বাছুন', pairTitle: 'পেয়ারিং ধাপ', startConnect: 'সংযোগ শুরু করুন',
      searchTitle: 'ডিভাইস খুঁজুন', searchSearching: 'ডিভাইস খুঁজছে…',
      searchSub: 'নিশ্চিত করুন {name} চালু আছে এবং ব্লুটুথে আবিষ্কার্য',
      found: 'নিম্নলিখিত ডিভাইস পাওয়া গেছে', signalStrong: 'শক্ত সিগন্যাল', connect: 'সংযোগ করুন',
      connecting: 'সংযোগ করা হচ্ছে…', success: 'সংযোগ সফল', successSub: 'হোম স্ক্রিন থেকে পরিচালনা করুন',
      enterDevice: 'ডিভাইসে যান'
    },
    modelSub: {
      noBlade: 'ব্লেডলেস ফ্যান · ব্লুটুথ', circulator: 'সার্কুলেটর ফ্যান · ব্লুটুথ',
      tws: 'ট্রু ওয়ায়ারলেস ইয়ারবাড্স · ব্লুটুথ', glasses: 'স্মার্ট গ্লাসেস · ব্লুটুথ',
      bulbs: 'স্মার্ট বাল্ব · ওয়াইফাই', infrared: 'আইআর রিমোট · ব্লুটুথ',
      locks: 'স্মার্ট লক · ব্লুটুথ', socket: 'স্মার্ট সকেট · ওয়াইফাই',
      watch: 'স্মার্ট ওয়াচ · ব্লুটুথ', recorder: 'রেকর্ডিং পাওয়ারব্যাঙ্ক · ব্লুটুথ',
      printer: 'পকেট প্রিন্টার · ব্লুটুথ',
      mori: 'এআই ক্যামেরা · ব্লুটুথ'
    },
    pairStep: {
      power: 'নিশ্চিত করুন ডিভাইসটি চালু আছে',
      pairKey: 'Wi-Fi/ব্লুটুথ বোতাম 3 সেকেন্ড চাপে ধরুন',
      tapConnect: 'সংযোগ করতে নিচের বোতামে চাপুন'
    },
    control: {
      powerOn: 'চালু', powerOff: 'বন্ধ',
      speedTitle: 'ফ্যান গতি', speedValue: 'বর্তমান লেভেল: {n} / {max}',
      modeTitle: 'মোড', swing: 'ওসিলেশন',
      timerOff: 'স্লীপ টাইমার', timerOn: 'টার্ন-অন টাইমার', notSet: 'সেট করা হয়নি',
      plasma: 'প্লাজ্মা', plasmaOff: 'বন্ধ', plasmaOn: 'চালু',
      more: 'আরও', childLock: 'চাইল্ড লক', manual: 'ব্যবহার নির্দেশিকা', firmware: 'ফার্মওয়ার আপডেট',
    },
    info: {
      title: 'ডিভাইস বিবরণ', mac: 'MAC ঠিকানা', firmwareVer: 'ফার্মওয়ার',
      rename: 'নাম বদলান', delete: 'ডিভাইস মুছুন', cancel: 'বাতিল', save: 'সংরক্ষণ',
      deleteTitle: 'ডিভাইস মুছুন', deleteBody: 'মুছার পরে আবার পেয়ারিং করতে হবে।',
      renamePlaceholder: 'ডিভাইসের নাম'
    },
    notice: {
      offline: 'ডিভাইস অফলাইন',
      childLock: 'আগে চাইল্ড লক বন্ধ করুন',
      timerOffSet: 'টাইমার বন্ধ সেট হয়েছে',
      timerOnSet: 'নির্ধারিত চালু সেট হয়েছে',
      timerOffCleared: 'টাইমার বন্ধ বাতিল হয়েছে',
      timerOnCleared: 'নির্ধারিত চালু বাতিল হয়েছে',
      notFound: 'ডিভাইস পাওয়া যায়নি',
      deviceStatus: '{name} · {meta}',
      mineWip: 'প্রোটোটাইপ: এই এন্ট্রি এখনো তৈরি হয়নি',
      firmwareUpgraded: 'ফার্মওয়্যার v{v} এ আপডেট হয়েছে',
      printMaxPick: 'একবারে সর্বোচ্চ {n}টি ছবি',
      printNoPhoto: 'আগে একটি ছবি বাছুন',
      printNoPaper: 'কাগজ যথেষ্ট নয় — মাত্র {n}টি বাকি',
      printSent: 'পাঠানো হয়েছে · ব্যাকগ্রাউন্ডে প্রিন্ট হচ্ছে',
      printPaused: 'প্রিন্ট বিরতিতে',
      printResumed: 'প্রিন্ট চলছে',
      printCanceled: 'প্রিন্ট কাজ বাতিল',
      paperBought: '{n} শিট কাগজ যোগ হয়েছে',
      paperFull: 'কাগজ ট্রে পূর্ণ'
    }
  }
}
