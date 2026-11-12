<script setup>
import { computed } from 'vue'
import DhShell from './DhShell.vue'
import DhSwitch from './DhSwitch.vue'
import LIcon from '../../../ui/LIcon.vue'
import DhOverflowMenu from './DhOverflowMenu.vue'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'

/**
 * 「睡眠」自定义页（真机 dh_95_sleep_custom2，ModeSettingsActivity 的睡眠模式分支）。
 *
 * 真机结构：插画卡（灰底斑点 + 黑色床）→ 说明文字 → 蓝色「立即开启」卡
 * → 灰标「何时自动开启」（"睡觉"日常安排 + 开关 + 时间表行）
 * → 灰标「通知过滤条件」（允许所有通知 + 开关 / 联系人 / 应用）
 * → 灰标「屏幕选项」（调暗壁纸 / 灰度）。
 * ⚠️ 这一页的小节标题是**灰色**的，与主页/其它子页的蓝色小标不同。
 */
const emit = defineEmits(['back', 'toast', 'overflow', 'open-schedule', 'open-filter'])
const dh = useDigitalHealthStore()

const sleep = computed(() => dh.state.sleep)
const scheduleOn = computed(() => sleep.value.mode !== '无')

const notifySummary = computed(() => {
  if (sleep.value.notify.allowAll) return '允许所有通知'
  const n = sleep.value.notify.appExceptions.length
  return n ? `已放行 ${n} 个应用` : '仅允许已选的联系人与应用'
})

const contactSummary = computed(() => {
  const n = sleep.value.notify.contactExceptions.length
  return n ? `已选 ${n} 人` : '某些人例外'
})

function toggleSchedule(v) {
  dh.setSleepMode(v ? '启用时间表' : '无')
  if (v) emit('toast', '已启用时间表')
}
function toggleSleep() {
  const next = !sleep.value.enabled
  dh.setSleepEnabled(next)
  emit('toast', next ? '睡眠模式已开启' : '睡眠模式已关闭')
}
function toggleAllowAll(v) {
  dh.setSleepAllowAll(v)
  emit('toast', v ? '睡眠期间允许所有通知' : '已改为只放行例外名单')
}
</script>

<template>
  <DhShell title="睡眠" @back="emit('back')">
    <template #right>
      <DhOverflowMenu @pick="emit('overflow', $event)" />
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
        {{ sleep.enabled ? '立即关闭' : '立即开启' }}
      </button>
    </section>

    <!-- 何时自动开启 -->
    <div class="dh-cap">何时自动开启</div>
    <section class="dh-card">
      <div class="dh-row">
        <LIcon name="moon" :size="20" />
        <span class="dh-row-main">
          <span class="dh-row-title">“睡觉”日常安排</span>
          <span class="dh-row-sub">{{ scheduleOn ? sleep.mode : '未设置' }}</span>
        </span>
        <DhSwitch
          :model-value="scheduleOn"
          data-dh-schedule-switch
          @update:model-value="toggleSchedule"
        />
      </div>
      <template v-if="scheduleOn">
        <div class="dh-divider"></div>
        <button type="button" class="dh-row" data-dh-sleep-open-schedule @click="emit('open-schedule')">
          <LIcon name="clock" :size="20" />
          <span class="dh-row-main">
            <span class="dh-row-title">时间表</span>
            <span class="dh-row-sub" data-dh-sleep-schedule-value>
              {{ sleep.schedule.start }} – {{ sleep.schedule.end }}
            </span>
          </span>
          <LIcon name="chevronRight" :size="16" />
        </button>
      </template>
    </section>

    <!-- 通知过滤条件 -->
    <div class="dh-cap">通知过滤条件</div>
    <section class="dh-card">
      <div class="dh-row">
        <LIcon name="bellOff" :size="20" />
        <span class="dh-row-main">
          <span class="dh-row-title">允许所有通知</span>
          <span class="dh-row-sub" data-dh-allow-all-summary>{{ notifySummary }}</span>
        </span>
        <DhSwitch
          :model-value="sleep.notify.allowAll"
          data-dh-allow-all
          @update:model-value="toggleAllowAll"
        />
      </div>
      <div class="dh-divider"></div>
      <button
        type="button"
        class="dh-row"
        :class="{ 'is-off': sleep.notify.allowAll }"
        data-dh-open-contacts
        @click="emit('open-filter', 'contacts')"
      >
        <LIcon name="users" :size="20" />
        <span class="dh-row-main">
          <span class="dh-row-title">联系人</span>
          <span class="dh-row-sub" data-dh-contact-summary>{{ contactSummary }}</span>
        </span>
        <LIcon name="chevronRight" :size="16" />
      </button>
      <div class="dh-divider"></div>
      <button
        type="button"
        class="dh-row"
        :class="{ 'is-off': sleep.notify.allowAll }"
        data-dh-open-apps
        @click="emit('open-filter', 'apps')"
      >
        <LIcon name="layoutGrid" :size="20" />
        <span class="dh-row-main">
          <span class="dh-row-title">应用</span>
          <span class="dh-row-sub">{{ sleep.notify.allowAll ? '允许所有应用提醒' : '选择仍可提醒的应用' }}</span>
        </span>
        <LIcon name="chevronRight" :size="16" />
      </button>
    </section>

    <!-- 屏幕选项 -->
    <div class="dh-cap">屏幕选项</div>
    <section class="dh-card">
      <div class="dh-row">
        <LIcon name="smartphone" :size="20" />
        <span class="dh-row-main">
          <span class="dh-row-title">调暗壁纸</span>
          <span class="dh-row-sub">睡眠期间壁纸变暗，减少亮光干扰</span>
        </span>
        <DhSwitch
          :model-value="sleep.screen.dimWallpaper"
          data-dh-screen-dim
          @update:model-value="dh.setSleepScreen('dimWallpaper', $event)"
        />
      </div>
      <div class="dh-divider"></div>
      <div class="dh-row">
        <LIcon name="sun" :size="20" />
        <span class="dh-row-main">
          <span class="dh-row-title">灰阶显示</span>
          <span class="dh-row-sub">把屏幕调成黑白色，降低入睡前的刺激</span>
        </span>
        <DhSwitch
          :model-value="sleep.screen.grayscale"
          data-dh-screen-gray
          @update:model-value="dh.setSleepScreen('grayscale', $event)"
        />
      </div>
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

.is-off { opacity: 0.5; }
</style>
