<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useNotificationsStore } from '../../../../stores/notificationsStore'
import { useNotificationSettingsStore } from '../../../../stores/notificationSettingsStore'

/**
 * 场景智能（Dynamic Bar → 智能服务 → 场景智能）
 *
 * 真机：总开关 → 分组「服务列表」3 项（AI Writing / 截图分析 / 文档总结）。
 * 真机上 AI Writing 默认关，另外两项默认开。
 * 总开关与 Dynamic Bar 页那一行同源（notificationsStore.islandSettings.sceneSmart）。
 */
const emit = defineEmits(['back'])
const notificationsStore = useNotificationsStore()
const notifSettings = useNotificationSettingsStore()

const SERVICES = [
  { key: 'aiWriting', label: 'AI Writing', subtitle: '输入文本时提供润色、改写等智能服务。', bg: '#8E8E93', d: 'M4 20l4-1 10-10-3-3L5 16zM14 6l3 3' },
  { key: 'screenshot', label: '截图分析', subtitle: '根据截屏内容提供智能建议及记忆服务。', bg: '#C9C2F7', d: 'M4 8h4l2-2h4l2 2h4v10H4zM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  { key: 'docSummary', label: '文档总结', subtitle: '下载文档后提供文档摘要总结服务。', bg: '#2F6BF6', d: 'M7 3h7l4 4v14H7zM14 3v5h4M10 13h6M10 17h4' }
]
</script>

<template>
  <SubPageShell title="场景智能" @back="emit('back')">
    <div class="settings-card">
      <ListCell title="场景智能" last>
        <template #right>
          <ToggleSwitch
            :model-value="notificationsStore.islandSettings.sceneSmart"
            color="blue"
            @update:model-value="v => notificationsStore.setIslandEnabled('sceneSmart', v)"
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
            :model-value="notifSettings.sceneAiServices[svc.key]"
            color="blue"
            @update:model-value="v => notifSettings.setSceneAiService(svc.key, v)"
          />
        </template>
      </ListCell>
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
</style>
