<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useHomeStore } from '../../stores/homeStore'
import { useSystemStore } from '../../stores/systemStore'
import { globalRankForPageIndex, homeItemMetrics, insertionIndexAtPoint, layoutHomeOrder, moveHomeOrderItem, resolveDesktopPage } from '../../utils/homeLayout.js'
import { setLaunchRect } from '../../utils/appIconAnchors.js'
import { rectRelativeToScreen } from '../../utils/dom.js'
import AppGrid from './AppGrid.vue'
import DockBar from './DockBar.vue'
import PageIndicator from '../ui/PageIndicator.vue'
import HomeFolderOverlay from '../home/HomeFolderOverlay.vue'
import ActionModal from '../ui/ActionModal.vue'

const emit = defineEmits(['open-library'])
const system = useSystemStore()
const home = useHomeStore()
const rootRef = ref(null)
const previewOrder = ref(null)
const pageDragX = ref(0)
const showPageDots = ref(false)
const dragging = ref(null)
const ghost = ref(null)
const ghostRef = ref(null)
const suppressedClickId = ref(null)
const openFolderId = ref(null)
const folderOrigin = ref(null)
const folderTargetId = ref(null)
const folderOperation = ref(null)
const folderResize = ref(null)
const folderMergeCandidate = ref(null)
const folderMergeAnimation = ref(null)
const dockTargetIndex = ref(null)
const pendingRemoval = ref([])
const toast = ref('')
const removingIds = ref([])
const displayFolders = computed(() => {
  if (!folderResize.value) return home.folders
  const folder = home.folders[folderResize.value.folderId]
  return { ...home.folders, [folderResize.value.folderId]:{ ...folder, width:folderResize.value.width, height:folderResize.value.height } }
})
const edgePeekOffset = ref(0)
const isPageFlipping = ref(false)
let pageFlipResetTimer = null

const previewLayout = computed(() => (previewOrder.value || folderResize.value) ? layoutHomeOrder(previewOrder.value || home.order, home.items, displayFolders.value, home.profile) : null)
const displayPages = computed(() => {
  const basePages = previewLayout.value?.pages || home.pages
  if (dragging.value && home.currentPage >= basePages.length - 1) {
    return [...basePages, []]
  }
  return basePages
})
const displayPositions = computed(() => previewLayout.value?.frames || home.positions)
const stripStyle = computed(() => ({
  transform: `translate3d(calc(${-home.currentPage * 100}% + ${pageDragX.value + edgePeekOffset.value}px),0,0)`,
  transition: pageDragX.value ? 'none' : 'transform 440ms cubic-bezier(.22, 1, .36, 1)'
}))
const homeStyle = computed(() => system.unlockProgress <= 0 ? {} : ({
  transform: `scale(${1.12 - system.unlockProgress * .12})`, opacity: .3 + system.unlockProgress * .7
}))
const hasSelection = computed(() => home.selectedItemIds.length > 0)
const indicatorStyle = computed(() => ({
  bottom: home.editing
    ? (hasSelection.value ? '124px' : '192px')
    : `${home.profile.height - home.profile.indicatorY - 4}px`
}))

const justUnlocked = ref(false)
let unlockTimer = null
let pageIndicatorTimer = null
let wheelResetTimer = null
let pinchWheelTimer = null
let suppressClickTimer = null
let wheelDeltaX = 0
let pinchWheelDelta = 0
let wheelLocked = false
watch(() => system.baseLayer, (layer, previous) => {
  if (layer === 'home' && previous === 'lock') {
    justUnlocked.value = true
    clearTimeout(unlockTimer)
    unlockTimer = setTimeout(() => { justUnlocked.value = false }, 1100)
  }
})

let pressTimer = null
let edgeTimer = null
let folderTimer = null
let pointer = null
const touchPoints = new Map()
let pinch = null
function touchDistance(a,b) { return Math.hypot(a.x-b.x,a.y-b.y) }
function bindPinchWindow() {
  window.addEventListener('pointermove',onPinchMove,{passive:false,capture:true})
  window.addEventListener('pointerup',onPinchEnd,true)
  window.addEventListener('pointercancel',onPinchEnd,true)
}
function unbindPinchWindow() {
  window.removeEventListener('pointermove',onPinchMove,true)
  window.removeEventListener('pointerup',onPinchEnd,true)
  window.removeEventListener('pointercancel',onPinchEnd,true)
}
function onRootPointerDownCapture(event) {
  if (event.pointerType !== 'touch' || home.editing || openFolderId.value || pendingRemoval.value.length || system.baseLayer !== 'home') return
  touchPoints.set(event.pointerId,{x:event.clientX,y:event.clientY})
  if (touchPoints.size !== 2) return
  if (pointer) cleanup(true)
  const entries = [...touchPoints.entries()]
  pinch = { ids:entries.map(([id]) => id), initial:touchDistance(entries[0][1],entries[1][1]), triggered:false }
  bindPinchWindow()
  event.preventDefault(); event.stopPropagation()
}
function onPinchMove(event) {
  if (!pinch || !pinch.ids.includes(event.pointerId)) return
  touchPoints.set(event.pointerId,{x:event.clientX,y:event.clientY})
  const points = pinch.ids.map(id => touchPoints.get(id))
  if (points.some(point => !point)) return
  event.preventDefault()
  const distance = touchDistance(points[0],points[1])
  if (!pinch.triggered && (pinch.initial-distance >= 36 || distance <= pinch.initial*.86)) {
    pinch.triggered = true
    home.setEditing(true)
  }
}
function onPinchEnd(event) {
  touchPoints.delete(event.pointerId)
  if (!pinch?.ids.includes(event.pointerId)) return
  pinch = null
  unbindPinchWindow()
}
function clearTimers() {
  clearTimeout(pressTimer); clearTimeout(edgeTimer); clearTimeout(folderTimer); clearTimeout(pageFlipResetTimer)
  pressTimer = null; edgeTimer = null; folderTimer = null; pageFlipResetTimer = null
  edgePeekOffset.value = 0; isPageFlipping.value = false
}
function revealPageDots() {
  clearTimeout(pageIndicatorTimer)
  pageIndicatorTimer = null
  showPageDots.value = true
}
function restoreSearchAfterPaging() {
  revealPageDots()
  pageIndicatorTimer = setTimeout(() => {
    showPageDots.value = false
    pageIndicatorTimer = null
  }, 5000)
}
function onWheel(event) {
  if (event.ctrlKey) {
    if (home.editing || openFolderId.value || pendingRemoval.value.length || system.baseLayer !== 'home') return
    event.preventDefault()
    pinchWheelDelta = event.deltaY > 0 ? pinchWheelDelta + event.deltaY : 0
    clearTimeout(pinchWheelTimer)
    pinchWheelTimer = setTimeout(() => { pinchWheelDelta = 0 }, 180)
    if (pinchWheelDelta >= 24) { pinchWheelDelta = 0; home.setEditing(true) }
    return
  }
  if (home.editing || openFolderId.value || Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 2) return
  folderOperation.value = null
  event.preventDefault()
  if (wheelLocked) return
  wheelDeltaX += event.deltaX
  clearTimeout(wheelResetTimer)
  wheelResetTimer = setTimeout(() => { wheelDeltaX = 0 }, 140)
  if (Math.abs(wheelDeltaX) < 42) return
  const direction = wheelDeltaX > 0 ? 1 : -1
  wheelDeltaX = 0
  wheelLocked = true
  setTimeout(() => { wheelLocked = false }, 420)
  revealPageDots()
  const requested = home.currentPage + direction
  if (requested >= home.pageCount) emit('open-library')
  else home.setPage(Math.max(0, requested))
  restoreSearchAfterPaging()
}
function bindWindow() {
  window.addEventListener('pointermove', onPointerMove, { passive: false })
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)
  window.addEventListener('blur', onWindowBlur)
}
function unbindWindow() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
  window.removeEventListener('blur', onWindowBlur)
}
function capture(event) {
  try { event.currentTarget?.setPointerCapture?.(event.pointerId); return event.currentTarget } catch { return null }
}
function clientPointToHome(x, y) {
  const root = rootRef.value
  const rect = root?.getBoundingClientRect()
  if (!root || !rect?.width || !rect?.height) return { x, y }
  return {
    x: (x - rect.left) * (root.offsetWidth / rect.width),
    y: (y - rect.top) * (root.offsetHeight / rect.height)
  }
}
function setGhostPosition(id, clientX, clientY) {
  const point = clientPointToHome(clientX, clientY)
  let x = point.x-(ghost.value?.grabX || 0), y = point.y-(ghost.value?.grabY || 0)
  if (folderMergeCandidate.value?.id && ghost.value) {
    const target = rootRef.value?.querySelector(`[data-home-item="${folderMergeCandidate.value.id}"]`)
    const rect = target?.getBoundingClientRect(), rootRect = rootRef.value?.getBoundingClientRect()
    if (rect && rootRect) {
      const scaleX = rootRef.value.offsetWidth/rootRect.width, scaleY = rootRef.value.offsetHeight/rootRect.height
      const targetX = (rect.left-rootRect.left)*scaleX + (rect.width*scaleX-ghost.value.width)/2
      const targetY = (rect.top-rootRect.top)*scaleY + (Math.min(rect.width,rect.height)*scaleY-ghost.value.height)/2
      const mix = folderMergeCandidate.value.armed ? .72 : .34
      x += (targetX-x)*mix; y += (targetY-y)*mix
    }
  }
  ghost.value = { ...ghost.value, id, x, y }
}
function suppressClick(id) {
  suppressedClickId.value = id
  clearTimeout(suppressClickTimer)
  suppressClickTimer = setTimeout(() => { if (suppressedClickId.value === id) suppressedClickId.value = null }, 420)
}
function createDragGhost(source,id,x,y) {
  const rootRect = rootRef.value?.getBoundingClientRect()
  const sourceRect = source?.getBoundingClientRect()
  const scaleX = rootRect?.width ? rootRef.value.offsetWidth/rootRect.width : 1
  const scaleY = rootRect?.height ? rootRef.value.offsetHeight/rootRect.height : 1
  const point = clientPointToHome(x,y)
  const left = sourceRect && rootRect ? (sourceRect.left-rootRect.left)*scaleX : point.x-34
  const top = sourceRect && rootRect ? (sourceRect.top-rootRect.top)*scaleY : point.y-44
  const clone = source?.cloneNode(true)
  ghost.value = { id,x:left,y:top,width:(sourceRect?.width || 68)*scaleX,height:(sourceRect?.height || 76)*scaleY,grabX:point.x-left,grabY:point.y-top }
  nextTick(() => {
    if (!ghostRef.value || !clone || ghost.value?.id !== id) return
    clone.removeAttribute('data-home-item'); clone.removeAttribute('data-dock-item')
    clone.classList.remove('is-editing','is-dragging-source','is-removing','is-selected')
    clone.style.cssText = 'position:relative;left:auto;top:auto;width:100%;height:100%;transform:none;animation:none;opacity:1;pointer-events:none'
    clone.querySelectorAll('.selection-mark,.remove-badge,.dock-select').forEach(node => node.remove())
    ghostRef.value.replaceChildren(clone)
  })
}
function enterEditingFromEmptyPress() {
  if (pointer?.mode !== 'page') return
  const active = pointer
  clearTimers()
  try { active.captureEl?.releasePointerCapture?.(active.id) } catch {}
  pointer = null
  unbindWindow()
  home.setEditing(true)
}
function onEmptyPointerDown(event) {
  if (event.button != null && event.button !== 0) return
  if (event.target.closest('[data-home-item],.dock-bar,.home-editor')) return
  folderOperation.value = null
  pointer = { id:event.pointerId, mode:'page', startX:event.clientX, startY:event.clientY, lastX:event.clientX, lastY:event.clientY,
    startedAt:performance.now(), startPage:home.currentPage, exitEditingOnTap:home.editing, captureEl:capture(event) }
  if (!home.editing) pressTimer = setTimeout(enterEditingFromEmptyPress,450)
  bindWindow()
}
function onItemPointerDown(event, id, page, index) {
  if (event.button != null && event.button !== 0) return
  event.stopPropagation()
  const isFolder = home.items[id]?.type === 'folder'
  const readyToMove = home.editing || folderOperation.value?.itemId === id
  pointer = { id:event.pointerId, mode:readyToMove ? 'item-ready' : (isFolder ? 'folder-press' : 'item-press'), itemId:id, page, index,
    startX:event.clientX, startY:event.clientY, lastX:event.clientX, lastY:event.clientY, startedAt:performance.now(), startPage:home.currentPage,
    edgeDirection:0, captureTarget:event.currentTarget, captureEl:null }
  if (!readyToMove) pressTimer = setTimeout(() => {
    if (!pointer || pointer.itemId !== id) return
    if (isFolder) {
      folderOperation.value = { itemId:id,folderId:home.items[id].folderId }
      suppressClick(id)
      pointer.mode = 'item-ready'
    } else startItemDrag(pointer.startX,pointer.startY)
  }, 450)
  bindWindow()
}
function onFolderResizePointerDown(event,itemId,folderId) {
  if (event.button != null && event.button !== 0) return
  event.preventDefault(); event.stopPropagation()
  const folder = home.folders[folderId], frame = displayPositions.value[home.currentPage]?.[itemId]
  if (!folder || !frame) return
  pointer = { id:event.pointerId,mode:'folder-resize',itemId,folderId,startX:event.clientX,startY:event.clientY,lastX:event.clientX,lastY:event.clientY,
    startPage:home.currentPage,originalWidth:folder.width,originalHeight:folder.height,frame,captureEl:capture(event) }
  folderResize.value = { folderId,width:folder.width,height:folder.height }
  bindWindow()
}
function updateFolderResize(clientX,clientY) {
  if (!pointer || pointer.mode !== 'folder-resize') return
  const point = clientPointToHome(clientX,clientY)
  const item = home.items[pointer.itemId]
  const one = homeItemMetrics(item,{ ...home.folders,[pointer.folderId]:{...home.folders[pointer.folderId],width:1,height:1} },home.profile)
  const widthBoundary = pointer.frame.x + one.width + one.gapX/2
  const heightBoundary = pointer.frame.y + one.height + one.gapY/2
  const hysteresis = 8
  const current = folderResize.value
  const width = current.width === 2 ? (point.x < widthBoundary-hysteresis ? 1 : 2) : (point.x > widthBoundary+hysteresis ? 2 : 1)
  const height = current.height === 2 ? (point.y < heightBoundary-hysteresis ? 1 : 2) : (point.y > heightBoundary+hysteresis ? 2 : 1)
  if (width !== current.width || height !== current.height) folderResize.value = { folderId:pointer.folderId,width,height }
}
function onDockPointerDown(event, id, index) {
  if (event.button != null && event.button !== 0) return
  event.stopPropagation()
  pointer = { id:event.pointerId, mode:home.editing ? 'item-ready' : 'item-press', itemId:id, page:home.currentPage, index,
    sourceDock:true, startX:event.clientX, startY:event.clientY, lastX:event.clientX, lastY:event.clientY,
    startedAt:performance.now(), startPage:home.currentPage, edgeDirection:0, captureTarget:event.currentTarget, captureEl:null }
  if (!home.editing) pressTimer = setTimeout(() => {
    if (!pointer || pointer.itemId !== id) return
    startItemDrag(pointer.startX,pointer.startY)
  },450)
  bindWindow()
}
function startItemDrag(x, y) {
  if (!pointer?.itemId) return
  if (!pointer.captureEl && pointer.captureTarget) {
    try { pointer.captureTarget.setPointerCapture?.(pointer.id); pointer.captureEl = pointer.captureTarget } catch {}
  }
  pointer.mode = 'item-drag'
  suppressClick(pointer.itemId)
  previewOrder.value = [...home.order]
  dragging.value = { id:pointer.itemId, page:pointer.page, index:pointer.index }
  pointer.didMove = false
  const source = pointer.captureTarget?.closest?.('[data-home-item],[data-dock-item]') || pointer.captureTarget
  createDragGhost(source,pointer.itemId,x,y)
}
function trackFolderTarget(x, y) {
  const element = document.elementFromPoint(x, y)?.closest?.('[data-home-item]')
  const id = element?.dataset.homeItem
  const dragged = home.items[dragging.value?.id]
  const target = home.items[id]
  const candidate = dragged?.type === 'app' && id !== dragging.value.id && (target?.type === 'app' || target?.type === 'folder') ? id : null
  if (candidate === pointer.folderCandidate) return
  clearTimeout(folderTimer)
  pointer.folderCandidate = candidate
  folderTargetId.value = null
  folderMergeCandidate.value = candidate ? { id:candidate,armed:false } : null
  if (candidate) folderTimer = setTimeout(() => {
    if (pointer?.folderCandidate === candidate) {
      folderTargetId.value = candidate
      folderMergeCandidate.value = { id:candidate,armed:true }
    }
  }, 420)
}
function trackDockTarget(x, y) {
  const dock = rootRef.value.querySelector('.dock-bar')
  const rect = dock?.getBoundingClientRect()
  if (!rect || y < rect.top || y > rect.bottom || x < rect.left || x > rect.right) {
    dockTargetIndex.value = null
    return
  }
  dockTargetIndex.value = Math.max(0,Math.min(3,Math.floor((x - rect.left) / (rect.width / 4))))
  folderTargetId.value = null
  folderMergeCandidate.value = null
}

function cloneMergeAnchor(element,appId) {
  const anchor = element?.querySelector?.('.app-icon-anchor') || element
  const rect = anchor?.getBoundingClientRect?.()
  if (!anchor || !rect?.width) return null
  const clone = anchor.cloneNode(true)
  clone.classList.add('folder-merge-clone')
  Object.assign(clone.style,{position:'fixed',left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,margin:'0',zIndex:'1200',pointerEvents:'none',transformOrigin:'top left'})
  document.body.appendChild(clone)
  return { appId,clone,rect }
}
async function animateMergeAnchors(entries,folderItemId) {
  const valid = entries.filter(Boolean)
  if (!valid.length) return
  folderMergeAnimation.value = folderItemId
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(resolve))
  const folderElement = rootRef.value?.querySelector(`[data-home-item="${folderItemId}"]`)
  const animations = valid.map((entry) => {
    const destination = [...(folderElement?.querySelectorAll?.('[data-folder-app]') || [])].find((node) => node.dataset.folderApp === entry.appId)?.querySelector('.app-icon-anchor')
    const to = destination?.getBoundingClientRect?.()
    if (!to) { entry.clone.remove(); return Promise.resolve() }
    const animation = entry.clone.animate([
      { transform:'translate3d(0,0,0) scale(1)',opacity:1 },
      { transform:`translate3d(${to.left-entry.rect.left}px,${to.top-entry.rect.top}px,0) scale(${to.width/entry.rect.width})`,opacity:1 }
    ],{duration:280,easing:'cubic-bezier(.22,.8,.24,1)',fill:'forwards'})
    return animation.finished.catch(() => {}).finally(() => entry.clone.remove())
  })
  await Promise.all(animations)
  folderMergeAnimation.value = null
}
async function animateFolderDissolve({ remainingAppId, miniRect, shellRect }) {
  if (shellRect && shellRect.width > 0) {
    const shellClone = document.createElement('div')
    shellClone.className = 'folder-apps'
    Object.assign(shellClone.style, {
      position: 'fixed',
      left: `${shellRect.left}px`,
      top: `${shellRect.top}px`,
      width: `${shellRect.width}px`,
      height: `${shellRect.height}px`,
      margin: '0',
      zIndex: '1100',
      pointerEvents: 'none',
      borderRadius: '17px',
      background: 'rgba(255,255,255,.24)',
      backdropFilter: 'blur(18px) saturate(150%)',
      transformOrigin: 'center center'
    })
    document.body.appendChild(shellClone)
    shellClone.animate([
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.12)', opacity: 0 }
    ], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' })
      .finished.catch(() => {}).finally(() => shellClone.remove())
  }

  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(resolve))

  const newHomeItem = rootRef.value?.querySelector(`[data-home-item="app:${remainingAppId}"]`)
  const newAnchor = newHomeItem?.querySelector?.('.app-icon-anchor')
  const toRect = newAnchor?.getBoundingClientRect?.()

  if (newAnchor && toRect && toRect.width > 0 && miniRect?.width > 0) {
    const dx = miniRect.left - toRect.left
    const dy = miniRect.top - toRect.top
    const scale = miniRect.width / toRect.width

    const label = newHomeItem?.querySelector?.('.icon-label')
    if (label) {
      label.animate([
        { opacity: 0 },
        { opacity: 1 }
      ], { duration: 320, easing: 'ease-out' })
    }

    const anim = newAnchor.animate([
      {
        transform: `translate3d(${dx}px,${dy}px,0) scale(${scale})`,
        transformOrigin: 'top left'
      },
      {
        transform: 'translate3d(0,0,0) scale(1)',
        transformOrigin: 'top left'
      }
    ], {
      duration: 320,
      easing: 'cubic-bezier(.22,1,.36,1)',
      fill: 'none'
    })
    await anim.finished.catch(() => {})
  }
}
function targetIndexAt(x, y) {
  const grid = rootRef.value.querySelector(`[data-page="${home.currentPage}"]`)
  const rect = grid?.getBoundingClientRect()
  const page = displayPages.value[home.currentPage] || []
  if (!grid || !rect?.width || !rect?.height) return page.length
  const scaleX = rect.width / grid.offsetWidth
  const scaleY = rect.height / grid.offsetHeight
  const localX = (x - rect.left) / scaleX
  const localY = (y - rect.top) / scaleY
  return insertionIndexAtPoint(page, displayPositions.value[home.currentPage], localX, localY)
}
function updatePreview(x, y) {
  if (!dragging.value || !previewOrder.value) return
  trackDockTarget(x, y)
  if (dockTargetIndex.value != null) return
  trackFolderTarget(x, y)
  // 命中文件夹候选时保持原网格不动，让 420ms 停留计时不会因实时让位而丢失目标。
  if (pointer.folderCandidate) return
  const index = targetIndexAt(x, y)
  const rank = globalRankForPageIndex(displayPages.value, home.currentPage, index)
  previewOrder.value = moveHomeOrderItem(previewOrder.value, dragging.value.id, rank)
  dragging.value.page = home.currentPage; dragging.value.index = index
  const rect = rootRef.value.getBoundingClientRect()
  const edgeThreshold = 38
  const direction = x < rect.left + edgeThreshold ? -1 : x > rect.right - edgeThreshold ? 1 : 0
  const canFlip = direction === -1
    ? home.currentPage > 0
    : direction === 1
      ? home.currentPage < displayPages.value.length - 1
      : false

  if (!direction || !canFlip) {
    clearTimeout(edgeTimer)
    edgeTimer = null
    if (pointer) pointer.edgeDirection = 0
    edgePeekOffset.value = 0
    return
  }

  if (direction !== pointer.edgeDirection) {
    clearTimeout(edgeTimer)
    edgeTimer = null
    pointer.edgeDirection = direction
    edgePeekOffset.value = direction === 1 ? -12 : 12
    edgeTimer = setTimeout(() => {
      triggerEdgePageFlip(x, y, direction)
    }, 400)
  }
}
function triggerEdgePageFlip(x, y, direction) {
  if (!dragging.value || pointer?.edgeDirection !== direction) return
  const requested = home.currentPage + direction
  if (requested < 0 || requested >= displayPages.value.length) return

  // 触觉微脉冲
  isPageFlipping.value = true
  clearTimeout(pageFlipResetTimer)
  pageFlipResetTimer = setTimeout(() => { isPageFlipping.value = false }, 320)

  revealPageDots()
  edgePeekOffset.value = 0
  home.currentPage = requested
  dragging.value.page = home.currentPage
  const pageItems = displayPages.value[home.currentPage] || []
  dragging.value.index = pageItems.length
  updatePreview(x, y)

  // 连续翻页支持：若同方向仍有页面，等待 600ms 冷却后继续翻页
  const canFlipFurther = direction === -1
    ? home.currentPage > 0
    : home.currentPage < displayPages.value.length - 1
  if (canFlipFurther) {
    edgePeekOffset.value = direction === 1 ? -12 : 12
    edgeTimer = setTimeout(() => {
      triggerEdgePageFlip(x, y, direction)
    }, 600)
  } else {
    if (pointer) pointer.edgeDirection = 0
    edgePeekOffset.value = 0
  }
}
function onPointerMove(event) {
  if (!pointer || event.pointerId !== pointer.id) return
  pointer.lastX = event.clientX; pointer.lastY = event.clientY
  const dx = event.clientX - pointer.startX, dy = event.clientY - pointer.startY
  if (pointer.mode === 'folder-resize') { event.preventDefault(); updateFolderResize(event.clientX,event.clientY); return }
  if (pointer.mode === 'folder-press' && Math.hypot(dx,dy) > 9) { clearTimeout(pressTimer); cleanup(false); return }
  if (pointer.mode === 'item-press' && Math.hypot(dx,dy) > 9) { clearTimeout(pressTimer); cleanup(false); return }
  if (pointer.mode === 'item-ready' && Math.hypot(dx,dy) > 5) startItemDrag(event.clientX,event.clientY)
  if (pointer.mode === 'folder-app-ready' && Math.hypot(dx,dy) > 5) {
    pointer.mode = 'folder-app-drag'
    pointer.fromFolder = { folderId: pointer.folderId, appId: pointer.appId }
    pointer.itemId = `app:${pointer.appId}`
    createDragGhost(pointer.captureTarget, pointer.itemId, event.clientX, event.clientY)
    openFolderId.value = null
    previewOrder.value = [...home.order]
    dragging.value = { id: pointer.itemId, page: home.currentPage, index: home.currentItems.length }
  }
  if (pointer.mode === 'folder-app-drag') {
    event.preventDefault()
    pointer.didMove = true
    setGhostPosition(ghost.value.id, event.clientX, event.clientY)
    updatePreview(event.clientX, event.clientY)
    return
  }
  if (pointer.mode === 'item-drag') {
    if (Math.hypot(dx,dy) <= 5) return
    pointer.didMove = true
    event.preventDefault(); setGhostPosition(ghost.value.id, event.clientX, event.clientY); updatePreview(event.clientX,event.clientY); return
  }
  if (pointer.mode === 'page') {
    if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return
    clearTimeout(pressTimer)
    if (Math.abs(dy) > Math.abs(dx) * 1.2) { cleanup(false); return }
    revealPageDots()
    event.preventDefault()
    pageDragX.value = ((home.currentPage === 0 && dx > 0) || (home.currentPage === home.pageCount - 1 && dx < 0)) ? dx * .36 : dx
  }
}
function finishFolderApp(cancelled) {
  clearTimeout(edgeTimer)
  clearTimeout(pageFlipResetTimer)
  edgeTimer = null
  pageFlipResetTimer = null
  edgePeekOffset.value = 0
  isPageFlipping.value = false
  if (pointer) pointer.edgeDirection = 0

  if (cancelled) {
    openFolderId.value = pointer.folderId
    previewOrder.value = null
    dragging.value = null
    ghost.value = null
    folderTargetId.value = null
    folderMergeCandidate.value = null
    dockTargetIndex.value = null
    return
  }

  const folderId = pointer.folderId
  const appId = pointer.appId
  const sourceFolder = home.folders[folderId]
  const targetPage = dragging.value?.page ?? home.currentPage
  const targetIndex = dragging.value?.index ?? home.currentItems.length
  const folderItemId = `folder:${folderId}`

  const remainingAppId = sourceFolder?.appIds?.length === 2
    ? sourceFolder.appIds.find((id) => id !== appId)
    : null

  let dissolveInfo = null
  if (remainingAppId) {
    const folderEl = rootRef.value?.querySelector(`[data-home-item="${folderItemId}"]`)
    const miniNode = folderEl?.querySelector?.(`[data-folder-app="${remainingAppId}"] .app-icon-anchor`)
      || folderEl?.querySelector?.(`[data-folder-app="${remainingAppId}"]`)
    const shellNode = folderEl?.querySelector?.('[data-folder-shell]')
    let miniRect = miniNode?.getBoundingClientRect?.()
    let shellRect = shellNode?.getBoundingClientRect?.()
    if ((!miniRect || miniRect.width === 0) && folderEl) {
      const fr = folderEl.getBoundingClientRect()
      if (fr.width > 0) {
        miniRect = { left: fr.left + 8, top: fr.top + 8, width: 14, height: 14 }
        shellRect = { left: fr.left, top: fr.top, width: fr.width, height: fr.width }
      }
    }
    dissolveInfo = {
      remainingAppId,
      miniRect,
      shellRect
    }
  }

  if (dockTargetIndex.value != null) {
    home.removeAppFromFolder(appId, folderId, targetPage, targetIndex)
    home.moveToDock(`app:${appId}`, dockTargetIndex.value)
  } else if (folderTargetId.value) {
    const target = home.items[folderTargetId.value]
    const ghostAnchor = cloneMergeAnchor(ghostRef.value, appId)
    home.removeAppFromFolder(appId, folderId, targetPage, targetIndex)
    if (target?.type === 'folder') {
      const targetFolderItemId = folderTargetId.value
      home.addAppToFolder(`app:${appId}`, targetFolderItemId)
      animateMergeAnchors([ghostAnchor], targetFolderItemId)
    } else if (target?.type === 'app') {
      const targetElement = rootRef.value?.querySelector(`[data-home-item="${folderTargetId.value}"]`)
      const targetAnchor = cloneMergeAnchor(targetElement, target.appId)
      const location = home.itemLocation(folderTargetId.value) || { page: targetPage, index: targetIndex }
      const newFolderItemId = home.createFolder([folderTargetId.value, `app:${appId}`], location.page, location.index)
      animateMergeAnchors([targetAnchor, ghostAnchor], newFolderItemId)
    }
  } else {
    home.removeAppFromFolder(appId, folderId, targetPage, targetIndex)
  }

  previewOrder.value = null
  dragging.value = null
  ghost.value = null
  folderTargetId.value = null
  folderMergeCandidate.value = null
  dockTargetIndex.value = null

  if (dissolveInfo?.miniRect) {
    animateFolderDissolve(dissolveInfo)
  }
}
function finishItem(cancelled) {
  clearTimeout(edgeTimer)
  clearTimeout(pageFlipResetTimer)
  edgeTimer = null
  pageFlipResetTimer = null
  edgePeekOffset.value = 0
  isPageFlipping.value = false
  if (pointer) pointer.edgeDirection = 0

  if (!pointer.didMove) {
    previewOrder.value = null; dragging.value = null; ghost.value = null; folderTargetId.value = null; dockTargetIndex.value = null
    return
  }
  if (!cancelled && dragging.value && dockTargetIndex.value != null) {
    home.moveToDock(dragging.value.id,dockTargetIndex.value)
  } else if (!cancelled && dragging.value && folderTargetId.value) {
    const target = home.items[folderTargetId.value]
    const draggedAppId = home.items[dragging.value.id]?.appId
    const ghostAnchor = cloneMergeAnchor(ghostRef.value,draggedAppId)
    if (target?.type === 'folder') {
      const folderItemId = folderTargetId.value
      home.addAppToFolder(dragging.value.id,folderItemId)
      animateMergeAnchors([ghostAnchor],folderItemId)
    }
    else if (target?.type === 'app') {
      const targetElement = rootRef.value?.querySelector(`[data-home-item="${folderTargetId.value}"]`)
      const targetAnchor = cloneMergeAnchor(targetElement,target.appId)
      const location = home.itemLocation(folderTargetId.value) || { page:dragging.value.page, index:dragging.value.index }
      const folderItemId = home.createFolder([folderTargetId.value, dragging.value.id], location.page, location.index)
      animateMergeAnchors([targetAnchor,ghostAnchor],folderItemId)
    }
  } else if (!cancelled && dragging.value && pointer.sourceDock) {
    home.moveFromDock(dragging.value.id,dragging.value.page,dragging.value.index)
  } else if (!cancelled && dragging.value) home.moveItem(dragging.value.id, dragging.value.page, dragging.value.index)
  previewOrder.value = null; dragging.value = null; ghost.value = null
  folderTargetId.value = null
  folderMergeCandidate.value = null
  dockTargetIndex.value = null
  if (cancelled) home.currentPage = Math.min(pointer.startPage,home.pages.length - 1)
  if (showPageDots.value) restoreSearchAfterPaging()
}
function finishPage(cancelled) {
  const elapsed = Math.max(1, performance.now() - pointer.startedAt)
  const tapDistance = Math.hypot((pointer.lastX ?? pointer.startX) - pointer.startX, (pointer.lastY ?? pointer.startY) - pointer.startY)
  if (!cancelled && pointer.exitEditingOnTap && tapDistance < 7) {
    home.setEditing(false)
    pageDragX.value = 0
    return
  }
  const outcome = cancelled ? { page:home.currentPage, openLibrary:false } : resolveDesktopPage({
    currentPage:home.currentPage, pageCount:home.pageCount, delta:pageDragX.value, velocity:pageDragX.value / elapsed,
    threshold:rootRef.value.getBoundingClientRect().width * .18
  })
  home.setPage(outcome.page)
  if (outcome.openLibrary) emit('open-library')
  pageDragX.value = 0
  if (showPageDots.value) restoreSearchAfterPaging()
}
function cleanup(cancelled) {
  if (!pointer) return
  clearTimers()
  if (pointer.mode === 'item-drag') finishItem(cancelled)
  if (pointer.mode === 'folder-resize') {
    if (!cancelled && folderResize.value) home.resizeFolder(pointer.folderId,folderResize.value.width,folderResize.value.height)
    folderResize.value = null
  }
  if (pointer.mode === 'folder-app-drag') finishFolderApp(cancelled)
  if (pointer.mode === 'page') finishPage(cancelled)
  try { pointer.captureEl?.releasePointerCapture?.(pointer.id) } catch {}
  pointer = null; unbindWindow()
}
function onPointerUp(event) { touchPoints.delete(event.pointerId); if (pointer && event.pointerId === pointer.id) cleanup(false) }
function onPointerCancel(event) {
  touchPoints.delete(event.pointerId)
  if (pointer && event.pointerId === pointer.id) {
    if (pointer.mode === 'folder-app-drag') {
      const dist = Math.hypot((pointer.lastX || pointer.startX) - pointer.startX, (pointer.lastY || pointer.startY) - pointer.startY)
      if (dist > 20) {
        cleanup(false)
        return
      }
    }
    cleanup(true)
  }
}
function onWindowBlur() { if (pointer) cleanup(true) }
function onHomeKeydown(event) {
  if (event.key !== 'Escape') return
  folderOperation.value = null
  if (pointer) cleanup(true)
}
function showFolder(folderId, element) {
  folderOperation.value = null
  const screen = rootRef.value?.closest('.screen-view') || document.querySelector('.screen-view')
  const toLocalRect = (node) => (node && screen) ? rectRelativeToScreen(node, screen) : (node?.getBoundingClientRect() ? {
    left: node.getBoundingClientRect().left,
    top: node.getBoundingClientRect().top,
    width: node.getBoundingClientRect().width,
    height: node.getBoundingClientRect().height,
    right: node.getBoundingClientRect().right,
    bottom: node.getBoundingClientRect().bottom
  } : null)

  const el = element
    || rootRef.value?.querySelector?.(`[data-home-item="folder:${folderId}"]`)
    || (home.folders[folderId] && rootRef.value?.querySelector?.(`[data-home-item="${Object.entries(home.items).find(([_, it]) => it?.type === 'folder' && it.folderId === folderId)?.[0]}"]`))
  const shell = el?.querySelector?.('[data-folder-shell]') || rootRef.value?.querySelector?.(`[data-home-item="folder:${folderId}"] [data-folder-shell]`)
  const title = el?.querySelector?.('[data-folder-title]') || rootRef.value?.querySelector?.(`[data-home-item="folder:${folderId}"] [data-folder-title]`)
  const iconRects = {}
  const appNodes = el?.querySelectorAll?.('[data-folder-app]') || rootRef.value?.querySelectorAll?.(`[data-home-item="folder:${folderId}"] [data-folder-app]`)
  appNodes?.forEach?.((node) => {
    const r = toLocalRect(node)
    if (r) iconRects[node.dataset.folderApp] = r
  })
  folderOrigin.value = {
    shellRect: toLocalRect(shell),
    titleRect: toLocalRect(title),
    iconRects
  }
  openFolderId.value = folderId
}
function launchFolderApp(appId, anchor) {
  folderOperation.value = null
  const screen = document.querySelector('.screen-view')
  if (!screen || !anchor) return
  const launchRect = rectRelativeToScreen(anchor, screen) || {
    x: anchor.getBoundingClientRect().left - screen.getBoundingClientRect().left,
    y: anchor.getBoundingClientRect().top - screen.getBoundingClientRect().top,
    left: anchor.getBoundingClientRect().left - screen.getBoundingClientRect().left,
    top: anchor.getBoundingClientRect().top - screen.getBoundingClientRect().top,
    width: anchor.getBoundingClientRect().width,
    height: anchor.getBoundingClientRect().height
  }
  setLaunchRect(appId,launchRect)
  openFolderId.value = null
  system.openApp(appId)
}
function onFolderAppPointerDown(event, appId) {
  if (event.button != null && event.button !== 0) return
  event.stopPropagation()
  pointer = { id:event.pointerId, mode:'folder-app-ready', appId, folderId:openFolderId.value,
    startX:event.clientX, startY:event.clientY, lastX:event.clientX, lastY:event.clientY, startedAt:performance.now(), captureTarget:event.currentTarget, captureEl:null }
  bindWindow()
}
function createSelectedFolder() {
  const apps = home.selectedItemIds.filter((id) => home.items[id]?.type === 'app')
  if (apps.length >= 2) home.createFolder(apps, home.currentPage, 0)
}
function showToast(message) {
  toast.value = message
  setTimeout(() => { if (toast.value === message) toast.value = '' },1800)
}
function requestRemove(itemId) {
  const item = home.items[itemId]
  if (!item) return
  if (item.type === 'widget' || item.type === 'folder') { animateRemoval([itemId]); return }
  if (!home.canUninstall(item.appId)) { showToast('核心应用不可卸载'); return }
  pendingRemoval.value = [itemId]
}
function requestSelectedRemoval() {
  const ids = home.selectedItemIds.filter((id) => home.items[id]?.type === 'app')
  if (!ids.length) return
  if (ids.some((id) => home.items[id]?.type === 'app' && !home.canUninstall(home.items[id].appId))) {
    showToast('核心应用不可卸载'); return
  }
  pendingRemoval.value = ids
}
function removeSelectedFromDesktop() {
  const ids = [...home.selectedItemIds]
  if (!ids.length) return
  removingIds.value = ids
  setTimeout(() => {
    for (const id of ids) {
      const item = home.items[id]
      if (item?.type === 'app') home.removeFromDesktop(id)
      else if (item?.type === 'widget') home.removeWidget(item.widgetId)
      else if (item?.type === 'folder') home.removeFolder(item.folderId)
    }
    removingIds.value = []
  },180)
}
function confirmRemoval() {
  const ids = [...pendingRemoval.value]
  pendingRemoval.value = []
  animateRemoval(ids)
}
function animateRemoval(ids) {
  removingIds.value = ids
  setTimeout(() => {
    for (const id of ids) {
      const item = home.items[id]
      if (item?.type === 'app') home.uninstallApp(item.appId)
      else if (item?.type === 'widget') home.removeWidget(item.widgetId)
      else if (item?.type === 'folder') home.removeFolder(item.folderId)
    }
    removingIds.value = []
  },180)
}
const canGroupSelection = computed(() => home.selectedItemIds.filter((id) => home.items[id]?.type === 'app').length >= 2)
const canUninstallSelection = computed(() => hasSelection.value && home.selectedItemIds.every((id) => {
  const item = home.items[id]
  return item?.type === 'app' && home.canUninstall(item.appId)
}))

const folderSizes = [[1,1],[2,1],[1,2],[2,2]]

function getPageThumbnailItems(pageIndex) {
  const page = displayPages.value[pageIndex] || []
  const frames = displayPositions.value[pageIndex] || {}
  const rowHeight = (home.profile.workspaceRect.height || 562) / 6
  return page.map((id) => {
    const frame = frames[id] || { col: 0, y: home.profile.workspaceRect.top, spanX: 1, spanY: 1 }
    const row = Math.max(0, Math.min(5, Math.round((frame.y - home.profile.workspaceRect.top) / rowHeight)))
    const isSelected = home.selectedItemIds.includes(id)
    const isLarge = (frame.spanX || 1) > 1 || (frame.spanY || 1) > 1
    return {
      id,
      col: frame.col || 0,
      row,
      spanX: frame.spanX || 1,
      spanY: frame.spanY || 1,
      isLarge,
      isSelected
    }
  })
}

function chooseThumbnailCard(index) {
  if (index < displayPages.value.length) {
    home.setPage(index)
  } else {
    showToast('空白页')
  }
}
let resizeObserver = null
let resizeFrame = null
function measureViewport() {
  const root = rootRef.value
  if (!root) return
  if (pointer) cleanup(true)
  const style = getComputedStyle(root)
  home.setViewport({
    width: root.offsetWidth,
    height: root.offsetHeight,
    safeTop: parseFloat(style.getPropertyValue('--safe-top')) || 54,
    safeBottom: parseFloat(style.getPropertyValue('--safe-bottom')) || 34
  })
}
onMounted(() => {
  window.addEventListener('keydown',onHomeKeydown)
  measureViewport()
  resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(measureViewport)
  })
  resizeObserver.observe(rootRef.value)
})
onBeforeUnmount(() => { resizeObserver?.disconnect(); cancelAnimationFrame(resizeFrame); clearTimeout(unlockTimer); clearTimeout(pageIndicatorTimer); clearTimeout(wheelResetTimer); clearTimeout(pinchWheelTimer); clearTimeout(suppressClickTimer); clearTimers(); unbindWindow(); unbindPinchWindow(); window.removeEventListener('keydown',onHomeKeydown); document.querySelectorAll('.folder-merge-clone').forEach((node) => node.remove()) })
</script>

<template>
  <div ref="rootRef" class="home-screen" :class="{ 'just-unlocked':justUnlocked, 'is-editing':home.editing }" :style="homeStyle" @pointerdown.capture="onRootPointerDownCapture" @pointerdown="onEmptyPointerDown" @wheel="onWheel" @dragstart.prevent>
    <div class="home-page-strip" :style="stripStyle">
      <section v-for="(page,pageIndex) in displayPages" :key="pageIndex" class="home-page">
        <AppGrid :page-index="pageIndex" :item-ids="page" :items="home.items" :positions="displayPositions[pageIndex] || {}" :profile="home.profile"
          :folders="displayFolders" :editing="home.editing" :selected-ids="home.selectedItemIds" :dragging-id="dragging?.id" :folder-target-id="folderTargetId" :folder-candidate-id="folderMergeCandidate?.id" :folder-candidate-armed="folderMergeCandidate?.armed" :merging-folder-item-id="folderMergeAnimation" :removing-ids="removingIds" :suppress-click-id="suppressedClickId" :open-folder-id="openFolderId" :folder-operation-id="folderOperation?.folderId"
          @item-pointerdown="onItemPointerDown" @folder-resize-pointerdown="onFolderResizePointerDown" @toggle-select="home.toggleSelected" @open-folder="showFolder" @request-remove="requestRemove"
          @launch-app="launchFolderApp" />
      </section>
    </div>
    <div v-if="home.editing" class="edit-actions home-editor">
      <div class="edit-action-items">
        <button type="button" :disabled="!canGroupSelection" @click="createSelectedFolder">
          <span class="action-icon"><svg viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="3" width="22" height="22" rx="6" stroke="currentColor" stroke-width="2" fill="none"/><path d="M14 8v12M8 14h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
          <span>成组</span>
        </button>
        <button type="button" :disabled="!hasSelection" @click="removeSelectedFromDesktop">
          <span class="action-icon"><svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 14h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
          <span>移除</span>
        </button>
        <button type="button" :disabled="!canUninstallSelection" @click="requestSelectedRemoval">
          <span class="action-icon"><svg viewBox="0 0 28 28" aria-hidden="true"><path d="M7 9.5h14l-1.2 13.5a2 2 0 0 1-2 1.5H10.2a2 2 0 0 1-2-1.5L7 9.5Z" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M5 9.5h18M10.5 9.5V6.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v3M11.5 13v7M16.5 13v7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
          <span>卸载</span>
        </button>
      </div>
      <button type="button" class="done-pill" @click="home.setEditing(false)">完成</button>
    </div>
    <div class="indicator-wrap" :style="indicatorStyle"><PageIndicator :count="displayPages.length" :current="home.currentPage" :show-pages="home.editing || showPageDots" @search="emit('open-library')" /></div>
    <DockBar v-if="!home.editing" :profile="home.profile" :dragging-id="dragging?.id" :dock-target-index="dockTargetIndex" :removing-ids="removingIds" :suppress-click-id="suppressedClickId" @item-pointerdown="onDockPointerDown"
      @toggle-select="home.toggleSelected" @request-remove="requestRemove" />
    <HomeFolderOverlay v-if="openFolderId && home.folders[openFolderId]" :folder="home.folders[openFolderId]" :origin="folderOrigin"
      @close="openFolderId=null" @rename="home.renameFolder(openFolderId,$event)" @app-pointerdown="onFolderAppPointerDown" @launch-app="launchFolderApp" />
    <Transition name="editor-panel" mode="out-in">
      <div v-if="home.editing && !hasSelection" key="tools" class="edit-dashboard home-editor">
        <button class="depth-card" type="button" @click="showToast('景深桌面：开发中')">
          <span class="depth-preview">
            <span class="depth-phone depth-phone-back">
              <svg class="depth-svg-screen" viewBox="0 0 36 68" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#4a7ebb"/>
                    <stop offset="65%" stop-color="#8bb8e8"/>
                    <stop offset="100%" stop-color="#dce8f7"/>
                  </linearGradient>
                </defs>
                <rect width="36" height="68" fill="url(#sky-grad)"/>
                <circle cx="18" cy="3.5" r="1.1" fill="#111"/>
                <g fill="rgba(255,255,255,0.72)">
                  <rect x="4.5" y="8" width="4.5" height="4.5" rx="1.2"/>
                  <rect x="11.5" y="8" width="4.5" height="4.5" rx="1.2"/>
                  <rect x="18.5" y="8" width="4.5" height="4.5" rx="1.2"/>
                  <rect x="25.5" y="8" width="4.5" height="4.5" rx="1.2"/>
                  <rect x="4.5" y="15" width="4.5" height="4.5" rx="1.2"/>
                  <rect x="11.5" y="15" width="4.5" height="4.5" rx="1.2"/>
                  <rect x="18.5" y="15" width="4.5" height="4.5" rx="1.2"/>
                  <rect x="25.5" y="15" width="4.5" height="4.5" rx="1.2"/>
                </g>
                <path d="M4 68 C4 48 14 44 20 48 C24 50 32 54 34 68 Z" fill="#2d4868"/>
                <circle cx="17" cy="41" r="5.5" fill="#f3cbaf"/>
                <path d="M12 39 C12 35 17 33 22 35 C24 37 24 41 22 42 Z" fill="#1b2a40"/>
                <path d="M18 68 C18 53 25 49 33 51 C36 52 36 68 36 68 Z" fill="#446a94"/>
                <circle cx="28" cy="45" r="4.5" fill="#f0c2a2"/>
                <path d="M24 43 C24 40 28 38 32 40 C34 42 34 45 32 46 Z" fill="#2d4868"/>
              </svg>
            </span>
            <span class="depth-phone depth-phone-front">
              <svg class="depth-svg-screen" viewBox="0 0 38 72" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lawn-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#edf6e6"/>
                    <stop offset="35%" stop-color="#a4ce8c"/>
                    <stop offset="100%" stop-color="#467735"/>
                  </linearGradient>
                  <radialGradient id="ball-grad" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stop-color="#ff9179"/>
                    <stop offset="70%" stop-color="#d94322"/>
                    <stop offset="100%" stop-color="#7a1a08"/>
                  </radialGradient>
                </defs>
                <rect width="38" height="72" fill="url(#lawn-grad)"/>
                <circle cx="19" cy="3.5" r="1.1" fill="#111"/>
                <path d="M17 64 L19.5 50 L24.5 50 L23.5 64" stroke="#222" stroke-width="2.6" stroke-linecap="round" fill="none"/>
                <path d="M17.5 50 L19.5 38 L25.5 38 L24.5 50 Z" fill="#fff"/>
                <circle cx="22" cy="33" r="3.6" fill="#f3cbaf"/>
                <path d="M19 32.5 C19 29.5 23.5 28.5 25.5 30.5 L27.5 32.5 Z" fill="#222"/>
                <path d="M21 40 L26 31 L32.5 19" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
                <line x1="26" y1="31" x2="34" y2="12" stroke="#d5d5d5" stroke-width="1"/>
                <path d="M33 12 L36 11 L35.5 13.5 Z" fill="#888"/>
                <circle cx="11" cy="58" r="5.5" fill="url(#ball-grad)"/>
              </svg>
            </span>
          </span>
          <span class="depth-label">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m12 2 9 4.5-9 4.5-9-4.5L12 2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <path d="m3 11 9 4.5 9-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
              <path d="m3 16 9 4.5 9-4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
            </svg>
            景深桌面
          </span>
        </button>
        <div class="edit-tool-grid">
          <button type="button" @click="showToast('壁纸与个性化：开发中')">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="3" width="14" height="18" rx="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
              <path d="m8 13 2.5-2.5 2 2 3-3 1.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <circle cx="9.5" cy="8" r="1" fill="currentColor"/>
              <circle cx="12" cy="18" r="0.75" fill="currentColor"/>
            </svg>
            <span>壁纸</span>
          </button>
          <button type="button" @click="showToast('小组件：开发中')">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="4" width="7" height="6" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
              <rect x="13" y="4" width="7" height="11" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
              <rect x="4" y="12" width="7" height="8" rx="1.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
              <rect x="13" y="17" width="7" height="3" rx="1" stroke="currentColor" stroke-width="1.8" fill="none"/>
            </svg>
            <span>小部件</span>
          </button>
          <button type="button" @click="showToast('图标：开发中')">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="4" width="6.5" height="6.5" rx="2.2" fill="currentColor"/>
              <rect x="13.5" y="4" width="6.5" height="6.5" rx="2.2" fill="currentColor"/>
              <rect x="4" y="13.5" width="6.5" height="6.5" rx="2.2" fill="currentColor"/>
              <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2.2" fill="currentColor"/>
            </svg>
            <span>图标</span>
          </button>
          <button type="button" @click="showToast('桌面设置：开发中')">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.8" fill="none"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" stroke-width="1.8" fill="none"/>
            </svg>
            <span>设置</span>
          </button>
        </div>
      </div>
      <div v-else-if="home.editing" key="layouts" class="layout-picker home-editor">
        <div class="thumbnail-scroll">
          <button
            v-for="index in displayPages.length + 1"
            :key="index - 1"
            type="button"
            class="thumbnail-card"
            :class="{
              'is-active': index - 1 === home.currentPage,
              'is-blank': index - 1 === displayPages.length
            }"
            :aria-label="index - 1 < displayPages.length ? `第${index}页缩略图` : '空白页缩略图'"
            @click="chooseThumbnailCard(index - 1)"
          >
            <div v-if="index - 1 < displayPages.length" class="mini-grid">
              <span
                v-for="item in getPageThumbnailItems(index - 1)"
                :key="item.id"
                class="mini-cell"
                :class="{ 'is-large': item.isLarge, 'is-selected': item.isSelected }"
                :style="{
                  gridColumn: `${item.col + 1} / span ${item.spanX}`,
                  gridRow: `${item.row + 1} / span ${item.spanY}`
                }"
              ></span>
            </div>
          </button>
        </div>
      </div>
    </Transition>
    <div v-if="toast" class="home-toast">{{ toast }}</div>
    <ActionModal :visible="pendingRemoval.length > 0" title="卸载应用？" desc="应用将从桌面、文件夹、Dock 和应用资源库中移除。"
      cancel-text="取消" confirm-text="卸载" @cancel="pendingRemoval=[]" @backdrop="pendingRemoval=[]" @confirm="confirmRemoval" />
    <div v-if="ghost" ref="ghostRef" class="drag-ghost" :class="{ 'is-page-flipping': isPageFlipping }" :style="{ width:`${ghost.width}px`,height:`${ghost.height}px`,transform:`translate3d(${ghost.x}px,${ghost.y}px,0)` }"></div>
  </div>
</template>

<style scoped>
:global(.screen-view:has(.home-screen.is-editing) .status-bar) {
  opacity: 0.4;
  transition: opacity 280ms cubic-bezier(.22,.8,.26,1);
}
.home-screen{position:absolute;inset:0;z-index:var(--z-home);overflow:hidden;touch-action:none}
.home-page-strip{position:absolute;inset:0;display:flex;will-change:transform}
.home-page{flex:0 0 100%;width:100%;height:100%}
.indicator-wrap{position:absolute;bottom:136px;left:0;right:0;display:flex;justify-content:center;transition:bottom 320ms cubic-bezier(.22,.8,.26,1)}
.drag-ghost{position:absolute;left:0;top:0;z-index:999;pointer-events:none;filter:drop-shadow(0 12px 18px rgba(0,0,0,.35));transform-origin:center;will-change:transform}
.drag-ghost>*{transform:scale(1.08)!important;transform-origin:center!important;transition:transform 200ms cubic-bezier(.34,1.56,.64,1)}
.drag-ghost.is-page-flipping>*{transform:scale(1.18)!important}
.edit-actions{position:absolute;left:14px;right:14px;top:46px;z-index:22;display:flex;align-items:center;justify-content:space-around}
.edit-action-items{width:100%;display:flex;align-items:center;justify-content:space-around}
.edit-action-items button{display:flex;flex-direction:column;align-items:center;gap:4px;color:rgba(255,255,255,.9);font:500 12px/1.2 var(--font-stack);background:transparent;border:none;cursor:pointer;padding:4px 12px;transition:opacity 160ms ease,transform 160ms ease}
.edit-action-items button:active:not(:disabled){transform:scale(.92)}
.edit-action-items button:disabled{opacity:.52}
.edit-action-items .action-icon{width:28px;height:28px;display:grid;place-items:center;background:transparent;border:none;box-shadow:none}
.edit-action-items svg{width:26px;height:26px;color:#fff}
.done-pill{position:absolute;opacity:0;pointer-events:none;width:0;height:0;margin:0;padding:0;border:0;overflow:hidden}
.edit-dashboard{position:absolute;left:18px;right:18px;bottom:calc(var(--safe-bottom, 34px) + 8px);height:136px;z-index:22;display:grid;grid-template-columns:1fr 1.08fr;gap:10px}
.depth-card,.edit-tool-grid button{border:.5px solid rgba(255,255,255,.18);background:rgba(30,34,48,.62);box-shadow:0 4px 16px rgba(0,0,0,.22),inset 0 1px 1px rgba(255,255,255,.16);backdrop-filter:blur(24px) saturate(140%);-webkit-backdrop-filter:blur(24px) saturate(140%);color:#fff;cursor:pointer;box-sizing:border-box;transition:transform 160ms ease,background 160ms ease}
.depth-card:active,.edit-tool-grid button:active{transform:scale(.96);background:rgba(45,50,68,.72)}
.depth-card{border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:8px 6px 9px;height:100%;min-height:0}
.depth-preview{position:relative;width:86px;height:72px;display:flex;align-items:center;justify-content:center}
.depth-phone{position:absolute;border-radius:6px;overflow:hidden;box-sizing:border-box}
.depth-phone-back{width:34px;height:60px;left:11px;top:4px;border:1.2px solid rgba(255,255,255,.36);background:#1e2430;transform:rotate(-3deg);z-index:1;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.depth-phone-front{width:36px;height:64px;right:10px;top:5px;border:1.2px solid rgba(255,255,255,.6);background:#182218;transform:rotate(2deg);z-index:2;box-shadow:0 4px 14px rgba(0,0,0,.45)}
.depth-svg-screen{display:block;width:100%;height:100%}
.depth-label{display:flex;align-items:center;gap:5px;font:500 12px/1 var(--font-stack);color:#fff;letter-spacing:.2px}
.depth-label svg{width:16px;height:16px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.edit-tool-grid{display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr);gap:8px;height:100%}
.edit-tool-grid button{border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:0;height:100%;min-height:0;font:500 11.5px/1 var(--font-stack);color:rgba(255,255,255,.92)}
.edit-tool-grid svg{width:22px;height:22px;flex-shrink:0}
.layout-picker,.thumbnail-deck{position:absolute;left:0;right:0;bottom:calc(var(--safe-bottom, 34px) + 6px);height:76px;z-index:22;display:flex;align-items:center;justify-content:center;padding:0 16px;box-sizing:border-box;background:transparent!important;box-shadow:none!important;border:none!important}
.thumbnail-scroll{display:flex;align-items:center;justify-content:center;gap:8px;max-width:100%;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:2px 4px}
.thumbnail-scroll::-webkit-scrollbar{display:none}
.thumbnail-card{position:relative;width:44px;height:74px;flex:0 0 44px;border-radius:12px;box-sizing:border-box;padding:6px 4px;cursor:pointer;background:rgba(255,255,255,.12);backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%);border:1px solid rgba(255,255,255,.24);box-shadow:0 4px 14px rgba(0,0,0,.12);transition:transform 160ms ease,background 160ms ease,border-color 160ms ease,box-shadow 160ms ease;display:flex;align-items:center;justify-content:center}
.thumbnail-card:active{transform:scale(.95)}
.thumbnail-card.is-active{background:rgba(255,255,255,.24);border:1.5px solid rgba(255,255,255,.88);box-shadow:0 4px 16px rgba(0,0,0,.18),inset 0 0 0 1px rgba(255,255,255,.18)}
.thumbnail-card.is-blank{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);box-shadow:0 4px 12px rgba(0,0,0,.08)}
.mini-grid{width:100%;height:100%;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(6,1fr);gap:3px 2px;align-items:center;justify-items:center;pointer-events:none}
.mini-cell{width:100%;height:100%;max-width:6.5px;max-height:6.5px;border-radius:1.8px;background:rgba(255,255,255,.55);box-sizing:border-box;transition:background 160ms ease,box-shadow 160ms ease}
.mini-cell.is-large{max-width:100%;max-height:100%;border-radius:3.5px;background:rgba(255,255,255,.45)}
.mini-cell.is-selected{background:#007aff!important;box-shadow:0 0 4px rgba(0,122,255,.9)}
.editor-panel-enter-active,.editor-panel-leave-active{transition:opacity 180ms ease,transform 220ms cubic-bezier(.22,.8,.26,1)}
.editor-panel-enter-from,.editor-panel-leave-to{opacity:0;transform:translateY(16px) scale(.96)}
.home-toast{position:absolute;left:50%;bottom:198px;z-index:80;transform:translateX(-50%);padding:9px 15px;border-radius:17px;background:rgba(20,20,24,.82);color:#fff;white-space:nowrap;font:600 13px/1 var(--font-stack);animation:toast-in 180ms ease}
@keyframes toast-in{from{opacity:0;transform:translate(-50%,8px)}}
@media (prefers-reduced-motion:reduce){.home-page-strip,.indicator-wrap,.editor-panel-enter-active,.editor-panel-leave-active{transition-duration:1ms!important}}
</style>
