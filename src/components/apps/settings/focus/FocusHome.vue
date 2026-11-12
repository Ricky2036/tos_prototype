<script setup>
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import FocusGlyph from './FocusGlyph.vue'
import { useFocusSettingsStore, focusShortName } from '../../../../stores/focusSettingsStore.js'

const emit = defineEmits(['back', 'open-mode', 'create'])
const focus = useFocusSettingsStore()
</script>

<template>
  <div class="focus-home" data-focus-page="home">
    <GlassNavBar overlay title="专注模式" @back="emit('back')" />
    <div class="focus-home-body scrollable">
      <div class="focus-section-title">专注模式</div>
      <div class="focus-list-card">
        <ListCell
          v-for="(mode, index) in focus.state.modes"
          :key="mode.id"
          :title="mode.name"
          :value="focus.state.activeId === mode.id ? '已开启' : ''"
          :last="index === focus.state.modes.length - 1"
          chevron
          :data-focus-mode="mode.id"
          @click="emit('open-mode', mode.id)"
        >
          <template #icon><FocusGlyph class="focus-row-glyph" :name="mode.icon" :color="mode.color" :size="34" :icon-size="19" /></template>
        </ListCell>
      </div>

      <button class="focus-new-button" type="button" data-focus-create @click="emit('create')">
        <FocusGlyph name="plus" color="#8E8E93" :size="34" :icon-size="19" hollow />
        <span>新专注模式</span>
      </button>

      <div class="focus-share-card">
        <div>
          <strong>在设备之间共享</strong>
          <p>在此设备上打开专注模式时，也会在你的其他设备上打开。</p>
        </div>
        <ToggleSwitch :model-value="focus.state.sharedAcrossDevices" @update:model-value="focus.setShared" />
      </div>
      <p class="focus-home-note">打开专注模式后，状态栏会显示对应图标。通知、屏幕与定时设置可按模式分别调整。</p>
    </div>
  </div>
</template>

<style scoped>
.focus-home { position: absolute; inset: 0; background: #F0F1F2; }
.focus-home-body { height: 100%; box-sizing: border-box; padding: calc(var(--nav-h) + 16px) 16px 32px; }
.focus-section-title { margin: 0 6px 8px; font-size: 13px; color: #8E8E93; }
.focus-list-card { overflow: hidden; border-radius: 18px; background: #fff; }
.focus-new-button { width: 100%; min-height: 58px; margin-top: 12px; padding: 10px 16px; border: 0; border-radius: 18px; background: #fff; display: flex; align-items: center; gap: 14px; color: #0A84FF; font: 500 16px/1.3 var(--font-stack); cursor: pointer; }
.focus-row-glyph { margin-right: 12px; }
.focus-new-button:active, .focus-list-card :deep(.list-cell:active) { background: #E9E9EB; }
.focus-share-card { margin-top: 22px; padding: 16px; border-radius: 18px; background: #fff; display: flex; align-items: center; gap: 14px; }
.focus-share-card > div { flex: 1; min-width: 0; }
.focus-share-card strong { display: block; font-size: 15.5px; font-weight: 500; }
.focus-share-card p { margin: 5px 0 0; color: #8E8E93; font-size: 13px; line-height: 1.45; }
.focus-home-note { margin: 10px 0 0; padding: 0 8px; color: #8E8E93; font-size: 13px; line-height: 1.45; }
</style>
