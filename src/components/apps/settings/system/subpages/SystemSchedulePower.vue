<script setup>
/**
 * 定时开关机与重启 · 真机实测版（com.mediatek.schpwronoff）
 * ==========================================================
 * 真实证据：.local-evidence/SET-SYS-01/device/real_sys_power_schedule.xml
 * 3 个独立分组卡片：
 *   1. 定时开机：大字号时间（07:00）+ 周期（每天）+ 开关
 *   2. 定时关机：大字号时间（20:00）+ 周期（周一、周二、周三、周四、周五）+ 开关
 *   3. 定时重启：大字号时间（05:00）+ 周期（星期三）+ 开关
 * 点击时间唤起全仓标准控件 TimePickerSheet 编辑。
 */
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import TimePickerSheet from '../../../../ui/TimePickerSheet.vue'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const store = useSystemSettingsStore()

const editingField = ref(null) // 'powerOn' | 'powerOff' | 'restart'
const editingTime = ref('07:00')

function openEdit(field, currentVal) {
  editingField.value = field
  editingTime.value = currentVal
}

function onTimeConfirm(val) {
  if (editingField.value === 'powerOn') {
    store.setPowerOnTime(val)
  } else if (editingField.value === 'powerOff') {
    store.setPowerOffTime(val)
  } else if (editingField.value === 'restart') {
    store.setRestartTime(val)
  }
  editingField.value = null
}
</script>

<template>
  <SubPageShell title="定时开关机与重启" @back="emit('back')">
    <div class="schedule-container">
      <!-- 组 1：定时开机 -->
      <div class="section-title">定时开机</div>
      <div class="settings-card schedule-card">
        <div class="schedule-row" @click="openEdit('powerOn', store.powerOnTime)">
          <div class="time-info">
            <div class="time-display">{{ store.powerOnTime }}</div>
            <div class="time-repeat">{{ store.powerOnRepeat || '每天' }}</div>
          </div>
          <div class="switch-wrap" @click.stop>
            <ToggleSwitch
              :model-value="store.scheduledPowerOn"
              @update:model-value="store.setScheduledPowerOn"
            />
          </div>
        </div>
      </div>

      <!-- 组 2：定时关机 -->
      <div class="section-title">定时关机</div>
      <div class="settings-card schedule-card">
        <div class="schedule-row" @click="openEdit('powerOff', store.powerOffTime)">
          <div class="time-info">
            <div class="time-display">{{ store.powerOffTime }}</div>
            <div class="time-repeat">{{ store.powerOffRepeat || '周一、周二、周三、周四、周五' }}</div>
          </div>
          <div class="switch-wrap" @click.stop>
            <ToggleSwitch
              :model-value="store.scheduledPowerOff"
              @update:model-value="store.setScheduledPowerOff"
            />
          </div>
        </div>
      </div>

      <!-- 组 3：定时重启 -->
      <div class="section-title">定时重启</div>
      <div class="settings-card schedule-card">
        <div class="schedule-row" @click="openEdit('restart', store.restartTime)">
          <div class="time-info">
            <div class="time-display">{{ store.restartTime }}</div>
            <div class="time-repeat">星期三</div>
          </div>
          <div class="switch-wrap" @click.stop>
            <ToggleSwitch
              :model-value="store.scheduledRestart"
              @update:model-value="store.setScheduledRestart"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 标准底部时间选择弹层 -->
    <TimePickerSheet
      :visible="editingField !== null"
      title="设置时间"
      :model-value="editingTime"
      :show-period="false"
      @confirm="onTimeConfirm"
      @cancel="editingField = null"
      @close="editingField = null"
    />
  </SubPageShell>
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
  padding: 14px 16px;
}
.schedule-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
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
</style>
