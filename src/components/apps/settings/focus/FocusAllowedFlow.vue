<script setup>
import { computed, ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import LIcon from '../../../ui/LIcon.vue'
import SettingsSearchBar from '../../../ui/SettingsSearchBar.vue'
import RegisteredAppList from '../../../ui/RegisteredAppList.vue'
import FocusGlyph from './FocusGlyph.vue'
import FocusNotificationModeCard from './FocusNotificationModeCard.vue'
import { useFocusSettingsStore } from '../../../../stores/focusSettingsStore.js'

const props = defineProps({ modeId: { type: String, required: true }, type: { type: String, default: 'people' } })
const emit = defineEmits(['back'])
const focus = useFocusSettingsStore()
const query = ref('')
const contacts = ['蔡', 'Ricky', '妈妈', '同事', '老板', '家人']
const mode = computed(() => focus.getMode(props.modeId))
const isPeople = computed(() => props.type === 'people')
</script>

<template>
  <SubPageShell v-if="mode" :title="isPeople ? '联系人' : 'App'" @back="emit('back')">
    <div class="focus-allowed" :data-focus-allowed="type">
      <FocusNotificationModeCard :mode="mode.notificationMode" @select="focus.updateMode(modeId, { notificationMode: $event })" />
      <p>{{ mode.name }}打开时，将{{ mode.notificationMode === 'allow' ? '只允许下方项目的通知，其他通知' : '静音下方项目的通知，其余通知正常' }}发送至“通知中心”。</p>

      <template v-if="isPeople">
        <div class="fa-contacts">
          <button v-for="person in contacts" :key="person" type="button" :class="{ selected: mode.allowedPeople.includes(person) }" :data-focus-person="person" @click="focus.togglePerson(modeId, person)">
            <FocusGlyph name="user" :color="mode.color" :size="40" :icon-size="21" />
            <strong>{{ person }}</strong>
            <LIcon :name="mode.allowedPeople.includes(person) ? 'checkCircle' : 'plusCircle'" :size="22" />
          </button>
        </div>
      </template>
      <template v-else>
        <SettingsSearchBar v-model="query" placeholder="搜索" />
        <RegisteredAppList :query="query" @row-click="focus.toggleApp(modeId, $event.id)">
          <template #right="{ app }"><LIcon :name="mode.allowedApps.includes(app.id) ? 'checkCircle' : 'plusCircle'" :size="23" :style="{ color: mode.allowedApps.includes(app.id) ? '#0A84FF' : '#8E8E93' }" /></template>
        </RegisteredAppList>
      </template>
    </div>
  </SubPageShell>
</template>

<style scoped>
.focus-allowed { padding-bottom: 20px; }
.focus-allowed > p { margin: 10px 2px 16px; color: #8E8E93; font-size: 12.5px; line-height: 1.45; }
.fa-contacts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.fa-contacts button { min-height: 72px; padding: 10px; border: 0; border-radius: 16px; background: #fff; display: flex; align-items: center; gap: 9px; cursor: pointer; }
.fa-contacts strong { flex: 1; text-align: left; font-size: 14px; }
.fa-contacts button.selected { box-shadow: inset 0 0 0 1px #0A84FF; color: #0A84FF; }
.focus-allowed :deep(.settings-search-bar) { margin-bottom: 14px; background: #fff; }
</style>
