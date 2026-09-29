<script setup>
/**
 * 录音充电宝流程（归档 `ai-mate-recording-powerbank-demo.html` 的语义重放）
 * ==================================================================
 * 权威实现：`~/Downloads/AI Mate归档/ai-mate-recording-powerbank-demo.html`
 * 集成规格：`/tmp/aimate/specs/recorder.md`
 * 形态对齐：本仓 `PrinterFlow.vue`（全屏流程层 + `emit('close')` 关闭）
 *
 * 归档是一个自带底部导航 / 首页 / 我的页 / 设备详情页的**完整 App**，
 * 那些外壳本仓已经有了，这里只承载「录音充电宝这台设备」的能力：
 *   · 首屏 = 全部录音列表（搜索 / 时间倒序 / 批量管理 / 5 条录音）
 *   · 录音详情（播放条 + 假波形 + 音频 / 转写 / AI 纪要三 tab）
 *   · 六个浮层（录音 / 面对面翻译 / 听译 / AI 处理 / 录音同步 / 翻译语言选择）
 *   · 归档设备详情页里**属于录音能力**的入口（录音参数、降噪档位、同步）也收进来
 *
 * 🔴 本仓两个专属坑（照着归档抄会静默失效）：
 *   1. `home-indicator` z-index 96 凌驾应用窗口之上 ⇒ 所有贴底元素用
 *      `padding-bottom: calc(Npx + var(--home-indicator-zone, 34px))` 让位
 *      （归档用的 `env(safe-area-inset-bottom)` 在本仓恒为 0）
 *   2. 顶部 64px 是边缘手势热区（`.edge-zone` z 85）⇒ 头部高度必须 ≥
 *      `calc(var(--safe-top, 44px) + 52px)`，全屏浮层头部也要落在 64px 之下
 *
 * ⏱ 归档有 5 处计时器且 Demo 不做统一清理，这里全部由本组件持有，
 *    `onBeforeUnmount` 一次清光（否则关了流程再进来会看到两条字幕流）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18nStore } from '../../../stores/i18nStore'
import { RECORDER_FLOW } from '../../../locales/recorder-flow'
import { useAiMateStore, PICKUP_MODES } from '../../../stores/aiMateStore'
import { useRecorderFlowStore, TRANSLATE_TARGETS, TICK, makeWave } from '../../../stores/recorderFlowStore'
import LIcon from '../../ui/LIcon.vue'

const emit = defineEmits(['close'])
const i18n = useI18nStore()
const mate = useAiMateStore()
const store = useRecorderFlowStore()
const am = (p) => i18n.am(p)

/** ⚠️ 本仓 i18n 没有插值机制；`{n}` 占位符在调用点自行替换 */
const t = (k) => RECORDER_FLOW[i18n.locale]?.[k] ?? RECORDER_FLOW.zh[k] ?? k

/* 波形：条数与高度逐条照抄归档 §4.9 */
const WAVE8 = makeWave(8)
const WAVE17 = makeWave(17)
const WAVE52 = makeWave(52)
const DETAIL_TABS = ['audio', 'transcript', 'summary']
const LIVE_TEXT_MAX = 128

const liveTextEl = ref(null)
const procTextEl = ref(null)
const listenSubsEl = ref(null)
/** 字幕条换语言时闪一下（归档 `.language-change`），靠 key 重建元素重放动画 */
const listenBarKey = computed(() => `${store.listen.source}-${store.listen.target}`)

/* ============================================================
 * 计时器：5 处 + 3 个一次性，全部在这里持有 / 清理
 * ============================================================ */
let recordTimer = null
let liveAiTimer = null
let listenTimer = null
let processTimers = []
let wifiScanTimer = null
let sendPwdTimer = null
let faceTimer = null
let toastTimer = null

function clearAllTimers() {
  clearInterval(recordTimer); recordTimer = null
  clearInterval(liveAiTimer); liveAiTimer = null
  clearInterval(listenTimer); listenTimer = null
  processTimers.forEach(clearTimeout); processTimers = []
  clearTimeout(wifiScanTimer); wifiScanTimer = null
  clearTimeout(sendPwdTimer); sendPwdTimer = null
  clearTimeout(faceTimer); faceTimer = null
  clearTimeout(toastTimer); toastTimer = null
}

onMounted(() => {
  // 进流程一律复位（归档重进会残留上一轮状态）
  store.open()
})

onBeforeUnmount(() => {
  clearAllTimers()
  store.close()
})

/* 录音计时：1s 一跳 */
watch(() => store.recording, (on) => {
  clearInterval(recordTimer)
  recordTimer = null
  if (on) recordTimer = setInterval(() => store.tickRecord(), TICK.record)
})

/* 实时转写 / 实时翻译：1450ms 一条；startLiveAi 自己会先补一条 */
watch(() => [store.liveAiMode, store.liveAiRun], ([mode]) => {
  clearInterval(liveAiTimer)
  liveAiTimer = null
  if (mode) liveAiTimer = setInterval(() => store.pushLiveLine(), TICK.liveAi)
})

/* 听译：1700ms 一条；换语言 / swap 时 tick 变化 → 重启节拍（归档 applyListenLanguages） */
watch(() => [store.listen.on, store.listen.tick], ([on]) => {
  clearInterval(listenTimer)
  listenTimer = null
  if (on) listenTimer = setInterval(() => store.pushListenSubtitle(), TICK.listen)
})

/* AI 处理：归档时间线 700 / 1750 / 2800 / 3850ms 各一条，+700ms 收尾（≈4550ms） */
watch(() => store.process.runId, (runId) => {
  processTimers.forEach(clearTimeout)
  processTimers = []
  if (!runId) return
  for (let i = 0; i < 4; i += 1) {
    processTimers.push(setTimeout(() => store.processStep(i), TICK.processStart + i * TICK.processGap))
  }
  processTimers.push(setTimeout(() => store.finishProcessing(), TICK.processStart + 3 * TICK.processGap + TICK.processTail))
})

/* Wi-Fi 扫描 900ms / 密码下发 1200ms（一次性） */
watch(() => store.sync.scanning, (on) => {
  clearTimeout(wifiScanTimer)
  wifiScanTimer = null
  if (on) wifiScanTimer = setTimeout(() => store.finishScanWifi(), TICK.wifiScan)
})
watch(() => store.sync.sending, (on) => {
  clearTimeout(sendPwdTimer)
  sendPwdTimer = null
  if (on) sendPwdTimer = setTimeout(() => store.finishSendPassword(), TICK.sendPassword)
})

/* toast 2100ms 自动消失 */
watch(() => store.toast, (msg) => {
  clearTimeout(toastTimer)
  toastTimer = null
  if (msg) toastTimer = setTimeout(() => store.clearToast(), TICK.toast)
})

/* 新字幕出现时把字幕区滚到底（归档手动 scrollTop = scrollHeight） */
watch(() => store.liveLines.length, () => {
  requestAnimationFrame(() => {
    if (liveTextEl.value) liveTextEl.value.scrollTop = liveTextEl.value.scrollHeight
  })
})
watch(() => store.process.segments.length, () => {
  const el = procTextEl.value
  if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight })
})
watch(() => store.listen.subtitles.length, () => {
  requestAnimationFrame(() => {
    if (listenSubsEl.value) listenSubsEl.value.scrollTop = listenSubsEl.value.scrollHeight
  })
})

/* ============================================================
 * 交互
 * ============================================================ */
function onBack() {
  if (store.screen === 'detail') store.backToFiles()
  else emit('close')
}

function onFinish() {
  const now = new Date()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  clearInterval(liveAiTimer)
  liveAiTimer = null
  store.stopRecord({
    title: t('record.newRecording').replace('{time}', hhmm),
    time: t('record.justNow')
  })
}

function onPlay() {
  // 归档：playing 翻转后 toast（开始播放音频 / 已暂停）
  const on = store.togglePlay()
  store.notify(on ? 'detail.play' : 'detail.pause')
}

function onTalk(lang) {
  const r = store.toggleTalk(lang)
  clearTimeout(faceTimer)
  faceTimer = null
  // 归档的假识别节奏 2200ms（内含 talking 守卫）
  if (r === 'start') faceTimer = setTimeout(() => store.resolveTalk(lang), TICK.faceRecognition)
}

function closeFace() {
  clearTimeout(faceTimer)
  faceTimer = null
  store.cancelTalk()
  store.closeFace()
}

function onScan() {
  if (store.sync.scanning) return
  store.scanWifi()
}

function signalText(excellent) {
  return t(excellent ? 'sync.signalExcellent' : 'sync.signalGood')
}
</script>

<template>
  <div class="rf-root" data-flow-root="recorder" role="region" :aria-label="t('title')">
    <!-- ==================== 头部（对齐归档 .page-head 的 52px 行） ==================== -->
    <header class="rf-head">
      <button class="rf-back" data-nav-back :aria-label="t('files.back')" @click="onBack">
        <LIcon name="arrowLeft" :size="18" />
      </button>
      <h1 class="rf-title">{{ store.screen === 'detail' ? t('detail.title') : t('files.title') }}</h1>
      <button
        v-if="store.screen === 'files'"
        class="rf-head-action"
        data-rec-manage
        @click="store.toggleManage()"
      >{{ store.managing ? t('files.manageDone') : t('files.manage') }}</button>
      <button
        v-else
        class="rf-head-action"
        data-rec-export
        @click="store.toastExport()"
      >{{ t('files.export') }}</button>
    </header>

    <!-- ==================== 屏 1：全部录音 ==================== -->
    <div v-if="store.screen === 'files'" key="files" class="rf-body" data-rec-screen="files">
      <p class="rf-intro">{{ t('files.intro') }}</p>

      <label class="rf-search">
        <span class="rf-search-ico" />
        <input
          data-rec-search
          :value="store.query"
          :placeholder="t('files.search')"
          @input="store.setQuery($event.target.value)"
        />
      </label>

      <div class="rf-count">
        <span data-rec-count>{{ t('files.count').replace('{count}', store.fileCount) }}</span>
        <button data-rec-sort @click="store.toastSortDesc()">{{ t('files.sortTimeDesc') }}</button>
      </div>

      <div class="rf-list" :class="{ managing: store.managing }" data-rec-list>
        <button
          v-for="r in store.fileList"
          :key="r.id"
          class="rf-row"
          :data-rec-file="r.id"
          @click="store.openFile(r.id)"
        >
          <span class="rf-check" :class="{ checked: store.isSelected(r.id) }" :data-rec-check="r.id">{{ store.isSelected(r.id) ? '✓' : '' }}</span>
          <span class="rf-wave"><i v-for="(h, i) in WAVE8" :key="i" :style="{ height: h }" /></span>
          <span class="rf-copy">
            <b>{{ r.title }}</b>
            <small>{{ r.time }} · {{ r.duration }} · {{ r.size }}</small>
          </span>
          <em class="rf-pill" :class="r.status">{{ t('status.' + r.status) }}</em>
          <span class="rf-chevron">›</span>
        </button>
        <div v-if="!store.fileList.length" class="rf-empty" data-rec-empty>{{ t('files.empty') }}</div>
      </div>

      <!-- 设备能力入口（归档设备详情页「设备功能」三宫格） -->
      <section class="rf-panel">
        <div class="rf-panel-title">
          <h3>{{ t('device.features') }}</h3>
          <span>{{ t('device.featuresHint') }}</span>
        </div>
        <div class="rf-grid3">
          <button class="rf-abtn" data-rec-open-record @click="store.openRecordSheet()">
            <span class="rf-ficon lg"><LIcon name="mic" :size="20" /></span>
            <b>{{ t('device.featRecord') }}</b>
            <small>{{ t('device.featRecordSub') }}</small>
          </button>
          <button class="rf-abtn" data-rec-open-face @click="store.openFace()">
            <span class="rf-ficon lg"><LIcon name="users" :size="20" /></span>
            <b>{{ t('device.featFace') }}</b>
            <small>{{ t('device.featFaceSub') }}</small>
          </button>
          <button class="rf-abtn" data-rec-open-listen @click="store.openListen()">
            <span class="rf-ficon lg"><LIcon name="languages" :size="20" /></span>
            <b>{{ t('device.featListen') }}</b>
            <small>{{ t('device.featListenSub') }}</small>
          </button>
        </div>
      </section>

      <!-- 设备管理（归档「录音同步」行 + 智能降噪 / 录音参数两行设置） -->
      <section class="rf-panel">
        <div class="rf-panel-title">
          <h3>{{ t('device.manage') }}</h3>
          <span>{{ t('device.manageHint') }}</span>
        </div>
        <div class="rf-manage-list">
          <button class="rf-manage-row" data-rec-open-sync @click="store.openSync()">
            <span class="rf-ficon"><LIcon name="wifi" :size="17" /></span>
            <span class="rf-manage-copy">
              <b>{{ t('device.manageSync') }}</b>
              <small>{{ store.syncSummaryText }}</small>
            </span>
            <em class="rf-sync-summary" :class="{ on: store.syncConfigured }" data-rec-sync-summary>{{ store.syncSummaryBadge }}</em>
            <span class="rf-chevron">›</span>
          </button>
        </div>
        <button class="rf-entry" data-rec-noise @click="store.toastNoiseCancel()">
          <span class="rf-ficon"><LIcon name="waves" :size="16" /></span>
          <span class="rf-entry-copy">
            <b>{{ t('device.noiseCancel') }}</b>
            <small>{{ t('device.noiseCancelValue') }}</small>
          </span>
          <span class="rf-chevron">›</span>
        </button>
        <button class="rf-entry" data-rec-params @click="store.toastAudioParams()">
          <span class="rf-ficon"><LIcon name="audioLines" :size="16" /></span>
          <span class="rf-entry-copy">
            <b>{{ t('device.audioParams') }}</b>
            <small>{{ t('device.audioParamsValue') }}</small>
          </span>
          <span class="rf-chevron">›</span>
        </button>
      </section>
    </div>

    <!-- ==================== 屏 2：录音详情 ==================== -->
    <div v-else key="detail" class="rf-body" data-rec-screen="detail">
      <div class="rf-detail-title">
        <h2 data-rec-detail-title>{{ store.detailRow?.title }}</h2>
        <p data-rec-detail-meta>{{ store.detailMeta }}</p>
      </div>

      <div class="rf-audio-card">
        <button class="rf-play" data-rec-play :aria-label="t(store.playing ? 'detail.pause' : 'detail.play')" @click="onPlay()">
          <LIcon :name="store.playing ? 'pause' : 'play'" :size="14" :filled="!store.playing" />
        </button>
        <div class="rf-fakewave">
          <i v-for="(h, i) in WAVE52" :key="i" :style="{ height: h }" />
        </div>
        <small>{{ store.detailRow?.duration }}</small>
      </div>

      <div class="rf-tabs">
        <button
          v-for="tb in DETAIL_TABS"
          :key="tb"
          :data-rec-tab="tb"
          :class="{ active: store.tab === tb }"
          @click="store.setTab(tb)"
        >{{ t('detail.tab.' + tb) }}</button>
      </div>

      <div class="rf-tabbody">
        <!-- 音频 -->
        <div v-if="store.tab === 'audio'" class="rf-pane" data-rec-pane="audio">
          <h3>{{ t('detail.marks') }}</h3>
          <p v-for="m in store.markers" :key="m.at" class="rf-mark">
            {{ t('detail.markLine').replace('{at}', m.at).replace('{text}', m.text) }}
          </p>
          <button class="rf-primary" data-rec-addmark @click="store.toastAddMark()">{{ t('detail.addMark') }}</button>
        </div>

        <!-- 转写：三态（归档 renderTranscriptPane） -->
        <div v-else-if="store.tab === 'transcript'" class="rf-pane" data-rec-pane="transcript">
          <template v-if="store.detailFile?.status === 'done'">
            <div v-for="(l, i) in store.transcript" :key="i" class="rf-tline">
              <b>{{ l.speaker }} · {{ l.time }}</b>
              <p>{{ l.text }}</p>
            </div>
          </template>
          <div v-else-if="store.detailFile?.status === 'working'" class="rf-pcard">
            <span><LIcon name="loaderCircle" :size="18" class="rf-spin" /></span>
            <h3>{{ t('detail.transcribing') }}</h3>
            <p>{{ t('detail.transcribingHint') }}</p>
          </div>
          <div v-else class="rf-pcard">
            <span><LIcon name="fileText" :size="18" /></span>
            <h3>{{ t('detail.notTranscribed') }}</h3>
            <p>{{ t('detail.notTranscribedHint') }}</p>
            <button class="rf-primary" data-rec-transcribe @click="store.startTranscription(store.detailId)">{{ t('detail.startTranscribe') }}</button>
          </div>
        </div>

        <!-- AI 纪要 -->
        <div v-else class="rf-pane" data-rec-pane="summary">
          <h3>{{ t('detail.summaryTitle') }}</h3>
          <div class="rf-summary-card">
            <h4>{{ t('detail.conclusion') }}</h4>
            <p>{{ t('detail.conclusionText') }}</p>
          </div>
          <div class="rf-summary-card">
            <h4>{{ t('detail.todos') }}</h4>
            <p>{{ t('detail.todosText') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 批量条（归档 .batchbar） ==================== -->
    <div v-if="store.screen === 'files' && store.managing" class="rf-batchbar" data-rec-batchbar>
      <span data-rec-selected>{{ t('batch.selected').replace('{count}', store.selectedCount) }}</span>
      <button data-rec-batch="sync" @click="store.toastQueued()">{{ t('batch.sync') }}</button>
      <button data-rec-batch="export" @click="store.toastExport()">{{ t('batch.export') }}</button>
      <button data-rec-batch="delete" @click="store.toastDemoDelete()">{{ t('batch.delete') }}</button>
    </div>

    <!-- ==================== 浮层 A：录音（底部 sheet） ==================== -->
    <div v-if="store.recordSheet" class="rf-overlay" data-rec-overlay="record" @click.self="store.closeRecordSheet()">
      <div class="rf-sheet">
        <div class="rf-handle" />
        <div class="rf-sheethead">
          <div>
            <h2>{{ t('record.title') }}</h2>
            <p class="rf-sheet-sub">{{ t('record.subtitle') }}</p>
          </div>
          <button class="rf-close" data-rec-close="record" :aria-label="t('files.back')" @click="store.closeRecordSheet()">
            <LIcon name="x" :size="15" />
          </button>
        </div>

        <div class="rf-recstate" :class="{ 'recording-now': store.recording }">
          <div class="rf-orb" :class="{ active: store.recording }" data-rec-orb />
          <div class="rf-timer" data-rec-timer>{{ store.recordTimerText }}</div>
          <div class="rf-hint" data-rec-hint>{{ t(store.recordHintKey) }}</div>
          <div class="rf-level">
            <i v-for="(h, i) in WAVE17" :key="i" :style="{ height: h }" />
          </div>
          <div class="rf-controls">
            <button data-rec-toggle @click="store.toggleRecord()">{{ t(store.recordToggleKey) }}</button>
            <button class="finish" data-rec-finish @click="onFinish()">{{ t('record.finish') }}</button>
          </div>
        </div>

        <!-- 拾音模式：与设备控制页共用 aiMateStore.pickupMode（单一事实源） -->
        <div class="rf-pickup">
          <div class="rf-pickup-head">
            <b>{{ am('recorder.pickup') }}</b>
            <span>{{ am('recorder.pickupHint') }}</span>
          </div>
          <div class="rf-chips">
            <button
              v-for="m in PICKUP_MODES"
              :key="m"
              class="rf-chip"
              :class="{ on: mate.pickupMode === m }"
              :data-rec-pickup-mode="m"
              @click="mate.setPickupMode(m)"
            >{{ am('recorder.pickupModes.' + m) }}</button>
          </div>
        </div>

        <!-- 实时转写 / 实时翻译字幕 -->
        <div class="rf-live" :class="{ show: !!store.liveAiMode }" data-rec-live>
          <div class="rf-live-head">
            <b data-rec-live-title>{{ store.liveTitle }}</b>
            <span>{{ t('record.generating') }}</span>
          </div>
          <p v-if="store.liveNoTranslation" class="rf-live-note">{{ t('process.noTranslation') }}</p>
          <div ref="liveTextEl" class="rf-live-text" :style="{ maxHeight: LIVE_TEXT_MAX + 'px' }">
            <div v-for="(l, i) in store.liveLines" :key="i" class="rf-live-line">
              <b>{{ l.label }}</b>
              <p>{{ l.source }}<span class="rf-caret" /></p>
              <small v-if="l.translation">{{ l.translation }}</small>
            </div>
          </div>
        </div>

        <div class="rf-post">
          <p>{{ t('record.postHint') }}</p>
          <div class="rf-post-grid">
            <button
              data-rec-act="transcribe"
              :class="{ active: store.liveAiMode === 'transcribe' }"
              @click="store.runTranscribeAction()"
            >
              <span><LIcon name="fileText" :size="14" /></span>
              <b>{{ t('record.actTranscribe') }}</b>
              <small>{{ t('record.actTranscribeSub') }}</small>
            </button>
            <button
              data-rec-act="translate"
              :class="{ active: store.liveAiMode === 'translate' }"
              @click="store.openTranslateSheet()"
            >
              <span><LIcon name="languages" :size="14" /></span>
              <b>{{ t('record.actTranslate') }}</b>
              <small>{{ t('record.actTranslateSub') }}</small>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 浮层 B：面对面翻译（全屏页） ==================== -->
    <div v-if="store.face.open" class="rf-overlay rf-full-overlay" data-rec-overlay="face" @click.self="closeFace()">
      <div class="rf-full rf-face-full">
        <div class="rf-full-head">
          <button data-rec-close="face" :aria-label="t('files.back')" @click="closeFace()"><LIcon name="arrowLeft" :size="18" /></button>
          <h2>{{ t('face.title') }}</h2>
          <span>{{ t('face.mode') }}</span>
        </div>

        <!-- 语言条是纯装饰（归档无处理器） -->
        <div class="rf-lang-switch">
          <button>{{ t('face.langCn') }}</button>
          <span>⇄</span>
          <button>{{ t('face.langEn') }}</button>
        </div>

        <div class="rf-face-side cn">
          <label>{{ t('face.cnLabel') }}</label>
          <p data-rec-face-text="cn">{{ store.faceCnText }}</p>
          <button
            class="rf-talk"
            :class="{ listening: store.face.talking === 'cn' }"
            data-rec-talk="cn"
            @click="onTalk('cn')"
          >●</button>
          <span class="rf-talk-label" data-rec-face-label="cn">{{ store.faceCnLabel }}</span>
        </div>

        <div class="rf-face-side en">
          <label>{{ t('face.enLabel') }}</label>
          <p data-rec-face-text="en">{{ store.faceEnText }}</p>
          <button
            class="rf-talk"
            :class="{ listening: store.face.talking === 'en' }"
            data-rec-talk="en"
            @click="onTalk('en')"
          >●</button>
          <span class="rf-talk-label" data-rec-face-label="en">{{ store.faceEnLabel }}</span>
        </div>
      </div>
    </div>

    <!-- ==================== 浮层 C：听译（全屏页） ==================== -->
    <div v-if="store.listen.open" class="rf-overlay rf-full-overlay" data-rec-overlay="listen" @click.self="store.closeListen()">
      <div class="rf-full rf-listen-full">
        <div class="rf-full-head">
          <button data-rec-close="listen" :aria-label="t('files.back')" @click="store.closeListen()"><LIcon name="arrowLeft" :size="18" /></button>
          <h2>{{ t('listen.title') }}</h2>
          <span>{{ t('listen.badge') }}</span>
        </div>

        <div :key="listenBarKey" class="rf-lang-bar language-change">
          <div>
            <label>{{ t('listen.sourceLabel') }}</label>
            <select data-rec-listen-source :value="store.listen.source" @change="store.setListenSource($event.target.value)">
              <option v-for="o in store.listenLangOptions.sources" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
          <button data-rec-listen-swap :aria-label="t('listen.swap')" @click="store.swapListen()">⇄</button>
          <div>
            <label>{{ t('listen.targetLabel') }}</label>
            <select data-rec-listen-target :value="store.listen.target" @change="store.setListenTarget($event.target.value)">
              <option v-for="o in store.listenLangOptions.targets" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </div>
        </div>

        <div class="rf-listen-status">
          <i />
          <span data-rec-listen-status>{{ t(store.listenStatusKey) }}</span>
        </div>

        <div class="rf-listen-visual"><i v-for="i in 19" :key="i" /></div>

        <div class="rf-subtitle-stage">
          <h3 data-rec-listen-title>{{ store.listenSubtitleTitle }}</h3>
          <div ref="listenSubsEl" data-rec-subtitles>
            <div v-for="(s, i) in store.listen.subtitles" :key="i" class="rf-subline">
              <b>{{ s.label }}</b>
              <p>{{ s.source }}</p>
              <small>{{ s.target }}<span v-if="s.caret" class="rf-caret" /></small>
            </div>
          </div>
        </div>

        <button class="rf-primary rf-listen-btn" data-rec-listen-toggle @click="store.toggleListen()">{{ t(store.listenButtonKey) }}</button>
      </div>
    </div>

    <!-- ==================== 浮层 D：AI 处理（全屏页） ==================== -->
    <div v-if="store.process.open" class="rf-overlay rf-full-overlay" data-rec-overlay="process" @click.self="store.closeProcess()">
      <div class="rf-full rf-processing-full">
        <div class="rf-full-head">
          <button data-rec-close="process" :aria-label="t('files.back')" @click="store.closeProcess()"><LIcon name="arrowLeft" :size="18" /></button>
          <h2 data-rec-process-header>{{ t(store.processHeaderKey) }}</h2>
          <span data-rec-process-state>{{ t(store.processStateKey) }}</span>
        </div>

        <div class="rf-proc-hero">
          <span data-rec-process-kicker>{{ store.processKicker }}</span>
          <h2 data-rec-process-title>{{ t(store.processTitleKey) }}</h2>
          <p>{{ t(store.processDescKey) }}</p>
          <div class="rf-proc-progress">
            <i data-rec-process-progress :style="{ width: store.process.progress + '%' }" />
          </div>
        </div>

        <div class="rf-live-card">
          <h3>{{ t(store.processLiveTitleKey) }}</h3>
          <p v-if="store.processNoTranslation" class="rf-live-note">{{ t('process.noTranslation') }}</p>
          <div ref="procTextEl" class="rf-live-segments" data-rec-live-text>
            <div v-for="(s, i) in store.process.segments" :key="i" class="rf-segment">
              <b>{{ s.label }}</b>
              <p>{{ s.source }}<span v-if="s.caret" class="rf-caret" /></p>
              <small v-if="s.translation">{{ s.translation }}</small>
            </div>
          </div>
        </div>

        <button v-if="store.process.done" class="rf-proc-done" data-rec-process-done @click="store.openProcessResult()">{{ t('process.done') }}</button>
      </div>
    </div>

    <!-- ==================== 浮层 E：录音同步（底部 sheet） ==================== -->
    <div v-if="store.sync.open" class="rf-overlay" data-rec-overlay="sync" @click.self="store.closeSync()">
      <div class="rf-sheet">
        <div class="rf-handle" />
        <div class="rf-sheethead">
          <div>
            <h2>{{ t('sync.title') }}</h2>
            <p class="rf-sheet-sub">{{ t('sync.subtitle') }}</p>
          </div>
          <button class="rf-close" data-rec-close="sync" :aria-label="t('files.back')" @click="store.closeSync()">
            <LIcon name="x" :size="15" />
          </button>
        </div>

        <div class="rf-sync-tabs">
          <button data-rec-sync-tab="wifi" :class="{ active: store.sync.tab === 'wifi' }" @click="store.setSyncTab('wifi')">{{ t('sync.tabWifi') }}</button>
          <button data-rec-sync-tab="bluetooth" :class="{ active: store.sync.tab === 'bluetooth' }" @click="store.setSyncTab('bluetooth')">{{ t('sync.tabBt') }}</button>
        </div>

        <!-- Wi-Fi pane -->
        <div v-if="store.sync.tab === 'wifi'" class="rf-sync-pane" data-rec-sync-pane="wifi">
          <div class="rf-conn">
            <span><LIcon name="wifi" :size="16" /></span>
            <div>
              <b>{{ t('sync.wifiTitle') }}</b>
              <small>{{ t('sync.wifiDesc') }}</small>
            </div>
          </div>
          <button class="rf-scan" data-rec-scan @click="onScan()">
            {{ store.sync.scanning ? t('sync.scanning') : (store.sync.scanned ? t('sync.rescan') : t('sync.scan')) }}
          </button>
          <div class="rf-networks" data-rec-networks>
            <button
              v-for="n in store.networkList"
              :key="n.ssid"
              class="rf-network"
              :data-rec-network="n.ssid"
              @click="store.chooseNetwork(n.ssid)"
            >
              <span><LIcon name="wifi" :size="13" /></span>
              <b>{{ n.ssid }}</b>
              <small>{{ signalText(n.excellent) }}&#12288;›</small>
            </button>
          </div>

          <div v-if="store.sync.ssid" class="rf-pwd" data-rec-pwd-box>
            <label data-rec-network-name>{{ t('sync.connectTo').replace('{ssid}', store.sync.ssid) }}</label>
            <input
              data-rec-wifi-pwd
              type="password"
              :placeholder="t('sync.passwordPlaceholder')"
              :value="store.sync.password"
              @input="store.setPassword($event.target.value)"
            />
            <button class="rf-solid" data-rec-send-pwd @click="store.sendPassword()">
              {{ store.sync.sending ? t('sync.sending') : t('sync.sendPassword') }}
            </button>
            <p class="rf-privacy">{{ t('sync.privacyWifi') }}</p>
          </div>

          <div v-if="store.sync.wifiDone" class="rf-success" data-rec-wifi-success>
            <span><LIcon name="check" :size="17" /></span>
            <b>{{ t('sync.wifiDone') }}</b>
            <p>{{ t('sync.wifiDoneDesc') }}</p>
          </div>
        </div>

        <!-- 蓝牙 pane -->
        <div v-else class="rf-sync-pane" data-rec-sync-pane="bluetooth">
          <div class="rf-conn">
            <span><LIcon name="bluetooth" :size="16" /></span>
            <div>
              <b>{{ t('sync.btDevice') }}</b>
              <small>{{ t('sync.btDesc') }}</small>
            </div>
          </div>
          <button class="rf-solid" data-rec-bt-sync @click="store.enableBluetoothSync()">
            {{ store.sync.btDone ? t('sync.btEnabled') : t('sync.btEnable') }}
          </button>
          <p class="rf-privacy">{{ t('sync.privacyBt') }}</p>
          <div v-if="store.sync.btDone" class="rf-success" data-rec-bt-success>
            <span><LIcon name="check" :size="17" /></span>
            <b>{{ t('sync.btDone') }}</b>
            <p>{{ t('sync.btDoneDesc') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 浮层 F：翻译语言选择（底部 sheet，叠在录音之上） ==================== -->
    <div v-if="store.translateSheet" class="rf-overlay" data-rec-overlay="translate" @click.self="store.closeTranslateSheet()">
      <div class="rf-sheet">
        <div class="rf-handle" />
        <div class="rf-sheethead">
          <div>
            <h2>{{ t('translate.title') }}</h2>
            <p class="rf-sheet-sub">{{ t('translate.subtitle') }}</p>
          </div>
          <button class="rf-close" data-rec-close="translate" :aria-label="t('files.back')" @click="store.closeTranslateSheet()">
            <LIcon name="x" :size="15" />
          </button>
        </div>
        <div class="rf-translate-options">
          <button
            v-for="o in TRANSLATE_TARGETS"
            :key="o.id"
            :data-rec-translate-to="o.id"
            @click="store.chooseTranslateTarget(o.id)"
          >
            <span>{{ o.glyph }}</span>
            <b>{{ t(o.nameKey) }}</b>
            <small>{{ t(o.subKey) }}</small>
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== toast（归档 .toast，文案照搬） ==================== -->
    <div v-if="store.toast" class="rf-toast" data-rec-toast>
      <span>✓</span>{{ store.toastText }}
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
 * 归档 `:root` 变量表（§4.0）逐字抄到流程根上
 * ============================================================ */
.rf-root {
  --ink: #171526;
  --muted: #7c788c;
  --line: #ece9f2;
  --purple: #6748ee;
  --purple2: #4932b4;
  --soft: #f2efff;
  --green: #23aa71;
  --red: #ed5664;
  --blue: #338fd4;
  --bg: #f4f3f8;

  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--ink);
}
.rf-root,
.rf-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.rf-root,
.rf-root button,
.rf-root input,
.rf-root select {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.rf-root button { color: inherit; cursor: pointer; border: 0; background: transparent; }
.rf-root button:focus-visible,
.rf-root input:focus-visible { outline: 3px solid rgba(103, 72, 238, 0.25); outline-offset: 2px; }

/* ============================================================
 * 头部：对齐归档 .page-head（52px 行 / 34px 圆角返回 / 10px 紫色动作）
 * 🔴 必须 ≥ safe-top + 52，否则落在顶部 64px 边缘手势热区里点不动
 * ============================================================ */
.rf-head {
  flex: none;
  height: calc(var(--safe-top, 44px) + 52px);
  padding: var(--safe-top, 44px) 18px 0;
  display: grid;
  grid-template-columns: 52px 1fr 52px;
  align-items: center;
  background: var(--bg);
}
.rf-back {
  width: 34px;
  height: 34px;
  border: 1px solid var(--line) !important;
  border-radius: 11px;
  background: #fff !important;
  display: grid;
  place-items: center;
}
.rf-back:active { background: #f7f6fa !important; }
.rf-title {
  margin: 0;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.rf-head-action {
  justify-self: end;
  font-size: 10px;
  font-weight: 750;
  color: var(--purple);
  white-space: nowrap;
  padding: 6px 0;
}

/* ============================================================
 * 屏体：归档 .screen 的 18px 左右内边距 + 12px 头后间距
 * 底部让开 Home Indicator 手势区（归档的 94px 是给底部导航留的，本仓没有导航）
 * ============================================================ */
.rf-body {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 12px 18px calc(26px + var(--home-indicator-zone, 34px));
  animation: screenin 0.22s ease;
}
.rf-body::-webkit-scrollbar { display: none; }
@keyframes screenin { from { opacity: 0; transform: translateX(8px); } }

/* ============================================================
 * 全部录音页（§4.5）
 * ============================================================ */
.rf-intro {
  margin: -8px 2px 14px;
  color: var(--muted);
  font-size: 9px;
  line-height: 1.45;
  text-align: center;
}
.rf-search {
  height: 40px;
  background: #ecebf0;
  border-radius: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  margin-bottom: 12px;
}
.rf-search-ico {
  width: 12px;
  height: 12px;
  border: 1.5px solid #8d8996;
  border-radius: 50%;
  position: relative;
  flex: none;
}
.rf-search-ico:after {
  content: "";
  position: absolute;
  width: 5px;
  height: 1.5px;
  background: #8d8996;
  right: -4px;
  bottom: -2px;
  transform: rotate(45deg);
}
.rf-search input {
  border: 0;
  background: transparent;
  outline: 0;
  flex: 1;
  min-width: 0;
  font-size: 10.5px;
  color: var(--ink);
}
.rf-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--muted);
  font-size: 9px;
  margin: 4px 2px 8px;
}
.rf-count button { color: var(--purple); font-size: 9px; }

.rf-list {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 17px;
  overflow: hidden;
}
.rf-row {
  width: 100%;
  min-height: 78px;
  border-top: 1px solid #f0eef3 !important;
  background: #fff !important;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 11px;
}
.rf-row:first-child { border-top: 0 !important; }
.rf-row:active { background: #faf9ff !important; }

/* 勾选框：批量管理态才出现 */
.rf-check {
  display: none;
  width: 17px;
  height: 17px;
  border: 1px solid #cac6d1;
  border-radius: 5px;
  place-items: center;
  color: #fff;
  font-size: 8px;
  flex: none;
}
.rf-list.managing .rf-check { display: grid; }
.rf-check.checked { background: var(--purple); border-color: var(--purple); }

/* 行首波形块；颜色按行序循环（归档行为，unshift 后整列位移） */
.rf-wave {
  width: 43px;
  height: 43px;
  border-radius: 13px;
  background: #efecff;
  color: var(--purple);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: none;
}
.rf-wave i { width: 2px; background: currentColor; border-radius: 2px; }
.rf-row:nth-child(2) .rf-wave { background: #e9f5ff; color: var(--blue); }
.rf-row:nth-child(3) .rf-wave { background: #fff1e7; color: #df8c4d; }
.rf-row:nth-child(4) .rf-wave { background: #eaf8f2; color: var(--green); }

.rf-copy { flex: 1; min-width: 0; }
.rf-copy b {
  font-size: 10.5px;
  line-height: 1.35;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rf-copy small { font-size: 8px; line-height: 1.4; color: var(--muted); display: block; margin-top: 4px; }
.rf-chevron { font-size: 13px; color: #b4afba; flex: none; }
.rf-empty { text-align: center; padding: 35px 10px; color: var(--muted); font-size: 9px; }

/* 状态胶囊（§4.2） */
.rf-pill {
  font-style: normal;
  font-size: 8px;
  padding: 4px 7px;
  border-radius: 7px;
  white-space: nowrap;
  flex: none;
}
.rf-pill.done { color: #257d59; background: #e8f7f0; }
.rf-pill.pending { color: #837d8d; background: #f0eff3; }
.rf-pill.working { color: #5d46ca; background: #efecff; }
.rf-pill.working:before {
  content: "";
  display: inline-block;
  vertical-align: -1px;
  width: 5px;
  height: 5px;
  border: 1px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  margin-right: 3px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ============================================================
 * 流程内的设备面板（归档设备详情页的「设备功能 / 设备管理」）
 * ============================================================ */
.rf-panel {
  margin-top: 12px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 19px;
  padding: 17px;
  overflow: hidden;
}
.rf-panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 11px;
}
.rf-panel-title h3 { font-size: 14px; line-height: 1.3; margin: 0; }
.rf-panel-title span { font-size: 8.5px; color: var(--muted); }

.rf-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.rf-abtn {
  min-height: 114px;
  border-radius: 17px !important;
  background: #f5f2ff !important;
  padding: 12px 7px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.rf-abtn:active { background: #ece7ff !important; }
.rf-abtn b { font-size: 11px; line-height: 1.3; margin-top: 9px; }
.rf-abtn small { font-size: 8px; line-height: 1.45; color: var(--muted); margin-top: 4px; }

.rf-ficon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: var(--purple);
  background: #f0edff;
  flex: none;
}
.rf-ficon.lg {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 5px 13px rgba(72, 50, 168, 0.09);
}

.rf-manage-list { border-top: 1px solid #f0eef3; }
.rf-manage-row {
  width: 100%;
  min-height: 72px;
  border-bottom: 1px solid #f0eef3 !important;
  background: #fff !important;
  padding: 10px 1px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
}
.rf-manage-row:last-child { border-bottom: 0 !important; }
.rf-manage-row:active { background: #faf9ff !important; }
.rf-manage-row .rf-ficon { width: 36px; height: 36px; border-radius: 11px; }
.rf-manage-copy { flex: 1; min-width: 0; }
.rf-manage-copy b { display: block; font-size: 11px; line-height: 1.35; }
.rf-manage-copy small { display: block; font-size: 8.5px; line-height: 1.45; color: var(--muted); margin-top: 4px; }
.rf-sync-summary {
  font-style: normal;
  font-size: 8.5px;
  color: var(--muted);
  background: #f0eff3;
  padding: 5px 7px;
  border-radius: 7px;
  white-space: nowrap;
  flex: none;
}
.rf-sync-summary.on { color: var(--green); background: #eaf8f2; }

.rf-entry {
  width: 100%;
  min-height: 64px;
  border-top: 1px solid #f0eef3 !important;
  text-align: left;
  padding: 0;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}
.rf-entry-copy { min-width: 0; }
.rf-entry b { display: block; font-size: 10.5px; line-height: 1.35; }
.rf-entry small { display: block; color: var(--muted); font-size: 8px; line-height: 1.45; margin-top: 3px; }
.rf-entry .rf-chevron { font-size: 13px; color: #aaa5b1; }

/* ============================================================
 * 录音详情（§4.6）
 * ============================================================ */
.rf-detail-title h2 { font-size: 18px; line-height: 1.3; margin: 5px 0 3px; }
.rf-detail-title p { font-size: 9px; line-height: 1.4; color: var(--muted); margin: 0; }
.rf-audio-card {
  margin-top: 14px;
  padding: 14px;
  border-radius: 17px;
  color: #fff;
  background: linear-gradient(145deg, #31286e, #503caf);
  display: flex;
  align-items: center;
  gap: 10px;
}
.rf-play {
  width: 37px;
  height: 37px;
  border-radius: 50%;
  background: #fff !important;
  color: var(--purple);
  display: grid;
  place-items: center;
  flex: none;
}
.rf-fakewave { flex: 1; height: 31px; display: flex; align-items: center; gap: 2px; min-width: 0; }
.rf-fakewave i { width: 2px; background: rgba(255, 255, 255, 0.68); border-radius: 2px; flex: none; }
.rf-audio-card small { font-size: 8px; flex: none; }

.rf-tabs { display: flex; border-bottom: 1px solid var(--line); margin-top: 15px; }
.rf-tabs button { flex: 1; color: var(--muted); padding: 10px 2px; font-size: 10px; position: relative; }
.rf-tabs button.active { color: var(--purple); font-weight: 750; }
.rf-tabs button.active:after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 28%;
  right: 28%;
  height: 2px;
  background: var(--purple);
}

.rf-tabbody { margin-top: 12px; background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 15px; }
.rf-tabbody h3 { font-size: 12px; margin: 0 0 9px; }
.rf-tabbody p { font-size: 10px; line-height: 1.75; color: #4d4858; }
.rf-mark { margin: 0; }
.rf-pane .rf-primary { margin-top: 10px; }

.rf-tline { padding: 11px 0; border-top: 1px solid #f0eef3; }
.rf-tline:first-child { border-top: 0; }
.rf-tline b { font-size: 9px; color: var(--purple); }
.rf-tline:nth-child(3n+2) b { color: var(--blue); }
.rf-tline:nth-child(3n) b { color: #c77635; }
.rf-tline p { margin: 5px 0 0; font-size: 10.5px; }

.rf-pcard { text-align: center; padding: 22px 10px; }
.rf-pcard > span {
  width: 43px;
  height: 43px;
  border-radius: 14px;
  background: var(--soft);
  color: var(--purple);
  display: grid;
  place-items: center;
  margin: auto;
  font-size: 17px;
}
.rf-pcard h3 { margin: 11px 0 5px; font-size: 12px; }
.rf-pcard p { font-size: 9px; line-height: 1.55; color: var(--muted); margin: 0; }
.rf-pcard .rf-primary { margin-top: 12px; }
.rf-spin { animation: spin 0.9s linear infinite; }

.rf-primary {
  border-radius: 11px !important;
  background: var(--purple) !important;
  color: #fff !important;
  padding: 10px 15px;
  font-size: 10px;
  font-weight: 750;
}
.rf-summary-card { background: #f7f5ff; border-radius: 12px; padding: 11px; margin-top: 8px; }
.rf-summary-card h4 { font-size: 10px; margin: 0 0 6px; }
.rf-summary-card p { margin: 0; font-size: 9.5px; }

/* ============================================================
 * 批量条（§4.5）。归档 bottom:78px 是让开底部导航；本仓没有导航，
 * 改成贴底 + 让开 Home Indicator 手势区
 * ============================================================ */
.rf-batchbar {
  position: absolute;
  z-index: 35;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(65px + var(--home-indicator-zone, 34px));
  padding: 0 17px var(--home-indicator-zone, 34px);
  background: #fff;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 -7px 18px rgba(28, 24, 51, 0.08);
}
.rf-batchbar span { flex: 1; font-size: 9px; }
.rf-batchbar button {
  border-radius: 8px !important;
  background: var(--soft) !important;
  color: var(--purple);
  font-size: 9px;
  padding: 7px 9px;
}

/* ============================================================
 * 浮层外壳（§4.8）：底部 sheet / 全屏页两态
 * ============================================================ */
.rf-overlay {
  position: absolute;
  z-index: 100;
  inset: 0;
  background: rgba(17, 14, 30, 0.52);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-end;
  animation: rf-fade 0.18s ease;
}
@keyframes rf-fade { from { opacity: 0; } }

.rf-sheet {
  width: 100%;
  /* 归档写死 742px（它的演示框 874px 高）；本仓 App 窗口只有 ~741px 高，
     照抄会让「录音 + 实时字幕」这种长 sheet 顶到屏幕外。取 min(归档值, 窗口高 - 顶部安全区) */
  max-height: min(742px, calc(100% - var(--safe-top, 44px) - 10px));
  overflow-y: auto;
  /* 🔴 Chrome 的 scroll-anchor 会在 sheet 内内容变高时偷偷改 scrollTop，
     长 sheet 一加字幕就把标题推出屏幕 —— 这里关掉 */
  overflow-anchor: none;
  scrollbar-width: none;
  background: #fff;
  border-radius: 25px 25px 0 0;
  /* 🔴 贴底 sheet 必须让开 Home Indicator 手势区（归档的 24px 会被吃掉） */
  padding: 13px 18px calc(24px + var(--home-indicator-zone, 34px));
  animation: rf-up 0.24s ease;
}
.rf-sheet::-webkit-scrollbar { display: none; }
@keyframes rf-up { from { transform: translateY(55px); } }
.rf-handle { width: 34px; height: 4px; border-radius: 4px; background: #d7d4dc; margin: 0 auto 14px; }
.rf-sheethead { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.rf-sheethead h2 { font-size: 18px; margin: 0; }
.rf-close {
  border-radius: 10px !important;
  background: #f0eff3 !important;
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  color: var(--ink);
  flex: none;
}
.rf-sheet-sub { font-size: 9px; line-height: 1.45; color: var(--muted); margin: 4px 0 0; }

.rf-full-overlay { align-items: stretch; background: #f7f6fa; backdrop-filter: none; }
.rf-full {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  background: #f7f6fa;
  /* 归档 62px 是状态栏让位 ⇒ 换成 safe-top + 18；底部让开手势区 */
  padding: calc(var(--safe-top, 44px) + 18px) 18px calc(28px + var(--home-indicator-zone, 34px));
}
.rf-full::-webkit-scrollbar { display: none; }
.rf-full-head {
  display: grid;
  grid-template-columns: 42px 1fr 42px;
  align-items: center;
  margin-bottom: 14px;
}
.rf-full-head h2 { text-align: center; font-size: 18px; margin: 0; }
.rf-full-head button {
  width: 36px;
  height: 36px;
  border-radius: 12px !important;
  background: #fff !important;
  display: grid;
  place-items: center;
}
.rf-full-head span { font-size: 9px; color: var(--green); text-align: right; font-weight: 700; }

/* ============================================================
 * 浮层 A：录音 sheet（§4.9 + V4/V5/V6 最终值）
 * ============================================================ */
.rf-recstate { text-align: center; padding: 20px 0 13px; }
.rf-orb {
  width: 103px;
  height: 103px;
  border-radius: 50%;
  margin: 8px auto 14px;
  display: grid;
  place-items: center;
  background: #f7eff1;
  box-shadow: 0 0 0 12px #fcf7f8;
  cursor: pointer;
}
.rf-orb:before {
  content: "";
  width: 47px;
  height: 47px;
  border-radius: 50%;
  background: var(--red);
  box-shadow: 0 8px 18px rgba(237, 86, 100, 0.28);
}
.rf-orb.active:before {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  animation: pulse 1.1s infinite;
}
@keyframes pulse { 50% { opacity: 0.48; } }
.rf-timer { font-size: 32px; font-weight: 760; letter-spacing: 0.04em; }
.rf-hint { font-size: 9px; line-height: 1.45; color: var(--muted); margin-top: 3px; }
.rf-level {
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  margin: 10px;
}
.rf-level i { width: 3px; border-radius: 3px; background: #c9c2f2; }
/* 电平条：固定 inline 高度 → 28px 且变紫（归档的确定性动画，非随机） */
.recording-now .rf-level i { animation: levels 0.65s ease-in-out infinite alternate; }
.rf-level i:nth-child(2n) { animation-delay: 0.13s; }
.rf-level i:nth-child(3n) { animation-delay: 0.26s; }
@keyframes levels { to { height: 28px !important; background: var(--purple); } }

.rf-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  max-width: 324px;
  margin: 17px auto 0;
}
.rf-controls button { min-height: 54px; border-radius: 16px; padding: 0 16px; font-size: 12px; font-weight: 760; }
.rf-controls button:first-child { background: #f0eff3 !important; color: #24212f; }
.rf-controls .finish { background: #272333 !important; color: #fff; }

.rf-pickup { margin-top: 16px; border-top: 1px solid var(--line); padding-top: 13px; text-align: left; }
.rf-pickup-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 9px; }
.rf-pickup-head b { font-size: 10.5px; }
.rf-pickup-head span { font-size: 8px; color: var(--muted); }
.rf-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.rf-chip {
  border: 1px solid var(--line) !important;
  border-radius: 999px !important;
  background: #faf9fd !important;
  color: var(--muted);
  font-size: 9px;
  padding: 7px 11px;
}
.rf-chip.on {
  background: var(--soft) !important;
  border-color: var(--purple) !important;
  color: var(--purple);
  font-weight: 750;
}

.rf-live {
  display: none;
  margin-top: 14px;
  padding: 13px;
  border: 1px solid #ded8ff;
  border-radius: 16px;
  background: #f8f6ff;
  text-align: left;
}
.rf-live.show { display: block; }
.rf-live-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.rf-live-head b { font-size: 10px; }
.rf-live-head span { font-size: 8px; color: var(--green); display: flex; align-items: center; gap: 5px; }
.rf-live-head span:before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse 1s infinite;
}
.rf-live-text { overflow-y: auto; scrollbar-width: none; }
.rf-live-text::-webkit-scrollbar { display: none; }
.rf-live-line { padding: 7px 0; border-top: 1px solid #e8e4f7; animation: subtitlein 0.35s ease; }
.rf-live-line:first-child { border-top: 0; }
.rf-live-line b { font-size: 8px; color: var(--purple); }
.rf-live-line p { font-size: 10px; line-height: 1.55; margin: 4px 0 0; color: var(--ink); }
.rf-live-line small { display: block; font-size: 8px; color: var(--blue); margin-top: 4px; }
.rf-live-note { font-size: 8px; line-height: 1.5; color: var(--muted); margin: 0 0 6px; }

.rf-caret {
  display: inline-block;
  width: 2px;
  height: 14px;
  background: var(--purple);
  vertical-align: -2px;
  margin-left: 2px;
  animation: pulse 0.6s infinite;
}
@keyframes subtitlein { from { opacity: 0; transform: translateY(12px); } }

.rf-post { border-top: 1px solid var(--line); margin-top: 17px; padding-top: 14px; text-align: left; }
.rf-post > p { font-size: 9px; font-weight: 700; color: var(--ink); margin: 0 0 9px; }
.rf-post-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.rf-post-grid button {
  min-height: 84px;
  border: 1px solid var(--line) !important;
  border-radius: 14px !important;
  background: #faf9fd !important;
  text-align: left;
  padding: 11px;
}
.rf-post-grid button.active {
  border-color: var(--purple) !important;
  background: #f0edff !important;
  box-shadow: inset 0 0 0 1px var(--purple);
}
.rf-post-grid span {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--soft);
  color: var(--purple);
  display: grid;
  place-items: center;
}
.rf-post-grid b { font-size: 10.5px; display: block; margin-top: 7px; }
.rf-post-grid small { display: block; color: var(--muted); font-size: 8px; line-height: 1.4; margin-top: 2px; }

/* ============================================================
 * 浮层 B：面对面翻译（§4.10）
 * ============================================================ */
.rf-face-full .rf-lang-switch { margin: 7px 0 13px; }
.rf-lang-switch { display: flex; justify-content: center; align-items: center; gap: 8px; margin: 12px 0; }
.rf-lang-switch button {
  border: 1px solid var(--line) !important;
  background: #fff !important;
  border-radius: 9px !important;
  padding: 7px 10px;
  font-size: 9px;
  min-width: 102px;
}
.rf-lang-switch span { color: var(--purple); }
.rf-face-side { border-radius: 18px; padding: 17px; text-align: center; margin-top: 9px; }
.rf-face-side.cn { background: #f1efff; }
.rf-face-side.en { background: #eaf5ff; }
.rf-face-side label { font-size: 9px; color: var(--muted); }
.rf-face-side p { min-height: 48px; font-size: 13px; line-height: 1.5; margin: 8px; }
.rf-face-full .rf-face-side {
  min-height: 267px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.rf-talk {
  width: 74px;
  height: 74px;
  border-radius: 50% !important;
  color: #fff;
  font-size: 24px;
  background: linear-gradient(145deg, #795ff2, #4c35bd) !important;
  box-shadow: 0 8px 18px rgba(81, 56, 191, 0.25);
  flex: none;
}
.rf-face-side.en .rf-talk { background: linear-gradient(145deg, #58aee2, #2785c5) !important; }
.rf-talk.listening { animation: pulse 1s infinite; box-shadow: 0 0 0 9px rgba(103, 72, 238, 0.12); }
.rf-talk-label { font-size: 8px; color: var(--muted); display: block; margin-top: 10px; }

/* ============================================================
 * 浮层 C：听译（§4.11）
 * ============================================================ */
.rf-listen-full { display: flex; flex-direction: column; }
.rf-lang-bar {
  display: grid;
  grid-template-columns: 1fr 34px 1fr;
  align-items: center;
  gap: 8px;
  padding: 11px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 15px;
  margin-bottom: 13px;
}
.rf-lang-bar label { display: block; font-size: 8px; color: var(--muted); margin-bottom: 4px; }
.rf-lang-bar select {
  width: 100%;
  border: 0;
  background: #f3f1f8;
  border-radius: 8px;
  padding: 8px 6px;
  font-size: 9px;
  color: var(--ink);
  outline: 0;
}
.rf-lang-bar button {
  width: 34px;
  height: 34px;
  border-radius: 10px !important;
  background: var(--soft) !important;
  color: var(--purple);
  font-size: 15px;
}
.language-change { animation: languageflash 0.35s ease; }
@keyframes languageflash { 50% { background: #e8e3ff; } }

.rf-listen-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--green);
  font-size: 9px;
  font-weight: 750;
  margin: 4px 4px 14px;
}
.rf-listen-status i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 0 5px rgba(35, 170, 113, 0.12);
  animation: pulse 1s infinite;
  flex: none;
}

.rf-listen-visual {
  height: 155px;
  border-radius: 24px;
  background: radial-gradient(circle at 50% 45%, #8169f1, #4933b3 68%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: 0 14px 30px rgba(72, 50, 168, 0.22);
  flex: none;
}
.rf-listen-visual i {
  width: 4px;
  height: 24px;
  border-radius: 4px;
  background: #fff;
  animation: listenwave 0.58s ease-in-out infinite alternate;
}
.rf-listen-visual i:nth-child(2n) { animation-delay: 0.12s; }
.rf-listen-visual i:nth-child(3n) { animation-delay: 0.24s; }
@keyframes listenwave { to { height: 64px; opacity: 0.45; } }

.rf-subtitle-stage {
  flex: 1;
  /* 归档写死 min-height:330px（它演示框 874px 高）；本仓 App 窗口只有 ~788px，
     照抄会让整页高 72px、底部「暂停/继续听译」被挤到 Home Indicator 下面。
     改成 min-height:0 让它自己吃掉剩余高度，字幕列表内部滚动（不丢字幕） */
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin-top: 15px;
  padding: 17px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: #fff;
  overflow: hidden;
}
.rf-subtitle-stage h3 { font-size: 11px; margin: 0 0 13px; flex: none; }
.rf-subtitle-stage > div { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; }
.rf-subtitle-stage > div::-webkit-scrollbar { display: none; }
.rf-subline { padding: 11px 0; border-top: 1px solid #f0eef3; animation: subtitlein 0.42s ease; }
.rf-subline:first-of-type { border-top: 0; }
.rf-subline b { display: block; color: var(--purple); font-size: 9px; margin-bottom: 5px; }
.rf-subline p { font-size: 13px; line-height: 1.6; margin: 0; color: #292634; }
.rf-subline small { display: block; color: var(--muted); font-size: 9px; line-height: 1.5; margin-top: 5px; }
.rf-listen-btn { min-height: 52px; font-size: 11px; margin-top: 12px; width: 100%; }

/* ============================================================
 * 浮层 D：AI 处理（§4.12）
 * ============================================================ */
.rf-processing-full { display: flex; flex-direction: column; }
.rf-proc-hero {
  padding: 20px;
  border-radius: 21px;
  color: #fff;
  background: linear-gradient(145deg, #30266f, #5942c1);
  box-shadow: 0 13px 27px rgba(74, 53, 171, 0.2);
  flex: none;
}
.rf-proc-hero > span { font-size: 9px; color: rgba(255, 255, 255, 0.65); }
.rf-proc-hero h2 { font-size: 19px; margin: 7px 0 5px; }
.rf-proc-hero p { font-size: 9px; line-height: 1.5; color: rgba(255, 255, 255, 0.63); margin: 0; }
.rf-proc-progress {
  height: 4px;
  margin-top: 14px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 4px;
  overflow: hidden;
}
.rf-proc-progress i {
  display: block;
  height: 100%;
  width: 8%;
  background: #fff;
  border-radius: 4px;
  transition: width 0.45s ease;
}
.rf-live-card {
  flex: 1;
  margin-top: 14px;
  padding: 17px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: #fff;
  overflow-y: auto;
  scrollbar-width: none;
}
.rf-live-card::-webkit-scrollbar { display: none; }
.rf-live-card h3 { font-size: 11px; margin: 0 0 8px; }
.rf-live-segments { max-height: 100%; }
.rf-segment { padding: 12px 0; border-top: 1px solid #f0eef3; animation: subtitlein 0.4s ease; }
.rf-segment:first-of-type { border-top: 0; }
.rf-segment b { font-size: 9px; color: var(--purple); }
.rf-segment p { font-size: 12px; line-height: 1.65; margin: 6px 0 0; color: var(--ink); }
.rf-segment small { display: block; font-size: 9px; color: var(--blue); margin-top: 6px; }
.rf-proc-done {
  min-height: 50px;
  border-radius: 14px !important;
  background: var(--purple) !important;
  color: #fff !important;
  font-size: 10.5px;
  font-weight: 760;
  margin-top: 12px;
  width: 100%;
  flex: none;
}

/* ============================================================
 * 浮层 E：录音同步（§4.13）
 * ============================================================ */
.rf-sync-tabs { display: flex; background: #f0eff3; padding: 3px; border-radius: 10px; margin: 14px 0; }
.rf-sync-tabs button { flex: 1; border-radius: 8px !important; padding: 8px; font-size: 8px; color: var(--muted); }
.rf-sync-tabs button.active {
  background: #fff !important;
  color: var(--purple);
  font-weight: 750;
  box-shadow: 0 2px 7px rgba(32, 27, 54, 0.08);
}
.rf-conn { display: flex; align-items: center; gap: 10px; background: #f7f6fa; border-radius: 13px; padding: 12px; }
.rf-conn > span {
  width: 35px;
  height: 35px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: var(--soft);
  color: var(--purple);
  flex: none;
}
.rf-conn div { flex: 1; min-width: 0; }
.rf-conn b { display: block; font-size: 10px; }
.rf-conn small { display: block; font-size: 8px; line-height: 1.4; color: var(--muted); margin-top: 3px; }

.rf-scan {
  width: 100%;
  border: 1px solid #d9d2fb !important;
  color: var(--purple);
  background: #faf9ff !important;
  border-radius: 11px !important;
  padding: 10px;
  margin-top: 10px;
  font-size: 9px;
  font-weight: 750;
}
.rf-networks { margin-top: 8px; }
.rf-network {
  width: 100%;
  border-top: 1px solid var(--line) !important;
  background: #fff !important;
  padding: 11px 4px;
  display: flex;
  align-items: center;
  text-align: left;
  gap: 9px;
}
.rf-network span { color: var(--purple); flex: none; display: inline-flex; }
.rf-network b { font-size: 9px; flex: 1; }
.rf-network small { font-size: 8px; color: var(--muted); }

.rf-pwd { margin-top: 11px; padding: 12px; background: #f7f6fa; border-radius: 13px; }
.rf-pwd label { display: block; font-size: 8px; font-weight: 700; }
.rf-pwd input {
  width: 100%;
  margin: 7px 0 9px;
  border: 1px solid var(--line);
  border-radius: 9px;
  padding: 9px;
  background: #fff;
  font-size: 10px;
  outline: 0;
  color: var(--ink);
}
.rf-solid {
  width: 100%;
  border-radius: 10px !important;
  background: var(--purple) !important;
  color: #fff !important;
  padding: 10px;
  font-size: 9px;
  font-weight: 750;
}
.rf-privacy { font-size: 8px !important; color: var(--muted); line-height: 1.5; margin: 8px 2px; font-style: normal; }

.rf-success { text-align: center; padding: 18px; background: #eaf8f2; border-radius: 14px; margin-top: 10px; }
.rf-success span {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: var(--green);
  color: #fff;
  display: grid;
  place-items: center;
  margin: auto;
}
.rf-success b { font-size: 10px; display: block; margin-top: 8px; }
.rf-success p { font-size: 8px; line-height: 1.5; color: #4d8069; margin: 4px 0 0; }

/* ============================================================
 * 浮层 F：翻译语言选择（§4.14）
 * ============================================================ */
.rf-translate-options { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 14px; }
.rf-translate-options button {
  border: 1px solid var(--line) !important;
  background: #fff !important;
  border-radius: 13px !important;
  padding: 13px;
  text-align: left;
}
.rf-translate-options span { font-size: 16px; }
.rf-translate-options b { display: block; font-size: 10px; margin-top: 7px; }
.rf-translate-options small { display: block; font-size: 8px; color: var(--muted); margin-top: 3px; }

/* ============================================================
 * toast（§4.2）。让开 Home Indicator 手势区
 * ============================================================ */
.rf-toast {
  position: absolute;
  z-index: 200;
  left: 50%;
  bottom: calc(28px + var(--home-indicator-zone, 34px));
  transform: translateX(-50%);
  max-width: 82%;
  white-space: nowrap;
  background: #211d30;
  color: #fff;
  border-radius: 11px;
  padding: 9px 12px;
  font-size: 9.5px;
  box-shadow: 0 10px 27px rgba(24, 20, 42, 0.28);
  animation: toastin 0.2s ease;
}
.rf-toast span { color: #67dda2; margin-right: 6px; }
@keyframes toastin { from { opacity: 0; transform: translate(-50%, 9px); } }
</style>
