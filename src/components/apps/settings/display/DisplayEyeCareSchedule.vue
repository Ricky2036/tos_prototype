<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useDisplaySettingsStore } from '../../../../stores/displaySettingsStore'

/**
 * 定时开启（显示与亮度 → 护眼模式 → 定时开启）
 *
 * 真机：整页三个单选 —— 已关闭 / 定时开启 / 日落至日出（与「定时切换主题」同一形状）。
 */
const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()

const OPTIONS = [
  { value: 'off', label: '已关闭' },
  { value: 'scheduled', label: '定时开启' },
  { value: 'sunset', label: '日落至日出' }
]

function pick(v) {
  display.setEyeCareSchedule(v)
}

function label() {
  const hit = OPTIONS.find(o => o.value === display.eyeCareSchedule)
  return hit ? hit.label : '已关闭'
}
</script>

<template>
  <SubPageShell title="定时开启" @back="emit('back')">
    <div class="settings-card">
      <ListCell
        v-for="(opt, i) in OPTIONS"
        :key="opt.value"
        :title="opt.label"
        :last="i === OPTIONS.length - 1"
        clickable
        @click="pick(opt.value)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: display.eyeCareSchedule === opt.value }"></span>
        </template>
      </ListCell>
    </div>
  </SubPageShell>
</template>
