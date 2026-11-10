<script setup>
import { computed, ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import LIcon from '../../../ui/LIcon.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import FocusGlyph from './FocusGlyph.vue'
import { useFocusSettingsStore } from '../../../../stores/focusSettingsStore.js'

const props = defineProps({ modeId: { type: String, required: true }, filterId: { type: String, default: '' } })
const emit = defineEmits(['back', 'open-filter', 'saved'])
const focus = useFocusSettingsStore()
const mode = computed(() => focus.getMode(props.modeId))
const appFilters = [
  { id: 'phone', name: '电话', subtitle: '按 SIM 卡过滤通话', icon: 'phone', color: '#32D74B', description: '选取 SIM 卡显示其来电和语音留言。例如，选取工作 SIM 卡，从而只显示工作相关来电和语音留言。' },
  { id: 'calendar', name: '日历', subtitle: '过滤日历', icon: 'calendarDays', color: '#FF453A', description: '选取要显示的日历及显示时间。例如，只在工作期间打开工作日历。' },
  { id: 'mailMaster', name: '网易邮箱大师', subtitle: '网易邮箱大师', icon: 'mail', color: '#FF375F', description: '选取此专注模式期间显示的邮箱账户。' },
  { id: 'messages', name: '信息', subtitle: '过滤对话', icon: 'messageCircle', color: '#32D74B', description: '选取此专注模式期间显示的信息对话。' },
  { id: 'music', name: '音乐', subtitle: '设置“使用听歌历史记录”', icon: 'music', color: '#8E8E93', description: '允许音乐根据此专注模式调整推荐与听歌历史记录。' },
  { id: 'mail', name: '邮件', subtitle: '过滤收件箱', icon: 'mail', color: '#0A84FF', description: '选取此专注模式期间显示的邮件收件箱。' },
  { id: 'safari', name: 'Safari 浏览器', subtitle: '设置用户场景或标签页组', icon: 'compass', color: '#0A84FF', description: '选取此专注模式打开时自动关联的 Safari 用户场景或标签页组。' },
  { id: 'transsioner', name: 'Transsioner', subtitle: '设置此专注模式自动关联的个人状态', icon: 'sparkles', color: '#BF5AF2', description: '设置此专注模式自动关联的个人状态。' }
]
const systemFilters = [
  { id: 'lowPower', name: '低电量模式', subtitle: '打开', icon: 'batteryMedium', color: '#5E5CE6', description: '此专注模式打开时自动打开低电量模式。' },
  { id: 'silent', name: '静音模式', subtitle: '打开', icon: 'bellOff', color: '#5E5CE6', description: '此专注模式打开时自动打开静音模式。' },
  { id: 'alwaysOnDisplay', name: '全天候显示屏', subtitle: '打开与关闭', icon: 'smartphone', color: '#5E5CE6', description: '选取此专注模式期间是否显示全天候显示屏。' },
  { id: 'darkAppearance', name: '深色外观', subtitle: '打开与关闭', icon: 'moon', color: '#5E5CE6', description: '此专注模式打开时自动切换深色外观。' }
]
const current = computed(() => [...appFilters, ...systemFilters].find(item => item.id === props.filterId))
const calendars = ['学习', '大麦', '生日', '计划的提醒事项', '中国大陆节假日', 'Siri 建议']
const selectedCalendars = ref([...(mode.value?.filterValues.calendars || [])])
const enabled = ref(mode.value?.filters.includes(props.filterId) || false)
const isSelected = id => mode.value?.filters.includes(id)
function add() {
  if (!isSelected(props.filterId)) focus.toggleFilter(props.modeId, props.filterId)
  if (props.filterId === 'calendar') focus.setFilterValue(props.modeId, 'calendars', [...selectedCalendars.value])
  emit('saved')
}
function toggleEnabled(value) {
  enabled.value = value
  if (value !== isSelected(props.filterId)) focus.toggleFilter(props.modeId, props.filterId)
}
function toggleCalendar(name) {
  selectedCalendars.value = selectedCalendars.value.includes(name) ? selectedCalendars.value.filter(item => item !== name) : [...selectedCalendars.value, name]
}
</script>

<template>
  <SubPageShell v-if="mode" :title="current ? current.name : '专注模式过滤条件'" @back="emit('back')">
    <template v-if="current && !isSelected(filterId) && filterId !== 'silent' && filterId !== 'lowPower'" #navRight><button class="filter-add" type="button" :disabled="filterId === 'calendar' && !selectedCalendars.length" @click="add">添加</button></template>

    <div v-if="!current" class="focus-filters" data-focus-filters>
      <section>
        <h2>App 过滤条件</h2>
        <p>自定义{{ mode.name }}期间的 App。此专注模式打开或关闭时，所选 App 将收到通知。</p>
        <div class="filter-grid">
          <button v-for="filter in appFilters" :key="filter.id" type="button" :data-focus-filter="filter.id" @click="emit('open-filter', filter.id)">
            <FocusGlyph :name="filter.icon" :color="filter.color" :size="30" :icon-size="18" />
            <LIcon class="filter-chevron" name="chevronRight" :size="17" />
            <strong>{{ filter.name }}</strong><span>{{ isSelected(filter.id) ? '已添加' : filter.subtitle }}</span>
          </button>
        </div>
      </section>
      <section>
        <h2>系统过滤条件</h2>
        <p>自定义此专注模式打开时的系统设置。</p>
        <div class="filter-grid">
          <button v-for="filter in systemFilters" :key="filter.id" type="button" :data-focus-filter="filter.id" @click="emit('open-filter', filter.id)">
            <FocusGlyph :name="filter.icon" :color="filter.color" :size="30" :icon-size="18" />
            <LIcon class="filter-chevron" name="chevronRight" :size="17" />
            <strong>{{ filter.name }}</strong><span>{{ isSelected(filter.id) ? '打开' : filter.subtitle }}</span>
          </button>
        </div>
      </section>
    </div>

    <div v-else class="filter-detail" :data-focus-filter-detail="filterId">
      <FocusGlyph :name="current.icon" :color="current.color" :size="64" :icon-size="34" />
      <h1>{{ current.name }}</h1>
      <p class="filter-description">{{ current.description }}</p>

      <template v-if="filterId === 'phone'">
        <h2>账户</h2><div class="filter-placeholder">无可用选项</div>
      </template>
      <template v-else-if="filterId === 'calendar'">
        <h2>日历</h2>
        <div class="calendar-card"><strong>iCloud</strong><button v-for="name in calendars.slice(0, 2)" :key="name" type="button" @click="toggleCalendar(name)"><span :class="{ checked: selectedCalendars.includes(name) }"><LIcon v-if="selectedCalendars.includes(name)" name="check" :size="14" /></span>{{ name }}</button></div>
        <div class="calendar-card"><strong>其他</strong><button v-for="name in calendars.slice(2)" :key="name" type="button" @click="toggleCalendar(name)"><span :class="{ checked: selectedCalendars.includes(name) }"><LIcon v-if="selectedCalendars.includes(name)" name="check" :size="14" /></span>{{ name }}</button></div>
      </template>
      <template v-else-if="filterId === 'alwaysOnDisplay'">
        <div class="filter-toggle-row"><span>全天候显示屏</span><ToggleSwitch :model-value="mode.filterValues.alwaysOnDisplay === 'on'" color="blue" @update:model-value="focus.setFilterValue(modeId, 'alwaysOnDisplay', $event ? 'on' : 'off')" /></div>
      </template>
      <template v-else>
        <div class="filter-toggle-row"><span>{{ current.name }}</span><ToggleSwitch :model-value="enabled" color="blue" @update:model-value="toggleEnabled" /></div>
        <p class="filter-note">此设置会随{{ mode.name }}自动切换，也可在过滤条件列表中移除。</p>
      </template>
    </div>
  </SubPageShell>
</template>

<style scoped>
.focus-filters section { margin-bottom: 20px; }
.focus-filters h2, .filter-detail h2 { margin: 0 4px 4px; font-size: 16px; }
.focus-filters section > p { margin: 0 4px 12px; color: #8E8E93; font-size: 13px; line-height: 1.45; }
.filter-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
.filter-grid > button { position: relative; min-height: 112px; padding: 12px; border: 0; border-radius: 17px; background: #fff; display: flex; flex-direction: column; align-items: flex-start; text-align: left; cursor: pointer; }
.filter-grid > button:active { background: #E9E9EB; }
.filter-grid > button > strong { margin-top: auto; padding-top: 12px; font-size: 15px; font-weight: 500; }
.filter-grid > button > span:last-child { margin-top: 2px; color: #8E8E93; font-size: 12px; line-height: 1.3; }
.filter-chevron { position: absolute; top: 15px; right: 12px; color: #C7C7CC; }
.filter-detail { padding-top: 16px; text-align: center; }
.filter-detail h1 { margin: 10px 0; font-size: 25px; }
.filter-description { margin: 0 auto 24px; max-width: 310px; font-size: 15px; line-height: 1.45; }
.filter-detail h2 { margin-top: 22px; text-align: left; color: #8E8E93; font-size: 13px; font-weight: 400; }
.filter-placeholder { padding: 16px; border-radius: 16px; background: #fff; color: #8E8E93; text-align: left; font-size: 15px; }
.calendar-card { margin-bottom: 14px; overflow: hidden; border-radius: 16px; background: #fff; text-align: left; }
.calendar-card > strong { display: block; padding: 12px 16px 6px; color: #8E8E93; font-size: 13px; font-weight: 400; }
.calendar-card button { width: 100%; min-height: 44px; padding: 0 16px; border: 0; border-bottom: .5px solid #E5E5EA; background: transparent; display: flex; align-items: center; gap: 10px; font-size: 15px; cursor: pointer; }
.calendar-card button:last-child { border-bottom: 0; }
.calendar-card button > span { width: 20px; height: 20px; border: 1.5px solid #8E8E93; border-radius: 50%; display: grid; place-items: center; }
.calendar-card button > span.checked { border-color: #0A84FF; background: #0A84FF; color: #fff; }
.filter-toggle-row { min-height: 54px; padding: 0 14px; border-radius: 16px; background: #fff; display: flex; align-items: center; justify-content: space-between; text-align: left; font-size: 16px; }
.filter-note { color: #8E8E93; font-size: 13px; line-height: 1.45; text-align: left; }
.filter-add { width: auto !important; min-width: 52px; padding: 0 12px; border-radius: 19px !important; }
.filter-add:disabled { color: #C7C7CC; }
</style>
