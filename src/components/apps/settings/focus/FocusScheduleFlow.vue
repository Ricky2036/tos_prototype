<script setup>
import { computed, reactive, ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import LIcon from '../../../ui/LIcon.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import TimePickerSheet from '../../../ui/TimePickerSheet.vue'
import SettingsSearchBar from '../../../ui/SettingsSearchBar.vue'
import RegisteredAppList from '../../../ui/RegisteredAppList.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import FocusGlyph from './FocusGlyph.vue'
import { FOCUS_WEEKDAYS, useFocusSettingsStore } from '../../../../stores/focusSettingsStore.js'

const props = defineProps({ modeId: { type: String, required: true }, scheduleId: { type: String, default: '' }, type: { type: String, default: '' } })
const emit = defineEmits(['back', 'saved', 'choose-type'])
const focus = useFocusSettingsStore()
const mode = computed(() => focus.getMode(props.modeId))
const existing = computed(() => mode.value?.schedules.find(item => item.id === props.scheduleId))
const kind = computed(() => props.type || existing.value?.type || 'choices')
const draft = reactive({
  start: existing.value?.start || '09:00', end: existing.value?.end || '17:00',
  days: [...(existing.value?.days || [0, 1, 2, 3, 4, 5, 6])],
  enabled: existing.value?.enabled !== false,
  name: existing.value?.name || '', address: existing.value?.address || '', appId: existing.value?.appId || ''
})
const timeTarget = ref(null)
const query = ref('')
const locations = [
  { name: '南山云科技大厦', address: '深圳市南山区粤海街道' },
  { name: '深圳湾万象城', address: '深圳市南山区科苑南路' },
  { name: '腾讯滨海大厦', address: '深圳市南山区海天二路' },
  { name: '家', address: '深圳市南山区' },
  { name: '公司', address: '深圳市南山区科技园' }
]
const visibleLocations = computed(() => locations.filter(item => !query.value || `${item.name}${item.address}`.includes(query.value)))
const title = computed(() => kind.value === 'choices' ? '添加定时' : kind.value === 'time' ? '时间' : kind.value === 'location' ? '位置' : 'App')
const canSave = computed(() => kind.value === 'time' ? draft.days.length > 0 : kind.value === 'location' ? Boolean(draft.name) : Boolean(draft.appId))
function toggleDay(day) {
  draft.days = draft.days.includes(day) ? draft.days.filter(item => item !== day) : [...draft.days, day]
}
function save() {
  if (!canSave.value) return
  const payload = kind.value === 'time'
    ? { type: 'time', start: draft.start, end: draft.end, days: [...draft.days], enabled: draft.enabled }
    : kind.value === 'location'
      ? { type: 'location', name: draft.name, address: draft.address, enabled: draft.enabled }
      : { type: 'app', appId: draft.appId, name: draft.name, enabled: draft.enabled }
  const id = existing.value ? props.scheduleId : focus.addSchedule(props.modeId, payload)
  if (existing.value) focus.updateSchedule(props.modeId, props.scheduleId, payload)
  emit('saved', id)
}
function chooseApp(app) {
  draft.appId = app.id
  draft.name = app.name
}
function onTimeConfirm(value) {
  if (timeTarget.value === 'start') draft.start = value
  else draft.end = value
  timeTarget.value = null
}
function remove() {
  focus.removeSchedule(props.modeId, props.scheduleId)
  emit('saved', null)
}
function back() {
  if (timeTarget.value) { timeTarget.value = null; return true }
  emit('back')
  return true
}
defineExpose({ back })
</script>

<template>
  <SubPageShell v-if="mode" :title="title" @back="emit('back')">
    <template v-if="kind !== 'choices'" #navRight><button type="button" aria-label="完成" :disabled="!canSave" data-focus-schedule-save @click="save"><LIcon name="check" :size="20" /></button></template>

    <div v-if="kind === 'choices'" class="focus-schedule-choices" data-focus-schedule="choices">
      <h2>设置定时</h2>
      <p>在设定时间、位置或使用某 App 期间，自动打开此专注模式。</p>
      <div class="settings-card">
        <ListCell title="时间" subtitle="例如：“12:30–02:30”" chevron data-focus-schedule-type="time" @click="emit('choose-type', 'time')"><template #icon><FocusGlyph name="clock" :color="mode.color" :size="32" :icon-size="18" /></template></ListCell>
        <ListCell title="位置" subtitle="例如：“到工作地点时”" chevron data-focus-schedule-type="location" @click="emit('choose-type', 'location')"><template #icon><FocusGlyph name="navigation" :color="mode.color" :size="32" :icon-size="18" /></template></ListCell>
        <ListCell title="App" subtitle="例如：“我打开‘图书’时”" chevron last data-focus-schedule-type="app" @click="emit('choose-type', 'app')"><template #icon><FocusGlyph name="layers" :color="mode.color" :size="32" :icon-size="18" /></template></ListCell>
      </div>
    </div>

    <div v-else-if="kind === 'time'" class="focus-time-editor" data-focus-schedule="time">
      <h2>时间</h2>
      <div class="settings-card time-card">
        <button type="button" data-focus-time-target="start" @click="timeTarget = 'start'"><span>从</span><strong :class="{ active: timeTarget === 'start' }">{{ draft.start }}</strong></button>
        <button type="button" data-focus-time-target="end" @click="timeTarget = 'end'"><span>至</span><strong :class="{ active: timeTarget === 'end' }">{{ draft.end }}</strong></button>
        <div class="weekday-row">
          <button v-for="(label, day) in FOCUS_WEEKDAYS" :key="day" type="button" :class="{ selected: draft.days.includes(day) }" :data-focus-weekday="day" @click="toggleDay(day)">{{ label }}</button>
        </div>
      </div>
      <p>{{ draft.days.length === 7 ? '每天' : '选择重复日期' }}</p>
      <div class="settings-card enabled-row"><span>启用此定时</span><ToggleSwitch v-model="draft.enabled" color="blue" /></div>
      <button v-if="existing" class="delete-schedule" type="button" @click="remove">删除定时</button>
    </div>

    <div v-else-if="kind === 'location'" class="focus-location-editor" data-focus-schedule="location">
      <SettingsSearchBar v-model="query" placeholder="搜索位置或地址" />
      <div class="location-results settings-card">
        <button v-for="location in visibleLocations" :key="location.name" type="button" :class="{ selected: draft.name === location.name }" :data-focus-location="location.name" @click="draft.name = location.name; draft.address = location.address">
          <FocusGlyph name="navigation" color="#FF375F" :size="30" :icon-size="17" />
          <span><strong>{{ location.name }}</strong><small>{{ location.address }}</small></span>
          <LIcon v-if="draft.name === location.name" name="checkCircle" :size="22" />
        </button>
      </div>
      <div v-if="existing" class="settings-card enabled-row"><span>在此位置期间</span><ToggleSwitch v-model="draft.enabled" color="blue" /></div>
      <button v-if="existing" class="delete-schedule" type="button" @click="remove">删除定时</button>
    </div>

    <div v-else class="focus-app-editor" data-focus-schedule="app">
      <p>使用所选 App 期间，自动打开此专注模式。</p>
      <div v-if="draft.appId" class="selected-app"><RegisteredAppIcon :app-id="draft.appId" :size="38" /><strong>{{ draft.name }}</strong><LIcon name="checkCircle" :size="22" /></div>
      <RegisteredAppList @row-click="chooseApp">
        <template #right="{ app }"><LIcon :name="draft.appId === app.id ? 'checkCircle' : 'circle'" :size="22" :style="{ color: draft.appId === app.id ? '#0A84FF' : '#C7C7CC' }" /></template>
      </RegisteredAppList>
      <div v-if="existing" class="settings-card enabled-row"><span>使用 App 期间</span><ToggleSwitch v-model="draft.enabled" color="blue" /></div>
      <button v-if="existing" class="delete-schedule" type="button" @click="remove">删除定时</button>
    </div>

    <TimePickerSheet
      :visible="Boolean(timeTarget)"
      :title="timeTarget === 'start' ? '开始时间' : '结束时间'"
      :model-value="timeTarget === 'end' ? draft.end : draft.start"
      @confirm="onTimeConfirm"
      @cancel="timeTarget = null"
      @close="timeTarget = null"
    />
  </SubPageShell>
</template>

<style scoped>
h2 { margin: 0 4px 4px; font-size: 16px; }
p { margin: 0 4px 12px; color: #8E8E93; font-size: 13px; line-height: 1.45; }
.time-card { overflow: visible; }
.time-card > button { width: 100%; min-height: 44px; padding: 0 16px; border: 0; border-bottom: .5px solid #E5E5EA; background: #fff; display: flex; align-items: center; justify-content: space-between; font-size: 16px; cursor: pointer; }
.time-card > button:first-child { border-radius: 16px 16px 0 0; }
.time-card > button strong { min-width: 76px; padding: 6px 10px; border-radius: 10px; background: #F2F2F7; font-size: 16px; font-weight: 400; }
.time-card > button strong.active { color: #0A84FF; }
.weekday-row { display: flex; justify-content: space-between; padding: 12px 24px; }
.weekday-row button { width: 33px; height: 33px; border: 0; border-radius: 50%; background: transparent; color: #3A3A3C; font-size: 15px; cursor: pointer; }
.weekday-row button.selected { background: #5E5CE6; color: #fff; }
.enabled-row { min-height: 50px; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; font-size: 15px; }
.delete-schedule { width: 100%; height: 48px; border: 0; border-radius: 16px; background: #fff; color: #FF3B30; font-size: 16px; cursor: pointer; }
.focus-location-editor :deep(.settings-search-bar) { margin-bottom: 14px; background: #fff; }
.location-results { overflow: hidden; }
.location-results > button { width: 100%; min-height: 60px; padding: 9px 12px; border: 0; border-bottom: .5px solid #E5E5EA; background: #fff; display: flex; align-items: center; gap: 10px; text-align: left; cursor: pointer; }
.location-results > button:last-child { border-bottom: 0; }
.location-results > button > span:nth-child(2) { flex: 1; }
.location-results strong, .location-results small { display: block; }
.location-results strong { font-size: 15px; }
.location-results small { margin-top: 3px; color: #8E8E93; font-size: 12px; }
.location-results > button.selected { color: #0A84FF; }
.selected-app { margin-bottom: 12px; padding: 12px; border-radius: 16px; background: #fff; display: flex; align-items: center; gap: 10px; }
.selected-app strong { flex: 1; }
</style>
