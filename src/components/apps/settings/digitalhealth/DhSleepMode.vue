<script setup>
import { computed, ref } from 'vue'
import DhShell from './DhShell.vue'
import DhSwitch from './DhSwitch.vue'
import LIcon from '../../../ui/LIcon.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import { useDigitalHealthStore, DH_SLEEP_MODES, DH_DAY_FULL } from '../../../../stores/digitalHealthStore.js'

/**
 * 睡眠模式（真机 dh_61_sleep / dh_72_sleep_start，WindDownActivity）。
 *
 * 真机结构：说明文字 → 浅蓝卡「睡眠模式已关闭 + 立即开启 + 插画」
 * → 浅蓝卡「"睡觉"日常安排」（可展开为单选 启用时间表 / 在充电时开启 / 无 + 闹钟行为）
 * → 浅蓝卡「模式自定义选项」→ 点进「睡眠」自定义页。
 *
 * 开启后的变化（Ricky 2026-11-10 要求补全）：
 *   ① 顶部出现运行条「睡眠模式运行中 · 07:00 结束」
 *   ② 卡内文案变「睡眠模式已开启」，按钮变「立即关闭」，并补一行时间表信息
 *   ③ 主页「睡眠模式」副文案变「已开启」
 */
const emit = defineEmits(['back', 'open-settings', 'open-schedule', 'toast'])
const dh = useDigitalHealthStore()

/** 已选过日常安排时默认展开：从「睡眠时间表」返回后能直接看到汇总行 */
const scheduleOpen = ref(dh.state.sleep.mode !== '无')
const sleep = computed(() => dh.state.sleep)
const modeText = computed(() => (sleep.value.mode === '无' ? '未设置' : sleep.value.mode))

const daysText = computed(() => {
  const d = sleep.value.schedule.days
  if (!d.length) return '未选择'
  if (d.length === 7) return '每天'
  if (d.length === 5 && [1, 2, 3, 4, 5].every(x => d.includes(x))) return '工作日'
  if (d.length === 2 && d.includes(0) && d.includes(6)) return '周末'
  return d.map(x => DH_DAY_FULL[x]).join('、')
})

const scheduleLine = computed(() => `${sleep.value.schedule.start} – ${sleep.value.schedule.end} · ${daysText.value}`)

/** 已开启时用结束时间做一句人话文案（真机同样在卡内提示几点结束） */
const endHint = computed(() => `将于 ${sleep.value.schedule.end} 结束`)

function toggleSleep() {
  const next = !sleep.value.enabled
  dh.setSleepEnabled(next)
  emit('toast', next ? `睡眠模式已开启，${endHint.value}` : '睡眠模式已关闭')
}
function pickMode(mode) {
  dh.setSleepMode(mode)
  if (mode === '启用时间表' && !sleep.value.schedule.days.length) {
    emit('toast', '时间表还没选重复日，去设置一下')
    emit('open-schedule')
  }
}
</script>

<template>
  <DhShell title="睡眠模式" @back="emit('back')">
    <template #right>
      <DhOverflowMenu @pick="emit('overflow', $event)" />
    </template>

    <!-- ① 运行条：只在开启时出现 -->
    <div v-if="sleep.enabled" class="dh-running" data-dh-sleep-running>
      <span class="dh-running-dot"></span>
      <span class="dh-running-main">
        <strong>睡眠模式运行中</strong>
        <span>{{ endHint }} · 通知已静音</span>
      </span>
      <button type="button" class="dh-running-end" data-dh-sleep-end @click="toggleSleep">结束</button>
    </div>

    <p class="dh-note">
      在睡眠时间内，此模式会将设备静音、调暗壁纸并将屏幕调成黑白色。仅闹钟和重要来电会发出提醒。
    </p>

    <!-- ② 开关卡 + 插画 -->
    <section class="dh-blue-card dh-sleep-hero" data-dh-sleep-card>
      <div class="dh-sleep-hero-main">
        <span class="dh-sleep-state" data-dh-sleep-state>{{ sleep.enabled ? '睡眠模式已开启' : '睡眠模式已关闭' }}</span>
        <span
          v-if="sleep.enabled && sleep.mode !== '无'"
          class="dh-sleep-sched"
          data-dh-sleep-sched-line
        >{{ scheduleLine }}</span>
        <button type="button" class="dh-pill" data-dh-sleep-toggle @click="toggleSleep">
          {{ sleep.enabled ? '立即关闭' : '立即开启' }}
        </button>
      </div>

      <svg class="dh-sleep-art" width="112" height="104" viewBox="0 0 120 110" fill="none" aria-hidden="true">
        <circle cx="30" cy="62" r="15" fill="#DADCE0" opacity="0.75" />
        <path d="M60 108c0-20 8-32 22-32s22 12 22 32z" fill="#9C7BA8" />
        <path d="M60 108c0-20 8-32 20-32v32z" fill="#8E6E9B" />
        <ellipse cx="82" cy="52" rx="19" ry="23" fill="#B08968" />
        <path d="M63 44c0-12 8-20 19-20s19 8 19 20c0 4-3 6-6 5-4-1-7-4-13-4s-9 3-13 4c-3 1-6-1-6-5z" fill="#3C2E28" />
        <ellipse cx="86" cy="52" rx="17" ry="9" transform="rotate(-8 86 52)" fill="#5F6368" />
        <ellipse cx="86" cy="52" rx="17" ry="9" transform="rotate(-8 86 52)" fill="none" stroke="#4A4D52" stroke-width="1.2" />
        <path d="M100 30c6 4 9 9 10 15" stroke="#8E8E93" stroke-width="2.4" stroke-linecap="round" />
      </svg>
    </section>

    <!-- ③ 「睡觉」日常安排 -->
    <section class="dh-blue-card">
      <button type="button" class="dh-row dh-sched" data-dh-schedule @click="scheduleOpen = !scheduleOpen">
        <LIcon name="calendarDays" :size="21" />
        <span class="dh-row-main">
          <span class="dh-row-title">“睡觉”日常安排</span>
          <span class="dh-row-sub" data-dh-schedule-sub>{{ modeText }}</span>
        </span>
        <span class="dh-round-chev" :class="{ open: scheduleOpen }">
          <LIcon name="chevronDown" :size="16" :stroke-width="2.2" />
        </span>
      </button>

      <div v-if="scheduleOpen" class="dh-sched-body" data-dh-schedule-body>
        <button
          v-for="mode in DH_SLEEP_MODES"
          :key="mode"
          type="button"
          class="dh-opt"
          :data-dh-sleep-mode="mode"
          @click="pickMode(mode)"
        >
          <span class="opt-radio" :class="{ checked: sleep.mode === mode }"></span>
          <span class="dh-opt-label">{{ mode }}</span>
        </button>

        <!-- 选了「启用时间表」才露出时间表行 -->
        <button
          v-if="sleep.mode === '启用时间表'"
          type="button"
          class="dh-row dh-sched-row"
          data-dh-open-schedule
          @click="emit('open-schedule')"
        >
          <LIcon name="clock" :size="19" />
          <span class="dh-row-main">
            <span class="dh-row-title">时间表</span>
            <span class="dh-row-sub" data-dh-schedule-line>{{ scheduleLine }}</span>
          </span>
          <LIcon name="chevronRight" :size="16" />
        </button>

        <div class="dh-divider"></div>
        <div class="dh-row dh-alarm">
          <LIcon name="bell" :size="19" />
          <span class="dh-row-main">
            <span class="dh-row-title">闹钟行为</span>
            <span class="dh-row-sub">睡眠期间到点时正常响铃</span>
          </span>
          <DhSwitch
            :model-value="sleep.alarmBehavior"
            data-dh-alarm-switch
            @update:model-value="dh.setAlarmBehavior($event)"
          />
        </div>
      </div>
    </section>

    <!-- ④ 模式自定义选项 -->
    <section class="dh-blue-card">
      <button type="button" class="dh-row" data-dh-sleep-custom @click="emit('open-settings')">
        <LIcon name="settings" :size="21" />
        <span class="dh-row-main">
          <span class="dh-row-title">模式自定义选项</span>
          <span class="dh-row-sub">设置通知过滤条件、睡眠时间的屏幕选项等</span>
        </span>
      </button>
    </section>
  </DhShell>
</template>

<style scoped>
/* 运行条：真机开启后会在内容顶部压一条浅蓝提示 */
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

.dh-running-main {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
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

.dh-sleep-hero {
  display: flex;
  align-items: center;
  padding: 16px 14px 16px 16px;
  gap: 6px;
  min-height: 122px;
}

.dh-sleep-hero-main {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}

.dh-sleep-state { font-size: 16px; color: #1F1F1F; }
.dh-sleep-sched { font-size: 12px; color: #3C5A88; margin-top: -4px; }

.dh-sleep-art { flex: none; }

.dh-sched { padding: 14px 12px 14px 16px; }

.dh-round-chev {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(60, 64, 67, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  color: #3C4043;
  transition: transform 0.18s ease;
}
.dh-round-chev.open { transform: rotate(180deg); }

.dh-sched-body { padding: 0 0 4px; }

.dh-sched-row { padding: 10px 16px; color: #3C4043; }

.dh-opt {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 11px 16px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
}

.dh-opt-label { font-size: 15px; color: #1F1F1F; }

.dh-alarm { padding: 11px 16px 14px; }

/* 单选圆点（本页自有，不依赖 SubPageShell 的 :deep 样式） */
.opt-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.6px solid #747775;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.opt-radio.checked { border-color: #1A73E8; border-width: 2px; }

.opt-radio.checked::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1A73E8;
}
</style>
