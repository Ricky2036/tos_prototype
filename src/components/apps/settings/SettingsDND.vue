<script setup>
import { computed, ref } from 'vue'
import '../../../styles/layer-transitions.css'
import { useControlStore } from '../../../stores/controlStore'
import { useFocusSettingsStore } from '../../../stores/focusSettingsStore.js'
import { usePrayerStore } from '../../../stores/prayerStore'
import { useI18nStore } from '../../../stores/i18nStore'
import { SETTINGS_TITLES } from '../../../config/settingsTitles'
import GlassNavBar from '../../ui/GlassNavBar.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import SheetOptionPicker from '../../ui/SheetOptionPicker.vue'
import {
  DND_CALL_OPTIONS, formatDndTime, useDndSettingsStore
} from '../../../stores/dndSettingsStore.js'
import { parseTimeValue, toTimeString } from '../../../utils/timePicker.js'
import TimePickerSheet from '../../ui/TimePickerSheet.vue'
import DndSchedulePage from './dnd/DndSchedulePage.vue'
import DndAppsPage from './dnd/DndAppsPage.vue'
import DndRepeatSheet from './dnd/DndRepeatSheet.vue'


/**
 * 勿扰模式（真机 Infinix X6878 / XOS 17，2026-11-10 取证 /tmp/ref/gI/dnd_*）。
 * 主页结构与真机一致；原版三个带箭头的行全都点不动，这里补齐：
 *   定时开启 → 三级页（含时间滚轮 / 星期多选两个弹层）
 *   来电提醒 → 底部单选弹层（复用 SheetOptionPicker）
 *   应用提醒 → 三级页（应用开关 + 底部悬浮搜索框）
 */
const emit = defineEmits(['back'])
const control = useControlStore()
const focus = useFocusSettingsStore()
const prayerStore = usePrayerStore()
const i18n = useI18nStore()
const dnd = useDndSettingsStore()

/* ---------- 三级页栈与弹层 ---------- */
const subPage = ref(null)
const isBack = ref(false)
const showCallsPicker = ref(false)
const showRepeatSheet = ref(false)
const timeTarget = ref(null) // 'start' | 'end' | null

function openSub(key) {
  isBack.value = false
  subPage.value = key
}
function closeSub() {
  isBack.value = true
  subPage.value = null
}

/** 供 SettingsApp 的 useBackHandler 调用：先逐层消费子页 / 弹层 */
function back() {
  if (timeTarget.value) { timeTarget.value = null; return true }
  if (showRepeatSheet.value) { showRepeatSheet.value = false; return true }
  if (showCallsPicker.value) { showCallsPicker.value = false; return true }
  if (subPage.value) { closeSub(); return true }
  emit('back')
  return true
}
defineExpose({ back })

/* ---------- 主页展示值（随 store 变化） ---------- */
const scheduleLabel = computed(() =>
  `${formatDndTime(dnd.state.startHour, dnd.state.startMinute)} - ${formatDndTime(dnd.state.endHour, dnd.state.endMinute)}`
)
const callsSubtitle = computed(() => dnd.state.allowCalls)
const appsSubtitle = computed(() =>
  dnd.state.allowedApps.length ? `${dnd.state.allowedApps.length} 个应用被允许` : '无'
)
const callOptions = DND_CALL_OPTIONS.map(v => ({ value: v, label: v }))

const timeSheet = computed(() => {
  if (!timeTarget.value) return null
  const isStart = timeTarget.value === 'start'
  return {
    title: isStart ? '开始时间' : '结束时间',
    modelValue: toTimeString(
      isStart ? dnd.state.startHour : dnd.state.endHour,
      isStart ? dnd.state.startMinute : dnd.state.endMinute
    )
  }
})

/** 标准控件统一回传 24 小时制 'HH:mm' */
function onTimeConfirm(value) {
  const { hour24, minute } = parseTimeValue(value)
  if (timeTarget.value === 'start') dnd.setStartTime(hour24, minute)
  else dnd.setEndTime(hour24, minute)
  timeTarget.value = null
}

function onRepeatConfirm(days) {
  dnd.setRepeatDays(days)
  showRepeatSheet.value = false
}
</script>

<template>
  <div class="settings-dnd">
    <!-- 三级页：统一进退转场 -->
    <Transition :name="isBack ? 'slide-back' : 'slide'">
      <DndSchedulePage
        v-if="subPage === 'schedule'"
        key="schedule"
        @back="closeSub"
        @pick-time="timeTarget = $event"
        @pick-repeat="showRepeatSheet = true"
      />
      <DndAppsPage v-else-if="subPage === 'apps'" key="apps" @back="closeSub" />
    </Transition>

    <!-- 二级页主页 -->
    <template v-if="!subPage">
      <GlassNavBar overlay :title="SETTINGS_TITLES.dnd" @back="emit('back')" />

      <div style="padding-top: var(--nav-h)" class="scrollable dnd-body">
        <!-- 顶部勿扰与定时开关卡片 -->
        <div class="dnd-card">
          <div class="dnd-cell">
            <span class="dc-title">{{ i18n.t('dnd') }}</span>
            <div class="dc-right">
              <ToggleSwitch :model-value="focus.state.activeId === 'dnd'" @update:model-value="$event ? focus.activate('dnd') : focus.deactivate()" />
            </div>
          </div>

          <div class="dnd-cell clickable no-sep" data-dnd-row="schedule" @click="openSub('schedule')">
            <span class="dc-title">{{ i18n.t('dndScheduled') }}</span>
            <div class="dc-right">
              <span class="dc-val">{{ scheduleLabel }}</span>
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 允许打扰分组 -->
        <div class="dnd-group-header">{{ i18n.t('allowDisturb') }}</div>
        <div class="dnd-card">
          <div class="dnd-cell clickable" data-dnd-row="calls" @click="showCallsPicker = true">
            <div class="dc-main-col">
              <span class="dc-title">{{ i18n.t('allowCalls') }}</span>
              <span class="dc-sub">{{ callsSubtitle }}</span>
            </div>
            <div class="dc-right">
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>

          <div class="dnd-cell clickable" data-dnd-row="apps" @click="openSub('apps')">
            <div class="dc-main-col">
              <span class="dc-title">{{ i18n.t('allowApps') }}</span>
              <span class="dc-sub">{{ appsSubtitle }}</span>
            </div>
            <div class="dc-right">
              <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>

          <div class="dnd-cell no-sep" style="align-items: flex-start;">
            <div class="dc-main-col" style="padding: 2px 0;">
              <span class="dc-title">允许显示重复来电</span>
              <span class="dc-sub" style="margin-top: 4px; color: #8e8e93; font-size: 13px;">
                如果同一个人在 15 分钟内第二次来电。
              </span>
            </div>
            <div class="dc-right" style="margin-top: 4px;">
              <ToggleSwitch v-model="prayerStore.allowRepeatedCalls" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 弹层（统一 SheetModal 体系） -->
    <SheetOptionPicker
      :visible="showCallsPicker"
      title="来电提醒"
      :options="callOptions"
      :model-value="dnd.state.allowCalls"
      @update:model-value="dnd.setAllowCalls"
      @close="showCallsPicker = false"
    />

    <DndRepeatSheet
      :visible="showRepeatSheet"
      :model-value="dnd.state.repeatDays"
      @confirm="onRepeatConfirm"
      @close="showRepeatSheet = false"
    />

    <TimePickerSheet
      :visible="Boolean(timeTarget)"
      :title="timeSheet?.title || '开始时间'"
      :model-value="timeSheet?.modelValue || '07:00'"
      @confirm="onTimeConfirm"
      @cancel="timeTarget = null"
      @close="timeTarget = null"
    />
  </div>
</template>

<style scoped>
.settings-dnd {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F0F1F2;
}

.dnd-body {
  padding-top: var(--nav-h);
  flex: 1;
  padding: 16px 0 34px;
}

.dnd-card {
  margin: 0 16px 18px;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.dnd-group-header {
  font-size: 13px;
  font-weight: 500;
  color: #8e8e93;
  margin: 20px 22px 8px;
}

.dnd-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.08);
}

.dnd-cell.no-sep { border-bottom: none; }
.dnd-cell.clickable { cursor: pointer; }
.dnd-cell.clickable:active { background: #f2f2f7; }

.dc-title { font-size: 15.5px; font-weight: 500; color: #1c1c1e; }
.dc-main-col { display: flex; flex-direction: column; }
.dc-sub { font-size: 13.5px; color: #8e8e93; margin-top: 2px; }
.dc-right { display: flex; align-items: center; gap: 8px; }
.dc-val { font-size: 14.5px; color: #8e8e93; }
</style>
