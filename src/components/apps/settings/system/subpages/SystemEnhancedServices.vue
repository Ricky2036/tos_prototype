<script setup>
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const store = useSystemSettingsStore()
</script>

<template>
  <SubPageShell title="增强服务" @back="emit('back')">
    <div class="enhanced-container">
      <div class="intro-card">
        增强服务旨在通过匿名使用统计与性能数据分析，持续优化系统稳定性、续航表现与软硬件协同体验。
      </div>

      <div class="section-title">改善计划</div>
      <div class="settings-card">
        <ListCell
          title="加入用户体验改善计划"
          subtitle="允许系统收集匿名的设备使用与性能数据"
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-uep"
              :model-value="store.userExperienceProgram"
              @update:model-value="store.setUserExperienceProgram"
            />
          </template>
        </ListCell>

        <ListCell
          title="自动发送诊断报告"
          subtitle="系统异常崩溃时自动向技术团队回传日志"
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-error-report"
              :model-value="store.systemErrorReporting"
              @update:model-value="store.setSystemErrorReporting"
            />
          </template>
        </ListCell>

        <ListCell
          title="个性化智能服务"
          subtitle="根据日常使用习惯优化常用应用预加载与电量调度"
          last
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-smart-service"
              :model-value="store.smartServicePush"
              @update:model-value="store.setSmartServicePush"
            />
          </template>
        </ListCell>
      </div>

      <div class="privacy-note">
        所有收集的信息均经过差分隐私加密与脱敏处理，绝不包含任何个人敏感身份信息。您可以随时在此关闭以上选项。
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.enhanced-container {
  padding: 12px 16px 32px;
}

.intro-card {
  padding: 14px 16px;
  background: #FFFFFF;
  border-radius: 14px;
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 14px 16px 6px;
}

.privacy-note {
  margin-top: 16px;
  padding: 0 8px;
  font-size: 12px;
  color: #94A3B8;
  line-height: 1.5;
}
</style>
