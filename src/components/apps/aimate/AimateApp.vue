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
import LIcon from '../../ui/LIcon.vue'
import FloatingTabBar from '../../ui/FloatingTabBar.vue'
import PrinterFlow from './PrinterFlow.vue'
import RecorderFlow from './RecorderFlow.vue'
import MoriFlow from './MoriFlow.vue'

const i18n = useI18nStore()
const mate = useAiMateStore()
const am = (p) => i18n.am(p)
/** `{name}` 这类占位符统一在调用点替换（本仓 i18n 没有插值机制） */
const fill = (s, o) => String(s ?? '').replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''))

const typeOf = (id) => DEVICE_TYPES.find((t) => t.id === id) || null
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
const speedFill = computed(() => `${(fanSpeed.value / FAN_SPEED_MAX) * 100}%`)

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
watch(() => mate.notice, (n) => { if (n) later(() => mate.clearNotice(), 2400) })

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
        <div class="home-head">
          <div class="hh-left">
            <span class="hh-eyebrow">{{ am('appName') }}</span>
            <div class="hh-title">{{ am('home.greeting') }}</div>
            <div class="hh-sub">{{ am('home.greetingSub') }}</div>
          </div>
          <button class="hh-avatar" data-go-mine @click="mate.setTab('mine')">LK</button>
        </div>

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
            :class="{ offline: !d.online }"
            :data-device-card="d.id"
            @click="mate.openDevice(d.id)"
          >
            <div class="mc-top">
              <span class="mc-status" :class="d.online ? 'on' : 'off'">
                <i class="mc-dot" />{{ d.online ? am('status.online') : am('status.offline') }}
              </span>
              <span class="mc-more" :data-device-more="d.id" @click.stop="mate.openInfoOf(d.id)">
                <LIcon name="moreHorizontal" :size="18" />
              </span>
            </div>

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

            <!-- 风扇：归档首页卡内联的开关 + 档位（两件事都不该逼用户跳页） -->
            <div v-if="d.type === 'fan'" class="mc-fan" @click.stop>
              <div class="mf-info">
                <span class="mf-label">{{ am('control.speedTitle') }}</span>
                <span class="mf-value" :data-gear-value="d.id">
                  {{ fill(am('control.speedValue'), { n: d.speed, max: FAN_SPEED_MAX }) }}
                </span>
              </div>
              <button
                class="mf-switch"
                :class="{ on: d.power, pending: mate.pending[d.id], disabled: switchDisabled(d) }"
                :data-device-switch="d.id"
                :disabled="switchDisabled(d) || !!mate.pending[d.id]"
                @click="mate.toggleFanPower(d.id)"
              >
                <span class="mf-knob" />
              </button>
            </div>

            <!-- 其余三台：一行「点进去会发生什么」（动作名 + 该设备的语境） -->
            <div v-else class="mc-enter" :data-device-enter="d.id">
              <LIcon :name="cardAction(d).icon" :size="16" />
              <span class="mce-label">{{ am(cardAction(d).label) }}</span>
              <small v-if="cardAction(d).sub" class="mce-sub">{{ am(cardAction(d).sub) }}</small>
              <LIcon name="chevronRight" :size="16" />
            </div>
          </button>

          <!-- 其他设备（两份 Demo 的「其他设备」并集） -->
          <div class="section-head">
            <div class="sh-copy">
              <h2 class="sh-title">{{ am('home.otherDevices') }}</h2>
              <p class="sh-sub">{{ am('home.otherSub') }}</p>
            </div>
          </div>

          <button
            v-for="o in OTHER_DEVICES"
            :key="o.id"
            class="orow"
            :class="{ offline: !o.online }"
            :data-other="o.id"
            @click="mate.notifyOther(o.id)"
          >
            <span class="or-art" :style="{ background: typeOf(o.type)?.bg, color: typeOf(o.type)?.color }">
              <LIcon :name="typeOf(o.type)?.icon || 'circle'" :size="22" />
            </span>
            <span class="or-copy">
              <span class="or-status" :class="o.online ? 'on' : 'off'">
                {{ o.online ? am('status.online') : am('other.notConnected') }}
              </span>
              <b class="or-name">{{ am(o.nameKey) }}</b>
              <small class="or-meta">{{ am(o.modelKey) }} · {{ am(o.metaKey) }}</small>
            </span>
            <span class="or-tail">{{ o.online ? '›' : am('other.connect') }}</span>
          </button>

          <button class="orow add-row" data-add-new @click="mate.openAdd()">
            <span class="or-art add-art"><LIcon name="plus" :size="22" /></span>
            <span class="or-copy">
              <b class="or-name">{{ am('home.addNew') }}</b>
              <small class="or-meta">{{ am('home.addNewSub') }}</small>
            </span>
          </button>

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
          <div class="control-card">
            <div class="card-title">{{ am('control.speedTitle') }}</div>
            <div class="speed-slider">
              <div class="speed-track"><div class="speed-fill" :style="{ width: speedFill }" /></div>
              <div class="speed-steps">
                <button
                  v-for="n in FAN_SPEED_MAX"
                  :key="n"
                  class="speed-dot"
                  :class="{ active: n <= fanSpeed }"
                  :data-speed-dot="n"
                  @click="mate.setFanSpeed(dev.id, n)"
                />
              </div>
            </div>
            <div class="speed-label" data-speed-label>
              {{ fill(am('control.speedValue'), { n: fanSpeed, max: FAN_SPEED_MAX }) }}
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
  background: #f2f2f7;
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
.guide-page { background: #f2f2f7; }
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
.search-page { background: #f2f2f7; }
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
.center-page { align-items: center; justify-content: center; background: #f2f2f7; padding-bottom: 80px; }
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
.speed-slider { position: relative; padding: 8px 0; }
.speed-track { height: 6px; background: #dcdce4; border-radius: 3px; overflow: hidden; }
.speed-fill {
  height: 100%; background: linear-gradient(90deg, #7b5cff, #9b82ff);
  border-radius: 3px; transition: width 0.2s;
}
.speed-steps { display: flex; justify-content: space-between; margin-top: -9px; padding: 0 1px; }
.speed-dot {
  width: 16px; height: 16px; border-radius: 50%; background: #dcdce4;
  border: 2px solid #fff; padding: 0;
}
.speed-dot.active { background: #7b5cff; }
.speed-label { text-align: center; font-size: 13px; color: #666; margin-top: 10px; }
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
.device-info-page { background: #f2f2f7; }
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
.home-head {
  padding: calc(var(--safe-top, 44px) + 10px) 18px 12px;
  background: #fff;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
}
.hh-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: #7b5cff; }
.hh-title { font-size: 22px; font-weight: 700; color: #111; margin-top: 4px; }
.hh-sub { font-size: 12px; color: #8e8ea3; margin-top: 3px; }
.hh-avatar {
  width: 38px; height: 38px; border-radius: 50%; border: none; flex: none;
  background: #7b5cff; color: #fff; font-size: 12px; font-weight: 700;
}
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
.mc-status { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; }
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
.mc-fan {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  margin-top: 12px; padding-top: 11px; border-top: 1px solid #f2f2f7;
}
.mf-info { display: flex; flex-direction: column; gap: 2px; }
.mf-label { font-size: 12px; color: #111; font-weight: 500; }
.mf-value { font-size: 11px; color: #8e8ea3; }
.mf-switch {
  width: 48px; height: 28px; border-radius: 14px; background: #e5e5ea;
  border: none; padding: 0; position: relative; flex: none; transition: background 0.25s;
}
.mf-switch.on { background: #34c759; }
.mf-switch.pending { opacity: 0.7; }
.mf-switch.disabled { opacity: 0.4; background: #e5e5ea !important; }
.mf-knob {
  position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; border-radius: 50%;
  background: #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); transition: transform 0.25s;
}
.mf-switch.on .mf-knob { transform: translateX(20px); }
.mc-enter {
  display: flex; align-items: center; gap: 6px; margin-top: 12px; padding-top: 11px;
  border-top: 1px solid #f2f2f7; color: #7b5cff; font-size: 13px; font-weight: 600;
}
.mc-enter .mce-label { flex: 1; }
.mc-enter .mce-sub { font-size: 11px; font-weight: 500; color: #9a9aa5; flex: none; }

.orow {
  display: flex; align-items: center; gap: 12px; width: 100%; text-align: left;
  background: #fff; border: none; border-radius: 16px; padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05); margin-bottom: 10px;
}
.orow:active { transform: scale(0.985); }
.orow.offline { opacity: 0.9; }
.or-art { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex: none; }
.add-art { background: #f0ecff; color: #7b5cff; }
.or-copy { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.or-status { font-size: 10.5px; font-weight: 600; margin-bottom: 2px; }
.or-status.on { color: #34c759; }
.or-status.off { color: #9a9aa5; }
.or-name { font-size: 15px; font-weight: 600; color: #111; }
.or-meta { font-size: 11.5px; color: #8e8ea3; margin-top: 2px; }
.or-tail { font-size: 12px; color: #7b5cff; font-weight: 600; flex: none; }

.mine-head { padding: calc(var(--safe-top, 44px) + 14px) 18px 10px; background: #fff; }
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
