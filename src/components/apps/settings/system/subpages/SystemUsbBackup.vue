<script setup>
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'

const emit = defineEmits(['back'])

const isBackingUp = ref(false)
const backupSuccess = ref(false)
const backupHistory = ref([
  { id: '1', date: '2026年10月28日 14:20', size: '2.4 GB', device: 'SanDisk OTG' },
])

function runBackup() {
  isBackingUp.value = true
  setTimeout(() => {
    isBackingUp.value = false
    backupSuccess.value = true
    backupHistory.value.unshift({
      id: String(Date.now()),
      date: '刚刚',
      size: '2.6 GB',
      device: 'SanDisk OTG',
    })
    setTimeout(() => {
      backupSuccess.value = false
    }, 3000)
  }, 1200)
}
</script>

<template>
  <SubPageShell title="USB 备份和恢复" @back="emit('back')">
    <div class="usb-container">
      <div class="device-status-card">
        <div class="status-icon">💾</div>
        <div class="status-content">
          <div class="status-title">OTG 存储设备已就绪</div>
          <div class="status-desc">可用空间：58.4 GB / 64.0 GB</div>
        </div>
      </div>

      <div class="section-title">备份选项</div>
      <div class="settings-card">
        <ListCell
          title="备份到存储设备"
          subtitle="备份联系人、短信、通话记录与系统设置"
          chevron
          @click="runBackup"
        />
        <ListCell
          title="从存储设备恢复"
          subtitle="选择已有的备份文件恢复到本机"
          chevron
          last
          @click="() => {}"
        />
      </div>

      <div class="section-title">备份历史</div>
      <div class="settings-card">
        <ListCell
          v-for="(item, i) in backupHistory"
          :key="item.id"
          :title="item.date"
          :subtitle="`${item.device} · ${item.size}`"
          :last="i === backupHistory.length - 1"
          chevron
          @click="() => {}"
        />
      </div>

      <div v-if="isBackingUp" class="toast-loading">
        正在备份数据，请勿拔出 USB 设备...
      </div>
      <div v-if="backupSuccess" class="toast-success">
        备份成功已保存至 OTG 设备
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.usb-container {
  padding: 12px 0 32px;
}

.device-status-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 8px;
}

.status-icon {
  font-size: 28px;
}

.status-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}

.status-desc {
  font-size: 13px;
  color: #059669;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 14px 16px 6px;
}

.toast-loading, .toast-success {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(17, 24, 39, 0.88);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 13px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background: #059669;
}
</style>
