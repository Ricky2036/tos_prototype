<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import LIcon from '../../ui/LIcon.vue'
import FocusGlyph from '../../apps/settings/focus/FocusGlyph.vue'
import FocusCreateFlow from '../../apps/settings/focus/FocusCreateFlow.vue'
import { focusShortName, useFocusSettingsStore } from '../../../stores/focusSettingsStore.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  anchor: { type: Object, default: null }
})
const emit = defineEmits(['close', 'open-settings'])
const focus = useFocusSettingsStore()
const creating = ref(false)
const createRef = ref(null)

const backdropRef = ref(null)
const cardRef = ref(null)
const closing = ref(false)
let closeTimer = null

watch(() => props.visible, (value) => {
  if (!value) {
    creating.value = false
    closing.value = false
    if (closeTimer) clearTimeout(closeTimer)
  } else {
    nextTick(() => {
      animateOpen()
    })
  }
})

function animateOpen() {
  const panel = backdropRef.value
  const card = cardRef.value
  if (!panel || !card) return

  if (!props.anchor) {
    panel.style.opacity = '1'
    card.style.transform = 'translate3d(0, 0, 0) scale(1, 1)'
    card.style.opacity = '1'
    return
  }

  const anchor = props.anchor
  const rPanel = panel.getBoundingClientRect()
  const s = rPanel.width ? (rPanel.width / panel.clientWidth) : 1

  const rTarget = card.getBoundingClientRect()
  if (!rTarget.width || !rTarget.height) return

  const targetCx = rTarget.left + rTarget.width / 2
  const targetCy = rTarget.top + rTarget.height / 2
  const anchorCx = anchor.x + anchor.width / 2
  const anchorCy = anchor.y + anchor.height / 2

  const dx = (anchorCx - targetCx) / s
  const dy = (anchorCy - targetCy) / s
  const scaleX = anchor.width / rTarget.width
  const scaleY = anchor.height / rTarget.height

  // 初始帧：从 1*1 磁贴锚点位置与几何形态出发，完成一镜到底无缝展开
  panel.style.transition = 'none'
  panel.style.opacity = '0'
  card.style.transition = 'none'
  card.style.transformOrigin = 'center center'
  card.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`
  card.style.opacity = '0.2'

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      panel.style.transition = 'opacity 320ms cubic-bezier(0.2, 0.8, 0.2, 1)'
      panel.style.opacity = '1'
      card.style.transition = 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease-out'
      card.style.transform = 'translate3d(0, 0, 0) scale(1, 1)'
      card.style.opacity = '1'
    })
  })
}

function requestClose() {
  if (closing.value) return
  const panel = backdropRef.value
  const card = cardRef.value
  if (!panel || !card || !props.anchor) {
    emit('close')
    return
  }

  closing.value = true
  const anchor = props.anchor
  const rPanel = panel.getBoundingClientRect()
  const s = rPanel.width ? (rPanel.width / panel.clientWidth) : 1

  const rTarget = card.getBoundingClientRect()
  const targetCx = rTarget.left + rTarget.width / 2
  const targetCy = rTarget.top + rTarget.height / 2
  const anchorCx = anchor.x + anchor.width / 2
  const anchorCy = anchor.y + anchor.height / 2

  const dx = (anchorCx - targetCx) / s
  const dy = (anchorCy - targetCy) / s
  const scaleX = anchor.width / rTarget.width
  const scaleY = anchor.height / rTarget.height

  panel.style.transition = 'opacity 260ms ease-in'
  panel.style.opacity = '0'

  card.style.transition = 'transform 280ms cubic-bezier(0.32, 0, 0.67, 0), opacity 220ms ease-in'
  card.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`
  card.style.opacity = '0'

  closeTimer = setTimeout(() => {
    closing.value = false
    emit('close')
  }, 280)
}

function handleBlankClick(e) {
  // 点击空白处收起：点击落在卡片行、新建按钮或新建流程之外的空白处时收起
  if (e.target.closest('.focus-switcher-row, .focus-switcher-new, .focus-create-flow')) return
  e.stopPropagation()
  e.preventDefault()
  requestClose()
}

function select(id) {
  focus.toggle(id)
  requestClose()
}

function openMode(id) {
  emit('open-settings', { modeId: id })
}

function created(id) {
  emit('open-settings', { modeId: id })
}

function back() {
  if (creating.value && createRef.value?.back) return createRef.value.back()
  if (creating.value) { creating.value = false; return true }
  requestClose()
  return true
}

onBeforeUnmount(() => {
  if (closeTimer) clearTimeout(closeTimer)
})

defineExpose({ back })
</script>

<template>
  <div
    v-if="visible"
    ref="backdropRef"
    class="focus-switcher"
    data-cc-focus-switcher
    @click="handleBlankClick"
  >
    <FocusCreateFlow
      v-if="creating"
      ref="createRef"
      @cancel="creating = false"
      @complete="created"
    />
    <div
      v-else
      class="focus-switcher-panel"
      @click="handleBlankClick"
    >
      <div ref="cardRef" class="focus-switcher-card-wrap">
        <div class="focus-switcher-list">
          <div
            v-for="mode in focus.state.modes"
            :key="mode.id"
            class="focus-switcher-row"
            :class="{ active: focus.state.activeId === mode.id }"
            :data-cc-focus-mode="mode.id"
          >
            <button class="focus-switcher-main" type="button" @click="select(mode.id)">
              <FocusGlyph :name="mode.icon" :color="focus.state.activeId === mode.id ? mode.color : '#8E8E93'" :size="38" :icon-size="21" />
              <span>
                <strong>{{ focusShortName(mode) }}</strong>
                <small v-if="mode.id === 'dnd'">静音所有通知</small>
                <small v-else-if="focus.state.activeId === mode.id">已开启</small>
              </span>
            </button>
            <button
              class="focus-switcher-more"
              type="button"
              :aria-label="`${mode.name}设置`"
              :data-cc-focus-settings="mode.id"
              @click="openMode(mode.id)"
            >
              <LIcon name="moreHorizontal" :size="21" />
            </button>
          </div>
        </div>
        <button class="focus-switcher-new" type="button" data-cc-focus-create @click="creating = true">
          <span><LIcon name="plus" :size="24" /></span>
          <strong>新专注模式</strong>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.focus-switcher {
  position: absolute;
  inset: 0;
  z-index: 80;
  background: rgba(28, 28, 30, 0.48);
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
  overflow: hidden;
}
.focus-switcher-panel {
  position: absolute;
  inset: 0;
  padding: 210px 34px 34px;
}
.focus-switcher-card-wrap {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  will-change: transform, opacity;
}
.focus-switcher-list {
  display: grid;
  gap: 10px;
}
.focus-switcher-row {
  height: 58px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 29px;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  color: #fff;
  overflow: hidden;
}
.focus-switcher-row.active {
  background: rgba(255, 255, 255, 0.32);
  box-shadow: inset 0 0 0 1px rgba(94, 92, 230, 0.65), 0 0 18px rgba(94, 92, 230, 0.22);
}
.focus-switcher-main {
  height: 100%;
  flex: 1;
  min-width: 0;
  padding: 0 0 0 12px;
  border: 0;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  cursor: pointer;
  text-align: left;
}
.focus-switcher-main > span:nth-child(2) {
  flex: 1;
  text-align: center;
}
.focus-switcher-main strong,
.focus-switcher-main small {
  display: block;
}
.focus-switcher-main strong {
  font-size: 15px;
  font-weight: 500;
}
.focus-switcher-main small {
  margin-top: 1px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}
.focus-switcher-more {
  width: 50px;
  height: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.focus-switcher-new {
  align-self: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.focus-switcher-new > span {
  width: 48px;
  height: 48px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: grid;
  place-items: center;
}
.focus-switcher-new strong {
  font-size: 13px;
  font-weight: 400;
}
</style>
