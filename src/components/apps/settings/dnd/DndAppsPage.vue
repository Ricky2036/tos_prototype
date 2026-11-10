<script setup>
import { ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import SettingsSearchDock from '../../../ui/SettingsSearchDock.vue'
import RegisteredAppList from '../../../ui/RegisteredAppList.vue'
import { useDndSettingsStore } from '../../../../stores/dndSettingsStore.js'

/**
 * 真机「应用提醒」三级页：说明 + 应用开关清单 + 底部悬浮搜索框。
 * ⚠️ 应用名单与图标一律走全仓标准 `RegisteredAppList`（桌面注册表），
 *    本页不再维护任何应用清单、也不自造图标 —— 历史上这里反复出过假图标问题。
 */
const emit = defineEmits(['back'])
const store = useDndSettingsStore()
const query = ref('')
const searchActive = ref(false)

function closeSearch() {
  query.value = ''
  searchActive.value = false
}

function isAllowed(appId) {
  return store.state.allowedApps.includes(appId)
}
</script>

<template>
  <SubPageShell title="应用提醒" @back="emit('back')">
    <div class="card-note">开关开启的应用会在勿扰模式期间正常提醒。</div>

    <RegisteredAppList :query="query" @row-click="store.toggleApp($event.id)">
      <template #right="{ app }">
        <ToggleSwitch
          color="blue"
          :model-value="isAllowed(app.id)"
          @update:model-value="store.toggleApp(app.id)"
          @click.stop
        />
      </template>
    </RegisteredAppList>

    <div class="dnd-search-spacer"></div>

    <template #bottom>
      <SettingsSearchDock
        v-model="query"
        :active="searchActive"
        placeholder="搜索应用程序"
        fade-color="#F0F1F2"
        @activate="searchActive = true"
        @back="closeSearch"
        @clear="query = ''"
      />
    </template>
  </SubPageShell>
</template>

<style scoped>
.dnd-search-spacer { height: 92px; width: 100%; flex: none; }

</style>
