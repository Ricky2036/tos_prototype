/**
 * 录音充电宝流程 store（独立于 aiMateStore）
 * ==========================================
 * 权威实现：`~/Downloads/AI Mate归档/ai-mate-recording-powerbank-demo.html`
 * 集成规格：`/tmp/aimate/specs/recorder.md`
 *
 * 设计边界（对照规格 §7）：
 *  - 本 store 只承载「录音充电宝这台设备的能力」：全部录音列表 / 录音详情 /
 *    录音 sheet / 实时转写与翻译 / AI 后处理 / 听译 / 面对面翻译 / 录音同步 /
 *    翻译语言选择。归档里的首页、底部导航、我的页、设备详情外壳一律不进这里。
 *  - **计时器不放在 store 里**：store 只提供「推进一格」的纯 action
 *    （tickRecord / pushLiveLine / pushListenSubtitle / processStep / finishProcessing），
 *    由 `RecorderFlow.vue` 持有 setInterval/setTimeout 并在 onBeforeUnmount 全清。
 *    这样 store 单测可以毫秒级跑完整条时间线，也避免归档「切屏后定时器还在跑、
 *    回来看到两条字幕流」的老问题（规格 §7.4 第 3 条）。
 *  - 界面文案一律通过 key 暴露（组件用 `t()` 渲染）；**内容数据**（会议正文、
 *    实时字幕稿、听译四语语料、Wi-Fi 名称）留在这里。分界理由见交付报告。
 */
import { defineStore } from 'pinia'
import { RECORDER_FLOW } from '../locales/recorder-flow.js'
import { useI18nStore } from './i18nStore.js'

/* ============================================================
 * 内容数据（逐字抄自归档 §2.1 ~ §2.9）
 * ============================================================ */

/** 5 条录音（标题/时间走 i18n key，其余是设备实测值） */
export const RECORDINGS_SEED = [
  { id: 1, titleKey: 'data.rec1.title', timeKey: 'data.rec1.time', duration: '42:18', size: '38.2 MB', status: 'done' },
  { id: 2, titleKey: 'data.rec2.title', timeKey: 'data.rec2.time', duration: '28:46', size: '25.8 MB', status: 'working' },
  { id: 3, titleKey: 'data.rec3.title', timeKey: 'data.rec3.time', duration: '35:12', size: '31.4 MB', status: 'done' },
  { id: 4, titleKey: 'data.rec4.title', timeKey: 'data.rec4.time', duration: '06:28', size: '5.9 MB', status: 'pending' },
  { id: 5, titleKey: 'data.rec5.title', timeKey: 'data.rec5.time', duration: '51:06', size: '45.7 MB', status: 'pending' }
]

/** 转写正文的时间轴/说话人（正文走 `data.transcript{n}` key） */
export const FULL_TRANSCRIPT = [
  { speaker: '林悦', time: '00:18' },
  { speaker: '陈朔', time: '00:42' },
  { speaker: '周宁', time: '01:48' },
  { speaker: '林悦', time: '03:26' },
  { speaker: '陈朔', time: '05:12' },
  { speaker: '周宁', time: '07:35' },
  { speaker: '林悦', time: '10:08' },
  { speaker: '陈朔', time: '12:44' },
  { speaker: '周宁', time: '15:20' },
  { speaker: '林悦', time: '18:06' },
  { speaker: '陈朔', time: '21:46' },
  { speaker: '周宁', time: '25:13' },
  { speaker: '林悦', time: '28:50' },
  { speaker: '陈朔', time: '32:18' },
  { speaker: '周宁', time: '34:42' }
]

/** 音频标记（全角空格由 `detail.markLine` 提供） */
export const AUDIO_MARKERS = [
  { at: '09:18', text: '确认 Q3 核心目标' },
  { at: '21:46', text: '讨论设备拾音优化' }
]

/** 实时字幕稿：三条流程共用（录音面板 / AI 处理浮层） */
export const LIVE_SEGMENTS = [
  { time: '00:03', source: '大家好，我们先同步今天需要确认的三个核心问题。', translation: 'Hello everyone. Let us align on the three key issues for today.' },
  { time: '00:11', source: '第一项是新版的上线节奏，以及每一个模块的负责人。', translation: 'The first is the release schedule and the owner of each module.' },
  { time: '00:20', source: '用户最关注多人会议中的识别准确率和发言人区分。', translation: 'Users care most about accuracy and speaker identification in group meetings.' },
  { time: '00:31', source: '设备端会在下周三之前完成会议拾音参数测试。', translation: 'The device team will finish meeting pickup tests by next Wednesday.' }
]

/** 归档只给了 日本語 / 한국어 两份译文语料（没有英文语料，英文走 segment.translation） */
export const LIVE_TRANSLATIONS = {
  日本語: [
    '皆さん、こんにちは。今日確認すべき三つのポイントを共有します。',
    '一つ目は新バージョンの公開スケジュールと各担当者です。',
    'ユーザーは会議での認識精度と話者識別を重視しています。',
    'デバイス側のテストは来週水曜日までに完了します。'
  ],
  한국어: [
    '안녕하세요. 오늘 확인할 세 가지 핵심 사항을 공유하겠습니다.',
    '첫 번째는 새 버전 일정과 각 모듈 담당자입니다.',
    '사용자는 회의 인식 정확도와 화자 구분을 가장 중요하게 생각합니다.',
    '기기 테스트는 다음 주 수요일까지 완료됩니다.'
  ]
}

/** 听译语料：4 语 × 4 句（源/目标按「条号相同」硬配对，归档行为） */
export const LISTEN_CORPUS = {
  en: ['Good morning, everyone. Let us get started.', 'Today we need to confirm the launch timeline.', 'The device tests will be completed next Wednesday.', 'I will send the updated plan after this meeting.'],
  zh: ['大家早上好，我们现在开始。', '今天需要确认产品上线时间。', '设备测试将在下周三完成。', '会后我会发送更新后的计划。'],
  ja: ['皆さん、おはようございます。始めましょう。', '今日は公開スケジュールを確認します。', 'デバイスのテストは来週水曜日に完了します。', '会議後に更新した計画を送ります。'],
  ko: ['여러분, 좋은 아침입니다. 시작하겠습니다.', '오늘 출시 일정을 확인해야 합니다.', '기기 테스트는 다음 주 수요일에 완료됩니다.', '회의 후 업데이트된 계획을 보내겠습니다.']
}

/** 语言名是固定语言自称，不随 App 语言变化 */
export const LANGUAGE_NAMES = { en: 'English', zh: '中文', ja: '日本語', ko: '한국어' }
export const LISTEN_SOURCES = ['en', 'ja', 'ko', 'zh']
export const LISTEN_TARGETS = ['zh', 'en', 'ja', 'ko']

/** 翻译目标选项（归档 `[data-translate-to]` 四个） */
export const TRANSLATE_TARGETS = [
  { id: 'English', glyph: 'EN', nameKey: 'translate.en', subKey: 'translate.enSub' },
  { id: '日本語', glyph: '日', nameKey: 'translate.ja', subKey: 'translate.jaSub' },
  { id: '한국어', glyph: '한', nameKey: 'translate.ko', subKey: 'translate.koSub' },
  { id: '更多语言', glyph: '＋', nameKey: 'translate.more', subKey: 'translate.moreSub' }
]

/** Wi-Fi 扫描结果（归档硬编码 3 条，第 1 条信号极佳） */
export const WIFI_NETWORKS = [
  { ssid: 'Office_5G', excellent: true },
  { ssid: 'LinkHome', excellent: false },
  { ssid: 'Guest_WiFi', excellent: false }
]

/** 5 处计时器的节拍（归档 §5.12），组件按这些值排 setTimeout/setInterval */
export const TICK = { record: 1000, liveAi: 1450, listen: 1700, processStart: 700, processGap: 1050, processTail: 700, wifiScan: 900, sendPassword: 1200, faceRecognition: 2200, toast: 2100 }

/* ============================================================
 * 工具
 * ============================================================ */

/** `mm:ss`（归档 formatTime） */
export function formatTime(s) {
  const v = Math.max(0, Math.floor(Number(s) || 0))
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`
}

/** 波形条：`height = 7 + (i*7)%17`（归档 makeWave） */
export function makeWave(n = 7) {
  return Array.from({ length: n }, (_, i) => `${7 + (i * 7) % 17}px`)
}

/** `{x}` 占位符替换（本仓 i18n 没有插值机制） */
export function fill(str, params) {
  if (!params) return str
  let out = String(str)
  for (const k of Object.keys(params)) out = out.split(`{${k}}`).join(String(params[k]))
  return out
}

/**
 * 取译文（**修正归档的 bug**）：归档 `runProcessing` 的翻译模式无论选什么语言
 * 都输出 `segment.translation`（英文对照），目标语言只改了一行 kicker。
 * 这里改成按目标语言取：
 *   - 日本語 / 한국어 → `LIVE_TRANSLATIONS[target][i]`（归档真实语料）
 *   - English        → `LIVE_SEGMENTS[i].translation`（归档里这个字段就是英文译文，属真实数据）
 *   - 其它（更多语言）→ null，**不伪造**，由组件显示「暂无该语言译文」提示
 */
export function translationFor(index, target) {
  if (target === 'English') return LIVE_SEGMENTS[index]?.translation || null
  const table = LIVE_TRANSLATIONS[target]
  return table && table[index] ? table[index] : null
}

/** 该目标语言有没有归档语料（组件据此决定是否显示「暂无译文」提示） */
export function hasTranslationData(target) {
  return target === 'English' || Boolean(LIVE_TRANSLATIONS[target])
}

/** 说话人轮转：偶数条林悦、奇数条陈朔（归档 `index%2?'陈朔':'林悦'`） */
export const speakerOf = (index) => (index % 2 ? '陈朔' : '林悦')

/** 列表行：把 i18n key 解析成当前语言的文案 */
function resolveRow(tx, r) {
  return {
    id: r.id,
    status: r.status,
    duration: r.duration,
    size: r.size,
    title: r.titleKey ? tx(r.titleKey) : r.title,
    time: r.timeKey ? tx(r.timeKey) : r.time
  }
}

const PROCESS_INIT = () => ({ open: false, runId: 0, mode: null, target: '', progress: 6, segments: [], done: false, fileId: null })
const LISTEN_INIT = () => ({ open: false, on: false, source: 'en', target: 'zh', index: 0, tick: 0, subtitles: [] })
const FACE_INIT = () => ({ open: false, talking: null, cnKey: 'face.cnIdle', enKey: 'face.enIdle', cnLabelKey: 'face.cnStart', enLabelKey: 'face.enStart' })
const SYNC_INIT = () => ({ open: false, tab: 'wifi', scanning: false, scanned: false, ssid: '', password: '', sending: false, wifiDone: false, btDone: false })

/* ============================================================
 * store
 * ============================================================ */
export const useRecorderFlowStore = defineStore('recorderFlow', {
  state: () => ({
    /** 流程是否打开（组件由 AimateApp 的 mate.deviceFlow 控制，这里只记状态）。
     *  ⚠️ 不能叫 open：Pinia 里 state 的 open 会和 action open() 撞名，
     *  `this.open = true` 会把 action 覆盖成布尔值，重进流程时 store.open() 就变成 not a function。 */
    active: false,
    /** 当前屏：files 全部录音 / detail 录音详情 */
    screen: 'files',
    /** 设备里的录音（新建录音会 unshift） */
    recordings: RECORDINGS_SEED.map((r) => ({ ...r })),
    /** 搜索词（按标题，不区分大小写） */
    query: '',
    /** 批量管理 */
    managing: false,
    selected: [],
    /** 详情页当前文件与 tab / 播放态 */
    detailId: 1,
    tab: 'audio',
    playing: false,

    // —— 录音 sheet ——
    recordSheet: false,
    recording: false,
    recordPaused: false,
    recordSeconds: 0,
    recordFinished: false,
    liveAiMode: null,
    liveAiTarget: 'English',
    liveAiRun: 0,
    liveAiIndex: 0,
    liveLines: [],

    // —— 翻译语言选择 sheet（叠在录音 sheet 之上）——
    translateSheet: false,

    // —— AI 处理浮层（转写 / 翻译）——
    process: PROCESS_INIT(),

    // —— 听译浮层 ——
    listen: LISTEN_INIT(),

    // —— 面对面翻译浮层 ——
    face: FACE_INIT(),

    // —— 录音同步浮层 + 回写到「设备管理 · 录音同步」行的摘要 ——
    sync: SYNC_INIT(),
    syncSummary: null,

    /** 当前 toast：{ key, params, seq } */
    toast: null,

    /** 拾音模式是设备级设置，与设备控制页共用 aiMateStore 的 pickupMode，
     *  这里不重复持有；仅暴露入口（见交付报告） */
    deviceName: '我的录音充电宝'
  }),

  getters: {
    /** 当前 App 语言（读 i18n store，随语言切换响应） */
    locale: () => useI18nStore().locale,
    /** 词条取值 + 占位符替换 */
    tx() {
      const loc = this.locale
      return (key, params) => fill(RECORDER_FLOW[loc]?.[key] ?? RECORDER_FLOW.zh?.[key] ?? key, params)
    },
    /** 全部录音行（已按搜索词过滤，时间倒序 = 归档的数组顺序） */
    fileList() {
      const rows = this.recordings.map((r) => resolveRow(this.tx, r))
      const q = this.query.trim().toLowerCase()
      return q ? rows.filter((r) => r.title.toLowerCase().includes(q)) : rows
    },
    fileCount() {
      return this.fileList.length
    },
    recordingCount() {
      return this.recordings.length
    },
    selectedCount() {
      return this.selected.length
    },
    /** 最近录音（归档 renderRecents 取前 3） */
    recentList() {
      return this.fileList.slice(0, 3)
    },
    detailFile() {
      return this.recordings.find((r) => r.id === this.detailId) || null
    },
    detailRow() {
      const f = this.detailFile || this.recordings[0]
      return f ? resolveRow(this.tx, f) : null
    },
    detailMeta() {
      const r = this.detailRow
      return r ? this.tx('detail.meta', { time: r.time, duration: r.duration, size: r.size }) : ''
    },
    /** 转写 15 条（正文按当前语言取） */
    transcript() {
      return FULL_TRANSCRIPT.map((l, i) => ({ speaker: l.speaker, time: l.time, text: this.tx(`data.transcript${i + 1}`) }))
    },
    markers() {
      return AUDIO_MARKERS
    },

    /* ---- 录音 sheet ---- */
    recordTimerText() {
      return formatTime(this.recordSeconds)
    },
    recordHintKey() {
      if (this.recording) {
        if (this.liveAiMode === 'translate') return 'record.liveTranslateHint'
        if (this.liveAiMode === 'transcribe') return 'record.liveTranscribeHint'
        return 'record.savingHint'
      }
      if (this.recordPaused) return 'record.paused'
      if (this.recordFinished) return this.liveAiMode ? 'record.savedWithText' : 'record.saved'
      return 'record.savingHint'
    },
    recordToggleKey() {
      return this.recording ? 'record.pause' : 'record.resume'
    },
    liveTitle() {
      if (this.liveAiMode !== 'translate') return this.tx('record.liveTranscribeTitle')
      return this.tx('record.liveTranslateTitle', { target: this.liveAiTarget })
    },
    /** 选的目标语言没有语料（更多语言）时才提示，不伪造译文 */
    liveNoTranslation() {
      return this.liveAiMode === 'translate' && !hasTranslationData(this.liveAiTarget)
    },

    /* ---- AI 处理 ---- */
    processHeaderKey() {
      return this.process.mode === 'translate' ? 'process.header.translate' : 'process.header.transcribe'
    },
    processKicker() {
      return this.process.mode === 'translate'
        ? this.tx('process.kickerTranslate', { target: this.process.target })
        : this.tx('process.kickerPost')
    },
    processTitleKey() {
      if (this.process.done) return this.process.mode === 'translate' ? 'process.titleTranslated' : 'process.titleTranscribed'
      return this.process.mode === 'translate' ? 'process.titleTranslating' : 'process.titleTranscribing'
    },
    processDescKey() {
      return this.process.mode === 'translate' ? 'process.descTranslate' : 'process.descTranscribe'
    },
    processLiveTitleKey() {
      return this.process.mode === 'translate' ? 'process.liveTranslate' : 'process.liveTranscribe'
    },
    processStateKey() {
      return this.process.done ? 'process.stateDone' : 'process.state'
    },
    processNoTranslation() {
      return this.process.mode === 'translate' && !hasTranslationData(this.process.target)
    },

    /* ---- 听译 ---- */
    listenStatusKey() {
      return this.listen.on ? 'listen.live' : 'listen.paused'
    },
    listenButtonKey() {
      return this.listen.on ? 'listen.pause' : 'listen.resume'
    },
    listenSubtitleTitle() {
      return this.tx('listen.subtitleTitle', { source: LANGUAGE_NAMES[this.listen.source], target: LANGUAGE_NAMES[this.listen.target] })
    },
    listenLangOptions() {
      const pick = (codes) => codes.map((c) => ({ value: c, label: LANGUAGE_NAMES[c] }))
      return { sources: pick(LISTEN_SOURCES), targets: pick(LISTEN_TARGETS) }
    },

    /* ---- 面对面翻译 ---- */
    faceCnText() {
      return this.tx(this.face.cnKey)
    },
    faceEnText() {
      return this.tx(this.face.enKey)
    },
    faceCnLabel() {
      return this.tx(this.face.cnLabelKey)
    },
    faceEnLabel() {
      return this.tx(this.face.enLabelKey)
    },

    /* ---- 同步 ---- */
    networkList() {
      // 归档：#networkList 首次扫描前是空的，扫描完成后才渲染；重新扫描期间旧列表保留
      return this.sync.scanned ? WIFI_NETWORKS : []
    },
    /** 「设备管理 · 录音同步」行右侧的摘要（默认未配置） */
    syncSummaryText() {
      if (!this.syncSummary) return this.tx('device.manageSyncNone')
      return this.tx(this.syncSummary.textKey, this.syncSummary.params)
    },
    syncSummaryBadge() {
      return this.syncSummary ? this.tx(this.syncSummary.badgeKey) : this.tx('device.manageSyncGo')
    },
    syncConfigured() {
      return Boolean(this.syncSummary)
    },
    /** 跨屏耦合：设备首页设备卡的红灯订阅这个（组件已暴露，宿主未接线，见报告） */
    isRecording() {
      return this.recording
    },
    /** toast 文案（组件直接渲染） */
    toastText() {
      return this.toast ? this.tx(this.toast.key, this.toast.params) : ''
    }
  },

  actions: {
    notify(key, params = null) {
      this.toast = { key, params, seq: (this.toast?.seq || 0) + 1 }
      return true
    },
    clearToast() {
      this.toast = null
    },

    /* ---------------- 流程开关 ---------------- */
    /** 进流程：一律回到「全部录音」首屏并复位所有浮层（归档关闭后重进会残留状态） */
    open() {
      this.reset()
      this.active = true
      return true
    },
    close() {
      this.active = false
      this.reset()
      return true
    },
    /** 复位所有瞬态；录音资产（recordings）保留 */
    reset() {
      this.screen = 'files'
      this.query = ''
      this.managing = false
      this.selected = []
      this.detailId = this.recordings[0]?.id || 1
      this.tab = 'audio'
      this.playing = false
      this.recordSheet = false
      this.recording = false
      this.recordPaused = false
      this.recordSeconds = 0
      this.recordFinished = false
      this.liveAiMode = null
      this.liveAiTarget = 'English'
      this.liveAiRun = 0
      this.liveAiIndex = 0
      this.liveLines = []
      this.translateSheet = false
      this.process = PROCESS_INIT()
      this.listen = LISTEN_INIT()
      this.face = FACE_INIT()
      this.sync = SYNC_INIT()
      this.toast = null
      return true
    },

    setScreen(name) {
      if (!['files', 'detail'].includes(name)) return false
      if (name !== 'files') this.managing = false
      this.screen = name
      return true
    },

    /* ---------------- 全部录音 ---------------- */
    setQuery(q) {
      this.query = String(q ?? '')
      return true
    },
    toggleManage() {
      this.managing = !this.managing
      this.selected = []
      return this.managing
    },
    toggleSelect(id) {
      const i = this.selected.indexOf(id)
      if (i < 0) this.selected.push(id)
      else this.selected.splice(i, 1)
      return this.selected.includes(id)
    },
    isSelected(id) {
      return this.selected.includes(id)
    },
    /** 点列表行：批量管理态下是勾选，否则进详情（归档 bindFiles） */
    openFile(id) {
      if (this.managing) return this.toggleSelect(id)
      return this.openDetail(id)
    },
    openDetail(id) {
      const hit = this.recordings.find((r) => r.id === id)
      if (!hit) return false
      this.detailId = id
      this.tab = 'audio'
      this.playing = false
      this.screen = 'detail'
      return true
    },
    backToFiles() {
      this.managing = false
      this.playing = false
      this.screen = 'files'
      return true
    },
    setTab(t) {
      if (!['audio', 'transcript', 'summary'].includes(t)) return false
      this.tab = t
      return true
    },
    togglePlay() {
      this.playing = !this.playing
      return this.playing
    },

    /* ---------------- 录音 sheet ---------------- */
    openRecordSheet() {
      this.recordSheet = true
      this.translateSheet = false
      if (this.recordFinished) this.resetRecordRound()
      if (!this.recording && !this.recordPaused) this.recording = true
      return true
    },
    closeRecordSheet() {
      // 归档：关浮层不停表（录音在后台继续），红灯由设备页订阅
      this.recordSheet = false
      return true
    },
    resetRecordRound() {
      this.recordFinished = false
      this.recordSeconds = 0
      this.recordPaused = false
      this.liveAiMode = null
      this.liveAiIndex = 0
      this.liveLines = []
      return true
    },
    /** 暂停 / 继续（归档 #recordToggle） */
    toggleRecord() {
      if (this.recordFinished) {
        this.recordFinished = false
        this.recordSeconds = 0
        this.recordPaused = false
      }
      this.recording = !this.recording
      this.recordPaused = !this.recording
      return this.recording
    },
    /** 1s 一跳（组件持有 interval） */
    tickRecord() {
      if (this.recording) this.recordSeconds += 1
      return this.recordSeconds
    },
    /**
     * 完成（归档 #recordFinish）：先停表，停实时 AI，recordSeconds===0 时守住；
     * 造一条新录音 unshift（title 已存在则不插），status 取决于有没有开实时 AI。
     */
    stopRecord(labels = {}) {
      const hadLive = Boolean(this.liveAiMode)
      if (this.recording) {
        this.recording = false
        this.recordPaused = false
      }
      if (this.recordSeconds === 0) {
        this.notify('record.notStarted')
        return false
      }
      this.recordFinished = true
      const fresh = {
        id: labels.id ?? Date.now(),
        title: labels.title ?? '新录音',
        time: labels.time ?? '刚刚',
        duration: formatTime(this.recordSeconds),
        size: '1.2 MB',
        status: hadLive ? 'done' : 'pending'
      }
      if (!this.recordings.some((r) => r.title === fresh.title)) this.recordings.unshift(fresh)
      this.notify('record.savedToDevice')
      return true
    },
    /** 边录边转写 / 边录边翻译（归档 startRecordLiveAI） */
    startLiveAi(mode = 'transcribe', target = 'English') {
      if (!['transcribe', 'translate'].includes(mode)) return false
      this.liveAiMode = mode
      this.liveAiTarget = mode === 'translate' ? target : 'English'
      this.liveAiIndex = 0
      this.liveLines = []
      this.liveAiRun += 1
      this.pushLiveLine()
      return true
    },
    /** 追加一条实时字幕（1450ms 一跳；归档 addRecordLiveLine） */
    pushLiveLine() {
      if (!this.recording || !this.liveAiMode) return false
      if (this.liveAiIndex >= LIVE_SEGMENTS.length) this.liveAiIndex = 0
      const index = this.liveAiIndex
      this.liveAiIndex += 1
      const seg = LIVE_SEGMENTS[index]
      const time = formatTime(this.recordSeconds)
      const speaker = speakerOf(index)
      this.liveLines.push({
        time,
        speaker,
        label: this.tx('record.lineSpeaker', { time, speaker }),
        source: seg.source,
        translation: this.liveAiMode === 'translate' ? translationFor(index, this.liveAiTarget) : null
      })
      return true
    },
    /** 事后动作「实时转写」（归档 #transcribeAction） */
    runTranscribeAction() {
      if (this.recording) return this.startLiveAi('transcribe')
      if (this.recordFinished) {
        const newest = this.recordings[0]
        this.recordSheet = false
        return this.startTranscription(newest?.id)
      }
      this.notify('record.notStartedAction')
      return false
    },
    /** 事后动作「实时翻译」→ 打开语言选择 sheet（归档 #translateAction） */
    openTranslateSheet() {
      if (!this.recording && !this.recordFinished) {
        this.notify('record.notStartedAction')
        return false
      }
      this.translateSheet = true
      return true
    },
    closeTranslateSheet() {
      this.translateSheet = false
      return true
    },
    /** 选目标语言（归档 [data-translate-to]）：录音中→切实时翻译；已完成→跑 AI 翻译 */
    chooseTranslateTarget(target) {
      if (!TRANSLATE_TARGETS.some((o) => o.id === target)) return false
      this.translateSheet = false
      if (this.recording) return this.startLiveAi('translate', target)
      this.recordSheet = false
      const newest = this.recordings[0]
      return this.startProcessing('translate', target, newest?.id)
    },

    /* ---------------- AI 处理（归档 runProcessing） ---------------- */
    /** 详情页 pending 文件点「开始转写」 */
    startTranscription(fileId) {
      const f = this.recordings.find((r) => r.id === fileId) || this.recordings[0]
      if (!f) return false
      return this.startProcessing('transcribe', '', f.id)
    },
    startProcessing(mode = 'transcribe', target = '', fileId = null) {
      if (!['transcribe', 'translate'].includes(mode)) return false
      const f = this.recordings.find((r) => r.id === fileId) || this.recordings[0]
      if (!f) return false
      f.status = 'working'
      this.process = {
        open: true,
        runId: this.process.runId + 1,
        mode,
        target: mode === 'translate' ? target : '',
        progress: 6,
        segments: [],
        done: false,
        fileId: f.id
      }
      return true
    },
    /** 第 i 条实时文本（组件在 700 + i*1050ms 调；归档同款时间线） */
    processStep(index) {
      const p = this.process
      if (!p.runId || p.done) return false
      const seg = LIVE_SEGMENTS[index]
      if (!seg) return false
      const speaker = speakerOf(index)
      p.segments.push({
        time: seg.time,
        speaker,
        label: this.tx('record.lineSpeaker', { time: seg.time, speaker }),
        source: seg.source,
        translation: p.mode === 'translate' ? translationFor(index, p.target) : null,
        caret: index === LIVE_SEGMENTS.length - 1
      })
      p.progress = 22 + index * 24
      return true
    },
    /** 收尾（归档 i===3 之后 +700ms）：文件转 done、进度 100、出现「查看完整结果」 */
    finishProcessing() {
      const p = this.process
      if (!p.runId || p.done) return false
      const f = this.recordings.find((r) => r.id === p.fileId)
      if (f) f.status = 'done'
      p.done = true
      p.progress = 100
      return true
    },
    closeProcess() {
      // 关掉浮层不取消处理（归档一致）：后台继续跑到 done，列表/详情跟着刷
      this.process.open = false
      return true
    },
    /** 「查看完整结果」→ 落到该文件的详情屏 */
    openProcessResult() {
      const id = this.process.fileId
      this.process.open = false
      if (!id) return false
      return this.openDetail(id)
    },

    /* ---------------- 听译（归档 startListening / applyListenLanguages） ---------------- */
    openListen() {
      this.listen.open = true
      this.startListen()
      return true
    },
    closeListen() {
      // 归档：关浮层必调 stopListening()
      this.listen.open = false
      this.stopListen()
      return true
    },
    startListen() {
      if (this.listen.on) return false
      const s = this.listen
      s.on = true
      if (s.index === 0 || s.index >= LISTEN_CORPUS[s.source].length) {
        s.index = 0
        s.subtitles = []
      }
      s.tick += 1
      this.pushListenSubtitle()
      return true
    },
    stopListen() {
      this.listen.on = false
      this.listen.tick += 1
      return true
    },
    toggleListen() {
      return this.listen.on ? this.stopListen() : this.startListen()
    },
    /** 换语言 / swap 都要复位字幕并让字幕条闪一下（归档 applyListenLanguages） */
    applyListenLanguages() {
      const s = this.listen
      if (s.source === s.target) s.target = s.source === 'zh' ? 'en' : 'zh'
      s.index = 0
      s.subtitles = []
      s.tick += 1
      if (s.on) this.pushListenSubtitle()
      return true
    },
    setListenSource(lang) {
      if (!LANGUAGE_NAMES[lang]) return false
      this.listen.source = lang
      return this.applyListenLanguages()
    },
    setListenTarget(lang) {
      if (!LANGUAGE_NAMES[lang]) return false
      this.listen.target = lang
      return this.applyListenLanguages()
    },
    swapListen() {
      const { source, target } = this.listen
      this.listen.source = target
      this.listen.target = source
      return this.applyListenLanguages()
    },
    /** 追加一条字幕（1700ms 一跳；归档 addListenSubtitle） */
    pushListenSubtitle() {
      const s = this.listen
      const corpus = LISTEN_CORPUS[s.source]
      if (!corpus) return false
      if (s.index >= corpus.length) s.index = 0
      const index = s.index
      s.index += 1
      const time = formatTime(s.index * 4)
      s.subtitles.push({
        lang: s.source,
        time,
        label: this.tx('listen.lineLabel', { lang: LANGUAGE_NAMES[s.source], time }),
        source: corpus[index],
        target: LISTEN_CORPUS[s.target][index],
        caret: s.index < corpus.length
      })
      return true
    },

    /* ---------------- 面对面翻译（归档 [data-talk]） ---------------- */
    openFace() {
      this.face = FACE_INIT()
      this.face.open = true
      return true
    },
    closeFace() {
      this.face.open = false
      this.face.talking = null
      return true
    },
    /** 返回 'start' 时组件起 2200ms 的假识别定时器，'cancel' / false 时不起 */
    toggleTalk(lang) {
      if (!['cn', 'en'].includes(lang)) return false
      const f = this.face
      if (f.talking === lang) {
        f.talking = null
        if (lang === 'cn') f.cnLabelKey = 'face.cnStart'
        else f.enLabelKey = 'face.enStart'
        return 'cancel'
      }
      f.talking = lang
      if (lang === 'cn') {
        f.cnLabelKey = 'face.cnStop'
        f.cnKey = 'face.listeningCn'
      } else {
        f.enLabelKey = 'face.enStop'
        f.enKey = 'face.listeningEn'
      }
      return 'start'
    },
    /** 2200ms 后的假识别结果（归档 setTimeout 里的 talking 守卫） */
    resolveTalk(lang) {
      const f = this.face
      if (f.talking !== lang) return false
      f.talking = null
      if (lang === 'cn') {
        f.cnKey = 'face.cnSaid1'
        f.enKey = 'face.enSaid1'
        f.cnLabelKey = 'face.cnAgain'
      } else {
        f.enKey = 'face.enSaid2'
        f.cnKey = 'face.cnSaid2'
        f.enLabelKey = 'face.enAgain'
      }
      return true
    },
    /** 中途取消（关浮层）：认领掉这次假识别 */
    cancelTalk() {
      if (!this.face.talking) return false
      const lang = this.face.talking
      this.face.talking = null
      if (lang === 'cn') this.face.cnLabelKey = 'face.cnStart'
      else this.face.enLabelKey = 'face.enStart'
      return true
    },

    /* ---------------- 录音同步（归档 scanWifi / sendPassword / bluetoothSync） ---------------- */
    openSync() {
      this.sync.open = true
      return true
    },
    closeSync() {
      this.sync.open = false
      this.sync.scanning = false
      this.sync.sending = false
      return true
    },
    setSyncTab(tab) {
      if (!['wifi', 'bluetooth'].includes(tab)) return false
      this.sync.tab = tab
      return true
    },
    /** 组件 900ms 后调 finishScanWifi */
    scanWifi() {
      this.sync.scanning = true
      return true
    },
    finishScanWifi() {
      this.sync.scanning = false
      this.sync.scanned = true
      return true
    },
    chooseNetwork(ssid) {
      if (!WIFI_NETWORKS.some((n) => n.ssid === ssid)) return false
      this.sync.ssid = ssid
      this.sync.password = ''
      return true
    },
    setPassword(v) {
      this.sync.password = String(v ?? '')
      return true
    },
    /** 组件 1200ms 后调 finishSendPassword；密码不足 4 位按归档守卫拦下 */
    sendPassword() {
      if (this.sync.password.length < 4) {
        this.notify('sync.needPassword')
        return false
      }
      this.sync.sending = true
      return true
    },
    finishSendPassword() {
      this.sync.sending = false
      this.sync.wifiDone = true
      // 归档这里硬写了 Office_5G；改成回写真实选中的 ssid
      this.syncSummary = { textKey: 'sync.summaryWifi', params: { ssid: this.sync.ssid }, badgeKey: 'sync.badgeOn' }
      this.notify('sync.toastWifi')
      return true
    },
    enableBluetoothSync() {
      if (this.sync.btDone) return false
      this.sync.btDone = true
      this.syncSummary = { textKey: 'sync.summaryBt', params: null, badgeKey: 'sync.badgeOn' }
      this.notify('sync.toastBt')
      return true
    },

    /* ---------------- 归档设备详情页里属于录音能力的设置行 ---------------- */
    toastNoiseCancel() {
      return this.notify('toast.noiseCancel')
    },
    toastAudioParams() {
      return this.notify('toast.audioParams')
    },
    toastExport() {
      return this.notify('toast.export')
    },
    toastAddMark() {
      return this.notify('toast.addMark')
    },
    toastSortDesc() {
      return this.notify('toast.sortDesc')
    },
    toastQueued() {
      return this.notify('toast.queued')
    },
    toastDemoDelete() {
      return this.notify('toast.demoNoDelete')
    }
  }
})
