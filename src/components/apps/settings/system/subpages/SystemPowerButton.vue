<script setup>
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const store = useSystemSettingsStore()

function selectOption(opt) {
  store.setLongPressPower(opt)
}
</script>

<template>
  <SubPageShell title="按住电源按钮" data-test="subpage-power" @back="emit('back')">
    <div class="power-container">
      <div class="tip-card">
        按住侧边电源按钮约 0.5 秒可触发所选操作。如果需要强制重启手机，可同时长按电源键和音量上键 10 秒以上。
      </div>

      <div class="section-title">按住行为</div>
      <div class="settings-card">
        <ListCell
          data-test="power-opt-assistant"
          title="访问数字助理"
          subtitle="按住电源按钮以快速唤醒数字助理"
          @click="selectOption('assistant')"
        >
          <template #right>
            <div class="radio-circle" :class="{ checked: store.longPressPower === 'assistant' }">
              <div v-if="store.longPressPower === 'assistant'" class="radio-dot"></div>
            </div>
          </template>
        </ListCell>

        <ListCell
          data-test="power-opt-power-menu"
          title="电源菜单"
          subtitle="按住电源按钮以显示关机和重新启动菜单"
          last
          @click="selectOption('powerMenu')"
        >
          <template #right>
            <div class="radio-circle" :class="{ checked: store.longPressPower === 'powerMenu' }">
              <div v-if="store.longPressPower === 'powerMenu'" class="radio-dot"></div>
            </div>
          </template>
        </ListCell>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.power-container {
  padding: 12px 0 32px;
}

.tip-card {
  padding: 14px 16px;
  background: #FFFFFF;
  border-radius: 12px;
  font-size: 13px;
  color: #64748B;
  line-height: 1.5;
  margin-bottom: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 12px 16px 6px;
}

.radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.radio-circle.checked {
  border-color: #007AFF;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #007AFF;
}
</style>
