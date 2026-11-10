<script setup>
import { computed } from 'vue'
import DhShell from './DhShell.vue'
import DhCheck from './DhCheck.vue'
import DhSwitch from './DhSwitch.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import { getRegisteredApps } from '../../../../composables/useRegisteredApps.js'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'

/**
 * 屏幕使用时间提醒（真机 dh_63_reminder，MindfulNudgeActivity）。
 *
 * 真机结构：整块浅蓝大圆角行「使用提醒功能 + Material 开关」→ 说明文字
 * → 蓝色小标「会显示提醒的应用」→ 全部应用 + 右侧**蓝色实心方形复选**（默认全选）。
 * 关掉总开关后，下面的复选框整体变灰不可改（真机同样如此）。
 */
const emit = defineEmits(['back', 'toast', 'overflow'])
const dh = useDigitalHealthStore()

const apps = getRegisteredApps()
const on = computed(() => dh.state.reminderEnabled)

function toggleApp(app) {
  if (!dh.toggleReminderApp(app.id)) {
    emit('toast', '请先打开“使用提醒功能”')
  }
}
</script>

<template>
  <DhShell title="屏幕使用时间提醒" @back="emit('back')">
    <template #right>
      <DhOverflowMenu @pick="emit('overflow', $event)" />
    </template>

    <section class="dh-reminder-head" data-dh-reminder-head>
      <span class="dh-reminder-title">使用提醒功能</span>
      <DhSwitch
        :model-value="on"
        data-dh-reminder-switch
        @update:model-value="dh.setReminderEnabled($event)"
      />
    </section>

    <p class="dh-note">如果您长时间使用某款应用，就会收到贴心的提醒</p>

    <div class="dh-label">会显示提醒的应用</div>
    <div class="dh-card" :class="{ 'is-off': !on }" data-dh-reminder-list>
      <div v-for="app in apps" :key="app.id" class="dh-row dh-check-row" :data-dh-reminder-app="app.id">
        <RegisteredAppIcon :app="app" :size="30" />
        <span class="dh-row-main">
          <span class="dh-row-title">{{ app.name }}</span>
        </span>
        <DhCheck
          :checked="dh.isReminderApp(app.id)"
          :disabled="!on"
          @toggle="toggleApp(app)"
        />
      </div>
    </div>
  </DhShell>
</template>

<style scoped>
.dh-reminder-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #D7E5FB;
  border-radius: 22px;
  padding: 14px 16px 14px 20px;
  min-height: 76px;
  box-sizing: border-box;
  margin-bottom: 16px;
}

.dh-reminder-title { font-size: 15.5px; color: #1F1F1F; }

.dh-check-row { padding: 10px 16px; gap: 16px; }

.dh-card.is-off { opacity: 0.55; }
</style>
