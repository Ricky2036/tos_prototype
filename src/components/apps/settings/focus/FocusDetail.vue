<script setup>
import { computed, ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import LIcon from '../../../ui/LIcon.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import SheetModal from '../../../ui/SheetModal.vue'
import ActionModal from '../../../ui/ActionModal.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import FocusGlyph from './FocusGlyph.vue'
import FocusDeviceArt from './FocusDeviceArt.vue'
import FocusAllowedFlow from './FocusAllowedFlow.vue'
import FocusScreenPicker from './FocusScreenPicker.vue'
import FocusScheduleFlow from './FocusScheduleFlow.vue'
import FocusFiltersFlow from './FocusFiltersFlow.vue'
import FocusOptions from './FocusOptions.vue'
import { FOCUS_COLORS, focusShortName, formatRepeat, formatSchedule, useFocusSettingsStore } from '../../../../stores/focusSettingsStore.js'
import '../../../../styles/layer-transitions.css'

const props = defineProps({ modeId: { type: String, required: true } })
const emit = defineEmits(['back', 'deleted'])
const focus = useFocusSettingsStore()
const mode = computed(() => focus.getMode(props.modeId))
const subStack = ref([])
const isBack = ref(false)
const flowRef = ref(null)
const showDelete = ref(false)
const showEdit = ref(false)
const editDraft = ref({ name: '', icon: '', color: '' })
const subPage = computed(() => subStack.value[subStack.value.length - 1] || null)
const subComponent = computed(() => ({ allowed: FocusAllowedFlow, screens: FocusScreenPicker, schedule: FocusScheduleFlow, filters: FocusFiltersFlow, options: FocusOptions }[subPage.value?.page] || null))
const subProps = computed(() => ({ modeId: props.modeId, ...(subPage.value || {}) }))
const selectedFilters = computed(() => {
  const meta = { lowPower: ['低电量模式', 'batteryMedium'], silent: ['静音模式', 'bellOff'], alwaysOnDisplay: ['全天候显示屏', 'smartphone'], darkAppearance: ['深色外观', 'moon'], phone: ['电话', 'phone'], calendar: ['日历', 'calendarDays'], messages: ['信息', 'messageCircle'], mail: ['邮件', 'mail'], music: ['音乐', 'music'], safari: ['Safari 浏览器', 'compass'], mailMaster: ['网易邮箱大师', 'mail'], transsioner: ['Transsioner', 'sparkles'] }
  return (mode.value?.filters || []).map(id => ({ id, name: meta[id]?.[0] || id, icon: meta[id]?.[1] || 'slidersHorizontal' }))
})
const editIcons = ['smile', 'graduationCap', 'briefcase', 'book', 'dumbbell', 'flower2', 'rocket', 'car', 'moon', 'user', 'bedDouble', 'star']
const screenSlots = [{ id: 'lock' }, { id: 'home' }, { id: 'watch' }]

function openSub(page, extra = {}) {
  isBack.value = false
  subStack.value.push({ page, ...extra })
}
function closeSub() {
  isBack.value = true
  subStack.value.pop()
}
function closeAllSub() {
  isBack.value = true
  subStack.value = []
}
function back() {
  if (showDelete.value) { showDelete.value = false; return true }
  if (showEdit.value) { showEdit.value = false; return true }
  if (subPage.value) {
    if (flowRef.value?.back) return flowRef.value.back()
    closeSub()
    return true
  }
  emit('back')
  return true
}
function startEdit() {
  editDraft.value = { name: mode.value.name, icon: mode.value.icon, color: mode.value.color }
  showEdit.value = true
}
function saveEdit() {
  const name = editDraft.value.name.trim()
  if (!name) return
  focus.updateMode(props.modeId, { name, icon: editDraft.value.icon, color: editDraft.value.color })
  showEdit.value = false
}
function removeMode() {
  showDelete.value = false
  if (focus.deleteMode(props.modeId)) emit('deleted')
}
function scheduleSubtitle(schedule) {
  if (schedule.type === 'time') return formatRepeat(schedule.days)
  if (schedule.type === 'location') return '在此位置期间'
  return `使用“${schedule.name}”期间`
}
function onSubEvent(event, payload) {
  if (event === 'back') closeSub()
  else if (event === 'saved') closeAllSub()
  else if (event === 'choose-type') openSub('schedule', { type: payload })
  else if (event === 'open-filter') openSub('filters', { filterId: payload })
}
defineExpose({ back })
</script>

<template>
  <div v-if="mode" class="focus-detail" :data-focus-detail="modeId">
    <Transition :name="isBack ? 'slide-back' : 'slide'">
      <component
        :is="subComponent"
        v-if="subComponent"
        ref="flowRef"
        :key="subStack.length + JSON.stringify(subPage)"
        v-bind="subProps"
        @back="onSubEvent('back')"
        @saved="onSubEvent('saved', $event)"
        @choose-type="onSubEvent('choose-type', $event)"
        @open-filter="onSubEvent('open-filter', $event)"
      />
    </Transition>

    <template v-if="!subPage">
      <GlassNavBar overlay :title="mode.name" @back="emit('back')" />
      <div class="fd-body scrollable">
        <header class="fd-hero">
          <FocusGlyph :name="mode.icon" :color="mode.color" :size="68" :icon-size="36" />
          <h1>{{ mode.name }}</h1>
          <button type="button" data-focus-edit @click="startEdit">编辑</button>
          <span v-if="focus.state.activeId === modeId" class="fd-active-pill">已开启</span>
        </header>

        <section class="fd-section">
          <h2>{{ mode.notificationMode === 'allow' ? '允许通知' : '静音通知' }}</h2>
          <p>{{ mode.notificationMode === 'allow' ? '将允许所选联系人和 App 的通知，其他通知将静音。' : '将静音所选联系人和 App 的通知，其他通知正常提醒。' }}</p>
          <div class="fd-allowed-card">
            <div class="fd-allowed-grid">
              <button type="button" data-focus-open="people" @click="openSub('allowed', { type: 'people' })">
                <div><strong>联系人</strong><LIcon name="chevronRight" :size="17" /></div>
                <div class="fd-people-preview"><span v-for="person in mode.allowedPeople.slice(0, 4)" :key="person">{{ person.slice(0, 1) }}</span><small v-if="!mode.allowedPeople.length">都不允许</small></div>
              </button>
              <button type="button" data-focus-open="apps" @click="openSub('allowed', { type: 'apps' })">
                <div><strong>App</strong><LIcon name="chevronRight" :size="17" /></div>
                <div class="fd-app-preview"><RegisteredAppIcon v-for="appId in mode.allowedApps.slice(0, 3)" :key="appId" :app-id="appId" :size="30" /><small v-if="!mode.allowedApps.length">都不允许</small></div>
              </button>
            </div>
            <button class="fd-options-row" type="button" data-focus-open="options" @click="openSub('options')"><strong>选项</strong><LIcon name="chevronRight" :size="17" /></button>
          </div>
        </section>

        <section class="fd-section">
          <h2>自定义屏幕</h2>
          <p>选取要打开的锁屏或主屏幕页面以帮助限制干扰。</p>
          <div class="fd-screens-card" data-focus-screens>
            <button v-for="screen in screenSlots" :key="screen.id" type="button" :data-focus-screen="screen.id" @click="openSub('screens', { type: screen.id })">
              <span class="fd-screen-slot"><FocusDeviceArt :kind="screen.id" :wallpaper="mode.screens[screen.id]" :color="mode.color" /></span>
              <strong>{{ mode.screens[screen.id] ? '编辑' : '选取' }}</strong>
            </button>
          </div>
        </section>

        <section class="fd-section">
          <h2>设置定时</h2>
          <p>在设定时间、位置或使用某 App 期间，自动打开此专注模式。</p>
          <div class="fd-schedule-card">
            <div class="fd-smart-row" data-focus-smart-row><FocusGlyph name="power" :color="mode.color" :size="30" :icon-size="18" hollow /><div><strong>智能启用</strong><span>自动打开</span></div><span class="fd-tail"><ToggleSwitch :model-value="mode.smartActivation" color="blue" @update:model-value="focus.updateMode(modeId, { smartActivation: $event })" /></span></div>
            <button v-for="schedule in mode.schedules" :key="schedule.id" class="fd-schedule-row" type="button" :data-focus-schedule-id="schedule.id" @click="openSub('schedule', { scheduleId: schedule.id })">
              <FocusGlyph :name="schedule.type === 'time' ? 'clock' : schedule.type === 'location' ? 'navigation' : 'layers'" :color="mode.color" :size="30" :icon-size="17" />
              <div><strong>{{ formatSchedule(schedule) }}</strong><span>{{ scheduleSubtitle(schedule) }}</span></div>
              <small>{{ schedule.enabled ? '打开' : '关闭' }}</small><LIcon name="chevronRight" :size="17" />
            </button>
            <button class="fd-add-row" type="button" data-focus-add-schedule @click="openSub('schedule')">添加定时</button>
          </div>
        </section>

        <section class="fd-section">
          <h2>专注模式过滤条件</h2>
          <p>自定义此专注模式打开时，App 和设备的行为。</p>
          <div class="fd-filter-grid">
            <button v-for="filter in selectedFilters" :key="filter.id" type="button" :data-focus-active-filter="filter.id" @click="openSub('filters', { filterId: filter.id })"><FocusGlyph :name="filter.icon" :color="mode.color" :size="30" :icon-size="18" hollow /><LIcon name="chevronRight" :size="16" /><strong>{{ filter.name }}</strong><span>打开</span></button>
            <button class="fd-add-filter" type="button" data-focus-add-filter @click="openSub('filters')"><LIcon name="plus" :size="26" /><strong>添加过滤条件</strong></button>
          </div>
        </section>

        <button v-if="mode.custom" class="fd-delete" type="button" data-focus-delete @click="showDelete = true">删除专注模式</button>
      </div>
    </template>

    <SheetModal :visible="showEdit" @close="showEdit = false">
      <div class="fd-edit-sheet">
        <h2>编辑专注模式</h2>
        <FocusGlyph :name="editDraft.icon" :color="editDraft.color" :size="58" :icon-size="30" />
        <input v-model="editDraft.name" maxlength="20" aria-label="专注模式名称" />
        <div class="fd-edit-colors"><button v-for="color in FOCUS_COLORS" :key="color" type="button" :class="{ selected: editDraft.color === color }" :style="{ background: color }" @click="editDraft.color = color"></button></div>
        <div class="fd-edit-icons"><button v-for="icon in editIcons" :key="icon" type="button" :class="{ selected: editDraft.icon === icon }" @click="editDraft.icon = icon"><LIcon :name="icon" :size="21" /></button></div>
        <button class="fd-save-edit" type="button" :disabled="!editDraft.name.trim()" @click="saveEdit">完成</button>
      </div>
    </SheetModal>
    <ActionModal :visible="showDelete" title="删除专注模式？" :desc="`“${mode.name}”的通知、屏幕、定时和过滤条件设置都会被删除。`" cancel-text="取消" confirm-text="删除" @confirm="removeMode" @cancel="showDelete = false" @close="showDelete = false" />
  </div>
</template>

<style scoped>
.focus-detail { position: absolute; inset: 0; background: #F0F1F2; color: #111; }
.fd-body { height: 100%; box-sizing: border-box; padding: calc(var(--nav-h) + 4px) 16px 36px; }
.fd-hero { position: relative; padding: 8px 0 22px; text-align: center; }
.fd-hero h1 { margin: 10px 0 2px; font-size: 27px; line-height: 1.2; }
.fd-hero > button { border: 0; background: transparent; color: #0A84FF; font-size: 15px; cursor: pointer; }
.fd-active-pill { position: absolute; right: 4px; top: 12px; padding: 5px 10px; border-radius: 12px; background: #E5E5EA; color: #8E8E93; font-size: 12px; }
.fd-section { margin-bottom: 20px; }
.fd-section > h2 { margin: 0 6px 3px; font-size: 15px; font-weight: 600; }
.fd-section > p { margin: 0 6px 10px; color: #8E8E93; font-size: 13px; line-height: 1.4; }
.fd-allowed-card, .fd-screens-card, .fd-schedule-card { overflow: hidden; border-radius: 20px; background: #fff; }
.fd-allowed-grid { display: grid; grid-template-columns: 1fr 1fr; }
.fd-allowed-grid > button { min-height: 88px; padding: 12px; border: 0; border-right: .5px solid #E5E5EA; background: transparent; text-align: left; cursor: pointer; }
.fd-allowed-grid > button:last-child { border-right: 0; }
.fd-allowed-grid > button > div:first-child { display: flex; align-items: center; justify-content: space-between; }
.fd-allowed-grid strong, .fd-options-row strong { font-size: 16px; font-weight: 500; }
.fd-people-preview, .fd-app-preview { min-height: 34px; margin-top: 9px; display: flex; align-items: center; gap: 4px; }
.fd-people-preview > span { width: 30px; height: 30px; border-radius: 50%; background: #8E8E93; color: #fff; display: grid; place-items: center; font-size: 13px; }
.fd-people-preview small, .fd-app-preview small { color: #8E8E93; font-size: 12px; }
.fd-options-row { width: 100%; height: 48px; padding: 0 14px; border: 0; border-top: .5px solid #E5E5EA; background: transparent; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
/* 三列设备示意图：等高占位 + 底部对齐，保证「选取/编辑」共线；
   三列在卡片里摊开（space-between），不再挤在中间留两条大白边 */
.fd-screens-card { padding: 20px 20px 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.fd-screens-card > button { padding: 0; border: 0; background: transparent; display: flex; flex-direction: column; align-items: center; cursor: pointer; }
.fd-screen-slot { height: 157px; display: flex; align-items: flex-end; justify-content: center; }
.fd-screens-card > button > strong { margin-top: 7px; color: #0A84FF; font-size: 15px; font-weight: 400; line-height: 20px; }
.fd-smart-row, .fd-schedule-row { height: 58px; padding: 0 12px; border-bottom: .5px solid #E5E5EA; display: flex; align-items: center; gap: 10px; }
.fd-smart-row > div, .fd-schedule-row > div { flex: 1; min-width: 0; }
/* ⚠️ 只能选到文字块内部：`.fd-smart-row span` 会命中 FocusGlyph 的根 span，
   把图标改成 display:block 后里面的图标就不再居中（踩过） */
.fd-smart-row > div > strong, .fd-smart-row > div > span, .fd-schedule-row > div > strong, .fd-schedule-row > div > span { display: block; }
.fd-smart-row > div > strong, .fd-schedule-row > div > strong { font-size: 15px; font-weight: 500; line-height: 20px; }
.fd-smart-row > div > span, .fd-schedule-row > div > span { margin-top: 2px; color: #8E8E93; font-size: 12px; line-height: 16px; }
/* 开关的右缘与下方各行的箭头尖对齐（行内边距 12 + 箭头盒内留白 4） */
.fd-tail { display: flex; align-items: center; padding-right: 4px; }
.fd-schedule-row { width: 100%; border-top: 0; border-left: 0; border-right: 0; background: #fff; text-align: left; cursor: pointer; }
.fd-schedule-row small { color: #8E8E93; font-size: 14px; }
/* 箭头盒子的右缘在行内边距 12 处，尖端光学位置约 16；开关也按 16 收边 */
.fd-schedule-row > .l-icon { color: #C7C7CC; }
.fd-add-row { width: 100%; height: 46px; padding: 0 52px; border: 0; background: #fff; color: #0A84FF; text-align: left; font-size: 15px; cursor: pointer; }
.fd-filter-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
.fd-filter-grid > button { position: relative; min-height: 100px; padding: 12px; border: 0; border-radius: 18px; background: #fff; display: flex; flex-direction: column; align-items: flex-start; cursor: pointer; }
/* LIcon 根元素是 span，不能按 svg 选（否则箭头掉回文档流、跑到图标下面） */
.fd-filter-grid > button > .l-icon:nth-child(2) { position: absolute; top: 12px; right: 12px; color: #C7C7CC; }
.fd-filter-grid strong { margin-top: auto; padding-top: 10px; font-size: 14px; font-weight: 500; }
.fd-filter-grid span { color: #8E8E93; font-size: 12px; }
.fd-filter-grid .fd-add-filter { color: #0A84FF; }
.fd-filter-grid .fd-add-filter strong { color: #0A84FF; }
.fd-delete { width: 100%; height: 50px; border: 0; border-radius: 20px; background: #fff; color: #FF3B30; font-size: 16px; cursor: pointer; }
.fd-edit-sheet { text-align: center; }
.fd-edit-sheet h2 { margin: 0 0 14px; font-size: 18px; }
.fd-edit-sheet input { width: 100%; box-sizing: border-box; margin: 14px 0; padding: 10px; border: 0; border-bottom: 1px solid #D1D1D6; text-align: center; font-size: 18px; outline: none; }
.fd-edit-colors { display: flex; flex-wrap: wrap; justify-content: center; gap: 9px; }
.fd-edit-colors button { width: 27px; height: 27px; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 0 1px transparent; cursor: pointer; }
.fd-edit-colors button.selected { box-shadow: 0 0 0 2px #0A84FF; }
.fd-edit-icons { display: grid; grid-template-columns: repeat(6,1fr); gap: 8px; margin: 16px 0; }
.fd-edit-icons button { aspect-ratio: 1; border: 0; border-radius: 50%; background: #F2F2F7; display: grid; place-items: center; cursor: pointer; }
.fd-edit-icons button.selected { background: #5E5CE6; color: #fff; }
.fd-save-edit { width: 100%; height: 44px; border: 0; border-radius: 22px; background: #0A84FF; color: #fff; font-size: 16px; cursor: pointer; }
.fd-save-edit:disabled { opacity: .4; }
</style>
