<script setup>
import { computed } from 'vue'
import DhShell from './DhShell.vue'
import DhCheck from './DhCheck.vue'
import LIcon from '../../../ui/LIcon.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import { getRegisteredApps } from '../../../../composables/useRegisteredApps.js'
import { useDigitalHealthStore, DH_DAY_FULL } from '../../../../stores/digitalHealthStore.js'

/**
 * 专注模式（真机 dh_62_focus，FocusModeSettingsActivity）。
 *
 * 真机结构：说明 → 灰字「+ 设置时间表」→ 灰禁用胶囊「立即开启」
 * → 蓝标「选择会让您分心的应用」→ 全部应用 + 右侧方形复选框。
 *
 * 流程补全（Ricky 2026-11-10）：
 *   ①「+ 设置时间表」→ `DhFocusSchedule` 真实设置页，保存后出现在时间表列表里，可删
 *   ② 点「立即开启」→ 页面顶部出现运行卡（名称 / 剩余 / 结束按钮），主按钮变「结束专注模式」
 *   ③ 结束时给出本次专注时长
 */
const emit = defineEmits(['back', 'toast', 'overflow', 'open-schedule'])
const dh = useDigitalHealthStore()

const apps = getRegisteredApps()
const count = computed(() => dh.state.focusApps.length)
const canStart = computed(() => count.value > 0)
const running = computed(() => dh.state.focusRunning)
const schedules = computed(() => dh.state.focusSchedules)

function scheduleDays(days) {
  if (days.length === 7) return '每天'
  if (days.length === 5 && [1, 2, 3, 4, 5].every(x => days.includes(x))) return '工作日'
  return days.map(d => DH_DAY_FULL[d]).join('、')
}

const endText = computed(() => {
  const r = running.value
  if (!r) return ''
  if (!r.minutes) return '手动结束'
  const t = new Date(r.startedAt + r.minutes * 60000)
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')} 结束`
})

function addSchedule() {
  emit('open-schedule')
}
function start() {
  if (!canStart.value) return
  const first = schedules.value[0]
  dh.startFocus({ name: first?.name || '专注时间', minutes: 25 })
  emit('toast', `专注模式已开启，屏蔽 ${count.value} 个应用`)
}
function stop() {
  const r = running.value
  const mins = r ? Math.max(1, Math.round((Date.now() - r.startedAt) / 60000)) : 1
  dh.stopFocus()
  emit('toast', `已结束专注，本次 ${mins} 分钟`)
}
function remove(s) {
  dh.removeFocusSchedule(s.id)
  emit('toast', `已删除时间表「${s.name}」`)
}
</script>

<template>
  <DhShell title="专注模式" @back="emit('back')">
    <template #right>
      <DhOverflowMenu @pick="emit('overflow', $event)" />
    </template>

    <!-- ① 运行卡 -->
    <div v-if="running" class="dh-running" data-dh-focus-running>
      <span class="dh-running-dot"></span>
      <span class="dh-running-main">
        <strong>{{ running.name }} · 正在专注</strong>
        <span>{{ endText }} · 已屏蔽 {{ count }} 个应用</span>
      </span>
      <button type="button" class="dh-running-end" data-dh-focus-stop @click="stop">结束</button>
    </div>

    <p class="dh-note">需要保持专注时，您可以暂停让您分心的应用并隐藏其通知</p>

    <!-- ② 时间表 -->
    <button type="button" class="dh-addrow" data-dh-add-schedule @click="addSchedule">
      <LIcon name="plus" :size="20" />
      <span>设置时间表</span>
    </button>

    <div v-if="schedules.length" class="dh-card" data-dh-focus-schedules>
      <template v-for="(s, i) in schedules" :key="s.id">
        <div class="dh-row dh-sched-item" :data-dh-focus-schedule="s.id">
          <LIcon name="clock" :size="19" />
          <span class="dh-row-main">
            <span class="dh-row-title">{{ s.name }}</span>
            <span class="dh-row-sub">{{ s.start }} – {{ s.end }} · {{ scheduleDays(s.days) }}</span>
          </span>
          <button type="button" class="dh-icon-btn" data-dh-focus-schedule-del @click="remove(s)">
            <LIcon name="trash2" :size="17" />
          </button>
        </div>
        <div v-if="i < schedules.length - 1" class="dh-divider"></div>
      </template>
    </div>

    <!-- ③ 立即开启 -->
    <div class="dh-startwrap">
      <button
        type="button"
        class="dh-pill"
        :disabled="!canStart && !running"
        data-dh-focus-start
        @click="running ? stop() : start()"
      >{{ running ? '结束专注模式' : '立即开启' }}</button>
    </div>
    <p v-if="!canStart" class="dh-focus-hint">
      <LIcon name="info" :size="15" />
      <span>先在下面勾选至少一个会分心的应用，才能开启专注模式。</span>
    </p>

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
.dh-running {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #D7E5FB;
  border-radius: 14px;
  padding: 11px 12px 11px 14px;
  margin: 4px 0 12px;
}

.dh-running-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1A73E8;
  flex: none;
}

.dh-running-main { display: flex; flex-direction: column; gap: 1px; flex: 1; min-width: 0; }
.dh-running-main strong { font-size: 13.5px; font-weight: 600; color: #174EA6; }
.dh-running-main span { font-size: 12px; color: #3C5A88; }

.dh-running-end {
  border: none;
  background: transparent;
  color: #174EA6;
  font-size: 13.5px;
  font-weight: 600;
  font-family: inherit;
  padding: 6px 10px;
  border-radius: 12px;
  cursor: pointer;
  flex: none;
}
.dh-running-end:active { background: rgba(23, 78, 166, 0.1); }

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

.dh-sched-item { padding: 12px 12px 12px 16px; }

.dh-icon-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #5F6368;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
}
.dh-icon-btn:active { background: rgba(60, 64, 67, 0.08); }

.dh-startwrap { padding: 6px 0 4px; }

.dh-focus-hint {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 0;
  padding: 2px 6px 6px;
  font-size: 12.5px;
  line-height: 18px;
  color: #5F6368;
}

.dh-focus-row { padding: 10px 16px; gap: 16px; }
</style>
