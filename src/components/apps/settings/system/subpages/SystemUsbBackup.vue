<script setup>
/**
 * USB 备份和恢复 · 真机实测版（com.transsion.mobilecloner）
 * ========================================================
 * 真实证据：.local-evidence/SET-SYS-01/device/real_usb_backup.xml
 * 状态：
 *   - 等待 USB 连接
 *   - 存储容量显示：0 B / 0.00 GB
 */
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'

const emit = defineEmits(['back'])

const isConnected = ref(false)
const tipMsg = ref('')

function checkUsb() {
  tipMsg.value = '未检测到 OTG 存储设备，请连接 USB 设备后重试'
  setTimeout(() => { tipMsg.value = '' }, 2500)
}
</script>

<template>
  <SubPageShell title="USB 备份和恢复" @back="emit('back')">
    <div class="usb-container">
      <!-- 存储状态卡片 -->
      <div class="settings-card status-card">
        <div class="status-title">等待 USB 连接</div>
        <div class="storage-row">
          <span class="used-text">0 B</span>
          <span class="total-text">0.00 GB</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar" style="width: 0%"></div>
        </div>
      </div>

      <!-- 操作卡片 -->
      <div class="section-title">备份与恢复</div>
      <div class="settings-card">
        <ListCell
          title="备份数据至 USB 存储设备"
          subtitle="将通讯录、信息、照片与应用数据导出"
          chevron
          @click="checkUsb"
        />
        <ListCell
          title="从 USB 存储设备恢复数据"
          subtitle="导入此前备份的数据"
          last
          chevron
          @click="checkUsb"
        />
      </div>

      <div v-if="tipMsg" class="toast-tip">{{ tipMsg }}</div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.usb-container {
  padding: 12px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.status-card {
  padding: 18px 16px 20px;
}
.status-title {
  font-size: 16px;
  font-weight: 600;
  color: #111111;
  margin-bottom: 14px;
}
.storage-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.used-text {
  font-size: 22px;
  font-weight: 700;
  color: #111111;
  font-variant-numeric: tabular-nums;
}
.total-text {
  font-size: 14px;
  color: #8E8E93;
  font-variant-numeric: tabular-nums;
}
.progress-track {
  width: 100%;
  height: 6px;
  background: #E5E7EB;
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: #2F6BF6;
  border-radius: 3px;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 8px 16px 2px;
}
.toast-tip {
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
  text-align: center;
  max-width: 80%;
}
</style>
