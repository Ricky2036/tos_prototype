<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useNotificationsStore } from '../../../../stores/notificationsStore'
import { useNotificationSettingsStore } from '../../../../stores/notificationSettingsStore'

/**
 * 智慧文本（Dynamic Bar → 智能服务 → 智慧文本）
 *
 * 真机：总开关 → 分组「服务列表」6 项逐服务开关 → 底部协议链接说明。
 * 总开关与 Dynamic Bar 页那一行的状态同源（notificationsStore.islandSettings.smartText）。
 */
const emit = defineEmits(['back'])
const notificationsStore = useNotificationsStore()
const notifSettings = useNotificationSettingsStore()

const SERVICES = [
  { key: 'phone', label: '识别电话号码', subtitle: '快速新建联系人、拨打电话。', bg: '#34C759', d: 'M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11 11 0 0 0 3.4.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.4 1 1 0 0 1-.25 1z' },
  { key: 'address', label: '识别地址', subtitle: '获取便捷的导航服务。', bg: '#2F6BF6', d: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z' },
  { key: 'calendar', label: '识别日程', subtitle: '快速新建日程。', bg: '#3B82F6', d: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4' },
  { key: 'videoLink', label: '识别视频链接', subtitle: '快速整理 YouTube 视频内容。', bg: '#F5A623', d: 'M4 6h11l5 3v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm3 4v6l5-3z' },
  { key: 'forex', label: '识别外汇', subtitle: '快速进行汇率换算。', bg: '#F08A24', d: 'M4 9a5 5 0 0 1 5-5h6M20 15a5 5 0 0 1-5 5H9M15 4l3 3-3 3M9 20l-3-3 3-3' },
  { key: 'foreign', label: '识别外文', subtitle: '快速获取即时翻译。', bg: '#2F6BF6', d: 'M4 5h9v2H4zM8 3h2v2H8zM5 9h8v2a8 8 0 0 1-8 8v-2a6 6 0 0 0 6-6H5z' }
]
</script>

<template>
  <SubPageShell title="智慧文本" @back="emit('back')">
    <div class="settings-card">
      <ListCell title="智慧文本" last>
        <template #right>
          <ToggleSwitch
            :model-value="notificationsStore.islandSettings.smartText"
            color="blue"
            @update:model-value="v => notificationsStore.setIslandEnabled('smartText', v)"
          />
        </template>
      </ListCell>
    </div>

    <div class="section-header">服务列表</div>
    <div class="settings-card">
      <ListCell
        v-for="(svc, i) in SERVICES"
        :key="svc.key"
        :title="svc.label"
        :subtitle="svc.subtitle"
        :last="i === SERVICES.length - 1"
      >
        <template #icon>
          <div class="svc-icon" :style="{ background: svc.bg }">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path :d="svc.d" />
            </svg>
          </div>
        </template>
        <template #right>
          <ToggleSwitch
            :model-value="notifSettings.smartTextServices[svc.key]"
            color="blue"
            @update:model-value="v => notifSettings.setSmartTextService(svc.key, v)"
          />
        </template>
      </ListCell>
    </div>

    <div class="card-note">
      点击查看<button class="link-btn" type="button">《用户协议》</button>和<button class="link-btn" type="button">《隐私政策》</button>。
    </div>
  </SubPageShell>
</template>

<style scoped>
.svc-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 12px;
}

.link-btn {
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  color: #2F6BF6;
  cursor: pointer;
}
</style>
