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
      face: '面对面翻译', faceSub: '双方按键说话',
      listen: '听译', listenSub: '持续收听',
      enter: '进入'
    },
    deviceMeta: { battery: '电量 {n}%', paper: '相纸 {n} / {max} 张', used: '已用 {n} GB', shots: '{n} 张素材' },
    /* 风扇首页卡的归档文案（`tOS Prototype_aimate_fan.html` 的 `.device-card`）。
       档位值沿用 `control.speedValue`（归档同句：「当前档位：{n} / 12」） */
    fanCard: { power: '开关', speedTitle: '档位调节', speedPending: '下发中…' },
    /* 录音充电宝首页卡的两枚图标前缀（归档原文 `▰ 86%` / `◴ 已用 18.6GB`） */
    deviceMetaRec: { battery: '▰ {n}%', storage: '◴ 已用 {n}GB' },
    /* AI Mori 首页卡的三枚动作按钮（归档 `.dev-actions`：拍照 / 录像 / 录音）。
       `videoOn` / `audioOn` 是录制态文案 —— 归档 toggleRec() 会把 录像→录像中、录音→录音中 */
    moriCard: { photo: '拍照', video: '录像', audio: '录音', videoOn: '录像中', audioOn: '录音中' },
    deviceTitle: { printer: '我的口袋打印机', recorder: '我的录音充电宝', mori: 'AI Mori' },
    other: {
      watch: 'AI 运动手表', watchModel: 'Mate Watch S2', watchMeta: '电量 72% · 今日已同步',
      buds: '智能耳机', budsModel: 'Mate Buds Pro', budsMeta: '电量 64% · 降噪已开启',
      glass: 'AI 眼镜', glassModel: 'Mate Glass', glassMeta: '上次在线：昨天 21:38',
      notConnected: '未连接'
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
      title: '口袋打印机',
      online: '已连接',
      ready: '已连接 · 准备就绪',
      battery: '{n}% 电量',
      paperMeter: '{n} / {max} 张',
      cardMeta: '电量 {n}% · 相纸 {m} / {max} 张',
      deviceOnline: '设备已在线',

      /* —— 设备页 · 开始创作 —— */
      createTitle: '开始创作',
      gallery: '从相册选择', gallerySub: '浏览最近照片',
      camera: '即时拍照', cameraSub: '拍摄或 AR 扫描',
      ar: 'AR 视频打印', arSub: '让照片动起来 · 约 2 分钟',

      /* —— 打印队列 —— */
      queueTitle: '打印队列',
      queueEmpty: '还没有照片，先选一张喜欢的吧',
      queuePhoto: '生活照片 · 4 × 6″',
      queueAr: 'AR 视频照片 · 4 × 6″',
      queueStatusIdle: '高清 · 标准色彩',
      queueStatusPrinting: '任务已发送 · 正在后台打印',
      queueStatusPrintingAr: 'AR 数据已绑定 · 正在后台打印',
      queueStatusDone: '打印完成 · 请取走照片',
      queueStatusDoneAr: 'AR 照片打印完成 · 可前往扫描',
      startPrint: '开始打印 · {n} 张',
      removeQueue: '从队列移除',

      /* —— 设备管理 —— */
      manageTitle: '设备管理',
      secInfo: '设备信息',
      deviceName: '设备名称', deviceNameSub: '点击可修改',
      firmware: '固件版本', firmwareSub: '发现新版本 v2.4.1',
      firmwareUpgrade: '立即升级', firmwareUpgrading: '升级中 {n}%', firmwareLatest: '已是最新',
      secPrint: '打印设置',
      quality: '打印质量', qualityStd: '标准', qualityHD: '高清',
      colorMode: '色彩模式', colorNatural: '标准', colorVivid: '鲜艳', colorRetro: '复古',
      secSupplies: '耗材',
      paperLeft: '相纸余量 · {n} / {max} 张', paperFull: '纸仓已满', buyPaper: '购买相纸',

      /* —— 相册 —— */
      albumTitle: '选择照片',
      cancel: '取消',
      albumDay: '今天 · {n} 张照片',
      group: { recent: '最近项目', favorites: '收藏', camera: '相机', travel: '旅行' },
      emptyGroup: '这个分组还没有照片',
      nextEdit: '下一步 · 编辑照片',
      nextEditAr: '下一步 · 编辑 AR 照片',

      /* —— 编辑器 —— */
      editorTitle: '照片编辑',
      done: '完成',
      caption: 'SUMMER · 2026',
      tool: { crop: '裁剪', layout: '版式', frame: '相框', filter: '滤镜', adjust: '调节' },
      toolTitle: { crop: '裁剪与旋转', layout: '打印版式', frame: '相框', filter: '滤镜', adjust: '调节' },
      crop: { original: '原始', ratio34: '照片', square: '方形' },
      rotate: '旋转',
      layout: { border: '保留白边', full: '满版', grid2: '2 拼图', grid4: '4 拼图' },
      frame: { none: '无', dot: '珊瑚边', film: '胶片', handwrite: '手写' },
      filter: { original: '原图', sunny: '晴日', oldfilm: '旧胶片', mono: '黑白' },
      brightness: '亮度', strength: '强度',

      /* —— AR 三步向导 —— */
      arTitle: 'AR 视频打印',
      stepKicker: { '1': 'STEP 01 · 视频', '2': 'STEP 02 · 照片', '3': 'STEP 03 · 打印' },
      step1Title: '选一段会动的回忆',
      step1Desc: '支持 MP4 / MOV，拖动两端选择 5–15 秒片段。',
      videoPick: '从相册选择视频', videoPickSub: 'MP4 / MOV · 建议选择 5–15 秒内容',
      videoOriginal: '原视频 {n} 秒 · {size}',
      videoTrimmed: '已裁剪至 {n} 秒',
      videoChange: '重新选择视频',
      step2Title: '选择一张照片',
      step2Desc: '照片与视频分开选择；选好后进入完整照片编辑。',
      recentTitle: '最近照片', recentPick: '请选择 1 张',
      bindWaiting: '等待选择照片',
      bindDone: '照片与视频已关联',
      bindCopy: '照片将绑定「{name}」{n} 秒视频',
      step3Title: '确认后，就让它成真',
      step3Desc: '照片打印完成后，AR 视频会自动与实体照片绑定。',
      arBadge: 'AR · {n}s',
      printSummary: '高清 · 1 张 · 约 40 秒',
      arCaption: 'ISLAND DAYS · 2026',
      arNextVideo: '请先选择视频',
      arNextPhoto: '下一步 · 选择照片',
      arNextNeedPhoto: '请先选择照片',
      arNextEdit: '编辑照片并继续',
      arConfirm: '确认并开始 AR 打印',

      /* —— 相机 —— */
      cameraTitle: '即时拍照',
      modePhoto: '拍照', modeScan: 'AR 扫描',
      tipPhoto: '轻触下方按钮拍摄照片', tipScan: '将已打印的 AR 照片完整放入框内',
      shootPhoto: '拍摄照片', scanDemo: '扫描演示',
      arPlayingTag: '● AR 正在播放',

      /* —— 打印进度 —— */
      printing: '正在打印',
      printingDesc: '请保持打印机在附近，照片正在一点点显影。',
      stageTransfer: '传输打印数据',
      stageDevelop: '照片正在显影',
      stageCut: '正在完成裁切',
      timeLeft: '约 {n} 秒', timeSoon: '即将完成',
      pause: '暂停', resume: '继续',
      printDoneTitle: '打印完成',
      printDoneCopy: '新照片已经准备好了，记得轻轻拿取。',
      printDoneCopyAr: 'AR 照片已准备好。打开即时拍照并切换 AR 模式，即可扫描观看视频。',
      finish: '完成', tryAr: '体验 AR 扫描回放'
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
      printNoPhoto: '请先选择照片',
      deviceOnline: '设备已在线',
      printQueued: '已加入打印队列',
      printRemoved: '已从队列移除',
      printQueueFull: '队列最多 {n} 张',
      printStarted: '打印已启动，可继续使用其他功能',
      printArStarted: 'AR 打印已启动，可继续使用其他功能',
      printDone: '照片打印完成',
      printArDone: 'AR 照片打印完成',
      printPaused: '打印已暂停',
      printResumed: '正在继续打印',
      printCanceled: '打印任务已取消',
      printEditReset: '已恢复原始效果',
      printSettingSaved: '设置已保存',
      printRenamed: '设备名称已更新',
      printFwDone: '固件升级完成',
      printShot: '照片拍摄完成',
      printArLocked: '已识别 AR 锚点',
      printVideoPicked: '视频已选择，可拖动裁剪区间',
      printVideoPlaying: '视频播放中',
      printVideoPaused: '视频已暂停',
      printCropOriginal: '已保持原始比例',
      printCrop34: '已裁剪为 3:4',
      printCrop11: '已裁剪为 1:1',
      printRotated: '已旋转 90°',
      printFullBleed: '已使用无边距版式',
      printGrid2: '已进入 2 拼图模式',
      printGrid4: '已进入 4 拼图模式',
      printFrameHand: '已应用手写相框',
      paperGuide: '已打开相纸购买指南',
      paperFull: '纸仓已满',
      moriPhotoSent: '拍照指令已发送',
      moriVideoStart: '录像已开始，再次点击结束',
      moriAudioStart: '录音已开始，再次点击结束',
      moriVideoSaved: '录像已保存',
      moriAudioSaved: '录音已保存'
    }
  },

  en: {
    appName: 'AI Mate',
    home: {
      myDevices: 'My Devices',
      empty: 'No devices yet',
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
      face: 'Face-to-face', faceSub: 'Both sides press and talk',
      listen: 'Listen', listenSub: 'Keep listening',
      enter: 'Open'
    },
    deviceMeta: { battery: '{n}% battery', paper: 'Paper {n} / {max}', used: '{n} GB used', shots: '{n} items' },
    fanCard: { power: 'Power', speedTitle: 'Fan level', speedPending: 'Sending…' },
    /* Two glyph-prefixed chips on the recorder card (archive: `▰ 86%` / `◴ 已用 18.6GB`) */
    deviceMetaRec: { battery: '▰ {n}%', storage: '◴ {n}GB used' },
    moriCard: { photo: 'Photo', video: 'Video', audio: 'Audio', videoOn: 'Rec video', audioOn: 'Rec audio' },
    deviceTitle: { printer: 'My Pocket Printer', recorder: 'My Recorder Power Bank', mori: 'AI Mori' },
    other: {
      watch: 'AI Sports Watch', watchModel: 'Mate Watch S2', watchMeta: '72% battery · Synced today',
      buds: 'Smart Earbuds', budsModel: 'Mate Buds Pro', budsMeta: '64% battery · ANC on',
      glass: 'AI Glasses', glassModel: 'Mate Glass', glassMeta: 'Last online: yesterday 21:38',
      notConnected: 'Not connected'
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
      title: 'Pocket Printer',
      online: 'Connected',
      ready: 'Connected · Ready',
      battery: '{n}% battery',
      paperMeter: '{n} / {max} sheets',
      cardMeta: 'Battery {n}% · Paper {m} / {max} sheets',
      deviceOnline: 'Device is online',

      /* —— Device page · create —— */
      createTitle: 'Start Creating',
      gallery: 'From Library', gallerySub: 'Browse recent photos',
      camera: 'Instant Photo', cameraSub: 'Shoot or AR scan',
      ar: 'AR Video Print', arSub: 'Make photos move · about 2 min',

      /* —— Print queue —— */
      queueTitle: 'Print Queue',
      queueEmpty: 'No photos yet — pick one you like',
      queuePhoto: 'Life Photo · 4 × 6″',
      queueAr: 'AR Video Photo · 4 × 6″',
      queueStatusIdle: 'High · Natural',
      queueStatusPrinting: 'Job sent · printing in background',
      queueStatusPrintingAr: 'AR data bound · printing in background',
      queueStatusDone: 'Print complete · ready to pick up',
      queueStatusDoneAr: 'AR photo printed · ready to scan',
      startPrint: 'Start Printing · {n}',
      removeQueue: 'Remove from queue',

      /* —— Device management —— */
      manageTitle: 'Device Management',
      secInfo: 'Device Info',
      deviceName: 'Device name', deviceNameSub: 'Tap to edit',
      firmware: 'Firmware', firmwareSub: 'New version v2.4.1 available',
      firmwareUpgrade: 'Update now', firmwareUpgrading: 'Updating {n}%', firmwareLatest: 'Up to date',
      secPrint: 'Print Settings',
      quality: 'Print quality', qualityStd: 'Standard', qualityHD: 'High',
      colorMode: 'Color mode', colorNatural: 'Natural', colorVivid: 'Vivid', colorRetro: 'Retro',
      secSupplies: 'Supplies',
      paperLeft: 'Paper left · {n} / {max}', paperFull: 'Tray full', buyPaper: 'Buy paper',

      /* —— Library —— */
      albumTitle: 'Select Photo',
      cancel: 'Cancel',
      albumDay: 'Today · {n} photos',
      group: { recent: 'Recent', favorites: 'Favorites', camera: 'Camera', travel: 'Travel' },
      emptyGroup: 'No photos in this album',
      nextEdit: 'Next · Edit Photo',
      nextEditAr: 'Next · Edit AR Photo',

      /* —— Editor —— */
      editorTitle: 'Edit Photo',
      done: 'Done',
      caption: 'SUMMER · 2026',
      tool: { crop: 'Crop', layout: 'Layout', frame: 'Frame', filter: 'Filter', adjust: 'Adjust' },
      toolTitle: { crop: 'Crop & Rotate', layout: 'Print Layout', frame: 'Frame', filter: 'Filter', adjust: 'Adjust' },
      crop: { original: 'Original', ratio34: 'Photo', square: 'Square' },
      rotate: 'Rotate',
      layout: { border: 'Keep border', full: 'Full bleed', grid2: '2-up', grid4: '4-up' },
      frame: { none: 'None', dot: 'Coral edge', film: 'Film', handwrite: 'Handwriting' },
      filter: { original: 'Original', sunny: 'Sunny', oldfilm: 'Old film', mono: 'Mono' },
      brightness: 'Brightness', strength: 'Strength',

      /* —— AR wizard —— */
      arTitle: 'AR Video Print',
      stepKicker: { '1': 'STEP 01 · VIDEO', '2': 'STEP 02 · PHOTO', '3': 'STEP 03 · PRINT' },
      step1Title: 'Pick a memory that moves',
      step1Desc: 'MP4 / MOV supported — drag both ends to pick a 5–15s clip.',
      videoPick: 'Choose a video', videoPickSub: 'MP4 / MOV · 5–15s recommended',
      videoOriginal: 'Source {n}s · {size}',
      videoTrimmed: 'Trimmed to {n}s',
      videoChange: 'Choose another video',
      step2Title: 'Choose a photo',
      step2Desc: 'Photo and video are picked separately; then you go into the full editor.',
      recentTitle: 'Recent photos', recentPick: 'Pick 1',
      bindWaiting: 'Waiting for a photo',
      bindDone: 'Photo linked to video',
      bindCopy: 'The photo will bind to “{name}” {n}s video',
      step3Title: 'Confirm it, then make it real',
      step3Desc: 'Once printed, the AR video binds to the physical photo automatically.',
      arBadge: 'AR · {n}s',
      printSummary: 'High · 1 · about 40s',
      arCaption: 'ISLAND DAYS · 2026',
      arNextVideo: 'Pick a video first',
      arNextPhoto: 'Next · Choose Photo',
      arNextNeedPhoto: 'Choose a photo first',
      arNextEdit: 'Edit Photo & Continue',
      arConfirm: 'Confirm & Start AR Print',

      /* —— Camera —— */
      cameraTitle: 'Instant Photo',
      modePhoto: 'Photo', modeScan: 'AR Scan',
      tipPhoto: 'Tap the button below to take a photo', tipScan: 'Fit the printed AR photo inside the frame',
      shootPhoto: 'Take photo', scanDemo: 'Scan demo',
      arPlayingTag: '● AR playing',

      /* —— Print progress —— */
      printing: 'Printing',
      printingDesc: 'Keep the printer nearby — your photo is developing.',
      stageTransfer: 'Sending print data',
      stageDevelop: 'Developing photo',
      stageCut: 'Finishing the cut',
      timeLeft: 'about {n}s', timeSoon: 'Almost done',
      pause: 'Pause', resume: 'Resume',
      printDoneTitle: 'Print complete',
      printDoneCopy: 'Your new photo is ready — pick it up gently.',
      printDoneCopyAr: 'The AR photo is ready. Open Instant Photo, switch to AR mode and scan to watch the video.',
      finish: 'Done', tryAr: 'Try AR scan playback'
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
      printNoPhoto: 'Select a photo first',
      deviceOnline: 'Device is online',
      printQueued: 'Added to the print queue',
      printRemoved: 'Removed from the queue',
      printQueueFull: 'Up to {n} in the queue',
      printStarted: 'Printing started — you can keep using other features',
      printArStarted: 'AR printing started — you can keep using other features',
      printDone: 'Photo printed',
      printArDone: 'AR photo printed',
      printPaused: 'Printing paused',
      printResumed: 'Resuming print',
      printCanceled: 'Print job canceled',
      printEditReset: 'Original look restored',
      printSettingSaved: 'Settings saved',
      printRenamed: 'Device name updated',
      printFwDone: 'Firmware update complete',
      printShot: 'Photo captured',
      printArLocked: 'AR anchor recognized',
      printVideoPicked: 'Video picked — drag to trim',
      printVideoPlaying: 'Video playing',
      printVideoPaused: 'Video paused',
      printCropOriginal: 'Original ratio kept',
      printCrop34: 'Cropped to 3:4',
      printCrop11: 'Cropped to 1:1',
      printRotated: 'Rotated 90°',
      printFullBleed: 'Borderless layout applied',
      printGrid2: 'Switched to 2-up',
      printGrid4: 'Switched to 4-up',
      printFrameHand: 'Handwriting frame applied',
      paperGuide: 'Opening the paper buying guide',
      paperFull: 'Paper tray is full',
      moriPhotoSent: 'Shooting command sent',
      moriVideoStart: 'Video recording started, tap again to stop',
      moriAudioStart: 'Audio recording started, tap again to stop',
      moriVideoSaved: 'Video saved',
      moriAudioSaved: 'Audio saved'
    }
  },

  bn: {
    appName: 'AI Mate',
    home: {
      myDevices: 'আমার ডিভাইস',
      empty: 'এখনো কোনো ডিভাইস নেই',
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
      face: 'মুখোমুখি অনুবাদ', faceSub: 'দুই পক্ষ চেপে কথা বলুন',
      listen: 'শুনে অনুবাদ', listenSub: 'শুনতে থাকুন',
      enter: 'খুলুন'
    },
    deviceMeta: { battery: 'ব্যাটারি {n}%', paper: 'কাগজ {n} / {max}', used: '{n} GB ব্যবহৃত', shots: '{n}টি আইটেম' },
    fanCard: { power: 'পাওয়ার', speedTitle: 'ফ্যান লেভেল', speedPending: 'পাঠানো হচ্ছে…' },
    deviceMetaRec: { battery: '▰ {n}%', storage: '◴ {n}GB ব্যবহৃত' },
    moriCard: { photo: 'ছবি', video: 'ভিডিও', audio: 'অডিও', videoOn: 'ভিডিও রেক', audioOn: 'অডিও রেক' },
    deviceTitle: { printer: 'আমার পকেট প্রিন্টার', recorder: 'আমার রেকর্ডার পাওয়ার ব্যাংক', mori: 'AI Mori' },
    other: {
      watch: 'AI স্পোর্টস ওয়াচ', watchModel: 'Mate Watch S2', watchMeta: 'ব্যাটারি ৭২% · আজ সিঙ্ক হয়েছে',
      buds: 'স্মার্ট ইয়ারবাড', budsModel: 'Mate Buds Pro', budsMeta: 'ব্যাটারি ৬৪% · নয়েজ ক্যান্সেল চালু',
      glass: 'AI চশমা', glassModel: 'Mate Glass', glassMeta: 'শেষ অনলাইন: গতকাল ২১:৩৮',
      notConnected: 'সংযুক্ত নয়'
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
      title: 'পকেট প্রিন্টার',
      online: 'সংযুক্ত',
      ready: 'সংযুক্ত · প্রস্তুত',
      battery: '{n}% ব্যাটারি',
      paperMeter: '{n} / {max} শিট',
      cardMeta: 'ব্যাটারি {n}% · কাগজ {m} / {max} শিট',
      deviceOnline: 'ডিভাইস অনলাইন',

      /* —— ডিভাইস পেজ · তৈরি —— */
      createTitle: 'তৈরি শুরু করুন',
      gallery: 'গ্যালারি থেকে', gallerySub: 'সাম্প্রতিক ছবি দেখুন',
      camera: 'সাথে ছবি', cameraSub: 'শুট বা AR স্ক্যান',
      ar: 'AR ভিডিও প্রিন্ট', arSub: 'ছবিকে নড়াচড়া দিন · প্রায় ২ মিনিট',

      /* —— প্রিন্ট কিউ —— */
      queueTitle: 'প্রিন্ট কিউ',
      queueEmpty: 'এখনো ছবি নেই — পছন্দের একটি বেছে নিন',
      queuePhoto: 'লাইফ ফটো · ৪ × ৬″',
      queueAr: 'AR ভিডিও ফটো · ৪ × ৬″',
      queueStatusIdle: 'উচ্চ · স্বাভাবিক রঙ',
      queueStatusPrinting: 'কাজ পাঠানো হয়েছে · ব্যাকগ্রাউন্ডে প্রিন্ট হচ্ছে',
      queueStatusPrintingAr: 'AR ডেটা বাঁধা হয়েছে · ব্যাকগ্রাউন্ডে প্রিন্ট হচ্ছে',
      queueStatusDone: 'প্রিন্ট সম্পন্ন · ছবি নিয়ে নিন',
      queueStatusDoneAr: 'AR ছবি প্রিন্ট সম্পন্ন · স্ক্যান করতে যান',
      startPrint: 'প্রিন্ট শুরু · {n}',
      removeQueue: 'কিউ থেকে সরান',

      /* —— ডিভাইস ব্যবস্থাপনা —— */
      manageTitle: 'ডিভাইস ব্যবস্থাপনা',
      secInfo: 'ডিভাইস তথ্য',
      deviceName: 'ডিভাইসের নাম', deviceNameSub: 'ট্যাপ করে বদলান',
      firmware: 'ফার্মওয়্যার', firmwareSub: 'নতুন সংস্করণ v2.4.1 পাওয়া গেছে',
      firmwareUpgrade: 'এখনই আপডেট', firmwareUpgrading: 'আপডেট হচ্ছে {n}%', firmwareLatest: 'সর্বশেষ',
      secPrint: 'প্রিন্ট সেটিংস',
      quality: 'প্রিন্ট কোয়ালিটি', qualityStd: 'স্ট্যান্ডার্ড', qualityHD: 'উচ্চ',
      colorMode: 'রঙের মোড', colorNatural: 'স্বাভাবিক', colorVivid: 'উজ্জ্বল', colorRetro: 'রেট্রো',
      secSupplies: 'সরবরাহ',
      paperLeft: 'কাগজ বাকি · {n} / {max} শিট', paperFull: 'ট্রে পূর্ণ', buyPaper: 'কাগজ কিনুন',

      /* —— অ্যালবাম —— */
      albumTitle: 'ছবি নির্বাচন',
      cancel: 'বাতিল',
      albumDay: 'আজ · {n}টি ছবি',
      group: { recent: 'সাম্প্রতিক', favorites: 'প্রিয়', camera: 'ক্যামেরা', travel: 'ভ্রমণ' },
      emptyGroup: 'এই অ্যালবামে কোনো ছবি নেই',
      nextEdit: 'পরবর্তী · ছবি এডিট',
      nextEditAr: 'পরবর্তী · AR ছবি এডিট',

      /* —— এডিটর —— */
      editorTitle: 'ছবি এডিট করুন',
      done: 'সম্পন্ন',
      caption: 'SUMMER · 2026',
      tool: { crop: 'ক্রপ', layout: 'লেআউট', frame: 'ফ্রেম', filter: 'ফিল্টার', adjust: 'সমন্বয়' },
      toolTitle: { crop: 'ক্রপ ও ঘোরান', layout: 'প্রিন্ট লেআউট', frame: 'ফ্রেম', filter: 'ফিল্টার', adjust: 'সমন্বয়' },
      crop: { original: 'মূল', ratio34: 'ফটো', square: 'বর্গাকার' },
      rotate: 'ঘোরান',
      layout: { border: 'বর্ডারসহ', full: 'ফুল ব্লিড', grid2: '২ ছবি', grid4: '৪ ছবি' },
      frame: { none: 'নেই', dot: 'কোরাল প্রান্ত', film: 'ফিল্ম', handwrite: 'হাতের লেখা' },
      filter: { original: 'মূল', sunny: 'রোদেলা', oldfilm: 'পুরনো ফিল্ম', mono: 'সাদাকালো' },
      brightness: 'উজ্জ্বলতা', strength: 'তীব্রতা',

      /* —— AR উইজার্ড —— */
      arTitle: 'AR ভিডিও প্রিন্ট',
      stepKicker: { '1': 'STEP ০১ · ভিডিও', '2': 'STEP ০২ · ছবি', '3': 'STEP ০৩ · প্রিন্ট' },
      step1Title: 'একটি চলমান স্মৃতি বাছুন',
      step1Desc: 'MP4 / MOV সমর্থিত — দুই প্রান্ত টেনে ৫–১৫ সেকেন্ড বাছুন।',
      videoPick: 'ভিডিও বাছুন', videoPickSub: 'MP4 / MOV · ৫–১৫ সেকেন্ড ভালো',
      videoOriginal: 'মূল {n} সেকেন্ড · {size}',
      videoTrimmed: '{n} সেকেন্ডে কাটা হয়েছে',
      videoChange: 'অন্য ভিডিও বাছুন',
      step2Title: 'একটি ছবি বাছুন',
      step2Desc: 'ছবি ও ভিডিও আলাদা করে বাছা হয়; এরপর সম্পূর্ণ এডিটে যাবেন।',
      recentTitle: 'সাম্প্রতিক ছবি', recentPick: '১টি বাছুন',
      bindWaiting: 'ছবির অপেক্ষায়',
      bindDone: 'ছবি ও ভিডিও যুক্ত হয়েছে',
      bindCopy: 'ছবিটি 「{name}」 {n} সেকেন্ডের ভিডিওতে বাঁধা হবে',
      step3Title: 'নিশ্চিত করুন, তারপর বাস্তব হোক',
      step3Desc: 'ছবি প্রিন্ট শেষ হলে AR ভিডিও স্বয়ংক্রিয়ভাবে ছবির সাথে বাঁধা হবে।',
      arBadge: 'AR · {n}s',
      printSummary: 'উচ্চ · ১টি · প্রায় ৪০ সেকেন্ড',
      arCaption: 'ISLAND DAYS · 2026',
      arNextVideo: 'আগে ভিডিও বাছুন',
      arNextPhoto: 'পরবর্তী · ছবি বাছুন',
      arNextNeedPhoto: 'আগে ছবি বাছুন',
      arNextEdit: 'ছবি এডিট করে চালিয়ে যান',
      arConfirm: 'নিশ্চিত করে AR প্রিন্ট শুরু',

      /* —— ক্যামেরা —— */
      cameraTitle: 'সাথে ছবি',
      modePhoto: 'ছবি', modeScan: 'AR স্ক্যান',
      tipPhoto: 'নিচের বাটনে ট্যাপ করে ছবি তুলুন', tipScan: 'প্রিন্ট করা AR ছবিটি ফ্রেমের ভিতরে রাখুন',
      shootPhoto: 'ছবি তুলুন', scanDemo: 'স্ক্যান ডেমো',
      arPlayingTag: '● AR চলছে',

      /* —— প্রিন্ট অগ্রগতি —— */
      printing: 'প্রিন্ট হচ্ছে',
      printingDesc: 'প্রিন্টার কাছেই রাখুন — ছবি ধীরে ধীরে ফুটে উঠছে।',
      stageTransfer: 'প্রিন্ট ডেটা পাঠানো হচ্ছে',
      stageDevelop: 'ছবি ডেভেলপ হচ্ছে',
      stageCut: 'কাটা শেষ হচ্ছে',
      timeLeft: 'প্রায় {n} সেকেন্ড', timeSoon: 'প্রায় শেষ',
      pause: 'বিরতি', resume: 'চালিয়ে যান',
      printDoneTitle: 'প্রিন্ট সম্পন্ন',
      printDoneCopy: 'নতুন ছবি প্রস্তুত — আস্তে তুলে নিন।',
      printDoneCopyAr: 'AR ছবি প্রস্তুত। সাথে ছবি খুলে AR মোডে গিয়ে ভিডিও দেখুন।',
      finish: 'সম্পন্ন', tryAr: 'AR স্ক্যান প্লেব্যাক দেখুন'
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
      printNoPhoto: 'আগে একটি ছবি বাছুন',
      deviceOnline: 'ডিভাইস অনলাইন',
      printQueued: 'প্রিন্ট কিউতে যোগ হয়েছে',
      printRemoved: 'কিউ থেকে সরানো হয়েছে',
      printQueueFull: 'কিউতে সর্বোচ্চ {n}টি',
      printStarted: 'প্রিন্ট শুরু — অন্য কাজ চালিয়ে যেতে পারেন',
      printArStarted: 'AR প্রিন্ট শুরু — অন্য কাজ চালিয়ে যেতে পারেন',
      printDone: 'ছবি প্রিন্ট সম্পন্ন',
      printArDone: 'AR ছবি প্রিন্ট সম্পন্ন',
      printPaused: 'প্রিন্ট বিরতিতে',
      printResumed: 'প্রিন্ট চলছে',
      printCanceled: 'প্রিন্ট কাজ বাতিল',
      printEditReset: 'মূল রূপ ফেরানো হয়েছে',
      printSettingSaved: 'সেটিং সংরক্ষিত',
      printRenamed: 'ডিভাইসের নাম আপডেট হয়েছে',
      printFwDone: 'ফার্মওয়্যার আপডেট সম্পন্ন',
      printShot: 'ছবি তোলা হয়েছে',
      printArLocked: 'AR অ্যাঙ্কর শনাক্ত হয়েছে',
      printVideoPicked: 'ভিডিও বাছা হয়েছে — টেনে কাটুন',
      printVideoPlaying: 'ভিডিও চলছে',
      printVideoPaused: 'ভিডিও থেমে আছে',
      printCropOriginal: 'মূল অনুপাত রাখা হয়েছে',
      printCrop34: '৩:৪ এ ক্রপ করা হয়েছে',
      printCrop11: '১:১ এ ক্রপ করা হয়েছে',
      printRotated: '৯০° ঘোরানো হয়েছে',
      printFullBleed: 'বর্ডারহীন লেআউট প্রয়োগ হয়েছে',
      printGrid2: '২ ছবির মোডে যাওয়া হয়েছে',
      printGrid4: '৪ ছবির মোডে যাওয়া হয়েছে',
      printFrameHand: 'হাতের লেখা ফ্রেম প্রয়োগ হয়েছে',
      paperGuide: 'কাগজ কেনার গাইড খোলা হয়েছে',
      paperFull: 'কাগজ ট্রে পূর্ণ',
      moriPhotoSent: 'ছবি তোলার নির্দেশ পাঠানো হয়েছে',
      moriVideoStart: 'ভিডিও রেকর্ড শুরু, থামাতে আবার চাপুন',
      moriAudioStart: 'অডিও রেকর্ড শুরু, থামাতে আবার চাপুন',
      moriVideoSaved: 'ভিডিও সংরক্ষিত',
      moriAudioSaved: 'অডিও সংরক্ষিত'
    }
  }
}
