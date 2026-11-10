<script setup>
import { ref, watch } from 'vue'
import FocusHome from './FocusHome.vue'
import FocusDetail from './FocusDetail.vue'
import FocusCreateFlow from './FocusCreateFlow.vue'
import { useFocusSettingsStore } from '../../../../stores/focusSettingsStore.js'
import '../../../../styles/layer-transitions.css'

const emit = defineEmits(['back'])
const focus = useFocusSettingsStore()
const page = ref('main')
const selectedModeId = ref(null)
const isBack = ref(false)
const detailRef = ref(null)
const createRef = ref(null)

function openMode(id) {
  if (!focus.getMode(id)) return
  isBack.value = false
  selectedModeId.value = id
  page.value = 'detail'
}
function create() {
  isBack.value = false
  page.value = 'create'
}
function goHome() {
  isBack.value = true
  page.value = 'main'
  selectedModeId.value = null
}
function back() {
  if (page.value === 'create' && createRef.value?.back) return createRef.value.back()
  if (page.value === 'detail' && detailRef.value?.back) return detailRef.value.back()
  if (page.value !== 'main') { goHome(); return true }
  emit('back')
  return true
}
function handleTarget() {
  if (!focus.state.targetView && !focus.state.targetModeId) return
  const target = focus.consumeTarget()
  if (target.view === 'create') create()
  else if (target.modeId) openMode(target.modeId)
  else goHome()
}
watch(() => [focus.state.targetView, focus.state.targetModeId], handleTarget, { immediate: true })
defineExpose({ back, openMode, create })
</script>

<template>
  <div class="settings-focus" data-settings-focus>
    <Transition :name="isBack ? 'slide-back' : 'slide'">
      <FocusHome v-if="page === 'main'" key="main" @back="emit('back')" @open-mode="openMode" @create="create" />
      <FocusDetail v-else-if="page === 'detail' && selectedModeId" ref="detailRef" :key="selectedModeId" :mode-id="selectedModeId" @back="goHome" @deleted="goHome" />
      <FocusCreateFlow v-else ref="createRef" key="create" @cancel="goHome" @complete="openMode" />
    </Transition>
  </div>
</template>

<style scoped>
.settings-focus { position: absolute; inset: 0; overflow: hidden; background: #F0F1F2; }
</style>
