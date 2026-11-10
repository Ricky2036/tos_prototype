<script setup>
import { computed, ref } from 'vue'
import DhShell from './DhShell.vue'
import DhSwitch from './DhSwitch.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import { useDigitalHealthStore, DH_SLEEP_MODES } from '../../../../stores/digitalHealthStore.js'

/**
 * 睡眠模式（真机 dh_61_sleep，WindDownActivity）。
 *
 * 真机结构：说明文字（页面底色上）→ 浅蓝卡「睡眠模式已关闭 + 立即开启 + 插画」
 * → 浅蓝卡「"睡觉"日常安排」（可展开为单选 启用时间表 / 在充电时开启 / 无 + 闹钟行为）
 * → 浅蓝卡「模式自定义选项」（副文案两行）→ 点击进「睡眠」自定义页。
 */
const emit = defineEmits(['back', 'open-settings', 'toast'])
const dh = useDigitalHealthStore()

const scheduleOpen = ref(false)
const modeText = computed(() => (dh.state.sleep.mode === '无' ? '未设置' : dh.state.sleep.mode))

function toggleSleep() {
  const next = !dh.state.sleep.enabled
  dh.setSleepEnabled(next)
  emit('toast', next ? '睡眠模式已开启' : '睡眠模式已关闭')
}
function pickMode(mode) {
  dh.setSleepMode(mode)
}
</script>

<template>
  <DhShell title="睡眠模式" @back="emit('back')">
    <template #right>
      <DhOverflowMenu @pick="emit('toast', $event)" />
    </template>

    <p class="dh-note">
      在睡眠时间内，此模式会将设备静音、调暗壁纸并将屏幕调成黑白色。仅闹钟和重要来电会发出提醒。
    </p>

    <!-- ① 开关卡 + 插画 -->
    <section class="dh-blue-card dh-sleep-hero" data-dh-sleep-card>
      <div class="dh-sleep-hero-main">
        <span class="dh-sleep-state" data-dh-sleep-state>{{ dh.state.sleep.enabled ? '睡眠模式已开启' : '睡眠模式已关闭' }}</span>
        <button type="button" class="dh-pill" data-dh-sleep-toggle @click="toggleSleep">
          {{ dh.state.sleep.enabled ? '立即关闭' : '立即开启' }}
        </button>
      </div>

      <!-- 真机插画：戴眼罩的侧脸 + 紫色上衣 + 一侧灰色圆点 -->
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

    <!-- ② 「睡觉」日常安排 -->
    <section class="dh-blue-card">
      <button type="button" class="dh-row dh-sched" data-dh-schedule @click="scheduleOpen = !scheduleOpen">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3.4" y="5" width="17.2" height="15.6" rx="2.4" stroke="#1F1F1F" stroke-width="1.6" />
          <path d="M3.4 9.6h17.2M7.8 3.2v3.4M16.2 3.2v3.4" stroke="#1F1F1F" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="8.2" cy="13.4" r="1.15" fill="#1F1F1F" />
          <circle cx="12" cy="13.4" r="1.15" fill="#1F1F1F" />
          <circle cx="15.8" cy="13.4" r="1.15" fill="#1F1F1F" />
        </svg>
        <span class="dh-row-main">
          <span class="dh-row-title">“睡觉”日常安排</span>
          <span class="dh-row-sub" data-dh-schedule-sub>{{ modeText }}</span>
        </span>
        <span class="dh-round-chev" :class="{ open: scheduleOpen }">
          <svg width="11" height="7" viewBox="0 0 12 8" fill="none">
            <path d="M1.4 1.8L6 6.4L10.6 1.8" stroke="#3C4043" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
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
          <span class="opt-radio" :class="{ checked: dh.state.sleep.mode === mode }"></span>
          <span class="dh-opt-label">{{ mode }}</span>
        </button>

        <div class="dh-divider"></div>
        <div class="dh-row dh-alarm">
          <span class="dh-row-main">
            <span class="dh-row-title">闹钟行为</span>
            <span class="dh-row-sub">睡眠期间到点时正常响铃</span>
          </span>
          <DhSwitch
            :model-value="dh.state.sleep.alarmBehavior"
            data-dh-alarm-switch
            @update:model-value="dh.setAlarmBehavior($event)"
          />
        </div>
      </div>
    </section>

    <!-- ③ 模式自定义选项 -->
    <section class="dh-blue-card">
      <button type="button" class="dh-row" data-dh-sleep-custom @click="emit('open-settings')">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="3.1" stroke="#1F1F1F" stroke-width="1.6" />
          <path
            d="M12 3.2l1 2.4 2.6-.5 1.3 2.3-1.7 2 1.7 2-1.3 2.3-2.6-.5-1 2.4-1-2.4-2.6.5-1.3-2.3 1.7-2-1.7-2 1.3-2.3 2.6.5z"
            stroke="#1F1F1F" stroke-width="1.5" stroke-linejoin="round"
          />
        </svg>
        <span class="dh-row-main">
          <span class="dh-row-title">模式自定义选项</span>
          <span class="dh-row-sub">设置通知过滤条件、睡眠时间的屏幕选项等</span>
        </span>
      </button>
    </section>
  </DhShell>
</template>

<style scoped>
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
  gap: 14px;
  flex: 1;
}

.dh-sleep-state { font-size: 16px; color: #1F1F1F; }

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
  transition: transform 0.18s ease;
}
.dh-round-chev.open { transform: rotate(180deg); }

.dh-sched-body { padding: 0 0 4px; }

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
