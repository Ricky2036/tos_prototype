<script setup>
import { computed, ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import LIcon from '../../../ui/LIcon.vue'
import FocusGlyph from './FocusGlyph.vue'
import FocusDeviceArt from './FocusDeviceArt.vue'
import { useFocusSettingsStore } from '../../../../stores/focusSettingsStore.js'

const props = defineProps({ modeId: { type: String, required: true }, type: { type: String, default: 'lock' } })
const emit = defineEmits(['back'])
const focus = useFocusSettingsStore()
const mode = computed(() => focus.getMode(props.modeId))
const selected = ref(mode.value?.screens[props.type] || '')
const title = computed(() => props.type === 'lock' ? '选取锁屏' : props.type === 'home' ? '选取主屏幕页面' : '选取 Apple Watch 表盘')
const options = computed(() => props.type === 'watch'
  ? [{ id: 'light', name: '简约浅色' }, { id: 'dark', name: '数字深色' }]
  : [{ id: 'aurora', name: '极光' }, { id: 'default', name: '抽象几何' }, { id: 'ocean', name: '海洋' }])
function confirm() {
  if (!selected.value) return
  focus.setScreen(props.modeId, props.type, selected.value)
  emit('back')
}
</script>

<template>
  <SubPageShell v-if="mode" :title="title" @back="emit('back')">
    <template #navRight><button type="button" aria-label="完成" :disabled="!selected" data-focus-screen-confirm @click="confirm"><LIcon name="check" :size="20" /></button></template>
    <div class="focus-screen-picker" :data-focus-screen-picker="type">
      <div class="fsp-hero"><FocusGlyph :name="type === 'watch' ? 'watch' : 'smartphone'" :color="mode.color" :size="52" :icon-size="27" /><h1>{{ title }}</h1></div>
      <template v-if="type !== 'watch'">
        <div class="fsp-create"><strong>创建新的{{ type === 'lock' ? '锁屏' : '主屏幕页面' }}</strong><span>从图库中挑选{{ type === 'lock' ? '锁屏' : '主屏幕页面' }}。</span></div>
        <h2>从{{ type === 'lock' ? '锁屏' : '主屏幕页面' }}中选取</h2>
      </template>
      <div class="fsp-options" :class="`is-${type}`">
        <button v-for="option in options" :key="option.id" type="button" :class="{ selected: selected === option.id }" :data-focus-screen-option="option.id" @click="selected = option.id">
          <span class="fsp-preview" :class="`is-${type}`"><FocusDeviceArt :kind="type" :scale="type === 'watch' ? 1.8 : 1.45" :wallpaper="option.id" time="09:41" /></span>
          <span class="fsp-radio"><LIcon v-if="selected === option.id" name="check" :size="16" /></span>
          <strong>{{ option.name }}</strong>
        </button>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.focus-screen-picker { padding: 0 4px 30px; text-align: center; }
.fsp-hero h1 { margin: 10px 0 24px; font-size: 26px; }
.fsp-create { padding: 16px 0; border-top: .5px solid #D1D1D6; border-bottom: .5px solid #D1D1D6; text-align: left; }
.fsp-create strong, .fsp-create span { display: block; }
.fsp-create strong { font-size: 16px; }
.fsp-create span { margin-top: 4px; color: #8E8E93; font-size: 13px; }
.focus-screen-picker h2 { margin: 24px 0 14px; text-align: left; font-size: 16px; }
.fsp-options { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }
.fsp-options > button { width: 108px; padding: 0; border: 0; background: transparent; cursor: pointer; }
/* 预览用固定高度 + 底部对齐：手机与手表形态不同，底部齐平才不显忽高忽低 */
.fsp-preview { height: 218px; display: flex; align-items: flex-end; justify-content: center; }
.fsp-preview.is-watch { height: 126px; }
.fsp-options > button.selected :deep(.fda) { outline: 3px solid #0A84FF; outline-offset: 3px; }
.fsp-radio { width: 26px; height: 26px; margin: 12px auto 6px; border: 1.5px solid #C7C7CC; border-radius: 50%; display: grid; place-items: center; color: #fff; }
.selected .fsp-radio { border-color: #0A84FF; background: #0A84FF; }
.fsp-options > button > strong { font-size: 13px; font-weight: 400; }
</style>
