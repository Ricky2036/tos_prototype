<script setup>
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const store = useSystemSettingsStore()
</script>

<template>
  <SubPageShell title="备份到Google云端硬盘" @back="emit('back')">
    <div class="google-backup-container">
      <div class="status-card">
        <div class="account-row">
          <div class="account-avatar">G</div>
          <div class="account-meta">
            <div class="account-name">Google 账号备份</div>
            <div class="account-email">{{ store.googleBackupAccount }}</div>
          </div>
        </div>
      </div>

      <div class="section-title">备份设置</div>
      <div class="settings-card">
        <ListCell
          title="备份到云端硬盘"
          :subtitle="store.googleBackupEnabled ? '已开启自动同步' : '已暂停'"
          last
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-google-backup"
              :model-value="store.googleBackupEnabled"
              @update:model-value="store.setGoogleBackupEnabled"
            />
          </template>
        </ListCell>
      </div>

      <div class="section-title">备份内容详情</div>
      <div class="settings-card">
        <ListCell title="应用与应用数据" subtitle="24 个应用已备份" />
        <ListCell title="短信与彩信记录" subtitle="已同步至最新" />
        <ListCell title="通话记录" subtitle="已同步" />
        <ListCell title="设备设置与系统偏好" subtitle="Wi-Fi 密码、壁纸、显示偏好" last />
      </div>

      <div class="pending-notice-card">
        <div class="notice-title">服务暂缓说明</div>
        <div class="notice-text">
          根据系统架构约定，Google 独立外部云服务深层依赖暂缓实装，当前在本地环境进行状态模拟与沙箱防护，不向外部服务器发起真实网络同步。
        </div>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.google-backup-container {
  padding: 12px 0 32px;
}

.status-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 8px;
}

.account-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.account-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #4285F4;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

.account-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.account-email {
  font-size: 13px;
  color: #6B7280;
  margin-top: 2px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 14px 16px 6px;
}

.pending-notice-card {
  margin-top: 20px;
  padding: 14px 16px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
}

.notice-title {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.notice-text {
  font-size: 12px;
  color: #64748B;
  line-height: 1.5;
}
</style>
