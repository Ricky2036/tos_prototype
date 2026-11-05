<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import NotificationIcon from '../../../ui/NotificationIcon.vue'
import { useI18nStore } from '../../../../stores/i18nStore'
import { useNotificationsStore } from '../../../../stores/notificationsStore'
import { useNotificationSettingsStore } from '../../../../stores/notificationSettingsStore'

/**
 * 桌面角标（通知与状态栏 → 通知类型 → 桌面角标）
 * 真机：桌面角标样式行 + 「已开启桌面角标权限」逐应用开关。
 * 应用清单与开关状态沿用通知页同一份数据（notificationsStore），不另建一套。
 */
defineProps({
  apps: { type: Array, default: () => [] }
})
const emit = defineEmits(['back'])
const i18n = useI18nStore()
const notificationsStore = useNotificationsStore()
const notifSettings = useNotificationSettingsStore()

function isOn(id) {
  return notificationsStore.isAppNotificationEnabled(id)
}

function toggle(id) {
  notificationsStore.toggleAppNotification(id)
}
</script>

<template>
  <SubPageShell title="桌面角标" @back="emit('back')">
    <div class="settings-card">
      <ListCell title="桌面角标样式" :value="notifSettings.badgeStyle" chevron clickable last />
    </div>

    <div class="section-header">已开启桌面角标权限</div>
    <div class="settings-card">
      <ListCell
        v-for="(app, i) in apps"
        :key="app.id"
        :title="i18n.notifTitle(app.appId)"
        :last="i === apps.length - 1"
      >
        <template #icon>
          <div class="ns-app-icon-wrap">
            <NotificationIcon :type="app.iconType" :size="38" />
          </div>
        </template>
        <template #right>
          <div class="ns-app-right">
            <i class="ns-divider"></i>
            <ToggleSwitch
              :model-value="isOn(app.id)"
              color="blue"
              @update:model-value="toggle(app.id)"
            />
          </div>
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>

<style scoped>
.ns-app-icon-wrap {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex: none;
}

.ns-app-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ns-divider {
  width: 0.5px;
  height: 22px;
  background: rgba(60, 60, 67, 0.18);
}
</style>
