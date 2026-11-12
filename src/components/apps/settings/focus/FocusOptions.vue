<script setup>
import { computed } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useFocusSettingsStore } from '../../../../stores/focusSettingsStore.js'

const props = defineProps({ modeId: { type: String, required: true } })
const emit = defineEmits(['back'])
const focus = useFocusSettingsStore()
const mode = computed(() => focus.getMode(props.modeId))
</script>

<template>
  <SubPageShell v-if="mode" title="选项" @back="emit('back')">
    <div class="focus-options" data-focus-options>
      <h2>锁屏</h2>
      <div class="settings-card option-row"><div><strong>暗淡锁屏</strong><span>降低锁屏亮度并隐藏部分视觉内容。</span></div><ToggleSwitch :model-value="mode.options.dimLockScreen" color="blue" @update:model-value="focus.setOption(modeId, 'dimLockScreen', $event)" /></div>
      <div class="settings-card option-row"><div><strong>隐藏通知标记</strong><span>主屏幕 App 图标不显示通知数量。</span></div><ToggleSwitch :model-value="mode.options.hideBadges" color="blue" @update:model-value="focus.setOption(modeId, 'hideBadges', $event)" /></div>
      <h2>通知</h2>
      <div class="settings-card option-row"><div><strong>静音通知</strong><span>非允许的通知将静音并发送至通知中心。</span></div><ToggleSwitch :model-value="mode.options.silenceNotifications" color="blue" @update:model-value="focus.setOption(modeId, 'silenceNotifications', $event)" /></div>
      <p>这些选项只影响{{ mode.name }}，不会改变其他专注模式。</p>
    </div>
  </SubPageShell>
</template>

<style scoped>
.focus-options h2 { margin: 4px 4px 7px; color: #8E8E93; font-size: 13px; font-weight: 400; }
.option-row { min-height: 66px; padding: 12px 14px; display: flex; align-items: center; gap: 12px; }
.option-row > div { flex: 1; }
.option-row strong, .option-row span { display: block; }
.option-row strong { font-size: 15.5px; font-weight: 500; }
.option-row span { margin-top: 4px; color: #8E8E93; font-size: 13px; line-height: 1.35; }
.focus-options > p { margin: 10px 5px; color: #8E8E93; font-size: 13px; line-height: 1.45; }
</style>
