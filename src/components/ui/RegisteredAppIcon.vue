<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import LIcon from './LIcon.vue'
import { findRegisteredApp } from '../../composables/useRegisteredApps.js'

/**
 * 【全仓标准控件】注册应用图标。
 *
 * 三种来源，优先级固定：
 *   1. special（日历/时钟）→ 直接复用桌面同一个 `AppIcon`，星期/指针天然同步；
 *   2. 注册表里有 PNG → `<img>`；
 *   3. 都不是（真机取证的非注册系统组件且项目缺资源）→ 通用 `LIcon` 网格图标，
 *      ⛔ 不再用「首字 + 彩色底块」冒充应用图标（Ricky 多次指出这种假图标）。
 *
 * 用法：`<RegisteredAppIcon :app="app" />` 或 `:app-id="'wechat'"` / `:name="'微信'"`。
 */
const props = defineProps({
  app: { type: Object, default: null },
  appId: { type: String, default: '' },
  name: { type: String, default: '' },
  /** 项目里有真实资源、但应用不在桌面注册表时直接指定（真机取证的系统组件） */
  src: { type: String, default: '' },
  size: { type: Number, default: 36 }
})
const resolved = computed(() => props.app || findRegisteredApp(props.appId || props.name) || null)
</script>

<template>
  <span
    class="registered-app-icon"
    :style="{ width: size + 'px', height: size + 'px' }"
    data-registered-app-icon
  >
    <AppIcon
      v-if="resolved?.specialApp"
      :app="resolved.specialApp"
      :size="size"
      :show-label="false"
      :show-badge="false"
      :launch-on-click="false"
    />
    <img
      v-else-if="src || resolved?.image"
      class="registered-app-img"
      :src="src || resolved.image"
      alt=""
      draggable="false"
    />
    <LIcon v-else name="grid2x2" :size="20" :stroke-width="1.8" class="registered-app-generic" />
  </span>
</template>

<style scoped>
.registered-app-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
  border-radius: 10px;
  overflow: hidden;
  color: #8E8E93;
}
.registered-app-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
/* 桌面 AppIcon 是 <button>，在列表里要去掉按钮默认外观与入场动画 */
.registered-app-icon :deep(.app-icon) {
  background: none;
  border: 0;
  padding: 0;
  width: 100%;
  gap: 0;
  cursor: default;
}
.registered-app-icon :deep(.icon-tile) { box-shadow: none; }
.registered-app-generic { opacity: 0.55; }
</style>
