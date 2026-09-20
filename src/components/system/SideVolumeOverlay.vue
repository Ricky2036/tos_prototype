<script setup>
/**
 * 侧边音量浮层：实体音量键 / 侧栏唤起，四种形态。
 *   expanded → 展开条（50×224，含「更多」与「按应用」两个入口）
 *   compact  → 收起成 10px 细条，音量键继续按时做弹跳
 *   panel    → 系统音量面板（媒体/铃声/通知/闹钟 **四轨**，2026-09-20 按参考图去掉「语音助手」轨）
 *   media    → 按应用媒体音量面板
 *
 * 相对原型的适配（见 docs/tos-feature-integration-plan.html）：
 *   1. 文案全部走 locales/volume.js（zh/en/bn），不再硬编码中文；
 *   2. 媒体品牌图标改用仓库现成的 NotificationIcon（它同时支持 PNG 与内联 SVG，
 *      而 NOTIF_ICONS 在本仓库已整体换成 PNG 资源）；
 *   3. z-index 走 tokens 刻度，不再写 124/125/126 这类散值。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useControlStore } from '../../stores/controlStore'
import { useSystemStore } from '../../stores/systemStore'
import { useI18nStore } from '../../stores/i18nStore'
import { VOLUME_LABELS } from '../../locales/volume.js'
import LIcon from '../ui/LIcon.vue'
import NotificationIcon from '../ui/NotificationIcon.vue'
import { NOTIF_ICONS } from '../ui/notifIcons'

const control = useControlStore()
const system = useSystemStore()
const i18n = useI18nStore()
const vLabel = (k) => VOLUME_LABELS[i18n.locale]?.[k] ?? VOLUME_LABELS.zh[k] ?? k

let lifecycleTimer = null
let plusValueTimer = null
let customGuideTimer = null
let appMuteGuideTimer = null
let sliderActive = false
const anchorHandoff = ref(false)
const showTopPlusValue = ref(false)
const showCustomGuide = ref(false)
const showAppMuteGuide = ref(false)
let customGuideSeen = false

const expanded = computed(() => control.sideVolumeMode === 'expanded')
const compact = computed(() => control.sideVolumeMode === 'compact')
const modalOpen = computed(() => control.sideVolumeMode === 'panel' || control.sideVolumeMode === 'media')
const isMedia = computed(() => control.sideVolumeMode === 'media')
const volumePct = computed(() => control.volumePlusLevel ? 100 : control.volume * 100)
const volumeDisplayPct = computed(() => control.volumePlusLevel ? control.volumePlusLevel * 100 : Math.round(control.volume * 100))
const modalTitle = computed(() => isMedia.value ? vLabel('mediaVolume') : vLabel('channels')[control.sideVolumeChannel])

function scheduleLifecycle() {
  clearTimeout(lifecycleTimer)
  if (sliderActive) return
  const mode = control.sideVolumeMode
  if (mode === 'expanded') lifecycleTimer = window.setTimeout(() => control.closeSideVolume(), 5000)
  else if (mode === 'compact' || mode === 'panel' || mode === 'media') {
    lifecycleTimer = window.setTimeout(() => control.closeSideVolume(), mode === 'compact' ? 3000 : 5000)
  }
}

watch(() => control.sideVolumePulse, scheduleLifecycle)
watch(() => control.sideVolumeMode, (mode) => {
  clearTimeout(lifecycleTimer)
  if (mode !== 'hidden') scheduleLifecycle()
  clearTimeout(customGuideTimer)
  if (mode === 'expanded' && !customGuideSeen) {
    customGuideSeen = true
    showCustomGuide.value = true
    customGuideTimer = window.setTimeout(() => { showCustomGuide.value = false }, 3000)
  } else if (mode !== 'expanded') showCustomGuide.value = false
})
watch(
  () => [control.volumePlusLevel, control.sideVolumeMode, control.sideVolumePulse],
  () => {
    clearTimeout(plusValueTimer)
    if (control.sideVolumeMode === 'expanded' && control.volumePlusLevel) {
      showTopPlusValue.value = true
      plusValueTimer = window.setTimeout(() => { showTopPlusValue.value = false }, 2000)
    } else showTopPlusValue.value = false
  }
)
watch(() => control.currentAppMuteGuideSeq, () => {
  clearTimeout(appMuteGuideTimer)
  showAppMuteGuide.value = true
  appMuteGuideTimer = window.setTimeout(() => { showAppMuteGuide.value = false }, 3000)
})
/* 控制中心一展开就收起侧栏，避免两层浮层叠在一起 */
watch(() => system.overlays.controlCenter.status, (status) => {
  if (status !== 'closed' && control.sideVolumeMode !== 'hidden') control.closeSideVolume()
})
onBeforeUnmount(() => {
  clearTimeout(lifecycleTimer)
  clearTimeout(plusValueTimer)
  clearTimeout(customGuideTimer)
  clearTimeout(appMuteGuideTimer)
})

function setFromPointer(event, setter) {
  event.preventDefault()
  event.stopPropagation()
  sliderActive = true
  clearTimeout(lifecycleTimer)
  const track = event.currentTarget
  const update = (e) => {
    const rect = track.getBoundingClientRect()
    setter(Math.min(1, Math.max(0, (rect.bottom - e.clientY) / rect.height)))
  }
  update(event)
  const stop = () => {
    sliderActive = false
    control.touchSideVolume()
    window.removeEventListener('pointermove', update)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
  }
  window.addEventListener('pointermove', update)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
}

const systemSliders = computed(() => [
  { key: 'media', icon: 'volume2', mutedIcon: 'volumeX', value: control.volume, main: true },
  { key: 'ring', icon: 'bell', mutedIcon: 'bellOff', value: control.auxiliaryVolumes.ring },
  { key: 'notification', icon: 'bellDot', mutedIcon: 'bellDotOff', value: control.auxiliaryVolumes.notification },
  { key: 'alarm', icon: 'alarmClock', mutedIcon: 'alarmClockOff', value: control.auxiliaryVolumes.alarm }
  /* ⚠️ 2026-09-20 按参考图（expanded.jpg）改成 **4 轨**：面板里只剩 喇叭/铃铛/带点铃铛/闹钟。
     `microphone` 的音量通路仍保留在 store（辅助音量里），只是不再出现在面板上。 */
])

/* app 指向 NOTIF_ICONS 的键；store 的按应用音量键沿用 mediaVolumes 里的 play/spotify/tiktok/video */
const mediaSliders = computed(() => [
  { key: 'system', system: true, icon: 'volume2', value: control.volume },
  { key: 'play', app: 'youtube', value: control.mediaVolumes.play },
  { key: 'spotify', app: 'spotify', value: control.mediaVolumes.spotify },
  { key: 'tiktok', app: 'tiktok', value: control.mediaVolumes.tiktok },
  { key: 'video', app: 'default', value: control.mediaVolumes.video }
])

function setSystem(item, value) {
  if (item.main) control.setVolume(value)
  else control.setAuxiliaryVolume(item.key, value)
}

function beginSystemPointer(event, item) {
  control.selectSideVolumeChannel(item.key)
  setFromPointer(event, value => setSystem(item, value))
}

function setMedia(item, value) {
  if (item.system) control.setVolume(value)
  else control.setMediaVolume(item.key, value)
}

async function openAnchoredPanel(mode) {
  anchorHandoff.value = true
  await nextTick()
  control.openSideVolumePanel(mode)
  window.setTimeout(() => { anchorHandoff.value = false }, 420)
}

const appMuteName = computed(() => NOTIF_ICONS?.youtube ? 'YouTube' : '')
</script>

<template>
  <div v-if="expanded || compact" class="sv-dismiss-layer" @click="control.closeSideVolume()"></div>
  <Transition name="side-volume">
    <div v-if="expanded || compact" class="side-volume-wrap" :class="{ compact, 'anchor-handoff': anchorHandoff }" data-testid="side-volume">
      <button
        v-if="expanded"
        class="sv-more"
        :class="{ inverted: volumePct > 87 && !showTopPlusValue, 'showing-value': showTopPlusValue }"
        :aria-label="vLabel('moreVolume')"
        data-testid="side-volume-more"
        @click="openAnchoredPanel('panel')"
      >{{ showTopPlusValue ? volumeDisplayPct + '%' : '•••' }}</button>
      <div
        :key="'side-volume-track-' + control.sideVolumeBounceSeq"
        class="sv-track glass"
        :class="{
          'is-plus': control.volumePlusLevel,
          ['plus-' + control.volumePlusLevel * 100]: control.volumePlusLevel,
          'bounce-up': compact && control.sideVolumeBounceDirection === 'up' && control.sideVolumeBounceSeq,
          'bounce-down': compact && control.sideVolumeBounceDirection === 'down' && control.sideVolumeBounceSeq
        }"
        :aria-hidden="compact"
        @pointerdown="expanded && setFromPointer($event, value => control.setVolume(value))"
      >
        <div class="sv-fill" :style="{ height: volumePct + '%' }"></div>
        <div v-if="control.volumePlusLevel" class="sv-side-plus-gradient"></div>
        <LIcon class="sv-speaker" :name="control.volume === 0 ? 'volumeX' : 'volume2'" :size="24" :stroke-width="2.2" mono />
      </div>
      <button v-if="expanded" class="sv-custom glass" :aria-label="vLabel('customMediaVolume')" data-testid="side-volume-custom" @click="openAnchoredPanel('media')">
        <LIcon name="slidersHorizontal" :size="20" :stroke-width="2.2" />
      </button>
      <Transition name="custom-guide">
        <div v-if="expanded && showCustomGuide && !showAppMuteGuide" class="sv-custom-guide" data-testid="side-volume-custom-guide">
          <i class="sv-guide-blur" aria-hidden="true"></i>
          <svg class="sv-guide-shape" viewBox="0 0 142 36" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="guide-glass-a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".34"/><stop offset="1" stop-color="#ffffff" stop-opacity=".20"/></linearGradient></defs>
            <path d="M31 1H124Q141 1 141 18Q141 35 124 35H31Q15 35 15 25L6 18L15 11Q15 1 31 1Z" fill="url(#guide-glass-a)" stroke="rgba(255,255,255,.34)" stroke-linejoin="round"/>
          </svg>
          <span>{{ vLabel('byAppGuide') }}</span>
        </div>
      </Transition>
      <Transition name="custom-guide">
        <div v-if="expanded && showAppMuteGuide" class="sv-custom-guide" data-testid="current-app-mute-guide">
          <i class="sv-guide-blur" aria-hidden="true"></i>
          <svg class="sv-guide-shape" viewBox="0 0 142 36" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="guide-glass-b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff" stop-opacity=".34"/><stop offset="1" stop-color="#ffffff" stop-opacity=".20"/></linearGradient></defs>
            <path d="M31 1H124Q141 1 141 18Q141 35 124 35H31Q15 35 15 25L6 18L15 11Q15 1 31 1Z" fill="url(#guide-glass-b)" stroke="rgba(255,255,255,.34)" stroke-linejoin="round"/>
          </svg>
          <span>{{ vLabel('appMuted')(appMuteName) }}</span>
        </div>
      </Transition>
    </div>
  </Transition>

  <Transition name="volume-modal" :duration="{ enter: 380, leave: 340 }">
    <div v-if="modalOpen" class="sv-modal-layer" data-testid="side-volume-modal" @click.self="control.closeSideVolume()">
      <section class="sv-modal glass" :class="{ media: isMedia }">
        <div class="sv-modal-content">
          <h2>{{ modalTitle }}</h2>
          <div class="sv-sliders">
          <template v-if="!isMedia">
            <div v-for="item in systemSliders" :key="item.key" class="sv-column">
              <div class="sv-large-track" @pointerdown="beginSystemPointer($event, item)">
                <div class="sv-large-fill" :style="{ height: (item.main && control.volumePlusLevel ? 100 : item.value * 100) + '%' }"></div>
                <div v-if="item.main && control.volumePlusLevel" class="sv-plus-gradient" :class="'plus-' + control.volumePlusLevel * 100"></div>
                <span v-if="item.main && control.volumePlusLevel" class="sv-plus-value">{{ volumeDisplayPct }}%</span>
                <span class="slider-icon"><LIcon :name="item.value === 0 ? item.mutedIcon : item.icon" :size="24" :stroke-width="2.2" mono /></span>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-for="item in mediaSliders" :key="item.key" class="sv-column">
              <div class="sv-large-track" @pointerdown="setFromPointer($event, value => setMedia(item, value))">
                <div
                  class="sv-large-fill"
                  :style="{ height: (item.system && control.volumePlusLevel ? 100 : item.value * 100) + '%' }"
                ></div>
                <div v-if="item.system && control.volumePlusLevel" class="sv-plus-gradient" :class="'plus-' + control.volumePlusLevel * 100"></div>
                <span v-if="item.system && control.volumePlusLevel" class="sv-plus-value">{{ volumeDisplayPct }}%</span>
                <span v-if="item.system" class="slider-icon"><LIcon :name="item.icon" :size="24" :stroke-width="2.2" mono /></span>
                <NotificationIcon v-else class="media-badge" :type="item.app" :size="24" />
              </div>
            </div>
          </template>
          </div>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
/* 白色毛玻璃（2026-09-20 统一，配方见 styles/tokens.css 的 `--glass-white-*`）。
   ⚠️ 原来是**蓝灰**渐变玻璃 rgba(122,154,181,.68) → rgba(93,128,158,.55)，
   与 CC 竖滑块的白玻璃不是一套 ⇒ 同一个功能两种颜色，观感很脏。
   **只换色相、不动原来的不透明度量级**（原来 ~.6，现在 .74 同一档）：壁纸是很饱和的紫，
   把 α 调低只会让玻璃更紫 —— 上一版就是掉进这个坑（.30 比原值还透，反而更紫）。
   描边与顶部那道 1px inset 高光也一并撤掉（Ricky：去掉大小音量条多余的描边）；
   Plus 态需要的琥珀环由 .sv-track 自己那 1px **透明**边框改色得到（见下）。 */
.glass {
  /* ⚠️ 2026-09-20 按参考图（collapsed.jpg）反解折叠胶囊：**未填充 α ≈ 0.34–0.51、填充 α ≈ 0.95**。
     参考机上玻璃读作「灰」是因为背后照片壁纸暗（紧邻壁纸实测 L=7 ⇒ 玻璃 133）；本机壁纸亮
     （L≈184）⇒ 同一个 α 出来就是 210。**α 是对的，观感差异来自壁纸**，别为了追颜色硬压 α。
     取 .45 落在参考区间内。⛔ 不要用 `--glass-white-bar`(.74)：那是给更深幕布上的 CC / 全屏面板的，
     那两个是本层最底、α 必须更高。 */
  background: rgba(255, 255, 255, .45);
  box-shadow: 0 2px 24px rgba(0, 0, 0, .18);
  /* ⚠️⛔ 2026-09-20 修订（Ricky：「音量面板应该是透明毛玻璃」——判断正确，之前做错了）：
     这里**曾经**写死 `saturate(20%)`，理由是「参考图胶囊/面板实测 chroma 1/6，是中性灰」。
     那个结论错了，错在**只看了一个采样点**：把参考图面板左上象限 1:1 放大后（`/tmp/vwork/r34/zoom-quad.png`）
     能清楚看到背后暖橙 / 青绿的色块轮廓 —— 参考面板本身是**有色的透明霜面**，不是中性灰。
     `saturate(20%)` 把背景颜色杀掉 ~80% ⇒ 面板退化成一块平灰 ⇒ 屏上读作「不透明」。
     实测「背景彩度保留率」（面板内 chroma ÷ 紧邻背景 chroma，越接近 0 越不透明）：
        saturate(20%) = **0.12**（≈不透明，错） · blur 不饱和 = 0.56 · saturate(180%) = 1.00
     改用设计系统 token（= `blur(30px) saturate(75%)`）：保留率 ≈ 0.44 —— 背景可见、又带一层霜感，
     与参考图观感最接近（六档 A/B 全图 `/tmp/vwork/r34/ab2-grid.png`）。
     ⛔ 别再为了「把玻璃读数压成中性」往下调 saturate：判据是「**背景能不能透出来**」，
        不是「chroma 够不够小」。低 chroma 既可能是「不透明」，也可能是「透明但背景本来就是灰的」。 */
  backdrop-filter: var(--glass-white-blur);
  -webkit-backdrop-filter: var(--glass-white-blur);
}
.sv-dismiss-layer { position:absolute; inset:0; z-index:var(--z-side-volume-dismiss); }
/* 参考图：胶囊 44.7 × 159.7，顶 232.0，右距 17.0（本实现镜像到左侧 ⇒ left:17px，与机身左侧实体音量键同侧）。 */
.side-volume-wrap { position:absolute; left:17px; top:232px; z-index:var(--z-side-volume); width:44.7px; height:204.7px; pointer-events:none; }
.side-volume-wrap button { border:0; color:#fff; padding:0; pointer-events:auto; }
/* 「•••」：参考图量得三点 Ø2.67 / 点距 7.0 / 点心距胶囊顶 18.67 ⇒ 高 = 2×18.67 = 37.3。
   字号按「点径 ∝ 字号」反推：13px 时实测点 Ø4.0 偏大 ⇒ 9px（Ø≈2.8），字距 3.3px 把点距调到 7.0。 */
.sv-more { position:absolute; z-index:2; top:0; left:0; width:44.7px; height:37.3px; border:0; border-radius:22.35px; background:transparent; box-shadow:none; color:#fff; font:700 9px/1 var(--font-stack); letter-spacing:3.3px; transition:color .16s ease; }
.sv-more.inverted { color:#3482bb; }
.sv-more.showing-value { color:#fff7ed; font-size:13px; letter-spacing:-.35px; }
/* 1px **透明**边框是留给 Plus 态琥珀环的槽位（.sv-track.is-plus 只改 border-color）。
   平时它完全不可见 ⇒ 满足「音量条不要多余描边」。宽度保持 1px，布局与改动前一致。 */
.sv-track { position:absolute; top:0; left:0; width:44.7px; height:159.7px; border-radius:22.35px; overflow:hidden; pointer-events:auto; touch-action:none; transition:width .3s cubic-bezier(.2,.8,.2,1), border-radius .3s, transform .3s, left .3s; border:1px solid transparent; }
.sv-fill { position:absolute; left:-1px; right:-1px; bottom:-1px; background:rgba(255,255,255,.95); border-radius:0 0 22.35px 22.35px; transition:height 110ms ease-out; }
.sv-track.is-plus { border-color:rgba(255,190,92,.78); }
.sv-side-plus-gradient { position:absolute; inset:0; z-index:1; pointer-events:none; }
.sv-track.plus-200 .sv-side-plus-gradient { background:linear-gradient(to top,rgba(253,186,116,0) 0%,rgba(253,186,116,.42) 52%,rgba(251,146,60,1) 100%); }
.sv-track.plus-300 .sv-side-plus-gradient { background:linear-gradient(to top,rgba(251,146,60,0) 0%,rgba(251,146,60,.5) 52%,rgba(249,115,22,1) 100%); }
.sv-track.plus-500 .sv-side-plus-gradient { background:linear-gradient(to top,rgba(249,115,22,0) 0%,rgba(234,88,12,.58) 52%,rgba(194,65,12,1) 100%); }
/* 喇叭：参考图 ink 19.3 × 14.7、水平居中、ink 底距胶囊底 16.37。
   `volume2` 是手绘图标、viewBox 30×30，ink 占 24.9×21.4 且底边离盒底 4.29/30 ⇒ size 24 时 ink 宽 19.9 ✓
   （对齐 ink 底：bottom = 16.37 − 4.29/30×24 = 12.94）。
   颜色是**淡蓝**（参考图实测 (194,218,242) = #C2DAF2），不是原来的 #3984bd 深蓝。
   ⚠️ 必须配 `mono`：该图标把 fill="#258FFF" 写死在路径上，只靠继承 color 不会变色。 */
.sv-speaker { position:absolute; z-index:2; left:50%; bottom:12.9px; transform:translateX(-50%); color:#c0d8f2; }
.sv-custom { position:absolute; left:0; top:170.7px; width:44.7px; height:34px; display:grid; place-items:center; border-radius:22.35px; }
.sv-custom-guide { position:absolute; z-index:3; left:46px; top:170px; width:142px; height:36px; color:#fff; filter:drop-shadow(0 2px 12px rgba(0,0,0,.2)); font:600 14px/36px var(--font-stack); letter-spacing:.1px; white-space:nowrap; pointer-events:none; }
.sv-guide-blur { position:absolute; inset:0; z-index:0; display:block; background:rgba(255,255,255,.10); backdrop-filter:var(--glass-white-blur); -webkit-backdrop-filter:var(--glass-white-blur); clip-path:path("M31 1H124Q141 1 141 18Q141 35 124 35H31Q15 35 15 25L6 18L15 11Q15 1 31 1Z"); }
.sv-guide-shape { position:absolute; z-index:1; inset:0; width:100%; height:100%; overflow:visible; }
.sv-custom-guide > span { position:absolute; z-index:2; inset:0 7px 0 17px; text-align:center; }
.custom-guide-enter-active,.custom-guide-leave-active { transition:opacity .18s ease,transform .22s cubic-bezier(.2,.8,.2,1); }
.custom-guide-enter-from,.custom-guide-leave-to { opacity:0; transform:translate3d(-8px,0,0); }

.side-volume-wrap.compact { left:17px; height:159.7px; width:10px; pointer-events:none; }
.side-volume-wrap.compact .sv-track { top:0; left:0; width:10px; height:159.7px; border-radius:8px; }
.side-volume-wrap.compact .sv-track { pointer-events:none; }
.side-volume-wrap.compact .sv-speaker { display:none; }
.side-volume-wrap.compact .sv-fill { border-radius:0 0 8px 0; }
.side-volume-wrap.compact .sv-track.bounce-up { animation:compact-bounce-up 360ms cubic-bezier(.2,.9,.25,1); }
.side-volume-wrap.compact .sv-track.bounce-down { animation:compact-bounce-down 360ms cubic-bezier(.2,.9,.25,1); }
@keyframes compact-bounce-up {
  0%,100% { transform-origin:center bottom; transform:scaleY(1); }
  42% { transform-origin:center bottom; transform:scaleY(1.1); }
  72% { transform-origin:center bottom; transform:scaleY(.985); }
}
@keyframes compact-bounce-down {
  0%,100% { transform-origin:center top; transform:scaleY(1); }
  42% { transform-origin:center top; transform:scaleY(1.1); }
  72% { transform-origin:center top; transform:scaleY(.985); }
}
/* 幕布原来是 rgba(10,35,58,.04)（偏海军蓝）—— 会跟白玻璃叠出蓝灰。改成中性黑。 */
.sv-modal-layer { position:absolute; inset:0; z-index:var(--z-side-volume-modal); background:rgba(0,0,0,.06); }
/* 卡片底 α 由参考图反解：参考阶梯是 **面板 144 → 轨 191 → fill 255**（台阶 +47 / +64）。
   一版用 .62/.34 时本实现只有 225/234/253（台阶 +9 / +19）—— 整块玻璃太平，四条轨几乎看不出轮廓。
   台阶大小 ≈ α轨 ×(255 − 面板亮度) ⇒ **关键是先把面板压下来**：卡片 α 取 .42、轨 抬到 .44。
   ⚠️ 不要照抄参考机的绝对亮度：参考面板「灰」是它背后照片壁纸被强模糊后的平均值（偏暗）；
   本机桌面该区域模糊后偏亮 ⇒ 面板天然比参考亮一档。**只对齐 α 与相对台阶，不追绝对灰度。**
   卡片自己留一圈很淡的白边 —— 它是卡片不是「音量条」，需要一点边缘定义。 */
/* 参考图量值：面板 266.5 × 217.3，顶 232.0，圆角 26。
   ⚠️ 横向要**跟着胶囊一起镜像**：参考图里胶囊(298.33..343)与面板(76.5..343)共享**右边缘**，
   右距都是 17；本实现把胶囊镜像到左侧(left:17) ⇒ 面板也必须左对齐到 17，
   否则展开动画的 clip-path（把面板裁成胶囊大小）会锚在 76.5 而不是胶囊所在的 17，错位 60px。
   内边距 18.75 是使「4 轨 × 44 宽 + 3 × 17.67 隙 = 229」正好居中。 */
.sv-modal { position:absolute; left:17px; top:232px; width:266.5px; height:217.3px; border-radius:26px; padding:14.5px 18.75px 17.6px; color:#fff; background:rgba(255,255,255,.42); border:1px solid rgba(255,255,255,.22); box-sizing:border-box; }
/* 「按应用」是 **5 轨**（系统 + 4 个 App），44 宽 × 5 塞不进 266.5，所以面板更宽；
   仍是**左对齐 17**（与胶囊同边），右侧留 14.8。 */
.sv-modal.media { width:328.2px; }
/* 标题：参考图 ink 24.3 × 11.3、水平居中、ink 顶距面板顶 16.67 ⇒ CJK 字号 ≈ 13.3px。 */
.sv-modal h2 { margin:0 0 9.3px; text-align:center; font:500 13.3px/1.15 var(--font-stack); }
.sv-sliders { display:flex; justify-content:space-between; align-items:flex-start; }
.sv-column { width:44px; }
/* 参考图：轨 44 × 160.4（顶 271.3 / 底 431.67），全胶囊圆角 22。 */
/* 轨 α：参考图反解 ≈ .42（轨 191 − 面板 144 = 47 = α ×(255−144)）。
   ⛔ 不走 `--glass-white-bar-in-card`(.34)：那样台阶只有 +19，四条轨在面板上几乎看不见。 */
.sv-large-track { position:relative; width:44px; height:160.4px; overflow:hidden; border-radius:22px; background:rgba(255,255,255,.44); touch-action:none; }
.sv-large-fill { position:absolute; left:0; right:0; bottom:0; background:rgba(255,255,255,.94); transition:height 100ms ease-out; }
.slider-icon,.media-badge { position:absolute; z-index:2; left:50%; bottom:11.5px; transform:translateX(-50%); }
/* 图标：参考图 ink 19.3 × 14.7 ⇒ Lucide 24 viewBox 的 size=24；颜色是中灰 #828282（实测核心 (128,128,128)–(131,130,131)），
   原来那套 #3482bb 蓝是错的。bottom:10 让 ink 底落在轨底上方 ≈15.1（参考 15.1）。 */
.slider-icon { color:#828282; width:24px; height:24px; display:grid; place-items:center; }
.side-volume-enter-active,.side-volume-leave-active { transition:opacity .2s, transform .32s cubic-bezier(.2,.8,.2,1); }
.side-volume-enter-from,.side-volume-leave-to { opacity:0; transform:translateX(-70px); }
.side-volume-wrap.anchor-handoff.side-volume-leave-active { transition:none !important; }
.side-volume-wrap.anchor-handoff.side-volume-leave-to { opacity:0; transform:none; }
.sv-modal-content { height:100%; }
.sv-plus-gradient { position:absolute; inset:0; z-index:1; pointer-events:none; }
.sv-plus-gradient.plus-200 { background:linear-gradient(to top,rgba(253,186,116,0) 0%,rgba(253,186,116,.42) 52%,rgba(251,146,60,1) 100%); }
.sv-plus-gradient.plus-300 { background:linear-gradient(to top,rgba(251,146,60,0) 0%,rgba(251,146,60,.5) 52%,rgba(249,115,22,1) 100%); }
.sv-plus-gradient.plus-500 { background:linear-gradient(to top,rgba(249,115,22,0) 0%,rgba(234,88,12,.58) 52%,rgba(194,65,12,1) 100%); }
.sv-plus-value { position:absolute; z-index:3; top:18px; left:0; right:0; text-align:center; color:#fff7ed; font:800 11px/1 var(--font-stack); pointer-events:none; }
.volume-modal-enter-active,.volume-modal-leave-active { transition:background-color .32s ease; }
.volume-modal-enter-active .sv-modal { transition:clip-path .36s cubic-bezier(.2,.82,.18,1),transform .36s cubic-bezier(.2,.82,.18,1),border-radius .36s cubic-bezier(.2,.82,.18,1); will-change:clip-path,transform; }
.volume-modal-enter-active .sv-modal-content { transition:opacity .2s ease-out .12s; }
.volume-modal-enter-from { background-color:rgba(10,35,58,0); }
/* clip-path 从「胶囊」长成「面板」：右侧留 44.7、下侧留 57.6、圆角 22.35 —— 与胶囊实尺寸一一对应。 */
.volume-modal-enter-from .sv-modal { clip-path:inset(0 221.8px 57.6px 0 round 22.35px); transform:translate3d(-1px,0,0); border-radius:22.35px; }
.volume-modal-enter-from .sv-modal.media { clip-path:inset(0 283.5px 57.6px 0 round 22.35px); }
.volume-modal-enter-from .sv-modal-content { opacity:0; }
.volume-modal-leave-active .sv-modal { transition:transform .32s cubic-bezier(.2,.8,.2,1),opacity .22s; }
.volume-modal-leave-to { background-color:rgba(10,35,58,0); }
.volume-modal-leave-to .sv-modal { transform:translate3d(-330px,0,0); opacity:0; }
</style>
