<script setup>
import { computed, reactive, ref } from 'vue'
import LIcon from '../../../ui/LIcon.vue'
import RegisteredAppList from '../../../ui/RegisteredAppList.vue'
import SettingsSearchBar from '../../../ui/SettingsSearchBar.vue'
import FocusGlyph from './FocusGlyph.vue'
import FocusNotificationModeCard from './FocusNotificationModeCard.vue'
import SheetModal from '../../../ui/SheetModal.vue'
import { FOCUS_COLORS, FOCUS_TEMPLATES, useFocusSettingsStore } from '../../../../stores/focusSettingsStore.js'

const props = defineProps({ showTemplates: { type: Boolean, default: true } })
const emit = defineEmits(['cancel', 'complete'])
const focus = useFocusSettingsStore()
const step = ref(props.showTemplates ? 'templates' : 'customize')
const previousTemplate = ref('templates')
const query = ref('')
const showPeoplePicker = ref(false)
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
        <strong v-else-if="step === 'apps'" class="fc-nav-title">App</strong>
        <button v-if="step === 'customize' || step === 'people'" class="fc-next" type="button" :disabled="step === 'customize' && !draft.name.trim()" data-focus-next @click="next">下一步</button>
        <button v-else-if="step === 'apps'" class="fc-next fc-done" type="button" aria-label="完成" data-focus-finish @click="finish"><LIcon name="check" :size="21" /></button>
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
        <FocusGlyph :name="draft.icon" :color="draft.color" :size="48" :icon-size="24" />
        <h1>{{ displayName }}</h1>
        <div class="fc-intro-points">
          <div><LIcon name="bellOff" :size="25" :style="{ color: draft.color }" /><span>在所有设备上静音不需要的通知。</span></div>
          <div><LIcon name="users" :size="25" :style="{ color: draft.color }" /><span>与朋友共享你已静音通知。</span></div>
          <div><LIcon name="smartphone" :size="25" :style="{ color: draft.color }" /><span>打开自定义锁屏或主屏幕页面。</span></div>
          <div><LIcon name="slidersHorizontal" :size="25" :style="{ color: draft.color }" /><span>定时以自动打开，或从控制中心打开。</span></div>
        </div>
        <button class="fc-primary" type="button" :style="{ background: draft.color }" @click="next">自定义专注模式</button>
      </div>

      <div v-else-if="step === 'people'" class="fc-selection scrollable">
        <div class="fc-selection-hero fc-people-hero" data-focus-people-hero>
          <span class="fc-people-check"><LIcon name="check" :size="13" :stroke-width="3" /></span>
          <span class="fc-people-card" aria-hidden="true">
            <span class="fc-people-avatar"><LIcon name="user" :size="15" /></span>
            <span class="fc-people-lines"><i /><i /><i /></span>
          </span>
          <h1>选取要允许的联系人</h1>
        </div>
        <FocusNotificationModeCard :mode="draft.notificationMode" @select="draft.notificationMode = $event" />
        <p>{{ displayName }}打开时，将{{ draft.notificationMode === 'allow' ? '允许所选联系人的通知。其他所有通知' : '静音所选联系人的通知。其他通知' }}将发送至“通知中心”。</p>
        <div v-if="draft.allowedPeople.length" class="fc-people-chips">
          <button v-for="person in draft.allowedPeople" :key="person" type="button" :data-focus-person="person" @click="togglePerson(person)">
            <span class="fc-chip-avatar">{{ person.slice(0, 1) }}</span><strong>{{ person }}</strong>
            <span class="fc-chip-remove"><LIcon name="x" :size="13" :stroke-width="2.4" /></span>
          </button>
        </div>
        <button class="fc-add-person" type="button" data-focus-add-person @click="showPeoplePicker = true">
          <span class="fc-add-plus"><LIcon name="plus" :size="24" /></span>
          <strong>添加</strong>
        </button>
      </div>

      <div v-else-if="step === 'apps'" class="fc-selection fc-apps scrollable">
        <SettingsSearchBar v-model="query" placeholder="搜索" />
        <RegisteredAppList :query="query" @row-click="toggleApp($event.id)">
          <template #right="{ app }"><LIcon :name="draft.allowedApps.includes(app.id) ? 'checkCircle' : 'plusCircle'" :size="23" :style="{ color: draft.allowedApps.includes(app.id) ? '#0A84FF' : '#8E8E93' }" /></template>
        </RegisteredAppList>
      </div>
    </template>

    <SheetModal :visible="showPeoplePicker" @close="showPeoplePicker = false">
      <div class="fc-people-picker" data-focus-people-picker>
        <h2>添加联系人</h2>
        <div class="fc-picker-list">
          <button v-for="person in contacts" :key="person" type="button" :class="{ selected: draft.allowedPeople.includes(person) }" :data-focus-pick-person="person" @click="togglePerson(person)">
            <span class="fc-picker-avatar">{{ person.slice(0, 1) }}</span>
            <strong>{{ person }}</strong>
            <span class="fc-picker-check"><LIcon v-if="draft.allowedPeople.includes(person)" name="check" :size="17" :stroke-width="2.6" /></span>
          </button>
        </div>
        <button class="fc-picker-done" type="button" data-focus-picker-done @click="showPeoplePicker = false">完成</button>
      </div>
    </SheetModal>
  </div>
</template>

<style scoped>
.focus-create {
  position: absolute;
  inset: 0;
  z-index: 50;
  overflow: hidden;
  background: #fff;
  color: #111;
  font-family: var(--font-stack);
}
button { font-family: inherit; }
.fc-close {
  position: absolute;
  top: calc(var(--safe-top, 0px) + 10px);
  right: 18px;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: #F2F2F7;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.fc-template-heading { padding: calc(var(--safe-top, 0px) + 100px) 28px 28px; }
.fc-template-heading h1 { margin: 0 0 5px; font-size: 22px; line-height: 1.25; }
.fc-template-heading p { margin: 0; color: #8E8E93; font-size: 16px; }
.fc-template-list { display: grid; gap: 12px; padding: 0 22px; }
.fc-template-list button { height: 60px; padding: 0 18px; border: 0; border-radius: 30px; background: #F2F2F7; display: flex; align-items: center; cursor: pointer; }
.fc-template-list button > span:nth-child(2) { flex: 1; text-align: center; font-size: 16px; font-weight: 500; }
.fc-nav {
  position: relative;
  z-index: 2;
  height: var(--nav-h);
  padding: calc(var(--safe-top, 0px) + 6px) 16px 0;
  box-sizing: border-box;
  background: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.fc-nav > button:first-child,
.fc-next {
  height: 38px;
  border: 0;
  background: #fff;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.08);
  cursor: pointer;
}
.fc-nav > button:first-child {
  width: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}
.fc-nav > strong {
  height: 38px;
  display: flex;
  align-items: center;
  font-size: 17px;
  font-weight: 600;
}
.fc-nav-title { position: absolute; left: 50%; transform: translateX(-50%); }
.fc-next {
  min-width: 72px;
  padding: 0 14px;
  border-radius: 19px;
  color: #111;
  font-size: 15px;
}
.fc-next:disabled { color: #C7C7CC; cursor: default; }
.fc-next.fc-done {
  width: 38px;
  min-width: 38px;
  padding: 0;
  border-radius: 50%;
  background: #0A84FF;
  color: #fff;
  box-shadow: none;
  display: grid;
  place-items: center;
}
.fc-customize { height: calc(100% - var(--nav-h)); padding: 22px 24px 40px; text-align: center; }
.fc-name-input { display: block; width: 100%; margin: 18px 0 24px; padding: 10px; border: 0; border-bottom: 1px solid #D1D1D6; background: transparent; text-align: center; outline: none; font-size: 20px; }
.fc-color-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 13px; margin-bottom: 22px; }
.fc-color-grid button { width: 34px; height: 34px; padding: 3px; border: 2px solid transparent; border-radius: 50%; background: transparent; cursor: pointer; }
.fc-color-grid button span { display: block; width: 100%; height: 100%; border-radius: 50%; background: var(--swatch); }
.fc-color-grid button.selected { border-color: var(--swatch); }
.fc-icon-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 9px; }
.fc-icon-grid button { aspect-ratio: 1; border: 0; border-radius: 50%; background: #F2F2F7; color: #3A3A3C; display: grid; place-items: center; cursor: pointer; }
.fc-icon-grid button.selected { color: #fff; background: #5E5CE6; }
.fc-intro {
  position: relative;
  height: calc(100% - var(--nav-h));
  padding: 6px 28px 88px;
  text-align: center;
}
.fc-intro h1 { margin: 14px 0 20px; font-size: 26px; line-height: 1.2; }
.fc-intro-points { display: grid; gap: 40px; margin-top: 30px; text-align: left; }
.fc-intro-points > div { display: flex; align-items: center; gap: 15px; }
.fc-intro-points > div > span:nth-child(2) { flex: 1; font-size: 13px; line-height: 1.45; }
.fc-primary {
  position: absolute;
  left: 30px;
  right: 30px;
  bottom: 31px;
  height: 44px;
  border: 0;
  border-radius: 22px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.fc-selection { height: calc(100% - var(--nav-h)); padding: 9px 16px 40px; }
.fc-selection-hero { text-align: center; margin: 4px 0 18px; }
.fc-selection-hero h1 { margin: 12px 0 0; font-size: 26px; line-height: 1.25; }
.fc-people-hero {
  position: relative;
  height: 104px;
  margin-bottom: 12px;
}
.fc-people-hero h1 {
  position: absolute;
  left: 0;
  right: 0;
  top: 62px;
  margin: 0;
}
.fc-people-card {
  position: absolute;
  left: 50%;
  top: 7px;
  width: 174px;
  height: 50px;
  margin-left: -67px;
  box-sizing: border-box;
  border-radius: 12px;
  background: #F2F2F7;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
}
.fc-people-avatar {
  width: 29px;
  height: 29px;
  border-radius: 50%;
  background: #E2E2E7;
  color: #AEAEB2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.fc-people-lines { flex: 1; display: grid; gap: 5px; }
.fc-people-lines i { display: block; height: 4px; border-radius: 2px; background: #D8D8DD; }
.fc-people-lines i:nth-child(2) { width: 82%; }
.fc-people-lines i:nth-child(3) { width: 62%; }
.fc-people-check {
  position: absolute;
  left: 50%;
  top: 0;
  z-index: 1;
  width: 25px;
  height: 25px;
  margin-left: -101px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #34C759;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.fc-selection > p {
  margin: 9px 14px 0;
  color: #8E8E93;
  font-size: 12.5px;
  line-height: 15px;
}
/* 已添加的联系人：胶囊行 + 右侧移除，未添加时整块不出现 */
.fc-people-chips { display: grid; gap: 8px; margin-top: 16px; }
.fc-people-chips button {
  width: 100%;
  min-height: 52px;
  padding: 8px 14px;
  border: 0;
  border-radius: 16px;
  background: #fff;
  box-shadow: inset 0 0 0 .5px rgba(60, 60, 67, .1);
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.fc-chip-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #C7C7CC;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 13px;
}
.fc-people-chips button strong { flex: 1; text-align: left; font-size: 15px; font-weight: 500; }
.fc-chip-remove {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #E5E5EA;
  color: #6E6E73;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
/* 「添加」空槽：真机是淡紫灰大块，左侧圆形加号 + 蓝色「添加」 */
.fc-add-person {
  width: 100%;
  margin-top: 16px;
  padding: 12px 18px 12px;
  border: 0;
  border-radius: 16px;
  background: #ECEBF4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
}
.fc-add-plus {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #F7F7FB;
  color: #0A84FF;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.fc-add-person strong { color: #0A84FF; font-size: 13px; font-weight: 400; }
/* 选人弹层 */
.fc-people-picker h2 { margin: 0 0 12px; font-size: 17px; text-align: center; }
.fc-picker-list { display: grid; gap: 2px; }
.fc-picker-list button {
  width: 100%;
  min-height: 50px;
  padding: 8px 6px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}
.fc-picker-list button:active { background: #F2F2F7; }
.fc-picker-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #C7C7CC;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 14px;
}
.fc-picker-list button strong { flex: 1; text-align: left; font-size: 15px; font-weight: 500; }
.fc-picker-check { width: 22px; height: 22px; color: #0A84FF; display: inline-flex; align-items: center; justify-content: center; }
.fc-picker-done { width: 100%; height: 44px; margin-top: 14px; border: 0; border-radius: 22px; background: #0A84FF; color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; }
.fc-apps { padding-top: 18px; }
.fc-apps :deep(.settings-search-bar) { margin-bottom: 14px; background: #fff; }
.fc-apps :deep(.registered-app-list) { margin-top: 20px; }
</style>
