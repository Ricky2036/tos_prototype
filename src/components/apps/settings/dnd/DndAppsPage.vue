<script setup>
import { ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import SettingsSearchBar from '../../../ui/SettingsSearchBar.vue'
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
      <div class="dnd-floating-search">
        <SettingsSearchBar v-model="query" placeholder="搜索应用程序" @clear="query = ''" />
      </div>
    </template>
  </SubPageShell>
</template>

<style scoped>
.dnd-search-spacer { height: 92px; width: 100%; flex: none; }

/* 与设置首页 .settings-floating-search 参数完全一致（左右 27 / 离屏底 25 / 渐隐遮罩） */
.dnd-floating-search {
  position: absolute;
  bottom: 25px;
  left: 27px;
  right: 27px;
  z-index: 10;
  pointer-events: auto;
}
.dnd-floating-search::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: -27px; right: -27px; top: -34px; bottom: -25px;
  background: linear-gradient(
    to bottom,
    rgba(240, 241, 242, 0) 0%,
    rgba(240, 241, 242, 0.88) 38%,
    #F0F1F2 68%,
    #F0F1F2 100%
  );
  pointer-events: none;
}
</style>
