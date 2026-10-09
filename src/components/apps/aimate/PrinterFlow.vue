<script setup>
/**
 * AI Mate · 口袋打印机（依据归档 `ai-mate-printer-demo.html` 还原）
 * ============================================================
 * 五屏：source 选来源 / picker 选图 / editor 编辑 / queue 打印队列 / ar AR 视频打印
 * 视觉沿用 AI Mate 的浅色分组语言，强调色取归档 banner 渐变的 #7b5cff。
 * 相册素材为归档 `ai-mate-assets/photos/` 的 6 张实拍图（已拷入 public/photos/）。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18nStore } from '../../../stores/i18nStore'
import {
  useAiMateStore, PHOTO_GROUPS, PRINTER_PHOTOS, PRINT_LAYOUTS, PRINT_FILTERS,
  EDIT_TOOLS, PRINT_QUALITIES, PRINT_COLORS, PRINT_TICK_MS, PRINT_MAX_PICKS, AR_VIDEO
} from '../../../stores/aiMateStore'
import LIcon from '../../ui/LIcon.vue'

const emit = defineEmits(['close'])

const i18n = useI18nStore()
const mate = useAiMateStore()
const am = (p) => i18n.am(p)

/* 图标与滤镜映射（图标名均为 LUCIDE 已登记的键） */
const TOOL_ICONS = { crop: 'crop', layout: 'layoutTemplate', frame: 'frame', filter: 'palette', adjust: 'slidersHorizontal' }
const LAYOUT_ICONS = { square: 'square', border: 'frame', full: 'maximize', coral: 'shapes', film: 'film', handwrite: 'pencil' }
const STAGE_ICONS = { sending: 'upload', developing: 'image', cutting: 'scissors', done: 'checkCircle' }
const FILTER_CSS = {
  original: '',
  sunny: 'saturate(1.28) brightness(1.06)',
  oldfilm: 'sepia(.45) contrast(1.06)',
  mono: 'grayscale(1)'
}

const photoById = (id) => PRINTER_PHOTOS.find((p) => p.id === id) || null
const groups = computed(() => PHOTO_GROUPS.map((g) => ({
  id: g,
  label: am('printer.group.' + g),
  n: PRINTER_PHOTOS.filter((p) => p.groups.includes(g)).length
})))
const photos = computed(() => mate.photosInGroup)
const pickIndex = (id) => mate.pickedIds.indexOf(id)
const previewPhoto = computed(() => mate.pickedPhotos[0] || photoById('p1'))

/** 编辑预览：滤镜 + 亮度 + 旋转（旋转 90/270 时缩一点，避免裁到角） */
const previewStyle = computed(() => {
  const base = FILTER_CSS[mate.editFilter] || ''
  const bright = 'brightness(' + (1 + mate.editBrightness / 100).toFixed(2) + ')'
  return {
    filter: [base, bright].filter(Boolean).join(' '),
    transform: 'rotate(' + mate.editRotate + 'deg) scale(' + (mate.editRotate % 180 === 90 ? 0.72 : 1) + ')'
  }
})

/* 队列里还有未完成的活时才跑定时器 */
let ticker = null
const hasActive = computed(() => mate.queue.some((j) => j.stage !== 'done' && !j.paused))
watch(hasActive, (on) => {
  clearInterval(ticker)
  if (on) ticker = setInterval(() => mate.tickPrint(), PRINT_TICK_MS)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(ticker))

/* AR 裁剪区间：拖动两端 */
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

/** AR 扫描回放：扫描中 → 识别锚点 → 播放（循环可重放） */
const AR_CYCLE = ['scanning', 'locked', 'playing']
function scanAr() {
  let i = 0
  mate.setArScan(AR_CYCLE[0])
  const t = setInterval(() => {
    i += 1
    if (i >= AR_CYCLE.length) { clearInterval(t); return }
    mate.setArScan(AR_CYCLE[i])
  }, 1100)
}
const arScanText = computed(() => {
  if (mate.arScan === 'scanning') return am('printer.arHint')
  if (mate.arScan === 'locked') return am('printer.arLocked')
  if (mate.arScan === 'playing') return am('printer.arPlaying')
  return am('printer.arHint')
})
</script>

<template>
  <div class="pf" data-flow-root="printer">
    <!-- ================= 来源 ================= -->
    <template v-if="mate.printScreen === 'source'">
      <header class="pf-head">
        <button class="pf-back" aria-label="back" @click="emit('close')">
          <LIcon name="arrowLeft" :size="18" />
        </button>
        <h2 class="pf-title">{{ am('printer.title') }}</h2>
        <span class="pf-spacer" />
      </header>

      <div class="pf-scroll">
        <p class="pf-kicker">{{ am('printer.sourceTitle') }}</p>

        <button class="pf-source" @click="mate.setPhotoGroup('recent'); mate.gotoPrintScreen('picker')">
          <span class="pf-source-icon" style="background:#EFEAFF;color:#7b5cff">
            <LIcon name="images" :size="19" />
          </span>
          <span class="pf-source-text">
            <strong>{{ am('printer.gallery') }}</strong>
            <small>{{ am('printer.gallerySub') }}</small>
          </span>
          <LIcon name="chevronRight" :size="16" class="pf-chev" />
        </button>

        <button class="pf-source" @click="mate.setPhotoGroup('camera'); mate.gotoPrintScreen('picker')">
          <span class="pf-source-icon" style="background:#E8F6F4;color:#4dc8b7">
            <LIcon name="aperture" :size="19" />
          </span>
          <span class="pf-source-text">
            <strong>{{ am('printer.camera') }}</strong>
            <small>{{ am('printer.cameraSub') }}</small>
          </span>
          <LIcon name="chevronRight" :size="16" class="pf-chev" />
        </button>

        <button class="pf-source" @click="mate.gotoPrintScreen('ar')">
          <span class="pf-source-icon" style="background:#FFF0ED;color:#ff6856">
            <LIcon name="video" :size="19" />
          </span>
          <span class="pf-source-text">
            <strong>{{ am('printer.ar') }}</strong>
            <small>{{ am('printer.arSub') }}</small>
          </span>
          <LIcon name="chevronRight" :size="16" class="pf-chev" />
        </button>

        <!-- 耗材与队列在这里也能看到（归档首页的入口） -->
        <div class="pf-card pf-paper">
          <div class="pf-paper-row">
            <span>{{ am('printer.paper') }}</span>
            <b>{{ mate.paper }} {{ am('printer.unit') }}</b>
          </div>
          <div class="pf-paper-track"><i :style="{ width: Math.min(100, mate.paper / 30 * 100) + '%' }" /></div>
          <button class="pf-ghost-btn" :disabled="mate.paperFull" @click="mate.buyPaper()">
            <LIcon name="plus" :size="14" />
            {{ mate.paperFull ? am('printer.paperFull') : am('printer.buyPaper') }}
          </button>
        </div>

        <button class="pf-link" @click="mate.gotoPrintScreen('queue')">
          <LIcon name="listMusic" :size="15" />
          {{ am('printer.queueTitle') }}
          <b v-if="mate.activeJobs.length">{{ mate.activeJobs.length }}</b>
        </button>
      </div>
    </template>

    <!-- ================= 选图 ================= -->
    <template v-else-if="mate.printScreen === 'picker'">
      <header class="pf-head">
        <button class="pf-back" aria-label="back" @click="mate.gotoPrintScreen('source')">
          <LIcon name="arrowLeft" :size="18" />
        </button>
        <h2 class="pf-title">{{ am('printer.pickTitle') }}</h2>
        <span class="pf-count">{{ mate.pickedCount }}/{{ PRINT_MAX_PICKS }}</span>
      </header>

      <div class="pf-tabs">
        <button
          v-for="g in groups"
          :key="g.id"
          class="pf-tab"
          :class="{ on: mate.photoGroup === g.id }"
          :data-group="g.id"
          @click="mate.setPhotoGroup(g.id)"
        >
          {{ g.label }}<i>{{ g.n }}</i>
        </button>
      </div>

      <div class="pf-scroll">
        <p class="pf-kicker">{{ am('printer.pickHint').replace('{n}', PRINT_MAX_PICKS) }}</p>
        <div class="pf-grid">
          <button
            v-for="p in photos"
            :key="p.id"
            class="pf-photo"
            :class="{ on: pickIndex(p.id) >= 0 }"
            :data-photo-id="p.id"
            @click="mate.togglePhoto(p.id)"
          >
            <img :src="p.src" :alt="p.id" />
            <span v-if="pickIndex(p.id) >= 0" class="pf-badge">{{ pickIndex(p.id) + 1 }}</span>
          </button>
        </div>
        <p v-if="!photos.length" class="pf-empty">{{ am('printer.emptyGroup') }}</p>
      </div>

      <footer class="pf-foot">
        <button class="pf-primary" :disabled="!mate.pickedCount" @click="mate.gotoPrintScreen('editor')">
          {{ am('printer.nextEdit') }}
        </button>
      </footer>
    </template>

    <!-- ================= 编辑 ================= -->
    <template v-else-if="mate.printScreen === 'editor'">
      <header class="pf-head">
        <button class="pf-back" aria-label="back" @click="mate.gotoPrintScreen('picker')">
          <LIcon name="arrowLeft" :size="18" />
        </button>
        <h2 class="pf-title">{{ am('printer.editTitle') }}</h2>
        <button class="pf-reset" @click="mate.resetEdit()">{{ am('printer.reset') }}</button>
      </header>

      <div class="pf-scroll">
        <!-- 版式预览 -->
        <div class="pf-stage">
          <div class="pf-frame" :class="'lay-' + mate.editLayout">
            <img v-if="previewPhoto" class="pf-img" :src="previewPhoto.src" :style="previewStyle" alt="preview" />
            <span v-if="mate.editLayout === 'film'" class="pf-perf top" />
            <span v-if="mate.editLayout === 'film'" class="pf-perf bottom" />
            <span v-if="mate.editLayout === 'handwrite'" class="pf-hand">island walk</span>
          </div>
          <p class="pf-stage-cap">{{ am('printer.layoutName') }}</p>
        </div>

        <!-- 工具条 -->
        <div class="pf-tools">
          <button
            v-for="t in EDIT_TOOLS"
            :key="t"
            class="pf-tool"
            :class="{ on: mate.editTool === t }"
            :data-tool="t"
            @click="mate.setEditTool(t)"
          >
            <LIcon :name="TOOL_ICONS[t]" :size="18" />
            <span>{{ am('printer.tool.' + t) }}</span>
          </button>
        </div>

        <!-- 版式 -->
        <section v-if="mate.editTool === 'layout' || mate.editTool === 'frame'" class="pf-panel">
          <div class="pf-chips">
            <button
              v-for="l in PRINT_LAYOUTS"
              :key="l"
              class="pf-chip"
              :class="{ on: mate.editLayout === l }"
              :data-layout="l"
              @click="mate.setEditLayout(l)"
            >
              <LIcon :name="LAYOUT_ICONS[l]" :size="14" />
              {{ am('printer.layout.' + l) }}
            </button>
          </div>
        </section>

        <!-- 滤镜 -->
        <section v-if="mate.editTool === 'filter'" class="pf-panel">
          <div class="pf-chips">
            <button
              v-for="f in PRINT_FILTERS"
              :key="f"
              class="pf-chip"
              :class="{ on: mate.editFilter === f }"
              :data-filter="f"
              @click="mate.setEditFilter(f)"
            >
              <span class="pf-swatch" :style="{ background: '#c9c9cf', filter: FILTER_CSS[f] || 'none' }" />
              {{ am('printer.filter.' + f) }}
            </button>
          </div>
        </section>

        <!-- 裁剪与旋转 / 调节 -->
        <section v-if="mate.editTool === 'crop' || mate.editTool === 'adjust'" class="pf-panel">
          <div class="pf-slider-row">
            <span>{{ am('printer.brightness') }}</span>
            <b>{{ mate.editBrightness > 0 ? '+' : '' }}{{ mate.editBrightness }}</b>
          </div>
          <input
            class="pf-range"
            type="range"
            min="-50"
            max="50"
            :value="mate.editBrightness"
            :style="{ '--pf-fill': ((mate.editBrightness + 50) / 100 * 100) + '%' }"
            @input="mate.setEditBrightness($event.target.value)"
          />
          <button class="pf-ghost-btn" @click="mate.rotateEditPhoto()">
            <LIcon name="rotateCw" :size="14" />
            {{ am('printer.rotate') }} · {{ mate.editRotate }}°
          </button>
        </section>

        <!-- 打印设置（归档：质量 / 色彩模式） -->
        <section class="pf-panel">
          <h3 class="pf-panel-title">{{ am('printer.quality') }}</h3>
          <div class="pf-chips">
            <button
              v-for="q in PRINT_QUALITIES"
              :key="q"
              class="pf-chip"
              :class="{ on: mate.printQuality === q }"
              :data-quality="q"
              @click="mate.setPrintQuality(q)"
            >
              {{ q === 'hd' ? am('printer.qualityHD') : am('printer.qualityStd') }}
            </button>
          </div>

          <h3 class="pf-panel-title">{{ am('printer.colorMode') }}</h3>
          <div class="pf-chips">
            <button
              v-for="c in PRINT_COLORS"
              :key="c"
              class="pf-chip"
              :class="{ on: mate.printColor === c }"
              :data-color="c"
              @click="mate.setPrintColor(c)"
            >
              {{ c === 'vivid' ? am('printer.colorVivid') : c === 'retro' ? am('printer.colorRetro') : am('printer.colorNatural') }}
            </button>
          </div>

          <div class="pf-paper-row tight">
            <span>{{ am('printer.paper') }}</span>
            <b>{{ mate.paper }} {{ am('printer.unit') }}</b>
          </div>
        </section>
      </div>

      <footer class="pf-foot">
        <button class="pf-primary" :disabled="!mate.pickedCount" @click="mate.startPrint()">
          {{ mate.pickedCount > 1 ? am('printer.startPrintN').replace('{n}', mate.pickedCount) : am('printer.startPrint') }}
        </button>
      </footer>
    </template>

    <!-- ================= 打印队列 ================= -->
    <template v-else-if="mate.printScreen === 'queue'">
      <header class="pf-head">
        <button class="pf-back" aria-label="back" @click="emit('close')">
          <LIcon name="arrowLeft" :size="18" />
        </button>
        <h2 class="pf-title">{{ am('printer.queueTitle') }}</h2>
        <button v-if="mate.queue.some((j) => j.stage === 'done')" class="pf-reset" @click="mate.clearDoneJobs()">
          {{ am('printer.clearDone') }}
        </button>
      </header>

      <div class="pf-scroll">
        <p v-if="!mate.queue.length" class="pf-empty">{{ am('printer.queueEmpty') }}</p>

        <article v-for="j in mate.queue" :key="j.id" class="pf-job" :data-job-id="j.id" :data-stage="j.stage">
          <img v-if="photoById(j.photoId)" class="pf-job-thumb" :src="photoById(j.photoId).src" alt="" />
          <div class="pf-job-main">
            <div class="pf-job-line">
              <LIcon :name="STAGE_ICONS[j.stage]" :size="14" :class="{ 'pf-spin': j.stage !== 'done' && !j.paused }" />
              <span class="pf-job-stage">{{ am('printer.stage.' + j.stage) }}</span>
              <b class="pf-job-pct">{{ Math.round(j.progress) }}%</b>
            </div>
            <div class="pf-job-track">
              <i :style="{ width: j.progress + '%' }" :class="{ paused: j.paused, done: j.stage === 'done' }" />
            </div>
          </div>
          <button v-if="j.stage !== 'done'" class="pf-job-act" @click="j.paused ? mate.resumeJob(j.id) : mate.pauseJob(j.id)">
            {{ j.paused ? am('printer.resume') : am('printer.pause') }}
          </button>
          <button v-if="j.stage !== 'done'" class="pf-job-act danger" @click="mate.cancelJob(j.id)">
            {{ am('printer.cancel') }}
          </button>
        </article>

        <button class="pf-link" @click="mate.gotoPrintScreen('source')">
          <LIcon name="plus" :size="15" />
          {{ am('printer.title') }}
        </button>
      </div>
    </template>

    <!-- ================= AR 视频打印 ================= -->
    <template v-else-if="mate.printScreen === 'ar'">
      <header class="pf-head">
        <button class="pf-back" aria-label="back" @click="mate.gotoPrintScreen('source')">
          <LIcon name="arrowLeft" :size="18" />
        </button>
        <h2 class="pf-title">{{ am('printer.arTitle') }}</h2>
        <span class="pf-spacer" />
      </header>

      <div class="pf-scroll">
        <!-- 视频卡（归档素材；视频文件未随归档提供，播放为模拟） -->
        <div class="pf-card">
          <div class="pf-video">
            <button class="pf-play" aria-label="play" @click="scanAr()">
              <LIcon name="play" :size="18" />
            </button>
            <span class="pf-video-badge">{{ am('printer.arOriginal') }}</span>
          </div>
          <div class="pf-video-info">
            <strong>{{ AR_VIDEO.name }}</strong>
            <small>{{ AR_VIDEO.duration }}s · {{ AR_VIDEO.size }}</small>
          </div>
        </div>

        <!-- 裁剪区间 -->
        <p class="pf-kicker">{{ am('printer.arTrim').replace('{n}', mate.arTrimSeconds) }}</p>
        <div ref="arTrack" class="pf-trim" data-trim-track>
          <span class="pf-trim-film" />
          <span class="pf-trim-sel" :style="{ left: trimLeftPct + '%', right: (100 - trimRightPct) + '%' }" />
          <span
            class="pf-trim-h l"
            :style="{ left: trimLeftPct + '%' }"
            data-trim="start"
            @pointerdown.prevent="dragTrim('start', $event)"
          />
          <span
            class="pf-trim-h r"
            :style="{ left: trimRightPct + '%' }"
            data-trim="end"
            @pointerdown.prevent="dragTrim('end', $event)"
          />
        </div>
        <p class="pf-trim-read">{{ mate.arTrimStart.toFixed(1) }}s – {{ mate.arTrimEnd.toFixed(1) }}s · {{ mate.arTrimSeconds }}s</p>

        <!-- 绑定照片 -->
        <div class="pf-bind">
          <span class="pf-bind-photo">
            <img v-if="previewPhoto" :src="previewPhoto.src" alt="cover" />
          </span>
          <LIcon name="link" :size="16" class="pf-bind-link" />
          <span class="pf-bind-copy">
            <strong>{{ mate.pickedCount ? am('printer.editTitle') : am('printer.pickTitle') }}</strong>
            <small>{{ AR_VIDEO.name }} · {{ mate.arTrimSeconds }}s</small>
          </span>
          <button class="pf-ghost-btn slim" @click="mate.gotoPrintScreen('picker')">{{ am('printer.next') }}</button>
        </div>

        <!-- 扫描回放 -->
        <section class="pf-panel">
          <h3 class="pf-panel-title">{{ am('printer.arScanTitle') }}</h3>
          <div class="pf-scan" :class="{ live: mate.arScan }" data-ar-scan>
            <span class="pf-scan-box">
              <i class="c tl" /><i class="c tr" /><i class="c bl" /><i class="c br" />
              <img v-if="previewPhoto" :src="previewPhoto.src" alt="" :class="{ playing: mate.arScan === 'playing' }" />
            </span>
            <p class="pf-scan-text" data-ar-scan-text>{{ arScanText }}</p>
          </div>
          <div class="pf-chips" style="justify-content:center">
            <button class="pf-chip" @click="scanAr()">
              <LIcon name="scanLine" :size="14" />
              {{ am('printer.arScan') }}
            </button>
            <button class="pf-chip" :disabled="mate.arScan !== null" @click="mate.setArScan(null)">
              {{ am('printer.reset') }}
            </button>
          </div>
        </section>
      </div>

      <footer class="pf-foot">
        <button class="pf-primary" :disabled="!mate.pickedCount" @click="mate.startPrint()">
          {{ am('printer.arSnap') }}
        </button>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.pf {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F2F2F7;
  z-index: 40;
}

/* ---------- 头部 ---------- */
/* 头部几何与 AimateApp 的 .am-header 完全一致：
   按钮必须落在 ScreenView 顶部 64px 边缘手势热区（--z-edge-zone）之下，否则点击会被 edge-zone 拦截 */
.pf-head {
  flex: none;
  height: calc(var(--safe-top) + 52px);
  padding: var(--safe-top) 12px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #F2F2F7;
}
.pf-back {
  width: 32px; height: 32px;
  border: none; border-radius: 50%;
  background: transparent;
  color: #7b5cff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.pf-title { margin: 0; font-size: 17px; font-weight: 700; color: #1c1c1e; letter-spacing: -0.2px; }
.pf-spacer { flex: 1; }
.pf-count { font-size: 13px; color: #8E8E93; font-variant-numeric: tabular-nums; }
.pf-reset {
  margin-left: auto;
  border: none; background: transparent;
  color: #7b5cff; font-size: 13px; font-weight: 550;
  cursor: pointer; padding: 4px 2px;
}

/* ---------- 滚动区 ---------- */
.pf-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px calc(var(--safe-bottom) + 26px);
}
.pf-kicker {
  margin: 6px 2px 10px;
  font-size: 12.5px;
  color: #8E8E93;
}

/* ---------- 来源卡 ---------- */
.pf-source {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  margin-bottom: 10px;
  border: none;
  border-radius: 16px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}
.pf-source:active { transform: scale(.99); }
.pf-source-icon {
  width: 40px; height: 40px;
  border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  flex: none;
}
.pf-source-text { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pf-source-text strong { font-size: 14.5px; font-weight: 600; color: #1c1c1e; }
.pf-source-text small { font-size: 12px; color: #8E8E93; }
.pf-chev { color: #C7C7CC; }

/* ---------- 通用卡 ---------- */
.pf-card {
  background: #fff;
  border-radius: 16px;
  padding: 14px;
  margin: 12px 0;
}
.pf-paper-row {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13.5px; color: #3A3A3C;
}
.pf-paper-row b { font-weight: 650; color: #1c1c1e; font-variant-numeric: tabular-nums; }
.pf-paper-row.tight { margin-top: 14px; }
.pf-paper-track {
  height: 6px; margin: 10px 0 12px;
  border-radius: 3px; background: #EFEFF4; overflow: hidden;
}
.pf-paper-track i { display: block; height: 100%; border-radius: 3px; background: linear-gradient(90deg,#7b5cff,#5a3fe0); }

.pf-ghost-btn {
  width: 100%;
  border: none; border-radius: 11px;
  background: #F2F2F7; color: #7b5cff;
  font-size: 13px; font-weight: 600;
  padding: 10px;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  cursor: pointer;
}
.pf-ghost-btn:disabled { color: #A1A1A6; cursor: default; }
.pf-ghost-btn.slim { width: auto; padding: 7px 12px; font-size: 12.5px; }

.pf-link {
  width: 100%;
  margin-top: 12px;
  border: none; background: transparent;
  color: #7b5cff; font-size: 13.5px; font-weight: 550;
  padding: 10px;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  cursor: pointer;
}
.pf-link b {
  min-width: 18px; height: 18px; border-radius: 9px;
  background: #7b5cff; color: #fff;
  font-size: 11px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 5px;
}

/* ---------- 分组 tab ---------- */
.pf-tabs {
  flex: none;
  display: flex; gap: 6px;
  padding: 0 16px 10px;
  overflow-x: auto;
}
.pf-tab {
  flex: none;
  border: none; border-radius: 999px;
  background: #E9E9EF; color: #3A3A3C;
  font-size: 12.5px; font-weight: 550;
  padding: 7px 13px;
  display: inline-flex; align-items: center; gap: 5px;
  cursor: pointer;
}
.pf-tab i { font-style: normal; font-size: 11px; color: #8E8E93; }
.pf-tab.on { background: #7b5cff; color: #fff; }
.pf-tab.on i { color: rgba(255,255,255,.75); }

/* ---------- 照片网格 ---------- */
.pf-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
}
.pf-photo {
  position: relative;
  padding: 0; border: none;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: #E5E5EA;
  cursor: pointer;
}
.pf-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pf-photo.on { outline: 3px solid #7b5cff; outline-offset: -3px; }
.pf-badge {
  position: absolute; top: 6px; right: 6px;
  width: 20px; height: 20px; border-radius: 10px;
  background: #7b5cff; color: #fff;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.pf-empty { text-align: center; color: #A1A1A6; font-size: 13px; padding: 28px 0; }

/* ---------- 底部按钮 ---------- */
.pf-foot {
  flex: none;
  padding: 10px 16px calc(var(--safe-bottom) + 14px);
  background: #F2F2F7;
}
.pf-primary {
  width: 100%;
  border: none; border-radius: 14px;
  background: #7b5cff; color: #fff;
  font-size: 14.5px; font-weight: 650;
  padding: 14px;
  cursor: pointer;
}
.pf-primary:disabled { opacity: .4; cursor: default; }

/* ---------- 编辑预览 ---------- */
.pf-stage { display: flex; flex-direction: column; align-items: center; padding: 6px 0 4px; }
.pf-frame {
  position: relative;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(35,38,44,.14);
}
.pf-img { display: block; width: 216px; height: 216px; object-fit: cover; transition: filter .18s ease, transform .18s ease; }
.lay-square .pf-img { width: 200px; height: 200px; }
.lay-border { padding: 9px 9px 34px; }
.lay-border .pf-img { width: 190px; height: 190px; }
.lay-full { padding: 0; }
.lay-full .pf-img { width: 220px; height: 220px; }
.lay-coral { padding: 7px; background: #ff6856; }
.lay-coral .pf-img { width: 200px; height: 200px; }
.lay-film { padding: 17px 7px; background: #1c1c1e; }
.lay-film .pf-img { width: 196px; height: 196px; }
.lay-handwrite { padding: 8px 8px 44px; }
.lay-handwrite .pf-img { width: 192px; height: 192px; }
.pf-hand {
  position: absolute; left: 0; right: 0; bottom: 13px;
  text-align: center;
  font-size: 12px; font-style: italic;
  color: #3A3A3C;
  font-family: "Snell Roundhand", "Segoe Script", cursive;
}
.pf-perf {
  position: absolute; left: 0; right: 0; height: 9px;
  background-image: repeating-linear-gradient(90deg, #3A3A3C 0 5px, transparent 5px 11px);
}
.pf-perf.top { top: 3px; }
.pf-perf.bottom { bottom: 3px; }
.pf-stage-cap { margin: 10px 0 0; font-size: 11.5px; color: #8E8E93; }

/* ---------- 工具条 ---------- */
.pf-tools {
  display: flex; gap: 6px;
  margin: 14px 0 4px;
}
.pf-tool {
  flex: 1;
  border: none; border-radius: 12px;
  background: #fff; color: #6E6E73;
  padding: 9px 2px 8px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  font-size: 10.5px; font-weight: 550;
  cursor: pointer;
}
.pf-tool.on { background: #EFEAFF; color: #7b5cff; }

/* ---------- 面板与 chip ---------- */
.pf-panel { background: #fff; border-radius: 16px; padding: 13px 14px; margin: 10px 0; }
.pf-panel-title { margin: 2px 0 9px; font-size: 12.5px; font-weight: 600; color: #6E6E73; }
.pf-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.pf-chip {
  border: none; border-radius: 999px;
  background: #F2F2F7; color: #3A3A3C;
  font-size: 12.5px; font-weight: 550;
  padding: 8px 13px;
  display: inline-flex; align-items: center; gap: 5px;
  cursor: pointer;
}
.pf-chip.on { background: #7b5cff; color: #fff; }
.pf-chip:disabled { opacity: .45; cursor: default; }
.pf-swatch { width: 13px; height: 13px; border-radius: 4px; display: inline-block; }
.pf-slider-row {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 13px; color: #3A3A3C; margin-bottom: 8px;
}
.pf-slider-row b { font-variant-numeric: tabular-nums; color: #1c1c1e; }
.pf-range {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 5px; border-radius: 3px; margin: 0 0 12px;
  background: linear-gradient(90deg, #7b5cff 0%, #7b5cff var(--pf-fill, 50%), #E5E5EA var(--pf-fill, 50%), #E5E5EA 100%);
  outline: none;
}
.pf-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 19px; height: 19px; border-radius: 50%;
  background: #fff; border: 1px solid #E5E5EA;
  box-shadow: 0 1px 4px rgba(0,0,0,.18);
  cursor: pointer;
}

/* ---------- 队列 ---------- */
.pf-job {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border-radius: 16px;
  padding: 11px 12px; margin-bottom: 9px;
}
.pf-job-thumb { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; flex: none; }
.pf-job-main { flex: 1; min-width: 0; }
.pf-job-line { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #3A3A3C; }
.pf-job-stage { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pf-job-pct { font-size: 11.5px; color: #8E8E93; font-variant-numeric: tabular-nums; }
.pf-job-track { height: 5px; margin-top: 8px; border-radius: 3px; background: #EFEFF4; overflow: hidden; }
.pf-job-track i { display: block; height: 100%; border-radius: 3px; background: linear-gradient(90deg,#7b5cff,#5a3fe0); transition: width .12s linear; }
.pf-job-track i.paused { background: #FFCF67; }
.pf-job-track i.done { background: #4dc8b7; }
.pf-job-act {
  flex: none;
  border: none; border-radius: 9px;
  background: #F2F2F7; color: #7b5cff;
  font-size: 11.5px; font-weight: 600;
  padding: 6px 9px; cursor: pointer;
}
.pf-job-act.danger { background: #FFF0ED; color: #ff6856; }
.pf-spin { animation: pf-rot .9s linear infinite; }
@keyframes pf-rot { to { transform: rotate(360deg); } }

/* ---------- AR ---------- */
.pf-video {
  position: relative;
  height: 132px; border-radius: 12px;
  background: linear-gradient(135deg,#4a4a52,#2b2b31);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.pf-play {
  width: 44px; height: 44px; border: none; border-radius: 50%;
  background: rgba(255,255,255,.24); color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.pf-video-badge {
  position: absolute; left: 10px; top: 10px;
  font-size: 11px; color: #fff;
  background: rgba(0,0,0,.35);
  border-radius: 999px; padding: 3px 9px;
}
.pf-video-info { display: flex; flex-direction: column; gap: 2px; margin-top: 10px; }
.pf-video-info strong { font-size: 13.5px; color: #1c1c1e; }
.pf-video-info small { font-size: 11.5px; color: #8E8E93; }

.pf-trim { position: relative; height: 46px; margin: 4px 0 6px; }
.pf-trim-film {
  position: absolute; inset: 0;
  border-radius: 8px;
  background-image: repeating-linear-gradient(90deg, #D8D8DE 0 22px, #E9E9EF 22px 26px);
}
.pf-trim-sel {
  position: absolute; top: -3px; bottom: -3px;
  border: 2px solid #7b5cff; border-radius: 10px;
  background: rgba(123,92,255,.14);
}
.pf-trim-h {
  position: absolute; top: -5px; bottom: -5px;
  width: 14px; margin-left: -7px;
  border-radius: 7px; background: #7b5cff;
  cursor: ew-resize;
}
/* 视觉 14px，实际可抓 26×56 —— 12px 的手柄在真机上太难点 */
.pf-trim-h::after { content: ''; position: absolute; inset: -8px -6px; }
.pf-trim-read { margin: 8px 2px 12px; font-size: 11.5px; color: #8E8E93; font-variant-numeric: tabular-nums; }

.pf-bind {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border-radius: 16px; padding: 12px;
}
.pf-bind-photo { width: 46px; height: 46px; border-radius: 11px; overflow: hidden; background: #EFEFF4; flex: none; }
.pf-bind-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pf-bind-link { color: #7b5cff; flex: none; }
.pf-bind-copy { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pf-bind-copy strong { font-size: 13px; color: #1c1c1e; }
.pf-bind-copy small { font-size: 11.5px; color: #8E8E93; }

.pf-scan { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 6px 0 12px; }
.pf-scan-box {
  position: relative;
  width: 132px; height: 132px;
  border-radius: 12px; overflow: hidden;
  background: #EFEFF4;
  display: flex; align-items: center; justify-content: center;
}
.pf-scan-box img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pf-scan-box img.playing { animation: pf-ken 3.2s ease-in-out infinite alternate; }
@keyframes pf-ken { from { transform: scale(1); } to { transform: scale(1.12) translate(3px,-3px); } }
.pf-scan-box .c { position: absolute; width: 18px; height: 18px; border: 2px solid #7b5cff; }
.pf-scan-box .c.tl { top: 6px; left: 6px; border-right: none; border-bottom: none; border-radius: 6px 0 0 0; }
.pf-scan-box .c.tr { top: 6px; right: 6px; border-left: none; border-bottom: none; border-radius: 0 6px 0 0; }
.pf-scan-box .c.bl { bottom: 6px; left: 6px; border-right: none; border-top: none; border-radius: 0 0 0 6px; }
.pf-scan-box .c.br { bottom: 6px; right: 6px; border-left: none; border-top: none; border-radius: 0 0 6px 0; }
.pf-scan-text { margin: 0; font-size: 12px; color: #8E8E93; }
</style>
