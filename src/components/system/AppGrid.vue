<script setup>
import { computed, onBeforeUpdate, onUpdated } from 'vue'
import { getApp } from '../../config/apps'
import AppIcon from '../ui/AppIcon.vue'
import ClockWidget from '../widgets/ClockWidget.vue'
import SmartSuggestionWidget from '../widgets/SmartSuggestionWidget.vue'
import HomeFolder from '../home/HomeFolder.vue'

const props = defineProps({
  pageIndex: { type: Number, required: true }, itemIds: { type: Array, default: () => [] },
  items: { type: Object, required: true }, positions: { type: Object, default: () => ({}) },
  folders: { type: Object, default: () => ({}) }, editing: { type: Boolean, default: false },
  profile: { type: Object, required: true },
  selectedIds: { type: Array, default: () => [] }, draggingId: { type: String, default: null },
  folderTargetId: { type: String, default: null }, folderCandidateId:{type:String,default:null}, folderCandidateArmed:{type:Boolean,default:false}, mergingFolderItemId:{type:String,default:null}, removingIds: { type: Array, default: () => [] },
  suppressClickId: { type: String, default: null }, openFolderId: { type: String, default: null }, folderOperationId: { type: String, default: null }
})
const emit = defineEmits(['item-pointerdown', 'folder-resize-pointerdown', 'toggle-select', 'open-folder', 'request-remove', 'launch-app'])
const selected = computed(() => new Set(props.selectedIds))
const removing = computed(() => new Set(props.removingIds))
const itemElements = new Map()
let previousRects = new Map()
function setItemRef(id, element) { if (element) itemElements.set(id, element); else itemElements.delete(id) }
onBeforeUpdate(() => { previousRects = new Map([...itemElements].map(([id,el]) => [id,el.getBoundingClientRect()])) })
onUpdated(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  requestAnimationFrame(() => {
    for (const [id,el] of itemElements) {
      const before = previousRects.get(id), after = el.getBoundingClientRect()
      if (!before) continue
      const x = before.left - after.left, y = before.top - after.top
      if (Math.abs(x) > .5 || Math.abs(y) > .5) {
        const frame = props.positions[id]
        if (frame) el.animate([
          {transform:`translate3d(${frame.x + x}px,${frame.y + y}px,0)`},
          {transform:`translate3d(${frame.x}px,${frame.y}px,0)`}
        ],{duration:220,easing:'cubic-bezier(.22,.8,.26,1)'})
      }
    }
  })
})
const appFor = (item) => item?.type === 'app' ? getApp(item.appId) : null
const folderFor = (item) => item?.type === 'folder' ? props.folders[item.folderId] : null
const widgetTitle = (item) => {
  if (item?.widgetId === 'clock') return '时钟'
  if (item?.widgetId === 'smart') return '建议'
  return item?.title || '小组件'
}
function itemStyle(id) {
  const p = props.positions[id] || { x: 0, y: 0, width: props.profile.iconSize, height: props.profile.iconSize }
  return { width: `${p.width}px`, height: `${p.height}px`, '--icon-size':`${props.profile.iconSize*props.profile.compactScale}px`, '--card-width':`${p.cardWidth || p.width}px`, '--card-height':`${p.cardHeight || p.width}px`, transform: `translate3d(${p.x}px,${p.y}px,0)` }
}
function activate(event, id, item) {
  if (props.editing) {
    event.preventDefault(); event.stopPropagation(); emit('toggle-select', id)
    return
  }
  if (props.suppressClickId === id) {
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); return
  }
  if (item.type === 'folder') {
    if (props.folderOperationId === item.folderId) {
      event.preventDefault(); event.stopPropagation(); return
    }
    const isFolderApp = event.target.closest?.('.folder-app')
    const folder = props.folders[item.folderId]
    const isLarge = folder && (folder.width > 1 || folder.height > 1)
    if (isLarge && isFolderApp) {
      return
    }
    event.preventDefault(); event.stopPropagation(); emit('open-folder', item.folderId, event.currentTarget || itemRefs.get(id))
  }
}
</script>

<template>
  <div class="app-grid" :class="{ 'is-editing': editing }" :data-page="pageIndex">
    <div v-for="(id, index) in itemIds" :key="id" :ref="el => setItemRef(id,el)" class="home-item"
      :class="{ 'is-editing': editing, 'is-selected': selected.has(id), 'is-dragging-source': draggingId === id, 'is-large': (positions[id]?.w || 1) > 1 || (positions[id]?.h || 1) > 1, 'is-widget': items[id]?.type === 'widget', 'is-folder-candidate': folderCandidateId === id, 'is-folder-armed': folderCandidateArmed && folderCandidateId === id, 'is-folder-target': folderTargetId === id, 'is-folder-open': items[id]?.folderId === openFolderId, 'is-removing': removing.has(id) }"
      :data-home-item="id" :data-page-index="pageIndex" :data-item-index="index" :style="itemStyle(id)"
      @pointerdown="emit('item-pointerdown', $event, id, pageIndex, index)"
      @click.capture="activate($event, id, items[id])">
      <div v-if="items[id]?.type === 'widget'" class="widget-surface">
        <ClockWidget v-if="items[id].widgetId === 'clock'" />
        <SmartSuggestionWidget v-else />
        <span class="widget-name" data-widget-title>{{ widgetTitle(items[id]) }}</span>
      </div>
      <AppIcon v-else-if="appFor(items[id])" :app="appFor(items[id])" :size="profile.iconSize * profile.compactScale" :enter-delay="120 + index * 28" home-anchor />
      <HomeFolder v-else-if="folderFor(items[id])" :folder="folderFor(items[id])" :editing="editing" :operation-active="folderOperationId === items[id].folderId" :merging="mergingFolderItemId === id" :enter-delay="120 + index * 28"
        @open="emit('open-folder',items[id].folderId, $event || itemRefs.get(id))" @resize-pointerdown="emit('folder-resize-pointerdown',$event,id,items[id].folderId)"
        @launch-app="(appId, anchor) => emit('launch-app', appId, anchor)" />
      <span v-if="editing" class="selection-mark" aria-hidden="true">{{ selected.has(id) ? '✓' : '' }}</span>
    </div>
  </div>
</template>

<style scoped>
.app-grid { position:relative;width:100%;height:100%;box-sizing:border-box; }
.app-grid.is-editing { transform:translate3d(0,20px,0) scale(.85); transform-origin:50% 36%; transition:transform 320ms cubic-bezier(.22,.8,.26,1); }
.home-item { position:absolute;left:0;top:0;min-width:0;display:flex;align-items:flex-start;justify-content:center;transition:width 240ms cubic-bezier(.22,.8,.24,1),height 240ms cubic-bezier(.22,.8,.24,1);touch-action:none;will-change:transform; }
.home-item.is-widget { min-height:0; aspect-ratio:1/1; }
.home-item.is-widget :deep(.widget),
.home-item.is-widget :deep(.smart-suggestion-stack) { width:100%; height:var(--card-height, 100%); aspect-ratio:1/1; flex:none; }
.widget-surface { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-start; gap:4px; }
.widget-name { font:var(--text-caption); color:#fff; text-shadow:0 1px 3px rgba(0,0,0,.45); max-width:100%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:none; line-height:1.2; }
.home-item.is-dragging-source { opacity:.16; transition:opacity 160ms ease; }
.home-item.is-folder-open { opacity:0 !important; transition:none !important; }
.home-item.is-folder-target > :not(.selection-mark) { transform:scale(1.1);filter:drop-shadow(0 0 14px rgba(255,255,255,.6)); }
.home-item.is-folder-candidate{z-index:3}.home-item.is-folder-candidate::before{content:"";position:absolute;z-index:0;top:-4px;left:50%;width:calc(var(--icon-size) * 1.14);height:calc(var(--icon-size) * 1.14);border-radius:calc(var(--icon-size) * .31);background:rgba(255,255,255,.28);border:1px solid rgba(255,255,255,.34);backdrop-filter:blur(18px) saturate(170%);opacity:1;transform:translateX(-50%) scale(1);animation:folder-candidate-in 140ms cubic-bezier(.22,.8,.24,1) both;box-shadow:inset 0 1px 1px rgba(255,255,255,.34)}.home-item.is-folder-candidate> :not(.selection-mark){position:relative;z-index:1;transition:transform 280ms cubic-bezier(.22,.8,.24,1)}.home-item.is-folder-armed> :not(.selection-mark){transform:scale(.94);filter:drop-shadow(0 0 12px rgba(255,255,255,.58))}@keyframes folder-candidate-in{from{opacity:0;transform:translateX(-50%) scale(.88)}to{opacity:1;transform:translateX(-50%) scale(1)}}
.home-item.is-removing{opacity:0;transition:opacity 180ms ease}
.home-item.is-removing > :not(.selection-mark){transform:scale(.2);transition:transform 180ms ease}
.selection-mark { position:absolute; top:-3px; right:-3px; width:20px; height:20px; display:grid; place-items:center; box-sizing:border-box; border-radius:50%; color:transparent; background:rgba(255,255,255,.78); border:1.2px solid rgba(255,255,255,.95); box-shadow:0 2px 6px rgba(0,0,0,.22); backdrop-filter:blur(12px) saturate(180%); -webkit-backdrop-filter:blur(12px) saturate(180%); font:700 11px/1 var(--font-stack); z-index:4; transition:background 160ms ease,border-color 160ms ease; pointer-events:none; }
.is-selected .selection-mark { color:#fff; background:#007aff; border-color:#fff; box-shadow:0 2px 8px rgba(0,122,255,.45); }
@media (prefers-reduced-motion:reduce) { .app-grid.is-editing,.home-item,.home-item.is-editing{transition-duration:1ms} }
</style>
