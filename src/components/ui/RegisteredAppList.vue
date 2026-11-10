<script setup>
import { computed } from 'vue'
import ListCell from './ListCell.vue'
import RegisteredAppIcon from './RegisteredAppIcon.vue'
import SearchEmptyState from './SearchEmptyState.vue'
import { getRegisteredApps } from '../../composables/useRegisteredApps.js'

/**
 * 【全仓标准控件】注册应用列表。
 *
 * 默认直接渲染 `getRegisteredApps()` 全量桌面应用（38 个），图标统一走
 * `RegisteredAppIcon`；搜索、右侧内容（开关 / 数值 / 箭头）由调用方通过 props / 插槽注入。
 * ⚠️ 不要再为某个页面另写一份应用名单 —— 这是本项目反复出问题的地方。
 */
const props = defineProps({
  apps: { type: Array, default: () => getRegisteredApps() },
  query: { type: String, default: '' },
  valueFor: { type: Function, default: () => '' },
  chevron: { type: Boolean, default: false },
  size: { type: Number, default: 36 }
})
const emit = defineEmits(['row-click'])

const visible = computed(() => {
  const q = props.query.trim().toLowerCase()
  return q
    ? props.apps.filter(a => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q))
    : props.apps
})
</script>

<template>
  <div v-if="visible.length" class="settings-card registered-app-list" data-registered-app-list>
    <ListCell
      v-for="(app, i) in visible"
      :key="app.id"
      :title="app.name"
      :last="i === visible.length - 1"
      :data-app-id="app.id"
      clickable
      @click="emit('row-click', app)"
    >
      <template #icon>
        <RegisteredAppIcon :app="app" :size="size" />
      </template>
      <template #right>
        <slot name="right" :app="app">
          <span v-if="valueFor(app)" class="lc-value">{{ valueFor(app) }}</span>
          <svg v-if="chevron" class="lc-chevron" width="7" height="12" viewBox="0 0 7 12" fill="none">
            <path d="M1.25 1.25L5.75 6L1.25 10.75" stroke="#C5C5C7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </slot>
      </template>
    </ListCell>
  </div>
  <!-- 真机空态直接铺在页面背景上，不包白色卡片 -->
  <SearchEmptyState v-else text="没有搜索到结果" />
</template>

<style scoped>
</style>
