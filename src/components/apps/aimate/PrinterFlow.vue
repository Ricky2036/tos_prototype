<script setup>
/**
 * AI Mate · 口袋打印机（按归档 `ai-mate-printer-demo.html` 逐屏重放）
 * ==================================================================
 * 归档是单文件原型：7 个 `.screen`（home / device / gallery / editor / ar /
 * camera / my）+ 1 个 `progress-modal`，逻辑全是全局函数。
 * 这里做的是**语义重放**而不是整文件搬运：
 *   · 页面集合、交互序列、几何与配色照抄归档；
 *   · 文案走 `src/locales/aimate.js`，状态走 Pinia，图标走 `ui/`，
 *     e2e 钩子一律 `data-*`；
 *   · **只去掉重复的外壳** —— 归档的 `.stage / .story / .phone-frame /
 *     .phone / .statusbar / .bottom-nav` 以及 `home-screen` / `my-screen`
 *     是本仓库既有的机身、状态栏、底部 Tab、首页与「我的」，一律不搬。
 *
 * 屏映射：
 *   device-screen  → device   迷你设备卡 + 打印段 + 设备管理段（同屏平铺）
 *   gallery-screen → gallery  4 个相册分组 + 单选
 *   editor-screen  → editor   暗色舞台 + 5 个工具面板
 *   ar-screen      → ar       三步向导
 *   camera-screen  → camera   拍照 / AR 扫描
 *   progress-modal → 打印进度（归档漏加 `open` 类，这里接通）
 *
 * ⚠️ 归档里 device / gallery / ar 是浅色、editor / camera 是暗色。
 *    `AppNavBar` 只有浅色一版，所以暗色两屏用归档自己的头部，
 *    但高度一律走 `calc(var(--safe-top) + 52px)` —— 低于它就会落进
 *    `ScreenView` 顶部 64px 的边缘手势热区（`.edge-zone`），返回键点不动。
 *
 * ⚠️ 浮层一律 `position: absolute`：`fixed` 的包含块会落到外层机身
 *    （实测 392×820）而不是屏幕（360×788），四边各偏 16px。
 *
 * ⚠️ 字号下限 12px：归档满屏 9–11px 的标签在真机上读不清，
 *    统一按本仓排版阶梯抬到 12 / 13 / 15 / 17px。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18nStore } from '../../../stores/i18nStore'
import {
  useAiMateStore, PHOTO_GROUPS, PRINTER_PHOTOS, EDIT_CROPS, EDIT_LAYOUTS, EDIT_FRAMES,
  PRINT_FILTERS, EDIT_TOOLS, PRINT_QUALITIES, PRINT_COLORS, QUEUE_MAX, PAPER_MAX,
  PRINT_STAGE_BOUNDS, PRINT_TICK_MS, AR_VIDEO
} from '../../../stores/aiMateStore'
import LIcon from '../../ui/LIcon.vue'
import AppNavBar from '../../ui/AppNavBar.vue'

const emit = defineEmits(['close'])

const i18n = useI18nStore()
const mate = useAiMateStore()
const am = (p) => i18n.am(p)
/** `{n}` 这类占位符统一在调用点替换（本仓 i18n 没有插值机制） */
const fill = (s, o) => String(s ?? '').replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''))

/* ---------- 映射表 ---------- */
const TOOL_ICONS = { crop: 'crop', layout: 'layoutTemplate', frame: 'frame', filter: 'palette', adjust: 'slidersHorizontal' }
const SOURCE_ICONS = { gallery: 'images', camera: 'aperture', ar: 'video' }
/** 归档的滤镜类名（亮度走 CSS 变量 `--brightness`，见样式里的 `.pf-photo-art`） */
const FILTER_CLASS = { original: '', sunny: 'filter-warm', oldfilm: 'filter-film', mono: 'filter-mono' }
/** 归档的相框类名（`frame-dot` / `frame-film` 是归档原类名） */
const FRAME_CLASS = { none: '', dot: 'frame-dot', film: 'frame-film', handwrite: 'frame-hand' }
/** AR 第 2 步「最近照片」三张（归档实测：海边 / 森林 / 生日） */
const AR_RECENT = ['p1', 'p3', 'p6']
/** 归档 crop pane 的前三项是单选，第四项是「旋转」动作 */
const LAYOUT_ITEMS = EDIT_LAYOUTS

const photoById = (id) => PRINTER_PHOTOS.find((p) => p.id === id) || null
const cover = computed(() => mate.selectedPhoto)
const deviceBattery = computed(() => mate.printDevice?.battery ?? 0)
/** 设备显示名：昵称优先（归档所有 `.js-device-name` 改的就是它） */
const deviceName = computed(() => mate.printDevice?.nick || am('deviceTitle.printer'))
const groups = computed(() => PHOTO_GROUPS.map((g) => ({
  id: g,
  label: am('printer.group.' + g),
  n: PRINTER_PHOTOS.filter((p) => p.groups.includes(g)).length
})))

/* ---------- 编辑器预览：归档 `.print-photo` / `.photo-art` 的类组合 ---------- */
const artClass = computed(() => ['pf-photo-art', FILTER_CLASS[mate.editFilter]].filter(Boolean))
const artStyle = computed(() => ({ '--brightness': String(mate.editBrightness / 100) }))
const photoClass = computed(() => [
  'pf-print-photo',
  FRAME_CLASS[mate.editFrame],
  mate.editLayout === 'border' && mate.editWhiteBorder ? 'with-border' : '',
  'crop-' + mate.editCrop,
  'lay-' + mate.editLayout
].filter(Boolean))
const gridCount = computed(() => (mate.editLayout === 'grid4' ? 4 : mate.editLayout === 'grid2' ? 2 : 1))
/** 拼图模式下同一张照片重复排布 */
const gridShots = computed(() => Array.from({ length: gridCount.value }, (_, i) => i))

/* ---------- 队列状态文案（归档 `queue-status` 三档） ---------- */
const queueStatus = computed(() => {
  if (mate.queueSending) {
    return am(mate.queueKind === 'ar' ? 'printer.queueStatusPrintingAr' : 'printer.queueStatusPrinting')
  }
  if (mate.queuePhase === 'done') {
    return am(mate.queueKind === 'ar' ? 'printer.queueStatusDoneAr' : 'printer.queueStatusDone')
  }
  return am('printer.queueStatusIdle')
})

/* ---------- 打印进度模态 ---------- */
const progressStage = computed(() => (
  mate.printProgress < PRINT_STAGE_BOUNDS[0]
    ? am('printer.stageTransfer')
    : mate.printProgress < PRINT_STAGE_BOUNDS[1]
      ? am('printer.stageDevelop')
      : am('printer.stageCut')
))
const progressTime = computed(() => (
  mate.printProgress < 70
    ? fill(am('printer.timeLeft'), { n: Math.max(3, Math.round((100 - mate.printProgress) * 0.4)) })
    : am('printer.timeSoon')
))
const doneCopy = computed(() => am(mate.printKind === 'ar' ? 'printer.printDoneCopyAr' : 'printer.printDoneCopy'))
const doneAction = computed(() => am(mate.printKind === 'ar' ? 'printer.tryAr' : 'printer.finish'))

/* ---------- AR 裁剪区间（归档是静态装饰，这里接上真实拖动） ---------- */
const arTrack = ref(null)
const trimLeftPct = computed(() => (mate.arTrimStart / AR_VIDEO.duration) * 100)
const trimRightPct = computed(() => (mate.arTrimEnd / AR_VIDEO.duration) * 100)
function dragTrim(which, e) {
  const el = arTrack.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const move = (ev) => {
    const x = Math.max(0, Math.min(rect.width, ev.clientX - rect.left))
    const sec = (x / rect.width) * AR_VIDEO.duration
    if (which === 'start') mate.setArTrim(Math.min(sec, mate.arTrimEnd - 1), mate.arTrimEnd)
    else mate.setArTrim(mate.arTrimStart, Math.max(sec, mate.arTrimStart + 1))
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  move(e)
}
/** 归档时间轴刻度写法：`00:04` */
function fmtSec(v) {
  return '00:' + String(Math.max(0, Math.round(v))).padStart(2, '0')
}

/* ---------- 定时器 ---------- */
/* 进度模态：归档只写了 renderProgress，没有驱动源；节奏取 60ms × 1.5 ≈ 4 秒 */
let printTicker = null
watch(
  () => [mate.printModalOpen, mate.printPaused, mate.printDone],
  () => {
    clearInterval(printTicker)
    if (mate.printModalOpen && !mate.printPaused && !mate.printDone) {
      printTicker = setInterval(() => mate.tickPrint(), PRINT_TICK_MS)
    }
  },
  { immediate: true }
)

/* 队列的「后台打印」：归档 `startPrint` 里那个 4.8 秒的 setTimeout */
let queueTimer = null
watch(() => mate.queueSending, (on) => {
  clearTimeout(queueTimer)
  if (on) queueTimer = setTimeout(() => mate.settleQueue(), 4800)
}, { immediate: true })

/* 固件升级：0 → 100、每档 20、380ms（归档 `upgradeFirmware`） */
let fwTimer = null
function upgradeFirmware() {
  clearInterval(fwTimer)
  mate.setFwProgress(0)
  fwTimer = setInterval(() => {
    const next = (mate.fwProgress ?? 0) + 20
    if (next >= 100) {
      clearInterval(fwTimer)
      mate.setFwProgress(100)
      return
    }
    mate.setFwProgress(next)
  }, 380)
}

/* 相机：归档 `simulateScan` 的 450ms（扫描）/ 500ms（拍照） */
let camTimer = null
function triggerShutter() {
  clearTimeout(camTimer)
  if (mate.cameraMode === 'scan') {
    mate.beginArScan()
    camTimer = setTimeout(() => mate.setCameraPlaying(true), 450)
  } else {
    mate.shootPhoto()
    camTimer = setTimeout(() => mate.enterEditorFromCamera(), 500)
  }
}

onBeforeUnmount(() => {
  clearInterval(printTicker)
  clearTimeout(queueTimer)
  clearInterval(fwTimer)
  clearTimeout(camTimer)
})
</script>

<template>
  <div
    class="pf"
    data-flow-root="printer"
    :data-pf-screen="mate.printScreen"
    :class="{ 'pf-dark': mate.printScreen === 'editor' || mate.printScreen === 'camera' }"
  >
    <!-- ============================================================
         device-screen —— 设备页（打印段 + 设备管理段，归档 @media 里同屏平铺）
         ============================================================ -->
    <template v-if="mate.printScreen === 'device'">
      <AppNavBar :title="am('printer.title')" @back="emit('close')">
        <template #right>
          <button class="pf-hbtn" data-pf-device-status @click="mate.toast('deviceOnline')">
            <LIcon name="audioLines" :size="18" />
          </button>
        </template>
      </AppNavBar>

      <div class="pf-scroll">
        <!-- 迷你设备卡（归档 `.mini-device`） -->
        <div class="pf-mini">
          <span class="pf-mini-art"><i /></span>
          <span class="pf-mini-copy">
            <strong data-pf-device-name>{{ deviceName }}</strong>
            <small>{{ am('printer.ready') }}</small>
          </span>
          <span class="pf-mini-stats" data-pf-device-stats>
            {{ fill(am('printer.battery'), { n: deviceBattery }) }}<br>
            {{ fill(am('printer.paperMeter'), { n: mate.paper, max: PAPER_MAX }) }}
          </span>
        </div>

        <!-- ===== 打印段（归档 #print-panel） ===== -->
        <p class="pf-tiny">{{ am('printer.createTitle') }}</p>

        <div class="pf-sources">
          <button class="pf-source" data-pf-source="gallery" @click="mate.openGallery('photo')">
            <span class="pf-source-icon"><LIcon :name="SOURCE_ICONS.gallery" :size="19" /></span>
            <strong>{{ am('printer.gallery') }}</strong>
            <small>{{ am('printer.gallerySub') }}</small>
          </button>

          <button class="pf-source" data-pf-source="camera" @click="mate.openCamera()">
            <span class="pf-source-icon"><LIcon :name="SOURCE_ICONS.camera" :size="19" /></span>
            <strong>{{ am('printer.camera') }}</strong>
            <small>{{ am('printer.cameraSub') }}</small>
          </button>

          <button class="pf-source ar" data-pf-source="ar" @click="mate.openAR()">
            <span class="pf-source-icon"><LIcon :name="SOURCE_ICONS.ar" :size="20" /></span>
            <span class="pf-source-ar-copy">
              <strong>{{ am('printer.ar') }}</strong>
              <small>{{ am('printer.arSub') }}</small>
            </span>
            <LIcon name="chevronRight" :size="20" class="pf-source-arrow" />
          </button>
        </div>

        <!-- 打印队列 -->
        <div class="pf-queue">
          <div class="pf-queue-head">
            <h3>{{ am('printer.queueTitle') }}</h3>
            <span class="pf-queue-badge" data-pf-queue-count>{{ mate.queueCount }} / {{ QUEUE_MAX }}</span>
          </div>

          <div v-if="!mate.queueCount" class="pf-queue-empty" data-pf-queue-empty>
            {{ am('printer.queueEmpty') }}
          </div>

          <div
            v-else
            class="pf-queue-item"
            :class="{ sending: mate.queueSending }"
            data-pf-queue-item
            :data-pf-queue-kind="mate.queueKind"
          >
            <span class="pf-queue-thumb" :style="{ backgroundImage: 'url(' + cover.src + ')' }" />
            <span class="pf-queue-copy">
              <strong>{{ am(mate.queueKind === 'ar' ? 'printer.queueAr' : 'printer.queuePhoto') }}</strong>
              <small :class="{ printing: mate.queuePhase !== 'idle' }" data-pf-queue-status>{{ queueStatus }}</small>
            </span>
            <button class="pf-queue-remove" data-pf-remove-queue :aria-label="am('printer.removeQueue')" @click="mate.removeQueue()">
              <LIcon name="x" :size="16" />
            </button>
          </div>

          <div v-if="mate.queueCount" class="pf-print-bar">
            <button class="pf-primary" data-pf-start-print @click="mate.startPrint('photo')">
              {{ fill(am('printer.startPrint'), { n: mate.queueCount }) }}
            </button>
          </div>
        </div>

        <!-- ===== 设备管理段（归档 #settings-panel） ===== -->
        <h2 class="pf-manage-title" data-pf-manage-title>{{ am('printer.manageTitle') }}</h2>

        <section class="pf-set-sec">
          <p class="pf-tiny">{{ am('printer.secInfo') }}</p>
          <div class="pf-set-card">
            <label class="pf-set-row">
              <span class="pf-set-copy">
                <span class="pf-set-label">{{ am('printer.deviceName') }}</span>
                <span class="pf-set-sub">{{ am('printer.deviceNameSub') }}</span>
              </span>
              <input
                class="pf-rename"
                data-pf-rename
                :value="deviceName"
                :aria-label="am('printer.deviceName')"
                @change="mate.renamePrinter($event.target.value)"
              />
            </label>
            <div class="pf-set-row">
              <span class="pf-set-copy">
                <span class="pf-set-label">{{ am('printer.firmware') }}</span>
                <span class="pf-set-sub">{{ am('printer.firmwareSub') }}</span>
              </span>
              <button
                class="pf-link-btn"
                data-pf-firmware
                :disabled="mate.fwProgress !== null && mate.fwProgress < 100"
                @click="upgradeFirmware"
              >
                {{ mate.fwProgress === null
                  ? am('printer.firmwareUpgrade')
                  : mate.fwProgress >= 100
                    ? am('printer.firmwareLatest')
                    : fill(am('printer.firmwareUpgrading'), { n: mate.fwProgress }) }}
              </button>
            </div>
          </div>
        </section>

        <section class="pf-set-sec">
          <p class="pf-tiny">{{ am('printer.secPrint') }}</p>
          <div class="pf-set-card">
            <div class="pf-set-row">
              <span class="pf-set-label">{{ am('printer.quality') }}</span>
              <span class="pf-segments">
                <button
                  v-for="q in PRINT_QUALITIES"
                  :key="q"
                  class="pf-seg"
                  :class="{ on: mate.printQuality === q }"
                  :data-pf-quality="q"
                  @click="mate.setPrintQuality(q)"
                >
                  {{ q === 'hd' ? am('printer.qualityHD') : am('printer.qualityStd') }}
                </button>
              </span>
            </div>
            <div class="pf-set-row">
              <span class="pf-set-label">{{ am('printer.colorMode') }}</span>
              <span class="pf-segments">
                <button
                  v-for="c in PRINT_COLORS"
                  :key="c"
                  class="pf-seg"
                  :class="{ on: mate.printColor === c }"
                  :data-pf-color="c"
                  @click="mate.setPrintColor(c)"
                >
                  {{ c === 'vivid' ? am('printer.colorVivid') : c === 'retro' ? am('printer.colorRetro') : am('printer.colorNatural') }}
                </button>
              </span>
            </div>
          </div>
        </section>

        <section class="pf-set-sec">
          <p class="pf-tiny">{{ am('printer.secSupplies') }}</p>
          <div class="pf-set-card">
            <div class="pf-set-row">
              <span class="pf-set-copy">
                <span class="pf-set-label">{{ fill(am('printer.paperLeft'), { n: mate.paper, max: PAPER_MAX }) }}</span>
                <span class="pf-set-sub">{{ am('printer.paperFull') }}</span>
              </span>
              <span class="pf-paper-wrap">
                <span class="pf-paper-track" data-pf-paper-meter>
                  <i :style="{ width: (mate.paper / PAPER_MAX * 100) + '%' }" />
                </span>
                <button class="pf-link-btn" data-pf-buy-paper @click="mate.buyPaper()">
                  {{ am('printer.buyPaper') }}
                </button>
              </span>
            </div>
          </div>
        </section>
      </div>
    </template>

    <!-- ============================================================
         gallery-screen —— 选择照片（归档 album-tabs 是装饰性的，这里接上过滤）
         ============================================================ -->
    <template v-else-if="mate.printScreen === 'gallery'">
      <AppNavBar :title="am('printer.albumTitle')" @back="mate.closeGallery()">
        <template #right>
          <button class="pf-hbtn-text" data-pf-gallery-cancel @click="mate.closeGallery()">
            {{ am('printer.cancel') }}
          </button>
        </template>
      </AppNavBar>

      <div class="pf-album-tabs">
        <button
          v-for="g in groups"
          :key="g.id"
          class="pf-album-tab"
          :class="{ on: mate.photoGroup === g.id }"
          :data-pf-album="g.id"
          @click="mate.setPhotoGroup(g.id)"
        >
          {{ g.label }}
        </button>
      </div>

      <div class="pf-scroll pf-gallery-scroll">
        <p class="pf-day" data-pf-day>{{ fill(am('printer.albumDay'), { n: mate.photosInGroup.length }) }}</p>
        <div class="pf-gallery">
          <button
            v-for="p in mate.photosInGroup"
            :key="p.id"
            class="pf-gphoto"
            :class="{ on: mate.selectedPhotoId === p.id }"
            :data-pf-photo="p.id"
            :aria-label="p.id"
            @click="mate.pickGalleryPhoto(p.id)"
          >
            <img :src="p.src" alt="" />
          </button>
        </div>
        <p v-if="!mate.photosInGroup.length" class="pf-empty">{{ am('printer.emptyGroup') }}</p>
      </div>

      <footer class="pf-sticky-action">
        <button class="pf-primary" data-pf-gallery-next @click="mate.goEditor()">
          {{ mate.galleryMode === 'ar' ? am('printer.nextEditAr') : am('printer.nextEdit') }}
        </button>
      </footer>
    </template>

    <!-- ============================================================
         editor-screen —— 照片编辑（暗色舞台 + 5 个工具面板）
         ============================================================ -->
    <template v-else-if="mate.printScreen === 'editor'">
      <header class="pf-dark-head">
        <button class="pf-dark-text start" data-pf-editor-cancel @click="mate.cancelEditor()">
          {{ am('printer.cancel') }}
        </button>
        <strong>{{ am('printer.editorTitle') }}</strong>
        <button class="pf-dark-text save" data-pf-editor-done @click="mate.confirmEditor()">
          {{ am('printer.done') }}
        </button>
      </header>

      <div class="pf-editor-stage">
        <div :class="photoClass" data-pf-preview>
          <div class="pf-photo-grid" :class="'grid-' + gridCount">
            <div
              v-for="i in gridShots"
              :key="i"
              :class="artClass"
              :style="{ ...artStyle, backgroundImage: 'url(' + cover.src + ')' }"
            />
          </div>
          <span class="pf-photo-caption">{{ am('printer.caption') }}</span>
        </div>
      </div>

      <div class="pf-editor-controls">
        <p class="pf-editor-panel-title" data-pf-panel-title>{{ am('printer.toolTitle.' + mate.editTool) }}</p>

        <!-- 裁剪与旋转 -->
        <div v-if="mate.editTool === 'crop'" class="pf-tool-pane" data-pf-pane="crop">
          <div class="pf-effect-strip">
            <button
              v-for="c in EDIT_CROPS"
              :key="c"
              class="pf-effect"
              :class="{ on: mate.editCrop === c }"
              :data-pf-crop="c"
              @click="mate.setEditCrop(c); mate.toast(c === 'ratio34' ? 'printCrop34' : c === 'square' ? 'printCrop11' : 'printCropOriginal')"
            >
              <i class="pf-effect-swatch layout">{{ am('printer.crop.' + c) }}</i>
              {{ am('printer.crop.' + c) }}
            </button>
            <button class="pf-effect" data-pf-rotate @click="mate.rotateEditPhoto(); mate.toast('printRotated')">
              <i class="pf-effect-swatch layout"><LIcon name="rotateCw" :size="18" /></i>
              {{ am('printer.rotate') }}
            </button>
          </div>
        </div>

        <!-- 打印版式 -->
        <div v-else-if="mate.editTool === 'layout'" class="pf-tool-pane" data-pf-pane="layout">
          <div class="pf-effect-strip">
            <button
              class="pf-effect"
              :class="{ on: mate.editLayout === 'border' && mate.editWhiteBorder }"
              data-pf-layout="border"
              @click="mate.setEditLayout('border'); mate.toggleEditBorder()"
            >
              <i class="pf-effect-swatch layout"><LIcon name="square" :size="18" /></i>
              {{ am('printer.layout.border') }}
            </button>
            <button
              v-for="l in LAYOUT_ITEMS.filter((x) => x !== 'border')"
              :key="l"
              class="pf-effect"
              :class="{ on: mate.editLayout === l }"
              :data-pf-layout="l"
              @click="mate.setEditLayout(l); mate.toast(l === 'full' ? 'printFullBleed' : l === 'grid2' ? 'printGrid2' : 'printGrid4')"
            >
              <i class="pf-effect-swatch layout"><LIcon :name="l === 'full' ? 'maximize' : 'layoutTemplate'" :size="18" /></i>
              {{ am('printer.layout.' + l) }}
            </button>
          </div>
        </div>

        <!-- 相框 -->
        <div v-else-if="mate.editTool === 'frame'" class="pf-tool-pane" data-pf-pane="frame">
          <div class="pf-effect-strip">
            <button
              v-for="f in EDIT_FRAMES"
              :key="f"
              class="pf-effect"
              :class="[{ on: mate.editFrame === f }, f === 'film' ? 'film-border' : '']"
              :data-pf-frame="f"
              @click="mate.setEditFrame(f); f === 'handwrite' && mate.toast('printFrameHand')"
            >
              <i class="pf-effect-swatch" :class="f === 'none' ? '' : 'frame-' + f" />
              {{ am('printer.frame.' + f) }}
            </button>
          </div>
        </div>

        <!-- 滤镜 -->
        <div v-else-if="mate.editTool === 'filter'" class="pf-tool-pane" data-pf-pane="filter">
          <div class="pf-effect-strip">
            <button
              v-for="f in PRINT_FILTERS"
              :key="f"
              class="pf-effect"
              :class="[{ on: mate.editFilter === f }, f === 'mono' ? 'mono' : f === 'oldfilm' ? 'film' : f === 'sunny' ? 'vivid' : '']"
              :data-pf-filter="f"
              @click="mate.setEditFilter(f)"
            >
              <i class="pf-effect-swatch photo" :style="{ backgroundImage: 'url(' + cover.src + ')' }" />
              {{ am('printer.filter.' + f) }}
            </button>
          </div>
        </div>

        <!-- 调节（归档两条 range：亮度 70–130、强度 0–100） -->
        <div v-else class="pf-tool-pane" data-pf-pane="adjust">
          <div class="pf-adjust-row">
            <span>{{ am('printer.brightness') }}</span>
            <input
              type="range" min="70" max="130" :value="mate.editBrightness"
              data-pf-brightness
              :aria-label="am('printer.brightness')"
              @input="mate.setEditBrightness($event.target.value)"
            />
            <b>{{ mate.editBrightness }}</b>
          </div>
          <div class="pf-adjust-row">
            <span>{{ am('printer.strength') }}</span>
            <input
              type="range" min="0" max="100" :value="mate.editStrength"
              data-pf-strength
              :aria-label="am('printer.strength')"
              @input="mate.setEditStrength($event.target.value)"
            />
            <b>{{ mate.editStrength }}</b>
          </div>
        </div>

        <nav class="pf-editor-toolbar">
          <button
            v-for="t in EDIT_TOOLS"
            :key="t"
            class="pf-tool-btn"
            :class="{ on: mate.editTool === t }"
            :data-pf-tool="t"
            @click="mate.setEditTool(t)"
          >
            <b><LIcon :name="TOOL_ICONS[t]" :size="18" /></b>
            {{ am('printer.tool.' + t) }}
          </button>
        </nav>
      </div>
    </template>

    <!-- ============================================================
         ar-screen —— AR 视频打印三步向导
         ============================================================ -->
    <template v-else-if="mate.printScreen === 'ar'">
      <AppNavBar :title="am('printer.arTitle')" @back="mate.closeAR()" />

      <div class="pf-ar-progress">
        <template v-for="(n, i) in [1, 2, 3]" :key="n">
          <span v-if="i" class="pf-step-line" :class="{ done: mate.arStep > i }" />
          <span
            class="pf-step-dot"
            :class="{ on: mate.arStep === n, done: mate.arStep > n }"
            :data-pf-step-dot="n"
          >{{ mate.arStep > n ? '✓' : n }}</span>
        </template>
      </div>

      <div class="pf-scroll">
        <!-- ---- 第 1 步：视频 ---- -->
        <section v-if="mate.arStep === 1" data-pf-ar-step="1">
          <p class="pf-step-kicker">{{ am('printer.stepKicker.1') }}</p>
          <h2 class="pf-step-title">{{ am('printer.step1Title') }}</h2>
          <p class="pf-step-desc">{{ am('printer.step1Desc') }}</p>

          <button v-if="!mate.arVideoSelected" class="pf-video-picker" data-pf-video-pick @click="mate.selectArVideo()">
            <span>
              <span class="pf-video-picker-icon"><LIcon name="play" :size="22" /></span>
              <strong>{{ am('printer.videoPick') }}</strong>
              <small>{{ am('printer.videoPickSub') }}</small>
            </span>
          </button>

          <div v-else class="pf-video-editor" data-pf-video-editor>
            <div class="pf-video-card">
              <div class="pf-video-view">
                <button class="pf-video-play" :aria-label="am('printer.videoPick')" @click="mate.toggleArPlay()">
                  <LIcon :name="mate.arVideoPlaying ? 'pause' : 'play'" :size="20" />
                </button>
              </div>
              <div class="pf-video-info">
                <strong>{{ AR_VIDEO.name }}</strong>
                <span>{{ fill(am('printer.videoOriginal'), { n: AR_VIDEO.duration, size: AR_VIDEO.size }) }}</span>
              </div>
            </div>

            <div class="pf-timeline">
              <div ref="arTrack" class="pf-filmstrip" data-pf-trim-track>
                <i v-for="i in 6" :key="i" class="pf-frame" />
                <span class="pf-trim-sel" :style="{ left: trimLeftPct + '%', right: (100 - trimRightPct) + '%' }" />
                <span
                  class="pf-trim left"
                  :style="{ left: trimLeftPct + '%' }"
                  data-pf-trim="start"
                  @pointerdown.prevent="dragTrim('start', $event)"
                />
                <span
                  class="pf-trim right"
                  :style="{ left: trimRightPct + '%' }"
                  data-pf-trim="end"
                  @pointerdown.prevent="dragTrim('end', $event)"
                />
              </div>
              <div class="pf-timeline-note">
                <span>{{ fmtSec(mate.arTrimStart) }}</span>
                <b data-pf-trim-label>{{ fill(am('printer.videoTrimmed'), { n: mate.arTrimSeconds }) }}</b>
                <span>{{ fmtSec(mate.arTrimEnd) }}</span>
              </div>
            </div>

            <button class="pf-text-btn" data-pf-video-change @click="mate.changeArVideo()">
              {{ am('printer.videoChange') }}
            </button>
          </div>
        </section>

        <!-- ---- 第 2 步：照片 ---- -->
        <section v-else-if="mate.arStep === 2" data-pf-ar-step="2">
          <p class="pf-step-kicker">{{ am('printer.stepKicker.2') }}</p>
          <h2 class="pf-step-title">{{ am('printer.step2Title') }}</h2>
          <p class="pf-step-desc">{{ am('printer.step2Desc') }}</p>

          <div class="pf-cover-source">
            <button data-pf-cover-gallery @click="mate.openGallery('ar')">{{ am('printer.gallery') }}</button>
            <button data-pf-cover-camera @click="mate.openARCamera()">{{ am('printer.camera') }}</button>
          </div>

          <div class="pf-recent-title">
            <span>{{ am('printer.recentTitle') }}</span><span>{{ am('printer.recentPick') }}</span>
          </div>
          <div class="pf-recent-grid">
            <button
              v-for="id in AR_RECENT"
              :key="id"
              class="pf-recent-photo"
              :class="{ on: mate.arCoverSelected && mate.selectedPhotoId === id }"
              :data-pf-ar-recent="id"
              :aria-label="id"
              :style="{ backgroundImage: 'url(' + photoById(id).src + ')' }"
              @click="mate.selectArCover(id)"
            />
          </div>

          <div class="pf-binding" :class="{ on: mate.arCoverSelected }" data-pf-bind>
            <span class="pf-binding-photo" :style="{ backgroundImage: 'url(' + cover.src + ')' }" />
            <span class="pf-binding-link"><LIcon name="link" :size="15" /></span>
            <span class="pf-binding-copy">
              <strong>{{ mate.arCoverSelected ? am('printer.bindDone') : am('printer.bindWaiting') }}</strong>
              <small>{{ fill(am('printer.bindCopy'), { name: '岛屿漫游', n: mate.arTrimSeconds }) }}</small>
            </span>
          </div>
        </section>

        <!-- ---- 第 3 步：确认 ---- -->
        <section v-else data-pf-ar-step="3">
          <p class="pf-step-kicker">{{ am('printer.stepKicker.3') }}</p>
          <h2 class="pf-step-title">{{ am('printer.step3Title') }}</h2>
          <p class="pf-step-desc">{{ am('printer.step3Desc') }}</p>

          <div class="pf-confirm-card">
            <span class="pf-ar-badge">{{ fill(am('printer.arBadge'), { n: mate.arTrimSeconds }) }}</span>
            <div class="pf-print-photo with-border crop-original">
              <div class="pf-photo-grid grid-1">
                <div :class="artClass" :style="{ ...artStyle, backgroundImage: 'url(' + cover.src + ')' }" />
              </div>
              <span class="pf-photo-caption">{{ am('printer.arCaption') }}</span>
            </div>
          </div>

          <div class="pf-confirm-info" data-pf-confirm-info>
            <strong>{{ deviceName }}</strong>
            <span>{{ am('printer.printSummary') }}</span>
          </div>
        </section>
      </div>

      <footer class="pf-sticky-action">
        <button
          class="pf-primary"
          data-pf-ar-next
          :disabled="!mate.arNextEnabled"
          @click="mate.nextARStep()"
        >
          {{ am('printer.' + mate.arNextLabel) }}
        </button>
      </footer>
    </template>

    <!-- ============================================================
         camera-screen —— 即时拍照 / AR 扫描
         ============================================================ -->
    <template v-else-if="mate.printScreen === 'camera'">
      <header class="pf-dark-head">
        <button class="pf-dark-back" data-pf-camera-back :aria-label="am('printer.cancel')" @click="mate.closeCamera()">
          <LIcon name="arrowLeft" :size="18" />
        </button>
        <strong>{{ am('printer.cameraTitle') }}</strong>
        <span class="pf-dark-spacer" />
      </header>

      <div class="pf-camera-tabs">
        <button
          class="pf-camera-tab"
          :class="{ on: mate.cameraMode === 'photo' }"
          data-pf-cam-tab="photo"
          @click="mate.setCameraMode('photo')"
        >{{ am('printer.modePhoto') }}</button>
        <button
          class="pf-camera-tab"
          :class="{ on: mate.cameraMode === 'scan' }"
          data-pf-cam-tab="scan"
          @click="mate.setCameraMode('scan')"
        >{{ am('printer.modeScan') }}</button>
      </div>

      <div
        class="pf-viewfinder"
        :class="[{ photo: mate.cameraMode === 'photo' }, { playing: mate.cameraPlaying }]"
        data-pf-viewfinder
        :data-pf-camera-mode="mate.cameraMode"
      >
        <span class="pf-scan-frame">
          <i /><i /><i /><i />
          <span class="pf-scan-line" />
        </span>

        <span class="pf-ar-playing">
          <span class="pf-ar-live">{{ am('printer.arPlayingTag') }}</span>
        </span>

        <p class="pf-scan-tip" data-pf-scan-tip>
          {{ mate.cameraMode === 'scan' ? am('printer.tipScan') : am('printer.tipPhoto') }}
        </p>

        <button class="pf-shutter" data-pf-shutter @click="triggerShutter()">
          {{ mate.cameraMode === 'scan' ? am('printer.scanDemo') : am('printer.shootPhoto') }}
        </button>
      </div>
    </template>

    <!-- ============================================================
         progress-modal —— 打印进度（归档写好但没接通，这里补上入口）
         浮层必须 `absolute`：`fixed` 的包含块是外层机身，会四边各偏 16px。
         ============================================================ -->
    <div v-if="mate.printModalOpen" class="pf-progress" data-pf-progress-modal>
      <div class="pf-progress-card">
        <template v-if="!mate.printDone">
          <h3>{{ am('printer.printing') }}</h3>
          <p>{{ am('printer.printingDesc') }}</p>
          <div class="pf-progress-number">
            <b data-pf-progress>{{ Math.round(mate.printProgress) }}</b><span>%</span>
          </div>
          <div class="pf-progress-track">
            <i data-pf-progress-fill :style="{ width: mate.printProgress + '%' }" />
          </div>
          <div class="pf-progress-meta">
            <span data-pf-progress-status>{{ progressStage }}</span>
            <span data-pf-progress-time>{{ progressTime }}</span>
          </div>
          <div class="pf-progress-actions">
            <button class="pf-secondary" data-pf-pause @click="mate.togglePrintPause()">
              {{ mate.printPaused ? am('printer.resume') : am('printer.pause') }}
            </button>
            <button class="pf-secondary" data-pf-cancel-print @click="mate.cancelPrint()">
              {{ am('printer.cancel') }}
            </button>
          </div>
        </template>

        <template v-else>
          <div class="pf-done" data-pf-done>
            <span class="pf-done-icon">✓</span>
            <h3>{{ am('printer.printDoneTitle') }}</h3>
            <p data-pf-done-copy>{{ doneCopy }}</p>
            <button class="pf-primary" data-pf-done-action @click="mate.finishPrint()">{{ doneAction }}</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
 * 归档 `:root` 变量表逐字抄到流程根上（与 RecorderFlow / MoriFlow 一致）
 * ============================================================ */
.pf {
  --ink: #172332;
  --muted: #75808d;
  --paper: #f8f6f1;
  --card: #ffffff;
  --line: #e8e5dd;
  --coral: #ff6856;
  --coral-dark: #e85142;
  --mint: #4dc8b7;
  --lilac: #8679ef;
  --sun: #ffcf67;

  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  color: var(--ink);
  overflow: hidden;
}
.pf,
.pf * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
.pf button { color: inherit; cursor: pointer; border: 0; background: transparent; font: inherit; }

/* 暗色两屏（归档 `.photo-editor` / `.scanner`） */
.pf-dark { background: #151619; color: #fff; }

/* ---------- 头部 ---------- */
/* 头部几何必须 ≥ `calc(var(--safe-top) + 52px)`：ScreenView 顶部 64px 是边缘手势热区 */
.pf-hbtn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; color: var(--coral-dark);
}
.pf-hbtn-text { color: var(--coral-dark); font-size: 15px; font-weight: 700; padding: 6px 2px; }
.pf-dark-head {
  flex: none;
  height: calc(var(--safe-top) + 52px);
  padding: var(--safe-top) 14px 0;
  display: grid;
  grid-template-columns: 58px 1fr 58px;
  align-items: center;
  text-align: center;
  background: transparent;
}
.pf-dark-head strong { font-size: 17px; font-weight: 700; letter-spacing: -0.2px; }
.pf-dark-text { font-size: 14px; color: #fff; }
.pf-dark-text.start { text-align: left; }
.pf-dark-text.save { text-align: right; color: #ff7a69; font-weight: 800; }
.pf-dark-back {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.14); color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.pf-dark-spacer { width: 36px; }

/* ---------- 滚动区 ---------- */
.pf-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px calc(var(--safe-bottom) + 26px);
}
.pf-tiny {
  margin: 20px 2px 9px;
  font-size: 12px; font-weight: 800; letter-spacing: 0.1em;
  color: #9aa1a8;
}
.pf-empty { text-align: center; color: var(--muted); font-size: 13px; padding: 26px 0; }

/* ---------- 迷你设备卡（归档 `.mini-device`） ---------- */
.pf-mini {
  display: flex; align-items: center; gap: 14px;
  margin: 8px 0 4px; padding: 15px 16px;
  border-radius: 22px;
  background: linear-gradient(135deg, #1a2736, #28384b);
  color: #fff;
  box-shadow: 0 14px 26px rgba(23, 35, 50, 0.16);
}
.pf-mini-art {
  position: relative; flex: none;
  width: 51px; height: 42px; border-radius: 13px;
  background: linear-gradient(145deg, #fff, #dce1df);
}
.pf-mini-art i {
  position: absolute; left: 10px; right: 10px; top: -11px; height: 24px;
  border: 3px solid #fff;
  background: linear-gradient(135deg, #ffb578, #e76652 45%, #5da8af 46%);
}
.pf-mini-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.pf-mini-copy strong { font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-mini-copy small { font-size: 12px; color: #b8c2cc; }
.pf-mini-stats { flex: none; text-align: right; font-size: 12px; line-height: 1.7; color: #d6dde2; }

/* ---------- 来源卡（归档 `.source-grid`） ---------- */
.pf-sources { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pf-source {
  min-height: 108px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--card);
  display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  text-align: left;
  transition: transform 0.2s, border-color 0.2s;
}
.pf-source:active { transform: scale(0.985); }
.pf-source-icon {
  width: 40px; height: 40px; border-radius: 14px;
  display: grid; place-items: center;
  margin-bottom: 6px;
  background: #fff0ed; color: var(--coral);
}
.pf-source:nth-child(2) .pf-source-icon { background: #e9f8f5; color: #2a9d8e; }
.pf-source strong { font-size: 14px; font-weight: 700; }
.pf-source small { font-size: 12px; color: var(--muted); }
.pf-source.ar {
  grid-column: 1 / -1;
  min-height: 84px;
  flex-direction: row; align-items: center; gap: 12px;
  border: 0;
  background: linear-gradient(125deg, #f0edff, #fff4f0);
}
.pf-source.ar .pf-source-icon { width: 44px; height: 44px; margin: 0; background: var(--lilac); color: #fff; }
.pf-source-ar-copy { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.pf-source.ar strong { font-size: 14.5px; }
.pf-source-arrow { color: #7f75c4; flex: none; }

/* ---------- 打印队列（归档 `.queue`） ---------- */
.pf-queue { margin-top: 22px; }
.pf-queue-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
.pf-queue-head h3 { margin: 0; font-size: 15px; font-weight: 700; }
.pf-queue-badge { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.pf-queue-empty {
  padding: 20px; text-align: center;
  border: 1px dashed #d8d4cb; border-radius: 18px;
  background: rgba(255, 255, 255, 0.45);
  color: #9a9fa5; font-size: 13px;
}
.pf-queue-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px;
  border: 1px solid var(--line); border-radius: 18px;
  background: var(--card);
}
.pf-queue-item.sending { border-color: #bfe9df; background: #f7fffd; }
.pf-queue-thumb {
  flex: none; width: 46px; height: 56px;
  border: 4px solid #fff;
  background-size: cover; background-position: center;
  box-shadow: 0 3px 9px rgba(0, 0, 0, 0.13);
}
.pf-queue-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.pf-queue-copy strong { font-size: 13px; font-weight: 650; }
.pf-queue-copy small { font-size: 12px; color: var(--muted); }
.pf-queue-copy small.printing { color: #249e8b; font-weight: 750; }
.pf-queue-item.sending .pf-queue-remove { display: none; }
.pf-queue-remove {
  flex: none; width: 30px; height: 30px; border-radius: 10px;
  background: #f3f1ed; color: #868d94;
  display: grid; place-items: center;
}
.pf-print-bar { margin-top: 12px; }

/* ---------- 按钮 ---------- */
.pf-primary {
  width: 100%;
  padding: 15px 18px;
  border-radius: 16px;
  background: var(--coral); color: #fff;
  font-size: 15px; font-weight: 800;
  box-shadow: 0 12px 25px rgba(255, 104, 86, 0.27);
  transition: transform 0.2s, background 0.2s;
}
.pf-primary:active { transform: scale(0.985); }
.pf-primary:disabled { opacity: 0.42; cursor: default; box-shadow: none; }
.pf-secondary {
  width: 100%;
  padding: 13px;
  border: 1px solid var(--line); border-radius: 15px;
  background: #fff; color: var(--ink);
  font-size: 14px; font-weight: 700;
}
.pf-text-btn { margin-top: 12px; color: var(--coral-dark); font-size: 13px; font-weight: 700; padding: 6px; }

/* ---------- 设备管理（归档 `.settings-*`） ---------- */
.pf-manage-title { margin: 26px 2px 0; font-size: 17px; font-weight: 800; letter-spacing: -0.3px; }
.pf-set-sec { margin-top: 4px; }
.pf-set-card {
  border: 1px solid var(--line); border-radius: 20px;
  background: var(--card); overflow: hidden;
}
.pf-set-row {
  min-height: 58px; padding: 13px 15px;
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  border-bottom: 1px solid #f0ede7;
}
.pf-set-row:last-child { border-bottom: 0; }
.pf-set-copy { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.pf-set-label { font-size: 15px; font-weight: 650; }
.pf-set-sub { font-size: 12px; color: var(--muted); }
.pf-rename {
  width: 132px;
  border: 0; border-bottom: 1px solid #dad6ce;
  padding: 5px 0;
  background: transparent; color: var(--ink);
  font-size: 14px; text-align: right;
}
.pf-link-btn { color: var(--coral-dark); font-size: 13px; font-weight: 800; padding: 6px 2px; }
.pf-link-btn:disabled { color: var(--muted); cursor: default; }
.pf-segments {
  display: flex; gap: 3px;
  padding: 3px; border-radius: 11px;
  background: #f0eeea;
}
.pf-seg { padding: 6px 10px; border-radius: 8px; color: #7b838b; font-size: 12px; }
.pf-seg.on { background: #fff; color: var(--ink); font-weight: 800; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.07); }
.pf-paper-wrap { display: flex; align-items: center; gap: 10px; }
.pf-paper-track { width: 68px; height: 6px; border-radius: 99px; background: #ebe8e1; overflow: hidden; }
.pf-paper-track i { display: block; height: 100%; border-radius: inherit; background: var(--mint); }

/* ---------- 相册（归档 `.gallery-screen`） ---------- */
.pf-album-tabs {
  flex: none;
  display: flex; gap: 8px;
  padding: 2px 16px 12px;
  overflow-x: auto;
}
.pf-album-tab {
  flex: none;
  padding: 9px 14px;
  border-radius: 999px;
  background: #efede8; color: #7c848b;
  font-size: 13px;
}
.pf-album-tab.on { background: var(--ink); color: #fff; font-weight: 800; }
.pf-gallery-scroll { padding: 0 12px calc(var(--safe-bottom) + 96px); }
.pf-day { margin: 0; padding: 6px 4px 10px; color: #80878e; font-size: 12px; }
.pf-gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.pf-gphoto {
  position: relative;
  padding: 0; aspect-ratio: 1 / 1;
  border: 3px solid transparent; border-radius: 6px;
  overflow: hidden; background: #e7e3dc;
}
.pf-gphoto img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pf-gphoto.on { border-color: var(--coral); }
.pf-gphoto.on::after {
  content: '✓';
  position: absolute; top: 5px; right: 5px;
  width: 20px; height: 20px;
  display: grid; place-items: center;
  border-radius: 50%; background: var(--coral); color: #fff;
  font-size: 12px;
}

/* ---------- 底部固定动作（归档 `.gallery-action` / `.sticky-action`） ---------- */
.pf-sticky-action {
  flex: none;
  padding: 12px 16px calc(var(--safe-bottom) + 14px);
  background: rgba(251, 250, 247, 0.96);
  border-top: 1px solid var(--line);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* ---------- 编辑器（归档 `.photo-editor`） ---------- */
.pf-editor-stage {
  flex: 1; min-height: 0;
  display: grid; place-items: center;
  padding: 10px 22px 14px;
  background: radial-gradient(circle at 50% 42%, #32353b, #151619 68%);
}
.pf-print-photo {
  position: relative;
  width: 64%; max-width: 232px;
  aspect-ratio: 4 / 4.7;
  padding: 0 0 16%;
  background: #fff;
  transform: rotate(-1.5deg);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  transition: aspect-ratio 0.25s ease, padding 0.25s ease;
}
.pf-print-photo.with-border { padding: 7% 7% 20%; }
.pf-print-photo.lay-full { padding: 0; }
.pf-print-photo.crop-ratio34 { aspect-ratio: 3 / 4; }
.pf-print-photo.crop-square { aspect-ratio: 1 / 1; }
.pf-photo-grid { position: absolute; inset: 0 0 auto; height: 100%; display: grid; gap: 2px; }
.pf-photo-grid.grid-1 { grid-template-columns: 1fr; }
.pf-photo-grid.grid-2 { grid-template-columns: 1fr 1fr; }
.pf-photo-grid.grid-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.pf-photo-grid.grid-4 > * { min-height: 0; }
.pf-photo-art {
  background-size: cover; background-position: center;
  filter: brightness(var(--brightness, 1));
}
.pf-photo-art.filter-warm { filter: brightness(var(--brightness, 1)) saturate(1.3) sepia(0.15) contrast(1.05); }
.pf-photo-art.filter-film { filter: brightness(var(--brightness, 1)) saturate(0.72) sepia(0.27) contrast(1.12); }
.pf-photo-art.filter-mono { filter: brightness(var(--brightness, 1)) grayscale(1) contrast(1.12); }
/* 归档 `.frame-dot` / `.frame-film` 是 inset box-shadow */
.pf-print-photo.frame-dot .pf-photo-art { box-shadow: inset 0 0 0 9px #fff, inset 0 0 0 12px #ffb4a8; }
.pf-print-photo.frame-film .pf-photo-art { box-shadow: inset 0 0 0 12px #182331; }
.pf-print-photo.frame-hand .pf-photo-art { box-shadow: inset 0 0 0 6px #fff, inset 0 0 0 8px #d8c7ad; }
.pf-photo-caption {
  position: absolute; left: 0; right: 0; bottom: 5%;
  text-align: center;
  font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
  color: #303b47;
}

/* 底部编辑控件（归档 `.editor-controls`） */
.pf-editor-controls {
  flex: none;
  height: 258px;
  padding: 16px 0 calc(var(--safe-bottom) + 8px);
  border-radius: 26px 26px 0 0;
  background: #fbfaf7; color: var(--ink);
  box-shadow: 0 -12px 34px rgba(0, 0, 0, 0.22);
  display: flex; flex-direction: column;
}
.pf-editor-panel-title { margin: 0 0 10px; padding: 0 18px; font-size: 14px; font-weight: 800; }
.pf-tool-pane { flex: 1; min-height: 0; padding: 0 12px; overflow: hidden; }
.pf-effect-strip { display: flex; gap: 10px; overflow-x: auto; padding: 2px 4px 8px; }
.pf-effect {
  flex: 0 0 66px;
  padding: 0; text-align: center;
  color: #777f87; font-size: 12px;
}
.pf-effect-swatch {
  display: block;
  width: 56px; height: 56px;
  margin: 0 auto 7px;
  border: 2px solid transparent; border-radius: 15px;
  background: #eeece7;
  box-shadow: 0 3px 9px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.pf-effect-swatch.photo { background-size: cover; background-position: center; }
.pf-effect-swatch.layout {
  display: grid; place-items: center;
  color: #747c83; font-size: 14px; font-style: normal;
}
.pf-effect-swatch.frame-dot { background: #fff; box-shadow: inset 0 0 0 8px #ffb3a7; }
.pf-effect-swatch.frame-film { background: #fff; box-shadow: inset 0 0 0 9px #1b2430; }
.pf-effect-swatch.frame-handwrite { background: #fff; box-shadow: inset 0 0 0 6px #d8c7ad; }
.pf-effect.on { color: var(--coral-dark); font-weight: 800; }
.pf-effect.on .pf-effect-swatch { border-color: var(--coral); box-shadow: 0 0 0 3px #fff3f0; }
.pf-effect.mono .pf-effect-swatch { filter: grayscale(1); }
.pf-effect.film .pf-effect-swatch { filter: sepia(0.35) saturate(0.7); }
.pf-effect.vivid .pf-effect-swatch { filter: saturate(1.55); }
.pf-adjust-row {
  display: grid; grid-template-columns: 44px 1fr 40px;
  align-items: center; gap: 10px;
  padding: 14px 8px;
  color: #7b838b; font-size: 12px;
}
.pf-adjust-row input { width: 100%; accent-color: var(--coral); }
.pf-adjust-row b { color: var(--ink); font-variant-numeric: tabular-nums; text-align: right; }
.pf-editor-toolbar {
  flex: none;
  height: 74px;
  border-top: 1px solid #ebe8e2;
  display: grid; grid-template-columns: repeat(5, 1fr);
  padding: 9px 10px 0;
}
.pf-tool-btn { display: grid; justify-items: center; align-content: start; gap: 4px; color: #7f868d; font-size: 12px; }
.pf-tool-btn b { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 12px; }
.pf-tool-btn.on { color: var(--coral-dark); font-weight: 800; }
.pf-tool-btn.on b { background: #fff0ed; }

/* ---------- AR 三步向导（归档 `.ar-*`） ---------- */
.pf-ar-progress { flex: none; display: flex; align-items: center; justify-content: center; padding: 6px 22px 16px; }
.pf-step-dot {
  display: grid; place-items: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: #e7e3dd; color: #8d949a;
  font-size: 12px; font-weight: 800;
  transition: background 0.3s, color 0.3s;
}
.pf-step-dot.on { background: var(--ink); color: #fff; }
.pf-step-dot.done { background: var(--mint); color: #fff; }
.pf-step-line { width: 50px; height: 2px; background: #dedad2; }
.pf-step-line.done { background: var(--mint); }

.pf-step-kicker { margin: 0; color: var(--coral-dark); font-size: 12px; font-weight: 850; letter-spacing: 0.1em; }
.pf-step-title { margin: 6px 0 7px; font-size: 23px; font-weight: 800; letter-spacing: -0.5px; }
.pf-step-desc { margin: 0 0 16px; color: var(--muted); font-size: 13px; line-height: 1.6; }

.pf-video-picker {
  width: 100%; min-height: 220px;
  padding: 26px;
  border: 1.5px dashed #cfc9c0; border-radius: 24px;
  background: #fff; color: inherit;
  display: grid; place-items: center; text-align: center;
}
.pf-video-picker-icon {
  width: 60px; height: 60px; margin: 0 auto 14px;
  display: grid; place-items: center; border-radius: 20px;
  background: #edeaff; color: #6d60df;
}
.pf-video-picker strong { display: block; font-size: 15px; font-weight: 700; }
.pf-video-picker small { display: block; margin-top: 6px; color: var(--muted); font-size: 12px; line-height: 1.5; }

.pf-video-card { border-radius: 22px; overflow: hidden; background: #152234; color: #fff; box-shadow: 0 15px 30px rgba(23, 35, 50, 0.17); }
.pf-video-view {
  position: relative; height: 176px;
  background: linear-gradient(150deg, #395e72, #95c7bc 52%, #e7b476 53%);
  display: grid; place-items: center;
}
.pf-video-view::before {
  content: ''; position: absolute;
  width: 240px; height: 100px; border-radius: 50%;
  left: -40px; top: 84px;
  background: #254758;
  box-shadow: 120px -8px 0 #4d7a73, 220px -28px 0 #24394f;
}
.pf-video-play {
  position: relative; z-index: 2;
  width: 50px; height: 50px; border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.24); color: #fff;
  display: grid; place-items: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.pf-video-info { padding: 13px 15px; display: flex; align-items: center; justify-content: space-between; }
.pf-video-info strong { font-size: 13px; }
.pf-video-info span { color: #aab5bf; font-size: 12px; }

.pf-timeline { margin-top: 15px; }
.pf-filmstrip {
  position: relative; height: 52px;
  border-radius: 14px;
  padding: 5px 12px;
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px;
  background: #e4e0d9;
}
.pf-frame { background: linear-gradient(145deg, #6aa1a4 0 48%, #d9ab72 49%); }
.pf-frame:nth-child(even) { filter: brightness(0.9); }
.pf-trim-sel { position: absolute; top: 0; bottom: 0; background: rgba(255, 104, 86, 0.18); }
.pf-trim {
  position: absolute; top: 0; bottom: 0;
  width: 14px; margin-left: -7px;
  background: var(--coral);
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.17);
  cursor: ew-resize;
}
.pf-trim.left { border-radius: 8px 2px 2px 8px; }
.pf-trim.right { border-radius: 2px 8px 8px 2px; }
/* 视觉 14px，实际可抓 26×52 —— 12px 的手柄在真机上太难点 */
.pf-trim::after { content: ''; position: absolute; inset: -6px -6px; }
.pf-timeline-note { display: flex; justify-content: space-between; margin-top: 8px; color: var(--muted); font-size: 12px; }

.pf-cover-source { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 18px; }
.pf-cover-source button {
  padding: 14px 9px;
  border: 1px solid var(--line); border-radius: 17px;
  background: #fff; font-size: 13px; font-weight: 700;
}
.pf-cover-source button:first-child { color: var(--coral-dark); border-color: #ffc6bd; background: #fff5f2; }
.pf-recent-title { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; font-weight: 800; }
.pf-recent-title span:last-child { color: var(--muted); font-size: 12px; font-weight: 500; }
.pf-recent-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.pf-recent-photo {
  position: relative;
  padding: 0; aspect-ratio: 1 / 1;
  border: 3px solid transparent; border-radius: 16px;
  background-size: cover; background-position: center;
}
.pf-recent-photo.on { border-color: var(--coral); }
.pf-recent-photo.on::after {
  content: '✓';
  position: absolute; right: 5px; top: 5px;
  width: 20px; height: 20px;
  display: grid; place-items: center;
  border-radius: 50%; background: var(--coral); color: #fff;
  font-size: 12px;
}
.pf-binding {
  display: flex; align-items: center; gap: 14px;
  margin-top: 18px; padding: 16px;
  border-radius: 21px;
  background: linear-gradient(135deg, #1d2a3a, #303c52);
  color: #fff;
  opacity: 0.45;
  transition: opacity 0.25s;
}
.pf-binding.on { opacity: 1; }
.pf-binding-photo {
  flex: none; width: 62px; height: 76px;
  border: 5px solid #fff;
  background-size: cover; background-position: center;
  transform: rotate(-3deg);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}
.pf-binding-link {
  flex: none; width: 30px; height: 30px; border-radius: 50%;
  background: var(--coral); color: #fff;
  display: grid; place-items: center;
}
.pf-binding-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.pf-binding-copy strong { font-size: 14px; font-weight: 700; }
.pf-binding-copy small { color: #aeb9c3; font-size: 12px; line-height: 1.5; }

.pf-confirm-card {
  position: relative;
  min-height: 330px;
  padding: 20px;
  border-radius: 26px;
  background: linear-gradient(145deg, #e5e2dc, #f1eee8);
  display: grid; place-items: center;
}
.pf-confirm-card .pf-print-photo { width: 58%; max-width: 198px; transform: rotate(0deg); }
.pf-ar-badge {
  position: absolute; right: 18px; top: 16px;
  padding: 8px 10px; border-radius: 11px;
  background: var(--ink); color: #fff;
  font-size: 12px; font-weight: 800;
}
.pf-confirm-info {
  margin-top: 14px; padding: 13px 15px;
  border: 1px solid var(--line); border-radius: 18px;
  background: #fff;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px;
}
.pf-confirm-info strong { font-weight: 700; }
.pf-confirm-info span { color: var(--muted); }

/* ---------- 相机（归档 `.scanner`） ---------- */
.pf-camera-tabs {
  flex: none;
  width: 210px; margin: 4px auto 12px;
  padding: 4px; border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  display: grid; grid-template-columns: 1fr 1fr;
}
.pf-camera-tab { padding: 9px; border-radius: 11px; color: #aeb8c2; font-size: 13px; }
.pf-camera-tab.on { background: #fff; color: #182332; font-weight: 800; }
.pf-viewfinder {
  position: relative;
  flex: 1; min-height: 300px;
  margin: 0 14px calc(var(--safe-bottom) + 14px);
  border-radius: 26px;
  overflow: hidden;
  background: linear-gradient(160deg, #566978 0 37%, #b69a7e 38% 63%, #384b57 64%);
}
.pf-viewfinder::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at center, transparent 0 38%, rgba(5, 12, 20, 0.38) 70%);
}
.pf-scan-frame {
  position: absolute; left: 16%; top: 14%;
  width: 68%; aspect-ratio: 4 / 5;
  border: 2px solid rgba(255, 255, 255, 0.75); border-radius: 20px;
}
.pf-scan-frame i { position: absolute; width: 26px; height: 26px; border-color: var(--coral); border-style: solid; }
.pf-scan-frame i:nth-child(1) { left: -3px; top: -3px; border-width: 4px 0 0 4px; border-radius: 12px 0 0 0; }
.pf-scan-frame i:nth-child(2) { right: -3px; top: -3px; border-width: 4px 4px 0 0; border-radius: 0 12px 0 0; }
.pf-scan-frame i:nth-child(3) { left: -3px; bottom: -3px; border-width: 0 0 4px 4px; border-radius: 0 0 0 12px; }
.pf-scan-frame i:nth-child(4) { right: -3px; bottom: -3px; border-width: 0 4px 4px 0; border-radius: 0 0 12px 0; }
.pf-scan-line {
  position: absolute; left: 8%; right: 8%; top: 10%; height: 2px;
  background: linear-gradient(90deg, transparent, var(--coral), transparent);
  box-shadow: 0 0 12px var(--coral);
  animation: pf-scan 2.5s infinite ease-in-out;
}
@keyframes pf-scan { 50% { top: 88%; } }
.pf-scan-tip {
  position: absolute; left: 0; right: 0; bottom: 24px;
  margin: 0; text-align: center;
  color: #d8dfe5; font-size: 12px;
}
.pf-shutter {
  position: absolute; bottom: 34px; left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  padding: 12px 20px;
  border-radius: 999px;
  background: #fff; color: var(--ink);
  font-size: 14px; font-weight: 800;
}
.pf-ar-playing {
  position: absolute; inset: 12% 11% 18%;
  border-radius: 18px; overflow: hidden;
  background: linear-gradient(150deg, #4a8394, #9ad1c1 53%, #e6b170 54%);
  opacity: 0; transform: scale(0.9);
  transition: opacity 0.45s, transform 0.45s;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
}
.pf-ar-playing::before {
  content: ''; position: absolute;
  width: 220px; height: 100px; left: -30px; top: 50%;
  border-radius: 50%; background: #25485a;
  box-shadow: 120px -15px 0 #48756f, 220px -35px 0 #25394c;
  animation: pf-pan 5s infinite alternate ease-in-out;
}
@keyframes pf-pan { to { transform: translateX(-22px) scale(1.04); } }
.pf-ar-live {
  position: absolute; top: 12px; left: 12px;
  padding: 7px 9px; border-radius: 99px;
  background: rgba(255, 255, 255, 0.88); color: var(--ink);
  font-size: 12px; font-weight: 850;
}
.pf-viewfinder.playing .pf-ar-playing { opacity: 1; transform: none; }
.pf-viewfinder.playing .pf-scan-frame,
.pf-viewfinder.playing .pf-shutter,
.pf-viewfinder.playing .pf-scan-tip { opacity: 0; pointer-events: none; }
/* 归档 `.viewfinder.photo-mode`：隐藏扫描框，快门变成圆钮 */
.pf-viewfinder.photo .pf-scan-frame { display: none; }
.pf-viewfinder.photo .pf-shutter {
  width: 72px; height: 72px; padding: 0;
  color: transparent;
  border: 6px solid #fff;
  background: rgba(255, 255, 255, 0.28);
  box-shadow: inset 0 0 0 4px #16212d;
}
.pf-viewfinder.photo .pf-scan-tip { bottom: 118px; }

/* ---------- 打印进度模态（归档 `.progress-modal`） ---------- */
.pf-progress {
  position: absolute; inset: 0; z-index: 60;
  background: rgba(21, 27, 34, 0.55);
  display: flex; align-items: flex-end;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.pf-progress-card {
  width: 100%;
  padding: 26px 22px calc(var(--safe-bottom) + 22px);
  border-radius: 28px 28px 0 0;
  background: var(--paper); color: var(--ink);
  animation: pf-sheet-up 0.35s ease;
}
@keyframes pf-sheet-up { from { transform: translateY(100%); } to { transform: none; } }
.pf-progress-card h3 { margin: 0; font-size: 20px; font-weight: 800; }
.pf-progress-card p { margin: 8px 0 0; color: var(--muted); font-size: 13px; line-height: 1.6; }
.pf-progress-number { margin: 22px 0 12px; font-size: 50px; font-weight: 850; letter-spacing: -3px; line-height: 1; }
.pf-progress-number span { font-size: 20px; color: var(--muted); letter-spacing: 0; }
.pf-progress-track { height: 9px; border-radius: 99px; background: #e4e0d8; overflow: hidden; }
.pf-progress-track i {
  display: block; height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--coral), #ff9e76);
  transition: width 0.35s ease;
}
.pf-progress-meta {
  display: flex; justify-content: space-between;
  margin-top: 9px; color: var(--muted); font-size: 12px;
}
.pf-progress-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 22px; }
.pf-done { text-align: center; padding-top: 4px; }
.pf-done-icon {
  width: 68px; height: 68px; margin: 0 auto 18px;
  display: grid; place-items: center;
  border-radius: 50%; background: #e3f7f2; color: #239b88;
  font-size: 28px;
}
.pf-done h3 { font-size: 22px; }
.pf-done p { max-width: 272px; margin: 9px auto 20px; }
</style>
