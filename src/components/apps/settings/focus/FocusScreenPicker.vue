<script setup>
import { computed, ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import LIcon from '../../../ui/LIcon.vue'
import FocusGlyph from './FocusGlyph.vue'
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
          <div class="fsp-preview" :class="[`preview-${option.id}`, `preview-${type}`]">
            <template v-if="type === 'lock'"><strong>09:41</strong><span>11月10日 周二</span><FocusGlyph :name="mode.icon" :color="mode.color" :size="24" :icon-size="14" /></template>
            <template v-else-if="type === 'home'"><div class="fsp-app-grid"><i v-for="n in 12" :key="n"></i></div><div class="fsp-dock"><i v-for="n in 4" :key="n"></i></div></template>
            <template v-else><div class="fsp-watch-face"><strong>09:41</strong><span>{{ mode.name }}</span></div></template>
          </div>
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
.fsp-preview { position: relative; height: 196px; overflow: hidden; border-radius: 17px; box-shadow: 0 4px 16px rgba(0,0,0,.13); }
.fsp-options > button.selected .fsp-preview { outline: 3px solid #0A84FF; outline-offset: 2px; }
.preview-lock { display: flex; flex-direction: column; align-items: center; padding-top: 26px; color: #fff; }
.preview-lock > strong { font-size: 31px; letter-spacing: -1px; }
.preview-lock > span { margin: 5px 0 76px; font-size: 12px; }
.preview-aurora { background: linear-gradient(155deg,#13106c,#4338ca 58%,#14213d); }
.preview-default { background: linear-gradient(150deg,#b7f4d8,#38bdf8 50%,#312e81); }
.preview-ocean { background: linear-gradient(160deg,#06b6d4,#1e3a8a); }
.preview-home { padding: 20px 12px 12px; background: linear-gradient(150deg,#b7f4d8,#38bdf8 50%,#312e81); }
.preview-home.preview-aurora { background: linear-gradient(155deg,#13106c,#4338ca 58%,#14213d); }
.fsp-app-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
.fsp-app-grid i { aspect-ratio: 1; border-radius: 4px; background: rgba(255,255,255,.74); }
.fsp-dock { position: absolute; left: 8px; right: 8px; bottom: 8px; padding: 5px; border-radius: 8px; background: rgba(255,255,255,.32); display: flex; justify-content: space-around; }
.fsp-dock i { width: 14px; height: 14px; border-radius: 4px; background: rgba(255,255,255,.8); }
.fsp-radio { width: 26px; height: 26px; margin: 12px auto 6px; border: 1.5px solid #C7C7CC; border-radius: 50%; display: grid; place-items: center; color: #fff; }
.selected .fsp-radio { border-color: #0A84FF; background: #0A84FF; }
.fsp-options > button > strong { font-size: 13px; font-weight: 400; }
.fsp-options.is-watch .fsp-preview { width: 100px; height: 118px; margin: 0 auto; border-radius: 28px; background: #F5F5F7; border: 4px solid #D1D1D6; display: grid; place-items: center; }
.fsp-options.is-watch .preview-dark { background: #111; color: #fff; }
.fsp-watch-face strong, .fsp-watch-face span { display: block; }
.fsp-watch-face strong { font-size: 24px; }
.fsp-watch-face span { margin-top: 8px; font-size: 12px; }
</style>
