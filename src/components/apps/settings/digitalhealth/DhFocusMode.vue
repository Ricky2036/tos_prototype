<script setup>
import { computed, ref } from 'vue'
import DhShell from './DhShell.vue'
import DhCheck from './DhCheck.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import { getRegisteredApps } from '../../../../composables/useRegisteredApps.js'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'

/**
 * 专注模式（真机 dh_62_focus，FocusModeSettingsActivity）。
 *
 * 真机结构：说明文字 → 灰字「+ 设置时间表」→ 灰色禁用胶囊「立即开启」
 * → 蓝色小标「选择会让您分心的应用」→ 全部应用 + 右侧方形复选框。
 * 「立即开启」在没选应用时是禁用态（灰底灰字），选了应用才变蓝可点。
 */
const emit = defineEmits(['back', 'toast'])
const dh = useDigitalHealthStore()

const apps = getRegisteredApps()
const count = computed(() => dh.state.focusApps.length)
const canStart = computed(() => count.value > 0)
const schedules = ref(0)

function addSchedule() {
  if (!canStart.value) {
    emit('toast', '请先选择会让您分心的应用')
    return
  }
  schedules.value += 1
  emit('toast', `已添加 ${schedules.value} 个专注时间表`)
}
function start() {
  if (!canStart.value) return
  emit('toast', `专注模式已开启（屏蔽 ${count.value} 个应用）`)
}
</script>

<template>
  <DhShell title="专注模式" @back="emit('back')">
    <template #right>
      <DhOverflowMenu @pick="emit('toast', $event)" />
    </template>

    <p class="dh-note">需要保持专注时，您可以暂停让您分心的应用并隐藏其通知</p>

    <button type="button" class="dh-addrow" data-dh-add-schedule @click="addSchedule">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4.6v14.8M4.6 12h14.8" stroke="#9AA0A6" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      <span>设置时间表<template v-if="schedules">（{{ schedules }}）</template></span>
    </button>

    <div class="dh-startwrap">
      <button
        type="button"
        class="dh-pill"
        :disabled="!canStart"
        data-dh-focus-start
        @click="start"
      >立即开启</button>
    </div>

    <div class="dh-label">选择会让您分心的应用</div>
    <div class="dh-card" data-dh-focus-list>
      <div v-for="app in apps" :key="app.id" class="dh-row dh-focus-row" :data-dh-focus-app="app.id">
        <RegisteredAppIcon :app="app" :size="30" />
        <span class="dh-row-main">
          <span class="dh-row-title">{{ app.name }}</span>
        </span>
        <DhCheck
          :checked="dh.isFocusApp(app.id)"
          @toggle="dh.toggleFocusApp(app.id)"
        />
      </div>
    </div>
  </DhShell>
</template>

<style scoped>
.dh-addrow {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 16px 6px;
  font-family: inherit;
  font-size: 16px;
  color: #9AA0A6;
  cursor: pointer;
  text-align: left;
}

.dh-startwrap { padding: 6px 0 4px; }

.dh-focus-row { padding: 10px 16px; gap: 16px; }
</style>
