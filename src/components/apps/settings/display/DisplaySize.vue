<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useDisplaySettingsStore } from '../../../../stores/displaySettingsStore'

const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()

const MODES = [
  { value: 'standard', label: '标准模式' },
  { value: 'mini', label: '超小模式' }
]
</script>

<template>
  <SubPageShell title="显示大小" @back="emit('back')">
    <div class="size-preview">
      <div class="size-phone">
        <span class="blk lg"></span>
        <span class="blk md"></span>
        <span class="blk sm"></span>
        <span class="blk sm"></span>
        <span class="blk sm"></span>
      </div>
    </div>

    <div class="settings-card">
      <ListCell
        v-for="(m, i) in MODES"
        :key="m.value"
        :title="m.label"
        :last="i === MODES.length - 1"
        clickable
        @click="display.setDisplaySize(m.value)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: display.displaySize === m.value }"></span>
        </template>
      </ListCell>
    </div>

    <div class="section-header">效率操作</div>
    <div class="settings-card">
      <ListCell
        title="手势快启"
        subtitle="标准模式下，在屏幕上四指捏合即可快速开启超小模式。"
        last
      >
        <template #right>
          <ToggleSwitch
            :model-value="display.gestureQuickSize"
            color="blue"
            @update:model-value="v => display.setBool('gestureQuickSize', v)"
          />
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>

<style scoped>
.size-preview {
  display: flex;
  justify-content: center;
  padding: 12px 0 22px;
}

.size-phone {
  width: 108px;
  height: 180px;
  border-radius: 16px;
  border: 2px solid #C9C9CE;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
}

.blk {
  display: block;
  border-radius: 4px;
  background: #E4E4E8;
}

.blk.lg { height: 44px; }
.blk.md { height: 8px; width: 70%; }
.blk.sm { height: 8px; width: 100%; }
</style>
