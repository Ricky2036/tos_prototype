<script setup>
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const store = useSystemSettingsStore()

const editingField = ref(null) // 'powerOnTime' | 'powerOffTime' | 'restartTime'
const tempTime = ref('07:00')

function openTimeEdit(field, currentVal) {
  editingField.value = field
  tempTime.value = currentVal
}

function saveTime() {
  if (editingField.value === 'powerOnTime') {
    store.setPowerOnTime(tempTime.value)
  } else if (editingField.value === 'powerOffTime') {
    store.setPowerOffTime(tempTime.value)
  } else if (editingField.value === 'restartTime') {
    store.setRestartTime(tempTime.value)
  }
  editingField.value = null
}
</script>

<template>
  <SubPageShell title="定时开关机与重启" @back="emit('back')">
    <div class="schedule-container">
      <!-- 定时开机卡片 -->
      <div class="section-title">定时开机</div>
      <div class="settings-card">
        <ListCell
          title="开启定时开机"
          :subtitle="store.scheduledPowerOn ? `将在 ${store.powerOnTime} 自动开机` : '未开启'"
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-power-on"
              :model-value="store.scheduledPowerOn"
              @update:model-value="store.setScheduledPowerOn"
            />
          </template>
        </ListCell>

        <template v-if="store.scheduledPowerOn">
          <ListCell
            title="开机时间"
            :subtitle="store.powerOnTime"
            chevron
            @click="openTimeEdit('powerOnTime', store.powerOnTime)"
          />
          <ListCell
            title="重复模式"
            :subtitle="store.powerOnRepeat"
            chevron
            last
            @click="store.setPowerOnRepeat(store.powerOnRepeat === '每天' ? '工作日' : '每天')"
          />
        </template>
      </div>

      <!-- 定时关机卡片 -->
      <div class="section-title">定时关机</div>
      <div class="settings-card">
        <ListCell
          title="开启定时关机"
          :subtitle="store.scheduledPowerOff ? `将在 ${store.powerOffTime} 自动关机` : '未开启'"
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-power-off"
              :model-value="store.scheduledPowerOff"
              @update:model-value="store.setScheduledPowerOff"
            />
          </template>
        </ListCell>

        <template v-if="store.scheduledPowerOff">
          <ListCell
            title="关机时间"
            :subtitle="store.powerOffTime"
            chevron
            @click="openTimeEdit('powerOffTime', store.powerOffTime)"
          />
          <ListCell
            title="重复模式"
            :subtitle="store.powerOffRepeat"
            chevron
            last
            @click="store.setPowerOffRepeat(store.powerOffRepeat === '每天' ? '工作日' : '每天')"
          />
        </template>
      </div>

      <!-- 定时重启卡片 -->
      <div class="section-title">自动重启</div>
      <div class="settings-card">
        <ListCell
          title="夜间自动重启"
          subtitle="在手机空闲且电量充足时自动重启，保持系统流畅"
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-restart"
              :model-value="store.scheduledRestart"
              @update:model-value="store.setScheduledRestart"
            />
          </template>
        </ListCell>

        <template v-if="store.scheduledRestart">
          <ListCell
            title="重启时段"
            :subtitle="store.restartTime"
            chevron
            last
            @click="openTimeEdit('restartTime', store.restartTime)"
          />
        </template>
      </div>

      <!-- 时间修改简易模态 -->
      <div v-if="editingField" class="time-modal-overlay" @click.self="editingField = null">
        <div class="time-modal-card">
          <div class="modal-header">
            <span class="modal-title">设置时间</span>
            <button class="modal-btn-confirm" @click="saveTime">完成</button>
          </div>
          <div class="time-input-group">
            <input v-model="tempTime" type="time" class="native-time-input" />
          </div>
        </div>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.schedule-container {
  padding: 12px 0 32px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 14px 16px 6px;
}

.time-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.time-modal-card {
  width: 100%;
  background: #FFFFFF;
  border-radius: 20px 20px 0 0;
  padding: 20px 24px 36px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
}

.modal-btn-confirm {
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.time-input-group {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.native-time-input {
  font-size: 28px;
  font-weight: bold;
  padding: 8px 16px;
  border: 1px solid #CBD5E1;
  border-radius: 12px;
  color: #1E293B;
}
</style>
