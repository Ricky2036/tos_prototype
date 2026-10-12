<script setup>
/**
 * AI Mate · 设备管理中枢（按归档 `tOS Prototype_aimate_fan.html` 逐屏重放）
 * ========================================================================
 * 归档是**别人用旧版 Skill 做的原型**，这里做的是语义重放而不是整文件搬运：
 * 页面集合、交互序列、几何与配色照抄归档；文案、图标、状态一律走本仓的
 * i18n / LIcon / Pinia 约定，方便后续继续在这个 Skill 上开发。
 *
 * 七个页面（与归档 `.page.*` 一一对应）：
 *   home 首页 / add 添加设备 / guide 选型号+配对步骤 / search 搜索设备 /
 *   center 连接中→成功 / control 设备控制 / info 设备详情
 * 三个浮层：定时（xsheet）/ 重命名（modal）/ 删除确认（modal）
 *
 * ⚠️ 首页顶栏（`AI Mate` 眉标 / `下午好，Ling` / 副标题 / `LK` 头像）已按要求整体删掉，
 *   只留 `.home-statusbar` 那一条**状态栏留白（透明，不填色）**；「我的」改由底部 Tab 进入。
 * 🔴 应用默认背景色 = **#F4F5F7**，与设置页 `SettingsApp.vue` 的 `.settings-app` 同值
 *   （Ricky 2026-10-12「应用默认背景色改为与设置页面一致」）。
 * ⚠️ 头部几何：`ScreenView.vue` 顶部 64px 是 `--z-edge-zone` 手势热区。
 * 控制页用 `.nav-bar.transparent`（绝对定位在顶部），所以 `.control-scroll` 必须
 * 自己留出 `calc(var(--safe-top) + 56px)` 顶部内边距，否则产品图被热区盖住、
 * 返回按钮点不动。归档原样式即如此，照抄。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18nStore } from '../../../stores/i18nStore'
import {
  useAiMateStore, DEVICE_TYPES, DEVICE_MODELS, PAIR_STEPS,
  FAN_TIMER_STEPS, FAN_SPEED_MAX, FAN_SWING_ANGLES, OTHER_DEVICES, PAPER_MAX
} from '../../../stores/aiMateStore'
import { useBackHandler } from '../../../composables/backRegistry'
import { useRecorderFlowStore, DEVICE_PROFILE as RECORDER_PROFILE } from '../../../stores/recorderFlowStore'
import LIcon from '../../ui/LIcon.vue'
import FloatingTabBar from '../../ui/FloatingTabBar.vue'
import PrinterFlow from './PrinterFlow.vue'
import RecorderFlow from './RecorderFlow.vue'

/** 首页录音充电宝卡的红灯订阅流程层的录音态（归档 `#homeRecordLight` 同源） */
const rec = useRecorderFlowStore()
import MoriFlow from './MoriFlow.vue'

const i18n = useI18nStore()
const mate = useAiMateStore()
const am = (p) => i18n.am(p)
/** `{name}` 这类占位符统一在调用点替换（本仓 i18n 没有插值机制） */
const fill = (s, o) => String(s ?? '').replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''))

const typeOf = (id) => DEVICE_TYPES.find((t) => t.id === id) || null
/** 「其他设备」卡的 CSS 手绘图形（归档 `.watch-shape` / `.buds-shape` / `.glasses-shape`） */
const shapeOf = (t) => (t === 'watch' ? 'watch-shape' : t === 'tws' ? 'buds-shape' : 'glasses-shape')
const dev = computed(() => mate.getDevice(mate.activeDeviceId))
const addType = computed(() => typeOf(mate.addType))
const models = computed(() => DEVICE_MODELS[mate.addType] || [])
const modelSub = (subKey) => am('modelSub.' + subKey)
const typeLabel = (t) => (t ? am('type.' + t.id) : '')
/** 设备显示名：昵称优先（归档「重命名」改的就是这一个） */
const nameOf = (d) => (d ? d.nick || d.name : '')

/* ---------------- 首页设备卡（四份归档取并集后的展示规则） ---------------- */
/**
 * 卡片标题：昵称 > Demo 首屏显示名（`deviceTitle.*`，如「我的口袋打印机」）> 归档设备名。
 * 风扇没有 Demo 化名，直接显示 `DAEWOO-Fan-A1`（归档首页即如此）。
 */
const titleOf = (d) => d.nick || (d.titleKey ? am(d.titleKey) : d.name)
/** 卡片副行：统一的电量 + 该设备特有的一项余量（相纸 / 已用空间 / 素材数） */
function metaOf(d) {
  const out = []
  if (d.type === 'printer') out.push(fill(am('deviceMeta.paper'), { n: d.paper, max: PAPER_MAX }))
  if (d.type === 'recorder' && d.storageUsed != null) out.push(fill(am('deviceMeta.used'), { n: d.storageUsed }))
  if (d.type === 'mori' && d.shots != null) out.push(fill(am('deviceMeta.shots'), { n: d.shots }))
  if (d.battery != null) out.push(fill(am('deviceMeta.battery'), { n: d.battery }))
  return out.join(' · ')
}
/**
 * 卡片上的唯一主操作。点它与点卡片走同一条路（都是直达功能页），
 * 存在的意义是**把「点进去会发生什么」写出来**，不是第二个入口。
 * 风扇没有这一行 —— 它卡内是归档原样的开关 + 档位。
 */
const CARD_ACTIONS = {
  printer: { icon: 'printer', label: 'action.quickPrint' },
  recorder: { icon: 'mic', label: 'action.record', sub: 'action.recordSub' },
  mori: { icon: 'aperture', label: 'action.shoot', sub: 'action.shootSub' }
}
const cardAction = (d) => CARD_ACTIONS[d.type] || { icon: 'chevronRight', label: 'action.enter' }
/**
 * 打印机 hero 卡的副行。归档首页写的是「电量 78% · 相纸 5 / 5 张」，
 * 而本仓通用 `metaOf` 是「特有项 · 电量」—— 这里只给这一张按归档顺序排，
 * 不动其余三台的通用顺序（e2e 对「相纸」「电量」都只做包含判断，顺序无关）。
 */
const heroMeta = (d) => [
  d.battery != null ? fill(am('deviceMeta.battery'), { n: d.battery }) : '',
  fill(am('deviceMeta.paper'), { n: d.paper, max: PAPER_MAX })
].filter(Boolean).join(' · ')
/**
 * 录音充电宝 hero 卡的两枚 meta 药丸。归档原文是 `▰ 86%` / `◴ 已用 18.6GB`
 * —— 两个图形前缀是排版记号（不是文案），所以不进 i18n；数值取设备实测。
 */
/**
 * 卡上的型号：录音充电宝归档首屏写的是 `AI Mate PowerRec S1`（设备详情页同值），
 * 而设备目录里的 `model` 是给「添加设备 / 设备详情」用的短代号 `AM-RC1`。
 * 这一张卡按归档取值，其余设备仍读 `d.model`。
 */
const modelOf = (d) => (d.type === 'recorder' ? RECORDER_PROFILE.model : d.model)
const recorderMeta = (d) => [
  d.battery != null ? fill(am('deviceMetaRec.battery'), { n: d.battery }) : '',
  d.storageUsed != null ? fill(am('deviceMetaRec.storage'), { n: d.storageUsed }) : ''
].filter(Boolean)
/**
 * 首页卡三枚磁贴（录音 / 面对面翻译 / 听译）：
 * 归档里首页与浮层同文档，磁贴 `stopPropagation` 后直接 `openOverlay()`；
 * 本仓首页卡在 `AimateApp`、浮层在流程层里，所以先记意图，再由 `store.open()` 消费。
 */
function openRecorderWith(intent, id) {
  rec.requestOverlay(intent)
  mate.openDevice(id)
}

/* ---------------- 底部 Tab（首页 / 我的） ---------------- */
/**
 * 归档两份 Demo 的 `bottomnav` 语义层都是「首页 + 我的」：
 *   录音 Demo `首页 / 录音 / 我的`（中间那栏只对录音充电宝有意义，不上浮到应用级）
 *   打印机 Demo `首页 / 我的`
 * ⇒ 应用级取两者交集，2 个 Tab。图标走上标 slot，用本仓 LIcon。
 */
const tabs = computed(() => [
  { id: 'home', iconName: 'home', name: am('tab.home') },
  { id: 'mine', iconName: 'user', name: am('tab.mine') }
])
/** 「我的」页设置列表 = 打印机 Demo `my` + 录音 Demo `profile` 两页取并集去重 */
const mineRows = [
  { id: 'account', icon: 'user', label: 'mine.account' },
  { id: 'notify', icon: 'bell', label: 'mine.notify', value: 'mine.notifyValue' },
  { id: 'general', icon: 'settings2', label: 'mine.general' },
  { id: 'privacy', icon: 'shield', label: 'mine.privacy' },
  { id: 'help', icon: 'helpCircle', label: 'mine.help' },
  { id: 'about', icon: 'info', label: 'mine.about', value: 'mine.version' }
]
function mineTap() { mate.notice = { code: 'mineWip' } }

/* ---------------- 交互：五屏添加流程（延迟与归档实测一致） ---------------- */
const timers = []
const later = (fn, ms) => { timers.push(setTimeout(fn, ms)) }
onBeforeUnmount(() => timers.forEach(clearTimeout))

function startSearch() {
  if (!mate.startSearch()) return
  later(() => mate.foundDevices(), 1500)
}
function beginLink() {
  if (!mate.beginLink()) return
  later(() => mate.linkSuccess(), 2400)
}

/* ---------------- 风扇档位：12 段点阵，点第 n 个即设为 n 档 ---------------- */
const fanSpeed = computed(() => (dev.value ? dev.value.speed : 0))

/* ---------------- 定时：秒 ←→ 小时 ---------------- */
const timerHours = (sec) => (sec ? sec / 3600 : 0)
const timerKey = computed(() => (mate.timerSheet === 'timerOff' ? 'off' : 'on'))
function stepTimer(delta) {
  if (!dev.value || !mate.timerSheet) return
  const cur = dev.value[mate.timerSheet] || 0
  const i = FAN_TIMER_STEPS.indexOf(cur)
  const at = Math.max(0, Math.min(FAN_TIMER_STEPS.length - 1, (i < 0 ? 0 : i) + delta))
  mate.setFanTimer(dev.value.id, timerKey.value, FAN_TIMER_STEPS[at])
}
function saveTimer() { mate.closeTimerSheet() }
function clearTimer() {
  if (dev.value && mate.timerSheet) mate.setFanTimer(dev.value.id, timerKey.value, 0)
  mate.closeTimerSheet()
}

/* ---------------- 重命名 ---------------- */
const nickDraft = ref('')
watch(() => mate.renaming, (on) => { if (on && dev.value) nickDraft.value = nameOf(dev.value) })
function saveNick() {
  if (dev.value) mate.setNick(dev.value.id, nickDraft.value.trim())
  mate.closeRename()
}

/* ---------------- 提示条 ---------------- */
const noticeText = computed(() => {
  const n = mate.notice
  if (!n) return ''
  const raw = am('notice.' + n.code)
  if (!raw || raw === 'notice.' + n.code) return ''
  // 「其他设备」行把设备名/副文案以**键**的形式传进来（store 不持有文案），先解析再插值
  const params = { ...(n.params || {}) }
  if (params.nameKey) params.name = am(params.nameKey)
  if (params.metaKey) params.meta = am(params.metaKey)
  return fill(raw, params)
})
/**
 * 归档 `toast()` 是「先 `clearTimeout(window._t)` 再挂新定时器」⇒ 连弹两条时，
 * 后一条不会被前一条的定时器提前收走。
 * ⚠️ 原来走 `later()` 只 push 不清 ⇒ 快速连点两个动作（AI Mori 卡的录像/录音恰是
 *    连点场景）时，第二条提示条会被第一条剩下的时间**提前擦掉**。
 */
let noticeTimer = null
watch(() => mate.notice, (n) => {
  if (!n) return
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => mate.clearNotice(), 2400)
})
onBeforeUnmount(() => { if (noticeTimer) clearTimeout(noticeTimer) })

useBackHandler(() => mate.back())

const isFan = computed(() => dev.value?.type === 'fan')
const switchDisabled = (d) => !d.online || (d.type === 'fan' && d.childLock)
const canUseFan = computed(() => !!dev.value && dev.value.online && !dev.value.childLock)
</script>

<template>
  <div class="aimate">
    <!-- ========= 首页 / 我的（底部 Tab 层） ========= -->
    <div v-if="mate.page === 'home'" class="page home-page">
      <!-- ---------------- Tab 1 · 首页 ---------------- -->
      <div v-show="mate.tab === 'home'" class="tabview">
        <!-- 首页顶栏（AI Mate 眉标 / 下午好，Ling / 副标题 / LK 头像）已按要求整体去掉。
             这里只留状态栏高度的白底，有两个作用：
             ① 首屏内容不钻到状态栏里；
             ② 卡片滚动时不从状态栏文字后面穿过去（原来就是靠顶栏的白底挡住的）。
             ⚠️ 这 64px 同时是 `ScreenView` 的边缘手势热区（`.edge-zone` z 85）⇒
                里面不能放任何可点元素，`.section-head` 的「＋ 添加设备」必须落在它下面。
             进「我的」不再有头像入口，走底部 Tab。 -->
        <div class="home-statusbar" />

        <div class="home-scroll">
          <div class="section-head">
            <div class="sh-copy">
              <h2 class="sh-title">{{ am('home.myDevices') }}</h2>
              <p class="sh-sub" data-device-summary>
                {{ fill(am('home.summary'), { n: mate.deviceCount, m: mate.connectedDevices.length }) }}
              </p>
            </div>
            <button class="sh-action" data-add-entry @click="mate.openAdd()">
              {{ am('home.addDeviceAction') }}
            </button>
          </div>

          <!-- 每个设备一张卡；点卡片直达该设备的功能页 -->
          <button
            v-for="d in mate.devices"
            :key="d.id"
            class="mcard"
            :class="{
              offline: !d.online,
              'mcard-hero': d.type === 'printer',
              'mcard-rec': d.type === 'recorder',
              'mcard-mori': d.type === 'mori',
              'mcard-fan': d.type === 'fan'
            }"
            :data-device-card="d.id"
            @click="mate.openDevice(d.id)"
          >
            <!-- 四张卡共用同一行顶部状态（状态胶囊 + `···` 进设备详情）。
                 风扇卡原来照归档把这一行整个去掉了，结果与其余三张卡版式不一致 ——
                 2026-10-12 按「卡片一致性」改回与 AI Mori 同构。 -->
            <div class="mc-top">
              <span class="mc-status" :class="d.online ? 'on' : 'off'">
                <i class="mc-dot" />{{ d.online ? am('status.online') : am('status.offline') }}
              </span>
              <span class="mc-more" :data-device-more="d.id" @click.stop="mate.openInfoOf(d.id)">
                <LIcon name="moreHorizontal" :size="18" />
              </span>
            </div>

            <!-- ===== 口袋打印机：照归档首页卡（深色大卡 + CSS 实物图形 + 右下白底药丸）=====
                 归档 `ai-mate-printer-demo.html` 的 `home-screen` 里这张卡是一套**独立的视觉语言**
                 （深色 #172332 / 圆角 28px / min-height 264px / 中央实物图形 / 右下白色药丸），
                 与其余设备的浅色小卡不同 —— 只此一张走 hero 形态，其余三台保持原结构。 -->
            <template v-if="d.type === 'printer'">
              <span class="hp-stage">
                <span class="hp-printer"><i class="hp-dot" /></span>
              </span>
              <div class="mc-bottom">
                <span class="hp-copy">
                  <b class="hp-name">{{ titleOf(d) }}</b>
                  <small class="hp-meta" :data-device-meta="d.id">{{ heroMeta(d) }}</small>
                </span>
                <span
                  class="hp-quick"
                  role="button"
                  :data-device-enter="d.id"
                  @click.stop="mate.quickPrint(d.id)"
                >{{ am(cardAction(d).label) }}</span>
              </div>
            </template>

            <!-- ===== 录音充电宝：照归档首页卡（紫色渐变大卡 + CSS 实物图形 + 底部三磁贴）=====
                 归档 `.device-card`：底 = radial(90% 10% 淡紫) + linear(145deg #28205f→#4936a5 54%→#624aca)，
                 圆角 25px / padding 20px / min-height 276px / `::before` 一圈 190px 描边圆环；
                 实物图 133×75 绝对定位在右上（13 / 55 / rotate(-7deg)）；
                 底部一条毛玻璃托盘里并排三枚磁贴（录音 / 面对面翻译 / 听译）。
                 与打印机那张 hero 卡并列 —— 归档两份 Demo 的首屏大卡就是这两种形态。 -->
            <template v-else-if="d.type === 'recorder'">
              <div class="rp-head">
                <b class="rp-name">{{ titleOf(d) }}</b>
                <small class="rp-model">{{ modelOf(d) }}</small>
                <span class="rp-meta" :data-device-meta="d.id">
                  <span v-for="(m, mi) in recorderMeta(d)" :key="mi">{{ m }}</span>
                </span>
              </div>

              <span class="rp-art">
                <i class="rp-art-side" />
                <span class="rp-art-face">
                  <span class="rp-grille"><i v-for="n in 24" :key="n" /></span>
                  <i class="rp-redlight" :class="{ on: rec.recording }" data-home-record-light />
                  <small>AI Mate</small>
                </span>
              </span>

              <span class="rp-actions">
                <span
                  class="rp-action"
                  role="button"
                  tabindex="0"
                  data-device-action="record"
                  @click.stop="openRecorderWith('record', d.id)"
                >
                  <span class="rp-glyph"><LIcon name="mic" :size="14" /></span>
                  <b>{{ am('action.record') }}</b>
                  <small>{{ am('action.recordSub') }}</small>
                </span>
                <span
                  class="rp-action"
                  role="button"
                  tabindex="0"
                  data-device-action="face"
                  @click.stop="openRecorderWith('face', d.id)"
                >
                  <span class="rp-glyph"><LIcon name="users" :size="14" /></span>
                  <b>{{ am('action.face') }}</b>
                  <small>{{ am('action.faceSub') }}</small>
                </span>
                <span
                  class="rp-action"
                  role="button"
                  tabindex="0"
                  data-device-action="listen"
                  @click.stop="openRecorderWith('listen', d.id)"
                >
                  <span class="rp-glyph"><LIcon name="languages" :size="14" /></span>
                  <b>{{ am('action.listen') }}</b>
                  <small>{{ am('action.listenSub') }}</small>
                </span>
              </span>
            </template>

            <!-- ===== AI Mori：照归档首页卡（白卡 + 52px 紫渐变图标 + 右侧电量 + 底部三枚动作）=====
                 归档 `ai_mori_interactive_prototype(3).html` 的 `#home` 里这张 `.dev-card`：
                 一行设备信息（`.dev-main`）+ 一条分隔线下的三枚等宽动作（拍照 / 录像 / 录音）。
                 录像与录音是**可切换的录制态且互斥**（开一个自动关掉另一个），
                 录制态按钮转红并跟一颗脉冲圆点 —— 归档 `toggleRec()`；
                 拍照只发指令再弹提示条 —— 归档 `doAction('photo')`。
                 点卡片主体仍是「进 Mori 流程」（= 归档点 `.dev-main` 进 detail），行为不变。 -->
            <template v-else-if="d.type === 'mori'">
              <div class="mm-main">
                <span class="mm-art"><LIcon name="aperture" :size="26" /></span>
                <span class="mm-info">
                  <b class="mm-name">{{ titleOf(d) }}</b>
                  <small class="mm-model">{{ d.model }}</small>
                </span>
                <b class="mm-batt" :data-device-meta="d.id">{{ fill(am('deviceMeta.battery'), { n: d.battery }) }}</b>
              </div>

              <span class="mm-actions">
                <span
                  class="mm-act"
                  role="button"
                  tabindex="0"
                  data-device-action="photo"
                  @click.stop="mate.moriPhoto()"
                >
                  <LIcon name="camera" :size="15" />
                  <b>{{ am('moriCard.photo') }}</b>
                </span>
                <span
                  class="mm-act"
                  :class="{ 'active-rec': mate.moriRec.video }"
                  role="button"
                  tabindex="0"
                  data-device-action="video"
                  @click.stop="mate.moriToggleRec('video')"
                >
                  <LIcon name="video" :size="15" />
                  <i v-if="mate.moriRec.video" class="mm-rec-dot" data-device-rec-dot="video" />
                  <b>{{ mate.moriRec.video ? am('moriCard.videoOn') : am('moriCard.video') }}</b>
                </span>
                <span
                  class="mm-act"
                  :class="{ 'active-rec': mate.moriRec.audio }"
                  role="button"
                  tabindex="0"
                  data-device-action="audio"
                  @click.stop="mate.moriToggleRec('audio')"
                >
                  <LIcon name="mic" :size="15" />
                  <i v-if="mate.moriRec.audio" class="mm-rec-dot" data-device-rec-dot="audio" />
                  <b>{{ mate.moriRec.audio ? am('moriCard.audioOn') : am('moriCard.audio') }}</b>
                </span>
              </span>
            </template>

            <!-- ===== 风扇：版式对齐 AI Mori 卡（Ricky 2026-10-12）=====
                 骨架与 Mori 卡逐段同构：
                 ① `.mc-top`（四张卡共用）：状态胶囊 + `···` 进设备详情
                 ② `.dc-main`：52×52 图标盒 + 名称/型号 + 右侧竖排开关块（开关 + 「开关」字样）
                 ③ `.dc-gear-row`：整宽区块（上边 1px 分隔线）——「档位调节」+「当前档位：n / 12」
                    + **12 段可点轨道**（点第 n 段 = 设到 n 档）
                 ⚠️ 归档原卡**没有顶部状态行**、图标盒是 **72×52** —— 这两点按「卡片一致性」刻意偏离归档；
                    开关 1200ms（pending 时滑块来回蹭）与档位 900ms（值显「下发中…」）两个回执窗口仍照归档。 -->
            <template v-else-if="d.type === 'fan'">
              <div class="dc-main">
                <span class="dc-art"><LIcon name="fanDisc" :size="40" /></span>
                <span class="dc-info">
                  <b class="dc-name">{{ titleOf(d) }}</b>
                  <small class="dc-model" :data-device-meta="d.id">{{ d.model }}</small>
                </span>
                <span class="dc-power" @click.stop>
                  <button
                    class="dc-switch"
                    :class="{ on: d.power, pending: mate.pending[d.id], disabled: switchDisabled(d) }"
                    :data-device-switch="d.id"
                    :disabled="switchDisabled(d) || !!mate.pending[d.id]"
                    @click="mate.toggleFanPower(d.id)"
                  >
                    <span class="dc-switch-knob" />
                  </button>
                  <span class="dc-switch-label">{{ am('fanCard.power') }}</span>
                </span>
              </div>

              <div class="dc-gear-row" :class="{ disabled: !d.online }" @click.stop>
                <div class="dc-gear-info">
                  <span class="dc-gear-label">{{ am('fanCard.speedTitle') }}</span>
                  <span
                    class="dc-gear-value"
                    :class="{ pending: mate.speedPending[d.id] }"
                    :data-gear-value="d.id"
                  >{{ mate.speedPending[d.id]
                    ? am('fanCard.speedPending')
                    : fill(am('control.speedValue'), { n: d.speed, max: FAN_SPEED_MAX }) }}</span>
                </div>
                <div class="dc-gear-track" data-gear-track>
                  <span
                    v-for="n in FAN_SPEED_MAX"
                    :key="n"
                    class="dc-gear-seg"
                    :class="{ active: d.speed >= n, pending: mate.speedPending[d.id] }"
                    :data-gear-seg="n"
                    @click="mate.requestFanSpeed(d.id, n)"
                  />
                </div>
              </div>
            </template>

            <template v-else>
              <div class="mc-body">
                <div class="mc-art" :style="{ background: typeOf(d.type)?.bg, color: typeOf(d.type)?.color }">
                  <LIcon :name="typeOf(d.type)?.icon || 'circle'" :size="30" />
                </div>
                <div class="mc-info">
                  <div class="mc-name">{{ titleOf(d) }}</div>
                  <div class="mc-model">{{ d.model }}</div>
                  <div class="mc-meta" :data-device-meta="d.id">{{ metaOf(d) }}</div>
                </div>
              </div>

              <!-- 其余设备（添加设备目录里还能配到的品类）：一行「点进去会发生什么」 -->
              <div class="mc-enter" :data-device-enter="d.id">
                <LIcon :name="cardAction(d).icon" :size="16" />
                <span class="mce-label">{{ am(cardAction(d).label) }}</span>
                <small v-if="cardAction(d).sub" class="mce-sub">{{ am(cardAction(d).sub) }}</small>
                <LIcon name="chevronRight" :size="16" />
              </div>
            </template>
          </button>

          <!-- 其他设备：照归档 `ai-mate-recording-powerbank-demo.html` 的
               `.device-wall` / `.other-device-card` 重放。
               图形是 CSS 手绘形状（不是图标），右上角带 115px 圆装饰。 -->
          <div class="device-wall">
            <div class="section-head">
              <div class="sh-copy">
                <h2 class="sh-title">{{ am('home.otherDevices') }}</h2>
                <p class="sh-sub">{{ am('home.otherSub') }}</p>
              </div>
            </div>

            <div class="device-stack">
              <button
                v-for="o in OTHER_DEVICES"
                :key="o.id"
                class="other-device-card"
                :class="{ offline: !o.online }"
                :data-other="o.id"
                @click="mate.notifyOther(o.id)"
              >
                <span class="large-visual">
                  <span :class="shapeOf(o.type)"></span>
                </span>
                <span class="large-device-copy">
                  <span v-if="o.online" class="online"><i></i>{{ am('status.online') }}</span>
                  <em v-else class="status-pill pending">{{ am('other.notConnected') }}</em>
                  <h3>{{ am(o.nameKey) }}</h3>
                  <p>{{ am(o.modelKey) }}</p>
                  <small>{{ am(o.metaKey) }}</small>
                </span>
                <LIcon class="row-chevron" name="chevronRight" :size="16" />
              </button>

              <button class="other-device-card add-device-card" data-add-new @click="mate.openAdd()">
                <span class="add-orb">＋</span>
                <span class="large-device-copy">
                  <h3>{{ am('home.addNew') }}</h3>
                  <p>{{ am('home.addNewSub') }}</p>
                </span>
              </button>
            </div>
          </div>

          <div class="home-pad" />
        </div>
      </div>

      <!-- ---------------- Tab 2 · 我的 ---------------- -->
      <div v-show="mate.tab === 'mine'" class="tabview">
        <div class="mine-head">
          <div class="mine-title">{{ am('mine.title') }}</div>
        </div>
        <div class="mine-scroll">
          <div class="mine-hero">
            <div class="mh-avatar">LK</div>
            <div class="mh-copy">
              <div class="mh-name" data-mine-name>Ling Kong</div>
              <div class="mh-role">
                {{ am('mine.role') }} · {{ fill(am('mine.connected'), { n: mate.connectedDevices.length }) }}
              </div>
              <div class="mh-plan">{{ am('mine.plan') }}</div>
            </div>
          </div>
          <div class="mine-card">
            <button v-for="r in mineRows" :key="r.id" class="mrow" :data-mine-row="r.id" @click="mineTap()">
              <span class="mr-icon"><LIcon :name="r.icon" :size="18" /></span>
              <span class="mr-label">{{ am(r.label) }}</span>
              <span v-if="r.value" class="mr-value">{{ am(r.value) }}</span>
              <LIcon name="chevronRight" :size="16" />
            </button>
          </div>
          <div class="home-pad" />
        </div>
      </div>

      <!-- 底部 Tab：首页 / 我的
           尺寸取本仓标准控件的默认规格（高 62px / bottom 22px，与时钟页 ClockApp 同值）。
           ⚠️ 别再加 `+ var(--home-indicator-zone, 34px)` —— 那会把底栏顶到距屏底 56px、
           浮在内容卡片中间；home-indicator 的胶囊实测落在底栏下沿之下，与时钟页同样不冲突。 -->
      <FloatingTabBar
        :model-value="mate.tab"
        :tabs="tabs"
        height="62px"
        bottom="22px"
        accent-color="#7B5CFF"
        :dark="false"
        :aria-label="am('tab.aria')"
        @update:model-value="mate.setTab"
      >
        <template #icon="{ tab, active }">
          <span :style="{ color: active ? '#7B5CFF' : '#8a8a8e', display: 'inline-flex' }">
            <LIcon :name="tab.iconName" :size="22" />
          </span>
        </template>
      </FloatingTabBar>
    </div>

    <!-- ================= 添加设备 ================= -->
    <div v-else-if="mate.page === 'add'" class="page add-page">
      <div class="nav-bar">
        <button class="nav-back" data-nav-back @click="mate.back()">
          <LIcon name="chevronLeft" :size="22" />
        </button>
        <div class="nav-title">{{ am('flow.addTitle') }}</div>
        <div class="nav-placeholder" />
      </div>
      <div class="add-scroll">
        <div class="add-section-header">
          <div class="add-section-title">{{ am('flow.scanNearby') }}</div>
          <div class="add-section-sub">{{ am('flow.scanNearbySub') }}</div>
        </div>
        <div class="scan-card">
          <div class="scanning-v2">
            <div class="scan-radar">
              <div class="scan-radar-track" />
              <div class="scan-radar-center" />
            </div>
            <p class="scan-title-v2">{{ am('flow.scanning') }}</p>
            <p class="scan-sub-v2">{{ am('flow.scanningSub') }}</p>
            <p class="scan-help">
              {{ am('flow.scanHelp') }}<span>{{ am('flow.scanHelpLink') }}</span>
            </p>
          </div>
        </div>

        <div class="add-section-header">
          <div class="add-section-title">{{ am('flow.manualAdd') }}</div>
        </div>
        <div class="category-grid-v2">
          <button
            v-for="t in DEVICE_TYPES"
            :key="t.id"
            class="category-item-v2"
            :data-category="t.id"
            :style="{ background: t.bg, color: t.color }"
            @click="mate.pickType(t.id)"
          >
            <LIcon :name="t.icon" :size="22" />
            <span>{{ am('type.' + t.id) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ================= 选型号 + 配对步骤 ================= -->
    <div v-else-if="mate.page === 'guide'" class="page guide-page">
      <div class="nav-bar">
        <button class="nav-back" data-nav-back @click="mate.back()">
          <LIcon name="chevronLeft" :size="22" />
        </button>
        <div class="nav-title">{{ fill(am('flow.addDeviceTitle'), { name: typeLabel(addType) }) }}</div>
        <div class="nav-placeholder" />
      </div>
      <div class="guide-scroll">
        <div class="model-select">
          <p class="section-title">{{ am('flow.selectModel') }}</p>
          <button
            v-for="(m, i) in models"
            :key="m.code"
            class="model-option"
            :class="{ active: i === mate.addModelIndex }"
            :data-model="m.code"
            @click="mate.pickModel(i)"
          >
            <div class="mo-dot"><div v-if="i === mate.addModelIndex" class="mo-dot-inner" /></div>
            <div class="mo-info">
              <div class="mo-name">{{ m.code }}</div>
              <div class="mo-sub">{{ modelSub(m.subKey) }}</div>
            </div>
          </button>
        </div>
        <div class="guide-steps">
          <p class="section-title">{{ am('flow.pairTitle') }}</p>
          <div v-for="(s, i) in PAIR_STEPS" :key="s" class="step">
            <div class="step-num">{{ i + 1 }}</div>
            <div class="step-text">{{ am('pairStep.' + s) }}</div>
          </div>
        </div>
      </div>
      <div class="guide-action">
        <button class="btn-primary btn-large" data-start-connect @click="startSearch()">
          {{ am('flow.startConnect') }}
        </button>
      </div>
    </div>

    <!-- ================= 搜索设备 ================= -->
    <div v-else-if="mate.page === 'search'" class="page search-page">
      <div class="nav-bar">
        <button class="nav-back" data-nav-back @click="mate.back()">
          <LIcon name="chevronLeft" :size="22" />
        </button>
        <div class="nav-title">{{ am('flow.searchTitle') }}</div>
        <div class="nav-placeholder" />
      </div>
      <div class="search-body">
        <div v-if="mate.scanState === 'searching'" class="searching-state">
          <div class="scan-ring" />
          <div class="scanning-title">{{ am('flow.searchSearching') }}</div>
          <div class="scanning-sub">{{ fill(am('flow.searchSub'), { name: typeLabel(addType) }) }}</div>
        </div>
        <div v-else class="search-results">
          <p class="section-title">{{ am('flow.found') }}</p>
          <button
            v-for="c in mate.found"
            :key="c.id"
            class="search-device"
            :data-found="c.code"
            @click="beginLink()"
          >
            <div class="sd-icon" :style="{ color: typeOf(c.type)?.color }">
              <LIcon :name="typeOf(c.type)?.icon || 'circle'" :size="24" />
            </div>
            <div class="sd-info">
              <div class="sd-name">{{ c.code }}</div>
              <div class="sd-sub">{{ am('flow.signalStrong') }}</div>
            </div>
            <span class="sd-connect">{{ am('flow.connect') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ================= 连接中 / 连接成功 ================= -->
    <div v-else-if="mate.page === 'center'" class="page center-page">
      <template v-if="mate.linkState === 'connecting'">
        <div class="connecting-ring" />
        <div class="connecting-title">{{ am('flow.connecting') }}</div>
        <div class="connecting-sub">{{ mate.found[0]?.code }}</div>
      </template>
      <template v-else>
        <div class="success-icon"><LIcon name="check" :size="44" /></div>
        <div class="connecting-title">{{ am('flow.success') }}</div>
        <div class="connecting-sub">{{ am('flow.successSub') }}</div>
        <button class="btn-primary center-action" data-enter-device @click="mate.enterDevice()">
          {{ am('flow.enterDevice') }}
        </button>
      </template>
    </div>

    <!-- ================= 设备控制 ================= -->
    <div v-else-if="mate.page === 'control' && dev" class="page control-page">
      <div class="nav-bar transparent">
        <button class="nav-back" data-nav-back @click="mate.back()">
          <LIcon name="chevronLeft" :size="22" />
        </button>
        <div class="nav-title">{{ nameOf(dev) }}</div>
        <button class="nav-more" data-nav-more @click="mate.openInfo()">
          <LIcon name="moreHorizontal" :size="22" />
        </button>
      </div>
      <div class="control-scroll">
        <div class="product-hero">
          <div class="hero-ring">
            <LIcon :name="typeOf(dev.type)?.icon || 'circle'" :size="38" />
          </div>
          <div class="product-status" :class="dev.online ? 'online' : 'offline'">
            {{ dev.online ? am('status.online') : am('status.offline') }}
          </div>
          <div v-if="isFan && dev.mode === 5" class="room-temp">
            {{ am('fan.roomTemp') }} {{ dev.temp }}°
          </div>
        </div>

        <div class="power-row">
          <button
            class="power-btn"
            :class="{ on: dev.power, disabled: switchDisabled(dev), pending: mate.pending[dev.id] }"
            data-power-btn
            :disabled="switchDisabled(dev) || !!mate.pending[dev.id]"
            @click="mate.toggleFanPower(dev.id)"
          >
            <LIcon name="power" :size="26" />
            <span>{{ am('control.powerOn') }}</span>
          </button>
          <div class="mode-display" data-mode-display>
            {{ dev.power ? (am('fan.modes')[dev.mode] || am('control.powerOn')) : am('control.powerOff') }}
          </div>
        </div>

        <template v-if="isFan">
          <!-- 风速档位：改用**首页风扇卡那套档位设计**（`.dc-gear-*` 分段条），
               档位值挪到标题同一行 —— 与卡片 `.dc-gear-info` 同构。 -->
          <div class="control-card">
            <div class="speed-head">
              <div class="card-title">{{ am('control.speedTitle') }}</div>
              <span
                class="dc-gear-value"
                :class="{ pending: mate.pending[dev.id] }"
                data-speed-label
              >{{ fill(am('control.speedValue'), { n: fanSpeed, max: FAN_SPEED_MAX }) }}</span>
            </div>
            <div class="dc-gear-track" data-speed-track>
              <button
                v-for="n in FAN_SPEED_MAX"
                :key="n"
                class="dc-gear-seg"
                :class="{ active: n <= fanSpeed, pending: mate.pending[dev.id] }"
                :data-speed-seg="n"
                @click="mate.setFanSpeed(dev.id, n)"
              />
            </div>
          </div>

          <div class="control-card">
            <div class="card-title">{{ am('control.modeTitle') }}</div>
            <div class="mode-grid">
              <button
                v-for="(m, i) in am('fan.modes')"
                :key="m"
                class="mode-chip"
                :class="{ active: i === dev.mode }"
                :data-mode="i"
                @click="mate.setFanMode(dev.id, i)"
              >
                {{ m }}
              </button>
            </div>
          </div>

          <div class="control-card swing-card" :class="{ disabled: !canUseFan || !dev.power }">
            <div class="swing-header">
              <div class="swing-left">
                <LIcon name="moveHorizontal" :size="20" />
                <span>{{ am('control.swing') }}</span>
              </div>
              <button
                class="cl-switch"
                :class="{ on: dev.swing }"
                data-swing-switch
                @click="mate.toggleSwing(dev.id)"
              >
                <span class="cl-knob" />
              </button>
            </div>
            <div v-if="dev.swing" class="swing-angles">
              <button
                v-for="a in FAN_SWING_ANGLES"
                :key="a"
                class="angle-chip"
                :class="{ active: dev.swingAngle === a }"
                :data-angle="a"
                @click="mate.setSwingAngle(dev.id, a)"
              >
                {{ a }}°
              </button>
            </div>
          </div>

          <div class="control-row">
            <button class="control-item" data-timer="timerOff" @click="mate.openTimerSheet('timerOff')">
              <div class="ci-icon"><LIcon name="alarmClock" :size="22" /></div>
              <div class="ci-label">{{ am('control.timerOff') }}</div>
              <div class="ci-value">{{ dev.timerOff ? `${timerHours(dev.timerOff)} ${am('fan.hour')}` : am('control.notSet') }}</div>
            </button>
            <button class="control-item" data-timer="timerOn" @click="mate.openTimerSheet('timerOn')">
              <div class="ci-icon"><LIcon name="timer" :size="22" /></div>
              <div class="ci-label">{{ am('control.timerOn') }}</div>
              <div class="ci-value">{{ dev.timerOn ? `${timerHours(dev.timerOn)} ${am('fan.hour')}` : am('control.notSet') }}</div>
            </button>
          </div>

          <div class="control-row">
            <button
              class="control-item"
              :class="{ active: dev.plasma }"
              data-plasma
              @click="mate.togglePlasma(dev.id)"
            >
              <div class="ci-icon"><LIcon name="sparkles" :size="22" /></div>
              <div class="ci-label">{{ am('control.plasma') }}</div>
              <div class="ci-value">
                {{ dev.plasma ? am('control.plasmaOn') : am('control.plasmaOff') }}
              </div>
            </button>
            <button class="control-item placeholder" @click="mate.openInfo()">
              <div class="ci-icon"><LIcon name="moreHorizontal" :size="22" /></div>
              <div class="ci-label">{{ am('control.more') }}</div>
              <div class="ci-value">-</div>
            </button>
          </div>

          <div class="control-card child-lock-card" :class="{ active: dev.childLock }">
            <div class="cl-left">
              <LIcon name="lock" :size="20" />
              <span>{{ am('control.childLock') }}</span>
            </div>
            <button
              class="cl-switch"
              :class="{ on: dev.childLock }"
              data-child-lock
              @click="mate.toggleChildLock(dev.id)"
            >
              <span class="cl-knob" />
            </button>
          </div>
        </template>

        <!-- ⚠️ 这三台的流程入口曾挂在这里；首页卡片改成直达功能页后，
             控制页只对风扇可达（`openDevice` 对三台集成设备直接进各自流程），
             挂在这里就是永远点不到的 UI，已移除。 -->

        <button class="control-card other-card" data-manual>
          <span>{{ am('control.manual') }}</span>
          <LIcon name="chevronRight" :size="20" />
        </button>
        <button
          class="control-card other-card"
          :disabled="!!mate.pending[dev.id]"
          data-upgrade
          @click="mate.upgradeFirmware(dev.id)"
        >
          <span>{{ am('control.firmware') }}</span>
          <span v-if="mate.pending[dev.id]" class="fw-pending">{{ am('device.upgrading') }}</span>
          <LIcon v-else name="chevronRight" :size="20" />
        </button>
      </div>
    </div>

    <!-- ================= 设备详情 ================= -->
    <div v-else-if="mate.page === 'info' && dev" class="page device-info-page">
      <div class="nav-bar">
        <button class="nav-back" data-nav-back @click="mate.back()">
          <LIcon name="chevronLeft" :size="22" />
        </button>
        <div class="nav-title">{{ am('info.title') }}</div>
        <div class="nav-placeholder" />
      </div>
      <div class="device-info-scroll">
        <div class="device-info-hero">
          <div class="hero-ring">
            <LIcon :name="typeOf(dev.type)?.icon || 'circle'" :size="38" />
          </div>
          <div class="device-info-name">{{ nameOf(dev) }}</div>
        </div>
        <div class="info-card">
          <div class="info-row">
            <span class="info-label">{{ am('info.mac') }}</span>
            <span class="info-value" data-info-mac>{{ dev.mac }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ am('info.firmwareVer') }}</span>
            <span class="info-value" data-info-fw>{{ dev.firmware }}</span>
          </div>
        </div>
        <div class="info-card">
          <button class="info-row clickable" data-rename @click="mate.openRename()">
            <span class="info-label">{{ am('info.rename') }}</span>
            <span class="info-value with-arrow">{{ nameOf(dev) }}</span>
            <LIcon name="chevronRight" :size="18" />
          </button>
        </div>
        <div class="info-card">
          <button class="info-row danger clickable" data-remove @click="mate.openDeleteConfirm()">
            {{ am('info.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ================= 浮层：定时 ================= -->
    <div v-if="mate.timerSheet" class="xsheet-overlay" data-timer-overlay @click.self="mate.closeTimerSheet()">
      <div class="xsheet">
        <div class="xsheet-header">
          <div class="xsheet-title">
            {{ mate.timerSheet === 'timerOff' ? am('control.timerOff') : am('control.timerOn') }}
          </div>
          <button class="xsheet-close" @click="mate.closeTimerSheet()">
            <LIcon name="x" :size="20" />
          </button>
        </div>
        <div class="timer-wheel">
          <button class="tw-btn" data-timer-minus @click="stepTimer(-1)">−</button>
          <div class="tw-value" data-timer-value>
            {{ timerHours(dev?.[mate.timerSheet] || 0) }}<span>{{ am('fan.hour') }}</span>
          </div>
          <button class="tw-btn" data-timer-plus @click="stepTimer(1)">+</button>
        </div>
        <div class="xsheet-actions">
          <button class="btn-ghost" @click="clearTimer()">{{ am('info.cancel') }}</button>
          <button class="btn-primary" data-timer-ok @click="saveTimer()">{{ am('info.save') }}</button>
        </div>
      </div>
    </div>

    <!-- ================= 浮层：重命名 ================= -->
    <div v-if="mate.renaming" class="modal-overlay" data-rename-overlay @click.self="mate.closeRename()">
      <div class="modal">
        <div class="modal-title">{{ am('info.rename') }}</div>
        <input
          v-model="nickDraft"
          class="modal-input"
          data-rename-input
          :placeholder="am('info.renamePlaceholder')"
        >
        <div class="modal-actions">
          <button class="btn-ghost" @click="mate.closeRename()">{{ am('info.cancel') }}</button>
          <button class="btn-primary" data-rename-save @click="saveNick()">{{ am('info.save') }}</button>
        </div>
      </div>
    </div>

    <!-- ================= 浮层：删除确认 ================= -->
    <div v-if="mate.confirmDelete" class="modal-overlay" data-delete-overlay>
      <div class="modal">
        <div class="modal-title">{{ am('info.deleteTitle') }}</div>
        <div class="modal-body">{{ am('info.deleteBody') }}</div>
        <div class="modal-actions">
          <button class="btn-ghost" @click="mate.closeDeleteConfirm()">{{ am('info.cancel') }}</button>
          <button class="btn-primary" data-delete-ok @click="mate.confirmRemove()">{{ am('info.delete') }}</button>
        </div>
      </div>
    </div>

    <!-- ================= 口袋打印机五屏流程 ================= -->
    <PrinterFlow v-if="mate.printScreen" @close="mate.closePrint()" />

    <!-- ============ 录音充电宝 / AI Mori 设备流程 ============ -->
    <RecorderFlow v-if="mate.deviceFlow === 'recorder'" @close="mate.closeDeviceFlow()" />
    <MoriFlow v-if="mate.deviceFlow === 'mori'" @close="mate.closeDeviceFlow()" />

    <!-- ================= 提示条 ================= -->
    <Transition name="fade">
      <div v-if="noticeText" class="toast" data-toast>{{ noticeText }}</div>
    </Transition>
  </div>
</template>

<style scoped>
/* ===== 归档 `[data-v-1f88e91e]` 的样式逐条重放（数值照抄，不改写） ===== */
.aimate {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  /* 应用默认背景色 = 设置页 `.settings-app` 的 #F4F5F7（Ricky 2026-10-12） */
  background: #F4F5F7;
  color: #111;
  -webkit-tap-highlight-color: transparent;
}
.page { width: 100%; height: 100%; display: flex; flex-direction: column; position: relative; }

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--safe-top, 44px) + 6px) 16px 12px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.nav-bar.transparent {
  background: transparent;
  border-bottom: none;
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 10;
}
.nav-back, .nav-more {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: rgba(255, 255, 255, 0.8);
  border: none; color: #111; padding: 0;
}
.nav-title { font-size: 17px; font-weight: 600; flex: 1; text-align: center; }
.nav-placeholder { width: 36px; }

.section-title { font-size: 13px; font-weight: 600; color: #666; margin: 16px 0 8px; padding: 0 16px; }
.btn-primary {
  background: #7b5cff; color: #fff; border: none; border-radius: 12px;
  padding: 12px 20px; font-size: 15px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center;
}
.btn-primary:active { transform: scale(0.98); }
.btn-large { width: 100%; border-radius: 14px; padding: 14px; font-size: 16px; }
.btn-ghost {
  background: #f2f2f7; color: #111; border: none; border-radius: 12px;
  padding: 12px 20px; font-size: 15px; font-weight: 600;
}

.toast {
  /* 🔴 必须 `absolute` 而不是 `fixed`：屏幕容器外面还有一层 z-index:25 的
     `edge-zone` 与 z-index:96 的 `home-indicator` 浮层，而且宿主把整机缩放过。
     `fixed` 的包含块会落到**外层机身**（实测 392×820）而不是屏幕（360×788），
     ⇒ 浮层四边各偏 16px，弹窗/提示条会跑到机身边框外。
     `absolute` 的包含块是 `.aimate`（= 屏幕），四边严丝合缝。 */
  position: absolute; left: 0; right: 0; margin: 0 auto; width: fit-content;
  max-width: calc(100% - 40px);
  top: calc(var(--safe-top, 44px) + 50px);
  background: rgba(0, 0, 0, 0.82); color: #fff;
  padding: 10px 18px; border-radius: 20px; font-size: 14px;
  z-index: 2000; pointer-events: none;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ---- 添加设备 ---- */
.add-scroll { flex: 1; overflow-y: auto; padding: 8px 16px 32px; }
.add-section-header { margin: 8px 0 14px; }
.add-section-title { font-size: 18px; font-weight: 700; color: #111; }
.add-section-sub { font-size: 13px; color: #999; margin-top: 4px; }
.scan-card {
  background: #fff; border-radius: 20px; padding: 36px 20px; margin-bottom: 28px;
  min-height: 320px; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.scanning-v2 { display: flex; flex-direction: column; align-items: center; text-align: center; }
.scan-radar {
  position: relative; width: 130px; height: 130px; border-radius: 50%;
  background: rgba(123, 92, 255, 0.08); margin-bottom: 28px;
}
.scan-radar-track {
  position: absolute; inset: 0; border-radius: 50%;
  border: 4px solid #7b5cff; border-color: #7b5cff transparent transparent;
  animation: spin 1.4s linear infinite;
}
.scan-radar-center { position: absolute; inset: 34px; border-radius: 50%; background: rgba(123, 92, 255, 0.18); }
.scan-title-v2 { font-size: 17px; font-weight: 600; color: #111; margin-bottom: 6px; }
.scan-sub-v2 { font-size: 13px; color: #999; margin-bottom: 14px; }
.scan-help { font-size: 13px; color: #999; }
.scan-help span { color: #7b5cff; font-weight: 500; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.category-grid-v2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.category-item-v2 {
  display: flex; align-items: center; gap: 10px; padding: 16px;
  border-radius: 16px; border: none; font-size: 15px; font-weight: 500;
}
.category-item-v2:active { transform: scale(0.96); }

/* ---- 选型号 + 配对步骤 ---- */
.guide-page { background: #F4F5F7; }
.guide-scroll { flex: 1; overflow-y: auto; }
.model-select { padding: 8px 16px; }
.model-option {
  width: 100%; background: #fff; border-radius: 14px; padding: 14px;
  display: flex; align-items: center; gap: 12px; margin-bottom: 10px;
  border: 2px solid transparent; text-align: left;
}
.model-option.active { border-color: #7b5cff; }
.mo-dot {
  width: 20px; height: 20px; border-radius: 50%; border: 2px solid #ccc;
  display: flex; align-items: center; justify-content: center; flex: none;
}
.mo-dot-inner { width: 10px; height: 10px; border-radius: 50%; background: #7b5cff; }
.mo-info { flex: 1; }
.mo-name { font-size: 15px; font-weight: 600; }
.mo-sub { font-size: 12px; color: #999; }
.guide-steps { padding: 0 16px 16px; }
.step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.step-num {
  width: 24px; height: 24px; border-radius: 50%; background: #7b5cff; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex: 0 0 auto;
}
.step-text { font-size: 14px; color: #333; line-height: 24px; }
.guide-action { padding: 0 16px calc(20px + var(--home-indicator-zone, 34px)); }

/* ---- 搜索设备 ---- */
.search-page { background: #F4F5F7; }
.search-body { padding: 16px; }
.searching-state { display: flex; flex-direction: column; align-items: center; padding: 48px 16px; text-align: center; }
.scan-ring {
  width: 110px; height: 110px; border-radius: 50%;
  border: 4px solid #7b5cff; border-color: #7b5cff transparent transparent;
  animation: spin 1s linear infinite; margin-bottom: 28px;
}
.scanning-title { font-size: 17px; font-weight: 600; color: #111; margin-bottom: 8px; }
.scanning-sub { font-size: 13px; color: #999; }
.search-results { padding-top: 8px; }
.search-device {
  width: 100%; background: #fff; border-radius: 16px; padding: 14px; border: none;
  display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.search-device:active { transform: scale(0.98); }
.sd-icon {
  width: 52px; height: 52px; border-radius: 14px; background: #f2f2f7;
  display: flex; align-items: center; justify-content: center; flex: none;
}
.sd-info { flex: 1; text-align: left; }
.sd-name { font-size: 16px; font-weight: 600; }
.sd-sub { font-size: 13px; color: #999; margin-top: 2px; }
.sd-connect {
  background: #7b5cff; color: #fff; font-size: 13px; font-weight: 600;
  padding: 8px 16px; border-radius: 14px;
}

/* ---- 连接中 / 连接成功 ---- */
.center-page { align-items: center; justify-content: center; background: #F4F5F7; padding-bottom: 80px; }
.connecting-ring {
  width: 90px; height: 90px; border-radius: 50%;
  border: 4px solid #7b5cff; border-color: #7b5cff transparent transparent;
  animation: spin 1s linear infinite; margin-bottom: 24px;
}
.connecting-title { font-size: 18px; font-weight: 600; color: #111; }
.connecting-sub { font-size: 14px; color: #999; margin-top: 6px; }
.success-icon {
  width: 90px; height: 90px; border-radius: 50%; background: #fff; color: #34c759;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.center-action { width: 200px; margin-top: 28px; }

/* ---- 设备控制 ---- */
.control-page { background: #fff; }
.control-scroll {
  flex: 1; overflow-y: auto;
  /* 控制页的导航是 absolute 的，这里必须自己让出顶部（含 64px 边缘手势热区） */
  padding-top: calc(var(--safe-top, 44px) + 56px);
  padding-bottom: calc(24px + var(--home-indicator-zone, 34px));
}
.product-hero { display: flex; flex-direction: column; align-items: center; padding: 16px 0 10px; }
.hero-ring {
  /* 归档所有产品图环都是同一个紫，不按设备类型换色（`.device-info-hero svg { color: #7b5cff }`） */
  color: #7b5cff;
  width: 84px; height: 84px; border-radius: 50%; border: 2px solid currentColor;
  display: flex; align-items: center; justify-content: center;
}
.product-status {
  font-size: 13px; font-weight: 500; margin-top: 10px;
  padding: 4px 12px; border-radius: 12px; background: #f2f2f7; color: #666;
}
.product-status.online { background: #e8f9ee; color: #34c759; }
.product-status.offline { background: #f2f2f7; color: #999; }
.room-temp { font-size: 13px; color: #999; margin-top: 6px; }
.power-row { display: flex; align-items: center; justify-content: space-between; padding: 0 16px 20px; }
.power-btn {
  width: 72px; height: 72px; border-radius: 50%; border: none;
  background: #f2f2f7; color: #999;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; font-size: 12px; font-weight: 600;
}
.power-btn.on { background: #7b5cff; color: #fff; box-shadow: 0 4px 16px rgba(123, 92, 255, 0.35); }
.power-btn.disabled { opacity: 0.4; }
.power-btn.pending { opacity: 0.7; }
.mode-display { font-size: 20px; font-weight: 700; color: #111; }
.control-card { background: #f2f2f7; border-radius: 18px; margin: 0 16px 14px; padding: 16px; border: none; }
.card-title { font-size: 14px; font-weight: 600; color: #555; margin-bottom: 12px; }
/* 风速档位：旧圆形滑轨（`.speed-*`）已整体删除，改用**首页风扇卡那套档位设计**
   （`.dc-gear-track` / `.dc-gear-seg` / `.dc-gear-value`，规则本体在风扇卡那一段）。
   这里只补「标题与档位值同一行」的容器 —— 对应卡片里的 `.dc-gear-info`。
   ⛔ 不要在这里重复定义 `.dc-gear-*`：同文件重复的类选择器会被单测守卫判红，
      而且两处定义迟早漂移（当年 `.mh-name` 就是这么翻车的）。 */
.speed-head {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 12px; margin-bottom: 12px;
}
.speed-head .card-title { margin-bottom: 0; }
.mode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.mode-chip {
  background: #fff; border: 1px solid #e5e5ea; border-radius: 12px;
  padding: 10px 6px; font-size: 13px; color: #555;
}
.mode-chip.active { background: #7b5cff; color: #fff; border-color: #7b5cff; }
.control-row { display: flex; gap: 12px; margin: 0 16px 14px; }
.control-item { flex: 1; background: #f2f2f7; border-radius: 18px; padding: 14px; text-align: center; border: none; }
.control-item.active { background: #ede9fe; }
.control-item.placeholder .ci-icon,
.control-item.placeholder .ci-label,
.control-item.placeholder .ci-value { color: #bbb; }
.ci-icon { margin-bottom: 6px; display: flex; justify-content: center; color: #555; }
.ci-label { font-size: 13px; color: #666; }
.ci-value { font-size: 15px; font-weight: 600; color: #111; margin-top: 4px; }
.swing-card { padding: 16px; }
/* 归档只写了 opacity（灰掉但仍可点），这里补 pointer-events 让灰态名副其实 */
.swing-card.disabled { opacity: 0.45; pointer-events: none; }
.swing-header { display: flex; align-items: center; justify-content: space-between; }
.swing-left { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; color: #111; }
.swing-angles {
  display: flex; gap: 10px; margin-top: 14px; padding-top: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.angle-chip {
  flex: 1; padding: 10px 0; border-radius: 12px; border: none;
  background: #f2f2f7; font-size: 14px; font-weight: 600; color: #555;
}
.angle-chip.active { background: #7b5cff; color: #fff; }
.angle-chip:active { transform: scale(0.96); }
.child-lock-card { display: flex; align-items: center; justify-content: space-between; }
.child-lock-card.active { background: #ede9fe; }
.cl-left { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; color: #111; }
.cl-switch {
  width: 48px; height: 28px; border-radius: 14px; background: #dcdce4;
  position: relative; transition: background 0.2s; border: none; padding: 0; flex: none;
}
.cl-switch.on { background: #7b5cff; }
.cl-knob {
  width: 24px; height: 24px; border-radius: 50%; background: #fff;
  position: absolute; top: 2px; left: 2px;
  transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.cl-switch.on .cl-knob { transform: translateX(20px); }
.other-card {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 15px; font-weight: 500; color: #111; cursor: pointer;
}
.fw-pending { font-size: 13px; color: #7b5cff; }

/* ---- 设备详情 ---- */
.device-info-page { background: #F4F5F7; }
.device-info-scroll { flex: 1; overflow-y: auto; padding: 20px 16px 40px; }
.device-info-hero { display: flex; flex-direction: column; align-items: center; padding: 24px 0 32px; }
.device-info-name { margin-top: 16px; font-size: 18px; font-weight: 600; color: #111; }
.info-card { background: #fff; border-radius: 16px; margin-bottom: 12px; overflow: hidden; }
.info-row {
  width: 100%;
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; font-size: 15px; border: none; background: none;
  border-bottom: 1px solid #f2f2f7; text-align: left;
}
.info-row:last-child { border-bottom: none; }
.info-row.clickable { cursor: pointer; }
.info-label { color: #111; font-weight: 500; }
.info-value { color: #8e8e93; }
.info-value.with-arrow { margin-right: 4px; }
.info-row.danger { color: #ff3b30; justify-content: center; font-weight: 500; }

/* ---- 浮层 ---- */
.xsheet-overlay {
  /* 同上：`fixed` 会按外层机身定位 ⇒ 弹窗四边各溢出 16px、跑到机身边框外 */
  position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4);
  z-index: 500; display: flex; align-items: flex-end;
}
.xsheet {
  width: 100%; background: #fff; border-radius: 20px 20px 0 0;
  /* 归档写的是 env(safe-area-inset-bottom)，本仓恒为 0 ⇒
     保存按钮会落进 z-index 96 的 home-indicator 热区，点不动。改用本仓安全区 token */
  padding: 16px 16px calc(20px + var(--home-indicator-zone, 34px));
  animation: slideUp 0.25s ease;
}
@keyframes slideUp { 0% { transform: translateY(100%); } 100% { transform: translateY(0); } }
.xsheet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.xsheet-title { font-size: 17px; font-weight: 700; }
.xsheet-close { background: none; border: none; padding: 4px; color: #111; }
.timer-wheel { display: flex; align-items: center; justify-content: center; gap: 24px; padding: 20px 0; }
.tw-btn {
  width: 44px; height: 44px; border-radius: 50%; border: none;
  background: #f2f2f7; font-size: 24px; color: #7b5cff;
}
.tw-value { font-size: 48px; font-weight: 300; color: #111; }
.tw-value span { font-size: 20px; margin-left: 4px; color: #999; }
.xsheet-actions { display: flex; gap: 12px; margin-top: 8px; }
.xsheet-actions .btn-primary, .xsheet-actions .btn-ghost { flex: 1; }

.modal-overlay {
  /* 同上：`fixed` 会按外层机身定位 ⇒ 弹窗四边各溢出 16px */
  position: absolute; inset: 0; background: rgba(0, 0, 0, 0.45);
  z-index: 600; display: flex; align-items: center; justify-content: center; padding: 32px;
}
.modal { width: 100%; max-width: 280px; background: #fff; border-radius: 18px; padding: 20px; }
.modal-title { font-size: 17px; font-weight: 700; text-align: center; margin-bottom: 14px; }
.modal-input {
  width: 100%; padding: 12px; border-radius: 12px;
  border: 1px solid #e5e5ea; font-size: 15px; margin-bottom: 16px; box-sizing: border-box;
}
.modal-body { font-size: 14px; color: #666; text-align: center; line-height: 1.5; margin-bottom: 18px; }
.modal-actions { display: flex; gap: 10px; }
.modal-actions .btn-primary, .modal-actions .btn-ghost { flex: 1; }
/* ===== 底部 Tab 层（首页 / 我的）：结构取自两份 Demo 的 shell ===== */
.tabview { position: absolute; inset: 0; display: flex; flex-direction: column; }
/* 顶栏去掉后只留状态栏留白：高度取原 `.home-head` 的 padding-top
   （`--safe-top` + 10px = 64px），保证首屏首个可点元素仍在手势热区之下。
   🔴 2026-10-12（Ricky「去掉状态栏底部的背景」）：**不再填色** —— 留白只负责占位，
   透明后露出的是 `.aimate` 的根底色，状态栏那一条于是与下方内容区**同色**、白带消失。
   ⛔ 别再给它加 background —— 一加就回到「顶部一条异色带」。 */
.home-statusbar { height: calc(var(--safe-top, 44px) + 10px); flex: none; }
/* 底部渐隐遮罩（规格对齐时钟页 `.alarm-list`）：挂在**滚动容器自身的盒子**上 ⇒ 不随内容滚动，
   于是卡片滚过底栏那一段时不透明度递减、而不是被硬生生截断。
   三段锚点与底栏几何同源：bottom 22px + 高 62px ⇒ 底栏占 100%-84px ~ 100%-22px，
   故遮罩自 100%-92px 起淡、到 100%-22px（= 底栏下沿）全透明。
   ⚠️ 改底栏的 height / bottom 时这三个百分位要同步改（e2e 有「遮罩与底栏自洽」守卫）。 */
.home-page { --tabbar-fade: linear-gradient(to bottom, black 0%, black calc(100% - 92px), rgba(0, 0, 0, 0.45) calc(100% - 55px), transparent calc(100% - 22px)); }
.home-scroll { flex: 1; overflow-y: auto; padding: 4px 16px 0; -webkit-mask-image: var(--tabbar-fade); mask-image: var(--tabbar-fade); }
/* 底部留白取时钟页 `.alarm-list` 的 110px：让最后一张卡滚到底时完全落在遮罩起淡点（92px）之上 */
.home-pad { height: 110px; }
.section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin: 16px 0 10px; }
.sh-title { font-size: 17px; font-weight: 700; color: #111; margin: 0; }
.sh-sub { font-size: 12px; color: #8e8ea3; margin: 3px 0 0; }
.sh-action {
  border: none; background: #f0ecff; color: #7b5cff;
  font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 999px; flex: none;
}

.mcard {
  display: block; width: 100%; text-align: left; border: none;
  background: #fff; border-radius: 18px; padding: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); margin-bottom: 12px;
  transition: transform 0.15s;
}
.mcard:active { transform: scale(0.985); }
.mcard.offline { opacity: 0.92; }
.mc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.mc-status { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; }
.mc-status.on { color: #34c759; }
.mc-status.off { color: #9a9aa5; }
.mc-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: block; }
.mc-more {
  width: 28px; height: 28px; border-radius: 50%; color: #9a9aa5; background: #f2f2f7;
  display: flex; align-items: center; justify-content: center;
}
.mc-body { display: flex; align-items: center; gap: 12px; }
.mc-art { width: 58px; height: 58px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex: none; }
.mc-info { flex: 1; min-width: 0; }
.mc-name { font-size: 17px; font-weight: 600; color: #111; }
.mc-model { font-size: 12px; color: #8e8ea3; margin-top: 2px; }
.mc-meta { font-size: 12px; color: #6b6b76; margin-top: 4px; }
/* ==================================================================
 * 风扇卡：**版式对齐 AI Mori 卡**（Ricky 2026-10-12「卡片一致性较差」）
 * 骨架与 Mori 卡逐段同构：
 *   `.mc-top`（四张卡共用的状态行）→ `.dc-main`（52×52 图标盒 + 名称/型号 + 右侧开关）
 *   → `.dc-gear-row`（整宽区块，上边 1px 分隔线）。
 * 卡框与 Mori 卡**共用同一条规则**（`.mcard-mori, .mcard-fan`，见下）⇒ 不会漂移。
 * 单测有一条 parity 守卫逐条比对 `.mm-*` 与 `.dc-*` 的对应规则，改一边不改另一边会红。
 * ⚠️ 刻意偏离归档的两点：归档原卡**没有顶部状态行**、图标盒是 **72×52**。
 *    开关 1200ms / 档位 900ms 两个回执窗口、以及 `.dc-switch` / `.dc-gear-*` 的数值仍照归档。
 * ================================================================== */
.dc-main { display: flex; align-items: center; padding: 8px 14px 14px; }
.dc-art {
  width: 52px; height: 52px; border-radius: 14px; flex: none; margin-right: 14px;
  background: #f2f2f7; color: #7b5cff;
  display: flex; align-items: center; justify-content: center;
}
.dc-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dc-name { font-size: 17px; font-weight: 700; color: #111; }
.dc-model { font-size: 12px; color: #8e8ea3; }
.dc-power { flex: none; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dc-switch {
  width: 48px; height: 28px; border-radius: 14px; background: #e5e5ea;
  border: none; padding: 0; position: relative; transition: background 0.25s ease;
}
.dc-switch.on { background: #34c759; }
.dc-switch.pending { opacity: 0.7; }
.dc-switch.disabled { opacity: 0.4; background: #e5e5ea !important; }
.dc-switch-knob {
  position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); transition: transform 0.25s ease;
}
.dc-switch.on .dc-switch-knob { transform: translate(20px); }
/* 归档：回执等待期里滑块自己来回蹭（关态 0→4px / 开态 20→16px），
   比单纯降透明度更能表达「指令已下发、在等设备回执」 */
.dc-switch.pending .dc-switch-knob { animation: dc-knob-pulse 1s ease-in-out infinite; }
@keyframes dc-knob-pulse { 0%, 100% { transform: translate(0); } 50% { transform: translate(4px); } }
.dc-switch.on.pending .dc-switch-knob { animation: dc-knob-pulse-on 1s ease-in-out infinite; }
@keyframes dc-knob-pulse-on { 0%, 100% { transform: translate(20px); } 50% { transform: translate(16px); } }
/* ⚠️ 归档 11px —— 本仓排版阶梯下限是 12px（11px 在真机读不清，Ricky 已反馈过一次） */
.dc-switch-label { font-size: 12px; color: #666; }

/* 整宽区块：与 Mori 卡 `.mm-actions` 同一手法 —— 上边 1px 分隔线 + 自己的内边距 */
.dc-gear-row { padding: 13px 14px 14px; border-top: 1px solid #e9ecef; }
.dc-gear-row.disabled { opacity: 0.45; pointer-events: none; }
.dc-gear-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.dc-gear-label { font-size: 13px; color: #111; font-weight: 500; }
.dc-gear-value { font-size: 12px; color: #666; }
.dc-gear-value.pending { color: #7b5cff; }
.dc-gear-track { display: flex; align-items: center; gap: 5px; height: 22px; }
.dc-gear-seg {
  flex: 1; height: 8px; border-radius: 4px; background: #e5e5ea;
  transition: background 0.2s ease; cursor: pointer;
}
.dc-gear-seg.active { background: #7b5cff; }
.dc-gear-seg.pending { animation: dc-seg-pulse 0.9s ease-in-out infinite; }
@keyframes dc-seg-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.mc-enter {
  display: flex; align-items: center; gap: 6px; margin-top: 12px; padding-top: 11px;
  border-top: 1px solid #f2f2f7; color: #7b5cff; font-size: 13px; font-weight: 600;
}
.mc-enter .mce-label { flex: 1; }
/* 12px 是排版阶梯的最小档：11px 的副文案在真机上读不清（Ricky 已反馈过一次） */
.mc-enter .mce-sub { font-size: 12px; font-weight: 500; color: #9a9aa5; flex: none; }

/* ==================================================================
 * 打印机卡：照归档 `home-screen` 重放（深色大卡 + CSS 实物图形 + 白底药丸）
 * 数值全部取自归档：底 #172332 · 圆角 28px · padding 23px · min-height 264px ·
 * 机身 124×76（圆角 25/25/21/21）· 药丸 padding 11px 14px / 圆角 14px。
 * 只有这一张走 hero 形态，其余设备仍是上面的浅色小卡。
 * ================================================================== */
.mcard-hero {
  display: flex; flex-direction: column;
  background: #172332; color: #fff;
  border-radius: 28px; padding: 23px; min-height: 264px;
  box-shadow: 0 20px 40px rgba(23, 35, 50, 0.22);
  position: relative; overflow: hidden;
}
/* 归档 `.device-card::after`：右上角一圈白色光晕 */
.mcard-hero::after {
  content: ''; position: absolute; width: 230px; height: 230px;
  right: -80px; top: -105px; pointer-events: none;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0) 68%);
}
.mcard-hero .mc-top { position: relative; z-index: 2; margin-bottom: 0; }
.mcard-hero .mc-status { font-size: 12px; font-weight: 700; }
/* 归档 `#dce8e5` + `#66ddc5` 圆点；`.mc-status` 基础档 2026-10-12 已从 11px 抬到 12px
   （本仓排版下限，四张卡同值），此处保持同值不再单独抬。 */
.mcard-hero .mc-status.on { color: #dce8e5; }
.mcard-hero .mc-status.on .mc-dot { background: #66ddc5; box-shadow: 0 0 0 4px rgba(102, 221, 197, 0.13); }
.mcard-hero .mc-status.off { color: #9aa4ae; }
.mcard-hero .mc-status.off .mc-dot { box-shadow: none; }
.mcard-hero .mc-more { color: rgba(255, 255, 255, 0.72); background: rgba(255, 255, 255, 0.1); }

/* 中央舞台：归档 `.printer-wrap` 是 116px 固定高，这里用 flex 撑满卡片中段 */
.hp-stage { flex: 1; min-height: 116px; display: grid; place-items: center; position: relative; z-index: 1; }

/* 归档 `.printer`：白色圆角机身 + 出纸口 + 一张伸出来的照片 + 右下状态灯 */
.hp-printer {
  position: relative; width: 124px; height: 76px; border-radius: 25px 25px 21px 21px;
  background: linear-gradient(145deg, #fff, #e6e9e8 78%);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.25), inset -8px -8px 18px rgba(84, 96, 98, 0.08);
}
.hp-printer::before {
  content: ''; position: absolute; left: 18px; right: 18px; top: 12px; height: 9px;
  border-radius: 5px; background: #b4bbb9; box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.2);
}
.hp-printer::after {
  content: ''; position: absolute; left: 27px; top: -46px; width: 70px; height: 68px;
  background: linear-gradient(135deg, #ffb27a 0 26%, #e46852 26% 43%, #6eb7bd 43% 68%, #273e58 68%);
  border: 5px solid #fff; border-bottom-width: 9px;
  box-shadow: 0 7px 14px rgba(0, 0, 0, 0.18);
}
.hp-dot {
  position: absolute; z-index: 2; right: 16px; bottom: 15px;
  width: 7px; height: 7px; border-radius: 50%; background: #54d2ba;
}

/* 底部：归档 `.device-card-bottom`（`align-items: end` + 两端对齐） */
.mc-bottom {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 14px;
  position: relative; z-index: 2;
}
.hp-copy { display: flex; flex-direction: column; min-width: 0; }
/* 归档原值 20px / 780；本仓排版阶梯最大档是 headline 17px —— 英雄卡按原型保留 20px */
.hp-name { font-size: 20px; font-weight: 780; letter-spacing: -0.03em; color: #fff; }
.hp-meta { margin-top: 6px; color: #aeb7c1; font-size: 12px; }
/* 归档 `.quick`：白底深字药丸；`nowrap` 防「快速打印」折行 */
.hp-quick {
  flex: 0 0 auto; white-space: nowrap; text-align: center;
  background: #fff; color: #172332; border-radius: 14px;
  padding: 11px 14px; font-size: 12px; font-weight: 800;
  cursor: pointer; transition: transform 0.15s;
}
.hp-quick:active { transform: scale(0.96); }
/* 打印机的这一行是入口本身（`quickPrint()` 直达相册），不是说明文字 */

/* ==================================================================
 * 录音充电宝卡：照归档 `home-screen` 的 `.device-card` 重放
 * 数值全部取自归档：底 = radial(circle at 90% 10%, rgba(167,150,255,.43) → transparent 32%)
 *   + linear(145deg,#28205f,#4936a5 54%,#624aca)；圆角 25px · padding 20px · min-height 276px；
 *  `::before` 是一圈 190px 的描边圆环（right -26 / top -30）；
 *  实物图 133×75（right 13 / top 55 / rotate(-7deg)）；侧条 12px、面板圆角 20px、
 *  点阵 6 列 2px（24 点）、指示灯 5px、图形字样「AI Mate」；
 *  底部托盘 left/right 14 / bottom 14，圆角 18px，三列 7px 间距，磁贴 69px。
 *
 * 🔴 字号：归档卡内是 8 / 9 / 6.5 / 6px，本仓统一抬到 ≥12px
 *    （设备名 17px · 型号/药丸/磁贴文字 12px）。标题块留出右侧 148px 让开实物图，
 *    否则英文长名会压到机身上。
 * ================================================================== */
.mcard-rec {
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 90% 10%, rgba(167, 150, 255, 0.43), transparent 32%),
    linear-gradient(145deg, #28205f, #4936a5 54%, #624aca);
  color: #fff;
  border-radius: 25px;
  padding: 20px 20px 14px;
  min-height: 276px;
  box-shadow: 0 18px 36px rgba(61, 45, 144, 0.24);
  position: relative;
  overflow: hidden;
}
.mcard-rec::before {
  content: ''; position: absolute; width: 190px; height: 190px;
  border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 50%;
  right: -26px; top: -30px; pointer-events: none;
}
.mcard-rec .mc-top { position: relative; z-index: 2; margin-bottom: 0; }
.mcard-rec .mc-status {
  font-size: 12px; font-weight: 700; padding: 5px 9px; border-radius: 10px;
  background: rgba(255, 255, 255, 0.14); color: #dce8e5;
}
.mcard-rec .mc-status.on .mc-dot { background: #69e4a6; box-shadow: 0 0 0 3px rgba(105, 228, 166, 0.13); }
.mcard-rec .mc-status.off { color: #9aa4ae; background: rgba(255, 255, 255, 0.08); }
.mcard-rec .mc-status.off .mc-dot { box-shadow: none; }
.mcard-rec .mc-more { color: rgba(255, 255, 255, 0.72); background: rgba(255, 255, 255, 0.1); }

.rp-head { position: relative; z-index: 2; padding-right: 148px; }
.rp-name { display: block; font-size: 17px; font-weight: 700; letter-spacing: -0.03em; margin: 13px 0 3px; }
.rp-model { display: block; font-size: 12px; color: rgba(255, 255, 255, 0.6); }
.rp-meta {
  display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px;
  font-size: 12px; color: rgba(255, 255, 255, 0.76);
}

/* 实物图：归档 `.device-art`（右侧深色侧条 + 渐变面板 + 点阵 + 指示灯） */
.rp-art {
  position: absolute; z-index: 1;
  width: 133px; height: 75px; right: 13px; top: 55px;
  transform: rotate(-7deg);
  filter: drop-shadow(0 16px 12px rgba(9, 6, 27, 0.34));
}
.rp-art-side {
  position: absolute; right: 0; top: 8px; bottom: 8px; width: 12px;
  background: linear-gradient(90deg, #111117, #43434c); border-radius: 0 10px 10px 0;
}
.rp-art-face {
  position: absolute; inset: 0 7px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 20px;
  background: linear-gradient(145deg, #414149, #15151b 55%, #2e2e35);
}
.rp-grille {
  position: absolute; left: 15px; top: 14px; width: 32px;
  display: grid; grid-template-columns: repeat(6, 2px); gap: 3px;
}
.rp-grille i { width: 2px; height: 2px; background: #73737c; border-radius: 50%; }
.rp-redlight { position: absolute; right: 17px; top: 15px; width: 5px; height: 5px; border-radius: 50%; background: #53535c; }
.rp-redlight.on {
  background: #ff5262;
  box-shadow: 0 0 0 4px rgba(255, 82, 98, 0.15), 0 0 8px #ff5262;
  animation: rp-rec-pulse 1.2s infinite;
}
@keyframes rp-rec-pulse { 50% { opacity: 0.35; } }
.rp-art-face small { position: absolute; left: 15px; bottom: 11px; color: #9999a2; font-size: 12px; }

/* 底部磁贴托盘：归档 `.card-actions`（毛玻璃 + 三列） */
.rp-actions {
  margin: auto -6px 0;
  padding: 12px;
  background: rgba(18, 13, 52, 0.26);
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 18px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px;
  position: relative; z-index: 2;
}
.rp-action {
  min-height: 69px; border-radius: 13px; background: rgba(255, 255, 255, 0.1);
  color: #fff; padding: 8px 4px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 5px; text-align: center; cursor: pointer; transition: background 0.15s;
}
.rp-action:active { background: rgba(255, 255, 255, 0.18); }
.rp-glyph {
  width: 27px; height: 27px; border-radius: 9px;
  display: grid; place-items: center;
  background: rgba(255, 255, 255, 0.14); color: #fff;
}
.rp-action b { font-size: 12px; font-weight: 600; line-height: 1.2; }
.rp-action small { font-size: 12px; line-height: 1.2; color: rgba(255, 255, 255, 0.6); }

/* ==================================================================
 * AI Mori 卡：照归档 `#home` 的 `.dev-card` 重放
 * 归档数值：白底 · 圆角 16px · 阴影 `0 2px 12px rgba(0,0,0,.08)` ·
 *   `.dev-main` padding 16px · `.icon` 52×52 / 圆角 14px / 紫渐变 `135deg #6C5CE7→#A29BFE` ·
 *   `.dev-name` 16px/700 · 右侧电量 14px/700 `#00B894` ·
 *   `.dev-actions` 上边 1px `#E9ECEF` · `.dev-act` 等宽 13px `#636E72` ·
 *   录制态 `.active-rec` → `#E17055` + 700 + 8px 脉冲圆点（`@keyframes pulse` 1s）
 * ================================================================== */
/* 风扇卡与 Mori 卡**共用同一套卡框**：padding 0 + 内部分段 + 16px 圆角 + 同一投影。
   两个选择器写在同一条规则里 ⇒ 改一处必然同时改到另一处。 */
.mcard-mori, .mcard-fan {
  padding: 0; border-radius: 16px; overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.mcard-mori .mc-top, .mcard-fan .mc-top { margin-bottom: 0; padding: 14px 14px 0; }
.mm-main { display: flex; align-items: center; padding: 8px 14px 14px; }
.mm-art {
  width: 52px; height: 52px; border-radius: 14px; flex: none; margin-right: 14px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.mm-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.mm-name { font-size: 17px; font-weight: 700; color: #111; }
.mm-model { font-size: 12px; color: #8e8ea3; }
.mm-batt { font-size: 14px; font-weight: 700; color: #00b894; flex: none; }

/* 归档 `.dev-actions`：一条上分隔线 + 三枚等宽按钮，按钮之间竖分隔线 */
.mm-actions { display: flex; border-top: 1px solid #e9ecef; }
.mm-act {
  flex: 1; min-width: 0; padding: 13px 2px;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  font-size: 13px; color: #636e72; cursor: pointer; transition: color 0.15s;
}
.mm-act + .mm-act { border-left: 1px solid #e9ecef; }
.mm-act:active { background: #f5f5f5; }
.mm-act b { font-weight: 500; white-space: nowrap; }
/* 归档 `.dev-act.active-rec`：录制态转红加重，并跟一颗 8px 脉冲圆点 */
.mm-act.active-rec { color: #e17055; }
.mm-act.active-rec b { font-weight: 700; }
.mm-rec-dot { width: 8px; height: 8px; border-radius: 50%; background: #e17055; animation: mm-rec-pulse 1s infinite; }
@keyframes mm-rec-pulse { 50% { opacity: 0.3; } }


/* ================= 其他设备卡：照归档 `ai-mate-recording-powerbank-demo.html` 的
   `.device-wall` / `.other-device-card` 重放 =================
   结构 / 色彩 / 圆角 / 投影 / 间距 / 图形几何 **逐值照抄归档**；
   字号 **刻意不照抄**：归档是 8~15px，本仓排版阶梯下限 12px ⇒ 整体抬到 >=12px
   （卡片名对齐本仓其它首页卡的 17px/600，型号 13px，元信息 12px）。
   ⚠️ `.online` 必须作用域到 `.other-device-card`：本仓风扇卡的 `.dc-sub-text.online`
   与详情页 `.product-status.online` 都是 **裸 `online` 类**，写全局 `.online` 会把它们变成药丸。 */
.device-wall { margin-top: 19px; }
.device-wall > .section-head { margin-top: 0; margin-bottom: 10px; }
.device-stack { display: flex; flex-direction: column; gap: 11px; margin-top: 16px; }

.other-device-card {
  width: 100%; min-height: 128px; border: 1px solid #ece9f2; border-radius: 21px;
  background: #fff; padding: 16px 17px; display: flex; align-items: center; gap: 15px;
  text-align: left; position: relative; overflow: hidden;
  box-shadow: 0 7px 18px rgba(34, 29, 67, 0.045);
}
/* 右上角 115px 圆装饰（归档卡片的标志性元素，离线态转灰） */
.other-device-card:after {
  content: ''; position: absolute; width: 115px; height: 115px; border-radius: 50%;
  right: -35px; top: -39px; background: #f1eeff;
}
.other-device-card.offline:after { background: #f0f0f3; }
.other-device-card:hover { border-color: #d8d1fa; }
.other-device-card:active { transform: scale(0.985); }

.large-visual {
  width: 91px; height: 91px; border-radius: 20px; flex: none;
  background: linear-gradient(145deg, #f0edff, #e2dcff);
  display: grid; place-items: center; position: relative; z-index: 1;
}
.other-device-card.offline .large-visual { background: #f1f1f4; }

.large-device-copy { flex: 1; position: relative; z-index: 1; min-width: 0; }
.large-device-copy h3 { font-size: 17px; font-weight: 600; color: #171526; line-height: 1.25; margin: 10px 0 3px; }
.large-device-copy p { font-size: 13px; color: #7c788c; margin: 0; }
.large-device-copy small { display: block; font-size: 12px; color: #7c788c; margin-top: 9px; }

/* 在线药丸：归档 8~9px ⇒ 12px */
.other-device-card .online {
  display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700;
  padding: 5px 8px; border-radius: 10px; color: #23aa71; background: #eaf8f2;
}
.other-device-card .online i {
  width: 5px; height: 5px; background: #69e4a6; border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(105, 228, 166, 0.13);
}
/* 离线 pill：归档 7~8px ⇒ 12px；radius 由 7px 匀到 10px，与在线药丸同形 */
.status-pill.pending {
  font-style: normal; font-size: 12px; font-weight: 600; white-space: nowrap;
  padding: 4px 9px; border-radius: 10px; color: #837d8d; background: #f0eff3;
}
/* 行尾箭头：归档用字符 `›`，且 `z-index:auto` ⇒ 实测被那枚 115px 圆装饰整块盖住（归档里其实看不见）。
   本仓换成标准控件 LIcon 并抬到装饰圆之上，让箭头永远可见。 */
.row-chevron { position: relative; z-index: 2; color: #b4afba; }

/* 「添加新设备」：虚线卡 + 居中 `＋` */
.add-device-card { min-height: 88px; border-style: dashed; justify-content: center; text-align: center; }
.add-device-card:after { display: none; }
.add-device-card .large-device-copy { flex: none; }
.add-device-card .large-device-copy h3 { margin: 0 0 4px; }
.add-orb {
  width: 38px; height: 38px; border-radius: 13px; flex: none; display: grid; place-items: center;
  background: #f2efff; color: #6748ee; font-size: 20px;
}
.add-device-card .add-orb { margin: 0; }

/* ---- CSS 手绘设备图形（逐值照抄归档）----
   ⚠️ `.watch-shape` 自身没写 `position`，靠 `transform` 才同时成为伪元素的
   包含块 + 层叠上下文 ⇒ `z-index:-1` 是**局部**的、表带可见（已开归档截图确认）。
   别顺手给它加 `position: relative` 或把 z-index 改成 0 —— 表带会跑到表盘前面。 */
.watch-shape {
  width: 31px; height: 38px; border: 5px solid #24232a; border-radius: 10px;
  background: linear-gradient(145deg, #7660e4, #332881);
  box-shadow: 0 5px 10px rgba(32, 27, 58, 0.2); transform: scale(1.45);
}
.watch-shape:before, .watch-shape:after {
  content: ''; position: absolute; left: 50%; transform: translateX(-50%);
  width: 16px; height: 15px; background: #37363d; z-index: -1;
}
.watch-shape:before { top: -8px; border-radius: 5px 5px 0 0; }
.watch-shape:after { bottom: -8px; border-radius: 0 0 5px 5px; }

.buds-shape {
  position: relative; width: 49px; height: 34px; border-radius: 17px 17px 13px 13px;
  background: linear-gradient(145deg, #fefefe, #d7d8de);
  box-shadow: inset 0 0 0 1px #c9cad1, 0 6px 10px rgba(30, 28, 46, 0.12);
  transform: scale(1.35);
}
.buds-shape:before, .buds-shape:after {
  content: ''; position: absolute; width: 9px; height: 20px; border-radius: 7px;
  background: #fff; border: 1px solid #d7d7dd; top: -5px;
}
.buds-shape:before { left: 9px; transform: rotate(-12deg); }
.buds-shape:after { right: 9px; transform: rotate(12deg); }

.glasses-shape {
  position: relative; width: 62px; height: 22px; border-top: 5px solid #29282f;
  transform: scale(1.15);
}
.glasses-shape:before, .glasses-shape:after {
  content: ''; position: absolute; top: -2px; width: 23px; height: 17px;
  border: 4px solid #29282f; border-radius: 7px;
}
.glasses-shape:before { left: 1px; }
.glasses-shape:after { right: 1px; }

/* 首页那条留白的同构物：同样不填色，标题直接坐在应用底色上（对齐设置页的大标题） */
.mine-head { padding: calc(var(--safe-top, 44px) + 14px) 18px 10px; }
.mine-title { font-size: 22px; font-weight: 700; color: #111; }
.mine-scroll { flex: 1; overflow-y: auto; padding: 16px; -webkit-mask-image: var(--tabbar-fade); mask-image: var(--tabbar-fade); }
.mine-hero {
  display: flex; align-items: center; gap: 14px; background: #fff;
  border-radius: 18px; padding: 18px; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); margin-bottom: 14px;
}
.mh-avatar {
  width: 54px; height: 54px; border-radius: 50%; background: #7b5cff; color: #fff;
  display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex: none;
}
.mh-name { font-size: 18px; font-weight: 700; color: #111; }
.mh-role { font-size: 12px; color: #8e8ea3; margin-top: 3px; }
.mh-plan {
  display: inline-block; font-size: 10.5px; font-weight: 600; color: #7b5cff;
  background: #f0ecff; border-radius: 999px; padding: 3px 9px; margin-top: 6px;
}
.mine-card { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); }
.mrow {
  display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
  background: transparent; border: none; padding: 15px 16px; border-top: 1px solid #f4f4f7;
}
.mrow:first-child { border-top: none; }
.mr-icon { color: #7b5cff; display: flex; }
.mr-label { flex: 1; font-size: 15px; color: #111; }
.mr-value { font-size: 13px; color: #9a9aa5; }
</style>
