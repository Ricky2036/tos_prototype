<script setup>
import { ref, watch } from 'vue'
import LIcon from '../../ui/LIcon.vue'
import FocusGlyph from '../../apps/settings/focus/FocusGlyph.vue'
import FocusCreateFlow from '../../apps/settings/focus/FocusCreateFlow.vue'
import { focusShortName, useFocusSettingsStore } from '../../../stores/focusSettingsStore.js'

const props = defineProps({ visible: { type: Boolean, default: false } })
const emit = defineEmits(['close', 'open-settings'])
const focus = useFocusSettingsStore()
const creating = ref(false)
const createRef = ref(null)
watch(() => props.visible, value => { if (!value) creating.value = false })
function select(id) {
  focus.toggle(id)
  emit('close')
}
function openMode(id) {
  emit('open-settings', { modeId: id })
}
function created(id) {
  emit('open-settings', { modeId: id })
}
function back() {
  if (creating.value && createRef.value?.back) return createRef.value.back()
  if (creating.value) { creating.value = false; return true }
  emit('close')
  return true
}
defineExpose({ back })
</script>

<template>
  <Transition name="focus-switcher-fade">
    <div v-if="visible" class="focus-switcher" data-cc-focus-switcher @click.self.stop="emit('close')">
      <FocusCreateFlow v-if="creating" ref="createRef" @cancel="creating = false" @complete="created" />
      <div v-else class="focus-switcher-panel">
        <div class="focus-switcher-list">
          <div v-for="mode in focus.state.modes" :key="mode.id" class="focus-switcher-row" :class="{ active: focus.state.activeId === mode.id }" :data-cc-focus-mode="mode.id">
            <button class="focus-switcher-main" type="button" @click="select(mode.id)">
              <FocusGlyph :name="mode.icon" :color="focus.state.activeId === mode.id ? mode.color : '#8E8E93'" :size="38" :icon-size="21" />
              <span><strong>{{ focusShortName(mode) }}</strong><small v-if="mode.id === 'dnd'">静音所有通知</small><small v-else-if="focus.state.activeId === mode.id">已开启</small></span>
            </button>
            <button class="focus-switcher-more" type="button" :aria-label="`${mode.name}设置`" :data-cc-focus-settings="mode.id" @click="openMode(mode.id)"><LIcon name="moreHorizontal" :size="21" /></button>
          </div>
        </div>
        <button class="focus-switcher-new" type="button" data-cc-focus-create @click="creating = true"><span><LIcon name="plus" :size="24" /></span><strong>新专注模式</strong></button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.focus-switcher { position: absolute; inset: 0; z-index: 80; background: rgba(28,28,30,.48); backdrop-filter: blur(20px) saturate(120%); -webkit-backdrop-filter: blur(20px) saturate(120%); }
.focus-switcher-panel { position: absolute; inset: 0; padding: 210px 34px 34px; display: flex; flex-direction: column; justify-content: space-between; }
.focus-switcher-list { display: grid; gap: 10px; }
.focus-switcher-row { height: 58px; border: 1px solid rgba(255,255,255,.42); border-radius: 29px; background: rgba(255,255,255,.18); box-shadow: inset 0 1px 0 rgba(255,255,255,.16); display: flex; align-items: center; color: #fff; overflow: hidden; }
.focus-switcher-row.active { background: rgba(255,255,255,.32); box-shadow: inset 0 0 0 1px rgba(94,92,230,.65), 0 0 18px rgba(94,92,230,.22); }
.focus-switcher-main { height: 100%; flex: 1; min-width: 0; padding: 0 0 0 12px; border: 0; background: transparent; color: inherit; display: flex; align-items: center; cursor: pointer; text-align: left; }
.focus-switcher-main > span:nth-child(2) { flex: 1; text-align: center; }
.focus-switcher-main strong, .focus-switcher-main small { display: block; }
.focus-switcher-main strong { font-size: 15px; font-weight: 500; }
.focus-switcher-main small { margin-top: 1px; color: rgba(255,255,255,.72); font-size: 12px; }
.focus-switcher-more { width: 50px; height: 100%; border: 0; background: transparent; color: #fff; display: grid; place-items: center; cursor: pointer; }
.focus-switcher-new { align-self: center; padding: 0; border: 0; background: transparent; color: #fff; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
.focus-switcher-new > span { width: 48px; height: 48px; border: 1px solid rgba(255,255,255,.42); border-radius: 50%; background: rgba(255,255,255,.18); display: grid; place-items: center; }
.focus-switcher-new strong { font-size: 13px; font-weight: 400; }
.focus-switcher-fade-enter-active, .focus-switcher-fade-leave-active { transition: opacity .22s ease; }
.focus-switcher-fade-enter-from, .focus-switcher-fade-leave-to { opacity: 0; }
.focus-switcher-fade-enter-active .focus-switcher-panel { transition: transform .32s cubic-bezier(.22,1,.36,1); }
.focus-switcher-fade-enter-from .focus-switcher-panel { transform: translateY(16px) scale(.98); }
</style>
