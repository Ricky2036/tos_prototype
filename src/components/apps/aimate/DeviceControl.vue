<script setup>
/**
 * AI Mate · 设备控制页
 * 按设备类别渲染对应控制面板：风扇（归档实测项全量）/ 录音充电宝 / 其余简单设备。
 * 所有动作都走 store，组件不自己持有设备状态。
 */
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18nStore } from '../../../stores/i18nStore'
import {
  useAiMateStore, FAN_MODES, FAN_SWING_ANGLES, FAN_TIMER_STEPS, FAN_SPEED_MIN, FAN_SPEED_MAX,
  PICKUP_MODES, RECORDER_TABS, LISTEN_LANGS, FAN_SMART_MODE_INDEX
} from '../../../stores/aiMateStore'
import LIcon from '../../ui/LIcon.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

const props = defineProps({
  device: { type: Object, default: null }
})
const emit = defineEmits(['toast'])

const i18n = useI18nStore()
const mate = useAiMateStore()
const am = (p) => i18n.am(p)

const id = computed(() => props.device?.id || null)
const type = computed(() => props.device?.type || null)
const typeMeta = computed(() => mate.typeOf(type.value))
const typeLabel = computed(() => am(`type.${type.value}`))

/* 风扇 6 档模式各自的图标（与档位语义对应） */
const MODE_ICONS = ['wind', 'gauge', 'leaf', 'moonStar', 'baby', 'sparkles']

const fmtSeconds = (t) => {
  const m = String(Math.floor(t / 60)).padStart(2, '0')
  const s = String(t % 60).padStart(2, '0')
  return `${m}:${s}`
}
const fmtTimer = (sec) => (sec ? `${Math.ceil(sec / 3600)} ${am('fan.hour')}` : am('fan.notSet'))

/* ---------------- 昵称编辑 ---------------- */
const editingNick = ref(false)
const nickDraft = ref('')
function beginEditNick() {
  nickDraft.value = props.device?.nick || ''
  editingNick.value = true
}
function commitNick() {
  mate.setNick(id.value, nickDraft.value)
  editingNick.value = false
}

/* ---------------- 拾音模式弹层 ---------------- */
const pickupOpen = ref(false)

/* ---------------- 录音 Tab ---------------- */
const recorderTab = ref('markers')
const listenFrom = ref('en')
const listenTo = ref('zh')

/* ---------------- 风扇风速滑杆 ---------------- */
const speedPct = computed(() => {
  const d = props.device
  if (!d) return 0
  return ((d.speed - FAN_SPEED_MIN) / (FAN_SPEED_MAX - FAN_SPEED_MIN)) * 100
})

/* ---------------- 录音计时器 ---------------- */
let ticker = null
onMounted(() => {
  if (mate.recording) ticker = setInterval(() => mate.tickRecording(), 1000)
})
onBeforeUnmount(() => clearInterval(ticker))

function toggleRecord() {
  const on = mate.toggleRecording()
  clearInterval(ticker)
  if (on) ticker = setInterval(() => mate.tickRecording(), 1000)
}

/* ---------------- 简单设备的状态提示 ---------------- */
const simplePowerKey = computed(() => (props.device?.power ? 'fan.on' : 'fan.off'))

function onRemove() {
  const name = mate.displayName(device.value?.id)
  if (!mate.removeDevice(device.value?.id)) return
  emit('toast', `${am('device.removed')}${name}`)
}
</script>

<template>
  <main v-if="device" class="am-scroll">
    <!-- ======== 设备名片 ======== -->
    <div class="am-hero">
      <span class="am-hero-icon" :style="{ background: typeMeta?.bg, color: typeMeta?.color }">
        <LIcon :name="typeMeta?.icon" :size="26" />
      </span>
      <div class="am-hero-main">
        <button class="am-hero-name" @click="beginEditNick">
          {{ mate.displayName(device.id) }}
          <LIcon name="pencilLine" :size="13" class="am-hero-pen" />
        </button>
        <span class="am-hero-sub">
          <i class="am-status-dot" :class="{ off: !device.online }" />
          {{ device.online ? am('status.online') : am('status.offline') }} · {{ device.subtitle }}
        </span>
      </div>
    </div>

    <!-- 昵称编辑 -->
    <div v-if="editingNick" class="am-nick-row">
      <input
        v-model="nickDraft"
        class="am-nick-input"
        :placeholder="am('fan.nicknamePlaceholder')"
        maxlength="24"
        @keyup.enter="commitNick"
      />
      <button class="am-nick-ok" @click="commitNick">{{ am('scan.done') }}</button>
    </div>

    <!-- ======== 风扇 ======== -->
    <template v-if="type === 'fan'">
      <!-- 电源 + 室温 -->
      <div class="am-card am-row">
        <span class="am-row-label">{{ am('fan.power') }}</span>
        <div class="am-row-right">
          <span v-if="device.mode === FAN_SMART_MODE_INDEX" class="am-temp">
            {{ am('fan.roomTemp') }} {{ device.temp }}°C
          </span>
          <ToggleSwitch
            :model-value="device.power"
            :disabled="!!mate.pending[device.id]"
            @update:model-value="mate.toggleFanPower(device.id)"
          />
        </div>
      </div>

      <!-- 6 档模式 -->
      <h2 class="am-title">{{ am('fan.mode') }}</h2>
      <div class="am-modes">
        <button
          v-for="(m, i) in FAN_MODES"
          :key="m"
          class="am-mode"
          :class="{ on: device.mode === i, dim: !!device.childLock }"
          @click="mate.setFanMode(device.id, i)"
        >
          <LIcon :name="MODE_ICONS[i]" :size="19" />
          <span>{{ am('fan.modes')[i] }}</span>
        </button>
      </div>

      <!-- 风速 -->
      <h2 class="am-title">
        {{ am('fan.speed') }}
        <b class="am-title-val">{{ device.speed }}</b>
      </h2>
      <div class="am-card am-slider-card" :style="{ '--am-fill': speedPct + '%' }">
        <input
          class="am-slider"
          type="range"
          :min="FAN_SPEED_MIN"
          :max="FAN_SPEED_MAX"
          step="1"
          :value="device.speed"
          :disabled="!!device.childLock"
          @input="mate.setFanSpeed(device.id, $event.target.value)"
        />
        <div class="am-slider-ticks">
          <span v-for="n in [1, 4, 7, 10, 12]" :key="n">{{ n }}</span>
        </div>
      </div>

      <!-- 摇头 -->
      <div class="am-card am-row">
        <span class="am-row-label">
          <LIcon name="rotateCw" :size="16" />
          {{ am('fan.swing') }}
        </span>
        <ToggleSwitch
          :model-value="device.swing"
          :disabled="!!device.childLock"
          @update:model-value="mate.toggleSwing(device.id)"
        />
      </div>
      <div class="am-chips">
        <button
          v-for="a in FAN_SWING_ANGLES"
          :key="a"
          class="am-chip"
          :class="{ on: device.swing && device.swingAngle === a }"
          @click="mate.setSwingAngle(device.id, a)"
        >
          {{ a }}°
        </button>
      </div>

      <!-- 等离子 / 童锁 -->
      <div class="am-card">
        <div class="am-row">
          <span class="am-row-label"><LIcon name="atom" :size="16" />{{ am('fan.plasma') }}</span>
          <ToggleSwitch
            :model-value="device.plasma"
            :disabled="!!device.childLock"
            @update:model-value="mate.togglePlasma(device.id)"
          />
        </div>
        <div class="am-row">
          <span class="am-row-label"><LIcon name="shieldCheck" :size="16" />{{ am('fan.childLock') }}</span>
          <ToggleSwitch
            :model-value="device.childLock"
            @update:model-value="mate.toggleChildLock(device.id)"
          />
        </div>
      </div>

      <!-- 定时关机 / 预约开机 -->
      <div class="am-card">
        <div class="am-row am-row-inline">
          <span class="am-row-label">
            <LIcon name="timer" :size="16" />
            {{ am('fan.timerOff') }}
            <b class="am-row-val">{{ fmtTimer(device.timerOff) }}</b>
          </span>
        </div>
        <div class="am-chips">
          <button
            v-for="s in FAN_TIMER_STEPS"
            :key="'off' + s"
            class="am-chip"
            :class="{ on: device.timerOff === s }"
            @click="mate.setFanTimer(device.id, 'off', s)"
          >
            {{ s === 0 ? am('scan.done') : (s / 3600) + am('fan.hour') }}
          </button>
        </div>
        <div class="am-row am-row-inline">
          <span class="am-row-label">
            <LIcon name="calendarClock" :size="16" />
            {{ am('fan.timerOn') }}
            <b class="am-row-val">{{ fmtTimer(device.timerOn) }}</b>
          </span>
        </div>
        <div class="am-chips">
          <button
            v-for="s in FAN_TIMER_STEPS"
            :key="'on' + s"
            class="am-chip"
            :class="{ on: device.timerOn === s }"
            @click="mate.setFanTimer(device.id, 'on', s)"
          >
            {{ s === 0 ? am('scan.done') : (s / 3600) + am('fan.hour') }}
          </button>
        </div>
      </div>
    </template>

    <!-- ======== 录音充电宝 ======== -->
    <template v-else-if="type === 'recorder'">
      <div class="am-card am-rec">
        <button class="am-rec-btn" :class="{ on: mate.recording }" @click="toggleRecord">
          <LIcon :name="mate.recording ? 'square' : 'micVocal'" :size="26" />
        </button>
        <div class="am-rec-time">{{ fmtSeconds(mate.recordSeconds) }}</div>
        <div class="am-rec-label">{{ mate.recording ? am('recorder.recording') : am('recorder.record') }}</div>
      </div>

      <div class="am-card am-row">
        <span class="am-row-label"><LIcon name="audioLines" :size="16" />{{ am('recorder.pickup') }}</span>
        <button class="am-row-value" @click="pickupOpen = !pickupOpen">
          {{ am(`recorder.pickupModes.${mate.pickupMode}`) }}
          <LIcon name="chevronDown" :size="15" />
        </button>
      </div>
      <transition name="am-fold">
        <div v-if="pickupOpen" class="am-card am-fold">
          <button
            v-for="m in PICKUP_MODES"
            :key="m"
            class="am-fold-item"
            :class="{ on: mate.pickupMode === m }"
            @click="mate.setPickupMode(m); pickupOpen = false"
          >
            <span class="am-fold-main">
              <b>{{ am(`recorder.pickupModes.${m}`) }}</b>
              <small>{{ am(`recorder.pickupDesc.${m}`) }}</small>
            </span>
            <LIcon v-if="mate.pickupMode === m" name="check" :size="16" class="am-fold-check" />
          </button>
        </div>
      </transition>

      <div class="am-card am-row">
        <span class="am-row-label">
          <LIcon name="batteryCharging" :size="16" />
          {{ am('recorder.reverseCharge') }}
          <b class="am-row-val">{{ am('recorder.reverseChargeSub') }}</b>
        </span>
        <ToggleSwitch :model-value="mate.chargerOn" @update:model-value="mate.toggleCharger()" />
      </div>

      <!-- 详情 Tab：音频标记 / 转写 / AI 纪要 -->
      <div class="am-tabs">
        <button
          v-for="t in RECORDER_TABS"
          :key="t"
          class="am-tab"
          :class="{ on: recorderTab === t }"
          @click="recorderTab = t"
        >
          {{ am(`recorder.${t}`) }}
        </button>
      </div>

      <div v-if="recorderTab === 'markers'" class="am-card am-pane">
        <p v-for="(mk, i) in mate.markers" :key="i" class="am-marker">
          <b>{{ mk.at }}</b>{{ mk.text }}
        </p>
        <button class="am-pane-btn" @click="emit('toast', am('recorder.markerDone'))">
          + {{ am('recorder.addMarker') }}
        </button>
      </div>

      <div v-else-if="recorderTab === 'transcript'" class="am-card am-pane">
        <div class="am-listen">
          <span class="am-row-label"><LIcon name="languages" :size="16" />{{ am('recorder.listen') }}</span>
          <div class="am-listen-sel">
            <select v-model="listenFrom" class="am-select">
              <option v-for="l in LISTEN_LANGS" :key="'f' + l" :value="l">{{ l.toUpperCase() }}</option>
            </select>
            <LIcon name="chevronsRight" :size="15" class="am-listen-arrow" />
            <select v-model="listenTo" class="am-select">
              <option v-for="l in LISTEN_LANGS" :key="'t' + l" :value="l">{{ l.toUpperCase() }}</option>
            </select>
          </div>
        </div>
        <div class="am-caption">
          <p class="am-caption-line">
            <b>{{ listenFrom.toUpperCase() }}</b>
            <span>Q3 聚焦提升转写准确率与自动纪要体验。</span>
          </p>
          <p class="am-caption-line sub">
            <b>{{ listenTo.toUpperCase() }}</b>
            <span>Q3 focuses on transcription accuracy and automatic notes.</span>
          </p>
        </div>
        <div class="am-badge-row">
          <span class="am-mini"><LIcon name="captions" :size="13" />{{ am('recorder.dualSubtitle') }}</span>
          <span class="am-mini"><LIcon name="users" :size="13" />{{ am('recorder.faceToFace') }}</span>
        </div>
      </div>

      <div v-else class="am-card am-pane">
        <h3 class="am-pane-title">{{ am('recorder.summaryTitle') }}</h3>
        <p class="am-pane-text">Q3 聚焦提升转写准确率与完善自动纪要体验，新版本计划于 9 月上旬发布。</p>
        <h3 class="am-pane-title">{{ am('recorder.todos') }}</h3>
        <p class="am-pane-text">周宁：下周三前完成会议拾音参数测试。</p>
      </div>
    </template>

    <!-- ======== 其余简单设备 ======== -->
    <template v-else>
      <div class="am-card am-row">
        <span class="am-row-label"><LIcon name="power" :size="16" />{{ am('fan.power') }}</span>
        <ToggleSwitch
          :model-value="!!device.power"
          @update:model-value="mate.togglePower(device.id)"
        />
        <span class="am-visually-hidden">{{ am(simplePowerKey) }}</span>
      </div>
      <button
        v-if="device.type === 'printer'"
        class="am-open-print"
        data-open-print
        @click="mate.openPrint('gallery')"
      >
        <LIcon name="printer" :size="16" />
        {{ am('printer.title') }}
      </button>
      <p class="am-hint">{{ am('device.detail') }} · {{ typeLabel }}</p>
    </template>

    <!-- ======== 设备信息 ======== -->
    <h2 class="am-title">{{ am('device.detail') }}</h2>
    <div class="am-card am-info">
      <div class="am-info-row">
        <span>{{ am('device.model') }}</span><b>{{ device.model }}</b>
      </div>
      <div class="am-info-row">
        <span>{{ am('device.macAddr') }}</span><b>{{ device.mac }}</b>
      </div>
      <div class="am-info-row">
        <span>{{ am('device.firmware') }}</span><b>v{{ device.firmware }}</b>
      </div>
      <div class="am-info-row">
        <span>{{ am('device.signal') }}</span>
        <b>{{ device.online ? '−52 dBm' : '—' }}</b>
      </div>
    </div>

    <button
      v-if="mate.hasUpgrade(device.id)"
      class="am-upgrade"
      :disabled="mate.isPending(device.id)"
      @click="mate.upgradeFirmware(device.id)"
    >
      <LIcon
        :name="mate.isPending(device.id) ? 'loaderCircle' : 'download'"
        :size="16"
        :class="{ 'am-spin': mate.isPending(device.id) }"
      />
      {{ mate.isPending(device.id) ? am('device.upgrading') : am('device.upgrade') }}
    </button>

    <button class="am-danger" @click="onRemove">
      <LIcon name="trash2" :size="16" />
      {{ am('device.remove') }}
    </button>
  </main>

  <main v-else class="am-scroll">
    <p class="am-hint">{{ am('home.empty') }}</p>
  </main>
</template>

<style scoped>
.am-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 14px 16px calc(var(--safe-bottom) + 28px);
}

/* ---------- 设备名片 ---------- */
.am-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 2px 14px;
}
.am-hero-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}
.am-hero-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.am-hero-name {
  border: none;
  background: transparent;
  padding: 0;
  font-size: 17px;
  font-weight: 650;
  color: #1C1C1E;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  text-align: left;
}
.am-hero-pen { color: #A1A1A6; }
.am-hero-sub {
  font-size: 11.5px;
  color: #8E8E93;
  display: flex;
  align-items: center;
  gap: 5px;
}
.am-status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #34C759;
  flex: none;
}
.am-status-dot.off { background: #C7C7CC; }

.am-nick-row { display: flex; gap: 8px; margin-bottom: 12px; }
.am-nick-input {
  flex: 1;
  height: 38px;
  border-radius: 11px;
  border: 1px solid rgba(60, 60, 67, 0.16);
  background: #fff;
  padding: 0 12px;
  font-size: 14px;
  color: #1C1C1E;
  font-family: var(--font-stack);
}
.am-nick-ok {
  border: none;
  border-radius: 11px;
  background: #7C5CFF;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  padding: 0 16px;
  cursor: pointer;
}

/* ---------- 通用标题 ---------- */
.am-title {
  margin: 20px 0 9px 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: #8E8E93;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
}
.am-title-val {
  margin-left: auto;
  color: #1C1C1E;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

/* ---------- 卡片 ---------- */
.am-card {
  background: #fff;
  border-radius: 16px;
  padding: 0 14px;
  margin-bottom: 10px;
}
.am-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 50px;
}
.am-row + .am-row { border-top: 0.5px solid rgba(60, 60, 67, 0.1); }
.am-row-inline { min-height: 42px; }
.am-row-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  color: #1C1C1E;
}
.am-row-label :deep(svg) { color: #8E8E93; }
.am-row-val {
  font-size: 12px;
  color: #8E8E93;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.am-row-right { display: flex; align-items: center; gap: 10px; }
.am-temp {
  font-size: 12.5px;
  color: #8E8E93;
  font-variant-numeric: tabular-nums;
}
.am-row-value {
  border: none;
  background: transparent;
  font-size: 13px;
  color: #7C5CFF;
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  padding: 4px 0;
}

/* ---------- 6 档模式 ---------- */
.am-modes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.am-mode {
  border: 1px solid rgba(60, 60, 67, 0.1);
  border-radius: 14px;
  background: #fff;
  padding: 11px 6px 9px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #6C6C70;
  font-size: 11px;
  transition: all 0.16s ease;
}
.am-mode :deep(svg) { color: #8E8E93; transition: color 0.16s ease; }
.am-mode.on {
  border-color: #7C5CFF;
  background: rgba(124, 92, 255, 0.08);
  color: #5B34E8;
  box-shadow: 0 4px 12px rgba(124, 92, 255, 0.16);
}
.am-mode.on :deep(svg) { color: #7C5CFF; }
.am-mode.dim { opacity: 0.45; }

/* ---------- 风速滑杆 ---------- */
.am-slider-card { padding: 14px 14px 8px; }
.am-slider {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    #7C5CFF 0%,
    #7C5CFF var(--am-fill, 20%),
    #E5E5EA var(--am-fill, 20%),
    #E5E5EA 100%
  );
  outline: none;
}
.am-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
  cursor: pointer;
}
.am-slider:disabled { opacity: 0.45; }
.am-slider-ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 10px;
  color: #A1A1A6;
  font-variant-numeric: tabular-nums;
}

/* ---------- 筹码 ---------- */
.am-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 0 0 10px;
}
.am-chip {
  border: 1px solid rgba(60, 60, 67, 0.14);
  background: #fff;
  border-radius: 10px;
  padding: 7px 13px;
  font-size: 12.5px;
  color: #3A3A3C;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  transition: all 0.15s ease;
}
.am-chip.on {
  border-color: #7C5CFF;
  background: rgba(124, 92, 255, 0.1);
  color: #5B34E8;
  font-weight: 600;
}

/* ---------- 录音 ---------- */
.am-rec {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px 14px 18px;
}
.am-rec-btn {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  border: none;
  background: #7C5CFF;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(124, 92, 255, 0.34);
  transition: transform 0.15s ease, background 0.2s ease;
}
.am-rec-btn:active { transform: scale(0.94); }
.am-rec-btn.on { background: #FF3B30; box-shadow: 0 8px 22px rgba(255, 59, 48, 0.34); }
.am-rec-time {
  font-size: 26px;
  font-weight: 300;
  letter-spacing: 0.5px;
  font-variant-numeric: tabular-nums;
  color: #1C1C1E;
}
.am-rec-label { font-size: 11.5px; color: #8E8E93; }

/* ---------- 折叠面板 ---------- */
.am-fold { padding: 4px 0; }
.am-fold-item {
  width: 100%;
  border: none;
  background: transparent;
  padding: 11px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-align: left;
  position: relative;
}
.am-fold-item + .am-fold-item::before {
  content: '';
  position: absolute;
  top: 0; left: 14px; right: 0;
  height: 0.5px;
  background: rgba(60, 60, 67, 0.1);
}
.am-fold-main { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.am-fold-main b { font-size: 13.5px; font-weight: 550; color: #1C1C1E; }
.am-fold-main small { font-size: 11px; color: #8E8E93; }
.am-fold-item.on .am-fold-main b { color: #7C5CFF; }
.am-fold-check { color: #7C5CFF; flex: none; }
.am-fold-enter-active, .am-fold-leave-active { transition: opacity 0.18s ease; }
.am-fold-enter-from, .am-fold-leave-to { opacity: 0; }

/* ---------- Tab ---------- */
.am-tabs {
  display: flex;
  gap: 4px;
  background: rgba(120, 120, 128, 0.1);
  border-radius: 11px;
  padding: 3px;
  margin: 18px 0 10px;
}
.am-tab {
  flex: 1;
  border: none;
  background: transparent;
  border-radius: 9px;
  padding: 7px 4px;
  font-size: 12.5px;
  color: #6C6C70;
  cursor: pointer;
  transition: all 0.16s ease;
}
.am-tab.on {
  background: #fff;
  color: #1C1C1E;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}
.am-pane { padding: 14px; }
.am-pane-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 650;
  color: #1C1C1E;
}
.am-pane-title:not(:first-child) { margin-top: 16px; }
.am-pane-text {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: #3A3A3C;
}
.am-pane-btn {
  width: 100%;
  margin-top: 12px;
  border: none;
  border-radius: 11px;
  background: rgba(124, 92, 255, 0.12);
  color: #5B34E8;
  font-size: 13px;
  font-weight: 600;
  padding: 10px;
  cursor: pointer;
}
.am-marker {
  margin: 0 0 10px;
  font-size: 12.5px;
  color: #3A3A3C;
  display: flex;
  gap: 10px;
}
.am-marker b {
  color: #7C5CFF;
  font-variant-numeric: tabular-nums;
  flex: none;
}

/* ---------- 转写 ---------- */
.am-listen {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.1);
}
.am-listen-sel { display: flex; align-items: center; gap: 6px; }
.am-listen-arrow { color: #A1A1A6; }
.am-select {
  border: 1px solid rgba(60, 60, 67, 0.14);
  border-radius: 8px;
  background: #fff;
  font-size: 12px;
  color: #1C1C1E;
  padding: 5px 6px;
  font-family: var(--font-stack);
}
.am-caption { display: flex; flex-direction: column; gap: 9px; }
.am-caption-line { margin: 0; font-size: 12.5px; color: #1C1C1E; line-height: 1.5; }
.am-caption-line b {
  display: block;
  font-size: 10px;
  letter-spacing: 0.4px;
  color: #7C5CFF;
  margin-bottom: 2px;
}
.am-caption-line.sub span { color: #8E8E93; }
.am-badge-row { display: flex; gap: 7px; margin-top: 14px; flex-wrap: wrap; }
.am-mini {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #5B34E8;
  background: rgba(124, 92, 255, 0.1);
  border-radius: 8px;
  padding: 4px 9px;
}

/* ---------- 设备信息 ---------- */
.am-info { padding: 4px 14px; }
.am-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  font-size: 13.5px;
  color: #3A3A3C;
  position: relative;
}
.am-info-row + .am-info-row::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 0.5px;
  background: rgba(60, 60, 67, 0.1);
}
.am-info-row b {
  font-weight: 500;
  color: #8E8E93;
  font-variant-numeric: tabular-nums;
}

/* 口袋打印机详情页的入口按钮 */
.am-open-print {
  width: 100%;
  margin-top: 14px;
  border: none;
  border-radius: 14px;
  background: #7b5cff;
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  padding: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
}

/* 固件升级：与开关同为「按下 → 回执」的异步动作，pending 时转圈 */
.am-upgrade {
  width: 100%;
  margin-top: 16px;
  border: none;
  border-radius: 14px;
  background: #7C5CFF;
  color: #fff;
  font-size: 13.5px;
  font-weight: 600;
  padding: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
}
.am-upgrade:disabled { opacity: 0.6; cursor: default; }
.am-spin { animation: am-rotate 0.9s linear infinite; }
@keyframes am-rotate { to { transform: rotate(360deg); } }

.am-danger {
  width: 100%;
  margin-top: 16px;
  border: none;
  border-radius: 14px;
  background: #fff;
  color: #FF3B30;
  font-size: 13.5px;
  font-weight: 550;
  padding: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}
.am-hint {
  margin: 0;
  padding: 14px 4px;
  font-size: 12.5px;
  color: #A1A1A6;
}
.am-visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
