<script setup>
import { computed } from 'vue'
import DhShell from './DhShell.vue'
import DhSwitch from './DhSwitch.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'

/**
 * 「睡眠」自定义页（真机 dh_95_sleep_custom2，ModeSettingsActivity 的睡眠模式分支）。
 *
 * 真机结构：插画卡（灰底斑点 + 黑色床图标）→ 说明文字 → 蓝色「立即开启」卡
 * → 灰标「何时自动开启」（"睡觉"日常安排 / 未设置 + 开关）
 * → 灰标「通知过滤条件」（允许所有通知 + 开关 / 联系人 / 应用）。
 * ⚠️ 这一页的小节标题是**灰色**的，与主页/其它子页的蓝色小标不同。
 */
const emit = defineEmits(['back', 'toast'])
const dh = useDigitalHealthStore()

const scheduleOn = computed(() => dh.state.sleep.mode !== '无')

function toggleSchedule(v) {
  dh.setSleepMode(v ? '启用时间表' : '无')
}
function toggleSleep() {
  const next = !dh.state.sleep.enabled
  dh.setSleepEnabled(next)
  emit('toast', next ? '睡眠模式已开启' : '睡眠模式已关闭')
}
</script>

<template>
  <DhShell title="睡眠" @back="emit('back')">
    <template #right>
      <DhOverflowMenu @pick="emit('toast', $event)" />
    </template>

    <!-- 插画卡 -->
    <section class="dh-card dh-art-card" data-dh-sleep-art>
      <svg width="150" height="150" viewBox="0 0 160 160" fill="none" aria-hidden="true">
        <path
          d="M80 8c6 0 10 6 16 6s12-4 17 1 1 11 5 16 11 7 11 13-6 10-6 16 4 12-1 17-11 1-16 5-7 11-13 11-10-6-16-6-12 4-17-1-1-11-5-16-11-7-11-13 6-10 6-16-4-12 1-17 11-1 16-5 7-11 13-11z"
          fill="#DADCE0"
        />
        <rect x="46" y="86" width="68" height="8" rx="4" fill="#1F1F1F" />
        <path d="M104 62v24M104 62h-10" stroke="#1F1F1F" stroke-width="5" stroke-linecap="round" />
        <circle cx="70" cy="74" r="9" fill="#1F1F1F" />
        <path d="M46 94v-14c0-3 2-5 5-5h27c3 0 5 2 5 5v6" fill="#1F1F1F" />
        <rect x="46" y="94" width="6" height="10" rx="2" fill="#1F1F1F" />
        <rect x="108" y="94" width="6" height="10" rx="2" fill="#1F1F1F" />
      </svg>
    </section>

    <p class="dh-art-note">设计安睡日常安排。设置闹钟、调暗屏幕并屏蔽通知。</p>

    <section class="dh-card dh-start-card">
      <button type="button" class="dh-pill" data-dh-sleep-start @click="toggleSleep">
        {{ dh.state.sleep.enabled ? '立即关闭' : '立即开启' }}
      </button>
    </section>

    <!-- 何时自动开启 -->
    <div class="dh-cap">何时自动开启</div>
    <section class="dh-card">
      <div class="dh-row">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3.4c2.6 0 4.4 2 4.4 4.6 0 2.2-1.4 3.4-1.4 5.5 0 2.6-1.2 4.6-3 4.6s-3-2-3-4.6c0-2.1-1.4-3.3-1.4-5.5 0-2.6 1.8-4.6 4.4-4.6z" fill="#5F6368" />
          <path d="M12 18.4v2.2" stroke="#5F6368" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <span class="dh-row-main">
          <span class="dh-row-title">“睡觉”日常安排</span>
          <span class="dh-row-sub">{{ scheduleOn ? dh.state.sleep.mode : '未设置' }}</span>
        </span>
        <DhSwitch
          :model-value="scheduleOn"
          data-dh-schedule-switch
          @update:model-value="toggleSchedule"
        />
      </div>
    </section>

    <!-- 通知过滤条件 -->
    <div class="dh-cap">通知过滤条件</div>
    <section class="dh-card">
      <div class="dh-row">
        <span class="dh-row-main">
          <span class="dh-row-title">允许所有通知</span>
        </span>
        <DhSwitch :model-value="false" disabled data-dh-allow-all />
      </div>
      <div class="dh-divider"></div>
      <button type="button" class="dh-row" @click="emit('toast', '联系人例外需要先设置“睡觉”日常安排')">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9.4" cy="8.2" r="3.1" stroke="#5F6368" stroke-width="1.6" />
          <path d="M3.6 19.4v-1.6c0-2.2 1.8-4 4-4h3.6c2.2 0 4 1.8 4 4v1.6" stroke="#5F6368" stroke-width="1.6" stroke-linecap="round" />
          <path d="M16 5.6a3 3 0 010 5.4M18.4 19.4v-1.6c0-1.6-.7-2.9-1.8-3.6" stroke="#5F6368" stroke-width="1.6" stroke-linecap="round" />
        </svg>
        <span class="dh-row-main">
          <span class="dh-row-title">联系人</span>
          <span class="dh-row-sub">某些人例外</span>
        </span>
      </button>
      <div class="dh-divider"></div>
      <button type="button" class="dh-row" @click="emit('toast', '通知过滤条件需要先设置“睡觉”日常安排')">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="#5F6368" aria-hidden="true">
          <circle cx="6" cy="6" r="1.7" /><circle cx="12" cy="6" r="1.7" /><circle cx="18" cy="6" r="1.7" />
          <circle cx="6" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="18" cy="12" r="1.7" />
          <circle cx="6" cy="18" r="1.7" /><circle cx="12" cy="18" r="1.7" /><circle cx="18" cy="18" r="1.7" />
        </svg>
        <span class="dh-row-main">
          <span class="dh-row-title">应用</span>
          <span class="dh-row-sub">正在计算…</span>
        </span>
      </button>
    </section>
  </DhShell>
</template>

<style scoped>
.dh-art-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px 0;
}

.dh-art-note {
  margin: 0;
  padding: 0 6px 16px;
  font-size: 16px;
  line-height: 23px;
  color: #1F1F1F;
  text-align: center;
}

.dh-start-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 0;
}

.dh-cap {
  font-size: 13px;
  color: #5F6368;
  padding: 14px 6px 8px;
}
</style>
