<script setup>
import { computed } from 'vue'
import { getApp } from '../../config/apps'
import AppIcon from '../ui/AppIcon.vue'

const props = defineProps({
  folder: { type: Object, required: true },
  editing: { type: Boolean, default: false },
  operationActive: { type: Boolean, default: false },
  merging: { type: Boolean, default: false },
  enterDelay: { type: Number, default: 0 }
})
const emit = defineEmits(['open', 'resize-pointerdown', 'launch-app'])

const is2x2 = computed(() => props.folder.width === 2 && props.folder.height === 2)
const is2x1 = computed(() => props.folder.width === 2 && props.folder.height === 1)
const is1x2 = computed(() => props.folder.width === 1 && props.folder.height === 2)
const large = computed(() => props.folder.width > 1 || props.folder.height > 1)

// 2x2 固定 3x3 宫格容量 9；2x1 与 1x2 为 3；1x1 小文件夹容量 9
const capacity = computed(() => is2x2.value ? 9 : (large.value ? 3 : 9))

// 超过容量时，预留最后一个槽位展示 2x2 微型簇（最多 4 个小图标）
const visibleCount = computed(() => {
  if (!large.value) return 9
  return props.folder.appIds.length > capacity.value ? capacity.value - 1 : capacity.value
})

const visibleAppIds = computed(() => props.folder.appIds.slice(0, visibleCount.value))

const clusterAppIds = computed(() => {
  if (!large.value || props.folder.appIds.length <= capacity.value) return []
  const start = visibleCount.value
  return props.folder.appIds.slice(start, start + 4)
})

const hasCluster = computed(() => clusterAppIds.value.length > 0)
const clusterIconSize = computed(() => is2x2.value ? 18 : 17)

function onAppClick(appId, event) {
  if (!large.value || props.editing) return
  event.stopPropagation()
  const anchor = event.currentTarget.querySelector('.app-icon-anchor') || event.currentTarget
  emit('launch-app', appId, anchor)
}

function onClusterClick(event) {
  event.stopPropagation()
  emit('open', event.currentTarget)
}

function onSurfaceClick(event) {
  if (props.operationActive) return
  emit('open', event.currentTarget)
}
</script>

<template>
  <div class="home-folder" :class="{ large, 'is-merging': merging }" :style="{ '--enter-delay': enterDelay + 'ms' }">
    <div class="folder-surface" role="button" tabindex="0" @click="onSurfaceClick" @keydown.enter="emit('open')">
      <span class="folder-apps" :class="`size-${folder.width}-${folder.height}`" data-folder-shell>
        <span
          v-for="appId in visibleAppIds"
          :key="appId"
          class="folder-app"
          :data-folder-app="appId"
          @click="onAppClick(appId, $event)"
        >
          <AppIcon :app="getApp(appId)" :size="large ? (folder.height === 2 ? 44 : 40) : 12" :show-label="false" :launch-on-click="false" />
        </span>
        <span
          v-if="hasCluster"
          class="folder-mini-cluster"
          data-folder-cluster
          @click="onClusterClick($event)"
        >
          <span
            v-for="clusterId in clusterAppIds"
            :key="clusterId"
            class="cluster-icon"
            :data-folder-app="clusterId"
          >
            <AppIcon
              :app="getApp(clusterId)"
              :size="clusterIconSize"
              :show-label="false"
              :launch-on-click="false"
            />
          </span>
        </span>
      </span>
      <span class="folder-name" data-folder-title>{{ folder.name }}</span>
      <button
        v-if="operationActive"
        class="folder-resize-handle"
        type="button"
        aria-label="调整文件夹大小"
        @pointerdown.stop="emit('resize-pointerdown', $event)"
        @click.stop
      >
        <svg viewBox="0 0 32 32" class="handle-arc" aria-hidden="true">
          <path d="M 6 24 A 18 18 0 0 0 24 6" fill="none" stroke="#ffffff" stroke-width="4.8" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.home-folder,
.folder-surface {
  width: 100%;
  height: 100%;
}
.folder-surface {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #fff;
  font: var(--text-caption);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}
.folder-apps {
  width: 60px;
  height: 60px;
  padding: 7px;
  box-sizing: border-box;
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(18px) saturate(150%);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  place-content: start;
  align-items: start;
  justify-items: start;
  gap: 3px;
  overflow: hidden;
  transition: transform 180ms ease, width 240ms cubic-bezier(0.22, 0.8, 0.24, 1), height 240ms cubic-bezier(0.22, 0.8, 0.24, 1);
}
.large .folder-apps {
  width: 100%;
  height: calc(100% - 20px);
  padding: 10px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.20);
  backdrop-filter: blur(25px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  gap: 8px;
}
/* 2x2 固定 3x3 比例，无论图标多少个，从左上角顺次排列，行高不变，空槽自然留白 */
.size-2-2 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  align-items: center;
  justify-items: center;
}
.size-2-1 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr;
  align-items: center;
  justify-items: center;
  padding: 8px 12px;
}
.size-1-2 {
  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, 1fr);
  align-items: center;
  justify-items: center;
  padding: 12px 8px;
}
.folder-app {
  display: grid;
  place-items: center;
  min-width: 0;
  width: 100%;
  height: 100%;
  align-self: center;
  justify-self: center;
  transition: opacity 120ms ease, transform 180ms ease;
}
.folder-app img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  object-fit: cover;
}
.large .folder-app > img {
  width: 44px;
  border-radius: 12px;
}
.folder-name {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 第 9 槽位（或 2x1/1x2 第 3 槽位）的 2x2 微型簇 */
.folder-mini-cluster {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 3px;
  width: 100%;
  aspect-ratio: 1;
  max-width: 44px;
  max-height: 44px;
  align-self: center;
  justify-self: center;
  place-items: center;
  box-sizing: border-box;
  padding: 1px;
  cursor: pointer;
  transition: transform 150ms ease;
}
.folder-mini-cluster:active {
  transform: scale(0.94);
}
.cluster-icon {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
}
.cluster-icon :deep(.app-icon) {
  pointer-events: none;
}
.cluster-icon :deep(.icon-tile) {
  border-radius: 5px !important;
}

.home-folder:not(.large) .folder-app :deep(.app-icon) {
  pointer-events: none;
}

/* 调整大小把手：高质感白色平滑圆弧，贴合文件夹右下圆角曲率 */
.folder-resize-handle {
  position: absolute;
  right: -8px;
  bottom: 12px;
  width:36px;height:36px;
  z-index: 10;
  touch-action: none;
  background: transparent;
  border: none;
  padding: 0;
  cursor: nwse-resize;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}
.folder-resize-handle .handle-arc {
  width: 22px;
  height: 22px;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.42));
  pointer-events: none;
}
.home-folder {
  position: relative;
}
.home-folder.is-merging .folder-app {
  opacity: 0;
}

/* 解锁进入桌面动效：整体缩放弹入，与周边 AppIcon 节奏一致 */
.just-unlocked .home-folder {
  animation: folder-enter 0.5s cubic-bezier(0.25, 0.9, 0.3, 1.2) backwards;
  animation-delay: var(--enter-delay, 0ms);
}
.just-unlocked .home-folder.large {
  animation-name: folder-enter-large;
}
@keyframes folder-enter {
  from { opacity: 0; transform: scale(1.35); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes folder-enter-large {
  from { opacity: 0; transform: scale(1.25); }
  to { opacity: 1; transform: scale(1); }
}
/* 禁用文件夹内部小图标的独立解锁动画，防止重复双重缩放 */
.home-folder .folder-app :deep(.app-icon),
.home-folder .cluster-icon :deep(.app-icon) {
  animation: none !important;
}
</style>
