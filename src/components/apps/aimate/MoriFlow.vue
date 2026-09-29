<script setup>
/**
 * AI Mori 流程（归档 `ai_mori_interactive_prototype(3).html` 的语义重放）
 * =====================================================================
 * 权威实现：`~/Downloads/AI Mate归档/ai_mori_interactive_prototype(3).html`
 * 集成规格：`/tmp/aimate/specs/mori.md`
 * 形态对齐：本仓 `PrinterFlow.vue` / `RecorderFlow.vue`（全屏流程层 + `emit('close')`）
 *
 * AI Mori 是一台**随身 AI 相机硬件**：拍摄 → 自动同步 → 云端 AI 产出
 * 每日 Vlog / 手绘漫画 / 图文日记 / 会议转写。原型里**没有任何聊天界面**、
 * 没有打字机动画、没有「AI 思考中」态 —— 所有「AI」都是产成品而非对话框。
 *
 * 归档自带一套手搓的「tOS 外壳」（假状态栏 98/83/44px 魔法数字、`#home` 整页、
 * 「双击标题进向导」的 hack、自带 toast 组件）—— 这些一律丢弃，本仓有真外壳。
 * 只保留 **Mori 这台设备本身的能力**：9 屏 + 日历视图 / 空间选日 / 3 折叠面板 / 播放条。
 * Mori 自己**没有底部导航**，用的是顶部 4 段式 `.dtabs`。
 *
 * 🔴 本仓两个专属坑（照归档抄会静默失效）：
 *   1. `home-indicator` z-index 96 凌驾应用窗口之上 ⇒ 贴底元素用
 *      `padding-bottom: calc(Npx + var(--home-indicator-zone, 34px))` 让位
 *      （归档用的 `env(safe-area-inset-bottom)` 在本仓恒为 0）
 *   2. 顶部 64px 是边缘手势热区（`.edge-zone` z 85）⇒ 头部高度 ≥
 *      `calc(var(--safe-top, 44px) + 52px)`，否则返回键点不动
 *
 * 🔴 归档 5 处硬缺陷已修（详见 store 头注释）：播放条 v-if / 折叠不裁切 /
 *    OTA 进度条补样式 / 有素材日由数据反推 / 素材渐变提进数据。
 */
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18nStore } from '../../../stores/i18nStore'
import {
  useMoriFlowStore,
  MORI_CAL,
  MORI_TONES,
  MORI_CREATE_CARDS,
  MORI_CREATE_CAL_CARDS,
  MORI_AUDIO_ITEMS,
  MORI_MEDIA_DAYS,
  MORI_MEDIA_BREAKDOWN,
  MORI_SETTINGS_GROUPS,
  MORI_DEVICE_INFO,
  MORI_INIT_STEPS,
  MORI_WIFI_LIST,
  MORI_REC,
  MORI_VLOG,
  MORI_GALLERY,
  MORI_DIARY,
  MORI_OTA,
  MORI_PLAYER_BARS,
  MORI_WAVE_BARS
} from '../../../stores/moriFlowStore'
import LIcon from '../../ui/LIcon.vue'

const emit = defineEmits(['close'])
const i18n = useI18nStore()
const store = useMoriFlowStore()

/** 词条（扁平 key）+ 占位符替换（本仓 i18n 无插值机制） */
const t = (k) => store.t(k)
const tf = (k, p) => store.tf(k, p)

/* detail 的 4 个 tab（图标用 LIcon，替换归档里被剥离的 emoji） */
const TABS = [
  { id: 'create', icon: 'palette', key: 'tab.create' },
  { id: 'space', icon: 'folder', key: 'tab.space' },
  { id: 'record', icon: 'micVocal', key: 'tab.record' },
  { id: 'device', icon: 'smartphone', key: 'tab.device' }
]

const SCREEN_TITLE = {
  init: 'init.title',
  detail: 'title',
  preview: 'preview.title',
  rec: 'rec.title',
  media: 'media.title',
  vlog: 'vlog.title',
  gallery: 'gallery.title',
  diary: 'diary.title',
  ota: 'ota.title'
}
const title = computed(() => t(SCREEN_TITLE[store.screen] || 'title'))

const waveBars = MORI_WAVE_BARS
const playerBars = MORI_PLAYER_BARS
const recLines = MORI_REC.transcript

/* ============================================================
 * 计时器：3 处（录音计时 / OTA 进度 / toast 自动消失）
 * 全部在这里持有，onBeforeUnmount 一次清光
 * ============================================================ */
let recTimer = null
let otaTimer = null
let toastTimer = null

function stopRecTimer() {
  if (recTimer) { clearInterval(recTimer); recTimer = null }
}
function stopOtaTimer() {
  if (otaTimer) { clearInterval(otaTimer); otaTimer = null }
}

/** 录音屏：进屏开始走秒（归档写死 00:02:18 不走 → 这里修掉），离开/暂停即停 */
watch(
  () => [store.screen, store.recPaused],
  ([screen, paused]) => {
    stopRecTimer()
    if (screen === 'rec' && !paused) recTimer = setInterval(() => store.tickRec(), 1000)
  },
  { immediate: true }
)

/** 固件升级：点「开始升级」后按 MORI_OTA.stepMs 推进，到 100 自停 */
watch(
  () => store.otaRunning,
  (running) => {
    stopOtaTimer()
    if (running) otaTimer = setInterval(() => store.tickOta(), MORI_OTA.stepMs)
  }
)

/** toast 1600ms 后自动消失（照归档 `setTimeout(1600)`） */
watch(
  () => store.toast,
  (msg) => {
    if (toastTimer) clearTimeout(toastTimer)
    if (msg) toastTimer = setTimeout(() => store.clearToast(), 1600)
  }
)

onMounted(() => store.open())
onBeforeUnmount(() => {
  stopRecTimer()
  stopOtaTimer()
  if (toastTimer) clearTimeout(toastTimer)
  store.close()
})

/* ============================================================
 * 交互
 * ============================================================ */
/** 主屏的返回键关闭整条流程；子屏的返回键回主屏 */
function onBack() {
  if (store.screen === 'detail') emit('close')
  else store.back()
}

function onPreviewShutter() {
  const on = store.toggleShutter()
  store.notify(on ? 'toast.recording' : 'toast.captureDone')
}

function onInitPrimary(step) {
  if (step.id === 3) {
    store.finishInit()
    store.notify('toast.initDone')
    return
  }
  store.initNext()
}

function onInitSecondary(step) {
  // 归档里这是**表达产品约束**的提示（云端上传不可跳过），必须保留
  if (step.secondaryBlocked) {
    store.notify('toast.cloudRequired')
    return
  }
  store.initNext()
}

function toneBg(it) {
  return it && it.tone ? MORI_TONES[it.tone] : 'rgba(0,0,0,.03)'
}
</script>

<template>
  <div class="mf-root" data-flow-root="mori" role="region" :aria-label="t('title')">
    <!-- ============ 头部（让开顶部 64px 边缘手势热区）============ -->
    <header class="mf-head">
      <button class="mf-back" data-nav-back :aria-label="t('back')" @click="onBack">
        <LIcon name="chevronLeft" :size="22" />
      </button>
      <h1 class="mf-title" data-mori-title>{{ title }}</h1>
      <span class="mf-spacer" />
    </header>

    <div class="mf-body" :data-mori-screen="store.screen">
      <!-- ================================================================
           主屏 · detail —— 顶部 4 段式 .dtabs
           ================================================================ -->
      <template v-if="store.screen === 'detail'">
        <nav class="mf-dtabs" role="tablist">
          <button
            v-for="tb in TABS"
            :key="tb.id"
            class="mf-dtab"
            :class="{ active: store.tab === tb.id }"
            :data-mori-tab="tb.id"
            role="tab"
            :aria-selected="store.tab === tb.id ? 'true' : 'false'"
            @click="store.setTab(tb.id)"
          >
            <LIcon :name="tb.icon" :size="15" />
            <span>{{ t(tb.key) }}</span>
          </button>
        </nav>

        <!-- ---------------- TAB 1/4：创作 ---------------- -->
        <div v-if="store.tab === 'create'" class="mf-dcontent" data-mori-pane="create">
          <div class="mf-calwrap">
            <button
              class="mf-caltoggle"
              data-mori-cal-toggle
              :aria-label="t('create.calToggle')"
              @click="store.toggleCal()"
            >
              <LIcon :name="store.createCal ? 'list' : 'calendarDays'" :size="18" />
            </button>

            <!-- 列表视图（默认） -->
            <div v-if="!store.createCal" data-mori-create-list>
              <article
                v-for="(card, ci) in MORI_CREATE_CARDS"
                :key="ci"
                class="mf-cc"
                :data-mori-card="ci"
                @click="store.goto(card.screen)"
              >
                <template v-if="card.thumb">
                  <div class="mf-cc-thumb" :style="{ height: card.thumb.height + 'px', background: card.thumb.bg }">
                    <span class="mf-pill">{{ t(card.thumb.pillKey) }}</span>
                    <LIcon v-if="card.thumb.icon" :name="card.thumb.icon" :size="card.thumb.iconSize" />
                    <span v-if="card.thumb.play" class="mf-play"><LIcon name="play" :size="24" filled /></span>
                    <span v-if="card.thumb.durKey" class="mf-dur">{{ t(card.thumb.durKey) }}</span>
                  </div>
                  <div class="mf-cc-body">
                    <h3 class="mf-cc-title">{{ t(card.titleKey) }}</h3>
                    <p class="mf-cc-desc">{{ t(card.descKey) }}</p>
                    <div class="mf-tags">
                      <span v-for="tk in card.tagKeys" :key="tk" class="mf-tag">{{ t(tk) }}</span>
                    </div>
                  </div>
                </template>

                <!-- 日记卡是另一种排版 -->
                <div v-else class="mf-diary-inner">
                  <p class="mf-diary-date">{{ t(card.dateKey) }}</p>
                  <p class="mf-diary-text">{{ t(card.textKey) }}</p>
                  <div class="mf-tags">
                    <span v-for="tk in card.tagKeys" :key="tk" class="mf-tag">{{ t(tk) }}</span>
                  </div>
                  <div class="mf-diary-imgs">
                    <span
                      v-for="(im, ii) in card.imgs"
                      :key="ii"
                      class="mf-diary-img"
                      :style="{ background: im.bg }"
                    >{{ im.text }}</span>
                  </div>
                </div>
              </article>
            </div>

            <!-- 日历视图 -->
            <div v-else data-mori-create-cal>
              <div class="mf-cal-head">
                <button class="mf-cal-nav" data-mori-prev-month @click="store.notify('toast.prevMonth')">
                  <LIcon name="chevronLeft" :size="16" />
                </button>
                <span class="mf-cal-month">{{ tf('cal.month', { year: MORI_CAL.year, month: MORI_CAL.month }) }}</span>
                <button class="mf-cal-nav" data-mori-next-month @click="store.notify('toast.nextMonth')">
                  <LIcon name="chevronRight" :size="16" />
                </button>
              </div>
              <div class="mf-cal-grid">
                <span v-for="w in MORI_CAL.weekdays" :key="w" class="mf-wd">{{ w }}</span>
                <span
                  v-for="(cell, i) in store.calCells"
                  :key="'c' + i"
                  class="mf-day"
                  :class="{ has: cell && store.hasContentDays.includes(cell), today: cell === MORI_CAL.today }"
                  :data-mori-cal-day="cell || ''"
                  @click="cell && store.notify('toast.dayTap', { month: MORI_CAL.month, day: cell })"
                >{{ cell || '' }}</span>
              </div>
              <p class="mf-section">{{ t('cal.sectionTitle') }}</p>
              <article
                v-for="(cc, ci) in MORI_CREATE_CAL_CARDS"
                :key="ci"
                class="mf-cc mf-cc-cal"
                :data-mori-cal-card="ci"
                @click="store.goto(cc.screen)"
              >
                <div class="mf-cc-thumb" :style="{ height: cc.height + 'px', background: cc.bg }">
                  <span class="mf-pill">{{ t(cc.pillKey) }}</span>
                  <LIcon v-if="cc.icon" :name="cc.icon" :size="cc.iconSize" />
                  <span v-if="cc.play" class="mf-play mf-play-sm2">
                    <LIcon name="play" :size="18" filled />
                  </span>
                </div>
                <div class="mf-cc-body">
                  <h3 class="mf-cc-title">{{ t(cc.titleKey) }}</h3>
                  <p class="mf-cc-desc">{{ t(cc.descKey) }}</p>
                </div>
              </article>
            </div>
          </div>
        </div>

        <!-- ---------------- TAB 2/4：空间 ---------------- -->
        <div v-else-if="store.tab === 'space'" class="mf-dcontent" data-mori-pane="space">
          <div class="mf-cal-head">
            <button class="mf-cal-nav" data-mori-space-prev @click="store.notify('toast.prevMonth')">
              <LIcon name="chevronLeft" :size="16" />
            </button>
            <span class="mf-cal-month">{{ tf('cal.month', { year: MORI_CAL.year, month: MORI_CAL.month }) }}</span>
            <button class="mf-cal-nav" data-mori-space-next @click="store.notify('toast.nextMonth')">
              <LIcon name="chevronRight" :size="16" />
            </button>
          </div>
          <div class="mf-cal-grid">
            <span v-for="w in MORI_CAL.weekdays" :key="'sw' + w" class="mf-wd">{{ w }}</span>
            <span
              v-for="(cell, i) in store.calCells"
              :key="'sc' + i"
              class="mf-day"
              :class="{
                has: cell && store.hasContentDays.includes(cell),
                today: cell === MORI_CAL.today,
                selected: cell === store.selectedDay
              }"
              :data-mori-space-day="cell || ''"
              @click="cell && store.selectDay(cell)"
            >{{ cell || '' }}</span>
          </div>

          <section data-mori-space-content>
            <p class="mf-section" data-mori-space-title>{{ store.selectedDayTitle }}</p>
            <div class="mf-eventlist">
              <template v-if="store.selectedDayData">
                <div v-for="(ev, ei) in store.selectedDayData.events" :key="ei" class="mf-event" :data-mori-event="ei">
                  <div class="mf-eh">
                    <span>{{ t(ev.locKey) }}</span>
                    <span class="mf-ecount">{{ tf('space.count', { n: ev.count }) }}</span>
                  </div>
                  <div class="mf-em">
                    <span
                      v-for="(it, ii) in ev.items"
                      :key="ii"
                      class="mf-emi"
                      :style="{ background: toneBg(it) }"
                    >
                      <LIcon v-if="it" :name="it.icon" :size="20" />
                    </span>
                  </div>
                </div>
              </template>
              <p v-else class="mf-empty-day" data-mori-space-empty>{{ t('space.empty') }}</p>
            </div>
          </section>
        </div>

        <!-- ---------------- TAB 3/4：录音 ---------------- -->
        <div v-else-if="store.tab === 'record'" class="mf-dcontent" data-mori-pane="record">
          <p class="mf-section">{{ t('recordList.section') }}</p>
          <div class="mf-audio-list">
            <button
              v-for="(a, ai) in MORI_AUDIO_ITEMS"
              :key="ai"
              class="mf-audio-item"
              :data-mori-audio="ai"
              @click="store.playAudio(t(a.titleKey))"
            >
              <span class="mf-aico" :style="{ background: a.aico }">
                <LIcon v-if="a.icon" :name="a.icon" :size="18" />
                <span class="mf-play-sm"><LIcon name="play" :size="16" filled /></span>
              </span>
              <span class="mf-acopy">
                <span class="mf-atitle">{{ t(a.titleKey) }}</span>
                <span class="mf-ameta">{{ t(a.metaKey) }}</span>
              </span>
              <span v-if="a.tail === 'hourglass'" class="mf-tail-warn"><LIcon name="loaderCircle" :size="12" /></span>
              <span v-else class="mf-arrow"><LIcon name="chevronRight" :size="18" /></span>
            </button>
          </div>
        </div>

        <!-- ---------------- TAB 4/4：设备 ---------------- -->
        <div v-else class="mf-dcontent" data-mori-pane="device">
          <!-- 设备状态卡 -->
          <div class="mf-hero">
            <span class="mf-hero-icon"><LIcon name="aperture" :size="28" /></span>
            <span class="mf-hero-main">
              <span class="mf-hero-name">{{ t('title') }}</span>
              <span class="mf-hero-status"><i class="mf-hero-dot" />{{ t('status.online') }}</span>
            </span>
            <span class="mf-hero-right">
              <span class="mf-hero-battery">{{ t('device.battery') }}</span>
              <span class="mf-hero-fw">{{ t('device.firmware') }}</span>
            </span>
          </div>

          <!-- 快捷操作 4 宫格 -->
          <div class="mf-quick">
            <button class="mf-quick-btn" data-mori-action="photo" @click="store.notify('toast.photoSent')">
              <LIcon name="aperture" :size="28" /><span>{{ t('action.photo') }}</span>
            </button>
            <button class="mf-quick-btn" data-mori-action="video" @click="store.notify('toast.videoSent')">
              <LIcon name="film" :size="28" /><span>{{ t('action.video') }}</span>
            </button>
            <button class="mf-quick-btn" data-mori-action="preview" @click="store.goto('preview')">
              <LIcon name="scanFace" :size="28" /><span>{{ t('action.preview') }}</span>
            </button>
            <button class="mf-quick-btn" data-mori-action="record" @click="store.goto('rec')">
              <LIcon name="micVocal" :size="28" /><span>{{ t('action.record') }}</span>
            </button>
          </div>

          <p class="mf-section">{{ t('device.section') }}</p>

          <!-- 折叠 1：设备素材 -->
          <section class="mf-settings">
            <button class="mf-collapse-head" data-mori-collapse="media" @click="store.toggleCollapse('media')">
              <span class="mf-ch-label"><LIcon name="folder" :size="15" />{{ t('device.mediaGroup') }}</span>
              <span class="mf-ch-right">
                <span class="mf-val">{{ t('device.mediaTotal') }}</span>
                <LIcon class="mf-arrow-ico" :class="{ open: store.collapsed.media }" name="chevronRight" :size="14" />
              </span>
            </button>
            <!-- grid-rows 过渡：高度自适应，不像归档那样被 max-height:600px 裁掉 -->
            <div class="mf-collapse-body" :class="{ open: store.collapsed.media }">
              <div class="mf-collapse-inner">
                <button
                  v-for="(row, ri) in MORI_MEDIA_BREAKDOWN"
                  :key="ri"
                  class="mf-row"
                  :data-mori-media-row="ri"
                  @click="store.goto('media')"
                >
                  <span class="mf-row-label"><LIcon :name="row.icon" :size="15" />{{ t(row.labelKey) }}</span>
                  <span class="mf-val">{{ t(row.tailKey) }} ›</span>
                </button>
              </div>
            </div>
          </section>

          <!-- 折叠 2：拍摄与同步设置（归档在此被裁掉 108px，「隐私」组永远看不全） -->
          <section class="mf-settings mf-mt1">
            <button class="mf-collapse-head" data-mori-collapse="settings" @click="store.toggleCollapse('settings')">
              <span class="mf-ch-label"><LIcon name="settings2" :size="15" />{{ t('device.settingsGroup') }}</span>
              <LIcon class="mf-arrow-ico" :class="{ open: store.collapsed.settings }" name="chevronRight" :size="14" />
            </button>
            <div class="mf-collapse-body" :class="{ open: store.collapsed.settings }">
              <div class="mf-collapse-inner">
                <template v-for="(grp, gi) in MORI_SETTINGS_GROUPS" :key="gi">
                  <p class="mf-group-title" :data-mori-group="gi">{{ t(grp.titleKey) }}</p>
                  <div v-for="(row, ri) in grp.rows" :key="ri" class="mf-row mf-row-static">
                    <span>{{ t(row.labelKey) }}</span>
                    <button
                      v-if="row.toggle"
                      class="mf-toggle"
                      :class="{ on: store.settings[row.toggle] }"
                      :data-mori-setting="row.toggle"
                      :aria-pressed="store.settings[row.toggle] ? 'true' : 'false'"
                      @click.stop="store.toggleSetting(row.toggle)"
                    >
                      <span class="mf-knob" />
                    </button>
                    <span v-else class="mf-val">{{ t(row.valKey) }} ›</span>
                  </div>
                </template>
              </div>
            </div>
          </section>

          <!-- 折叠 3：设备信息 -->
          <section class="mf-settings mf-mt12">
            <button class="mf-collapse-head" data-mori-collapse="info" @click="store.toggleCollapse('info')">
              <span class="mf-ch-label"><LIcon name="info" :size="15" />{{ t('device.infoGroup') }}</span>
              <LIcon class="mf-arrow-ico" :class="{ open: store.collapsed.info }" name="chevronRight" :size="14" />
            </button>
            <div class="mf-collapse-body" :class="{ open: store.collapsed.info }">
              <div class="mf-collapse-inner">
                <div v-for="(row, ri) in MORI_DEVICE_INFO" :key="ri" class="mf-row mf-row-static" :data-mori-info="ri">
                  <span>{{ t(row.labelKey) }}</span>
                  <span class="mf-val">{{ row.val }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 固件升级独立入口 -->
          <section class="mf-settings mf-mt12">
            <button class="mf-row" data-mori-upgrade @click="store.goto('ota')">
              <span class="mf-row-label"><LIcon name="rotateCw" :size="15" />{{ t('device.upgrade') }}</span>
              <span class="mf-upgrade-right">
                <span class="mf-badge">{{ tf('device.upgradeAvailable', { ver: MORI_OTA.version }) }}</span>
                <span class="mf-val">›</span>
              </span>
            </button>
          </section>

          <!-- 初始化向导入口（归档靠「双击标题」的 hack，这里换成显式条目） -->
          <section class="mf-settings mf-mt12">
            <button class="mf-row" data-mori-init-entry @click="store.startInit()">
              <span class="mf-row-label"><LIcon name="wandSparkles" :size="15" />{{ t('init.title') }}</span>
              <span class="mf-val">›</span>
            </button>
          </section>
        </div>
      </template>

      <!-- ================================================================
           初始化向导 · init（3 步，同一屏内互斥）
           ================================================================ -->
      <template v-else-if="store.screen === 'init'">
        <div class="mf-init">
          <div class="mf-dots">
            <span v-for="n in 3" :key="n" class="mf-dotx" :class="{ active: store.initStep === n }" />
          </div>
          <div class="mf-ic"><LIcon :name="MORI_INIT_STEPS[store.initStep - 1].icon" :size="64" /></div>
          <h2 class="mf-it">{{ t(MORI_INIT_STEPS[store.initStep - 1].titleKey) }}</h2>
          <p class="mf-id">
            {{ t(MORI_INIT_STEPS[store.initStep - 1].descKey) }}
            <template v-if="MORI_INIT_STEPS[store.initStep - 1].desc2Key">
              <br />{{ t(MORI_INIT_STEPS[store.initStep - 1].desc2Key) }}
            </template>
          </p>

          <!-- 第 3 步多一张 Wi-Fi 卡 -->
          <div v-if="store.initStep === 3" class="mf-settings mf-wifi-card">
            <div v-for="(w, wi) in MORI_WIFI_LIST" :key="wi" class="mf-row mf-row-static" :data-mori-wifi="wi">
              <span class="mf-row-label">
                <LIcon v-if="w.icon" name="wifi" :size="15" />{{ t(w.ssidKey) }}
              </span>
              <span :class="w.tone === 'ok' ? 'mf-ok-small' : 'mf-val'">{{ t(w.tailKey) }}</span>
            </div>
          </div>

          <button
            class="mf-btn pr"
            :data-mori-init-step="store.initStep"
            data-mori-init-primary
            @click="onInitPrimary(MORI_INIT_STEPS[store.initStep - 1])"
          >
            {{ t(MORI_INIT_STEPS[store.initStep - 1].primaryKey) }}
          </button>
          <div v-if="MORI_INIT_STEPS[store.initStep - 1].secondaryKey" class="mf-gap12">
            <button
              class="mf-btn se"
              data-mori-init-secondary
              @click="onInitSecondary(MORI_INIT_STEPS[store.initStep - 1])"
            >
              {{ t(MORI_INIT_STEPS[store.initStep - 1].secondaryKey) }}
            </button>
          </div>
        </div>
      </template>

      <!-- ================================================================
           实时预览 · preview
           ================================================================ -->
      <template v-else-if="store.screen === 'preview'">
        <div class="mf-preview">
          <div class="mf-cv">{{ t('preview.placeholder') }}</div>
        </div>
        <div class="mf-pc">
          <button class="mf-round sub" data-mori-preview-mode @click="store.notify('toast.modeSwitch')">
            <LIcon name="aperture" :size="28" />
          </button>
          <button
            class="mf-shutter"
            :class="{ rec: store.shutterRec }"
            data-mori-preview-shutter
            :aria-label="t('preview.shutter')"
            @click="onPreviewShutter"
          />
          <button class="mf-round sub" data-mori-preview-video @click="store.notify('toast.videoSwitch')">
            <LIcon name="film" :size="28" />
          </button>
        </div>
        <section class="mf-settings mf-preview-mode">
          <div class="mf-row mf-row-static">
            <span>{{ t('preview.mode') }}</span>
            <span class="mf-val">{{ t('preview.modeVal') }}</span>
          </div>
        </section>
      </template>

      <!-- ================================================================
           录音 · rec（计时真的走秒，归档是写死不走）
           ================================================================ -->
      <template v-else-if="store.screen === 'rec'">
        <div class="mf-rec-top">
          <h2 class="mf-rec-name">{{ t('rec.recording') }}</h2>
          <div class="mf-wave">
            <span v-for="(d, i) in waveBars" :key="i" class="mf-bar" :style="{ animationDelay: d + 's' }" />
          </div>
          <div class="mf-rtime" data-mori-rec-time>{{ store.recTimeText }}</div>
          <p class="mf-val mf-rec-status">{{ store.recPaused ? t('rec.paused') : t('rec.status') }}</p>
        </div>
        <div class="mf-recbtns">
          <button class="mf-round sub" data-mori-rec-pause @click="store.toggleRecPause(); store.notify('toast.pauseResume')">
            <LIcon v-if="store.recPaused" name="play" :size="28" filled />
            <LIcon v-else name="pause" :size="28" filled />
          </button>
          <button class="mf-round main" data-mori-rec-stop @click="store.notify('toast.stopSave')">
            <LIcon name="square" :size="26" filled />
          </button>
        </div>
        <p class="mf-section">{{ t('rec.transcriptSection') }}</p>
        <div v-for="(tr, ti) in recLines" :key="ti" class="mf-transcript" :data-mori-transcript="ti">
          <p class="mf-spk">{{ tf('rec.spk', { n: tr.spk, time: tr.time }) }}</p>
          <p class="mf-txt">{{ t(tr.txtKey) }}</p>
        </div>
      </template>

      <!-- ================================================================
           设备素材 · media
           ================================================================ -->
      <template v-else-if="store.screen === 'media'">
        <template v-for="(day, di) in MORI_MEDIA_DAYS" :key="di">
          <p class="mf-section">{{ t(day.dateKey) }}</p>
          <div class="mf-mgrid">
            <button
              v-for="(it, ii) in day.items"
              :key="ii"
              class="mf-mthumb"
              :style="{ background: it.bg }"
              :data-mori-thumb="di + '-' + ii"
              @click="store.notify(it.toast)"
            >
              <LIcon :name="it.icon" :size="24" />
            </button>
          </div>
        </template>
        <p class="mf-footnote">{{ t('media.footnote') }}</p>
      </template>

      <!-- ================================================================
           每日 Vlog · vlog
           ================================================================ -->
      <template v-else-if="store.screen === 'vlog'">
        <button
          class="mf-vlog-cover"
          :style="{ height: MORI_VLOG.cover.height + 'px', background: MORI_VLOG.cover.bg }"
          data-mori-vlog-cover
          @click="store.notify('toast.playVideo')"
        >
          <LIcon name="play" :size="54" filled />
        </button>
        <div class="mf-pad16">
          <h2 class="mf-h18">{{ t(MORI_VLOG.dateKey) }}</h2>
          <p class="mf-sub14 mf-mt8">{{ t(MORI_VLOG.descKey) }}</p>
        </div>
        <p class="mf-section">{{ t('vlog.sceneSection') }}</p>
        <div class="mf-tags mf-pad-x">
          <span v-for="sk in MORI_VLOG.sceneKeys" :key="sk" class="mf-tag">{{ t(sk) }}</span>
        </div>
        <div class="mf-pad16">
          <button class="mf-btn pr" data-mori-vlog-save @click="store.notify('toast.saved')">{{ t('vlog.save') }}</button>
        </div>
      </template>

      <!-- ================================================================
           AI 艺术馆 · gallery
           ================================================================ -->
      <template v-else-if="store.screen === 'gallery'">
        <div class="mf-gallery-top">
          <LIcon :name="MORI_GALLERY.icon" :size="80" />
          <h2 class="mf-h18 mf-mt12">{{ t(MORI_GALLERY.headlineKey) }}</h2>
          <p class="mf-sub14 mf-mt8">{{ t(MORI_GALLERY.subKey) }}</p>
        </div>
        <div class="mf-pad-x">
          <div class="mf-poster" :style="{ height: MORI_GALLERY.poster.height + 'px', background: MORI_GALLERY.poster.bg }">
            <LIcon :name="MORI_GALLERY.poster.icon" :size="64" />
          </div>
          <p class="mf-gallery-text">{{ t(MORI_GALLERY.textKey) }}</p>
        </div>
        <div class="mf-two-btns">
          <button class="mf-btn pr" data-mori-gallery-save @click="store.notify('toast.saved')">{{ t('gallery.save') }}</button>
          <button class="mf-btn se" data-mori-gallery-share @click="store.notify('toast.share')">{{ t('gallery.share') }}</button>
        </div>
      </template>

      <!-- ================================================================
           AI 图文日记 · diary
           ================================================================ -->
      <template v-else-if="store.screen === 'diary'">
        <div class="mf-pad16">
          <p class="mf-diary-date">{{ t(MORI_DIARY.dateKey) }}</p>
          <p class="mf-diary-body">{{ t(MORI_DIARY.textKey) }}</p>
          <div class="mf-tags mf-mt12">
            <span v-for="tk in MORI_DIARY.tagKeys" :key="tk" class="mf-tag">{{ t(tk) }}</span>
          </div>
          <div class="mf-diary-imgs mf-mt16">
            <span v-for="(im, ii) in MORI_DIARY.imgs" :key="ii" class="mf-diary-img lg" :style="{ background: im.bg }">{{ im.text }}</span>
          </div>
        </div>
        <div class="mf-pad16">
          <button class="mf-btn pr" data-mori-diary-copy @click="store.notify('toast.copied')">{{ t('diary.copy') }}</button>
        </div>
      </template>

      <!-- ================================================================
           固件升级 · ota（归档进度条无样式 ⇒ 这里补齐并真的推进）
           ================================================================ -->
      <template v-else-if="store.screen === 'ota'">
        <div class="mf-ota-top">
          <LIcon name="rotateCw" :size="64" />
          <h2 class="mf-h18 mf-mt16">{{ t('ota.headline') }}</h2>
          <p class="mf-ota-ver">{{ MORI_OTA.version }}</p>
          <p class="mf-sub14">{{ tf('ota.current', { ver: MORI_OTA.current }) }}</p>
          <div class="mf-ota-card">
            <p class="mf-ota-cl-title">{{ t('ota.changelogTitle') }}</p>
            <ul class="mf-ota-list">
              <li v-for="ck in MORI_OTA.changelogKeys" :key="ck">{{ t(ck) }}</li>
            </ul>
          </div>
          <p class="mf-sub14">{{ tf('ota.size', { size: MORI_OTA.size }) }}</p>
          <div class="mf-storage" data-mori-ota-bar>
            <span class="mf-fill" :style="{ width: store.otaProgress + '%' }" />
          </div>
          <p class="mf-ota-pct" data-mori-ota-pct>{{ store.otaProgress }}%</p>
          <button class="mf-btn pr mf-mt24" data-mori-ota-start @click="store.startOta()">{{ t('ota.start') }}</button>
        </div>
      </template>
    </div>

    <!-- ============ 播放条（v-if —— 修归档「永远可见、关不掉」的缺陷）============ -->
    <div v-if="store.playerVisible" class="mf-player" data-mori-player>
      <span class="mf-pico"><LIcon name="micVocal" :size="18" /></span>
      <span class="mf-pinfo">
        <span class="mf-ptitle" data-mori-player-title>{{ store.player || t('player.playing') }}</span>
        <span class="mf-pwave">
          <span v-for="(d, i) in playerBars" :key="i" :style="{ animationDelay: d + 's' }" />
        </span>
      </span>
      <button class="mf-pclose" data-mori-player-close :aria-label="t('player.close')" @click="store.stopAudio()">
        <LIcon name="x" :size="18" />
      </button>
    </div>

    <!-- ============ toast ============ -->
    <div v-if="store.toast" class="mf-toast show" data-mori-toast>{{ tf(store.toast.key, store.toast.params) }}</div>
  </div>
</template>

<style scoped>
/* ============================================================
 * 归档 `:root` 变量表（§5.1）逐字抄到流程根上 —— 这套色板是
 * Mori 这台设备的视觉识别（`DEVICE_TYPES.mori.color` 就是 #6C5CE7），
 * 与同批的 RecorderFlow 保持同一做法（色板 scoped 到流程根，不外溢）。
 * ============================================================ */
.mf-root {
  --p: #6c5ce7;
  --p2: #a29bfe;
  --s: #00b894;
  --w: #fdcb6e;
  --d: #e17055;
  --bg: #f8f9fa;
  --card: #fff;
  --txt: #2d3436;
  --sub: #636e72;
  --muted: #b2bec3;
  --bd: #e9ecef;
  --sh: 0 2px 12px rgba(0, 0, 0, 0.08);

  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--txt);
}
.mf-root,
.mf-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.mf-root,
.mf-root button,
.mf-root input {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ---------- 头部：高度必须 ≥ 64px 才让得开顶部边缘手势热区 ---------- */
.mf-head {
  height: calc(var(--safe-top, 44px) + 52px);
  padding: var(--safe-top, 44px) 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border-bottom: 1px solid var(--bd);
  flex: none;
}
.mf-back {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--txt);
  flex: none;
  cursor: pointer;
}
.mf-back:active { background: rgba(0, 0, 0, 0.05); }
.mf-title {
  flex: 1;
  margin: 0;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: var(--txt);
}
.mf-spacer { width: 36px; flex: none; }

/* ---------- 内容区 ---------- */
.mf-body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
.mf-body::-webkit-scrollbar { display: none; }

/* ---------- 顶部 4 段式分段控件 ---------- */
.mf-dtabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid var(--bd);
  position: sticky;
  top: 0;
  z-index: 8;
}
.mf-dtab {
  flex: 1;
  border: 0;
  background: none;
  padding: 12px 0;
  font-size: 14px;
  color: var(--sub);
  position: relative;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}
.mf-dtab.active { color: var(--p); font-weight: 700; }
.mf-dtab.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  border-radius: 2px;
  background: var(--p);
}

/* 4 个 tab 的内容区：底部让开 home-indicator（归档写 padding-bottom:100px，但用的是
   假 83px tabbar 的偏移；本仓手势条 z-index 96 在应用窗口之上，必须按手势区让位） */
.mf-dcontent { padding-bottom: calc(100px + var(--home-indicator-zone, 34px)); }

/* ---------- 创作 tab ---------- */
.mf-calwrap { position: relative; }
.mf-caltoggle {
  position: absolute;
  right: 16px;
  top: 12px;
  z-index: 2;
  border: 0;
  background: var(--bd);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: var(--txt);
  cursor: pointer;
}
.mf-cc {
  margin: 0 16px 14px;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--sh);
  cursor: pointer;
}
.mf-cc:active { opacity: 0.95; }
.mf-cc-thumb {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #fff;
}
.mf-pill {
  position: absolute;
  left: 12px;
  top: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.mf-dur {
  position: absolute;
  right: 12px;
  bottom: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.mf-play {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: grid;
  place-items: center;
  color: #333;
}
.mf-play-sm2 { width: 44px; height: 44px; }
.mf-cc-body { padding: 14px 16px; }
.mf-cc-title { margin: 0 0 4px; font-size: 15px; font-weight: 700; }
.mf-cc-desc { margin: 0; font-size: 13px; color: var(--sub); line-height: 1.5; }
.mf-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.mf-tag {
  padding: 3px 10px;
  border-radius: 12px;
  background: #f0efff;
  color: var(--p);
  font-size: 11px;
  font-weight: 600;
}
/* 日记卡（归档 .diary 自带 padding:16px，这里内层承载） */
.mf-diary-inner { padding: 16px; }
.mf-diary-date { margin: 0 0 8px; font-size: 12px; color: var(--muted); }
.mf-diary-text { margin: 0; font-size: 14px; line-height: 1.7; }
.mf-diary-imgs { display: flex; gap: 8px; margin-top: 12px; }
.mf-diary-img {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 28px;
}
.mf-diary-img.lg { width: 100px; height: 100px; }

/* ---------- 日历 ---------- */
.mf-cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}
.mf-cal-month { font-size: 18px; font-weight: 800; }
.mf-cal-nav {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 0;
  background: var(--bd);
  display: grid;
  place-items: center;
  color: var(--txt);
  cursor: pointer;
}
.mf-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 0 16px 16px;
}
.mf-wd { font-size: 12px; color: var(--muted); text-align: center; padding: 8px 0; }
.mf-day {
  aspect-ratio: 1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 14px;
  position: relative;
  cursor: pointer;
}
.mf-day.has { color: var(--p); font-weight: 700; }
.mf-day.has::after {
  content: '';
  position: absolute;
  bottom: 4px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--p);
}
.mf-day.today { background: var(--p); color: #fff; font-weight: 700; }
.mf-day.today::after { background: #fff; }
.mf-day.selected { background: var(--p2); color: #fff; font-weight: 700; }
.mf-day.selected::after { background: #fff; }

/* ---------- 空间事件卡 ---------- */
.mf-eventlist { min-height: 60px; }
.mf-event {
  margin: 0 16px 10px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
.mf-eh {
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--sub);
}
.mf-ecount { color: var(--p); }
.mf-em { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
.mf-emi { aspect-ratio: 1; display: grid; place-items: center; color: #fff; }
.mf-empty-day { padding: 40px; text-align: center; color: var(--muted); margin: 0; }

/* ---------- 录音列表 ---------- */
.mf-audio-list {
  margin: 0 16px 16px;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--sh);
}
.mf-audio-item {
  width: 100%;
  padding: 14px 16px;
  border: 0;
  border-bottom: 1px solid var(--bd);
  background: none;
  display: flex;
  align-items: center;
  text-align: left;
  cursor: pointer;
}
.mf-audio-item:last-child { border-bottom: 0; }
.mf-audio-item:active { background: #f5f5f5; }
.mf-aico {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  margin-right: 12px;
  flex: none;
  position: relative;
  color: #fff;
}
.mf-play-sm {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  color: #fff;
  opacity: 0;
  transition: opacity 0.15s;
}
.mf-audio-item:hover .mf-play-sm { opacity: 1; }
.mf-acopy { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.mf-atitle { font-size: 15px; font-weight: 600; }
.mf-ameta { font-size: 12px; color: var(--sub); margin-top: 3px; }
.mf-arrow { margin-left: auto; color: var(--muted); display: inline-flex; }
.mf-tail-warn { margin-left: auto; color: var(--w); display: inline-flex; }

/* ---------- 设备 tab ---------- */
.mf-hero {
  background: linear-gradient(135deg, var(--p), var(--p2));
  padding: 20px 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 14px;
}
.mf-hero-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.2);
  display: grid;
  place-items: center;
  flex: none;
}
.mf-hero-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.mf-hero-name { font-size: 20px; font-weight: 800; }
.mf-hero-status {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.mf-hero-dot { width: 8px; height: 8px; background: #55efc8; border-radius: 50%; display: inline-block; }
.mf-hero-right { text-align: right; display: flex; flex-direction: column; }
.mf-hero-battery { font-size: 24px; font-weight: 800; }
.mf-hero-fw { font-size: 12px; opacity: 0.7; }
.mf-quick { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px; }
.mf-quick-btn {
  background: #fff;
  border-radius: 14px;
  box-shadow: var(--sh);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  gap: 8px;
  border: 0;
  cursor: pointer;
  color: var(--txt);
}
.mf-quick-btn span { font-size: 12px; color: var(--sub); }
.mf-quick-btn:active { background: #f5f5f5; }

/* ---------- 设置组 / 折叠 ---------- */
.mf-section { margin: 0; padding: 18px 16px 8px; font-size: 15px; font-weight: 700; color: var(--sub); }
.mf-settings {
  margin: 0 16px 16px;
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--sh);
}
.mf-mt1 { margin-top: 1px; }
.mf-mt12 { margin-top: 12px; }
.mf-row {
  width: 100%;
  padding: 15px 16px;
  border: 0;
  border-bottom: 1px solid var(--bd);
  background: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  color: var(--txt);
  cursor: pointer;
  text-align: left;
}
.mf-row:last-child { border-bottom: 0; }
.mf-row:active { background: #f5f5f5; }
.mf-row-static { cursor: default; }
.mf-row-static:active { background: none; }
.mf-row-label { display: inline-flex; align-items: center; gap: 8px; }
.mf-val { color: var(--sub); font-size: 14px; }
.mf-ok-small { color: var(--s); font-size: 12px; }
.mf-group-title {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 700;
  color: var(--p);
  background: #fff;
}
.mf-collapse-head {
  width: 100%;
  padding: 15px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: #fff;
  border: 0;
  border-bottom: 1px solid var(--bd);
  font-size: 15px;
  color: var(--txt);
}
.mf-collapse-head:active { background: #f5f5f5; }
.mf-ch-label { display: inline-flex; align-items: center; gap: 8px; }
.mf-ch-right { display: inline-flex; align-items: center; gap: 8px; }
.mf-arrow-ico { color: var(--muted); transition: transform 0.2s; }
.mf-arrow-ico.open { transform: rotate(90deg); }
/* ⚠️ 归档用的是 `max-height:600px`，把 708px 的内容裁掉 108px（「隐私」组永远看不全）。
   这里给足余量：实测最长的一块（「拍摄与同步设置」）内容高 708px，1200px 留约 70% 余量。
   （试过 `grid-template-rows: 0fr→1fr`，但容器高度是 auto 时行高仍被压掉 42px，实测 666 vs 708。）
   e2e 里有一条「末行在容器内」的断言兜住这个数值。 */
.mf-collapse-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s;
}
.mf-collapse-body.open { max-height: 1200px; }
.mf-collapse-inner { min-height: 0; }
.mf-upgrade-right { display: inline-flex; align-items: center; gap: 8px; }
.mf-badge { color: var(--s); font-size: 12px; }

/* ---------- 开关（归档 .toggle，48×28） ---------- */
.mf-toggle {
  width: 48px;
  height: 28px;
  background: #dfe6e9;
  border-radius: 14px;
  position: relative;
  flex: none;
  cursor: pointer;
  border: 0;
  padding: 0;
}
.mf-toggle.on { background: var(--s); }
.mf-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}
.mf-toggle.on .mf-knob { transform: translateX(20px); }

/* ---------- 初始化向导 ---------- */
.mf-init {
  padding: 40px 24px calc(40px + var(--home-indicator-zone, 34px));
  text-align: center;
}
.mf-dots { display: flex; justify-content: center; gap: 8px; margin-bottom: 24px; }
.mf-dotx { width: 8px; height: 8px; border-radius: 50%; background: var(--bd); }
.mf-dotx.active { background: var(--p); width: 24px; border-radius: 4px; }
.mf-ic { color: var(--p); margin-bottom: 16px; display: flex; justify-content: center; }
.mf-it { margin: 0 0 8px; font-size: 22px; font-weight: 800; }
.mf-id { margin: 0 0 28px; font-size: 15px; color: var(--sub); line-height: 1.6; }
.mf-wifi-card { margin: 0 0 16px; text-align: left; }
.mf-gap12 { height: 12px; }
.mf-btn {
  border: 0;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
}
.mf-btn.pr { background: var(--p); color: #fff; }
.mf-btn.se { background: var(--bd); color: var(--txt); }

/* ---------- 实时预览 ---------- */
.mf-preview { height: 300px; background: #000; display: flex; align-items: center; justify-content: center; }
.mf-cv {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #2d3436, #636e72);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 14px;
}
.mf-pc { display: flex; justify-content: center; gap: 32px; padding: 24px; background: #000; }
.mf-round {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 0;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.mf-round.main { background: var(--d); color: #fff; box-shadow: 0 4px 15px rgba(225, 112, 85, 0.35); }
.mf-round.sub { background: var(--bd); color: var(--txt); }
.mf-shutter {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 4px solid #fff;
  background: none;
  position: relative;
  cursor: pointer;
}
.mf-shutter::after {
  content: '';
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #fff;
  transition: all 0.1s;
}
.mf-shutter.rec::after { background: var(--d); width: 28px; height: 28px; border-radius: 8px; }
.mf-preview-mode { margin: 16px; }
.mf-preview-mode .mf-row { border-bottom: 0; }

/* ---------- 录音屏 ---------- */
.mf-rec-top { padding: 24px 16px 8px; text-align: center; }
.mf-rec-name { margin: 0; font-size: 18px; font-weight: 800; }
.mf-wave { display: flex; gap: 3px; align-items: center; height: 60px; margin: 18px 0; justify-content: center; }
.mf-bar {
  width: 4px;
  background: var(--p);
  border-radius: 2px;
  animation: mf-w 0.8s ease-in-out infinite;
}
.mf-bar:nth-child(2) { animation-delay: 0.1s; }
.mf-bar:nth-child(3) { animation-delay: 0.2s; }
.mf-bar:nth-child(4) { animation-delay: 0.3s; }
.mf-bar:nth-child(5) { animation-delay: 0.4s; }
@keyframes mf-w {
  0%, 100% { height: 10px; opacity: 0.4; }
  50% { height: 40px; opacity: 1; }
}
.mf-rtime {
  font-size: 42px;
  font-weight: 300;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.mf-rec-status { margin: 6px 0 0; }
.mf-recbtns { display: flex; justify-content: center; gap: 24px; padding: 24px 0; }
.mf-transcript {
  padding: 12px 16px;
  margin: 0 16px 8px;
  background: #fff;
  border-radius: 12px;
  box-shadow: var(--sh);
}
.mf-spk { margin: 0 0 4px; font-size: 12px; font-weight: 700; color: var(--p); }
.mf-txt { margin: 0; font-size: 14px; line-height: 1.6; }

/* ---------- 设备素材 ---------- */
.mf-mgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; padding: 0 16px; }
.mf-mthumb {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 4px;
  cursor: pointer;
  border: 0;
  color: #fff;
}
.mf-footnote {
  margin: 0;
  padding: 16px calc(16px + var(--home-indicator-zone, 34px)) calc(16px + var(--home-indicator-zone, 34px));
  font-size: 13px;
  color: var(--sub);
}

/* ---------- Vlog / 艺术馆 / 日记 ---------- */
.mf-pad16 { padding: 16px; }
.mf-pad-x { padding: 0 16px; display: flex; gap: 8px; flex-wrap: wrap; }
.mf-mt8 { margin-top: 8px; }
.mf-mt12 { margin-top: 12px; }
.mf-mt16 { margin-top: 16px; }
.mf-mt24 { margin-top: 24px; }
.mf-h18 { margin: 0; font-size: 18px; font-weight: 800; }
.mf-sub14 { margin: 0; font-size: 14px; color: var(--sub); line-height: 1.6; }
.mf-vlog-cover {
  width: 100%;
  border: 0;
  display: grid;
  place-items: center;
  color: #fff;
  cursor: pointer;
}
.mf-gallery-top { padding: 16px; text-align: center; color: var(--p); }
.mf-poster {
  border-radius: 16px;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  color: #fff;
}
.mf-gallery-text { margin: 0 0 16px; font-size: 14px; line-height: 1.7; }
.mf-two-btns { padding: 0 16px calc(16px + var(--home-indicator-zone, 34px)); display: flex; gap: 12px; }
.mf-two-btns .mf-btn { flex: 1; }
.mf-diary-body { margin: 0; font-size: 15px; line-height: 1.8; }

/* ---------- 固件升级 ---------- */
.mf-ota-top {
  padding: 40px 24px calc(40px + var(--home-indicator-zone, 34px));
  text-align: center;
  color: var(--p);
}
.mf-ota-top .mf-h18 { color: var(--txt); }
.mf-ota-top .mf-sub14 { color: var(--sub); }
.mf-ota-ver { margin: 16px 0; font-size: 36px; font-weight: 800; color: var(--p); }
.mf-ota-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  text-align: left;
  margin: 0 0 24px;
  box-shadow: var(--sh);
}
.mf-ota-cl-title { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: var(--txt); }
.mf-ota-list { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.8; color: var(--sub); }
/* ⚠️ 归档的 `.storage/.fill` 在样式表里**完全没有定义** ⇒ 进度条不可见。这里补齐。 */
.mf-storage {
  height: 6px;
  border-radius: 3px;
  background: var(--bd);
  overflow: hidden;
  margin-bottom: 8px;
}
.mf-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--p);
  transition: width 0.12s linear;
}
.mf-ota-pct { margin: 0; font-size: 12px; color: var(--sub); }

/* ---------- 播放条 ---------- */
.mf-player {
  position: absolute;
  left: 0;
  right: 0;
  /* 让开 home-indicator 手势区（z 96 在应用窗口之上，压不住的） */
  bottom: calc(var(--home-indicator-zone, 34px));
  background: #fff;
  border-top: 1px solid var(--bd);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 8;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
}
.mf-pico {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #fd79a8, #e84393);
  display: grid;
  place-items: center;
  flex: none;
  color: #fff;
}
.mf-pinfo { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.mf-ptitle {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mf-pwave { display: flex; gap: 3px; align-items: center; height: 20px; margin-top: 6px; }
.mf-pwave span {
  width: 3px;
  background: var(--p);
  border-radius: 2px;
  animation: mf-pw 0.6s ease-in-out infinite;
}
@keyframes mf-pw {
  0%, 100% { height: 6px; opacity: 0.4; }
  50% { height: 16px; opacity: 1; }
}
.mf-pclose {
  border: 0;
  background: none;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  display: inline-flex;
}

/* ---------- toast ---------- */
.mf-toast {
  position: absolute;
  top: 70px;
  left: 50%;
  transform: translateX(-50%) translateY(-18px);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px 18px;
  border-radius: 20px;
  font-size: 14px;
  opacity: 0;
  transition: 0.25s;
  z-index: 20;
  pointer-events: none;
  max-width: 80%;
  text-align: center;
}
.mf-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
</style>
