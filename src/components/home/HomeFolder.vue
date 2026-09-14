<script setup>
import { computed, nextTick, ref, watch } from 'vue'
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

const folderShellRef = ref(null)

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
const clusterIconSize = computed(() => is2x2.value ? 15 : 15)

function getFolderIconPositions(width, height, appIds) {
  const is22 = width === 2 && height === 2
  const is21 = width === 2 && height === 1
  const is12 = width === 1 && height === 2
  const isLg = width > 1 || height > 1
  const cap = is22 ? 9 : (isLg ? 3 : 9)
  const hasClust = isLg && appIds.length > cap
  const visCount = isLg ? (hasClust ? cap - 1 : cap) : 9

  const positions = new Map()

  if (is22) {
    const pad = 10, gap = 8, cell = 34.67, iconSize = 35
    for (let i = 0; i < Math.min(appIds.length, visCount); i++) {
      const col = i % 3, row = Math.floor(i / 3)
      const x = pad + col * (cell + gap) + (cell - iconSize) / 2
      const y = pad + row * (cell + gap) + (cell - iconSize) / 2
      positions.set(appIds[i], { x, y, size: iconSize, isCluster: false })
    }
    if (hasClust) {
      const cx = pad + 2 * (cell + gap)
      const cy = pad + 2 * (cell + gap)
      const clusterApps = appIds.slice(visCount, visCount + 4)
      for (let k = 0; k < clusterApps.length; k++) {
        const mcol = k % 2, mrow = Math.floor(k / 2)
        const x = cx + 1.5 + mcol * 17
        const y = cy + 1.5 + mrow * 17
        positions.set(clusterApps[k], { x, y, size: 15, isCluster: true })
      }
    }
  } else if (is21) {
    const padX = 10, padY = 8, gap = 8, cellX = 38.33, cellY = 44, iconSize = 35
    for (let i = 0; i < Math.min(appIds.length, visCount); i++) {
      const x = padX + i * (cellX + gap) + (cellX - iconSize) / 2
      const y = padY + (cellY - iconSize) / 2
      positions.set(appIds[i], { x, y, size: iconSize, isCluster: false })
    }
    if (hasClust) {
      const cx = padX + 2 * (cellX + gap)
      const cy = padY + (cellY - 35) / 2
      const clusterApps = appIds.slice(visCount, visCount + 4)
      for (let k = 0; k < clusterApps.length; k++) {
        const mcol = k % 2, mrow = Math.floor(k / 2)
        const x = cx + 1 + mcol * 17
        const y = cy + 1 + mrow * 17
        positions.set(clusterApps[k], { x, y, size: 15, isCluster: true })
      }
    }
  } else if (is12) {
    const padX = 8, padY = 10, gap = 8, cellX = 44, cellY = 38.33, iconSize = 35
    for (let i = 0; i < Math.min(appIds.length, visCount); i++) {
      const x = padX + (cellX - iconSize) / 2
      const y = padY + i * (cellY + gap) + (cellY - iconSize) / 2
      positions.set(appIds[i], { x, y, size: iconSize, isCluster: false })
    }
    if (hasClust) {
      const cx = padX + (cellX - 35) / 2
      const cy = padY + 2 * (cellY + gap)
      const clusterApps = appIds.slice(visCount, visCount + 4)
      for (let k = 0; k < clusterApps.length; k++) {
        const mcol = k % 2, mrow = Math.floor(k / 2)
        const x = cx + 1 + mcol * 17
        const y = cy + 1 + mrow * 17
        positions.set(clusterApps[k], { x, y, size: 15, isCluster: true })
      }
    }
  } else {
    const pad = 7, gap = 3, cell = 13.33, iconSize = 12
    for (let i = 0; i < Math.min(appIds.length, 9); i++) {
      const col = i % 3, row = Math.floor(i / 3)
      const x = pad + col * (cell + gap)
      const y = pad + row * (cell + gap)
      positions.set(appIds[i], { x, y, size: iconSize, isCluster: false })
    }
  }

  return positions
}

let lastWidth = props.folder.width
let lastHeight = props.folder.height

watch([() => props.folder.width, () => props.folder.height], async ([newW, newH], [oldW, oldH]) => {
  if (newW === oldW && newH === oldH) return
  const fromW = oldW || lastWidth
  const fromH = oldH || lastHeight
  lastWidth = newW
  lastHeight = newH

  const oldPositions = getFolderIconPositions(fromW, fromH, props.folder.appIds)
  const newPositions = getFolderIconPositions(newW, newH, props.folder.appIds)

  await nextTick()

  if (!folderShellRef.value) return
  const shell = folderShellRef.value
  const activeAppIds = new Set(newPositions.keys())
  const iconElements = shell.querySelectorAll('[data-folder-app]')

  for (const el of iconElements) {
    const id = el.getAttribute('data-folder-app')
    if (!id || !newPositions.has(id)) continue
    const target = newPositions.get(id)
    const prev = oldPositions.get(id)

    if (!prev) {
      el.animate([
        { opacity: 0, transform: 'scale(0.5)' },
        { opacity: 1, transform: 'scale(1)' }
      ], {
        duration: 240,
        easing: 'cubic-bezier(0.22, 0.8, 0.24, 1)'
      })
      continue
    }

    const dx = prev.x - target.x
    const dy = prev.y - target.y
    const ds = prev.size / target.size

    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5 || Math.abs(ds - 1) > 0.02) {
      el.style.zIndex = '5'
      const anim = el.animate([
        {
          transform: `translate3d(${dx}px, ${dy}px, 0) scale(${ds})`,
          transformOrigin: 'center center'
        },
        {
          transform: 'translate3d(0, 0, 0) scale(1)',
          transformOrigin: 'center center'
        }
      ], {
        duration: 260,
        easing: 'cubic-bezier(0.22, 0.8, 0.24, 1)',
        fill: 'none'
      })
      anim.onfinish = () => {
        el.style.zIndex = ''
      }
    }
  }

  // Disappearing icons: temporary ghost that fades out from old position
  for (const [id, prev] of oldPositions) {
    if (!activeAppIds.has(id)) {
      const app = getApp(id)
      if (!app) continue
      const ghost = document.createElement('span')
      ghost.className = 'folder-app-ghost'
      ghost.style.cssText = `position:absolute;left:${prev.x}px;top:${prev.y}px;width:${prev.size}px;height:${prev.size}px;z-index:3;pointer-events:none;display:grid;place-items:center;`
      const img = document.createElement('img')
      img.src = app.image || ''
      img.style.cssText = `width:100%;height:100%;border-radius:${prev.size > 20 ? 9 : 4}px;object-fit:cover;`
      ghost.appendChild(img)
      shell.appendChild(ghost)
      const a = ghost.animate([
        { opacity: 0.9, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.4)' }
      ], {
        duration: 200,
        easing: 'cubic-bezier(0.22, 0.8, 0.24, 1)'
      })
      a.onfinish = () => ghost.remove()
    }
  }
})

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
      <span ref="folderShellRef" class="folder-apps" :class="`size-${folder.width}-${folder.height}`" data-folder-shell>
        <span
          v-for="appId in visibleAppIds"
          :key="appId"
          class="folder-app"
          :data-folder-app="appId"
          @click="onAppClick(appId, $event)"
        >
          <AppIcon :app="getApp(appId)" :size="large ? (is2x2 ? 35 : 36) : 12" :show-label="false" :launch-on-click="false" />
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
        <svg viewBox="0 0 24 24" class="handle-arc" aria-hidden="true">
          <path d="M 4 20 A 16 16 0 0 0 20 4" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
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
  height: auto;
  aspect-ratio: 1 / 1;
  flex: none;
  padding: 10px;
  border-radius: var(--radius-widget, 22px);
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
  gap: 8px;
  aspect-ratio: 1 / 1;
}
.size-2-1 {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr;
  align-items: center;
  justify-items: center;
  padding: 8px 10px;
  gap: 8px;
  aspect-ratio: 2 / 1;
}
.size-1-2 {
  grid-template-columns: 1fr;
  grid-template-rows: repeat(3, 1fr);
  align-items: center;
  justify-items: center;
  padding: 10px 8px;
  gap: 8px;
  aspect-ratio: 1 / 2;
}
.folder-app {
  display: grid;
  place-items: center;
  min-width: 0;
  width: 100%;
  height: 100%;
  align-self: center;
  justify-self: center;
  transition: opacity 120ms ease;
}
.folder-app img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  object-fit: cover;
}
.large .folder-app > img {
  width: 35px;
  border-radius: 9px;
}
.folder-name {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: none;
  line-height: 1.2;
}

/* 第 9 槽位（或 2x1/1x2 第 3 槽位）的 2x2 微型簇 */
.folder-mini-cluster {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 2px;
  width: 100%;
  aspect-ratio: 1;
  max-width: 35px;
  max-height: 35px;
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
  border-radius: 4px !important;
}

.home-folder:not(.large) .folder-app :deep(.app-icon) {
  pointer-events: none;
}

.home-folder .folder-app :deep(.app-icon),
.home-folder .cluster-icon :deep(.app-icon) {
  width: auto !important;
  height: auto !important;
  gap: 0 !important;
}

.home-folder .folder-app :deep(.icon-tile),
.home-folder .cluster-icon :deep(.icon-tile) {
  aspect-ratio: 1 !important;
}

.home-folder .folder-app :deep(.icon-badge) {
  top: -2px;
  left: auto;
  right: -3px;
  min-width: 14px;
  height: 14px;
  font-size: 9px;
  line-height: 14px;
  padding: 0 3px;
  border-radius: 7px;
}

.home-folder .cluster-icon :deep(.icon-badge) {
  display: none !important;
}

/* 调整大小把手：高质感白色平滑圆弧，贴合文件夹右下圆角曲率 */
.folder-resize-handle {
  position: absolute;
  right: -3px;
  bottom: 17px;
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
.large .folder-resize-handle {
  bottom: -3px;
}
.folder-resize-handle .handle-arc {
  width: 20px;
  height: 20px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
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
