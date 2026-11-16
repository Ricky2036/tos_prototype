<script setup>
/**
 * 定时开关机与重启 · 真机实测版（com.mediatek.schpwronoff）
 * ==========================================================
 * 真实证据：
 *   - .local-evidence/SET-SYS-01/device/traversal/05_power_schedule.xml (AlarmClock 主页)
 *   - .local-evidence/SET-SYS-01/device/traversal/05_01_power_on_time_picker.xml (SetAlarm 二级编辑页)
 *   - .local-evidence/SET-SYS-01/device/traversal/05_02_time_dialog.png (时间弹层)
 *   - .local-evidence/SET-SYS-01/device/traversal/05_03_repeat_dialog.png (重复多选弹层)
 *
 * 交互链路：
 *   1. 主页展示 3 个独立分组大卡片（定时开机、定时关机、定时重启），带大号时间、周期和独立开关。
 *   2. 点击任意卡片进入「设置定时开机 / 关机 / 重启」二级编辑页（左上角 X 取消，右上角 √ 确定保存）。
 *   3. 二级页包含「时间」与「重复」两行：
 *      - 点击「时间」唤起标准滚轮时间弹层编辑时间；
 *      - 点击「重复」唤起全星期多选列表弹层（星期一至星期日），带取消与确定。
 *   4. 点击右上角 √ 保存写回 store 并返回，点击左上角 X 放弃更改并返回。
 */
import { ref, computed } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import ListCell from '../../../../ui/ListCell.vue'
import TimePickerSheet from '../../../../ui/TimePickerSheet.vue'
import Checkbox from '../../../../ui/Checkbox.vue'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const store = useSystemSettingsStore()

// 编辑状态：'powerOn' | 'powerOff' | 'restart' | null
const currentEditTarget = ref(null)

// 临时草稿状态
const draftTime = ref('07:00')
const draftRepeat = ref('每天')
const showTimePicker = ref(false)
const showRepeatPicker = ref(false)

const WEEK_DAYS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']
const selectedDays = ref([...WEEK_DAYS])

const editTitle = computed(() => {
  if (currentEditTarget.value === 'powerOn') return '设置定时开机'
  if (currentEditTarget.value === 'powerOff') return '设置定时关机'
  if (currentEditTarget.value === 'restart') return '设置定时重启'
  return ''
})

function openEdit(target) {
  currentEditTarget.value = target
  if (target === 'powerOn') {
    draftTime.value = store.powerOnTime
    draftRepeat.value = store.powerOnRepeat || '每天'
  } else if (target === 'powerOff') {
    draftTime.value = store.powerOffTime
    draftRepeat.value = store.powerOffRepeat || '周一、周二、周三、周四、周五'
  } else if (target === 'restart') {
    draftTime.value = store.restartTime
    draftRepeat.value = store.restartRepeat || '星期三'
  }
  syncSelectedDaysFromDraft()
}

function syncSelectedDaysFromDraft() {
  if (draftRepeat.value === '每天') {
    selectedDays.value = [...WEEK_DAYS]
  } else if (draftRepeat.value === '周一、周二、周三、周四、周五') {
    selectedDays.value = ['星期一', '星期二', '星期三', '星期四', '星期五']
  } else if (draftRepeat.value === '周末') {
    selectedDays.value = ['星期六', '星期日']
  } else {
    selectedDays.value = WEEK_DAYS.filter(d => draftRepeat.value.includes(d))
    if (selectedDays.value.length === 0) {
      selectedDays.value = ['星期一']
    }
  }
}

function toggleDay(day) {
  const idx = selectedDays.value.indexOf(day)
  if (idx >= 0) {
    if (selectedDays.value.length > 1) {
      selectedDays.value.splice(idx, 1)
    }
  } else {
    selectedDays.value.push(day)
  }
}

function formatDays(days) {
  if (days.length === 7) return '每天'
  const workdays = ['星期一', '星期二', '星期三', '星期四', '星期五']
  if (days.length === 5 && workdays.every(d => days.includes(d))) {
    return '周一、周二、周三、周四、周五'
  }
  const weekend = ['星期六', '星期日']
  if (days.length === 2 && weekend.every(d => days.includes(d))) {
    return '周末'
  }
  return days.join('、')
}

function confirmRepeat() {
  draftRepeat.value = formatDays(selectedDays.value)
  showRepeatPicker.value = false
}

function onTimeConfirm(val) {
  draftTime.value = val
  showTimePicker.value = false
}

function saveEdit() {
  if (currentEditTarget.value === 'powerOn') {
    store.setPowerOnTime(draftTime.value)
    store.setPowerOnRepeat(draftRepeat.value)
  } else if (currentEditTarget.value === 'powerOff') {
    store.setPowerOffTime(draftTime.value)
    store.setPowerOffRepeat(draftRepeat.value)
  } else if (currentEditTarget.value === 'restart') {
    store.setRestartTime(draftTime.value)
    store.setRestartRepeat(draftRepeat.value)
  }
  currentEditTarget.value = null
}

function cancelEdit() {
  currentEditTarget.value = null
}

function onMainBack() {
  if (currentEditTarget.value) {
    cancelEdit()
    return
  }
  emit('back')
}
</script>

<template>
  <!-- 主页面：AlarmClock 列表 -->
  <SubPageShell
    v-if="!currentEditTarget"
    title="定时开关机与重启"
    data-test="subpage-schedule-power"
    @back="onMainBack"
  >
    <div class="schedule-container">
      <!-- 组 1：定时开机 -->
      <div class="section-title">定时开机</div>
      <div class="settings-card schedule-card" data-test="schedule-card-on" @click="openEdit('powerOn')">
        <div class="schedule-row">
          <div class="time-info">
            <div class="time-display">{{ store.powerOnTime }}</div>
            <div class="time-repeat">{{ store.powerOnRepeat || '每天' }}</div>
          </div>
          <div class="switch-wrap" @click.stop>
            <ToggleSwitch
              data-test="switch-power-on"
              :model-value="store.scheduledPowerOn"
              @update:model-value="store.setScheduledPowerOn"
            />
          </div>
        </div>
      </div>

      <!-- 组 2：定时关机 -->
      <div class="section-title">定时关机</div>
      <div class="settings-card schedule-card" data-test="schedule-card-off" @click="openEdit('powerOff')">
        <div class="schedule-row">
          <div class="time-info">
            <div class="time-display">{{ store.powerOffTime }}</div>
            <div class="time-repeat">{{ store.powerOffRepeat || '周一、周二、周三、周四、周五' }}</div>
          </div>
          <div class="switch-wrap" @click.stop>
            <ToggleSwitch
              data-test="switch-power-off"
              :model-value="store.scheduledPowerOff"
              @update:model-value="store.setScheduledPowerOff"
            />
          </div>
        </div>
      </div>

      <!-- 组 3：定时重启 -->
      <div class="section-title">定时重启</div>
      <div class="settings-card schedule-card" data-test="schedule-card-restart" @click="openEdit('restart')">
        <div class="schedule-row">
          <div class="time-info">
            <div class="time-display">{{ store.restartTime }}</div>
            <div class="time-repeat">{{ store.restartRepeat || '星期三' }}</div>
          </div>
          <div class="switch-wrap" @click.stop>
            <ToggleSwitch
              data-test="switch-restart"
              :model-value="store.scheduledRestart"
              @update:model-value="store.setScheduledRestart"
            />
          </div>
        </div>
      </div>
    </div>
  </SubPageShell>

  <!-- 二级编辑页：SetAlarm (对齐真机 com.mediatek.schpwronoff.SetAlarm) -->
  <div v-else class="set-alarm-view" data-test="set-alarm-view">
    <!-- 顶部导航栏：左边关闭 X，中间标题，右边确定 √ -->
    <div class="set-alarm-nav">
      <button class="nav-icon-btn nav-close-btn" data-test="btn-edit-close" @click="cancelEdit">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="nav-edit-title">{{ editTitle }}</div>
      <button class="nav-icon-btn nav-confirm-btn" data-test="btn-edit-confirm" @click="saveEdit">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </button>
    </div>

    <div class="edit-content-container">
      <div class="settings-card">
        <ListCell
          title="时间"
          :subtitle="draftTime"
          chevron
          data-test="row-edit-time"
          @click="showTimePicker = true"
        />
        <ListCell
          title="重复"
          :subtitle="draftRepeat"
          chevron
          last
          data-test="row-edit-repeat"
          @click="showRepeatPicker = true"
        />
      </div>
    </div>

    <!-- 时间滚轮选择器 -->
    <TimePickerSheet
      :visible="showTimePicker"
      title="设置时间"
      :model-value="draftTime"
      :show-period="false"
      @confirm="onTimeConfirm"
      @cancel="showTimePicker = false"
      @close="showTimePicker = false"
    />

    <!-- 重复多选弹层 (对齐真机 repeat_dialog) -->
    <div v-if="showRepeatPicker" class="repeat-dialog-mask" @click.self="showRepeatPicker = false">
      <div class="repeat-dialog-card" data-test="repeat-dialog-card">
        <div class="repeat-dialog-title">重复</div>
        <div class="repeat-days-list">
          <div
            v-for="day in WEEK_DAYS"
            :key="day"
            class="repeat-day-item"
            :class="{ active: selectedDays.includes(day) }"
            @click="toggleDay(day)"
          >
            <span class="day-label">{{ day }}</span>
            <Checkbox :model-value="selectedDays.includes(day)" />
          </div>
        </div>
        <div class="repeat-dialog-actions">
          <button class="repeat-btn-cancel" @click="showRepeatPicker = false">取消</button>
          <button class="repeat-btn-confirm" @click="confirmRepeat">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schedule-container {
  padding: 12px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 8px 16px 2px;
}
.schedule-card {
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.schedule-card:active {
  background-color: #ECEEF0;
}
.schedule-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.time-display {
  font-size: 26px;
  font-weight: 700;
  color: #111111;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.time-repeat {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 4px;
}
.switch-wrap {
  flex-shrink: 0;
}

/* SetAlarm 二级编辑页 */
.set-alarm-view {
  min-height: 100%;
  background: var(--bg-primary, #F8F9FA);
  display: flex;
  flex-direction: column;
}
.set-alarm-nav {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.nav-icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  color: #111827;
}
.nav-icon-btn:active {
  background: rgba(0, 0, 0, 0.06);
}
.nav-edit-title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
}
.edit-content-container {
  padding: 16px 0;
}

/* 重复多选弹层 */
.repeat-dialog-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.repeat-dialog-card {
  width: 100%;
  max-width: 420px;
  background: #FFFFFF;
  border-radius: 20px 20px 0 0;
  padding: 20px 20px 24px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  animation: slideUp 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.repeat-dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  margin-bottom: 16px;
}
.repeat-days-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.repeat-day-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px;
  cursor: pointer;
  border-radius: 10px;
}
.repeat-day-item:active {
  background: #F3F4F6;
}
.day-label {
  font-size: 15px;
  color: #1F2937;
}
.native-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1.5px solid #D1D5DB;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.native-checkbox.checked {
  background: #0066FF;
  border-color: #0066FF;
}
.repeat-dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.repeat-btn-cancel,
.repeat-btn-confirm {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.repeat-btn-cancel {
  background: #F3F4F6;
  color: #4B5563;
}
.repeat-btn-cancel:active {
  background: #E5E7EB;
}
.repeat-btn-confirm {
  background: #0066FF;
  color: #FFFFFF;
}
.repeat-btn-confirm:active {
  background: #0052CC;
}
</style>
