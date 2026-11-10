<script setup>
import { computed, reactive, ref } from 'vue'
import LIcon from '../../../ui/LIcon.vue'
import RegisteredAppList from '../../../ui/RegisteredAppList.vue'
import SettingsSearchBar from '../../../ui/SettingsSearchBar.vue'
import FocusGlyph from './FocusGlyph.vue'
import { FOCUS_COLORS, FOCUS_TEMPLATES, useFocusSettingsStore } from '../../../../stores/focusSettingsStore.js'

const props = defineProps({ showTemplates: { type: Boolean, default: true } })
const emit = defineEmits(['cancel', 'complete'])
const focus = useFocusSettingsStore()
const step = ref(props.showTemplates ? 'templates' : 'customize')
const previousTemplate = ref('templates')
const query = ref('')
const draft = reactive({ name: '', icon: 'smile', color: '#5E5CE6', notificationMode: 'allow', allowedPeople: [], allowedApps: [] })
const iconChoices = ['smile', 'graduationCap', 'briefcase', 'book', 'dumbbell', 'flower2', 'rocket', 'car', 'moon', 'user', 'bedDouble', 'star', 'heart', 'music', 'gamepad2', 'footprints', 'palette', 'camera', 'phone', 'messageCircle', 'calendarDays', 'clock', 'home', 'sparkles']
const contacts = ['蔡', 'Ricky', '妈妈', '同事']
const steps = ['templates', 'customize', 'intro', 'people', 'apps']
const title = computed(() => step.value === 'templates' ? '' : step.value === 'customize' ? '为专注模式命名' : step.value === 'intro' ? '' : step.value === 'people' ? '选取要允许的联系人' : '选取要允许的 App')
const displayName = computed(() => draft.name ? (draft.name.endsWith('专注模式') ? draft.name : `${draft.name}专注模式`) : '新专注模式')

function chooseTemplate(template) {
  previousTemplate.value = step.value
  draft.name = template.id === 'custom' ? '' : template.name
  draft.icon = template.id === 'custom' ? 'smile' : template.icon
  draft.color = template.id === 'custom' ? '#5E5CE6' : template.color
  step.value = 'customize'
}
function next() {
  if (step.value === 'customize' && !draft.name.trim()) return
  if (step.value === 'customize') step.value = 'intro'
  else if (step.value === 'intro') step.value = 'people'
  else if (step.value === 'people') step.value = 'apps'
}
function finish() {
  const id = focus.createMode(draft)
  if (id) emit('complete', id)
}
function back() {
  if (step.value === 'apps') { step.value = 'people'; return true }
  if (step.value === 'people') { step.value = 'intro'; return true }
  if (step.value === 'intro') { step.value = 'customize'; return true }
  if (step.value === 'customize' && props.showTemplates) { step.value = 'templates'; return true }
  emit('cancel')
  return true
}
function togglePerson(person) {
  draft.allowedPeople = draft.allowedPeople.includes(person) ? draft.allowedPeople.filter(item => item !== person) : [...draft.allowedPeople, person]
}
function toggleApp(appId) {
  draft.allowedApps = draft.allowedApps.includes(appId) ? draft.allowedApps.filter(item => item !== appId) : [...draft.allowedApps, appId]
}
defineExpose({ back })
</script>

<template>
  <div class="focus-create" :class="{ 'is-templates': step === 'templates' }" :data-focus-create-step="step">
    <template v-if="step === 'templates'">
      <button class="fc-close" type="button" aria-label="关闭" @click="emit('cancel')"><LIcon name="x" :size="22" /></button>
      <div class="fc-template-heading">
        <h1>你要专注于哪方面？</h1>
        <p>选取一种专注模式以开始。</p>
      </div>
      <div class="fc-template-list">
        <button v-for="template in FOCUS_TEMPLATES" :key="template.id" type="button" :data-focus-template="template.id" @click="chooseTemplate(template)">
          <FocusGlyph :name="template.icon" :color="template.color" :size="34" :icon-size="20" :hollow="template.id === 'custom'" />
          <span>{{ template.name }}</span>
          <LIcon name="chevronRight" :size="21" />
        </button>
      </div>
    </template>

    <template v-else>
      <div class="fc-nav">
        <button type="button" aria-label="返回" @click="back"><LIcon :name="step === 'customize' || step === 'people' ? 'x' : 'chevronLeft'" :size="22" /></button>
        <strong v-if="step === 'customize'">{{ title }}</strong>
        <button v-if="step === 'customize' || step === 'people'" class="fc-next" type="button" :disabled="step === 'customize' && !draft.name.trim()" data-focus-next @click="next">{{ step === 'people' ? '下一步' : '下一步' }}</button>
        <button v-else-if="step === 'apps'" class="fc-next" type="button" data-focus-finish @click="finish">完成</button>
        <span v-else></span>
      </div>

      <div v-if="step === 'customize'" class="fc-customize scrollable">
        <FocusGlyph :name="draft.icon" :color="draft.color" :size="64" :icon-size="34" />
        <input v-model="draft.name" class="fc-name-input" data-focus-name placeholder="名称" maxlength="16" />
        <div class="fc-color-grid">
          <button v-for="color in FOCUS_COLORS" :key="color" type="button" :class="{ selected: draft.color === color }" :style="{ '--swatch': color }" :aria-label="`颜色 ${color}`" @click="draft.color = color"><span></span></button>
        </div>
        <div class="fc-icon-grid">
          <button v-for="icon in iconChoices" :key="icon" type="button" :class="{ selected: draft.icon === icon }" :data-focus-icon="icon" @click="draft.icon = icon"><LIcon :name="icon" :size="24" /></button>
        </div>
      </div>

      <div v-else-if="step === 'intro'" class="fc-intro">
        <FocusGlyph :name="draft.icon" :color="draft.color" :size="68" :icon-size="36" />
        <h1>{{ displayName }}</h1>
        <div class="fc-intro-points">
          <div><LIcon name="bellOff" :size="30" :style="{ color: draft.color }" /><span>在所有设备上静音不需要的通知。</span></div>
          <div><LIcon name="users" :size="30" :style="{ color: draft.color }" /><span>与朋友共享你已静音通知。</span></div>
          <div><LIcon name="smartphone" :size="30" :style="{ color: draft.color }" /><span>打开自定义锁屏或主屏幕页面。</span></div>
          <div><LIcon name="slidersHorizontal" :size="30" :style="{ color: draft.color }" /><span>定时以自动打开，或从控制中心打开。</span></div>
        </div>
        <button class="fc-primary" type="button" :style="{ background: draft.color }" @click="next">自定义专注模式</button>
      </div>

      <div v-else-if="step === 'people'" class="fc-selection scrollable">
        <div class="fc-selection-hero"><FocusGlyph name="users" color="#32D74B" :size="58" :icon-size="30" /><h1>选取要允许的联系人</h1></div>
        <div class="fc-mode-card">
          <button type="button" :class="{ selected: draft.notificationMode === 'silence' }" @click="draft.notificationMode = 'silence'"><LIcon name="bellOff" :size="19" /><span>静音下列通知</span><LIcon v-if="draft.notificationMode === 'silence'" name="check" :size="19" /></button>
          <button type="button" :class="{ selected: draft.notificationMode === 'allow' }" @click="draft.notificationMode = 'allow'"><LIcon name="badgeCheck" :size="19" /><span>允许下列通知</span><LIcon v-if="draft.notificationMode === 'allow'" name="check" :size="19" /></button>
        </div>
        <p>{{ displayName }}打开时，将{{ draft.notificationMode === 'allow' ? '允许所选联系人的通知。其他所有通知' : '静音所选联系人的通知。其他通知' }}将发送至“通知中心”。</p>
        <div class="fc-contact-cloud">
          <button v-for="person in contacts" :key="person" type="button" :class="{ selected: draft.allowedPeople.includes(person) }" :data-focus-person="person" @click="togglePerson(person)">
            <span>{{ person.slice(0, 1) }}</span><strong>{{ person }}</strong><LIcon :name="draft.allowedPeople.includes(person) ? 'check' : 'plus'" :size="16" />
          </button>
        </div>
      </div>

      <div v-else-if="step === 'apps'" class="fc-selection fc-apps scrollable">
        <div class="fc-selection-hero"><FocusGlyph name="grid2x2" color="#0A84FF" :size="58" :icon-size="30" /><h1>选取要允许的 App</h1></div>
        <div class="fc-mode-card">
          <button type="button" :class="{ selected: draft.notificationMode === 'silence' }" @click="draft.notificationMode = 'silence'"><LIcon name="bellOff" :size="19" /><span>静音下列通知</span><LIcon v-if="draft.notificationMode === 'silence'" name="check" :size="19" /></button>
          <button type="button" :class="{ selected: draft.notificationMode === 'allow' }" @click="draft.notificationMode = 'allow'"><LIcon name="badgeCheck" :size="19" /><span>允许下列通知</span><LIcon v-if="draft.notificationMode === 'allow'" name="check" :size="19" /></button>
        </div>
        <SettingsSearchBar v-model="query" placeholder="搜索" />
        <RegisteredAppList :query="query" @row-click="toggleApp($event.id)">
          <template #right="{ app }"><LIcon :name="draft.allowedApps.includes(app.id) ? 'checkCircle' : 'plusCircle'" :size="23" :style="{ color: draft.allowedApps.includes(app.id) ? '#0A84FF' : '#8E8E93' }" /></template>
        </RegisteredAppList>
      </div>
    </template>
  </div>
</template>

<style scoped>
.focus-create { position: absolute; inset: 0; z-index: 50; background: #F2F2F7; color: #111; font-family: var(--font-stack); }
.focus-create.is-templates { background: #fff; }
button { font-family: inherit; }
.fc-close { position: absolute; top: calc(var(--safe-top, 0px) + 10px); right: 18px; width: 38px; height: 38px; border: 0; border-radius: 50%; background: #F2F2F7; display: grid; place-items: center; cursor: pointer; }
.fc-template-heading { padding: calc(var(--safe-top, 0px) + 100px) 28px 28px; }
.fc-template-heading h1 { margin: 0 0 5px; font-size: 22px; line-height: 1.25; }
.fc-template-heading p { margin: 0; color: #8E8E93; font-size: 16px; }
.fc-template-list { display: grid; gap: 12px; padding: 0 22px; }
.fc-template-list button { height: 60px; padding: 0 18px; border: 0; border-radius: 30px; background: #F2F2F7; display: flex; align-items: center; cursor: pointer; }
.fc-template-list button > span:nth-child(2) { flex: 1; text-align: center; font-size: 16px; font-weight: 500; }
.fc-nav { height: var(--nav-h); padding: calc(var(--safe-top, 0px) + 6px) 16px 0; box-sizing: border-box; display: flex; align-items: flex-start; justify-content: space-between; }
.fc-nav > button:first-child { width: 38px; height: 38px; border: 0; border-radius: 50%; background: rgba(255,255,255,.8); display: grid; place-items: center; cursor: pointer; }
.fc-nav > strong { height: 38px; display: flex; align-items: center; font-size: 17px; }
.fc-next { min-width: 58px; height: 38px; padding: 0 14px; border: 0; border-radius: 19px; background: #fff; color: #111; font-size: 15px; cursor: pointer; }
.fc-next:disabled { color: #C7C7CC; cursor: default; }
.fc-customize { height: calc(100% - var(--nav-h)); padding: 22px 24px 40px; text-align: center; }
.fc-name-input { display: block; width: 100%; margin: 18px 0 24px; padding: 10px; border: 0; border-bottom: 1px solid #D1D1D6; background: transparent; text-align: center; outline: none; font-size: 20px; }
.fc-color-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 13px; margin-bottom: 22px; }
.fc-color-grid button { width: 34px; height: 34px; padding: 3px; border: 2px solid transparent; border-radius: 50%; background: transparent; cursor: pointer; }
.fc-color-grid button span { display: block; width: 100%; height: 100%; border-radius: 50%; background: var(--swatch); }
.fc-color-grid button.selected { border-color: var(--swatch); }
.fc-icon-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 9px; }
.fc-icon-grid button { aspect-ratio: 1; border: 0; border-radius: 50%; background: #fff; color: #3A3A3C; display: grid; place-items: center; cursor: pointer; }
.fc-icon-grid button.selected { color: #fff; background: #5E5CE6; }
.fc-intro { position: relative; height: calc(100% - var(--nav-h)); padding: 12px 28px 88px; text-align: center; }
.fc-intro h1 { margin: 14px 0 24px; font-size: 28px; }
.fc-intro-points { display: grid; gap: 28px; margin-top: 28px; text-align: left; }
.fc-intro-points > div { display: flex; align-items: center; gap: 18px; }
.fc-intro-points span { flex: 1; font-size: 15px; line-height: 1.45; }
.fc-primary { position: absolute; left: 28px; right: 28px; bottom: 24px; height: 50px; border: 0; border-radius: 25px; color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; }
.fc-selection { height: calc(100% - var(--nav-h)); padding: 8px 16px 40px; }
.fc-selection-hero { text-align: center; margin: 4px 0 20px; }
.fc-selection-hero h1 { margin: 12px 0 0; font-size: 25px; line-height: 1.25; }
.fc-mode-card { border-radius: 14px; overflow: hidden; background: #E9E9EF; }
.fc-mode-card button { width: 100%; min-height: 44px; padding: 10px 14px; border: 0; border-bottom: .5px solid #D1D1D6; background: transparent; display: flex; align-items: center; gap: 10px; font-size: 15px; cursor: pointer; }
.fc-mode-card button:last-child { border-bottom: 0; }
.fc-mode-card button span { flex: 1; text-align: left; }
.fc-mode-card button.selected { background: #F8F8FA; color: #0A84FF; }
.fc-selection > p { color: #8E8E93; font-size: 13px; line-height: 1.45; }
.fc-contact-cloud { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 16px; }
.fc-contact-cloud button { min-height: 74px; padding: 10px; border: 0; border-radius: 16px; background: #E9E9EF; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.fc-contact-cloud button > span { width: 34px; height: 34px; border-radius: 50%; background: #C7C7CC; color: #fff; display: grid; place-items: center; }
.fc-contact-cloud button strong { flex: 1; text-align: left; font-size: 14px; }
.fc-contact-cloud button.selected { background: #fff; box-shadow: inset 0 0 0 1px #0A84FF; }
.fc-apps { padding-top: 0; }
.fc-apps .fc-selection-hero { display: none; }
.fc-apps .fc-mode-card { margin-bottom: 14px; }
.fc-apps :deep(.settings-search-bar) { margin-bottom: 14px; background: #fff; }
</style>
