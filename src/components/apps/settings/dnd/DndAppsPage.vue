<script setup>
import { computed, ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import SettingsSearchBar from '../../../ui/SettingsSearchBar.vue'
import { DND_APPS, dndAppFallback } from './dndApps.js'
import { useDndSettingsStore } from '../../../../stores/dndSettingsStore.js'

/** 真机「应用提醒」三级页：说明 + 应用开关清单 + 底部悬浮搜索框。 */
const emit = defineEmits(['back'])
const store = useDndSettingsStore()
const query = ref('')

const apps = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? DND_APPS.filter(a => a.name.toLowerCase().includes(q)) : DND_APPS
})

function isAllowed(name) {
  return store.state.allowedApps.includes(name)
}
</script>

<template>
  <SubPageShell title="应用提醒" @back="emit('back')">
    <div class="card-note">开关开启的应用会在勿扰模式期间正常提醒。</div>

    <div class="settings-card">
      <ListCell
        v-for="(app, i) in apps"
        :key="app.name"
        :title="app.name"
        :last="i === apps.length - 1"
        clickable
        @click="store.toggleApp(app.name)"
      >
        <template #icon>
          <img v-if="app.icon" class="dnd-app-icon" :src="app.icon" alt="" draggable="false" />
          <div v-else class="dnd-app-icon is-fallback" :style="{ background: dndAppFallback(app.name).bg, color: dndAppFallback(app.name).fg }">
            {{ dndAppFallback(app.name).text }}
          </div>
        </template>
        <template #right>
          <ToggleSwitch
            color="blue"
            :model-value="isAllowed(app.name)"
            @update:model-value="store.toggleApp(app.name)"
            @click.stop
          />
        </template>
      </ListCell>
    </div>
    <div v-if="!apps.length" class="card-note">未找到匹配的应用</div>
    <div class="dnd-search-spacer"></div>

    <template #bottom>
      <div class="dnd-floating-search">
        <SettingsSearchBar v-model="query" placeholder="搜索应用程序" @clear="query = ''" />
      </div>
    </template>
  </SubPageShell>
</template>

<style scoped>
.dnd-app-icon {
  width: 36px; height: 36px; border-radius: 10px; object-fit: cover;
  display: flex; align-items: center; justify-content: center;
  margin-right: 14px; flex: none; font-size: 16px; font-weight: 600;
}
.dnd-app-icon.is-fallback { border: 0.5px solid rgba(0, 0, 0, 0.05); }
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
