<script setup>
/**
 * 日期与时间
 * ==========================================
 * 真机依据：spec/captures/SET-DSH-01-A-B.md 包 A / B / C / D / E
 * （Infinix X6878 / Android 17，2026-11-13）。
 *
 * 包 B1 九行分四组；包 C1 两态依赖矩阵；包 D 返回链与 store 持久化；
 * 包 E1 取色（底色 #F0F2F3 / 分隔线 #E0E0E0 / 禁用行实色 #999999 / 副标题 #595959）；
 * 包 E2 明确两页开关是同一控件 → 复用 ui/ToggleSwitch。
 * 现已补齐：日期选择器、时间选择器、时区写回、常驻地选择与双时钟显示位置选择。
 */
import { computed, inject, ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import DatePickerSheet from '../../../ui/DatePickerSheet.vue'
import TimePickerSheet from '../../../ui/TimePickerSheet.vue'
import SheetOptionPicker from '../../../ui/SheetOptionPicker.vue'
import DateTimeTimezonePicker from './DateTimeTimezonePicker.vue'
import { useDateTimeStore } from '../../../../stores/dateTimeStore.js'
import { useBackHandler } from '../../../../composables/backRegistry.js'
import { parseDateValue, toDateString, toChineseDateString } from '../../../../utils/datePicker.js'
import '../../../../styles/layer-transitions.css'

const emit = defineEmits(['back', 'open-picker'])
const store = useDateTimeStore()
const nav = inject('settingsNav', null)

const subPage = ref(null) // 'timezone'
const isBack = ref(false)

const activePicker = ref(null) // 'date' | 'time' | 'residence' | 'dualClockPosition'
const pickerDate = ref('2026-11-14')
const pickerTime = ref('14:00')

/** 真机实测选项（Infinix X6878 Android 17 media_1794797024755_80c82962） */
const RESIDENCE_OPTIONS = [
  '常驻地预测（深圳市）',
  '北京市',
  '上海市',
  '广州市',
  '成都市',
  '武汉市',
]

/** 真机实测选项（Infinix X6878 Android 17 media_1794797043644_c6f57c39） */
const DUAL_CLOCK_POSITIONS = [
  '锁屏和时钟桌面小部件',
  '仅桌面小部件',
  '仅锁屏',
]

const hourExample = computed(() => (store.use24Hour ? '13:00' : '下午1:00'))

function openTimezone() {
  isBack.value = false
  subPage.value = 'timezone'
}
function openResidence() {
  activePicker.value = 'residence'
}
function closeSubPage() {
  isBack.value = true
  subPage.value = null
}
function back() {
  if (subPage.value) {
    closeSubPage()
    return true
  }
  emit('back')
  return true
}
defineExpose({ back })

/** 包 D：子页一次返回回主页，主页一次返回回系统页；状态由 store 持久化 */
if (nav) {
  useBackHandler(() => {
    if (subPage.value) {
      closeSubPage()
      return true
    }
    nav.pop()
    return true
  })
}

function storeTimeTo24Hour(timeStr) {
  if (!timeStr) return '07:00'
  const match = timeStr.match(/^(上午|下午)?\s*(\d{1,2}):(\d{1,2})$/)
  if (match) {
    const period = match[1]
    let h = parseInt(match[2], 10)
    const m = match[3]
    if (period === '下午' && h < 12) h += 12
    if (period === '上午' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${m}`
  }
  return '07:00'
}

function time24ToStoreTime(val24, use24Hour) {
  const [hStr, mStr] = val24.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr
  if (use24Hour) {
    return `${String(h).padStart(2, '0')}:${m}`
  }
  const period = h >= 12 ? '下午' : '上午'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${period}${h}:${m}`
}

function openPicker(key) {
  emit('open-picker', key)
  if (key === 'date' && !store.canEditDate()) return
  if (key === 'time' && !store.canEditTime()) return
  if (key === 'date') {
    const { year, month, day } = parseDateValue(store.date)
    pickerDate.value = toDateString(year, month, day)
  }
  if (key === 'time') {
    pickerTime.value = storeTimeTo24Hour(store.time)
  }
  activePicker.value = key
}

function onDateConfirm(val) {
  const { year, month, day } = parseDateValue(val)
  store.setDate(toChineseDateString(year, month, day))
  activePicker.value = null
}

function onTimeConfirm(val) {
  store.setTime(time24ToStoreTime(val, store.use24Hour))
  activePicker.value = null
}

function selectResidence(city) {
  store.setResidence(city)
  activePicker.value = null
}

function selectDualClockPosition(pos) {
  store.setDualClockPosition(pos)
  activePicker.value = null
}
</script>

<template>
  <div class="settings-datetime-page">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <DateTimeTimezonePicker v-if="subPage === 'timezone'" key="timezone" @back="closeSubPage" />
      <div v-else key="main" class="dt-main">
        <GlassNavBar overlay title="日期与时间" @back="back" />

        <div class="dt-scroll-body scrollable">
          <div class="dt-body">
            <!-- 组 1：自动设置时间 及其联动的日期 / 时间 -->
            <div class="settings-card dt-card">
              <ListCell
                data-dt-row="autoTime"
                title="自动设置时间"
                subtitle="使用您的网络和无线信号自动设定"
              >
                <template #right>
                  <ToggleSwitch :model-value="store.autoTime" @update:model-value="store.setAutoTime" />
                </template>
              </ListCell>
              <ListCell
                data-dt-row="date"
                title="日期"
                :subtitle="store.date"
                chevron
                :disabled="!store.canEditDate()"
                @click="openPicker('date')"
              />
              <ListCell
                data-dt-row="time"
                title="时间"
                :subtitle="store.time"
                chevron
                last
                :disabled="!store.canEditTime()"
                @click="openPicker('time')"
              />
            </div>

            <!-- 组 2：24 小时制（不受总开关影响） -->
            <div class="settings-card dt-card">
              <ListCell
                data-dt-row="use24Hour"
                title="使用 24 小时制"
                :subtitle="hourExample"
                last
              >
                <template #right>
                  <ToggleSwitch :model-value="store.use24Hour" @update:model-value="store.setUse24Hour" />
                </template>
              </ListCell>
            </div>

            <!-- 组 3：自动设置时区 及其联动的选择时区（关态可进城市列表） -->
            <div class="settings-card dt-card">
              <ListCell
                data-dt-row="autoTimezone"
                title="自动设置时区"
                subtitle="使用网络提供的时区。"
              >
                <template #right>
                  <ToggleSwitch :model-value="store.autoTimezone" @update:model-value="store.setAutoTimezone" />
                </template>
              </ListCell>
              <ListCell
                data-dt-row="timezone"
                title="选择时区"
                :subtitle="store.timezone"
                chevron
                last
                :disabled="!store.canSelectTimezone()"
                @click="openTimezone"
              />
            </div>

            <!-- 组 4：系统双时钟 -->
            <div class="settings-card dt-card">
              <ListCell
                data-dt-row="dualClock"
                title="系统双时钟"
                subtitle="系统时区与常驻地时区不一致时，显示双时钟。"
              >
                <template #right>
                  <ToggleSwitch :model-value="store.dualClock" @update:model-value="store.setDualClock" />
                </template>
              </ListCell>
              <ListCell
                data-dt-row="residence"
                title="常驻地"
                :subtitle="store.residence"
                chevron
                @click="openResidence"
              />
              <ListCell
                data-dt-row="dualClockPosition"
                title="双时钟显示位置"
                :subtitle="store.dualClockPosition"
                chevron
                last
                @click="activePicker = 'dualClockPosition'"
              />
            </div>
          </div>
        </div>

        <!-- 标准底部弹层：日期选择器 -->
        <DatePickerSheet
          :visible="activePicker === 'date'"
          title="设置日期"
          :model-value="pickerDate"
          @confirm="onDateConfirm"
          @cancel="activePicker = null"
          @close="activePicker = null"
        />

        <!-- 标准底部弹层：时间选择器 -->
        <TimePickerSheet
          :visible="activePicker === 'time'"
          title="设置时间"
          :model-value="pickerTime"
          :show-period="!store.use24Hour"
          @confirm="onTimeConfirm"
          @cancel="activePicker = null"
          @close="activePicker = null"
        />

        <!-- 标准单选底部弹层控件：选择常驻地（真机 1:1 media_1794797024755_80c82962） -->
        <SheetOptionPicker
          :visible="activePicker === 'residence'"
          title="选择常驻地"
          :options="RESIDENCE_OPTIONS"
          :model-value="store.residence"
          @pick="selectResidence"
          @close="activePicker = null"
        />

        <!-- 标准单选底部弹层控件：双时钟显示位置（真机 1:1 media_1794797043644_c6f57c39） -->
        <SheetOptionPicker
          :visible="activePicker === 'dualClockPosition'"
          title="双时钟显示位置"
          :options="DUAL_CLOCK_POSITIONS"
          :model-value="store.dualClockPosition"
          @pick="selectDualClockPosition"
          @close="activePicker = null"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-datetime-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #F0F2F3; /* 包 E1 实测 */
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", sans-serif;
}

.dt-main {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.dt-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding-top: var(--nav-h);
}

.dt-body {
  padding: 12px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dt-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: none;
  border: none;
}

/* 覆盖禁用行的文字颜色为 #999999 实色，且保持 opacity=1（包 E1 实测） */
:deep([data-dt-row].is-disabled) {
  opacity: 1 !important;
}
:deep([data-dt-row].is-disabled .lc-title) {
  color: #999999 !important;
}
:deep([data-dt-row].is-disabled .lc-subtitle) {
  color: #999999 !important;
}

/* 包 E1 取色实测：副标题统一为 #595959，分隔线为 #E0E0E0 */
:deep([data-dt-row] .lc-subtitle) {
  color: #595959;
}
:deep([data-dt-row] .lc-main) {
  border-bottom-color: #E0E0E0;
}

.sheet-title {
  text-align: center;
  font-size: 15px;
  color: #8E8E93;
  padding-bottom: 8px;
}
.sheet-options-list {
  display: flex;
  flex-direction: column;
}
.sheet-option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 4px;
  border-bottom: 1px solid #F1F5F9;
  font-size: 16px;
  color: #111111;
  cursor: pointer;
}
.sheet-option-item:last-child {
  border-bottom: none;
}
.option-check {
  color: #2F6BF6;
  font-weight: 700;
  font-size: 17px;
}
.sheet-actions {
  margin-top: 12px;
}
.sheet-btn-cancel {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 24px;
  background: #E9E9EC;
  color: #3C3C43;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.sheet-btn-cancel:active {
  opacity: 0.85;
}
</style>
